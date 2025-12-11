import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  SafeAreaView,
  Dimensions,
  ScrollView,
  Image,
  Alert,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import { Theme } from "../constants/Theme";
import { dummyResources } from "../constants/DummyData";
import { ResourceCard } from "../components/ResourceCard";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useLocalSearchParams } from "expo-router";
import { avatars } from "../constants/Avatars";

const { width, height } = Dimensions.get("window");

// Define language options
const languageOptions = [
  { id: "en" as "en" | "es", name: "English", flag: "🇺🇸" },
  { id: "es" as "en" | "es", name: "Español", flag: "🇪🇸" },
];

// Translation object
const translations = {
  en: {
    // Titles
    beforeYouStart: "Before You Start",
    chooseAvatar: "Choose Avatar",
    selectLanguage: "Select Language",
    todoList: "To-Do List",

    // Subtitles
    tipsChecklistSubtitle:
      "Remember to do these things before embarking on your journey",
    chooseAvatarSubtitle: "Select your Medi-Pal companion:",
    selectLanguageSubtitle:
      "Choose your preferred language for the app interface:",
    videoTipsSubtitle:
      "Here are some of the suggested tips. You can add them to your checklist!",

    // Tips checklist items
    tip1: "Arrive 10 minutes early.",
    tip2: "Bring your Medi-Cal card.",
    tip3: "Bring a photo ID",
    tip4: "Schedule a free lab test at Ravenswood Family Health Center in East Palo Alto.",
    tip5: "Walk on treadmills at Palo Alto YMCA Gym every week.",

    // Button texts
    startRoute: "Start Route",
    addToChecklist: "Save All To Checklist",
    addedInChecklist: "Saved in Checklist",
    confirm: "Confirm",
    cancel: "Cancel",
    exit: "Exit",
  },
  es: {
    // Titles
    beforeYouStart: "Antes de Empezar",
    chooseAvatar: "Elegir Avatar",
    selectLanguage: "Seleccionar Idioma",
    todoList: "Lista de Tareas",

    // Subtitles
    tipsChecklistSubtitle:
      "Recuerda hacer estas cosas antes de comenzar tu viaje",
    chooseAvatarSubtitle: "Selecciona tu compañero de Medi-Pal:",
    selectLanguageSubtitle:
      "Elige tu idioma preferido para la interfaz de la aplicación:",
    videoTipsSubtitle:
      "Aquí tienes algunos de los consejos sugeridos. ¡Puedes añadirlos a tu lista de tareas!",

    // Tips checklist items
    tip1: "Llega 10 minutos antes.",
    tip2: "Trae tu tarjeta de Medi-Cal.",
    tip3: "Trae una identificación con foto",
    tip4: "Programa una prueba de laboratorio gratuita en Ravenswood Family Health Center en East Palo Alto.",
    tip5: "Camina en las caminadoras del Gimnasio YMCA de Palo Alto cada semana.",

    // Button texts
    startRoute: "Iniciar Ruta",
    addToChecklist: "Añadir a Lista",
    addedInChecklist: "Añadido a la Lista",
    confirm: "Confirmar",
    cancel: "Cancelar",
    exit: "Salir",
  },
};

