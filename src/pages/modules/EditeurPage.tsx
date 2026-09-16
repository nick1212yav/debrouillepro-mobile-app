// src/pages/modules/EditeurPage.tsx
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlignLeft,
  ArrowLeft,
  Bold,
  BookOpen,
  CheckCircle2,
  Clock,
  Cloud,
  Eye,
  EyeOff,
  FileText,
  Hash,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Megaphone,
  MessageSquare,
  Quote,
  Save,
  ShoppingBag,
  Sparkles,
  Star,
  Trash2,
  Type,
  Underline,
  X,
} from "lucide-react-native";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import { toast } from "sonner";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

/* ════════════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════════════ */

interface Props {
  onBack: () => void;
}

type TemplateId =
  | "annonce"
  | "promo"
  | "temoignage"
  | "article"
  | "evenement"
  | "offre";

type Draft = {
  id: string;
  convexId?: Id<"contentDrafts">;
  title: string;
  markdown: string;
  savedAt: string;
};

type Template = {
  id: TemplateId;
  label: string;
  icon: React.ElementType;
  color: string;
  description: string;
  markdown: string;
};

type FormatAction =
  | { type: "wrap"; before: string; after: string }
  | { type: "line"; prefix: string };

/* ════════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ════════════════════════════════════════════════════════════════════════════ */

const T = {
  bg: "#07070C",
  sheet: "#0E0E14",
  card: "rgba(255,255,255,0.045)",
  cardUp: "rgba(255,255,255,0.075)",
  border: "rgba(255,255,255,0.08)",
  borderUp: "rgba(255,255,255,0.14)",
  text: "#FFFFFF",
  dim: "rgba(255,255,255,0.58)",
  faint: "rgba(255,255,255,0.32)",
  ghost: "rgba(255,255,255,0.18)",
  primary: "#A78BFA",
  primarySoft: "#C4B5FD",
  success: "#10B981",
  amber: "#F59E0B",
  amberSoft: "#FCD34D",
  danger: "#EF4444",
  cyan: "#22D3EE",
} as const;

const SCREEN_W = Dimensions.get("window").width;

/* ════════════════════════════════════════════════════════════════════════════
   TEMPLATES (markdown)
   ════════════════════════════════════════════════════════════════════════════ */

