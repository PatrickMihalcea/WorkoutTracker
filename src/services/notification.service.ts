import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { DayOfWeek, RoutineWithDays } from '../models';
import { UserProfile } from '../models/profile';
import { routineService } from './routine.service';

const REST_TIMER_KIND = 'rest_timer';
const WORKOUT_DAY_KIND = 'workout_day';
const DEFAULT_REMINDER_TIME = '08:00';

let initialized = false;

function toExpoWeekday(day: DayOfWeek): number {
  switch (day) {
    case DayOfWeek.Monday:
      return 2;
    case DayOfWeek.Tuesday:
      return 3;
    case DayOfWeek.Wednesday:
      return 4;
    case DayOfWeek.Thursday:
      return 5;
    case DayOfWeek.Friday:
      return 6;
    case DayOfWeek.Saturday:
      return 7;
    case DayOfWeek.Sunday:
    default:
      return 1;
  }
}

function parseReminderTime(value?: string | null): { hour: number; minute: number } {
  const source = value && /^\d{2}:\d{2}$/.test(value) ? value : DEFAULT_REMINDER_TIME;
  const [hhRaw, mmRaw] = source.split(':');
  const hour = Number.parseInt(hhRaw, 10);
  const minute = Number.parseInt(mmRaw, 10);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return { hour: 8, minute: 0 };
  }

  return {
    hour: Math.max(0, Math.min(23, hour)),
    minute: Math.max(0, Math.min(59, minute)),
  };
}

function buildLabelsByDay(routine: RoutineWithDays | null): Record<DayOfWeek, string[]> {
  const result: Record<DayOfWeek, string[]> = {
    [DayOfWeek.Monday]: [],
    [DayOfWeek.Tuesday]: [],
    [DayOfWeek.Wednesday]: [],
    [DayOfWeek.Thursday]: [],
    [DayOfWeek.Friday]: [],
    [DayOfWeek.Saturday]: [],
    [DayOfWeek.Sunday]: [],
  };

  if (!routine) return result;

  for (const day of routine.days) {
    if (day.week_index !== routine.current_week) continue;
    if (!day.day_of_week) continue;

    const key = day.day_of_week as DayOfWeek;
    if (!result[key].includes(day.label)) {
      result[key].push(day.label);
    }
  }

  return result;
}

function buildWorkoutBody(labels: string[]): string {
  if (labels.length <= 1) {
    return `Today is ${labels[0] ?? 'Workout Day'}.`;
  }
  return `Today's workout: ${labels.join(' + ')}.`;
}

function isGranted(status: Notifications.NotificationPermissionsStatus): boolean {
  return status.granted;
}

async function hasPermission(): Promise<boolean> {
  const status = await Notifications.getPermissionsAsync();
  return isGranted(status);
}

async function cancelByKind(kind: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const matches = scheduled
    .filter((n) => {
      const data = n.content.data as Record<string, unknown> | undefined;
      return data?.kind === kind;
    })
    .map((n) => n.identifier);

  await Promise.all(matches.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

async function scheduleWorkoutDayFor(
  day: DayOfWeek,
  labels: string[],
  profile: UserProfile,
): Promise<void> {
  const hasWorkout = labels.length > 0;
  const shouldNotify = hasWorkout || profile.notify_workout_rest_days_enabled;

  if (!shouldNotify) return;

  const { hour, minute } = parseReminderTime(profile.notify_workout_day_time);
  const title = hasWorkout ? 'Workout Reminder' : 'Recovery Reminder';
  const body = hasWorkout ? buildWorkoutBody(labels) : 'Recovery day. Stay consistent with sleep, nutrition, and mobility.';

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      data: {
        kind: WORKOUT_DAY_KIND,
        day,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      weekday: toExpoWeekday(day),
      hour,
      minute,
      repeats: true,
      channelId: Platform.OS === 'android' ? 'workout-day-reminders' : undefined,
    },
  });
}

export const notificationService = {
  async initialize(): Promise<void> {
    if (initialized) return;

    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const data = notification.request.content.data as Record<string, unknown> | undefined;
        const kind = data?.kind;

        if (kind === REST_TIMER_KIND) {
          return {
            shouldShowBanner: false,
            shouldShowList: false,
            shouldPlaySound: false,
            shouldSetBadge: false,
          };
        }

        return {
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        };
      },
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('workout-day-reminders', {
        name: 'Workout Day Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });

      await Notifications.setNotificationChannelAsync('rest-timer', {
        name: 'Rest Timer',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    initialized = true;
  },

  async ensurePermissions(): Promise<boolean> {
    await this.initialize();

    const current = await Notifications.getPermissionsAsync();
    if (isGranted(current)) return true;

    const requested = await Notifications.requestPermissionsAsync();
    return isGranted(requested);
  },

  async cancelRestTimerNotification(): Promise<void> {
    await this.initialize();
    await cancelByKind(REST_TIMER_KIND);
  },

  async scheduleRestTimerNotification(seconds: number): Promise<void> {
    await this.initialize();
    await this.cancelRestTimerNotification();

    if (seconds <= 0) return;
    const granted = await this.ensurePermissions();
    if (!granted) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Rest Timer Complete',
        body: 'Rest is over. Ready for your next set?',
        sound: true,
        data: {
          kind: REST_TIMER_KIND,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
        repeats: false,
        channelId: Platform.OS === 'android' ? 'rest-timer' : undefined,
      },
    });
  },

  async cancelWorkoutDayReminderNotifications(): Promise<void> {
    await this.initialize();
    await cancelByKind(WORKOUT_DAY_KIND);
  },

  async syncWorkoutDayReminder(profile: UserProfile | null): Promise<void> {
    await this.initialize();
    await this.cancelWorkoutDayReminderNotifications();

    if (!profile?.notify_workout_day_enabled) return;
    const granted = await this.ensurePermissions();
    if (!granted) return;

    let routine: RoutineWithDays | null = null;
    try {
      routine = await routineService.getActive();
    } catch {
      routine = null;
    }

    const labelsByDay = buildLabelsByDay(routine);
    const orderedDays: DayOfWeek[] = [
      DayOfWeek.Monday,
      DayOfWeek.Tuesday,
      DayOfWeek.Wednesday,
      DayOfWeek.Thursday,
      DayOfWeek.Friday,
      DayOfWeek.Saturday,
      DayOfWeek.Sunday,
    ];

    for (const day of orderedDays) {
      await scheduleWorkoutDayFor(day, labelsByDay[day], profile);
    }
  },
};
