import { UIService } from "@/core/sdk/ui/UIService";
import { Picker } from "@react-native-picker/picker";
import { View, Text, Pressable, TextInput } from "react-native";
import { useState, useCallback } from "react";
import { X, Upload, Plus, AlertCircle, MapPin, Loader2 } from "lucide-react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { AnnonceType } from "../types";
import ImageUploader from "@/components/ImageUploader"; // ✅ réutilisation du composant existant

const CATEGORIES: { id: AnnonceType; label: string; icon: string }[] = [
  { id: "immobilier", label: "Immobilier", icon: "🏠" },
  { id: "automobile", label: "Automobile", icon: "🚗" },
  { id: "telephones", label: "Téléphones", icon: "📱" },
  { id: "ordinateurs", label: "Ordinateurs", icon: "💻" },
  { id: "mode", label: "Mode", icon: "👔" },
  { id: "electromenager", label: "Électroménager", icon: "🔌" },
  { id: "sport", label: "Sport", icon: "⚽" },
  { id: "bricolage", label: "Bricolage", icon: "🔧" },
  { id: "emploi", label: "Emploi", icon: "💼" },
  { id: "services", label: "Services", icon: "🛠️" },
  { id: "divers", label: "Divers", icon: "📦" },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateAnnonceSheet({ isOpen, onClose, onSuccess }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<AnnonceType>("divers");
  const [location, setLocation] = useState("");
  const [condition, setCondition] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);

  const create = useMutation(api.publications.createPublication);

  // ✅ Géocodage
  const geocodeLocation = useCallback(async (address: string) => {
    if (!address.trim()) {
      UIService.openToast("Veuillez saisir une adresse", "warning");
      return;
    }
    setGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        { headers: { "User-Agent": "DebrouillePro/1.0" } },
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setLatitude(lat);
        setLongitude(lng);
        if (data[0].display_name) setLocation(data[0].display_name);
        UIService.openToast("Adresse géolocalisée ✅", "success");
      } else {
        UIService.openToast("Adresse non trouvée", "warning");
        setLatitude(undefined);
        setLongitude(undefined);
      }
    } catch {
      UIService.openToast("Erreur de géocodage", "error");
      setLatitude(undefined);
      setLongitude(undefined);
    } finally {
      setGeocoding(false);
    }
  }, []);

  // ✅ Détection GPS
  const detectUserLocation = useCallback(() => {
    if (!("geolocation" in undefined)) {
      UIService.openToast("Géolocalisation non supportée", "error");
      return;
    }
    setGeocoding(true);
    undefined.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            { headers: { "User-Agent": "DebrouillePro/1.0" } },
          );
          const data = await response.json();
          setLocation(
            data?.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          );
          UIService.openToast("Position détectée 📍", "success");
        } catch {
          setLocation(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
        setGeocoding(false);
      },
      () => {
        UIService.openToast("Impossible de détecter la position", "error");
        setGeocoding(false);
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  }, []);

  const handleGeolocate = useCallback(() => {
    if (location.trim()) geocodeLocation(location);
    else detectUserLocation();
  }, [location, geocodeLocation, detectUserLocation]);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      UIService.openToast("Titre et description requis", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const meta: any = {};
      if (condition) meta.condition = condition;

      await create({
        type: "annonce",
        title: title.trim(),
        description: description.trim(),
        price: price || undefined,
        location: location || undefined,
        latitude,
        longitude,
        images,
        tags: [category],
        meta: JSON.stringify(meta),
      });
      UIService.openToast("Annonce publiée !", "success");
      onSuccess?.();
      onClose();
    } catch (error) {
      UIService.openToast("Erreur lors de la publication", "error");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {isOpen && (
        <Pressable
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          onPress={onClose}
        >
          <Pressable
            className="w-full max-w-md rounded-t-3xl p-6"
            style={{ backgroundColor: "#0D1117", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              className="w-10 h-1 rounded-full mx-auto mb-5"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            />

            <View className="flex items-center justify-between mb-4">
              <Text className="text-white font-bold text-lg">
                Publier une annonce
              </Text>
              <Pressable
                onPress={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center"
              >
                <X size={18} className="text-white/60" />
              </Pressable>
            </View>

            <View className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {/* Titre */}
              <TextInput
                value={title}
                onChangeText={(text) => setTitle(text)}
                placeholder="Titre de l'annonce"
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
              />

              {/* Description */}
              <TextInput
                value={description}
                onChangeText={(text) => setDescription(text)}
                placeholder="Description"
               
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
               multiline textAlignVertical="top"/>

              {/* Prix */}
              <TextInput
                value={price}
                onChangeText={(text) => setPrice(text)}
                placeholder="Prix (optionnel)"
               
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
               keyboardType="numeric"/>

              {/* Catégories */}
              <View className="gap-2">
                {CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat.id}
                    onPress={() => setCategory(cat.id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors cursor-pointer ${
                      category === cat.id
                        ? "bg-orange-500/20 border-orange-400/50"
                        : "bg-white/5 border-white/5 hover:bg-white/10"
                    } border`}
                  >
                    <Text className="text-xl">{cat.icon}</Text>
                    <Text className="text-white/60 text-[10px] text-center">
                      {cat.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Localisation */}
              <View className="space-y-2">
                <View
                  className="rounded-2xl p-3.5"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
                >
                  <View className="flex items-center gap-2.5">
                    <MapPin size={14} style={{ color: "#F59E0B" }} />
                    <TextInput
                      value={location}
                      onChangeText={(text) => setLocation(text)}
                      placeholder="Adresse (ville, quartier)"
                      className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 outline-none"
                     
                     editable={!(geocoding)}/>
                    <Pressable
                      onPress={handleGeolocate}
                      disabled={geocoding}
                      className="flex-shrink-0 disabled:opacity-40 text-xs font-medium px-2 py-1 rounded-lg"
                      style={{ backgroundColor: "rgba(245,158,11,0.2)" }}
                    >
                      {geocoding ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        "📍"
                      )}
                    </Pressable>
                  </View>
                </View>
                <Pressable
                  onPress={detectUserLocation}
                  disabled={geocoding}
                  className="flex items-center gap-2 text-xs text-white/40"
                >
                  <MapPin size={12} />
                  <Text>Utiliser ma position actuelle</Text></Pressable>
                {latitude && longitude && (
                  <View className="text-[10px] text-emerald-400/60 flex items-center gap-1">
                    <Text>
                      <Text>✅ Coordonnées GPS :</Text>{latitude.toFixed(4)}<Text>,</Text>{" "}
                      {longitude.toFixed(4)}
                    </Text>
                  </View>
                )}
              </View>

              {/* État */}
              <Picker
               
                onValueChange={(val) => setCondition(val)}
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
               selectedValue={condition}>
                <Picker.Item label="État (optionnel)" value="" />
                <Picker.Item label="Neuf" value="neuf" />
                <Picker.Item label="Comme neuf" value="comme-neuf" />
                <Picker.Item label="Très bon état" value="tres-bon" />
                <Picker.Item label="Bon état" value="bon" />
                <Picker.Item label="État acceptable" value="acceptable" />
              </Picker>

              {/* ✅ Upload d'images avec ImageUploader */}
              <ImageUploader
                images={images}
                onChange={setImages}
                color="#F59E0B"
              />
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting || geocoding}
              className="w-full py-3.5 rounded-xl text-white font-bold mt-4"
              style={{ opacity: isSubmitting || geocoding ? 0.7 : 1 }}
            >
              {isSubmitting ? "Publication..." : "Publier"}
            </Pressable>
          </Pressable>
        </Pressable>
      )}
    </>
  );
}
