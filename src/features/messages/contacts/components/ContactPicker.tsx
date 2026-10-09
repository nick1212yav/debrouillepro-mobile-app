import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
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
  const displayName = contact.name.trim() || "Utilisateur";
  const initial = displayName.charAt(0).toUpperCase() || "?";

  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  if (contact.avatar) {
    return (
      <Image
        style={avatarStyle}
        source={{ uri: contact.avatar }}
        accessibilityLabel={`Photo de profil de ${displayName}`}
      />
    );
  }

  return (
    <View
      style={[
        avatarStyle,
        styles.avatarPlaceholder,
        { borderRadius: size / 2 },
      ]}
      accessibilityLabel={`Avatar de ${displayName}`}
    >
      <Text style={[styles.avatarInitial, { fontSize: size * 0.36 }]}>
        {initial}
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
  const [isSending, setIsSending] = useState(false);

  const safeMaxSelection = Math.max(1, maxSelection);

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

      if (current.length >= safeMaxSelection) {
        return current;
      }

      return [...current, contact._id];
    });
  };

  const handleSend = async () => {
    if (!onSend || isSending) {
      return;
    }

    setIsSending(true);

    try {
      if (multiSelect) {
        for (const contact of selectedContacts) {
          await onSend(contact);
        }

        setSelectedIds([]);
        return;
      }

      const contact = contacts[0];

      if (contact) {
        await onSend(contact);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (isSending) {
      return;
    }

    onClose?.();
  };

  return (
    <Modal
      transparent
      visible={open}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={handleClose}
          disabled={isSending}
          accessibilityRole="button"
          accessibilityLabel="Fermer le sélecteur de contacts"
        />

        <View style={styles.dialog} accessibilityViewIsModal>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Partager un contact</Text>

              <Text style={styles.subtitle}>
                Recherchez un utilisateur DébrouillePro
              </Text>
            </View>

            {onClose ? (
              <Pressable
                onPress={handleClose}
                disabled={isSending}
                accessibilityRole="button"
                accessibilityLabel="Fermer"
                accessibilityState={{ disabled: isSending }}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.closeButtonPressed,
                ]}
              >
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.searchWrapper}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Nom, téléphone ou email..."
              placeholderTextColor="#94a3b8"
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              clearButtonMode="while-editing"
              editable={!isSending}
              style={styles.searchInput}
              accessibilityLabel="Rechercher un contact"
            />
          </View>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <View style={styles.stateBlock}>
                <ActivityIndicator size="small" color="#64748b" />

                <Text style={styles.stateText}>Recherche des contacts...</Text>
              </View>
            ) : contacts.length === 0 ? (
              <View style={styles.stateBlock}>
                <Text style={styles.stateIcon}>👤</Text>

                <Text style={styles.stateText}>Aucun contact trouvé.</Text>

                {search.trim() ? (
                  <Text style={styles.stateHint}>
                    Essayez un autre nom, numéro ou email.
                  </Text>
                ) : null}
              </View>
            ) : (
              contacts.map((contact) => {
                const selected = selectedIds.includes(contact._id);
                const displayName = contact.name.trim() || "Utilisateur";

                const meta =
                  contact.profession ||
                  contact.city ||
                  contact.phone ||
                  contact.email ||
                  "Utilisateur DébrouillePro";

                return (
                  <Pressable
                    key={contact._id}
                    onPress={() => handleSelect(contact)}
                    disabled={isSending}
                    accessibilityRole="button"
                    accessibilityLabel={
                      multiSelect
                        ? `${displayName}${
                            selected ? ", sélectionné" : ", non sélectionné"
                          }`
                        : `Sélectionner ${displayName}`
                    }
                    accessibilityState={{
                      selected,
                      disabled: isSending,
                    }}
                    style={({ pressed }) => [
                      styles.contactRow,
                      selected && styles.contactRowSelected,
                      pressed && styles.contactRowPressed,
                    ]}
                  >
                    <ContactAvatar contact={contact} />

                    <View style={styles.contactInfo}>
                      <View style={styles.contactNameRow}>
                        <Text
                          style={styles.contactName}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {displayName}
                        </Text>

                        {contact.isOnline ? (
                          <View
                            style={styles.onlineDot}
                            accessibilityLabel="En ligne"
                          />
                        ) : null}
                      </View>

                      <Text
                        style={styles.contactMeta}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {meta}
                      </Text>
                    </View>

                    {multiSelect ? (
                      <View
                        style={[
                          styles.checkbox,
                          selected && styles.checkboxChecked,
                        ]}
                        accessibilityLabel={
                          selected
                            ? "Contact sélectionné"
                            : "Contact non sélectionné"
                        }
                      >
                        {selected ? (
                          <Text style={styles.checkboxText}>✓</Text>
                        ) : null}
                      </View>
                    ) : null}
                  </Pressable>
                );
              })
            )}
          </ScrollView>

          {multiSelect ? (
            <View style={styles.footer}>
              <Text style={styles.footerCount}>
                {selectedIds.length} contact
                {selectedIds.length > 1 ? "s" : ""} sélectionné
                {selectedIds.length > 1 ? "s" : ""}
              </Text>

              <Pressable
                disabled={selectedContacts.length === 0 || isSending || !onSend}
                onPress={() => void handleSend()}
                accessibilityRole="button"
                accessibilityLabel={
                  isSending
                    ? "Envoi des contacts en cours"
                    : "Envoyer les contacts sélectionnés"
                }
                accessibilityState={{
                  disabled:
                    selectedContacts.length === 0 || isSending || !onSend,
                  busy: isSending,
                }}
                style={({ pressed }) => [
                  styles.sendButton,
                  (selectedContacts.length === 0 || isSending || !onSend) &&
                    styles.sendButtonDisabled,
                  pressed &&
                    selectedContacts.length > 0 &&
                    !isSending &&
                    onSend &&
                    styles.sendButtonPressed,
                ]}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.sendButtonText}>Envoyer</Text>
                )}
              </Pressable>
            </View>
          ) : null}
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
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },

  dialog: {
    width: "100%",
    maxWidth: 460,
    maxHeight: 600,
    overflow: "hidden",
    borderRadius: 20,
    backgroundColor: "#ffffff",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 25,
    },
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

  headerText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },

  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },

  subtitle: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748b",
  },

  closeButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: "#f1f5f9",
  },

  closeButtonPressed: {
    opacity: 0.65,
  },

  closeText: {
    marginTop: -2,
    fontSize: 22,
    fontWeight: "400",
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
    borderWidth: 1,
    borderColor: "#dbe1ea",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    fontSize: 14,
    color: "#111827",
  },

  list: {
    flexGrow: 0,
    flexShrink: 1,
  },

  listContent: {
    padding: 8,
  },

  stateBlock: {
    alignItems: "center",
    padding: 30,
  },

  stateIcon: {
    marginBottom: 8,
    fontSize: 30,
  },

  stateText: {
    fontSize: 14,
    textAlign: "center",
    color: "#6b7280",
  },

  stateHint: {
    marginTop: 6,
    fontSize: 12,
    textAlign: "center",
    color: "#94a3b8",
  },

  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 11,
    borderRadius: 13,
    backgroundColor: "#ffffff",
  },

  contactRowSelected: {
    backgroundColor: "#f0fdf4",
  },

  contactRowPressed: {
    opacity: 0.7,
  },

  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
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
    minWidth: 0,
  },

  contactName: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },

  onlineDot: {
    width: 7,
    height: 7,
    flexShrink: 0,
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
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#cbd5e1",
    borderRadius: 11,
    backgroundColor: "#ffffff",
  },

  checkboxChecked: {
    borderColor: "#16a34a",
    backgroundColor: "#16a34a",
  },

  checkboxText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#ffffff",
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
    fontSize: 13,
    color: "#64748b",
  },

  sendButton: {
    minWidth: 82,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 11,
    backgroundColor: "#111827",
  },

  sendButtonDisabled: {
    backgroundColor: "#e2e8f0",
  },

  sendButtonPressed: {
    opacity: 0.75,
  },

  sendButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
});

export default ContactPicker;
