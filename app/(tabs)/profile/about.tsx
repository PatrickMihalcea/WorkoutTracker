import { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fonts, spacing } from '../../../src/constants';
import { useTheme } from '../../../src/contexts/ThemeContext';
import type { ThemeColors } from '../../../src/constants/themes';

export default function AboutScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Image
          source={require('../../../assets/headshot-cropped.png')}
          style={styles.headshot}
          resizeMode="cover"
        />
        <Text style={styles.name}>Patrick Mihalcea</Text>
        <Text style={styles.eyebrow}>Why this app exists</Text>
        
        <Text style={styles.title}>Built from a real fitness journey.</Text>
        <Text style={styles.lead}>
          Setora started from a simple frustration: most fitness apps only do one part of
          the job well. I wanted something that could handle training, progress, planning, and
          personal accountability in one clean place without feeling bloated or confusing.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>The vision</Text>
        <Text style={styles.body}>
          My goal is to build a do-it-all fitness app with a polished, intuitive feel. Something
          that is simple enough to use every day, but powerful enough to grow with you as your
          goals evolve.
        </Text>
        <Text style={styles.body}>
          I care a lot about clean UI, fast interactions, and making the app feel motivating rather
          than overwhelming. Every screen should help you stay focused, track what matters, and keep
          pushing toward improvement.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Where it’s going</Text>
        <Text style={styles.body}>
          This is an app shaped by real lifting, real trial and error, and a constant drive to make
          the experience better. The long-term aim is to create something people can rely on daily:
          a training companion that feels thoughtful, capable, and genuinely enjoyable to use.
        </Text>
        <Text style={styles.body}>
          If you are using it, you are part of that journey too. Every session logged, every idea,
          and every bit of feedback helps make it sharper.
        </Text>
      </View>
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
  heroCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  headshot: {
    width: 92,
    height: 92,
    borderRadius: 46,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  eyebrow: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    textAlign: 'center',
  },
  name: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
    marginBottom: 6,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  lead: {
    fontSize: 14,
    lineHeight: 24,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  section: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 10,
  },
  body: {
    fontSize: 14,
    lineHeight: 23,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginBottom: 12,
  },
});
