import React, { createContext, useContext, useState } from 'react';

export type HistoryChartMode = 'abs' | 'rel';

interface HistoryViewContextType {
  chartMode: HistoryChartMode;
  setChartMode: (mode: HistoryChartMode) => void;
}

const HistoryViewContext = createContext<HistoryViewContextType>({
  chartMode: 'rel',
  setChartMode: () => {},
});

export function HistoryViewProvider({ children }: { children: React.ReactNode }) {
  const [chartMode, setChartMode] = useState<HistoryChartMode>('rel');

  return (
    <HistoryViewContext.Provider value={{ chartMode, setChartMode }}>
      {children}
    </HistoryViewContext.Provider>
  );
}

export function useHistoryView() {
  return useContext(HistoryViewContext);
}
