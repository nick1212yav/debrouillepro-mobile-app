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
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import * as ImagePicker from "expo-image-picker";

import {
  Check,
  ChevronDown,
  Film,
  Hash,
  Pause,
  Play,
  RotateCcw,
  Upload,
  Volume2,
  VolumeX,
  X,
} from "lucide-react-native";

import { useMutation } from "convex/react";

import { api } from "@/convex/_generated/api.js";

import { VideoView, useVideoPlayer } from "expo-video";

/* ============================================================================
 * TYPES
 * ========================================================================== */

type ReelVisibility = "public" | "followers" | "private";

interface CreateReelSheetProps {
  visible: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

interface SelectedVideo {
  uri: string;
  mimeType: string;
  fileName?: string;
  fileSize?: number;
  durationMs?: number;
}

/* ============================================================================
 * CONSTANTS
 * ========================================================================== */

const COLORS = {
  background: "#020412",
  surface: "#080D1D",
  surfaceElevated: "#0D1428",
  white: "#FFFFFF",
  text: "rgba(255,255,255,0.94)",
  muted: "rgba(255,255,255,0.62)",
  subtle: "rgba(255,255,255,0.42)",
  faint: "rgba(255,255,255,0.20)",
  border: "rgba(255,255,255,0.11)",
  borderStrong: "rgba(255,255,255,0.18)",
  purple: "#8B5CF6",
  purpleBright: "#A78BFA",
  blue: "#2563EB",
  indigo: "#4F46E5",
  green: "#34D399",
  red: "#FB7185",
  yellow: "#FACC15",
};

const MAX_VIDEO_SIZE_BYTES = 250 * 1024 * 1024;
const MAX_VIDEO_DURATION_SECONDS = 180;

const MAX_CAPTION_LENGTH = 5000;
const MAX_SOUND_NAME_LENGTH = 120;
const MAX_HASHTAGS = 30;
const MAX_HASHTAG_LENGTH = 50;

const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-m4v",
]);

const VISIBILITY_OPTIONS: ReadonlyArray<{
  value: ReelVisibility;
  label: string;
  description: string;
}> = [
  {
    value: "public",
    label: "Public",
    description: "Visible par tout le monde",
  },
  {
    value: "followers",
    label: "Abonnés",
    description: "Visible uniquement par vos abonnés",
  },
  {
    value: "private",
    label: "Privé",
    description: "Visible uniquement par vous",
  },
];

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function normalizeMimeType(value?: string | null): string {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return "video/mp4";
  }

  if (normalized === "video/quicktime") {
    return "video/quicktime";
  }

  if (normalized === "video/x-m4v") {
    return "video/x-m4v";
  }

  if (normalized === "video/webm") {
    return "video/webm";
  }

  if (normalized === "video/mp4") {
    return "video/mp4";
  }

  return normalized;
}

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) {
    return "Taille inconnue";
  }

  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  }

  const megabytes = bytes / (1024 * 1024);

  if (megabytes < 10) {
    return `${megabytes.toFixed(1)} Mo`;
  }

  return `${Math.round(megabytes)} Mo`;
}

function formatDuration(seconds?: number): string {
  if (!seconds || !Number.isFinite(seconds) || seconds < 0) {
    return "—";
  }

  const total = Math.round(seconds);

  const minutes = Math.floor(total / 60);
  const remainingSeconds = total % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
}

function normalizeHashtags(input: string): string[] {
  const tokens = input
    .split(/[\s,;]+/g)
    .map((value) => value.trim())
    .filter(Boolean);

  const result: string[] = [];
  const seen = new Set<string>();

  for (const token of tokens) {
    const normalized = token
      .replace(/^#+/, "")
      .replace(/[^\p{L}\p{N}_-]/gu, "")
      .trim();

    if (!normalized) {
      continue;
    }

    const limited = normalized.slice(0, MAX_HASHTAG_LENGTH);
    const key = limited.toLocaleLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(limited);

    if (result.length >= MAX_HASHTAGS) {
      break;
    }
  }

  return result;
}

function getFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.trim();

    if (!message) {
      return "Une erreur inattendue est survenue.";
    }

    if (message.includes("VIDEO_MEDIA_REQUIRED")) {
      return "La vidéo est obligatoire.";
    }

    if (message.includes("VIDEO_INVALID")) {
      return "Cette vidéo n'est pas valide.";
    }

    if (message.includes("CAPTION")) {
      return "La légende n'est pas valide.";
    }

    if (message.includes("VIDEO_NOT_FOUND")) {
      return "La vidéo n'est plus disponible.";
    }

    if (
      message.toLowerCase().includes("network") ||
      message.toLowerCase().includes("fetch")
    ) {
      return "Connexion réseau indisponible. Vérifiez votre connexion puis réessayez.";
    }

    return message;
  }

  return "Une erreur inattendue est survenue. Veuillez réessayer.";
}

