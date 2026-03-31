import { useEffect, useCallback } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../src/stores/auth.store';
import { useProfileStore } from '../src/stores/profile.store';
import { KeyboardDismiss } from '../src/components/ui/KeyboardDismiss';
import { colors } from '../src/constants';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { session, initialized, initialize } = useAuthStore();
  const { profile, loading: profileLoading } = useProfileStore();
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    'Monospaceland-Regular': require('../assets/fonts/Monospaceland/Monospaceland-Regular.ttf'),
    'Monospaceland-SemiBold': require('../assets/fonts/Monospaceland/Monospaceland-SemiBold.ttf'),
    'Monospaceland-Bold': require('../assets/fonts/Monospaceland/Monospaceland-Bold.ttf'),
    'Monospaceland-Light': require('../assets/fonts/Monospaceland/Monospaceland-Light.ttf'),
  });

  useEffect(() => {
    initialize();
  }, [initialize]);

  const ready = fontsLoaded && initialized && !profileLoading;

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
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      if (!profile || !profile.onboarding_complete) {
        router.replace('/(onboarding)/display-name');
      } else {
        router.replace('/(tabs)');
      }
    } else if (session && !inOnboarding && !inAuthGroup && (!profile || !profile.onboarding_complete)) {
      router.replace('/(onboarding)/display-name');
    } else if (session && inOnboarding && profile?.onboarding_complete) {
      router.replace('/(tabs)');
    }
  }, [session, profile, ready, segments, router]);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.text} />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <View style={styles.root} onLayout={onLayoutRootView}>
      <StatusBar style="light" />
      <Slot />
      <KeyboardDismiss />
    </View>
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
