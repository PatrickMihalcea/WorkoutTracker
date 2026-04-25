import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Input } from '../../../src/components/ui';
import { fonts, spacing } from '../../../src/constants';
import { useTheme } from '../../../src/contexts/ThemeContext';
import type { ThemeColors } from '../../../src/constants/themes';
import { FeedbackType } from '../../../src/models/feedback';
import { feedbackService } from '../../../src/services';
import { useAuthStore } from '../../../src/stores/auth.store';

const FEEDBACK_OPTIONS: { value: FeedbackType; label: string; description: string }[] = [
  {
    value: 'bug_report',
    label: 'Bug Report',
    description: 'Something is broken, confusing, or not behaving the way it should.',
  },
  {
    value: 'feature_request',
    label: 'Feature Request',
    description: 'A capability or workflow you would love to see added to the app.',
  },
  {
    value: 'general_feedback',
    label: 'General Feedback',
    description: 'Overall thoughts, ideas, praise, or friction points.',
  },
  {
    value: 'ui_ux_feedback',
    label: 'UI / UX Feedback',
    description: 'Thoughts about layout, polish, usability, or overall feel.',
  },
  {
    value: 'performance_issue',
    label: 'Performance Issue',
    description: 'The app feels slow, laggy, or unstable during specific actions.',
  },
];

export default function FeedbackScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user } = useAuthStore();
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('general_feedback');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmedComment = comment.trim();
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in again before sending feedback.');
      return;
    }
    if (!trimmedComment) {
      Alert.alert('Missing comment', 'Please share a few details before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      await feedbackService.create({
        user_id: user.id,
        feedback_type: feedbackType,
        comment: trimmedComment,
      });
      setComment('');
      Alert.alert('Thanks for the feedback', 'Your note has been sent.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: unknown) {
      Alert.alert('Could not send feedback', (error as Error).message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.introCard}>
        <Text style={styles.title}>Help shape the app</Text>
        <Text style={styles.subtitle}>
          Share bugs, ideas, polish notes, or anything that would make Workout Tracker more useful.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Feedback Type</Text>
        {FEEDBACK_OPTIONS.map((option) => {
          const selected = option.value === feedbackType;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.optionCard, selected && styles.optionCardSelected]}
              onPress={() => setFeedbackType(option.value)}
              activeOpacity={0.85}
            >
              <View style={styles.optionHeader}>
                <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>
                  {option.label}
                </Text>
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected ? <View style={styles.radioDot} /> : null}
                </View>
              </View>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.section}>
        <Input
          label="Comment"
          value={comment}
          onChangeText={setComment}
          placeholder="What happened, what would you like to see, or what could feel better?"
          multiline
          numberOfLines={12}
          textAlignVertical="top"
          containerStyle={styles.commentInputWrap}
        />
        <Text style={styles.helpText}>
          Specific details are especially helpful for bug reports and performance issues.
        </Text>
      </View>

      <Button
        title="Send Feedback"
        onPress={handleSubmit}
        loading={submitting}
        disabled={submitting}
      />
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 8,
    gap: 16,
    paddingBottom: spacing.bottom,
  },
  introCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  section: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  optionCard: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  optionCardSelected: {
    borderColor: colors.accent,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 6,
  },
  optionTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  optionTitleSelected: {
    color: colors.accent,
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  radioSelected: {
    borderColor: colors.accent,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  commentInputWrap: {
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
});
