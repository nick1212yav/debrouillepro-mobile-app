// src/features/messages/jobs/components/JobPreview.tsx

import { Image, Pressable, StyleSheet, Text, View } from "react-native";

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

  const format = (value: number): string =>
    new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0,
    }).format(value);

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
  const contractLabel = contractLabels[job.contractType] ?? job.contractType;

  return (
    <View
      style={styles.container}
      accessibilityRole="summary"
      accessibilityLabel={`Offre d'emploi : ${job.title}`}
    >
      <View style={styles.header}>
        {job.companyLogo ? (
          <Image
            style={styles.logo}
            source={{ uri: job.companyLogo }}
            resizeMode="cover"
            accessibilityLabel={`Logo de ${job.company}`}
          />
        ) : (
          <View
            style={styles.logoPlaceholder}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Text style={styles.logoInitial}>
              {job.company.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
            {job.title}
          </Text>

          <Text style={styles.company} numberOfLines={1} ellipsizeMode="tail">
            {job.company}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>📍 {job.city}</Text>

          {job.remote ? (
            <Text style={styles.metaText}>• Télétravail</Text>
          ) : null}

          <Text style={styles.metaText}>• {contractLabel}</Text>

          {salary ? <Text style={styles.metaText}>• {salary}</Text> : null}
        </View>

        {job.category ? (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{job.category}</Text>
          </View>
        ) : null}

        <Text style={styles.description} numberOfLines={3} ellipsizeMode="tail">
          {job.description}
        </Text>

        {job.skills.length > 0 ? (
          <View style={styles.skillsRow}>
            {job.skills.map((skill) => (
              <View key={skill} style={styles.skillBadge}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {onOpen || onApply ? (
          <View style={styles.buttonsRow}>
            {onOpen ? (
              <Pressable
                onPress={() => onOpen(job)}
                accessibilityRole="button"
                accessibilityLabel={`Voir l'offre ${job.title}`}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.secondaryButtonText}>Voir l'offre</Text>
              </Pressable>
            ) : null}

            {onApply ? (
              <Pressable
                disabled={applying}
                onPress={() => onApply(job)}
                accessibilityRole="button"
                accessibilityLabel={
                  applying ? "Candidature en cours" : `Postuler à ${job.title}`
                }
                accessibilityState={{
                  disabled: applying,
                  busy: applying,
                }}
                style={({ pressed }) => [
                  styles.primaryButton,
                  applying && styles.primaryButtonDisabled,
                  pressed && !applying && styles.buttonPressed,
                ]}
              >
                <Text style={styles.primaryButtonText}>
                  {applying ? "Envoi..." : "Postuler"}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 520,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 16,
    backgroundColor: "#111827",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  logo: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },

  logoPlaceholder: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  logoInitial: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  title: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
    color: "#ffffff",
  },

  company: {
    marginTop: 4,
    fontSize: 14,
    color: "rgba(255,255,255,0.60)",
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
    color: "rgba(255,255,255,0.58)",
  },

  categoryBadge: {
    alignSelf: "flex-start",
    marginBottom: 12,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: "rgba(37,99,235,0.14)",
  },

  categoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#93c5fd",
  },

  description: {
    marginBottom: 14,
    fontSize: 14,
    lineHeight: 21,
    color: "rgba(255,255,255,0.68)",
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
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  skillText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.60)",
  },

  buttonsRow: {
    flexDirection: "row",
    gap: 8,
  },

  secondaryButton: {
    flex: 1,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#e5e7eb",
  },

  primaryButton: {
    flex: 1,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#2563eb",
  },

  primaryButtonDisabled: {
    opacity: 0.55,
  },

  primaryButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },

  buttonPressed: {
    opacity: 0.82,
  },
});

export default JobPreview;
