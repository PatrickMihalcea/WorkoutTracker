import { useState, useCallback, useMemo } from 'react';
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
import { useAuthStore } from '../../../src/stores/auth.store';
import { useRoutineStore } from '../../../src/stores/routine.store';
import { Button, Card, EmptyState, OverflowMenu, OverflowMenuItem } from '../../../src/components/ui';
import { fonts, spacing } from '../../../src/constants';
import { Routine } from '../../../src/models';
import { useTheme } from '../../../src/contexts/ThemeContext';
import type { ThemeColors } from '../../../src/constants/themes';

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.sm,
    paddingBottom: spacing.bottom,
  },
  routineCard: {
    marginBottom: 12,
    paddingHorizontal: spacing.md,
  },
  activeCard: {
    borderColor: colors.accent,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  routineInfo: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.xs,
  },
  menuWrap: {
    marginLeft: spacing.xs,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  routineName: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
    flexShrink: 1,
    lineHeight: 22,
  },
  routineMeta: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
  routineMetaActive: {
    color: colors.textSecondary,
  },
});

export default function RoutineListScreen() {
  const router = useRouter();
  const { colors, gradients } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user } = useAuthStore();
  const { routines, fetchRoutines, setActive, deleteRoutine, duplicateRoutine, routinesLoaded } = useRoutineStore();
  const [refreshing, setRefreshing] = useState(false);

  const loadRoutines = useCallback(async () => {
    await fetchRoutines();
  }, [fetchRoutines]);

  useFocusEffect(
    useCallback(() => {
      loadRoutines();
    }, [loadRoutines]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchRoutines();
    } finally {
      setRefreshing(false);
    }
  }, [fetchRoutines]);

  const handleSetActive = async (routine: Routine) => {
    if (!user) return;
    try {
      await setActive(routine.id, user.id);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleDelete = (routine: Routine) => {
    Alert.alert(
      'Delete Routine',
      `Are you sure you want to delete "${routine.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteRoutine(routine.id),
        },
      ],
    );
  };

  const handleDuplicate = async (routine: Routine) => {
    if (!user) return;
    try {
      const created = await duplicateRoutine(routine.id, user.id);
      router.push(`/(tabs)/routines/${created.id}`);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const renderRoutine = ({ item }: { item: Routine }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/(tabs)/routines/${item.id}`)}
      onLongPress={() => handleDelete(item)}
    >
      <Card
        style={StyleSheet.flatten([styles.routineCard, item.is_active ? styles.activeCard : undefined])}
        gradientColors={item.is_active ? gradients.accent : undefined}
      >
        <View style={styles.routineHeader}>
          <View style={styles.routineInfo}>
            <Text style={styles.routineName}>{item.name}</Text>
            <Text style={[styles.routineMeta, item.is_active && styles.routineMetaActive]}>
              {item.week_count} {item.week_count === 1 ? 'week' : 'weeks'} · Current {item.current_week}
            </Text>
          </View>
          <View style={styles.menuWrap}>
            <OverflowMenu
              items={[
                {
                  label: 'Set Active',
                  onPress: () => handleSetActive(item),
                  disabled: item.is_active,
                  highlight: !item.is_active,
                },
                {
                  label: 'Edit',
                  onPress: () => router.push(`/(tabs)/routines/${item.id}`),
                },
                {
                  label: 'Duplicate',
                  onPress: () => handleDuplicate(item),
                },
                {
                  label: 'Delete',
                  onPress: () => handleDelete(item),
                  destructive: true,
                },
              ] as OverflowMenuItem[]}
            />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (!routinesLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.textSecondary} />
      </View>
    );
  }

  if (routines.length === 0 && !refreshing) {
    return (
      <View style={styles.container}>
        <EmptyState
          title="No Routines"
          message="Create your first workout routine to get started."
          actionLabel="Create Routine"
          onAction={() => router.push('/(tabs)/routines/create')}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={routines}
        keyExtractor={(item) => item.id}
        renderItem={renderRoutine}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListFooterComponent={
          <Button
            title="+ Create Routine"
            variant="dashed"
            onPress={() => router.push('/(tabs)/routines/create')}
          />
        }
      />
    </View>
  );
}
