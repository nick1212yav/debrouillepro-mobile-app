import React, { memo, useCallback, useMemo, useRef, useState } from "react";

import {
  Animated,
  Easing,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  ArrowLeft,
  ChevronDown,
  CheckCircle2,
  Copyright,
  CreditCard,
  FileText,
  Gavel,
  LockKeyhole,
  Mail,
  RefreshCw,
  Scale,
  Search,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react-native";

import { useAppearance, ACCENT_PALETTES } from "@/hooks/use-appearance.ts";

/**
 * ============================================================================
 * DÉBROUILLE PRO — CONDITIONS GÉNÉRALES D'UTILISATION
 * ============================================================================
 *
 * VERSION NATIVE PREMIUM
 *
 * Principes :
 * - React Native uniquement
 * - Aucun DOM
 * - Aucun className
 * - Aucun CSS Web
 * - Aucun react-router-dom
 * - Aucun data-href
 * - Aucun faux bouton
 * - Animations avec Animated de React Native
 * - Accessibilité native
 * - Recherche locale déterministe
 * - Accordéon individuel ou global
 * - Email réellement ouvrable via Linking
 *
 * ============================================================================
 */

interface TermsPageProps {
  onBack: () => void;
}

type SectionIcon =
  | typeof CheckCircle2
  | typeof FileText
  | typeof LockKeyhole
  | typeof ShieldCheck
  | typeof CreditCard
  | typeof Copyright
  | typeof AlertTriangle
  | typeof RefreshCw
  | typeof Gavel
  | typeof Mail;

interface TermsSection {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly content: string;
  readonly icon: SectionIcon;
}

const LEGAL_EMAIL = "legal@debrouille.pro";

const DOCUMENT_VERSION = "1er juin 2025";

const SECTIONS: readonly TermsSection[] = [
  {
    id: "acceptation",
    title: "1. Acceptation des conditions",
    icon: CheckCircle2,
    summary: "Les règles qui encadrent l'utilisation de Débrouille Pro.",
    content: `En accédant à Débrouille Pro, tu acceptes d'être lié par les présentes Conditions Générales d'Utilisation. Si tu n'acceptes pas ces conditions, tu ne peux pas utiliser l'application.

Ces CGU s'appliquent à tous les utilisateurs, visiteurs et toute autre personne qui accède ou utilise le service.`,
  },

  {
    id: "service",
    title: "2. Description du service",
    icon: FileText,
    summary: "Une plateforme numérique multi-services.",
    content: `Débrouille Pro est une plateforme numérique multi-services qui permet aux utilisateurs de : publier et consulter des annonces (immobilier, emploi, services), accéder à des informations locales, effectuer des transactions numériques via Débrouille Pay, et interagir avec une communauté d'utilisateurs.

Le service est fourni "tel quel" et peut évoluer sans préavis.`,
  },

  {
    id: "compte",
    title: "3. Compte utilisateur",
    icon: LockKeyhole,
    summary: "Responsabilités liées à ton compte.",
    content: `Pour accéder à la plupart des fonctionnalités, tu dois créer un compte. Tu es responsable de la confidentialité de tes identifiants et de toutes les activités effectuées depuis ton compte.

Tu t'engages à fournir des informations exactes, complètes et à jour lors de ton inscription. Débrouille Pro se réserve le droit de suspendre ou supprimer tout compte en cas de violation de ces CGU.`,
  },

  {
    id: "contenu",
    title: "4. Contenu des utilisateurs",
    icon: ShieldCheck,
    summary: "Publier, partager et respecter les droits des autres.",
    content: `En publiant du contenu sur Débrouille Pro, tu accordes à la plateforme une licence mondiale, non exclusive, gratuite et sous-licenciable pour utiliser, reproduire, modifier, adapter, publier et afficher ce contenu dans le cadre du service.

Tu t'engages à ne pas publier de contenu illégal, diffamatoire, trompeur, indécent, ou portant atteinte aux droits de tiers. Tout contenu violant ces règles peut être supprimé sans préavis.`,
  },

  {
    id: "paiements",
    title: "5. Transactions et paiements",
    icon: CreditCard,
    summary: "Règles applicables aux transactions numériques.",
    content: `Les transactions effectuées via Débrouille Pay sont soumises aux conditions spécifiques du module portefeuille. Débrouille Pro agit comme intermédiaire technique et n'est pas responsable des litiges entre acheteurs et vendeurs.

Toutes les transactions sont enregistrées et peuvent être consultées dans ton historique de portefeuille.`,
  },

  {
    id: "propriete",
    title: "6. Propriété intellectuelle",
    icon: Copyright,
    summary: "Protection de la plateforme et de ses contenus.",
    content: `L'application, son interface, son contenu original, ses fonctionnalités et sa technologie sont et demeurent la propriété exclusive de Débrouille Pro SAS et sont protégés par les lois congolaises et internationales sur la propriété intellectuelle.

Tu ne peux pas reproduire, distribuer, modifier ou créer des œuvres dérivées sans notre accord écrit préalable.`,
  },

  {
    id: "responsabilite",
    title: "7. Limitation de responsabilité",
    icon: AlertTriangle,
    summary: "Les limites de responsabilité prévues par les CGU.",
    content: `Dans la mesure permise par la loi applicable, Débrouille Pro ne sera pas responsable des dommages indirects, accessoires, spéciaux ou consécutifs résultant de l'utilisation ou de l'impossibilité d'utiliser le service.

La responsabilité totale de Débrouille Pro ne pourra en aucun cas dépasser le montant que tu as payé pour le service au cours des 12 derniers mois.`,
  },

  {
    id: "modification",
    title: "8. Modification des CGU",
    icon: RefreshCw,
    summary: "Comment les conditions peuvent évoluer.",
    content: `Débrouille Pro se réserve le droit de modifier ces CGU à tout moment. Les modifications entrent en vigueur dès leur publication dans l'application. L'utilisation continue du service après notification des modifications vaut acceptation des nouvelles conditions.

Nous t'informerons des changements importants par notification push ou email.`,
  },

  {
    id: "droit",
    title: "9. Droit applicable et juridiction",
    icon: Gavel,
    summary: "Le cadre juridique applicable.",
    content: `Ces CGU sont régies par le droit de la République Démocratique du Congo. Tout litige sera soumis à la juridiction compétente du ressort de Kinshasa, RDC.

Pour les utilisateurs résidant dans d'autres pays, les lois locales impératives restent applicables dans la mesure où elles s'appliquent.`,
  },

  {
    id: "contact",
    title: "10. Contact",
    icon: Mail,
    summary: "Une question sur les conditions ?",
    content: `Pour toute question concernant ces CGU, contacte notre équipe juridique à :

Email : ${LEGAL_EMAIL}
Adresse : Débrouille Pro SAS, Avenue de la Justice, Kolwezi, Lualaba, RDC`,
  },
];

/**
 * ============================================================================
 * HELPERS
 * ============================================================================
 */

function normalizeSearch(value: string): string {
  return value.trim().toLocaleLowerCase("fr-FR");
}

function buildSearchableText(section: TermsSection): string {
  return [section.title, section.summary, section.content]
    .join(" ")
    .toLocaleLowerCase("fr-FR");
}

/**
 * ============================================================================
 * SECTION ACCORDÉON
 * ============================================================================
 */

interface AccordionItemProps {
  section: TermsSection;
  index: number;
  open: boolean;
  accent: string;
  onToggle: () => void;
}

const AccordionItem = memo(function AccordionItem({
  section,
  index,
  open,
  accent,
  onToggle,
}: AccordionItemProps) {
  const Icon = section.icon;

  const rotation = useRef(new Animated.Value(open ? 1 : 0)).current;

  const contentOpacity = useRef(new Animated.Value(open ? 1 : 0)).current;

  const contentHeight = useRef(new Animated.Value(open ? 1 : 0)).current;

  const previousOpen = useRef(open);

  React.useEffect(() => {
    if (previousOpen.current === open) {
      return;
    }

    previousOpen.current = open;

    Animated.parallel([
      Animated.timing(rotation, {
        toValue: open ? 1 : 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.timing(contentOpacity, {
        toValue: open ? 1 : 0,
        duration: open ? 220 : 140,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.timing(contentHeight, {
        toValue: open ? 1 : 0,
        duration: open ? 260 : 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [contentHeight, contentOpacity, open, rotation]);

  const chevronRotation = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const sectionAccentBackground = open
    ? `${accent}20`
    : "rgba(255,255,255,0.045)";

  return (
    <View
      style={[styles.accordionItem, index === 0 && styles.accordionItemFirst]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{
          expanded: open,
        }}
        accessibilityLabel={`${section.title}. ${open ? "Réduire" : "Développer"}`}
        onPress={onToggle}
        style={({ pressed }) => [
          styles.accordionHeader,
          pressed && styles.accordionHeaderPressed,
        ]}
      >
        <View
          style={[
            styles.sectionIcon,
            {
              backgroundColor: sectionAccentBackground,
              borderColor: open ? `${accent}35` : "rgba(255,255,255,0.06)",
            },
          ]}
        >
          <Icon
            size={17}
            color={open ? accent : "rgba(255,255,255,0.58)"}
            accessibilityElementsHidden
          />
        </View>

        <View style={styles.sectionHeaderText}>
          <Text
            numberOfLines={2}
            style={[
              styles.sectionTitle,
              open && {
                color: "#FFFFFF",
              },
            ]}
          >
            {section.title}
          </Text>

          <Text numberOfLines={2} style={styles.sectionSummary}>
            {section.summary}
          </Text>
        </View>

        <Animated.View
          style={{
            transform: [
              {
                rotate: chevronRotation,
              },
            ],
          }}
        >
          <ChevronDown size={18} color="rgba(255,255,255,0.32)" />
        </Animated.View>
      </Pressable>

      <Animated.View
        style={[
          styles.animatedContent,
          {
            opacity: contentOpacity,
            maxHeight: contentHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 520],
            }),
          },
        ]}
        pointerEvents={open ? "auto" : "none"}
      >
        <View style={styles.contentInner}>
          <View
            style={[
              styles.contentCard,
              {
                backgroundColor: `${accent}08`,
                borderColor: `${accent}16`,
              },
            ]}
          >
            <Text style={styles.contentText}>{section.content}</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
});

/**
 * ============================================================================
 * SEARCH EMPTY STATE
 * ============================================================================
 */

function SearchEmptyState({
  accent,
  onReset,
}: {
  accent: string;
  onReset: () => void;
}) {
  return (
    <View style={styles.searchEmpty}>
      <View
        style={[
          styles.searchEmptyIcon,
          {
            backgroundColor: `${accent}12`,
            borderColor: `${accent}20`,
          },
        ]}
      >
        <Search size={21} color={accent} />
      </View>

      <Text style={styles.searchEmptyTitle}>Aucun passage trouvé</Text>

      <Text style={styles.searchEmptyText}>
        Aucun contenu des CGU ne correspond à votre recherche.
      </Text>

      <Pressable
        onPress={onReset}
        style={({ pressed }) => [
          styles.resetButton,
          {
            backgroundColor: `${accent}15`,
            borderColor: `${accent}25`,
          },
          pressed && styles.buttonPressed,
        ]}
      >
        <Text style={[styles.resetButtonText, { color: accent }]}>
          Réinitialiser la recherche
        </Text>
      </Pressable>
    </View>
  );
}

/**
 * ============================================================================
 * MAIN PAGE
 * ============================================================================
 */

export default function TermsPage({ onBack }: TermsPageProps) {
  const { prefs } = useAppearance();

  const palette = ACCENT_PALETTES[prefs.accent];

  const accent = palette.hex;

  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set<string>());

  const [query, setQuery] = useState("");

  const normalizedQuery = normalizeSearch(query);

  const filteredSections = useMemo(() => {
    if (!normalizedQuery) {
      return SECTIONS;
    }

    return SECTIONS.filter((section) =>
      buildSearchableText(section).includes(normalizedQuery),
    );
  }, [normalizedQuery]);

  const allVisibleOpen =
    filteredSections.length > 0 &&
    filteredSections.every((section) => openIds.has(section.id));

  const toggleSection = useCallback((id: string) => {
    setOpenIds((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setOpenIds((current) => {
      const next = new Set(current);

      if (allVisibleOpen) {
        filteredSections.forEach((section) => next.delete(section.id));
      } else {
        filteredSections.forEach((section) => next.add(section.id));
      }

      return next;
    });
  }, [allVisibleOpen, filteredSections]);

  const resetSearch = useCallback(() => {
    setQuery("");
    setOpenIds(new Set<string>());
  }, []);

  const openLegalEmail = useCallback(async () => {
    const url = `mailto:${LEGAL_EMAIL}`;

    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        return;
      }

      await Linking.openURL(url);
    } catch {
      // L'OS ne permet pas d'ouvrir le client mail.
      // Aucun faux succès n'est affiché.
    }
  }, []);

  return (
    <View style={styles.screen}>
      {/* ================================================================
          HEADER
          ================================================================ */}

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            onPress={onBack}
            style={({ pressed }) => [
              styles.headerBackButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <ArrowLeft size={19} color="#FFFFFF" />
          </Pressable>

          <View style={styles.headerTitleContainer}>
            <View style={styles.headerTitleRow}>
              <FileText size={17} color={accent} />

              <Text numberOfLines={1} style={styles.headerTitle}>
                Conditions Générales
              </Text>
            </View>

            <Text style={styles.headerSubtitle}>
              Utilisation de Débrouille Pro · Mise à jour : {DOCUMENT_VERSION}
            </Text>
          </View>

          <View
            style={[
              styles.officialBadge,
              {
                backgroundColor: `${accent}12`,
                borderColor: `${accent}22`,
              },
            ]}
          >
            <ShieldCheck size={12} color={accent} />

            <Text style={[styles.officialBadgeText, { color: accent }]}>
              Document
            </Text>
          </View>
        </View>
      </View>

      {/* ================================================================
          BODY
          ================================================================ */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ================================================================
            HERO
            ================================================================ */}

        <View style={styles.hero}>
          <View
            style={[
              styles.heroGlow,
              {
                backgroundColor: `${accent}10`,
              },
            ]}
          />

          <View style={styles.heroContent}>
            <View
              style={[
                styles.heroIcon,
                {
                  backgroundColor: `${accent}18`,
                  borderColor: `${accent}25`,
                },
              ]}
            >
              <Scale size={25} color="#FFFFFF" />
            </View>

            <View style={styles.heroEyebrowRow}>
              <Text style={[styles.heroEyebrow, { color: accent }]}>
                CADRE D'UTILISATION
              </Text>

              <View style={styles.heroDot} />

              <Text style={styles.heroVersion}>Version en vigueur</Text>
            </View>

            <Text style={styles.heroTitle}>
              Des règles claires pour une{" "}
              <Text style={{ color: accent }}>expérience de confiance.</Text>
            </Text>

            <Text style={styles.heroDescription}>
              Ces Conditions Générales d'Utilisation définissent les règles
              applicables à l'accès et à l'utilisation de Débrouille Pro. Prends
              quelques minutes pour les parcourir.
            </Text>

            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <ShieldCheck size={14} color={accent} />

                <Text style={styles.heroStatText}>10 sections</Text>
              </View>

              <View style={styles.heroStat}>
                <Gavel size={14} color={accent} />

                <Text style={styles.heroStatText}>Droit congolais</Text>
              </View>

              <View style={styles.heroStat}>
                <FileText size={14} color={accent} />

                <Text style={styles.heroStatText}>
                  Version {DOCUMENT_VERSION}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ================================================================
            PRINCIPES
            ================================================================ */}

        <View style={styles.principles}>
          {[
            {
              icon: ShieldCheck,
              label: "Utilisation responsable",
            },
            {
              icon: LockKeyhole,
              label: "Compte utilisateur",
            },
            {
              icon: Scale,
              label: "Cadre juridique",
            },
          ].map(({ icon: Icon, label }) => (
            <View key={label} style={styles.principleCard}>
              <View
                style={[
                  styles.principleIcon,
                  {
                    backgroundColor: `${accent}10`,
                  },
                ]}
              >
                <Icon size={15} color={accent} />
              </View>

              <Text numberOfLines={1} style={styles.principleText}>
                {label}
              </Text>
            </View>
          ))}
        </View>

        {/* ================================================================
            SEARCH
            ================================================================ */}

        <View style={styles.searchActions}>
          <View
            style={[
              styles.searchBox,
              {
                borderColor:
                  normalizedQuery.length > 0
                    ? `${accent}35`
                    : "rgba(255,255,255,0.07)",
              },
            ]}
          >
            <Search
              size={16}
              color={
                normalizedQuery.length > 0 ? accent : "rgba(255,255,255,0.25)"
              }
            />

            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Rechercher dans les CGU…"
              placeholderTextColor="rgba(255,255,255,0.22)"
              accessibilityLabel="Rechercher dans les conditions générales"
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              style={styles.searchInput}
            />

            {query.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Effacer la recherche"
                onPress={() => setQuery("")}
                style={styles.clearSearch}
              >
                <Text style={styles.clearSearchText}>×</Text>
              </Pressable>
            ) : null}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              allVisibleOpen
                ? "Réduire toutes les sections"
                : "Ouvrir toutes les sections"
            }
            onPress={toggleAll}
            disabled={filteredSections.length === 0}
            style={({ pressed }) => [
              styles.expandButton,
              {
                backgroundColor: `${accent}12`,
                borderColor: `${accent}20`,
              },
              filteredSections.length === 0 && styles.disabledButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={[styles.expandButtonText, { color: accent }]}>
              {allVisibleOpen ? "Tout réduire" : "Tout ouvrir"}
            </Text>
          </Pressable>
        </View>

        {/* ================================================================
            RESULT COUNT
            ================================================================ */}

        {query.length > 0 ? (
          <Text style={styles.resultCount}>
            {filteredSections.length} section
            {filteredSections.length !== 1 ? "s" : ""} trouvée
            {filteredSections.length !== 1 ? "s" : ""}
          </Text>
        ) : null}

        {/* ================================================================
            ACCORDION
            ================================================================ */}

        <View style={styles.accordion}>
          {filteredSections.length > 0 ? (
            filteredSections.map((section, index) => (
              <AccordionItem
                key={section.id}
                section={section}
                index={index}
                open={openIds.has(section.id)}
                accent={accent}
                onToggle={() => toggleSection(section.id)}
              />
            ))
          ) : (
            <SearchEmptyState accent={accent} onReset={resetSearch} />
          )}
        </View>

        {/* ================================================================
            CONTACT JURIDIQUE
            ================================================================ */}

        <View style={styles.contactCard}>
          <View
            style={[
              styles.contactIcon,
              {
                backgroundColor: `${accent}18`,
                borderColor: `${accent}25`,
              },
            ]}
          >
            <Mail size={18} color={accent} />
          </View>

          <View style={styles.contactContent}>
            <Text style={styles.contactTitle}>Une question sur les CGU ?</Text>

            <Text style={styles.contactDescription}>
              Notre équipe juridique peut répondre à tes questions concernant
              les présentes conditions.
            </Text>

            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`Contacter l'équipe juridique à ${LEGAL_EMAIL}`}
              onPress={() => {
                void openLegalEmail();
              }}
              style={({ pressed }) => [
                styles.emailButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={[styles.emailText, { color: accent }]}>
                {LEGAL_EMAIL}
              </Text>

              <Mail size={13} color={accent} />
            </Pressable>
          </View>
        </View>

        {/* ================================================================
            FOOTER
            ================================================================ */}

        <View style={styles.footer}>
          <View
            style={[
              styles.footerLogo,
              {
                backgroundColor: accent,
              },
            ]}
          >
            <FileText size={12} color="#FFFFFF" />
          </View>

          <Text style={styles.footerBrand}>Débrouille Pro</Text>

          <Text style={styles.footerText}>
            © 2025 Débrouille Pro SAS · Kolwezi, RDC
            {"\n"}
            {LEGAL_EMAIL}
          </Text>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

/**
 * ============================================================================
 * STYLES — DARK PREMIUM NATIVE
 * ============================================================================
 */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#050812",
  },

  header: {
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 13,
    backgroundColor: "rgba(2,6,23,0.98)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.065)",
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  headerBackButton: {
    width: 41,
    height: 41,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.065)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  headerTitleContainer: {
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
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  headerSubtitle: {
    color: "rgba(255,255,255,0.32)",
    fontSize: 9.5,
    marginTop: 3,
    lineHeight: 14,
  },

  officialBadge: {
    minWidth: 38,
    minHeight: 34,
    paddingHorizontal: 7,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderWidth: 1,
  },

  officialBadgeText: {
    fontSize: 7,
    fontWeight: "900",
    textAlign: "center",
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  hero: {
    overflow: "hidden",
    borderRadius: 27,
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  heroGlow: {
    position: "absolute",
    width: 230,
    height: 230,
    borderRadius: 115,
    right: -100,
    top: -105,
  },

  heroContent: {
    padding: 20,
  },

  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 15,
  },

  heroEyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 7,
  },

  heroEyebrow: {
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  heroDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.20)",
  },

  heroVersion: {
    color: "rgba(255,255,255,0.30)",
    fontSize: 8.5,
    fontWeight: "600",
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "900",
    letterSpacing: -0.8,
  },

  heroDescription: {
    color: "rgba(255,255,255,0.43)",
    fontSize: 11.5,
    lineHeight: 18,
    marginTop: 10,
  },

  heroStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 17,
  },

  heroStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  heroStatText: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 8.5,
    fontWeight: "700",
  },

  principles: {
    flexDirection: "row",
    gap: 7,
    marginBottom: 12,
  },

  principleCard: {
    flex: 1,
    minHeight: 57,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 15,
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  principleIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },

  principleText: {
    color: "rgba(255,255,255,0.46)",
    fontSize: 8.5,
    fontWeight: "700",
  },

  searchActions: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 7,
  },

  searchBox: {
    flex: 1,
    minHeight: 45,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
  },

  searchInput: {
    flex: 1,
    minHeight: 43,
    color: "#FFFFFF",
    fontSize: 11,
    paddingVertical: 0,
  },

  clearSearch: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  clearSearchText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 20,
    lineHeight: 21,
    fontWeight: "300",
  },

  expandButton: {
    minHeight: 45,
    paddingHorizontal: 11,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  expandButtonText: {
    fontSize: 9,
    fontWeight: "900",
  },

  resultCount: {
    color: "rgba(255,255,255,0.28)",
    fontSize: 8.5,
    marginBottom: 8,
    marginLeft: 3,
  },

  accordion: {
    overflow: "hidden",
    borderRadius: 25,
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  accordionItem: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.055)",
  },

  accordionItemFirst: {
    borderTopWidth: 0,
  },

  accordionHeader: {
    minHeight: 74,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    paddingVertical: 10,
    gap: 10,
  },

  accordionHeaderPressed: {
    backgroundColor: "rgba(255,255,255,0.025)",
  },

  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  sectionHeaderText: {
    flex: 1,
    minWidth: 0,
  },

  sectionTitle: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "800",
  },

  sectionSummary: {
    color: "rgba(255,255,255,0.27)",
    fontSize: 8.5,
    lineHeight: 13,
    marginTop: 2,
  },

  animatedContent: {
    overflow: "hidden",
  },

  contentInner: {
    paddingHorizontal: 13,
    paddingBottom: 13,
    paddingLeft: 63,
  },

  contentCard: {
    padding: 13,
    borderRadius: 15,
    borderWidth: 1,
  },

  contentText: {
    color: "rgba(255,255,255,0.57)",
    fontSize: 11,
    lineHeight: 19,
  },

  searchEmpty: {
    minHeight: 250,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  searchEmptyIcon: {
    width: 53,
    height: 53,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  searchEmptyTitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 12,
  },

  searchEmptyText: {
    color: "rgba(255,255,255,0.28)",
    fontSize: 10,
    textAlign: "center",
    lineHeight: 15,
    marginTop: 5,
  },

  resetButton: {
    minHeight: 39,
    paddingHorizontal: 13,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginTop: 12,
  },

  resetButtonText: {
    fontSize: 9.5,
    fontWeight: "800",
  },

  contactCard: {
    flexDirection: "row",
    gap: 11,
    padding: 15,
    borderRadius: 24,
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  contactContent: {
    flex: 1,
  },

  contactTitle: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "900",
  },

  contactDescription: {
    color: "rgba(255,255,255,0.32)",
    fontSize: 9.5,
    lineHeight: 15,
    marginTop: 4,
  },

  emailButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 9,
    paddingVertical: 3,
  },

  emailText: {
    fontSize: 10,
    fontWeight: "800",
  },

  footer: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 5,
  },

  footerLogo: {
    width: 27,
    height: 27,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },

  footerBrand: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 10,
    fontWeight: "900",
  },

  footerText: {
    color: "rgba(255,255,255,0.18)",
    fontSize: 8.5,
    lineHeight: 14,
    textAlign: "center",
    marginTop: 4,
  },

  buttonPressed: {
    opacity: 0.72,
    transform: [
      {
        scale: 0.97,
      },
    ],
  },

  disabledButton: {
    opacity: 0.4,
  },

  bottomSpace: {
    height: 45,
  },
});
