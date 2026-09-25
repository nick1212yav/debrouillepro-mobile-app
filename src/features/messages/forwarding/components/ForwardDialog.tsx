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
import { Check, Search, Send, Users, X } from "lucide-react-native";
import { useMemo, useState } from "react";

import type { Id } from "@/convex/_generated/dataModel";

import { useForwarding } from "../hooks/useForwarding";
import { ForwardPreview } from "./ForwardPreview";

// src/features/messages/forwarding/components/ForwardDialog.tsx

interface ForwardDialogProps {
  open: boolean;
  message: {
    _id: Id<"messages">;
    text: string;
    type?: string;
    voiceDuration?: number;
  } | null;
  onClose: () => void;
  onSuccess?: (messageIds: Id<"messages">[]) => void;
}

export function ForwardDialog({
  open,
  message,
  onClose,
  onSuccess,
}: ForwardDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Id<"conversations">[]>([]);
  const [isForwarding, setIsForwarding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { targets, isLoadingTargets, forward } = useForwarding(message?._id);

  const filteredTargets = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return targets;
    return targets.filter((target) =>
      target.name.toLowerCase().includes(normalizedSearch),
    );
  }, [targets, search]);

  if (!open || !message) return null;

  const toggleTarget = (conversationId: Id<"conversations">) => {
    setSelectedIds((current) =>
      current.includes(conversationId)
        ? current.filter((id) => id !== conversationId)
        : [...current, conversationId],
    );
    setError(null);
  };

  const handleClose = () => {
    if (isForwarding) return;
    setSearch("");
    setSelectedIds([]);
    setError(null);
    onClose();
  };

  const handleForward = async () => {
    if (selectedIds.length === 0) {
      setError("Sélectionne au moins une conversation.");
      return;
    }
    setIsForwarding(true);
    setError(null);
    try {
      const messageIds = await forward(selectedIds);
      setSelectedIds([]);
      setSearch("");
      onSuccess?.(messageIds);
      onClose();
    } catch (forwardError) {
      setError(
        forwardError instanceof Error
          ? forwardError.message
          : "Impossible de transférer le message.",
      );
    } finally {
      setIsForwarding(false);
    }
  };

  return (
    <Modal
      transparent
      visible={open}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={styles.dialog}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Transférer le message</Text>
              <Text style={styles.subtitle}>
                Sélectionne une ou plusieurs conversations
              </Text>
            </View>
            <Pressable
              onPress={handleClose}
              disabled={isForwarding}
              accessibilityLabel="Fermer"
              style={styles.closeButton}
            >
              <X size={18} color="rgba(255,255,255,0.5)" />
            </Pressable>
          </View>

          <View style={styles.previewWrapper}>
            <ForwardPreview message={message} />
          </View>

          <View style={styles.searchWrapper}>
            <View style={styles.searchBox}>
              <Search size={17} color="rgba(255,255,255,0.3)" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Rechercher une conversation..."
                placeholderTextColor="rgba(255,255,255,0.25)"
                style={styles.searchInput}
              />
              {search.length > 0 && (
                <Pressable
                  onPress={() => setSearch("")}
                  accessibilityLabel="Effacer la recherche"
                >
                  <X size={15} color="rgba(255,255,255,0.3)" />
                </Pressable>
              )}
            </View>
          </View>

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {isLoadingTargets ? (
              <View style={styles.loadingBlock}>
                <ActivityIndicator size="small" color="#a78bfa" />
              </View>
            ) : filteredTargets.length === 0 ? (
              <View style={styles.emptyBlock}>
                <View style={styles.emptyIconWrapper}>
                  <Users size={20} color="rgba(255,255,255,0.2)" />
                </View>
                <Text style={styles.emptyText}>
                  {search
                    ? "Aucune conversation trouvée"
                    : "Aucune conversation disponible"}
                </Text>
              </View>
            ) : (
              filteredTargets.map((target) => {
                const selected = selectedIds.includes(target.conversationId);
                return (
                  <Pressable
                    key={target.conversationId}
                    onPress={() => toggleTarget(target.conversationId)}
                    disabled={isForwarding}
                    style={[
                      styles.targetRow,
                      selected && styles.targetRowSelected,
                    ]}
                  >
                    <View style={styles.targetAvatar}>
                      {target.avatar ? (
                        <Image
                          style={styles.targetAvatarImage}
                          source={{ uri: target.avatar }}
                          accessibilityLabel=""
                        />
                      ) : (
                        <Text style={styles.targetAvatarInitial}>
                          {target.name.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={styles.targetInfo}>
                      <Text style={styles.targetName} numberOfLines={1}>
                        {target.name}
                      </Text>
                      <Text style={styles.targetMeta}>
                        {target.isGroup ? "Groupe" : "Conversation"}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.checkbox,
                        selected && styles.checkboxSelected,
                      ]}
                    >
                      <Check
                        size={14}
                        color={selected ? "#ffffff" : "transparent"}
                      />
                    </View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {selectedIds.length === 0
                ? "Aucune sélection"
                : `${selectedIds.length} sélectionnée${selectedIds.length > 1 ? "s" : ""}`}
            </Text>
            <Pressable
              onPress={() => void handleForward()}
              disabled={isForwarding || selectedIds.length === 0}
              style={[
                styles.forwardButton,
                (isForwarding || selectedIds.length === 0) && styles.forwardButtonDisabled,
              ]}
            >
              {isForwarding ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Send size={16} color="#ffffff" />
                  <Text style={styles.forwardButtonText}>Transférer</Text>
                </>
              )}
            </Pressable>
          </View>
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
    padding: 16,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.70)",
  },
  dialog: {
    width: "100%",
    maxWidth: 512,
    maxHeight: 700,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "#111827",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.10)",
  },
  headerText: { flex: 1, minWidth: 0 },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  previewWrapper: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.10)",
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    height: 44,
    fontSize: 14,
    color: "#ffffff",
  },
  list: {
    flex: 1,
    minHeight: 0,
  },
  listContent: {
    padding: 16,
    gap: 6,
  },
  loadingBlock: {
    alignItems: "center",
    padding: 24,
  },
  emptyBlock: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyIconWrapper: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
  },
  targetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    padding: 12,
  },
  targetRowSelected: {
    backgroundColor: "rgba(139,92,246,0.10)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.30)",
  },
  targetAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  targetAvatarImage: {
    width: "100%",
    height: "100%",
  },
  targetAvatarInitial: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
  },
  targetInfo: {
    flex: 1,
    minWidth: 0,
  },
  targetName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#ffffff",
  },
  targetMeta: {
    fontSize: 11,
    color: "rgba(255,255,255,0.30)",
  },
  checkbox: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
  },
  checkboxSelected: {
    borderColor: "#8b5cf6",
    backgroundColor: "#8b5cf6",
  },
  errorBox: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.20)",
    backgroundColor: "rgba(239,68,68,0.10)",
  },
  errorText: {
    fontSize: 12,
    color: "#fca5a5",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.10)",
  },
  footerText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
  },
  forwardButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#7c3aed",
  },
  forwardButtonDisabled: {
    opacity: 0.4,
  },
  forwardButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#ffffff",
  },
});

export default ForwardDialog;