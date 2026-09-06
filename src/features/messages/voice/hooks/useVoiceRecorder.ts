// src/features/messages/voice/hooks/useVoiceRecorder.ts

import { useCallback, useEffect, useRef, useState } from "react";

import type { Id } from "@/convex/_generated/dataModel";

import mediaService from "../../media/services/media.service";
import voiceService from "../services/voice.service";

export interface VoiceRecording {
  blob: Blob;
  duration: number;
  mimeType: string;
}

type GenerateUploadUrlMutation = () => Promise<string>;

type SendVoiceMessageMutation = (args: {
  conversationId: Id<"conversations">;
  fileId: Id<"_storage">;
  duration: number;
}) => Promise<Id<"messages">>;

interface UseVoiceRecorderOptions {
  conversationId?: Id<"conversations"> | null;
  generateUploadUrl?: GenerateUploadUrlMutation;
  sendVoiceMessage?: SendVoiceMessageMutation;
}

const MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
];

function getSupportedMimeType() {
  if (typeof MediaRecorder === "undefined") {
    return "";
  }

  return MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function getVoiceExtension(mimeType: string) {
  if (mimeType.includes("ogg")) {
    return "ogg";
  }

  if (mimeType.includes("mp4")) {
    return "m4a";
  }

  return "webm";
}

export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}) {
  const { conversationId, generateUploadUrl, sendVoiceMessage } = options;

  const recorderRef = useRef<MediaRecorder | null>(null);

  const streamRef = useRef<MediaStream | null>(null);

  const chunksRef = useRef<Blob[]>([]);

  const startedAtRef = useRef<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isRecording, setIsRecording] = useState(false);

  const [duration, setDuration] = useState(0);

  const [recording, setRecording] = useState<VoiceRecording | null>(null);

  const [isUploading, setIsUploading] = useState(false);

  const [uploadProgress, setUploadProgress] = useState(0);

  const [sentMessageId, setSentMessageId] = useState<Id<"messages"> | null>(
    null,
  );

  const [error, setError] = useState<string | null>(null);

  // ========================================================================
  // MICRO
  // ========================================================================

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());

    streamRef.current = null;
  }, []);

  // ========================================================================
  // TIMER
  // ========================================================================

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ========================================================================
  // START
  // ========================================================================

  const startRecording = useCallback(async () => {
    if (isRecording) {
      return;
    }

    if (typeof undefined === "undefined" || !undefined) {
      throw new Error(
        "L'enregistrement audio n'est pas disponible sur cet appareil.",
      );
    }

    if (typeof MediaRecorder === "undefined") {
      throw new Error("MediaRecorder n'est pas disponible dans ce navigateur.");
    }

    setError(null);
    setRecording(null);
    setSentMessageId(null);
    setDuration(0);
    setUploadProgress(0);

    try {
      const stream = await undefined.getUserMedia({
        audio: true,
        video: false,
      });

      streamRef.current = stream;

      const mimeType = getSupportedMimeType();

      const recorder = mimeType
        ? new MediaRecorder(stream, {
            mimeType,
          })
        : new MediaRecorder(stream);

      recorderRef.current = recorder;

      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setError("Une erreur est survenue pendant l'enregistrement.");
      };

      recorder.onstop = () => {
        const finalMimeType = recorder.mimeType || mimeType || "audio/webm";

        const blob = new Blob(chunksRef.current, {
          type: finalMimeType,
        });

        const finalDuration = startedAtRef.current
          ? Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000))
          : 0;

        setRecording({
          blob,
          duration: finalDuration,
          mimeType: finalMimeType,
        });

        chunksRef.current = [];
        startedAtRef.current = null;

        stopTracks();
        clearTimer();
      };

      startedAtRef.current = Date.now();

      recorder.start();

      setIsRecording(true);

      timerRef.current = setInterval(() => {
        if (startedAtRef.current) {
          setDuration(Math.floor((Date.now() - startedAtRef.current) / 1000));
        }
      }, 250);
    } catch (err) {
      stopTracks();
      clearTimer();

      const message =
        err instanceof Error
          ? err.message
          : "Impossible d'accéder au microphone.";

      setError(message);

      throw err;
    }
  }, [clearTimer, isRecording, stopTracks]);

  // ========================================================================
  // STOP
  // ========================================================================

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;

    if (!recorder) {
      return;
    }

    if (recorder.state !== "inactive") {
      recorder.stop();
    }

    recorderRef.current = null;

    setIsRecording(false);

    clearTimer();
  }, [clearTimer]);

  // ========================================================================
  // UPLOAD + SEND
  // ========================================================================

  const sendRecording = useCallback(async () => {
    if (!recording) {
      throw new Error("Aucun enregistrement vocal à envoyer.");
    }

    if (!conversationId) {
      throw new Error("Conversation introuvable.");
    }

    if (!generateUploadUrl) {
      throw new Error("Le service d'upload n'est pas configuré.");
    }

    if (!sendVoiceMessage) {
      throw new Error("Le service de message vocal n'est pas configuré.");
    }

    if (isUploading) {
      return null;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // ================================================================
      // BLOB → FILE
      // ================================================================

      const extension = getVoiceExtension(recording.mimeType);

      const file = new File(
        [recording.blob],
        `voice-${Date.now()}.${extension}`,
        {
          type: recording.mimeType || "audio/webm",
        },
      );

      setUploadProgress(5);

      // ================================================================
      // CONVEX STORAGE
      // ================================================================
      //
      // IMPORTANT :
      //
      // mediaService.uploadFile() reçoit
      // la mutation generateUploadUrl.
      //
      // Le service effectue ensuite lui-même
      // l'obtention de l'URL et l'upload.
      //
      // ================================================================

      const storageId = await mediaService.uploadFile(generateUploadUrl, file);

      if (!storageId) {
        throw new Error(
          "Convex n'a pas retourné l'identifiant du fichier audio.",
        );
      }

      setUploadProgress(85);

      // ================================================================
      // STORAGE → MESSAGE VOCAL
      // ================================================================

      const messageId = await voiceService.sendVoiceMessage(sendVoiceMessage, {
        conversationId,
        fileId: storageId as Id<"_storage">,
        duration: recording.duration,
      });

      setUploadProgress(100);
      setSentMessageId(messageId);

      setRecording(null);
      setDuration(0);

      return messageId;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible d'envoyer le message vocal.";

      setError(message);

      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [
    conversationId,
    generateUploadUrl,
    isUploading,
    recording,
    sendVoiceMessage,
  ]);

  // ========================================================================
  // CANCEL
  // ========================================================================

  const cancelRecording = useCallback(() => {
    const recorder = recorderRef.current;

    if (recorder) {
      recorder.ondataavailable = null;
      recorder.onstop = null;

      if (recorder.state !== "inactive") {
        recorder.stop();
      }
    }

    recorderRef.current = null;

    chunksRef.current = [];
    startedAtRef.current = null;

    stopTracks();
    clearTimer();

    setIsRecording(false);
    setDuration(0);
    setRecording(null);
    setUploadProgress(0);
    setSentMessageId(null);
    setError(null);
  }, [clearTimer, stopTracks]);

  // ========================================================================
  // RESET
  // ========================================================================

  const resetRecording = useCallback(() => {
    setRecording(null);
    setDuration(0);
    setUploadProgress(0);
    setSentMessageId(null);
    setError(null);
  }, []);

  // ========================================================================
  // CLEANUP
  // ========================================================================

  useEffect(() => {
    return () => {
      const recorder = recorderRef.current;

      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }

      clearTimer();
      stopTracks();
    };
  }, [clearTimer, stopTracks]);

  // ========================================================================
  // API
  // ========================================================================

  return {
    isRecording,
    duration,
    recording,
    error,

    isUploading,
    uploadProgress,

    sentMessageId,

    startRecording,
    stopRecording,
    cancelRecording,
    sendRecording,
    resetRecording,
  };
}

export default useVoiceRecorder;
