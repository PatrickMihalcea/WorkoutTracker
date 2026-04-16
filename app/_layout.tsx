import { useEffect, useCallback, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../src/stores/auth.store';
import { useProfileStore } from '../src/stores/profile.store';
import { KeyboardDismiss } from '../src/components/ui/KeyboardDismiss';
import { colors } from '../src/constants';
import { notificationService } from '../src/services';

const HAS_OPENED_KEY = 'has_opened_before';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { session, initialized, initialize } = useAuthStore();
  const { profile, loading: profileLoading } = useProfileStore();
  const segments = useSegments();
  const router = useRouter();
  const [hasOpenedBefore, setHasOpenedBefore] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(HAS_OPENED_KEY).then((value) => {
      setHasOpenedBefore(value === 'true');
      if (value !== 'true') {
        void AsyncStorage.setItem(HAS_OPENED_KEY, 'true');
      }
    });
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

  const ready = fontsLoaded && initialized && !profileLoading && hasOpenedBefore !== null;

  const onLayoutRootView = useCallback(async () => {
    if (ready) {
      await SplashScreen.hideAsync();
    }
  }, [ready]);

  useEffect(() => {
    if (!ready) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';

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
    } else if (session && inOnboarding && profile?.onboarding_complete) {
      router.replace('/(tabs)/today');
    }
  }, [session, profile, ready, segments, router]);

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

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.text} />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root} onLayout={onLayoutRootView}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen
          name="exercise/[exerciseId]"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerTitle: 'Exercise Details',
            headerTitleStyle: { fontFamily: 'Monospaceland-Bold' },
            headerBackTitle: 'Back',
          }}
        />
      </Stack>
      <KeyboardDismiss />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
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
});
