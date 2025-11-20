import { Tabs } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { Theme } from '../../constants/Theme';
import React from 'react';

export function CustomTabBar() {
  const router = useRouter();
  const pathname = usePathname();

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
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = pathname === tab.route || pathname === `/${tab.name}` || pathname.includes(`/${tab.name}`);
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tab}
              onPress={() => router.push(tab.route as any)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab.icon as any}
                size={24}
                color={isActive ? Theme.colors.primaryDark : Theme.colors.textSecondary}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
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
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.backgroundLight,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderLight,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: 3,
    ...Theme.shadows.lg,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.xs,
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.textSecondary,
  },
  tabLabelActive: {
    color: Theme.colors.primaryDark,
    fontFamily: Theme.fonts.semibold,
  },
});
