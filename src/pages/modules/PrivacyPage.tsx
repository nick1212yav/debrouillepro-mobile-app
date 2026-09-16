import React, { useMemo, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Cookie,
  Database,
  Globe2,
  Lock,
  Mail,
  ShieldCheck,
  UserCheck,
} from "lucide-react-native";
import { useRouter } from "expo-router";

type Section = {
  id: string;
  title: string;
  icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  content: string[];
};

const SECTIONS: Section[] = [
  {
    id: "scope",
    title: "1. Champ d’application",
    icon: Globe2,
    content: [
      "La présente Politique de confidentialité explique comment DébrouillePro traite les informations relatives à ses utilisateurs, visiteurs, partenaires et autres personnes utilisant ses services.",
      "DébrouillePro est conçu comme une plateforme internationale. Les règles applicables peuvent donc varier selon le pays, le territoire ou le cadre juridique dont relève l’utilisateur.",
      "Cette politique s’applique aux services numériques de DébrouillePro, notamment aux fonctionnalités sociales, professionnelles, commerciales, éducatives, financières, de santé, de communication et aux autres services effectivement disponibles dans l’application.",
    ],
  },
  {
    id: "data",
    title: "2. Données que nous pouvons traiter",
    icon: Database,
    content: [
      "Selon les fonctionnalités utilisées, DébrouillePro peut traiter des informations nécessaires à la création et à la gestion du compte, telles que le nom, les coordonnées, les identifiants techniques, les informations de profil et les préférences.",
      "Certaines fonctionnalités peuvent nécessiter des informations supplémentaires. Par exemple, les services de localisation peuvent utiliser des données de position lorsque l’utilisateur accorde l’autorisation correspondante.",
      "Les services de santé, financiers ou autres services sensibles peuvent nécessiter un traitement spécifique et des garanties supplémentaires. Ces données ne doivent être collectées ou utilisées que lorsqu’elles sont nécessaires à la fonctionnalité concernée et conformément au droit applicable.",
      "Les informations de paiement peuvent être traitées par DébrouillePro ou par des prestataires de paiement selon le service utilisé. Les données qui ne sont pas nécessaires à DébrouillePro ne doivent pas être collectées simplement parce qu’elles sont techniquement disponibles.",
    ],
  },
  {
    id: "purpose",
    title: "3. Pourquoi nous utilisons les données",
    icon: ShieldCheck,
    content: [
      "Fournir, maintenir et sécuriser les services demandés par l’utilisateur.",
      "Créer et gérer les comptes et les profils.",
      "Permettre les communications, publications, transactions, commandes, rendez-vous et autres opérations initiées par l’utilisateur.",
      "Personnaliser certaines fonctionnalités lorsque cela est nécessaire et autorisé.",
      "Détecter, prévenir et traiter les abus, fraudes, accès non autorisés et incidents de sécurité.",
      "Respecter les obligations légales et réglementaires applicables.",
      "Améliorer la fiabilité, les performances et l’expérience des services, dans les limites prévues par le droit applicable.",
    ],
  },
  {
    id: "legal-bases",
    title: "4. Fondements juridiques",
    icon: Lock,
    content: [
      "Selon le pays concerné, le traitement des données peut notamment reposer sur l’exécution d’un contrat, le consentement de la personne, le respect d’une obligation légale, la protection d’intérêts vitaux ou un intérêt légitime lorsque celui-ci est reconnu par le droit applicable.",
      "Lorsqu’un traitement repose sur le consentement, celui-ci peut être retiré dans les conditions prévues par la réglementation applicable. Le retrait du consentement n’affecte pas nécessairement la licéité des traitements effectués avant ce retrait.",
      "Les bases juridiques et les droits disponibles peuvent différer selon la juridiction de l’utilisateur.",
    ],
  },
  {
    id: "sharing",
    title: "5. Partage des informations",
    icon: UserCheck,
    content: [
      "DébrouillePro ne doit pas vendre les données personnelles des utilisateurs comme un produit.",
      "Certaines informations peuvent être communiquées à des prestataires techniques, partenaires ou autorités lorsque cela est nécessaire pour fournir un service, assurer la sécurité, traiter une opération ou respecter une obligation légale.",
      "Lorsqu’un utilisateur publie volontairement une information dans une fonctionnalité publique ou communautaire, cette information peut être visible par les personnes autorisées à accéder à cette fonctionnalité.",
      "Les informations peuvent également être partagées lorsque l’utilisateur demande explicitement une opération impliquant un tiers.",
    ],
  },
  {
    id: "international",
    title: "6. Traitements internationaux",
    icon: Globe2,
    content: [
      "DébrouillePro étant une plateforme internationale, certaines données peuvent être traitées ou hébergées dans un pays différent de celui où se trouve l’utilisateur.",
      "Lorsque la réglementation applicable impose des garanties pour les transferts internationaux de données, DébrouillePro doit mettre en œuvre les mécanismes appropriés prévus par cette réglementation.",
      "Les garanties applicables peuvent dépendre du pays de résidence, du lieu du traitement et de la nature des données concernées.",
    ],
  },
  {
    id: "security",
    title: "7. Sécurité",
    icon: Lock,
    content: [
      "DébrouillePro met en œuvre des mesures techniques et organisationnelles destinées à protéger les informations contre les accès non autorisés, la perte, la modification, la divulgation ou la destruction.",
      "Les mesures de sécurité peuvent inclure le contrôle des accès, l’authentification, la protection des communications, la surveillance des événements de sécurité et des mesures de sauvegarde adaptées.",
      "Aucun système informatique ne peut garantir une sécurité absolue. Les utilisateurs doivent également protéger leurs identifiants et signaler rapidement toute activité suspecte.",
    ],
  },
  {
    id: "retention",
    title: "8. Conservation",
    icon: Database,
    content: [
      "Les données sont conservées pendant une durée compatible avec leur finalité, les besoins opérationnels légitimes et les obligations légales applicables.",
      "La durée de conservation peut varier selon le type de données et le service concerné.",
      "Lorsque les données ne sont plus nécessaires et qu’aucune obligation ne justifie leur conservation, elles doivent être supprimées, anonymisées ou traitées conformément aux exigences applicables.",
    ],
  },
  {
    id: "rights",
    title: "9. Vos droits",
    icon: UserCheck,
    content: [
      "Selon votre juridiction, vous pouvez disposer de droits concernant vos données personnelles, notamment le droit d’accès, de rectification, de suppression, de limitation du traitement, d’opposition, de portabilité ou de retrait du consentement.",
      "Certains droits peuvent être soumis à des conditions ou exceptions prévues par la loi.",
      "Les utilisateurs doivent pouvoir exercer leurs droits par les moyens de contact officiellement proposés par DébrouillePro.",
    ],
  },
  {
    id: "children",
    title: "10. Protection des mineurs",
    icon: ShieldCheck,
    content: [
      "Les services destinés aux adultes ou soumis à des restrictions d’âge doivent respecter les conditions d’âge applicables dans la juridiction concernée.",
      "DébrouillePro ne doit pas demander à un mineur des informations personnelles au-delà de ce qui est autorisé ou nécessaire pour un service légalement accessible à son âge.",
      "Lorsque la réglementation exige l’intervention ou le consentement d’un parent ou représentant légal, les mécanismes appropriés doivent être utilisés.",
    ],
  },
  {
    id: "cookies",
    title: "11. Cookies et technologies similaires",
    icon: Cookie,
    content: [
      "Les services numériques peuvent utiliser des technologies nécessaires à leur fonctionnement, à la sécurité, à la mémorisation des préférences ou à d’autres finalités autorisées.",
      "Lorsque la loi exige un consentement pour certaines technologies non essentielles, celui-ci doit être obtenu avant leur utilisation.",
      "Les possibilités de gestion des cookies et technologies similaires peuvent varier selon la plateforme, le navigateur et la juridiction.",
    ],
  },
  {
    id: "third-party",
    title: "12. Services tiers",
    icon: Globe2,
    content: [
      "Certaines fonctionnalités peuvent dépendre de services tiers, notamment des services d’authentification, d’hébergement, de stockage, de communication, de cartographie, de paiement ou d’autres infrastructures techniques.",
      "Lorsque des prestataires traitent des données pour le compte de DébrouillePro, leurs accès doivent être limités aux besoins du service et encadrés par les accords appropriés.",
      "Les services tiers utilisés directement par l’utilisateur peuvent également être soumis à leurs propres politiques de confidentialité.",
    ],
  },
  {
    id: "account",
    title: "13. Compte et contrôle utilisateur",
    icon: UserCheck,
    content: [
      "L’utilisateur doit pouvoir accéder aux informations de son compte disponibles dans l’application et, lorsque la fonctionnalité existe, modifier les informations qu’il a fournies.",
      "La suppression d’un compte peut entraîner la suppression de certaines données, sous réserve des données qui doivent légalement ou techniquement être conservées.",
      "La suppression d’un compte ne signifie pas nécessairement la suppression immédiate de toutes les informations lorsque leur conservation est légalement requise ou nécessaire à la résolution d’un litige, à la sécurité ou à la prévention de la fraude.",
    ],
  },
  {
    id: "changes",
    title: "14. Modifications de cette politique",
    icon: ShieldCheck,
    content: [
      "Cette politique peut évoluer afin de tenir compte des changements du service, des technologies ou des exigences légales.",
      "Lorsqu’une modification importante nécessite une information ou un consentement particulier, les mesures appropriées doivent être mises en œuvre.",
      "La date de dernière mise à jour doit être affichée clairement dans l’application.",
    ],
  },
  {
    id: "contact",
    title: "15. Contact et réclamations",
    icon: Mail,
    content: [
      "Pour toute question concernant la confidentialité ou l’exercice de vos droits, utilisez le canal officiel de contact de DébrouillePro affiché dans l’application ou sur son site officiel.",
      "Lorsque la réglementation applicable le prévoit, vous pouvez également disposer du droit d’introduire une réclamation auprès de l’autorité de protection des données compétente dans votre juridiction.",
    ],
  },
];

