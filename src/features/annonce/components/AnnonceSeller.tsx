import { View, Text, Image, Pressable, Linking } from "react-native";
import {
  User,
  Star,
  Phone,
  MessageCircle,
  Mail,
  ExternalLink,
  Clock,
  CheckCircle,
} from "lucide-react-native";
import { useNavigate } from "react-router-dom";

interface Props {
  ownerName?: string;
  ownerAvatar?: string;
  ownerPhone?: string;
  ownerId?: string;
  createdAt: number;
  rating?: number;
  reviewCount?: number;
  isVerified?: boolean;
  onContact?: () => void;
}

export function AnnonceSeller({
  ownerName,
  ownerAvatar,
  ownerPhone,
  ownerId,
  createdAt,
  rating = 4.8,
  reviewCount = 24,
  isVerified = false,
  onContact,
}: Props) {
  const navigate = useNavigate();

  if (!ownerName) return null;

  const timeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Hier";
    if (days < 7) return `Il y a ${days} jours`;
    if (days < 30) return `Il y a ${Math.floor(days / 7)} semaines`;
    return `Il y a ${Math.floor(days / 30)} mois`;
  };

  const handleViewProfile = () => {
    if (ownerId) navigate(`/profile/${ownerId}`);
  };

  const handleCall = () => {
    if (ownerPhone) Linking.openURL(`tel:${ownerPhone}`);
  };

  const handleWhatsApp = () => {
    if (ownerPhone) {
      const clean = ownerPhone.replace(/\D/g, "");
      Linking.openURL(String(`https://wa.me/${clean}`));
    }
  };

  return (
    <View className="bg-white/5 rounded-2xl p-4 space-y-3"><Text className="text-[10px] text-white/40 uppercase tracking-wider">Vendeur
      </Text><View className="flex items-center gap-3">{ownerAvatar ? (
          <Image className="w-12 h-12 rounded-full object-cover border-2 border-white/10" source={{ uri: ownerAvatar }} accessibilityLabel={ownerName} />
        ) : (
          <View className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500/30 to-orange-600/10"><User size={20} className="text-orange-400" /></View>
        )}<View className="flex-1 min-w-0"><View className="flex items-center gap-2"><Text className="text-white font-medium truncate">{ownerName}</Text>{isVerified && (
              <CheckCircle size={14} className="text-blue-400 flex-shrink-0" />
            )}{ownerId && (
              <Pressable onPress={handleViewProfile} className="text-white/30 transition-colors"><ExternalLink size={14} /></Pressable>
            )}</View><View className="flex items-center gap-2 text-xs text-white/40 flex-wrap"><Text className="flex items-center gap-1"><Star size={12} className="fill-yellow-400 text-yellow-400" />{rating.toFixed(1)}</Text><Text>·</Text><Text>{reviewCount}avis</Text><Text>·</Text><Text className="flex items-center gap-1"><Clock size={10} />{timeAgo(createdAt)}</Text></View></View></View>{}<View className="flex flex-wrap gap-2 pt-1">{ownerId && (
          <Pressable onPress={onContact} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all active:scale-95" style={{ backgroundColor: "rgba(59,130,246,0.15)", borderWidth: 1, borderColor: "rgba(59,130,246,0.15)", borderStyle: "solid" }}>
            <Mail size={14} /> Contacter
          </Pressable>
        )}{ownerPhone && (
          <>
            <Pressable onPress={handleCall} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all active:scale-95" style={{ backgroundColor: "rgba(16,185,129,0.15)", borderWidth: 1, borderColor: "rgba(16,185,129,0.15)", borderStyle: "solid" }}>
              <Phone size={14} /> Appeler
            </Pressable>
            <Pressable onPress={handleWhatsApp} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all active:scale-95" style={{ backgroundColor: "rgba(37,211,102,0.15)", borderWidth: 1, borderColor: "rgba(37,211,102,0.15)", borderStyle: "solid" }}>
              <MessageCircle size={14} /> WhatsApp
            </Pressable>
          </>
        )}</View></View>
  );
}
