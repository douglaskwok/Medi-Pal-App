import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import { Theme } from "../../constants/Theme";
import { ResourceCard } from "../../components/ResourceCard";
import { CustomModal } from "../../components/Modal";
import { dummyResources } from "../../constants/DummyData";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  addWeeks,
  subWeeks,
} from "date-fns";
import { CustomTabBar } from "./_layout";
// remove later
import { NotificationPopup } from "../../components/NotificationPopup";
import { LanguageProvider, useLanguage } from "../../constants/LanguageContext";

const { width, height } = Dimensions.get("window");
const isTablet = width - 80 > height * 0.5;

// Module-level variable to track if notification has been shown in this app session
// This persists across component remounts but resets when app restarts
let notificationShownThisSession = false;

const translations = {
  en: {
    welcome: "Welcome",
    searchPlaceholder: "Ask AI anything...",
    calendarTitle: "My Calendar",
    resourcesTitle: "Nearby Resources",
    discoverMore: "Discover More",
    confirmModalTitle: "Mark as Done?",
    savedSuccessfully: "Saved Successfully",
    weekDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    markCompleteMessage: (title: string) =>
      `Are you sure you want to mark "${title}" as completed?`,
  },
  es: {
    welcome: "¡Bienvenido",
    searchPlaceholder: "Pregunta a la IA algo...",
    calendarTitle: "Mi Calendario",
    resourcesTitle: "Recursos Cercanos",
    discoverMore: "Descubrir Más",
    confirmModalTitle: "¿Marcar como Completado?",
    savedSuccessfully: "Guardado Exitosamente",
    weekDays: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
    markCompleteMessage: (title: string) =>
      `¿Estás seguro de que quieres marcar "${title}" como completado?`,
  },
};
export default function HomeScreen() {
  const { language } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [userName, setUserName] = useState("User");
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // remove later
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [saveSuccessModalVisible, setSaveSuccessModalVisible] = useState(false);
  const saveSuccessAnim = React.useRef(new Animated.Value(0)).current;
  const saveSuccessScale = React.useRef(new Animated.Value(0.9)).current;
  const notificationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Get translations based on selected language
  const t =
    translations[language as keyof typeof translations] || translations.en;
  useEffect(() => {
    loadUserData();
    loadChecklistItems();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);
  useFocusEffect(
    useCallback(() => {
      console.log("Checklist screen focused, refreshing data...");
      loadChecklistItems();
    }, [])
  );

  // Show notification ONLY ONCE when app opens, after 2 seconds
  useEffect(() => {
    // Check if notification has already been shown in this app session
    if (notificationShownThisSession) {
      return; // Already shown, don't show again
    }

    // Show notification after 2 seconds
    notificationTimerRef.current = setTimeout(() => {
      if (!notificationShownThisSession) {
        setNotificationVisible(true);
        notificationShownThisSession = true;
      }
    }, 2000);

    return () => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
        notificationTimerRef.current = null;
      }
    };
  }, []); // Empty dependency array - runs only once on mount

  const loadChecklistItems = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("checklist_items")
        .select("*")
        .eq("user_id", user.id)
        .order("start_date", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setChecklistItems(
          data.map((item) => ({
            ...item,
            date: new Date(item.start_date),
            startDate: new Date(item.start_date),
            endDate: item.end_date ? new Date(item.end_date) : undefined,
          }))
        );
      } else {
        // No items found, set empty array
        setChecklistItems([]);
      }
    } catch (error) {
      console.error("Error loading checklist items:", error);
      setChecklistItems([]);
    }
  };

  const loadUserData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name.split(" ")[0]);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const filteredChecklistItems = checklistItems.filter((item) =>
    isSameDay(item.date, selectedDate)
  );

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      const query = searchQuery.trim();
      setSearchQuery(""); // Clear the search field
      Keyboard.dismiss(); // Dismiss keyboard before navigation
      // Navigate to chat and pass the query
      router.push({
        pathname: "/(tabs)/chat",
        params: { initialQuery: query },
      });
    }
  };

  const saveChecklistItem = async (item: any) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !item.user_id) return;

      const { error } = await supabase
        .from("checklist_items")
        .update({
          completed: item.completed,
        })
        .eq("id", item.id)
        .eq("user_id", user.id);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating checklist item:", error);
    }
  };

  const handleToggleChecklist = async (id: string) => {
    const item = checklistItems.find((i) => i.id === id);
    if (item && !item.completed) {
      setSelectedItemId(id);
      setModalVisible(true);
    } else if (item && item.completed) {
      const updatedItems = checklistItems.map((i) =>
        i.id === id ? { ...i, completed: false } : i
      );
      setChecklistItems(updatedItems);
      await saveChecklistItem(updatedItems.find((i) => i.id === id)!);
    }
  };

  const handleConfirmModal = async () => {
    if (selectedItemId) {
      const updatedItems = checklistItems.map((i) =>
        i.id === selectedItemId ? { ...i, completed: true } : i
      );
      setChecklistItems(updatedItems);
      await saveChecklistItem(
        updatedItems.find((i) => i.id === selectedItemId)!
      );
      setModalVisible(false);
      setSelectedItemId(null);
    }
  };

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getItemsForDate = (date: Date) => {
    return checklistItems.filter((item) => isSameDay(item.date, date));
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.container}>
        {/* <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive" // or "on-drag"
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={Keyboard.dismiss} // Dismiss on scroll
        > */}
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              // paddingBottom: insets.bottom + 80,
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Image
                source={require("../../assets/icon.png")}
                style={styles.headerLogo}
                resizeMode="contain"
              />
              <View>
                <Text style={styles.headerTitle}>Medi-Pal</Text>
                <Text style={styles.headerSubtitle}>
                  {t.welcome} {userName}
                  {language === "en" && "!"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.searchSection}>
            <View style={styles.searchBarContainer}>
              <View style={styles.searchBar}>
                <Ionicons
                  name="search-outline"
                  size={isTablet ? 32 : 20}
                  color={Theme.colors.text}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder={t.searchPlaceholder}
                  placeholderTextColor={Theme.colors.textLight}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Ionicons
                      name="close-circle"
                      size={isTablet ? 32 : 20}
                      color={Theme.colors.text}
                    />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                style={styles.upArrowButton}
                onPress={handleSearch}
                disabled={!searchQuery.trim()}
              >
                <View
                  style={[
                    styles.upArrowContainer,
                    !searchQuery.trim()
                      ? styles.upArrowDisabled
                      : styles.upArrowActive,
                  ]}
                >
                  <Ionicons
                    name="arrow-up"
                    size={isTablet ? 28 : 18}
                    color="#FFFFFF"
                  />
                </View>
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView
            style={{ height: "100%", marginBottom: isTablet ? 80 : 40 }}
          >
            <View
              style={[styles.calendarSection, isTablet && { marginTop: 32 }]}
            >
              <Text style={styles.sectionTitle}>{t.calendarTitle}</Text>
              <View style={styles.calendarHeader}>
                <TouchableOpacity
                  onPress={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                >
                  <Ionicons
                    name="chevron-back"
                    size={isTablet ? 36 : 24}
                    color={Theme.colors.text}
                  />
                </TouchableOpacity>
                <Text style={styles.calendarMonth}>
                  {format(weekStart, "MMM d")} -{" "}
                  {format(weekEnd, "MMM d, yyyy")}
                </Text>
                <TouchableOpacity
                  onPress={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={isTablet ? 36 : 24}
                    color={Theme.colors.text}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.calendarGrid}>
                {daysInWeek.map((day) => {
                  const dayItems = getItemsForDate(day);
                  const isSelected = isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, new Date());
                  return (
                    <TouchableOpacity
                      key={day.toISOString()}
                      style={[
                        styles.calendarDay,
                        isSelected && styles.calendarDaySelected,
                        isToday && !isSelected && styles.calendarDayToday,
                      ]}
                      onPress={() => setSelectedDate(day)}
                    >
                      <Text
                        style={[
                          styles.calendarDayName,
                          isSelected && { color: Theme.colors.backgroundLight },
                        ]}
                      >
                        {t.weekDays[day.getDay()]}{" "}
                        {/* This uses your translation */}
                      </Text>
                      <Text
                        style={[
                          styles.calendarDayText,
                          isSelected && styles.calendarDayTextSelected,
                        ]}
                      >
                        {format(day, "d")}
                      </Text>
                      {dayItems.length > 0 && (
                        <View
                          style={[
                            styles.calendarDot,
                            isSelected && styles.calendarDotSelected,
                          ]}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
              {filteredChecklistItems.length > 0 && (
                <View style={styles.eventsList}>
                  {filteredChecklistItems.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.eventItem}
                      onPress={() => handleToggleChecklist(item.id)}
                    >
                      <View
                        style={[
                          styles.eventCheckbox,
                          item.completed && styles.eventCheckboxCompleted,
                        ]}
                      >
                        {item.completed && (
                          <Ionicons
                            name="checkmark"
                            size={12}
                            color={Theme.colors.backgroundLight}
                          />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.eventText,
                          item.completed && styles.eventTextCompleted,
                        ]}
                      >
                        {item.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View
              style={[styles.resourcesSection, isTablet && { marginTop: 16 }]}
            >
              <Text style={styles.sectionTitle}>{t.resourcesTitle}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.resourcesScroll}
              >
                {dummyResources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    {...resource}
                    onPress={() =>
                      router.push({
                        pathname: "/(tabs)/resources",
                        params: { resourceId: resource.id },
                      })
                    }
                  />
                ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.discoverMoreButton}
                onPress={() => router.push("/(tabs)/resources")}
              >
                <Text style={styles.discoverMore}>{t.discoverMore}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
        {/* </ScrollView> */}
        <CustomModal
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setSelectedItemId(null);
          }}
          onConfirm={handleConfirmModal}
          title={t.confirmModalTitle}
          message={
            selectedItemId
              ? t.markCompleteMessage(
                  checklistItems.find((i) => i.id === selectedItemId)?.title ||
                    ""
                )
              : undefined
          }
        />
        <CustomTabBar opacity={notificationVisible ? 0.4 : 1} />

        <NotificationPopup
          visible={notificationVisible}
          onDismiss={() => {
            setNotificationVisible(false);
            // Mark as shown so it won't appear again
            notificationShownThisSession = true;
          }}
          onSaveSuccess={() => {
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
          }}
        />
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
                {t.savedSuccessfully}
              </Text>
            </Animated.View>
          </Animated.View>
        )}
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  // scrollView: {
  //   flex: 1,
  // },
  // scrollContent: {
  //   // flexGrow: 1,
  // },
  content: {
    flex: 1,
    paddingHorizontal: Theme.spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Theme.spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
  },
  headerLogo: {
    width: isTablet ? 100 : 50,
    height: isTablet ? 100 : 50,
  },
  headerTitle: {
    fontSize: isTablet ? 40 : 28,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: isTablet ? 20 : 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textSecondary,
  },
  searchSection: {
    marginBottom: Theme.spacing.md,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: 9999,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderWidth: 2,
    borderColor: Theme.colors.warning,
    gap: Theme.spacing.sm,
    shadowColor: Theme.colors.warning,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: isTablet ? 26 : 16,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.text,
  },
  upArrowButton: {
    width: isTablet ? 52 : 40,
    height: isTablet ? 52 : 40,
    justifyContent: "center",
    alignItems: "center",
  },
  upArrowContainer: {
    width: isTablet ? 52 : 40,
    height: isTablet ? 52 : 40,
    borderRadius: isTablet ? 40 : 20,
    backgroundColor: Theme.colors.primaryDark,
    justifyContent: "center",
    alignItems: "center",
    ...Theme.shadows.sm,
  },
  upArrowDisabled: {
    backgroundColor: Theme.colors.primaryDark,
    opacity: 0.6,
  },
  upArrowActive: {
    backgroundColor: Theme.colors.primaryDark,
    opacity: 1,
  },
  calendarSection: {
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.sm,
  },
  sectionTitle: {
    fontSize: isTablet ? 36 : 24,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
    fontWeight: "bold",
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.md,
  },
  calendarMonth: {
    fontSize: isTablet ? 30 : 18,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
  },
  calendarGrid: {
    flexDirection: "row",
    marginBottom: Theme.spacing.md,
    gap: Theme.spacing.xs,
  },
  calendarDay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Theme.borderRadius.md,
    paddingVertical: Theme.spacing.sm,
    position: "relative",
    minHeight: isTablet ? 140 : 70,
  },
  calendarDaySelected: {
    backgroundColor: Theme.colors.primaryDark,
  },
  calendarDayToday: {
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
  },
  calendarDayName: {
    fontSize: isTablet ? 20 : 10,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.textSecondary,
    marginBottom: 2,
  },
  calendarDayText: {
    fontSize: isTablet ? 32 : 18,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
  },
  calendarDayTextSelected: {
    color: Theme.colors.backgroundLight,
    fontFamily: Theme.fonts.semibold,
  },
  calendarDot: {
    position: "absolute",
    bottom: isTablet ? 8 : 4,
    width: isTablet ? 8 : 4,
    height: isTablet ? 8 : 4,
    borderRadius: isTablet ? 4 : 2,
    backgroundColor: Theme.colors.primary,
  },
  calendarDotSelected: {
    backgroundColor: Theme.colors.backgroundLight,
  },
  eventsList: {
    marginTop: Theme.spacing.sm,
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Theme.spacing.xs,
    gap: Theme.spacing.sm,
  },
  eventCheckbox: {
    width: isTablet ? 30 : 18,
    height: isTablet ? 30 : 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  eventCheckboxCompleted: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  eventText: {
    flex: 1,
    fontSize: isTablet ? 26 : 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.text,
  },
  eventTextCompleted: {
    textDecorationLine: "line-through",
    color: Theme.colors.textSecondary,
  },
  resourcesSection: {
    marginBottom: Theme.spacing.md,
  },
  discoverMore: {
    fontSize: isTablet ? 24 : 14,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.primaryDark,
  },
  discoverMoreButton: {
    alignSelf: "flex-end",
    marginTop: Theme.spacing.sm,
    marginRight: Theme.spacing.md,
  },
  resourcesScroll: {
    paddingRight: Theme.spacing.md,
  },
});
