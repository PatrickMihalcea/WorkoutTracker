import {
  Routine,
  RoutineInsert,
  RoutineDay,
  RoutineDayInsert,
  RoutineDayExercise,
  RoutineDayExerciseInsert,
  RoutineDayExerciseSetInsert,
  RoutineWithDays,
  RoutineDayWithExercises,
} from '../models';
import {
  buildNextWeekFromPrevious,
  buildWeekFromBaseline,
} from './progression.engine';
import { supabase } from './supabase';

function daySortValue(dayOfWeek: number | null): number {
  return dayOfWeek ?? 99;
}

function compareRoutineDays(a: RoutineDay, b: RoutineDay): number {
  if (a.week_index !== b.week_index) return a.week_index - b.week_index;
  const dowDiff = daySortValue(a.day_of_week) - daySortValue(b.day_of_week);
  if (dowDiff !== 0) return dowDiff;
  return a.label.localeCompare(b.label);
}

function normalizeRoutineDays(routine: RoutineWithDays): RoutineWithDays {
  routine.days.sort(compareRoutineDays);
  routine.days.forEach((day) => {
    day.exercises.sort((a, b) => a.sort_order - b.sort_order);
    day.exercises.forEach((ex) => {
      ex.sets?.sort((a, b) => a.set_number - b.set_number);
    });
  });
  return routine;
}

function generateGroupId(): string {
  const hex = '0123456789abcdef';
  let id = '';
  for (let i = 0; i < 32; i += 1) {
    id += hex[Math.floor(Math.random() * 16)];
    if (i === 7 || i === 11 || i === 15 || i === 19) id += '-';
  }
  return id;
}

type WeekBuildStrategy = 'exact_copy' | 'incremental' | 'baseline';

type DuplicateWeekOptions = {
  strategy?: WeekBuildStrategy;
  baselineWeekIndex?: number;
  targetUnits?: {
    weightUnit?: 'kg' | 'lbs' | null;
    distanceUnit?: 'km' | 'miles' | null;
  } | null;
};

function cloneSetsExact(
  sets: RoutineDayWithExercises['exercises'][number]['sets'] | undefined,
): Omit<RoutineDayExerciseSetInsert, 'routine_day_exercise_id'>[] {
  return [...(sets ?? [])]
    .sort((a, b) => a.set_number - b.set_number)
    .map((s, index) => ({
      set_number: index + 1,
      target_weight: s.target_weight,
      target_reps_min: s.target_reps_min,
      target_reps_max: s.target_reps_max,
      target_rir: s.target_rir ?? null,
      target_duration: s.target_duration ?? 0,
      target_distance: s.target_distance ?? 0,
      is_warmup: s.is_warmup ?? false,
    }));
}

export type AddWeekMode = 'copy_exact' | 'empty' | 'progressive_ai';
export const MAX_ROUTINE_WEEKS = 8;

