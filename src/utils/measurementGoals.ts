import { BODY_MEASUREMENT_METRICS, MeasurementGoalColumn, MeasurementMetricKey } from '../models/measurement';
import { HeightUnit, UserProfile, WeightUnit } from '../models/profile';

const KG_TO_LBS = 2.20462;
const CM_TO_IN = 0.3937007874;

const GOAL_FIELD_BY_METRIC: Record<MeasurementMetricKey, MeasurementGoalColumn> = BODY_MEASUREMENT_METRICS.reduce(
  (acc, metric) => {
    acc[metric.key] = `${metric.column}_goal` as MeasurementGoalColumn;
    return acc;
  },
  {} as Record<MeasurementMetricKey, MeasurementGoalColumn>,
);

export function measurementGoalFieldForMetric(metricKey: MeasurementMetricKey): MeasurementGoalColumn {
  return GOAL_FIELD_BY_METRIC[metricKey];
}

export function getMeasurementGoalFromProfile(
  profile: UserProfile | null | undefined,
  metricKey: MeasurementMetricKey,
): number | null {
  if (!profile) return null;
  const field = measurementGoalFieldForMetric(metricKey);
  const raw = profile[field as keyof UserProfile];
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : null;
}

export function measurementGoalToDisplay(
  metricKey: MeasurementMetricKey,
  storedValue: number,
  weightUnit: WeightUnit,
  heightUnit: HeightUnit,
): number {
  const metric = BODY_MEASUREMENT_METRICS.find((item) => item.key === metricKey);
  if (!metric) return storedValue;
  if (metric.unitKind === 'weight') return weightUnit === 'lbs' ? storedValue * KG_TO_LBS : storedValue;
  if (metric.unitKind === 'circumference') return heightUnit === 'in' ? storedValue * CM_TO_IN : storedValue;
  return storedValue;
}

export function measurementGoalToStored(
  metricKey: MeasurementMetricKey,
  displayValue: number,
  weightUnit: WeightUnit,
  heightUnit: HeightUnit,
): number {
  const metric = BODY_MEASUREMENT_METRICS.find((item) => item.key === metricKey);
  if (!metric) return displayValue;
  if (metric.unitKind === 'weight') return weightUnit === 'lbs' ? displayValue / KG_TO_LBS : displayValue;
  if (metric.unitKind === 'circumference') return heightUnit === 'in' ? displayValue / CM_TO_IN : displayValue;
  return displayValue;
}

export function measurementUnitLabelForMetric(
  metricKey: MeasurementMetricKey,
  weightUnit: WeightUnit,
  heightUnit: HeightUnit,
): string {
  const metric = BODY_MEASUREMENT_METRICS.find((item) => item.key === metricKey);
  if (!metric) return '';
  if (metric.unitKind === 'weight') return weightUnit === 'lbs' ? 'lbs' : 'kg';
  if (metric.unitKind === 'circumference') return heightUnit === 'in' ? 'in' : 'cm';
  return '%';
}
