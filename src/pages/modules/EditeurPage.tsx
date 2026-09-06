// src/pages/modules/EditeurPage.tsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Bold,
  BookOpen,
  CheckCircle,
  Clock,
  Cloud,
  Eye,
  EyeOff,
  FileText,
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
import { toast } from "sonner-native";
import { useMutation, useQuery } from "convex/react";

import { useConvexAuth } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

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
  html: string;
  savedAt: string;
};

type Template = {
  id: TemplateId;
  label: string;
  icon: React.ComponentType<{
    size?: number;
    color?: string;
  }>;
  color: string;
  content: string;
  description: string;
};

interface Props {
  onBack: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Templates
// ─────────────────────────────────────────────────────────────────────────────

const TEMPLATES: Template[] = [
  {
    id: "annonce",
    label: "Annonce",
    icon: Megaphone,
    color: "#3B82F6",
    description: "Partagez une nouvelle importante",
    content:
      "📢 GRANDE ANNONCE !\n\nChers amis et abonnés,\n\nNous sommes ravis de vous annoncer que [Votre annonce ici].\n\nCette nouvelle marque une étape importante pour nous et nous espérons que vous serez aussi enthousiastes que nous !\n\n« [Votre citation inspirante] »\n\nPour plus d'informations, n'hésitez pas à nous contacter.",
  },
  {
    id: "promo",
    label: "Promotion",
    icon: ShoppingBag,
    color: "#F97316",
    description: "Mettez en avant une offre spéciale",
    content:
      "🔥 OFFRE SPÉCIALE LIMITÉE !\n\nNe manquez pas cette opportunité unique !\n\nCE QUE VOUS OBTENEZ :\n\n• ✅ [Avantage 1]\n• ✅ [Avantage 2]\n• ✅ [Avantage 3]\n\nValable jusqu'au [date].\nQuantité limitée !\n\nUtilisez le code : PROMO2024",
  },
  {
    id: "temoignage",
    label: "Témoignage",
    icon: Star,
    color: "#F59E0B",
    description: "Partagez un avis client",
    content:
      "⭐ TÉMOIGNAGE CLIENT\n\n« [Le témoignage du client ici — décrivez l'expérience positive en détail pour plus d'impact.] »\n\n— [Nom du client], [Ville/Pays]\n\nRésultat obtenu : [Résultat concret] en seulement [durée] !\n\nVous aussi, rejoignez nos clients satisfaits 👇",
  },
  {
    id: "article",
    label: "Article",
    icon: BookOpen,
    color: "#8B5CF6",
    description: "Rédigez un article de blog",
    content:
      "[TITRE ACCROCHEUR DE VOTRE ARTICLE]\n\nPar [Auteur] · [Date] · [Temps de lecture] min\n\nINTRODUCTION\n\n[Introduisez votre sujet de manière captivante.]\n\nDÉVELOPPEMENT\n\n[Corps de votre article. Développez vos idées avec des exemples concrets et des données.]\n\n• [Point clé 1]\n• [Point clé 2]\n• [Point clé 3]\n\nCONCLUSION\n\n[Résumez les points clés et invitez vos lecteurs à réagir.]",
  },
  {
    id: "evenement",
    label: "Événement",
    icon: Sparkles,
    color: "#EC4899",
    description: "Annoncez un événement",
    content:
      "🎉 [NOM DE L'ÉVÉNEMENT]\n\n📅 Date : [Jour, DD Mois YYYY]\n🕐 Heure : [HH:MM]\n📍 Lieu : [Adresse complète]\n\nAU PROGRAMME\n\n• 🎤 [Activité 1]\n• 🎵 [Activité 2]\n• 🍽️ [Activité 3]\n\nEntrée : [Gratuite / XX FCFA]\n\nRéservez votre place maintenant !",
  },
  {
    id: "offre",
    label: "Offre d'emploi",
    icon: MessageSquare,
    color: "#10B981",
    description: "Publiez une offre de recrutement",
    content:
      "🚀 NOUS RECRUTONS : [POSTE]\n\n[Nom de l'entreprise] recherche un(e) [Poste] passionné(e) pour rejoindre notre équipe.\n\nMISSIONS\n\n• [Mission 1]\n• [Mission 2]\n• [Mission 3]\n\nPROFIL RECHERCHÉ\n\n• [Compétence / Expérience requise]\n• [Qualité personnelle]\n\nRémunération : [XX XXX FCFA / mois]\n\nEnvoyez votre CV à : [email]",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const DRAFTS_KEY = "editeur_drafts_v1";

function readabilityScore(text: string): {
  score: number;
  label: string;
  color: string;
} {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const sentences = (text.match(/[.!?]+/g) ?? []).length || 1;
  const average = words / sentences;

  if (average < 15) {
    return {
      score: 95,
      label: "Très lisible",
      color: "#10B981",
    };
  }

  if (average < 20) {
    return {
      score: 78,
      label: "Lisible",
      color: "#3B82F6",
    };
  }

  if (average < 25) {
    return {
      score: 55,
      label: "Moyen",
      color: "#F59E0B",
    };
  }

  return {
    score: 30,
    label: "Difficile",
    color: "#EF4444",
  };
}

async function loadLocalDrafts(): Promise<Draft[]> {
  try {
    const value = await AsyncStorage.getItem(DRAFTS_KEY);

    if (!value) {
      return [];
    }

    const parsed = JSON.parse(value);

    return Array.isArray(parsed) ? (parsed as Draft[]) : [];
  } catch {
    return [];
  }
}

async function saveLocalDrafts(drafts: Draft[]): Promise<void> {
  try {
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  } catch {
    // La sauvegarde locale ne doit jamais bloquer l'éditeur.
  }
}

function mergeDrafts(
  localDrafts: Draft[],
  cloudDrafts: Draft[],
  isAuthenticated: boolean,
): Draft[] {
  if (!isAuthenticated || cloudDrafts.length === 0) {
    return [...localDrafts]
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
      .slice(0, 20);
  }

  const merged = new Map<string, Draft>();

  for (const draft of cloudDrafts) {
    merged.set(draft.title, draft);
  }

  for (const draft of localDrafts) {
    if (!merged.has(draft.title)) {
      merged.set(draft.title, draft);
    }
  }

  return Array.from(merged.values())
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    .slice(0, 20);
}

// ─────────────────────────────────────────────────────────────────────────────
// Toolbar button
// ─────────────────────────────────────────────────────────────────────────────

interface ToolButtonProps {
  onPress: () => void;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}

function ToolButton({
  onPress,
  active = false,
  label,
  children,
}: ToolButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={`h-9 w-9 items-center justify-center rounded-lg ${
        active ? "bg-white" : "bg-white/5"
      }`}
    >
      {children}
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function EditeurPage({ onBack }: Props) {
  const editorRef = useRef<TextInput | null>(null);

  const [title, setTitle] = useState("Mon contenu");
  const [content, setContent] = useState("");

  const [showPreview, setShowPreview] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);

  const [localDrafts, setLocalDrafts] = useState<Draft[]>([]);

  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);

  const [readability, setReadability] = useState(() => readabilityScore(""));

  const [autoSaved, setAutoSaved] = useState(false);
  const [cloudSaving, setCloudSaving] = useState(false);

  const { isAuthenticated } = useConvexAuth();

  const cloudDraftsRaw = useQuery(
    api.contentDrafts.listMyDrafts,
    isAuthenticated ? {} : "skip",
  );

  const saveDraftMutation = useMutation(api.contentDrafts.saveDraft);

  const deleteDraftMutation = useMutation(api.contentDrafts.deleteDraft);

  // ───────────────────────────────────────────────────────────────────────────
  // Chargement des brouillons locaux
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;

    void loadLocalDrafts().then((drafts) => {
      if (mounted) {
        setLocalDrafts(drafts);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // Statistiques
  // ───────────────────────────────────────────────────────────────────────────

  const updateStats = useCallback((text: string) => {
    const chars = text.length;

    const words = text.trim().split(/\s+/).filter(Boolean).length;

    setCharCount(chars);
    setWordCount(words);
    setReadability(readabilityScore(text));
  }, []);

  const handleContentChange = useCallback(
    (text: string) => {
      setContent(text);
      updateStats(text);
    },
    [updateStats],
  );

  // ───────────────────────────────────────────────────────────────────────────
  // Conversion des brouillons Convex
  // ───────────────────────────────────────────────────────────────────────────

  const cloudDrafts = useMemo<Draft[]>(() => {
    return (cloudDraftsRaw ?? []).map((draft) => ({
      id: String(draft._id),
      convexId: draft._id,
      title: draft.title,
      html: draft.html,
      savedAt: draft.savedAt,
    }));
  }, [cloudDraftsRaw]);

  const drafts = useMemo(
    () => mergeDrafts(localDrafts, cloudDrafts, isAuthenticated),
    [localDrafts, cloudDrafts, isAuthenticated],
  );

  // ───────────────────────────────────────────────────────────────────────────
  // Sauvegarde locale
  // ───────────────────────────────────────────────────────────────────────────

  const localSave = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        return;
      }

      const draft: Draft = {
        id: `draft-${Date.now()}`,
        title: title.trim() || "Sans titre",
        html: text,
        savedAt: new Date().toISOString(),
      };

      const existing = await loadLocalDrafts();

      const index = existing.findIndex((item) => item.title === draft.title);

      if (index >= 0) {
        existing[index] = draft;
      } else {
        existing.unshift(draft);
      }

      const trimmed = existing
        .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
        .slice(0, 20);

      await saveLocalDrafts(trimmed);

      setLocalDrafts(trimmed);

      setAutoSaved(true);

      setTimeout(() => {
        setAutoSaved(false);
      }, 2000);
    },
    [title],
  );

  // ───────────────────────────────────────────────────────────────────────────
  // Sauvegarde cloud
  // ───────────────────────────────────────────────────────────────────────────

  const cloudSave = useCallback(
    async (text: string) => {
      if (!isAuthenticated) {
        return;
      }

      setCloudSaving(true);

      try {
        await saveDraftMutation({
          title: title.trim() || "Sans titre",
          html: text,
        });
      } catch {
        toast.error("Erreur lors de la sauvegarde cloud");
      } finally {
        setCloudSaving(false);
      }
    },
    [isAuthenticated, saveDraftMutation, title],
  );

  // ───────────────────────────────────────────────────────────────────────────
  // Auto-save
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const interval = setInterval(() => {
      if (!content.trim()) {
        return;
      }

      void localSave(content);
    }, 30_000);

    return () => {
      clearInterval(interval);
    };
  }, [content, localSave]);

