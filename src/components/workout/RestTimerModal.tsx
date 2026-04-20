import React, { useEffect, useState, useMemo } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { BottomSheetModal, Button } from '../ui';
import { useTheme } from '../../contexts/ThemeContext';
import { fonts } from '../../constants';

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
  onSave: (seconds: number) => void | Promise<void>;
  onClose: () => void;
  autoSave?: boolean;
}

export function RestTimerModal({
  visible,
  currentValue,
  onSave,
  onClose,
  autoSave = false,
}: RestTimerModalProps) {
  const { colors } = useTheme();
  const androidMenuTextColor = '#111111';
  const [selected, setSelected] = useState(currentValue);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) setSelected(currentValue);
  }, [visible, currentValue]);

  const styles = useMemo(() => StyleSheet.create({
    pickerWrap: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.surfaceLight,
      marginBottom: 12,
      overflow: 'hidden',
    },
    picker: {
      color: colors.text,
      height: Platform.OS === 'android' ? 56 : 216,
    },
    pickerItemIOS: {
      color: colors.text,
      fontSize: 20,
      fontFamily: fonts.regular,
    },
  }), [colors]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(selected);
      onClose();
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message || 'Failed to update rest timer.');
    } finally {
      setSaving(false);
    }
  };

  const handleValueChange = (value: number) => {
    setSelected(value);
    if (!autoSave) return;
    setSaving(true);
    void Promise.resolve(onSave(value))
      .catch((error: unknown) => {
        Alert.alert('Error', (error as Error).message || 'Failed to update rest timer.');
      })
      .finally(() => { setSaving(false); });
  };

  return (
    <BottomSheetModal visible={visible} title="Rest Timer" onClose={onClose}>
      <View style={styles.pickerWrap}>
        <Picker
          selectedValue={selected}
          onValueChange={handleValueChange}
          style={styles.picker}
          itemStyle={Platform.OS === 'ios' ? styles.pickerItemIOS : undefined}
          dropdownIconColor={colors.text}
          mode={Platform.OS === 'android' ? 'dropdown' : undefined}
        >
          {OPTIONS.map((opt) => (
            <Picker.Item
              key={opt.value}
              label={opt.label}
              value={opt.value}
              color={Platform.OS === 'android' ? androidMenuTextColor : colors.text}
            />
          ))}
        </Picker>
      </View>
      {!autoSave && <Button title="Save" onPress={handleSave} loading={saving} />}
    </BottomSheetModal>
  );
}
