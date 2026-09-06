import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, TextInput } from "react-native";
import { useState } from "react";
import {
  ArrowLeft, Package, MapPin, Clock, ChevronRight, Phone,
  CheckCircle, Truck, Navigation, Shield, Zap, Plus, X, History,
} from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated, AuthLoading } from "@/lib/convex-auth-compat";
import { Skeleton } from "@/components/ui/skeleton";
import { SignInButton } from "@/components/ui/signin";
import type { Doc } from "@/convex/_generated/dataModel.d";

type Delivery = Doc<"deliveries">;
type View = "list" | "new";

const STATUS_COLOR: Record<string, string> = {
  pending: "#F59E0B",
  assigned: "#3B82F6",
  picked_up: "#8B5CF6",
  in_transit: "#8B5CF6",
  delivered: "#10B981",
  failed: "#EF4444",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  assigned: "Coursier assigné",
  picked_up: "Pris en charge",
  in_transit: "En transit",
  delivered: "Livré ✓",
  failed: "Échec",
};

function DeliveryCard({ delivery, onClick }: { delivery: Delivery; onClick: () => void }) {
  const color = STATUS_COLOR[delivery.status] ?? "#8B5CF6";
  return (
    <Pressable
      onPress={onClick}
      className="rounded-3xl p-4"
      style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
      <View className="flex items-center justify-between mb-2">
        <View className="flex items-center gap-2">
          <View className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
            <Package size={16} style={{ color }} />
          </View>
          <View>
            <Text className="text-white font-bold text-xs">{delivery.trackingCode}</Text>
            {delivery.weightKg && <Text className="text-white/40 text-[10px]">{delivery.weightKg} kg</Text>}
          </View>
        </View>
        <Text className="px-2.5 py-1 rounded-xl text-[10px] font-bold" style={{ backgroundColor: `${color}18`, color }}>
          {STATUS_LABEL[delivery.status] ?? delivery.status}
        </Text>
      </View>
      <View className="flex items-center gap-2 text-xs text-white/40">
        <View className="w-1.5 h-1.5 rounded-full bg-orange-400" />
        <Text className="truncate flex-1">{delivery.pickupAddress}</Text>
        <ChevronRight size={10} />
        <View className="w-1.5 h-1.5 rounded-full bg-green-400" />
        <Text className="truncate flex-1">{delivery.deliveryAddress}</Text>
      </View>
    </Pressable>
  );
}

function NewDeliveryForm({ onClose }: { onClose: () => void }) {
  const createDelivery = useMutation(api.mobility.createDelivery);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!from || !to || !description) { UIService.openToast("Remplissez tous les champs obligatoires", "error"); return; }
    setLoading(true);
    try {
      await createDelivery({
        pickupAddress: from,
        deliveryAddress: to,
        description,
        weightKg: weight ? parseFloat(weight) : undefined,
      });
      UIService.openToast("📦 Livraison créée !", "success");
      onClose();
    } catch {
      UIService.openToast("Erreur lors de la création", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      className="flex-1 overflow-y-auto px-5 pt-4 pb-8 flex flex-col gap-4" style={{  }}>
      {[
        { label: "Adresse de départ *", value: from, set: setFrom, ph: "Ex: Marché Sandaga, Dakar", icon: <MapPin size={13} className="text-orange-400" /> },
        { label: "Adresse destination *", value: to, set: setTo, ph: "Ex: Plateau, Dakar", icon: <Navigation size={13} className="text-green-400" /> },
        { label: "Description du colis *", value: description, set: setDescription, ph: "Ex: Vêtements, documents…", icon: <Package size={13} className="text-blue-400" /> },
        { label: "Poids (kg)", value: weight, set: setWeight, ph: "Ex: 2.5", icon: <Zap size={13} className="text-yellow-400" /> },
      ].map(f => (
        <View key={f.label} className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
          <Text className="flex items-center gap-2 text-white/50 text-xs mb-2">{f.icon}{f.label}</Text>
          <TextInput value={f.value} onChangeText={text => f.set(text)} placeholder={f.ph}
            className="w-full bg-transparent text-white text-sm placeholder:text-white/20 outline-none" />
        </View>
      ))}
      <Pressable onPress={handleSubmit} disabled={loading}
        className="w-full py-4 rounded-3xl font-bold text-white"
        style={{ opacity: loading ? 0.6 : 1 }}>
        {loading ? "Création…" : "Confirmer la livraison"}
      </Pressable>
    </View>
  );
}

