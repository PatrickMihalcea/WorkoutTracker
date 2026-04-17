import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { OnboardingScaffold } from '../../src/components/onboarding/OnboardingScaffold';
import { RoutineCreationLoadingOverlay } from '../../src/components/routine/RoutineCreationLoadingOverlay';
import { Button, ChipPicker } from '../../src/components/ui';
import { fonts, spacing } from '../../src/constants';
import {
  OnboardingEquipmentPreference,
  OnboardingExperience,
  OnboardingFocusMuscle,
  OnboardingGoal,
  OnboardingRoutineGenerationMode,
  RoutineWeekCount,
} from '../../src/models';
import { onboardingService } from '../../src/services';
import { useProfileStore } from '../../src/stores/profile.store';
import { useTheme } from '../../src/contexts/ThemeContext';
import type { ThemeColors } from '../../src/constants/themes';

export default function FirstRoutineScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { updateProfile } = useProfileStore();
  const [mode, setMode] = useState<OnboardingRoutineGenerationMode>('template');
  const [daysPerWeek, setDaysPerWeek] = useState<3 | 4 | 5>(4);
  const [sessionMinutes, setSessionMinutes] = useState<30 | 60 | 90>(60);
  const [weekCount, setWeekCount] = useState<RoutineWeekCount>(4);
  const [goal, setGoal] = useState<OnboardingGoal>('muscle_gain');
  const [experience, setExperience] = useState<OnboardingExperience>('beginner');
  const [equipment, setEquipment] = useState<OnboardingEquipmentPreference>('full_gym');
  const [focusMuscle, setFocusMuscle] = useState<OnboardingFocusMuscle>('none');
  const [loading, setLoading] = useState(false);

  const handleModeChange = (nextMode: OnboardingRoutineGenerationMode) => {
    setMode(nextMode);
    setWeekCount(nextMode === 'ai' ? 2 : 4);
  };

  const handleContinue = async () => {
    setLoading(true);
    try {
      const result = await onboardingService.generateFirstRoutine({
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

      await updateProfile({ onboarding_complete: true });

      router.replace(`/(tabs)/routines/${result.routine_id}`);
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message || 'Could not create your first routine.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <OnboardingScaffold
        step={5}
        totalSteps={5}
        onBack={() => router.back()}
        title="Build your first routine"
        subtitle="Choose a quick setup now. You can edit everything later."
        footer={<Button title="Create My Routine" onPress={handleContinue} loading={loading} variant="cta" size="lg" />}
      >
        <View style={styles.modeRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.modeCard, mode === 'template' && styles.modeCardActive]}
            onPress={() => handleModeChange('template')}
          >
            <Text style={[styles.modeTitle, mode === 'template' && styles.modeTitleActive]}>Fast Start</Text>
            <Text style={[styles.modeHint, mode === 'template' && styles.modeHintActive]}>
              Use a proven template.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.modeCard, mode === 'ai' && styles.modeCardActive]}
            onPress={() => handleModeChange('ai')}
          >
            <Text style={[styles.modeTitle, mode === 'ai' && styles.modeTitleActive]}>Personalized by AI</Text>
            <Text style={[styles.modeHint, mode === 'ai' && styles.modeHintActive]}>
              Tailored to your setup.
            </Text>
          </TouchableOpacity>
        </View>

        <QuestionBlock label="Days per week">
          <ChipPicker
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
      </OnboardingScaffold>

      <RoutineCreationLoadingOverlay visible={loading} mode={mode} context="onboarding" />
    </>
  );
}

function QuestionBlock({ label, children }: { label: string; children: ReactNode }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.block}>
      <Text style={styles.blockLabel}>{label}</Text>
      {children}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modeCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm + spacing.xs,
    paddingVertical: spacing.sm + spacing.xs,
  },
  modeCardActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentDim,
  },
  modeTitle: {
    color: colors.text,
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
  modeTitleActive: {
    color: colors.text,
  },
  modeHint: {
    marginTop: 4,
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  modeHintActive: {
    color: colors.textSecondary,
  },
  block: {
    marginBottom: spacing.xs,
  },
  blockLabel: {
    marginBottom: 8,
    color: colors.textSecondary,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
});
