import React, { useEffect, useRef } from "react";
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
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";

const { height } = Dimensions.get("window");

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
  const router = useRouter();
  const insets = useSafeAreaInsets();

  /** ANIMATION VALUES **/
  const translateY = useRef(new Animated.Value(200)).current; // start below
  const opacity = useRef(new Animated.Value(0)).current;
  const pan = useRef(new Animated.ValueXY()).current;

  const autoDismissTimer = useRef<NodeJS.Timeout | null>(null);

  /** SWIPE DOWN TO DISMISS **/
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderGrant: () => {
        pan.setOffset({ x: 0, y: pan.y._value });
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
      }, 30000); // changed to longer
    } else {
      translateY.setValue(200);
      opacity.setValue(0);
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
    ]).start(() => {
      pan.setValue({ x: 0, y: 0 });
      onDismiss();
    });
  };

  /** SAVE HANDLER **/
  const handleSaveResource = async () => {
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
      dismissNotification();
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
            <View style={[{ paddingRight: 4 }]}>
              <MaterialIcons name="verified" size={18} color="blue" />
            </View>
            <Text style={styles.category}>
              Medi-Pal Verified: Nearby Resource
            </Text>
          </View>

          <TouchableOpacity
            onPress={dismissNotification}
            style={styles.closeButton}
          >
            <Ionicons
              name="close"
              size={20}
              color={Theme.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>
          Free Gym Membership at Palo Alto Family YMCA
        </Text>

        <View style={styles.detailRow}>
          <Ionicons
            name="location"
            size={14}
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
            style={[styles.button, styles.saveButton]}
            onPress={handleSaveResource}
          >
            <Text style={styles.saveButtonText}>Learn More</Text>
          </TouchableOpacity> */}
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSaveResource}
          >
            <Text style={styles.saveButtonText}>Save Resource</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.takeMeButton]}
            onPress={handleTakeMeThere}
          >
            <Text style={styles.takeMeButtonText}>Take me there</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

/** STYLES **/
const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: Theme.spacing.md,
    zIndex: 999,
  },
  content: {
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    ...Theme.shadows.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.xs,
  },
  category: {
    fontSize: 12,
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
    fontSize: 16,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
    fontWeight: "700",
  },
  imageContainer: {
    width: "100%",
    height: 200,
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
    gap: Theme.spacing.xs,
    marginBottom: Theme.spacing.sm,
  },
  detailText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
    textAlignVertical: "center",
    alignSelf: "center",
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
    fontSize: 14,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
  },
  takeMeButton: {
    backgroundColor: Theme.colors.primary,
  },
  takeMeButtonText: {
    fontSize: 14,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.backgroundLight,
  },
});
