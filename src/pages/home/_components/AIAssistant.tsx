// src/pages/home/_components/AIAssistant.tsx
import {
  View,
  Pressable,
  Text,
  TextInput,
  ScrollView,
  Animated,
  Easing,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import {
  X,
  Send,
  Sparkles,
  RotateCcw,
  ChevronDown,
  Mic,
  MicOff,
  ArrowRight,
  History,
  ChevronUp,
  Copy,
  Check,
  Brain,
  Wand2,
  Globe2,
} from "lucide-react-native";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { toast } from "sonner";
import { Clipboard } from "@react-native-clipboard/clipboard";

/* ============================================================================
 * TYPES
 * ========================================================================== */

type Role = "user" | "assistant";
type ActionCard = { label: string; page: string; emoji: string };
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
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};

/* ============================================================================
 * CONSTANTS
 * ========================================================================== */

const STORAGE_KEY = "debrouille_ai_history";
const MAX_HISTORY_MESSAGES = 50;
const MAX_CONTEXT_MESSAGES = 10;
const MAX_ACTION_CARDS = 3;
const isBrowser = typeof window !== "undefined";

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
  immo: [{ label: "Voir les logements", page: "immo", emoji: "🏠" }],
  jobs: [{ label: "Trouver un emploi", page: "jobs", emoji: "💼" }],
  transport: [{ label: "Ouvrir Transport", page: "transport", emoji: "🚗" }],
  sante: [
    { label: "Ouvrir Santé+", page: "sante", emoji: "🏥" },
    { label: "Urgences", page: "sos", emoji: "🚨" },
  ],
  paiement: [{ label: "Ouvrir Paiement", page: "paiement", emoji: "💳" }],
  agri: [{ label: "Ouvrir Agriculture", page: "agri", emoji: "🌾" }],
  evenements: [
    { label: "Voir les événements", page: "evenements", emoji: "🎉" },
  ],
  voyages: [{ label: "Planifier un voyage", page: "voyages", emoji: "✈️" }],
  marketplace: [
    { label: "Ouvrir la boutique", page: "marketplace", emoji: "🛍️" },
  ],
};

const KEYWORD_ACTIONS: { keywords: string[]; card: ActionCard }[] = [
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
    card: { label: "Voir les logements", page: "immo", emoji: "🏠" },
  },
  {
    keywords: ["emploi", "job", "travail", "recrut", "cv", "offre"],
    card: { label: "Chercher un emploi", page: "jobs", emoji: "💼" },
  },
  {
    keywords: ["transport", "vtc", "taxi", "bus", "trajet"],
    card: { label: "Ouvrir Transport", page: "transport", emoji: "🚗" },
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
    card: { label: "Ouvrir Santé+", page: "sante", emoji: "🏥" },
  },
  {
    keywords: ["urgence", "sos", "police", "pompier", "secours"],
    card: { label: "SOS Urgences", page: "sos", emoji: "🚨" },
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
    card: { label: "Paiement", page: "paiement", emoji: "💸" },
  },
  {
    keywords: ["événement", "concert", "festival", "billet", "fête"],
    card: { label: "Événements", page: "evenements", emoji: "🎉" },
  },
  {
    keywords: ["voyage", "avion", "train", "destination", "vacances"],
    card: { label: "Voyages", page: "voyages", emoji: "✈️" },
  },
  {
    keywords: ["colis", "livraison", "coursier", "envoyer"],
    card: { label: "Livraison", page: "livraison", emoji: "📦" },
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
    card: { label: "Agriculture", page: "agri", emoji: "🌾" },
  },
  {
    keywords: ["communauté", "groupe", "quartier", "voisin", "forum"],
    card: { label: "Communauté", page: "community", emoji: "💬" },
  },
  {
    keywords: ["boutique", "vendre", "acheter", "produit", "marketplace"],
    card: { label: "Boutique", page: "marketplace", emoji: "🛍️" },
  },
  {
    keywords: ["formation", "cours", "apprendre", "certificat", "étude"],
    card: { label: "Apprendre", page: "apprendre", emoji: "📚" },
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
      ? `Salut 👋 Je suis **Débrouille AI**.\n\nJe suis connecté au contexte **${MODULE_LABELS[moduleContext] ?? moduleContext}**. Je peux t'aider à comprendre ce que tu fais ici, trouver la bonne fonctionnalité ou t'accompagner dans une action.\n\n**Que veux-tu faire ?**`
      : `Salut 👋 Je suis **Débrouille AI**.\n\nTon copilote intelligent dans DébrouillePro. Je peux t'aider à trouver une information, comprendre une situation, explorer un module ou passer directement à l'action.\n\n**Qu'est-ce qu'on règle ensemble ?**`,
    timestamp: Date.now(),
  };
}

