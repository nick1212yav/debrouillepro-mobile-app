import { View, Text, Pressable, Image, TextInput, NativeSyntheticEvent, TextInputChangeEventData, TextInputKeyPressEventData } from "react-native";
import {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";

import type { Id } from "@/convex/_generated/dataModel";

import { useMessageComposer } from "../hooks/useMessageComposer";
import { useVoiceRecorder } from "../../voice/hooks/useVoiceRecorder";

import { ReplyPreview } from "./ReplyPreview";

interface MessageComposerProps {
  conversationId: Id<"conversations">;
}

interface SelectedFile {
  id: string;
  file: File;
  previewUrl?: string;
  kind: "image" | "video" | "audio" | "document";
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
  "🙏",
  "💪",
  "❤️",
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
  className: string;
}> = [
  {
    key: "location",
    icon: "📍",
    title: "Localisation",
    description: "Partager une position",
    className: "bg-emerald-500/15 text-emerald-300",
  },
  {
    key: "contact",
    icon: "👤",
    title: "Contact",
    description: "Partager un contact",
    className: "bg-sky-500/15 text-sky-300",
  },
  {
    key: "event",
    icon: "📅",
    title: "Événement",
    description: "Partager un événement",
    className: "bg-orange-500/15 text-orange-300",
  },
  {
    key: "job",
    icon: "💼",
    title: "Job",
    description: "Partager une offre",
    className: "bg-violet-500/15 text-violet-300",
  },
  {
    key: "property",
    icon: "🏠",
    title: "Immobilier",
    description: "Partager un bien",
    className: "bg-rose-500/15 text-rose-300",
  },
  {
    key: "poll",
    icon: "📊",
    title: "Sondage",
    description: "Créer un sondage",
    className: "bg-cyan-500/15 text-cyan-300",
  },
  {
    key: "payment",
    icon: "💳",
    title: "Paiement",
    description: "Envoyer une demande",
    className: "bg-yellow-500/15 text-yellow-300",
  },
];

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} o`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} Ko`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function getFileKind(file: File): SelectedFile["kind"] {
  if (file.type.startsWith("image/")) {
    return "image";
  }

  if (file.type.startsWith("video/")) {
    return "video";
  }

  if (file.type.startsWith("audio/")) {
    return "audio";
  }

  return "document";
}

function getFileIcon(file: File) {
  const kind = getFileKind(file);

  switch (kind) {
    case "image":
      return "🖼️";
    case "video":
      return "🎥";
    case "audio":
      return "🎵";
    default:
      return file.type === "application/pdf" ? "📕" : "📄";
  }
}

