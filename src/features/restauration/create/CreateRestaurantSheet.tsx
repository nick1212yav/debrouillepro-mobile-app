import { View, Pressable, Text } from "react-native";

// src/features/restauration/create/CreateRestaurantSheet.tsx
import { useState } from "react";
import { X, ArrowLeft } from "lucide-react-native";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { CreateRestaurantForm } from "./CreateRestaurantForm";

interface CreateRestaurantSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateRestaurantSheet({
  open,
  onOpenChange,
  onSuccess,
}: CreateRestaurantSheetProps) {
  const [loading, setLoading] = useState(false);
  const createPublication = useMutation(api.publications.createPublication);

  const handleSubmit = async (data: any): Promise<boolean> => {
    setLoading(true);
    try {
      await createPublication({
        type: "restauration",
        title: data.name || "Restaurant",
        description: data.description || "",
        meta: JSON.stringify({
          cuisine: data.cuisine,
          location: data.location,
          priceRange: data.priceRange,
          deliveryTime: data.deliveryTime,
          openingHours: data.openingHours,
          deliveryAreas: data.deliveryAreas,
          hasDelivery: data.hasDelivery,
          hasTakeaway: data.hasTakeaway,
          hasDineIn: data.hasDineIn,
          hasReservation: data.hasReservation,
          images: data.images || [],
        }),
        images: data.images || [],
        tags: data.tags || [],
        location: data.location || "",
        price: data.priceRange ? data.priceRange : undefined,
      });
      toast.success("Restaurant créé avec succès !");
      onOpenChange(false);
      onSuccess?.();
      return true;
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la création");
      return false;
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
<View>
      <View className="fixed inset-0 z-50 flex items-end"><View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onPress={() => onOpenChange(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" /><View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="relative w-full max-h-[92vh] overflow-hidden rounded-t-[32px] bg-gradient-to-b from-[#0c0d1e] to-[#080816] border-t border-white/10"><View className="flex justify-center pt-3"><View className="w-10 h-1 rounded-full bg-white/20" /></View><View className="px-5 pt-2 pb-4 flex items-center gap-3 border-b border-white/5"><Pressable onPress={() => onOpenChange(false)} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5"><ArrowLeft size={18} className="text-white" /></Pressable><View className="flex-1"><Text className="text-white text-xl font-black">Créer un restaurant
              </Text><Text className="text-white/40 text-xs font-medium">Remplissez les informations de votre établissement
              </Text></View><Pressable onPress={() => onOpenChange(false)} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5"><X size={18} className="text-white/60" /></Pressable></View><View className="overflow-y-auto px-5 pb-8 pt-4" style={{ maxHeight: "calc(92vh - 130px)" }}><CreateRestaurantForm onSubmit={handleSubmit} isLoading={loading} /></View></View></View>
    </View>
  );
}
