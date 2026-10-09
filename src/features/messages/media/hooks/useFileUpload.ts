// src/features/messages/media/hooks/useFileUpload.ts

import { useCallback, useRef, useState } from "react";
import { mediaService } from "../services/media.service";

export interface NativeUploadFile {
  uri: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  duration?: number;
}

export interface FileUploadResult {
  fileId: string;
  fileName: string;
  mimeType: string;
  duration?: number;
}

interface UseFileUploadOptions {
  generateUploadUrl: () => Promise<string>;
}

export function useFileUpload({ generateUploadUrl }: UseFileUploadOptions) {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const upload = useCallback(
    async (file: NativeUploadFile): Promise<FileUploadResult> => {
      const controller = new AbortController();

      abortControllerRef.current = controller;

      setIsUploading(true);
      setProgress(0);
      setError(null);

      try {
        if (!file.uri) {
          throw new Error("Le fichier sélectionné est invalide.");
        }

        setProgress(10);

        const mediaFile = {
          uri: file.uri,
          name: file.fileName ?? "fichier",
          type: file.mimeType ?? "application/octet-stream",
          size: file.fileSize ?? 0,
          ...(file.width !== undefined ? { width: file.width } : {}),
          ...(file.height !== undefined ? { height: file.height } : {}),
          ...(file.duration !== undefined ? { duration: file.duration } : {}),
        };

        setProgress(25);

        if (controller.signal.aborted) {
          throw new Error("Upload annulé.");
        }

        const fileId = await mediaService.uploadFile(
          generateUploadUrl,
          mediaFile,
        );

        if (!fileId) {
          throw new Error("Convex n'a pas retourné l'identifiant du fichier.");
        }

        setProgress(100);

        return {
          fileId: String(fileId),
          fileName: file.fileName ?? "fichier",
          mimeType: file.mimeType ?? "application/octet-stream",
          ...(file.duration !== undefined ? { duration: file.duration } : {}),
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

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsUploading(false);
  }, []);

  const reset = useCallback(() => {
    setProgress(0);
    setError(null);
    setIsUploading(false);
  }, []);

  return {
    upload,
    cancel,
    reset,
    progress,
    isUploading,
    error,
  };
}

export default useFileUpload;
