// src/features/community/hooks/useCreatePost.ts
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { PostMeta, Draft, Mood } from "../types";

export function useCreatePost() {
  const createPost = useMutation(api.community.createPost);
  const saveDraft = useMutation(api.community.saveDraft);
  const getDraft = useQuery(api.community.getDraft);
  const deleteDraft = useMutation(api.community.deleteDraft);
  const generateUploadUrl = useMutation(api.community.generateUploadUrl);

  const [isUploading, setIsUploading] = useState(false);

  /**
   * Upload un fichier vers Convex Storage et retourne le storageId et l'URL de prévisualisation.
   */
  const uploadAttachment = async (
    file: File,
  ): Promise<{ storageId: Id<"_storage">; previewUrl: string }> => {
    // Créer l'URL locale pour l'aperçu
    const previewUrl = URL.createObjectURL(file);

    setIsUploading(true);
    try {
      // 1. Obtenir l'URL d'upload signée
      const uploadUrl = await generateUploadUrl();

      // 2. Uploader le fichier via fetch
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      // 3. Récupérer le storageId depuis la réponse JSON
      const json = await response.json();
      const storageId = json.storageId as Id<"_storage">;
      if (!storageId) {
        throw new Error("Aucun storageId reçu de l'upload");
      }

      return { storageId, previewUrl };
    } catch (error) {
      console.error("Erreur upload:", error);
      // Libérer l'URL locale en cas d'erreur
      URL.revokeObjectURL(previewUrl);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const publish = async (data: {
    title?: string;
    description: string;
    tags: string[];
    meta: string;
    images?: Id<"_storage">[];
    videos?: Id<"_storage">[];
    audio?: Id<"_storage">[];
    location?: string;
    scheduleDate?: string;
    audience?: "public" | "friends" | "private";
    mood?: Mood;
  }) => {
    const finalMeta: PostMeta = {
      ...JSON.parse(data.meta),
      images: data.images || [],
      videos: data.videos || [],
      audio: data.audio || [],
      location: data.location,
      scheduleDate: data.scheduleDate,
      audience: data.audience || "public",
      mood: data.mood,
    };
    const result = await createPost({
      title: data.title || "",
      description: data.description,
      tags: data.tags,
      meta: JSON.stringify(finalMeta),
    });
    return result;
  };

  return {
    publish,
    saveDraft,
    getDraft,
    deleteDraft,
    uploadAttachment,
    isUploading,
  };
}