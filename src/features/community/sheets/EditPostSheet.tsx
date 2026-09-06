import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, TextInput } from "react-native";

// src/features/community/sheets/EditPostSheet.tsx
import { useState, useEffect } from "react";
import { X, Send } from "lucide-react-native";
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
      UIService.openToast("Le contenu ne peut pas être vide", "error");
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
      UIService.openToast("Post mis à jour", "success");
      onClose();
      onSuccess?.();
    } catch (error) {
      if (error instanceof ConvexError) {
        UIService.openToast((error.data as { message: string }).message, "error");
      } else {
        UIService.openToast("Erreur lors de la mise à jour", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !post) return null;

  return (
    <>
      <Pressable
        className="fixed inset-0 z-50 flex items-end justify-center"
        style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        onPress={(e) => e.target === e.currentTarget && onClose()}
      >
        <View
          className="w-full max-w-lg rounded-t-3xl overflow-hidden"
          style={{ backgroundColor: "rgba(15,15,30,0.98)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid", maxHeight: "90vh" }}
        >
          {/* Header */}
          <View className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <Text className="text-white font-bold text-lg">Modifier le post</Text>
            <Pressable
              onPress={onClose}
              className="p-1 rounded-full"
            >
              <X size={20} className="text-white/50" />
            </Pressable>
          </View>

          {/* Formulaire */}
          <View
            className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col gap-3"
            style={{  }}
          >
            {/* Titre */}
            <TextInput
              value={title}
              onChangeText={(text) => setTitle(text)}
              placeholder="Titre (optionnel)"
              className="w-full bg-transparent text-white placeholder:text-white/25 font-bold text-base outline-none pt-2"
            />

            {/* Contenu */}
            <TextInput
              value={description}
              onChangeText={(text) => setDescription(text)}
              placeholder="Contenu du post"
             
              className="w-full bg-transparent text-white/80 placeholder:text-white/25 text-sm outline-none leading-relaxed"
             multiline textAlignVertical="top"/>

            {/* Tags (simplifié) */}
            <View>
              <Text className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">
                <Text>Tags</Text></Text>
              <TextInput
                value={tags.join(" ")}
                onChangeText={(text) =>
                  setTags(text.split(" ").filter(Boolean))
                }
                placeholder="Séparez les tags par des espaces"
                className="w-full bg-transparent text-white placeholder:text-white/25 text-sm outline-none px-3 py-2 rounded-xl"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
              />
            </View>
          </View>

          {/* Bouton de soumission */}
          <View className="px-5 pb-5">
            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting || !description.trim()}
              className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{  }}
            >
              <Send size={15} className="text-white" />
              <Text className="text-white">
                {isSubmitting ? "Mise à jour..." : "Mettre à jour"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </>
  );
}