export default function SelectionModal({
  mode,
  from_video,
  setShowPopUp,
  avatar,
  setAvatar,
  proceed,
  selectedLanguage, // = "en", // Default to "en" if undefined
  setSelectedLanguage,
}: {
  mode: "tips_checklist" | "choose_avatar" | "select_language";
  from_video?: true;
  setShowPopUp: React.Dispatch<React.SetStateAction<boolean>>;
  avatar?: "dr-al" | "dr-lora" | "bert" | "lexi";
  setAvatar?: React.Dispatch<
    React.SetStateAction<"dr-al" | "dr-lora" | "bert" | "lexi">
  >;
  proceed?: () => void;
  selectedLanguage?: "en" | "es";
  setSelectedLanguage?: (lang: "en" | "es") => void;
}) {
  console.log(selectedLanguage);
  const video_origin = from_video || false;
  // const { language, setLanguage } = useLanguage();

  // Get the current language or default to "en"
  const currentLanguage = selectedLanguage || "en";

  // Get translations for current language
  const t =
    translations[currentLanguage as keyof typeof translations] ||
    translations.en;

  // Create checklists with translated items
  const prepTipsChecklist = [
    { id: "1", title: t.tip1, completed: false },
    { id: "2", title: t.tip2, completed: false },
    { id: "3", title: t.tip3, completed: false },
  ];

  const adviceChecklist = [
    { id: "1", title: t.tip4, completed: false },
    { id: "2", title: t.tip5, completed: false },
  ];

  const chosenChecklist = video_origin ? adviceChecklist : prepTipsChecklist;
  const [addedToChecklist, setAddedToChecklist] = useState(false);
  const [tipsChecklist, setTipsChecklist] = useState(chosenChecklist);
  const [selectedAvatar, setSelectedAvatar] = useState<
    "dr-al" | "dr-lora" | "bert" | "lexi"
  >(avatar ?? "dr-al");

  // State for language selection
  const [tempSelectedLanguage, setTempSelectedLanguage] =
    useState(currentLanguage);

  const resetTipsChecklist = () => {
    setTipsChecklist(
      chosenChecklist.map((item) => ({ ...item, completed: false }))
    );
  };

  // Get modal titles based on mode
  const getModalTitle = () => {
    switch (mode) {
      case "tips_checklist":
        return video_origin ? t.todoList : t.beforeYouStart;
      case "choose_avatar":
        return t.chooseAvatar;
      case "select_language":
        return t.selectLanguage;
      default:
        return "";
    }
  };

  const getModalSubtitle = () => {
    switch (mode) {
      case "tips_checklist":
        return video_origin ? t.videoTipsSubtitle : t.tipsChecklistSubtitle;
      case "choose_avatar":
        return t.chooseAvatarSubtitle;
      case "select_language":
        return t.selectLanguageSubtitle;
      default:
        return "";
    }
  };

  const getConfirmButtonText = () => {
    switch (mode) {
      case "tips_checklist":
        return video_origin
          ? addedToChecklist
            ? t.addedInChecklist
            : t.addToChecklist
          : t.startRoute;
      case "choose_avatar":
        return t.confirm;
      case "select_language":
        return t.confirm;
      default:
        return t.confirm;
    }
  };

  const getCancelButtonText = () => {
    return video_origin ? t.exit : t.cancel;
  };

  const handleConfirmPress = () => {
    switch (mode) {
      case "tips_checklist":
        if (video_origin === true && addedToChecklist === false) {
          setAddedToChecklist(!addedToChecklist);
        }
        if (proceed) proceed();
        break;
      case "choose_avatar":
        if (setAvatar) {
          setAvatar(selectedAvatar);
          setShowPopUp(false);
        }
        break;
      case "select_language":
        if (setSelectedLanguage) {
          setSelectedLanguage(tempSelectedLanguage);
          setShowPopUp(false);
        }
        break;
    }
  };

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <Text style={styles.tipsModalTitle}>{getModalTitle()}</Text>
        <Text style={styles.tipsModalSubtitle}>{getModalSubtitle()}</Text>

        {/* Tips Checklist Mode */}
        {mode === "tips_checklist" && (
          <ScrollView style={styles.checklistScroll}>
            {tipsChecklist.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.checklistItem}
                onPress={() => {
                  setTipsChecklist(
                    tipsChecklist.map((i) =>
                      i.id === item.id ? { ...i, completed: !i.completed } : i
                    )
                  );
                }}
              >
                <View
                  style={[
                    styles.checklistCheckbox,
                    item.completed && styles.checklistCheckboxCompleted,
                  ]}
                >
                  {item.completed && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={Theme.colors.backgroundLight}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.checklistText,
                    item.completed && styles.checklistTextCompleted,
                  ]}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Choose Avatar Mode */}
        {mode === "choose_avatar" && (
          <View style={styles.avatarsContainer}>
            <View style={styles.avatarRow}>
              <TouchableOpacity
                style={[
                  styles.avatarButton,
                  selectedAvatar === "dr-al" && styles.avatarButtonSelected,
                ]}
                onPress={() => setSelectedAvatar("dr-al")}
                activeOpacity={0.7}
              >
                <Image style={styles.avatarImage} source={avatars[0].source} />
                {selectedAvatar === "dr-al" && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={Theme.colors.primaryDark}
                    />
                  </View>
                )}
                <Text style={styles.avatarName}>{avatars[0].name}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.avatarButton,
                  selectedAvatar === "dr-lora" && styles.avatarButtonSelected,
                ]}
                onPress={() => setSelectedAvatar("dr-lora")}
                activeOpacity={0.7}
              >
                <Image style={styles.avatarImage} source={avatars[1].source} />
                {selectedAvatar === "dr-lora" && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={Theme.colors.primaryDark}
                    />
                  </View>
                )}
                <Text style={styles.avatarName}>{avatars[1].name}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.avatarRow}>
              <TouchableOpacity
                style={[
                  styles.avatarButton,
                  selectedAvatar === "lexi" && styles.avatarButtonSelected,
                ]}
                onPress={() => setSelectedAvatar("lexi")}
                activeOpacity={0.7}
              >
                <Image style={styles.avatarImage} source={avatars[2].source} />
                {selectedAvatar === "lexi" && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={Theme.colors.primaryDark}
                    />
                  </View>
                )}
                <Text style={styles.avatarName}>{avatars[2].name}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.avatarButton,
                  selectedAvatar === "bert" && styles.avatarButtonSelected,
                ]}
                onPress={() => setSelectedAvatar("bert")}
                activeOpacity={0.7}
              >
                <Image style={styles.avatarImage} source={avatars[3].source} />
                {selectedAvatar === "bert" && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={Theme.colors.primaryDark}
                    />
                  </View>
                )}
                <Text style={styles.avatarName}>{avatars[3].name}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Select Language Mode */}
        {mode === "select_language" && (
          <ScrollView
            style={styles.languageScroll}
            showsVerticalScrollIndicator={true}
          >
            {languageOptions.map((language) => (
              <TouchableOpacity
                key={language.id}
                style={[
                  styles.languageOption,
                  tempSelectedLanguage === language.id &&
                    styles.languageOptionSelected,
                ]}
                onPress={() => setTempSelectedLanguage(language.id)}
                activeOpacity={0.7}
              >
                <View style={styles.languageFlagContainer}>
                  <Text style={styles.languageFlag}>{language.flag}</Text>
                </View>
                <Text
                  style={[
                    styles.languageName,
                    tempSelectedLanguage === language.id &&
                      styles.languageNameSelected,
                  ]}
                >
                  {language.name}
                </Text>
                {tempSelectedLanguage === language.id && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={Theme.colors.primaryDark}
                    style={styles.languageCheckmark}
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Modal Buttons */}
        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={[styles.modalButton, styles.modalCancelButton]}
            onPress={() => {
              resetTipsChecklist();
              setShowPopUp(false);
            }}
          >
            <Text style={styles.modalCancelText}>{getCancelButtonText()}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modalButton,
              styles.modalConfirmButton,
              { backgroundColor: Theme.colors.primaryDark },
              video_origin && { flex: 2 },
              video_origin &&
                addedToChecklist && {
                  backgroundColor: Theme.colors.primary,
                },
            ]}
            onPress={handleConfirmPress}
          >
            <Text style={styles.modalConfirmText}>
              {getConfirmButtonText()}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  checklistScroll: {
    maxHeight: 300,
    marginBottom: Theme.spacing.sm,
  },
  languageScroll: {
    maxHeight: 300,
    marginBottom: Theme.spacing.sm,
  },
  tipsModalTitle: {
    fontSize: 24,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
    textAlign: "center",
    fontWeight: "700",
  },
  tipsModalSubtitle: {
    fontSize: 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.sm,
    lineHeight: 20,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.sm,
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.sm,
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.md,
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.xs,
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
  },
  languageOptionSelected: {
    backgroundColor: Theme.colors.primary + "10", // 10% opacity
    borderColor: Theme.colors.primaryDark,
    borderWidth: 2,
  },
  languageFlagContainer: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  languageFlag: {
    fontSize: 24,
  },
  languageName: {
    flex: 1,
    fontSize: 16,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.text,
    marginLeft: Theme.spacing.md,
  },
  languageNameSelected: {
    color: Theme.colors.primaryDark,
    fontFamily: Theme.fonts.semibold,
  },
  languageCheckmark: {
    marginLeft: Theme.spacing.sm,
  },
  checklistCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Theme.spacing.sm,
  },
  checklistCheckboxCompleted: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  checklistText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.text,
    lineHeight: 20,
  },
  checklistTextCompleted: {
    textDecorationLine: "line-through",
    color: Theme.colors.textSecondary,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10000,
  },
  modalContainer: {
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.xl,
    width: "85%",
    maxWidth: 400,
    ...Theme.shadows.lg,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Theme.spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    alignItems: "center",
  },
  modalCancelButton: {
    backgroundColor: Theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  modalConfirmButton: {
    backgroundColor: Theme.colors.error,
  },
  modalCancelText: {
    fontSize: 16,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.text,
  },
  modalConfirmText: {
    fontSize: 16,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.backgroundLight,
  },
  avatarsContainer: {
    flexDirection: "column",
    paddingBottom: Theme.spacing.xl,
    maxHeight: height * 0.4,
  },
  avatarRow: {
    flexDirection: "row",
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    height: "50%",
  },
  avatarButton: {
    flex: 1,
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.xs,
    alignItems: "center",
    justifyContent: "center",
    ...Theme.shadows.md,
    borderColor: Theme.colors.borderLight,
    borderWidth: 1,
    overflow: "hidden",
    margin: 1,
  },
  avatarName: {
    fontSize: 18,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
    width: "100%",
    textAlign: "center",
    fontWeight: "500",
  },
  avatarImage: {
    resizeMode: "cover",
    height: "85%",
    width: "108%",
    top: -4,
    paddingBottom: 0,
  },
  avatarButtonSelected: {
    borderColor: Theme.colors.primaryAlt,
    borderWidth: 2,
    padding: Theme.spacing.xs - 1,
    backgroundColor: Theme.colors.primary + "10", // 10% opacity
  },
  selectedIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: 12,
  },
});
