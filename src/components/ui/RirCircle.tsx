import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { fonts } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';

const COLORS = {
  red: '#FF6B6B',
  yellow: '#FFD93D',
  green: '#6BCB77',
} as const;

export function getRirColor(value: number | null, emptyColor: string): string {
  if (value === null) return emptyColor;
  if (value <= 1) return COLORS.red;
  if (value <= 3) return COLORS.yellow;
  return COLORS.green;
}

export function formatRir(value: number | null): string {
  if (value === null) return '-';
  if (value >= 6) return '6+';
  if (value % 1 !== 0) return value.toFixed(1);
  return String(value);
}

interface RirCircleProps {
  value: number | null;
  size?: number;
  onPress?: () => void;
  style?: ViewStyle;
  textColorOverride?: string;
}

export function RirCircle({ value, size = 32, onPress, style, textColorOverride }: RirCircleProps) {
  const { colors } = useTheme();
  const isEmpty = value === null;
  const bg = getRirColor(value, colors.surfaceLight);
  const textColor = textColorOverride ?? (isEmpty ? colors.textMuted : '#000000');

  const circle = (
    <TouchableOpacity
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          borderWidth: isEmpty ? 1 : 0,
          borderColor: isEmpty ? colors.border : 'transparent',
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <Text style={[styles.text, { fontSize: size * 0.38, color: textColor }]}>
        {formatRir(value)}
      </Text>
    </TouchableOpacity>
  );

  return circle;
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: fonts.semiBold,
    textAlign: 'center',
  },
});
