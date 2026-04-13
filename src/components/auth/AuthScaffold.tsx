import { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, fonts, spacing } from '../../constants';

interface AuthScaffoldProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthScaffold({ title, subtitle, children }: AuthScaffoldProps) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#030507', '#0A171E', '#123038', '#050709']}
        locations={[0, 0.38, 0.72, 1]}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.keyboardWrap}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.hero}>
              <Text style={styles.kicker}>WORKOUT TRACKER</Text>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>

            <View style={styles.formCard}>
              {children}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  keyboardWrap: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  hero: {
    marginBottom: spacing.lg,
  },
  kicker: {
    color: '#8DB6B2',
    fontSize: 11,
    fontFamily: fonts.semiBold,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    lineHeight: 40,
    fontFamily: fonts.bold,
    marginBottom: 6,
  },
  subtitle: {
    color: '#A7C0C0',
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.regular,
  },
  formCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#365D62',
    backgroundColor: 'rgba(14, 24, 28, 0.88)',
    padding: spacing.md,
  },
});
