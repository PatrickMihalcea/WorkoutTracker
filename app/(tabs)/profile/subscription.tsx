import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Card, Button } from '../../../src/components/ui';
import { fonts, spacing } from '../../../src/constants';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { PAYWALL_RESULT } from 'react-native-purchases-ui';
import {
  isPremiumFeatureKey,
  PREMIUM_FEATURE_COPY,
  type PremiumFeatureKey,
} from '../../../src/models/subscription';
import { subscriptionService } from '../../../src/services/subscription.service';
import { useSubscriptionStore } from '../../../src/stores/subscription.store';
import type { ThemeColors } from '../../../src/constants/themes';

const PREMIUM_BULLETS = [
  'AI-generated routines built around your goals and equipment',
  'Advanced analytics with deeper dashboard views',
  'Longer-range history filters and premium progression insights',
] as const;

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.md,
      paddingBottom: spacing.bottom,
      gap: spacing.md,
    },
    heroCard: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderColor: colors.border,
    },
    eyebrow: {
      fontSize: 12,
      fontFamily: fonts.semiBold,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: spacing.xs,
    },
    title: {
      fontSize: 26,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontSize: 14,
      fontFamily: fonts.regular,
      color: colors.textMuted,
      lineHeight: 22,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    statusPill: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceLight,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    statusPillActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentDim,
    },
    statusPillText: {
      fontSize: 12,
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    sectionTitle: {
      fontSize: 12,
      fontFamily: fonts.semiBold,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: spacing.sm,
    },
    infoCard: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderColor: colors.border,
    },
    infoText: {
      fontSize: 14,
      fontFamily: fonts.regular,
      color: colors.textMuted,
      lineHeight: 21,
    },
    bulletList: {
      gap: spacing.sm,
    },
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    bulletDot: {
      fontSize: 16,
      lineHeight: 20,
      color: colors.accent,
      fontFamily: fonts.bold,
    },
    bulletText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: fonts.regular,
      color: colors.text,
    },
    packagesColumn: {
      gap: spacing.sm,
    },
    packageCard: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderColor: colors.border,
    },
    packageHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    packageTitle: {
      fontSize: 16,
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    packagePrice: {
      fontSize: 18,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    packageMeta: {
      fontSize: 13,
      fontFamily: fonts.regular,
      color: colors.textMuted,
      marginBottom: spacing.sm,
    },
    packageButton: {
      marginTop: spacing.xs,
    },
    packageBadge: {
      alignSelf: 'flex-start',
      marginTop: spacing.sm,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: colors.accentDim,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    packageBadgeText: {
      fontSize: 11,
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    actionButton: {
      flex: 1,
    },
    footnote: {
      fontSize: 12,
      fontFamily: fonts.regular,
      color: colors.textMuted,
      lineHeight: 18,
    },
    availabilityText: {
      fontSize: 13,
      fontFamily: fonts.regular,
      color: colors.textMuted,
      marginTop: spacing.sm,
    },
    configLabel: {
      fontSize: 12,
      fontFamily: fonts.semiBold,
      color: colors.textMuted,
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    configValue: {
      fontSize: 13,
      lineHeight: 20,
      fontFamily: fonts.regular,
      color: colors.text,
    },
  });
}

function getFeatureValue(value: unknown): PremiumFeatureKey | null {
  return isPremiumFeatureKey(value) ? value : null;
}

function getPackageLabel(aPackage: { packageType: string; product: { title: string } }): string {
  const normalized = aPackage.packageType.toLowerCase();
  if (normalized.includes('annual')) return 'Annual';
  if (normalized.includes('monthly')) return 'Monthly';
  if (normalized.includes('weekly')) return 'Weekly';
  if (normalized.includes('lifetime')) return 'Lifetime';
  return aPackage.product.title;
}

function sortPackages<T extends { packageType: string }>(packages: T[]): T[] {
  const order = ['ANNUAL', 'MONTHLY', 'WEEKLY', 'SIX_MONTH', 'THREE_MONTH', 'TWO_MONTH', 'LIFETIME'];
  return [...packages].sort((left, right) => {
    const leftIndex = order.indexOf(left.packageType);
    const rightIndex = order.indexOf(right.packageType);
    return (leftIndex === -1 ? order.length : leftIndex) - (rightIndex === -1 ? order.length : rightIndex);
  });
}

export default function SubscriptionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ feature?: string; source?: string }>();
  const feature = getFeatureValue(params.feature);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [paywallLoading, setPaywallLoading] = useState(false);
  const [customerCenterLoading, setCustomerCenterLoading] = useState(false);
  const {
    initialized,
    loading,
    restoreLoading,
    available,
    availabilityMessage,
    offering,
    isPremium,
    managementUrl,
    refresh,
    presentPaywallIfNeeded,
    presentCustomerCenter,
    restore,
  } = useSubscriptionStore();

  useFocusEffect(
    useCallback(() => {
      if (initialized) {
        void refresh();
      }
    }, [initialized, refresh]),
  );

  const featureCopy = feature ? PREMIUM_FEATURE_COPY[feature] : null;
  const packages = useMemo(
    () => sortPackages(offering?.availablePackages ?? []),
    [offering?.availablePackages],
  );

  const handleOpenPaywall = useCallback(async () => {
    setPaywallLoading(true);
    try {
      const result = await presentPaywallIfNeeded();
      if (subscriptionService.didUnlockPremium(result)) {
        Alert.alert('Premium unlocked', 'Your premium access is active.');
        router.back();
        return;
      }

      if (result === PAYWALL_RESULT.NOT_PRESENTED && isPremium) {
        Alert.alert('Already active', 'Setora Pro is already active on this account.');
      }
    } catch (error) {
      Alert.alert('Paywall failed', error instanceof Error ? error.message : 'Could not open the paywall.');
    } finally {
      setPaywallLoading(false);
    }
  }, [isPremium, presentPaywallIfNeeded, router]);

  const handleOpenCustomerCenter = useCallback(async () => {
    setCustomerCenterLoading(true);
    try {
      await presentCustomerCenter();
    } catch (error) {
      if (managementUrl) {
        try {
          await subscriptionService.openManagementUrl(managementUrl);
          return;
        } catch {
          // fall through to the alert below
        }
      }
      Alert.alert(
        'Customer Center unavailable',
        error instanceof Error ? error.message : 'Could not open Customer Center.',
      );
    } finally {
      setCustomerCenterLoading(false);
    }
  }, [managementUrl, presentCustomerCenter]);

  const handleManage = useCallback(async () => {
    if (isPremium) {
      await handleOpenCustomerCenter();
      return;
    }

    try {
      await handleOpenPaywall();
    } catch {
      // paywall flow already surfaces its own errors
    }
  }, [handleOpenCustomerCenter, handleOpenPaywall, isPremium]);

  const handleRestore = useCallback(async () => {
    try {
      const unlocked = await restore();
      Alert.alert(
        unlocked ? 'Purchases restored' : 'Nothing to restore',
        unlocked
          ? 'Your premium access is active again.'
          : 'We could not find an active premium subscription for this account.',
      );
      if (unlocked) {
        router.back();
      }
    } catch (error) {
      Alert.alert('Restore failed', error instanceof Error ? error.message : 'Could not restore purchases.');
    }
  }, [restore, router]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.heroCard}>
        <Text style={styles.eyebrow}>{featureCopy ? 'Unlock this feature' : 'Subscription'}</Text>
        <Text style={styles.title}>{featureCopy?.title ?? 'Setora Pro'}</Text>
        <Text style={styles.subtitle}>
          {featureCopy?.description ?? 'Upgrade to unlock premium planning and analytics across the app.'}
        </Text>

        <View style={styles.statusRow}>
          <View style={[styles.statusPill, isPremium && styles.statusPillActive]}>
            <Text style={styles.statusPillText}>{isPremium ? 'Premium active' : 'Free plan'}</Text>
          </View>
        </View>

        {!available && availabilityMessage ? (
          <Text style={styles.availabilityText}>{availabilityMessage}</Text>
        ) : null}
      </Card>

      <Card style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Included</Text>
        <View style={styles.bulletList}>
          {PREMIUM_BULLETS.map((item) => (
            <View key={item} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card style={styles.infoCard}>
        <Text style={styles.sectionTitle}>RevenueCat Offering</Text>
        {loading && !initialized ? (
          <Text style={styles.infoText}>Loading subscription options…</Text>
        ) : packages.length > 0 ? (
          <View style={styles.packagesColumn}>
            {packages.map((aPackage) => {
              const label = getPackageLabel(aPackage);
              const isBestValue = aPackage.packageType === 'ANNUAL';
              return (
                <Card key={aPackage.identifier} style={styles.packageCard}>
                  <View style={styles.packageHeader}>
                    <Text style={styles.packageTitle}>{label}</Text>
                    <Text style={styles.packagePrice}>{aPackage.product.priceString}</Text>
                  </View>
                  <Text style={styles.configLabel}>Package</Text>
                  <Text style={styles.packageMeta}>{aPackage.identifier}</Text>
                  <Text style={styles.configLabel}>Product</Text>
                  <Text style={styles.packageMeta}>
                    {aPackage.product.identifier}
                  </Text>
                  <Text style={styles.configLabel}>Description</Text>
                  <Text style={styles.packageMeta}>
                    {aPackage.product.description || aPackage.product.title}
                  </Text>
                  {aPackage.product.pricePerMonthString ? (
                    <Text style={styles.packageMeta}>{aPackage.product.pricePerMonthString} / month equivalent</Text>
                  ) : null}
                  {isBestValue ? (
                    <View style={styles.packageBadge}>
                      <Text style={styles.packageBadgeText}>Best value</Text>
                    </View>
                  ) : null}
                </Card>
              );
            })}
          </View>
        ) : (
          <Text style={styles.infoText}>
            Subscription products are not available yet. In RevenueCat, create the `default` offering and attach your `lifetime`, `yearly`, and `monthly` packages.
          </Text>
        )}
      </Card>

      <View style={styles.actionsRow}>
        <Button
          title={isPremium ? 'View Pro Access' : 'Open Paywall'}
          onPress={() => { void handleOpenPaywall(); }}
          loading={paywallLoading}
          disabled={!available}
          style={styles.actionButton}
        />
        <Button
          title="Restore"
          variant="secondary"
          onPress={() => { void handleRestore(); }}
          loading={restoreLoading}
          style={styles.actionButton}
        />
      </View>

      <View style={styles.actionsRow}>
        <Button
          title="Customer Center"
          variant="ghost"
          onPress={() => { void handleOpenCustomerCenter(); }}
          loading={customerCenterLoading}
          disabled={!available && !managementUrl}
          style={styles.actionButton}
        />
        <Button
          title={isPremium ? 'Manage' : 'Upgrade'}
          variant="ghost"
          onPress={() => { void handleManage(); }}
          disabled={!available && !managementUrl}
          style={styles.actionButton}
        />
      </View>

      <Text style={styles.footnote}>
        This build is configured with a RevenueCat Test Store key. Keep it for development only, then switch to platform-specific iOS and Android public SDK keys before release.
      </Text>
    </ScrollView>
  );
}
