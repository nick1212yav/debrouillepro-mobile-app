import { Picker } from "@react-native-picker/picker";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useCallback, useState } from "react";
import { X, MapPin, Loader2 } from "lucide-react-native";
import * as Location from "expo-location";
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

interface GeocodingResult {
  lat: string;
  lon: string;
  display_name?: string;
}

interface ReverseGeocodingResult {
  display_name?: string;
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
  const [geocoding, setGeocoding] = useState(false);
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();

  const create = useMutation(api.serviceProviders.create);
  const createPublication = useMutation(api.publications.createPublication);

  const geocodeLocation = useCallback(async (address: string) => {
    const trimmedAddress = address.trim();

    if (!trimmedAddress) {
      Alert.alert("Adresse requise", "Saisis une adresse à localiser.");
      return;
    }

    setGeocoding(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmedAddress)}&limit=1`,
      );

      if (!response.ok) {
        throw new Error("Le service de géocodage est indisponible.");
      }

      const data = (await response.json()) as GeocodingResult[];

      if (!data.length) {
        setLatitude(undefined);
        setLongitude(undefined);
        Alert.alert("Adresse introuvable", "Essaie une adresse plus précise.");
        return;
      }

      const lat = Number.parseFloat(data[0].lat);
      const lng = Number.parseFloat(data[0].lon);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error("Les coordonnées retournées sont invalides.");
      }

      setLatitude(lat);
      setLongitude(lng);

      if (data[0].display_name) {
        setLocation(data[0].display_name);
      }

      Alert.alert(
        "Localisation réussie",
        "Les coordonnées ont été enregistrées.",
      );
    } catch (error) {
      setLatitude(undefined);
      setLongitude(undefined);

      Alert.alert(
        "Erreur de géocodage",
        error instanceof Error
          ? error.message
          : "Impossible de localiser cette adresse.",
      );
    } finally {
      setGeocoding(false);
    }
  }, []);

  const detectUserLocation = useCallback(async () => {
    setGeocoding(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission refusée",
          "Autorise la localisation pour détecter ta position actuelle.",
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      setLatitude(lat);
      setLongitude(lng);

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        );

        if (!response.ok) {
          throw new Error("Géocodage inverse indisponible.");
        }

        const data = (await response.json()) as ReverseGeocodingResult;

        setLocation(
          data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        );
      } catch {
        setLocation(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }

      Alert.alert("Position détectée", "La position a été renseignée.");
    } catch {
      Alert.alert(
        "Localisation impossible",
        "Vérifie que la localisation est activée sur ton appareil.",
      );
    } finally {
      setGeocoding(false);
    }
  }, []);

  const handleGeolocate = useCallback(() => {
    if (location.trim()) {
      void geocodeLocation(location);
    } else {
      void detectUserLocation();
    }
  }, [location, geocodeLocation, detectUserLocation]);

  const resetForm = () => {
    setName("");
    setSpecialty("");
    setDescription("");
    setPrice("");
    setCurrency("USD");
    setCategory("");
    setLocation("");
    setResponseTime("");
    setSkills([]);
    setImages([]);
    setLatitude(undefined);
    setLongitude(undefined);
  };

  const handleSubmit = async () => {
    if (isSubmitting || geocoding) return;

    const trimmedName = name.trim();
    const trimmedSpecialty = specialty.trim();
    const trimmedDescription = description.trim();
    const trimmedPrice = price.trim();
    const trimmedLocation = location.trim();
    const trimmedResponseTime = responseTime.trim();

    if (
      !trimmedName ||
      !trimmedSpecialty ||
      !trimmedDescription ||
      !trimmedPrice ||
      !category ||
      !trimmedLocation
    ) {
      Alert.alert(
        "Champs obligatoires",
        "Renseigne le nom, la spécialité, la description, le prix, la catégorie et la localisation.",
      );
      return;
    }

    if (!Number.isFinite(Number(trimmedPrice)) || Number(trimmedPrice) < 0) {
      Alert.alert("Prix invalide", "Saisis un prix numérique positif ou nul.");
      return;
    }

    setIsSubmitting(true);

    try {
      const normalizedSkills = skills
        .map((skill) => skill.trim())
        .filter(Boolean);

      const providerId = await create({
        name: trimmedName,
        specialty: trimmedSpecialty,
        description: trimmedDescription,
        price: trimmedPrice,
        currency,
        category,
        location: trimmedLocation,
        responseTime: trimmedResponseTime || "Sur demande",
        skills: normalizedSkills,
        imageUrl: images[0],
        coverImage: images.length > 1 ? images[1] : undefined,
        portfolio: images,
        available: true,
        verified: false,
        latitude,
        longitude,
      });

      if (!providerId) {
        throw new Error("La création du service a échoué.");
      }

      const meta = JSON.stringify({
        providerId,
        specialty: trimmedSpecialty,
        price: trimmedPrice,
        currency,
        category,
        responseTime: trimmedResponseTime || "Sur demande",
        skills: normalizedSkills,
        latitude,
        longitude,
        isService: true,
        rating: 0,
        reviewCount: 0,
        available: true,
        verified: false,
      });

      await createPublication({
        type: "service",
        title: trimmedName,
        description:
          `${trimmedDescription}\n\n` +
          `Spécialité : ${trimmedSpecialty}\n` +
          `Prix : ${trimmedPrice} ${currency}\n` +
          `Disponibilité : ${trimmedResponseTime || "Sur demande"}`,
        location: trimmedLocation,
        category,
        images,
        tags: [category, trimmedSpecialty.split(",")[0]?.trim() || "service"],
        meta,
        latitude,
        longitude,
      });

      resetForm();
      onSuccess?.();
      onClose();

      Alert.alert("Service publié", "Ton service a été publié avec succès.");
    } catch (error) {
      console.error("Erreur lors de la publication du service:", error);

      Alert.alert(
        "Publication impossible",
        error instanceof Error
          ? error.message
          : "Une erreur est survenue pendant la publication.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <Pressable
          onPress={onClose}
          className="flex-1 justify-end bg-black/70"
          accessibilityLabel="Fermer le formulaire"
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            className="max-h-[90%] w-full rounded-t-3xl border-t border-white/10 bg-[#0D1117] p-6"
          >
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-white">
                Publier un service
              </Text>

              <Pressable
                onPress={onClose}
                disabled={isSubmitting}
                accessibilityRole="button"
                accessibilityLabel="Fermer"
                className="h-9 w-9 items-center justify-center rounded-xl bg-white/5"
              >
                <X size={18} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 8 }}
            >
              <View className="gap-3">
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Nom du prestataire *"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                  editable={!isSubmitting}
                />

                <TextInput
                  value={specialty}
                  onChangeText={setSpecialty}
                  placeholder="Spécialité *"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                  editable={!isSubmitting}
                />

                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Description du service *"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  editable={!isSubmitting}
                />

                <View className="flex-row gap-2">
                  <TextInput
                    value={price}
                    onChangeText={setPrice}
                    placeholder="Prix *"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                    keyboardType="decimal-pad"
                    editable={!isSubmitting}
                  />

                  <View className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
                    <Picker
                      selectedValue={currency}
                      onValueChange={(value: string) => setCurrency(value)}
                      enabled={!isSubmitting}
                      style={{ color: "white", width: 110 }}
                      dropdownIconColor="white"
                    >
                      <Picker.Item label="USD" value="USD" />
                      <Picker.Item label="CDF" value="CDF" />
                      <Picker.Item label="EUR" value="EUR" />
                      <Picker.Item label="CFA" value="CFA" />
                    </Picker>
                  </View>
                </View>

                <View className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
                  <Picker
                    selectedValue={category}
                    onValueChange={(value: string) => setCategory(value)}
                    enabled={!isSubmitting}
                    style={{ color: "white" }}
                    dropdownIconColor="white"
                  >
                    <Picker.Item label="Choisir une catégorie *" value="" />
                    {CATEGORIES.map((item) => (
                      <Picker.Item key={item} label={item} value={item} />
                    ))}
                  </Picker>
                </View>

                <View
                  className="rounded-2xl p-3"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.06)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.1)",
                  }}
                >
                  <View className="flex-row items-center gap-2">
                    <MapPin size={16} color="rgba(255,255,255,0.6)" />
                    <TextInput
                      value={location}
                      onChangeText={setLocation}
                      placeholder="Localisation *"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      className="flex-1 text-sm text-white"
                      editable={!geocoding && !isSubmitting}
                    />

                    <Pressable
                      onPress={handleGeolocate}
                      disabled={geocoding || isSubmitting}
                      accessibilityRole="button"
                      accessibilityLabel="Localiser l'adresse saisie"
                      className="items-center justify-center rounded-lg px-3 py-2"
                      style={{
                        backgroundColor: "rgba(245,158,11,0.2)",
                      }}
                    >
                      {geocoding ? (
                        <Loader2 size={16} color="#FBBF24" />
                      ) : (
                        <Text className="text-xs font-medium text-amber-400">
                          Localiser
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </View>

                <Pressable
                  onPress={() => void detectUserLocation()}
                  disabled={geocoding || isSubmitting}
                  accessibilityRole="button"
                  className="flex-row items-center gap-2 py-1"
                >
                  <MapPin size={14} color="rgba(255,255,255,0.5)" />
                  <Text className="text-xs text-white/50">
                    Utiliser ma position actuelle
                  </Text>
                </Pressable>

                {latitude !== undefined && longitude !== undefined && (
                  <Text className="text-xs text-emerald-400">
                    Coordonnées GPS : {latitude.toFixed(5)},{" "}
                    {longitude.toFixed(5)}
                  </Text>
                )}

                <TextInput
                  value={responseTime}
                  onChangeText={setResponseTime}
                  placeholder="Temps de réponse (ex. moins d'une heure)"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                  editable={!isSubmitting}
                />

                <View>
                  <Text className="mb-2 text-xs text-white/50">
                    Compétences séparées par des virgules
                  </Text>
                  <TextInput
                    value={skills.join(", ")}
                    onChangeText={(value) =>
                      setSkills(
                        value
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean),
                      )
                    }
                    placeholder="Plomberie, électricité..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                    editable={!isSubmitting}
                  />
                </View>

                <ImageUploader
                  images={images}
                  onChange={setImages}
                  color="#F97316"
                />
              </View>
            </ScrollView>

            <Pressable
              onPress={() => void handleSubmit()}
              disabled={isSubmitting || geocoding}
              accessibilityRole="button"
              className={`mt-4 w-full items-center rounded-xl py-3.5 ${
                isSubmitting || geocoding ? "bg-orange-500/50" : "bg-orange-500"
              }`}
            >
              <Text className="font-bold text-white">
                {isSubmitting
                  ? "Publication en cours..."
                  : "Publier le service"}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
