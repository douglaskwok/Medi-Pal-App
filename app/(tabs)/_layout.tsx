import { Tabs } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { Theme } from '../../constants/Theme';
import React, { useEffect, useRef } from 'react';

export function CustomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [tabWidth, setTabWidth] = React.useState(0);

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

  const activeIndex = tabs.findIndex((tab) => pathname === tab.route);

  useEffect(() => {
    if (activeIndex >= 0 && tabWidth > 0) {
      slideAnim.setValue(activeIndex);
      Animated.spring(slideAnim, {
        toValue: activeIndex,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [activeIndex, tabWidth, pathname]);

  return (
    <View style={styles.container}>
      <View 
        style={styles.tabBar}
        onLayout={(e) => {
          const containerWidth = e.nativeEvent.layout.width;
          const tabWidth = (containerWidth - 6) / tabs.length;
          setTabWidth(tabWidth);
        }}
      >
        {tabs.map((tab, index) => {
          const isActive = pathname === tab.route;
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
                color={isActive ? Theme.colors.primary : Theme.colors.textSecondary}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
        {tabWidth > 0 && (
          <Animated.View
            style={[
              styles.slider,
              {
                width: tabWidth,
                transform: [
                    {
                      translateX: slideAnim.interpolate({
                        inputRange: tabs.map((_, i) => i),
                        outputRange: tabs.map((_, i) => i * tabWidth + 3),
                      }),
                    },
                ],
              },
            ]}
          />
        )}
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
    position: 'relative',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.xs,
    zIndex: 2,
  },
  slider: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 3,
    backgroundColor: Theme.colors.primary,
    borderRadius: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.textSecondary,
  },
  tabLabelActive: {
    color: Theme.colors.primary,
    fontFamily: Theme.fonts.semibold,
  },
});
