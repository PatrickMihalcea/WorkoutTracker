import { useMemo, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { OnboardingScaffold } from '../../src/components/onboarding/OnboardingScaffold';
import { Input, Button } from '../../src/components/ui';
import { fonts, spacing } from '../../src/constants';
import { Sex } from '../../src/models/profile';
import { profileService } from '../../src/services';
import { useAuthStore } from '../../src/stores/auth.store';
import { useProfileStore } from '../../src/stores/profile.store';
import { useTheme } from '../../src/contexts/ThemeContext';
import type { ThemeColors } from '../../src/constants/themes';

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const MIN_BIRTHDAY = new Date(1900, 0, 1);

function formatBirthdayHeadline(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatBirthdayParts(date: Date): { month: string; day: string; year: string } {
  return {
    month: date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase(),
    day: String(date.getDate()),
    year: String(date.getFullYear()),
  };
}

function getAge(date: Date): number {
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const hasHadBirthdayThisYear = (
    today.getMonth() > date.getMonth()
    || (today.getMonth() === date.getMonth() && today.getDate() >= date.getDate())
  );
  if (!hasHadBirthdayThisYear) age -= 1;
  return Math.max(0, age);
}

export default function DisplayNameScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { user } = useAuthStore();
  const { setProfile } = useProfileStore();

  const [displayName, setDisplayName] = useState('');
  const [sex, setSex] = useState<Sex>('male');
  const defaultDate = new Date();
  defaultDate.setFullYear(defaultDate.getFullYear() - 25);
  const [birthday, setBirthday] = useState(defaultDate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const birthdayHeadline = useMemo(() => formatBirthdayHeadline(birthday), [birthday]);
  const birthdayParts = useMemo(() => formatBirthdayParts(birthday), [birthday]);
  const birthdayAge = useMemo(() => getAge(birthday), [birthday]);

  const handleBirthdayChange = (_event: DateTimePickerEvent, next?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
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
            tooltips_seen: {},
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
      totalSteps={5}
      title="Build your athlete profile"
      subtitle="Lock in your identity so your stats, records, and progress feel truly yours."
      autoScrollToFocusedInput
      footer={<Button title="Continue" onPress={handleContinue} loading={loading} variant="cta" size="lg" />}
    >
      <View style={styles.sectionBlock}>
        <Text style={styles.fieldLabel}>Display Name</Text>
        <Input
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="e.g. ironlifter42"
          autoFocus={false}
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
        <TouchableOpacity
          style={styles.birthdayCard}
          onPress={() => setShowDatePicker((prev) => !prev)}
          activeOpacity={0.85}
        >
          <View style={styles.birthdayTopRow}>
            <Text style={styles.birthdayHeadline}>{birthdayHeadline}</Text>
            <View style={styles.birthdayBadge}>
              <Text style={styles.birthdayBadgeText}>{birthdayAge} yrs</Text>
            </View>
          </View>
          <Text style={styles.birthdayHint}>
            {showDatePicker ? 'Tap again to hide picker' : 'Tap to choose your date of birth'}
          </Text>
          <View style={styles.birthdayPartsRow}>
            <View style={styles.birthdayPart}>
              <Text style={styles.birthdayPartLabel}>Month</Text>
              <Text style={styles.birthdayPartValue}>{birthdayParts.month}</Text>
            </View>
            <View style={styles.birthdayPartDivider} />
            <View style={styles.birthdayPart}>
              <Text style={styles.birthdayPartLabel}>Day</Text>
              <Text style={styles.birthdayPartValue}>{birthdayParts.day}</Text>
            </View>
            <View style={styles.birthdayPartDivider} />
            <View style={styles.birthdayPart}>
              <Text style={styles.birthdayPartLabel}>Year</Text>
              <Text style={styles.birthdayPartValue}>{birthdayParts.year}</Text>
            </View>
          </View>
        </TouchableOpacity>
        {showDatePicker && (
          <View style={styles.pickerCard}>
            <DateTimePicker
              value={birthday}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleBirthdayChange}
              minimumDate={MIN_BIRTHDAY}
              maximumDate={new Date()}
              themeVariant="dark"
            />
          </View>
        )}
      </View>
    </OnboardingScaffold>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm + spacing.xs,
    paddingHorizontal: spacing.md,
  },
  sexCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentDim,
  },
  sexLabel: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  sexLabelSelected: {
    color: colors.text,
  },
  birthdayCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.accentDim,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  birthdayTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  birthdayHeadline: {
    flex: 1,
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  birthdayBadge: {
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  birthdayBadgeText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  birthdayHint: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  birthdayPartsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  birthdayPart: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  birthdayPartLabel: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  birthdayPartValue: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  birthdayPartDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  pickerCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
});
