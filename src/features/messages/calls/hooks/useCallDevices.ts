import { useCallback, useEffect, useState } from "react";

import type { CallDeviceState } from "../types/call.types";

const EMPTY_DEVICES: CallDeviceState = {
  audioInput: [],
  audioOutput: [],
  videoInput: [],
};

type PermissionType = "audio" | "video";

export function useCallDevices() {
  const [devices, setDevices] = useState<CallDeviceState>(EMPTY_DEVICES);

  const [permissionError, setPermissionError] = useState<string | null>(null);

  /**
   * Vérifie si les API média sont disponibles.
   */
  const isMediaDevicesSupported = useCallback(() => {
    return (
      typeof navigator !== "undefined" &&
      typeof navigator.mediaDevices !== "undefined"
    );
  }, []);

  /**
   * Récupère la liste des périphériques disponibles.
   */
  const refreshDevices = useCallback(async (): Promise<void> => {
    if (!isMediaDevicesSupported()) {
      setDevices(EMPTY_DEVICES);
      setPermissionError(
        "Les périphériques multimédia ne sont pas disponibles sur cet appareil.",
      );
      return;
    }

    try {
      const list = await navigator.mediaDevices.enumerateDevices();

      setDevices({
        audioInput: list.filter((device) => device.kind === "audioinput"),
        audioOutput: list.filter((device) => device.kind === "audiooutput"),
        videoInput: list.filter((device) => device.kind === "videoinput"),
      });

      setPermissionError(null);
    } catch (error) {
      setPermissionError(
        error instanceof Error
          ? error.message
          : "Impossible de récupérer les périphériques.",
      );
    }
  }, [isMediaDevicesSupported]);

  /**
   * Demande l'autorisation d'utiliser le microphone
   * ou la caméra.
   *
   * Le stream temporaire est immédiatement arrêté après
   * l'autorisation afin de libérer le matériel.
   */
  const requestPermissions = useCallback(
    async (type: PermissionType): Promise<boolean> => {
      if (!isMediaDevicesSupported()) {
        const message =
          "Les appels multimédia ne sont pas disponibles sur cet appareil.";

        setPermissionError(message);

        throw new Error(message);
      }

      setPermissionError(null);

      let stream: MediaStream | null = null;

      try {
        stream = await navigator.mediaDevices.getUserMedia(
          type === "video"
            ? {
                audio: true,
                video: true,
              }
            : {
                audio: true,
                video: false,
              },
        );

        return true;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "L'autorisation d'utiliser les périphériques a été refusée.";

        setPermissionError(message);

        throw error;
      } finally {
        stream?.getTracks().forEach((track) => {
          track.stop();
        });

        await refreshDevices();
      }
    },
    [isMediaDevicesSupported, refreshDevices],
  );

  /**
   * Chargement initial et mise à jour automatique lorsque
   * les périphériques connectés changent.
   */
  useEffect(() => {
    if (
      typeof navigator === "undefined" ||
      typeof navigator.mediaDevices === "undefined"
    ) {
      return;
    }

    void refreshDevices();

    const handleDeviceChange = () => {
      void refreshDevices();
    };

    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        handleDeviceChange,
      );
    };
  }, [refreshDevices]);

  return {
    devices,
    permissionError,
    refreshDevices,
    requestPermissions,
  };
}

export default useCallDevices;
