import { useCallback, useEffect, useState } from "react";

import type { CallDeviceState } from "../types/call.types";

const emptyDevices: CallDeviceState = {
  audioInput: [],
  audioOutput: [],
  videoInput: [],
};

export function useCallDevices() {
  const [devices, setDevices] = useState<CallDeviceState>(emptyDevices);

  const [permissionError, setPermissionError] = useState<string | null>(null);

  const refreshDevices = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
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
  }, []);

  const requestPermissions = useCallback(
    async (type: "audio" | "video") => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices) {
        throw new Error(
          "Les appels multimédia ne sont pas disponibles sur cet appareil.",
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia(
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

      stream.getTracks().forEach((track) => track.stop());

      await refreshDevices();

      return true;
    },
    [refreshDevices],
  );

  useEffect(() => {
    void refreshDevices();

    const handleDeviceChange = () => {
      void refreshDevices();
    };

    navigator.mediaDevices?.addEventListener(
      "devicechange",
      handleDeviceChange,
    );

    return () => {
      navigator.mediaDevices?.removeEventListener(
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
