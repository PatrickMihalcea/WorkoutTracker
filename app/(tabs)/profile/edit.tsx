import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useProfileStore } from '../../../src/stores/profile.store';
import { Button, Input } from '../../../src/components/ui';
import { fonts, spacing } from '../../../src/constants';
import { isLightTheme } from '../../../src/constants/themes';
import { Sex } from '../../../src/models/profile';
import { useTheme } from '../../../src/contexts/ThemeContext';
import type { ThemeColors } from '../../../src/constants/themes';
import { cmToFeetInches, feetInchesToCm } from '../../../src/utils/units';

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const MIN_BIRTHDAY = new Date(1900, 0, 1);

function generateRange(min: number, max: number, step = 1): number[] {
  const result: number[] = [];
  for (let i = min; i <= max; i += step) result.push(i);
  return result;
}

const HEIGHT_CM_RANGE = generateRange(100, 250);
const HEIGHT_FEET_RANGE = generateRange(3, 8);
const HEIGHT_INCHES_RANGE = generateRange(0, 11);

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const isLight = isLightTheme(theme);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile, updateProfile } = useProfileStore();
  const heightUnit = profile?.height_unit ?? 'cm';
  const initialHeightCm = profile?.height_cm ? Math.round(profile.height_cm) : 170;
  const initialFeetInches = cmToFeetInches(initialHeightCm);
  const [name, setName] = useState(profile?.name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [sex, setSex] = useState<Sex>(profile?.sex ?? 'other');
  const [birthday, setBirthday] = useState(
    profile?.birthday ? new Date(profile.birthday + 'T00:00:00') : new Date(),
  );
  const [heightCm, setHeightCm] = useState(initialHeightCm);
  const [heightFeet, setHeightFeet] = useState(initialFeetInches.feet);
  const [heightInches, setHeightInches] = useState(initialFeetInches.inches);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showHeightPicker, setShowHeightPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const heightDisplay = heightUnit === 'in'
    ? `${heightFeet}'${heightInches}"`
    : `${heightCm} cm`;

  const handleDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) setBirthday(date);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const nextHeightCm = heightUnit === 'in'
        ? Math.round(feetInchesToCm(heightFeet, heightInches) * 10000) / 10000
        : heightCm;

      await updateProfile({
        name: name.trim() || null,
        bio: bio.trim() || null,
        sex,
        birthday: birthday.toISOString().split('T')[0],
        height_cm: nextHeightCm,
      });
      router.back();
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} automaticallyAdjustKeyboardInsets>
      <Text style={styles.sectionLabel}>Display Name</Text>
      <Text style={styles.readOnly}>@{profile?.display_name}</Text>
      <Text style={styles.hint}>Display names cannot be changed here</Text>

      <Input
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="Your full name"
      />

      <Input
        label="Bio"
        value={bio}
        onChangeText={setBio}
        placeholder="Tell us about yourself"
        multiline
        numberOfLines={3}
      />

      <Text style={styles.sectionLabel}>Sex</Text>
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

      <Text style={styles.sectionLabel}>Birthday</Text>
      <View style={styles.editRow}>
        <TouchableOpacity
          style={styles.pickerValueButton}
          onPress={() => setShowDatePicker((prev) => (Platform.OS === 'ios' ? !prev : true))}
          activeOpacity={0.7}
        >
          <Text style={[styles.pickerButtonText, { color: colors.textSecondary }]}>{birthday.toLocaleDateString()}</Text>
        </TouchableOpacity>
      </View>
      {showDatePicker && (
        <DateTimePicker
          value={birthday}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={MIN_BIRTHDAY}
          maximumDate={new Date()}
          textColor={Platform.OS === 'ios' ? colors.textSecondary : undefined}
          themeVariant={isLight ? 'light' : 'dark'}
        />
      )}

      <Text style={styles.sectionLabel}>Height</Text>
      <View style={styles.editRow}>
        <TouchableOpacity
          style={styles.pickerValueButton}
          onPress={() => setShowHeightPicker((prev) => !prev)}
          activeOpacity={0.7}
        >
          <Text style={styles.pickerButtonText}>{heightDisplay}</Text>
        </TouchableOpacity>
      </View>
      {showHeightPicker && (
        heightUnit === 'in' ? (
          <View style={styles.heightRow}>
            <View style={styles.heightPickerWrap}>
              <Picker
                selectedValue={heightFeet}
                onValueChange={(value) => setHeightFeet(value)}
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
                onValueChange={(value) => setHeightInches(value)}
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
          <View style={styles.heightPickerWrap}>
            <Picker
              selectedValue={heightCm}
              onValueChange={(value) => setHeightCm(value)}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {HEIGHT_CM_RANGE.map((value) => (
                <Picker.Item key={value} label={`${value} cm`} value={value} />
              ))}
            </Picker>
          </View>
        )
      )}

      <Button title="Save" onPress={handleSave} loading={saving} style={styles.saveBtn} />
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: spacing.bottom,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 4,
  },
  readOnly: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    fontFamily: fonts.light,
    color: colors.textMuted,
    marginBottom: 20,
  },
  sexRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  sexChip: {
    flex: 1,
    paddingVertical: 12,
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
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
  },
  sexChipTextSelected: {
    color: colors.background,
  },
  editRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editRowLabel: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  pickerButtonText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  pickerValueButton: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 120,
    alignItems: 'center',
  },
  heightRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  heightPickerWrap: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceLight,
    overflow: 'hidden',
    marginBottom: 16,
  },
  picker: {
    color: colors.text,
  },
  pickerItem: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 18,
  },
  saveBtn: {
    marginTop: 16,
  },
});
