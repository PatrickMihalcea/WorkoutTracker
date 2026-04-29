import React, { useEffect, useRef, useMemo } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { fonts } from '../../constants';

interface ToastProps {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

export function Toast({ message, visible, onDismiss, duration = 2000 }: ToastProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) {
      opacity.setValue(0);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start(() => {
      timerRef.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(({ finished }) => {
          if (finished) onDismiss();
        });
      }, duration);
    });
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, message]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      position: 'absolute',
      top: 8,
      left: 20,
      right: 20,
      zIndex: 100,
      backgroundColor: colors.surface,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 16,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 6,
    },
    text: {
      fontSize: 13,
      fontFamily: fonts.semiBold,
      color: colors.text,
      textAlign: 'center',
    },
  }), [colors]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]} pointerEvents="none">
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}
