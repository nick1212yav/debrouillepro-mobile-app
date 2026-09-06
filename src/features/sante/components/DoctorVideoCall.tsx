import { Pressable } from "react-native";

// src/features/sante/components/DoctorVideoCall.tsx
import { Video } from "lucide-react-native";

interface DoctorVideoCallProps {
  onVideoCall: () => void;
  url?: string;
  disabled?: boolean;
}

export function DoctorVideoCall({
  onVideoCall,
  url,
  disabled = false,
}: DoctorVideoCallProps) {
  return (
    <Pressable
      onPress={onVideoCall}
      disabled={disabled || !url}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <Video size={14} />
      {url ? "Visio" : "Visio indisponible"}
    </Pressable>
  );
}
