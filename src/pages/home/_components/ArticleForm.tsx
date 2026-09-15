// src/pages/home/_components/ArticleForm.tsx
import {
  Pressable,
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  Animated,
  Easing,
  StyleSheet,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Clock3,
  Eye,
  EyeOff,
  Loader2,
  Save,
  Send,
  Sparkles,
  Tag,
  X,
  Image as ImageIcon,
} from "lucide-react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { toast } from "sonner";
import ArticleEditor from "@/components/ArticleEditor.tsx";

/* ============================================================================
 * CONSTANTS
 * ========================================================================== */

const ARTICLE_CATS = [
  "Tech",
  "Société",
  "Culture",
  "Santé",
  "Business",
  "Éducation",
  "Sport",
  "Art",
  "Voyage",
  "Science",
];

const COLOR = "#06B6D4";
const COLOR_DEEP = "#0891B2";
const DRAFT_KEY = "article_draft";
const isBrowser = typeof window !== "undefined";

/* ============================================================================
 * SYNC STORAGE SHIM
 * ========================================================================== */

const memoryStore: Record<string, string> = {};

const draftStore = {
  get(key: string): string | null {
    if (isBrowser) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    return memoryStore[key] ?? null;
  },
  set(key: string, value: string) {
    if (isBrowser) {
      try {
        window.localStorage.setItem(key, value);
      } catch {}
    } else {
      memoryStore[key] = value;
    }
  },
  remove(key: string) {
    if (isBrowser) {
      try {
        window.localStorage.removeItem(key);
      } catch {}
    } else {
      delete memoryStore[key];
    }
  },
};

/* ============================================================================
 * TYPES
 * ========================================================================== */

interface ArticleFormProps {
  onBack: () => void;
  onClose: () => void;
}

interface ArticleDraft {
  title?: string;
  content?: string;
  category?: string;
  coverUrl?: string;
  savedAt?: string;
}

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

/* ============================================================================
 * AMBIENT BACKGROUND
 * ========================================================================== */

function AmbientGlow() {
  const orb = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(orb, {
          toValue: 1,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(orb, {
          toValue: 0,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [orb]);

  const scale = orb.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  const opacity = orb.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.55],
  });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.ambientOrb,
          {
            width: 320,
            height: 320,
            top: -180,
            alignSelf: "center",
            opacity,
            transform: [{ scale }],
          },
        ]}
      />
    </View>
  );
}

/* ============================================================================
 * FORM WRAPPER
 * ========================================================================== */

