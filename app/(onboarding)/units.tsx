import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { OnboardingScaffold } from '../../src/components/onboarding/OnboardingScaffold';
import { Button } from '../../src/components/ui';
import { colors, fonts, spacing } from '../../src/constants';
import { DistanceUnit, HeightUnit, WeightUnit } from '../../src/models/profile';
import { useProfileStore } from '../../src/stores/profile.store';

interface UnitOption {
  label: string;
  value: string;
  hint: string;
}

interface UnitRowProps {
  label: string;
  helper: string;
  value: string;
  options: UnitOption[];
  onSelect: (next: string) => void;
}

function UnitRow({ label, helper, value, options, onSelect }: UnitRowProps) {
  return (
    <View style={styles.groupCard}>
      <Text style={styles.groupLabel}>{label}</Text>
      <Text style={styles.groupHelper}>{helper}</Text>
      <View style={styles.optionRow}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => onSelect(option.value)}
              activeOpacity={0.8}
              style={[styles.unitCard, selected && styles.unitCardSelected]}
            >
              <Text style={[styles.unitCardLabel, selected && styles.unitCardLabelSelected]}>{option.label}</Text>
              <Text style={[styles.unitCardHint, selected && styles.unitCardHintSelected]}>{option.hint}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function UnitsScreen() {
  const router = useRouter();
  const { updateProfile } = useProfileStore();

  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [heightUnit, setHeightUnit] = useState<HeightUnit>('cm');
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>('km');

  const handleContinue = async () => {
    await updateProfile({
      weight_unit: weightUnit,
      height_unit: heightUnit,
      distance_unit: distanceUnit,
    });
    router.push('/(onboarding)/measurements');
  };

  return (
    <OnboardingScaffold
      step={2}
      totalSteps={5}
      onBack={() => router.back()}
      title="Dial in your units"
      subtitle="Choose how your numbers appear so every set, rep, and distance reads naturally to you."
      footer={<Button title="Continue" onPress={handleContinue} />}
    >
      <UnitRow
        label="Weight"
        helper="Used for all training loads and personal records."
        value={weightUnit}
        onSelect={(next) => setWeightUnit(next as WeightUnit)}
        options={[
          { label: 'Kilograms', value: 'kg', hint: 'KG' },
          { label: 'Pounds', value: 'lbs', hint: 'LBS' },
        ]}
      />

      <UnitRow
        label="Height"
        helper="Used for profile setup and body metrics."
        value={heightUnit}
        onSelect={(next) => setHeightUnit(next as HeightUnit)}
        options={[
          { label: 'Centimeters', value: 'cm', hint: 'CM' },
          { label: 'Feet/Inches', value: 'in', hint: 'FT/IN' },
        ]}
      />

      <UnitRow
        label="Distance"
        helper="Used for cardio and conditioning movements."
        value={distanceUnit}
        onSelect={(next) => setDistanceUnit(next as DistanceUnit)}
        options={[
          { label: 'Kilometers', value: 'km', hint: 'KM' },
          { label: 'Miles', value: 'miles', hint: 'MI' },
        ]}
      />
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  groupCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(22, 22, 22, 0.92)',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  groupLabel: {
    color: colors.text,
    fontSize: 17,
    fontFamily: fonts.semiBold,
    marginBottom: 4,
  },
  groupHelper: {
    color: '#9AAEAE',
    fontSize: 13,
    fontFamily: fonts.regular,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  unitCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#363636',
    backgroundColor: '#121212',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    minHeight: 70,
    justifyContent: 'center',
  },
  unitCardSelected: {
    borderColor: '#4ECDC4',
    backgroundColor: 'rgba(78, 205, 196, 0.14)',
  },
  unitCardLabel: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.semiBold,
    marginBottom: 4,
  },
  unitCardLabelSelected: {
    color: '#DEFFFC',
  },
  unitCardHint: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.semiBold,
    letterSpacing: 0.3,
  },
  unitCardHintSelected: {
    color: '#8FD5CE',
  },
});
