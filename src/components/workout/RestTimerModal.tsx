import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
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
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          <Text style={styles.title}>Rest Timer</Text>

          <Picker
            selectedValue={selected}
            onValueChange={(value) => setSelected(value)}
            itemStyle={styles.pickerItem}
          >
            {OPTIONS.map((opt) => (
              <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
            ))}
          </Picker>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.7}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  pickerItem: {
    color: colors.text,
    fontSize: 20,
    fontFamily: fonts.regular,
  },
  saveBtn: {
    backgroundColor: colors.text,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveText: {
    color: colors.background,
    fontSize: 16,
    fontFamily: fonts.semiBold,
  },
});