function FormWrapper({
  title,
  onBack,
  onClose,
  children,
}: {
  title: string;
  onBack: () => void;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <View style={{ flex: 1 }}>
      <AmbientGlow />
      <View style={styles.wrapperHeader}>
        <Pressable
          onPress={onBack}
          accessibilityLabel="Retour"
          hitSlop={8}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
        >
          <ArrowLeft size={16} color="rgba(255,255,255,0.85)" />
        </Pressable>

        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={styles.wrapperTitle} numberOfLines={1}>
              {title}
            </Text>
            <View style={styles.editorBadge}>
              <Text style={styles.editorBadgeText}>ÉDITEUR</Text>
            </View>
          </View>
          <Text style={styles.wrapperSub}>
            Créez un contenu qui mérite d'être découvert.
          </Text>
        </View>

        <Pressable
          onPress={onClose}
          accessibilityLabel="Fermer"
          hitSlop={8}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
        >
          <X size={16} color="rgba(255,255,255,0.75)" />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.wrapperScroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
}

/* ============================================================================
 * CATEGORY PILLS
 * ========================================================================== */

function CategoryPills({
  cats,
  active,
  onChange,
}: {
  cats: string[];
  active: string;
  onChange: (category: string) => void;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={styles.sectionHeaderRow}>
        <Tag size={11} color="rgba(6,182,212,0.85)" />
        <Text style={styles.sectionEyebrow}>CATÉGORIE</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
      >
        {cats.map((category) => {
          const isActive = active === category;
          return (
            <Pressable
              key={category}
              onPress={() => onChange(category)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              style={({ pressed }) => [
                styles.categoryPill,
                isActive && styles.categoryPillActive,
                pressed && styles.pressed,
              ]}
            >
              {isActive ? (
                <LinearGradient
                  colors={[`${COLOR}28`, `${COLOR_DEEP}14`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              ) : null}
              {isActive ? (
                <Check size={10} color={COLOR} strokeWidth={3} />
              ) : null}
              <Text style={[styles.categoryText, isActive && { color: COLOR }]}>
                {category}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/* ============================================================================
 * FIELD SHELL (focus-animated)
 * ========================================================================== */

function FieldShell({
  children,
  focused = false,
  style,
}: {
  children: ReactNode;
  focused?: boolean;
  style?: any;
}) {
  const anim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: focused ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [focused, anim]);

  const borderColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.08)", `${COLOR}77`],
  });
  const backgroundColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.045)", "rgba(6,182,212,0.07)"],
  });

  return (
    <Animated.View
      style={[styles.fieldShell, { borderColor, backgroundColor }, style]}
    >
      {children}
    </Animated.View>
  );
}

/* ============================================================================
 * STATUS BAR (word count + saving)
 * ========================================================================== */

function StatusBar({
  wordCount,
  readingTime,
  characterCount,
  saving,
  lastSaved,
}: {
  wordCount: number;
  readingTime: number;
  characterCount: number;
  saving: boolean;
  lastSaved: Date | null;
}) {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [fade]);

  return (
    <Animated.View style={[styles.statusBar, { opacity: fade }]}>
      <View style={styles.statusLeft}>
        <View style={styles.statusItem}>
          <BookOpen size={12} color="rgba(255,255,255,0.45)" />
          <Text style={styles.statusText}>{wordCount} mots</Text>
        </View>
        <View style={styles.statusSep} />
        <View style={styles.statusItem}>
          <Clock3 size={12} color="rgba(255,255,255,0.45)" />
          <Text style={styles.statusText}>~{readingTime} min</Text>
        </View>
        <View style={styles.statusSep} />
        <Text style={styles.statusTextDim}>
          {characterCount.toLocaleString("fr-FR")} car.
        </Text>
      </View>

      {saving ? (
        <View style={styles.statusRight}>
          <Animated.View
            style={{
              transform: [
                {
                  rotate: fade.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "360deg"],
                  }),
                },
              ],
            }}
          >
            <Loader2 size={11} color={COLOR} />
          </Animated.View>
          <Text style={[styles.statusText, { color: `${COLOR}CC` }]}>
            Sauvegarde…
          </Text>
        </View>
      ) : lastSaved ? (
        <View style={styles.statusRight}>
          <Save size={11} color={`${COLOR}CC`} />
          <Text style={[styles.statusText, { color: `${COLOR}CC` }]}>
            {formatTime(lastSaved)}
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

/* ============================================================================
 * MAIN COMPONENT
 * ========================================================================== */

export default function ArticleForm({ onBack, onClose }: ArticleFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [coverUrl, setCoverUrl] = useState("");

  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const [titleFocused, setTitleFocused] = useState(false);
  const [coverFocused, setCoverFocused] = useState(false);
  const [coverError, setCoverError] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const createPublication = useMutation(api.publications.createPublication);

  /* ─────────── derived ─────────── */
  const textOnly = useMemo(
    () =>
      content
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/\s+/g, " ")
        .trim(),
    [content],
  );

  const wordCount = useMemo(
    () => (textOnly ? textOnly.split(/\s+/).length : 0),
    [textOnly],
  );

  const characterCount = textOnly.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  const canPublish = title.trim().length >= 3 && wordCount >= 10 && !loading;
  const hasContent =
    Boolean(title.trim()) ||
    Boolean(content.trim()) ||
    Boolean(category) ||
    Boolean(coverUrl.trim());

  /* ─────────── restore draft ─────────── */
  useEffect(() => {
    try {
      const raw = draftStore.get(DRAFT_KEY);
      if (!raw) return;

      const draft = JSON.parse(raw) as ArticleDraft;

      if (draft.title || draft.content || draft.category || draft.coverUrl) {
        setTitle(draft.title ?? "");
        setContent(draft.content ?? "");
        setCategory(draft.category ?? "");
        setCoverUrl(draft.coverUrl ?? "");
        setLastSaved(draft.savedAt ? new Date(draft.savedAt) : null);
        setDraftRestored(true);

        toast.info("Brouillon restauré", {
          description:
            "Votre dernière création a été récupérée automatiquement.",
        });
      }
    } catch {
      draftStore.remove(DRAFT_KEY);
    }
  }, []);

  /* ─────────── autosave ─────────── */
  useEffect(() => {
    if (!hasContent) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);

    autosaveTimer.current = setTimeout(() => {
      setSaving(true);
      try {
        const draft: ArticleDraft = {
          title,
          content,
          category,
          coverUrl,
          savedAt: new Date().toISOString(),
        };
        draftStore.set(DRAFT_KEY, JSON.stringify(draft));
        setLastSaved(new Date());
      } finally {
        setSaving(false);
      }
    }, 1200);

    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [title, content, category, coverUrl, hasContent]);

  const clearDraft = () => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    draftStore.remove(DRAFT_KEY);
    setDraftRestored(false);
    setLastSaved(null);
  };

  /* ─────────── publish ─────────── */
  const handlePublish = async () => {
    if (loading) return;
    if (!title.trim()) return toast.error("Le titre est requis.");
    if (title.trim().length < 3)
      return toast.error("Votre titre est trop court.");
    if (wordCount < 10) {
      return toast.error("Votre article est trop court.", {
        description: "Ajoutez au moins quelques phrases avant de publier.",
      });
    }

    setLoading(true);
    try {
      await createPublication({
        type: "article",
        title: title.trim(),
        description: content,
        category: category || undefined,
        images: coverUrl.trim() ? [coverUrl.trim()] : [],
        tags: category ? [category.toLowerCase()] : [],
        meta: JSON.stringify({ wordCount, readingTime }),
      });

      clearDraft();
      toast.success("Article publié !", {
        description:
          "Votre article est maintenant disponible dans DébrouillePro.",
      });
      onClose();
    } catch {
      toast.error("Publication impossible.", {
        description:
          "Une erreur est survenue. Votre brouillon reste sauvegardé.",
      });
    } finally {
      setLoading(false);
    }
  };

  const normalizedCoverUrl = coverUrl.trim();

  /* ========================================================================
   * RENDER
   * ====================================================================== */

  return (
    <FormWrapper title="Éditeur d'article" onBack={onBack} onClose={onClose}>
      {/* ───── STATUS BAR ───── */}
      <StatusBar
        wordCount={wordCount}
        readingTime={readingTime}
        characterCount={characterCount}
        saving={saving}
        lastSaved={lastSaved}
      />

      {/* ───── DRAFT RESTORED BANNER ───── */}
      {draftRestored ? <DraftBanner onClear={clearDraft} /> : null}

      {/* ───── CATEGORY ───── */}
      <CategoryPills
        cats={ARTICLE_CATS}
        active={category}
        onChange={setCategory}
      />

      {/* ───── COVER URL ───── */}
      <View style={{ marginBottom: 12 }}>
        <FieldShell focused={coverFocused}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <ImageIcon size={15} color="rgba(6,182,212,0.85)" />
            <TextInput
              value={coverUrl}
              onChangeText={(v) => {
                setCoverUrl(v);
                setCoverError(false);
              }}
              onFocus={() => setCoverFocused(true)}
              onBlur={() => setCoverFocused(false)}
              placeholder="URL de l'image de couverture"
              placeholderTextColor="rgba(255,255,255,0.28)"
              accessibilityLabel="URL de l'image de couverture"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={styles.input}
            />
            {coverUrl ? (
              <Pressable
                onPress={() => {
                  setCoverUrl("");
                  setCoverError(false);
                }}
                accessibilityLabel="Supprimer la couverture"
                hitSlop={8}
                style={({ pressed }) => [
                  styles.clearInputBtn,
                  pressed && styles.pressed,
                ]}
              >
                <X size={12} color="rgba(255,255,255,0.55)" />
              </Pressable>
            ) : null}
          </View>
        </FieldShell>
        <Text style={styles.helpText}>
          Une image de couverture donne davantage de présence à votre article.
        </Text>
      </View>

      {/* ───── COVER PREVIEW ───── */}
      {normalizedCoverUrl ? (
        <CoverPreview
          url={normalizedCoverUrl}
          error={coverError}
          onError={() => setCoverError(true)}
          onRemove={() => {
            setCoverUrl("");
            setCoverError(false);
          }}
        />
      ) : null}

      {/* ───── TITLE ───── */}
      <View style={{ marginBottom: 12 }}>
        <FieldShell focused={titleFocused}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            onFocus={() => setTitleFocused(true)}
            onBlur={() => setTitleFocused(false)}
            placeholder="Donnez un titre à votre article…"
            placeholderTextColor="rgba(255,255,255,0.28)"
            accessibilityLabel="Titre de l'article"
            maxLength={180}
            style={styles.titleInput}
          />
          <View style={{ alignItems: "flex-end", marginTop: 6 }}>
            <Text
              style={[
                styles.counterText,
                title.length > 160 && { color: "#FCD34D" },
              ]}
            >
              {title.length}/180
            </Text>
          </View>
        </FieldShell>
      </View>

      {/* ───── PREVIEW TOGGLE ───── */}
      <View style={styles.previewToggleRow}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Sparkles size={11} color={`${COLOR}CC`} />
          <Text style={styles.sectionEyebrow}>CONTENU</Text>
        </View>
        <Pressable
          onPress={() => setPreview((v) => !v)}
          style={({ pressed }) => [
            styles.previewToggle,
            preview && styles.previewToggleActive,
            pressed && styles.pressed,
          ]}
        >
          {preview ? (
            <EyeOff size={12} color={COLOR} />
          ) : (
            <Eye size={12} color="rgba(255,255,255,0.65)" />
          )}
          <Text style={[styles.previewToggleText, preview && { color: COLOR }]}>
            {preview ? "Modifier" : "Aperçu"}
          </Text>
        </Pressable>
      </View>

      {/* ───── EDITOR / PREVIEW ───── */}
      {preview ? (
        <PreviewPanel
          title={title}
          category={category}
          coverUrl={coverError ? "" : normalizedCoverUrl}
          content={content}
        />
      ) : (
        <ArticleEditor content={content} onChange={setContent} color={COLOR} />
      )}

      {/* ───── READINESS CHECKLIST ───── */}
      <View style={{ marginTop: 14, gap: 8 }}>
        <ReadinessRow
          label="Titre"
          ok={title.trim().length >= 3}
          hint={`${title.trim().length}/3 minimum`}
        />
        <ReadinessRow
          label="Contenu"
          ok={wordCount >= 10}
          hint={`${wordCount}/10 mots minimum`}
        />
      </View>

      {/* ───── PUBLISH CTA ───── */}
      <Pressable
        onPress={() => void handlePublish()}
        disabled={!canPublish}
        accessibilityRole="button"
        accessibilityLabel="Publier l'article"
        style={({ pressed }) => [
          styles.publishOuter,
          !canPublish && styles.publishDisabled,
          pressed && canPublish && styles.pressed,
        ]}
      >
        <LinearGradient
          colors={
            canPublish
              ? ["#06B6D4", "#0891B2", "#0E7490"]
              : ["#1E293B", "#0F172A"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.publishGradient}
        >
          {canPublish ? <ShineSweep /> : null}
          {loading ? (
            <>
              <LoadingSpinner />
              <Text style={styles.publishText}>Publication en cours…</Text>
            </>
          ) : (
            <>
              <Send size={15} color="#fff" strokeWidth={2.4} />
              <Text style={styles.publishText}>Publier l'article</Text>
            </>
          )}
        </LinearGradient>
      </Pressable>

      <Text style={styles.footerNote}>
        Votre brouillon est sauvegardé automatiquement pendant votre rédaction.
      </Text>
    </FormWrapper>
  );
}

/* ============================================================================
 * SUB-COMPONENTS
 * ========================================================================== */

function DraftBanner({ onClear }: { onClear: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim]);

  return (
    <Animated.View
      style={[
        styles.draftBanner,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [-8, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Save size={12} color={`${COLOR}CC`} />
      <Text style={styles.draftBannerText} numberOfLines={2}>
        Votre brouillon a été restauré automatiquement.
      </Text>
      <Pressable onPress={onClear} hitSlop={8}>
        <Text style={styles.draftBannerAction}>Effacer</Text>
      </Pressable>
    </Animated.View>
  );
}

function CoverPreview({
  url,
  error,
  onError,
  onRemove,
}: {
  url: string;
  error: boolean;
  onError: () => void;
  onRemove: () => void;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim]);

  if (error) {
    return (
      <Animated.View
        style={[
          styles.coverError,
          {
            opacity: anim,
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-8, 0],
                }),
              },
            ],
          },
        ]}
      >
        <ImageIcon size={14} color="#F87171" />
        <Text style={styles.coverErrorText}>
          Impossible de charger cette image.
        </Text>
        <Pressable onPress={onRemove} hitSlop={8}>
          <Text style={styles.coverErrorAction}>Retirer</Text>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.coverWrap,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [-8, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Image
        source={{ uri: url }}
        style={styles.coverImage}
        onError={onError}
        accessibilityLabel="Aperçu de la couverture"
      />
      <LinearGradient
        colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.55)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.coverOverlay}
        pointerEvents="none"
      />
      <View style={styles.coverBadge}>
        <ImageIcon size={10} color="rgba(255,255,255,0.85)" />
        <Text style={styles.coverBadgeText}>Couverture</Text>
      </View>
    </Animated.View>
  );
}

