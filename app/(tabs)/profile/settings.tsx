import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { fonts } from '../../../src/constants';
import { useTheme } from '../../../src/contexts/ThemeContext';
import type { ThemeColors } from '../../../src/constants/themes';

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  sectionHeader: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  itemArrow: {
    fontSize: 20,
    fontFamily: fonts.light,
    color: colors.textMuted,
  },
});

interface SettingsItemProps {
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}

function SettingsItem({ label, onPress, styles }: SettingsItemProps) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <Text style={styles.itemText}>{label}</Text>
      <Text style={styles.itemArrow}>›</Text>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>Account</Text>
      <View style={styles.section}>
        <SettingsItem
          label="Profile"
          onPress={() => router.push('/(tabs)/profile/edit')}
          styles={styles}
        />
        <SettingsItem
          label="Account"
          onPress={() => router.push('/(tabs)/profile/account')}
          styles={styles}
        />
      </View>

      <Text style={styles.sectionHeader}>Preferences</Text>
      <View style={styles.section}>
        <SettingsItem
          label="Units"
          onPress={() => router.push('/(tabs)/profile/units')}
          styles={styles}
        />
        <SettingsItem
          label="Notifications"
          onPress={() => router.push('/(tabs)/profile/notifications')}
          styles={styles}
        />
        <SettingsItem
          label="Colour Customization"
          onPress={() => router.push('/(tabs)/profile/colour-customization')}
          styles={styles}
        />
        <SettingsItem
          label="Workouts"
          onPress={() => router.push('/(tabs)/profile/workouts')}
          styles={styles}
        />
      </View>
    </View>
  );
}
