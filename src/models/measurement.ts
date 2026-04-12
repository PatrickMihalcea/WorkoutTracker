export type MeasurementMetricKey =
  | 'body_weight'
  | 'waist'
  | 'body_fat_pct'
  | 'lean_body_mass'
  | 'neck'
  | 'shoulder'
  | 'chest'
  | 'left_bicep'
  | 'right_bicep'
  | 'left_forearm'
  | 'right_forearm'
  | 'abdomen'
  | 'hips'
  | 'left_thigh'
  | 'right_thigh'
  | 'left_calf'
  | 'right_calf';

export type MeasurementValueColumn =
  | 'body_weight_kg'
  | 'waist_cm'
  | 'body_fat_pct'
  | 'lean_body_mass_kg'
  | 'neck_cm'
  | 'shoulder_cm'
  | 'chest_cm'
  | 'left_bicep_cm'
  | 'right_bicep_cm'
  | 'left_forearm_cm'
  | 'right_forearm_cm'
  | 'abdomen_cm'
  | 'hips_cm'
  | 'left_thigh_cm'
  | 'right_thigh_cm'
  | 'left_calf_cm'
  | 'right_calf_cm';

export type MeasurementGoalColumn = `${MeasurementValueColumn}_goal`;

export interface BodyMeasurement {
  id: string;
  user_id: string;
  logged_on: string;
  body_weight_kg: number | null;
  waist_cm: number | null;
  body_fat_pct: number | null;
  lean_body_mass_kg: number | null;
  neck_cm: number | null;
  shoulder_cm: number | null;
  chest_cm: number | null;
  left_bicep_cm: number | null;
  right_bicep_cm: number | null;
  left_forearm_cm: number | null;
  right_forearm_cm: number | null;
  abdomen_cm: number | null;
  hips_cm: number | null;
  left_thigh_cm: number | null;
  right_thigh_cm: number | null;
  left_calf_cm: number | null;
  right_calf_cm: number | null;
  created_at: string;
  updated_at: string;
}

export type BodyMeasurementUpsertPayload = {
  logged_on: string;
} & Partial<Pick<BodyMeasurement, MeasurementValueColumn>>;

export interface MeasurementMetricDef {
  key: MeasurementMetricKey;
  label: string;
  column: MeasurementValueColumn;
  unitKind: 'weight' | 'circumference' | 'percent';
  color: string;
}

export const BODY_MEASUREMENT_METRICS: MeasurementMetricDef[] = [
  { key: 'body_weight', label: 'Body Weight', column: 'body_weight_kg', unitKind: 'weight', color: '#4ECDC4' },
  { key: 'waist', label: 'Waist', column: 'waist_cm', unitKind: 'circumference', color: '#FF6B6B' },
  { key: 'body_fat_pct', label: 'Body Fat %', column: 'body_fat_pct', unitKind: 'percent', color: '#F7DC6F' },
  { key: 'lean_body_mass', label: 'Lean Body Mass', column: 'lean_body_mass_kg', unitKind: 'weight', color: '#96CEB4' },
  { key: 'neck', label: 'Neck', column: 'neck_cm', unitKind: 'circumference', color: '#45B7D1' },
  { key: 'shoulder', label: 'Shoulder', column: 'shoulder_cm', unitKind: 'circumference', color: '#DDA0DD' },
  { key: 'chest', label: 'Chest', column: 'chest_cm', unitKind: 'circumference', color: '#82E0AA' },
  { key: 'left_bicep', label: 'Left Bicep', column: 'left_bicep_cm', unitKind: 'circumference', color: '#AED6F1' },
  { key: 'right_bicep', label: 'Right Bicep', column: 'right_bicep_cm', unitKind: 'circumference', color: '#AED6F1' },
  { key: 'left_forearm', label: 'Left Forearm', column: 'left_forearm_cm', unitKind: 'circumference', color: '#F0B27A' },
  { key: 'right_forearm', label: 'Right Forearm', column: 'right_forearm_cm', unitKind: 'circumference', color: '#F0B27A' },
  { key: 'abdomen', label: 'Abdomen', column: 'abdomen_cm', unitKind: 'circumference', color: '#98D8C8' },
  { key: 'hips', label: 'Hips', column: 'hips_cm', unitKind: 'circumference', color: '#BB8FCE' },
  { key: 'left_thigh', label: 'Left Thigh', column: 'left_thigh_cm', unitKind: 'circumference', color: '#F1948A' },
  { key: 'right_thigh', label: 'Right Thigh', column: 'right_thigh_cm', unitKind: 'circumference', color: '#F1948A' },
  { key: 'left_calf', label: 'Left Calf', column: 'left_calf_cm', unitKind: 'circumference', color: '#D5DBDB' },
  { key: 'right_calf', label: 'Right Calf', column: 'right_calf_cm', unitKind: 'circumference', color: '#D5DBDB' },
];

export const BODY_MEASUREMENT_COLUMNS: MeasurementValueColumn[] = BODY_MEASUREMENT_METRICS.map((m) => m.column);
