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
import { useAuthStore } from '../../../src/stores/auth.store';
import { useRoutineStore } from '../../../src/stores/routine.store';
import { Button, Card, EmptyState } from '../../../src/components/ui';
import { colors, fonts } from '../../../src/constants';
import { Routine } from '../../../src/models';

export default function RoutineListScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { routines, fetchRoutines, setActive, deleteRoutine } = useRoutineStore();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchRoutines();
    }, [fetchRoutines]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRoutines();
    setRefreshing(false);
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

  const renderRoutine = ({ item }: { item: Routine }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/(tabs)/routines/${item.id}`)}
      onLongPress={() => handleDelete(item)}
    >
      <Card style={StyleSheet.flatten([styles.routineCard, item.is_active ? styles.activeCard : undefined])}>
        <View style={styles.routineHeader}>
          <View>
            <Text style={styles.routineName}>{item.name}</Text>
            <Text style={styles.routineMeta}>
              {item.week_count} {item.week_count === 1 ? 'week' : 'weeks'} · Current {item.current_week}
            </Text>
          </View>
          {item.is_active ? (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Active</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.setActiveBtn}
              onPress={() => handleSetActive(item)}
            >
              <Text style={styles.setActiveText}>Set as Active</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: 16,
  },
  routineCard: {
    marginBottom: 12,
  },
  activeCard: {
    borderColor: colors.text,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routineName: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  routineMeta: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
  activeBadge: {
    backgroundColor: colors.text,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: colors.background,
    fontSize: 12,
    fontFamily: fonts.semiBold,
  },
  setActiveBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  setActiveText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.semiBold,
  },
});