const TEMPLATES: Template[] = [
  {
    id: "annonce",
    label: "Annonce",
    icon: Megaphone,
    color: "#3B82F6",
    description: "Partage une nouvelle importante",
    markdown: `# 📢 Grande annonce !

Chers amis et abonnés,

Nous sommes ravis de vous annoncer que **[Votre annonce ici]**.

Cette nouvelle marque une étape importante pour nous et nous espérons que vous serez aussi enthousiastes que nous !

> « [Votre citation inspirante] »

Pour plus d'informations, n'hésitez pas à nous contacter.`,
  },
  {
    id: "promo",
    label: "Promotion",
    icon: ShoppingBag,
    color: "#F97316",
    description: "Mets en avant une offre spéciale",
    markdown: `# 🔥 Offre spéciale limitée !

**Ne manquez pas cette opportunité unique !**

## Ce que vous obtenez :

- ✅ [Avantage 1]
- ✅ [Avantage 2]
- ✅ [Avantage 3]

Valable jusqu'au **[date]**. Quantité limitée !

*Utilisez le code : **PROMO2024***`,
  },
  {
    id: "temoignage",
    label: "Témoignage",
    icon: Star,
    color: "#F59E0B",
    description: "Partage un avis client",
    markdown: `## ⭐ Témoignage client

> « [Le témoignage du client ici — décris l'expérience positive en détail pour plus d'impact.] »

**— [Nom du client]**, [Ville/Pays]

Résultat obtenu : **[Résultat concret]** en seulement **[durée]** !

Vous aussi, rejoignez nos clients satisfaits 👇`,
  },
  {
    id: "article",
    label: "Article",
    icon: BookOpen,
    color: "#8B5CF6",
    description: "Rédige un article de blog",
    markdown: `# [Titre accrocheur de votre article]

*Par [Auteur] · [Date] · [Temps de lecture] min*

## Introduction

[Introduis ton sujet de manière captivante. Pose une question ou partage une statistique surprenante.]

## Développement

[Corps de ton article. Développe tes idées avec des exemples concrets et des données.]

- [Point clé 1]
- [Point clé 2]
- [Point clé 3]

## Conclusion

[Résume les points clés et invite tes lecteurs à réagir.]`,
  },
  {
    id: "evenement",
    label: "Événement",
    icon: Hash,
    color: "#EC4899",
    description: "Annonce un événement",
    markdown: `# 🎉 [Nom de l'événement]

**📅 Date :** [Jour, DD Mois YYYY]
**🕐 Heure :** [HH:MM]
**📍 Lieu :** [Adresse complète]

## Au programme

- 🎤 [Activité 1]
- 🎵 [Activité 2]
- 🍽️ [Activité 3]

Entrée : **[Gratuite / XX FCFA]**

Réservez votre place maintenant !`,
  },
  {
    id: "offre",
    label: "Offre d'emploi",
    icon: MessageSquare,
    color: "#10B981",
    description: "Publie une offre de recrutement",
    markdown: `# 🚀 Nous recrutons : [Poste]

**[Nom de l'entreprise]** recherche un(e) **[Poste]** passionné(e) pour rejoindre notre équipe.

## Missions

- [Mission 1]
- [Mission 2]
- [Mission 3]

## Profil recherché

- [Compétence / Expérience requise]
- [Qualité personnelle]

**Rémunération :** [XX XXX FCFA / mois]

Envoyez votre CV à : **[email]**`,
  },
];

const DRAFTS_KEY = "@debrouille/editeur_drafts_v1";

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

function readabilityScore(text: string): {
  score: number;
  label: string;
  color: string;
} {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const sentences = (text.match(/[.!?]+/g) ?? []).length || 1;
  const avg = words / sentences;
  if (avg < 15) return { score: 95, label: "Très lisible", color: "#10B981" };
  if (avg < 20) return { score: 78, label: "Lisible", color: "#3B82F6" };
  if (avg < 25) return { score: 55, label: "Moyen", color: "#F59E0B" };
  return { score: 30, label: "Difficile", color: "#EF4444" };
}

async function loadLocalDrafts(): Promise<Draft[]> {
  try {
    const raw = await AsyncStorage.getItem(DRAFTS_KEY);
    return raw ? (JSON.parse(raw) as Draft[]) : [];
  } catch {
    return [];
  }
}

async function saveLocalDrafts(drafts: Draft[]): Promise<void> {
  try {
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  } catch {
    /* silencieux */
  }
}

function mergeDrafts(local: Draft[], cloud: Draft[], isAuth: boolean): Draft[] {
  if (!isAuth || cloud.length === 0) return local;
  const map = new Map<string, Draft>();
  for (const d of cloud) map.set(d.title, d);
  for (const d of local) if (!map.has(d.title)) map.set(d.title, d);
  return Array.from(map.values())
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    .slice(0, 20);
}

/* ════════════════════════════════════════════════════════════════════════════
   MARKDOWN PARSER (minimal, preview only)
   ════════════════════════════════════════════════════════════════════════════ */

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    const key = `${keyPrefix}-${i++}`;
    if (token.startsWith("**")) {
      nodes.push(
        <Text key={key} style={{ fontWeight: "900" }}>
          {token.slice(2, -2)}
        </Text>,
      );
    } else if (token.startsWith("__")) {
      nodes.push(
        <Text key={key} style={{ textDecorationLine: "underline" }}>
          {token.slice(2, -2)}
        </Text>,
      );
    } else if (token.startsWith("*")) {
      nodes.push(
        <Text key={key} style={{ fontStyle: "italic" }}>
          {token.slice(1, -1)}
        </Text>,
      );
    }
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

