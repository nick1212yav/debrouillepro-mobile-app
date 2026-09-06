import { UIService } from "@/core/sdk/ui/UIService";
import { Picker } from "@react-native-picker/picker";
import { View, Text, Pressable, TextInput } from "react-native";
import { useState, useCallback } from "react";
import { X, MapPin, Loader2, Upload } from "lucide-react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import ImageUploader from "@/components/ImageUploader";

const CATEGORIES = [
  "Dépannage",
  "Beauté",
  "Livraison",
  "Éducation",
  "Photo",
  "Bien-être",
  "Événementiel",
  "Autre",
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateServiceSheet({ isOpen, onClose, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [responseTime, setResponseTime] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ États pour la géolocalisation
  const [geocoding, setGeocoding] = useState(false);
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);

  const create = useMutation(api.serviceProviders.create);
  const createPublication = useMutation(api.publications.createPublication);

  // ✅ Géocodage direct (adresse → coordonnées)
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
        if (data[0].display_name) {
          setLocation(data[0].display_name);
        }
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

  // ✅ Détection GPS + reverse geocoding
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
          if (data?.display_name) {
            setLocation(data.display_name);
          } else {
            setLocation(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          }
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

  // ✅ Bouton principal : si l'adresse est saisie → géocode, sinon → GPS
  const handleGeolocate = useCallback(() => {
    if (location.trim()) {
      geocodeLocation(location);
    } else {
      detectUserLocation();
    }
  }, [location, geocodeLocation, detectUserLocation]);

  const handleSubmit = async () => {
    if (
      !name ||
      !specialty ||
      !description ||
      !price ||
      !category ||
      !location
    ) {
      UIService.openToast("Veuillez remplir tous les champs obligatoires", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      // 1️⃣ Créer le service dans serviceProviders
      const providerId = await create({
        name,
        specialty,
        description,
        price,
        currency,
        category,
        location,
        responseTime: responseTime || "Sur demande",
        skills,
        imageUrl: images[0],
        coverImage: images.length > 1 ? images[1] : undefined,
        portfolio: images,
        available: true,
        verified: false,
        latitude,
        longitude,
      });

      // Vérifier que providerId est valide
      if (!providerId) {
        throw new Error("La création du service a échoué");
      }

      // 2️⃣ Créer une publication dans publications pour le feed
      const meta = JSON.stringify({
        providerId,
        specialty,
        price,
        currency,
        category,
        responseTime,
        skills,
        latitude,
        longitude,
        isService: true,
        // Ajouter des champs supplémentaires pour le rendu
        rating: 0,
        reviewCount: 0,
        available: true,
        verified: false,
      });

      await createPublication({
        type: "service",
        title: name,
        description: `${description}\n\nSpécialité : ${specialty}\nPrix : ${price} ${currency}\nDisponibilité : ${responseTime}`,
        location: location,
        category: category,
        images: images,
        tags: [category, specialty.split(",")[0]?.trim() || "service"],
        meta: meta,
        latitude,
        longitude,
      });

      UIService.openToast("Service publié !", "success");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("❌ Erreur lors de la publication:", error);
      UIService.openToast(error instanceof Error
          ? error.message
          : "Erreur lors de la publication", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Pressable
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70"
      onPress={onClose}
    >
      <Pressable
        className="w-full max-w-md rounded-t-3xl p-6 bg-[#0D1117] border border-white/10"
        onPress={(e) => e.stopPropagation()}
      >
        <View className="w-10 h-1 rounded-full mx-auto mb-5 bg-white/20" />

        <View className="flex items-center justify-between mb-4">
          <Text className="text-white font-bold text-lg">Publier un service</Text>
          <Pressable
            onPress={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
          >
            <X size={18} className="text-white/60" />
          </Pressable>
        </View>

        <View className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <TextInput
            value={name}
            onChangeText={(text) => setName(text)}
            placeholder="Nom du prestataire *"
            className="w-full rounded-xl px-4 py-3 text-sm text-white bg-white/5 border border-white/10 outline-none placeholder:text-white/30"
          />

          <TextInput
            value={specialty}
            onChangeText={(text) => setSpecialty(text)}
            placeholder="Spécialité *"
            className="w-full rounded-xl px-4 py-3 text-sm text-white bg-white/5 border border-white/10 outline-none placeholder:text-white/30"
          />

          <TextInput
            value={description}
            onChangeText={(text) => setDescription(text)}
            placeholder="Description *"
           
            className="w-full rounded-xl px-4 py-3 text-sm text-white bg-white/5 border border-white/10 outline-none placeholder:text-white/30"
           multiline textAlignVertical="top"/>

          <View className="flex gap-2">
            <TextInput
              value={price}
              onChangeText={(text) => setPrice(text)}
              placeholder="Prix *"
             
              className="flex-1 rounded-xl px-4 py-3 text-sm text-white bg-white/5 border border-white/10 outline-none placeholder:text-white/30"
             keyboardType="numeric"/>
            <Picker
             
              onValueChange={(val) => setCurrency(val)}
              className="rounded-xl px-4 py-3 text-sm text-white bg-white/5 border border-white/10 outline-none"
             selectedValue={currency}>
              <Picker.Item label="USD" value="USD" />
              <Picker.Item label="EUR" value="EUR" />
              <Picker.Item label="CDF" value="CDF" />
              <Picker.Item label="CFA" value="CFA" />
            </Picker>
          </View>

          <Picker
           
            onValueChange={(val) => setCategory(val)}
            className="w-full rounded-xl px-4 py-3 text-sm text-white bg-white/5 border border-white/10 outline-none"
           selectedValue={category}>
            <Picker.Item label="Catégorie *" value="" />
            {CATEGORIES.map((c) => (
              <Picker.Item label={`${c}`} value={c} />
            ))}
          </Picker>

          {/* ✅ Localisation avec géolocalisation */}
          <View className="space-y-2">
            <View
              className="rounded-2xl p-3.5"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
            >
              <View className="flex items-center gap-2.5">
                <MapPin size={14} style={{ color: "#F97316" }} />
                <TextInput
                  value={location}
                  onChangeText={(text) => setLocation(text)}
                  placeholder="Localisation *"
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
                  ✅ Coordonnées GPS : {latitude.toFixed(4)},{" "}
                  {longitude.toFixed(4)}
                </Text>
              </View>
            )}
          </View>

          <TextInput
            value={responseTime}
            onChangeText={(text) => setResponseTime(text)}
            placeholder="Temps de réponse (ex: < 1h)"
            className="w-full rounded-xl px-4 py-3 text-sm text-white bg-white/5 border border-white/10 outline-none placeholder:text-white/30"
          />

          <View>
            <Text className="text-xs text-white/40 block mb-1">
              Compétences (séparées par des virgules)
            </Text>
            <TextInput
              value={skills.join(", ")}
              onChangeText={(text) =>
                setSkills(
                  text
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
              placeholder="Plomberie, Électricité, ..."
              className="w-full rounded-xl px-4 py-3 text-sm text-white bg-white/5 border border-white/10 outline-none placeholder:text-white/30"
            />
          </View>

          <ImageUploader images={images} onChange={setImages} color="#F97316" />
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting || geocoding}
          className="w-full py-3.5 rounded-xl text-white font-bold mt-4 bg-gradient-to-r from-orange-500 to-red-500 disabled:opacity-50"
        >
          {isSubmitting ? "Publication..." : "Publier"}
        </Pressable>
      </Pressable>
    </Pressable>
  );
}
