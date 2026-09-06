import { View, Text, Image } from "react-native";
import { Briefcase, CheckCircle2, Clock } from "lucide-react-native";

interface Props {
  title: string;
  company: string;
  companyLogo: string | null;
  contractColor: string;
  authorName: string | null;
  createdAt: number;
}

export function JobHeader({
  title,
  company,
  companyLogo,
  contractColor,
  authorName,
  createdAt,
}: Props) {
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
    <View className="flex items-start gap-3">
      {companyLogo ? (
        <Image
         
         
          className="w-12 h-12 rounded-2xl object-cover flex-shrink-0"
         source={{ uri: companyLogo }} accessibilityLabel={company}/>
      ) : (
        <View
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg"
          style={{ backgroundColor: `${contractColor}20` }}
        >
          <Briefcase size={20} style={{ color: contractColor }} />
        </View>
      )}
      <View className="flex-1 min-w-0">
        <Text className="text-sm font-bold text-white leading-tight truncate">
          {title}
        </Text>
        <View className="flex items-center gap-1.5 mt-0.5">
          <CheckCircle2 size={11} className="text-blue-400" />
          <Text className="text-xs text-white/60 truncate">{company}</Text>
        </View>
        <View className="flex items-center gap-2 mt-0.5 text-[10px] text-white/30">
          {authorName && (
            <>
              <Text><Text>par</Text>{authorName}</Text>
              <Text><Text>·</Text></Text>
            </>
          )}
          <Text>{timeAgo(createdAt)}</Text>
        </View>
      </View>
    </View>
  );
}
