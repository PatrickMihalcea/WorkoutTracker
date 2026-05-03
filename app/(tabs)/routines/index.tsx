import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useRoutineStore } from '../../../src/stores/routine.store';
import { useSubscriptionStore } from '../../../src/stores/subscription.store';
import { Button, Card, EmptyState, OverflowMenu, OverflowMenuItem } from '../../../src/components/ui';
import { fonts, spacing } from '../../../src/constants';
import { isLightTheme } from '../../../src/constants/themes';
import { Routine } from '../../../src/models';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { usePaywall } from '../../../src/contexts/PaywallContext';
import type { ThemeColors } from '../../../src/constants/themes';
import { canCreateAnotherRoutine, getLockedRoutineIds } from '../../../src/utils/routineAccess';

const CROWN_ICON = require('../../../assets/icons/crown.png');

const createStyles = (colors: ThemeColors, isLight: boolean) => StyleSheet.create({
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
  routineNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
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
  crownIcon: {
    width: 15,
    height: 15,
    tintColor: isLight ? '#111111' : '#FFFFFF',
  },
  routineMeta: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
  routineMetaActive: {
    color: isLight ? '#FFFFFF' : colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
    marginBottom: 12,
  },
});

export default function RoutineListScreen() {
  const router = useRouter();
  const { showPaywall } = usePaywall();
  const { colors, gradients, theme } = useTheme();
  const isLight = isLightTheme(theme);
  const styles = useMemo(() => createStyles(colors, isLight), [colors, isLight]);
  const { user } = useAuthStore();
  const isPremium = useSubscriptionStore((state) => state.isPremium);
  const { routines, fetchRoutines, setActive, deleteRoutine, duplicateRoutine, routinesLoaded } = useRoutineStore();
  const [refreshing, setRefreshing] = useState(false);
  const lockedRoutineIds = useMemo(() => getLockedRoutineIds(routines, isPremium), [routines, isPremium]);
  const canCreateMoreRoutines = useMemo(() => canCreateAnotherRoutine(routines, isPremium), [routines, isPremium]);

  type ListItem = Routine | { type: 'divider' };
  const sortedRoutines = useMemo<ListItem[]>(() => {
    const active   = routines.filter((r) => r.is_active);
    const inactive = routines.filter((r) => !r.is_active);
    if (active.length === 0 || inactive.length === 0) return routines;
    return [...active, { type: 'divider' as const }, ...inactive];
  }, [routines]);

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
    if (!canCreateMoreRoutines) {
      showPaywall('unlimited_routines');
      return;
    }
    try {
      const created = await duplicateRoutine(routine.id, user.id);
      router.push(`/(tabs)/routines/${created.id}`);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleOpenRoutine = useCallback((routine: Routine) => {
    if (lockedRoutineIds.has(routine.id)) {
      showPaywall('unlimited_routines');
      return;
    }
    router.push(`/(tabs)/routines/${routine.id}`);
  }, [lockedRoutineIds, router, showPaywall]);

  const renderRoutine = ({ item }: { item: ListItem }) => {
    if ('type' in item) {
      return <View style={styles.divider} />;
    }
    const isLocked = lockedRoutineIds.has(item.id);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleOpenRoutine(item)}
        onLongPress={() => handleDelete(item)}
      >
      <Card
        style={StyleSheet.flatten([styles.routineCard, item.is_active ? styles.activeCard : undefined])}
        gradientColors={item.is_active ? gradients.accent : undefined}
      >
        <View style={styles.routineHeader}>
          <View style={styles.routineInfo}>
            <View style={styles.routineNameRow}>
              <Text style={[styles.routineName, item.is_active && isLight && { color: '#FFFFFF' }]}>
              {isLocked ? (
                <View>
                  <Image source={CROWN_ICON} style={styles.crownIcon} resizeMode="contain" />
                </View>
              ) : null}
              {isLocked ? ' ' : ''}{item.name}
                
              </Text>
              
            </View>
            <Text style={[styles.routineMeta, item.is_active && styles.routineMetaActive]}>
              {item.week_count} {item.week_count === 1 ? 'week' : 'weeks'} · Week {item.current_week} / {item.week_count}
            </Text>
          </View>
          <View style={styles.menuWrap}>
            <OverflowMenu
              triggerColor={item.is_active && isLight ? '#FFFFFF' : undefined}
              items={(
                isLocked
                  ? [
                    {
                      label: 'Delete',
                      onPress: () => handleDelete(item),
                      destructive: true,
                    },
                  ]
                  : [
                    {
                      label: 'Set Active',
                      onPress: () => handleSetActive(item),
                      disabled: item.is_active,
                      highlight: !item.is_active,
                    },
                    {
                      label: 'Edit',
                      onPress: () => handleOpenRoutine(item),
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
                  ]
              ) as OverflowMenuItem[]}
            />
          </View>
        </View>
      </Card>
      </TouchableOpacity>
    );
  };

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
        data={sortedRoutines}
        keyExtractor={(item) => 'type' in item ? 'divider' : item.id}
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
