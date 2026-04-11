import React from 'react';
import { useRouter } from 'expo-router';
import { HeaderDropdown } from '../ui';

type DayViewKey = 'edit' | 'details';

interface DayViewHeaderDropdownProps {
  dayId: string;
  currentView: DayViewKey;
}

const VIEW_OPTIONS: { key: DayViewKey; label: string }[] = [
  { key: 'edit', label: 'Edit Day' },
  { key: 'details', label: 'Day Details' },
];

export function DayViewHeaderDropdown({ dayId, currentView }: DayViewHeaderDropdownProps) {
  const router = useRouter();

  const navigate = (view: DayViewKey) => {
    if (!dayId) return;
    if (view === currentView) return;
    if (view === 'edit') {
      router.replace(`/(tabs)/routines/day/${dayId}`);
      return;
    }
    router.replace(`/(tabs)/routines/day-details/${dayId}`);
  };

  return (
    <HeaderDropdown
      options={VIEW_OPTIONS}
      selectedKey={currentView}
      onSelect={navigate}
      fallbackLabel="Edit Day"
    />
  );
}
