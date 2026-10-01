import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import { useMutation } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import { useMessageComposer } from "../hooks/useMessageComposer";
import { ReplyPreview } from "./ReplyPreview";

interface MessageComposerProps {
  conversationId: Id<"conversations">;
}

interface SelectedMedia {
  id: string;
  uri: string;
  fileName: string;
  mimeType: string;
  fileSize?: number;
  kind: "image" | "video";
  width?: number;
  height?: number;
  duration?: number;
}

type ComposerTool =
  | "location"
  | "contact"
  | "event"
  | "job"
  | "property"
  | "poll"
  | "payment"
  | null;

const EMOJIS = [
  "😀",
  "😂",
  "😍",
  "🥰",
  "😊",
  "😉",
  "😎",
  "😭",
  "😡",
  "👍",
  "👎",
  "❤️",
  "🔥",
  "🎉",
  "🙏",
  "👏",
  "💯",
  "✨",
  "🚀",
  "💪",
  "🤣",
  "🤝",
  "🥳",
  "❤️‍🔥",
  "👌",
  "🙌",
  "😅",
  "🤔",
  "😮",
  "😢",
];

const TOOL_ITEMS: Array<{
  key: Exclude<ComposerTool, null>;
  icon: string;
  title: string;
  description: string;
}> = [
  {
    key: "location",
    icon: "📍",
    title: "Localisation",
    description: "Partager une position",
  },
  {
    key: "contact",
    icon: "👤",
    title: "Contact",
    description: "Partager un contact",
  },
  {
    key: "event",
    icon: "📅",
    title: "Événement",
    description: "Partager un événement",
  },
  {
    key: "job",
    icon: "💼",
    title: "Emploi",
    description: "Partager une offre",
  },
  {
    key: "property",
    icon: "🏠",
    title: "Immobilier",
    description: "Partager un bien",
  },
  {
    key: "poll",
    icon: "📊",
    title: "Sondage",
    description: "Créer un sondage",
  },
  {
    key: "payment",
    icon: "💳",
    title: "Paiement",
    description: "Partager un paiement",
  },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} o`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} Ko`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatRecordingTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remaining = (seconds % 60).toString().padStart(2, "0");

  return `${minutes}:${remaining}`;
}

