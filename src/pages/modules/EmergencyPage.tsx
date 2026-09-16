import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";
import * as Location from "expo-location";
import {
  AlertTriangle,
  Ambulance,
  ArrowLeft,
  Car,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Flame,
  HeartPulse,
  Hospital,
  LocateFixed,
  MapPin,
  Navigation,
  Phone,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Shield,
  Siren,
  Smartphone,
  UserRound,
  Users,
  X,
} from "lucide-react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";

interface EmergencyPageProps {
  onBack: () => void;
}

type EmergencyType =
  | "medical"
  | "police"
  | "fire"
  | "accident"
  | "security"
  | "child"
  | "violence"
  | "disaster"
  | "other";

type Coordinates = {
  lat: number;
  lng: number;
};

type EmergencyCenter = {
  _id: string;
  name: string;
  address?: string;
  distance?: number;
  eta?: number;
  phone?: string;
  latitude?: number;
  longitude?: number;
};

const ACCENT = "#EF4444";
const BLUE = "#3B82F6";
const GREEN = "#10B981";
const ORANGE = "#F97316";

const EMERGENCY_TYPES: Array<{
  key: EmergencyType;
  label: string;
  description: string;
  icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  color: string;
}> = [
  {
    key: "medical",
    label: "Médical",
    description: "Maladie, malaise, blessure",
    icon: HeartPulse,
    color: "#EF4444",
  },
  {
    key: "accident",
    label: "Accident",
    description: "Route, travail, chute",
    icon: Car,
    color: "#F97316",
  },
  {
    key: "police",
    label: "Police",
    description: "Danger, agression, vol",
    icon: Shield,
    color: "#3B82F6",
  },
  {
    key: "fire",
    label: "Incendie",
    description: "Feu, fumée, explosion",
    icon: Flame,
    color: "#F97316",
  },
  {
    key: "security",
    label: "Sécurité",
    description: "Menace ou situation suspecte",
    icon: Siren,
    color: "#8B5CF6",
  },
  {
    key: "child",
    label: "Enfant",
    description: "Enfant en danger ou perdu",
    icon: UserRound,
    color: "#06B6D4",
  },
  {
    key: "violence",
    label: "Violence",
    description: "Violence domestique ou agression",
    icon: Users,
    color: "#EC4899",
  },
  {
    key: "disaster",
    label: "Catastrophe",
    description: "Inondation, effondrement, danger majeur",
    icon: AlertTriangle,
    color: "#EAB308",
  },
];

function safeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

async function callNumber(phone: string) {
  const normalized = normalizePhone(phone);

  if (!normalized) {
    return;
  }

  const url = `tel:${normalized}`;

  try {
    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      Alert.alert(
        "Appel indisponible",
        "Votre appareil ne permet pas d'effectuer cet appel.",
      );
      return;
    }

    await Linking.openURL(url);
  } catch {
    Alert.alert(
      "Appel impossible",
      "Impossible d'ouvrir le service téléphonique.",
    );
  }
}

function Header({ onBack }: EmergencyPageProps) {
  return (
    <View
      className="flex-row items-center px-5 pb-4 pt-4"
      style={{
        backgroundColor: "rgba(2,4,18,0.98)",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.06)",
      }}
    >
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Retour"
        className="h-11 w-11 items-center justify-center rounded-2xl"
        style={({ pressed }) => ({
          backgroundColor: pressed
            ? "rgba(255,255,255,0.11)"
            : "rgba(255,255,255,0.055)",
          transform: [{ scale: pressed ? 0.94 : 1 }],
        })}
      >
        <ArrowLeft size={19} color="#FFFFFF" strokeWidth={2.3} />
      </Pressable>

      <View className="ml-3 flex-1">
        <Text className="text-[18px] font-black text-white">Urgences</Text>

        <Text className="mt-0.5 text-[11px] text-white/35">
          Alerter · Localiser · Secourir
        </Text>
      </View>

      <View
        className="h-10 w-10 items-center justify-center rounded-2xl"
        style={{
          backgroundColor: "rgba(239,68,68,0.12)",
          borderWidth: 1,
          borderColor: "rgba(239,68,68,0.22)",
        }}
      >
        <Siren size={18} color="#F87171" strokeWidth={2} />
      </View>
    </View>
  );
}

