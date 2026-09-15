import { View, Text, Pressable, TextInput, Image } from "react-native";
import { useState } from "react";
import {
  User,
  Mail,
  MapPin,
  Globe,
  Calendar,
  Edit2,
  Check,
  X,
} from "lucide-react-native";

interface Props {
  userId: string;
  name: string;
  email?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  joinedAt: number;
  isOwnProfile: boolean;
  onUpdateProfile?: (data: {
    name?: string;
    bio?: string;
    location?: string;
    website?: string;
  }) => Promise<void>;
}

export function CommunityProfile({
  userId,
  name,
  email,
  avatar,
  bio,
  location,
  website,
  joinedAt,
  isOwnProfile,
  onUpdateProfile,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editBio, setEditBio] = useState(bio || "");
  const [editLocation, setEditLocation] = useState(location || "");
  const [editWebsite, setEditWebsite] = useState(website || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onUpdateProfile?.({
        name: editName,
        bio: editBio,
        location: editLocation,
        website: editWebsite,
      });
      setIsEditing(false);
    } catch {
      // error handled by parent
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
  };

  if (isEditing) {
    return (
      <View className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3"><View className="flex items-center justify-between"><Text className="text-white font-bold text-lg">Modifier le profil</Text><Pressable onPress={() => setIsEditing(false)} className="text-white/40 transition-colors"><X size={18} /></Pressable></View><TextInput value={editName} onChangeText={(value) => setEditName(value)} placeholder="Nom" className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-purple-400 transition-colors placeholder:text-white/30" /><TextInput value={editBio} onChangeText={(value) => setEditBio(value)} placeholder="Bio" className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-purple-400 transition-colors placeholder:text-white/30" multiline textAlignVertical="top" /><TextInput value={editLocation} onChangeText={(value) => setEditLocation(value)} placeholder="Localisation" className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-purple-400 transition-colors placeholder:text-white/30" /><TextInput value={editWebsite} onChangeText={(value) => setEditWebsite(value)} placeholder="Site web" className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-purple-400 transition-colors placeholder:text-white/30" /><Pressable onPress={handleSave} disabled={isLoading || !editName.trim()} className="w-full py-2.5 rounded-xl text-white font-medium bg-gradient-to-r from-purple-500 to-indigo-500 transition-opacity disabled:opacity-50">{isLoading ? "Enregistrement..." : "Enregistrer"}</Pressable></View>
    );
  }

  return (
    <View className="p-4 rounded-2xl bg-white/5 border border-white/5"><View className="flex items-start gap-3">{avatar ? (
          <Image className="w-16 h-16 rounded-full object-cover flex-shrink-0 border-2 border-purple-500/30" source={{ uri: avatar }} accessibilityLabel={name} />
        ) : (
          <View className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-purple-500 to-indigo-500"><User size={28} className="text-white" /></View>
        )}<View className="flex-1 min-w-0"><View className="flex items-center gap-2"><Text className="text-white font-bold text-xl">{name}</Text>{isOwnProfile && (
              <Pressable onPress={() => setIsEditing(true)} className="p-1.5 rounded-lg text-white/40 transition-colors"><Edit2 size={14} /></Pressable>
            )}</View>{bio && <Text className="text-white/60 text-sm mt-1">{bio}</Text>}<View className="flex flex-wrap gap-2 mt-2 text-xs text-white/40">{location && (
              <View className="flex items-center gap-0.5"><MapPin size={12} />{location}</View>
            )}{website && (
              <View className="flex items-center gap-0.5"><Globe size={12} /><Pressable className="text-purple-400 transition-colors" onPress={(e) => e.stopPropagation()} data-href={website}>{website.replace(/^https?:\/\//, "")}</Pressable></View>
            )}{email && (
              <View className="flex items-center gap-0.5"><Mail size={12} />{email}</View>
            )}</View></View></View><View className="mt-3 pt-3 border-t border-white/5 text-xs text-white/30"><Calendar size={12} className="inline mr-1" /><Text>Membre depuis</Text>{formatDate(joinedAt)}</View></View>
  );
}
