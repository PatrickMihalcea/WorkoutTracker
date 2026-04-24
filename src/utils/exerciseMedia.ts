import type { ExerciseMediaType } from '../models';

export interface ExerciseMediaLike {
  media_type?: ExerciseMediaType | null;
  media_url?: string | null;
  thumbnail_url?: string | null;
}

export function getExerciseThumbnailUrl(exercise?: ExerciseMediaLike | null): string | null {
  if (!exercise) return null;
  if (exercise.thumbnail_url) return exercise.thumbnail_url;
  if (exercise.media_type === 'image' || exercise.media_type === 'gif') {
    return exercise.media_url ?? null;
  }
  return null;
}

export function getExercisePreviewUrl(exercise?: ExerciseMediaLike | null): string | null {
  if (!exercise) return null;
  if (exercise.media_type === 'video') {
    return exercise.thumbnail_url ?? exercise.media_url ?? null;
  }
  return exercise.media_url ?? exercise.thumbnail_url ?? null;
}
