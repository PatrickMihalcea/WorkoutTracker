import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../constants';

interface AddRowButtonProps {
  label: string;
  onPress: () => void;
  borderTop?: boolean;
}

export function AddRowButton({ label, onPress, borderTop = false }: AddRowButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.btn, borderTop && styles.borderTop]}
      onPress={onPress}
    >
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
});
