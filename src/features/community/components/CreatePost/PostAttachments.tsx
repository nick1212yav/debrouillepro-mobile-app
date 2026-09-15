import { View, Pressable, Text, TextInput, Image } from "react-native";

// src/features/community/components/CreatePost/PostAttachments.tsx
import { useRef, useState } from "react";
import {
  Video,
  Mic,
  Camera,
  X,
  Loader2,
} from "lucide-react-native";
import { toast } from "sonner";
import type { PostAttachment } from "../../types";

interface Props {
  attachments: PostAttachment[];
  onChange: (attachments: PostAttachment[]) => void;
  onUpload: (file: File) => Promise<{ storageId: string; previewUrl: string }>;
  isUploading: boolean;
  onGiphyToggle: () => void;
}

export function PostAttachments({
  attachments = [],
  onChange,
  onUpload,
  isUploading,
  onGiphyToggle,
}: Props) {
  const fileInputRef = useRef<TextInput>(null);
  const videoInputRef = useRef<TextInput>(null);
  const audioInputRef = useRef<TextInput>(null);
  const [uploadingType, setUploadingType] = useState<
    "image" | "video" | "audio" | null
  >(null);

  const handleFiles = async (
    files: FileList | null,
    type: "image" | "video" | "audio",
  ) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    setUploadingType(type);

    try {
      const newAttachments: PostAttachment[] = [];

      for (const file of fileArray) {
        const result = await onUpload(file);
        newAttachments.push({
          type,
          previewUrl: result.previewUrl, // URL locale pour l'affichage
          storageId: result.storageId as any, // StorageId Convex
          name: file.name,
          size: file.size,
        });
      }

      onChange([...attachments, ...newAttachments]);
      toast.success(`${newAttachments.length} fichier(s) ajouté(s)`);
    } catch (error) {
      toast.error(`Erreur lors de l'upload ${type}`);
      console.error(error);
    } finally {
      setUploadingType(null);
      // Réinitialiser les inputs
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";
      if (audioInputRef.current) audioInputRef.current.value = "";
    }
  };

  const handleCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Impossible d'obtenir le contexte 2D");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg"),
      );
      if (!blob) throw new Error("Impossible de capturer la photo");
      const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
      const result = await onUpload(file);
      onChange([
        ...attachments,
        {
          type: "image",
          previewUrl: result.previewUrl,
          storageId: result.storageId as any,
          name: "photo.jpg",
        },
      ]);
      toast.success("Photo prise !");
      stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      toast.error("Erreur d'accès à la caméra");
      console.error(error);
    }
  };

  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments];
    // Libérer l'URL de prévisualisation pour éviter les fuites mémoire
    if (newAttachments[index]?.previewUrl) {
      URL.revokeObjectURL(newAttachments[index].previewUrl);
    }
    newAttachments.splice(index, 1);
    onChange(newAttachments);
  };

  const renderAttachmentPreview = (att: PostAttachment) => {
    if (!att || !att.previewUrl) return null;
    switch (att.type) {
      case "image":
      case "gif":
        return (
          <Image className="w-full h-full object-cover" source={{ uri: att.previewUrl }} accessibilityLabel={att.name || ""} />
        );
      case "video":
        return (
          <video
            src={att.previewUrl}
            className="w-full h-full object-cover"
            muted
            playsInline
          />
        );
      case "audio":
        return <Mic size={20} className="text-white/60 m-auto mt-5" />;
      default:
        return null;
    }
  };

  const imageCount = attachments.filter((a) => a.type === "image").length;

  return (
    <View className="space-y-2"><View className="flex flex-wrap gap-1.5"><Pressable onPress={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 transition-colors"><ImageIcon size={14} className="text-white/40" /><Text>Image</Text>{imageCount > 0 && ` (${imageCount})`}</Pressable><TextInput ref={fileInputRef} className="hidden" onChangeText={(e) => handleFiles(e.target.files, "image")} /><Pressable onPress={() => videoInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 transition-colors"><Video size={14} className="text-white/40" /><Text>Vidéo</Text></Pressable><TextInput ref={videoInputRef} className="hidden" onChangeText={(e) => handleFiles(e.target.files, "video")} /><Pressable onPress={() => audioInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 transition-colors"><Mic size={14} className="text-white/40" /><Text>Audio</Text></Pressable><TextInput ref={audioInputRef} className="hidden" onChangeText={(e) => handleFiles(e.target.files, "audio")} /><Pressable onPress={handleCamera} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 transition-colors"><Camera size={14} className="text-white/40" /><Text>Photo</Text></Pressable><Pressable onPress={onGiphyToggle} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 transition-colors"><Text className="text-white/40">GIF</Text></Pressable></View>{(isUploading || uploadingType) && (
        <View className="flex items-center gap-2 text-white/40 text-xs"><Loader2 size={12} className="animate-spin" /><Text>Upload</Text>{uploadingType}<Text>en cours...</Text></View>
      )}<View className="flex flex-wrap gap-2">{attachments.map((att, idx) => (
          <View key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden bg-black/30 group">
            {renderAttachmentPreview(att)}
            <Pressable onPress={() => removeAttachment(idx)} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500/80 flex items-center justify-center opacity-0 transition-opacity">
              <X size={10} className="text-white" />
            </Pressable>
          </View>
        ))}</View></View>
  );
}
