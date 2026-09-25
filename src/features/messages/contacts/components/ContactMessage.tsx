import { View, Text, Pressable, Image, StyleSheet } from "react-native";

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
  if (avatar) {
    return (
      <Image
        style={styles.avatarImage}
        source={{ uri: avatar }}
        accessibilityLabel={name}
      />
    );
  }

  return (
    <View style={styles.avatarPlaceholder}>
      <Text style={styles.avatarInitial}>
        {name.charAt(0).toUpperCase()}
      </Text>
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
      <View style={styles.unavailableContainer}>
        <Text style={styles.unavailableText}>Contact indisponible</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => onOpenProfile?.(contact._id)}
        style={styles.header}
      >
        <Avatar name={contact.name} avatar={contact.avatar} />
        <View style={styles.headerText}>
          <Text style={styles.name}>{contact.name}</Text>
          {contact.profession && (
            <Text style={styles.profession}>{contact.profession}</Text>
          )}
          {contact.city && (
            <Text style={styles.city}>{contact.city}</Text>
          )}
        </View>
      </Pressable>

      {contact.phone && (
        <View style={styles.phoneRow}>
          <Text style={styles.phoneText}>📞 {contact.phone}</Text>
        </View>
      )}

      <View style={styles.actions}>
        {onMessage && (
          <Pressable
            onPress={() => onMessage(contact._id)}
            style={styles.actionButton}
          >
            <Text style={styles.actionText}>💬 Message</Text>
          </Pressable>
        )}
        {onCall && contact.phone && (
          <Pressable
            onPress={() => onCall(contact.phone)}
            style={[styles.actionButton, styles.actionButtonRight]}
          >
            <Text style={styles.actionText}>📞 Appeler</Text>
          </Pressable>
        )}
      </View>
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
    backgroundColor: "#fff",
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
  headerText: {
    flex: 1,
  },
  name: {
    fontWeight: "800",
    fontSize: 15,
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
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontWeight: "800",
    fontSize: 18,
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
    padding: 11,
    alignItems: "center",
  },
  actionButtonRight: {
    borderLeftWidth: 1,
    borderLeftColor: "#e2e8f0",
  },
  actionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
});

export default ContactMessage;