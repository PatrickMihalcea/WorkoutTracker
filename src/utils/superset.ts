import { RoutineDayExercise } from '../models';

export type SupersetGroups = Record<string, string | null>;

export interface ReorderItemSingle {
  type: 'single';
  entry: RoutineDayExercise;
}

export interface ReorderItemSuperset {
  type: 'superset';
  entries: RoutineDayExercise[];
  groupId: string;
}

export type ReorderItem = ReorderItemSingle | ReorderItemSuperset;

function generateGroupId(): string {
  const hex = '0123456789abcdef';
  let id = '';
  for (let i = 0; i < 32; i++) {
    id += hex[Math.floor(Math.random() * 16)];
    if (i === 7 || i === 11 || i === 15 || i === 19) id += '-';
  }
  return id;
}

export function getGroup(
  entryId: string,
  groups: SupersetGroups,
  exercises: RoutineDayExercise[],
): string | null {
  if (groups[entryId] !== undefined) return groups[entryId];
  const ex = exercises.find((e) => e.id === entryId);
  return ex?.superset_group ?? null;
}

function resolveGroups(
  exercises: RoutineDayExercise[],
  groups: SupersetGroups,
): SupersetGroups {
  const resolved: SupersetGroups = {};
  for (const ex of exercises) {
    resolved[ex.id] = groups[ex.id] !== undefined ? groups[ex.id] : (ex.superset_group ?? null);
  }
  return resolved;
}

export function supersetPrev(
  exercises: RoutineDayExercise[],
  index: number,
  groups: SupersetGroups,
): SupersetGroups {
  if (index <= 0) return groups;
  const resolved = resolveGroups(exercises, groups);
  const current = exercises[index];
  const prev = exercises[index - 1];
  const currentGroup = resolved[current.id];
  const prevGroup = resolved[prev.id];

  if (prevGroup && currentGroup && prevGroup !== currentGroup) {
    const merged = { ...resolved };
    const targetGroup = prevGroup;
    for (const id of Object.keys(merged)) {
      if (merged[id] === currentGroup) merged[id] = targetGroup;
    }
    return merged;
  }

  const targetGroup = prevGroup ?? currentGroup ?? generateGroupId();
  const updated = { ...resolved };
  updated[current.id] = targetGroup;
  updated[prev.id] = targetGroup;
  if (currentGroup && currentGroup !== targetGroup) {
    for (const id of Object.keys(updated)) {
      if (updated[id] === currentGroup) updated[id] = targetGroup;
    }
  }
  return updated;
}

export function supersetNext(
  exercises: RoutineDayExercise[],
  index: number,
  groups: SupersetGroups,
): SupersetGroups {
  if (index >= exercises.length - 1) return groups;
  const resolved = resolveGroups(exercises, groups);
  const current = exercises[index];
  const next = exercises[index + 1];
  const currentGroup = resolved[current.id];
  const nextGroup = resolved[next.id];

  if (nextGroup && currentGroup && nextGroup !== currentGroup) {
    const merged = { ...resolved };
    const targetGroup = currentGroup;
    for (const id of Object.keys(merged)) {
      if (merged[id] === nextGroup) merged[id] = targetGroup;
    }
    return merged;
  }

  const targetGroup = currentGroup ?? nextGroup ?? generateGroupId();
  const updated = { ...resolved };
  updated[current.id] = targetGroup;
  updated[next.id] = targetGroup;
  if (nextGroup && nextGroup !== targetGroup) {
    for (const id of Object.keys(updated)) {
      if (updated[id] === nextGroup) updated[id] = targetGroup;
    }
  }
  return updated;
}

export interface SeparateResult {
  groups: SupersetGroups;
  exercises: RoutineDayExercise[];
}

