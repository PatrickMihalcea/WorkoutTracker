import React from 'react';
import { Stack } from 'expo-router';
import { AppStack, HeaderDropdown } from '../../../src/components/ui';
import { useHistoryView, HistoryView } from '../../../src/components/history/HistoryViewContext';

const VIEW_OPTIONS: { key: HistoryView; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'history', label: 'History' },
];

function HeaderViewDropdown() {
  const { view, setView } = useHistoryView();

  return (
    <HeaderDropdown
      options={VIEW_OPTIONS}
      selectedKey={view}
      onSelect={setView}
      fallbackLabel="History"
    />
  );
}

function InnerLayout() {
  return (
    <AppStack>
      <Stack.Screen
        name="index"
        options={{
          headerTitle: () => <HeaderViewDropdown />,
        }}
      />
      <Stack.Screen
        name="activity"
        options={{
          title: 'Activity',
          headerBackTitle: 'Dashboard',
        }}
      />
      <Stack.Screen name="[sessionId]" options={{ title: 'Workout Details' }} />
    </AppStack>
  );
}

export default function HistoryLayout() {
  return <InnerLayout />;
}
