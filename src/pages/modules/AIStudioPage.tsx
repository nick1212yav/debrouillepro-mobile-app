// src/pages/modules/AIStudioPage.tsx
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image as RNImage,
} from "react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  Copy,
  FileText,
  Image as ImageIcon,
  Languages,
  Loader2,
  Scan,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  User2,
  Wand2,
  Zap,
} from "lucide-react-native";
import { useAction, useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import { showToast as toast } from "@/lib/toast";
import { Clipboard } from "@react-native-clipboard/clipboard";

/* ════════════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════════════ */

type TabId =
  | "generate"
  | "tags"
  | "translate"
  | "moderate"
  | "personalize"
  | "image";

interface Tab {
  id: TabId;
  label: string;
  short: string;
  icon: React.ElementType;
  color: string;
  tagline: string;
}

interface Props {
  onBack: () => void;
}

/* ════════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ════════════════════════════════════════════════════════════════════════════ */

const T = {
  bg: "#07070C",
  card: "rgba(255,255,255,0.045)",
  cardUp: "rgba(255,255,255,0.075)",
  border: "rgba(255,255,255,0.08)",
  borderUp: "rgba(255,255,255,0.14)",
  text: "#FFFFFF",
  dim: "rgba(255,255,255,0.58)",
  faint: "rgba(255,255,255,0.32)",
  ghost: "rgba(255,255,255,0.16)",
  primary: "#8B5CF6",
} as const;

const TABS: Tab[] = [
  {
    id: "generate",
    label: "Générer du contenu",
    short: "Générer",
    icon: Wand2,
    color: "#8B5CF6",
    tagline: "Posts, annonces, offres — en 3 secondes",
  },
  {
    id: "tags",
    label: "Tags automatiques",
    short: "Tags",
    icon: Tag,
    color: "#F59E0B",
    tagline: "Extrait les meilleurs mots-clés",
  },
  {
    id: "translate",
    label: "Traduction intelligente",
    short: "Traduire",
    icon: Languages,
    color: "#3B82F6",
    tagline: "9 langues, contexte préservé",
  },
  {
    id: "moderate",
    label: "Modération de contenu",
    short: "Modérer",
    icon: ShieldCheck,
    color: "#10B981",
    tagline: "Détecte spam, haine et contenus risqués",
  },
  {
    id: "personalize",
    label: "Personnalisation",
    short: "Perso.",
    icon: Star,
    color: "#EC4899",
    tagline: "Recommandations sur mesure",
  },
  {
    id: "image",
    label: "Analyse d'image",
    short: "Image",
    icon: ImageIcon,
    color: "#F97316",
    tagline: "Description, OCR, vérification",
  },
];

const LANGUAGES = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "lingala", label: "Lingala", flag: "🇨🇩" },
  { code: "swahili", label: "Swahili", flag: "🇹🇿" },
  { code: "hausa", label: "Hausa", flag: "🇳🇬" },
  { code: "yoruba", label: "Yoruba", flag: "🇳🇬" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
];

const CONTENT_TYPES = [
  { value: "post", label: "Post réseau social" },
  { value: "job_description", label: "Offre d'emploi" },
  { value: "property_description", label: "Annonce immobilière" },
  { value: "product_description", label: "Description produit" },
  { value: "event_description", label: "Description d'événement" },
  { value: "bio", label: "Biographie pro" },
] as const;

const TONES = [
  { value: "casual", label: "Décontracté" },
  { value: "formel", label: "Formel" },
  { value: "persuasif", label: "Persuasif" },
  { value: "informatif", label: "Informatif" },
] as const;

const IMAGE_TASKS = [
  { value: "describe", label: "Décrire", icon: Sparkles },
  { value: "extract_text", label: "OCR", icon: FileText },
  { value: "property_info", label: "Immobilier", icon: Scan },
  { value: "product_info", label: "Produit", icon: Tag },
  { value: "id_verify", label: "Pièce d'identité", icon: ShieldCheck },
] as const;

const WIDTH = Dimensions.get("window").width;

/* ════════════════════════════════════════════════════════════════════════════
   PRIMITIVES
   ════════════════════════════════════════════════════════════════════════════ */

