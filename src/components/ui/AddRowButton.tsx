import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { fonts } from '../../constants';

interface AddRowButtonProps {
  label: string;
  onPress: () => void;
  borderTop?: boolean;
}

export function AddRowButton({ label, onPress, borderTop = false }: AddRowButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    btn: {
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 4,
    },
    borderTop: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    text: {
      color: colors.textSecondary,
      fontSize: 14,
      fontFamily: fonts.semiBold,
    },
  }), [colors]);

  return (
    <TouchableOpacity
      style={[styles.btn, borderTop && styles.borderTop]}
      onPress={onPress}
    >
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
}
