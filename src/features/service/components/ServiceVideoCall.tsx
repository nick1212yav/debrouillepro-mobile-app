import { Pressable } from "react-native";
import { Video } from "lucide-react-native";

interface Props {
  onStart?: () => void;
}

export function ServiceVideoCall({ onStart }: Props) {
  return (
    <Pressable onPress={onStart} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400 transition-colors">
      <Video size={16} /> Appel vidéo
    </Pressable>
  );
}
