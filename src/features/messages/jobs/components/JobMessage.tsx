// src/features/messages/jobs/components/JobMessage.tsx

import { StyleSheet, Text, View } from "react-native";

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
      <View
        style={[styles.container, styles.infoContainer]}
        accessibilityRole="progressbar"
        accessibilityLabel="Chargement de l'offre d'emploi"
      >
        <Text style={styles.infoText}>Chargement de l'offre...</Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View
        style={[styles.container, styles.errorContainer]}
        accessibilityRole="alert"
      >
        <Text style={styles.errorText}>
          Cette offre d'emploi n'est plus disponible.
        </Text>
      </View>
    );
  }

  const handleApply = async () => {
    await apply();
    onApplied?.(job._id);
  };

  return <JobPreview job={job} onOpen={onOpenJob} onApply={handleApply} />;
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 16,
    borderWidth: 1,
    borderRadius: 16,
  },

  infoContainer: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "#111827",
  },

  errorContainer: {
    borderColor: "rgba(248,113,113,0.20)",
    backgroundColor: "rgba(239,68,68,0.08)",
  },

  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.65)",
  },

  errorText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#f87171",
  },
});

export default JobMessage;
