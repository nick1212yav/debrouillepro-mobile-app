import { View } from "react-native";
import type { Id } from "@/convex/_generated/dataModel";

interface MessageAttachmentsProps {
  messageId: Id<"messages">;
}

export function MessageAttachments({ messageId }: MessageAttachmentsProps) {
  return (
    <View data-message-id={String(messageId)} className="mt-2">
      {/* Le module media rend les attachments réels.
          Ce composant sert de point d'insertion dans le chat. */}
    </View>
  );
}

export default MessageAttachments;
