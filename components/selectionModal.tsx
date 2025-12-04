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

export default function SelectionModal({
  mode,
  setShowPopUp,
  avatar,
  setAvatar,
  proceed,
}: {
  mode: "tips_checklist" | "choose_avatar";
  setShowPopUp: React.Dispatch<React.SetStateAction<boolean>>;
  avatar?: "dr-al" | "dr-lora" | "bert" | "lexi";
  setAvatar?: React.Dispatch<
    React.SetStateAction<"dr-al" | "dr-lora" | "bert" | "lexi">
  >;
  proceed?: () => void;
}) {
  //   const [showTipsModal, setShowTipsModal] = useState(false);
  const prepTipsChecklist = [
    { id: "1", title: "Arrive 10 minutes early.", completed: false },
    { id: "2", title: "Bring your Medi-Cal card.", completed: false },
    { id: "3", title: "Bring a photo ID", completed: false },
    // { id: '4', title: 'Have water and snacks available', completed: false },
    // { id: '5', title: 'Take breaks every 2 hours if driving long distance', completed: false },
    // { id: '6', title: 'Keep emergency contacts accessible', completed: false },
  ];
  const [tipsChecklist, setTipsChecklist] = useState(prepTipsChecklist);
  const [selectedAvatar, setSelectedAvatar] = useState<
    "dr-al" | "dr-lora" | "bert" | "lexi"
  >(avatar ?? "dr-al");
  //   const avatars = [
  //     {
  //       id: "dr-al",
  //       name: "Dr. Al",
  //       source: require("../assets/avatars/dr-al/profile.jpeg"),
  //     },
  //     {
  //       id: "dr-lora",
  //       name: "Dr. Lora",
  //       source: require("../assets/avatars/dr-lora/profile.jpeg"),
  //     },
  //     {
  //       id: "lexi",
  //       name: "Lexi",
  //       source: require("../assets/avatars/lexi/profile.jpeg"),
  //     },
  //     {
  //       id: "bert",
  //       name: "Bert",
  //       source: require("../assets/avatars/bert/profile.jpeg"),
  //     },
  //   ];
  const resetTipsChecklist = () => {
    setTipsChecklist(
      prepTipsChecklist.map((item) => ({ ...item, completed: false }))
    );
  };

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <Text style={styles.tipsModalTitle}>
          {mode === "tips_checklist" ? "Before You Start" : "Choose Avatar"}
        </Text>
        <Text style={styles.tipsModalSubtitle}>
          {mode === "tips_checklist"
            ? "Remember to do these things before embarking on your journey"
            : "Select your Medi-Pal companion:"}
        </Text>
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
                    color={Theme.colors.primary}
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
                    color={Theme.colors.primary}
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
                    color={Theme.colors.primary}
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
                    color={Theme.colors.primary}
                  />
                </View>
              )}

              <Text style={styles.avatarName}>{avatars[3].name}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={[styles.modalButton, styles.modalCancelButton]}
            onPress={() => {
              resetTipsChecklist();
              setShowPopUp(false);
            }}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modalButton,
              styles.modalConfirmButton,
              { backgroundColor: Theme.colors.primaryDark },
            ]}
            onPress={
              mode === "tips_checklist"
                ? proceed
                : () => {
                    if (setAvatar) {
                      setAvatar(selectedAvatar);
                      setShowPopUp(false);
                    }
                  }
            }
          >
            <Text style={styles.modalConfirmText}>
              {mode === "tips_checklist" ? "Start Route" : "Confirm"}
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
    // textAlign: "center",
    lineHeight: 20,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.sm,
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.xs,
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
  modalTitle: {
    fontSize: 20,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.xl,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    gap: Theme.spacing.md,
    // borderColor: "red",
    // borderWidth: 2,
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
    // width: "90%",
    // aspectRatio: 1,
    flexDirection: "column",
    // borderColor: "red",
    // borderWidth: 2,
    paddingBottom: Theme.spacing.xl,
    maxHeight: height * 0.4,
  },
  //   avatarRow: {
  //     flexDirection: "row",
  //     gap: Theme.spacing.md,
  //   },
  //   avatarBox: {
  //     flex: 1,
  //     flexDirection: "column",
  //   },

  //   avatarName: {
  //     fontSize: 12,
  //   },
  avatarRow: {
    flexDirection: "row",
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    height: "50%",
    // borderColor: "red",
    // borderWidth: 2,
  },
  avatarButton: {
    flex: 1,
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.xs,
    alignItems: "center",
    justifyContent: "center",
    // aspectRatio: 0.7,
    // gap: Theme.spacing.sm,
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
    // borderTopColor: Theme.colors.borderLight,
    // borderTopWidth: 1,
    // paddingTop: Theme.spacing.xs,
  },
  //   avatarImageContainer: {
  //     height: "85%",
  //     width: "100%",
  //     borderBottomColor: Theme.colors.borderLight,
  //     borderBottomWidth: 1,
  //   },
  avatarImage: {
    resizeMode: "cover",
    height: "85%",
    width: "108%",
    top: -4,
    paddingBottom: 0,
    // borderBottomColor: Theme.colors.borderLight,

    // borderColor: "red",
    // borderWidth: 2,
  },
  avatarButtonSelected: {
    borderColor: Theme.colors.primary,
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
  selectedAvatarDisplay: {
    marginTop: Theme.spacing.md,
    padding: Theme.spacing.sm,
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borderRadius.md,
    alignItems: "center",
  },
  selectedAvatarText: {
    fontSize: 16,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.text,
  },
});
