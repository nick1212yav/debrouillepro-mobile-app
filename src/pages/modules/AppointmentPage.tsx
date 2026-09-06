import { useRouter } from "expo-router";
import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, Image } from "react-native";
// src/pages/modules/AppointmentPage.tsx
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Activity,
  Video,
  Loader2,
} from "lucide-react-native";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { SignInButton } from "@/components/ui/signin";
import { Skeleton } from "@/components/ui/skeleton";
import type { Id } from "@/convex/_generated/dataModel";

export default function AppointmentPage() {
  const router = useRouter();
  const { isAuthenticated } = useFirebaseAuth();
  const [selectedDoctorId, setSelectedDoctorId] =
    useState<Id<"medicalProfessionals"> | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [type, setType] = useState<"consultation" | "teleconsultation">(
    "consultation",
  );
  const [isBooking, setIsBooking] = useState(false);

  const doctors = useQuery(api.health.listProfessionals, {});
  const availability = useQuery(
    api.health.getAvailability,
    selectedDoctorId ? { professionalId: selectedDoctorId } : "skip",
  );
  const bookAppointment = useMutation(api.health.bookAppointment);

  const handleBook = async () => {
    if (!selectedDoctorId || !selectedSlot) return;
    setIsBooking(true);
    try {
      await bookAppointment({
        professionalId: selectedDoctorId,
        slot: selectedSlot,
        type,
      });
      UIService.openToast("Rendez-vous confirmé !", "success");
      router("/sante");
    } catch {
      UIService.openToast("Erreur lors de la réservation", "error");
    } finally {
      setIsBooking(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <View
        className="h-full flex flex-col items-center justify-center px-4 gap-4"
        style={{  }}
      >
        <Text className="text-white font-bold text-xl">Connexion requise</Text>
        <Text className="text-white/50 text-sm">
          Connectez-vous pour prendre un rendez-vous
        </Text>
        <SignInButton />
        <Pressable
          onPress={() => router(-1)}
          className="text-white/40 text-sm"
        >
          <Text>← Retour</Text></Pressable>
      </View>
    );
  }

  return (
    <View
      className="h-full flex flex-col"
      style={{  }}
    >
      <View className="flex-shrink-0 px-4 pt-12 pb-3 flex items-center gap-3">
        <Pressable
          onPress={() => router(-1)}
          className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5"
        >
          <ArrowLeft size={20} className="text-white" />
        </Pressable>
        <Text className="text-white font-bold text-lg">Prendre rendez-vous</Text>
      </View>

      <View
        className="flex-1 overflow-y-auto px-4 pb-8 space-y-4"
        style={{  }}
      >
        {/* Sélection du médecin */}
        <View>
          <Text className="text-white/60 text-xs font-medium mb-2">
            Choisir un médecin
          </Text>
          {doctors === undefined ? (
            <Skeleton className="h-16 rounded-xl" />
          ) : (
            doctors.map((doc: any) => (
              <Pressable
                key={doc._id}
                onPress={() => setSelectedDoctorId(doc._id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl mb-2 transition-colors ${
                  selectedDoctorId === doc._id
                    ? "bg-red-500/20 border border-red-500/40"
                    : "bg-white/5 border border-white/10 hover:bg-white/10"
                }`}
              >
                <Image
                 
                 
                  className="w-10 h-10 rounded-xl object-cover"
                 source={{ uri: doc.images?.[0] }} accessibilityLabel={doc.name}/>
                <View className="flex-1 text-left">
                  <Text className="text-white font-medium text-sm">{doc.name}</Text>
                  <Text className="text-white/40 text-xs">{doc.specialty}</Text>
                </View>
                <Text className="text-xs text-white/30">{doc.distance}</Text>
              </Pressable>
            ))
          )}
        </View>

        {/* Créneaux */}
        {selectedDoctorId && (
          <View>
            <Text className="text-white/60 text-xs font-medium mb-2">
              Choisir un créneau
            </Text>
            {availability === undefined ? (
              <Skeleton className="h-16 rounded-xl" />
            ) : (
              <View className="flex flex-wrap gap-2">
                {(availability?.slots || []).map((slot: string) => (
                  <Pressable
                    key={slot}
                    onPress={() => setSelectedSlot(slot)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      selectedSlot === slot
                        ? "bg-red-500/20 text-red-400 border border-red-500/40"
                        : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {slot}
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Type de consultation */}
        {selectedSlot && (
          <View>
            <Text className="text-white/60 text-xs font-medium mb-2">
              Type de consultation
            </Text>
            <View className="flex gap-2">
              {(["consultation", "teleconsultation"] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setType(t)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    type === t
                      ? "bg-red-500/20 text-red-400 border border-red-500/40"
                      : "bg-white/5 text-white/40 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  {t === "consultation" ? (
                    <Activity size={14} />
                  ) : (
                    <Video size={14} />
                  )}
                  {t === "consultation" ? "Cabinet" : "Vidéo"}
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Bouton de confirmation */}
        {selectedSlot && (
          <Pressable
            onPress={handleBook}
            disabled={isBooking}
            className="w-full py-3.5 rounded-2xl font-bold text-white bg-gradient-to-r from-red-500 to-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isBooking ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "Confirmer le rendez-vous"
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}
