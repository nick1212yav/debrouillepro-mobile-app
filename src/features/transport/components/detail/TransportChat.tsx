// src/features/transport/components/detail/TransportChat.tsx

import { useEffect, useRef, useState, type FormEvent } from "react";
import { MessageSquare, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useDriverChat } from "../../hooks/useDriverChat";

interface TransportChatProps {
  bookingId: string;
  driverName?: string;
}

export function TransportChat({
  bookingId,
  driverName = "Conducteur",
}: TransportChatProps) {
  const { messages, sendMessage } = useDriverChat(bookingId);

  const [inputText, setInputText] = useState("");

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const text = inputText.trim();

    if (!text) {
      return;
    }

    try {
      await Promise.resolve(sendMessage(text));
      setInputText("");
    } catch (error) {
      console.error("Impossible d'envoyer le message:", error);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages.length]);

  return (
    <div className="select-none space-y-4 rounded-3xl border border-white/5 bg-white/[0.02] p-5">
      {/* HEADER */}

      <div className="flex items-center gap-2">
        <MessageSquare size={16} className="text-violet-400" />

        <span className="text-[10px] font-black uppercase tracking-widest text-violet-400">
          Messagerie de course
        </span>
      </div>

      {/* MESSAGES */}

      <div
        className="h-48 space-y-3.5 overflow-y-auto rounded-2xl border border-white/5 bg-black/40 p-3.5"
        style={{ scrollbarWidth: "none" }}
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4 text-center">
            <p className="text-[11px] text-white/30">
              Envoyez un message à {driverName}.
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isPassenger = message.sender === "passenger";

            return (
              <div
                key={message.id}
                className={`flex ${
                  isPassenger ? "justify-end" : "justify-start"
                }`}
              >
                <div className="max-w-[85%] space-y-1">
                  <div
                    className={[
                      "rounded-2xl p-3 text-[11px] font-semibold leading-relaxed",
                      isPassenger
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                        : "border border-white/5 bg-white/5 text-white/80",
                    ].join(" ")}
                  >
                    {message.text}
                  </div>

                  <p
                    className={[
                      "px-1 text-[7px] text-white/30",
                      isPassenger ? "text-right" : "text-left",
                    ].join(" ")}
                  >
                    {isPassenger ? "Vous" : driverName}
                  </p>
                </div>
              </div>
            );
          })
        )}

        <div ref={chatEndRef} />
      </div>

      {/* MESSAGE INPUT */}

      <form onSubmit={handleSend} className="flex gap-2">
        <Input
          value={inputText}
          onChange={(event) => setInputText(event.target.value)}
          placeholder={`Écrire un message à ${driverName}...`}
          className="h-10 flex-1 rounded-xl border-white/10 bg-white/5 text-xs placeholder:text-white/20"
        />

        <Button
          type="submit"
          size="icon"
          disabled={!inputText.trim()}
          className="h-10 w-10 shrink-0 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Envoyer le message"
          title="Envoyer"
        >
          <Send size={14} className="text-white" />
        </Button>
      </form>
    </div>
  );
}

export default TransportChat;
