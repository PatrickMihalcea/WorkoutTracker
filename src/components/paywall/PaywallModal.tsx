import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
  type ViewToken,
} from 'react-native';
import ReAnimated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PurchasesPackage } from 'react-native-purchases';
import { fonts, spacing } from '../../constants';
import {
  PREMIUM_FEATURE_COPY,
  type PremiumFeatureKey,
} from '../../models/subscription';
import { useSubscriptionStore } from '../../stores/subscription.store';

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
const ROW2: ScrollerItem[] = [...FEATURES.slice(3), ...FEATURES.slice(0, 3)].map((f, i) => ({
  ...f,
  featIdx: (i + 3) % FEATURES.length,
}));

const CHIP_GAP        = 10;
const CHIP_ROW_HEIGHT = 42;
const ROW_GAP         = 8;
const SCROLL_SPEED    = 35;

const SCREEN_WIDTH            = Dimensions.get('window').width;
const SCREEN_HEIGHT           = Dimensions.get('window').height;
const FEATURE_SECTION_HEIGHT  = CHIP_ROW_HEIGHT * 2 + ROW_GAP + 28;
const EXPANDED_SECTION_HEIGHT = 230;

// ─── ChipRow ─────────────────────────────────────────────────────────────────
//
// Doubles the item list so the array is [A B C D E F A B C D E F].
// Each chip has marginRight: CHIP_GAP so the full width is exactly 2× one
// set — halfWidth is a perfect seamless loop point.
//
// A single withRepeat(withTiming(..., Easing.linear)) drives offset from 0 →
// halfWidth on repeat — no per-frame arithmetic, no modulo jitter.

type ChipRowProps = { items: ScrollerItem[]; onPress: (featIdx: number) => void };

