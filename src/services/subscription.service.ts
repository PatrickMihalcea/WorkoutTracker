import Constants from 'expo-constants';
import { Linking, Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  CustomerInfoUpdateListener,
  LOG_LEVEL,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';
import RevenueCatUI, { CustomerCenterCallbacks, PAYWALL_RESULT } from 'react-native-purchases-ui';
import {
  PREMIUM_ENTITLEMENT_ID,
  UserSubscriptionState,
  UserSubscriptionStateInsert,
} from '../models/subscription';
import { supabase } from './supabase';

interface SubscriptionRuntimeConfig {
  apiKey: string | null;
  entitlementId: string;
  offeringId: string | null;
  useTestStore: boolean;
  testApiKey: string | null;
}

interface SubscriptionInitResult {
  available: boolean;
  message: string | null;
}

let purchasesConfigured = false;
let activeAppUserId: string | null = null;

function getRuntimeConfig(): SubscriptionRuntimeConfig {
  const extra = (Constants.expoConfig?.extra ?? {}) as {
    revenueCat?: {
      testApiKey?: string;
      iosApiKey?: string;
      androidApiKey?: string;
      entitlementId?: string;
      offeringId?: string;
      useTestStore?: boolean;
    };
  };
  const rc = extra.revenueCat ?? {};
  const testApiKey = typeof rc.testApiKey === 'string' ? rc.testApiKey.trim() : '';
  const iosApiKey = typeof rc.iosApiKey === 'string' ? rc.iosApiKey.trim() : '';
  const androidApiKey = typeof rc.androidApiKey === 'string' ? rc.androidApiKey.trim() : '';
  const entitlementId = typeof rc.entitlementId === 'string' && rc.entitlementId.trim().length > 0
    ? rc.entitlementId.trim()
    : PREMIUM_ENTITLEMENT_ID;
  const offeringId = typeof rc.offeringId === 'string' && rc.offeringId.trim().length > 0
    ? rc.offeringId.trim()
    : null;
  const useTestStore = rc.useTestStore === true;

  const platformApiKey = Platform.OS === 'ios'
    ? (iosApiKey || null)
    : Platform.OS === 'android'
    ? (androidApiKey || null)
    : null;

  return {
    apiKey: useTestStore
      ? (testApiKey || null)
      : platformApiKey,
    entitlementId,
    offeringId,
    useTestStore,
    testApiKey: testApiKey || null,
  };
}

function buildSubscriptionStateRow(args: {
  userId: string;
  customerInfo: CustomerInfo;
  offering: PurchasesOffering | null;
}): UserSubscriptionStateInsert {
  const { userId, customerInfo, offering } = args;
  const { entitlementId } = getRuntimeConfig();
  const entitlement = customerInfo.entitlements.all[entitlementId] ?? null;
  const nowIso = new Date().toISOString();

  return {
    user_id: userId,
    revenuecat_app_user_id: customerInfo.originalAppUserId,
    entitlement_identifier: entitlement?.identifier ?? entitlementId,
    product_identifier: entitlement?.productIdentifier ?? null,
    offering_identifier: offering?.identifier ?? null,
    store: entitlement?.store ?? null,
    is_active: Boolean(entitlement?.isActive),
    will_renew: Boolean(entitlement?.willRenew),
    period_type: entitlement?.periodType ?? null,
    latest_purchase_at: entitlement?.latestPurchaseDate ?? null,
    expires_at: entitlement?.expirationDate ?? null,
    unsubscribe_detected_at: entitlement?.unsubscribeDetectedAt ?? null,
    billing_issue_detected_at: entitlement?.billingIssueDetectedAt ?? null,
    management_url: customerInfo.managementURL ?? null,
    raw_customer_info: customerInfo as unknown as Record<string, unknown>,
    synced_at: nowIso,
    updated_at: nowIso,
  };
}

async function ensureConfigured(): Promise<SubscriptionInitResult> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return {
      available: false,
      message: 'Subscriptions are only available on iOS and Android builds.',
    };
  }

  const { apiKey } = getRuntimeConfig();
  if (!apiKey) {
    return {
      available: false,
      message: 'RevenueCat keys are not configured for this build yet.',
    };
  }

  if (!purchasesConfigured) {
    if (!Purchases || typeof Purchases.setLogLevel !== 'function') {
      return {
        available: false,
        message: 'RevenueCat native module is not available in this build.',
      };
    }
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.VERBOSE : LOG_LEVEL.INFO);
    const alreadyConfigured = await Purchases.isConfigured().catch(() => false);
    if (!alreadyConfigured) {
      Purchases.configure({ apiKey });
    }
    purchasesConfigured = true;
  }

  return { available: true, message: null };
}

