// src/features/messages/chat/components/MessageAttachments.tsx

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Audio } from "expo-av";
import { useQuery } from "convex/react";

import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";

/* ============================================================================
 * TYPES
 * ========================================================================== */

interface MessageAttachmentsProps {
  messageId: Id<"messages">;
  own?: boolean;
}

interface AttachmentLike {
  _id?: string;
  id?: string;
  fileId?: string;
  fileName?: string;
  fileMimeType?: string;
  mimeType?: string;
  fileSize?: number;
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
  width?: number;
  height?: number;
  duration?: number;
}

interface AudioAttachmentProps {
  attachment: AttachmentLike;
  own: boolean;
}

/* ============================================================================
 * HELPERS — détection de type
 * ========================================================================== */

function readMimeType(attachment: AttachmentLike): string {
  return (attachment.fileMimeType ?? attachment.mimeType ?? "").toLowerCase();
}

function isAudioAttachment(attachment: AttachmentLike): boolean {
  const mime = readMimeType(attachment);
  const name = (attachment.fileName ?? "").toLowerCase();

  return (
    mime.startsWith("audio/") ||
    /\.(mp3|m4a|aac|wav|ogg|oga|webm|opus|3gp|amr)$/i.test(name)
  );
}

function isImageAttachment(attachment: AttachmentLike): boolean {
  const mime = readMimeType(attachment);
  const name = (attachment.fileName ?? "").toLowerCase();

  return (
    mime.startsWith("image/") ||
    /\.(jpg|jpeg|png|gif|webp|heic|heif|bmp|tiff)$/i.test(name)
  );
}

function isVideoAttachment(attachment: AttachmentLike): boolean {
  const mime = readMimeType(attachment);
  const name = (attachment.fileName ?? "").toLowerCase();

  return (
    mime.startsWith("video/") ||
    /\.(mp4|mov|m4v|webm|mkv|avi|3gp|mpeg|mpg)$/i.test(name)
  );
}

