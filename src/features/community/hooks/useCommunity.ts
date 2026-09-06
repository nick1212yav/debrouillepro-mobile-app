import { UIService } from "@/core/sdk/ui/UIService";

// src/features/community/hooks/useCommunity.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  adaptCommunityPost,
  adaptCommunityGroup,
  adaptCommunityEvent,
} from "../adapter";
import type { CommunityPost, CommunityGroup, CommunityEvent } from "../types";

export function useCommunity(search?: string) {
  const feedQuery = useQuery(api.community.listFeed, search ? { search } : {});
  const groupsQuery = useQuery(api.community.listGroups, {});
  const eventsQuery = useQuery(api.community.listEvents, {});

  const createPost = useMutation(api.community.createPost);
  const likePost = useMutation(api.community.likePost);
  const deletePost = useMutation(api.community.deletePost);
  const votePoll = useMutation(api.community.votePoll);
  const joinGroup = useMutation(api.community.joinGroup);

  // On s'assure que les données sont bien typées, avec des valeurs par défaut
  const posts: CommunityPost[] =
    feedQuery?.map((p: any) => adaptCommunityPost(p)) ?? [];
  const groups: CommunityGroup[] =
    groupsQuery?.map((g: any) => adaptCommunityGroup(g)) ?? [];
  const events: CommunityEvent[] =
    eventsQuery?.map((e: any) => adaptCommunityEvent(e)) ?? [];

  return {
    posts,
    groups,
    events,
    createPost: async (data: {
      title?: string;
      description: string;
      tags: string[];
      meta: string;
    }) => {
      const result = await createPost(data);
      UIService.openToast("Post créé !", "success");
      return result;
    },
    likePost: async ({
      publicationId,
    }: {
      publicationId: Id<"publications">;
    }) => {
      await likePost({ publicationId });
    },
    deletePost: async ({
      publicationId,
    }: {
      publicationId: Id<"publications">;
    }) => {
      await deletePost({ publicationId });
      UIService.openToast("Post supprimé", "success");
    },
    votePoll: async ({
      publicationId,
      optionId,
    }: {
      publicationId: Id<"publications">;
      optionId: string;
    }) => {
      await votePoll({ publicationId, optionId });
      UIService.openToast("Vote enregistré !", "success");
    },
    joinGroup: async ({ groupId }: { groupId: Id<"groups"> }) => {
      const result = await joinGroup({ groupId });
      UIService.openToast(result.joined
          ? "Vous avez rejoint le groupe"
          : "Vous avez quitté le groupe", "success");
      return result;
    },
  };
}
