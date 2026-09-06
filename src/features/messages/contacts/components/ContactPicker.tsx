import { View, Text, Pressable, Image, TextInput } from "react-native";
// src/features/messages/contacts/components/ContactPicker.tsx

import { useMemo, useState } from "react";

import type { Id } from "../../../../../convex/_generated/dataModel";

import { useContacts } from "../hooks/useContacts";

import type { Contact, ContactId } from "../services/contacts.service";

export interface ContactPickerProps {
  open?: boolean;

  conversationId?: Id<"conversations">;

  onClose?: () => void;

  onSelect?: (contact: Contact) => void;

  onSend?: (contact: Contact) => void | Promise<void>;

  multiSelect?: boolean;

  maxSelection?: number;
}

function ContactAvatar({
  contact,
  size = 44,
}: {
  contact: Contact;
  size?: number;
}) {
  if (contact.avatar) {
    return (
      <Image
       
       
        style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0 }}
       source={{ uri: contact.avatar }} accessibilityLabel={contact.name}/>
    );
  }

  return (
    <View
      style={{ width: size, height: size, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0 }}
    >
      {contact.name.charAt(0).toUpperCase()}
    </View>
  );
}

export function ContactPicker({
  open = true,
  onClose,
  onSelect,
  onSend,
  multiSelect = false,
  maxSelection = 10,
}: ContactPickerProps) {
  const [search, setSearch] = useState("");

  const [selectedIds, setSelectedIds] = useState<ContactId[]>([]);

  const { contacts, isLoading } = useContacts({
    search,
    limit: 50,
    enabled: open,
  });

  const selectedContacts = useMemo(
    () => contacts.filter((contact) => selectedIds.includes(contact._id)),
    [contacts, selectedIds],
  );

  if (!open) {
    return null;
  }

  const handleSelect = (contact: Contact) => {
    if (!multiSelect) {
      onSelect?.(contact);
      return;
    }

    setSelectedIds((current) => {
      if (current.includes(contact._id)) {
        return current.filter((id) => id !== contact._id);
      }

      if (current.length >= maxSelection) {
        return current;
      }

      return [...current, contact._id];
    });
  };

  const handleSend = async () => {
    if (multiSelect) {
      for (const contact of selectedContacts) {
        await onSend?.(contact);
      }

      setSelectedIds([]);
      return;
    }

    const contact = contacts[0];

    if (contact) {
      await onSend?.(contact);
    }
  };

  return (
    <View
      accessibilityRole="dialog"
      aria-modal="true"
      style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backgroundColor: "rgba(0,0,0,0.55)" }}
    >
      <View
        style={{ width: "100%", maxWidth: 460, maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden", borderRadius: 20, backgroundColor: "#fff" }}
      >
        {/* HEADER */}
        <View
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", borderBottomStyle: "solid" }}
        >
          <View>
            <Text
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              Partager un contact
            </Text>

            <Text
              style={{
                margin: "4px 0 0",
                color: "#64748b",
                fontSize: 12,
              }}
            >
              Recherchez un utilisateur DébrouillePro
            </Text>
          </View>

          {onClose && (
            <Pressable
             
              onPress={onClose}
              accessibilityLabel="Fermer"
              style={{ width: 34, height: 34, borderWidth: 0, borderRadius: "50%", backgroundColor: "#f1f5f9" }}
            >
              <Text>×</Text></Pressable>
          )}
        </View>

        {/* SEARCH */}
        <View
          style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", borderBottomStyle: "solid" }}
        >
          <TextInput
            value={search}
            onChangeText={(text) => setSearch(text)}
            placeholder="Nom, téléphone ou email..."
            autoFocus
            style={{ width: "100%", paddingVertical: 11, paddingHorizontal: 13, borderRadius: 12, borderWidth: 1, borderColor: "#dbe1ea", borderStyle: "solid", fontSize: 14 }}
          />
        </View>

        {/* LIST */}
        <View
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: 8,
          }}
        >
          {isLoading ? (
            <View
              style={{ padding: 30 }}
            >
              <Text>Recherche des contacts...</Text></View>
          ) : contacts.length === 0 ? (
            <View
              style={{ padding: 35 }}
            >
              <View
                style={{ marginBottom: 8 }}
              >
                <Text>👤</Text></View>
              <Text>Aucun contact trouvé.</Text></View>
          ) : (
            contacts.map((contact) => {
              const selected = selectedIds.includes(contact._id);

              return (
                <Pressable
                  key={contact._id}
                 
                  onPress={() => handleSelect(contact)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: 11, borderWidth: 0, borderRadius: 13, backgroundColor: selected ? "#f0fdf4" : "#fff" }}
                >
                  <ContactAvatar contact={contact} />

                  <View
                    style={{
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <View
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <strong
                        style={{
                          fontSize: 14,
                          color: "#111827",
                        }}
                      >
                        {contact.name}
                      </strong>

                      {contact.isOnline && (
                        <Text
                          style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#22c55e" }}
                        />
                      )}
                    </View>

                    <View
                      style={{ marginTop: 3, overflow: "hidden" }}
                    >
                      {contact.profession ||
                        contact.city ||
                        contact.phone ||
                        contact.email ||
                        "Utilisateur DébrouillePro"}
                    </View>
                  </View>

                  {multiSelect && (
                    <Text
                      style={{ width: 22, height: 22, borderRadius: "50%", display: "grid", placeItems: "center", borderWidth: 2, borderColor: "#cbd5e1", borderStyle: "solid", backgroundColor: selected ? "#16a34a" : "#fff", color: "#fff", fontSize: 12, fontWeight: 800 }}
                    >
                      {selected ? "✓" : ""}
                    </Text>
                  )}
                </Pressable>
              );
            })
          )}
        </View>

        {/* FOOTER MULTI */}
        {multiSelect && (
          <View
            style={{ display: "flex", alignItems: "center", gap: 10, padding: 14, borderTopWidth: 1, borderTopColor: "#e5e7eb", borderTopStyle: "solid" }}
          >
            <Text
              style={{
                flex: 1,
                color: "#64748b",
                fontSize: 13,
              }}
            >
              {selectedIds.length} <Text>contact</Text>{selectedIds.length > 1 ? "s" : ""} <Text>sélectionné</Text>{selectedIds.length > 1 ? "s" : ""}
            </Text>

            <Pressable
              type="button"
              disabled={selectedContacts.length === 0}
              onPress={() => void handleSend()}
              style={{ paddingVertical: 10, paddingHorizontal: 16, borderWidth: 0, borderRadius: 11, backgroundColor: selectedContacts.length ? "#111827" : "#e2e8f0" }}
            >
              <Text>Envoyer</Text></Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

export default ContactPicker;
