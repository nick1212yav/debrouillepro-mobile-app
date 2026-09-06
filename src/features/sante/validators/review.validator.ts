// src/features/sante/validators/review.validator.ts

import { z } from "zod";
import { auditFieldsSchema } from "./common.validators";

// ─── Schémas ──────────────────────────────────────────────

export const reviewResponseSchema = z.object({
  doctorId: z.string().min(1),
  doctorName: z.string().min(1),
  content: z.string().min(1),
  date: z.string().datetime(),
});

export const reviewSchema = z.object({
  userId: z.string().min(1),
  userName: z.string().min(1),
  rating: z.number().int().min(1).max(5, "La note doit être entre 1 et 5"),
  comment: z.string().min(1, "Le commentaire est requis"),
  date: z.string().datetime(),
  helpful: z.number().int().min(0).default(0),
  response: reviewResponseSchema.optional(),
  images: z.array(z.string().url()).optional().default([]),
  ...auditFieldsSchema.shape,
});

export const reviewStatsSchema = z.object({
  average: z.number().min(0).max(5),
  distribution: z.record(z.number().int()),
  total: z.number().int().min(0),
});

// ─── Types inférés ────────────────────────────────────────

export type Review = z.infer<typeof reviewSchema>;
export type ReviewResponse = z.infer<typeof reviewResponseSchema>;
export type ReviewStats = z.infer<typeof reviewStatsSchema>;
