import { View, Text, Pressable, TextInput } from "react-native";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { X, Loader2 } from "lucide-react-native";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

interface Props {
  publication: any;
  onClose: () => void;
}

export function VisitBookingSheet({ publication, onClose }: Props) {
  const { user } = useFirebaseAuth();
  const requestVisit = useMutation(api.realestate.createPropertyRequest);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");

  const propertyId = publication.meta?.propertyId || publication._id;

  const handleSubmit = async () => {
    if (!date) {
      toast.error("Sélectionnez une date");
      return;
    }
    setLoading(true);
    try {
      await requestVisit({
        propertyId: propertyId as any,
        message: message || "Demande de visite",
        visitDate: date,
      });
      toast.success("Demande de visite envoyée");
      onClose();
    } catch (err) {
      toast.error("Erreur lors de l'envoi");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onPress={onClose} className="fixed inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} />
      <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl flex flex-col max-h-[80vh]" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
        <View className="flex justify-center pt-3 flex-shrink-0"><View className="w-10 h-1 rounded-full bg-white/20" /></View>
        <View className="flex items-center justify-between px-5 py-3 flex-shrink-0"><Text className="text-white font-black text-base">Demander une visite
          </Text><Pressable onPress={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center"><X size={18} className="text-white/60" /></Pressable></View>
        <View className="flex-1 overflow-y-auto px-5 pb-8 space-y-4"><View><Text className="text-xs text-white/40">Date souhaitée *</Text><TextInput value={date} onChangeText={(value) => setDate(value)} className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/5 text-white outline-none border border-white/10 focus:border-orange-500 transition-colors" /></View><View><Text className="text-xs text-white/40">Message (optionnel)</Text><TextInput value={message} onChangeText={(value) => setMessage(value)} placeholder="Ajoutez un message pour le propriétaire..." className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/5 text-white placeholder:text-white/25 outline-none border border-white/10 focus:border-orange-500 transition-colors" multiline textAlignVertical="top" /></View><Pressable onPress={handleSubmit} disabled={loading} className="w-full py-4 rounded-3xl font-bold text-white active:scale-95 transition-transform disabled:opacity-50" style={{  }}>{loading ? (
              <Loader2 size={20} className="animate-spin mx-auto" />
            ) : (
              "Envoyer la demande"
            )}</Pressable></View>
      </View>
    </>
  );
}
