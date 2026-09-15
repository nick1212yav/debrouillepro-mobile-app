import { Picker } from "@react-native-picker/picker";
import { View, Pressable, Text, TextInput, NativeSyntheticEvent, TextInputChangeEventData } from "react-native";

// src/features/marketplace/components/CreateProductSheet.tsx
// ✅ Version finale – upload robuste et production-ready

import { useState, useCallback, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import {
  X,
  ArrowLeft,
  Tag,
  FileText,
  MapPin,
  Package,
  DollarSign,
  Layers,
  Truck,
  Check,
  Loader2,
  LocateFixed,
  Plus,
  Image as ImageIcon,
  Sparkles,
  Shield,
  ChevronDown,
  ChevronUp,
  Home,
} from "lucide-react-native";
import { cn } from "@/lib/utils";
import ImageUploader from "@/components/ImageUploader";
import AIWriteAssist from "@/components/AIWriteAssist";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

interface CreateProductSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// ── Barre de progression ──────────────────────────────────────────────────────
function ProgressBar({ current, total }: { current: number; total: number }) {
  const percentage = Math.round((current / total) * 100);
  return (
    <View className="space-y-1.5 mb-4"><View className="flex items-center justify-between text-xs"><Text className="text-white/50">Progression</Text><Text className="text-white/70 font-medium">{percentage}%</Text></View><View className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden"><View className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500" initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 0.5 }} /></View><View className="flex justify-between text-[10px] text-white/30"><Text>Informations</Text><Text>Photos</Text><Text>Livraison</Text><Text>Publication</Text></View></View>
  );
}

// ── Score qualité ────────────────────────────────────────────────────────────
function QualityScore({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 80) return "text-green-400";
    if (score >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  const getLabel = () => {
    if (score >= 80) return "Excellent";
    if (score >= 50) return "Bon";
    return "À améliorer";
  };

  return (
    <View className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5"><Shield size={16} className={getColor()} /><Text className="text-white/70 text-sm">Score qualité :{" "}<Text className={cn("font-bold", getColor())}>{score}%</Text></Text><Text className="text-white/40 text-xs">({getLabel()})</Text></View>
  );
}

// ── Champ Prix avec conversion ──────────────────────────────────────────────
function PriceField({
  value,
  currency,
  onPriceChange,
  onCurrencyChange,
  currencies,
}: {
  value: string;
  currency: string;
  onPriceChange: (v: string) => void;
  onCurrencyChange: (v: string) => void;
  currencies: { value: string; label: string }[];
}) {
  const estimatedUsd = value ? (parseFloat(value) / 600).toFixed(2) : null;
  return (
    <View className="space-y-1.5"><View className="flex items-center gap-2"><DollarSign size={14} className="text-white/40" /><Text className="text-white/60 text-xs font-medium">Prix</Text></View><View className="gap-2"><View className=""><View className="rounded-2xl p-3.5" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><TextInput value={value} onChangeText={(value) => onPriceChange(value)} placeholder="Ex: 15000" className="w-full bg-transparent text-white text-sm placeholder:text-white/25 outline-none" keyboardType="numeric" /></View>{estimatedUsd && (
            <Text className="text-[10px] text-white/30 mt-1">≈ {estimatedUsd}USD
            </Text>
          )}</View><View><View className="rounded-2xl p-3.5" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><Picker onValueChange={(value) => onCurrencyChange(value)} className="w-full bg-transparent text-white text-sm outline-none" selectedValue={currency}>{currencies.map((c) => (
                <Picker.Item label={c.label} value={c.value} />
              ))}</Picker></View></View></View></View>
  );
}

// ── Champ Catégorie avec icônes ─────────────────────────────────────────────
const CATEGORY_ICONS: Record<
  string,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  Électronique: Package,
  Mode: Tag,
  "Maison & Jardin": Home,
  Véhicules: Truck,
  Alimentation: Package,
  Artisanat: Package,
  Services: Package,
  "Beauté & Santé": Package,
  Autre: Package,
};

