import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  type Region,
} from "react-native-maps";
import {
  Alert,
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useMemo, useRef, useState } from "react";
import * as Location from "expo-location";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Bus,
  ChevronRight,
  Filter,
  HeartPulse,
  LocateFixed,
  MapPin,
  Navigation,
  Package,
  Search,
  ShoppingBag,
  Users,
  X,
} from "lucide-react-native";

type Category =
  | "Tout"
  | "Immo"
  | "Santé"
  | "Transport"
  | "Jobs"
  | "Communauté"
  | "Livraison";

type MapMarker = {
  id: string;
  category: Exclude<Category, "Tout">;
  latitude: number;
  longitude: number;
  title: string;
  subtitle?: string;
  price?: string;
  module: string;
};

type UserLocation = {
  latitude: number;
  longitude: number;
};

type Props = {
  onBack: () => void;
  onNavigate?: (page: string) => void;
  markers?: MapMarker[];
};

const CATEGORY_COLORS: Record<Exclude<Category, "Tout">, string> = {
  Immo: "#F97316",
  Santé: "#EF4444",
  Transport: "#3B82F6",
  Jobs: "#8B5CF6",
  Communauté: "#10B981",
  Livraison: "#F59E0B",
};

const CATEGORIES: Category[] = [
  "Tout",
  "Immo",
  "Santé",
  "Transport",
  "Jobs",
  "Communauté",
  "Livraison",
];

const CATEGORY_LABELS: Record<Category, string> = {
  Tout: "Tout",
  Immo: "Immo",
  Santé: "Santé",
  Transport: "Transport",
  Jobs: "Jobs",
  Communauté: "Communauté",
  Livraison: "Livraison",
};

function CategoryIcon({
  category,
  size = 15,
  color = "#ffffff",
}: {
  category: Category;
  size?: number;
  color?: string;
}) {
  switch (category) {
    case "Immo":
      return <ShoppingBag size={size} color={color} />;

    case "Santé":
      return <HeartPulse size={size} color={color} />;

    case "Transport":
      return <Bus size={size} color={color} />;

    case "Jobs":
      return <BriefcaseBusiness size={size} color={color} />;

    case "Communauté":
      return <Users size={size} color={color} />;

    case "Livraison":
      return <Package size={size} color={color} />;

    default:
      return <MapPin size={size} color={color} />;
  }
}

function getCategoryColor(category: Category) {
  if (category === "Tout") {
    return "#6366F1";
  }

  return CATEGORY_COLORS[category];
}

function MapPinMarker({
  category,
  selected,
}: {
  category: Exclude<Category, "Tout">;
  selected: boolean;
}) {
  const color = CATEGORY_COLORS[category];

  return (
    <View className="items-center">
      <View
        className="h-11 w-11 items-center justify-center rounded-full border-2"
        style={{
          backgroundColor: color,
          borderColor: "#ffffff",
          shadowColor: color,
          shadowOpacity: selected ? 0.75 : 0.35,
          shadowRadius: selected ? 12 : 6,
          shadowOffset: {
            width: 0,
            height: 3,
          },
          elevation: selected ? 10 : 5,
        }}
      >
        <CategoryIcon category={category} size={18} color="#ffffff" />
      </View>

      <View
        className="-mt-2 h-3 w-3 rotate-45"
        style={{
          backgroundColor: color,
        }}
      />
    </View>
  );
}

function UserPositionMarker() {
  return (
    <View className="items-center justify-center">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20">
        <View
          className="h-5 w-5 rounded-full border-2 border-white bg-indigo-500"
          style={{
            shadowColor: "#6366F1",
            shadowOpacity: 0.9,
            shadowRadius: 10,
            elevation: 8,
          }}
        />
      </View>
    </View>
  );
}

