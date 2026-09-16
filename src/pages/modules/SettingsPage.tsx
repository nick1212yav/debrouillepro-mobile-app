import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  Globe,
  HelpCircle,
  LayoutGrid,
  LogIn,
  Monitor,
  Moon,
  Palette,
  Shield,
  Smartphone,
  Star,
  Sun,
  Type,
  WifiOff,
} from "lucide-react-native";

import { useMutation, useQuery } from "convex/react";

import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
} from "@/lib/convex-auth-compat";

import { api } from "@/convex/_generated/api.js";

import { ACCENT_PALETTES, useAppearance } from "@/hooks/use-appearance.ts";

import type {
  AccentColor,
  ColorMode,
  Density,
  TextSize,
} from "@/hooks/use-appearance.ts";

import { SignInButton } from "@/components/ui/signin.tsx";

type ToggleKey =
  | "notifications"
  | "offlineMode"
  | "biometrics"
  | "jobAlerts"
  | "immoAlerts"
  | "paymentAlerts";

type SettingsSection = "general" | "apparence";

interface SettingsPageProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

const DEFAULT_TOGGLES: Record<ToggleKey, boolean> = {
  notifications: true,
  offlineMode: false,
  biometrics: false,
  jobAlerts: true,
  immoAlerts: false,
  paymentAlerts: true,
};

const LANGUAGES = [
  "Français",
  "English",
  "Swahili",
  "Lingala",
  "Kikongo",
] as const;

const TOGGLE_ITEMS: Array<{
  key: ToggleKey;
  label: string;
  description?: string;
  icon: typeof Bell;
  color: string;
}> = [
  {
    key: "notifications",
    label: "Toutes les notifications",
    icon: Bell,
    color: "#6366F1",
  },
  {
    key: "jobAlerts",
    label: "Alertes Emplois",
    icon: Bell,
    color: "#6366F1",
  },
  {
    key: "immoAlerts",
    label: "Alertes Immobilier",
    icon: Bell,
    color: "#F97316",
  },
  {
    key: "paymentAlerts",
    label: "Alertes Paiements",
    icon: Bell,
    color: "#10B981",
  },
];

const APP_TOGGLE_ITEMS: Array<{
  key: ToggleKey;
  icon: typeof WifiOff;
  label: string;
  color: string;
  description: string;
}> = [
  {
    key: "offlineMode",
    icon: WifiOff,
    label: "Mode hors-ligne",
    color: "#06B6D4",
    description: "Permet d'utiliser les données disponibles hors connexion.",
  },
  {
    key: "biometrics",
    icon: Smartphone,
    label: "Authentification biométrique",
    color: "#10B981",
    description:
      "Empreinte digitale / Face ID selon les capacités de l'appareil.",
  },
];

const NAVIGATION_ITEMS: Array<{
  icon: typeof Shield;
  label: string;
  color: string;
  page: string;
}> = [
  {
    icon: Shield,
    label: "Confidentialité & sécurité",
    color: "#3B82F6",
    page: "privacy",
  },
  {
    icon: HelpCircle,
    label: "Aide & Support",
    color: "#9CA3AF",
    page: "help",
  },
  {
    icon: Star,
    label: "À propos de l'application",
    color: "#F59E0B",
    page: "about",
  },
  {
    icon: FileText,
    label: "CGU & Mentions légales",
    color: "#6B7280",
    page: "terms",
  },
];

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label.toUpperCase()}</Text>;
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function RowDivider() {
  return <View style={styles.rowDivider} />;
}

function ToggleSwitch({
  value,
  onToggle,
  color,
  disabled = false,
}: {
  value: boolean;
  onToggle: () => void;
  color: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{
        checked: value,
        disabled,
      }}
      disabled={disabled}
      onPress={onToggle}
      style={({ pressed }) => [
        styles.toggle,
        {
          backgroundColor: value ? color : "rgba(255,255,255,0.10)",
        },
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.toggleThumb,
          {
            left: value ? 22 : 3,
          },
        ]}
      />
    </Pressable>
  );
}

