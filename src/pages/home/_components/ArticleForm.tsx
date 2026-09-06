import { UIService } from "@/core/sdk/ui/UIService";
import { Pressable, View, Text, Image, TextInput } from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Clock3,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  Save,
  Send,
  Sparkles,
  Tag,
  X,
} from "lucide-react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import ArticleEditor from "@/components/ArticleEditor";

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
const DRAFT_KEY = "article_draft";

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

function FormWrapper({
  title,
  onBack,
  onClose,
  children,
}: {
  title: string;
  onBack: () => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <View className="flex min-h-0 flex-col">
      <View className="mb-5 flex items-center gap-3">
        <Pressable
          onPress={onBack}
          accessibilityLabel="Retour"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-white/70"
          style={{ backgroundColor: "rgba(255,255,255,0.055)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}
        >
          <ArrowLeft size={16} />
        </Pressable>

        <View className="min-w-0 flex-1">
          <View className="flex items-center gap-2">
            <Text className="truncate text-base font-black tracking-tight text-white">
              {title}
            </Text>

            <Text
              className="hidden rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wider sm:inline-flex"
              style={{ color: COLOR, backgroundColor: `${COLOR}12`, borderStyle: "solid" }}
            >
              Éditeur
            </Text>
          </View>

          <Text className="mt-0.5 text-[10px] text-white/25">
            Créez un contenu qui mérite d&apos;être découvert.
          </Text>
        </View>

        <Pressable
          onPress={onClose}
          accessibilityLabel="Fermer"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-white/45"
          style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}
        >
          <X size={16} />
        </Pressable>
      </View>

      {children}
    </View>
  );
}

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
    <View className="mb-4">
      <View className="mb-2 flex items-center gap-2">
        <Tag size={11} style={{ color: `${COLOR}cc` }} />
        <Text className="text-[9px] font-black uppercase tracking-[0.16em] text-white/25">
          Catégorie
        </Text>
      </View>

      <View
        className="flex gap-2 overflow-x-auto pb-1"
        style={{  }}
      >
        {cats.map((category) => {
          const activeCategory = active === category;

          return (
            <Pressable
              key={category}
              onPress={() => onChange(category)}
              aria-pressed={activeCategory}
              className="flex-shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold"
              style={{ backgroundColor: activeCategory
                                ? `${COLOR}18`
                                : "rgba(255,255,255,0.045)", borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}
            >
              {activeCategory && (
                <Check
                  size={10}
                  className="mr-1 inline-block"
                  strokeWidth={3}
                />
              )}
              {category}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function FieldShell({
  children,
  focused = false,
}: {
  children: React.ReactNode;
  focused?: boolean;
}) {
  return (
    <View
      className="rounded-[19px] border p-3.5"
     
    >
      {children}
    </View>
  );
}

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

  /*
   * ─────────────────────────────────────────────
   * RESTAURATION DU BROUILLON
   * ─────────────────────────────────────────────
   */

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);

      if (!raw) return;

      const draft = JSON.parse(raw) as ArticleDraft;

      if (draft.title || draft.content || draft.category || draft.coverUrl) {
        setTitle(draft.title ?? "");
        setContent(draft.content ?? "");
        setCategory(draft.category ?? "");
        setCoverUrl(draft.coverUrl ?? "");

        setLastSaved(draft.savedAt ? new Date(draft.savedAt) : null);

        setDraftRestored(true);

        UIService.openToast("Brouillon restauré", "info");
      }
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  /*
   * ─────────────────────────────────────────────
   * AUTOSAVE
   * ─────────────────────────────────────────────
   */

  useEffect(() => {
    if (!hasContent) return;

    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
    }

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

        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));

        setLastSaved(new Date());
      } finally {
        setSaving(false);
      }
    }, 1200);

    return () => {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
      }
    };
  }, [title, content, category, coverUrl, hasContent]);

  const clearDraft = () => {
    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
    }

    localStorage.removeItem(DRAFT_KEY);
    setDraftRestored(false);
    setLastSaved(null);
  };

  /*
   * ─────────────────────────────────────────────
   * PUBLICATION
   * ─────────────────────────────────────────────
   */

  const handlePublish = async () => {
    if (loading) return;

    if (!title.trim()) {
      UIService.openToast("Le titre est requis.", "error");
      return;
    }

    if (title.trim().length < 3) {
      UIService.openToast("Votre titre est trop court.", "error");
      return;
    }

    if (wordCount < 10) {
      UIService.openToast("Votre article est trop court.", "error");
      return;
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
        meta: JSON.stringify({
          wordCount,
          readingTime,
        }),
      });

      clearDraft();

      UIService.openToast("Article publié !", "success");

      onClose();
    } catch {
      UIService.openToast("Publication impossible.", "error");
    } finally {
      setLoading(false);
    }
  };

  /*
   * ─────────────────────────────────────────────
   * COVER
   * ─────────────────────────────────────────────
   */

  const normalizedCoverUrl = coverUrl.trim();

  /*
   * ─────────────────────────────────────────────
   * UI
   * ─────────────────────────────────────────────
   */

  return (
    <FormWrapper title="Éditeur d'article" onBack={onBack} onClose={onClose}>
      {/* Ambient header */}
      <View className="absolute left-1/2 top-0 -z-10 h-40 w-[80%] -translate-x-1/2 rounded-full bg-cyan-400/[0.04]" />

      {/* ─────────────────────────────────────────
          STATUS BAR
      ───────────────────────────────────────── */}

      <View className="mb-4 flex items-center gap-2 overflow-hidden rounded-2xl px-3 py-2.5">
        <View
          className="flex min-w-0 flex-1 items-center gap-3"
          style={{ backgroundColor: "rgba(255,255,255,0.035)" }}
        >
          <View className="flex items-center gap-1.5">
            <BookOpen size={12} style={{ color: `${COLOR}cc` }} />
            <Text className="text-[10px] font-semibold text-white/38">
              {wordCount} mots
            </Text>
          </View>

          <Text className="h-3 w-px bg-white/[0.08]" />

          <View className="flex items-center gap-1.5">
            <Clock3 size={12} style={{ color: `${COLOR}cc` }} />
            <Text className="text-[10px] font-semibold text-white/38">
              ~{readingTime} min
            </Text>
          </View>

          <Text className="hidden h-3 w-px bg-white/[0.08] sm:block" />

          <Text className="hidden text-[10px] text-white/22 sm:inline">
            {characterCount.toLocaleString("fr-FR")} caractères
          </Text>
        </View>

        <>
          {saving ? (
            <View
              key="saving"
              className="flex flex-shrink-0 items-center gap-1.5"
            >
              <Loader2 size={11} className="animate-spin text-white/30" />
              <Text className="text-[9px] font-semibold text-white/30">
                Sauvegarde
              </Text>
            </View>
          ) : lastSaved ? (
            <View
              key="saved"
              className="flex flex-shrink-0 items-center gap-1.5"
            >
              <Save size={11} style={{ color: `${COLOR}99` }} />
              <Text
                className="text-[9px] font-semibold"
                style={{ color: `${COLOR}99` }}
              >
                {lastSaved.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          ) : null}
        </>
      </View>

      {/* Draft restored indicator */}
      <>
        {draftRestored && (
          <View
            className="mb-3 flex items-center gap-2 overflow-hidden rounded-2xl px-3 py-2.5"
            style={{ backgroundColor: `${COLOR}08`, borderStyle: "solid" }}
          >
            <Save size={12} style={{ color: `${COLOR}aa` }} />

            <Text className="flex-1 text-[9px] font-medium text-white/38">
              Votre brouillon a été restauré automatiquement.
            </Text>

            <Pressable
             
              onPress={clearDraft}
              className="text-[9px] font-bold text-white/25"
            >
              <Text>Effacer</Text></Pressable>
          </View>
        )}
      </>

      {/* ─────────────────────────────────────────
          CATEGORY
      ───────────────────────────────────────── */}

      <CategoryPills
        cats={ARTICLE_CATS}
        active={category}
        onChange={setCategory}
      />

      {/* ─────────────────────────────────────────
          COVER
      ───────────────────────────────────────── */}

      <View className="mb-3">
        <FieldShell focused={coverFocused}>
          <View className="flex items-center gap-2.5">
            <ImageIcon size={14} style={{ color: `${COLOR}cc` }} />

            <TextInput
              value={coverUrl}
              onChangeText={(text) => {
                setCoverUrl(text);
                setCoverError(false);
              }}
              onFocus={() => setCoverFocused(true)}
              onBlur={() => setCoverFocused(false)}
              placeholder="URL de l'image de couverture"
              accessibilityLabel="URL de l'image de couverture"
              inputMode="url"
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/22"
            />

            {coverUrl && (
              <Pressable
               
                onPress={() => {
                  setCoverUrl("");
                  setCoverError(false);
                }}
                accessibilityLabel="Supprimer la couverture"
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-white/30"
              >
                <X size={12} />
              </Pressable>
            )}
          </View>
        </FieldShell>

        <Text className="mt-1.5 px-1 text-[9px] text-white/20">
          Une image de couverture donne davantage de présence à votre article.
        </Text>
      </View>

      {/* Cover preview */}
      <>
        {normalizedCoverUrl && (
          <View
            className="mb-3 overflow-hidden"
          >
            {!coverError ? (
              <View
                className="group relative overflow-hidden rounded-[22px]"
                style={{ borderWidth: 1, borderColor: "rgba(255,255,255,.08)", borderStyle: "solid", backgroundColor: "rgba(255,255,255,.03)" }}
              >
                <Image
                 
                 
                  className="h-40 w-full object-cover"
                  onError={() => setCoverError(true)}
                 source={{ uri: normalizedCoverUrl }} accessibilityLabel="Aperçu de la couverture"/>

                <View className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />

                <View className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1.5">
                  <ImageIcon size={10} className="text-white/60" />
                  <Text className="text-[9px] font-semibold text-white/60">
                    Couverture
                  </Text>
                </View>
              </View>
            ) : (
              <View
                className="flex items-center gap-3 rounded-2xl p-3"
                style={{ backgroundColor: "rgba(239,68,68,.06)", borderWidth: 1, borderColor: "rgba(239,68,68,.16)", borderStyle: "solid" }}
              >
                <ImageIcon size={14} className="text-red-400/70" />

                <Text className="flex-1 text-[10px] text-white/35">
                  Impossible de charger cette image.
                </Text>

                <Pressable
                 
                  onPress={() => {
                    setCoverUrl("");
                    setCoverError(false);
                  }}
                  className="text-[9px] font-bold text-red-300/70"
                >
                  <Text>Retirer</Text></Pressable>
              </View>
            )}
          </View>
        )}
      </>

      {/* ─────────────────────────────────────────
          TITLE
      ───────────────────────────────────────── */}

      <View className="mb-3">
        <FieldShell focused={titleFocused}>
          <TextInput
            value={title}
            onChangeText={(text) => setTitle(text)}
            onFocus={() => setTitleFocused(true)}
            onBlur={() => setTitleFocused(false)}
            placeholder="Donnez un titre à votre article…"
            accessibilityLabel="Titre de l'article"
            maxLength={180}
            className="w-full bg-transparent text-[17px] font-black tracking-tight text-white outline-none placeholder:text-white/20"
          />

          <View className="mt-2 flex justify-end">
            <Text
              className={`text-[9px] ${
                title.length > 160 ? "text-amber-300/70" : "text-white/18"
              }`}
            >
              {title.length}/180
            </Text>
          </View>
        </FieldShell>
      </View>

      {/* ─────────────────────────────────────────
          PREVIEW SWITCH
      ───────────────────────────────────────── */}

      <View className="mb-2 flex items-center justify-between">
        <View className="flex items-center gap-2">
          <Sparkles size={11} style={{ color: `${COLOR}88` }} />
          <Text className="text-[9px] font-black uppercase tracking-[0.15em] text-white/20">
            Contenu
          </Text>
        </View>

        <Pressable
          onPress={() => setPreview((value) => !value)}
          aria-pressed={preview}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[9px] font-bold"
          style={{ backgroundColor: preview ? `${COLOR}12` : "rgba(255,255,255,.045)", borderColor: "rgba(255,255,255,.07)", borderStyle: "solid" }}
        >
          {preview ? <EyeOff size={11} /> : <Eye size={11} />}

          {preview ? "Modifier" : "Aperçu"}
        </Pressable>
      </View>

      {/* ─────────────────────────────────────────
          EDITOR / PREVIEW
      ───────────────────────────────────────── */}

      <>
        {preview ? (
          <View
            key="preview"
            className="article-editor-content mb-3 min-h-[220px] overflow-hidden rounded-[23px]"
            style={{ backgroundColor: "rgba(255,255,255,.035)", borderWidth: 1, borderColor: "rgba(255,255,255,.075)", borderStyle: "solid" }}
          >
            {title && (
              <View className="px-5 pt-5">
                <View
                  className="mb-2 h-1 w-8 rounded-full"
                  style={{ backgroundColor: COLOR }}
                />

                <Text className="text-xl font-black leading-tight tracking-tight text-white">
                  {title}
                </Text>
              </View>
            )}

            {normalizedCoverUrl && !coverError && (
              <Image
               
               
                className="mt-4 h-48 w-full object-cover"
                onError={() => setCoverError(true)}
               source={{ uri: normalizedCoverUrl }} accessibilityLabel="Couverture de l'article"/>
            )}

            <View className="px-5 py-5">
              {category && (
                <View
                  className="mb-4 inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-bold"
                  style={{ backgroundColor: `${COLOR}12`, borderStyle: "solid" }}
                >
                  {category}
                </View>
              )}

              {content ? (
                <View
                  className="tiptap text-white/70"
                  dangerouslySetInnerHTML={{
                    __html: content,
                  }}
                />
              ) : (
                <View className="flex min-h-[120px] items-center justify-center text-center">
                  <Text className="text-xs text-white/20">
                    Aucun contenu à afficher pour le moment.
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View
            key="editor"
          >
            <ArticleEditor
              content={content}
              onChange={setContent}
              color={COLOR}
            />
          </View>
        )}
      </>

      {/* ─────────────────────────────────────────
          PUBLISH READINESS
      ───────────────────────────────────────── */}

      <View className="mt-3 gap-2">
        <View
          className="flex items-center gap-2 rounded-2xl px-3 py-2.5"
          style={{ backgroundColor: title.trim().length >= 3
                          ? "rgba(16,185,129,.055)"
                          : "rgba(255,255,255,.03)", borderWidth: 3, borderColor: "rgba(16,185,129,.15)", borderStyle: "solid" }}
        >
          <View
            className="flex h-5 w-5 items-center justify-center rounded-full"
            style={{ backgroundColor: title.trim().length >= 3
                              ? "rgba(16,185,129,.14)"
                              : "rgba(255,255,255,.06)" }}
          >
            <Check
              size={10}
              className={
                title.trim().length >= 3 ? "text-emerald-300" : "text-white/15"
              }
            />
          </View>

          <Text className="text-[9px] font-semibold text-white/35">Titre</Text>
        </View>

        <View
          className="flex items-center gap-2 rounded-2xl px-3 py-2.5"
          style={{ backgroundColor: wordCount >= 10
                          ? "rgba(16,185,129,.055)"
                          : "rgba(255,255,255,.03)", borderWidth: 10, borderColor: "rgba(16,185,129,.15)", borderStyle: "solid" }}
        >
          <View
            className="flex h-5 w-5 items-center justify-center rounded-full"
            style={{ backgroundColor: wordCount >= 10
                              ? "rgba(16,185,129,.14)"
                              : "rgba(255,255,255,.06)" }}
          >
            <Check
              size={10}
              className={wordCount >= 10 ? "text-emerald-300" : "text-white/15"}
            />
          </View>

          <Text className="text-[9px] font-semibold text-white/35">
            <Text>Contenu</Text></Text>
        </View>
      </View>

      {/* ─────────────────────────────────────────
          PUBLISH CTA
      ───────────────────────────────────────── */}

      <Pressable
        disabled={!canPublish}
        onPress={() => void handlePublish()}
        className="group relative mt-3 flex w-full items-center justify-center gap-2 overflow-hidden rounded-[22px] py-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-35"
        style={{  }}
      >
        {!loading && canPublish && (
          <View
            className="absolute inset-y-0 -left-1/3 w-1/3"
            style={{  }}
          />
        )}

        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Publication en cours…
          </>
        ) : (
          <>
            <Send size={15} />
            Publier l&apos;article
          </>
        )}
      </Pressable>

      <Text className="mt-2 pb-1 text-center text-[9px] leading-4 text-white/18">
        Votre brouillon est sauvegardé automatiquement pendant votre rédaction.
      </Text>
    </FormWrapper>
  );
}
