import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
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
import { RirCircle, SetValueEditorModal } from '../ui';
import { EditableFieldKind, allowsDecimalForField, EditorDirection } from '../set-editor/types';
import { Portal } from '../ui/PortalHost';

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
  onEditorVisibilityChange?: (visible: boolean) => void;
  onFocusRow?: (rowIndex: number) => void;
  onFocusCell?: (cell: TableEditorCell) => void;
  onNavigateBeyondBoundary?: (direction: EditorDirection, fromField: EditableFieldKind, fromFieldIndex: number) => boolean;
  canNavigateBeyondBoundary?: (direction: EditorDirection, fromField: EditableFieldKind) => boolean;
  externalNavigationRequest?: ExternalSetEditorNavigationRequest;
  forceDismissToken?: number;
  onForceDismissHandled?: () => void;
  renderValueEditorInPortal?: boolean;
  valueEditorAnimated?: boolean;
  valueEditorAnimateDoneExit?: boolean;
  getValueEditorOpenDelayMs?: () => number;
}

export interface TableEditorCell {
  rowIndex: number;
  field: EditableFieldKind;
}

interface TableEditorRow {
  rowIndex: number;
  fields: EditableFieldKind[];
}

export interface ExternalSetEditorNavigationRequest {
  token: number;
  direction: EditorDirection;
  preferredField?: EditableFieldKind;
  preferredFieldIndex?: number;
  /** When set, navigate to this specific row index instead of first/last. */
  targetRowIndex?: number;
}

