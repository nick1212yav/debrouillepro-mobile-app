import { View, TextInput, Text } from "react-native";

// src/features/marketplace/components/MarketplaceReturns.tsx
import { useState } from "react";
import { Search, Package, Clock, CheckCircle, XCircle } from "lucide-react-native";

interface ReturnItem {
  id: string;
  productTitle: string;
  orderId: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "completed";
  requestedAt: number;
}

interface Props {
  returns: ReturnItem[];
}

const STATUS_CONFIG = {
  pending: { label: "En attente", color: "#F59E0B", icon: Clock },
  approved: { label: "Approuvé", color: "#3B82F6", icon: CheckCircle },
  rejected: { label: "Rejeté", color: "#EF4444", icon: XCircle },
  completed: { label: "Terminé", color: "#10B981", icon: CheckCircle },
};

export function MarketplaceReturns({ returns }: Props) {
  const [search, setSearch] = useState("");

  const filtered = returns.filter(
    (r) =>
      r.productTitle.toLowerCase().includes(search.toLowerCase()) ||
      r.orderId.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View className="space-y-3"><View className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10"><Search size={14} className="text-white/40" /><TextInput value={search} onChangeText={(value) => setSearch(value)} placeholder="Rechercher un retour..." className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/30" /></View>{filtered.length === 0 ? (
        <Text className="text-white/30 text-sm text-center py-4">Aucun retour</Text>
      ) : (
        filtered.map((ret) => {
          const status = STATUS_CONFIG[ret.status];
          const Icon = status.icon;
          return (
            <View key={ret.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"><Package size={16} className="text-white/30" /><View className="flex-1 min-w-0"><Text className="text-white font-medium text-sm">{ret.productTitle}</Text><Text className="text-white/40 text-xs">Commande #{ret.orderId}</Text><Text className="text-white/30 text-xs">{ret.reason}</Text></View><View className="text-right"><Text className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ color: status.color, backgroundColor: `${status.color}20` }}><Icon size={10} className="inline mr-0.5" />{status.label}</Text><Text className="text-white/20 text-[10px] mt-0.5">{new Date(ret.requestedAt).toLocaleDateString()}</Text></View></View>
          );
        })
      )}</View>
  );
}
