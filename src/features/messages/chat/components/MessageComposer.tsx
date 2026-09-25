import {
  View,
  Text,
  Pressable,
  Image,
  TextInput,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useMutation } from "convex/react";
import { useCallback, useRef, useState } from "react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import { useMessageComposer } from "../hooks/useMessageComposer";
import { useVoiceRecorder } from "../../voice/hooks/useVoiceRecorder";

import { ReplyPreview } from "./ReplyPreview";

interface MessageComposerProps {
  conversationId: Id<"conversations">;
}

interface NativeSelectedFile {
  id: string;
  uri: string;
  storageId: string | null;
  isUploading: boolean;
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
  "🤣",
  "😍",
  "🥰",
  "😘",
  "😎",
  "😊",
  "😉",
  "🤩",
  "😭",
  "😡",
  "😱",
  "🤔",
  "😴",
  "👍",
  "👎",
  "👏",
  "🙌",
  "💪",
  "❤",
  "🔥",
  "🎉",
  "💯",
  "✨",
  "🚀",
  "💙",
  "💚",
  "💛",
  "💜",
];

const TOOL_ITEMS: Array<{
  key: Exclude<ComposerTool, null>;
  icon: string;
  title: string;
  description: string;
}> = [
  { key: "location", icon: "📍", title: "Localisation", description: "Partager une position" },
  { key: "contact", icon: "👤", title: "Contact", description: "Partager un contact" },
  { key: "event", icon: "📅", title: "Événement", description: "Partager un événement" },
  { key: "job", icon: "💼", title: "Job", description: "Partager une offre" },
  { key: "property", icon: "🏠", title: "Immobilier", description: "Partager un bien" },
  { key: "poll", icon: "📊", title: "Sondage", description: "Créer un sondage" },
  { key: "payment", icon: "💳", title: "Paiement", description: "Envoyer une demande" },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatRecordingTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function isStorageResponse(
  value: unknown,
): value is { storageId: string } {
  if (typeof value !== "object" || value === null) return false;
  if (!("storageId" in value)) return false;
  const candidate: unknown = value.storageId;
  return typeof candidate === "string";
}

function buildSelectedFile(asset: ImagePicker.ImagePickerAsset): NativeSelectedFile {
  const kind: NativeSelectedFile["kind"] = asset.type === "video" ? "video" : "image";

  return {
    id: `${asset.uri}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    uri: asset.uri,
    storageId: null,
    isUploading: true,
    fileName: asset.fileName ?? (kind === "video" ? "video.mp4" : "image.jpg"),
    mimeType: asset.mimeType ?? (kind === "video" ? "video/mp4" : "image/jpeg"),
    fileSize: asset.fileSize ?? undefined,
    kind,
    width: asset.width ?? undefined,
    height: asset.height ?? undefined,
    duration: asset.duration ?? undefined,
  };
}

export function MessageComposer({ conversationId }: MessageComposerProps) {
  const composer = useMessageComposer(conversationId);
  const voice = useVoiceRecorder();

  const sendMessage = useMutation(api.messages.messages.send);
  const generateUploadUrl = useMutation(
    api.messages.attachments.generateUploadUrl,
  );
  const addAttachment = useMutation(api.messages.attachments.addAttachment);

  const inputRef = useRef<TextInput | null>(null);

  const [showAttachments, setShowAttachments] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<NativeSelectedFile[]>([]);
  const [activeTool, setActiveTool] = useState<ComposerTool>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasText = composer.text.trim().length > 0;
  const hasFiles = selectedFiles.length > 0;
  const uploadsInFlight = selectedFiles.some((f) => f.isUploading);
  const uploadedFiles = selectedFiles.filter(
    (f) => f.storageId !== null && !f.isUploading,
  );
  const isBusy = isSubmitting || voice.isRecording;

  const focusComposer = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const closeMenus = useCallback(() => {
    setShowAttachments(false);
    setShowEmojiPicker(false);
  }, []);

  const uploadFile = useCallback(
    async (file: NativeSelectedFile) => {
      try {
        const uploadUrl = await generateUploadUrl();
        const blob = await (await fetch(file.uri)).blob();
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.mimeType },
          body: blob,
        });

        if (!response.ok) {
          throw new Error(`Upload failed (${response.status})`);
        }

        const payload: unknown = await response.json();

        if (!isStorageResponse(payload)) {
          throw new Error("Réponse Convex invalide");
        }

        const storageId = payload.storageId;

        setSelectedFiles((current) =>
          current.map((f) =>
            f.id === file.id ? { ...f, storageId, isUploading: false } : f,
          ),
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload échoué";
        setSelectedFiles((current) => current.filter((f) => f.id !== file.id));
        setAttachmentError(`${file.fileName} : ${msg}`);
      }
    },
    [generateUploadUrl],
  );

  const ingestAssets = useCallback(
    (assets: ImagePicker.ImagePickerAsset[]) => {
      const additions = assets.map(buildSelectedFile);
      setSelectedFiles((current) => [...current, ...additions]);
      additions.forEach((file) => void uploadFile(file));
    },
    [uploadFile],
  );

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
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.length) return;
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
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.length) return;
    ingestAssets(result.assets);
  }, [closeMenus, ingestAssets]);

  const removeSelectedFile = useCallback((id: string) => {
    setSelectedFiles((current) => current.filter((f) => f.id !== id));
  }, []);

  const insertEmoji = useCallback(
    (emoji: string) => {
      composer.setText(`${composer.text}${emoji}`);
      setShowEmojiPicker(false);
      focusComposer();
    },
    [composer, focusComposer],
  );

  const startVoice = async () => {
    setAttachmentError(null);
    closeMenus();
    try {
      await voice.startRecording();
    } catch {
      // erreur exposée par useVoiceRecorder
    }
  };

  const handleToolClick = (tool: Exclude<ComposerTool, null>) => {
    setActiveTool(tool);
    closeMenus();
  };

  const handleSend = useCallback(async () => {
    if (isSubmitting || uploadsInFlight || !conversationId) return;
    if (!hasText && !hasFiles) return;

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

      if (uploadedFiles.length > 0) {
        const messageId = createdMessage._id;

        for (const file of uploadedFiles) {
          if (!file.storageId) continue;
          await addAttachment({
            messageId,
            fileId: file.storageId,
            fileName: file.fileName,
            mimeType: file.mimeType,
            fileSize: file.fileSize ?? 0,
            width: file.width,
            height: file.height,
            duration: file.duration,
          });
        }
      }

      composer.reset();
      setSelectedFiles([]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Envoi impossible";
      setAttachmentError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    uploadsInFlight,
    conversationId,
    hasText,
    hasFiles,
    sendMessage,
    uploadedFiles,
    addAttachment,
    composer,
  ]);

  const canSend = !isBusy && !uploadsInFlight && (hasText || hasFiles);

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
          <Pressable onPress={() => setActiveTool(null)} style={styles.toolCancel}>
            <Text style={styles.toolCancelText}>Annuler</Text>
          </Pressable>
        </View>
      )}

      {(voice.error || attachmentError) && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{voice.error ?? attachmentError}</Text>
        </View>
      )}

      {hasFiles && (
        <View style={styles.filesContainer}>
          <View style={styles.filesHeader}>
            <Text style={styles.filesHeaderText}>
              {`Pièces jointes (${selectedFiles.length})`}
            </Text>
            <Pressable onPress={() => setSelectedFiles([])}>
              <Text style={styles.filesClear}>Tout retirer</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filesRow}
          >
            {selectedFiles.map((item) => (
              <View key={item.id} style={styles.fileCard}>
                {item.kind === "image" ? (
                  <Image
                    style={styles.fileThumb}
                    source={{ uri: item.uri }}
                    accessibilityLabel={item.fileName}
                  />
                ) : (
                  <View style={styles.filePlaceholder}>
                    <Text style={styles.filePlaceholderIcon}>🎬</Text>
                    <Text style={styles.filePlaceholderName} numberOfLines={1}>
                      {item.fileName}
                    </Text>
                  </View>
                )}

                {item.isUploading && (
                  <View style={styles.fileOverlay}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  </View>
                )}

                {!item.isUploading && item.fileSize !== undefined && (
                  <View style={styles.fileSizeBadge}>
                    <Text style={styles.fileSizeText}>
                      {formatFileSize(item.fileSize)}
                    </Text>
                  </View>
                )}

                <Pressable
                  onPress={() => removeSelectedFile(item.id)}
                  style={styles.fileRemove}
                  accessibilityLabel={`Supprimer ${item.fileName}`}
                >
                  <Text style={styles.fileRemoveText}>×</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {showAttachments && (
        <View style={styles.attachPanel}>
          <View style={styles.attachHeader}>
            <Text style={styles.attachTitle}>Ajouter</Text>
            <Pressable onPress={() => setShowAttachments(false)}>
              <Text style={styles.iconText}>×</Text>
            </Pressable>
          </View>

          <Pressable onPress={pickFromCamera} style={styles.attachItem}>
            <Text style={styles.attachIcon}>📷</Text>
            <View style={styles.attachTextWrapper}>
              <Text style={styles.attachItemTitle}>Caméra</Text>
              <Text style={styles.attachItemSub}>Prendre une photo</Text>
            </View>
          </Pressable>

          <Pressable onPress={pickFromGallery} style={styles.attachItem}>
            <Text style={styles.attachIcon}>🖼️</Text>
            <View style={styles.attachTextWrapper}>
              <Text style={styles.attachItemTitle}>Galerie</Text>
              <Text style={styles.attachItemSub}>Photos et vidéos</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => void startVoice()}
            disabled={voice.isRecording}
            style={styles.attachItem}
          >
            <Text style={styles.attachIcon}>🎙️</Text>
            <View style={styles.attachTextWrapper}>
              <Text style={styles.attachItemTitle}>Message vocal</Text>
              <Text style={styles.attachItemSub}>Enregistrer un vocal</Text>
            </View>
          </Pressable>

          <View style={styles.attachSeparator} />

          {TOOL_ITEMS.map((tool) => (
            <Pressable
              key={tool.key}
              onPress={() => handleToolClick(tool.key)}
              style={styles.attachItem}
            >
              <Text style={styles.attachIcon}>{tool.icon}</Text>
              <View style={styles.attachTextWrapper}>
                <Text style={styles.attachItemTitle}>{tool.title}</Text>
                <Text style={styles.attachItemSub}>{tool.description}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {showEmojiPicker && (
        <View style={styles.emojiPanel}>
          <View style={styles.emojiHeader}>
            <Text style={styles.attachTitle}>Emoji</Text>
            <Pressable onPress={() => setShowEmojiPicker(false)}>
              <Text style={styles.iconText}>×</Text>
            </Pressable>
          </View>
          <View style={styles.emojiGrid}>
            {EMOJIS.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => insertEmoji(emoji)}
                style={styles.emojiCell}
                accessibilityLabel={`Ajouter ${emoji}`}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {voice.isRecording && (
        <View style={styles.recordingBar}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingLabel}>Enregistrement vocal</Text>
          <Text style={styles.recordingTime}>
            {formatRecordingTime(voice.duration)}
          </Text>
          <Pressable onPress={voice.cancelRecording} style={styles.iconButton}>
            <Text style={styles.iconText}>🗑️</Text>
          </Pressable>
          <Pressable onPress={voice.stopRecording} style={styles.recordingStop}>
            <Text style={styles.recordingStopText}>Terminer</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.inputRow}>
        <Pressable
          onPress={() => {
            setShowAttachments((c) => !c);
            setShowEmojiPicker(false);
          }}
          style={styles.iconButton}
          accessibilityLabel="Ajouter"
        >
          <Text style={styles.iconText}>＋</Text>
        </Pressable>

        <TextInput
          ref={inputRef}
          value={composer.text}
          onChangeText={(value) => {
            composer.setText(value);
            if (activeTool && value.trim().length === 0) setActiveTool(null);
          }}
          placeholder={
            voice.isRecording
              ? "Enregistrement en cours..."
              : "Écrire un message..."
          }
          placeholderTextColor="rgba(255,255,255,0.25)"
          style={styles.input}
          multiline
          textAlignVertical="top"
          editable={!voice.isRecording}
        />

        <Pressable
          onPress={() => {
            setShowEmojiPicker((c) => !c);
            setShowAttachments(false);
          }}
          style={styles.iconButton}
          accessibilityLabel="Emoji"
        >
          <Text style={styles.iconText}>😊</Text>
        </Pressable>

        {!hasText && !hasFiles ? (
          <Pressable
            onPress={() => {
              if (voice.isRecording) voice.stopRecording();
              else void startVoice();
            }}
            style={styles.iconButton}
            accessibilityLabel={
              voice.isRecording
                ? "Arrêter le vocal"
                : "Enregistrer un message vocal"
            }
          >
            <Text style={styles.iconText}>
              {voice.isRecording ? "■" : "🎙️"}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            disabled={!canSend}
            onPress={() => void handleSend()}
            style={[styles.sendButton, canSend ? styles.sendEnabled : styles.sendDisabled]}
            accessibilityLabel="Envoyer"
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Text style={styles.sendIcon}>➤</Text>
            )}
          </Pressable>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerHint}>
          {uploadsInFlight ? "Upload en cours..." : "Prêt à envoyer"}
        </Text>
        {hasFiles && (
          <Text style={styles.footerBadge}>
            {selectedFiles.length} fichier
            {selectedFiles.length > 1 ? "s" : ""}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.95)",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
  },
  replyBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.15)",
    backgroundColor: "rgba(139,92,246,0.06)",
    gap: 10,
  },
  replyAccent: {
    width: 3,
    height: 28,
    borderRadius: 2,
    backgroundColor: "rgb(139,92,246)",
  },
  replyContent: { flex: 1 },
  replyLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgb(196,181,253)",
    marginBottom: 4,
  },
  toolBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.15)",
    backgroundColor: "rgba(139,92,246,0.06)",
    gap: 8,
  },
  toolIcon: { fontSize: 14 },
  toolTitle: { flex: 1, fontSize: 12, color: "rgb(196,181,253)" },
  toolCancel: { paddingHorizontal: 6 },
  toolCancelText: { fontSize: 11, color: "rgba(255,255,255,0.4)" },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.15)",
    backgroundColor: "rgba(239,68,68,0.06)",
  },
  errorText: { flex: 1, fontSize: 12, color: "rgb(252,165,165)" },
  filesContainer: {
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.035)",
    overflow: "hidden",
  },
  filesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  filesHeaderText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  filesClear: { fontSize: 10, color: "rgba(255,255,255,0.4)" },
  filesRow: { flexDirection: "row", gap: 8, padding: 8 },
  fileCard: {
    width: 82,
    height: 82,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  fileThumb: { width: "100%", height: "100%" },
  filePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  filePlaceholderIcon: { fontSize: 24, marginBottom: 4 },
  filePlaceholderName: { fontSize: 9, color: "rgba(255,255,255,0.5)" },
  fileOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  fileSizeBadge: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  fileSizeText: { fontSize: 8, color: "rgba(255,255,255,0.6)" },
  fileRemove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  fileRemoveText: { color: "rgba(255,255,255,0.8)", fontSize: 16 },
  attachPanel: {
    marginBottom: 8,
    padding: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(13,15,22,0.98)",
  },
  attachHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  attachTitle: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
  attachItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 12,
  },
  attachIcon: { fontSize: 20 },
  attachTextWrapper: { flex: 1 },
  attachItemTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  attachItemSub: { fontSize: 10, color: "rgba(255,255,255,0.3)" },
  attachSeparator: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginVertical: 6,
  },
  emojiPanel: {
    marginBottom: 8,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(13,15,22,0.98)",
  },
  emojiHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  emojiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  emojiCell: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  emojiText: { fontSize: 20 },
  recordingBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
    backgroundColor: "rgba(239,68,68,0.08)",
    gap: 10,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgb(239,68,68)",
  },
  recordingLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  recordingTime: {
    fontSize: 12,
    color: "rgb(252,165,165)",
    fontVariant: ["tabular-nums"],
  },
  recordingStop: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  recordingStopText: { fontSize: 12, fontWeight: "600", color: "#000000" },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 128,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#FFFFFF",
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  iconText: { fontSize: 18, color: "rgba(255,255,255,0.4)" },
  sendButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  sendEnabled: { backgroundColor: "#FFFFFF" },
  sendDisabled: { backgroundColor: "rgba(255,255,255,0.1)" },
  sendIcon: { fontSize: 16, color: "#000000" },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    paddingTop: 6,
  },
  footerHint: { fontSize: 9, color: "rgba(255,255,255,0.2)" },
  footerBadge: {
    fontSize: 9,
    color: "rgba(196,181,253,0.8)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: "rgba(139,92,246,0.1)",
  },
});

export default MessageComposer;