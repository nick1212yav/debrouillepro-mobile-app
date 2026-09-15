import { Text, Pressable } from "react-native";

// src/features/community/components/CommunityLocation.tsx
import { MapPin } from "lucide-react-native";

interface Props {
  location: string;
  address?: string;
  city?: string;
}

export function CommunityLocation({ location, address, city }: Props) {
  const displayText = location || address || city;

  if (!displayText) return null;

  const googleMapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(displayText)}`;

  return (
    <Pressable className="flex items-center gap-2 text-sm text-white/60 transition-colors" accessibilityHint={googleMapsUrl}>
      <MapPin size={14} className="text-white/30 flex-shrink-0" />
      <Text className="truncate">{displayText}</Text>
    </Pressable>
  );
}
