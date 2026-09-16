import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  Italic,
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
} from "lucide-react-native";
import { useMutation } from "convex/react";
import { useConvexAuth } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";

/* ============================================================================
 * TYPES
 * ========================================================================== */

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

type ActiveTab = "bg" | "text" | "stickers" | "music" | "anim";

interface Props {
  onBack: () => void;
  onNavigate?: (page: string) => void;

  /**
   * IMPORTANT:
   * The creator itself does not invent a media URL.
   * The parent can provide a real media pipeline.
   *
   * Example:
   * resolveMediaUrl={async (slide) => uploadRenderedSlide(slide)}
   */
  resolveMediaUrl?: (slide: Slide) => Promise<string>;
}

/* ============================================================================
 * CONSTANTS
 * ========================================================================== */

const MAX_SLIDES = 10;
const MAX_ELEMENTS_PER_SLIDE = 20;
const MAX_TEXT_LENGTH = 280;
const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 72;
const MIN_DURATION = 1;
const MAX_DURATION = 15;

const BG_PRESETS = [
  "#050812",
  "#0B1020",
  "#111827",
  "#172554",
  "#1E3A5F",
  "#312E81",
  "#4C1D95",
  "#064E3B",
  "#7F1D1D",
  "#581C87",
  "#0F172A",
  "#1E1B4B",
];

const GRADIENT_PRESETS = [
  ["#0F172A", "#312E81"],
  ["#111827", "#4C1D95"],
  ["#0C4A6E", "#312E81"],
  ["#064E3B", "#0F766E"],
  ["#7F1D1D", "#4C0519"],
  ["#1E1B4B", "#701A75"],
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
  "🎵",
  "💡",
  "⚡",
  "🥇",
  "🥳",
  "🙌",
  "🦁",
];

const TEXT_COLORS = [
  "#FFFFFF",
  "#F8FAFC",
  "#FDE68A",
  "#FBBF24",
  "#FB7185",
  "#34D399",
  "#60A5FA",
  "#A78BFA",
  "#F472B6",
  "#22D3EE",
];

const ANIM_PRESETS: Array<{
  id: AnimPreset;
  label: string;
}> = [
  { id: "fadeIn", label: "Fondu" },
  { id: "slideUp", label: "Montée" },
  { id: "slideLeft", label: "Glisse" },
  { id: "zoomIn", label: "Zoom" },
  { id: "bounce", label: "Rebond" },
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
];

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function sanitizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, MAX_TEXT_LENGTH);
}

function createSlide(): Slide {
  return {
    id: createId("slide"),
    bg: BG_PRESETS[0],
    elements: [],
    music: null,
    duration: 5,
  };
}

function isTextElement(element: SlideElem): element is TextElem {
  return element.kind === "text";
}

function getElementLabel(element: SlideElem): string {
  if (element.kind === "text") {
    return element.text || "Texte";
  }

  return element.emoji;
}

/* ============================================================================
 * ANIMATED ELEMENT
 * ========================================================================== */

interface AnimatedElementProps {
  element: SlideElem;
  selected: boolean;
  preview: boolean;
  animationKey: number;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  canvasWidth: number;
  canvasHeight: number;
}

function AnimatedSlideElement({
  element,
  selected,
  preview,
  animationKey,
  onSelect,
  onMove,
  canvasWidth,
  canvasHeight,
}: AnimatedElementProps) {
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const startX = useRef(0);
  const startY = useRef(0);

  useEffect(() => {
    progress.value = 0;
    scale.value = 1;
    translateX.value = 0;
    translateY.value = 0;

    switch (element.anim) {
      case "fadeIn":
        progress.value = withDelay(
          50,
          withTiming(1, {
            duration: 450,
            easing: Easing.out(Easing.cubic),
          }),
        );
        break;

      case "slideUp":
        translateY.value = 40;
        progress.value = withTiming(1, {
          duration: 450,
          easing: Easing.out(Easing.cubic),
        });
        translateY.value = withTiming(0, {
          duration: 450,
          easing: Easing.out(Easing.cubic),
        });
        break;

      case "slideLeft":
        translateX.value = -40;
        progress.value = withTiming(1, {
          duration: 450,
          easing: Easing.out(Easing.cubic),
        });
        translateX.value = withTiming(0, {
          duration: 450,
          easing: Easing.out(Easing.cubic),
        });
        break;

      case "zoomIn":
        scale.value = 0.5;
        progress.value = withTiming(1, {
          duration: 400,
          easing: Easing.out(Easing.cubic),
        });
        scale.value = withTiming(1, {
          duration: 450,
          easing: Easing.out(Easing.back(1.2)),
        });
        break;

      case "bounce":
        translateY.value = -30;
        progress.value = withTiming(1, {
          duration: 200,
        });
        translateY.value = withSequence(
          withSpring(8, {
            damping: 7,
            stiffness: 180,
          }),
          withSpring(0, {
            damping: 10,
            stiffness: 180,
          }),
        );
        break;
    }
  }, [animationKey, element.anim, progress, scale, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !preview,
        onMoveShouldSetPanResponder: () => !preview,
        onPanResponderGrant: () => {
          startX.current = element.x;
          startY.current = element.y;
          onSelect(element.id);
        },
        onPanResponderMove: (_event, gesture) => {
          if (preview || canvasWidth <= 0 || canvasHeight <= 0) {
            return;
          }

          const deltaX = (gesture.dx / canvasWidth) * 100;
          const deltaY = (gesture.dy / canvasHeight) * 100;

          onMove(
            element.id,
            clamp(startX.current + deltaX, 5, 95),
            clamp(startY.current + deltaY, 5, 95),
          );
        },
      }),
    [
      canvasHeight,
      canvasWidth,
      element.id,
      element.x,
      element.y,
      onMove,
      onSelect,
      preview,
    ],
  );

  const left = `${element.x}%`;
  const top = `${element.y}%`;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.element,
        {
          left,
          top,
        },
        selected && !preview ? styles.selectedElement : null,
        animatedStyle,
      ]}
    >
      {element.kind === "text" ? (
        <Text
          style={{
            color: element.color,
            fontSize: element.fontSize,
            fontWeight: element.bold ? "800" : "500",
            fontStyle: element.italic ? "italic" : "normal",
            textAlign: "center",
            textShadowColor: "rgba(0,0,0,0.75)",
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 7,
            maxWidth: Math.max(150, canvasWidth * 0.72),
          }}
        >
          {element.text}
        </Text>
      ) : (
        <Text
          style={{
            fontSize: element.size,
            lineHeight: element.size * 1.1,
            textShadowColor: "rgba(0,0,0,0.5)",
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 6,
          }}
        >
          {element.emoji}
        </Text>
      )}
    </Animated.View>
  );
}

