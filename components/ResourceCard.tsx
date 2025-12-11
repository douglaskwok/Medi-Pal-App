import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Animated,
} from "react-native";
import { Theme } from "../constants/Theme";
import { ImageSourcePropType } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LanguageProvider, useLanguage } from "../constants/LanguageContext";

const { width, height } = Dimensions.get("window");
const isTablet = width - 80 > height * 0.5;

const translations = {
  en: {
    save: "Save",
    isSaved: "Is Saved",
    takeMeThere: "Take Me There!",
  },
  es: {
    save: "Guardar",
    isSaved: "Ya Guardado",
    takeMeThere: "¡Llévame Allá!",
  },
};

interface ResourceCardProps {
  id: string;
  name: string;
  type: string;
  distance: string;
  address: string;
  rating: number;
  image: ImageSourcePropType;
  onPress: () => void;
  show_action_buttons?: boolean;
  saveResource?: () => void;
  small?: boolean;
  showBlackBorder?: boolean;
  phone?: string | null;
  email?: string | null;
  hours?: string | null;
  isSaved?: boolean;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  id,
  name,
  type,
  distance,
  address,
  rating,
  image,
  onPress,
  show_action_buttons = false,
  saveResource = () => {},
  small = false,
  showBlackBorder = false,
  phone = null,
  email = null,
  hours = null,
  isSaved = false,
}) => {
  const { language } = useLanguage();
  const t =
    translations[language as keyof typeof translations] || translations.en;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        small && styles.containerSmall,
        showBlackBorder && styles.containerBlackBorder,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View
          style={[styles.imageContainer, small && styles.imageContainerSmall]}
        >
          <Image source={image} style={styles.image} resizeMode="cover" />
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{type}</Text>
          </View>
        </View>
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.meta}>
            <View style={styles.rating}>
              <Ionicons
                name="star"
                size={isTablet ? 18 : 14}
                color={Theme.colors.warning}
              />
              <Text style={styles.ratingText}>{rating}</Text>
            </View>
            <Text style={styles.distance}>{distance}</Text>
          </View>
          <Text
            style={[
              styles.address,
              show_action_buttons && { height: styles.address.lineHeight * 3 },
            ]}
            numberOfLines={show_action_buttons ? 3 : 1}
          >
            {address}
          </Text>
        </View>
      </TouchableOpacity>
      {show_action_buttons && (
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={saveResource}
          >
            <Text style={styles.saveButtonText}>
              {isSaved ? t.isSaved : t.save}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.takeMeButton]}
            onPress={onPress}
          >
            <Text style={styles.takeMeButtonText}>{t.takeMeThere}</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: isTablet ? 360 : 240,
    marginRight: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.backgroundLight,
    overflow: "hidden",
    ...Theme.shadows.md,
  },
  containerSmall: {
    width: "100%",
  },
  containerBlackBorder: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.lg,
  },
  imageContainer: {
    width: "100%",
    height: isTablet ? 160 : 120,
    position: "relative",
  },
  imageContainerSmall: {
    height: 100,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  typeBadge: {
    position: "absolute",
    top: Theme.spacing.sm,
    left: Theme.spacing.sm,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.sm,
  },
  typeText: {
    fontSize: isTablet ? 20 : 12,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.background,
  },
  content: {
    padding: Theme.spacing.md,
    minHeight: 100,
  },
  name: {
    fontSize: isTablet ? 22 : 16,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Theme.spacing.xs,
    gap: Theme.spacing.sm,
    flexWrap: "wrap",
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: isTablet ? 18 : 13,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.text,
  },
  distance: {
    fontSize: isTablet ? 18 : 13,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textSecondary,
  },
  address: {
    fontSize: isTablet ? 15 : 12,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textSecondary,
    lineHeight: isTablet ? 20 : 16,
  },
  buttons: {
    flexDirection: "row",
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
    justifyContent: "space-evenly",
    paddingHorizontal: Theme.spacing.sm,
  },
  button: {
    // flex: 1,
    paddingVertical: Theme.spacing.sm,
    // paddingHorizontal: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    backgroundColor: Theme.colors.background,
    flex: 2,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
  },
  takeMeButton: {
    backgroundColor: Theme.colors.primaryDark,
    flex: 3,
  },
  takeMeButtonText: {
    fontSize: 14,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.backgroundLight,
  },
});
