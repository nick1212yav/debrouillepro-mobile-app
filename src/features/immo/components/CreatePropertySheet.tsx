import { Picker } from "@react-native-picker/picker";
import { View, Text, Pressable, TextInput } from "react-native";
import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { X, Loader2, MapPin, LocateFixed, Check } from "lucide-react-native";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import ImageUploader from "@/components/ImageUploader";

interface Props {
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

// ✅ Fonction de géocodage via Nominatim
async function geocodeAddress(
  address: string,
  city: string,
  country = "Congo",
): Promise<{ lat: number; lng: number } | null> {
  const query = `${address}, ${city}, ${country}`;
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function CreatePropertySheet({ onClose, onSuccess }: Props) {
  const { user } = useFirebaseAuth();
  const createProperty = useMutation(api.realestate.createProperty);
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [detectedCoords, setDetectedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

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
    city: "",
    neighborhood: "",
    address: "",
    amenities: [] as string[],
    images: [] as string[],
    videos: [] as string[],
    phone: "",
    virtualTourUrl: "",
    floorPlanUrl: "",
    tour360Images: [] as string[],
  });

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

  // ✅ Détection de la position GPS + géocodage inverse
  const detectLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      toast.error("Géolocalisation non supportée");
      return;
    }
    setGeocoding(true);
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
              road?: string;
            };
          };
          const addr = data.address;
          const city =
            addr?.city ?? addr?.town ?? addr?.village ?? addr?.suburb ?? "";
          const road = addr?.road ?? "";
          // const country = addr?.country ?? "Congo"; // non utilisé, on le garde commenté

          setDetectedCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });

          if (city) setField("city")(city);
          if (road) setField("address")(road);
          // setField("country")(country); // ❌ supprimé car le champ 'country' n'existe pas dans le formulaire

          toast.success("Position détectée !");
        } catch {
          setDetectedCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setField("city")(
            `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
          );
        }
        setGeocoding(false);
      },
      () => {
        toast.error("Impossible de détecter la position");
        setGeocoding(false);
      },
      { timeout: 10000 },
    );
  }, []);

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.city || !form.price) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);
    try {
      // ✅ Géocodage de l'adresse (si pas déjà détectée)
      let latitude: number | undefined;
      let longitude: number | undefined;

      if (detectedCoords) {
        latitude = detectedCoords.lat;
        longitude = detectedCoords.lng;
      } else if (form.address || form.city) {
        const coords = await geocodeAddress(form.address, form.city);
        if (coords) {
          latitude = coords.lat;
          longitude = coords.lng;
        }
      }

      // ✅ Création de la propriété
      await createProperty({
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
        latitude,
        longitude,
        amenities: form.amenities,
        phone: form.phone || undefined,
        virtualTourUrl: form.virtualTourUrl || undefined,
        floorPlanUrl: form.floorPlanUrl || undefined,
        tour360Images: form.tour360Images || [],
      });

      toast.success("Bien publié !");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error("Erreur lors de la publication");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onPress={onClose} className="fixed inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} />
      <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl flex flex-col max-h-[90vh]" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
        <View className="flex justify-center pt-3 flex-shrink-0"><View className="w-10 h-1 rounded-full bg-white/20" /></View>
        <View className="flex items-center justify-between px-5 py-3 flex-shrink-0"><Text className="text-white font-black text-base">Publier un bien</Text><Pressable onPress={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center"><X size={18} className="text-white/60" /></Pressable></View>
        <View className="flex-1 overflow-y-auto px-5 pb-8 space-y-3" style={{  }}>{}<View><Text className="text-xs text-white/40">Titre *</Text><TextInput value={form.title} onChangeText={(value) => setField("title")(value)} placeholder="Ex: Villa moderne avec piscine" className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/5 text-white placeholder:text-white/25 outline-none border border-white/10 focus:border-orange-500 transition-colors" /></View>{}<View><Text className="text-xs text-white/40">Description *</Text><TextInput value={form.description} onChangeText={(value) => setField("description")(value)} placeholder="Décrivez votre bien en détail..." className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/5 text-white placeholder:text-white/25 outline-none border border-white/10 focus:border-orange-500 transition-colors" multiline textAlignVertical="top" /></View>{}<View className="gap-3"><View><Text className="text-xs text-white/40">Type *</Text><Picker onValueChange={(value) => setField("type")(value)} className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/5 text-white outline-none border border-white/10 focus:border-orange-500 transition-colors" selectedValue={form.type}>{PROPERTY_TYPES.map((t) => (
                  <Picker.Item label={t.label} value={t.value} />
                ))}</Picker></View><View><Text className="text-xs text-white/40">Transaction *</Text><Picker onValueChange={(value) => setField("transactionType")(value)} className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/5 text-white outline-none border border-white/10 focus:border-orange-500 transition-colors" selectedValue={form.transactionType}>{TRANSACTION_TYPES.map((t) => (
                  <Picker.Item label={t.label} value={t.value} />
                ))}</Picker></View></View>{}<View className="gap-3"><View><Text className="text-xs text-white/40">Prix *</Text><TextInput value={form.price} onChangeText={(value) => setField("price")(value)} placeholder="350000" className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/5 text-white placeholder:text-white/25 outline-none border border-white/10 focus:border-orange-500 transition-colors" keyboardType="numeric" /></View><View><Text className="text-xs text-white/40">Devise</Text><Picker onValueChange={(value) => setField("currency")(value)} className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/5 text-white outline-none border border-white/10 focus:border-orange-500 transition-colors" selectedValue={form.currency}><Picker.Item label="USD" value="USD" /><Picker.Item label="EUR" value="EUR" /><Picker.Item label="CDF" value="CDF" /><Picker.Item label="CFA" value="CFA" /></Picker></View></View>{}<View className="gap-3"><View><Text className="text-xs text-white/40">Surface (m²)</Text><TextInput value={form.surface} onChangeText={(value) => setField("surface")(value)} placeholder="120" className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/5 text-white placeholder:text-white/25 outline-none border border-white/10 focus:border-orange-500 transition-colors" keyboardType="numeric" /></View><View><Text className="text-xs text-white/40">Pièces</Text><TextInput value={form.rooms} onChangeText={(value) => setField("rooms")(value)} placeholder="4" className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/5 text-white placeholder:text-white/25 outline-none border border-white/10 focus:border-orange-500 transition-colors" keyboardType="numeric" /></View><View><Text className="text-xs text-white/40">Salles de bain</Text><TextInput value={form.bathrooms} onChangeText={(value) => setField("bathrooms")(value)} placeholder="2" className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/5 text-white placeholder:text-white/25 outline-none border border-white/10 focus:border-orange-500 transition-colors" keyboardType="numeric" /></View></View>{}<View><Text className="text-xs text-white/40">Ville *</Text><View className="flex items-center gap-2 mt-1"><TextInput value={form.city} onChangeText={(value) => setField("city")(value)} placeholder="Ex: Kinshasa" className="flex-1 px-4 py-3 rounded-2xl bg-white/5 text-white placeholder:text-white/25 outline-none border border-white/10 focus:border-orange-500 transition-colors" /><Pressable onPress={detectLocation} disabled={geocoding} className="px-3 py-3 rounded-2xl bg-white/5 transition-colors disabled:opacity-40">{geocoding ? (
                  <Loader2 size={16} className="animate-spin text-orange-400" />
                ) : (
                  <LocateFixed size={16} className="text-orange-400" />
                )}</Pressable></View>{detectedCoords && (
              <View className="mt-1 flex items-center gap-1 text-[10px] text-green-400"><Check size={12} /><Text>Coordonnées:</Text>{detectedCoords.lat.toFixed(4)}<Text>,</Text>{" "}{detectedCoords.lng.toFixed(4)}</View>
            )}</View><View><Text className="text-xs text-white/40">Quartier</Text><TextInput value={form.neighborhood} onChangeText={(value) => setField("neighborhood")(value)} placeholder="Ex: Gombe" className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/5 text-white placeholder:text-white/25 outline-none border border-white/10 focus:border-orange-500 transition-colors" /></View><View><Text className="text-xs text-white/40">Adresse</Text><TextInput value={form.address} onChangeText={(value) => setField("address")(value)} placeholder="Ex: Avenue Lumumba, 45" className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/5 text-white placeholder:text-white/25 outline-none border border-white/10 focus:border-orange-500 transition-colors" /></View>{}<View><Text className="text-xs text-white/40">Équipements</Text><View className="flex flex-wrap gap-2 mt-1">{AMENITIES_LIST.map((amenity) => (
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
            </Text><TextInput value={form.phone} onChangeText={(value) => setField("phone")(value)} placeholder="+243 825 123 456" className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/5 text-white placeholder:text-white/25 outline-none border border-white/10 focus:border-orange-500 transition-colors" /></View>{}<View><Text className="text-xs text-white/40">Visite virtuelle (URL 360°)
            </Text><TextInput value={form.virtualTourUrl} onChangeText={(value) => setField("virtualTourUrl")(value)} placeholder="https://my.matterport.com/show/?m=..." className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/5 text-white placeholder:text-white/25 outline-none border border-white/10 focus:border-orange-500 transition-colors" /></View>{}<View><Text className="text-xs text-white/40">Plan du logement (URL)
            </Text><TextInput value={form.floorPlanUrl} onChangeText={(value) => setField("floorPlanUrl")(value)} placeholder="https://..." className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/5 text-white placeholder:text-white/25 outline-none border border-white/10 focus:border-orange-500 transition-colors" /></View>{}<View><Text className="text-xs text-white/40">Images 360° (URLs séparées par des virgules)
            </Text><TextInput value={form.tour360Images.join(", ")} onChangeText={(value) =>
                setField("tour360Images")(
                  value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )} placeholder="https://..." className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/5 text-white placeholder:text-white/25 outline-none border border-white/10 focus:border-orange-500 transition-colors" /></View>{}<Pressable onPress={handleSubmit} disabled={loading} className="w-full py-4 rounded-3xl font-bold text-white active:scale-95 transition-transform disabled:opacity-50" style={{  }}>{loading ? (
              <Loader2 size={20} className="animate-spin mx-auto" />
            ) : (
              "Publier le bien"
            )}</Pressable></View>
      </View>
    </>
  );
}
