import { Tabs } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { Theme } from '../../constants/Theme';
import React from 'react';

export function CustomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const tabs = [
    {
      name: 'home',
      label: 'Home',
      icon: 'home',
      route: '/(tabs)/home',
    },
    {
      name: 'resources',
      label: 'Resources',
      icon: 'location',
      route: '/(tabs)/resources',
    },
    {
      name: 'chat',
      label: 'Chat',
      icon: 'chatbubble-ellipses',
      route: '/(tabs)/chat',
    },
    {
      name: 'checklist',
      label: 'Checklist',
      icon: 'checkmark-circle',
      route: '/(tabs)/checklist',
    },
    {
      name: 'profile',
      label: 'Profile',
      icon: 'person',
      route: '/(tabs)/profile',
    },
  ];

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom }]}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.route;
        return (
          <TouchableOpacity
            key={tab.name}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => router.push(tab.route as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
              <Ionicons
                name={tab.icon as any}
                size={22}
                color={isActive ? Theme.colors.primary : Theme.colors.textSecondary}
              />
            </View>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="resources" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="checklist" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.backgroundLight,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderLight,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.xs,
    ...Theme.shadows.lg,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
  },
  tabActive: {
    backgroundColor: Theme.colors.primary + '15',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.xs,
    backgroundColor: Theme.colors.background,
  },
  iconContainerActive: {
    backgroundColor: Theme.colors.primary,
    ...Theme.shadows.md,
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  tabLabelActive: {
    color: Theme.colors.primary,
    fontFamily: Theme.fonts.semibold,
  },
});

