import { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { OnboardingScaffold } from '../../src/components/onboarding/OnboardingScaffold';
import { Input, Button } from '../../src/components/ui';
import { colors, fonts, spacing } from '../../src/constants';
import { Sex } from '../../src/models/profile';
import { profileService } from '../../src/services';
import { useAuthStore } from '../../src/stores/auth.store';
import { useProfileStore } from '../../src/stores/profile.store';

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export default function DisplayNameScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { setProfile } = useProfileStore();

  const [displayName, setDisplayName] = useState('');
  const [sex, setSex] = useState<Sex>('male');
  const defaultDate = new Date();
  defaultDate.setFullYear(defaultDate.getFullYear() - 25);
  const [birthday, setBirthday] = useState(defaultDate);
  const [loading, setLoading] = useState(false);

  const handleBirthdayChange = (_event: DateTimePickerEvent, next?: Date) => {
    if (next) setBirthday(next);
  };

  const handleContinue = async () => {
    const normalizedDisplayName = displayName.trim();
    if (!normalizedDisplayName) {
      Alert.alert('Error', 'Please enter a display name');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      const existingProfile = await profileService.getByUserId(user.id);
      const available = await profileService.checkDisplayNameAvailable(normalizedDisplayName);
      const isCurrentName = !!existingProfile?.display_name
        && existingProfile.display_name.toLowerCase() === normalizedDisplayName.toLowerCase();

      if (!available && !isCurrentName) {
        Alert.alert('Already taken', 'That display name is already taken. Try another one.');
        return;
      }

      const birthdayValue = birthday.toISOString().split('T')[0];

      const profile = existingProfile
        ? await profileService.update(user.id, {
            display_name: normalizedDisplayName,
            sex,
            birthday: birthdayValue,
          })
        : await profileService.create({
            id: user.id,
            display_name: normalizedDisplayName,
            name: null,
            bio: null,
            sex,
            birthday: birthdayValue,
            height_cm: null,
            weight_kg: null,
            weight_unit: 'kg',
            height_unit: 'cm',
            distance_unit: 'km',
            color_preferences: {},
            rest_timer_seconds: 90,
            notify_rest_timer_enabled: true,
            notify_workout_day_enabled: true,
            notify_workout_day_time: '08:00',
            notify_workout_rest_days_enabled: false,
            show_routine_performance: true,
            onboarding_complete: false,
          });

      setProfile(profile);
      router.push('/(onboarding)/units');
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      const msg = err.message ?? 'Something went wrong.';
      const isDisplayNameConflict = err.code === '23505'
        && msg.toLowerCase().includes('display');

      if (isDisplayNameConflict) {
        Alert.alert('Already taken', 'That display name is already taken. Try another one.');
        return;
      }

      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingScaffold
      step={1}
      title="Build your athlete profile"
      subtitle="Lock in your identity so your stats, records, and progress feel truly yours."
      footer={<Button title="Continue" onPress={handleContinue} loading={loading} />}
    >
      <View style={styles.sectionBlock}>
        <Text style={styles.fieldLabel}>Display Name</Text>
        <Input
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="e.g. ironlifter42"
          autoCapitalize="none"
          autoCorrect={false}
          containerStyle={styles.inputNoBottom}
        />
      </View>

      <View style={styles.sectionBlock}>
        <Text style={styles.fieldLabel}>Sex</Text>
        <View style={styles.sexGrid}>
          {SEX_OPTIONS.map((option) => {
            const selected = sex === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.sexCard, selected && styles.sexCardSelected]}
                onPress={() => setSex(option.value)}
                activeOpacity={0.8}
              >
                <Text style={[styles.sexLabel, selected && styles.sexLabelSelected]}>{option.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.sectionBlock}>
        <Text style={styles.fieldLabel}>Birthday</Text>
        <View style={styles.pickerCard}>
          <DateTimePicker
            value={birthday}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleBirthdayChange}
            maximumDate={new Date()}
            themeVariant="dark"
          />
        </View>
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  sectionBlock: {
    marginTop: spacing.md,
  },
  inputNoBottom: {
    marginBottom: 0,
  },
  sexGrid: {
    gap: spacing.sm,
  },
  sexCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(23, 23, 23, 0.92)',
    paddingVertical: spacing.sm + spacing.xs,
    paddingHorizontal: spacing.md,
  },
  sexCardSelected: {
    borderColor: '#4ECDC4',
    backgroundColor: 'rgba(78, 205, 196, 0.14)',
  },
  sexLabel: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  sexLabelSelected: {
    color: '#D8FFFB',
  },
  pickerCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(22, 22, 22, 0.92)',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
  },
});
