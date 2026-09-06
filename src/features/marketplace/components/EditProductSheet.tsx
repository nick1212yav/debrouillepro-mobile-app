import { UIService } from "@/core/sdk/ui/UIService";
import { Picker } from "@react-native-picker/picker";
import { Pressable, View, Text, TextInput } from "react-native";

// src/features/marketplace/components/EditProductSheet.tsx
import { useState, useCallback, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  X,
  ArrowLeft,
  Tag,
  FileText,
  MapPin,
  Layers,
  DollarSign,
  Truck,
  Check,
  Loader2,
  LocateFixed,
  Plus,
} from "lucide-react-native";
import { cn } from "@/lib/utils";
import ImageUploader from "@/components/ImageUploader";
import AIWriteAssist from "@/components/AIWriteAssist";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import type { Id } from "@/convex/_generated/dataModel";
import type { Product } from "../types";

// ✅ Correction : productId doit être Id<"publications"> car les produits sont des publications
interface EditProductSheetProps {
  isOpen: boolean;
  productId: Id<"publications">;
  onClose: () => void;
  onSuccess?: () => void;
}

// ── Sous-composants partagés ────────────────────────────────────────────────

function FieldInput({
  icon: Icon,
  placeholder,
  value,
  onChange,
  type = "text",
  required = false,
  disabled = false,
  min,
  max,
  step,
}: {
  icon?: React.ComponentType<{ size: number; className?: string }>;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <View
      className="rounded-2xl p-3.5 mb-2"
      style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid", opacity: disabled ? 0.5 : 1 }}
    >
      <View className="flex items-center gap-2.5">
        {Icon && <Icon size={14} className="flex-shrink-0 text-white/40" />}
        <TextInput
         
          value={value}
          onChangeText={(text) => onChange(text)}
          placeholder={placeholder}
         
         
          min={min}
          max={max}
          step={step}
          className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 outline-none disabled:cursor-not-allowed"
         editable={!(disabled)}/>
      </View>
    </View>
  );
}

function FieldTextarea({
  icon: Icon,
  placeholder,
  value,
  onChange,
  rows = 3,
  required = false,
}: {
  icon?: React.ComponentType<{ size: number; className?: string }>;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  required?: boolean;
}) {
  return (
    <View
      className="rounded-2xl p-3.5 mb-2"
      style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
    >
      <View className="flex items-start gap-2.5">
        {Icon && (
          <Icon size={14} className="flex-shrink-0 mt-0.5 text-white/40" />
        )}
        <TextInput
          value={value}
          onChangeText={(text) => onChange(text)}
          placeholder={placeholder}
         
         
          className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 outline-none"
         multiline textAlignVertical="top"/>
      </View>
    </View>
  );
}

function FieldSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  required = false,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <View className="space-y-1 mb-2">
      {label && (
        <Text className="text-xs text-white/60 font-medium">
          {label} {required && <Text className="text-red-400">*</Text>}
        </Text>
      )}
      <View
        className="rounded-2xl p-3.5"
        style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
      >
        <Picker
         
          onValueChange={(val) => onChange(val)}
         
          className="w-full bg-transparent text-white text-sm outline-none"
         selectedValue={value}>
          {placeholder && (
            <Picker.Item label={`${placeholder}`} value="" />
          )}
          {options.map((opt) => (
            <Picker.Item label={`${opt.label}`} value={opt.value} />
          ))}
        </Picker>
      </View>
    </View>
  );
}

function FieldSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View
      className="rounded-2xl p-3.5 mb-2 flex items-center gap-3"
      style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
    >
      <Pressable
       
        onPress={() => onChange(!checked)}
        className={cn(
          "w-5 h-5 rounded-md flex items-center justify-center transition-colors",
          checked ? "bg-orange-500" : "bg-white/10",
        )}
      >
        {checked && <Check size={12} className="text-white" />}
      </Pressable>
      <Text className="text-sm text-white/70">{label}</Text>
    </View>
  );
}

function TagsInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInput("");
    }
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <View
      className="rounded-2xl p-3.5 mb-2"
      style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
    >
      <View className="flex flex-wrap gap-1.5 mb-2">
        {value.map((tag) => (
          <Text
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs text-orange-400"
            style={{ backgroundColor: "#F9731625" }}
          >
            {tag}
            <Pressable
             
              onPress={() => removeTag(tag)}
              className=""
            >
              <X size={12} />
            </Pressable>
          </Text>
        ))}
      </View>
      <View className="flex items-center gap-2">
        <TextInput
          value={input}
          onChangeText={(text) => setInput(text)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 outline-none"
        />
        <Pressable
         
          onPress={addTag}
          disabled={!input.trim()}
          className="text-white/40 disabled:opacity-30"
        >
          <Plus size={16} className="text-orange-400" />
        </Pressable>
      </View>
    </View>
  );
}

