import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../../../src/constants';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { usePaywall } from '../../../src/contexts/PaywallContext';
import type { ThemeColors } from '../../../src/constants/themes';

const createStyles = (colors: ThemeColors, footerBottomOffset: number) => StyleSheet.create({
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
  footer: {
    marginTop: 'auto',
    paddingTop: 24,
    paddingBottom: footerBottomOffset,
    alignItems: 'flex-start',
  },
  footerText: {
    fontSize: 12,
    fontFamily: fonts.regular,
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
  const { showPaywall } = usePaywall();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const footerBottomOffset = Math.max(insets.bottom, 8) + 56;
  const styles = useMemo(() => createStyles(colors, footerBottomOffset), [colors, footerBottomOffset]);
  const appVersion = Constants.expoConfig?.version ?? Constants.nativeAppVersion;
  const buildVersion = Constants.nativeBuildVersion;
  const versionLabel = appVersion
    ? buildVersion && buildVersion !== appVersion
      ? `Version ${appVersion} (${buildVersion})`
      : `Version ${appVersion}`
    : 'Version unavailable';

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
        <SettingsItem
          label="Subscription"
          onPress={() => showPaywall()}
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
          label="Theme"
          onPress={() => router.push('/(tabs)/profile/colour-customization')}
          styles={styles}
        />
        <SettingsItem
          label="Workouts"
          onPress={() => router.push('/(tabs)/profile/workouts')}
          styles={styles}
        />
      </View>

      <Text style={styles.sectionHeader}>Other</Text>
      <View style={styles.section}>
        <SettingsItem
          label="About"
          onPress={() => router.push('/(tabs)/profile/about')}
          styles={styles}
        />
        <SettingsItem
          label="App Feedback"
          onPress={() => router.push('/(tabs)/profile/feedback')}
          styles={styles}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{versionLabel}</Text>
      </View>
    </View>
  );
}
