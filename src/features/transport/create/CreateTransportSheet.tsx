import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, Image, TextInput } from "react-native";

// src/features/transport/create/CreateTransportSheet.tsx
import { useState, useRef, useEffect } from "react";
import {
  X,
  ArrowLeft,
  Camera,
  Video,
  Mic,
  Trash2,
  Play,
  Square,
  Volume2,
  Sparkles,
  Loader2,
} from "lucide-react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";

// Imports des formulaires
import { CreateTaxiForm } from "./CreateTaxiForm";
import { CreateRideShareForm } from "./CreateRideShareForm";
import { CreateBusForm } from "./CreateBusForm";
import { CreateMotoForm } from "./CreateMotoForm";
import { CreateTruckForm } from "./CreateTruckForm";
import { CreateCarRentalForm } from "./CreateCarRentalForm";
import { CreateCourierForm } from "./CreateCourierForm";
import { CreateParcelForm } from "./CreateParcelForm";
import { CreateBoatForm } from "./CreateBoatForm";
import { CreateFlightForm } from "./CreateFlightForm";
import { CreateTrainForm } from "./CreateTrainForm";
import { CreateTowTruckForm } from "./CreateTowTruckForm";
import { CreateAmbulanceForm } from "./CreateAmbulanceForm";
import { CreateShuttleForm } from "./CreateShuttleForm";

interface CreateTransportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const TRANSPORT_CATEGORIES = {
  terrestres: [
    {
      id: "rideshare",
      label: "Covoiturage",
      icon: "👥",
      component: CreateRideShareForm,
    },
    { id: "taxi", label: "Taxi", icon: "🚕", component: CreateTaxiForm },
    { id: "bus", label: "Bus", icon: "🚌", component: CreateBusForm },
    { id: "moto", label: "Moto-taxi", icon: "🏍️", component: CreateMotoForm },
    {
      id: "rental",
      label: "Location voiture",
      icon: "🚗",
      component: CreateCarRentalForm,
    },
    {
      id: "shuttle",
      label: "Navette",
      icon: "🚐",
      component: CreateShuttleForm,
    },
  ],
  marchandises: [
    { id: "truck", label: "Camion", icon: "🚛", component: CreateTruckForm },
    {
      id: "courier",
      label: "Livraison express",
      icon: "📦",
      component: CreateCourierForm,
    },
    { id: "parcel", label: "Colis", icon: "📮", component: CreateParcelForm },
  ],
  services: [
    {
      id: "towtruck",
      label: "Dépannage",
      icon: "🔧",
      component: CreateTowTruckForm,
    },
    {
      id: "ambulance",
      label: "Ambulance",
      icon: "🚑",
      component: CreateAmbulanceForm,
    },
  ],
  voies: [
    {
      id: "boat",
      label: "Bateau / Ferry",
      icon: "⛴️",
      component: CreateBoatForm,
    },
    {
      id: "flight",
      label: "Avion / Hélicoptère",
      icon: "✈️",
      component: CreateFlightForm,
    },
    { id: "train", label: "Train", icon: "🚆", component: CreateTrainForm },
  ],
};

const GROUP_FILTERS = [
  { id: "all", label: "Tous" },
  { id: "terrestres", label: "Terrestres" },
  { id: "marchandises", label: "Marchandises" },
  { id: "services", label: "Services" },
  { id: "voies", label: "Maritime / Aérien" },
];

