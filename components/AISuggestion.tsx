import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Theme } from "../constants/Theme";
import { Ionicons } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ResourceCard } from "./ResourceCard";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import { ImageSourcePropType } from "react-native";
import { useLanguage } from "../constants/LanguageContext";

const { height, width } = Dimensions.get("window");
const isTablet = width - 80 > height * 0.5;

const translations = {
  en: {
    suggestedResources: "Suggested Resources",
    resourceDescription: "Based on your healthcare needs",
    verifiedSuggestions: "Verified Suggestions from Dr Al",
    hereAreSome: "Here are some Medi-Cal resources that we recommend:",
  },
  es: {
    suggestedResources: "Recursos Sugeridos",
    resourceDescription: "Basado en tus necesidades de salud",
    verifiedSuggestions: "Sugerencias Verificadas del Dr Al",
    hereAreSome: "Aquí hay algunos recursos de Medi-Cal que recomendamos:",
  },
};

interface ResourceData {
  id: string;
  name: string;
  address: string;
  description: string;
  imageSource: ImageSourcePropType;
  eligibility: string;
  category: string;
  latitude: number;
  longitude: number;
  distance: string;
  place_id: string;
  phone: string;
  email: string;
  hours: string;
}

interface NotificationPopupProps {
  visible: boolean;
  resources: ResourceData[];
  onDismiss: () => void;
  onSaveResource?: (resource: ResourceData) => void;
  onTakeMeThere?: (resource: ResourceData) => void;
  onSaveSuccess?: () => void;
}

