import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import type { Doc, Id } from "@/convex/_generated/dataModel.d.ts";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  ArrowLeft,
  BarChart2,
  Briefcase,
  Building2,
  CheckCircle,
  Clock,
  DollarSign,
  Edit3,
  Eye,
  FileText,
  MapPin,
  Plus,
  Search,
  Send,
  SlidersHorizontal,
  X,
  Zap,
} from "lucide-react-native";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type TabId = "offres" | "freelance" | "candidatures" | "cv";

type ContractType = Doc<"jobListings">["contractType"];
type ApplicationStatus = Doc<"jobApplications">["status"];

interface CVData {
  name: string;
  title: string;
  email: string;
  phone: string;
  city: string;
  summary: string;
  skills: string[];
  experiences: {
    role: string;
    company: string;
    period: string;
    desc: string;
  }[];
  education: {
    degree: string;
    school: string;
    year: string;
  }[];
}

type ApplicationWithJob = Doc<"jobApplications"> & {
  jobTitle?: string;
  jobCompany?: string;
};

/* -------------------------------------------------------------------------- */
/* Configuration                                                              */
/* -------------------------------------------------------------------------- */

const EMPTY_CV: CVData = {
  name: "",
  title: "",
  email: "",
  phone: "",
  city: "",
  summary: "",
  skills: [],
  experiences: [],
  education: [],
};

const CONTRACT_LABELS: Record<ContractType, string> = {
  cdi: "CDI",
  cdd: "CDD",
  stage: "Stage",
  freelance: "Freelance",
  alternance: "Alternance",
  benevole: "Bénévole",
};

const STATUS_CONFIG: Record<
  ApplicationStatus,
  {
    label: string;
    color: string;
    bg: string;
  }
> = {
  submitted: {
    label: "Envoyée",
    color: "#6366F1",
    bg: "rgba(99,102,241,0.15)",
  },
  viewed: {
    label: "Vue",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.15)",
  },
  shortlisted: {
    label: "Entretien",
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.15)",
  },
  hired: {
    label: "Acceptée",
    color: "#10B981",
    bg: "rgba(16,185,129,0.15)",
  },
  rejected: {
    label: "Refusée",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.15)",
  },
};

