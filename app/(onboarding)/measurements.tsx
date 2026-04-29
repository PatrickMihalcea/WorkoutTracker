import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

import { OnboardingScaffold } from '../../src/components/onboarding/OnboardingScaffold';
import { Button } from '../../src/components/ui';
import { fonts, spacing } from '../../src/constants';
import { feetInchesToCm } from '../../src/utils/units';
import { useProfileStore } from '../../src/stores/profile.store';
import { useTheme } from '../../src/contexts/ThemeContext';
import type { ThemeColors } from '../../src/constants/themes';

function generateRange(min: number, max: number, step = 1): number[] {
  const result: number[] = [];
  for (let i = min; i <= max; i += step) result.push(i);
  return result;
}

const WEIGHT_KG_RANGE = generateRange(30, 200);
const WEIGHT_LBS_RANGE = generateRange(66, 440);
const HEIGHT_CM_RANGE = generateRange(100, 250);
const HEIGHT_FEET_RANGE = generateRange(3, 8);
const HEIGHT_INCHES_RANGE = generateRange(0, 11);

export default function MeasurementsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { profile, updateProfile } = useProfileStore();

  const isLbs = profile?.weight_unit === 'lbs';
  const isInches = profile?.height_unit === 'in';

  const [weightValue, setWeightValue] = useState(isLbs ? 154 : 70);
  const [heightCm, setHeightCm] = useState(170);
  const [heightFeet, setHeightFeet] = useState(5);
  const [heightInches, setHeightInches] = useState(7);

  const handleContinue = async () => {
    const weightKg = isLbs ? Math.round((weightValue / 2.20462) * 10000) / 10000 : weightValue;
    const finalHeightCm = isInches ? feetInchesToCm(heightFeet, heightInches) : heightCm;

    await updateProfile({
      weight_kg: weightKg,
      height_cm: finalHeightCm,
    });

    router.push('/(onboarding)/goals');
  };

  return (
    <OnboardingScaffold
      step={3}
      totalSteps={5}
      onBack={() => router.back()}
      title="Finish your setup"
      subtitle="Final numbers. Accurate body metrics unlock cleaner trends and smarter progress tracking."
      footer={<Button title="Continue" onPress={handleContinue} variant="cta" size="lg" />}
    >
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Weight</Text>
          <Text style={styles.sectionUnitBadge}>{isLbs ? 'LBS' : 'KG'}</Text>
        </View>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={weightValue}
            onValueChange={setWeightValue}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            {(isLbs ? WEIGHT_LBS_RANGE : WEIGHT_KG_RANGE).map((value) => (
              <Picker.Item key={value} label={`${value} ${isLbs ? 'lbs' : 'kg'}`} value={value} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Height</Text>
          <Text style={styles.sectionUnitBadge}>{isInches ? 'FT/IN' : 'CM'}</Text>
        </View>

        {isInches ? (
          <View style={styles.heightRow}>
            <View style={styles.heightPickerWrap}>
              <Picker
                selectedValue={heightFeet}
                onValueChange={setHeightFeet}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {HEIGHT_FEET_RANGE.map((value) => (
                  <Picker.Item key={value} label={`${value} ft`} value={value} />
                ))}
              </Picker>
            </View>

            <View style={styles.heightPickerWrap}>
              <Picker
                selectedValue={heightInches}
                onValueChange={setHeightInches}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {HEIGHT_INCHES_RANGE.map((value) => (
                  <Picker.Item key={value} label={`${value} in`} value={value} />
                ))}
              </Picker>
            </View>
          </View>
        ) : (
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={heightCm}
              onValueChange={setHeightCm}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {HEIGHT_CM_RANGE.map((value) => (
                <Picker.Item key={value} label={`${value} cm`} value={value} />
              ))}
            </Picker>
          </View>
        )}
      </View>
    </OnboardingScaffold>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.accentDim,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 19,
    fontFamily: fonts.bold,
  },
  sectionUnitBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    color: colors.textSecondary,
    fontSize: 11,
    letterSpacing: 0.4,
    fontFamily: fonts.semiBold,
  },
  pickerContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceLight,
    overflow: 'hidden',
  },
  picker: {
    color: colors.text,
  },
  pickerItem: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 18,
  },
  heightRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  heightPickerWrap: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceLight,
    overflow: 'hidden',
  },
});