export const AISuggestion: React.FC<NotificationPopupProps> = ({
  visible,
  resources = [],
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
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const [savedMap, setSavedMap] = useState<{ [key: string]: boolean }>({});
  const [saveSuccessModalVisible, setSaveSuccessModalVisible] = useState(false);
  const saveSuccessAnim = React.useRef(new Animated.Value(0)).current;
  const saveSuccessScale = React.useRef(new Animated.Value(0.9)).current;

  const mappedResources = resources.map((resource) => ({
    id: resource.id,
    name: resource.name,
    type: resource.category,
    distance: resource.distance,
    address: resource.address,
    rating: 4.5,
    image: resource.imageSource,
    latitude: resource.latitude,
    longitude: resource.longitude,
    place_id: resource.place_id,
    description: resource.description,
    eligibility: resource.eligibility,
    hours: resource.hours,
    email: resource.email,
    phone: resource.phone,
  }));

  /** ANIMATION VALUES **/
  const translateY = useRef(new Animated.Value(200)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current; // Added for overlay
  const pan = useRef(new Animated.ValueXY()).current;
  // const pan = useRef(new Animated.ValueXY()).current;
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
      setActiveIndex(0);
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: 0, animated: false });
      }
    } else {
      translateY.setValue(200);
      opacity.setValue(0);
      backdropOpacity.setValue(0);
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
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      pan.setValue({ x: 0, y: 0 });
      onDismiss();
    });
  };

  /** HANDLE SCROLL **/
  const handleScroll = (event: any) => {
    const slideWidth = 240 + Theme.spacing.md;
    const offset = event.nativeEvent.contentOffset.x;
    const index = Math.round(offset / slideWidth);
    setActiveIndex(Math.min(index, mappedResources.length - 1));
  };

  /** HANDLE RESOURCE PRESS **/
  const handleResourcePress = (resource: any) => {
    dismissNotification();
    setTimeout(() => {
      router.push({
        pathname: "/(tabs)/resources",
        params: {
          name: resource.name,
          address: resource.address,
          latitude: resource.latitude.toString(),
          longitude: resource.longitude.toString(),
          description: resource.description,
          place_id: resource.place_id,
          phone: resource.phone,
          email: resource.email,
          hours: resource.hours,
        },
      });
      onTakeMeThere?.(resource);
    }, 320);
  };

  /** HANDLE SAVE RESOURCE **/
  const handleSaveResource = async (resource: any) => {
    if (!!savedMap[resource.id]) {
      return;
    }
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const r = {
        name: resource.name,
        address: resource.address,
        latitude: resource.latitude,
        longitude: resource.longitude,
        place_id: resource.place_id,
      };
      // console.log(r);

      const { error } = await supabase.from("saved_resources").insert({
        user_id: user.id,
        ...r,
      });

      if (error) throw error;

      onSaveResource?.(resource);
      onSaveSuccess?.();
      setSavedMap((prev) => ({
        ...prev,
        [resource.id]: true,
      }));
      setSaveSuccessModalVisible(true);
      Animated.parallel([
        Animated.timing(saveSuccessAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(saveSuccessScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(saveSuccessAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(saveSuccessScale, {
            toValue: 0.9,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setSaveSuccessModalVisible(false);
        });
      }, 2000);
    } catch (err) {
      console.error("Error saving resource:", err);
    }
  };

  if (!visible || mappedResources.length === 0) return null;

  const activeResource = mappedResources[activeIndex];

  return (
    <>
      {/* Dark Overlay */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: backdropOpacity,
          },
        ]}
        pointerEvents={visible ? "auto" : "none"}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={dismissNotification}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.container,
          {
            bottom: height * 0.25,
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
            <View style={styles.headerLeft}>
              <View style={styles.verifiedIcon}>
                <Ionicons
                  name="sparkles-sharp"
                  size={isTablet ? 28 : 18}
                  color="blue"
                />
              </View>
              <Text style={styles.category}>{t.verifiedSuggestions}</Text>
            </View>

            <TouchableOpacity
              onPress={dismissNotification}
              style={styles.closeButton}
            >
              <Ionicons
                name="close"
                size={isTablet ? 32 : 20}
                color={Theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>{t.suggestedResources}</Text>
          <Text style={styles.subtitle}>{t.hereAreSome}</Text>

          {/* Resource Carousel */}
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.carouselContainer}
            contentContainerStyle={styles.carouselContent}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            pagingEnabled
            snapToInterval={240 + Theme.spacing.md}
            decelerationRate="fast"
          >
            {mappedResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                id={resource.id}
                name={resource.name}
                type={resource.type}
                distance={resource.distance}
                address={resource.description}
                rating={resource.rating}
                image={resource.image}
                onPress={() => handleResourcePress(resource)}
                show_action_buttons={true}
                saveResource={() => handleSaveResource(resource)}
                small={false}
                showBlackBorder={true}
                hours={resource.hours}
                email={resource.email}
                phone={resource.phone}
                isSaved={!!savedMap[resource.id]}
              />
            ))}
          </ScrollView>

          {/* Dots Indicator */}
          {mappedResources.length > 1 && (
            <View style={styles.footer}>
              <View style={styles.dotsContainer}>
                {mappedResources.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      index === activeIndex && styles.dotActive,
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.footerText}>
                {activeIndex + 1} of {mappedResources.length}
              </Text>
            </View>
          )}
        </View>
        {saveSuccessModalVisible && (
          <Animated.View
            style={[
              {
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: "center",
                alignItems: "center",
                zIndex: 2000,
                opacity: saveSuccessAnim,
              },
            ]}
            pointerEvents="box-none"
          >
            <Animated.View
              style={[
                {
                  backgroundColor: Theme.colors.backgroundLight,
                  borderRadius: Theme.borderRadius.lg,
                  padding: Theme.spacing.xl,
                  alignItems: "center",
                  ...Theme.shadows.lg,
                  transform: [{ scale: saveSuccessScale }],
                },
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={48}
                color={Theme.colors.success}
              />
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: Theme.fonts.semibold,
                  color: Theme.colors.text,
                  marginTop: Theme.spacing.md,
                }}
              >
                Saved Successfully
              </Text>
            </Animated.View>
          </Animated.View>
        )}
      </Animated.View>
    </>
  );
};

/** STYLES **/
const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    zIndex: 999,
  },
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: Theme.spacing.md,
    zIndex: 1000,
  },
  content: {
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    ...Theme.shadows.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.xs,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  verifiedIcon: {
    paddingRight: Theme.spacing.sm,
  },
  category: {
    fontSize: isTablet ? 18 : 12,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.textSecondary,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: isTablet ? 28 : 18,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: isTablet ? 24 : 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.sm,
    lineHeight: isTablet ? 36 : 20,
  },
  carouselContainer: {
    marginBottom: Theme.spacing.md,
  },
  carouselContent: {
    gap: Theme.spacing.md,
    paddingRight: Theme.spacing.md,
  },
  footer: {
    alignItems: "center",
    marginTop: 0,
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 4,
  },
  dot: {
    width: isTablet ? 10 : 6,
    height: isTablet ? 10 : 6,
    borderRadius: isTablet ? 5 : 3,
    backgroundColor: Theme.colors.border,
  },
  dotActive: {
    backgroundColor: Theme.colors.primary,
    width: isTablet ? 28 : 16,
  },
  footerText: {
    fontSize: isTablet ? 18 : 12,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textSecondary,
  },
});
