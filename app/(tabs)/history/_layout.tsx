import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { AppStack } from '../../../src/components/ui';
import { useHistoryView } from '../../../src/components/history/HistoryViewContext';
import { colors, fonts } from '../../../src/constants';

function HeaderDropdown() {
  const { view, toggle } = useHistoryView();
  const label = view === 'history' ? 'History' : 'Dashboard';

  return (
    <TouchableOpacity onPress={toggle} style={styles.dropdown} activeOpacity={0.7}>
      <Text style={styles.dropdownText}>{label}</Text>
      <Text style={styles.dropdownChevron}>▾</Text>
    </TouchableOpacity>
  );
}

function InnerLayout() {
  return (
    <AppStack>
      <Stack.Screen
        name="index"
        options={{
          headerTitle: () => <HeaderDropdown />,
        }}
      />
      <Stack.Screen name="[sessionId]" options={{ title: 'Workout Details' }} />
    </AppStack>
  );
}

export default function HistoryLayout() {
  return <InnerLayout />;
}

const styles = StyleSheet.create({
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dropdownText: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  dropdownChevron: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 1,
  },
});
