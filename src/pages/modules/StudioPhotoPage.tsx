import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
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
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Bold,
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  Copy,
  Download,
  Image as ImageIcon,
  Italic,
  Layers,
  Maximize2,
  Move,
  Palette,
  Plus,
  RotateCcw,
  Sliders,
  Smile,
  Square,
  Trash2,
  Type,
  ZoomIn,
  ZoomOut,
} from "lucide-react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

/* ============================================================================
 * TYPES
 * ========================================================================== */

type Format = {
  id: string;
  label: string;
  width: number;
  height: number;
};

type FilterId =
  | "none"
  | "vivid"
  | "cool"
  | "warm"
  | "mono"
  | "fade"
  | "dramatic"
  | "retro";

type Layer = TextLayer | StickerLayer | ShapeLayer | ImageLayer;

type BaseLayer = {
  id: string;
  x: number;
  y: number;
  zIndex: number;
  rotation: number;
  scale: number;
  opacity: number;
};

type TextLayer = BaseLayer & {
  kind: "text";
  text: string;
  fontSize: number;
  color: string;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  align: "left" | "center" | "right";
  backgroundColor: string;
};

type StickerLayer = BaseLayer & {
  kind: "sticker";
  emoji: string;
  size: number;
};

type ShapeLayer = BaseLayer & {
  kind: "shape";
  shape: "rect" | "circle" | "line";
  color: string;
  width: number;
  height: number;
};

type ImageLayer = BaseLayer & {
  kind: "image";
  uri: string;
  width: number;
  height: number;
};

type ActiveTab =
  | "design"
  | "text"
  | "stickers"
  | "shapes"
  | "layers"
  | "adjust";

interface Props {
  onBack: () => void;

  /**
   * Real image source supplied by the application's media pipeline.
   * No fake image is created when this is absent.
   */
  initialImageUri?: string;

  /**
   * Real export pipeline.
   *
   * The Studio refuses to pretend an export succeeded when
   * the native renderer/storage pipeline is not connected.
   */
  onExport?: (payload: {
    format: Format;
    backgroundColor: string;
    filter: FilterId;
    brightness: number;
    contrast: number;
    saturation: number;
    layers: Layer[];
  }) => Promise<void>;
}

/* ============================================================================
 * CONSTANTS
 * ========================================================================== */

const MAX_LAYERS = 30;
const MAX_TEXT_LENGTH = 500;

const MIN_FONT_SIZE = 10;
const MAX_FONT_SIZE = 120;

const MIN_SCALE = 0.4;
const MAX_SCALE = 3;

const MIN_OPACITY = 0.2;
const MAX_OPACITY = 1;

const SCREEN_WIDTH = Dimensions.get("window").width;

const FORMATS: Format[] = [
  {
    id: "square",
    label: "Carré",
    width: 1080,
    height: 1080,
  },
  {
    id: "story",
    label: "Story",
    width: 1080,
    height: 1920,
  },
  {
    id: "portrait",
    label: "Portrait",
    width: 1080,
    height: 1350,
  },
  {
    id: "banner",
    label: "Bannière",
    width: 1500,
    height: 500,
  },
];

const BACKGROUNDS = [
  "#050812",
  "#0B1020",
  "#111827",
  "#172554",
  "#1E3A5F",
  "#312E81",
  "#4C1D95",
  "#581C87",
  "#064E3B",
  "#0F766E",
  "#7F1D1D",
  "#831843",
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
  "#000000",
];

const FILTERS: Array<{
  id: FilterId;
  label: string;
  description: string;
}> = [
  {
    id: "none",
    label: "Original",
    description: "Aucun traitement",
  },
  {
    id: "vivid",
    label: "Vivid",
    description: "Couleurs renforcées",
  },
  {
    id: "cool",
    label: "Cool",
    description: "Ambiance froide",
  },
  {
    id: "warm",
    label: "Warm",
    description: "Ambiance chaude",
  },
  {
    id: "mono",
    label: "N&B",
    description: "Monochrome",
  },
  {
    id: "fade",
    label: "Fade",
    description: "Doux et léger",
  },
  {
    id: "dramatic",
    label: "Drama",
    description: "Contraste fort",
  },
  {
    id: "retro",
    label: "Rétro",
    description: "Look vintage",
  },
];

const STICKER_GROUPS = [
  {
    label: "Expressions",
    emojis: [
      "😍",
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
      "🎯",
    ],
  },
  {
    label: "Afrique",
    emojis: [
      "🌍",
      "🦁",
      "🐘",
      "🌴",
      "☀️",
      "🥁",
      "❤️",
      "🤝",
      "🚀",
      "💎",
      "🔥",
      "🌱",
    ],
  },
  {
    label: "Lifestyle",
    emojis: [
      "📱",
      "💰",
      "🛍️",
      "📸",
      "🎵",
      "🎨",
      "📚",
      "💻",
      "🏡",
      "🚗",
      "✈️",
      "☕",
    ],
  },
  {
    label: "Symboles",
    emojis: [
      "❤️",
      "💚",
      "💙",
      "💛",
      "🖤",
      "🤍",
      "💜",
      "🧡",
      "❗",
      "❓",
      "💡",
      "⚡",
    ],
  },
];

const SHAPES: Array<{
  id: ShapeLayer["shape"];
  label: string;
}> = [
  {
    id: "rect",
    label: "Rectangle",
  },
  {
    id: "circle",
    label: "Cercle",
  },
  {
    id: "line",
    label: "Ligne",
  },
];

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function sanitizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, MAX_TEXT_LENGTH);
}

function isTextLayer(layer: Layer): layer is TextLayer {
  return layer.kind === "text";
}

function isShapeLayer(layer: Layer): layer is ShapeLayer {
  return layer.kind === "shape";
}

function isStickerLayer(layer: Layer): layer is StickerLayer {
  return layer.kind === "sticker";
}

function isImageLayer(layer: Layer): layer is ImageLayer {
  return layer.kind === "image";
}

/* ============================================================================
 * SMALL NUMBER CONTROL
 * ========================================================================== */

function NumberControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <View style={styles.numberControl}>
      <Text style={styles.numberLabel}>{label}</Text>

      <View style={styles.numberActions}>
        <Pressable
          onPress={() => onChange(clamp(value - step, min, max))}
          style={styles.numberButton}
        >
          <Text style={styles.numberButtonText}>−</Text>
        </Pressable>

        <Text style={styles.numberValue}>{Math.round(value)}</Text>

        <Pressable
          onPress={() => onChange(clamp(value + step, min, max))}
          style={styles.numberButton}
        >
          <Text style={styles.numberButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ============================================================================
 * CANVAS LAYER
 * ========================================================================== */

function CanvasLayer({
  layer,
  selected,
  canvasWidth,
  canvasHeight,
  onSelect,
  onMove,
}: {
  layer: Layer;
  selected: boolean;
  canvasWidth: number;
  canvasHeight: number;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
}) {
  const scaleAnimation = useSharedValue(1);

  useEffect(() => {
    scaleAnimation.value = withSequenceSafe(0.96, 1);
  }, [layer.id, scaleAnimation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: -50,
      },
      {
        translateY: -50,
      },
      {
        scale: scaleAnimation.value * clamp(layer.scale, MIN_SCALE, MAX_SCALE),
      },
      {
        rotate: `${layer.rotation}deg`,
      },
    ],
  }));

  const startPosition = useRef({
    x: layer.x,
    y: layer.y,
  });

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,

        onMoveShouldSetPanResponder: () => true,

        onPanResponderGrant: () => {
          startPosition.current = {
            x: layer.x,
            y: layer.y,
          };

          onSelect(layer.id);
        },

        onPanResponderMove: (_event, gesture) => {
          if (canvasWidth <= 0 || canvasHeight <= 0) {
            return;
          }

          const dx = (gesture.dx / canvasWidth) * 100;

          const dy = (gesture.dy / canvasHeight) * 100;

          onMove(
            layer.id,
            clamp(startPosition.current.x + dx, 2, 98),
            clamp(startPosition.current.y + dy, 2, 98),
          );
        },
      }),
    [canvasHeight, canvasWidth, layer.id, layer.x, layer.y, onMove, onSelect],
  );

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.layer,
        {
          left: `${layer.x}%`,
          top: `${layer.y}%`,
          opacity: layer.opacity,
          zIndex: layer.zIndex + 10,
        },
        animatedStyle,
        selected ? styles.selectedLayer : null,
      ]}
    >
      {isTextLayer(layer) ? (
        <Text
          style={{
            color: layer.color,
            fontSize: layer.fontSize,
            fontWeight: layer.fontWeight,
            fontStyle: layer.fontStyle,
            textAlign: layer.align,
            backgroundColor:
              layer.backgroundColor === "transparent"
                ? "transparent"
                : layer.backgroundColor,
            paddingHorizontal: layer.backgroundColor === "transparent" ? 0 : 8,
            paddingVertical: layer.backgroundColor === "transparent" ? 0 : 5,
            borderRadius: layer.backgroundColor === "transparent" ? 0 : 8,
            maxWidth: canvasWidth * 0.78,
            textShadowColor: "rgba(0,0,0,0.8)",
            textShadowOffset: {
              width: 0,
              height: 2,
            },
            textShadowRadius: 7,
          }}
        >
          {layer.text}
        </Text>
      ) : null}

      {isStickerLayer(layer) ? (
        <Text
          style={{
            fontSize: layer.size,
            lineHeight: layer.size * 1.12,
          }}
        >
          {layer.emoji}
        </Text>
      ) : null}

      {isShapeLayer(layer) ? (
        <View
          style={{
            width: layer.width,
            height: layer.height,
            backgroundColor: layer.color,
            borderRadius:
              layer.shape === "circle" ? 999 : layer.shape === "line" ? 2 : 10,
          }}
        />
      ) : null}

      {isImageLayer(layer) ? (
        <View
          style={{
            width: layer.width,
            height: layer.height,
            borderRadius: 12,
            backgroundColor: "rgba(255,255,255,0.08)",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.12)",
          }}
        >
          <ImageIcon size={24} color="#94A3B8" />

          <Text style={styles.imageLayerLabel}>Média</Text>
        </View>
      ) : null}

      {selected ? (
        <View pointerEvents="none" style={styles.selectionHandles}>
          <View style={styles.handleTopLeft} />
          <View style={styles.handleTopRight} />
          <View style={styles.handleBottomLeft} />
          <View style={styles.handleBottomRight} />
        </View>
      ) : null}
    </Animated.View>
  );
}

function withSequenceSafe(from: number, to: number) {
  return withSpring(to, {
    damping: 16,
    stiffness: 180,
    velocity: from,
  });
}

/* ============================================================================
 * CANVAS
 * ========================================================================== */

function StudioCanvas({
  backgroundColor,
  layers,
  selected,
  format,
  onSelect,
  onMove,
}: {
  backgroundColor: string;
  layers: Layer[];
  selected: string | null;
  format: Format;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
}) {
  const [canvasSize, setCanvasSize] = useState({
    width: 0,
    height: 0,
  });

  const orderedLayers = useMemo(
    () => [...layers].sort((a, b) => a.zIndex - b.zIndex),
    [layers],
  );

  return (
    <View
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;

        setCanvasSize({
          width,
          height,
        });
      }}
      style={[
        styles.canvas,
        {
          aspectRatio: format.width / format.height,
          backgroundColor,
        },
      ]}
    >
      <Pressable
        onPress={() => onSelect(null)}
        style={StyleSheet.absoluteFill}
      />

      {orderedLayers.map((layer) => (
        <CanvasLayer
          key={layer.id}
          layer={layer}
          selected={selected === layer.id}
          canvasWidth={canvasSize.width}
          canvasHeight={canvasSize.height}
          onSelect={(id) => onSelect(id)}
          onMove={onMove}
        />
      ))}

      {layers.length === 0 ? (
        <View pointerEvents="none" style={styles.emptyCanvas}>
          <View style={styles.emptyCanvasIcon}>
            <Plus size={24} color="#A78BFA" />
          </View>

          <Text style={styles.emptyCanvasTitle}>Ton espace créatif</Text>

          <Text style={styles.emptyCanvasText}>
            Ajoute du texte, des stickers ou des formes pour commencer.
          </Text>
        </View>
      ) : null}

      <View pointerEvents="none" style={styles.formatBadge}>
        <Text style={styles.formatBadgeText}>
          {format.width} × {format.height}
        </Text>
      </View>
    </View>
  );
}

/* ============================================================================
 * MAIN
 * ========================================================================== */

