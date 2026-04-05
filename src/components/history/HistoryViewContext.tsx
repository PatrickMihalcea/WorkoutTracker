import React, { createContext, useContext, useState } from 'react';

export type HistoryView = 'history' | 'dashboard';

interface HistoryViewContextType {
  view: HistoryView;
  setView: (view: HistoryView) => void;
}

const HistoryViewContext = createContext<HistoryViewContextType>({
  view: 'history',
  setView: () => {},
});

export function HistoryViewProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<HistoryView>('history');

  return (
    <HistoryViewContext.Provider value={{ view, setView }}>
      {children}
    </HistoryViewContext.Provider>
  );
}

export function useHistoryView() {
  return useContext(HistoryViewContext);
}
