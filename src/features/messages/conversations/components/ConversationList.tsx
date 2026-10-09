// src/features/messages/conversations/components/ConversationList.tsx

import { StyleSheet, View } from "react-native";
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
    <View
      style={styles.container}
      accessibilityRole="list"
      accessibilityLabel="Liste des conversations"
    >
      {conversations.map((conversation) => {
        const conversationId = conversation.conversationId;

        return (
          <ConversationItem
            key={String(conversationId)}
            conversation={conversation}
            active={conversationId === currentConversationId}
            onClick={() => onSelect(conversationId)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
});

export default ConversationList;
