import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { exerciseDetailService } from '../../../src/services';
import type { ExerciseHistoryData, ExerciseHistorySession } from '../../../src/services';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useProfileStore } from '../../../src/stores/profile.store';
import { formatDate, formatTime } from '../../../src/utils/date';
import { formatDurationValue } from '../../../src/utils/duration';
import { formatWeight, formatDistance, weightUnitLabel, distanceUnitLabel } from '../../../src/utils/units';
import { getExerciseTypeConfig, getWeightLabel } from '../../../src/utils/exerciseType';
import { Card, RirCircle } from '../../../src/components/ui';
import { fonts, spacing } from '../../../src/constants';
import { useTheme } from '../../../src/contexts/ThemeContext';
import type { ThemeColors } from '../../../src/constants/themes';

export default function ExerciseHistoryScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const { user } = useAuthStore();
  const { profile } = useProfileStore();
  const weightUnit = profile?.weight_unit ?? 'kg';
  const distanceUnit = profile?.distance_unit ?? 'km';

  const [historyData, setHistoryData] = useState<ExerciseHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!user?.id || !exerciseId) return;
    try {
      setErrorMessage(null);
      const data = await exerciseDetailService.getHistoryData(user.id, exerciseId, weightUnit, distanceUnit);
      setHistoryData(data);
    } catch (error: unknown) {
      setErrorMessage((error as Error).message || 'Failed to load exercise history.');
      setHistoryData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [distanceUnit, exerciseId, user?.id, weightUnit]);

  useFocusEffect(useCallback(() => {
    void loadHistory();
  }, [loadHistory]));

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    void loadHistory();
  }, [loadHistory]);

  const handleOpenSession = useCallback((sessionId: string) => {
    if (!exerciseId) return;
    router.push({
      pathname: '/(tabs)/profile/[sessionId]',
      params: {
        sessionId,
        from: 'exercise-history',
        exerciseId,
      },
    });
  }, [exerciseId, router]);

  const renderItem = useCallback(({ item }: { item: ExerciseHistorySession }) => {
    const exerciseType = historyData?.exercise.exercise_type ?? 'weight_reps';
    const cfg = getExerciseTypeConfig(exerciseType);
    const showWeight = cfg.fields.some((f) => f.key === 'weight');
    const showReps = cfg.fields.some((f) => f.key === 'reps');
    const showDuration = cfg.fields.some((f) => f.key === 'duration');
    const showDistance = cfg.fields.some((f) => f.key === 'distance');

    return (
      <TouchableOpacity
        style={styles.sessionCardTap}
        activeOpacity={0.8}
        onPress={() => handleOpenSession(item.sessionId)}
      >
        <Card style={styles.sessionCard}>
          <View style={styles.sessionCardHeader}>
            <Text style={styles.sessionDate}>{formatDate(item.startedAt)}</Text>
            <Text style={styles.sessionChevron}>›</Text>
          </View>
          <Text style={styles.sessionTime}>{formatTime(item.startedAt)}</Text>

          <View style={styles.tableHeader}>
            <Text style={[styles.tableCol, styles.colSet]}>SET</Text>
            {showWeight && <Text style={[styles.tableCol, styles.colFlex]}>{getWeightLabel(exerciseType, weightUnitLabel(weightUnit))}</Text>}
            {showReps && <Text style={[styles.tableCol, styles.colFlex]}>REPS</Text>}
            {showDuration && <Text style={[styles.tableCol, styles.colFlex]}>TIME</Text>}
            {showDistance && <Text style={[styles.tableCol, styles.colFlex]}>{distanceUnitLabel(distanceUnit)}</Text>}
            {cfg.showRir && <Text style={[styles.tableCol, styles.colRir]}>RIR</Text>}
          </View>

          {item.setRows.map((setRow, index) => (
            <View key={`${item.sessionId}-${setRow.setNumber}-${index}`} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colSet]}>{setRow.setNumber}</Text>
              {showWeight && (
                <Text style={[styles.tableCell, styles.colFlex]}>
                  {setRow.weight > 0 ? formatWeight(setRow.weight, weightUnit) : '-'}
                </Text>
              )}
              {showReps && (
                <Text style={[styles.tableCell, styles.colFlex]}>
                  {setRow.repsPerformed > 0 ? setRow.repsPerformed : '-'}
                </Text>
              )}
              {showDuration && (
                <Text style={[styles.tableCell, styles.colFlex]}>
                  {setRow.duration > 0 ? formatDurationValue(setRow.duration) : '-'}
                </Text>
              )}
              {showDistance && (
                <Text style={[styles.tableCell, styles.colFlex]}>
                  {setRow.distance > 0 ? formatDistance(setRow.distance, distanceUnit) : '-'}
                </Text>
              )}
              {cfg.showRir && (
                <View style={[styles.tableCellBox, styles.colRir]}>
                  <RirCircle value={setRow.rir} size={24} />
                </View>
              )}
            </View>
          ))}
        </Card>
      </TouchableOpacity>
    );
  }, [distanceUnit, handleOpenSession, historyData?.exercise.exercise_type, styles, weightUnit]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitle: 'Exercise History',
          headerTitleStyle: { fontFamily: 'Monospaceland-Bold' },
          headerBackButtonDisplayMode: 'minimal',
          headerBackTitle: '',
        }}
      />

      {loading && !historyData ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.textSecondary} />
        </View>
      ) : errorMessage ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Couldn’t load history</Text>
          <Text style={styles.emptyText}>{errorMessage}</Text>
        </View>
      ) : (
        <FlatList
          data={historyData?.sessions ?? []}
          keyExtractor={(item) => item.sessionId}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            (historyData?.sessions.length ?? 0) === 0 ? styles.listContentEmpty : null,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.textSecondary}
            />
          }
          ListHeaderComponent={historyData ? (
            <View style={styles.headerBlock}>
              <Text style={styles.exerciseName}>{historyData.exercise.name}</Text>
              <Text style={styles.headerSubtitle}>Completed sessions for this exercise</Text>
            </View>
          ) : null}
          ListEmptyComponent={(
            <View style={styles.centeredInline}>
              <Text style={styles.emptyTitle}>No completed sessions yet</Text>
              <Text style={styles.emptyText}>Your finished workouts for this exercise will appear here.</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.bottom,
    gap: spacing.sm,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  centeredInline: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  headerBlock: {
    marginBottom: spacing.xs,
  },
  exerciseName: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
  sessionCard: {
    marginBottom: 6,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 4,
  },
  sessionCardTap: {
    borderRadius: 12,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sessionDate: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  sessionChevron: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
  },
  sessionTime: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginBottom: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: colors.border,
    borderBottomColor: colors.border,
  },
  tableCol: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableCell: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text,
    textAlign: 'center',
  },
  tableCellBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  colSet: {
    width: 28,
  },
  colFlex: {
    flex: 1,
  },
  colRir: {
    width: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
});
