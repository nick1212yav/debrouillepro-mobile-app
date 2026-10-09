// src/features/messages/groups/hooks/useGroupMembers.ts

import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import groupsService from "../services/groups.service";

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
    ? groupsService.normalizeMembers(members)
    : [];

  return {
    members: normalizedMembers,
    isLoading: members === undefined,
  };
}

export default useGroupMembers;
