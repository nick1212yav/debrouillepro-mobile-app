import { View } from "react-native";
import type { Id } from "@/convex/_generated/dataModel";

interface MessageAttachmentsProps {
  messageId: Id<"messages">;
}

export function MessageAttachments({ messageId }: MessageAttachmentsProps) {
  // Le messageId est conservé dans le contrat du composant.
  // Le rendu des pièces jointes est délégué aux composants média
  // lorsqu'ils sont intégrés à cette zone.
  void messageId;

  return (
    <View
      className="mt-2 w-full"
      accessibilityLabel="Pièces jointes du message"
    />
  );
}

export default MessageAttachments;
