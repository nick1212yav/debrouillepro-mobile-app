// src/features/messages/jobs/services/jobs.service.ts

import type { Id } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";

// ============================================================================
// TYPES
// ============================================================================

export type JobId = Id<"jobListings">;

export type PublicationId = Id<"publications">;

export type JobContractType =
  | "cdi"
  | "cdd"
  | "stage"
  | "freelance"
  | "alternance"
  | "benevole";

export type JobApplicationStatus =
  | "submitted"
  | "viewed"
  | "shortlisted"
  | "rejected"
  | "hired";

// ============================================================================
// JOB
// ============================================================================

export type Job = {
  _id: JobId;
  _creationTime: number;

  title: string;
  description: string;

  company: string;
  companyLogo?: string;

  category: string;
  contractType: JobContractType;

  salaryMin?: number;
  salaryMax?: number;
  currency?: string;

  city: string;
  remote: boolean;

  skills: string[];

  deadline?: string;

  employerId: Id<"users">;

  status: string;
};

// ============================================================================
// APPLICATION
// ============================================================================

export type JobApplication = {
  _id: Id<"jobApplications">;
  _creationTime: number;

  jobId: JobId;
  applicantId: Id<"users">;

  coverLetter?: string;
  cvUrl?: string;

  status: JobApplicationStatus;

  appliedAt: string;

  jobTitle?: string;
  jobCompany?: string;
};

// ============================================================================
// CONVEX API
// ============================================================================
//
// IMPORTANT :
// Les fonctions emploi sont déclarées dans convex/employment.ts.
//
// Elles doivent donc être consommées via :
//
//   api.employment.getJob
//   api.employment.getJobByPublication
//   api.employment.applyToJob
//   api.employment.getMyApplications
//
// et non via api.jobs.*.
//
// ============================================================================

export const jobsApi = {
  getJob: api.employment.getJob,

  getJobByPublication: api.employment.getJobByPublication,

  applyToJob: api.employment.applyToJob,

  getMyApplications: api.employment.getMyApplications,
} as const;

export default jobsApi;
