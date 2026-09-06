import { View, Text, Pressable, Image, TextInput } from "react-native";
import { Check, Loader2, Search, Send, Users, X } from "lucide-react-native";
import { useMemo, useState } from "react";

import type { Id } from "@/convex/_generated/dataModel";

import { useForwarding } from "../hooks/useForwarding";
import { ForwardPreview } from "./ForwardPreview";

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

    if (!normalizedSearch) {
      return targets;
    }

    return targets.filter((target) =>
      target.name.toLowerCase().includes(normalizedSearch),
    );
  }, [targets, search]);

  if (!open || !message) {
    return null;
  }

  const toggleTarget = (conversationId: Id<"conversations">) => {
    setSelectedIds((current) =>
      current.includes(conversationId)
        ? current.filter((id) => id !== conversationId)
        : [...current, conversationId],
    );

    setError(null);
  };

  const handleClose = () => {
    if (isForwarding) {
      return;
    }

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
    <View
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      accessibilityRole="dialog"
      aria-modal="true"
      accessibilityLabel="Transférer un message"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <View className="flex max-h-[min(760px,90vh)] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#111827] shadow-2xl">
        {/* Header */}
        <View className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <View>
            <Text className="text-base font-semibold text-white">
              Transférer le message
            </Text>

            <Text className="mt-0.5 text-xs text-white/35">
              Sélectionne une ou plusieurs conversations
            </Text>
          </View>

          <Pressable
           
            onPress={handleClose}
            disabled={isForwarding}
            accessibilityLabel="Fermer"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 disabled:opacity-40"
          >
            <X size={18} />
          </Pressable>
        </View>

        {/* Message à transférer */}
        <View className="border-b border-white/10 p-4">
          <ForwardPreview message={message} />
        </View>

        {/* Recherche */}
        <View className="px-4 pt-4">
          <View className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3">
            <Search size={17} className="shrink-0 text-white/30" />

            <TextInput
             
              value={search}
              onChangeText={(text) => setSearch(text)}
              placeholder="Rechercher une conversation..."
              className="h-11 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
            />

            {search && (
              <Pressable
               
                onPress={() => setSearch("")}
                className="text-white/30"
                accessibilityLabel="Effacer la recherche"
              >
                <X size={15} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Conversations */}
        <View className="min-h-0 flex-1 overflow-y-auto p-4">
          {isLoadingTargets ? (
            <View className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <View
                  key={index}
                  className="h-[62px] animate-pulse rounded-xl bg-white/[0.04]"
                />
              ))}
            </View>
          ) : filteredTargets.length === 0 ? (
            <View className="flex flex-col items-center justify-center py-12 text-center">
              <View className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5">
                <Users size={20} className="text-white/20" />
              </View>

              <Text className="text-sm text-white/50">
                {search
                  ? "Aucune conversation trouvée"
                  : "Aucune conversation disponible"}
              </Text>
            </View>
          ) : (
            <View className="space-y-1.5">
              {filteredTargets.map((target) => {
                const selected = selectedIds.includes(target.conversationId);

                return (
                  <Pressable
                    key={target.conversationId}
                   
                    onPress={() => toggleTarget(target.conversationId)}
                    disabled={isForwarding}
                    className={[
                      "flex w-full items-center gap-3 rounded-xl p-3 text-left transition",
                      selected
                        ? "bg-violet-500/10 ring-1 ring-violet-500/30"
                        : "hover:bg-white/[0.04]",
                    ].join(" ")}
                  >
                    {/* Avatar */}
                    <View className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10">
                      {target.avatar ? (
                        <Image
                         
                         
                          className="h-full w-full object-cover"
                         source={{ uri: target.avatar }} accessibilityLabel=""/>
                      ) : (
                        <Text className="text-sm font-semibold text-white/50">
                          {target.name.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>

                    {/* Nom */}
                    <View className="min-w-0 flex-1">
                      <Text className="truncate text-sm font-medium text-white">
                        {target.name}
                      </Text>

                      <Text className="text-[11px] text-white/30">
                        {target.isGroup ? "Groupe" : "Conversation"}
                      </Text>
                    </View>

                    {/* Sélection */}
                    <View
                      className={[
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition",
                        selected
                          ? "border-violet-500 bg-violet-500 text-white"
                          : "border-white/20 text-transparent",
                      ].join(" ")}
                    >
                      <Check size={14} />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Erreur */}
        {error && (
          <View className="mx-4 mb-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </View>
        )}

        {/* Footer */}
        <View className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-4">
          <Text className="text-xs text-white/35">
            {selectedIds.length === 0
              ? "Aucune sélection"
              : `${selectedIds.length} sélectionnée${
                  selectedIds.length > 1 ? "s" : ""
                }`}
          </Text>

          <Pressable
            onPress={handleForward}
            disabled={isForwarding || selectedIds.length === 0}
            className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isForwarding ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <Text>Transfert...</Text></>
            ) : (
              <>
                <Send size={16} />
                <Text>Transférer</Text></>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default ForwardDialog;
