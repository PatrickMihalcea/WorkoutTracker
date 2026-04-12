import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Input } from '../../../src/components/ui';
import { colors, fonts, spacing } from '../../../src/constants';
import { BODY_MEASUREMENT_METRICS, MeasurementMetricKey } from '../../../src/models';
import { UserProfileUpdate } from '../../../src/models/profile';
import { useProfileStore } from '../../../src/stores/profile.store';
import {
  getMeasurementGoalFromProfile,
  measurementGoalFieldForMetric,
  measurementGoalToDisplay,
  measurementGoalToStored,
  measurementUnitLabelForMetric,
} from '../../../src/utils/measurementGoals';

type GoalFormValues = Record<MeasurementMetricKey, string>;

function buildEmptyGoalForm(): GoalFormValues {
  return BODY_MEASUREMENT_METRICS.reduce((acc, metric) => {
    acc[metric.key] = '';
    return acc;
  }, {} as GoalFormValues);
}

export default function GoalsScreen() {
  const { profile, updateProfile } = useProfileStore();
  const weightUnit = profile?.weight_unit ?? 'kg';
  const heightUnit = profile?.height_unit ?? 'cm';
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<GoalFormValues>(buildEmptyGoalForm);

  const unitLabelByMetric = useMemo(() => {
    return BODY_MEASUREMENT_METRICS.reduce((acc, metric) => {
      acc[metric.key] = measurementUnitLabelForMetric(metric.key, weightUnit, heightUnit);
      return acc;
    }, {} as Record<MeasurementMetricKey, string>);
  }, [weightUnit, heightUnit]);

  useEffect(() => {
    if (!profile) {
      setValues(buildEmptyGoalForm());
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
  }, [profile, weightUnit, heightUnit]);

  const handleSave = async () => {
    if (!profile) return;

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
        return;
      }

      const stored = measurementGoalToStored(metric.key, parsed, weightUnit, heightUnit);
      // Keep higher precision in canonical units to avoid visible round-trip drift (e.g. 150 lbs -> 149.9 lbs).
      updates[goalField] = Math.round(stored * 10000) / 10000;
    }

    try {
      setSaving(true);
      await updateProfile(updates);
      Alert.alert('Saved', 'Goals updated.');
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message || 'Could not save goals.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Text style={styles.title}>Measurement Goals</Text>
          <Button title="Save" size="sm" variant="primary" onPress={handleSave} loading={saving} />
        </View>

        <Card style={styles.card}>
          <Text style={styles.subtitle}>
            Set your current target for each metric. Leave blank if you do not want a goal line.
          </Text>

          {BODY_MEASUREMENT_METRICS.map((metric) => (
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl * 2,
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
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: fonts.regular,
    marginBottom: spacing.sm,
  },
});
