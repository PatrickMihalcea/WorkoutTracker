import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { OnboardingScaffold } from '../../../src/components/onboarding/OnboardingScaffold';
import { RoutineCreationLoadingOverlay } from '../../../src/components/routine/RoutineCreationLoadingOverlay';
import { ChipPicker, Input } from '../../../src/components/ui';
import { fonts, spacing } from '../../../src/constants';
import {
  OnboardingEquipmentPreference,
  OnboardingExperience,
  OnboardingFocusMuscle,
  OnboardingGoal,
  OnboardingRoutineGenerationMode,
  RoutineWeekCount,
} from '../../../src/models';
import { onboardingService } from '../../../src/services';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useRoutineStore } from '../../../src/stores/routine.store';

type CreateMode = 'custom' | OnboardingRoutineGenerationMode;

const SCREEN_COLORS = {
  card: '#121A1F',
  cardActive: '#183338',
  cardBorder: '#2C3A42',
  cardBorderActive: '#43E0D3',
  text: '#FFFFFF',
  textMuted: '#9EB0B9',
  textLabel: '#B9CBCE',
  chip: '#182126',
  chipSelected: '#43E0D3',
  chipBorder: '#28373F',
  chipText: '#EEF8F8',
  chipTextSelected: '#041416',
  inputBackground: '#121A1F',
  inputBorder: '#2C3A42',
  ctaBackground: '#43E0D3',
  ctaText: '#041416',
} as const;