function isAllowedVideoType(mimeType: string): boolean {
  return ALLOWED_VIDEO_TYPES.has(normalizeMimeType(mimeType));
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);

    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/* ============================================================================
 * COMPONENT
 * ========================================================================== */

export default function CreateReelSheet({
  visible,
  onClose,
  onCreated,
}: CreateReelSheetProps) {
  const { height: screenHeight } = useWindowDimensions();

  const generateUploadUrl = useMutation(api.shortVideos.generateUploadUrl);
  const createReel = useMutation(api.shortVideos.create);

  const [selectedVideo, setSelectedVideo] = useState<SelectedVideo | null>(
    null,
  );

  const [caption, setCaption] = useState("");
  const [hashtagsText, setHashtagsText] = useState("");
  const [soundName, setSoundName] = useState("");

  const [visibility, setVisibility] = useState<ReelVisibility>("public");

  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [publishing, setPublishing] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewMuted, setPreviewMuted] = useState(false);

  const [showPreview, setShowPreview] = useState(false);

  const mountedRef = useRef(true);

  const player = useVideoPlayer(
    selectedVideo?.uri
      ? {
          uri: selectedVideo.uri,
        }
      : null,
    (videoPlayer) => {
      videoPlayer.loop = true;
      videoPlayer.muted = previewMuted;
    },
  );

  /* --------------------------------------------------------------------------
   * Lifecycle
   * ------------------------------------------------------------------------ */

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      setShowVisibilityMenu(false);
      setShowPreview(false);
      setPreviewPlaying(false);
    }
  }, [visible]);

  useEffect(() => {
    if (!player) {
      return;
    }

    player.loop = true;
    player.muted = previewMuted;
  }, [player, previewMuted]);

  useEffect(() => {
    if (!player) {
      return;
    }

    const subscription = player.addListener("playingChange", (event) => {
      if (!mountedRef.current) {
        return;
      }

      setPreviewPlaying(event.isPlaying);
    });

    return () => {
      subscription.remove();
    };
  }, [player]);

  /* --------------------------------------------------------------------------
   * Derived state
   * ------------------------------------------------------------------------ */

  const hashtags = useMemo(
    () => normalizeHashtags(hashtagsText),
    [hashtagsText],
  );

  const selectedVisibility = useMemo(
    () =>
      VISIBILITY_OPTIONS.find((option) => option.value === visibility) ??
      VISIBILITY_OPTIONS[0],
    [visibility],
  );

  const canPublish = useMemo(() => {
    if (uploading || publishing) {
      return false;
    }

    if (!selectedVideo) {
      return false;
    }

    if (!caption.trim()) {
      return false;
    }

    if (caption.trim().length > MAX_CAPTION_LENGTH) {
      return false;
    }

    if (soundName.trim().length > MAX_SOUND_NAME_LENGTH) {
      return false;
    }

    return true;
  }, [caption, publishing, selectedVideo, soundName, uploading]);

  /* --------------------------------------------------------------------------
   * Reset
   * ------------------------------------------------------------------------ */

  const resetForm = useCallback(() => {
    try {
      player?.pause();
    } catch {
      // Le player peut déjà être détruit par Expo.
    }

    setSelectedVideo(null);
    setCaption("");
    setHashtagsText("");
    setSoundName("");
    setVisibility("public");
    setShowVisibilityMenu(false);
    setUploading(false);
    setUploadProgress(0);
    setPublishing(false);
    setErrorMessage(null);
    setPreviewPlaying(false);
    setPreviewMuted(false);
    setShowPreview(false);
  }, [player]);

  const handleClose = useCallback(() => {
    if (uploading || publishing) {
      return;
    }

    resetForm();
    onClose();
  }, [onClose, publishing, resetForm, uploading]);

  /* --------------------------------------------------------------------------
   * Video picker
   * ------------------------------------------------------------------------ */

  const pickVideo = useCallback(async () => {
    if (uploading || publishing) {
      return;
    }

    setErrorMessage(null);

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Accès à la galerie requis",
          "Autorisez DébrouillePro à accéder à vos vidéos afin de créer un Reel.",
        );

        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["videos"],
        allowsMultipleSelection: false,
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];

      if (!asset?.uri) {
        throw new Error(
          "Impossible de récupérer le fichier vidéo sélectionné.",
        );
      }

      const mimeType = normalizeMimeType(asset.mimeType);

      if (!isAllowedVideoType(mimeType)) {
        Alert.alert(
          "Format vidéo non pris en charge",
          "Utilisez une vidéo MP4, MOV, M4V ou WebM.",
        );

        return;
      }

      if (
        asset.fileSize !== undefined &&
        asset.fileSize > MAX_VIDEO_SIZE_BYTES
      ) {
        Alert.alert(
          "Vidéo trop volumineuse",
          `La taille maximale autorisée est de ${Math.round(
            MAX_VIDEO_SIZE_BYTES / (1024 * 1024),
          )} Mo.`,
        );

        return;
      }

      const durationMs =
        typeof asset.duration === "number" ? asset.duration : undefined;

      const durationSeconds =
        durationMs !== undefined ? durationMs / 1000 : undefined;

      if (
        durationSeconds !== undefined &&
        durationSeconds > MAX_VIDEO_DURATION_SECONDS
      ) {
        Alert.alert(
          "Vidéo trop longue",
          `Un Reel peut durer au maximum ${MAX_VIDEO_DURATION_SECONDS} secondes.`,
        );

        return;
      }

      setSelectedVideo({
        uri: asset.uri,
        mimeType,
        fileName: asset.fileName ?? undefined,
        fileSize: asset.fileSize ?? undefined,
        durationMs,
      });

      setShowPreview(true);
      setPreviewPlaying(false);
      setPreviewMuted(false);
    } catch (error) {
      const message = getFriendlyErrorMessage(error);

      setErrorMessage(message);

      Alert.alert("Impossible de sélectionner la vidéo", message);
    }
  }, [publishing, uploading]);

  /* --------------------------------------------------------------------------
   * Preview
   * ------------------------------------------------------------------------ */

  const togglePreviewPlayback = useCallback(async () => {
    if (!player || uploading || publishing) {
      return;
    }

    try {
      if (player.playing) {
        player.pause();
      } else {
        player.play();
      }
    } catch (error) {
      setErrorMessage(getFriendlyErrorMessage(error));
    }
  }, [player, publishing, uploading]);

  const toggleMute = useCallback(() => {
    if (!player) {
      return;
    }

    const nextMuted = !previewMuted;

    setPreviewMuted(nextMuted);

    player.muted = nextMuted;
  }, [player, previewMuted]);

  const replaceVideo = useCallback(async () => {
    if (uploading || publishing) {
      return;
    }

    try {
      player?.pause();
    } catch {
      // noop
    }

    setSelectedVideo(null);
    setShowPreview(false);
    setPreviewPlaying(false);

    await pickVideo();
  }, [pickVideo, player, publishing, uploading]);

  /* --------------------------------------------------------------------------
   * Upload
   * ------------------------------------------------------------------------ */

  const uploadVideoToConvex = useCallback(
    async (video: SelectedVideo): Promise<string> => {
      setUploadProgress(0.05);

      const uploadUrl = await generateUploadUrl({});

      if (!uploadUrl || !isHttpUrl(uploadUrl)) {
        throw new Error("L'URL d'upload Convex reçue est invalide.");
      }

      setUploadProgress(0.12);

      const localResponse = await fetch(video.uri);

      if (!localResponse.ok) {
        throw new Error(
          `Impossible de lire la vidéo locale (${localResponse.status}).`,
        );
      }

      const blob = await localResponse.blob();

      if (!blob.size) {
        throw new Error("Le fichier vidéo est vide.");
      }

      if (blob.size > MAX_VIDEO_SIZE_BYTES) {
        throw new Error(
          `La vidéo dépasse la limite de ${Math.round(
            MAX_VIDEO_SIZE_BYTES / (1024 * 1024),
          )} Mo.`,
        );
      }

      setUploadProgress(0.2);

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": video.mimeType,
        },
        body: blob,
      });

      if (!response.ok) {
        throw new Error(`L'upload de la vidéo a échoué (${response.status}).`);
      }

      const payload = (await response.json()) as {
        storageId?: string;
      };

      if (!payload.storageId) {
        throw new Error(
          "Convex n'a pas retourné l'identifiant Storage de la vidéo.",
        );
      }

      setUploadProgress(0.95);

      return payload.storageId;
    },
    [generateUploadUrl],
  );

  /* --------------------------------------------------------------------------
   * Publish
   * ------------------------------------------------------------------------ */

  const handlePublish = useCallback(async () => {
    if (uploading || publishing) {
      return;
    }

    setErrorMessage(null);

    const video = selectedVideo;

    if (!video) {
      setErrorMessage("Sélectionnez une vidéo avant de publier.");
      return;
    }

    const cleanCaption = caption.trim();

    if (!cleanCaption) {
      setErrorMessage("Ajoutez une légende à votre Reel.");
      return;
    }

    if (cleanCaption.length > MAX_CAPTION_LENGTH) {
      setErrorMessage(
        `La légende ne peut pas dépasser ${MAX_CAPTION_LENGTH} caractères.`,
      );
      return;
    }

    const cleanSoundName = soundName.trim();

    if (cleanSoundName.length > MAX_SOUND_NAME_LENGTH) {
      setErrorMessage(
        `Le nom du son ne peut pas dépasser ${MAX_SOUND_NAME_LENGTH} caractères.`,
      );
      return;
    }

    const durationSeconds =
      video.durationMs !== undefined ? video.durationMs / 1000 : undefined;

    if (
      durationSeconds !== undefined &&
      durationSeconds > MAX_VIDEO_DURATION_SECONDS
    ) {
      setErrorMessage(
        `La vidéo dépasse la durée maximale de ${MAX_VIDEO_DURATION_SECONDS} secondes.`,
      );

      return;
    }

    setPublishing(true);
    setUploading(true);
    setUploadProgress(0);

    try {
      player?.pause();

      const storageId = await uploadVideoToConvex(video);

      if (!mountedRef.current) {
        return;
      }

      setUploadProgress(0.97);

      await createReel({
        videoStorageId: storageId as never,
        caption: cleanCaption,
        hashtags,
        duration: durationSeconds,
        soundName: cleanSoundName || undefined,
        visibility,
      });

      if (!mountedRef.current) {
        return;
      }

      setUploadProgress(1);

      /*
       * Le backend place le nouveau Reel en modération.
       * Il ne faut donc pas annoncer "visible immédiatement".
       */
      Alert.alert(
        "Reel envoyé",
        "Votre Reel a bien été envoyé. Il sera disponible dans le flux après validation.",
        [
          {
            text: "OK",
            onPress: () => {
              resetForm();
              onCreated?.();
              onClose();
            },
          },
        ],
      );
    } catch (error) {
      if (!mountedRef.current) {
        return;
      }

      const message = getFriendlyErrorMessage(error);

      setErrorMessage(message);

      Alert.alert("Publication impossible", message);
    } finally {
      if (mountedRef.current) {
        setUploading(false);
        setPublishing(false);
      }
    }
  }, [
    caption,
    createReel,
    hashtags,
    onClose,
    onCreated,
    player,
    publishing,
    resetForm,
    selectedVideo,
    soundName,
    uploadVideoToConvex,
    uploading,
    visibility,
  ]);

  /* --------------------------------------------------------------------------
   * Render helpers
   * ------------------------------------------------------------------------ */

  const renderVisibilityOption = (
    option: (typeof VISIBILITY_OPTIONS)[number],
  ) => {
    const selected = option.value === visibility;

    return (
      <Pressable
        key={option.value}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={option.label}
        onPress={() => {
          setVisibility(option.value);
          setShowVisibilityMenu(false);
        }}
        style={({ pressed }) => [
          styles.visibilityOption,
          selected && styles.visibilityOptionSelected,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.visibilityOptionContent}>
          <Text
            style={[
              styles.visibilityOptionLabel,
              selected && styles.visibilityOptionLabelSelected,
            ]}
          >
            {option.label}
          </Text>

          <Text style={styles.visibilityOptionDescription}>
            {option.description}
          </Text>
        </View>

        {selected ? (
          <View style={styles.checkCircle}>
            <Check size={14} color={COLORS.white} />
          </View>
        ) : null}
      </Pressable>
    );
  };

  /* --------------------------------------------------------------------------
   * Modal
   * ------------------------------------------------------------------------ */

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          disabled={uploading || publishing}
          onPress={handleClose}
          style={styles.backdrop}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardContainer}
        >
          <View
            style={[
              styles.sheet,
              {
                maxHeight:
                  Platform.OS === "web"
                    ? Math.min(screenHeight * 0.94, 900)
                    : screenHeight * 0.94,
              },
            ]}
          >
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleGroup}>
                <View style={styles.headerIcon}>
                  <Film size={18} color={COLORS.white} />
                </View>

                <View>
                  <Text style={styles.title}>Créer un Reel</Text>

                  <Text style={styles.subtitle}>
                    Publiez une vraie vidéo sur DébrouillePro
                  </Text>
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fermer"
                disabled={uploading || publishing}
                onPress={handleClose}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.pressed,
                  (uploading || publishing) && styles.disabledButton,
                ]}
              >
                <X size={19} color={COLORS.white} />
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Error */}
              {errorMessage ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorTitle}>Impossible de continuer</Text>

                  <Text style={styles.errorText}>{errorMessage}</Text>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Fermer le message d'erreur"
                    onPress={() => setErrorMessage(null)}
                    style={styles.errorClose}
                  >
                    <X size={15} color={COLORS.red} />
                  </Pressable>
                </View>
              ) : null}

              {/* Video selection */}
              {!selectedVideo ? (
                <View style={styles.emptyPicker}>
                  <View style={styles.emptyIcon}>
                    <Film size={32} color={COLORS.purpleBright} />
                  </View>

                  <Text style={styles.emptyTitle}>Choisissez votre vidéo</Text>

                  <Text style={styles.emptyDescription}>
                    Sélectionnez une vidéo depuis votre appareil. Elle sera
                    envoyée de manière sécurisée vers Convex Storage.
                  </Text>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Choisir une vidéo"
                    disabled={uploading || publishing}
                    onPress={() => {
                      void pickVideo();
                    }}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      pressed && styles.pressed,
                      (uploading || publishing) && styles.disabledButton,
                    ]}
                  >
                    <Upload size={18} color={COLORS.white} />

                    <Text style={styles.primaryButtonText}>
                      Choisir une vidéo
                    </Text>
                  </Pressable>

                  <Text style={styles.helperText}>
                    MP4, MOV, M4V ou WebM • maximum 250 Mo • maximum 3 minutes
                  </Text>
                </View>
              ) : (
                <>
                  {/* Preview */}
                  <View style={styles.previewSection}>
                    <View style={styles.previewHeader}>
                      <View>
                        <Text style={styles.sectionTitle}>Aperçu</Text>

                        <Text style={styles.sectionSubtitle}>
                          Vérifiez votre vidéo avant l'envoi
                        </Text>
                      </View>

                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Remplacer la vidéo"
                        disabled={uploading || publishing}
                        onPress={() => {
                          void replaceVideo();
                        }}
                        style={({ pressed }) => [
                          styles.replaceButton,
                          pressed && styles.pressed,
                        ]}
                      >
                        <RotateCcw size={15} color={COLORS.white} />

                        <Text style={styles.replaceButtonText}>Remplacer</Text>
                      </Pressable>
                    </View>

                    <View style={styles.videoPreview}>
                      {showPreview && selectedVideo ? (
                        <VideoView
                          player={player}
                          style={styles.video}
                          contentFit="cover"
                          nativeControls={false}
                          allowsFullscreen={false}
                          allowsPictureInPicture={false}
                        />
                      ) : (
                        <View style={styles.videoFallback}>
                          <Film size={30} color={COLORS.subtle} />
                        </View>
                      )}

                      <View pointerEvents="none" style={styles.videoGradient} />

                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={
                          previewPlaying
                            ? "Mettre la vidéo en pause"
                            : "Lire la vidéo"
                        }
                        onPress={() => {
                          void togglePreviewPlayback();
                        }}
                        style={styles.previewPlayButton}
                      >
                        {previewPlaying ? (
                          <Pause size={22} color={COLORS.white} />
                        ) : (
                          <Play
                            size={22}
                            color={COLORS.white}
                            fill={COLORS.white}
                          />
                        )}
                      </Pressable>

                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={
                          previewMuted ? "Activer le son" : "Couper le son"
                        }
                        onPress={toggleMute}
                        style={styles.muteButton}
                      >
                        {previewMuted ? (
                          <VolumeX size={17} color={COLORS.white} />
                        ) : (
                          <Volume2 size={17} color={COLORS.white} />
                        )}
                      </Pressable>

                      <View style={styles.videoMeta}>
                        <View style={styles.metaBadge}>
                          <Text style={styles.metaBadgeText}>
                            {formatDuration(
                              selectedVideo.durationMs
                                ? selectedVideo.durationMs / 1000
                                : undefined,
                            )}
                          </Text>
                        </View>

                        <View style={styles.metaBadge}>
                          <Text style={styles.metaBadgeText}>
                            {formatFileSize(selectedVideo.fileSize)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Caption */}
                  <View style={styles.field}>
                    <View style={styles.fieldHeader}>
                      <Text style={styles.fieldLabel}>Légende</Text>

                      <Text
                        style={[
                          styles.counter,
                          caption.length > MAX_CAPTION_LENGTH * 0.9 &&
                            styles.counterWarning,
                        ]}
                      >
                        {caption.length}/{MAX_CAPTION_LENGTH}
                      </Text>
                    </View>

                    <TextInput
                      value={caption}
                      onChangeText={setCaption}
                      editable={!uploading && !publishing}
                      multiline
                      maxLength={MAX_CAPTION_LENGTH}
                      placeholder="Décrivez votre Reel..."
                      placeholderTextColor={COLORS.subtle}
                      textAlignVertical="top"
                      style={[styles.textInput, styles.captionInput]}
                    />
                  </View>

                  {/* Hashtags */}
                  <View style={styles.field}>
                    <View style={styles.fieldLabelRow}>
                      <Hash size={15} color={COLORS.purpleBright} />

                      <Text style={styles.fieldLabel}>Hashtags</Text>

                      <Text style={styles.counter}>
                        {hashtags.length}/{MAX_HASHTAGS}
                      </Text>
                    </View>

                    <TextInput
                      value={hashtagsText}
                      onChangeText={setHashtagsText}
                      editable={!uploading && !publishing}
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholder="#business #afrique #kolwezi"
                      placeholderTextColor={COLORS.subtle}
                      style={styles.textInput}
                    />

                    {hashtags.length > 0 ? (
                      <View style={styles.hashtagPreview}>
                        {hashtags.slice(0, 12).map((tag) => (
                          <View key={tag} style={styles.hashtagChip}>
                            <Text style={styles.hashtagText}>#{tag}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>

                  {/* Sound */}
                  <View style={styles.field}>
                    <View style={styles.fieldHeader}>
                      <Text style={styles.fieldLabel}>Son</Text>

                      <Text style={styles.optionalLabel}>Facultatif</Text>
                    </View>

                    <TextInput
                      value={soundName}
                      onChangeText={setSoundName}
                      editable={!uploading && !publishing}
                      maxLength={MAX_SOUND_NAME_LENGTH}
                      placeholder="Nom du son ou de la musique"
                      placeholderTextColor={COLORS.subtle}
                      style={styles.textInput}
                    />
                  </View>

                  {/* Visibility */}
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Visibilité</Text>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Visibilité ${selectedVisibility.label}`}
                      disabled={uploading || publishing}
                      onPress={() =>
                        setShowVisibilityMenu((current) => !current)
                      }
                      style={({ pressed }) => [
                        styles.visibilityButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <View style={styles.visibilityButtonText}>
                        <Text style={styles.visibilityLabel}>
                          {selectedVisibility.label}
                        </Text>

                        <Text style={styles.visibilityDescription}>
                          {selectedVisibility.description}
                        </Text>
                      </View>

                      <ChevronDown size={18} color={COLORS.muted} />
                    </Pressable>

                    {showVisibilityMenu ? (
                      <View style={styles.visibilityMenu}>
                        {VISIBILITY_OPTIONS.map(renderVisibilityOption)}
                      </View>
                    ) : null}
                  </View>

                  {/* Moderation notice */}
                  <View style={styles.moderationNotice}>
                    <View style={styles.moderationIcon}>
                      <Check size={15} color={COLORS.green} />
                    </View>

                    <View style={styles.moderationContent}>
                      <Text style={styles.moderationTitle}>
                        Publication sécurisée
                      </Text>

                      <Text style={styles.moderationText}>
                        Votre Reel sera soumis au processus de modération avant
                        d'être diffusé dans le flux.
                      </Text>
                    </View>
                  </View>

                  {/* Upload progress */}
                  {uploading ? (
                    <View style={styles.progressCard}>
                      <View style={styles.progressHeader}>
                        <View style={styles.progressTitleRow}>
                          <ActivityIndicator
                            size="small"
                            color={COLORS.purpleBright}
                          />

                          <Text style={styles.progressTitle}>
                            {publishing
                              ? "Publication du Reel..."
                              : "Envoi de la vidéo..."}
                          </Text>
                        </View>

                        <Text style={styles.progressPercentage}>
                          {Math.round(uploadProgress * 100)}%
                        </Text>
                      </View>

                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${Math.max(
                                0,
                                Math.min(100, uploadProgress * 100),
                              )}%`,
                            },
                          ]}
                        />
                      </View>

                      <Text style={styles.progressHint}>
                        Ne fermez pas cette fenêtre pendant l'envoi.
                      </Text>
                    </View>
                  ) : null}

                  {/* Publish */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Publier le Reel"
                    accessibilityState={{
                      disabled: !canPublish,
                      busy: publishing,
                    }}
                    disabled={!canPublish}
                    onPress={() => {
                      void handlePublish();
                    }}
                    style={({ pressed }) => [
                      styles.publishButton,
                      !canPublish && styles.publishButtonDisabled,
                      pressed && styles.pressed,
                    ]}
                  >
                    {publishing ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <Upload size={18} color={COLORS.white} />
                    )}

                    <Text style={styles.publishButtonText}>
                      {publishing ? "Publication..." : "Publier le Reel"}
                    </Text>
                  </Pressable>

                  <Text style={styles.bottomHint}>
                    En publiant, vous confirmez que vous disposez des droits
                    nécessaires sur cette vidéo et son contenu audio.
                  </Text>
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.68)",
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },

  keyboardContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  sheet: {
    width: "100%",
    maxWidth: 720,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: COLORS.borderStrong,
    overflow: "hidden",
  },

  handle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    marginTop: 9,
    backgroundColor: COLORS.faint,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 13,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  headerTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
    gap: 11,
  },

  headerIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.18)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
  },

  title: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "900",
  },

  subtitle: {
    color: COLORS.subtle,
    fontSize: 10,
    marginTop: 2,
  },

  closeButton: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  scrollContent: {
    paddingHorizontal: 17,
    paddingTop: 15,
    paddingBottom: 34,
  },

  errorBox: {
    position: "relative",
    marginBottom: 14,
    paddingHorizontal: 13,
    paddingVertical: 12,
    paddingRight: 42,
    borderRadius: 15,
    backgroundColor: "rgba(251,113,133,0.09)",
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.25)",
  },

  errorTitle: {
    color: COLORS.red,
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 3,
  },

  errorText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    lineHeight: 16,
  },

  errorClose: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyPicker: {
    minHeight: 390,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 35,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.borderStrong,
    backgroundColor: "rgba(255,255,255,0.025)",
  },

  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 17,
    backgroundColor: "rgba(139,92,246,0.14)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.24)",
  },

  emptyTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },

  emptyDescription: {
    maxWidth: 420,
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 21,
  },

  primaryButton: {
    minHeight: 49,
    paddingHorizontal: 21,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.purple,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
  },

  primaryButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
  },

  helperText: {
    color: COLORS.subtle,
    fontSize: 9,
    textAlign: "center",
    marginTop: 12,
  },

  previewSection: {
    marginBottom: 17,
  },

  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 9,
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "900",
  },

  sectionSubtitle: {
    color: COLORS.subtle,
    fontSize: 9,
    marginTop: 2,
  },

  replaceButton: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  replaceButtonText: {
    color: COLORS.text,
    fontSize: 9,
    fontWeight: "800",
  },

  videoPreview: {
    width: "100%",
    aspectRatio: 9 / 16,
    maxHeight: 520,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: COLORS.border,
    position: "relative",
  },

  video: {
    width: "100%",
    height: "100%",
  },

  videoFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },

  videoGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.12)",
  },

  previewPlayButton: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 62,
    height: 62,
    marginLeft: -31,
    marginTop: -31,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.48)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },

  muteButton: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.48)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },

  videoMeta: {
    position: "absolute",
    left: 12,
    bottom: 12,
    flexDirection: "row",
    gap: 7,
  },

  metaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.50)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },

  metaBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: "800",
  },

  field: {
    marginBottom: 15,
  },

  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 7,
  },

  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 7,
  },

  fieldLabel: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "900",
  },

  counter: {
    color: COLORS.subtle,
    fontSize: 9,
  },

  counterWarning: {
    color: COLORS.yellow,
  },

  optionalLabel: {
    color: COLORS.subtle,
    fontSize: 9,
  },

  textInput: {
    minHeight: 47,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 14,
    color: COLORS.white,
    fontSize: 12,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  captionInput: {
    minHeight: 105,
    maxHeight: 180,
    lineHeight: 18,
  },

  hashtagPreview: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },

  hashtagChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(139,92,246,0.12)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.20)",
  },

  hashtagText: {
    color: COLORS.purpleBright,
    fontSize: 9,
    fontWeight: "800",
  },

  visibilityButton: {
    minHeight: 57,
    paddingHorizontal: 13,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  visibilityButtonText: {
    flex: 1,
    minWidth: 0,
  },

  visibilityLabel: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "900",
  },

  visibilityDescription: {
    color: COLORS.subtle,
    fontSize: 9,
    marginTop: 2,
  },

  visibilityMenu: {
    marginTop: 7,
    padding: 6,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },

  visibilityOption: {
    minHeight: 58,
    paddingHorizontal: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  visibilityOptionSelected: {
    backgroundColor: "rgba(139,92,246,0.11)",
  },

  visibilityOptionContent: {
    flex: 1,
    minWidth: 0,
  },

  visibilityOptionLabel: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "800",
  },

  visibilityOptionLabelSelected: {
    color: COLORS.purpleBright,
  },

  visibilityOptionDescription: {
    color: COLORS.subtle,
    fontSize: 9,
    marginTop: 2,
  },

  checkCircle: {
    width: 27,
    height: 27,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.purple,
  },

  moderationNotice: {
    marginTop: 2,
    marginBottom: 15,
    padding: 12,
    borderRadius: 15,
    flexDirection: "row",
    gap: 10,
    backgroundColor: "rgba(52,211,153,0.055)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.16)",
  },

  moderationIcon: {
    width: 29,
    height: 29,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(52,211,153,0.12)",
  },

  moderationContent: {
    flex: 1,
    minWidth: 0,
  },

  moderationTitle: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: "900",
  },

  moderationText: {
    color: COLORS.muted,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 2,
  },

  progressCard: {
    marginBottom: 15,
    padding: 13,
    borderRadius: 15,
    backgroundColor: "rgba(139,92,246,0.07)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.18)",
  },

  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 9,
  },

  progressTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  progressTitle: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: "800",
  },

  progressPercentage: {
    color: COLORS.purpleBright,
    fontSize: 10,
    fontWeight: "900",
  },

  progressTrack: {
    height: 6,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: COLORS.purple,
  },

  progressHint: {
    color: COLORS.subtle,
    fontSize: 8,
    marginTop: 7,
  },

  publishButton: {
    minHeight: 52,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.purple,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },

  publishButtonDisabled: {
    opacity: 0.42,
  },

  publishButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
  },

  bottomHint: {
    color: COLORS.subtle,
    fontSize: 8,
    lineHeight: 13,
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 15,
  },

  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },

  disabledButton: {
    opacity: 0.42,
  },
});
