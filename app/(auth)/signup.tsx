import React, { useState } from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
import { Theme } from "../../constants/Theme";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { GradientBackground } from "../../components/GradientBackground";
import type { AuthError } from "@supabase/supabase-js";

export default function SignUpScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabWidth, setTabWidth] = useState(0);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  React.useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeTab === "signin" ? 0 : 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab === "signin") {
      router.replace("/(auth)/signin");
    }
  }, [activeTab]);

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
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
        router.replace("/(tabs)/home");
      }
    } catch (err) {
      const error = err as AuthError;
      setError(error.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.container}>
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
                source={require("../../assets/icon.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.logoText}>Medi-Pal</Text>
            </View>

            {/* White Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Create your account</Text>

              {/* Tab Switcher */}
              <View
                style={styles.tabContainer}
                onLayout={(e) => setTabWidth(e.nativeEvent.layout.width)}
              >
                <TouchableOpacity
                  style={styles.tab}
                  onPress={() => router.push("/(auth)/signin")}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "signin" && styles.tabTextActive,
                    ]}
                  >
                    Sign In
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.tab}
                  onPress={() => setActiveTab("signup")}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "signup" && styles.tabTextActive,
                    ]}
                  >
                    Sign Up
                  </Text>
                </TouchableOpacity>
                {tabWidth > 0 && (
                  <View
                    style={[styles.tabContainerInner, { width: tabWidth / 2 }]}
                  >
                    <Animated.View
                      style={[
                        styles.slider,
                        {
                          transform: [
                            {
                              translateX: slideAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, tabWidth / 2],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                  </View>
                )}
              </View>

              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Form */}
              <View style={styles.form}>
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
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="#000000"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

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
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={
                          showConfirmPassword
                            ? "eye-off-outline"
                            : "eye-outline"
                        }
                        size={20}
                        color="#000000"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    loading && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSignUp}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  <Text style={styles.submitButtonText}>
                    {loading ? "Creating Account..." : "Create Account"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                By continuing, you agree to our{" "}
                <Text
                  style={styles.footerLink}
                  onPress={() => router.push("/(auth)/terms")}
                >
                  Terms of Service
                </Text>{" "}
                and{" "}
                <Text
                  style={styles.footerLink}
                  onPress={() => router.push("/(auth)/privacy")}
                >
                  Privacy Policy
                </Text>
              </Text>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: Theme.spacing.lg,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Theme.spacing.lg,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: Theme.spacing.lg,
  },
  logo: {
    width: 50,
    height: 50,
    marginBottom: Theme.spacing.sm,
  },
  logoText: {
    fontSize: 28,
    fontFamily: Theme.fonts.bold,
    color: "#000000",
    letterSpacing: 0.5,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.md,
  },
  cardTitle: {
    fontSize: 24,
    fontFamily: Theme.fonts.bold,
    color: "#000000",
    marginBottom: Theme.spacing.md,
    textAlign: "center",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borderRadius.md,
    padding: 3,
    marginBottom: Theme.spacing.sm,
    position: "relative",
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Theme.borderRadius.sm,
    minHeight: 36,
    zIndex: 2,
  },
  tabContainerInner: {
    position: "absolute",
    bottom: 3,
    left: 3,
    height: 36,
    borderRadius: Theme.borderRadius.sm,
    overflow: "hidden",
  },
  slider: {
    width: "100%",
    height: "100%",
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.sm,
  },
  tabText: {
    fontSize: 12,
    fontFamily: Theme.fonts.medium,
    color: "#000000",
  },
  tabTextActive: {
    color: "#FFFFFF",
    fontFamily: Theme.fonts.semibold,
  },
  form: {
    gap: Theme.spacing.md,
  },
  inputGroup: {
    marginBottom: Theme.spacing.sm,
  },
  label: {
    fontSize: 14,
    fontFamily: Theme.fonts.medium,
    color: "#000000",
    marginBottom: Theme.spacing.sm,
  },
  input: {
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    fontSize: 16,
    fontFamily: Theme.fonts.regular,
    color: "#000000",
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
  },
  passwordInput: {
    flex: 1,
    padding: Theme.spacing.md,
    fontSize: 16,
    fontFamily: Theme.fonts.regular,
    color: "#000000",
  },
  eyeIcon: {
    padding: Theme.spacing.md,
  },
  submitButton: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    alignItems: "center",
    marginTop: Theme.spacing.md,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.backgroundLight,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  errorContainer: {
    backgroundColor: Theme.colors.error + "10",
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.error + "30",
  },
  errorText: {
    fontSize: 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.error,
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: Theme.spacing.md,
    marginTop: Theme.spacing.sm,
  },
  footerText: {
    fontSize: 12,
    fontFamily: Theme.fonts.regular,
    color: "#000000",
    textAlign: "center",
    lineHeight: 18,
  },
  footerLink: {
    color: "#000000",
    fontFamily: Theme.fonts.medium,
    textDecorationLine: "underline",
    fontWeight: "bold",
  },
});