function CategoryField({
  value,
  onChange,
  options,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <View className="space-y-1.5"><Text className="text-white/60 text-xs font-medium">Catégorie {required && <Text className="text-red-400">*</Text>}</Text><View className="relative"><Pressable onPress={() => setIsOpen(!isOpen)} className="w-full rounded-2xl p-3.5 flex items-center justify-between" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><Text className="text-white text-sm">{selected ? selected.label : "Sélectionnez une catégorie"}</Text>{isOpen ? (
            <ChevronUp size={16} className="text-white/40" />
          ) : (
            <ChevronDown size={16} className="text-white/40" />
          )}</Pressable><View>{isOpen && (
            <View initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full left-0 right-0 mt-1 z-20 max-h-48 overflow-y-auto rounded-2xl p-1" style={{ backgroundColor: "#0e0e22", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
              {options.map((opt) => {
                const Icon = CATEGORY_ICONS[opt.value] || Package;
                return (
                  <Pressable key={opt.value} onPress={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }} className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors",
                      value === opt.value
                        ? "bg-orange-500/20 text-orange-400"
                        : "text-white/70 hover:bg-white/5",
                    )}><Icon size={16} className={
                        value === opt.value
                          ? "text-orange-400"
                          : "text-white/30"
                      } />{opt.label}</Pressable>
                );
              })}
            </View>
          )}</View></View></View>
  );
}

// ── Zone d'upload améliorée (avec input caché) ─────────────────────────────
function ImageUploadZone({
  images,
  onChange,
  color,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  color: string;
}) {
  const fileInputRef = useRef<TextInput>(null);

  const handleFileChange = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages = Array.from(files).map((file) =>
      URL.createObjectURL(file),
    );
    onChange([...images, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <View className="space-y-2"><View className="flex items-center gap-2"><ImageIcon size={14} className="text-white/40" /><Text className="text-white/60 text-xs font-medium">Photos du produit
        </Text><Text className="text-white/20 text-[10px]">({images.length}/10)</Text></View>{images.length === 0 ? (
        <View className="relative rounded-2xl border-2 border-dashed p-8 text-center transition-colors" style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)" }}><View className="flex flex-col items-center gap-2"><View className="p-3 rounded-full bg-white/5"><ImageIcon size={24} className="text-white/20" /></View><Text className="text-white/30 text-sm">Glissez vos photos ici</Text><Text className="text-white/20 text-xs">ou</Text><Pressable onPress={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-xl text-sm font-medium text-orange-400" style={{ backgroundColor: `${color}20` }}><Text>Ajouter des photos</Text></Pressable><TextInput ref={fileInputRef} className="hidden" onChangeText={handleFileChange} /></View></View>
      ) : (
        <ImageUploader images={images} onChange={onChange} color={color} />
      )}</View>
  );
}

// ─── Champs partagés ─────────────────────────────────────────────────────────
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
    <View className="rounded-2xl p-3.5" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid", opacity: disabled ? 0.5 : 1 }}><View className="flex items-center gap-2.5">{Icon && <Icon size={14} className="flex-shrink-0 text-white/40" />}<TextInput value={value} onChangeText={(value) => onChange(value)} placeholder={placeholder} required={required} className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 outline-none" editable={!(disabled)} /></View></View>
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
    <View className="rounded-2xl p-3.5" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><View className="flex items-start gap-2.5">{Icon && (
          <Icon size={14} className="flex-shrink-0 mt-0.5 text-white/40" />
        )}<TextInput value={value} onChangeText={(value) => onChange(value)} placeholder={placeholder} required={required} className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 outline-none" multiline textAlignVertical="top" /></View></View>
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
    <View className="rounded-2xl p-3.5 flex items-center gap-3" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><Pressable onPress={() => onChange(!checked)} className={cn(
          "w-5 h-5 rounded-md flex items-center justify-center transition-colors",
          checked ? "bg-orange-500" : "bg-white/10",
        )}>{checked && <Check size={12} className="text-white" />}</Pressable><Text className="text-sm text-white/70">{label}</Text></View>
  );
}

