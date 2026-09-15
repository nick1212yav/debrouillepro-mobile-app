import { Text, View, Pressable } from "react-native";

// src/features/network/components/NetworkTabs.tsx
export type NetworkTab =
  | "suggestions"
  | "followers"
  | "following"
  | "companies"
  | "opportunities"
  | "analytics";

interface TabConfig {
  id: NetworkTab;
  label: string;
  icon: string;
  countKey?:
    | "followers"
    | "following"
    | "suggestions"
    | "companies"
    | "opportunities"; // ✅ Rendu optionnel pour supporter les onglets sans compteur (analytics) [1]
}

interface NetworkTabsProps {
  activeTab: NetworkTab;
  onChange: (tab: NetworkTab) => void;
  counts?: {
    followers?: number;
    following?: number;
    suggestions?: number;
    companies?: number;
    opportunities?: number;
  };
}

const TABS: TabConfig[] = [
  {
    id: "suggestions",
    label: "Suggestions",
    icon: "✨",
    countKey: "suggestions",
  },
  { id: "followers", label: "Abonnés", icon: "👥", countKey: "followers" },
  { id: "following", label: "Abonnements", icon: "🤝", countKey: "following" },
  { id: "companies", label: "Entreprises", icon: "🏢", countKey: "companies" },
  {
    id: "opportunities",
    label: "Opportunités",
    icon: "💼",
    countKey: "opportunities",
  },
  { id: "analytics", label: "Analytic", icon: "📊" }, // ✅ countKey omis proprement car il est désormais optionnel [1]
];

export function NetworkTabs({
  activeTab,
  onChange,
  counts = {},
}: NetworkTabsProps) {
  return (
    <View className="flex items-center gap-2 overflow-x-auto px-4 pb-2 border-b border-white/5 flex-shrink-0">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const count = tab.countKey ? (counts[tab.countKey] ?? 0) : 0;

        return (
          <Pressable key={tab.id} whileTap={{ scale: 0.95 }} onPress={() => onChange(tab.id)} className={`flex items-center gap-1.5 h-8 px-3.5 rounded-full text-[11px] font-bold transition-all border flex-shrink-0 ${
              isActive
                ? "bg-indigo-600/10 border-indigo-500/30 text-indigo-400"
                : "bg-white/[0.02] border-white/5 text-white/50 hover:text-white/80"
            }`}>
            <Text>{tab.icon}</Text>
            <Text>{tab.label}</Text>
            {tab.countKey && count > 0 && (
              <Text className={`flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[8px] font-black leading-none ${
                  isActive
                    ? "bg-indigo-500 text-white"
                    : "bg-white/10 text-white/70"
                }`}>
                {count}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
