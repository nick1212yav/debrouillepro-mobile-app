import { View, Text, Pressable, TextInput } from "react-native";

// src/features/community/sheets/EditPostSheet.tsx
import { useState, useEffect } from "react";
import { X, Send } from "lucide-react-native";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { CommunityPost, PostType } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  post: CommunityPost | null;
  onSuccess?: () => void;
}

export function EditPostSheet({ isOpen, onClose, post, onSuccess }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updatePost = useMutation(api.community.updatePost);

  useEffect(() => {
    if (post) {
      setTitle(post.title || "");
      setDescription(post.description);
      setTags(post.tags || []);
    }
  }, [post]);

  const handleSubmit = async () => {
    if (!post) return;
    if (!description.trim()) {
      toast.error("Le contenu ne peut pas être vide");
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePost({
        publicationId: post._id,
        title: title.trim() || undefined,
        description: description.trim(),
        tags: tags,
      });
      toast.success("Post mis à jour");
      onClose();
      onSuccess?.();
    } catch (error) {
      if (error instanceof ConvexError) {
        toast.error((error.data as { message: string }).message);
      } else {
        toast.error("Erreur lors de la mise à jour");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !post) return null;

  return (
<View>
      <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} onPress={(e) => e.target === e.currentTarget && onClose()}>
        <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="w-full max-w-lg rounded-t-3xl overflow-hidden" style={{ backgroundColor: "rgba(15,15,30,0.98)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid", maxHeight: "90vh" }}>
          {/* Header */}
          <View className="flex items-center justify-between px-5 py-4 border-b border-white/10"><Text className="text-white font-bold text-lg">Modifier le post</Text><Pressable onPress={onClose} className="p-1 rounded-full"><X size={20} className="text-white/50" /></Pressable></View>

          {/* Formulaire */}
          <View className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col gap-3" style={{  }}>{}<TextInput value={title} onChangeText={(value) => setTitle(value)} placeholder="Titre (optionnel)" className="w-full bg-transparent text-white placeholder:text-white/25 font-bold text-base outline-none pt-2" />{}<TextInput value={description} onChangeText={(value) => setDescription(value)} placeholder="Contenu du post" className="w-full bg-transparent text-white/80 placeholder:text-white/25 text-sm outline-none leading-relaxed" multiline textAlignVertical="top" />{}<View><Text className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Tags
              </Text><TextInput value={tags.join(" ")} onChangeText={(value) =>
                  setTags(value.split(" ").filter(Boolean))} placeholder="Séparez les tags par des espaces" className="w-full bg-transparent text-white placeholder:text-white/25 text-sm outline-none px-3 py-2 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} /></View></View>

          {/* Bouton de soumission */}
          <View className="px-5 pb-5">
            <Pressable onPress={handleSubmit} disabled={isSubmitting || !description.trim()} className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-40" style={{  }}>
              <Send size={15} className="text-white" />
              <Text className="text-white">
                {isSubmitting ? "Mise à jour..." : "Mettre à jour"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
