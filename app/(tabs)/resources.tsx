import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Theme } from '../../constants/Theme';
import { dummyResources } from '../../constants/DummyData';
import { ResourceCard } from '../../components/ResourceCard';
import { Ionicons } from '@expo/vector-icons';
import { CustomTabBar } from './_layout';

const { width, height } = Dimensions.get('window');
const MAP_HEIGHT = height * 0.35;
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

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
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  html_instructions: string;
  maneuver?: string;
}

export default function ResourcesScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  // Hardcoded Stanford University address: 550 Lasuen Mall, Stanford, CA 94305
  // Coordinates for 550 Lasuen Mall, Stanford, CA 94305
  const STANFORD_COORDS = {
    latitude: 37.4275,
    longitude: -122.1695,
  };
  
  // Always use Stanford as user location (hardcoded)
  const [userLocation] = useState<{ latitude: number; longitude: number }>(STANFORD_COORDS);
  const [region, setRegion] = useState({
    latitude: STANFORD_COORDS.latitude,
    longitude: STANFORD_COORDS.longitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinate[]>([]);
  const [directionSteps, setDirectionSteps] = useState<DirectionStep[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<{ latitude: number; longitude: number; name: string } | null>(null);
  const [routeStarted, setRouteStarted] = useState(false);
  const [selectedResourceForDirections, setSelectedResourceForDirections] = useState<typeof dummyResources[0] | null>(null);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<number>(0);
  const [autocompleteResults, setAutocompleteResults] = useState<Place[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const mapRef = useRef<MapView>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
    
    // Always use Stanford University as user location (hardcoded)
    setRegion({
      latitude: STANFORD_COORDS.latitude,
      longitude: STANFORD_COORDS.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    
    // Animate map to Stanford location
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: STANFORD_COORDS.latitude,
        longitude: STANFORD_COORDS.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  }, []);

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
      console.warn('Google Maps API key not found');
      return;
    }

    try {
      const location = userLocation || { latitude: region.latitude, longitude: region.longitude };
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&location=${location.latitude},${location.longitude}&radius=50000&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      if (data.predictions) {
        setAutocompleteResults(data.predictions);
        setShowAutocomplete(true);
      }
    } catch (error) {
      console.error('Error fetching autocomplete:', error);
    }
  };

  const handlePlaceSelect = async (place: Place) => {
    setSearchQuery(place.description);
    setShowAutocomplete(false);
    setAutocompleteResults([]);
    
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
        };
        setSelectedDestination(destination);
        setSelectedResourceForDirections(null);
        setRouteStarted(false);
        setSelectedResource(null);
        
        // Always use Stanford as origin (hardcoded)
        await getDirections(STANFORD_COORDS, destination);
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
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

      const deltaLat = (result & 1) ? ~(result >> 1) : (result >> 1);
      lat += deltaLat;

      shift = 0;
      result = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLng = (result & 1) ? ~(result >> 1) : (result >> 1);
      lng += deltaLng;

      coordinates.push({
        latitude: lat * 1e-5,
        longitude: lng * 1e-5,
      });
    }

    return coordinates;
  };

  const getDirections = async (
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number; name: string }
  ) => {
    if (!GOOGLE_MAPS_API_KEY) {
      Alert.alert('Error', 'Google Maps API key not configured.');
      return;
    }

    setRouteCoordinates([]);
    setDirectionSteps([]);

    try {
      const originStr = `${origin.latitude},${origin.longitude}`;
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

        // Extract all steps from all legs
        const steps: DirectionStep[] = [];
        let totalDist = 0;
        let totalDur = 0;
        route.legs.forEach((leg: any) => {
          totalDist += leg.distance.value;
          totalDur += leg.duration.value;
          if (leg.steps) {
            leg.steps.forEach((step: any) => {
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

        // Calculate bounding box for user location and destination only
        if (mapRef.current && decoded.length > 0 && origin) {
          const minLat = Math.min(origin.latitude, destination.latitude);
          const maxLat = Math.max(origin.latitude, destination.latitude);
          const minLng = Math.min(origin.longitude, destination.longitude);
          const maxLng = Math.max(origin.longitude, destination.longitude);
          
          const latDelta = (maxLat - minLat) * 1.5; // Add 50% padding
          const lngDelta = (maxLng - minLng) * 1.5;
          
          const centerLat = (minLat + maxLat) / 2;
          const centerLng = (minLng + maxLng) / 2;
          
          // Ensure minimum zoom level (don't zoom out too far)
          const minDelta = 0.01;
          const finalLatDelta = Math.max(latDelta, minDelta);
          const finalLngDelta = Math.max(lngDelta, minDelta);
          
          mapRef.current.animateToRegion({
            latitude: centerLat,
            longitude: centerLng,
            latitudeDelta: finalLatDelta,
            longitudeDelta: finalLngDelta,
          }, 1000);
        }
      } else {
        Alert.alert('Error', 'No route found. Please try again.');
      }
    } catch (error) {
      console.error('Error getting directions:', error);
      Alert.alert('Error', 'Could not get directions. Please try again.');
    }
  };

  const handleGetDirections = async (resource: typeof dummyResources[0]) => {
    // Always use Stanford as origin (hardcoded)
    setSelectedResource(resource.id);
    setSelectedResourceForDirections(resource);
    setRouteStarted(false);
    await getDirections(STANFORD_COORDS, {
      latitude: resource.latitude,
      longitude: resource.longitude,
      name: resource.name,
    });
  };

  const handleStartRoute = () => {
    setRouteStarted(true);
    // Zoom into Stanford location when starting route (hardcoded)
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: STANFORD_COORDS.latitude,
        longitude: STANFORD_COORDS.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const handleCancelDirections = () => {
    setRouteCoordinates([]);
    setDirectionSteps([]);
    setSelectedDestination(null);
    setRouteStarted(false);
    setSelectedResourceForDirections(null);
    setSelectedResource(null);
    setTotalDistance(0);
    setTotalDuration(0);
  };

  const handleImHere = () => {
    Alert.alert('Arrived!', 'You have reached your destination.');
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
    return html.replace(/<[^>]*>/g, '').trim();
  };

  // Always show all nearby resources - search bar is only for Google Places autocomplete
  const filteredResources = dummyResources;

  return (
    <SafeAreaView style={styles.container}>
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
              source={require('../../assets/icon.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Resources</Text>
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options-outline" size={20} color={Theme.colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color={Theme.colors.text}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for resources..."
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
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              setRouteCoordinates([]);
              setDirectionSteps([]);
              setSelectedDestination(null);
              setShowAutocomplete(false);
              setSelectedResourceForDirections(null);
            }}>
              <Ionicons name="close-circle" size={20} color={Theme.colors.text} />
            </TouchableOpacity>
          )}
        </View>

        {showAutocomplete && autocompleteResults.length > 0 && (
          <View style={styles.autocompleteContainer}>
            <ScrollView style={styles.autocompleteList}>
              {autocompleteResults.map((place) => (
                <TouchableOpacity
                  key={place.place_id}
                  style={styles.autocompleteItem}
                  onPress={() => handlePlaceSelect(place)}
                >
                  <Ionicons name="location" size={20} color={Theme.colors.primary} />
                  <View style={styles.autocompleteText}>
                    <Text style={styles.autocompleteMain}>{place.structured_formatting.main_text}</Text>
                    <Text style={styles.autocompleteSecondary}>{place.structured_formatting.secondary_text}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

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
            {/* Hardcoded Stanford location marker */}
            <Marker
              coordinate={STANFORD_COORDS}
              title="Your Location"
              description="550 Lasuen Mall, Stanford, CA 94305"
            >
              <View style={styles.stanfordMarker}>
                <Ionicons name="location" size={24} color={Theme.colors.primary} />
              </View>
            </Marker>
            {/* Only show nearby resource markers when no route is active */}
            {!selectedDestination && filteredResources.map((resource) => (
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
                    selectedResource === resource.id && styles.markerSelected,
                  ]}
                >
                  <Ionicons
                    name="medical"
                    size={20}
                    color={selectedResource === resource.id ? Theme.colors.backgroundLight : Theme.colors.text}
                  />
                </View>
              </Marker>
            ))}
            {routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor={routeStarted ? '#1a237e' : Theme.colors.primary}
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
                  <Ionicons name="flag" size={24} color={Theme.colors.error} />
                </View>
              </Marker>
            )}
          </MapView>
          
        </View>

        {/* Show steps section when a resource is selected OR a place from search is selected, otherwise show nearby resources */}
        {(selectedResourceForDirections || (selectedDestination && directionSteps.length > 0)) && directionSteps.length > 0 ? (
          <View style={styles.directionsSection}>
            <View style={styles.directionsHeader}>
            <View style={styles.directionsHeaderLeft}>
              <Text style={styles.directionsTitle} numberOfLines={1}>
                {(selectedDestination?.name || selectedResourceForDirections?.name || 'Directions').substring(0, 30)}
                {((selectedDestination?.name || selectedResourceForDirections?.name || '').length > 30) ? '...' : ''}
              </Text>
              <View style={styles.directionsMeta}>
                <Text style={styles.directionsMetaText}>{formatDistance(totalDistance)}</Text>
                <Text style={styles.directionsMetaText}>•</Text>
                <Text style={styles.directionsMetaText}>{formatDuration(totalDuration)}</Text>
              </View>
            </View>
            {!routeStarted ? (
              <View style={styles.routeControls}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelDirections}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.startRouteButton}
                  onPress={handleStartRoute}
                >
                  <Text style={styles.startRouteText}>Start Route</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.routeControls}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelDirections}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.routeControlButton, styles.imHereButton]}
                  onPress={handleImHere}
                >
                  <Text style={[styles.routeControlText, styles.imHereText]}>I'm here!</Text>
                </TouchableOpacity>
              </View>
            )}
            </View>
            <ScrollView style={styles.stepsList}>
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
                      <Text style={styles.stepDistance}>{step.distance.text}</Text>
                      <Text style={styles.stepDuration}>{step.duration.text}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.resourcesSection}>
            <Text style={styles.listTitle}>Nearby Resources</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.resourcesScroll}
            >
              {filteredResources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  {...resource}
                  onPress={() => handleGetDirections(resource)}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </Animated.View>
      <CustomTabBar />

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  headerLogo: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: 32,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
    fontWeight: 'bold',
  },
  filterButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 16,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.text,
    paddingVertical: Theme.spacing.sm,
  },
  autocompleteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 998,
  },
  autocompleteContainer: {
    position: 'absolute',
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderLight,
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Theme.colors.backgroundLight,
    ...Theme.shadows.md,
  },
  destinationMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Theme.colors.error,
    ...Theme.shadows.md,
  },
  mapContainer: {
    height: MAP_HEIGHT,
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
    alignItems: 'center',
    justifyContent: 'center',
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
    ...Theme.shadows.lg,
  },
  listTitle: {
    fontSize: 24,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
    fontWeight: 'bold',
    paddingHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
  },
  resourcesScroll: {
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.md,
  },
  directionsSection: {
    backgroundColor: Theme.colors.backgroundLight,
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl,
    maxHeight: height * 0.4,
    ...Theme.shadows.lg,
  },
  directionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderLight,
  },
  directionsHeaderLeft: {
    flex: 1,
  },
  directionsTitle: {
    fontSize: 16,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
    fontWeight: 'bold',
    marginBottom: Theme.spacing.xs,
  },
  directionsMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  directionsMetaText: {
    fontSize: 14,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.textSecondary,
  },
  startRouteButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
  },
  startRouteText: {
    fontSize: 14,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.backgroundLight,
  },
  cancelButton: {
    backgroundColor: Theme.colors.error,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginRight: Theme.spacing.sm,
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.backgroundLight,
  },
  routeControls: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    alignItems: 'center',
  },
  routeControlButton: {
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  imHereButton: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  routeControlText: {
    fontSize: 14,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
  },
  imHereText: {
    color: Theme.colors.backgroundLight,
  },
  stepsList: {
    maxHeight: height * 0.3,
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.md,
  },
  directionStep: {
    flexDirection: 'row',
    marginBottom: Theme.spacing.md,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
    flexDirection: 'row',
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
  routeSummary: {
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.backgroundLight,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderLight,
  },
  routeSummaryText: {
    fontSize: 16,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
});
