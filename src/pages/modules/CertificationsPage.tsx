import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  Lock,
  Medal,
  Share2,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  X,
} from "lucide-react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
} from "@/lib/convex-auth-compat";
import { Skeleton } from "@/components/ui/skeleton.tsx";

type Props = {
  onBack: () => void;
};

type Tab = "Certifications" | "Badges" | "Classement";

type CertificateRecord = {
  _id: string;
  title: string;
  [key: string]: unknown;
};

const TABS: readonly Tab[] = ["Certifications", "Badges", "Classement"];

function formatDate(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function getNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Award;
  title: string;
  description: string;
}) {
  return (
    <View className="items-center justify-center px-6 py-16">
      <View className="h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
        <Icon size={28} color="rgba(255,255,255,0.25)" />
      </View>

      <Text className="mt-5 text-center text-base font-bold text-white">
        {title}
      </Text>

      <Text className="mt-2 max-w-sm text-center text-sm leading-5 text-gray-400">
        {description}
      </Text>
    </View>
  );
}

function Header({
  onBack,
  certificateCount,
}: {
  onBack: () => void;
  certificateCount: number;
}) {
  return (
    <View className="px-4 pb-4 pt-12">
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={onBack}
          className="h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.045] active:opacity-70"
        >
          <ArrowLeft size={20} color="#ffffff" />
        </Pressable>

        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-xl font-bold text-white">Certifications</Text>

            <View className="rounded-full bg-indigo-500/15 px-2 py-1">
              <Text className="text-[10px] font-bold text-indigo-300">
                {certificateCount}
              </Text>
            </View>
          </View>

          <Text className="mt-1 text-xs text-gray-400">
            Votre parcours d'apprentissage
          </Text>
        </View>

        <View className="h-11 w-11 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-500/10">
          <Award size={19} color="#fbbf24" />
        </View>
      </View>
    </View>
  );
}

