import React from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { colors, fonts } from '../../constants';
import { WeightUnit } from '../../models';
import { weightUnitLabel, parseWeightToKg } from '../../utils/units';

export interface TemplateSetRow {
  weight: string;
  repsMin: string;
  repsMax: string;
  editedFields: Set<string>;
}

export const defaultSetRow = (): TemplateSetRow => ({
  weight: '',
  repsMin: '',
  repsMax: '',
  editedFields: new Set(),
});

export function getSuggestion(
  rows: TemplateSetRow[],
  index: number,
  field: 'weight' | 'repsMin' | 'repsMax',
): string {
  if (field === 'repsMax') {
    const row = rows[index];
    const minVal = row.editedFields.has('repsMin') ? row.repsMin : getSuggestion(rows, index, 'repsMin');
    if (minVal) {
      const n = parseInt(minVal, 10);
      if (!isNaN(n)) return String(n + 2);
    }
  }
  for (let i = index - 1; i >= 0; i--) {
    if (rows[i].editedFields.has(field) && rows[i][field] !== '') {
      return rows[i][field];
    }
  }
  return '';
}

export function resolveValue(
  rows: TemplateSetRow[],
  index: number,
  field: 'weight' | 'repsMin' | 'repsMax',
): string {
  const row = rows[index];
  if (row.editedFields.has(field)) return row[field];
  return getSuggestion(rows, index, field);
}

export function buildSetsPayload(
  rows: TemplateSetRow[],
  wUnit: WeightUnit,
  useRepRange: boolean,
) {
  return rows.map((_, i) => ({
    set_number: i + 1,
    target_weight: parseWeightToKg(parseFloat(resolveValue(rows, i, 'weight')) || 0, wUnit),
    target_reps_min: parseInt(resolveValue(rows, i, 'repsMin'), 10) || 10,
    target_reps_max: useRepRange
      ? (parseInt(resolveValue(rows, i, 'repsMax'), 10)
          || parseInt(resolveValue(rows, i, 'repsMin'), 10) || 10)
      : (parseInt(resolveValue(rows, i, 'repsMin'), 10) || 10),
  }));
}

export function setsToTemplateRows(
  sets: { target_weight: number; target_reps_min: number; target_reps_max: number }[],
  fallbackReps: number,
  wUnit: WeightUnit,
): { rows: TemplateSetRow[]; hasRepRange: boolean } {
  if (sets.length === 0) {
    return {
      rows: [{
        weight: '',
        repsMin: String(fallbackReps),
        repsMax: String(fallbackReps),
        editedFields: new Set(['repsMin', 'repsMax']),
      }],
      hasRepRange: false,
    };
  }
  const hasRepRange = sets.some((s) => s.target_reps_min !== s.target_reps_max);
  const rows = sets.map((s) => ({
    weight: s.target_weight > 0
      ? String(wUnit === 'lbs'
          ? Math.round(s.target_weight * 2.20462 * 10) / 10
          : Math.round(s.target_weight * 10) / 10)
      : '',
    repsMin: String(s.target_reps_min),
    repsMax: String(s.target_reps_max),
    editedFields: new Set(['weight', 'repsMin', 'repsMax']),
  }));
  return { rows, hasRepRange };
}

export function validateRepRange(rows: TemplateSetRow[]): boolean {
  const bad = rows.find((_, i) => {
    const min = parseInt(resolveValue(rows, i, 'repsMin'), 10) || 0;
    const max = parseInt(resolveValue(rows, i, 'repsMax'), 10) || 0;
    return min > max;
  });
  if (bad !== undefined) {
    Alert.alert('Invalid Range', 'The minimum reps cannot be greater than the maximum reps.');
    return false;
  }
  return true;
}

export function updateSetRow(
  rows: TemplateSetRow[],
  setRows: (r: TemplateSetRow[]) => void,
  index: number,
  field: 'weight' | 'repsMin' | 'repsMax',
  value: string,
  useRepRange: boolean,
) {
  const updated = rows.map((r) => ({ ...r, editedFields: new Set(r.editedFields) }));
  updated[index][field] = value;
  updated[index].editedFields.add(field);
  if (field === 'repsMin' && !useRepRange) {
    updated[index].repsMax = value;
    updated[index].editedFields.add('repsMax');
  }
  setRows(updated);
}

