import { supabase } from './supabase';
import { Exercise, WeightUnit, DistanceUnit } from '../models';
import { TimeSeriesPoint } from './dashboard.service';
import { kgToLbs, kmToMiles } from '../utils/units';

export interface PersonalRecord {
  label: string;
  value: number;
  formattedValue: string;
  date: string;
}

export interface SetRecord {
  reps: number;
  bestWeight: number;
}

export interface WeightDurationRecord {
  weight: number;
  bestDuration: number;
  worstDuration: number;
}

export interface DistanceRecord {
  distance: number;
  bestDuration: number;
}

export interface ExerciseDetailData {
  exercise: Exercise;
  totalCompletedSets: number;
  lastPerformedAt: string | null;
  timeSeries: Record<string, TimeSeriesPoint[]>;
  personalRecords: PersonalRecord[];
  setRecords: SetRecord[];
  weightDurationRecords: WeightDurationRecord[];
  distanceRecords: DistanceRecord[];
  repProgressionRecords: TimeSeriesPoint[];
}

export interface ExerciseHistorySession {
  sessionId: string;
  startedAt: string;
  completedAt: string | null;
  setCount: number;
  totalReps: number;
  totalVolume: number;
  totalDuration: number;
  totalDistance: number;
  topWeight: number;
  bestSetReps: number;
  setRows: ExerciseHistorySetRow[];
}

export interface ExerciseHistorySetRow {
  setNumber: number;
  isWarmup: boolean;
  weight: number;
  repsPerformed: number;
  rir: number | null;
  duration: number;
  distance: number;
}

export interface ExerciseHistoryData {
  exercise: Exercise;
  sessions: ExerciseHistorySession[];
}

interface RawSet {
  weight: number;
  reps_performed: number;
  rir: number | null;
  is_warmup: boolean;
  duration: number;
  distance: number;
  session: {
    id: string;
    started_at: string;
  };
}

