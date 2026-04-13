import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useProfileStore } from '../../../src/stores/profile.store';
import { Button } from '../../../src/components/ui';
import { colors, fonts } from '../../../src/constants';
import { notificationService } from '../../../src/services';

function toTimeString(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function parseTime(value: string): Date {
  const [hhRaw, mmRaw] = value.split(':');
  const hh = Number.parseInt(hhRaw, 10);
  const mm = Number.parseInt(mmRaw, 10);

  const next = new Date();
  next.setSeconds(0, 0);

  if (!Number.isFinite(hh) || !Number.isFinite(mm)) {
    next.setHours(8, 0, 0, 0);
    return next;
  }

  next.setHours(Math.max(0, Math.min(23, hh)), Math.max(0, Math.min(59, mm)), 0, 0);
  return next;
}

function formatTimeLabel(value: string): string {
  const parsed = parseTime(value);
  return parsed.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

interface ToggleRowProps {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
}

function ToggleRow({ label, description, value, onValueChange, disabled = false }: ToggleRowProps) {
  return (
    <View style={[styles.row, disabled && styles.rowDisabled]}>
      <View style={styles.rowTextWrap}>
        <Text style={[styles.rowLabel, disabled && styles.rowLabelDisabled]}>{label}</Text>
        <Text style={styles.rowDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#3A3F47', true: '#2D6666' }}
        thumbColor={value ? '#8FE2DA' : '#A0A6B0'}
      />
    </View>
  );
}

export default function NotificationsSettingsScreen() {
  const { profile, updateProfile } = useProfileStore();

  const [restTimerEnabled, setRestTimerEnabled] = useState(true);
  const [workoutDayEnabled, setWorkoutDayEnabled] = useState(true);
  const [workoutRestDaysEnabled, setWorkoutRestDaysEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setRestTimerEnabled(profile.notify_rest_timer_enabled ?? true);
    setWorkoutDayEnabled(profile.notify_workout_day_enabled ?? true);
    setWorkoutRestDaysEnabled(profile.notify_workout_rest_days_enabled ?? false);
    setReminderTime(profile.notify_workout_day_time ?? '08:00');
  }, [profile]);

  const reminderDate = useMemo(() => parseTime(reminderTime), [reminderTime]);

  const handleTimeChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (!date) return;
    setReminderTime(toTimeString(date));
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      if (restTimerEnabled || workoutDayEnabled) {
        const granted = await notificationService.ensurePermissions();
        if (!granted) {
          Alert.alert(
            'Permission Needed',
            'Enable notifications in system settings to use rest timer and workout reminders.',
          );
          return;
        }
      }

      const updates = {
        notify_rest_timer_enabled: restTimerEnabled,
        notify_workout_day_enabled: workoutDayEnabled,
        notify_workout_day_time: reminderTime,
        notify_workout_rest_days_enabled: workoutRestDaysEnabled,
      };

      await updateProfile(updates);

      const nextProfile = {
        ...profile,
        ...updates,
      };

      if (!restTimerEnabled) {
        await notificationService.cancelRestTimerNotification();
      }
      await notificationService.syncWorkoutDayReminder(nextProfile);

      Alert.alert('Saved', 'Notification preferences updated.');
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message || 'Failed to save notification settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <ToggleRow
          label="Rest Timer Notifications"
          description="Notify when rest timer completes while app is in background."
          value={restTimerEnabled}
          onValueChange={setRestTimerEnabled}
        />

        <ToggleRow
          label="Workout Day Reminders"
          description="Daily reminder based on your current active routine week."
          value={workoutDayEnabled}
          onValueChange={setWorkoutDayEnabled}
        />

        <TouchableOpacity
          style={[styles.row, !workoutDayEnabled && styles.rowDisabled]}
          onPress={() => setShowTimePicker(true)}
          disabled={!workoutDayEnabled}
          activeOpacity={0.7}
        >
          <View style={styles.rowTextWrap}>
            <Text style={[styles.rowLabel, !workoutDayEnabled && styles.rowLabelDisabled]}>Reminder Time</Text>
            <Text style={styles.rowDescription}>Choose when daily workout reminders fire.</Text>
          </View>
          <Text style={styles.timeValue}>{formatTimeLabel(reminderTime)}</Text>
        </TouchableOpacity>

        <ToggleRow
          label="Notify on Rest Days"
          description="When enabled, sends a reminder even if no workout is scheduled today."
          value={workoutRestDaysEnabled}
          onValueChange={setWorkoutRestDaysEnabled}
          disabled={!workoutDayEnabled}
        />
      </View>

      {showTimePicker && (
        <View style={styles.timePickerWrap}>
          <DateTimePicker
            value={reminderDate}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
            themeVariant="dark"
          />
        </View>
      )}

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
    padding: 20,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  rowDisabled: {
    opacity: 0.55,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  rowLabelDisabled: {
    color: colors.textMuted,
  },
  rowDescription: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    lineHeight: 16,
  },
  timeValue: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
  },
  timePickerWrap: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    alignItems: 'center',
  },
  footer: {
    marginTop: 16,
  },
});
