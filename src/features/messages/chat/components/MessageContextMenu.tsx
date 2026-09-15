import { View, GestureResponderEvent } from "react-native";
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
  const handleContextMenu = (event: GestureResponderEvent) => {
    event.preventDefault();

    const action = window.prompt(
      "Action : répondre, transférer ou annuler",
      "répondre",
    );

    if (action === "répondre" && chatService.canReply(message)) {
      onReply?.(message);
    }

    if (action === "transférer" && chatService.canForward(message)) {
      onForward?.(message);
    }
  };

  return <View>{children}</View>;
}

export default MessageContextMenu;
