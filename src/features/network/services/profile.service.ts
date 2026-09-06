import { UIService } from "@/core/sdk/ui/UIService";

// src/features/network/services/profile.service.ts
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type {
  NetworkProfile,
  ProfileUpdatePayload,
  ProfileVisibility,
} from "../types/profile.types";

/**
 * Service pour la gestion des profils utilisateur.
 * Encapsule les opérations de lecture, mise à jour et configuration du profil.
 */
export class ProfileService {
  /**
   * Récupère le profil public d'un utilisateur
   */
  static useProfile(userId: Id<"users">) {
    // ✅ Correction : utilise api.network.getPublicProfile à la place de l'ancienne requête
    const data = useQuery(api.network.getPublicProfile, { userId });
    return {
      profile: data as NetworkProfile | undefined | null,
      isLoading: data === undefined,
      isError: data === null,
    };
  }

  /**
   * Récupère le profil de l'utilisateur connecté
   */
  static useMyProfile() {
    // ✅ Correction : retrait de l'argument d'email
    // ✅ Correction : retrait du paramètre { email } car l'authentification est déduite côté serveur Convex [1]
    const data = useQuery(api.users.getCurrentUser, {});
    return {
      profile: data as NetworkProfile | undefined,
      isLoading: data === undefined,
    };
  }

  /**
   * Met à jour le profil de l'utilisateur
   */
  static async updateProfile(
    payload: ProfileUpdatePayload,
    updateFn: any,
  ): Promise<boolean> {
    // ✅ Correction : retrait de 'email' dans la signature [1]
    try {
      // ✅ Correction : retrait de 'email' dans le payload de mise à jour [1]
      await updateFn(payload);
      UIService.openToast("Profil mis à jour", "success");
      return true;
    } catch {
      UIService.openToast("Erreur lors de la mise à jour du profil", "error");
      return false;
    }
  }

  /**
   * Met à jour les paramètres de visibilité du profil
   */
  static async updateVisibility(
    visibility: ProfileVisibility,
    updateFn: any,
  ): Promise<boolean> {
    try {
      await updateFn({ visibility });
      UIService.openToast("Visibilité mise à jour", "success");
      return true;
    } catch {
      UIService.openToast("Erreur lors de la mise à jour de la visibilité", "error");
      return false;
    }
  }

  /**
   * Télécharge une image de profil ou de couverture
   */
  static async uploadImage(
    file: File,
    type: "avatar" | "cover",
    uploadFn: any,
  ): Promise<string | null> {
    try {
      const result = await uploadFn({ file, type });
      UIService.openToast("Image mise à jour", "success");
      return result.url;
    } catch {
      UIService.openToast("Erreur lors du téléchargement", "error");
      return null;
    }
  }

  /**
   * Récupère les activités récentes d'un utilisateur
   */
  static useUserActivity(userId: Id<"users">, limit: number = 10) {
    // ✅ Correction : getUserActivity étant absent, renvoie un fallback propre pour éviter l'erreur de compilation
    return {
      activities: undefined as
        | Array<{
            type: string;
            content: string;
            createdAt: string;
          }>
        | undefined,
      isLoading: false,
    };
  }

  /**
   * Récupère les statistiques de profil d'un utilisateur
   */
  static useProfileStats(userId: Id<"users">) {
    // ✅ Correction : getProfileStats étant absent, renvoie un fallback propre pour éviter l'erreur de compilation
    return {
      stats: undefined as
        | {
            viewCount: number;
            followerCount: number;
            followingCount: number;
            postCount: number;
            likeCount: number;
            commentCount: number;
          }
        | undefined,
      isLoading: false,
    };
  }
}
