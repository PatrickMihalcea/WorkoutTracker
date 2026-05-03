import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useNavigation, usePreventRemove } from '@react-navigation/native';
import { usePaywall } from '../../../src/contexts/PaywallContext';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useProfileStore } from '../../../src/stores/profile.store';
import { useSubscriptionStore } from '../../../src/stores/subscription.store';
import { BodyMeasurement, BODY_MEASUREMENT_METRICS, MeasurementMetricKey } from '../../../src/models';
import { measurementService } from '../../../src/services';
import { profileService } from '../../../src/services/profile.service';
import { Button, Card, Input } from '../../../src/components/ui';
import { fonts, spacing } from '../../../src/constants';
import { isLightTheme } from '../../../src/constants/themes';
import { cmToIn, inToCm, kgToLbs, lbsToKg } from '../../../src/utils/units';
import { useTheme } from '../../../src/contexts/ThemeContext';
import type { ThemeColors } from '../../../src/constants/themes';

type FormValues = Record<MeasurementMetricKey, string>;
type FormSnapshot = {
  dateKey: string;
  values: FormValues;
};
const MAX_SCROLL_TO_LOG_RETRIES = 12;
const BASIC_MEASUREMENT_KEYS: MeasurementMetricKey[] = ['body_weight', 'body_fat_pct', 'waist'];
const CROWN_ICON = require('../../../assets/icons/crown.png') as number;

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fromDateKey(key: string): Date {
  return new Date(`${key}T00:00:00`);
}

function createEmptyFormValues(): FormValues {
  return BODY_MEASUREMENT_METRICS.reduce((acc, metric) => {
    acc[metric.key] = '';
    return acc;
  }, {} as FormValues);
}

function normalizeFormValue(value: string): string {
  return value.trim();
}

function buildFormSnapshot(date: Date, values: FormValues): FormSnapshot {
  const normalized = createEmptyFormValues();
  for (const metric of BODY_MEASUREMENT_METRICS) {
    normalized[metric.key] = normalizeFormValue(values[metric.key] ?? '');
  }
  return {
    dateKey: toDateKey(date),
    values: normalized,
  };
}

function areSnapshotsEqual(a: FormSnapshot | null, b: FormSnapshot | null): boolean {
  if (!a || !b) return false;
  if (a.dateKey !== b.dateKey) return false;
  for (const metric of BODY_MEASUREMENT_METRICS) {
    if (a.values[metric.key] !== b.values[metric.key]) return false;
  }
  return true;
}