export function SetsTableEditor({
  rows,
  setRows,
  repRange,
  setRepRange,
  wUnit,
  dUnit = 'km',
  exerciseType,
  onEditorVisibilityChange,
  onFocusRow,
  onFocusCell,
  onNavigateBeyondBoundary,
  canNavigateBeyondBoundary,
  externalNavigationRequest,
  forceDismissToken,
  onForceDismissHandled,
  renderValueEditorInPortal = false,
  valueEditorAnimated = true,
  valueEditorAnimateDoneExit = false,
  getValueEditorOpenDelayMs,
}: SetsTableEditorProps) {
  const { colors } = useTheme();
  const [valueEditorVisible, setValueEditorVisible] = useState(false);
  const [valueEditorCell, setValueEditorCell] = useState<TableEditorCell | null>(null);
  const [valueEditorNumeric, setValueEditorNumeric] = useState('');
  const [valueEditorDuration, setValueEditorDuration] = useState(0);
  const [valueEditorRir, setValueEditorRir] = useState<number | null>(null);
  const [valueEditorAnimateOpen, setValueEditorAnimateOpen] = useState(false);
  const [rowLayoutY, setRowLayoutY] = useState<Record<number, number>>({});
  const rowsScrollRef = React.useRef<ScrollView | null>(null);
  const pendingOpenTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const config = getExerciseTypeConfig(exerciseType);

  const showWeight = config.fields.some((f) => f.key === 'weight');
  const showReps = config.fields.some((f) => f.key === 'reps');
  const showDuration = config.fields.some((f) => f.key === 'duration');
  const showDistance = config.fields.some((f) => f.key === 'distance');
  const appliedExternalNavTokenRef = React.useRef<number | null>(null);
  const appliedForceDismissTokenRef = React.useRef<number | undefined>(undefined);
  const lastReportedVisibilityRef = React.useRef(false);
  const onEditorVisibilityChangeRef = React.useRef(onEditorVisibilityChange);

  useEffect(() => {
    onEditorVisibilityChangeRef.current = onEditorVisibilityChange;
  }, [onEditorVisibilityChange]);

  const tableEditorRows = useMemo<TableEditorRow[]>(() => {
    const fields: EditableFieldKind[] = [];
    if (showWeight) fields.push('weight');
    if (showReps) {
      if (repRange) {
        fields.push('repsMin');
        fields.push('repsMax');
      } else {
        fields.push('reps');
      }
    }
    if (showDuration) fields.push('duration');
    if (showDistance) fields.push('distance');
    if (config.showRir) fields.push('rir');
    return rows.map((_row, rowIndex) => ({ rowIndex, fields }));
  }, [config.showRir, repRange, rows, showDistance, showDuration, showReps, showWeight]);

  const scrollCellIntoView = useCallback((cell: TableEditorCell, animated = true) => {
    const targetY = rowLayoutY[cell.rowIndex];
    if (typeof targetY !== 'number') return;
    requestAnimationFrame(() => {
      // Tiny offset so the active row is always near the top of the inner scroll —
      // keeps it at a consistent on-screen height regardless of which row is selected.
      rowsScrollRef.current?.scrollTo({ y: Math.max(0, targetY - 6), animated });
    });
  }, [rowLayoutY]);

  const openValueEditorForCell = (cell: TableEditorCell, animated = true) => {
    const row = rows[cell.rowIndex];
    if (!row) return;
    if (pendingOpenTimeoutRef.current) {
      clearTimeout(pendingOpenTimeoutRef.current);
      pendingOpenTimeoutRef.current = null;
    }
    scrollCellIntoView(cell, animated);
    onFocusRow?.(cell.rowIndex);
    onFocusCell?.(cell);

    setValueEditorCell(cell);
    if (cell.field === 'rir') {
      const rirValue = resolveValue(rows, cell.rowIndex, 'rir');
      setValueEditorRir(rirValue ? parseFloat(rirValue) : null);
    } else if (cell.field === 'duration') {
      const durationValue = resolveValue(rows, cell.rowIndex, 'duration');
      setValueEditorDuration(durationValue ? parseFloat(durationValue) || 0 : 0);
    } else if (cell.field === 'weight') {
      setValueEditorNumeric(resolveValue(rows, cell.rowIndex, 'weight'));
    } else if (cell.field === 'reps') {
      setValueEditorNumeric(resolveValue(rows, cell.rowIndex, 'repsMin'));
    } else if (cell.field === 'repsMin') {
      setValueEditorNumeric(resolveValue(rows, cell.rowIndex, 'repsMin'));
    } else if (cell.field === 'repsMax') {
      setValueEditorNumeric(resolveValue(rows, cell.rowIndex, 'repsMax'));
    } else if (cell.field === 'distance') {
      setValueEditorNumeric(resolveValue(rows, cell.rowIndex, 'distance'));
    } else {
      setValueEditorNumeric('');
    }
    const openDelayMs = valueEditorVisible ? 0 : (getValueEditorOpenDelayMs?.() ?? 0);
    if (openDelayMs > 0) {
      setValueEditorAnimateOpen(true);
      pendingOpenTimeoutRef.current = setTimeout(() => {
        pendingOpenTimeoutRef.current = null;
        setValueEditorVisible(true);
      }, openDelayMs);
      return;
    }
    setValueEditorAnimateOpen(false);
    setValueEditorVisible(true);
  };

  const applyCellValue = (cell: TableEditorCell, value: string | number | null) => {
    if (cell.field === 'rir') {
      updateSetRow(rows, setRows, cell.rowIndex, 'rir', value == null ? '' : String(value), repRange);
      return;
    }
    if (cell.field === 'duration') {
      updateSetRow(rows, setRows, cell.rowIndex, 'duration', String(value ?? 0), repRange);
      return;
    }
    if (cell.field === 'weight') {
      updateSetRow(rows, setRows, cell.rowIndex, 'weight', String(value ?? ''), repRange);
      return;
    }
    if (cell.field === 'reps') {
      updateSetRow(rows, setRows, cell.rowIndex, 'repsMin', String(value ?? ''), repRange);
      return;
    }
    if (cell.field === 'repsMin') {
      updateSetRow(rows, setRows, cell.rowIndex, 'repsMin', String(value ?? ''), repRange);
      return;
    }
    if (cell.field === 'repsMax') {
      updateSetRow(rows, setRows, cell.rowIndex, 'repsMax', String(value ?? ''), repRange);
      return;
    }
    if (cell.field === 'distance') {
      updateSetRow(rows, setRows, cell.rowIndex, 'distance', String(value ?? ''), repRange);
    }
  };

  const findAdjacentCell = (cell: TableEditorCell, direction: 'up' | 'down' | 'left' | 'right'): TableEditorCell | null => {
    const rowIndex = tableEditorRows.findIndex((row) => row.rowIndex === cell.rowIndex);
    if (rowIndex < 0) return null;
    const row = tableEditorRows[rowIndex];
    const fieldIndex = row.fields.indexOf(cell.field);
    if (fieldIndex < 0) return null;

    if (direction === 'left') {
      if (fieldIndex > 0) return { rowIndex: row.rowIndex, field: row.fields[fieldIndex - 1] };
      const prev = tableEditorRows[rowIndex - 1];
      if (!prev) return null;
      return { rowIndex: prev.rowIndex, field: prev.fields[prev.fields.length - 1] };
    }

    if (direction === 'right') {
      if (fieldIndex < row.fields.length - 1) return { rowIndex: row.rowIndex, field: row.fields[fieldIndex + 1] };
      const next = tableEditorRows[rowIndex + 1];
      if (!next) return null;
      return { rowIndex: next.rowIndex, field: next.fields[0] };
    }

    if (direction === 'up') {
      const prev = tableEditorRows[rowIndex - 1];
      if (!prev) return null;
      return { rowIndex: prev.rowIndex, field: prev.fields[Math.min(fieldIndex, prev.fields.length - 1)] };
    }

    const next = tableEditorRows[rowIndex + 1];
    if (!next) return null;
    return { rowIndex: next.rowIndex, field: next.fields[Math.min(fieldIndex, next.fields.length - 1)] };
  };

  const valueEditorCanNavigate = useMemo(() => {
    if (!valueEditorCell) return { up: false, down: false, left: false, right: false };
    const canBoundary = (direction: EditorDirection) =>
      !!canNavigateBeyondBoundary?.(direction, valueEditorCell.field);
    return {
      up: !!findAdjacentCell(valueEditorCell, 'up') || canBoundary('up'),
      down: !!findAdjacentCell(valueEditorCell, 'down') || canBoundary('down'),
      left: !!findAdjacentCell(valueEditorCell, 'left') || canBoundary('left'),
      right: !!findAdjacentCell(valueEditorCell, 'right') || canBoundary('right'),
    };
  }, [canNavigateBeyondBoundary, tableEditorRows, valueEditorCell]); // eslint-disable-line react-hooks/exhaustive-deps

  const toTemplateField = (field: EditableFieldKind): TemplateField => {
    if (field === 'weight') return 'weight';
    if (field === 'reps' || field === 'repsMin') return 'repsMin';
    if (field === 'repsMax') return 'repsMax';
    if (field === 'duration') return 'duration';
    if (field === 'distance') return 'distance';
    return 'rir';
  };

  const navigateFromCell = (cell: TableEditorCell, direction: EditorDirection) => {
    const nextCell = findAdjacentCell(cell, direction);
    if (!nextCell) {
      const currentRow = tableEditorRows.find((row) => row.rowIndex === cell.rowIndex);
      const fromFieldIndex = currentRow ? currentRow.fields.indexOf(cell.field) : -1;
      onNavigateBeyondBoundary?.(direction, cell.field, Math.max(0, fromFieldIndex));
      return;
    }
    openValueEditorForCell(nextCell, false);
  };

  const acceptCurrentCellValue = (cell: TableEditorCell) => {
    if (cell.field === 'rir') {
      if (valueEditorRir != null) {
        applyCellValue(cell, valueEditorRir);
        return;
      }
      const suggested = getSuggestion(rows, cell.rowIndex, 'rir');
      if (suggested !== '') {
        applyCellValue(cell, parseFloat(suggested));
      }
      return;
    }

    if (cell.field === 'duration') {
      if (valueEditorDuration > 0) {
        applyCellValue(cell, valueEditorDuration);
        return;
      }
      const suggested = getSuggestion(rows, cell.rowIndex, 'duration');
      if (suggested !== '') {
        applyCellValue(cell, parseFloat(suggested) || 0);
      }
      return;
    }

    const templateField = toTemplateField(cell.field);
    const typed = (valueEditorNumeric ?? '').trim();
    if (typed.length > 0) {
      applyCellValue(cell, typed);
      return;
    }
    const suggested = getSuggestion(rows, cell.rowIndex, templateField);
    if (suggested !== '') {
      applyCellValue(cell, suggested);
    }
  };

  // Validates rep range before leaving a repsMin/repsMax cell.
  // Calls `action` only when the range is valid; otherwise alerts and re-opens the cell.
  const withRepRangeValidation = (cell: TableEditorCell, action: () => void) => {
    if (!repRange || (cell.field !== 'repsMin' && cell.field !== 'repsMax')) {
      action();
      return;
    }
    const minStr = resolveValue(rows, cell.rowIndex, 'repsMin');
    const maxStr = resolveValue(rows, cell.rowIndex, 'repsMax');
    const minVal = parseFloat(minStr);
    const maxVal = parseFloat(maxStr);
    if (!isNaN(minVal) && !isNaN(maxVal) && minVal > maxVal) {
      Alert.alert('Invalid rep range', 'Min reps cannot be greater than max reps.');
      openValueEditorForCell(cell, false);
      return;
    }
    action();
  };

  const handleModalClose = () => {
    if (!valueEditorCell) {
      setValueEditorAnimateOpen(false);
      setValueEditorVisible(false);
      setValueEditorCell(null);
      return;
    }
    withRepRangeValidation(valueEditorCell, () => {
      setValueEditorAnimateOpen(false);
      setValueEditorVisible(false);
      setValueEditorCell(null);
    });
  };

  const handleModalNavigate = (direction: EditorDirection) => {
    if (!valueEditorCell) return;
    withRepRangeValidation(valueEditorCell, () => navigateFromCell(valueEditorCell, direction));
  };

  const handleModalEnter = () => {
    if (!valueEditorCell) return;
    withRepRangeValidation(valueEditorCell, () => {
      acceptCurrentCellValue(valueEditorCell);
      navigateFromCell(valueEditorCell, 'right');
    });
  };

  useEffect(() => {
    if (!valueEditorCell) return;
    const row = tableEditorRows.find((item) => item.rowIndex === valueEditorCell.rowIndex);
    if (!row || !row.fields.includes(valueEditorCell.field)) {
      setValueEditorAnimateOpen(false);
      setValueEditorVisible(false);
      setValueEditorCell(null);
    }
  }, [tableEditorRows, valueEditorCell]);

  useEffect(() => {
    if (lastReportedVisibilityRef.current === valueEditorVisible) return;
    lastReportedVisibilityRef.current = valueEditorVisible;
    onEditorVisibilityChangeRef.current?.(valueEditorVisible);
  }, [valueEditorVisible]);

  useEffect(() => () => {
    if (pendingOpenTimeoutRef.current) {
      clearTimeout(pendingOpenTimeoutRef.current);
      pendingOpenTimeoutRef.current = null;
    }
    if (!lastReportedVisibilityRef.current) return;
    lastReportedVisibilityRef.current = false;
    onEditorVisibilityChangeRef.current?.(false);
  }, []);

  useEffect(() => {
    if (!externalNavigationRequest) return;
    if (appliedExternalNavTokenRef.current === externalNavigationRequest.token) return;
    appliedExternalNavTokenRef.current = externalNavigationRequest.token;
    if (tableEditorRows.length === 0) return;
    const { targetRowIndex } = externalNavigationRequest;
    const targetRow = typeof targetRowIndex === 'number'
      ? (tableEditorRows.find((r) => r.rowIndex === targetRowIndex) ?? tableEditorRows[0])
      : externalNavigationRequest.direction === 'up' || externalNavigationRequest.direction === 'left'
        ? tableEditorRows[tableEditorRows.length - 1]
        : tableEditorRows[0];
    if (!targetRow || targetRow.fields.length === 0) return;
    const requestedField = externalNavigationRequest.preferredField;
    const requestedFieldIndex = externalNavigationRequest.preferredFieldIndex;
    let targetField: EditableFieldKind | null = null;
    if (typeof requestedFieldIndex === 'number' && Number.isFinite(requestedFieldIndex)) {
      const clampedIndex = Math.max(0, Math.min(targetRow.fields.length - 1, requestedFieldIndex));
      targetField = targetRow.fields[clampedIndex] ?? null;
    } else if (requestedField && targetRow.fields.includes(requestedField)) {
      targetField = requestedField;
    } else if (externalNavigationRequest.direction === 'left') {
      targetField = targetRow.fields[targetRow.fields.length - 1];
    } else {
      targetField = targetRow.fields[0];
    }
    if (!targetField) return;
    openValueEditorForCell({ rowIndex: targetRow.rowIndex, field: targetField }, false);
  }, [externalNavigationRequest, tableEditorRows]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (forceDismissToken == null) return;
    if (appliedForceDismissTokenRef.current === forceDismissToken) return;
    appliedForceDismissTokenRef.current = forceDismissToken;
    if (pendingOpenTimeoutRef.current) {
      clearTimeout(pendingOpenTimeoutRef.current);
      pendingOpenTimeoutRef.current = null;
    }
    if (valueEditorVisible) {
      setValueEditorAnimateOpen(false);
      setValueEditorVisible(false);
      setValueEditorCell(null);
    }
    onForceDismissHandled?.();
  }, [forceDismissToken, onForceDismissHandled, valueEditorVisible]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    rowsScroll: {
      maxHeight: 330,
      flexGrow: 0,
    },
    rowsScrollContent: {
      paddingBottom: 6,
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
    colRir: { width: 36, alignItems: 'center', justifyContent: 'center' },
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
      height: 44,
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
      height: 36,
      paddingVertical: 0,
      paddingHorizontal: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 4,
    },
    activeInput: {
      borderColor: colors.accent,
      backgroundColor: colors.accentDim,
    },
    activeRirInput: {
      borderColor: colors.accent,
      borderWidth: 2,
    },
    valueText: {
      fontSize: 14,
      fontFamily: fonts.regular,
      color: colors.text,
      textAlign: 'center',
    },
    valuePlaceholder: {
      fontSize: 14,
      fontFamily: fonts.regular,
      color: colors.textMuted,
      textAlign: 'center',
    },
    valuePlaceholderActive: {
      color: '#5A5A5A',
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
      height: 36,
      paddingVertical: 0,
      paddingHorizontal: 6,
      gap: 2,
    },
    repsSegmentButton: {
      flex: 1,
      borderRadius: 6,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
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
      height: 36,
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
    durationPlaceholderActive: {
      color: '#5A5A5A',
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

      <ScrollView
        ref={rowsScrollRef}
        style={styles.rowsScroll}
        contentContainerStyle={styles.rowsScrollContent}
        nestedScrollEnabled
      >
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
            <View
              key={i}
              style={styles.tableRow}
              onLayout={(event) => {
                const y = event.nativeEvent.layout.y;
                setRowLayoutY((prev) => (prev[i] === y ? prev : { ...prev, [i]: y }));
              }}
            >
              {row.isWarmup ? (
                <View style={styles.colSet}>
                  <View style={styles.warmupCircle}><Text style={styles.warmupText}>W</Text></View>
                </View>
              ) : (
                <Text style={[styles.colCell, styles.colSet]}>{workingIndex}</Text>
              )}

              {showWeight && (
                <TouchableOpacity
                  style={[
                    styles.input,
                    styles.colWeight,
                    valueEditorCell?.rowIndex === i && valueEditorCell.field === 'weight' && styles.activeInput,
                  ]}
                  onPress={() => openValueEditorForCell({ rowIndex: i, field: 'weight' })}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    row.editedFields.has('weight') && row.weight ? styles.valueText : styles.valuePlaceholder,
                    valueEditorCell?.rowIndex === i
                      && valueEditorCell.field === 'weight'
                      && (!row.editedFields.has('weight') || !row.weight)
                      && styles.valuePlaceholderActive,
                  ]}>
                    {(row.editedFields.has('weight') ? row.weight : '') || weightSugg || '0'}
                  </Text>
                </TouchableOpacity>
              )}

              {showReps && (
                <View
                  style={[
                    styles.repsCol,
                    valueEditorCell?.rowIndex === i && (valueEditorCell.field === 'reps' || valueEditorCell.field === 'repsMin' || valueEditorCell.field === 'repsMax')
                      ? styles.activeInput
                      : undefined,
                  ]}
                >
                  {repRange ? (
                    <>
                      <TouchableOpacity
                        style={[
                          styles.repsSegmentButton,
                          valueEditorCell?.rowIndex === i && valueEditorCell.field === 'repsMin' && styles.activeInput,
                        ]}
                        onPress={() => openValueEditorForCell({ rowIndex: i, field: 'repsMin' })}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          row.editedFields.has('repsMin') && row.repsMin ? styles.valueText : styles.valuePlaceholder,
                          valueEditorCell?.rowIndex === i
                            && valueEditorCell.field === 'repsMin'
                            && (!row.editedFields.has('repsMin') || !row.repsMin)
                            && styles.valuePlaceholderActive,
                        ]}>
                          {(row.editedFields.has('repsMin') ? row.repsMin : '') || repsMinSugg || '8'}
                        </Text>
                      </TouchableOpacity>
                      <Text style={styles.repRangeTo}>to</Text>
                      <TouchableOpacity
                        style={[
                          styles.repsSegmentButton,
                          valueEditorCell?.rowIndex === i && valueEditorCell.field === 'repsMax' && styles.activeInput,
                        ]}
                        onPress={() => openValueEditorForCell({ rowIndex: i, field: 'repsMax' })}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          row.editedFields.has('repsMax') && row.repsMax ? styles.valueText : styles.valuePlaceholder,
                          valueEditorCell?.rowIndex === i
                            && valueEditorCell.field === 'repsMax'
                            && (!row.editedFields.has('repsMax') || !row.repsMax)
                            && styles.valuePlaceholderActive,
                        ]}>
                          {(row.editedFields.has('repsMax') ? row.repsMax : '') || repsMaxSugg || '12'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={styles.repsSegmentButton}
                      onPress={() => openValueEditorForCell({ rowIndex: i, field: 'reps' })}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        row.editedFields.has('repsMin') && row.repsMin ? styles.valueText : styles.valuePlaceholder,
                        valueEditorCell?.rowIndex === i
                          && valueEditorCell.field === 'reps'
                          && (!row.editedFields.has('repsMin') || !row.repsMin)
                          && styles.valuePlaceholderActive,
                      ]}>
                        {(row.editedFields.has('repsMin') ? row.repsMin : '') || repsMinSugg || '10'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {showDuration && (() => {
                const durVal = row.editedFields.has('duration') ? row.duration : '';
                const durNum = durVal ? parseFloat(durVal) || 0 : 0;
                const suggNum = durationSugg ? parseFloat(durationSugg) || 0 : 0;
                return (
                  <TouchableOpacity
                    style={[
                      styles.input,
                      styles.colFlex,
                      styles.durationTouchable,
                      valueEditorCell?.rowIndex === i && valueEditorCell.field === 'duration' && styles.activeInput,
                    ]}
                    onPress={() => openValueEditorForCell({ rowIndex: i, field: 'duration' })}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      durNum > 0 ? styles.durationText : styles.durationPlaceholder,
                      valueEditorCell?.rowIndex === i
                        && valueEditorCell.field === 'duration'
                        && durNum <= 0
                        && styles.durationPlaceholderActive,
                    ]}>
                      {durNum > 0 ? formatDurationValue(durNum) : (suggNum > 0 ? formatDurationValue(suggNum) : '0:00')}
                    </Text>
                  </TouchableOpacity>
                );
              })()}

              {showDistance && (
                <TouchableOpacity
                  style={[
                    styles.input,
                    styles.colFlex,
                    valueEditorCell?.rowIndex === i && valueEditorCell.field === 'distance' && styles.activeInput,
                  ]}
                  onPress={() => openValueEditorForCell({ rowIndex: i, field: 'distance' })}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    row.editedFields.has('distance') && row.distance ? styles.valueText : styles.valuePlaceholder,
                    valueEditorCell?.rowIndex === i
                      && valueEditorCell.field === 'distance'
                      && (!row.editedFields.has('distance') || !row.distance)
                      && styles.valuePlaceholderActive,
                  ]}>
                    {(row.editedFields.has('distance') ? row.distance : '') || distanceSugg || '0'}
                  </Text>
                </TouchableOpacity>
              )}

              {config.showRir && (
                <View style={styles.colRir}>
                  <RirCircle
                    value={rirNum}
                    size={28}
                    onPress={() => openValueEditorForCell({ rowIndex: i, field: 'rir' })}
                    style={valueEditorCell?.rowIndex === i && valueEditorCell.field === 'rir' ? styles.activeRirInput : undefined}
                  />
                </View>
              )}
              {rows.length > 1 && (
                <TouchableOpacity
                  style={styles.removeSetBtn}
                  onPress={() => {
                    const updated = rows.filter((_, idx) => idx !== i);
                    setValueEditorAnimateOpen(false);
                    setValueEditorVisible(false);
                    setValueEditorCell(null);
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
            setValueEditorAnimateOpen(false);
            setValueEditorVisible(false);
            setValueEditorCell(null);
            setRows([...warmups, defaultSetRow(true), ...working]);
          }}
        >
          <Text style={styles.addWarmupText}>+ Warmup</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addSetBtn}
          onPress={() => {
            setValueEditorAnimateOpen(false);
            setValueEditorVisible(false);
            setValueEditorCell(null);
            setRows([...rows, defaultSetRow()]);
          }}
        >
          <Text style={styles.addSetText}>+ Add Set</Text>
        </TouchableOpacity>
      </View>

      {renderValueEditorInPortal ? (
        <Portal>
          <SetValueEditorModal
            visible={valueEditorVisible}
            animated={valueEditorAnimated}
            animateOpen={valueEditorAnimateOpen}
            animateDoneExit={valueEditorAnimateDoneExit}
            field={valueEditorCell?.field ?? null}
            syncKey={valueEditorCell ? `${valueEditorCell.rowIndex}:${valueEditorCell.field}` : undefined}
            title={valueEditorCell?.field ? `Edit ${valueEditorCell.field.toUpperCase()}` : undefined}
            numericValue={valueEditorNumeric}
            allowDecimal={allowsDecimalForField(valueEditorCell?.field)}
            durationValue={valueEditorDuration}
            rirValue={valueEditorRir}
            canNavigate={valueEditorCanNavigate}
            onClose={handleModalClose}
            onDone={handleModalClose}
            onNavigate={handleModalNavigate}
            onEnter={handleModalEnter}
            onNumericValueChange={(nextValue) => {
              setValueEditorNumeric(nextValue);
              if (valueEditorCell) applyCellValue(valueEditorCell, nextValue);
            }}
            onDurationValueChange={(nextValue) => {
              setValueEditorDuration(nextValue);
              if (valueEditorCell) applyCellValue(valueEditorCell, nextValue);
            }}
            onRirValueChange={(nextValue) => {
              setValueEditorRir(nextValue);
              if (valueEditorCell) applyCellValue(valueEditorCell, nextValue);
            }}
          />
        </Portal>
      ) : (
        <SetValueEditorModal
          visible={valueEditorVisible}
          animated={valueEditorAnimated}
          animateOpen={valueEditorAnimateOpen}
          animateDoneExit={valueEditorAnimateDoneExit}
          field={valueEditorCell?.field ?? null}
          syncKey={valueEditorCell ? `${valueEditorCell.rowIndex}:${valueEditorCell.field}` : undefined}
          title={valueEditorCell?.field ? `Edit ${valueEditorCell.field.toUpperCase()}` : undefined}
          numericValue={valueEditorNumeric}
          allowDecimal={allowsDecimalForField(valueEditorCell?.field)}
          durationValue={valueEditorDuration}
          rirValue={valueEditorRir}
          canNavigate={valueEditorCanNavigate}
          onClose={() => {
            setValueEditorAnimateOpen(false);
            setValueEditorVisible(false);
            setValueEditorCell(null);
          }}
          onDone={() => {
            setValueEditorAnimateOpen(false);
            setValueEditorVisible(false);
            setValueEditorCell(null);
          }}
          onNavigate={handleModalNavigate}
          onEnter={handleModalEnter}
          onNumericValueChange={(nextValue) => {
            setValueEditorNumeric(nextValue);
            if (valueEditorCell) applyCellValue(valueEditorCell, nextValue);
          }}
          onDurationValueChange={(nextValue) => {
            setValueEditorDuration(nextValue);
            if (valueEditorCell) applyCellValue(valueEditorCell, nextValue);
          }}
          onRirValueChange={(nextValue) => {
            setValueEditorRir(nextValue);
            if (valueEditorCell) applyCellValue(valueEditorCell, nextValue);
          }}
        />
      )}
    </View>
  );
}
