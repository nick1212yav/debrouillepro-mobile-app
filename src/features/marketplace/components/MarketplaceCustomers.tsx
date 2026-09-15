import { View, TextInput, Text, Image } from "react-native";

// src/features/marketplace/components/MarketplaceCustomers.tsx
import { useState } from "react";
import { Search, User, Mail, Calendar } from "lucide-react-native";
import { formatDate } from "../utils/formatter";

interface Customer {
  id: string;
  name: string;
  email: string;
  orders: number;
  totalSpent: number;
  joinedAt: number;
  avatar?: string;
}

interface Props {
  customers: Customer[];
  currency: string;
}

export function MarketplaceCustomers({ customers, currency }: Props) {
  const [search, setSearch] = useState("");

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View className="space-y-3"><View className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10"><Search size={14} className="text-white/40" /><TextInput value={search} onChangeText={(value) => setSearch(value)} placeholder="Rechercher un client..." className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/30" /></View><View className="space-y-2">{filtered.length === 0 ? (
          <Text className="text-white/30 text-sm text-center py-4">Aucun client</Text>
        ) : (
          filtered.map((customer) => (
            <View key={customer.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">{customer.avatar ? (
                <Image className="w-10 h-10 rounded-full object-cover" source={{ uri: customer.avatar }} accessibilityLabel={customer.name} />
              ) : (
                <View className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-500/20 text-purple-400"><User size={16} /></View>
              )}<View className="flex-1 min-w-0"><Text className="text-white font-medium text-sm">{customer.name}</Text><View className="flex items-center gap-3 text-xs text-white/40"><Text className="flex items-center gap-0.5"><Mail size={10} />{customer.email}</Text><Text>{customer.orders}commandes</Text><Text className="flex items-center gap-0.5"><Calendar size={10} />{formatDate(customer.joinedAt)}</Text></View></View><View className="text-right"><Text className="text-purple-400 font-bold text-sm">{customer.totalSpent.toLocaleString()}{currency}</Text><Text className="text-white/30 text-[10px]">dépensé</Text></View></View>
          ))
        )}</View></View>
  );
}
