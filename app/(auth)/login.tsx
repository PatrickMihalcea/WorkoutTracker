import { useState } from 'react';
import {
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';
import { Button, Input } from '../../src/components/ui';
import { colors, fonts, spacing } from '../../src/constants';
import { AuthScaffold } from '../../src/components/auth/AuthScaffold';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, loading } = useAuthStore();

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

      <Link href="/(auth)/signup" replace style={styles.link}>
        <Text style={styles.linkText}>
          Don&apos;t have an account? <Text style={styles.linkBold}>Sign up</Text>
        </Text>
      </Link>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  loginButton: {
    marginTop: spacing.xs,
    backgroundColor: '#CFEFEB',
    borderColor: '#CFEFEB',
    borderWidth: 1,
  },
  link: {
    alignSelf: 'center',
    marginTop: spacing.md,
  },
  linkText: {
    color: '#9EBABB',
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  linkBold: {
    color: '#DFFCF8',
    fontFamily: fonts.semiBold,
  },
});
