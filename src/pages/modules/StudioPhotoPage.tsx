// src/pages/modules/StudioPhotoPage.tsx

import {
  Alert,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Bold,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Italic,
  Palette,
  Plus,
  RotateCcw,
  Sliders,
  Smile,
  Square,
  Trash2,
  Type,
  ZoomIn,
} from "lucide-react-native";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Format = {
  id: string;
  label: string;
  w: number;
  h: number;
};

type FilterPreset = {
  id: string;
  label: string;
};

type BaseLayer = {
  id: string;
  x: number;
  y: number;
  zIndex: number;
};

type TextLayer = BaseLayer & {
  kind: "text";
  text: string;
  fontSize: number;
  color: string;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  align: "left" | "center" | "right";
  bg: string;
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
  w: number;
  h: number;
};

type Layer = TextLayer | StickerLayer | ShapeLayer;

type ActiveTab = "bg" | "filters" | "text" | "stickers" | "shapes" | "adjust";

interface Props {
  onBack: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const FORMATS: Format[] = [
  {
    id: "square",
    label: "Carré (1:1)",
    w: 400,
    h: 400,
  },
  {
    id: "story",
    label: "Story (9:16)",
    w: 300,
    h: 533,
  },
  {
    id: "banner",
    label: "Bannière (3:1)",
    w: 600,
    h: 200,
  },
  {
    id: "portrait",
    label: "Portrait (4:5)",
    w: 320,
    h: 400,
  },
];

const BG_COLORS = [
  "#111827",
  "#1e3a5f",
  "#1a1a2e",
  "#0f2027",
  "#4c1d95",
  "#1e1b4b",
  "#064e3b",
  "#7f1d1d",
  "#ffffff",
  "#f3f4f6",
  "#fef3c7",
  "#fce7f3",
  "#667eea",
  "#f5576c",
  "#00b4d8",
  "#38b000",
  "#f59e0b",
  "#a855f7",
];

const FILTER_PRESETS: FilterPreset[] = [
  { id: "none", label: "Original" },
  { id: "vivid", label: "Vivid" },
  { id: "cool", label: "Cool" },
  { id: "warm", label: "Warm" },
  { id: "bw", label: "N&B" },
  { id: "fade", label: "Fade" },
  { id: "dramatic", label: "Drama" },
  { id: "retro", label: "Rétro" },
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
    label: "Objets",
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
      "🌍",
    ],
  },
  {
    label: "Nature",
    emojis: [
      "🌸",
      "🌴",
      "🌊",
      "⛅",
      "🌙",
      "🌺",
      "🦋",
      "🐬",
      "🌵",
      "🍀",
      "❄️",
      "🌈",
    ],
  },
  {
    label: "Texte",
    emojis: [
      "💬",
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
    ],
  },
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
  "#84cc16",
];

const CANVAS_MAX_WIDTH = 340;

