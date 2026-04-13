import { Exercise, ExerciseInsert } from '../models';
import { useRoutineStore } from '../stores/routine.store';
import { useWorkoutStore } from '../stores/workout.store';
import { exerciseService } from './exercise.service';

export async function deleteCustomExercise(exercise: Exercise): Promise<void> {
  await exerciseService.delete(exercise.id);
  useWorkoutStore.getState().removeExerciseByExerciseId(exercise.id);
  useRoutineStore.getState().removeExerciseReferences(exercise.id);
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