/* ============================================================================
 * SLIDE CANVAS
 * ========================================================================== */

interface SlideCanvasProps {
  slide: Slide;
  selected: string | null;
  preview?: boolean;
  animationKey: number;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
}

function SlideCanvas({
  slide,
  selected,
  preview = false,
  animationKey,
  onSelect,
  onMove,
}: SlideCanvasProps) {
  const [layout, setLayout] = useState({
    width: 0,
    height: 0,
  });

  const selectedElementId = selected;

  return (
    <View
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;

        setLayout({
          width,
          height,
        });
      }}
      style={[
        styles.canvas,
        {
          backgroundColor: slide.bg,
        },
      ]}
    >
      <Pressable
        disabled={preview}
        onPress={() => onSelect("")}
        style={StyleSheet.absoluteFill}
      />

      {slide.elements.map((element) => (
        <AnimatedSlideElement
          key={`${element.id}_${animationKey}`}
          element={element}
          selected={selectedElementId === element.id}
          preview={preview}
          animationKey={animationKey}
          onSelect={onSelect}
          onMove={onMove}
          canvasWidth={layout.width}
          canvasHeight={layout.height}
        />
      ))}

      {!preview && slide.elements.length === 0 ? (
        <View pointerEvents="none" style={styles.emptyCanvas}>
          <View style={styles.emptyCanvasIcon}>
            <Plus size={24} color="#A78BFA" />
          </View>

          <Text style={styles.emptyCanvasTitle}>
            Crée quelque chose d'inoubliable
          </Text>

          <Text style={styles.emptyCanvasText}>
            Ajoute du texte, des emojis et compose ta story.
          </Text>
        </View>
      ) : null}

      {!preview ? (
        <View pointerEvents="none" style={styles.canvasBadge}>
          <Text style={styles.canvasBadgeText}>9:16</Text>
        </View>
      ) : null}
    </View>
  );
}

/* ============================================================================
 * THUMBNAIL
 * ========================================================================== */

interface ThumbnailProps {
  slide: Slide;
  index: number;
  active: boolean;
  onPress: () => void;
}

