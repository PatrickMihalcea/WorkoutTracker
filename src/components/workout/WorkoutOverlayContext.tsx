import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { useWorkoutStore } from '../../stores/workout.store';

interface WorkoutOverlayContextType {
  expanded: boolean;
  chromeHidden: boolean;
  expand: () => void;
  minimize: () => void;
  setChromeHidden: (hidden: boolean) => void;
  setWorkoutRouteOpen: (open: boolean) => void;
}

const WorkoutOverlayContext = createContext<WorkoutOverlayContextType>({
  expanded: false,
  chromeHidden: false,
  expand: () => {},
  minimize: () => {},
  setChromeHidden: () => {},
  setWorkoutRouteOpen: () => {},
});

export function WorkoutOverlayProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useWorkoutStore((s) => s.session);
  const [workoutRouteOpen, setWorkoutRouteOpen] = useState(false);
  const [chromeHidden, setChromeHidden] = useState(false);
  const isWorkoutRoute = pathname === '/workout';
  const expanded = workoutRouteOpen || isWorkoutRoute;

  useEffect(() => {
    if (!session?.id) {
      setWorkoutRouteOpen(false);
    }
  }, [session?.id]);

  const expand = useCallback(() => {
    if (!session?.id) return;
    setWorkoutRouteOpen(true);
    if (!isWorkoutRoute) {
      router.push('/workout');
    }
  }, [isWorkoutRoute, router, session?.id]);

  const minimize = useCallback(() => {
    setWorkoutRouteOpen(false);
    if (isWorkoutRoute) {
      router.back();
    }
  }, [isWorkoutRoute, router]);

  const value = useMemo(
    () => ({
      expanded,
      chromeHidden,
      expand,
      minimize,
      setChromeHidden,
      setWorkoutRouteOpen,
    }),
    [expanded, chromeHidden, expand, minimize, setChromeHidden, setWorkoutRouteOpen],
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
