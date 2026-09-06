import { Pressable, View, Text } from "react-native";

// src/pages/home/_components/GlobalContextBar.tsx

import {
  Check,
  ChevronDown,
  Globe2,
  Languages,
  LocateFixed,
  MapPin,
  Navigation,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";

type GlobalContext = {
  country?: string;
  countryCode?: string;
  city?: string;
  region?: string;
  language?: string;
  currency?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
};

interface GlobalContextBarProps {
  context?: GlobalContext | null;
  loading?: boolean;
  onContextDetected?: (context: GlobalContext) => void;
  onOpenSettings?: () => void;
  className?: string;
}

type DetectionState =
  | "idle"
  | "detecting"
  | "success"
  | "denied"
  | "unavailable"
  | "error";

const LANGUAGE_LABELS: Record<string, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
  pt: "Português",
  ar: "العربية",
  sw: "Kiswahili",
};

function getLanguageLabel(language?: string): string {
  if (!language) return "Langue";
  return LANGUAGE_LABELS[language.toLowerCase()] ?? language;
}

function getBrowserLanguage(): string {
  if (typeof undefined === "undefined") return "fr";

  const language = "en"?.split("-")[0];

  return language || "fr";
}

function getTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

function getCurrencyForLocale(): string | undefined {
  /**
   * On ne déduit pas artificiellement une devise à partir
   * d'une liste locale.
   *
   * Le backend pourra fournir la devise officielle/régionale.
   */
  return undefined;
}

function formatCoordinates(
  latitude?: number,
  longitude?: number,
): string | null {
  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}

