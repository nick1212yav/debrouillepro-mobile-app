import { View, Pressable, Text } from "react-native";

// src/features/transport/pages/TransportListPage.tsx
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ArrowLeft, Compass, ChevronRight, Car } from "lucide-react-native";
import { RouteCardSkeleton } from "../placeholders";
import { formatMobilityPrice } from "../utils/distance";

export default function TransportListPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Extraction des filtres
  const origin = searchParams.get("origin") || "";
  const destination = searchParams.get("destination") || "";
  const vehicleType = searchParams.get("type") || "";
  const maxPrice = searchParams.get("price")
    ? Number(searchParams.get("price"))
    : null;

  // ✅ Redirection vers api.transport.listTransportRoutes
  const rawRoutes = useQuery(api.transport.listTransportRoutes, {});
  const isLoading = rawRoutes === undefined;

  // Filtrage applicatif robuste
  const routes = rawRoutes
    ? rawRoutes.filter((route: any) => {
        if (
          origin &&
          !route.origin.toLowerCase().includes(origin.toLowerCase())
        )
          return false;
        if (
          destination &&
          !route.destination.toLowerCase().includes(destination.toLowerCase())
        )
          return false;
        if (vehicleType && route.vehicleType !== vehicleType) return false;
        if (maxPrice && route.pricePerSeat > maxPrice) return false;
        return true;
      })
    : [];

  return (
    <View className="h-full flex flex-col bg-gradient-to-b from-[#020412] to-[#040618] text-white">{}<View className="flex-shrink-0 px-4 pt-12 pb-3 flex items-center gap-3 border-b border-white/5 bg-[#070914]/40"><Pressable onPress={() => navigate(-1)} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5 transition-colors"><ArrowLeft size={18} className="text-white" /></Pressable><View><Text className="text-base font-black">Résultats de recherche [2]</Text><Text className="text-[9px] text-white/40">{routes.length}trajets correspondants [2]
          </Text></View></View>{}<View className="flex-1 overflow-y-auto px-4 py-5 space-y-4" style={{  }}>{isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <RouteCardSkeleton key={i} />)
        ) : routes.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-24 text-center gap-4"><Compass size={44} className="text-white/15 animate-spin-slow" /><View className="space-y-1"><Text className="text-white font-bold text-sm">Aucun trajet trouvé [2]
              </Text><Text className="text-xs text-white/40 max-w-xs leading-relaxed">Aucun conducteur ne correspond à ces critères d'itinéraires pour
                le moment [2].
              </Text></View></View>
        ) : (
          routes.map((route: any) => (
            <View key={route._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onPress={() => navigate(`/transport/${route._id}`)} className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] transition-all flex flex-col gap-4">
              <View className="flex items-start justify-between"><View className="flex gap-3"><View className="w-10 h-10 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400"><Car size={18} /></View><View><Text className="text-sm font-bold text-white">{route.origin}→ {route.destination}[2]
                    </Text><Text className="text-[9px] text-white/40 font-black uppercase tracking-wider mt-0.5">{route.vehicleType}• Départ à {route.departureTime}</Text></View></View><Text className="text-base font-black text-violet-400">{formatMobilityPrice(route.pricePerSeat, route.currency)}[2]
                </Text></View>

              <View className="flex items-center justify-between border-t border-white/5 pt-3 text-xs"><Text className="text-white/40">{route.seatsAvailable}places restantes
                </Text><View className="flex items-center gap-0.5 text-violet-400 font-bold"><Text>Réserver [2]</Text><ChevronRight size={14} /></View></View>
            </View>
          ))
        )}</View></View>
  );
}
