import { View, Image, Text, Pressable } from "react-native";

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
    new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0,
    }).format(value);

  if (job.salaryMin !== undefined && job.salaryMax !== undefined) {
    return `${format(job.salaryMin)} – ${format(job.salaryMax)} ${currency}`;
  }

  if (job.salaryMin !== undefined) {
    return `À partir de ${format(job.salaryMin)} ${currency}`;
  }

  return `Jusqu'à ${format(job.salaryMax!)} ${currency}`;
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
    <View style={{ width: "100%", maxWidth: 520, borderWidth: 1, borderColor: "#e5e7eb", borderStyle: "solid", borderRadius: 16, overflow: "hidden", backgroundColor: "#fff" }}><View style={{ display: "flex", gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}>{job.companyLogo ? (
          <Image style={{ width: 48, height: 48, borderRadius: 10 }} source={{ uri: job.companyLogo }} accessibilityLabel={job.company} />
        ) : (
          <View accessibilityElementsHidden={true} importantForAccessibility="no-hide-descendants" style={{ width: 48, height: 48, borderRadius: 10, display: "grid", placeItems: "center", backgroundColor: "#f1f5f9", fontWeight: 700 }}>{job.company.charAt(0).toUpperCase()}</View>
        )}<View style={{ minWidth: 0, flex: 1 }}><Text style={{
              margin: 0,
              fontSize: 17,
              lineHeight: 1.3,
              fontWeight: 700,
            }}>{job.title}</Text><View style={{ marginTop: 4, fontSize: 14 }}>{job.company}</View></View></View><View style={{ padding: 16 }}><View style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 12,
          }}><Text>{job.city}</Text>{job.remote && <Text>• Télétravail</Text>}<Text>• {contractLabels[job.contractType] ?? job.contractType}</Text>{salary && <Text>• {salary}</Text>}</View>{job.category && (
          <View style={{ display: "inline-block", marginBottom: 12, paddingVertical: 5, paddingHorizontal: 9, borderRadius: 999, backgroundColor: "#f1f5f9", fontSize: 12, fontWeight: 600 }}>{job.category}</View>
        )}<Text style={{ marginTop: 0, marginHorizontal: 0, marginBottom: 14, color: "#475569", fontSize: 14, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{job.description}</Text>{job.skills.length > 0 && (
          <View style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginBottom: 16,
            }}>{job.skills.map((skill) => (
              <Text key={skill} style={{ paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999, backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderStyle: "solid", fontSize: 12 }}>{skill}</Text>
            ))}</View>
        )}<View style={{
            display: "flex",
            gap: 8,
          }}>{onOpen && (
            <Pressable onPress={() => onOpen(job)} style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: "#cbd5e1", borderStyle: "solid", backgroundColor: "#fff", fontWeight: 600 }}>
              Voir l'offre
            </Pressable>
          )}{onApply && (
            <Pressable disabled={applying} onPress={() => onApply(job)} style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 0, backgroundColor: "#111827", opacity: applying ? 0.6 : 1, fontWeight: 600 }}>
              {applying ? "Envoi..." : "Postuler"}
            </Pressable>
          )}</View></View></View>
  );
}
