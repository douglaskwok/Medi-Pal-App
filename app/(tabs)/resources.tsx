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
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import { Theme } from "../../constants/Theme";
import { dummyResources } from "../../constants/DummyData";
import { ResourceCard } from "../../components/ResourceCard";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { CustomTabBar } from "./_layout";
import { supabase } from "../../lib/supabase";
import { useLocalSearchParams } from "expo-router";
import { AdvancedFilterPopup } from "../../components/AdvancedFilterPopup";
import * as Location from "expo-location";

// import type { DirectionsLeg, DirectionsStep } from "@types/google.maps";
import SelectionModal from "../../components/selectionModal";
import AreYouSurePopup from "../../components/AreYouSurePopup";
import { LanguageProvider, useLanguage } from "../../constants/LanguageContext";

const { width, height } = Dimensions.get("window");
const isTablet = width - 80 > height * 0.5;
const MAP_HEIGHT = Platform.OS === "ios" ? height * 0.35 : height * 0.4;
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const dismissKeyboard = () => {
  Keyboard.dismiss();
};
interface Place {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

interface DirectionStep {
  distance?: { text: string; value: number };
  duration?: { text: string; value: number };
  html_instructions?: string;
  maneuver?: string;
}

// interface StepData {
//   distance: { text: string; value: number };
//   duration: { text: string; value: number };
//   html_instructions: string;
//   maneuver?: string;
// }

interface SavedResource {
  id: string;
  user_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  place_id?: string;
  created_at: string;
}

const STANFORD_COORDS = {
  latitude: 37.4275,
  longitude: -122.1695,
};
export function deterministicPhoneNumber(inputString: string): string {
  // Create a consistent hash
  let hash = 0;
  for (let i = 0; i < inputString.length; i++) {
    const char = inputString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = Math.abs(hash & 0xffffffff); // Ensure positive 32-bit
  }

  // Format as phone number (ensuring 10 digits)
  const baseNumber = hash % 10000000000;
  const phoneStr = baseNumber.toString().padStart(10, "0");
  const formattedPhoneStr = phoneStr.replace(
    /(\d{3})(\d{3})(\d{4})/,
    "$1-$2-$3"
  );

  return formattedPhoneStr;
}
export function getFirstWord(text: string): string {
  if (!text || typeof text !== "string") return "";

  // Split by whitespace and get first element
  const words = text.trim().split(/\s+/);
  return words[0].toLowerCase() || "";
}
const translations = {
  en: {
    resources: "Resources",
    searchPlaceholder: "Search for resources...",
    nearbyResources: "Nearby Resources",
    savedResources: "Saved Resources",
    eligibility: "You are eligible for this service",
    startRoute: "Start Route",
    imHere: "I'm here!",
    noSavedResources: "No saved resources",
    loadingDirections: "Loading directions...",
    calculatingRoute: "Calculating the best route",
    loadingResource: "Loading resource...",
    funFact:
      "Medi-Pal has a database of thousands of free Medi-Cal resources in California.",
    savedSuccessfully: "Saved Successfully",
    deletedSuccessfully: "Deleted Successfully",
    endRouteConfirm: "End Route?",
    endRouteMessage: "Are you sure you want to end the current route?",
    cancel: "Cancel",
    endRoute: "End Route",
    yourLocation: "Your Location",
    locationDescription: "550 Lasuen Mall, Stanford, CA 94305",
    autocompleteInstructions: "Type to search for places...",
    distanceUnit: "mi",
    hours: "h",
    minutes: "m",
    delete: "Delete",
    add: "Add",
    close: "Close",
    filter: "Filter",
    location: "Location",
    phone: "Phone",
    email: "Email",
    hoursTitle: "Hours",
    save: "Save",
    unsave: "Unsave",
    saveResource: "Save Resource",
    unsaveResource: "Unsave Resource",
    getDirections: "Get Directions",
    currentRoute: "Current Route",
    clearSearch: "Clear Search",
    viewDetails: "View Details",
    expand: "Expand",
    collapse: "Collapse",
    retry: "Retry",
    errorLoading: "Error loading resources",
    tryAgain: "Try Again",
    networkError: "Network Error",
    checkConnection: "Please check your internet connection",

    startRouteButton: "Start Route",
  },
  es: {
    resources: "Recursos",
    searchPlaceholder: "Buscar recursos...",
    nearbyResources: "Recursos Cercanos",
    savedResources: "Recursos Guardados",
    eligibility: "Eres elegible para este servicio",
    startRoute: "Comenzar Ruta",
    imHere: "¡Estoy aquí!",
    noSavedResources: "No hay recursos guardados",
    loadingDirections: "Cargando indicaciones...",
    calculatingRoute: "Calculando la mejor ruta",
    loadingResource: "Cargando recurso...",
    funFact:
      "Medi-Pal tiene una base de datos de miles de recursos gratuitos de Medi-Cal en California.",
    savedSuccessfully: "Guardado Exitosamente",
    deletedSuccessfully: "Eliminado Exitosamente",
    endRouteConfirm: "¿Terminar Ruta?",
    endRouteMessage: "¿Estás seguro de que quieres terminar la ruta actual?",
    cancel: "Cancelar",
    endRoute: "Terminar Ruta",
    yourLocation: "Tu Ubicación",
    locationDescription: "550 Lasuen Mall, Stanford, CA 94305",
    autocompleteInstructions: "Escribe para buscar lugares...",
    distanceUnit: "millas",
    hours: "h",
    minutes: "m",
    delete: "Eliminar",
    add: "Añadir",
    close: "Cerrar",
    filter: "Filtrar",
    location: "Ubicación",
    phone: "Teléfono",
    email: "Correo Electrónico",
    hoursTitle: "Horario",
    save: "Guardar",
    unsave: "Quitar",
    saveResource: "Guardar Recurso",
    unsaveResource: "Quitar Recurso",
    getDirections: "Obtener Indicaciones",
    currentRoute: "Ruta Actual",
    clearSearch: "Limpiar Búsqueda",
    viewDetails: "Ver Detalles",
    expand: "Expandir",
    collapse: "Colapsar",
    retry: "Reintentar",
    errorLoading: "Error al cargar recursos",
    tryAgain: "Intentar Nuevamente",
    networkError: "Error de Red",
    checkConnection: "Por favor verifica tu conexión a internet",
    startRouteButton: "Comenzar Ruta",
  },
};

export default function ResourcesScreen() {
  const { language } = useLanguage();
  const t =
    translations[language as keyof typeof translations] || translations.en;
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  }>(STANFORD_COORDS);
  const [region, setRegion] = useState({
    latitude: STANFORD_COORDS.latitude,
    longitude: STANFORD_COORDS.longitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinate[]>(
    []
  );
  const [directionSteps, setDirectionSteps] = useState<DirectionStep[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<{
    latitude: number;
    longitude: number;
    name: string;
    address?: string;
  } | null>(null);
  // const [tipsShown, setTipsShown] = useState(false);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const prepTipsChecklist = [
    { id: "1", title: "Arrive 10 minutes early.", completed: false },
    { id: "2", title: "Bring your Medi-Cal card.", completed: false },
    { id: "3", title: "Bring a photo ID", completed: false },
    // { id: '4', title: 'Have water and snacks available', completed: false },
    // { id: '5', title: 'Take breaks every 2 hours if driving long distance', completed: false },
    // { id: '6', title: 'Keep emergency contacts accessible', completed: false },
  ];
  const [tipsChecklist, setTipsChecklist] = useState(prepTipsChecklist);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [routeStarted, setRouteStarted] = useState(false);
  const [selectedResourceForDirections, setSelectedResourceForDirections] =
    useState<(typeof dummyResources)[0] | null>(null);
  const [selectedSavedResource, setSelectedSavedResource] =
    useState<SavedResource | null>(null);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<number>(0);
  const [autocompleteResults, setAutocompleteResults] = useState<Place[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [savedResources, setSavedResources] = useState<SavedResource[]>([]);
  const [activeTab, setActiveTab] = useState<"nearby" | "saved">("nearby");
  const [showDetails, setShowDetails] = useState(false);
  const [showSaveOption, setShowSaveOption] = useState(false);
  const [showSaveSuccessModal, setShowSaveSuccessModal] = useState(false);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [showEndRouteModal, setShowEndRouteModal] = useState(false);
  const [isResourceSaved, setIsResourceSaved] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const successModalAnim = useRef(new Animated.Value(0)).current;
  const successModalScale = useRef(new Animated.Value(0.9)).current;
  const mapRef = useRef<MapView>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isLoadingDirections, setIsLoadingDirections] = useState(false);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const containerRef = useRef(null);
  // console.log(selectedSavedResource);
  // console.log(selectedDestination?.address);
  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        console.warn("Location permission not granted");
        // Use Stanford as fallback if permission denied
        const fallbackRegion = {
          latitude: STANFORD_COORDS.latitude,
          longitude: STANFORD_COORDS.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(fallbackRegion);
        if (mapRef.current) {
          mapRef.current.animateToRegion(fallbackRegion, 1000);
        }
        return {
          latitude: STANFORD_COORDS.latitude,
          longitude: STANFORD_COORDS.longitude,
        };
      }

      const location = await Location.getCurrentPositionAsync();

      if (location) {
        const userRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };

        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        setRegion(userRegion);

        if (mapRef.current) {
          mapRef.current.animateToRegion(userRegion, 1000);
        }

        return {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
      }
    } catch (error) {
      console.warn("Error getting location:", error);
      // Fallback to Stanford on error
      const fallbackRegion = {
        latitude: STANFORD_COORDS.latitude,
        longitude: STANFORD_COORDS.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(fallbackRegion);
      if (mapRef.current) {
        mapRef.current.animateToRegion(fallbackRegion, 1000);
      }
      return {
        latitude: STANFORD_COORDS.latitude,
        longitude: STANFORD_COORDS.longitude,
      };
    }
  };
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    getLocation();
    loadSavedResources();
  }, []);
  console.log(userLocation);
  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        Keyboard.dismiss();
      }
    );

    return () => {
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    // Handle navigation from home page or notification
    const handleNavigation = async () => {
      // Get the user's current location and use the returned value
      const currentLocation = await getLocation();

      if (params.resourceId) {
        // Handle resource selection from home page
        const resource = dummyResources.find((r) => r.id === params.resourceId);
        if (resource) {
          handleResourceSelect(resource, currentLocation);
        }
      } else if (params.name && params.latitude && params.longitude) {
        // Handle custom resource from notification (YMCA)
        const yMCAResource = {
          id: "ymca_palo_alto",
          name: params.name as string,
          type: "Gym",
          address:
            (params.address as string) || "3412 Ross Road, Palo Alto, CA 94303",
          latitude: parseFloat(params.latitude as string),
          longitude: parseFloat(params.longitude as string),
          rating: params.rating || 4.5,
          distance: params.distance || "2.3 mi",
          image: require("../../assets/generic.jpg"),
          phone: params.phone || "650-856-9622",
          email: params.email || "membersupport@ymcasv.org",
          hours:
            params.hours ||
            "Mon: 6:15am-9pm\nTue: 6:15am-9pm\nWed: 6:15am-9pm\nThu: CLOSED\nFri: 6:15am-1pm\nSat: 8am-4pm\nSun: 9am-4pm",
        };
        console.log("User location:", currentLocation);
        // Now using the actual user location returned from getLocation
        handleResourceSelect(
          yMCAResource as (typeof dummyResources)[0],
          currentLocation
        );
      }
    };

    if (params.resourceId || params.name) {
      handleNavigation();
    }
  }, [params.resourceId, params.name, params.latitude, params.longitude]);
  useEffect(() => {
    // Check if current destination/resource is saved
    if (selectedDestination) {
      const saved = savedResources.find(
        (r) =>
          r.name === selectedDestination.name &&
          Math.abs(r.latitude - selectedDestination.latitude) < 0.0001 &&
          Math.abs(r.longitude - selectedDestination.longitude) < 0.0001
      );
      setIsResourceSaved(!!saved);
    } else if (selectedResourceForDirections) {
      const saved = savedResources.find(
        (r) =>
          r.name === selectedResourceForDirections.name &&
          Math.abs(r.latitude - selectedResourceForDirections.latitude) <
            0.0001 &&
          Math.abs(r.longitude - selectedResourceForDirections.longitude) <
            0.0001
      );
      setIsResourceSaved(!!saved);
    } else {
      setIsResourceSaved(false);
    }
  }, [selectedDestination, selectedResourceForDirections, savedResources]);

  // supabase listener:

  useEffect(() => {
    // Set up real-time subscription for saved resources
    const channel = supabase
      .channel("saved_resources_changes")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events
          schema: "public",
          table: "saved_resources",
        },
        () => {
          // Refresh saved resources when any change occurs
          loadSavedResources();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  const loadSavedResources = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("saved_resources")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) {
        setSavedResources(data);
      }
    } catch (error) {
      console.error("Error loading saved resources:", error);
    }
  };

  const saveResource = async (resource: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    place_id?: string;
  }) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("saved_resources").insert({
        user_id: user.id,
        name: resource.name,
        address: resource.address,
        latitude: resource.latitude,
        longitude: resource.longitude,
        place_id: resource.place_id || null,
      });

      if (error) throw error;
      await loadSavedResources();
      setShowSaveOption(false);
      setIsResourceSaved(true);
      setShowSaveSuccessModal(true);
      Animated.parallel([
        Animated.timing(successModalAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(successModalScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(successModalAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(successModalScale, {
            toValue: 0.9,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShowSaveSuccessModal(false);
        });
      }, 2000);
    } catch (error) {
      console.error("Error saving resource:", error);
      Alert.alert("Error", "Failed to save resource");
    }
  };

  const deleteSavedResource = async (resourceId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("saved_resources")
        .delete()
        .eq("id", resourceId)
        .eq("user_id", user.id);

      if (error) throw error;
      await loadSavedResources();
      setShowDeleteSuccessModal(true);
      Animated.parallel([
        Animated.timing(successModalAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(successModalScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(successModalAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(successModalScale, {
            toValue: 0.9,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShowDeleteSuccessModal(false);
        });
      }, 2000);
    } catch (error) {
      console.error("Error deleting saved resource:", error);
      Alert.alert("Error", "Failed to delete resource");
    }
  };

  const unsaveResource = async () => {
    if (!selectedDestination) return;
    const savedResource = savedResources.find(
      (r) =>
        r.name === selectedDestination.name &&
        Math.abs(r.latitude - selectedDestination.latitude) < 0.0001 &&
        Math.abs(r.longitude - selectedDestination.longitude) < 0.0001
    );
    if (savedResource) {
      await deleteSavedResource(savedResource.id);
      setIsResourceSaved(false);
    }
  };

  useEffect(() => {
    if (searchQuery.length > 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        fetchAutocompleteResults(searchQuery);
      }, 300);
    } else {
      setAutocompleteResults([]);
      setShowAutocomplete(false);
    }
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const fetchAutocompleteResults = async (query: string) => {
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn("Google Maps API key not found");
      return;
    }

    try {
      const location = userLocation || {
        latitude: region.latitude,
        longitude: region.longitude,
      };
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query
        )}&location=${location.latitude},${
          location.longitude
        }&radius=50000&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      if (data.predictions) {
        setAutocompleteResults(data.predictions);
        setShowAutocomplete(true);
      }
    } catch (error) {
      console.error("Error fetching autocomplete:", error);
    }
  };

  const truncateAddress = (address: string, maxLength: number = 40) => {
    if (address.length <= maxLength) return address;
    return address.substring(0, maxLength) + "...";
  };

  const handlePlaceSelect = async (place: Place) => {
    const truncatedAddress = truncateAddress(place.description);
    setSearchQuery(truncatedAddress);
    setShowAutocomplete(false);
    setAutocompleteResults([]);
    setSearchQuery(""); // Clear search query to prevent autocomplete from reopening
    setIsLoadingSearch(true);

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      if (data.result && data.result.geometry) {
        const { lat, lng } = data.result.geometry.location;
        const destination = {
          latitude: lat,
          longitude: lng,
          name: place.structured_formatting.main_text,
          address: place.description,
        };
        setSelectedDestination(destination);
        setSelectedResourceForDirections(null);
        setSelectedSavedResource(null);
        setRouteStarted(false);
        setSelectedResource(null);
        setShowDetails(false);
        setShowSaveOption(false);

        await getDirections(
          //userLocation || STANFORD_COORDS,
          destination
        );
      }
    } catch (error) {
      console.error("Error fetching place details:", error);
    } finally {
      setIsLoadingSearch(false);
    }
  };

  const decodePolyline = (encoded: string): RouteCoordinate[] => {
    const coordinates: RouteCoordinate[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
      let byte: number;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += deltaLat;

      shift = 0;
      result = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += deltaLng;

      coordinates.push({
        latitude: lat * 1e-5,
        longitude: lng * 1e-5,
      });
    }

    return coordinates;
  };

  const getDirections = async (
    destination: {
      latitude: number;
      longitude: number;
      name: string;
      address?: string;
    },
    origin?: { latitude: number; longitude: number }
  ) => {
    if (!GOOGLE_MAPS_API_KEY) {
      Alert.alert("Error", "Google Maps API key not configured.");
      return;
    }
    setIsLoadingDirections(true);
    setRouteCoordinates([]);
    setDirectionSteps([]);

    try {
      // Use provided origin or fall back to state
      const actualOrigin = origin || userLocation;
      const originStr = `${actualOrigin.latitude},${actualOrigin.longitude}`;
      const destStr = `${destination.latitude},${destination.longitude}`;

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destStr}&key=${GOOGLE_MAPS_API_KEY}&mode=driving`
      );
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const decoded = decodePolyline(route.overview_polyline.points);
        setRouteCoordinates(decoded);
        setSelectedDestination(destination);

        const steps: DirectionStep[] = [];
        let totalDist = 0;
        let totalDur = 0;
        route.legs.forEach((leg: google.maps.DirectionsLeg) => {
          totalDist += leg?.distance?.value || 0;
          totalDur += leg?.duration?.value || 0;
          if (leg.steps) {
            leg.steps.forEach((step: DirectionStep) => {
              steps.push({
                distance: step.distance,
                duration: step.duration,
                html_instructions: step.html_instructions,
                maneuver: step.maneuver,
              });
            });
          }
        });
        setDirectionSteps(steps);
        setTotalDistance(totalDist);
        setTotalDuration(totalDur);

        if (mapRef.current && decoded.length > 0) {
          const minLat = Math.min(actualOrigin.latitude, destination.latitude);
          const maxLat = Math.max(actualOrigin.latitude, destination.latitude);
          const minLng = Math.min(
            actualOrigin.longitude,
            destination.longitude
          );
          const maxLng = Math.max(
            actualOrigin.longitude,
            destination.longitude
          );

          const latDelta = (maxLat - minLat) * 1.5;
          const lngDelta = (maxLng - minLng) * 1.5;

          const centerLat = (minLat + maxLat) / 2;
          const centerLng = (minLng + maxLng) / 2;

          const minDelta = 0.01;
          const finalLatDelta = Math.max(latDelta, minDelta);
          const finalLngDelta = Math.max(lngDelta, minDelta);

          mapRef.current.animateToRegion(
            {
              latitude: centerLat,
              longitude: centerLng,
              latitudeDelta: finalLatDelta,
              longitudeDelta: finalLngDelta,
            },
            1000
          );
        }
      } else {
        Alert.alert("Error", "No route found. Please try again.");
      }
    } catch (error) {
      console.error("Error getting directions:", error);
      Alert.alert("Error", "Could not get directions. Please try again.");
    } finally {
      setIsLoadingDirections(false);
    }
  };
  const LoadingOverlay = ({ mode }: { mode: "search" | "start_route" }) => (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingContainer}>
        <Animated.View style={styles.spinnerContainer}>
          <ActivityIndicator size={"large"} color={Theme.colors.primary} />
          {/* <Ionicons name="navigate" size={48} color={Theme.colors.primary} /> */}
        </Animated.View>
        <Text style={styles.loadingText}>
          {mode === "start_route"
            ? "Loading directions..."
            : "Loading resource..."}
        </Text>
        <Text style={styles.loadingSubtext}>
          {mode === "start_route"
            ? "Calculating the best route"
            : "Fun Fact: Medi-Pal has a database of thousands of free Medi-Cal resources in California."}
        </Text>
      </View>
    </View>
  );

  const handleResourceSelect = async (
    resource: (typeof dummyResources)[0],
    origin?: { latitude: number; longitude: number }
  ) => {
    setSelectedResource(resource.id);
    setSelectedResourceForDirections(resource);
    setSelectedSavedResource(null);
    setSelectedDestination(null);
    setRouteStarted(false);
    setShowDetails(true);
    setShowSaveOption(false);
    await getDirections(
      {
        latitude: resource.latitude,
        longitude: resource.longitude,
        name: resource.name,
      },
      origin
    );
  };

  const handleSavedResourceSelect = async (
    resource: SavedResource,
    origin?: { latitude: number; longitude: number }
  ) => {
    setSelectedSavedResource(resource);
    setSelectedResourceForDirections(null);
    const newDestination = {
      latitude: resource.latitude,
      longitude: resource.longitude,
      name: resource.name,
      address: resource.address,
    };
    setSelectedDestination(newDestination);

    setRouteStarted(false);
    setShowDetails(false);
    setShowSaveOption(false);
    await getDirections(
      {
        latitude: resource.latitude,
        longitude: resource.longitude,
        name: resource.name,
        address: resource.address,
      },
      origin
    );
    // console.log(resource.address);
    // console.log(selectedDestination);
  };
  // console.log(selectedDestination);
  const resetTipsChecklist = () => {
    setTipsChecklist(
      prepTipsChecklist.map((item) => ({ ...item, completed: false }))
    );
  };
  const handleStartRoute = () => {
    resetTipsChecklist();
    setShowTipsModal(true);
    return;
  };

  const handleStartRouteAfterTips = () => {
    // setTipsShown(true);
    setShowTipsModal(false);
    setRouteStarted(true);
    setShowDetails(false);
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude || STANFORD_COORDS.latitude,
          longitude: userLocation.longitude || STANFORD_COORDS.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
    }
    // setTipsShown(false);
  };

  const handleCancelDirections = () => {
    if (routeStarted) {
      setShowEndRouteModal(true);
    } else {
      setRouteCoordinates([]);
      setDirectionSteps([]);
      setSelectedDestination(null);
      setRouteStarted(false);
      setSelectedResourceForDirections(null);
      setSelectedSavedResource(null);
      setSelectedResource(null);
      setShowDetails(false);
      setShowSaveOption(false);
      setTotalDistance(0);
      setTotalDuration(0);
    }
  };

  const handleConfirmEndRoute = () => {
    setShowEndRouteModal(false);
    setRouteCoordinates([]);
    setDirectionSteps([]);
    setSelectedDestination(null);
    setRouteStarted(false);
    setSelectedResourceForDirections(null);
    setSelectedSavedResource(null);
    setSelectedResource(null);
    setShowDetails(false);
    setShowSaveOption(false);
    setTotalDistance(0);
    setTotalDuration(0);
  };

  const handleImHere = () => {
    //Alert.alert("Arrived!", "You have reached your destination.");
    handleCancelDirections();
  };

  const formatDistance = (meters: number): string => {
    const miles = meters * 0.000621371;
    return `${miles.toFixed(1)} mi`;
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const stripHtmlTags = (html: string): string => {
    return html.replace(/<[^>]*>/g, "").trim();
  };

  const filteredResources = dummyResources;

  const renderResourceDetails = () => {
    if (!selectedResourceForDirections) return null;
    const resource = selectedResourceForDirections;

    return (
      <View
        style={[styles.detailsSection, { paddingBottom: insets.bottom + 100 }]}
      >
        <View style={styles.detailsHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleCancelDirections}
          >
            <Ionicons
              name="close"
              size={isTablet ? 36 : 24}
              color={Theme.colors.text}
            />
          </TouchableOpacity>
          <View style={styles.detailsHeaderLeft}>
            <Text style={styles.detailsTitle} numberOfLines={1}>
              {resource.name.length > (isTablet ? 40 : 30)
                ? resource.name.substring(0, 30) + "..."
                : resource.name}
            </Text>
          </View>
          <View style={styles.routeControls}>
            <TouchableOpacity
              style={[
                styles.saveResourceCircularButton,
                isResourceSaved && styles.unsaveResourceCircularButton,
              ]}
              onPress={() => {
                if (isResourceSaved) {
                  unsaveResource();
                } else if (selectedResourceForDirections) {
                  saveResource({
                    name: selectedResourceForDirections.name,
                    address: selectedResourceForDirections.address,
                    latitude: selectedResourceForDirections.latitude,
                    longitude: selectedResourceForDirections.longitude,
                  });
                }
              }}
            >
              <Ionicons
                name={isResourceSaved ? "trash-outline" : "add"}
                size={isTablet ? 24 : 18}
                color={
                  isResourceSaved
                    ? Theme.colors.backgroundLight
                    : Theme.colors.text
                }
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.startRouteButton}
              onPress={handleStartRoute}
            >
              <Text style={styles.startRouteText}>{t.startRoute}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView
          style={styles.detailsContent}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[styles.eligibilityRow, { marginBottom: Theme.spacing.md }]}
          >
            <Ionicons
              name="checkmark-circle"
              size={isTablet ? 26 : 20}
              color={Theme.colors.success}
            />
            <Text style={styles.eligibilityText}>{t.eligibility}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons
              name="location-outline"
              size={isTablet ? 24 : 18}
              color={Theme.colors.primary}
            />
            <Text style={styles.detailText}>{resource.address}</Text>
          </View>
          {resource.phone && (
            <View style={styles.detailRow}>
              <Ionicons
                name="call-outline"
                size={isTablet ? 24 : 18}
                color={Theme.colors.primary}
              />
              <Text style={styles.detailText}>{resource.phone}</Text>
            </View>
          )}
          {resource.email && (
            <View style={styles.detailRow}>
              <Ionicons
                name="mail-outline"
                size={isTablet ? 24 : 18}
                color={Theme.colors.primary}
              />
              <Text style={styles.detailText}>{resource.email}</Text>
            </View>
          )}
          {resource.hours && (
            <View style={styles.detailRow}>
              <Ionicons
                name="time-outline"
                size={isTablet ? 24 : 18}
                color={Theme.colors.primary}
              />
              <View style={{ flex: 1 }}>
                {resource.hours.split("\n").map((dayHours, index) => (
                  <Text key={index} style={styles.detailText}>
                    {dayHours.trim()}
                  </Text>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  const renderDirections = () => {
    if (!routeStarted || directionSteps.length === 0) return null;
    const destinationName =
      selectedDestination?.name ||
      selectedResourceForDirections?.name ||
      selectedSavedResource?.name ||
      "Directions";

    return (
      <View style={styles.directionsSection}>
        <View style={styles.directionsHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              if (routeStarted) {
                setShowEndRouteModal(true);
              } else {
                handleCancelDirections();
              }
            }}
          >
            <Ionicons name="close" size={24} color={Theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.directionsHeaderLeft}>
            <Text style={styles.directionsTitle} numberOfLines={1}>
              {destinationName.length > 30
                ? destinationName.substring(0, 30) + "..."
                : destinationName}
            </Text>
            <View style={styles.directionsMeta}>
              <Text style={styles.directionsMetaText}>
                {formatDistance(totalDistance)}
              </Text>
              <Text style={styles.directionsMetaText}>•</Text>
              <Text style={styles.directionsMetaText}>
                {formatDuration(totalDuration)}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.routeControlButton, styles.imHereButton]}
            onPress={handleImHere}
          >
            <Text style={[styles.routeControlText, styles.imHereText]}>
              {t.imHere}
            </Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.stepsList}>
          {directionSteps.map((step: DirectionStep, index: number) => (
            <View key={index} style={styles.directionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepInstruction}>
                  {stripHtmlTags(step?.html_instructions || "")}
                </Text>
                <View style={styles.stepMeta}>
                  <Text style={styles.stepDistance}>
                    {step?.distance?.text || "N/A"}
                  </Text>
                  <Text style={styles.stepDuration}>
                    {step?.duration?.text || "N/A"}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} ref={containerRef}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            paddingBottom: insets.bottom + 80,
          },
        ]}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Image
                source={require("../../assets/icon.png")}
                style={styles.headerLogo}
                resizeMode="contain"
              />
              <Text style={styles.title}>{t.resources}</Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.searchContainer}>
            <Ionicons
              name="search-outline"
              size={isTablet ? 32 : 20}
              color={Theme.colors.text}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={t.searchPlaceholder}
              placeholderTextColor={Theme.colors.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => {
                if (autocompleteResults.length > 0) {
                  setShowAutocomplete(true);
                }
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery("");
                  handleCancelDirections();
                  setShowAutocomplete(false);
                }}
              >
                <Ionicons
                  name="close-circle"
                  size={isTablet ? 32 : 20}
                  color={Theme.colors.text}
                />
              </TouchableOpacity>
            )}
            {searchQuery.length === 0 && (
              <TouchableOpacity
                onPress={() => {
                  dismissKeyboard(); // Add this line
                  setShowFilterPopup(true);
                }}
              >
                <FontAwesome
                  name="filter"
                  size={isTablet ? 32 : 20}
                  color={Theme.colors.text}
                />
              </TouchableOpacity>
            )}
          </View>
        </TouchableWithoutFeedback>
        {showAutocomplete && autocompleteResults.length > 0 && (
          <View style={styles.autocompleteContainer}>
            <ScrollView style={styles.autocompleteList}>
              {autocompleteResults.map((place) => (
                <TouchableOpacity
                  key={place.place_id}
                  style={styles.autocompleteItem}
                  onPress={() => handlePlaceSelect(place)}
                >
                  <Ionicons
                    name="location"
                    size={20}
                    color={Theme.colors.primary}
                  />
                  <View style={styles.autocompleteText}>
                    <Text style={styles.autocompleteMain} numberOfLines={1}>
                      {truncateAddress(
                        place.structured_formatting.main_text,
                        35
                      )}
                    </Text>
                    <Text
                      style={styles.autocompleteSecondary}
                      numberOfLines={1}
                    >
                      {truncateAddress(
                        place.structured_formatting.secondary_text,
                        40
                      )}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={region}
              region={region}
              showsUserLocation={false}
              showsMyLocationButton={false}
              showsCompass={true}
              showsTraffic={false}
              zoomEnabled={true}
              scrollEnabled={true}
              pitchEnabled={true}
              rotateEnabled={true}
              onRegionChangeComplete={setRegion}
            >
              <Marker
                coordinate={userLocation || STANFORD_COORDS}
                title="Your Location"
                description="550 Lasuen Mall, Stanford, CA 94305"
              >
                <View style={styles.stanfordMarker}>
                  <Ionicons
                    name="location"
                    size={24}
                    color={Theme.colors.primary}
                  />
                </View>
              </Marker>
              {!selectedDestination &&
                !showDetails &&
                filteredResources.map((resource) => (
                  <Marker
                    key={resource.id}
                    coordinate={{
                      latitude: resource.latitude,
                      longitude: resource.longitude,
                    }}
                    title={resource.name}
                    description={resource.address}
                    onPress={() => setSelectedResource(resource.id)}
                  >
                    <View
                      style={[
                        styles.marker,
                        selectedResource === resource.id &&
                          styles.markerSelected,
                      ]}
                    >
                      <Ionicons
                        name="medical"
                        size={20}
                        color={
                          selectedResource === resource.id
                            ? Theme.colors.backgroundLight
                            : Theme.colors.text
                        }
                      />
                    </View>
                  </Marker>
                ))}
              {routeCoordinates.length > 0 && (
                <Polyline
                  coordinates={routeCoordinates}
                  strokeColor={routeStarted ? "#1a237e" : Theme.colors.primary}
                  strokeWidth={6}
                  lineCap="round"
                  lineJoin="round"
                />
              )}
              {selectedDestination && (
                <Marker
                  coordinate={{
                    latitude: selectedDestination.latitude,
                    longitude: selectedDestination.longitude,
                  }}
                  title={selectedDestination.name}
                >
                  <View style={styles.destinationMarker}>
                    <Ionicons
                      name="flag"
                      size={24}
                      color={Theme.colors.error}
                    />
                  </View>
                </Marker>
              )}
            </MapView>
          </View>
        </TouchableWithoutFeedback>

        {/* Show details, directions, or resource list */}
        {showDetails && !routeStarted ? (
          renderResourceDetails()
        ) : routeStarted ? (
          isLoadingDirections ? (
            <LoadingOverlay mode={"start_route"} />
          ) : (
            renderDirections()
          )
        ) : selectedDestination && directionSteps.length > 0 && !showDetails ? (
          <View style={styles.directionsSection}>
            <View style={styles.directionsHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCancelDirections}
              >
                <Ionicons name="close" size={24} color={Theme.colors.text} />
              </TouchableOpacity>
              <View style={styles.directionsHeaderLeft}>
                <Text style={styles.directionsTitle} numberOfLines={1}>
                  {selectedDestination.name.length > 30
                    ? selectedDestination.name.substring(0, 30) + "..."
                    : selectedDestination.name}
                </Text>
                <View style={styles.directionsMeta}>
                  <Text style={styles.directionsMetaText}>
                    {formatDistance(totalDistance)}
                  </Text>
                  <Text style={styles.directionsMetaText}>•</Text>
                  <Text style={styles.directionsMetaText}>
                    {formatDuration(totalDuration)}
                  </Text>
                </View>
              </View>
              <View style={styles.routeControls}>
                <TouchableOpacity
                  style={[
                    styles.saveResourceCircularButton,
                    isResourceSaved && styles.unsaveResourceCircularButton,
                  ]}
                  onPress={() => {
                    if (isResourceSaved) {
                      unsaveResource();
                    } else if (selectedDestination) {
                      saveResource({
                        name: selectedDestination.name,
                        address: selectedDestination.address || "",
                        latitude: selectedDestination.latitude,
                        longitude: selectedDestination.longitude,
                      });
                    }
                  }}
                >
                  <Ionicons
                    name={isResourceSaved ? "trash-outline" : "add"}
                    size={18}
                    color={
                      isResourceSaved
                        ? Theme.colors.backgroundLight
                        : Theme.colors.text
                    }
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.startRouteButton}
                  onPress={handleStartRoute}
                >
                  <Text style={styles.startRouteText}>
                    {t.startRouteButton}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            {/* <ScrollView
              style={styles.stepsList}
              showsVerticalScrollIndicator={false}
            >
              {directionSteps.map((step, index) => (
                <View key={index} style={styles.directionStep}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepInstruction}>
                      {stripHtmlTags(step.html_instructions)}
                    </Text>
                    <View style={styles.stepMeta}>
                      <Text style={styles.stepDistance}>
                        {step.distance.text}
                      </Text>
                      <Text style={styles.stepDuration}>
                        {step.duration.text}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView> */}
            {/* hardcode dummy resource for now */}
            <ScrollView
              style={styles.detailsContent}
              showsVerticalScrollIndicator={false}
            >
              <View
                style={[
                  styles.eligibilityRow,
                  { marginBottom: Theme.spacing.md },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={isTablet ? 26 : 20}
                  color={Theme.colors.success}
                />
                <Text style={styles.eligibilityText}>{t.eligibility}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons
                  name="location-outline"
                  size={isTablet ? 24 : 18}
                  color={Theme.colors.primary}
                />
                <Text style={styles.detailText}>
                  {selectedDestination.address}
                </Text>
              </View>
              {dummyResources[1].phone && (
                <View style={styles.detailRow}>
                  <Ionicons
                    name="call-outline"
                    size={isTablet ? 24 : 18}
                    color={Theme.colors.primary}
                  />
                  <Text style={styles.detailText}>
                    {deterministicPhoneNumber(selectedDestination.name)}
                  </Text>
                </View>
              )}
              {dummyResources[1].email && (
                <View style={styles.detailRow}>
                  <Ionicons
                    name="mail-outline"
                    size={isTablet ? 24 : 18}
                    color={Theme.colors.primary}
                  />
                  <Text style={styles.detailText}>
                    {`medicalrecords@${getFirstWord(
                      selectedDestination.name
                    )}.org`}
                  </Text>
                </View>
              )}
              {dummyResources[1].hours && (
                <View style={styles.detailRow}>
                  <Ionicons
                    name="time-outline"
                    size={isTablet ? 24 : 18}
                    color={Theme.colors.primary}
                  />
                  <View style={{ flex: 1 }}>
                    {dummyResources[1].hours
                      .split("\n")
                      .map((dayHours, index) => (
                        <Text key={index} style={styles.detailText}>
                          {dayHours.trim()}
                        </Text>
                      ))}
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.resourcesSection}>
            <View style={styles.tabSelectorContainer}>
              <View style={styles.tabSelector}>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    activeTab === "nearby" && styles.tabActive,
                  ]}
                  onPress={() => setActiveTab("nearby")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "nearby" && styles.tabTextActive,
                    ]}
                  >
                    {t.nearbyResources}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    activeTab === "saved" && styles.tabActive,
                  ]}
                  onPress={() => setActiveTab("saved")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "saved" && styles.tabTextActive,
                    ]}
                  >
                    {t.savedResources}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            {activeTab === "nearby" ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.resourcesScroll}
              >
                {filteredResources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    {...resource}
                    onPress={() => handleResourceSelect(resource)}
                  />
                ))}
              </ScrollView>
            ) : (
              <ScrollView
                style={styles.savedResourcesScroll}
                contentContainerStyle={styles.savedResourcesContent}
                showsVerticalScrollIndicator={false}
              >
                {savedResources.length > 0 ? (
                  savedResources.map((resource) => (
                    <TouchableOpacity
                      key={resource.id}
                      style={styles.savedResourceCard}
                      onPress={() => handleSavedResourceSelect(resource)}
                    >
                      <View style={styles.savedResourceContent}>
                        <Ionicons
                          name="pin"
                          size={20}
                          color={Theme.colors.primary}
                        />
                        <View style={styles.savedResourceText}>
                          <Text
                            style={styles.savedResourceName}
                            numberOfLines={1}
                          >
                            {resource.name}
                          </Text>
                          <Text
                            style={styles.savedResourceAddress}
                            numberOfLines={1}
                          >
                            {truncateAddress(resource.address, 50)}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.deleteSavedButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            deleteSavedResource(resource.id);
                          }}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={20}
                            color={Theme.colors.error}
                          />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptySaved}>
                    <Text style={styles.emptySavedText}>
                      No saved resources
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        )}
      </Animated.View>
      {isLoadingSearch && <LoadingOverlay mode={"search"} />}
      {(showSaveSuccessModal || showDeleteSuccessModal) && (
        <Animated.View
          style={[styles.successModalOverlay, { opacity: successModalAnim }]}
        >
          <Animated.View
            style={[
              styles.successModal,
              { transform: [{ scale: successModalScale }] },
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={48}
              color={Theme.colors.success}
            />
            <Text style={styles.successModalText}>
              {showSaveSuccessModal
                ? "Saved Successfully"
                : "Deleted Successfully"}
            </Text>
          </Animated.View>
        </Animated.View>
      )}
      {showEndRouteModal && (
        // <View style={styles.modalOverlay}>
        //   <View style={styles.modalContainer}>
        //     <Text style={styles.modalTitle}>End Route?</Text>
        //     <Text style={styles.modalMessage}>
        //       Are you sure you want to end the current route?
        //     </Text>
        //     <View style={styles.modalButtons}>
        //       <TouchableOpacity
        //         style={[styles.modalButton, styles.modalCancelButton]}
        //         onPress={() => setShowEndRouteModal(false)}
        //       >
        //         <Text style={styles.modalCancelText}>Cancel</Text>
        //       </TouchableOpacity>
        //       <TouchableOpacity
        //         style={[styles.modalButton, styles.modalConfirmButton]}
        //         onPress={handleConfirmEndRoute}
        //       >
        //         <Text style={styles.modalConfirmText}>End Route</Text>
        //       </TouchableOpacity>
        //     </View>
        //   </View>
        // </View>
        <AreYouSurePopup
          mode={"end_route"}
          setShowPopUp={setShowEndRouteModal}
          proceed={handleConfirmEndRoute}
        ></AreYouSurePopup>
      )}
      {showTipsModal && (
        <SelectionModal
          mode={"tips_checklist"}
          setShowPopUp={setShowTipsModal}
          proceed={handleStartRouteAfterTips}
          selectedLanguage={language}
        ></SelectionModal>
      )}
      <CustomTabBar />
      <AdvancedFilterPopup
        visible={showFilterPopup}
        onDismiss={() => setShowFilterPopup(false)}
        onApplyFilters={(filters) => {
          console.log("Applied filters:", filters);
          // Here you can implement actual filtering logic
          // For now, just log the filters
        }}
      />
    </SafeAreaView>
    // </TouchableWithoutFeedback>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    marginHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
    zIndex: 1000,
  },
  searchIcon: {
    marginRight: Theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: isTablet ? 28 : 16,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.text,
    paddingVertical: Theme.spacing.sm,
  },
  autocompleteContainer: {
    position: "absolute",
    top: 120,
    left: Theme.spacing.lg,
    right: Theme.spacing.lg,
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.md,
    maxHeight: 200,
    zIndex: 999,
    ...Theme.shadows.lg,
  },
  autocompleteList: {
    maxHeight: 200,
  },
  autocompleteItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderLight,
    minHeight: 60,
  },
  autocompleteText: {
    marginLeft: Theme.spacing.sm,
    flex: 1,
  },
  autocompleteMain: {
    fontSize: 16,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.text,
  },
  autocompleteSecondary: {
    fontSize: 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  stanfordMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Theme.colors.backgroundLight,
    ...Theme.shadows.md,
  },
  destinationMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.backgroundLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Theme.colors.error,
    ...Theme.shadows.md,
  },
  mapContainer: {
    height: isTablet ? MAP_HEIGHT * 1.2 : MAP_HEIGHT,
    marginBottom: Theme.spacing.md,
  },
  map: {
    flex: 1,
  },
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.backgroundLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Theme.colors.primary,
    ...Theme.shadows.md,
  },
  markerSelected: {
    backgroundColor: Theme.colors.primary,
    transform: [{ scale: 1.2 }],
  },
  resourcesSection: {
    backgroundColor: Theme.colors.backgroundLight,
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl,
    minHeight: isTablet ? height * 0.4 : height * 0.3,
    ...Theme.shadows.lg,
  },
  tabSelectorContainer: {
    paddingHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
  },
  tabSelector: {
    flexDirection: "row",
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borderRadius.md,
    padding: 3,
    gap: Theme.spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: Theme.colors.primaryDark,
  },
  tabText: {
    fontSize: isTablet ? 20 : 14,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.textSecondary,
  },
  tabTextActive: {
    color: Theme.colors.backgroundLight,
    fontFamily: Theme.fonts.semibold,
  },
  savedResourcesScroll: {
    minHeight: 280,
    // paddingBottom: 40,
  },
  savedResourcesContent: {
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl,
  },
  resourcesScroll: {
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.md,
  },
  savedResourceCard: {
    width: "100%",
    marginBottom: Theme.spacing.sm,
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    ...Theme.shadows.sm,
  },
  savedResourceContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
  },
  savedResourceText: {
    flex: 1,
  },
  savedResourceName: {
    fontSize: 14,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  savedResourceAddress: {
    fontSize: 12,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textSecondary,
  },
  emptySaved: {
    padding: Theme.spacing.xl,
    alignItems: "center",
  },
  emptySavedText: {
    fontSize: 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textSecondary,
  },
  detailsSection: {
    backgroundColor: Theme.colors.backgroundLight,
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl,
    maxHeight: height * 0.5,
    minHeight: height * 0.4,
    ...Theme.shadows.lg,
  },
  detailsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderLight,
    gap: Theme.spacing.sm,
  },
  detailsHeaderLeft: {
    flex: 1,
  },
  detailsTitle: {
    fontSize: isTablet ? 24 : 16,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
    fontWeight: "bold",
  },
  detailsContent: {
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.md,
    maxHeight: height * 0.25,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Theme.spacing.md,
    gap: isTablet ? Theme.spacing.lg : Theme.spacing.sm,
  },
  detailText: {
    flex: 1,
    fontSize: isTablet ? 20 : 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.text,
    lineHeight: 20,
  },
  eligibilityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Theme.spacing.sm,
    gap: Theme.spacing.sm,
  },
  eligibilityText: {
    fontSize: isTablet ? 20 : 14,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.success,
  },
  detailsButtons: {
    flexDirection: "row",
    gap: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderLight,
    alignItems: "center",
  },
  standardButton: {
    flex: 1,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
    minHeight: 44,
    backgroundColor: Theme.colors.error,
  },
  standardButtonText: {
    fontSize: 14,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.backgroundLight,
  },
  directionsSection: {
    // bug: if the directions are short (e.g., Palm Drive, the box is very small) --> fixed
    backgroundColor: Theme.colors.backgroundLight,
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl,
    maxHeight: height * 0.4,
    minHeight: height * 0.4,
    ...Theme.shadows.lg,
  },
  directionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderLight,
    gap: Theme.spacing.sm,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  directionsHeaderLeft: {
    flex: 1,
  },
  directionsTitle: {
    fontSize: isTablet ? 22 : 16,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
    fontWeight: "bold",
    marginBottom: Theme.spacing.xs,
  },
  directionsMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
  },
  directionsMetaText: {
    fontSize: isTablet ? 18 : 14,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.textSecondary,
  },
  routeControls: {
    flexDirection: "row",
    gap: Theme.spacing.sm,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: Theme.colors.error,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginRight: Theme.spacing.sm,
    minWidth: 80,
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.backgroundLight,
  },

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
  startRouteButton: {
    backgroundColor: Theme.colors.primaryDark,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    minWidth: 50, //100,
  },
  startRouteText: {
    fontSize: isTablet ? 20 : 14,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.backgroundLight,
  },
  routeControlButton: {
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    minWidth: 80,
  },
  routeControlText: {
    fontSize: isTablet ? 20 : 14,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
  },
  imHereButton: {
    backgroundColor: Theme.colors.primaryDark,
    borderColor: Theme.colors.primaryDark,
  },
  imHereText: {
    color: Theme.colors.backgroundLight,
  },
  saveResourceCircularButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.backgroundLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.md,
  },
  unsaveResourceCircularButton: {
    backgroundColor: Theme.colors.error,
    borderColor: Theme.colors.error,
  },
  deleteSavedButton: {
    padding: Theme.spacing.xs,
  },
  successModalOverlay: {
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
  successModal: {
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.xl,
    alignItems: "center",
    gap: Theme.spacing.md,
    ...Theme.shadows.lg,
  },
  successModalText: {
    fontSize: 18,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
  },
  stepsList: {
    maxHeight: height * 0.3,
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.md,
  },
  directionStep: {
    flexDirection: "row",
    marginBottom: Theme.spacing.md,
    alignItems: "flex-start",
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Theme.spacing.md,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 14,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.backgroundLight,
  },
  stepContent: {
    flex: 1,
  },
  stepInstruction: {
    fontSize: 16,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
    lineHeight: 22,
  },
  stepMeta: {
    flexDirection: "row",
    gap: Theme.spacing.md,
    marginTop: Theme.spacing.xs,
  },
  stepDistance: {
    fontSize: 14,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.textSecondary,
  },
  stepDuration: {
    fontSize: 14,
    fontFamily: Theme.fonts.medium,
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
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Theme.colors.backgroundLight + "EE",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },

  loadingContainer: {
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    ...Theme.shadows.lg,
    width: "80%",
    maxWidth: 300,
  },

  spinnerContainer: {
    marginBottom: Theme.spacing.lg,
    transform: [{ rotate: "0deg" }],
  },

  loadingText: {
    fontSize: 18,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
    textAlign: "center",
  },

  loadingSubtext: {
    fontSize: 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textSecondary,
    textAlign: "center",
  },

  // Optional: Add animation to the spinner
  spinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: Theme.colors.primary + "20",
    borderTopColor: Theme.colors.primary,
  },
});