function PreviewPanel({
  title,
  category,
  coverUrl,
  content,
}: {
  title: string;
  category: string;
  coverUrl: string;
  content: string;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim]);

  const plain = stripHtml(content);

  return (
    <Animated.View
      style={[
        styles.previewPanel,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [8, 0],
              }),
            },
          ],
        },
      ]}
    >
      {title ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          <View style={styles.previewTitleBar} />
          <Text style={styles.previewTitle}>{title}</Text>
        </View>
      ) : null}

      {coverUrl ? (
        <Image
          source={{ uri: coverUrl }}
          style={styles.previewCover}
          accessibilityLabel="Couverture de l'article"
        />
      ) : null}

      <View style={{ paddingHorizontal: 20, paddingVertical: 20 }}>
        {category ? (
          <View style={styles.previewCategoryChip}>
            <Text style={styles.previewCategoryChipText}>{category}</Text>
          </View>
        ) : null}

        {plain ? (
          <Text style={styles.previewText}>{plain}</Text>
        ) : (
          <View style={styles.previewEmpty}>
            <Text style={styles.previewEmptyText}>
              Aucun contenu à afficher pour le moment.
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

function ReadinessRow({
  label,
  ok,
  hint,
}: {
  label: string;
  ok: boolean;
  hint: string;
}) {
  const anim = useRef(new Animated.Value(ok ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: ok ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [ok, anim]);

  const borderColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.08)", "rgba(16,185,129,0.32)"],
  });
  const backgroundColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.03)", "rgba(16,185,129,0.08)"],
  });

  return (
    <Animated.View
      style={[styles.readinessRow, { borderColor, backgroundColor }]}
    >
      <View style={[styles.readinessCheck, ok && styles.readinessCheckOk]}>
        <Check
          size={10}
          color={ok ? "#6EE7B7" : "rgba(255,255,255,0.3)"}
          strokeWidth={3}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.readinessLabel}>{label}</Text>
        <Text
          style={[
            styles.readinessHint,
            ok && { color: "rgba(110,231,183,0.75)" },
          ]}
        >
          {hint}
        </Text>
      </View>
    </Animated.View>
  );
}

