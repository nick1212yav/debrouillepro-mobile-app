// src/features/messages/voice/hooks/useVoiceRecorder.ts

import { useCallback, useEffect, useRef, useState } from "react";
import { Audio } from "expo-av";
import type { Id } from "@/convex/_generated/dataModel";

import { mediaService } from "../../media/services/media.service";
import { voiceService } from "../services/voice.service";

const DEFAULT_MIME_TYPE = "audio/mp4";

export interface VoiceRecording {
  uri: string;
  blob: Blob;
  duration: number;
  mimeType: string;
}

interface UseVoiceRecorderOptions {
  /**
   * Optionnel : requis uniquement si `sendRecording` est utilisé.
   *
   * `VoiceRecorder` (record-only) peut appeler le hook sans args.
   */
  conversationId?: Id<"conversations">;

  generateUploadUrl?: () => Promise<string>;

  sendVoiceMessage?: (args: {
    conversationId: Id<"conversations">;
    fileId: Id<"_storage">;
    duration: number;
  }) => Promise<Id<"messages">>;
}

export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}) {
  const { conversationId, generateUploadUrl, sendVoiceMessage } = options;

  const recorderRef = useRef<Audio.Recording | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recording, setRecording] = useState<VoiceRecording | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();

    startedAtRef.current = Date.now();

    timerRef.current = setInterval(() => {
      if (!startedAtRef.current) {
        return;
      }

      setDuration(
        Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000)),
      );
    }, 250);
  }, [clearTimer]);

  const startRecording = useCallback(async () => {
    if (recorderRef.current) {
      return;
    }

    setError(null);
    setRecording(null);
    setDuration(0);

    try {
      const permission = await Audio.requestPermissionsAsync();

      if (!permission.granted) {
        throw new Error("L'autorisation du microphone est nécessaire.");
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recorder = new Audio.Recording();

      await recorder.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );

      await recorder.startAsync();

      recorderRef.current = recorder;
      setIsRecording(true);
      startTimer();
    } catch (err) {
      recorderRef.current = null;
      setIsRecording(false);
      clearTimer();

      const message =
        err instanceof Error
          ? err.message
          : "Impossible de démarrer l'enregistrement vocal.";

      setError(message);
    }
  }, [clearTimer, startTimer]);

  const stopRecording = useCallback(async () => {
    const recorder = recorderRef.current;

    if (!recorder) {
      return;
    }

    clearTimer();

    try {
      const status = await recorder.getStatusAsync();

      if (status.isRecording) {
        await recorder.stopAndUnloadAsync();
      }

      const uri = recorder.getURI();

      if (!uri) {
        throw new Error("Aucun fichier audio n'a été généré.");
      }

      const finalDuration =
        typeof status.durationMillis === "number"
          ? Math.max(0, Math.round(status.durationMillis / 1000))
          : startedAtRef.current
            ? Math.max(
                0,
                Math.round((Date.now() - startedAtRef.current) / 1000),
              )
            : 0;

      const response = await fetch(uri);
      const blob = await response.blob();

      const nextRecording: VoiceRecording = {
        uri,
        blob,
        duration: finalDuration,
        mimeType: DEFAULT_MIME_TYPE,
      };

      setRecording(nextRecording);
      setDuration(finalDuration);
      setIsRecording(false);
      startedAtRef.current = null;
      recorderRef.current = null;
    } catch (err) {
      setIsRecording(false);
      recorderRef.current = null;
      startedAtRef.current = null;

      const message =
        err instanceof Error
          ? err.message
          : "Impossible d'arrêter l'enregistrement vocal.";

      setError(message);
    }
  }, [clearTimer]);

  const cancelRecording = useCallback(async () => {
    clearTimer();

    const recorder = recorderRef.current;

    recorderRef.current = null;
    startedAtRef.current = null;

    if (recorder) {
      try {
        const status = await recorder.getStatusAsync();

        if (status.isRecording) {
          await recorder.stopAndUnloadAsync();
        }
      } catch {
        // Le nettoyage reste best-effort.
      }
    }

    setIsRecording(false);
    setRecording(null);
    setDuration(0);
    setUploadProgress(0);
    setError(null);
  }, [clearTimer]);

  const sendRecording = useCallback(async () => {
    if (!recording) {
      throw new Error("Aucun message vocal à envoyer.");
    }

    if (!conversationId || !generateUploadUrl || !sendVoiceMessage) {
      throw new Error(
        "sendRecording nécessite conversationId, generateUploadUrl et sendVoiceMessage.",
      );
    }

    if (isUploading) {
      return null;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const extension = getVoiceExtension(recording.mimeType);

      const file = {
        uri: recording.uri,
        name: `voice-${Date.now()}.${extension}`,
        type: recording.mimeType || DEFAULT_MIME_TYPE,
        size: recording.blob.size,
      };

      setUploadProgress(5);

      const storageId = (await mediaService.uploadFile(
        generateUploadUrl,
        file,
      )) as Id<"_storage">;

      if (!storageId) {
        throw new Error(
          "Convex n'a pas retourné l'identifiant du fichier audio.",
        );
      }

      setUploadProgress(85);

      const messageId = await voiceService.sendVoiceMessage(sendVoiceMessage, {
        conversationId,
        fileId: storageId,
        duration: recording.duration,
      });

      setUploadProgress(100);
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

  const reset = useCallback(() => {
    clearTimer();
    recorderRef.current = null;
    startedAtRef.current = null;

    setIsRecording(false);
    setRecording(null);
    setDuration(0);
    setIsUploading(false);
    setUploadProgress(0);
    setError(null);
  }, [clearTimer]);

  useEffect(() => {
    return () => {
      clearTimer();

      const recorder = recorderRef.current;
      recorderRef.current = null;

      if (recorder) {
        void recorder.stopAndUnloadAsync().catch(() => undefined);
      }
    };
  }, [clearTimer]);

  return {
    isRecording,
    duration,
    recording,
    isUploading,
    uploadProgress,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    sendRecording,
    reset,
  };
}

function getVoiceExtension(mimeType: string): string {
  const normalized = mimeType.toLowerCase();

  if (normalized.includes("mpeg")) {
    return "mp3";
  }

  if (normalized.includes("wav")) {
    return "wav";
  }

  if (normalized.includes("ogg")) {
    return "ogg";
  }

  if (normalized.includes("m4a") || normalized.includes("mp4")) {
    return "m4a";
  }

  return "m4a";
}

export default useVoiceRecorder;
