import React, { useMemo } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { fonts } from '../../constants';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, containerStyle, ...props }: InputProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    container: { marginBottom: 16 },
    label: {
      color: colors.textSecondary,
      fontSize: 14,
      fontFamily: fonts.regular,
      marginBottom: 6,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      fontSize: 16,
      color: colors.text,
      fontFamily: fonts.regular,
    },
    inputError: { borderColor: colors.textMuted },
    error: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 4,
      fontFamily: fonts.regular,
    },
  }), [colors]);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}
