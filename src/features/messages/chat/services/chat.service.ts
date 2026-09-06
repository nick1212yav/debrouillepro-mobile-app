import type { Doc, Id } from "@/convex/_generated/dataModel";

export type MessageId = Id<"messages">;

export type ConversationId = Id<"conversations">;

export type UserId = Id<"users">;

export type Message = Doc<"messages"> & {
  sender: Doc<"users"> | null;
};

export interface MessageGroup {
  date: string;
  messages: Message[];
}

export interface MessageComposerState {
  text: string;
  replyToId: MessageId | null;
  sharedPublicationId: Id<"publications"> | null;
}

export interface SendMessageInput {
  conversationId: ConversationId;
  text: string;
  replyToId?: MessageId;
  sharedPublicationId?: Id<"publications">;
}

export const chatService = {
  isOwnMessage(
    message: Message,
    currentUserId: UserId | null | undefined,
  ): boolean {
    return !!currentUserId && message.senderId === currentUserId;
  },

  getSenderName(message: Message): string {
    return message.sender?.name ?? "Utilisateur";
  },

  getSenderAvatar(message: Message): string | null {
    return message.sender?.avatar ?? null;
  },

  getMessageText(message: Message): string {
    if (message.isDeleted) {
      return "Message supprimé";
    }

    return message.text ?? "";
  },

  isDeleted(message: Message): boolean {
    return message.isDeleted === true;
  },

  isEdited(message: Message): boolean {
    return message.isEdited === true;
  },

  isVoice(message: Message): boolean {
    return message.type === "voice";
  },

  isPinned(message: Message): boolean {
    return message.isPinned === true;
  },

  getDate(message: Message): Date | null {
    const raw = message._creationTime;

    const date = new Date(raw);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  },

  formatTime(message: Message): string {
    const date = chatService.getDate(message);

    if (!date) {
      return "";
    }

    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  },

  formatDate(message: Message): string {
    const date = chatService.getDate(message);

    if (!date) {
      return "";
    }

    return date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  },

  shouldShowDateSeparator(previous: Message | null, current: Message): boolean {
    if (!previous) {
      return true;
    }

    const previousDate = chatService.getDate(previous);

    const currentDate = chatService.getDate(current);

    if (!previousDate || !currentDate) {
      return false;
    }

    return previousDate.toDateString() !== currentDate.toDateString();
  },

  groupByDate(messages: Message[]): MessageGroup[] {
    const groups = new Map<string, Message[]>();

    for (const message of messages) {
      const date = chatService.formatDate(message);

      const existing = groups.get(date);

      if (existing) {
        existing.push(message);
      } else {
        groups.set(date, [message]);
      }
    }

    return Array.from(groups.entries()).map(([date, groupedMessages]) => ({
      date,
      messages: groupedMessages,
    }));
  },

  sortAscending(messages: Message[]): Message[] {
    return [...messages].sort((a, b) => a._creationTime - b._creationTime);
  },

  sortDescending(messages: Message[]): Message[] {
    return [...messages].sort((a, b) => b._creationTime - a._creationTime);
  },

  getStatusLabel(status: string | undefined): string {
    switch (status) {
      case "sent":
        return "Envoyé";

      case "delivered":
        return "Distribué";

      case "read":
        return "Lu";

      default:
        return "";
    }
  },

  canReply(message: Message): boolean {
    return !chatService.isDeleted(message);
  },

  canForward(message: Message): boolean {
    return !chatService.isDeleted(message);
  },

  canDelete(
    message: Message,
    currentUserId: UserId | null | undefined,
  ): boolean {
    return (
      chatService.isOwnMessage(message, currentUserId) &&
      !chatService.isDeleted(message)
    );
  },
};

export default chatService;