function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) {
    return "";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ============================================================================
 * DIMENSIONS MÉDIA
 * ========================================================================== */

const MEDIA_MAX_WIDTH = 260;
const MEDIA_MIN_HEIGHT = 140;
const MEDIA_MAX_HEIGHT = 320;

function computeMediaSize(attachment: AttachmentLike): {
  width: number;
  height: number;
} {
  const width = attachment.width ?? 0;
  const height = attachment.height ?? 0;

  if (width > 0 && height > 0) {
    const ratio = width / height;

    let displayHeight = MEDIA_MAX_WIDTH / ratio;

    if (displayHeight < MEDIA_MIN_HEIGHT) {
      displayHeight = MEDIA_MIN_HEIGHT;
    }

    if (displayHeight > MEDIA_MAX_HEIGHT) {
      displayHeight = MEDIA_MAX_HEIGHT;
    }

    return { width: MEDIA_MAX_WIDTH, height: displayHeight };
  }

  /* Fallback : ratio 4:3 paysage */
  return { width: MEDIA_MAX_WIDTH, height: 195 };
}

/* ============================================================================
 * AUDIO PLAYER
 * ========================================================================== */

interface PlaybackStatusLike {
  isLoaded: boolean;
  isPlaying?: boolean;
  positionMillis?: number;
  durationMillis?: number;
  didJustFinish?: boolean;
}

function isLoadedPlaybackStatus(
  status: PlaybackStatusLike,
): status is PlaybackStatusLike & {
  isLoaded: true;
  isPlaying: boolean;
  positionMillis: number;
} {
  return status.isLoaded;
}

const AUDIO_CARD_WIDTH = 260;
const AUDIO_CARD_HEIGHT = 68;

function AudioAttachment({ attachment, own }: AudioAttachmentProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [positionMillis, setPositionMillis] = useState(0);

  const [durationMillis, setDurationMillis] = useState(
    Math.max(0, (attachment.duration ?? 0) * 1000),
  );

  const audioUrl = attachment.mediaUrl ?? null;

  const cleanupSound = useCallback(
    async (targetSound?: Audio.Sound | null) => {
      const currentSound = targetSound ?? sound;

      if (!currentSound) {
        return;
      }

      try {
        await currentSound.stopAsync();
      } catch {
        /* Best effort. */
      }

      try {
        await currentSound.unloadAsync();
      } catch {
        /* Best effort. */
      }

      if (!targetSound || targetSound === sound) {
        setSound(null);
        setIsPlaying(false);
        setPositionMillis(0);
      }
    },
    [sound],
  );

  useEffect(() => {
    return () => {
      const currentSound = sound;

      if (currentSound) {
        void currentSound.unloadAsync().catch(() => undefined);
      }
    };
  }, [sound]);

  const onPlaybackStatusUpdate = useCallback(
    (status: PlaybackStatusLike) => {
      if (!isLoadedPlaybackStatus(status)) {
        setIsPlaying(false);
        return;
      }

      setIsPlaying(status.isPlaying === true);
      setPositionMillis(status.positionMillis ?? 0);

      if (status.durationMillis !== undefined && status.durationMillis > 0) {
        setDurationMillis(status.durationMillis);
      }

      if (status.didJustFinish) {
        setIsPlaying(false);
        setPositionMillis(0);

        const currentSound = sound;

        if (currentSound) {
          void currentSound.setPositionAsync(0).catch(() => undefined);
        }
      }
    },
    [sound],
  );

  useEffect(() => {
    if (!sound) {
      return;
    }

    sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);

    return () => {
      sound.setOnPlaybackStatusUpdate(null);
    };
  }, [onPlaybackStatusUpdate, sound]);

  const loadAndPlay = useCallback(async () => {
    if (!audioUrl || isLoading) {
      if (!audioUrl) {
        setLoadError("URL audio manquante.");
      }
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    let createdSound: Audio.Sound | null = null;

    try {
      if (sound) {
        const status = await sound.getStatusAsync();

        if (status.isLoaded) {
          if (status.isPlaying) {
            await sound.pauseAsync();
          } else {
            await sound.playAsync();
          }

          return;
        }

        await cleanupSound(sound);
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const result = await Audio.Sound.createAsync(
        { uri: audioUrl },
        {
          shouldPlay: true,
          positionMillis: 0,
          progressUpdateIntervalMillis: 100,
        },
        onPlaybackStatusUpdate,
      );

      createdSound = result.sound;

      if (result.status.isLoaded) {
        if (
          result.status.durationMillis !== undefined &&
          result.status.durationMillis > 0
        ) {
          setDurationMillis(result.status.durationMillis);
        }

        setPositionMillis(result.status.positionMillis);
        setIsPlaying(result.status.isPlaying);
      }

      setSound(createdSound);
      createdSound = null;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur inconnue";

      console.error("[MessageAttachments] Erreur lecture:", error);

      setLoadError(message);
      setIsPlaying(false);
    } finally {
      if (createdSound) {
        try {
          await createdSound.unloadAsync();
        } catch {
          /* Best effort. */
        }
      }

      setIsLoading(false);
    }
  }, [audioUrl, cleanupSound, isLoading, onPlaybackStatusUpdate, sound]);

  const togglePlayback = useCallback(async () => {
    if (!audioUrl || isLoading) {
      return;
    }

    if (!sound) {
      await loadAndPlay();
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const status = await sound.getStatusAsync();

      if (!status.isLoaded) {
        await cleanupSound(sound);
        await loadAndPlay();
        return;
      }

      if (status.isPlaying) {
        await sound.pauseAsync();
        return;
      }

      const duration = status.durationMillis ?? 0;
      const position = status.positionMillis ?? 0;

      if (duration > 0 && position >= duration - 100) {
        await sound.setPositionAsync(0);
        setPositionMillis(0);
      }

      await sound.playAsync();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur lecture";

      console.error("[MessageAttachments] Erreur lecture:", error);

      setLoadError(message);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, [audioUrl, cleanupSound, isLoading, loadAndPlay, sound]);

  const progress = useMemo(() => {
    if (!durationMillis || durationMillis <= 0) {
      return 0;
    }

    return Math.min(1, Math.max(0, positionMillis / durationMillis));
  }, [durationMillis, positionMillis]);

  const durationSeconds = durationMillis / 1000;
  const positionSeconds = positionMillis / 1000;

  const displayDuration =
    durationSeconds > 0 ? durationSeconds : (attachment.duration ?? 0);

  const fileSize = formatFileSize(attachment.fileSize);

  const primaryColor = own ? "#0F172A" : "#FFFFFF";
  const secondaryColor = own ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.45)";
  const tertiaryColor = own ? "rgba(0,0,0,0.42)" : "rgba(255,255,255,0.36)";
  const trackBg = own ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.12)";
  const cardBg = own ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.055)";
  const cardBorder = own ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";

  return (
    <View
      style={[
        styles.audioCard,
        { backgroundColor: cardBg, borderColor: cardBorder },
      ]}
      accessibilityLabel="Message vocal"
    >
      <Pressable
        onPress={() => void togglePlayback()}
        disabled={isLoading}
        accessibilityRole="button"
        accessibilityLabel={
          isPlaying ? "Mettre le vocal en pause" : "Lire le vocal"
        }
        accessibilityState={{ busy: isLoading }}
        style={({ pressed }) => [
          styles.playButton,
          pressed && styles.playButtonPressed,
        ]}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={primaryColor} />
        ) : (
          <Text style={[styles.playIcon, { color: primaryColor }]}>
            {isPlaying ? "Ⅱ" : "▶"}
          </Text>
        )}
      </Pressable>

      <View style={styles.audioContent}>
        <View style={styles.audioTitleRow}>
          <Text
            style={[styles.audioTitle, { color: primaryColor }]}
            numberOfLines={1}
          >
            Message vocal
          </Text>

          {fileSize ? (
            <Text style={[styles.audioSize, { color: tertiaryColor }]}>
              {fileSize}
            </Text>
          ) : null}
        </View>

        <View
          style={[styles.progressTrack, { backgroundColor: trackBg }]}
          accessibilityLabel="Progression du vocal"
        >
          <View
            style={[styles.progressFill, { width: `${progress * 100}%` }]}
          />
        </View>

        <View style={styles.timeRow}>
          <Text style={[styles.timeText, { color: secondaryColor }]}>
            {formatDuration(positionSeconds)}
          </Text>

          <Text style={[styles.timeText, { color: secondaryColor }]}>
            {formatDuration(displayDuration)}
          </Text>
        </View>

        {loadError ? (
          <Text style={styles.errorText} numberOfLines={2}>
            {loadError}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/* ============================================================================
 * IMAGE ATTACHMENT
 * ========================================================================== */

function ImageAttachment({
  attachment,
  own,
}: {
  attachment: AttachmentLike;
  own: boolean;
}) {
  const url = attachment.mediaUrl ?? null;

  const openExternal = useCallback(() => {
    if (!url) {
      return;
    }

    void Linking.openURL(url).catch(() => undefined);
  }, [url]);

  if (!url) {
    return <GenericAttachment attachment={attachment} own={own} />;
  }

  const size = computeMediaSize(attachment);

  return (
    <Pressable
      onPress={openExternal}
      accessibilityRole="imagebutton"
      accessibilityLabel={attachment.fileName ?? "Image"}
      style={({ pressed }) => [
        styles.mediaFrame,
        { width: size.width, height: size.height },
        pressed && styles.mediaFramePressed,
      ]}
    >
      <Image
        source={{ uri: url }}
        style={styles.mediaImage}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
    </Pressable>
  );
}

/* ============================================================================
 * VIDEO ATTACHMENT
 * ========================================================================== */

function VideoAttachment({
  attachment,
  own,
}: {
  attachment: AttachmentLike;
  own: boolean;
}) {
  const url = attachment.mediaUrl ?? null;
  const thumbnail = attachment.thumbnailUrl ?? null;

  const openExternal = useCallback(() => {
    if (!url) {
      return;
    }

    void Linking.openURL(url).catch(() => undefined);
  }, [url]);

  if (!url) {
    return <GenericAttachment attachment={attachment} own={own} />;
  }

  const size = computeMediaSize(attachment);

  const fallbackBg = own ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";
  const fallbackIconColor = own ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.55)";

  return (
    <Pressable
      onPress={openExternal}
      accessibilityRole="button"
      accessibilityLabel="Lire la vidéo"
      style={({ pressed }) => [
        styles.mediaFrame,
        { width: size.width, height: size.height },
        pressed && styles.mediaFramePressed,
      ]}
    >
      {thumbnail ? (
        <Image
          source={{ uri: thumbnail }}
          style={styles.mediaImage}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={[styles.videoFallback, { backgroundColor: fallbackBg }]}>
          <Text
            style={[styles.videoFallbackIcon, { color: fallbackIconColor }]}
          >
            🎬
          </Text>
        </View>
      )}

      <View style={styles.videoOverlay} pointerEvents="none">
        <View style={styles.videoPlayButton}>
          <Text style={styles.videoPlayIcon}>▶</Text>
        </View>
      </View>
    </Pressable>
  );
}

/* ============================================================================
 * FALLBACK ATTACHMENT
 * ========================================================================== */

function GenericAttachment({
  attachment,
  own,
}: {
  attachment: AttachmentLike;
  own: boolean;
}) {
  const mimeType = attachment.fileMimeType ?? attachment.mimeType ?? "fichier";
  const fileName = attachment.fileName?.trim() || "Pièce jointe";
  const fileSize = formatFileSize(attachment.fileSize);

  const primaryColor = own ? "#0F172A" : "#FFFFFF";
  const secondaryColor = own ? "rgba(0,0,0,0.42)" : "rgba(255,255,255,0.42)";
  const iconBg = own ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)";
  const cardBg = own ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.045)";
  const cardBorder = own ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";

  return (
    <View
      style={[
        styles.fileCard,
        { backgroundColor: cardBg, borderColor: cardBorder },
      ]}
    >
      <View style={[styles.fileIcon, { backgroundColor: iconBg }]}>
        <Text style={[styles.fileIconText, { color: primaryColor }]}>
          {mimeType.startsWith("image/")
            ? "▧"
            : mimeType.startsWith("video/")
              ? "▶"
              : "↗"}
        </Text>
      </View>

      <View style={styles.fileContent}>
        <Text
          style={[styles.fileName, { color: primaryColor }]}
          numberOfLines={1}
        >
          {fileName}
        </Text>

        <Text style={[styles.fileMeta, { color: secondaryColor }]}>
          {fileSize || mimeType}
        </Text>
      </View>
    </View>
  );
}