export function separateFromSuperset(
  exercises: RoutineDayExercise[],
  index: number,
  groups: SupersetGroups,
): SeparateResult {
  const resolved = resolveGroups(exercises, groups);
  const current = exercises[index];
  const groupId = resolved[current.id];
  if (!groupId) return { groups: resolved, exercises };

  const updated = { ...resolved };
  updated[current.id] = null;

  const remaining = Object.entries(updated).filter(([, g]) => g === groupId);
  if (remaining.length <= 1) {
    for (const [id] of remaining) {
      updated[id] = null;
    }
  }

  let hasMemberBefore = false;
  for (let i = index - 1; i >= 0; i--) {
    if (resolved[exercises[i].id] === groupId) { hasMemberBefore = true; break; }
  }

  let lastGroupIdx = index;
  for (let i = index + 1; i < exercises.length; i++) {
    if (resolved[exercises[i].id] === groupId) lastGroupIdx = i;
    else break;
  }

  if (hasMemberBefore && lastGroupIdx > index) {
    const reordered = [...exercises];
    const [removed] = reordered.splice(index, 1);
    reordered.splice(lastGroupIdx, 0, removed);
    for (let i = 0; i < reordered.length; i++) {
      reordered[i] = { ...reordered[i], sort_order: i };
    }
    return { groups: updated, exercises: reordered };
  }

  return { groups: updated, exercises };
}

export function getSupersetGroupMembers(
  exercises: RoutineDayExercise[],
  entryId: string,
  groups: SupersetGroups,
): string[] {
  const resolved = resolveGroups(exercises, groups);
  const groupId = resolved[entryId];
  if (!groupId) return [];
  return exercises.filter((e) => resolved[e.id] === groupId).map((e) => e.id);
}

export function autoCleanAfterDelete(
  exercises: RoutineDayExercise[],
  groups: SupersetGroups,
): SupersetGroups {
  const resolved = resolveGroups(exercises, groups);
  const groupCounts = new Map<string, string[]>();
  for (const ex of exercises) {
    const g = resolved[ex.id];
    if (!g) continue;
    if (!groupCounts.has(g)) groupCounts.set(g, []);
    groupCounts.get(g)!.push(ex.id);
  }
  const updated = { ...resolved };
  for (const [groupId, members] of groupCounts) {
    if (members.length <= 1) {
      for (const id of members) updated[id] = null;
    }
  }
  return updated;
}

export type SupersetPosition = 'first' | 'middle' | 'last' | null;

export function getSupersetPosition(
  exercises: RoutineDayExercise[],
  index: number,
  groups: SupersetGroups,
): SupersetPosition {
  const resolved = resolveGroups(exercises, groups);
  const groupId = resolved[exercises[index].id];
  if (!groupId) return null;

  const prevInGroup = index > 0 && resolved[exercises[index - 1].id] === groupId;
  const nextInGroup = index < exercises.length - 1 && resolved[exercises[index + 1].id] === groupId;

  if (!prevInGroup && nextInGroup) return 'first';
  if (prevInGroup && nextInGroup) return 'middle';
  if (prevInGroup && !nextInGroup) return 'last';
  return null;
}

export function buildReorderItems(
  exercises: RoutineDayExercise[],
  groups: SupersetGroups,
): ReorderItem[] {
  const resolved = resolveGroups(exercises, groups);
  const items: ReorderItem[] = [];
  const processed = new Set<string>();

  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    if (processed.has(ex.id)) continue;

    const groupId = resolved[ex.id];
    if (!groupId) {
      items.push({ type: 'single', entry: ex });
      processed.add(ex.id);
      continue;
    }

    const entries: RoutineDayExercise[] = [ex];
    processed.add(ex.id);
    for (let j = i + 1; j < exercises.length; j++) {
      if (resolved[exercises[j].id] === groupId) {
        entries.push(exercises[j]);
        processed.add(exercises[j].id);
      } else {
        break;
      }
    }

    if (entries.length <= 1) {
      items.push({ type: 'single', entry: ex });
    } else {
      items.push({ type: 'superset', entries, groupId });
    }
  }

  return items;
}

export function flattenReorderItems(items: ReorderItem[]): RoutineDayExercise[] {
  const flat: RoutineDayExercise[] = [];
  for (const item of items) {
    if (item.type === 'single') {
      flat.push({ ...item.entry, sort_order: flat.length });
    } else {
      for (const entry of item.entries) {
        flat.push({ ...entry, sort_order: flat.length });
      }
    }
  }
  return flat;
}
