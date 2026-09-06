import { useLocalSearchParams, useRouter } from "expo-router";
import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, Image, Linking } from "react-native";

// src/pages/modules/SanteDetailPage.tsx
import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Loader2,
  ArrowLeft,
  Heart,
  Calendar,
  X,
  Activity,
  Video,
} from "lucide-react-native";

import {
  DoctorHeader,
  DoctorAvailability,
  DoctorSchedule,
  DoctorBiography,
  DoctorSpecialities,
  DoctorEducation,
  DoctorExperience,
  DoctorLanguages,
  DoctorCertificates,
  DoctorAwards,
  DoctorInsurance,
  DoctorFees,
  DoctorStatistics,
  DoctorCall,
  DoctorVideoCall,
  DoctorChat,
  DoctorWhatsApp,
  DoctorEmail,
  DoctorWebsite,
  DoctorLocation,
  DoctorMap,
  DoctorDirections,
  DoctorReviews,
  DoctorReviewStats,
  DoctorQuestions,
  DoctorCommunity,
  DoctorFollowers,
  DoctorArticles,
  DoctorVideos,
  DoctorStories,
  DoctorRecommendations,
  DoctorNearbyHospitals,
  DoctorNearbyPharmacies,
  DoctorNearbyLabs,
  DoctorNearbyClinics,
  DoctorMedicalRecords,
  DoctorPrescription,
  DoctorVaccination,
  DoctorLabResults,
  DoctorImaging,
  DoctorAIAssistant,
  DoctorSymptomChecker,
  DoctorTreatmentAdvisor,
  DoctorEmergency,
  StickyAppointmentBar,
  HealthGallery,
  HealthBadges,
} from "@/features/sante/components";

import {
  useDoctor,
  useDoctorAvailability,
  useDoctorReviews,
  useDoctorQuestions,
  useDoctorFollowers,
  useDoctorArticles,
  useDoctorVideos,
  useDoctorStories,
} from "@/features/sante/hooks";

import type { Id } from "@/convex/_generated/dataModel";
import type { Doctor, Review, Question } from "@/features/sante/types";