export const subscriptionService = {
  getEntitlementId(): string {
    return getRuntimeConfig().entitlementId;
  },

  async initializeForUser(userId: string): Promise<SubscriptionInitResult> {
    const init = await ensureConfigured();
    if (!init.available) return init;

    if (activeAppUserId !== userId) {
      await Purchases.logIn(userId);
      activeAppUserId = userId;
    }

    return init;
  },

  async clearUser(): Promise<void> {
    if (!purchasesConfigured) {
      activeAppUserId = null;
      return;
    }

    activeAppUserId = null;
    try {
      await Purchases.logOut();
    } catch {
      // Keep sign-out resilient even if the purchases SDK is unavailable.
    }
  },

  async getCurrentOffering(): Promise<PurchasesOffering | null> {
    const { offeringId } = getRuntimeConfig();
    const offerings = await Purchases.getOfferings();
    if (offeringId) {
      return offerings.all[offeringId] ?? offerings.current;
    }
    return offerings.current;
  },

  async getCustomerInfo(): Promise<CustomerInfo> {
    return Purchases.getCustomerInfo();
  },

  async purchasePackage(aPackage: PurchasesPackage): Promise<CustomerInfo> {
    const result = await Purchases.purchasePackage(aPackage);
    return result.customerInfo;
  },

  addCustomerInfoUpdateListener(listener: CustomerInfoUpdateListener): void {
    Purchases.addCustomerInfoUpdateListener(listener);
  },

  removeCustomerInfoUpdateListener(listener: CustomerInfoUpdateListener): void {
    Purchases.removeCustomerInfoUpdateListener(listener);
  },

  async restorePurchases(): Promise<CustomerInfo> {
    return Purchases.restorePurchases();
  },

  async presentPaywall(args?: {
    offering?: PurchasesOffering | null;
  }): Promise<PAYWALL_RESULT> {
    return RevenueCatUI.presentPaywall({
      offering: args?.offering ?? undefined,
      displayCloseButton: true,
    });
  },

  async presentPaywallIfNeeded(args: {
    requiredEntitlementIdentifier?: string;
    offering?: PurchasesOffering | null;
  }): Promise<PAYWALL_RESULT> {
    return RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: args.requiredEntitlementIdentifier ?? getRuntimeConfig().entitlementId,
      offering: args.offering ?? undefined,
      displayCloseButton: true,
    });
  },

  async presentCustomerCenter(callbacks?: CustomerCenterCallbacks): Promise<void> {
    await RevenueCatUI.presentCustomerCenter(callbacks ? { callbacks } : undefined);
  },

  async openManagementUrl(url: string): Promise<void> {
    await Linking.openURL(url);
  },

  async getCachedSubscriptionState(userId: string): Promise<UserSubscriptionState | null> {
    const { data, error } = await supabase
      .from('user_subscription_state')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data as UserSubscriptionState | null;
  },

  async syncSubscriptionState(args: {
    userId: string;
    customerInfo: CustomerInfo;
    offering: PurchasesOffering | null;
  }): Promise<UserSubscriptionState> {
    const row = buildSubscriptionStateRow(args);

    const { data, error } = await supabase
      .from('user_subscription_state')
      .upsert(row)
      .select('*')
      .single();

    if (error) throw error;
    return data as UserSubscriptionState;
  },

  hasPremiumAccess(customerInfo: CustomerInfo | null, cachedState: UserSubscriptionState | null): boolean {
    const { entitlementId } = getRuntimeConfig();
    const entitlement = customerInfo?.entitlements.active[entitlementId];
    if (entitlement?.isActive) return true;
    return cachedState?.is_active ?? false;
  },

  didUnlockPremium(result: PAYWALL_RESULT): boolean {
    return result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED;
  },

  isPurchaseCancelled(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;

    const candidate = error as {
      code?: string;
      userCancelled?: boolean | null;
    };

    return candidate.userCancelled === true || candidate.code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;
  },
};
