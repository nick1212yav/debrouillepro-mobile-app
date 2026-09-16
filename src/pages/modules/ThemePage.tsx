import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Accessibility,
  ArrowLeft,
  Check,
  ChevronDown,
  Contrast,
  Eye,
  LayoutGrid,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Save,
  Smartphone,
  Sparkles,
  Sun,
  Type,
  WandSparkles,
} from "lucide-react-native";

import { ACCENT_PALETTES, useAppearance } from "@/hooks/use-appearance.ts";

import type {
  AccentColor,
  ColorBlindMode,
  ColorMode,
  Density,
  TextSize,
} from "@/hooks/use-appearance.ts";

interface ThemePageProps {
  onBack: () => void;
}

type IconComponent = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

const COLORS = {
  background: "#020412",
  backgroundSecondary: "#070A17",
  surface: "rgba(255,255,255,0.045)",
  surfaceStrong: "rgba(255,255,255,0.075)",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.14)",
  white: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.56)",
  textMuted: "rgba(255,255,255,0.32)",
  textFaint: "rgba(255,255,255,0.20)",
};

const PREVIEW_ITEMS = [
  {
    emoji: "🏠",
    title: "Appartement F3 Gombe",
    subtitle: "1 500 $/mois · Kinshasa",
    tag: "Immo",
  },
  {
    emoji: "💼",
    title: "Développeur React Native",
    subtitle: "2 200 $/mois · Télétravail",
    tag: "Emploi",
  },
  {
    emoji: "🎟️",
    title: "Festival de la ville",
    subtitle: "Samedi · 18:00",
    tag: "Événement",
  },
] as const;

const TEXT_OPTIONS: ReadonlyArray<{
  key: TextSize;
  label: string;
  description: string;
  sampleSize: number;
}> = [
  {
    key: "petit",
    label: "Petit",
    description: "14 px",
    sampleSize: 14,
  },
  {
    key: "normal",
    label: "Normal",
    description: "16 px",
    sampleSize: 17,
  },
  {
    key: "grand",
    label: "Grand",
    description: "18 px",
    sampleSize: 20,
  },
];

const DENSITY_OPTIONS: ReadonlyArray<{
  key: Density;
  label: string;
  description: string;
  rows: number;
  rowHeight: number;
  Icon: IconComponent;
}> = [
  {
    key: "compact",
    label: "Compact",
    description: "Plus de contenu visible",
    rows: 5,
    rowHeight: 5,
    Icon: LayoutGrid,
  },
  {
    key: "confortable",
    label: "Confortable",
    description: "Espaces généreux",
    rows: 3,
    rowHeight: 9,
    Icon: Smartphone,
  },
];

