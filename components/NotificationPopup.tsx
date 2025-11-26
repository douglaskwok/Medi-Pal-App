import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

interface NotificationPopupProps {
  visible: boolean;
  onDismiss: () => void;
  onSaveResource?: () => void;
  onTakeMeThere?: () => void;
  onSaveSuccess?: () => void;
}

export const NotificationPopup: React.FC<NotificationPopupProps> = ({
  visible,
  onDismiss,
  onSaveResource,
  onTakeMeThere,
  onSaveSuccess,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-200)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const pan = useRef(new Animated.ValueXY()).current;
  const autoDismissTimer = useRef<NodeJS.Timeout | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
      },
      onPanResponderMove: Animated.event([null, { dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();
        if (gestureState.dy < -50) {
          // Swipe up to dismiss
          dismissNotification();
        } else {
          // Return to original position
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      showNotification();
      // Auto-dismiss after 6 seconds
      autoDismissTimer.current = setTimeout(() => {
        dismissNotification();
      }, 6000);
    } else {
      // Reset animation when hidden
      translateY.setValue(-200);
      opacity.setValue(0);
      pan.setValue({ x: 0, y: 0 });
    }

    return () => {
      if (autoDismissTimer.current) {
        clearTimeout(autoDismissTimer.current);
      }
    };
  }, [visible]);

  const showNotification = () => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const dismissNotification = () => {
    if (autoDismissTimer.current) {
      clearTimeout(autoDismissTimer.current);
      autoDismissTimer.current = null;
    }
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      pan.setValue({ x: 0, y: 0 });
      onDismiss();
    });
  };

  const handleSaveResource = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const yMCAResource = {
        name: 'Palo Alto Family YMCA',
        address: '3412 Ross Road, Palo Alto, CA 94303',
        latitude: 37.4419,
        longitude: -122.1430,
        place_id: 'ymca_palo_alto',
      };

      const { error } = await supabase.from('saved_resources').insert({
        user_id: user.id,
        name: yMCAResource.name,
        address: yMCAResource.address,
        latitude: yMCAResource.latitude,
        longitude: yMCAResource.longitude,
        place_id: yMCAResource.place_id,
      });

      if (error) throw error;
      if (onSaveResource) onSaveResource();
      if (onSaveSuccess) onSaveSuccess();
      dismissNotification();
    } catch (error) {
      console.error('Error saving resource:', error);
    }
  };

  const handleTakeMeThere = () => {
    dismissNotification();
    setTimeout(() => {
      router.push({
        pathname: '/(tabs)/resources',
        params: {
          name: 'Palo Alto Family YMCA',
          address: '3412 Ross Road, Palo Alto, CA 94303',
          latitude: '37.4419',
          longitude: '-122.1430',
        },
      });
    }, 350);
    if (onTakeMeThere) onTakeMeThere();
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + Theme.spacing.sm,
          transform: [
            { translateY: Animated.add(translateY, pan.y) },
            { translateX: pan.x },
          ],
          opacity,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.category}>Nearby Resource</Text>
          <TouchableOpacity onPress={dismissNotification} style={styles.closeButton}>
            <Ionicons name="close" size={20} color={Theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>Free Gym Membership at Palo Alto Family YMCA</Text>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={14} color={Theme.colors.textSecondary} />
          <Text style={styles.detailText}>3412 Ross Road, Palo Alto, CA 94303</Text>
        </View>
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSaveResource}
          >
            <Text style={styles.saveButtonText}>Save Resource</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.takeMeButton]}
            onPress={handleTakeMeThere}
          >
            <Text style={styles.takeMeButtonText}>Take me there</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: Theme.spacing.md,
  },
  content: {
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    ...Theme.shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  category: {
    fontSize: 12,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 16,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.md,
    gap: Theme.spacing.xs,
  },
  detailText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
  },
  buttons: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
  },
  takeMeButton: {
    backgroundColor: Theme.colors.primary,
  },
  takeMeButtonText: {
    fontSize: 14,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.backgroundLight,
  },
});

