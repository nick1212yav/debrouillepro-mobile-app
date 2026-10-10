// src/features/messages/chat/components/MessageContextMenu.tsx

import React, { useCallback, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useMutation } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";

import { api } from "@/convex/_generated/api";

import type { Message } from "../services/chat.service";
import chatService from "../services/chat.service";

interface MessageContextMenuProps {
  message: Message;
  currentUserId: Id<"users">;
  children: React.ReactNode;
  onReply?: (message: Message) => void;
  /**
   * NOTE : le transfert est désactivé côté UI pour la clôture Messages.
   * La prop est conservée pour ne pas casser la chaîne
   * ChatView → MessagesArea → MessageBubble → MessageContextMenu,
   * mais aucune action "Transférer" n'est rendue.
   */
  onForward?: (message: Message) => void;
}

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export function MessageContextMenu({
  message,
  currentUserId,
  children,
  onReply,
}: MessageContextMenuProps) {
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);

  const toggleReaction = useMutation(api.messages.reactions.toggleReaction);
  const togglePin = useMutation(api.messages.pins.togglePin);

  const canReply = chatService.canReply(message);

  const isPinned = message.isPinned === true;

  const close = useCallback(() => {
    setVisible(false);
  }, []);

  const handleReply = useCallback(() => {
    close();

    if (canReply) {
      onReply?.(message);
    }
  }, [canReply, close, message, onReply]);

  const handleReaction = useCallback(
    async (emoji: string) => {
      if (pending) {
        return;
      }

      setPending(true);
      close();

      try {
        await toggleReaction({ messageId: message._id, emoji });
      } catch (error) {
        console.error("[MessageContextMenu] toggleReaction failed", error);
      } finally {
        setPending(false);
      }
    },
    [message._id, pending, toggleReaction],
  );

  const handlePin = useCallback(async () => {
    if (pending) {
      return;
    }

    setPending(true);
    close();

    try {
      await togglePin({ messageId: message._id });
    } catch (error) {
      console.error("[MessageContextMenu] togglePin failed", error);
    } finally {
      setPending(false);
    }
  }, [message._id, pending, togglePin]);

  const handlePress = useCallback(() => {
    // Intentionally empty: keeps the Pressable as an explicit touch target
    // without changing the message tap behavior.
  }, []);

  const handleLongPress = useCallback(() => {
    setVisible(true);
  }, []);

  return (
    <>
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={350}
        accessibilityRole="button"
        accessibilityLabel="Actions du message"
        accessibilityHint="Maintenez appuyé pour afficher les actions"
      >
        {children}
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <View className="flex-1 justify-end bg-black/60">
          <Pressable
            className="absolute inset-0"
            onPress={close}
            accessibilityLabel="Fermer le menu"
          />

          <View className="relative overflow-hidden rounded-t-3xl border border-white/10 bg-[#11131c] px-4 pb-8 pt-3">
            <View className="mb-4 items-center">
              <View className="h-1 w-10 rounded-full bg-white/20" />
            </View>

            {/* -------------------------------------------------------------- */}
            {/* RÉACTIONS RAPIDES                                               */}
            {/* -------------------------------------------------------------- */}

            <Text
              className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[1px] text-white/35"
              numberOfLines={1}
            >
              Réagir
            </Text>

            <View className="mb-4 flex-row items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.04] px-2 py-2">
              {QUICK_REACTIONS.map((emoji) => (
                <Pressable
                  key={emoji}
                  onPress={() => void handleReaction(emoji)}
                  disabled={pending}
                  accessibilityRole="button"
                  accessibilityLabel={`Réagir avec ${emoji}`}
                  hitSlop={6}
                  className="h-10 w-10 items-center justify-center rounded-full active:bg-white/10"
                >
                  <Text className="text-[22px] leading-7">{emoji}</Text>
                </Pressable>
              ))}
            </View>

            {/* -------------------------------------------------------------- */}
            {/* ACTIONS                                                         */}
            {/* -------------------------------------------------------------- */}

            <Text
              className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[1px] text-white/35"
              numberOfLines={1}
            >
              Actions du message
            </Text>

            {canReply && (
              <Pressable
                onPress={handleReply}
                className="mb-2 min-h-12 justify-center rounded-2xl border border-white/[0.06] bg-white/[0.05] px-4 active:bg-white/10"
                accessibilityRole="button"
                accessibilityLabel="Répondre au message"
              >
                <Text className="text-[15px] font-medium text-white">
                  Répondre
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => void handlePin()}
              disabled={pending}
              className="mb-2 min-h-12 justify-center rounded-2xl border border-white/[0.06] bg-white/[0.05] px-4 active:bg-white/10"
              accessibilityRole="button"
              accessibilityLabel={
                isPinned ? "Désépingler le message" : "Épingler le message"
              }
            >
              <Text className="text-[15px] font-medium text-white">
                {isPinned ? "Désépingler" : "Épingler"}
              </Text>
            </Pressable>

            <Pressable
              onPress={close}
              className="mt-1 min-h-12 items-center justify-center rounded-2xl bg-white/[0.03] active:bg-white/[0.08]"
              accessibilityRole="button"
              accessibilityLabel="Annuler"
            >
              <Text className="text-[15px] font-semibold text-white/55">
                Annuler
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default MessageContextMenu;
