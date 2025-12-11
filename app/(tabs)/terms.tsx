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

export default function TermsScreen() {
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
            <Text style={styles.title}>Terms of Service</Text>
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
              Welcome to Medi-Pal. These Terms of Service ("Terms") govern your
              access to and use of the Medi-Pal mobile application and services
              ("Service"). By accessing or using our Service, you agree to be
              bound by these Terms.
            </Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
              <Text style={styles.sectionText}>
                By creating an account, accessing, or using Medi-Pal, you
                acknowledge that you have read, understood, and agree to be
                bound by these Terms and our Privacy Policy. If you do not agree
                to these Terms, you may not use our Service.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. Description of Service</Text>
              <Text style={styles.sectionText}>
                Medi-Pal is a healthcare resource discovery platform designed to
                help Medi-Cal beneficiaries find and access healthcare
                resources, including clinics, pharmacies, dental services, and
                mental health services. Our Service includes:
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bullet}>
                  • Healthcare resource discovery and recommendations
                </Text>
                <Text style={styles.bullet}>
                  • AI-powered healthcare guidance and information
                </Text>
                <Text style={styles.bullet}>
                  • Appointment tracking and checklist management
                </Text>
                <Text style={styles.bullet}>
                  • Location-based resource mapping
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. User Accounts</Text>
              <Text style={styles.subsectionTitle}>Account Creation</Text>
              <Text style={styles.sectionText}>
                To use certain features of our Service, you must create an
                account. You agree to:
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bullet}>
                  • Provide accurate, current, and complete information
                </Text>
                <Text style={styles.bullet}>
                  • Maintain and update your account information
                </Text>
                <Text style={styles.bullet}>
                  • Maintain the security of your password
                </Text>
                <Text style={styles.bullet}>
                  • Accept responsibility for all activities under your account
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>4. Use of Service</Text>
              <Text style={styles.subsectionTitle}>Permitted Use</Text>
              <Text style={styles.sectionText}>
                You may use our Service for lawful purposes only. You agree not
                to:
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bullet}>
                  • Violate any applicable laws or regulations
                </Text>
                <Text style={styles.bullet}>
                  • Infringe on the rights of others
                </Text>
                <Text style={styles.bullet}>
                  • Transmit harmful or malicious code
                </Text>
                <Text style={styles.bullet}>
                  • Attempt to gain unauthorized access to our systems
                </Text>
                <Text style={styles.bullet}>
                  • Use the Service for any commercial purpose without our
                  consent
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>5. Medical Disclaimer</Text>
              <Text style={styles.sectionText}>
                <Text style={styles.bold}>IMPORTANT:</Text> Medi-Pal is a
                resource discovery platform and does not provide medical advice,
                diagnosis, or treatment. The information provided through our
                Service, including AI-generated responses, is for informational
                purposes only and should not be considered a substitute for
                professional medical advice, diagnosis, or treatment.
              </Text>
              <Text style={styles.sectionText}>
                Always seek the advice of your physician or other qualified
                health provider with any questions you may have regarding a
                medical condition. Never disregard professional medical advice
                or delay in seeking it because of something you have read or
                received through our Service.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>6. Intellectual Property</Text>
              <Text style={styles.sectionText}>
                The Service, including its original content, features, and
                functionality, is owned by Medi-Pal and is protected by
                international copyright, trademark, patent, trade secret, and
                other intellectual property laws.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                7. Limitation of Liability
              </Text>
              <Text style={styles.sectionText}>
                To the maximum extent permitted by law, Medi-Pal shall not be
                liable for any indirect, incidental, special, consequential, or
                punitive damages, or any loss of profits or revenues, whether
                incurred directly or indirectly, or any loss of data, use,
                goodwill, or other intangible losses.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>8. Termination</Text>
              <Text style={styles.sectionText}>
                We may terminate or suspend your account and access to the
                Service immediately, without prior notice, for conduct that we
                believe violates these Terms or is harmful to other users, us,
                or third parties, or for any other reason.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>9. Changes to Terms</Text>
              <Text style={styles.sectionText}>
                We reserve the right to modify these Terms at any time. We will
                notify users of significant changes via email or through our
                platform. Your continued use of the Service after such
                modifications constitutes acceptance of the updated Terms.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>10. Contact Information</Text>
              <Text style={styles.sectionText}>
                If you have any questions about these Terms, please contact us
                at:
              </Text>
              <Text style={styles.contactText}>
                Email: <Text style={styles.emailLink}>legal@medipal.app</Text>
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
