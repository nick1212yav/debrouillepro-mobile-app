import { View, Text } from "react-native";
// src/features/transport/dashboard/InsuranceManagement.tsx
import {
  ShieldCheck,
  CalendarClock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react-native";

interface InsuranceItem {
  id: string;
  vehicleModel: string;
  plate: string;
  insuranceCompany: string;
  expirationDate: string;
  status: "valid" | "expiring_soon" | "expired";
}

export function InsuranceManagement() {
  const insurances: InsuranceItem[] = [
    {
      id: "1",
      vehicleModel: "Toyota Corolla",
      plate: "5678AB01",
      insuranceCompany: "SONAS RDC [2]",
      expirationDate: "Dans 12 jours",
      status: "expiring_soon",
    },
    {
      id: "2",
      vehicleModel: "Minibus Toyota HiAce",
      plate: "9012CD02",
      insuranceCompany: "SONAS RDC",
      expirationDate: "15 Oct 2026",
      status: "valid",
    },
    {
      id: "3",
      vehicleModel: "Honda CG125",
      plate: "3456EF03",
      insuranceCompany: "Alliance Assurances",
      expirationDate: "Expirée hier",
      status: "expired",
    },
  ];

  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4 text-white">
      <View className="flex items-center gap-2">
        <ShieldCheck size={16} className="text-violet-400" />
        <Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest">
          Vérification Assurances & Patentes [2]
        </Text>
      </View>

      <View className="space-y-3">
        {insurances.map((item) => (
          <View
            key={item.id}
            className="p-4 rounded-2xl border border-white/5 bg-white/[0.01] flex items-center justify-between gap-4"
          >
            <View className="flex items-center gap-3">
              <View
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  item.status === "expired"
                    ? "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse"
                    : item.status === "expiring_soon"
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                }`}
              >
                {item.status === "expired" ? (
                  <AlertTriangle size={15} />
                ) : (
                  <ShieldCheck size={15} />
                )}
              </View>
              <View>
                <Text className="text-xs font-bold text-white">
                  {item.vehicleModel} ({item.plate})
                </Text>
                <Text className="text-[10px] text-white/40 mt-0.5">
                  {item.insuranceCompany} • Échéance : {item.expirationDate}
                </Text>
              </View>
            </View>

            <View className="text-right">
              {item.status === "valid" ? (
                <Text className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Text>À jour [2]</Text></Text>
              ) : item.status === "expiring_soon" ? (
                <Text className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Text>Renouveler bientôt [2]</Text></Text>
              ) : (
                <Text className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
                  <Text>Expirée [2]</Text></Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
