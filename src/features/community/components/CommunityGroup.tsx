import { View, Image, Text, Pressable } from "react-native";
import { useState } from "react";
import {
  Users,
  Shield,
  Globe,
  Lock,
  MapPin,
  Calendar,
  Check,
  Plus,
} from "lucide-react-native";

interface GroupMember {
  id: string;
  name: string;
  avatar?: string;
}

interface Props {
  groupId: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  isPrivate: boolean;
  isMember: boolean;
  isAdmin: boolean;
  coverImage?: string;
  avatar?: string;
  city?: string;
  tags?: string[];
  members?: GroupMember[];
  onJoin: () => Promise<void>;
  onLeave: () => Promise<void>;
  onViewProfile: () => void;
}

export function CommunityGroup({
  groupId,
  name,
  description,
  category,
  memberCount,
  isPrivate,
  isMember,
  isAdmin,
  coverImage,
  avatar,
  city,
  tags = [],
  members = [],
  onJoin,
  onLeave,
  onViewProfile,
}: Props) {
  const [isJoining, setIsJoining] = useState(false);
  const [expandedMembers, setExpandedMembers] = useState(false);

  const handleToggleMembership = async () => {
    setIsJoining(true);
    try {
      if (isMember) {
        await onLeave();
      } else {
        await onJoin();
      }
    } catch {
      // error handled by parent
    } finally {
      setIsJoining(false);
    }
  };

  const displayMembers = expandedMembers ? members : members.slice(0, 6);

  return (
    <View className="space-y-3"><View className="rounded-2xl overflow-hidden bg-white/5 border border-white/5 transition-colors" onPress={onViewProfile}>{}{coverImage && (
          <View className="relative aspect-[2/1] bg-black/20 overflow-hidden"><Image className="w-full h-full object-cover" source={{ uri: coverImage }} accessibilityLabel={name} /><View className="absolute inset-0 pointer-events-none" style={{  }} /></View>
        )}<View className="p-4 space-y-3">{}<View className="flex items-start gap-3">{avatar ? (
              <Image className="w-14 h-14 rounded-2xl object-cover flex-shrink-0 border-2 border-white/10" source={{ uri: avatar }} accessibilityLabel={name} />
            ) : (
              <View className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{  }}><Users size={24} className="text-white" /></View>
            )}<View className="flex-1 min-w-0"><Text className="text-white font-bold text-base">{name}</Text><View className="flex items-center gap-2 text-xs text-white/40"><Text>{category}</Text><Text>·</Text><View className="flex items-center gap-0.5">{isPrivate ? <Lock size={10} /> : <Globe size={10} />}<Text>{isPrivate ? "Privé" : "Public"}</Text></View>{city && (
                  <>
                    <Text>·</Text>
                    <View className="flex items-center gap-0.5"><MapPin size={10} /><Text>{city}</Text></View>
                  </>
                )}</View></View></View>{}<Text className="text-white/70 text-sm">{description}</Text>{}{tags.length > 0 && (
            <View className="flex flex-wrap gap-1">{tags.slice(0, 4).map((tag) => (
                <Text key={tag} className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 text-white/40">#{tag}</Text>
              ))}</View>
          )}{}{members.length > 0 && (
            <View className="space-y-1"><View className="flex items-center justify-between"><Text className="text-xs text-white/40">{memberCount}membres
                </Text>{members.length > 6 && (
                  <Pressable onPress={(e) => {
                      setExpandedMembers(!expandedMembers);
                    }} className="text-xs text-purple-400 transition-colors">{expandedMembers ? "Voir moins" : "Voir plus"}</Pressable>
                )}</View><View className="flex -space-x-2">{displayMembers.map((member) => (
                  <View key={member.id} className="w-7 h-7 rounded-full border-2 border-[#0D1117] overflow-hidden">
                    {member.avatar ? (
                      <Image className="w-full h-full object-cover" source={{ uri: member.avatar }} accessibilityLabel={member.name} />
                    ) : (
                      <View className="w-full h-full flex items-center justify-center bg-purple-500/20">
                        <Text className="text-[8px] font-bold text-purple-400">
                          {member.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}{members.length > 6 && !expandedMembers && (
                  <View className="w-7 h-7 rounded-full border-2 border-[#0D1117] flex items-center justify-center bg-white/5 text-[8px] text-white/40">
                    +{members.length - 6}
                  </View>
                )}</View></View>
          )}{}<Pressable onPress={(e) => {
              handleToggleMembership();
            }} disabled={isJoining} className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              isMember
                ? "bg-white/10 text-white/60 hover:bg-white/20"
                : isPrivate
                  ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                  : "bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:opacity-80"
            }`}>{isJoining ? (
              "Chargement..."
            ) : isMember ? (
              "Quitter le groupe"
            ) : isPrivate ? (
              <>
                <Lock size={14} /> Demander à rejoindre
              </>
            ) : (
              <>
                <Plus size={14} /> Rejoindre le groupe
              </>
            )}</Pressable></View></View></View>
  );
}
