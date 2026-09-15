// src/pages/home/_components/SearchBar.tsx
import {
  Text,
  View,
  TextInput,
  Pressable,
  Animated,
  Easing,
  StyleSheet,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Mic, MicOff, Search, Sparkles, X } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";

/* ============================================================
 * CONSTANTS
 * ============================================================ */

const isBrowser = typeof window !== "undefined";

/* ============================================================
 * TYPES
 * ============================================================ */

interface SearchBarProps {
  onSearch?: (query: string) => void;
  onVoiceResult?: (query: string) => void;
  initialValue?: string;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onresult:
    | ((event: {
        results: ArrayLike<ArrayLike<{ transcript: string }>>;
      }) => void)
    | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

/* ============================================================
 * ENTRANCE WRAPPER
 * ============================================================ */

function FadeUp({
  delay = 0,
  distance = 8,
  children,
  style,
}: {
  delay?: number;
  distance?: number;
  children: React.ReactNode;
  style?: any;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 460,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [distance, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/* ============================================================
 * ANIMATED SEARCH ICON
 * ============================================================ */

function AnimatedSearchIcon({ focused }: { focused: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  const halo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.08 : 1,
      stiffness: 380,
      damping: 22,
      useNativeDriver: true,
    }).start();
  }, [focused, scale]);

  useEffect(() => {
    if (focused) {
      halo.setValue(0);
      Animated.loop(
        Animated.timing(halo, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ).start();
    } else {
      halo.setValue(0);
    }
  }, [focused, halo]);

  const haloScale = halo.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.7],
  });
  const haloOpacity = halo.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 0],
  });

  return (
    <View style={styles.searchIconWrap}>
      <Animated.View
        style={[
          styles.searchIconHalo,
          { opacity: haloOpacity, transform: [{ scale: haloScale }] },
        ]}
      />
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={
            focused
              ? ["rgba(167,139,250,0.32)", "rgba(99,102,241,0.1)"]
              : ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.03)"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.searchIconGradient,
            {
              borderColor: focused
                ? "rgba(167,139,250,0.4)"
                : "rgba(255,255,255,0.08)",
            },
          ]}
        >
          <Search
            size={17}
            color={focused ? "#C4B5FD" : "rgba(255,255,255,0.5)"}
            strokeWidth={2.2}
          />
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

/* ============================================================
 * WAVEFORM BARS
 * ============================================================ */

