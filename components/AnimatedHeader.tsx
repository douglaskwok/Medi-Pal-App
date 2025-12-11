import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { Theme } from "../constants/Theme";

interface AnimatedHeaderProps {
  activeTab: "signin" | "signup";
  onTabChange: (tab: "signin" | "signup") => void;
}

export const AnimatedHeader: React.FC<AnimatedHeaderProps> = ({
  activeTab,
  onTabChange,
}) => {
  const slideAnim = React.useRef(
    new Animated.Value(activeTab === "signin" ? 0 : 1)
  ).current;

  React.useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeTab === "signin" ? 0 : 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [activeTab]);

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100],
  });

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => onTabChange("signin")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "signin" && styles.activeTabText,
            ]}
          >
            Sign In
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => onTabChange("signup")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "signup" && styles.activeTabText,
            ]}
          >
            Sign Up
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.sliderContainer}>
        <Animated.View
          style={[
            styles.slider,
            {
              transform: [{ translateX }],
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.xl,
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    position: "relative",
  },
  tab: {
    flex: 1,
    paddingVertical: Theme.spacing.md,
    alignItems: "center",
  },
  tabText: {
    fontSize: 18,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.textSecondary,
  },
  activeTabText: {
    color: Theme.colors.text,
    fontFamily: Theme.fonts.semibold,
  },
  sliderContainer: {
    height: 3,
    backgroundColor: Theme.colors.borderLight,
    borderRadius: Theme.borderRadius.full,
    marginTop: Theme.spacing.sm,
    overflow: "hidden",
  },
  slider: {
    width: "50%",
    height: "100%",
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.full,
  },
});
