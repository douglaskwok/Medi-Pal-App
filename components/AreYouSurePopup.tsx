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
import { AdvancedFilterPopup } from "../components/AdvancedFilterPopup";
import { useLanguage } from "../constants/LanguageContext";

const { width, height } = Dimensions.get("window");

const translations = {
  en: {
    endRoute: "End Route?",
    endCall: "End Call?",
    areYouSureRoute: "Are you sure you want to end the current route?",
    areYouSureCall: "Are you sure you want to end the current call?",
    cancel: "Cancel",
    confirmEndRoute: "End Route",
    confirmEndCall: "End Call",
  },
  es: {
    endRoute: "¿Terminar Ruta?",
    endCall: "¿Terminar Llamada?",
    areYouSureRoute: "¿Estás seguro de que quieres terminar la ruta actual?",
    areYouSureCall: "¿Estás seguro de que quieres terminar la llamada actual?",
    cancel: "Cancelar",
    confirmEndRoute: "Terminar",
    confirmEndCall: "Terminar",
  },
};

export default function AreYouSurePopup({
  mode,
  setShowPopUp,
  proceed,
}: {
  mode: "end_route" | "end_call";
  setShowPopUp: React.Dispatch<React.SetStateAction<boolean>>;
  proceed?: () => void;
}) {
  const { language } = useLanguage();
  const t =
    translations[language as keyof typeof translations] || translations.en;
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>
          {mode === "end_route" ? t.endRoute : t.endCall}
        </Text>
        <Text style={styles.modalMessage}>
          {mode === "end_route" ? t.areYouSureRoute : t.areYouSureCall}
        </Text>
        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={[styles.modalButton, styles.modalCancelButton]}
            onPress={() => setShowPopUp(false)}
          >
            <Text style={styles.modalCancelText}>{t.cancel}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, styles.modalConfirmButton]}
            onPress={proceed}
          >
            <Text style={styles.modalConfirmText}>
              {mode === "end_route" ? t.confirmEndRoute : t.confirmEndCall}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
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
});