function Skeleton({
  style,
}: {
  style?: React.ComponentProps<typeof Animated.View>["style"];
}) {
  const opacity = useRef(new Animated.Value(0.28)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.65,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.28,
          duration: 850,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={[
        {
          backgroundColor: "rgba(255,255,255,0.06)",
          borderRadius: 12,
          opacity,
        },
        style,
      ]}
    />
  );
}

/* ─── Chips (remplace Picker) ──────────────────────────────────────────── */

function ChipRow<T extends string>({
  options,
  value,
  onChange,
  color,
  scrollable = true,
}: {
  options: readonly { value: T; label: string; flag?: string }[];
  value: T;
  onChange: (v: T) => void;
  color: string;
  scrollable?: boolean;
}) {
  const content = (
    <View
      style={{
        flexDirection: "row",
        gap: 7,
        flexWrap: scrollable ? "nowrap" : "wrap",
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: active
                  ? alpha(color, 0.16)
                  : "rgba(255,255,255,0.04)",
                borderColor: active ? alpha(color, 0.4) : T.border,
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              },
            ]}
          >
            {opt.flag && <Text style={{ fontSize: 12 }}>{opt.flag}</Text>}
            <Text
              style={{
                color: active ? color : T.dim,
                fontSize: 12,
                fontWeight: active ? "800" : "600",
              }}
            >
              {opt.label}
            </Text>
            {active && <Check size={11} color={color} />}
          </Pressable>
        );
      })}
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 8 }}
      >
        {content}
      </ScrollView>
    );
  }
  return content;
}

/* ─── Copy Button ──────────────────────────────────────────────────────── */

function CopyIconButton({
  text,
  label = "Copier",
}: {
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const copy = () => {
    Clipboard.setString(text);
    setCopied(true);
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.15,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
      }),
    ]).start();
    toast.success("Copié !");
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Pressable
      onPress={copy}
      hitSlop={10}
      style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.7 : 1 }]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {copied ? (
          <Check size={13} color="#4ADE80" />
        ) : (
          <Copy size={13} color={T.faint} />
        )}
      </Animated.View>
      <Text
        style={{
          color: copied ? "#4ADE80" : T.faint,
          fontSize: 10.5,
          fontWeight: "700",
        }}
      >
        {copied ? "Copié" : label}
      </Text>
    </Pressable>
  );
}

/* ─── Result Box ───────────────────────────────────────────────────────── */

function ResultBox({
  text,
  color,
  label,
}: {
  text: string;
  color: string;
  label?: string;
}) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.resultBox,
        {
          borderColor: alpha(color, 0.32),
          backgroundColor: alpha(color, 0.07),
          opacity,
        },
      ]}
    >
      <View style={styles.resultHead}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Sparkles size={11} color={color} />
          <Text
            style={{
              color,
              fontSize: 10.5,
              fontWeight: "900",
              letterSpacing: 0.5,
            }}
          >
            {label ?? "RÉSULTAT"}
          </Text>
        </View>
        <CopyIconButton text={text} />
      </View>
      <Text
        selectable
        style={{
          color: "rgba(255,255,255,0.9)",
          fontSize: 13.5,
          lineHeight: 20.5,
          marginTop: 10,
        }}
      >
        {text}
      </Text>
    </Animated.View>
  );
}

/* ─── Primary Button ───────────────────────────────────────────────────── */

function PrimaryButton({
  label,
  loadingLabel,
  onPress,
  loading,
  disabled,
  color,
  icon: Icon,
}: {
  label: string;
  loadingLabel: string;
  onPress: () => void;
  loading: boolean;
  disabled?: boolean;
  color: string;
  icon: React.ElementType;
}) {
  const { width } = Dimensions.get("window");
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      onPressIn={() =>
        Animated.spring(scale, {
          toValue: 0.97,
          useNativeDriver: true,
          speed: 30,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 30,
        }).start()
      }
      style={{ transform: [{ scale }] }}
    >
      <View
        style={[
          styles.primaryBtn,
          {
            backgroundColor: color,
            opacity: loading || disabled ? 0.5 : 1,
            shadowColor: color,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Icon size={16} color="#fff" />
        )}
        <Text style={styles.primaryBtnText}>
          {loading ? loadingLabel : label}
        </Text>
      </View>
    </Pressable>
  );
}

