import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable } from "react-native";

// src/features/events/components/EventTickets.tsx
import { useState } from "react";
import { Ticket, CheckCircle, QrCode, Users, Clock } from "lucide-react-native";
import type { Event } from "../types";

interface Props {
  event: Event;
  onPurchase?: () => void;
}

export function EventTickets({ event, onPurchase }: Props) {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchased, setPurchased] = useState(false);

  const handlePurchase = async () => {
    setIsPurchasing(true);
    try {
      // Simuler l'achat (à remplacer par une mutation Convex)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setPurchased(true);
      UIService.openToast("Billet acheté !", "success");
      onPurchase?.();
    } catch {
      UIService.openToast("Erreur lors de l'achat", "error");
    } finally {
      setIsPurchasing(false);
    }
  };

  const placesLeft = event.maxAttendees
    ? event.maxAttendees - event.attendingCount
    : "Illimité";

  return (
    <View className="space-y-4">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">
        Billets
      </Text>

      <View
        className="rounded-2xl p-5"
        style={{ borderWidth: 1, borderColor: "rgba(139,92,246,0.15)", borderStyle: "solid" }}
      >
        {purchased ? (
          <View
            className="text-center py-6"
          >
            <View
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: "rgba(16,185,129,0.2)" }}
            >
              <CheckCircle size={32} className="text-green-400" />
            </View>
            <Text className="text-white font-bold text-lg">Billet confirmé !</Text>
            <Text className="text-white/50 text-sm">
              Vous êtes prêt pour l'événement
            </Text>
            <Pressable
              className="mt-4 px-6 py-2 rounded-xl text-sm font-bold text-white"
              style={{  }}
            >
              <Text>Voir mon billet</Text></Pressable>
          </View>
        ) : (
          <>
            <View className="flex items-center justify-between mb-4">
              <View>
                <Text className="text-white font-bold text-2xl">
                  {event.isFree ? "Gratuit" : event.price || "—"}
                </Text>
                <Text className="text-white/40 text-xs">par personne</Text>
              </View>
              <View className="text-right">
                <View className="flex items-center gap-1 justify-end">
                  <Users size={14} className="text-purple-400" />
                  <Text className="text-white font-semibold">
                    {event.attendingCount}
                  </Text>
                </View>
                <Text className="text-white/40 text-xs">
                  {typeof placesLeft === "number"
                    ? `${placesLeft} places restantes`
                    : "Places illimitées"}
                </Text>
              </View>
            </View>

            {/* Capacité */}
            {event.maxAttendees && (
              <View className="mb-4">
                <View className="flex justify-between text-xs text-white/40 mb-1">
                  <Text>Places disponibles</Text>
                  <Text>
                    {Math.round(
                      (event.attendingCount / event.maxAttendees) * 100,
                    )}
                    %
                  </Text>
                </View>
                <View
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                >
                  <View
                    className="h-full rounded-full"
                    style={{  }}
                  />
                </View>
              </View>
            )}

            <Pressable
              onPress={handlePurchase}
              disabled={isPurchasing}
              className="w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
              style={{  }}
            >
              {isPurchasing ? (
                <>
                  <Text className="animate-spin"><Text>⏳</Text></Text>
                  <Text>Traitement...</Text></>
              ) : (
                <>
                  <Ticket size={18} />
                  {event.isFree ? "Réserver ma place" : "Acheter mon billet"}
                </>
              )}
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}
