import { Stack } from 'expo-router';
import { colors, fonts } from '../../src/constants';

export default function WorkoutLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fonts.bold },
        presentation: 'modal',
      }}
    >
      <Stack.Screen name="active" options={{ title: 'Workout' }} />
    </Stack>
  );
}
