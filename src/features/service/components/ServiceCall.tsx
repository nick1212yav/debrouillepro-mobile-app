import { Text, Pressable } from "react-native";
import { Phone } from "lucide-react-native";

interface Props {
  phone?: string;
}

export function ServiceCall({ phone }: Props) {
  const handleCall = () => {
    if (!phone) return;
    undefined.href = `tel:${phone}`;
  };

  return (
    <Pressable
      onPress={handleCall}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/20 text-green-400"
    >
      <Phone size={16} />
      <Text>Appeler</Text>
    </Pressable>
  );
}
