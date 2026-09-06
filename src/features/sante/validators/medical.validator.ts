// src/features/sante/validators/medical.validator.ts

import { z } from "zod";
import { auditFieldsSchema } from "./common.validators";

// ─── Enums ────────────────────────────────────────────────

export const medicalRecordTypeEnum = z.enum([
  "visit",
  "lab",
  "imaging",
  "vaccination",
  "prescription",
  "hospitalization",
]);

export const labResultTypeEnum = z.enum(["blood", "urine", "biopsy", "other"]);

export const labResultStatusEnum = z.enum(["normal", "abnormal", "pending"]);

export const imagingTypeEnum = z.enum([
  "xray",
  "ct",
  "mri",
  "ultrasound",
  "pet",
  "other",
]);

// ─── Schémas ──────────────────────────────────────────────

export const medicalRecordSchema = z.object({
  id: z.string().min(1),
  patientId: z.string().min(1, "Le patient est requis"),
  doctorId: z.string().optional(),
  doctor: z.string().optional(),
  type: medicalRecordTypeEnum,
  title: z.string().min(1, "Le titre est requis"),
  date: z.string().datetime(),
  summary: z.string().min(1, "Le résumé est requis"),
  details: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  attachments: z.array(z.string().url()).optional().default([]),
  ...auditFieldsSchema.shape,
});

export const labResultSchema = z.object({
  patientId: z.string().min(1),
  type: labResultTypeEnum,
  testName: z.string().min(1),
  date: z.string().datetime(),
  results: z.string().min(1),
  referenceRange: z.string().optional(),
  status: labResultStatusEnum.default("pending"),
  doctorId: z.string().optional(),
  ...auditFieldsSchema.shape,
});

export const imagingResultSchema = z.object({
  patientId: z.string().min(1),
  type: imagingTypeEnum,
  region: z.string().min(1),
  date: z.string().datetime(),
  findings: z.string().min(1),
  impression: z.string().optional(),
  doctorId: z.string().optional(),
  ...auditFieldsSchema.shape,
});

// ─── Types inférés ────────────────────────────────────────

export type MedicalRecord = z.infer<typeof medicalRecordSchema>;
export type MedicalRecordType = z.infer<typeof medicalRecordTypeEnum>;
export type LabResult = z.infer<typeof labResultSchema>;
export type LabResultType = z.infer<typeof labResultTypeEnum>;
export type LabResultStatus = z.infer<typeof labResultStatusEnum>;
export type ImagingResult = z.infer<typeof imagingResultSchema>;
export type ImagingType = z.infer<typeof imagingTypeEnum>;
