import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Switch,
} from "react-native";
import { Theme } from "../constants/Theme";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useLanguage } from "../constants/LanguageContext";

const { height, width } = Dimensions.get("window");
const isTablet = width - 80 > height * 0.5;

const translations = {
  en: {
    advancedFilters: "Advanced Filters",
    mediCalEligibility: "Medi-Cal Eligibility",
    showOnlyMediCal: "Show only Medi-Cal eligible resources",
    natureOfResource: "Nature of Resource",
    availability: "Availability",
    selectDaysWhenNeeded: "Select days when you need the resource to be open",
    distanceRadius: "Distance Radius",
    clearAll: "Clear All",
    applyFilters: "Apply Filters",
    all: "All",
    dentist: "Dentist",
    gym: "Gym",
    clinic: "Clinic",
    hospital: "Hospital",
    pharmacy: "Pharmacy",
    mentalHealth: "Mental Health",
    nutrition: "Nutrition",
    visionCare: "Vision Care",
    specialist: "Specialist",
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  },
  es: {
    advancedFilters: "Filtros Avanzados",
    mediCalEligibility: "Elegibilidad de Medi-Cal",
    showOnlyMediCal: "Mostrar solo recursos elegibles para Medi-Cal",
    natureOfResource: "Naturaleza del Recurso",
    availability: "Disponibilidad",
    selectDaysWhenNeeded:
      "Selecciona los días cuando necesites que el recurso esté abierto",
    distanceRadius: "Radio de Distancia",
    clearAll: "Limpiar Todo",
    applyFilters: "Aplicar Filtros",
    all: "Todo",
    dentist: "Dentista",
    gym: "Gimnasio",
    clinic: "Clínica",
    hospital: "Hospital",
    pharmacy: "Farmacia",
    mentalHealth: "Salud Mental",
    nutrition: "Nutrición",
    visionCare: "Cuidado de la Visión",
    specialist: "Especialista",
    monday: "Lunes",
    tuesday: "Martes",
    wednesday: "Miércoles",
    thursday: "Jueves",
    friday: "Viernes",
    saturday: "Sábado",
    sunday: "Domingo",
  },
};

interface AdvancedFilterPopupProps {
  visible: boolean;
  onDismiss: () => void;
  onApplyFilters?: (filters: FilterOptions) => void;
}

interface FilterOptions {
  mediCalEligible: boolean;
  resourceTypes: string[];
  availability: {
    [key: string]: boolean;
  };
  maxRadius: number;
}

