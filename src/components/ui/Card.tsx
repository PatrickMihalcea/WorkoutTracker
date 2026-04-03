import React from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../constants';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | Animated.AnimatedProps<ViewStyle>['style'];
}

export function Card({ children, style }: CardProps) {
  return <Animated.View style={[styles.card, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
