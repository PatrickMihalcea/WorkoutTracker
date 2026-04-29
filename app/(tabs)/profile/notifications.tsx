import { useMemo, useState } from 'react';
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
import { fonts } from '../../../src/constants';
import { isLightTheme } from '../../../src/constants/themes';
import { notificationService } from '../../../src/services';
import { useTheme } from '../../../src/contexts/ThemeContext';
import type { ThemeColors } from '../../../src/constants/themes';

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
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
}

function ToggleRow({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
  styles,
  colors,
}: ToggleRowProps) {
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
        trackColor={{ false: colors.border, true: colors.accent }}
        thumbColor={value ? colors.text : colors.textMuted}
      />
    </View>
  );
}

export default function NotificationsSettingsScreen() {
  const { colors, theme } = useTheme();
  const isLight = isLightTheme(theme);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile, updateProfile } = useProfileStore();

  const [showTimePicker, setShowTimePicker] = useState(false);
  const restTimerEnabled = profile?.notify_rest_timer_enabled ?? true;
  const workoutDayEnabled = profile?.notify_workout_day_enabled ?? true;
  const workoutRestDaysEnabled = profile?.notify_workout_rest_days_enabled ?? false;
  const reminderTime = profile?.notify_workout_day_time ?? '08:00';

  const reminderDate = useMemo(() => parseTime(reminderTime), [reminderTime]);

  const persistNotificationUpdates = async (updates: {
    notify_rest_timer_enabled?: boolean;
    notify_workout_day_enabled?: boolean;
    notify_workout_day_time?: string;
    notify_workout_rest_days_enabled?: boolean;
  }) => {
    if (!profile) return;

    try {
      const nextProfile = { ...profile, ...updates };
      const wantsNotifications = Boolean(
        (nextProfile.notify_rest_timer_enabled ?? true)
          || (nextProfile.notify_workout_day_enabled ?? true),
      );

      if (wantsNotifications) {
        const granted = await notificationService.ensurePermissions();
        if (!granted) {
          Alert.alert(
            'Permission Needed',
            'Enable notifications in system settings to use rest timer and workout reminders.',
          );
          return;
        }
      }

      await updateProfile(updates);

      if (updates.notify_rest_timer_enabled === false) {
        await notificationService.cancelRestTimerNotification();
      }

      await notificationService.syncWorkoutDayReminder(nextProfile);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message || 'Failed to save notification settings.');
    }
  };

  const handleTimeChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (!date) return;
    const nextTime = toTimeString(date);
    if (nextTime === reminderTime) return;
    void persistNotificationUpdates({ notify_workout_day_time: nextTime });
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <ToggleRow
          label="Rest Timer Notifications"
          description="Notify when rest timer completes while app is in background."
          value={restTimerEnabled}
          onValueChange={(next) => {
            void persistNotificationUpdates({ notify_rest_timer_enabled: next });
          }}
          styles={styles}
          colors={colors}
        />

        <ToggleRow
          label="Workout Day Reminders"
          description="Daily reminder based on your current active routine week."
          value={workoutDayEnabled}
          onValueChange={(next) => {
            void persistNotificationUpdates({ notify_workout_day_enabled: next });
          }}
          styles={styles}
          colors={colors}
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
          onValueChange={(next) => {
            void persistNotificationUpdates({ notify_workout_rest_days_enabled: next });
          }}
          disabled={!workoutDayEnabled}
          styles={styles}
          colors={colors}
        />
      </View>

      {showTimePicker && (
        <View style={styles.timePickerWrap}>
          <DateTimePicker
            value={reminderDate}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
            textColor={Platform.OS === 'ios' ? colors.textSecondary : undefined}
            themeVariant={isLight ? 'light' : 'dark'}
          />
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
});