function CriticalBanner({ onEmergency }: { onEmergency: () => void }) {
  return (
    <View
      className="mx-5 mt-5 overflow-hidden rounded-[28px] p-5"
      style={{
        backgroundColor: "rgba(239,68,68,0.085)",
        borderWidth: 1,
        borderColor: "rgba(239,68,68,0.22)",
      }}
    >
      <View className="flex-row items-start">
        <View
          className="h-12 w-12 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: "rgba(239,68,68,0.16)",
          }}
        >
          <AlertTriangle size={24} color="#F87171" strokeWidth={2} />
        </View>

        <View className="ml-3 flex-1">
          <Text className="text-[17px] font-black text-white">
            Situation urgente ?
          </Text>

          <Text className="mt-1 text-[11px] leading-4 text-white/40">
            Reste calme. Identifie le type d'urgence et utilise le service réel
            disponible à proximité.
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onEmergency}
        accessibilityRole="button"
        className="mt-4 flex-row items-center justify-center rounded-2xl py-3.5"
        style={({ pressed }) => ({
          opacity: pressed ? 0.78 : 1,
          backgroundColor: "#EF4444",
        })}
      >
        <Siren size={17} color="#FFFFFF" strokeWidth={2.2} />

        <Text className="ml-2 text-[12px] font-black text-white">
          DÉCLARER UNE URGENCE
        </Text>
      </Pressable>
    </View>
  );
}