const TYPE_FILTERS = [
  { label: "Tout", value: null },
  { label: "CDI", value: "cdi" as ContractType },
  { label: "CDD", value: "cdd" as ContractType },
  { label: "Stage", value: "stage" as ContractType },
  { label: "Freelance", value: "freelance" as ContractType },
  { label: "Alternance", value: "alternance" as ContractType },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getCompanyColor(name: string): string {
  const colors = [
    "#6366F1",
    "#F97316",
    "#EC4899",
    "#22C55E",
    "#0EA5E9",
    "#8B5CF6",
    "#EF4444",
    "#14B8A6",
  ];

  let hash = 0;

  for (let index = 0; index < name.length; index += 1) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatSalary(min?: number, max?: number, currency?: string): string {
  const cur = currency ?? "USD";

  if (min != null && max != null) {
    return `${min.toLocaleString()}–${max.toLocaleString()} ${cur}`;
  }

  if (min != null) {
    return `${min.toLocaleString()}+ ${cur}`;
  }

  if (max != null) {
    return `≤${max.toLocaleString()} ${cur}`;
  }

  return "Non précisé";
}

function formatRelativeDate(timestamp: number): string {
  const diff = Math.max(0, Date.now() - timestamp);

  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (hours < 1) {
    return "À l'instant";
  }

  if (hours < 24) {
    return `Il y a ${hours}h`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `Il y a ${days}j`;
  }

  const weeks = Math.floor(days / 7);

  return `Il y a ${weeks} sem.`;
}

/* -------------------------------------------------------------------------- */
/* Company Logo                                                               */
/* -------------------------------------------------------------------------- */

function CompanyLogo({
  company,
  logo,
  size = 48,
}: {
  company: string;
  logo?: string;
  size?: number;
}) {
  const color = getCompanyColor(company);
  const initials = getInitials(company);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        backgroundColor: `${color}33`,
        borderWidth: 1,
        borderColor: `${color}55`,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {logo ? (
        <Image
          source={{ uri: logo }}
          style={{
            width: "100%",
            height: "100%",
          }}
          resizeMode="cover"
          accessibilityLabel={company}
        />
      ) : (
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: size * 0.3,
            fontWeight: "900",
          }}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Job Card                                                                   */
/* -------------------------------------------------------------------------- */

function JobCard({
  job,
  onSelect,
  onApply,
  hasApplied,
}: {
  job: Doc<"jobListings">;
  onSelect: () => void;
  onApply: () => void;
  hasApplied: boolean;
}) {
  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => ({
        opacity: pressed ? 0.92 : 1,
        backgroundColor: "rgba(255,255,255,0.055)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.09)",
        borderRadius: 24,
        padding: 16,
        marginBottom: 12,
      })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <CompanyLogo company={job.company} logo={job.companyLogo} />

        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={2}
            style={{
              color: "#FFFFFF",
              fontSize: 15,
              fontWeight: "800",
              lineHeight: 20,
            }}
          >
            {job.title}
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 6,
              marginTop: 5,
            }}
          >
            <Building2 size={12} color="rgba(255,255,255,0.4)" />

            <Text
              numberOfLines={1}
              style={{
                color: "rgba(255,255,255,0.52)",
                fontSize: 12,
                flexShrink: 1,
              }}
            >
              {job.company}
            </Text>

            {job.remote ? (
              <View
                style={{
                  paddingHorizontal: 7,
                  paddingVertical: 3,
                  borderRadius: 7,
                  backgroundColor: "rgba(16,185,129,0.15)",
                }}
              >
                <Text
                  style={{
                    color: "#10B981",
                    fontSize: 9,
                    fontWeight: "800",
                  }}
                >
                  REMOTE
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          marginTop: 14,
          marginBottom: 13,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
          }}
        >
          <MapPin size={12} color="rgba(255,255,255,0.4)" />

          <Text
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 11,
            }}
          >
            {job.city}
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
          }}
        >
          <Clock size={12} color="rgba(255,255,255,0.4)" />

          <Text
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 11,
            }}
          >
            {formatRelativeDate(job._creationTime)}
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
          }}
        >
          <Briefcase size={12} color="rgba(255,255,255,0.4)" />

          <Text
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 11,
            }}
          >
            {CONTRACT_LABELS[job.contractType]}
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 6,
          marginBottom: 14,
        }}
      >
        {job.skills.slice(0, 4).map((skill) => (
          <View
            key={skill}
            style={{
              paddingHorizontal: 9,
              paddingVertical: 5,
              borderRadius: 9,
              backgroundColor: "rgba(255,255,255,0.055)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <Text
              style={{
                color: "rgba(255,255,255,0.62)",
                fontSize: 10,
                fontWeight: "600",
              }}
            >
              {skill}
            </Text>
          </View>
        ))}

        {job.skills.length > 4 ? (
          <View
            style={{
              paddingHorizontal: 9,
              paddingVertical: 5,
              borderRadius: 9,
              backgroundColor: "rgba(255,255,255,0.04)",
            }}
          >
            <Text
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: 10,
              }}
            >
              +{job.skills.length - 4}
            </Text>
          </View>
        ) : null}
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Text
          style={{
            color: "#34D399",
            fontSize: 14,
            fontWeight: "900",
            flex: 1,
          }}
        >
          {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
        </Text>

        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onApply();
          }}
          disabled={hasApplied}
          style={{
            minHeight: 38,
            paddingHorizontal: 13,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 6,
            backgroundColor: hasApplied
              ? "rgba(16,185,129,0.16)"
              : "rgba(99,102,241,0.18)",
            borderWidth: 1,
            borderColor: hasApplied
              ? "rgba(16,185,129,0.3)"
              : "rgba(99,102,241,0.3)",
          }}
        >
          {hasApplied ? (
            <>
              <CheckCircle size={13} color="#34D399" />
              <Text
                style={{
                  color: "#34D399",
                  fontSize: 11,
                  fontWeight: "800",
                }}
              >
                Candidaté
              </Text>
            </>
          ) : (
            <>
              <Send size={13} color="#A78BFA" />
              <Text
                style={{
                  color: "#A78BFA",
                  fontSize: 11,
                  fontWeight: "800",
                }}
              >
                Postuler
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/* Job Detail                                                                 */
/* -------------------------------------------------------------------------- */

function JobDetail({
  job,
  onClose,
  onApply,
  hasApplied,
}: {
  job: Doc<"jobListings">;
  onClose: () => void;
  onApply: () => void;
  hasApplied: boolean;
}) {
  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "#050812",
        }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 40,
          }}
        >
          <View
            style={{
              paddingHorizontal: 18,
              paddingTop: Platform.OS === "ios" ? 22 : 18,
              paddingBottom: 20,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                marginBottom: 22,
              }}
            >
              <Pressable
                onPress={onClose}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.1)",
                }}
              >
                <ArrowLeft size={19} color="#FFFFFF" />
              </Pressable>

              <Text
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                Détail de l'offre
              </Text>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 14,
              }}
            >
              <CompanyLogo
                company={job.company}
                logo={job.companyLogo}
                size={62}
              />

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 22,
                    fontWeight: "900",
                    lineHeight: 28,
                  }}
                >
                  {job.title}
                </Text>

                <Text
                  style={{
                    color: "rgba(255,255,255,0.58)",
                    fontSize: 13,
                    marginTop: 5,
                  }}
                >
                  {job.company} · {job.city}
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 7,
                    marginTop: 10,
                  }}
                >
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 999,
                      backgroundColor: "rgba(99,102,241,0.2)",
                    }}
                  >
                    <Text
                      style={{
                        color: "#A78BFA",
                        fontSize: 10,
                        fontWeight: "800",
                      }}
                    >
                      {CONTRACT_LABELS[job.contractType]}
                    </Text>
                  </View>

                  {job.remote ? (
                    <View
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 999,
                        backgroundColor: "rgba(16,185,129,0.15)",
                      }}
                    >
                      <Text
                        style={{
                          color: "#34D399",
                          fontSize: 10,
                          fontWeight: "800",
                        }}
                      >
                        REMOTE
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                gap: 10,
                marginTop: 22,
              }}
            >
              <DetailMetric
                icon={<DollarSign size={17} color="#34D399" />}
                label="Salaire"
                value={formatSalary(job.salaryMin, job.salaryMax, job.currency)}
              />

              <DetailMetric
                icon={<MapPin size={17} color="#818CF8" />}
                label="Lieu"
                value={job.city}
              />
            </View>

            <DetailSection title="Description">
              <Text
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 14,
                  lineHeight: 22,
                }}
              >
                {job.description}
              </Text>
            </DetailSection>

            <DetailSection title="Compétences requises">
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                {job.skills.map((skill) => (
                  <View
                    key={skill}
                    style={{
                      paddingHorizontal: 11,
                      paddingVertical: 7,
                      borderRadius: 11,
                      backgroundColor: "rgba(139,92,246,0.14)",
                      borderWidth: 1,
                      borderColor: "rgba(139,92,246,0.24)",
                    }}
                  >
                    <Text
                      style={{
                        color: "#C4B5FD",
                        fontSize: 11,
                        fontWeight: "600",
                      }}
                    >
                      {skill}
                    </Text>
                  </View>
                ))}
              </View>
            </DetailSection>

            <DetailSection title="Informations">
              <InfoRow
                icon={<Clock size={15} color="rgba(255,255,255,0.4)" />}
                label="Publié"
                value={formatRelativeDate(job._creationTime)}
              />

              <InfoRow
                icon={<MapPin size={15} color="rgba(255,255,255,0.4)" />}
                label="Lieu"
                value={job.city}
              />

              <InfoRow
                icon={<Briefcase size={15} color="rgba(255,255,255,0.4)" />}
                label="Contrat"
                value={CONTRACT_LABELS[job.contractType]}
              />
            </DetailSection>

            <Pressable
              onPress={onApply}
              disabled={hasApplied}
              style={{
                minHeight: 54,
                borderRadius: 17,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 9,
                backgroundColor: hasApplied
                  ? "rgba(16,185,129,0.18)"
                  : "rgba(99,102,241,0.95)",
                borderWidth: 1,
                borderColor: hasApplied
                  ? "rgba(16,185,129,0.35)"
                  : "rgba(129,140,248,0.4)",
                marginTop: 26,
              }}
            >
              {hasApplied ? (
                <>
                  <CheckCircle size={19} color="#34D399" />
                  <Text
                    style={{
                      color: "#34D399",
                      fontSize: 14,
                      fontWeight: "900",
                    }}
                  >
                    Candidature envoyée
                  </Text>
                </>
              ) : (
                <>
                  <Send size={19} color="#FFFFFF" />
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 14,
                      fontWeight: "900",
                    }}
                  >
                    Postuler maintenant
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function DetailMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        padding: 13,
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      <View style={{ marginBottom: 7 }}>{icon}</View>

      <Text
        numberOfLines={2}
        style={{
          color: "#FFFFFF",
          fontSize: 12,
          fontWeight: "800",
        }}
      >
        {value}
      </Text>

      <Text
        style={{
          color: "rgba(255,255,255,0.4)",
          fontSize: 10,
          marginTop: 3,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginTop: 25 }}>
      <Text
        style={{
          color: "rgba(255,255,255,0.42)",
          fontSize: 11,
          fontWeight: "800",
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 10,
        }}
      >
        {title}
      </Text>

      {children}
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View
      style={{
        minHeight: 44,
        borderRadius: 13,
        paddingHorizontal: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 9,
        backgroundColor: "rgba(255,255,255,0.035)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.055)",
        marginBottom: 7,
      }}
    >
      {icon}

      <Text
        style={{
          color: "rgba(255,255,255,0.48)",
          fontSize: 11,
        }}
      >
        {label}
      </Text>

      <Text
        numberOfLines={1}
        style={{
          color: "rgba(255,255,255,0.8)",
          fontSize: 11,
          fontWeight: "700",
          marginLeft: "auto",
          maxWidth: "55%",
        }}
      >
        {value}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Freelance                                                                  */
