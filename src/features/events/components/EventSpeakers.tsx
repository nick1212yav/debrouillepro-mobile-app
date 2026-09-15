import { View, Text, Image } from "react-native";

// src/features/events/components/EventSpeakers.tsx
interface Speaker {
  name: string;
  role: string;
  avatar?: string;
}

interface Props {
  speakers: Speaker[];
}

export function EventSpeakers({ speakers }: Props) {
  if (!speakers || speakers.length === 0) return null;

  return (
    <View className="space-y-3"><Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">Intervenants
      </Text><View className="flex flex-wrap gap-3">{speakers.map((speaker) => (
          <View key={speaker.name} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/5">{speaker.avatar ? (
              <Image className="w-8 h-8 rounded-full object-cover" source={{ uri: speaker.avatar }} accessibilityLabel={speaker.name} />
            ) : (
              <View className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-500/20 text-purple-400 font-bold text-sm">{speaker.name.charAt(0)}</View>
            )}<View className="text-left"><Text className="text-white font-medium text-sm">{speaker.name}</Text><Text className="text-white/40 text-xs">{speaker.role}</Text></View></View>
        ))}</View></View>
  );
}
