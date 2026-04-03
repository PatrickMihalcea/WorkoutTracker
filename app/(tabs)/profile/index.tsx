import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useProfileStore } from '../../../src/stores/profile.store';
import { Card } from '../../../src/components/ui';
import { colors, fonts } from '../../../src/constants';
import { formatHeight } from '../../../src/utils/units';

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { profile } = useProfileStore();

  const displayWeight = () => {
    if (!profile?.weight_kg) return '--';
    if (profile.weight_unit === 'lbs') {
      return `${Math.round(profile.weight_kg * 2.20462 * 10) / 10} lbs`;
    }
    return `${Math.round(profile.weight_kg * 10) / 10} kg`;
  };

  const displayHeight = () => {
    if (!profile?.height_cm) return '--';
    return formatHeight(profile.height_cm, profile.height_unit);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.displayName} numberOfLines={1} ellipsizeMode="tail">
            @{profile?.display_name ?? 'user'}
          </Text>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/(tabs)/profile/settings')}
          >
            <Image source={require('../../../assets/icons/setting.png')} style={styles.settingsIcon} />
          </TouchableOpacity>
        </View>

        {profile?.name && (
          <Text style={styles.name}>{profile.name}</Text>
        )}
        {profile?.bio && (
          <Text style={styles.bio}>{profile.bio}</Text>
        )}

        <Card style={styles.statsCard}>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{displayWeight()}</Text>
              <Text style={styles.statLabel}>Weight</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{displayHeight()}</Text>
              <Text style={styles.statLabel}>Height</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Sex</Text>
            <Text style={styles.infoValue}>
              {profile?.sex === 'male' ? 'Male' : profile?.sex === 'female' ? 'Female' : 'Other'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Birthday</Text>
            <Text style={styles.infoValue}>
              {profile?.birthday
                ? new Date(profile.birthday + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '--'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email ?? '--'}</Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  displayName: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.text,
    flexShrink: 1,
  },
  iconBtn: {
    padding: 8,
  },
  settingsIcon: {
    width: 24,
    height: 24,
    tintColor: colors.text,
  },
  name: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginBottom: 16,
  },
  statsCard: {
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  statValue: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginTop: 4,
  },
  infoCard: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
});
