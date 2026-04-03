import { Stack } from 'expo-router';
import { AppStack } from '../../../src/components/ui';

export default function TodayLayout() {
  return (
    <AppStack>
      <Stack.Screen name="index" options={{ title: 'Today' }} />
      <Stack.Screen name="workout" options={{ headerShown: false }} />
    </AppStack>
  );
}
