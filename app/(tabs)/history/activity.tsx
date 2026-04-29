import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import { dashboardService } from '../../../src/services';
import { TimeRangeDropdown } from '../../../src/components/charts';
import {
  MonthCalendarGrid,
  WeekCalendarList,
  buildFilledDaySet,
  buildMonthCalendars,
  buildWeekRows,
  getActivityRangeStartDate,
} from '../../../src/components/history/ActivityCalendar';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useProfileStore } from '../../../src/stores/profile.store';
import { fonts, spacing } from '../../../src/constants';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { isLightTheme } from '../../../src/constants/themes';
import type { ThemeColors } from '../../../src/constants/themes';

type ViewMode = 'month' | 'week';
const FILTER_BAR_HEIGHT = 40;

export default function ActivityScreen() {
  const { colors, theme } = useTheme();
  const isLight = isLightTheme(theme);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { initialRange } = useLocalSearchParams<{ initialRange?: string }>();
  const { user } = useAuthStore();
  const { profile } = useProfileStore();
  const wUnit = profile?.weight_unit ?? 'kg';
  const hUnit = profile?.height_unit ?? 'cm';

  const initial = Number(initialRange);
  const initialWeeks = Number.isFinite(initial) ? initial : 12;

  const [selectedRange, setSelectedRange] = useState(initialWeeks);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [loading, setLoading] = useState(true);
  const [workoutDays, setWorkoutDays] = useState<string[]>([]);
  const filterAnim = useRef(new Animated.Value(1)).current;

  const loadActivity = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await dashboardService.getDashboardDataRaw(user.id, selectedRange, wUnit, hUnit);
      setWorkoutDays(data.workoutDays);
    } catch {
      setWorkoutDays([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedRange, wUnit, hUnit]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  const filledDays = useMemo(() => buildFilledDaySet(workoutDays), [workoutDays]);

  const { months, weekRows } = useMemo(() => {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = getActivityRangeStartDate(selectedRange);
    return {
      months: buildMonthCalendars(start, end),
      weekRows: buildWeekRows(start, end),
    };
  }, [selectedRange]);

  const filterBarHeight = filterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, FILTER_BAR_HEIGHT],
  });
  const activityScrollKey = `${viewMode}:${selectedRange}`;
  const filterBlurTint = isLight ? 'light' : 'dark';
  const filterBlurIntensity = isLight ? 40 : 60;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.filterBarOuter, { height: filterBarHeight }]}>
        <BlurView
          intensity={filterBlurIntensity}
          tint={filterBlurTint}
          style={[styles.filterBar, isLight && styles.filterBarLight]}
        >
          <TimeRangeDropdown selected={selectedRange} onChange={setSelectedRange} />
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleChip, viewMode === 'month' && styles.toggleChipActive]}
              onPress={() => setViewMode('month')}
            >
              <Text style={[styles.toggleChipText, viewMode === 'month' && styles.toggleChipTextActive]}>
                Month
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleChip, viewMode === 'week' && styles.toggleChipActive]}
              onPress={() => setViewMode('week')}
            >
              <Text style={[styles.toggleChipText, viewMode === 'week' && styles.toggleChipTextActive]}>
                Week
              </Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Animated.View>

      <View style={styles.body}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.textSecondary} />
          </View>
        ) : viewMode === 'month' ? (
          <MonthCalendarGrid
            months={months}
            filledDays={filledDays}
            numColumns={2}
            tallCells
            style={styles.flex}
            contentContainerStyle={styles.calendarContent}
            autoScrollToEndKey={activityScrollKey}
          />
        ) : (
          <WeekCalendarList
            rows={weekRows}
            filledDays={filledDays}
            contentContainerStyle={styles.calendarContent}
            autoScrollToEndKey={activityScrollKey}
          />
        )}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterBarOuter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9,
    overflow: 'hidden',
  },
  filterBar: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.sm,
  },
  filterBarLight: {
    backgroundColor: `${colors.surfaceLight}D9`,
  },
  toggleRow: {
    flexDirection: 'row',
    marginLeft: 'auto',
    backgroundColor: colors.surface,
    borderRadius: 8,
    overflow: 'hidden',
  },
  toggleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  toggleChipActive: {
    backgroundColor: colors.text,
  },
  toggleChipText: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: fonts.semiBold,
  },
  toggleChipTextActive: {
    color: colors.background,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  calendarContent: {
    paddingTop: FILTER_BAR_HEIGHT + spacing.xs,
    paddingBottom: spacing.bottom,
  },
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