function TagsInput({
  value,
  onChange,
  placeholder,
  color = "#F97316",
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  color?: string;
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
    <View className="rounded-2xl p-3.5" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><View className="flex flex-wrap gap-1.5 mb-2">{value.map((tag) => (
          <Text key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs" style={{ backgroundColor: `${color}25`, color: color }}>{tag}<Pressable onPress={() => removeTag(tag)} className="transition-colors"><X size={12} /></Pressable></Text>
        ))}</View><View className="flex items-center gap-2"><TextInput value={input} onChangeText={(value) => setInput(value)} onKeyPress={(e) => e.nativeEvent.key === "Enter" && (e.preventDefault(), addTag())} placeholder={placeholder} className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 outline-none" /><Pressable onPress={addTag} disabled={!input.trim()} className="text-white/40 transition-colors disabled:opacity-30"><Plus size={16} style={{ color }} /></Pressable></View></View>
  );
}

// ─── Bouton de soumission ────────────────────────────────────────────────────
function SubmitBtn({
  color = "#F97316",
  label,
  onClick,
  disabled,
  loading,
  qualityScore,
}: {
  color?: string;
  label: string;
  onClick: () => void;
  disabled: boolean;
  loading?: boolean;
  qualityScore?: number;
}) {
  return (
    <View className="space-y-3">{qualityScore !== undefined && <QualityScore score={qualityScore} />}<Pressable whileTap={{ scale: 0.97 }} disabled={disabled || loading} onPress={onClick} className="w-full py-4 rounded-3xl text-white font-bold text-sm disabled:opacity-40 transition-opacity flex items-center justify-center gap-2" style={{ boxShadow: `0 8px 24px ${color}40` }}>{loading && <Loader2 size={16} className="animate-spin" />}{loading ? "Publication en cours..." : label}</Pressable></View>
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
  { value: "XAF", label: "FCFA" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "CDF", label: "CDF" },
];

const UNITS = [
  { value: "pièce", label: "Pièce" },
  { value: "kg", label: "Kg" },
  { value: "lot", label: "Lot" },
  { value: "litre", label: "Litre" },
  { value: "mètre", label: "Mètre" },
];

export function CreateProductSheet({
  isOpen,
  onClose,
  onSuccess,
}: CreateProductSheetProps) {
  const { isAuthenticated } = useFirebaseAuth();
  const createPublication = useMutation(api.publications.createPublication);
  const createProduct = useMutation(api.commerce.createProduct);
  const generateUploadUrl = useMutation(
    api.publications.generatePublicationUploadUrl,
  );

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

  const getQualityScore = useCallback(() => {
    let score = 0;
    if (form.title.length >= 10) score += 20;
    if (form.description.length >= 50) score += 25;
    if (form.category) score += 15;
    if (form.price && parseFloat(form.price) > 0) score += 15;
    if (images.length > 0) score += 15;
    if (form.tags.length >= 2) score += 10;
    return Math.min(score, 100);
  }, [form, images]);

  const setField = (key: keyof typeof form) => (value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  const detectLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      toast.error("Géolocalisation non supportée");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
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
          toast.success("Position détectée !");
        } catch {
          setField("location")(
            `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
          );
        }
        setLocating(false);
      },
      () => {
        toast.error("Impossible de détecter la position");
        setLocating(false);
      },
      { timeout: 10000 },
    );
  }, []);

  const handleSubmit = async () => {
    console.log("🚀 [CreateProductSheet] handleSubmit start");

    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Veuillez remplir le titre et la description");
      return;
    }
    if (!form.category) {
      toast.error("Veuillez sélectionner une catégorie");
      return;
    }

    setLoading(true);
    try {
      const stockNumber = parseInt(form.stock) || 0;
      const priceNumber = parseFloat(form.price) || 0;

      console.log("📸 [CreateProductSheet] images avant upload:", images);

      // ✅ Étape 1 : Uploader les images sur Convex Storage
      const uploadedImageIds: string[] = [];
      for (const img of images) {
        console.log("📤 [CreateProductSheet] Traitement de l'image:", img);

        if (img.startsWith("http://") || img.startsWith("https://")) {
          console.log("  ✅ URL déjà publique, on la garde");
          uploadedImageIds.push(img);
          continue;
        }

        if (img.startsWith("data:") || img.startsWith("blob:")) {
          try {
            console.log("  📤 Upload d'une data/blob URL...");
            const uploadUrl = await generateUploadUrl();
            console.log("  📤 Upload URL générée:", uploadUrl);

            const imageResponse = await fetch(img);
            const blob = await imageResponse.blob();
            console.log(
              "  📤 Blob créé, taille:",
              blob.size,
              "type:",
              blob.type,
            );

            const uploadResponse = await fetch(uploadUrl, {
              method: "POST",
              body: blob,
              headers: {
                "Content-Type": blob.type || "image/png",
              },
            });

            if (!uploadResponse.ok) {
              const errText = await uploadResponse.text();
              console.error(
                "  ❌ Upload failed:",
                uploadResponse.status,
                errText,
              );
              throw new Error(`Upload failed: ${uploadResponse.status}`);
            }

            let storageId: string | null = null;
            const contentType = uploadResponse.headers.get("content-type");

            if (contentType?.includes("application/json")) {
              const json = await uploadResponse.json();
              console.log("  📦 Réponse JSON de Convex:", json);
              storageId = json.storageId || json.id || null;
            } else {
              const text = await uploadResponse.text();
              console.log("  📦 Réponse texte de Convex:", text);
              if (text && text.startsWith("kg")) storageId = text;
            }

            if (!storageId) {
              const location = uploadResponse.headers.get("location");
              if (location) {
                const urlObj = new URL(location, window.location.origin);
                storageId = urlObj.searchParams.get("storageId");
              }
            }

            if (!storageId) {
              const urlObj = new URL(uploadUrl);
              storageId = urlObj.searchParams.get("storageId");
            }

            if (storageId) {
              console.log("  ✅ Storage ID récupéré:", storageId);
              uploadedImageIds.push(storageId);
            } else {
              console.error("  ❌ Impossible de récupérer le storageId");
              throw new Error("Storage ID manquant");
            }
          } catch (err) {
            console.error("❌ Erreur upload image:", err);
            toast.error("Erreur lors de l'upload d'une image");
            return;
          }
        } else {
          console.warn("  ⚠️ Format d'image non reconnu:", img);
        }
      }

      console.log(
        "📸 [CreateProductSheet] uploadedImageIds final:",
        uploadedImageIds,
      );

      if (images.length > 0 && uploadedImageIds.length === 0) {
        toast.error("Aucune image n'a pu être uploadée");
        return;
      }

      // ✅ Étape 2 : Créer le produit
      console.log("🛠️ [CreateProductSheet] Création du produit...");
      const productId = await createProduct({
        title: form.title.trim(),
        description: form.description.trim(),
        price: priceNumber,
        currency: form.currency,
        category: form.category,
        images: uploadedImageIds,
        stock: stockNumber,
        unit: form.unit || undefined,
        tags: form.tags,
        isDigital: false,
        deliveryAvailable: form.deliveryAvailable,
        location: form.location || undefined,
        latitude: undefined,
        longitude: undefined,
      });

      console.log("✅ [CreateProductSheet] Produit créé avec ID:", productId);

      // ✅ Étape 3 : Construire le meta
      const meta = {
        currency: form.currency,
        unit: form.unit,
        stock: stockNumber,
        deliveryAvailable: form.deliveryAvailable,
        price: form.price || undefined,
        location: form.location || undefined,
        category: form.category,
        productId,
        images: uploadedImageIds,
      };

      console.log("📦 [CreateProductSheet] Meta:", meta);

      // ✅ Étape 4 : Créer la publication
      console.log("📝 [CreateProductSheet] Création de la publication...");
      await createPublication({
        type: "marketplace",
        title: form.title.trim(),
        description: form.description.trim(),
        price: form.price || undefined,
        location: form.location || undefined,
        category: form.category,
        images: uploadedImageIds,
        tags: form.tags,
        meta: JSON.stringify(meta),
      });

      console.log("✅ [CreateProductSheet] Tout est terminé !");
      toast.success("Produit publié avec succès !");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("❌ Erreur création produit:", error);
      toast.error("Erreur lors de la publication. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const qualityScore = getQualityScore();

  return (
    <View className="flex flex-col h-full gap-0">{}<View className="flex items-center gap-3 mb-4 flex-shrink-0"><Pressable onPress={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><ArrowLeft size={16} className="text-white" /></Pressable><Text className="text-white font-bold text-base flex-1">Nouveau produit
        </Text><Pressable onPress={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}><X size={16} className="text-white/60" /></Pressable></View>{}<View className="flex-shrink-0"><ProgressBar current={
            [
              form.title,
              form.description,
              form.category,
              images.length,
              form.tags.length,
            ].filter(Boolean).length
          } total={5} /></View>{}<View className="flex-1 overflow-y-auto space-y-3 pb-2" style={{  }}>{}<View className="space-y-2"><View className="flex items-center gap-2"><Package size={14} className="text-white/40" /><Text className="text-white/60 text-xs font-medium">Informations
            </Text></View><FieldInput icon={Tag} placeholder="Titre du produit *" value={form.title} onChange={setField("title")} required /><FieldTextarea icon={FileText} placeholder="Description détaillée *" value={form.description} onChange={setField("description")} rows={3} required /></View>{}<View className="space-y-2"><View className="flex items-center gap-2"><Sparkles size={14} className="text-orange-400" /><Text className="text-white/60 text-xs font-medium">Assistant IA
            </Text></View><AIWriteAssist contentType="product_description" topic={form.title} onGenerated={(text) => setField("description")(text)} description={form.description} category={form.category || undefined} color="#F97316" onTagsSuggested={(tags) => {
              setForm((prev) => ({
                ...prev,
                tags: [...new Set([...prev.tags, ...tags])],
              }));
            }} /></View>{}<ImageUploadZone images={images} onChange={setImages} color="#F97316" />{}<PriceField value={form.price} currency={form.currency} onPriceChange={setField("price")} onCurrencyChange={setField("currency")} currencies={CURRENCIES} />{}<CategoryField value={form.category} onChange={setField("category")} options={CATEGORIES} required />{}<View className="gap-2"><View className="space-y-1.5"><Text className="text-white/60 text-xs font-medium">Stock <Text className="text-red-400">*</Text></Text><FieldInput icon={Layers} placeholder="Quantité" value={form.stock} onChange={setField("stock")} type="number" min={0} /></View><View className="space-y-1.5"><Text className="text-white/60 text-xs font-medium">Unité</Text><View className="rounded-2xl p-3.5" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><Picker onValueChange={(value) => setField("unit")(value)} className="w-full bg-transparent text-white text-sm outline-none" selectedValue={form.unit}>{UNITS.map((u) => (
                  <Picker.Item label={u.label} value={u.value} />
                ))}</Picker></View></View></View>{}<View className="space-y-2"><View className="flex items-center gap-2"><Truck size={14} className="text-white/40" /><Text className="text-white/60 text-xs font-medium">Livraison</Text></View><FieldSwitch label="Livraison disponible" checked={form.deliveryAvailable} onChange={setField("deliveryAvailable")} />{form.deliveryAvailable && (
            <View className="flex items-center gap-2"><MapPin size={14} className="text-white/40" /><View className="flex-1"><View className="rounded-2xl p-3.5" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><View className="flex items-center gap-2.5"><TextInput value={form.location} onChangeText={(value) => setField("location")(value)} placeholder="Localisation (ville, quartier)" className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 outline-none" /><Pressable onPress={detectLocation} disabled={locating} className="flex-shrink-0 disabled:opacity-40">{locating ? (
                        <Loader2
                          size={14}
                          className="animate-spin text-orange-400"
                        />
                      ) : (
                        <LocateFixed
                          size={14}
                          className="text-white/40 transition-colors"
                        />
                      )}</Pressable></View></View></View></View>
          )}</View>{}<View className="space-y-1.5"><Text className="text-white/60 text-xs font-medium">Tags</Text><TagsInput value={form.tags} onChange={setField("tags")} placeholder="Ex: premium, bio, fait main" color="#F97316" /></View></View>{}<View className="flex-shrink-0 pt-3"><SubmitBtn color="#F97316" label="Publier le produit" onPress={handleSubmit} disabled={
            !form.title.trim() || !form.description.trim() || !form.category
          } loading={loading} qualityScore={qualityScore} /></View></View>
  );
}