function SlideThumbnail({ slide, index, active, onPress }: ThumbnailProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Slide ${index + 1}`}
      style={[
        styles.thumbnail,
        {
          backgroundColor: slide.bg,
        },
        active ? styles.thumbnailActive : null,
      ]}
    >
      <View style={styles.thumbnailContent}>
        {slide.elements.slice(0, 3).map((element) => (
          <Text
            key={element.id}
            numberOfLines={1}
            style={[
              styles.thumbnailElement,
              element.kind === "sticker"
                ? { fontSize: 16 }
                : { color: element.color },
            ]}
          >
            {getElementLabel(element)}
          </Text>
        ))}

        {slide.elements.length === 0 ? (
          <Text style={styles.thumbnailIndex}>{index + 1}</Text>
        ) : null}
      </View>

      <View style={styles.thumbnailNumber}>
        <Text style={styles.thumbnailNumberText}>{index + 1}</Text>
      </View>
    </Pressable>
  );
}

/* ============================================================================
 * MAIN
 * ========================================================================== */

export default function StoriesCreatorPage({
  onBack,
  onNavigate,
  resolveMediaUrl,
}: Props) {
  const { isAuthenticated } = useConvexAuth();
  const createStory = useMutation(api.stories.createStory);

  const [slides, setSlides] = useState<Slide[]>([createSlide()]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>("bg");

  const [previewMode, setPreviewMode] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);
  const [muted, setMuted] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(true);

  const [publishing, setPublishing] = useState(false);

  const [editText, setEditText] = useState("Votre message");
  const [editColor, setEditColor] = useState("#FFFFFF");
  const [editSize, setEditSize] = useState(30);
  const [editBold, setEditBold] = useState(true);
  const [editItalic, setEditItalic] = useState(false);
  const [editAnim, setEditAnim] = useState<AnimPreset>("slideUp");

  const slide = slides[activeIndex];

  const selectedElementData = slide?.elements.find(
    (element) => element.id === selectedElement,
  );

  const previewSlide = slides[previewIndex];

  const currentMusic = MUSIC_TRACKS.find(
    (track) => track.id === previewSlide?.music,
  );

  /* --------------------------------------------------------------------------
   * SLIDES
   * ------------------------------------------------------------------------ */

  const updateSlide = useCallback(
    (updater: (current: Slide) => Slide) => {
      setSlides((current) =>
        current.map((item, index) =>
          index === activeIndex ? updater(item) : item,
        ),
      );
    },
    [activeIndex],
  );

  const addSlide = useCallback(() => {
    if (slides.length >= MAX_SLIDES) {
      Alert.alert(
        "Limite atteinte",
        `Une story peut contenir au maximum ${MAX_SLIDES} slides.`,
      );
      return;
    }

    const next = createSlide();

    setSlides((current) => [...current, next]);
    setActiveIndex(slides.length);
    setSelectedElement(null);
  }, [slides.length]);

  const duplicateSlide = useCallback(
    (index: number) => {
      if (slides.length >= MAX_SLIDES) {
        Alert.alert(
          "Limite atteinte",
          `Une story peut contenir au maximum ${MAX_SLIDES} slides.`,
        );
        return;
      }

      const source = slides[index];

      if (!source) {
        return;
      }

      const duplicate: Slide = {
        ...source,
        id: createId("slide"),
        elements: source.elements.map((element) => ({
          ...element,
          id: createId(element.kind),
        })),
      };

      setSlides((current) => {
        const next = [...current];
        next.splice(index + 1, 0, duplicate);
        return next;
      });

      setActiveIndex(index + 1);
      setSelectedElement(null);
    },
    [slides],
  );

  const deleteSlide = useCallback(
    (index: number) => {
      if (slides.length <= 1) {
        Alert.alert(
          "Impossible",
          "Une story doit contenir au moins une slide.",
        );
        return;
      }

      setSlides((current) =>
        current.filter((_slide, slideIndex) => slideIndex !== index),
      );

      setActiveIndex((current) =>
        Math.min(Math.max(0, index - 1), slides.length - 2),
      );

      setSelectedElement(null);
    },
    [slides.length],
  );

  /* --------------------------------------------------------------------------
   * ELEMENTS
   * ------------------------------------------------------------------------ */

  const addText = useCallback(() => {
    if (!slide) {
      return;
    }

    const text = sanitizeText(editText);

    if (!text) {
      Alert.alert("Texte requis", "Écris un message avant de l'ajouter.");
      return;
    }

    if (slide.elements.length >= MAX_ELEMENTS_PER_SLIDE) {
      Alert.alert(
        "Limite atteinte",
        `Une slide peut contenir au maximum ${MAX_ELEMENTS_PER_SLIDE} éléments.`,
      );
      return;
    }

    const element: TextElem = {
      id: createId("text"),
      kind: "text",
      text,
      color: editColor,
      fontSize: clamp(editSize, MIN_FONT_SIZE, MAX_FONT_SIZE),
      bold: editBold,
      italic: editItalic,
      x: 50,
      y: 50,
      anim: editAnim,
    };

    updateSlide((current) => ({
      ...current,
      elements: [...current.elements, element],
    }));

    setSelectedElement(element.id);
  }, [
    editAnim,
    editBold,
    editColor,
    editItalic,
    editSize,
    editText,
    slide,
    updateSlide,
  ]);

  const addSticker = useCallback(
    (emoji: string) => {
      if (!slide) {
        return;
      }

      if (slide.elements.length >= MAX_ELEMENTS_PER_SLIDE) {
        Alert.alert(
          "Limite atteinte",
          `Une slide peut contenir au maximum ${MAX_ELEMENTS_PER_SLIDE} éléments.`,
        );
        return;
      }

      const element: StickerElem = {
        id: createId("sticker"),
        kind: "sticker",
        emoji,
        size: 52,
        x: 50,
        y: 50,
        anim: editAnim,
      };

      updateSlide((current) => ({
        ...current,
        elements: [...current.elements, element],
      }));

      setSelectedElement(element.id);
    },
    [editAnim, slide, updateSlide],
  );

  const deleteElement = useCallback(
    (id: string) => {
      updateSlide((current) => ({
        ...current,
        elements: current.elements.filter((element) => element.id !== id),
      }));

      setSelectedElement(null);
    },
    [updateSlide],
  );

  const moveElement = useCallback(
    (id: string, x: number, y: number) => {
      updateSlide((current) => ({
        ...current,
        elements: current.elements.map((element) =>
          element.id === id
            ? {
                ...element,
                x,
                y,
              }
            : element,
        ),
      }));
    },
    [updateSlide],
  );

  const applySelectedElement = useCallback(() => {
    if (!selectedElement) {
      return;
    }

    updateSlide((current) => ({
      ...current,
      elements: current.elements.map((element) => {
        if (element.id !== selectedElement) {
          return element;
        }

        if (element.kind === "text") {
          return {
            ...element,
            text: sanitizeText(editText),
            color: editColor,
            fontSize: clamp(editSize, MIN_FONT_SIZE, MAX_FONT_SIZE),
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
    }));

    setAnimationKey((value) => value + 1);
  }, [
    editAnim,
    editBold,
    editColor,
    editItalic,
    editSize,
    editText,
    selectedElement,
    updateSlide,
  ]);

  const selectElement = useCallback(
    (id: string) => {
      setSelectedElement(id || null);

      const element = slide?.elements.find((item) => item.id === id);

      if (!element) {
        return;
      }

      setEditAnim(element.anim);

      if (element.kind === "text") {
        setEditText(element.text);
        setEditColor(element.color);
        setEditSize(element.fontSize);
        setEditBold(element.bold);
        setEditItalic(element.italic);
      }
    },
    [slide],
  );

  /* --------------------------------------------------------------------------
   * PREVIEW
   * ------------------------------------------------------------------------ */

  const startPreview = useCallback(() => {
    setPreviewIndex(0);
    setPreviewMode(true);
    setPreviewPlaying(true);
    setAnimationKey((value) => value + 1);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewMode(false);
    setPreviewPlaying(false);
  }, []);

  const nextPreview = useCallback(() => {
    if (previewIndex >= slides.length - 1) {
      closePreview();
      return;
    }

    setPreviewIndex((value) => value + 1);
    setAnimationKey((value) => value + 1);
  }, [closePreview, previewIndex, slides.length]);

  const previousPreview = useCallback(() => {
    if (previewIndex <= 0) {
      return;
    }

    setPreviewIndex((value) => value - 1);
    setAnimationKey((value) => value + 1);
  }, [previewIndex]);

  useEffect(() => {
    if (!previewMode || !previewPlaying || !previewSlide) {
      return;
    }

    const timeout = setTimeout(() => {
      if (previewIndex < slides.length - 1) {
        setPreviewIndex((value) => value + 1);
        setAnimationKey((value) => value + 1);
      } else {
        setPreviewPlaying(false);
      }
    }, previewSlide.duration * 1000);

    return () => clearTimeout(timeout);
  }, [previewIndex, previewMode, previewPlaying, previewSlide, slides.length]);

  /* --------------------------------------------------------------------------
   * PUBLISH
   * ------------------------------------------------------------------------ */

  const handlePublish = useCallback(async () => {
    if (!isAuthenticated) {
      Alert.alert(
        "Connexion requise",
        "Connectez-vous pour publier une story.",
      );
      return;
    }

    if (publishing) {
      return;
    }

    if (slides.length === 0) {
      Alert.alert("Story vide", "Ajoutez au moins une slide.");
      return;
    }

    if (!resolveMediaUrl) {
      Alert.alert(
        "Pipeline média non configuré",
        "Le studio ne publie volontairement aucune fausse image. Il faut connecter le rendu de la slide à un vrai stockage média avant de publier.",
      );
      return;
    }

    setPublishing(true);

    try {
      for (const currentSlide of slides) {
        const mediaUrl = await resolveMediaUrl(currentSlide);

        if (!mediaUrl || !/^https?:\/\//i.test(mediaUrl)) {
          throw new Error(
            "Le pipeline média n'a pas fourni une URL publique valide.",
          );
        }

        const textParts = currentSlide.elements
          .filter(isTextElement)
          .map((element) => element.text)
          .filter(Boolean);

        const stickerParts = currentSlide.elements
          .filter((element) => element.kind === "sticker")
          .map((element) => element.emoji);

        const caption = [...textParts, ...stickerParts]
          .join(" ")
          .trim()
          .slice(0, MAX_TEXT_LENGTH);

        await createStory({
          mediaUrl,
          mediaType: "image",
          caption: caption || undefined,
          duration: clamp(currentSlide.duration, MIN_DURATION, MAX_DURATION),
        });
      }

      Alert.alert("Story publiée", "Votre création est maintenant publiée.", [
        {
          text: "Continuer",
          onPress: () => {
            if (onNavigate) {
              onNavigate("live");
            } else {
              onBack();
            }
          },
        },
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "La publication a échoué.";

      Alert.alert("Publication impossible", message);
    } finally {
      setPublishing(false);
    }
  }, [
    createStory,
    isAuthenticated,
    onBack,
    onNavigate,
    publishing,
    resolveMediaUrl,
    slides,
  ]);

  /* --------------------------------------------------------------------------
   * UI
   * ------------------------------------------------------------------------ */

  const tabs = useMemo(
    () => [
      {
        id: "bg" as const,
        label: "Fond",
        icon: Palette,
      },
      {
        id: "text" as const,
        label: "Texte",
        icon: Type,
      },
      {
        id: "stickers" as const,
        label: "Emojis",
        icon: Smile,
      },
      {
        id: "music" as const,
        label: "Audio",
        icon: Music,
      },
      {
        id: "anim" as const,
        label: "Motion",
        icon: Zap,
      },
    ],
    [],
  );

  if (!slide) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.root}>
        {/* ================================================================
            HEADER
        ================================================================ */}

        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            style={styles.iconButton}
          >
            <ArrowLeft size={19} color="#FFFFFF" />
          </Pressable>

          <View style={styles.headerTitle}>
            <View style={styles.brandRow}>
              <Text style={styles.headerTitleText}>Studio Stories</Text>

              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            </View>

            <Text style={styles.headerSubtitle}>
              {slides.length} / {MAX_SLIDES} scènes
            </Text>
          </View>

          <Pressable
            onPress={startPreview}
            style={styles.secondaryHeaderButton}
          >
            <Eye size={16} color="#E9D5FF" />
            <Text style={styles.secondaryHeaderText}>Aperçu</Text>
          </Pressable>

          <Pressable
            onPress={handlePublish}
            disabled={publishing}
            style={[
              styles.publishButton,
              publishing ? styles.disabledButton : null,
            ]}
          >
            {publishing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send size={15} color="#FFFFFF" />
            )}

            <Text style={styles.publishButtonText}>
              {publishing ? "Publication…" : "Publier"}
            </Text>
          </Pressable>
        </View>

        {/* ================================================================
            SLIDES
        ================================================================ */}

        <View style={styles.slideStrip}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.slideStripContent}
          >
            {slides.map((item, index) => (
              <View key={item.id} style={styles.slideItem}>
                <SlideThumbnail
                  slide={item}
                  index={index}
                  active={index === activeIndex}
                  onPress={() => {
                    setActiveIndex(index);
                    setSelectedElement(null);
                  }}
                />

                <View style={styles.slideActions}>
                  <Pressable
                    onPress={() => duplicateSlide(index)}
                    style={styles.miniButton}
                  >
                    <Copy size={11} color="#94A3B8" />
                  </Pressable>

                  <Pressable
                    onPress={() => deleteSlide(index)}
                    style={styles.miniButton}
                  >
                    <Trash2 size={11} color="#FB7185" />
                  </Pressable>
                </View>
              </View>
            ))}

            <Pressable onPress={addSlide} style={styles.addSlideButton}>
              <Plus size={22} color="#A78BFA" />
              <Text style={styles.addSlideText}>Nouvelle</Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* ================================================================
            WORKSPACE
        ================================================================ */}

        <View style={styles.workspace}>
          <ScrollView
            contentContainerStyle={styles.workspaceContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.canvasWrapper}>
              <SlideCanvas
                slide={slide}
                selected={selectedElement}
                animationKey={animationKey}
                onSelect={selectElement}
                onMove={moveElement}
              />

              {slide.music ? (
                <View style={styles.audioPill}>
                  <Music size={12} color="#C4B5FD" />

                  <Text style={styles.audioPillText}>
                    {
                      MUSIC_TRACKS.find((track) => track.id === slide.music)
                        ?.label
                    }
                  </Text>
                </View>
              ) : null}
            </View>

            {selectedElementData ? (
              <View style={styles.selectionBar}>
                <View style={styles.selectionInfo}>
                  <View style={styles.selectionDot} />

                  <Text numberOfLines={1} style={styles.selectionText}>
                    {getElementLabel(selectedElementData)}
                  </Text>
                </View>

                <View style={styles.selectionActions}>
                  <Pressable
                    onPress={() => {
                      applySelectedElement();
                      setSelectedElement(null);
                    }}
                    style={styles.confirmButton}
                  >
                    <Check size={15} color="#34D399" />
                    <Text style={styles.confirmText}>Appliquer</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => deleteElement(selectedElementData.id)}
                    style={styles.deleteButton}
                  >
                    <Trash2 size={15} color="#FB7185" />
                  </Pressable>
                </View>
              </View>
            ) : null}
          </ScrollView>
        </View>

        {/* ================================================================
            TOOLBOX
        ================================================================ */}

        <View style={styles.toolbox}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabs}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;

              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  style={[styles.tab, active ? styles.tabActive : null]}
                >
                  <Icon size={15} color={active ? "#C4B5FD" : "#64748B"} />

                  <Text
                    style={[
                      styles.tabText,
                      active ? styles.tabTextActive : null,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <ScrollView
            style={styles.toolContent}
            contentContainerStyle={styles.toolContentInner}
            showsVerticalScrollIndicator={false}
          >
            {/* ============================================================
                BACKGROUND
            ============================================================ */}

            {activeTab === "bg" ? (
              <View>
                <Text style={styles.sectionLabel}>PALETTE CINÉMATIQUE</Text>

                <View style={styles.colorGrid}>
                  {BG_PRESETS.map((color) => (
                    <Pressable
                      key={color}
                      onPress={() =>
                        updateSlide((current) => ({
                          ...current,
                          bg: color,
                        }))
                      }
                      style={[
                        styles.colorSwatch,
                        {
                          backgroundColor: color,
                        },
                        slide.bg === color ? styles.colorSwatchActive : null,
                      ]}
                    >
                      {slide.bg === color ? (
                        <Check size={15} color="#FFFFFF" />
                      ) : null}
                    </Pressable>
                  ))}
                </View>

                <Text style={[styles.sectionLabel, styles.gradientLabel]}>
                  COMPOSITIONS
                </Text>

                <View style={styles.gradientGrid}>
                  {GRADIENT_PRESETS.map(([first, second], index) => (
                    <Pressable
                      key={`${first}_${second}`}
                      onPress={() => {
                        /*
                         * React Native core does not support CSS gradients.
                         * We therefore keep the editor native and use a
                         * deterministic solid fallback until a gradient
                         * renderer is connected.
                         */
                        updateSlide((current) => ({
                          ...current,
                          bg: index % 2 === 0 ? first : second,
                        }));
                      }}
                      style={[
                        styles.gradientCard,
                        {
                          backgroundColor: index % 2 === 0 ? first : second,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.gradientOverlay,
                          {
                            backgroundColor: second,
                          },
                        ]}
                      />

                      <Text style={styles.gradientCardText}>{index + 1}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            {/* ============================================================
                TEXT
            ============================================================ */}

            {activeTab === "text" ? (
              <View>
                <View style={styles.toolHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Texte</Text>

                    <Text style={styles.sectionDescription}>
                      Crée un message fort et lisible.
                    </Text>
                  </View>

                  <Pressable onPress={addText} style={styles.addToolButton}>
                    <Plus size={15} color="#FFFFFF" />
                    <Text style={styles.addToolButtonText}>Ajouter</Text>
                  </Pressable>
                </View>

                <TextInput
                  value={editText}
                  onChangeText={(value) =>
                    setEditText(value.slice(0, MAX_TEXT_LENGTH))
                  }
                  placeholder="Votre message…"
                  placeholderTextColor="#475569"
                  multiline
                  maxLength={MAX_TEXT_LENGTH}
                  textAlignVertical="top"
                  style={styles.textEditor}
                />

                <View style={styles.editorMeta}>
                  <Text style={styles.characterCounter}>
                    {editText.length}/{MAX_TEXT_LENGTH}
                  </Text>

                  {selectedElementData?.kind === "text" ? (
                    <Pressable
                      onPress={applySelectedElement}
                      style={styles.smallApply}
                    >
                      <Check size={13} color="#34D399" />
                      <Text style={styles.smallApplyText}>Appliquer</Text>
                    </Pressable>
                  ) : null}
                </View>

                <View style={styles.formatRow}>
                  <Pressable
                    onPress={() => setEditBold((value) => !value)}
                    style={[
                      styles.formatButton,
                      editBold ? styles.formatButtonActive : null,
                    ]}
                  >
                    <Bold size={16} color={editBold ? "#0F172A" : "#CBD5E1"} />
                  </Pressable>

                  <Pressable
                    onPress={() => setEditItalic((value) => !value)}
                    style={[
                      styles.formatButton,
                      editItalic ? styles.formatButtonActive : null,
                    ]}
                  >
                    <Italic
                      size={16}
                      color={editItalic ? "#0F172A" : "#CBD5E1"}
                    />
                  </Pressable>

                  <View style={styles.sizeControl}>
                    <Text style={styles.sizeLabel}>Taille</Text>

                    <Pressable
                      onPress={() =>
                        setEditSize((value) =>
                          clamp(value - 2, MIN_FONT_SIZE, MAX_FONT_SIZE),
                        )
                      }
                      style={styles.sizeButton}
                    >
                      <Text style={styles.sizeButtonText}>−</Text>
                    </Pressable>

                    <Text style={styles.sizeValue}>{editSize}</Text>

                    <Pressable
                      onPress={() =>
                        setEditSize((value) =>
                          clamp(value + 2, MIN_FONT_SIZE, MAX_FONT_SIZE),
                        )
                      }
                      style={styles.sizeButton}
                    >
                      <Text style={styles.sizeButtonText}>+</Text>
                    </Pressable>
                  </View>
                </View>

                <Text style={styles.sectionLabel}>COULEUR</Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.colorScroll}
                >
                  {TEXT_COLORS.map((color) => (
                    <Pressable
                      key={color}
                      onPress={() => setEditColor(color)}
                      style={[
                        styles.textColor,
                        {
                          backgroundColor: color,
                        },
                        editColor === color ? styles.textColorActive : null,
                      ]}
                    >
                      {editColor === color ? (
                        <Check
                          size={14}
                          color={
                            color === "#FFFFFF" || color === "#F8FAFC"
                              ? "#0F172A"
                              : "#FFFFFF"
                          }
                        />
                      ) : null}
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {/* ============================================================
                STICKERS
            ============================================================ */}

            {activeTab === "stickers" ? (
              <View>
                <View style={styles.toolHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Expressions</Text>

                    <Text style={styles.sectionDescription}>
                      Donne une identité instantanée à ta story.
                    </Text>
                  </View>
                </View>

                <View style={styles.stickerGrid}>
                  {STICKER_LIST.map((emoji) => (
                    <Pressable
                      key={emoji}
                      onPress={() => addSticker(emoji)}
                      style={({ pressed }) => [
                        styles.stickerButton,
                        pressed ? styles.stickerButtonPressed : null,
                      ]}
                    >
                      <Text style={styles.stickerText}>{emoji}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            {/* ============================================================
                AUDIO
            ============================================================ */}

            {activeTab === "music" ? (
              <View>
                <View style={styles.toolHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Audio</Text>

                    <Text style={styles.sectionDescription}>
                      Sélection du catalogue audio connecté.
                    </Text>
                  </View>
                </View>

                <View style={styles.audioNotice}>
                  <Music size={16} color="#A78BFA" />

                  <Text style={styles.audioNoticeText}>
                    Ces entrées sont des identifiants de catalogue. Elles ne
                    seront pas jouées tant qu'un lecteur audio réel n'est pas
                    connecté.
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    updateSlide((current) => ({
                      ...current,
                      music: null,
                    }))
                  }
                  style={[
                    styles.audioOption,
                    !slide.music ? styles.audioOptionActive : null,
                  ]}
                >
                  <VolumeX size={17} color="#94A3B8" />

                  <Text style={styles.audioOptionText}>Aucun audio</Text>

                  {!slide.music ? (
                    <Check
                      size={16}
                      color="#A78BFA"
                      style={styles.audioCheck}
                    />
                  ) : null}
                </Pressable>

                {MUSIC_TRACKS.map((track) => (
                  <Pressable
                    key={track.id}
                    onPress={() =>
                      updateSlide((current) => ({
                        ...current,
                        music: track.id,
                      }))
                    }
                    style={[
                      styles.audioOption,
                      slide.music === track.id
                        ? styles.audioOptionActive
                        : null,
                    ]}
                  >
                    <Text style={styles.audioEmoji}>{track.emoji}</Text>

                    <View style={styles.audioInfo}>
                      <Text style={styles.audioName}>{track.label}</Text>

                      <Text style={styles.audioBpm}>{track.bpm} BPM</Text>
                    </View>

                    {slide.music === track.id ? (
                      <Check size={16} color="#A78BFA" />
                    ) : null}
                  </Pressable>
                ))}
              </View>
            ) : null}

            {/* ============================================================
                ANIMATION
            ============================================================ */}

            {activeTab === "anim" ? (
              <View>
                <View style={styles.toolHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Motion</Text>

                    <Text style={styles.sectionDescription}>
                      Anime l'élément sélectionné.
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => setAnimationKey((value) => value + 1)}
                    style={styles.replayButton}
                  >
                    <RotateCcw size={14} color="#C4B5FD" />

                    <Text style={styles.replayText}>Rejouer</Text>
                  </Pressable>
                </View>

                <View style={styles.animationGrid}>
                  {ANIM_PRESETS.map((animation) => {
                    const active = editAnim === animation.id;

                    return (
                      <Pressable
                        key={animation.id}
                        onPress={() => {
                          setEditAnim(animation.id);

                          if (selectedElement) {
                            updateSlide((current) => ({
                              ...current,
                              elements: current.elements.map((element) =>
                                element.id === selectedElement
                                  ? {
                                      ...element,
                                      anim: animation.id,
                                    }
                                  : element,
                              ),
                            }));
                          }

                          setAnimationKey((value) => value + 1);
                        }}
                        style={[
                          styles.animationButton,
                          active ? styles.animationButtonActive : null,
                        ]}
                      >
                        <Zap size={14} color={active ? "#C4B5FD" : "#64748B"} />

                        <Text
                          style={[
                            styles.animationText,
                            active ? styles.animationTextActive : null,
                          ]}
                        >
                          {animation.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.durationCard}>
                  <View>
                    <Text style={styles.durationTitle}>Durée de la scène</Text>

                    <Text style={styles.durationDescription}>
                      Contrôle le temps d'affichage.
                    </Text>
                  </View>

                  <View style={styles.durationControl}>
                    <Pressable
                      onPress={() =>
                        updateSlide((current) => ({
                          ...current,
                          duration: clamp(
                            current.duration - 1,
                            MIN_DURATION,
                            MAX_DURATION,
                          ),
                        }))
                      }
                      style={styles.durationButton}
                    >
                      <Text style={styles.durationButtonText}>−</Text>
                    </Pressable>

                    <Text style={styles.durationValue}>{slide.duration}s</Text>

                    <Pressable
                      onPress={() =>
                        updateSlide((current) => ({
                          ...current,
                          duration: clamp(
                            current.duration + 1,
                            MIN_DURATION,
                            MAX_DURATION,
                          ),
                        }))
                      }
                      style={styles.durationButton}
                    >
                      <Text style={styles.durationButtonText}>+</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : null}
          </ScrollView>
        </View>

        {/* ================================================================
            FULLSCREEN PREVIEW
        ================================================================ */}

        {previewMode ? (
          <View style={styles.previewOverlay}>
            <View style={styles.previewHeader}>
              <Pressable onPress={closePreview} style={styles.previewIcon}>
                <X size={21} color="#FFFFFF" />
              </Pressable>

              <View style={styles.progressContainer}>
                {slides.map((item, index) => (
                  <View
                    key={item.id}
                    style={[
                      styles.progressTrack,
                      index === previewIndex
                        ? styles.progressTrackActive
                        : null,
                    ]}
                  />
                ))}
              </View>

              <Pressable
                onPress={() => setMuted((value) => !value)}
                style={styles.previewIcon}
              >
                {muted ? (
                  <VolumeX size={19} color="#FFFFFF" />
                ) : (
                  <Volume2 size={19} color="#FFFFFF" />
                )}
              </Pressable>
            </View>

            <View style={styles.previewCanvasContainer}>
              {previewSlide ? (
                <SlideCanvas
                  slide={previewSlide}
                  selected={null}
                  preview
                  animationKey={animationKey}
                  onSelect={() => undefined}
                  onMove={() => undefined}
                />
              ) : null}
            </View>

            {currentMusic && !muted ? (
              <View style={styles.previewAudio}>
                <Music size={13} color="#C4B5FD" />

                <Text style={styles.previewAudioText}>
                  {currentMusic.label}
                </Text>
              </View>
            ) : null}

            <View style={styles.previewControls}>
              <Pressable
                onPress={previousPreview}
                disabled={previewIndex === 0}
                style={[
                  styles.previewNavButton,
                  previewIndex === 0 ? styles.previewDisabled : null,
                ]}
              >
                <ChevronLeft size={25} color="#FFFFFF" />
              </Pressable>

              <Pressable
                onPress={() => setPreviewPlaying((value) => !value)}
                style={styles.previewPlayButton}
              >
                {previewPlaying ? (
                  <Pause size={20} color="#FFFFFF" />
                ) : (
                  <Play size={20} color="#FFFFFF" />
                )}
              </Pressable>

              <Text style={styles.previewCounter}>
                {previewIndex + 1} / {slides.length}
              </Text>

              <Pressable onPress={nextPreview} style={styles.previewNavButton}>
                {previewIndex < slides.length - 1 ? (
                  <ChevronRight size={25} color="#FFFFFF" />
                ) : (
                  <Check size={22} color="#FFFFFF" />
                )}
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CANVAS_WIDTH = Math.min(SCREEN_WIDTH - 36, 390);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#020412",
  },

  header: {
    minHeight: 68,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(5,8,18,0.97)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  headerTitle: {
    flex: 1,
    minWidth: 0,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  headerTitleText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  headerSubtitle: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 11,
    fontWeight: "600",
  },

  proBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: "rgba(139,92,246,0.2)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
  },

  proBadgeText: {
    color: "#C4B5FD",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  secondaryHeaderButton: {
    minHeight: 38,
    paddingHorizontal: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  secondaryHeaderText: {
    color: "#E2E8F0",
    fontSize: 11,
    fontWeight: "700",
  },

  publishButton: {
    minHeight: 38,
    paddingHorizontal: 13,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#6D28D9",
  },

  publishButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  disabledButton: {
    opacity: 0.55,
  },

  slideStrip: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#050812",
  },

  slideStripContent: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
    alignItems: "center",
  },

  slideItem: {
    alignItems: "center",
    gap: 4,
  },

  thumbnail: {
    width: 58,
    height: 90,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.08)",
  },

  thumbnailActive: {
    borderColor: "#A78BFA",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.5,
    shadowRadius: 9,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 6,
  },

  thumbnailContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    gap: 3,
  },

  thumbnailElement: {
    maxWidth: 48,
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "700",
    textAlign: "center",
  },

  thumbnailIndex: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontWeight: "900",
  },

  thumbnailNumber: {
    position: "absolute",
    top: 4,
    left: 4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  thumbnailNumberText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
  },

  slideActions: {
    flexDirection: "row",
    gap: 4,
  },

  miniButton: {
    width: 23,
    height: 20,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  addSlideButton: {
    width: 82,
    height: 90,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(167,139,250,0.3)",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "rgba(139,92,246,0.05)",
  },

  addSlideText: {
    color: "#8B7DB8",
    fontSize: 9,
    fontWeight: "700",
  },

  workspace: {
    flex: 1,
    minHeight: 0,
  },

  workspaceContent: {
    padding: 18,
    alignItems: "center",
    paddingBottom: 12,
  },

  canvasWrapper: {
    width: CANVAS_WIDTH,
    maxWidth: "100%",
    alignItems: "center",
  },

  canvas: {
    width: "100%",
    aspectRatio: 9 / 16,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    shadowColor: "#000000",
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 8,
  },

  element: {
    position: "absolute",
    transform: [
      {
        translateX: -50,
      },
      {
        translateY: -50,
      },
    ],
    alignItems: "center",
    justifyContent: "center",
    minWidth: 30,
    minHeight: 30,
  },

  selectedElement: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
    borderRadius: 9,
    paddingHorizontal: 7,
    paddingVertical: 5,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  emptyCanvas: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 35,
  },

  emptyCanvasIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    backgroundColor: "rgba(139,92,246,0.12)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
  },

  emptyCanvasTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyCanvasText: {
    marginTop: 5,
    color: "rgba(255,255,255,0.48)",
    fontSize: 10,
    lineHeight: 15,
    textAlign: "center",
  },

  canvasBadge: {
    position: "absolute",
    right: 9,
    top: 9,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  canvasBadgeText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 8,
    fontWeight: "800",
  },

  audioPill: {
    marginTop: 9,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(139,92,246,0.1)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.14)",
  },

  audioPillText: {
    color: "#A78BFA",
    fontSize: 9,
    fontWeight: "700",
  },

  selectionBar: {
    width: "100%",
    maxWidth: CANVAS_WIDTH,
    marginTop: 10,
    padding: 8,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  selectionInfo: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  selectionDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#A78BFA",
  },

  selectionText: {
    flex: 1,
    color: "#CBD5E1",
    fontSize: 10,
    fontWeight: "700",
  },

  selectionActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  confirmButton: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(16,185,129,0.1)",
  },

  confirmText: {
    color: "#34D399",
    fontSize: 9,
    fontWeight: "800",
  },

  deleteButton: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(244,63,94,0.1)",
  },

  toolbox: {
    maxHeight: 300,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#070A14",
  },

  tabs: {
    paddingHorizontal: 8,
  },

  tab: {
    minWidth: 76,
    paddingHorizontal: 10,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },

  tabActive: {
    borderBottomColor: "#8B5CF6",
  },

  tabText: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "700",
  },

  tabTextActive: {
    color: "#C4B5FD",
  },

  toolContent: {
    maxHeight: 235,
  },

  toolContentInner: {
    padding: 14,
    paddingBottom: 24,
  },

  sectionLabel: {
    marginBottom: 9,
    color: "#64748B",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  gradientLabel: {
    marginTop: 16,
  },

  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  colorSwatch: {
    width: 39,
    height: 39,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  colorSwatchActive: {
    borderColor: "#FFFFFF",
    borderWidth: 2,
  },

  gradientGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  gradientCard: {
    width: 72,
    height: 42,
    borderRadius: 10,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },

  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.38,
  },

  gradientCardText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    textShadowColor: "#000000",
    textShadowRadius: 5,
  },

  toolHeaderRow: {
    marginBottom: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  sectionTitle: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "800",
  },

  sectionDescription: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 9,
    lineHeight: 13,
  },

  addToolButton: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#6D28D9",
  },

  addToolButtonText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },

  textEditor: {
    minHeight: 65,
    maxHeight: 90,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 18,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  editorMeta: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  characterCounter: {
    color: "#475569",
    fontSize: 8,
  },

  smallApply: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16,185,129,0.08)",
  },

  smallApplyText: {
    color: "#34D399",
    fontSize: 8,
    fontWeight: "800",
  },

  formatRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  formatButton: {
    width: 35,
    height: 35,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  formatButtonActive: {
    backgroundColor: "#FFFFFF",
  },

  sizeControl: {
    height: 35,
    paddingHorizontal: 5,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  sizeLabel: {
    marginHorizontal: 5,
    color: "#64748B",
    fontSize: 8,
    fontWeight: "700",
  },

  sizeButton: {
    width: 25,
    height: 25,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  sizeButtonText: {
    color: "#CBD5E1",
    fontSize: 15,
    lineHeight: 16,
  },

  sizeValue: {
    minWidth: 24,
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    textAlign: "center",
  },

  colorScroll: {
    gap: 8,
    paddingBottom: 3,
  },

  textColor: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  textColorActive: {
    borderColor: "#FFFFFF",
    borderWidth: 2,
  },

  stickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  stickerButton: {
    width: 43,
    height: 43,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  stickerButtonPressed: {
    transform: [{ scale: 0.9 }],
    backgroundColor: "rgba(139,92,246,0.12)",
  },

  stickerText: {
    fontSize: 23,
  },

  audioNotice: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(139,92,246,0.06)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.1)",
  },

  audioNoticeText: {
    flex: 1,
    color: "#7C83A0",
    fontSize: 8,
    lineHeight: 12,
  },

  audioOption: {
    minHeight: 45,
    marginBottom: 6,
    paddingHorizontal: 11,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  audioOptionActive: {
    borderColor: "rgba(139,92,246,0.4)",
    backgroundColor: "rgba(139,92,246,0.1)",
  },

  audioOptionText: {
    flex: 1,
    color: "#CBD5E1",
    fontSize: 10,
    fontWeight: "700",
  },

  audioEmoji: {
    fontSize: 20,
  },

  audioInfo: {
    flex: 1,
  },

  audioName: {
    color: "#E2E8F0",
    fontSize: 10,
    fontWeight: "700",
  },

  audioBpm: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 8,
  },

  audioCheck: {
    marginLeft: "auto",
  },

  animationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  animationButton: {
    minWidth: 92,
    minHeight: 38,
    paddingHorizontal: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  animationButtonActive: {
    borderColor: "rgba(139,92,246,0.55)",
    backgroundColor: "rgba(139,92,246,0.12)",
  },

  animationText: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "700",
  },

  animationTextActive: {
    color: "#C4B5FD",
  },

  replayButton: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(139,92,246,0.08)",
  },

  replayText: {
    color: "#C4B5FD",
    fontSize: 8,
    fontWeight: "800",
  },

  durationCard: {
    marginTop: 11,
    padding: 11,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  durationTitle: {
    color: "#CBD5E1",
    fontSize: 9,
    fontWeight: "800",
  },

  durationDescription: {
    marginTop: 3,
    color: "#475569",
    fontSize: 8,
  },

  durationControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  durationButton: {
    width: 27,
    height: 27,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  durationButtonText: {
    color: "#CBD5E1",
    fontSize: 15,
  },

  durationValue: {
    minWidth: 30,
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    textAlign: "center",
  },

  /* ------------------------------------------------------------------------
   * PREVIEW
   * ---------------------------------------------------------------------- */

  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },

  previewHeader: {
    position: "absolute",
    zIndex: 10,
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === "ios" ? 48 : 18,
    paddingHorizontal: 14,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  previewIcon: {
    width: 39,
    height: 39,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.48)",
  },

  progressContainer: {
    flex: 1,
    flexDirection: "row",
    gap: 4,
  },

  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
  },

  progressTrackActive: {
    backgroundColor: "#FFFFFF",
  },

  previewCanvasContainer: {
    width: Math.min(SCREEN_WIDTH - 28, 420),
    maxWidth: "92%",
    aspectRatio: 9 / 16,
  },

  previewAudio: {
    position: "absolute",
    bottom: 106,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.58)",
  },

  previewAudioText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },

  previewControls: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  previewNavButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.13)",
  },

  previewPlayButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.75)",
  },

  previewDisabled: {
    opacity: 0.25,
  },

  previewCounter: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    fontWeight: "800",
  },
});