function loadHistory(moduleContext: string): Message[] {
  if (!isBrowser) return [createWelcomeMessage(moduleContext)];
  try {
    const raw = window.localStorage.getItem(getStorageKey(moduleContext));
    if (!raw) return [createWelcomeMessage(moduleContext)];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [createWelcomeMessage(moduleContext)];
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

function saveHistory(messages: Message[], moduleContext: string): void {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(
      getStorageKey(moduleContext),
      JSON.stringify(messages.slice(-MAX_HISTORY_MESSAGES)),
    );
  } catch {}
}

function extractActionCards(text: string): ActionCard[] {
  const lower = text.toLocaleLowerCase();
  const seen = new Set<string>();
  const cards: ActionCard[] = [];
  for (const { keywords, card } of KEYWORD_ACTIONS) {
    if (
      keywords.some((k) => lower.includes(k.toLocaleLowerCase())) &&
      !seen.has(card.page)
    ) {
      seen.add(card.page);
      cards.push(card);
      if (cards.length >= MAX_ACTION_CARDS) break;
    }
  }
  return cards;
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

function getSpeechLanguage(): string {
  if (typeof navigator !== "undefined" && navigator.language) {
    return navigator.language;
  }
  return "fr-FR";
}

function getHistoryModules() {
  return [
    { key: "home", label: "Général", emoji: "✦" },
    { key: "immo", label: "Immobilier", emoji: "🏠" },
    { key: "jobs", label: "Emploi", emoji: "💼" },
    { key: "sante", label: "Santé", emoji: "🏥" },
    { key: "paiement", label: "Paiement", emoji: "💳" },
    { key: "transport", label: "Transport", emoji: "🚗" },
    { key: "agri", label: "Agriculture", emoji: "🌱" },
    { key: "evenements", label: "Événements", emoji: "🎉" },
    { key: "voyages", label: "Voyages", emoji: "✈️" },
  ];
}

function renderMessageContent(text: string): ReactNode {
  const lines = text.split("\n");
  return lines.map((line, lineIndex) => {
    const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return (
      <Text key={`line-${lineIndex}`}>
        {parts.map((part, partIndex) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <Text
                key={`p-${lineIndex}-${partIndex}`}
                style={{ fontWeight: "800" }}
              >
                {part.slice(2, -2)}
              </Text>
            );
          }
          if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
            return (
              <Text
                key={`p-${lineIndex}-${partIndex}`}
                style={{ fontStyle: "italic", opacity: 0.85 }}
              >
                {part.slice(1, -1)}
              </Text>
            );
          }
          return <Text key={`p-${lineIndex}-${partIndex}`}>{part}</Text>;
        })}
        {lineIndex < lines.length - 1 ? "\n" : ""}
      </Text>
    );
  });
}

/* ============================================================================
 * AMBIENT BACKGROUND
 * ========================================================================== */

