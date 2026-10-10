// src/features/messages/chat/components/MessageAttachments.tsx

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Audio } from "expo-av";

import { VideoView, useVideoPlayer } from "expo-video";

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

interface MediaViewerModalProps {
  visible: boolean;

  type: "image" | "video";

  url: string;

  fileName?: string;

  onClose: () => void;
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

    return {
      width: MEDIA_MAX_WIDTH,

      height: displayHeight,
    };
  }

  return {
    width: MEDIA_MAX_WIDTH,

    height: 195,
  };
}

/* ============================================================================

 * VIDEO PLAYER VIEW — monté uniquement à l'ouverture du modal

 *

 * Séparation volontaire : `useVideoPlayer` doit être appelé au niveau d'un

 * composant qui est monté exactement quand on a besoin de jouer la vidéo.

 * Cela évite le pattern fragile `replaceAsync` sur un player null.

 * ========================================================================== */

function VideoPlayerView({ url }: { url: string }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;

    p.muted = false;

    p.play();
  });

  useEffect(() => {
    return () => {
      try {
        player.pause();
      } catch {
        /* Best effort. */
      }
    };
  }, [player]);

  return (
    <VideoView
      player={player}
      style={styles.viewerMedia}
      nativeControls
      contentFit="contain"
      surfaceType="textureView"
      fullscreenOptions={{ enable: true }}
    />
  );
}

/* ============================================================================

 * MEDIA VIEWER MODAL — plein écran in-app

 * ========================================================================== */

function MediaViewerModal({
  visible,

  type,

  url,

  fileName,

  onClose,
}: MediaViewerModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.viewerRoot}>
        <Pressable
          onPress={onClose}
          style={styles.viewerBackdrop}
          accessibilityRole="button"
          accessibilityLabel="Fermer la visionneuse"
        />

        <View style={styles.viewerContent} pointerEvents="box-none">
          {visible && type === "image" ? (
            <Image
              source={{ uri: url }}
              style={styles.viewerMedia}
              resizeMode="contain"
              accessibilityLabel={fileName ?? "Image"}
              accessibilityIgnoresInvertColors
            />
          ) : null}

          {visible && type === "video" ? <VideoPlayerView url={url} /> : null}
        </View>

        <Pressable
          onPress={onClose}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          style={styles.viewerClose}
        >
          <Text style={styles.viewerCloseText}>×</Text>
        </Pressable>
      </View>
    </Modal>
  );
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

        {
          backgroundColor: cardBg,

          borderColor: cardBorder,
        },
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

 * IMAGE ATTACHMENT — viewer in-app

 * ========================================================================== */

function ImageAttachment({
  attachment,

  own,
}: {
  attachment: AttachmentLike;

  own: boolean;
}) {
  const url = attachment.mediaUrl ?? null;

  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading",
  );

  const [viewerOpen, setViewerOpen] = useState(false);

  const openViewer = useCallback(() => {
    if (!url) {
      return;
    }

    setViewerOpen(true);
  }, [url]);

  const closeViewer = useCallback(() => {
    setViewerOpen(false);
  }, []);

  if (!url) {
    return <GenericAttachment attachment={attachment} own={own} />;
  }

  const size = computeMediaSize(attachment);

  return (
    <>
      <Pressable
        onPress={openViewer}
        accessibilityRole="imagebutton"
        accessibilityLabel={attachment.fileName ?? "Image"}
        style={({ pressed }) => [
          styles.mediaFrame,

          {
            width: size.width,

            height: size.height,
          },

          pressed && styles.mediaFramePressed,
        ]}
      >
        <Image
          source={{ uri: url }}
          style={{
            width: size.width,

            height: size.height,
          }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          onLoadStart={() => {
            setStatus("loading");
          }}
          onLoad={() => {
            setStatus("loaded");
          }}
          onError={(event) => {
            console.error(
              "[MessageAttachments] Image load error",

              url,

              event.nativeEvent,
            );

            setStatus("error");
          }}
        />

        {status === "loading" ? (
          <View style={styles.imageOverlay} pointerEvents="none">
            <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />
          </View>
        ) : null}

        {status === "error" ? (
          <View style={styles.imageOverlay} pointerEvents="none">
            <Text style={styles.imageErrorText}>Image indisponible</Text>
          </View>
        ) : null}
      </Pressable>

      <MediaViewerModal
        visible={viewerOpen}
        type="image"
        url={url}
        fileName={attachment.fileName}
        onClose={closeViewer}
      />
    </>
  );
}