const COLOR_BLIND_OPTIONS: ReadonlyArray<{
  key: ColorBlindMode;
  label: string;
  description: string;
}> = [
  {
    key: "none",
    label: "Normal",
    description: "Aucun filtre",
  },
  {
    key: "deuteranopia",
    label: "Deutéranopie",
    description: "Daltonisme rouge-vert",
  },
  {
    key: "protanopia",
    label: "Protanopie",
    description: "Insensibilité au rouge",
  },
  {
    key: "tritanopia",
    label: "Tritanopie",
    description: "Daltonisme bleu-jaune",
  },
  {
    key: "achromatopsia",
    label: "Achromatopsie",
    description: "Absence de perception des couleurs",
  },
];

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");

  if (normalized.length !== 6) {
    return `rgba(255,255,255,${alpha})`;
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red},${green},${blue},${alpha})`;
}

function SectionLabel({
  label,
  description,
  accent,
}: {
  label: string;
  description?: string;
  accent: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <View style={[styles.sectionIndicator, { backgroundColor: accent }]} />

        <Text style={styles.sectionLabel}>{label}</Text>
      </View>

      {description ? (
        <Text style={styles.sectionDescription}>{description}</Text>
      ) : null}
    </View>
  );
}

function AnimatedPressable({
  children,
  onPress,
  style,
  accessibilityLabel,
  accessibilityRole = "button",
  disabled = false,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: object;
  accessibilityLabel?: string;
  accessibilityRole?: "button" | "radio";
  disabled?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.975,
      useNativeDriver: true,
      speed: 30,
      bounciness: 5,
    }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 24,
      bounciness: 7,
    }).start();
  }, [scale]);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ scale }],
          opacity: disabled ? 0.45 : 1,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole}
        disabled={disabled}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

function SelectionBadge({
  accent,
  visible,
}: {
  accent: string;
  visible: boolean;
}) {
  if (!visible) {
    return null;
  }

  return (
    <View
      style={[
        styles.selectionBadge,
        {
          backgroundColor: accent,
          shadowColor: accent,
        },
      ]}
    >
      <Check size={12} color="#FFFFFF" strokeWidth={3} />
    </View>
  );
}

function LivePreview({
  accent,
  colorMode,
  textSize,
  density,
}: {
  accent: AccentColor;
  colorMode: ColorMode;
  textSize: TextSize;
  density: Density;
}) {
  const palette = ACCENT_PALETTES[accent];

  const isLight = colorMode === "clair";
  const isCompact = density === "compact";

  const backgroundColor = isLight ? "#EEF0F7" : "#080B19";
  const cardColor = isLight ? "#FFFFFF" : "#121627";
  const primaryText = isLight ? "#161827" : "#FFFFFF";
  const secondaryText = isLight ? "#65697B" : "rgba(255,255,255,0.46)";

  const titleSize = textSize === "petit" ? 11 : textSize === "grand" ? 14 : 12;

  const subtitleSize = Math.max(titleSize - 2, 9);

  return (
    <View
      style={[
        styles.preview,
        {
          backgroundColor,
          borderColor: hexToRgba(palette.hex, 0.22),
          shadowColor: palette.hex,
        },
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.previewGlow,
          {
            backgroundColor: hexToRgba(palette.hex, 0.14),
          },
        ]}
      />

      <View
        style={[
          styles.previewHeader,
          {
            backgroundColor: hexToRgba(palette.hex, 0.1),
            borderBottomColor: hexToRgba(palette.hex, 0.14),
          },
        ]}
      >
        <View
          style={[
            styles.previewLogo,
            {
              backgroundColor: palette.hex,
              shadowColor: palette.hex,
            },
          ]}
        >
          <Sparkles size={13} color="#FFFFFF" strokeWidth={2.4} />
        </View>

        <Text
          numberOfLines={1}
          style={[
            styles.previewBrand,
            {
              color: primaryText,
              fontSize: titleSize + 1,
            },
          ]}
        >
          Débrouille Pro
        </Text>

        <View style={styles.previewPalette}>
          <View
            style={[styles.previewDot, { backgroundColor: palette.gradFrom }]}
          />
          <View
            style={[styles.previewDot, { backgroundColor: palette.gradTo }]}
          />
          <View
            style={[
              styles.previewDot,
              { backgroundColor: hexToRgba(palette.hex, 0.48) },
            ]}
          />
        </View>
      </View>

      {PREVIEW_ITEMS.map((item, index) => (
        <View
          key={item.title}
          style={[
            styles.previewItem,
            {
              paddingVertical: isCompact ? 9 : 13,
              backgroundColor:
                index % 2 === 0
                  ? cardColor
                  : isLight
                    ? "#F8F9FC"
                    : "rgba(18,22,39,0.78)",
              borderBottomColor: hexToRgba(palette.hex, 0.08),
            },
          ]}
        >
          <View
            style={[
              styles.previewEmoji,
              {
                backgroundColor: hexToRgba(palette.hex, 0.11),
              },
            ]}
          >
            <Text style={styles.previewEmojiText}>{item.emoji}</Text>
          </View>

          <View style={styles.previewItemContent}>
            <Text
              numberOfLines={1}
              style={[
                styles.previewItemTitle,
                {
                  color: primaryText,
                  fontSize: titleSize,
                },
              ]}
            >
              {item.title}
            </Text>

            <Text
              numberOfLines={1}
              style={[
                styles.previewItemSubtitle,
                {
                  color: secondaryText,
                  fontSize: subtitleSize,
                },
              ]}
            >
              {item.subtitle}
            </Text>
          </View>

          <View
            style={[
              styles.previewTag,
              {
                backgroundColor: hexToRgba(palette.hex, 0.12),
              },
            ]}
          >
            <Text
              style={[
                styles.previewTagText,
                {
                  color: palette.hex,
                  fontSize: Math.max(subtitleSize - 1, 8),
                },
              ]}
            >
              {item.tag}
            </Text>
          </View>
        </View>
      ))}

      <View style={[styles.previewBottomBar, { backgroundColor: cardColor }]}>
        {["⌂", "⌕", "+", "◌", "◉"].map((icon, index) => (
          <View
            key={`${icon}-${index}`}
            style={[
              styles.previewNavItem,
              index === 0 && {
                backgroundColor: hexToRgba(palette.hex, 0.14),
              },
            ]}
          >
            <Text
              style={[
                styles.previewNavIcon,
                {
                  color:
                    index === 0
                      ? palette.hex
                      : isLight
                        ? "#7B7E8F"
                        : "rgba(255,255,255,0.40)",
                },
              ]}
            >
              {icon}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function AccentCard({
  palette,
  active,
  onPress,
}: {
  palette: (typeof ACCENT_PALETTES)[AccentColor];
  active: boolean;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={`Couleur ${palette.label}`}
      style={[
        styles.accentCard,
        active && {
          backgroundColor: hexToRgba(palette.hex, 0.1),
          borderColor: hexToRgba(palette.hex, 0.42),
          shadowColor: palette.hex,
          shadowOpacity: 0.22,
          shadowRadius: 18,
          elevation: 5,
        },
      ]}
    >
      <View
        style={[
          styles.accentPreview,
          {
            backgroundColor: palette.hex,
            shadowColor: palette.hex,
          },
        ]}
      >
        <View
          style={[
            styles.accentPreviewHighlight,
            {
              backgroundColor: "rgba(255,255,255,0.20)",
            },
          ]}
        />

        <View
          style={[
            styles.accentGradientPoint,
            {
              backgroundColor: palette.gradTo,
            },
          ]}
        />
      </View>

      <Text
        numberOfLines={1}
        style={[
          styles.accentLabel,
          {
            color: active ? palette.hex : COLORS.textSecondary,
          },
        ]}
      >
        {palette.label}
      </Text>

      <SelectionBadge accent={palette.hex} visible={active} />
    </AnimatedPressable>
  );
}

function ColorModeCard({
  active,
  accent,
  Icon,
  label,
  description,
  onPress,
}: {
  active: boolean;
  accent: string;
  Icon: IconComponent;
  label: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={`${label}: ${description}`}
      style={[
        styles.choiceCard,
        active && {
          backgroundColor: hexToRgba(accent, 0.11),
          borderColor: hexToRgba(accent, 0.35),
          shadowColor: accent,
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 4,
        },
      ]}
    >
      <View
        style={[
          styles.choiceIcon,
          {
            backgroundColor: active
              ? hexToRgba(accent, 0.17)
              : "rgba(255,255,255,0.055)",
          },
        ]}
      >
        <Icon
          size={21}
          color={active ? accent : COLORS.textSecondary}
          strokeWidth={2}
        />
      </View>

      <View style={styles.choiceContent}>
        <Text
          style={[
            styles.choiceLabel,
            {
              color: active ? COLORS.white : COLORS.textSecondary,
            },
          ]}
        >
          {label}
        </Text>

        <Text style={styles.choiceDescription}>{description}</Text>
      </View>

      <SelectionBadge accent={accent} visible={active} />
    </AnimatedPressable>
  );
}

function TextSizeCard({
  active,
  accent,
  label,
  description,
  sampleSize,
  onPress,
}: {
  active: boolean;
  accent: string;
  label: string;
  description: string;
  sampleSize: number;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={`Taille du texte ${label}`}
      style={[
        styles.textSizeCard,
        active && {
          backgroundColor: hexToRgba(accent, 0.09),
        },
      ]}
    >
      <View
        style={[
          styles.textIconBox,
          {
            backgroundColor: active
              ? hexToRgba(accent, 0.16)
              : "rgba(255,255,255,0.055)",
          },
        ]}
      >
        <Type
          size={17}
          color={active ? accent : COLORS.textSecondary}
          strokeWidth={2.2}
        />
      </View>

      <View style={styles.textSizeContent}>
        <Text
          style={[
            styles.textSizeLabel,
            {
              color: active ? COLORS.white : COLORS.textSecondary,
            },
          ]}
        >
          {label}
        </Text>

        <Text style={styles.textSizeDescription}>{description}</Text>
      </View>

      <Text
        style={[
          styles.textSample,
          {
            color: active ? accent : COLORS.textFaint,
            fontSize: sampleSize,
          },
        ]}
      >
        Aa
      </Text>

      <SelectionBadge accent={accent} visible={active} />
    </AnimatedPressable>
  );
}

function DensityCard({
  active,
  accent,
  label,
  description,
  rows,
  rowHeight,
  Icon,
  onPress,
}: {
  active: boolean;
  accent: string;
  label: string;
  description: string;
  rows: number;
  rowHeight: number;
  Icon: IconComponent;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={`${label}: ${description}`}
      style={[
        styles.densityCard,
        active && {
          backgroundColor: hexToRgba(accent, 0.09),
          borderColor: hexToRgba(accent, 0.32),
        },
      ]}
    >
      <View style={styles.densityPreview}>
        {Array.from({ length: rows }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.densityLine,
              {
                height: rowHeight,
                backgroundColor: active
                  ? index === 0
                    ? hexToRgba(accent, 0.72)
                    : hexToRgba(accent, 0.25)
                  : "rgba(255,255,255,0.10)",
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.densityFooter}>
        <View style={styles.densityLabelRow}>
          <Icon
            size={15}
            color={active ? accent : COLORS.textSecondary}
            strokeWidth={2.2}
          />

          <Text
            style={[
              styles.densityLabel,
              {
                color: active ? COLORS.white : COLORS.textSecondary,
              },
            ]}
          >
            {label}
          </Text>
        </View>

        <Text style={styles.densityDescription}>{description}</Text>
      </View>

      <SelectionBadge accent={accent} visible={active} />
    </AnimatedPressable>
  );
}

function AccessibilityToggle({
  enabled,
  accent,
  onPress,
}: {
  enabled: boolean;
  accent: string;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel="Contraste élevé"
      style={[
        styles.accessibilityToggle,
        enabled && {
          backgroundColor: hexToRgba(accent, 0.1),
          borderColor: hexToRgba(accent, 0.32),
        },
      ]}
    >
      <View
        style={[
          styles.accessibilityIcon,
          {
            backgroundColor: enabled
              ? hexToRgba(accent, 0.17)
              : "rgba(255,255,255,0.055)",
          },
        ]}
      >
        <Contrast
          size={18}
          color={enabled ? accent : COLORS.textSecondary}
          strokeWidth={2.1}
        />
      </View>

      <View style={styles.accessibilityContent}>
        <Text style={styles.accessibilityTitle}>Contraste élevé</Text>

        <Text style={styles.accessibilityDescription}>
          Améliore la lisibilité de l'interface
        </Text>
      </View>

      <View
        style={[
          styles.switchTrack,
          {
            backgroundColor: enabled ? accent : "rgba(255,255,255,0.12)",
          },
        ]}
      >
        <Animated.View
          style={[
            styles.switchThumb,
            {
              transform: [
                {
                  translateX: enabled ? 18 : 2,
                },
              ],
            },
          ]}
        />
      </View>
    </AnimatedPressable>
  );
}

function ColorBlindOption({
  active,
  accent,
  label,
  description,
  onPress,
}: {
  active: boolean;
  accent: string;
  label: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={`${label}: ${description}`}
      style={[
        styles.colorBlindOption,
        active && {
          backgroundColor: hexToRgba(accent, 0.07),
        },
      ]}
    >
      <View
        style={[
          styles.colorBlindIcon,
          {
            backgroundColor: active
              ? hexToRgba(accent, 0.15)
              : "rgba(255,255,255,0.05)",
          },
        ]}
      >
        <Eye
          size={15}
          color={active ? accent : COLORS.textSecondary}
          strokeWidth={2}
        />
      </View>

      <View style={styles.colorBlindContent}>
        <Text
          style={[
            styles.colorBlindLabel,
            {
              color: active ? COLORS.white : COLORS.textSecondary,
            },
          ]}
        >
          {label}
        </Text>

        <Text style={styles.colorBlindDescription}>{description}</Text>
      </View>

      {active ? <Check size={15} color={accent} strokeWidth={3} /> : null}
    </AnimatedPressable>
  );
}

export default function ThemePage({ onBack }: ThemePageProps) {
  const { prefs, update, reset } = useAppearance();

  const [showAdvanced, setShowAdvanced] = useState(false);

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslate = useRef(new Animated.Value(-12)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(16)).current;
  const advancedAnimation = useRef(new Animated.Value(0)).current;

  const palette = ACCENT_PALETTES[prefs.accent];
  const accentHex = palette.hex;

  const colorModes = useMemo(
    () =>
      [
        {
          key: "sombre" as ColorMode,
          label: "Sombre",
          description: "Ambiance nuit",
          Icon: Moon,
        },
        {
          key: "clair" as ColorMode,
          label: "Clair",
          description: "Ambiance jour",
          Icon: Sun,
        },
        {
          key: "systeme" as ColorMode,
          label: "Système",
          description: "Suit ton appareil",
          Icon: Monitor,
        },
      ] as const,
    [],
  );

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(headerTranslate, {
        toValue: 0,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 520,
        delay: 80,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslate, {
        toValue: 0,
        duration: 620,
        delay: 80,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [contentOpacity, contentTranslate, headerOpacity, headerTranslate]);

  const toggleAdvanced = useCallback(() => {
    const nextValue = !showAdvanced;

    setShowAdvanced(nextValue);

    Animated.timing(advancedAnimation, {
      toValue: nextValue ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [advancedAnimation, showAdvanced]);

  const handleReset = useCallback(() => {
    Alert.alert(
      "Réinitialiser l'apparence",
      "Toutes tes préférences visuelles seront restaurées à leurs valeurs par défaut.",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Réinitialiser",
          style: "destructive",
          onPress: () => {
            reset();
          },
        },
      ],
    );
  }, [reset]);

  const advancedHeight = advancedAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 390],
  });

  const advancedOpacity = advancedAnimation.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 0.7, 1],
  });

  return (
    <View style={styles.screen}>
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerOpacity,
            transform: [
              {
                translateY: headerTranslate,
              },
            ],
          },
        ]}
      >
        <AnimatedPressable
          onPress={onBack}
          accessibilityLabel="Retour"
          style={styles.headerButton}
        >
          <ArrowLeft
            size={20}
            color="rgba(255,255,255,0.82)"
            strokeWidth={2.2}
          />
        </AnimatedPressable>

        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <View
              style={[
                styles.headerIcon,
                {
                  backgroundColor: hexToRgba(accentHex, 0.14),
                },
              ]}
            >
              <Palette size={15} color={accentHex} strokeWidth={2.2} />
            </View>

            <Text numberOfLines={1} style={styles.headerTitle}>
              Thème & Personnalisation
            </Text>
          </View>

          <Text numberOfLines={1} style={styles.headerSubtitle}>
            Ton interface. Ton confort. Ton expérience.
          </Text>
        </View>

        <AnimatedPressable
          onPress={handleReset}
          accessibilityLabel="Réinitialiser les préférences d'apparence"
          style={styles.headerButton}
        >
          <RotateCcw size={17} color="rgba(255,255,255,0.42)" strokeWidth={2} />
        </AnimatedPressable>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        style={{
          opacity: contentOpacity,
          transform: [
            {
              translateY: contentTranslate,
            },
          ],
        }}
      >
        <View
          style={[
            styles.hero,
            {
              borderColor: hexToRgba(accentHex, 0.2),
            },
          ]}
        >
          <View
            pointerEvents="none"
            style={[
              styles.heroGlow,
              {
                backgroundColor: hexToRgba(accentHex, 0.14),
              },
            ]}
          />

          <View style={styles.heroContent}>
            <View
              style={[
                styles.heroIcon,
                {
                  backgroundColor: accentHex,
                  shadowColor: accentHex,
                },
              ]}
            >
              <WandSparkles size={25} color="#FFFFFF" strokeWidth={2} />
            </View>

            <View style={styles.heroText}>
              <Text style={[styles.heroEyebrow, { color: accentHex }]}>
                PERSONNALISATION
              </Text>

              <Text style={styles.heroTitle}>
                Fais de Débrouille Pro{" "}
                <Text style={{ color: accentHex }}>ton espace.</Text>
              </Text>

              <Text style={styles.heroDescription}>
                Ajuste les couleurs, la lisibilité, l'ambiance et la densité.
                Chaque choix est appliqué immédiatement.
              </Text>
            </View>
          </View>

          <View style={styles.heroFooter}>
            <View
              style={[
                styles.heroStatusDot,
                {
                  backgroundColor: accentHex,
                },
              ]}
            />

            <Text style={styles.heroStatusText}>
              Personnalisation en temps réel
            </Text>

            <Sparkles size={14} color={accentHex} strokeWidth={2} />
          </View>
        </View>

        <View>
          <SectionLabel
            label="Aperçu en temps réel"
            description="Découvre instantanément l'effet de tes choix."
            accent={accentHex}
          />

          <LivePreview
            accent={prefs.accent}
            colorMode={prefs.colorMode}
            textSize={prefs.textSize}
            density={prefs.density}
          />
        </View>

        <View>
          <SectionLabel
            label="Couleur d'accent"
            description="Actions, boutons, badges et éléments mis en avant."
            accent={accentHex}
          />

          <View style={styles.accentGrid}>
            {(
              Object.entries(ACCENT_PALETTES) as Array<
                [AccentColor, (typeof ACCENT_PALETTES)[AccentColor]]
              >
            ).map(([key, item]) => (
              <AccentCard
                key={key}
                palette={item}
                active={prefs.accent === key}
                onPress={() => update("accent", key)}
              />
            ))}
          </View>
        </View>

        <View>
          <SectionLabel
            label="Mode couleur"
            description="Choisis l'ambiance qui te convient."
            accent={accentHex}
          />

          <View style={styles.verticalGap}>
            {colorModes.map(({ key, label, description, Icon }) => (
              <ColorModeCard
                key={key}
                active={prefs.colorMode === key}
                accent={accentHex}
                Icon={Icon}
                label={label}
                description={description}
                onPress={() => update("colorMode", key)}
              />
            ))}
          </View>
        </View>

        <View>
          <SectionLabel
            label="Taille du texte"
            description="Une interface plus petite ou plus confortable."
            accent={accentHex}
          />

          <View style={styles.optionGroup}>
            {TEXT_OPTIONS.map((option, index) => (
              <TextSizeCard
                key={option.key}
                active={prefs.textSize === option.key}
                accent={accentHex}
                label={option.label}
                description={option.description}
                sampleSize={option.sampleSize}
                onPress={() => update("textSize", option.key)}
              />
            ))}
          </View>
        </View>

        <View>
          <SectionLabel
            label="Densité d'affichage"
            description="Plus de contenu ou plus d'espace entre les éléments."
            accent={accentHex}
          />

          <View style={styles.densityGrid}>
            {DENSITY_OPTIONS.map((option) => (
              <DensityCard
                key={option.key}
                active={prefs.density === option.key}
                accent={accentHex}
                label={option.label}
                description={option.description}
                rows={option.rows}
                rowHeight={option.rowHeight}
                Icon={option.Icon}
                onPress={() => update("density", option.key)}
              />
            ))}
          </View>
        </View>

        <View>
          <AnimatedPressable
            onPress={toggleAdvanced}
            accessibilityLabel="Ouvrir les options d'accessibilité"
            style={styles.accessibilityHeader}
          >
            <View
              style={[
                styles.accessibilityHeaderIcon,
                {
                  backgroundColor: hexToRgba(accentHex, 0.12),
                },
              ]}
            >
              <Accessibility size={18} color={accentHex} strokeWidth={2} />
            </View>

            <View style={styles.accessibilityHeaderText}>
              <Text style={styles.accessibilityHeaderTitle}>Accessibilité</Text>

              <Text style={styles.accessibilityHeaderDescription}>
                Contraste élevé et modes daltonisme
              </Text>
            </View>

            <Animated.View
              style={{
                transform: [
                  {
                    rotate: advancedAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0deg", "180deg"],
                    }),
                  },
                ],
              }}
            >
              <ChevronDown
                size={19}
                color={showAdvanced ? accentHex : COLORS.textMuted}
                strokeWidth={2}
              />
            </Animated.View>
          </AnimatedPressable>

          <Animated.View
            style={[
              styles.advancedContainer,
              {
                height: advancedHeight,
                opacity: advancedOpacity,
              },
            ]}
          >
            <View style={styles.advancedInner}>
              <AccessibilityToggle
                enabled={prefs.highContrast}
                accent={accentHex}
                onPress={() => update("highContrast", !prefs.highContrast)}
              />

              <View style={styles.colorBlindGroup}>
                {COLOR_BLIND_OPTIONS.map((option) => (
                  <ColorBlindOption
                    key={option.key}
                    active={prefs.colorBlindMode === option.key}
                    accent={accentHex}
                    label={option.label}
                    description={option.description}
                    onPress={() => update("colorBlindMode", option.key)}
                  />
                ))}
              </View>
            </View>
          </Animated.View>
        </View>

        <View
          style={[
            styles.syncCard,
            {
              backgroundColor: hexToRgba(accentHex, 0.065),
              borderColor: hexToRgba(accentHex, 0.16),
            },
          ]}
        >
          <View
            style={[
              styles.syncIcon,
              {
                backgroundColor: hexToRgba(accentHex, 0.13),
              },
            ]}
          >
            <Save size={16} color={accentHex} strokeWidth={2} />
          </View>

          <View style={styles.syncContent}>
            <Text style={styles.syncTitle}>Préférences synchronisées</Text>

            <Text style={styles.syncDescription}>
              Tes choix sont sauvegardés automatiquement par ton système de
              préférences.
            </Text>
          </View>

          <View
            style={[
              styles.syncPulse,
              {
                backgroundColor: accentHex,
              },
            ]}
          >
            <Check size={11} color="#FFFFFF" strokeWidth={3} />
          </View>
        </View>

        <View style={styles.bottomBrand}>
          <Sparkles size={13} color={COLORS.textFaint} strokeWidth={1.8} />

          <Text style={styles.bottomBrandText}>
            Personnalise ton expérience à tout moment.
          </Text>

          <Sparkles size={13} color={COLORS.textFaint} strokeWidth={1.8} />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    minHeight: 76,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 8 : 10,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.065)",
    backgroundColor: "rgba(3,7,20,0.96)",
  },

  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.052)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  headerCenter: {
    flex: 1,
    minWidth: 0,
  },

  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    flex: 1,
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  headerSubtitle: {
    marginTop: 3,
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "500",
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 42,
    gap: 30,
  },

  hero: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 30,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.035)",
    padding: 20,
  },

  heroGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    right: -105,
    top: -115,
  },

  heroContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 15,
  },

  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 8,
  },

  heroText: {
    flex: 1,
    minWidth: 0,
  },

  heroEyebrow: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2.2,
    marginBottom: 5,
  },

  heroTitle: {
    color: COLORS.white,
    fontSize: 24,
    lineHeight: 29,
    fontWeight: "900",
    letterSpacing: -0.7,
  },

  heroDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 9,
    maxWidth: 560,
  },

  heroFooter: {
    marginTop: 19,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  heroStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  heroStatusText: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "700",
  },

  sectionHeader: {
    marginBottom: 12,
    paddingHorizontal: 2,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  sectionIndicator: {
    width: 4,
    height: 16,
    borderRadius: 2,
  },

  sectionLabel: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },

  sectionDescription: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 5,
    marginLeft: 12,
  },

  preview: {
    overflow: "hidden",
    borderRadius: 26,
    borderWidth: 1,
    shadowOpacity: 0.16,
    shadowRadius: 30,
    shadowOffset: {
      width: 0,
      height: 14,
    },
    elevation: 5,
  },

  previewGlow: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    right: -85,
    top: -95,
  },

  previewHeader: {
    minHeight: 58,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderBottomWidth: 1,
  },

  previewLogo: {
    width: 31,
    height: 31,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 4,
  },

  previewBrand: {
    flex: 1,
    fontWeight: "900",
    letterSpacing: -0.2,
  },

  previewPalette: {
    flexDirection: "row",
    gap: 5,
  },

  previewDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },

  previewItem: {
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderBottomWidth: 1,
  },

  previewEmoji: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  previewEmojiText: {
    fontSize: 16,
  },

  previewItemContent: {
    flex: 1,
    minWidth: 0,
  },

  previewItemTitle: {
    fontWeight: "800",
  },

  previewItemSubtitle: {
    marginTop: 2,
  },

  previewTag: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 99,
  },

  previewTagText: {
    fontWeight: "800",
  },

  previewBottomBar: {
    height: 54,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },

  previewNavItem: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  previewNavIcon: {
    fontSize: 19,
    fontWeight: "700",
  },

  accentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },

  accentCard: {
    width: "31.8%",
    minWidth: 96,
    flexGrow: 1,
    position: "relative",
    padding: 9,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.065)",
  },

  accentPreview: {
    height: 44,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 3,
  },

  accentPreviewHighlight: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 15,
  },

  accentGradientPoint: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
    right: -15,
    bottom: -24,
    opacity: 0.8,
  },

  accentLabel: {
    marginTop: 8,
    marginHorizontal: 2,
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },

  selectionBadge: {
    position: "absolute",
    right: 7,
    top: 7,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.28,
    shadowRadius: 9,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 4,
  },

  verticalGap: {
    gap: 9,
  },

  choiceCard: {
    minHeight: 70,
    padding: 10,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.065)",
  },

  choiceIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  choiceContent: {
    flex: 1,
    minWidth: 0,
  },

  choiceLabel: {
    fontSize: 13,
    fontWeight: "850",
  },

  choiceDescription: {
    marginTop: 3,
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "600",
  },

  optionGroup: {
    overflow: "hidden",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.065)",
    backgroundColor: "rgba(255,255,255,0.025)",
  },

  textSizeCard: {
    minHeight: 64,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.045)",
  },

  textIconBox: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  textSizeContent: {
    flex: 1,
  },

  textSizeLabel: {
    fontSize: 13,
    fontWeight: "800",
  },

  textSizeDescription: {
    marginTop: 2,
    color: COLORS.textMuted,
    fontSize: 10,
  },

  textSample: {
    fontWeight: "900",
    marginRight: 8,
  },

  densityGrid: {
    flexDirection: "row",
    gap: 10,
  },

  densityCard: {
    flex: 1,
    minHeight: 150,
    padding: 13,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.065)",
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  densityPreview: {
    padding: 10,
    minHeight: 72,
    justifyContent: "space-between",
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  densityLine: {
    width: "100%",
    borderRadius: 99,
  },

  densityFooter: {
    marginTop: 12,
  },

  densityLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  densityLabel: {
    fontSize: 12,
    fontWeight: "900",
  },

  densityDescription: {
    color: COLORS.textMuted,
    fontSize: 9,
    lineHeight: 13,
    marginTop: 4,
  },

  accessibilityHeader: {
    minHeight: 64,
    paddingHorizontal: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  accessibilityHeaderIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  accessibilityHeaderText: {
    flex: 1,
  },

  accessibilityHeaderTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "900",
  },

  accessibilityHeaderDescription: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 3,
  },

  advancedContainer: {
    overflow: "hidden",
  },

  advancedInner: {
    paddingTop: 4,
    gap: 11,
  },

  accessibilityToggle: {
    minHeight: 72,
    padding: 10,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.065)",
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  accessibilityIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  accessibilityContent: {
    flex: 1,
  },

  accessibilityTitle: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },

  accessibilityDescription: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 3,
  },

  switchTrack: {
    width: 42,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
  },

  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 3,
  },

  colorBlindGroup: {
    overflow: "hidden",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.065)",
    backgroundColor: "rgba(255,255,255,0.025)",
  },

  colorBlindOption: {
    minHeight: 58,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.045)",
  },

  colorBlindIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  colorBlindContent: {
    flex: 1,
  },

  colorBlindLabel: {
    fontSize: 12,
    fontWeight: "800",
  },

  colorBlindDescription: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 2,
  },

  syncCard: {
    minHeight: 66,
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  syncIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  syncContent: {
    flex: 1,
  },

  syncTitle: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 11,
    fontWeight: "850",
  },

  syncDescription: {
    color: COLORS.textMuted,
    fontSize: 9,
    lineHeight: 13,
    marginTop: 3,
  },

  syncPulse: {
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  bottomBrand: {
    paddingTop: 2,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
  },

  bottomBrandText: {
    color: COLORS.textFaint,
    fontSize: 9,
    fontWeight: "600",
    textAlign: "center",
  },
});
