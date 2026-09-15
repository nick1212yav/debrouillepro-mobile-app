// src/features/community/hooks/useCommunity.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
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
      toast.success("Post créé !");
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
      toast.success("Post supprimé");
    },
    votePoll: async ({
      publicationId,
      optionId,
    }: {
      publicationId: Id<"publications">;
      optionId: string;
    }) => {
      await votePoll({ publicationId, optionId });
      toast.success("Vote enregistré !");
    },
    joinGroup: async ({ groupId }: { groupId: Id<"groups"> }) => {
      const result = await joinGroup({ groupId });
      toast.success(
        result.joined
          ? "Vous avez rejoint le groupe"
          : "Vous avez quitté le groupe",
      );
      return result;
    },
  };
}