export function CreateTransportSheet({
  open,
  onOpenChange,
  onSuccess,
}: CreateTransportSheetProps) {
  const [activeTab, setActiveTab] = useState("rideshare");
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  // ─── États pour la gestion Multimédia ───
  const [images, setImages] = useState<string[]>([]);
  const [video, setVideo] = useState<string | null>(null);

  // Audio / Enregistreur de voix
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const createRoute = useMutation(api.transport.createTransportRoute);

  // Gestion de l'enregistrement vocal
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingTime(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await undefined.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      };

      mediaRecorder.start();
      setIsRecording(true);
      UIService.openToast("Enregistrement audio démarré...", "info");
    } catch (err) {
      UIService.openToast("Impossible d'accéder au microphone.", "error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Stopper toutes les pistes du flux audio pour couper le micro proprement
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
  };

  // Gestionnaires de fichiers
  const handleImageUpload = (e: string) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newUrls = filesArray.map((file) => URL.createObjectURL(file));
      setImages((prev) => [...prev, ...newUrls].slice(0, 10)); // Limité à 10
    }
  };

  const handleVideoUpload = (e: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideo(URL.createObjectURL(file));
    }
  };

  // ─── Adaptateur / Mapping de Payload (Solution A) ───
  const transformPayload = (tab: string, data: any) => {
    const status = "scheduled";

    const basePayload: any = {
      vehicleType: tab,
      currency: data.currency || "FC",
      status: status,
      description: data.description || data.precisions || data.infos || "",
    };

    switch (tab) {
      case "rideshare":
        return {
          ...basePayload,
          origin: data.origin || data.departure || "",
          destination: data.destination || data.arrival || "",
          departureTime:
            data.departureTime ||
            `${data.departureDate || ""} ${data.departureHour || ""}`.trim() ||
            "À la demande",
          seats: Number(data.seats) || Number(data.placesDispo) || 4,
          pricePerSeat: Number(data.pricePerSeat) || Number(data.price) || 0,
        };

      case "taxi": {
        const taxiPrice =
          Number(data.pricePerKm) ||
          Number(data.tarif) ||
          Number(data.price) ||
          0;
        const serviceCity = data.city || data.ville || "Kinshasa";
        return {
          ...basePayload,
          origin: serviceCity,
          destination: "Zone urbaine",
          departureTime: data.departureTime || "À la demande",
          driverName: data.driverName || data.name || "Chauffeur",
          phone: data.phone || data.telephone || "",
          city: serviceCity,
          vehicleModel: data.vehicleModel || data.modele || "Taxi",
          vehiclePlate:
            data.vehiclePlate || data.immatriculation || data.plaque || "N/A",
          pricePerKm: taxiPrice,
          pricePerSeat: taxiPrice, // Mappé sur pricePerSeat pour affichage dans la carte standard
          seats: Number(data.seats) || Number(data.placesTotales) || 4,
        };
      }

      case "moto": {
        const motoPrice =
          Number(data.pricePerKm) ||
          Number(data.tarif) ||
          Number(data.price) ||
          0;
        const activityZone = data.zone || data.city || "Kinshasa";
        return {
          ...basePayload,
          origin: activityZone,
          destination: "Zone d'activité",
          departureTime: data.departureTime || "En service",
          driverName: data.driverName || data.name || "Conducteur Moto",
          phone: data.phone || data.telephone || "",
          city: activityZone,
          vehicleModel: data.vehicleModel || "Moto",
          vehiclePlate: data.vehiclePlate || data.plaque || "N/A",
          pricePerKm: motoPrice,
          pricePerSeat: motoPrice, // Mappé sur pricePerSeat pour affichage dans la carte standard
          seats: 1,
        };
      }

      case "bus": {
        const busOrigin = data.origin || "Départ";
        const busDestination = data.destination || "Arrivée";
        return {
          ...basePayload,
          routeName: data.routeName || `${busOrigin} - ${busDestination}`,
          schedule: data.departureTime || data.schedule || "Régulier",
          ticketPrice: Number(data.ticketPrice) || Number(data.price) || 0,
          seats:
            Number(data.seats) ||
            Number(data.places) ||
            Number(data.placesTotales) ||
            30,
          origin: busOrigin,
          destination: busDestination,
          departureTime: data.departureTime || "Régulier",
          pricePerSeat: Number(data.ticketPrice) || Number(data.price) || 0,
        };
      }

      default:
        return {
          ...basePayload,
          origin: data.origin || "Kinshasa",
          destination: data.destination || "Zone de service",
          departureTime: data.departureTime || "Non spécifié",
          seats: Number(data.seats) || 1,
          pricePerSeat: Number(data.price) || 0,
        };
    }
  };

  const handleSubmit = async (formData: any) => {
    setLoading(true);
    try {
      const payload = transformPayload(activeTab, formData);

      // Injection de la galerie d'images si l'utilisateur en a ajouté
      if (images.length > 0) {
        payload.images = images;
      }

      // Formatage du message de description en cas de présence de mémo vocal
      if (audioUrl) {
        payload.description =
          `[🎙️ Message vocal de présentation inclus] ${payload.description || ""}`.trim();
      }

      await createRoute(payload);
      UIService.openToast("Trajet publié avec succès !", "success");

      // Reset des médias
      setImages([]);
      setVideo(null);
      setAudioUrl(null);

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Erreur Convex :", error);
      const message =
        error?.message || "Erreur lors de la publication. Veuillez réessayer.";
      UIService.openToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTabs = () => {
    if (filterGroup === "all") {
      return Object.values(TRANSPORT_CATEGORIES).flat();
    }
    return (
      TRANSPORT_CATEGORIES[filterGroup as keyof typeof TRANSPORT_CATEGORIES] ||
      []
    );
  };

  const filteredTabs = getFilteredTabs();
  const CurrentForm =
    filteredTabs.find((t) => t.id === activeTab)?.component ||
    CreateRideShareForm;

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
            <Pressable
              onPress={() => onOpenChange(false)}
              className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5"
            >
              <ArrowLeft size={18} className="text-white" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-white text-xl font-black">Transport</Text>
              <Text className="text-white/40 text-xs font-medium">
                Choisissez votre catégorie de transport
              </Text>
            </View>
            <Pressable
              onPress={() => onOpenChange(false)}
              className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5"
            >
              <X size={18} className="text-white/60" />
            </Pressable>
          </View>

          {/* Corps avec défilement */}
          <View
            className="overflow-y-auto px-5 pb-36 pt-4"
            style={{ maxHeight: "calc(92vh - 130px)" }}
          >
            {/* Filtres */}
            <View className="flex flex-wrap gap-2 mb-4">
              {GROUP_FILTERS.map((group) => (
                <Pressable
                  key={group.id}
                  onPress={() => setFilterGroup(group.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    filterGroup === group.id
                      ? "bg-violet-500/30 text-violet-300 border border-violet-400/30"
                      : "bg-white/5 text-white/50 border border-white/5 hover:bg-white/10"
                  }`}
                >
                  {group.label}
                </Pressable>
              ))}
            </View>

            {/* Onglets en cartes */}
            <View
              className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide"
              style={{  }}
            >
              {filteredTabs.map((tab) => (
                <Pressable
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    activeTab === tab.id
                      ? "bg-violet-600/20 text-violet-300 border border-violet-400/30"
                      : "bg-white/5 text-white/50 border border-white/5 hover:bg-white/10"
                  }`}
                >
                  <Text className="text-base">{tab.icon}</Text>
                  {tab.label}
                </Pressable>
              ))}
            </View>

            {/* Formulaire avec animation */}
            <AnimatePresence mode="wait">
              <View
                key={activeTab}
              >
                <CurrentForm onSubmit={handleSubmit} isLoading={loading} />
              </View>
            </AnimatePresence>

            {/* ─── PANNEAU MULTIMÉDIA EXCLUSIF (Solution A) ─── */}
            <View className="mt-8 pt-6 border-t border-white/5 space-y-6">
              <View>
                <Text className="text-xs font-black text-white/30 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles size={12} className="text-violet-400" />
                  Options de confiance (Multimédia)
                </Text>
                <Text className="text-[10px] text-white/40 mt-1">
                  Les annonces avec photos et mémos vocaux reçoivent jusqu'à 4
                  fois plus de sollicitations.
                </Text>
              </View>

              {/* 1. SECTION PHOTOS (Jusqu'à 10) */}
              <View className="space-y-3">
                <Text className="text-[10px] font-bold text-white/60 block">
                  📸 Galerie Photos (Facultatif)
                </Text>

                <View className="gap-2">
                  {images.map((url, i) => (
                    <View
                      key={i}
                      className="relative aspect-square rounded-xl overflow-hidden border border-white/5 bg-white/5"
                    >
                      <Image
                       
                       
                        className="w-full h-full object-cover"
                       source={{ uri: url }} accessibilityLabel="Aperçu"/>
                      <Pressable
                        onPress={() =>
                          setImages((prev) =>
                            prev.filter((_, idx) => idx !== i),
                          )
                        }
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center"
                      >
                        <X size={10} className="text-white/80" />
                      </Pressable>
                    </View>
                  ))}

                  {images.length < 10 && (
                    <Text className="aspect-square rounded-xl border border-dashed border-white/10 bg-white/[0.01] flex flex-col items-center justify-center gap-1">
                      <Camera size={18} className="text-white/40" />
                      <Text className="text-[9px] text-white/30 font-bold">
                        {images.length}/10
                      </Text>
                      <TextInput
                       
                       
                        multiple
                        onChangeText={handleImageUpload}
                        className="hidden"
                      />
                    </Text>
                  )}
                </View>
              </View>

              <View className="gap-3 pt-1">
                {/* 2. SECTION VIDÉO */}
                <View className="space-y-2">
                  <Text className="text-[10px] font-bold text-white/60 block">
                    🎥 Clip Vidéo (30s max)
                  </Text>
                  {video ? (
                    <View className="relative h-24 rounded-xl overflow-hidden border border-white/5 bg-black/40 flex items-center justify-center">
                      <Video size={20} className="text-violet-400" />
                      <Text className="absolute bottom-1 left-2 text-[8px] text-white/40 font-mono">
                        Vidéo ajoutée
                      </Text>
                      <Pressable
                        onPress={() => setVideo(null)}
                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center"
                      >
                        <X size={10} className="text-white/80" />
                      </Pressable>
                    </View>
                  ) : (
                    <Text className="h-24 rounded-xl border border-dashed border-white/10 bg-white/[0.01] flex flex-col items-center justify-center gap-1">
                      <Video size={18} className="text-white/40" />
                      <Text className="text-[9px] text-white/30 font-bold">
                        Ajouter un clip
                      </Text>
                      <TextInput
                       
                       
                        onChangeText={handleVideoUpload}
                        className="hidden"
                      />
                    </Text>
                  )}
                </View>

                {/* 3. SECTION MÉMO VOCAL (TRÈS PRATIQUE / CONTEXTE LOCAL RDC) */}
                <View className="space-y-2">
                  <Text className="text-[10px] font-bold text-white/60 block">
                    🎙️ Message Vocal de présentation
                  </Text>

                  {audioUrl ? (
                    <View className="relative h-24 rounded-xl border border-white/5 bg-white/5 p-3 flex flex-col justify-between">
                      <View className="flex items-center gap-2">
                        <View className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                          <Volume2 size={12} />
                        </View>
                        <Text className="text-[9px] text-emerald-400 font-bold">
                          Prêt à l'envoi
                        </Text>
                      </View>
                      <View
                        src={audioUrl}
                        controls
                        className="w-full h-6 scale-90 -mx-3"
                      />
                      <Pressable
                        onPress={() => setAudioUrl(null)}
                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center"
                      >
                        <X size={10} className="text-white/80" />
                      </Pressable>
                    </View>
                  ) : isRecording ? (
                    <View className="h-24 rounded-xl border border-red-500/20 bg-red-500/5 p-3 flex flex-col justify-between items-center text-center">
                      <Text className="text-[9px] text-red-400 font-black animate-pulse flex items-center gap-1">
                        ● ENREGISTREMENT ({recordingTime}s)
                      </Text>
                      {/* Onde de voix simulée */}
                      <View className="flex gap-0.5 items-end h-6">
                        {[0.2, 0.8, 0.4, 0.9, 0.6, 0.1, 0.7, 0.4, 0.9, 0.3].map(
                          (val, idx) => (
                            <View
                              key={idx}
                              className="w-1 rounded-full bg-red-400"
                            />
                          ),
                        )}
                      </View>
                      <Pressable
                        type="button"
                        onPress={stopRecording}
                        className="px-2.5 py-1 rounded-lg bg-red-500 text-[8px] font-black uppercase text-white flex items-center gap-1"
                      >
                        <Square size={8} className="fill-white" />
                        <Text>Arrêter</Text></Pressable>
                    </View>
                  ) : (
                    <Pressable
                      type="button"
                      onPress={startRecording}
                      className="w-full h-24 rounded-xl border border-dashed border-white/10 bg-white/[0.01] flex flex-col items-center justify-center gap-1"
                    >
                      <Mic size={18} className="text-white/40" />
                      <Text className="text-[9px] text-white/30 font-bold">
                        <Text>Enregistrer ma voix</Text></Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </>
  );
}
