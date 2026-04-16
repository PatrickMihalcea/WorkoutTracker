import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { fonts } from '../../constants';

export interface HeaderDropdownOption<T extends string> {
  key: T;
  label: string;
}

interface HeaderDropdownProps<T extends string> {
  options: HeaderDropdownOption<T>[];
  selectedKey: T;
  onSelect: (key: T) => void;
  fallbackLabel: string;
}

export function HeaderDropdown<T extends string>({
  options,
  selectedKey,
  onSelect,
  fallbackLabel,
}: HeaderDropdownProps<T>) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const label = useMemo(
    () => options.find((o) => o.key === selectedKey)?.label ?? fallbackLabel,
    [options, selectedKey, fallbackLabel],
  );

  const styles = useMemo(() => StyleSheet.create({
    dropdown: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dropdownText: { fontSize: 17, fontFamily: fonts.bold, color: colors.text },
    dropdownChevron: { fontSize: 14, color: colors.textSecondary, marginTop: 1 },
    overlay: { flex: 1, paddingTop: 90, alignItems: 'center' },
    menu: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingVertical: 4,
      minWidth: 180,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    menuItem: { paddingVertical: 12, paddingHorizontal: 20 },
    menuItemActive: { backgroundColor: colors.accentDim },
    menuItemText: { fontSize: 16, fontFamily: fonts.regular, color: colors.text },
    menuItemTextActive: { fontFamily: fonts.bold, color: colors.accent },
  }), [colors]);

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} style={styles.dropdown} activeOpacity={0.7}>
        <Text style={styles.dropdownText}>{label}</Text>
        <Text style={styles.dropdownChevron}>{open ? '▴' : '▾'}</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={styles.menu}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.menuItem, selectedKey === opt.key && styles.menuItemActive]}
                activeOpacity={0.7}
                onPress={() => {
                  onSelect(opt.key);
                  setOpen(false);
                }}
              >
                <Text style={[styles.menuItemText, selectedKey === opt.key && styles.menuItemTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
