import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useProfileStore } from '../../../src/stores/profile.store';
import { Button } from '../../../src/components/ui';
import { colors, fonts } from '../../../src/constants';
import { WeightUnit, HeightUnit, DistanceUnit } from '../../../src/models/profile';

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
  const { profile, updateProfile } = useProfileStore();
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(profile?.weight_unit ?? 'kg');
  const [heightUnit, setHeightUnit] = useState<HeightUnit>(profile?.height_unit ?? 'cm');
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>(profile?.distance_unit ?? 'km');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setWeightUnit(profile.weight_unit);
      setHeightUnit(profile.height_unit);
      setDistanceUnit(profile.distance_unit);
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        weight_unit: weightUnit,
        height_unit: heightUnit,
        distance_unit: distanceUnit,
      });
      Alert.alert('Saved', 'Unit preferences updated');
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setSaving(false);
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
        <Button title="Save" onPress={handleSave} loading={saving} />
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
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
