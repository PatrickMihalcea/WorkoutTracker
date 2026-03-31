import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { sessionService } from '../../../src/services';
import { Card, EmptyState } from '../../../src/components/ui';
import { colors, fonts } from '../../../src/constants';
import { WorkoutSessionWithRoutine } from '../../../src/models';
import { formatDate, formatTime, formatDuration } from '../../../src/utils/date';

export default function HistoryScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<WorkoutSessionWithRoutine[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      const data = await sessionService.getAll();
      setSessions(data.filter((s) => s.status === 'completed'));
    } catch {
      // Handle quietly
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [loadSessions]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  }, [loadSessions]);

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