function LoadingSettings() {
  return (
    <View style={styles.loadingContainer}>
      {[1, 2, 3].map((item) => (
        <View key={item} style={styles.loadingCard}>
          <View style={styles.loadingIcon} />

          <View style={styles.loadingLines}>
            <View style={styles.loadingLineLarge} />
            <View style={styles.loadingLineSmall} />
          </View>

          <View style={styles.loadingControl} />
        </View>
      ))}
    </View>
  );
}

function AuthOverlay() {
  return (
    <View style={styles.authCard}>
      <View style={styles.authIcon}>
        <LogIn size={21} color="#818CF8" />
      </View>

      <Text style={styles.authTitle}>Connexion requise</Text>

      <Text style={styles.authDescription}>
        Connectez-vous pour synchroniser vos préférences et les retrouver sur
        vos appareils.
      </Text>

      <SignInButton />
    </View>
  );
}

function AppearancePreview({
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

  const modeLabel =
    colorMode === "sombre"
      ? "Sombre"
      : colorMode === "clair"
        ? "Clair"
        : "Système";

  const textLabel =
    textSize === "petit" ? "Petit" : textSize === "grand" ? "Grand" : "Normal";

  const densityLabel = density === "compact" ? "Compact" : "Confortable";

  return (
    <View
      style={[
        styles.preview,
        {
          borderColor: `${palette.hex}35`,
        },
      ]}
    >
      <View
        style={[
          styles.previewGlow,
          {
            backgroundColor: `${palette.hex}18`,
          },
        ]}
      />

      <View style={styles.previewHeader}>
        <View
          style={[
            styles.previewIcon,
            {
              backgroundColor: `${palette.hex}20`,
            },
          ]}
        >
          <Palette size={19} color={palette.hex} />
        </View>

        <View style={styles.previewText}>
          <Text style={styles.previewTitle}>Apparence active</Text>

          <Text style={styles.previewSubtitle}>
            Prévisualisation en temps réel
          </Text>
        </View>

        <View
          style={[
            styles.previewAccent,
            {
              backgroundColor: palette.hex,
            },
          ]}
        />
      </View>

      <View style={styles.previewParameters}>
        <PreviewParameter label="Accent" value={palette.label} />

        <PreviewParameter label="Mode" value={modeLabel} />

        <PreviewParameter label="Texte" value={textLabel} />

        <PreviewParameter label="Densité" value={densityLabel} />
      </View>
    </View>
  );
}

function PreviewParameter({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.previewParameter}>
      <Text style={styles.previewParameterLabel}>{label}</Text>

      <Text numberOfLines={1} style={styles.previewParameterValue}>
        {value}
      </Text>
    </View>
  );
}

