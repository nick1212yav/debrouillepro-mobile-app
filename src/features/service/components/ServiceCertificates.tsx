import { View, Text } from "react-native";
import { FileCheck } from "lucide-react-native";

interface Props {
  certificates: string[];
}

export function ServiceCertificates({ certificates }: Props) {
  if (!certificates || certificates.length === 0) return null;
  return (
    <View className="space-y-2"><Text className="text-sm font-medium text-white/50">Certificats</Text><View className="flex flex-wrap gap-2">{certificates.map((cert, i) => (
          <Text key={i} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <FileCheck size={12} /> {cert}
          </Text>
        ))}</View></View>
  );
}
