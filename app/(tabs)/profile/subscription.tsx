import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
  type ViewToken,
} from 'react-native';
import ReAnimated, {
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PurchasesPackage } from 'react-native-purchases';
import { fonts, spacing } from '../../../src/constants';
import {
  isPremiumFeatureKey,
  PREMIUM_FEATURE_COPY,
  type PremiumFeatureKey,
} from '../../../src/models/subscription';
import { useSubscriptionStore } from '../../../src/stores/subscription.store';

// ─── constants ────────────────────────────────────────────────────────────────

const COLORS = {
  text: '#FFFFFF',
  textMuted: '#9EB0B9',
  accent: '#43E0D3',
  accentDim: 'rgba(67,224,211,0.12)',
  accentText: '#041416',
  card: '#111A1F',
  cardBorder: '#1E2E35',
  cardBorderActive: '#43E0D3',
  cardActive: '#0E2226',
  chip: '#0D1B21',
  chipBorder: '#1E2E35',
} as const;

const FEATURES = [
  { icon: '✦', label: 'AI Routine Builder',    desc: 'Personalized plans built from your goals, schedule, and available equipment.' },
  { icon: '◈', label: 'Advanced Analytics',    desc: 'Richer dashboard views with long-range history and progression charts.' },
  { icon: '↻', label: 'Monthly Credit Top-Up', desc: '3 AI routine credits refreshed every month so your plan stays fresh.' },
  { icon: '◎', label: 'Personal Records',      desc: 'Automatically tracked bests across every exercise, every session.' },
  { icon: '▲', label: 'Progression Charts',    desc: 'See your strength and volume trends clearly over time.' },
  { icon: '⊕', label: 'Unlimited Routines',    desc: 'Create and save as many training plans as you need.' },
];

type Feature = typeof FEATURES[0];
type ScrollerItem = Feature & { featIdx: number };

const ROW1: ScrollerItem[] = FEATURES.map((f, i) => ({ ...f, featIdx: i }));
// Row 2 starts from index 3 for visual stagger
const ROW2: ScrollerItem[] = [...FEATURES.slice(3), ...FEATURES.slice(0, 3)].map((f, i) => ({
  ...f,
  featIdx: (i + 3) % FEATURES.length,
}));

const CHIP_GAP        = 10;
const CHIP_ROW_HEIGHT = 42;
const ROW_GAP         = 8;
const SCROLL_SPEED    = 35; // px/s

const SCREEN_WIDTH           = Dimensions.get('window').width;
const FEATURE_SECTION_HEIGHT = CHIP_ROW_HEIGHT * 2 + ROW_GAP + 28;

// ─── ChipRow ─────────────────────────────────────────────────────────────────
//
// Doubles the item list so the array is [A B C D E F A B C D E F].
// Each chip has marginRight: CHIP_GAP (not gap on the container) so the full
// width is exactly 2× one set — halfWidth is a perfect seamless loop point.
//
// useFrameCallback runs a worklet on the UI thread every frame.
// offset increases monotonically; modulo keeps it in [0, halfWidth).
// Because the content repeats every halfWidth pixels the wrap is invisible.

type ChipRowProps = { items: ScrollerItem[]; onPress: (featIdx: number) => void };

