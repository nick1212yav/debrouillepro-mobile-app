import { View } from "react-native";

// src/features/messages/jobs/components/JobMessage.tsx

import type { Id } from "../../../../../convex/_generated/dataModel";

import { useJobMessages } from "../hooks/useJobMessages";
import { JobPreview } from "./JobPreview";

export interface JobMessageProps {
  message: {
    _id: Id<"messages">;
    sharedPublicationId?: Id<"publications">;
    text?: string;
    type?: string;
  };

  jobId?: Id<"jobListings">;

  onOpenJob?: (
    job: NonNullable<ReturnType<typeof useJobMessages>["job"]>,
  ) => void;

  onApplied?: (jobId: Id<"jobListings">) => void;
}

export function JobMessage({
  message,
  jobId,
  onOpenJob,
  onApplied,
}: JobMessageProps) {
  const { job, isLoading, apply } = useJobMessages(message, jobId);

  if (isLoading) {
    return (
      <View style={{ padding: 16, borderWidth: 1, borderColor: "#e5e7eb", borderStyle: "solid", borderRadius: 16, fontSize: 14 }}>
        Chargement de l'offre...
      </View>
    );
  }

  if (!job) {
    return (
      <View style={{ padding: 16, borderWidth: 1, borderColor: "#fecaca", borderStyle: "solid", borderRadius: 16, backgroundColor: "#fff", fontSize: 14 }}>
        Cette offre d'emploi n'est plus disponible.
      </View>
    );
  }

  const handleApply = async () => {
    await apply();

    onApplied?.(job._id);
  };

  return <JobPreview job={job} onOpen={onOpenJob} onApply={handleApply} />;
}
