import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, usePreventRemove } from '@react-navigation/native';
import { Button, Card, Input } from '../../../src/components/ui';
import { fonts, spacing } from '../../../src/constants';
import { isLightTheme } from '../../../src/constants/themes';
import { BODY_MEASUREMENT_METRICS, MeasurementMetricKey } from '../../../src/models';
import { UserProfileUpdate } from '../../../src/models/profile';
import { usePaywall } from '../../../src/contexts/PaywallContext';
import { useProfileStore } from '../../../src/stores/profile.store';
import { useSubscriptionStore } from '../../../src/stores/subscription.store';
import {
  getMeasurementGoalFromProfile,
  measurementGoalFieldForMetric,
  measurementGoalToDisplay,
  measurementGoalToStored,
  measurementUnitLabelForMetric,
} from '../../../src/utils/measurementGoals';
import { useTheme } from '../../../src/contexts/ThemeContext';
import type { ThemeColors } from '../../../src/constants/themes';

type GoalFormValues = Record<MeasurementMetricKey, string>;
const BASIC_GOAL_KEYS: MeasurementMetricKey[] = ['body_weight', 'body_fat_pct', 'waist'];
const CROWN_ICON = require('../../../assets/icons/crown.png') as number;

function buildEmptyGoalForm(): GoalFormValues {
  return BODY_MEASUREMENT_METRICS.reduce((acc, metric) => {
    acc[metric.key] = '';
    return acc;
  }, {} as GoalFormValues);
}

export default function GoalsScreen() {
  const { colors, theme } = useTheme();
  const isLight = isLightTheme(theme);
  const styles = useMemo(() => createStyles(colors, isLight), [colors, isLight]);
  const navigation = useNavigation();
  const { showPaywall } = usePaywall();
  const { profile, updateProfile } = useProfileStore();
  const isPremium = useSubscriptionStore((state) => state.isPremium);
  const weightUnit = profile?.weight_unit ?? 'kg';
  const heightUnit = profile?.height_unit ?? 'cm';
  const [saving, setSaving] = useState(false);
  const [advancedExpanded, setAdvancedExpanded] = useState(true);
  const [values, setValues] = useState<GoalFormValues>(buildEmptyGoalForm);
  const initialValuesRef = useRef<GoalFormValues>(buildEmptyGoalForm());
  const allowNextLeaveRef = useRef(false);
  const basicMetrics = useMemo(
    () => BASIC_GOAL_KEYS
      .map((key) => BODY_MEASUREMENT_METRICS.find((metric) => metric.key === key))
      .filter((metric): metric is typeof BODY_MEASUREMENT_METRICS[number] => !!metric),
    [],
  );
  const advancedMetrics = useMemo(
    () => BODY_MEASUREMENT_METRICS.filter((metric) => !BASIC_GOAL_KEYS.includes(metric.key)),
    [],
  );

  const unitLabelByMetric = useMemo(() => {
    return BODY_MEASUREMENT_METRICS.reduce((acc, metric) => {
      acc[metric.key] = measurementUnitLabelForMetric(metric.key, weightUnit, heightUnit);
      return acc;
    }, {} as Record<MeasurementMetricKey, string>);
  }, [weightUnit, heightUnit]);

  useEffect(() => {
    if (!profile) {
      const empty = buildEmptyGoalForm();
      setValues(empty);
      initialValuesRef.current = empty;
      return;
    }

    const next = buildEmptyGoalForm();
    for (const metric of BODY_MEASUREMENT_METRICS) {
      const stored = getMeasurementGoalFromProfile(profile, metric.key);
      if (stored == null) continue;
      const display = measurementGoalToDisplay(metric.key, stored, weightUnit, heightUnit);
      next[metric.key] = `${Math.round(display * 10) / 10}`;
    }
    setValues(next);
    initialValuesRef.current = next;
  }, [profile, weightUnit, heightUnit]);

  const handleSave = useCallback(async (): Promise<boolean> => {
    if (!profile) return false;

    const updates: Partial<UserProfileUpdate> = {};
    for (const metric of BODY_MEASUREMENT_METRICS) {
      const raw = values[metric.key].trim();
      const goalField = measurementGoalFieldForMetric(metric.key);

      if (!raw) {
        updates[goalField] = null;
        continue;
      }

      const parsed = Number(raw);
      if (!Number.isFinite(parsed) || parsed < 0) {
        Alert.alert('Invalid value', `${metric.label} goal must be zero or greater.`);
        return false;
      }

      const stored = measurementGoalToStored(metric.key, parsed, weightUnit, heightUnit);
      // Keep higher precision in canonical units to avoid visible round-trip drift (e.g. 150 lbs -> 149.9 lbs).
      updates[goalField] = Math.round(stored * 10000) / 10000;
    }

    try {
      setSaving(true);
      await updateProfile(updates);
      initialValuesRef.current = values;
      return true;
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message || 'Could not save goals.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [heightUnit, profile, updateProfile, values, weightUnit]);

  const isDirty = useMemo(() => {
    const initial = initialValuesRef.current;
    for (const metric of BODY_MEASUREMENT_METRICS) {
      if (values[metric.key].trim() !== (initial[metric.key] ?? '').trim()) {
        return true;
      }
    }
    return false;
  }, [values]);

  usePreventRemove(isDirty, ({ data }) => {
    if (allowNextLeaveRef.current) {
      allowNextLeaveRef.current = false;
      return;
    }

    const action = data.action;

    Alert.alert(
      'Unsaved Changes',
      'Save changes before leaving Goals?',
      [
        {
          text: 'Save',
          onPress: () => {
            void (async () => {
              const saved = await handleSave();
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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Text style={styles.title}>Measurement Goals</Text>
          <Button title="Save" size="sm" variant="primary" onPress={handleSave} loading={saving} />
        </View>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Basic</Text>
          <Text style={styles.subtitle}>
            Set simple targets for your core progress markers. Leave blank if you do not want a goal line.
          </Text>

          {basicMetrics.map((metric) => (
            <Input
              key={metric.key}
              label={`${metric.label} (${unitLabelByMetric[metric.key]})`}
              value={values[metric.key]}
              onChangeText={(text) => setValues((prev) => ({ ...prev, [metric.key]: text }))}
              keyboardType="decimal-pad"
              placeholder="No goal"
            />
          ))}
        </Card>

        <Card style={styles.card}>
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
              <Text style={[styles.subtitle, styles.sectionToggleSubtitle]}>
                {isPremium
                  ? 'Fine-tune longer-term body measurement goals for more detailed tracking.'
                  : 'Advanced measurement goals are available with Setora Pro. Tap any field to unlock.'}
              </Text>
            </View>
            <Text style={styles.sectionToggleIcon}>{advancedExpanded ? '▾' : '▸'}</Text>
          </TouchableOpacity>

          {advancedExpanded ? (
            <>
              {advancedMetrics.map((metric) => (
                <View key={metric.key} style={styles.lockedFieldWrap}>
                  <Input
                    label={`${metric.label} (${unitLabelByMetric[metric.key]})`}
                    value={values[metric.key]}
                    onChangeText={(text) => setValues((prev) => ({ ...prev, [metric.key]: text }))}
                    keyboardType="decimal-pad"
                    placeholder="No goal"
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
        </Card>
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.bottom,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  title: {
    fontSize: 20,
    color: colors.text,
    fontFamily: fonts.bold,
  },
  card: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
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
  subtitle: {
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
});