function SubmitBtn({
  label,
  onClick,
  disabled,
  loading,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  loading?: boolean;
}) {
  const color = "#F97316";
  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onClick}
      className="w-full py-4 rounded-3xl text-white font-bold text-sm mt-3 disabled:opacity-40 flex items-center justify-center gap-2"
      style={{  }}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {loading ? "Mise à jour..." : label}
    </Pressable>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "Électronique", label: "Électronique" },
  { value: "Mode", label: "Mode" },
  { value: "Maison & Jardin", label: "Maison & Jardin" },
  { value: "Véhicules", label: "Véhicules" },
  { value: "Alimentation", label: "Alimentation" },
  { value: "Artisanat", label: "Artisanat" },
  { value: "Services", label: "Services" },
  { value: "Beauté & Santé", label: "Beauté & Santé" },
  { value: "Autre", label: "Autre" },
];

const CURRENCIES = [
  { value: "XAF", label: "FCFA (XAF)" },
  { value: "USD", label: "Dollar (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "CDF", label: "Franc Congolais (CDF)" },
];

const UNITS = [
  { value: "pièce", label: "Pièce" },
  { value: "kg", label: "Kilogramme" },
  { value: "lot", label: "Lot" },
  { value: "litre", label: "Litre" },
  { value: "mètre", label: "Mètre" },
];

export function EditProductSheet({
  isOpen,
  productId,
  onClose,
  onSuccess,
}: EditProductSheetProps) {
  const { isAuthenticated } = useFirebaseAuth();
  const updatePublication = useMutation(api.publications.updatePublication);

  // ── Récupération du produit ────────────────────────────────────────────────
  const productData = useQuery(
    api.publications.getPublication,
    isOpen ? { id: productId } : "skip",
  );

  // ── État du formulaire ──────────────────────────────────────────────────────
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    currency: "XAF",
    category: "",
    stock: "",
    unit: "pièce",
    deliveryAvailable: true,
    location: "",
    tags: [] as string[],
  });
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // ── Initialisation du formulaire avec les données du produit ──────────────
  useEffect(() => {
    if (productData && !initialized) {
      const meta = productData.meta ? JSON.parse(productData.meta) : {};
      setForm({
        title: productData.title || "",
        description: productData.description || "",
        price: productData.price || meta.price || "",
        currency: meta.currency || "XAF",
        category: productData.category || meta.category || "",
        stock: meta.stock?.toString() || "",
        unit: meta.unit || "pièce",
        deliveryAvailable: meta.deliveryAvailable ?? true,
        location: productData.location || meta.location || "",
        tags: productData.tags || [],
      });
      setImages(productData.images || meta.images || []);
      setInitialized(true);
    }
  }, [productData, initialized]);

  // ── Réinitialisation quand on ferme ────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setInitialized(false);
    }
  }, [isOpen]);

  const setField = (key: keyof typeof form) => (value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  // ── Détection de localisation ──────────────────────────────────────────────
  const detectLocation = useCallback(() => {
    if (!("geolocation" in undefined)) {
      UIService.openToast("Géolocalisation non supportée", "error");
      return;
    }
    setLocating(true);
    undefined.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
          );
          const data = (await res.json()) as {
            address?: {
              city?: string;
              town?: string;
              village?: string;
              suburb?: string;
              state?: string;
              country?: string;
            };
          };
          const addr = data.address;
          const place =
            addr?.city ??
            addr?.town ??
            addr?.village ??
            addr?.suburb ??
            addr?.state ??
            "";
          const country = addr?.country ?? "";
          setField("location")(
            place
              ? `${place}, ${country}`
              : `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
          );
          UIService.openToast("Position détectée !", "success");
        } catch {
          setField("location")(
            `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
          );
        }
        setLocating(false);
      },
      () => {
        UIService.openToast("Impossible de détecter la position", "error");
        setLocating(false);
      },
      { timeout: 10000 },
    );
  }, []);

  // ── Soumission ──────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      UIService.openToast("Veuillez remplir le titre et la description", "error");
      return;
    }

    if (!form.category) {
      UIService.openToast("Veuillez sélectionner une catégorie", "error");
      return;
    }

    setLoading(true);
    try {
      const stockNumber = parseInt(form.stock) || 0;
      const meta = {
        currency: form.currency,
        unit: form.unit,
        stock: stockNumber,
        deliveryAvailable: form.deliveryAvailable,
        price: form.price || undefined,
        location: form.location || undefined,
        category: form.category,
        images: images.filter(Boolean),
      };

      await updatePublication({
        publicationId: productId,
        title: form.title.trim(),
        description: form.description.trim(),
        price: form.price || undefined,
        location: form.location || undefined,
        category: form.category,
        images: images.filter(Boolean),
        tags: form.tags,
        meta: JSON.stringify(meta),
      });

      UIService.openToast("Produit mis à jour avec succès !", "success");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Erreur mise à jour produit:", error);
      UIService.openToast("Erreur lors de la mise à jour. Réessayez.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  if (!productData) {
    return (
      <View className="flex flex-col items-center justify-center py-8">
        <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
        <Text className="text-white/40 text-sm mt-3">Chargement du produit...</Text>
      </View>
    );
  }

  return (
    <View className="flex flex-col gap-0">
      {/* En‑tête */}
      <View className="flex items-center gap-3 mb-4">
        <Pressable
          onPress={onClose}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
        >
          <ArrowLeft size={16} className="text-white" />
        </Pressable>
        <Text className="text-white font-bold text-base flex-1">
          Modifier le produit
        </Text>
        <Pressable
          onPress={onClose}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
        >
          <X size={16} className="text-white/60" />
        </Pressable>
      </View>

      {/* Formulaire */}
      <View
        className="space-y-1 overflow-y-auto"
        style={{ maxHeight: "calc(90vh - 200px)" }}
      >
        <FieldInput
          icon={Tag}
          placeholder="Titre du produit *"
          value={form.title}
          onChange={setField("title")}
          required
        />

        <FieldTextarea
          icon={FileText}
          placeholder="Description détaillée *"
          value={form.description}
          onChange={setField("description")}
          rows={4}
          required
        />

        <AIWriteAssist
          contentType="product_description"
          topic={form.title}
          onGenerated={(text) => setField("description")(text)}
          description={form.description}
          category={form.category || undefined}
          color="#F97316"
          onTagsSuggested={(tags) => {
            setForm((prev) => ({
              ...prev,
              tags: [...new Set([...prev.tags, ...tags])],
            }));
          }}
        />

        <ImageUploader images={images} onChange={setImages} color="#F97316" />

        <View className="gap-2">
          <FieldInput
            icon={DollarSign}
            placeholder="Prix"
            value={form.price}
            onChange={setField("price")}
            type="number"
            min={0}
            step={0.01}
          />
          <FieldSelect
            label="Devise"
            value={form.currency}
            onChange={setField("currency")}
            options={CURRENCIES}
            placeholder="Devise"
          />
        </View>

        <FieldSelect
          label="Catégorie"
          value={form.category}
          onChange={setField("category")}
          options={CATEGORIES}
          placeholder="Sélectionnez une catégorie"
          required
        />

        <View className="gap-2">
          <FieldInput
            icon={Layers}
            placeholder="Quantité en stock"
            value={form.stock}
            onChange={setField("stock")}
            type="number"
            min={0}
          />
          <FieldSelect
            label="Unité"
            value={form.unit}
            onChange={setField("unit")}
            options={UNITS}
            placeholder="Unité"
          />
        </View>

        <FieldSwitch
          label="Livraison disponible"
          checked={form.deliveryAvailable}
          onChange={setField("deliveryAvailable")}
        />

        <View
          className="rounded-2xl p-3.5 mb-2"
          style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
        >
          <View className="flex items-center gap-2.5">
            <MapPin size={14} className="text-white/40" />
            <TextInput
              value={form.location}
              onChangeText={(text) => setField("location")(text)}
              placeholder="Localisation (ville, quartier)"
              className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 outline-none"
            />
            <Pressable
              onPress={detectLocation}
              disabled={locating}
              className="flex-shrink-0 disabled:opacity-40"
              title="Détecter ma position"
            >
              {locating ? (
                <Loader2 size={14} className="animate-spin text-orange-400" />
              ) : (
                <LocateFixed
                  size={14}
                  className="text-white/40"
                />
              )}
            </Pressable>
          </View>
        </View>

        <TagsInput
          value={form.tags}
          onChange={setField("tags")}
          placeholder="Tags (ex: premium, bio, fait main)"
        />

        <SubmitBtn
          label="Mettre à jour le produit"
          onPress={handleSubmit}
          disabled={
            !form.title.trim() || !form.description.trim() || !form.category
          }
          loading={loading}
        />
      </View>
    </View>
  );
}
