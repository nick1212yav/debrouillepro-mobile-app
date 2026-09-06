// src/pages/home/_components/AIAssistant.tsx

import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";

import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronUp,
  Copy,
  Globe2,
  History,
  Mic,
  RotateCcw,
  Send,
  Sparkles,
  Wand2,
  X,
} from "lucide-react-native";

import { useAction } from "convex/react";

import { api } from "@/convex/_generated/api.js";

/* ============================================================================
 * TYPES
 * ========================================================================== */

type Role = "user" | "assistant";

type ActionCard = {
  label: string;
  page: string;
  emoji: string;
};

type Message = {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  actionCards?: ActionCard[];
};

type Props = {
  onClose: () => void;
  onNavigate: (page: string) => void;
  moduleContext?: string;
};

type HistoryModule = {
  key: string;
  label: string;
  emoji: string;
};

/* ============================================================================
 * CONSTANTS
 * ========================================================================== */

const STORAGE_KEY = "debrouille_ai_history";

const MAX_HISTORY_MESSAGES = 50;
const MAX_CONTEXT_MESSAGES = 10;
const MAX_ACTION_CARDS = 3;

const SUGGESTIONS_MAP: Record<string, string[]> = {
  home: [
    "Trouve-moi un logement à proximité",
    "Je cherche un médecin proche",
    "Comment envoyer de l'argent ?",
    "Quels événements sont disponibles ?",
  ],

  immo: [
    "Trouver un appartement 3 pièces",
    "Louer ou acheter : que choisir ?",
    "Comment choisir un bon quartier ?",
    "Comment négocier un loyer ?",
  ],

  jobs: [
    "Quels emplois correspondent à mon profil ?",
    "Comment améliorer mon CV ?",
    "Freelance ou salarié : que choisir ?",
    "Comment préparer un entretien ?",
  ],

  transport: [
    "Trouver un moyen de transport",
    "Comment préparer mon trajet ?",
    "Comparer les options disponibles",
    "Comment suivre mon trajet ?",
  ],

  sante: [
    "Trouver un professionnel de santé",
    "Prendre rendez-vous",
    "Comment préparer ma consultation ?",
    "Trouver une pharmacie",
  ],

  paiement: [
    "Comment effectuer un transfert ?",
    "Comparer les moyens de paiement",
    "Comment recharger mon compte ?",
    "Quels sont les frais ?",
  ],

  agri: [
    "Conseils pour mes cultures",
    "Analyser les risques agricoles",
    "Préparer ma prochaine récolte",
    "Optimiser mon exploitation",
  ],

  evenements: [
    "Trouver des événements proches",
    "Quels événements sont disponibles ?",
    "Trouver une activité ce week-end",
    "Comment organiser un événement ?",
  ],

  voyages: [
    "Préparer mon prochain voyage",
    "Trouver une destination",
    "Organiser mon itinéraire",
    "Comparer les options de transport",
  ],

  marketplace: [
    "Trouver un produit",
    "Comment vendre rapidement ?",
    "Comment sécuriser une transaction ?",
    "Comparer les offres disponibles",
  ],
};

const ACTION_CARDS_MAP: Record<string, ActionCard[]> = {
  immo: [
    {
      label: "Voir les logements",
      page: "immo",
      emoji: "🏠",
    },
  ],

  jobs: [
    {
      label: "Trouver un emploi",
      page: "jobs",
      emoji: "💼",
    },
  ],

  transport: [
    {
      label: "Ouvrir Transport",
      page: "transport",
      emoji: "🚗",
    },
  ],

  sante: [
    {
      label: "Ouvrir Santé+",
      page: "sante",
      emoji: "🏥",
    },
    {
      label: "Urgences",
      page: "sos",
      emoji: "🚨",
    },
  ],

  paiement: [
    {
      label: "Ouvrir Paiement",
      page: "paiement",
      emoji: "💳",
    },
  ],

  agri: [
    {
      label: "Ouvrir Agriculture",
      page: "agri",
      emoji: "🌾",
    },
  ],

  evenements: [
    {
      label: "Voir les événements",
      page: "evenements",
      emoji: "🎉",
    },
  ],

  voyages: [
    {
      label: "Planifier un voyage",
      page: "voyages",
      emoji: "✈️",
    },
  ],

  marketplace: [
    {
      label: "Ouvrir la boutique",
      page: "marketplace",
      emoji: "🛍️",
    },
  ],
};

