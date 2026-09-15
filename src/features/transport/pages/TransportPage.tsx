import { View, Pressable, Text } from "react-native";

// src/features/transport/pages/TransportPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from "@/lib/convex-auth-compat";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import {
  ArrowLeft,
  X,
  Car,
  Users,
  Shield,
  Coins,
  Compass,
  ChevronRight,
} from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { TransportForm } from "../forms/TransportForm";
// ✅ Réalignement de l'import vers le validateur unifié [1]
import { type TransportRouteFormValues } from "../validators/transport.validator";
import { formatMobilityPrice } from "../utils/distance";

type TransportMode = "all" | "my-bookings";

export default function TransportPage({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TransportMode>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null);

  // Queries & Mutations
  const createRoute = useMutation(api.transport.createTransportRoute);
  const myBookings = useQuery(api.transport.listTransportBookings, {});
  const routes = useQuery(api.transport.listTransportRoutes, {});
  const isLoading = routes === undefined;

  const filteredRoutes =
    routes && filterType
      ? routes.filter((r: any) => r.vehicleType === filterType)
      : routes || [];

  // ✅ Utilisation du type de formulaire correct [1]
  const handleCreateRoute = async (values: TransportRouteFormValues) => {
    try {
      await createRoute(values);
      toast.success("Trajet publié ! [2]");
      setShowCreate(false);
    } catch {
      toast.error("Une erreur s'est produite lors de la publication.");
    }
  };

  return (
    <>
      <AuthLoading>
        <View className="h-full flex flex-col items-center justify-center bg-[#02040c] gap-4"><Loader2 className="w-8 h-8 text-violet-500 animate-spin" /></View>
      </AuthLoading>

      <Unauthenticated>
        <View className="h-full flex flex-col items-center justify-center gap-4 px-6 text-center bg-[#02040c]"><Pressable onPress={onBack} className="self-start w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5 transition-colors mb-4"><ArrowLeft size={18} className="text-white" /></Pressable><Car size={48} className="text-white/20" /><Text className="text-white font-bold text-lg">Connectez-vous [2]</Text><Text className="text-white/40 text-sm">Proposez des trajets, voyagez en covoiturage et réservez vos
            transports [2].
          </Text><SignInButton /></View>
      </Unauthenticated>

      <Authenticated>
        <View className="h-full flex flex-col bg-[#02040c] text-white">{}<View className="flex-shrink-0 px-4 pt-12 pb-3 flex items-center justify-between gap-3 border-b border-white/5 bg-[#070914]/40"><View className="flex items-center gap-3"><Pressable onPress={onBack} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5 transition-colors"><ArrowLeft size={18} className="text-white" /></Pressable><View><Text className="text-lg font-black">Transport Pro [2]</Text><Text className="text-[10px] text-violet-400 font-bold uppercase tracking-wider">Mobilité panafricaine [2]
                </Text></View></View><Button onPress={() => setShowCreate(true)} className="h-9 px-4 rounded-xl text-xs font-black bg-gradient-to-r from-violet-600 to-indigo-600">+ Proposer [2]
            </Button></View>{}<View className="flex-shrink-0 px-4 py-3 flex gap-2 overflow-x-auto" style={{  }}>{[
              { id: null, label: "Tous [2]" },
              { id: "voiture", label: "Covoiturage" },
              { id: "taxi", label: "Taxi" },
              { id: "moto", label: "Moto-Taxi" },
              { id: "bus", label: "Bus" },
            ].map((f) => (
              <Pressable key={f.id || "all"} onPress={() => setFilterType(f.id)} className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer ${filterType === f.id ? "bg-violet-500/20 text-violet-300 border-violet-500/30" : "bg-white/5 text-white/50 border-white/5 hover:bg-white/10"}`}>{f.label}</Pressable>
            ))}</View>{}<View className="flex-shrink-0 px-4 py-2 border-b border-white/5 flex gap-2"><Pressable onPress={() => setActiveTab("all")} className={`flex-1 py-2 rounded-2xl text-xs font-black transition-colors ${activeTab === "all" ? "bg-white/5 text-white" : "text-white/40 hover:text-white/60"}`}><Text>Trajets disponibles [2]</Text></Pressable><Pressable onPress={() => setActiveTab("my-bookings")} className={`flex-1 py-2 rounded-2xl text-xs font-black transition-colors ${activeTab === "my-bookings" ? "bg-white/5 text-white" : "text-white/40 hover:text-white/60"}`}><Text>Mes réservations [2]</Text></Pressable></View>{}<View className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{  }}><View>{activeTab === "all" ? (
                <View key="all-routes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  {isLoading &&
                    Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton
                        key={i}
                        className="h-32 w-full rounded-3xl bg-white/5"
                      />
                    ))}

                  {!isLoading && filteredRoutes.length === 0 && (
                    <View className="flex flex-col items-center justify-center py-20 text-center gap-3"><Compass size={40} className="text-white/10 animate-spin-slow" /><Text className="text-white/40 text-sm">Aucun itinéraire disponible avec ces critères [2].
                      </Text></View>
                  )}

                  {filteredRoutes.map((route: any) => (
                    <View key={route._id} onPress={() => navigate(`/transport/${route._id}`)} className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] flex flex-col gap-4 transition-colors">
                      <View className="flex items-start justify-between"><View className="flex gap-3"><View className="w-10 h-10 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400"><Car size={18} /></View><View><Text className="text-sm font-bold text-white">{route.origin}→ {route.destination}[2]
                            </Text><Text className="text-[10px] text-white/40 font-semibold uppercase mt-0.5">{route.vehicleType}· {route.departureTime}</Text></View></View><Text className="text-base font-black text-violet-400">{formatMobilityPrice(
                            route.pricePerSeat,
                            route.currency,
                          )}{" "}[2]
                        </Text></View>

                      <View className="flex items-center justify-between border-t border-white/5 pt-3 text-xs"><Text className="text-white/50">{route.seatsAvailable}places libres
                        </Text><View className="flex items-center gap-1 text-violet-400 font-bold"><Text>Voir le trajet [2]</Text><ChevronRight size={14} /></View></View>
                    </View>
                  ))}
                </View>
              ) : (
                <View key="my-bookings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  {myBookings === undefined &&
                    Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton
                        key={i}
                        className="h-24 w-full rounded-2xl bg-white/5"
                      />
                    ))}

                  {myBookings?.length === 0 && (
                    <View className="flex flex-col items-center justify-center py-20 text-center gap-3"><Users size={40} className="text-white/10" /><Text className="text-white/40 text-sm">Vous n'avez pas encore effectué de réservation [2].
                      </Text></View>
                  )}

                  {myBookings?.map((b: any) => (
                    <View key={b._id} className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] flex items-center justify-between animate-fade-in"><View><Text className="text-sm font-bold text-white">{b.origin || "Trajet réservé"}→{" "}{b.destination || "..."}</Text><Text className="text-xs text-white/40 mt-1">{b.departureTime}· {b.seats}place(s)
                        </Text></View><View className="text-right"><Text className="text-base font-black text-violet-400">{formatMobilityPrice(b.totalAmount, b.currency)}[2]
                        </Text><Text className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{b.status}</Text></View></View>
                  ))}
                </View>
              )}</View></View>{}<View className="flex-shrink-0 px-4 py-3 border-t border-white/5 flex items-center justify-between bg-[#070914]/20 text-[10px] text-white/30 font-semibold"><View className="flex items-center gap-1.5"><Shield size={11} className="text-violet-400" /><Text>Chauffeurs vérifiés [2]</Text></View><View className="flex items-center gap-1.5"><Coins size={11} className="text-violet-400" /><Text>Paiement Mobile Money [2]</Text></View></View></View>
      </Authenticated>

      {/* Proposition de Trajet Sheet */}
<View>
        {showCreate && (
          <View className="fixed inset-0 z-50 overflow-hidden flex items-end">
            <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onPress={() => setShowCreate(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="relative w-full max-h-[90vh] overflow-y-auto rounded-t-[32px] p-6 bg-[#0c0d1e] border-t border-white/10">
              <View className="flex justify-center mb-2">
                <View className="w-10 h-1 rounded-full bg-white/20" />
              </View>
              <View className="flex items-center justify-between mb-6">
                <Text className="text-white font-black text-lg">Proposer un Trajet [2]
                </Text>
                <Pressable onPress={() => setShowCreate(false)} className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5">
                  <X size={16} className="text-white/50" />
                </Pressable>
              </View>

              <TransportForm onSubmit={handleCreateRoute} />
            </View>
          </View>
        )}
      </View>
    </>
  );
}

// Loader helper
const Loader2 = ({
  className,
  size,
}: {
  className?: string;
  size?: number;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size || 24}
    height={size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