/* -------------------------------------------------------------------------- */

function MissionCard({ mission }: { mission: Doc<"freelanceMissions"> }) {
  return (
    <View
      style={{
        backgroundColor: "rgba(255,255,255,0.055)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.09)",
        borderRadius: 24,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(249,115,22,0.16)",
            borderWidth: 1,
            borderColor: "rgba(249,115,22,0.3)",
          }}
        >
          <Zap size={18} color="#FB923C" />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 15,
              fontWeight: "800",
              lineHeight: 20,
            }}
          >
            {mission.title}
          </Text>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 7,
              marginTop: 5,
            }}
          >
            {mission.remote ? (
              <Text
                style={{
                  color: "#34D399",
                  fontSize: 10,
                  fontWeight: "800",
                }}
              >
                REMOTE
              </Text>
            ) : null}

            {mission.duration ? (
              <Text
                style={{
                  color: "rgba(255,255,255,0.42)",
                  fontSize: 11,
                }}
              >
                {mission.duration}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      <Text
        style={{
          color: "rgba(255,255,255,0.55)",
          fontSize: 12,
          lineHeight: 19,
          marginTop: 14,
          marginBottom: 13,
        }}
      >
        {mission.description}
      </Text>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 6,
          marginBottom: 13,
        }}
      >
        {mission.skills.slice(0, 4).map((skill) => (
          <View
            key={skill}
            style={{
              paddingHorizontal: 9,
              paddingVertical: 5,
              borderRadius: 9,
              backgroundColor: "rgba(255,255,255,0.055)",
            }}
          >
            <Text
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: 10,
              }}
            >
              {skill}
            </Text>
          </View>
        ))}
      </View>

      <Text
        style={{
          color: "#C4B5FD",
          fontSize: 14,
          fontWeight: "900",
        }}
      >
        {mission.budget != null
          ? `${mission.budget.toLocaleString()} ${mission.currency ?? "USD"}`
          : "Budget ouvert"}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Applications                                                               */
/* -------------------------------------------------------------------------- */

