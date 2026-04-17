import { useMemo, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useProfileStore } from '../../../src/stores/profile.store';
import { fonts } from '../../../src/constants';
import { WeightUnit, HeightUnit, DistanceUnit } from '../../../src/models/profile';
import { useTheme } from '../../../src/contexts/ThemeContext';
import type { ThemeColors } from '../../../src/constants/themes';

interface UnitSwitchProps {
  label: string;
  optionA: string;
  optionB: string;
  value: string;
  onToggle: (val: string) => void;
  styles: ReturnType<typeof createStyles>;
}

function UnitSwitch({ label, optionA, optionB, value, onToggle, styles }: UnitSwitchProps) {
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile, updateProfile } = useProfileStore();
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(profile?.weight_unit ?? 'kg');
  const [heightUnit, setHeightUnit] = useState<HeightUnit>(profile?.height_unit ?? 'cm');
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>(profile?.distance_unit ?? 'km');

  useEffect(() => {
    if (profile) {
      setWeightUnit(profile.weight_unit);
      setHeightUnit(profile.height_unit);
      setDistanceUnit(profile.distance_unit);
    }
  }, [profile]);

  const handleWeightToggle = async (next: WeightUnit) => {
    if (!profile || next === weightUnit) return;
    const previous = weightUnit;
    setWeightUnit(next);
    try {
      await updateProfile({ weight_unit: next });
    } catch (error: unknown) {
      setWeightUnit(previous);
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleHeightToggle = async (next: HeightUnit) => {
    if (!profile || next === heightUnit) return;
    const previous = heightUnit;
    setHeightUnit(next);
    try {
      await updateProfile({ height_unit: next });
    } catch (error: unknown) {
      setHeightUnit(previous);
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleDistanceToggle = async (next: DistanceUnit) => {
    if (!profile || next === distanceUnit) return;
    const previous = distanceUnit;
    setDistanceUnit(next);
    try {
      await updateProfile({ distance_unit: next });
    } catch (error: unknown) {
      setDistanceUnit(previous);
      Alert.alert('Error', (error as Error).message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <UnitSwitch
          label="Weight"
          optionA="kg"
          optionB="lbs"
          value={weightUnit}
          onToggle={(v) => { void handleWeightToggle(v as WeightUnit); }}
          styles={styles}
        />
        <UnitSwitch
          label="Height"
          optionA="cm"
          optionB="in"
          value={heightUnit}
          onToggle={(v) => { void handleHeightToggle(v as HeightUnit); }}
          styles={styles}
        />
        <UnitSwitch
          label="Distance"
          optionA="km"
          optionB="miles"
          value={distanceUnit}
          onToggle={(v) => { void handleDistanceToggle(v as DistanceUnit); }}
          styles={styles}
        />
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
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
