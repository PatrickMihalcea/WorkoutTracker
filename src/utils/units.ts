import { WeightUnit, HeightUnit, DistanceUnit } from '../models/profile';

const KG_TO_LBS = 2.205;
const CM_TO_IN = 0.3937;
const KM_TO_MI = 0.6214;

export function kgToLbs(kg: number): number {
  return Math.round(kg * KG_TO_LBS * 10) / 10;
}

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / KG_TO_LBS) * 10) / 10;
}

export function cmToIn(cm: number): number {
  return Math.round(cm * CM_TO_IN * 10) / 10;
}

export function inToCm(inches: number): number {
  return Math.round((inches / CM_TO_IN) * 10) / 10;
}

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm * CM_TO_IN;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches: inches === 12 ? 0 : inches };
}

export function feetInchesToCm(feet: number, inches: number): number {
  const totalInches = feet * 12 + inches;
  return Math.round(totalInches / CM_TO_IN * 10) / 10;
}

export function kmToMiles(km: number): number {
  return Math.round(km * KM_TO_MI * 10) / 10;
}

export function milesToKm(miles: number): number {
  return Math.round((miles / KM_TO_MI) * 10) / 10;
}

export function formatWeight(kg: number, unit: WeightUnit): string {
  if (unit === 'lbs') return `${kgToLbs(kg)}`;
  return `${Math.round(kg * 10) / 10}`;
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
  if (unit === 'miles') return `${kmToMiles(km)} mi`;
  return `${Math.round(km * 10) / 10} km`;
}

export function weightUnitLabel(unit: WeightUnit): string {
  return unit === 'lbs' ? 'LBS' : 'KG';
}
