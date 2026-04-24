import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { fonts } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';
import { WeightUnit, DistanceUnit, ExerciseType } from '../../models';
import { weightUnitLabel, distanceUnitLabel, parseWeightToKg } from '../../utils/units';
import { getExerciseTypeConfig, getWeightLabel } from '../../utils/exerciseType';
import { formatDurationValue } from '../../utils/duration';
import { RirCircle, RirPickerModal, DurationPickerModal } from '../ui';

export interface TemplateSetRow {
  weight: string;
  repsMin: string;
  repsMax: string;
  rir: string;
  duration: string;
  distance: string;
  isWarmup: boolean;
  editedFields: Set<string>;
}

export const defaultSetRow = (isWarmup = false): TemplateSetRow => ({
  weight: '',
  repsMin: '',
  repsMax: '',
  rir: '',
  duration: '',
  distance: '',
  isWarmup,
  editedFields: new Set(),
});

type TemplateField = 'weight' | 'repsMin' | 'repsMax' | 'rir' | 'duration' | 'distance';
type RepInputField = 'repsMin' | 'repsMax';

export function getSuggestion(
  rows: TemplateSetRow[],
  index: number,
  field: TemplateField,
): string {
  if (field === 'repsMax') {
    for (let i = index - 1; i >= 0; i--) {
      if (rows[i].editedFields.has('repsMax') && rows[i].repsMax !== '') {
        return rows[i].repsMax;
      }
    }
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
  field: TemplateField,
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
  return rows.map((row, i) => {
    const rirVal = resolveValue(rows, i, 'rir');
    return {
      set_number: i + 1,
      target_weight: parseWeightToKg(parseFloat(resolveValue(rows, i, 'weight')) || 0, wUnit),
      target_reps_min: parseInt(resolveValue(rows, i, 'repsMin'), 10) || 10,
      target_reps_max: useRepRange
        ? (parseInt(resolveValue(rows, i, 'repsMax'), 10)
            || parseInt(resolveValue(rows, i, 'repsMin'), 10) || 10)
        : (parseInt(resolveValue(rows, i, 'repsMin'), 10) || 10),
      target_rir: rirVal ? parseFloat(rirVal) : null,
      target_duration: parseFloat(resolveValue(rows, i, 'duration')) || 0,
      target_distance: parseFloat(resolveValue(rows, i, 'distance')) || 0,
      is_warmup: row.isWarmup,
    };
  });
}

export function setsToTemplateRows(
  sets: { target_weight: number; target_reps_min: number; target_reps_max: number; target_rir?: number | null; target_duration?: number; target_distance?: number; is_warmup?: boolean }[],
  fallbackReps: number,
  wUnit: WeightUnit,
): { rows: TemplateSetRow[]; hasRepRange: boolean } {
  if (sets.length === 0) {
    return {
      rows: [{
        weight: '',
        repsMin: String(fallbackReps),
        repsMax: String(fallbackReps),
        rir: '',
        duration: '',
        distance: '',
        isWarmup: false,
        editedFields: new Set(['repsMin', 'repsMax']),
      }],
      hasRepRange: false,
    };
  }
  const hasRepRange = sets.some((s) => s.target_reps_min !== s.target_reps_max);
  const rows = sets.map((s) => {
    const edited = new Set(['weight', 'repsMin', 'repsMax']);
    const rirStr = s.target_rir != null ? String(s.target_rir) : '';
    if (rirStr) edited.add('rir');
    const durStr = (s.target_duration ?? 0) > 0 ? String(s.target_duration) : '';
    if (durStr) edited.add('duration');
    const distStr = (s.target_distance ?? 0) > 0 ? String(s.target_distance) : '';
    if (distStr) edited.add('distance');
    return {
      weight: s.target_weight > 0
        ? String(wUnit === 'lbs'
            ? Math.round(s.target_weight * 2.20462 * 10) / 10
            : Math.round(s.target_weight * 10) / 10)
        : '',
      repsMin: String(s.target_reps_min),
      repsMax: String(s.target_reps_max),
      rir: rirStr,
      duration: durStr,
      distance: distStr,
      isWarmup: s.is_warmup ?? false,
      editedFields: edited,
    };
  });
  return { rows, hasRepRange };
}

interface RepRangeValidationOptions {
  showAlert?: boolean;
  ignoreIncomplete?: boolean;
  rowIndex?: number;
}

export function validateRepRange(rows: TemplateSetRow[], options: RepRangeValidationOptions = {}): boolean {
  const {
    showAlert = true,
    ignoreIncomplete = false,
    rowIndex,
  } = options;
  const indices = rowIndex != null ? [rowIndex] : rows.map((_row, i) => i);
  const badIndex = indices.find((i) => {
    const minRaw = parseInt(resolveValue(rows, i, 'repsMin'), 10);
    const maxRaw = parseInt(resolveValue(rows, i, 'repsMax'), 10);
    const hasMin = Number.isFinite(minRaw);
    const hasMax = Number.isFinite(maxRaw);
    if (ignoreIncomplete && (!hasMin || !hasMax)) return false;
    const min = hasMin ? minRaw : 0;
    const max = hasMax ? maxRaw : 0;
    return min > max;
  });
  if (badIndex !== undefined) {
    if (!showAlert) return false;
    Alert.alert('Invalid Range', 'The minimum reps cannot be greater than the maximum reps.');
    return false;
  }
  return true;
}

export function updateSetRow(
  rows: TemplateSetRow[],
  setRows: (r: TemplateSetRow[]) => void,
  index: number,
  field: TemplateField,
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
  dUnit?: DistanceUnit;
  exerciseType?: ExerciseType | string;
}

export function SetsTableEditor({ rows, setRows, repRange, setRepRange, wUnit, dUnit = 'km', exerciseType }: SetsTableEditorProps) {
  const { colors } = useTheme();
  const [rirPickerIndex, setRirPickerIndex] = useState<number | null>(null);
  const [durationPickerIndex, setDurationPickerIndex] = useState<number | null>(null);
  const repInputRefs = useRef<Record<string, TextInput | null>>({});
  const config = getExerciseTypeConfig(exerciseType);

  const showWeight = config.fields.some((f) => f.key === 'weight');
  const showReps = config.fields.some((f) => f.key === 'reps');
  const showDuration = config.fields.some((f) => f.key === 'duration');
  const showDistance = config.fields.some((f) => f.key === 'distance');

  const handleRirSelect = (value: number | null) => {
    if (rirPickerIndex === null) return;
    updateSetRow(rows, setRows, rirPickerIndex, 'rir', value != null ? String(value) : '', repRange);
    setRirPickerIndex(null);
  };

  const currentRirValue = rirPickerIndex !== null
    ? (() => {
        const v = resolveValue(rows, rirPickerIndex, 'rir');
        return v ? parseFloat(v) : null;
      })()
    : null;

  const repInputKey = (rowIndex: number, field: RepInputField) => `${rowIndex}:${field}`;

  const setRepInputRef = (rowIndex: number, field: RepInputField) => (input: TextInput | null) => {
    repInputRefs.current[repInputKey(rowIndex, field)] = input;
  };

  const handleRepInputBlur = (rowIndex: number, field: RepInputField) => {
    if (!repRange) return;
    const isInvalid = !validateRepRange(rows, { rowIndex, showAlert: false, ignoreIncomplete: true });
    if (!isInvalid) return;

    setTimeout(() => {
      const focusedInput = TextInput.State.currentlyFocusedInput?.();
      if (focusedInput) return;

      const stillInvalid = !validateRepRange(rows, { rowIndex, showAlert: false, ignoreIncomplete: true });
      if (!stillInvalid) return;

      validateRepRange(rows, { rowIndex, ignoreIncomplete: true, showAlert: true });
      const targetInput = repInputRefs.current[repInputKey(rowIndex, field)];
      targetInput?.focus();
    }, 40);
  };

  const styles = useMemo(() => StyleSheet.create({
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
      color: colors.textSecondary,
      textAlign: 'center',
    },
    colSet: { width: 36, alignItems: 'center', justifyContent: 'center' },
    colWeight: { flex: 1, textAlign: 'center', marginHorizontal: 4 },
    colFlex: { flex: 1, textAlign: 'center', marginHorizontal: 4 },
    colRir: { width: 36, alignItems: 'center' },
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
    repsCol: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 4,
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 6,
      gap: 2,
    },
    repsInner: {
      flex: 1,
      fontSize: 14,
      fontFamily: fonts.regular,
      color: colors.text,
      textAlign: 'center' as const,
      padding: 0,
      margin: 0,
      backgroundColor: 'transparent',
      borderWidth: 0,
    },
    repRangeTo: {
      fontSize: 12,
      fontFamily: fonts.regular,
      color: colors.textMuted,
    },
    removeSetBtn: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeSetText: {
      fontSize: 18,
      color: colors.textMuted,
      fontFamily: fonts.bold,
    },
    addBtnRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 24,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: 4,
    },
    addSetBtn: {
      paddingVertical: 10,
      alignItems: 'center',
    },
    addSetText: {
      fontSize: 13,
      fontFamily: fonts.semiBold,
      color: colors.textSecondary,
    },
    addWarmupText: {
      fontSize: 13,
      fontFamily: fonts.semiBold,
      color: '#D4A017',
    },
    durationTouchable: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 8,
    },
    durationText: {
      fontSize: 14,
      fontFamily: fonts.regular,
      color: colors.text,
      textAlign: 'center',
    },
    durationPlaceholder: {
      fontSize: 14,
      fontFamily: fonts.regular,
      color: colors.textMuted,
      textAlign: 'center',
    },
    warmupCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: '#D4A017',
      alignItems: 'center',
      justifyContent: 'center',
    },
    warmupText: {
      fontSize: 11,
      fontFamily: fonts.bold,
      color: '#fff',
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.colHeader, styles.colSet]}>SET</Text>
        {showWeight && (
          <Text style={[styles.colHeader, styles.colWeight]}>
            {getWeightLabel(exerciseType, weightUnitLabel(wUnit))}
          </Text>
        )}
        {showReps && (
          <TouchableOpacity
            style={styles.repsHeaderBtn}
            onPress={() => setRepRange(!repRange)}
          >
            <Text style={styles.colHeader}>
              {repRange ? 'REP RANGE' : 'REPS'}
            </Text>
            <Text style={styles.repsToggleArrow}>▾</Text>
          </TouchableOpacity>
        )}
        {showDuration && (
          <Text style={[styles.colHeader, styles.colFlex]}>TIME</Text>
        )}
        {showDistance && (
          <Text style={[styles.colHeader, styles.colFlex]}>{distanceUnitLabel(dUnit)}</Text>
        )}
        {config.showRir && <Text style={[styles.colHeader, styles.colRir]}>RIR</Text>}
        {rows.length > 1 && <View style={styles.headerSpacer} />}
      </View>

      <ScrollView style={rows.length > 9 ? styles.rowsScroll : undefined} nestedScrollEnabled>
        {rows.map((row, i) => {
          const weightSugg = getSuggestion(rows, i, 'weight');
          const repsMinSugg = getSuggestion(rows, i, 'repsMin');
          const repsMaxSugg = getSuggestion(rows, i, 'repsMax');
          const durationSugg = getSuggestion(rows, i, 'duration');
          const distanceSugg = getSuggestion(rows, i, 'distance');
          const rirResolved = resolveValue(rows, i, 'rir');
          const rirNum = rirResolved ? parseFloat(rirResolved) : null;
          const workingIndex = rows.slice(0, i + 1).filter((r) => !r.isWarmup).length;
          return (
            <View key={i} style={styles.tableRow}>
              {row.isWarmup ? (
                <View style={styles.colSet}>
                  <View style={styles.warmupCircle}><Text style={styles.warmupText}>W</Text></View>
                </View>
              ) : (
                <Text style={[styles.colCell, styles.colSet]}>{workingIndex}</Text>
              )}

              {showWeight && (
                <TextInput
                  style={[styles.input, styles.colWeight]}
                  value={row.editedFields.has('weight') ? row.weight : ''}
                  onChangeText={(v) => updateSetRow(rows, setRows, i, 'weight', v, repRange)}
                  selectTextOnFocus
                  keyboardType="decimal-pad"
                  placeholder={weightSugg || '0'}
                  placeholderTextColor={colors.textMuted}
                />
              )}

              {showReps && (
                <View style={styles.repsCol}>
                  {repRange ? (
                    <>
                      <TextInput
                        ref={setRepInputRef(i, 'repsMin')}
                        style={styles.repsInner}
                        value={row.editedFields.has('repsMin') ? row.repsMin : ''}
                        onChangeText={(v) => updateSetRow(rows, setRows, i, 'repsMin', v, repRange)}
                        onBlur={() => handleRepInputBlur(i, 'repsMin')}
                        selectTextOnFocus
                        keyboardType="number-pad"
                        placeholder={repsMinSugg || '8'}
                        placeholderTextColor={colors.textMuted}
                        underlineColorAndroid="transparent"
                      />
                      <Text style={styles.repRangeTo}>to</Text>
                      <TextInput
                        ref={setRepInputRef(i, 'repsMax')}
                        style={styles.repsInner}
                        value={row.editedFields.has('repsMax') ? row.repsMax : ''}
                        onChangeText={(v) => updateSetRow(rows, setRows, i, 'repsMax', v, repRange)}
                        onBlur={() => handleRepInputBlur(i, 'repsMax')}
                        selectTextOnFocus
                        keyboardType="number-pad"
                        placeholder={repsMaxSugg || '12'}
                        placeholderTextColor={colors.textMuted}
                        underlineColorAndroid="transparent"
                      />
                    </>
                  ) : (
                    <TextInput
                      style={styles.repsInner}
                      value={row.editedFields.has('repsMin') ? row.repsMin : ''}
                      onChangeText={(v) => updateSetRow(rows, setRows, i, 'repsMin', v, repRange)}
                      selectTextOnFocus
                      keyboardType="number-pad"
                      placeholder={repsMinSugg || '10'}
                      placeholderTextColor={colors.textMuted}
                      underlineColorAndroid="transparent"
                    />
                  )}
                </View>
              )}

              {showDuration && (() => {
                const durVal = row.editedFields.has('duration') ? row.duration : '';
                const durNum = durVal ? parseFloat(durVal) || 0 : 0;
                const suggNum = durationSugg ? parseFloat(durationSugg) || 0 : 0;
                return (
                  <TouchableOpacity
                    style={[styles.input, styles.colFlex, styles.durationTouchable]}
                    onPress={() => setDurationPickerIndex(i)}
                    activeOpacity={0.7}
                  >
                    <Text style={durNum > 0 ? styles.durationText : styles.durationPlaceholder}>
                      {durNum > 0 ? formatDurationValue(durNum) : (suggNum > 0 ? formatDurationValue(suggNum) : '0:00')}
                    </Text>
                  </TouchableOpacity>
                );
              })()}

              {showDistance && (
                <TextInput
                  style={[styles.input, styles.colFlex]}
                  value={row.editedFields.has('distance') ? row.distance : ''}
                  onChangeText={(v) => updateSetRow(rows, setRows, i, 'distance', v, repRange)}
                  selectTextOnFocus
                  keyboardType="decimal-pad"
                  placeholder={distanceSugg || '0'}
                  placeholderTextColor={colors.textMuted}
                />
              )}

              {config.showRir && (
                <View style={styles.colRir}>
                  <RirCircle
                    value={rirNum}
                    size={28}
                    onPress={() => setRirPickerIndex(i)}
                  />
                </View>
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

      <View style={styles.addBtnRow}>
        <TouchableOpacity
          style={styles.addSetBtn}
          onPress={() => {
            const warmups = rows.filter((r) => r.isWarmup);
            const working = rows.filter((r) => !r.isWarmup);
            setRows([...warmups, defaultSetRow(true), ...working]);
          }}
        >
          <Text style={styles.addWarmupText}>+ Warmup</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addSetBtn}
          onPress={() => setRows([...rows, defaultSetRow()])}
        >
          <Text style={styles.addSetText}>+ Add Set</Text>
        </TouchableOpacity>
      </View>

      {config.showRir && (
        <RirPickerModal
          visible={rirPickerIndex !== null}
          onClose={() => setRirPickerIndex(null)}
          onSelect={handleRirSelect}
          currentValue={currentRirValue}
        />
      )}

      <DurationPickerModal
        visible={durationPickerIndex !== null}
        onClose={() => setDurationPickerIndex(null)}
        onConfirm={(totalSeconds) => {
          if (durationPickerIndex !== null) {
            updateSetRow(rows, setRows, durationPickerIndex, 'duration', String(totalSeconds), repRange);
          }
          setDurationPickerIndex(null);
        }}
        value={durationPickerIndex !== null ? (parseFloat(resolveValue(rows, durationPickerIndex, 'duration')) || 0) : 0}
      />
    </View>
  );
}
