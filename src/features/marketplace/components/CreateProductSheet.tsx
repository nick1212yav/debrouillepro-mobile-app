// src/features/marketplace/components/CreateProductSheet.tsx

import { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useMutation } from "convex/react";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
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
  Shield,
  ChevronDown,
  ChevronUp,
  Home,
} from "lucide-react-native";

import { api } from "@/convex/_generated/api";
import ImageUploader from "@/components/ImageUploader";
import AIWriteAssist from "@/components/AIWriteAssist";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

interface CreateProductSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type CategoryOption = {
  value: string;
  label: string;
};

type IconComponent = React.ComponentType<{
  size?: number;
  color?: string;
}>;

const CATEGORIES: CategoryOption[] = [
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

const CURRENCIES: CategoryOption[] = [
  { value: "XAF", label: "FCFA" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "CDF", label: "CDF" },
];

const UNITS: CategoryOption[] = [
  { value: "pièce", label: "Pièce" },
  { value: "kg", label: "Kg" },
  { value: "lot", label: "Lot" },
  { value: "litre", label: "Litre" },
  { value: "mètre", label: "Mètre" },
];

const CATEGORY_ICONS: Record<string, IconComponent> = {
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

function ProgressBar({ current, total }: { current: number; total: number }) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <View className="mb-4">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-xs text-white/50">Progression</Text>

        <Text className="text-xs font-medium text-white/70">{percentage}%</Text>
      </View>

      <View className="h-2 overflow-hidden rounded-full bg-white/10">
        <View
          className="h-full rounded-full bg-orange-500"
          style={{
            width: `${percentage}%`,
          }}
        />
      </View>

      <View className="mt-2 flex-row justify-between">
        <Text className="text-[9px] text-white/30">Informations</Text>

        <Text className="text-[9px] text-white/30">Photos</Text>

        <Text className="text-[9px] text-white/30">Livraison</Text>

        <Text className="text-[9px] text-white/30">Publication</Text>
      </View>
    </View>
  );
}

function QualityScore({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 80) {
      return "#4ADE80";
    }

    if (score >= 50) {
      return "#FACC15";
    }

    return "#F87171";
  };

  const getLabel = () => {
    if (score >= 80) {
      return "Excellent";
    }

    if (score >= 50) {
      return "Bon";
    }

    return "À améliorer";
  };

  return (
    <View className="flex-row items-center rounded-xl border border-white/5 bg-white/5 p-3">
      <Shield size={16} color={getColor()} />

      <Text className="ml-2 flex-1 text-sm text-white/70">
        Score qualité :{" "}
        <Text
          style={{
            color: getColor(),
          }}
          className="font-bold"
        >
          {score}%
        </Text>
      </Text>

      <Text className="text-xs text-white/40">({getLabel()})</Text>
    </View>
  );
}

