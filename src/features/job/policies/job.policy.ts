// src/features/job/policies/job.policy.ts

export type JobStatus =
  | "draft"
  | "pending"
  | "open"
  | "paused"
  | "filled"
  | "closed"
  | "expired";

export interface JobPublication {
  _id: string;
  authorId: string;
  status?: JobStatus;

  deadline?: number;
  positions?: number;
  remainingPositions?: number;

  isPremium?: boolean;
  isRemote?: boolean;

  applicationsCount?: number;
  maxApplications?: number;

  visibility?: "public" | "private";

  [key: string]: unknown;
}

export interface JobUser {
  _id?: string;
  roles?: string[];
  premium?: boolean;
  verified?: boolean;

  [key: string]: unknown;
}

export class JobPolicy {
  /**
   * Offre visible dans le feed
   */
  static canView(publication: JobPublication, user?: JobUser | null): boolean {
    const status = publication.status ?? "open";

    if (status === "draft") return false;

    if (publication.visibility === "private") {
      return publication.authorId === user?._id;
    }

    return true;
  }

  /**
   * Le bouton "Postuler" est affiché
   */
  static canApply(publication: JobPublication, user?: JobUser | null): boolean {
    if (!user) return false;

    const status = publication.status ?? "open";

    if (status === "closed") return false;

    if (status === "expired") return false;

    if (status === "filled") return false;

    if (publication.deadline && publication.deadline < Date.now()) {
      return false;
    }

    if (
      publication.remainingPositions !== undefined &&
      publication.remainingPositions <= 0
    ) {
      return false;
    }

    if (
      publication.maxApplications !== undefined &&
      publication.applicationsCount !== undefined &&
      publication.applicationsCount >= publication.maxApplications
    ) {
      return false;
    }

    if (publication.isPremium && !user.premium) {
      return false;
    }

    return true;
  }

  /**
   * L'utilisateur peut modifier son annonce
   */
  static canEdit(publication: JobPublication, user?: JobUser | null): boolean {
    if (!user?._id) return false;

    if (publication.authorId === user._id) {
      return true;
    }

    return user.roles?.includes("admin") ?? false;
  }

  /**
   * Suppression
   */
  static canDelete(
    publication: JobPublication,
    user?: JobUser | null,
  ): boolean {
    return this.canEdit(publication, user);
  }

  /**
   * Contacter le recruteur
   */
  static canContact(
    publication: JobPublication,
    user?: JobUser | null,
  ): boolean {
    return this.canView(publication, user);
  }

  /**
   * Sauvegarder l'annonce
   */
  static canSave(publication: JobPublication, user?: JobUser | null): boolean {
    return !!user;
  }

  /**
   * Partager
   */
  static canShare(publication: JobPublication, user?: JobUser | null): boolean {
    return this.canView(publication, user);
  }

  /**
   * Publier
   */
  static canPublish(
    publication: JobPublication,
    user?: JobUser | null,
  ): boolean {
    if (!user) return false;

    return (
      user.roles?.includes("entreprise") ||
      user.roles?.includes("admin") ||
      false
    );
  }

  /**
   * Statut affiché dans l'UI
   */
  static getDisplayStatus(publication: JobPublication): JobStatus {
    if (publication.deadline && publication.deadline < Date.now()) {
      return "expired";
    }

    return publication.status ?? "open";
  }

  /**
   * Badge couleur
   */
  static getStatusColor(status: JobStatus): string {
    switch (status) {
      case "draft":
        return "#6B7280";

      case "pending":
        return "#F59E0B";

      case "open":
        return "#10B981";

      case "paused":
        return "#F97316";

      case "filled":
        return "#3B82F6";

      case "closed":
        return "#EF4444";

      case "expired":
        return "#9CA3AF";

      default:
        return "#6B7280";
    }
  }

  /**
   * Texte du badge
   */
  static getStatusLabel(status: JobStatus): string {
    switch (status) {
      case "draft":
        return "Brouillon";

      case "pending":
        return "En attente";

      case "open":
        return "Ouvert";

      case "paused":
        return "Suspendu";

      case "filled":
        return "Pourvu";

      case "closed":
        return "Fermé";

      case "expired":
        return "Expiré";

      default:
        return status;
    }
  }
}
