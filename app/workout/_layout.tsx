import { Stack } from 'expo-router';

export default function WorkoutLayout() {
  return (
    <Stack>
      <Stack.Screen name="active" options={{ headerShown: false }} />
    </Stack>
  );
}
