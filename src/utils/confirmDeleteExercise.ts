import { Alert } from 'react-native';
import { Exercise } from '../models';
import { sessionService } from '../services';
import { deleteCustomExercise } from '../services/exerciseMutation.service';

export async function confirmDeleteExercise(
  exercise: Exercise,
  userId: string,
  onDeleted: () => void,
): Promise<void> {
  let hasLogs = false;
  try {
    const sets = await sessionService.getLastSessionSets(exercise.id, userId);
    hasLogs = sets.length > 0;
  } catch {
    // Assume no logs on error
  }

  const message = hasLogs
    ? `Permanently delete "${exercise.name}"?\n\nWARNING: This exercise has logged workout history. All sets logged for this exercise will be permanently deleted.`
    : `Permanently delete "${exercise.name}"? This will also remove it from any routine days using it.`;

  Alert.alert('Delete Exercise', message, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: hasLogs ? 'Delete Everything' : 'Delete',
      style: 'destructive',
      onPress: async () => {
        try {
          await deleteCustomExercise(exercise);
          onDeleted();
        } catch {
          Alert.alert('Error', 'Could not delete exercise.');
        }
      },
    },
  ]);
}
