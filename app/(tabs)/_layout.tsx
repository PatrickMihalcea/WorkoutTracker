import { useEffect, useRef, useState } from 'react';
import { withLayoutContext, useSegments } from 'expo-router';
import { createMaterialTopTabNavigator, type MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { Text, Image, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../../src/constants';
import { isLightTheme } from '../../src/constants/themes';
import { HistoryViewProvider, useHistoryView } from '../../src/components/history/HistoryViewContext';
import { useProfileStore } from '../../src/stores/profile.store';
import { ChartInteractionProvider, useChartInteraction } from '../../src/components/charts';
import { useWorkoutOverlay } from '../../src/components/workout';
import { useAuthStore } from '../../src/stores/auth.store';
import { useWorkoutStore } from '../../src/stores/workout.store';
import { useSessionStore } from '../../src/stores/session.store';
import { useTheme } from '../../src/contexts/ThemeContext';

const { Navigator } = createMaterialTopTabNavigator();
const SwipeableTabs = withLayoutContext(Navigator);

const TAB_ICONS: Record<string, string> = {
  today: '●',
  routines: '≡',
  profile: '○',
};

const TAB_LABELS: Record<string, string> = {
  today: 'Today',
  routines: 'Routines',
  history: 'Dashboard',
  profile: 'Profile',
};

const TAB_CHROME_EXIT_TRANSLATE_MS = 340;
const TAB_CHROME_EXIT_OPACITY_MS = 260;
const TAB_CHROME_ENTER_TRANSLATE_MS = 260;
const TAB_CHROME_ENTER_OPACITY_MS = 220;

function getFocusedLeafRouteName(route: { state?: unknown; name?: string }): string | null {
  let current: any = route;
  while (current?.state?.routes && Array.isArray(current.state.routes)) {
    const nestedState = current.state;
    const idx = typeof nestedState.index === 'number'
      ? nestedState.index
      : nestedState.routes.length - 1;
    current = nestedState.routes[idx];
  }
  return typeof current?.name === 'string' ? current.name : null;
}

function BottomTabBar({
  state,
  navigation,
  hidden = false,
}: MaterialTopTabBarProps & { hidden?: boolean }) {
  const insets = useSafeAreaInsets();
  const { colors, theme } = useTheme();
  const isLight = isLightTheme(theme);
  const { chromeHidden } = useWorkoutOverlay();
  const slideY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const shouldHide = chromeHidden || hidden;
  const [renderChrome, setRenderChrome] = useState(!shouldHide);

  useEffect(() => {
    if (shouldHide) {
      if (!renderChrome) return;
      Animated.parallel([
        Animated.timing(slideY, {
          toValue: 30,
          duration: TAB_CHROME_EXIT_TRANSLATE_MS,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: TAB_CHROME_EXIT_OPACITY_MS,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setRenderChrome(false);
        }
      });
      return;
    }

    setRenderChrome(true);
    slideY.setValue(22);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(slideY, {
        toValue: 0,
        duration: TAB_CHROME_ENTER_TRANSLATE_MS,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: TAB_CHROME_ENTER_OPACITY_MS,
        useNativeDriver: true,
      }),
    ]).start();
  }, [shouldHide, opacity, renderChrome, slideY]);

  if (!renderChrome) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.tabBar,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 8),
          opacity,
          transform: [{ translateY: slideY }],
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const color = focused ? colors.text : (isLight ? '#acaeb2' : colors.textMuted);

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tab}
            activeOpacity={0.7}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            onLongPress={() => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            }}
          >
            {route.name === 'history' ? (
              <Image
                source={require('../../assets/icons/graph.png')}
                style={[styles.tabImage, { tintColor: color }]}
              />
            ) : (
              <Text style={[styles.tabIcon, { color }]}>
                {TAB_ICONS[route.name] ?? '•'}
              </Text>
            )}
            <Text style={[styles.tabLabel, focused && styles.tabLabelActive, { color }]}>
              {TAB_LABELS[route.name] ?? route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );
}

function TabLayoutInner() {
  const { colors } = useTheme();
  const segments = useSegments();
  const { chartMode, loadDashboard, weeks, granularity } = useHistoryView();
  const { chartActive } = useChartInteraction();
  const { user } = useAuthStore();
  const { profile } = useProfileStore();
  const { session, resumeWorkout } = useWorkoutStore();
  const { fetchSessions } = useSessionStore();
  const isAtTabRoot = segments.length <= 2;
  const currentTab = segments.find((segment) => (
    segment === 'today'
    || segment === 'routines'
    || segment === 'history'
    || segment === 'profile'
  ));
  const hideTabBar = (currentTab === 'routines' && segments.includes('create'))
    || (currentTab === 'profile' && segments.includes('subscription'));
  const isCreateRoutine = currentTab === 'routines' && segments.includes('create');
  const isSubscription = currentTab === 'profile' && segments.includes('subscription');
  const hideTopSafeArea = isCreateRoutine || isSubscription;
  const hasActiveChart = chartActive || (currentTab === 'history' && chartMode === 'abs');

  useEffect(() => {
    if (user && !session) {
      resumeWorkout(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const wUnit = profile?.weight_unit ?? 'kg';
    const hUnit = profile?.height_unit ?? 'cm';
    void loadDashboard(user.id, weeks, granularity, chartMode, wUnit, hUnit);
    void fetchSessions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={hideTopSafeArea ? [] : ['top']}
    >
      <SwipeableTabs
        tabBar={(props) => <BottomTabBar {...props} hidden={hideTabBar} />}
        tabBarPosition="bottom"
        screenOptions={{
          swipeEnabled: isAtTabRoot && !hasActiveChart,
          lazy: true,
          lazyPreloadDistance: 1,
          animationEnabled: true,
          sceneStyle: { backgroundColor: colors.background },
          tabBarStyle: styles.tabBarOverlay,
        }}
      >
      <SwipeableTabs.Screen
        name="today"
        options={{ title: 'Today' }}
      />
      <SwipeableTabs.Screen
        name="routines"
        options={{ title: 'Routines' }}
      />
      <SwipeableTabs.Screen
        name="history"
        options={{ title: 'Dashboard' }}
      />
      <SwipeableTabs.Screen
        name="profile"
        options={{ title: 'Profile' }}
      />
      </SwipeableTabs>
    </SafeAreaView>
  );
}

export default function TabLayout() {
  return (
    <ChartInteractionProvider>
      <HistoryViewProvider>
        <TabLayoutInner />
      </HistoryViewProvider>
    </ChartInteractionProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  tabBarOverlay: {
    position: 'absolute',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabIcon: {
    fontSize: 18,
  },
  tabImage: {
    width: 20,
    height: 20,
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  tabLabelActive: {
    fontFamily: fonts.semiBold,
  },
});
