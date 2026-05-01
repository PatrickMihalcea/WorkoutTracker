import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { fonts, spacing } from '../../constants';
import { OnboardingRoutineGenerationMode } from '../../models';

type RoutineCreationMode = OnboardingRoutineGenerationMode | 'custom';
type RoutineCreationContext = 'onboarding' | 'routine';

interface RoutineCreationLoadingOverlayProps {
  visible: boolean;
  mode: RoutineCreationMode;
  context?: RoutineCreationContext;
}

function titleForMode(mode: RoutineCreationMode): string {
  if (mode === 'ai') return 'Personalizing Your Routine';
  if (mode === 'template') return 'Building Your Routine';
  return 'Creating Your Routine';
}

function subtitleForMode(mode: RoutineCreationMode, context: RoutineCreationContext): string {
  if (mode === 'ai') return 'Tuning your plan to your goals. This may take a few minutes.';
  if (mode === 'template') return 'Setting up a balanced starter routine from your picks.';
  if (context === 'onboarding') return 'Finishing setup so you can start training right away.';
  return 'Setting up your custom routine shell.';
}

function tipsForMode(mode: RoutineCreationMode): string[] {
  if (mode === 'ai') {
    return [
      'Balancing volume and recovery across your week.',
      'Matching exercise choices to your available equipment.',
      'Applying a slight focus bias without overloading one area.',
      'Adjusting exercise difficulty to your training experience.',
      'Keeping each workout realistic for your selected session length.',
      'Choosing a split that fits your training frequency.',
      'Prioritizing high-value compound lifts where appropriate.',
      'Adding accessory work to support your main goal.',
      'Setting practical starting sets, reps, and effort targets.',
      'Building week-to-week progression while keeping the routine consistent.',
    ];
  }

  if (mode === 'template') {
    return [
      'Selecting a proven split for your training days.',
      'Assigning realistic sets, reps, and intensity targets.',
      'Preparing your first week so you can jump in quickly.',
    ];
  }

  return [
    'Creating the routine structure.',
    'Preparing training days and tracking slots.',
    'Syncing everything to your account.',
  ];
}

export function RoutineCreationLoadingOverlay({
  visible,
  mode,
  context = 'routine',
}: RoutineCreationLoadingOverlayProps) {
  const pulse = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const [tipIndex, setTipIndex] = useState(0);
  const tips = useMemo(() => tipsForMode(mode), [mode]);

  useEffect(() => {
    if (!visible) return;

    setTipIndex(0);
    const timer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 15000);

    return () => clearInterval(timer);
  }, [tips.length, visible]);

  useEffect(() => {
    if (!visible) return;

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1000,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    pulseLoop.start();
    spinLoop.start();

    return () => {
      pulseLoop.stop();
      spinLoop.stop();
      pulse.setValue(0);
      spin.setValue(0);
    };
  }, [pulse, spin, visible]);

  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.32],
  });
  const ringOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.34, 0.06],
  });
  const spinRotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => undefined}>
      <View style={styles.root}>
        <LinearGradient
          colors={['rgba(2, 6, 8, 0.96)', 'rgba(8, 33, 39, 0.97)', 'rgba(0, 0, 0, 0.98)']}
          locations={[0, 0.55, 1]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.card}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Routine Builder</Text>
          </View>

          <View style={styles.orbWrap}>
            <Animated.View style={[styles.pulseRing, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]} />
            <Animated.View style={[styles.spinRing, { transform: [{ rotate: spinRotate }] }]} />
            <View style={styles.coreDot} />
          </View>

          <Text style={styles.title}>{titleForMode(mode)}</Text>
          <Text style={styles.subtitle}>{subtitleForMode(mode, context)}</Text>

          <View style={styles.tipRow}>
            <Text style={styles.tipText}>{tips[tipIndex]}</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(108, 231, 223, 0.28)',
    backgroundColor: 'rgba(7, 13, 16, 0.86)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg + spacing.sm,
    alignItems: 'center',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm + spacing.xs,
    paddingVertical: spacing.xs + 2,
    borderWidth: 1,
    borderColor: 'rgba(108, 231, 223, 0.3)',
    backgroundColor: 'rgba(108, 231, 223, 0.1)',
    marginBottom: spacing.md,
  },
  badgeText: {
    color: '#A9F2ED',
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  orbWrap: {
    width: 88,
    height: 88,
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#56D9D0',
  },
  spinRing: {
    position: 'absolute',
    width: 66,
    height: 66,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: 'rgba(86, 217, 208, 0.35)',
    borderTopColor: '#6CE7DF',
    borderRightColor: '#84EFE7',
  },
  coreDot: {
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: '#89EFE8',
    shadowColor: '#89EFE8',
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  title: {
    color: '#F1FFFE',
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 28,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: spacing.xs,
    color: '#C7D6D8',
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 300,
  },
  tipRow: {
    marginTop: spacing.lg,
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(129, 169, 173, 0.3)',
    backgroundColor: 'rgba(12, 22, 26, 0.8)',
    paddingHorizontal: spacing.sm + spacing.xs,
    paddingVertical: spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tipText: {
    flex: 1,
    color: '#BFD0D2',
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
  },
});
