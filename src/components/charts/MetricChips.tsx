import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { fonts } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';

export interface MetricChipsProps<K extends string> {
  options: { key: K; label: string }[];
  selected: K;
  onChange: (key: K) => void;
  activeColor?: string;
}

export function MetricChips<K extends string>({
  options,
  selected,
  onChange,
  activeColor = '#FFEAA7',
}: MetricChipsProps<K>) {
  const { colors } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    metricRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 8,
    },
    metricChip: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 14,
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.border,
    },
    metricChipActive: {
      backgroundColor: '#FFEAA7',
      borderColor: '#FFEAA7',
    },
    metricChipText: {
      fontSize: 12,
      fontFamily: fonts.semiBold,
      color: colors.textSecondary,
    },
    metricChipTextActive: {
      color: '#000',
    },
  }), [colors]);
  return (
    <View style={styles.metricRow}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.key}
          style={[
            styles.metricChip,
            selected === opt.key && [styles.metricChipActive, { backgroundColor: activeColor, borderColor: activeColor }],
          ]}
          onPress={() => onChange(opt.key)}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.metricChipText, selected === opt.key && styles.metricChipTextActive]}
          >
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
