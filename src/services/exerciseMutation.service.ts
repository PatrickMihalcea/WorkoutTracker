import { Exercise, ExerciseInsert } from '../models';
import { useRoutineStore } from '../stores/routine.store';
import { useWorkoutStore } from '../stores/workout.store';
import { exerciseService } from './exercise.service';
import { exerciseMediaService } from './exerciseMedia.service';

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim().length > 0) return error;
  return 'Unknown error';
}

function isMissingMediaError(error: unknown): boolean {
  const message = toErrorMessage(error).toLowerCase();
  return (
    message.includes('nosuchkey') ||
    message.includes('specified key does not exist')
  );
}

export async function deleteCustomExercise(exercise: Exercise): Promise<void> {
  await exerciseService.delete(exercise.id);
  useWorkoutStore.getState().removeExerciseByExerciseId(exercise.id);
  useRoutineStore.getState().removeExerciseReferences(exercise.id);

  // Media cleanup should never block deleting the exercise row.
  try {
    await exerciseMediaService.deleteExerciseMedia(exercise.id);
  } catch (error: unknown) {
    const message = toErrorMessage(error);
    if (isMissingMediaError(error)) {
      console.warn(`[deleteCustomExercise] Media already missing for exercise ${exercise.id}: ${message}`);
      return;
    }
    console.warn(`[deleteCustomExercise] Media cleanup failed for exercise ${exercise.id}: ${message}`);
  }
}

export async function updateCustomExercise(
  exerciseId: string,
  updates: Partial<ExerciseInsert>,
): Promise<Exercise> {
  const updated = await exerciseService.update(exerciseId, updates);
  useWorkoutStore.getState().updateExerciseInState(updated);
  useRoutineStore.getState().updateExerciseReferences(updated);
  return updated;
}