function ApplicationsTab({
  applications,
}: {
  applications: ApplicationWithJob[];
}) {
  if (applications.length === 0) {
    return (
      <View
        style={{
          alignItems: "center",
          paddingVertical: 70,
          paddingHorizontal: 25,
        }}
      >
        <Send size={42} color="rgba(255,255,255,0.18)" />

        <Text
          style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: 14,
            fontWeight: "700",
            marginTop: 14,
          }}
        >
          Aucune candidature
        </Text>

        <Text
          style={{
            color: "rgba(255,255,255,0.25)",
            fontSize: 12,
            textAlign: "center",
            marginTop: 5,
          }}
        >
          Tes candidatures apparaîtront ici dès que tu postules à une offre.
        </Text>
      </View>
    );
  }

  const counts = {
    total: applications.length,
    interviews: applications.filter(
      (application) => application.status === "shortlisted",
    ).length,
    accepted: applications.filter(
      (application) => application.status === "hired",
    ).length,
  };

  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <ApplicationMetric label="Total" value={counts.total} color="#818CF8" />

        <ApplicationMetric
          label="Entretiens"
          value={counts.interviews}
          color="#60A5FA"
        />

        <ApplicationMetric
          label="Acceptées"
          value={counts.accepted}
          color="#34D399"
        />
      </View>

      {applications.map((application) => {
        const config = STATUS_CONFIG[application.status];

        return (
          <View
            key={application._id}
            style={{
              borderRadius: 18,
              padding: 14,
              backgroundColor: "rgba(255,255,255,0.05)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
              marginBottom: 9,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: "800",
                  }}
                >
                  {application.jobTitle ?? "Offre"}
                </Text>

                <Text
                  style={{
                    color: "rgba(255,255,255,0.45)",
                    fontSize: 11,
                    marginTop: 4,
                  }}
                >
                  {application.jobCompany ?? "Entreprise"} ·{" "}
                  {formatRelativeDate(
                    new Date(application.appliedAt).getTime(),
                  )}
                </Text>
              </View>

              <View
                style={{
                  paddingHorizontal: 9,
                  paddingVertical: 5,
                  borderRadius: 999,
                  backgroundColor: config.bg,
                }}
              >
                <Text
                  style={{
                    color: config.color,
                    fontSize: 9,
                    fontWeight: "900",
                  }}
                >
                  {config.label}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function ApplicationMetric({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        paddingVertical: 13,
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      <Text
        style={{
          color,
          fontSize: 22,
          fontWeight: "900",
        }}
      >
        {value}
      </Text>

      <Text
        style={{
          color: "rgba(255,255,255,0.4)",
          fontSize: 10,
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* CV                                                                         */
/* -------------------------------------------------------------------------- */

function CVBuilder({
  cv,
  onChange,
}: {
  cv: CVData;
  onChange: (cv: CVData) => void;
}) {
  const [preview, setPreview] = useState(false);
  const [newSkill, setNewSkill] = useState("");

  const addSkill = () => {
    const value = newSkill.trim();

    if (!value) {
      return;
    }

    if (
      cv.skills.some((skill) => skill.toLowerCase() === value.toLowerCase())
    ) {
      setNewSkill("");
      return;
    }

    onChange({
      ...cv,
      skills: [...cv.skills, value],
    });

    setNewSkill("");
  };

  const removeSkill = (index: number) => {
    onChange({
      ...cv,
      skills: cv.skills.filter((_, itemIndex) => itemIndex !== index),
    });
  };

  if (preview) {
    return (
      <View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 15,
              fontWeight: "800",
            }}
          >
            Aperçu du CV
          </Text>

          <Pressable
            onPress={() => setPreview(false)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 11,
              paddingVertical: 8,
              borderRadius: 11,
              backgroundColor: "rgba(255,255,255,0.07)",
            }}
          >
            <Edit3 size={13} color="#A78BFA" />

            <Text
              style={{
                color: "#C4B5FD",
                fontSize: 11,
                fontWeight: "700",
              }}
            >
              Modifier
            </Text>
          </Pressable>
        </View>

        <View
          style={{
            borderRadius: 22,
            overflow: "hidden",
            backgroundColor: "#F8FAFC",
          }}
        >
          <View
            style={{
              padding: 20,
              backgroundColor: "#111827",
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 22,
                fontWeight: "900",
              }}
            >
              {cv.name || "Nom complet"}
            </Text>

            <Text
              style={{
                color: "#C4B5FD",
                fontSize: 13,
                marginTop: 4,
              }}
            >
              {cv.title || "Poste recherché"}
            </Text>

            <Text
              style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: 10,
                marginTop: 9,
              }}
            >
              {[cv.email, cv.phone, cv.city].filter(Boolean).join(" · ")}
            </Text>
          </View>

          <View style={{ padding: 20 }}>
            {cv.summary ? (
              <CVPreviewSection title="Profil">
                <Text
                  style={{
                    color: "#475569",
                    fontSize: 11,
                    lineHeight: 18,
                  }}
                >
                  {cv.summary}
                </Text>
              </CVPreviewSection>
            ) : null}

            {cv.skills.length > 0 ? (
              <CVPreviewSection title="Compétences">
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 6,
                  }}
                >
                  {cv.skills.map((skill) => (
                    <View
                      key={skill}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 999,
                        backgroundColor: "#EDE9FE",
                      }}
                    >
                      <Text
                        style={{
                          color: "#6D28D9",
                          fontSize: 10,
                          fontWeight: "600",
                        }}
                      >
                        {skill}
                      </Text>
                    </View>
                  ))}
                </View>
              </CVPreviewSection>
            ) : null}

            {cv.experiences.length > 0 ? (
              <CVPreviewSection title="Expériences">
                {cv.experiences.map((experience, index) => (
                  <View
                    key={`${experience.role}-${index}`}
                    style={{ marginBottom: 10 }}
                  >
                    <Text
                      style={{
                        color: "#1E293B",
                        fontSize: 11,
                        fontWeight: "800",
                      }}
                    >
                      {experience.role} · {experience.company}
                    </Text>

                    <Text
                      style={{
                        color: "#64748B",
                        fontSize: 9,
                        marginTop: 2,
                      }}
                    >
                      {experience.period}
                    </Text>

                    {experience.desc ? (
                      <Text
                        style={{
                          color: "#475569",
                          fontSize: 10,
                          lineHeight: 16,
                          marginTop: 3,
                        }}
                      >
                        {experience.desc}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </CVPreviewSection>
            ) : null}

            {cv.education.length > 0 ? (
              <CVPreviewSection title="Formation">
                {cv.education.map((education, index) => (
                  <View
                    key={`${education.degree}-${index}`}
                    style={{ marginBottom: 8 }}
                  >
                    <Text
                      style={{
                        color: "#1E293B",
                        fontSize: 11,
                        fontWeight: "800",
                      }}
                    >
                      {education.degree}
                    </Text>

                    <Text
                      style={{
                        color: "#64748B",
                        fontSize: 9,
                        marginTop: 2,
                      }}
                    >
                      {education.school}
                      {education.year ? ` · ${education.year}` : ""}
                    </Text>
                  </View>
                ))}
              </CVPreviewSection>
            ) : null}
          </View>
        </View>

        <View
          style={{
            marginTop: 12,
            padding: 13,
            borderRadius: 15,
            backgroundColor: "rgba(255,255,255,0.04)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.07)",
          }}
        >
          <Text
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: 11,
              lineHeight: 17,
            }}
          >
            L'export PDF nécessite un service de génération de document
            connecté. Aucun faux téléchargement n'est déclenché ici.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <View>
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 15,
              fontWeight: "800",
            }}
          >
            Mon CV
          </Text>

          <Text
            style={{
              color: "rgba(255,255,255,0.38)",
              fontSize: 11,
              marginTop: 3,
            }}
          >
            Crée ton profil professionnel
          </Text>
        </View>

        <Pressable
          onPress={() => setPreview(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 11,
            paddingVertical: 8,
            borderRadius: 11,
            backgroundColor: "rgba(139,92,246,0.15)",
            borderWidth: 1,
            borderColor: "rgba(139,92,246,0.25)",
          }}
        >
          <Eye size={13} color="#A78BFA" />

          <Text
            style={{
              color: "#C4B5FD",
              fontSize: 11,
              fontWeight: "700",
            }}
          >
            Aperçu
          </Text>
        </Pressable>
      </View>

      <CVField
        label="Nom complet"
        value={cv.name}
        placeholder="Votre nom"
        onChangeText={(value) => onChange({ ...cv, name: value })}
      />

      <CVField
        label="Poste recherché"
        value={cv.title}
        placeholder="Ex. Technicien maintenance"
        onChangeText={(value) => onChange({ ...cv, title: value })}
      />

      <CVField
        label="Email"
        value={cv.email}
        placeholder="Votre email"
        keyboardType="email-address"
        onChangeText={(value) => onChange({ ...cv, email: value })}
      />

      <CVField
        label="Téléphone"
        value={cv.phone}
        placeholder="Votre téléphone"
        keyboardType="phone-pad"
        onChangeText={(value) => onChange({ ...cv, phone: value })}
      />

      <CVField
        label="Ville"
        value={cv.city}
        placeholder="Votre ville"
        onChangeText={(value) => onChange({ ...cv, city: value })}
      />

      <CVField
        label="Résumé professionnel"
        value={cv.summary}
        placeholder="Présentez votre profil, votre expérience et votre valeur..."
        multiline
        onChangeText={(value) => onChange({ ...cv, summary: value })}
      />

      <View
        style={{
          marginTop: 4,
          padding: 15,
          borderRadius: 18,
          backgroundColor: "rgba(255,255,255,0.05)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <Text
          style={{
            color: "rgba(255,255,255,0.42)",
            fontSize: 10,
            fontWeight: "800",
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 10,
          }}
        >
          Compétences
        </Text>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 7,
            marginBottom: 10,
          }}
        >
          {cv.skills.map((skill, index) => (
            <View
              key={`${skill}-${index}`}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                paddingHorizontal: 9,
                paddingVertical: 6,
                borderRadius: 10,
                backgroundColor: "rgba(139,92,246,0.15)",
                borderWidth: 1,
                borderColor: "rgba(139,92,246,0.24)",
              }}
            >
              <Text
                style={{
                  color: "#C4B5FD",
                  fontSize: 10,
                  fontWeight: "600",
                }}
              >
                {skill}
              </Text>

              <Pressable onPress={() => removeSkill(index)}>
                <X size={11} color="rgba(255,255,255,0.45)" />
              </Pressable>
            </View>
          ))}
        </View>

        <View
          style={{
            flexDirection: "row",
            gap: 8,
          }}
        >
          <TextInput
            value={newSkill}
            onChangeText={setNewSkill}
            onSubmitEditing={addSkill}
            placeholder="Ajouter une compétence..."
            placeholderTextColor="rgba(255,255,255,0.28)"
            style={{
              flex: 1,
              minHeight: 40,
              borderRadius: 12,
              paddingHorizontal: 12,
              color: "#FFFFFF",
              backgroundColor: "rgba(255,255,255,0.05)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.09)",
              fontSize: 12,
            }}
            returnKeyType="done"
          />

          <Pressable
            onPress={addSkill}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(139,92,246,0.2)",
            }}
          >
            <Plus size={16} color="#A78BFA" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function CVField({
  label,
  value,
  placeholder,
  multiline,
  keyboardType,
  onChangeText,
}: {
  label: string;
  value: string;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad";
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={{ marginBottom: 11 }}>
      <Text
        style={{
          color: "rgba(255,255,255,0.42)",
          fontSize: 10,
          fontWeight: "700",
          marginBottom: 6,
        }}
      >
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.25)"
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={{
          minHeight: multiline ? 105 : 44,
          borderRadius: 13,
          paddingHorizontal: 12,
          paddingVertical: multiline ? 11 : 0,
          color: "#FFFFFF",
          backgroundColor: "rgba(255,255,255,0.05)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.09)",
          fontSize: 12,
        }}
      />
    </View>
  );
}

function CVPreviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 17 }}>
      <Text
        style={{
          color: "#6D28D9",
          fontSize: 10,
          fontWeight: "900",
          textTransform: "uppercase",
          marginBottom: 7,
        }}
      >
        {title}
      </Text>

      {children}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Skeleton                                                                    */
/* -------------------------------------------------------------------------- */

function JobListSkeleton() {
  return (
    <View>
      {[0, 1, 2, 3].map((index) => (
        <View
          key={index}
          style={{
            borderRadius: 24,
            padding: 16,
            marginBottom: 12,
            backgroundColor: "rgba(255,255,255,0.05)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              gap: 12,
            }}
          >
            <Skeleton className="w-12 h-12 rounded-2xl" />

            <View style={{ flex: 1, gap: 8 }}>
              <Skeleton className="h-4 w-3/4 rounded-lg" />
              <Skeleton className="h-3 w-1/2 rounded-lg" />
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              gap: 8,
              marginTop: 16,
            }}
          >
            <Skeleton className="h-3 w-20 rounded-lg" />
            <Skeleton className="h-3 w-16 rounded-lg" />
            <Skeleton className="h-3 w-16 rounded-lg" />
          </View>

          <View
            style={{
              flexDirection: "row",
              gap: 7,
              marginTop: 14,
            }}
          >
            <Skeleton className="h-6 w-16 rounded-lg" />
            <Skeleton className="h-6 w-20 rounded-lg" />
            <Skeleton className="h-6 w-14 rounded-lg" />
          </View>
        </View>
      ))}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Main authenticated content                                                 */
