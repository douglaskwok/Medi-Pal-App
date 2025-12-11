import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
} from "react-native";
import { Theme } from "../constants/Theme";
import { Ionicons } from "@expo/vector-icons";

interface PersonalInfoModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    firstName: string;
    lastName: string;
    age?: string;
    phoneNumber?: string;
  }) => void;
  initialData?: {
    firstName: string;
    lastName: string;
    age?: string;
    phoneNumber?: string;
  };
  email: string;
}

export const PersonalInfoModal: React.FC<PersonalInfoModalProps> = ({
  visible,
  onClose,
  onSave,
  initialData,
  email,
}) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setFirstName(initialData.firstName || "");
        setLastName(initialData.lastName || "");
        setAge(initialData.age || "");
        setPhoneNumber(initialData.phoneNumber || "");
      } else {
        setFirstName("");
        setLastName("");
        setAge("");
        setPhoneNumber("");
      }
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, initialData]);

  const handleSave = () => {
    if (!firstName.trim() || !lastName.trim()) {
      return;
    }
    onSave({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      age: age.trim() || undefined,
      phoneNumber: phoneNumber.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <Text style={styles.title}>Edit Personal Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter first name"
                  placeholderTextColor={Theme.colors.textLight}
                  value={firstName}
                  onChangeText={setFirstName}
                  maxLength={50}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter last name"
                  placeholderTextColor={Theme.colors.textLight}
                  value={lastName}
                  onChangeText={setLastName}
                  maxLength={50}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Age</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter age"
                  placeholderTextColor={Theme.colors.textLight}
                  value={age}
                  onChangeText={(text) => {
                    const numericValue = text.replace(/[^0-9]/g, "");
                    if (
                      numericValue === "" ||
                      (parseInt(numericValue) >= 0 &&
                        parseInt(numericValue) <= 150)
                    ) {
                      setAge(numericValue);
                    }
                  }}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter phone number"
                  placeholderTextColor={Theme.colors.textLight}
                  value={phoneNumber}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9-() ]/g, "");
                    setPhoneNumber(cleaned);
                  }}
                  keyboardType="phone-pad"
                  maxLength={20}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.emailContainer}>
                  <Text style={styles.emailText}>{email}</Text>
                  <Text style={styles.emailNote}>Cannot be changed</Text>
                </View>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.saveButton,
                    (!firstName.trim() || !lastName.trim()) &&
                      styles.saveButtonDisabled,
                  ]}
                  onPress={handleSave}
                  activeOpacity={0.7}
                  disabled={!firstName.trim() || !lastName.trim()}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Theme.spacing.lg,
  },
  modalContainer: {
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.xl,
    width: "100%",
    maxWidth: 400,
    ...Theme.shadows.lg,
  },
  title: {
    fontSize: 20,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xl,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: Theme.spacing.md,
  },
  label: {
    fontSize: 14,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  input: {
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.sm,
    fontSize: 16,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.text,
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
    minHeight: 44,
  },
  emailContainer: {
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
    minHeight: 44,
    justifyContent: "center",
  },
  emailText: {
    fontSize: 16,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.text,
  },
  emailNote: {
    fontSize: 12,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.xs,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: Theme.spacing.md,
    marginTop: Theme.spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: Theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  saveButton: {
    backgroundColor: Theme.colors.primary,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.text,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.backgroundLight,
  },
});
