import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Theme } from '../../constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

export default function SignInScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabWidth, setTabWidth] = useState(0);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  React.useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeTab === 'signin' ? 0 : 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [activeTab]);

  // Don't auto-navigate on tab change - just update the form

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data.user) {
        router.replace('/(tabs)/home');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
          emailRedirectTo: undefined,
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        router.replace('/(tabs)/home');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // TODO: Implement forgot password
    setError('Forgot password feature coming soon');
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
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
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.logoText}>Medi-Pal</Text>
            </View>

            {/* White Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {activeTab === 'signin' ? 'Welcome back' : 'Create your account'}
              </Text>

              {/* Tab Switcher */}
              <View 
                style={styles.tabContainer}
                onLayout={(e) => {
                  const containerWidth = e.nativeEvent.layout.width;
                  const tabWidth = (containerWidth - 6) / 2; // Subtract padding (3px each side)
                  setTabWidth(tabWidth);
                }}
              >
                <TouchableOpacity
                  style={styles.tab}
                  onPress={() => setActiveTab('signin')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabText, activeTab === 'signin' && styles.tabTextActive]}>
                    Sign In
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.tab}
                  onPress={() => setActiveTab('signup')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabText, activeTab === 'signup' && styles.tabTextActive]}>
                    Sign Up
                  </Text>
                </TouchableOpacity>
                {tabWidth > 0 && (
                  <Animated.View
                    style={[
                      styles.tabContainerInner,
                      {
                        width: tabWidth,
                        transform: [
                          {
                            translateX: slideAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, tabWidth],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <View style={styles.slider} />
                  </Animated.View>
                )}
              </View>

              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Form */}
              <View style={styles.form}>
                {activeTab === 'signup' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your name"
                      placeholderTextColor={Theme.colors.textLight}
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                    />
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor={Theme.colors.textLight}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Enter your password"
                      placeholderTextColor={Theme.colors.textLight}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoComplete="password"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#000000"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {activeTab === 'signup' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <View style={styles.passwordWrapper}>
                      <TextInput
                        style={styles.passwordInput}
                        placeholder="Confirm your password"
                        placeholderTextColor={Theme.colors.textLight}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        autoComplete="password"
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={styles.eyeIcon}
                      >
                        <Ionicons
                          name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={20}
                          color="#000000"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {activeTab === 'signin' && (
                  <TouchableOpacity
                    onPress={handleForgotPassword}
                    style={styles.forgotPassword}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={activeTab === 'signin' ? handleSignIn : handleSignUp}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  <Text style={styles.submitButtonText}>
                    {loading 
                      ? (activeTab === 'signin' ? 'Signing In...' : 'Creating Account...')
                      : (activeTab === 'signin' ? 'Sign In' : 'Create Account')
                    }
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                By continuing, you agree to our{' '}
                <Text
                  style={styles.footerLink}
                  onPress={() => router.push('/(auth)/terms')}
                >
                  Terms of Service
                </Text>
                {' '}and{' '}
                <Text
                  style={styles.footerLink}
                  onPress={() => router.push('/(auth)/privacy')}
                >
                  Privacy Policy
                </Text>
              </Text>
            </View>
          </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.lg,
  },
  keyboardView: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  logo: {
    width: 40,
    height: 40,
    marginBottom: Theme.spacing.xs,
  },
  logoText: {
    fontSize: 24,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
    letterSpacing: 0.5,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.md,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borderRadius.md,
    padding: 3,
    marginBottom: Theme.spacing.sm,
    position: 'relative',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Theme.borderRadius.sm,
    minHeight: 36,
    zIndex: 2,
  },
  tabContainerInner: {
    position: 'absolute',
    bottom: 3,
    left: 3,
    height: 36,
    borderRadius: Theme.borderRadius.sm,
    overflow: 'hidden',
  },
  slider: {
    width: '100%',
    height: '100%',
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  tabText: {
    fontSize: 12,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.text,
  },
  tabTextActive: {
    color: Theme.colors.text,
    fontFamily: Theme.fonts.semibold,
  },
  form: {
    gap: Theme.spacing.md,
  },
  inputGroup: {
    marginBottom: Theme.spacing.xs,
  },
  label: {
    fontSize: 12,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  input: {
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.sm,
    fontSize: 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.text,
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
    height: 44,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
    height: 44,
  },
  passwordInput: {
    flex: 1,
    padding: Theme.spacing.sm,
    fontSize: 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.text,
    height: 44,
  },
  eyeIcon: {
    padding: Theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.primary,
  },
  submitButton: {
    backgroundColor: Theme.colors.primaryDark,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.sm,
    alignItems: 'center',
    marginTop: Theme.spacing.sm,
    height: 44,
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 14,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.backgroundLight,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Theme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Theme.colors.borderLight,
  },
  dividerText: {
    marginHorizontal: Theme.spacing.md,
    fontSize: 14,
    fontFamily: Theme.fonts.regular,
    color: '#000000',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
    gap: Theme.spacing.sm,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    fontSize: 14,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.backgroundLight,
  },
  googleButtonText: {
    fontSize: 16,
    fontFamily: Theme.fonts.medium,
    color: '#000000',
  },
  errorContainer: {
    backgroundColor: Theme.colors.error + '10',
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.error + '30',
  },
  errorText: {
    fontSize: 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.error,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: Theme.spacing.md,
    marginTop: Theme.spacing.sm,
  },
  footerText: {
    fontSize: 12,
    fontFamily: Theme.fonts.regular,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: '#000000',
    fontFamily: Theme.fonts.medium,
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
});

