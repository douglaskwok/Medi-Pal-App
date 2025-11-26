import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Theme } from '../constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isTomorrow } from 'date-fns';

interface ChecklistItemProps {
  id: string;
  title: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  completed: boolean;
  expanded?: boolean;
  onToggle: (id: string) => void;
  onExpand?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export const ChecklistItem: React.FC<ChecklistItemProps> = ({
  id,
  title,
  description,
  startDate,
  endDate,
  completed,
  expanded = false,
  onToggle,
  onExpand,
  onEdit,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const heightAnim = React.useRef(new Animated.Value(expanded ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: expanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [expanded]);

  const handleCheckboxPress = () => {
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

  const handleCardPress = () => {
    if (onExpand) {
      onExpand(id);
    }
  };

  const hasDetails = description || startDate || endDate;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.mainRow}>
        <TouchableOpacity
          style={[styles.checkbox, completed && styles.checkboxCompleted]}
          onPress={handleCheckboxPress}
          activeOpacity={0.7}
        >
          {completed && (
            <Ionicons name="checkmark" size={16} color={Theme.colors.background} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.titleContainer}
          onPress={hasDetails ? handleCardPress : undefined}
          activeOpacity={hasDetails ? 0.7 : 1}
        >
          <View style={styles.titleRow}>
            <Text style={[styles.title, completed && styles.titleCompleted]}>
              {title}
            </Text>
            {startDate && (
              <Text style={styles.dateText}>
                {isToday(new Date(startDate))
                  ? 'Today'
                  : isTomorrow(new Date(startDate))
                  ? 'Tomorrow'
                  : format(new Date(startDate), 'MMM d')}
              </Text>
            )}
          </View>
        </TouchableOpacity>
        {hasDetails && (
          <TouchableOpacity
            onPress={handleCardPress}
            style={styles.expandButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={Theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {expanded && hasDetails && (
        <Animated.View
          style={[
            styles.detailsContainer,
            {
              maxHeight: heightAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 500],
              }),
              opacity: heightAnim,
            },
          ]}
        >
          {description && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description:</Text>
              <Text style={styles.detailText}>{description}</Text>
            </View>
          )}
          {startDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Start:</Text>
              <Text style={styles.detailText}>
                {format(new Date(startDate), 'MMM d, yyyy h:mm a')}
              </Text>
            </View>
          )}
          {endDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>End:</Text>
              <Text style={styles.detailText}>
                {format(new Date(endDate), 'MMM d, yyyy h:mm a')}
              </Text>
            </View>
          )}
          {onEdit && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => onEdit(id)}
            >
              <Ionicons name="pencil" size={16} color={Theme.colors.primary} />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.sm,
    overflow: 'hidden',
    ...Theme.shadows.sm,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.md,
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
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Theme.spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.text,
  },
  dateText: {
    fontSize: 12,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.textSecondary,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: Theme.colors.textSecondary,
  },
  expandButton: {
    padding: Theme.spacing.xs,
    marginLeft: Theme.spacing.sm,
  },
  detailsContainer: {
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderLight,
    marginTop: Theme.spacing.xs,
    paddingTop: Theme.spacing.md,
  },
  detailRow: {
    marginBottom: Theme.spacing.sm,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  detailText: {
    fontSize: 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textSecondary,
    lineHeight: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderLight,
    gap: Theme.spacing.xs,
  },
  editButtonText: {
    fontSize: 14,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.primary,
  },
});




