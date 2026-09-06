// src/features/sante/types/review.types.ts

import type { Id } from "@/convex/_generated/dataModel";

// ─────────────────────────────────────────────────────────────
// Reviews
// ─────────────────────────────────────────────────────────────

export type ReviewStatus = "published" | "pending" | "flagged" | "hidden";

export interface ReviewResponse {
  doctorId: Id<"medicalProfessionals">;
  doctorName: string;
  content: string;
  date: Date;
}

export interface Review {
  _id: Id<"reviews">;

  /**
   * Compatibilité avec les composants utilisant `id`.
   */
  id?: string;

  professionalId: Id<"medicalProfessionals">;

  patientId: Id<"users">;

  patientName: string;

  patientAvatar?: string;

  rating: number;

  comment: string;

  date: Date;

  likes: number;

  verified: boolean;

  helpful: number;

  images?: string[];

  response?: ReviewResponse;

  createdAt: Date;

  updatedAt: Date;

  status: ReviewStatus;
}

// ─────────────────────────────────────────────────────────────
// Statistiques
// ─────────────────────────────────────────────────────────────

export interface ReviewStats {
  average: number;

  count: number;

  /**
   * Distribution des notes :
   *
   * [1 étoile, 2 étoiles, 3 étoiles, 4 étoiles, 5 étoiles]
   */
  distribution: [number, number, number, number, number];

  verifiedCount: number;

  withCommentCount: number;

  withImagesCount: number;

  likesTotal: number;
}

// ─────────────────────────────────────────────────────────────
// Questions / Réponses
// ─────────────────────────────────────────────────────────────

export type QuestionStatus = "open" | "answered" | "closed";

/**
 * Une réponse est un sous-document de Question.
 *
 * Elle n'utilise donc pas `Id<"...">`, car aucune table Convex
 * `answers` n'est définie.
 */
export interface QuestionAnswer {
  _id: string;

  /**
   * Compatibilité avec les composants utilisant `id`.
   */
  id?: string;

  authorId: Id<"users">;

  author: string;

  content: string;

  date: Date;

  likes: number;
}

export interface Question {
  _id: Id<"questions">;

  /**
   * Compatibilité avec les composants utilisant `id`.
   */
  id?: string;

  professionalId: Id<"medicalProfessionals">;

  patientId: Id<"users">;

  patientName: string;

  question: string;

  date: Date;

  likes: number;

  answers: QuestionAnswer[];

  status: QuestionStatus;

  createdAt: Date;

  updatedAt: Date;
}
