import { UIService } from "@/core/sdk/ui/UIService";

// src/features/network/hooks/useNetworkServices.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export interface NetworkService {
  _id: Id<"networkServices">; // ✅ Correction : typé Id<"networkServices"> pour la cohérence des jointures
  title: string;
  description?: string;
  price?: string;
  category: string;
  location?: string;
  deliveryTime?: string;
  userId: Id<"users">;
  createdAt: string;
}

interface UseNetworkServicesOptions {
  userId: Id<"users">;
}

/**
 * Gère les services proposés par un utilisateur.
 */
export function useNetworkServices({ userId }: UseNetworkServicesOptions) {
  const services = useQuery(api.network.getUserServices, { userId });

  const addService = useMutation(api.network.addService);
  const updateService = useMutation(api.network.updateService);
  const deleteService = useMutation(api.network.deleteService);

  const handleAdd = async (
    data: Omit<NetworkService, "_id" | "userId" | "createdAt">,
  ) => {
    try {
      // ✅ Correction : retrait de 'userId' car l'authentification est déduite côté serveur Convex
      const id = await addService(data);
      UIService.openToast("Service ajouté", "success");
      return id;
    } catch {
      UIService.openToast("Erreur lors de l'ajout", "error");
      return null;
    }
  };

  const handleUpdate = async (
    serviceId: Id<"networkServices">, // ✅ Correction : typé Id<"networkServices"> au lieu de string
    data: Partial<NetworkService>,
  ) => {
    try {
      await updateService({ id: serviceId, ...data });
      UIService.openToast("Service mis à jour", "success");
      return true;
    } catch {
      UIService.openToast("Erreur lors de la mise à jour", "error");
      return false;
    }
  };

  const handleDelete = async (serviceId: Id<"networkServices">) => {
    // ✅ Correction : typé Id<"networkServices"> au lieu de string
    try {
      await deleteService({ id: serviceId });
      UIService.openToast("Service supprimé", "success");
      return true;
    } catch {
      UIService.openToast("Erreur lors de la suppression", "error");
      return false;
    }
  };

  return {
    services: services as NetworkService[] | undefined,
    isLoading: services === undefined,
    isEmpty: services?.length === 0,
    addService: handleAdd,
    updateService: handleUpdate,
    deleteService: handleDelete,
  };
}
