import { useEffect, useCallback, useState, useMemo } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useAuthStore } from '../src/stores/auth.store';
import { useProfileStore } from '../src/stores/profile.store';
import { useRoutineStore } from '../src/stores/routine.store';
import { KeyboardDismiss } from '../src/components/ui/KeyboardDismiss';
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext';
import { WorkoutOverlay, WorkoutOverlayProvider } from '../src/components/workout';
import { notificationService } from '../src/services';

const HAS_OPENED_KEY = 'has_opened_before';

void SplashScreen.preventAutoHideAsync().catch(() => {
  // noop: can throw in dev hot-reload paths if already handled.
});

function RootLayoutInner() {
  const { colors, gradients } = useTheme();
  const { session, initialized, initialize } = useAuthStore();
  const { profile, loading: profileLoading, resolved: profileResolved } = useProfileStore();
  const { fetchRoutines, fetchActiveRoutine } = useRoutineStore();
  const segments = useSegments();
  const router = useRouter();
  const [hasOpenedBefore, setHasOpenedBefore] = useState<boolean | null>(null);
  const [initTimedOut, setInitTimedOut] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const value = await AsyncStorage.getItem(HAS_OPENED_KEY);
        if (!active) return;
        setHasOpenedBefore(value === 'true');
        if (value !== 'true') {
          await AsyncStorage.setItem(HAS_OPENED_KEY, 'true');
        }
      } catch {
        if (!active) return;
        // Never block app startup on local storage issues.
        setHasOpenedBefore(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Safety valve: if initialization hangs (e.g. network timeout before auth resolves),
  // force past the splash screen after 8s to avoid an ANR on Android.
  useEffect(() => {
    const id = setTimeout(() => setInitTimedOut(true), 8000);
    return () => clearTimeout(id);
  }, []);

  const [fontsLoaded] = useFonts({
    'Monospaceland-Regular': require('../assets/fonts/Monospaceland/Monospaceland-Regular.ttf'),
    'Monospaceland-SemiBold': require('../assets/fonts/Monospaceland/Monospaceland-SemiBold.ttf'),
    'Monospaceland-Bold': require('../assets/fonts/Monospaceland/Monospaceland-Bold.ttf'),
    'Monospaceland-Light': require('../assets/fonts/Monospaceland/Monospaceland-Light.ttf'),
  });

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    void notificationService.initialize();
  }, []);

  const profileReady = !session?.user || profileResolved;
  const ready = (fontsLoaded && initialized && !profileLoading && profileReady && hasOpenedBefore !== null) || initTimedOut;

  useEffect(() => {
    if (!ready) return;
    if (!session?.user) return;
    if (!profile?.onboarding_complete) return;

    void fetchRoutines();
    void fetchActiveRoutine();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, session?.user?.id, profile?.onboarding_complete]);

  useEffect(() => {
    if (!ready) return;
    void SplashScreen.hideAsync().catch(() => {
      // noop
    });
  }, [ready]);

  // Hard fallback so splash cannot get stuck forever.
  useEffect(() => {
    const id = setTimeout(() => {
      void SplashScreen.hideAsync().catch(() => {
        // noop
      });
    }, 12000);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (session?.user && !profileResolved) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';
    const currentSegment = segments[segments.length - 1];
    const inOnboardingFinalStep = inOnboarding && currentSegment === 'first-routine';

    if (!session && !inAuthGroup) {
      router.replace(hasOpenedBefore ? '/(auth)/login' : '/(auth)/signup');
    } else if (session && inAuthGroup) {
      if (!profile || !profile.onboarding_complete) {
        router.replace('/(onboarding)/display-name');
      } else {
        router.replace('/(tabs)/today');
      }
    } else if (session && !inOnboarding && !inAuthGroup && (!profile || !profile.onboarding_complete)) {
      router.replace('/(onboarding)/display-name');
    } else if (session && inOnboarding && profile?.onboarding_complete && !inOnboardingFinalStep) {
      router.replace('/(tabs)/today');
    }
  }, [session, profile, profileResolved, ready, segments, router]);

  useEffect(() => {
    if (!ready) return;
    if (!session) return;
    if (!profile?.onboarding_complete) return;

    void (async () => {
      const wantsNotifications = Boolean(
        profile.notify_rest_timer_enabled || profile.notify_workout_day_enabled,
      );
      if (wantsNotifications) {
        await notificationService.ensurePermissions();
      }
      await notificationService.syncWorkoutDayReminder(profile);
    })();
  }, [
    ready,
    session?.user?.id,
    profile?.id,
    profile?.onboarding_complete,
    profile?.notify_rest_timer_enabled,
    profile?.notify_workout_day_enabled,
    profile?.notify_workout_day_time,
    profile?.notify_workout_rest_days_enabled,
  ]);

  const styles = useMemo(() => StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
  }), [colors]);

  const exerciseHeaderOptions = useMemo<NativeStackNavigationOptions>(() => ({
    headerShown: true,
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.text,
    headerTitle: 'Exercise Details',
    headerTitleStyle: { fontFamily: 'Monospaceland-Bold' },
    headerBackButtonDisplayMode: 'minimal' as const,
    headerBackTitle: '',
    headerLeftBackgroundVisible: false,
  }), [colors]);

  const exerciseHistoryHeaderOptions = useMemo<NativeStackNavigationOptions>(() => ({
    ...exerciseHeaderOptions,
    headerTitle: 'Exercise History',
  }), [exerciseHeaderOptions]);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.text} />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <LinearGradient
        colors={gradients.background}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <StatusBar style="light" />
      <WorkoutOverlayProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen
            name="exercise/[exerciseId]"
            options={exerciseHeaderOptions}
          />
          <Stack.Screen
            name="exercise/[exerciseId]/history"
            options={exerciseHistoryHeaderOptions}
          />
        </Stack>
        <WorkoutOverlay />
        <KeyboardDismiss />
      </WorkoutOverlayProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutInner />
    </ThemeProvider>
  );
}
