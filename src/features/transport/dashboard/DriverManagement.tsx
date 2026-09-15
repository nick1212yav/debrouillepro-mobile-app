import { View, Text } from "react-native";

// src/features/transport/dashboard/DriverManagement.tsx
import { useState } from "react";
import { Users, ShieldCheck, Ban, Star, Phone } from "lucide-react-native";
import { Button } from "@/components/ui/button";

interface Driver {
  id: string;
  name: string;
  phone: string;
  rating: number;
  verified: boolean;
  status: "approved" | "suspended" | "pending";
}

export function DriverManagement() {
  const [drivers, setDrivers] = useState<Driver[]>([
    {
      id: "1",
      name: "Jean Mukendi",
      phone: "+243 890 000 001",
      rating: 4.9,
      verified: true,
      status: "approved",
    },
    {
      id: "2",
      name: "Pierre Kabange",
      phone: "+243 890 000 002",
      rating: 4.8,
      verified: true,
      status: "approved",
    },
    {
      id: "3",
      name: "Alain Mutombo",
      phone: "+243 890 000 003",
      rating: 4.2,
      verified: false,
      status: "pending",
    },
    {
      id: "4",
      name: "Pauline Mwamba",
      phone: "+243 890 000 004",
      rating: 3.5,
      verified: true,
      status: "suspended",
    },
  ]);

  const toggleStatus = (id: string) => {
    setDrivers((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const nextStatus: Driver["status"] =
            d.status === "approved" ? "suspended" : "approved";
          return { ...d, status: nextStatus };
        }
        return d;
      }),
    );
  };

  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4"><View className="flex items-center justify-between"><View className="space-y-0.5"><Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Contrôle [2]
          </Text><Text className="text-base font-black">Chauffeurs et Permis ({drivers.length}) [2]
          </Text></View></View><View className="space-y-2.5">{drivers.map((d) => (
          <View key={d.id} className="p-4 rounded-2xl border border-white/5 bg-white/[0.01] flex items-center justify-between gap-4"><View className="flex items-center gap-3"><View className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold">{d.name.charAt(0)}</View><View><View className="flex items-center gap-1.5"><Text className="text-sm font-bold text-white">{d.name}</Text>{d.verified && (
                    <ShieldCheck size={13} className="text-emerald-400" />
                  )}</View><View className="flex items-center gap-2 mt-0.5 text-[10px] text-white/40"><View className="flex items-center gap-0.5"><Star size={10} className="text-amber-400 fill-amber-400" /><Text>{d.rating}</Text></View><Text>•</Text><Text>{d.phone}</Text></View></View></View>{}<View className="flex items-center gap-2"><Button size="sm" onPress={() => toggleStatus(d.id)} className={`h-8 rounded-lg px-3 text-[10px] font-bold ${d.status === "approved" ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"}`}>{d.status === "approved" ? "Suspendre [2]" : "Activer [2]"}</Button></View></View>
        ))}</View></View>
  );
}
