import React, { createContext, useContext, useState, useCallback } from 'react';

export type HistoryView = 'history' | 'dashboard';

interface HistoryViewContextType {
  view: HistoryView;
  setView: (view: HistoryView) => void;
  toggle: () => void;
}

const HistoryViewContext = createContext<HistoryViewContextType>({
  view: 'history',
  setView: () => {},
  toggle: () => {},
});

export function HistoryViewProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<HistoryView>('history');

  const toggle = useCallback(() => {
    setView((v) => (v === 'history' ? 'dashboard' : 'history'));
  }, []);

  return (
    <HistoryViewContext.Provider value={{ view, setView, toggle }}>
      {children}
    </HistoryViewContext.Provider>
  );
}

export function useHistoryView() {
  return useContext(HistoryViewContext);
}