function AmbientBackground() {
  const { width: W, height: H } = useWindowDimensions();
  const orbA = useRef(new Animated.Value(0)).current;
  const orbB = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (v: Animated.Value, to: number, dur: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, {
            toValue: to,
            duration: dur,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0,
            duration: dur,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    loop(orbA, -50, 9000);
    loop(orbB, 60, 11000);
  }, [orbA, orbB]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={["#0A0620", "#150A33", "#0C051E", "#17092F"]}
        locations={[0, 0.4, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      />
      <Animated.View
        style={[
          styles.orb,
          {
            width: Math.max(360, W * 0.9),
            height: Math.max(360, W * 0.9),
            top: -170,
            left: -140,
            backgroundColor: "rgba(139,92,246,0.42)",
            transform: [{ translateY: orbA }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          {
            width: 320,
            height: 320,
            bottom: H * 0.15 - 160,
            right: -130,
            backgroundColor: "rgba(99,102,241,0.35)",
            transform: [{ translateY: orbB }],
          },
        ]}
      />
    </View>
  );
}

/* ============================================================================
 * FADE UP WRAPPER
 * ========================================================================== */

function FadeUp({
  delay = 0,
  distance = 10,
  children,
}: {
  delay?: number;
  distance?: number;
  children: ReactNode;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 380,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [distance, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

/* ============================================================================
 * AI AVATAR — glow pulsé
 * ========================================================================== */

function AIAvatar({ size = 32 }: { size?: number }) {
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [glow]);

  const scale = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });

  return (
    <Animated.View
      style={[
        styles.aiAvatar,
        { width: size, height: size, transform: [{ scale }] },
      ]}
    >
      <LinearGradient
        colors={["#A78BFA", "#7C3AED", "#6366F1"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.aiAvatarGradient,
          { width: size, height: size, borderRadius: size / 3 },
        ]}
      >
        <Sparkles size={size * 0.42} color="#fff" strokeWidth={2.4} />
      </LinearGradient>
    </Animated.View>
  );
}

/* ============================================================================
 * THINKING INDICATOR
 * ========================================================================== */

function ThinkingIndicator() {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    dots.forEach((dot, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 140),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay((2 - i) * 140),
        ]),
      ).start();
    });
  }, [dots]);

  return (
    <FadeUp distance={8}>
      <View style={styles.thinkingRow}>
        <AIAvatar size={30} />
        <View style={styles.thinkingBubble}>
          <View style={styles.thinkingDots}>
            {dots.map((dot, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.thinkingDot,
                  {
                    opacity: dot.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.35, 1],
                    }),
                    transform: [
                      {
                        translateY: dot.interpolate({
                          inputRange: [0, 1],
                          outputRange: [2, -3],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))}
          </View>
          <Text style={styles.thinkingText}>Débrouille réfléchit…</Text>
        </View>
      </View>
    </FadeUp>
  );
}

/* ============================================================================
 * HISTORY MODAL
 * ========================================================================== */

function HistoryModal({
  onClose,
  onLoad,
}: {
  onClose: () => void;
  onLoad: (module: string) => void;
}) {
  const modules = getHistoryModules();

  return (
    <View style={StyleSheet.absoluteFill as any}>
      <LinearGradient
        colors={["#0A0620", "#150A33", "#0C051E"]}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          styles.historyHeader,
          { paddingTop: Platform.OS === "android" ? 40 : 50 },
        ]}
      >
        <View>
          <Text style={styles.historyEyebrow}>DÉBROUILLE AI</Text>
          <Text style={styles.historyTitle}>Tes conversations</Text>
        </View>
        <Pressable
          onPress={onClose}
          accessibilityLabel="Fermer l'historique"
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
        >
          <X size={16} color="rgba(255,255,255,0.65)" />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 10 }}>
          {modules.map((module) => {
            let messages: Message[] = [];
            if (isBrowser) {
              try {
                const raw = window.localStorage.getItem(
                  getStorageKey(module.key),
                );
                if (raw) {
                  const parsed = JSON.parse(raw);
                  if (Array.isArray(parsed)) messages = parsed;
                }
              } catch {
                messages = [];
              }
            }

            const userMessages = messages.filter((m) => m.role === "user");
            const lastMessage = messages[messages.length - 1];
            if (userMessages.length === 0) return null;

            return (
              <Pressable
                key={module.key}
                onPress={() => onLoad(module.key)}
                style={({ pressed }) => [
                  styles.historyRow,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.historyEmoji}>
                  <Text style={{ fontSize: 20 }}>{module.emoji}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Text style={styles.historyRowTitle} numberOfLines={1}>
                      {module.label}
                    </Text>
                    <View style={styles.historyCountBadge}>
                      <Text style={styles.historyCountText}>
                        {userMessages.length}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.historyRowPreview} numberOfLines={1}>
                    {lastMessage?.content ?? "Conversation"}
                  </Text>
                </View>
                <ArrowRight size={14} color="rgba(255,255,255,0.35)" />
              </Pressable>
            );
          })}
        </View>

        <View style={styles.historyFooter}>
          <History size={20} color="rgba(255,255,255,0.2)" />
          <Text style={styles.historyFooterText}>
            Ton historique est conservé localement sur cet appareil.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

/* ============================================================================
 * MESSAGE BUBBLE
 * ========================================================================== */