function ChipRow({ items, onPress }: ChipRowProps) {
  const doubled = useMemo(() => [...items, ...items], [items]);
  const offset  = useSharedValue(0);
  const started = useRef(false);

  const onInnerLayout = useCallback((e: LayoutChangeEvent) => {
    if (started.current) return;
    const hw = e.nativeEvent.layout.width / 2;
    if (hw <= 0) return;
    started.current = true;
    offset.value = withRepeat(
      withTiming(hw, { duration: (hw / SCROLL_SPEED) * 1000, easing: Easing.linear }),
      -1,
      false,
    );
  // offset is a stable ref from useSharedValue
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

function sortPackages<T extends { packageType: string }>(packages: T[]): T[] {
  const order = ['ANNUAL', 'MONTHLY', 'WEEKLY', 'SIX_MONTH', 'THREE_MONTH', 'TWO_MONTH', 'LIFETIME'];
  return [...packages].sort((a, b) => {
    const ai = order.indexOf(a.packageType);
    const bi = order.indexOf(b.packageType);
    return (ai === -1 ? order.length : ai) - (bi === -1 ? order.length : bi);
  });
}

function stripCurrency(priceString: string): string {
  return priceString.replace(/[^\d.,\s]/g, '').trim();
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

// ─── PaywallModal ─────────────────────────────────────────────────────────────

export interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  feature?: PremiumFeatureKey;
}

export function PaywallModal({ visible, onClose, feature }: PaywallModalProps) {
  const insets      = useSafeAreaInsets();
  const featureCopy = feature ? PREMIUM_FEATURE_COPY[feature] : null;

  // Native Modal visibility is separate from the `visible` prop so the close
  // animation can play out before the modal is unmounted.
  const [nativeVisible, setNativeVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const {
    initialized, loading, purchaseLoading, restoreLoading,
    available, availabilityMessage, offering, isPremium, managementUrl,
    refresh, purchase, restore, presentCustomerCenter,
  } = useSubscriptionStore();

  const packages     = useMemo(() => sortPackages(offering?.availablePackages ?? []), [offering]);
  const annualPkg    = packages.find((p) => p.packageType === 'ANNUAL');
  const monthlyPkg   = packages.find((p) => p.packageType === 'MONTHLY');
  const lifetimePkg  = packages.find((p) => p.packageType === 'LIFETIME');
  const savingsBadge = useMemo(() => computeSavingsBadge(monthlyPkg, annualPkg), [monthlyPkg, annualPkg]);

  const [selectedPkg, setSelectedPkg] = useState<PurchasesPackage | null>(null);
  useEffect(() => {
    if (annualPkg && !selectedPkg) setSelectedPkg(annualPkg);
  }, [annualPkg]);

  // Slide in on open; refresh subscription data each time the modal appears.
  useEffect(() => {
    if (visible) {
      setNativeVisible(true);
      setExpanded(false);
      setActiveIndex(0);
      setSelectedPkg(null);
      collapsedOpacity.setValue(1);
      expandedOpacity.setValue(0);
      sectionHeight.setValue(FEATURE_SECTION_HEIGHT);
      slideAnim.setValue(SCREEN_HEIGHT);
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }).start();
      if (initialized) void refresh();
    }
  // Animated values and stable store refs are safe to omit
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleClose = useCallback(() => {
    Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 300, useNativeDriver: true }).start(() => {
      setNativeVisible(false);
      onClose();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  // ── expanded card state ──────────────────────────────────────────────────
  const [expanded,    setExpanded]    = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const collapsedOpacity = useRef(new Animated.Value(1)).current;
  const expandedOpacity  = useRef(new Animated.Value(0)).current;
  const sectionHeight    = useRef(new Animated.Value(FEATURE_SECTION_HEIGHT)).current;
  const flatListRef      = useRef<FlatList>(null);

  const enterExpanded = useCallback((index: number) => {
    setActiveIndex(index);
    setExpanded(true);
    Animated.parallel([
      Animated.timing(collapsedOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(expandedOpacity,  { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(sectionHeight,    { toValue: EXPANDED_SECTION_HEIGHT, duration: 280, useNativeDriver: false }),
    ]).start();
  }, [collapsedOpacity, expandedOpacity, sectionHeight]);

  const exitExpanded = useCallback(() => {
    Animated.parallel([
      Animated.timing(expandedOpacity,  { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(collapsedOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(sectionHeight,    { toValue: FEATURE_SECTION_HEIGHT, duration: 280, useNativeDriver: false }),
    ]).start(() => setExpanded(false));
  }, [collapsedOpacity, expandedOpacity, sectionHeight]);

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
        handleClose();
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
        handleClose();
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
    <Modal
      visible={nativeVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.root, { transform: [{ translateY: slideAnim }] }]}>
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
            onPress={handleClose}
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
          <Animated.View style={[styles.featureSection, { height: sectionHeight }]}>
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
                  style={styles.expandedList}
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
          </Animated.View>

          {/* Bottom — plan picker + CTA */}
          <View style={styles.bottom}>
            {!available && availabilityMessage ? (
              <Text style={styles.unavailableText}>{availabilityMessage}</Text>
            ) : (
              <View style={styles.planRow}>
                {[monthlyPkg, annualPkg, lifetimePkg].map((pkg) => {
                  if (!pkg) return null;
                  const isAnnual   = pkg.packageType === 'ANNUAL';
                  const isLifetime = pkg.packageType === 'LIFETIME';
                  const isSelected = selectedPkg?.identifier === pkg.identifier;
                  const label      = isAnnual ? 'Yearly' : isLifetime ? 'Lifetime' : 'Monthly';
                  const badge      = isLifetime ? 'Best Value' : (isAnnual && savingsBadge) ? savingsBadge : null;
                  const sub        = isAnnual && pkg.product.pricePerMonthString
                    ? `${stripCurrency(pkg.product.pricePerMonthString)} / mo`
                    : isLifetime ? 'one-time' : null;
                  return (
                    <TouchableOpacity
                      key={pkg.identifier}
                      style={[styles.planCard, isSelected && styles.planCardSelected]}
                      onPress={() => setSelectedPkg(pkg)}
                      activeOpacity={0.85}
                    >
                      {/* Badge row — always rendered for alignment */}
                      <View style={[styles.planBadge, !badge && styles.planBadgeGhost]}>
                        <Text style={styles.planBadgeText} numberOfLines={1}>{badge ?? ' '}</Text>
                      </View>
                      <Text style={[styles.planLabel, isSelected && styles.planLabelSelected]}>
                        {label}
                      </Text>
                      <Text style={[styles.planPrice, isSelected && styles.planPriceSelected]}>
                        {stripCurrency(pkg.product.priceString)}
                      </Text>
                      {/* Sub-label row — always rendered for alignment */}
                      <Text style={[styles.planPerMonth, !sub && styles.planPerMonthGhost]}>
                        {sub ?? ' '}
                      </Text>
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
              {selectedPkg?.packageType === 'LIFETIME'
                ? 'One-time purchase. No recurring charges. Billed through the App Store. By continuing you agree to our Terms of Service and Privacy Policy.'
                : 'Cancel anytime. Billed through the App Store. By continuing you agree to our Terms of Service and Privacy Policy.'}
            </Text>
          </View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: '#030507' },
  safeArea: { flex: 1, paddingTop: spacing.xl*2 },

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

  featureSection: { overflow: 'hidden' },

  rowsWrap: {
    flex: 1,
    gap: ROW_GAP,
    justifyContent: 'center',
  },

  chipRowOuter: {
    height: CHIP_ROW_HEIGHT,
    overflow: 'hidden',
  },
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

  expandedList: { flex: 1 },
  expandedPage: {
    width: SCREEN_WIDTH,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  expandedCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 20,
    padding: spacing.lg,
    gap: 10,
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
    paddingBottom: spacing.md,
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
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginBottom: 2,
  },
  planBadgeGhost:    { opacity: 0 },
  planBadgeText:     { fontSize: 9, fontFamily: fonts.semiBold, color: COLORS.accent, letterSpacing: 0 },
  planLabel:         { fontSize: 13, fontFamily: fonts.semiBold, color: COLORS.textMuted },
  planLabelSelected: { color: COLORS.text },
  planPrice:         { fontSize: 20, fontFamily: fonts.bold,     color: COLORS.textMuted },
  planPriceSelected: { color: COLORS.text },
  planPerMonth:      { fontSize: 11, fontFamily: fonts.regular,  color: COLORS.textMuted, marginTop: 1 },
  planPerMonthGhost: { opacity: 0 },

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