function createSelectedMedia(
  asset: ImagePicker.ImagePickerAsset,
): SelectedMedia {
  const kind: SelectedMedia["kind"] =
    asset.type === "video" ? "video" : "image";

  return {
    id: `${asset.uri}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    uri: asset.uri,
    fileName: asset.fileName ?? (kind === "video" ? "video.mp4" : "image.jpg"),
    mimeType: asset.mimeType ?? (kind === "video" ? "video/mp4" : "image/jpeg"),
    fileSize: asset.fileSize,
    kind,
    width: asset.width,
    height: asset.height,
    duration: asset.duration,
  };
}

function isStorageUploadResponse(
  value: unknown,
): value is { storageId: string } {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("storageId" in value)) {
    return false;
  }

  return typeof value.storageId === "string" && value.storageId.length > 0;
}

export function MessageComposer({ conversationId }: MessageComposerProps) {
  const composer = useMessageComposer(conversationId);

  const sendMessage = useMutation(api.messages.messages.send);
  const generateUploadUrl = useMutation(
    api.messages.attachments.generateUploadUrl,
  );
  const addAttachment = useMutation(api.messages.attachments.addAttachment);

  const inputRef = useRef<TextInput | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const [showAttachments, setShowAttachments] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([]);
  const [activeTool, setActiveTool] = useState<ComposerTool>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const hasText = composer.text.trim().length > 0;
  const hasMedia = selectedMedia.length > 0;
  const isBusy = isSubmitting || isRecording;

  useEffect(() => {
    if (!isRecording) {
      setRecordingSeconds(0);
      return;
    }

    const startedAt = Date.now();

    const timer = setInterval(() => {
      setRecordingSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 500);

    return () => clearInterval(timer);
  }, [isRecording]);

  useEffect(() => {
    return () => {
      const recording = recordingRef.current;

      if (recording) {
        void recording.stopAndUnloadAsync().catch(() => undefined);
        recordingRef.current = null;
      }
    };
  }, []);

  const focusComposer = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const closeMenus = useCallback(() => {
    setShowAttachments(false);
    setShowEmojiPicker(false);
  }, []);

  const insertEmoji = useCallback(
    (emoji: string) => {
      composer.setText(`${composer.text}${emoji}`);
      setShowEmojiPicker(false);
      focusComposer();
    },
    [composer.text, composer.setText, focusComposer],
  );

  const ingestAssets = useCallback((assets: ImagePicker.ImagePickerAsset[]) => {
    const additions = assets.map(createSelectedMedia);
    setSelectedMedia((current) => [...current, ...additions]);
  }, []);

  const pickFromGallery = useCallback(async () => {
    setAttachmentError(null);
    closeMenus();

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setAttachmentError("Permission galerie refusée.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.9,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    ingestAssets(result.assets);
  }, [closeMenus, ingestAssets]);

  const pickFromCamera = useCallback(async () => {
    setAttachmentError(null);
    closeMenus();

    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      setAttachmentError("Permission caméra refusée.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.9,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    ingestAssets(result.assets);
  }, [closeMenus, ingestAssets]);

  const removeMedia = useCallback((id: string) => {
    setSelectedMedia((current) => current.filter((media) => media.id !== id));
  }, []);

  const uploadUri = useCallback(
    async (uri: string, mimeType: string): Promise<string> => {
      const uploadUrl = await generateUploadUrl();

      const response = await fetch(uri);

      if (!response.ok) {
        throw new Error("Impossible de lire le fichier sélectionné.");
      }

      const blob = await response.blob();

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": mimeType,
        },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Échec de l'upload (${uploadResponse.status}).`);
      }

      const payload: unknown = await uploadResponse.json();

      if (!isStorageUploadResponse(payload)) {
        throw new Error("Réponse Convex invalide pendant l'upload.");
      }

      return payload.storageId;
    },
    [generateUploadUrl],
  );

  const sendCurrentMessage = useCallback(async () => {
    if (isSubmitting || !conversationId) {
      return;
    }

    if (!hasText && !hasMedia) {
      return;
    }

    setIsSubmitting(true);
    setAttachmentError(null);

    try {
      const createdMessage = await sendMessage({
        conversationId,
        text: composer.text.trim(),
        ...(composer.replyTo ? { replyToId: composer.replyTo._id } : {}),
        ...(composer.sharedPublicationId
          ? { sharedPublicationId: composer.sharedPublicationId }
          : {}),
      });

      for (const media of selectedMedia) {
        const storageId = await uploadUri(media.uri, media.mimeType);

        await addAttachment({
          messageId: createdMessage._id,
          fileId: storageId,
          fileName: media.fileName,
          mimeType: media.mimeType,
          fileSize: media.fileSize ?? 0,
          width: media.width,
          height: media.height,
          duration: media.duration,
        });
      }

      composer.reset();
      setSelectedMedia([]);
      setActiveTool(null);
      closeMenus();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible d'envoyer le message.";

      setAttachmentError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    addAttachment,
    closeMenus,
    composer.reset,
    composer.replyTo,
    composer.sharedPublicationId,
    composer.text,
    conversationId,
    hasMedia,
    hasText,
    isSubmitting,
    selectedMedia,
    sendMessage,
    uploadUri,
  ]);

  const startRecording = useCallback(async () => {
    if (isRecording || isSubmitting) {
      return;
    }

    setAttachmentError(null);
    closeMenus();

    try {
      const permission = await Audio.requestPermissionsAsync();

      if (!permission.granted) {
        setAttachmentError("Permission microphone refusée.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );

      recordingRef.current = recording;
      setRecordingSeconds(0);
      setIsRecording(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de démarrer l'enregistrement.";

      setAttachmentError(message);
      recordingRef.current = null;
      setIsRecording(false);
    }
  }, [closeMenus, isRecording, isSubmitting]);

  const cancelRecording = useCallback(async () => {
    const recording = recordingRef.current;

    recordingRef.current = null;
    setIsRecording(false);
    setRecordingSeconds(0);

    if (!recording) {
      return;
    }

    try {
      await recording.stopAndUnloadAsync();
    } catch {
      // Rien à envoyer : le fichier local est abandonné.
    } finally {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      }).catch(() => undefined);
    }
  }, []);

  const sendRecording = useCallback(async () => {
    const recording = recordingRef.current;

    if (!recording || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setAttachmentError(null);

    try {
      const status = await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      recordingRef.current = null;
      setIsRecording(false);

      if (!uri) {
        throw new Error("Enregistrement vocal introuvable.");
      }

      const storageId = await uploadUri(uri, "audio/mp4");

      const createdMessage = await sendMessage({
        conversationId,
        text: "",
      });

      await addAttachment({
        messageId: createdMessage._id,
        fileId: storageId,
        fileName: `message-vocal-${Date.now()}.m4a`,
        mimeType: "audio/mp4",
        fileSize: 0,
        duration: Math.max(1, status.durationMillis / 1000),
      });

      composer.reset();
      closeMenus();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible d'envoyer le vocal.";

      setAttachmentError(message);
      setIsRecording(false);
    } finally {
      recordingRef.current = null;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      }).catch(() => undefined);

      setIsSubmitting(false);
    }
  }, [
    addAttachment,
    closeMenus,
    composer.reset,
    conversationId,
    isSubmitting,
    sendMessage,
    uploadUri,
  ]);

  const handleToolClick = useCallback(
    (tool: Exclude<ComposerTool, null>) => {
      setActiveTool(tool);
      closeMenus();
    },
    [closeMenus],
  );

  const canSend = !isBusy && (hasText || hasMedia);

  return (
    <View style={styles.container}>
      {composer.replyTo && (
        <View style={styles.replyBar}>
          <View style={styles.replyAccent} />

          <View style={styles.replyContent}>
            <Text style={styles.replyLabel}>Réponse</Text>

            <ReplyPreview replyToId={composer.replyTo._id} own={false} />
          </View>

          <Pressable
            onPress={composer.cancelReply}
            style={styles.iconButton}
            accessibilityLabel="Annuler la réponse"
          >
            <Text style={styles.iconText}>×</Text>
          </Pressable>
        </View>
      )}

      {activeTool && (
        <View style={styles.toolBanner}>
          <Text style={styles.toolIcon}>
            {TOOL_ITEMS.find((item) => item.key === activeTool)?.icon}
          </Text>

          <Text style={styles.toolTitle}>
            {TOOL_ITEMS.find((item) => item.key === activeTool)?.title}
          </Text>

          <Pressable
            onPress={() => setActiveTool(null)}
            style={styles.toolCancel}
          >
            <Text style={styles.toolCancelText}>Annuler</Text>
          </Pressable>
        </View>
      )}

      {(composer.error || attachmentError) && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>
            {composer.error ?? attachmentError}
          </Text>
        </View>
      )}

      {selectedMedia.length > 0 && (
        <View style={styles.mediaContainer}>
          <View style={styles.mediaHeader}>
            <Text style={styles.mediaHeaderText}>
              Pièces jointes · {selectedMedia.length}
            </Text>

            <Pressable
              onPress={() => setSelectedMedia([])}
              accessibilityLabel="Supprimer toutes les pièces jointes"
            >
              <Text style={styles.clearText}>Tout retirer</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mediaRow}
          >
            {selectedMedia.map((media) => (
              <View key={media.id} style={styles.mediaCard}>
                {media.kind === "image" ? (
                  <Image
                    source={{ uri: media.uri }}
                    style={styles.mediaImage}
                    resizeMode="cover"
                    accessibilityLabel={media.fileName}
                  />
                ) : (
                  <View style={styles.videoPlaceholder}>
                    <Text style={styles.videoIcon}>▶</Text>
                    <Text style={styles.videoName} numberOfLines={2}>
                      {media.fileName}
                    </Text>
                  </View>
                )}

                {media.fileSize !== undefined && (
                  <View style={styles.fileSizeBadge}>
                    <Text style={styles.fileSizeText}>
                      {formatFileSize(media.fileSize)}
                    </Text>
                  </View>
                )}

                <Pressable
                  onPress={() => removeMedia(media.id)}
                  style={styles.mediaRemove}
                  accessibilityLabel={`Supprimer ${media.fileName}`}
                >
                  <Text style={styles.mediaRemoveText}>×</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {showAttachments && !isRecording && (
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Partager</Text>

            <Pressable
              onPress={() => setShowAttachments(false)}
              accessibilityLabel="Fermer"
            >
              <Text style={styles.iconText}>×</Text>
            </Pressable>
          </View>

          <View style={styles.toolGrid}>
            <Pressable
              onPress={() => void pickFromCamera()}
              style={styles.toolButton}
            >
              <Text style={styles.toolButtonIcon}>📷</Text>
              <Text style={styles.toolButtonText}>Caméra</Text>
            </Pressable>

            <Pressable
              onPress={() => void pickFromGallery()}
              style={styles.toolButton}
            >
              <Text style={styles.toolButtonIcon}>🖼️</Text>
              <Text style={styles.toolButtonText}>Galerie</Text>
            </Pressable>

            <Pressable
              onPress={() => void startRecording()}
              style={styles.toolButton}
            >
              <Text style={styles.toolButtonIcon}>🎙️</Text>
              <Text style={styles.toolButtonText}>Vocal</Text>
            </Pressable>

            {TOOL_ITEMS.map((tool) => (
              <Pressable
                key={tool.key}
                onPress={() => handleToolClick(tool.key)}
                style={styles.toolButton}
              >
                <Text style={styles.toolButtonIcon}>{tool.icon}</Text>

                <Text style={styles.toolButtonText}>{tool.title}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {showEmojiPicker && !isRecording && (
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Emoji</Text>

            <Pressable
              onPress={() => setShowEmojiPicker(false)}
              accessibilityLabel="Fermer"
            >
              <Text style={styles.iconText}>×</Text>
            </Pressable>
          </View>

          <View style={styles.emojiGrid}>
            {EMOJIS.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => insertEmoji(emoji)}
                style={styles.emojiButton}
                accessibilityLabel={`Ajouter ${emoji}`}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {isRecording && (
        <View style={styles.recordingBar}>
          <View style={styles.recordingDot} />

          <View style={styles.recordingInfo}>
            <Text style={styles.recordingTitle}>Message vocal</Text>

            <Text style={styles.recordingTime}>
              {formatRecordingTime(recordingSeconds)}
            </Text>
          </View>

          <Pressable
            onPress={() => void cancelRecording()}
            style={styles.recordingCancel}
            accessibilityLabel="Annuler le vocal"
          >
            <Text style={styles.recordingCancelText}>Annuler</Text>
          </Pressable>

          <Pressable
            onPress={() => void sendRecording()}
            style={styles.recordingSend}
            accessibilityLabel="Envoyer le vocal"
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Text style={styles.recordingSendText}>➤</Text>
            )}
          </Pressable>
        </View>
      )}

      {!isRecording && (
        <>
          <View style={styles.inputRow}>
            <Pressable
              onPress={() => {
                setShowAttachments((value) => !value);
                setShowEmojiPicker(false);
              }}
              style={styles.iconButton}
              accessibilityLabel="Ajouter une pièce jointe"
            >
              <Text style={styles.plusIcon}>＋</Text>
            </Pressable>

            <TextInput
              ref={inputRef}
              value={composer.text}
              onChangeText={composer.setText}
              placeholder="Écrire un message..."
              placeholderTextColor="rgba(255,255,255,0.30)"
              style={styles.input}
              multiline
              maxLength={10000}
              editable={!isSubmitting}
              textAlignVertical="center"
              returnKeyType="default"
              accessibilityLabel="Message"
            />

            <Pressable
              onPress={() => {
                setShowEmojiPicker((value) => !value);
                setShowAttachments(false);
              }}
              style={styles.iconButton}
              accessibilityLabel="Choisir un emoji"
            >
              <Text style={styles.iconText}>😊</Text>
            </Pressable>

            {canSend ? (
              <Pressable
                onPress={() => void sendCurrentMessage()}
                disabled={!canSend}
                style={[
                  styles.sendButton,
                  canSend
                    ? styles.sendButtonEnabled
                    : styles.sendButtonDisabled,
                ]}
                accessibilityLabel="Envoyer le message"
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Text style={styles.sendIcon}>➤</Text>
                )}
              </Pressable>
            ) : (
              <Pressable
                onPress={() => void startRecording()}
                disabled={isSubmitting}
                style={styles.iconButton}
                accessibilityLabel="Enregistrer un message vocal"
              >
                <Text style={styles.iconText}>🎙️</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {isSubmitting
                ? "Envoi en cours…"
                : hasMedia
                  ? `${selectedMedia.length} pièce(s) jointe(s)`
                  : "Messages DébrouillePro"}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#050505",
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
  },

  replyBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.22)",
    backgroundColor: "rgba(139,92,246,0.08)",
  },

  replyAccent: {
    width: 3,
    height: 34,
    marginRight: 10,
    borderRadius: 2,
    backgroundColor: "#8B5CF6",
  },

  replyContent: {
    flex: 1,
    minWidth: 0,
  },

  replyLabel: {
    marginBottom: 3,
    fontSize: 10,
    fontWeight: "700",
    color: "#C4B5FD",
  },

  toolBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(139,92,246,0.08)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.18)",
  },

  toolIcon: {
    marginRight: 8,
    fontSize: 17,
  },

  toolTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#DDD6FE",
  },

  toolCancel: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },

  toolCancelText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
  },

  errorBanner: {
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.20)",
    backgroundColor: "rgba(239,68,68,0.07)",
  },

  errorText: {
    fontSize: 11,
    lineHeight: 16,
    color: "#FCA5A5",
  },

  mediaContainer: {
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.035)",
    overflow: "hidden",
  },

  mediaHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  mediaHeaderText: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.75)",
  },

  clearText: {
    fontSize: 10,
    color: "#C4B5FD",
  },

  mediaRow: {
    flexDirection: "row",
    padding: 8,
  },

  mediaCard: {
    width: 82,
    height: 82,
    marginRight: 8,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#111111",
  },

  mediaImage: {
    width: "100%",
    height: "100%",
  },

  videoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },

  videoIcon: {
    marginBottom: 4,
    fontSize: 24,
    color: "#FFFFFF",
  },

  videoName: {
    fontSize: 9,
    lineHeight: 12,
    textAlign: "center",
    color: "rgba(255,255,255,0.55)",
  },

  fileSizeBadge: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 5,
    paddingVertical: 2,
    backgroundColor: "rgba(0,0,0,0.72)",
  },

  fileSizeText: {
    fontSize: 8,
    color: "rgba(255,255,255,0.70)",
  },

  mediaRemove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.75)",
  },

  mediaRemoveText: {
    fontSize: 16,
    lineHeight: 18,
    color: "#FFFFFF",
  },

  panel: {
    marginBottom: 8,
    padding: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "#0D0F16",
  },

  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 4,
  },

  panelTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  toolGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  toolButton: {
    width: "25%",
    minHeight: 66,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 12,
  },

  toolButtonIcon: {
    marginBottom: 5,
    fontSize: 22,
  },

  toolButtonText: {
    fontSize: 9,
    fontWeight: "600",
    color: "rgba(255,255,255,0.60)",
  },

  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },

  emojiButton: {
    width: "12.5%",
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },

  emoji: {
    fontSize: 20,
  },

  recordingBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.24)",
    backgroundColor: "rgba(239,68,68,0.08)",
  },

  recordingDot: {
    width: 9,
    height: 9,
    marginRight: 9,
    borderRadius: 5,
    backgroundColor: "#EF4444",
  },

  recordingInfo: {
    flex: 1,
    minWidth: 0,
  },

  recordingTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  recordingTime: {
    marginTop: 2,
    fontSize: 11,
    color: "#FCA5A5",
  },

  recordingCancel: {
    marginRight: 6,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },

  recordingCancelText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.50)",
  },

  recordingSend: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },

  recordingSendText: {
    fontSize: 16,
    color: "#000000",
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 130,
    paddingHorizontal: 7,
    paddingVertical: 10,
    fontSize: 15,
    lineHeight: 21,
    color: "#FFFFFF",
  },

  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },

  plusIcon: {
    fontSize: 27,
    lineHeight: 29,
    color: "rgba(255,255,255,0.65)",
  },

  iconText: {
    fontSize: 19,
    color: "rgba(255,255,255,0.55)",
  },

  sendButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },

  sendButtonEnabled: {
    backgroundColor: "#FFFFFF",
  },

  sendButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  sendIcon: {
    fontSize: 17,
    color: "#000000",
  },

  footer: {
    minHeight: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 3,
  },

  footerText: {
    fontSize: 8,
    color: "rgba(255,255,255,0.18)",
  },
});

export default MessageComposer;