export default function GlobalContextBar({
  context,
  loading = false,
  onContextDetected,
  onOpenSettings,
  className = "",
}: GlobalContextBarProps) {
  const [open, setOpen] = useState(false);
  const [detectionState, setDetectionState] = useState<DetectionState>("idle");

  const [localContext, setLocalContext] = useState<GlobalContext | null>(null);

  const browserLanguage = useMemo(() => getBrowserLanguage(), []);
  const browserTimezone = useMemo(() => getTimezone(), []);

  const effectiveContext = context ?? localContext;

  const cityLabel =
    effectiveContext?.city ??
    effectiveContext?.region ??
    effectiveContext?.country ??
    "Votre position";

  const languageLabel = getLanguageLabel(
    effectiveContext?.language ?? browserLanguage,
  );

  const currencyLabel = effectiveContext?.currency ?? "Devise locale";

  const timezoneLabel =
    effectiveContext?.timezone ?? browserTimezone ?? "Fuseau local";

  const coordinates = formatCoordinates(
    effectiveContext?.latitude,
    effectiveContext?.longitude,
  );

  const detectLocation = useCallback(() => {
    if (typeof undefined === "undefined" || !undefined) {
      setDetectionState("unavailable");
      return;
    }

    setDetectionState("detecting");

    undefined.getCurrentPosition(
      (position) => {
        const detected: GlobalContext = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          language: browserLanguage,
          timezone: browserTimezone,
          currency: getCurrencyForLocale(),
        };

        setLocalContext(detected);
        setDetectionState("success");

        onContextDetected?.(detected);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setDetectionState("denied");
        } else {
          setDetectionState("error");
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000,
      },
    );
  }, [browserLanguage, browserTimezone, onContextDetected]);

  useEffect(() => {
    if (context) {
      setDetectionState("success");
    }
  }, [context]);

  const statusText = useMemo(() => {
    if (loading || detectionState === "detecting") {
      return "Détection de votre environnement…";
    }

    if (detectionState === "denied") {
      return "Localisation non autorisée";
    }

    if (detectionState === "unavailable") {
      return "Localisation indisponible";
    }

    if (detectionState === "error") {
      return "Impossible de détecter votre position";
    }

    if (coordinates) {
      return "Position détectée";
    }

    return "Votre environnement";
  }, [coordinates, detectionState, loading]);

  return (
    <View className={`relative px-4 ${className}`}>
      <Pressable
        onPress={() => setOpen((value) => !value)}
        aria-expanded={open}
        accessibilityLabel="Ouvrir le contexte régional"
        className="group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl px-3 py-2.5 text-left"
        style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.085)", borderStyle: "solid" }}
      >
        {/* Ambient glow */}
        <View
          className="absolute -left-10 -top-10 h-24 w-24 rounded-full opacity-40"
          style={{  }}
        />

        {/* Location icon */}
        <View
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ borderWidth: 1, borderColor: "rgba(139,92,246,0.2)", borderStyle: "solid" }}
        >
          {detectionState === "detecting" || loading ? (
            <View
            >
              <Navigation
                size={15}
                className="text-indigo-300"
                strokeWidth={2}
              />
            </View>
          ) : (
            <MapPin size={15} className="text-indigo-300" strokeWidth={2} />
          )}
        </View>

        {/* Context */}
        <View className="relative min-w-0 flex-1">
          <View className="flex min-w-0 items-center gap-2">
            <Text className="truncate text-[12px] font-bold text-white/85">
              {cityLabel}
            </Text>

            {effectiveContext?.countryCode && (
              <Text className="shrink-0 rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white/45">
                {effectiveContext.countryCode}
              </Text>
            )}
          </View>

          <View className="mt-0.5 flex min-w-0 items-center gap-1.5">
            <Globe2 size={9} className="shrink-0 text-white/30" />

            <Text className="truncate text-[9px] font-medium text-white/35">
              {statusText}
            </Text>
          </View>
        </View>

        {/* Language / currency */}
        <View className="hidden shrink-0 items-center gap-1.5 sm:flex">
          <Text className="rounded-full border border-white/[0.07] bg-white/[0.035] px-2 py-1 text-[9px] font-semibold text-white/45">
            {languageLabel}
          </Text>

          {effectiveContext?.currency && (
            <Text className="rounded-full border border-white/[0.07] bg-white/[0.035] px-2 py-1 text-[9px] font-semibold text-white/45">
              {currencyLabel}
            </Text>
          )}
        </View>

        <View
          className="relative shrink-0"
        >
          <ChevronDown size={15} className="text-white/35" />
        </View>
      </Pressable>

      <>
        {open && (
          <>
            {/* Backdrop mobile */}
            <Pressable
              onPress={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/20"
            />

            {/* Context panel */}
            <View
              className="absolute left-4 right-4 top-full z-50 mt-2 overflow-hidden rounded-3xl"
              style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", borderStyle: "solid" }}
            >
              {/* Header */}
              <View className="relative overflow-hidden border-b border-white/[0.06] px-4 pb-4 pt-4">
                <View
                  className="absolute -right-16 -top-20 h-40 w-40 rounded-full"
                  style={{  }}
                />

                <View className="relative flex items-start justify-between gap-3">
                  <View>
                    <View className="mb-1 flex items-center gap-2">
                      <View
                        className="flex h-7 w-7 items-center justify-center rounded-xl"
                        style={{  }}
                      >
                        <Globe2 size={13} className="text-white" />
                      </View>

                      <Text className="text-sm font-black text-white">
                        Votre environnement
                      </Text>
                    </View>

                    <Text className="text-[10px] leading-relaxed text-white/35">
                      DébrouillePro adapte progressivement votre expérience à
                      votre environnement.
                    </Text>
                  </View>

                  <Pressable
                   
                    onPress={() => setOpen(false)}
                    accessibilityLabel="Fermer"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-white/40"
                  >
                    <X size={13} />
                  </Pressable>
                </View>
              </View>

              {/* Context rows */}
              <View className="space-y-1 p-3">
                <ContextRow
                  icon={<MapPin size={14} />}
                  label="Localisation"
                  value={cityLabel}
                  detail={
                    effectiveContext?.country ??
                    effectiveContext?.region ??
                    coordinates ??
                    undefined
                  }
                />

                <ContextRow
                  icon={<Languages size={14} />}
                  label="Langue"
                  value={languageLabel}
                  detail={effectiveContext?.language}
                />

                <ContextRow
                  icon={<Globe2 size={14} />}
                  label="Fuseau horaire"
                  value={timezoneLabel}
                />

                <ContextRow
                  icon={<Navigation size={14} />}
                  label="Position"
                  value={
                    coordinates
                      ? "Position disponible"
                      : "Position non détectée"
                  }
                  detail={coordinates ?? undefined}
                />

                {effectiveContext?.currency && (
                  <ContextRow
                    icon={<Text className="text-xs font-black">$</Text>}
                    label="Devise"
                    value={currencyLabel}
                  />
                )}
              </View>

              {/* Location action */}
              {!coordinates && (
                <View className="px-3 pb-2">
                  <Pressable
                    onPress={detectLocation}
                    disabled={loading || detectionState === "detecting"}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    style={{  }}
                  >
                    <LocateFixed size={14} />

                    {detectionState === "detecting"
                      ? "Détection en cours…"
                      : "Détecter ma position"}
                  </Pressable>
                </View>
              )}

              {/* Settings */}
              {onOpenSettings && (
                <View className="border-t border-white/[0.06] p-3">
                  <Pressable
                   
                    onPress={() => {
                      setOpen(false);
                      onOpenSettings();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.035] py-3 text-[11px] font-bold text-white/60"
                  >
                    <Check size={13} />
                    <Text>Gérer mes préférences régionales</Text></Pressable>
                </View>
              )}

              {/* Status */}
              {detectionState === "denied" && (
                <View className="border-t border-red-400/10 bg-red-400/[0.04] px-4 py-3">
                  <Text className="text-center text-[9px] leading-relaxed text-red-300/60">
                    La localisation est bloquée. Vous pouvez l'autoriser depuis
                    les paramètres de votre navigateur.
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </>
    </View>
  );
}

function ContextRow({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <View className="flex items-center gap-3 rounded-2xl px-3 py-2.5">
      <View className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-white/45">
        {icon}
      </View>

      <View className="min-w-0 flex-1">
        <Text className="text-[9px] font-medium uppercase tracking-wider text-white/25">
          {label}
        </Text>

        <Text className="truncate text-[11px] font-bold text-white/70">{value}</Text>

        {detail && detail !== value && (
          <Text className="truncate text-[8px] text-white/25">{detail}</Text>
        )}
      </View>
    </View>
  );
}
