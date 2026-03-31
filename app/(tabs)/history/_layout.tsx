import { Stack } from 'expo-router';
import { colors, fonts } from '../../../src/constants';

export default function HistoryLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fonts.bold },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'History' }} />
      <Stack.Screen name="[sessionId]" options={{ title: 'Workout Details' }} />
    </Stack>
  );
}
