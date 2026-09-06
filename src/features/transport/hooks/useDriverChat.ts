// src/features/transport/hooks/useDriverChat.ts
import { useState, useEffect } from "react";

export interface ChatMessage {
  id: string;
  sender: "passenger" | "driver";
  text: string;
  timestamp: string;
}

export function useDriverChat(bookingId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!bookingId) return;

    // Simulation de réception d'un premier message d'accueil de bienvenue du chauffeur [2]
    const timeout = setTimeout(() => {
      setMessages([
        {
          id: "msg_init",
          sender: "driver",
          text: "Bonjour ! Je suis en route, j'arrive d'ici quelques minutes. [2]",
          timestamp: new Date().toISOString(),
        },
      ]);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [bookingId]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: "passenger",
      text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);
  };

  return {
    messages,
    sendMessage,
  };
}
