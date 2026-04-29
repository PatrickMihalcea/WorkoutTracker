import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { fonts, spacing } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';
import type { ThemeColors } from '../../constants/themes';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export interface MonthCalendar {
  key: string;
  label: string;
  cells: Array<string | null>;
}

export interface WeekRow {
  key: string;
  monthKey: string;
  dayKeys: Array<string | null>;
}

const MS_PER_DAY = 86400000;
const ALL_RANGE_START = new Date(2016, 0, 1);
const CELL_GAP = 2;
const DAY_CELL_HEIGHT = 20;
const DAY_CELL_HEIGHT_COMPACT = 16;
const DAY_CELL_HEIGHT_TALL = 24;

function useActivityCalendarStyles() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return { styles };
}

function useScrollViewStartAtEnd(autoScrollToEndKey?: string) {
  const scrollViewRef = useRef<ScrollView | null>(null);
  const [isReady, setIsReady] = useState(!autoScrollToEndKey);
  const positionedKeyRef = useRef<string | undefined>(undefined);
  const rafRef = useRef<number | null>(null);
  const contentHeightRef = useRef(0);
  const viewportHeightRef = useRef(0);

  const finishPositioning = useCallback((key?: string) => {
    if (!key) {
      setIsReady(true);
      return;
    }

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      positionedKeyRef.current = key;
      setIsReady(true);
      rafRef.current = null;
    });
  }, []);

  const positionToEnd = useCallback(() => {
    if (!autoScrollToEndKey) {
      setIsReady(true);
      return;
    }

    if (contentHeightRef.current <= 0 || viewportHeightRef.current <= 0) {
      return;
    }

    if (positionedKeyRef.current === autoScrollToEndKey) {
      if (!isReady) {
        setIsReady(true);
      }
      return;
    }

    scrollViewRef.current?.scrollToEnd({ animated: false });
    finishPositioning(autoScrollToEndKey);
  }, [autoScrollToEndKey, finishPositioning, isReady]);

  useEffect(() => {
    positionedKeyRef.current = undefined;
    contentHeightRef.current = 0;
    setIsReady(!autoScrollToEndKey);
  }, [autoScrollToEndKey]);

  useEffect(() => () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
  }, []);

  return {
    scrollViewRef,
    isReady,
    onContentSizeChange: (_width: number, height: number) => {
      contentHeightRef.current = height;
      positionToEnd();
    },
    onLayout: (height: number) => {
      viewportHeightRef.current = height;
      positionToEnd();
    },
    positionToEnd,
  };
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * MS_PER_DAY);
}

function toDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fromDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function mondayIndex(jsDay: number): number {
  return (jsDay + 6) % 7;
}

function startOfWeekMonday(d: Date): Date {
  const x = startOfDay(d);
  x.setDate(x.getDate() - mondayIndex(x.getDay()));
  return x;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function buildFilledDaySet(workoutDays: string[]): Set<string> {
  return new Set(workoutDays);
}

export function getActivityRangeStartDate(weeks: number): Date {
  const today = startOfDay(new Date());
  if (weeks > 0) {
    return addDays(today, -weeks * 7);
  }
  return ALL_RANGE_START;
}

export function buildMonthCalendars(startDate: Date, endDate: Date): MonthCalendar[] {
  const rangeStart = startOfDay(startDate);
  const rangeEnd = startOfDay(endDate);
  const start = startOfMonth(rangeStart);
  const end = startOfMonth(rangeEnd);
  const months: MonthCalendar[] = [];

  let cursor = new Date(start);
  while (cursor.getTime() <= end.getTime()) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const lead = mondayIndex(first.getDay());
    const daysInMonth = last.getDate();
    const total = lead + daysInMonth;
    const cellsLen = Math.ceil(total / 7) * 7;
    const cells: Array<string | null> = Array.from({ length: cellsLen }, () => null);

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(y, m, d);
      const idx = lead + (d - 1);
      if (date.getTime() >= rangeStart.getTime() && date.getTime() <= rangeEnd.getTime()) {
        cells[idx] = toDayKey(date);
      }
    }

    months.push({
      key: monthKey(cursor),
      label: `${MONTH_NAMES[m]} ${y}`,
      cells,
    });

    cursor = addMonths(cursor, 1);
  }

  return months;
}

