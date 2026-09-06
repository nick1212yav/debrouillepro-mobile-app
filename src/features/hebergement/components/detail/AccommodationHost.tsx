import { View, Text, Image } from "react-native";
import React from "react";
import { ChevronRight, Star, MessageSquare } from "lucide-react-native";
import { VerifiedBadge } from "../common/VerifiedBadge";

interface AccommodationHostProps {
  host: {
    id: string;
    name: string;
    avatar?: string;
    verified: boolean;
    responseRate?: number;
  };
}

export const AccommodationHost: React.FC<AccommodationHostProps> = ({
  host,
}) => {
  const avatarInitials = host.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View className="p-4 md:p-6 border-b border-white/5">
      <Text className="text-white font-semibold text-sm mb-3">Hôte</Text>
      <View className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-4">
        <View className="flex items-center gap-3">
          {host.avatar ? (
            <Image
             
             
              className="w-12 h-12 rounded-full object-cover border border-white/10"
             source={{ uri: host.avatar }} accessibilityLabel={host.name}/>
          ) : (
            <View className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm text-white bg-gradient-to-br from-indigo-500 to-purple-500 border border-white/10 shrink-0">
              {avatarInitials}
            </View>
          )}
          <View className="flex-1 flex flex-col gap-0.5">
            <View className="flex items-center gap-1.5 flex-wrap">
              <Text className="text-sm font-semibold text-white">
                {host.name}
              </Text>
              <VerifiedBadge verified={host.verified} />
            </View>
            <Text className="text-[10px] text-white/40">Inscrit en 2024</Text>
          </View>
        </View>

        {host.responseRate !== undefined && (
          <View className="flex items-center gap-6 py-2 border-y border-white/5 text-xs text-white/60">
            <View className="flex items-center gap-1.5">
              <MessageSquare size={14} className="text-indigo-400 shrink-0" />
              <Text>
                Taux de réponse :{" "}
                <strong className="text-white">{host.responseRate}%</strong>
              </Text>
            </View>
            <View className="flex items-center gap-1.5">
              <Star
                size={14}
                className="text-amber-400 fill-amber-400 shrink-0"
              />
              <Text>Hôte expérimenté</Text>
            </View>
          </View>
        )}

        <View className="flex gap-2">
          <Pressable
            type="button"
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-white font-semibold text-xs"
          >
            <Text>Contacter l'hôte</Text></Pressable>
          <Pressable
            type="button"
            className="flex-1 py-2.5 rounded-xl bg-white/5 text-white font-semibold text-xs flex items-center justify-center gap-1"
          >
            <Text><Text>Voir le profil</Text></Text>
            <ChevronRight size={14} />
          </Pressable>
        </View>
      </View>
    </View>
  );
};
