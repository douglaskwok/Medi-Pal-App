import { Tabs } from "expo-router";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { Theme } from "../../constants/Theme";
import React from "react";

// Add translations object
const tabTranslations = {
  en: {
    home: "Home",
    resources: "Resources",
    chat: "Chat",
    checklist: "Checklist",
    profile: "Settings",
  },
  es: {
    home: "Inicio",
    resources: "Recursos",
    chat: "Chat",
    checklist: "Lista",
    profile: "Ajustes",
  },
};

interface CustomTabBarProps {
  language?: string;
  opacity?: number; // 0 (invisible) to 1 (fully visible)
}

export function CustomTabBar({
  language = "en",
  opacity = 1,
}: CustomTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Get translations for current language
  const t =
    tabTranslations[language as keyof typeof tabTranslations] ||
    tabTranslations.en;

  const tabs = [
    {
      name: "home",
      label: t.home,
      icon: "home",
      route: "/(tabs)/home",
    },
    {
      name: "resources",
      label: t.resources,
      icon: "location",
      route: "/(tabs)/resources",
    },
    {
      name: "chat",
      label: t.chat,
      icon: "chatbubble-ellipses",
      route: "/(tabs)/chat",
    },
    {
      name: "checklist",
      label: t.checklist,
      icon: "checkmark-circle",
      route: "/(tabs)/checklist",
    },
    {
      name: "profile",
      label: t.profile,
      icon: "settings",
      route: "/(tabs)/profile",
    },
  ];

  // If opacity is not 1, we'll add an overlay on top of the tab bar
  const showDarkOverlay = opacity < 1;

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.route ||
            pathname === `/${tab.name}` ||
            pathname.includes(`/${tab.name}`);
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
                color={
                  isActive
                    ? Theme.colors.primaryAlt
                    : Theme.colors.textSecondary
                }
                style={showDarkOverlay ? { opacity } : {}}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                  showDarkOverlay && { opacity },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Dark overlay on top of tab bar when opacity < 1 */}
      {showDarkOverlay && (
        <View
          style={[
            styles.darkOverlay,
            { opacity: 1 - opacity }, // Invert: 0 opacity = full dark, 1 opacity = no dark
          ]}
          pointerEvents="none" // Allow taps to pass through to tab bar
        />
      )}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
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
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: Theme.colors.backgroundLight,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderLight,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: 3,
    ...Theme.shadows.lg,
    justifyContent: "space-around",
    alignItems: "center",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Theme.spacing.xs,
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.textSecondary,
  },
  tabLabelActive: {
    color: Theme.colors.primaryAlt,
    fontFamily: Theme.fonts.semibold,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "black",
  },
});
