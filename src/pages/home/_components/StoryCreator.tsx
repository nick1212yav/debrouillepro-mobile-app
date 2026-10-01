// src/pages/home/_components/StoryCreator.tsx

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
  Image as RNImage,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";

import {
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  ImagePlus,
  Plus,
  Sparkles,
  Type,
  Upload,
  X,
  Zap,
} from "lucide-react-native";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";

import type { StorySlide } from "./StoryViewer";

/* ============================================================
 * CONSTANTS
 * ============================================================
 * Les clés de `TEXT_GRADIENTS` DOIVENT rester synchronisées avec
 * `TEXT_GRADIENTS_MAP` dans `Stories.tsx`.
 * Elles sont envoyées telles quelles comme `backgroundKey` à Convex.
 */

const TEXT_GRADIENTS = [
  {
    key: "purple",
    colors: ["#667EEA", "#764BA2"],
    solid: "#667EEA",
  },
  {
    key: "pink",
    colors: ["#F093FB", "#F5576C"],
    solid: "#F093FB",
  },
  {
    key: "cyan",
    colors: ["#4FACFE", "#00F2FE"],
    solid: "#4FACFE",
  },
  {
    key: "green",
    colors: ["#43E97B", "#38F9D7"],
    solid: "#43E97B",
  },
  {
    key: "peach",
    colors: ["#FA709A", "#FEE140"],
    solid: "#FA709A",
  },
  {
    key: "violet",
    colors: ["#A18CD1", "#FBC2EB"],
    solid: "#A18CD1",
  },
  {
    key: "sand",
    colors: ["#FFECD2", "#FCB69F"],
    solid: "#FFECD2",
  },
  {
    key: "dark",
    colors: ["#0A0A1A", "#1A1A3E"],
    solid: "#0A0A1A",
  },
] as const;

const TEXT_COLORS = [
  "#FFFFFF",
  "#FFE566",
  "#FF6B6B",
  "#69FF94",
  "#69B8FF",
  "#E879F9",
];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

/* Contraintes alignées sur convex/stories.ts v2.1 */
const MAX_TEXT_CONTENT_LENGTH = 500;
const MAX_CAPTION_LENGTH = 500;
const MAX_POLL_QUESTION_LENGTH = 200;
const MIN_POLL_OPTIONS = 2;
const MAX_POLL_OPTIONS = 4; // UI bornée à 4, backend accepte jusqu'à 6

type StepType = "pick" | "text" | "image" | "poll";

/* ============================================================
 * TYPES
 * ============================================================ */

interface StoryCreatorProps {
  onClose: () => void;

  onPublish: (
    slide: Omit<
      StorySlide,
      "id" | "authorName" | "authorAvatar" | "authorGradient" | "time"
    >,
  ) => void;
}

interface CreationType {
  type: Exclude<StepType, "pick">;
  label: string;
  description: string;
  icon: React.ComponentType<{
    size?: number;
    color?: string;
  }>;
  color: string;
  gradient: readonly [string, string];
}

/* ============================================================
 * CREATION TYPES
 * ============================================================ */

const CREATION_TYPES: CreationType[] = [
  {
    type: "text",
    label: "Story texte",
    description: "Une idée, une annonce ou un message.",
    icon: Type,
    color: "#A78BFA",
    gradient: ["#A78BFA", "#7C3AED"],
  },
  {
    type: "image",
    label: "Photo",
    description: "Partagez un moment depuis votre appareil.",
    icon: ImageIcon,
    color: "#60A5FA",
    gradient: ["#60A5FA", "#3B82F6"],
  },
  {
    type: "poll",
    label: "Sondage",
    description: "Faites participer votre communauté.",
    icon: BarChart3,
    color: "#F472B6",
    gradient: ["#F472B6", "#EC4899"],
  },
];

/* ============================================================
 * HELPERS
 * ============================================================ */

function isValidHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

function normalizeMimeType(mimeType?: string | null): string {
  return mimeType?.trim().toLowerCase() || "image/jpeg";
}

/* ============================================================
 * ANIMATION HELPERS
 * ============================================================ */