function GeneralTabAuth({
  accentHex,
  onNavigate,
}: {
  accentHex: string;
  onNavigate?: (page: string) => void;
}) {
  const settings = useQuery(api.settings.getMySettings);

  const upsert = useMutation(api.settings.upsertSettings);

  const [showLanguage, setShowLanguage] = useState(false);

  const [savingKey, setSavingKey] = useState<string | null>(null);

  const toggleValue = useCallback(
    (key: ToggleKey): boolean => {
      if (settings && key in settings) {
        const value = (settings as Record<string, unknown>)[key];

        if (typeof value === "boolean") {
          return value;
        }
      }

      return DEFAULT_TOGGLES[key];
    },
    [settings],
  );

  const currentLanguage = settings?.language ?? "Français";

  const saveToggle = useCallback(
    async (key: ToggleKey) => {
      if (savingKey !== null) {
        return;
      }

      const nextValue = !toggleValue(key);

      setSavingKey(key);

      try {
        await upsert({
          [key]: nextValue,
        });
      } finally {
        setSavingKey(null);
      }
    },
    [savingKey, toggleValue, upsert],
  );

  const saveLanguage = useCallback(
    async (language: string) => {
      if (savingKey !== null) {
        return;
      }

      setShowLanguage(false);
      setSavingKey("language");

      try {
        await upsert({
          language,
        });
      } finally {
        setSavingKey(null);
      }
    },
    [savingKey, upsert],
  );

  if (settings === undefined) {
    return <LoadingSettings />;
  }

  return (
    <View style={styles.tabContent}>
      {/* LANGUAGE */}

      <View>
        <SectionLabel label="Langue & Région" />

        <SettingsCard>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Choisir la langue de l'interface"
            accessibilityState={{
              expanded: showLanguage,
            }}
            onPress={() => setShowLanguage((value) => !value)}
            style={({ pressed }) => [
              styles.settingRow,
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.rowIcon,
                {
                  backgroundColor: "rgba(99,102,241,0.18)",
                },
              ]}
            >
              <Globe size={17} color="#818CF8" />
            </View>

            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Langue de l'interface</Text>

              <Text style={styles.rowDescription}>{currentLanguage}</Text>
            </View>

            <ChevronDown
              size={17}
              color="rgba(255,255,255,0.35)"
              style={{
                transform: [
                  {
                    rotate: showLanguage ? "180deg" : "0deg",
                  },
                ],
              }}
            />
          </Pressable>

          {showLanguage && (
            <View style={styles.languageContainer}>
              <RowDivider />

              {LANGUAGES.map((language) => {
                const active = currentLanguage === language;

                return (
                  <Pressable
                    key={language}
                    accessibilityRole="radio"
                    accessibilityState={{
                      checked: active,
                    }}
                    disabled={savingKey !== null}
                    onPress={() => void saveLanguage(language)}
                    style={({ pressed }) => [
                      styles.languageRow,
                      active && {
                        backgroundColor: `${accentHex}12`,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.languageText,
                        active && {
                          color: accentHex,
                          fontWeight: "800",
                        },
                      ]}
                    >
                      {language}
                    </Text>

                    {active ? <Check size={16} color={accentHex} /> : null}
                  </Pressable>
                );
              })}
            </View>
          )}
        </SettingsCard>
      </View>

      {/* NOTIFICATIONS */}

      <View>
        <SectionLabel label="Notifications" />

        <SettingsCard>
          {TOGGLE_ITEMS.map((item, index) => {
            const Icon = item.icon;
            const active = toggleValue(item.key);

            return (
              <React.Fragment key={item.key}>
                {index > 0 && <RowDivider />}

                <View style={styles.settingRow}>
                  <View
                    style={[
                      styles.rowIcon,
                      {
                        backgroundColor: `${item.color}18`,
                      },
                    ]}
                  >
                    <Icon size={16} color={item.color} />
                  </View>

                  <Text style={styles.rowTitleFlex}>{item.label}</Text>

                  {savingKey === item.key ? (
                    <ActivityIndicator size="small" color={item.color} />
                  ) : (
                    <ToggleSwitch
                      value={active}
                      onToggle={() => void saveToggle(item.key)}
                      color={item.color}
                    />
                  )}
                </View>
              </React.Fragment>
            );
          })}
        </SettingsCard>
      </View>

      {/* APPLICATION */}

      <View>
        <SectionLabel label="Application" />

        <SettingsCard>
          {APP_TOGGLE_ITEMS.map((item, index) => {
            const Icon = item.icon;
            const active = toggleValue(item.key);

            return (
              <React.Fragment key={item.key}>
                {index > 0 && <RowDivider />}

                <View style={styles.settingRow}>
                  <View
                    style={[
                      styles.rowIcon,
                      {
                        backgroundColor: `${item.color}18`,
                      },
                    ]}
                  >
                    <Icon size={16} color={item.color} />
                  </View>

                  <View style={styles.rowContent}>
                    <Text style={styles.rowTitle}>{item.label}</Text>

                    <Text style={styles.rowDescription}>
                      {item.description}
                    </Text>
                  </View>

                  {savingKey === item.key ? (
                    <ActivityIndicator size="small" color={item.color} />
                  ) : (
                    <ToggleSwitch
                      value={active}
                      onToggle={() => void saveToggle(item.key)}
                      color={item.color}
                    />
                  )}
                </View>
              </React.Fragment>
            );
          })}
        </SettingsCard>
      </View>

      {/* ABOUT */}

      <View>
        <SectionLabel label="À propos" />

        <SettingsCard>
          {NAVIGATION_ITEMS.map((item, index) => {
            const Icon = item.icon;

            return (
              <React.Fragment key={item.page}>
                {index > 0 && <RowDivider />}

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  disabled={!onNavigate}
                  onPress={() => onNavigate?.(item.page)}
                  style={({ pressed }) => [
                    styles.settingRow,
                    pressed && styles.pressed,
                    !onNavigate && styles.disabled,
                  ]}
                >
                  <View
                    style={[
                      styles.rowIcon,
                      {
                        backgroundColor: `${item.color}18`,
                      },
                    ]}
                  >
                    <Icon size={16} color={item.color} />
                  </View>

                  <Text style={styles.rowTitleFlex}>{item.label}</Text>

                  <ChevronRight size={16} color="rgba(255,255,255,0.24)" />
                </Pressable>
              </React.Fragment>
            );
          })}
        </SettingsCard>

        <Text style={styles.version}>DébrouillePro · v2.8.0</Text>

        <Text style={styles.location}>
          Kolwezi · République Démocratique du Congo 🇨🇩
        </Text>
      </View>
    </View>
  );
}

function AppearanceTab({
  prefs,
  accentHex,
  update,
  reset,
  onNavigate,
}: {
  prefs: {
    accent: AccentColor;
    colorMode: ColorMode;
    textSize: TextSize;
    density: Density;
  };
  accentHex: string;
  update: <K extends keyof typeof prefs>(
    key: K,
    value: (typeof prefs)[K],
  ) => void;
  reset: () => void;
  onNavigate?: (page: string) => void;
}) {
  const accentEntries = useMemo(
    () =>
      Object.entries(ACCENT_PALETTES) as [
        AccentColor,
        (typeof ACCENT_PALETTES)[AccentColor],
      ][],
    [],
  );

  return (
    <View style={styles.tabContent}>
      {/* FULL THEME */}

      {onNavigate && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ouvrir la personnalisation complète du thème"
          onPress={() => onNavigate("theme")}
          style={({ pressed }) => [
            styles.themeLink,
            {
              borderColor: `${accentHex}30`,
              backgroundColor: `${accentHex}12`,
            },
            pressed && styles.pressed,
          ]}
        >
          <View
            style={[
              styles.rowIcon,
              {
                backgroundColor: `${accentHex}22`,
              },
            ]}
          >
            <Palette size={18} color={accentHex} />
          </View>

          <View style={styles.rowContent}>
            <Text style={styles.rowTitle}>Thème & Personnalisation</Text>

            <Text style={styles.rowDescription}>
              Aperçu live · Accent · Texte · Densité
            </Text>
          </View>

          <ChevronRight size={17} color="rgba(255,255,255,0.30)" />
        </Pressable>
      )}

      {/* LIVE PREVIEW */}

      <AppearancePreview
        accent={prefs.accent}
        colorMode={prefs.colorMode}
        textSize={prefs.textSize}
        density={prefs.density}
      />

      {/* ACCENT */}

      <View>
        <SectionLabel label="Couleur d'accent" />

        <View style={styles.optionGrid}>
          {accentEntries.map(([key, palette]) => {
            const active = prefs.accent === key;

            return (
              <Pressable
                key={key}
                accessibilityRole="radio"
                accessibilityState={{
                  selected: active,
                }}
                accessibilityLabel={`Accent ${palette.label}`}
                onPress={() => update("accent", key)}
                style={({ pressed }) => [
                  styles.accentOption,
                  active && {
                    borderColor: `${palette.hex}65`,
                    backgroundColor: `${palette.hex}15`,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.accentColor,
                    {
                      backgroundColor: palette.hex,
                    },
                  ]}
                />

                <Text
                  style={[
                    styles.accentLabel,
                    active && {
                      color: palette.hex,
                    },
                  ]}
                >
                  {palette.label}
                </Text>

                {active && (
                  <View
                    style={[
                      styles.checkBadge,
                      {
                        backgroundColor: palette.hex,
                      },
                    ]}
                  >
                    <Check size={11} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* COLOR MODE */}

      <View>
        <SectionLabel label="Mode couleur" />

        <View style={styles.modeGrid}>
          {[
            {
              key: "sombre" as ColorMode,
              label: "Sombre",
              icon: Moon,
              description: "Toujours nuit",
            },
            {
              key: "clair" as ColorMode,
              label: "Clair",
              icon: Sun,
              description: "Toujours jour",
            },
            {
              key: "systeme" as ColorMode,
              label: "Système",
              icon: Monitor,
              description: "Selon l'appareil",
            },
          ].map((item) => {
            const Icon = item.icon;
            const active = prefs.colorMode === item.key;

            return (
              <Pressable
                key={item.key}
                accessibilityRole="radio"
                accessibilityState={{
                  selected: active,
                }}
                accessibilityLabel={`Mode ${item.label}`}
                onPress={() => update("colorMode", item.key)}
                style={({ pressed }) => [
                  styles.modeOption,
                  active && {
                    borderColor: `${accentHex}55`,
                    backgroundColor: `${accentHex}15`,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Icon
                  size={21}
                  color={active ? accentHex : "rgba(255,255,255,0.50)"}
                />

                <Text
                  style={[
                    styles.modeTitle,
                    active && {
                      color: "#FFFFFF",
                    },
                  ]}
                >
                  {item.label}
                </Text>

                <Text style={styles.modeDescription}>{item.description}</Text>

                {active && (
                  <Check
                    size={14}
                    color={accentHex}
                    style={styles.optionCheck}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* TEXT SIZE */}

      <View>
        <SectionLabel label="Taille du texte" />

        <SettingsCard>
          {[
            {
              key: "petit" as TextSize,
              label: "Petit",
              sample: "Aa",
              size: 14,
            },
            {
              key: "normal" as TextSize,
              label: "Normal",
              sample: "Aa",
              size: 18,
            },
            {
              key: "grand" as TextSize,
              label: "Grand",
              sample: "Aa",
              size: 23,
            },
          ].map((item, index) => {
            const active = prefs.textSize === item.key;

            return (
              <React.Fragment key={item.key}>
                {index > 0 && <RowDivider />}

                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{
                    selected: active,
                  }}
                  accessibilityLabel={`Taille du texte ${item.label}`}
                  onPress={() => update("textSize", item.key)}
                  style={({ pressed }) => [
                    styles.settingRow,
                    active && {
                      backgroundColor: `${accentHex}10`,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <View
                    style={[
                      styles.rowIcon,
                      {
                        backgroundColor: active
                          ? `${accentHex}20`
                          : "rgba(255,255,255,0.06)",
                      },
                    ]}
                  >
                    <Type
                      size={16}
                      color={active ? accentHex : "rgba(255,255,255,0.45)"}
                    />
                  </View>

                  <Text
                    style={[
                      styles.rowTitleFlex,
                      active && {
                        color: "#FFFFFF",
                      },
                    ]}
                  >
                    {item.label}
                  </Text>

                  <Text
                    style={[
                      styles.sampleText,
                      {
                        fontSize: item.size,
                        color: active ? accentHex : "rgba(255,255,255,0.28)",
                      },
                    ]}
                  >
                    {item.sample}
                  </Text>

                  {active && <Check size={15} color={accentHex} />}
                </Pressable>
              </React.Fragment>
            );
          })}
        </SettingsCard>
      </View>

      {/* DENSITY */}

      <View>
        <SectionLabel label="Densité d'affichage" />

        <View style={styles.densityGrid}>
          {[
            {
              key: "compact" as Density,
              label: "Compact",
              description: "Plus d'informations visibles",
            },
            {
              key: "confortable" as Density,
              label: "Confortable",
              description: "Espaces généreux",
            },
          ].map((item) => {
            const active = prefs.density === item.key;

            return (
              <Pressable
                key={item.key}
                accessibilityRole="radio"
                accessibilityState={{
                  selected: active,
                }}
                accessibilityLabel={`Densité ${item.label}`}
                onPress={() => update("density", item.key)}
                style={({ pressed }) => [
                  styles.densityOption,
                  active && {
                    borderColor: `${accentHex}55`,
                    backgroundColor: `${accentHex}15`,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <LayoutGrid
                  size={23}
                  color={active ? accentHex : "rgba(255,255,255,0.48)"}
                />

                <Text style={styles.densityTitle}>{item.label}</Text>

                <Text style={styles.densityDescription}>
                  {item.description}
                </Text>

                {active && (
                  <Check
                    size={14}
                    color={accentHex}
                    style={styles.optionCheck}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* RESET */}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Réinitialiser l'apparence"
        onPress={reset}
        style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
      >
        <Text style={styles.resetButtonText}>Réinitialiser l'apparence</Text>
      </Pressable>
    </View>
  );
}

export default function SettingsPage({
  onBack,
  onNavigate,
}: SettingsPageProps) {
  const { prefs, update, reset } = useAppearance();

  const [activeSection, setActiveSection] =
    useState<SettingsSection>("general");

  const accentHex = ACCENT_PALETTES[prefs.accent].hex;

  return (
    <View style={styles.screen}>
      {/* HEADER */}

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            onPress={onBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <ArrowLeft size={19} color="#FFFFFF" />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Paramètres ⚙️</Text>

            <Text style={styles.headerSubtitle}>
              Compte, apparence & préférences
            </Text>
          </View>
        </View>

        {/* TABS */}

        <View style={styles.tabs}>
          {[
            ["general" as const, "⚙️ Général"],
            ["apparence" as const, "🎨 Apparence"],
          ].map(([section, label]) => {
            const active = activeSection === section;

            return (
              <Pressable
                key={section}
                accessibilityRole="tab"
                accessibilityState={{
                  selected: active,
                }}
                onPress={() => setActiveSection(section)}
                style={({ pressed }) => [
                  styles.tab,
                  active && {
                    backgroundColor: `${accentHex}30`,
                    borderColor: `${accentHex}45`,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    active && {
                      color: "#FFFFFF",
                    },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* CONTENT */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeSection === "general" && (
          <>
            <AuthLoading>
              <LoadingSettings />
            </AuthLoading>

            <Unauthenticated>
              <AuthOverlay />
            </Unauthenticated>

            <Authenticated>
              <GeneralTabAuth accentHex={accentHex} onNavigate={onNavigate} />
            </Authenticated>
          </>
        )}

        {activeSection === "apparence" && (
          <AppearanceTab
            prefs={prefs}
            accentHex={accentHex}
            update={update}
            reset={reset}
            onNavigate={onNavigate}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#050812",
  },

  header: {
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 12,
    backgroundColor: "#070B16",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 15,
  },

  backButton: {
    width: 43,
    height: 43,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.075)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  headerText: {
    flex: 1,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  headerSubtitle: {
    marginTop: 3,
    color: "rgba(255,255,255,0.40)",
    fontSize: 11,
  },

  tabs: {
    flexDirection: "row",
    padding: 4,
    gap: 4,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  tab: {
    flex: 1,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },

  tabText: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 12,
    fontWeight: "800",
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    padding: 18,
    paddingBottom: 48,
  },

  tabContent: {
    gap: 22,
  },

  sectionLabel: {
    marginBottom: 9,
    paddingLeft: 3,
    color: "rgba(255,255,255,0.30)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.25,
  },

  card: {
    overflow: "hidden",
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.038)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  settingRow: {
    minHeight: 65,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 11,
  },

  rowDivider: {
    height: 1,
    marginHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  rowIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  rowContent: {
    flex: 1,
    minWidth: 0,
  },

  rowTitle: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
    fontWeight: "750",
  },

  rowTitleFlex: {
    flex: 1,
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    fontWeight: "700",
  },

  rowDescription: {
    marginTop: 3,
    color: "rgba(255,255,255,0.31)",
    fontSize: 10,
    lineHeight: 15,
  },

  toggle: {
    width: 47,
    height: 27,
    justifyContent: "center",
    borderRadius: 999,
  },

  toggleThumb: {
    position: "absolute",
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
  },

  languageContainer: {
    paddingBottom: 3,
  },

  languageRow: {
    minHeight: 47,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },

  languageText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    fontWeight: "600",
  },

  loadingContainer: {
    gap: 12,
  },

  loadingCard: {
    minHeight: 86,
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  loadingIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  loadingLines: {
    flex: 1,
    marginLeft: 12,
    gap: 8,
  },

  loadingLineLarge: {
    width: "62%",
    height: 11,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  loadingLineSmall: {
    width: "38%",
    height: 8,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  loadingControl: {
    width: 47,
    height: 27,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  authCard: {
    alignItems: "center",
    padding: 24,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.038)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  authIcon: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    marginBottom: 12,
    backgroundColor: "rgba(99,102,241,0.15)",
  },

  authTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  authDescription: {
    maxWidth: 310,
    marginTop: 6,
    marginBottom: 16,
    color: "rgba(255,255,255,0.40)",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },

  preview: {
    position: "relative",
    overflow: "hidden",
    padding: 16,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.038)",
    borderWidth: 1,
  },

  previewGlow: {
    position: "absolute",
    top: -45,
    right: -35,
    width: 120,
    height: 120,
    borderRadius: 60,
  },

  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  previewIcon: {
    width: 43,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },

  previewText: {
    flex: 1,
  },

  previewTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  previewSubtitle: {
    marginTop: 3,
    color: "rgba(255,255,255,0.38)",
    fontSize: 10,
  },

  previewAccent: {
    width: 24,
    height: 24,
    borderRadius: 8,
  },

  previewParameters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 15,
  },

  previewParameter: {
    minWidth: "46%",
    flex: 1,
    padding: 9,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  previewParameterLabel: {
    color: "rgba(255,255,255,0.30)",
    fontSize: 9,
  },

  previewParameterValue: {
    marginTop: 3,
    color: "rgba(255,255,255,0.78)",
    fontSize: 11,
    fontWeight: "800",
  },

  themeLink: {
    minHeight: 67,
    flexDirection: "row",
    alignItems: "center",
    padding: 13,
    gap: 11,
    borderRadius: 20,
    borderWidth: 1,
  },

  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },

  accentOption: {
    position: "relative",
    width: "31.5%",
    minHeight: 105,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  accentColor: {
    width: 39,
    height: 39,
    borderRadius: 13,
    marginBottom: 8,
  },

  accentLabel: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 10,
    fontWeight: "800",
  },

  checkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },

  modeGrid: {
    flexDirection: "row",
    gap: 9,
  },

  modeOption: {
    position: "relative",
    flex: 1,
    minHeight: 126,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  modeTitle: {
    marginTop: 9,
    color: "rgba(255,255,255,0.62)",
    fontSize: 11,
    fontWeight: "800",
  },

  modeDescription: {
    marginTop: 4,
    color: "rgba(255,255,255,0.28)",
    fontSize: 9,
    textAlign: "center",
  },

  optionCheck: {
    position: "absolute",
    top: 9,
    right: 9,
  },

  sampleText: {
    marginRight: 8,
    fontWeight: "900",
  },

  densityGrid: {
    flexDirection: "row",
    gap: 9,
  },

  densityOption: {
    position: "relative",
    flex: 1,
    minHeight: 126,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  densityTitle: {
    marginTop: 9,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  densityDescription: {
    maxWidth: 125,
    marginTop: 4,
    color: "rgba(255,255,255,0.30)",
    fontSize: 9,
    lineHeight: 14,
    textAlign: "center",
  },

  resetButton: {
    minHeight: 51,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  resetButtonText: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 12,
    fontWeight: "800",
  },

  version: {
    marginTop: 13,
    color: "rgba(255,255,255,0.22)",
    fontSize: 10,
    textAlign: "center",
  },

  location: {
    marginTop: 3,
    color: "rgba(255,255,255,0.15)",
    fontSize: 9,
    textAlign: "center",
  },

  disabled: {
    opacity: 0.45,
  },

  pressed: {
    opacity: 0.7,
  },
});