export default function CreateRoutineScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { createRoutine } = useRoutineStore();

  const [mode, setMode] = useState<CreateMode>('ai');
  const [name, setName] = useState('');
  const [daysPerWeek, setDaysPerWeek] = useState<3 | 4 | 5>(4);
  const [sessionMinutes, setSessionMinutes] = useState<30 | 60 | 90>(60);
  const [weekCount, setWeekCount] = useState<RoutineWeekCount>(4);
  const [goal, setGoal] = useState<OnboardingGoal>('muscle_gain');
  const [experience, setExperience] = useState<OnboardingExperience>('beginner');
  const [equipment, setEquipment] = useState<OnboardingEquipmentPreference>('full_gym');
  const [focusMuscle, setFocusMuscle] = useState<OnboardingFocusMuscle>('none');
  const [loading, setLoading] = useState(false);

  const handleModeChange = (nextMode: CreateMode) => {
    setMode(nextMode);
    if (nextMode === 'template') setWeekCount(4);
    if (nextMode === 'ai') setWeekCount(2);
  };

  const ctaTitle = useMemo(() => {
    if (mode === 'custom') return 'Create Custom Routine';
    if (mode === 'ai') return 'Build with AI';
    return 'Build Routine';
  }, [mode]);

  const handleCreate = async () => {
    setLoading(true);
    try {
      if (mode === 'custom') {
        if (!name.trim()) {
          Alert.alert('Error', 'Please enter a routine name');
          return;
        }
        if (!user) {
          Alert.alert('Error', 'You must be signed in to create a routine.');
          return;
        }

        const routine = await createRoutine(name.trim(), user.id, 1);
        router.replace(`/(tabs)/routines/${routine.id}`);
        return;
      }

      const generated = await onboardingService.generateFirstRoutine({
        mode,
        week_count: weekCount,
        answers: {
          days_per_week: daysPerWeek,
          session_minutes: sessionMinutes,
          goal,
          experience,
          equipment,
          focus_muscle: focusMuscle,
        },
      });

      router.replace(`/(tabs)/routines/${generated.routine_id}`);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message || 'Could not create routine.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <OnboardingScaffold
        step={1}
        totalSteps={1}
        showStepProgress={false}
        footerFloating={false}
        paddingBottom={spacing.bottom}
        backgroundVariant={mode === 'custom' ? 'solid' : 'gradient'}
        solidBackgroundColor="#000000"
        appearance="dark"
        onBack={() => router.back()}
        title="Create a new routine"
        subtitle="Build it from scratch or generate one."
        footer={<OnboardingActionButton title={ctaTitle} onPress={handleCreate} loading={loading} />}
      >
        <View style={styles.modeColumn}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.modeCard, mode === 'ai' && styles.modeCardActive]}
            onPress={() => handleModeChange('ai')}
          >
            <Text style={[styles.modeTitle, mode === 'ai' && styles.modeTitleActive]}>Personalized by AI</Text>
            <Text style={[styles.modeHint, mode === 'ai' && styles.modeHintActive]}>
              Generate a tailored starter plan from your preferences.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.modeCard, mode === 'template' && styles.modeCardActive]}
            onPress={() => handleModeChange('template')}
          >
            <Text style={[styles.modeTitle, mode === 'template' && styles.modeTitleActive]}>Fast Start</Text>
            <Text style={[styles.modeHint, mode === 'template' && styles.modeHintActive]}>
              Use a pre-made template and adjust to your needs.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.modeCard, mode === 'custom' && styles.modeCardActive]}
            onPress={() => handleModeChange('custom')}
          >
            <Text style={[styles.modeTitle, mode === 'custom' && styles.modeTitleActive]}>Custom</Text>
            <Text style={[styles.modeHint, mode === 'custom' && styles.modeHintActive]}>
              Start empty and build your routine manually.
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'custom' ? (
          <View style={styles.block}>
            <Input
              label="Routine Name"
              value={name}
              onChangeText={setName}
              placeholder='e.g. "Push Pull Legs" or "Upper Lower"'
              placeholderTextColor={SCREEN_COLORS.textMuted}
              labelStyle={styles.inputLabel}
              inputStyle={styles.input}
            />
          </View>
        ) : (
          <>
            <QuestionBlock label="Days per week">
              <ChipPicker
                chipStyle={styles.selectionChip}
                chipSelectedStyle={styles.selectionChipSelected}
                chipTextStyle={styles.selectionChipText}
                chipTextSelectedStyle={styles.selectionChipTextSelected}
                allowDeselect={false}
                selected={daysPerWeek}
                onChange={(value) => setDaysPerWeek((value ?? 4) as 3 | 4 | 5)}
                items={[
                  { key: '3', label: '3 days', value: 3 },
                  { key: '4', label: '4 days', value: 4 },
                  { key: '5', label: '5 days', value: 5 },
                ]}
                horizontal={false}
              />
            </QuestionBlock>

            <QuestionBlock label="Session length">
              <ChipPicker
                chipStyle={styles.selectionChip}
                chipSelectedStyle={styles.selectionChipSelected}
                chipTextStyle={styles.selectionChipText}
                chipTextSelectedStyle={styles.selectionChipTextSelected}
                allowDeselect={false}
                selected={sessionMinutes}
                onChange={(value) => setSessionMinutes((value ?? 60) as 30 | 60 | 90)}
                items={[
                  { key: '30', label: '30 min', value: 30 },
                  { key: '60', label: '60 min', value: 60 },
                  { key: '90', label: '90 min', value: 90 },
                ]}
                horizontal={false}
              />
            </QuestionBlock>

            <QuestionBlock label="Plan length">
              <ChipPicker
                chipStyle={styles.selectionChip}
                chipSelectedStyle={styles.selectionChipSelected}
                chipTextStyle={styles.selectionChipText}
                chipTextSelectedStyle={styles.selectionChipTextSelected}
                allowDeselect={false}
                selected={weekCount}
                onChange={(value) => setWeekCount((value ?? 4) as RoutineWeekCount)}
                items={[
                  { key: '1', label: '1 week', value: 1 },
                  { key: '2', label: '2 weeks', value: 2 },
                  { key: '3', label: '3 weeks', value: 3 },
                  { key: '4', label: '4 weeks', value: 4 },
                  { key: '5', label: '5 weeks', value: 5 },
                  { key: '6', label: '6 weeks', value: 6 },
                ]}
                horizontal={false}
              />
            </QuestionBlock>

            <QuestionBlock label="Primary goal">
              <ChipPicker
                chipStyle={styles.selectionChip}
                chipSelectedStyle={styles.selectionChipSelected}
                chipTextStyle={styles.selectionChipText}
                chipTextSelectedStyle={styles.selectionChipTextSelected}
                allowDeselect={false}
                selected={goal}
                onChange={(value) => setGoal((value ?? 'muscle_gain') as OnboardingGoal)}
                items={[
                  { key: 'muscle_gain', label: 'Muscle gain', value: 'muscle_gain' },
                  { key: 'fat_loss', label: 'Fat loss', value: 'fat_loss' },
                  { key: 'general_fitness', label: 'General fitness', value: 'general_fitness' },
                ]}
                horizontal={false}
              />
            </QuestionBlock>

            <QuestionBlock label="Experience level">
              <ChipPicker
                chipStyle={styles.selectionChip}
                chipSelectedStyle={styles.selectionChipSelected}
                chipTextStyle={styles.selectionChipText}
                chipTextSelectedStyle={styles.selectionChipTextSelected}
                allowDeselect={false}
                selected={experience}
                onChange={(value) => setExperience((value ?? 'beginner') as OnboardingExperience)}
                items={[
                  { key: 'beginner', label: 'Beginner', value: 'beginner' },
                  { key: 'intermediate', label: 'Intermediate', value: 'intermediate' },
                  { key: 'advanced', label: 'Advanced', value: 'advanced' },
                ]}
                horizontal={false}
              />
            </QuestionBlock>

            <QuestionBlock label="Equipment">
              <ChipPicker
                chipStyle={styles.selectionChip}
                chipSelectedStyle={styles.selectionChipSelected}
                chipTextStyle={styles.selectionChipText}
                chipTextSelectedStyle={styles.selectionChipTextSelected}
                allowDeselect={false}
                selected={equipment}
                onChange={(value) => setEquipment((value ?? 'full_gym') as OnboardingEquipmentPreference)}
                items={[
                  { key: 'full_gym', label: 'Full gym', value: 'full_gym' },
                  { key: 'dumbbells_bench', label: 'Dumbbells + bench', value: 'dumbbells_bench' },
                  { key: 'bodyweight_minimal', label: 'Bodyweight / minimal', value: 'bodyweight_minimal' },
                ]}
                horizontal={false}
              />
            </QuestionBlock>

            <QuestionBlock label="Slight muscle focus (optional)">
              <ChipPicker
                chipStyle={styles.selectionChip}
                chipSelectedStyle={styles.selectionChipSelected}
                chipTextStyle={styles.selectionChipText}
                chipTextSelectedStyle={styles.selectionChipTextSelected}
                allowDeselect={false}
                selected={focusMuscle}
                onChange={(value) => setFocusMuscle((value ?? 'none') as OnboardingFocusMuscle)}
                items={[
                  { key: 'none', label: 'None', value: 'none' },
                  { key: 'chest', label: 'Chest', value: 'chest' },
                  { key: 'back', label: 'Back', value: 'back' },
                  { key: 'arms', label: 'Arms', value: 'arms' },
                  { key: 'biceps', label: 'Biceps', value: 'biceps' },
                  { key: 'triceps', label: 'Triceps', value: 'triceps' },
                  { key: 'shoulders', label: 'Shoulders', value: 'shoulders' },
                  { key: 'legs', label: 'Legs', value: 'legs' },
                  { key: 'glutes', label: 'Glutes', value: 'glutes' },
                  { key: 'core', label: 'Core', value: 'core' },
                ]}
                horizontal={false}
              />
            </QuestionBlock>
          </>
        )}
      </OnboardingScaffold>

      <RoutineCreationLoadingOverlay visible={loading} mode={mode} context="routine" />
    </>
  );
}

