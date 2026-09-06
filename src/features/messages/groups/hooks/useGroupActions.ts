import { useMutation } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useGroupActions() {
  const addMemberMutation = useMutation(api.messages.members.add);

  const addManyMembersMutation = useMutation(api.messages.members.addMany);

  const removeMemberMutation = useMutation(api.messages.members.remove);

  const leaveMutation = useMutation(api.messages.members.leave);

  const ensureMemberMutation = useMutation(api.messages.members.ensure);

  const syncMembersMutation = useMutation(api.messages.members.sync);

  const addMember = async (
    conversationId: Id<"conversations">,
    userId: Id<"users">,
  ) => {
    return addMemberMutation({
      conversationId,
      userId,
    });
  };

  const addMembers = async (
    conversationId: Id<"conversations">,
    userIds: Id<"users">[],
  ) => {
    if (userIds.length === 0) {
      return {
        success: true,
        added: [],
        alreadyMembers: [],
      };
    }

    return addManyMembersMutation({
      conversationId,
      userIds,
    });
  };

  const removeMember = async (
    conversationId: Id<"conversations">,
    userId: Id<"users">,
  ) => {
    return removeMemberMutation({
      conversationId,
      userId,
    });
  };

  const leaveGroup = async (conversationId: Id<"conversations">) => {
    return leaveMutation({
      conversationId,
    });
  };

  const ensureMember = async (
    conversationId: Id<"conversations">,
    userId?: Id<"users">,
  ) => {
    return ensureMemberMutation({
      conversationId,
      ...(userId ? { userId } : {}),
    });
  };

  const syncMembers = async (conversationId: Id<"conversations">) => {
    return syncMembersMutation({
      conversationId,
    });
  };

  return {
    addMember,
    addMembers,
    removeMember,
    leaveGroup,
    ensureMember,
    syncMembers,
  };
}

export default useGroupActions;
