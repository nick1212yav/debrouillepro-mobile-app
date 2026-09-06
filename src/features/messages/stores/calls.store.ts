// src/features/messages/stores/calls.store.ts

import { useCallback, useMemo, useState } from "react";
import type { ConversationId, UserId } from "../types";

export type CallType = "audio" | "video";

export type CallStatus =
  | "idle"
  | "incoming"
  | "outgoing"
  | "connecting"
  | "active"
  | "ended"
  | "failed";

export interface CallsStoreState {
  callId: string | null;
  conversationId: ConversationId | null;
  participantIds: UserId[];
  callType: CallType | null;
  status: CallStatus;
  isMuted: boolean;
  isCameraEnabled: boolean;
  isSpeakerEnabled: boolean;
  isMinimized: boolean;
  error: string | null;
}

export interface CallsStoreActions {
  startCall: (params: {
    callId: string;
    conversationId: ConversationId;
    participantIds: UserId[];
    callType: CallType;
  }) => void;

  setStatus: (status: CallStatus) => void;

  setMuted: (muted: boolean) => void;

  setCameraEnabled: (enabled: boolean) => void;

  setSpeakerEnabled: (enabled: boolean) => void;

  setMinimized: (minimized: boolean) => void;

  setError: (error: string | null) => void;

  endCall: () => void;

  reset: () => void;
}

export interface CallsStore extends CallsStoreState {
  actions: CallsStoreActions;
}

const INITIAL_STATE: CallsStoreState = {
  callId: null,
  conversationId: null,
  participantIds: [],
  callType: null,
  status: "idle",
  isMuted: false,
  isCameraEnabled: true,
  isSpeakerEnabled: true,
  isMinimized: false,
  error: null,
};

export function useCallsStore(): CallsStore {
  const [callId, setCallId] = useState<string | null>(INITIAL_STATE.callId);

  const [conversationId, setConversationId] = useState<ConversationId | null>(
    INITIAL_STATE.conversationId,
  );

  const [participantIds, setParticipantIds] = useState<UserId[]>(
    INITIAL_STATE.participantIds,
  );

  const [callType, setCallType] = useState<CallType | null>(
    INITIAL_STATE.callType,
  );

  const [status, setStatus] = useState<CallStatus>(INITIAL_STATE.status);

  const [isMuted, setMuted] = useState(INITIAL_STATE.isMuted);

  const [isCameraEnabled, setCameraEnabled] = useState(
    INITIAL_STATE.isCameraEnabled,
  );

  const [isSpeakerEnabled, setSpeakerEnabled] = useState(
    INITIAL_STATE.isSpeakerEnabled,
  );

  const [isMinimized, setMinimized] = useState(INITIAL_STATE.isMinimized);

  const [error, setError] = useState<string | null>(INITIAL_STATE.error);

  const startCall = useCallback(
    (params: {
      callId: string;
      conversationId: ConversationId;
      participantIds: UserId[];
      callType: CallType;
    }) => {
      setCallId(params.callId);
      setConversationId(params.conversationId);
      setParticipantIds(params.participantIds);
      setCallType(params.callType);
      setStatus("outgoing");
      setMuted(false);
      setCameraEnabled(true);
      setSpeakerEnabled(true);
      setMinimized(false);
      setError(null);
    },
    [],
  );

  const endCall = useCallback(() => {
    setStatus("ended");
  }, []);

  const reset = useCallback(() => {
    setCallId(null);
    setConversationId(null);
    setParticipantIds([]);
    setCallType(null);
    setStatus("idle");
    setMuted(false);
    setCameraEnabled(true);
    setSpeakerEnabled(true);
    setMinimized(false);
    setError(null);
  }, []);

  const actions = useMemo<CallsStoreActions>(
    () => ({
      startCall,
      setStatus,
      setMuted,
      setCameraEnabled,
      setSpeakerEnabled,
      setMinimized,
      setError,
      endCall,
      reset,
    }),
    [startCall, endCall, reset],
  );

  return {
    callId,
    conversationId,
    participantIds,
    callType,
    status,
    isMuted,
    isCameraEnabled,
    isSpeakerEnabled,
    isMinimized,
    error,
    actions,
  };
}

export default useCallsStore;
