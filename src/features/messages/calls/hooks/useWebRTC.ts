import { useCallback, useEffect, useRef, useState } from "react";

import type { WebRTCState } from "../types/call.types";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

export function useWebRTC(type: "audio" | "video" = "audio") {
  const peerRef = useRef<RTCPeerConnection | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);

  const remoteStreamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<WebRTCState>({
    localStream: null,
    remoteStream: null,
    peerConnection: null,
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  const createPeerConnection = useCallback(() => {
    const peer = new RTCPeerConnection(ICE_SERVERS);

    const remoteStream = new MediaStream();

    peer.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });

      remoteStreamRef.current = remoteStream;

      setState((current) => ({
        ...current,
        remoteStream,
      }));
    };

    peer.onconnectionstatechange = () => {
      const connected = peer.connectionState === "connected";

      const connecting =
        peer.connectionState === "connecting" || peer.connectionState === "new";

      setState((current) => ({
        ...current,
        isConnected: connected,
        isConnecting: connecting,
      }));
    };

    peerRef.current = peer;

    setState((current) => ({
      ...current,
      peerConnection: peer,
    }));

    return peer;
  }, []);

  const startLocalStream = useCallback(async () => {
    if (typeof undefined === "undefined" || !undefined) {
      throw new Error("Les appareils multimédia ne sont pas disponibles.");
    }

    setState((current) => ({
      ...current,
      isConnecting: true,
      error: null,
    }));

    try {
      const stream = await undefined.getUserMedia(
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

      localStreamRef.current = stream;

      setState((current) => ({
        ...current,
        localStream: stream,
      }));

      const peer = peerRef.current ?? createPeerConnection();

      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream);
      });

      return stream;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible d'accéder au microphone ou à la caméra.";

      setState((current) => ({
        ...current,
        isConnecting: false,
        error: message,
      }));

      throw error;
    }
  }, [createPeerConnection, type]);

  const createOffer = useCallback(async () => {
    const peer = peerRef.current ?? createPeerConnection();

    const offer = await peer.createOffer();

    await peer.setLocalDescription(offer);

    return offer;
  }, [createPeerConnection]);

  const createAnswer = useCallback(async () => {
    const peer = peerRef.current ?? createPeerConnection();

    const answer = await peer.createAnswer();

    await peer.setLocalDescription(answer);

    return answer;
  }, [createPeerConnection]);

  const setRemoteDescription = useCallback(
    async (description: RTCSessionDescriptionInit) => {
      const peer = peerRef.current ?? createPeerConnection();

      await peer.setRemoteDescription(description);
    },
    [createPeerConnection],
  );

  const addIceCandidate = useCallback(
    async (candidate: RTCIceCandidateInit) => {
      const peer = peerRef.current;

      if (!peer) {
        return;
      }

      await peer.addIceCandidate(candidate);
    },
    [],
  );

  const toggleMicrophone = useCallback((enabled?: boolean) => {
    const stream = localStreamRef.current;

    if (!stream) {
      return false;
    }

    const tracks = stream.getAudioTracks();

    tracks.forEach((track) => {
      track.enabled = enabled ?? !track.enabled;
    });

    return tracks[0]?.enabled ?? false;
  }, []);

  const toggleCamera = useCallback((enabled?: boolean) => {
    const stream = localStreamRef.current;

    if (!stream) {
      return false;
    }

    const tracks = stream.getVideoTracks();

    tracks.forEach((track) => {
      track.enabled = enabled ?? !track.enabled;
    });

    return tracks[0]?.enabled ?? false;
  }, []);

  const stop = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());

    remoteStreamRef.current?.getTracks().forEach((track) => track.stop());

    peerRef.current?.getSenders().forEach((sender) => {
      sender.track?.stop();
    });

    peerRef.current?.close();

    peerRef.current = null;
    localStreamRef.current = null;
    remoteStreamRef.current = null;

    setState({
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      isConnected: false,
      isConnecting: false,
      error: null,
    });
  }, []);

  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach((track) => track.stop());

      peerRef.current?.close();
    };
  }, []);

  return {
    ...state,

    startLocalStream,
    createPeerConnection,
    createOffer,
    createAnswer,
    setRemoteDescription,
    addIceCandidate,
    toggleMicrophone,
    toggleCamera,
    stop,
  };
}

export default useWebRTC;
