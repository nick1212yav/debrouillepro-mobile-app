import { UIService } from "@/core/sdk/ui/UIService";
import { View, Pressable, Text } from "react-native";
import {
  ArrowLeft,
  Moon,
  Sun,
  Monitor,
  Type,
  LayoutGrid,
  Check,
  Palette,
  Sparkles,
  RotateCcw,
  Eye,
  Contrast,
  WandSparkles,
  Accessibility,
  Smartphone,
  Save,
} from "lucide-react-native";
import { useAppearance, ACCENT_PALETTES } from "@/hooks/use-appearance";
import type {
  AccentColor,
  ColorMode,
  TextSize,
  Density,
  ColorBlindMode,
} from "@/hooks/use-appearance";
import { useMemo, useState } from "react";

interface ThemePageProps {
  onBack: () => void;
}

function SectionLabel({ label, sub }: { label: string; sub?: string }) {
  return (
    <View className="mb-3 px-1">
      <Text className="text-[10px] font-black text-white/30 uppercase tracking-[0.18em]">
        {label}
      </Text>
      {sub && <Text className="text-xs text-white/35 mt-1">{sub}</Text>}
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
  const p = ACCENT_PALETTES[accent];
  const isLight = colorMode === "clair";
  const isCompact = density === "compact";

  const bg = isLight ? "#eef0f7" : "#090b18";
  const cardBg = isLight ? "#ffffff" : "#121526";
  const textPrimary = isLight ? "#171827" : "#ffffff";
  const textSecondary = isLight ? "#65687b" : "rgba(255,255,255,0.42)";
  const fontSize = textSize === "petit" ? 11 : textSize === "grand" ? 14 : 12;
  const pad = isCompact ? "8px 10px" : "12px 14px";

  return (
    <View
      className="relative rounded-[24px] overflow-hidden"
      style={{ backgroundColor: bg, borderStyle: "solid" }}
    >
      <View
        className="absolute -top-16 -right-12 w-44 h-44 rounded-full"
        style={{  }}
      />

      <View
        className="relative flex items-center gap-2 px-3.5 py-3"
        style={{ backgroundColor: `${p.hex}18`, borderBottomStyle: "solid" }}
      >
        <View
          className="w-7 h-7 rounded-xl flex items-center justify-center"
          style={{  }}
        >
          <Sparkles size={13} className="text-white" />
        </View>
        <Text
          className="font-black"
          style={{ color: textPrimary, fontSize: fontSize + 1 }}
        >
          Débrouille Pro
        </Text>
        <View className="ml-auto flex gap-1.5">
          {[p.gradFrom, p.gradTo, `${p.hex}66`].map((c, i) => (
            <View
              key={i}
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: c }}
            />
          ))}
        </View>
      </View>

      {[
        {
          emoji: "🏠",
          title: "Appartement F3 Gombe",
          sub: "1 500 $/mois · Kinshasa",
          tag: "Immo",
        },
        {
          emoji: "💼",
          title: "Développeur React Native",
          sub: "2 200 $/mois · Télétravail",
          tag: "Emploi",
        },
        {
          emoji: "🎟️",
          title: "Festival de la ville",
          sub: "Samedi · 18:00",
          tag: "Événement",
        },
      ].map((item, i) => (
        <View
          key={item.title}
          className="flex items-center gap-2 border-b"
          style={{ padding: pad, backgroundColor: i % 2 === 0 ? cardBg : `${cardBg}cc`, borderColor: `${p.hex}18` }}
        >
          <View
            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0"
            style={{ backgroundColor: `${p.hex}18` }}
          >
            {item.emoji}
          </View>

          <View className="flex-1 min-w-0">
            <Text
              className="font-bold truncate"
              style={{ color: textPrimary, fontSize }}
            >
              {item.title}
            </Text>
            <Text
              className="truncate"
              style={{
                color: textSecondary,
                fontSize: Math.max(fontSize - 1, 9),
              }}
            >
              {item.sub}
            </Text>
          </View>

          <View
            className="shrink-0 px-2 py-1 rounded-full text-white font-bold"
            style={{  }}
          >
            {item.tag}
          </View>
        </View>
      ))}

      <View
        className="flex justify-around px-2 py-2.5"
        style={{ backgroundColor: cardBg }}
      >
        {["🏠", "🔍", "➕", "💬", "👤"].map((icon, i) => (
          <View
            key={i}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
            style={{ backgroundColor: i === 0 ? `${p.hex}25` : "transparent" }}
          >
            {icon}
          </View>
        ))}
      </View>
    </View>
  );
}

