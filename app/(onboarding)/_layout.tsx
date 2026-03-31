import { Stack } from 'expo-router';
import { colors, fonts } from '../../src/constants';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fonts.bold },
        gestureEnabled: false,
        headerBackVisible: false,
      }}
    >
      <Stack.Screen name="display-name" options={{ title: 'Welcome' }} />
      <Stack.Screen name="units" options={{ title: 'Preferences' }} />
      <Stack.Screen name="birthday" options={{ title: 'Birthday' }} />
      <Stack.Screen name="measurements" options={{ title: 'Measurements' }} />
    </Stack>
  );
}