  // ───────────────────────────────────────────────────────────────────────────
  // Actions
  // ───────────────────────────────────────────────────────────────────────────

  const applyTemplate = useCallback(
    (template: Template) => {
      setContent(template.content);
      setTitle(template.label);

      updateStats(template.content);

      setShowTemplates(false);

      requestAnimationFrame(() => {
        editorRef.current?.focus();
      });

      toast.success(`Template "${template.label}" appliqué`);
    },
    [updateStats],
  );

  const loadDraft = useCallback(
    (draft: Draft) => {
      setContent(draft.html);
      setTitle(draft.title);

      updateStats(draft.html);

      setShowDrafts(false);

      requestAnimationFrame(() => {
        editorRef.current?.focus();
      });

      toast.success("Brouillon chargé");
    },
    [updateStats],
  );

  const deleteDraft = useCallback(
    async (draft: Draft) => {
      const updatedLocal = localDrafts.filter(
        (item) => item.title !== draft.title,
      );

      await saveLocalDrafts(updatedLocal);

      setLocalDrafts(updatedLocal);

      if (draft.convexId && isAuthenticated) {
        try {
          await deleteDraftMutation({
            draftId: draft.convexId,
          });
        } catch {
          // Le brouillon local est déjà supprimé.
        }
      }

      toast.success("Brouillon supprimé");
    },
    [deleteDraftMutation, isAuthenticated, localDrafts],
  );

