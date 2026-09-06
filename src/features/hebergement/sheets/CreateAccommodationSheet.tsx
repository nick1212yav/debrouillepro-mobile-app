import { UIService } from "@/core/sdk/ui/UIService";
import { Picker } from "@react-native-picker/picker";
import { View, Text, Pressable, Image, TextInput } from "react-native";

// src/features/hebergement/sheets/CreateAccommodationSheet.tsx
import { useState, useCallback } from "react";
import {
  X,
  ArrowLeft,
  Home,
  Image,
  MapPin,
  DollarSign,
  Shield,
  Eye,
  Loader2,
} from "lucide-react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";

// Types
import type { AccommodationType } from "../types/accommodation.types";

// Composants partagés
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface CreateAccommodationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Helper de mappage typé vers le schéma Convex
const mapTypeToLiteral = (
  t: string,
):
  | "appartement"
  | "villa"
  | "hotel"
  | "auberge"
  | "chambre_hote"
  | "camping" => {
  const typeMap: Record<
    string,
    "appartement" | "villa" | "hotel" | "auberge" | "chambre_hote" | "camping"
  > = {
    appartement: "appartement",
    villa: "villa",
    studio: "appartement",
    hotel: "hotel",
    auberge: "auberge",
    guesthouse: "auberge",
    colocation: "appartement",
    chambre: "chambre_hote",
    lodge: "auberge",
    bungalow: "appartement",
    camping: "camping",
  };
  return typeMap[t.toLowerCase().trim()] || "appartement";
};

// ─── Étapes ──────────────────────────────────────────────────────────────────

const STEPS = [
  { id: "info", label: "Informations", icon: Home },
  { id: "photos", label: "Photos", icon: Image },
  { id: "location", label: "Localisation", icon: MapPin },
  { id: "pricing", label: "Tarifs", icon: DollarSign },
  { id: "rules", label: "Règles", icon: Shield },
  { id: "preview", label: "Aperçu", icon: Eye },
];

// ─── Composant principal ─────────────────────────────────────────────────────

