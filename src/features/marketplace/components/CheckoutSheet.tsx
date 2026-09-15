import { View, Text, Pressable, TextInput } from "react-native";

// src/features/marketplace/components/CheckoutSheet.tsx
import { useState } from "react";
import { X, Loader2, CheckCircle2 } from "lucide-react-native";
import { toast } from "sonner";
import { formatPrice } from "../utils/formatter";
import type { CartItem } from "../types";

interface Props {
  items: CartItem[];
  onConfirm: (address: string, note?: string) => Promise<void>;
  onClose: () => void;
}

export function CheckoutSheet({ items, onConfirm, onClose }: Props) {
  const [step, setStep] = useState<"address" | "confirm" | "done">("address");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const total = items.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0,
  );
  const currency = items[0]?.product?.currency || "FCFA";

  const handleConfirm = async () => {
    if (!address.trim()) {
      toast.error("Adresse requise");
      return;
    }
    setLoading(true);
    try {
      await onConfirm(address, note || undefined);
      setStep("done");
    } catch {
      toast.error("Erreur lors de la commande");
    } finally {
      setLoading(false);
    }
  };

  if (step === "done") {
    return (
      <View className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"><View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="w-full max-w-md rounded-t-3xl p-6" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><View className="text-center py-6"><View initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }}><CheckCircle2 size={56} className="mx-auto mb-4 text-green-400" /></View><Text className="text-white font-bold text-xl mb-2">Commande confirmée !
            </Text><Text className="text-white/50 text-sm mb-6">Vous recevrez une notification dès que le vendeur confirme.
            </Text><Pressable onPress={onClose} className="px-8 py-3 rounded-2xl font-bold text-white" style={{  }}><Text>Retour</Text></Pressable></View></View></View>
    );
  }

  return (
    <View className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"><View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="w-full max-w-md rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><View className="flex items-center justify-between mb-6"><Text className="text-white font-bold text-lg">Adresse de livraison</Text><Pressable onPress={onClose} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5"><X size={16} className="text-white" /></Pressable></View>{step === "address" ? (
          <View className="space-y-4"><View><Text className="text-xs text-white/50 mb-1 block">Adresse complète *
              </Text><TextInput value={address} onChangeText={(value) => setAddress(value)} placeholder="Quartier, rue, numéro, ville..." className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none" style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} multiline textAlignVertical="top" /></View><View><Text className="text-xs text-white/50 mb-1 block">Note pour le vendeur
              </Text><TextInput value={note} onChangeText={(value) => setNote(value)} placeholder="Instructions spéciales..." className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none" style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} /></View><Pressable onPress={() => setStep("confirm")} className="w-full py-3.5 rounded-xl font-bold text-white" style={{  }}><Text>Continuer</Text></Pressable></View>
        ) : (
          <View className="space-y-4"><View className="space-y-2 mb-4">{items.map((item) => (
                <View key={item._id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}><Text className="text-white text-sm truncate flex-1">{item.product?.title}× {item.quantity}</Text><Text className="text-orange-400 font-bold text-sm ml-3">{formatPrice(
                      (item.product?.price || 0) * item.quantity,
                      currency,
                    )}</Text></View>
              ))}</View><View className="flex items-center justify-between py-3 border-t border-white/10"><Text className="text-white/60">Total</Text><Text className="text-white font-black text-xl">{formatPrice(total, currency)}</Text></View><View className="p-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}><Text className="text-white/40 text-xs mb-1">Livraison à</Text><Text className="text-white text-sm">{address}</Text></View><Pressable onPress={handleConfirm} disabled={loading} className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50" style={{  }}>{loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Traitement...
                </>
              ) : (
                "Confirmer la commande"
              )}</Pressable></View>
        )}</View></View>
  );
}
