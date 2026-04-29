import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { useWorkoutStore } from '../../stores/workout.store';

interface WorkoutOverlayContextType {
  expanded: boolean;
  chromeHidden: boolean;
  expand: () => void;
  minimize: () => void;
  setChromeHidden: (hidden: boolean) => void;
  setWorkoutRouteOpen: (open: boolean) => void;
  notifyWorkoutCompleted: (sessionId: string) => void;
}

const WorkoutOverlayContext = createContext<WorkoutOverlayContextType>({
  expanded: false,
  chromeHidden: false,
  expand: () => {},
  minimize: () => {},
  setChromeHidden: () => {},
  setWorkoutRouteOpen: () => {},
  notifyWorkoutCompleted: () => {},
});

export function WorkoutOverlayProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useWorkoutStore((s) => s.session);
  const [workoutRouteOpen, setWorkoutRouteOpen] = useState(false);
  const [chromeHidden, setChromeHidden] = useState(false);
  const pendingCompletedSessionId = useRef<string | null>(null);
  const isWorkoutRoute = pathname === '/workout';
  const expanded = workoutRouteOpen || isWorkoutRoute;

  useEffect(() => {
    if (!session?.id) {
      setWorkoutRouteOpen(false);
    }
  }, [session?.id]);

  // Once the workout modal is dismissed, navigate to the completed session detail.
  useEffect(() => {
    if (!pendingCompletedSessionId.current) return;
    if (isWorkoutRoute) return;
    const sessionId = pendingCompletedSessionId.current;
    pendingCompletedSessionId.current = null;
    router.push(`/(tabs)/profile/${sessionId}?justCompleted=1`);
  }, [isWorkoutRoute, router]);

  const expand = useCallback(() => {
    const activeSession = useWorkoutStore.getState().session;
    if (!activeSession?.id) return;
    setWorkoutRouteOpen(true);
    if (!isWorkoutRoute) {
      router.push('/workout');
    }
  }, [isWorkoutRoute, router]);

  const minimize = useCallback(() => {
    setWorkoutRouteOpen(false);
    if (isWorkoutRoute) {
      router.back();
    }
  }, [isWorkoutRoute, router]);

  const notifyWorkoutCompleted = useCallback((sessionId: string) => {
    pendingCompletedSessionId.current = sessionId;
    minimize();
  }, [minimize]);

  const value = useMemo(
    () => ({
      expanded,
      chromeHidden,
      expand,
      minimize,
      setChromeHidden,
      setWorkoutRouteOpen,
      notifyWorkoutCompleted,
    }),
    [expanded, chromeHidden, expand, minimize, setChromeHidden, setWorkoutRouteOpen, notifyWorkoutCompleted],
  );

  return (
    <WorkoutOverlayContext.Provider value={value}>
      {children}
    </WorkoutOverlayContext.Provider>
  );
}

export function useWorkoutOverlay(): WorkoutOverlayContextType {
  return useContext(WorkoutOverlayContext);
}
