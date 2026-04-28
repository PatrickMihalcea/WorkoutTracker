import { useMemo, useState } from 'react';
import {
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';
import { Button, Input } from '../../src/components/ui';
import { fonts, spacing } from '../../src/constants';
import { AuthScaffold } from '../../src/components/auth/AuthScaffold';
import { SocialAuthButtons } from '../../src/components/auth/SocialAuthButtons';
import { useTheme } from '../../src/contexts/ThemeContext';
import type { ThemeColors } from '../../src/constants/themes';

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  loginButton: {
    marginTop: spacing.xs,
    backgroundColor: colors.text,
    borderColor: colors.text,
    borderWidth: 1,
  },
  link: {
    alignSelf: 'center',
    marginTop: spacing.md,
  },
  linkText: {
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  linkBold: {
    color: colors.text,
    fontFamily: fonts.semiBold,
  },
});

export default function LoginScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, signInWithOAuth, loading } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      await signIn(email.trim(), password);
    } catch (error: unknown) {
      Alert.alert('Login Failed', (error as Error).message);
    }
  };

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    try {
      await signInWithOAuth(provider);
    } catch (error: unknown) {
      Alert.alert('Sign In Failed', (error as Error).message);
    }
  };

  return (
    <AuthScaffold
      title="Welcome back"
      subtitle="Log in to continue your progress and keep your streak moving."
    >
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Your password"
        secureTextEntry
      />

      <Button
        title="Log In"
        onPress={handleLogin}
        loading={loading}
        style={styles.loginButton}
      />

      <SocialAuthButtons
        onGoogle={() => handleOAuth('google')}
        loading={loading}
      />

      <Link href="/(auth)/signup" replace style={styles.link}>
        <Text style={styles.linkText}>
          Don&apos;t have an account? <Text style={styles.linkBold}>Sign up</Text>
        </Text>
      </Link>
    </AuthScaffold>
  );
}
