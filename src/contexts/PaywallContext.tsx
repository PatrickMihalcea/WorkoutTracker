import { createContext, useCallback, useContext, useState } from 'react';
import type { PremiumFeatureKey } from '../models/subscription';
import { PaywallModal } from '../components/paywall/PaywallModal';

interface PaywallContextValue {
  showPaywall: (feature?: PremiumFeatureKey) => void;
}

const PaywallContext = createContext<PaywallContextValue>({
  showPaywall: () => {},
});

export function PaywallProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [feature, setFeature] = useState<PremiumFeatureKey | undefined>();

  const showPaywall = useCallback((feat?: PremiumFeatureKey) => {
    setFeature(feat);
    setVisible(true);
  }, []);

  const hidePaywall = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <PaywallContext.Provider value={{ showPaywall }}>
      {children}
      <PaywallModal visible={visible} onClose={hidePaywall} feature={feature} />
    </PaywallContext.Provider>
  );
}

export function usePaywall(): PaywallContextValue {
  return useContext(PaywallContext);
}
