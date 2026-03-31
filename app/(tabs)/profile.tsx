import { View, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '../../src/stores/auth.store';
import { Button, Card } from '../../src/components/ui';
import { colors, fonts } from '../../src/constants';

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email ?? 'Unknown'}</Text>
      </Card>

      <Button
        title="Sign Out"
        variant="danger"
        onPress={signOut}
        style={styles.signOutBtn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  card: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontFamily: fonts.light,
    color: colors.textMuted,
    marginBottom: 4,
  },
  value: {
    fontSize: 17,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  signOutBtn: {
    marginTop: 'auto',
  },
});
