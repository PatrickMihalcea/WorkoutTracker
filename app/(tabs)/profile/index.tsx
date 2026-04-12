import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useProfileStore } from '../../../src/stores/profile.store';
import { Card } from '../../../src/components/ui';
import { colors, fonts, spacing } from '../../../src/constants';
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
        <Card style={styles.heroCard}>
          <View style={styles.topRow}>
            <Text style={styles.displayName} numberOfLines={1} ellipsizeMode="tail">
              @{profile?.display_name ?? 'user'}
            </Text>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => router.push('/(tabs)/profile/settings')}
              activeOpacity={0.8}
            >
              <Image source={require('../../../assets/icons/setting.png')} style={styles.settingsIcon} />
            </TouchableOpacity>
          </View>

          {profile?.name ? <Text style={styles.name}>{profile.name}</Text> : null}
          {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

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

        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => router.push('/(tabs)/profile/measurements')}
            activeOpacity={0.8}
          >
            <Text style={styles.quickActionTitle}>Measurements</Text>
            <Text style={styles.quickActionSub}>Track body metrics</Text>
            <Text style={styles.quickActionArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionCard, styles.quickActionCardAccent]}
            onPress={() => router.push('/(tabs)/profile/goals')}
            activeOpacity={0.8}
          >
            <Text style={styles.quickActionTitle}>Goals</Text>
            <Text style={styles.quickActionSub}>Set your targets</Text>
            <Text style={styles.quickActionArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Profile Info</Text>
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
          <View style={[styles.infoRow, styles.infoRowLast]}>
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
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl + spacing.md,
  },
  heroCard: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    borderColor: '#2D6666',
    backgroundColor: '#171D1D',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  displayName: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: '#D9F6F2',
    flexShrink: 1,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2D6666',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(78, 205, 196, 0.08)',
  },
  settingsIcon: {
    width: 18,
    height: 18,
    tintColor: '#8FE2DA',
  },
  name: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  bio: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#88A2A2',
    marginBottom: spacing.sm,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  quickActionCardAccent: {
    borderColor: '#2D6666',
    backgroundColor: '#152020',
  },
  quickActionTitle: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  quickActionSub: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  quickActionArrow: {
    fontSize: 20,
    fontFamily: fonts.light,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#2D6666',
    paddingTop: spacing.sm,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#2D6666',
  },
  statValue: {
    fontSize: 19,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#88A2A2',
    marginTop: spacing.xs,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  infoCard: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoRowLast: {
    borderBottomWidth: 0,
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