function FadeUp({
  delay = 0,
  distance = 12,
  children,
  style,
}: {
  delay?: number;
  distance?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(anim, {
      toValue: 1,
      duration: 460,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start();

    return () => {
      animation.stop();
    };
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
 * PROGRESS
 * ============================================================ */

function AnimatedProgress({ value }: { value: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.min(1, Math.max(0, value)),
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [value, anim]);

  const width = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const isHigh = value > 0.9;

  return (
    <View style={styles.progressTrack}>
      <Animated.View
        style={[
          styles.progressFill,
          {
            width,
            backgroundColor: isHigh ? "#FB7185" : "#A78BFA",
          },
        ]}
      />
    </View>
  );
}

/* ============================================================
 * SPARKLE
 * ============================================================ */

function PulsingSparkle({ size = 15 }: { size?: number }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  return (
    <Animated.View
      style={{
        transform: [{ scale }],
        opacity,
      }}
    >
      <Sparkles size={size} color="#C4B5FD" strokeWidth={2.4} />
    </Animated.View>
  );
}

/* ============================================================
 * PUBLISH BUTTON
 * ============================================================ */

function PublishButton({
  disabled,
  loading,
  onPress,
  label,
  colors,
}: {
  disabled: boolean;
  loading: boolean;
  onPress: () => void;
  label: string;
  colors: readonly [string, string];
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const shine = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!disabled && !loading) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(shine, {
            toValue: 1,
            duration: 2200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(1800),
          Animated.timing(shine, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );

      animation.start();

      return () => {
        animation.stop();
      };
    }

    shine.setValue(0);

    return undefined;
  }, [disabled, loading, shine]);

  const onPressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 40,
    }).start();
  }, [scale]);

  const onPressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
    }).start();
  }, [scale]);

  const shineTranslateX = shine.interpolate({
    inputRange: [0, 1],
    outputRange: [-140, 460],
  });

  return (
    <Animated.View
      style={{
        transform: [{ scale }],
      }}
    >
      <Pressable
        disabled={disabled}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[styles.publishOuter, disabled && styles.publishOuterDisabled]}
      >
        <LinearGradient
          colors={
            disabled
              ? ["#232132", "#181625"]
              : [colors[0], colors[1], colors[0]]
          }
          start={{
            x: 0,
            y: 0,
          }}
          end={{
            x: 1,
            y: 1,
          }}
          style={styles.publishGradient}
        >
          {!disabled && !loading ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.publishShine,
                {
                  transform: [
                    {
                      translateX: shineTranslateX,
                    },
                    {
                      skewX: "-20deg",
                    },
                  ],
                },
              ]}
            />
          ) : null}

          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Sparkles
              size={15}
              color={disabled ? "rgba(255,255,255,0.4)" : "#fff"}
              strokeWidth={2.4}
            />
          )}

          <Text
            style={[
              styles.publishText,
              disabled && {
                color: "rgba(255,255,255,0.4)",
              },
            ]}
          >
            {loading ? "Publication en cours…" : label}
          </Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================
 * MAIN COMPONENT
 * ============================================================ */

