import { View, Text, Pressable, Image } from "react-native";

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
      <Image style={{ width: 48, height: 48, borderRadius: 50, flexShrink: 0 }} source={{ uri: avatar }} accessibilityLabel={name} />
    );
  }

  return (
    <View style={{ width: 48, height: 48, borderRadius: 50, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 18, flexShrink: 0 }}>{name.charAt(0).toUpperCase()}</View>
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
      <View style={{ padding: 12, borderRadius: 14, backgroundColor: "#f8fafc", fontSize: 13 }}><Text>Contact indisponible</Text></View>
    );
  }

  return (
    <View style={{ width: "100%", maxWidth: 380, overflow: "hidden", borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", borderStyle: "solid", backgroundColor: "#fff" }}>{}<Pressable onPress={() => onOpenProfile?.(contact._id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: 14, borderWidth: 0, backgroundColor: "#fff", textAlign: "left" }}><Avatar name={contact.name} avatar={contact.avatar} /><View style={{
            minWidth: 0,
            flex: 1,
          }}><View style={{ fontWeight: 800, fontSize: 15 }}>{contact.name}</View>{contact.profession && (
            <View style={{ marginTop: 3, fontSize: 12 }}>
              {contact.profession}
            </View>
          )}{contact.city && (
            <View style={{ marginTop: 2, fontSize: 11 }}>
              {contact.city}
            </View>
          )}</View></Pressable>{}{contact.phone && (
        <View style={{ paddingTop: 0, paddingHorizontal: 14, paddingBottom: 11, fontSize: 13 }}>
          📞 {contact.phone}
        </View>
      )}{}<View style={{ display: "grid", borderTopWidth: 1, borderTopColor: "#e2e8f0" }}>{onMessage && (
          <Pressable onPress={() => onMessage(contact._id)} style={{ padding: 11, borderWidth: 0, backgroundColor: "#fff", fontWeight: 700, fontSize: 12 }}>
            💬 Message
          </Pressable>
        )}{onCall && contact.phone && (
          <Pressable onPress={() => onCall(contact.phone)} style={{ padding: 11, borderWidth: 0, borderLeftWidth: 1, borderLeftColor: "#e2e8f0", backgroundColor: "#fff", fontWeight: 700, fontSize: 12 }}>
            📞 Appeler
          </Pressable>
        )}</View></View>
  );
}

export default ContactMessage;
