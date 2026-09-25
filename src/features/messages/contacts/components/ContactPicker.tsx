import {
  View,
  Text,
  Pressable,
  TextInput,
  Image,
  Modal,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

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
  const style = { width: size, height: size, borderRadius: size / 2 };

  if (contact.avatar) {
    return (
      <Image
        style={style}
        source={{ uri: contact.avatar }}
        accessibilityLabel={contact.name}
      />
    );
  }

  return (
    <View
      style={[
        style,
        styles.avatarPlaceholder,
        { borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.avatarInitial, { fontSize: size * 0.36 }]}>
        {contact.name.charAt(0).toUpperCase()}
      </Text>
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
    <Modal
      transparent
      visible={open}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.dialog}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Partager un contact</Text>
              <Text style={styles.subtitle}>
                Recherchez un utilisateur DébrouillePro
              </Text>
            </View>
            {onClose && (
              <Pressable
                onPress={onClose}
                accessibilityLabel="Fermer"
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.searchWrapper}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Nom, téléphone ou email..."
              autoFocus
              style={styles.searchInput}
            />
          </View>

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {isLoading ? (
              <View style={styles.stateBlock}>
                <ActivityIndicator size="small" color="#64748b" />
                <Text style={styles.stateText}>Recherche des contacts...</Text>
              </View>
            ) : contacts.length === 0 ? (
              <View style={styles.stateBlock}>
                <Text style={styles.stateIcon}>👤</Text>
                <Text style={styles.stateText}>Aucun contact trouvé.</Text>
              </View>
            ) : (
              contacts.map((contact) => {
                const selected = selectedIds.includes(contact._id);

                return (
                  <Pressable
                    key={contact._id}
                    onPress={() => handleSelect(contact)}
                    style={[
                      styles.contactRow,
                      selected && styles.contactRowSelected,
                    ]}
                  >
                    <ContactAvatar contact={contact} />
                    <View style={styles.contactInfo}>
                      <View style={styles.contactNameRow}>
                        <Text style={styles.contactName}>{contact.name}</Text>
                        {contact.isOnline && (
                          <View style={styles.onlineDot} />
                        )}
                      </View>
                      <Text style={styles.contactMeta} numberOfLines={1}>
                        {contact.profession ||
                          contact.city ||
                          contact.phone ||
                          contact.email ||
                          "Utilisateur DébrouillePro"}
                      </Text>
                    </View>
                    {multiSelect && (
                      <View
                        style={[
                          styles.checkbox,
                          selected && styles.checkboxChecked,
                        ]}
                      >
                        {selected && (
                          <Text style={styles.checkboxText}>✓</Text>
                        )}
                      </View>
                    )}
                  </Pressable>
                );
              })
            )}
          </ScrollView>

          {multiSelect && (
            <View style={styles.footer}>
              <Text style={styles.footerCount}>
                {selectedIds.length} contact
                {selectedIds.length > 1 ? "s" : ""} sélectionné
                {selectedIds.length > 1 ? "s" : ""}
              </Text>
              <Pressable
                disabled={selectedContacts.length === 0}
                onPress={() => void handleSend()}
                style={[
                  styles.sendButton,
                  selectedContacts.length === 0 && styles.sendButtonDisabled,
                ]}
              >
                <Text style={styles.sendButtonText}>Envoyer</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  dialog: {
    width: "100%",
    maxWidth: 460,
    maxHeight: 600,
    borderRadius: 20,
    backgroundColor: "#fff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.3,
    shadowRadius: 70,
    elevation: 15,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  subtitle: {
    marginTop: 4,
    color: "#64748b",
    fontSize: 12,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 18,
    color: "#111827",
  },
  searchWrapper: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  searchInput: {
    width: "100%",
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dbe1ea",
    fontSize: 14,
    color: "#111827",
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 8,
  },
  stateBlock: {
    padding: 30,
    alignItems: "center",
  },
  stateIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  stateText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 11,
    borderRadius: 13,
    backgroundColor: "#fff",
  },
  contactRowSelected: {
    backgroundColor: "#f0fdf4",
  },
  avatarPlaceholder: {
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontWeight: "800",
    color: "#111827",
  },
  contactInfo: {
    flex: 1,
    minWidth: 0,
  },
  contactNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  contactName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#22c55e",
  },
  contactMeta: {
    marginTop: 3,
    fontSize: 12,
    color: "#6b7280",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#16a34a",
    borderColor: "#16a34a",
  },
  checkboxText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  footerCount: {
    flex: 1,
    color: "#64748b",
    fontSize: 13,
  },
  sendButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 11,
    backgroundColor: "#111827",
  },
  sendButtonDisabled: {
    backgroundColor: "#e2e8f0",
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});

export default ContactPicker;