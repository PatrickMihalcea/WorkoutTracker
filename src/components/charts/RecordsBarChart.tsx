import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  LayoutChangeEvent,
} from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { colors, fonts, spacing } from '../../constants';
import { Card } from '../ui/Card';
import { computeYAxisInfo, CHART_HEIGHT, SVG_HEIGHT, YAxisInfo } from './chartUtils';

export interface BarDataItem {
  label: string;
  value: number;
  formattedValue?: string;
}

interface RecordsBarChartProps {
  title: string;
  subtitle: string;
  data: BarDataItem[];
  frontColor?: string;
  toggleOptions?: { left: string; right: string };
  toggleValue?: 'left' | 'right';
  onToggle?: (value: 'left' | 'right') => void;
}

const Y_AXIS_WIDTH = 40;
const MIN_BAR_WIDTH = 24;
const MAX_BAR_WIDTH = 48;
const BAR_GAP = 6;

export function RecordsBarChart({
  title,
  subtitle,
  data,
  frontColor = '#FFEAA7',
  toggleOptions,
  toggleValue = 'left',
  onToggle,
}: RecordsBarChartProps) {
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setMeasuredWidth(e.nativeEvent.layout.width);
  }, []);

  const chartAreaWidth = (measuredWidth ?? 280) - Y_AXIS_WIDTH;
  const naturalBarWidth = data.length > 0
    ? Math.max(MIN_BAR_WIDTH, Math.min(MAX_BAR_WIDTH, (chartAreaWidth - BAR_GAP * (data.length + 1)) / data.length))
    : MIN_BAR_WIDTH;
  const barWidth = naturalBarWidth;
  const slotWidth = barWidth + BAR_GAP;
  const totalContentWidth = Math.max(chartAreaWidth, data.length * slotWidth + BAR_GAP);
  const needsScroll = totalContentWidth > chartAreaWidth;

  const fakePoints = useMemo(
    () => data.map((d) => ({ key: d.label, label: d.label, value: d.value, date: 0 })),
    [data],
  );
  const [yAxis, setYAxis] = useState<YAxisInfo>(() => computeYAxisInfo(fakePoints, 1));

  useMemo(() => {
    if (fakePoints.length > 0) setYAxis(computeYAxisInfo(fakePoints, 1));
  }, [fakePoints]);

  const range = yAxis.maxValue - yAxis.minValue;

  const bars = useMemo(() => {
    if (range <= 0) return [];
    const offsetX = needsScroll ? BAR_GAP : (chartAreaWidth - data.length * slotWidth) / 2 + BAR_GAP;
    return data.map((d, i) => {
      const barH = Math.max(0, ((d.value - yAxis.minValue) / range) * CHART_HEIGHT);
      const x = offsetX + i * slotWidth;
      return {
        x,
        y: CHART_HEIGHT - barH,
        width: barWidth,
        height: barH,
        label: d.label,
        formattedValue: d.formattedValue ?? String(d.value),
      };
    });
  }, [data, range, barWidth, slotWidth, chartAreaWidth, yAxis.minValue, needsScroll]);

  const horizontalGridLines = useMemo(() => {
    const lines: number[] = [];
    for (let i = 1; i <= yAxis.sections; i++) {
      lines.push(CHART_HEIGHT - (i / yAxis.sections) * CHART_HEIGHT);
    }
    return lines;
  }, [yAxis.sections]);

  if (data.length === 0) return null;

  const svgContent = (
    <Svg width={totalContentWidth} height={SVG_HEIGHT}>
      <Line x1={0} y1={CHART_HEIGHT} x2={totalContentWidth} y2={CHART_HEIGHT} stroke={colors.border} strokeWidth={1} />
      {horizontalGridLines.map((y, i) => (
        <Line key={`hg-${i}`} x1={0} y1={y} x2={totalContentWidth} y2={y} stroke={colors.border} strokeWidth={0.8} strokeDasharray="3 3" opacity={0.7} />
      ))}
      {bars.map((b, i) => (
        <React.Fragment key={i}>
          <Rect x={b.x} y={b.y} width={b.width} height={b.height} fill={frontColor} rx={3} ry={3} />
          {b.height > 0 && (
            <SvgText
              x={b.x + b.width / 2}
              y={b.y - 4}
              fontSize={9}
              fill={colors.textSecondary}
              textAnchor="middle"
              fontFamily={fonts.semiBold}
            >
              {b.formattedValue}
            </SvgText>
          )}
          <SvgText
            x={b.x + b.width / 2}
            y={CHART_HEIGHT + 14}
            fontSize={10}
            fill={colors.textMuted}
            textAnchor="middle"
            fontFamily={fonts.regular}
          >
            {b.label}
          </SvgText>
        </React.Fragment>
      ))}
    </Svg>
  );

  return (
    <Card style={cardStyles.card}>
      <Text style={cardStyles.title}>{title}</Text>
      {toggleOptions && onToggle ? (
        <View style={cardStyles.toggleRow}>
          <Text style={cardStyles.subtitle}>{subtitle}</Text>
          <View style={cardStyles.toggleContainer}>
            <TouchableOpacity
              style={[cardStyles.toggleBtn, toggleValue === 'left' && cardStyles.toggleBtnActive]}
              onPress={() => onToggle('left')}
              activeOpacity={0.7}
            >
              <Text style={[cardStyles.toggleText, toggleValue === 'left' && cardStyles.toggleTextActive]}>
                {toggleOptions.left}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[cardStyles.toggleBtn, toggleValue === 'right' && cardStyles.toggleBtnActive]}
              onPress={() => onToggle('right')}
              activeOpacity={0.7}
            >
              <Text style={[cardStyles.toggleText, toggleValue === 'right' && cardStyles.toggleTextActive]}>
                {toggleOptions.right}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Text style={cardStyles.subtitle}>{subtitle}</Text>
      )}
      <View style={cardStyles.chartRow} onLayout={handleLayout}>
        <View style={[cardStyles.yAxisColumn, { width: Y_AXIS_WIDTH, height: SVG_HEIGHT }]}>
          {[...yAxis.labels].reverse().map((label, i) => (
            <Text key={i} style={cardStyles.yAxisLabel}>{label}</Text>
          ))}
        </View>
        {needsScroll ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={cardStyles.chartScroll}>
            {svgContent}
          </ScrollView>
        ) : (
          <View style={cardStyles.chartScroll}>
            {svgContent}
          </View>
        )}
      </View>
    </Card>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: colors.surfaceLight,
  },
  toggleBtnActive: {
    backgroundColor: colors.text,
  },
  toggleText: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.textMuted,
  },
  toggleTextActive: {
    color: colors.background,
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