function ShineSweep() {
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(x, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(2200),
        Animated.timing(x, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [x]);

  const translateX = x.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 500],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.shine,
        { transform: [{ translateX }, { skewX: "-20deg" }] },
      ]}
    />
  );
}

function LoadingSpinner() {
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [rotate]);

  const rotation = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: rotation }] }}>
      <Loader2 size={16} color="#fff" />
    </Animated.View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },

  ambientOrb: {
    position: "absolute",
    borderRadius: 9999,
    backgroundColor: "rgba(6,182,212,0.35)",
  },

  // Wrapper
  wrapperHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  wrapperTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.4,
  },
  wrapperSub: {
    marginTop: 3,
    fontSize: 10.5,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },
  editorBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: `${COLOR}20`,
    borderWidth: 1,
    borderColor: `${COLOR}40`,
  },
  editorBadgeText: {
    fontSize: 7.5,
    fontWeight: "900",
    letterSpacing: 1.4,
    color: COLOR,
  },
  iconBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  wrapperScroll: {
    paddingBottom: 40,
  },

  // Status bar
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 14,
    gap: 12,
  },
  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "rgba(255,255,255,0.55)",
  },
  statusTextDim: {
    fontSize: 10,
    color: "rgba(255,255,255,0.35)",
    fontWeight: "600",
  },
  statusSep: {
    width: 1,
    height: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  statusRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  // Draft banner
  draftBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: `${COLOR}10`,
    borderWidth: 1,
    borderColor: `${COLOR}28`,
    marginBottom: 14,
  },
  draftBannerText: {
    flex: 1,
    fontSize: 10,
    color: "rgba(255,255,255,0.55)",
    fontWeight: "500",
  },
  draftBannerAction: {
    fontSize: 10,
    fontWeight: "800",
    color: `${COLOR}CC`,
  },

  // Section header
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionEyebrow: {
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 1.8,
    color: "rgba(255,255,255,0.4)",
  },

  // Category pills
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  categoryPillActive: {
    borderColor: `${COLOR}66`,
    shadowColor: COLOR,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 0.2,
  },

  // Field shell
  fieldShell: {
    borderRadius: 19,
    borderWidth: 1,
    padding: 14,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    fontSize: 13.5,
    color: "#fff",
    fontWeight: "500",
  },
  clearInputBtn: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  titleInput: {
    fontSize: 17,
    fontWeight: "900",
    color: "#fff",
    paddingVertical: 0,
    letterSpacing: -0.4,
  },
  counterText: {
    fontSize: 9.5,
    color: "rgba(255,255,255,0.3)",
    fontWeight: "700",
  },
  helpText: {
    marginTop: 6,
    marginHorizontal: 4,
    fontSize: 9.5,
    color: "rgba(255,255,255,0.3)",
  },

  // Cover preview
  coverWrap: {
    marginBottom: 14,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  coverImage: {
    width: "100%",
    height: 170,
  },
  coverOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
  },
  coverBadge: {
    position: "absolute",
    left: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  coverBadgeText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.3,
  },
  coverError: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.22)",
    marginBottom: 14,
  },
  coverErrorText: {
    flex: 1,
    fontSize: 10.5,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500",
  },
  coverErrorAction: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FCA5A5",
  },

  // Preview toggle
  previewToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  previewToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  previewToggleActive: {
    backgroundColor: `${COLOR}18`,
    borderColor: `${COLOR}55`,
  },
  previewToggleText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 0.2,
  },

  // Preview panel
  previewPanel: {
    marginBottom: 14,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  previewTitleBar: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLOR,
    marginBottom: 10,
    shadowColor: COLOR,
    shadowOpacity: 0.7,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  previewCover: {
    width: "100%",
    height: 190,
    marginTop: 14,
  },
  previewCategoryChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: `${COLOR}18`,
    borderWidth: 1,
    borderColor: `${COLOR}40`,
    marginBottom: 12,
  },
  previewCategoryChipText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: COLOR,
    letterSpacing: 0.3,
  },
  previewText: {
    fontSize: 13,
    lineHeight: 21,
    color: "rgba(255,255,255,0.75)",
  },
  previewEmpty: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  previewEmptyText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.3)",
    fontWeight: "500",
  },

  // Readiness
  readinessRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  readinessCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  readinessCheckOk: {
    backgroundColor: "rgba(16,185,129,0.18)",
    borderColor: "rgba(16,185,129,0.4)",
  },
  readinessLabel: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 0.2,
  },
  readinessHint: {
    marginTop: 2,
    fontSize: 9.5,
    fontWeight: "600",
    color: "rgba(255,255,255,0.35)",
  },

  // Publish CTA
  publishOuter: {
    marginTop: 16,
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: COLOR,
    shadowOpacity: 0.5,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },
  publishDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  publishGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 17,
    paddingHorizontal: 24,
    borderRadius: 22,
    overflow: "hidden",
  },
  publishText: {
    fontSize: 14.5,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.3,
  },
  shine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 60,
    backgroundColor: "rgba(255,255,255,0.28)",
    opacity: 0.6,
  },
  footerNote: {
    marginTop: 12,
    paddingBottom: 4,
    textAlign: "center",
    fontSize: 9.5,
    lineHeight: 15,
    color: "rgba(255,255,255,0.3)",
    fontWeight: "500",
  },
});
