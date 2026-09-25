import { View, Image, Text, Pressable, StyleSheet } from "react-native";

// src/features/messages/jobs/components/JobPreview.tsx

import type { Job } from "../services/jobs.service";

export interface JobPreviewProps {
  job: Job;
  onOpen?: (job: Job) => void;
  onApply?: (job: Job) => void;
  applying?: boolean;
}

function formatSalary(job: Job): string | null {
  if (job.salaryMin === undefined && job.salaryMax === undefined) {
    return null;
  }
  const currency = job.currency ?? "USD";
  const format = (value: number) =>
    new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value);

  if (job.salaryMin !== undefined && job.salaryMax !== undefined) {
    return `${format(job.salaryMin)} – ${format(job.salaryMax)} ${currency}`;
  }
  if (job.salaryMin !== undefined) {
    return `À partir de ${format(job.salaryMin)} ${currency}`;
  }
  return `Jusqu'à ${format(job.salaryMax ?? 0)} ${currency}`;
}

const contractLabels: Record<string, string> = {
  cdi: "CDI",
  cdd: "CDD",
  stage: "Stage",
  freelance: "Freelance",
  alternance: "Alternance",
  benevole: "Bénévolat",
};

export function JobPreview({
  job,
  onOpen,
  onApply,
  applying = false,
}: JobPreviewProps) {
  const salary = formatSalary(job);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {job.companyLogo ? (
          <Image
            style={styles.logo}
            source={{ uri: job.companyLogo }}
            accessibilityLabel={job.company}
          />
        ) : (
          <View
            accessibilityElementsHidden={true}
            importantForAccessibility="no-hide-descendants"
            style={styles.logoPlaceholder}
          >
            <Text style={styles.logoInitial}>
              {job.company.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.headerText}>
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.company}>{job.company}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{job.city}</Text>
          {job.remote && <Text style={styles.metaText}>• Télétravail</Text>}
          <Text style={styles.metaText}>
            • {contractLabels[job.contractType] ?? job.contractType}
          </Text>
          {salary && <Text style={styles.metaText}>• {salary}</Text>}
        </View>

        {job.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{job.category}</Text>
          </View>
        )}

        <Text style={styles.description} numberOfLines={3}>
          {job.description}
        </Text>

        {job.skills.length > 0 && (
          <View style={styles.skillsRow}>
            {job.skills.map((skill) => (
              <Text key={skill} style={styles.skillBadge}>{skill}</Text>
            ))}
          </View>
        )}

        <View style={styles.buttonsRow}>
          {onOpen && (
            <Pressable
              onPress={() => onOpen(job)}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Voir l'offre</Text>
            </Pressable>
          )}
          {onApply && (
            <Pressable
              disabled={applying}
              onPress={() => onApply(job)}
              style={[styles.primaryButton, applying && styles.primaryButtonDim]}
            >
              <Text style={styles.primaryButtonText}>
                {applying ? "Envoi..." : "Postuler"}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 520,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  header: {
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  logoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  logoInitial: {
    fontWeight: "700",
    fontSize: 18,
    color: "#111827",
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
    color: "#111827",
  },
  company: {
    marginTop: 4,
    fontSize: 14,
    color: "#4b5563",
  },
  body: {
    padding: 16,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  metaText: {
    fontSize: 13,
    color: "#4b5563",
  },
  categoryBadge: {
    alignSelf: "flex-start",
    marginBottom: 12,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  description: {
    marginBottom: 14,
    color: "#475569",
    fontSize: 14,
    lineHeight: 21,
  },
  skillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 16,
  },
  skillBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    fontSize: 12,
    color: "#4b5563",
  },
  buttonsRow: {
    gap: 8,
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  secondaryButtonText: {
    fontWeight: "600",
    fontSize: 13,
    color: "#111827",
  },
  primaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#111827",
    alignItems: "center",
  },
  primaryButtonDim: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontWeight: "600",
    fontSize: 13,
    color: "#fff",
  },
});

export default JobPreview;