export const FREE_CUSTOM_EXERCISE_LIMIT = 4;

export function canCreateCustomExercise(customExerciseCount: number, isPremium: boolean): boolean {
  return isPremium || customExerciseCount < FREE_CUSTOM_EXERCISE_LIMIT;
}
