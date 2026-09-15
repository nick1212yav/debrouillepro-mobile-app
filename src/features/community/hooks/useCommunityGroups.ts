// src/features/community/hooks/useCommunityGroups.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
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
        toast.success(result.joined ? "Rejoint !" : "Quitté");
        return result;
      } catch (error) {
        toast.error("Erreur lors de l'action sur le groupe");
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
        toast.success("Groupe créé !");
        return groupId;
      } catch (error) {
        toast.error("Erreur lors de la création du groupe");
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
        toast.success("Groupe mis à jour");
        return groupId;
      } catch (error) {
        toast.error("Erreur lors de la mise à jour");
        throw error;
      }
    },
    deleteGroup: async (groupId: Id<"groups">) => {
      try {
        await deleteGroup({ groupId });
        toast.success("Groupe supprimé");
      } catch (error) {
        toast.error("Erreur lors de la suppression");
        throw error;
      }
    },
  };
}