function uid(): string {
  return `layer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function StudioPhotoPage({ onBack }: Props) {
  const [format, setFormat] = useState<Format>(FORMATS[0]);

  const [backgroundColor, setBackgroundColor] = useState(BG_COLORS[0]);

  const [filter, setFilter] = useState<FilterPreset>(FILTER_PRESETS[0]);

  const [brightness, setBrightness] = useState(100);

  const [contrast, setContrast] = useState(100);

  const [saturation, setSaturation] = useState(100);

  const [layers, setLayers] = useState<Layer[]>([]);

  const [selected, setSelected] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>("bg");

  const [stickerGroup, setStickerGroup] = useState(0);

  const [canvasWidth, setCanvasWidth] = useState(CANVAS_MAX_WIDTH);

  // Text editing state

  const [editText, setEditText] = useState("");

  const [editColor, setEditColor] = useState("#ffffff");

  const [editFontSize, setEditFontSize] = useState(24);

  const [editBold, setEditBold] = useState(false);

  const [editItalic, setEditItalic] = useState(false);

  const [editAlign, setEditAlign] = useState<"left" | "center" | "right">(
    "center",
  );

  const [editBg, setEditBg] = useState("transparent");

  const selectedLayer = useMemo(
    () => layers.find((layer) => layer.id === selected) ?? null,
    [layers, selected],
  );

  const canvasHeight = useMemo(() => {
    return Math.min(format.h, canvasWidth * (format.h / format.w));
  }, [canvasWidth, format]);

  // ───────────────────────────────────────────────────────────────────────────
  // Synchronize selected text layer
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (selectedLayer?.kind !== "text") {
      return;
    }

    setEditText(selectedLayer.text);
    setEditColor(selectedLayer.color);
    setEditFontSize(selectedLayer.fontSize);
    setEditBold(selectedLayer.fontWeight === "bold");
    setEditItalic(selectedLayer.fontStyle === "italic");
    setEditAlign(selectedLayer.align);
    setEditBg(selectedLayer.bg);
  }, [selectedLayer?.id]);

  const updateTextLayer = useCallback(() => {
    if (!selected) {
      return;
    }

    setLayers((previous) =>
      previous.map((layer) => {
        if (layer.id !== selected || layer.kind !== "text") {
          return layer;
        }

        return {
          ...layer,
          text: editText,
          color: editColor,
          fontSize: editFontSize,
          fontWeight: editBold ? "bold" : "normal",
          fontStyle: editItalic ? "italic" : "normal",
          align: editAlign,
          bg: editBg,
        };
      }),
    );
  }, [
    selected,
    editText,
    editColor,
    editFontSize,
    editBold,
    editItalic,
    editAlign,
    editBg,
  ]);

  useEffect(() => {
    updateTextLayer();
  }, [updateTextLayer]);

  // ───────────────────────────────────────────────────────────────────────────
  // Layers
  // ───────────────────────────────────────────────────────────────────────────

  const addText = () => {
    const layer: TextLayer = {
      id: uid(),
      kind: "text",
      x: 50,
      y: 50,
      zIndex: layers.length + 1,
      text: "Votre texte ici",
      fontSize: 24,
      color: "#ffffff",
      fontWeight: "bold",
      fontStyle: "normal",
      align: "center",
      bg: "transparent",
    };

    setLayers((previous) => [...previous, layer]);
    setSelected(layer.id);
    setActiveTab("text");
  };

  const addSticker = (emoji: string) => {
    const layer: StickerLayer = {
      id: uid(),
      kind: "sticker",
      x: 50,
      y: 50,
      zIndex: layers.length + 1,
      emoji,
      size: 48,
    };

    setLayers((previous) => [...previous, layer]);
    setSelected(layer.id);
  };

  const addShape = (shape: ShapeLayer["shape"]) => {
    const layer: ShapeLayer = {
      id: uid(),
      kind: "shape",
      x: 50,
      y: 50,
      zIndex: layers.length + 1,
      shape,
      color: "#8b5cf6",
      w: 80,
      h: shape === "line" ? 4 : 80,
    };

    setLayers((previous) => [...previous, layer]);
    setSelected(layer.id);
  };

  const deleteLayer = (id: string) => {
    setLayers((previous) => previous.filter((layer) => layer.id !== id));

    setSelected(null);
  };

  const duplicateLayer = (id: string) => {
    const original = layers.find((layer) => layer.id === id);

    if (!original) {
      return;
    }

    const clone: Layer = {
      ...original,
      id: uid(),
      x: Math.min(95, original.x + 5),
      y: Math.min(95, original.y + 5),
      zIndex: original.zIndex + 1,
    };

    setLayers((previous) => [...previous, clone]);

    setSelected(clone.id);
  };

  const bringUp = (id: string) => {
    setLayers((previous) => {
      const max = Math.max(0, ...previous.map((layer) => layer.zIndex));

      return previous.map((layer) =>
        layer.id === id
          ? {
              ...layer,
              zIndex: max + 1,
            }
          : layer,
      );
    });
  };

  const sendDown = (id: string) => {
    setLayers((previous) => {
      const min = Math.min(0, ...previous.map((layer) => layer.zIndex));

      return previous.map((layer) =>
        layer.id === id
          ? {
              ...layer,
              zIndex: Math.max(0, min - 1),
            }
          : layer,
      );
    });
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Reset / Export
  // ───────────────────────────────────────────────────────────────────────────

  const reset = () => {
    setLayers([]);
    setSelected(null);
    setBackgroundColor(BG_COLORS[0]);
    setFilter(FILTER_PRESETS[0]);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
  };

  const exportCanvas = () => {
    Alert.alert(
      "Export",
      "L'export de l'image sera connecté au système de génération et de sauvegarde de votre application.",
    );
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Dragging
  // ───────────────────────────────────────────────────────────────────────────

  const createPanResponder = (layer: Layer) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,

      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        setSelected(layer.id);
      },

      onPanResponderMove: (_event, gestureState) => {
        if (canvasWidth <= 0 || canvasHeight <= 0) {
          return;
        }

        setLayers((previous) =>
          previous.map((item) => {
            if (item.id !== layer.id) {
              return item;
            }

            const x = layer.x + (gestureState.dx / canvasWidth) * 100;

            const y = layer.y + (gestureState.dy / canvasHeight) * 100;

            return {
              ...item,
              x: Math.max(0, Math.min(100, x)),
              y: Math.max(0, Math.min(100, y)),
            };
          }),
        );
      },
    });

  // ───────────────────────────────────────────────────────────────────────────
  // Filter approximation
  // ───────────────────────────────────────────────────────────────────────────

  const filterOverlayColor = useMemo(() => {
    switch (filter.id) {
      case "warm":
        return "rgba(245, 158, 11, 0.12)";

      case "cool":
        return "rgba(59, 130, 246, 0.12)";

      case "retro":
        return "rgba(120, 53, 15, 0.16)";

      case "dramatic":
        return "rgba(0, 0, 0, 0.16)";

      case "fade":
        return "rgba(255, 255, 255, 0.08)";

      default:
        return "transparent";
    }
  }, [filter.id]);

  // ───────────────────────────────────────────────────────────────────────────
  // Render layer
  // ───────────────────────────────────────────────────────────────────────────

  const renderLayer = (layer: Layer) => {
    const isSelected = selected === layer.id;

    const panResponder = createPanResponder(layer);

    return (
      <View
        key={layer.id}
        {...panResponder.panHandlers}
        style={[
          styles.layer,
          {
            left: `${layer.x}%`,
            top: `${layer.y}%`,
            zIndex: layer.zIndex + 10,
          },
          isSelected && styles.selectedLayer,
        ]}
      >
        {layer.kind === "text" && (
          <Text
            style={{
              color: layer.color,
              fontSize: layer.fontSize,
              fontWeight: layer.fontWeight,
              fontStyle: layer.fontStyle,
              textAlign: layer.align,
              backgroundColor:
                layer.bg === "transparent" ? "transparent" : layer.bg,
              paddingHorizontal: layer.bg === "transparent" ? 0 : 8,
              paddingVertical: layer.bg === "transparent" ? 0 : 4,
              borderRadius: 6,
              maxWidth: 220,
              lineHeight: layer.fontSize * 1.2,
              textShadowColor: "rgba(0,0,0,0.6)",
              textShadowOffset: {
                width: 0,
                height: 1,
              },
              textShadowRadius: 4,
            }}
          >
            {layer.text}
          </Text>
        )}

        {layer.kind === "sticker" && (
          <Text
            style={{
              fontSize: layer.size,
              lineHeight: layer.size,
            }}
          >
            {layer.emoji}
          </Text>
        )}

        {layer.kind === "shape" && (
          <View
            style={{
              width: layer.w,
              height: layer.h,
              backgroundColor: layer.color,
              borderRadius:
                layer.shape === "circle"
                  ? layer.w / 2
                  : layer.shape === "line"
                    ? 2
                    : 8,
              opacity: 0.85,
            }}
          />
        )}
      </View>
    );
  };

  const tabs: Array<{
    id: ActiveTab;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      id: "bg",
      label: "Fond",
      icon: <Palette size={15} />,
    },
    {
      id: "filters",
      label: "Filtres",
      icon: <Sliders size={15} />,
    },
    {
      id: "text",
      label: "Texte",
      icon: <Type size={15} />,
    },
    {
      id: "stickers",
      label: "Stickers",
      icon: <Smile size={15} />,
    },
    {
      id: "shapes",
      label: "Formes",
      icon: <Square size={15} />,
    },
    {
      id: "adjust",
      label: "Réglages",
      icon: <ZoomIn size={15} />,
    },
  ];

  // ───────────────────────────────────────────────────────────────────────────
  // UI
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.screen}>
      {/* Header */}

      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.iconButton}>
          <ArrowLeft size={19} color="#ffffff" />
        </Pressable>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Studio Photo & Image</Text>

          <Text style={styles.headerSubtitle}>
            {format.label} · {layers.length} calque
            {layers.length !== 1 ? "s" : ""}
          </Text>
        </View>

        <Pressable onPress={reset} style={styles.iconButton}>
          <RotateCcw size={17} color="#ffffff" />
        </Pressable>

        <Pressable onPress={exportCanvas} style={styles.exportButton}>
          <Download size={15} color="#ffffff" />

          <Text style={styles.exportText}>Exporter</Text>
        </Pressable>
      </View>

      {/* Formats */}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.formatList}
      >
        {FORMATS.map((item) => {
          const active = item.id === format.id;

          return (
            <Pressable
              key={item.id}
              onPress={() => setFormat(item)}
              style={[styles.formatButton, active && styles.formatButtonActive]}
            >
              <Text
                style={[styles.formatText, active && styles.formatTextActive]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Canvas */}

      <View style={styles.canvasArea}>
        <Pressable
          onPress={() => setSelected(null)}
          style={[
            styles.canvas,
            {
              width: canvasWidth,
              height: canvasHeight,
              backgroundColor,
            },
          ]}
          onLayout={(event) => {
            const width = event.nativeEvent.layout.width;

            if (width > 0 && width !== canvasWidth) {
              setCanvasWidth(width);
            }
          }}
        >
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: filterOverlayColor,
                opacity: brightness / 100,
              },
            ]}
          />

          {[...layers].sort((a, b) => a.zIndex - b.zIndex).map(renderLayer)}
        </Pressable>
      </View>

      {/* Selected layer toolbar */}

      {selected && selectedLayer && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.layerToolbar}
        >
          <Text style={styles.toolbarLabel}>Calque :</Text>

          <Pressable
            onPress={() => bringUp(selected)}
            style={styles.toolbarButton}
          >
            <ChevronUp size={13} />
            <Text style={styles.toolbarButtonText}>Haut</Text>
          </Pressable>

          <Pressable
            onPress={() => sendDown(selected)}
            style={styles.toolbarButton}
          >
            <ChevronDown size={13} />
            <Text style={styles.toolbarButtonText}>Bas</Text>
          </Pressable>

          <Pressable
            onPress={() => duplicateLayer(selected)}
            style={styles.toolbarButton}
          >
            <Copy size={13} />

            <Text style={styles.toolbarButtonText}>Dupliquer</Text>
          </Pressable>

          <Pressable
            onPress={() => deleteLayer(selected)}
            style={styles.deleteToolbarButton}
          >
            <Trash2 size={13} color="#f87171" />

            <Text style={styles.deleteToolbarText}>Supprimer</Text>
          </Pressable>
        </ScrollView>
      )}

      {/* Tabs */}

      <View style={styles.panel}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabList}
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.id;

            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[styles.tabButton, active && styles.tabButtonActive]}
              >
                {tab.icon}

                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView
          style={styles.panelContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Background */}

          {activeTab === "bg" && (
            <View style={styles.colorGrid}>
              {BG_COLORS.map((color) => (
                <Pressable
                  key={color}
                  onPress={() => setBackgroundColor(color)}
                  style={[
                    styles.colorButton,
                    {
                      backgroundColor: color,
                    },
                    backgroundColor === color && styles.colorButtonSelected,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Filters */}

          {activeTab === "filters" && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterList}
            >
              {FILTER_PRESETS.map((preset) => {
                const active = filter.id === preset.id;

                return (
                  <Pressable
                    key={preset.id}
                    onPress={() => setFilter(preset)}
                    style={styles.filterItem}
                  >
                    <View
                      style={[
                        styles.filterPreview,
                        active && styles.filterPreviewActive,
                      ]}
                    />

                    <Text style={styles.filterLabel}>{preset.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {/* Text */}

          {activeTab === "text" && (
            <View>
              <Pressable onPress={addText} style={styles.addTextButton}>
                <Plus size={15} color="#d8b4fe" />

                <Text style={styles.addTextButtonText}>Ajouter texte</Text>
              </Pressable>

              {selectedLayer?.kind === "text" && (
                <View style={styles.textEditor}>
                  <TextInput
                    value={editText}
                    onChangeText={setEditText}
                    multiline
                    placeholder="Votre texte…"
                    placeholderTextColor="#6b7280"
                    style={styles.textInput}
                  />

                  <View style={styles.editorRow}>
                    <Pressable
                      onPress={() => setEditBold((value) => !value)}
                      style={[
                        styles.smallButton,
                        editBold && styles.smallButtonActive,
                      ]}
                    >
                      <Bold size={16} />
                    </Pressable>

                    <Pressable
                      onPress={() => setEditItalic((value) => !value)}
                      style={[
                        styles.smallButton,
                        editItalic && styles.smallButtonActive,
                      ]}
                    >
                      <Italic size={16} />
                    </Pressable>

                    <Pressable
                      onPress={() => setEditAlign("left")}
                      style={[
                        styles.smallButton,
                        editAlign === "left" && styles.smallButtonActive,
                      ]}
                    >
                      <AlignLeft size={16} />
                    </Pressable>

                    <Pressable
                      onPress={() => setEditAlign("center")}
                      style={[
                        styles.smallButton,
                        editAlign === "center" && styles.smallButtonActive,
                      ]}
                    >
                      <AlignCenter size={16} />
                    </Pressable>

                    <Pressable
                      onPress={() => setEditAlign("right")}
                      style={[
                        styles.smallButton,
                        editAlign === "right" && styles.smallButtonActive,
                      ]}
                    >
                      <AlignRight size={16} />
                    </Pressable>
                  </View>

                  <Text style={styles.sectionLabel}>
                    Taille : {editFontSize}px
                  </Text>

                  <View style={styles.editorRow}>
                    <Pressable
                      onPress={() =>
                        setEditFontSize((value) => Math.max(12, value - 2))
                      }
                      style={styles.smallButton}
                    >
                      <Text>-</Text>
                    </Pressable>

                    <Pressable
                      onPress={() =>
                        setEditFontSize((value) => Math.min(72, value + 2))
                      }
                      style={styles.smallButton}
                    >
                      <Text>+</Text>
                    </Pressable>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.colorList}
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
                          editColor === color && styles.textColorSelected,
                        ]}
                      >
                        {editColor === color && (
                          <Check
                            size={13}
                            color={color === "#ffffff" ? "#000000" : "#ffffff"}
                          />
                        )}
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          {/* Stickers */}

          {activeTab === "stickers" && (
            <View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.groupList}
              >
                {STICKER_GROUPS.map((group, index) => (
                  <Pressable
                    key={group.label}
                    onPress={() => setStickerGroup(index)}
                    style={[
                      styles.groupButton,
                      stickerGroup === index && styles.groupButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.groupButtonText,
                        stickerGroup === index && styles.groupButtonTextActive,
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
                    <Text style={styles.stickerText}>{emoji}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Shapes */}

          {activeTab === "shapes" && (
            <View style={styles.shapeList}>
              {(["rect", "circle", "line"] as const).map((shape) => (
                <Pressable
                  key={shape}
                  onPress={() => addShape(shape)}
                  style={styles.shapeButton}
                >
                  <View
                    style={{
                      width: shape === "line" ? 48 : 32,
                      height: shape === "line" ? 4 : 32,
                      backgroundColor: "#8b5cf6",
                      borderRadius:
                        shape === "circle" ? 20 : shape === "line" ? 2 : 6,
                    }}
                  />

                  <Text style={styles.shapeText}>
                    {shape === "rect"
                      ? "Rectangle"
                      : shape === "circle"
                        ? "Cercle"
                        : "Ligne"}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Adjustments */}

          {activeTab === "adjust" && (
            <View style={styles.adjustPanel}>
              <AdjustmentControl
                label="Luminosité"
                value={brightness}
                min={50}
                max={150}
                onChange={setBrightness}
              />

              <AdjustmentControl
                label="Contraste"
                value={contrast}
                min={50}
                max={200}
                onChange={setContrast}
              />

              <AdjustmentControl
                label="Saturation"
                value={saturation}
                min={0}
                max={200}
                onChange={setSaturation}
              />

              <Pressable
                onPress={() => {
                  setBrightness(100);
                  setContrast(100);
                  setSaturation(100);
                }}
                style={styles.resetAdjustButton}
              >
                <RotateCcw size={14} color="#9ca3af" />

                <Text style={styles.resetAdjustText}>
                  Réinitialiser les réglages
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Adjustment control
// ─────────────────────────────────────────────────────────────────────────────

interface AdjustmentControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

function AdjustmentControl({
  label,
  value,
  min,
  max,
  onChange,
}: AdjustmentControlProps) {
  return (
    <View style={styles.adjustmentControl}>
      <View style={styles.adjustmentHeader}>
        <Text style={styles.adjustmentLabel}>{label}</Text>

        <Text style={styles.adjustmentValue}>{value}</Text>
      </View>

      <View style={styles.adjustmentButtons}>
        <Pressable
          onPress={() => onChange(Math.max(min, value - 5))}
          style={styles.adjustButton}
        >
          <Text style={styles.adjustButtonText}>−</Text>
        </Pressable>

        <View style={styles.adjustValueBox}>
          <Text style={styles.adjustValueText}>{value}</Text>
        </View>

        <Pressable
          onPress={() => onChange(Math.min(max, value + 5))}
          style={styles.adjustButton}
        >
          <Text style={styles.adjustButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#030712",
  },

  header: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#030712",
  },

  headerContent: {
    flex: 1,
    minWidth: 0,
  },

  headerTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },

  headerSubtitle: {
    marginTop: 2,
    color: "#9ca3af",
    fontSize: 11,
  },

  iconButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#7c3aed",
  },

  exportText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },

  formatList: {
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  formatButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  formatButtonActive: {
    backgroundColor: "#ffffff",
    borderColor: "#ffffff",
  },

  formatText: {
    color: "#9ca3af",
    fontSize: 11,
  },

  formatTextActive: {
    color: "#111827",
    fontWeight: "700",
  },

  canvasArea: {
    flex: 1,
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#000000",
  },

  canvas: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 18,
    elevation: 12,
  },

  layer: {
    position: "absolute",
    transform: [
      {
        translateX: "-50%" as never,
      },
      {
        translateY: "-50%" as never,
      },
    ],
  },

  selectedLayer: {
    borderWidth: 2,
    borderColor: "#c084fc",
    borderRadius: 6,
  },

  layerToolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#111827",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },

  toolbarLabel: {
    color: "#9ca3af",
    fontSize: 11,
  },

  toolbarButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  toolbarButtonText: {
    color: "#ffffff",
    fontSize: 10,
  },

  deleteToolbarButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: "rgba(239,68,68,0.12)",
  },

  deleteToolbarText: {
    color: "#f87171",
    fontSize: 10,
  },

  panel: {
    maxHeight: 300,
    backgroundColor: "#111827",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },

  tabList: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },

  tabButtonActive: {
    borderBottomColor: "#8b5cf6",
  },

  tabText: {
    color: "#6b7280",
    fontSize: 11,
  },

  tabTextActive: {
    color: "#d8b4fe",
    fontWeight: "700",
  },

  panelContent: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  colorButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },

  colorButtonSelected: {
    borderColor: "#c084fc",
  },

  filterList: {
    gap: 14,
  },

  filterItem: {
    alignItems: "center",
    gap: 6,
  },

  filterPreview: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: "#667eea",
    borderWidth: 2,
    borderColor: "transparent",
  },

  filterPreviewActive: {
    borderColor: "#c084fc",
  },

  filterLabel: {
    color: "#9ca3af",
    fontSize: 10,
  },

  addTextButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "rgba(124,58,237,0.25)",
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.45)",
  },

  addTextButtonText: {
    color: "#d8b4fe",
    fontSize: 11,
    fontWeight: "600",
  },

  textEditor: {
    marginTop: 12,
    gap: 10,
  },

  textInput: {
    minHeight: 70,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#ffffff",
    fontSize: 14,
    textAlignVertical: "top",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  editorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  smallButton: {
    width: 36,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  smallButtonActive: {
    backgroundColor: "#ffffff",
  },

  sectionLabel: {
    color: "#9ca3af",
    fontSize: 11,
  },

  colorList: {
    gap: 9,
  },

  textColor: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "transparent",
  },

  textColorSelected: {
    borderColor: "#c084fc",
  },

  groupList: {
    gap: 8,
    marginBottom: 12,
  },

  groupButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  groupButtonActive: {
    backgroundColor: "rgba(124,58,237,0.35)",
  },

  groupButtonText: {
    color: "#9ca3af",
    fontSize: 10,
  },

  groupButtonTextActive: {
    color: "#d8b4fe",
    fontWeight: "700",
  },

  stickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  stickerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  stickerText: {
    fontSize: 24,
  },

  shapeList: {
    flexDirection: "row",
    gap: 12,
  },

  shapeButton: {
    minWidth: 92,
    minHeight: 88,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  shapeText: {
    color: "#9ca3af",
    fontSize: 10,
  },

  adjustPanel: {
    gap: 14,
  },

  adjustmentControl: {
    gap: 8,
  },

  adjustmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  adjustmentLabel: {
    color: "#d1d5db",
    fontSize: 12,
  },

  adjustmentValue: {
    color: "#9ca3af",
    fontSize: 12,
  },

  adjustmentButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  adjustButton: {
    width: 38,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  adjustButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },

  adjustValueBox: {
    minWidth: 64,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  adjustValueText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },

  resetAdjustButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 8,
  },

  resetAdjustText: {
    color: "#9ca3af",
    fontSize: 11,
  },
});
