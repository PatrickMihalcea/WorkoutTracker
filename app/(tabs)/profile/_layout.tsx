import { Stack } from 'expo-router';
import { AppStack } from '../../../src/components/ui';

export default function ProfileLayout() {
  return (
    <AppStack>
      <Stack.Screen name="index" options={{ title: 'Profile' }} />
      <Stack.Screen name="edit" options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="account" options={{ title: 'Account' }} />
      <Stack.Screen name="subscription" options={{ title: 'Subscription' }} />
      <Stack.Screen name="change-username" options={{ title: 'Change Username' }} />
      <Stack.Screen name="change-email" options={{ title: 'Change Email' }} />
      <Stack.Screen name="change-password" options={{ title: 'Change Password' }} />
      <Stack.Screen name="units" options={{ title: 'Units' }} />
      <Stack.Screen name="colour-customization" options={{ title: 'Colour Customization' }} />
      <Stack.Screen name="workouts" options={{ title: 'Workouts' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="about" options={{ title: 'About' }} />
      <Stack.Screen name="feedback" options={{ title: 'App Feedback' }} />
      <Stack.Screen name="measurements" options={{ title: 'Measurements', headerBackButtonMenuEnabled: false }} />
      <Stack.Screen name="goals" options={{ title: 'Goals', headerBackButtonMenuEnabled: false }} />
      <Stack.Screen name="[sessionId]" options={{ title: 'Workout Details' }} />
    </AppStack>
  );
}
