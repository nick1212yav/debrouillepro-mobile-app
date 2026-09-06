// src/features/messages/chat/components/MessageComposer.tsx

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
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

  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const documentInputRef = useRef<HTMLInputElement | null>(null);

  const selectedFilesRef = useRef<SelectedFile[]>([]);

  const [showAttachments, setShowAttachments] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [activeTool, setActiveTool] = useState<ComposerTool>(null);

  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  useEffect(() => {
    selectedFilesRef.current = selectedFiles;
  }, [selectedFiles]);

  const hasText = composer.text.trim().length > 0;
  const hasFiles = selectedFiles.length > 0;

  const isBusy = composer.isSending || voice.isRecording;

  const focusComposer = useCallback(() => {
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  /*
   * Nettoyage final des previews uniquement au démontage.
   */
  useEffect(() => {
    return () => {
      selectedFilesRef.current.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, []);

  /*
   * Fermeture propre de l'enregistrement vocal.
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

  const handleKeyDown = async (event: KeyboardEvent<HTMLTextAreaElement>) => {
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
      // L'erreur est exposée par le hook.
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

  const handleGallerySelected = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(event.target.files ?? []));

    event.target.value = "";
    closeMenus();
  };

  const handleCameraSelected = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(event.target.files ?? []));

    event.target.value = "";
    closeMenus();
  };

  const handleDocumentsSelected = (event: ChangeEvent<HTMLInputElement>) => {
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

  const clearSelectedFiles = useCallback(() => {
    setSelectedFiles((current) => {
      current.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });

      return [];
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

    composer.setText(`${composer.text}${labels[tool]}`);

    focusComposer();
  };

  const clearActiveTool = () => {
    setActiveTool(null);
  };

  const canSend = !composer.isSending && (hasText || hasFiles);

  const handleSend = async () => {
    if (!canSend || isBusy) {
      return;
    }

    /*
     * Le hook actuel gère l'envoi des messages texte.
     * Les fichiers seront envoyés dès le raccordement
     * définitif au Storage / backend.
     */
    if (!hasText && hasFiles) {
      setAttachmentError(
        "Les pièces jointes sont prêtes. Le stockage doit maintenant être raccordé pour leur envoi.",
      );
      return;
    }

    try {
      await composer.send();

      if (hasFiles) {
        setAttachmentError(
          "Le message texte a été envoyé. Les pièces jointes restent en attente du raccordement au stockage.",
        );
      }
    } catch {
      // L'erreur est exposée par le hook.
    }
  };

  return (
    <div className="relative border-t border-white/[0.08] bg-black/95 px-3 pb-3 pt-2 backdrop-blur-xl sm:px-4">
      {/* ================================================================ */}
      {/* REPLY                                                            */}
      {/* ================================================================ */}

      {composer.replyTo && (
        <div className="mb-2 overflow-hidden rounded-2xl border border-violet-400/15 bg-violet-500/[0.06]">
          <div className="flex items-start gap-2 px-3 py-2.5">
            <div className="mt-0.5 h-8 w-1 rounded-full bg-violet-400" />

            <div className="min-w-0 flex-1">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-violet-300">
                Réponse
              </p>

              <ReplyPreview replyToId={composer.replyTo._id} own={false} />
            </div>

            <button
              type="button"
              onClick={composer.cancelReply}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/30 transition hover:bg-white/10 hover:text-white"
              aria-label="Annuler la réponse"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* ACTIVE TOOL                                                      */}
      {/* ================================================================ */}

      {activeTool && (
        <div className="mb-2 flex items-center gap-2 rounded-xl border border-violet-400/15 bg-violet-500/[0.06] px-3 py-2">
          <span className="text-sm">
            {TOOL_ITEMS.find((item) => item.key === activeTool)?.icon}
          </span>

          <span className="text-xs text-violet-200">
            {TOOL_ITEMS.find((item) => item.key === activeTool)?.title}
          </span>

          <button
            type="button"
            onClick={clearActiveTool}
            className="ml-auto text-xs text-white/30 transition hover:text-white"
          >
            Annuler
          </button>
        </div>
      )}

      {/* ================================================================ */}
      {/* ERRORS                                                           */}
      {/* ================================================================ */}

      {(composer.error || voice.error || attachmentError) && (
        <div className="mb-2 flex items-center gap-2 rounded-xl border border-red-500/15 bg-red-500/[0.06] px-3 py-2">
          <span className="text-xs">⚠️</span>

          <p className="min-w-0 flex-1 text-xs text-red-300">
            {composer.error ?? voice.error ?? attachmentError}
          </p>
        </div>
      )}

      {/* ================================================================ */}
      {/* FILE PREVIEW                                                     */}
      {/* ================================================================ */}

      {selectedFiles.length > 0 && (
        <div className="mb-2 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035]">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
            <div>
              <p className="text-xs font-semibold text-white/80">
                Pièces jointes
              </p>

              <p className="text-[10px] text-white/30">
                {selectedFiles.length} élément
                {selectedFiles.length > 1 ? "s" : ""}
              </p>
            </div>

            <button
              type="button"
              onClick={clearSelectedFiles}
              className="rounded-lg px-2 py-1 text-[10px] text-white/30 transition hover:bg-white/10 hover:text-white"
            >
              Tout retirer
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto p-2">
            {selectedFiles.map((item) => (
              <div
                key={item.id}
                className="group relative h-[82px] w-[82px] shrink-0 overflow-hidden rounded-xl border border-white/[0.08] bg-black/50"
              >
                {item.kind === "image" && item.previewUrl ? (
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="h-full w-full object-cover"
                  />
                ) : item.kind === "video" && item.previewUrl ? (
                  <video
                    src={item.previewUrl}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-2">
                    <span className="text-2xl">{getFileIcon(item.file)}</span>

                    <span className="max-w-full truncate text-[9px] text-white/50">
                      {item.file.name}
                    </span>
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 bg-black/70 px-1.5 py-1 backdrop-blur">
                  <p className="truncate text-[8px] text-white/60">
                    {formatFileSize(item.file.size)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeSelectedFile(item.id)}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs text-white/70 opacity-0 backdrop-blur transition group-hover:opacity-100 hover:bg-red-500 hover:text-white"
                  aria-label={`Supprimer ${item.file.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="border-t border-white/[0.06] px-3 py-1.5">
            <p className="text-[9px] text-white/20">
              Les fichiers sont prêts à être envoyés dès le raccordement du
              stockage.
            </p>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* ATTACHMENT COMMAND CENTER                                       */}
      {/* ================================================================ */}

      {showAttachments && (
        <div className="absolute bottom-[calc(100%-4px)] left-3 z-50 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-3xl border border-white/[0.1] bg-[#0d0f16]/[0.98] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.65)] backdrop-blur-2xl">
          <div className="flex items-center justify-between px-3 pb-2 pt-2">
            <div>
              <p className="text-sm font-semibold text-white">Ajouter</p>

              <p className="mt-0.5 text-[10px] text-white/30">
                Tout ce que vous pouvez partager
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAttachments(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/30 transition hover:bg-white/10 hover:text-white"
              aria-label="Fermer"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="group flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-white/[0.06]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-lg transition group-hover:scale-105">
                📷
              </span>

              <span className="min-w-0">
                <span className="block text-xs font-semibold text-white/80">
                  Caméra
                </span>

                <span className="block truncate text-[9px] text-white/30">
                  Prendre une photo
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="group flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-white/[0.06]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-500/15 text-lg transition group-hover:scale-105">
                🖼️
              </span>

              <span className="min-w-0">
                <span className="block text-xs font-semibold text-white/80">
                  Galerie
                </span>

                <span className="block truncate text-[9px] text-white/30">
                  Photos et vidéos
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => documentInputRef.current?.click()}
              className="group flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-white/[0.06]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15 text-lg transition group-hover:scale-105">
                📄
              </span>

              <span className="min-w-0">
                <span className="block text-xs font-semibold text-white/80">
                  Document
                </span>

                <span className="block truncate text-[9px] text-white/30">
                  PDF, Word, Excel...
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                void startVoice();
              }}
              disabled={voice.isRecording}
              className="group flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-white/[0.06] disabled:opacity-40"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/15 text-lg transition group-hover:scale-105">
                🎙️
              </span>

              <span className="min-w-0">
                <span className="block text-xs font-semibold text-white/80">
                  Message vocal
                </span>

                <span className="block truncate text-[9px] text-white/30">
                  Enregistrer un vocal
                </span>
              </span>
            </button>
          </div>

          <div className="my-2 h-px bg-white/[0.06]" />

          <div className="grid grid-cols-2 gap-1">
            {TOOL_ITEMS.map((tool) => (
              <button
                key={tool.key}
                type="button"
                onClick={() => handleToolClick(tool.key)}
                className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-white/[0.06]"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-base transition group-hover:scale-105 ${tool.className}`}
                >
                  {tool.icon}
                </span>

                <span className="min-w-0">
                  <span className="block text-[11px] font-semibold text-white/75">
                    {tool.title}
                  </span>

                  <span className="block truncate text-[9px] text-white/25">
                    {tool.description}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* EMOJI PICKER                                                     */}
      {/* ================================================================ */}

      {showEmojiPicker && (
        <div className="absolute bottom-[calc(100%-4px)] right-3 z-50 w-[min(330px,calc(100vw-24px))] overflow-hidden rounded-3xl border border-white/[0.1] bg-[#0d0f16]/[0.98] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.65)] backdrop-blur-2xl">
          <div className="mb-3 flex items-center justify-between px-1">
            <div>
              <p className="text-sm font-semibold text-white">Emoji</p>

              <p className="text-[10px] text-white/30">Ajouter une réaction</p>
            </div>

            <button
              type="button"
              onClick={() => setShowEmojiPicker(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/30 transition hover:bg-white/10 hover:text-white"
              aria-label="Fermer"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-6 gap-1">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => insertEmoji(emoji)}
                className="flex h-11 items-center justify-center rounded-xl text-xl transition hover:scale-110 hover:bg-white/[0.07] active:scale-95"
                aria-label={`Ajouter ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* VOICE RECORDING MODE                                            */}
      {/* ================================================================ */}

      {voice.isRecording && (
        <div className="mb-2 overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-r from-red-500/[0.08] to-transparent">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10">
              <span className="absolute h-3 w-3 animate-ping rounded-full bg-red-500/40" />

              <span className="relative h-2.5 w-2.5 rounded-full bg-red-500" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white/80">
                Enregistrement vocal
              </p>

              <div className="mt-1 flex items-center gap-2">
                <div className="flex items-end gap-[2px]">
                  {[10, 16, 7, 20, 12, 17, 8, 14, 6, 18].map(
                    (height, index) => (
                      <span
                        key={index}
                        className="w-[2px] animate-pulse rounded-full bg-red-400/70"
                        style={{
                          height: `${height}px`,
                          animationDelay: `${index * 70}ms`,
                        }}
                      />
                    ),
                  )}
                </div>

                <span className="font-mono text-[10px] text-red-300">
                  {formatRecordingTime(voice.duration)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={cancelVoice}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white/30 transition hover:bg-white/10 hover:text-white"
              aria-label="Annuler le vocal"
              title="Annuler"
            >
              🗑️
            </button>

            <button
              type="button"
              onClick={stopVoice}
              className="flex h-9 items-center gap-2 rounded-xl bg-white px-3 text-xs font-semibold text-black transition hover:bg-white/90"
            >
              <span>✓</span>
              Terminer
            </button>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MAIN COMPOSER                                                    */}
      {/* ================================================================ */}

      <div
        className={[
          "relative overflow-hidden rounded-[22px] border bg-white/[0.035] p-1.5 shadow-[0_8px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl transition-all",
          voice.isRecording
            ? "border-red-500/20"
            : showAttachments || showEmojiPicker
              ? "border-violet-400/20"
              : "border-white/[0.09] focus-within:border-white/[0.16]",
        ].join(" ")}
      >
        <div className="flex min-h-[48px] items-end gap-1">
          <button
            type="button"
            onClick={() => {
              setShowAttachments((current) => !current);
              setShowEmojiPicker(false);
            }}
            className={[
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl transition-all",
              showAttachments
                ? "rotate-45 bg-violet-500/15 text-violet-300"
                : "text-white/40 hover:bg-white/[0.06] hover:text-white",
            ].join(" ")}
            aria-label="Ajouter"
            title="Ajouter"
          >
            ＋
          </button>

          <textarea
            ref={inputRef}
            value={composer.text}
            onChange={(event) => {
              composer.setText(event.target.value);

              if (activeTool && event.target.value.trim().length === 0) {
                setActiveTool(null);
              }
            }}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={voice.isRecording}
            placeholder={
              voice.isRecording
                ? "Enregistrement en cours..."
                : "Écrire un message..."
            }
            className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm leading-5 text-white outline-none placeholder:text-white/25 disabled:cursor-not-allowed disabled:opacity-40"
          />

          <button
            type="button"
            onClick={() => {
              setShowEmojiPicker((current) => !current);
              setShowAttachments(false);
            }}
            className={[
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg transition-all",
              showEmojiPicker
                ? "bg-white/[0.08] text-white"
                : "text-white/40 hover:bg-white/[0.06] hover:text-white",
            ].join(" ")}
            aria-label="Emoji"
            title="Emoji"
          >
            😊
          </button>

          {!hasText && !hasFiles ? (
            <button
              type="button"
              onClick={() => {
                if (voice.isRecording) {
                  stopVoice();
                } else {
                  void startVoice();
                }
              }}
              className={[
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all",
                voice.isRecording
                  ? "bg-red-500/15 text-red-400"
                  : "text-white/40 hover:bg-white/[0.06] hover:text-white",
              ].join(" ")}
              aria-label={
                voice.isRecording
                  ? "Arrêter le vocal"
                  : "Enregistrer un message vocal"
              }
              title={voice.isRecording ? "Arrêter" : "Message vocal"}
            >
              {voice.isRecording ? "■" : "🎙️"}
            </button>
          ) : (
            <button
              type="button"
              disabled={!canSend || isBusy}
              onClick={() => {
                void handleSend();
              }}
              className={[
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all",
                canSend && !isBusy
                  ? "bg-white text-black shadow-[0_4px_20px_rgba(255,255,255,0.12)] hover:scale-105 hover:bg-white/90 active:scale-95"
                  : "cursor-not-allowed bg-white/10 text-white/20",
              ].join(" ")}
              aria-label="Envoyer"
              title="Envoyer"
            >
              {composer.isSending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
              ) : (
                <span className="text-base">➤</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ================================================================ */}
      {/* FOOTER                                                           */}
      {/* ================================================================ */}

      <div className="flex items-center justify-between px-1.5 pt-1.5">
        <div className="flex min-w-0 items-center gap-1.5 text-[9px] text-white/20">
          <span className="hidden sm:inline">Entrée pour envoyer</span>

          <span className="hidden sm:inline">•</span>

          <span className="hidden sm:inline">
            Shift + Entrée pour une nouvelle ligne
          </span>

          <span className="sm:hidden">Appuyez sur Entrée pour envoyer</span>
        </div>

        <div className="flex items-center gap-2">
          {hasFiles && (
            <span className="rounded-full bg-violet-500/10 px-2 py-1 text-[9px] font-medium text-violet-300/80">
              {selectedFiles.length} fichier
              {selectedFiles.length > 1 ? "s" : ""}
            </span>
          )}

          {voice.recording && !voice.isRecording && (
            <button
              type="button"
              onClick={() => {
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
              }}
              className="group flex items-center gap-2 rounded-full border border-violet-400/15 bg-violet-500/10 px-3 py-1.5 text-[10px] font-semibold text-violet-200 transition-all hover:border-violet-400/30 hover:bg-violet-500/20 hover:text-white active:scale-95"
            >
              <span className="transition-transform group-hover:scale-110">
                🎙️
              </span>

              <span>Ajouter le vocal</span>
            </button>
          )}
        </div>
      </div>

      {/* ================================================================ */}
      {/* HIDDEN INPUTS                                                    */}
      {/* ================================================================ */}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraSelected}
      />

      <input
        ref={galleryInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={handleGallerySelected}
      />

      <input
        ref={documentInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z"
        className="hidden"
        onChange={handleDocumentsSelected}
      />
    </div>
  );
}

export default MessageComposer;
