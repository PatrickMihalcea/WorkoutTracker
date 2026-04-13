import { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useRoutineStore } from '../../../src/stores/routine.store';
import { Button, Input } from '../../../src/components/ui';
import { colors } from '../../../src/constants';

export default function CreateRoutineScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { createRoutine } = useRoutineStore();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a routine name');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      const routine = await createRoutine(name.trim(), user.id, 1);
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
});
