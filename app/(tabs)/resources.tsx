import React, { useState, useRef } from 'react';
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
  Linking,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Theme } from '../../constants/Theme';
import { dummyResources } from '../../constants/DummyData';
import { ResourceCard } from '../../components/ResourceCard';
import { Ionicons } from '@expo/vector-icons';
import { CustomTabBar } from './_layout';

const { width, height } = Dimensions.get('window');
const MAP_HEIGHT = height * 0.35;

export default function ResourcesScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const region = {
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const handleGetDirections = async (address: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    try {
      const supported = await Linking.canOpenURL(url).catch((error) => {
        console.error('Error checking if URL can be opened:', error);
        return false;
      });
      if (supported) {
        await Linking.openURL(url).catch((error) => {
          console.error('Error opening directions URL:', error);
        });
      }
    } catch (error) {
      console.error('Error opening directions:', error);
    }
  };

  const filteredResources = dummyResources.filter((resource) =>
    searchQuery.trim() === '' ||
    resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Theme.colors.text} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={region}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={true}
            showsTraffic={false}
          >
            {filteredResources.map((resource, index) => (
              <Marker
                key={resource.id}
                coordinate={{
                  latitude: 37.7749 + (index * 0.01),
                  longitude: -122.4194 + (index * 0.01),
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
          </MapView>
        </View>

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
                onPress={() => {
                  setSelectedResource(resource.id);
                  handleGetDirections(resource.address);
                }}
              />
            ))}
          </ScrollView>
        </View>
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
});

