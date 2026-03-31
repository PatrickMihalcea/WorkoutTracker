import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useProfileStore } from '../../src/stores/profile.store';
import { Button } from '../../src/components/ui';
import { colors, fonts } from '../../src/constants';
import { WeightUnit, HeightUnit, DistanceUnit } from '../../src/models/profile';

interface UnitSwitchProps {
  label: string;
  optionA: string;
  optionB: string;
  value: string;
  onToggle: (val: string) => void;
}

function UnitSwitch({ label, optionA, optionB, value, onToggle }: UnitSwitchProps) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.switchLabel}>{label}</Text>
      <View style={styles.switchTrack}>
        <TouchableOpacity
          style={[styles.switchOption, value === optionA && styles.switchOptionActive]}
          onPress={() => onToggle(optionA)}
        >
          <Text style={[styles.switchText, value === optionA && styles.switchTextActive]}>
            {optionA.toUpperCase()}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.switchOption, value === optionB && styles.switchOptionActive]}
          onPress={() => onToggle(optionB)}
        >
          <Text style={[styles.switchText, value === optionB && styles.switchTextActive]}>
            {optionB.toUpperCase()}
          </Text>
        </TouchableOpacity>
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
    await updateProfile({ weight_unit: weightUnit, height_unit: heightUnit, distance_unit: distanceUnit });
    router.push('/(onboarding)/birthday');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>Unit preferences</Text>
        <Text style={styles.subtitle}>Choose how you measure things</Text>

        <UnitSwitch
          label="Weight"
          optionA="kg"
          optionB="lbs"
          value={weightUnit}
          onToggle={(v) => setWeightUnit(v as WeightUnit)}
        />
        <UnitSwitch
          label="Height"
          optionA="cm"
          optionB="in"
          value={heightUnit}
          onToggle={(v) => setHeightUnit(v as HeightUnit)}
        />
        <UnitSwitch
          label="Distance"
          optionA="km"
          optionB="miles"
          value={distanceUnit}
          onToggle={(v) => setDistanceUnit(v as DistanceUnit)}
        />
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  switchLabel: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  switchTrack: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  switchOption: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  switchOptionActive: {
    backgroundColor: colors.text,
  },
  switchText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.textMuted,
  },
  switchTextActive: {
    color: colors.background,
  },
});