function createSelectedFile(file: File): SelectedFile {
  const kind = getFileKind(file);

  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()
      .toString(36)
      .slice(2)}`,
    file,
    kind,
    previewUrl:
      kind === "image" || kind === "video"
        ? URL.createObjectURL(file)
        : undefined,
  };
}

function formatRecordingTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");

  const remaining = (seconds % 60).toString().padStart(2, "0");

  return `${minutes}:${remaining}`;
}

export function MessageComposer({ conversationId }: MessageComposerProps) {
  const composer = useMessageComposer(conversationId);

  const voice = useVoiceRecorder();

  const inputRef = useRef<TextInput | null>(null);

  const galleryInputRef = useRef<TextInput | null>(null);
  const cameraInputRef = useRef<TextInput | null>(null);
  const documentInputRef = useRef<TextInput | null>(null);

  const [showAttachments, setShowAttachments] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [activeTool, setActiveTool] = useState<ComposerTool>(null);

  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  const hasText = composer.text.trim().length > 0;
  const hasFiles = selectedFiles.length > 0;

  const isBusy = composer.isSending || voice.isRecording;

  const focusComposer = useCallback(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  /*
   * Nettoyage des URLs locales des fichiers.
   */
  useEffect(() => {
    return () => {
      selectedFiles.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, [selectedFiles]);

  /*
   * Fermeture propre du vocal lors du démontage.
   */
  useEffect(() => {
    return () => {
      if (voice.isRecording) {
        voice.cancelRecording();
      }
    };
  }, [voice]);

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
    [composer, focusComposer],
  );

  const handleKeyDown = async (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();

    if (!hasText || composer.isSending) {
      return;
    }

    try {
      await composer.send();
    } catch {
      // L'erreur est déjà exposée par le hook.
    }
  };

  const addFiles = useCallback((files: File[]) => {
    if (files.length === 0) {
      return;
    }

    setAttachmentError(null);

    setSelectedFiles((current) => {
      const existing = new Set(
        current.map(
          (item) =>
            `${item.file.name}:${item.file.size}:${item.file.lastModified}`,
        ),
      );

      const additions = files
        .filter(
          (file) =>
            file.size > 0 &&
            !existing.has(`${file.name}:${file.size}:${file.lastModified}`),
        )
        .map(createSelectedFile);

      return [...current, ...additions];
    });
  }, []);

  const handleGallerySelected = (event: NativeSyntheticEvent<TextInputChangeEventData>) => {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
    closeMenus();
  };

  const handleCameraSelected = (event: NativeSyntheticEvent<TextInputChangeEventData>) => {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
    closeMenus();
  };

  const handleDocumentsSelected = (event: NativeSyntheticEvent<TextInputChangeEventData>) => {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
    closeMenus();
  };

  const removeSelectedFile = useCallback((id: string) => {
    setSelectedFiles((current) => {
      const target = current.find((item) => item.id === id);

      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return current.filter((item) => item.id !== id);
    });
  }, []);

  const startVoice = async () => {
    setAttachmentError(null);
    closeMenus();

    try {
      await voice.startRecording();
    } catch {
      // L'erreur est exposée par useVoiceRecorder.
    }
  };

  const stopVoice = () => {
    voice.stopRecording();
  };

  const cancelVoice = () => {
    voice.cancelRecording();
  };

  const handleToolClick = (tool: Exclude<ComposerTool, null>) => {
    setActiveTool(tool);
    closeMenus();

    const labels: Record<Exclude<ComposerTool, null>, string> = {
      location: "📍 ",
      contact: "👤 ",
      event: "📅 ",
      job: "💼 ",
      property: "🏠 ",
      poll: "📊 ",
      payment: "💳 ",
    };

    /*
     * Pour l'instant, ces éléments deviennent des intentions
     * dans le composer. Le branchement métier de chaque module
     * viendra ensuite.
     */
    composer.setText(`${composer.text}${labels[tool]}`);
    focusComposer();
  };

  const clearActiveTool = () => {
    setActiveTool(null);
  };

  const canSend = !composer.isSending && (hasText || hasFiles);

  return (
    <View className="relative border-t border-white/[0.08] bg-black/95 px-3 pb-3 pt-2 backdrop-blur-xl sm:px-4">{}{}{}{composer.replyTo && (
        <View className="mb-2 overflow-hidden rounded-2xl border border-violet-400/15 bg-violet-500/[0.06]"><View className="flex items-start gap-2 px-3 py-2.5"><View className="mt-0.5 h-8 w-1 rounded-full bg-violet-400" /><View className="min-w-0 flex-1"><Text className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-violet-300">Réponse
              </Text><ReplyPreview replyToId={composer.replyTo._id} own={false} /></View><Pressable onPress={composer.cancelReply} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/30 transition" accessibilityLabel="Annuler la réponse"><Text>×</Text></Pressable></View></View>
      )}{}{}{}{activeTool && (
        <View className="mb-2 flex items-center gap-2 rounded-xl border border-violet-400/15 bg-violet-500/[0.06] px-3 py-2"><Text className="text-sm">{TOOL_ITEMS.find((item) => item.key === activeTool)?.icon}</Text><Text className="text-xs text-violet-200">{TOOL_ITEMS.find((item) => item.key === activeTool)?.title}</Text><Pressable onPress={clearActiveTool} className="ml-auto text-xs text-white/30 transition"><Text>Annuler</Text></Pressable></View>
      )}{}{}{}{(composer.error || voice.error || attachmentError) && (
        <View className="mb-2 flex items-center gap-2 rounded-xl border border-red-500/15 bg-red-500/[0.06] px-3 py-2"><Text className="text-xs">⚠️</Text><Text className="min-w-0 flex-1 text-xs text-red-300">{composer.error ?? voice.error ?? attachmentError}</Text></View>
      )}{}{}{}{selectedFiles.length > 0 && (
        <View className="mb-2 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035]"><View className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2"><View><Text className="text-xs font-semibold text-white/80">Pièces jointes
              </Text><Text className="text-[10px] text-white/30">{selectedFiles.length}élément
                {selectedFiles.length > 1 ? "s" : ""}</Text></View><Pressable onPress={() => {
                selectedFiles.forEach((item) => {
                  if (item.previewUrl) {
                    URL.revokeObjectURL(item.previewUrl);
                  }
                });

                setSelectedFiles([]);
              }} className="rounded-lg px-2 py-1 text-[10px] text-white/30 transition"><Text>Tout retirer</Text></Pressable></View><View className="flex gap-2 overflow-x-auto p-2">{selectedFiles.map((item) => (
              <View key={item.id} className="group relative h-[82px] w-[82px] shrink-0 overflow-hidden rounded-xl border border-white/[0.08] bg-black/50">{item.kind === "image" && item.previewUrl ? (
                  <Image className="h-full w-full object-cover" source={{ uri: item.previewUrl }} accessibilityLabel={item.file.name} />
                ) : item.kind === "video" && item.previewUrl ? (
                  <video
                    src={item.previewUrl}
                    className="h-full w-full object-cover"
                    muted
                  />
                ) : (
                  <View className="flex h-full w-full flex-col items-center justify-center gap-1 px-2"><Text className="text-2xl">{getFileIcon(item.file)}</Text><Text className="max-w-full truncate text-[9px] text-white/50">{item.file.name}</Text></View>
                )}<View className="absolute inset-x-0 bottom-0 bg-black/70 px-1.5 py-1 backdrop-blur"><Text className="truncate text-[8px] text-white/60">{formatFileSize(item.file.size)}</Text></View><Pressable onPress={() => removeSelectedFile(item.id)} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs text-white/70 opacity-0 backdrop-blur transition" accessibilityLabel={`Supprimer ${item.file.name}`}><Text>×</Text></Pressable></View>
            ))}</View><View className="border-t border-white/[0.06] px-3 py-1.5"><Text className="text-[9px] text-white/20">Les fichiers sont prêts à être raccordés au stockage Convex.
            </Text></View></View>
      )}{}{}{}{showAttachments && (
        <View className="absolute bottom-[calc(100%-4px)] left-3 z-50 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-3xl border border-white/[0.1] bg-[#0d0f16]/[0.98] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.65)] backdrop-blur-2xl"><View className="flex items-center justify-between px-3 pb-2 pt-2"><View><Text className="text-sm font-semibold text-white">Ajouter</Text><Text className="mt-0.5 text-[10px] text-white/30">Tout ce que vous pouvez partager
              </Text></View><Pressable onPress={() => setShowAttachments(false)} className="flex h-8 w-8 items-center justify-center rounded-full text-white/30 transition" accessibilityLabel="Fermer"><Text>×</Text></Pressable></View><View className="gap-1">{}<Pressable onPress={() => cameraInputRef.current?.click()} className="group flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition"><Text className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-lg transition">📷
              </Text><Text className="min-w-0"><Text className="block text-xs font-semibold text-white/80">Caméra
                </Text><Text className="block truncate text-[9px] text-white/30">Prendre une photo
                </Text></Text></Pressable>{}<Pressable onPress={() => galleryInputRef.current?.click()} className="group flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition"><Text className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-500/15 text-lg transition">🖼️
              </Text><Text className="min-w-0"><Text className="block text-xs font-semibold text-white/80">Galerie
                </Text><Text className="block truncate text-[9px] text-white/30">Photos et vidéos
                </Text></Text></Pressable>{}<Pressable onPress={() => documentInputRef.current?.click()} className="group flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition"><Text className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15 text-lg transition">📄
              </Text><Text className="min-w-0"><Text className="block text-xs font-semibold text-white/80">Document
                </Text><Text className="block truncate text-[9px] text-white/30">PDF, Word, Excel...
                </Text></Text></Pressable>{}<Pressable onPress={() => {
                void startVoice();
              }} disabled={voice.isRecording} className="group flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition disabled:opacity-40"><Text className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/15 text-lg transition">🎙️
              </Text><Text className="min-w-0"><Text className="block text-xs font-semibold text-white/80">Message vocal
                </Text><Text className="block truncate text-[9px] text-white/30">Enregistrer un vocal
                </Text></Text></Pressable></View><View className="my-2 h-px bg-white/[0.06]" /><View className="gap-1">{TOOL_ITEMS.map((tool) => (
              <Pressable key={tool.key} onPress={() => handleToolClick(tool.key)} className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition"><Text className={`flex h-9 w-9 items-center justify-center rounded-xl text-base transition group-hover:scale-105 ${tool.className}`}>{tool.icon}</Text><Text className="min-w-0"><Text className="block text-[11px] font-semibold text-white/75">{tool.title}</Text><Text className="block truncate text-[9px] text-white/25">{tool.description}</Text></Text></Pressable>
            ))}</View></View>
      )}{}{}{}{showEmojiPicker && (
        <View className="absolute bottom-[calc(100%-4px)] right-3 z-50 w-[min(330px,calc(100vw-24px))] overflow-hidden rounded-3xl border border-white/[0.1] bg-[#0d0f16]/[0.98] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.65)] backdrop-blur-2xl"><View className="mb-3 flex items-center justify-between px-1"><View><Text className="text-sm font-semibold text-white">Emoji</Text><Text className="text-[10px] text-white/30">Ajouter une réaction</Text></View><Pressable onPress={() => setShowEmojiPicker(false)} className="flex h-8 w-8 items-center justify-center rounded-full text-white/30 transition" accessibilityLabel="Fermer"><Text>×</Text></Pressable></View><View className="gap-1">{EMOJIS.map((emoji) => (
              <Pressable key={emoji} onPress={() => insertEmoji(emoji)} className="flex h-11 items-center justify-center rounded-xl text-xl transition active:scale-95" accessibilityLabel={`Ajouter ${emoji}`}>{emoji}</Pressable>
            ))}</View></View>
      )}{}{}{}{voice.isRecording && (
        <View className="mb-2 overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-r from-red-500/[0.08] to-transparent"><View className="flex items-center gap-3 px-3 py-2.5"><View className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10"><Text className="absolute h-3 w-3 animate-ping rounded-full bg-red-500/40" /><Text className="relative h-2.5 w-2.5 rounded-full bg-red-500" /></View><View className="min-w-0 flex-1"><Text className="text-xs font-semibold text-white/80">Enregistrement vocal
              </Text><View className="mt-1 flex items-center gap-2"><View className="flex items-end gap-[2px]">{[10, 16, 7, 20, 12, 17, 8, 14, 6, 18].map(
                    (height, index) => (
                      <Text key={index} className="w-[2px] animate-pulse rounded-full bg-red-400/70" style={{ height: `${height}px` }} />
                    ),
                  )}</View><Text className="font-mono text-[10px] text-red-300">{formatRecordingTime(voice.duration)}</Text></View></View><Pressable onPress={cancelVoice} className="flex h-9 w-9 items-center justify-center rounded-xl text-white/30 transition" accessibilityLabel="Annuler le vocal"><Text>🗑️</Text></Pressable><Pressable onPress={stopVoice} className="flex h-9 items-center gap-2 rounded-xl bg-white px-3 text-xs font-semibold text-black transition"><Text>✓</Text><Text>Terminer</Text></Pressable></View></View>
      )}{}{}{}<View className={[
          "relative overflow-hidden rounded-[22px] border bg-white/[0.035] p-1.5 shadow-[0_8px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl transition-all",
          voice.isRecording
            ? "border-red-500/20"
            : showAttachments || showEmojiPicker
              ? "border-violet-400/20"
              : "border-white/[0.09] focus-within:border-white/[0.16]",
        ].join(" ")}><View className="flex min-h-[48px] items-end gap-1">{}<Pressable onPress={() => {
              setShowAttachments((current) => !current);
              setShowEmojiPicker(false);
            }} className={[
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl transition-all",
              showAttachments
                ? "rotate-45 bg-violet-500/15 text-violet-300"
                : "text-white/40 hover:bg-white/[0.06] hover:text-white",
            ].join(" ")} accessibilityLabel="Ajouter"><Text>＋</Text></Pressable>{}<TextInput ref={inputRef} value={composer.text} onChangeText={(value) => {
              composer.setText(value);

              if (activeTool && value.trim().length === 0) {
                setActiveTool(null);
              }
            }} onKeyPress={handleKeyDown} placeholder={voice.isRecording
                ? "Enregistrement en cours..."
                : "Écrire un message..."} className="max-h-32 min-h-10 flex-1 bg-transparent px-2 py-2.5 text-sm leading-5 text-white outline-none placeholder:text-white/25 disabled:opacity-40" multiline textAlignVertical="top" editable={!(voice.isRecording)} />{}<Pressable onPress={() => {
              setShowEmojiPicker((current) => !current);
              setShowAttachments(false);
            }} className={[
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg transition-all",
              showEmojiPicker
                ? "bg-white/[0.08] text-white"
                : "text-white/40 hover:bg-white/[0.06] hover:text-white",
            ].join(" ")} accessibilityLabel="Emoji"><Text>😊</Text></Pressable>{}{!hasText && !hasFiles ? (
            <Pressable onPress={() => {
                if (voice.isRecording) {
                  stopVoice();
                } else {
                  void startVoice();
                }
              }} className={[
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all",
                voice.isRecording
                  ? "bg-red-500/15 text-red-400"
                  : "text-white/40 hover:bg-white/[0.06] hover:text-white",
              ].join(" ")} accessibilityLabel={voice.isRecording
                  ? "Arrêter le vocal"
                  : "Enregistrer un message vocal"}>{voice.isRecording ? "■" : "🎙️"}</Pressable>
          ) : (
            <Pressable disabled={!canSend || isBusy} onPress={() => {
                if (!canSend || isBusy) {
                  return;
                }

                /*
                 * Le texte est actuellement envoyé par le hook existant.
                 * Les fichiers restent sélectionnés jusqu'au branchement
                 * définitif du Storage Convex.
                 */
                if (hasText) {
                  void composer.send();
                } else {
                  setAttachmentError(
                    "Les pièces jointes sont prêtes. Le stockage Convex doit maintenant être raccordé pour leur envoi.",
                  );
                }
              }} className={[
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all",
                canSend && !isBusy
                  ? "bg-white text-black shadow-[0_4px_20px_rgba(255,255,255,0.12)] hover:scale-105 hover:bg-white/90 active:scale-95"
                  : "cursor-not-allowed bg-white/10 text-white/20",
              ].join(" ")} accessibilityLabel="Envoyer">{composer.isSending ? (
                <Text className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
              ) : (
                <Text className="text-base">➤</Text>
              )}</Pressable>
          )}</View></View>{}{}{}<View className="flex items-center justify-between px-1.5 pt-1.5"><View className="flex min-w-0 items-center gap-1.5 text-[9px] text-white/20"><Text className="hidden sm:inline">Entrée pour envoyer</Text><Text className="hidden sm:inline">•</Text><Text className="hidden sm:inline">Shift + Entrée pour une nouvelle ligne
          </Text><Text className="sm:hidden">Appuyez sur Entrée pour envoyer</Text></View><View className="flex items-center gap-2">{hasFiles && (
            <Text className="rounded-full bg-violet-500/10 px-2 py-1 text-[9px] font-medium text-violet-300/80">
              {selectedFiles.length} fichier
              {selectedFiles.length > 1 ? "s" : ""}
            </Text>
          )}{voice.recording && !voice.isRecording && (
            <Pressable onPress={() => {
                const recording = voice.recording;

                if (!recording) {
                  return;
                }

                const extension = recording.mimeType.includes("ogg")
                  ? "ogg"
                  : recording.mimeType.includes("mp4")
                    ? "m4a"
                    : "webm";

                const voiceFile = new File(
                  [recording.blob],
                  `message-vocal-${Date.now()}.${extension}`,
                  {
                    type: recording.mimeType || "audio/webm",
                  },
                );

                addFiles([voiceFile]);

                voice.resetRecording();
              }} className="group flex items-center gap-2 rounded-full border border-violet-400/15 bg-violet-500/10 px-3 py-1.5 text-[10px] font-semibold text-violet-200 transition-all active:scale-95">
              <Text className="transition-transform">
                🎙️
              </Text>

              <Text>Ajouter le vocal</Text>
            </Pressable>
          )}</View></View>{}{}{}<TextInput ref={cameraInputRef} className="hidden" onChangeText={handleCameraSelected} /><TextInput ref={galleryInputRef} className="hidden" onChangeText={handleGallerySelected} /><TextInput ref={documentInputRef} className="hidden" onChangeText={handleDocumentsSelected} /></View>
  );
}

export default MessageComposer;
