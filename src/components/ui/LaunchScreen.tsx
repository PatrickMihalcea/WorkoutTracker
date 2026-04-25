import { memo, useEffect, useMemo } from 'react';
import {
  Image,
  StyleProp,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { Shadow } from 'react-native-shadow-2';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
const BRAND_MARK = require('../../../assets/Setora.png');
const BADGE_SIZE = 172;
const FILL_GLOW_SIZE = 220;

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;

  const int = Number.parseInt(value, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

function withAlpha(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function mixWithBlack(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  const mix = (channel: number) => Math.round(channel * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

interface LaunchScreenProps {
  accentColor: string;
  exiting?: boolean;
  onExitComplete?: () => void;
  statusLabel?: string;
  style?: StyleProp<ViewStyle>;
}

interface BrandBadgeProps {
  accentColor: string;
  glowEnd: string;
  glowStart: string;
  logoCoverAnimatedStyle: StyleProp<ViewStyle>;
}

const BrandBadge = memo(function BrandBadge({
  accentColor,
  glowEnd,
  glowStart,
  logoCoverAnimatedStyle,
}: BrandBadgeProps) {
  const styles = useMemo(() => StyleSheet.create({
    shadowContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    glowAnchor: {
      width: BADGE_SIZE,
      height: BADGE_SIZE,
      borderRadius: 86,
      overflow: 'hidden',
      backgroundColor: accentColor,
    },
    logoWrap: {
      flex: 1,
    },
    brandMark: {
      width: '100%',
      height: '100%',
      borderRadius: 86,
    },
    logoCover: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: accentColor,
    },
  }), [accentColor]);

  return (
    <Shadow
      startColor={glowStart}
      endColor={glowEnd}
      distance={62}
      offset={[0, 0]}
      safeRender
      containerStyle={styles.shadowContainer}
    >
      <View style={styles.glowAnchor}>
        <View style={styles.logoWrap}>
          <Image source={BRAND_MARK} style={styles.brandMark} resizeMode="cover" />
          <Animated.View style={[styles.logoCover, logoCoverAnimatedStyle]} />
        </View>
      </View>
    </Shadow>
  );
});

export const LaunchScreen = memo(function LaunchScreen({
  accentColor,
  exiting = false,
  onExitComplete,
  statusLabel,
  style,
}: LaunchScreenProps) {
  const { height, width } = useWindowDimensions();
  const glowProgress = useSharedValue(0);
  const logoProgress = useSharedValue(0);
  const statusProgress = useSharedValue(0);
  const slideProgress = useSharedValue(0);
  const exitStarted = useSharedValue(false);

  const fillScale = useMemo(
    () => (Math.hypot(width, height) / FILL_GLOW_SIZE) * 2.4,
    [height, width],
  );
  const glowStart = useMemo(() => withAlpha(accentColor, 0.42), [accentColor]);
  const glowEnd = useMemo(() => withAlpha(accentColor, 0.02), [accentColor]);
  const accentMid = useMemo(() => mixWithBlack(accentColor, 0.32), [accentColor]);

  useEffect(() => {
    if (!exiting || exitStarted.value) return;
    exitStarted.value = true;

    glowProgress.value = withTiming(1, {
      duration: 1700,
      easing: Easing.out(Easing.cubic),
    });
    logoProgress.value = withTiming(1, {
      duration: 950,
      easing: Easing.out(Easing.quad),
    });
    statusProgress.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.quad),
    });
    slideProgress.value = withDelay(
      1650,
      withTiming(1, {
        duration: 1550,
        easing: Easing.inOut(Easing.cubic),
      }, (finished) => {
        if (finished && onExitComplete) {
          runOnJS(onExitComplete)();
        }
      }),
    );
  }, [exiting, exitStarted, glowProgress, logoProgress, onExitComplete, slideProgress, statusProgress]);

  const rootAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      glowProgress.value,
      [0, 0.68, 0.9, 1],
      ['#000000', accentMid, accentColor, accentColor],
    ),
    transform: [
      {
        translateY: interpolate(slideProgress.value, [0, 1], [0, -height]),
      },
    ],
  }), [accentColor, accentMid, height]);

  const fillGlowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowProgress.value, [0, 0.52, 0.82, 1], [0, 0.96, 0.24, 0]),
    transform: [
      {
        scale: interpolate(glowProgress.value, [0, 1], [0.18, fillScale]),
      },
    ],
  }), [fillScale]);

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowProgress.value, [0, 0.58, 0.84, 1], [1, 1, 0.06, 0]),
  }));

  const logoCoverAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(logoProgress.value, [0, 1], [0, 1]),
  }));

  const statusAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(statusProgress.value, [0, 1], [1, 0]),
  }));

  const styles = useMemo(() => StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: '#000000',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    content: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    fillGlow: {
      position: 'absolute',
      width: FILL_GLOW_SIZE,
      height: FILL_GLOW_SIZE,
      borderRadius: FILL_GLOW_SIZE / 2,
      backgroundColor: accentColor,
    },
    statusLabel: {
      position: 'absolute',
      bottom: 74,
      color: 'rgba(255,255,255,0.52)',
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      fontFamily: 'Monospaceland-SemiBold',
    },
  }), [accentColor]);

  return (
    <Animated.View
      style={[
        styles.root,
        style,
        rootAnimatedStyle,
      ]}
    >
      <Animated.View style={[styles.fillGlow, fillGlowAnimatedStyle]} />
      <Animated.View
        style={[
          styles.content,
          contentAnimatedStyle,
        ]}
      >
        <BrandBadge
          accentColor={accentColor}
          glowEnd={glowEnd}
          glowStart={glowStart}
          logoCoverAnimatedStyle={logoCoverAnimatedStyle}
        />
      </Animated.View>
      {statusLabel ? (
        <Animated.Text style={[styles.statusLabel, statusAnimatedStyle]}>
          {statusLabel}
        </Animated.Text>
      ) : null}
    </Animated.View>
  );
});
