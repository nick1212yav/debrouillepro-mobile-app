import { Picker } from "@react-native-picker/picker";
import { View, Text, Pressable, TextInput } from "react-native";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { X, Loader2 } from "lucide-react-native";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import ImageUploader from "@/components/ImageUploader";

interface Props {
  propertyId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const PROPERTY_TYPES = [
  { label: "Appartement", value: "appartement" },
  { label: "Maison", value: "maison" },
  { label: "Villa", value: "villa" },
  { label: "Studio", value: "studio" },
  { label: "Bureau", value: "bureau" },
  { label: "Terrain", value: "terrain" },
  { label: "Chambre", value: "chambre" },
  { label: "Entrepôt", value: "entrepot" },
];

const TRANSACTION_TYPES = [
  { label: "Location", value: "location" },
  { label: "Vente", value: "vente" },
];

const AMENITIES_LIST = [
  "Piscine",
  "Garage",
  "Jardin",
  "Climatisation",
  "Chauffage",
  "Cuisine équipée",
  "Balcon",
  "Terrasse",
  "Ascenseur",
  "Sécurité 24h",
  "Parking",
  "Internet",
  "Meublé",
  "Vue sur mer",
];

export function EditPropertySheet({ propertyId, onClose, onSuccess }: Props) {
  const { user } = useFirebaseAuth();
  const property = useQuery(api.realestate.getProperty, {
    id: propertyId as any,
  });
  const updateProperty = useMutation(api.realestate.updateProperty);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "appartement",
    transactionType: "location",
    price: "",
    currency: "USD",
    surface: "",
    rooms: "",
    bathrooms: "",
    images: [] as string[],
    videos: [] as string[],
    city: "",
    neighborhood: "",
    address: "",
    amenities: [] as string[],
    phone: "",
    status: "available" as "available" | "rented" | "sold" | "archived",
  });

  // Charger les données de la propriété lorsqu'elles sont disponibles
  useEffect(() => {
    if (property) {
      setForm({
        title: property.title || "",
        description: property.description || "",
        type: property.type || "appartement",
        transactionType: property.transactionType || "location",
        price: property.price?.toString() || "",
        currency: property.currency || "USD",
        surface: property.surface?.toString() || "",
        rooms: property.rooms?.toString() || "",
        bathrooms: property.bathrooms?.toString() || "",
        images: property.images || [],
        videos: property.videos || [],
        city: property.city || "",
        neighborhood: property.neighborhood || "",
        address: property.address || "",
        amenities: property.amenities || [],
        phone: property.phone || "",
        status: property.status || "available",
      });
    }
  }, [property]);

  const setField = (key: keyof typeof form) => (value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleAmenity = (amenity: string) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(amenity)
        ? f.amenities.filter((a) => a !== amenity)
        : [...f.amenities, amenity],
    }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.city || !form.price) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);
    try {
      await updateProperty({
        id: propertyId as any,
        title: form.title,
        description: form.description,
        type: form.type as any,
        transactionType: form.transactionType as any,
        price: parseFloat(form.price),
        currency: form.currency,
        surface: form.surface ? parseFloat(form.surface) : undefined,
        rooms: form.rooms ? parseInt(form.rooms, 10) : undefined,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms, 10) : undefined,
        images: form.images,
        videos: form.videos,
        city: form.city,
        neighborhood: form.neighborhood || undefined,
        address: form.address || undefined,
        amenities: form.amenities,
        phone: form.phone || undefined,
        status: form.status,
      });
      toast.success("Bien mis à jour !");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error("Erreur lors de la mise à jour");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (property === undefined) {
    return (
      <View className="flex items-center justify-center h-40"><Loader2 size={32} className="animate-spin text-white/40" /></View>
    );
  }

  return (
    <>
      <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onPress={onClose} className="fixed inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} />
      <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl flex flex-col max-h-[90vh]" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
        <View className="flex justify-center pt-3 flex-shrink-0"><View className="w-10 h-1 rounded-full bg-white/20" /></View>
        <View className="flex items-center justify-between px-5 py-3 flex-shrink-0"><Text className="text-white font-black text-base">Modifier le bien</Text><Pressable onPress={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center"><X size={18} className="text-white/60" /></Pressable></View>
        <View className="flex-1 overflow-y-auto px-5 pb-8 space-y-3" style={{  }}>{}<View><Text className="text-xs text-white/40">Titre *</Text><TextInput value={form.title} onChangeText={(value) => setField("title")(value)} placeholder="Ex: Villa moderne avec piscine" className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/5 text-white placeholder:text-white/25 outline-none border border-white/10 focus:border-orange-500 transition-colors" /></View>{}<View><Text className="text-xs text-white/40">Description *</Text><TextInput value={form.description} onChangeText={(value) => setField("description")(value)} placeholder="Décrivez votre bien en détail..." className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/5 text-white placeholder:text-white/25 outline-none border border-white/10 focus:border-orange-500 transition-colors" multiline textAlignVertical="top" /></View>{}<View className="gap-3"><View><Text className="text-xs text-white/40">Type *</Text><Picker onValueChange={(value) => setField("type")(value)} className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/5 text-white outline-none border border-white/10 focus:border-orange-500 transition-colors" selectedValue={form.type}>{PROPERTY_TYPES.map((t) => (
                  <Picker.Item label={t.label} value={t.value} />
                ))}</Picker></View><View><Text className="text-xs text-white/40">Transaction *</Text><Picker onValueChange={(value) => setField("transactionType")(value)} className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/5 text-white outline-none border border-white/10 focus:border-orange-500 transition-colors" selectedValue={form.transactionType}>{TRANSACTION_TYPES.map((t) => (
                  <Picker.Item label={t.label} value={t.value} />
                ))}</Picker></View></View>{}<View className="gap-3"><View><Text className="text-xs text-white/40">Prix *</Text><TextInput value={form.price} onChangeText={(value) => setField("price")(value)} placeholder="350000" className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/5 text-white placeholder:text-white/25 outline-none border border-white/10 focus:border-orange-500 transition-colors" keyboardType="numeric" /></View><View><Text className="text-xs text-white/40">Devise</Text><Picker onValueChange={(value) => setField("currency")(value)} className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/5 text-white outline-none border border-white/10 focus:border-orange-500 transition-colors" selectedValue={form.currency}><Picker.Item label="USD" value="USD" /><Picker.Item label="EUR" value="EUR" /><Picker.Item label="CDF" value="CDF" /><Picker.Item label="CFA" value="CFA" /></Picker></View></View>{}<View className="gap-3"><View><Text className="text-xs text-white/40">Surface (m²)</Text><TextInput value={form.surface} onChangeText={(value) => setField("surface")(value)} placeholder="120" className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/5 text-white placeholder:text-white/25 outline-none border border-white/10 focus:border-orange-500 transition-colors" keyboardType="numeric" /></View><View><Text className="text-xs text-white/40">Pièces</Text><TextInput value={form.rooms} onChangeText={(value) => setField("rooms")(value)} placeholder="4" className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/5 text-white placeholder:text-white/25 outline-none border border-white/10 focus:border-orange-500 transition-colors" keyboardType="numeric" /></View><View><Text className="text-xs text-white/40">Salles de bain</Text><TextInput value={form.bathrooms} onChangeText={(value) => setField("bathrooms")(value)} placeholder="2" className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/5 text-white placeholder:text-white/25 outline-none border border-white/10 focus:border-orange-500 transition-colors" keyboardType="numeric" /></View></View>{}<View><Text className="text-xs text-white/40">Ville *</Text><TextInput value={form.city} onChangeText={(value) => setField("city")(value)} placeholder="Ex: Kinshasa" className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/5 text-white placeholder:text-white/25 outline-none border border-white/10 focus:border-orange-500 transition-colors" /></View><View><Text className="text-xs text-white/40">Quartier</Text><TextInput value={form.neighborhood} onChangeText={(value) => setField("neighborhood")(value)} placeholder="Ex: Gombe" className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/5 text-white placeholder:text-white/25 outline-none border border-white/10 focus:border-orange-500 transition-colors" /></View><View><Text className="text-xs text-white/40">Adresse</Text><TextInput value={form.address} onChangeText={(value) => setField("address")(value)} placeholder="Ex: Avenue Lumumba, 45" className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/5 text-white placeholder:text-white/25 outline-none border border-white/10 focus:border-orange-500 transition-colors" /></View>{}<View><Text className="text-xs text-white/40">Équipements</Text><View className="flex flex-wrap gap-2 mt-1">{AMENITIES_LIST.map((amenity) => (
                <Pressable key={amenity} onPress={() => toggleAmenity(amenity)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    form.amenities.includes(amenity)
                      ? "bg-orange-500 text-white"
                      : "bg-white/5 text-white/50 hover:bg-white/10"
                  }`}>{amenity}</Pressable>
              ))}</View></View>{}<View><Text className="text-xs text-white/40">Photos</Text><ImageUploader images={form.images} onChange={setField("images")} color="#F97316" /></View>{}<View><Text className="text-xs text-white/40">Vidéos (URLs)</Text><TextInput value={form.videos.join(", ")} onChangeText={(value) =>
                setField("videos")(
                  value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )} placeholder="URLs séparées par des virgules" className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/5 text-white placeholder:text-white/25 outline-none border border-white/10 focus:border-orange-500 transition-colors" /></View>{}<View><Text className="text-xs text-white/40">Téléphone de contact
            </Text><TextInput value={form.phone} onChangeText={(value) => setField("phone")(value)} placeholder="+243 825 123 456" className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/5 text-white placeholder:text-white/25 outline-none border border-white/10 focus:border-orange-500 transition-colors" /></View>{}<View><Text className="text-xs text-white/40">Statut</Text><Picker onValueChange={(value) => setField("status")(value as any)} className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/5 text-white outline-none border border-white/10 focus:border-orange-500 transition-colors" selectedValue={form.status}><Picker.Item label="Disponible" value="available" /><Picker.Item label="Loué" value="rented" /><Picker.Item label="Vendu" value="sold" /><Picker.Item label="Archivé" value="archived" /></Picker></View>{}<Pressable onPress={handleSubmit} disabled={loading} className="w-full py-4 rounded-3xl font-bold text-white active:scale-95 transition-transform disabled:opacity-50" style={{  }}>{loading ? (
              <Loader2 size={20} className="animate-spin mx-auto" />
            ) : (
              "Mettre à jour"
            )}</Pressable></View>
      </View>
    </>
  );
}