function EmptyMapState({
  search,
  onClear,
}: {
  search: string;
  onClear: () => void;
}) {
  return (
    <View className="absolute inset-x-5 bottom-8 items-center rounded-3xl border border-white/10 bg-[#0b1020]/95 px-6 py-7">
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06]">
        <MapPin size={26} color="rgba(255,255,255,0.3)" />
      </View>

      <Text className="mt-4 text-center text-base font-bold text-white">
        Aucun résultat cartographique
      </Text>

      <Text className="mt-2 text-center text-sm leading-5 text-gray-400">
        {search.trim()
          ? "Aucun élément réel ne correspond à votre recherche."
          : "Aucune donnée cartographique réelle n'est disponible pour le moment."}
      </Text>

      {search.trim() ? (
        <Pressable
          onPress={onClear}
          className="mt-4 rounded-xl bg-white px-4 py-2.5 active:opacity-70"
        >
          <Text className="text-xs font-bold text-[#050812]">
            Effacer la recherche
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function SelectedMarkerSheet({
  marker,
  onClose,
  onNavigate,
  onCenter,
}: {
  marker: MapMarker;
  onClose: () => void;
  onNavigate?: (page: string) => void;
  onCenter: () => void;
}) {
  const color = CATEGORY_COLORS[marker.category];

  return (
    <View className="absolute bottom-0 left-0 right-0 rounded-t-[30px] border border-white/10 bg-[#0a0e1d] px-5 pb-8 pt-4">
      <View className="mb-4 items-center">
        <View className="h-1 w-12 rounded-full bg-white/15" />
      </View>

      <View className="flex-row items-start gap-3">
        <View
          className="h-14 w-14 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: `${color}20`,
            borderWidth: 1,
            borderColor: `${color}40`,
          }}
        >
          <CategoryIcon category={marker.category} size={22} color={color} />
        </View>

        <View className="flex-1">
          <Text numberOfLines={2} className="text-base font-bold text-white">
            {marker.title}
          </Text>

          {marker.subtitle ? (
            <Text numberOfLines={2} className="mt-1 text-sm text-gray-400">
              {marker.subtitle}
            </Text>
          ) : null}

          {marker.price ? (
            <Text className="mt-1.5 text-sm font-bold" style={{ color }}>
              {marker.price}
            </Text>
          ) : null}

          <View
            className="mt-2 self-start rounded-full px-2.5 py-1"
            style={{
              backgroundColor: `${color}18`,
            }}
          >
            <Text className="text-[10px] font-bold" style={{ color }}>
              {marker.category}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={onClose}
          className="h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] active:opacity-70"
        >
          <X size={16} color="rgba(255,255,255,0.65)" />
        </Pressable>
      </View>

      <View className="mt-5 flex-row gap-3">
        {onNavigate ? (
          <Pressable
            onPress={() => {
              onClose();
              onNavigate(marker.module);
            }}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-white py-3.5 active:opacity-80"
          >
            <Text className="text-sm font-bold text-[#050812]">Ouvrir</Text>

            <ChevronRight size={16} color="#050812" />
          </Pressable>
        ) : null}

        <Pressable
          onPress={onCenter}
          className="h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] active:opacity-70"
        >
          <Navigation size={18} color="rgba(255,255,255,0.8)" />
        </Pressable>
      </View>
    </View>
  );
}

export default function CartePage({ onBack, onNavigate, markers = [] }: Props) {
  const mapRef = useRef<MapView | null>(null);

  const [activeCategory, setActiveCategory] = useState<Category>("Tout");

  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  const [search, setSearch] = useState("");
  const [locating, setLocating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const initialRegion: Region | undefined =
    markers.length > 0
      ? {
          latitude: markers[0].latitude,
          longitude: markers[0].longitude,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }
      : undefined;

  const filteredMarkers = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();

    return markers.filter((marker) => {
      const categoryMatch =
        activeCategory === "Tout" || marker.category === activeCategory;

      if (!categoryMatch) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchable = [
        marker.title,
        marker.subtitle ?? "",
        marker.category,
        marker.module,
      ]
        .join(" ")
        .toLocaleLowerCase();

      return searchable.includes(normalizedSearch);
    });
  }, [activeCategory, markers, search]);

  const handleLocate = async () => {
    if (locating) {
      return;
    }

    try {
      setLocating(true);

      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        Alert.alert(
          "Localisation",
          "L'autorisation de localisation est nécessaire pour afficher votre position sur la carte.",
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const nextPosition: UserLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setUserLocation(nextPosition);

      mapRef.current?.animateToRegion(
        {
          ...nextPosition,
          latitudeDelta: 0.025,
          longitudeDelta: 0.025,
        },
        700,
      );
    } catch {
      Alert.alert(
        "Localisation indisponible",
        "Votre position n'a pas pu être déterminée.",
      );
    } finally {
      setLocating(false);
    }
  };

  const handleMarkerPress = (marker: MapMarker) => {
    setSelectedMarker(marker);

    mapRef.current?.animateToRegion(
      {
        latitude: marker.latitude,
        longitude: marker.longitude,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      },
      500,
    );
  };

  const handleCenterSelected = () => {
    if (!selectedMarker) {
      return;
    }

    mapRef.current?.animateToRegion(
      {
        latitude: selectedMarker.latitude,
        longitude: selectedMarker.longitude,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      },
      500,
    );
  };

  const handleResetFilters = () => {
    setActiveCategory("Tout");
    setSearch("");
    setShowFilters(false);
  };

  return (
    <View className="flex-1 bg-[#050812]">
      {/* HEADER */}
      <View className="absolute left-0 right-0 top-0 z-30 px-4 pt-12">
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={onBack}
            className="h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[#050812]/90 active:opacity-70"
          >
            <ArrowLeft size={20} color="#ffffff" />
          </Pressable>

          <View className="flex-1 overflow-hidden rounded-2xl border border-white/10 bg-[#050812]/90 px-4 py-2.5">
            <View className="flex-row items-center gap-2">
              <MapPin size={15} color="#818cf8" />

              <Text className="text-base font-bold text-white">Carte</Text>
            </View>

            <Text
              numberOfLines={1}
              className="mt-0.5 text-[10px] text-gray-500"
            >
              {filteredMarkers.length} élément
              {filteredMarkers.length === 1 ? "" : "s"} disponible
              {filteredMarkers.length === 1 ? "" : "s"}
            </Text>
          </View>

          <Pressable
            onPress={handleLocate}
            className="h-11 w-11 items-center justify-center rounded-2xl border border-indigo-400/30 bg-indigo-500/20 active:opacity-70"
          >
            {locating ? (
              <ActivityIndicator size="small" color="#818cf8" />
            ) : (
              <LocateFixed size={19} color="#818cf8" />
            )}
          </Pressable>
        </View>

        {/* SEARCH */}
        <View className="mt-3 flex-row items-center gap-2 rounded-2xl border border-white/10 bg-[#050812]/90 px-4">
          <Search size={17} color="#6b7280" />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un lieu, service, emploi..."
            placeholderTextColor="#6b7280"
            className="h-12 flex-1 text-sm text-white"
            returnKeyType="search"
          />

          {search.length > 0 ? (
            <Pressable
              onPress={() => setSearch("")}
              className="h-7 w-7 items-center justify-center rounded-full bg-white/10"
            >
              <X size={13} color="#9ca3af" />
            </Pressable>
          ) : null}
        </View>

        {/* CATEGORIES */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingVertical: 10,
            gap: 8,
          }}
        >
          {CATEGORIES.map((category) => {
            const active = activeCategory === category;

            const color = getCategoryColor(category);

            return (
              <Pressable
                key={category}
                onPress={() => {
                  setActiveCategory(category);
                  setSelectedMarker(null);
                }}
                className="flex-row items-center gap-1.5 rounded-full border px-3.5 py-2.5 active:opacity-70"
                style={{
                  backgroundColor: active ? color : "rgba(5,8,18,0.90)",
                  borderColor: active ? color : "rgba(255,255,255,0.10)",
                }}
              >
                <CategoryIcon
                  category={category}
                  size={14}
                  color={active ? "#ffffff" : "rgba(255,255,255,0.58)"}
                />

                <Text
                  className="text-xs font-semibold"
                  style={{
                    color: active ? "#ffffff" : "rgba(255,255,255,0.62)",
                  }}
                >
                  {CATEGORY_LABELS[category]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* MAP */}
      {Platform.OS === "web" ? (
        <View className="flex-1 items-center justify-center bg-[#050812] px-6">
          <View className="h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
            <MapPin size={28} color="rgba(255,255,255,0.28)" />
          </View>

          <Text className="mt-5 text-center text-base font-bold text-white">
            Carte native
          </Text>

          <Text className="mt-2 max-w-sm text-center text-sm leading-5 text-gray-400">
            Cette interface utilise la cartographie native sur Android et iOS.
          </Text>
        </View>
      ) : initialRegion ? (
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          initialRegion={initialRegion}
          className="flex-1"
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          showsScale={false}
          toolbarEnabled={false}
          rotateEnabled
          pitchEnabled
          zoomEnabled
          zoomControlEnabled={false}
          mapType="standard"
        >
          {userLocation ? (
            <Marker
              coordinate={userLocation}
              tracksViewChanges={false}
              anchor={{
                x: 0.5,
                y: 0.5,
              }}
            >
              <UserPositionMarker />
            </Marker>
          ) : null}

          {filteredMarkers.map((marker) => (
            <Marker
              key={marker.id}
              coordinate={{
                latitude: marker.latitude,
                longitude: marker.longitude,
              }}
              onPress={() => handleMarkerPress(marker)}
              tracksViewChanges={false}
              anchor={{
                x: 0.5,
                y: 0.85,
              }}
            >
              <MapPinMarker
                category={marker.category}
                selected={selectedMarker?.id === marker.id}
              />
            </Marker>
          ))}
        </MapView>
      ) : (
        <View className="flex-1 bg-[#050812]">
          <EmptyMapState search={search} onClear={() => setSearch("")} />
        </View>
      )}

      {/* EMPTY DATA OVERLAY */}
      {Platform.OS !== "web" &&
      initialRegion &&
      filteredMarkers.length === 0 ? (
        <EmptyMapState search={search} onClear={() => setSearch("")} />
      ) : null}

      {/* FILTER BUTTON */}
      <View className="absolute bottom-6 left-5 z-20">
        <Pressable
          onPress={() => setShowFilters((value) => !value)}
          className="flex-row items-center gap-2 rounded-2xl border border-white/10 bg-[#0a0e1d]/95 px-4 py-3.5 active:opacity-70"
        >
          <Filter size={16} color="#ffffff" />

          <Text className="text-xs font-bold text-white">Filtres</Text>
        </Pressable>
      </View>

      {/* FILTER PANEL */}
      {showFilters ? (
        <View className="absolute bottom-20 left-5 right-5 z-30 rounded-3xl border border-white/10 bg-[#0a0e1d]/98 p-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-sm font-bold text-white">
              Filtrer la carte
            </Text>

            <Pressable
              onPress={() => setShowFilters(false)}
              className="h-8 w-8 items-center justify-center rounded-full bg-white/10"
            >
              <X size={14} color="#ffffff" />
            </Pressable>
          </View>

          <View className="flex-row flex-wrap gap-2">
            {CATEGORIES.map((category) => {
              const active = activeCategory === category;

              const color = getCategoryColor(category);

              return (
                <Pressable
                  key={category}
                  onPress={() => {
                    setActiveCategory(category);
                    setSelectedMarker(null);
                  }}
                  className="flex-row items-center gap-1.5 rounded-xl border px-3 py-2.5"
                  style={{
                    backgroundColor: active
                      ? `${color}25`
                      : "rgba(255,255,255,0.04)",
                    borderColor: active
                      ? `${color}60`
                      : "rgba(255,255,255,0.08)",
                  }}
                >
                  <CategoryIcon
                    category={category}
                    size={14}
                    color={active ? color : "#9ca3af"}
                  />

                  <Text
                    className="text-xs font-medium"
                    style={{
                      color: active ? color : "#9ca3af",
                    }}
                  >
                    {CATEGORY_LABELS[category]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {(activeCategory !== "Tout" || search.trim()) && (
            <Pressable
              onPress={handleResetFilters}
              className="mt-3 items-center rounded-xl border border-white/10 bg-white/[0.04] py-3"
            >
              <Text className="text-xs font-semibold text-gray-300">
                Réinitialiser les filtres
              </Text>
            </Pressable>
          )}
        </View>
      ) : null}

      {/* SELECTED MARKER */}
      {selectedMarker ? (
        <SelectedMarkerSheet
          marker={selectedMarker}
          onClose={() => setSelectedMarker(null)}
          onNavigate={onNavigate}
          onCenter={handleCenterSelected}
        />
      ) : null}
    </View>
  );
}
