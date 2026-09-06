import { View, Pressable } from "react-native";
import { useState } from "react";
import { X } from "lucide-react-native";

export function Service360({ url }: { url?: string }) {
  const [open, setOpen] = useState(false);
  if (!url) return null;
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="px-4 py-2 rounded-xl text-xs bg-white/10 text-white/60"
      >
        🔍 Visite 360°
      </Pressable>
      <>
        {open && (
          <Pressable
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onPress={() => setOpen(false)}
          >
            <Pressable
              onPress={() => setOpen(false)}
              className="absolute top-4 right-4 text-white/70"
            >
              <X size={28} />
            </Pressable>
            <View className="w-full max-w-4xl aspect-video">
              <View src={url} className="w-full h-full" allowFullScreen />
            </View>
          </Pressable>
        )}
      </>
    </>
  );
}
