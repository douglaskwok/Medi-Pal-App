import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Theme } from '../constants/Theme';
import { Ionicons } from '@expo/vector-icons';

interface ChecklistItemProps {
  id: string;
  title: string;
  completed: boolean;
  onToggle: (id: string) => void;
}

export const ChecklistItem: React.FC<ChecklistItemProps> = ({
  id,
  title,
  completed,
  onToggle,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onToggle(id);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.checkbox, completed && styles.checkboxCompleted]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {completed && (
          <Ionicons name="checkmark" size={16} color={Theme.colors.background} />
        )}
      </TouchableOpacity>
      <Text style={[styles.title, completed && styles.titleCompleted]}>
        {title}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.md,
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.sm,
    ...Theme.shadows.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    marginRight: Theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.text,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: Theme.colors.textSecondary,
  },
});