const KEYWORD_ACTIONS: {
  keywords: string[];
  card: ActionCard;
}[] = [
  {
    keywords: [
      "logement",
      "maison",
      "appartement",
      "louer",
      "acheter",
      "immobilier",
      "immo",
    ],
    card: {
      label: "Voir les logements",
      page: "immo",
      emoji: "🏠",
    },
  },

  {
    keywords: ["emploi", "job", "travail", "recrut", "cv", "offre"],
    card: {
      label: "Chercher un emploi",
      page: "jobs",
      emoji: "💼",
    },
  },

  {
    keywords: ["transport", "vtc", "taxi", "bus", "trajet"],
    card: {
      label: "Ouvrir Transport",
      page: "transport",
      emoji: "🚗",
    },
  },

  {
    keywords: [
      "médecin",
      "santé",
      "rdv",
      "clinique",
      "pharmacie",
      "médicament",
    ],
    card: {
      label: "Ouvrir Santé+",
      page: "sante",
      emoji: "🏥",
    },
  },

  {
    keywords: ["urgence", "sos", "police", "pompier", "secours"],
    card: {
      label: "SOS Urgences",
      page: "sos",
      emoji: "🚨",
    },
  },

  {
    keywords: [
      "paiement",
      "argent",
      "transfert",
      "recharger",
      "mobile money",
      "wallet",
    ],
    card: {
      label: "Paiement",
      page: "paiement",
      emoji: "💸",
    },
  },

  {
    keywords: ["événement", "concert", "festival", "billet", "fête"],
    card: {
      label: "Événements",
      page: "evenements",
      emoji: "🎉",
    },
  },

  {
    keywords: ["voyage", "avion", "train", "destination", "vacances"],
    card: {
      label: "Voyages",
      page: "voyages",
      emoji: "✈️",
    },
  },

  {
    keywords: ["colis", "livraison", "coursier", "envoyer"],
    card: {
      label: "Livraison",
      page: "livraison",
      emoji: "📦",
    },
  },

  {
    keywords: [
      "agri",
      "agricol",
      "plante",
      "récolte",
      "champ",
      "manioc",
      "maïs",
    ],
    card: {
      label: "Agriculture",
      page: "agri",
      emoji: "🌾",
    },
  },

  {
    keywords: ["communauté", "groupe", "quartier", "voisin", "forum"],
    card: {
      label: "Communauté",
      page: "community",
      emoji: "💬",
    },
  },

  {
    keywords: ["boutique", "vendre", "acheter", "produit", "marketplace"],
    card: {
      label: "Boutique",
      page: "marketplace",
      emoji: "🛍️",
    },
  },

  {
    keywords: ["formation", "cours", "apprendre", "certificat", "étude"],
    card: {
      label: "Apprendre",
      page: "apprendre",
      emoji: "📚",
    },
  },
];

