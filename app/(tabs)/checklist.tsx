import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Animated,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../../constants/Theme';
import { ChecklistItem } from '../../components/ChecklistItem';
import { CustomModal } from '../../components/Modal';
import { dummyChecklistItems } from '../../constants/DummyData';
import { Ionicons } from '@expo/vector-icons';
import { isToday, isPast, isFuture, isThisWeek, isThisMonth } from 'date-fns';
import { CustomTabBar } from './_layout';

interface ChecklistItemType {
  id: string;
  title: string;
  date: Date;
  completed: boolean;
}

export default function ChecklistScreen() {
  const insets = useSafeAreaInsets();
  const [checklistItems, setChecklistItems] = useState<ChecklistItemType[]>(
    dummyChecklistItems.map((item) => ({
      ...item,
      date: new Date(item.date),
    }))
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleToggle = (id: string) => {
    const item = checklistItems.find((i) => i.id === id);
    if (item && !item.completed) {
      setSelectedItemId(id);
      setModalVisible(true);
    } else if (item && item.completed) {
      setChecklistItems(
        checklistItems.map((i) => (i.id === id ? { ...i, completed: false } : i))
      );
    }
  };

  const handleConfirmModal = () => {
    if (selectedItemId) {
      setChecklistItems(
        checklistItems.map((i) =>
          i.id === selectedItemId ? { ...i, completed: true } : i
        )
      );
      setModalVisible(false);
      setSelectedItemId(null);
    }
  };

  const filterItemsByPeriod = (items: ChecklistItemType[]) => {
    switch (selectedPeriod) {
      case 'today':
        return items.filter((item) => isToday(item.date));
      case 'week':
        return items.filter((item) => isThisWeek(item.date, { weekStartsOn: 0 }));
      case 'month':
        return items.filter((item) => isThisMonth(item.date));
      default:
        return items;
    }
  };

  const sortedItems = [...checklistItems].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return a.date.getTime() - b.date.getTime();
  });

  const filteredItems = filterItemsByPeriod(sortedItems);

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
            <Text style={styles.title}>My Checklist</Text>
          </View>
        </View>
        <View style={styles.periodSelectorContainer}>
          <View style={styles.periodSelector}>
            <TouchableOpacity
              style={[styles.periodButton, selectedPeriod === 'today' && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod('today')}
            >
              <Text style={[styles.periodButtonText, selectedPeriod === 'today' && styles.periodButtonTextActive]}>
                Today
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod('week')}
            >
              <Text style={[styles.periodButtonText, selectedPeriod === 'week' && styles.periodButtonTextActive]}>
                This Week
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod('month')}
            >
              <Text style={[styles.periodButtonText, selectedPeriod === 'month' && styles.periodButtonTextActive]}>
                This Month
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredItems.map((item) => (
            <View key={item.id} style={styles.itemWrapper}>
              <ChecklistItem
                id={item.id}
                title={item.title}
                completed={item.completed}
                onToggle={handleToggle}
              />
            </View>
          ))}

          {filteredItems.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={64} color={Theme.colors.textSecondary} />
              <Text style={styles.emptyText}>No checklist items for this period</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
      <CustomModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedItemId(null);
        }}
        onConfirm={handleConfirmModal}
        title="Mark as Done?"
        message={
          selectedItemId
            ? `Are you sure you want to mark "${checklistItems.find((i) => i.id === selectedItemId)?.title}" as completed?`
            : undefined
        }
      />
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
  periodSelectorContainer: {
    paddingHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.md,
    padding: 3,
    gap: Theme.spacing.xs,
  },
  periodButton: {
    flex: 1,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodButtonActive: {
    backgroundColor: Theme.colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.textSecondary,
  },
  periodButtonTextActive: {
    color: Theme.colors.backgroundLight,
    fontFamily: Theme.fonts.semibold,
  },
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollContent: {
    padding: Theme.spacing.md,
  },
  section: {
    marginBottom: Theme.spacing.md,
  },
  itemWrapper: {
    marginBottom: Theme.spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.xxl,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.md,
  },
});
