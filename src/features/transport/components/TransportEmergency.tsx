import { Text, Pressable, View, Linking } from "react-native";

// src/features/transport/components/TransportEmergency.tsx
import { useState } from "react";
import {
  AlertOctagon,
  ShieldAlert,
  PhoneCall,
  Users,
  Loader2,
  X,
} from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TransportEmergencyProps {
  currentCoords?: { lat: number; lng: number };
  driverName?: string;
  vehiclePlate?: string;
}

export function TransportEmergency({
  currentCoords,
  driverName,
  vehiclePlate,
}: TransportEmergencyProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAlerting, setIsLoading] = useState(false);

  const triggerEmergencyAlert = async () => {
    setIsLoading(true);
    // Simulation d'envoi de détresse avec localisation GPS aux serveurs d'assistance et contacts d'urgence [2]
    setTimeout(() => {
      setIsLoading(false);
      setIsOpen(false);
      toast.error(
        "🚨 Alerte SOS envoyée. Vos coordonnées GPS et les détails du véhicule ont été transmis à l'assistance DébrouillePro [2].",
      );
    }, 2000);
  };

  return (
    <>
      {/* Bouton SOS flottant */}
      <Button
        onPress={() => setIsOpen(true)}
        className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
      >
        <AlertOctagon size={20} className="animate-pulse" />
      </Button>

<View>
        {isOpen && (
          <>
            {/* Overlay */}
            <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onPress={() => setIsOpen(false)} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md" />

            {/* Modal d'urgence */}
            <View initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm p-6 rounded-3xl border border-red-500/20 bg-[#0e0202] text-center space-y-6 shadow-2xl">
              <View className="flex justify-end -mt-2 -mr-2">
                <Pressable onPress={() => setIsOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5">
                  <X size={14} className="text-white/50" />
                </Pressable>
              </View>

              <View className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500 shadow-inner">
                <ShieldAlert size={28} className="animate-bounce" />
              </View>

              <View className="space-y-1.5">
                <Text className="text-white font-black text-lg">Centre d'Urgence SOS [2]
                </Text>
                <Text className="text-xs text-white/50 leading-relaxed max-w-xs mx-auto">
                  En cas de danger immédiat, déclenchez l'alerte. Votre position
                  GPS en direct sera partagée avec les autorités et vos proches
                  [2].
                </Text>
              </View>

              {/* Détails de suivi matériel */}
              {currentCoords && (
                <View className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 text-[11px] font-mono text-white/40 text-left space-y-1">
                  <Text>
                    📍 GPS : {currentCoords.lat.toFixed(5)},{" "}
                    {currentCoords.lng.toFixed(5)}
                  </Text>
                  {driverName && <Text>👤 Conducteur : {driverName}</Text>}
                  {vehiclePlate && <Text>🚗 Immatriculation : {vehiclePlate}</Text>}
                </View>
              )}

              {/* Bouton SOS déclencheur */}
              <Pressable onPress={triggerEmergencyAlert} disabled={isAlerting} className="w-full py-4 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-red-600 to-red-700 shadow-[0_4px_30px_rgba(239,68,68,0.4)] active:scale-95 transition-transform flex items-center justify-center gap-2">
                {isAlerting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Déclencher l'alerte immédiate [2]"
                )}
              </Pressable>

              {/* Raccourci vers numéros nationaux */}
              <View className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-white/50">
                <Pressable onPress={() => Linking.openURL("tel:112")} className="flex items-center gap-1.5 transition-colors">
                  <PhoneCall size={12} className="text-red-400" />
                  <Text>Police (112)</Text>
                </Pressable>
                <Pressable onPress={() => Linking.openURL("tel:118")} className="flex items-center gap-1.5 transition-colors">
                  <Users size={12} className="text-red-400" />
                  <Text>Contacts SOS [2]</Text>
                </Pressable>
              </View>
            </View>
          </>
        )}
      </View>
    </>
  );
}
