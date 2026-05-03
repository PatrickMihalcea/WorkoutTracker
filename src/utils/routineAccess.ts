import type { Routine } from '../models';

export const FREE_ROUTINE_LIMIT = 2;

function compareRoutinesOldestFirst(left: Routine, right: Routine): number {
  const leftTime = Date.parse(left.created_at);
  const rightTime = Date.parse(right.created_at);

  if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) {
    return leftTime - rightTime;
  }

  if (left.created_at !== right.created_at) {
    return left.created_at.localeCompare(right.created_at);
  }

  return left.id.localeCompare(right.id);
}

export function getUnlockedRoutineIds(routines: Routine[], isPremium: boolean): Set<string> {
  if (isPremium) {
    return new Set(routines.map((routine) => routine.id));
  }

  return new Set(
    [...routines]
      .sort(compareRoutinesOldestFirst)
      .slice(0, FREE_ROUTINE_LIMIT)
      .map((routine) => routine.id),
  );
}

export function getLockedRoutineIds(routines: Routine[], isPremium: boolean): Set<string> {
  const unlocked = getUnlockedRoutineIds(routines, isPremium);
  return new Set(routines.filter((routine) => !unlocked.has(routine.id)).map((routine) => routine.id));
}

export function isRoutineLocked(routineId: string, routines: Routine[], isPremium: boolean): boolean {
  return getLockedRoutineIds(routines, isPremium).has(routineId);
}

export function canCreateAnotherRoutine(routines: Routine[], isPremium: boolean): boolean {
  return isPremium || routines.length < FREE_ROUTINE_LIMIT;
}
