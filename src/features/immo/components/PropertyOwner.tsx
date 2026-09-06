import { useRouter } from "expo-router";
import { View, Text, Pressable, Image, Linking } from "react-native";
import {
  User,
  Star,
  Clock,
  Phone,
  MessageCircle,
  MessageSquare,
  ExternalLink,
  Mail,
} from "lucide-react-native";

interface Props {
  /** Nom du propriétaire */
  ownerName?: string;
  /** URL de l'avatar */
  ownerAvatar?: string;
  /** Numéro de téléphone (format international recommandé) */
  ownerPhone?: string;
  /** ID de l'utilisateur (pour naviguer vers son profil et ouvrir la messagerie) */
  ownerId?: string;
  /** Timestamp de création de l'annonce */
  createdAt: number;
  /** Note moyenne (sur 5) */
  rating?: number;
  /** Nombre d'avis */
  reviewCount?: number;
  /** Callback personnalisé pour le contact (remplace les actions par défaut) */
  onContact?: (method: "call" | "whatsapp" | "sms") => void;
  /** Callback personnalisé pour le message (remplace la navigation par défaut) */
  onContactMessage?: () => void;
}

/**
 * Composant Propriétaire
 * - Affiche les informations du propriétaire
 * - Actions : appel, WhatsApp, SMS, voir le profil, contacter (messagerie)
 * - Design cohérent avec le thème du module
 */
export function PropertyOwner({
  ownerName,
  ownerAvatar,
  ownerPhone,
  ownerId,
  createdAt,
  rating = 4.8,
  reviewCount = 24,
  onContact,
  onContactMessage,
}: Props) {
  const router = useRouter();

  if (!ownerName) return null;

  // Calcul du temps écoulé
  const timeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours} h`;
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Hier";
    if (days < 7) return `Il y a ${days} jours`;
    if (days < 30) return `Il y a ${Math.floor(days / 7)} semaines`;
    return `Il y a ${Math.floor(days / 30)} mois`;
  };

  // Actions de contact (téléphone, WhatsApp, SMS)
  const handleCall = () => {
    if (onContact) {
      onContact("call");
      return;
    }
    if (ownerPhone) {
      undefined.href = `tel:${ownerPhone}`;
    }
  };

  const handleWhatsApp = () => {
    if (onContact) {
      onContact("whatsapp");
      return;
    }
    if (ownerPhone) {
      const cleanPhone = ownerPhone.replace(/\D/g, "");
      Linking.openURL(String(`https://wa.me/${cleanPhone}`));
    }
  };

  const handleSMS = () => {
    if (onContact) {
      onContact("sms");
      return;
    }
    if (ownerPhone) {
      undefined.href = `sms:${ownerPhone}`;
    }
  };

  // Action "Contacter" → ouvre la messagerie vers le propriétaire
  const handleContactMessage = () => {
    if (onContactMessage) {
      onContactMessage();
      return;
    }
    if (ownerId) {
      router.push(`/messages/new?userId=${ownerId}`);
    }
  };

  const handleViewProfile = () => {
    if (ownerId) {
      router.push(`/profile/${ownerId}`);
    }
  };

  const displayName = ownerName || "Propriétaire";

  return (
    <View className="bg-white/5 rounded-2xl p-4 space-y-3">
      <Text className="text-[10px] text-white/40 uppercase tracking-wider">
        Propriétaire
      </Text>

      {/* Info principale */}
      <View className="flex items-center gap-3">
        {ownerAvatar ? (
          <Image
           
           
            className="w-12 h-12 rounded-full object-cover border-2 border-white/10"
           source={{ uri: ownerAvatar }} accessibilityLabel={displayName}/>
        ) : (
          <View className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500/30 to-orange-600/10">
            <User size={20} className="text-orange-400" />
          </View>
        )}

        <View className="flex-1 min-w-0">
          <View className="flex items-center gap-2">
            <Text className="text-white font-medium truncate">{displayName}</Text>
            {ownerId && (
              <Pressable
                onPress={handleViewProfile}
                className="text-white/30"
               
              >
                <ExternalLink size={14} />
              </Pressable>
            )}
          </View>

          <View className="flex items-center gap-2 text-xs text-white/40 flex-wrap">
            <Text className="flex items-center gap-1">
              <Star size={12} className="fill-yellow-400 text-yellow-400" />
              {rating.toFixed(1)}
            </Text>
            <Text>·</Text>
            <Text>{reviewCount} avis</Text>
            <Text>·</Text>
            <Text className="flex items-center gap-1">
              <Clock size={10} />
              {timeAgo(createdAt)}
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View className="flex flex-wrap gap-2 pt-1">
        {/* Bouton Contacter (messagerie) - s'affiche si ownerId est présent */}
        {ownerId && (
          <Pressable
            onPress={handleContactMessage}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium"
            style={{ backgroundColor: "rgba(59,130,246,0.15)", borderWidth: 1, borderColor: "rgba(59,130,246,0.15)", borderStyle: "solid" }}
          >
            <Mail size={14} />
            <Text>Contacter</Text></Pressable>
        )}

        {/* Appel - s'affiche si un numéro est disponible */}
        {ownerPhone && (
          <>
            <Pressable
              onPress={handleCall}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium"
              style={{ backgroundColor: "rgba(16,185,129,0.15)", borderWidth: 1, borderColor: "rgba(16,185,129,0.15)", borderStyle: "solid" }}
            >
              <Phone size={14} />
              <Text>Appeler</Text></Pressable>

            <Pressable
              onPress={handleWhatsApp}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium"
              style={{ backgroundColor: "rgba(37,211,102,0.15)", borderWidth: 1, borderColor: "rgba(37,211,102,0.15)", borderStyle: "solid" }}
            >
              <MessageCircle size={14} />
              <Text>WhatsApp</Text></Pressable>

            <Pressable
              onPress={handleSMS}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium"
              style={{ backgroundColor: "rgba(59,130,246,0.15)", borderWidth: 1, borderColor: "rgba(59,130,246,0.15)", borderStyle: "solid" }}
            >
              <MessageSquare size={14} />
              <Text>SMS</Text></Pressable>
          </>
        )}

        {/* Message si ni ownerId ni ownerPhone */}
        {!ownerId && !ownerPhone && (
          <View className="text-xs text-white/30 italic text-center w-full py-1">
            <Text>Contact non disponible</Text></View>
        )}
      </View>
    </View>
  );
}
