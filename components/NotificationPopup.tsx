import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Theme } from "../constants/Theme";
import { Ionicons } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../constants/LanguageContext";

const { width, height } = Dimensions.get("window");
const isTablet = width - 80 > height * 0.5;

const translations = {
  en: {
    verified: "Medi-Pal Verified: Nearby Resource",
    youAreEligible: "You are eligible for this service",
    saveResource: "Save Resource",
    resourceIsSaved: "Resource is saved!",
    takeMeThere: "Take Me There!",
  },
  es: {
    verified: "Medi-Pal Verificado: Recurso Cercano",
    youAreEligible: "Eres elegible para este servicio",
    saveResource: "Guardar Recurso",
    resourceIsSaved: "¡Recurso guardado!",
    takeMeThere: "¡Llévame allá!",
  },
};

interface NotificationPopupProps {
  visible: boolean;
  onDismiss: () => void;
  onSaveResource?: () => void;
  onTakeMeThere?: () => void;
  onSaveSuccess?: () => void;
}

export const NotificationPopup: React.FC<NotificationPopupProps> = ({
  visible,
  onDismiss,
  onSaveResource,
  onTakeMeThere,
  onSaveSuccess,
}) => {
  const { language } = useLanguage();
  const t =
    translations[language as keyof typeof translations] || translations.en;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isSaved, setIsSaved] = useState(false);

  /** ANIMATION VALUES **/
  const translateY = useRef(new Animated.Value(200)).current; // start below
  const opacity = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current; // Add for overlay
  const pan = useRef(new Animated.ValueXY()).current;
  const yRef = useRef(0);

  useEffect(() => {
    const id = pan.y.addListener(({ value }) => {
      yRef.current = value; // store current value
    });
    return () => pan.y.removeListener(id);
  }, []);

  const autoDismissTimer = useRef<NodeJS.Timeout | null>(null);

  /** SWIPE DOWN TO DISMISS **/
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderGrant: () => {
        pan.setOffset({ x: 0, y: yRef.current });
      },
      onPanResponderMove: Animated.event([null, { dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, g) => {
        pan.flattenOffset();
        if (g.dy > 50) {
          // swipe down
          dismissNotification();
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  /** EFFECT: SHOW / HIDE **/
  useEffect(() => {
    if (visible) {
      showNotification();
      autoDismissTimer.current = setTimeout(() => {
        dismissNotification();
      }, 30000);
    } else {
      translateY.setValue(200);
      opacity.setValue(0);
      backdropOpacity.setValue(0); // Reset backdrop opacity
      pan.setValue({ x: 0, y: 0 });
    }

    return () => {
      if (autoDismissTimer.current) clearTimeout(autoDismissTimer.current);
    };
  }, [visible]);

  /** SHOW ANIMATION **/
  const showNotification = () => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1, // Fade in the overlay
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /** DISMISS ANIMATION **/
  const dismissNotification = () => {
    if (autoDismissTimer.current) {
      clearTimeout(autoDismissTimer.current);
      autoDismissTimer.current = null;
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 200,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0, // Fade out the overlay
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      pan.setValue({ x: 0, y: 0 });
      onDismiss();
    });
  };

  /** SAVE HANDLER **/
  const handleSaveResource = async () => {
    if (isSaved) {
      return;
    }
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const r = {
        name: "Palo Alto Family YMCA",
        address: "3412 Ross Road, Palo Alto, CA 94303",
        latitude: 37.4419,
        longitude: -122.143,
        place_id: "ymca_palo_alto",
      };

      const { error } = await supabase.from("saved_resources").insert({
        user_id: user.id,
        ...r,
      });

      if (error) throw error;

      onSaveResource?.();
      onSaveSuccess?.();
      setIsSaved(true);
      // dismissNotification();
    } catch (err) {
      console.error("Error saving resource:", err);
    }
  };

  /** NAVIGATE HANDLER **/
  const handleTakeMeThere = () => {
    dismissNotification();
    setTimeout(() => {
      router.push({
        pathname: "/(tabs)/resources",
        params: {
          name: "Palo Alto Family YMCA",
          address: "3412 Ross Road, Palo Alto, CA 94303",
          latitude: "37.4419",
          longitude: "-122.1430",
        },
      });
    }, 320);
    onTakeMeThere?.();
  };

  if (!visible) return null;

  return (
    <>
      {/* Dark Overlay */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={dismissNotification}
        style={StyleSheet.absoluteFill}
      >
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: backdropOpacity,
            },
          ]}
        />
      </TouchableOpacity>
      <Animated.View
        style={[
          styles.container,
          {
            bottom: height * 0.25, // ★ popup in bottom half
            opacity,
            transform: [
              { translateY: Animated.add(translateY, pan.y) },
              { translateX: pan.x },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View
              style={[
                {
                  flexDirection: "row",
                  justifyContent: "space-evenly",
                  alignContent: "center",
                },
              ]}
            >
              <View style={[{ paddingRight: Theme.spacing.sm }]}>
                <MaterialIcons
                  name="verified"
                  size={isTablet ? 24 : 18}
                  color="blue"
                />
              </View>
              <Text style={styles.category}>{t.verified}</Text>
            </View>

            <TouchableOpacity
              onPress={dismissNotification}
              style={styles.closeButton}
            >
              <Ionicons
                name="close"
                size={isTablet ? 24 : 20}
                color={Theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>
            Free Gym Membership at Palo Alto Family YMCA
          </Text>
          <View style={[styles.eligibilityRow]}>
            <Ionicons
              name="checkmark-circle"
              size={isTablet ? 24 : 20}
              color={Theme.colors.success}
            />
            <Text style={styles.eligibilityText}>{t.youAreEligible}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons
              name="location"
              size={isTablet ? 24 : 20}
              color={Theme.colors.textSecondary}
            />
            <Text style={styles.detailText}>
              3412 Ross Road, Palo Alto, CA 94303
            </Text>
          </View>
          <View style={styles.imageContainer}>
            <Image
              source={require("../assets/gym.png")}
              style={styles.image}
              // height={"100%"}
              // width={100}
              resizeMode="contain"
            />
          </View>

          <View style={styles.buttons}>
            {/* <TouchableOpacity
            style={[styles.button, styles.iconButton]}
            onPress={handleSaveResource}
          >
            <Ionicons name="information-circle" size={24} color="black" /> */}
            {/* <Text style={styles.saveButtonText}>Learn More</Text> */}
            {/* </TouchableOpacity> */}
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSaveResource}
            >
              {/* <FontAwesome name="bookmark-o" size={24} color="black" /> */}
              <Text style={styles.saveButtonText}>
                {isSaved ? t.resourceIsSaved : t.saveResource}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.takeMeButton]}
              onPress={handleTakeMeThere}
            >
              <Text style={styles.takeMeButtonText}>{t.takeMeThere}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </>
  );
};

/** STYLES **/
const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)", // Dark semi-transparent
    zIndex: 999,
    // bottom: -4,
  },
  // container: {
  //   position: "absolute",
  //   left: 0,
  //   right: 0,
  //   paddingHorizontal: Theme.spacing.md,
  //   zIndex: 1000, // Higher than overlay
  // },
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: Theme.spacing.md,
    zIndex: 1000,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    ...Theme.shadows.lg,
    width: isTablet ? "60%" : "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.xs,
  },
  category: {
    fontSize: isTablet ? 18 : 12,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.textSecondary,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    textAlignVertical: "center",
    alignSelf: "center",
    // borderColor: "red",
    // borderWidth: 2,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: isTablet ? 26 : 18,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
    fontWeight: "700",
  },
  imageContainer: {
    width: "100%",
    height: isTablet ? 300 : 200,
    position: "relative",
    marginBottom: Theme.spacing.md,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  detailText: {
    flex: 1,
    fontSize: isTablet ? 17 : 13,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textSecondary,
    lineHeight: isTablet ? 24 : 18,
    textAlignVertical: "center",
    alignSelf: "center",
  },
  eligibilityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Theme.spacing.xs,
    gap: Theme.spacing.sm,
  },
  eligibilityText: {
    fontSize: isTablet ? 18 : 14,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.success,
  },
  buttons: {
    flexDirection: "row",
    gap: Theme.spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  saveButtonText: {
    fontSize: isTablet ? 20 : 14,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
  },
  takeMeButton: {
    backgroundColor: Theme.colors.primaryDark,
    // flex: 3,
  },
  takeMeButtonText: {
    fontSize: isTablet ? 20 : 14,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.backgroundLight,
  },
  iconButton: {
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    // flex: 1,
  },
});
