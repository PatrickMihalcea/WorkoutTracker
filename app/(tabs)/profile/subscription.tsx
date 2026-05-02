import { useRouter, useLocalSearchParams } from 'expo-router';
import { isPremiumFeatureKey } from '../../../src/models/subscription';
import { PaywallModal } from '../../../src/components/paywall/PaywallModal';

export default function SubscriptionScreen() {
  const router  = useRouter();
  const params  = useLocalSearchParams<{ feature?: string }>();
  const feature = isPremiumFeatureKey(params.feature) ? params.feature : undefined;

  return (
    <PaywallModal
      visible
      onClose={() => router.back()}
      feature={feature}
    />
  );
}