function EmergencyTypeCard({
  item,
  onPress,
}: {
  item: (typeof EMERGENCY_TYPES)[number];
  onPress: () => void;
}) {
  const Icon = item.icon;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.label}: ${item.description}`}
      className="w-[48%] rounded-[22px] p-4"
      style={({ pressed }) => ({
        opacity: pressed ? 0.76 : 1,
        backgroundColor: "rgba(255,255,255,0.035)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.065)",
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      <View
        className="h-11 w-11 items-center justify-center rounded-2xl"
        style={{
          backgroundColor: `${item.color}15`,
        }}
      >
        <Icon size={20} color={item.color} strokeWidth={2} />
      </View>

      <Text className="mt-3 text-[13px] font-black text-white">
        {item.label}
      </Text>

      <Text className="mt-1 text-[10px] leading-4 text-white/30">
        {item.description}
      </Text>

      <View className="mt-3 flex-row items-center">
        <Text
          className="text-[9px] font-bold"
          style={{
            color: item.color,
          }}
        >
          Ouvrir
        </Text>

        <ChevronRight
          size={12}
          color={item.color}
          style={{
            marginLeft: 2,
          }}
        />
      </View>
    </Pressable>
  );
}

function LocationStatus({
  position,
  loading,
  error,
  onRetry,
}: {
  position: Coordinates | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <View
      className="mx-5 mt-5 flex-row items-center rounded-2xl px-4 py-3"
      style={{
        backgroundColor: position
          ? "rgba(16,185,129,0.065)"
          : "rgba(255,255,255,0.035)",
        borderWidth: 1,
        borderColor: position
          ? "rgba(16,185,129,0.14)"
          : "rgba(255,255,255,0.06)",
      }}
    >
      <View
        className="h-9 w-9 items-center justify-center rounded-xl"
        style={{
          backgroundColor: position
            ? "rgba(16,185,129,0.12)"
            : "rgba(255,255,255,0.055)",
        }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={GREEN} />
        ) : (
          <LocateFixed
            size={16}
            color={position ? GREEN : "rgba(255,255,255,0.45)"}
          />
        )}
      </View>

      <View className="ml-3 flex-1">
        <Text className="text-[11px] font-bold text-white">
          {loading
            ? "Localisation en cours…"
            : position
              ? "Position disponible"
              : "Localisation non disponible"}
        </Text>

        <Text className="mt-0.5 text-[9px] leading-4 text-white/30">
          {error ??
            (position
              ? "Utilisée uniquement pour rechercher les centres proches."
              : "Autorisez la localisation pour améliorer la recherche locale.")}
        </Text>
      </View>

      {!position && !loading ? (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Réessayer la localisation"
          className="h-8 w-8 items-center justify-center rounded-xl"
          style={{
            backgroundColor: "rgba(255,255,255,0.06)",
          }}
        >
          <RefreshCw size={14} color="rgba(255,255,255,0.55)" />
        </Pressable>
      ) : null}
    </View>
  );
}

function CenterCard({ center }: { center: EmergencyCenter }) {
  const phone = center.phone?.trim() || null;

  const distance = safeNumber(center.distance);
  const eta = safeNumber(center.eta);

  const openDirections = async () => {
    if (center.latitude == null || center.longitude == null) {
      return;
    }

    const url =
      Platform.OS === "ios"
        ? `http://maps.apple.com/?ll=${center.latitude},${center.longitude}`
        : `geo:${center.latitude},${center.longitude}?q=${center.latitude},${center.longitude}`;

    try {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      }
    } catch {
      // Aucun fallback inventé.
    }
  };

  return (
    <View
      className="rounded-[22px] p-4"
      style={{
        backgroundColor: "rgba(255,255,255,0.035)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.07)",
      }}
    >
      <View className="flex-row items-start">
        <View
          className="h-11 w-11 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: "rgba(239,68,68,0.11)",
          }}
        >
          <Hospital size={20} color="#F87171" strokeWidth={2} />
        </View>

        <View className="ml-3 flex-1">
          <Text numberOfLines={2} className="text-[13px] font-black text-white">
            {center.name}
          </Text>

          {center.address ? (
            <View className="mt-1 flex-row items-start">
              <MapPin size={11} color="rgba(255,255,255,0.3)" />

              <Text className="ml-1 flex-1 text-[10px] leading-4 text-white/30">
                {center.address}
              </Text>
            </View>
          ) : null}

          <View className="mt-2 flex-row flex-wrap">
            {distance !== null ? (
              <View className="mr-3 flex-row items-center">
                <Navigation size={11} color="rgba(255,255,255,0.35)" />

                <Text className="ml-1 text-[9px] text-white/35">
                  {distance.toFixed(1)} km
                </Text>
              </View>
            ) : null}

            {eta !== null ? (
              <View className="flex-row items-center">
                <Clock3 size={11} color="rgba(255,255,255,0.35)" />

                <Text className="ml-1 text-[9px] text-white/35">{eta} min</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <View className="mt-4 flex-row gap-2">
        {phone ? (
          <Pressable
            onPress={() => void callNumber(phone)}
            accessibilityRole="button"
            className="flex-1 flex-row items-center justify-center rounded-xl py-2.5"
            style={{
              backgroundColor: "rgba(239,68,68,0.12)",
              borderWidth: 1,
              borderColor: "rgba(239,68,68,0.18)",
            }}
          >
            <Phone size={13} color="#F87171" />

            <Text className="ml-1.5 text-[10px] font-black text-red-300">
              Appeler
            </Text>
          </Pressable>
        ) : null}

        {center.latitude != null && center.longitude != null ? (
          <Pressable
            onPress={() => void openDirections()}
            accessibilityRole="button"
            className="flex-1 flex-row items-center justify-center rounded-xl py-2.5"
            style={{
              backgroundColor: "rgba(255,255,255,0.055)",
            }}
          >
            <Navigation size={13} color="rgba(255,255,255,0.55)" />

            <Text className="ml-1.5 text-[10px] font-bold text-white/55">
              Itinéraire
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function NearbyCenters({ position }: { position: Coordinates | null }) {
  const centers = useQuery(
    api.health.getNearbyEmergencyCenters,
    position
      ? {
          lat: position.lat,
          lng: position.lng,
        }
      : "skip",
  );

  if (!position) {
    return (
      <EmptyBlock
        icon={<LocateFixed size={23} color="rgba(255,255,255,0.35)" />}
        title="Localisation nécessaire"
        description="Activez la localisation pour rechercher les centres d'urgence disponibles à proximité."
      />
    );
  }

  if (centers === undefined) {
    return (
      <View
        className="items-center rounded-[24px] py-10"
        style={{
          backgroundColor: "rgba(255,255,255,0.03)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        <ActivityIndicator size="small" color={ACCENT} />

        <Text className="mt-3 text-[11px] text-white/30">
          Recherche des centres d'urgence…
        </Text>
      </View>
    );
  }

  if (centers.length === 0) {
    return (
      <EmptyBlock
        icon={<Hospital size={23} color="rgba(255,255,255,0.35)" />}
        title="Aucun centre trouvé"
        description="Aucun centre d'urgence correspondant n'a été retourné par les données disponibles."
      />
    );
  }

  return (
    <View className="gap-3">
      {centers.map((center) => (
        <CenterCard key={center._id} center={center as EmergencyCenter} />
      ))}
    </View>
  );
}

function EmptyBlock({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <View
      className="items-center rounded-[24px] px-6 py-10"
      style={{
        backgroundColor: "rgba(255,255,255,0.03)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      <View
        className="h-14 w-14 items-center justify-center rounded-2xl"
        style={{
          backgroundColor: "rgba(255,255,255,0.045)",
        }}
      >
        {icon}
      </View>

      <Text className="mt-4 text-center text-[14px] font-black text-white">
        {title}
      </Text>

      <Text className="mt-2 max-w-[320px] text-center text-[10px] leading-4 text-white/30">
        {description}
      </Text>
    </View>
  );
}

function ShareEmergency({ position }: { position: Coordinates | null }) {
  const share = async () => {
    const message = position
      ? `J'ai besoin d'aide. Ma position approximative est : ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}.`
      : "J'ai besoin d'aide. Je suis dans une situation d'urgence.";

    try {
      await Share.share({
        message,
      });
    } catch {
      // Annulation ou indisponibilité du partage.
    }
  };

  return (
    <Pressable
      onPress={() => void share()}
      accessibilityRole="button"
      className="flex-row items-center justify-center rounded-2xl py-3.5"
      style={({ pressed }) => ({
        opacity: pressed ? 0.75 : 1,
        backgroundColor: "rgba(59,130,246,0.10)",
        borderWidth: 1,
        borderColor: "rgba(59,130,246,0.18)",
      })}
    >
      <Send size={15} color="#60A5FA" />

      <Text className="ml-2 text-[11px] font-black text-blue-300">
        Partager ma situation
      </Text>
    </Pressable>
  );
}

function EmergencyTypeModal({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: EmergencyType) => void;
}) {
  if (!visible) {
    return null;
  }

  return (
    <View
      className="absolute inset-0 justify-end"
      style={{
        backgroundColor: "rgba(0,0,0,0.72)",
        zIndex: 50,
      }}
    >
      <View
        className="rounded-t-[32px] px-5 pb-8 pt-5"
        style={{
          backgroundColor: "#080B18",
          borderTopWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <View className="flex-row items-center">
          <View className="flex-1">
            <Text className="text-[18px] font-black text-white">
              Quelle est l'urgence ?
            </Text>

            <Text className="mt-1 text-[10px] text-white/30">
              Sélectionnez la situation pour afficher le parcours approprié.
            </Text>
          </View>

          <Pressable
            onPress={onClose}
            className="h-9 w-9 items-center justify-center rounded-xl"
            style={{
              backgroundColor: "rgba(255,255,255,0.06)",
            }}
          >
            <X size={16} color="rgba(255,255,255,0.55)" />
          </Pressable>
        </View>

        <View className="mt-5 flex-row flex-wrap gap-3">
          {EMERGENCY_TYPES.map((item) => {
            const Icon = item.icon;

            return (
              <Pressable
                key={item.key}
                onPress={() => onSelect(item.key)}
                className="w-[48%] rounded-2xl p-3"
                style={({ pressed }) => ({
                  opacity: pressed ? 0.72 : 1,
                  backgroundColor: `${item.color}0D`,
                  borderWidth: 1,
                  borderColor: `${item.color}22`,
                })}
              >
                <Icon size={18} color={item.color} />

                <Text className="mt-2 text-[11px] font-black text-white">
                  {item.label}
                </Text>

                <Text className="mt-0.5 text-[9px] leading-3 text-white/30">
                  {item.description}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function EmergencyWorkspace({
  position,
  selectedType,
  onSelectType,
}: {
  position: Coordinates | null;
  selectedType: EmergencyType | null;
  onSelectType: (type: EmergencyType | null) => void;
}) {
  const selected = EMERGENCY_TYPES.find((item) => item.key === selectedType);

  return (
    <View>
      {selected ? (
        <View
          className="mx-5 mt-5 flex-row items-center rounded-2xl px-4 py-3"
          style={{
            backgroundColor: `${selected.color}0D`,
            borderWidth: 1,
            borderColor: `${selected.color}20`,
          }}
        >
          <selected.icon size={17} color={selected.color} />

          <View className="ml-3 flex-1">
            <Text className="text-[11px] font-black text-white">
              {selected.label}
            </Text>

            <Text className="mt-0.5 text-[9px] text-white/30">
              {selected.description}
            </Text>
          </View>

          <Pressable
            onPress={() => onSelectType(null)}
            className="h-7 w-7 items-center justify-center rounded-lg"
            style={{
              backgroundColor: "rgba(255,255,255,0.05)",
            }}
          >
            <X size={13} color="rgba(255,255,255,0.45)" />
          </Pressable>
        </View>
      ) : null}

      <View className="mx-5 mt-6">
        <View className="mb-3 flex-row items-center">
          <Plus size={14} color={ACCENT} />

          <Text className="ml-2 text-[11px] font-black uppercase text-white/55">
            Tous les types d'urgence
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-3">
          {EMERGENCY_TYPES.map((item) => (
            <EmergencyTypeCard
              key={item.key}
              item={item}
              onPress={() => onSelectType(item.key)}
            />
          ))}
        </View>
      </View>

      <View className="mx-5 mt-7">
        <View className="mb-3 flex-row items-center">
          <Hospital size={15} color="#F87171" />

          <Text className="ml-2 text-[11px] font-black uppercase text-white/55">
            Centres d'urgence à proximité
          </Text>
        </View>

        <NearbyCenters position={position} />
      </View>

      <View className="mx-5 mt-4">
        <ShareEmergency position={position} />
      </View>

      <View className="mx-5 mt-5 rounded-2xl p-4">
        <View className="flex-row items-start">
          <Shield size={14} color="rgba(255,255,255,0.28)" />

          <Text className="ml-2 flex-1 text-[9px] leading-4 text-white/25">
            En cas de danger immédiat, contactez directement un service
            d'urgence local dont le numéro est vérifié pour votre zone. Cette
            application ne remplace pas les services de secours.
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function EmergencyPage({ onBack }: EmergencyPageProps) {
  const [position, setPosition] = useState<Coordinates | null>(null);

  const [locationLoading, setLocationLoading] = useState(true);

  const [locationError, setLocationError] = useState<string | null>(null);

  const [selectedType, setSelectedType] = useState<EmergencyType | null>(null);

  const [modalVisible, setModalVisible] = useState(false);

  const requestLocation = useCallback(async () => {
    setLocationLoading(true);
    setLocationError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        setLocationError("Autorisation de localisation refusée.");
        setPosition(null);
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setPosition({
        lat: current.coords.latitude,
        lng: current.coords.longitude,
      });
    } catch {
      setPosition(null);
      setLocationError("La position n'a pas pu être récupérée.");
    } finally {
      setLocationLoading(false);
    }
  }, []);

  useEffect(() => {
    void requestLocation();
  }, [requestLocation]);

  const handleEmergency = () => {
    setModalVisible(true);
  };

  const handleSelectType = (type: EmergencyType) => {
    setSelectedType(type);
    setModalVisible(false);
  };

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: "#020412",
      }}
    >
      <Header onBack={onBack} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 45,
        }}
      >
        <CriticalBanner onEmergency={handleEmergency} />

        <LocationStatus
          position={position}
          loading={locationLoading}
          error={locationError}
          onRetry={() => void requestLocation()}
        />

        <EmergencyWorkspace
          position={position}
          selectedType={selectedType}
          onSelectType={setSelectedType}
        />
      </ScrollView>

      <EmergencyTypeModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelect={handleSelectType}
      />
    </View>
  );
}
