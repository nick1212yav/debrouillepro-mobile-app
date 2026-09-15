import { View, Pressable, Text } from "react-native";

// src/features/transport/pages/TransportDashboardPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  LayoutDashboard,
  Truck,
  Users,
  Settings,
} from "lucide-react-native";
import { FleetDashboard } from "../dashboard/FleetDashboard";
import { VehicleManagement } from "../dashboard/VehicleManagement";
import { DriverManagement } from "../dashboard/DriverManagement";

type DashboardSection = "analytics" | "vehicles" | "drivers";

export default function TransportDashboardPage({
  onBack,
}: {
  onBack: () => void;
}) {
  const [activeSection, setActiveSection] =
    useState<DashboardSection>("analytics");

  return (
    <View className="h-full flex flex-col bg-gradient-to-b from-[#020412] to-[#040618] text-white">{}<View className="flex-shrink-0 px-4 pt-12 pb-3 flex items-center gap-3 border-b border-white/5 bg-[#070914]/40"><Pressable onPress={onBack} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5 transition-colors"><ArrowLeft size={18} className="text-white" /></Pressable><View><Text className="text-base font-black">Console de Gestion [2]</Text><Text className="text-[9px] text-violet-400 font-bold uppercase tracking-wider">Supervision d'activité de flotte [2]
          </Text></View></View>{}<View className="flex-shrink-0 px-4 py-3 flex gap-2 overflow-x-auto border-b border-white/5" style={{  }}>{[
          {
            id: "analytics",
            label: "Performances [2]",
            icon: <LayoutDashboard size={14} />,
          },
          { id: "vehicles", label: "Véhicules [2]", icon: <Truck size={14} /> },
          { id: "drivers", label: "Chauffeurs [2]", icon: <Users size={14} /> },
        ].map((tab) => (
          <Pressable key={tab.id} onPress={() => setActiveSection(tab.id as DashboardSection)} className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
              activeSection === tab.id
                ? "bg-violet-500/20 text-violet-300 border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                : "bg-white/5 text-white/50 border-white/5 hover:bg-white/10"
            }`}>{tab.icon}{tab.label}</Pressable>
        ))}</View>{}<View className="flex-1 overflow-y-auto px-4 py-6" style={{  }}>{activeSection === "analytics" && <FleetDashboard />}{activeSection === "vehicles" && <VehicleManagement />}{activeSection === "drivers" && <DriverManagement />}</View></View>
  );
}
