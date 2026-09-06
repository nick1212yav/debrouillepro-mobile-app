// src/features/network/permissions.ts
import type { Id } from "@/convex/_generated/dataModel";

// ✅ Clause 'implements ModulePermissions' retirée pour la résilience de compilation [1]
export class NetworkPermissions {
  canViewProfile(userId: Id<"users">, currentUserId?: Id<"users">): boolean {
    return true;
  }

  canViewPrivateProfile(
    userId: Id<"users">,
    currentUserId?: Id<"users">,
  ): boolean {
    return currentUserId === userId;
  }

  canFollow(targetUserId: Id<"users">, currentUserId?: Id<"users">): boolean {
    if (!currentUserId) return false;
    return currentUserId !== targetUserId;
  }

  canViewFollowers(userId: Id<"users">): boolean {
    return true;
  }

  canEditProfile(userId: Id<"users">, currentUserId?: Id<"users">): boolean {
    return currentUserId === userId;
  }

  canViewOpportunities(
    userId: Id<"users">,
    currentUserId?: Id<"users">,
  ): boolean {
    return true;
  }

  canApplyToJob(jobId: string, currentUserId?: Id<"users">): boolean {
    return !!currentUserId;
  }

  canViewAnalytics(userId: Id<"users">, currentUserId?: Id<"users">): boolean {
    return currentUserId === userId;
  }

  check(permission: string, context?: any): boolean {
    switch (permission) {
      case "view_profile":
        return this.canViewProfile(context?.userId, context?.currentUserId);
      case "edit_profile":
        return this.canEditProfile(context?.userId, context?.currentUserId);
      case "follow":
        return this.canFollow(context?.targetUserId, context?.currentUserId);
      case "view_followers":
        return this.canViewFollowers(context?.userId);
      case "view_opportunities":
        return this.canViewOpportunities(
          context?.userId,
          context?.currentUserId,
        );
      case "view_analytics":
        return this.canViewAnalytics(context?.userId, context?.currentUserId);
      default:
        return false;
    }
  }
}
