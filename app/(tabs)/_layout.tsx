import { Tabs } from 'expo-router';
import { Text, Image, StyleSheet } from 'react-native';
import { colors, fonts } from '../../src/constants';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  if (name === 'History') {
    return (
      <Image
        source={require('../../assets/icons/history.png')}
        style={[styles.tabImage, { tintColor: focused ? colors.text : colors.textMuted }]}
      />
    );
  }
  const icons: Record<string, string> = {
    Home: '●',
    Routines: '≡',
    Profile: '○',
  };
  return (
    <Text style={[styles.icon, focused && styles.iconFocused]}>
      {icons[name] ?? '•'}
    </Text>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fonts.bold },
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontFamily: fonts.regular, fontSize: 11 },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ focused }) => <TabIcon name="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="routines"
        options={{
          title: 'Routines',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon name="Routines" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon name="History" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon name="Profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 18,
    color: colors.textMuted,
  },
  iconFocused: {
    color: colors.text,
  },
  tabImage: {
    width: 20,
    height: 20,
  },
});
