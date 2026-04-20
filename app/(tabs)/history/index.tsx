import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Dashboard } from '../../../src/components/history/Dashboard';
import { useHistoryView } from '../../../src/components/history/HistoryViewContext';
import type { GranularityMode, HistoryChartMode } from '../../../src/components/history/HistoryViewContext';
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

export default function HistoryScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    chartMode, setChartMode,
    dashboardData, dashboardLoading,
    weeks, setWeeks,
    granularity, setGranularity,
    loadDashboard,
  } = useHistoryView();
  const user = useAuthStore((s) => s.user);
  const { profile } = useProfileStore();
  const wUnit = profile?.weight_unit ?? 'kg';
  const hUnit = profile?.height_unit ?? 'cm';
  const [refreshing, setRefreshing] = useState(false);
  const userId = user?.id ?? '';

  useFocusEffect(
    useCallback(() => {
      void loadDashboard(userId, weeks, granularity, chartMode, wUnit, hUnit);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, weeks, granularity, chartMode, wUnit, hUnit]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadDashboard(userId, weeks, granularity, chartMode, wUnit, hUnit);
    } finally {
      setRefreshing(false);
    }
  }, [userId, weeks, granularity, chartMode, wUnit, hUnit, loadDashboard]);

  const handleChangeWeeks = useCallback((w: number) => {
    setWeeks(w);
    void loadDashboard(userId, w, granularity, chartMode, wUnit, hUnit);
  }, [userId, granularity, chartMode, wUnit, hUnit, loadDashboard, setWeeks]);

  const handleChangeGranularity = useCallback((mode: GranularityMode) => {
    setGranularity(mode);
  }, [setGranularity]);

  const handleChangeChartMode = useCallback((mode: HistoryChartMode) => {
    setChartMode(mode);
  }, [setChartMode]);

  const prevGranRef = useRef(granularity);
  const prevChartModeRef = useRef(chartMode);

  useEffect(() => {
    if (prevGranRef.current !== granularity) {
      prevGranRef.current = granularity;
      void loadDashboard(userId, weeks, granularity, chartMode, wUnit, hUnit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [granularity]);

  useEffect(() => {
    if (prevChartModeRef.current !== chartMode) {
      prevChartModeRef.current = chartMode;
      void loadDashboard(userId, weeks, granularity, chartMode, wUnit, hUnit);
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
