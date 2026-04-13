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

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { signUp, loading } = useAuthStore();

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    try {
      await signUp(email.trim(), password);
      Alert.alert('Success', 'Check your email to confirm your account');
    } catch (error: unknown) {
      Alert.alert('Sign Up Failed', (error as Error).message);
    }
  };

  return (
    <AuthScaffold
      title="Create your account"
      subtitle="Start strong, keep history synced, and unlock full workout tracking."
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
        placeholder="At least 6 characters"
        secureTextEntry
      />

      <Input
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Re-enter password"
        secureTextEntry
      />

      <Button
        title="Sign Up"
        onPress={handleSignUp}
        loading={loading}
        style={styles.signUpButton}
      />

      <Link href="/(auth)/login" replace style={styles.link}>
        <Text style={styles.linkText}>
          Already have an account? <Text style={styles.linkBold}>Log in</Text>
        </Text>
      </Link>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  signUpButton: {
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
