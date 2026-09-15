// src/pages/home/_components/GlobalContextBar.tsx
import {
  Pressable,
  View,
  Text,
  Animated,
  Easing,
  StyleSheet,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
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

/* ============================================================================
 * TYPES
 * ========================================================================== */

export type GlobalContext = {
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

/* ============================================================================
 * HELPERS
 * ========================================================================== */

const isBrowser = typeof window !== "undefined";

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
  if (typeof navigator === "undefined") return "fr";
  const language = navigator.language?.split("-")[0];
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

/* ============================================================================
 * ROTATING NAV ICON
 * ========================================================================== */

function RotatingNavigation() {
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 1200,
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
      <Navigation size={15} color="#A5B4FC" strokeWidth={2} />
    </Animated.View>
  );
}

/* ============================================================================
 * CONTEXT ROW
 * ========================================================================== */

function ContextRow({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <View style={styles.contextRow}>
      <View style={styles.contextIcon}>{icon}</View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.contextLabel}>{label}</Text>
        <Text style={styles.contextValue} numberOfLines={1}>
          {value}
        </Text>
        {detail && detail !== value ? (
          <Text style={styles.contextDetail} numberOfLines={1}>
            {detail}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/* ============================================================================
 * MAIN COMPONENT
 * ========================================================================== */

export default function GlobalContextBar({
  context,
  loading = false,
  onContextDetected,
  onOpenSettings,
  className,
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

  /* ───── animations ───── */
  const chevronAnim = useRef(new Animated.Value(0)).current;
  const panelAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(open);

  /* Chevron rotation */
  useEffect(() => {
    Animated.timing(chevronAnim, {
      toValue: open ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [open, chevronAnim]);

  /* Panel mount/unmount + slide */
  useEffect(() => {
    if (open) {
      setMounted(true);
      panelAnim.setValue(0);
      backdropAnim.setValue(0);
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(panelAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 22,
          bounciness: 6,
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(panelAnim, {
          toValue: 0,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* ───── location detection ───── */
  const detectLocation = useCallback(() => {
    if (
      !isBrowser ||
      typeof navigator === "undefined" ||
      !navigator.geolocation
    ) {
      setDetectionState("unavailable");
      return;
    }

    setDetectionState("detecting");

    navigator.geolocation.getCurrentPosition(
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

  /* ───── status text ───── */
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

  const chevronRotate = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const panelTranslateY = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 0],
  });
  const panelScale = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1],
  });

  const isDetecting = detectionState === "detecting" || loading;

  /* ========================================================================
   * RENDER
   * ====================================================================== */

  return (
    <View style={[styles.root, className ? undefined : undefined]}>
      {/* ───── TRIGGER BAR ───── */}
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel="Ouvrir le contexte régional"
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
      >
        {/* Ambient gradient wash */}
        <LinearGradient
          colors={["rgba(139,92,246,0.18)", "rgba(255,255,255,0.02)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* Left orb */}
        <View style={styles.triggerOrb} pointerEvents="none" />

        {/* Icon */}
        <View style={styles.triggerIconWrap}>
          {isDetecting ? (
            <RotatingNavigation />
          ) : (
            <MapPin size={15} color="#A5B4FC" strokeWidth={2} />
          )}
        </View>

        {/* Text */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.triggerTitleRow}>
            <Text style={styles.triggerCity} numberOfLines={1}>
              {cityLabel}
            </Text>
            {effectiveContext?.countryCode ? (
              <View style={styles.countryCodePill}>
                <Text style={styles.countryCodeText}>
                  {effectiveContext.countryCode}
                </Text>
              </View>
            ) : null}
          </View>
          <View style={styles.triggerStatusRow}>
            <Globe2 size={9} color="rgba(255,255,255,0.4)" />
            <Text style={styles.triggerStatus} numberOfLines={1}>
              {statusText}
            </Text>
          </View>
        </View>

        {/* Meta pills (desktop only) */}
        {Platform.OS === "web" ? (
          <View style={styles.triggerMetaRow}>
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>{languageLabel}</Text>
            </View>
            {effectiveContext?.currency ? (
              <View style={styles.metaPill}>
                <Text style={styles.metaPillText}>{currencyLabel}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Chevron */}
        <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
          <ChevronDown size={15} color="rgba(255,255,255,0.55)" />
        </Animated.View>
      </Pressable>

      {/* ───── BACKDROP ───── */}
      {mounted ? (
        <Animated.View
          pointerEvents="box-none"
          style={[
            StyleSheet.absoluteFill,
            { opacity: backdropAnim, zIndex: 40 },
          ]}
        >
          <Pressable
            onPress={() => setOpen(false)}
            style={StyleSheet.absoluteFill}
            accessibilityLabel="Fermer"
          />
        </Animated.View>
      ) : null}

      {/* ───── PANEL ───── */}
      {mounted ? (
        <Animated.View
          style={[
            styles.panel,
            {
              opacity: panelAnim,
              transform: [
                { translateY: panelTranslateY },
                { scale: panelScale },
              ],
            },
          ]}
        >
          {/* Base background */}
          <LinearGradient
            colors={["#140F2A", "#0E0A1F", "#0A0718"]}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Border ring */}
          <View style={styles.panelBorder} pointerEvents="none" />

          {/* Top ambient orb */}
          <View style={styles.panelOrb} pointerEvents="none" />

          {/* Header */}
          <View style={styles.panelHeader}>
            <View style={styles.panelHeaderTop}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.panelHeaderTitleRow}>
                  <LinearGradient
                    colors={["#A5B4FC", "#818CF8", "#6366F1"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.panelHeaderIcon}
                  >
                    <Globe2 size={13} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.panelHeaderTitle}>
                    Votre environnement
                  </Text>
                </View>
                <Text style={styles.panelHeaderSub}>
                  DébrouillePro adapte progressivement votre expérience à votre
                  environnement.
                </Text>
              </View>

              <Pressable
                onPress={() => setOpen(false)}
                accessibilityLabel="Fermer"
                hitSlop={8}
                style={({ pressed }) => [
                  styles.panelCloseBtn,
                  pressed && styles.pressed,
                ]}
              >
                <X size={13} color="rgba(255,255,255,0.6)" />
              </Pressable>
            </View>
          </View>

          {/* Rows */}
          <View style={styles.rowsWrap}>
            <ContextRow
              icon={<MapPin size={14} color="rgba(255,255,255,0.7)" />}
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
              icon={<Languages size={14} color="rgba(255,255,255,0.7)" />}
              label="Langue"
              value={languageLabel}
              detail={effectiveContext?.language}
            />
            <ContextRow
              icon={<Globe2 size={14} color="rgba(255,255,255,0.7)" />}
              label="Fuseau horaire"
              value={timezoneLabel}
            />
            <ContextRow
              icon={<Navigation size={14} color="rgba(255,255,255,0.7)" />}
              label="Position"
              value={
                coordinates ? "Position disponible" : "Position non détectée"
              }
              detail={coordinates ?? undefined}
            />
            {effectiveContext?.currency ? (
              <ContextRow
                icon={<Text style={styles.currencyIcon}>$</Text>}
                label="Devise"
                value={currencyLabel}
              />
            ) : null}
          </View>

          {/* Detect location */}
          {!coordinates ? (
            <View style={styles.detectWrap}>
              <Pressable
                onPress={detectLocation}
                disabled={loading || detectionState === "detecting"}
                accessibilityRole="button"
                accessibilityLabel="Détecter ma position"
                style={({ pressed }) => [
                  styles.detectBtn,
                  (loading || detectionState === "detecting") &&
                    styles.detectBtnDisabled,
                  pressed && styles.pressed,
                ]}
              >
                <LinearGradient
                  colors={["#818CF8", "#6366F1", "#7C3AED"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.detectBtnGradient}
                >
                  <LocateFixed size={14} color="#fff" />
                  <Text style={styles.detectBtnText}>
                    {detectionState === "detecting"
                      ? "Détection en cours…"
                      : "Détecter ma position"}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          ) : null}

          {/* Settings */}
          {onOpenSettings ? (
            <View style={styles.settingsWrap}>
              <Pressable
                onPress={() => {
                  setOpen(false);
                  onOpenSettings();
                }}
                style={({ pressed }) => [
                  styles.settingsBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Check size={13} color="rgba(255,255,255,0.75)" />
                <Text style={styles.settingsBtnText}>
                  Gérer mes préférences régionales
                </Text>
              </Pressable>
            </View>
          ) : null}

          {/* Status footer */}
          {detectionState === "denied" ? (
            <View style={styles.deniedFooter}>
              <Text style={styles.deniedText}>
                La localisation est bloquée. Vous pouvez l'autoriser depuis les
                paramètres de votre navigateur.
              </Text>
            </View>
          ) : null}
        </Animated.View>
      ) : null}
    </View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  root: {
    position: "relative",
    paddingHorizontal: 16,
  },
  pressed: { opacity: 0.85 },

  // ── Trigger
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(12,10,28,0.6)",
    overflow: "hidden",
  },
  triggerOrb: {
    position: "absolute",
    top: -40,
    left: -40,
    width: 96,
    height: 96,
    borderRadius: 9999,
    backgroundColor: "rgba(139,92,246,0.3)",
    opacity: 0.4,
  },
  triggerIconWrap: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "rgba(139,92,246,0.14)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.28)",
  },
  triggerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  triggerCity: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.92)",
    letterSpacing: -0.2,
  },
  countryCodePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  countryCodeText: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.55)",
  },
  triggerStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 3,
  },
  triggerStatus: {
    flex: 1,
    fontSize: 9.5,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },
  triggerMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  metaPillText: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 0.2,
  },

  // ── Panel
  panel: {
    position: "absolute",
    top: "100%",
    left: 16,
    right: 16,
    marginTop: 8,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#0E0A1F",
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 20 },
    elevation: 24,
    zIndex: 50,
  },
  panelBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.14)",
  },
  panelOrb: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 160,
    height: 160,
    borderRadius: 9999,
    backgroundColor: "rgba(99,102,241,0.22)",
  },

  // ── Panel header
  panelHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  panelHeaderTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  panelHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  panelHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    shadowColor: "#6366F1",
    shadowOpacity: 0.7,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  panelHeaderTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.3,
  },
  panelHeaderSub: {
    fontSize: 10.5,
    lineHeight: 15,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },
  panelCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  // ── Rows
  rowsWrap: {
    padding: 12,
    gap: 4,
  },
  contextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
  },
  contextIcon: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  contextLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase",
  },
  contextValue: {
    marginTop: 3,
    fontSize: 11.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.85)",
  },
  contextDetail: {
    marginTop: 2,
    fontSize: 9,
    color: "rgba(255,255,255,0.35)",
    fontWeight: "500",
  },
  currencyIcon: {
    fontSize: 13,
    fontWeight: "900",
    color: "rgba(255,255,255,0.75)",
  },

  // ── Detect location
  detectWrap: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  detectBtn: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#6366F1",
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  detectBtnDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  detectBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 20,
  },
  detectBtnText: {
    fontSize: 12.5,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.2,
  },

  // ── Settings
  settingsWrap: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  settingsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  settingsBtnText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 0.2,
  },

  // ── Denied footer
  deniedFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(248,113,113,0.15)",
    backgroundColor: "rgba(239,68,68,0.06)",
  },
  deniedText: {
    fontSize: 9.5,
    lineHeight: 14,
    textAlign: "center",
    color: "rgba(252,165,165,0.75)",
    fontWeight: "500",
  },
});
