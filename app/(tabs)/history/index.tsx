import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { sessionService, dashboardService } from '../../../src/services';
import type { DashboardData, Granularity } from '../../../src/services';
import { Card, EmptyState } from '../../../src/components/ui';
import { Dashboard, GranularityMode, ChartMode } from '../../../src/components/history/Dashboard';
import { useHistoryView } from '../../../src/components/history/HistoryViewContext';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useProfileStore } from '../../../src/stores/profile.store';
import { colors, fonts, spacing } from '../../../src/constants';
import { WorkoutSessionWithRoutine } from '../../../src/models';
import { formatDate, formatTime, formatDuration } from '../../../src/utils/date';

function granularityModeToBackend(mode: GranularityMode): Granularity {
  if (mode === 'W' || mode === 'M') return 'day';
  if (mode === '6M' || mode === '3M') return 'week';
  return 'month';
}

export default function HistoryScreen() {
  const router = useRouter();
  const { view, chartMode, setChartMode } = useHistoryView();
  const user = useAuthStore((s) => s.user);
  const { profile } = useProfileStore();
  const wUnit = profile?.weight_unit ?? 'kg';

  const [sessions, setSessions] = useState<WorkoutSessionWithRoutine[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [weeks, setWeeks] = useState(12);
  const [granularity, setGranularity] = useState<GranularityMode>('W');

  const userId = user?.id ?? '';

  const loadSessions = useCallback(async () => {
    try {
      const data = await sessionService.getAll();
      setSessions(data.filter((s) => s.status === 'completed'));
    } catch {
      // Handle quietly
    }
  }, []);

  const loadDashboard = useCallback(async (w: number, gMode: GranularityMode, cMode: ChartMode) => {
    if (!userId) return;
    setDashboardLoading(true);
    try {
      let data: DashboardData;
      if (cMode === 'rel') {
        data = await dashboardService.getDashboardDataRaw(userId, w, wUnit);
      } else {
        const g = granularityModeToBackend(gMode);
        data = await dashboardService.getDashboardData(userId, w, g, wUnit);
      }
      setDashboardData(data);
    } catch {
      // Handle quietly
    } finally {
      setDashboardLoading(false);
    }
  }, [userId, wUnit]);

  useFocusEffect(
    useCallback(() => {
      if (view === 'dashboard') {
        loadDashboard(weeks, granularity, chartMode);
      } else {
        loadSessions();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view, weeks, loadSessions, loadDashboard, chartMode]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (view === 'dashboard') {
        await loadDashboard(weeks, granularity, chartMode);
      } else {
        await loadSessions();
      }
    } finally {
      setRefreshing(false);
    }
  }, [view, weeks, granularity, chartMode, loadSessions, loadDashboard]);

  const handleChangeWeeks = useCallback((w: number) => {
    setWeeks(w);
  }, []);

  const handleChangeGranularity = useCallback((mode: GranularityMode) => {
    setGranularity(mode);
  }, []);

  const handleChangeChartMode = useCallback((mode: ChartMode) => {
    setChartMode(mode);
  }, []);

  const prevGranRef = useRef(granularity);
  const prevChartModeRef = useRef(chartMode);
  useEffect(() => {
    if (prevGranRef.current !== granularity) {
      prevGranRef.current = granularity;
      loadDashboard(weeks, granularity, chartMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [granularity]);

  useEffect(() => {
    if (prevChartModeRef.current !== chartMode) {
      prevChartModeRef.current = chartMode;
      loadDashboard(weeks, granularity, chartMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartMode]);

  const handleDeleteSession = (item: WorkoutSessionWithRoutine) => {
    Alert.alert(
      'Delete Workout',
      `Remove the workout from ${formatDate(item.started_at)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await sessionService.deleteSession(item.id);
              setSessions((prev) => prev.filter((s) => s.id !== item.id));
            } catch {
              Alert.alert('Error', 'Failed to delete workout');
            }
          },
        },
      ],
    );
  };

  if (view === 'dashboard') {
    if (dashboardLoading && !dashboardData) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.textSecondary} />
        </View>
      );
    }
    if (dashboardData) {
      return (
        <Dashboard
          data={dashboardData}
          onRefresh={onRefresh}
          refreshing={refreshing}
          onChangeWeeks={handleChangeWeeks}
          onChangeGranularityMode={handleChangeGranularity}
          chartMode={chartMode}
          onChangeChartMode={handleChangeChartMode}
        />
      );
    }
    return null;
  }

  const renderSession = ({ item }: { item: WorkoutSessionWithRoutine }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/(tabs)/history/${item.id}`)}
      onLongPress={() => handleDeleteSession(item)}
    >
      <Card style={styles.sessionCard}>
        {item.routine_day?.label && (
          <Text style={styles.routineDayLabel}>{item.routine_day.label}</Text>
        )}
        {item.routine_day?.routine?.name && (
          <Text style={styles.routineName}>{item.routine_day.routine.name}</Text>
        )}
        <View style={styles.sessionDetailsRow}>
          <Text style={styles.sessionDate}>{formatDate(item.started_at)}</Text>
          <Text style={styles.sessionDuration}>
            {formatDuration(item.started_at, item.completed_at)}
          </Text>
        </View>
        <Text style={styles.sessionTime}>
          {formatTime(item.started_at)} – {formatTime(item.completed_at ?? new Date().toISOString())}
        </Text>
      </Card>
    </TouchableOpacity>
  );

  if (sessions.length === 0 && !refreshing) {
    return (
      <View style={styles.container}>
        <EmptyState
          title="No History"
          message="Complete your first workout to see it here."
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={renderSession}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  list: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
  },
  sessionCard: {
    marginBottom: 12,
  },
  routineDayLabel: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  routineName: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginTop: 2,
  },
  sessionDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  sessionDate: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
  },
  sessionDuration: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
  },
  sessionTime: {
    fontSize: 12,
    fontFamily: fonts.light,
    color: colors.textMuted,
    marginTop: 4,
  },
});