interface SetsTableEditorProps {
  rows: TemplateSetRow[];
  setRows: (r: TemplateSetRow[]) => void;
  repRange: boolean;
  setRepRange: (v: boolean) => void;
  wUnit: WeightUnit;
}

export function SetsTableEditor({ rows, setRows, repRange, setRepRange, wUnit }: SetsTableEditorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.colHeader, styles.colSet]}>SET</Text>
        <Text style={[styles.colHeader, styles.colWeight]}>{weightUnitLabel(wUnit)}</Text>
        <TouchableOpacity
          style={styles.repsHeaderBtn}
          onPress={() => setRepRange(!repRange)}
        >
          <Text style={styles.colHeader}>
            {repRange ? 'REP RANGE' : 'REPS'}
          </Text>
          <Text style={styles.repsToggleArrow}>▾</Text>
        </TouchableOpacity>
        {rows.length > 1 && <View style={styles.headerSpacer} />}
      </View>

      <ScrollView style={rows.length > 9 ? styles.rowsScroll : undefined} nestedScrollEnabled>
        {rows.map((row, i) => {
          const weightSugg = getSuggestion(rows, i, 'weight');
          const repsMinSugg = getSuggestion(rows, i, 'repsMin');
          const repsMaxSugg = getSuggestion(rows, i, 'repsMax');
          return (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.colCell, styles.colSet]}>{i + 1}</Text>
              <TextInput
                style={[styles.input, styles.colWeight]}
                value={row.editedFields.has('weight') ? row.weight : ''}
                onChangeText={(v) => updateSetRow(rows, setRows, i, 'weight', v, repRange)}
                keyboardType="decimal-pad"
                placeholder={weightSugg || '0'}
                placeholderTextColor={colors.textMuted}
              />
              {repRange ? (
                <View style={styles.repRangeRow}>
                  <TextInput
                    style={[styles.input, styles.repRangeInput]}
                    value={row.editedFields.has('repsMin') ? row.repsMin : ''}
                    onChangeText={(v) => updateSetRow(rows, setRows, i, 'repsMin', v, repRange)}
                    keyboardType="number-pad"
                    placeholder={repsMinSugg || '8'}
                    placeholderTextColor={colors.textMuted}
                  />
                  <Text style={styles.repRangeTo}>to</Text>
                  <TextInput
                    style={[styles.input, styles.repRangeInput]}
                    value={row.editedFields.has('repsMax') ? row.repsMax : ''}
                    onChangeText={(v) => updateSetRow(rows, setRows, i, 'repsMax', v, repRange)}
                    keyboardType="number-pad"
                    placeholder={repsMaxSugg || '12'}
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              ) : (
                <TextInput
                  style={[styles.input, styles.colReps]}
                  value={row.editedFields.has('repsMin') ? row.repsMin : ''}
                  onChangeText={(v) => updateSetRow(rows, setRows, i, 'repsMin', v, repRange)}
                  keyboardType="number-pad"
                  placeholder={repsMinSugg || '10'}
                  placeholderTextColor={colors.textMuted}
                />
              )}
              {rows.length > 1 && (
                <TouchableOpacity
                  style={styles.removeSetBtn}
                  onPress={() => {
                    const updated = rows.filter((_, idx) => idx !== i);
                    setRows(updated);
                  }}
                >
                  <Text style={styles.removeSetText}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={styles.addSetBtn}
        onPress={() => setRows([...rows, defaultSetRow()])}
      >
        <Text style={styles.addSetText}>+ Add Set</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  rowsScroll: {
    maxHeight: 360,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 4,
  },
  colHeader: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.textMuted,
    textAlign: 'center',
  },
  colSet: { width: 36 },
  colWeight: { width: '30%', textAlign: 'center', marginHorizontal: 4 },
  colReps: { flex: 1, textAlign: 'center' },
  repsHeaderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    gap: 4,
  },
  repsToggleArrow: {
    fontSize: 10,
    color: colors.textMuted,
  },
  headerSpacer: {
    width: 28,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  colCell: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
    textAlign: 'center',
    marginHorizontal: 4,
  },
  repRangeRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  repRangeInput: {
    flex: 1,
  },
  repRangeTo: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginHorizontal: 4,
  },
  removeSetBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeSetText: {
    fontSize: 18,
    color: colors.danger,
    fontFamily: fonts.bold,
  },
  addSetBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 4,
  },
  addSetText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
  },
});
