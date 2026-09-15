import { View, Text } from "react-native";

// src/features/transport/dashboard/TripHistoryTable.tsx
import { Car, CheckCircle2, ChevronRight } from "lucide-react-native";
import { formatMobilityPrice } from "../utils/distance";

interface TripRow {
  id: string;
  passenger: string;
  route: string;
  amount: number;
  status: "completed" | "cancelled";
  date: string;
}

export function TripHistoryTable() {
  const history: TripRow[] = [
    {
      id: "1092",
      passenger: "Guy Mandoki",
      route: "Gombe → Lemba",
      amount: 1500,
      status: "completed",
      date: "Hier à 18:30",
    },
    {
      id: "1091",
      passenger: "Sarah Lukoki",
      route: "Gare Centrale → N'djili",
      amount: 3000,
      status: "completed",
      date: "Hier à 14:15",
    },
    {
      id: "1090",
      passenger: "Alain Mutombo",
      route: "Kintambo → Bandal",
      amount: 1000,
      status: "completed",
      date: "Le 30 Juil à 09:00",
    },
    {
      id: "1089",
      passenger: "Marc Ndongala",
      route: "Limete → Gombe",
      amount: 2000,
      status: "cancelled",
      date: "Le 28 Juil à 11:30",
    },
  ];

  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4 text-white"><View className="flex items-center gap-2"><Car size={16} className="text-violet-400" /><Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Historique Récent des Courses [2]
        </Text></View><View className="space-y-2.5">{history.map((row) => (
          <View key={row.id} className="p-4 rounded-2xl border border-white/5 bg-white/[0.01] flex items-center justify-between gap-4"><View className="flex items-center gap-3"><View className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 flex-shrink-0"><Text className="text-[10px] font-bold">#{row.id}</Text></View><View><Text className="text-xs font-bold text-white">{row.route}</Text><Text className="text-[10px] text-white/40 mt-0.5">Passager : {row.passenger}• {row.date}</Text></View></View><View className="text-right flex items-center gap-3"><View><Text className="text-xs font-black text-white">{formatMobilityPrice(row.amount, "FCFA")}</Text><Text className={`text-[8px] font-bold px-2 py-0.2 rounded-full inline-block mt-0.5 ${
                    row.status === "completed"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                      : "bg-red-500/10 text-red-400 border border-red-500/15"
                  }`}>{row.status === "completed" ? "Terminée" : "Annulée [2]"}</Text></View><ChevronRight size={14} className="text-white/20" /></View></View>
        ))}</View></View>
  );
}
