import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, G, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { fonts } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface MetricRingProps {
  label: string;
  valueText: string;
  targetText?: string;
  progress: number;
  color: string;
  gradientToColor?: string;
  delay?: number;
  muted?: boolean;
  compact?: boolean;
}

export function MetricRing({
  label,
  valueText,
  targetText = '--',
  progress,
  color,
  gradientToColor,
  delay = 0,
  muted = false,
  compact = false,
}: MetricRingProps) {
  const { colors, gradients } = useTheme();
  const size = 92;
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const isFull = !muted && clamped >= 0.999;

  const anim = useRef(new Animated.Value(0)).current;
  const gradientId = useMemo(
    () => `metric_ring_grad_${Math.random().toString(36).slice(2, 10)}`,
    [],
  );

  useEffect(() => {
    Animated.timing(anim, {
      toValue: clamped,
      duration: 900,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [anim, clamped, delay]);

  const strokeDashoffset = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const styles = useMemo(() => StyleSheet.create({
    shadow: {
      flex: 1,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 4,
    },
    shadowFull: {
      shadowOpacity: 0.34,
      shadowRadius: 12,
      elevation: 8,
    },
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.metricCardBorder,
      paddingVertical: 12,
      paddingHorizontal: 6,
    },
    containerMuted: {
      borderColor: colors.metricCardBorder,
    },
    containerFull: {
      borderColor: '#4A617F',
    },
    centerText: {
      position: 'absolute',
      top: 12,
      bottom: 34,
      left: 6,
      right: 6,
      justifyContent: 'center',
      alignItems: 'center',
    },
    fraction: {
      textAlign: 'center',
      maxWidth: 76,
    },
    fractionCompact: {
      maxWidth: 82,
    },
    current: {
      fontSize: 16,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    currentCompact: {
      fontSize: 14,
    },
    separator: {
      fontSize: 12,
      fontFamily: fonts.semiBold,
      color: colors.textMuted,
    },
    separatorCompact: {
      fontSize: 11,
    },
    target: {
      fontSize: 13,
      fontFamily: fonts.semiBold,
      color: colors.textSecondary,
    },
    targetCompact: {
      fontSize: 12,
    },
    label: {
      marginTop: 12,
      fontSize: 12,
      fontFamily: fonts.semiBold,
      color: colors.textMuted,
    },
    fullBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      backgroundColor: '#2A3B52',
      borderWidth: 1,
      borderColor: '#5F86BC',
    },
    fullBadgeText: {
      fontSize: 9,
      lineHeight: 11,
      fontFamily: fonts.bold,
      color: '#B9D7FF',
    },
  }), [colors]);

  return (
    <View style={[styles.shadow, isFull && styles.shadowFull]}>
    <View style={[styles.container, muted && styles.containerMuted, isFull && styles.containerFull]}>
      <LinearGradient
        colors={gradients.metricCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <Svg width={size} height={size}>
        <Defs>
          <SvgLinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={color} />
            <Stop offset="100%" stopColor={gradientToColor ?? '#E0F2FF'} />
          </SvgLinearGradient>
        </Defs>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {isFull && (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius - 8}
              fill={color}
              fillOpacity={0.1}
            />
          )}
          {isFull && (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius + 3}
              stroke={color}
              strokeOpacity={0.25}
              strokeWidth={2}
              fill="transparent"
            />
          )}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.metricCardBorder}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={muted ? '#5C677D' : `url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="transparent"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
          />
        </G>
      </Svg>

      <View style={styles.centerText} pointerEvents="none">
        <Text
          style={[styles.fraction, compact && styles.fractionCompact]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.65}
        >
          <Text style={[styles.current, compact && styles.currentCompact]}>{valueText}</Text>
          <Text style={[styles.separator, compact && styles.separatorCompact]}>/</Text>
          <Text style={[styles.target, compact && styles.targetCompact]}>{targetText}</Text>
        </Text>
      </View>
      <Text style={styles.label}>{label}</Text>
      {isFull && (
        <View style={styles.fullBadge}>
          <Text style={styles.fullBadgeText}>MAX</Text>
        </View>
      )}
    </View>
    </View>
  );
}

