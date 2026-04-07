import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BottomSheetModal } from './BottomSheetModal';
import { RirCircle } from './RirCircle';
import { colors, fonts } from '../../constants';

const ROW1: (number | null)[] = [null, 0, 0.5, 1];
const ROW2: number[] = [1.5, 2, 3];
const ROW3: number[] = [4, 5, 6];

interface RirPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (value: number | null) => void;
  currentValue: number | null;
}

export function RirPickerModal({ visible, onClose, onSelect, currentValue }: RirPickerModalProps) {
  const handleSelect = (value: number | null) => {
    onSelect(value);
    onClose();
  };

  const renderCircle = (val: number | null) => {
    const key = val === null ? 'clear' : String(val);
    const isSelected = val === currentValue;
    return (
      <View key={key} style={styles.option}>
        <RirCircle
          value={val}
          size={38}
          onPress={() => handleSelect(val)}
          style={isSelected ? styles.selected : undefined}
        />
      </View>
    );
  };

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
      <Text style={styles.title}>Target RIR (Reps in Reserve)</Text>
      <View style={styles.row}>{ROW1.map(renderCircle)}</View>
      <View style={styles.row}>{ROW2.map(renderCircle)}</View>
      <View style={styles.row}>{ROW3.map(renderCircle)}</View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 10,
  },
  option: {
    alignItems: 'center',
  },
  selected: {
    borderWidth: 2,
    borderColor: colors.text,
  },
});
