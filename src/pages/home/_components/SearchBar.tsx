import { Text, View, TextInput, Pressable } from "react-native";
import { Mic, MicOff, Search, Sparkles, X } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";

/* ============================================================
 * TYPES
 * ============================================================ */

interface SearchBarProps {
  /**
   * Appelé lorsque l'utilisateur valide une recherche.
   *
   * Le composant ne connaît pas le backend :
   * le moteur de recherche réel est responsable du traitement.
   */
  onSearch?: (query: string) => void;

  /**
   * Permet au parent de récupérer directement
   * le résultat de la reconnaissance vocale.
   */
  onVoiceResult?: (query: string) => void;

  /**
   * Valeur initiale éventuelle.
   */
  initialValue?: string;

  /**
   * Placeholder personnalisable.
   */
  placeholder?: string;

  /**
   * Désactive complètement la recherche.
   */
  disabled?: boolean;

  /**
   * Focus automatique.
   */
  autoFocus?: boolean;

  /**
   * Classe supplémentaire.
   */
  className?: string;
}

/* ============================================================
 * SPEECH RECOGNITION
 * ============================================================ */

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
        results: ArrayLike<
          ArrayLike<{
            transcript: string;
          }>
        >;
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
 * COMPONENT
 * ============================================================ */

export default function SearchBar({
  onSearch,
  onVoiceResult,
  initialValue = "",
  placeholder = "Que recherchez-vous ?",
  disabled = false,
  autoFocus = false,
  className = "",
}: SearchBarProps) {
  const inputRef = useRef<TextInput>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const [query, setQuery] = useState(initialValue);
  const [focused, setFocused] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  /* ==========================================================
   * SPEECH SUPPORT
   * ========================================================== */

  useEffect(() => {
    if (typeof undefined === "undefined") {
      return;
    }

    const SpeechRecognition =
      undefined ?? undefined;

    setVoiceSupported(Boolean(SpeechRecognition));
  }, []);

  /* ==========================================================
   * AUTO FOCUS
   * ========================================================== */

  useEffect(() => {
    if (!autoFocus || disabled) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [autoFocus, disabled]);

  /* ==========================================================
   * KEYBOARD SHORTCUT
   * ========================================================== */

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      const modifier = event.metaKey || event.ctrlKey;

      if (modifier && event.key.toLowerCase() === "k") {
        if (!disabled) {
          inputRef.current?.focus();
        }
      }

      if (event.key === "Escape") {
        if (undefined === inputRef.current) {
          inputRef.current?.blur();
        }

        if (query) {
          setQuery("");
        }
      }
    };

    undefined;

    return () => {
      undefined;
    };
  }, [disabled, query]);

  /* ==========================================================
   * SEARCH
   * ========================================================== */

  const submitSearch = useCallback(() => {
    const normalizedQuery = query.trim();

    if (!normalizedQuery || disabled) {
      return;
    }

    onSearch?.(normalizedQuery);
  }, [disabled, onSearch, query]);

  const handleSubmit = (event: string) => {
    submitSearch();
  };

  /* ==========================================================
   * CLEAR
   * ========================================================== */

  const clearSearch = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  /* ==========================================================
   * VOICE SEARCH
   * ========================================================== */

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (disabled) {
      return;
    }

    const SpeechRecognition =
      undefined ?? undefined;

    if (!SpeechRecognition) {
      return;
    }

    if (listening) {
      stopListening();
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en" || "fr-FR";

    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim() ?? "";

      if (!transcript) {
        return;
      }

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
   * UI
   * ========================================================== */

  return (
    <View
      className={`mx-5 mt-3 ${className}`}
    >
      <View
       
        accessibilityRole="search"
        accessibilityLabel="Recherche DébrouillePro"
      >
        <View
          className="relative overflow-hidden rounded-[22px]"
          style={{ backgroundColor: focused
                        ? "rgba(255,255,255,0.105)"
                        : "rgba(255,255,255,0.065)", borderColor: "rgba(139,92,246,0.48)", borderStyle: "solid" }}
        >
          {/* ==================================================
              PREMIUM LIGHT
              ================================================== */}

          <View
            accessibilityElementsHidden={true}
            className="absolute inset-x-8 top-0 h-px"
            style={{  }}
          />

          {/* ==================================================
              CONTENT
              ================================================== */}

          <View className="relative flex min-h-[54px] items-center gap-3 px-4">
            {/* Search icon */}

            <View
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: focused
                                ? "rgba(139,92,246,0.14)"
                                : "rgba(255,255,255,0.045)" }}
            >
              <Search
                size={17}
                strokeWidth={2}
                className={focused ? "text-violet-300" : "text-white/40"}
              />
            </View>

            {/* Input */}

            <TextInput
              ref={inputRef}
              value={query}
              disabled={disabled}
              autoComplete="off"
              spellCheck={false}
              placeholder={placeholder}
              onChangeText={(text) => setQuery(text)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              accessibilityLabel="Rechercher"
              className="min-w-0 flex-1 bg-transparent py-3 text-sm font-medium text-white outline-none placeholder:text-white/35" returnKeyType="search"
            />

            {/* Keyboard shortcut */}

            {!focused && !query && (
              <View
                className="hidden items-center gap-1 rounded-lg px-2 py-1 sm:flex"
                style={{ backgroundColor: "rgba(255,255,255,0.045)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}
              >
                <Text className="text-[9px] font-medium text-white/30"><Text>⌘</Text></Text>

                <Text className="text-[9px] font-medium text-white/30"><Text>K</Text></Text>
              </View>
            )}

            {/* Clear */}

            <>
              {query.length > 0 && (
                <Pressable
                  type="button"
                  onPress={clearSearch}
                  accessibilityLabel="Effacer la recherche"
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-white/45"
                >
                  <X size={15} />
                </Pressable>
              )}
            </>

            {/* Voice */}

            {voiceSupported && (
              <Pressable
                type="button"
                onPress={startListening}
                disabled={disabled}
                accessibilityLabel={
                  listening ? "Arrêter la recherche vocale" : "Recherche vocale"
                }
                aria-pressed={listening}
                className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl disabled:cursor-not-allowed disabled:opacity-40"
                style={{  }}
              >
                {listening && (
                  <Text
                    accessibilityElementsHidden={true}
                    className="absolute inset-0 rounded-xl border border-red-400/50"
                  />
                )}

                {listening ? (
                  <MicOff size={15} className="relative z-10 text-red-300" />
                ) : (
                  <Mic size={15} className="relative z-10 text-white" />
                )}
              </Pressable>
            )}

            {/* Search submit */}

            <Pressable
              type="submit"
              disabled={disabled || query.trim().length === 0}
              accessibilityLabel="Lancer la recherche"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl disabled:cursor-not-allowed disabled:opacity-35"
              style={{  }}
            >
              <Search size={15} strokeWidth={2.4} className="text-white" />
            </Pressable>
          </View>

          {/* ==================================================
              VOICE STATUS
              ================================================== */}

          <>
            {listening && (
              <View
                className="flex items-center gap-2 overflow-hidden px-4"
              >
                <Text
                  className="h-1.5 w-1.5 rounded-full bg-red-400"
                />

                <Text className="text-[10px] font-medium text-white/45">
                  <Text>Écoute en cours…</Text></Text>

                <View className="ml-auto flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((bar) => (
                    <Text
                      key={bar}
                      className="w-0.5 rounded-full bg-violet-400/70"
                    />
                  ))}
                </View>
              </View>
            )}
          </>
        </View>

        {/* ====================================================
            AI SEARCH HINT
            ==================================================== */}

        <>
          {focused && !query && (
            <View
              className="mt-2 flex items-center gap-1.5 px-2"
            >
              <Sparkles size={11} className="text-violet-400" />

              <Text className="text-[10px] text-white/30">
                <Text>Recherche intelligente dans l’écosystème DébrouillePro</Text></Text>
            </View>
          )}
        </>
      </View>
    </View>
  );
}
