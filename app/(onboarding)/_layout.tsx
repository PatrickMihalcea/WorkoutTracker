import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="display-name" />
      <Stack.Screen name="units" />
      <Stack.Screen name="goals" />
      <Stack.Screen name="measurements" />
      <Stack.Screen name="first-routine" />
    </Stack>
  );
}
