import { Text, View } from "react-native";
import { MapPin, Globe, Calendar, Briefcase } from "lucide-react-native";

interface Props {
  city: string;
  remote: boolean;
  contractLabel: string;
  contractColor: string;
  deadline: string | null;
  status: string;
}

export function JobMeta({
  city,
  remote,
  contractLabel,
  contractColor,
  deadline,
  status,
}: Props) {
  const items = [
    {
      icon: MapPin,
      label: city || "Localisation",
      visible: true,
    },
    {
      icon: Globe,
      label: remote ? "Remote" : "Présentiel",
      visible: true,
    },
    {
      icon: Briefcase,
      label: contractLabel,
      visible: true,
    },
    {
      icon: Calendar,
      label: deadline
        ? `Jusqu'au ${new Date(deadline).toLocaleDateString()}`
        : "Postulez",
      visible: true,
    },
  ];

  return (
    <View className="flex flex-wrap items-center gap-3 mt-2">
      {items.map(
        (item, idx) =>
          item.visible && (
            <View
              key={idx}
              className="flex items-center gap-1 text-white/40 text-[10px]"
            >
              <item.icon size={10} />
              <Text>{item.label}</Text>
            </View>
          ),
      )}
      <Text
        className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ml-auto"
        style={{ backgroundColor: `${contractColor}25`, color: contractColor }}
      >
        {contractLabel}
      </Text>
    </View>
  );
}
