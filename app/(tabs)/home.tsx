import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  SafeAreaView,
  Image,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Theme } from "../../constants/Theme";
import { ResourceCard } from "../../components/ResourceCard";
import { CustomModal } from "../../components/Modal";
import { dummyChecklistItems, dummyResources } from "../../constants/DummyData";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
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

const { width, height } = Dimensions.get("window");
const isTablet = width - 80 > height * 0.5;
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [checklistItems, setChecklistItems] = useState(dummyChecklistItems);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [userName, setUserName] = useState("User");
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // remove later
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [saveSuccessModalVisible, setSaveSuccessModalVisible] = useState(false);
  const saveSuccessAnim = React.useRef(new Animated.Value(0)).current;
  const saveSuccessScale = React.useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    loadUserData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // Add this focus effect for notifications:
  useFocusEffect(
    React.useCallback(() => {
      // Only show notification after 3-second delay
      const notificationTimer = setTimeout(() => {
        setNotificationVisible(true);
      }, 2000);

      return () => {
        clearTimeout(notificationTimer);
        // Hide notification when leaving page
        setNotificationVisible(false);
      };
    }, [])
  );
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

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push({
        pathname: "/(tabs)/chat",
        params: { initialQuery: searchQuery },
      });
    }
  };

  const handleToggleChecklist = (id: string) => {
    const item = checklistItems.find((i) => i.id === id);
    if (item && !item.completed) {
      setSelectedItemId(id);
      setModalVisible(true);
    } else if (item && item.completed) {
      setChecklistItems(
        checklistItems.map((i) =>
          i.id === id ? { ...i, completed: false } : i
        )
      );
    }
  };

  const handleConfirmModal = () => {
    if (selectedItemId) {
      setChecklistItems(
        checklistItems.map((i) =>
          i.id === selectedItemId ? { ...i, completed: true } : i
        )
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
              paddingBottom: insets.bottom + 80,
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
                <Text style={styles.headerSubtitle}>Welcome {userName}!</Text>
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
                  placeholder="Ask AI anything..."
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

          <View style={[styles.calendarSection, isTablet && { marginTop: 32 }]}>
            <Text style={styles.sectionTitle}>My Calendar</Text>
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
                {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
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
                      {format(day, "EEE")}
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
            style={[styles.resourcesSection, isTablet && { marginTop: 32 }]}
          >
            <Text style={styles.sectionTitle}>Nearby Resources</Text>
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
              <Text style={styles.discoverMore}>Discover More</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
        {/* </ScrollView> */}
        <CustomModal
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setSelectedItemId(null);
          }}
          onConfirm={handleConfirmModal}
          title="Mark as Done?"
          message={
            selectedItemId
              ? `Are you sure you want to mark "${
                  checklistItems.find((i) => i.id === selectedItemId)?.title
                }" as completed?`
              : undefined
          }
        />
        <CustomTabBar opacity={notificationVisible ? 0.4 : 1} />

        <NotificationPopup
          visible={notificationVisible}
          onDismiss={() => setNotificationVisible(false)}
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
                {"Saved Successfully"}
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
