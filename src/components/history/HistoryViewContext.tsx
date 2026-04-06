import React, { createContext, useContext, useState } from 'react';

export type HistoryView = 'history' | 'dashboard';
export type HistoryChartMode = 'abs' | 'rel';

interface HistoryViewContextType {
  view: HistoryView;
  setView: (view: HistoryView) => void;
  chartMode: HistoryChartMode;
  setChartMode: (mode: HistoryChartMode) => void;
}

const HistoryViewContext = createContext<HistoryViewContextType>({
  view: 'dashboard',
  setView: () => {},
  chartMode: 'rel',
  setChartMode: () => {},
});

export function HistoryViewProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<HistoryView>('dashboard');
  const [chartMode, setChartMode] = useState<HistoryChartMode>('rel');

  return (
    <HistoryViewContext.Provider value={{ view, setView, chartMode, setChartMode }}>
      {children}
    </HistoryViewContext.Provider>
  );
}

export function useHistoryView() {
  return useContext(HistoryViewContext);
}
