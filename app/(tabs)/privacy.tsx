import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import { Theme } from "../../constants/Theme";
import { Ionicons } from "@expo/vector-icons";
import { CustomTabBar } from "./_layout";
import { useLanguage } from "../../constants/LanguageContext";

const translations = {
  en: {
    title: "Privacy Policy",
    lastUpdated: "Last updated:",
    intro:
      "At Medi-Pal, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your information when you use our healthcare resource platform for Medi-Cal beneficiaries.",
    infoWeCollect: "Information We Collect",
    accountInfo: "Account Information",
    bullet1: "• Email address (required for account creation)",
    bullet2:
      "• Profile information (name, age, gender, phone number - all optional)",
    bullet3: "• Subscription and billing information",
    usageData: "Usage Data",
    bullet4: "• How you interact with our platform",
    bullet5: "• Feature usage and preferences",
    bullet6: "• Device and browser information",
    bullet7: "• IP address and location data",
    chatInteractions: "Chat and AI Interactions",
    bullet8: "• Messages you send to our AI assistant",
    bullet9: "• AI responses and conversation history",
    bullet10: "• Search queries and preferences",
    howWeUse: "How We Use Your Information",
    coreServices: "Core Services",
    bullet11: "• Provide healthcare resource discovery and recommendations",
    bullet12: "• Store and manage your account information securely",
    bullet13: "• Provide personalized healthcare guidance via AI assistant",
    bullet14: "• Maintain your appointment history and preferences",
    accountManagement: "Account Management",
    bullet15: "• Create and manage your account",
    bullet16: "• Process payments and manage subscriptions",
    bullet17: "• Provide customer support",
    bullet18: "• Send important account and service updates",
    legalAndSafety: "Legal and Safety",
    bullet19: "• Comply with legal obligations",
    bullet20: "• Protect against fraud and abuse",
    bullet21: "• Enforce our terms of service",
    bullet22: "• Respond to legal requests",
    dataSecurity: "Data Security",
    securityText:
      "We implement industry-standard security measures to protect your data:",
    bullet23: "• All data is encrypted during transmission and storage",
    bullet24: "• Information is stored in secure, private cloud storage",
    bullet25: "• Access to your data is strictly controlled and monitored",
    bullet26: "• Regular security audits and vulnerability assessments",
    bullet27: "• Secure authentication and session management",
    privacyRights: "Your Privacy Rights",
    rightsText: "You have the following rights regarding your personal data:",
    access: "Access:",
    accessText: "Request a copy of your personal data",
    correction: "Correction:",
    correctionText: "Update or correct inaccurate information",
    deletion: "Deletion:",
    deletionText: "Delete your account and all associated data",
    portability: "Portability:",
    portabilityText: "Export your data in a standard format",
    withdraw: "Withdraw Consent:",
    withdrawText: "Opt out of data processing where consent-based",
    object: "Object:",
    objectText: "Object to certain types of data processing",
    contactUs: "Contact Us",
    contactText:
      "If you have questions about this Privacy Policy or want to exercise your privacy rights:",
    responseText: "We will respond to privacy inquiries within 30 days.",
    policyUpdates: "Policy Updates",
    updatesText:
      'We may update this Privacy Policy from time to time. We will notify users of significant changes via email or through our platform. The "Last updated" date at the top shows when this policy was last modified.',
    email: "Email:",
  },
  es: {
    title: "Política de Privacidad",
    lastUpdated: "Última actualización:",
    intro:
      "En Medi-Pal, tomamos tu privacidad en serio. Esta Política de Privacidad explica cómo recopilamos, usamos y protegemos tu información cuando usas nuestra plataforma de recursos de atención médica para beneficiarios de Medi-Cal.",
    infoWeCollect: "Información que Recopilamos",
    accountInfo: "Información de Cuenta",
    bullet1:
      "• Dirección de correo electrónico (requerida para crear una cuenta)",
    bullet2:
      "• Información de perfil (nombre, edad, género, número de teléfono - todos opcionales)",
    bullet3: "• Información de suscripción y facturación",
    usageData: "Datos de Uso",
    bullet4: "• Cómo interactúas con nuestra plataforma",
    bullet5: "• Uso de características y preferencias",
    bullet6: "• Información del dispositivo y navegador",
    bullet7: "• Datos de dirección IP y ubicación",
    chatInteractions: "Interacciones de Chat e IA",
    bullet8: "• Mensajes que envías a nuestro asistente de IA",
    bullet9: "• Respuestas de IA e historial de conversaciones",
    bullet10: "• Consultas de búsqueda y preferencias",
    howWeUse: "Cómo Usamos Tu Información",
    coreServices: "Servicios Principales",
    bullet11:
      "• Proporcionar descubrimiento de recursos de atención médica y recomendaciones",
    bullet12:
      "• Almacenar y gestionar tu información de cuenta de forma segura",
    bullet13:
      "• Proporcionar orientación personalizada de atención médica a través del asistente de IA",
    bullet14: "• Mantener tu historial de citas y preferencias",
    accountManagement: "Gestión de Cuenta",
    bullet15: "• Crear y gestionar tu cuenta",
    bullet16: "• Procesar pagos y gestionar suscripciones",
    bullet17: "• Proporcionar soporte al cliente",
    bullet18: "• Enviar actualizaciones importantes de cuenta y servicio",
    legalAndSafety: "Legal y Seguridad",
    bullet19: "• Cumplir con obligaciones legales",
    bullet20: "• Proteger contra fraude y abuso",
    bullet21: "• Aplicar nuestros términos de servicio",
    bullet22: "• Responder a solicitudes legales",
    dataSecurity: "Seguridad de Datos",
    securityText:
      "Implementamos medidas de seguridad estándar de la industria para proteger tus datos:",
    bullet23:
      "• Todos los datos se cifran durante la transmisión y almacenamiento",
    bullet24:
      "• La información se almacena en almacenamiento seguro en la nube privada",
    bullet25:
      "• El acceso a tus datos está estrictamente controlado y monitoreado",
    bullet26:
      "• Auditorías de seguridad regulares y evaluaciones de vulnerabilidades",
    bullet27: "• Autenticación segura y gestión de sesiones",
    privacyRights: "Tus Derechos de Privacidad",
    rightsText:
      "Tienes los siguientes derechos respecto a tus datos personales:",
    access: "Acceso:",
    accessText: "Solicitar una copia de tus datos personales",
    correction: "Corrección:",
    correctionText: "Actualizar o corregir información inexacta",
    deletion: "Eliminación:",
    deletionText: "Eliminar tu cuenta y todos los datos asociados",
    portability: "Portabilidad:",
    portabilityText: "Exportar tus datos en un formato estándar",
    withdraw: "Retirar Consentimiento:",
    withdrawText:
      "Optar por no participar en el procesamiento de datos donde se basa en el consentimiento",
    object: "Objeción:",
    objectText: "Objetar ciertos tipos de procesamiento de datos",
    contactUs: "Contáctanos",
    contactText:
      "Si tienes preguntas sobre esta Política de Privacidad o deseas ejercer tus derechos de privacidad:",
    responseText:
      "Responderemos a las consultas de privacidad dentro de 30 días.",
    policyUpdates: "Actualizaciones de Política",
    updatesText:
      'Podemos actualizar esta Política de Privacidad de vez en cuando. Notificaremos a los usuarios sobre cambios significativos a través de correo electrónico o a través de nuestra plataforma. La fecha "Última actualización" en la parte superior muestra cuándo se modificó esta política por última vez.',
    email: "Correo Electrónico:",
  },
};

