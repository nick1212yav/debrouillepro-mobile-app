import { View, Text } from "react-native";
import {
  Shield,
  CheckCircle,
  AlertCircle,
  Lock,
  Eye,
  UserCheck,
  ShieldCheck,
} from "lucide-react-native";

interface Props {
  isVerified: boolean;
  isReported: boolean;
  hasProtection: boolean;
  onReport: () => void;
  onBlock: () => void;
}

export function CommunitySecurity({
  isVerified,
  isReported,
  hasProtection,
  onReport,
  onBlock,
}: Props) {
  const items = [
    {
      label: "Compte vérifié",
      active: isVerified,
      icon: UserCheck,
      color: "#10B981",
    },
    {
      label: "Protection activée",
      active: hasProtection,
      icon: ShieldCheck,
      color: "#8B5CF6",
    },
    {
      label: "Signalé",
      active: isReported,
      icon: AlertCircle,
      color: "#EF4444",
    },
  ];

  return (
    <View className="space-y-3">
      <View className="flex items-center gap-2">
        <Shield size={16} className="text-white/30" />
        <Text className="text-sm font-medium text-white/50">Sécurité</Text>
      </View>

      <View className="flex flex-wrap gap-2">
        {items.map((item) => (
          <View
            key={item.label}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
            style={{ backgroundColor: item.active
                            ? `${item.color}20`
                            : "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
          >
            <item.icon size={12} />
            {item.label}
          </View>
        ))}
      </View>

      <View className="flex flex-wrap gap-2">
        <Pressable
          onPress={onReport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-red-400 bg-red-500/10"
        >
          <AlertCircle size={12} /> <Text>Signaler</Text></Pressable>
        <Pressable
          onPress={onBlock}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/50 bg-white/5"
        >
          <Lock size={12} /> <Text>Bloquer</Text></Pressable>
        <Pressable className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/50 bg-white/5">
          <Eye size={12} /> <Text>Confidentialité</Text></Pressable>
      </View>
    </View>
  );
}
