import React, { useMemo } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { fonts } from '../../constants';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'accent' | 'secondary' | 'danger' | 'ghost' | 'dashed' | 'cta';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const { colors, gradients } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    base: {
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      overflow: 'hidden',
    },
    disabled: { opacity: 0.5 },
    size_sm: { paddingVertical: 8, paddingHorizontal: 16 },
    size_md: { paddingVertical: 14, paddingHorizontal: 24 },
    size_lg: { paddingVertical: 18, paddingHorizontal: 32 },
    variant_primary: { backgroundColor: colors.text },
    variant_accent: { backgroundColor: colors.accent },
    variant_secondary: { backgroundColor: colors.surfaceLight },
    variant_danger: { backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.border },
    variant_cta: { backgroundColor: colors.accent, borderRadius: 999 },
    variant_ghost: { backgroundColor: 'transparent' },
    variant_dashed: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
    },
    text: { fontFamily: fonts.semiBold, textAlign: 'center' },
    text_sm: { fontSize: 14 },
    text_md: { fontSize: 16 },
    text_lg: { fontSize: 18 },
    text_primary: { color: colors.background },
    text_accent: { color: '#FFFFFF' },
    text_secondary: { color: colors.text },
    text_danger: { color: colors.text },
    text_cta: { color: '#FFFFFF', fontFamily: fonts.bold },
    text_ghost: { color: colors.textSecondary },
    text_dashed: { color: colors.textSecondary },
  }), [colors]);

  const buttonStyles: ViewStyle[] = [
    styles.base,
    styles[`size_${size}`],
    styles[`variant_${variant}`],
    (disabled || loading) && styles.disabled,
    style as ViewStyle,
  ].filter(Boolean) as ViewStyle[];

  const textStyles: TextStyle[] = [
    styles.text,
    styles[`text_${size}`],
    styles[`text_${variant}`],
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {(variant === 'primary' || variant === 'accent') && (
        <LinearGradient
          colors={variant === 'accent' ? gradients.accent : gradients.primaryButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      {loading ? (
        <ActivityIndicator
          color={variant === 'ghost' || variant === 'dashed' ? colors.text : (variant === 'accent' || variant === 'cta') ? '#FFFFFF' : colors.background}
          size="small"
        />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
