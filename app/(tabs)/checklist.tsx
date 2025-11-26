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
import { ChecklistItemModal } from '../../components/ChecklistItemModal';
import { dummyChecklistItems } from '../../constants/DummyData';
import { Ionicons } from '@expo/vector-icons';
import { isToday, isPast, isFuture, isThisWeek, isThisMonth } from 'date-fns';
import { CustomTabBar } from './_layout';
import { supabase } from '../../lib/supabase';

interface ChecklistItemType {
  id: string;
  title: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  date: Date;
  completed: boolean;
  user_id?: string;
}

export default function ChecklistScreen() {
  const insets = useSafeAreaInsets();
  const [checklistItems, setChecklistItems] = useState<ChecklistItemType[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [addEditModalVisible, setAddEditModalVisible] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ChecklistItemType | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
    loadChecklistItems();
  }, []);

  const loadChecklistItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setChecklistItems(
          data.map((item) => ({
            ...item,
            date: new Date(item.start_date),
            startDate: new Date(item.start_date),
            endDate: item.end_date ? new Date(item.end_date) : undefined,
          }))
        );
      } else {
        // Load dummy data if no items found
        setChecklistItems(
          dummyChecklistItems.map((item) => ({
            ...item,
            date: new Date(item.date),
          }))
        );
      }
    } catch (error) {
      console.error('Error loading checklist items:', error);
      // Fallback to dummy data
      setChecklistItems(
        dummyChecklistItems.map((item) => ({
          ...item,
          date: new Date(item.date),
        }))
      );
    }
  };

  const handleToggle = async (id: string) => {
    const item = checklistItems.find((i) => i.id === id);
    if (item && !item.completed) {
      setSelectedItemId(id);
      setModalVisible(true);
    } else if (item && item.completed) {
      const updatedItems = checklistItems.map((i) =>
        i.id === id ? { ...i, completed: false } : i
      );
      setChecklistItems(updatedItems);
      await saveChecklistItem(updatedItems.find((i) => i.id === id)!);
    }
  };

  const handleConfirmModal = async () => {
    if (selectedItemId) {
      const updatedItems = checklistItems.map((i) =>
        i.id === selectedItemId ? { ...i, completed: true } : i
      );
      setChecklistItems(updatedItems);
      await saveChecklistItem(updatedItems.find((i) => i.id === selectedItemId)!);
      setModalVisible(false);
      setSelectedItemId(null);
    }
  };

  const handleExpand = (id: string) => {
    setExpandedItemId(expandedItemId === id ? null : id);
  };

  const handleEdit = (id: string) => {
    const item = checklistItems.find((i) => i.id === id);
    if (item) {
      setEditingItem(item);
      setAddEditModalVisible(true);
    }
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setAddEditModalVisible(true);
  };

  const handleSaveItem = async (data: {
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from('checklist_items')
          .update({
            title: data.title,
            description: data.description,
            start_date: data.startDate.toISOString(),
            end_date: data.endDate.toISOString(),
          })
          .eq('id', editingItem.id)
          .eq('user_id', user.id);

        if (error) throw error;

        setChecklistItems(
          checklistItems.map((item) =>
            item.id === editingItem.id
              ? {
                  ...item,
                  title: data.title,
                  description: data.description,
                  startDate: data.startDate,
                  endDate: data.endDate,
                  date: data.startDate,
                }
              : item
          )
        );
      } else {
        // Create new item
        const { data: newItem, error } = await supabase
          .from('checklist_items')
          .insert({
            user_id: user.id,
            title: data.title,
            description: data.description,
            start_date: data.startDate.toISOString(),
            end_date: data.endDate.toISOString(),
            completed: false,
          })
          .select()
          .single();

        if (error) throw error;

        if (newItem) {
          setChecklistItems([
            ...checklistItems,
            {
              id: newItem.id,
              title: newItem.title,
              description: newItem.description,
              startDate: new Date(newItem.start_date),
              endDate: newItem.end_date ? new Date(newItem.end_date) : undefined,
              date: new Date(newItem.start_date),
              completed: newItem.completed,
              user_id: newItem.user_id,
            },
          ]);
        }
      }
      setAddEditModalVisible(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving checklist item:', error);
    }
  };

  const saveChecklistItem = async (item: ChecklistItemType) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !item.user_id) return;

      const { error } = await supabase
        .from('checklist_items')
        .update({
          completed: item.completed,
        })
        .eq('id', item.id)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating checklist item:', error);
    }
  };

  const filterItemsByPeriod = (items: ChecklistItemType[]) => {
    const now = new Date();
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    switch (selectedPeriod) {
      case 'today':
        return items.filter((item) => isToday(item.date));
      case 'week':
        return items.filter((item) => isThisWeek(item.date, { weekStartsOn: 0 }));
      case 'month':
        return items.filter((item) => item.date >= startOfNextMonth);
      default:
        return items;
    }
  };

  const sortedItems = [...checklistItems].sort((a, b) => {
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
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddNew}
            activeOpacity={0.7}
          >
            <View style={styles.addButtonCircle}>
              <Ionicons name="add" size={24} color={Theme.colors.backgroundLight} />
            </View>
          </TouchableOpacity>
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
                Future
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
                description={item.description}
                startDate={item.startDate}
                endDate={item.endDate}
                completed={item.completed}
                expanded={expandedItemId === item.id}
                onToggle={handleToggle}
                onExpand={handleExpand}
                onEdit={handleEdit}
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
      <ChecklistItemModal
        visible={addEditModalVisible}
        onClose={() => {
          setAddEditModalVisible(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        editingItem={editingItem}
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
  addButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.md,
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