function SectionCard({
  section,
  expanded,
  onPress,
}: {
  section: Section;
  expanded: boolean;
  onPress: () => void;
}) {
  const Icon = section.icon;

  return (
    <View style={styles.card}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        style={({ pressed }) => [styles.cardHeader, pressed && styles.pressed]}
      >
        <View style={styles.iconBox}>
          <Icon size={20} color="#8ab4ff" strokeWidth={2} />
        </View>

        <Text style={styles.cardTitle}>{section.title}</Text>

        {expanded ? (
          <ChevronDown size={20} color="#94a3b8" />
        ) : (
          <ChevronRight size={20} color="#94a3b8" />
        )}
      </Pressable>

      {expanded && (
        <View style={styles.cardContent}>
          {section.content.map((paragraph, index) => (
            <Text key={`${section.id}-${index}`} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

function PrivacyContent() {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const updatedLabel = useMemo(() => {
    const date = new Date();
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  const openContact = async () => {
    // Aucun e-mail fictif n'est injecté ici.
    // Branchez le canal officiel de support lorsqu'il est défini.
    await Linking.openURL("mailto:");
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={22} color="#ffffff" />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Confidentialité</Text>
          <Text style={styles.headerSubtitle}>
            Protection mondiale des données
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <ShieldCheck size={34} color="#8ab4ff" strokeWidth={1.8} />
          </View>

          <Text style={styles.heroTitle}>
            Votre vie privée est une priorité
          </Text>

          <Text style={styles.heroText}>
            Cette politique présente les principes appliqués au traitement des
            données personnelles dans les services DébrouillePro.
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.statusDot} />
            <Text style={styles.metaText}>
              Dernière mise à jour : {updatedLabel}
            </Text>
          </View>
        </View>

        <View style={styles.notice}>
          <Lock size={18} color="#8ab4ff" />
          <View style={styles.noticeBody}>
            <Text style={styles.noticeTitle}>Principe essentiel</Text>
            <Text style={styles.noticeText}>
              Les données doivent être collectées et utilisées uniquement pour
              des finalités légitimes, nécessaires et compatibles avec les
              droits des personnes.
            </Text>
          </View>
        </View>

        {SECTIONS.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            expanded={expandedId === section.id}
            onPress={() =>
              setExpandedId((current) =>
                current === section.id ? null : section.id,
              )
            }
          />
        ))}

        <View style={styles.contactCard}>
          <View style={styles.contactIcon}>
            <Mail size={22} color="#8ab4ff" />
          </View>

          <Text style={styles.contactTitle}>
            Une question sur vos données ?
          </Text>

          <Text style={styles.contactText}>
            Utilisez le canal officiel de confidentialité indiqué par
            DébrouillePro lorsque celui-ci est configuré.
          </Text>

          <Pressable
            onPress={openContact}
            style={({ pressed }) => [
              styles.contactButton,
              pressed && styles.pressed,
            ]}
          >
            <Mail size={18} color="#ffffff" />
            <Text style={styles.contactButtonText}>Contacter</Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>
          DébrouillePro — Politique de confidentialité internationale
        </Text>
      </ScrollView>
    </View>
  );
}

export default function PrivacyPage() {
  return <PrivacyContent />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#050812",
  },

  header: {
    minHeight: 72,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(5,8,18,0.96)",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  headerText: {
    flex: 1,
    marginLeft: 13,
  },

  headerTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 2,
  },

  scroll: {
    flex: 1,
  },

  content: {
    padding: 16,
    paddingBottom: 42,
  },

  hero: {
    padding: 22,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    marginBottom: 14,
  },

  heroIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59,130,246,0.12)",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.2)",
    marginBottom: 18,
  },

  heroTitle: {
    color: "#ffffff",
    fontSize: 27,
    lineHeight: 33,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  heroText: {
    color: "#b7c1d1",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#60a5fa",
    marginRight: 8,
  },

  metaText: {
    color: "#7f8ca3",
    fontSize: 12,
  },

  notice: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 18,
    marginBottom: 14,
    backgroundColor: "rgba(59,130,246,0.08)",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.16)",
  },

  noticeBody: {
    flex: 1,
    marginLeft: 12,
  },

  noticeTitle: {
    color: "#dbeafe",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 5,
  },

  noticeText: {
    color: "#aebbd0",
    fontSize: 13,
    lineHeight: 20,
  },

  card: {
    marginBottom: 10,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  cardHeader: {
    minHeight: 68,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    marginRight: 12,
  },

  cardTitle: {
    flex: 1,
    color: "#f8fafc",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "750",
    paddingRight: 8,
  },

  cardContent: {
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },

  paragraph: {
    color: "#b6c0d0",
    fontSize: 13,
    lineHeight: 21,
    marginTop: 12,
  },

  contactCard: {
    marginTop: 10,
    padding: 20,
    alignItems: "center",
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  contactIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59,130,246,0.12)",
    marginBottom: 12,
  },

  contactTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "850",
  },

  contactText: {
    color: "#94a3b8",
    textAlign: "center",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },

  contactButton: {
    marginTop: 16,
    minHeight: 46,
    paddingHorizontal: 20,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2563eb",
  },

  contactButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },

  footer: {
    color: "#64748b",
    textAlign: "center",
    fontSize: 11,
    lineHeight: 18,
    marginTop: 24,
    paddingHorizontal: 20,
  },

  pressed: {
    opacity: 0.72,
  },
});