/* ─── Labels ───────────────────────────────────────────────────────────── */

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

/* ════════════════════════════════════════════════════════════════════════════
   PANELS
   ════════════════════════════════════════════════════════════════════════════ */

/* ─── GENERATE ─────────────────────────────────────────────────────────── */

function GeneratePanel() {
  const generateContent = useAction(api.ai.generateContent);
  const [contentType, setContentType] =
    useState<(typeof CONTENT_TYPES)[number]["value"]>("post");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<(typeof TONES)[number]["value"]>("casual");
  const [maxWords, setMaxWords] = useState("150");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!topic.trim()) return toast.error("Saisis un sujet");
    setLoading(true);
    try {
      const { content } = await generateContent({
        type: contentType,
        topic: topic.trim(),
        tone,
        maxWords: Number(maxWords) || 150,
      });
      setResult(content);
    } catch {
      toast.error("Erreur de génération");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ gap: 16 }}>
      <View>
        <FieldLabel>Type de contenu</FieldLabel>
        <ChipRow
          options={CONTENT_TYPES}
          value={contentType}
          onChange={setContentType}
          color="#8B5CF6"
        />
      </View>

      <View>
        <FieldLabel>Sujet / mots-clés</FieldLabel>
        <TextInput
          value={topic}
          onChangeText={setTopic}
          placeholder="Ex. Appartement 3 pièces à Kinshasa, vue fleuve, calme…"
          placeholderTextColor={T.faint}
          style={[styles.input, styles.inputMulti]}
          multiline
          textAlignVertical="top"
        />
        <Text style={styles.hint}>
          {topic.trim().length} caractère{topic.trim().length !== 1 ? "s" : ""}
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <FieldLabel>Ton</FieldLabel>
          <ChipRow
            options={TONES}
            value={tone}
            onChange={setTone}
            color="#8B5CF6"
          />
        </View>
      </View>

      <View>
        <FieldLabel>Nombre de mots (max)</FieldLabel>
        <TextInput
          value={maxWords}
          onChangeText={setMaxWords}
          keyboardType="numeric"
          placeholder="150"
          placeholderTextColor={T.faint}
          style={styles.input}
        />
      </View>

      <PrimaryButton
        label="Générer le contenu"
        loadingLabel="Génération en cours…"
        onPress={run}
        loading={loading}
        disabled={!topic.trim()}
        color="#8B5CF6"
        icon={Wand2}
      />

      {result ? <ResultBox text={result} color="#8B5CF6" /> : null}
    </View>
  );
}

/* ─── TAGS ─────────────────────────────────────────────────────────────── */

