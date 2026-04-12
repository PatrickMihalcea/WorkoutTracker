import { useState } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useRoutineStore } from '../../../src/stores/routine.store';
import { Button, Input, ChipPicker } from '../../../src/components/ui';
import { colors, fonts } from '../../../src/constants';

export default function CreateRoutineScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { createRoutine } = useRoutineStore();
  const [name, setName] = useState('');
  const [weekCount, setWeekCount] = useState<number>(4);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a routine name');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      const routine = await createRoutine(name.trim(), user.id, weekCount);
      router.replace(`/(tabs)/routines/${routine.id}`);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Input
        label="Routine Name"
        value={name}
        onChangeText={setName}
        placeholder='e.g. "Push Pull Legs" or "Upper Lower"'
        autoFocus
      />
      <Text style={styles.label}>Cycle Length</Text>
      <ChipPicker
        items={[
          { key: '1', label: '1 week', value: 1 },
          { key: '4', label: '4 weeks', value: 4 },
          { key: '6', label: '6 weeks', value: 6 },
          { key: '8', label: '8 weeks', value: 8 },
        ]}
        selected={weekCount}
        onChange={(value) => setWeekCount(value ?? 4)}
        allowDeselect={false}
      />
      <Button title="Create" onPress={handleCreate} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
    marginBottom: 8,
  },
});
