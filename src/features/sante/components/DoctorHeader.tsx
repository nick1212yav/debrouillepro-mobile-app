import { View, Text } from "react-native";
// src/features/sante/components/DoctorHeader.tsx
import {
  Star,
  MapPin,
  Phone,
  Video,
  MessageCircle,
  Calendar,
  CheckCircle,
} from "lucide-react-native";
import type { Doctor } from "../types/doctor.types";

export interface DoctorHeaderProps {
  doctor: Doctor;
  onCall?: () => void;
  onVideoCall?: () => void;
  onChat?: () => void;
  onBooking?: () => void;
}

export function DoctorHeader({
  doctor,
  onCall,
  onVideoCall,
  onChat,
  onBooking,
}: DoctorHeaderProps) {
  return (
    <View className="space-y-3">
      <View className="flex items-start justify-between">
        <View>
          <View className="flex items-center gap-2">
            <Text className="text-white text-xl font-bold">{doctor.name}</Text>
            {doctor.verified && (
              <CheckCircle size={16} className="text-blue-400" />
            )}
          </View>
          <Text className="text-red-400 text-sm font-medium capitalize">
            {doctor.specialty}
          </Text>
          <View className="flex items-center gap-3 mt-1 text-xs text-white/40">
            <Text className="flex items-center gap-0.5">
              <Star size={12} className="text-yellow-400 fill-yellow-400" />
              {doctor.rating.toFixed(1)} ({doctor.reviewCount} avis)
            </Text>
            {doctor.distance !== undefined && (
              <Text>· {doctor.distance.toFixed(1)} km</Text>
            )}
            {doctor.address && (
              <Text className="flex items-center gap-0.5">
                <MapPin size={12} /> {doctor.address}
              </Text>
            )}
          </View>
        </View>
        <View className="text-right">
          <Text className="text-lg font-black text-white">
            {doctor.fees} {doctor.currency}
          </Text>
          <Text
            className={`text-xs ${doctor.online ? "text-green-400" : "text-white/30"}`}
          >
            {doctor.online ? "En ligne" : "Hors ligne"}
          </Text>
        </View>
      </View>
      <View className="flex flex-wrap gap-2">
        {onCall && doctor.phone && (
          <Pressable
            onPress={onCall}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/20"
          >
            <Phone size={14} /> <Text>Appeler</Text></Pressable>
        )}
        {onVideoCall && doctor.videoUrl && (
          <Pressable
            onPress={onVideoCall}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/20"
          >
            <Video size={14} /> <Text>Visio</Text></Pressable>
        )}
        {onChat && doctor.userId && (
          <Pressable
            onPress={onChat}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/20"
          >
            <MessageCircle size={14} /> <Text>Chat</Text></Pressable>
        )}
        {onBooking && (
          <Pressable
            onPress={onBooking}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-red-500 text-white"
          >
            <Calendar size={14} /> <Text>Prendre RDV</Text></Pressable>
        )}
      </View>
    </View>
  );
}