export default function SanteDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const rawId = id || null;

  // ── États locaux ───────────────────────────────────────────────────────────
  const [showBooking, setShowBooking] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // ── Hooks ──────────────────────────────────────────────────────────────────
  // 1. Récupération de la fiche médecin principale (gère les strings et les publications)
  const { doctor, isLoading } = useDoctor(rawId);

  // 2. Résolution d'ID pour les requêtes secondaires (évite d'envoyer un ID de publication invalide)
  const resolvedDoctorId = doctor?._id ?? null;

  // 3. Les requêtes secondaires reçoivent l'ID validé ou passent en mode "skip"
  const { availability } = useDoctorAvailability(resolvedDoctorId);
  const { reviews } = useDoctorReviews(resolvedDoctorId);
  const { questions } = useDoctorQuestions(resolvedDoctorId);
  const { followers, toggleFollow: toggleFollowFromHook } =
    useDoctorFollowers(resolvedDoctorId);
  const { articles } = useDoctorArticles(resolvedDoctorId);
  const { videos } = useDoctorVideos(resolvedDoctorId);
  const { stories } = useDoctorStories(resolvedDoctorId);

  const bookAppointment = useMutation(api.health.bookAppointment);

  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (doctor) {
      setIsLiked(doctor.isLiked || false);
      setIsFollowing(doctor.isFollowing || false);
    }
  }, [doctor]);

  // Redirection automatique de l'URL si l'ID d'origine provient de la table 'publications' [1]
  useEffect(() => {
    if (doctor && doctor._id !== id) {
      router(`/sante/${doctor._id}`, { replace: true });
    }
  }, [doctor, id, router]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleBook = async (slot: string) => {
    if (!doctor) return;
    try {
      await bookAppointment({
        professionalId: doctor._id,
        slot,
        type: "consultation",
      });
      UIService.openToast("Rendez-vous confirmé !", "success");
      setShowBooking(false);
    } catch {
      UIService.openToast("Erreur lors de la réservation", "error");
    }
  };

  const handleToggleFollow = async () => {
    try {
      const result = await toggleFollowFromHook();
      const followed = result?.followed ?? false;
      setIsLiked(followed);
      setIsFollowing(followed);
      UIService.openToast(followed ? "Suivi ajouté" : "Suivi retiré", "success");
    } catch {
      UIService.openToast("Erreur", "error");
    }
  };

  const handleCall = () => {
    if (doctor?.phone) {
      undefined.href = `tel:${doctor.phone}`;
    } else {
      UIService.openToast("Numéro non disponible", "info");
    }
  };

  const handleVideoCall = () => {
    if (doctor?.videoUrl) {
      Linking.openURL(String(doctor.videoUrl));
    } else {
      UIService.openToast("Lien de visio non disponible", "info");
    }
  };

  const handleChat = () => {
    if (doctor) {
      router.push(`/messages/new?userId=${doctor.userId}`);
    }
  };

  const handleEmergency = () => {
    router("/sante/emergency");
  };

  // ✅ Rendu du chargement pendant que l'appel d'API est actif
  if (isLoading) {
    return (
      <View
        className="h-full flex items-center justify-center"
        style={{  }}
      >
        <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
      </View>
    );
  }

  // ✅ Affichage alternatif sans crash ni chargement infini si aucun médecin n'est retourné [1.1.1]
  if (!doctor) {
    return (
      <View
        className="h-full flex flex-col items-center justify-center gap-4 px-6 text-center"
        style={{  }}
      >
        <View className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-2">
          <X className="text-white/40" size={24} />
        </View>
        <Text className="text-white/60 text-sm max-w-xs leading-relaxed">
          Ce médecin est introuvable ou son profil n'est pas encore configuré.
        </Text>
        <Pressable
          onPress={() => router(-1)}
          className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-white/5 text-white/80"
        >
          <Text>Retourner au flux</Text></Pressable>
      </View>
    );
  }

  const doctorForBar = { ...doctor, id: doctor._id };

  // Adaptation des données pour les composants
  const articlesWithId = (articles || []).map((a: any) => ({
    ...a,
    id: a._id,
  }));
  const videosWithId = (videos || []).map((v: any) => ({
    ...v,
    id: v._id,
  }));
  const storiesWithId = (stories || []).map((s: any) => ({
    ...s,
    id: s._id,
    image: s.mediaUrl || s.image,
    date: s.date || s.createdAt,
    viewed: s.viewed || false,
  }));

  return (
    <View
      className="h-full flex flex-col"
      style={{  }}
    >
      {/* Header */}
      <View className="flex-shrink-0 px-4 pt-12 pb-3 flex items-center gap-3">
        <Pressable
          onPress={() => router(-1)}
          className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5"
        >
          <ArrowLeft size={20} className="text-white" />
        </Pressable>
        <Text className="text-white font-bold text-lg flex-1 truncate">
          {doctor.name}
        </Text>
        <View className="flex items-center gap-1.5">
          <Pressable
            onPress={handleToggleFollow}
            className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5"
          >
            <Heart
              size={18}
              className={
                isLiked ? "fill-red-500 text-red-500" : "text-white/60"
              }
            />
          </Pressable>
          <Pressable
            onPress={() => setShowBooking(true)}
            className="w-10 h-10 rounded-2xl flex items-center justify-center bg-red-500/20"
          >
            <Calendar size={18} className="text-red-400" />
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <View
        className="flex-1 overflow-y-auto px-4 pb-8 space-y-5"
        style={{  }}
      >
        <View
          className="space-y-5"
        >
          <HealthGallery images={doctor.images || []} title={doctor.name} />
          <DoctorHeader
            doctor={doctor}
            onCall={handleCall}
            onVideoCall={handleVideoCall}
            onChat={handleChat}
            onBooking={() => setShowBooking(true)}
          />
          <HealthBadges badges={doctor.badges || []} />
          <DoctorAvailability
            available={String(availability?.available ?? "Aujourd'hui")}
            slots={availability?.slots || []}
            waitTime={availability?.waitTime}
            onSelectSlot={setSelectedSlot}
          />
          <DoctorSchedule
            schedule={doctor.schedule || "Lun-Ven 09:00 - 18:00"}
          />
          <DoctorBiography bio={doctor.bio || ""} />
          <DoctorSpecialities specialities={doctor.specialities || []} />
          <DoctorEducation education={doctor.education || []} />
          <DoctorExperience experience={doctor.experience || 0} />
          <DoctorLanguages languages={doctor.languages || []} />
          <DoctorCertificates certificates={doctor.certificates || []} />
          <DoctorAwards awards={doctor.awards || []} />
          <DoctorInsurance insurances={doctor.insurances || []} />
          <DoctorFees fees={doctor.fees} currency={doctor.currency} />
          <DoctorStatistics
            patients={doctor.patients || 0}
            appointments={doctor.appointments || 0}
            yearsExperience={doctor.experience || 0}
          />
          <DoctorLocation
            address={doctor.address || ""}
            city={doctor.city || ""}
            country={doctor.country || ""}
            latitude={doctor.coordinates?.lat}
            longitude={doctor.coordinates?.lng}
          />
          <DoctorMap
            latitude={doctor.coordinates?.lat}
            longitude={doctor.coordinates?.lng}
            name={doctor.name}
            address={doctor.address}
          />
          <DoctorDirections
            latitude={doctor.coordinates?.lat}
            longitude={doctor.coordinates?.lng}
            address={doctor.address}
          />
          <View className="flex flex-wrap gap-2">
            <DoctorCall onCall={handleCall} phone={doctor.phone} />
            <DoctorVideoCall
              onVideoCall={handleVideoCall}
              url={doctor.videoUrl}
            />
            <DoctorChat onChat={handleChat} userId={doctor.userId} />
            <DoctorWhatsApp phone={doctor.phone} />
            <DoctorEmail email={doctor.email} />
            <DoctorWebsite url={doctor.website} />
          </View>

          <DoctorReviews
            reviews={(reviews || []) as any}
            averageRating={doctor.rating}
            onAddReview={() => {}}
            onLikeReview={() => {}}
          />
          <DoctorReviewStats reviews={(reviews || []) as any} />
          <DoctorQuestions
            questions={(questions || []) as any}
            onAsk={() => {}}
            onAnswer={() => {}}
          />
          <DoctorCommunity
            reviews={reviews?.length || 0}
            questions={questions?.length || 0}
            followers={followers?.length || 0}
          />

          <DoctorArticles articles={articlesWithId} />
          <DoctorVideos videos={videosWithId} />
          <DoctorStories stories={storiesWithId} />

          <DoctorRecommendations professionals={[]} />
          <DoctorNearbyHospitals hospitals={[]} />
          <DoctorNearbyPharmacies pharmacies={[]} />
          <DoctorNearbyLabs labs={[]} />
          <DoctorNearbyClinics clinics={[]} />
          <DoctorMedicalRecords records={[]} />
          <DoctorPrescription prescriptions={[]} />
          <DoctorVaccination vaccinations={[]} />
          <DoctorLabResults results={[]} />
          <DoctorImaging images={[]} />
          <DoctorAIAssistant doctorId={doctor._id} />
          <DoctorSymptomChecker
            symptoms={[]}
            onCheck={async () => ({
              condition: "",
              urgency: "low",
              advice: "",
            })}
          />
          <DoctorTreatmentAdvisor doctorId={doctor._id} />
          <DoctorEmergency onEmergency={handleEmergency} />
        </View>
      </View>

      <StickyAppointmentBar
        doctor={doctorForBar}
        onBooking={() => setShowBooking(true)}
        onCall={handleCall}
        onVideoCall={handleVideoCall}
        onChat={handleChat}
        onEmergency={handleEmergency}
      />

      <>
        {showBooking && (
          <DoctorBookingModal
            doctor={doctor}
            slots={availability?.slots || []}
            onClose={() => setShowBooking(false)}
            onConfirm={handleBook}
          />
        )}
      </>
    </View>
  );
}

