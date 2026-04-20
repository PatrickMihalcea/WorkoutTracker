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
import { useProfileStore } from '../../../src/stores/profile.store';
import { Button, Input } from '../../../src/components/ui';
import { fonts } from '../../../src/constants';
import { Sex } from '../../../src/models/profile';
import { useTheme } from '../../../src/contexts/ThemeContext';
import type { ThemeColors } from '../../../src/constants/themes';

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const MIN_BIRTHDAY = new Date(1900, 0, 1);

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile, updateProfile } = useProfileStore();
  const [name, setName] = useState(profile?.name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [sex, setSex] = useState<Sex>(profile?.sex ?? 'other');
  const [birthday, setBirthday] = useState(
    profile?.birthday ? new Date(profile.birthday + 'T00:00:00') : new Date(),
  );
  const [showDatePicker, setShowDatePicker] = useState(Platform.OS === 'ios');
  const [saving, setSaving] = useState(false);

  const handleDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) setBirthday(date);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        name: name.trim() || null,
        bio: bio.trim() || null,
        sex,
        birthday: birthday.toISOString().split('T')[0],
      });
      Alert.alert('Saved', 'Profile updated successfully');
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
      {Platform.OS === 'android' && (
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.pickerButtonText}>
            {birthday.toLocaleDateString()}
          </Text>
        </TouchableOpacity>
      )}
      {showDatePicker && (
        <DateTimePicker
          value={birthday}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={MIN_BIRTHDAY}
          maximumDate={new Date()}
          themeVariant="dark"
        />
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
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginBottom: 8,
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
  pickerButton: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  pickerButtonText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  saveBtn: {
    marginTop: 16,
  },
});
