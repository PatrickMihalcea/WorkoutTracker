import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts } from '../../../src/constants';

interface AccountItemProps {
  label: string;
  onPress: () => void;
}

function AccountItem({ label, onPress }: AccountItemProps) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <Text style={styles.itemText}>{label}</Text>
      <Text style={styles.itemArrow}>›</Text>
    </TouchableOpacity>
  );
}

export default function AccountScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <AccountItem
          label="Change Username"
          onPress={() => router.push('/(tabs)/profile/change-username')}
        />
        <AccountItem
          label="Change Email"
          onPress={() => router.push('/(tabs)/profile/change-email')}
        />
        <AccountItem
          label="Update Password"
          onPress={() => router.push('/(tabs)/profile/change-password')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  itemArrow: {
    fontSize: 20,
    fontFamily: fonts.light,
    color: colors.textMuted,
  },
});
