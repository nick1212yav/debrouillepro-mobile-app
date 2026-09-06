// src/features/messages/media/hooks/useFileUpload.ts

import { useCallback, useRef, useState } from "react";

import mediaService, { type UploadFileResult } from "../services/media.service";

type GenerateUploadUrlMutation = () => Promise<string>;

export function useFileUpload(generateUploadUrl: GenerateUploadUrlMutation) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const uploadFile = useCallback(
    async (file: File): Promise<UploadFileResult> => {
      setIsUploading(true);
      setProgress(0);
      setError(null);

      const controller = new AbortController();

      abortControllerRef.current = controller;

      try {
        // ================================================================
        // VALIDATION
        // ================================================================

        if (file.size <= 0) {
          throw new Error("Le fichier est vide.");
        }

        if (controller.signal.aborted) {
          throw new DOMException("Upload annulé", "AbortError");
        }

        setProgress(10);

        // ================================================================
        // MÉTADONNÉES IMAGE
        // ================================================================

        const dimensions = await mediaService.getImageDimensions(file);

        setProgress(25);

        // ================================================================
        // MÉTADONNÉES VIDÉO
        // ================================================================

        const duration = await mediaService.getVideoDuration(file);

        setProgress(40);

        if (controller.signal.aborted) {
          throw new DOMException("Upload annulé", "AbortError");
        }

        // ================================================================
        // UPLOAD CONVEX STORAGE
        // ================================================================
        //
        // IMPORTANT :
        //
        // mediaService.uploadFile() attend la mutation
        // generateUploadUrl, pas l'URL déjà générée.
        //
        // Le service gère donc :
        //
        // generateUploadUrl()
        //        ↓
        // upload HTTP
        //        ↓
        // storageId
        //
        // ================================================================

        const fileId = await mediaService.uploadFile(generateUploadUrl, file);

        if (!fileId) {
          throw new Error("Convex n'a pas retourné l'identifiant du fichier.");
        }

        setProgress(100);

        // ================================================================
        // RESULTAT
        // ================================================================

        return {
          fileId,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          fileSize: file.size,
          ...dimensions,
          duration,
        };
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Impossible d'envoyer le fichier.";

        setError(message);

        throw err;
      } finally {
        setIsUploading(false);
        abortControllerRef.current = null;
      }
    },
    [generateUploadUrl],
  );

  // ================================================================
  // ANNULER
  // ================================================================

  const cancelUpload = useCallback(() => {
    abortControllerRef.current?.abort();

    abortControllerRef.current = null;

    setIsUploading(false);
    setProgress(0);
  }, []);

  // ================================================================
  // RESET
  // ================================================================

  const reset = useCallback(() => {
    setError(null);
    setProgress(0);
    setIsUploading(false);
  }, []);

  return {
    isUploading,
    progress,
    error,

    uploadFile,
    cancelUpload,
    reset,
  };
}

export default useFileUpload;