export function CreateAccommodationSheet({
  open,
  onOpenChange,
  onSuccess,
}: CreateAccommodationSheetProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    type: "appartement" as AccommodationType,
    description: "",
    location: {
      country: "Côte d'Ivoire",
      city: "",
      district: "",
      address: "",
      latitude: undefined as number | undefined,
      longitude: undefined as number | undefined,
    },
    pricing: {
      amount: 0,
      currency: "FCFA",
      period: "night" as const,
      cleaningFee: 0,
      serviceFee: 0,
      deposit: 0,
    },
    capacity: {
      guests: 1,
      adults: 1,
      children: 0,
    },
    rooms: {
      bedrooms: 1,
      bathrooms: 1,
      beds: 1,
      livingRooms: 0,
    },
    area: 0,
    amenities: [] as string[],
    images: [] as string[],
    rules: {
      pets: false,
      smoking: false,
      children: true,
      parties: false,
      checkIn: "15:00",
      checkOut: "11:00",
    },
  });

  const createAccommodation = useMutation(api.hebergement.createAccommodation);

  const updateField = useCallback((field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateNestedField = useCallback(
    (parent: string, field: string, value: any) => {
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...(prev as any)[parent], [field]: value },
      }));
    },
    [],
  );

  const nextStep = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // Transformation des données avant l'appel Convex
  const handleSubmit = useCallback(async () => {
    setLoading(true);
    try {
      const payload = {
        type: mapTypeToLiteral(formData.type),
        title: formData.title,
        description: formData.description,
        price: formData.pricing?.amount || 0,
        currency: formData.pricing?.currency || "FCFA",
        maxGuests: formData.capacity?.guests || 1,
        city: formData.location?.city || "",
        district: formData.location?.district,
        country: formData.location?.country || "Côte d'Ivoire",
        address: formData.location?.address,
        latitude: formData.location?.latitude,
        longitude: formData.location?.longitude,
        images: formData.images || [],
        amenities: formData.amenities || [],
        available: true,
      };
      await createAccommodation(payload);
      UIService.openToast("Hébergement créé avec succès !", "success");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error(error);
      UIService.openToast("Erreur lors de la création", "error");
    } finally {
      setLoading(false);
    }
  }, [formData, createAccommodation, onOpenChange, onSuccess]);

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <InfoStep data={formData} onChange={updateField} onNext={nextStep} />
        );
      case 1:
        return (
          <PhotosStep
            data={formData}
            onChange={updateField}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 2:
        return (
          <LocationStep
            data={formData}
            onChange={updateNestedField}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 3:
        return (
          <PricingStep
            data={formData}
            onChange={updateNestedField}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 4:
        return (
          <RulesStep
            data={formData}
            onChange={updateNestedField}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 5:
        return (
          <PreviewStep
            data={formData}
            onSubmit={handleSubmit}
            onBack={prevStep}
            isLoading={loading}
          />
        );
      default:
        return null;
    }
  };

  if (!open) return null;

  return (
    <>
      <View className="fixed inset-0 z-50 flex items-end">
        {/* Overlay */}
        <Pressable
          onPress={() => onOpenChange(false)}
          className="absolute inset-0 bg-black/70"
        />

        {/* Sheet */}
        <View
          className="relative w-full max-h-[92vh] overflow-hidden rounded-t-[32px] bg-gradient-to-b from-[#0c0d1e] to-[#080816] border-t border-white/10"
        >
          {/* Handle */}
          <View className="flex justify-center pt-3">
            <View className="w-10 h-1 rounded-full bg-white/20" />
          </View>

          {/* Header */}
          <View className="px-5 pt-2 pb-4 flex items-center gap-3 border-b border-white/5">
            {currentStep > 0 ? (
              <Pressable
                onPress={prevStep}
                className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5"
              >
                <ArrowLeft size={18} className="text-white" />
              </Pressable>
            ) : (
              <Pressable
                onPress={() => onOpenChange(false)}
                className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5"
              >
                <ArrowLeft size={18} className="text-white" />
              </Pressable>
            )}
            <View className="flex-1">
              <Text className="text-white text-xl font-black">
                Ajouter un logement
              </Text>
              <Text className="text-white/40 text-xs font-medium">
                Étape {currentStep + 1} / {STEPS.length} :{" "}
                {STEPS[currentStep].label}
              </Text>
            </View>
            <Pressable
              onPress={() => onOpenChange(false)}
              className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5"
            >
              <X size={18} className="text-white/60" />
            </Pressable>
          </View>

          {/* Indicateur de progression */}
          <View className="px-5 py-2 flex gap-1">
            {STEPS.map((_, i) => (
              <View
                key={i}
                className={`flex-1 h-1 rounded-full transition-all ${
                  i <= currentStep ? "bg-indigo-500" : "bg-white/10"
                }`}
              />
            ))}
          </View>

          {/* Contenu */}
          <View
            className="overflow-y-auto px-5 pb-8 pt-4"
            style={{ maxHeight: "calc(92vh - 140px)" }}
          >
            <AnimatePresence mode="wait">
              <View
                key={currentStep}
              >
                {renderStep()}
              </View>
            </AnimatePresence>
          </View>
        </View>
      </View>
    </>
  );
}

// ─── Étape 1 : Informations ──────────────────────────────────────────────────

function InfoStep({ data, onChange, onNext }: any) {
  const [selectedType, setSelectedType] = useState(data.type || "appartement");

  const types = [
    { id: "appartement", label: "Appartement" },
    { id: "studio", label: "Studio" },
    { id: "maison", label: "Maison" },
    { id: "villa", label: "Villa" },
    { id: "hotel", label: "Hôtel" },
    { id: "auberge", label: "Auberge" },
    { id: "guesthouse", label: "Guesthouse" },
    { id: "colocation", label: "Colocation" },
    { id: "chambre", label: "Chambre" },
    { id: "lodge", label: "Lodge" },
    { id: "bungalow", label: "Bungalow" },
  ];

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    onChange("type", type);
  };

  const isValid = data.title.length >= 3 && data.description.length >= 10;

  return (
    <View className="space-y-4">
      <View>
        <Text className="text-white/80 text-sm font-medium block mb-1.5">
          Titre de l'annonce *
        </Text>
        <Input
          value={data.title}
          onChange={(text) => onChange("title", text)}
          placeholder="Ex: Studio cozy en plein cœur du Plateau"
          className="bg-white/5 border-white/10 text-white placeholder:text-white/40 h-12"
        />
        <Text className="text-white/30 text-xs mt-1">
          {data.title.length}/50 caractères
        </Text>
      </View>

      <View>
        <Text className="text-white/80 text-sm font-medium block mb-1.5">
          Description *
        </Text>
        <Textarea
          value={data.description}
          onChange={(text) => onChange("description", text)}
          placeholder="Décrivez votre logement en détail (équipements, quartier, etc.)"
          className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[100px]"
        />
        <Text className="text-white/30 text-xs mt-1">
          {data.description.length}/500 caractères
        </Text>
      </View>

      <View>
        <Text className="text-white/80 text-sm font-medium block mb-2">
          Type de logement *
        </Text>
        <View className="gap-2">
          {types.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => handleTypeSelect(t.id)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                selectedType === t.id
                  ? "bg-indigo-500/30 text-indigo-300 border border-indigo-400/40"
                  : "bg-white/5 text-white/50 border border-white/5 hover:bg-white/10"
              }`}
            >
              {t.label}
            </Pressable>
          ))}
        </View>
      </View>

      <Button
        onPress={onNext}
        disabled={!isValid}
        className="w-full h-12 rounded-xl bg-indigo-600 text-white font-bold"
      >
        <Text>Continuer →</Text></Button>
    </View>
  );
}

// ─── Étape 2 : Photos ───────────────────────────────────────────────────────

function PhotosStep({ data, onChange, onNext, onBack }: any) {
  const [images, setImages] = useState<string[]>(data.images || []);

  const handleFileUpload = (e: string) => {
    const files = e.target.files;
    if (!files) return;
    const newImages: string[] = [];
    Array.from(files)
      .slice(0, 10 - images.length)
      .forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result) {
            newImages.push(ev.target.result as string);
            if (
              newImages.length === Math.min(files.length, 10 - images.length)
            ) {
              const updated = [...images, ...newImages];
              setImages(updated);
              onChange("images", updated);
            }
          }
        };
        reader.readAsDataURL(file);
      });
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    onChange("images", updated);
  };

  const isValid = images.length > 0;

  return (
    <View className="space-y-4">
      <View className="text-center">
        <Text className="text-white/60 text-sm mb-2">
          Ajoutez des photos pour mettre en valeur votre logement
        </Text>
        <Text className="text-white/30 text-xs">{images.length} / 10 photos</Text>
      </View>

      <View className="border-2 border-dashed border-white/10 rounded-2xl p-4 text-center">
        {images.length === 0 ? (
          <>
            <Image size={40} className="mx-auto text-white/20" />
            <Text className="text-white/40 text-sm mt-2">
              Glissez-déposez ou cliquez pour choisir
            </Text>
            <TextInput
             
             
              multiple
              className="absolute inset-0 opacity-0"
              onChangeText={handleFileUpload}
            />
          </>
        ) : (
          <View className="gap-2">
            {images.map((src, i) => (
              <View
                key={i}
                className="relative aspect-square rounded-xl overflow-hidden bg-black/30"
              >
                <Image
                 
                 
                  className="w-full h-full object-cover"
                 source={{ uri: src }} accessibilityLabel={`Photo ${i + 1}`}/>
                <Pressable
                  onPress={() => removeImage(i)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500/80 text-white flex items-center justify-center text-xs"
                >
                  <Text>✕</Text></Pressable>
              </View>
            ))}
            {images.length < 10 && (
              <Text className="aspect-square rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center">
                <Image size={24} className="text-white/30" />
                <TextInput
                 
                 
                  multiple
                  className="hidden"
                  onChangeText={handleFileUpload}
                />
              </Text>
            )}
          </View>
        )}
        {images.length === 0 && (
          <TextInput
           
           
            multiple
            className="absolute inset-0 opacity-0"
            onChangeText={handleFileUpload}
          />
        )}
      </View>

      <View className="flex gap-3">
        <Button
          onPress={onBack}
          variant="outline"
          className="flex-1 h-12 rounded-xl border-white/10 text-white"
        >
          <Text>← Retour</Text></Button>
        <Button
          onPress={onNext}
          disabled={!isValid}
          className="flex-1 h-12 rounded-xl bg-indigo-600 text-white font-bold"
        >
          <Text>Continuer →</Text></Button>
      </View>
    </View>
  );
}

// ─── Étape 3 : Localisation ─────────────────────────────────────────────────

function LocationStep({ data, onChange, onNext, onBack }: any) {
  const [city, setCity] = useState(data.location?.city || "");
  const [district, setDistrict] = useState(data.location?.district || "");
  const [address, setAddress] = useState(data.location?.address || "");

  const handleChange = (field: string, value: string) => {
    onChange("location", field, value);
  };

  const isValid = city.length >= 2;

  return (
    <View className="space-y-4">
      <View className="relative rounded-2xl overflow-hidden h-48 bg-black/30 border border-white/10 flex items-center justify-center">
        <View className="text-center">
          <MapPin size={32} className="mx-auto text-white/20" />
          <Text className="text-white/20 text-sm mt-2">
            Carte interactive (Google Maps / Mapbox)
          </Text>
        </View>
      </View>

      <View className="gap-3">
        <View>
          <Text className="text-white/80 text-sm font-medium block mb-1.5">
            Ville *
          </Text>
          <Input
            value={city}
            onChange={(text) => {
              setCity(text);
              handleChange("city", text);
            }}
            placeholder="Ex: Abidjan"
            className="bg-white/5 border-white/10 text-white h-12"
          />
        </View>
        <View>
          <Text className="text-white/80 text-sm font-medium block mb-1.5">
            Quartier
          </Text>
          <Input
            value={district}
            onChange={(text) => {
              setDistrict(text);
              handleChange("district", text);
            }}
            placeholder="Ex: Cocody"
            className="bg-white/5 border-white/10 text-white h-12"
          />
        </View>
      </View>

      <View>
        <Text className="text-white/80 text-sm font-medium block mb-1.5">
          Adresse complète
        </Text>
        <Input
          value={address}
          onChange={(text) => {
            setAddress(text);
            handleChange("address", text);
          }}
          placeholder="Ex: Rue 12, Villa 45"
          className="bg-white/5 border-white/10 text-white h-12"
        />
      </View>

      <View className="flex gap-3">
        <Button
          onPress={onBack}
          variant="outline"
          className="flex-1 h-12 rounded-xl border-white/10 text-white"
        >
          <Text>← Retour</Text></Button>
        <Button
          onPress={onNext}
          disabled={!isValid}
          className="flex-1 h-12 rounded-xl bg-indigo-600 text-white font-bold"
        >
          <Text>Continuer →</Text></Button>
      </View>
    </View>
  );
}

// ─── Étape 4 : Tarifs ────────────────────────────────────────────────────────

function PricingStep({ data, onChange, onNext, onBack }: any) {
  const [amount, setAmount] = useState(data.pricing?.amount || 0);
  const [cleaningFee, setCleaningFee] = useState(
    data.pricing?.cleaningFee || 0,
  );
  const [deposit, setDeposit] = useState(data.pricing?.deposit || 0);
  const [period, setPeriod] = useState(data.pricing?.period || "night");

  const handleChange = (field: string, value: any) => {
    onChange("pricing", field, value);
  };

  const isValid = amount > 0;

  return (
    <View className="space-y-4">
      <View>
        <Text className="text-white/80 text-sm font-medium block mb-1.5">
          Prix par nuit *
        </Text>
        <Input
          type="number"
          value={amount}
          onChange={(text) => {
            const val = parseFloat(text) || 0;
            setAmount(val);
            handleChange("amount", val);
          }}
          placeholder="Ex: 45000"
          className="bg-white/5 border-white/10 text-white h-12"
        />
      </View>

      <View className="gap-3">
        <View>
          <Text className="text-white/80 text-sm font-medium block mb-1.5">
            Frais de ménage
          </Text>
          <Input
            type="number"
            value={cleaningFee}
            onChange={(text) => {
              const val = parseFloat(text) || 0;
              setCleaningFee(val);
              handleChange("cleaningFee", val);
            }}
            placeholder="Ex: 15000"
            className="bg-white/5 border-white/10 text-white h-12"
          />
        </View>
        <View>
          <Text className="text-white/80 text-sm font-medium block mb-1.5">
            Caution
          </Text>
          <Input
            type="number"
            value={deposit}
            onChange={(text) => {
              const val = parseFloat(text) || 0;
              setDeposit(val);
              handleChange("deposit", val);
            }}
            placeholder="Ex: 50000"
            className="bg-white/5 border-white/10 text-white h-12"
          />
        </View>
      </View>

      <View>
        <Text className="text-white/80 text-sm font-medium block mb-1.5">
          Période de tarification
        </Text>
        <Picker
         
          onValueChange={(val) => {
            setPeriod(val);
            handleChange("period", val);
          }}
          className="w-full px-3 py-3 rounded-xl bg-white/5 border-white/10 text-white outline-none"
         selectedValue={period}>
          <Picker.Item label="Par nuit" value="night" />
          <Picker.Item label="Par semaine" value="week" />
          <Picker.Item label="Par mois" value="month" />
        </Picker>
      </View>

      <View className="flex gap-3">
        <Button
          onPress={onBack}
          variant="outline"
          className="flex-1 h-12 rounded-xl border-white/10 text-white"
        >
          <Text>← Retour</Text></Button>
        <Button
          onPress={onNext}
          disabled={!isValid}
          className="flex-1 h-12 rounded-xl bg-indigo-600 text-white font-bold"
        >
          <Text>Continuer →</Text></Button>
      </View>
    </View>
  );
}

// ─── Étape 5 : Règles ────────────────────────────────────────────────────────

function RulesStep({ data, onChange, onNext, onBack }: any) {
  const [rules, setRules] = useState(data.rules || {});

  const handleToggle = (field: string, value: boolean) => {
    const updated = { ...rules, [field]: value };
    setRules(updated);
    onChange("rules", field, value);
  };

  const handleTimeChange = (field: string, value: string) => {
    const updated = { ...rules, [field]: value };
    setRules(updated);
    onChange("rules", field, value);
  };

  return (
    <View className="space-y-4">
      <View className="space-y-2">
        <View className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
          <Text className="text-white/80 text-sm">Animaux acceptés</Text>
          <Switch
            checked={rules.pets || false}
            onCheckedChange={(val) => handleToggle("pets", val)}
          />
        </View>
        <View className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
          <Text className="text-white/80 text-sm">Fumeurs acceptés</Text>
          <Switch
            checked={rules.smoking || false}
            onCheckedChange={(val) => handleToggle("smoking", val)}
          />
        </View>
        <View className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
          <Text className="text-white/80 text-sm">Enfants acceptés</Text>
          <Switch
            checked={rules.children !== undefined ? rules.children : true}
            onCheckedChange={(val) => handleToggle("children", val)}
          />
        </View>
        <View className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
          <Text className="text-white/80 text-sm">Fêtes autorisées</Text>
          <Switch
            checked={rules.parties || false}
            onCheckedChange={(val) => handleToggle("parties", val)}
          />
        </View>
      </View>

      <View className="gap-3">
        <View>
          <Text className="text-white/80 text-sm font-medium block mb-1.5">
            Heure d'arrivée
          </Text>
          <Input
            type="time"
            value={rules.checkIn || "15:00"}
            onChange={(text) => handleTimeChange("checkIn", text)}
            className="bg-white/5 border-white/10 text-white h-12"
          />
        </View>
        <View>
          <Text className="text-white/80 text-sm font-medium block mb-1.5">
            Heure de départ
          </Text>
          <Input
            type="time"
            value={rules.checkOut || "11:00"}
            onChange={(text) => handleTimeChange("checkOut", text)}
            className="bg-white/5 border-white/10 text-white h-12"
          />
        </View>
      </View>

      <View className="flex gap-3">
        <Button
          onPress={onBack}
          variant="outline"
          className="flex-1 h-12 rounded-xl border-white/10 text-white"
        >
          <Text>← Retour</Text></Button>
        <Button
          onPress={onNext}
          className="flex-1 h-12 rounded-xl bg-indigo-600 text-white font-bold"
        >
          <Text>Continuer →</Text></Button>
      </View>
    </View>
  );
}

// ─── Étape 6 : Aperçu ────────────────────────────────────────────────────────

function PreviewStep({ data, onSubmit, onBack, isLoading }: any) {
  const coverImage =
    data.images && data.images.length > 0 ? data.images[0] : null;

  return (
    <View className="space-y-4">
      <View className="text-center">
        <Text className="text-white font-bold text-lg">
          ✨ Votre logement est prêt !
        </Text>
        <Text className="text-white/40 text-sm">
          Vérifiez les informations avant de publier
        </Text>
      </View>

      <View className="rounded-2xl overflow-hidden border border-white/10 bg-white/5">
        {coverImage && (
          <View className="relative h-40">
            <Image
             
             
              className="w-full h-full object-cover"
             source={{ uri: coverImage }} accessibilityLabel={data.title}/>
          </View>
        )}
        <View className="p-4 space-y-2">
          <Text className="text-white font-bold">{data.title || "Logement"}</Text>
          <View className="flex items-center gap-2 text-sm text-white/60">
            <Home size={14} />
            <Text>{data.type || "Appartement"}</Text>
          </View>
          {data.location?.city && (
            <View className="flex items-center gap-2 text-sm text-white/40">
              <MapPin size={14} />
              <Text>{data.location.city}</Text>
            </View>
          )}
          {data.pricing?.amount > 0 && (
            <Text className="text-indigo-400 font-bold text-base">
              {data.pricing.amount.toLocaleString()} {data.pricing.currency} /{" "}
              {data.pricing.period}
            </Text>
          )}
        </View>
      </View>

      <View className="flex gap-3">
        <Button
          onPress={onBack}
          variant="outline"
          className="flex-1 h-12 rounded-xl border-white/10 text-white"
        >
          <Text>← Modifier</Text></Button>
        <Button
          onPress={onSubmit}
          disabled={isLoading}
          className="flex-1 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <Text>Publication...</Text></>
          ) : (
            "🚀 Publier mon logement"
          )}
        </Button>
      </View>
    </View>
  );
}
