import { Picker } from "@react-native-picker/picker";
import { View, Pressable, Text, TextInput, NativeSyntheticEvent } from "react-native";

// src/features/agri/sheets/CreateAgriSheet.tsx
import { useState } from "react";
import {
  X,
  Loader2,
  Check,
  MapPin,
  Tag,
  FileText,
  ShoppingBag,
  Leaf,
} from "lucide-react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { toast } from "sonner";
import type {
  AgriCategory,
  AgriUnit,
  AgriQuality,
  AgriCondition,
} from "../types/product.types";
import { CATEGORY_LABELS } from "../constants/agri.categories";
import ImageUploader from "@/components/ImageUploader.tsx"; // ✅ Import de l'uploader d'images

interface CreateAgriSheetProps {
  isOpen?: boolean;
  onClose?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

const QUALITY_OPTIONS: { value: AgriQuality; label: string }[] = [
  { value: "premium", label: "Premium (A+)" },
  { value: "bonne", label: "Bonne qualité" },
  { value: "standard", label: "Standard / Ordinaire" },
  { value: "recolte", label: "Brut de récolte" },
  { value: "bio", label: "Certifié Bio" },
];

const UNIT_OPTIONS: { value: AgriUnit; label: string }[] = [
  { value: "kg", label: "Kilogrammes (kg)" },
  { value: "tonne", label: "Tonnes" },
  { value: "sac", label: "Sacs" },
  { value: "botte", label: "Bottes" },
  { value: "piece", label: "Pièces" },
  { value: "litre", label: "Litres" },
];

export function CreateAgriSheet({
  isOpen,
  onClose,
  open,
  onOpenChange,
  onSuccess,
}: CreateAgriSheetProps) {
  const createProduct = useMutation(api.agri?.createProduct);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]); // ✅ État local pour stocker les URLs d'images

  // Détermination de l'état d'ouverture dynamique
  const activeOpen = open !== undefined ? open : isOpen || false;
  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  };

  // Formulaire d'annonce agricole complet
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "cereales" as AgriCategory,
    subcategory: "",
    variety: "",
    quality: "standard" as AgriQuality,
    condition: "frais" as AgriCondition,
    price: "",
    currency: "USD",
    priceUnit: "kg" as AgriUnit,
    negotiable: false,
    availableQuantity: "",
    minimumOrder: "",
    city: "",
    province: "Lualaba",
    pickupAvailable: true,
    deliveryAvailable: false,
  });

  const handleFieldChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: NativeSyntheticEvent<any>) => {
    e.preventDefault();
    if (
      !form.title ||
      !form.description ||
      !form.price ||
      !form.availableQuantity ||
      !form.city
    ) {
      toast.error("Veuillez remplir tous les champs obligatoires (*)");
      return;
    }

    setLoading(true);
    try {
      if (createProduct) {
        await createProduct({
          title: form.title,
          description: form.description,
          category: form.category,
          subcategory: form.subcategory || undefined,
          variety: form.variety || undefined,
          quality: form.quality,
          condition: form.condition,
          pricing: {
            price: parseFloat(form.price),
            currency: form.currency,
            priceUnit: form.priceUnit,
            negotiable: form.negotiable,
          },
          quantity: {
            available: parseFloat(form.availableQuantity),
            unit: form.priceUnit,
            minimumOrder: form.minimumOrder
              ? parseFloat(form.minimumOrder)
              : undefined,
          },
          location: {
            country: "Congo (RDC)",
            province: form.province,
            city: form.city,
          },
          delivery: {
            available: form.deliveryAvailable,
            pickupAvailable: form.pickupAvailable,
          },
          images: images, // ✅ Transmis au serveur Convex
        });
      }
      toast.success("Annonce agricole publiée avec succès !");
      setImages([]); // Réinitialisation locale des images après publication réussie
      onSuccess?.();
      handleClose();
    } catch (err) {
      toast.error("Erreur lors de la création de la publication");
    } finally {
      setLoading(false);
    }
  };

  return (
<View>
      {activeOpen && (
        <>
          {/* Arrière-plan opacifié */}
          <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onPress={handleClose} className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm" />

          {/* Panneau de dialogue bas */}
          <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[32px] border-t border-white/5 bg-gradient-to-b from-[#0a0f0b] to-[#040604] overflow-hidden" style={{ maxHeight: "88vh" }}>
            {/* Barre de traction tactile */}
            <View className="flex justify-center pt-3 pb-1"><View className="w-10 h-1 rounded-full bg-white/20" /></View>

            {/* Contenu du formulaire défilant */}
            <View className="px-5 pb-8 overflow-y-auto" style={{ maxHeight: "82vh" }}><View className="flex items-center justify-between py-2 mb-4"><View className="flex items-center gap-2"><Leaf className="text-green-400 animate-pulse" size={18} /><Text className="text-white font-black text-lg">Publier une récolte
                  </Text></View><Pressable onPress={handleClose} className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/[0.04] border border-white/5 text-white/50 active:scale-95 transition-transform"><X size={15} /></Pressable></View><View className="space-y-4">{}<View className="space-y-1.5"><Text className="text-[10px] text-white/40 uppercase tracking-widest font-semibold block">Catégorie *
                  </Text><View className="flex flex-wrap gap-2">{(Object.keys(CATEGORY_LABELS) as AgriCategory[]).map(
                      (cat) => {
                        const isSelected = form.category === cat;
                        return (
                          <Pressable key={cat} onPress={() => handleFieldChange("category", cat)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                              isSelected
                                ? "bg-green-500/10 border-green-500/40 text-green-400"
                                : "bg-white/[0.02] border-white/5 text-white/50"
                            }`}>{CATEGORY_LABELS[cat]}</Pressable>
                        );
                      },
                    )}</View></View>{}<View className="rounded-2xl p-3.5 bg-white/[0.03] border border-white/5"><View className="flex items-center gap-2.5"><Tag size={14} className="text-green-500" /><TextInput value={form.title} onChangeText={(value) =>
                        handleFieldChange("title", value)} placeholder="Titre de l'annonce (ex : Sacs de Manioc frais) *" className="flex-1 bg-transparent text-white text-xs placeholder:text-white/20 outline-none font-semibold" /></View></View>{}<View className="gap-3"><View className="rounded-2xl p-3 bg-white/[0.03] border border-white/5 flex items-center gap-2"><Leaf size={12} className="text-green-500" /><TextInput value={form.variety} onChangeText={(value) =>
                        handleFieldChange("variety", value)} placeholder="Variété (ex : Jaune)" className="flex-1 bg-transparent text-white text-[11px] placeholder:text-white/20 outline-none" /></View><View className="rounded-2xl p-3 bg-white/[0.03] border border-white/5 flex items-center gap-2"><ShoppingBag size={12} className="text-green-500" /><TextInput value={form.subcategory} onChangeText={(value) =>
                        handleFieldChange("subcategory", value)} placeholder="Sous-catégorie" className="flex-1 bg-transparent text-white text-[11px] placeholder:text-white/20 outline-none" /></View></View>{}<View className="space-y-1.5"><Text className="text-[10px] text-white/40 uppercase tracking-widest font-semibold block">Qualité certifiée
                  </Text><View className="flex flex-wrap gap-2">{QUALITY_OPTIONS.map((item) => {
                      const isSelected = form.quality === item.value;
                      return (
                        <Pressable key={item.value} onPress={() =>
                            handleFieldChange("quality", item.value)} className={`px-3 py-1.5 rounded-full text-[10px] font-semibold border transition-all ${
                            isSelected
                              ? "bg-green-500/10 border-green-500/40 text-green-400"
                              : "bg-white/[0.02] border-white/5 text-white/40"
                          }`}>{item.label}</Pressable>
                      );
                    })}</View></View>{}<View className="rounded-2xl p-3.5 bg-white/[0.03] border border-white/5"><View className="flex items-start gap-2.5"><FileText size={14} className="text-green-500 mt-0.5" /><TextInput value={form.description} onChangeText={(value) =>
                        handleFieldChange("description", value)} placeholder="Détails du produit, variété, conditions de stockage, négociation..." className="flex-1 bg-transparent text-white text-xs placeholder:text-white/20 outline-none" multiline textAlignVertical="top" /></View></View>{}<View className="space-y-2"><Text className="text-[10px] text-white/40 uppercase tracking-widest font-semibold block">Photos du produit
                  </Text><ImageUploader images={images} onChange={setImages} color="#22C55E" /></View>{}<View className="gap-2"><View className="rounded-2xl p-3 bg-white/[0.03] border border-white/5 flex items-center gap-1.5"><Text className="text-[10px] font-black text-white/30">{form.currency}</Text><TextInput value={form.price} onChangeText={(value) =>
                        handleFieldChange("price", value)} placeholder="Prix *" className="flex-1 bg-transparent text-white text-xs outline-none" keyboardType="numeric" /></View><View className="rounded-2xl p-3 bg-white/[0.03] border border-white/5 flex items-center gap-1"><TextInput value={form.availableQuantity} onChangeText={(value) =>
                        handleFieldChange("availableQuantity", value)} placeholder="Qte dispo *" className="flex-1 bg-transparent text-white text-xs outline-none" keyboardType="numeric" /></View><View className="rounded-2xl p-2 bg-white/[0.03] border border-white/5 flex items-center"><Picker onValueChange={(value) =>
                        handleFieldChange(
                          "priceUnit",
                          value as AgriUnit,
                        )} className="w-full bg-transparent text-white text-xs outline-none" selectedValue={form.priceUnit}>{UNIT_OPTIONS.map((u) => (
                        <Picker.Item label="/ {u.value}" value={u.value} />
                      ))}</Picker></View></View>{}<View className="rounded-2xl p-3.5 bg-white/[0.03] border border-white/5"><View className="flex items-center gap-2.5"><MapPin size={14} className="text-green-500" /><TextInput value={form.city} onChangeText={(value) =>
                        handleFieldChange("city", value)} placeholder="Ville d'enlèvement (ex : Kolwezi) *" className="flex-1 bg-transparent text-white text-xs placeholder:text-white/20 outline-none" /></View></View>{}<View className="gap-3 pt-2"><Pressable onPress={() =>
                      handleFieldChange(
                        "pickupAvailable",
                        !form.pickupAvailable,
                      )
                    } className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-colors ${
                      form.pickupAvailable
                        ? "bg-green-500/5 border-green-500/20 text-white"
                        : "bg-white/[0.01] border-white/5 text-white/30"
                    }`}><Text className="text-xs font-bold">Retrait sur place</Text><View className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                        form.pickupAvailable
                          ? "bg-green-500 border-green-500 text-black"
                          : "border-white/10"
                      }`}>{form.pickupAvailable && (
                        <Check size={10} strokeWidth={3} />
                      )}</View></Pressable><Pressable onPress={() =>
                      handleFieldChange(
                        "deliveryAvailable",
                        !form.deliveryAvailable,
                      )
                    } className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-colors ${
                      form.deliveryAvailable
                        ? "bg-green-500/5 border-green-500/20 text-white"
                        : "bg-white/[0.01] border-white/5 text-white/30"
                    }`}><Text className="text-xs font-bold">Livraison possible
                    </Text><View className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                        form.deliveryAvailable
                          ? "bg-green-500 border-green-500 text-black"
                          : "border-white/10"
                      }`}>{form.deliveryAvailable && (
                        <Check size={10} strokeWidth={3} />
                      )}</View></Pressable></View>{}<Pressable whileTap={{ scale: 0.98 }} disabled={
                    loading ||
                    !form.title ||
                    !form.description ||
                    !form.price ||
                    !form.availableQuantity ||
                    !form.city
                  } className="w-full py-4 rounded-3xl font-black text-xs text-black transition-all bg-green-400 disabled:opacity-30 disabled:pointer-events-none mt-4 flex items-center justify-center gap-2">{loading && <Loader2 size={14} className="animate-spin" />}<Text>{loading
                      ? "Publication du produit..."
                      : "Publier mon offre agricole"}</Text></Pressable></View></View>
          </View>
        </>
      )}
    </View>
  );
}
