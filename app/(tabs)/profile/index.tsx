import { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect, Stack } from 'expo-router';
import { sessionService } from '../../../src/services';
import { useProfileStore } from '../../../src/stores/profile.store';
import { useSessionStore } from '../../../src/stores/session.store';
import { Card, EmptyState } from '../../../src/components/ui';
import { fonts, spacing } from '../../../src/constants';
import { WorkoutSessionWithRoutine } from '../../../src/models';
import { formatDate, formatTime, formatDuration } from '../../../src/utils/date';
import { formatHeight } from '../../../src/utils/units';
import { useTheme } from '../../../src/contexts/ThemeContext';
import type { ThemeColors } from '../../../src/constants/themes';

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.bottom,
  },
  contentEmpty: {
    paddingBottom: spacing.xl,
  },
  loadingHistoryContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  displayName: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  name: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  bio: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  quickActionCardAccent: {
    borderColor: colors.border,
    backgroundColor: colors.surfaceLight,
  },
  quickActionTitle: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  quickActionSub: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  quickActionArrow: {
    fontSize: 20,
    fontFamily: fonts.light,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  statValue: {
    fontSize: 19,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  sessionCard: {
    marginBottom: 12,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerTextWrap: {
    flex: 1,
  },
  routineDayLabel: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  routineName: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginTop: 2,
  },
  recordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(93, 196, 122, 0.16)',
    borderColor: '#5DC47A',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  recordDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#5DC47A',
  },
  recordBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#89E6A2',
  },
  sessionMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 2,
  },
  weekPill: {
    borderWidth: 1,
    borderColor: '#2E6FBF',
    backgroundColor: 'rgba(46, 111, 191, 0.16)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  weekPillText: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: '#88BBF0',
  },
  sessionDuration: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
    marginLeft: 'auto',
  },
  sessionTimeLine: {
    fontSize: 12,
    fontFamily: fonts.light,
    color: colors.textMuted,
    marginTop: 8,
  },
  sessionDateInline: {
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
  },
});

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, gradients } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile } = useProfileStore();

  const { sessions, recordCounts: sessionRecordCounts, sessionsLoaded: historyLoaded, fetchSessions, removeSession } = useSessionStore();
  const [refreshing, setRefreshing] = useState(false);

  const displayWeight = () => {
    if (!profile?.weight_kg) return '--';
    if (profile.weight_unit === 'lbs') {
      return `${Math.round(profile.weight_kg * 2.20462 * 10) / 10} lbs`;
    }
    return `${Math.round(profile.weight_kg * 10) / 10} kg`;
  };

  const displayHeight = () => {
    if (!profile?.height_cm) return '--';
    return formatHeight(profile.height_cm, profile.height_unit);
  };

  useFocusEffect(
    useCallback(() => {
      void fetchSessions();
    }, [fetchSessions]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchSessions();
    } finally {
      setRefreshing(false);
    }
  }, [fetchSessions]);

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
              removeSession(item.id);
            } catch {
              Alert.alert('Error', 'Failed to delete workout');
            }
          },
        },
      ],
    );
  };

  const renderSession = ({ item }: { item: WorkoutSessionWithRoutine }) => {
    const startTime = formatTime(item.started_at).replace(/\s/g, '');
    const endTime = formatTime(item.completed_at ?? new Date().toISOString()).replace(/\s/g, '');
    const dateLabel = formatDate(item.started_at);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push(`/(tabs)/profile/${item.id}`)}
        onLongPress={() => handleDeleteSession(item)}
      >
        <Card style={styles.sessionCard}>
          <View style={styles.sessionHeader}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.routineDayLabel}>{item.routine_day?.label ?? 'Workout Session'}</Text>
              {item.routine_day?.routine?.name && (
                <Text style={styles.routineName}>{item.routine_day.routine.name}</Text>
              )}
            </View>
            {(sessionRecordCounts[item.id] ?? 0) > 0 && (
              <View style={styles.recordBadge}>
                <View style={styles.recordDot} />
                <Text style={styles.recordBadgeText}>
                  {sessionRecordCounts[item.id]} {sessionRecordCounts[item.id] === 1 ? 'Record' : 'Records'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.sessionMetaRow}>
            {(item.routine_week_index ?? item.routine_day?.week_index) != null && (
              <View style={styles.weekPill}>
                <Text style={styles.weekPillText}>Week {item.routine_week_index ?? item.routine_day?.week_index}</Text>
              </View>
            )}
            <Text style={styles.sessionDuration}>
              {formatDuration(item.started_at, item.completed_at)}
            </Text>
          </View>
          <Text style={styles.sessionTimeLine}>
            <Text style={styles.sessionDateInline}>{dateLabel}</Text>
            {` · ${startTime} - ${endTime}`}
          </Text>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderHeaderRight = useCallback(() => (
    <TouchableOpacity
      onPress={() => router.push('/(tabs)/profile/settings')}
      activeOpacity={0.7}
      style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', }}
    >
      <Image
        source={require('../../../assets/icons/setting.png')}
        style={{ width: 20, height: 20, tintColor: '#FFFFFF' }}
      />
    </TouchableOpacity>
  ), [router]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerRight: renderHeaderRight }} />
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={renderSession}
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={(
          <>
            <Card style={styles.heroCard} gradientColors={gradients.surface}>
              <Text style={styles.displayName} numberOfLines={1} ellipsizeMode="tail">
                @{profile?.display_name ?? 'user'}
              </Text>

              {profile?.name ? <Text style={styles.name}>{profile.name}</Text> : null}
              {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

              <View style={styles.statRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{displayWeight()}</Text>
                  <Text style={styles.statLabel}>Weight</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{displayHeight()}</Text>
                  <Text style={styles.statLabel}>Height</Text>
                </View>
              </View>
            </Card>

            <View style={styles.quickActionsRow}>
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => router.push('/(tabs)/profile/measurements')}
                activeOpacity={0.8}
              >
                <Text style={styles.quickActionTitle}>Measurements</Text>
                <Text style={styles.quickActionSub}>Track body metrics</Text>
                <Text style={styles.quickActionArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickActionCard, styles.quickActionCardAccent]}
                onPress={() => router.push('/(tabs)/profile/goals')}
                activeOpacity={0.8}
              >
                <Text style={styles.quickActionTitle}>Goals</Text>
                <Text style={styles.quickActionSub}>Set your targets</Text>
                <Text style={styles.quickActionArrow}>›</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionLabel}>History</Text>
          </>
        )}
        ListEmptyComponent={
          !historyLoaded
            ? (
              <View style={styles.loadingHistoryContainer}>
                <ActivityIndicator size="small" color={colors.textSecondary} />
              </View>
            )
            : refreshing
            ? null
            : (
              <EmptyState
                title="No History"
                message="Complete your first workout to see it here."
              />
            )
        }
        contentContainerStyle={[
          styles.content,
          sessions.length === 0 ? styles.contentEmpty : null,
        ]}
      />
    </View>
  );
}
