import { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useProfileStore } from '../../src/stores/profile.store';
import { Button } from '../../src/components/ui';
import { colors, fonts } from '../../src/constants';

export default function BirthdayScreen() {
  const router = useRouter();
  const { updateProfile } = useProfileStore();

  const defaultDate = new Date();
  defaultDate.setFullYear(defaultDate.getFullYear() - 25);
  const [birthday, setBirthday] = useState(defaultDate);

  const handleChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (date) setBirthday(date);
  };

  const handleContinue = async () => {
    const dateStr = birthday.toISOString().split('T')[0];
    await updateProfile({ birthday: dateStr });
    router.push('/(onboarding)/measurements');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>When were you born?</Text>
        <Text style={styles.subtitle}>This helps personalize your experience</Text>

        <View style={styles.pickerWrapper}>
          <DateTimePicker
            value={birthday}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleChange}
            maximumDate={new Date()}
            themeVariant="dark"
          />
        </View>
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
  pickerWrapper: {
    alignItems: 'center',
  },
});
