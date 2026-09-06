import type { Doc } from "@/convex/_generated/dataModel";

type JobPublication = Doc<"publications"> & {
  meta?: any;
  author?: { name?: string; avatar?: string } | null;
};

export interface JobMetadata {
  jobId: string | null;
  company: string;
  companyLogo: string | null;
  contract: string;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  city: string;
  remote: boolean;
  skills: string[];
  description: string;
  deadline: string | null;
  status: string;
  authorName: string | null;
  authorAvatar: string | null;
  createdAt: number;
}

export function useJobPublication(publication: JobPublication): JobMetadata {
  const meta = publication.meta || {};

  // Si meta est une chaîne JSON, on la parse
  let parsedMeta = meta;
  if (typeof meta === "string") {
    try {
      parsedMeta = JSON.parse(meta);
    } catch {
      parsedMeta = {};
    }
  }

  return {
    jobId: parsedMeta.jobId ?? null,
    company: parsedMeta.company ?? "Entreprise",
    companyLogo: parsedMeta.companyLogo ?? null,
    contract: parsedMeta.contract ?? "cdi",
    salaryMin: parsedMeta.salaryMin ?? null,
    salaryMax: parsedMeta.salaryMax ?? null,
    currency: parsedMeta.currency ?? "USD",
    city: parsedMeta.city ?? "",
    remote: parsedMeta.remote ?? false,
    skills: parsedMeta.skills ?? [],
    description: publication.description ?? "",
    deadline: parsedMeta.deadline ?? null,
    status: parsedMeta.status ?? "open",
    authorName: publication.author?.name ?? null,
    authorAvatar: publication.author?.avatar ?? null,
    createdAt: publication._creationTime ?? Date.now(),
  };
}
