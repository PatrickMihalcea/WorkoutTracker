export type EditableFieldKind =
  | 'weight'
  | 'reps'
  | 'repsMin'
  | 'repsMax'
  | 'distance'
  | 'duration'
  | 'rir';

export interface EditableCellRef {
  entryId?: string;
  rowId: string;
  field: EditableFieldKind;
}

export type EditorDirection = 'up' | 'down' | 'left' | 'right';

export const RIR_STEP_VALUES: (number | null)[] = [
  null,
  0,
  0.5,
  1,
  1.5,
  2,
  3,
  4,
  5,
  6,
];

export function isNumericEditableField(field: EditableFieldKind | null | undefined): field is Exclude<EditableFieldKind, 'duration' | 'rir'> {
  return field === 'weight'
    || field === 'reps'
    || field === 'repsMin'
    || field === 'repsMax'
    || field === 'distance';
}

export function allowsDecimalForField(field: EditableFieldKind | null | undefined): boolean {
  return field === 'weight' || field === 'distance';
}

export function getEditableFieldLabel(field: EditableFieldKind | null | undefined): string {
  if (!field) return 'Value';
  switch (field) {
    case 'weight':
      return 'Weight';
    case 'reps':
      return 'Reps';
    case 'repsMin':
      return 'Min Reps';
    case 'repsMax':
      return 'Max Reps';
    case 'distance':
      return 'Distance';
    case 'duration':
      return 'Duration';
    case 'rir':
      return 'RIR';
    default:
      return 'Value';
  }
}