export function buildWeekRows(startDate: Date, endDate: Date): WeekRow[] {
  const months = buildMonthCalendars(startDate, endDate);
  const rows: WeekRow[] = [];

  for (const month of months) {
    for (let i = 0; i < month.cells.length; i += 7) {
      rows.push({
        key: `${month.key}-w${i / 7}`,
        monthKey: month.key,
        dayKeys: month.cells.slice(i, i + 7),
      });
    }
  }

  return rows;
}

function DayCell({
  dayKey,
  filledDays,
  compact,
  tall,
  styles,
}: {
  dayKey: string | null;
  filledDays: Set<string>;
  compact?: boolean;
  tall?: boolean;
  styles: ReturnType<typeof createStyles>;
}) {
  const slotStyle = [
    styles.dayCellSlot,
    compact && styles.dayCellSlotCompact,
    tall && styles.dayCellSlotTall,
  ];

  if (!dayKey) return <View style={slotStyle} />;
  const filled = filledDays.has(dayKey);
  const date = fromDayKey(dayKey);
  return (
    <View style={slotStyle}>
      <View style={[styles.dayCell, filled && styles.dayCellFilled]}>
        <Text style={[styles.dayCellText, compact && styles.dayCellTextCompact, filled && styles.dayCellTextFilled]}>
          {date.getDate()}
        </Text>
      </View>
    </View>
  );
}

