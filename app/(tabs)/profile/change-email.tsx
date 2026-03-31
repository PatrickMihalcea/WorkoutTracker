import { useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuthStore } from '../../../src/stores/auth.store';
import { Button, Input } from '../../../src/components/ui';
import { colors } from '../../../src/constants';

export default function ChangeEmailScreen() {
  const { user, updateEmail } = useAuthStore();
  const [email, setEmail] = useState(user?.email ?? '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }
    if (trimmed === user?.email) return;

    setLoading(true);
    try {
      await updateEmail(trimmed);
      Alert.alert('Verification Sent', 'Check your new email to confirm the change.');
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Input
        label="New Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus
      />
      <Button title="Update Email" onPress={handleSave} loading={loading} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
});
