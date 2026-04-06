import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { BottomSheetModal, Button } from '../ui';
import { colors, fonts } from '../../constants';

function buildOptions(): { value: number; label: string }[] {
  const items: { value: number; label: string }[] = [{ value: 0, label: 'Off' }];
  for (let s = 5; s <= 300; s += 5) {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    if (mins === 0) {
      items.push({ value: s, label: `${secs}s` });
    } else {
      items.push({ value: s, label: `${mins}m ${secs}s` });
    }
  }
  return items;
}

const OPTIONS = buildOptions();

interface RestTimerModalProps {
  visible: boolean;
  currentValue: number;
  onSave: (seconds: number) => void;
  onClose: () => void;
}

export function RestTimerModal({ visible, currentValue, onSave, onClose }: RestTimerModalProps) {
  const [selected, setSelected] = useState(currentValue);

  useEffect(() => {
    if (visible) {
      setSelected(currentValue);
    }
  }, [visible, currentValue]);

  const handleSave = () => {
    onSave(selected);
    onClose();
  };

  return (
    <BottomSheetModal visible={visible} title="Rest Timer" onClose={onClose}>
      <Picker
        selectedValue={selected}
        onValueChange={(value) => setSelected(value)}
        itemStyle={styles.pickerItem}
      >
        {OPTIONS.map((opt) => (
          <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
        ))}
      </Picker>

      <Button title="Save" onPress={handleSave} />
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  pickerItem: {
    color: colors.text,
    fontSize: 20,
    fontFamily: fonts.regular,
  },
});
