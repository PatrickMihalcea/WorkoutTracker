import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  GestureResponderEvent,
  LayoutChangeEvent,
  Platform,
} from 'react-native';
import Svg, { Line, Circle, Polyline, Text as SvgText } from 'react-native-svg';
import { colors, fonts, spacing } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';
import { isLightTheme } from '../../constants/themes';
import {
  TimeSeriesPoint,
  YAxisInfo,
  SCREEN_WIDTH,
  CHART_HEIGHT,
  SVG_HEIGHT,
  computeYAxisInfo,
  formatPointDate,
} from './chartUtils';
import { useChartInteraction } from './ChartInteractionContext';

export interface SimpleLineChartProps {
  data: TimeSeriesPoint[];
  title: string;
  subtitle: string;
  headerContent?: React.ReactNode;
  frontColor: string;
  formatTooltipValue: (value: number) => string;
  targetValue?: number;
  formatTargetTooltipValue?: (value: number) => string;
  targetLabel?: string;
  targetLineColor?: string;
  minYStep?: number;
  yLabelFormatter?: (value: number) => string;
}

function SectionTitle({ title, rightElement }: { title: string; rightElement?: React.ReactNode }) {
  const { colors: tc } = useTheme();
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={[styles.sectionTitle, { color: tc.text }]}>{title}</Text>
      {rightElement}
    </View>
  );
}

