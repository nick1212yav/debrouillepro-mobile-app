import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import groupsService, { type GroupMember } from "../services/groups.service";

export function useGroups(
  conversationId: Id<"conversations"> | null | undefined,
) {
  const members = useQuery(
    api.messages.members.list,
    conversationId
      ? {
          conversationId,
        }
      : "skip",
  );

  const count = useQuery(
    api.messages.members.count,
    conversationId
      ? {
          conversationId,
        }
      : "skip",
  );

  const currentMember = useQuery(
    api.messages.members.getCurrent,
    conversationId
      ? {
          conversationId,
        }
      : "skip",
  );

  const normalizedMembers = members
    ? groupsService.normalizeMembers(members as GroupMember[])
    : [];

  return {
    members: normalizedMembers,
    memberCount: count ?? normalizedMembers.length,
    currentMember: currentMember
      ? groupsService.normalizeMember(currentMember as GroupMember)
      : null,
    isLoading:
      members === undefined ||
      count === undefined ||
      currentMember === undefined,
  };
}

export default useGroups;