// ─── DoctorBookingModal ──────────────────────────────────────────────────────

function DoctorBookingModal({ doctor, slots, onClose, onConfirm }: any) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [type, setType] = useState<"consultation" | "teleconsultation">(
    "consultation",
  );
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!selectedSlot) return;
    setLoading(true);
    await onConfirm(selectedSlot);
    setLoading(false);
  };

  return (
    <>
      <Pressable
        onPress={onClose}
        className="fixed inset-0 z-40 bg-black/70"
      />
      <View
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto bg-[#0d0d20] border border-white/10"
      >
        <View className="flex justify-center pt-1">
          <View className="w-10 h-1 rounded-full bg-white/20" />
        </View>
        <View className="flex items-center justify-between mb-4">
          <Text className="text-white font-bold text-lg">Prendre rendez-vous</Text>
          <Pressable
            onPress={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5"
          >
            <X size={16} className="text-white/50" />
          </Pressable>
        </View>

        <View className="flex items-center gap-3 p-3 rounded-2xl mb-4 bg-red-500/10 border border-red-500/20">
          <Image
           
           
            className="w-10 h-10 rounded-xl object-cover"
           source={{ uri: doctor.images?.[0] }} accessibilityLabel={doctor.name}/>
          <View>
            <Text className="text-sm font-bold text-white">{doctor.name}</Text>
            <Text className="text-xs text-red-400">{doctor.specialty}</Text>
          </View>
          <Text className="ml-auto text-sm font-black text-white">
            {doctor.fees} {doctor.currency}
          </Text>
        </View>

        <Text className="text-xs text-white/40 mb-2">Choisir un créneau</Text>
        <View className="flex gap-2 flex-wrap mb-4">
          {slots.map((slot: string) => (
            <Pressable
              key={slot}
              onPress={() => setSelectedSlot(slot)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer active:scale-95 transition-colors ${selectedSlot === slot ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"}`}
            >
              {slot}
            </Pressable>
          ))}
        </View>

        <Text className="text-xs text-white/40 mb-2">Type de consultation</Text>
        <View className="flex gap-2 mb-5">
          {(["consultation", "teleconsultation"] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${type === t ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-white/5 text-white/40 border border-white/10 hover:bg-white/10"}`}
            >
              {t === "consultation" ? (
                <>
                  <Activity size={12} /> Cabinet
                </>
              ) : (
                <>
                  <Video size={12} /> Vidéo
                </>
              )}
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={handleConfirm}
          disabled={!selectedSlot || loading}
          className="w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50 bg-gradient-to-r from-red-500 to-red-600"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            "Confirmer le rendez-vous"
          )}
        </Pressable>
      </View>
    </>
  );
}