export const AdvancedFilterPopup: React.FC<AdvancedFilterPopupProps> = ({
  visible,
  onDismiss,
  onApplyFilters,
}) => {
  const { language } = useLanguage();
  const t =
    translations[language as keyof typeof translations] || translations.en;
  // Filter state
  const [mediCalEligible, setMediCalEligible] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["All"]);
  const [availability, setAvailability] = useState<{ [key: string]: boolean }>({
    Monday: false,
    Tuesday: false,
    Wednesday: false,
    Thursday: false,
    Friday: false,
    Saturday: false,
    Sunday: false,
  });
  const [radius, setRadius] = useState(10); // Default 10 miles

  const resourceTypes = [
    "All",
    "Dentist",
    "Gym",
    "Clinic",
    "Hospital",
    "Pharmacy",
    "Mental Health",
    "Nutrition",
    "Vision Care",
    "Specialist",
  ];

  const getTranslatedType = (type: string): string => {
    const typeMap: { [key: string]: keyof typeof t } = {
      All: "all",
      Dentist: "dentist",
      Gym: "gym",
      Clinic: "clinic",
      Hospital: "hospital",
      Pharmacy: "pharmacy",
      "Mental Health": "mentalHealth",
      Nutrition: "nutrition",
      "Vision Care": "visionCare",
      Specialist: "specialist",
    };
    return t[typeMap[type]] || type;
  };

  const getTranslatedDay = (day: string): string => {
    const dayMap: { [key: string]: keyof typeof t } = {
      Monday: "monday",
      Tuesday: "tuesday",
      Wednesday: "wednesday",
      Thursday: "thursday",
      Friday: "friday",
      Saturday: "saturday",
      Sunday: "sunday",
    };
    return t[dayMap[day]] || day;
  };

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const handleTypeSelect = (type: string) => {
    if (type === "All") {
      setSelectedTypes(["All"]);
    } else {
      const newTypes = [...selectedTypes];
      if (newTypes.includes("All")) {
        newTypes.splice(newTypes.indexOf("All"), 1);
      }

      if (newTypes.includes(type)) {
        newTypes.splice(newTypes.indexOf(type), 1);
        if (newTypes.length === 0) {
          newTypes.push("All");
        }
      } else {
        newTypes.push(type);
      }
      setSelectedTypes(newTypes);
    }
  };

  const toggleAvailability = (day: string) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: !prev[day],
    }));
  };

  const handleApplyFilters = () => {
    const filters: FilterOptions = {
      mediCalEligible,
      resourceTypes: selectedTypes,
      availability,
      maxRadius: radius,
    };

    onApplyFilters?.(filters);
    onDismiss();
  };

  const handleClearFilters = () => {
    setMediCalEligible(true);
    setSelectedTypes(["All"]);
    setAvailability({
      Monday: false,
      Tuesday: false,
      Wednesday: false,
      Thursday: false,
      Friday: false,
      Saturday: false,
      Sunday: false,
    });
    setRadius(10);
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.content, { maxHeight: height * 0.85 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>{t.advancedFilters}</Text>
          <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Theme.colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Medi-Cal Eligibility Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.mediCalEligibility}</Text>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t.showOnlyMediCal}</Text>
              <Switch
                value={mediCalEligible}
                onValueChange={setMediCalEligible}
                trackColor={{
                  false: Theme.colors.border,
                  true: Theme.colors.primaryDark,
                }}
                thumbColor={Theme.colors.backgroundLight}
              />
            </View>
          </View>

          {/* Resource Type Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.natureOfResource}</Text>
            <View style={styles.chipContainer}>
              {resourceTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.chip,
                    selectedTypes.includes(type) && styles.chipSelected,
                  ]}
                  onPress={() => handleTypeSelect(type)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedTypes.includes(type) && styles.chipTextSelected,
                    ]}
                  >
                    {getTranslatedType(type)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Availability Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.availability}</Text>
            <Text style={styles.sectionSubtitle}>{t.selectDaysWhenNeeded}</Text>
            <View style={styles.availabilityContainer}>
              {daysOfWeek.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayChip,
                    availability[day] && styles.dayChipSelected,
                  ]}
                  onPress={() => toggleAvailability(day)}
                >
                  <Text
                    style={[
                      styles.dayChipText,
                      availability[day] && styles.dayChipTextSelected,
                    ]}
                  >
                    {getTranslatedDay(day).slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Radius Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.distanceRadius}</Text>
            <View style={styles.radiusContainer}>
              <Text style={styles.radiusValue}>{radius} miles</Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={50}
                step={1}
                value={radius}
                onValueChange={setRadius}
                minimumTrackTintColor={Theme.colors.primaryDark}
                maximumTrackTintColor={Theme.colors.border}
                thumbTintColor={Theme.colors.primaryDark}
              />
              <View style={styles.radiusLabels}>
                <Text style={styles.radiusLabel}>1 mi</Text>
                <Text style={styles.radiusLabel}>25 mi</Text>
                <Text style={styles.radiusLabel}>50 mi</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={handleClearFilters}
          >
            <Text style={styles.clearButtonText}>{t.clearAll}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.applyButton]}
            onPress={handleApplyFilters}
          >
            <Text style={styles.applyButtonText}>{t.applyFilters}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  content: {
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.xl,
    // borderTopRightRadius: Theme.borderRadius.xl,
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xl,
    height: height * 0.7,
    width: isTablet ? "80%" : "90%",
    marginHorizontal: Theme.spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.lg,
  },
  title: {
    fontSize: 24,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
    fontWeight: "bold",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    ...Theme.shadows.sm,
  },
  scrollContent: {
    flex: 1,
  },
  section: {
    marginBottom: Theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.md,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Theme.colors.background,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    ...Theme.shadows.sm,
  },
  switchLabel: {
    fontSize: 16,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.text,
    flex: 1,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Theme.spacing.sm,
  },
  chip: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  chipSelected: {
    backgroundColor: Theme.colors.primaryDark,
    borderColor: Theme.colors.primaryDark,
  },
  chipText: {
    fontSize: 14,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.text,
  },
  chipTextSelected: {
    color: Theme.colors.backgroundLight,
  },
  availabilityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  dayChipSelected: {
    backgroundColor: Theme.colors.primaryDark,
    borderColor: Theme.colors.primaryDark,
  },
  dayChipText: {
    fontSize: 12,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.text,
  },
  dayChipTextSelected: {
    color: Theme.colors.backgroundLight,
  },
  radiusContainer: {
    backgroundColor: Theme.colors.background,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    ...Theme.shadows.sm,
  },
  radiusValue: {
    fontSize: 16,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.primaryDark,
    textAlign: "center",
    marginBottom: Theme.spacing.md,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  radiusLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Theme.spacing.xs,
  },
  radiusLabel: {
    fontSize: 12,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textSecondary,
  },
  footer: {
    flexDirection: "row",
    gap: Theme.spacing.md,
    paddingTop: Theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderLight,
  },
  button: {
    flex: 1,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  clearButton: {
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  applyButton: {
    backgroundColor: Theme.colors.primaryDark,
  },
  clearButtonText: {
    fontSize: 16,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
  },
  applyButtonText: {
    fontSize: 16,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.background,
  },
});
