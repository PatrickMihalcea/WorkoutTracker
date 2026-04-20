import React, { createContext, useContext, useState, useCallback } from 'react';
import { dashboardService } from '../../services';
import type { DashboardData, Granularity } from '../../services';
import type { WeightUnit, HeightUnit } from '../../models';
import type { GranularityMode } from '../charts';

export type { GranularityMode };
export type HistoryChartMode = 'abs' | 'rel';

function granularityModeToBackend(mode: GranularityMode): Granularity {
  if (mode === 'W' || mode === 'M') return 'day';
  if (mode === '6M' || mode === '3M') return 'week';
  return 'month';
}

interface HistoryViewContextType {
  chartMode: HistoryChartMode;
  setChartMode: (mode: HistoryChartMode) => void;
  dashboardData: DashboardData | null;
  dashboardLoading: boolean;
  weeks: number;
  granularity: GranularityMode;
  setWeeks: (w: number) => void;
  setGranularity: (g: GranularityMode) => void;
  loadDashboard: (userId: string, w: number, gMode: GranularityMode, cMode: HistoryChartMode, wUnit: WeightUnit, hUnit: HeightUnit) => Promise<void>;
}

const HistoryViewContext = createContext<HistoryViewContextType>({
  chartMode: 'rel',
  setChartMode: () => {},
  dashboardData: null,
  dashboardLoading: false,
  weeks: 12,
  granularity: 'W',
  setWeeks: () => {},
  setGranularity: () => {},
  loadDashboard: async (_u, _w, _g, _c, _wu, _hu) => {},
});

export function HistoryViewProvider({ children }: { children: React.ReactNode }) {
  const [chartMode, setChartMode] = useState<HistoryChartMode>('rel');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [weeks, setWeeks] = useState(12);
  const [granularity, setGranularity] = useState<GranularityMode>('W');

  const loadDashboard = useCallback(async (
    userId: string,
    w: number,
    gMode: GranularityMode,
    cMode: HistoryChartMode,
    wUnit: WeightUnit,
    hUnit: HeightUnit,
  ) => {
    if (!userId) return;
    setDashboardLoading(true);
    try {
      let data: DashboardData;
      if (cMode === 'rel') {
        data = await dashboardService.getDashboardDataRaw(userId, w, wUnit, hUnit);
      } else {
        const g = granularityModeToBackend(gMode);
        data = await dashboardService.getDashboardData(userId, w, g, wUnit, hUnit);
      }
      setDashboardData(data);
    } catch {
      // Handle quietly
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  return (
    <HistoryViewContext.Provider value={{
      chartMode, setChartMode,
      dashboardData, dashboardLoading,
      weeks, setWeeks,
      granularity, setGranularity,
      loadDashboard,
    }}>
      {children}
    </HistoryViewContext.Provider>
  );
}

export function useHistoryView() {
  return useContext(HistoryViewContext);
}
