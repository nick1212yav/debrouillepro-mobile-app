// src/pages/modules/LicensesPage.tsx

import React from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  ArrowLeft,
  Code2,
  ExternalLink,
  FileCode2,
  Package,
  Scale,
  ShieldCheck,
} from "lucide-react-native";

import { ACCENT_PALETTES, useAppearance } from "@/hooks/use-appearance";

/* ============================================================================
 * TYPES
 * ========================================================================== */

interface LicensesPageProps {
  onBack: () => void;
}

type LicenseItem = {
  name: string;
  category: string;
  license: string;
  text: string;
  url: string;
};

/* ============================================================================
 * LICENSE DATA
 *
 * Ces éléments correspondent aux briques déclarées dans la page source.
 * Ne pas ajouter une dépendance ici simplement parce qu'elle existe
 * potentiellement dans le projet : la liste doit rester vérifiable.
 * ========================================================================== */

const LICENSES: LicenseItem[] = [
  {
    name: "React",
    category: "Interface",
    license: "MIT",
    text: "Bibliothèque open source utilisée pour construire l'interface.",
    url: "https://github.com/facebook/react",
  },
  {
    name: "React Router",
    category: "Navigation",
    license: "MIT",
    text: "Gestion de la navigation entre les pages de l'application.",
    url: "https://github.com/remix-run/react-router",
  },
  {
    name: "Lucide",
    category: "Icônes",
    license: "ISC",
    text: "Collection d'icônes utilisée dans l'interface.",
    url: "https://github.com/lucide-icons/lucide",
  },
  {
    name: "Motion",
    category: "Animations",
    license: "MIT",
    text: "Animations et transitions de l'expérience utilisateur.",
    url: "https://github.com/motiondivision/motion",
  },
  {
    name: "Convex",
    category: "Backend",
    license: "Apache-2.0",
    text: "Infrastructure backend et fonctions de données de l'application.",
    url: "https://github.com/get-convex/convex-js",
  },
];

/* ============================================================================
 * HELPERS
 * ========================================================================== */

async function openExternalUrl(url: string) {
  try {
    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      Alert.alert(
        "Lien indisponible",
        "Impossible d'ouvrir ce lien sur cet appareil.",
      );
      return;
    }

    await Linking.openURL(url);
  } catch {
    Alert.alert("Erreur", "Impossible d'ouvrir le dépôt officiel.");
  }
}

async function shareLicensePage() {
  try {
    await Share.share({
      title: "Licences & open source",
      message: "Licences et projets open source utilisés par DébrouillePro.",
    });
  } catch {
    // L'utilisateur peut simplement avoir annulé le partage.
  }
}

/* ============================================================================
 * LICENSE CARD
 * ========================================================================== */

