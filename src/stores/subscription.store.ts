import { create } from 'zustand';
import type { CustomerInfo, CustomerInfoUpdateListener, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import type { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { subscriptionService } from '../services/subscription.service';
import type { UserSubscriptionState } from '../models/subscription';

interface SubscriptionState {
  currentUserId: string | null;
  initialized: boolean;
  loading: boolean;
  purchaseLoading: boolean;
  restoreLoading: boolean;
  available: boolean;
  availabilityMessage: string | null;
  error: string | null;
  offering: PurchasesOffering | null;
  customerInfo: CustomerInfo | null;
  cachedState: UserSubscriptionState | null;
  isPremium: boolean;
  managementUrl: string | null;

  initialize: (userId: string) => Promise<void>;
  refresh: () => Promise<void>;
  purchase: (aPackage: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
  presentPaywall: () => Promise<PAYWALL_RESULT>;
  presentPaywallIfNeeded: () => Promise<PAYWALL_RESULT>;
  presentCustomerCenter: () => Promise<void>;
  clear: () => Promise<void>;
}

let customerInfoListener: CustomerInfoUpdateListener | null = null;

const baseState = {
  currentUserId: null,
  initialized: false,
  loading: false,
  purchaseLoading: false,
  restoreLoading: false,
  available: false,
  availabilityMessage: null,
  error: null,
  offering: null,
  customerInfo: null,
  cachedState: null,
  isPremium: false,
  managementUrl: null,
};

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  ...baseState,

  initialize: async (userId) => {
    set({
      currentUserId: userId,
      loading: true,
      initialized: false,
      error: null,
    });

    const cachedState = await subscriptionService.getCachedSubscriptionState(userId).catch(() => null);
    const cachedPremium = cachedState?.is_active ?? false;

    try {
      const init = await subscriptionService.initializeForUser(userId);
      if (!init.available) {
        set({
          currentUserId: userId,
          initialized: true,
          loading: false,
          available: false,
          availabilityMessage: init.message,
          cachedState,
          isPremium: cachedPremium,
          managementUrl: cachedState?.management_url ?? null,
        });
        return;
      }

      const [offering, customerInfo] = await Promise.all([
        subscriptionService.getCurrentOffering(),
        subscriptionService.getCustomerInfo(),
      ]);

      const syncedState = await subscriptionService
        .syncSubscriptionState({ userId, customerInfo, offering })
        .catch(() => cachedState);

      set({
        currentUserId: userId,
        initialized: true,
        loading: false,
        available: true,
        availabilityMessage: null,
        error: null,
        offering,
        customerInfo,
        cachedState: syncedState,
        isPremium: subscriptionService.hasPremiumAccess(customerInfo, syncedState),
        managementUrl: customerInfo.managementURL ?? syncedState?.management_url ?? null,
      });

      if (customerInfoListener) {
        subscriptionService.removeCustomerInfoUpdateListener(customerInfoListener);
      }

      customerInfoListener = (nextCustomerInfo) => {
        const currentUserId = get().currentUserId;
        if (!currentUserId) return;

        void (async () => {
          const latestOffering = get().offering;
          const latestSyncedState = await subscriptionService
            .syncSubscriptionState({
              userId: currentUserId,
              customerInfo: nextCustomerInfo,
              offering: latestOffering,
            })
            .catch(() => get().cachedState);

          set({
            customerInfo: nextCustomerInfo,
            cachedState: latestSyncedState,
            isPremium: subscriptionService.hasPremiumAccess(nextCustomerInfo, latestSyncedState),
            managementUrl: nextCustomerInfo.managementURL ?? latestSyncedState?.management_url ?? null,
          });
        })();
      };

      subscriptionService.addCustomerInfoUpdateListener(customerInfoListener);
    } catch (error) {
      set({
        currentUserId: userId,
        initialized: true,
        loading: false,
        available: false,
        error: error instanceof Error ? error.message : 'Could not load subscription status.',
        cachedState,
        isPremium: cachedPremium,
        managementUrl: cachedState?.management_url ?? null,
      });
    }
  },

  refresh: async () => {
    const userId = get().currentUserId;
    if (!userId) return;
    await get().initialize(userId);
  },

  purchase: async (aPackage) => {
    const userId = get().currentUserId;
    if (!userId) {
      throw new Error('You must be signed in to purchase premium.');
    }

    set({ purchaseLoading: true, error: null });
    try {
      const customerInfo = await subscriptionService.purchasePackage(aPackage);
      const syncedState = await subscriptionService
        .syncSubscriptionState({
          userId,
          customerInfo,
          offering: get().offering,
        })
        .catch(() => get().cachedState);

      const isPremium = subscriptionService.hasPremiumAccess(customerInfo, syncedState);
      set({
        customerInfo,
        cachedState: syncedState,
        isPremium,
        managementUrl: customerInfo.managementURL ?? syncedState?.management_url ?? null,
      });
      return isPremium;
    } finally {
      set({ purchaseLoading: false });
    }
  },

  restore: async () => {
    const userId = get().currentUserId;
    if (!userId) {
      throw new Error('You must be signed in to restore purchases.');
    }

    set({ restoreLoading: true, error: null });
    try {
      const customerInfo = await subscriptionService.restorePurchases();
      const syncedState = await subscriptionService
        .syncSubscriptionState({
          userId,
          customerInfo,
          offering: get().offering,
        })
        .catch(() => get().cachedState);

      const isPremium = subscriptionService.hasPremiumAccess(customerInfo, syncedState);
      set({
        customerInfo,
        cachedState: syncedState,
        isPremium,
        managementUrl: customerInfo.managementURL ?? syncedState?.management_url ?? null,
      });
      return isPremium;
    } finally {
      set({ restoreLoading: false });
    }
  },

  presentPaywall: async () => {
    const result = await subscriptionService.presentPaywall({ offering: get().offering });
    await get().refresh();
    return result;
  },

  presentPaywallIfNeeded: async () => {
    const result = await subscriptionService.presentPaywallIfNeeded({
      offering: get().offering,
    });
    await get().refresh();
    return result;
  },

  presentCustomerCenter: async () => {
    await subscriptionService.presentCustomerCenter({
      onRestoreCompleted: () => {
        void get().refresh();
      },
      onPromotionalOfferSucceeded: () => {
        void get().refresh();
      },
    });
    await get().refresh();
  },

  clear: async () => {
    if (customerInfoListener) {
      subscriptionService.removeCustomerInfoUpdateListener(customerInfoListener);
      customerInfoListener = null;
    }
    await subscriptionService.clearUser();
    set({ ...baseState, initialized: true });
  },
}));
