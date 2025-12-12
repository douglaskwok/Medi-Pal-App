import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Image,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Theme } from "../../constants/Theme";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { CustomModal } from "../../components/Modal";
import { CustomTabBar } from "./_layout";
import { NotificationPopup } from "../../components/NotificationPopup";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import SelectionModal from "../../components/selectionModal";
import { LanguageProvider, useLanguage } from "../../constants/LanguageContext";
type Language = "en" | "es";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}
const { width, height } = Dimensions.get("window");
const isTablet = width - 80 > height * 0.5;

interface UserProfile {
  firstName: string;
  lastName: string;
  age?: string;
  phoneNumber?: string;
}

// Translation object
const translations = {
  en: {
    settings: "Settings",
    personalInfo: "Personal Information",
    firstName: "First Name",
    lastName: "Last Name",
    age: "Age",
    phone: "Phone",
    email: "Email",
    notSet: "Not set",
    enterFirstName: "Enter first name",
    enterLastName: "Enter last name",
    enterAge: "Enter age",
    enterPhone: "Enter phone",
    cancel: "Cancel",
    save: "Save",
    notifications: "Notifications",
    language: "Language",
    privacySecurity: "Privacy & Security",
    terms: "Terms of Service",
    signOut: "Sign Out",
    signOutConfirmTitle: "Sign Out",
    signOutConfirmMessage: "Are you sure you want to sign out of your account?",
    signOutConfirm: "Sign Out",
    signOutCancel: "Cancel",
    savedSuccessfully: "Saved Successfully",
  },
  es: {
    settings: "Ajustes",
    personalInfo: "Información Personal",
    firstName: "Nombre",
    lastName: "Apellido",
    age: "Edad",
    phone: "Teléfono",
    email: "Correo Electrónico",
    notSet: "No establecido",
    enterFirstName: "Ingresa tu nombre",
    enterLastName: "Ingresa tu apellido",
    enterAge: "Ingresa tu edad",
    enterPhone: "Ingresa tu teléfono",
    cancel: "Cancelar",
    save: "Guardar",
    notifications: "Notificaciones",
    language: "Idioma",
    privacySecurity: "Privacidad y Seguridad",
    terms: "Términos de Servicio",
    signOut: "Cerrar Sesión",
    signOutConfirmTitle: "Cerrar Sesión",
    signOutConfirmMessage: "¿Estás seguro de que quieres cerrar sesión?",
    signOutConfirm: "Cerrar Sesión",
    signOutCancel: "Cancelar",
    savedSuccessfully: "Guardado Exitosamente",
  },
};

