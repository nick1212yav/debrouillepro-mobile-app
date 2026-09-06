import { View, Text, Pressable } from "react-native";
// src/features/events/components/EventLive.tsx
import { useState } from "react";
import { Radio, X } from "lucide-react-native";

interface Props {
  streamUrl: string;
  isLive: boolean;
  title: string;
}

export function EventLive({ streamUrl, isLive, title }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isLive) return null;

  return (
    <View className="space-y-2">
      <View className="flex items-center gap-2">
        <View className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <Text className="text-xs text-red-400 font-semibold uppercase tracking-wider">
          En direct
        </Text>
      </View>
      <Pressable
        onPress={() => setIsOpen(true)}
        className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-white font-bold"
        style={{  }}
      >
        <Radio size={16} /> <Text>Regarder le live</Text></Pressable>

      {isOpen && (
        <Pressable
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          onPress={() => setIsOpen(false)}
        >
          <View className="relative w-full max-w-4xl aspect-video">
            <View
              src={streamUrl}
              controls
              className="w-full h-full rounded-xl"
              autoPlay
            />
            <Pressable
              onPress={() => setIsOpen(false)}
              className="absolute -top-12 right-0 text-white/70"
            >
              <X size={24} />
            </Pressable>
          </View>
        </Pressable>
      )}
    </View>
  );
}