function AccentSwatch({
  colorKey,
  palette,
  isActive,
  onClick,
}: {
  colorKey: AccentColor;
  palette: (typeof ACCENT_PALETTES)[AccentColor];
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <Pressable
      type="button"
      aria-pressed={isActive}
      onPress={onClick}
      className="relative flex flex-col items-center gap-2 p-3 rounded-2xl"
      style={{ backgroundColor: isActive ? `${palette.hex}18` : "rgba(255,255,255,0.035)", borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}
    >
      <View
        className="w-full h-11 rounded-xl"
        style={{  }}
      />

      <Text
        className="text-xs font-bold"
        style={{
          color: isActive ? palette.hex : "rgba(255,255,255,0.45)",
        }}
      >
        {palette.label}
      </Text>

      <>
        {isActive && (
          <View
            className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: palette.hex }}
          >
            <Check size={10} className="text-white" />
          </View>
        )}
      </>
    </Pressable>
  );
}

function ChoiceButton({
  active,
  accent,
  icon: Icon,
  label,
  description,
  onClick,
}: {
  active: boolean;
  accent: string;
  icon: typeof Moon;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <Pressable
      type="button"
      aria-pressed={active}
      onPress={onClick}
      className="flex flex-col items-center gap-2 p-4 rounded-2xl"
      style={{ backgroundColor: active ? `${accent}18` : "rgba(255,255,255,0.035)", borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}
    >
      <Icon
        size={21}
        style={{ color: active ? accent : "rgba(255,255,255,0.35)" }}
      />
      <View className="text-center">
        <View
          className="text-xs font-bold"
          style={{  }}
        >
          {label}
        </View>
        <View className="text-[10px] text-white/25 mt-0.5">{description}</View>
      </View>
      {active && <Check size={12} style={{ color: accent }} />}
    </Pressable>
  );
}

export default function ThemePage({ onBack }: ThemePageProps) {
  const { prefs, update, reset } = useAppearance();
  const accent = ACCENT_PALETTES[prefs.accent];
  const accentHex = accent.hex;
  const [showAdvanced, setShowAdvanced] = useState(false);

  const colorModes = useMemo(
    () => [
      { key: "sombre" as ColorMode, label: "Sombre", Icon: Moon, desc: "Nuit" },
      { key: "clair" as ColorMode, label: "Clair", Icon: Sun, desc: "Jour" },
      {
        key: "systeme" as ColorMode,
        label: "Système",
        Icon: Monitor,
        desc: "Auto",
      },
    ],
    [],
  );

  const handleReset = () => {
    reset();
    UIService.openToast("Apparence réinitialisée", "success");
  };

  return (
    <View
      className="flex flex-col h-full min-h-0 overflow-hidden"
      style={{  }}
    >
      <View
        className="flex items-center gap-3 px-5 pt-safe-or-4 pb-4 border-b shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.06)", backgroundColor: "rgba(2,6,23,0.72)" }}
      >
        <Pressable
         
          onPress={onBack}
          accessibilityLabel="Retour"
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.055)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}
        >
          <ArrowLeft className="w-5 h-5 text-white/80" />
        </Pressable>

        <View className="flex-1 min-w-0">
          <Text className="text-base sm:text-lg font-black text-white flex items-center gap-2 truncate">
            <Palette
              className="w-4 h-4 shrink-0"
              style={{ color: accentHex }}
            />
            Thème & Personnalisation
          </Text>
          <Text className="text-xs text-white/35 truncate">
            Ton interface, ton confort, tes préférences
          </Text>
        </View>

        <Pressable
         
          onPress={handleReset}
         
          accessibilityLabel="Réinitialiser les préférences d'apparence"
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.045)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}
        >
          <RotateCcw className="w-4 h-4 text-white/40" />
        </Pressable>
      </View>

      <View
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-5 space-y-7"
        style={{  }}
      >
        <View
          className="relative overflow-hidden rounded-[28px] p-5 sm:p-6"
          style={{ borderStyle: "solid" }}
        >
          <View
            className="absolute -right-20 -top-24 w-64 h-64 rounded-full"
            style={{  }}
          />

          <View className="relative z-10 flex items-start gap-4">
            <View
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{  }}
            >
              <WandSparkles size={24} className="text-white" />
            </View>

            <View className="min-w-0">
              <View
                className="text-[9px] uppercase tracking-[0.2em] font-black mb-1"
                style={{  }}
              >
                <Text>Personnalisation</Text></View>
              <Text className="text-2xl font-black text-white leading-tight">
                Fais de Débrouille Pro
                <Text style={{ color: accentHex }}> ton espace.</Text>
              </Text>
              <Text className="text-xs sm:text-sm text-white/40 leading-relaxed mt-2 max-w-xl">
                Ajuste les couleurs, la lisibilité et la densité. Les
                modifications sont appliquées immédiatement.
              </Text>
            </View>
          </View>
        </View>

        <View>
          <SectionLabel
            label="Aperçu en temps réel"
            sub="Voici comment ton interface évolue"
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
            sub="Boutons, badges, actions et éléments mis en avant"
          />
          <View className="gap-2">
            {(
              Object.entries(ACCENT_PALETTES) as [
                AccentColor,
                (typeof ACCENT_PALETTES)[AccentColor],
              ][]
            ).map(([key, palette]) => (
              <AccentSwatch
                key={key}
                colorKey={key}
                palette={palette}
                isActive={prefs.accent === key}
                onPress={() => update("accent", key)}
              />
            ))}
          </View>
        </View>

        <View>
          <SectionLabel
            label="Mode couleur"
            sub="Choisis l'ambiance qui te convient"
          />
          <View className="gap-2">
            {colorModes.map(({ key, label, Icon, desc }) => (
              <ChoiceButton
                key={key}
                active={prefs.colorMode === key}
                accent={accentHex}
                icon={Icon}
                label={label}
                description={desc}
                onPress={() => update("colorMode", key)}
              />
            ))}
          </View>
        </View>

        <View>
          <SectionLabel
            label="Taille du texte"
            sub="Une interface plus petite ou plus confortable"
          />
          <View
            className="rounded-[24px] overflow-hidden"
            style={{ backgroundColor: "rgba(255,255,255,0.035)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}
          >
            {[
              {
                key: "petit" as TextSize,
                label: "Petit",
                sample: "Aa",
                size: "text-xs",
                desc: "14px",
              },
              {
                key: "normal" as TextSize,
                label: "Normal",
                sample: "Aa",
                size: "text-base",
                desc: "16px",
              },
              {
                key: "grand" as TextSize,
                label: "Grand",
                sample: "Aa",
                size: "text-xl",
                desc: "18px",
              },
            ].map(({ key, label, sample, size, desc }, i, arr) => {
              const active = prefs.textSize === key;

              return (
                <Pressable
                  type="button"
                  key={key}
                  onPress={() => update("textSize", key)}
                  aria-pressed={active}
                  className="w-full flex items-center gap-3 px-4 py-3.5"
                  style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)", borderBottomStyle: "solid", backgroundColor: active ? `${accentHex}10` : "transparent" }}
                >
                  <View
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: active
                                            ? `${accentHex}20`
                                            : "rgba(255,255,255,0.06)" }}
                  >
                    <Type
                      size={16}
                      style={{
                        color: active ? accentHex : "rgba(255,255,255,0.4)",
                      }}
                    />
                  </View>

                  <View className="flex-1 text-left">
                    <Text
                      className="text-sm font-bold"
                      style={{
                        color: active ? "white" : "rgba(255,255,255,0.6)",
                      }}
                    >
                      {label}
                    </Text>
                    <Text className="text-xs text-white/25 ml-2">{desc}</Text>
                  </View>

                  <Text
                    className={`font-black ${size} mr-2`}
                    style={{
                      color: active ? accentHex : "rgba(255,255,255,0.2)",
                    }}
                  >
                    {sample}
                  </Text>

                  {active && <Check size={14} style={{ color: accentHex }} />}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View>
          <SectionLabel
            label="Densité d'affichage"
            sub="Plus de contenu ou plus d'espace entre les éléments"
          />
          <View className="gap-3">
            {[
              {
                key: "compact" as Density,
                label: "Compact",
                Icon: LayoutGrid,
                desc: "Plus de contenu visible",
                rows: 5,
              },
              {
                key: "confortable" as Density,
                label: "Confortable",
                Icon: Smartphone,
                desc: "Espaces généreux",
                rows: 3,
              },
            ].map(({ key, label, Icon, desc, rows }) => {
              const active = prefs.density === key;

              return (
                <Pressable
                  type="button"
                  key={key}
                  onPress={() => update("density", key)}
                  aria-pressed={active}
                  className="flex flex-col items-center gap-3 p-4 rounded-[24px]"
                  style={{ backgroundColor: active
                                        ? `${accentHex}18`
                                        : "rgba(255,255,255,0.035)", borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}
                >
                  <View className="w-full flex flex-col gap-1.5">
                    {Array.from({ length: rows }).map((_, i) => (
                      <View
                        key={i}
                        className="rounded-full"
                        style={{ height: key === "compact" ? 6 : 10, backgroundColor: active
                                                    ? `${accentHex}${i === 0 ? "66" : "28"}`
                                                    : "rgba(255,255,255,0.1)" }}
                      />
                    ))}
                  </View>

                  <View className="text-center">
                    <View
                      className="text-sm font-black flex items-center justify-center gap-1.5"
                      style={{  }}
                    >
                      <Icon size={14} />
                      {label}
                    </View>
                    <View className="text-[10px] text-white/30 mt-1">{desc}</View>
                  </View>

                  {active && <Check size={13} style={{ color: accentHex }} />}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View>
          <Pressable
           
            onPress={() => setShowAdvanced((value) => !value)}
            className="w-full flex items-center gap-3 text-left"
          >
            <View
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: `${accentHex}12`, borderStyle: "solid" }}
            >
              <Accessibility size={17} style={{ color: accentHex }} />
            </View>

            <View className="flex-1">
              <Text className="text-sm font-black text-white">Accessibilité</Text>
              <Text className="text-[11px] text-white/30">
                Contraste élevé et modes daltonisme
              </Text>
            </View>

            <View
            >
              <Check
                size={15}
                className={showAdvanced ? "opacity-100" : "opacity-20"}
                style={{ color: accentHex }}
              />
            </View>
          </Pressable>

          <>
            {showAdvanced && (
              <View
                className="overflow-hidden"
              >
                <View className="pt-4">
                  <Pressable
                    type="button"
                    onPress={() => update("highContrast", !prefs.highContrast)}
                    aria-pressed={prefs.highContrast}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl mb-3"
                    style={{ backgroundColor: prefs.highContrast
                                            ? `${accentHex}18`
                                            : "rgba(255,255,255,0.035)", borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}
                  >
                    <View
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: prefs.highContrast
                                                ? `${accentHex}22`
                                                : "rgba(255,255,255,0.06)" }}
                    >
                      <Contrast
                        size={18}
                        style={{
                          color: prefs.highContrast
                            ? accentHex
                            : "rgba(255,255,255,0.4)",
                        }}
                      />
                    </View>

                    <View className="flex-1 text-left">
                      <View
                        className="text-sm font-bold"
                        style={{  }}
                      >
                        <Text>Contraste élevé</Text></View>
                      <View className="text-[11px] text-white/30">
                        <Text>Améliore la lisibilité</Text></View>
                    </View>

                    {prefs.highContrast && (
                      <Check size={14} style={{ color: accentHex }} />
                    )}
                  </Pressable>

                  <View
                    className="rounded-2xl overflow-hidden"
                    style={{ backgroundColor: "rgba(255,255,255,0.035)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}
                  >
                    {[
                      {
                        key: "none" as ColorBlindMode,
                        label: "Normal",
                        desc: "Aucun filtre",
                      },
                      {
                        key: "deuteranopia" as ColorBlindMode,
                        label: "Deutéranopie",
                        desc: "Daltonisme rouge-vert",
                      },
                      {
                        key: "protanopia" as ColorBlindMode,
                        label: "Protanopie",
                        desc: "Insensibilité au rouge",
                      },
                      {
                        key: "tritanopia" as ColorBlindMode,
                        label: "Tritanopie",
                        desc: "Daltonisme bleu-jaune",
                      },
                      {
                        key: "achromatopsia" as ColorBlindMode,
                        label: "Achromatopsie",
                        desc: "Absence de perception des couleurs",
                      },
                    ].map(({ key, label, desc }, i, arr) => {
                      const active = prefs.colorBlindMode === key;

                      return (
                        <Pressable
                          type="button"
                          key={key}
                          onPress={() => update("colorBlindMode", key)}
                          aria-pressed={active}
                          className="w-full flex items-center gap-3 px-4 py-3"
                          style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)", borderBottomStyle: "solid", backgroundColor: active
                                                        ? `${accentHex}10`
                                                        : "transparent" }}
                        >
                          <View
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: active
                                                            ? `${accentHex}22`
                                                            : "rgba(255,255,255,0.06)" }}
                          >
                            <Eye
                              size={15}
                              style={{
                                color: active
                                  ? accentHex
                                  : "rgba(255,255,255,0.4)",
                              }}
                            />
                          </View>

                          <View className="flex-1 text-left">
                            <View
                              className="text-sm font-bold"
                              style={{  }}
                            >
                              {label}
                            </View>
                            <View className="text-[11px] text-white/30">
                              {desc}
                            </View>
                          </View>

                          {active && (
                            <Check size={13} style={{ color: accentHex }} />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}
          </>
        </View>

        <View
          className="rounded-[24px] px-4 py-3.5 flex items-center gap-3"
          style={{ backgroundColor: `${accentHex}0d`, borderStyle: "solid" }}
        >
          <View
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${accentHex}18` }}
          >
            <Save size={15} style={{ color: accentHex }} />
          </View>

          <View className="flex-1">
            <Text className="text-xs font-bold text-white/65">
              <Text>Préférences synchronisées</Text></Text>
            <Text className="text-[10px] text-white/30 mt-0.5">
              <Text>Tes choix sont sauvegardés automatiquement et suivent ton expérience Débrouille Pro.</Text></Text>
          </View>

          <Sparkles size={15} style={{ color: accentHex }} />
        </View>

        <Text className="text-center text-[10px] text-white/15 pb-5">
          <Text>Personnalise ton expérience à tout moment.</Text></Text>
      </View>
    </View>
  );
}
