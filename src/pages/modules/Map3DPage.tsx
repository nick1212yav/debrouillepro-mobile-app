// src/pages/modules/Map3DPage.tsx

import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  Coffee,
  Layers,
  Locate,
  MapPin,
  Navigation,
  ShoppingBag,
  Trees,
} from "lucide-react-native";

interface Map3DPageProps {
  onBack?: () => void;
}

type Tab = "Carte" | "Couches" | "Explorer";

interface PointOfInterest {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  color: string;
  icon: "building" | "shopping" | "coffee" | "nature";
}

interface MapLayer {
  id: string;
  label: string;
  active: boolean;
}

const INITIAL_REGION = {
  latitude: 5.3599517,
  longitude: -4.0082563,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const POINTS_OF_INTEREST: PointOfInterest[] = [
  {
    id: "plateau",
    name: "Plateau",
    category: "Centre d'affaires",
    lat: 5.320357,
    lng: -4.016107,
    color: "#06B6D4",
    icon: "building",
  },
  {
    id: "cocody",
    name: "Cocody",
    category: "Quartier résidentiel",
    lat: 5.360004,
    lng: -3.986777,
    color: "#8B5CF6",
    icon: "building",
  },
  {
    id: "marcory",
    name: "Marcory",
    category: "Commerce",
    lat: 5.294685,
    lng: -3.981027,
    color: "#F97316",
    icon: "shopping",
  },
  {
    id: "riviera",
    name: "Riviera",
    category: "Restaurants & loisirs",
    lat: 5.37127,
    lng: -3.970901,
    color: "#EC4899",
    icon: "coffee",
  },
  {
    id: "parc",
    name: "Zone verte",
    category: "Nature & détente",
    lat: 5.3445,
    lng: -4.035,
    color: "#22C55E",
    icon: "nature",
  },
];

const INITIAL_LAYERS: MapLayer[] = [
  {
    id: "buildings",
    label: "Bâtiments",
    active: true,
  },
  {
    id: "places",
    label: "Points d'intérêt",
    active: true,
  },
  {
    id: "transport",
    label: "Transport",
    active: false,
  },
  {
    id: "terrain",
    label: "Relief",
    active: false,
  },
];

function getPoiIcon(type: PointOfInterest["icon"], color: string) {
  const size = 15;

  switch (type) {
    case "building":
      return <Building2 size={size} color={color} />;

    case "shopping":
      return <ShoppingBag size={size} color={color} />;

    case "coffee":
      return <Coffee size={size} color={color} />;

    case "nature":
      return <Trees size={size} color={color} />;

    default:
      return <MapPin size={size} color={color} />;
  }
}

export default function Map3DPage({ onBack }: Map3DPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Carte");

  const [layers, setLayers] = useState<MapLayer[]>(INITIAL_LAYERS);

  const [selectedPoint, setSelectedPoint] = useState<PointOfInterest | null>(
    null,
  );

  const [isLocating, setIsLocating] = useState(false);

  const activePoints = useMemo(() => {
    const placesLayer = layers.find((layer) => layer.id === "places");

    if (!placesLayer?.active) {
      return [];
    }

    return POINTS_OF_INTEREST;
  }, [layers]);

  const toggleLayer = useCallback((layerId: string) => {
    setLayers((currentLayers) =>
      currentLayers.map((layer) =>
        layer.id === layerId
          ? {
              ...layer,
              active: !layer.active,
            }
          : layer,
      ),
    );
  }, []);

  const handleLocate = useCallback(() => {
    setIsLocating(true);

    // Placeholder natif sûr.
    // La géolocalisation réelle peut ensuite être branchée
    // avec expo-location si le projet l'utilise.

    setTimeout(() => {
      setIsLocating(false);
    }, 700);
  }, []);

  const handleSelectPoint = useCallback((point: PointOfInterest) => {
    setSelectedPoint(point);
    setActiveTab("Carte");
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}

      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </Pressable>

        <View style={styles.headerContent}>
          <Text style={styles.title}>Carte 3D Interactive</Text>

          <Text style={styles.subtitle}>Explorer · Mesurer · Interagir</Text>
        </View>

        <Pressable
          onPress={handleLocate}
          disabled={isLocating}
          style={({ pressed }) => [
            styles.locateButton,
            pressed && styles.pressed,
            isLocating && styles.disabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Localiser ma position"
        >
          {isLocating ? (
            <ActivityIndicator size="small" color="#06B6D4" />
          ) : (
            <Locate size={18} color="#06B6D4" />
          )}
        </Pressable>
      </View>

      {/* Tabs */}

      <View style={styles.tabsContainer}>
        {(["Carte", "Couches", "Explorer"] as Tab[]).map((tab) => {
          const active = activeTab === tab;

          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, active && styles.tabActive]}
              accessibilityRole="button"
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {tab}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Carte */}

      {activeTab === "Carte" && (
        <View style={styles.mapWrapper}>
          <MapView
            provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
            style={styles.map}
            initialRegion={INITIAL_REGION}
            mapType="hybrid"
            showsBuildings
            showsCompass
            showsScale
            showsTraffic={layers.some(
              (layer) => layer.id === "transport" && layer.active,
            )}
          >
            {activePoints.map((point) => (
              <Marker
                key={point.id}
                coordinate={{
                  latitude: point.lat,
                  longitude: point.lng,
                }}
                title={point.name}
                description={point.category}
                onPress={() => setSelectedPoint(point)}
              >
                <View
                  style={[
                    styles.marker,
                    {
                      borderColor: point.color,
                    },
                  ]}
                >
                  {getPoiIcon(point.icon, point.color)}
                </View>
              </Marker>
            ))}
          </MapView>

          <View style={styles.mapBadge}>
            <Text style={styles.mapBadgeText}>
              Abidjan · {activePoints.length} POI
            </Text>
          </View>

          {selectedPoint && (
            <View style={styles.selectedPointCard}>
              <View
                style={[
                  styles.selectedPointIcon,
                  {
                    backgroundColor: `${selectedPoint.color}22`,
                  },
                ]}
              >
                {getPoiIcon(selectedPoint.icon, selectedPoint.color)}
              </View>

              <View style={styles.selectedPointContent}>
                <Text style={styles.selectedPointName}>
                  {selectedPoint.name}
                </Text>

                <Text style={styles.selectedPointCategory}>
                  {selectedPoint.category}
                </Text>
              </View>

              <Pressable
                onPress={() => setSelectedPoint(null)}
                style={styles.closeSelectedButton}
              >
                <Text style={styles.closeSelectedText}>×</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* Couches */}

      {activeTab === "Couches" && (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionDescription}>
            Activez les couches à afficher sur la carte.
          </Text>

          {layers.map((layer) => (
            <View key={layer.id} style={styles.layerCard}>
              <View style={styles.layerIcon}>
                <Layers
                  size={18}
                  color={layer.active ? "#06B6D4" : "#9CA3AF"}
                />
              </View>

              <Text style={styles.layerLabel}>{layer.label}</Text>

              <Pressable
                onPress={() => toggleLayer(layer.id)}
                style={[styles.switch, layer.active && styles.switchActive]}
                accessibilityRole="switch"
                accessibilityState={{
                  checked: layer.active,
                }}
              >
                <View
                  style={[
                    styles.switchThumb,
                    layer.active
                      ? styles.switchThumbActive
                      : styles.switchThumbInactive,
                  ]}
                />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Explorer */}

      {activeTab === "Explorer" && (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionDescription}>
            {POINTS_OF_INTEREST.length} points d'intérêt
          </Text>

          {POINTS_OF_INTEREST.map((point) => (
            <Pressable
              key={point.id}
              onPress={() => handleSelectPoint(point)}
              style={({ pressed }) => [
                styles.poiCard,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
            >
              <View
                style={[
                  styles.poiIcon,
                  {
                    backgroundColor: `${point.color}22`,
                  },
                ]}
              >
                {getPoiIcon(point.icon, point.color)}
              </View>

              <View style={styles.poiContent}>
                <Text style={styles.poiName}>{point.name}</Text>

                <Text style={styles.poiCategory}>{point.category}</Text>
              </View>

              <ChevronRight size={18} color="#6B7280" />
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Navigation rapide */}

      {activeTab === "Carte" && (
        <View style={styles.bottomHint}>
          <Navigation size={14} color="#06B6D4" />

          <Text style={styles.bottomHintText}>
            Touchez un point pour explorer ses détails
          </Text>
        </View>
      )}
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
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 14,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  headerContent: {
    flex: 1,
    marginLeft: 12,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },

  subtitle: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 2,
  },

  locateButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(6,182,212,0.15)",
  },

  disabled: {
    opacity: 0.65,
  },

  pressed: {
    opacity: 0.72,
  },

  tabsContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 4,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
  },

  tabActive: {
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  tabText: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "600",
  },

  tabTextActive: {
    color: "#FFFFFF",
  },

  mapWrapper: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: "hidden",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(6,182,212,0.20)",
  },

  map: {
    flex: 1,
  },

  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
    borderWidth: 2,
  },

  mapBadge: {
    position: "absolute",
    left: 12,
    bottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.72)",
  },

  mapBadgeText: {
    color: "#22D3EE",
    fontSize: 11,
    fontWeight: "600",
  },

  selectedPointCard: {
    position: "absolute",
    left: 12,
    right: 12,
    top: 12,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(2,6,23,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  selectedPointIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  selectedPointContent: {
    flex: 1,
    marginLeft: 10,
  },

  selectedPointName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  selectedPointCategory: {
    color: "#9CA3AF",
    fontSize: 11,
    marginTop: 2,
  },

  closeSelectedButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  closeSelectedText: {
    color: "#FFFFFF",
    fontSize: 20,
    lineHeight: 22,
  },

  scrollContainer: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },

  sectionDescription: {
    color: "#9CA3AF",
    fontSize: 12,
    marginBottom: 12,
  },

  layerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 10,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  layerIcon: {
    width: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  layerLabel: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
  },

  switch: {
    width: 48,
    height: 26,
    padding: 3,
    borderRadius: 13,
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  switchActive: {
    backgroundColor: "#06B6D4",
  },

  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },

  switchThumbInactive: {
    alignSelf: "flex-start",
  },

  switchThumbActive: {
    alignSelf: "flex-end",
  },

  poiCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  poiIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },

  poiContent: {
    flex: 1,
    marginLeft: 12,
  },

  poiName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  poiCategory: {
    color: "#9CA3AF",
    fontSize: 11,
    marginTop: 3,
  },

  bottomHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },

  bottomHintText: {
    color: "#6B7280",
    fontSize: 11,
  },
});
