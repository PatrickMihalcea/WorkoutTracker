import { Stack } from 'expo-router';
import { colors, fonts } from '../../../src/constants';

export default function RoutinesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fonts.bold },
        headerBackTitleStyle: { fontSize: 12, fontFamily: fonts.regular },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Routines' }} />
      <Stack.Screen name="create" options={{ title: 'New Routine' }} />
      <Stack.Screen name="[id]" options={{ title: 'Routine Details' }} />
      <Stack.Screen name="day/[dayId]" options={{ title: 'Edit Day' }} />
    </Stack>
  );
}
