import { View, TextInput, Pressable } from "react-native";

// src/features/community/components/CreatePost/PostLocation.tsx
import { useState, useCallback } from "react";
import { MapPin, Loader2, LocateFixed } from "lucide-react-native";
import { toast } from "sonner";

interface Props {
  location: string;
  onChange: (location: string) => void;
}

export function PostLocation({ location, onChange }: Props) {
  const [locating, setLocating] = useState(false);

  const detectLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      toast.error("Géolocalisation non supportée");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
          );
          const data = (await res.json()) as {
            address?: {
              city?: string;
              town?: string;
              village?: string;
              suburb?: string;
              state?: string;
              country?: string;
            };
          };
          const addr = data.address;
          const place =
            addr?.city ??
            addr?.town ??
            addr?.village ??
            addr?.suburb ??
            addr?.state ??
            "";
          const country = addr?.country ?? "";
          onChange(
            place
              ? `${place}, ${country}`
              : `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
          );
          toast.success("Position détectée !");
        } catch {
          onChange(
            `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
          );
        }
        setLocating(false);
      },
      () => {
        toast.error("Impossible de détecter la position");
        setLocating(false);
      },
      { timeout: 10000 },
    );
  }, [onChange]);

  return (
    <View className="rounded-2xl p-3.5" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><View className="flex items-center gap-2.5"><MapPin size={14} className="text-white/40" /><TextInput value={location} onChangeText={(value) => onChange(value)} placeholder="Ajouter une localisation" className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 outline-none" /><Pressable onPress={detectLocation} disabled={locating} className="flex-shrink-0 disabled:opacity-40">{locating ? (
            <Loader2 size={14} className="animate-spin text-white/40" />
          ) : (
            <LocateFixed size={14} className="text-white/40" />
          )}</Pressable></View></View>
  );
}
