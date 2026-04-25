import { WeightUnit, HeightUnit, DistanceUnit } from '../models/profile';

const KG_TO_LBS = 2.20462;
const CM_TO_IN = 0.3937007874;
const KM_TO_MI = 0.6213711922;

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function kgToLbs(kg: number): number {
  return kg * KG_TO_LBS;
}

export function lbsToKg(lbs: number): number {
  return lbs / KG_TO_LBS;
}

export function cmToIn(cm: number): number {
  return cm * CM_TO_IN;
}

export function inToCm(inches: number): number {
  return inches / CM_TO_IN;
}

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm * CM_TO_IN;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  if (inches === 12) {
    return { feet: feet + 1, inches: 0 };
  }
  return { feet, inches };
}

export function feetInchesToCm(feet: number, inches: number): number {
  const totalInches = feet * 12 + inches;
  return totalInches / CM_TO_IN;
}

export function kmToMiles(km: number): number {
  return km * KM_TO_MI;
}

export function milesToKm(miles: number): number {
  return miles / KM_TO_MI;
}

export function formatWeight(kg: number, unit: WeightUnit): string {
  if (unit === 'lbs') return `${roundTo(kgToLbs(kg), 1)}`;
  return `${roundTo(kg, 1)}`;
}

export function parseWeightToKg(value: number, unit: WeightUnit): number {
  if (unit === 'lbs') return lbsToKg(value);
  return value;
}

export function formatHeight(cm: number, unit: HeightUnit): string {
  if (unit === 'in') {
    const { feet, inches } = cmToFeetInches(cm);
    return `${feet}'${inches}"`;
  }
  return `${Math.round(cm)} cm`;
}

export function formatDistance(km: number, unit: DistanceUnit): string {
  if (unit === 'miles') return `${roundTo(kmToMiles(km), 1)} mi`;
  return `${roundTo(km, 1)} km`;
}

export function weightUnitLabel(unit: WeightUnit): string {
  return unit === 'lbs' ? 'LBS' : 'KG';
}

export function distanceUnitLabel(unit: DistanceUnit): string {
  return unit === 'miles' ? 'MI' : 'KM';
}

export function formatDistanceValue(km: number, unit: DistanceUnit): string {
  if (unit === 'miles') return `${roundTo(kmToMiles(km), 1)}`;
  return `${roundTo(km, 1)}`;
}