function TagsPanel() {
  const suggestTags = useAction(api.ai.suggestTags);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!content.trim()) return toast.error("Saisis du contenu");
    setLoading(true);
    try {
      const res = await suggestTags({
        content: content.trim(),
        category: category.trim() || undefined,
      });
      setTags(res.tags);
    } catch {
      toast.error("Erreur de suggestion");
    } finally {
      setLoading(false);
    }
  };

  const copyAll = () => {
    Clipboard.setString(tags.map((t) => `#${t}`).join(" "));
    toast.success("Tous les tags copiés");
  };

  return (
    <View style={{ gap: 16 }}>
      <View>
        <FieldLabel>Contenu à analyser</FieldLabel>
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Colle ton texte ici…"
          placeholderTextColor={T.faint}
          style={[styles.input, styles.inputMulti]}
          multiline
          textAlignVertical="top"
        />
      </View>

      <View>
        <FieldLabel>Catégorie (optionnel)</FieldLabel>
        <TextInput
          value={category}
          onChangeText={setCategory}
          placeholder="immobilier, emploi, événement…"
          placeholderTextColor={T.faint}
          style={styles.input}
        />
      </View>

      <PrimaryButton
        label="Suggérer des tags"
        loadingLabel="Analyse…"
        onPress={run}
        loading={loading}
        disabled={!content.trim()}
        color="#F59E0B"
        icon={Tag}
      />

      {tags.length > 0 && (
        <View style={styles.tagResultCard}>
          <View style={styles.tagResultHead}>
            <Text style={styles.tagResultTitle}>
              {tags.length} tag{tags.length > 1 ? "s" : ""} suggéré
              {tags.length > 1 ? "s" : ""}
            </Text>
            <Pressable onPress={copyAll} hitSlop={8}>
              <Text
                style={{ color: "#FCD34D", fontSize: 11, fontWeight: "800" }}
              >
                Tout copier
              </Text>
            </Pressable>
          </View>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 7,
              marginTop: 12,
            }}
          >
            {tags.map((tag) => (
              <View key={tag} style={styles.tagPill}>
                <Text style={styles.tagPillText}>#{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

/* ─── TRANSLATE ────────────────────────────────────────────────────────── */

function TranslatePanel() {
  const translateText = useAction(api.ai.translateText);
  const [text, setText] = useState("");
  const [targetLang, setTargetLang] = useState("en");
  const [result, setResult] = useState<{
    translated: string;
    detectedLanguage: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!text.trim()) return toast.error("Saisis du texte");
    setLoading(true);
    try {
      const res = await translateText({
        text: text.trim(),
        targetLanguage: targetLang,
      });
      setResult(res);
    } catch {
      toast.error("Erreur de traduction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ gap: 16 }}>
      <View>
        <FieldLabel>Texte source</FieldLabel>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Saisis le texte à traduire…"
          placeholderTextColor={T.faint}
          style={[styles.input, styles.inputMulti]}
          multiline
          textAlignVertical="top"
        />
      </View>

      <View>
        <FieldLabel>Langue cible</FieldLabel>
        <ChipRow
          options={LANGUAGES}
          value={targetLang}
          onChange={setTargetLang}
          color="#3B82F6"
        />
      </View>

      <PrimaryButton
        label="Traduire"
        loadingLabel="Traduction…"
        onPress={run}
        loading={loading}
        disabled={!text.trim()}
        color="#3B82F6"
        icon={Languages}
      />

      {result && (
        <View style={{ gap: 10 }}>
          <View style={styles.detectedBadge}>
            <Text style={styles.detectedBadgeText}>
              Détecté : {result.detectedLanguage}
            </Text>
            <ChevronRight size={11} color="#93C5FD" />
            <Text style={styles.detectedBadgeText}>
              {LANGUAGES.find((l) => l.code === targetLang)?.label ??
                targetLang}
            </Text>
          </View>
          <ResultBox
            text={result.translated}
            color="#3B82F6"
            label="TRADUCTION"
          />
        </View>
      )}
    </View>
  );
}

/* ─── MODERATE ─────────────────────────────────────────────────────────── */

const SEVERITY = {
  none: { color: "#10B981", label: "Aucune" },
  low: { color: "#F59E0B", label: "Faible" },
  medium: { color: "#F97316", label: "Moyen" },
  high: { color: "#EF4444", label: "Élevé" },
} as const;

const CONTEXTS = [
  { value: "post", label: "Publication" },
  { value: "comment", label: "Commentaire" },
  { value: "bio", label: "Bio" },
] as const;

function ModeratePanel() {
  const moderateText = useAction(api.ai.moderateText);
  const [text, setText] = useState("");
  const [context, setContext] =
    useState<(typeof CONTEXTS)[number]["value"]>("post");
  const [result, setResult] = useState<{
    safe: boolean;
    reason: string;
    severity: string;
    categories: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!text.trim()) return toast.error("Saisis du contenu");
    setLoading(true);
    try {
      const res = await moderateText({ text: text.trim(), context });
      setResult(res);
    } catch {
      toast.error("Erreur de modération");
    } finally {
      setLoading(false);
    }
  };

  const sev = result
    ? (SEVERITY[result.severity as keyof typeof SEVERITY] ?? SEVERITY.none)
    : SEVERITY.none;

  return (
    <View style={{ gap: 16 }}>
      <View>
        <FieldLabel>Contenu à analyser</FieldLabel>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Colle le texte à modérer…"
          placeholderTextColor={T.faint}
          style={[styles.input, styles.inputMulti]}
          multiline
          textAlignVertical="top"
        />
      </View>

      <View>
        <FieldLabel>Contexte</FieldLabel>
        <ChipRow
          options={CONTEXTS}
          value={context}
          onChange={setContext}
          color="#10B981"
          scrollable={false}
        />
      </View>

      <PrimaryButton
        label="Analyser le contenu"
        loadingLabel="Analyse…"
        onPress={run}
        loading={loading}
        disabled={!text.trim()}
        color="#10B981"
        icon={ShieldCheck}
      />

      {result && (
        <Animated.View
          style={[
            styles.modCard,
            {
              backgroundColor: result.safe
                ? alpha("#10B981", 0.07)
                : alpha("#EF4444", 0.07),
              borderColor: result.safe
                ? alpha("#10B981", 0.28)
                : alpha("#EF4444", 0.28),
            },
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={[
                styles.modIcon,
                {
                  backgroundColor: result.safe
                    ? alpha("#10B981", 0.16)
                    : alpha("#EF4444", 0.16),
                },
              ]}
            >
              {result.safe ? (
                <Check size={19} color="#34D399" />
              ) : (
                <AlertCircle size={19} color="#F87171" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: result.safe ? "#34D399" : "#F87171",
                  fontSize: 14.5,
                  fontWeight: "800",
                }}
              >
                {result.safe ? "Contenu conforme" : "Contenu à risque"}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 4,
                }}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: sev.color,
                  }}
                />
                <Text
                  style={{ color: T.dim, fontSize: 11.5, fontWeight: "600" }}
                >
                  Sévérité :{" "}
                  <Text style={{ color: sev.color, fontWeight: "800" }}>
                    {sev.label}
                  </Text>
                </Text>
              </View>
            </View>
          </View>

          {!!result.reason && (
            <Text style={styles.modReason}>{result.reason}</Text>
          )}

          {result.categories.length > 0 && (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 6,
                marginTop: 12,
              }}
            >
              {result.categories.map((c) => (
                <View key={c} style={styles.categoryPill}>
                  <Text style={styles.categoryPillText}>{c}</Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
}

/* ─── PERSONALIZE ──────────────────────────────────────────────────────── */

const AVAILABLE_MODULES = [
  "immo",
  "jobs",
  "transport",
  "sante",
  "paiement",
  "marketplace",
  "agri",
  "community",
  "evenements",
  "voyages",
  "apprendre",
  "fitness",
  "media",
];

function PersonalizePanel() {
  const aiPersonalize = useAction(api.ai.aiPersonalize);
  const { isAuthenticated } = useConvexAuth();
  const savedPrefs = useQuery(
    api.aiPreferences.getMyPreferences,
    isAuthenticated ? {} : "skip",
  );
  const savePreferences = useMutation(api.aiPreferences.savePreferences);

  const [interests, setInterests] = useState("");
  const [city, setCity] = useState("");
  const [activity, setActivity] = useState("");
  const [result, setResult] = useState<{
    recommendedModules: string[];
    recommendedTags: string[];
    welcomeMessage: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (savedPrefs && !interests) {
      setInterests(savedPrefs.interests.join(", "));
      setCity(savedPrefs.city ?? "");
      if (
        savedPrefs.recommendedModules ||
        savedPrefs.recommendedTags ||
        savedPrefs.welcomeMessage
      ) {
        setResult({
          recommendedModules: savedPrefs.recommendedModules ?? [],
          recommendedTags: savedPrefs.recommendedTags ?? [],
          welcomeMessage: savedPrefs.welcomeMessage ?? "",
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedPrefs]);

  const run = async () => {
    setLoading(true);
    try {
      const interestList = interests
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await aiPersonalize({
        userInterests: interestList,
        userCity: city.trim() || undefined,
        recentActivity: activity
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        availableModules: AVAILABLE_MODULES,
      });
      setResult(res);

      if (isAuthenticated) {
        await savePreferences({
          interests: interestList,
          city: city.trim() || undefined,
          recommendedModules: res.recommendedModules,
          recommendedTags: res.recommendedTags,
          welcomeMessage: res.welcomeMessage,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2600);
      }
    } catch {
      toast.error("Erreur de personnalisation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ gap: 16 }}>
      <View>
        <FieldLabel>Intérêts (séparés par virgule)</FieldLabel>
        <TextInput
          value={interests}
          onChangeText={setInterests}
          placeholder="immobilier, emploi, agriculture…"
          placeholderTextColor={T.faint}
          style={styles.input}
        />
      </View>

      <View>
        <FieldLabel>Ville</FieldLabel>
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="Kinshasa, Brazzaville…"
          placeholderTextColor={T.faint}
          style={styles.input}
        />
      </View>

      <View>
        <FieldLabel>Activité récente</FieldLabel>
        <TextInput
          value={activity}
          onChangeText={setActivity}
          placeholder="jobs, immo, marketplace…"
          placeholderTextColor={T.faint}
          style={styles.input}
        />
      </View>

      <PrimaryButton
        label={
          saved ? "Préférences sauvegardées !" : "Obtenir mes recommandations"
        }
        loadingLabel="Personnalisation…"
        onPress={run}
        loading={loading}
        color="#EC4899"
        icon={saved ? Check : Star}
      />

      {result && (
        <View style={{ gap: 10 }}>
          {!!result.welcomeMessage && (
            <View
              style={[
                styles.personalCard,
                {
                  borderColor: alpha("#EC4899", 0.28),
                  backgroundColor: alpha("#EC4899", 0.07),
                },
              ]}
            >
              <Text style={styles.personalCardLabel}>MESSAGE PERSONNEL</Text>
              <Text style={styles.personalCardText}>
                {result.welcomeMessage}
              </Text>
            </View>
          )}

          {result.recommendedModules.length > 0 && (
            <View
              style={[
                styles.personalCard,
                {
                  borderColor: alpha("#8B5CF6", 0.28),
                  backgroundColor: alpha("#8B5CF6", 0.06),
                },
              ]}
            >
              <Text style={styles.personalCardLabel}>MODULES RECOMMANDÉS</Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 6,
                  marginTop: 10,
                }}
              >
                {result.recommendedModules.map((m) => (
                  <View
                    key={m}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: alpha("#8B5CF6", 0.16),
                        borderColor: alpha("#8B5CF6", 0.32),
                      },
                    ]}
                  >
                    <Text style={[styles.pillText, { color: "#C4B5FD" }]}>
                      {m}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {result.recommendedTags.length > 0 && (
            <View
              style={[
                styles.personalCard,
                {
                  borderColor: alpha("#F59E0B", 0.28),
                  backgroundColor: alpha("#F59E0B", 0.06),
                },
              ]}
            >
              <Text style={styles.personalCardLabel}>TAGS D'INTÉRÊT</Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 6,
                  marginTop: 10,
                }}
              >
                {result.recommendedTags.map((t) => (
                  <View
                    key={t}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: alpha("#F59E0B", 0.14),
                        borderColor: alpha("#F59E0B", 0.3),
                      },
                    ]}
                  >
                    <Text style={[styles.pillText, { color: "#FCD34D" }]}>
                      #{t}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

/* ─── IMAGE ────────────────────────────────────────────────────────────── */

function ImagePanel() {
  const analyzeImage = useAction(api.ai.analyzeImage);
  const [imageUrl, setImageUrl] = useState("");
  const [task, setTask] =
    useState<(typeof IMAGE_TASKS)[number]["value"]>("describe");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [imageUrl]);

  const run = async () => {
    if (!imageUrl.trim()) return toast.error("Saisis une URL d'image");
    setLoading(true);
    try {
      const res = await analyzeImage({ imageUrl: imageUrl.trim(), task });
      setResult(res.result);
    } catch {
      toast.error("Erreur d'analyse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ gap: 16 }}>
      <View>
        <FieldLabel>URL de l'image</FieldLabel>
        <TextInput
          value={imageUrl}
          onChangeText={setImageUrl}
          placeholder="https://…"
          placeholderTextColor={T.faint}
          style={styles.input}
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {!!imageUrl && !imgError && (
        <RNImage
          source={{ uri: imageUrl }}
          onError={() => setImgError(true)}
          style={styles.imagePreview}
          resizeMode="cover"
        />
      )}

      {imgError && (
        <View style={styles.imageError}>
          <AlertCircle size={16} color="#F87171" />
          <Text
            style={{
              color: "#F87171",
              fontSize: 12,
              fontWeight: "600",
              flex: 1,
            }}
          >
            Impossible de charger l'image
          </Text>
        </View>
      )}

      <View>
        <FieldLabel>Type d'analyse</FieldLabel>
        <View style={{ gap: 7 }}>
          {IMAGE_TASKS.map((t) => {
            const active = task === t.value;
            const Icon = t.icon;
            return (
              <Pressable
                key={t.value}
                onPress={() => setTask(t.value)}
                style={({ pressed }) => [
                  styles.taskRow,
                  {
                    backgroundColor: active
                      ? alpha("#F97316", 0.14)
                      : "rgba(255,255,255,0.03)",
                    borderColor: active ? alpha("#F97316", 0.36) : T.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Icon size={14} color={active ? "#FB923C" : T.faint} />
                <Text
                  style={{
                    flex: 1,
                    color: active ? "#FB923C" : T.dim,
                    fontSize: 13,
                    fontWeight: active ? "800" : "600",
                  }}
                >
                  {t.label}
                </Text>
                {active && <Check size={13} color="#FB923C" />}
              </Pressable>
            );
          })}
        </View>
      </View>

      <PrimaryButton
        label="Analyser l'image"
        loadingLabel="Analyse…"
        onPress={run}
        loading={loading}
        disabled={!imageUrl.trim() || imgError}
        color="#F97316"
        icon={ImageIcon}
      />

      {!!result && <ResultBox text={result} color="#F97316" label="ANALYSE" />}
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════════════════════════════ */

export default function AIStudioPage({ onBack }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("generate");
  const activeTabData = useMemo(
    () => TABS.find((t) => t.id === activeTab)!,
    [activeTab],
  );
  const ActiveIcon = activeTabData.icon;

  // Animation d'entrée de panneau
  const panelOpacity = useRef(new Animated.Value(1)).current;
  const panelTranslate = useRef(new Animated.Value(0)).current;

  const handleTabChange = (id: TabId) => {
    if (id === activeTab) return;
    Animated.parallel([
      Animated.timing(panelOpacity, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(panelTranslate, {
        toValue: 8,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setActiveTab(id);
      Animated.parallel([
        Animated.timing(panelOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(panelTranslate, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const renderPanel = () => {
    switch (activeTab) {
      case "generate":
        return <GeneratePanel />;
      case "tags":
        return <TagsPanel />;
      case "translate":
        return <TranslatePanel />;
      case "moderate":
        return <ModeratePanel />;
      case "personalize":
        return <PersonalizePanel />;
      case "image":
        return <ImagePanel />;
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <View pointerEvents="none" style={styles.glow} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.backBtn,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <ArrowLeft size={18} color="#fff" />
          </Pressable>

          <View style={{ flex: 1 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Text style={styles.title}>IA Studio</Text>
              <View style={styles.betaPill}>
                <Text style={styles.betaText}>BETA</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>
              6 outils intelligents à portée de main
            </Text>
          </View>

          <View style={styles.powerPill}>
            <Zap size={11} color="#C4B5FD" />
            <Text style={styles.powerText}>GPT‑5 mini</Text>
          </View>
        </View>

        {/* Tabs horizontales */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            gap: 8,
            paddingVertical: 14,
            paddingRight: 20,
          }}
          style={{ marginHorizontal: -20, paddingHorizontal: 20 }}
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => handleTabChange(tab.id)}
                style={({ pressed }) => [
                  styles.tabPill,
                  active && {
                    backgroundColor: alpha(tab.color, 0.16),
                    borderColor: alpha(tab.color, 0.4),
                  },
                  { opacity: pressed ? 0.82 : 1 },
                ]}
              >
                <Icon size={13} color={active ? tab.color : T.faint} />
                <Text
                  style={[
                    styles.tabPillText,
                    active && { color: tab.color, fontWeight: "800" },
                  ]}
                >
                  {tab.short}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Contenu */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: panelOpacity,
            transform: [{ translateY: panelTranslate }],
          }}
        >
          {/* Bandeau de contexte du panneau */}
          <View
            style={[
              styles.panelBanner,
              {
                backgroundColor: alpha(activeTabData.color, 0.08),
                borderColor: alpha(activeTabData.color, 0.22),
              },
            ]}
          >
            <View
              style={[
                styles.panelBannerIcon,
                { backgroundColor: alpha(activeTabData.color, 0.18) },
              ]}
            >
              <ActiveIcon size={16} color={activeTabData.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.panelBannerTitle}>{activeTabData.label}</Text>
              <Text style={styles.panelBannerTagline}>
                {activeTabData.tagline}
              </Text>
            </View>
          </View>

          {renderPanel()}
        </Animated.View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Clock size={10} color={T.ghost} />
        <Text style={styles.footerText}>
          Résultats générés par IA — vérifie avant publication
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════════════════════ */

function alpha(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/* ════════════════════════════════════════════════════════════════════════════
   STYLES
   ════════════════════════════════════════════════════════════════════════════ */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },

  glow: {
    position: "absolute",
    top: -160,
    left: -80,
    right: -80,
    height: 340,
    borderRadius: 220,
    backgroundColor: "rgba(139,92,246,0.14)",
  },

  /* Header */
  header: { paddingTop: 56, paddingHorizontal: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: T.border,
  },
  title: {
    color: T.text,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: { color: T.faint, fontSize: 11.5, marginTop: 2 },
  betaPill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 999,
    backgroundColor: T.primary,
  },
  betaText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  powerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: "rgba(139,92,246,0.14)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.28)",
  },
  powerText: { color: "#C4B5FD", fontSize: 10, fontWeight: "800" },

  /* Tabs */
  tabPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: T.border,
  },
  tabPillText: { color: T.faint, fontSize: 12, fontWeight: "600" },

  /* Content */
  content: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 6 },

  /* Panel banner */
  panelBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  panelBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  panelBannerTitle: {
    color: T.text,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  panelBannerTagline: { color: T.faint, fontSize: 11.5, marginTop: 2 },

  /* Field label */
  fieldLabel: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  hint: { color: T.ghost, fontSize: 10.5, marginTop: 6, fontWeight: "600" },

  /* Input */
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: T.text,
    fontSize: 13.5,
  },
  inputMulti: { minHeight: 100, paddingTop: 12 },

  /* Chip */
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 13,
    borderWidth: 1,
  },

  /* Primary button */
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 18,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  primaryBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },

  /* Result */
  resultBox: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  resultHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  /* Tags result */
  tagResultCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: alpha("#F59E0B", 0.07),
    borderWidth: 1,
    borderColor: alpha("#F59E0B", 0.26),
  },
  tagResultHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tagResultTitle: {
    color: "#FCD34D",
    fontSize: 11.5,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  tagPill: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: alpha("#F59E0B", 0.14),
    borderWidth: 1,
    borderColor: alpha("#F59E0B", 0.3),
  },
  tagPillText: { color: "#FCD34D", fontSize: 11.5, fontWeight: "800" },

  /* Translate detected badge */
  detectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: alpha("#3B82F6", 0.14),
    borderWidth: 1,
    borderColor: alpha("#3B82F6", 0.28),
  },
  detectedBadgeText: { color: "#93C5FD", fontSize: 10.5, fontWeight: "800" },

  /* Moderation */
  modCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  modIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  modReason: {
    color: T.dim,
    fontSize: 12,
    marginTop: 12,
    lineHeight: 18,
  },
  categoryPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: alpha("#EF4444", 0.12),
    borderWidth: 1,
    borderColor: alpha("#EF4444", 0.28),
  },
  categoryPillText: { color: "#FCA5A5", fontSize: 10, fontWeight: "800" },

  /* Personalize cards */
  personalCard: {
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
  },
  personalCardLabel: {
    color: T.faint,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  personalCardText: {
    color: T.text,
    fontSize: 13.5,
    fontWeight: "700",
    marginTop: 8,
    lineHeight: 19,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: { fontSize: 11, fontWeight: "800" },

  /* Image */
  imagePreview: {
    width: "100%",
    height: WIDTH * 0.55,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  imageError: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: alpha("#EF4444", 0.08),
    borderWidth: 1,
    borderColor: alpha("#EF4444", 0.28),
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },

  /* Footer */
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  footerText: {
    color: T.ghost,
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
});
