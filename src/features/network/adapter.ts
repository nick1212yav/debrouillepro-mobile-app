// src/features/network/adapter.ts
import type { DataAdapter } from "@/core/sdk/adapters/DataAdapter";
import type { Id } from "@/convex/_generated/dataModel";
import type { NetworkUser, NetworkProfile, NetworkStats } from "./types";
import { api } from "@/convex/_generated/api";

/**
 * Adaptateur de données pour le module Network.
 * Convertit les données brutes de Convex en types du module.
 */
export class NetworkAdapter implements DataAdapter {
  /**
   * ✅ Correction : Méthode obligatoire demandée par l'interface DataAdapter du Core SDK [1]
   */
  toModel(data: any): any {
    return data;
  }

  /**
   * ✅ Correction : Méthode obligatoire demandée par l'interface DataAdapter du Core SDK [1]
   */
  fromModel(data: any): any {
    return data;
  }

  /**
   * Adapte un utilisateur brut en NetworkUser
   */
  adaptUser(raw: any): NetworkUser {
    return {
      _id: raw._id,
      name: raw.name || "Utilisateur",
      email: raw.email,
      avatar: raw.avatar,
      cover: raw.cover,
      headline: raw.headline,
      bio: raw.bio,
      city: raw.city,
      country: raw.country,
      roles: raw.roles || ["particulier"],
      interests: raw.interests || [],
      verified: raw.verified || false,
      isFollowedByMe: raw.isFollowedByMe,
      isFollowingMe: raw.isFollowingMe,
      followerCount: raw.followerCount || 0,
      followingCount: raw.followingCount || 0,
      postCount: raw.postCount || 0,
      createdAt: raw._creationTime
        ? new Date(raw._creationTime).toISOString()
        : new Date().toISOString(),
      updatedAt: raw.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * Adapte un profil brut en NetworkProfile
   */
  adaptProfile(raw: any): NetworkProfile {
    return {
      _id: raw._id,
      name: raw.name || "Utilisateur",
      avatar: raw.avatar,
      cover: raw.cover,
      headline: raw.headline,
      bio: raw.bio,
      city: raw.city,
      country: raw.country,
      roles: raw.roles || ["particulier"],
      interests: raw.interests || [],
      verified: raw.verified || false,
      followerCount: raw.followerCount || 0,
      followingCount: raw.followingCount || 0,
      postCount: raw.postCount || 0,
      isFollowedByMe: raw.isFollowedByMe,
      isFollowingMe: raw.isFollowingMe,
      createdAt: raw._creationTime
        ? new Date(raw._creationTime).toISOString()
        : new Date().toISOString(),
      updatedAt: raw.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * Adapte une expérience brute
   */
  adaptExperience(raw: any): any {
    return {
      _id: raw._id,
      userId: raw.userId,
      title: raw.title,
      company: raw.company,
      companyLogo: raw.companyLogo,
      location: raw.location,
      startDate: raw.startDate,
      endDate: raw.endDate,
      current: raw.current || false,
      description: raw.description,
      achievements: raw.achievements || [],
      createdAt: raw._creationTime
        ? new Date(raw._creationTime).toISOString()
        : new Date().toISOString(),
      updatedAt: raw.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * Adapte une formation brute
   */
  adaptEducation(raw: any): any {
    return {
      _id: raw._id,
      userId: raw.userId,
      school: raw.school,
      degree: raw.degree,
      field: raw.field,
      location: raw.location,
      startDate: raw.startDate,
      endDate: raw.endDate,
      current: raw.current || false,
      description: raw.description,
      createdAt: raw._creationTime
        ? new Date(raw._creationTime).toISOString()
        : new Date().toISOString(),
      updatedAt: raw.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * Adapte une compétence brute
   */
  adaptSkill(raw: any): any {
    return {
      _id: raw._id,
      userId: raw.userId,
      name: raw.name,
      endorsements: raw.endorsements || 0,
      endorsedBy: raw.endorsedBy || [],
      createdAt: raw._creationTime
        ? new Date(raw._creationTime).toISOString()
        : new Date().toISOString(),
      updatedAt: raw.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * Adapte des statistiques brutes
   */
  adaptStats(raw: any): NetworkStats {
    return {
      followerCount: raw.followerCount || 0,
      followingCount: raw.followingCount || 0,
      postCount: raw.postCount || 0,
      viewCount: raw.viewCount || 0,
      likeCount: raw.likeCount || 0,
      commentCount: raw.commentCount || 0,
      engagementRate: raw.engagementRate || 0,
    };
  }

  /**
   * Adapte un utilisateur pour l'export (format simplifié)
   */
  adaptForExport(raw: any): Record<string, any> {
    return {
      id: raw._id,
      name: raw.name,
      email: raw.email,
      city: raw.city,
      country: raw.country,
      roles: raw.roles,
      followers: raw.followerCount,
      following: raw.followingCount,
      createdAt: raw._creationTime,
    };
  }

  /**
   * Convertit un type de données vers un autre format
   */
  transform<T = any>(data: any, targetFormat: string): T {
    switch (targetFormat) {
      case "user":
        return this.adaptUser(data) as any;
      case "profile":
        return this.adaptProfile(data) as any;
      case "stats":
        return this.adaptStats(data) as any;
      case "export":
        return this.adaptForExport(data) as any;
      default:
        return data as T;
    }
  }
}
