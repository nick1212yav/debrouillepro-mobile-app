import { View, Pressable, Image, Text, Linking, GestureResponderEvent } from "react-native";

// src/features/service/components/ServiceCard.tsx
import { useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";
import {
  Star,
  MapPin,
  Clock,
  Phone,
  Calendar,
  Wrench,
  ShieldCheck,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Award,
  ChevronRight,
} from "lucide-react-native";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { ServiceProvider } from "../types";

interface Props {
  service: ServiceProvider;
  index?: number;
  phone?: string;
  onClick?: () => void;
  onCall?: (phone: string) => void;
  onBook?: (serviceId: string) => void;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

// Couleurs par catégorie
const CATEGORY_COLORS: Record<string, string> = {
  Dépannage: "#F97316",
  Beauté: "#EC4899",
  Livraison: "#3B82F6",
  Éducation: "#10B981",
  Photo: "#8B5CF6",
  "Bien-être": "#14B8A6",
  Événementiel: "#F59E0B",
  Autre: "#6B7280",
};

export function ServiceCard({
  service,
  index = 0,
  phone,
  onClick,
  onCall,
  onBook,
  onLike,
  onComment,
  onShare,
  onBookmark,
  isLiked = false,
  isBookmarked = false,
}: Props) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [liked, setLiked] = useState(isLiked);
  const [bookmarked, setBookmarked] = useState(isBookmarked);

  const color = CATEGORY_COLORS[service.category] || "#F97316";
  const firstImage = service.imageUrl;

  // Formatage du temps
  const timeAgo = service.createdAt
    ? formatDistanceToNow(new Date(service.createdAt), {
        addSuffix: true,
        locale: fr,
      })
    : "";

  // Handlers
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/service/${service._id}`);
    }
  }, [onClick, navigate, service._id]);

  const handleCall = (e: GestureResponderEvent) => {
    e.stopPropagation();
    if (onCall && phone) {
      onCall(phone);
    } else if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleBook = (e: GestureResponderEvent) => {
    e.stopPropagation();
    if (onBook) {
      onBook(service._id);
    } else {
      navigate(`/service/${service._id}?tab=booking`);
    }
  };

  const handleLike = (e: GestureResponderEvent) => {
    e.stopPropagation();
    setLiked(!liked);
    onLike?.();
  };

  const handleBookmark = (e: GestureResponderEvent) => {
    e.stopPropagation();
    setBookmarked(!bookmarked);
    onBookmark?.();
  };

  const handleShare = (e: GestureResponderEvent) => {
    e.stopPropagation();
    onShare?.();
  };

  const handleComment = (e: GestureResponderEvent) => {
    e.stopPropagation();
    onComment?.();
  };

  // Rendu des badges
  const renderBadges = () => {
    const badges = [];
    if (service.urgent) {
      badges.push(
        <Text key="urgent" className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-500/90 text-white backdrop-blur-sm border border-red-400/30 animate-pulse">⚡ Urgence
        </Text>,
      );
    }
    if (service.verified) {
      badges.push(
        <Text key="verified" className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/90 text-white backdrop-blur-sm border border-emerald-400/30 flex items-center gap-1"><ShieldCheck size={10} />Vérifié
        </Text>,
      );
    }
    if (service.available) {
      badges.push(
        <Text key="available" className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-500/90 text-white backdrop-blur-sm border border-blue-400/30">Disponible
        </Text>,
      );
    }
    if (service.online) {
      badges.push(
        <Text key="online" className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-green-500/90 text-white backdrop-blur-sm border border-green-400/30 flex items-center gap-1"><Text className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />En ligne
        </Text>,
      );
    }
    return badges.slice(0, 3);
  };

  const badges = renderBadges();

  return (
    <View initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{
        delay: 0.05 + index * 0.04,
        type: "spring",
        damping: 20,
        stiffness: 300,
      }} onHoverStart={() => setIsHovered(true)} onHoverEnd={() => setIsHovered(false)} onPress={handleClick} className="relative rounded-3xl overflow-hidden transition-all duration-300" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid", boxShadow: isHovered
                ? `0 20px 60px rgba(0,0,0,0.3), 0 0 40px ${color}15`
                : "0 4px 20px rgba(0,0,0,0.1)", transform: isHovered ? [{ scale: 1.015 }] : [{ scale: 1 }] }}>
      {/* Glow effect */}
      <View className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-500" style={{ opacity: isHovered ? 1 : 0 }} />

      {/* Image */}
      <View className="relative aspect-[16/9] bg-black/20 overflow-hidden">{firstImage ? (
          <Image src={firstImage} alt={service.name} className="w-full h-full object-cover" style={{ transform: isHovered ? [{ scale: 1.05 }] : [{ scale: 1 }] }}  />
        ) : (
          <View className="w-full h-full flex items-center justify-center" style={{ backgroundColor: `${color}22` }}><Wrench size={48} className="opacity-30" style={{ color }} /></View>
        )}{}<View className="absolute inset-0" style={{  }} />{}<View className="absolute top-3 left-3 flex flex-wrap gap-1.5">{badges}</View>{}{service.price && (
          <View className="absolute bottom-3 left-3"><Text className="px-3 py-1.5 rounded-xl text-sm font-bold backdrop-blur-md" style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#FCD34D", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>{service.price}{service.currency || "USD"}</Text></View>
        )}{}<View className="absolute bottom-3 right-3 px-2.5 py-1 rounded-xl text-[10px] font-bold backdrop-blur-sm" style={{ backgroundColor: `${color}cc`, boxShadow: `0 4px 12px ${color}40` }}>{service.category}</View>{}<Pressable onPress={handleBookmark} className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-95" style={{ backgroundColor: "rgba(0,0,0,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}><Bookmark size={16} className={
              bookmarked ? "fill-amber-400 text-amber-400" : "text-white/80"
            } /></Pressable></View>

      {/* Contenu */}
      <View className="p-4 space-y-3">{}<View className="flex items-start justify-between gap-3"><View className="flex-1 min-w-0"><View className="flex items-center gap-2 mb-0.5"><Text className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>{service.category}</Text>{timeAgo && (
                <>
                  <Text className="text-white/20">·</Text>
                  <Text className="text-[9px] text-white/30">{timeAgo}</Text>
                </>
              )}</View><Text className="text-white font-bold text-base leading-tight">{service.name}</Text><Text className="text-sm text-white/60 truncate">{service.specialty}</Text></View><View className="flex items-center gap-1 flex-shrink-0"><Star size={14} className="text-yellow-400 fill-yellow-400" /><Text className="text-white font-bold text-sm">{service.rating?.toFixed(1) || "4.8"}</Text><Text className="text-white/40 text-xs">({service.reviewCount || 0})
            </Text></View></View>{}{service.skills && service.skills.length > 0 && (
          <View className="flex flex-wrap gap-1.5">{service.skills.slice(0, 4).map((skill) => (
              <Text key={skill} className="px-2.5 py-0.5 rounded-full text-[10px] font-medium" style={{ backgroundColor: `${color}15`, color: color, borderStyle: "solid" }}>{skill}</Text>
            ))}{service.skills.length > 4 && (
              <Text className="text-[9px] text-white/30">+{service.skills.length - 4}</Text>
            )}</View>
        )}{}<View className="flex flex-wrap items-center gap-3 text-xs text-white/50">{service.location && (
            <Text className="flex items-center gap-1"><MapPin size={12} className="text-white/30" /><Text className="truncate max-w-[150px]">{service.location}</Text></Text>
          )}{service.responseTime && (
            <Text className="flex items-center gap-1"><Clock size={12} className="text-white/30" />Réponse {service.responseTime}</Text>
          )}{service.experience && (
            <Text className="flex items-center gap-1"><Award size={12} className="text-white/30" />{service.experience}</Text>
          )}</View></View>

      {/* Actions */}
      <View className="px-4 py-2.5 border-t border-white/5 flex items-center justify-between flex-wrap gap-2"><View className="flex items-center gap-1">{}<Pressable whileTap={{ scale: 0.85 }} onPress={handleLike} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              liked
                ? "text-rose-400 bg-rose-500/10"
                : "text-white/40 hover:text-white hover:bg-white/5"
            }`}><Heart size={14} className={liked ? "fill-rose-400" : ""} /><Text>0</Text></Pressable>{}<Pressable whileTap={{ scale: 0.85 }} onPress={handleComment} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/40 transition-all"><MessageCircle size={14} /></Pressable>{}<Pressable whileTap={{ scale: 0.85 }} onPress={handleShare} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/40 transition-all"><Share2 size={14} /></Pressable></View><View className="flex items-center gap-1.5">{}{phone && (
            <Pressable whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onPress={handleCall} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white bg-emerald-500/80 transition-all">
              <Phone size={12} />
              <Text>Appeler</Text>
            </Pressable>
          )}{}<Pressable whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onPress={handleBook} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all" style={{ boxShadow: `0 4px 12px ${color}40` }}><Calendar size={12} /><Text>Réserver</Text><ChevronRight size={12} className="opacity-60" /></Pressable></View></View>
    </View>
  );
}
