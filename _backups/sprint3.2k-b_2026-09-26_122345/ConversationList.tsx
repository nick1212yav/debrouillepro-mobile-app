import { View } from "react-native";
import type { Id } from "@/convex/_generated/dataModel";

import { ConversationItem } from "./ConversationItem";

import type { ConversationPreview } from "../services/conversations.service";

interface ConversationListProps {
  conversations: ConversationPreview[];
  currentConversationId?: Id<"conversations"> | null;
  onSelect: (conversationId: Id<"conversations">) => void;
}

export function ConversationList({
  conversations,
  currentConversationId,
  onSelect,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return null;
  }

  return (
    <View className="space-y-1">
      {conversations.map((conversation) => (
        <ConversationItem
          key={String(conversation.conversationId)}
          conversation={conversation}
          active={conversation.conversationId === currentConversationId}
          onPress={() => onSelect(conversation.conversationId)}
        />
      ))}
    </View>
  );
}

export default ConversationList;
