import { View, Text, Pressable, TextInput } from "react-native";

// src/features/community/sheets/PollSheet.tsx
import { useState } from "react";
import { X, Plus, Send } from "lucide-react-native";
import { toast } from "sonner";
import { useCommunity } from "../hooks/useCommunity";
import type { PostMeta } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PollSheet({ isOpen, onClose, onSuccess }: Props) {
  const { createPost } = useCommunity();
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Donnez un titre au sondage");
      return;
    }
    const validOptions = options.filter((o) => o.trim());
    if (validOptions.length < 2) {
      toast.error("Ajoutez au moins 2 options");
      return;
    }

    const meta: PostMeta = {
      postType: "poll",
      emoji: "📊",
      pollOptions: validOptions.map((text, idx) => ({
        id: `opt-${idx}`,
        text,
        votes: 0,
      })),
    };

    setIsSubmitting(true);
    try {
      await createPost({
        title: title.trim(),
        description: `Sondage : ${title.trim()}`,
        tags,
        meta: JSON.stringify(meta),
      });
      toast.success("Sondage publié !");
      onClose();
      onSuccess?.();
    } catch (error) {
      toast.error("Erreur lors de la publication");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
<View>
      <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} onPress={(e) => e.target === e.currentTarget && onClose()}>
        <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="w-full max-w-lg rounded-t-3xl overflow-hidden" style={{ backgroundColor: "rgba(15,15,30,0.98)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid", maxHeight: "90vh" }}>
          <View className="flex items-center justify-between px-5 py-4 border-b border-white/10"><Text className="text-white font-bold text-lg">Nouveau sondage</Text><Pressable onPress={onClose} className="p-1 rounded-full"><X size={20} className="text-white/50" /></Pressable></View>

          <View className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col gap-4" style={{  }}><TextInput value={title} onChangeText={(value) => setTitle(value)} placeholder="Titre du sondage" className="w-full bg-transparent text-white placeholder:text-white/25 font-bold text-base outline-none" />{options.map((opt, idx) => (
              <View key={idx} className="flex items-center gap-2"><TextInput value={opt} onChangeText={(value) => {
                    const next = [...options];
                    next[idx] = value;
                    setOptions(next);
                  }} placeholder={`Option ${idx + 1}`} className="flex-1 bg-transparent text-white placeholder:text-white/25 text-sm outline-none px-3 py-2 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} />{options.length > 2 && (
                  <Pressable onPress={() =>
                      setOptions(options.filter((_, i) => i !== idx))}><X size={14} className="text-white/30" /></Pressable>
                )}</View>
            ))}{options.length < 4 && (
              <Pressable onPress={() => setOptions([...options, ""])} className="flex items-center gap-2 text-xs text-white/40 py-1.5"><Plus size={12} /><Text>Ajouter une option</Text></Pressable>
            )}<View><Text className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Tags
              </Text><TextInput value={tags.join(" ")} onChangeText={(value) =>
                  setTags(value.split(" ").filter(Boolean))} placeholder="Tags séparés par des espaces" className="w-full bg-transparent text-white placeholder:text-white/25 text-sm outline-none px-3 py-2 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} /></View></View>

          <View className="px-5 pb-5">
            <Pressable onPress={handleSubmit} disabled={
                isSubmitting ||
                !title.trim() ||
                options.filter((o) => o.trim()).length < 2
              } className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-40" style={{  }}>
              <Send size={15} className="text-white" />
              <Text className="text-white">
                {isSubmitting ? "Publication..." : "Publier le sondage"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
