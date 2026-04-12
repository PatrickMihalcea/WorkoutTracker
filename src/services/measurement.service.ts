import { BodyMeasurement, BodyMeasurementUpsertPayload, BODY_MEASUREMENT_COLUMNS, MeasurementValueColumn } from '../models';
import { supabase } from './supabase';

type MeasurementValues = Partial<Pick<BodyMeasurement, MeasurementValueColumn>>;

function normalizeValue(value: number | null | undefined): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 10000) / 10000;
}

function sanitizeValues(values: MeasurementValues): MeasurementValues {
  const out: MeasurementValues = {};
  for (const column of BODY_MEASUREMENT_COLUMNS) {
    out[column] = normalizeValue(values[column]);
  }
  return out;
}

export function hasAnyMeasurementValue(values: MeasurementValues): boolean {
  return BODY_MEASUREMENT_COLUMNS.some((column) => {
    const value = values[column];
    return value !== null && value !== undefined && Number.isFinite(value);
  });
}

async function syncLatestProfileWeight(userId: string): Promise<void> {
  const { data: latest, error: latestErr } = await supabase
    .from('body_measurements')
    .select('body_weight_kg')
    .eq('user_id', userId)
    .not('body_weight_kg', 'is', null)
    .order('logged_on', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestErr) throw latestErr;

  const { error: profileErr } = await supabase
    .from('user_profiles')
    .update({ weight_kg: latest?.body_weight_kg ?? null })
    .eq('id', userId);

  if (profileErr) throw profileErr;
}

export const measurementService = {
  async list(userId: string): Promise<BodyMeasurement[]> {
    const { data, error } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', userId)
      .order('logged_on', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as BodyMeasurement[];
  },

  async upsertByDate(userId: string, payload: BodyMeasurementUpsertPayload): Promise<BodyMeasurement> {
    const values = sanitizeValues(payload);
    if (!hasAnyMeasurementValue(values)) {
      throw new Error('At least one measurement is required.');
    }

    const { data: existing, error: existingErr } = await supabase
      .from('body_measurements')
      .select('id')
      .eq('user_id', userId)
      .eq('logged_on', payload.logged_on)
      .maybeSingle();

    if (existingErr) throw existingErr;

    const now = new Date().toISOString();
    if (existing?.id) {
      const { data, error } = await supabase
        .from('body_measurements')
        .update({ ...values, updated_at: now })
        .eq('id', existing.id)
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) throw error;
      await syncLatestProfileWeight(userId);
      return data as BodyMeasurement;
    }

    const { data, error } = await supabase
      .from('body_measurements')
      .insert({
        user_id: userId,
        logged_on: payload.logged_on,
        ...values,
        updated_at: now,
      })
      .select('*')
      .single();

    if (error) throw error;
    await syncLatestProfileWeight(userId);
    return data as BodyMeasurement;
  },

  async delete(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('body_measurements')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    await syncLatestProfileWeight(userId);
  },

  hasAnyMeasurementValue,
};
