import { View, Text, Pressable, Image } from "react-native";
// src/features/transport/components/detail/TransportDriverVehicle.tsx
import {
  Phone,
  MessageSquare,
  ShieldCheck,
  Star,
  Wifi,
  Battery,
  Snowflake,
  Coffee,
  Users,
  Briefcase,
  ChevronRight,
} from "lucide-react-native";

interface DriverVehicleProps {
  name: string;
  phone: string;
  rating: number;
  vehicleModel?: string;
  vehiclePlate?: string;
}

export function TransportDriverVehicle({
  name,
  phone,
  rating,
  vehicleModel = "Mercedes Sprinter VIP 2024",
  vehiclePlate = "AB-123-CD",
}: DriverVehicleProps) {
  // Équipements présents
  const features = [
    {
      label: "WiFi Haut Débit",
      icon: <Wifi size={14} className="text-violet-400" />,
    },
    {
      label: "Prise USB",
      icon: <Battery size={14} className="text-violet-400" />,
    },
    {
      label: "Climatisation",
      icon: <Snowflake size={14} className="text-cyan-400" />,
    },
    {
      label: "Boisson offerte",
      icon: <Coffee size={14} className="text-amber-400" />,
    },
  ];

  return (
    <View className="space-y-4">
      {/* 🧑‍✈️ Chauffeur & Compagnie */}
      <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.01] space-y-4">
        {/* Entête Compagnie */}
        <View className="flex items-center justify-between pb-3 border-b border-white/5">
          <View className="flex items-center gap-2">
            <View className="w-6 h-6 rounded-md bg-amber-400/15 flex items-center justify-center text-amber-400 text-xs font-black">
              <Text>TE</Text></View>
            <View>
              <Text className="text-xs font-bold text-white">
                Transport Express RDC
              </Text>
              <Text className="text-[9px] text-white/40">
                Flotte certifiée • 320 véhicules
              </Text>
            </View>
          </View>
          <View className="flex items-center text-amber-400 gap-0.5 text-xs font-bold">
            <Star size={10} className="fill-amber-400" />
            <Text>4.8</Text></View>
        </View>

        {/* Détails du chauffeur */}
        <View className="flex items-center gap-3">
          <View className="relative w-12 h-12 rounded-2xl overflow-hidden bg-violet-600/20">
            <Image
             
             
              className="w-full h-full object-cover"
             source={{ uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" }} accessibilityLabel={name}/>
            <View className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#020412] flex items-center justify-center">
              <ShieldCheck size={8} className="text-white" />
            </View>
          </View>
          <View className="flex-1">
            <View className="flex items-center gap-1">
              <Text className="text-sm font-black text-white">{name}</Text>
              <Text className="text-[10px] bg-violet-500/20 text-violet-300 px-1.5 py-0.2 rounded font-semibold">
                Pro
              </Text>
            </View>
            <Text className="text-[10px] text-white/50 mt-0.5">
              {rating.toFixed(2)} ★ • 4,890 trajets effectués
            </Text>
          </View>
        </View>

        {/* Actions Chauffeur */}
        <View className="gap-2 pt-2">
          <Pressable
           
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/5 text-xs font-bold text-white"
           data-href={`tel:${phone}`}>
            <Phone size={14} className="text-white/60" />
            <Text>Appeler</Text></Pressable>
          <Pressable
           
           
           
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 text-xs font-bold text-[#25D366]"
           data-href={`https://wa.me/${phone}`}>
            <MessageSquare size={14} />
            <Text>WhatsApp</Text></Pressable>
        </View>
      </View>

      {/* 🚐 Spécifications Véhicule & Équipements */}
      <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.01] space-y-4">
        <View>
          <Text className="text-[9px] font-black text-violet-400 uppercase tracking-widest">
            Le Véhicule
          </Text>
          <Text className="text-sm font-black text-white mt-1">{vehicleModel}</Text>
          <Text className="text-[10px] font-mono text-white/40 mt-0.5">
            Plaque d'immatriculation : {vehiclePlate}
          </Text>
        </View>

        {/* Badges Spécifications */}
        <View className="gap-2 text-xs text-white/70">
          <View className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02]">
            <Users size={14} className="text-white/40" />
            <Text>6 Places VIP</Text>
          </View>
          <View className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02]">
            <Briefcase size={14} className="text-white/40" />
            <Text>Grand coffre bagages</Text>
          </View>
        </View>

        {/* Commodités incluses */}
        <View className="space-y-2">
          <Text className="text-[10px] font-bold text-white/30 uppercase tracking-wider">
            Équipements à bord
          </Text>
          <View className="gap-2">
            {features.map((feat) => (
              <View
                key={feat.label}
                className="flex items-center gap-2 p-2 border border-white/5 bg-white/[0.01] rounded-lg"
              >
                {feat.icon}
                <Text className="text-[11px] text-white/80 font-medium">
                  {feat.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
