import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/auth.store';
import { useProfileStore } from '../src/stores/profile.store';

export default function Index() {
  const { session } = useAuthStore();
  const { profile, loading: profileLoading, resolved: profileResolved } = useProfileStore();

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (profileLoading || !profileResolved) {
    return null;
  }

  if (!profile || !profile.onboarding_complete) {
    return <Redirect href="/(onboarding)/display-name" />;
  }

  return <Redirect href="/(tabs)/today" />;
}
