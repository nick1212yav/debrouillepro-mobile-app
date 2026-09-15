// src/features/sante/types/review.types.ts
import type { Id } from "@/convex/_generated/dataModel";

export interface Review {
  _id: Id<"reviews">;
  id?: string; // Pour compatibilité avec les composants
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
  response?: {
    doctorId: Id<"medicalProfessionals">;
    doctorName: string;
    content: string;
    date: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  status: "published" | "pending" | "flagged" | "hidden";
}

export interface ReviewStats {
  average: number;
  count: number;
  distribution: [number, number, number, number, number];
  verifiedCount: number;
  withCommentCount: number;
  withImagesCount: number;
  likesTotal: number;
}

export interface Question {
  _id: Id<"questions">;
  id?: string; // Pour compatibilité avec les composants
  professionalId: Id<"medicalProfessionals">;
  patientId: Id<"users">;
  patientName: string;
  question: string;
  date: Date;
  likes: number;
  answers: {
    // ✅ Correction : on utilise `_id` et on le traite comme un ID de type `Id<"questions">`
    // car Convex n'a pas de table "answers" – c'est un sous-document.
    _id: string; // Utilisation de string car c'est un sous-document, pas une table séparée
    id?: string;
    authorId: Id<"users">;
    author: string;
    content: string;
    date: Date;
    likes: number;
  }[];
  status: "open" | "answered" | "closed";
  createdAt: Date;
  updatedAt: Date;
}
