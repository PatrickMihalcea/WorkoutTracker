import { Stack } from 'expo-router';
import { colors, fonts } from '../../../src/constants';

export default function TodayLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fonts.bold },
        headerBackTitleStyle: { fontSize: 12, fontFamily: fonts.regular },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Today' }} />
    </Stack>
  );
}
