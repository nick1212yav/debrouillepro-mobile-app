import { UIService } from "@/core/sdk/ui/UIService";

// src/features/community/hooks/useCommunityGroups.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { adaptCommunityGroup } from "../adapter";
import type { CommunityGroup } from "../types";

export function useCommunityGroups() {
  const groupsQuery = useQuery(api.community.listGroups, {});
  const joinGroup = useMutation(api.community.joinGroup);
  const createGroup = useMutation(api.community.createGroup);
  const updateGroup = useMutation(api.community.updateGroup);
  const deleteGroup = useMutation(api.community.deleteGroup);

  const groups: CommunityGroup[] =
    groupsQuery?.map((g: any) => adaptCommunityGroup(g)) ?? [];

  return {
    groups,
    isLoading: groupsQuery === undefined,
    joinGroup: async (groupId: Id<"groups">) => {
      try {
        const result = await joinGroup({ groupId });
        UIService.openToast(result.joined ? "Rejoint !" : "Quitté", "success");
        return result;
      } catch (error) {
        UIService.openToast("Erreur lors de l'action sur le groupe", "error");
        throw error;
      }
    },
    createGroup: async (data: {
      name: string;
      description: string;
      category: string;
      isPrivate: boolean;
      city?: string;
      tags?: string[];
    }) => {
      try {
        // S'assurer que tags est un tableau (vide par défaut)
        const payload = {
          ...data,
          tags: data.tags ?? [],
        };
        const groupId = await createGroup(payload);
        UIService.openToast("Groupe créé !", "success");
        return groupId;
      } catch (error) {
        UIService.openToast("Erreur lors de la création du groupe", "error");
        throw error;
      }
    },
    updateGroup: async (
      groupId: Id<"groups">,
      data: Partial<{
        name: string;
        description: string;
        category: string;
        isPrivate: boolean;
        city?: string;
        tags?: string[];
      }>,
    ) => {
      try {
        // S'assurer que tags est un tableau si fourni
        const payload = {
          ...data,
          tags: data.tags ?? [],
        };
        await updateGroup({ groupId, ...payload });
        UIService.openToast("Groupe mis à jour", "success");
        return groupId;
      } catch (error) {
        UIService.openToast("Erreur lors de la mise à jour", "error");
        throw error;
      }
    },
    deleteGroup: async (groupId: Id<"groups">) => {
      try {
        await deleteGroup({ groupId });
        UIService.openToast("Groupe supprimé", "success");
      } catch (error) {
        UIService.openToast("Erreur lors de la suppression", "error");
        throw error;
      }
    },
  };
}
