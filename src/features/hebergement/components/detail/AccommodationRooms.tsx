import { View, Text } from "react-native";
import React from "react";
import { Bed } from "lucide-react-native";

interface BedConfig {
  type: string;
  count: number;
}

interface RoomLayout {
  id: string;
  name: string;
  beds: BedConfig[];
}

interface AccommodationRoomsProps {
  roomsList?: RoomLayout[];
  bedroomsCount?: number;
}

export const AccommodationRooms: React.FC<AccommodationRoomsProps> = ({
  roomsList,
  bedroomsCount = 1,
}) => {
  const defaultRooms: RoomLayout[] = Array.from({ length: bedroomsCount }).map(
    (_, i) => ({
      id: String(i + 1),
      name: `Chambre ${i + 1}`,
      beds: [{ type: "Lit Double Standard", count: 1 }],
    }),
  );

  const data = roomsList || defaultRooms;

  return (
    <View className="p-4 md:p-6 border-b border-white/5"><Text className="text-white font-semibold text-sm mb-3">Configuration des lits
      </Text><View className="gap-3">{data.map((room) => (
          <View key={room.id} className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3"><View className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0"><Bed size={18} /></View><View><Text className="text-sm font-semibold text-white">{room.name}</Text><View className="flex flex-col gap-0.5 mt-1">{room.beds.map((b, i) => (
                  <Text key={i} className="text-xs text-white/50">
                    {b.count}x {b.type}
                  </Text>
                ))}</View></View></View>
        ))}</View></View>
  );
};