function OverviewCard({ certificateCount }: { certificateCount: number }) {
  return (
    <View className="mx-4 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045]">
      <View className="p-5">
        <View className="flex-row items-start gap-4">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/15">
            <Trophy size={26} color="#818cf8" />
          </View>

          <View className="flex-1">
            <Text className="text-base font-bold text-white">
              Votre parcours
            </Text>

            <Text className="mt-1 text-sm leading-5 text-gray-400">
              Retrouvez ici les certifications réellement enregistrées sur votre
              compte.
            </Text>
          </View>
        </View>

        <View className="mt-5 flex-row gap-3">
          <View className="flex-1 rounded-2xl border border-white/10 bg-black/10 p-4">
            <Award size={17} color="#a5b4fc" />

            <Text className="mt-2 text-2xl font-bold text-white">
              {certificateCount}
            </Text>

            <Text className="mt-1 text-xs text-gray-500">Certifications</Text>
          </View>

          <View className="flex-1 rounded-2xl border border-white/10 bg-black/10 p-4">
            <CheckCircle2 size={17} color="#4ade80" />

            <Text className="mt-2 text-2xl font-bold text-white">
              {certificateCount}
            </Text>

            <Text className="mt-1 text-xs text-gray-500">Enregistrées</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function CertificateCard({
  certificate,
  onPress,
}: {
  certificate: CertificateRecord;
  onPress: () => void;
}) {
  const issuer =
    getString(certificate.issuer) ??
    getString(certificate.provider) ??
    getString(certificate.organization);

  const description = getString(certificate.description);

  const level = getString(certificate.level);

  const earnedDate =
    certificate.earnedDate ?? certificate.completedAt ?? certificate.date;

  const progress = getNumber(certificate.progress);

  const completed =
    certificate.status === "completed" ||
    certificate.status === "earned" ||
    certificate.completed === true;

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] active:opacity-90"
    >
      <View className="p-4">
        <View className="flex-row items-start gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10">
            {completed ? (
              <CheckCircle2 size={22} color="#4ade80" />
            ) : (
              <Award size={22} color="#818cf8" />
            )}
          </View>

          <View className="flex-1">
            <View className="flex-row items-start gap-2">
              <Text
                numberOfLines={2}
                className="flex-1 text-sm font-bold leading-5 text-white"
              >
                {certificate.title}
              </Text>

              <ChevronRight size={17} color="rgba(255,255,255,0.28)" />
            </View>

            {issuer ? (
              <Text numberOfLines={1} className="mt-1 text-xs text-gray-500">
                {issuer}
              </Text>
            ) : null}

            {description ? (
              <Text
                numberOfLines={2}
                className="mt-2 text-xs leading-4 text-gray-400"
              >
                {description}
              </Text>
            ) : null}
          </View>
        </View>

        <View className="mt-4 flex-row flex-wrap items-center gap-2">
          {level ? (
            <View className="rounded-full border border-indigo-400/20 bg-indigo-500/10 px-2.5 py-1">
              <Text className="text-[10px] font-semibold text-indigo-300">
                {level}
              </Text>
            </View>
          ) : null}

          {completed ? (
            <View className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1">
              <Text className="text-[10px] font-semibold text-emerald-300">
                Terminée
              </Text>
            </View>
          ) : (
            <View className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-1">
              <Text className="text-[10px] font-semibold text-amber-300">
                En cours
              </Text>
            </View>
          )}

          {earnedDate ? (
            <Text className="ml-auto text-[10px] text-gray-600">
              {formatDate(earnedDate) ?? "Date indisponible"}
            </Text>
          ) : null}
        </View>

        {typeof progress === "number" ? (
          <View className="mt-4">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-[10px] text-gray-500">Progression</Text>

              <Text className="text-[10px] font-bold text-indigo-300">
                {Math.round(Math.min(100, Math.max(0, progress)))}%
              </Text>
            </View>

            <View className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <View
                className="h-full rounded-full bg-indigo-500"
                style={{
                  width: `${Math.min(100, Math.max(0, progress))}%`,
                }}
              />
            </View>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function CertificateDetailModal({
  certificate,
  onClose,
}: {
  certificate: CertificateRecord | null;
  onClose: () => void;
}) {
  if (!certificate) {
    return null;
  }

  const issuer =
    getString(certificate.issuer) ??
    getString(certificate.provider) ??
    getString(certificate.organization);

  const description = getString(certificate.description);

  const level = getString(certificate.level);

  const progress = getNumber(certificate.progress);

  const earnedDate =
    certificate.earnedDate ?? certificate.completedAt ?? certificate.date;

  const completed =
    certificate.status === "completed" ||
    certificate.status === "earned" ||
    certificate.completed === true;

  const handleShare = async () => {
    try {
      await Share.share({
        title: certificate.title,
        message: [
          certificate.title,
          issuer ? `Organisme : ${issuer}` : null,
          description,
          completed ? "Certification terminée." : null,
        ]
          .filter(Boolean)
          .join("\n\n"),
      });
    } catch {
      // Le partage natif peut être fermé par l'utilisateur.
    }
  };

  const handleDownload = () => {
    Alert.alert(
      "Certificat",
      "Le téléchargement dépend du document de certificat réellement disponible dans votre compte.",
    );
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/75">
        <View className="max-h-[90%] rounded-t-[30px] border border-white/10 bg-[#0b1020]">
          <ScrollView
            contentContainerStyle={{
              padding: 20,
              paddingBottom: 36,
            }}
            showsVerticalScrollIndicator={false}
          >
            <View className="mb-5 items-center">
              <View className="h-1 w-12 rounded-full bg-white/15" />
            </View>

            <View className="mb-6 flex-row items-start gap-3">
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/15">
                {completed ? (
                  <CheckCircle2 size={25} color="#4ade80" />
                ) : (
                  <Award size={25} color="#818cf8" />
                )}
              </View>

              <View className="flex-1">
                <Text className="text-lg font-bold text-white">
                  {certificate.title}
                </Text>

                {issuer ? (
                  <Text className="mt-1 text-sm text-gray-400">{issuer}</Text>
                ) : null}
              </View>

              <Pressable
                onPress={onClose}
                className="h-9 w-9 items-center justify-center rounded-full bg-white/10 active:opacity-70"
              >
                <X size={16} color="#ffffff" />
              </Pressable>
            </View>

            {description ? (
              <View className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <Text className="text-sm leading-6 text-gray-300">
                  {description}
                </Text>
              </View>
            ) : null}

            <View className="mt-4 gap-3">
              {level ? (
                <View className="flex-row items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <View className="flex-row items-center gap-3">
                    <Target size={17} color="#818cf8" />

                    <Text className="text-sm text-gray-400">Niveau</Text>
                  </View>

                  <Text className="text-sm font-bold text-white">{level}</Text>
                </View>
              ) : null}

              {earnedDate ? (
                <View className="flex-row items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <View className="flex-row items-center gap-3">
                    <Clock3 size={17} color="#a78bfa" />

                    <Text className="text-sm text-gray-400">Date</Text>
                  </View>

                  <Text className="text-sm font-semibold text-white">
                    {formatDate(earnedDate) ?? "Indisponible"}
                  </Text>
                </View>
              ) : null}
            </View>

            {typeof progress === "number" ? (
              <View className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-white">
                    Progression
                  </Text>

                  <Text className="text-sm font-bold text-indigo-300">
                    {Math.round(Math.min(100, Math.max(0, progress)))}%
                  </Text>
                </View>

                <View className="h-2 overflow-hidden rounded-full bg-white/10">
                  <View
                    className="h-full rounded-full bg-indigo-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, progress))}%`,
                    }}
                  />
                </View>
              </View>
            ) : null}

            <View className="mt-6 gap-3">
              <Pressable
                onPress={handleShare}
                className="flex-row items-center justify-center gap-2 rounded-2xl bg-white py-4 active:opacity-80"
              >
                <Share2 size={17} color="#050812" />

                <Text className="text-sm font-bold text-[#050812]">
                  Partager
                </Text>
              </Pressable>

              {completed ? (
                <Pressable
                  onPress={handleDownload}
                  className="flex-row items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] py-4 active:opacity-70"
                >
                  <Download size={17} color="#ffffff" />

                  <Text className="text-sm font-semibold text-white">
                    Télécharger
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function CertificationsContent() {
  const [tab, setTab] = useState<Tab>("Certifications");

  const [selectedCertificate, setSelectedCertificate] =
    useState<CertificateRecord | null>(null);

  const certificates = useQuery(api.education.getMyCertificates, {});

  const stats = useQuery(api.education.getEducationStats, {});

  const normalizedCertificates = useMemo<CertificateRecord[]>(
    () => (certificates ?? []) as CertificateRecord[],
    [certificates],
  );

  const certificateCount =
    getNumber(stats?.certificates) ?? normalizedCertificates.length;

  if (certificates === undefined) {
    return (
      <View className="flex-1 bg-[#050812] px-4 pt-12">
        <View className="mb-6 flex-row items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-2xl" />

          <View className="flex-1 gap-2">
            <Skeleton className="h-5 w-44 rounded-md" />
            <Skeleton className="h-3 w-32 rounded-md" />
          </View>
        </View>

        <Skeleton className="mb-4 h-44 w-full rounded-3xl" />

        <View className="mb-4 flex-row gap-2">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 flex-1 rounded-xl" />
        </View>

        <View className="gap-3">
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-36 w-full rounded-2xl" />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#050812]">
      <Header onBack={() => {}} certificateCount={certificateCount} />

      <OverviewCard certificateCount={certificateCount} />

      <View className="mx-4 mt-4 flex-row rounded-2xl border border-white/10 bg-white/[0.035] p-1">
        {TABS.map((item) => {
          const active = item === tab;

          return (
            <Pressable
              key={item}
              onPress={() => setTab(item)}
              className="flex-1 items-center justify-center rounded-xl py-2.5 active:opacity-70"
              style={{
                backgroundColor: active
                  ? "rgba(99,102,241,0.22)"
                  : "transparent",
              }}
            >
              <Text
                className="text-[11px] font-semibold"
                style={{
                  color: active ? "#c7d2fe" : "#6b7280",
                }}
              >
                {item}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        className="mt-3 flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {tab === "Certifications" ? (
          normalizedCertificates.length === 0 ? (
            <EmptyState
              icon={Award}
              title="Aucune certification"
              description="Vos certifications réellement enregistrées apparaîtront ici."
            />
          ) : (
            <View>
              {normalizedCertificates.map((certificate) => (
                <CertificateCard
                  key={certificate._id}
                  certificate={certificate}
                  onPress={() => setSelectedCertificate(certificate)}
                />
              ))}
            </View>
          )
        ) : null}

        {tab === "Badges" ? (
          <EmptyState
            icon={Medal}
            title="Badges indisponibles"
            description="Aucune source de données de badges réelle n'est actuellement connectée à ce module. Aucun badge fictif n'est affiché."
          />
        ) : null}

        {tab === "Classement" ? (
          <EmptyState
            icon={Users}
            title="Classement indisponible"
            description="Aucune source de classement réelle n'est actuellement connectée à ce module. Aucun classement fictif n'est affiché."
          />
        ) : null}
      </ScrollView>

      <CertificateDetailModal
        certificate={selectedCertificate}
        onClose={() => setSelectedCertificate(null)}
      />
    </View>
  );
}

export default function CertificationsPage({ onBack }: Props) {
  return (
    <View className="flex-1 bg-[#050812]">
      <Unauthenticated>
        <View className="flex-1 items-center justify-center px-6">
          <View className="h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
            <Lock size={28} color="rgba(255,255,255,0.28)" />
          </View>

          <Text className="mt-5 text-center text-base font-bold text-white">
            Parcours d'apprentissage
          </Text>

          <Text className="mt-2 max-w-sm text-center text-sm leading-5 text-gray-400">
            Connectez-vous pour accéder à vos certifications.
          </Text>

          <Pressable
            onPress={onBack}
            className="mt-6 flex-row items-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-4 py-3 active:opacity-70"
          >
            <ArrowLeft size={16} color="#9ca3af" />

            <Text className="text-sm font-medium text-gray-300">Retour</Text>
          </Pressable>
        </View>
      </Unauthenticated>

      <AuthLoading>
        <View className="flex-1 bg-[#050812] px-4 pt-12">
          <View className="mb-6 flex-row items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-2xl" />

            <View className="flex-1 gap-2">
              <Skeleton className="h-5 w-44 rounded-md" />
              <Skeleton className="h-3 w-32 rounded-md" />
            </View>
          </View>

          <Skeleton className="h-44 w-full rounded-3xl" />
        </View>
      </AuthLoading>

      <Authenticated>
        <View className="flex-1">
          <View className="absolute inset-0">
            <CertificationsContent />
          </View>

          {/* Overlay de navigation conservé au niveau parent. */}
          <View pointerEvents="box-none">
            <Pressable
              onPress={onBack}
              className="absolute left-4 top-12 h-11 w-11"
              style={{
                opacity: 0,
              }}
            />
          </View>
        </View>
      </Authenticated>
    </View>
  );
}
