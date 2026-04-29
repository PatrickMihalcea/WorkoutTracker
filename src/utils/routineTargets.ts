export function targetRepsForVolume(
  set: { target_reps_min: number; target_reps_max: number },
  fallback: number,
): number {
  const min = set.target_reps_min > 0 ? set.target_reps_min : 0;
  const max = set.target_reps_max > 0 ? set.target_reps_max : 0;

  // Treat rep ranges as a minimum prescription for target-volume comparisons.
  if (min > 0) return min;
  if (max > 0) return max;
  return fallback > 0 ? fallback : 0;
}