function OnboardingActionButton({
  title,
  onPress,
  loading,
}: {
  title: string;
  onPress: () => void;
  loading: boolean;
}) {
  return (
    <TouchableOpacity style={[styles.ctaButton, loading && styles.ctaButtonDisabled]} onPress={onPress} disabled={loading} activeOpacity={0.85}>
      {loading ? (
        <ActivityIndicator color={SCREEN_COLORS.ctaText} size="small" />
      ) : (
        <Text style={styles.ctaButtonText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

function QuestionBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.block}>
      <Text style={styles.blockLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  modeColumn: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modeCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: SCREEN_COLORS.cardBorder,
    backgroundColor: SCREEN_COLORS.card,
    paddingHorizontal: spacing.sm + spacing.xs,
    paddingVertical: spacing.sm + spacing.xs,
  },
  modeCardActive: {
    borderColor: SCREEN_COLORS.cardBorderActive,
    backgroundColor: SCREEN_COLORS.cardActive,
  },
  modeTitle: {
    color: SCREEN_COLORS.text,
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
  modeTitleActive: {
    color: SCREEN_COLORS.text,
  },
  modeHint: {
    marginTop: 4,
    color: SCREEN_COLORS.textMuted,
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  modeHintActive: {
    color: SCREEN_COLORS.text,
  },
  block: {
    marginBottom: spacing.xs,
  },
  blockLabel: {
    marginBottom: 8,
    color: SCREEN_COLORS.textLabel,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  inputLabel: {
    color: SCREEN_COLORS.textLabel,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    backgroundColor: SCREEN_COLORS.inputBackground,
    borderColor: SCREEN_COLORS.inputBorder,
    color: SCREEN_COLORS.text,
  },
  selectionChip: {
    backgroundColor: SCREEN_COLORS.chip,
    borderWidth: 1,
    borderColor: SCREEN_COLORS.chipBorder,
    borderRadius: 16,
    paddingVertical: 10,
  },
  selectionChipSelected: {
    backgroundColor: SCREEN_COLORS.chipSelected,
    borderColor: SCREEN_COLORS.chipSelected,
  },
  selectionChipText: {
    color: SCREEN_COLORS.chipText,
  },
  selectionChipTextSelected: {
    color: SCREEN_COLORS.chipTextSelected,
  },
  ctaButton: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: SCREEN_COLORS.ctaBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonDisabled: {
    opacity: 0.72,
  },
  ctaButtonText: {
    color: SCREEN_COLORS.ctaText,
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  note: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    color: SCREEN_COLORS.textMuted,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
  },
});
