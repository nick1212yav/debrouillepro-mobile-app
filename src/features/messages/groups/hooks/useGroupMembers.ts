import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import groupsService, { type GroupMember } from "../services/groups.service";

export function useGroupMembers(
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

  const normalizedMembers = members
    ? groupsService.normalizeMembers(members as GroupMember[])
    : [];

  return {
    members: normalizedMembers,
    isLoading: members === undefined,
  };
}

export default useGroupMembers;
