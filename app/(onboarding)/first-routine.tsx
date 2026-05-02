import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { OnboardingScaffold } from '../../src/components/onboarding/OnboardingScaffold';
import { RoutineCreationLoadingOverlay } from '../../src/components/routine/RoutineCreationLoadingOverlay';
import { ChipPicker } from '../../src/components/ui';
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
import type { AiRoutineAccessStatus } from '../../src/services/onboarding.service';
import { useProfileStore } from '../../src/stores/profile.store';
import { useSubscriptionStore } from '../../src/stores/subscription.store';

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
  ctaBackground: '#43E0D3',
  ctaText: '#041416',
} as const;

export default function FirstRoutineScreen() {
  const router = useRouter();
  const { updateProfile } = useProfileStore();
  const isPremium = useSubscriptionStore((state) => state.isPremium);
  const [aiAccess, setAiAccess] = useState<AiRoutineAccessStatus>('free');
  const [mode, setMode] = useState<OnboardingRoutineGenerationMode>('template');
  const [daysPerWeek, setDaysPerWeek] = useState<3 | 4 | 5 | null>(null);
  const [sessionMinutes, setSessionMinutes] = useState<30 | 60 | 90 | null>(null);
  const [weekCount, setWeekCount] = useState<RoutineWeekCount | null>(null);
  const [goal, setGoal] = useState<OnboardingGoal | null>(null);
  const [experience, setExperience] = useState<OnboardingExperience | null>(null);
  const [equipment, setEquipment] = useState<OnboardingEquipmentPreference | null>(null);
  const [focusMuscle, setFocusMuscle] = useState<OnboardingFocusMuscle | null>(null);
  const [loading, setLoading] = useState(false);

  const SECTION_COUNT = 7;
  const [unlockedCount, setUnlockedCount] = useState(1);
  const sectionAnims = useRef(
    Array.from({ length: SECTION_COUNT }, (_, i) => new Animated.Value(i === 0 ? 1 : 0))
  ).current;
  const ctaAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (unlockedCount <= 1) return;
    const idx = unlockedCount - 1;
    const anim = idx < SECTION_COUNT ? sectionAnims[idx] : ctaAnim;
    Animated.timing(anim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  // sectionAnims and ctaAnim are stable refs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlockedCount]);

  const unlock = (completedIndex: number) => {
    setUnlockedCount((prev) => Math.max(prev, completedIndex + 2));
  };

  const handleModeChange = (nextMode: OnboardingRoutineGenerationMode) => {
    const canUseAi = aiAccess === 'free' || aiAccess === 'premium';
    if (nextMode === 'ai' && !canUseAi) {
      Alert.alert(
        aiAccess === 'in_progress'
          ? 'AI routine in progress'
          : isPremium
          ? 'Monthly AI credits used'
          : 'Premium feature',
        aiAccess === 'in_progress'
          ? 'Your AI routine is already being generated. Please wait for it to finish.'
          : isPremium
          ? 'You have already used your 3 Setora Pro AI routine credits for this month.'
          : 'Your free AI routine has already been used. Additional AI routine generation is part of Setora Pro.',
      );
      return;
    }
    setMode(nextMode);
    const filled = [daysPerWeek, sessionMinutes, weekCount, goal, experience, equipment, focusMuscle];
    const firstNull = filled.findIndex((v) => v === null);
    const restored = firstNull === -1 ? SECTION_COUNT + 1 : firstNull + 1;
    setUnlockedCount(restored);
    sectionAnims.forEach((anim, i) => anim.setValue(i < restored ? 1 : 0));
    ctaAnim.setValue(restored > SECTION_COUNT ? 1 : 0);
  };

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const status = await onboardingService.getAiRoutineAccessStatus({ isPremium });
        if (!active) return;
        setAiAccess(status);
        setMode((current) => {
          if (current === 'ai' && status === 'locked') return 'template';
          if (current === 'template' && (status === 'free' || status === 'premium')) return 'ai';
          return current;
        });
        if (status === 'locked') {
          setWeekCount(null);
        }
      } catch {
        if (!active) return;
        setAiAccess('locked');
      }
    })();

    return () => {
      active = false;
    };
  }, [isPremium]);

  useEffect(() => {
    let active = true;

    void (async () => {
      const pending = await onboardingService.getPendingRoutineGeneration();
      if (!active || !pending || pending.context !== 'onboarding') return;

      setMode(pending.payload.mode);
      setDaysPerWeek(pending.payload.answers.days_per_week);
      setSessionMinutes(pending.payload.answers.session_minutes);
      setGoal(pending.payload.answers.goal);
      setExperience(pending.payload.answers.experience);
      setEquipment(pending.payload.answers.equipment);
      setFocusMuscle(pending.payload.answers.focus_muscle);
      setWeekCount((pending.payload.week_count ?? (pending.payload.mode === 'ai' ? 2 : 4)) as RoutineWeekCount);
      setUnlockedCount(SECTION_COUNT + 1);
      sectionAnims.forEach((anim) => anim.setValue(1));
      ctaAnim.setValue(1);
      setLoading(true);

      try {
        const result = await onboardingService.waitForPendingRoutineGenerationCompletion({ pending });
        if (!active) return;

        await updateProfile({ onboarding_complete: true });
        router.replace(`/(tabs)/routines/${result.routine_id}?fromOnboarding=1`);
      } catch (error: unknown) {
        if (__DEV__) {
          Alert.alert('Error', (error as Error).message || 'Could not create your first routine.');
        } else {
          console.warn(
            `[onboarding] Pending routine generation did not complete cleanly: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
        if (!active) return;
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [router, updateProfile]);

  const handleContinue = async () => {
    const canUseAi = aiAccess === 'free' || aiAccess === 'premium';
    if (mode === 'ai' && !canUseAi) {
      Alert.alert(
        aiAccess === 'in_progress'
          ? 'AI routine in progress'
          : isPremium
          ? 'Monthly AI credits used'
          : 'Premium feature',
        aiAccess === 'in_progress'
          ? 'Your AI routine is already being generated. Please wait for it to finish.'
          : isPremium
          ? 'You have already used your 3 Setora Pro AI routine credits for this month. Switch to Fast Start to finish onboarding.'
          : 'Your free AI routine has already been used. Additional AI routine generation is part of Setora Pro. Switch to Fast Start to finish onboarding.',
      );
      return;
    }

    setLoading(true);
    try {
      const result = await onboardingService.generateFirstRoutine({
        mode,
        week_count: weekCount ?? undefined,
        answers: {
          days_per_week: daysPerWeek!,
          session_minutes: sessionMinutes!,
          goal: goal!,
          experience: experience!,
          equipment: equipment!,
          focus_muscle: focusMuscle!,
        },
      }, {
        context: 'onboarding',
      });

      await updateProfile({ onboarding_complete: true });

      router.replace(`/(tabs)/routines/${result.routine_id}?fromOnboarding=1`);
    } catch (error: unknown) {
      if (__DEV__ || mode !== 'ai') {
        Alert.alert('Error', (error as Error).message || 'Could not create your first routine.');
      } else {
        console.warn(
          `[onboarding] Routine generation returned without a user-visible error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <OnboardingScaffold
        step={5}
        totalSteps={5}
        appearance="dark"
        onBack={() => router.back()}
        title="Build your first routine"
        subtitle="Choose a quick setup now. You can edit everything later."
        footer={
          <Animated.View style={{ opacity: ctaAnim }} pointerEvents={unlockedCount > SECTION_COUNT ? 'auto' : 'none'}>
            <OnboardingActionButton title="Create My Routine" onPress={handleContinue} loading={loading} />
          </Animated.View>
        }
      >
        <View style={styles.modeRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.modeCard, mode === 'ai' && styles.modeCardActive]}
            onPress={() => handleModeChange('ai')}
          >
            <Text style={[styles.modeTitle, mode === 'ai' && styles.modeTitleActive]}>Personalized by AI</Text>
            <Text style={[styles.modeHint, mode === 'ai' && styles.modeHintActive]}>
              {aiAccess === 'premium'
                ? 'Tailored to your setup.'
                : aiAccess === 'free'
                ? 'Your first AI routine is free.'
                : isPremium
                ? '3 AI routines per month with Setora Pro.'
                : 'Additional AI routines require Setora Pro.'}
            </Text>
          </TouchableOpacity>

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
        </View>

        <Animated.View style={{ opacity: sectionAnims[0] }}>
          <QuestionBlock label="Days per week">
            <ChipPicker
              chipStyle={styles.selectionChip}
              chipSelectedStyle={styles.selectionChipSelected}
              chipTextStyle={styles.selectionChipText}
              chipTextSelectedStyle={styles.selectionChipTextSelected}
              allowDeselect={false}
              selected={daysPerWeek}
              onChange={(value) => { if (value !== null) { setDaysPerWeek(value as 3 | 4 | 5); unlock(0); } }}
              items={[
                { key: '3', label: '3 days', value: 3 },
                { key: '4', label: '4 days', value: 4 },
                { key: '5', label: '5 days', value: 5 },
              ]}
              horizontal={false}
            />
          </QuestionBlock>
        </Animated.View>

        {unlockedCount > 1 && (
          <Animated.View style={{ opacity: sectionAnims[1] }}>
            <QuestionBlock label="Session length">
              <ChipPicker
                chipStyle={styles.selectionChip}
                chipSelectedStyle={styles.selectionChipSelected}
                chipTextStyle={styles.selectionChipText}
                chipTextSelectedStyle={styles.selectionChipTextSelected}
                allowDeselect={false}
                selected={sessionMinutes}
                onChange={(value) => { if (value !== null) { setSessionMinutes(value as 30 | 60 | 90); unlock(1); } }}
                items={[
                  { key: '30', label: '30 min', value: 30 },
                  { key: '60', label: '60 min', value: 60 },
                  { key: '90', label: '90 min', value: 90 },
                ]}
                horizontal={false}
              />
            </QuestionBlock>
          </Animated.View>
        )}

        {unlockedCount > 2 && (
          <Animated.View style={{ opacity: sectionAnims[2] }}>
            <QuestionBlock label="Plan length">
              <ChipPicker
                chipStyle={styles.selectionChip}
                chipSelectedStyle={styles.selectionChipSelected}
                chipTextStyle={styles.selectionChipText}
                chipTextSelectedStyle={styles.selectionChipTextSelected}
                allowDeselect={false}
                selected={weekCount}
                onChange={(value) => { if (value !== null) { setWeekCount(value as RoutineWeekCount); unlock(2); } }}
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
          </Animated.View>
        )}

        {unlockedCount > 3 && (
          <Animated.View style={{ opacity: sectionAnims[3] }}>
            <QuestionBlock label="Primary goal">
              <ChipPicker
                chipStyle={styles.selectionChip}
                chipSelectedStyle={styles.selectionChipSelected}
                chipTextStyle={styles.selectionChipText}
                chipTextSelectedStyle={styles.selectionChipTextSelected}
                allowDeselect={false}
                selected={goal}
                onChange={(value) => { if (value !== null) { setGoal(value as OnboardingGoal); unlock(3); } }}
                items={[
                  { key: 'muscle_gain', label: 'Muscle gain', value: 'muscle_gain' },
                  { key: 'fat_loss', label: 'Fat loss', value: 'fat_loss' },
                  { key: 'general_fitness', label: 'General fitness', value: 'general_fitness' },
                ]}
                horizontal={false}
              />
            </QuestionBlock>
          </Animated.View>
        )}

        {unlockedCount > 4 && (
          <Animated.View style={{ opacity: sectionAnims[4] }}>
            <QuestionBlock label="Experience level">
              <ChipPicker
                chipStyle={styles.selectionChip}
                chipSelectedStyle={styles.selectionChipSelected}
                chipTextStyle={styles.selectionChipText}
                chipTextSelectedStyle={styles.selectionChipTextSelected}
                allowDeselect={false}
                selected={experience}
                onChange={(value) => { if (value !== null) { setExperience(value as OnboardingExperience); unlock(4); } }}
                items={[
                  { key: 'beginner', label: 'Beginner', value: 'beginner' },
                  { key: 'intermediate', label: 'Intermediate', value: 'intermediate' },
                  { key: 'advanced', label: 'Advanced', value: 'advanced' },
                ]}
                horizontal={false}
              />
            </QuestionBlock>
          </Animated.View>
        )}

        {unlockedCount > 5 && (
          <Animated.View style={{ opacity: sectionAnims[5] }}>
            <QuestionBlock label="Equipment">
              <ChipPicker
                chipStyle={styles.selectionChip}
                chipSelectedStyle={styles.selectionChipSelected}
                chipTextStyle={styles.selectionChipText}
                chipTextSelectedStyle={styles.selectionChipTextSelected}
                allowDeselect={false}
                selected={equipment}
                onChange={(value) => { if (value !== null) { setEquipment(value as OnboardingEquipmentPreference); unlock(5); } }}
                items={[
                  { key: 'full_gym', label: 'Full gym', value: 'full_gym' },
                  { key: 'dumbbells_bench', label: 'Dumbbells + bench', value: 'dumbbells_bench' },
                  { key: 'bodyweight_minimal', label: 'Bodyweight / minimal', value: 'bodyweight_minimal' },
                ]}
                horizontal={false}
              />
            </QuestionBlock>
          </Animated.View>
        )}

        {unlockedCount > 6 && (
          <Animated.View style={{ opacity: sectionAnims[6] }}>
            <QuestionBlock label="Slight muscle focus (optional)">
              <ChipPicker
                chipStyle={styles.selectionChip}
                chipSelectedStyle={styles.selectionChipSelected}
                chipTextStyle={styles.selectionChipText}
                chipTextSelectedStyle={styles.selectionChipTextSelected}
                allowDeselect={false}
                selected={focusMuscle}
                onChange={(value) => { if (value !== null) { setFocusMuscle(value as OnboardingFocusMuscle); unlock(6); } }}
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
          </Animated.View>
        )}
      </OnboardingScaffold>

      <RoutineCreationLoadingOverlay visible={loading} mode={mode} context="onboarding" />
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
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modeCard: {
    flex: 1,
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
});
