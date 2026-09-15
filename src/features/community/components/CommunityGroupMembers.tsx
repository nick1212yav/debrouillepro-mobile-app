import { View, Text, TextInput, Image, Pressable } from "react-native";
import { useState } from "react";
import { User, Shield, Crown, X, Search, Check, UserMinus } from "lucide-react-native";

interface Member {
  id: string;
  name: string;
  avatar?: string;
  role: "admin" | "moderator" | "member";
  joinedAt: number;
  isOnline?: boolean;
}

interface Props {
  members: Member[];
  currentUserId?: string;
  isAdmin: boolean;
  onRemoveMember: (userId: string) => Promise<void>;
  onPromoteAdmin: (userId: string) => Promise<void>;
}

const ROLE_LABELS = {
  admin: "Admin",
  moderator: "Modérateur",
  member: "Membre",
};

const ROLE_ICONS = {
  admin: Crown,
  moderator: Shield,
  member: User,
};

const ROLE_COLORS = {
  admin: "#F59E0B",
  moderator: "#8B5CF6",
  member: "#6B7280",
};

export function CommunityGroupMembers({
  members,
  currentUserId,
  isAdmin,
  onRemoveMember,
  onPromoteAdmin,
}: Props) {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleRemove = async (userId: string) => {
    setIsLoading(true);
    try {
      await onRemoveMember(userId);
      setSelectedUser(null);
    } catch {
      // error handled by parent
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromote = async (userId: string) => {
    setIsLoading(true);
    try {
      await onPromoteAdmin(userId);
      setSelectedUser(null);
    } catch {
      // error handled by parent
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 86400000) return "Aujourd'hui";
    if (diff < 172800000) return "Hier";
    if (diff < 604800000) return `Il y a ${Math.floor(diff / 86400000)} jours`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <View className="space-y-3"><View className="flex items-center justify-between"><Text className="text-sm font-medium text-white/50">Membres ({members.length})
        </Text></View>{}<View className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" /><TextInput value={search} onChangeText={(value) => setSearch(value)} placeholder="Rechercher un membre..." className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-purple-400 transition-colors placeholder:text-white/30" /></View>{}<View className="space-y-1.5 max-h-64 overflow-y-auto pr-1">{filteredMembers.length === 0 ? (
          <Text className="text-white/30 text-sm text-center py-4">Aucun membre trouvé
          </Text>
        ) : (
          filteredMembers.map((member) => {
            const Icon = ROLE_ICONS[member.role];
            const color = ROLE_COLORS[member.role];
            const isCurrentUser = member.id === currentUserId;

            return (
              <View key={member.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-2 rounded-xl transition-colors">
                {member.avatar ? (
                  <Image className="w-8 h-8 rounded-full object-cover flex-shrink-0" source={{ uri: member.avatar }} accessibilityLabel={member.name} />
                ) : (
                  <View className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-500/20 flex-shrink-0"><User size={14} className="text-purple-400" /></View>
                )}
                <View className="flex-1 min-w-0"><View className="flex items-center gap-1.5"><Text className="text-white/80 text-sm font-medium truncate">{member.name}</Text>{member.isOnline && (
                      <Text className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    )}<Icon size={12} style={{ color }} className="flex-shrink-0" /><Text className="text-[10px]" style={{ color }}>{ROLE_LABELS[member.role]}</Text></View><Text className="text-white/20 text-[10px]">Rejoint le {formatDate(member.joinedAt)}</Text></View>

                {isAdmin && !isCurrentUser && (
                  <View className="flex items-center gap-1">
                    {member.role !== "admin" && (
                      <Pressable onPress={() => handlePromote(member.id)} disabled={isLoading} className="p-1.5 rounded-lg text-purple-400 transition-colors" title="Promouvoir admin">
                        <Crown size={14} />
                      </Pressable>
                    )}
                    <Pressable onPress={() => handleRemove(member.id)} disabled={isLoading} className="p-1.5 rounded-lg text-red-400 transition-colors" title="Retirer le membre">
                      <UserMinus size={14} />
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })
        )}</View></View>
  );
}
