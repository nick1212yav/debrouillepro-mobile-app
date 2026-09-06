import { UIService } from "@/core/sdk/ui/UIService";
import { View, Pressable, Text, TextInput } from "react-native";

// src/features/agri/sheets/EditAgriSheet.tsx
import { useState, useEffect } from "react";
import {
  X,
  Loader2,
  Check,
  MapPin,
  Tag,
  FileText,
  Leaf,
  ShoppingBag,
} from "lucide-react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type {
  AgriProduct,
  AgriCategory,
  AgriUnit,
  AgriQuality,
  AgriCondition,
} from "../types/product.types";
import { CATEGORY_LABELS } from "../constants/agri.categories";

interface EditAgriSheetProps {
  isOpen: boolean;
  onClose: () => void;
  product: AgriProduct;
  onSuccess?: () => void;
}

const QUALITY_OPTIONS: { value: AgriQuality; label: string }[] = [
  { value: "premium", label: "Premium (A+)" },
  { value: "bonne", label: "Bonne qualité" },
  { value: "standard", label: "Standard / Ordinaire" },
  { value: "recolte", label: "Brut de récolte" },
  { value: "bio", label: "Bio certifié" },
];

export function EditAgriSheet({
  isOpen,
  onClose,
  product,
  onSuccess,
}: EditAgriSheetProps) {
  const updateProduct = useMutation(api.agri?.updateProduct);
  const [loading, setLoading] = useState(false);

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
    city: "",
    province: "Lualaba",
    pickupAvailable: true,
    deliveryAvailable: false,
  });

  // Remplir le formulaire avec les valeurs existantes de l'annonce à l'ouverture
  useEffect(() => {
    if (product) {
      setForm({
        title: product.title,
        description: product.description,
        category: product.category,
        subcategory: product.subcategory || "",
        variety: product.variety || "",
        quality: product.quality,
        condition: product.condition || "frais",
        price: product.pricing.price.toString(),
        currency: product.pricing.currency,
        priceUnit: product.pricing.priceUnit,
        negotiable: product.pricing.negotiable,
        availableQuantity: product.quantity.available.toString(),
        city: product.location.city,
        province: product.location.province || "Lualaba",
        pickupAvailable: product.delivery.pickupAvailable,
        deliveryAvailable: product.delivery.available,
      });
    }
  }, [product]);

  const handleFieldChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: unknown) => {
    if (
      !form.title ||
      !form.description ||
      !form.price ||
      !form.availableQuantity ||
      !form.city
    ) {
      UIService.openToast("Veuillez remplir tous les champs obligatoires (*)", "error");
      return;
    }

    setLoading(true);
    try {
      if (updateProduct) {
        await updateProduct({
          id: product._id,
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
        });
      }
      UIService.openToast("Annonce agricole mise à jour !", "success");
      onSuccess?.();
      onClose();
    } catch {
      UIService.openToast("Erreur lors de la modification de l'annonce", "error");
    } finally {
      setLoading(false);
    }
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
            style={{ maxHeight: "88vh" }}
          >
            <View className="flex justify-center pt-3 pb-1">
              <View className="w-10 h-1 rounded-full bg-white/20" />
            </View>

            <View
             
              className="px-5 pb-8 overflow-y-auto"
              style={{ maxHeight: "82vh" }}
            >
              <View className="flex items-center justify-between py-2 mb-4">
                <Text className="text-white font-black text-lg">
                  Modifier mon offre
                </Text>
                <Pressable
                 
                  onPress={onClose}
                  className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/[0.04] border border-white/5 text-white/50"
                >
                  <X size={15} />
                </Pressable>
              </View>

              <View className="space-y-4">
                <View className="space-y-1.5">
                  <Text className="text-[10px] text-white/40 uppercase tracking-widest font-semibold block">
                    Catégorie *
                  </Text>
                  <View className="flex flex-wrap gap-2">
                    {(Object.keys(CATEGORY_LABELS) as AgriCategory[]).map(
                      (cat) => (
                        <Pressable
                          key={cat}
                         
                          onPress={() => handleFieldChange("category", cat)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                            form.category === cat
                              ? "bg-green-500/10 border-green-500/40 text-green-400"
                              : "bg-white/[0.02] border-white/5 text-white/50"
                          }`}
                        >
                          {CATEGORY_LABELS[cat]}
                        </Pressable>
                      ),
                    )}
                  </View>
                </View>

                <View className="rounded-2xl p-3.5 bg-white/[0.03] border border-white/5 flex items-center gap-2.5">
                  <Tag size={14} className="text-green-500" />
                  <TextInput
                   
                    value={form.title}
                    onChangeText={(text) => handleFieldChange("title", text)}
                    placeholder="Titre de l'annonce *"
                    className="flex-1 bg-transparent text-white text-xs outline-none font-semibold"
                  />
                </View>

                <View className="gap-3">
                  <View className="rounded-2xl p-3 bg-white/[0.03] border border-white/5 flex items-center gap-2">
                    <Leaf size={12} className="text-green-500" />
                    <TextInput
                     
                      value={form.variety}
                      onChangeText={(text) =>
                        handleFieldChange("variety", text)
                      }
                      placeholder="Variété"
                      className="flex-1 bg-transparent text-white text-[11px] outline-none"
                    />
                  </View>
                  <View className="rounded-2xl p-3 bg-white/[0.03] border border-white/5 flex items-center gap-2">
                    <ShoppingBag size={12} className="text-green-500" />
                    <TextInput
                     
                      value={form.subcategory}
                      onChangeText={(text) =>
                        handleFieldChange("subcategory", text)
                      }
                      placeholder="Sous-catégorie"
                      className="flex-1 bg-transparent text-white text-[11px] outline-none"
                    />
                  </View>
                </View>

                <View className="space-y-1.5">
                  <Text className="text-[10px] text-white/40 uppercase tracking-widest font-semibold block">
                    Qualité
                  </Text>
                  <View className="flex flex-wrap gap-2">
                    {QUALITY_OPTIONS.map((item) => (
                      <Pressable
                        key={item.value}
                       
                        onPress={() => handleFieldChange("quality", item.value)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-semibold border transition-all ${
                          form.quality === item.value
                            ? "bg-green-500/10 border-green-500/40 text-green-400"
                            : "bg-white/[0.02] border-white/5 text-white/40"
                        }`}
                      >
                        {item.label}
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View className="rounded-2xl p-3.5 bg-white/[0.03] border border-white/5 flex items-start gap-2.5">
                  <FileText size={14} className="text-green-500 mt-0.5" />
                  <TextInput
                    value={form.description}
                    onChangeText={(text) =>
                      handleFieldChange("description", text)
                    }
                    placeholder="Description *"
                   
                    className="flex-1 bg-transparent text-white text-xs outline-none"
                   multiline textAlignVertical="top"/>
                </View>

                <View className="gap-3">
                  <View className="rounded-2xl p-3 bg-white/[0.03] border border-white/5 flex items-center gap-1.5">
                    <Text className="text-[10px] font-black text-white/30">
                      {form.currency}
                    </Text>
                    <TextInput
                     
                      value={form.price}
                      onChangeText={(text) =>
                        handleFieldChange("price", text)
                      }
                      placeholder="Prix *"
                      className="flex-1 bg-transparent text-white text-xs outline-none"
                     keyboardType="numeric"/>
                  </View>

                  <View className="rounded-2xl p-3 bg-white/[0.03] border border-white/5 flex items-center gap-1">
                    <TextInput
                     
                      value={form.availableQuantity}
                      onChangeText={(text) =>
                        handleFieldChange("availableQuantity", text)
                      }
                      placeholder="Quantité *"
                      className="flex-1 bg-transparent text-white text-xs outline-none"
                     keyboardType="numeric"/>
                  </View>
                </View>

                <View className="rounded-2xl p-3.5 bg-white/[0.03] border border-white/5 flex items-center gap-2.5">
                  <MapPin size={14} className="text-green-500" />
                  <TextInput
                   
                    value={form.city}
                    onChangeText={(text) => handleFieldChange("city", text)}
                    placeholder="Ville d'enlèvement *"
                    className="flex-1 bg-transparent text-white text-xs outline-none"
                  />
                </View>

                <Pressable
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-3xl font-black text-xs text-black bg-green-400 disabled:opacity-30 mt-4 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  <Text>
                    {loading
                      ? "Enregistrement..."
                      : "Enregistrer les modifications"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </>
      )}
    </>
  );
}
