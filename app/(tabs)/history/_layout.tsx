import React, { useState } from 'react';
import { Text, TouchableOpacity, StyleSheet, Modal, View, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { AppStack } from '../../../src/components/ui';
import { useHistoryView, HistoryView } from '../../../src/components/history/HistoryViewContext';
import { colors, fonts } from '../../../src/constants';

const VIEW_OPTIONS: { key: HistoryView; label: string }[] = [
  { key: 'history', label: 'History' },
  { key: 'dashboard', label: 'Dashboard' },
];

function HeaderDropdown() {
  const { view, setView } = useHistoryView();
  const [open, setOpen] = useState(false);
  const label = VIEW_OPTIONS.find((o) => o.key === view)?.label ?? 'History';

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} style={styles.dropdown} activeOpacity={0.7}>
        <Text style={styles.dropdownText}>{label}</Text>
        <Text style={styles.dropdownChevron}>{open ? '▴' : '▾'}</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={styles.menu}>
            {VIEW_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.menuItem, view === opt.key && styles.menuItemActive]}
                activeOpacity={0.7}
                onPress={() => { setView(opt.key); setOpen(false); }}
              >
                <Text style={[styles.menuItemText, view === opt.key && styles.menuItemTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
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
  overlay: {
    flex: 1,
    paddingTop: 90,
    alignItems: 'center',
  },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 4,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  menuItemActive: {
    backgroundColor: 'rgba(78, 205, 196, 0.12)',
  },
  menuItemText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  menuItemTextActive: {
    fontFamily: fonts.bold,
    color: '#4ECDC4',
  },
});
