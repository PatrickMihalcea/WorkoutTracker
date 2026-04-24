import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useWorkoutStore } from '../../stores/workout.store';

let lastKnownSessionId: string | null = null;

interface WorkoutOverlayContextType {
  expanded: boolean;
  expand: () => void;
  minimize: () => void;
  suppressNextAutoExpand: () => void;
}

const WorkoutOverlayContext = createContext<WorkoutOverlayContextType>({
  expanded: false,
  expand: () => {},
  minimize: () => {},
  suppressNextAutoExpand: () => {},
});

export function WorkoutOverlayProvider({ children }: { children: React.ReactNode }) {
  const session = useWorkoutStore((s) => s.session);
  const [expanded, setExpanded] = useState(false);
  const prevSessionRef = useRef<string | null>(lastKnownSessionId);
  const suppressRef = useRef(false);

  useEffect(() => {
    const currentId = session?.id ?? null;
    if (currentId && currentId !== prevSessionRef.current) {
      if (suppressRef.current) {
        suppressRef.current = false;
      } else {
        setExpanded(true);
      }
    }
    if (!currentId) {
      setExpanded(false);
    }
    prevSessionRef.current = currentId;
    lastKnownSessionId = currentId;
  }, [session?.id]);

  const expand = useCallback(() => setExpanded(true), []);
  const minimize = useCallback(() => setExpanded(false), []);
  const suppressNextAutoExpand = useCallback(() => { suppressRef.current = true; }, []);

  const value = useMemo(
    () => ({ expanded, expand, minimize, suppressNextAutoExpand }),
    [expanded, expand, minimize, suppressNextAutoExpand],
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