function LicenseCard({
  item,
  accent,
}: {
  item: LicenseItem;
  accent: {
    hex: string;
    glow: string;
  };
}) {
  const handleOpen = () => {
    void openExternalUrl(item.url);
  };

  return (
    <View style={styles.licenseCard}>
      <View
        style={[
          styles.licenseIcon,
          {
            backgroundColor: `${accent.hex}12`,
            borderColor: `${accent.hex}1C`,
          },
        ]}
      >
        <FileCode2 size={18} color={accent.hex} />
      </View>

      <View style={styles.licenseBody}>
        <View style={styles.licenseTitleRow}>
          <Text style={styles.licenseName} numberOfLines={1}>
            {item.name}
          </Text>

          <View
            style={[
              styles.licenseBadge,
              {
                backgroundColor: `${accent.hex}14`,
                borderColor: `${accent.hex}20`,
              },
            ]}
          >
            <Text
              style={[
                styles.licenseBadgeText,
                {
                  color: accent.hex,
                },
              ]}
            >
              {item.license}
            </Text>
          </View>
        </View>

        <Text style={styles.licenseCategory}>{item.category}</Text>

        <Text style={styles.licenseDescription}>{item.text}</Text>

        <Pressable
          onPress={handleOpen}
          accessibilityRole="link"
          accessibilityLabel={`Ouvrir le dépôt officiel de ${item.name}`}
          style={({ pressed }) => [
            styles.repositoryButton,
            pressed && styles.pressed,
          ]}
        >
          <ExternalLink size={13} color={accent.hex} />

          <Text
            style={[
              styles.repositoryButtonText,
              {
                color: accent.hex,
              },
            ]}
          >
            Dépôt officiel
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ============================================================================
 * MAIN
 * ========================================================================== */

export default function LicensesPage({ onBack }: LicensesPageProps) {
  const { prefs } = useAppearance();

  const palette = ACCENT_PALETTES[prefs.accent];

  return (
    <View style={styles.screen}>
      {/* ======================================================================
       * HEADER
       * ==================================================================== */}

      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.pressed,
          ]}
        >
          <ArrowLeft size={19} color="#FFFFFF" />
        </Pressable>

        <View style={styles.headerIdentity}>
          <View style={styles.headerTitleRow}>
            <Scale size={17} color={palette.hex} />

            <Text style={styles.headerTitle} numberOfLines={1}>
              Licences & open source
            </Text>
          </View>

          <Text style={styles.headerSubtitle}>
            Les briques logicielles qui composent DébrouillePro
          </Text>
        </View>

        <Pressable
          onPress={() => {
            void shareLicensePage();
          }}
          accessibilityRole="button"
          accessibilityLabel="Partager les licences"
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.pressed,
          ]}
        >
          <Code2 size={18} color={palette.hex} />
        </Pressable>
      </View>

      {/* ======================================================================
       * CONTENT
       * ==================================================================== */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* --------------------------------------------------------------------
         * HERO
         * ------------------------------------------------------------------ */}

        <View
          style={[
            styles.heroCard,
            {
              borderColor: `${palette.hex}25`,
              shadowColor: palette.glow,
            },
          ]}
        >
          <View
            style={[
              styles.heroIcon,
              {
                backgroundColor: `${palette.hex}12`,
                borderColor: `${palette.hex}20`,
              },
            ]}
          >
            <Package size={23} color={palette.hex} />
          </View>

          <View style={styles.heroIdentity}>
            <Text
              style={[
                styles.heroEyebrow,
                {
                  color: palette.hex,
                },
              ]}
            >
              TRANSPARENCE TECHNIQUE
            </Text>

            <Text style={styles.heroTitle}>Open source, ensemble.</Text>

            <Text style={styles.heroDescription}>
              DébrouillePro s'appuie sur des projets open source. Cette page
              présente les principales briques déclarées dans l'application et
              permet d'accéder à leurs dépôts officiels.
            </Text>
          </View>
        </View>

        {/* --------------------------------------------------------------------
         * SECTION TITLE
         * ------------------------------------------------------------------ */}

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>Composants déclarés</Text>

            <Text style={styles.sectionSubtitle}>
              {LICENSES.length} projets référencés
            </Text>
          </View>

          <View
            style={[
              styles.sectionCount,
              {
                backgroundColor: `${palette.hex}12`,
                borderColor: `${palette.hex}20`,
              },
            ]}
          >
            <Text
              style={[
                styles.sectionCountText,
                {
                  color: palette.hex,
                },
              ]}
            >
              OSS
            </Text>
          </View>
        </View>

        {/* --------------------------------------------------------------------
         * LICENSES
         * ------------------------------------------------------------------ */}

        <View style={styles.licensesList}>
          {LICENSES.map((item) => (
            <LicenseCard
              key={`${item.name}-${item.license}`}
              item={item}
              accent={palette}
            />
          ))}
        </View>

        {/* --------------------------------------------------------------------
         * LEGAL NOTICE
         * ------------------------------------------------------------------ */}

        <View
          style={[
            styles.noticeCard,
            {
              backgroundColor: `${palette.hex}09`,
              borderColor: `${palette.hex}1A`,
            },
          ]}
        >
          <View
            style={[
              styles.noticeIcon,
              {
                backgroundColor: `${palette.hex}12`,
              },
            ]}
          >
            <ShieldCheck size={17} color={palette.hex} />
          </View>

          <View style={styles.noticeIdentity}>
            <Text style={styles.noticeTitle}>Respect des licences</Text>

            <Text style={styles.noticeText}>
              Chaque composant reste soumis à sa propre licence. Les obligations
              applicables peuvent notamment concerner les mentions de copyright,
              les avis de licence et la redistribution.
            </Text>

            <Text style={styles.noticeText}>
              Consulte toujours le dépôt officiel et le fichier de licence du
              projet concerné pour connaître ses conditions complètes.
            </Text>
          </View>
        </View>

        {/* --------------------------------------------------------------------
         * PRINCIPLES
         * ------------------------------------------------------------------ */}

        <View style={styles.principlesCard}>
          <View style={styles.principlesHeader}>
            <Code2 size={17} color="#CBD5E1" />

            <Text style={styles.principlesTitle}>Transparence logicielle</Text>
          </View>

          <View style={styles.principleRow}>
            <View
              style={[
                styles.principleDot,
                {
                  backgroundColor: palette.hex,
                },
              ]}
            />

            <Text style={styles.principleText}>
              Les licences sont présentées séparément pour chaque projet.
            </Text>
          </View>

          <View style={styles.principleRow}>
            <View
              style={[
                styles.principleDot,
                {
                  backgroundColor: palette.hex,
                },
              ]}
            />

            <Text style={styles.principleText}>
              Les dépôts officiels constituent la référence pour les textes
              complets des licences.
            </Text>
          </View>

          <View style={styles.principleRow}>
            <View
              style={[
                styles.principleDot,
                {
                  backgroundColor: palette.hex,
                },
              ]}
            />

            <Text style={styles.principleText}>
              Cette page ne remplace pas les fichiers LICENSE ou les notices
              distribués avec chaque composant.
            </Text>
          </View>
        </View>

        {/* --------------------------------------------------------------------
         * FOOTER
         * ------------------------------------------------------------------ */}

        <View style={styles.footer}>
          <Scale size={15} color="#475569" />

          <Text style={styles.footerTitle}>DébrouillePro</Text>

          <Text style={styles.footerText}>Licences & open source</Text>

          <Text style={styles.footerDisclaimer}>
            Les composants tiers conservent leurs propres conditions de licence.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#050812",
  },

  /* --------------------------------------------------------------------------
   * HEADER
   * ------------------------------------------------------------------------ */

  header: {
    minHeight: 76,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "rgba(2,6,23,0.94)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  headerIdentity: {
    flex: 1,
    minWidth: 0,
  },

  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  headerTitle: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15.5,
    fontWeight: "900",
  },

  headerSubtitle: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 9,
    lineHeight: 13,
    fontWeight: "600",
  },

  /* --------------------------------------------------------------------------
   * CONTENT
   * ------------------------------------------------------------------------ */

  contentContainer: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: 15,
    paddingTop: 17,
    paddingBottom: 38,
  },

  /* --------------------------------------------------------------------------
   * HERO
   * ------------------------------------------------------------------------ */

  heroCard: {
    padding: 18,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 13,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    shadowOpacity: 0.15,
    shadowRadius: 30,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    elevation: 3,
  },

  heroIcon: {
    width: 50,
    height: 50,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  heroIdentity: {
    flex: 1,
  },

  heroEyebrow: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.7,
  },

  heroTitle: {
    marginTop: 4,
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  heroDescription: {
    marginTop: 7,
    color: "#94A3B8",
    fontSize: 10.5,
    lineHeight: 16,
  },

  /* --------------------------------------------------------------------------
   * SECTION
   * ------------------------------------------------------------------------ */

  sectionHeading: {
    marginTop: 22,
    marginBottom: 9,
    paddingHorizontal: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "900",
  },

  sectionSubtitle: {
    marginTop: 3,
    color: "#475569",
    fontSize: 9,
    fontWeight: "650",
  },

  sectionCount: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },

  sectionCountText: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  /* --------------------------------------------------------------------------
   * LICENSE LIST
   * ------------------------------------------------------------------------ */

  licensesList: {
    gap: 9,
  },

  licenseCard: {
    padding: 13,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  licenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  licenseBody: {
    flex: 1,
    minWidth: 0,
  },

  licenseTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
  },

  licenseName: {
    maxWidth: "75%",
    color: "#F8FAFC",
    fontSize: 12.5,
    fontWeight: "900",
  },

  licenseBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },

  licenseBadgeText: {
    fontSize: 8,
    fontWeight: "900",
  },

  licenseCategory: {
    marginTop: 3,
    color: "#475569",
    fontSize: 8.5,
    fontWeight: "750",
  },

  licenseDescription: {
    marginTop: 6,
    color: "#94A3B8",
    fontSize: 9.5,
    lineHeight: 15,
  },

  repositoryButton: {
    alignSelf: "flex-start",
    marginTop: 9,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  repositoryButtonText: {
    fontSize: 8.5,
    fontWeight: "850",
  },

  /* --------------------------------------------------------------------------
   * NOTICE
   * ------------------------------------------------------------------------ */

  noticeCard: {
    marginTop: 13,
    padding: 14,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
  },

  noticeIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  noticeIdentity: {
    flex: 1,
  },

  noticeTitle: {
    color: "#E2E8F0",
    fontSize: 10.5,
    fontWeight: "900",
  },

  noticeText: {
    marginTop: 5,
    color: "#64748B",
    fontSize: 9.5,
    lineHeight: 15,
  },

  /* --------------------------------------------------------------------------
   * PRINCIPLES
   * ------------------------------------------------------------------------ */

  principlesCard: {
    marginTop: 11,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.065)",
  },

  principlesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  principlesTitle: {
    color: "#CBD5E1",
    fontSize: 10.5,
    fontWeight: "850",
  },

  principleRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  principleDot: {
    width: 5,
    height: 5,
    marginTop: 5,
    borderRadius: 999,
  },

  principleText: {
    flex: 1,
    color: "#64748B",
    fontSize: 9,
    lineHeight: 14,
  },

  /* --------------------------------------------------------------------------
   * FOOTER
   * ------------------------------------------------------------------------ */

  footer: {
    paddingTop: 25,
    alignItems: "center",
  },

  footerTitle: {
    marginTop: 7,
    color: "#64748B",
    fontSize: 9,
    fontWeight: "850",
  },

  footerText: {
    marginTop: 2,
    color: "#475569",
    fontSize: 8.5,
    fontWeight: "650",
  },

  footerDisclaimer: {
    maxWidth: 340,
    marginTop: 7,
    color: "#334155",
    fontSize: 8,
    lineHeight: 13,
    textAlign: "center",
  },

  /* --------------------------------------------------------------------------
   * INTERACTION
   * ------------------------------------------------------------------------ */

  pressed: {
    opacity: 0.7,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },
});