export default function MeasurementsScreen() {
  const { colors, theme } = useTheme();
  const isLight = isLightTheme(theme);
  const styles = useMemo(() => createStyles(colors, isLight), [colors, isLight]);
  const navigation = useNavigation();
  const { showPaywall } = usePaywall();
  const user = useAuthStore((s) => s.user);
  const { profile, setProfile } = useProfileStore();
  const isPremium = useSubscriptionStore((state) => state.isPremium);
  const wUnit = profile?.weight_unit ?? 'kg';
  const hUnit = profile?.height_unit ?? 'cm';
  const wLabel = wUnit === 'lbs' ? 'lbs' : 'kg';
  const hLabel = hUnit === 'in' ? 'in' : 'cm';

  const [logs, setLogs] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<BodyMeasurement | null>(null);
  const [formDate, setFormDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [advancedExpanded, setAdvancedExpanded] = useState(true);
  const [formValues, setFormValues] = useState<FormValues>(createEmptyFormValues);
  const scrollRef = useRef<ScrollView>(null);
  const logYByIdRef = useRef<Record<string, number>>({});
  const pendingScrollLogIdRef = useRef<string | null>(null);
  const pendingScrollRetriesRef = useRef(0);
  const initialFormSnapshotRef = useRef<FormSnapshot | null>(null);
  const allowNextLeaveRef = useRef(false);
  const basicMetrics = useMemo(
    () => BASIC_MEASUREMENT_KEYS
      .map((key) => BODY_MEASUREMENT_METRICS.find((metric) => metric.key === key))
      .filter((metric): metric is typeof BODY_MEASUREMENT_METRICS[number] => !!metric),
    [],
  );
  const advancedMetrics = useMemo(
    () => BODY_MEASUREMENT_METRICS.filter((metric) => !BASIC_MEASUREMENT_KEYS.includes(metric.key)),
    [],
  );

  const scrollToTop = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
  }, []);

  const attemptPendingScrollToLog = useCallback(() => {
    const attempt = () => {
      const logId = pendingScrollLogIdRef.current;
      if (!logId || formOpen) return;

      const y = logYByIdRef.current[logId];
      if (typeof y === 'number') {
        scrollRef.current?.scrollTo({ y: Math.max(0, y - spacing.sm), animated: true });
        pendingScrollLogIdRef.current = null;
        pendingScrollRetriesRef.current = 0;
        return;
      }

      if (pendingScrollRetriesRef.current >= MAX_SCROLL_TO_LOG_RETRIES) {
        pendingScrollLogIdRef.current = null;
        pendingScrollRetriesRef.current = 0;
        return;
      }

      pendingScrollRetriesRef.current += 1;
      setTimeout(attempt, 120);
    };

    setTimeout(attempt, 0);
  }, [formOpen]);

  const unitLabelForMetric = useCallback((key: MeasurementMetricKey) => {
    const metric = BODY_MEASUREMENT_METRICS.find((m) => m.key === key);
    if (!metric) return '';
    if (metric.unitKind === 'weight') return wLabel;
    if (metric.unitKind === 'circumference') return hLabel;
    return '%';
  }, [wLabel, hLabel]);

  const toDisplayValue = useCallback((metricKey: MeasurementMetricKey, storedValue: number) => {
    const metric = BODY_MEASUREMENT_METRICS.find((m) => m.key === metricKey);
    if (!metric) return storedValue;
    if (metric.unitKind === 'weight') return wUnit === 'lbs' ? kgToLbs(storedValue) : storedValue;
    if (metric.unitKind === 'circumference') return hUnit === 'in' ? cmToIn(storedValue) : storedValue;
    return storedValue;
  }, [wUnit, hUnit]);

  const toStoredValue = useCallback((metricKey: MeasurementMetricKey, displayValue: number) => {
    const metric = BODY_MEASUREMENT_METRICS.find((m) => m.key === metricKey);
    if (!metric) return displayValue;
    if (metric.unitKind === 'weight') return wUnit === 'lbs' ? lbsToKg(displayValue) : displayValue;
    if (metric.unitKind === 'circumference') return hUnit === 'in' ? inToCm(displayValue) : displayValue;
    return displayValue;
  }, [wUnit, hUnit]);

  const loadLogs = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await measurementService.list(user.id);
      logYByIdRef.current = {};
      setLogs(data);
    } catch {
      logYByIdRef.current = {};
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    if (!formOpen && pendingScrollLogIdRef.current) {
      attemptPendingScrollToLog();
    }
  }, [attemptPendingScrollToLog, formOpen, logs]);

  const refreshProfileSilently = useCallback(async (userId: string) => {
    try {
      const next = await profileService.getByUserId(userId);
      setProfile(next);
    } catch {
      // Keep local profile if refresh fails
    }
  }, [setProfile]);

  const resetForm = useCallback(() => {
    setFormValues(createEmptyFormValues());
    setFormDate(new Date());
    setEditingLog(null);
    setFormOpen(false);
    setShowDatePicker(false);
    initialFormSnapshotRef.current = null;
  }, []);

  const openCreate = useCallback(() => {
    const nextDate = new Date();
    const nextValues = createEmptyFormValues();
    setEditingLog(null);
    setFormValues(nextValues);
    setFormDate(nextDate);
    setFormOpen(true);
    setShowDatePicker(false);
    initialFormSnapshotRef.current = buildFormSnapshot(nextDate, nextValues);
    scrollToTop();
  }, [scrollToTop]);

  const openEdit = useCallback((log: BodyMeasurement) => {
    const nextValues = createEmptyFormValues();
    for (const metric of BODY_MEASUREMENT_METRICS) {
      const stored = log[metric.column];
      if (stored !== null && stored !== undefined) {
        const display = toDisplayValue(metric.key, stored);
        nextValues[metric.key] = `${Math.round(display * 10) / 10}`;
      }
    }
    setEditingLog(log);
    setFormValues(nextValues);
    const nextDate = fromDateKey(log.logged_on);
    setFormDate(nextDate);
    setFormOpen(true);
    setShowDatePicker(false);
    initialFormSnapshotRef.current = buildFormSnapshot(nextDate, nextValues);
    scrollToTop();
  }, [scrollToTop, toDisplayValue]);

  const handleDateChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selected) setFormDate(selected);
  };

  const saveForm = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(formDate);
    selectedDate.setHours(0, 0, 0, 0);
    if (selectedDate.getTime() > today.getTime()) {
      Alert.alert('Invalid Date', 'Future dates are not allowed.');
      return false;
    }

    const canonical: Partial<BodyMeasurement> = {};
    let hasAny = false;

    for (const metric of BODY_MEASUREMENT_METRICS) {
      const raw = formValues[metric.key].trim();
      if (!raw) {
        canonical[metric.column] = null;
        continue;
      }

      const parsed = Number(raw);
      if (!Number.isFinite(parsed) || parsed < 0) {
        Alert.alert('Invalid value', `${metric.label} must be a positive number.`);
        return false;
      }

      canonical[metric.column] = Math.round(toStoredValue(metric.key, parsed) * 10000) / 10000;
      hasAny = true;
    }

    if (!hasAny) {
      if (editingLog) {
        Alert.alert(
          'Delete Entry',
          'All measurements are empty. Delete this entry?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                try {
                  setSaving(true);
                  await measurementService.delete(editingLog.id, user.id);
                  await loadLogs();
                  await refreshProfileSilently(user.id);
                  resetForm();
                } catch {
                  Alert.alert('Error', 'Failed to delete measurement entry.');
                } finally {
                  setSaving(false);
                }
              },
            },
          ],
        );
      } else {
        Alert.alert('Missing Data', 'Enter at least one measurement.');
      }
      return false;
    }

    const nextDateKey = toDateKey(selectedDate);

    const performSave = async (replaceConfirmed: boolean): Promise<boolean> => {
      const conflictingLog = logs.find((log) => (
        log.logged_on === nextDateKey && log.id !== editingLog?.id
      ));

      if (conflictingLog && !replaceConfirmed) {
        const conflictDate = new Date(`${nextDateKey}T00:00:00`).toLocaleDateString();
        Alert.alert(
          'Date Already Exists',
          `A measurement log already exists for ${conflictDate}.`,
          [
            { text: 'Go Back', style: 'cancel' },
            {
              text: 'Replace Existing',
              style: 'destructive',
              onPress: () => {
                void performSave(true);
              },
            },
          ],
        );
        return false;
      }

      try {
        setSaving(true);
        const savedLog = await measurementService.upsertByDate(user.id, {
          logged_on: nextDateKey,
          ...canonical,
        });

        if (editingLog && editingLog.id !== savedLog.id) {
          await measurementService.delete(editingLog.id, user.id);
        }

        pendingScrollLogIdRef.current = savedLog.id;
        pendingScrollRetriesRef.current = 0;

        await loadLogs();
        await refreshProfileSilently(user.id);
        resetForm();
        return true;
      } catch {
        Alert.alert('Error', 'Failed to save measurement entry.');
        return false;
      } finally {
        setSaving(false);
      }
    };

    return await performSave(false);
  }, [
    editingLog,
    formDate,
    formValues,
    refreshProfileSilently,
    loadLogs,
    logs,
    resetForm,
    toStoredValue,
    user?.id,
  ]);

  const isFormDirty = useMemo(() => {
    if (!formOpen) return false;
    const initial = initialFormSnapshotRef.current;
    if (!initial) return false;
    const current = buildFormSnapshot(formDate, formValues);
    return !areSnapshotsEqual(initial, current);
  }, [formDate, formOpen, formValues]);

  usePreventRemove(isFormDirty, ({ data }) => {
    if (allowNextLeaveRef.current) {
      allowNextLeaveRef.current = false;
      return;
    }

    const action = data.action;

    Alert.alert(
      'Unsaved Changes',
      'Save changes before leaving Measurements?',
      [
        {
          text: 'Save',
          onPress: () => {
            void (async () => {
              const saved = await saveForm();
              if (saved) {
                allowNextLeaveRef.current = true;
                navigation.dispatch(action);
              }
            })();
          },
        },
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            allowNextLeaveRef.current = true;
            navigation.dispatch(action);
          },
        },
      ],
    );
  });

  const deleteLog = useCallback((log: BodyMeasurement, closeFormOnSuccess: boolean = false) => {
    if (!user?.id) return;
    Alert.alert(
      'Delete Entry',
      `Delete measurements from ${new Date(log.logged_on + 'T00:00:00').toLocaleDateString()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await measurementService.delete(log.id, user.id);
              await loadLogs();
              await refreshProfileSilently(user.id);
              if (closeFormOnSuccess) {
                resetForm();
              }
            } catch {
              Alert.alert('Error', 'Failed to delete measurement entry.');
            }
          },
        },
      ],
    );
  }, [loadLogs, refreshProfileSilently, resetForm, user?.id]);

  const renderValue = useCallback((metricKey: MeasurementMetricKey, stored: number) => {
    const display = toDisplayValue(metricKey, stored);
    const rounded = Math.round(display * 10) / 10;
    return `${rounded} ${unitLabelForMetric(metricKey)}`;
  }, [toDisplayValue, unitLabelForMetric]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Body Measurements</Text>
          {!formOpen ? (
            <Button
              title="Add"
              size="sm"
              variant="primary"
              onPress={openCreate}
            />
          ) : (
            <View style={styles.headerActions}>
              <Button
                title="Close"
                size="sm"
                variant="secondary"
                onPress={resetForm}
              />
              <Button
                title="Save"
                size="sm"
                variant="primary"
                onPress={saveForm}
                loading={saving}
              />
            </View>
          )}
        </View>

        {formOpen && (
          <>
            <Card style={styles.formCard}>
              <Text style={styles.formTitle}>{editingLog ? 'Edit Entry' : 'New Entry'}</Text>
              <Text style={styles.formSubtitle}>Date and at least one measurement are required.</Text>

              <Text style={styles.fieldLabel}>Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker((prev) => (Platform.OS === 'ios' ? !prev : true))}
                activeOpacity={0.7}
              >
                <Text style={styles.dateButtonText}>{formDate.toLocaleDateString()}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={formDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  textColor={Platform.OS === 'ios' ? colors.text : undefined}
                  themeVariant={isLight ? 'light' : 'dark'}
                />
              )}
            </Card>

            <Card style={styles.formCard}>
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>Basic</Text>
                <Text style={styles.sectionSubtitle}>Core measurements for quick progress tracking.</Text>
                {basicMetrics.map((metric) => (
                  <Input
                    key={metric.key}
                    label={`${metric.label} (${unitLabelForMetric(metric.key)})`}
                    value={formValues[metric.key]}
                    onChangeText={(text) => setFormValues((prev) => ({ ...prev, [metric.key]: text }))}
                    keyboardType="decimal-pad"
                    placeholder="0"
                  />
                ))}
              </View>
            </Card>

            <Card style={styles.formCard}>
              <View style={styles.sectionBlock}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.sectionToggle}
                  onPress={() => setAdvancedExpanded((prev) => !prev)}
                >
                  <View style={styles.sectionHeaderText}>
                    <View style={styles.sectionTitleRow}>
                      <Text style={styles.sectionTitle}>Advanced</Text>
                      {!isPremium ? <Image source={CROWN_ICON} style={styles.crownIcon} resizeMode="contain" /> : null}
                    </View>
                    <Text style={[styles.sectionSubtitle, styles.sectionToggleSubtitle]}>
                      {isPremium
                        ? 'Detailed body measurements for more granular tracking.'
                        : 'Advanced measurements are available with Setora Pro. Tap any field to unlock.'}
                    </Text>
                  </View>
                  <Text style={styles.sectionToggleIcon}>{advancedExpanded ? '▾' : '▸'}</Text>
                </TouchableOpacity>
                {advancedExpanded ? (
                  <>
                    {advancedMetrics.map((metric) => (
                      <View key={metric.key} style={styles.lockedFieldWrap}>
                        <Input
                          label={`${metric.label} (${unitLabelForMetric(metric.key)})`}
                          value={formValues[metric.key]}
                          onChangeText={(text) => setFormValues((prev) => ({ ...prev, [metric.key]: text }))}
                          keyboardType="decimal-pad"
                          placeholder="0"
                          editable={isPremium}
                        />
                        {!isPremium ? (
                          <Pressable
                            style={styles.lockedFieldOverlay}
                            onPress={() => showPaywall('advanced_analytics')}
                          />
                        ) : null}
                      </View>
                    ))}
                  </>
                ) : null}
              </View>
            </Card>

            {editingLog && (
              <View style={styles.formActions}>
                <Button
                  title="Delete"
                  variant="danger"
                  onPress={() => deleteLog(editingLog, true)}
                  style={styles.flexBtn}
                />
              </View>
            )}
          </>
        )}

        {!formOpen && (loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.textSecondary} />
          </View>
        ) : logs.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No measurements yet</Text>
            <Text style={styles.emptyText}>Add your first entry to start tracking trends.</Text>
          </Card>
        ) : (
          logs.map((log) => {
            const dateText = new Date(log.logged_on + 'T00:00:00').toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            });
            const filledMetrics = BODY_MEASUREMENT_METRICS.filter((metric) => {
              const value = log[metric.column];
              return value !== null && value !== undefined;
            });

            return (
              <View
                key={log.id}
                onLayout={(event) => {
                  logYByIdRef.current[log.id] = event.nativeEvent.layout.y;
                  if (pendingScrollLogIdRef.current === log.id && !formOpen) {
                    attemptPendingScrollToLog();
                  }
                }}
              >
                <Card style={styles.logCard}>
                  <View style={styles.logHeader}>
                    <Text style={styles.logDate}>{dateText}</Text>
                    <View style={styles.logActions}>
                      <TouchableOpacity onPress={() => openEdit(log)} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                        <Text style={styles.logActionText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteLog(log)} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                        <Text style={[styles.logActionText, styles.logActionDanger]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {filledMetrics.length === 0 ? (
                    <Text style={styles.emptyText}>No measurements saved.</Text>
                  ) : (
                    filledMetrics.map((metric) => (
                      <View key={`${log.id}-${metric.key}`} style={styles.metricRow}>
                        <Text style={styles.metricLabel}>{metric.label}</Text>
                        <Text style={styles.metricValue}>{renderValue(metric.key, log[metric.column] as number)}</Text>
                      </View>
                    ))
                  )}
                </Card>
              </View>
            );
          })
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors, isLight: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    paddingBottom: spacing.bottom,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontSize: 20,
    color: colors.text,
    fontFamily: fonts.bold,
  },
  formCard: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  formTitle: {
    fontSize: 16,
    color: colors.text,
    fontFamily: fonts.bold,
  },
  formSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: fonts.regular,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginBottom: 6,
  },
  dateButton: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: spacing.sm,
  },
  dateButtonText: {
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  sectionBlock: {
    marginBottom: 0,
  },
  sectionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  sectionHeaderText: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    color: colors.text,
    fontFamily: fonts.bold,
    marginBottom: spacing.xs,
  },
  crownIcon: {
    width: 13,
    height: 13,
    tintColor: isLight ? '#111111' : '#FFFFFF',
    marginTop: -2,
    marginLeft: 2,
  },
  sectionToggleIcon: {
    fontSize: 16,
    color: colors.textMuted,
    fontFamily: fonts.semiBold,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: fonts.regular,
    marginBottom: spacing.sm,
  },
  sectionToggleSubtitle: {
    marginBottom: 0,
    marginTop: 2,
  },
  lockedFieldWrap: {
    position: 'relative',
  },
  lockedFieldOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flexBtn: {
    flex: 1,
  },
  loadingWrap: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyCard: {
    paddingHorizontal: spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  logCard: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  logDate: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  logActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  logActionText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.semiBold,
  },
  logActionDanger: {
    color: '#FF6B6B',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  metricLabel: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
  metricValue: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
});