interface RawHistorySet {
  set_number: number;
  is_warmup: boolean;
  weight: number;
  reps_performed: number;
  rir: number | null;
  duration: number;
  distance: number;
  session: {
    id: string;
    started_at: string;
    completed_at: string | null;
  };
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function sessionLabel(startedAt: string): string {
  const d = new Date(startedAt);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

function formatDate(startedAt: string): string {
  const d = new Date(startedAt);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function epley1RM(weight: number, reps: number, rir: number | null): number {
  const effectiveReps = reps + (rir ?? 0);
  return Math.round(weight * (1 + effectiveReps / 30));
}

function groupBySession(sets: RawSet[]): Map<string, { startedAt: string; sets: RawSet[] }> {
  const map = new Map<string, { startedAt: string; sets: RawSet[] }>();
  for (const s of sets) {
    const sid = s.session.id;
    if (!map.has(sid)) map.set(sid, { startedAt: s.session.started_at, sets: [] });
    map.get(sid)!.sets.push(s);
  }
  return map;
}

function toPoint(key: string, label: string, value: number, date: number): TimeSeriesPoint {
  return { key, label, value, date };
}

function buildSessionPoints(
  sessions: Map<string, { startedAt: string; sets: RawSet[] }>,
  valueFn: (sets: RawSet[]) => number,
): TimeSeriesPoint[] {
  return [...sessions.entries()]
    .map(([sid, { startedAt, sets }]) => {
      const v = valueFn(sets);
      return toPoint(sid, sessionLabel(startedAt), v, new Date(startedAt).getTime());
    })
    .filter((p) => p.value > 0)
    .sort((a, b) => a.date - b.date);
}

function buildCumulativeSessionPoints(
  sessions: Map<string, { startedAt: string; sets: RawSet[] }>,
  valueFn: (sets: RawSet[]) => number,
): TimeSeriesPoint[] {
  let runningTotal = 0;
  return [...sessions.entries()]
    .map(([sid, { startedAt, sets }]) => {
      const v = valueFn(sets);
      runningTotal += v;
      return toPoint(sid, sessionLabel(startedAt), runningTotal, new Date(startedAt).getTime());
    })
    .filter((p) => p.value > 0)
    .sort((a, b) => a.date - b.date);
}

function computeWeightRepsTimeSeries(sessions: Map<string, { startedAt: string; sets: RawSet[] }>): Record<string, TimeSeriesPoint[]> {
  return {
    heaviestWeight: buildSessionPoints(sessions, (sets) =>
      Math.max(...sets.map((s) => s.weight)),
    ),
    est1RM: buildSessionPoints(sessions, (sets) =>
      Math.max(...sets.map((s) => epley1RM(s.weight, s.reps_performed, s.rir))),
    ),
    bestSetVolume: buildSessionPoints(sessions, (sets) =>
      Math.max(...sets.map((s) => s.weight * s.reps_performed)),
    ),
    sessionVolume: buildSessionPoints(sessions, (sets) =>
      sets.reduce((sum, s) => sum + s.weight * s.reps_performed, 0),
    ),
    totalReps: buildSessionPoints(sessions, (sets) =>
      sets.reduce((sum, s) => sum + s.reps_performed, 0),
    ),
  };
}

function computeBodyweightRepsTimeSeries(sessions: Map<string, { startedAt: string; sets: RawSet[] }>): Record<string, TimeSeriesPoint[]> {
  return {
    maxReps: buildSessionPoints(sessions, (sets) =>
      Math.max(...sets.map((s) => s.reps_performed)),
    ),
    sessionReps: buildSessionPoints(sessions, (sets) =>
      sets.reduce((sum, s) => sum + s.reps_performed, 0),
    ),
    totalReps: buildSessionPoints(sessions, (sets) =>
      sets.reduce((sum, s) => sum + s.reps_performed, 0),
    ),
  };
}

function computeAssistedBodyweightTimeSeries(sessions: Map<string, { startedAt: string; sets: RawSet[] }>): Record<string, TimeSeriesPoint[]> {
  return {
    lightestAssist: buildSessionPoints(sessions, (sets) => {
      const weights = sets.filter((s) => s.weight > 0).map((s) => s.weight);
      return weights.length > 0 ? Math.min(...weights) : 0;
    }),
    maxReps: buildSessionPoints(sessions, (sets) =>
      Math.max(...sets.map((s) => s.reps_performed)),
    ),
    totalReps: buildSessionPoints(sessions, (sets) =>
      sets.reduce((sum, s) => sum + s.reps_performed, 0),
    ),
  };
}

function computeDurationTimeSeries(sessions: Map<string, { startedAt: string; sets: RawSet[] }>): Record<string, TimeSeriesPoint[]> {
  return {
    longestDuration: buildSessionPoints(sessions, (sets) =>
      Math.max(0, ...sets.map((s) => s.duration)),
    ),
    sessionDuration: buildSessionPoints(sessions, (sets) =>
      sets.reduce((sum, s) => sum + s.duration, 0),
    ),
    totalDuration: buildCumulativeSessionPoints(sessions, (sets) =>
      sets.reduce((sum, s) => sum + s.duration, 0),
    ),
  };
}

function computeDurationWeightTimeSeries(sessions: Map<string, { startedAt: string; sets: RawSet[] }>): Record<string, TimeSeriesPoint[]> {
  return {
    heaviestWeight: buildSessionPoints(sessions, (sets) =>
      Math.max(...sets.map((s) => s.weight)),
    ),
    longestDuration: buildSessionPoints(sessions, (sets) =>
      Math.max(0, ...sets.map((s) => s.duration)),
    ),
    totalDuration: buildCumulativeSessionPoints(sessions, (sets) =>
      sets.reduce((sum, s) => sum + s.duration, 0),
    ),
  };
}

function computeDistanceDurationTimeSeries(sessions: Map<string, { startedAt: string; sets: RawSet[] }>): Record<string, TimeSeriesPoint[]> {
  return {
    farthestDistance: buildSessionPoints(sessions, (sets) =>
      sets.reduce((sum, s) => sum + s.distance, 0),
    ),
    longestDuration: buildSessionPoints(sessions, (sets) =>
      Math.max(0, ...sets.map((s) => s.duration)),
    ),
    bestPace: buildSessionPoints(sessions, (sets) => {
      const totalDistance = sets.reduce((sum, s) => sum + s.distance, 0);
      const totalDuration = sets.reduce((sum, s) => sum + s.duration, 0);
      return totalDistance > 0 && totalDuration > 0 ? totalDistance / (totalDuration / 60) : 0;
    }),
  };
}

function computeWeightDistanceTimeSeries(sessions: Map<string, { startedAt: string; sets: RawSet[] }>): Record<string, TimeSeriesPoint[]> {
  return {
    heaviestWeight: buildSessionPoints(sessions, (sets) =>
      Math.max(...sets.map((s) => s.weight)),
    ),
    farthestDistance: buildSessionPoints(sessions, (sets) =>
      Math.max(...sets.map((s) => s.distance)),
    ),
  };
}

function computeTimeSeries(
  exerciseType: string,
  sessions: Map<string, { startedAt: string; sets: RawSet[] }>,
): Record<string, TimeSeriesPoint[]> {
  switch (exerciseType) {
    case 'weight_reps':
    case 'weighted_bodyweight':
      return computeWeightRepsTimeSeries(sessions);
    case 'bodyweight_reps':
      return computeBodyweightRepsTimeSeries(sessions);
    case 'assisted_bodyweight':
      return computeAssistedBodyweightTimeSeries(sessions);
    case 'duration':
      return computeDurationTimeSeries(sessions);
    case 'duration_weight':
      return computeDurationWeightTimeSeries(sessions);
    case 'distance_duration':
      return computeDistanceDurationTimeSeries(sessions);
    case 'weight_distance':
      return computeWeightDistanceTimeSeries(sessions);
    default:
      return computeWeightRepsTimeSeries(sessions);
  }
}

function computePersonalRecords(
  exerciseType: string,
  allSets: RawSet[],
  sessions: Map<string, { startedAt: string; sets: RawSet[] }>,
  wUnit: WeightUnit,
  dUnit: DistanceUnit,
): PersonalRecord[] {
  const records: PersonalRecord[] = [];

  const findBestSet = (valueFn: (s: RawSet) => number, compare: 'max' | 'min' = 'max') => {
    let best: RawSet | null = null;
    let bestVal = compare === 'max' ? -Infinity : Infinity;
    for (const s of allSets) {
      const v = valueFn(s);
      if (v <= 0) continue;
      if ((compare === 'max' && v > bestVal) || (compare === 'min' && v < bestVal)) {
        bestVal = v;
        best = s;
      }
    }
    return best;
  };

  const findBestSession = (valueFn: (sets: RawSet[]) => number) => {
    let bestKey: string | null = null;
    let bestVal = -Infinity;
    let bestDate = '';
    for (const [, { startedAt, sets }] of sessions) {
      const v = valueFn(sets);
      if (v > bestVal) {
        bestVal = v;
        bestKey = startedAt;
        bestDate = startedAt;
      }
    }
    return bestKey ? { value: bestVal, date: bestDate } : null;
  };

  const fmtDuration = (s: number) => {
    if (s <= 0) return '0:00';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.round(s % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const wLabel = wUnit === 'lbs' ? 'lbs' : 'kg';
  const dLabel = dUnit === 'miles' ? 'mi' : 'km';
  const fmtWeight_ = (w: number) => `${Math.round(w * 10) / 10} ${wLabel}`;
  const fmtVolume = (v: number) => {
    if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
    const rounded = Math.round(v * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  };
  const fmtDist = (d: number) => `${Math.round(d * 10) / 10} ${dLabel}`;
  const fmtPace = (p: number) => `${p.toFixed(2)} ${dLabel}/min`;

  switch (exerciseType) {
    case 'weight_reps':
    case 'weighted_bodyweight': {
      const hw = findBestSet((s) => s.weight);
      if (hw) records.push({ label: 'Heaviest Weight', value: hw.weight, formattedValue: fmtWeight_(hw.weight), date: formatDate(hw.session.started_at) });

      const best1RM = findBestSet((s) => epley1RM(s.weight, s.reps_performed, s.rir));
      if (best1RM) {
        const val = epley1RM(best1RM.weight, best1RM.reps_performed, best1RM.rir);
        records.push({ label: 'Best Est. 1RM', value: val, formattedValue: fmtWeight_(val), date: formatDate(best1RM.session.started_at) });
      }

      const bsv = findBestSet((s) => s.weight * s.reps_performed);
      if (bsv) {
        const val = bsv.weight * bsv.reps_performed;
        records.push({ label: 'Best Set Volume', value: val, formattedValue: fmtVolume(val), date: formatDate(bsv.session.started_at) });
      }

      const bsess = findBestSession((sets) => sets.reduce((sum, s) => sum + s.weight * s.reps_performed, 0));
      if (bsess) records.push({ label: 'Best Session Volume', value: bsess.value, formattedValue: fmtVolume(bsess.value), date: formatDate(bsess.date) });
      break;
    }
    case 'bodyweight_reps': {
      const mr = findBestSet((s) => s.reps_performed);
      if (mr) records.push({ label: 'Max Reps', value: mr.reps_performed, formattedValue: `${mr.reps_performed} reps`, date: formatDate(mr.session.started_at) });

      const bsr = findBestSession((sets) => sets.reduce((sum, s) => sum + s.reps_performed, 0));
      if (bsr) records.push({ label: 'Best Session Reps', value: bsr.value, formattedValue: `${bsr.value} reps`, date: formatDate(bsr.date) });
      break;
    }
    case 'assisted_bodyweight': {
      const la = findBestSet((s) => s.weight, 'min');
      if (la) records.push({ label: 'Lightest Assist', value: la.weight, formattedValue: fmtWeight_(la.weight), date: formatDate(la.session.started_at) });

      const mr = findBestSet((s) => s.reps_performed);
      if (mr) records.push({ label: 'Max Reps', value: mr.reps_performed, formattedValue: `${mr.reps_performed} reps`, date: formatDate(mr.session.started_at) });

      const bsr = findBestSession((sets) => sets.reduce((sum, s) => sum + s.reps_performed, 0));
      if (bsr) records.push({ label: 'Best Session Reps', value: bsr.value, formattedValue: `${bsr.value} reps`, date: formatDate(bsr.date) });
      break;
    }
    case 'duration': {
      const ld = findBestSet((s) => s.duration);
      if (ld) records.push({ label: 'Longest Duration', value: ld.duration, formattedValue: fmtDuration(ld.duration), date: formatDate(ld.session.started_at) });

      const bsd = findBestSession((sets) => sets.reduce((sum, s) => sum + s.duration, 0));
      if (bsd) records.push({ label: 'Best Session Duration', value: bsd.value, formattedValue: fmtDuration(bsd.value), date: formatDate(bsd.date) });
      break;
    }
    case 'duration_weight': {
      const hw = findBestSet((s) => s.weight);
      if (hw) records.push({ label: 'Heaviest Weight', value: hw.weight, formattedValue: fmtWeight_(hw.weight), date: formatDate(hw.session.started_at) });

      const ld = findBestSet((s) => s.duration);
      if (ld) records.push({ label: 'Longest Duration', value: ld.duration, formattedValue: fmtDuration(ld.duration), date: formatDate(ld.session.started_at) });

      const bsd = findBestSession((sets) => sets.reduce((sum, s) => sum + s.duration, 0));
      if (bsd) records.push({ label: 'Best Session Duration', value: bsd.value, formattedValue: fmtDuration(bsd.value), date: formatDate(bsd.date) });
      break;
    }
    case 'distance_duration': {
      const fd = findBestSet((s) => s.distance);
      if (fd) records.push({ label: 'Farthest Distance', value: fd.distance, formattedValue: fmtDist(fd.distance), date: formatDate(fd.session.started_at) });

      const ld = findBestSet((s) => s.duration);
      if (ld) records.push({ label: 'Longest Duration', value: ld.duration, formattedValue: fmtDuration(ld.duration), date: formatDate(ld.session.started_at) });

      const bp = findBestSet((s) => (s.duration > 0 && s.distance > 0) ? s.distance / (s.duration / 60) : 0);
      if (bp) {
        const pace = bp.distance / (bp.duration / 60);
        records.push({ label: 'Best Pace', value: pace, formattedValue: fmtPace(pace), date: formatDate(bp.session.started_at) });
      }
      break;
    }
    case 'weight_distance': {
      const hw = findBestSet((s) => s.weight);
      if (hw) records.push({ label: 'Heaviest Weight', value: hw.weight, formattedValue: fmtWeight_(hw.weight), date: formatDate(hw.session.started_at) });

      const fd = findBestSet((s) => s.distance);
      if (fd) records.push({ label: 'Farthest Distance', value: fd.distance, formattedValue: fmtDist(fd.distance), date: formatDate(fd.session.started_at) });
      break;
    }
  }

  return records;
}

function computeSetRecords(allSets: RawSet[], mode: 'max' | 'min' = 'max'): SetRecord[] {
  const map = new Map<number, number>();
  for (const s of allSets) {
    if (s.weight <= 0 || s.reps_performed <= 0) continue;
    if (!map.has(s.reps_performed)) {
      map.set(s.reps_performed, s.weight);
      continue;
    }
    const existing = map.get(s.reps_performed)!;
    if (mode === 'min') {
      if (s.weight < existing) map.set(s.reps_performed, s.weight);
    } else if (s.weight > existing) {
      map.set(s.reps_performed, s.weight);
    }
  }
  return [...map.entries()]
    .sort(([a], [b]) => a - b)
    .map(([reps, bestWeight]) => ({ reps, bestWeight }));
}

function computeWeightDurationRecords(allSets: RawSet[]): WeightDurationRecord[] {
  const bestMap = new Map<number, number>();
  const worstMap = new Map<number, number>();
  for (const s of allSets) {
    if (s.weight <= 0 || s.duration <= 0) continue;
    const w = s.weight;
    bestMap.set(w, Math.max(bestMap.get(w) ?? 0, s.duration));
    worstMap.set(w, worstMap.has(w) ? Math.min(worstMap.get(w)!, s.duration) : s.duration);
  }
  return [...bestMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([weight, bestDuration]) => ({
      weight,
      bestDuration,
      worstDuration: worstMap.get(weight) ?? bestDuration,
    }));
}

function computeDistanceRecords(allSets: RawSet[]): DistanceRecord[] {
  const map = new Map<number, number>();
  for (const s of allSets) {
    if (s.distance <= 0 || s.duration <= 0) continue;
    const d = s.distance;
    map.set(d, map.has(d) ? Math.min(map.get(d)!, s.duration) : s.duration);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a - b)
    .map(([distance, bestDuration]) => ({ distance, bestDuration }));
}

function computeRepProgression(sessions: Map<string, { startedAt: string; sets: RawSet[] }>): TimeSeriesPoint[] {
  return [...sessions.entries()]
    .map(([sid, { startedAt, sets }]) => {
      const maxReps = Math.max(0, ...sets.map((s) => s.reps_performed));
      return toPoint(sid, sessionLabel(startedAt), maxReps, new Date(startedAt).getTime());
    })
    .filter((p) => p.value > 0)
    .sort((a, b) => a.date - b.date);
}

function computeHistorySessions(sets: RawHistorySet[]): ExerciseHistorySession[] {
  const sessions = new Map<string, ExerciseHistorySession>();

  for (const set of sets) {
    const sessionId = set.session.id;
    const existing = sessions.get(sessionId) ?? {
      sessionId,
      startedAt: set.session.started_at,
      completedAt: set.session.completed_at,
      setCount: 0,
      totalReps: 0,
      totalVolume: 0,
      totalDuration: 0,
      totalDistance: 0,
      topWeight: 0,
      bestSetReps: 0,
      setRows: [],
    };

    existing.setCount += 1;
    existing.totalReps += Math.max(0, set.reps_performed);
    existing.totalVolume += Math.max(0, set.weight) * Math.max(0, set.reps_performed);
    existing.totalDuration += Math.max(0, set.duration);
    existing.totalDistance += Math.max(0, set.distance);
    existing.topWeight = Math.max(existing.topWeight, Math.max(0, set.weight));
    existing.bestSetReps = Math.max(existing.bestSetReps, Math.max(0, set.reps_performed));
    existing.setRows.push({
      setNumber: Math.max(1, set.set_number ?? existing.setRows.length + 1),
      isWarmup: set.is_warmup ?? false,
      weight: Math.max(0, set.weight),
      repsPerformed: Math.max(0, set.reps_performed),
      rir: set.rir,
      duration: Math.max(0, set.duration),
      distance: Math.max(0, set.distance),
    });
    sessions.set(sessionId, existing);
  }

  return [...sessions.values()]
    .map((session) => ({
      ...session,
      setRows: [...session.setRows].sort((a, b) => a.setNumber - b.setNumber),
    }))
    .sort((a, b) => {
      return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
    });
}

export const exerciseDetailService = {
  async getData(userId: string, exerciseId: string, wUnit: WeightUnit = 'kg', dUnit: DistanceUnit = 'km'): Promise<ExerciseDetailData> {
    const { data: exercise, error: exErr } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', exerciseId)
      .single();
    if (exErr) throw exErr;

    const { data: rawSets, error: setsErr } = await supabase
      .from('set_logs')
      .select('weight, reps_performed, rir, is_warmup, duration, distance, session:workout_sessions!inner(id, started_at)')
      .eq('exercise_id', exerciseId)
      .eq('session.user_id', userId)
      .eq('session.status', 'completed')
      .eq('is_warmup', false)
      .order('session(started_at)', { ascending: true });

    if (setsErr) throw setsErr;

    const sets: RawSet[] = (rawSets ?? []).map((r: Record<string, unknown>) => {
      const rawWeight = (r.weight as number) ?? 0;
      const rawDistance = (r.distance as number) ?? 0;
      return {
        weight: wUnit === 'lbs' ? Math.round(kgToLbs(rawWeight) * 10) / 10 : rawWeight,
        reps_performed: (r.reps_performed as number) ?? 0,
        rir: r.rir as number | null,
        is_warmup: (r.is_warmup as boolean) ?? false,
        duration: (r.duration as number) ?? 0,
        distance: dUnit === 'miles' ? Math.round(kmToMiles(rawDistance) * 100) / 100 : rawDistance,
        session: r.session as { id: string; started_at: string },
      };
    });

    const sessions = groupBySession(sets);
    const exerciseType = exercise.exercise_type ?? 'weight_reps';

    const setRecordMode: 'max' | 'min' = exerciseType === 'assisted_bodyweight' ? 'min' : 'max';
    const lastPerformedAt = sets.length > 0
      ? sets[sets.length - 1]?.session.started_at ?? null
      : null;

    return {
      exercise,
      totalCompletedSets: sets.length,
      lastPerformedAt,
      timeSeries: computeTimeSeries(exerciseType, sessions),
      personalRecords: computePersonalRecords(exerciseType, sets, sessions, wUnit, dUnit),
      setRecords: computeSetRecords(sets, setRecordMode),
      weightDurationRecords: computeWeightDurationRecords(sets),
      distanceRecords: computeDistanceRecords(sets),
      repProgressionRecords: computeRepProgression(sessions),
    };
  },
  async getHistoryData(
    userId: string,
    exerciseId: string,
    wUnit: WeightUnit = 'kg',
    dUnit: DistanceUnit = 'km',
  ): Promise<ExerciseHistoryData> {
    const { data: exercise, error: exErr } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', exerciseId)
      .single();
    if (exErr) throw exErr;

    const { data: rawSets, error: setsErr } = await supabase
      .from('set_logs')
      .select('set_number, is_warmup, weight, reps_performed, rir, duration, distance, session:workout_sessions!inner(id, started_at, completed_at)')
      .eq('exercise_id', exerciseId)
      .eq('session.user_id', userId)
      .eq('session.status', 'completed')
      .order('session(started_at)', { ascending: false });

    if (setsErr) throw setsErr;

    const sets: RawHistorySet[] = (rawSets ?? []).map((row: Record<string, unknown>) => {
      const rawWeight = (row.weight as number) ?? 0;
      const rawDistance = (row.distance as number) ?? 0;
      return {
        set_number: (row.set_number as number) ?? 1,
        is_warmup: (row.is_warmup as boolean) ?? false,
        weight: rawWeight,
        reps_performed: (row.reps_performed as number) ?? 0,
        rir: row.rir as number | null,
        duration: (row.duration as number) ?? 0,
        distance: rawDistance,
        session: row.session as { id: string; started_at: string; completed_at: string | null },
      };
    });

    return {
      exercise,
      sessions: computeHistorySessions(sets),
    };
  },
};
