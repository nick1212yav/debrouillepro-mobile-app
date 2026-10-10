import { Text, View } from "react-native";
import type { Id } from "@/convex/_generated/dataModel";

import chatService, { type Message } from "../services/chat.service";

import { MessageContextMenu } from "./MessageContextMenu";
import { MessageReactions } from "./MessageReactions";
import { MessageStatus } from "./MessageStatus";
import { MessageTypeRenderer } from "./MessageTypeRenderer";
import { ReplyPreview } from "./ReplyPreview";

interface MessageBubbleProps {
  message: Message;
  currentUserId: Id<"users">;
  onReply?: (message: Message) => void;
  onForward?: (message: Message) => void;
}

export function MessageBubble({
  message,
  currentUserId,
  onReply,
  onForward,
}: MessageBubbleProps) {
  const own = chatService.isOwnMessage(message, currentUserId);

  const senderName = message.sender?.name?.trim() || "Utilisateur";
  const edited = chatService.isEdited(message);
  const formattedTime = chatService.formatTime(message);

  /**
   * Voice messages contain a native audio player with a fixed usable
   * width. Without a minimum width on the bubble, the RN flex layout
   * can shrink the parent and compress the player into a narrow column.
   */
  const isVoiceMessage = message.type === "voice";

  const bubbleClass = own
    ? "rounded-2xl rounded-br-md bg-white"
    : "rounded-2xl rounded-bl-md bg-white/[0.08] border border-white/[0.06]";

  const textClass = own ? "text-black" : "text-white";

  const metaClass = own ? "text-black/45" : "text-white/35";

  return (
    <View
      className={["w-full px-1", own ? "items-end" : "items-start"].join(" ")}
    >
      <MessageContextMenu
        message={message}
        currentUserId={currentUserId}
        onReply={onReply}
        onForward={onForward}
      >
        <View
          className={[
            "min-w-0 max-w-[86%] px-3.5 py-2.5",
            bubbleClass,
            textClass,
          ].join(" ")}
          style={
            isVoiceMessage
              ? {
                  minWidth: 288,
                  maxWidth: "86%",
                  overflow: "visible",
                }
              : {
                  overflow: "hidden",
                }
          }
        >
          {/* Expéditeur — uniquement pour les messages reçus */}
          {!own && (
            <Text
              className="mb-1.5 text-[12px] font-semibold text-white/65"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {senderName}
            </Text>
          )}

          {/* Réponse au message précédent */}
          {message.replyToId && (
            <View className="mb-1.5">
              <ReplyPreview replyToId={message.replyToId} own={own} />
            </View>
          )}

          {/* Contenu principal du message */}
          <View
            className="min-w-0"
            style={
              isVoiceMessage
                ? {
                    width: "100%",
                    minWidth: 260,
                    alignSelf: "stretch",
                  }
                : undefined
            }
          >
            <MessageTypeRenderer message={message} own={own} />
          </View>

          {/* Métadonnées : édition + heure + statut */}
          <View
            className={[
              "mt-1.5 flex-row items-center justify-end",
              metaClass,
            ].join(" ")}
          >
            {message.isPinned && (
              <Text className="mr-1 text-[10px] leading-3">📌</Text>
            )}

            {edited && (
              <Text className="mr-1 text-[10px] leading-3">modifié</Text>
            )}

            <Text className="text-[10px] leading-3">{formattedTime}</Text>

            {own && (
              <View className="ml-1">
                <MessageStatus status={message.status} />
              </View>
            )}
          </View>

          {/* Réactions */}
          {message.reactions && (
            <View className="mt-1">
              <MessageReactions
                messageId={message._id}
                reactions={message.reactions}
                own={own}
              />
            </View>
          )}
        </View>
      </MessageContextMenu>
    </View>
  );
}

export default MessageBubble;