function OptionSelector({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: CategoryOption[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  const selected =
    options.find((option) => option.value === value) ?? options[0];

  return (
    <View>
      <Pressable
        onPress={() => setIsOpen((previous) => !previous)}
        className="flex-row items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
      >
        <Text className="text-sm text-white">
          {selected?.label ?? "Sélectionner"}
        </Text>

        {isOpen ? (
          <ChevronUp size={16} color="rgba(255,255,255,0.5)" />
        ) : (
          <ChevronDown size={16} color="rgba(255,255,255,0.5)" />
        )}
      </Pressable>

      {isOpen && (
        <View className="mt-1 overflow-hidden rounded-2xl border border-white/10 bg-[#0E0E22]">
          {options.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className="border-b border-white/5 px-4 py-3"
              style={{
                backgroundColor:
                  value === option.value
                    ? "rgba(249,115,22,0.15)"
                    : "transparent",
              }}
            >
              <Text
                style={{
                  color:
                    value === option.value
                      ? "#FB923C"
                      : "rgba(255,255,255,0.75)",
                }}
                className="text-sm"
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function CategoryField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const selected = CATEGORIES.find((option) => option.value === value);

  const SelectedIcon = selected
    ? (CATEGORY_ICONS[selected.value] ?? Package)
    : Package;

  return (
    <View>
      <Text className="mb-2 text-xs font-medium text-white/60">
        Catégorie <Text className="text-red-400">*</Text>
      </Text>

      <Pressable
        onPress={() => setIsOpen((previous) => !previous)}
        className="flex-row items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
      >
        <View className="flex-row items-center">
          <SelectedIcon
            size={16}
            color={selected ? "#FB923C" : "rgba(255,255,255,0.3)"}
          />

          <Text className="ml-3 text-sm text-white">
            {selected?.label ?? "Sélectionnez une catégorie"}
          </Text>
        </View>

        {isOpen ? (
          <ChevronUp size={16} color="rgba(255,255,255,0.4)" />
        ) : (
          <ChevronDown size={16} color="rgba(255,255,255,0.4)" />
        )}
      </Pressable>

      {isOpen && (
        <ScrollView
          className="mt-2 max-h-56 overflow-hidden rounded-2xl border border-white/10 bg-[#0E0E22]"
          nestedScrollEnabled
        >
          {CATEGORIES.map((option) => {
            const Icon = CATEGORY_ICONS[option.value] ?? Package;

            const active = option.value === value;

            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className="flex-row items-center border-b border-white/5 px-4 py-3"
                style={{
                  backgroundColor: active
                    ? "rgba(249,115,22,0.15)"
                    : "transparent",
                }}
              >
                <Icon
                  size={16}
                  color={active ? "#FB923C" : "rgba(255,255,255,0.35)"}
                />

                <Text
                  className="ml-3 text-sm"
                  style={{
                    color: active ? "#FB923C" : "rgba(255,255,255,0.7)",
                  }}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

function FieldInput({
  icon: Icon,
  placeholder,
  value,
  onChange,
  keyboardType = "default",
  multiline = false,
}: {
  icon?: IconComponent;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  keyboardType?: "default" | "numeric" | "decimal-pad";
  multiline?: boolean;
}) {
  return (
    <View className="flex-row items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      {Icon && <Icon size={16} color="rgba(255,255,255,0.4)" />}

      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.25)"
        keyboardType={keyboardType}
        multiline={multiline}
        className="ml-3 flex-1 text-sm text-white"
        style={{
          minHeight: multiline ? 80 : undefined,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </View>
  );
}

function TagsInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const tag = input.trim();

    if (!tag) {
      return;
    }

    if (value.some((item) => item.toLowerCase() === tag.toLowerCase())) {
      setInput("");
      return;
    }

    onChange([...value, tag]);

    setInput("");
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((item) => item !== tag));
  };

  return (
    <View className="rounded-2xl border border-white/10 bg-white/5 p-3">
      {value.length > 0 && (
        <View className="mb-3 flex-row flex-wrap">
          {value.map((tag) => (
            <View
              key={tag}
              className="mb-2 mr-2 flex-row items-center rounded-full bg-orange-500/20 px-3 py-1"
            >
              <Text className="text-xs text-orange-400">{tag}</Text>

              <Pressable onPress={() => removeTag(tag)} className="ml-2">
                <X size={13} color="#FB923C" />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View className="flex-row items-center">
        <TextInput
          value={input}
          onChangeText={setInput}
          onSubmitEditing={addTag}
          placeholder="Ex: premium, bio, fait main"
          placeholderTextColor="rgba(255,255,255,0.25)"
          className="flex-1 text-sm text-white"
          returnKeyType="done"
        />

        <Pressable
          onPress={addTag}
          disabled={!input.trim()}
          className="ml-2 h-9 w-9 items-center justify-center rounded-full bg-white/5"
          style={{
            opacity: input.trim() ? 1 : 0.35,
          }}
        >
          <Plus size={18} color="#FB923C" />
        </Pressable>
      </View>
    </View>
  );
}

function ImageUploadZone({
  images,
  onChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const [isPicking, setIsPicking] = useState(false);

  const pickImages = async () => {
    if (isPicking) {
      return;
    }

    try {
      setIsPicking(true);

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Autorisation requise",
          "L'accès à votre galerie est nécessaire pour ajouter des photos.",
        );
        return;
      }

      const remaining = 10 - images.length;

      if (remaining <= 0) {
        Alert.alert(
          "Maximum atteint",
          "Vous pouvez ajouter au maximum 10 photos.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.9,
        selectionLimit: remaining,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const uris = result.assets.slice(0, remaining).map((asset) => asset.uri);

      onChange([...images, ...uris]);
    } catch (error) {
      console.error("Erreur sélection images:", error);

      Alert.alert("Erreur", "Impossible de sélectionner les photos.");
    } finally {
      setIsPicking(false);
    }
  };

  return (
    <View>
      <View className="mb-2 flex-row items-center">
        <ImageIcon size={15} color="rgba(255,255,255,0.4)" />

        <Text className="ml-2 text-xs font-medium text-white/60">
          Photos du produit
        </Text>

        <Text className="ml-2 text-[10px] text-white/25">
          ({images.length}/10)
        </Text>
      </View>

      {images.length === 0 ? (
        <Pressable
          onPress={pickImages}
          disabled={isPicking}
          className="items-center rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] p-8"
        >
          {isPicking ? (
            <>
              <Loader2 size={28} color="#FB923C" />

              <Text className="mt-3 text-sm text-white/50">
                Ouverture de la galerie...
              </Text>
            </>
          ) : (
            <>
              <View className="rounded-full bg-white/5 p-3">
                <ImageIcon size={24} color="rgba(255,255,255,0.25)" />
              </View>

              <Text className="mt-3 text-sm text-white/40">
                Touchez pour ajouter des photos
              </Text>

              <Text className="mt-1 text-xs text-white/25">
                Maximum 10 images
              </Text>
            </>
          )}
        </Pressable>
      ) : (
        <View>
          <ImageUploader
            images={images}
            onChange={onChange}
            maxImages={10}
            color="#F97316"
            label="Ajouter des photos"
          />

          {images.length < 10 && (
            <Pressable
              onPress={pickImages}
              disabled={isPicking}
              className="mt-2 flex-row items-center justify-center rounded-xl border border-dashed border-orange-400/40 bg-orange-500/10 px-4 py-3"
            >
              <Plus size={16} color="#FB923C" />

              <Text className="ml-2 text-sm font-medium text-orange-400">
                Ajouter d'autres photos
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

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

    if (form.title.trim().length >= 10) {
      score += 20;
    }

    if (form.description.trim().length >= 50) {
      score += 25;
    }

    if (form.category) {
      score += 15;
    }

    if (Number(form.price) > 0) {
      score += 15;
    }

    if (images.length > 0) {
      score += 15;
    }

    if (form.tags.length >= 2) {
      score += 10;
    }

    return Math.min(score, 100);
  }, [
    form.category,
    form.description,
    form.price,
    form.tags.length,
    form.title,
    images.length,
  ]);

  const updateForm = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const detectLocation = useCallback(async () => {
    if (locating) {
      return;
    }

    try {
      setLocating(true);

      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        Alert.alert(
          "Autorisation requise",
          "Autorisez l'accès à votre position pour détecter votre localisation.",
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [reverseGeocoded] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      if (reverseGeocoded) {
        const parts = [
          reverseGeocoded.city,
          reverseGeocoded.district,
          reverseGeocoded.region,
          reverseGeocoded.country,
        ].filter(Boolean);

        if (parts.length > 0) {
          updateForm("location", parts.join(", "));
          return;
        }
      }

      updateForm(
        "location",
        `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
      );
    } catch (error) {
      console.error("Erreur géolocalisation:", error);

      Alert.alert("Erreur", "Impossible de détecter votre position.");
    } finally {
      setLocating(false);
    }
  }, [locating]);

  const uploadImage = useCallback(
    async (uri: string): Promise<string> => {
      if (uri.startsWith("http://") || uri.startsWith("https://")) {
        return uri;
      }

      const uploadUrl = await generateUploadUrl();

      const response = await fetch(uri);

      if (!response.ok) {
        throw new Error("Impossible de lire l'image sélectionnée.");
      }

      const blob = await response.blob();

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": blob.type || "image/jpeg",
        },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload échoué (${uploadResponse.status})`);
      }

      const contentType = uploadResponse.headers.get("content-type") ?? "";

      if (contentType.includes("application/json")) {
        const result = (await uploadResponse.json()) as {
          storageId?: string;
          id?: string;
        };

        const storageId = result.storageId ?? result.id;

        if (storageId) {
          return storageId;
        }
      }

      const text = await uploadResponse.text();

      if (text) {
        try {
          const parsed = JSON.parse(text) as {
            storageId?: string;
            id?: string;
          };

          const storageId = parsed.storageId ?? parsed.id;

          if (storageId) {
            return storageId;
          }
        } catch {
          if (text.startsWith("kg")) {
            return text;
          }
        }
      }

      throw new Error("Storage ID manquant après l'upload.");
    },
    [generateUploadUrl],
  );

  const handleSubmit = async () => {
    if (loading) {
      return;
    }

    if (!isAuthenticated) {
      Alert.alert(
        "Connexion requise",
        "Vous devez être connecté pour publier un produit.",
      );
      return;
    }

    if (!form.title.trim()) {
      Alert.alert("Titre requis", "Veuillez saisir le titre du produit.");
      return;
    }

    if (!form.description.trim()) {
      Alert.alert("Description requise", "Veuillez saisir une description.");
      return;
    }

    if (!form.category) {
      Alert.alert("Catégorie requise", "Veuillez sélectionner une catégorie.");
      return;
    }

    setLoading(true);

    try {
      const uploadedImageIds: string[] = [];

      for (const imageUri of images) {
        const storageId = await uploadImage(imageUri);

        uploadedImageIds.push(storageId);
      }

      const stockNumber = Math.max(0, parseInt(form.stock, 10) || 0);

      const priceNumber = Math.max(0, Number(form.price) || 0);

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
        location: form.location.trim() || undefined,
        latitude: undefined,
        longitude: undefined,
      });

      const meta = {
        currency: form.currency,
        unit: form.unit,
        stock: stockNumber,
        deliveryAvailable: form.deliveryAvailable,
        price: form.price || undefined,
        location: form.location.trim() || undefined,
        category: form.category,
        productId,
        images: uploadedImageIds,
      };

      await createPublication({
        type: "marketplace",
        title: form.title.trim(),
        description: form.description.trim(),
        price: form.price || undefined,
        location: form.location.trim() || undefined,
        category: form.category,
        images: uploadedImageIds,
        tags: form.tags,
        meta: JSON.stringify(meta),
      });

      Alert.alert("Succès", "Produit publié avec succès !");

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Erreur création produit:", error);

      Alert.alert("Erreur", "Erreur lors de la publication. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) {
      return;
    }

    onClose();
  };

  if (!isOpen) {
    return null;
  }

  const qualityScore = getQualityScore();

  const completedSteps = [
    form.title.trim(),
    form.description.trim(),
    form.category,
    images.length > 0,
    form.tags.length > 0,
  ].filter(Boolean).length;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View className="flex-1 bg-black/70">
        <Pressable
          className="absolute inset-0"
          onPress={handleClose}
          disabled={loading}
        />

        <View className="mt-auto max-h-[94%] overflow-hidden rounded-t-3xl border border-white/10 bg-[#0A0A1A]">
          <View className="flex-row items-center border-b border-white/10 px-5 py-4">
            <Pressable
              onPress={handleClose}
              disabled={loading}
              className="h-10 w-10 items-center justify-center rounded-xl bg-white/10"
            >
              <ArrowLeft size={18} color="#FFFFFF" />
            </Pressable>

            <Text className="ml-3 flex-1 text-base font-bold text-white">
              Nouveau produit
            </Text>

            <Pressable
              onPress={handleClose}
              disabled={loading}
              className="h-10 w-10 items-center justify-center rounded-xl bg-white/5"
            >
              <X size={18} color="rgba(255,255,255,0.65)" />
            </Pressable>
          </View>

          <View className="px-5 pt-4">
            <ProgressBar current={completedSteps} total={5} />
          </View>

          <ScrollView
            className="flex-1"
            contentContainerClassName="px-5 pb-8"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className="mb-5">
              <View className="mb-2 flex-row items-center">
                <Package size={15} color="rgba(255,255,255,0.4)" />

                <Text className="ml-2 text-xs font-medium text-white/60">
                  Informations
                </Text>
              </View>

              <FieldInput
                icon={Tag}
                placeholder="Titre du produit *"
                value={form.title}
                onChange={(value) => updateForm("title", value)}
              />

              <View className="mt-3">
                <FieldInput
                  icon={FileText}
                  placeholder="Description détaillée *"
                  value={form.description}
                  onChange={(value) => updateForm("description", value)}
                  multiline
                />
              </View>
            </View>

            <View className="mb-5">
              <ImageUploadZone images={images} onChange={setImages} />
            </View>

            <View className="mb-5">
              <View className="mb-2 flex-row items-center">
                <DollarSign size={15} color="rgba(255,255,255,0.4)" />

                <Text className="ml-2 text-xs font-medium text-white/60">
                  Prix
                </Text>
              </View>

              <FieldInput
                placeholder="Ex: 15000"
                value={form.price}
                onChange={(value) => updateForm("price", value)}
                keyboardType="decimal-pad"
              />

              <View className="mt-3">
                <OptionSelector
                  value={form.currency}
                  onChange={(value) => updateForm("currency", value)}
                  options={CURRENCIES}
                />
              </View>
            </View>

            <View className="mb-5">
              <CategoryField
                value={form.category}
                onChange={(value) => updateForm("category", value)}
              />
            </View>

            <View className="mb-5">
              <View className="mb-3 flex-row">
                <View className="mr-2 flex-1">
                  <Text className="mb-2 text-xs font-medium text-white/60">
                    Stock
                  </Text>

                  <FieldInput
                    icon={Layers}
                    placeholder="Quantité"
                    value={form.stock}
                    onChange={(value) => updateForm("stock", value)}
                    keyboardType="numeric"
                  />
                </View>

                <View className="ml-2 flex-1">
                  <Text className="mb-2 text-xs font-medium text-white/60">
                    Unité
                  </Text>

                  <OptionSelector
                    value={form.unit}
                    onChange={(value) => updateForm("unit", value)}
                    options={UNITS}
                  />
                </View>
              </View>
            </View>

            <View className="mb-5">
              <View className="mb-2 flex-row items-center">
                <Truck size={15} color="rgba(255,255,255,0.4)" />

                <Text className="ml-2 text-xs font-medium text-white/60">
                  Livraison
                </Text>
              </View>

              <View className="flex-row items-center rounded-2xl border border-white/10 bg-white/5 p-4">
                <Text className="flex-1 text-sm text-white/70">
                  Livraison disponible
                </Text>

                <Switch
                  value={form.deliveryAvailable}
                  onValueChange={(value) =>
                    updateForm("deliveryAvailable", value)
                  }
                  trackColor={{
                    false: "rgba(255,255,255,0.15)",
                    true: "#F97316",
                  }}
                  thumbColor={"#FFFFFF"}
                />
              </View>

              {form.deliveryAvailable && (
                <View className="mt-3">
                  <View className="flex-row items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
                    <MapPin size={16} color="rgba(255,255,255,0.4)" />

                    <TextInput
                      value={form.location}
                      onChangeText={(value) => updateForm("location", value)}
                      placeholder="Ville, quartier"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      className="ml-3 flex-1 text-sm text-white"
                    />

                    <Pressable
                      onPress={detectLocation}
                      disabled={locating}
                      className="h-10 w-10 items-center justify-center"
                    >
                      {locating ? (
                        <Loader2 size={17} color="#FB923C" />
                      ) : (
                        <LocateFixed size={17} color="#FB923C" />
                      )}
                    </Pressable>
                  </View>
                </View>
              )}
            </View>

            <View className="mb-5">
              <View className="mb-2 flex-row items-center">
                <Check size={15} color="rgba(255,255,255,0.4)" />

                <Text className="ml-2 text-xs font-medium text-white/60">
                  Tags
                </Text>
              </View>

              <TagsInput
                value={form.tags}
                onChange={(tags) => updateForm("tags", tags)}
              />
            </View>

            <QualityScore score={qualityScore} />

            <Pressable
              onPress={handleSubmit}
              disabled={
                loading ||
                !form.title.trim() ||
                !form.description.trim() ||
                !form.category
              }
              className="mt-5 flex-row items-center justify-center rounded-3xl bg-orange-500 py-4"
              style={{
                opacity:
                  loading ||
                  !form.title.trim() ||
                  !form.description.trim() ||
                  !form.category
                    ? 0.45
                    : 1,
              }}
            >
              {loading && <Loader2 size={17} color="#FFFFFF" />}

              <Text className="ml-2 text-sm font-bold text-white">
                {loading ? "Publication en cours..." : "Publier le produit"}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
