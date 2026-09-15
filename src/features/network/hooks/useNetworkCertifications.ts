// src/features/network/hooks/useNetworkCertifications.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { NetworkCertification } from "../types";
import { toast } from "sonner";

interface UseNetworkCertificationsOptions {
  userId: Id<"users">;
}

/**
 * Gère les certifications professionnelles d'un utilisateur au sein du module Network.
 */
export function useNetworkCertifications({
  userId,
}: UseNetworkCertificationsOptions) {
  const certifications = useQuery(api.network.getUserCertifications, {
    userId,
  });

  const addCertification = useMutation(api.network.addCertification);
  const updateCertification = useMutation(api.network.updateCertification);
  const deleteCertification = useMutation(api.network.deleteCertification);

  const handleAdd = async (
    data: Omit<NetworkCertification, "_id" | "userId">,
  ) => {
    try {
      // ✅ Conforme : retrait de 'userId' car l'authentification est résolue côté serveur Convex
      const id = await addCertification(data);
      toast.success("Certification ajoutée");
      return id;
    } catch {
      toast.error("Erreur lors de l'ajout");
      return null;
    }
  };

  const handleUpdate = async (
    certificationId: Id<"networkCertifications">, // ✅ Typé Id<"networkCertifications"> pour la sécurité des types
    data: Partial<NetworkCertification>,
  ) => {
    try {
      await updateCertification({ id: certificationId, ...data });
      toast.success("Certification mise à jour");
      return true;
    } catch {
      toast.error("Erreur lors de la mise à jour");
      return false;
    }
  };

  const handleDelete = async (certificationId: Id<"networkCertifications">) => {
    // ✅ Typé Id<"networkCertifications"> pour la sécurité des types
    try {
      await deleteCertification({ id: certificationId });
      toast.success("Certification supprimée");
      return true;
    } catch {
      toast.error("Erreur lors de la suppression");
      return false;
    }
  };

  return {
    certifications: certifications as NetworkCertification[] | undefined,
    isLoading: certifications === undefined,
    isEmpty: certifications?.length === 0,
    addCertification: handleAdd,
    updateCertification: handleUpdate,
    deleteCertification: handleDelete,
  };
}
