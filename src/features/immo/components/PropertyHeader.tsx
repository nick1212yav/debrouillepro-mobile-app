import { View, Text } from "react-native";
import { Home, Building, MapPin } from "lucide-react-native";

interface Props {
  title: string;
  type: string;
  transactionType: string;
  city: string;
  authorName: string | null;
  createdAt: number;
  color: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  appartement: Building,
  maison: Home,
  villa: Home,
  studio: Building,
  bureau: Building,
  terrain: MapPin,
  chambre: Building,
  entrepot: Building,
};

const TYPE_LABELS: Record<string, string> = {
  appartement: "Appartement",
  maison: "Maison",
  villa: "Villa",
  studio: "Studio",
  bureau: "Bureau",
  terrain: "Terrain",
  chambre: "Chambre",
  entrepot: "Entrepôt",
};

export function PropertyHeader({
  title,
  type,
  transactionType,
  city,
  authorName,
  createdAt,
  color,
}: Props) {
  const Icon = TYPE_ICONS[type] || Building;
  const typeLabel = TYPE_LABELS[type] || type;
  const txnLabel =
    transactionType === "location" ? "📍 À louer" : "💰 À vendre";

  const timeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  };

  return (
    <View className="flex items-start gap-3"><View className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20` }}><Icon size={20} style={{ color }} /></View><View className="flex-1 min-w-0"><Text className="text-sm font-bold text-white leading-tight truncate">{title}</Text><View className="flex items-center gap-1.5 mt-0.5 flex-wrap"><Text className="text-xs text-white/50">{typeLabel}</Text><Text className="text-xs text-white/30">·</Text><Text className="text-xs" style={{ color }}>{txnLabel}</Text></View><View className="flex items-center gap-2 mt-0.5 text-[10px] text-white/30">{authorName && (
            <>
              <Text>par {authorName}</Text>
              <Text>·</Text>
            </>
          )}<Text>{timeAgo(createdAt)}</Text></View>{city && (
          <View className="flex items-center gap-1 mt-0.5 text-[10px] text-white/40">
            <MapPin size={10} />
            <Text>{city}</Text>
          </View>
        )}</View></View>
  );
}
