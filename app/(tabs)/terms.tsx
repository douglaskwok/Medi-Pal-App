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
import { LanguageProvider, useLanguage } from "../../constants/LanguageContext";

const translations = {
  en: {
    title: "Terms of Service",
    lastUpdated: "Last updated:",
    intro:
      'Welcome to Medi-Pal. These Terms of Service ("Terms") govern your access to and use of the Medi-Pal mobile application and services ("Service"). By accessing or using our Service, you agree to be bound by these Terms.',
    section1Title: "1. Acceptance of Terms",
    section1Text:
      "By creating an account, accessing, or using Medi-Pal, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you may not use our Service.",
    section2Title: "2. Description of Service",
    section2Text:
      "Medi-Pal is a healthcare resource discovery platform designed to help Medi-Cal beneficiaries find and access healthcare resources, including clinics, pharmacies, dental services, and mental health services. Our Service includes:",
    bullet1: "• Healthcare resource discovery and recommendations",
    bullet2: "• AI-powered healthcare guidance and information",
    bullet3: "• Appointment tracking and checklist management",
    bullet4: "• Location-based resource mapping",
    section3Title: "3. User Accounts",
    accountCreation: "Account Creation",
    section3Text:
      "To use certain features of our Service, you must create an account. You agree to:",
    bullet5: "• Provide accurate, current, and complete information",
    bullet6: "• Maintain and update your account information",
    bullet7: "• Maintain the security of your password",
    bullet8: "• Accept responsibility for all activities under your account",
    section4Title: "4. Use of Service",
    permittedUse: "Permitted Use",
    section4Text:
      "You may use our Service for lawful purposes only. You agree not to:",
    bullet9: "• Violate any applicable laws or regulations",
    bullet10: "• Infringe on the rights of others",
    bullet11: "• Transmit harmful or malicious code",
    bullet12: "• Attempt to gain unauthorized access to our systems",
    bullet13:
      "• Use the Service for any commercial purpose without our consent",
    section5Title: "5. Medical Disclaimer",
    important: "IMPORTANT:",
    section5Text:
      "Medi-Pal is a resource discovery platform and does not provide medical advice, diagnosis, or treatment. The information provided through our Service, including AI-generated responses, is for informational purposes only and should not be considered a substitute for professional medical advice, diagnosis, or treatment.",
    section5Text2:
      "Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read or received through our Service.",
    section6Title: "6. Intellectual Property",
    section6Text:
      "The Service, including its original content, features, and functionality, is owned by Medi-Pal and is protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.",
    section7Title: "7. Limitation of Liability",
    section7Text:
      "To the maximum extent permitted by law, Medi-Pal shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.",
    section8Title: "8. Termination",
    section8Text:
      "We may terminate or suspend your account and access to the Service immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason.",
    section9Title: "9. Changes to Terms",
    section9Text:
      "We reserve the right to modify these Terms at any time. We will notify users of significant changes via email or through our platform. Your continued use of the Service after such modifications constitutes acceptance of the updated Terms.",
    section10Title: "10. Contact Information",
    section10Text:
      "If you have any questions about these Terms, please contact us at:",
    email: "Email:",
  },
  es: {
    title: "Términos de Servicio",
    lastUpdated: "Última actualización:",
    intro:
      'Bienvenido a Medi-Pal. Estos Términos de Servicio ("Términos") rigen tu acceso y uso de la aplicación móvil de Medi-Pal y los servicios ("Servicio"). Al acceder o usar nuestro Servicio, aceptas estar vinculado por estos Términos.',
    section1Title: "1. Aceptación de Términos",
    section1Text:
      "Al crear una cuenta, acceder o usar Medi-Pal, reconoces que has leído, entendido y aceptas estar vinculado por estos Términos y nuestra Política de Privacidad. Si no aceptas estos Términos, no puedes usar nuestro Servicio.",
    section2Title: "2. Descripción del Servicio",
    section2Text:
      "Medi-Pal es una plataforma de descubrimiento de recursos de atención médica diseñada para ayudar a los beneficiarios de Medi-Cal a encontrar y acceder a recursos de atención médica, incluyendo clínicas, farmacias, servicios dentales y servicios de salud mental. Nuestro Servicio incluye:",
    bullet1:
      "• Descubrimiento de recursos de atención médica y recomendaciones",
    bullet2: "• Orientación e información de atención médica impulsada por IA",
    bullet3: "• Seguimiento de citas y gestión de listas de verificación",
    bullet4: "• Mapeo de recursos basado en ubicación",
    section3Title: "3. Cuentas de Usuario",
    accountCreation: "Creación de Cuenta",
    section3Text:
      "Para usar ciertas características de nuestro Servicio, debes crear una cuenta. Aceptas:",
    bullet5: "• Proporcionar información precisa, actual y completa",
    bullet6: "• Mantener y actualizar la información de tu cuenta",
    bullet7: "• Mantener la seguridad de tu contraseña",
    bullet8: "• Aceptar responsabilidad por todas las actividades en tu cuenta",
    section4Title: "4. Uso del Servicio",
    permittedUse: "Uso Permitido",
    section4Text:
      "Puedes usar nuestro Servicio solo para propósitos legales. Aceptas no:",
    bullet9: "• Violar las leyes o regulaciones aplicables",
    bullet10: "• Infringir los derechos de otros",
    bullet11: "• Transmitir código dañino o malicioso",
    bullet12: "• Intentar obtener acceso no autorizado a nuestros sistemas",
    bullet13:
      "• Usar el Servicio para cualquier propósito comercial sin nuestro consentimiento",
    section5Title: "5. Descargo de Responsabilidad Médica",
    important: "IMPORTANTE:",
    section5Text:
      "Medi-Pal es una plataforma de descubrimiento de recursos y no proporciona consejo médico, diagnóstico o tratamiento. La información proporcionada a través de nuestro Servicio, incluyendo respuestas generadas por IA, es solo para fines informativos y no debe considerarse como un sustituto del consejo médico profesional, diagnóstico o tratamiento.",
    section5Text2:
      "Siempre busca el consejo de tu médico u otro proveedor de salud calificado con cualquier pregunta que puedas tener sobre una condición médica. Nunca ignores el consejo médico profesional ni demores en buscarlo por algo que hayas leído o recibido a través de nuestro Servicio.",
    section6Title: "6. Propiedad Intelectual",
    section6Text:
      "El Servicio, incluyendo su contenido original, características y funcionalidad, es propiedad de Medi-Pal y está protegido por leyes internacionales de derechos de autor, marca registrada, patente, secreto comercial y otras leyes de propiedad intelectual.",
    section7Title: "7. Limitación de Responsabilidad",
    section7Text:
      "En la máxima medida permitida por la ley, Medi-Pal no será responsable por ningún daño indirecto, incidental, especial, consecuente o punitivo, o cualquier pérdida de ganancias o ingresos, ya sea incurrido directa o indirectamente, o cualquier pérdida de datos, uso, buena voluntad u otras pérdidas intangibles.",
    section8Title: "8. Terminación",
    section8Text:
      "Podemos terminar o suspender tu cuenta y acceso al Servicio inmediatamente, sin aviso previo, por conducta que creamos que viola estos Términos o es dañina para otros usuarios, nosotros o terceros, o por cualquier otra razón.",
    section9Title: "9. Cambios en los Términos",
    section9Text:
      "Nos reservamos el derecho de modificar estos Términos en cualquier momento. Notificaremos a los usuarios sobre cambios significativos a través de correo electrónico o a través de nuestra plataforma. Tu uso continuo del Servicio después de tales modificaciones constituye aceptación de los Términos actualizados.",
    section10Title: "10. Información de Contacto",
    section10Text:
      "Si tienes alguna pregunta sobre estos Términos, contáctanos en:",
    email: "Correo Electrónico:",
  },
};

