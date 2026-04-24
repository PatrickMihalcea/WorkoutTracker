import { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { fonts } from '../../constants';

export interface FieldDropdownOption<T extends string | number> {
  key: string;
  label: string;
  value: T;
  description?: string;
}

interface FieldDropdownProps<T extends string | number> {
  selected: T | null;
  options: FieldDropdownOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
}

export function FieldDropdown<T extends string | number>({
  selected,
  options,
  onChange,
  placeholder = 'Select',
}: FieldDropdownProps<T>) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === selected);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    trigger: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      backgroundColor: colors.surfaceLight,
      paddingHorizontal: 12,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    triggerTextWrap: {
      flex: 1,
    },
    triggerText: {
      fontSize: 14,
      fontFamily: fonts.semiBold,
      color: selectedOption ? colors.text : colors.textMuted,
      textTransform: 'capitalize',
    },
    triggerDescription: {
      marginTop: 2,
      fontSize: 9,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    triggerChevron: {
      fontSize: 12,
      color: colors.textMuted,
    },
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.55)',
      paddingHorizontal: 18,
    },
    menu: {
      width: '100%',
      maxHeight: '72%',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      backgroundColor: colors.surface,
      paddingVertical: 6,
    },
    menuItem: {
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 10,
      marginHorizontal: 6,
    },
    menuItemSelected: {
      backgroundColor: colors.surfaceLight,
    },
    menuItemLabel: {
      fontSize: 14,
      fontFamily: fonts.semiBold,
      color: colors.textSecondary,
      textTransform: 'capitalize',
    },
    menuItemLabelSelected: {
      color: colors.text,
    },
    menuItemDescription: {
      marginTop: 2,
      fontSize: 9,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
  }), [colors, selectedOption]);

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity style={styles.trigger} onPress={() => setOpen(true)} activeOpacity={0.8}>
          <View style={styles.triggerTextWrap}>
            <Text style={styles.triggerText} numberOfLines={1}>
              {selectedOption?.label ?? placeholder}
            </Text>
            {selectedOption?.description ? (
              <Text style={styles.triggerDescription} numberOfLines={1}>
                {selectedOption.description}
              </Text>
            ) : null}
          </View>
          <Text style={styles.triggerChevron}>▾</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.menu}>
            <ScrollView showsVerticalScrollIndicator keyboardShouldPersistTaps="handled">
              {options.map((option) => {
                const isSelected = option.value === selected;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.menuItem, isSelected && styles.menuItemSelected]}
                    activeOpacity={0.8}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.menuItemLabel, isSelected && styles.menuItemLabelSelected]}>
                      {option.label}
                    </Text>
                    {option.description ? (
                      <Text style={styles.menuItemDescription}>{option.description}</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
