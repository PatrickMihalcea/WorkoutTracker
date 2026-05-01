import { useEffect, useState, useMemo } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
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
import { LaunchScreen } from '../src/components/ui/LaunchScreen';
import { AppHeader } from '../src/components/ui';
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext';
import { DEFAULT_THEME, isLightTheme } from '../src/constants/themes';
import { WorkoutFloatingPill, WorkoutOverlayProvider } from '../src/components/workout';
import { notificationService, onboardingService } from '../src/services';


const HAS_OPENED_KEY = 'has_opened_before';

void SplashScreen.preventAutoHideAsync().catch(() => {
  // noop: can throw in dev hot-reload paths if already handled.
});

function RootLayoutInner() {
  const { colors, gradients, theme } = useTheme();
  const { session, initialized, initialize } = useAuthStore();
  const { profile, loading: profileLoading, resolved: profileResolved, updateProfile } = useProfileStore();
  const { fetchRoutines, fetchActiveRoutine, activeRoutineInitialized } = useRoutineStore();
  const segments = useSegments();
  const router = useRouter();
  const [hasOpenedBefore, setHasOpenedBefore] = useState<boolean | null>(null);
  const [initTimedOut, setInitTimedOut] = useState(false);
  const [launchVisible, setLaunchVisible] = useState(true);
  const [launchExiting, setLaunchExiting] = useState(false);
  const [routineGenerationRecoveryResolved, setRoutineGenerationRecoveryResolved] = useState(false);
  const [pendingRoutineGenerationContext, setPendingRoutineGenerationContext] = useState<'onboarding' | 'routine' | null>(null);

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

  useEffect(() => {
    let active = true;

    if (!session?.user) {
      setPendingRoutineGenerationContext(null);
      setRoutineGenerationRecoveryResolved(true);
      return () => {
        active = false;
      };
    }

    if (!profileResolved) {
      setRoutineGenerationRecoveryResolved(false);
      return () => {
        active = false;
      };
    }

    setRoutineGenerationRecoveryResolved(false);

    void (async () => {
      try {
        const resumed = await onboardingService.resumePendingRoutineGeneration();
        if (!active) return;

        if (resumed.status === 'none') {
          setPendingRoutineGenerationContext(null);
          return;
        }

        if (resumed.status === 'running') {
          setPendingRoutineGenerationContext(resumed.pending.context);
          return;
        }

        setPendingRoutineGenerationContext(null);

        if (
          resumed.status === 'completed' &&
          resumed.pending.context === 'onboarding' &&
          profile &&
          !profile.onboarding_complete
        ) {
          await updateProfile({ onboarding_complete: true });
        }

        if (resumed.status === 'completed') {
          await fetchRoutines();
          await fetchActiveRoutine();
        }
      } catch (error) {
        console.warn(
          `[startup] Failed to recover pending routine generation: ${error instanceof Error ? error.message : String(error)}`,
        );
        if (!active) return;
        setPendingRoutineGenerationContext(null);
      } finally {
        if (active) {
          setRoutineGenerationRecoveryResolved(true);
        }
      }
    })();

    return () => {
      active = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, profileResolved]);

  const launchScreenReady = hasOpenedBefore !== null;
  const profileReady = !session?.user || profileResolved;
  const routineGenerationReady = !session?.user || routineGenerationRecoveryResolved;
  const routineBootstrapReady = !session?.user || !profile?.onboarding_complete || activeRoutineInitialized;
  const ready = (fontsLoaded && initialized && !profileLoading && profileReady && routineGenerationReady && routineBootstrapReady && launchScreenReady) || initTimedOut;

  useEffect(() => {
    if (!ready) return;
    if (!launchVisible) return;
    setLaunchExiting(true);
  }, [launchVisible, ready]);

  useEffect(() => {
    if (!session?.user) return;
    if (!profileResolved) return;
    if (!profile?.onboarding_complete) return;

    void fetchRoutines();
    void fetchActiveRoutine();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, profileResolved, profile?.onboarding_complete]);

  useEffect(() => {
    if (!launchScreenReady) return;
    void SplashScreen.hideAsync().catch(() => {
      // noop
    });
  }, [launchScreenReady]);

  // Hard fallback so the native handoff cannot get stuck forever.
  useEffect(() => {
    const id = setTimeout(() => {
      void SplashScreen.hideAsync().catch(() => {
        // noop
      });
    }, 4000);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (session?.user && !profileResolved) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';
    const currentSegment = segments[segments.length - 1];
    const inOnboardingFinalStep = inOnboarding && currentSegment === 'first-routine';
    const shouldResumeOnboardingRoutineGeneration = pendingRoutineGenerationContext === 'onboarding';

    if (!session && !inAuthGroup) {
      router.replace(hasOpenedBefore ? '/(auth)/login' : '/(auth)/signup');
    } else if (session && inAuthGroup) {
      if (!profile || !profile.onboarding_complete) {
        router.replace(shouldResumeOnboardingRoutineGeneration ? '/(onboarding)/first-routine' : '/(onboarding)/display-name');
      } else {
        router.replace('/(tabs)/today');
      }
    } else if (session && !inOnboarding && !inAuthGroup && (!profile || !profile.onboarding_complete)) {
      router.replace(shouldResumeOnboardingRoutineGeneration ? '/(onboarding)/first-routine' : '/(onboarding)/display-name');
    } else if (session && inOnboarding && !profile?.onboarding_complete && shouldResumeOnboardingRoutineGeneration && !inOnboardingFinalStep) {
      router.replace('/(onboarding)/first-routine');
    } else if (session && inOnboarding && profile?.onboarding_complete && !inOnboardingFinalStep) {
      router.replace('/(tabs)/today');
    }
  }, [hasOpenedBefore, pendingRoutineGenerationContext, profile, profileResolved, ready, router, segments, session]);

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
    overlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 20,
    },
  }), [colors]);

  const exerciseHeaderOptions = useMemo<NativeStackNavigationOptions>(() => ({
    headerShown: false,
    headerTitle: 'Exercise Details',
    headerTitleStyle: { fontFamily: 'Monospaceland-Bold' },
  }), [colors]);

  const exerciseHistoryHeaderOptions = useMemo<NativeStackNavigationOptions>(() => ({
    ...exerciseHeaderOptions,
    header: (props) => <AppHeader {...props} />,
    headerShown: true,
    headerTitle: 'Exercise History',
  }), [exerciseHeaderOptions]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <LinearGradient
        colors={gradients.background}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <StatusBar style={isLightTheme(theme) ? 'dark' : 'light'} />
      {ready ? (
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
            <Stack.Screen
              name="workout"
              options={{
                presentation: 'transparentModal',
                animation: 'none',
                contentStyle: { backgroundColor: 'transparent' },
              }}
            />
          </Stack>
          {!launchVisible ? <WorkoutFloatingPill /> : null}
          <KeyboardDismiss />
        </WorkoutOverlayProvider>
      ) : null}
      {launchVisible ? (
        <LaunchScreen
          accentColor={DEFAULT_THEME.colors.accent}
          exiting={launchExiting}
          onExitComplete={() => setLaunchVisible(false)}
          style={styles.overlay}
        />
      ) : null}
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