export const routineService = {
  async getUserUnitPreferences(
    userId: string,
  ): Promise<{ weightUnit: 'kg' | 'lbs'; distanceUnit: 'km' | 'miles' }> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('weight_unit, distance_unit')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;

    return {
      weightUnit: data?.weight_unit === 'lbs' ? 'lbs' : 'kg',
      distanceUnit: data?.distance_unit === 'miles' ? 'miles' : 'km',
    };
  },

  async getAll(): Promise<Routine[]> {
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getById(id: string): Promise<Routine> {
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async getWithDays(id: string): Promise<RoutineWithDays> {
    const { data, error } = await supabase
      .from('routines')
      .select(`
        *,
        days:routine_days (
          *,
          exercises:routine_day_exercises (
            *,
            exercise:exercises (*),
            sets:routine_day_exercise_sets (*)
          )
        )
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return normalizeRoutineDays(data as RoutineWithDays);
  },

  async getActive(): Promise<RoutineWithDays | null> {
    const { data, error } = await supabase
      .from('routines')
      .select(`
        *,
        days:routine_days (
          *,
          exercises:routine_day_exercises (
            *,
            exercise:exercises (*),
            sets:routine_day_exercise_sets (*)
          )
        )
      `)
      .eq('is_active', true)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return normalizeRoutineDays(data as RoutineWithDays);
  },

  async getDayWithExercises(dayId: string): Promise<RoutineDayWithExercises> {
    const { data, error } = await supabase
      .from('routine_days')
      .select(`
        *,
        exercises:routine_day_exercises (
          *,
          exercise:exercises (*),
          sets:routine_day_exercise_sets (*)
        )
      `)
      .eq('id', dayId)
      .single();
    if (error) throw error;

    const day = data as RoutineDayWithExercises;
    day.exercises.sort((a, b) => a.sort_order - b.sort_order);
    day.exercises.forEach((ex) => {
      ex.sets?.sort((a, b) => a.set_number - b.set_number);
    });
    return day;
  },

  async getDay(dayId: string): Promise<RoutineDay> {
    const { data, error } = await supabase
      .from('routine_days')
      .select('*')
      .eq('id', dayId)
      .single();
    if (error) throw error;
    return data;
  },

  async getDaysForWeek(routineId: string, weekIndex: number): Promise<RoutineDay[]> {
    const { data, error } = await supabase
      .from('routine_days')
      .select('*')
      .eq('routine_id', routineId)
      .eq('week_index', weekIndex);
    if (error) throw error;
    return (data as RoutineDay[]).sort(compareRoutineDays);
  },

  async getWeekWithExercises(
    routineId: string,
    weekIndex: number,
  ): Promise<RoutineDayWithExercises[]> {
    const { data, error } = await supabase
      .from('routine_days')
      .select(`
        *,
        exercises:routine_day_exercises (
          *,
          exercise:exercises (
            exercise_type
          ),
          sets:routine_day_exercise_sets (*)
        )
      `)
      .eq('routine_id', routineId)
      .eq('week_index', weekIndex);
    if (error) throw error;

    return (data as RoutineDayWithExercises[])
      .sort(compareRoutineDays)
      .map((day) => ({
        ...day,
        exercises: [...day.exercises]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((exercise) => ({
            ...exercise,
            sets: [...(exercise.sets ?? [])].sort((a, b) => a.set_number - b.set_number),
          })),
      }));
  },

  async create(routine: RoutineInsert): Promise<Routine> {
    const { data, error } = await supabase
      .from('routines')
      .insert(routine)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<RoutineInsert>): Promise<Routine> {
    const { data, error } = await supabase
      .from('routines')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async setCurrentWeek(id: string, weekIndex: number): Promise<Routine> {
    const routine = await this.getById(id);
    if (weekIndex < 1 || weekIndex > routine.week_count) {
      throw new Error(`Week must be between 1 and ${routine.week_count}`);
    }

    const { data, error } = await supabase
      .from('routines')
      .update({
        current_week: weekIndex,
        current_week_started_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async setWeekCount(id: string, weekCount: number): Promise<Routine> {
    if (!Number.isInteger(weekCount) || weekCount < 1) {
      throw new Error('Week count must be at least 1');
    }
    if (weekCount > MAX_ROUTINE_WEEKS) {
      throw new Error(`Week count cannot exceed ${MAX_ROUTINE_WEEKS}`);
    }

    const routine = await this.getById(id);
    if (weekCount === routine.week_count) return routine;

    if (weekCount > routine.week_count) {
      for (let nextWeek = routine.week_count + 1; nextWeek <= weekCount; nextWeek += 1) {
        await this.duplicateWeekTemplate(id, nextWeek - 1, nextWeek, {
          strategy: 'exact_copy',
        });
      }
    } else {
      const { error: deleteError } = await supabase
        .from('routine_days')
        .delete()
        .eq('routine_id', id)
        .gt('week_index', weekCount);
      if (deleteError) throw deleteError;
    }

    const updates: Partial<RoutineInsert> = { week_count: weekCount };
    if (routine.current_week > weekCount) {
      updates.current_week = weekCount;
      updates.current_week_started_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('routines')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteWeek(routineId: string, weekIndex: number): Promise<Routine> {
    const routine = await this.getById(routineId);
    if (routine.week_count <= 1) {
      throw new Error('A routine must have at least one week');
    }
    if (weekIndex < 1 || weekIndex > routine.week_count) {
      throw new Error(`Week must be between 1 and ${routine.week_count}`);
    }

    const { error: deleteError } = await supabase
      .from('routine_days')
      .delete()
      .eq('routine_id', routineId)
      .eq('week_index', weekIndex);
    if (deleteError) throw deleteError;

    const { data: toShift, error: fetchShiftError } = await supabase
      .from('routine_days')
      .select('id, week_index')
      .eq('routine_id', routineId)
      .gt('week_index', weekIndex)
      .order('week_index', { ascending: true });
    if (fetchShiftError) throw fetchShiftError;

    for (const day of toShift ?? []) {
      const { error: shiftError } = await supabase
        .from('routine_days')
        .update({ week_index: day.week_index - 1 })
        .eq('id', day.id);
      if (shiftError) throw shiftError;
    }

    const nextWeekCount = routine.week_count - 1;
    let nextCurrentWeek = routine.current_week;
    let resetWeekAnchor = false;

    if (routine.current_week > weekIndex) {
      nextCurrentWeek = routine.current_week - 1;
    } else if (routine.current_week === weekIndex) {
      nextCurrentWeek = Math.min(weekIndex, nextWeekCount);
      resetWeekAnchor = true;
    }

    const updates: Partial<RoutineInsert> = {
      week_count: nextWeekCount,
      current_week: nextCurrentWeek,
    };
    if (resetWeekAnchor) {
      updates.current_week_started_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('routines')
      .update(updates)
      .eq('id', routineId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async copyWeek(
    routineId: string,
    sourceWeekIndex: number,
    targetWeekIndex: number,
  ): Promise<void> {
    if (sourceWeekIndex < 1 || targetWeekIndex < 1) return;
    if (sourceWeekIndex === targetWeekIndex) return;

    const routine = await this.getById(routineId);
    if (sourceWeekIndex > routine.week_count || targetWeekIndex > routine.week_count) {
      throw new Error(`Week must be between 1 and ${routine.week_count}`);
    }

    const { error: deleteError } = await supabase
      .from('routine_days')
      .delete()
      .eq('routine_id', routineId)
      .eq('week_index', targetWeekIndex);
    if (deleteError) throw deleteError;

    await this.duplicateWeekTemplate(routineId, sourceWeekIndex, targetWeekIndex, {
      strategy: 'exact_copy',
    });
  },

  async addWeekWithMode(args: {
    routineId: string;
    mode: AddWeekMode;
    sourceWeekIndex?: number;
  }): Promise<number> {
    const { routineId, mode, sourceWeekIndex } = args;
    const routine = await this.getById(routineId);

    if (routine.week_count >= MAX_ROUTINE_WEEKS) {
      throw new Error(`You can have up to ${MAX_ROUTINE_WEEKS} weeks`);
    }

    const newWeek = routine.week_count + 1;
    const sourceWeek = sourceWeekIndex ?? routine.week_count;

    if (mode !== 'empty' && (sourceWeek < 1 || sourceWeek > routine.week_count)) {
      throw new Error(`Week must be between 1 and ${routine.week_count}`);
    }

    const unitPreferences =
      mode === 'progressive_ai'
        ? await this.getUserUnitPreferences(routine.user_id)
        : null;

    const { error: bumpError } = await supabase
      .from('routines')
      .update({ week_count: newWeek })
      .eq('id', routineId);
    if (bumpError) throw bumpError;

    try {
      if (mode === 'copy_exact') {
        await this.duplicateWeekTemplate(routineId, sourceWeek, newWeek, {
          strategy: 'exact_copy',
        });
      } else if (mode === 'progressive_ai') {
        const strategy: WeekBuildStrategy =
          sourceWeek === routine.week_count ? 'incremental' : 'baseline';
        await this.duplicateWeekTemplate(routineId, sourceWeek, newWeek, {
          strategy,
          baselineWeekIndex: sourceWeek,
          targetUnits: unitPreferences,
        });
      }

      return newWeek;
    } catch (error) {
      await supabase
        .from('routine_days')
        .delete()
        .eq('routine_id', routineId)
        .eq('week_index', newWeek);

      await supabase
        .from('routines')
        .update({ week_count: routine.week_count })
        .eq('id', routineId);

      throw error;
    }
  },

  async buildRoutineWeeksFromBaseline(args: {
    routineId: string;
    baselineWeekIndex?: number;
    totalWeekCount: number;
  }): Promise<void> {
    const { routineId, totalWeekCount } = args;
    const baselineWeekIndex = args.baselineWeekIndex ?? 1;

    if (!Number.isInteger(totalWeekCount) || totalWeekCount < 1) {
      throw new Error('Week count must be at least 1');
    }
    if (totalWeekCount > MAX_ROUTINE_WEEKS) {
      throw new Error(`Week count cannot exceed ${MAX_ROUTINE_WEEKS}`);
    }

    const routine = await this.getById(routineId);
    if (baselineWeekIndex < 1 || baselineWeekIndex > routine.week_count) {
      throw new Error(`Baseline week must be between 1 and ${routine.week_count}`);
    }

    const unitPreferences = await this.getUserUnitPreferences(routine.user_id);

    const { error: deleteError } = await supabase
      .from('routine_days')
      .delete()
      .eq('routine_id', routineId)
      .gt('week_index', baselineWeekIndex);
    if (deleteError) throw deleteError;

    for (
      let weekIndex = baselineWeekIndex + 1;
      weekIndex <= totalWeekCount;
      weekIndex += 1
    ) {
      await this.duplicateWeekTemplate(routineId, baselineWeekIndex, weekIndex, {
        strategy: 'baseline',
        baselineWeekIndex,
        targetUnits: unitPreferences,
      });
    }

    const updates: Partial<RoutineInsert> = {
      week_count: totalWeekCount,
    };

    if (routine.current_week > totalWeekCount) {
      updates.current_week = totalWeekCount;
      updates.current_week_started_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('routines')
      .update(updates)
      .eq('id', routineId);
    if (updateError) throw updateError;
  },

  async setActive(id: string, userId: string): Promise<void> {
    await supabase
      .from('routines')
      .update({ is_active: false })
      .eq('user_id', userId);

    const { error } = await supabase
      .from('routines')
      .update({ is_active: true })
      .eq('id', id);
    if (error) throw error;
  },

  async deactivate(id: string): Promise<void> {
    const { error } = await supabase
      .from('routines')
      .update({ is_active: false })
      .eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('routines')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async addDay(day: RoutineDayInsert): Promise<RoutineDay> {
    const { data, error } = await supabase
      .from('routine_days')
      .insert(day)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateDay(id: string, updates: Partial<RoutineDayInsert>): Promise<RoutineDay> {
    const { data, error } = await supabase
      .from('routine_days')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteDay(id: string): Promise<void> {
    const { error } = await supabase
      .from('routine_days')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async addExerciseToDay(
    entry: RoutineDayExerciseInsert,
    sets?: Omit<RoutineDayExerciseSetInsert, 'routine_day_exercise_id'>[],
  ): Promise<RoutineDayExercise> {
    const { data, error } = await supabase
      .from('routine_day_exercises')
      .insert(entry)
      .select('*, exercise:exercises(*)')
      .single();
    if (error) throw error;

    if (sets && sets.length > 0) {
      const setRows = sets.map((s) => ({
        ...s,
        routine_day_exercise_id: data.id,
      }));
      const { data: setsData, error: setsError } = await supabase
        .from('routine_day_exercise_sets')
        .insert(setRows)
        .select();
      if (setsError) throw setsError;
      data.sets = setsData;
    }

    return data;
  },

  async updateExerciseSets(
    exerciseEntryId: string,
    sets: Omit<RoutineDayExerciseSetInsert, 'routine_day_exercise_id'>[],
  ): Promise<void> {
    const { error: delError } = await supabase
      .from('routine_day_exercise_sets')
      .delete()
      .eq('routine_day_exercise_id', exerciseEntryId);
    if (delError) throw delError;

    if (sets.length > 0) {
      const setRows = sets.map((s) => ({
        ...s,
        routine_day_exercise_id: exerciseEntryId,
      }));
      const { error: insError } = await supabase
        .from('routine_day_exercise_sets')
        .insert(setRows);
      if (insError) throw insError;
    }
  },

  async changeExercise(entryId: string, newExerciseId: string): Promise<RoutineDayExercise> {
    const { data, error } = await supabase
      .from('routine_day_exercises')
      .update({ exercise_id: newExerciseId })
      .eq('id', entryId)
      .select('*, exercise:exercises(*), sets:routine_day_exercise_sets(*)')
      .single();
    if (error) throw error;
    return data;
  },

  async updateDayExercise(
    id: string,
    updates: Partial<RoutineDayExerciseInsert>,
  ): Promise<RoutineDayExercise> {
    const { data, error } = await supabase
      .from('routine_day_exercises')
      .update(updates)
      .eq('id', id)
      .select('*, exercise:exercises(*)')
      .single();
    if (error) throw error;
    return data;
  },

  async removeDayExercise(id: string): Promise<void> {
    const { error } = await supabase
      .from('routine_day_exercises')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async setSupersetGroup(entryId: string, group: string | null): Promise<void> {
    const { error } = await supabase
      .from('routine_day_exercises')
      .update({ superset_group: group })
      .eq('id', entryId);
    if (error) throw error;
  },

  async duplicateWeekTemplate(
    routineId: string,
    sourceWeekIndex: number,
    targetWeekIndex: number,
    options?: DuplicateWeekOptions,
  ): Promise<void> {
    if (sourceWeekIndex < 1 || targetWeekIndex < 1) return;

    const strategy: WeekBuildStrategy = options?.strategy ?? 'exact_copy';
    const baselineWeekIndex = options?.baselineWeekIndex ?? 1;
    const fetchWeekIndex =
      strategy === 'baseline' ? baselineWeekIndex : sourceWeekIndex;

    const { data, error } = await supabase
      .from('routine_days')
      .select(`
        *,
        exercises:routine_day_exercises (
          *,
          exercise:exercises (
            exercise_type
          ),
          sets:routine_day_exercise_sets (*)
        )
      `)
      .eq('routine_id', routineId)
      .eq('week_index', fetchWeekIndex);
    if (error) throw error;

    const sourceDays = (data as RoutineDayWithExercises[]).sort(compareRoutineDays);

    for (const sourceDay of sourceDays) {
      const newDay = await this.addDay({
        routine_id: routineId,
        day_of_week: sourceDay.day_of_week,
        label: sourceDay.label,
        week_index: targetWeekIndex,
      });

      const groupMap = new Map<string, string>();
      const exercises = [...sourceDay.exercises].sort((a, b) => a.sort_order - b.sort_order);

      for (const ex of exercises) {
        let setsPayload: Omit<RoutineDayExerciseSetInsert, 'routine_day_exercise_id'>[];

        if (strategy === 'exact_copy') {
          setsPayload = cloneSetsExact(ex.sets);
        } else if (strategy === 'incremental') {
          const progressedSets = buildNextWeekFromPrevious({
            sourceSets: ex.sets ?? [],
            weekIndex: targetWeekIndex,
            exerciseType: ex.exercise?.exercise_type ?? null,
            exerciseId: ex.exercise_id,
            options: options?.targetUnits
              ? {
                  targetUnits: {
                    weightUnit: options.targetUnits.weightUnit,
                    distanceUnit: options.targetUnits.distanceUnit,
                  },
                }
              : undefined,
          });

          setsPayload = progressedSets.map((s) => ({
            set_number: s.set_number,
            target_weight: s.target_weight,
            target_reps_min: s.target_reps_min,
            target_reps_max: s.target_reps_max,
            target_rir: s.target_rir ?? null,
            target_duration: s.target_duration ?? 0,
            target_distance: s.target_distance ?? 0,
            is_warmup: s.is_warmup ?? false,
          }));
        } else {
          const progressedSets = buildWeekFromBaseline({
            sourceSets: ex.sets ?? [],
            weekIndex: targetWeekIndex,
            exerciseType: ex.exercise?.exercise_type ?? null,
            exerciseId: ex.exercise_id,
            options: options?.targetUnits
              ? {
                  targetUnits: {
                    weightUnit: options.targetUnits.weightUnit,
                    distanceUnit: options.targetUnits.distanceUnit,
                  },
                }
              : undefined,
          });

          setsPayload = progressedSets.map((s) => ({
            set_number: s.set_number,
            target_weight: s.target_weight,
            target_reps_min: s.target_reps_min,
            target_reps_max: s.target_reps_max,
            target_rir: s.target_rir ?? null,
            target_duration: s.target_duration ?? 0,
            target_distance: s.target_distance ?? 0,
            is_warmup: s.is_warmup ?? false,
          }));
        }

        const newEntry = await this.addExerciseToDay(
          {
            routine_day_id: newDay.id,
            exercise_id: ex.exercise_id,
            sort_order: ex.sort_order,
            target_sets: setsPayload.length > 0 ? setsPayload.length : ex.target_sets,
            target_reps: setsPayload[0]?.target_reps_min ?? ex.target_reps,
          },
          setsPayload,
        );

        if (ex.superset_group) {
          if (!groupMap.has(ex.superset_group)) {
            groupMap.set(ex.superset_group, generateGroupId());
          }
          await this.setSupersetGroup(newEntry.id, groupMap.get(ex.superset_group)!);
        }
      }
    }
  },

  async duplicateExercise(entryId: string, dayId: string): Promise<void> {
    const day = await this.getDayWithExercises(dayId);
    const source = day.exercises.find((e) => e.id === entryId);
    if (!source) throw new Error('Exercise not found');

    let insertIndex = source.sort_order + 1;
    if (source.superset_group) {
      const lastMember = [...day.exercises]
        .filter((e) => e.superset_group === source.superset_group)
        .sort((a, b) => b.sort_order - a.sort_order)[0];
      if (lastMember) insertIndex = lastMember.sort_order + 1;
    }

    const toShift = day.exercises.filter((e) => e.sort_order >= insertIndex);
    for (const ex of toShift) {
      await this.updateDayExercise(ex.id, { sort_order: ex.sort_order + 1 });
    }

    const setsPayload = (source.sets ?? []).map((s) => ({
      set_number: s.set_number,
      target_weight: s.target_weight,
      target_reps_min: s.target_reps_min,
      target_reps_max: s.target_reps_max,
      target_rir: s.target_rir ?? null,
      target_duration: s.target_duration ?? 0,
      target_distance: s.target_distance ?? 0,
      is_warmup: s.is_warmup ?? false,
    }));

    await this.addExerciseToDay(
      {
        routine_day_id: dayId,
        exercise_id: source.exercise_id,
        sort_order: insertIndex,
        target_sets: source.target_sets,
        target_reps: source.target_reps,
      },
      setsPayload,
    );
  },

  async copyDayTo(dayId: string, targetRoutineId: string, targetWeekIndex: number): Promise<RoutineDay> {
    const source = await this.getDayWithExercises(dayId);

    const newDay = await this.addDay({
      routine_id: targetRoutineId,
      day_of_week: source.day_of_week,
      label: source.label,
      week_index: targetWeekIndex,
    });

    const groupMap = new Map<string, string>();

    for (const ex of source.exercises) {
      const setsPayload = (ex.sets ?? []).map((s) => ({
        set_number: s.set_number,
        target_weight: s.target_weight,
        target_reps_min: s.target_reps_min,
        target_reps_max: s.target_reps_max,
        target_rir: s.target_rir ?? null,
        target_duration: s.target_duration ?? 0,
        target_distance: s.target_distance ?? 0,
        is_warmup: s.is_warmup ?? false,
      }));

      const newEntry = await this.addExerciseToDay(
        {
          routine_day_id: newDay.id,
          exercise_id: ex.exercise_id,
          sort_order: ex.sort_order,
          target_sets: ex.target_sets,
          target_reps: ex.target_reps,
        },
        setsPayload,
      );

      if (ex.superset_group) {
        if (!groupMap.has(ex.superset_group)) {
          groupMap.set(ex.superset_group, generateGroupId());
        }
        await this.setSupersetGroup(newEntry.id, groupMap.get(ex.superset_group)!);
      }
    }

    return newDay;
  },

  async duplicateDay(dayId: string): Promise<RoutineDay> {
    const source = await this.getDayWithExercises(dayId);

    const newDay = await this.addDay({
      routine_id: source.routine_id,
      day_of_week: source.day_of_week,
      label: `${source.label} (copy)`,
      week_index: source.week_index,
    });

    const groupMap = new Map<string, string>();

    for (const ex of source.exercises) {
      const setsPayload = (ex.sets ?? []).map((s) => ({
        set_number: s.set_number,
        target_weight: s.target_weight,
        target_reps_min: s.target_reps_min,
        target_reps_max: s.target_reps_max,
        target_rir: s.target_rir ?? null,
        target_duration: s.target_duration ?? 0,
        target_distance: s.target_distance ?? 0,
        is_warmup: s.is_warmup ?? false,
      }));

      const newEntry = await this.addExerciseToDay(
        {
          routine_day_id: newDay.id,
          exercise_id: ex.exercise_id,
          sort_order: ex.sort_order,
          target_sets: ex.target_sets,
          target_reps: ex.target_reps,
        },
        setsPayload,
      );

      if (ex.superset_group) {
        if (!groupMap.has(ex.superset_group)) {
          groupMap.set(ex.superset_group, generateGroupId());
        }
        await this.setSupersetGroup(newEntry.id, groupMap.get(ex.superset_group)!);
      }
    }

    return newDay;
  },

  async duplicateRoutine(routineId: string, userId: string): Promise<Routine> {
    const source = await this.getWithDays(routineId);

    const newRoutine = await this.create({
      user_id: userId,
      name: `${source.name} (copy)`,
      is_active: false,
      week_count: source.week_count,
      current_week: 1,
    });

    const sortedDays = [...source.days].sort(compareRoutineDays);
    for (const sourceDay of sortedDays) {
      const newDay = await this.addDay({
        routine_id: newRoutine.id,
        day_of_week: sourceDay.day_of_week,
        label: sourceDay.label,
        week_index: sourceDay.week_index,
      });

      const groupMap = new Map<string, string>();
      const exercises = [...sourceDay.exercises].sort((a, b) => a.sort_order - b.sort_order);

      for (const ex of exercises) {
        const setsPayload = (ex.sets ?? [])
          .sort((a, b) => a.set_number - b.set_number)
          .map((s) => ({
            set_number: s.set_number,
            target_weight: s.target_weight,
            target_reps_min: s.target_reps_min,
            target_reps_max: s.target_reps_max,
            target_rir: s.target_rir ?? null,
            target_duration: s.target_duration ?? 0,
            target_distance: s.target_distance ?? 0,
            is_warmup: s.is_warmup ?? false,
          }));

        const newEntry = await this.addExerciseToDay(
          {
            routine_day_id: newDay.id,
            exercise_id: ex.exercise_id,
            sort_order: ex.sort_order,
            target_sets: ex.target_sets,
            target_reps: ex.target_reps,
          },
          setsPayload,
        );

        if (ex.superset_group) {
          if (!groupMap.has(ex.superset_group)) {
            groupMap.set(ex.superset_group, generateGroupId());
          }
          await this.setSupersetGroup(newEntry.id, groupMap.get(ex.superset_group)!);
        }
      }
    }

    return newRoutine;
  },
};