function LivraisonContent({ onBack }: { onBack: () => void }) {
  const [view, setView] = useState<View>("list");
  const [trackCode, setTrackCode] = useState("");
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

  const myDeliveries = useQuery(api.mobility.getMyDeliveries, {});
  const trackedDelivery = useQuery(api.mobility.trackDelivery, trackCode.length >= 8 ? { trackingCode: trackCode } : "skip");

  return (
    <View className="h-full w-full flex flex-col" style={{  }}>
      <View className="px-5 pt-12 pb-3 flex items-center justify-between flex-shrink-0"
        style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)", borderBottomStyle: "solid" }}>
        <View className="flex items-center gap-3">
          <Pressable onPress={view !== "list" ? () => setView("list") : onBack}
            className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
            <ArrowLeft size={18} className="text-white" />
          </Pressable>
          <View>
            <Text className="text-white font-bold text-lg">Livraison Pro</Text>
            <Text className="text-white/40 text-xs">
              {view === "list" ? `${myDeliveries?.length ?? 0} colis` : "Nouvelle livraison"}
            </Text>
          </View>
        </View>
        {view === "list" && (
          <Pressable onPress={() => setView("new")}
            className="px-4 py-2 rounded-2xl text-white text-sm font-bold"
            style={{  }}>
            <Text>+ Envoyer</Text></Pressable>
        )}
      </View>

      <>
        {view === "list" && (
          <View key="list"
            className="flex-1 overflow-y-auto px-5 pt-4 pb-8 flex flex-col gap-4" style={{  }}>

            {/* Track by code */}
            <View className="rounded-2xl p-4" style={{ backgroundColor: "rgba(139,92,246,0.08)", borderWidth: 1, borderColor: "rgba(139,92,246,0.2)", borderStyle: "solid" }}>
              <Text className="text-xs text-white/40 mb-2">Suivre un colis par code</Text>
              <View className="flex gap-2">
                <TextInput value={trackCode} onChangeText={text => setTrackCode(text.toUpperCase())}
                  placeholder="Ex: DLV-A3B4C5D6…"
                  className="flex-1 px-3 py-2 rounded-xl bg-transparent text-white text-sm placeholder:text-white/25 outline-none"
                  style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} />
              </View>
              {trackedDelivery && (
                <View className="mt-3 flex items-center gap-2">
                  <View className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLOR[trackedDelivery.status] }} />
                  <Text className="text-sm text-white font-semibold">{STATUS_LABEL[trackedDelivery.status]}</Text>
                  <Text className="text-xs text-white/40 ml-auto">{trackedDelivery.pickupAddress} → {trackedDelivery.deliveryAddress}</Text>
                </View>
              )}
            </View>

            {/* Stats */}
            <View className="gap-2">
              {[
                { label: "Total", value: myDeliveries?.length ?? 0, color: "#8B5CF6" },
                { label: "En cours", value: myDeliveries?.filter(d => d.status !== "delivered" && d.status !== "failed").length ?? 0, color: "#F59E0B" },
                { label: "Livrés", value: myDeliveries?.filter(d => d.status === "delivered").length ?? 0, color: "#10B981" },
              ].map(s => (
                <View key={s.label} className="rounded-2xl p-3 flex flex-col gap-1"
                  style={{ backgroundColor: `${s.color}0D`, borderStyle: "solid" }}>
                  <Text className="text-white font-black text-base">{s.value}</Text>
                  <Text className="text-white/40 text-[10px]">{s.label}</Text>
                </View>
              ))}
            </View>

            <Text className="text-white/40 text-xs font-semibold uppercase tracking-wider">Mes colis</Text>
            {myDeliveries === undefined ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-3xl" />)
            ) : myDeliveries.length === 0 ? (
              <View className="flex flex-col items-center justify-center py-10 gap-3">
                <Package size={40} className="text-white/15" />
                <Text className="text-white/40 text-sm">Aucun colis pour le moment</Text>
              </View>
            ) : (
              myDeliveries.map(d => (
                <DeliveryCard key={d._id} delivery={d} onPress={() => setSelectedDelivery(d)} />
              ))
            )}
          </View>
        )}
        {view === "new" && (
          <View key="new"
            className="flex-1 overflow-hidden flex flex-col">
            <NewDeliveryForm onClose={() => setView("list")} />
          </View>
        )}
      </>

      {/* Detail sheet */}
      <>
        {selectedDelivery && (
          <>
            <Pressable
              onPress={() => setSelectedDelivery(null)}
              className="fixed inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} />
            <View
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl flex flex-col"
              style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
              <View className="flex justify-center pt-3"><View className="w-10 h-1 rounded-full bg-white/20" /></View>
              <View className="flex items-center justify-between px-5 py-3">
                <View>
                  <Text className="text-white font-black">{selectedDelivery.trackingCode}</Text>
                  <Text className="text-xs mt-0.5" style={{ color: STATUS_COLOR[selectedDelivery.status] }}>
                    {STATUS_LABEL[selectedDelivery.status]}
                  </Text>
                </View>
                <Pressable onPress={() => setSelectedDelivery(null)} className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.07)" }}><X size={16} className="text-white/50" /></Pressable>
              </View>
              <View className="px-5 pb-8 flex flex-col gap-3">
                <View className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                  <View className="flex items-center gap-2 text-sm text-white/50 mb-2">
                    <View className="w-2 h-2 rounded-full bg-orange-400" />
                    <Text>{selectedDelivery.pickupAddress}</Text>
                  </View>
                  <View className="flex items-center gap-2 text-sm text-white/50">
                    <View className="w-2 h-2 rounded-full bg-green-400" />
                    <Text>{selectedDelivery.deliveryAddress}</Text>
                  </View>
                </View>
                <Text className="text-sm text-white/60">{selectedDelivery.description}</Text>
              </View>
            </View>
          </>
        )}
      </>

      <View className="px-5 py-2 flex items-center justify-between flex-shrink-0" style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)", borderTopStyle: "solid" }}>
        <View className="flex items-center gap-1.5">
          <Shield size={10} className="text-purple-400" />
          <Text className="text-[9px] text-white/25">Livraisons assurées</Text>
        </View>
        <View className="flex items-center gap-1.5">
          <Zap size={10} className="text-yellow-400" />
          <Text className="text-[9px] text-white/25">Paiement Mobile Money</Text>
        </View>
      </View>
    </View>
  );
}

export default function LivraisonPage({ onBack }: { onBack: () => void }) {
  return (
    <>
      <AuthLoading>
        <View className="h-full flex items-center justify-center" style={{  }}>
          <View className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-80 rounded-3xl" />)}
          </View>
        </View>
      </AuthLoading>
      <Unauthenticated>
        <View className="h-full flex flex-col items-center justify-center gap-4 px-6" style={{  }}>
          <Pressable onPress={onBack} className="self-start w-10 h-10 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><ArrowLeft size={18} className="text-white" /></Pressable>
          <Package size={48} className="text-white/20" />
          <Text className="text-white font-bold text-lg">Connectez-vous</Text>
          <Text className="text-white/40 text-sm text-center">Gérez vos livraisons et suivez vos colis</Text>
          <SignInButton />
        </View>
      </Unauthenticated>
      <Authenticated>
        <LivraisonContent onBack={onBack} />
      </Authenticated>
    </>
  );
}
