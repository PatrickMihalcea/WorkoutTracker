import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { useProfileStore } from '../../src/stores/profile.store';
import { Button } from '../../src/components/ui';
import { colors, fonts } from '../../src/constants';
import { feetInchesToCm } from '../../src/utils/units';

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
      onboarding_complete: true,
    });
    router.replace('/(tabs)/today');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>Your measurements</Text>
        <Text style={styles.subtitle}>We'll use these for your profile</Text>

        <Text style={styles.fieldLabel}>
          Weight ({isLbs ? 'lbs' : 'kg'})
        </Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={weightValue}
            onValueChange={setWeightValue}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            {(isLbs ? WEIGHT_LBS_RANGE : WEIGHT_KG_RANGE).map((v) => (
              <Picker.Item key={v} label={`${v}`} value={v} />
            ))}
          </Picker>
        </View>

        <Text style={styles.fieldLabel}>
          Height ({isInches ? 'ft / in' : 'cm'})
        </Text>
        {isInches ? (
          <View style={styles.heightRow}>
            <View style={styles.heightPickerWrap}>
              <Picker
                selectedValue={heightFeet}
                onValueChange={setHeightFeet}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {HEIGHT_FEET_RANGE.map((v) => (
                  <Picker.Item key={v} label={`${v} ft`} value={v} />
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
                {HEIGHT_INCHES_RANGE.map((v) => (
                  <Picker.Item key={v} label={`${v} in`} value={v} />
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
              {HEIGHT_CM_RANGE.map((v) => (
                <Picker.Item key={v} label={`${v} cm`} value={v} />
              ))}
            </Picker>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Button title="Continue" onPress={handleContinue} />
      </View>
    </View>
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
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    overflow: 'hidden',
  },
  picker: {
    color: colors.text,
  },
  pickerItem: {
    color: colors.text,
    fontFamily: 'Monospaceland-SemiBold',
    fontSize: 18,
  },
  heightRow: {
    flexDirection: 'row',
    gap: 12,
  },
  heightPickerWrap: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