function MessageBubble({
  message,
  index,
  onCopy,
  copied,
  onAction,
}: {
  message: Message;
  index: number;
  onCopy: (m: Message) => void;
  copied: boolean;
  onAction: (page: string) => void;
}) {
  const isUser = message.role === "user";
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 380,
      delay: Math.min(index * 40, 240),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1],
  });

  return (
    <Animated.View
      style={[
        styles.messageRow,
        isUser ? styles.messageRowUser : styles.messageRowAssistant,
        { opacity: anim, transform: [{ translateY }, { scale }] },
      ]}
    >
      {!isUser ? <AIAvatar size={30} /> : null}

      <View style={{ maxWidth: "82%", gap: 8 }}>
        <View
          style={[
            styles.bubble,
            isUser ? styles.bubbleUser : styles.bubbleAssistant,
          ]}
        >
          {isUser ? (
            <View
              style={[styles.bubbleUserGlow, StyleSheet.absoluteFill as any]}
            />
          ) : null}
          <View style={styles.bubbleContent}>
            <Text style={styles.bubbleText}>
              {renderMessageContent(message.content)}
            </Text>
          </View>
          <View style={styles.bubbleFooter}>
            <Text style={styles.bubbleTime}>
              {formatTime(message.timestamp)}
            </Text>
            {!isUser ? (
              <Pressable
                onPress={() => onCopy(message)}
                accessibilityLabel="Copier la réponse"
                hitSlop={6}
                style={({ pressed }) => [
                  styles.copyBtn,
                  pressed && { opacity: 0.6 },
                ]}
              >
                {copied ? (
                  <>
                    <Check size={10} color="rgba(255,255,255,0.55)" />
                    <Text style={styles.copyBtnText}>Copié</Text>
                  </>
                ) : (
                  <>
                    <Copy size={10} color="rgba(255,255,255,0.45)" />
                    <Text style={styles.copyBtnText}>Copier</Text>
                  </>
                )}
              </Pressable>
            ) : null}
          </View>
        </View>

        {!isUser && message.actionCards && message.actionCards.length > 0 ? (
          <View style={styles.actionCardsRow}>
            {message.actionCards.map((card) => (
              <Pressable
                key={card.page}
                onPress={() => onAction(card.page)}
                style={({ pressed }) => [
                  styles.actionCard,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={{ fontSize: 12 }}>{card.emoji}</Text>
                <Text style={styles.actionCardText}>{card.label}</Text>
                <ArrowRight size={10} color="rgba(196,181,253,0.7)" />
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

/* ============================================================================
 * MAIN
 * ========================================================================== */

export default function AIAssistant({
  onClose,
  onNavigate,
  moduleContext = "home",
}: Props) {
  const [messages, setMessages] = useState<Message[]>(() =>
    loadHistory(moduleContext),
  );
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [inputHeight, setInputHeight] = useState(40);

  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const chatAction = useAction(api.ai.chat);

  const suggestions = useMemo(
    () => SUGGESTIONS_MAP[moduleContext] ?? SUGGESTIONS_MAP.home,
    [moduleContext],
  );
  const contextLabel = MODULE_LABELS[moduleContext] ?? moduleContext;
  const hasContextBadge = moduleContext !== "home";

  /* ──────── scroll ──────── */
  const scrollToBottom = useCallback((animated = true) => {
    scrollRef.current?.scrollToEnd({ animated });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => scrollToBottom(true), 60);
    return () => clearTimeout(t);
  }, [messages, isThinking, scrollToBottom]);

  const handleScroll = useCallback((e: NativeSyntheticEvent<any>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distanceFromBottom =
      contentSize.height - contentOffset.y - layoutMeasurement.height;
    setShowScrollButton(distanceFromBottom > 140);
  }, []);

  /* ──────── web keyboard shortcuts ──────── */
  useEffect(() => {
    if (!isBrowser) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  /* ──────── send ──────── */
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isThinking) return;

      const userMessage: Message = {
        id: createId("user"),
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");
      setInputHeight(40);
      setIsThinking(true);
      setShowSuggestions(false);
      saveHistory(updatedMessages, moduleContext);

      try {
        const contextMessages = updatedMessages
          .filter((m) => m.id !== "welcome")
          .slice(-MAX_CONTEXT_MESSAGES)
          .map((m) => ({ role: m.role, content: m.content }));

        const response = await chatAction({
          messages: contextMessages,
          moduleContext,
        });

        const reply =
          typeof response?.reply === "string" ? response.reply.trim() : "";

        if (!reply) throw new Error("L'IA n'a retourné aucune réponse.");

        const keywordCards = extractActionCards(reply);
        const contextualCards = ACTION_CARDS_MAP[moduleContext] ?? [];
        const combinedCards: ActionCard[] = [...keywordCards];

        for (const card of contextualCards) {
          if (!combinedCards.some((c) => c.page === card.page)) {
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
        saveHistory(finalMessages, moduleContext);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Impossible de contacter Débrouille AI.",
        );
      } finally {
        setIsThinking(false);
        setTimeout(() => inputRef.current?.focus(), 80);
      }
    },
    [chatAction, isThinking, messages, moduleContext],
  );

  /* ──────── voice ──────── */
  const toggleVoice = useCallback(() => {
    if (!isBrowser) {
      toast.error("La dictée vocale n'est disponible que sur le web.");
      return;
    }

    const w = window as typeof window & {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;

    if (!Ctor) {
      toast.error(
        "La reconnaissance vocale n'est pas disponible sur ce navigateur.",
      );
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      setIsListening(false);
      return;
    }

    const recognition = new Ctor();
    recognitionRef.current = recognition;
    recognition.lang = getSpeechLanguage();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (transcript.trim()) setInput(transcript.trim());
      setIsListening(false);
    };
    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
      toast.error("La reconnaissance vocale n'a pas pu démarrer.");
    };
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
      recognitionRef.current = null;
      toast.error("Impossible de démarrer le microphone.");
    }
  }, [isListening]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  /* ──────── history ──────── */
  const clearHistory = useCallback(() => {
    const fresh = [createWelcomeMessage(moduleContext)];
    setMessages(fresh);
    saveHistory(fresh, moduleContext);
    setShowSuggestions(true);
    toast.success("Nouvelle conversation.");
  }, [moduleContext]);

  /* ──────── copy ──────── */
  const copyMessage = useCallback(async (message: Message) => {
    try {
      await Clipboard.setString(message.content);
      setCopiedMessageId(message.id);
      setTimeout(() => setCopiedMessageId(null), 1800);
    } catch {
      toast.error("Impossible de copier ce message.");
    }
  }, []);

  /* ──────── navigation ──────── */
  const handleActionNavigation = useCallback(
    (page: string) => {
      onNavigate(page);
      onClose();
    },
    [onClose, onNavigate],
  );

  /* ========================================================================
   * RENDER
   * ====================================================================== */

  return (
    <View style={styles.root} accessibilityLabel="Débrouille AI">
      <AmbientBackground />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* HEADER */}
        <View
          style={[
            styles.header,
            { paddingTop: Platform.OS === "android" ? 40 : 50 },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              flex: 1,
              minWidth: 0,
            }}
          >
            <AIAvatar size={42} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Text style={styles.headerTitle} numberOfLines={1}>
                  Débrouille AI
                </Text>
                {hasContextBadge ? (
                  <View style={styles.contextBadge}>
                    <Text style={styles.contextBadgeText} numberOfLines={1}>
                      {contextLabel}
                    </Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.headerSubRow}>
                <Globe2 size={9} color="rgba(255,255,255,0.35)" />
                <Text style={styles.headerSub}>Assistant intelligent</Text>
                {isListening ? (
                  <Text style={styles.listeningLabel}>· Micro actif</Text>
                ) : null}
              </View>
            </View>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              onPress={() => setShowHistory(true)}
              accessibilityLabel="Ouvrir l'historique"
              style={({ pressed }) => [
                styles.iconBtn,
                pressed && styles.pressed,
              ]}
            >
              <History size={14} color="rgba(255,255,255,0.55)" />
            </Pressable>
            <Pressable
              onPress={clearHistory}
              accessibilityLabel="Nouvelle conversation"
              style={({ pressed }) => [
                styles.iconBtn,
                pressed && styles.pressed,
              ]}
            >
              <RotateCcw size={14} color="rgba(255,255,255,0.55)" />
            </Pressable>
            <Pressable
              onPress={onClose}
              accessibilityLabel="Fermer Débrouille AI"
              style={({ pressed }) => [
                styles.iconBtn,
                pressed && styles.pressed,
              ]}
            >
              <X size={16} color="rgba(255,255,255,0.75)" />
            </Pressable>
          </View>
        </View>

        {/* CONVERSATION */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={64}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.scrollInner}>
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                index={index}
                copied={copiedMessageId === message.id}
                onCopy={copyMessage}
                onAction={handleActionNavigation}
              />
            ))}

            {isThinking ? <ThinkingIndicator /> : null}

            <View style={{ height: 1 }} />
          </View>
        </ScrollView>

        {/* SCROLL BUTTON */}
        {showScrollButton ? (
          <FadeUp distance={8}>
            <Pressable
              onPress={() => scrollToBottom(true)}
              accessibilityLabel="Revenir aux derniers messages"
              style={({ pressed }) => [
                styles.scrollBtn,
                pressed && styles.pressed,
              ]}
            >
              <ChevronDown size={17} color="#fff" />
            </Pressable>
          </FadeUp>
        ) : null}

        {/* SUGGESTIONS */}
        {showSuggestions && !isThinking ? (
          <FadeUp>
            <View style={styles.suggestionsWrap}>
              <View style={styles.suggestionsHeader}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <Wand2 size={10} color="rgba(167,139,250,0.7)" />
                  <Text style={styles.suggestionsEyebrow}>SUGGESTIONS</Text>
                </View>
                <Pressable
                  onPress={() => setShowSuggestions(false)}
                  accessibilityLabel="Masquer les suggestions"
                  hitSlop={8}
                >
                  <ChevronUp size={12} color="rgba(255,255,255,0.35)" />
                </Pressable>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingRight: 8 }}
              >
                {suggestions.map((suggestion) => (
                  <Pressable
                    key={suggestion}
                    onPress={() => void sendMessage(suggestion)}
                    style={({ pressed }) => [
                      styles.suggestionChip,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.suggestionChipText}>{suggestion}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </FadeUp>
        ) : null}

        {/* INPUT */}
        <View
          style={[
            styles.inputWrapper,
            {
              paddingBottom: Platform.OS === "android" ? 14 : Math.max(14, 20),
            },
          ]}
        >
          <View style={styles.inputInner}>
            <View style={styles.inputBar}>
              <Pressable
                onPress={toggleVoice}
                accessibilityLabel={
                  isListening ? "Arrêter le microphone" : "Dicter un message"
                }
                style={({ pressed }) => [
                  styles.micBtn,
                  isListening && styles.micBtnActive,
                  pressed && styles.pressed,
                ]}
              >
                {isListening ? (
                  <MicOff size={15} color="#F87171" />
                ) : (
                  <Mic size={15} color="rgba(255,255,255,0.55)" />
                )}
              </Pressable>

              <TextInput
                ref={inputRef}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={() => void sendMessage(input)}
                onKeyPress={(
                  e: NativeSyntheticEvent<TextInputKeyPressEventData>,
                ) => {
                  if (e.nativeEvent.key === "Enter" && Platform.OS === "web") {
                    void sendMessage(input);
                  }
                }}
                onContentSizeChange={(e) => {
                  const h = Math.min(
                    Math.max(e.nativeEvent.contentSize.height, 40),
                    120,
                  );
                  setInputHeight(h);
                }}
                placeholder={
                  isListening ? "À l'écoute…" : "Parle à Débrouille AI…"
                }
                placeholderTextColor="rgba(255,255,255,0.35)"
                maxLength={4000}
                accessibilityLabel="Message à Débrouille AI"
                style={[styles.input, { height: inputHeight }]}
                multiline
                textAlignVertical="top"
              />

              <Pressable
                onPress={() => void sendMessage(input)}
                disabled={!input.trim() || isThinking}
                accessibilityLabel="Envoyer le message"
                style={({ pressed }) => [
                  styles.sendBtn,
                  input.trim() && !isThinking && styles.sendBtnActive,
                  pressed && styles.pressed,
                ]}
              >
                <LinearGradient
                  colors={
                    input.trim() && !isThinking
                      ? ["#A78BFA", "#7C3AED", "#6366F1"]
                      : ["#2A2540", "#1F1B33"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sendBtnGradient}
                >
                  <Send
                    size={15}
                    color={
                      input.trim() && !isThinking
                        ? "#fff"
                        : "rgba(255,255,255,0.35)"
                    }
                  />
                </LinearGradient>
              </Pressable>
            </View>

            <View style={styles.hintRow}>
              <Text style={styles.hintText}>Entrée pour envoyer</Text>
              <View style={styles.hintDot} />
              <Text style={styles.hintText}>Maj + Entrée = nouvelle ligne</Text>
              <View style={styles.hintDot} />
              <Text style={styles.hintText}>🎤 pour parler</Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* HISTORY OVERLAY */}
      {showHistory ? (
        <HistoryModal
          onClose={() => setShowHistory(false)}
          onLoad={(module) => {
            setMessages(loadHistory(module));
            setShowHistory(false);
            setShowSuggestions(true);
          }}
        />
      ) : null}
    </View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0A0620",
  },

  orb: {
    position: "absolute",
    borderRadius: 9999,
  },

  pressed: { opacity: 0.78 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.3,
  },
  headerSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 3,
  },
  headerSub: {
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
  },
  listeningLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#F87171",
  },
  contextBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(139,92,246,0.18)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.35)",
    maxWidth: 120,
  },
  contextBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#C4B5FD",
    letterSpacing: 0.2,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  // AI avatar
  aiAvatar: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.6,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  aiAvatarGradient: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 24,
  },
  scrollInner: {
    gap: 14,
    maxWidth: 780,
    width: "100%",
    alignSelf: "center",
  },

  // Message rows
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  messageRowUser: {
    justifyContent: "flex-end",
  },
  messageRowAssistant: {
    justifyContent: "flex-start",
  },

  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 22,
    overflow: "hidden",
  },
  bubbleUser: {
    backgroundColor: "#6366F1",
    borderBottomRightRadius: 6,
    shadowColor: "#6366F1",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  bubbleUserGlow: {
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  bubbleAssistant: {
    backgroundColor: "rgba(255,255,255,0.055)",
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  bubbleContent: {},
  bubbleText: {
    fontSize: 13.5,
    lineHeight: 22,
    color: "rgba(255,255,255,0.94)",
  },
  bubbleFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginTop: 6,
  },
  bubbleTime: {
    fontSize: 9,
    color: "rgba(255,255,255,0.35)",
    fontWeight: "600",
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  copyBtnText: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
  },

  // Action cards
  actionCardsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "rgba(139,92,246,0.15)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.35)",
  },
  actionCardText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#DDD6FE",
    letterSpacing: 0.2,
  },

  // Thinking
  thinkingRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  thinkingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 22,
    borderBottomLeftRadius: 6,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  thinkingDots: {
    flexDirection: "row",
    gap: 4,
  },
  thinkingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#A78BFA",
  },
  thinkingText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "600",
  },

  // Scroll button
  scrollBtn: {
    position: "absolute",
    right: 16,
    bottom: 180,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "rgba(139,92,246,0.35)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.5)",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    zIndex: 20,
  },

  // Suggestions
  suggestionsWrap: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 4,
    maxWidth: 780,
    width: "100%",
    alignSelf: "center",
  },
  suggestionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  suggestionsEyebrow: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.8,
    color: "rgba(255,255,255,0.35)",
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: "rgba(139,92,246,0.09)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
  },
  suggestionChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
  },

  // Input
  inputWrapper: {
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(10,6,32,0.7)",
  },
  inputInner: {
    maxWidth: 780,
    width: "100%",
    alignSelf: "center",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 6,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    shadowColor: "#6366F1",
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  micBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.055)",
  },
  micBtnActive: {
    backgroundColor: "rgba(239,68,68,0.2)",
  },
  input: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 4,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 13.5,
    lineHeight: 20,
    color: "#fff",
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  sendBtnActive: {
    shadowColor: "#6366F1",
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  sendBtnGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 10,
  },
  hintText: {
    fontSize: 9,
    color: "rgba(255,255,255,0.25)",
    fontWeight: "500",
  },
  hintDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  // History modal
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  historyEyebrow: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2,
    color: "rgba(167,139,250,0.8)",
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#fff",
    marginTop: 4,
    letterSpacing: -0.3,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  historyEmoji: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.14)",
  },
  historyRowTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
    flexShrink: 1,
  },
  historyRowPreview: {
    marginTop: 4,
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
  },
  historyCountBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  historyCountText: {
    fontSize: 9,
    fontWeight: "800",
    color: "rgba(255,255,255,0.5)",
  },
  historyFooter: {
    marginTop: 32,
    alignItems: "center",
    gap: 8,
  },
  historyFooterText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.3)",
    textAlign: "center",
  },
});