export default function StudioPhotoPage({
  onBack,
  initialImageUri,
  onExport,
}: Props) {
  const [format, setFormat] = useState<Format>(FORMATS[0]);

  const [backgroundColor, setBackgroundColor] = useState(BACKGROUNDS[0]);

  const [filter, setFilter] = useState<FilterId>("none");

  const [brightness, setBrightness] = useState(100);

  const [contrast, setContrast] = useState(100);

  const [saturation, setSaturation] = useState(100);

  const [layers, setLayers] = useState<Layer[]>([]);

  const [selected, setSelected] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>("design");

  const [stickerGroup, setStickerGroup] = useState(0);

  const [exporting, setExporting] = useState(false);

  const [editText, setEditText] = useState("Votre message");

  const [editColor, setEditColor] = useState("#FFFFFF");

  const [editFontSize, setEditFontSize] = useState(30);

  const [editBold, setEditBold] = useState(true);

  const [editItalic, setEditItalic] = useState(false);

  const [editAlign, setEditAlign] = useState<"left" | "center" | "right">(
    "center",
  );

  const [editBackground, setEditBackground] = useState("transparent");

  const [zoom, setZoom] = useState(1);

  const selectedLayer = useMemo(
    () => layers.find((layer) => layer.id === selected) ?? null,
    [layers, selected],
  );

  /* --------------------------------------------------------------------------
   * INITIAL IMAGE
   * ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!initialImageUri) {
      return;
    }

    const imageLayer: ImageLayer = {
      id: createId("image"),
      kind: "image",
      uri: initialImageUri,
      x: 50,
      y: 50,
      zIndex: 0,
      rotation: 0,
      scale: 1,
      opacity: 1,
      width: 240,
      height: 240,
    };

    setLayers([imageLayer]);
    setSelected(imageLayer.id);
  }, [initialImageUri]);

  /* --------------------------------------------------------------------------
   * SELECTED TEXT SYNC
   * ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!selectedLayer) {
      return;
    }

    if (isTextLayer(selectedLayer)) {
      setEditText(selectedLayer.text);
      setEditColor(selectedLayer.color);
      setEditFontSize(selectedLayer.fontSize);
      setEditBold(selectedLayer.fontWeight === "bold");
      setEditItalic(selectedLayer.fontStyle === "italic");
      setEditAlign(selectedLayer.align);
      setEditBackground(selectedLayer.backgroundColor);
    }
  }, [selectedLayer]);

  /* --------------------------------------------------------------------------
   * UPDATE LAYERS
   * ------------------------------------------------------------------------ */

  const updateLayer = useCallback(
    (id: string, updater: (layer: Layer) => Layer) => {
      setLayers((current) =>
        current.map((layer) => (layer.id === id ? updater(layer) : layer)),
      );
    },
    [],
  );

  const moveLayer = useCallback(
    (id: string, x: number, y: number) => {
      updateLayer(id, (layer) => ({
        ...layer,
        x,
        y,
      }));
    },
    [updateLayer],
  );

  /* --------------------------------------------------------------------------
   * ADD TEXT
   * ------------------------------------------------------------------------ */

  const addText = useCallback(() => {
    if (layers.length >= MAX_LAYERS) {
      Alert.alert(
        "Limite atteinte",
        `Un projet peut contenir au maximum ${MAX_LAYERS} calques.`,
      );
      return;
    }

    const layer: TextLayer = {
      id: createId("text"),
      kind: "text",
      text: "Votre texte",
      fontSize: 30,
      color: "#FFFFFF",
      fontWeight: "bold",
      fontStyle: "normal",
      align: "center",
      backgroundColor: "transparent",
      x: 50,
      y: 50,
      zIndex: layers.length,
      rotation: 0,
      scale: 1,
      opacity: 1,
    };

    setLayers((current) => [...current, layer]);

    setSelected(layer.id);
    setActiveTab("text");
  }, [layers.length]);

  /* --------------------------------------------------------------------------
   * ADD STICKER
   * ------------------------------------------------------------------------ */

  const addSticker = useCallback(
    (emoji: string) => {
      if (layers.length >= MAX_LAYERS) {
        Alert.alert(
          "Limite atteinte",
          `Un projet peut contenir au maximum ${MAX_LAYERS} calques.`,
        );
        return;
      }

      const layer: StickerLayer = {
        id: createId("sticker"),
        kind: "sticker",
        emoji,
        size: 52,
        x: 50,
        y: 50,
        zIndex: layers.length,
        rotation: 0,
        scale: 1,
        opacity: 1,
      };

      setLayers((current) => [...current, layer]);

      setSelected(layer.id);
    },
    [layers.length],
  );

  /* --------------------------------------------------------------------------
   * ADD SHAPE
   * ------------------------------------------------------------------------ */

  const addShape = useCallback(
    (shape: ShapeLayer["shape"]) => {
      if (layers.length >= MAX_LAYERS) {
        Alert.alert(
          "Limite atteinte",
          `Un projet peut contenir au maximum ${MAX_LAYERS} calques.`,
        );
        return;
      }

      const layer: ShapeLayer = {
        id: createId("shape"),
        kind: "shape",
        shape,
        color: "#8B5CF6",
        width: shape === "line" ? 100 : 90,
        height: shape === "line" ? 4 : 90,
        x: 50,
        y: 50,
        zIndex: layers.length,
        rotation: 0,
        scale: 1,
        opacity: 0.85,
      };

      setLayers((current) => [...current, layer]);

      setSelected(layer.id);
    },
    [layers.length],
  );

  /* --------------------------------------------------------------------------
   * DELETE
   * ------------------------------------------------------------------------ */

  const deleteLayer = useCallback((id: string) => {
    setLayers((current) => current.filter((layer) => layer.id !== id));

    setSelected(null);
  }, []);

  /* --------------------------------------------------------------------------
   * DUPLICATE
   * ------------------------------------------------------------------------ */

  const duplicateLayer = useCallback(
    (id: string) => {
      if (layers.length >= MAX_LAYERS) {
        Alert.alert(
          "Limite atteinte",
          `Un projet peut contenir au maximum ${MAX_LAYERS} calques.`,
        );
        return;
      }

      const original = layers.find((layer) => layer.id === id);

      if (!original) {
        return;
      }

      const clone: Layer = {
        ...original,
        id: createId(original.kind),
        x: clamp(original.x + 5, 2, 98),
        y: clamp(original.y + 5, 2, 98),
        zIndex: Math.max(...layers.map((layer) => layer.zIndex)) + 1,
      };

      setLayers((current) => [...current, clone]);

      setSelected(clone.id);
    },
    [layers],
  );

  /* --------------------------------------------------------------------------
   * Z ORDER
   * ------------------------------------------------------------------------ */

  const bringForward = useCallback(
    (id: string) => {
      const max =
        layers.length > 0
          ? Math.max(...layers.map((layer) => layer.zIndex))
          : 0;

      updateLayer(id, (layer) => ({
        ...layer,
        zIndex: max + 1,
      }));
    },
    [layers, updateLayer],
  );

  const sendBackward = useCallback(
    (id: string) => {
      const min =
        layers.length > 0
          ? Math.min(...layers.map((layer) => layer.zIndex))
          : 0;

      updateLayer(id, (layer) => ({
        ...layer,
        zIndex: min - 1,
      }));
    },
    [layers, updateLayer],
  );

  /* --------------------------------------------------------------------------
   * RESET
   * ------------------------------------------------------------------------ */

  const resetProject = useCallback(() => {
    Alert.alert(
      "Réinitialiser le Studio",
      "Toutes les modifications locales de cette création seront supprimées.",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Réinitialiser",
          style: "destructive",
          onPress: () => {
            setLayers([]);
            setSelected(null);
            setBackgroundColor(BACKGROUNDS[0]);
            setFilter("none");
            setBrightness(100);
            setContrast(100);
            setSaturation(100);
            setZoom(1);
          },
        },
      ],
    );
  }, []);

  /* --------------------------------------------------------------------------
   * EXPORT
   * ------------------------------------------------------------------------ */

  const exportProject = useCallback(async () => {
    if (exporting) {
      return;
    }

    if (!onExport) {
      Alert.alert(
        "Export non configuré",
        "Le Studio est prêt côté édition native, mais aucun moteur de rendu/export natif n'est connecté. Aucun faux export ne sera déclaré réussi.",
      );
      return;
    }

    setExporting(true);

    try {
      await onExport({
        format,
        backgroundColor,
        filter,
        brightness,
        contrast,
        saturation,
        layers,
      });

      Alert.alert(
        "Export terminé",
        "Votre création a été transmise au moteur d'export.",
      );
    } catch (error) {
      Alert.alert(
        "Export impossible",
        error instanceof Error
          ? error.message
          : "Le moteur d'export a rencontré une erreur.",
      );
    } finally {
      setExporting(false);
    }
  }, [
    backgroundColor,
    contrast,
    exporting,
    filter,
    format,
    layers,
    onExport,
    saturation,
    brightness,
  ]);

  /* --------------------------------------------------------------------------
   * RESET ADJUSTMENTS
   * ------------------------------------------------------------------------ */

  const resetAdjustments = useCallback(() => {
    setFilter("none");
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
  }, []);

  /* --------------------------------------------------------------------------
   * APPLY TEXT
   * ------------------------------------------------------------------------ */

  const applyTextChanges = useCallback(() => {
    if (!selectedLayer) {
      return;
    }

    if (!isTextLayer(selectedLayer)) {
      return;
    }

    updateLayer(selectedLayer.id, (layer) => {
      if (!isTextLayer(layer)) {
        return layer;
      }

      return {
        ...layer,
        text: sanitizeText(editText) || "Votre texte",
        color: editColor,
        fontSize: clamp(editFontSize, MIN_FONT_SIZE, MAX_FONT_SIZE),
        fontWeight: editBold ? "bold" : "normal",
        fontStyle: editItalic ? "italic" : "normal",
        align: editAlign,
        backgroundColor: editBackground,
      };
    });
  }, [
    editAlign,
    editBackground,
    editBold,
    editColor,
    editFontSize,
    editItalic,
    editText,
    selectedLayer,
    updateLayer,
  ]);

  /* --------------------------------------------------------------------------
   * TABS
   * ------------------------------------------------------------------------ */

  const tabs = useMemo(
    () => [
      {
        id: "design" as const,
        label: "Design",
        icon: Palette,
      },
      {
        id: "text" as const,
        label: "Texte",
        icon: Type,
      },
      {
        id: "stickers" as const,
        label: "Stickers",
        icon: Smile,
      },
      {
        id: "shapes" as const,
        label: "Formes",
        icon: Square,
      },
      {
        id: "layers" as const,
        label: "Calques",
        icon: Layers,
      },
      {
        id: "adjust" as const,
        label: "Réglages",
        icon: Sliders,
      },
    ],
    [],
  );

  /* --------------------------------------------------------------------------
   * RENDER
   * ------------------------------------------------------------------------ */

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
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <ArrowLeft size={19} color="#FFFFFF" />
          </Pressable>

          <View style={styles.headerIdentity}>
            <View style={styles.titleRow}>
              <Text style={styles.headerTitle}>Studio</Text>

              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>CREATIVE</Text>
              </View>
            </View>

            <Text style={styles.headerSubtitle}>Crée. Compose. Publie.</Text>
          </View>

          <Pressable onPress={resetProject} style={styles.headerIcon}>
            <RotateCcw size={17} color="#94A3B8" />
          </Pressable>

          <Pressable
            onPress={exportProject}
            disabled={exporting}
            style={[
              styles.exportButton,
              exporting ? styles.exportButtonDisabled : null,
            ]}
          >
            <Download size={15} color="#FFFFFF" />

            <Text style={styles.exportButtonText}>
              {exporting ? "Export…" : "Exporter"}
            </Text>
          </Pressable>
        </View>

        {/* ================================================================
            FORMAT BAR
        ================================================================ */}

        <View style={styles.formatBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.formatContent}
          >
            {FORMATS.map((item) => {
              const active = format.id === item.id;

              return (
                <Pressable
                  key={item.id}
                  onPress={() => setFormat(item)}
                  style={[
                    styles.formatButton,
                    active ? styles.formatButtonActive : null,
                  ]}
                >
                  <Maximize2 size={12} color={active ? "#FFFFFF" : "#64748B"} />

                  <Text
                    style={[
                      styles.formatText,
                      active ? styles.formatTextActive : null,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ================================================================
            CANVAS AREA
        ================================================================ */}

        <View style={styles.canvasArea}>
          <View
            style={[
              styles.canvasScaleWrapper,
              {
                transform: [
                  {
                    scale: zoom,
                  },
                ],
              },
            ]}
          >
            <StudioCanvas
              backgroundColor={backgroundColor}
              layers={layers}
              selected={selected}
              format={format}
              onSelect={setSelected}
              onMove={moveLayer}
            />
          </View>

          {/* Zoom controls */}

          <View style={styles.zoomControls}>
            <Pressable
              onPress={() => setZoom((value) => clamp(value - 0.1, 0.7, 1.25))}
              style={styles.zoomButton}
            >
              <ZoomOut size={15} color="#CBD5E1" />
            </Pressable>

            <Text style={styles.zoomText}>{Math.round(zoom * 100)}%</Text>

            <Pressable
              onPress={() => setZoom((value) => clamp(value + 0.1, 0.7, 1.25))}
              style={styles.zoomButton}
            >
              <ZoomIn size={15} color="#CBD5E1" />
            </Pressable>
          </View>
        </View>

        {/* ================================================================
            SELECTED LAYER BAR
        ================================================================ */}

        {selectedLayer ? (
          <View style={styles.selectionBar}>
            <View style={styles.selectionIdentity}>
              <View style={styles.selectionDot} />

              <Text style={styles.selectionTitle}>
                {selectedLayer.kind === "text"
                  ? "Texte"
                  : selectedLayer.kind === "sticker"
                    ? "Sticker"
                    : selectedLayer.kind === "shape"
                      ? "Forme"
                      : "Média"}
              </Text>
            </View>

            <View style={styles.selectionActions}>
              <Pressable
                onPress={() => bringForward(selectedLayer.id)}
                style={styles.layerAction}
              >
                <ChevronUp size={14} color="#CBD5E1" />
              </Pressable>

              <Pressable
                onPress={() => sendBackward(selectedLayer.id)}
                style={styles.layerAction}
              >
                <ChevronDown size={14} color="#CBD5E1" />
              </Pressable>

              <Pressable
                onPress={() => duplicateLayer(selectedLayer.id)}
                style={styles.layerAction}
              >
                <Copy size={14} color="#CBD5E1" />
              </Pressable>

              <Pressable
                onPress={() => deleteLayer(selectedLayer.id)}
                style={[styles.layerAction, styles.layerDelete]}
              >
                <Trash2 size={14} color="#FB7185" />
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* ================================================================
            TOOLBOX
        ================================================================ */}

        <View style={styles.toolbox}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
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
            style={styles.panel}
            contentContainerStyle={styles.panelContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ============================================================
                DESIGN
            ============================================================ */}

            {activeTab === "design" ? (
              <View>
                <Text style={styles.sectionLabel}>FOND</Text>

                <View style={styles.colorGrid}>
                  {BACKGROUNDS.map((color) => (
                    <Pressable
                      key={color}
                      onPress={() => setBackgroundColor(color)}
                      style={[
                        styles.backgroundSwatch,
                        {
                          backgroundColor: color,
                        },
                        backgroundColor === color
                          ? styles.backgroundSwatchActive
                          : null,
                      ]}
                    >
                      {backgroundColor === color ? (
                        <Check size={14} color="#FFFFFF" />
                      ) : null}
                    </Pressable>
                  ))}
                </View>

                <View style={styles.designDivider} />

                <View style={styles.quickActions}>
                  <Pressable onPress={addText} style={styles.quickAction}>
                    <Type size={16} color="#C4B5FD" />

                    <Text style={styles.quickActionText}>Texte</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => addSticker("🔥")}
                    style={styles.quickAction}
                  >
                    <Smile size={16} color="#C4B5FD" />

                    <Text style={styles.quickActionText}>Sticker</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => addShape("rect")}
                    style={styles.quickAction}
                  >
                    <Square size={16} color="#C4B5FD" />

                    <Text style={styles.quickActionText}>Forme</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {/* ============================================================
                TEXT
            ============================================================ */}

            {activeTab === "text" ? (
              <View>
                <View style={styles.panelHeader}>
                  <View>
                    <Text style={styles.panelTitle}>Typographie</Text>

                    <Text style={styles.panelDescription}>
                      Construis une identité visuelle forte.
                    </Text>
                  </View>

                  <Pressable
                    onPress={addText}
                    style={styles.primarySmallButton}
                  >
                    <Plus size={14} color="#FFFFFF" />

                    <Text style={styles.primarySmallButtonText}>Ajouter</Text>
                  </Pressable>
                </View>

                {selectedLayer && isTextLayer(selectedLayer) ? (
                  <View>
                    <TextInput
                      value={editText}
                      onChangeText={(value) =>
                        setEditText(value.slice(0, MAX_TEXT_LENGTH))
                      }
                      multiline
                      maxLength={MAX_TEXT_LENGTH}
                      placeholder="Votre texte…"
                      placeholderTextColor="#475569"
                      textAlignVertical="top"
                      style={styles.textInput}
                    />

                    <View style={styles.characterRow}>
                      <Text style={styles.characterText}>
                        {editText.length}/{MAX_TEXT_LENGTH}
                      </Text>

                      <Pressable
                        onPress={applyTextChanges}
                        style={styles.applyButton}
                      >
                        <Check size={13} color="#34D399" />

                        <Text style={styles.applyText}>Appliquer</Text>
                      </Pressable>
                    </View>

                    <View style={styles.formatRow}>
                      <Pressable
                        onPress={() => setEditBold((value) => !value)}
                        style={[
                          styles.formatControl,
                          editBold ? styles.formatControlActive : null,
                        ]}
                      >
                        <Bold
                          size={16}
                          color={editBold ? "#0F172A" : "#CBD5E1"}
                        />
                      </Pressable>

                      <Pressable
                        onPress={() => setEditItalic((value) => !value)}
                        style={[
                          styles.formatControl,
                          editItalic ? styles.formatControlActive : null,
                        ]}
                      >
                        <Italic
                          size={16}
                          color={editItalic ? "#0F172A" : "#CBD5E1"}
                        />
                      </Pressable>

                      {(["left", "center", "right"] as const).map((align) => (
                        <Pressable
                          key={align}
                          onPress={() => setEditAlign(align)}
                          style={[
                            styles.formatControl,
                            editAlign === align
                              ? styles.formatControlActive
                              : null,
                          ]}
                        >
                          {align === "left" ? (
                            <AlignLeft
                              size={15}
                              color={
                                editAlign === align ? "#0F172A" : "#CBD5E1"
                              }
                            />
                          ) : align === "center" ? (
                            <AlignCenter
                              size={15}
                              color={
                                editAlign === align ? "#0F172A" : "#CBD5E1"
                              }
                            />
                          ) : (
                            <AlignRight
                              size={15}
                              color={
                                editAlign === align ? "#0F172A" : "#CBD5E1"
                              }
                            />
                          )}
                        </Pressable>
                      ))}
                    </View>

                    <NumberControl
                      label="Taille"
                      value={editFontSize}
                      min={MIN_FONT_SIZE}
                      max={MAX_FONT_SIZE}
                      step={2}
                      onChange={setEditFontSize}
                    />

                    <Text style={styles.sectionLabel}>COULEUR</Text>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.horizontalColors}
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
                              size={12}
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

                    <Text style={styles.sectionLabel}>FOND DU TEXTE</Text>

                    <View style={styles.backgroundChoices}>
                      {[
                        "transparent",
                        "rgba(0,0,0,0.65)",
                        "rgba(255,255,255,0.82)",
                        "rgba(139,92,246,0.75)",
                      ].map((color) => (
                        <Pressable
                          key={color}
                          onPress={() => setEditBackground(color)}
                          style={[
                            styles.textBackgroundChoice,
                            color === "transparent"
                              ? styles.transparentChoice
                              : {
                                  backgroundColor: color,
                                },
                            editBackground === color
                              ? styles.textBackgroundChoiceActive
                              : null,
                          ]}
                        >
                          {editBackground === color ? (
                            <Check size={13} color="#FFFFFF" />
                          ) : null}
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptyPanel}>
                    <Type size={22} color="#64748B" />

                    <Text style={styles.emptyPanelTitle}>
                      Sélectionne un texte
                    </Text>

                    <Text style={styles.emptyPanelText}>
                      Ou ajoute un nouveau bloc de texte.
                    </Text>
                  </View>
                )}
              </View>
            ) : null}

            {/* ============================================================
                STICKERS
            ============================================================ */}

            {activeTab === "stickers" ? (
              <View>
                <Text style={styles.panelTitle}>Stickers</Text>

                <Text style={styles.panelDescription}>
                  Donne une signature à ta création.
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.stickerTabs}
                >
                  {STICKER_GROUPS.map((group, index) => (
                    <Pressable
                      key={group.label}
                      onPress={() => setStickerGroup(index)}
                      style={[
                        styles.stickerTab,
                        stickerGroup === index ? styles.stickerTabActive : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stickerTabText,
                          stickerGroup === index
                            ? styles.stickerTabTextActive
                            : null,
                        ]}
                      >
                        {group.label}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <View style={styles.stickerGrid}>
                  {STICKER_GROUPS[stickerGroup].emojis.map((emoji) => (
                    <Pressable
                      key={emoji}
                      onPress={() => addSticker(emoji)}
                      style={styles.stickerButton}
                    >
                      <Text style={styles.stickerEmoji}>{emoji}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            {/* ============================================================
                SHAPES
            ============================================================ */}

            {activeTab === "shapes" ? (
              <View>
                <Text style={styles.panelTitle}>Formes</Text>

                <Text style={styles.panelDescription}>
                  Construis des compositions visuelles propres.
                </Text>

                <View style={styles.shapeGrid}>
                  {SHAPES.map((shape) => (
                    <Pressable
                      key={shape.id}
                      onPress={() => addShape(shape.id)}
                      style={styles.shapeButton}
                    >
                      {shape.id === "circle" ? (
                        <View style={styles.shapeCircle} />
                      ) : shape.id === "line" ? (
                        <View style={styles.shapeLine} />
                      ) : (
                        <View style={styles.shapeRectangle} />
                      )}

                      <Text style={styles.shapeLabel}>{shape.label}</Text>
                    </Pressable>
                  ))}
                </View>

                {selectedLayer && isShapeLayer(selectedLayer) ? (
                  <View style={styles.shapeEditor}>
                    <Text style={styles.sectionLabel}>COULEUR</Text>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.horizontalColors}
                    >
                      {TEXT_COLORS.map((color) => (
                        <Pressable
                          key={color}
                          onPress={() =>
                            updateLayer(selectedLayer.id, (layer) =>
                              isShapeLayer(layer)
                                ? {
                                    ...layer,
                                    color,
                                  }
                                : layer,
                            )
                          }
                          style={[
                            styles.textColor,
                            {
                              backgroundColor: color,
                            },
                          ]}
                        />
                      ))}
                    </ScrollView>

                    <NumberControl
                      label="Largeur"
                      value={selectedLayer.width}
                      min={4}
                      max={500}
                      step={5}
                      onChange={(value) =>
                        updateLayer(selectedLayer.id, (layer) =>
                          isShapeLayer(layer)
                            ? {
                                ...layer,
                                width: value,
                              }
                            : layer,
                        )
                      }
                    />

                    <NumberControl
                      label="Hauteur"
                      value={selectedLayer.height}
                      min={2}
                      max={500}
                      step={5}
                      onChange={(value) =>
                        updateLayer(selectedLayer.id, (layer) =>
                          isShapeLayer(layer)
                            ? {
                                ...layer,
                                height: value,
                              }
                            : layer,
                        )
                      }
                    />
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* ============================================================
                LAYERS
            ============================================================ */}

            {activeTab === "layers" ? (
              <View>
                <View style={styles.panelHeader}>
                  <View>
                    <Text style={styles.panelTitle}>Calques</Text>

                    <Text style={styles.panelDescription}>
                      Organise chaque élément de ta composition.
                    </Text>
                  </View>

                  <View style={styles.layerCounter}>
                    <Text style={styles.layerCounterText}>
                      {layers.length}/{MAX_LAYERS}
                    </Text>
                  </View>
                </View>

                {layers.length === 0 ? (
                  <View style={styles.emptyPanel}>
                    <Layers size={22} color="#64748B" />

                    <Text style={styles.emptyPanelTitle}>Aucun calque</Text>

                    <Text style={styles.emptyPanelText}>
                      Commence par ajouter un élément.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.layerList}>
                    {[...layers]
                      .sort((a, b) => b.zIndex - a.zIndex)
                      .map((layer) => (
                        <Pressable
                          key={layer.id}
                          onPress={() => setSelected(layer.id)}
                          style={[
                            styles.layerRow,
                            selected === layer.id
                              ? styles.layerRowActive
                              : null,
                          ]}
                        >
                          <View style={styles.layerIcon}>
                            {isTextLayer(layer) ? (
                              <Type size={14} color="#A78BFA" />
                            ) : isStickerLayer(layer) ? (
                              <Smile size={14} color="#A78BFA" />
                            ) : isShapeLayer(layer) ? (
                              <Square size={14} color="#A78BFA" />
                            ) : (
                              <ImageIcon size={14} color="#A78BFA" />
                            )}
                          </View>

                          <View style={styles.layerInfo}>
                            <Text numberOfLines={1} style={styles.layerName}>
                              {isTextLayer(layer)
                                ? layer.text || "Texte"
                                : isStickerLayer(layer)
                                  ? layer.emoji
                                  : isShapeLayer(layer)
                                    ? "Forme"
                                    : "Média"}
                            </Text>

                            <Text style={styles.layerMeta}>{layer.kind}</Text>
                          </View>

                          <Pressable
                            onPress={() => duplicateLayer(layer.id)}
                            style={styles.layerRowButton}
                          >
                            <Copy size={13} color="#94A3B8" />
                          </Pressable>

                          <Pressable
                            onPress={() => deleteLayer(layer.id)}
                            style={styles.layerRowButton}
                          >
                            <Trash2 size={13} color="#FB7185" />
                          </Pressable>
                        </Pressable>
                      ))}
                  </View>
                )}
              </View>
            ) : null}

            {/* ============================================================
                ADJUST
            ============================================================ */}

            {activeTab === "adjust" ? (
              <View>
                <View style={styles.panelHeader}>
                  <View>
                    <Text style={styles.panelTitle}>Réglages</Text>

                    <Text style={styles.panelDescription}>
                      Prépare ton rendu visuel.
                    </Text>
                  </View>

                  <Pressable
                    onPress={resetAdjustments}
                    style={styles.resetSmallButton}
                  >
                    <RotateCcw size={13} color="#A78BFA" />

                    <Text style={styles.resetSmallText}>Reset</Text>
                  </Pressable>
                </View>

                <Text style={styles.sectionLabel}>FILTRE</Text>

                <View style={styles.filterGrid}>
                  {FILTERS.map((item) => {
                    const active = filter === item.id;

                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => setFilter(item.id)}
                        style={[
                          styles.filterButton,
                          active ? styles.filterButtonActive : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterName,
                            active ? styles.filterNameActive : null,
                          ]}
                        >
                          {item.label}
                        </Text>

                        <Text style={styles.filterDescription}>
                          {item.description}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <NumberControl
                  label="Luminosité"
                  value={brightness}
                  min={50}
                  max={150}
                  step={5}
                  onChange={setBrightness}
                />

                <NumberControl
                  label="Contraste"
                  value={contrast}
                  min={50}
                  max={180}
                  step={5}
                  onChange={setContrast}
                />

                <NumberControl
                  label="Saturation"
                  value={saturation}
                  min={0}
                  max={200}
                  step={5}
                  onChange={setSaturation}
                />

                <View style={styles.adjustmentNotice}>
                  <Sliders size={14} color="#A78BFA" />

                  <Text style={styles.adjustmentNoticeText}>
                    Les paramètres sont conservés dans le projet. Leur rendu
                    final dépend du moteur de composition natif connecté à
                    l'export.
                  </Text>
                </View>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

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
    gap: 9,
    backgroundColor: "#050812",
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

  headerIdentity: {
    flex: 1,
    minWidth: 0,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  headerSubtitle: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 9,
    fontWeight: "600",
  },

  proBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: "rgba(139,92,246,0.16)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
  },

  proBadgeText: {
    color: "#C4B5FD",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  exportButton: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#6D28D9",
  },

  exportButtonDisabled: {
    opacity: 0.5,
  },

  exportButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },

  formatBar: {
    minHeight: 49,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#050812",
  },

  formatContent: {
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 7,
  },

  formatButton: {
    minHeight: 31,
    paddingHorizontal: 10,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  formatButtonActive: {
    backgroundColor: "rgba(109,40,217,0.75)",
    borderColor: "rgba(167,139,250,0.45)",
  },

  formatText: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "700",
  },

  formatTextActive: {
    color: "#FFFFFF",
  },

  canvasArea: {
    flex: 1,
    minHeight: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 15,
    backgroundColor: "#02030A",
    overflow: "hidden",
  },

  canvasScaleWrapper: {
    width: Math.min(SCREEN_WIDTH - 42, 330),
    maxHeight: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  canvas: {
    width: "100%",
    maxHeight: "100%",
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    shadowColor: "#000000",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    elevation: 10,
  },

  layer: {
    position: "absolute",
    minWidth: 28,
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  selectedLayer: {
    borderWidth: 1,
    borderColor: "#A78BFA",
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 5,
    backgroundColor: "rgba(139,92,246,0.06)",
  },

  selectionHandles: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: "none",
  },

  handleTopLeft: {
    position: "absolute",
    left: -4,
    top: -4,
    width: 7,
    height: 7,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
  },

  handleTopRight: {
    position: "absolute",
    right: -4,
    top: -4,
    width: 7,
    height: 7,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
  },

  handleBottomLeft: {
    position: "absolute",
    left: -4,
    bottom: -4,
    width: 7,
    height: 7,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
  },

  handleBottomRight: {
    position: "absolute",
    right: -4,
    bottom: -4,
    width: 7,
    height: 7,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "rgba(139,92,246,0.1)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
  },

  emptyCanvasTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },

  emptyCanvasText: {
    marginTop: 5,
    color: "rgba(255,255,255,0.42)",
    fontSize: 9,
    lineHeight: 14,
    textAlign: "center",
  },

  formatBadge: {
    position: "absolute",
    right: 9,
    top: 9,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: "rgba(0,0,0,0.42)",
  },

  formatBadgeText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 7,
    fontWeight: "800",
  },

  zoomControls: {
    position: "absolute",
    right: 14,
    bottom: 12,
    minHeight: 35,
    paddingHorizontal: 5,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(7,10,20,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  zoomButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  zoomText: {
    minWidth: 34,
    color: "#94A3B8",
    fontSize: 8,
    fontWeight: "800",
    textAlign: "center",
  },

  imageLayerLabel: {
    marginTop: 4,
    color: "#94A3B8",
    fontSize: 8,
    fontWeight: "700",
  },

  selectionBar: {
    minHeight: 47,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    backgroundColor: "#080B16",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  selectionIdentity: {
    flex: 1,
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

  selectionTitle: {
    color: "#CBD5E1",
    fontSize: 9,
    fontWeight: "800",
  },

  selectionActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  layerAction: {
    width: 31,
    height: 31,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  layerDelete: {
    backgroundColor: "rgba(244,63,94,0.08)",
  },

  toolbox: {
    maxHeight: 305,
    backgroundColor: "#070A14",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },

  tabsContent: {
    paddingHorizontal: 5,
  },

  tab: {
    minWidth: 75,
    paddingHorizontal: 9,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },

  tabActive: {
    borderBottomColor: "#8B5CF6",
  },

  tabText: {
    color: "#64748B",
    fontSize: 8,
    fontWeight: "800",
  },

  tabTextActive: {
    color: "#C4B5FD",
  },

  panel: {
    maxHeight: 250,
  },

  panelContent: {
    padding: 14,
    paddingBottom: 25,
  },

  panelHeader: {
    marginBottom: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  panelTitle: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "900",
  },

  panelDescription: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 8,
    lineHeight: 12,
  },

  sectionLabel: {
    marginTop: 4,
    marginBottom: 9,
    color: "#64748B",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  backgroundSwatch: {
    width: 37,
    height: 37,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  backgroundSwatchActive: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  designDivider: {
    height: 1,
    marginVertical: 13,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  quickActions: {
    flexDirection: "row",
    gap: 8,
  },

  quickAction: {
    flex: 1,
    minHeight: 45,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  quickActionText: {
    color: "#94A3B8",
    fontSize: 8,
    fontWeight: "800",
  },

  primarySmallButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#6D28D9",
  },

  primarySmallButtonText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "800",
  },

  textInput: {
    minHeight: 68,
    maxHeight: 95,
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderRadius: 11,
    color: "#FFFFFF",
    fontSize: 11,
    lineHeight: 17,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  characterRow: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  characterText: {
    color: "#475569",
    fontSize: 8,
  },

  applyButton: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16,185,129,0.08)",
  },

  applyText: {
    color: "#34D399",
    fontSize: 8,
    fontWeight: "800",
  },

  formatRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  formatControl: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  formatControlActive: {
    backgroundColor: "#FFFFFF",
  },

  numberControl: {
    minHeight: 40,
    marginTop: 9,
    paddingHorizontal: 9,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  numberLabel: {
    color: "#94A3B8",
    fontSize: 9,
    fontWeight: "700",
  },

  numberActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  numberButton: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  numberButtonText: {
    color: "#CBD5E1",
    fontSize: 15,
  },

  numberValue: {
    minWidth: 34,
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    textAlign: "center",
  },

  horizontalColors: {
    gap: 7,
    paddingBottom: 2,
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
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  backgroundChoices: {
    flexDirection: "row",
    gap: 8,
  },

  textBackgroundChoice: {
    width: 34,
    height: 29,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  transparentChoice: {
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  textBackgroundChoiceActive: {
    borderWidth: 2,
    borderColor: "#A78BFA",
  },

  emptyPanel: {
    minHeight: 100,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  emptyPanelTitle: {
    marginTop: 7,
    color: "#CBD5E1",
    fontSize: 10,
    fontWeight: "800",
  },

  emptyPanelText: {
    marginTop: 3,
    color: "#475569",
    fontSize: 8,
    textAlign: "center",
  },

  stickerTabs: {
    marginTop: 11,
    gap: 6,
    paddingBottom: 7,
  },

  stickerTab: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  stickerTabActive: {
    backgroundColor: "rgba(139,92,246,0.18)",
  },

  stickerTabText: {
    color: "#64748B",
    fontSize: 8,
    fontWeight: "800",
  },

  stickerTabTextActive: {
    color: "#C4B5FD",
  },

  stickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  stickerButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  stickerEmoji: {
    fontSize: 22,
  },

  shapeGrid: {
    flexDirection: "row",
    gap: 8,
  },

  shapeButton: {
    flex: 1,
    minHeight: 75,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  shapeRectangle: {
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: "#8B5CF6",
  },

  shapeCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#8B5CF6",
  },

  shapeLine: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#8B5CF6",
  },

  shapeLabel: {
    color: "#94A3B8",
    fontSize: 8,
    fontWeight: "700",
  },

  shapeEditor: {
    marginTop: 12,
  },

  layerCounter: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: "rgba(139,92,246,0.08)",
  },

  layerCounterText: {
    color: "#A78BFA",
    fontSize: 8,
    fontWeight: "900",
  },

  layerList: {
    gap: 6,
  },

  layerRow: {
    minHeight: 45,
    paddingHorizontal: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  layerRowActive: {
    borderColor: "rgba(139,92,246,0.45)",
    backgroundColor: "rgba(139,92,246,0.08)",
  },

  layerIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.08)",
  },

  layerInfo: {
    flex: 1,
    minWidth: 0,
  },

  layerName: {
    color: "#CBD5E1",
    fontSize: 9,
    fontWeight: "800",
  },

  layerMeta: {
    marginTop: 2,
    color: "#475569",
    fontSize: 7,
  },

  layerRowButton: {
    width: 29,
    height: 29,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  resetSmallButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(139,92,246,0.07)",
  },

  resetSmallText: {
    color: "#A78BFA",
    fontSize: 8,
    fontWeight: "800",
  },

  filterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  filterButton: {
    width: "23%",
    minHeight: 43,
    paddingHorizontal: 5,
    paddingVertical: 6,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  filterButtonActive: {
    borderColor: "rgba(139,92,246,0.5)",
    backgroundColor: "rgba(139,92,246,0.12)",
  },

  filterName: {
    color: "#64748B",
    fontSize: 8,
    fontWeight: "900",
  },

  filterNameActive: {
    color: "#C4B5FD",
  },

  filterDescription: {
    marginTop: 2,
    color: "#475569",
    fontSize: 6,
    textAlign: "center",
  },

  adjustmentNotice: {
    marginTop: 11,
    padding: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    backgroundColor: "rgba(139,92,246,0.06)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.12)",
  },

  adjustmentNoticeText: {
    flex: 1,
    color: "#64748B",
    fontSize: 8,
    lineHeight: 12,
  },
});
