import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface ChartInteractionContextType {
  chartActive: boolean;
  scrollEnabled: boolean;
  pointerActiveRef: React.MutableRefObject<boolean>;
  onChartTouchStart: () => void;
  onChartTouchEnd: () => void;
}

const ChartInteractionContext = createContext<ChartInteractionContextType>({
  chartActive: false,
  scrollEnabled: true,
  pointerActiveRef: { current: false },
  onChartTouchStart: () => {},
  onChartTouchEnd: () => {},
});

export function ChartInteractionProvider({ children }: { children: React.ReactNode }) {
  const [chartActive, setChartActive] = useState(false);
  const pointerActiveRef = useRef(false);

  const onChartTouchStart = useCallback(() => {
    pointerActiveRef.current = true;
    setChartActive(true);
  }, []);

  const onChartTouchEnd = useCallback(() => {
    pointerActiveRef.current = false;
    setChartActive(false);
  }, []);

  return (
    <ChartInteractionContext.Provider
      value={{
        chartActive,
        scrollEnabled: !chartActive,
        pointerActiveRef,
        onChartTouchStart,
        onChartTouchEnd,
      }}
    >
      {children}
    </ChartInteractionContext.Provider>
  );
}

export function useChartInteraction() {
  return useContext(ChartInteractionContext);
}