export default function ProfileScreen() {
  const { language, setLanguage } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [signOutModalVisible, setSignOutModalVisible] = useState(false);
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");
  const [userProfile, setUserProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
  });
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState<UserProfile>({
    firstName: "",
    lastName: "",
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [saveSuccessModalVisible, setSaveSuccessModalVisible] = useState(false);
  const saveSuccessAnim = React.useRef(new Animated.Value(0)).current;
  const saveSuccessScale = React.useRef(new Animated.Value(0.9)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  // const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [showLanguageSettings, setShowLanguageSettings] = useState(false);

  // Get translations based on selected language
  const t =
    translations[language as keyof typeof translations] || translations.en;

  React.useEffect(() => {
    loadUserData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadUserData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");

        const { data: profileData } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (profileData) {
          const profile = {
            firstName: profileData.first_name || "",
            lastName: profileData.last_name || "",
            age: profileData.age?.toString() || "",
            phoneNumber: profileData.phone_number || "",
          };
          setUserProfile(profile);
          setTempValues(profile);
          setUserName(
            `${profile.firstName} ${profile.lastName}`.trim() ||
              userEmail.split("@")[0]
          );
        } else {
          if (user.user_metadata?.full_name) {
            const nameParts = user.user_metadata.full_name.split(" ");
            const profile = {
              firstName: nameParts[0] || "",
              lastName: nameParts.slice(1).join(" ") || "",
            };
            setUserProfile(profile);
            setTempValues(profile);
            setUserName(user.user_metadata.full_name);
          } else if (user.email) {
            setUserName(user.email.split("@")[0]);
          }
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const handleFieldPress = (field: string) => {
    if (field === "email") return; // Email is not editable
    setEditingField(field);
  };

  const handleFieldChange = (field: string, value: string) => {
    setTempValues({ ...tempValues, [field]: value });
    setHasChanges(true);
  };

  const handleCancel = () => {
    setTempValues(userProfile);
    setEditingField(null);
    setHasChanges(false);
  };

  const handleSave = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const profileData = {
        user_id: user.id,
        first_name: tempValues.firstName,
        last_name: tempValues.lastName,
        age: tempValues.age ? parseInt(tempValues.age) : null,
        phone_number: tempValues.phoneNumber || null,
      };

      const { error } = await supabase
        .from("user_profiles")
        .upsert(profileData, {
          onConflict: "user_id",
        });

      if (error) throw error;

      setUserProfile(tempValues);
      setUserName(`${tempValues.firstName} ${tempValues.lastName}`.trim());
      setEditingField(null);
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving personal info:", error);
    }
  };

  const handleSignOut = async () => {
    setSignOutModalVisible(false);
    try {
      await supabase.auth.signOut().catch((error) => {
        console.error("Error signing out:", error);
      });
      router.replace("/(auth)/signin");
    } catch (error) {
      console.error("Error in handleSignOut:", error);
      router.replace("/(auth)/signin");
    }
  };

  const renderField = (
    label: string,
    field: string,
    value: string,
    editable: boolean = true
  ) => {
    const isEditing = editingField === field;
    const displayValue = value || t.notSet;

    // Map field names to translation keys
    const fieldTranslations: Record<string, string> = {
      firstName: t.firstName,
      lastName: t.lastName,
      age: t.age,
      phoneNumber: t.phone,
      email: t.email,
    };

    const placeholders: Record<string, string> = {
      firstName: t.enterFirstName,
      lastName: t.enterLastName,
      age: t.enterAge,
      phoneNumber: t.enterPhone,
    };

    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
          {fieldTranslations[field] || label}
        </Text>
        {isEditing && editable ? (
          <TextInput
            style={styles.fieldInput}
            value={tempValues[field as keyof UserProfile] || ""}
            onChangeText={(text) => {
              if (field === "age") {
                const numericValue = text.replace(/[^0-9]/g, "");
                if (
                  numericValue === "" ||
                  (parseInt(numericValue) >= 0 && parseInt(numericValue) <= 150)
                ) {
                  handleFieldChange(field, numericValue);
                }
              } else if (field === "phoneNumber") {
                const cleaned = text.replace(/[^0-9-() ]/g, "");
                handleFieldChange(field, cleaned);
              } else {
                handleFieldChange(field, text);
              }
            }}
            placeholder={placeholders[field] || `Enter ${label.toLowerCase()}`}
            placeholderTextColor={Theme.colors.textLight}
            autoFocus
            keyboardType={
              field === "age"
                ? "numeric"
                : field === "phoneNumber"
                ? "phone-pad"
                : "default"
            }
            maxLength={field === "age" ? 3 : field === "phoneNumber" ? 20 : 50}
            autoCapitalize={
              field === "firstName" || field === "lastName" ? "words" : "none"
            }
          />
        ) : (
          <TouchableOpacity
            style={[
              styles.fieldDisplay,
              !editable && styles.fieldDisplayDisabled,
            ]}
            onPress={() => editable && handleFieldPress(field)}
            disabled={!editable}
            activeOpacity={editable ? 0.7 : 1}
          >
            <Text
              style={[
                styles.fieldDisplayText,
                !editable && styles.fieldDisplayTextDisabled,
              ]}
            >
              {displayValue}
            </Text>
            {editable && (
              <Ionicons
                name="pencil"
                size={14}
                color={Theme.colors.textSecondary}
              />
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
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
            <Text style={styles.title}>{t.settings}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 80 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Ionicons
                name="person"
                size={isTablet ? 52 : 32}
                color={Theme.colors.text}
              />
            </View>
            <Text style={styles.name}>{userName}</Text>
            <Text style={styles.email}>{userEmail}</Text>
          </View>

          <View style={styles.menuSection}>
            {/* Personal Information Fields */}
            <View style={styles.personalInfoCard}>
              <View style={styles.nameRow}>
                {renderField("First Name", "firstName", userProfile.firstName)}
                {renderField("Last Name", "lastName", userProfile.lastName)}
              </View>

              <View style={styles.contactRow}>
                {renderField("Age", "age", userProfile.age || "")}
                {renderField(
                  "Phone",
                  "phoneNumber",
                  userProfile.phoneNumber || ""
                )}
              </View>

              {renderField("Email", "email", userEmail, false)}

              {hasChanges && (
                <View style={styles.saveCancelRow}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancel}
                  >
                    <Text style={styles.cancelButtonText}>{t.cancel}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                  >
                    <Text style={styles.saveButtonText}>{t.save}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Notifications */}
            <TouchableOpacity
              style={styles.smallMenuItem}
              activeOpacity={0.6}
              onPress={() => setNotificationVisible(true)}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons
                  name="notifications-outline"
                  size={isTablet ? 28 : 18}
                  color={Theme.colors.text}
                />
                <Text style={styles.smallMenuItemTitle}>{t.notifications}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={isTablet ? 24 : 16}
                color={Theme.colors.text}
              />
            </TouchableOpacity>

            {/* Language */}
            <TouchableOpacity
              style={styles.smallMenuItem}
              activeOpacity={0.6}
              onPress={() => setShowLanguageSettings(true)}
            >
              <View style={styles.menuItemLeft}>
                <MaterialIcons
                  name="language"
                  size={isTablet ? 28 : 18}
                  color={Theme.colors.text}
                />
                <Text style={styles.smallMenuItemTitle}>{t.language}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={isTablet ? 24 : 16}
                color={Theme.colors.text}
              />
            </TouchableOpacity>

            {/* Privacy & Security */}
            <TouchableOpacity
              style={styles.smallMenuItem}
              activeOpacity={0.6}
              onPress={() => router.push("/(tabs)/privacy")}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={isTablet ? 28 : 18}
                  color={Theme.colors.text}
                />
                <Text style={styles.smallMenuItemTitle}>
                  {t.privacySecurity}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={isTablet ? 24 : 16}
                color={Theme.colors.text}
              />
            </TouchableOpacity>

            {/* Terms & Conditions */}
            <TouchableOpacity
              style={styles.smallMenuItem}
              activeOpacity={0.6}
              onPress={() => router.push("/(tabs)/terms")}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons
                  name="document-text-outline"
                  size={isTablet ? 28 : 18}
                  color={Theme.colors.text}
                />
                <Text style={styles.smallMenuItemTitle}>{t.terms}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={isTablet ? 24 : 16}
                color={Theme.colors.text}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.signOutButton}
            activeOpacity={0.6}
            onPress={() => setSignOutModalVisible(true)}
          >
            <View style={styles.signOutContent}>
              <Ionicons
                name="log-out-outline"
                size={isTablet ? 28 : 18}
                color={Theme.colors.error}
              />
              <Text style={styles.signOutText}>{t.signOut}</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
      <CustomModal
        visible={signOutModalVisible}
        onClose={() => setSignOutModalVisible(false)}
        onConfirm={handleSignOut}
        title={t.signOutConfirmTitle}
        message={t.signOutConfirmMessage}
        confirmText={t.signOutConfirm}
        cancelText={t.signOutCancel}
        destructive={true}
      />
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
              {t.savedSuccessfully}
            </Text>
          </Animated.View>
        </Animated.View>
      )}
      {showLanguageSettings && (
        <SelectionModal
          mode={"select_language"}
          setShowPopUp={setShowLanguageSettings}
          selectedLanguage={language}
          setSelectedLanguage={setLanguage}
        />
      )}
      <CustomTabBar
        language={language}
        opacity={notificationVisible ? 0.4 : 1}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.sm,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
  },
  headerLogo: {
    width: isTablet ? 80 : 40,
    height: isTablet ? 80 : 40,
  },
  title: {
    fontSize: isTablet ? 52 : 32,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Theme.spacing.xl,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  avatar: {
    width: isTablet ? 100 : 60,
    height: isTablet ? 100 : 60,
    borderRadius: isTablet ? 50 : 30,
    backgroundColor: Theme.colors.backgroundLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Theme.spacing.xs,
    borderWidth: 2,
    borderColor: Theme.colors.borderLight,
  },
  name: {
    fontSize: isTablet ? 28 : 18,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
    marginBottom: 2,
  },
  email: {
    fontSize: isTablet ? 20 : 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textSecondary,
  },
  menuSection: {
    marginBottom: Theme.spacing.md,
  },
  personalInfoCard: {
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.lg,
    marginHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.sm,
    padding: Theme.spacing.md,
    ...Theme.shadows.sm,
  },
  nameRow: {
    flexDirection: "row",
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  contactRow: {
    flexDirection: "row",
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  fieldContainer: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: isTablet ? 18 : 12,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.xs,
  },
  fieldDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Theme.colors.background,
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    minHeight: 44,
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
  },
  fieldDisplayDisabled: {
    opacity: 0.6,
  },
  fieldDisplayText: {
    fontSize: isTablet ? 20 : 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.text,
    flex: 1,
  },
  fieldDisplayTextDisabled: {
    color: Theme.colors.textSecondary,
  },
  fieldInput: {
    backgroundColor: Theme.colors.background,
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    fontSize: 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.text,
    borderWidth: 2,
    borderColor: Theme.colors.primary,
    minHeight: 44,
  },
  saveCancelRow: {
    flexDirection: "row",
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.text,
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.backgroundLight,
  },
  smallMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.md,
    marginHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.xs,
    ...Theme.shadows.sm,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
  },
  smallMenuItemTitle: {
    fontSize: isTablet ? 20 : 14,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.text,
  },
  signOutButton: {
    marginHorizontal: Theme.spacing.lg,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.xl,
    backgroundColor: Theme.colors.error + "15",
    borderRadius: Theme.borderRadius.md,
    paddingVertical: Theme.spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Theme.colors.error,
    ...Theme.shadows.sm,
  },
  signOutContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Theme.spacing.sm,
  },
  signOutText: {
    fontSize: isTablet ? 22 : 14,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.error,
  },
});