const MODULE_LABELS: Record<string, string> = {
  home: "Général",
  immo: "Immobilier",
  jobs: "Emploi",
  sante: "Santé+",
  paiement: "Paiement",
  transport: "Transport",
  agri: "Agriculture",
  evenements: "Événements",
  voyages: "Voyages",
  marketplace: "Boutique",
  community: "Communauté",
  livraison: "Livraison",
  sos: "SOS",
  wallet: "Wallet",
  apprendre: "Apprendre",
  dashboard: "Dashboard",
  messages: "Messages",
};

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function createId(prefix = "msg"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getStorageKey(moduleContext: string): string {
  return `${STORAGE_KEY}_${moduleContext}`;
}

function createWelcomeMessage(moduleContext: string): Message {
  const contextual = moduleContext !== "home";

  return {
    id: "welcome",
    role: "assistant",
    content: contextual
      ? `Salut 👋 Je suis Débrouille AI.

Je suis connecté au contexte ${MODULE_LABELS[moduleContext] ?? moduleContext}. Je peux t'aider à comprendre ce que tu fais ici, trouver la bonne fonctionnalité ou t'accompagner dans une action.

Que veux-tu faire ?`
      : `Salut 👋 Je suis Débrouille AI.

Ton copilote intelligent dans DébrouillePro. Je peux t'aider à trouver une information, comprendre une situation, explorer un module ou passer directement à l'action.

Qu'est-ce qu'on règle ensemble ?`,
    timestamp: Date.now(),
  };
}

async function loadHistory(moduleContext: string): Promise<Message[]> {
  try {
    const raw = await AsyncStorage.getItem(getStorageKey(moduleContext));

    if (!raw) {
      return [createWelcomeMessage(moduleContext)];
    }

    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [createWelcomeMessage(moduleContext)];
    }

    const valid = parsed.filter((item): item is Message =>
      Boolean(
        item &&
        typeof item === "object" &&
        "id" in item &&
        "role" in item &&
        "content" in item &&
        "timestamp" in item,
      ),
    );

    return valid.length > 0 ? valid : [createWelcomeMessage(moduleContext)];
  } catch {
    return [createWelcomeMessage(moduleContext)];
  }
}

async function saveHistory(
  messages: Message[],
  moduleContext: string,
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      getStorageKey(moduleContext),
      JSON.stringify(messages.slice(-MAX_HISTORY_MESSAGES)),
    );
  } catch {
    // Le stockage peut être temporairement indisponible.
  }
}

function extractActionCards(text: string): ActionCard[] {
  const lower = text.toLocaleLowerCase();

  const seen = new Set<string>();
  const cards: ActionCard[] = [];

  for (const { keywords, card } of KEYWORD_ACTIONS) {
    const matches = keywords.some((keyword) =>
      lower.includes(keyword.toLocaleLowerCase()),
    );

    if (matches && !seen.has(card.page)) {
      seen.add(card.page);
      cards.push(card);

      if (cards.length >= MAX_ACTION_CARDS) {
        break;
      }
    }
  }

  return cards;
}

