// src/pages/modules/StoriesCreatorPage.tsx

import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from "react-native";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  Music,
  Palette,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Send,
  Smile,
  Trash2,
  Type,
  Volume2,
  VolumeX,
  X,
  Zap,
  Bold,
  Italic,
  Loader2,
} from "lucide-react-native";

import { useMutation } from "convex/react";
import { useConvexAuth } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type AnimPreset = "fadeIn" | "slideUp" | "slideLeft" | "zoomIn" | "bounce";

type TextElem = {
  id: string;
  kind: "text";
  text: string;
  color: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  x: number;
  y: number;
  anim: AnimPreset;
};

type StickerElem = {
  id: string;
  kind: "sticker";
  emoji: string;
  size: number;
  x: number;
  y: number;
  anim: AnimPreset;
};

type SlideElem = TextElem | StickerElem;

type Slide = {
  id: string;
  bg: string;
  elements: SlideElem[];
  music: string | null;
  duration: number;
};

interface Props {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────

const BG_PRESETS = [
  "#111827",
  "#1e3a5f",
  "#1a1a2e",
  "#4c1d95",
  "#064e3b",
  "#7f1d1d",
  "#667eea",
  "#764ba2",
  "#f093fb",
  "#f5576c",
  "#4facfe",
  "#00a8ff",
  "#43e97b",
  "#38f9d7",
  "#fa709a",
  "#fbbf24",
  "#a18cd1",
  "#fbc2eb",
  "#ff9a9e",
  "#2d3561",
];

const MUSIC_TRACKS = [
  {
    id: "afro1",
    label: "Afrobeat Vibes",
    emoji: "🎵",
    bpm: 120,
  },
  {
    id: "chill1",
    label: "Chill Lofi",
    emoji: "🎶",
    bpm: 85,
  },
  {
    id: "hype1",
    label: "Hype Energy",
    emoji: "🔥",
    bpm: 140,
  },
  {
    id: "gospel1",
    label: "Gospel Praise",
    emoji: "🙌",
    bpm: 100,
  },
  {
    id: "jazz1",
    label: "Jazz Smooth",
    emoji: "🎷",
    bpm: 95,
  },
  {
    id: "trap1",
    label: "Urban Trap",
    emoji: "💎",
    bpm: 130,
  },
];

const STICKER_LIST = [
  "🔥",
  "💯",
  "⭐",
  "🎉",
  "🏆",
  "💎",
  "✨",
  "🚀",
  "💪",
  "👑",
  "❤️",
  "😍",
  "🌍",
  "📱",
  "💰",
  "🌊",
  "🎵",
  "💡",
  "🌸",
  "🦋",
];

const TEXT_COLORS = [
  "#ffffff",
  "#000000",
  "#f59e0b",
  "#ef4444",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#fbbf24",
];

const ANIM_PRESETS: {
  id: AnimPreset;
  label: string;
}[] = [
  {
    id: "fadeIn",
    label: "Fondu",
  },
  {
    id: "slideUp",
    label: "Montée",
  },
  {
    id: "slideLeft",
    label: "Glisse",
  },
  {
    id: "zoomIn",
    label: "Zoom",
  },
  {
    id: "bounce",
    label: "Rebond",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function uid(): string {
  return `story-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function makeSlide(): Slide {
  return {
    id: uid(),
    bg: BG_PRESETS[0],
    elements: [],
    music: null,
    duration: 3,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ─────────────────────────────────────────────────────────────────────────────
// Slide Canvas
// ─────────────────────────────────────────────────────────────────────────────

interface SlideCanvasProps {
  slide: Slide;
  selected: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  preview?: boolean;
}

function SlideCanvas({
  slide,
  selected,
  onSelect,
  onMove,
  preview = false,
}: SlideCanvasProps) {
  const layoutRef = useRef({
    width: 1,
    height: 1,
  });

  const draggingRef = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;

    layoutRef.current = {
      width,
      height,
    };
  };

  const handlePointerDown = (
    event: GestureResponderEvent,
    element: SlideElem,
  ) => {
    if (preview) {
      return;
    }

    const { locationX, locationY } = event.nativeEvent;

    const width = layoutRef.current.width;
    const height = layoutRef.current.height;

    const currentX = (locationX / width) * 100;
    const currentY = (locationY / height) * 100;

    draggingRef.current = {
      id: element.id,
      offsetX: currentX - element.x,
      offsetY: currentY - element.y,
    };

    onSelect(element.id);
  };

  const handlePointerMove = (event: GestureResponderEvent) => {
    if (preview || !draggingRef.current) {
      return;
    }

    const { locationX, locationY } = event.nativeEvent;

    const width = layoutRef.current.width;
    const height = layoutRef.current.height;

    const currentX = (locationX / width) * 100;
    const currentY = (locationY / height) * 100;

    const x = clamp(currentX - draggingRef.current.offsetX, 5, 95);

    const y = clamp(currentY - draggingRef.current.offsetY, 5, 95);

    onMove(draggingRef.current.id, x, y);
  };

  const handlePointerUp = () => {
    draggingRef.current = null;
  };

  return (
    <View
      onLayout={handleLayout}
      onTouchStart={() => {
        if (!preview) {
          onSelect("");
        }
      }}
      style={[
        styles.canvas,
        {
          backgroundColor: slide.bg,
        },
      ]}
    >
      {slide.elements.map((element) => {
        const isSelected = !preview && selected === element.id;

        return (
          <View
            key={element.id}
            style={[
              styles.canvasElement,
              {
                left: `${element.x}%`,
                top: `${element.y}%`,
              },
              isSelected && styles.canvasElementSelected,
            ]}
            onStartShouldSetResponder={() => !preview}
            onMoveShouldSetResponder={() => !preview}
            onResponderGrant={(event) => handlePointerDown(event, element)}
            onResponderMove={handlePointerMove}
            onResponderRelease={handlePointerUp}
            onResponderTerminate={handlePointerUp}
          >
            {element.kind === "text" ? (
              <Text
                style={{
                  color: element.color,
                  fontSize: element.fontSize,
                  fontWeight: element.bold ? "800" : "400",
                  fontStyle: element.italic ? "italic" : "normal",
                  textAlign: "center",
                  maxWidth: 220,
                }}
              >
                {element.text}
              </Text>
            ) : (
              <Text
                style={{
                  fontSize: element.size,
                }}
              >
                {element.emoji}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Thumbnail
// ─────────────────────────────────────────────────────────────────────────────

interface SlideThumbnailProps {
  slide: Slide;
  active: boolean;
  index: number;
  onPress: () => void;
}

function SlideThumbnail({
  slide,
  active,
  index,
  onPress,
}: SlideThumbnailProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.thumbnail,
        {
          backgroundColor: slide.bg,
        },
        active && styles.thumbnailActive,
      ]}
    >
      <Text style={styles.thumbnailText}>{index + 1}</Text>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function StoriesCreatorPage({ onBack, onNavigate }: Props) {
  const { isAuthenticated } = useConvexAuth();

  const createStory = useMutation(api.stories.createStory);

  const [slides, setSlides] = useState<Slide[]>([makeSlide()]);

  const [activeIdx, setActiveIdx] = useState(0);

  const [selectedElem, setSelectedElem] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    "bg" | "text" | "stickers" | "music" | "anim"
  >("bg");

  const [previewMode, setPreviewMode] = useState(false);

  const [previewIdx, setPreviewIdx] = useState(0);

  const [muted, setMuted] = useState(false);

  const [publishing, setPublishing] = useState(false);

  const [editText, setEditText] = useState("Votre texte ici");

  const [editColor, setEditColor] = useState("#ffffff");

  const [editSize, setEditSize] = useState(28);

  const [editBold, setEditBold] = useState(true);

  const [editItalic, setEditItalic] = useState(false);

  const [editAnim, setEditAnim] = useState<AnimPreset>("slideUp");

  const slide = slides[activeIdx];

  const selectedElemData = useMemo(
    () =>
      slide?.elements.find((element) => element.id === selectedElem) ?? null,
    [slide, selectedElem],
  );

  // ───────────────────────────────────────────────────────────────────────────
  // Slide management
  // ───────────────────────────────────────────────────────────────────────────

  const addSlide = () => {
    const nextSlide = makeSlide();

    setSlides((previous) => [...previous, nextSlide]);

    setActiveIdx(slides.length);
    setSelectedElem(null);
  };

  const deleteSlide = (index: number) => {
    if (slides.length <= 1) {
      Alert.alert("Impossible", "Il faut au moins une slide.");
      return;
    }

    setSlides((previous) =>
      previous.filter((_, currentIndex) => currentIndex !== index),
    );

    setActiveIdx(Math.max(0, index - 1));

    setSelectedElem(null);
  };

  const duplicateSlide = (index: number) => {
    const source = slides[index];

    if (!source) {
      return;
    }

    const clone: Slide = {
      ...source,
      id: uid(),
      elements: source.elements.map((element) => ({
        ...element,
        id: uid(),
      })),
    };

    setSlides((previous) => {
      const next = [...previous];

      next.splice(index + 1, 0, clone);

      return next;
    });

    setActiveIdx(index + 1);
    setSelectedElem(null);
  };

  const updateSlide = (update: Partial<Slide>) => {
    setSlides((previous) =>
      previous.map((currentSlide, index) =>
        index === activeIdx
          ? {
              ...currentSlide,
              ...update,
            }
          : currentSlide,
      ),
    );
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Elements
  // ───────────────────────────────────────────────────────────────────────────

  const addText = () => {
    if (!slide) {
      return;
    }

    const element: TextElem = {
      id: uid(),
      kind: "text",
      text: editText.trim() || "Votre texte ici",
      color: editColor,
      fontSize: editSize,
      bold: editBold,
      italic: editItalic,
      x: 50,
      y: 50,
      anim: editAnim,
    };

    updateSlide({
      elements: [...slide.elements, element],
    });

    setSelectedElem(element.id);
  };

  const addSticker = (emoji: string) => {
    if (!slide) {
      return;
    }

    const element: StickerElem = {
      id: uid(),
      kind: "sticker",
      emoji,
      size: 52,
      x: 50,
      y: 50,
      anim: editAnim,
    };

    updateSlide({
      elements: [...slide.elements, element],
    });

    setSelectedElem(element.id);
  };

  const deleteElem = (id: string) => {
    if (!slide) {
      return;
    }

    updateSlide({
      elements: slide.elements.filter((element) => element.id !== id),
    });

    setSelectedElem(null);
  };

  const moveElem = (id: string, x: number, y: number) => {
    if (!slide) {
      return;
    }

    updateSlide({
      elements: slide.elements.map((element) =>
        element.id === id
          ? {
              ...element,
              x,
              y,
            }
          : element,
      ),
    });
  };

  const selectElem = (id: string) => {
    if (!id) {
      setSelectedElem(null);
      return;
    }

    setSelectedElem(id);

    const element = slide?.elements.find((item) => item.id === id);

    if (element?.kind === "text") {
      setEditText(element.text);
      setEditColor(element.color);
      setEditSize(element.fontSize);
      setEditBold(element.bold);
      setEditItalic(element.italic);
      setEditAnim(element.anim);
    }

    if (element && element.kind === "sticker") {
      setEditAnim(element.anim);
    }
  };

  const updateSelectedElem = () => {
    if (!slide || !selectedElem) {
      return;
    }

    updateSlide({
      elements: slide.elements.map((element) => {
        if (element.id !== selectedElem) {
          return element;
        }

        if (element.kind === "text") {
          return {
            ...element,
            text: editText || element.text,
            color: editColor,
            fontSize: editSize,
            bold: editBold,
            italic: editItalic,
            anim: editAnim,
          };
        }

        return {
          ...element,
          anim: editAnim,
        };
      }),
    });
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Preview
  // ───────────────────────────────────────────────────────────────────────────

  const startPreview = () => {
    setPreviewIdx(0);
    setPreviewMode(true);
  };

  const nextPreviewSlide = () => {
    if (previewIdx < slides.length - 1) {
      setPreviewIdx((previous) => previous + 1);
      return;
    }

    setPreviewMode(false);
  };

  const prevPreviewSlide = () => {
    setPreviewIdx((previous) => Math.max(0, previous - 1));
  };

  const previewSlide = slides[previewIdx];

  const currentMusic = MUSIC_TRACKS.find(
    (track) => track.id === previewSlide?.music,
  );

  // ───────────────────────────────────────────────────────────────────────────
  // Publish
  // ───────────────────────────────────────────────────────────────────────────

  const handlePublish = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        "Connexion requise",
        "Connectez-vous pour publier une story.",
      );
      return;
    }

    if (slides.length === 0) {
      Alert.alert("Story vide", "Ajoutez au moins une slide.");
      return;
    }

    setPublishing(true);

    try {
      for (const currentSlide of slides) {
        const textParts = currentSlide.elements
          .filter((element): element is TextElem => element.kind === "text")
          .map((element) => element.text);

        const stickerParts = currentSlide.elements
          .filter(
            (element): element is StickerElem => element.kind === "sticker",
          )
          .map((element) => element.emoji);

        const caption = [...textParts, ...stickerParts].join(" ").trim();

        const mediaUrl = `data:slide/${encodeURIComponent(
          JSON.stringify({
            bg: currentSlide.bg,
            elements: currentSlide.elements,
            music: currentSlide.music,
          }),
        )}`;

        await createStory({
          mediaUrl,
          mediaType: "image",
          caption: caption || undefined,
          duration: currentSlide.duration,
        });
      }

      Alert.alert("Succès", "Story publiée avec succès !");

      if (onNavigate) {
        onNavigate("live");
      } else {
        onBack();
      }
    } catch (error) {
      Alert.alert(
        "Erreur",
        error instanceof Error
          ? error.message
          : "Erreur lors de la publication.",
      );
    } finally {
      setPublishing(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Header */}

      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.iconButton}>
          <ArrowLeft size={20} color="#ffffff" />
        </Pressable>

        <View style={styles.headerContent}>
          <Text style={styles.title}>Créateur de Stories</Text>

          <Text style={styles.subtitle}>
            {slides.length} slide
            {slides.length > 1 ? "s" : ""}
          </Text>
        </View>

        <Pressable onPress={startPreview} style={styles.previewButton}>
          <Eye size={16} color="#ffffff" />

          <Text style={styles.previewButtonText}>Aperçu</Text>
        </Pressable>

        <Pressable
          disabled={publishing}
          onPress={() => void handlePublish()}
          style={[styles.publishButton, publishing && styles.disabledButton]}
        >
          {publishing ? (
            <Loader2 size={16} color="#ffffff" />
          ) : (
            <Send size={16} color="#ffffff" />
          )}

          <Text style={styles.publishButtonText}>
            {publishing ? "..." : "Publier"}
          </Text>
        </Pressable>
      </View>

      {/* Slides */}

      <View style={styles.slideStrip}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.slideStripContent}
        >
          {slides.map((currentSlide, index) => (
            <View key={currentSlide.id} style={styles.thumbnailContainer}>
              <SlideThumbnail
                slide={currentSlide}
                active={index === activeIdx}
                index={index}
                onPress={() => {
                  setActiveIdx(index);
                  setSelectedElem(null);
                }}
              />

              <View style={styles.thumbnailActions}>
                <Pressable
                  onPress={() => duplicateSlide(index)}
                  style={styles.smallIconButton}
                >
                  <Copy size={13} color="#9ca3af" />
                </Pressable>

                <Pressable
                  onPress={() => deleteSlide(index)}
                  style={styles.smallIconButton}
                >
                  <Trash2 size={13} color="#f87171" />
                </Pressable>
              </View>
            </View>
          ))}

          <Pressable onPress={addSlide} style={styles.addSlideButton}>
            <Plus size={24} color="#9ca3af" />
          </Pressable>
        </ScrollView>
      </View>

      {/* Main editor */}

      <View style={styles.editor}>
        <ScrollView contentContainerStyle={styles.canvasArea}>
          <View style={styles.canvasWrapper}>
            {slide && (
              <SlideCanvas
                slide={slide}
                selected={selectedElem}
                onSelect={selectElem}
                onMove={moveElem}
              />
            )}

            {slide?.music && (
              <View style={styles.musicBadge}>
                <Music size={13} color="#c084fc" />

                <Text style={styles.musicBadgeText}>
                  {
                    MUSIC_TRACKS.find((track) => track.id === slide.music)
                      ?.label
                  }
                </Text>
              </View>
            )}
          </View>

          {selectedElem && (
            <View style={styles.quickActions}>
              <Pressable
                onPress={() => deleteElem(selectedElem)}
                style={[styles.quickAction, styles.deleteQuickAction]}
              >
                <Trash2 size={18} color="#f87171" />
              </Pressable>

              <Pressable
                onPress={() => {
                  updateSelectedElem();
                  setSelectedElem(null);
                }}
                style={[styles.quickAction, styles.confirmQuickAction]}
              >
                <Check size={18} color="#34d399" />
              </Pressable>
            </View>
          )}
        </ScrollView>

        {/* Bottom panel */}

        <View style={styles.bottomPanel}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabs}
          >
            <Pressable
              onPress={() => setActiveTab("bg")}
              style={[styles.tab, activeTab === "bg" && styles.activeTab]}
            >
              <Palette
                size={15}
                color={activeTab === "bg" ? "#c084fc" : "#6b7280"}
              />

              <Text
                style={[
                  styles.tabText,
                  activeTab === "bg" && styles.activeTabText,
                ]}
              >
                Fond
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab("text")}
              style={[styles.tab, activeTab === "text" && styles.activeTab]}
            >
              <Type
                size={15}
                color={activeTab === "text" ? "#c084fc" : "#6b7280"}
              />

              <Text
                style={[
                  styles.tabText,
                  activeTab === "text" && styles.activeTabText,
                ]}
              >
                Texte
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab("stickers")}
              style={[styles.tab, activeTab === "stickers" && styles.activeTab]}
            >
              <Smile
                size={15}
                color={activeTab === "stickers" ? "#c084fc" : "#6b7280"}
              />

              <Text
                style={[
                  styles.tabText,
                  activeTab === "stickers" && styles.activeTabText,
                ]}
              >
                Emojis
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab("music")}
              style={[styles.tab, activeTab === "music" && styles.activeTab]}
            >
              <Music
                size={15}
                color={activeTab === "music" ? "#c084fc" : "#6b7280"}
              />

              <Text
                style={[
                  styles.tabText,
                  activeTab === "music" && styles.activeTabText,
                ]}
              >
                Musique
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab("anim")}
              style={[styles.tab, activeTab === "anim" && styles.activeTab]}
            >
              <Zap
                size={15}
                color={activeTab === "anim" ? "#c084fc" : "#6b7280"}
              />

              <Text
                style={[
                  styles.tabText,
                  activeTab === "anim" && styles.activeTabText,
                ]}
              >
                Anim.
              </Text>
            </Pressable>
          </ScrollView>

          <ScrollView
            style={styles.panelContent}
            contentContainerStyle={styles.panelContentInner}
          >
            {/* Background */}

            {activeTab === "bg" && (
              <View style={styles.colorGrid}>
                {BG_PRESETS.map((color, index) => (
                  <Pressable
                    key={`${color}-${index}`}
                    onPress={() =>
                      updateSlide({
                        bg: color,
                      })
                    }
                    style={[
                      styles.bgColorButton,
                      {
                        backgroundColor: color,
                      },
                      slide?.bg === color && styles.bgColorSelected,
                    ]}
                  />
                ))}
              </View>
            )}

            {/* Text */}

            {activeTab === "text" && (
              <View style={styles.tabContent}>
                <View style={styles.row}>
                  <Pressable onPress={addText} style={styles.addTextButton}>
                    <Plus size={15} color="#d8b4fe" />

                    <Text style={styles.addTextButtonText}>Ajouter</Text>
                  </Pressable>

                  {selectedElemData?.kind === "text" && (
                    <Pressable
                      onPress={updateSelectedElem}
                      style={styles.applyButton}
                    >
                      <Check size={14} color="#34d399" />

                      <Text style={styles.applyButtonText}>Appliquer</Text>
                    </Pressable>
                  )}
                </View>

                <TextInput
                  value={editText}
                  onChangeText={setEditText}
                  multiline
                  placeholder="Votre texte..."
                  placeholderTextColor="#6b7280"
                  style={styles.textEditor}
                />

                <View style={[styles.row, styles.textControls]}>
                  <Pressable
                    onPress={() => setEditBold((previous) => !previous)}
                    style={[
                      styles.formatButton,
                      editBold && styles.formatButtonActive,
                    ]}
                  >
                    <Bold size={16} color={editBold ? "#111827" : "#ffffff"} />
                  </Pressable>

                  <Pressable
                    onPress={() => setEditItalic((previous) => !previous)}
                    style={[
                      styles.formatButton,
                      editItalic && styles.formatButtonActive,
                    ]}
                  >
                    <Italic
                      size={16}
                      color={editItalic ? "#111827" : "#ffffff"}
                    />
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      setEditSize((previous) => clamp(previous - 2, 14, 60))
                    }
                    style={styles.sizeButton}
                  >
                    <Text style={styles.sizeButtonText}>−</Text>
                  </Pressable>

                  <Text style={styles.sizeText}>{editSize}px</Text>

                  <Pressable
                    onPress={() =>
                      setEditSize((previous) => clamp(previous + 2, 14, 60))
                    }
                    style={styles.sizeButton}
                  >
                    <Text style={styles.sizeButtonText}>+</Text>
                  </Pressable>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.colorRow}>
                    {TEXT_COLORS.map((color) => (
                      <Pressable
                        key={color}
                        onPress={() => setEditColor(color)}
                        style={[
                          styles.textColorButton,
                          {
                            backgroundColor: color,
                          },
                          editColor === color && styles.textColorSelected,
                        ]}
                      />
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Stickers */}

            {activeTab === "stickers" && (
              <View style={styles.stickerGrid}>
                {STICKER_LIST.map((emoji) => (
                  <Pressable
                    key={emoji}
                    onPress={() => addSticker(emoji)}
                    style={styles.stickerButton}
                  >
                    <Text style={styles.stickerText}>{emoji}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Music */}

            {activeTab === "music" && (
              <View style={styles.musicList}>
                <Pressable
                  onPress={() =>
                    updateSlide({
                      music: null,
                    })
                  }
                  style={[
                    styles.musicItem,
                    !slide?.music && styles.musicItemActive,
                  ]}
                >
                  <VolumeX size={20} color="#9ca3af" />

                  <Text style={styles.musicItemText}>Aucune musique</Text>

                  {!slide?.music && <Check size={18} color="#c084fc" />}
                </Pressable>

                {MUSIC_TRACKS.map((track) => (
                  <Pressable
                    key={track.id}
                    onPress={() =>
                      updateSlide({
                        music: track.id,
                      })
                    }
                    style={[
                      styles.musicItem,
                      slide?.music === track.id && styles.musicItemActive,
                    ]}
                  >
                    <Text style={styles.musicEmoji}>{track.emoji}</Text>

                    <View style={styles.musicInfo}>
                      <Text style={styles.musicItemText}>{track.label}</Text>

                      <Text style={styles.musicBpm}>{track.bpm} BPM</Text>
                    </View>

                    {slide?.music === track.id && (
                      <Check size={18} color="#c084fc" />
                    )}
                  </Pressable>
                ))}
              </View>
            )}

            {/* Animation */}

            {activeTab === "anim" && (
              <View style={styles.tabContent}>
                <Text style={styles.animDescription}>
                  {selectedElem
                    ? "Animation de l'élément sélectionné"
                    : "Animation par défaut pour les nouveaux éléments"}
                </Text>

                <View style={styles.animGrid}>
                  {ANIM_PRESETS.map((animation) => (
                    <Pressable
                      key={animation.id}
                      onPress={() => {
                        setEditAnim(animation.id);

                        if (selectedElem) {
                          updateSelectedElem();
                        }
                      }}
                      style={[
                        styles.animButton,
                        editAnim === animation.id && styles.animButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.animButtonText,
                          editAnim === animation.id &&
                            styles.animButtonTextActive,
                        ]}
                      >
                        {animation.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Pressable
                  style={styles.replayButton}
                  onPress={() => {
                    Alert.alert(
                      "Animations",
                      "Les animations seront rejouées dans l'aperçu.",
                    );
                  }}
                >
                  <RotateCcw size={15} color="#c084fc" />

                  <Text style={styles.replayButtonText}>
                    Rejouer les animations
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Preview */}

      <Modal
        visible={previewMode}
        animationType="fade"
        onRequestClose={() => setPreviewMode(false)}
        statusBarTranslucent
      >
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <Pressable
              onPress={() => setPreviewMode(false)}
              style={styles.previewHeaderButton}
            >
              <X size={22} color="#ffffff" />
            </Pressable>

            <View style={styles.progressContainer}>
              {slides.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressBar,
                    index === previewIdx && styles.progressBarActive,
                  ]}
                />
              ))}
            </View>

            <Pressable
              onPress={() => setMuted((previous) => !previous)}
              style={styles.previewHeaderButton}
            >
              {muted ? (
                <VolumeX size={20} color="#ffffff" />
              ) : (
                <Volume2 size={20} color="#ffffff" />
              )}
            </Pressable>
          </View>

          <View style={styles.previewCanvasWrapper}>
            {previewSlide && (
              <SlideCanvas
                slide={previewSlide}
                selected={null}
                onSelect={() => {}}
                onMove={() => {}}
                preview
              />
            )}
          </View>

          {currentMusic && !muted && (
            <View style={styles.previewMusic}>
              <Music size={14} color="#c084fc" />

              <Text style={styles.previewMusicText}>{currentMusic.label}</Text>
            </View>
          )}

          <View style={styles.previewNavigation}>
            <Pressable
              disabled={previewIdx === 0}
              onPress={prevPreviewSlide}
              style={[
                styles.previewNavButton,
                previewIdx === 0 && styles.previewNavDisabled,
              ]}
            >
              <ChevronLeft size={26} color="#ffffff" />
            </Pressable>

            <Text style={styles.previewCounter}>
              {previewIdx + 1} / {slides.length}
            </Text>

            <Pressable
              onPress={nextPreviewSlide}
              style={styles.previewNavButton}
            >
              {previewIdx < slides.length - 1 ? (
                <ChevronRight size={26} color="#ffffff" />
              ) : (
                <Check size={26} color="#ffffff" />
              )}
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
  container: {
    flex: 1,
    backgroundColor: "#030712",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    gap: 8,
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  headerContent: {
    flex: 1,
    minWidth: 0,
  },

  title: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },

  subtitle: {
    color: "#9ca3af",
    fontSize: 11,
    marginTop: 2,
  },

  previewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  previewButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },

  publishButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#7c3aed",
  },

  disabledButton: {
    opacity: 0.6,
  },

  publishButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },

  slideStrip: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  slideStripContent: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    alignItems: "center",
  },

  thumbnailContainer: {
    alignItems: "center",
    gap: 5,
  },

  thumbnail: {
    width: 62,
    height: 104,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  thumbnailActive: {
    borderColor: "#c084fc",
  },

  thumbnailText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    fontWeight: "800",
  },

  thumbnailActions: {
    flexDirection: "row",
    gap: 6,
  },

  smallIconButton: {
    padding: 3,
  },

  addSlideButton: {
    width: 62,
    height: 104,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  editor: {
    flex: 1,
  },

  canvasArea: {
    padding: 18,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },

  canvasWrapper: {
    width: "75%",
    maxWidth: 300,
    alignItems: "center",
  },

  canvas: {
    width: "100%",
    aspectRatio: 9 / 16,
    borderRadius: 18,
    overflow: "hidden",
  },

  canvasElement: {
    position: "absolute",
    transform: [
      {
        translateX: "-50%",
      } as never,
      {
        translateY: "-50%",
      } as never,
    ],
    padding: 4,
  },

  canvasElementSelected: {
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.8)",
    borderRadius: 8,
  },

  musicBadge: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  musicBadgeText: {
    color: "#9ca3af",
    fontSize: 12,
  },

  quickActions: {
    marginLeft: 12,
    gap: 10,
  },

  quickAction: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  deleteQuickAction: {
    backgroundColor: "rgba(239,68,68,0.15)",
  },

  confirmQuickAction: {
    backgroundColor: "rgba(16,185,129,0.15)",
  },

  bottomPanel: {
    maxHeight: 340,
    backgroundColor: "#111827",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },

  tabs: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },

  activeTab: {
    borderBottomColor: "#a855f7",
  },

  tabText: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "600",
  },

  activeTabText: {
    color: "#d8b4fe",
  },

  panelContent: {
    flex: 1,
  },

  panelContentInner: {
    padding: 14,
  },

  tabContent: {
    gap: 12,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  bgColorButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },

  bgColorSelected: {
    borderColor: "#ffffff",
  },

  addTextButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "rgba(126,34,206,0.3)",
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.5)",
  },

  addTextButtonText: {
    color: "#d8b4fe",
    fontSize: 12,
    fontWeight: "700",
  },

  applyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(16,185,129,0.15)",
  },

  applyButtonText: {
    color: "#34d399",
    fontSize: 11,
    fontWeight: "700",
  },

  textEditor: {
    minHeight: 76,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#ffffff",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    textAlignVertical: "top",
  },

  textControls: {
    flexWrap: "wrap",
  },

  formatButton: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  formatButtonActive: {
    backgroundColor: "#ffffff",
  },

  sizeButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  sizeButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },

  sizeText: {
    color: "#9ca3af",
    fontSize: 12,
    minWidth: 42,
    textAlign: "center",
  },

  colorRow: {
    flexDirection: "row",
    gap: 10,
  },

  textColorButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "transparent",
  },

  textColorSelected: {
    borderColor: "#ffffff",
  },

  stickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  stickerButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  stickerText: {
    fontSize: 26,
  },

  musicList: {
    gap: 8,
  },

  musicItem: {
    minHeight: 58,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  musicItemActive: {
    borderColor: "#a855f7",
    backgroundColor: "rgba(126,34,206,0.2)",
  },

  musicEmoji: {
    fontSize: 22,
  },

  musicInfo: {
    flex: 1,
  },

  musicItemText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },

  musicBpm: {
    color: "#6b7280",
    fontSize: 11,
    marginTop: 2,
  },

  animDescription: {
    color: "#9ca3af",
    fontSize: 12,
  },

  animGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  animButton: {
    minWidth: "30%",
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  animButtonActive: {
    backgroundColor: "rgba(126,34,206,0.3)",
    borderColor: "#a855f7",
  },

  animButtonText: {
    color: "#9ca3af",
    fontSize: 12,
  },

  animButtonTextActive: {
    color: "#e9d5ff",
    fontWeight: "700",
  },

  replayButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },

  replayButtonText: {
    color: "#c084fc",
    fontSize: 12,
    fontWeight: "600",
  },

  previewContainer: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },

  previewHeader: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 24,
    left: 14,
    right: 14,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  previewHeaderButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },

  progressContainer: {
    flex: 1,
    flexDirection: "row",
    gap: 5,
  },

  progressBar: {
    height: 4,
    flex: 1,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
  },

  progressBarActive: {
    backgroundColor: "#ffffff",
  },

  previewCanvasWrapper: {
    width: "82%",
    maxWidth: 390,
  },

  previewMusic: {
    position: "absolute",
    bottom: 140,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.65)",
  },

  previewMusicText: {
    color: "#ffffff",
    fontSize: 12,
  },

  previewNavigation: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  previewNavButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  previewNavDisabled: {
    opacity: 0.3,
  },

  previewCounter: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "600",
  },
});
