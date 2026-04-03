import { useState, useCallback, useRef } from 'react';
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
import type { DashboardData } from '../../../src/services';
import { Card, EmptyState } from '../../../src/components/ui';
import { Dashboard } from '../../../src/components/history/Dashboard';
import { useHistoryView } from '../../../src/components/history/HistoryViewContext';
import { useAuthStore } from '../../../src/stores/auth.store';
import { colors, fonts } from '../../../src/constants';
import { WorkoutSessionWithRoutine } from '../../../src/models';
import { formatDate, formatTime, formatDuration } from '../../../src/utils/date';

export default function HistoryScreen() {
  const router = useRouter();
  const { view } = useHistoryView();
  const user = useAuthStore((s) => s.user);
  const [sessions, setSessions] = useState<WorkoutSessionWithRoutine[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const weeksRef = useRef(0);

  const loadSessions = useCallback(async () => {
    try {
      const data = await sessionService.getAll();
      setSessions(data.filter((s) => s.status === 'completed'));
    } catch {
      // Handle quietly
    }
  }, []);

  const loadDashboard = useCallback(async (weeks?: number) => {
    if (!user?.id) return;
    const w = weeks ?? weeksRef.current;
    setDashboardLoading(true);
    try {
      const data = await dashboardService.getDashboardData(user.id, w);
      setDashboardData(data);
    } catch {
      // Handle quietly
    } finally {
      setDashboardLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (view === 'dashboard') {
        loadDashboard();
      } else {
        loadSessions();
      }
    }, [view, loadSessions, loadDashboard]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (view === 'dashboard') {
      await loadDashboard();
    } else {
      await loadSessions();
    }
    setRefreshing(false);
  }, [view, loadSessions, loadDashboard]);

  const handleChangeWeeks = useCallback((weeks: number) => {
    weeksRef.current = weeks;
    loadDashboard(weeks);
  }, [loadDashboard]);

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
    padding: 16,
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
