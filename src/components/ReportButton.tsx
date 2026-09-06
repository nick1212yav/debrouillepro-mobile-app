import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, TextInput } from "react-native";
import { useState } from "react";
import { Flag, AlertTriangle, X, ChevronDown } from "lucide-react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import { ConvexError } from "convex/values";
import { cn } from "@/lib/utils";
type ReportReason = "spam" | "inappropriate" | "fake" | "harassment" | "other";

const REASONS: { id: ReportReason; label: string }[] = [
  { id: "spam", label: "Spam" },
  { id: "inappropriate", label: "Contenu inapproprié" },
  { id: "fake", label: "Faux / Trompeur" },
  { id: "harassment", label: "Harcèlement" },
  { id: "other", label: "Autre" },
];

interface Props {
  /** Pass either publicationId or commentId */
  publicationId?: Id<"publications">;
  commentId?: Id<"comments">;
  /** Compact icon-only mode (default) vs full button */
  variant?: "icon" | "menu-item";
}

export default function ReportButton({ publicationId, commentId, variant = "icon" }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const flagPub = useMutation(api.admin.flagPublication);
  const flagComment = useMutation(api.admin.flagComment);

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setSubmitting(true);
    try {
      if (publicationId) {
        await flagPub({ publicationId, reason: selectedReason, note: note.trim() || undefined });
      } else if (commentId) {
        await flagComment({ commentId, reason: selectedReason, note: note.trim() || undefined });
      }
      UIService.openToast("Signalement envoyé — merci pour votre vigilance !", "success");
      setOpen(false);
      setSelectedReason(null);
      setNote("");
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string };
        UIService.openToast(d?.message ?? "Erreur lors du signalement", "error");
      } else {
        UIService.openToast("Erreur lors du signalement", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {variant === "icon" ? (
        <Pressable
          onPress={(e) => { setOpen(true); }}
          className="w-7 h-7 flex items-center justify-center rounded-full"
         
        >
          <Flag size={13} className="text-white/30" />
        </Pressable>
      ) : (
        <Pressable
          onPress={(e) => { setOpen(true); }}
          className="flex items-center gap-2 px-3 py-2 w-full text-left text-sm text-red-400 rounded-xl"
        >
          <Flag size={14} />
          <Text>Signaler</Text></Pressable>
      )}

      <>
        {open && (
          <>
            {/* Backdrop */}
            <Pressable
              className="fixed inset-0 z-[200] bg-black/60"
              onPress={() => setOpen(false)}
            />

            {/* Sheet */}
            <Pressable
              className="fixed bottom-0 left-0 right-0 z-[201] rounded-t-3xl p-6 space-y-5"
              style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
              onPress={(e) => e.stopPropagation()}
            >
              {/* Handle */}
              <View className="w-10 h-1 rounded-full bg-white/20 mx-auto -mt-2" />

              {/* Header */}
              <View className="flex items-center justify-between">
                <View className="flex items-center gap-2">
                  <AlertTriangle size={18} className="text-orange-400" />
                  <Text className="text-white font-bold text-base">Signaler ce contenu</Text>
                </View>
                <Pressable onPress={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                  <X size={16} className="text-white/60" />
                </Pressable>
              </View>

              {/* Reason selector */}
              <View className="space-y-2">
                <Text className="text-white/50 text-xs font-medium uppercase tracking-wider">Motif du signalement</Text>
                <View className="gap-2">
                  {REASONS.map(({ id, label }) => (
                    <Pressable
                      key={id}
                      onPress={() => setSelectedReason(id)}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium text-left cursor-pointer transition-all",
                        selectedReason === id
                          ? "text-white"
                          : "text-white/60",
                      )}
                      style={
                        selectedReason === id
                          ? { borderWidth: 1, borderColor: "rgba(239,68,68,0.4)", borderStyle: "solid" }
                          : { backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }
                      }
                    >
                      {label}
                      {selectedReason === id && <ChevronDown size={14} className="text-red-400" />}
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Optional note */}
              <View className="space-y-2">
                <Text className="text-white/50 text-xs font-medium uppercase tracking-wider">Détails (optionnel)</Text>
                <TextInput
                  value={note}
                  onChangeText={(text) => setNote(text)}
                  placeholder="Décrivez le problème…"
                 
                  maxLength={300}
                  className="w-full px-4 py-3 rounded-2xl text-sm text-white placeholder-white/30 outline-none"
                  style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
                 multiline textAlignVertical="top"/>
              </View>

              {/* Submit */}
              <Pressable
                onPress={handleSubmit}
                disabled={!selectedReason || submitting}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-sm disabled:opacity-40"
                style={{  }}
              >
                {submitting ? "Envoi…" : "Envoyer le signalement"}
              </Pressable>
            </Pressable>
          </>
        )}
      </>
    </>
  );
}
