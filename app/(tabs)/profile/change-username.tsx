import { useMemo, useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useProfileStore } from '../../../src/stores/profile.store';
import { profileService } from '../../../src/services';
import { Button, Input } from '../../../src/components/ui';
import { useTheme } from '../../../src/contexts/ThemeContext';
import type { ThemeColors } from '../../../src/constants/themes';

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
});

export default function ChangeUsernameScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { profile, updateProfile } = useProfileStore();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const trimmed = displayName.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }
    if (trimmed.toLowerCase() === profile?.display_name?.toLowerCase()) {
      router.back();
      return;
    }

    setLoading(true);
    try {
      const available = await profileService.checkDisplayNameAvailable(trimmed);
      if (!available) {
        Alert.alert('Taken', 'That username is already in use');
        return;
      }
      await updateProfile({ display_name: trimmed });
      Alert.alert('Updated', 'Username changed successfully');
      router.back();
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Input
        label="New Username"
        value={displayName}
        onChangeText={setDisplayName}
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus
      />
      <Button title="Update" onPress={handleSave} loading={loading} />
    </KeyboardAvoidingView>
  );
}
