import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { OnboardingScaffold } from '../../src/components/onboarding/OnboardingScaffold';
import { Button } from '../../src/components/ui';
import { colors, fonts, spacing } from '../../src/constants';
import { kgToLbs, lbsToKg } from '../../src/utils/units';
import { useProfileStore } from '../../src/stores/profile.store';

function formatOptional(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '';
  return `${Math.round(value * 10) / 10}`;
}

export default function GoalsScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useProfileStore();
  const [saving, setSaving] = useState(false);

  const weightUnit = profile?.weight_unit ?? 'kg';
  const weightLabel = weightUnit === 'lbs' ? 'LBS' : 'KG';

  const [bodyWeightGoal, setBodyWeightGoal] = useState('');
  const [bodyFatGoal, setBodyFatGoal] = useState('');

  useEffect(() => {
    if (!profile) {
      setBodyWeightGoal('');
      setBodyFatGoal('');
      return;
    }

    const weightDisplay = profile.body_weight_kg_goal == null
      ? ''
      : formatOptional(weightUnit === 'lbs' ? kgToLbs(profile.body_weight_kg_goal) : profile.body_weight_kg_goal);

    setBodyWeightGoal(weightDisplay);
    setBodyFatGoal(formatOptional(profile.body_fat_pct_goal));
  }, [profile, weightUnit]);

  const handleContinue = async () => {
    const weightRaw = bodyWeightGoal.trim();
    const fatRaw = bodyFatGoal.trim();

    let bodyWeightKgGoal: number | null = null;
    if (weightRaw) {
      const parsedWeight = Number(weightRaw);
      if (!Number.isFinite(parsedWeight) || parsedWeight < 0) {
        Alert.alert('Invalid value', 'Body weight goal must be zero or greater.');
        return;
      }
      bodyWeightKgGoal = weightUnit === 'lbs' ? lbsToKg(parsedWeight) : parsedWeight;
      bodyWeightKgGoal = Math.round(bodyWeightKgGoal * 10000) / 10000;
    }

    let bodyFatPctGoal: number | null = null;
    if (fatRaw) {
      const parsedFat = Number(fatRaw);
      if (!Number.isFinite(parsedFat) || parsedFat < 0 || parsedFat > 100) {
        Alert.alert('Invalid value', 'Body fat goal must be between 0 and 100.');
        return;
      }
      bodyFatPctGoal = Math.round(parsedFat * 10000) / 10000;
    }

    try {
      setSaving(true);
      await updateProfile({
        body_weight_kg_goal: bodyWeightKgGoal,
        body_fat_pct_goal: bodyFatPctGoal,
      });
      router.push('/(onboarding)/first-routine');
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message || 'Could not save goals.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingScaffold
      step={4}
      totalSteps={5}
      onBack={() => router.back()}
      title="Set your goals"
      subtitle="Optional targets help shape your long-term trend lines. You can skip any field and edit later."
      footer={<Button title="Continue" onPress={handleContinue} loading={saving} />}
    >
      <View style={[styles.goalCard, styles.goalCardPrimary]}>
        <View style={styles.goalTopRow}>
          <Text style={styles.goalTitle}>Body Weight Goal</Text>
          <Text style={styles.goalUnit}>{weightLabel}</Text>
        </View>
        <Text style={styles.goalHint}>Where do you want your body weight trend to head?</Text>
        <TextInput
          value={bodyWeightGoal}
          onChangeText={setBodyWeightGoal}
          keyboardType="decimal-pad"
          placeholder={`Optional (${weightLabel})`}
          placeholderTextColor={colors.textMuted}
          style={styles.goalInput}
        />
      </View>

      <View style={[styles.goalCard, styles.goalCardSecondary]}>
        <View style={styles.goalTopRow}>
          <Text style={styles.goalTitle}>Body Fat Goal</Text>
          <Text style={styles.goalUnit}>%</Text>
        </View>
        <Text style={styles.goalHint}>Pick a realistic body fat target you can build toward.</Text>
        <TextInput
          value={bodyFatGoal}
          onChangeText={setBodyFatGoal}
          keyboardType="decimal-pad"
          placeholder="Optional (%)"
          placeholderTextColor={colors.textMuted}
          style={styles.goalInput}
        />
      </View>

    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  goalCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: spacing.sm + spacing.xs,
    marginBottom: spacing.md,
  },
  goalCardPrimary: {
    borderColor: '#3D7170',
    backgroundColor: 'rgba(18, 42, 44, 0.72)',
  },
  goalCardSecondary: {
    borderColor: '#365A5F',
    backgroundColor: 'rgba(18, 32, 36, 0.68)',
  },
  goalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  goalTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  goalUnit: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#4A7A7D',
    paddingHorizontal: 8,
    paddingVertical: 3,
    color: '#A9D8D8',
    fontSize: 11,
    fontFamily: fonts.semiBold,
    letterSpacing: 0.2,
  },
  goalHint: {
    color: '#9EB2B4',
    fontSize: 12,
    lineHeight: 17,
    fontFamily: fonts.regular,
    marginBottom: spacing.xs + spacing.xs,
  },
  goalInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#314E52',
    backgroundColor: 'rgba(10, 16, 18, 0.92)',
    color: colors.text,
    paddingHorizontal: spacing.sm + spacing.xs,
    fontSize: 16,
    fontFamily: fonts.semiBold,
  },
});
