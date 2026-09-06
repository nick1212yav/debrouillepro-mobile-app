function NativePrompt(message: string): string | null {
  Alert.alert(message, "Saisie requise");
  return null;
}
import { View, Alert, GestureResponderEvent } from "react-native";
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
    const action = NativePrompt("Action : répondre, transférer ou annuler");

    if (action === "répondre" && chatService.canReply(message)) {
      onReply?.(message);
    }

    if (action === "transférer" && chatService.canForward(message)) {
      onForward?.(message);
    }
  };

  return <View onContextMenu={handleContextMenu}>{children}</View>;
}

export default MessageContextMenu;