export default function TermsScreen() {
  const { language } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const t =
    translations[language as keyof typeof translations] || translations.en;

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
            <Text style={styles.title}>{t.title}</Text>
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
            {t.lastUpdated}{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>

          <View style={styles.contentBox}>
            <Text style={styles.introText}>{t.intro}</Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.section1Title}</Text>
              <Text style={styles.sectionText}>{t.section1Text}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.section2Title}</Text>
              <Text style={styles.sectionText}>{t.section2Text}</Text>
              <View style={styles.bulletList}>
                <Text style={styles.bullet}>{t.bullet1}</Text>
                <Text style={styles.bullet}>{t.bullet2}</Text>
                <Text style={styles.bullet}>{t.bullet3}</Text>
                <Text style={styles.bullet}>{t.bullet4}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.section3Title}</Text>
              <Text style={styles.subsectionTitle}>{t.accountCreation}</Text>
              <Text style={styles.sectionText}>{t.section3Text}</Text>
              <View style={styles.bulletList}>
                <Text style={styles.bullet}>{t.bullet5}</Text>
                <Text style={styles.bullet}>{t.bullet6}</Text>
                <Text style={styles.bullet}>{t.bullet7}</Text>
                <Text style={styles.bullet}>{t.bullet8}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.section4Title}</Text>
              <Text style={styles.subsectionTitle}>{t.permittedUse}</Text>
              <Text style={styles.sectionText}>{t.section4Text}</Text>
              <View style={styles.bulletList}>
                <Text style={styles.bullet}>{t.bullet9}</Text>
                <Text style={styles.bullet}>{t.bullet10}</Text>
                <Text style={styles.bullet}>{t.bullet11}</Text>
                <Text style={styles.bullet}>{t.bullet12}</Text>
                <Text style={styles.bullet}>{t.bullet13}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.section5Title}</Text>
              <Text style={styles.sectionText}>
                <Text style={styles.bold}>{t.important}</Text> {t.section5Text}
              </Text>
              <Text style={styles.sectionText}>{t.section5Text2}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.section6Title}</Text>
              <Text style={styles.sectionText}>{t.section6Text}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.section7Title}</Text>
              <Text style={styles.sectionText}>{t.section7Text}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.section8Title}</Text>
              <Text style={styles.sectionText}>{t.section8Text}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.section9Title}</Text>
              <Text style={styles.sectionText}>{t.section9Text}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.section10Title}</Text>
              <Text style={styles.sectionText}>{t.section10Text}</Text>
              <Text style={styles.contactText}>
                {t.email}{" "}
                <Text style={styles.emailLink}>legal@medipal.app</Text>
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
