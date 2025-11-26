import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  SafeAreaView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Theme } from '../../constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { CustomModal } from '../../components/Modal';
import { CustomTabBar } from './_layout';

interface UserProfile {
  firstName: string;
  lastName: string;
  age?: string;
  phoneNumber?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [signOutModalVisible, setSignOutModalVisible] = useState(false);
  const [userName, setUserName] = useState('User');
  const [userEmail, setUserEmail] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile>({
    firstName: '',
    lastName: '',
  });
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState<UserProfile>({
    firstName: '',
    lastName: '',
  });
  const [hasChanges, setHasChanges] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    loadUserData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
        
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileData) {
          const profile = {
            firstName: profileData.first_name || '',
            lastName: profileData.last_name || '',
            age: profileData.age?.toString() || '',
            phoneNumber: profileData.phone_number || '',
          };
          setUserProfile(profile);
          setTempValues(profile);
          setUserName(`${profile.firstName} ${profile.lastName}`.trim() || userEmail.split('@')[0]);
        } else {
          if (user.user_metadata?.full_name) {
            const nameParts = user.user_metadata.full_name.split(' ');
            const profile = {
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
            };
            setUserProfile(profile);
            setTempValues(profile);
            setUserName(user.user_metadata.full_name);
          } else if (user.email) {
            setUserName(user.email.split('@')[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleFieldPress = (field: string) => {
    if (field === 'email') return; // Email is not editable
    setEditingField(field);
  };

  const handleFieldChange = (field: string, value: string) => {
    setTempValues({ ...tempValues, [field]: value });
    setHasChanges(true);
  };

  const handleCancel = () => {
    setTempValues(userProfile);
    setEditingField(null);
    setHasChanges(false);
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const profileData = {
        user_id: user.id,
        first_name: tempValues.firstName,
        last_name: tempValues.lastName,
        age: tempValues.age ? parseInt(tempValues.age) : null,
        phone_number: tempValues.phoneNumber || null,
      };

      const { error } = await supabase
        .from('user_profiles')
        .upsert(profileData, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      setUserProfile(tempValues);
      setUserName(`${tempValues.firstName} ${tempValues.lastName}`.trim());
      setEditingField(null);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving personal info:', error);
    }
  };

  const handleSignOut = async () => {
    setSignOutModalVisible(false);
    try {
      await supabase.auth.signOut().catch((error) => {
        console.error('Error signing out:', error);
      });
      router.replace('/(auth)/signin');
    } catch (error) {
      console.error('Error in handleSignOut:', error);
      router.replace('/(auth)/signin');
    }
  };

  const renderField = (label: string, field: string, value: string, editable: boolean = true) => {
    const isEditing = editingField === field;
    const displayValue = value || 'Not set';

    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {isEditing && editable ? (
          <TextInput
            style={styles.fieldInput}
            value={tempValues[field as keyof UserProfile] || ''}
            onChangeText={(text) => {
              if (field === 'age') {
                const numericValue = text.replace(/[^0-9]/g, '');
                if (numericValue === '' || (parseInt(numericValue) >= 0 && parseInt(numericValue) <= 150)) {
                  handleFieldChange(field, numericValue);
                }
              } else if (field === 'phoneNumber') {
                const cleaned = text.replace(/[^0-9-() ]/g, '');
                handleFieldChange(field, cleaned);
              } else {
                handleFieldChange(field, text);
              }
            }}
            placeholder={`Enter ${label.toLowerCase()}`}
            placeholderTextColor={Theme.colors.textLight}
            autoFocus
            keyboardType={field === 'age' ? 'numeric' : field === 'phoneNumber' ? 'phone-pad' : 'default'}
            maxLength={field === 'age' ? 3 : field === 'phoneNumber' ? 20 : 50}
            autoCapitalize={field === 'firstName' || field === 'lastName' ? 'words' : 'none'}
          />
        ) : (
          <TouchableOpacity
            style={[styles.fieldDisplay, !editable && styles.fieldDisplayDisabled]}
            onPress={() => editable && handleFieldPress(field)}
            disabled={!editable}
            activeOpacity={editable ? 0.7 : 1}
          >
            <Text style={[styles.fieldDisplayText, !editable && styles.fieldDisplayTextDisabled]}>
              {displayValue}
            </Text>
            {editable && (
              <Ionicons name="pencil" size={14} color={Theme.colors.textSecondary} />
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
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
            <Text style={styles.title}>Profile</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color={Theme.colors.text} />
            </View>
            <Text style={styles.name}>{userName}</Text>
            <Text style={styles.email}>{userEmail}</Text>
          </View>

          <View style={styles.menuSection}>
            {/* Personal Information Fields */}
            <View style={styles.personalInfoCard}>
              <View style={styles.nameRow}>
                {renderField('First Name', 'firstName', userProfile.firstName)}
                {renderField('Last Name', 'lastName', userProfile.lastName)}
              </View>
              
              <View style={styles.contactRow}>
                {renderField('Age', 'age', userProfile.age || '')}
                {renderField('Phone', 'phoneNumber', userProfile.phoneNumber || '')}
              </View>
              
              {renderField('Email', 'email', userEmail, false)}
              
              {hasChanges && (
                <View style={styles.saveCancelRow}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancel}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Notifications */}
            <TouchableOpacity
              style={styles.smallMenuItem}
              activeOpacity={0.6}
              onPress={() => {}}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons
                  name="notifications-outline"
                  size={18}
                  color={Theme.colors.text}
                />
                <Text style={styles.smallMenuItemTitle}>Notifications</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={Theme.colors.text}
              />
            </TouchableOpacity>

            {/* Privacy & Security */}
            <TouchableOpacity
              style={styles.smallMenuItem}
              activeOpacity={0.6}
              onPress={() => router.push('/(tabs)/privacy')}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={18}
                  color={Theme.colors.text}
                />
                <Text style={styles.smallMenuItemTitle}>Privacy & Security</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={Theme.colors.text}
              />
            </TouchableOpacity>

            {/* Terms & Privacy */}
            <TouchableOpacity
              style={styles.smallMenuItem}
              activeOpacity={0.6}
              onPress={() => router.push('/(tabs)/terms')}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons
                  name="document-text-outline"
                  size={18}
                  color={Theme.colors.text}
                />
                <Text style={styles.smallMenuItemTitle}>Terms & Privacy</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={Theme.colors.text}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.signOutButton}
            activeOpacity={0.6}
            onPress={() => setSignOutModalVisible(true)}
          >
            <View style={styles.signOutContent}>
              <Ionicons
                name="log-out-outline"
                size={18}
                color={Theme.colors.error}
              />
              <Text style={styles.signOutText}>Sign Out</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
      <CustomModal
        visible={signOutModalVisible}
        onClose={() => setSignOutModalVisible(false)}
        onConfirm={handleSignOut}
        title="Sign Out"
        message="Are you sure you want to sign out of your account?"
        confirmText="Sign Out"
        cancelText="Cancel"
        destructive={true}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Theme.spacing.xl,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Theme.colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.xs,
    borderWidth: 2,
    borderColor: Theme.colors.borderLight,
  },
  name: {
    fontSize: 18,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textSecondary,
  },
  menuSection: {
    marginBottom: Theme.spacing.md,
  },
  personalInfoCard: {
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.lg,
    marginHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.sm,
    padding: Theme.spacing.md,
    ...Theme.shadows.sm,
  },
  nameRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  contactRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  fieldContainer: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.xs,
  },
  fieldDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.background,
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    minHeight: 44,
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
  },
  fieldDisplayDisabled: {
    opacity: 0.6,
  },
  fieldDisplayText: {
    fontSize: 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.text,
    flex: 1,
  },
  fieldDisplayTextDisabled: {
    color: Theme.colors.textSecondary,
  },
  fieldInput: {
    backgroundColor: Theme.colors.background,
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    fontSize: 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.text,
    borderWidth: 2,
    borderColor: Theme.colors.primary,
    minHeight: 44,
  },
  saveCancelRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
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
  smallMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.md,
    marginHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.xs,
    ...Theme.shadows.sm,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  smallMenuItemTitle: {
    fontSize: 14,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.text,
  },
  signOutButton: {
    marginHorizontal: Theme.spacing.lg,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.xl,
    backgroundColor: Theme.colors.error + '15',
    borderRadius: Theme.borderRadius.md,
    paddingVertical: Theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.error,
    ...Theme.shadows.sm,
  },
  signOutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.sm,
  },
  signOutText: {
    fontSize: 14,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.error,
  },
});
