import { Image, Pressable, StyleSheet, Text, View } from "react-native";

// src/features/messages/contacts/components/ContactMessage.tsx

import type { Id } from "../../../../../convex/_generated/dataModel";

import type {
  Contact,
  ContactMessage as ContactMessageData,
} from "../services/contacts.service";

export interface ContactMessageProps {
  message: ContactMessageData;
  onOpenProfile?: (userId: Id<"users">) => void;
  onMessage?: (userId: Id<"users">) => void;
  onCall?: (phone?: string) => void;
}

function Avatar({ name, avatar }: { name: string; avatar?: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  if (avatar) {
    return (
      <Image
        style={styles.avatarImage}
        source={{ uri: avatar }}
        accessibilityLabel={`Photo de profil de ${name}`}
      />
    );
  }

  return (
    <View
      style={styles.avatarPlaceholder}
      accessibilityLabel={`Avatar de ${name}`}
    >
      <Text style={styles.avatarInitial}>{initial}</Text>
    </View>
  );
}

function getContactData(message: ContactMessageData): Contact | null {
  if (!message.metadata || message.metadata.type !== "contact") {
    return null;
  }

  return {
    _id: message.metadata.contactId,
    name: message.metadata.name,
    phone: message.metadata.phone,
    avatar: message.metadata.avatar,
    email: message.metadata.email,
    profession: message.metadata.profession,
    city: message.metadata.city,
  };
}

export function ContactMessage({
  message,
  onOpenProfile,
  onMessage,
  onCall,
}: ContactMessageProps) {
  const contact = getContactData(message);

  if (!contact) {
    return (
      <View
        style={styles.unavailableContainer}
        accessibilityRole="text"
        accessibilityLabel="Contact indisponible"
      >
        <Text style={styles.unavailableText}>Contact indisponible</Text>
      </View>
    );
  }

  const displayName = contact.name.trim() || "Utilisateur";

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => onOpenProfile?.(contact._id)}
        disabled={!onOpenProfile}
        accessibilityRole="button"
        accessibilityLabel={`Ouvrir le profil de ${displayName}`}
        accessibilityState={{ disabled: !onOpenProfile }}
        style={({ pressed }) => [
          styles.header,
          pressed && onOpenProfile ? styles.headerPressed : undefined,
        ]}
      >
        <Avatar name={displayName} avatar={contact.avatar} />

        <View style={styles.headerText}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
            {displayName}
          </Text>

          {contact.profession ? (
            <Text
              style={styles.profession}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {contact.profession}
            </Text>
          ) : null}

          {contact.city ? (
            <Text style={styles.city} numberOfLines={1} ellipsizeMode="tail">
              {contact.city}
            </Text>
          ) : null}
        </View>
      </Pressable>

      {contact.phone ? (
        <View style={styles.phoneRow}>
          <Text style={styles.phoneText} numberOfLines={1} ellipsizeMode="tail">
            📞 {contact.phone}
          </Text>
        </View>
      ) : null}

      {onMessage || (onCall && contact.phone) ? (
        <View style={styles.actions}>
          {onMessage ? (
            <Pressable
              onPress={() => onMessage(contact._id)}
              accessibilityRole="button"
              accessibilityLabel={`Envoyer un message à ${displayName}`}
              style={({ pressed }) => [
                styles.actionButton,
                pressed ? styles.actionButtonPressed : undefined,
              ]}
            >
              <Text style={styles.actionText}>💬 Message</Text>
            </Pressable>
          ) : null}

          {onCall && contact.phone ? (
            <Pressable
              onPress={() => onCall(contact.phone)}
              accessibilityRole="button"
              accessibilityLabel={`Appeler ${displayName}`}
              style={({ pressed }) => [
                styles.actionButton,
                onMessage ? styles.actionButtonRight : undefined,
                pressed ? styles.actionButtonPressed : undefined,
              ]}
            >
              <Text style={styles.actionText}>📞 Appeler</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 380,
    overflow: "hidden",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },

  unavailableContainer: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
  },

  unavailableText: {
    fontSize: 13,
    color: "#4b5563",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },

  headerPressed: {
    opacity: 0.72,
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  name: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },

  profession: {
    marginTop: 3,
    fontSize: 12,
    color: "#4b5563",
  },

  city: {
    marginTop: 2,
    fontSize: 11,
    color: "#6b7280",
  },

  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },

  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
  },

  avatarInitial: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },

  phoneRow: {
    paddingHorizontal: 14,
    paddingBottom: 11,
  },

  phoneText: {
    fontSize: 13,
    color: "#4b5563",
  },

  actions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },

  actionButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 11,
  },

  actionButtonRight: {
    borderLeftWidth: 1,
    borderLeftColor: "#e2e8f0",
  },

  actionButtonPressed: {
    opacity: 0.65,
    backgroundColor: "#f8fafc",
  },

  actionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
});

export default ContactMessage;