function MarkdownPreview({ markdown }: { markdown: string }) {
  const blocks = useMemo(() => {
    const lines = markdown.split("\n");
    const out: { type: string; content: string; index: number }[] = [];
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (trimmed.startsWith("# "))
        out.push({ type: "h1", content: trimmed.slice(2), index });
      else if (trimmed.startsWith("## "))
        out.push({ type: "h2", content: trimmed.slice(3), index });
      else if (trimmed.startsWith("> "))
        out.push({ type: "quote", content: trimmed.slice(2), index });
      else if (trimmed.startsWith("- "))
        out.push({ type: "bullet", content: trimmed.slice(2), index });
      else if (/^\d+\.\s/.test(trimmed))
        out.push({
          type: "number",
          content: trimmed.replace(/^\d+\.\s/, ""),
          index,
        });
      else out.push({ type: "p", content: trimmed, index });
    });
    return out;
  }, [markdown]);

  if (blocks.length === 0) {
    return (
      <View style={styles.previewEmpty}>
        <Eye size={28} color={T.faint} />
        <Text style={styles.previewEmptyText}>
          Rien à prévisualiser. Commence à écrire !
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      {blocks.map((b) => {
        const key = `${b.type}-${b.index}`;
        if (b.type === "h1") {
          return (
            <Text key={key} style={styles.previewH1}>
              {renderInline(b.content, key)}
            </Text>
          );
        }
        if (b.type === "h2") {
          return (
            <Text key={key} style={styles.previewH2}>
              {renderInline(b.content, key)}
            </Text>
          );
        }
        if (b.type === "quote") {
          return (
            <View key={key} style={styles.previewQuote}>
              <Text style={styles.previewQuoteText}>
                {renderInline(b.content, key)}
              </Text>
            </View>
          );
        }
        if (b.type === "bullet") {
          return (
            <View key={key} style={styles.previewListRow}>
              <Text style={styles.previewBullet}>•</Text>
              <Text style={styles.previewListItem}>
                {renderInline(b.content, key)}
              </Text>
            </View>
          );
        }
        if (b.type === "number") {
          return (
            <View key={key} style={styles.previewListRow}>
              <Text style={styles.previewBullet}>·</Text>
              <Text style={styles.previewListItem}>
                {renderInline(b.content, key)}
              </Text>
            </View>
          );
        }
        return (
          <Text key={key} style={styles.previewP}>
            {renderInline(b.content, key)}
          </Text>
        );
      })}
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TOOLBAR BUTTON
   ════════════════════════════════════════════════════════════════════════════ */

function ToolBtn({
  icon: Icon,
  onPress,
  active,
  label,
}: {
  icon: React.ElementType;
  onPress: () => void;
  active?: boolean;
  label: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.88,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
      }),
    ]).start();
    onPress();
  };

  return (
    <Pressable onPress={handlePress} hitSlop={6} accessibilityLabel={label}>
      <Animated.View
        style={[
          styles.toolBtn,
          active && styles.toolBtnActive,
          { transform: [{ scale }] },
        ]}
      >
        <Icon size={15} color={active ? "#0E0E14" : T.dim} strokeWidth={2.2} />
      </Animated.View>
    </Pressable>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TEMPLATE PICKER MODAL
   ════════════════════════════════════════════════════════════════════════════ */

function TemplatePickerModal({
  visible,
  onClose,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (t: Template) => void;
}) {
  const slide = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 0 : 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [
                {
                  translateY: slide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 700],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderIcon}>
              <Sparkles size={16} color={T.primarySoft} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>Templates</Text>
              <Text style={styles.sheetSubtitle}>
                Démarre ton contenu en un tap
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.sheetCloseBtn}>
              <X size={16} color="#fff" />
            </Pressable>
          </View>

          <ScrollView
            style={{ maxHeight: 460 }}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: 20,
              gap: 10,
            }}
            showsVerticalScrollIndicator={false}
          >
            {TEMPLATES.map((t) => {
              const Icon = t.icon;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => onPick(t)}
                  style={({ pressed }) => [
                    styles.templateRow,
                    {
                      borderColor: alpha(t.color, 0.24),
                      backgroundColor: alpha(t.color, 0.06),
                      opacity: pressed ? 0.85 : 1,
                      transform: [{ scale: pressed ? 0.985 : 1 }],
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.templateIcon,
                      { backgroundColor: alpha(t.color, 0.18) },
                    ]}
                  >
                    <Icon size={18} color={t.color} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.templateLabel}>{t.label}</Text>
                    <Text style={styles.templateDesc}>{t.description}</Text>
                  </View>
                  <Text style={[styles.templateCta, { color: t.color }]}>
                    Utiliser
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   DRAFTS MODAL
   ════════════════════════════════════════════════════════════════════════════ */

function DraftsModal({
  visible,
  drafts,
  isAuthenticated,
  onClose,
  onLoad,
  onDelete,
}: {
  visible: boolean;
  drafts: Draft[];
  isAuthenticated: boolean;
  onClose: () => void;
  onLoad: (d: Draft) => void;
  onDelete: (d: Draft) => void;
}) {
  const slide = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 0 : 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [
                {
                  translateY: slide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 700],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderIcon}>
              <Clock size={16} color={T.primarySoft} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>Brouillons</Text>
              <Text style={styles.sheetSubtitle}>
                {drafts.length} sauvegarde{drafts.length > 1 ? "s" : ""}
                {isAuthenticated ? " · synchronisés" : ""}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.sheetCloseBtn}>
              <X size={16} color="#fff" />
            </Pressable>
          </View>

          <ScrollView
            style={{ maxHeight: 460 }}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: 20,
              gap: 10,
            }}
            showsVerticalScrollIndicator={false}
          >
            {drafts.length === 0 ? (
              <View style={styles.draftsEmpty}>
                <FileText size={26} color={T.faint} />
                <Text style={styles.draftsEmptyText}>
                  Aucun brouillon sauvegardé
                </Text>
              </View>
            ) : (
              drafts.map((d) => (
                <Pressable
                  key={d.id}
                  onPress={() => onLoad(d)}
                  style={({ pressed }) => [
                    styles.draftRow,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <View style={styles.draftIcon}>
                    <FileText size={15} color={T.dim} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={styles.draftTitleRow}>
                      <Text numberOfLines={1} style={styles.draftTitle}>
                        {d.title || "Sans titre"}
                      </Text>
                      {d.convexId && <Cloud size={11} color="#60A5FA" />}
                    </View>
                    <Text style={styles.draftDate}>
                      {new Date(d.savedAt).toLocaleString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation?.();
                      onDelete(d);
                    }}
                    hitSlop={10}
                    style={styles.draftDeleteBtn}
                  >
                    <Trash2 size={14} color={T.faint} />
                  </Pressable>
                </Pressable>
              ))
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════════════ */

export default function EditeurPage({ onBack }: Props) {
  const [title, setTitle] = useState("Mon contenu");
  const [markdown, setMarkdown] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [localDrafts, setLocalDrafts] = useState<Draft[]>([]);
  const [autoSaved, setAutoSaved] = useState(false);
  const [cloudSaving, setCloudSaving] = useState(false);

  const editorRef = useRef<TextInput>(null);
  const selectionRef = useRef({ start: 0, end: 0 });
  const statsAnim = useRef(new Animated.Value(0)).current;

  const { isAuthenticated } = useConvexAuth();
  const cloudDraftsRaw = useQuery(
    api.contentDrafts.listMyDrafts,
    isAuthenticated ? {} : "skip",
  );
  const saveDraftMutation = useMutation(api.contentDrafts.saveDraft);
  const deleteDraftMutation = useMutation(api.contentDrafts.deleteDraft);

  const cloudDrafts: Draft[] = useMemo(
    () =>
      (cloudDraftsRaw ?? []).map((d: any) => ({
        id: d._id as string,
        convexId: d._id as Id<"contentDrafts">,
        title: d.title,
        markdown: d.markdown ?? d.html ?? "",
        savedAt: d.savedAt,
      })),
    [cloudDraftsRaw],
  );

  const drafts = useMemo(
    () => mergeDrafts(localDrafts, cloudDrafts, isAuthenticated),
    [localDrafts, cloudDrafts, isAuthenticated],
  );

  /* Chargement initial des brouillons locaux */
  useEffect(() => {
    void loadLocalDrafts().then(setLocalDrafts);
  }, []);

  /* Stats */
  const stats = useMemo(() => {
    const chars = markdown.length;
    const words = markdown.trim().split(/\s+/).filter(Boolean).length;
    const readability = readabilityScore(markdown);
    return { chars, words, readability };
  }, [markdown]);

  useEffect(() => {
    Animated.timing(statsAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [stats.chars, statsAnim]);

  /* Insertion markdown au curseur */
  const insertMarkdown = useCallback(
    (action: FormatAction) => {
      const { start, end } = selectionRef.current;
      const selected = markdown.slice(start, end);

      if (action.type === "wrap") {
        const before = action.before;
        const after = action.after;
        const inner = selected || "texte";
        const next =
          markdown.slice(0, start) +
          before +
          inner +
          after +
          markdown.slice(end);
        setMarkdown(next);
        selectionRef.current = {
          start: start + before.length + inner.length,
          end: start + before.length + inner.length,
        };
        return;
      }

      // line prefix (H1, H2, quote, list)
      const lineStart = markdown.lastIndexOf("\n", start - 1) + 1;
      const prefix = action.prefix;
      const lineAlreadyPrefixed = markdown
        .slice(lineStart, start)
        .startsWith(prefix);

      let next: string;
      if (lineAlreadyPrefixed) {
        next =
          markdown.slice(0, lineStart) +
          markdown.slice(lineStart).replace(prefix, "");
      } else {
        next =
          markdown.slice(0, lineStart) + prefix + markdown.slice(lineStart);
      }
      setMarkdown(next);
    },
    [markdown],
  );

  /* Sauvegarde locale */
  const localSave = useCallback(
    async (md: string) => {
      if (!md.trim()) return;
      const draft: Draft = {
        id: `draft-${Date.now()}`,
        title,
        markdown: md,
        savedAt: new Date().toISOString(),
      };
      const existing = await loadLocalDrafts();
      const idx = existing.findIndex((d) => d.title === title);
      if (idx >= 0) existing[idx] = draft;
      else existing.unshift(draft);
      const trimmed = existing.slice(0, 20);
      await saveLocalDrafts(trimmed);
      setLocalDrafts(trimmed);
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 2000);
    },
    [title],
  );

  /* Sauvegarde cloud */
  const cloudSave = useCallback(
    async (md: string) => {
      if (!isAuthenticated) return;
      setCloudSaving(true);
      try {
        await saveDraftMutation({ title, markdown: md });
      } catch {
        toast.error("Erreur lors de la sauvegarde cloud");
      } finally {
        setCloudSaving(false);
      }
    },
    [isAuthenticated, saveDraftMutation, title],
  );

  /* Auto-save toutes les 30 s */
  useEffect(() => {
    const interval = setInterval(() => {
      if (markdown.trim()) void localSave(markdown);
    }, 30_000);
    return () => clearInterval(interval);
  }, [markdown, localSave]);

  /* Handlers */
  const handleManualSave = useCallback(async () => {
    if (!markdown.trim()) {
      toast.error("Rien à sauvegarder");
      return;
    }
    await localSave(markdown);
    await cloudSave(markdown);
    toast.success(
      isAuthenticated
        ? "Brouillon sauvegardé dans le cloud"
        : "Brouillon sauvegardé",
    );
  }, [markdown, localSave, cloudSave, isAuthenticated]);

  const handleApplyTemplate = useCallback((t: Template) => {
    setMarkdown(t.markdown);
    setTitle(t.label);
    setShowTemplates(false);
    toast.success(`Template « ${t.label} » appliqué`);
  }, []);

  const handleLoadDraft = useCallback((d: Draft) => {
    setMarkdown(d.markdown);
    setTitle(d.title);
    setShowDrafts(false);
    toast.success("Brouillon chargé");
  }, []);

  const handleDeleteDraft = useCallback(
    async (d: Draft) => {
      const updated = localDrafts.filter((ld) => ld.title !== d.title);
      await saveLocalDrafts(updated);
      setLocalDrafts(updated);
      if (d.convexId && isAuthenticated) {
        try {
          await deleteDraftMutation({ draftId: d.convexId });
        } catch {
          /* silencieux */
        }
      }
      toast.success("Brouillon supprimé");
    },
    [localDrafts, isAuthenticated, deleteDraftMutation],
  );

  const handleClear = useCallback(() => {
    setMarkdown("");
    setTitle("Mon contenu");
  }, []);

  /* ── Rendu ─────────────────────────────────────────────────────────── */
  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={styles.glow} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [
            styles.backBtn,
            { transform: [{ scale: pressed ? 0.92 : 1 }] },
          ]}
        >
          <ArrowLeft size={17} color="#fff" />
        </Pressable>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Titre de ton contenu…"
          placeholderTextColor={T.faint}
          style={styles.titleInput}
          maxLength={80}
        />

        <View style={styles.headerActions}>
          {autoSaved && (
            <View style={styles.statusPill}>
              <CheckCircle2 size={11} color="#34D399" />
              <Text style={styles.statusPillText}>OK</Text>
            </View>
          )}
          {cloudSaving && (
            <View
              style={[
                styles.statusPill,
                { backgroundColor: alpha("#3B82F6", 0.15) },
              ]}
            >
              <ActivityIndicator size="small" color="#60A5FA" />
            </View>
          )}
          <Pressable
            onPress={() => setShowDrafts(true)}
            style={({ pressed }) => [
              styles.headerActionBtn,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <Clock size={15} color={T.dim} />
          </Pressable>
          <Pressable
            onPress={handleManualSave}
            style={({ pressed }) => [
              styles.headerActionBtn,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <Save size={15} color={T.dim} />
          </Pressable>
          <Pressable
            onPress={() => setShowPreview((v) => !v)}
            style={({ pressed }) => [
              styles.headerActionBtn,
              showPreview && {
                backgroundColor: alpha("#3B82F6", 0.22),
                borderColor: alpha("#3B82F6", 0.5),
              },
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            {showPreview ? (
              <EyeOff size={15} color="#60A5FA" />
            ) : (
              <Eye size={15} color={T.dim} />
            )}
          </Pressable>
        </View>
      </View>

      {/* Toolbar */}
      {!showPreview && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolbarContent}
          style={styles.toolbar}
        >
          <ToolBtn
            icon={Heading1}
            label="Titre 1"
            onPress={() => insertMarkdown({ type: "line", prefix: "# " })}
          />
          <ToolBtn
            icon={Heading2}
            label="Titre 2"
            onPress={() => insertMarkdown({ type: "line", prefix: "## " })}
          />
          <ToolBtn
            icon={Type}
            label="Paragraphe"
            onPress={() => insertMarkdown({ type: "line", prefix: "" })}
          />
          <View style={styles.toolbarDivider} />
          <ToolBtn
            icon={Bold}
            label="Gras"
            onPress={() =>
              insertMarkdown({ type: "wrap", before: "**", after: "**" })
            }
          />
          <ToolBtn
            icon={Italic}
            label="Italique"
            onPress={() =>
              insertMarkdown({ type: "wrap", before: "*", after: "*" })
            }
          />
          <ToolBtn
            icon={Underline}
            label="Souligné"
            onPress={() =>
              insertMarkdown({ type: "wrap", before: "__", after: "__" })
            }
          />
          <View style={styles.toolbarDivider} />
          <ToolBtn
            icon={List}
            label="Liste à puces"
            onPress={() => insertMarkdown({ type: "line", prefix: "- " })}
          />
          <ToolBtn
            icon={ListOrdered}
            label="Liste numérotée"
            onPress={() => insertMarkdown({ type: "line", prefix: "1. " })}
          />
          <ToolBtn
            icon={Quote}
            label="Citation"
            onPress={() => insertMarkdown({ type: "line", prefix: "> " })}
          />
          <View style={styles.toolbarDivider} />
          <ToolBtn
            icon={AlignLeft}
            label="Aligner"
            onPress={() => {
              /* RN: texte aligné à gauche par défaut */
            }}
          />
          <View style={styles.toolbarDivider} />
          <Pressable
            onPress={() => setShowTemplates(true)}
            style={({ pressed }) => [
              styles.templateBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Sparkles size={13} color={T.primarySoft} />
            <Text style={styles.templateBtnText}>Templates</Text>
          </Pressable>
        </ScrollView>
      )}

      {/* Éditeur / Preview */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.editorContent}
          keyboardShouldPersistTaps="handled"
        >
          {showPreview ? (
            <View style={styles.previewBox}>
              <MarkdownPreview markdown={markdown} />
            </View>
          ) : (
            <TextInput
              ref={editorRef}
              value={markdown}
              onChangeText={setMarkdown}
              onSelectionChange={(e) => {
                selectionRef.current = e.nativeEvent.selection;
              }}
              multiline
              textAlignVertical="top"
              placeholder={
                "# Commence à écrire…\n\nUtilise la toolbar pour mettre en forme ton contenu."
              }
              placeholderTextColor={T.faint}
              style={styles.editorInput}
              autoCorrect
              autoCapitalize="sentences"
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer stats */}
      <View style={styles.footer}>
        <Animated.View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            opacity: statsAnim,
          }}
        >
          <Text style={styles.footerStat}>
            <Text style={styles.footerStatValue}>{stats.chars}</Text>
            <Text style={styles.footerStatUnit}> car.</Text>
          </Text>
          <Text style={styles.footerStat}>
            <Text style={styles.footerStatValue}>{stats.words}</Text>
            <Text style={styles.footerStatUnit}> mots</Text>
          </Text>
          <View style={styles.footerReadability}>
            <View
              style={[
                styles.footerDot,
                { backgroundColor: stats.readability.color },
              ]}
            />
            <Text
              style={[
                styles.footerReadabilityText,
                { color: stats.readability.color },
              ]}
            >
              {stats.readability.label}
            </Text>
          </View>
        </Animated.View>

        <View style={{ flex: 1 }} />

        <Pressable
          onPress={handleClear}
          style={({ pressed }) => [
            styles.clearBtn,
            { opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <Trash2 size={13} color={T.faint} />
          <Text style={styles.clearBtnText}>Effacer</Text>
        </Pressable>

        <Pressable
          onPress={() => toast.success("Contenu publié avec succès !")}
          style={({ pressed }) => [
            styles.publishBtn,
            {
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
        >
          <Text style={styles.publishBtnText}>Publier</Text>
        </Pressable>
      </View>

      {/* Modales */}
      <TemplatePickerModal
        visible={showTemplates}
        onClose={() => setShowTemplates(false)}
        onPick={handleApplyTemplate}
      />

      <DraftsModal
        visible={showDrafts}
        drafts={drafts}
        isAuthenticated={isAuthenticated}
        onClose={() => setShowDrafts(false)}
        onLoad={handleLoadDraft}
        onDelete={handleDeleteDraft}
      />
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   STYLES
   ════════════════════════════════════════════════════════════════════════════ */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },

  glow: {
    position: "absolute",
    top: -140,
    left: -80,
    right: -80,
    height: 300,
    borderRadius: 220,
    backgroundColor: alpha(T.primary, 0.1),
  },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: T.border,
  },
  titleInput: {
    flex: 1,
    color: T.text,
    fontSize: 15,
    fontWeight: "800",
    paddingVertical: 8,
    letterSpacing: -0.2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: T.border,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: alpha(T.success, 0.15),
    borderWidth: 1,
    borderColor: alpha(T.success, 0.3),
  },
  statusPillText: {
    color: "#34D399",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.4,
  },

  /* Toolbar */
  toolbar: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    maxHeight: 58,
  },
  toolbarContent: {
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  toolBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  toolBtnActive: {
    backgroundColor: T.primarySoft,
  },
  toolbarDivider: {
    width: 1,
    height: 20,
    backgroundColor: T.ghost,
    marginHorizontal: 4,
  },
  templateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: alpha(T.primary, 0.16),
    borderWidth: 1,
    borderColor: alpha(T.primary, 0.4),
    marginLeft: 6,
  },
  templateBtnText: {
    color: T.primarySoft,
    fontSize: 12,
    fontWeight: "800",
  },

  /* Editor */
  editorContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },
  editorInput: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 15,
    lineHeight: 24,
    minHeight: 380,
    padding: 0,
    fontWeight: "500",
  },

  /* Preview */
  previewBox: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#0E0E14",
    borderWidth: 1,
    borderColor: T.borderUp,
    minHeight: 380,
  },
  previewH1: {
    color: T.text,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  previewH2: {
    color: T.text,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.3,
    lineHeight: 22,
    marginTop: 6,
  },
  previewP: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 14,
    lineHeight: 22,
  },
  previewQuote: {
    paddingLeft: 14,
    borderLeftWidth: 3,
    borderLeftColor: T.primarySoft,
  },
  previewQuoteText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 22,
  },
  previewListRow: {
    flexDirection: "row",
    gap: 10,
  },
  previewBullet: {
    color: T.primarySoft,
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 22,
  },
  previewListItem: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
  },
  previewEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  previewEmptyText: {
    color: T.faint,
    fontSize: 12.5,
    fontWeight: "600",
    textAlign: "center",
    maxWidth: 240,
  },

  /* Footer */
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 28 : 18,
    backgroundColor: "rgba(10,10,15,0.96)",
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  footerStat: { flexDirection: "row", alignItems: "baseline" },
  footerStatValue: {
    color: T.text,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  footerStatUnit: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "700",
  },
  footerReadability: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  footerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  footerReadabilityText: {
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  clearBtnText: {
    color: T.faint,
    fontSize: 11.5,
    fontWeight: "800",
  },
  publishBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: T.primary,
    shadowColor: T.primary,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  publishBtnText: {
    color: "#fff",
    fontSize: 12.5,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  /* Modals */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: T.sheet,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: T.borderUp,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
    maxHeight: "94%",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.22)",
    marginTop: 10,
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sheetHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(T.primary, 0.18),
  },
  sheetTitle: {
    color: T.text,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    color: T.faint,
    fontSize: 11.5,
    marginTop: 2,
    fontWeight: "600",
  },
  sheetCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  /* Template row */
  templateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  templateIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  templateLabel: {
    color: T.text,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  templateDesc: {
    color: T.dim,
    fontSize: 11.5,
    marginTop: 3,
    fontWeight: "600",
  },
  templateCta: {
    fontSize: 11.5,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  /* Draft row */
  draftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  draftIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  draftTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  draftTitle: {
    color: T.text,
    fontSize: 13.5,
    fontWeight: "800",
    flexShrink: 1,
    letterSpacing: -0.1,
  },
  draftDate: {
    color: T.faint,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 3,
  },
  draftDeleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  draftsEmpty: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  draftsEmptyText: {
    color: T.faint,
    fontSize: 12.5,
    fontWeight: "600",
  },
});
