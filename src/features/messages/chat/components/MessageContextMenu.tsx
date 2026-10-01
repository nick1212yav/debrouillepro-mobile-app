import React, { useCallback, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import type { Id } from "@/convex/_generated/dataModel";

import type { Message } from "../services/chat.service";
import chatService from "../services/chat.service";

interface MessageContextMenuProps {
  message: Message;
  currentUserId: Id<"users">;
  children: React.ReactNode;
  onReply?: (message: Message) => void;
  onForward?: (message: Message) => void;
}

export function MessageContextMenu({
  message,
  currentUserId,
  children,
  onReply,
  onForward,
}: MessageContextMenuProps) {
  const [visible, setVisible] = useState(false);

  const canReply = chatService.canReply(message);
  const canForward = chatService.canForward(message);

  const close = useCallback(() => {
    setVisible(false);
  }, []);

  const handleReply = useCallback(() => {
    close();

    if (canReply) {
      onReply?.(message);
    }
  }, [canReply, close, message, onReply]);

  const handleForward = useCallback(() => {
    close();

    if (canForward) {
      onForward?.(message);
    }
  }, [canForward, close, message, onForward]);

  const handleLongPress = useCallback(() => {
    if (canReply || canForward) {
      setVisible(true);
    }
  }, [canForward, canReply]);

  return (
    <>
      <Pressable
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

            <Text
              className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[1px] text-white/35"
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

            {canForward && (
              <Pressable
                onPress={handleForward}
                className="mb-2 min-h-12 justify-center rounded-2xl border border-white/[0.06] bg-white/[0.05] px-4 active:bg-white/10"
                accessibilityRole="button"
                accessibilityLabel="Transférer le message"
              >
                <Text className="text-[15px] font-medium text-white">
                  Transférer
                </Text>
              </Pressable>
            )}

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
