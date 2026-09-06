import { Pressable, Linking } from "react-native";

// src/features/sante/components/DoctorWebsite.tsx
import { Globe } from "lucide-react-native";

interface DoctorWebsiteProps {
  url?: string;
  onWebsite?: () => void;
}

export function DoctorWebsite({ url, onWebsite }: DoctorWebsiteProps) {
  const handleClick = () => {
    if (onWebsite) {
      onWebsite();
    } else if (url) {
      Linking.openURL(String(url));
    }
  };

  return (
    <Pressable
      onPress={handleClick}
      disabled={!url}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium bg-white/10 text-white/60 border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <Globe size={14} />
      Site web
    </Pressable>
  );
}
