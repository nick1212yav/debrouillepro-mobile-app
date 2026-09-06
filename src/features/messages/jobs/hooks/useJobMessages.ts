// src/features/messages/jobs/hooks/useJobMessages.ts

import { useMutation, useQuery } from "convex/react";
import type { Id } from "../../../../../convex/_generated/dataModel";

import { jobsApi, type Job } from "../services/jobs.service";

// ============================================================================
// TYPES
// ============================================================================

type MessageLike = {
  _id: Id<"messages">;
  sharedPublicationId?: Id<"publications">;
  type?: string;
  text?: string;
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Vérifie qu'une valeur possède réellement la structure minimale
 * nécessaire pour être utilisée comme Job dans le module Messages.
 *
 * On ne caste jamais arbitrairement une publication en Job.
 */
function isJob(value: unknown): value is Job {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate._id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.description === "string" &&
    typeof candidate.company === "string" &&
    typeof candidate.category === "string" &&
    typeof candidate.contractType === "string" &&
    typeof candidate.city === "string" &&
    typeof candidate.remote === "boolean" &&
    Array.isArray(candidate.skills) &&
    typeof candidate.employerId === "string"
  );
}

// ============================================================================
// JOB MESSAGES
// ============================================================================

export function useJobMessages(
  message?: MessageLike | null,
  jobId?: Id<"jobListings">,
) {
  const publicationId = message?.sharedPublicationId;

  // --------------------------------------------------------------------------
  // JOB LIÉ À UNE PUBLICATION
  // --------------------------------------------------------------------------

  const jobFromMessageResult = useQuery(
    jobsApi.getJobByPublication,
    publicationId
      ? {
          publicationId,
        }
      : "skip",
  );

  // --------------------------------------------------------------------------
  // JOB DIRECT
  // --------------------------------------------------------------------------

  const directJobResult = useQuery(
    jobsApi.getJob,
    jobId
      ? {
          id: jobId,
        }
      : "skip",
  );

  // --------------------------------------------------------------------------
  // CANDIDATURE
  // --------------------------------------------------------------------------

  const applyToJob = useMutation(jobsApi.applyToJob);

  // --------------------------------------------------------------------------
  // NORMALISATION
  // --------------------------------------------------------------------------

  const directJob: Job | null = isJob(directJobResult) ? directJobResult : null;

  const jobFromMessage: Job | null = isJob(jobFromMessageResult)
    ? jobFromMessageResult
    : null;

  // --------------------------------------------------------------------------
  // JOB FINAL
  //
  // Le job explicitement demandé est prioritaire.
  // Sinon on utilise le job détecté via la publication.
  // --------------------------------------------------------------------------

  const job: Job | null = directJob ?? jobFromMessage;

  // --------------------------------------------------------------------------
  // LOADING
  // --------------------------------------------------------------------------

  const isLoading =
    (Boolean(jobId) && directJobResult === undefined) ||
    (Boolean(publicationId) && jobFromMessageResult === undefined);

  // --------------------------------------------------------------------------
  // APPLY
  // --------------------------------------------------------------------------

  const apply = async (params?: { coverLetter?: string; cvUrl?: string }) => {
    if (!job) {
      throw new Error("Offre d'emploi introuvable.");
    }

    return applyToJob({
      jobId: job._id,
      coverLetter: params?.coverLetter,
      cvUrl: params?.cvUrl,
    });
  };

  // --------------------------------------------------------------------------
  // RESULT
  // --------------------------------------------------------------------------

  return {
    job,
    isLoading,
    apply,
  };
}

// ============================================================================
// MES CANDIDATURES
// ============================================================================

export function useMyJobApplications() {
  const applications = useQuery(jobsApi.getMyApplications, {});

  return {
    applications: applications ?? [],
    isLoading: applications === undefined,
  };
}

export default useJobMessages;