/* -------------------------------------------------------------------------- */

function EmploiContent({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<TabId>("offres");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState<ContractType | null>(null);
  const [selectedJob, setSelectedJob] = useState<Doc<"jobListings"> | null>(
    null,
  );

  const [cv, setCv] = useState<CVData>(EMPTY_CV);

  const {
    results: jobs,
    status: jobsStatus,
    loadMore: loadMoreJobs,
  } = usePaginatedQuery(
    api.employment.listJobs,
    {},
    {
      initialNumItems: 20,
    },
  );

  const {
    results: missions,
    status: missionsStatus,
    loadMore: loadMoreMissions,
  } = usePaginatedQuery(
    api.employment.listMissions,
    {},
    {
      initialNumItems: 20,
    },
  );

  const myApplications = useQuery(api.employment.getMyApplications, {});

  const applyToJobMutation = useMutation(api.employment.applyToJob);

  const appliedJobIds = useMemo(
    () =>
      new Set((myApplications ?? []).map((application) => application.jobId)),
    [myApplications],
  );

  const handleApply = async (jobId: Id<"jobListings">) => {
    try {
      await applyToJobMutation({ jobId });

      Alert.alert(
        "Candidature envoyée",
        "Ta candidature a bien été enregistrée.",
      );
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as
          | {
              message?: string;
              code?: string;
            }
          | undefined;

        if (data?.code === "CONFLICT") {
          Alert.alert(
            "Déjà candidaté",
            "Une candidature existe déjà pour cette offre.",
          );
          return;
        }

        Alert.alert(
          "Impossible de postuler",
          data?.message ?? "Une erreur est survenue.",
        );
        return;
      }

      Alert.alert(
        "Impossible de postuler",
        "Une erreur est survenue. Réessaie.",
      );
    }
  };

  const normalizedSearch = search.trim().toLowerCase();

  const filteredJobs = useMemo(() => {
    return (jobs ?? []).filter((job) => {
      if (
        normalizedSearch &&
        !job.title.toLowerCase().includes(normalizedSearch) &&
        !job.company.toLowerCase().includes(normalizedSearch) &&
        !job.city.toLowerCase().includes(normalizedSearch) &&
        !job.skills.some((skill) =>
          skill.toLowerCase().includes(normalizedSearch),
        )
      ) {
        return false;
      }

      if (typeFilter && job.contractType !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [jobs, normalizedSearch, typeFilter]);

  const filteredMissions = useMemo(() => {
    return (missions ?? []).filter((mission) => {
      if (!normalizedSearch) {
        return true;
      }

      return (
        mission.title.toLowerCase().includes(normalizedSearch) ||
        mission.description.toLowerCase().includes(normalizedSearch) ||
        mission.skills.some((skill) =>
          skill.toLowerCase().includes(normalizedSearch),
        )
      );
    });
  }, [missions, normalizedSearch]);

  const totalCount = (jobs?.length ?? 0) + (missions?.length ?? 0);

  const tabs: {
    id: TabId;
    label: string;
    icon: typeof Briefcase;
    color: string;
  }[] = [
    {
      id: "offres",
      label: "Emplois",
      icon: Briefcase,
      color: "#8B5CF6",
    },
    {
      id: "freelance",
      label: "Freelance",
      icon: Zap,
      color: "#F97316",
    },
    {
      id: "candidatures",
      label: "Candidatures",
      icon: BarChart2,
      color: "#3B82F6",
    },
    {
      id: "cv",
      label: "Mon CV",
      icon: FileText,
      color: "#10B981",
    },
  ];

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#050812",
      }}
    >
      <View
        style={{
          position: "absolute",
          width: 260,
          height: 260,
          borderRadius: 130,
          top: -150,
          right: -100,
          backgroundColor: "rgba(99,102,241,0.08)",
        }}
      />

      <View
        style={{
          position: "absolute",
          width: 220,
          height: 220,
          borderRadius: 110,
          bottom: -120,
          left: -100,
          backgroundColor: "rgba(139,92,246,0.06)",
        }}
      />

      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: Platform.OS === "ios" ? 18 : 14,
          paddingBottom: 10,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 11,
            marginBottom: 15,
          }}
        >
          <Pressable
            onPress={onBack}
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255,255,255,0.08)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.1)",
            }}
          >
            <ArrowLeft size={19} color="#FFFFFF" />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 21,
                fontWeight: "900",
              }}
            >
              Emploi & Freelance
            </Text>

            <Text
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: 11,
                marginTop: 2,
              }}
            >
              Opportunités disponibles sur la plateforme
            </Text>
          </View>

          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 8,
              borderRadius: 12,
              backgroundColor: "rgba(139,92,246,0.14)",
              borderWidth: 1,
              borderColor: "rgba(139,92,246,0.23)",
            }}
          >
            <Text
              style={{
                color: "#C4B5FD",
                fontSize: 10,
                fontWeight: "900",
              }}
            >
              {totalCount} disponibles
            </Text>
          </View>
        </View>

        {(tab === "offres" || tab === "freelance") && (
          <>
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <View
                style={{
                  flex: 1,
                  minHeight: 44,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  paddingHorizontal: 12,
                  borderRadius: 14,
                  backgroundColor: "rgba(255,255,255,0.06)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.09)",
                }}
              >
                <Search size={15} color="rgba(255,255,255,0.4)" />

                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Titre, entreprise, ville, compétence..."
                  placeholderTextColor="rgba(255,255,255,0.28)"
                  style={{
                    flex: 1,
                    color: "#FFFFFF",
                    fontSize: 12,
                  }}
                  returnKeyType="search"
                />

                {search ? (
                  <Pressable onPress={() => setSearch("")}>
                    <X size={14} color="rgba(255,255,255,0.4)" />
                  </Pressable>
                ) : null}
              </View>

              <Pressable
                onPress={() => setShowFilters((value) => !value)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: showFilters
                    ? "rgba(139,92,246,0.2)"
                    : "rgba(255,255,255,0.06)",
                  borderWidth: 1,
                  borderColor: showFilters
                    ? "rgba(139,92,246,0.35)"
                    : "rgba(255,255,255,0.09)",
                }}
              >
                <SlidersHorizontal
                  size={16}
                  color={showFilters ? "#A78BFA" : "rgba(255,255,255,0.6)"}
                />
              </Pressable>
            </View>

            {showFilters ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  gap: 7,
                  paddingBottom: 10,
                }}
              >
                {TYPE_FILTERS.map((filter) => {
                  const active = typeFilter === filter.value;

                  return (
                    <Pressable
                      key={filter.label}
                      onPress={() => setTypeFilter(filter.value)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 11,
                        backgroundColor: active
                          ? "rgba(139,92,246,0.2)"
                          : "rgba(255,255,255,0.05)",
                        borderWidth: 1,
                        borderColor: active
                          ? "rgba(139,92,246,0.35)"
                          : "rgba(255,255,255,0.08)",
                      }}
                    >
                      <Text
                        style={{
                          color: active ? "#C4B5FD" : "rgba(255,255,255,0.55)",
                          fontSize: 10,
                          fontWeight: "800",
                        }}
                      >
                        {filter.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}
          </>
        )}

        <View
          style={{
            flexDirection: "row",
            gap: 5,
          }}
        >
          {tabs.map(({ id, label, icon: Icon, color }) => {
            const active = tab === id;

            return (
              <Pressable
                key={id}
                onPress={() => setTab(id)}
                style={{
                  flex: 1,
                  minHeight: 54,
                  borderRadius: 15,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  backgroundColor: active
                    ? `${color}20`
                    : "rgba(255,255,255,0.035)",
                  borderWidth: 1,
                  borderColor: active ? `${color}45` : "rgba(255,255,255,0.06)",
                }}
              >
                <Icon
                  size={15}
                  color={active ? color : "rgba(255,255,255,0.35)"}
                />

                <Text
                  numberOfLines={1}
                  style={{
                    color: active ? color : "rgba(255,255,255,0.38)",
                    fontSize: 9,
                    fontWeight: "800",
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 35,
        }}
      >
        {tab === "offres" ? (
          <View style={{ paddingTop: 4 }}>
            <Text
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: 11,
                marginBottom: 10,
              }}
            >
              {filteredJobs.length}{" "}
              {filteredJobs.length === 1 ? "résultat" : "résultats"}
            </Text>

            {jobsStatus === "LoadingFirstPage" ? (
              <JobListSkeleton />
            ) : filteredJobs.length === 0 ? (
              <EmptyState
                icon={<Briefcase size={42} color="rgba(255,255,255,0.18)" />}
                title="Aucune offre trouvée"
                description="Aucune offre correspondant aux données et filtres actuels."
              />
            ) : (
              <>
                {filteredJobs.map((job) => (
                  <JobCard
                    key={job._id}
                    job={job}
                    onSelect={() => setSelectedJob(job)}
                    onApply={() => handleApply(job._id)}
                    hasApplied={appliedJobIds.has(job._id)}
                  />
                ))}

                {jobsStatus === "CanLoadMore" ? (
                  <LoadMoreButton
                    label="Charger plus d'offres"
                    onPress={() => loadMoreJobs(20)}
                  />
                ) : null}

                {jobsStatus === "LoadingMore" ? (
                  <View style={{ paddingVertical: 12 }}>
                    <Skeleton className="h-9 w-36 rounded-xl" />
                  </View>
                ) : null}
              </>
            )}
          </View>
        ) : null}

        {tab === "freelance" ? (
          <View style={{ paddingTop: 4 }}>
            <Text
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: 11,
                marginBottom: 10,
              }}
            >
              {filteredMissions.length}{" "}
              {filteredMissions.length === 1 ? "mission" : "missions"}
            </Text>

            {missionsStatus === "LoadingFirstPage" ? (
              <JobListSkeleton />
            ) : filteredMissions.length === 0 ? (
              <EmptyState
                icon={<Zap size={42} color="rgba(255,255,255,0.18)" />}
                title="Aucune mission disponible"
                description="Aucune mission correspondant à la recherche actuelle."
              />
            ) : (
              <>
                {filteredMissions.map((mission) => (
                  <MissionCard key={mission._id} mission={mission} />
                ))}

                {missionsStatus === "CanLoadMore" ? (
                  <LoadMoreButton
                    label="Charger plus de missions"
                    onPress={() => loadMoreMissions(20)}
                  />
                ) : null}

                {missionsStatus === "LoadingMore" ? (
                  <View style={{ paddingVertical: 12 }}>
                    <Skeleton className="h-9 w-36 rounded-xl" />
                  </View>
                ) : null}
              </>
            )}
          </View>
        ) : null}

        {tab === "candidatures" ? (
          <View style={{ paddingTop: 6 }}>
            {myApplications === undefined ? (
              <View style={{ gap: 9 }}>
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-20 w-full rounded-2xl" />
              </View>
            ) : (
              <ApplicationsTab
                applications={myApplications as ApplicationWithJob[]}
              />
            )}
          </View>
        ) : null}

        {tab === "cv" ? (
          <View style={{ paddingTop: 6 }}>
            <CVBuilder cv={cv} onChange={setCv} />
          </View>
        ) : null}
      </ScrollView>

      {selectedJob ? (
        <JobDetail
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onApply={() => handleApply(selectedJob._id)}
          hasApplied={appliedJobIds.has(selectedJob._id)}
        />
      ) : null}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Generic UI                                                                 */
/* -------------------------------------------------------------------------- */

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <View
      style={{
        alignItems: "center",
        paddingVertical: 70,
        paddingHorizontal: 25,
      }}
    >
      {icon}

      <Text
        style={{
          color: "rgba(255,255,255,0.46)",
          fontSize: 14,
          fontWeight: "700",
          textAlign: "center",
          marginTop: 14,
        }}
      >
        {title}
      </Text>

      <Text
        style={{
          color: "rgba(255,255,255,0.25)",
          fontSize: 11,
          textAlign: "center",
          lineHeight: 17,
          marginTop: 5,
        }}
      >
        {description}
      </Text>
    </View>
  );
}

function LoadMoreButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        minHeight: 44,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(139,92,246,0.1)",
        borderWidth: 1,
        borderColor: "rgba(139,92,246,0.22)",
        marginBottom: 10,
      }}
    >
      <Text
        style={{
          color: "#C4B5FD",
          fontSize: 11,
          fontWeight: "800",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

interface EmploiPageProps {
  onBack: () => void;
}

export default function EmploiPage({ onBack }: EmploiPageProps) {
  return (
    <>
      <AuthLoading>
        <View
          style={{
            flex: 1,
            backgroundColor: "#050812",
            paddingHorizontal: 20,
            paddingTop: 45,
          }}
        >
          <Skeleton className="h-9 w-52 rounded-xl" />

          <View style={{ marginTop: 25, gap: 12 }}>
            <Skeleton className="h-28 w-full rounded-3xl" />
            <Skeleton className="h-28 w-full rounded-3xl" />
            <Skeleton className="h-28 w-full rounded-3xl" />
          </View>
        </View>
      </AuthLoading>

      <Unauthenticated>
        <View
          style={{
            flex: 1,
            backgroundColor: "#050812",
          }}
        >
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: Platform.OS === "ios" ? 18 : 14,
              paddingBottom: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 11,
            }}
          >
            <Pressable
              onPress={onBack}
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255,255,255,0.08)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.1)",
              }}
            >
              <ArrowLeft size={19} color="#FFFFFF" />
            </Pressable>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 21,
                  fontWeight: "900",
                }}
              >
                Emploi & Freelance
              </Text>

              <Text
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 11,
                  marginTop: 2,
                }}
              >
                Opportunités professionnelles
              </Text>
            </View>
          </View>

          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 30,
            }}
          >
            <Briefcase size={50} color="rgba(255,255,255,0.17)" />

            <Text
              style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: 14,
                fontWeight: "700",
                textAlign: "center",
                lineHeight: 21,
                marginTop: 17,
              }}
            >
              Connecte-toi pour accéder aux opportunités et envoyer tes
              candidatures.
            </Text>

            <View style={{ marginTop: 20 }}>
              <SignInButton />
            </View>
          </View>
        </View>
      </Unauthenticated>

      <Authenticated>
        <EmploiContent onBack={onBack} />
      </Authenticated>
    </>
  );
}