export default function StoryCreator({
  onClose,
  onPublish,
}: StoryCreatorProps) {
  const [step, setStep] = useState<StepType>("pick");

  const [text, setText] = useState("");

  const [textColor, setTextColor] = useState("#FFFFFF");

  const [bgIndex, setBgIndex] = useState(0);

  /**
   * Storage ID Convex — envoyé au backend via `mediaUrl`.
   * Jamais exposé à l'UI.
   */
  const [imgStorageId, setImgStorageId] = useState("");

  /**
   * URI locale — uniquement pour l'aperçu immédiat dans le créateur.
   */
  const [imgPreviewUrl, setImgPreviewUrl] = useState("");

  const [imgCaption, setImgCaption] = useState("");

  const [pollQ, setPollQ] = useState("");

  const [pollOpts, setPollOpts] = useState(["", ""]);

  const [uploading, setUploading] = useState(false);

  const [publishing, setPublishing] = useState(false);

  const generateUploadUrl = useMutation(api.stories.generateStoryUploadUrl);

  const createStory = useMutation(api.stories.createStory);

  const bg = TEXT_GRADIENTS[bgIndex];

  const validPollOptions = useMemo(
    () => pollOpts.map((o) => o.trim()).filter(Boolean),
    [pollOpts],
  );

  const canPublish = useMemo(() => {
    if (uploading || publishing) {
      return false;
    }

    if (step === "text") {
      return text.trim().length > 0;
    }

    if (step === "image") {
      return imgStorageId.length > 0;
    }

    if (step === "poll") {
      return (
        pollQ.trim().length > 0 && validPollOptions.length >= MIN_POLL_OPTIONS
      );
    }

    return false;
  }, [
    uploading,
    publishing,
    step,
    text,
    imgStorageId,
    pollQ,
    validPollOptions,
  ]);

  /* ============================================================
   * IMAGE PICKER + UPLOAD
   * ============================================================ */

  const pickImage = useCallback(async () => {
    if (uploading || publishing) {
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission refusée", "Autorisez l'accès à votre galerie.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,

      quality: 0.85,

      allowsEditing: false,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const asset = result.assets[0];

    if (!asset.uri) {
      Alert.alert("Erreur", "Impossible de récupérer cette image.");
      return;
    }

    if (asset.fileSize && asset.fileSize > MAX_IMAGE_SIZE) {
      Alert.alert(
        "Image trop volumineuse",
        "La taille maximale autorisée est de 10 Mo.",
      );
      return;
    }

    const mimeType = normalizeMimeType(asset.mimeType);

    if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
      Alert.alert(
        "Format non supporté",
        "Utilisez une image JPG, PNG ou WEBP.",
      );
      return;
    }

    /**
     * Reset du média précédent.
     */
    setImgStorageId("");
    setImgPreviewUrl(asset.uri);

    setUploading(true);

    try {
      /**
       * 1. Génération de l'URL d'upload Convex.
       */
      const uploadUrl = await generateUploadUrl();

      if (!uploadUrl || !isValidHttpUrl(uploadUrl)) {
        throw new Error("URL d'upload Convex invalide.");
      }

      /**
       * 2. Conversion de l'URI Expo en Blob.
       */
      const blobResponse = await fetch(asset.uri);

      if (!blobResponse.ok) {
        throw new Error(
          `Impossible de lire l'image locale (${blobResponse.status}).`,
        );
      }

      const blob = await blobResponse.blob();

      if (!blob.size) {
        throw new Error("Le fichier image est vide.");
      }

      if (blob.size > MAX_IMAGE_SIZE) {
        throw new Error("Le fichier dépasse la taille maximale de 10 Mo.");
      }

      /**
       * 3. Upload réel vers Convex Storage.
       */
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": mimeType,
        },
        body: blob,
      });

      if (!response.ok) {
        throw new Error(`Upload Convex échoué (${response.status}).`);
      }

      /**
       * 4. Convex retourne { storageId }.
       */
      const data = (await response.json()) as {
        storageId?: string;
      };

      const storageId = data.storageId?.trim();

      if (!storageId) {
        throw new Error("Convex n'a retourné aucun storageId.");
      }

      setImgStorageId(storageId);

      Alert.alert("Photo prête", "Votre photo a été envoyée avec succès.");
    } catch (error) {
      console.error("[StoryCreator] image upload error:", error);

      setImgStorageId("");
      setImgPreviewUrl("");

      const message =
        error instanceof Error
          ? error.message
          : "Impossible d'envoyer la photo.";

      Alert.alert("Erreur d'upload", message);
    } finally {
      setUploading(false);
    }
  }, [uploading, publishing, generateUploadUrl]);

  /* ============================================================
   * IMAGE RESET
   * ============================================================ */

  const removeImage = useCallback(() => {
    setImgStorageId("");
    setImgPreviewUrl("");
    setImgCaption("");
  }, []);

  /* ============================================================
   * POLL
   * ============================================================ */

  const addPollOption = useCallback(() => {
    setPollOpts((current) =>
      current.length >= MAX_POLL_OPTIONS ? current : [...current, ""],
    );
  }, []);

  const updatePollOption = useCallback((index: number, value: string) => {
    setPollOpts((current) =>
      current.map((opt, i) => (i === index ? value : opt)),
    );
  }, []);

  const removePollOption = useCallback((index: number) => {
    setPollOpts((current) => {
      if (current.length <= MIN_POLL_OPTIONS) {
        return current;
      }

      return current.filter((_, i) => i !== index);
    });
  }, []);

  /* ============================================================
   * RESET
   * ============================================================ */

  const resetCreator = useCallback(() => {
    setStep("pick");

    setText("");

    setTextColor("#FFFFFF");

    setBgIndex(0);

    removeImage();

    setPollQ("");

    setPollOpts(["", ""]);

    setPublishing(false);
  }, [removeImage]);

  /* ============================================================
   * PUBLISH
   * ============================================================
   * Chaque branche envoie EXACTEMENT le contrat attendu par
   * convex/stories.ts v2.1 :
   *
   *   TEXT  → storyType "text",  textContent, backgroundKey, textColor
   *   IMAGE → storyType "image", mediaUrl (storageId), mediaType "image"
   *   POLL  → storyType "poll",  pollQuestion, pollOptions
   *
   * Aucun préfixe `data:text/` ou `poll:` n'est plus jamais envoyé.
   */

  const publish = useCallback(async () => {
    if (!canPublish) {
      return;
    }

    setPublishing(true);

    try {
      /* ─────────────────────────────
       * TEXT
       * ───────────────────────────── */

      if (step === "text") {
        const cleanText = text.trim();

        if (!cleanText) {
          Alert.alert("Erreur", "Écrivez un message avant de publier.");
          return;
        }

        await createStory({
          storyType: "text",
          textContent: cleanText,
          backgroundKey: bg.key,
          textColor,
        });

        onPublish({
          type: "text",
          bg: `linear-gradient(135deg, ${bg.colors[0]}, ${bg.colors[1]})`,
          text: cleanText,
          textColor,
        });

        Alert.alert("Succès", "Story publiée.");

        resetCreator();
        return;
      }

      /* ─────────────────────────────
       * IMAGE
       * ───────────────────────────── */

      if (step === "image") {
        const storageId = imgStorageId.trim();

        if (!storageId) {
          Alert.alert("Erreur", "Ajoutez une photo avant de publier.");
          return;
        }

        const cleanCaption = imgCaption.trim();

        await createStory({
          storyType: "image",
          mediaUrl: storageId,
          mediaType: "image",
          caption: cleanCaption.length > 0 ? cleanCaption : undefined,
        });

        /**
         * On envoie l'URI locale au parent pour un rendu immédiat.
         * Le feed Convex remplacera cette entrée à la prochaine
         * souscription avec la vraie URL `https://...`.
         */
        onPublish({
          type: "image",
          bg: "#000",
          img: imgPreviewUrl,
          text: cleanCaption.length > 0 ? cleanCaption : undefined,
        });

        Alert.alert("Succès", "Photo publiée.");

        resetCreator();
        return;
      }

      /* ─────────────────────────────
       * POLL
       * ───────────────────────────── */

      if (step === "poll") {
        const question = pollQ.trim();

        if (!question || validPollOptions.length < MIN_POLL_OPTIONS) {
          Alert.alert(
            "Erreur",
            "Ajoutez une question et au moins deux options.",
          );
          return;
        }

        /**
         * ⚠️ C'EST LE FIX CLÉ :
         * les options sont réellement envoyées à Convex.
         * Le backend les valide (2 à 6) et les persiste.
         */
        await createStory({
          storyType: "poll",
          pollQuestion: question,
          pollOptions: validPollOptions,
        });

        onPublish({
          type: "poll",
          bg: `linear-gradient(135deg, ${TEXT_GRADIENTS[7].colors[0]}, ${TEXT_GRADIENTS[7].colors[1]})`,
          pollQuestion: question,
          pollOptions: validPollOptions,
        });

        Alert.alert("Succès", "Sondage publié.");

        resetCreator();
      }
    } catch (error) {
      console.error("[StoryCreator] publication error:", error);

      Alert.alert(
        "Erreur",
        error instanceof Error ? error.message : "La publication a échoué.",
      );
    } finally {
      setPublishing(false);
    }
  }, [
    canPublish,
    step,
    text,
    bg,
    textColor,
    imgStorageId,
    imgPreviewUrl,
    imgCaption,
    pollQ,
    validPollOptions,
    createStory,
    onPublish,
    resetCreator,
  ]);

  /* ============================================================
   * CLOSE / BACK
   * ============================================================ */

  const handleClose = useCallback(() => {
    if (uploading || publishing) {
      return;
    }

    onClose();
  }, [uploading, publishing, onClose]);

  const handleBack = useCallback(() => {
    if (step !== "pick") {
      setStep("pick");
      return;
    }

    handleClose();
  }, [step, handleClose]);

  /* ============================================================
   * RENDER
   * ============================================================ */

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable onPress={handleClose} style={styles.backdrop} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.kavWrapper}
          keyboardVerticalOffset={0}
        >
          <View style={styles.sheet}>
            <LinearGradient
              colors={["#0C0A1F", "#08061A", "#050513"]}
              locations={[0, 0.5, 1]}
              start={{
                x: 0,
                y: 0,
              }}
              end={{
                x: 1,
                y: 1,
              }}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.orbTop} pointerEvents="none" />

            <View style={styles.orbBottom} pointerEvents="none" />

            <View style={styles.sheetBorder} pointerEvents="none" />

            <View style={styles.handleWrap}>
              <View style={styles.handleBar} />
            </View>

            {/* HEADER */}

            <View style={styles.header}>
              <View style={styles.headerRow}>
                <Pressable
                  disabled={uploading || publishing}
                  onPress={handleBack}
                  hitSlop={6}
                  style={({ pressed }) => [
                    styles.iconBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  {step === "pick" ? (
                    <X size={18} color="rgba(255,255,255,0.85)" />
                  ) : (
                    <ChevronLeft size={18} color="rgba(255,255,255,0.85)" />
                  )}
                </Pressable>

                <View style={styles.headerCenter}>
                  <View style={styles.headerTitleRow}>
                    <PulsingSparkle />

                    <Text style={styles.headerTitle}>Créer une story</Text>
                  </View>

                  <Text style={styles.headerSubtitle}>
                    Partagez ce qui compte.
                  </Text>
                </View>

                <View style={styles.headerRight}>
                  {step !== "pick" ? (
                    <View style={styles.stepBadge}>
                      <Text style={styles.stepBadgeText}>
                        {step === "text"
                          ? "TEXTE"
                          : step === "image"
                            ? "PHOTO"
                            : "SONDAGE"}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            {/* CONTENT */}

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={
                Platform.OS === "ios" ? "interactive" : "on-drag"
              }
              nestedScrollEnabled={Platform.OS === "android"}
              showsVerticalScrollIndicator={false}
            >
              {/* PICK */}

              {step === "pick" ? (
                <View>
                  <FadeUp>
                    <View style={styles.pickHeader}>
                      <LinearGradient
                        colors={[
                          "rgba(167,139,250,0.32)",
                          "rgba(99,102,241,0.08)",
                        ]}
                        start={{
                          x: 0,
                          y: 0,
                        }}
                        end={{
                          x: 1,
                          y: 1,
                        }}
                        style={styles.zapCircle}
                      >
                        <Zap size={24} color="#C4B5FD" strokeWidth={2.4} />
                      </LinearGradient>

                      <Text style={styles.pickTitle}>
                        Qu'avez-vous envie de partager ?
                      </Text>

                      <Text style={styles.pickSubtitle}>
                        Créez quelque chose qui attire l'attention, raconte une
                        histoire et fait participer votre communauté.
                      </Text>
                    </View>
                  </FadeUp>

                  <View style={styles.creationTypesList}>
                    {CREATION_TYPES.map((option, index) => {
                      const Icon = option.icon;

                      return (
                        <FadeUp
                          key={option.type}
                          delay={120 + index * 80}
                          distance={14}
                        >
                          <Pressable
                            onPress={() => setStep(option.type)}
                            style={({ pressed }) => [
                              styles.creationCard,
                              pressed && styles.pressed,
                            ]}
                          >
                            <LinearGradient
                              colors={[
                                `${option.color}14`,
                                "rgba(255,255,255,0)",
                              ]}
                              start={{
                                x: 0,
                                y: 0,
                              }}
                              end={{
                                x: 1,
                                y: 1,
                              }}
                              style={StyleSheet.absoluteFill}
                            />

                            <LinearGradient
                              colors={option.gradient}
                              start={{
                                x: 0,
                                y: 0,
                              }}
                              end={{
                                x: 1,
                                y: 1,
                              }}
                              style={styles.creationIconWrap}
                            >
                              <Icon size={20} color="#fff" strokeWidth={2.2} />
                            </LinearGradient>

                            <View style={styles.creationTextColumn}>
                              <Text style={styles.creationLabel}>
                                {option.label}
                              </Text>

                              <Text style={styles.creationDescription}>
                                {option.description}
                              </Text>
                            </View>

                            <View
                              style={[
                                styles.chevronCircle,
                                {
                                  backgroundColor: `${option.color}22`,
                                },
                              ]}
                            >
                              <ChevronRight
                                size={16}
                                color={option.color}
                                strokeWidth={2.4}
                              />
                            </View>
                          </Pressable>
                        </FadeUp>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              {/* TEXT */}

              {step === "text" ? (
                <View style={styles.stepContent}>
                  <FadeUp distance={10}>
                    <View style={styles.storyPreviewWrapper}>
                      <LinearGradient
                        colors={bg.colors}
                        start={{
                          x: 0,
                          y: 0,
                        }}
                        end={{
                          x: 1,
                          y: 1,
                        }}
                        style={styles.storyPreview}
                      >
                        <View style={styles.storyPreviewInner}>
                          <Text
                            style={[
                              styles.storyPreviewText,
                              {
                                color: textColor,
                              },
                            ]}
                            numberOfLines={8}
                          >
                            {text || "Votre idée mérite d'être vue."}
                          </Text>
                        </View>
                      </LinearGradient>
                    </View>
                  </FadeUp>

                  <FadeUp delay={80}>
                    <View>
                      <Text style={styles.fieldLabel}>Votre message</Text>

                      <TextInput
                        value={text}
                        onChangeText={setText}
                        maxLength={MAX_TEXT_CONTENT_LENGTH}
                        autoFocus
                        placeholder="Écrivez quelque chose qui mérite d'être partagé…"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        multiline
                        textAlignVertical="top"
                        style={[styles.input, styles.textArea]}
                      />

                      <View style={styles.counterRow}>
                        <AnimatedProgress
                          value={text.length / MAX_TEXT_CONTENT_LENGTH}
                        />

                        <Text
                          style={[
                            styles.counterText,
                            text.length > MAX_TEXT_CONTENT_LENGTH * 0.9 && {
                              color: "#FB7185",
                            },
                          ]}
                        >
                          {text.length}/{MAX_TEXT_CONTENT_LENGTH}
                        </Text>
                      </View>
                    </View>
                  </FadeUp>

                  <FadeUp delay={140}>
                    <View>
                      <Text style={styles.fieldLabel}>Ambiance</Text>

                      <View style={styles.swatchesRow}>
                        {TEXT_GRADIENTS.map((gradient, index) => {
                          const selected = bgIndex === index;

                          return (
                            <Pressable
                              key={gradient.key}
                              onPress={() => setBgIndex(index)}
                              style={styles.swatchOuter}
                            >
                              <LinearGradient
                                colors={gradient.colors}
                                start={{
                                  x: 0,
                                  y: 0,
                                }}
                                end={{
                                  x: 1,
                                  y: 1,
                                }}
                                style={[
                                  styles.swatch,
                                  selected && styles.swatchSelected,
                                ]}
                              >
                                {selected ? (
                                  <Check
                                    size={13}
                                    color="#fff"
                                    strokeWidth={3.5}
                                  />
                                ) : null}
                              </LinearGradient>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  </FadeUp>

                  <FadeUp delay={200}>
                    <View>
                      <Text style={styles.fieldLabel}>Couleur du texte</Text>

                      <View style={styles.swatchesRow}>
                        {TEXT_COLORS.map((color) => {
                          const selected = textColor === color;

                          return (
                            <Pressable
                              key={color}
                              onPress={() => setTextColor(color)}
                              style={[
                                styles.colorSwatch,
                                {
                                  backgroundColor: color,
                                },
                                selected && styles.swatchSelected,
                              ]}
                            >
                              {selected ? (
                                <Check
                                  size={11}
                                  color={color === "#FFFFFF" ? "#000" : "#fff"}
                                  strokeWidth={3.5}
                                />
                              ) : null}
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  </FadeUp>

                  <FadeUp delay={260}>
                    <PublishButton
                      disabled={!canPublish}
                      loading={publishing}
                      onPress={publish}
                      label="Publier la story"
                      colors={["#A78BFA", "#7C3AED"]}
                    />
                  </FadeUp>
                </View>
              ) : null}

              {/* IMAGE */}

              {step === "image" ? (
                <View style={styles.stepContent}>
                  <FadeUp distance={10}>
                    <View style={styles.storyPreviewWrapper}>
                      <View style={styles.storyPreview}>
                        {imgPreviewUrl ? (
                          <>
                            <RNImage
                              source={{
                                uri: imgPreviewUrl,
                              }}
                              style={styles.previewImage}
                              resizeMode="cover"
                              accessibilityLabel="Aperçu de la photo"
                            />

                            <LinearGradient
                              colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.7)"]}
                              start={{
                                x: 0,
                                y: 0,
                              }}
                              end={{
                                x: 0,
                                y: 1,
                              }}
                              style={styles.imageOverlay}
                              pointerEvents="none"
                            />

                            <View style={styles.imageOverlayContent}>
                              <Text style={styles.imageOverlayText}>
                                {imgCaption || "Votre story"}
                              </Text>
                            </View>

                            <Pressable
                              onPress={removeImage}
                              disabled={uploading || publishing}
                              hitSlop={6}
                              style={({ pressed }) => [
                                styles.removeImageButton,
                                pressed && {
                                  opacity: 0.75,
                                },
                              ]}
                            >
                              <X size={16} color="#fff" />
                            </Pressable>

                            {uploading ? (
                              <View style={styles.uploadingOverlay}>
                                <ActivityIndicator size="small" color="#fff" />

                                <Text style={styles.uploadingText}>
                                  Envoi sécurisé…
                                </Text>
                              </View>
                            ) : null}
                          </>
                        ) : (
                          <Pressable
                            onPress={pickImage}
                            style={styles.dropZone}
                          >
                            <LinearGradient
                              colors={[
                                "rgba(96,165,250,0.24)",
                                "rgba(59,130,246,0.08)",
                              ]}
                              start={{
                                x: 0,
                                y: 0,
                              }}
                              end={{
                                x: 1,
                                y: 1,
                              }}
                              style={styles.dropZoneIcon}
                            >
                              {uploading ? (
                                <ActivityIndicator
                                  size="small"
                                  color="#93C5FD"
                                />
                              ) : (
                                <ImagePlus size={25} color="#93C5FD" />
                              )}
                            </LinearGradient>

                            <Text style={styles.dropZoneTitle}>
                              {uploading
                                ? "Envoi sécurisé…"
                                : "Ajouter une photo"}
                            </Text>

                            <Text style={styles.dropZoneSubtitle}>
                              JPG, PNG, WEBP · 10 Mo max.
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  </FadeUp>

                  <FadeUp delay={80}>
                    <Pressable
                      disabled={uploading || publishing}
                      onPress={pickImage}
                      style={({ pressed }) => [
                        styles.chooseButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <LinearGradient
                        colors={[
                          "rgba(59,130,246,0.14)",
                          "rgba(59,130,246,0.04)",
                        ]}
                        start={{
                          x: 0,
                          y: 0,
                        }}
                        end={{
                          x: 1,
                          y: 1,
                        }}
                        style={StyleSheet.absoluteFill}
                      />

                      <LinearGradient
                        colors={["#60A5FA", "#3B82F6"]}
                        start={{
                          x: 0,
                          y: 0,
                        }}
                        end={{
                          x: 1,
                          y: 1,
                        }}
                        style={styles.chooseButtonIcon}
                      >
                        {uploading ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Upload size={18} color="#fff" strokeWidth={2.4} />
                        )}
                      </LinearGradient>

                      <View
                        style={{
                          flex: 1,
                        }}
                      >
                        <Text style={styles.chooseButtonTitle}>
                          {imgPreviewUrl
                            ? "Changer la photo"
                            : "Choisir depuis l'appareil"}
                        </Text>

                        <Text style={styles.chooseButtonSubtitle}>
                          Votre fichier est envoyé vers Convex Storage.
                        </Text>
                      </View>

                      <ChevronRight size={15} color="rgba(255,255,255,0.35)" />
                    </Pressable>
                  </FadeUp>

                  <FadeUp delay={140}>
                    <View>
                      <Text style={styles.fieldLabel}>Légende</Text>

                      <TextInput
                        value={imgCaption}
                        onChangeText={setImgCaption}
                        maxLength={MAX_CAPTION_LENGTH}
                        placeholder="Ajoutez un contexte à votre photo…"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        style={styles.input}
                      />
                    </View>
                  </FadeUp>

                  <FadeUp delay={200}>
                    <PublishButton
                      disabled={!canPublish}
                      loading={publishing}
                      onPress={publish}
                      label="Publier la photo"
                      colors={["#60A5FA", "#3B82F6"]}
                    />
                  </FadeUp>
                </View>
              ) : null}

              {/* POLL */}

              {step === "poll" ? (
                <View style={styles.stepContent}>
                  <FadeUp distance={10}>
                    <View style={styles.storyPreviewWrapper}>
                      <LinearGradient
                        colors={["#0A0A1A", "#1A1A3E"]}
                        start={{
                          x: 0,
                          y: 0,
                        }}
                        end={{
                          x: 1,
                          y: 1,
                        }}
                        style={[styles.storyPreview, styles.pollPreview]}
                      >
                        <LinearGradient
                          colors={[
                            "rgba(244,114,182,0.32)",
                            "rgba(236,72,153,0.08)",
                          ]}
                          start={{
                            x: 0,
                            y: 0,
                          }}
                          end={{
                            x: 1,
                            y: 1,
                          }}
                          style={styles.pollPreviewIcon}
                        >
                          <BarChart3
                            size={24}
                            color="#F9A8D4"
                            strokeWidth={2.4}
                          />
                        </LinearGradient>

                        <Text style={styles.pollPreviewQuestion}>
                          {pollQ || "Votre question apparaîtra ici"}
                        </Text>

                        {validPollOptions.length > 0 ? (
                          validPollOptions.map((opt) => (
                            <View key={opt} style={styles.pollPreviewOption}>
                              <LinearGradient
                                colors={[
                                  "rgba(244,114,182,0.18)",
                                  "rgba(236,72,153,0.08)",
                                ]}
                                start={{
                                  x: 0,
                                  y: 0,
                                }}
                                end={{
                                  x: 1,
                                  y: 0,
                                }}
                                style={StyleSheet.absoluteFill}
                              />

                              <Text style={styles.pollPreviewOptionText}>
                                {opt}
                              </Text>
                            </View>
                          ))
                        ) : (
                          <View style={styles.pollPreviewEmpty}>
                            <Text style={styles.pollPreviewEmptyText}>
                              Ajoutez vos options
                            </Text>
                          </View>
                        )}
                      </LinearGradient>
                    </View>
                  </FadeUp>

                  <FadeUp delay={80}>
                    <View>
                      <Text style={styles.fieldLabel}>Question</Text>

                      <TextInput
                        value={pollQ}
                        onChangeText={setPollQ}
                        maxLength={MAX_POLL_QUESTION_LENGTH}
                        placeholder="Posez une question à votre communauté…"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        style={styles.input}
                      />
                    </View>
                  </FadeUp>

                  <FadeUp delay={140}>
                    <View>
                      <View style={styles.pollOptionsHeader}>
                        <Text style={styles.fieldLabel}>Options</Text>

                        <View style={styles.pollCountBadge}>
                          <Text style={styles.pollCountText}>
                            {validPollOptions.length}/{MAX_POLL_OPTIONS}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={{
                          gap: 10,
                        }}
                      >
                        {pollOpts.map((opt, index) => (
                          <FadeUp key={index} delay={index * 40} distance={8}>
                            <View style={styles.pollOptionRow}>
                              <LinearGradient
                                colors={[
                                  "rgba(244,114,182,0.24)",
                                  "rgba(236,72,153,0.08)",
                                ]}
                                start={{
                                  x: 0,
                                  y: 0,
                                }}
                                end={{
                                  x: 1,
                                  y: 1,
                                }}
                                style={styles.pollOptionNumber}
                              >
                                <Text style={styles.pollOptionNumberText}>
                                  {index + 1}
                                </Text>
                              </LinearGradient>

                              <TextInput
                                value={opt}
                                onChangeText={(value) =>
                                  updatePollOption(index, value)
                                }
                                maxLength={80}
                                placeholder={`Option ${index + 1}`}
                                placeholderTextColor="rgba(255,255,255,0.2)"
                                style={[
                                  styles.input,
                                  {
                                    flex: 1,
                                  },
                                ]}
                              />

                              {pollOpts.length > MIN_POLL_OPTIONS ? (
                                <Pressable
                                  onPress={() => removePollOption(index)}
                                  hitSlop={6}
                                  style={({ pressed }) => [
                                    styles.pollRemoveButton,
                                    pressed && {
                                      opacity: 0.7,
                                    },
                                  ]}
                                >
                                  <X size={15} color="rgba(255,255,255,0.4)" />
                                </Pressable>
                              ) : null}
                            </View>
                          </FadeUp>
                        ))}
                      </View>

                      {pollOpts.length < MAX_POLL_OPTIONS ? (
                        <Pressable
                          onPress={addPollOption}
                          style={({ pressed }) => [
                            styles.addOptionButton,
                            pressed && {
                              opacity: 0.75,
                            },
                          ]}
                        >
                          <View style={styles.addOptionIcon}>
                            <Plus size={14} color="#F472B6" strokeWidth={2.6} />
                          </View>

                          <Text style={styles.addOptionText}>
                            Ajouter une option
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </FadeUp>

                  <FadeUp delay={220}>
                    <PublishButton
                      disabled={!canPublish}
                      loading={publishing}
                      onPress={publish}
                      label="Publier le sondage"
                      colors={["#F472B6", "#EC4899"]}
                    />
                  </FadeUp>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

/* ============================================================
 * STYLES (inchangés)
 * ============================================================ */

const SCREEN_WIDTH = Dimensions.get("window").width;

const SCREEN_HEIGHT = Dimensions.get("window").height;

const STORY_SHEET_HEIGHT = Math.min(SCREEN_HEIGHT * 0.92, 920);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.78)",
  },

  kavWrapper: {
    width: "100%",
    alignItems: "center",
  },

  sheet: {
    width: "100%",
    maxWidth: 560,
    height: STORY_SHEET_HEIGHT,
    maxHeight: STORY_SHEET_HEIGHT,
    backgroundColor: "#08061A",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.75,
    shadowRadius: 40,
    shadowOffset: {
      width: 0,
      height: -20,
    },
    elevation: 28,
  },

  sheetBorder: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.18)",
  },

  orbTop: {
    position: "absolute",
    top: -120,
    left: "15%",
    right: "15%",
    height: 200,
    borderRadius: 9999,
    backgroundColor: "rgba(139,92,246,0.22)",
  },

  orbBottom: {
    position: "absolute",
    bottom: -160,
    right: -100,
    width: 220,
    height: 220,
    borderRadius: 9999,
    backgroundColor: "rgba(99,102,241,0.14)",
  },

  handleWrap: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 6,
  },

  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerCenter: {
    flex: 1,
    alignItems: "center",
  },

  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  headerSubtitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10.5,
    marginTop: 3,
    fontWeight: "500",
  },

  headerRight: {
    width: 44,
    alignItems: "flex-end",
  },

  stepBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(167,139,250,0.16)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.32)",
  },

  stepBadgeText: {
    color: "#C4B5FD",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  pressed: {
    opacity: 0.75,
    transform: [
      {
        scale: 0.96,
      },
    ],
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  stepContent: {
    gap: 22,
  },

  pickHeader: {
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },

  zapCircle: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.35)",
    marginBottom: 8,
  },

  pickTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.5,
  },

  pickSubtitle: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: "center",
    maxWidth: 320,
    fontWeight: "500",
  },

  creationTypesList: {
    gap: 12,
  },

  creationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    overflow: "hidden",
  },

  creationIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },

  creationTextColumn: {
    flex: 1,
    minWidth: 0,
  },

  creationLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },

  creationDescription: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11.5,
    marginTop: 4,
    lineHeight: 16,
    fontWeight: "500",
  },

  chevronCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  storyPreviewWrapper: {
    alignItems: "center",
  },

  storyPreview: {
    width: SCREEN_WIDTH * 0.62,
    maxWidth: 280,
    aspectRatio: 9 / 14,
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    shadowColor: "#000",
    shadowOpacity: 0.65,
    shadowRadius: 28,
    shadowOffset: {
      width: 0,
      height: 16,
    },
    elevation: 14,
  },

  storyPreviewInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 26,
  },

  storyPreviewText: {
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 30,
    letterSpacing: -0.6,
  },

  previewImage: {
    width: "100%",
    height: "100%",
  },

  imageOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "50%",
  },

  imageOverlayContent: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
  },

  imageOverlayText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },

  removeImageButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },

  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  uploadingText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    fontWeight: "700",
  },

  dropZone: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },

  dropZoneIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.35)",
  },

  dropZoneTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },

  dropZoneSubtitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "500",
  },

  fieldLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 1.6,
    marginBottom: 10,
  },

  input: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(255,255,255,0.045)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },

  textArea: {
    minHeight: 100,
  },

  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 8,
  },

  counterText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    fontWeight: "800",
  },

  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 2,
  },

  swatchesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  swatchOuter: {
    padding: 0,
  },

  swatch: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },

  swatchSelected: {
    borderWidth: 2.5,
    borderColor: "#fff",
  },

  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },

  chooseButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.28)",
    overflow: "hidden",
  },

  chooseButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  chooseButtonTitle: {
    color: "#fff",
    fontSize: 12.5,
    fontWeight: "900",
  },

  chooseButtonSubtitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10.5,
    marginTop: 3,
    fontWeight: "500",
  },

  pollPreview: {
    padding: 24,
    justifyContent: "center",
  },

  pollPreviewIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(244,114,182,0.35)",
    alignSelf: "center",
    marginBottom: 20,
  },

  pollPreviewQuestion: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },

  pollPreviewOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(244,114,182,0.35)",
    marginBottom: 8,
    overflow: "hidden",
  },

  pollPreviewOptionText: {
    color: "#fff",
    fontSize: 12.5,
    fontWeight: "800",
  },

  pollPreviewEmpty: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.2)",
  },

  pollPreviewEmptyText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 10.5,
    textAlign: "center",
    fontWeight: "600",
  },

  pollOptionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  pollCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "rgba(244,114,182,0.16)",
    borderWidth: 1,
    borderColor: "rgba(244,114,182,0.32)",
  },

  pollCountText: {
    color: "#F9A8D4",
    fontSize: 10,
    fontWeight: "900",
  },

  pollOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  pollOptionNumber: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(244,114,182,0.32)",
  },

  pollOptionNumberText: {
    color: "#F9A8D4",
    fontSize: 13,
    fontWeight: "900",
  },

  pollRemoveButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  addOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    paddingVertical: 6,
  },

  addOptionIcon: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(244,114,182,0.16)",
    borderWidth: 1,
    borderColor: "rgba(244,114,182,0.32)",
  },

  addOptionText: {
    color: "#F9A8D4",
    fontSize: 12,
    fontWeight: "800",
  },

  publishOuter: {
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.55,
    shadowRadius: 22,
    shadowOffset: {
      width: 0,
      height: 14,
    },
    elevation: 10,
  },

  publishOuterDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },

  publishGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 18,
    overflow: "hidden",
  },

  publishShine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: "rgba(255,255,255,0.24)",
    opacity: 0.7,
  },

  publishText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
});
