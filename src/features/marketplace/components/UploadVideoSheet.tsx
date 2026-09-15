import { View, Text, Pressable, TextInput, NativeSyntheticEvent, TextInputChangeEventData } from "react-native";

// src/features/marketplace/components/UploadVideoSheet.tsx
import { useState, useRef } from "react";
import { X, Upload, Video, XCircle, Loader2 } from "lucide-react-native";
import { toast } from "sonner";

interface Props {
  onClose: () => void;
  onUpload: (file: File) => Promise<string>;
}

export function UploadVideoSheet({ onClose, onUpload }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleSelect = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const removeFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Sélectionnez une vidéo");
      return;
    }
    setUploading(true);
    try {
      const url = await onUpload(file);
      toast.success("Vidéo uploadée !");
      onClose();
    } catch {
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50 backdrop-blur-sm"><View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="w-full max-w-md rounded-3xl p-5" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><View className="flex items-center justify-between mb-4"><Text className="text-white font-bold text-lg">Ajouter une vidéo</Text><Pressable onPress={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/5"><X size={18} className="text-white/60" /></Pressable></View><View className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center transition-colors" onPress={() => inputRef.current?.click()}><Video size={32} className="text-white/20 mx-auto mb-2" /><Text className="text-white/40 text-sm">Cliquez pour sélectionner une vidéo
          </Text><Text className="text-white/20 text-xs">MP4, WebM, MOV</Text><TextInput ref={inputRef} onChangeText={handleSelect} className="hidden" /></View>{preview && (
          <View className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10"><View className="flex items-center gap-3"><video src={preview} className="w-20 h-20 rounded-xl object-cover" controls={false} /><View className="flex-1"><Text className="text-white/70 text-sm truncate">{file?.name}</Text><Text className="text-white/30 text-xs">{(file?.size || 0) / 1024 / 1024}MB
                </Text></View><Pressable onPress={removeFile} className="text-white/40 transition-colors"><XCircle size={16} /></Pressable></View></View>
        )}<Pressable onPress={handleUpload} disabled={uploading || !file} className="w-full mt-4 py-3 rounded-2xl font-bold text-white disabled:opacity-40 flex items-center justify-center gap-2" style={{  }}>{uploading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Upload size={16} />
          )}{uploading ? "Upload en cours..." : "Uploader la vidéo"}</Pressable></View></View>
  );
}
