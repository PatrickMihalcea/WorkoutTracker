export const PREMIUM_ENTITLEMENT_ID = 'Setora Pro';

export type PremiumFeatureKey =
  | 'ai_routine_generation'
  | 'advanced_analytics'
  | 'unlimited_routines'
  | 'custom_exercises';

export interface UserSubscriptionState {
  user_id: string;
  revenuecat_app_user_id: string | null;
  entitlement_identifier: string | null;
  product_identifier: string | null;
  offering_identifier: string | null;
  store: string | null;
  is_active: boolean;
  will_renew: boolean;
  period_type: string | null;
  latest_purchase_at: string | null;
  expires_at: string | null;
  unsubscribe_detected_at: string | null;
  billing_issue_detected_at: string | null;
  management_url: string | null;
  raw_customer_info: Record<string, unknown> | null;
  synced_at: string;
  created_at: string;
  updated_at: string;
}

export type UserSubscriptionStateInsert = Omit<UserSubscriptionState, 'created_at'>;

export const PREMIUM_FEATURE_COPY: Record<
  PremiumFeatureKey,
  {
    title: string;
    shortTitle: string;
    description: string;
  }
> = {
  ai_routine_generation: {
    title: 'AI Routine Builder',
    shortTitle: 'AI routines',
    description: 'Generate personalized training plans tailored to your goals, experience, and equipment.',
  },
  advanced_analytics: {
    title: 'Advanced Analytics',
    shortTitle: 'Advanced analytics',
    description: 'Unlock deeper dashboard views, longer history windows, and premium progression analysis.',
  },
  unlimited_routines: {
    title: 'Unlimited Routines',
    shortTitle: 'Unlimited routines',
    description: 'Create, duplicate, and access more than two routines with Setora Pro.',
  },
  custom_exercises: {
    title: 'More Custom Exercises',
    shortTitle: 'Custom exercises',
    description: 'Create more than four custom exercises and keep expanding your personal exercise library with Setora Pro.',
  },
};

export function isPremiumFeatureKey(value: unknown): value is PremiumFeatureKey {
  return value === 'ai_routine_generation'
    || value === 'advanced_analytics'
    || value === 'unlimited_routines'
    || value === 'custom_exercises';
}
