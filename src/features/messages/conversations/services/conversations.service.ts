import type { Id } from "@/convex/_generated/dataModel";

export type ConversationId = Id<"conversations">;

export type UserId = Id<"users">;

export interface ConversationParticipant {
  _id: UserId;
  name?: string;
  avatar?: string;
  email?: string;
  phone?: string;
}

export interface ConversationMemberSummary {
  userId: UserId;
  unreadCount: number;
}

export interface Conversation {
  _id: ConversationId;
  _creationTime: number;

  participantIds: UserId[];

  isGroup: boolean;

  groupName?: string;
  groupAvatar?: string;

  updatedAt: string;

  lastMessageText?: string;
  lastMessageSenderId?: UserId;

  participants: ConversationParticipant[];

  members: ConversationMemberSummary[];
}

export interface ConversationPreview {
  conversationId: ConversationId;
  title: string;
  avatar: string | null;
  isGroup: boolean;
  lastMessageText: string | null;
  lastMessageSenderId: UserId | null;
  updatedAt: string;
  unreadCount: number;
  participants: ConversationParticipant[];
}

export interface CreateDirectResult {
  conversationId: ConversationId;
  created: boolean;
}

export interface CreateGroupResult {
  conversationId: ConversationId;
  created: boolean;
}

export interface LeaveConversationResult {
  success: boolean;
  conversationId: ConversationId;
}

export interface MarkConversationReadResult {
  success: boolean;
  unreadCount: number;
}

export const conversationsService = {
  getTitle(conversation: Conversation, currentUserId?: UserId | null): string {
    if (conversation.isGroup) {
      return conversation.groupName?.trim() || "Groupe";
    }

    const otherParticipant = conversation.participants.find(
      (participant) => participant._id !== currentUserId,
    );

    return otherParticipant?.name?.trim() || "Conversation";
  },

  getAvatar(
    conversation: Conversation,
    currentUserId?: UserId | null,
  ): string | null {
    if (conversation.isGroup) {
      return conversation.groupAvatar ?? null;
    }

    const otherParticipant = conversation.participants.find(
      (participant) => participant._id !== currentUserId,
    );

    return otherParticipant?.avatar ?? null;
  },

  getUnreadCount(
    conversation: Conversation,
    currentUserId?: UserId | null,
  ): number {
    if (!currentUserId) {
      return 0;
    }

    return (
      conversation.members.find((member) => member.userId === currentUserId)
        ?.unreadCount ?? 0
    );
  },

  toPreview(
    conversation: Conversation,
    currentUserId?: UserId | null,
  ): ConversationPreview {
    return {
      conversationId: conversation._id,

      title: conversationsService.getTitle(conversation, currentUserId),

      avatar: conversationsService.getAvatar(conversation, currentUserId),

      isGroup: conversation.isGroup,

      lastMessageText: conversation.lastMessageText ?? null,

      lastMessageSenderId: conversation.lastMessageSenderId ?? null,

      updatedAt: conversation.updatedAt,

      unreadCount: conversationsService.getUnreadCount(
        conversation,
        currentUserId,
      ),

      participants: conversation.participants,
    };
  },

  sort(conversations: Conversation[]): Conversation[] {
    return [...conversations].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  },

  isGroup(conversation: Conversation | null | undefined): boolean {
    return conversation?.isGroup === true;
  },

  isDirect(conversation: Conversation | null | undefined): boolean {
    return !!conversation && !conversation.isGroup;
  },
};

export default conversationsService;
