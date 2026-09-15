// src/features/immo/components/PropertyOwner.tsx
import React from "react";
import {
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
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
  ownerName?: string;
  ownerAvatar?: string;
  ownerPhone?: string;
  ownerId?: string;
  createdAt: number;
  rating?: number;
  reviewCount?: number;
  onContact?: (method: "call" | "whatsapp" | "sms") => void;
  onContactMessage?: () => void;
}

function timeAgo(timestamp: number): string {
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
}

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
  // ✅ expo-router remplace react-router-dom
  const router = useRouter();

  if (!ownerName) return null;

  const handleCall = () => {
    if (onContact) {
      onContact("call");
      return;
    }
    if (ownerPhone) {
      void Linking.openURL(`tel:${ownerPhone}`);
    }
  };

  const handleWhatsApp = () => {
    if (onContact) {
      onContact("whatsapp");
      return;
    }
    if (ownerPhone) {
      const cleanPhone = ownerPhone.replace(/\D/g, "");
      void Linking.openURL(`https://wa.me/${cleanPhone}`);
    }
  };

  const handleSMS = () => {
    if (onContact) {
      onContact("sms");
      return;
    }
    if (ownerPhone) {
      void Linking.openURL(`sms:${ownerPhone}`);
    }
  };

  const handleContactMessage = () => {
    if (onContactMessage) {
      onContactMessage();
      return;
    }
    if (ownerId) {
      // ✅ expo-router : push avec params
      router.push({
        pathname: "/messages/new",
        params: { userId: ownerId },
      });
    }
  };

  const handleViewProfile = () => {
    if (ownerId) {
      router.push(`/profile/${ownerId}`);
    }
  };

  const displayName = ownerName || "Propriétaire";

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Propriétaire</Text>

      {/* Row : avatar + infos */}
      <View style={styles.headerRow}>
        {ownerAvatar ? (
          <Image
            source={{ uri: ownerAvatar }}
            style={styles.avatar}
            accessibilityLabel={displayName}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <User size={20} color="#FB923C" />
          </View>
        )}

        <View style={styles.infoColumn}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {displayName}
            </Text>
            {ownerId && (
              <Pressable onPress={handleViewProfile} hitSlop={6}>
                <ExternalLink size={14} color="rgba(255,255,255,0.3)" />
              </Pressable>
            )}
          </View>

          {/* ✅ Rangée d'infos : icônes et textes dans des View, pas dans Text */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Star size={12} color="#FACC15" fill="#FACC15" />
              <Text style={styles.metaText}>{rating.toFixed(1)}</Text>
            </View>
            <Text style={styles.metaSeparator}>·</Text>
            <Text style={styles.metaText}>{reviewCount} avis</Text>
            <Text style={styles.metaSeparator}>·</Text>
            <View style={styles.metaItem}>
              <Clock size={10} color="rgba(255,255,255,0.4)" />
              <Text style={styles.metaText}>{timeAgo(createdAt)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        {ownerId && (
          <Pressable
            onPress={handleContactMessage}
            style={({ pressed }) => [
              styles.actionButton,
              styles.actionBlue,
              pressed && styles.actionPressed,
            ]}
          >
            <Mail size={14} color="#60A5FA" />
            <Text style={[styles.actionText, { color: "#60A5FA" }]}>
              Contacter
            </Text>
          </Pressable>
        )}

        {ownerPhone && (
          <>
            <Pressable
              onPress={handleCall}
              style={({ pressed }) => [
                styles.actionButton,
                styles.actionGreen,
                pressed && styles.actionPressed,
              ]}
            >
              <Phone size={14} color="#34D399" />
              <Text style={[styles.actionText, { color: "#34D399" }]}>
                Appeler
              </Text>
            </Pressable>

            <Pressable
              onPress={handleWhatsApp}
              style={({ pressed }) => [
                styles.actionButton,
                styles.actionWhatsApp,
                pressed && styles.actionPressed,
              ]}
            >
              <MessageCircle size={14} color="#25D366" />
              <Text style={[styles.actionText, { color: "#25D366" }]}>
                WhatsApp
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSMS}
              style={({ pressed }) => [
                styles.actionButton,
                styles.actionBlue,
                pressed && styles.actionPressed,
              ]}
            >
              <MessageSquare size={14} color="#60A5FA" />
              <Text style={[styles.actionText, { color: "#60A5FA" }]}>SMS</Text>
            </Pressable>
          </>
        )}

        {!ownerId && !ownerPhone && (
          <Text style={styles.noContactText}>Contact non disponible</Text>
        )}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  sectionLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(251,146,60,0.2)",
  },
  infoColumn: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    color: "#FFFFFF",
    fontWeight: "500",
    fontSize: 14,
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
  },
  metaSeparator: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingTop: 4,
  },
  actionButton: {
    flex: 1,
    minWidth: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.8,
  },
  actionBlue: {
    backgroundColor: "rgba(59,130,246,0.15)",
    borderColor: "rgba(59,130,246,0.15)",
  },
  actionGreen: {
    backgroundColor: "rgba(16,185,129,0.15)",
    borderColor: "rgba(16,185,129,0.15)",
  },
  actionWhatsApp: {
    backgroundColor: "rgba(37,211,102,0.15)",
    borderColor: "rgba(37,211,102,0.15)",
  },
  actionText: {
    fontSize: 12,
    fontWeight: "500",
  },
  noContactText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
    width: "100%",
    paddingVertical: 4,
  },
});
