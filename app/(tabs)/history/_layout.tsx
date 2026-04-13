import React from 'react';
import { Stack } from 'expo-router';
import { AppStack } from '../../../src/components/ui';

function InnerLayout() {
  return (
    <AppStack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Dashboard',
        }}
      />
      <Stack.Screen
        name="activity"
        options={{
          title: 'Activity',
          headerBackTitle: 'Dashboard',
        }}
      />
    </AppStack>
  );
}

export default function HistoryLayout() {
  return <InnerLayout />;
}
