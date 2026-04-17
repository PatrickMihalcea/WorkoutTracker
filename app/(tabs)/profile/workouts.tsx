import { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useProfileStore } from '../../../src/stores/profile.store';
import { RestTimerModal } from '../../../src/components/workout/RestTimerModal';
import { fonts } from '../../../src/constants';
import { useTheme } from '../../../src/contexts/ThemeContext';
import type { ThemeColors } from '../../../src/constants/themes';

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  itemText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemValue: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
  itemArrow: {
    fontSize: 20,
    fontFamily: fonts.light,
    color: colors.textMuted,
  },
});

function formatTimerLabel(seconds: number): string {
  if (seconds === 0) return 'Off';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export default function WorkoutsSettingsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile, updateProfile } = useProfileStore();
  const restSeconds = profile?.rest_timer_seconds ?? 90;
  const [showPicker, setShowPicker] = useState(false);

  const handleSave = async (value: number) => {
    await updateProfile({ rest_timer_seconds: value });
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <TouchableOpacity style={styles.item} onPress={() => setShowPicker(true)}>
          <Text style={styles.itemText}>Default Rest Timer</Text>
          <View style={styles.itemRight}>
            <Text style={styles.itemValue}>{formatTimerLabel(restSeconds)}</Text>
            <Text style={styles.itemArrow}>›</Text>
          </View>
        </TouchableOpacity>
      </View>

      <RestTimerModal
        visible={showPicker}
        currentValue={restSeconds}
        onSave={handleSave}
        autoSave
        onClose={() => setShowPicker(false)}
      />
    </View>
  );
}