function ChipRow({ items, onPress }: ChipRowProps) {
  const doubled   = useMemo(() => [...items, ...items], [items]);
  const halfWidth = useSharedValue(0);
  const offset    = useSharedValue(0);
  const measured  = useRef(false);

  useFrameCallback((frameInfo) => {
    'worklet';
    if (halfWidth.value === 0) return;
    const dt = frameInfo.timeSincePreviousFrame ?? 16;
    offset.value = (offset.value + (SCROLL_SPEED * dt) / 1000) % halfWidth.value;
  });

  const onInnerLayout = useCallback((e: LayoutChangeEvent) => {
    if (measured.current) return;
    const hw = e.nativeEvent.layout.width / 2;
    if (hw > 0) {
      measured.current = true;
      halfWidth.value = hw;
    }
  // halfWidth is a stable ref from useSharedValue
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -offset.value }],
  }));

  return (
    <View style={styles.chipRowOuter}>
      <ReAnimated.View style={[styles.chipRowInner, animStyle]} onLayout={onInnerLayout}>
        {doubled.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={styles.chip}
            onPress={() => onPress(item.featIdx)}
            activeOpacity={0.75}
          >
            <Text style={styles.chipIcon}>{item.icon}</Text>
            <Text style={styles.chipText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ReAnimated.View>
    </View>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function getFeatureValue(value: unknown): PremiumFeatureKey | null {
  return isPremiumFeatureKey(value) ? value : null;
}

function sortPackages<T extends { packageType: string }>(packages: T[]): T[] {
  const order = ['ANNUAL', 'MONTHLY', 'WEEKLY', 'SIX_MONTH', 'THREE_MONTH', 'TWO_MONTH', 'LIFETIME'];
  return [...packages].sort((a, b) => {
    const ai = order.indexOf(a.packageType);
    const bi = order.indexOf(b.packageType);
    return (ai === -1 ? order.length : ai) - (bi === -1 ? order.length : bi);
  });
}

function computeSavingsBadge(
  monthly: PurchasesPackage | undefined,
  annual:  PurchasesPackage | undefined,
): string | null {
  if (!monthly || !annual) return null;
  const monthlyYear = monthly.product.price * 12;
  if (monthlyYear <= 0) return null;
  const pct = Math.round((1 - annual.product.price / monthlyYear) * 100);
  return pct > 0 ? `Save ${pct}%` : null;
}

// ─── screen ──────────────────────────────────────────────────────────────────

export default function SubscriptionScreen() {
  const router   = useRouter();
  const params   = useLocalSearchParams<{ feature?: string; source?: string }>();
  const feature  = getFeatureValue(params.feature);
  const featureCopy = feature ? PREMIUM_FEATURE_COPY[feature] : null;
  const insets   = useSafeAreaInsets();

  const {
    initialized, loading, purchaseLoading, restoreLoading,
    available, availabilityMessage, offering, isPremium, managementUrl,
    refresh, purchase, restore, presentCustomerCenter,
  } = useSubscriptionStore();

  const packages    = useMemo(() => sortPackages(offering?.availablePackages ?? []), [offering]);
  const annualPkg   = packages.find((p) => p.packageType === 'ANNUAL');
  const monthlyPkg  = packages.find((p) => p.packageType === 'MONTHLY');
  const savingsBadge = useMemo(() => computeSavingsBadge(monthlyPkg, annualPkg), [monthlyPkg, annualPkg]);

  const [selectedPkg, setSelectedPkg] = useState<PurchasesPackage | null>(null);
  useEffect(() => {
    if (annualPkg && !selectedPkg) setSelectedPkg(annualPkg);
  }, [annualPkg]);

  useFocusEffect(
    useCallback(() => {
      if (initialized) void refresh();
    }, [initialized, refresh]),
  );

  // ── expanded card state ──────────────────────────────────────────────────
  const [expanded,    setExpanded]    = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const collapsedOpacity = useRef(new Animated.Value(1)).current;
  const expandedOpacity  = useRef(new Animated.Value(0)).current;
  const flatListRef      = useRef<FlatList>(null);

  const enterExpanded = useCallback((index: number) => {
    setActiveIndex(index);
    setExpanded(true);
    Animated.parallel([
      Animated.timing(collapsedOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(expandedOpacity,  { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();
  }, [collapsedOpacity, expandedOpacity]);

  const exitExpanded = useCallback(() => {
    Animated.parallel([
      Animated.timing(expandedOpacity,  { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(collapsedOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start(() => setExpanded(false));
  }, [collapsedOpacity, expandedOpacity]);

  useEffect(() => {
    if (!expanded) return;
    const t = setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: activeIndex, animated: false });
    }, 0);
    return () => clearTimeout(t);
  }, [expanded]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index != null) setActiveIndex(viewableItems[0].index);
    },
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 }).current;

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index }),
    [],
  );

  // ── purchase handlers ────────────────────────────────────────────────────
  const handlePurchase = async () => {
    if (!selectedPkg) return;
    try {
      const unlocked = await purchase(selectedPkg);
      if (unlocked) {
        Alert.alert('Welcome to Setora Pro!', 'Your premium access is now active.');
        router.back();
      }
    } catch (error) {
      Alert.alert('Purchase failed', error instanceof Error ? error.message : 'Something went wrong.');
    }
  };

  const handleRestore = async () => {
    try {
      const unlocked = await restore();
      if (unlocked) {
        Alert.alert('Purchases restored', 'Your premium access is active again.');
        router.back();
      } else {
        Alert.alert('Nothing to restore', 'No active subscription found for this account.');
      }
    } catch (error) {
      Alert.alert('Restore failed', error instanceof Error ? error.message : 'Could not restore purchases.');
    }
  };

  const handleManage = async () => {
    try {
      await presentCustomerCenter();
    } catch (error) {
      if (managementUrl) {
        const { Linking } = await import('react-native');
        await Linking.openURL(managementUrl).catch(() => {});
      } else {
        Alert.alert('Unavailable', error instanceof Error ? error.message : 'Could not open subscription management.');
      }
    }
  };

  const ctaLabel = purchaseLoading      ? 'Processing…'
    : (loading && !initialized)         ? 'Loading…'
    : isPremium                         ? 'Manage Subscription'
    :                                     'Start Setora Pro';

  // ── render ───────────────────────────────────────────────────────────────
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
        <TouchableOpacity
          style={[styles.closeBtn, { top: insets.top + 8 }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>SETORA PRO</Text>
          <Text style={styles.headline}>
            {featureCopy ? featureCopy.title : 'Train smarter.\nProgress faster.'}
          </Text>
          <Text style={styles.subheadline}>
            {featureCopy?.description ?? 'Unlock AI-powered planning, deeper analytics, and tools that grow with you.'}
          </Text>
        </View>

        {/* Feature section */}
        <View style={styles.featureSection}>
          {/* Scrolling rows (collapsed) */}
          <Animated.View
            style={[styles.rowsWrap, { opacity: collapsedOpacity }]}
            pointerEvents={expanded ? 'none' : 'auto'}
          >
            <ChipRow items={ROW1} onPress={enterExpanded} />
            <ChipRow items={ROW2} onPress={enterExpanded} />
            <Text style={styles.chipHint}>Tap a card to explore</Text>
          </Animated.View>

          {/* Paged detail cards (expanded) */}
          {expanded && (
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: expandedOpacity }]}>
              <FlatList
                ref={flatListRef}
                data={FEATURES}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                getItemLayout={getItemLayout}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                keyExtractor={(_, i) => String(i)}
                renderItem={({ item }) => (
                  <View style={styles.expandedPage}>
                    <TouchableOpacity style={styles.expandedCard} onPress={exitExpanded} activeOpacity={0.85}>
                      <Text style={styles.expandedIcon}>{item.icon}</Text>
                      <Text style={styles.expandedLabel}>{item.label}</Text>
                      <Text style={styles.expandedDesc}>{item.desc}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
              <View style={styles.dots}>
                {FEATURES.map((_, i) => (
                  <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
                ))}
              </View>
            </Animated.View>
          )}
        </View>

        {/* Bottom — plan picker + CTA */}
        <View style={styles.bottom}>
          {!available && availabilityMessage ? (
            <Text style={styles.unavailableText}>{availabilityMessage}</Text>
          ) : (
            <View style={styles.planRow}>
              {[monthlyPkg, annualPkg].map((pkg) => {
                if (!pkg) return null;
                const isAnnual   = pkg.packageType === 'ANNUAL';
                const isSelected = selectedPkg?.identifier === pkg.identifier;
                return (
                  <TouchableOpacity
                    key={pkg.identifier}
                    style={[styles.planCard, isSelected && styles.planCardSelected]}
                    onPress={() => setSelectedPkg(pkg)}
                    activeOpacity={0.85}
                  >
                    {isAnnual && savingsBadge && (
                      <View style={styles.planBadge}>
                        <Text style={styles.planBadgeText}>{savingsBadge}</Text>
                      </View>
                    )}
                    <Text style={[styles.planLabel, isSelected && styles.planLabelSelected]}>
                      {isAnnual ? 'Yearly' : 'Monthly'}
                    </Text>
                    <Text style={[styles.planPrice, isSelected && styles.planPriceSelected]}>
                      {pkg.product.priceString}
                    </Text>
                    {isAnnual && pkg.product.pricePerMonthString && (
                      <Text style={styles.planPerMonth}>{pkg.product.pricePerMonthString} / mo</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <TouchableOpacity
            style={[styles.ctaButton, (purchaseLoading || (!isPremium && (!available || !selectedPkg))) && styles.ctaButtonDisabled]}
            onPress={isPremium ? () => { void handleManage(); } : () => { void handlePurchase(); }}
            activeOpacity={0.85}
            disabled={purchaseLoading || (!isPremium && (!available || !selectedPkg))}
          >
            <Text style={styles.ctaText}>{ctaLabel}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.restoreBtn}
            onPress={() => { void handleRestore(); }}
            activeOpacity={0.7}
            disabled={restoreLoading}
          >
            <Text style={styles.restoreText}>{restoreLoading ? 'Restoring…' : 'Restore Purchases'}</Text>
          </TouchableOpacity>

          <Text style={styles.legal}>
            Cancel anytime. Billed through the App Store. By continuing you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: '#030507' },
  safeArea: { flex: 1 },

  closeBtn: {
    position: 'absolute',
    right: spacing.md,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: COLORS.textMuted, fontSize: 14, fontFamily: fonts.semiBold },

  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + 8,
    paddingBottom: spacing.md,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: COLORS.accent,
    letterSpacing: 2,
    marginBottom: 10,
  },
  headline: {
    fontSize: 32,
    fontFamily: fonts.bold,
    color: COLORS.text,
    lineHeight: 38,
    marginBottom: 10,
  },
  subheadline: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: COLORS.textMuted,
    lineHeight: 21,
  },

  featureSection: { height: FEATURE_SECTION_HEIGHT },

  rowsWrap: {
    flex: 1,
    gap: ROW_GAP,
    justifyContent: 'center',
  },

  // overflow: 'hidden' clips the row so only the visible portion shows
  chipRowOuter: {
    height: CHIP_ROW_HEIGHT,
    overflow: 'hidden',
  },
  // absolutely positioned so it can extend beyond the clip boundary
  chipRowInner: {
    flexDirection: 'row',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.chip,
    borderWidth: 1,
    borderColor: COLORS.chipBorder,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    height: CHIP_ROW_HEIGHT,
    // marginRight (not container gap) so every chip carries its own trailing
    // space — fullWidth / 2 is then an exact loop boundary with no pixel error
    marginRight: CHIP_GAP,
  },
  chipIcon: { fontSize: 13, color: COLORS.accent },
  chipText: { fontSize: 12, fontFamily: fonts.semiBold, color: COLORS.text },
  chipHint: {
    textAlign: 'center',
    fontSize: 11,
    fontFamily: fonts.regular,
    color: '#4A6068',
  },

  expandedPage: {
    width: SCREEN_WIDTH,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  expandedCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 20,
    padding: spacing.lg,
    gap: 10,
    height: FEATURE_SECTION_HEIGHT - 32,
    justifyContent: 'center',
  },
  expandedIcon:  { fontSize: 28, color: COLORS.accent },
  expandedLabel: { fontSize: 20, fontFamily: fonts.bold,    color: COLORS.text },
  expandedDesc:  { fontSize: 14, fontFamily: fonts.regular, color: COLORS.textMuted, lineHeight: 22 },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
  },
  dot:       { width: 5,  height: 5, borderRadius: 3, backgroundColor: '#2A3E46' },
  dotActive: { width: 16, height: 5, borderRadius: 3, backgroundColor: COLORS.accent },

  bottom: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  unavailableText: {
    color: COLORS.textMuted,
    fontFamily: fonts.regular,
    fontSize: 13,
    textAlign: 'center',
  },
  planRow: { flexDirection: 'row', gap: spacing.sm },
  planCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 3,
    minHeight: 88,
  },
  planCardSelected: { borderColor: COLORS.cardBorderActive, backgroundColor: COLORS.cardActive },
  planBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 2,
  },
  planBadgeText:     { fontSize: 10, fontFamily: fonts.semiBold, color: COLORS.accent, letterSpacing: 0.3 },
  planLabel:         { fontSize: 13, fontFamily: fonts.semiBold, color: COLORS.textMuted },
  planLabelSelected: { color: COLORS.text },
  planPrice:         { fontSize: 20, fontFamily: fonts.bold,     color: COLORS.textMuted },
  planPriceSelected: { color: COLORS.text },
  planPerMonth:      { fontSize: 11, fontFamily: fonts.regular,  color: COLORS.textMuted, marginTop: 1 },

  ctaButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonDisabled: { opacity: 0.6 },
  ctaText:    { color: COLORS.accentText, fontFamily: fonts.bold,    fontSize: 16 },
  restoreBtn: { alignItems: 'center', paddingVertical: 4 },
  restoreText: { color: COLORS.textMuted, fontFamily: fonts.regular, fontSize: 13 },
  legal: {
    color: '#4A6068',
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
});
