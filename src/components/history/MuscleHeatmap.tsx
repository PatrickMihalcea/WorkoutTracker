import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import Body from 'react-native-body-highlighter';
import { useProfileStore } from '../../stores/profile.store';
import { Card } from '../ui';
import { fonts, spacing } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';

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
  upper_chest:['chest'],
  back:       ['upper-back', 'lower-back'],
  upper_back: ['upper-back'],
  lower_back: ['lower-back'],
  shoulders:  ['deltoids'],
  deltoids:   ['deltoids'],
  biceps:     ['biceps'],
  triceps:    ['triceps'],
  quads:      ['quadriceps'],
  quadriceps: ['quadriceps'],
  hamstrings: ['hamstring'],
  hamstring:  ['hamstring'],
  glutes:     ['gluteal'],
  gluteal:    ['gluteal'],
  calves:     ['calves'],
  abs:        ['abs', 'obliques'],
  obliques:   ['obliques'],
  forearms:   ['forearm'],
  forearm:    ['forearm'],
  traps:      ['trapezius'],
  trapezius:  ['trapezius'],
  tibialis:   ['tibialis'],
  adductors:  ['adductors'],
  neck:       ['neck'],
  head:       ['head'],
  knees:      ['knees'],
  hands:      ['hands'],
  feet:       ['feet'],
  ankles:     ['ankles'],
  cardio:     [],
  full_body:  [
    'chest',
    'upper-back',
    'lower-back',
    'deltoids',
    'biceps',
    'triceps',
    'quadriceps',
    'hamstring',
    'gluteal',
    'calves',
    'abs',
    'obliques',
    'forearm',
    'trapezius',
    'adductors',
    'tibialis',
  ],
};

const INTENSITY_COLORS = [
  'rgba(34, 85, 204, 0.25)',
  'rgba(78, 170, 221, 0.50)',
  'rgba(240, 208, 96, 0.72)',
  'rgba(240, 112, 48, 0.88)',
  'rgba(208, 32, 32, 1.0)',
];

function toBodyData(slices: MuscleSlice[], overrideMax?: number) {
  if (slices.length === 0) return [];

  const maxVal = overrideMax ?? Math.max(...slices.map((s) => s.value));
  if (maxVal === 0) return [];

  const parts: { slug: BodySlug; intensity: number }[] = [];
  for (const slice of slices) {
    if (slice.value === 0) continue;
    const slugs = MUSCLE_TO_SLUGS[slice.label] ?? MUSCLE_TO_SLUGS[slice.label.replace(' ', '_')];
    if (!slugs) continue;
    const ratio = Math.min(slice.value / maxVal, 1);
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
  bare?: boolean;
  maxValue?: number;
}

function HeatmapTooltip({ colors }: { colors: ReturnType<typeof useTheme>['colors'] }) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={{ color: colors.textMuted, fontSize: 14, lineHeight: 18 }}>ⓘ</Text>
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.55)' }}
          onPress={() => setVisible(false)}
          activeOpacity={1}
        >
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 16,
            maxWidth: 280,
            marginHorizontal: 24,
          }}>
            <Text style={{ color: colors.text, fontSize: 13, fontFamily: fonts.regular, lineHeight: 20 }}>
              {'Each set counts 1.0 for the primary muscle and 0.33 for each secondary muscle. Cardio and full-body exercises are excluded. Colour intensity shows relative volume — the most-trained muscle is always at peak intensity.'}
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

export function MuscleHeatmap({ data, title = 'Muscle Heatmap', subtitle = 'Set distribution by muscle group', bare = false, maxValue }: MuscleHeatmapProps) {
  const { colors } = useTheme();
  const { profile } = useProfileStore();
  const bodyGender = profile?.sex === 'female' ? 'female' : 'male';
  const isEmpty = data.length === 0;

  const bodyData = toBodyData(data, maxValue);

  const Wrapper = bare ? View : Card;

  const styles = useMemo(() => StyleSheet.create({
    card: {
      marginBottom: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    bareContainer: {
      paddingBottom: spacing.sm,
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
  }), [colors]);

  return (
      <Wrapper style={bare ? styles.bareContainer : styles.card}>
      {title ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={[styles.title, { marginBottom: 0 }]}>{title}</Text>
          <HeatmapTooltip colors={colors} />
        </View>
      ) : null}
      {subtitle ? <Text style={styles.subtitle}>{isEmpty ? 'No completed sets yet' : subtitle}</Text> : null}

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
    </Wrapper>
  );
}
