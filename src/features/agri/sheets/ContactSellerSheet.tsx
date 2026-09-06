import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, TextInput } from "react-native";

// src/features/agri/sheets/ContactSellerSheet.tsx
import {
  X,
  Phone,
  MessageSquare,
  ShieldCheck,
  CornerDownLeft,
} from "lucide-react-native";
import type { AgriProduct } from "../types/product.types";
import { useState } from "react";

interface ContactSellerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  seller: {
    userId: string;
    name: string;
    verified: boolean;
  };
  product: AgriProduct;
}

export function ContactSellerSheet({
  isOpen,
  onClose,
  seller,
  product,
}: ContactSellerSheetProps) {
  const [negotiationText, setNegotiationText] = useState("");

  const templates = [
    `Bonjour, je suis intéressé par votre offre de "${product.title}". Est-elle toujours disponible ?`,
    `Seriez-vous d'accord pour négocier le prix de ${product.pricing.price} ${product.pricing.currency} ?`,
    `Quelle est la localisation exacte pour le retrait sur place ?`,
  ];

  const handleSendQuery = (text: string) => {
    UIService.openToast("Message envoyé avec succès au producteur !", "success");
    setNegotiationText("");
    onClose();
  };

  return (
    <>
      {isOpen && (
        <>
          <Pressable
            onPress={onClose}
            className="fixed inset-0 z-40 bg-black/75"
          />

          <View
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[32px] border-t border-white/5 bg-gradient-to-b from-[#0a0f0b] to-[#040604] overflow-hidden"
            style={{ maxHeight: "80vh" }}
          >
            <View className="flex justify-center pt-3 pb-1">
              <View className="w-10 h-1 rounded-full bg-white/20" />
            </View>

            <View
              className="px-5 pb-8 overflow-y-auto space-y-4"
              style={{ maxHeight: "74vh" }}
            >
              <View className="flex items-center justify-between py-2 border-b border-white/5">
                <Text className="text-white font-black text-sm">
                  Contacter le producteur
                </Text>
                <Pressable
                 
                  onPress={onClose}
                  className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/[0.04] border border-white/5 text-white/50"
                >
                  <X size={15} />
                </Pressable>
              </View>

              {/* Résumé profil producteur */}
              <View className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3">
                <View className="min-w-0">
                  <View className="flex items-center gap-1.5">
                    <Text className="text-white font-bold text-xs truncate leading-none">
                      {seller.name}
                    </Text>
                    {seller.verified && (
                      <ShieldCheck
                        size={14}
                        className="text-emerald-400 flex-shrink-0"
                      />
                    )}
                  </View>
                  <Text className="text-[9px] text-white/30 block mt-1">
                    Secteur : {product.location.city}
                  </Text>
                </View>

                <View className="flex gap-2">
                  <Pressable
                    // Identifiant de test ou d'appel local
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-green-500/10 border border-green-500/20 text-green-400"
                   data-href="tel:+24300000000">
                    <Phone size={14} />
                  </Pressable>
                </View>
              </View>

              {/* Templates de saisie rapide */}
              <View className="space-y-1.5">
                <Text className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                  Messages rapides
                </Text>
                <View className="flex flex-col gap-2">
                  {templates.map((tpl, i) => (
                    <Pressable
                      key={i}
                     
                      onPress={() => setNegotiationText(tpl)}
                      className="p-3 text-left rounded-xl bg-white/[0.01] border border-white/5 text-white/70 text-[10px] leading-relaxed"
                    >
                      {tpl}
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Zone de saisie d'un message libre */}
              <View className="space-y-1.5 pt-1.5">
                <Text className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                  Message personnalisé
                </Text>
                <View className="relative flex items-center rounded-2xl bg-white/[0.03] border border-white/5 p-3.5">
                  <MessageSquare
                    size={14}
                    className="text-white/30 absolute left-4 top-4"
                  />
                  <TextInput
                    value={negotiationText}
                    onChangeText={(text) => setNegotiationText(text)}
                    placeholder="Écrivez votre message..."
                   
                    className="w-full pl-7 pr-8 bg-transparent text-white text-xs placeholder:text-white/20 outline-none"
                   multiline textAlignVertical="top"/>
                  {negotiationText.trim() && (
                    <Pressable
                      type="button"
                      onPress={() => handleSendQuery(negotiationText)}
                      className="absolute right-3 bottom-3 w-7 h-7 rounded-xl flex items-center justify-center bg-green-500 text-black"
                    >
                      <CornerDownLeft size={12} />
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          </View>
        </>
      )}
    </>
  );
}
