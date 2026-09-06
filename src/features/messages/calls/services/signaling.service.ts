import type { Id } from "@/convex/_generated/dataModel";

import type { SignalingMessage } from "../types/call.types";

type SignalingListener = (message: SignalingMessage) => void;

class SignalingService {
  private listeners = new Map<string, Set<SignalingListener>>();

  private getKey(callId: Id<"calls">) {
    return callId.toString();
  }

  subscribe(callId: Id<"calls">, listener: SignalingListener) {
    const key = this.getKey(callId);

    const current = this.listeners.get(key) ?? new Set<SignalingListener>();

    current.add(listener);
    this.listeners.set(key, current);

    return () => {
      const listeners = this.listeners.get(key);

      if (!listeners) {
        return;
      }

      listeners.delete(listener);

      if (listeners.size === 0) {
        this.listeners.delete(key);
      }
    };
  }

  emit(message: SignalingMessage) {
    const listeners = this.listeners.get(this.getKey(message.callId));

    listeners?.forEach((listener) => {
      listener(message);
    });
  }

  clear(callId: Id<"calls">) {
    this.listeners.delete(this.getKey(callId));
  }
}

export const signalingService = new SignalingService();

export default signalingService;
