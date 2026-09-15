import { View, Text, Pressable, TextInput } from "react-native";

// src/features/community/sheets/LiveSheet.tsx
import { useState } from "react";
import { X, Mic, Video, Radio } from "lucide-react-native";
import { toast } from "sonner";
import { useCommunityLive } from "../hooks/useCommunityLive";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LiveSheet({ isOpen, onClose, onSuccess }: Props) {
  const { startLive, isLive } = useCommunityLive();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Donnez un titre au live");
      return;
    }

    setIsSubmitting(true);
    try {
      await startLive(title.trim(), description.trim() || undefined);
      toast.success("Live démarré !");
      onClose();
      onSuccess?.();
    } catch (error) {
      toast.error("Erreur lors du démarrage du live");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
<View>
      <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} onPress={(e) => e.target === e.currentTarget && onClose()}>
        <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="w-full max-w-lg rounded-t-3xl overflow-hidden" style={{ backgroundColor: "rgba(15,15,30,0.98)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid", maxHeight: "90vh" }}>
          {/* Header */}
          <View className="flex items-center justify-between px-5 py-4 border-b border-white/10"><Text className="text-white font-bold text-lg">Démarrer un live</Text><Pressable onPress={onClose} className="p-1 rounded-full"><X size={20} className="text-white/50" /></Pressable></View>

          {/* Formulaire */}
          <View className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col gap-4" style={{  }}><View className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10"><View className="p-3 rounded-full bg-red-500/20"><Radio size={24} className="text-red-500" /></View><View><Text className="text-white font-semibold">En direct</Text><Text className="text-white/40 text-xs">Votre live sera visible par tous
                </Text></View></View><TextInput value={title} onChangeText={(value) => setTitle(value)} placeholder="Titre du live" className="w-full bg-transparent text-white placeholder:text-white/25 font-bold text-base outline-none" /><TextInput value={description} onChangeText={(value) => setDescription(value)} placeholder="Description (optionnelle)" className="w-full bg-transparent text-white/80 placeholder:text-white/25 text-sm outline-none leading-relaxed" multiline textAlignVertical="top" /><View className="flex gap-2 text-white/40 text-xs"><Text className="flex items-center gap-1"><Mic size={12} />Micro
              </Text><Text className="flex items-center gap-1"><Video size={12} />Caméra
              </Text></View></View>

          {/* Bouton de soumission */}
          <View className="px-5 pb-5">
            <Pressable onPress={handleSubmit} disabled={isSubmitting || !title.trim()} className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-40" style={{  }}>
              <Radio size={16} className="text-white" />
              <Text className="text-white">
                {isSubmitting ? "Démarrage..." : "Démarrer le live"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
