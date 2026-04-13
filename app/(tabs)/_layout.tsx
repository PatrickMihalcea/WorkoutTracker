import { useEffect } from 'react';
import { withLayoutContext, useSegments } from 'expo-router';
import { createMaterialTopTabNavigator, type MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../src/constants';
import { HistoryViewProvider, useHistoryView } from '../../src/components/history/HistoryViewContext';
import { ChartInteractionProvider, useChartInteraction } from '../../src/components/charts';
import { WorkoutOverlay, WorkoutOverlayProvider, useWorkoutOverlay } from '../../src/components/workout';
import { useAuthStore } from '../../src/stores/auth.store';
import { useWorkoutStore } from '../../src/stores/workout.store';

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

function BottomTabBar({ state, navigation }: MaterialTopTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const color = focused ? colors.text : colors.textMuted;

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
            <Text style={[styles.tabLabel, { color }]}>
              {TAB_LABELS[route.name] ?? route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function TabLayoutInner() {
  const segments = useSegments();
  const { chartMode } = useHistoryView();
  const { chartActive } = useChartInteraction();
  const { user } = useAuthStore();
  const { session, resumeWorkout } = useWorkoutStore();
  const { suppressNextAutoExpand } = useWorkoutOverlay();
  const isAtTabRoot = segments.length <= 2;
  const currentTab = segments.find((segment) => (
    segment === 'today'
    || segment === 'routines'
    || segment === 'history'
    || segment === 'profile'
  ));
  const hasActiveChart = chartActive || (currentTab === 'history' && chartMode === 'abs');

  useEffect(() => {
    if (user && !session) {
      suppressNextAutoExpand();
      resumeWorkout(user.id);
    }
  }, [user?.id]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <SwipeableTabs
        tabBar={(props) => <BottomTabBar {...props} />}
        tabBarPosition="bottom"
        screenOptions={{
          swipeEnabled: isAtTabRoot && !hasActiveChart,
          lazy: true,
          lazyPreloadDistance: 1,
          animationEnabled: true,
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
      <WorkoutOverlay />
    </SafeAreaView>
  );
}

export default function TabLayout() {
  return (
    <WorkoutOverlayProvider>
      <ChartInteractionProvider>
        <HistoryViewProvider>
          <TabLayoutInner />
        </HistoryViewProvider>
      </ChartInteractionProvider>
    </WorkoutOverlayProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
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
});
