import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';
import { useProfileStore } from '../../src/stores/profile.store';
import { profileService } from '../../src/services';
import { Button, Input } from '../../src/components/ui';
import { colors, fonts } from '../../src/constants';
import { Sex } from '../../src/models/profile';

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'male', label: 'M' },
  { value: 'female', label: 'F' },
  { value: 'other', label: 'Other' },
];

export default function DisplayNameScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { setProfile } = useProfileStore();
  const [displayName, setDisplayName] = useState('');
  const [sex, setSex] = useState<Sex>('other');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Please enter a display name');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      const available = await profileService.checkDisplayNameAvailable(displayName.trim());
      if (!available) {
        Alert.alert('Taken', 'That display name is already in use. Please choose another.');
        return;
      }

      const profile = await profileService.create({
        id: user.id,
        display_name: displayName.trim(),
        name: null,
        bio: null,
        sex,
        birthday: null,
        height_cm: null,
        weight_kg: null,
        weight_unit: 'kg',
        height_unit: 'cm',
        distance_unit: 'km',
        onboarding_complete: false,
      });
      setProfile(profile);
      router.push('/(onboarding)/units');
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
      <View style={styles.content}>
        <Text style={styles.heading}>Choose your identity</Text>
        <Text style={styles.subtitle}>Pick a unique display name and your sex</Text>

        <Input
          label="Display Name"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="e.g. ironlifter42"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.fieldLabel}>Sex</Text>
        <View style={styles.sexRow}>
          {SEX_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.sexChip, sex === opt.value && styles.sexChipSelected]}
              onPress={() => setSex(opt.value)}
            >
              <Text style={[styles.sexChipText, sex === opt.value && styles.sexChipTextSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Button title="Continue" onPress={handleContinue} loading={loading} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  heading: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.light,
    color: colors.textMuted,
    marginBottom: 32,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  sexRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sexChip: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  sexChipSelected: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  sexChipText: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
  },
  sexChipTextSelected: {
    color: colors.background,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
