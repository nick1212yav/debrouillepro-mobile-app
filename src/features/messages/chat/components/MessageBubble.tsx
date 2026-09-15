import { View, Text } from "react-native";
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

  const senderName = message.sender?.name ?? "Utilisateur";

  const bubbleClass = own
    ? "rounded-br-md bg-white text-black"
    : "rounded-bl-md bg-white/10 text-white";

  const metaClass = own ? "text-black/40" : "text-white/30";

  return (
    <View className={["flex w-full", own ? "justify-end" : "justify-start"].join(
        " ",
      )}><MessageContextMenu message={message} currentUserId={currentUserId} onReply={onReply} onForward={onForward}><View className={[
            "min-w-0 max-w-[82%] rounded-2xl px-3 py-2",
            bubbleClass,
          ].join(" ")}>{}{}{}{!own && (
            <Text className="mb-1 truncate text-xs font-semibold opacity-60">{senderName}</Text>
          )}{}{}{}{message.replyToId && (
            <ReplyPreview replyToId={message.replyToId} own={own} />
          )}{}{}{}{}<MessageTypeRenderer message={message} own={own} />{}{}{}<View className={[
              "mt-1 flex items-center justify-end gap-1 text-[10px]",
              metaClass,
            ].join(" ")}>{chatService.isEdited(message) && <Text>modifié</Text>}<Text>{chatService.formatTime(message)}</Text>{own && <MessageStatus status={message.status} />}</View>{}{}{}<MessageReactions messageId={message._id} reactions={message.reactions} own={own} /></View></MessageContextMenu></View>
  );
}

export default MessageBubble;
