import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Body from 'react-native-body-highlighter';
import { useProfileStore } from '../../stores/profile.store';
import { Card } from '../ui';
import { colors, fonts, spacing } from '../../constants';

interface MuscleSlice {
  label: string;
  value: number;
}

type BodySlug =
  | 'chest' | 'upper-back' | 'lower-back' | 'deltoids' | 'biceps'
  | 'triceps' | 'quadriceps' | 'hamstring' | 'gluteal' | 'calves'
  | 'abs' | 'forearm' | 'trapezius' | 'obliques' | 'tibialis'
  | 'adductors' | 'neck' | 'head' | 'knees' | 'hands' | 'feet' | 'ankles';

const MUSCLE_TO_SLUGS: Record<string, BodySlug[]> = {
  chest:      ['chest'],
  back:       ['upper-back', 'lower-back'],
  shoulders:  ['deltoids'],
  biceps:     ['biceps'],
  triceps:    ['triceps'],
  quads:      ['quadriceps'],
  hamstrings: ['hamstring'],
  glutes:     ['gluteal'],
  calves:     ['calves'],
  abs:        ['abs', 'obliques'],
  forearms:   ['forearm'],
  traps:      ['trapezius'],
  full_body:  ['chest', 'upper-back', 'deltoids', 'biceps', 'triceps', 'quadriceps', 'hamstring', 'gluteal', 'calves', 'abs'],
};

const INTENSITY_COLORS = [
  '#1a3a2a',
  '#2d6b45',
  '#3d9960',
  '#4dcc7a',
  '#5dffa0',
];

function toBodyData(slices: MuscleSlice[]) {
  if (slices.length === 0) return [];

  const maxVal = Math.max(...slices.map((s) => s.value));
  if (maxVal === 0) return [];

  const parts: { slug: BodySlug; intensity: number }[] = [];
  for (const slice of slices) {
    const slugs = MUSCLE_TO_SLUGS[slice.label] ?? MUSCLE_TO_SLUGS[slice.label.replace(' ', '_')];
    if (!slugs) continue;
    const ratio = slice.value / maxVal;
    const intensity = Math.max(1, Math.min(INTENSITY_COLORS.length, Math.ceil(ratio * INTENSITY_COLORS.length)));
    for (const slug of slugs) {
      parts.push({ slug, intensity });
    }
  }
  return parts;
}

interface MuscleHeatmapProps {
  data: MuscleSlice[];
  title?: string;
  subtitle?: string;
}

export function MuscleHeatmap({ data, title = 'Muscle Heatmap', subtitle = 'Set distribution by muscle group' }: MuscleHeatmapProps) {
  const { profile } = useProfileStore();
  const bodyGender = profile?.sex === 'female' ? 'female' : 'male';

  if (data.length === 0) return null;

  const bodyData = toBodyData(data);

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.bodyRow}>
        <View style={styles.bodyHalf}>
          <Body
            data={bodyData}
            gender={bodyGender}
            side="front"
            scale={1}
            border={colors.border}
            colors={INTENSITY_COLORS}
            defaultFill={colors.surfaceLight}
          />
        </View>
        <View style={styles.bodyHalf}>
          <Body
            data={bodyData}
            gender={bodyGender}
            side="back"
            scale={1}
            border={colors.border}
            colors={INTENSITY_COLORS}
            defaultFill={colors.surfaceLight}
          />
        </View>
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendLabel}>Low</Text>
        <View style={styles.legendBar}>
          {INTENSITY_COLORS.map((c, i) => (
            <View key={i} style={[styles.legendSegment, { backgroundColor: c }]} />
          ))}
        </View>
        <Text style={styles.legendLabel}>High</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  bodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-start',
  },
  bodyHalf: {
    flex: 1,
    alignItems: 'center',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  legendLabel: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  legendBar: {
    flexDirection: 'row',
    borderRadius: 4,
    overflow: 'hidden',
  },
  legendSegment: {
    width: 24,
    height: 8,
  },
});
