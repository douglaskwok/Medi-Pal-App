import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Theme } from "../../constants/Theme";
import { Ionicons } from "@expo/vector-icons";
import { CustomTabBar } from "./_layout";

export default function PrivacyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/profile")}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.headerLeft}>
            <Image
              source={require("../../assets/icon.png")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Privacy Policy</Text>
          </View>
        </View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 80 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.lastUpdated}>
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>

          <View style={styles.contentBox}>
            <Text style={styles.introText}>
              At Medi-Pal, we take your privacy seriously. This Privacy Policy
              explains how we collect, use, and protect your information when
              you use our healthcare resource platform for Medi-Cal
              beneficiaries.
            </Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Information We Collect</Text>

              <Text style={styles.subsectionTitle}>Account Information</Text>
              <View style={styles.bulletList}>
                <Text style={styles.bullet}>
                  • Email address (required for account creation)
                </Text>
                <Text style={styles.bullet}>
                  • Profile information (name, age, gender, phone number - all
                  optional)
                </Text>
                <Text style={styles.bullet}>
                  • Subscription and billing information
                </Text>
              </View>

              <Text style={styles.subsectionTitle}>Usage Data</Text>
              <View style={styles.bulletList}>
                <Text style={styles.bullet}>
                  • How you interact with our platform
                </Text>
                <Text style={styles.bullet}>
                  • Feature usage and preferences
                </Text>
                <Text style={styles.bullet}>
                  • Device and browser information
                </Text>
                <Text style={styles.bullet}>
                  • IP address and location data
                </Text>
              </View>

              <Text style={styles.subsectionTitle}>
                Chat and AI Interactions
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bullet}>
                  • Messages you send to our AI assistant
                </Text>
                <Text style={styles.bullet}>
                  • AI responses and conversation history
                </Text>
                <Text style={styles.bullet}>
                  • Search queries and preferences
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                How We Use Your Information
              </Text>

              <Text style={styles.subsectionTitle}>Core Services</Text>
              <View style={styles.bulletList}>
                <Text style={styles.bullet}>
                  • Provide healthcare resource discovery and recommendations
                </Text>
                <Text style={styles.bullet}>
                  • Store and manage your account information securely
                </Text>
                <Text style={styles.bullet}>
                  • Provide personalized healthcare guidance via AI assistant
                </Text>
                <Text style={styles.bullet}>
                  • Maintain your appointment history and preferences
                </Text>
              </View>

              <Text style={styles.subsectionTitle}>Account Management</Text>
              <View style={styles.bulletList}>
                <Text style={styles.bullet}>
                  • Create and manage your account
                </Text>
                <Text style={styles.bullet}>
                  • Process payments and manage subscriptions
                </Text>
                <Text style={styles.bullet}>• Provide customer support</Text>
                <Text style={styles.bullet}>
                  • Send important account and service updates
                </Text>
              </View>

              <Text style={styles.subsectionTitle}>Legal and Safety</Text>
              <View style={styles.bulletList}>
                <Text style={styles.bullet}>
                  • Comply with legal obligations
                </Text>
                <Text style={styles.bullet}>
                  • Protect against fraud and abuse
                </Text>
                <Text style={styles.bullet}>
                  • Enforce our terms of service
                </Text>
                <Text style={styles.bullet}>• Respond to legal requests</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Data Security</Text>
              <Text style={styles.sectionText}>
                We implement industry-standard security measures to protect your
                data:
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bullet}>
                  • All data is encrypted during transmission and storage
                </Text>
                <Text style={styles.bullet}>
                  • Information is stored in secure, private cloud storage
                </Text>
                <Text style={styles.bullet}>
                  • Access to your data is strictly controlled and monitored
                </Text>
                <Text style={styles.bullet}>
                  • Regular security audits and vulnerability assessments
                </Text>
                <Text style={styles.bullet}>
                  • Secure authentication and session management
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Privacy Rights</Text>
              <Text style={styles.sectionText}>
                You have the following rights regarding your personal data:
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bullet}>
                  <Text style={styles.bold}>Access:</Text> Request a copy of
                  your personal data
                </Text>
                <Text style={styles.bullet}>
                  <Text style={styles.bold}>Correction:</Text> Update or correct
                  inaccurate information
                </Text>
                <Text style={styles.bullet}>
                  <Text style={styles.bold}>Deletion:</Text> Delete your account
                  and all associated data
                </Text>
                <Text style={styles.bullet}>
                  <Text style={styles.bold}>Portability:</Text> Export your data
                  in a standard format
                </Text>
                <Text style={styles.bullet}>
                  <Text style={styles.bold}>Withdraw Consent:</Text> Opt out of
                  data processing where consent-based
                </Text>
                <Text style={styles.bullet}>
                  <Text style={styles.bold}>Object:</Text> Object to certain
                  types of data processing
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Us</Text>
              <Text style={styles.sectionText}>
                If you have questions about this Privacy Policy or want to
                exercise your privacy rights:
              </Text>
              <Text style={styles.contactText}>
                Email: <Text style={styles.emailLink}>privacy@medipal.app</Text>
              </Text>
              <Text style={styles.sectionText}>
                We will respond to privacy inquiries within 30 days.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Policy Updates</Text>
              <Text style={styles.sectionText}>
                We may update this Privacy Policy from time to time. We will
                notify users of significant changes via email or through our
                platform. The "Last updated" date at the top shows when this
                policy was last modified.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.sm,
    gap: Theme.spacing.sm,
  },
  backButton: {
    padding: Theme.spacing.xs,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
    flex: 1,
  },
  headerLogo: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: 32,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xl,
  },
  lastUpdated: {
    fontSize: 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.xl,
  },
  contentBox: {
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.xl,
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
  },
  introText: {
    fontSize: 16,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textSecondary,
    lineHeight: 24,
    marginBottom: Theme.spacing.xl,
  },
  section: {
    marginBottom: Theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
  },
  subsectionTitle: {
    fontSize: 18,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  sectionText: {
    fontSize: 16,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textSecondary,
    lineHeight: 24,
    marginBottom: Theme.spacing.sm,
  },
  bulletList: {
    marginLeft: Theme.spacing.md,
    marginTop: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  bullet: {
    fontSize: 16,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textSecondary,
    lineHeight: 24,
    marginBottom: Theme.spacing.xs,
  },
  bold: {
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
  },
  contactText: {
    fontSize: 16,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.text,
    marginTop: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  emailLink: {
    color: Theme.colors.primary,
    textDecorationLine: "underline",
  },
});
