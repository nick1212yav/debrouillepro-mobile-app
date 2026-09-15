import { View, Text } from "react-native";

// src/features/transport/components/LiveTrackingMap.tsx
import { motion } from "motion/react";
import { Navigation, Clock, ShieldCheck, MapPin } from "lucide-react-native";
import { useTracking } from "../hooks/useTracking";

interface LiveTrackingMapProps {
  bookingId: string;
  driverName?: string;
  vehiclePlate?: string;
}

export function LiveTrackingMap({
  bookingId,
  driverName = "Conducteur",
  vehiclePlate = "1234AB01",
}: LiveTrackingMapProps) {
  const { tracking, isLoading } = useTracking(bookingId);

  if (isLoading || !tracking) {
    return (
      <View className="h-64 w-full rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center"><Text className="text-xs text-white/40">Connexion au signal GPS du véhicule... [2]
        </Text></View>
    );
  }

  const progressPercent = Math.min(
    100,
    Math.round((1 - tracking.distanceRemainingKm / 5.1) * 100),
  );

  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4"><View className="flex items-center justify-between"><Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Suivi GPS en direct [2]
        </Text>{tracking.speedKmh > 0 ? (
          <View className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold"><Text className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /><Text>En mouvement •</Text>{tracking.speedKmh}<Text>km/h [2]</Text></View>
        ) : (
          <Text className="text-xs text-white/40">Arrivé à destination [2]
          </Text>
        )}</View>{}<View className="h-40 rounded-2xl overflow-hidden relative border border-white/10 bg-[#060814]"><svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 160">{}<path d="M 40,120 Q 150,20 260,110" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="4" strokeLinecap="round" /><path d="M 40,120 Q 150,20 260,110" fill="none" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 4" />{}<circle cx="40" cy="120" r="5" fill="#10B981" />{}<circle cx="260" cy="110" r="5" fill="#3B82F6" />{}{tracking.speedKmh > 0 && (
            <motion.g
              animate={{
                transform: [
                  "translate(40px, 120px)",
                  "translate(150px, 50px)",
                  "translate(260px, 110px)",
                ][Math.min(2, Math.floor(progressPercent / 34))],
              }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            >
              <circle
                r="12"
                fill="rgba(139, 92, 246, 0.3)"
                className="animate-ping"
              />
              <rect
                x="-8"
                y="-8"
                width="16"
                height="16"
                rx="4"
                fill="#8B5CF6"
                className="border border-white/10"
              />
              <Navigation
                size={10}
                className="text-white absolute -translate-x-1/2 -translate-y-1/2 left-0 top-0 rotate-45"
              />
            </motion.g>
          )}</svg>{}<View className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5 text-[10px] text-white/80 space-y-0.5"><Text className="font-bold">{driverName}</Text><Text className="font-mono text-white/50">{vehiclePlate}</Text></View><View className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5 text-[10px] text-white/80 flex items-center gap-1.5"><Clock size={12} className="text-violet-400" /><Text>Arrivée dans{" "}<strong className="text-violet-400 font-black">{tracking.etaMinutes}min
            </strong></Text></View></View>{}<View className="space-y-1.5"><View className="flex items-center justify-between text-[11px] text-white/40 font-bold"><Text>Distance : {tracking.distanceRemainingKm}km restants</Text><Text>Progression : {progressPercent}%</Text></View><View className="h-2 w-full rounded-full bg-white/5 overflow-hidden"><View className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full" style={{ width: `${progressPercent}%` }} transition={{ duration: 0.5, ease: "easeOut" }} /></View></View></View>
  );
}
