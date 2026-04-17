import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { dashboardService } from '../../../src/services';
import type { DashboardData, Granularity } from '../../../src/services';
import { Dashboard, GranularityMode, ChartMode } from '../../../src/components/history/Dashboard';
import { useHistoryView } from '../../../src/components/history/HistoryViewContext';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useProfileStore } from '../../../src/stores/profile.store';
import { useTheme } from '../../../src/contexts/ThemeContext';
import type { ThemeColors } from '../../../src/constants/themes';

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});

function granularityModeToBackend(mode: GranularityMode): Granularity {
  if (mode === 'W' || mode === 'M') return 'day';
  if (mode === '6M' || mode === '3M') return 'week';
  return 'month';
}

export default function HistoryScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { chartMode, setChartMode } = useHistoryView();
  const user = useAuthStore((s) => s.user);
  const { profile } = useProfileStore();
  const wUnit = profile?.weight_unit ?? 'kg';
  const hUnit = profile?.height_unit ?? 'cm';

  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [weeks, setWeeks] = useState(12);
  const [granularity, setGranularity] = useState<GranularityMode>('W');

  const userId = user?.id ?? '';

  const loadDashboard = useCallback(async (w: number, gMode: GranularityMode, cMode: ChartMode) => {
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
  }, [userId, wUnit, hUnit]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard(weeks, granularity, chartMode);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [weeks, granularity, loadDashboard, chartMode]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadDashboard(weeks, granularity, chartMode);
    } finally {
      setRefreshing(false);
    }
  }, [weeks, granularity, chartMode, loadDashboard]);

  const handleChangeWeeks = useCallback((w: number) => {
    setWeeks(w);
    loadDashboard(w, granularity, chartMode);
  }, [granularity, chartMode, loadDashboard]);

  const handleChangeGranularity = useCallback((mode: GranularityMode) => {
    setGranularity(mode);
  }, []);

  const handleChangeChartMode = useCallback((mode: ChartMode) => {
    setChartMode(mode);
  }, [setChartMode]);

  const prevGranRef = useRef(granularity);
  const prevChartModeRef = useRef(chartMode);

  useEffect(() => {
    if (prevGranRef.current !== granularity) {
      prevGranRef.current = granularity;
      loadDashboard(weeks, granularity, chartMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [granularity]);

  useEffect(() => {
    if (prevChartModeRef.current !== chartMode) {
      prevChartModeRef.current = chartMode;
      loadDashboard(weeks, granularity, chartMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartMode]);

  if (dashboardLoading && !dashboardData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.textSecondary} />
      </View>
    );
  }

  if (dashboardData) {
    return (
      <Dashboard
        data={dashboardData}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onChangeWeeks={handleChangeWeeks}
        onChangeGranularityMode={handleChangeGranularity}
        chartMode={chartMode}
        onChangeChartMode={handleChangeChartMode}
      />
    );
  }

  return null;
}
