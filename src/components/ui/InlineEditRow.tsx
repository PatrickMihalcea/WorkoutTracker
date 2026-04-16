import React, { useMemo } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { fonts } from '../../constants';

interface InlineEditRowProps {
  value: string;
  onChangeText: (text: string) => void;
  onSave: () => void;
  onCancel: () => void;
  autoFocus?: boolean;
}

export function InlineEditRow({
  value,
  onChangeText,
  onSave,
  onCancel,
  autoFocus = true,
}: InlineEditRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
    input: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 14,
      fontSize: 20,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    btn: { paddingVertical: 8, paddingHorizontal: 12 },
    saveText: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.text },
    cancelText: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.textMuted },
  }), [colors]);

  return (
    <View style={styles.row}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
        onSubmitEditing={onSave}
        returnKeyType="done"
      />
      <TouchableOpacity onPress={onSave} style={styles.btn}>
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onCancel} style={styles.btn}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}
