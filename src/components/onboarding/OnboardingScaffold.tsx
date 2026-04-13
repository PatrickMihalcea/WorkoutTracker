import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';

import { colors, fonts, spacing } from '../../constants';

interface OnboardingScaffoldProps {
  step: number;
  totalSteps?: number;
  title: string;
  subtitle: string;
  onBack?: () => void;
  footer: ReactNode;
  children: ReactNode;
}

export function OnboardingScaffold({
  step,
  totalSteps = 4,
  title,
  subtitle,
  onBack,
  footer,
  children,
}: OnboardingScaffoldProps) {
  const insets = useSafeAreaInsets();
  const heroAnim = useRef(new Animated.Value(0)).current;
  const bodyAnim = useRef(new Animated.Value(0)).current;
  const footerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    heroAnim.setValue(0);
    bodyAnim.setValue(0);
    footerAnim.setValue(0);

    Animated.stagger(80, [
      Animated.timing(heroAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(bodyAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(footerAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  }, [bodyAnim, footerAnim, heroAnim, step]);

  const progressWidth = useMemo<`${number}%`>(
    () => `${Math.min(100, (step / totalSteps) * 100)}%`,
    [step, totalSteps],
  );

  const heroStyle = useMemo(
    () => ({
      opacity: heroAnim,
      transform: [
        {
          translateY: heroAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [8, 0],
          }),
        },
      ],
    }),
    [heroAnim],
  );

  const bodyStyle = useMemo(
    () => ({
      opacity: bodyAnim,
      transform: [
        {
          translateY: bodyAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [10, 0],
          }),
        },
      ],
    }),
    [bodyAnim],
  );

  const footerStyle = useMemo(
    () => ({
      opacity: footerAnim,
      transform: [
        {
          translateY: footerAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [12, 0],
          }),
        },
      ],
    }),
    [footerAnim],
  );
  const floatingBottom = Math.max(insets.bottom, spacing.md);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#030507', '#0A171E', '#123038', '#050709']}
        locations={[0, 0.38, 0.72, 1]}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.keyboardWrap}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.content, { paddingBottom: floatingBottom + 92 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerRow}>
              {onBack ? (
                <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.75}>
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.backButtonPlaceholder} />
              )}
              <Text style={styles.stepText}>{`Step ${step} of ${totalSteps}`}</Text>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: progressWidth }]} />
            </View>

            <Animated.View style={heroStyle}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </Animated.View>

            <Animated.View style={bodyStyle}>
              {children}
            </Animated.View>
          </ScrollView>

          <Animated.View style={[styles.floatingCtaWrap, { bottom: floatingBottom }, footerStyle]}>
            {footer}
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  keyboardWrap: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  headerRow: {
    minHeight: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  backButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2A4F4F',
    backgroundColor: 'rgba(13, 24, 24, 0.65)',
  },
  backButtonPlaceholder: {
    width: 56,
  },
  backButtonText: {
    fontSize: 13,
    color: '#9AD9D3',
    fontFamily: fonts.semiBold,
  },
  stepText: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: fonts.semiBold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  progressTrack: {
    height: 7,
    width: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#4ECDC4',
  },
  title: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 34,
    lineHeight: 40,
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: '#B1C4C4',
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  floatingCtaWrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 20,
  },
});
