import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';

import { fonts, spacing } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';

interface OnboardingScaffoldProps {
  step: number;
  totalSteps?: number;
  title: string;
  subtitle: string;
  subtitleColor?: string;
  onBack?: () => void;
  footer: ReactNode;
  children: ReactNode;
  autoScrollToFocusedInput?: boolean;
  showStepProgress?: boolean;
  footerFloating?: boolean;
  backgroundVariant?: 'gradient' | 'solid';
  solidBackgroundColor?: string;
  paddingBottom?: number;
  appearance?: 'theme' | 'dark';
}

export function OnboardingScaffold({
  step,
  totalSteps = 4,
  title,
  subtitle,
  subtitleColor,
  onBack,
  footer,
  children,
  autoScrollToFocusedInput = false,
  showStepProgress = true,
  footerFloating = true,
  backgroundVariant = 'gradient',
  solidBackgroundColor,
  paddingBottom,
  appearance = 'theme',
}: OnboardingScaffoldProps) {
  const { colors } = useTheme();
  const isDarkAppearance = appearance === 'dark';
  const resolvedBg = solidBackgroundColor ?? (isDarkAppearance ? '#000000' : colors.background);
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const heroAnim = useRef(new Animated.Value(0)).current;
  const bodyAnim = useRef(new Animated.Value(0)).current;
  const footerAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView | null>(null);
  const scrollOffsetYRef = useRef(0);
  const windowHeight = Dimensions.get('window').height;

  const scrollFocusedInputIntoView = useCallback((keyboardTopY?: number) => {
    if (!autoScrollToFocusedInput) return;
    const focused = TextInput.State.currentlyFocusedInput?.();
    if (!focused || typeof (focused as { measureInWindow?: Function }).measureInWindow !== 'function') return;

    requestAnimationFrame(() => {
      (focused as { measureInWindow: (cb: (x: number, y: number, width: number, height: number) => void) => void })
        .measureInWindow((_x, y, _width, height) => {
          const visibleTop = 118;
          const footerClearance = footerFloating ? 112 : 28;
          const visibleBottom = (keyboardTopY ?? windowHeight) - footerClearance;
          const inputTop = y;
          const inputBottom = y + height;

          let delta = 0;
          if (inputBottom > visibleBottom) {
            delta = inputBottom - visibleBottom + 18;
          } else if (inputTop < visibleTop) {
            delta = inputTop - visibleTop - 12;
          }

          if (Math.abs(delta) < 2) return;
          scrollRef.current?.scrollTo({
            y: Math.max(0, scrollOffsetYRef.current + delta),
            animated: true,
          });
        });
    });
  }, [autoScrollToFocusedInput, footerFloating, windowHeight]);

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

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
      setTimeout(() => {
        scrollFocusedInputIntoView(event.endCoordinates.screenY);
      }, Platform.OS === 'ios' ? 40 : 80);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [scrollFocusedInputIntoView]);

  useEffect(() => {
    const blurFocusedInput = () => {
      const focused = TextInput.State.currentlyFocusedInput?.();
      if (focused && typeof (focused as { blur?: () => void }).blur === 'function') {
        (focused as { blur: () => void }).blur();
      }
    };

    const id = setTimeout(blurFocusedInput, 80);
    return () => clearTimeout(id);
  }, []);

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
  const safeBottom = Math.max(insets.bottom, spacing.md);
  const floatingBottom = keyboardHeight > 0
    ? (Platform.OS === 'ios' ? 0 : keyboardHeight)
    : safeBottom;

  const styles = useMemo(() => StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: isDarkAppearance ? '#000000' : colors.background,
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
      paddingBottom: spacing.bottom,
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
      color: isDarkAppearance ? '#8FA8A8' : colors.textMuted,
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
      backgroundColor: isDarkAppearance ? '#43E0D3' : colors.accent,
    },
    title: {
      color: isDarkAppearance ? '#FFFFFF' : colors.text,
      fontFamily: fonts.bold,
      fontSize: 34,
      lineHeight: 40,
      marginBottom: spacing.xs,
    },
    subtitle: {
      color: subtitleColor ?? (isDarkAppearance ? '#B1C4C4' : '#B1C4C4'),
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
    inlineCtaWrap: {
      marginTop: spacing.md,
    },
  }), [colors, isDarkAppearance, subtitleColor]);

  return (
    <View style={[styles.root, { backgroundColor: resolvedBg }]}>
      {backgroundVariant === 'gradient' ? (
        <LinearGradient
          colors={['#030507', '#0A171E', '#123038', '#050709']}
          locations={[0, 0.38, 0.72, 1]}
          start={{ x: 0.05, y: 0 }}
          end={{ x: 0.95, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.keyboardWrap}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={[
              styles.content,
              { paddingBottom: footerFloating ? safeBottom + 92 : safeBottom + (paddingBottom ?? spacing.lg) },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
              scrollOffsetYRef.current = event.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
          >
            <View style={styles.headerRow}>
              {onBack ? (
                <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.75}>
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.backButtonPlaceholder} />
              )}
              {showStepProgress ? <Text style={styles.stepText}>{`Step ${step} of ${totalSteps}`}</Text> : null}
            </View>

            {showStepProgress ? (
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: progressWidth }]} />
              </View>
            ) : null}

            <Animated.View style={heroStyle}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </Animated.View>

            <Animated.View style={bodyStyle}>
              {children}
            </Animated.View>

            {!footerFloating ? (
              <Animated.View style={[styles.inlineCtaWrap, footerStyle]}>
                {footer}
              </Animated.View>
            ) : null}
          </ScrollView>

          {footerFloating ? (
            <Animated.View style={[styles.floatingCtaWrap, { bottom: floatingBottom }, footerStyle]}>
              {footer}
            </Animated.View>
          ) : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