/* ============================================================================

 * VIDEO ATTACHMENT — viewer in-app

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

  const hasThumbnail =
    typeof thumbnail === "string" && thumbnail.trim().length > 0;

  const [viewerOpen, setViewerOpen] = useState(false);

  const openViewer = useCallback(() => {
    if (!url) {
      return;
    }

    setViewerOpen(true);
  }, [url]);

  const closeViewer = useCallback(() => {
    setViewerOpen(false);
  }, []);

  if (!url) {
    return <GenericAttachment attachment={attachment} own={own} />;
  }

  const size = computeMediaSize(attachment);

  const durationSeconds = attachment.duration ?? 0;

  const durationLabel =
    durationSeconds > 0 ? formatDuration(durationSeconds) : null;

  return (
    <>
      <View
        style={[
          styles.mediaFrame,

          {
            width: size.width,

            height: size.height,
          },
        ]}
        accessibilityLabel={attachment.fileName ?? "Vidéo"}
      >
        {hasThumbnail ? (
          <Image
            source={{ uri: thumbnail }}
            style={{
              width: size.width,

              height: size.height,
            }}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={styles.videoBackground} />
        )}

        {durationLabel ? (
          <View style={styles.videoDurationPill}>
            <Text style={styles.videoDurationText}>{durationLabel}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={openViewer}
          accessibilityRole="button"
          accessibilityLabel="Lire la vidéo"
          hitSlop={16}
          style={styles.videoPlayCircle}
        >
          <View style={styles.videoPlayTriangle} />
        </Pressable>
      </View>

      <MediaViewerModal
        visible={viewerOpen}
        type="video"
        url={url}
        fileName={attachment.fileName}
        onClose={closeViewer}
      />
    </>
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

        {
          backgroundColor: cardBg,

          borderColor: cardBorder,
        },
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

  /* --------------------------------------------------------------------------

   * VIEWER MODAL

   * ------------------------------------------------------------------------ */

  viewerRoot: {
    flex: 1,
  },

  viewerBackdrop: {
    ...StyleSheet.absoluteFillObject,

    backgroundColor: "#000000",
  },

  viewerContent: {
    ...StyleSheet.absoluteFillObject,

    alignItems: "center",

    justifyContent: "center",
  },

  viewerMedia: {
    width: "100%",

    height: "100%",
  },

  viewerClose: {
    position: "absolute",

    top: 56,

    right: 20,

    zIndex: 10,

    width: 44,

    height: 44,

    borderRadius: 22,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: "rgba(255,255,255,0.15)",
  },

  viewerCloseText: {
    fontSize: 28,

    lineHeight: 30,

    color: "#FFFFFF",

    fontWeight: "300",
  },

  /* --------------------------------------------------------------------------

   * AUDIO

   * ------------------------------------------------------------------------ */

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

  /* --------------------------------------------------------------------------

   * IMAGE / VIDEO

   * ------------------------------------------------------------------------ */

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

  imageOverlay: {
    ...StyleSheet.absoluteFillObject,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: "rgba(0,0,0,0.35)",
  },

  imageErrorText: {
    fontSize: 11,

    fontWeight: "600",

    color: "rgba(255,255,255,0.7)",
  },

  videoBackground: {
    ...StyleSheet.absoluteFillObject,

    backgroundColor: "#000000",
  },

  videoPlayCircle: {
    position: "absolute",

    top: "50%",

    left: "50%",

    width: 72,

    height: 72,

    marginTop: -36,

    marginLeft: -36,

    borderRadius: 36,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: "rgba(255,255,255,0.95)",

    shadowColor: "#000000",

    shadowOffset: {
      width: 0,

      height: 2,
    },

    shadowOpacity: 0.35,

    shadowRadius: 6,

    elevation: 6,
  },

  videoPlayTriangle: {
    width: 0,

    height: 0,

    borderTopWidth: 12,

    borderBottomWidth: 12,

    borderLeftWidth: 20,

    borderTopColor: "transparent",

    borderBottomColor: "transparent",

    borderLeftColor: "#000000",

    marginLeft: 5,
  },

  videoDurationPill: {
    position: "absolute",

    right: 10,

    bottom: 10,

    paddingHorizontal: 8,

    paddingVertical: 3,

    borderRadius: 6,

    backgroundColor: "rgba(0,0,0,0.65)",
  },

  videoDurationText: {
    fontSize: 11,

    lineHeight: 14,

    fontWeight: "600",

    color: "#FFFFFF",
  },

  /* --------------------------------------------------------------------------

   * GENERIC FILE

   * ------------------------------------------------------------------------ */

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
