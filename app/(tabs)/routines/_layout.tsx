import { Stack } from 'expo-router';
import { AppStack } from '../../../src/components/ui';

export default function RoutinesLayout() {
  return (
    <AppStack>
      <Stack.Screen name="index" options={{ title: 'Routines' }} />
      <Stack.Screen name="create" options={{ title: 'New Routine' }} />
      <Stack.Screen name="[id]" options={{ title: 'Routine Details' }} />
      <Stack.Screen name="day/[dayId]" options={{ title: 'Edit Day', headerBackTitle: 'Routine' }} />
      <Stack.Screen name="day-details/[dayId]" options={{ title: 'Day Details', headerBackTitle: 'Routine' }} />
    </AppStack>
  );
}