function MonthCard({
  item,
  filledDays,
  cardHeight,
  compact,
  tallCells,
  styles,
}: {
  item: MonthCalendar;
  filledDays: Set<string>;
  cardHeight?: number;
  compact?: boolean;
  tallCells?: boolean;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={[styles.monthCard, compact && styles.monthCardCompact, cardHeight ? { height: cardHeight } : null]}>
      <Text style={[styles.monthLabel, compact && styles.monthLabelCompact]}>{item.label}</Text>
      <View style={styles.weekHeaderRow}>
        {DAY_HEADERS.map((h, idx) => (
          <Text
            key={`m-hdr-${idx}-${h}`}
            style={[
              styles.weekHeader,
              compact && styles.weekHeaderCompact,
            ]}
          >
            {h}
          </Text>
        ))}
      </View>
      <View style={styles.monthGrid}>
        {Array.from({ length: item.cells.length / 7 }).map((_, rowIdx) => (
          <View key={`${item.key}-r${rowIdx}`} style={styles.monthGridRow}>
            {item.cells.slice(rowIdx * 7, rowIdx * 7 + 7).map((k, colIdx) => (
              <DayCell
                key={`${item.key}-${rowIdx}-${colIdx}`}
                dayKey={k}
                filledDays={filledDays}
                compact={compact}
                tall={tallCells}
                styles={styles}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

export function MonthCalendarGrid({
  months,
  filledDays,
  numColumns = 2,
  cardHeight,
  compact,
  tallCells,
  scrollEnabled = true,
  style,
  contentContainerStyle,
  autoScrollToEndKey,
}: {
  months: MonthCalendar[];
  filledDays: Set<string>;
  numColumns?: number;
  cardHeight?: number;
  compact?: boolean;
  tallCells?: boolean;
  scrollEnabled?: boolean;
  virtualized?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  autoScrollToEndKey?: string;
}) {
  const { styles } = useActivityCalendarStyles();
  const { scrollViewRef, isReady, onContentSizeChange, onLayout } = useScrollViewStartAtEnd(autoScrollToEndKey);

  return (
    <ScrollView
      ref={scrollViewRef}
      key={`month-scroll-${autoScrollToEndKey ?? 'default'}`}
      style={[style, !isReady && styles.hiddenScroll]}
      scrollEnabled={scrollEnabled}
      nestedScrollEnabled
      contentContainerStyle={[styles.monthListContent, contentContainerStyle]}
      onContentSizeChange={onContentSizeChange}
      onLayout={(event) => onLayout(event.nativeEvent.layout.height)}
    >
      <View style={styles.monthCardsWrap}>
        {months.map((item) => (
          <View key={item.key} style={[styles.monthCardWrap, { width: `${100 / numColumns}%` }]}>
            <MonthCard
              item={item}
              filledDays={filledDays}
              cardHeight={cardHeight}
              compact={compact}
              tallCells={tallCells}
              styles={styles}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export function WeekCalendarList({
  rows,
  filledDays,
  contentContainerStyle,
  autoScrollToEndKey,
}: {
  rows: WeekRow[];
  filledDays: Set<string>;
  contentContainerStyle?: ViewStyle;
  autoScrollToEndKey?: string;
}) {
  const { styles } = useActivityCalendarStyles();
  const { scrollViewRef, isReady, onContentSizeChange, onLayout } = useScrollViewStartAtEnd(autoScrollToEndKey);
  const sections = useMemo(() => {
    const map = new Map<string, WeekRow[]>();
    for (const row of rows) {
      const arr = map.get(row.monthKey) ?? [];
      arr.push(row);
      map.set(row.monthKey, arr);
    }
    return [...map.entries()].map(([mk, data]) => {
      const [y, m] = mk.split('-').map(Number);
      return {
        title: `${MONTH_NAMES[(m ?? 1) - 1]} ${y}`,
        data,
      };
    });
  }, [rows]);

  return (
    <ScrollView
      ref={scrollViewRef}
      key={`week-list-${autoScrollToEndKey ?? 'default'}`}
      style={!isReady ? styles.hiddenScroll : undefined}
      contentContainerStyle={[styles.weekListContent, contentContainerStyle]}
      onContentSizeChange={onContentSizeChange}
      onLayout={(event) => onLayout(event.nativeEvent.layout.height)}
    >
      <View style={styles.weekHeaderRowWide}>
        {DAY_HEADERS.map((h, idx) => (
          <Text key={`w-hdr-${idx}-${h}`} style={styles.weekHeaderWide}>
            {h}
          </Text>
        ))}
      </View>
      {sections.map((section) => (
        <View key={section.title}>
          <Text style={styles.weekMonthTitle}>{section.title}</Text>
          {section.data.map((item) => (
            <View key={item.key} style={styles.weekRow}>
              {item.dayKeys.map((k, idx) => (
                <DayCell key={k ?? `${item.key}-b${idx}`} dayKey={k} filledDays={filledDays} styles={styles} />
              ))}
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  hiddenScroll: {
    opacity: 0,
  },
  monthListContent: {
    paddingBottom: spacing.sm,
  },
  monthCardsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  monthCardWrap: {
    paddingHorizontal: 4,
    paddingBottom: spacing.sm,
  },
  monthCard: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 8,
    height: 206,
  },
  monthCardCompact: {
    padding: 6,
    height: 196,
  },
  monthLabel: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 6,
  },
  monthLabelCompact: {
    fontSize: 11,
    marginBottom: 4,
  },
  weekHeaderRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: CELL_GAP,
    marginBottom: 4,
  },
  weekHeader: {
    flex: 1,
    minWidth: 0,
    textAlign: 'center',
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 10,
  },
  weekHeaderCompact: {
    fontSize: 9,
  },
  monthGrid: {
    marginTop: 2,
  },
  monthGridRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: CELL_GAP,
    marginBottom: 2,
  },
  dayCellSlot: {
    flex: 1,
    minWidth: 0,
    height: DAY_CELL_HEIGHT,
  },
  dayCellSlotCompact: {
    height: DAY_CELL_HEIGHT_COMPACT,
  },
  dayCellSlotTall: {
    height: DAY_CELL_HEIGHT_TALL,
  },
  dayCell: {
    flex: 1,
    borderRadius: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCellFilled: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  dayCellText: {
    color: colors.textSecondary,
    fontFamily: fonts.light,
    fontSize: 9,
    lineHeight: 10,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    paddingVertical: 0,
  },
  dayCellTextCompact: {
    fontSize: 8,
    lineHeight: 9,
    paddingVertical: 0,
  },
  dayCellTextFilled: {
    color: colors.background,
    fontFamily: fonts.semiBold,
  },
  weekListContent: {
    paddingBottom: spacing.md,
  },
  weekHeaderRowWide: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: CELL_GAP,
    marginBottom: spacing.xs,
  },
  weekHeaderWide: {
    flex: 1,
    minWidth: 0,
    textAlign: 'center',
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  weekMonthTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  weekRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: CELL_GAP,
    marginBottom: 6,
  },
});