export function SimpleLineChart({
  data,
  title,
  subtitle,
  headerContent,
  frontColor,
  formatTooltipValue,
  targetValue,
  formatTargetTooltipValue,
  targetLabel = 'Target',
  targetLineColor = colors.textMuted,
  minYStep,
  yLabelFormatter,
}: SimpleLineChartProps) {
  const { onChartTouchStart, onChartTouchEnd, pointerActiveRef } = useChartInteraction();
  const { colors: tc, theme } = useTheme();
  const isLight = isLightTheme(theme);
  const chartStroke = isLight ? tc.textMuted : colors.border;
  const axisStrokeOpacity = isLight ? 0.42 : 1;
  const gridStrokeOpacity = isLight ? 0.34 : 0.7;
  const points = useMemo(() => data.filter((p) => p.value > 0), [data]);
  const hasTargetSeries = useMemo(
    () => points.some((point) => (point.target ?? 0) > 0),
    [points],
  );
  const hasConstantTarget = (targetValue ?? 0) > 0;

  const targetSeriesValues = useMemo(
    () => points.map((point) => point.target ?? 0).filter((value) => value > 0),
    [points],
  );

  const yAxisSource = useMemo(
    () => {
      if (hasTargetSeries) {
        return [...points, ...targetSeriesValues.map((value) => ({ value }))];
      }
      if (hasConstantTarget) {
        return [...points, { value: targetValue as number }];
      }
      return points;
    },
    [points, hasTargetSeries, targetSeriesValues, hasConstantTarget, targetValue],
  );
  const yMinStep = minYStep ?? 1;
  const [yAxis, setYAxis] = useState<YAxisInfo>(() => computeYAxisInfo(yAxisSource, yMinStep, yLabelFormatter));
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<{ date: string; value: string; target?: string; ptX: number; targetY?: number } | null>(null);
  const tooltipWidthRef = useRef(0);
  const [tooltipReady, setTooltipReady] = useState(false);

  const fixedYAxisWidth = 40;
  const estimatedWidth = SCREEN_WIDTH - 2 * spacing.sm - fixedYAxisWidth;
  const chartWidth = measuredWidth ?? estimatedWidth;

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const MOVE_THRESHOLD = 10;

  useEffect(() => {
    setYAxis(computeYAxisInfo(yAxisSource, yMinStep, yLabelFormatter));
  }, [yAxisSource, yMinStep, yLabelFormatter]);

  const padLeft = 16;
  const padRight = 16;
  const plotWidth = chartWidth - padLeft - padRight;

  const pointPositions = useMemo(() => {
    if (points.length <= 1) {
      return points.map(() => ({ x: padLeft + plotWidth / 2 }));
    }
    return points.map((_, i) => ({
      x: padLeft + (i / (points.length - 1)) * plotWidth,
    }));
  }, [points.length, plotWidth]);

  const pointYs = useMemo(() => {
    const range = yAxis.maxValue - yAxis.minValue;
    if (range <= 0) return points.map(() => CHART_HEIGHT);
    return points.map((p) => CHART_HEIGHT - ((p.value - yAxis.minValue) / range) * CHART_HEIGHT);
  }, [points, yAxis.maxValue, yAxis.minValue]);
  const targetSeriesPoints = useMemo(() => {
    const range = yAxis.maxValue - yAxis.minValue;
    return points.reduce<{ x: number; y: number }[]>((acc, point, index) => {
      const target = point.target ?? 0;
      if (target <= 0) return acc;
      const y = range <= 0 ? CHART_HEIGHT : CHART_HEIGHT - ((target - yAxis.minValue) / range) * CHART_HEIGHT;
      acc.push({ x: pointPositions[index].x, y });
      return acc;
    }, []);
  }, [points, pointPositions, yAxis.maxValue, yAxis.minValue]);
  const targetY = useMemo(() => {
    if (!hasConstantTarget || hasTargetSeries) return null;
    const range = yAxis.maxValue - yAxis.minValue;
    if (range <= 0) return CHART_HEIGHT;
    return CHART_HEIGHT - (((targetValue as number) - yAxis.minValue) / range) * CHART_HEIGHT;
  }, [hasConstantTarget, hasTargetSeries, targetValue, yAxis.maxValue, yAxis.minValue]);

  const targetPolylinePoints = useMemo(
    () => targetSeriesPoints.map((point) => `${point.x},${point.y}`).join(' '),
    [targetSeriesPoints],
  );

  const polylinePoints = useMemo(() => {
    return pointPositions.map((pos, i) => `${pos.x},${pointYs[i]}`).join(' ');
  }, [pointPositions, pointYs]);

  const xLabels = useMemo(() => {
    if (points.length === 0) return [];
    const labelCount = Math.min(4, points.length);
    const sectionWidth = plotWidth / 4;
    const labels: { x: number; text: string }[] = [];
    for (let i = 0; i < labelCount; i++) {
      const targetX = padLeft + sectionWidth * i;
      let closest = 0;
      let minDist = Math.abs(pointPositions[0].x - targetX);
      for (let j = 1; j < pointPositions.length; j++) {
        const dist = Math.abs(pointPositions[j].x - targetX);
        if (dist < minDist) { minDist = dist; closest = j; }
      }
      if (!labels.some((l) => l.x === pointPositions[closest].x)) {
        labels.push({
          x: pointPositions[closest].x,
          text: formatPointDate(points[closest].date),
        });
      }
    }
    return labels;
  }, [points, pointPositions, plotWidth]);

  const horizontalGridLines = useMemo(() => {
    const lines: number[] = [];
    for (let i = 1; i <= yAxis.sections; i++) {
      lines.push(CHART_HEIGHT - (i / yAxis.sections) * CHART_HEIGHT);
    }
    return lines;
  }, [yAxis.sections]);

  const dateRange = useMemo(() => {
    if (points.length === 0) return '';
    if (points.length === 1) return formatPointDate(points[0].date);
    return `${formatPointDate(points[0].date)} – ${formatPointDate(points[points.length - 1].date)}`;
  }, [points]);

  const findNearestPoint = useCallback((touchX: number) => {
    if (points.length === 0 || pointPositions.length === 0) return -1;
    let closest = 0;
    let minDist = Math.abs(touchX - pointPositions[0].x);
    for (let i = 1; i < pointPositions.length; i++) {
      const dist = Math.abs(touchX - pointPositions[i].x);
      if (dist < minDist) { minDist = dist; closest = i; }
    }
    return closest;
  }, [points, pointPositions]);

  const updateTooltip = useCallback((touchX: number) => {
    const idx = findNearestPoint(touchX);
    if (idx < 0) return;
    const pt = points[idx];
    const pointTarget = hasTargetSeries
      ? (pt.target ?? 0)
      : (hasConstantTarget ? (targetValue ?? 0) : 0);
    const targetPointY = pointTarget > 0
      ? (() => {
        const range = yAxis.maxValue - yAxis.minValue;
        if (range <= 0) return CHART_HEIGHT;
        return CHART_HEIGHT - ((pointTarget - yAxis.minValue) / range) * CHART_HEIGHT;
      })()
      : undefined;
    setActiveTooltip({
      date: formatPointDate(pt.date),
      value: formatTooltipValue(pt.value),
      target: pointTarget > 0
        ? `${targetLabel}: ${(formatTargetTooltipValue ?? formatTooltipValue)(pointTarget)}`
        : undefined,
      ptX: pointPositions[idx].x,
      targetY: targetPointY,
    });
  }, [
    findNearestPoint,
    points,
    pointPositions,
    formatTooltipValue,
    hasTargetSeries,
    hasConstantTarget,
    targetLabel,
    formatTargetTooltipValue,
    targetValue,
    yAxis.maxValue,
    yAxis.minValue,
  ]);

  const handleTouchStart = useCallback((e: GestureResponderEvent) => {
    const { pageX, pageY } = e.nativeEvent;
    touchStartRef.current = { x: pageX, y: pageY, time: Date.now() };
    longPressTimerRef.current = setTimeout(() => {
      pointerActiveRef.current = true;
      onChartTouchStart();
      const localX = pageX - (SCREEN_WIDTH - chartWidth - fixedYAxisWidth) / 2 - fixedYAxisWidth;
      updateTooltip(localX);
    }, 300);
  }, [chartWidth, onChartTouchStart, pointerActiveRef, updateTooltip]);

  const handleTouchMove = useCallback((e: GestureResponderEvent) => {
    const { pageX, pageY } = e.nativeEvent;
    const start = touchStartRef.current;
    if (start && !pointerActiveRef.current) {
      const dx = Math.abs(pageX - start.x);
      const dy = Math.abs(pageY - start.y);
      if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
        if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; }
      }
    }
    if (pointerActiveRef.current) {
      const localX = pageX - (SCREEN_WIDTH - chartWidth - fixedYAxisWidth) / 2 - fixedYAxisWidth;
      updateTooltip(localX);
    }
  }, [chartWidth, pointerActiveRef, updateTooltip]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; }
    if (pointerActiveRef.current) {
      pointerActiveRef.current = false;
      onChartTouchEnd();
      setActiveTooltip(null);
      tooltipWidthRef.current = 0;
      setTooltipReady(false);
    }
  }, [pointerActiveRef, onChartTouchEnd]);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setMeasuredWidth(e.nativeEvent.layout.width);
  }, []);

  const shouldCaptureChartGesture = useCallback(() => Platform.OS === 'android', []);

  if (points.length === 0) return null;

  return (
    <View style={[styles.chartSection, !title && styles.chartSectionCompact]}>
      {title ? <SectionTitle title={title} /> : null}
      {headerContent}
      <View style={styles.chartHeaderArea}>
        <View style={{ opacity: (activeTooltip && tooltipReady) ? 0 : 1 }}>
          <Text style={[styles.dateRangeText, { color: tc.textSecondary }]}>{dateRange}</Text>
          <Text style={[styles.chartSubtitle, { color: tc.textMuted }]}>{subtitle}</Text>
        </View>
        {activeTooltip && (() => {
          const tw = tooltipWidthRef.current;
          const screenX = activeTooltip.ptX + fixedYAxisWidth;
          const sectionWidth = chartWidth + fixedYAxisWidth;
          const clampedLeft = tw > 0
            ? Math.max(0, Math.min(sectionWidth - tw, screenX - tw / 2))
            : 0;
          return (
            <View
              style={[styles.tooltipBubble, { left: clampedLeft, opacity: tooltipReady ? 1 : 0 }]}
              onLayout={(ev) => {
                const w = ev.nativeEvent.layout.width;
                if (Math.abs(w - tooltipWidthRef.current) > 1) {
                  tooltipWidthRef.current = w;
                  setTooltipReady(true);
                } else if (!tooltipReady) {
                  setTooltipReady(true);
                }
              }}
            >
              <Text style={[styles.tooltipValue, { color: tc.text }]} numberOfLines={1}>{activeTooltip.value}</Text>
              {activeTooltip.target ? (
                <Text style={[styles.tooltipTarget, { color: tc.textSecondary }]} numberOfLines={1}>{activeTooltip.target}</Text>
              ) : null}
              <Text style={[styles.tooltipDate, { color: tc.textMuted }]} numberOfLines={1}>{activeTooltip.date}</Text>
            </View>
          );
        })()}
      </View>
      <View style={styles.chartRow}>
        <View style={[styles.yAxisColumn, { width: fixedYAxisWidth, height: SVG_HEIGHT }]}>
          {[...yAxis.labels].reverse().map((label, i) => (
            <Text key={i} style={[styles.yAxisLabel, { color: tc.textMuted }]}>{label}</Text>
          ))}
        </View>
        <View
          style={styles.chartScroll}
          onStartShouldSetResponderCapture={shouldCaptureChartGesture}
          onMoveShouldSetResponderCapture={shouldCaptureChartGesture}
          onLayout={handleLayout}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          <Svg width={chartWidth} height={SVG_HEIGHT}>
            <Line
              x1={0} y1={CHART_HEIGHT} x2={chartWidth} y2={CHART_HEIGHT}
              stroke={chartStroke} strokeWidth={1} opacity={axisStrokeOpacity}
            />
            {horizontalGridLines.map((y, i) => (
              <Line
                key={`hg-${i}`}
                x1={0} y1={y} x2={chartWidth} y2={y}
                stroke={chartStroke} strokeWidth={0.8} strokeDasharray="3 3" opacity={gridStrokeOpacity}
              />
            ))}
            {points.length > 1 && (
              <Polyline
                points={polylinePoints}
                fill="none"
                stroke={frontColor}
                strokeWidth={2}
              />
            )}
            {targetSeriesPoints.length > 1 && (
              <Polyline
                points={targetPolylinePoints}
                fill="none"
                stroke={targetLineColor}
                strokeWidth={1.5}
                strokeDasharray="5 4"
                opacity={0.9}
              />
            )}
            {activeTooltip?.targetY != null && (
              <Circle
                cx={activeTooltip.ptX}
                cy={activeTooltip.targetY}
                r={3.2}
                fill={targetLineColor}
              />
            )}
            {targetY !== null && (
              <Line
                x1={padLeft}
                y1={targetY}
                x2={padLeft + plotWidth}
                y2={targetY}
                stroke={targetLineColor}
                strokeWidth={1.5}
                strokeDasharray="5 4"
                opacity={0.9}
              />
            )}
            {pointPositions.map((pos, i) => (
              <Circle
                key={i}
                cx={pos.x}
                cy={pointYs[i]}
                r={4}
                fill={frontColor}
              />
            ))}
            {activeTooltip && (
              <Line
                x1={activeTooltip.ptX} y1={0}
                x2={activeTooltip.ptX} y2={CHART_HEIGHT}
                stroke={chartStroke} strokeWidth={1} opacity={axisStrokeOpacity}
              />
            )}
            {xLabels.map((lbl, i) => (
              <SvgText
                key={i}
                x={lbl.x}
                y={CHART_HEIGHT + 14}
                fontSize={10}
                fill={tc.textMuted}
                textAnchor="middle"
                fontFamily={fonts.regular}
              >
                {lbl.text}
              </SvgText>
            ))}
          </Svg>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartSection: {
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  chartSectionCompact: {
    paddingTop: 0,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  chartHeaderArea: {
    minHeight: 34,
    marginBottom: spacing.xs,
    position: 'relative',
  },
  dateRangeText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  chartSubtitle: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
  tooltipBubble: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    paddingVertical: 2,
  },
  tooltipValue: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  tooltipTarget: {
    fontSize: 10,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginTop: 1,
  },
  tooltipDate: {
    fontSize: 10,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginLeft: -4,
  },
  yAxisColumn: {
    justifyContent: 'space-between',
    paddingBottom: 22,
    paddingTop: 2,
  },
  yAxisLabel: {
    fontSize: 10,
    fontFamily: fonts.light,
    color: colors.textMuted,
    textAlign: 'right',
    paddingRight: 2,
  },
  chartScroll: {
    flex: 1,
  },
});
