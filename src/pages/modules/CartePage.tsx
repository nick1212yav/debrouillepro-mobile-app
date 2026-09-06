// src/pages/modules/CartePage.tsx

import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import * as Location from "expo-location";
import {
  ArrowLeft,
  Briefcase,
  Bus,
  Filter,
  Heart,
  Home,
  Locate,
  MapPin,
  Navigation,
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
  lat: number;
  lng: number;
  title: string;
  subtitle: string;
  price?: string;
  emoji: string;
  color: string;
  module: string;
};

interface CartePageProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

const KINSHASA_REGION = {
  latitude: -4.3217,
  longitude: 15.3222,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

const CATEGORY_COLORS: Record<Exclude<Category, "Tout">, string> = {
  Immo: "#F97316",
  Santé: "#EF4444",
  Transport: "#3B82F6",
  Jobs: "#8B5CF6",
  Communauté: "#10B981",
  Livraison: "#F59E0B",
};

const MARKERS: MapMarker[] = [
  {
    id: "i1",
    category: "Immo",
    lat: -4.3217,
    lng: 15.3222,
    title: "Appartement F3",
    subtitle: "Gombe, Kinshasa",
    price: "450$/mois",
    emoji: "🏠",
    color: CATEGORY_COLORS.Immo,
    module: "immo",
  },
  {
    id: "i2",
    category: "Immo",
    lat: -4.34,
    lng: 15.33,
    title: "Villa standing",
    subtitle: "Lingwala, Kinshasa",
    price: "1200$/mois",
    emoji: "🏡",
    color: CATEGORY_COLORS.Immo,
    module: "immo",
  },
  {
    id: "i3",
    category: "Immo",
    lat: -4.295,
    lng: 15.29,
    title: "Bureau commercial",
    subtitle: "Bandalungwa",
    price: "800$/mois",
    emoji: "🏢",
    color: CATEGORY_COLORS.Immo,
    module: "immo",
  },
  {
    id: "i4",
    category: "Immo",
    lat: -4.36,
    lng: 15.35,
    title: "Studio meublé",
    subtitle: "Kalamu, Kinshasa",
    price: "250$/mois",
    emoji: "🛋️",
    color: CATEGORY_COLORS.Immo,
    module: "immo",
  },

  {
    id: "s1",
    category: "Santé",
    lat: -4.325,
    lng: 15.305,
    title: "Clinique Ngaliema",
    subtitle: "Ngaliema, Kinshasa",
    price: "Ouvert 24h",
    emoji: "🏥",
    color: CATEGORY_COLORS.Santé,
    module: "sante",
  },
  {
    id: "s2",
    category: "Santé",
    lat: -4.31,
    lng: 15.335,
    title: "Pharmacie Centrale",
    subtitle: "Gombe",
    price: "Disponible",
    emoji: "💊",
    color: CATEGORY_COLORS.Santé,
    module: "sante",
  },
  {
    id: "s3",
    category: "Santé",
    lat: -4.345,
    lng: 15.295,
    title: "Dr. Mbeki – Cardio",
    subtitle: "Kintambo",
    price: "RDV disponible",
    emoji: "👨‍⚕️",
    color: CATEGORY_COLORS.Santé,
    module: "sante",
  },

  {
    id: "t1",
    category: "Transport",
    lat: -4.318,
    lng: 15.314,
    title: "Station Taxi-bus",
    subtitle: "Rond-point Victoire",
    price: "Départ 5 min",
    emoji: "🚌",
    color: CATEGORY_COLORS.Transport,
    module: "transport",
  },
  {
    id: "t2",
    category: "Transport",
    lat: -4.331,
    lng: 15.342,
    title: "Mobi-Vélo Gombe",
    subtitle: "Gombe, Avenue Batetela",
    price: "500 FC/h",
    emoji: "🚲",
    color: CATEGORY_COLORS.Transport,
    module: "transport",
  },
  {
    id: "t3",
    category: "Transport",
    lat: -4.305,
    lng: 15.298,
    title: "Terminal bus Limite",
    subtitle: "Ngaba, Kinshasa",
    price: "Fréquent",
    emoji: "🚍",
    color: CATEGORY_COLORS.Transport,
    module: "transport",
  },

  {
    id: "j1",
    category: "Jobs",
    lat: -4.323,
    lng: 15.326,
    title: "StartupHub DRC",
    subtitle: "Gombe – 3 offres",
    price: "Recrutement ouvert",
    emoji: "💼",
    color: CATEGORY_COLORS.Jobs,
    module: "jobs",
  },
  {
    id: "j2",
    category: "Jobs",
    lat: -4.338,
    lng: 15.308,
    title: "BTP Kinshasanaise",
    subtitle: "Lingwala – Maçons",
    price: "Urgent",
    emoji: "🔨",
    color: CATEGORY_COLORS.Jobs,
    module: "jobs",
  },
  {
    id: "j3",
    category: "Jobs",
    lat: -4.35,
    lng: 15.36,
    title: "Centre IT Lemba",
    subtitle: "Lemba – Dev Web",
    price: "CDI",
    emoji: "💻",
    color: CATEGORY_COLORS.Jobs,
    module: "jobs",
  },

  {
    id: "c1",
    category: "Communauté",
    lat: -4.316,
    lng: 15.287,
    title: "Espace Jeunesse",
    subtitle: "Kintambo",
    price: "Gratuit",
    emoji: "🤝",
    color: CATEGORY_COLORS.Communauté,
    module: "community",
  },
  {
    id: "c2",
    category: "Communauté",
    lat: -4.342,
    lng: 15.318,
    title: "Marché Artisans",
    subtitle: "Matete",
    price: "Ouvert sam-dim",
    emoji: "🛖",
    color: CATEGORY_COLORS.Communauté,
    module: "community",
  },

  {
    id: "l1",
    category: "Livraison",
    lat: -4.328,
    lng: 15.338,
    title: "Coursier Express",
    subtitle: "En route – 8 min",
    price: "Disponible",
    emoji: "📦",
    color: CATEGORY_COLORS.Livraison,
    module: "livraison",
  },
  {
    id: "l2",
    category: "Livraison",
    lat: -4.307,
    lng: 15.315,
    title: "Hub Colis Nord",
    subtitle: "Barumbu – Dépôt",
    price: "Prise en charge",
    emoji: "🏪",
    color: CATEGORY_COLORS.Livraison,
    module: "livraison",
  },
];

const CATEGORIES: Category[] = [
  "Tout",
  "Immo",
  "Santé",
  "Transport",
  "Jobs",
  "Communauté",
  "Livraison",
];

const CATEGORY_ICONS = {
  Tout: MapPin,
  Immo: Home,
  Santé: Heart,
  Transport: Bus,
  Jobs: Briefcase,
  Communauté: Users,
  Livraison: ShoppingBag,
} as const;

export default function CartePage({ onBack, onNavigate }: CartePageProps) {
  const [activeCategory, setActiveCategory] = useState<Category>("Tout");

  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

  const [userPosition, setUserPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [locating, setLocating] = useState(false);

  const [mapRegion, setMapRegion] = useState(KINSHASA_REGION);

  const filteredMarkers = useMemo(() => {
    if (activeCategory === "Tout") {
      return MARKERS;
    }

    return MARKERS.filter((marker) => marker.category === activeCategory);
  }, [activeCategory]);

  const handleLocate = useCallback(async () => {
    if (locating) {
      return;
    }

    setLocating(true);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        setMapRegion(KINSHASA_REGION);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const nextPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setUserPosition(nextPosition);

      setMapRegion({
        ...nextPosition,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      });
    } catch {
      setMapRegion(KINSHASA_REGION);
    } finally {
      setLocating(false);
    }
  }, [locating]);

  const handleCategoryPress = useCallback((category: Category) => {
    setActiveCategory(category);
  }, []);

  const handleOpenModule = useCallback(() => {
    if (!selectedMarker) {
      return;
    }

    const module = selectedMarker.module;

    setSelectedMarker(null);

    onNavigate?.(module);
  }, [onNavigate, selectedMarker]);

  const handleFocusMarker = useCallback(() => {
    if (!selectedMarker) {
      return;
    }

    setMapRegion({
      latitude: selectedMarker.lat,
      longitude: selectedMarker.lng,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    });

    setSelectedMarker(null);
  }, [selectedMarker]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />

      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.pressed,
          ]}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </Pressable>

        <View style={styles.headerContent}>
          <Text style={styles.title}>Carte Interactive</Text>

          <Text style={styles.subtitle}>
            {filteredMarkers.length} points à proximité
          </Text>
        </View>

        <Pressable
          onPress={() => void handleLocate()}
          disabled={locating}
          accessibilityRole="button"
          accessibilityLabel="Trouver ma position"
          style={({ pressed }) => [
            styles.locateButton,
            pressed && !locating && styles.pressed,
            locating && styles.disabled,
          ]}
        >
          {locating ? (
            <ActivityIndicator size="small" color="#818CF8" />
          ) : (
            <Locate size={19} color="#818CF8" />
          )}
        </Pressable>
      </View>

      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          {CATEGORIES.map((category) => {
            const isActive = activeCategory === category;

            const color =
              category === "Tout" ? "#6366F1" : CATEGORY_COLORS[category];

            const Icon = CATEGORY_ICONS[category];

            return (
              <Pressable
                key={category}
                onPress={() => handleCategoryPress(category)}
                style={({ pressed }) => [
                  styles.categoryButton,
                  {
                    backgroundColor: isActive
                      ? color
                      : "rgba(255,255,255,0.06)",
                    borderColor: isActive ? color : "rgba(255,255,255,0.10)",
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Icon
                  size={14}
                  color={isActive ? "#FFFFFF" : "rgba(255,255,255,0.55)"}
                />

                <Text
                  style={[
                    styles.categoryText,
                    {
                      color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.55)",
                    },
                  ]}
                >
                  {category}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_DEFAULT}
          style={StyleSheet.absoluteFillObject}
          region={mapRegion}
          onRegionChangeComplete={setMapRegion}
          showsUserLocation={false}
          showsCompass
          showsScale={false}
          showsBuildings
          showsTraffic={false}
        >
          {userPosition && (
            <Marker
              coordinate={userPosition}
              title="Votre position"
              description="Position actuelle"
            >
              <View style={styles.userMarkerOuter}>
                <View style={styles.userMarkerInner} />
              </View>
            </Marker>
          )}

          {filteredMarkers.map((marker) => (
            <Marker
              key={marker.id}
              coordinate={{
                latitude: marker.lat,
                longitude: marker.lng,
              }}
              title={marker.title}
              description={marker.subtitle}
              onPress={() => setSelectedMarker(marker)}
            >
              <View
                style={[
                  styles.customMarker,
                  {
                    backgroundColor: marker.color,
                  },
                ]}
              >
                <Text style={styles.markerEmoji}>{marker.emoji}</Text>
              </View>
            </Marker>
          ))}
        </MapView>

        {activeCategory === "Tout" && (
          <View style={styles.legend}>
            <View style={styles.legendTitleRow}>
              <Filter size={11} color="rgba(255,255,255,0.45)" />

              <Text style={styles.legendTitle}>Légende</Text>
            </View>

            {(
              Object.entries(CATEGORY_COLORS) as [
                Exclude<Category, "Tout">,
                string,
              ][]
            ).map(([category, color]) => (
              <View key={category} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: color }]} />

                <Text style={styles.legendText}>{category}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <Modal
        visible={selectedMarker !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedMarker(null)}
      >
        <View style={styles.modalContainer}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setSelectedMarker(null)}
          />

          {selectedMarker && (
            <View style={styles.bottomSheet}>
              <View style={styles.sheetHandle} />

              <View style={styles.markerHeader}>
                <View
                  style={[
                    styles.markerEmojiContainer,
                    {
                      backgroundColor: `${selectedMarker.color}22`,
                      borderColor: `${selectedMarker.color}66`,
                    },
                  ]}
                >
                  <Text style={styles.sheetEmoji}>{selectedMarker.emoji}</Text>
                </View>

                <View style={styles.markerInfo}>
                  <Text numberOfLines={1} style={styles.markerTitle}>
                    {selectedMarker.title}
                  </Text>

                  <Text style={styles.markerSubtitle}>
                    {selectedMarker.subtitle}
                  </Text>

                  {selectedMarker.price && (
                    <Text
                      style={[
                        styles.markerPrice,
                        {
                          color: selectedMarker.color,
                        },
                      ]}
                    >
                      {selectedMarker.price}
                    </Text>
                  )}

                  <View
                    style={[
                      styles.categoryBadge,
                      {
                        backgroundColor: `${selectedMarker.color}22`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryBadgeText,
                        {
                          color: selectedMarker.color,
                        },
                      ]}
                    >
                      {selectedMarker.category}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => setSelectedMarker(null)}
                  style={({ pressed }) => [
                    styles.closeButton,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Fermer"
                >
                  <X size={17} color="rgba(255,255,255,0.65)" />
                </Pressable>
              </View>

              <View style={styles.actions}>
                <Pressable
                  onPress={handleOpenModule}
                  style={({ pressed }) => [
                    styles.openModuleButton,
                    {
                      backgroundColor: selectedMarker.color,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.openModuleButtonText}>
                    Ouvrir le module
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleFocusMarker}
                  style={({ pressed }) => [
                    styles.navigationButton,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Voir sur la carte"
                >
                  <Navigation size={19} color="rgba(255,255,255,0.75)" />
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: "#020617",
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  headerContent: {
    flex: 1,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },

  subtitle: {
    marginTop: 3,
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
  },

  locateButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.18)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.40)",
  },

  categoriesContainer: {
    backgroundColor: "#020617",
    paddingBottom: 12,
  },

  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },

  categoryButton: {
    minHeight: 36,
    paddingHorizontal: 13,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  categoryText: {
    fontSize: 12,
    fontWeight: "700",
  },

  mapContainer: {
    flex: 1,
    overflow: "hidden",
  },

  customMarker: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000000",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  markerEmoji: {
    fontSize: 18,
  },

  userMarkerOuter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.30)",
  },

  userMarkerInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#6366F1",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },

  legend: {
    position: "absolute",
    top: 14,
    right: 14,
    padding: 12,
    borderRadius: 18,
    backgroundColor: "rgba(2,6,23,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    gap: 7,
  },

  legendTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 3,
  },

  legendTitle: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    fontWeight: "800",
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },

  legendText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 10,
  },

  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  bottomSheet: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#0A0A1A",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  sheetHandle: {
    alignSelf: "center",
    width: 42,
    height: 5,
    borderRadius: 99,
    marginBottom: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  markerHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },

  markerEmojiContainer: {
    width: 58,
    height: 58,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },

  sheetEmoji: {
    fontSize: 25,
  },

  markerInfo: {
    flex: 1,
  },

  markerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  markerSubtitle: {
    marginTop: 3,
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
  },

  markerPrice: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "800",
  },

  categoryBadge: {
    alignSelf: "flex-start",
    marginTop: 7,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },

  categoryBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 22,
  },

  openModuleButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  openModuleButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  navigationButton: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },

  disabled: {
    opacity: 0.65,
  },
});
