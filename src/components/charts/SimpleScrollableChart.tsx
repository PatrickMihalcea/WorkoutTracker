import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
  GestureResponderEvent,
  LayoutChangeEvent,
} from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { colors, fonts, spacing } from '../../constants';
import {
  TimeSeriesPoint,
  GranularityMode,
  YAxisInfo,
  SCREEN_WIDTH,
  CHART_HEIGHT,
  SVG_HEIGHT,
  LONG_PRESS_MS,
  MONTH_NAMES,
  computeYAxisInfo,
  computePointSpacing,
  viewportPoints,
  totalSlotsForRange,
  slotIndexForPoint,
  slotToXLabel,
  xLabelInterval,
  formatKeyDate,
} from './chartUtils';
import { useChartInteraction } from './ChartInteractionContext';

export interface SimpleScrollableChartProps {
  data: TimeSeriesPoint[];
  mode: GranularityMode;
  weeks: number;
  title: string;
  subtitle: string;
  headerContent?: React.ReactNode;
  frontColor: string;
  formatTooltipValue: (value: number) => string;
  minYStep?: number;
}

function SectionTitle({ title, rightElement }: { title: string; rightElement?: React.ReactNode }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {rightElement}
    </View>
  );
}

export function SimpleScrollableChart({
  data,
  mode,
  weeks,
  title,
  subtitle,
  headerContent,
  frontColor,
  formatTooltipValue,
  minYStep,
}: SimpleScrollableChartProps) {
  const { onChartTouchStart, onChartTouchEnd, pointerActiveRef, scrollEnabled } = useChartInteraction();
  const vp = viewportPoints(mode);
  const yMinStep = minYStep ?? 1;
  const slots = totalSlotsForRange(weeks, mode);

  const [yAxis, setYAxis] = useState<YAxisInfo>(() =>
    computeYAxisInfo(data.slice(Math.max(0, data.length - vp)), yMinStep),
  );
  const [dateRange, setDateRange] = useState('');
  const [activeTooltip, setActiveTooltip] = useState<{ date: string; value: string; slotX: number } | null>(null);
  const tooltipWidthRef = useRef(0);
  const [tooltipReady, setTooltipReady] = useState(false);
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);

  const fixedYAxisWidth = 40;
  const estimatedWidth = SCREEN_WIDTH - 2 * spacing.sm - fixedYAxisWidth;
  const chartWidth = measuredWidth ?? estimatedWidth;
  const slotWidth = computePointSpacing(mode, chartWidth);
  const barWidth = Math.max(4, slotWidth - 4);
  const totalContentWidth = slots * slotWidth;

  const scrollOffsetRef = useRef(0);
  const scrollRef = useRef<ScrollView>(null);
  const rightmostKeyRef = useRef<string | null>(null);
  const prevDataRef = useRef(data);
  const prevModeRef = useRef(mode);
  const mountedRef = useRef(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const now = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const slotIndices = useMemo(
    () => data.map((pt) => slotIndexForPoint(pt, now, slots, mode)),
    [data, now, slots, mode],
  );

  const slotToDateStr = useCallback(
    (slotIdx: number): string => {
      const msPerDay = 86400000;
      let ts: number;
      if (mode === 'Y') {
        const end = new Date(now);
        const d = new Date(end.getFullYear(), end.getMonth() - (slots - 1 - slotIdx), 1);
        ts = d.getTime();
      } else if (mode === '6M' || mode === '3M') {
        ts = now - (slots - 1 - slotIdx) * 7 * msPerDay;
      } else {
        ts = now - (slots - 1 - slotIdx) * msPerDay;
      }
      const d = new Date(ts);
      return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    },
    [now, slots, mode],
  );

  const slotToDate = useCallback(
    (slotIdx: number): Date => {
      const msPerDay = 86400000;
      if (mode === 'Y') {
        const end = new Date(now);
        return new Date(end.getFullYear(), end.getMonth() - (slots - 1 - slotIdx), 1);
      } else if (mode === '6M' || mode === '3M') {
        return new Date(now - (slots - 1 - slotIdx) * 7 * msPerDay);
      }
      return new Date(now - (slots - 1 - slotIdx) * msPerDay);
    },
    [now, slots, mode],
  );

  const updateHeaderForOffset = useCallback(
    (ox: number) => {
      const startSlot = Math.max(0, Math.min(slots - 1, Math.round(ox / slotWidth)));
      const visibleSlots = Math.floor(chartWidth / slotWidth);
      const endSlot = Math.min(slots - 1, startSlot + visibleSlots - 1);

      const startDate = slotToDate(startSlot);
      const endDate = slotToDate(endSlot);

      const sDay = startDate.getDate();
      const sMonth = startDate.getMonth();
      const sYear = startDate.getFullYear();
      const eDay = endDate.getDate();
      const eMonth = endDate.getMonth();
      const eYear = endDate.getFullYear();

      const lastDayOfMonth = new Date(sYear, sMonth + 1, 0).getDate();
      if (sDay === 1 && eDay === lastDayOfMonth && sMonth === eMonth && sYear === eYear) {
        setDateRange(`${MONTH_NAMES[sMonth]} ${sYear}`);
      } else {
        setDateRange(`${slotToDateStr(startSlot)} – ${slotToDateStr(endSlot)}`);
      }
    },
    [slots, slotWidth, chartWidth, slotToDate, slotToDateStr],
  );

  const handleChartLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setMeasuredWidth((prev) => {
      if (prev !== null && Math.abs(prev - w) < 1) return prev;
      return w;
    });
  }, []);

  const scrollToPresent = useCallback(() => {
    const scrollX = Math.max(0, totalContentWidth - chartWidth);
    scrollOffsetRef.current = scrollX;
    scrollRef.current?.scrollTo({ x: scrollX, animated: false });
    updateHeaderForOffset(scrollX);
    const startSlot = Math.max(0, Math.floor(scrollX / slotWidth));
    const endSlot = Math.min(slots - 1, startSlot + vp - 1);
    const visible = data.filter((_, i) => {
      const s = slotIndices[i];
      return s >= startSlot && s <= endSlot;
    });
    if (visible.length > 0) setYAxis(computeYAxisInfo(visible, yMinStep));
  }, [totalContentWidth, chartWidth, updateHeaderForOffset, slotWidth, slots, vp, data, slotIndices, yMinStep]);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      scrollToPresent();
      return;
    }
    const dataChanged = data !== prevDataRef.current;
    const modeChanged = mode !== prevModeRef.current;
    prevDataRef.current = data;
    prevModeRef.current = mode;

    if (!dataChanged && !modeChanged) return;

    const anchor = rightmostKeyRef.current;
    let scrollX: number;
    if (anchor && data.length > 0) {
      const found = data.findIndex((d) => d.key >= anchor);
      const anchorIdx = found !== -1 ? found : data.length - 1;
      const anchorSlot = slotIndices[anchorIdx] ?? (slots - 1);
      scrollX = Math.max(0, (anchorSlot - vp + 1) * slotWidth);
    } else {
      scrollX = Math.max(0, totalContentWidth - chartWidth);
    }

    scrollOffsetRef.current = scrollX;
    scrollRef.current?.scrollTo({ x: scrollX, animated: false });
    updateHeaderForOffset(scrollX);

    const startSlot = Math.max(0, Math.floor(scrollX / slotWidth));
    const endSlot = Math.min(slots - 1, startSlot + vp - 1);
    const visible = data.filter((_, i) => {
      const s = slotIndices[i];
      return s >= startSlot && s <= endSlot;
    });
    if (visible.length > 0) setYAxis(computeYAxisInfo(visible, yMinStep));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, mode]);

  useEffect(() => {
    if (measuredWidth !== null && mountedRef.current) {
      scrollToPresent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measuredWidth]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const ox = e.nativeEvent.contentOffset.x;
      scrollOffsetRef.current = ox;
      const endSlot = Math.min(slots - 1, Math.floor(ox / slotWidth) + vp - 1);
      if (data.length > 0) {
        let nearestIdx = data.length - 1;
        for (let i = data.length - 1; i >= 0; i--) {
          if (slotIndices[i] <= endSlot) { nearestIdx = i; break; }
        }
        rightmostKeyRef.current = data[nearestIdx]?.key ?? null;
      }
      updateHeaderForOffset(ox);
    },
    [data, slotIndices, slots, slotWidth, vp, updateHeaderForOffset],
  );

  const handleScrollEnd = useCallback(() => {
    if (!flingActiveRef.current) flingPageIdx.current = -1;
    const ox = scrollOffsetRef.current;
    const startSlot = Math.max(0, Math.floor(ox / slotWidth));
    const endSlot = Math.min(slots - 1, startSlot + vp - 1);
    const visible = data.filter((_, i) => {
      const s = slotIndices[i];
      return s >= startSlot && s <= endSlot;
    });
    if (visible.length > 0) setYAxis(computeYAxisInfo(visible, yMinStep));
  }, [data, slotIndices, slots, slotWidth, vp, yMinStep]);

  const MOVE_THRESHOLD = 10;
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTouchXRef = useRef(0);
  const flingActiveRef = useRef(false);
  const flingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flingPageIdx = useRef(-1);
  const [snapInterval, setSnapInterval] = useState(slotWidth);

  useEffect(() => {
    if (!flingActiveRef.current) setSnapInterval(slotWidth);
  }, [slotWidth]);

  const findNearestBar = useCallback(
    (pageX: number) => {
      const ox = scrollOffsetRef.current;
      const touchSlot = Math.round((ox + pageX - spacing.sm - fixedYAxisWidth) / slotWidth);
      let bestIdx = -1;
      let bestDist = Infinity;
      for (let i = 0; i < slotIndices.length; i++) {
        const dist = Math.abs(slotIndices[i] - touchSlot);
        if (dist < bestDist) { bestDist = dist; bestIdx = i; }
      }
      if (bestIdx >= 0 && bestDist <= 2) return bestIdx;
      return -1;
    },
    [slotIndices, slotWidth],
  );

  const showTooltipAt = useCallback(
    (pageX: number) => {
      const idx = findNearestBar(pageX);
      if (idx >= 0) {
        const pt = data[idx];
        const si = slotIndices[idx];
        setActiveTooltip({
          date: formatKeyDate(pt.key, mode),
          value: formatTooltipValue(pt.value),
          slotX: si * slotWidth + slotWidth / 2,
        });
      }
    },
    [findNearestBar, data, slotIndices, slotWidth, mode, formatTooltipValue],
  );

  const activateTooltipMode = useCallback(
    (pageX: number) => {
      pointerActiveRef.current = true;
      onChartTouchStart();
      showTooltipAt(pageX);
    },
    [pointerActiveRef, onChartTouchStart, showTooltipAt],
  );

  const handleTouchStart = useCallback(
    (e: GestureResponderEvent) => {
      const { pageX, pageY } = e.nativeEvent;
      touchStartRef.current = { x: pageX, y: pageY, time: Date.now() };
      lastTouchXRef.current = pageX;
      longPressTimerRef.current = setTimeout(() => {
        if (touchStartRef.current) activateTooltipMode(pageX);
      }, LONG_PRESS_MS);
    },
    [activateTooltipMode],
  );

  const handleTouchMove = useCallback(
    (e: GestureResponderEvent) => {
      const { pageX, pageY } = e.nativeEvent;
      lastTouchXRef.current = pageX;

      if (pointerActiveRef.current) {
        showTooltipAt(pageX);
        return;
      }

      if (touchStartRef.current && longPressTimerRef.current) {
        const dx = Math.abs(pageX - touchStartRef.current.x);
        const dy = Math.abs(pageY - touchStartRef.current.y);
        if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }
    },
    [pointerActiveRef, showTooltipAt],
  );

  const pageBoundarySlots = useMemo(() => {
    const boundaries: number[] = [];
    const msPerDay = 86400000;
    for (let s = 0; s < slots; s++) {
      if (mode === 'W') {
        const ts = now - (slots - 1 - s) * msPerDay;
        const d = new Date(ts);
        if (d.getDay() === 1) boundaries.push(s);
      } else if (mode === 'M') {
        const ts = now - (slots - 1 - s) * msPerDay;
        const d = new Date(ts);
        if (d.getDate() === 1) boundaries.push(s);
      } else if (mode === '3M') {
        const ts = now - (slots - 1 - s) * 7 * msPerDay;
        const d = new Date(ts);
        const prevTs = now - (slots - s) * 7 * msPerDay;
        const prev = new Date(prevTs);
        if (prev.getMonth() !== d.getMonth()) boundaries.push(s);
      } else if (mode === '6M') {
        const ts = now - (slots - 1 - s) * 7 * msPerDay;
        const d = new Date(ts);
        const m = d.getMonth();
        const prevTs = now - (slots - s) * 7 * msPerDay;
        const prev = new Date(prevTs);
        if (prev.getMonth() !== m && (m === 0 || m === 6)) boundaries.push(s);
      } else {
        const end = new Date(now);
        const d = new Date(end.getFullYear(), end.getMonth() - (slots - 1 - s), 1);
        if (d.getMonth() === 0) boundaries.push(s);
      }
    }
    if (boundaries.length === 0 || boundaries[0] !== 0) boundaries.unshift(0);
    return boundaries;
  }, [slots, now, mode]);

  const handleFling = useCallback(
    (dx: number, pages: number) => {
      if (pageBoundarySlots.length === 0) return;
      const ox = scrollOffsetRef.current;
      const currentStartSlot = Math.round(ox / slotWidth);

      let baseIdx = -1;
      if (dx < 0) {
        for (let i = 0; i < pageBoundarySlots.length; i++) {
          if (pageBoundarySlots[i] > currentStartSlot + 1) { baseIdx = i; break; }
        }
        if (baseIdx < 0) baseIdx = pageBoundarySlots.length - 1;
        baseIdx = Math.min(pageBoundarySlots.length - 1, baseIdx + pages - 1);
      } else {
        for (let i = pageBoundarySlots.length - 1; i >= 0; i--) {
          if (pageBoundarySlots[i] < currentStartSlot - 1) { baseIdx = i; break; }
        }
        if (baseIdx < 0) baseIdx = 0;
        baseIdx = Math.max(0, baseIdx - (pages - 1));
      }

      const targetSlot = pageBoundarySlots[baseIdx];
      const targetX = Math.max(0, Math.min(totalContentWidth - chartWidth, targetSlot * slotWidth));

      flingActiveRef.current = true;
      setSnapInterval(0);
      scrollRef.current?.scrollTo({ x: targetX, animated: true });
      scrollOffsetRef.current = targetX;
      updateHeaderForOffset(targetX);

      const startSlot = Math.max(0, Math.floor(targetX / slotWidth));
      const endSlot = Math.min(slots - 1, startSlot + vp - 1);
      const visible = data.filter((_, i) => {
        const s = slotIndices[i];
        return s >= startSlot && s <= endSlot;
      });
      if (visible.length > 0) setYAxis(computeYAxisInfo(visible, yMinStep));

      if (flingTimerRef.current) clearTimeout(flingTimerRef.current);
      flingTimerRef.current = setTimeout(() => {
        flingActiveRef.current = false;
        setSnapInterval(slotWidth);
        scrollRef.current?.scrollTo({ x: targetX, animated: false });
      }, 400);
    },
    [pageBoundarySlots, slotWidth, totalContentWidth, chartWidth, updateHeaderForOffset, slots, vp, data, slotIndices, yMinStep],
  );

  const handleTouchEnd = useCallback(
    (e: GestureResponderEvent) => {
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; }
      if (pointerActiveRef.current) {
        pointerActiveRef.current = false;
        onChartTouchEnd();
        setActiveTooltip(null);
        tooltipWidthRef.current = 0;
        setTooltipReady(false);
        return;
      }

      if (start) {
        const endX = e.nativeEvent?.pageX ?? lastTouchXRef.current;
        const dx = endX - start.x;
        const absDx = Math.abs(dx);
        const dt = Date.now() - start.time;
        if (absDx > 30 && dt < 200) {
          const pages = absDx >= 90 ? 2 : 1;
          handleFling(dx, pages);
        }
      }
    },
    [pointerActiveRef, onChartTouchEnd, handleFling],
  );

  const labelInterval = xLabelInterval(mode);

  const xLabels = useMemo(() => {
    const labels: { x: number; text: string }[] = [];
    for (let s = 0; s < slots; s += labelInterval) {
      const text = slotToXLabel(s, slots, now, mode);
      if (text) labels.push({ x: s * slotWidth + slotWidth / 2, text });
    }
    return labels;
  }, [slots, labelInterval, slotWidth, now, mode]);

  const verticalGridLines = useMemo(() => {
    const lines: number[] = [];
    const msPerDay = 86400000;
    for (let s = 0; s < slots; s++) {
      if (mode === 'W') {
        lines.push(s * slotWidth);
      } else if (mode === 'M') {
        const ts = now - (slots - 1 - s) * msPerDay;
        const d = new Date(ts);
        if (d.getDay() === 1) lines.push(s * slotWidth);
      } else if (mode === '3M') {
        const ts = now - (slots - 1 - s) * 7 * msPerDay;
        const d = new Date(ts);
        const prevTs = now - (slots - s) * 7 * msPerDay;
        const prev = new Date(prevTs);
        if (prev.getMonth() !== d.getMonth()) lines.push(s * slotWidth);
      } else if (mode === '6M') {
        const ts = now - (slots - 1 - s) * 7 * msPerDay;
        const d = new Date(ts);
        const prevTs = now - (slots - s) * 7 * msPerDay;
        const prev = new Date(prevTs);
        if (prev.getMonth() !== d.getMonth()) lines.push(s * slotWidth);
      } else {
        lines.push(s * slotWidth);
      }
    }
    return lines;
  }, [slots, slotWidth, now, mode]);

  const horizontalGridLines = useMemo(() => {
    const lines: number[] = [];
    for (let i = 1; i <= yAxis.sections; i++) {
      lines.push(CHART_HEIGHT - (i / yAxis.sections) * CHART_HEIGHT);
    }
    return lines;
  }, [yAxis.sections]);

  const pageBoundaryXSet = useMemo(
    () => new Set(pageBoundarySlots.map((s) => s * slotWidth)),
    [pageBoundarySlots, slotWidth],
  );

  const pageBoundaryLines = useMemo(
    () => pageBoundarySlots.map((s) => s * slotWidth),
    [pageBoundarySlots, slotWidth],
  );

  const filteredVerticalGridLines = useMemo(
    () => verticalGridLines.filter((x) => !pageBoundaryXSet.has(x)),
    [verticalGridLines, pageBoundaryXSet],
  );

  const bars = useMemo(() => {
    const range = yAxis.maxValue - yAxis.minValue;
    if (range <= 0) return [];
    return data.map((pt, i) => {
      const si = slotIndices[i];
      const barH = Math.max(0, ((pt.value - yAxis.minValue) / range) * CHART_HEIGHT);
      const x = si * slotWidth + (slotWidth - barWidth) / 2;
      return { x, y: CHART_HEIGHT - barH, width: barWidth, height: barH, key: pt.key };
    });
  }, [data, slotIndices, slotWidth, barWidth, yAxis.maxValue, yAxis.minValue]);

  const shouldCaptureChartGesture = useCallback(() => Platform.OS === 'android', []);

  return (
    <View style={[styles.chartSection, !title && styles.chartSectionCompact]}>
      {title ? <SectionTitle title={title} /> : null}
      {headerContent}
      <View style={styles.chartHeaderArea}>
        <View style={{ opacity: (activeTooltip && tooltipReady) ? 0 : 1 }}>
          <Text style={styles.dateRangeText}>{dateRange}</Text>
          <Text style={styles.chartSubtitle}>{subtitle}</Text>
        </View>
        {activeTooltip && (() => {
          const tw = tooltipWidthRef.current;
          const screenX = activeTooltip.slotX - scrollOffsetRef.current + fixedYAxisWidth;
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
              <Text style={styles.tooltipValue} numberOfLines={1}>{activeTooltip.value}</Text>
              <Text style={styles.tooltipDate} numberOfLines={1}>{activeTooltip.date}</Text>
            </View>
          );
        })()}
      </View>
      <View style={styles.chartRow}>
          <View style={[styles.yAxisColumn, { width: fixedYAxisWidth, height: SVG_HEIGHT }]}>
            {[...yAxis.labels].reverse().map((label, i) => (
              <Text key={i} style={styles.yAxisLabel}>{label}</Text>
            ))}
          </View>
          <ScrollView
            ref={scrollRef}
            horizontal
            onStartShouldSetResponderCapture={shouldCaptureChartGesture}
            onMoveShouldSetResponderCapture={shouldCaptureChartGesture}
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onMomentumScrollEnd={handleScrollEnd}
            onScrollEndDrag={handleScrollEnd}
            snapToInterval={snapInterval || undefined}
            decelerationRate="fast"
            scrollEnabled={scrollEnabled}
            onLayout={handleChartLayout}
            style={styles.chartScroll}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            <Svg width={totalContentWidth} height={SVG_HEIGHT}>
              <Line
                x1={0} y1={CHART_HEIGHT} x2={totalContentWidth} y2={CHART_HEIGHT}
                stroke={colors.border} strokeWidth={1}
              />
              {horizontalGridLines.map((y, i) => (
                <Line
                  key={`hg-${i}`}
                  x1={0} y1={y} x2={totalContentWidth} y2={y}
                  stroke={colors.border} strokeWidth={0.8} strokeDasharray="3 3" opacity={0.7}
                />
              ))}
              {filteredVerticalGridLines.map((x, i) => (
                <Line
                  key={`vg-${i}`}
                  x1={x} y1={0} x2={x} y2={CHART_HEIGHT}
                  stroke={colors.border} strokeWidth={0.8} strokeDasharray="3 3" opacity={0.7}
                />
              ))}
              {pageBoundaryLines.map((x, i) => (
                <Line
                  key={`pb-${i}`}
                  x1={x} y1={0} x2={x} y2={CHART_HEIGHT}
                  stroke={colors.border} strokeWidth={1} opacity={0.9}
                />
              ))}
              {bars.map((b) => (
                <Rect
                  key={b.key}
                  x={b.x}
                  y={b.y}
                  width={b.width}
                  height={b.height}
                  fill={frontColor}
                  rx={3}
                  ry={3}
                />
              ))}
              {activeTooltip && (
                <Line
                  x1={activeTooltip.slotX} y1={0}
                  x2={activeTooltip.slotX} y2={CHART_HEIGHT}
                  stroke={colors.border} strokeWidth={1}
                />
              )}
              {xLabels.map((lbl, i) => (
                <SvgText
                  key={i}
                  x={lbl.x}
                  y={CHART_HEIGHT + 14}
                  fontSize={10}
                  fill={colors.textMuted}
                  textAnchor="middle"
                  fontFamily={fonts.regular}
                >
                  {lbl.text}
                </SvgText>
              ))}
            </Svg>
          </ScrollView>
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
