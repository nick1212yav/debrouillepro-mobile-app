import { View, Text } from "react-native";

// src/features/transport/dashboard/VehicleManagement.tsx
import { useState } from "react";
import {
  Car,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react-native";
import { Button } from "@/components/ui/button";

interface Vehicle {
  id: string;
  model: string;
  plate: string;
  type: string;
  driverName: string;
  status: "active" | "maintenance" | "inactive";
}

export function VehicleManagement() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: "1",
      model: "Toyota Corolla 2013",
      plate: "5678AB01",
      type: "taxi",
      driverName: "Jean Mukendi",
      status: "active",
    },
    {
      id: "2",
      model: "Toyota HiAce (Minibus)",
      plate: "9012CD02",
      type: "minibus",
      driverName: "Pierre Kabange",
      status: "active",
    },
    {
      id: "3",
      model: "Honda CG125 (Moto-Taxi)",
      plate: "3456EF03",
      type: "moto",
      driverName: "Alain Mutombo",
      status: "maintenance",
    },
    {
      id: "4",
      model: "Hyundai Accent 2015",
      plate: "7890GH04",
      type: "voiture",
      driverName: "Pauline Mwamba",
      status: "inactive",
    },
  ]);

  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4"><View className="flex items-center justify-between"><View className="space-y-0.5"><Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Gestion [2]
          </Text><Text className="text-base font-black">Véhicules de la Flotte ({vehicles.length}) [2]
          </Text></View><Button size="sm" className="rounded-xl h-9 bg-white/5 border border-white/10 text-xs font-bold gap-1"><Plus size={14} />Ajouter [2]
        </Button></View>{}<View className="space-y-2.5">{vehicles.map((v) => (
          <View key={v.id} className="p-4 rounded-2xl border border-white/5 bg-white/[0.01] flex items-center justify-between gap-4"><View className="flex items-center gap-3"><View className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400"><Car size={18} /></View><View><Text className="text-sm font-bold text-white">{v.model}</Text><Text className="text-[10px] text-white/40 font-mono mt-0.5">Plaque : {v.plate}· Chauffeur : {v.driverName}</Text></View></View>{}<View className="text-right">{v.status === "active" ? (
                <Text className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 size={10} /> En Service [2]
                </Text>
              ) : v.status === "maintenance" ? (
                <Text className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <AlertCircle size={10} /> Au Garage [2]
                </Text>
              ) : (
                <Text className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-white/5 text-white/50 border border-white/10">
                  Inactif
                </Text>
              )}</View></View>
        ))}</View></View>
  );
}
