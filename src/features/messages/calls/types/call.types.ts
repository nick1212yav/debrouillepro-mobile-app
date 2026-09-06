import type { Id } from "@/convex/_generated/dataModel";

export type CallType = "audio" | "video";

export type CallStatus = "pending" | "active" | "ended" | "missed";

export interface Call {
  _id: Id<"calls">;
  _creationTime: number;
  conversationId: Id<"conversations">;
  initiatedBy: Id<"users">;
  type: CallType;
  status: CallStatus;
  startedAt: string;
  endedAt?: string;
}

export interface ActiveCall extends Call {
  isInitiator: boolean;
}

export interface CallParticipant {
  userId: Id<"users">;
  name: string;
  avatar?: string;
}

export interface CallWithInitiator extends Call {
  initiator: CallParticipant | null;
}

export interface StartCallResult {
  callId: Id<"calls">;
  conversationId: Id<"conversations">;
  type: CallType;
  status: "pending";
  startedAt: string;
}

export interface CallState {
  callId: Id<"calls"> | null;
  conversationId: Id<"conversations"> | null;
  type: CallType | null;
  status: CallStatus | null;
  isIncoming: boolean;
  isInitiator: boolean;
  isMinimized: boolean;
  isMuted: boolean;
  isCameraEnabled: boolean;
}

export interface CallDeviceState {
  audioInput: MediaDeviceInfo[];
  audioOutput: MediaDeviceInfo[];
  videoInput: MediaDeviceInfo[];
}

export interface WebRTCState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export interface SignalingMessage {
  callId: Id<"calls">;
  type: "offer" | "answer" | "ice-candidate" | "hangup";
  payload?: unknown;
  senderId?: Id<"users">;
}
