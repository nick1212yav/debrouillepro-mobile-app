// src/features/messages/calls/hooks/useCallDevices.ts

import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

import type { CallDeviceState } from "../types/call.types";

const emptyDevices: CallDeviceState = {
  audioInput: [],
  audioOutput: [],
  videoInput: [],
};

type WebMediaDevices = MediaDevices;

function getWebMediaDevices(): WebMediaDevices | null {
  if (
    Platform.OS !== "web" ||
    typeof navigator === "undefined" ||
    !navigator.mediaDevices
  ) {
    return null;
  }

  return navigator.mediaDevices;
}

export function useCallDevices() {
  const [devices, setDevices] = useState<CallDeviceState>(emptyDevices);

  const [permissionError, setPermissionError] = useState<string | null>(null);

  const refreshDevices = useCallback(async () => {
    const mediaDevices = getWebMediaDevices();

    if (!mediaDevices) {
      return;
    }

    try {
      const list = await mediaDevices.enumerateDevices();

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
  }, []);

  const requestPermissions = useCallback(
    async (type: "audio" | "video") => {
      const mediaDevices = getWebMediaDevices();

      if (!mediaDevices) {
        throw new Error(
          "La gestion directe des périphériques multimédia n'est pas disponible sur cette plateforme.",
        );
      }

      try {
        const stream = await mediaDevices.getUserMedia(
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

        stream.getTracks().forEach((track) => {
          track.stop();
        });

        await refreshDevices();

        return true;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Impossible d'obtenir les permissions multimédia.";

        setPermissionError(message);
        throw error;
      }
    },
    [refreshDevices],
  );

  useEffect(() => {
    const mediaDevices = getWebMediaDevices();

    if (!mediaDevices) {
      return;
    }

    void refreshDevices();

    const handleDeviceChange = () => {
      void refreshDevices();
    };

    mediaDevices.addEventListener("devicechange", handleDeviceChange);

    return () => {
      mediaDevices.removeEventListener("devicechange", handleDeviceChange);
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