/* ============================================================================
 * MAIN
 * ========================================================================== */

export function MessageAttachments({
  messageId,
  own = false,
}: MessageAttachmentsProps) {
  const attachments = useQuery(api.messages.attachments.getAttachments, {
    messageId,
  }) as AttachmentLike[] | undefined;

  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <View
      style={styles.container}
      accessibilityLabel="Pièces jointes du message"
    >
      {attachments.map((attachment, index) => {
        const key =
          attachment._id ??
          attachment.id ??
          attachment.fileId ??
          `${String(messageId)}-${index}`;

        if (isAudioAttachment(attachment)) {
          return (
            <AudioAttachment key={key} attachment={attachment} own={own} />
          );
        }

        if (isImageAttachment(attachment)) {
          return (
            <ImageAttachment key={key} attachment={attachment} own={own} />
          );
        }

        if (isVideoAttachment(attachment)) {
          return (
            <VideoAttachment key={key} attachment={attachment} own={own} />
          );
        }

        return (
          <GenericAttachment key={key} attachment={attachment} own={own} />
        );
      })}
    </View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  container: {
    width: "100%",
    minWidth: 0,
    marginTop: 8,
    gap: 8,
    alignItems: "flex-start",
  },

  /* ---- LECTEUR AUDIO ---- */

  audioCard: {
    width: AUDIO_CARD_WIDTH,
    height: AUDIO_CARD_HEIGHT,
    minWidth: AUDIO_CARD_WIDTH,
    maxWidth: AUDIO_CARD_WIDTH,
    minHeight: AUDIO_CARD_HEIGHT,
    maxHeight: AUDIO_CARD_HEIGHT,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",

    paddingHorizontal: 10,
    paddingVertical: 0,

    borderWidth: 1,
    borderRadius: 16,
  },

  playButton: {
    width: 42,
    height: 42,
    minWidth: 42,
    maxWidth: 42,
    minHeight: 42,
    maxHeight: 42,

    flexGrow: 0,
    flexShrink: 0,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 10,

    borderRadius: 21,
    backgroundColor: "rgba(99,102,241,0.28)",
  },

  playButtonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.94 }],
  },

  playIcon: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "800",
  },

  audioContent: {
    flex: 1,
    minWidth: 0,

    flexDirection: "column",
    justifyContent: "center",

    gap: 4,
  },

  audioTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  audioTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "700",
  },

  audioSize: {
    marginLeft: 6,
    fontSize: 9,
    lineHeight: 12,
  },

  progressTrack: {
    width: "100%",
    height: 4,
    overflow: "hidden",
    borderRadius: 2,
  },

  progressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#818CF8",
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  timeText: {
    fontSize: 9,
    lineHeight: 12,
  },

  errorText: {
    marginTop: 2,
    fontSize: 9,
    lineHeight: 12,
    color: "#EF4444",
  },

  /* ---- MÉDIA (image / vidéo) ---- */

  mediaFrame: {
    overflow: "hidden",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  mediaFramePressed: {
    opacity: 0.85,
  },

  mediaImage: {
    width: "100%",
    height: "100%",
  },

  videoFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  videoFallbackIcon: {
    fontSize: 32,
    opacity: 0.85,
  },

  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  videoPlayButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  videoPlayIcon: {
    fontSize: 20,
    marginLeft: 3,
    color: "#FFFFFF",
  },

  /* ---- FICHIER GÉNÉRIQUE ---- */

  fileCard: {
    width: AUDIO_CARD_WIDTH,
    minHeight: 58,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 10,
    paddingVertical: 8,

    borderWidth: 1,
    borderRadius: 14,
  },

  fileIcon: {
    width: 38,
    height: 38,
    flexGrow: 0,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderRadius: 12,
  },

  fileIconText: {
    fontSize: 16,
    fontWeight: "700",
  },

  fileContent: {
    flex: 1,
    minWidth: 0,
  },

  fileName: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },

  fileMeta: {
    marginTop: 2,
    fontSize: 9,
    lineHeight: 13,
  },
});

export default MessageAttachments;
