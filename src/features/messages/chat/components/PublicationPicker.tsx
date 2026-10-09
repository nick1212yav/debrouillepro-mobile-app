// src/features/messages/chat/components/PublicationPicker.tsx

import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Search, X } from "lucide-react-native";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export type PublicationShareType = "evenement" | "job" | "immo";

interface PublicationPickerProps {
  type: PublicationShareType;
  open: boolean;
  onClose: () => void;
  onSelect: (publicationId: Id<"publications">) => void | Promise<void>;
}

const TITLES: Record<PublicationShareType, string> = {
  evenement: "Partager un événement",
  job: "Partager une offre",
  immo: "Partager un bien",
};

const SUBTITLES: Record<PublicationShareType, string> = {
  evenement: "Choisissez un événement à envoyer",
  job: "Choisissez une offre d'emploi",
  immo: "Choisissez un bien immobilier",
};

const EMPTY_LABELS: Record<PublicationShareType, string> = {
  evenement: "Aucun événement disponible",
  job: "Aucune offre disponible",
  immo: "Aucun bien disponible",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Actif",
  sold: "Vendu",
  closed: "Clôturé",
};

export function PublicationPicker({
  type,
  open,
  onClose,
  onSelect,
}: PublicationPickerProps) {
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<Id<"publications"> | null>(null);

  const publications = useQuery(
    api.publications.searchAnnonces,
    open ? { type, limit: 50 } : "skip",
  );

  const filtered = useMemo(() => {
    if (!publications) {
      return [];
    }

    const needle = search.trim().toLowerCase();

    if (!needle) {
      return publications;
    }

    return publications.filter((publication) =>
      publication.title.toLowerCase().includes(needle),
    );
  }, [publications, search]);

  const handleSelect = useCallback(
    async (publicationId: Id<"publications">) => {
      if (pending) {
        return;
      }

      setPending(publicationId);

      try {
        await onSelect(publicationId);
      } finally {
        setPending(null);
      }
    },
    [onSelect, pending],
  );

  const isLoading = publications === undefined;
  const hasNoResults = !isLoading && filtered.length === 0;

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityLabel="Fermer"
        />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{TITLES[type]}</Text>

              <Text style={styles.subtitle}>{SUBTITLES[type]}</Text>
            </View>

            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
              hitSlop={8}
              style={styles.closeButton}
            >
              <X size={20} color="rgba(255,255,255,0.7)" />
            </Pressable>
          </View>

          <View style={styles.searchRow}>
            <Search size={16} color="rgba(255,255,255,0.4)" />

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher…"
              placeholderTextColor="rgba(255,255,255,0.35)"
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
              accessibilityLabel="Rechercher"
            />
          </View>

          {isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="small" color="#C4B5FD" />
            </View>
          ) : hasNoResults ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>
                {search
                  ? "Aucun résultat pour cette recherche."
                  : EMPTY_LABELS[type]}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item._id)}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const cover = item.images?.[0];
                const isPending = pending === item._id;
                const statusLabel = STATUS_LABELS[item.status] ?? item.status;

                return (
                  <Pressable
                    onPress={() => void handleSelect(item._id)}
                    disabled={pending !== null}
                    accessibilityRole="button"
                    accessibilityLabel={`Partager ${item.title}`}
                    style={({ pressed }) => [
                      styles.row,
                      pressed && styles.rowPressed,
                      pending !== null && !isPending && styles.rowDisabled,
                    ]}
                  >
                    {cover ? (
                      <Image
                        source={{ uri: cover }}
                        style={styles.thumbnail}
                        resizeMode="cover"
                        accessibilityLabel={item.title}
                      />
                    ) : (
                      <View style={styles.thumbnailFallback}>
                        <Text style={styles.thumbnailFallbackText}>📄</Text>
                      </View>
                    )}

                    <View style={styles.rowContent}>
                      <Text
                        style={styles.rowTitle}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {item.title}
                      </Text>

                      <View style={styles.rowMeta}>
                        {item.location ? (
                          <Text style={styles.rowMetaText} numberOfLines={1}>
                            📍 {item.location}
                          </Text>
                        ) : null}

                        {item.price ? (
                          <Text style={styles.rowMetaText} numberOfLines={1}>
                            💰 {item.price}
                          </Text>
                        ) : null}

                        <Text style={styles.rowMetaText}>• {statusLabel}</Text>
                      </View>
                    </View>

                    {isPending ? (
                      <ActivityIndicator size="small" color="#C4B5FD" />
                    ) : null}
                  </Pressable>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
  },

  sheet: {
    maxHeight: "85%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.10)",
    backgroundColor: "#0B0B12",
    paddingBottom: 24,
  },

  handle: {
    alignSelf: "center",
    marginTop: 8,
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  subtitle: {
    marginTop: 3,
    fontSize: 12.5,
    color: "rgba(255,255,255,0.45)",
  },

  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  searchInput: {
    flex: 1,
    paddingVertical: 4,
    fontSize: 14,
    color: "#FFFFFF",
  },

  center: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    fontSize: 13,
    textAlign: "center",
    color: "rgba(255,255,255,0.45)",
  },

  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 14,
  },

  rowPressed: {
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  rowDisabled: {
    opacity: 0.5,
  },

  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#1F1F2B",
  },

  thumbnailFallback: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  thumbnailFallbackText: {
    fontSize: 22,
  },

  rowContent: {
    flex: 1,
    minWidth: 0,
  },

  rowTitle: {
    fontSize: 14.5,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  rowMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },

  rowMetaText: {
    fontSize: 11.5,
    color: "rgba(255,255,255,0.5)",
  },
});

export default PublicationPicker;
