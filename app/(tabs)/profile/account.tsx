import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../src/stores/auth.store';
import { Button } from '../../../src/components/ui';
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
  signOut: {
    marginTop: 24,
  },
  deleteAccount: {
    marginTop: 12,
    borderColor: '#7F2A2A',
    backgroundColor: '#2B1616',
    borderWidth: 1,
  },
});

interface AccountItemProps {
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}

function AccountItem({ label, onPress, styles }: AccountItemProps) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <Text style={styles.itemText}>{label}</Text>
      <Text style={styles.itemArrow}>›</Text>
    </TouchableOpacity>
  );
}

export default function AccountScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { signOut, deleteAccount, loading } = useAuthStore();

  const confirmSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your profile and workout data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
            } catch (error: unknown) {
              Alert.alert('Error', (error as Error).message || 'Could not delete account');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <AccountItem
          label="Change Username"
          onPress={() => router.push('/(tabs)/profile/change-username')}
          styles={styles}
        />
        <AccountItem
          label="Change Email"
          onPress={() => router.push('/(tabs)/profile/change-email')}
          styles={styles}
        />
        <AccountItem
          label="Update Password"
          onPress={() => router.push('/(tabs)/profile/change-password')}
          styles={styles}
        />
      </View>

      <Button
        title="Sign Out"
        variant="danger"
        onPress={confirmSignOut}
        disabled={loading}
        style={styles.signOut}
      />

      <Button
        title="Delete Account"
        variant="danger"
        onPress={confirmDeleteAccount}
        loading={loading}
        disabled={loading}
        style={styles.deleteAccount}
      />
    </View>
  );
}
