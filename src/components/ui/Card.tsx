import React, { useMemo } from 'react';
import { Animated, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Override the default surface gradient with custom color stops. */
  gradientColors?: readonly [string, string, ...string[]];
}

export function Card({ children, style, gradientColors }: CardProps) {
  const { colors, gradients } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    card: {
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
  }), [colors]);

  return (
    <Animated.View style={[styles.card, style]}>
      <LinearGradient
        colors={gradientColors ?? gradients.surface}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {children}
    </Animated.View>
  );
}
