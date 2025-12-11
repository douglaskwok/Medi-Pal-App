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
  Platform,
  Dimensions,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Theme } from "../constants/Theme";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useLanguage } from "../constants/LanguageContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const translations = {
  en: {
    editItem: "Edit Item",
    addItem: "Add Item",
    title: "Title",
    description: "Description",
    optional: "Optional",
    start: "Start",
    end: "End",
    enterTitle: "Enter title",
    cancel: "Cancel",
    save: "Save",
    add: "Add",
  },
  es: {
    editItem: "Editar Elemento",
    addItem: "Agregar Elemento",
    title: "Título",
    description: "Descripción",
    optional: "Opcional",
    start: "Inicio",
    end: "Fin",
    enterTitle: "Ingresa el título",
    cancel: "Cancelar",
    save: "Guardar",
    add: "Agregar",
  },
};

interface ChecklistItemModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
  }) => void;
  editingItem?: {
    id: string;
    title: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
  } | null;
}

export const ChecklistItemModal: React.FC<ChecklistItemModalProps> = ({
  visible,
  onClose,
  onSave,
  editingItem,
}) => {
  const { language } = useLanguage();
  const t =
    translations[language as keyof typeof translations] || translations.en;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date");
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      if (editingItem) {
        setTitle(editingItem.title);
        setDescription(editingItem.description || "");
        setStartDate(
          editingItem.startDate ? new Date(editingItem.startDate) : new Date()
        );
        setEndDate(
          editingItem.endDate ? new Date(editingItem.endDate) : new Date()
        );
      } else {
        setTitle("");
        setDescription("");
        const now = new Date();
        setStartDate(now);
        setEndDate(new Date(now.getTime() + 60 * 60 * 1000));
      }
      setShowStartPicker(false);
      setShowEndPicker(false);
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
  }, [visible, editingItem]);

  const handleSave = () => {
    if (!title.trim()) {
      return;
    }
    onSave({
      title: title.trim(),
      description: description.trim(),
      startDate,
      endDate,
    });
    setTitle("");
    setDescription("");
    onClose();
  };

  const formatDateTime = (date: Date) => {
    return format(date, "MMM d, yyyy h:mm a");
  };

  // const handleStartDateChange = (event: any, selectedDate?: Date) => {
  //   if (Platform.OS === "android") {
  //     setShowStartPicker(false);
  //   }
  //   if (selectedDate) {
  //     if (pickerMode === "date") {
  //       const newDate = new Date(selectedDate);
  //       newDate.setHours(startDate.getHours());
  //       newDate.setMinutes(startDate.getMinutes());
  //       setStartDate(newDate);
  //       if (Platform.OS === "android") {
  //         setPickerMode("time");
  //         setTimeout(() => setShowStartPicker(true), 100);
  //       }
  //     } else {
  //       const newDate = new Date(startDate);
  //       newDate.setHours(selectedDate.getHours());
  //       newDate.setMinutes(selectedDate.getMinutes());
  //       setStartDate(newDate);
  //       setPickerMode("date");
  //     }
  //   }
  // };

  // const handleEndDateChange = (event: any, selectedDate?: Date) => {
  //   if (Platform.OS === "android") {
  //     setShowEndPicker(false);
  //   }
  //   if (selectedDate) {
  //     if (pickerMode === "date") {
  //       const newDate = new Date(selectedDate);
  //       newDate.setHours(endDate.getHours());
  //       newDate.setMinutes(endDate.getMinutes());
  //       setEndDate(newDate);
  //       if (Platform.OS === "android") {
  //         setPickerMode("time");
  //         setTimeout(() => setShowEndPicker(true), 100);
  //       }
  //     } else {
  //       const newDate = new Date(endDate);
  //       newDate.setHours(selectedDate.getHours());
  //       newDate.setMinutes(selectedDate.getMinutes());
  //       setEndDate(newDate);
  //       setPickerMode("date");
  //     }
  //   }
  // };

  const openStartPicker = () => {
    setPickerMode("date");
    setShowStartPicker(true);
    setShowEndPicker(false);
    if (Platform.OS === "ios") {
      // On iOS, show both date and time pickers together
      setTimeout(() => {
        setPickerMode("time");
      }, 100);
    }
  };

  const openEndPicker = () => {
    setPickerMode("date");
    setShowEndPicker(true);
    setShowStartPicker(false);
    if (Platform.OS === "ios") {
      // On iOS, show both date and time pickers together
      setTimeout(() => {
        setPickerMode("time");
      }, 100);
    }
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
                  maxHeight: SCREEN_HEIGHT * 0.85,
                },
              ]}
            >
              <View style={styles.content}>
                <Text style={styles.title}>
                  {editingItem ? t.editItem : t.addItem}
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t.title} *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t.enterTitle}
                    placeholderTextColor={Theme.colors.textLight}
                    value={title}
                    onChangeText={setTitle}
                    maxLength={100}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t.description}</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder={t.optional}
                    placeholderTextColor={Theme.colors.textLight}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={2}
                    maxLength={200}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.dateTimeRow}>
                  <View style={styles.dateTimeGroup}>
                    <Text style={styles.label}>{t.start} *</Text>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={openStartPicker}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={18}
                        color={Theme.colors.primary}
                      />
                      <Text style={styles.dateButtonText} numberOfLines={1}>
                        {formatDateTime(startDate)}
                      </Text>
                    </TouchableOpacity>
                    {showStartPicker && (
                      <View style={styles.pickerContainer}>
                        <DateTimePicker
                          value={startDate}
                          mode="date"
                          display={
                            Platform.OS === "ios" ? "compact" : "default"
                          }
                          onChange={(event, selectedDate) => {
                            if (Platform.OS === "android") {
                              setShowStartPicker(false);
                            }
                            if (selectedDate) {
                              const newDate = new Date(selectedDate);
                              newDate.setHours(startDate.getHours());
                              newDate.setMinutes(startDate.getMinutes());
                              setStartDate(newDate);
                              if (Platform.OS === "android") {
                                setTimeout(() => {
                                  setPickerMode("time");
                                  setShowStartPicker(true);
                                }, 100);
                              }
                            }
                          }}
                          minimumDate={new Date()}
                          style={styles.picker}
                        />
                        {Platform.OS === "ios" && (
                          <DateTimePicker
                            value={startDate}
                            mode="time"
                            display="compact"
                            onChange={(event, selectedTime) => {
                              if (selectedTime) {
                                const newDate = new Date(startDate);
                                newDate.setHours(selectedTime.getHours());
                                newDate.setMinutes(selectedTime.getMinutes());
                                setStartDate(newDate);
                              }
                            }}
                            style={styles.picker}
                          />
                        )}
                      </View>
                    )}
                  </View>

                  <View style={styles.dateTimeGroup}>
                    <Text style={styles.label}>{t.end} *</Text>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={openEndPicker}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={18}
                        color={Theme.colors.primary}
                      />
                      <Text style={styles.dateButtonText} numberOfLines={1}>
                        {formatDateTime(endDate)}
                      </Text>
                    </TouchableOpacity>
                    {showEndPicker && (
                      <View style={styles.pickerContainer}>
                        <DateTimePicker
                          value={endDate}
                          mode="date"
                          display={
                            Platform.OS === "ios" ? "compact" : "default"
                          }
                          onChange={(event, selectedDate) => {
                            if (Platform.OS === "android") {
                              setShowEndPicker(false);
                            }
                            if (selectedDate) {
                              const newDate = new Date(selectedDate);
                              newDate.setHours(endDate.getHours());
                              newDate.setMinutes(endDate.getMinutes());
                              setEndDate(newDate);
                              if (Platform.OS === "android") {
                                setTimeout(() => {
                                  setPickerMode("time");
                                  setShowEndPicker(true);
                                }, 100);
                              }
                            }
                          }}
                          minimumDate={startDate}
                          style={styles.picker}
                        />
                        {Platform.OS === "ios" && (
                          <DateTimePicker
                            value={endDate}
                            mode="time"
                            display="compact"
                            onChange={(event, selectedTime) => {
                              if (selectedTime) {
                                const newDate = new Date(endDate);
                                newDate.setHours(selectedTime.getHours());
                                newDate.setMinutes(selectedTime.getMinutes());
                                setEndDate(newDate);
                              }
                            }}
                            style={styles.picker}
                          />
                        )}
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={onClose}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelButtonText}>{t.cancel}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.saveButton,
                      !title.trim() && styles.saveButtonDisabled,
                    ]}
                    onPress={handleSave}
                    activeOpacity={0.7}
                    disabled={!title.trim()}
                  >
                    <Text style={styles.saveButtonText}>
                      {editingItem ? t.save : t.add}
                    </Text>
                  </TouchableOpacity>
                </View>
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
    width: "100%",
    maxWidth: 400,
    ...Theme.shadows.lg,
  },
  content: {
    padding: Theme.spacing.lg,
  },
  title: {
    fontSize: 20,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: Theme.spacing.md,
  },
  label: {
    fontSize: 12,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  input: {
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.sm,
    fontSize: 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.text,
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
    minHeight: 40,
  },
  textArea: {
    minHeight: 60,
    paddingTop: Theme.spacing.sm,
  },
  dateTimeRow: {
    flexDirection: "row",
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  dateTimeGroup: {
    flex: 1,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
    gap: Theme.spacing.xs,
    minHeight: 40,
  },
  dateButtonText: {
    fontSize: 12,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.text,
    flex: 1,
  },
  pickerContainer: {
    marginTop: Theme.spacing.xs,
    flexDirection: Platform.OS === "ios" ? "row" : "column",
    gap: Platform.OS === "ios" ? Theme.spacing.xs : 0,
  },
  picker: {
    flex: Platform.OS === "ios" ? 1 : undefined,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: Theme.spacing.md,
    marginTop: Theme.spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: Theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  saveButton: {
    backgroundColor: Theme.colors.primaryDark,
  },
  saveButtonDisabled: {
    opacity: 0.5,
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
});