function formatTime(timestamp: number): string {
  try {
    return new Date(timestamp).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function getHistoryModules(): HistoryModule[] {
  return [
    {
      key: "home",
      label: "Général",
      emoji: "✦",
    },
    {
      key: "immo",
      label: "Immobilier",
      emoji: "🏠",
    },
    {
      key: "jobs",
      label: "Emploi",
      emoji: "💼",
    },
    {
      key: "sante",
      label: "Santé",
      emoji: "🏥",
    },
    {
      key: "paiement",
      label: "Paiement",
      emoji: "💳",
    },
    {
      key: "transport",
      label: "Transport",
      emoji: "🚗",
    },
    {
      key: "agri",
      label: "Agriculture",
      emoji: "🌱",
    },
    {
      key: "evenements",
      label: "Événements",
      emoji: "🎉",
    },
    {
      key: "voyages",
      label: "Voyages",
      emoji: "✈️",
    },
  ];
}

/* ============================================================================
 * HISTORY MODAL
 * ========================================================================== */

interface HistoryModalProps {
  visible: boolean;
  onClose: () => void;
  onLoad: (module: string, messages: Message[]) => void;
}

function HistoryModal({ visible, onClose, onLoad }: HistoryModalProps) {
  const [conversations, setConversations] = useState<Record<string, Message[]>>(
    {},
  );

  const modules = useMemo(() => getHistoryModules(), []);

  useEffect(() => {
    if (!visible) {
      return;
    }

    let active = true;

    const loadConversations = async () => {
      const entries = await Promise.all(
        modules.map(async (module) => {
          const messages = await loadHistory(module.key);

          const userMessages = messages.filter(
            (message) => message.role === "user",
          );

          return [module.key, userMessages.length > 0 ? messages : []] as const;
        }),
      );

      if (!active) {
        return;
      }

      setConversations(Object.fromEntries(entries));
    };

    void loadConversations();

    return () => {
      active = false;
    };
  }, [modules, visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.historyScreen}>
        <View style={styles.historyHeader}>
          <View>
            <Text style={styles.historyEyebrow}>Débrouille AI</Text>

            <Text style={styles.historyTitle}>Tes conversations</Text>
          </View>

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fermer l'historique"
            style={styles.iconButton}
          >
            <X size={18} color="rgba(255,255,255,0.7)" />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.historyContent}
          showsVerticalScrollIndicator={false}
        >
          {modules.map((module) => {
            const messages = conversations[module.key] ?? [];

            const userMessages = messages.filter(
              (message) => message.role === "user",
            );

            const lastMessage = messages[messages.length - 1];

            if (userMessages.length === 0) {
              return null;
            }

            return (
              <Pressable
                key={module.key}
                onPress={() => onLoad(module.key, messages)}
                style={styles.historyItem}
              >
                <View style={styles.historyEmoji}>
                  <Text style={styles.historyEmojiText}>{module.emoji}</Text>
                </View>

                <View style={styles.historyInfo}>
                  <View style={styles.historyTitleRow}>
                    <Text style={styles.historyModuleName} numberOfLines={1}>
                      {module.label}
                    </Text>

                    <View style={styles.historyCount}>
                      <Text style={styles.historyCountText}>
                        {userMessages.length}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.historyPreview} numberOfLines={1}>
                    {lastMessage?.content ?? "Conversation"}
                  </Text>
                </View>

                <ArrowRight size={16} color="rgba(255,255,255,0.2)" />
              </Pressable>
            );
          })}

          <View style={styles.historyFooter}>
            <History size={22} color="rgba(255,255,255,0.15)" />

            <Text style={styles.historyFooterText}>
              Ton historique est conservé localement sur cet appareil.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ============================================================================
 * THINKING INDICATOR
 * ========================================================================== */

function ThinkingIndicator() {
  return (
    <View style={styles.thinkingRow}>
      <View style={styles.aiMiniAvatar}>
        <Sparkles size={14} color="#FFFFFF" />
      </View>

      <View style={styles.thinkingBubble}>
        <ActivityIndicator size="small" color="#A78BFA" />

        <Text style={styles.thinkingText}>Débrouille réfléchit…</Text>
      </View>
    </View>
  );
}

/* ============================================================================
 * MESSAGE CONTENT
 * ========================================================================== */

function MessageContent({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <View>
      {lines.map((line, index) => (
        <Text
          key={`${index}-${line}`}
          style={[
            styles.messageText,
            line.trim().startsWith("**") && styles.messageTextBold,
          ]}
        >
          {line.replace(/\*\*/g, "")}
        </Text>
      ))}
    </View>
  );
}

/* ============================================================================
 * MAIN COMPONENT
 * ========================================================================== */

export default function AIAssistant({
  onClose,
  onNavigate,
  moduleContext = "home",
}: Props) {
  const [messages, setMessages] = useState<Message[]>([
    createWelcomeMessage(moduleContext),
  ]);

  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const [showHistory, setShowHistory] = useState(false);

  const [showSuggestions, setShowSuggestions] = useState(true);

  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView | null>(null);

  const inputRef = useRef<TextInput | null>(null);

  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const chatAction = useAction(api.ai.chat);

  const suggestions = useMemo(
    () => SUGGESTIONS_MAP[moduleContext] ?? SUGGESTIONS_MAP.home,
    [moduleContext],
  );

  const contextLabel = MODULE_LABELS[moduleContext] ?? moduleContext;

  const hasContextBadge = moduleContext !== "home";

  /* --------------------------------------------------------------------------
   * LOAD HISTORY
   * ------------------------------------------------------------------------ */

  useEffect(() => {
    let active = true;

    const load = async () => {
      const history = await loadHistory(moduleContext);

      if (!active) {
        return;
      }

      setMessages(history);
      setShowSuggestions(
        history.filter((message) => message.role === "user").length === 0,
      );
    };

    void load();

    return () => {
      active = false;
    };
  }, [moduleContext]);

  /* --------------------------------------------------------------------------
   * AUTO SCROLL
   * ------------------------------------------------------------------------ */

  const scrollToBottom = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({
        animated,
      });
    });
  }, []);

  useEffect(() => {
    scrollToBottom(true);
  }, [isThinking, messages, scrollToBottom]);

  /* --------------------------------------------------------------------------
   * SCROLL HANDLER
   *
   * Native replacement for:
   * scrollHeight
   * clientHeight
   * scrollIntoView()
   * ------------------------------------------------------------------------ */

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;

      const distanceFromBottom =
        contentSize.height - contentOffset.y - layoutMeasurement.height;

      setShowScrollButton(distanceFromBottom > 140);
    },
    [],
  );

  /* --------------------------------------------------------------------------
   * SEND MESSAGE
   * ------------------------------------------------------------------------ */

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();

      if (!trimmed || isThinking) {
        return;
      }

      const userMessage: Message = {
        id: createId("user"),
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };

      const updatedMessages = [...messages, userMessage];

      setMessages(updatedMessages);
      setInput("");
      setIsThinking(true);
      setShowSuggestions(false);

      void saveHistory(updatedMessages, moduleContext);

      try {
        const contextMessages = updatedMessages
          .filter((message) => message.id !== "welcome")
          .slice(-MAX_CONTEXT_MESSAGES)
          .map((message) => ({
            role: message.role,
            content: message.content,
          }));

        const response = await chatAction({
          messages: contextMessages,
          moduleContext,
        });

        const reply =
          typeof response?.reply === "string" ? response.reply.trim() : "";

        if (!reply) {
          throw new Error("L'IA n'a retourné aucune réponse.");
        }

        const keywordCards = extractActionCards(reply);

        const contextualCards = ACTION_CARDS_MAP[moduleContext] ?? [];

        const combinedCards: ActionCard[] = [...keywordCards];

        for (const card of contextualCards) {
          if (!combinedCards.some((existing) => existing.page === card.page)) {
            combinedCards.push(card);
          }
        }

        const assistantMessage: Message = {
          id: createId("assistant"),
          role: "assistant",
          content: reply,
          timestamp: Date.now(),
          actionCards:
            combinedCards.length > 0
              ? combinedCards.slice(0, MAX_ACTION_CARDS)
              : undefined,
        };

        const finalMessages = [...updatedMessages, assistantMessage];

        setMessages(finalMessages);

        void saveHistory(finalMessages, moduleContext);
      } catch (error) {
        Alert.alert(
          "Débrouille AI",
          error instanceof Error
            ? error.message
            : "Impossible de contacter Débrouille AI.",
        );
      } finally {
        setIsThinking(false);

        requestAnimationFrame(() => {
          inputRef.current?.focus();
        });
      }
    },
    [chatAction, isThinking, messages, moduleContext],
  );

  /* --------------------------------------------------------------------------
   * CLEAR HISTORY
   * ------------------------------------------------------------------------ */

  const clearHistory = useCallback(() => {
    const fresh = [createWelcomeMessage(moduleContext)];

    setMessages(fresh);
    setShowSuggestions(true);

    void saveHistory(fresh, moduleContext);

    Alert.alert("Débrouille AI", "Nouvelle conversation.");
  }, [moduleContext]);

  /* --------------------------------------------------------------------------
   * COPY
   * ------------------------------------------------------------------------ */

  const copyMessage = useCallback(async (message: Message) => {
    try {
      await Clipboard.setStringAsync(message.content);

      setCopiedMessageId(message.id);

      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }

      copyTimeoutRef.current = setTimeout(() => {
        setCopiedMessageId(null);
      }, 1800);
    } catch {
      Alert.alert("Erreur", "Impossible de copier ce message.");
    }
  }, []);

  /* --------------------------------------------------------------------------
   * CLEANUP
   * ------------------------------------------------------------------------ */

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  /* --------------------------------------------------------------------------
   * NAVIGATION
   * ------------------------------------------------------------------------ */

  const handleActionNavigation = useCallback(
    (page: string) => {
      onNavigate(page);
      onClose();
    },
    [onClose, onNavigate],
  );

  /* --------------------------------------------------------------------------
   * VOICE
   *
   * Le navigateur SpeechRecognition est volontairement supprimé.
   * ------------------------------------------------------------------------ */

  const handleVoicePress = useCallback(() => {
    Alert.alert(
      "Saisie vocale",
      "La reconnaissance vocale native sera connectée au moteur de reconnaissance vocale de l'application.",
    );
  }, []);

  /* ==========================================================================
   * RENDER
   * ======================================================================== */

  return (
    <View style={styles.container}>
      {/* HEADER */}

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.aiAvatar}>
            <Sparkles size={20} color="#FFFFFF" strokeWidth={2.4} />

            <View style={styles.onlineDot} />
          </View>

          <View style={styles.headerInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>
                Débrouille AI
              </Text>

              {hasContextBadge && (
                <View style={styles.contextBadge}>
                  <Text style={styles.contextBadgeText} numberOfLines={1}>
                    {contextLabel}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.subtitleRow}>
              <Globe2 size={10} color="rgba(255,255,255,0.35)" />

              <Text style={styles.subtitle}>Assistant intelligent</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            onPress={() => setShowHistory(true)}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Ouvrir l'historique"
          >
            <History size={16} color="rgba(255,255,255,0.55)" />
          </Pressable>

          <Pressable
            onPress={clearHistory}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Nouvelle conversation"
          >
            <RotateCcw size={16} color="rgba(255,255,255,0.55)" />
          </Pressable>

          <Pressable
            onPress={onClose}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Fermer Débrouille AI"
          >
            <X size={18} color="rgba(255,255,255,0.7)" />
          </Pressable>
        </View>
      </View>

      {/* CONVERSATION */}

      <ScrollView
        ref={scrollRef}
        style={styles.messagesScroll}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {messages.map((message) => {
          const isUser = message.role === "user";

          return (
            <View
              key={message.id}
              style={[
                styles.messageRow,
                isUser ? styles.messageRowUser : styles.messageRowAssistant,
              ]}
            >
              {!isUser && (
                <View style={styles.messageAvatar}>
                  <Sparkles size={13} color="#FFFFFF" />
                </View>
              )}

              <View
                style={[
                  styles.messageWrapper,
                  isUser
                    ? styles.messageWrapperUser
                    : styles.messageWrapperAssistant,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble : styles.assistantBubble,
                  ]}
                >
                  <MessageContent content={message.content} />

                  <View style={styles.messageMeta}>
                    <Text style={styles.messageTime}>
                      {formatTime(message.timestamp)}
                    </Text>

                    {!isUser && (
                      <Pressable
                        onPress={() => void copyMessage(message)}
                        style={styles.copyButton}
                      >
                        {copiedMessageId === message.id ? (
                          <>
                            <Check size={11} color="rgba(255,255,255,0.6)" />

                            <Text style={styles.copyText}>Copié</Text>
                          </>
                        ) : (
                          <>
                            <Copy size={11} color="rgba(255,255,255,0.4)" />

                            <Text style={styles.copyText}>Copier</Text>
                          </>
                        )}
                      </Pressable>
                    )}
                  </View>
                </View>

                {!isUser &&
                  message.actionCards &&
                  message.actionCards.length > 0 && (
                    <View style={styles.actionCards}>
                      {message.actionCards.map((card) => (
                        <Pressable
                          key={card.page}
                          onPress={() => handleActionNavigation(card.page)}
                          style={styles.actionCard}
                        >
                          <Text style={styles.actionEmoji}>{card.emoji}</Text>

                          <Text style={styles.actionText}>{card.label}</Text>

                          <ArrowRight
                            size={12}
                            color="rgba(196,181,253,0.65)"
                          />
                        </Pressable>
                      ))}
                    </View>
                  )}
              </View>
            </View>
          );
        })}

        {isThinking && <ThinkingIndicator />}
      </ScrollView>

      {/* SCROLL BUTTON */}

      {showScrollButton && (
        <Pressable
          onPress={() => scrollToBottom(true)}
          style={styles.scrollButton}
          accessibilityRole="button"
          accessibilityLabel="Revenir aux derniers messages"
        >
          <ArrowDown size={19} color="#FFFFFF" />
        </Pressable>
      )}

      {/* SUGGESTIONS */}

      {showSuggestions && !isThinking && (
        <View style={styles.suggestionsArea}>
          <View style={styles.suggestionsHeader}>
            <View style={styles.suggestionsTitleRow}>
              <Wand2 size={12} color="rgba(167,139,250,0.75)" />

              <Text style={styles.suggestionsTitle}>Suggestions</Text>
            </View>

            <Pressable onPress={() => setShowSuggestions(false)} hitSlop={10}>
              <ChevronUp size={16} color="rgba(255,255,255,0.35)" />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsList}
          >
            {suggestions.map((suggestion) => (
              <Pressable
                key={suggestion}
                onPress={() => void sendMessage(suggestion)}
                style={styles.suggestionButton}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* INPUT */}

      <View style={styles.footer}>
        <View style={styles.inputContainer}>
          <Pressable
            onPress={handleVoicePress}
            style={styles.voiceButton}
            accessibilityRole="button"
            accessibilityLabel="Dicter un message"
          >
            <Mic size={17} color="rgba(255,255,255,0.55)" />
          </Pressable>

          <TextInput
            ref={inputRef}
            value={input}
            onChangeText={setInput}
            placeholder="Parle à Débrouille AI…"
            placeholderTextColor="rgba(255,255,255,0.28)"
            multiline
            maxLength={4000}
            style={styles.input}
            accessibilityLabel="Message à Débrouille AI"
          />

          <Pressable
            onPress={() => void sendMessage(input)}
            disabled={!input.trim() || isThinking}
            style={[
              styles.sendButton,
              (!input.trim() || isThinking) && styles.sendButtonDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Envoyer le message"
          >
            <Send
              size={17}
              color={
                input.trim() && !isThinking
                  ? "#FFFFFF"
                  : "rgba(255,255,255,0.25)"
              }
            />
          </Pressable>
        </View>

        <Text style={styles.footerHint}>
          Débrouille AI peut parfois faire des erreurs.
        </Text>
      </View>

      {/* HISTORY */}

      <HistoryModal
        visible={showHistory}
        onClose={() => setShowHistory(false)}
        onLoad={(module, historyMessages) => {
          setMessages(historyMessages);
          setShowHistory(false);
          setShowSuggestions(
            historyMessages.filter((message) => message.role === "user")
              .length === 0,
          );

          if (module !== moduleContext) {
            Alert.alert(
              "Historique chargé",
              `Conversation ${MODULE_LABELS[module] ?? module} ouverte.`,
            );
          }
        }}
      />
    </View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050719",
  },

  /* HEADER */

  header: {
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  aiAvatar: {
    width: 46,
    height: 46,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C3AED",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },

  onlineDot: {
    position: "absolute",
    width: 11,
    height: 11,
    borderRadius: 6,
    top: -2,
    right: -2,
    backgroundColor: "#34D399",
    borderWidth: 2,
    borderColor: "#050719",
  },

  headerInfo: {
    flex: 1,
    minWidth: 0,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  title: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  contextBadge: {
    maxWidth: 115,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: "rgba(139,92,246,0.16)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.25)",
  },

  contextBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#C4B5FD",
  },

  subtitleRow: {
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  subtitle: {
    fontSize: 10,
    color: "rgba(255,255,255,0.35)",
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  /* MESSAGES */

  messagesScroll: {
    flex: 1,
  },

  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 16,
  },

  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },

  messageRowUser: {
    justifyContent: "flex-end",
  },

  messageRowAssistant: {
    justifyContent: "flex-start",
  },

  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 11,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C3AED",
  },

  messageWrapper: {
    maxWidth: "86%",
  },

  messageWrapperUser: {
    alignItems: "flex-end",
  },

  messageWrapperAssistant: {
    alignItems: "flex-start",
  },

  messageBubble: {
    paddingHorizontal: 15,
    paddingVertical: 12,
  },

  userBubble: {
    borderRadius: 23,
    borderBottomRightRadius: 6,
    backgroundColor: "#6D5CE7",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  assistantBubble: {
    borderRadius: 23,
    borderBottomLeftRadius: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  messageText: {
    fontSize: 14,
    lineHeight: 22,
    color: "rgba(255,255,255,0.92)",
  },

  messageTextBold: {
    fontWeight: "800",
    color: "#FFFFFF",
  },

  messageMeta: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },

  messageTime: {
    fontSize: 9,
    color: "rgba(255,255,255,0.30)",
  },

  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  copyText: {
    fontSize: 9,
    color: "rgba(255,255,255,0.40)",
  },

  /* ACTION CARDS */

  actionCards: {
    marginTop: 7,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: "rgba(139,92,246,0.12)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.25)",
  },

  actionEmoji: {
    fontSize: 13,
  },

  actionText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#DDD6FE",
  },

  /* THINKING */

  thinkingRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },

  aiMiniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 11,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C3AED",
  },

  thinkingBubble: {
    minHeight: 45,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  thinkingText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
  },

  /* SCROLL BUTTON */

  scrollButton: {
    position: "absolute",
    right: 18,
    bottom: 150,
    width: 44,
    height: 44,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(109,92,231,0.90)",
    borderWidth: 1,
    borderColor: "rgba(196,181,253,0.40)",
  },

  /* SUGGESTIONS */

  suggestionsArea: {
    paddingHorizontal: 14,
    paddingBottom: 8,
  },

  suggestionsHeader: {
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  suggestionsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  suggestionsTitle: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.35)",
  },

  suggestionsList: {
    gap: 8,
    paddingRight: 12,
  },

  suggestionButton: {
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "rgba(139,92,246,0.10)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.20)",
  },

  suggestionText: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(255,255,255,0.65)",
  },

  /* INPUT */

  footer: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.08)",
  },

  inputContainer: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 8,
    borderRadius: 27,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  voiceButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 14,
    lineHeight: 21,
    color: "#FFFFFF",
    textAlignVertical: "top",
  },

  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6D5CE7",
  },

  sendButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  footerHint: {
    marginTop: 7,
    textAlign: "center",
    fontSize: 9,
    color: "rgba(255,255,255,0.18)",
  },

  /* HISTORY */

  historyScreen: {
    flex: 1,
    backgroundColor: "#050719",
  },

  historyHeader: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  historyEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.4,
    color: "#A78BFA",
  },

  historyTitle: {
    marginTop: 5,
    fontSize: 21,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  historyContent: {
    padding: 16,
    gap: 10,
  },

  historyItem: {
    minHeight: 72,
    padding: 12,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  historyEmoji: {
    width: 45,
    height: 45,
    marginRight: 12,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.12)",
  },

  historyEmojiText: {
    fontSize: 20,
  },

  historyInfo: {
    flex: 1,
    minWidth: 0,
  },

  historyTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  historyModuleName: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  historyCount: {
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  historyCountText: {
    fontSize: 9,
    color: "rgba(255,255,255,0.45)",
  },

  historyPreview: {
    marginTop: 5,
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
  },

  historyFooter: {
    paddingVertical: 36,
    alignItems: "center",
    gap: 10,
  },

  historyFooterText: {
    maxWidth: 280,
    textAlign: "center",
    fontSize: 11,
    lineHeight: 17,
    color: "rgba(255,255,255,0.25)",
  },
});
