import React, { useMemo, useState } from "react";
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  HelpCircle,
  Mail,
  MessageCircle,
  Phone,
  Search,
  Star,
  Video,
  X,
  Zap,
} from "lucide-react-native";

import { ACCENT_PALETTES, useAppearance } from "@/hooks/use-appearance.ts";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface HelpPageProps {
  onBack: () => void;
}

interface FAQItem {
  q: string;
  a: string;
}

interface FAQCategory {
  category: string;
  color: string;
  items: FAQItem[];
}

interface SupportAction {
  id: string;
  label: string;
  description: string;
  color: string;
  icon: React.ElementType;
  type: "chat" | "email" | "phone" | "bug";
}

// ─────────────────────────────────────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────────────────────────────────────

const FAQ: FAQCategory[] = [
  {
    category: "Compte",
    color: "#8B5CF6",
    items: [
      {
        q: "Comment créer mon compte ?",
        a: "Clique sur « Commencer » depuis l'écran d'accueil, puis connecte-toi avec Google, Apple ou ton email. Ton profil est créé automatiquement.",
      },
      {
        q: "Comment modifier mon profil ?",
        a: "Va dans l'onglet Profil, puis appuie sur « Modifier le profil » pour changer ta photo, ton nom, ta bio et tes informations.",
      },
      {
        q: "J'ai oublié mon mot de passe",
        a: "Sur l'écran de connexion, utilise l'option « Mot de passe oublié » et suis les instructions affichées pour réinitialiser ton accès.",
      },
    ],
  },
  {
    category: "Publications",
    color: "#F97316",
    items: [
      {
        q: "Comment publier une annonce ?",
        a: "Appuie sur le bouton + au centre de la barre de navigation, choisis le type de publication souhaité, puis remplis le formulaire correspondant.",
      },
      {
        q: "Puis-je modifier une publication ?",
        a: "Oui. Ouvre ta publication et utilise les actions disponibles sur celle-ci pour accéder à sa modification.",
      },
      {
        q: "Comment booster une publication ?",
        a: "Lorsque l'option Boost est disponible pour ta publication, ouvre celle-ci et utilise l'action « Booster » pour accéder aux options proposées.",
      },
    ],
  },
  {
    category: "Paiements & Wallet",
    color: "#10B981",
    items: [
      {
        q: "Quelles méthodes de paiement sont acceptées ?",
        a: "Les méthodes de paiement disponibles dépendent des services activés dans ton compte et dans ta région. Consulte l'écran Paiements pour voir les options réellement disponibles.",
      },
      {
        q: "Comment recharger mon wallet ?",
        a: "Ouvre Portefeuille, puis sélectionne l'option de recharge. Les moyens et étapes disponibles sont ceux affichés par le service de paiement actuellement configuré.",
      },
      {
        q: "Une transaction a échoué, que faire ?",
        a: "Vérifie d'abord l'état de la transaction et ton solde. Si un montant a été débité sans que le service attendu soit crédité, conserve la référence de transaction et contacte le support.",
      },
    ],
  },
  {
    category: "Technique",
    color: "#3B82F6",
    items: [
      {
        q: "L'application est lente ou plante",
        a: "Ferme puis relance l'application. Vérifie également que tu disposes d'une connexion stable et que l'application est à jour. Si le problème persiste, contacte le support en indiquant les étapes qui provoquent le problème.",
      },
      {
        q: "Je ne reçois pas les notifications",
        a: "Vérifie que les notifications sont autorisées pour Débrouille Pro dans les paramètres de ton téléphone. Vérifie également les paramètres de notifications disponibles dans l'application.",
      },
      {
        q: "Comment effacer le cache ?",
        a: "Sur Android, ouvre les paramètres du téléphone, puis Applications, Débrouille Pro, Stockage et utilise l'option permettant d'effacer le cache. L'emplacement exact peut varier selon le fabricant.",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Support configuration
// ─────────────────────────────────────────────────────────────────────────────

const SUPPORT_EMAIL = "support@debrouille.pro";
const SUPPORT_PHONE = "+243997123456";

const SUPPORT_ACTIONS: SupportAction[] = [
  {
    id: "chat",
    label: "Chat support",
    description: "Assistance directe",
    color: "#6366F1",
    icon: MessageCircle,
    type: "chat",
  },
  {
    id: "email",
    label: "Envoyer un email",
    description: SUPPORT_EMAIL,
    color: "#3B82F6",
    icon: Mail,
    type: "email",
  },
  {
    id: "phone",
    label: "Appeler",
    description: "Support téléphonique",
    color: "#10B981",
    icon: Phone,
    type: "phone",
  },
  {
    id: "bug",
    label: "Signaler un bug",
    description: "Nous aider à améliorer l'app",
    color: "#F97316",
    icon: AlertTriangle,
    type: "bug",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

async function openExternalSupport(
  type: SupportAction["type"],
): Promise<boolean> {
  if (type === "email") {
    const url = `mailto:${SUPPORT_EMAIL}`;

    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        return false;
      }

      await Linking.openURL(url);
      return true;
    } catch {
      return false;
    }
  }

  if (type === "phone") {
    const url = `tel:${SUPPORT_PHONE}`;

    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        return false;
      }

      await Linking.openURL(url);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// FAQ Item
// ─────────────────────────────────────────────────────────────────────────────

function FaqItem({
  question,
  answer,
  color,
}: {
  question: string;
  answer: string;
  color: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.faqItem}>
      <Pressable
        onPress={() => setOpen((value) => !value)}
        style={({ pressed }) => [
          styles.faqQuestionButton,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={question}
      >
        <View
          style={[
            styles.faqIndicator,
            {
              backgroundColor: open ? color : "rgba(255,255,255,0.12)",
            },
          ]}
        />

        <Text style={[styles.faqQuestion, open && styles.faqQuestionOpen]}>
          {question}
        </Text>

        <View
          style={[
            styles.chevronContainer,
            open && {
              backgroundColor: `${color}18`,
            },
          ]}
        >
          <ChevronDown
            size={16}
            color={open ? color : "rgba(255,255,255,0.35)"}
            strokeWidth={2.2}
          />
        </View>
      </Pressable>

      {open ? (
        <View style={styles.faqAnswerContainer}>
          <Text style={styles.faqAnswer}>{answer}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Support Action Card
// ─────────────────────────────────────────────────────────────────────────────

function SupportActionCard({
  action,
  onPress,
}: {
  action: SupportAction;
  onPress: () => void;
}) {
  const Icon = action.icon;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.supportCard,
        pressed && styles.supportCardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={action.label}
    >
      <View
        style={[
          styles.supportIcon,
          {
            backgroundColor: `${action.color}16`,
            borderColor: `${action.color}25`,
          },
        ]}
      >
        <Icon size={19} color={action.color} strokeWidth={2.1} />
      </View>

      <Text numberOfLines={1} style={styles.supportLabel}>
        {action.label}
      </Text>

      <Text numberOfLines={1} style={styles.supportDescription}>
        {action.description}
      </Text>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Resource Card
// ─────────────────────────────────────────────────────────────────────────────

function ResourceCard({
  icon: Icon,
  color,
  label,
  description,
  onPress,
}: {
  icon: React.ElementType;
  color: string;
  label: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.resourceCard,
        pressed && styles.resourceCardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View
        style={[
          styles.resourceIcon,
          {
            backgroundColor: `${color}16`,
            borderColor: `${color}22`,
          },
        ]}
      >
        <Icon size={17} color={color} strokeWidth={2} />
      </View>

      <View style={styles.resourceText}>
        <Text style={styles.resourceLabel}>{label}</Text>

        <Text numberOfLines={2} style={styles.resourceDescription}>
          {description}
        </Text>
      </View>

      <View style={styles.resourceArrow}>
        <Text style={styles.resourceArrowText}>›</Text>
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section Header
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

export default function HelpPage({ onBack }: HelpPageProps) {
  const { prefs } = useAppearance();

  const accent = ACCENT_PALETTES[prefs.accent] ?? ACCENT_PALETTES.blue;

  const hex = accent.hex;

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const [message, setMessage] = useState<string | null>(null);

  const [showUnavailableModal, setShowUnavailableModal] = useState(false);

  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  // ───────────────────────────────────────────────────────────────────────────
  // FAQ search
  // ───────────────────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const query = normalize(search);

    return FAQ.map((category) => {
      const items = category.items.filter((item) => {
        if (!query) {
          return true;
        }

        return (
          normalize(item.q).includes(query) || normalize(item.a).includes(query)
        );
      });

      return {
        ...category,
        items,
      };
    }).filter(
      (category) =>
        category.items.length > 0 &&
        (!activeCategory || activeCategory === category.category),
    );
  }, [activeCategory, search]);

  // ───────────────────────────────────────────────────────────────────────────
  // Support actions
  // ───────────────────────────────────────────────────────────────────────────

  const handleSupportAction = async (action: SupportAction) => {
    setMessage(null);
    setSelectedAction(action.id);

    if (action.type === "email" || action.type === "phone") {
      const opened = await openExternalSupport(action.type);

      if (!opened) {
        setMessage(
          action.type === "email"
            ? `Impossible d'ouvrir l'application email. Adresse support : ${SUPPORT_EMAIL}`
            : `Impossible d'ouvrir l'application téléphone. Numéro configuré : ${SUPPORT_PHONE}`,
        );
      }

      setSelectedAction(null);
      return;
    }

    if (action.type === "chat") {
      setShowUnavailableModal(true);
      setSelectedAction(null);
      return;
    }

    if (action.type === "bug") {
      setShowUnavailableModal(true);
      setSelectedAction(null);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.page}>
      <View
        pointerEvents="none"
        style={[
          styles.backgroundGlow,
          {
            backgroundColor: `${hex}0B`,
          },
        ]}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* Header */}
        {/* ─────────────────────────────────────────────────────────────────── */}

        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <ArrowLeft size={19} color="#FFFFFF" strokeWidth={2.2} />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Aide & Support</Text>

            <Text style={styles.headerSubtitle}>
              Centre d'aide Débrouille Pro
            </Text>
          </View>

          <View
            style={[
              styles.headerBadge,
              {
                backgroundColor: `${hex}14`,
                borderColor: `${hex}30`,
              },
            ]}
          >
            <HelpCircle size={18} color={hex} strokeWidth={2} />
          </View>
        </View>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* Search */}
        {/* ─────────────────────────────────────────────────────────────────── */}

        <View style={styles.searchBox}>
          <Search size={17} color="rgba(255,255,255,0.35)" strokeWidth={2} />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher une question..."
            placeholderTextColor="rgba(255,255,255,0.25)"
            style={styles.searchInput}
            accessibilityLabel="Rechercher dans l'aide"
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />

          {search.length > 0 ? (
            <Pressable
              onPress={() => setSearch("")}
              style={styles.clearButton}
              accessibilityRole="button"
              accessibilityLabel="Effacer la recherche"
            >
              <X size={15} color="rgba(255,255,255,0.55)" />
            </Pressable>
          ) : null}
        </View>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* Search result summary */}
        {/* ─────────────────────────────────────────────────────────────────── */}

        {search.trim().length > 0 ? (
          <View style={styles.searchSummary}>
            <Search size={13} color={hex} strokeWidth={2} />

            <Text style={styles.searchSummaryText}>
              {filtered.reduce(
                (total, category) => total + category.items.length,
                0,
              )}{" "}
              résultat
              {filtered.reduce(
                (total, category) => total + category.items.length,
                0,
              ) !== 1
                ? "s"
                : ""}{" "}
              pour « {search.trim()} »
            </Text>
          </View>
        ) : null}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* Support */}
        {/* ─────────────────────────────────────────────────────────────────── */}

        <SectionHeader
          title="Besoin d'aide ?"
          subtitle="Choisissez le canal qui vous convient."
        />

        <View style={styles.supportGrid}>
          {SUPPORT_ACTIONS.map((action) => (
            <SupportActionCard
              key={action.id}
              action={action}
              onPress={() => void handleSupportAction(action)}
            />
          ))}
        </View>

        {message ? (
          <View
            style={[
              styles.messageBox,
              {
                borderColor: `${hex}30`,
                backgroundColor: `${hex}0D`,
              },
            ]}
          >
            <AlertTriangle size={15} color={hex} strokeWidth={2} />

            <Text style={styles.messageText}>{message}</Text>

            <Pressable
              onPress={() => setMessage(null)}
              style={styles.messageClose}
            >
              <X size={14} color="rgba(255,255,255,0.45)" />
            </Pressable>
          </View>
        ) : null}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* Resources */}
        {/* ─────────────────────────────────────────────────────────────────── */}

        <SectionHeader
          title="Ressources"
          subtitle="Guides et informations utiles."
        />

        <View style={styles.resourceContainer}>
          <ResourceCard
            icon={BookOpen}
            color="#8B5CF6"
            label="Guide de démarrage"
            description="Les principales étapes pour découvrir l'application."
            onPress={() => setShowUnavailableModal(true)}
          />

          <ResourceCard
            icon={Video}
            color="#EF4444"
            label="Tutoriels vidéo"
            description="Guides vidéo pour apprendre les principales fonctionnalités."
            onPress={() => setShowUnavailableModal(true)}
          />

          <ResourceCard
            icon={Star}
            color="#F59E0B"
            label="Nouveautés"
            description="Découvrez les fonctionnalités et évolutions disponibles."
            onPress={() => setShowUnavailableModal(true)}
          />

          <ResourceCard
            icon={Zap}
            color="#10B981"
            label="Astuces & conseils"
            description="Conseils pratiques pour utiliser l'application efficacement."
            onPress={() => setShowUnavailableModal(true)}
          />
        </View>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* FAQ filters */}
        {/* ─────────────────────────────────────────────────────────────────── */}

        <SectionHeader
          title="Questions fréquentes"
          subtitle="Trouvez rapidement une réponse."
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
          style={styles.categoryScroll}
        >
          <Pressable
            onPress={() => setActiveCategory(null)}
            style={({ pressed }) => [
              styles.categoryChip,
              !activeCategory && {
                backgroundColor: `${hex}22`,
                borderColor: `${hex}50`,
              },
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.categoryChipText,
                !activeCategory && {
                  color: hex,
                },
              ]}
            >
              Toutes
            </Text>
          </Pressable>

          {FAQ.map((category) => {
            const active = activeCategory === category.category;

            return (
              <Pressable
                key={category.category}
                onPress={() =>
                  setActiveCategory(active ? null : category.category)
                }
                style={({ pressed }) => [
                  styles.categoryChip,
                  active && {
                    backgroundColor: `${category.color}20`,
                    borderColor: `${category.color}50`,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.categoryDot,
                    {
                      backgroundColor: active
                        ? category.color
                        : "rgba(255,255,255,0.22)",
                    },
                  ]}
                />

                <Text
                  style={[
                    styles.categoryChipText,
                    active && {
                      color: category.color,
                    },
                  ]}
                >
                  {category.category}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* FAQ */}
        {/* ─────────────────────────────────────────────────────────────────── */}

        <View style={styles.faqSections}>
          {filtered.length === 0 ? (
            <View style={styles.noResults}>
              <View style={styles.noResultsIcon}>
                <HelpCircle
                  size={30}
                  color="rgba(255,255,255,0.25)"
                  strokeWidth={1.7}
                />
              </View>

              <Text style={styles.noResultsTitle}>Aucun résultat</Text>

              <Text style={styles.noResultsDescription}>
                Aucune réponse ne correspond à votre recherche.
              </Text>

              <Pressable
                onPress={() => {
                  setSearch("");
                  setActiveCategory(null);
                }}
                style={({ pressed }) => [
                  styles.resetButton,
                  {
                    backgroundColor: `${hex}18`,
                    borderColor: `${hex}35`,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.resetButtonText, { color: hex }]}>
                  Réinitialiser la recherche
                </Text>
              </Pressable>
            </View>
          ) : (
            filtered.map((category) => (
              <View key={category.category} style={styles.faqSection}>
                <View style={styles.faqCategoryHeader}>
                  <View
                    style={[
                      styles.faqCategoryDot,
                      {
                        backgroundColor: category.color,
                      },
                    ]}
                  />

                  <Text
                    style={[
                      styles.faqCategoryTitle,
                      {
                        color: category.color,
                      },
                    ]}
                  >
                    {category.category}
                  </Text>

                  <View
                    style={[
                      styles.faqCount,
                      {
                        backgroundColor: `${category.color}14`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.faqCountText,
                        {
                          color: category.color,
                        },
                      ]}
                    >
                      {category.items.length}
                    </Text>
                  </View>
                </View>

                <View style={styles.faqContainer}>
                  {category.items.map((item) => (
                    <FaqItem
                      key={item.q}
                      question={item.q}
                      answer={item.a}
                      color={category.color}
                    />
                  ))}
                </View>
              </View>
            ))
          )}
        </View>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* Contact information */}
        {/* ─────────────────────────────────────────────────────────────────── */}

        <View style={styles.contactCard}>
          <View style={styles.contactIcon}>
            <MessageCircle size={18} color="#10B981" strokeWidth={2} />
          </View>

          <View style={styles.contactContent}>
            <Text style={styles.contactTitle}>
              Vous n'avez pas trouvé votre réponse ?
            </Text>

            <Text style={styles.contactDescription}>
              Contactez le support avec une description précise de votre
              problème et, si nécessaire, la référence concernée.
            </Text>
          </View>
        </View>

        <Text style={styles.footerText}>Centre d'aide Débrouille Pro</Text>
      </ScrollView>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* Unavailable resource modal */}
      {/* ───────────────────────────────────────────────────────────────────── */}

      <Modal
        visible={showUnavailableModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUnavailableModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalTop}>
              <View style={styles.modalIcon}>
                <CheckCircle2 size={20} color={hex} strokeWidth={2} />
              </View>

              <Pressable
                onPress={() => setShowUnavailableModal(false)}
                style={styles.modalClose}
                accessibilityRole="button"
                accessibilityLabel="Fermer"
              >
                <X size={17} color="rgba(255,255,255,0.55)" />
              </Pressable>
            </View>

            <Text style={styles.modalTitle}>Fonctionnalité en préparation</Text>

            <Text style={styles.modalDescription}>
              Cette ressource ou ce canal n'est pas encore relié à un service
              backend dans la version actuelle de l'application.
            </Text>

            <Text style={styles.modalNote}>
              Aucun contenu ou état fictif n'est affiché.
            </Text>

            <Pressable
              onPress={() => setShowUnavailableModal(false)}
              style={({ pressed }) => [
                styles.modalButton,
                {
                  backgroundColor: hex,
                },
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.modalButtonText}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#050812",
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 44,
  },

  backgroundGlow: {
    position: "absolute",
    top: -100,
    right: -110,
    width: 300,
    height: 300,
    borderRadius: 150,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  headerSubtitle: {
    color: "rgba(255,255,255,0.40)",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },

  headerBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  // Search
  searchBox: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    marginBottom: 10,
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    color: "#FFFFFF",
    fontSize: 13,
    paddingVertical: 11,
  },

  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  searchSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 4,
    marginBottom: 16,
  },

  searchSummaryText: {
    flex: 1,
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
  },

  // Sections
  sectionHeader: {
    marginTop: 18,
    marginBottom: 10,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
  },

  sectionSubtitle: {
    color: "rgba(255,255,255,0.32)",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 2,
  },

  // Support
  supportGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },

  supportCard: {
    width: "48.6%",
    minHeight: 116,
    padding: 13,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  supportCardPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.985 }],
  },

  supportIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 8,
  },

  supportLabel: {
    maxWidth: "100%",
    color: "rgba(255,255,255,0.84)",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "800",
    textAlign: "center",
  },

  supportDescription: {
    maxWidth: "100%",
    color: "rgba(255,255,255,0.28)",
    fontSize: 9,
    lineHeight: 13,
    marginTop: 3,
    textAlign: "center",
  },

  // Message
  messageBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 13,
    borderWidth: 1,
    marginTop: 10,
  },

  messageText: {
    flex: 1,
    color: "rgba(255,255,255,0.65)",
    fontSize: 10,
    lineHeight: 15,
  },

  messageClose: {
    width: 27,
    height: 27,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  // Resources
  resourceContainer: {
    overflow: "hidden",
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  resourceCard: {
    minHeight: 69,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.045)",
  },

  resourceCardPressed: {
    backgroundColor: "rgba(255,255,255,0.025)",
  },

  resourceIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  resourceText: {
    flex: 1,
    minWidth: 0,
  },

  resourceLabel: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
  },

  resourceDescription: {
    color: "rgba(255,255,255,0.30)",
    fontSize: 9,
    lineHeight: 14,
    marginTop: 2,
  },

  resourceArrow: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  resourceArrowText: {
    color: "rgba(255,255,255,0.22)",
    fontSize: 21,
    lineHeight: 24,
    fontWeight: "300",
  },

  // Category
  categoryScroll: {
    marginHorizontal: -20,
    marginBottom: 12,
  },

  categoryScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },

  categoryChip: {
    minHeight: 35,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  categoryChipText: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 10,
    fontWeight: "800",
  },

  categoryDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },

  // FAQ
  faqSections: {
    gap: 15,
  },

  faqSection: {
    gap: 8,
  },

  faqCategoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 3,
  },

  faqCategoryDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },

  faqCategoryTitle: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "900",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },

  faqCount: {
    minWidth: 21,
    height: 19,
    paddingHorizontal: 5,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },

  faqCountText: {
    fontSize: 8,
    fontWeight: "900",
  },

  faqContainer: {
    overflow: "hidden",
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.045)",
  },

  faqQuestionButton: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  faqIndicator: {
    width: 3,
    height: 20,
    borderRadius: 2,
  },

  faqQuestion: {
    flex: 1,
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },

  faqQuestionOpen: {
    color: "#FFFFFF",
    fontWeight: "750",
  },

  chevronContainer: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  faqAnswerContainer: {
    paddingLeft: 27,
    paddingRight: 15,
    paddingBottom: 15,
  },

  faqAnswer: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 11,
    lineHeight: 18,
  },

  // No results
  noResults: {
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 42,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  noResultsIcon: {
    width: 62,
    height: 62,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 13,
  },

  noResultsTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  noResultsDescription: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 5,
  },

  resetButton: {
    minHeight: 39,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    borderWidth: 1,
    marginTop: 15,
  },

  resetButtonText: {
    fontSize: 10,
    fontWeight: "800",
  },

  // Contact
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    padding: 15,
    borderRadius: 18,
    backgroundColor: "rgba(16,185,129,0.065)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.16)",
    marginTop: 20,
  },

  contactIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16,185,129,0.12)",
  },

  contactContent: {
    flex: 1,
  },

  contactTitle: {
    color: "#FFFFFF",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "800",
  },

  contactDescription: {
    color: "rgba(255,255,255,0.34)",
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },

  footerText: {
    color: "rgba(255,255,255,0.18)",
    fontSize: 9,
    textAlign: "center",
    marginTop: 22,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "rgba(0,0,0,0.76)",
  },

  modalCard: {
    width: "100%",
    maxWidth: 420,
    padding: 20,
    borderRadius: 23,
    backgroundColor: "#0B1020",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  modalTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 17,
  },

  modalIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.12)",
  },

  modalClose: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  modalTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "900",
  },

  modalDescription: {
    color: "rgba(255,255,255,0.50)",
    fontSize: 11,
    lineHeight: 18,
    marginTop: 7,
  },

  modalNote: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 9,
    lineHeight: 14,
    marginTop: 10,
  },

  modalButton: {
    minHeight: 45,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    marginTop: 18,
  },

  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  // Generic pressed state
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.985 }],
  },
});
