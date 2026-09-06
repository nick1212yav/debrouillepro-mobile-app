import type { Id } from "@/convex/_generated/dataModel";

export type GroupId = Id<"conversations">;
export type UserId = Id<"users">;

export interface GroupMemberUser {
  _id: UserId;
  name?: string;
  avatar?: string;
  email?: string;
  phone?: string;
}

export interface GroupMember {
  _id?: Id<"conversationMembers">;
  conversationId: GroupId;
  userId: UserId;
  unreadCount: number;
  role?: "owner" | "admin" | "member";
  isMuted?: boolean;
  joinedAt?: number;
  lastReadAt?: number;
  user?: GroupMemberUser | null;
}

export interface AddMemberResult {
  success: boolean;
  alreadyMember: boolean;
  conversationId: GroupId;
  userId: UserId;
}

export interface AddManyMembersResult {
  success: boolean;
  added: UserId[];
  alreadyMembers: UserId[];
}

export interface RemoveMemberResult {
  success: boolean;
  conversationId: GroupId;
  userId: UserId;
}

export interface EnsureMemberResult {
  created: boolean;
  member: GroupMember;
}

export interface SyncMembersResult {
  success: boolean;
  created: UserId[];
  existingCount: number;
  totalParticipants: number;
}

export interface UnreadCountResult {
  success: boolean;
  unreadCount: number;
}

export const groupsService = {
  isGroup(
    conversation:
      | {
          isGroup?: boolean;
        }
      | null
      | undefined,
  ): boolean {
    return conversation?.isGroup === true;
  },

  normalizeMember(member: GroupMember): GroupMember {
    return {
      ...member,
      unreadCount: member.unreadCount ?? 0,
      role: member.role ?? "member",
      isMuted: member.isMuted ?? false,
    };
  },

  normalizeMembers(members: GroupMember[]): GroupMember[] {
    return members.map(groupsService.normalizeMember);
  },

  getDisplayName(member: GroupMember): string {
    return member.user?.name?.trim() || "Utilisateur";
  },

  getAvatar(member: GroupMember): string | null {
    return member.user?.avatar ?? null;
  },

  isCurrentUser(
    member: GroupMember,
    currentUserId: UserId | null | undefined,
  ): boolean {
    return !!currentUserId && member.userId === currentUserId;
  },

  canInviteMembers(member: GroupMember | null): boolean {
    /*
     * Le backend actuel autorise un membre
     * existant à inviter dans un groupe.
     */
    return !!member;
  },

  canRemoveMember(
    member: GroupMember,
    currentUserId: UserId | null | undefined,
  ): boolean {
    /*
     * Le backend actuel n'autorise que
     * l'auto-suppression.
     */
    return !!currentUserId && member.userId === currentUserId;
  },
};

export default groupsService;
