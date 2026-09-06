import { useRouter } from "expo-router";
import { UIService } from "@/core/sdk/ui/UIService";
import { View, Pressable, Text, TextInput } from "react-native";

// src/pages/modules/SantePage.tsx
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  ArrowLeft,
  Search,
  Calendar,
  Clock,
  ChevronRight,
  Phone,
  X,
  Plus,
  Pill,
  AlertTriangle,
  Activity,
  Loader2,
} from "lucide-react-native";
import { Authenticated, Unauthenticated } from "@/lib/convex-auth-compat";
import { SignInButton } from "@/components/ui/signin";
import { DoctorCard } from "@/features/sante/components";
import { useDoctors, useAppointments } from "@/features/sante/hooks";
import type { Id } from "@/convex/_generated/dataModel";
import type { Doctor, Appointment } from "@/features/sante/types";

type Tab = "medecins" | "rdv" | "medicaments" | "urgences";

export default function SantePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("medecins");
  const [search, setSearch] = useState("");

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { doctors, isLoading: doctorsLoading } = useDoctors({
    search: search || undefined,
  });

  const { appointments, isLoading: appointmentsLoading } = useAppointments();

  // ── Mutation ──────────────────────────────────────────────────────────────
  const bookAppointment = useMutation(api.health.bookAppointment);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleBook = async (
    doctorId: Id<"medicalProfessionals">,
    slot: string,
  ) => {
    try {
      await bookAppointment({
        professionalId: doctorId,
        slot,
        type: "consultation",
      });
      UIService.openToast("Rendez-vous confirmé !", "success");
    } catch {
      UIService.openToast("Erreur lors de la réservation", "error");
    }
  };

  const handleDoctorClick = (doctorId: Id<"medicalProfessionals">) => {
    router.push(`/sante/${doctorId}`);
  };

  const tabs = [
    { key: "medecins", label: "Médecins", icon: "👨‍⚕️" },
    { key: "rdv", label: "Mes RDV", icon: "📅" },
    { key: "medicaments", label: "Médicaments", icon: "💊" },
    { key: "urgences", label: "Urgences", icon: "🚨" },
  ] as const;

  return (
    <View
      className="h-full flex flex-col"
      style={{  }}
    >
      {/* Header */}
      <View
        className="px-5 pt-5 pb-3 flex-shrink-0"
      >
        <View className="flex items-center gap-3 mb-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5"
          >
            <ArrowLeft size={18} className="text-white" />
          </Pressable>
          <View>
            <Text className="text-xl font-bold text-white">Santé+</Text>
            <Text className="text-xs" style={{ color: "#EF4444" }}>
              RDV · Médicaments · Urgences
            </Text>
          </View>
          <Pressable className="ml-auto w-10 h-10 rounded-2xl flex items-center justify-center bg-red-500/15 border border-red-500/30">
            <Phone size={16} style={{ color: "#EF4444" }} />
          </Pressable>
        </View>

        {/* Tab bar */}
        <View
          className="flex gap-2 overflow-x-auto pb-1"
          style={{  }}
        >
          {tabs.map(({ key, label, icon }) => (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold cursor-pointer transition-all ${
                tab === key
                  ? "bg-gradient-to-r from-red-500 to-red-600 text-white"
                  : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
              }`}
            >
              {icon} {label}
            </Pressable>
          ))}
        </View>

        {tab === "medecins" && (
          <View className="flex items-center gap-2 px-4 py-3 rounded-2xl mt-3 bg-white/5 border border-white/10">
            <Search size={14} className="text-white/40" />
            <TextInput
              value={search}
              onChangeText={(text) => setSearch(text)}
              placeholder="Médecin, spécialité, symptôme..."
              className="flex-1 bg-transparent text-white placeholder:text-white/35 text-sm outline-none"
            />
            {search && (
              <Pressable onPress={() => setSearch("")} className="">
                <X size={12} className="text-white/30" />
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Content */}
      <View
        className="flex-1 overflow-y-auto px-5 pb-6"
        style={{  }}
      >
        {/* ── MÉDECINS ── */}
        {tab === "medecins" && (
          <View className="flex flex-col gap-4">
            <Pressable
              className="p-3 rounded-2xl flex items-center gap-3 bg-red-500/20 border border-red-500/30"
              onPress={() => router("/sante/emergency")}
            >
              <Text className="text-2xl">🚨</Text>
              <View className="flex-1">
                <Text className="text-xs font-bold text-red-300">
                  Urgence médicale ?
                </Text>
                <Text className="text-[10px] text-white/50">
                  Appeler le 15 · Téléconsultation immédiate
                </Text>
              </View>
              <ChevronRight size={14} className="text-white/40" />
            </Pressable>

            <Text className="text-xs font-semibold text-white/40 uppercase tracking-wider">
              {doctors?.length || 0} médecins disponibles
            </Text>

            {doctorsLoading ? (
              <View className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
              </View>
            ) : (
              doctors?.map((doctor: Doctor) => (
                <DoctorCard
                  key={doctor._id}
                  doctor={doctor}
                  slots={[]}
                  onSelect={() => handleDoctorClick(doctor._id)}
                  onBook={(slot) => handleBook(doctor._id, slot)}
                />
              ))
            )}
          </View>
        )}

        {/* ── RDV ── */}
        {tab === "rdv" && (
          <Authenticated>
            <RdvTab
              appointments={appointments ?? []}
              isLoading={appointmentsLoading}
            />
          </Authenticated>
        )}
        {tab === "rdv" && (
          <Unauthenticated>
            <View className="flex flex-col items-center py-12 gap-4">
              <Calendar size={40} className="text-white/20" />
              <Text className="text-white/50 text-sm">
                Connectez-vous pour voir vos rendez-vous
              </Text>
              <SignInButton />
            </View>
          </Unauthenticated>
        )}

        {/* ── MÉDICAMENTS ── */}
        {tab === "medicaments" && <MedicamentTab />}

        {/* ── URGENCES ── */}
        {tab === "urgences" && <UrgenceTab />}
      </View>
    </View>
  );
}

// ─── Sous-composants ─────────────────────────────────────────────────────────

function RdvTab({
  appointments,
  isLoading,
}: {
  appointments: Appointment[];
  isLoading?: boolean;
}) {
  const cancelAppointment = useMutation(api.health.cancelAppointment);

  const handleCancel = async (id: Id<"medicalAppointments">) => {
    try {
      await cancelAppointment({ id });
      UIService.openToast("Rendez-vous annulé", "success");
    } catch {
      UIService.openToast("Erreur", "error");
    }
  };

  if (isLoading) {
    return <Loader2 className="w-6 h-6 text-white/40 animate-spin mx-auto" />;
  }

  return (
    <View className="flex flex-col gap-3">
      <View className="flex items-center justify-between mb-1">
        <Text className="text-xs font-semibold text-white/40 uppercase tracking-wider">
          Vos rendez-vous
        </Text>
        <Text className="text-xs text-green-400">
          {appointments.filter((a) => a.status === "scheduled").length} à venir
        </Text>
      </View>
      {appointments.length === 0 ? (
        <View className="text-center py-8 text-white/40 text-sm">
          <Calendar size={32} className="mx-auto mb-3 opacity-30" />
          <Text>Aucun rendez-vous enregistré</Text>
          <Text className="text-xs mt-1">Réservez un créneau avec un médecin</Text>
        </View>
      ) : (
        appointments.map((appt) => (
          <View
            key={appt._id}
            className="rounded-2xl p-4 bg-white/5 border border-red-500/20"
          >
            <View className="flex items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <Activity size={18} className="text-red-400" />
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-sm font-bold text-white truncate">
                  {appt.doctorName}
                </Text>
                <Text className="text-xs text-red-400">{appt.doctorSpecialty}</Text>
              </View>
              <Text className="text-[9px] px-2 py-1 rounded-full font-medium text-green-300 bg-green-500/15">
                {appt.status === "scheduled" ? "À venir" : "Terminé"}
              </Text>
            </View>
            <View className="flex items-center gap-3 mt-3">
              <View className="flex items-center gap-1.5">
                <Calendar size={12} className="text-white/40" />
                <Text className="text-xs text-white/60">
                  {new Date(appt.date).toLocaleDateString("fr-FR")}
                </Text>
              </View>
              <Text className="text-[10px] px-2 py-0.5 rounded-lg bg-blue-500/15 text-blue-400">
                {appt.type === "teleconsultation" ? "📹 Vidéo" : "🏥 Cabinet"}
              </Text>
            </View>
            {appt.status === "scheduled" && (
              <Pressable
                onPress={() => handleCancel(appt._id)}
                className="mt-3 px-4 py-2 rounded-xl text-xs text-white/40 bg-white/5"
              >
                <Text>Annuler</Text></Pressable>
            )}
          </View>
        ))
      )}
    </View>
  );
}

function MedicamentTab() {
  return (
    <View className="flex flex-col gap-4 py-4">
      <View className="p-4 rounded-2xl text-center bg-amber-500/10 border border-amber-500/20">
        <Pill size={32} className="mx-auto mb-2 text-amber-400" />
        <Text className="text-white font-semibold text-sm">
          Carnet de médicaments
        </Text>
        <Text className="text-white/50 text-xs mt-1">
          Gérez vos ordonnances et rappels de doses
        </Text>
      </View>
      {[
        {
          name: "Paracétamol 500mg",
          dosage: "1 comprimé",
          frequency: "3x/jour",
          times: ["08:00", "13:00", "20:00"],
          stock: 24,
          stockAlert: 10,
          color: "#EF4444",
        },
        {
          name: "Amoxicilline 250mg",
          dosage: "1 gélule",
          frequency: "2x/jour",
          times: ["07:30", "19:30"],
          stock: 8,
          stockAlert: 5,
          color: "#F59E0B",
        },
        {
          name: "Vitamine C 1000mg",
          dosage: "1 comprimé",
          frequency: "1x/jour",
          times: ["08:00"],
          stock: 30,
          stockAlert: 5,
          color: "#10B981",
        },
      ].map((med, i) => (
        <View
          key={i}
          className="rounded-2xl p-4 bg-white/5 border border-[#EF4444]30"
        >
          <View className="flex items-start gap-3">
            <View
              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: med.color + "20" }}
            >
              <Pill size={18} style={{ color: med.color }} />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-sm font-bold text-white truncate">
                {med.name}
              </Text>
              <Text className="text-xs text-white/50">
                {med.dosage} · {med.frequency}
              </Text>
              <View className="flex gap-1.5 mt-1.5">
                {med.times.map((t) => (
                  <Text
                    key={t}
                    className="text-[10px] px-2 py-0.5 rounded-lg font-medium"
                    style={{ backgroundColor: med.color + "15", color: med.color }}
                  >
                    <Clock size={8} className="inline mr-0.5" />
                    {t}
                  </Text>
                ))}
              </View>
            </View>
            <View
              className="text-right text-xs"
              style={{  }}
            >
              {med.stock} <Text>unités</Text>{med.stock <= med.stockAlert && "⚠️"}
            </View>
          </View>
          <View className="mt-3">
            <View className="h-1.5 rounded-full overflow-hidden bg-white/10">
              <View
                className="h-full rounded-full"
                style={{ width: `${Math.min(100, (med.stock / 30) * 100)}%`, backgroundColor: med.stock <= med.stockAlert ? "#F59E0B" : med.color }}
              />
            </View>
          </View>
        </View>
      ))}
      <Pressable className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold bg-white/5 border border-dashed border-white/15 text-white/40">
        <Plus size={14} /> <Text>Ajouter un médicament</Text></Pressable>
    </View>
  );
}

function UrgenceTab() {
  const router = useRouter();
  const emergencyNumbers = [
    { label: "SAMU", number: "15", icon: "🚑", color: "#EF4444" },
    { label: "Pompiers", number: "18", icon: "🔥", color: "#F97316" },
    { label: "Police", number: "17", icon: "🚔", color: "#3B82F6" },
    { label: "Croix-Rouge", number: "1515", icon: "❤️", color: "#EF4444" },
  ];

  return (
    <View className="flex flex-col gap-4">
      <View
        className="p-4 rounded-3xl bg-red-500/25 border-2 border-red-500/40"
      >
        <Text className="text-base font-black text-white mb-1">
          🚨 Urgence immédiate
        </Text>
        <Text className="text-xs text-white/60 mb-3">
          En cas de danger vital, appelez immédiatement :
        </Text>
        <Pressable
          onPress={() => (undefined.href = "tel:15")}
          className="w-full py-3.5 rounded-2xl font-black text-base text-white bg-gradient-to-r from-red-500 to-red-700"
        >
          <Text>📞 Appeler le 15 (SAMU)</Text></Pressable>
      </View>

      <Text className="text-xs font-semibold text-white/40 uppercase tracking-wider">
        Numéros d'urgence
      </Text>
      <View className="gap-3">
        {emergencyNumbers.map((em, i) => (
          <Pressable
            key={em.label}
            onPress={() => (undefined.href = `tel:${em.number}`)}
            className="flex flex-col items-center gap-2 py-4 rounded-2xl"
            style={{ backgroundColor: em.color + "15", borderStyle: "solid" }}
          >
            <Text className="text-2xl">{em.icon}</Text>
            <Text className="text-sm font-black" style={{ color: em.color }}>
              {em.number}
            </Text>
            <Text className="text-[10px] text-white/50">{em.label}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={() => router("/sante/emergency")}
        className="mt-2 w-full py-3 rounded-xl bg-red-500/20 text-red-400 font-bold text-sm border border-red-500/30"
      >
        <Text>Voir tous les centres d'urgence</Text></Pressable>
    </View>
  );
}