function WaveformBars() {
  const bars = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    bars.forEach((bar, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 90),
          Animated.timing(bar, {
            toValue: 1,
            duration: 420 + i * 60,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(bar, {
            toValue: 0,
            duration: 420 + i * 60,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
        ]),
      ).start();
    });
  }, [bars]);

  return (
    <View style={styles.waveform}>
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={[
            styles.waveformBar,
            {
              height: bar.interpolate({
                inputRange: [0, 1],
                outputRange: [4, 12 + i * 2],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
}

/* ============================================================
 * MAIN COMPONENT
 * ============================================================ */

export default function SearchBar({
  onSearch,
  onVoiceResult,
  initialValue = "",
  placeholder = "Que recherchez-vous ?",
  disabled = false,
  autoFocus = false,
  className,
}: SearchBarProps) {
  const inputRef = useRef<TextInput>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const [query, setQuery] = useState(initialValue);
  const [focused, setFocused] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  /* ───── animations ───── */
  const focusAnim = useRef(new Animated.Value(0)).current;
  const listeningAnim = useRef(new Animated.Value(0)).current;
  const listeningPulse = useRef(new Animated.Value(0)).current;
  const micGlow = useRef(new Animated.Value(0)).current;
  const suggestionAnim = useRef(new Animated.Value(0)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;

  /* ───── focus transition ───── */
  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: focused ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [focused, focusAnim]);

  /* ───── listening banner slide ───── */
  useEffect(() => {
    Animated.timing(listeningAnim, {
      toValue: listening ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    if (listening) {
      listeningPulse.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(listeningPulse, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(listeningPulse, {
            toValue: 0,
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ).start();

      micGlow.setValue(0);
      Animated.loop(
        Animated.timing(micGlow, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ).start();
    } else {
      listeningPulse.setValue(0);
      micGlow.setValue(0);
    }
  }, [listening, listeningAnim, listeningPulse, micGlow]);

  /* ───── suggestion hint slide ───── */
  useEffect(() => {
    Animated.timing(suggestionAnim, {
      toValue: focused && !query ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [focused, query, suggestionAnim]);

  /* ───── shine sweep on submit ───── */
  useEffect(() => {
    const hasQuery = query.trim().length > 0;
    if (hasQuery && !disabled) {
      shineAnim.setValue(0);
      Animated.timing(shineAnim, {
        toValue: 1,
        duration: 2200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [query, disabled, shineAnim]);

  /* ==========================================================
   * SPEECH SUPPORT
   * ========================================================== */

  useEffect(() => {
    if (!isBrowser) return;
    const SpeechRecognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    setVoiceSupported(Boolean(SpeechRecognition));
  }, []);

  /* ==========================================================
   * AUTO FOCUS
   * ========================================================== */

  useEffect(() => {
    if (!autoFocus || disabled) return;
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 60);
    return () => clearTimeout(timer);
  }, [autoFocus, disabled]);

  /* ==========================================================
   * KEYBOARD SHORTCUT (web)
   * ========================================================== */

  useEffect(() => {
    if (!isBrowser) return;

    const handleKeyboard = (event: KeyboardEvent) => {
      const modifier = event.metaKey || event.ctrlKey;

      if (modifier && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (!disabled) inputRef.current?.focus();
        return;
      }

      if (event.key === "Escape") {
        if (query) setQuery("");
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [disabled, query]);

  /* ==========================================================
   * SEARCH
   * ========================================================== */

  const submitSearch = useCallback(() => {
    const normalized = query.trim();
    if (!normalized || disabled) return;
    onSearch?.(normalized);
  }, [disabled, onSearch, query]);

  const clearSearch = useCallback(() => {
    setQuery("");
    inputRef.current?.focus();
  }, []);

  /* ==========================================================
   * VOICE SEARCH
   * ========================================================== */

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (disabled || !isBrowser) return;

    const SpeechRecognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    if (listening) {
      stopListening();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang =
      (typeof navigator !== "undefined" && navigator.language) || "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim() ?? "";
      if (!transcript) return;
      setQuery(transcript);
      onVoiceResult?.(transcript);
      onSearch?.(transcript);
    };

    recognition.onerror = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setListening(false);
      recognitionRef.current = null;
    }
  }, [disabled, listening, onSearch, onVoiceResult, stopListening]);

  /* ==========================================================
   * CLEANUP
   * ========================================================== */

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  /* ==========================================================
   * DERIVED
   * ========================================================== */

  const hasQuery = query.trim().length > 0;

  const containerBorderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(139,92,246,0.22)", "rgba(167,139,250,0.55)"],
  });
  const containerBg = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.055)", "rgba(255,255,255,0.085)"],
  });

  const bannerHeight = listeningAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 34],
  });
  const bannerOpacity = listeningAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const suggestionTranslateY = suggestionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-4, 0],
  });

  const micPulseScale = listeningPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.55],
  });
  const micPulseOpacity = listeningPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0],
  });

  const micHaloScale = micGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.7],
  });
  const micHaloOpacity = micGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0],
  });

  const shineTranslateX = shineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 400],
  });

  /* ==========================================================
   * RENDER
   * ========================================================== */

  return (
    <FadeUp distance={8}>
      <View style={[styles.root, className ? undefined : undefined]}>
        <View
          accessibilityRole="search"
          accessibilityLabel="Recherche DébrouillePro"
        >
          {/* ───── CONTAINER ───── */}
          <Animated.View
            style={[
              styles.container,
              {
                borderColor: containerBorderColor,
                backgroundColor: containerBg,
              },
            ]}
          >
            {/* Top highlight */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.topHighlight,
                {
                  opacity: focusAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.4, 0.95],
                  }),
                },
              ]}
            >
              <LinearGradient
                colors={[
                  "rgba(167,139,250,0)",
                  "rgba(167,139,250,0.85)",
                  "rgba(167,139,250,0)",
                ]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ flex: 1 }}
              />
            </Animated.View>

            {/* Focus ring glow */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.focusRing,
                {
                  opacity: focusAnim,
                  shadowColor: "#A78BFA",
                },
              ]}
            />

            {/* ─── ROW ─── */}
            <View style={styles.row}>
              {/* Animated search icon */}
              <AnimatedSearchIcon focused={focused} />

              {/* Input */}
              <TextInput
                ref={inputRef}
                value={query}
                autoComplete="off"
                placeholder={placeholder}
                placeholderTextColor="rgba(255,255,255,0.32)"
                onChangeText={setQuery}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onSubmitEditing={submitSearch}
                accessibilityLabel="Rechercher"
                style={styles.input}
                returnKeyType="search"
                editable={!disabled}
              />

              {/* Kbd hint (desktop web only) */}
              {Platform.OS === "web" && !focused && !hasQuery ? (
                <View style={styles.kbd}>
                  <Text style={styles.kbdText}>⌘</Text>
                  <Text style={styles.kbdText}>K</Text>
                </View>
              ) : null}

              {/* Clear */}
              {hasQuery ? (
                <Pressable
                  onPress={clearSearch}
                  accessibilityLabel="Effacer la recherche"
                  hitSlop={6}
                  style={({ pressed }) => [
                    styles.clearBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <X size={15} color="rgba(255,255,255,0.7)" />
                </Pressable>
              ) : null}

              {/* Voice */}
              {voiceSupported ? (
                <Pressable
                  onPress={startListening}
                  disabled={disabled}
                  accessibilityLabel={
                    listening
                      ? "Arrêter la recherche vocale"
                      : "Recherche vocale"
                  }
                  accessibilityState={{ selected: listening }}
                  hitSlop={4}
                  style={({ pressed }) => [
                    styles.micBtn,
                    listening && styles.micBtnListening,
                    pressed && { opacity: 0.85 },
                    disabled && { opacity: 0.4 },
                  ]}
                >
                  {/* Listening halo */}
                  {listening ? (
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        styles.micHalo,
                        {
                          opacity: micHaloOpacity,
                          transform: [{ scale: micHaloScale }],
                        },
                      ]}
                    />
                  ) : null}

                  {/* Listening pulse ring */}
                  {listening ? (
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        styles.micPulseRing,
                        {
                          opacity: micPulseOpacity,
                          transform: [{ scale: micPulseScale }],
                        },
                      ]}
                    />
                  ) : null}

                  {listening ? (
                    <MicOff size={15} color="#FCA5A5" strokeWidth={2.4} />
                  ) : (
                    <Mic size={15} color="#FFFFFF" strokeWidth={2.4} />
                  )}
                </Pressable>
              ) : null}

              {/* Submit */}
              <Pressable
                onPress={submitSearch}
                disabled={disabled || !hasQuery}
                accessibilityLabel="Lancer la recherche"
                hitSlop={4}
                style={({ pressed }) => [
                  styles.submitBtnWrap,
                  (!hasQuery || disabled) && styles.submitBtnDisabled,
                  pressed && hasQuery && !disabled && { opacity: 0.85 },
                ]}
              >
                <LinearGradient
                  colors={
                    hasQuery && !disabled
                      ? ["#A78BFA", "#7C3AED", "#6366F1"]
                      : ["#232132", "#181625"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitBtnGradient}
                >
                  {hasQuery && !disabled ? (
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        styles.submitShine,
                        {
                          transform: [
                            { translateX: shineTranslateX },
                            { skewX: "-20deg" },
                          ],
                        },
                      ]}
                    />
                  ) : null}
                  <Search
                    size={15}
                    color={
                      hasQuery && !disabled
                        ? "#FFFFFF"
                        : "rgba(255,255,255,0.3)"
                    }
                    strokeWidth={2.4}
                  />
                </LinearGradient>
              </Pressable>
            </View>

            {/* ─── LISTENING BANNER ─── */}
            <Animated.View
              style={[
                styles.banner,
                {
                  height: bannerHeight,
                  opacity: bannerOpacity,
                },
              ]}
            >
              <View style={styles.bannerContent}>
                <Animated.View
                  style={[
                    styles.bannerDot,
                    {
                      transform: [
                        {
                          scale: listeningPulse.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.3],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                <Text style={styles.bannerText}>Écoute en cours…</Text>
                <WaveformBars />
              </View>
            </Animated.View>
          </Animated.View>

          {/* ─── SUGGESTION HINT ─── */}
          <Animated.View
            style={[
              styles.suggestion,
              {
                opacity: suggestionAnim,
                transform: [{ translateY: suggestionTranslateY }],
              },
            ]}
            pointerEvents="none"
          >
            <Sparkles size={11} color="#C4B5FD" strokeWidth={2.4} />
            <Text style={styles.suggestionText}>
              Recherche intelligente dans l'écosystème DébrouillePro
            </Text>
          </Animated.View>
        </View>
      </View>
    </FadeUp>
  );
}

/* ============================================================
 * STYLES
 * ============================================================ */

const styles = StyleSheet.create({
  root: {
    marginHorizontal: 20,
    marginTop: 12,
  },

  /* ── Container ──────────────────────────────────── */
  container: {
    position: "relative",
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  topHighlight: {
    position: "absolute",
    top: 0,
    left: 32,
    right: 32,
    height: 1,
  },
  focusRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    minHeight: 54,
  },

  /* ── Animated search icon ───────────────────────── */
  searchIconWrap: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  searchIconHalo: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: "rgba(167,139,250,0.4)",
  },
  searchIconGradient: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  /* ── Input ──────────────────────────────────────── */
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 14,
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
  },

  /* ── Kbd hint ───────────────────────────────────── */
  kbd: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  kbdText: {
    fontSize: 9,
    fontWeight: "800",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 0.2,
  },

  /* ── Clear button ───────────────────────────────── */
  clearBtn: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  /* ── Mic button ─────────────────────────────────── */
  micBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.16)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.3)",
    overflow: "visible",
  },
  micBtnListening: {
    backgroundColor: "rgba(239,68,68,0.16)",
    borderColor: "rgba(248,113,113,0.4)",
  },
  micHalo: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(248,113,113,0.4)",
  },
  micPulseRing: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(248,113,113,0.65)",
  },

  /* ── Submit ─────────────────────────────────────── */
  submitBtnWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  submitBtnDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  submitShine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 60,
    backgroundColor: "rgba(255,255,255,0.28)",
    opacity: 0.7,
  },

  /* ── Listening banner ───────────────────────────── */
  banner: {
    overflow: "hidden",
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  bannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F87171",
    shadowColor: "#F87171",
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  bannerText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 0.2,
  },
  waveform: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginLeft: "auto",
    height: 20,
  },
  waveformBar: {
    width: 2.5,
    borderRadius: 2,
    backgroundColor: "#A78BFA",
  },

  /* ── Suggestion hint ────────────────────────────── */
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 8,
  },
  suggestionText: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 0.1,
  },
});