  const manualSave = useCallback(async () => {
    if (!content.trim()) {
      toast.error("Rien à sauvegarder");
      return;
    }

    await localSave(content);
    await cloudSave(content);

    toast.success(
      isAuthenticated
        ? "Brouillon sauvegardé dans le cloud !"
        : "Brouillon sauvegardé !",
    );
  }, [cloudSave, content, isAuthenticated, localSave]);

  const clearEditor = useCallback(() => {
    Alert.alert(
      "Effacer le contenu",
      "Voulez-vous vraiment effacer le contenu actuel ?",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Effacer",
          style: "destructive",
          onPress: () => {
            setContent("");
            setTitle("Mon contenu");
            updateStats("");
          },
        },
      ],
    );
  }, [updateStats]);

  // ───────────────────────────────────────────────────────────────────────────
  // Formatage React Native
  //
  // TextInput RN ne supporte pas document.execCommand/contentEditable.
  // Les actions appliquent donc des marqueurs Markdown compatibles.
  // ───────────────────────────────────────────────────────────────────────────

  const applyMarkdown = useCallback(
    (prefix: string, suffix = prefix) => {
      const next = `${prefix}${content}${suffix}`;

      setContent(next);
      updateStats(next);

      requestAnimationFrame(() => {
        editorRef.current?.focus();
      });
    },
    [content, updateStats],
  );

  const prependLine = useCallback(
    (prefix: string) => {
      const next = content
        .split("\n")
        .map((line) => `${prefix}${line}`)
        .join("\n");

      setContent(next);
      updateStats(next);

      requestAnimationFrame(() => {
        editorRef.current?.focus();
      });
    },
    [content, updateStats],
  );

  // ───────────────────────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <View className="flex-1 bg-gray-950">
      {/* Header */}

      <View className="flex-row items-center gap-3 border-b border-white/5 bg-gray-950 px-4 py-3">
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
        >
          <ArrowLeft size={19} color="#FFFFFF" />
        </Pressable>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Titre de votre contenu…"
          placeholderTextColor="#6B7280"
          className="flex-1 text-base font-bold text-white"
          maxLength={120}
        />

        <View className="flex-row items-center gap-1">
          {autoSaved && (
            <View className="flex-row items-center gap-1 px-1">
              <CheckCircle size={13} color="#34D399" />

              <Text className="text-xs text-emerald-400">Sauvegardé</Text>
            </View>
          )}

          {cloudSaving && (
            <View className="flex-row items-center gap-1 px-1">
              <Cloud size={13} color="#60A5FA" />

              <Text className="text-xs text-blue-400">Sync…</Text>
            </View>
          )}

          <Pressable
            onPress={() => {
              setShowDrafts((value) => !value);
              setShowTemplates(false);
            }}
            className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
          >
            <Clock size={17} color="#FFFFFF" />
          </Pressable>

          <Pressable
            onPress={() => void manualSave()}
            className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
          >
            <Save size={17} color="#FFFFFF" />
          </Pressable>

          <Pressable
            onPress={() => setShowPreview((value) => !value)}
            className={`h-10 w-10 items-center justify-center rounded-full ${
              showPreview ? "bg-blue-500/30" : "bg-white/10"
            }`}
          >
            {showPreview ? (
              <EyeOff size={17} color="#60A5FA" />
            ) : (
              <Eye size={17} color="#FFFFFF" />
            )}
          </Pressable>
        </View>
      </View>

      {/* Drafts */}

      {showDrafts && (
        <View className="border-b border-white/10 bg-gray-900">
          <View className="px-4 py-3">
            <View className="mb-3 flex-row items-center gap-2">
              <Text className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Brouillons récents
              </Text>

              {isAuthenticated && (
                <View className="flex-row items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-1">
                  <Cloud size={10} color="#60A5FA" />

                  <Text className="text-[10px] text-blue-400">Cloud</Text>
                </View>
              )}
            </View>

            {drafts.length === 0 ? (
              <Text className="text-sm text-gray-500">
                Aucun brouillon sauvegardé.
              </Text>
            ) : (
              <ScrollView className="max-h-52" nestedScrollEnabled>
                <View className="gap-2">
                  {drafts.map((draft) => (
                    <View
                      key={draft.id}
                      className="flex-row items-center gap-3 rounded-xl bg-white/5 px-3 py-3"
                    >
                      <FileText size={15} color="#9CA3AF" />

                      <Pressable
                        onPress={() => loadDraft(draft)}
                        className="flex-1"
                      >
                        <View className="flex-row items-center gap-2">
                          <Text
                            numberOfLines={1}
                            className="flex-1 text-sm font-medium text-white"
                          >
                            {draft.title}
                          </Text>

                          {draft.convexId && (
                            <Cloud size={11} color="#60A5FA" />
                          )}
                        </View>

                        <Text className="mt-1 text-xs text-gray-500">
                          {new Date(draft.savedAt).toLocaleString("fr-FR")}
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => void deleteDraft(draft)}
                        className="h-8 w-8 items-center justify-center"
                      >
                        <Trash2 size={15} color="#9CA3AF" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      )}

      {/* Templates */}

      {showTemplates && (
        <View className="border-b border-white/10 bg-gray-900">
          <View className="px-4 py-3">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Templates
              </Text>

              <Pressable
                onPress={() => setShowTemplates(false)}
                className="h-8 w-8 items-center justify-center"
              >
                <X size={16} color="#9CA3AF" />
              </Pressable>
            </View>

            <View className="flex-row flex-wrap gap-2">
              {TEMPLATES.map((template) => {
                const Icon = template.icon;

                return (
                  <Pressable
                    key={template.id}
                    onPress={() => applyTemplate(template)}
                    className="w-[31%] rounded-xl border border-white/10 bg-white/5 p-3"
                  >
                    <View
                      className="mb-2 h-8 w-8 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: `${template.color}22`,
                      }}
                    >
                      <Icon size={16} color={template.color} />
                    </View>

                    <Text className="text-xs font-semibold text-white">
                      {template.label}
                    </Text>

                    <Text
                      numberOfLines={2}
                      className="mt-1 text-[10px] text-gray-500"
                    >
                      {template.description}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* Toolbar */}

      {!showPreview && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="border-b border-white/5 bg-gray-900"
          contentContainerClassName="items-center gap-1 px-3 py-2"
        >
          <ToolButton label="Titre 1" onPress={() => applyMarkdown("# ", "")}>
            <Heading1 size={17} color="#D1D5DB" />
          </ToolButton>

          <ToolButton label="Titre 2" onPress={() => applyMarkdown("## ", "")}>
            <Heading2 size={17} color="#D1D5DB" />
          </ToolButton>

          <ToolButton
            label="Paragraphe"
            onPress={() => editorRef.current?.focus()}
          >
            <Type size={17} color="#D1D5DB" />
          </ToolButton>

          <View className="mx-1 h-6 w-px bg-white/15" />

          <ToolButton label="Gras" onPress={() => applyMarkdown("**")}>
            <Bold size={17} color="#D1D5DB" />
          </ToolButton>

          <ToolButton label="Italique" onPress={() => applyMarkdown("_")}>
            <Italic size={17} color="#D1D5DB" />
          </ToolButton>

          <ToolButton label="Souligné" onPress={() => applyMarkdown("__")}>
            <Underline size={17} color="#D1D5DB" />
          </ToolButton>

          <View className="mx-1 h-6 w-px bg-white/15" />

          <ToolButton label="Liste à puces" onPress={() => prependLine("• ")}>
            <List size={17} color="#D1D5DB" />
          </ToolButton>

          <ToolButton
            label="Liste numérotée"
            onPress={() => prependLine("1. ")}
          >
            <ListOrdered size={17} color="#D1D5DB" />
          </ToolButton>

          <ToolButton label="Citation" onPress={() => prependLine("> ")}>
            <Quote size={17} color="#D1D5DB" />
          </ToolButton>

          <View className="mx-1 h-6 w-px bg-white/15" />

          <ToolButton
            label="Aligner à gauche"
            onPress={() => editorRef.current?.focus()}
          >
            <AlignLeft size={17} color="#D1D5DB" />
          </ToolButton>

          <ToolButton
            label="Centrer"
            onPress={() => editorRef.current?.focus()}
          >
            <AlignCenter size={17} color="#D1D5DB" />
          </ToolButton>

          <ToolButton
            label="Aligner à droite"
            onPress={() => editorRef.current?.focus()}
          >
            <AlignRight size={17} color="#D1D5DB" />
          </ToolButton>

          <Pressable
            onPress={() => {
              setShowTemplates((value) => !value);
              setShowDrafts(false);
            }}
            className={`ml-2 flex-row items-center gap-2 rounded-lg border px-3 py-2 ${
              showTemplates
                ? "border-purple-500/40 bg-purple-500/20"
                : "border-white/10 bg-white/5"
            }`}
          >
            <Sparkles size={14} color={showTemplates ? "#C084FC" : "#D1D5DB"} />

            <Text
              className={
                showTemplates
                  ? "text-xs text-purple-300"
                  : "text-xs text-gray-300"
              }
            >
              Templates
            </Text>
          </Pressable>
        </ScrollView>
      )}

      {/* Editor / Preview */}

      <View className="flex-1">
        {showPreview ? (
          <ScrollView className="flex-1" contentContainerClassName="p-4">
            <View className="min-h-64 rounded-2xl bg-white p-5">
              {content.trim() ? (
                <Text className="text-base leading-7 text-gray-900">
                  {content}
                </Text>
              ) : (
                <Text className="text-base text-gray-400">
                  Rien à prévisualiser…
                </Text>
              )}
            </View>
          </ScrollView>
        ) : (
          <TextInput
            ref={editorRef}
            value={content}
            onChangeText={handleContentChange}
            multiline
            textAlignVertical="top"
            placeholder="Commencez à écrire votre contenu ici…"
            placeholderTextColor="#6B7280"
            className="flex-1 px-4 py-4 text-base leading-7 text-gray-100"
            style={{
              minHeight: 300,
            }}
          />
        )}
      </View>

      {/* Stats */}

      <View className="flex-row items-center gap-4 border-t border-white/5 bg-gray-950 px-4 py-3">
        <Text className="text-xs text-gray-400">
          {charCount} <Text className="text-gray-600">car.</Text>
        </Text>

        <Text className="text-xs text-gray-400">
          {wordCount} <Text className="text-gray-600">mots</Text>
        </Text>

        <View className="flex-row items-center gap-2">
          <View
            className="h-2 w-2 rounded-full"
            style={{
              backgroundColor: readability.color,
            }}
          />

          <Text
            className="text-xs"
            style={{
              color: readability.color,
            }}
          >
            {readability.label}
          </Text>
        </View>

        <View className="flex-1" />

        <Pressable
          onPress={clearEditor}
          className="flex-row items-center gap-1"
        >
          <Trash2 size={13} color="#6B7280" />

          <Text className="text-xs text-gray-500">Effacer</Text>
        </Pressable>

        <Pressable
          onPress={() => toast.success("Contenu publié avec succès !")}
          className="rounded-lg bg-purple-600 px-4 py-2"
        >
          <Text className="text-xs font-semibold text-white">Publier</Text>
        </Pressable>
      </View>
    </View>
  );
}