export default function PrivacyScreen() {
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
              <Text style={styles.sectionTitle}>{t.infoWeCollect}</Text>

              <Text style={styles.subsectionTitle}>{t.accountInfo}</Text>
              <View style={styles.bulletList}>
                <Text style={styles.bullet}>{t.bullet1}</Text>
                <Text style={styles.bullet}>{t.bullet2}</Text>
                <Text style={styles.bullet}>{t.bullet3}</Text>
              </View>

              <Text style={styles.subsectionTitle}>{t.usageData}</Text>
              <View style={styles.bulletList}>
                <Text style={styles.bullet}>{t.bullet4}</Text>
                <Text style={styles.bullet}>{t.bullet5}</Text>
                <Text style={styles.bullet}>{t.bullet6}</Text>
                <Text style={styles.bullet}>{t.bullet7}</Text>
              </View>

              <Text style={styles.subsectionTitle}>{t.chatInteractions}</Text>
              <View style={styles.bulletList}>
                <Text style={styles.bullet}>{t.bullet8}</Text>
                <Text style={styles.bullet}>{t.bullet9}</Text>
                <Text style={styles.bullet}>{t.bullet10}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.howWeUse}</Text>

              <Text style={styles.subsectionTitle}>{t.coreServices}</Text>
              <View style={styles.bulletList}>
                <Text style={styles.bullet}>{t.bullet11}</Text>
                <Text style={styles.bullet}>{t.bullet12}</Text>
                <Text style={styles.bullet}>{t.bullet13}</Text>
                <Text style={styles.bullet}>{t.bullet14}</Text>
              </View>

              <Text style={styles.subsectionTitle}>{t.accountManagement}</Text>
              <View style={styles.bulletList}>
                <Text style={styles.bullet}>{t.bullet15}</Text>
                <Text style={styles.bullet}>{t.bullet16}</Text>
                <Text style={styles.bullet}>{t.bullet17}</Text>
                <Text style={styles.bullet}>{t.bullet18}</Text>
              </View>

              <Text style={styles.subsectionTitle}>{t.legalAndSafety}</Text>
              <View style={styles.bulletList}>
                <Text style={styles.bullet}>{t.bullet19}</Text>
                <Text style={styles.bullet}>{t.bullet20}</Text>
                <Text style={styles.bullet}>{t.bullet21}</Text>
                <Text style={styles.bullet}>{t.bullet22}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.dataSecurity}</Text>
              <Text style={styles.sectionText}>{t.securityText}</Text>
              <View style={styles.bulletList}>
                <Text style={styles.bullet}>{t.bullet23}</Text>
                <Text style={styles.bullet}>{t.bullet24}</Text>
                <Text style={styles.bullet}>{t.bullet25}</Text>
                <Text style={styles.bullet}>{t.bullet26}</Text>
                <Text style={styles.bullet}>{t.bullet27}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.privacyRights}</Text>
              <Text style={styles.sectionText}>{t.rightsText}</Text>
              <View style={styles.bulletList}>
                <Text style={styles.bullet}>
                  <Text style={styles.bold}>{t.access}</Text> {t.accessText}
                </Text>
                <Text style={styles.bullet}>
                  <Text style={styles.bold}>{t.correction}</Text>{" "}
                  {t.correctionText}
                </Text>
                <Text style={styles.bullet}>
                  <Text style={styles.bold}>{t.deletion}</Text> {t.deletionText}
                </Text>
                <Text style={styles.bullet}>
                  <Text style={styles.bold}>{t.portability}</Text>{" "}
                  {t.portabilityText}
                </Text>
                <Text style={styles.bullet}>
                  <Text style={styles.bold}>{t.withdraw}</Text> {t.withdrawText}
                </Text>
                <Text style={styles.bullet}>
                  <Text style={styles.bold}>{t.object}</Text> {t.objectText}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.contactUs}</Text>
              <Text style={styles.sectionText}>{t.contactText}</Text>
              <Text style={styles.contactText}>
                {t.email}{" "}
                <Text style={styles.emailLink}>privacy@medipal.app</Text>
              </Text>
              <Text style={styles.sectionText}>{t.responseText}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.policyUpdates}</Text>
              <Text style={styles.sectionText}>{t.updatesText}</Text>
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
