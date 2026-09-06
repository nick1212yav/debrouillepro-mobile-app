import { useRouter } from "expo-router";
import { UIService } from "@/core/sdk/ui/UIService";
import { Picker } from "@react-native-picker/picker";
import { View, Text, Pressable, TextInput } from "react-native";
// src/features/transport/pages/CreateTransportRoutePage.tsx
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  ArrowLeft,
  Car,
  ShieldAlert,
  ChevronRight,
  Loader2,
  Plus,
  MapPin,
  Clock,
  Coins,
} from "lucide-react-native";

export default function CreateTransportRoutePage() {
  const router = useRouter();
  const createRoute = useMutation(api.transport.createTransportRoute);

  // Correction de la requête pour correspondre à votre schéma existant : getCurrentUser
  const currentUser = useQuery(api.users.getCurrentUser);
  const drivers = useQuery(api.transport.listTransportDrivers, {});

  // Correction TS : Déclaration explicite du type du paramètre d'itération 'd'
  const currentDriver = drivers?.find(
    (d: any) => d.userId === currentUser?._id,
  );

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    departureTime: "",
    seats: 4,
    pricePerSeat: 1500,
    currency: "FC",
    vehicleType: "voiture" as
      | "taxi"
      | "bus"
      | "moto"
      | "minibus"
      | "voiture"
      | "camion"
      | "rideshare",
    description: "",
  });

  // Pré-remplir les données de véhicule par défaut depuis le profil chauffeur trouvé
  useEffect(() => {
    if (currentDriver) {
      setFormData((prev) => ({
        ...prev,
        vehicleType: currentDriver.vehicleType as any,
        seats: currentDriver.seats,
      }));
    }
  }, [currentDriver]);

  const handleChange = (
    e: string,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "seats" || name === "pricePerSeat"
          ? parseInt(value) || 0
          : value,
    }));
  };

  const handleSubmit = async (e: unknown) => {
    if (!formData.origin || !formData.destination || !formData.departureTime) {
      UIService.openToast("Veuillez remplir tous les champs obligatoires.", "error");
      return;
    }

    setLoading(true);
    try {
      await createRoute({
        vehicleType:
          formData.vehicleType === "rideshare"
            ? "rideshare"
            : (formData.vehicleType as any),
        currency: formData.currency,
        origin: formData.origin,
        destination: formData.destination,
        departureTime: formData.departureTime,
        seats: formData.seats,
        pricePerSeat: formData.pricePerSeat,
        description: formData.description || undefined,
        driverId: currentDriver?._id, // Transmission automatique de l'ID Chauffeur validé
        vehicleModel: currentDriver?.vehicleModel,
        vehiclePlate: currentDriver?.licensePlate,
        driverName: currentDriver?.name,
        phone: currentDriver?.phone,
      });

      UIService.openToast("Votre trajet a été publié avec succès !", "success");
      router("/transport");
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Erreur de création du trajet";
      UIService.openToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // Écran de chargement des données Convex
  if (currentUser === undefined || drivers === undefined) {
    return (
      <View className="h-full min-h-screen flex items-center justify-center bg-[#02040c]">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </View>
    );
  }

  // ÉCRAN INTERSTITIEL PREMIUM : Redirection si l'utilisateur n'est pas chauffeur
  if (!currentDriver) {
    return (
      <View className="min-h-screen bg-[#020412] text-white flex flex-col justify-between p-6">
        {/* Header simple */}
        <View className="flex items-center gap-3 pt-6">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5"
          >
            <ArrowLeft size={18} />
          </Pressable>
          <Text className="text-xs font-bold text-white/40">
            Étape d'authentification
          </Text>
        </View>

        {/* Visuel & Explication */}
        <View className="max-w-sm mx-auto text-center space-y-5 my-auto">
          <View className="w-16 h-16 rounded-3xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mx-auto">
            <Car size={32} />
          </View>
          <View className="space-y-2">
            <Text className="text-xl font-black text-white leading-tight">
              Devenez d'abord chauffeur
            </Text>
            <Text className="text-xs text-white/50 leading-relaxed">
              Pour garantir la sécurité de notre réseau de transport, vous devez
              configurer votre profil de conducteur certifié avant de publier
              vos trajets.
            </Text>
          </View>

          <View className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex gap-3 text-left">
            <ShieldAlert
              size={18}
              className="text-amber-400 flex-shrink-0 mt-0.5"
            />
            <View>
              <Text className="text-xs font-bold text-white">
                Création rapide et gratuite
              </Text>
              <Text className="text-[10px] text-white/40 mt-0.5">
                Il vous suffit de renseigner votre véhicule et votre permis de
                conduire une seule fois.
              </Text>
            </View>
          </View>
        </View>

        {/* Actions du bas */}
        <View className="space-y-3 max-w-sm mx-auto w-full pb-6">
          <Pressable
            onPress={() => router("/transport/become-driver")}
            className="w-full py-4 rounded-2xl bg-violet-600 text-xs font-black text-white flex items-center justify-center gap-2 shadow-lg shadow-violet-600/10"
          >
            <Text>S'enregistrer comme chauffeur</Text><ChevronRight size={14} />
          </Pressable>
          <Pressable
            onPress={() => router.back()}
            className="w-full py-4 rounded-2xl border border-white/5 bg-white/5 text-xs font-bold text-white/80"
          >
            <Text>Plus tard</Text></Pressable>
        </View>
      </View>
    );
  }

  // FORMULAIRE PREMIUM SI L'UTILISATEUR EST DEJA CHAUFFEUR
  return (
    <View className="min-h-screen bg-[#020412] text-white flex flex-col">
      {/* Header */}
      <View className="flex-shrink-0 px-4 pt-12 pb-3 flex items-center gap-3 border-b border-white/5 bg-[#070914]/40">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5"
        >
          <ArrowLeft size={18} className="text-white" />
        </Pressable>
        <View>
          <Text className="text-white font-bold text-base">
            Publier un itinéraire
          </Text>
          <Text className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
            <Text className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Compte Chauffeur Connecté ({currentDriver.name})
          </Text>
        </View>
      </View>

      {/* Formulaire de saisie */}
      <View
       
        className="flex-1 p-6 space-y-5 overflow-y-auto max-w-md mx-auto w-full pb-28"
      >
        <View className="space-y-4">
          <Text className="text-xs font-black text-white/30 uppercase tracking-widest">
            Informations du trajet
          </Text>

          <View className="gap-3">
            <View className="relative">
              <Text className="text-[10px] uppercase font-bold text-white/40 block mb-1">
                Origine
              </Text>
              <View className="relative">
                <MapPin
                  size={14}
                  className="absolute left-4 top-3.5 text-white/30"
                />
                <TextInput
                 
                 
                 value={formData.origin}
                  onChangeText={handleChange}
                  placeholder="Ex: Kinshasa"
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-11 pr-4 py-3.5 text-xs text-white outline-none"
                />
              </View>
            </View>

            <View className="relative">
              <Text className="text-[10px] uppercase font-bold text-white/40 block mb-1">
                Destination
              </Text>
              <View className="relative">
                <MapPin
                  size={14}
                  className="absolute left-4 top-3.5 text-white/30"
                />
                <TextInput
                 
                 
                 value={formData.destination}
                  onChangeText={handleChange}
                  placeholder="Ex: Lubumbashi"
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-11 pr-4 py-3.5 text-xs text-white outline-none"
                />
              </View>
            </View>
          </View>

          <View>
            <Text className="text-[10px] uppercase font-bold text-white/40 block mb-1">
              Heure de départ planifiée
            </Text>
            <View className="relative">
              <Clock
                size={14}
                className="absolute left-4 top-3.5 text-white/30"
              />
              <TextInput
               
               
               value={formData.departureTime}
                onChangeText={handleChange}
                placeholder="Ex: Demain à 08:30"
                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-11 pr-4 py-3.5 text-xs text-white outline-none"
              />
            </View>
          </View>
        </View>

        <View className="space-y-4 pt-4 border-t border-white/5">
          <Text className="text-xs font-black text-white/30 uppercase tracking-widest">
            Capacité & Tarification
          </Text>

          <View className="gap-3">
            <View>
              <Text className="text-[10px] uppercase font-bold text-white/40 block mb-1">
                Nombre de places
              </Text>
              <TextInput
               
               
                value={formData.seats}
                onChangeText={handleChange}
                min={1}
                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3.5 text-xs text-white outline-none"
               keyboardType="numeric"/>
            </View>

            <View>
              <Text className="text-[10px] uppercase font-bold text-white/40 block mb-1">
                Prix par place
              </Text>
              <View className="relative">
                <Coins
                  size={14}
                  className="absolute left-4 top-3.5 text-white/30"
                />
                <TextInput
                 
                 
                  value={formData.pricePerSeat}
                  onChangeText={handleChange}
                  min={1}
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-11 pr-4 py-3.5 text-xs text-white outline-none"
                 keyboardType="numeric"/>
              </View>
            </View>
          </View>
        </View>

        <View className="space-y-4 pt-4 border-t border-white/5">
          <Text className="text-[10px] uppercase font-bold text-white/40 block">
            Note de trajet (Facultatif)
          </Text>
          <TextInput
           
            value={formData.description}
            onChangeText={handleChange}
            placeholder="Ex: Bagages autorisés dans la limite du coffre, climatisation active..."
           
            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-xs text-white outline-none"
           multiline textAlignVertical="top"/>
        </View>

        {/* Bouton de validation d'action flottant */}
        <View className="fixed bottom-0 left-0 right-0 p-4 bg-[#020412]/80 border-t border-white/5 z-20 max-w-md mx-auto">
          <Pressable
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-violet-600 text-xs font-black text-white flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin text-white" />
            ) : (
              <>
                <Plus size={16} />
                <Text>Publier l'itinéraire</Text></>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}
