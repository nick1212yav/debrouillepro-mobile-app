import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useEffect, useMemo, useState } from "react";
import MapView, { Circle, Marker, PROVIDER_DEFAULT } from "react-native-maps";
import * as Location from "expo-location";
import {
  ArrowLeft,
  Compass,
  Layers,
  LocateFixed,
  Map as MapIcon,
  Navigation,
  Search,
  X,
} from "lucide-react-native";

type MapTab = "Carte" | "Couches" | "Explorer";

type LayerId = "satellite" | "routes" | "terrain" | "traffic" | "population";

type PoiCategory =
  | "Tout"
  | "Hôpitaux"
  | "Écoles"
  | "Marchés"
  | "Banques"
  | "Hôtels";

type Coordinate = {
  latitude: number;
  longitude: number;
};

type MapPoint = {
  id: string;
  name: string;
  category: Exclude<PoiCategory, "Tout">;
  latitude: number;
  longitude: number;
  address?: string;
};

type Layer = {
  id: LayerId;
  label: string;
  description: string;
  active: boolean;
  available: boolean;
};

const CATEGORIES: Array<{
  id: PoiCategory;
  label: string;
}> = [
  {
    id: "Tout",
    label: "Tout",
  },
  {
    id: "Hôpitaux",
    label: "Hôpitaux",
  },
  {
    id: "Écoles",
    label: "Écoles",
  },
  {
    id: "Marchés",
    label: "Marchés",
  },
  {
    id: "Banques",
    label: "Banques",
  },
  {
    id: "Hôtels",
    label: "Hôtels",
  },
];

const INITIAL_LAYERS: Layer[] = [
  {
    id: "satellite",
    label: "Satellite",
    description: "Imagerie satellite",
    active: false,
    available: false,
  },
  {
    id: "routes",
    label: "Routes",
    description: "Réseau routier",
    active: true,
    available: true,
  },
  {
    id: "terrain",
    label: "Terrain",
    description: "Relief et altitude",
    active: false,
    available: false,
  },
  {
    id: "traffic",
    label: "Trafic",
    description: "Conditions de circulation",
    active: false,
    available: false,
  },
  {
    id: "population",
    label: "Densité",
    description: "Données démographiques",
    active: false,
    available: false,
  },
];

const DEFAULT_REGION = {
  latitude: 0,
  longitude: 20,
  latitudeDelta: 45,
  longitudeDelta: 55,
};

function isValidCoordinate(
  coordinate: Coordinate | null | undefined,
): coordinate is Coordinate {
  if (!coordinate) {
    return false;
  }

  return (
    Number.isFinite(coordinate.latitude) &&
    Number.isFinite(coordinate.longitude) &&
    coordinate.latitude >= -90 &&
    coordinate.latitude <= 90 &&
    coordinate.longitude >= -180 &&
    coordinate.longitude <= 180
  );
}

function getCategoryLabel(category: PoiCategory): string {
  return category;
}

function getCategoryIconColor(category: PoiCategory): string {
  switch (category) {
    case "Hôpitaux":
      return "#EF4444";
    case "Écoles":
      return "#818CF8";
    case "Marchés":
      return "#FB923C";
    case "Banques":
      return "#34D399";
    case "Hôtels":
      return "#A78BFA";
    default:
      return "#22D3EE";
  }
}

function formatCoordinates(coordinate: Coordinate): string {
  const lat = coordinate.latitude.toFixed(5);
  const lng = coordinate.longitude.toFixed(5);

  return `${lat}, ${lng}`;
}

function MapMarker({
  point,
  onPress,
}: {
  point: MapPoint;
  onPress: () => void;
}) {
  const color = getCategoryIconColor(point.category);

  return (
    <Marker
      coordinate={{
        latitude: point.latitude,
        longitude: point.longitude,
      }}
      title={point.name}
      description={point.address ?? getCategoryLabel(point.category)}
      onPress={onPress}
    >
      <View
        style={[
          styles.markerOuter,
          {
            borderColor: color,
          },
        ]}
      >
        <View
          style={[
            styles.markerInner,
            {
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </Marker>
  );
}

function EmptyExplorer({
  search,
  category,
}: {
  search: string;
  category: PoiCategory;
}) {
  return (
    <View style={styles.emptyExplorer}>
      <View style={styles.emptyExplorerIcon}>
        <MapIcon size={28} color="#475569" />
      </View>

      <Text style={styles.emptyExplorerTitle}>Aucun lieu disponible</Text>

      <Text style={styles.emptyExplorerText}>
        {search.trim()
          ? `Aucun résultat réel ne correspond à « ${search.trim()} ».`
          : category !== "Tout"
            ? `Aucun ${category.toLowerCase()} n'est actuellement disponible dans les données cartographiques.`
            : "Les points d'intérêt apparaîtront ici lorsqu'ils seront fournis par la source de données réelle."}
      </Text>
    </View>
  );
}

function LayerRow({ layer, onToggle }: { layer: Layer; onToggle: () => void }) {
  return (
    <View style={styles.layerRow}>
      <View style={[styles.layerIcon, layer.active && styles.layerIconActive]}>
        <Layers size={17} color={layer.active ? "#22D3EE" : "#64748B"} />
      </View>

      <View style={styles.layerContent}>
        <Text style={styles.layerTitle}>{layer.label}</Text>

        <Text style={styles.layerDescription}>{layer.description}</Text>
      </View>

      <Pressable
        onPress={layer.available ? onToggle : undefined}
        disabled={!layer.available}
        accessibilityRole="switch"
        accessibilityState={{
          checked: layer.active,
          disabled: !layer.available,
        }}
        style={[
          styles.switch,
          layer.active && styles.switchActive,
          !layer.available && styles.switchDisabled,
        ]}
      >
        <View
          style={[styles.switchThumb, layer.active && styles.switchThumbActive]}
        />
      </Pressable>
    </View>
  );
}

export default function Map3DPage({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<MapTab>("Carte");

  const [activeCategory, setActiveCategory] = useState<PoiCategory>("Tout");

  const [search, setSearch] = useState("");

  const [layers, setLayers] = useState<Layer[]>(INITIAL_LAYERS);

  const [userPosition, setUserPosition] = useState<Coordinate | null>(null);

  const [mapRegion, setMapRegion] = useState(DEFAULT_REGION);

  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);

  const [locating, setLocating] = useState(false);

  const [locationPermission, setLocationPermission] = useState<
    "unknown" | "granted" | "denied"
  >("unknown");

  /*
   * IMPORTANT :
   * Aucun POI fictif n'est injecté ici.
   *
   * Les points d'intérêt doivent provenir
   * d'une source backend réelle.
   *
   * Une fois api.map.* confirmé dans
   * convex/map.ts, cette collection doit
   * être alimentée par cette source.
   */
  const points: MapPoint[] = [];

  const filteredPoints = useMemo(() => {
    const query = search.trim().toLowerCase();

    return points.filter((point) => {
      const categoryMatch =
        activeCategory === "Tout" || point.category === activeCategory;

      if (!categoryMatch) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [point.name, point.address, point.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [points, activeCategory, search]);

  const toggleLayer = (layerId: LayerId) => {
    setLayers((current) =>
      current.map((layer) =>
        layer.id === layerId
          ? {
              ...layer,
              active: layer.available ? !layer.active : layer.active,
            }
          : layer,
      ),
    );
  };

  const locateUser = async () => {
    if (locating) {
      return;
    }

    try {
      setLocating(true);

      const servicesEnabled = await Location.hasServicesEnabledAsync();

      if (!servicesEnabled) {
        Alert.alert(
          "Localisation désactivée",
          "Activez les services de localisation de votre appareil puis réessayez.",
        );
        return;
      }

      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        setLocationPermission("denied");

        Alert.alert(
          "Permission requise",
          "La localisation est nécessaire uniquement pour centrer la carte sur votre position.",
        );

        return;
      }

      setLocationPermission("granted");

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coordinate: Coordinate = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      if (!isValidCoordinate(coordinate)) {
        throw new Error("Coordonnées GPS invalides.");
      }

      setUserPosition(coordinate);

      setMapRegion({
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      });
    } catch {
      Alert.alert(
        "Localisation",
        "Impossible de récupérer votre position actuellement.",
      );
    } finally {
      setLocating(false);
    }
  };

  const centerOnPoint = (point: MapPoint) => {
    if (
      !isValidCoordinate({
        latitude: point.latitude,
        longitude: point.longitude,
      })
    ) {
      return;
    }

    setSelectedPoint(point);

    setMapRegion({
      latitude: point.latitude,
      longitude: point.longitude,
      latitudeDelta: 0.025,
      longitudeDelta: 0.025,
    });

    setActiveTab("Carte");
  };

  const resetSearch = () => {
    setSearch("");
    setActiveCategory("Tout");
  };

  useEffect(() => {
    if (activeTab === "Explorer" && selectedPoint) {
      setSelectedPoint(null);
    }
  }, [activeTab, selectedPoint]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable
            onPress={onBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <ArrowLeft size={18} color="#FFFFFF" />
          </Pressable>

          <View style={styles.titleBlock}>
            <Text style={styles.title}>Carte</Text>

            <Text style={styles.subtitle}>
              Explorer · Localiser · Comprendre
            </Text>
          </View>

          <Pressable
            onPress={locateUser}
            disabled={locating}
            style={[
              styles.locationButton,
              locating && styles.locationButtonLoading,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Me localiser"
          >
            {locating ? (
              <ActivityIndicator size="small" color="#22D3EE" />
            ) : (
              <LocateFixed size={17} color="#22D3EE" />
            )}
          </Pressable>
        </View>

        <View style={styles.tabs}>
          {(["Carte", "Couches", "Explorer"] as MapTab[]).map((tab) => {
            const active = activeTab === tab;

            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {activeTab === "Carte" ? (
        <View style={styles.mapContainer}>
          <View style={styles.searchContainer}>
            <Search size={15} color="#64748B" />

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher un lieu…"
              placeholderTextColor="#475569"
              style={styles.searchInput}
              autoCorrect={false}
              returnKeyType="search"
            />

            {search ? (
              <Pressable onPress={resetSearch}>
                <X size={15} color="#64748B" />
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {CATEGORIES.map((category) => {
              const active = activeCategory === category.id;

              return (
                <Pressable
                  key={category.id}
                  onPress={() => setActiveCategory(category.id)}
                  style={[
                    styles.categoryChip,
                    active && styles.categoryChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      active && styles.categoryTextActive,
                    ]}
                  >
                    {category.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.mapCard}>
            <MapView
              provider={PROVIDER_DEFAULT}
              style={StyleSheet.absoluteFillObject}
              initialRegion={DEFAULT_REGION}
              region={mapRegion}
              onRegionChangeComplete={setMapRegion}
              showsUserLocation={locationPermission === "granted"}
              showsMyLocationButton={false}
              showsCompass={true}
              showsScale={true}
              rotateEnabled={true}
              pitchEnabled={true}
              toolbarEnabled={false}
              loadingEnabled={true}
              loadingBackgroundColor="#050812"
            >
              {userPosition ? (
                <Circle
                  center={{
                    latitude: userPosition.latitude,
                    longitude: userPosition.longitude,
                  }}
                  radius={80}
                  fillColor="rgba(34,211,238,0.10)"
                  strokeColor="rgba(34,211,238,0.28)"
                  strokeWidth={1}
                />
              ) : null}

              {filteredPoints.map((point) => (
                <MapMarker
                  key={point.id}
                  point={point}
                  onPress={() => setSelectedPoint(point)}
                />
              ))}
            </MapView>

            <View style={styles.mapStatus}>
              <View style={styles.statusDot} />

              <Text style={styles.mapStatusText}>
                {filteredPoints.length} point
                {filteredPoints.length !== 1 ? "s" : ""} réel
                {filteredPoints.length !== 1 ? "s" : ""}
              </Text>
            </View>

            {filteredPoints.length === 0 ? (
              <View style={styles.mapEmptyOverlay}>
                <MapIcon size={25} color="#64748B" />

                <Text style={styles.mapEmptyTitle}>
                  Données cartographiques
                </Text>

                <Text style={styles.mapEmptyText}>
                  Aucun point d'intérêt vérifié n'est disponible dans la source
                  actuellement.
                </Text>
              </View>
            ) : null}

            {selectedPoint ? (
              <View style={styles.selectedPointCard}>
                <View style={styles.selectedPointHeader}>
                  <View
                    style={[
                      styles.selectedPointIcon,
                      {
                        backgroundColor: `${getCategoryIconColor(
                          selectedPoint.category,
                        )}18`,
                      },
                    ]}
                  >
                    <Navigation
                      size={15}
                      color={getCategoryIconColor(selectedPoint.category)}
                    />
                  </View>

                  <View style={styles.selectedPointBody}>
                    <Text style={styles.selectedPointTitle} numberOfLines={1}>
                      {selectedPoint.name}
                    </Text>

                    <Text style={styles.selectedPointCategory}>
                      {selectedPoint.category}
                    </Text>
                  </View>

                  <Pressable onPress={() => setSelectedPoint(null)}>
                    <X size={15} color="#64748B" />
                  </Pressable>
                </View>

                {selectedPoint.address ? (
                  <Text style={styles.selectedPointAddress}>
                    {selectedPoint.address}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>

          <View style={styles.mapFooter}>
            <Compass size={14} color="#64748B" />

            <Text style={styles.mapFooterText}>
              Appuyez sur le bouton de localisation pour centrer la carte sur
              votre position.
            </Text>
          </View>
        </View>
      ) : null}

      {activeTab === "Couches" ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.layersContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionIntro}>
            <View style={styles.sectionIcon}>
              <Layers size={20} color="#22D3EE" />
            </View>

            <View style={styles.sectionIntroBody}>
              <Text style={styles.sectionTitle}>Couches cartographiques</Text>

              <Text style={styles.sectionText}>
                Les couches sont activées uniquement lorsqu'une source
                cartographique compatible est réellement disponible.
              </Text>
            </View>
          </View>

          <View style={styles.layerList}>
            {layers.map((layer) => (
              <LayerRow
                key={layer.id}
                layer={layer}
                onToggle={() => toggleLayer(layer.id)}
              />
            ))}
          </View>

          <View style={styles.integrityNotice}>
            <Text style={styles.integrityTitle}>Intégrité des données</Text>

            <Text style={styles.integrityText}>
              Aucun trafic, relief, satellite ou indicateur démographique n'est
              simulé. Une couche indisponible reste désactivée jusqu'à connexion
              d'une source réelle.
            </Text>
          </View>
        </ScrollView>
      ) : null}

      {activeTab === "Explorer" ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.explorerContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.explorerHeader}>
            <View>
              <Text style={styles.sectionTitle}>Explorer</Text>

              <Text style={styles.sectionText}>
                {filteredPoints.length} point
                {filteredPoints.length !== 1 ? "s" : ""} disponible
                {filteredPoints.length !== 1 ? "s" : ""}
              </Text>
            </View>

            <MapIcon size={20} color="#22D3EE" />
          </View>

          {filteredPoints.length === 0 ? (
            <EmptyExplorer search={search} category={activeCategory} />
          ) : (
            <View style={styles.pointList}>
              {filteredPoints.map((point) => {
                const color = getCategoryIconColor(point.category);

                return (
                  <Pressable
                    key={point.id}
                    onPress={() => centerOnPoint(point)}
                    style={({ pressed }) => [
                      styles.pointRow,
                      pressed && styles.pointRowPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.pointIcon,
                        {
                          backgroundColor: `${color}16`,
                          borderColor: `${color}35`,
                        },
                      ]}
                    >
                      <Navigation size={15} color={color} />
                    </View>

                    <View style={styles.pointBody}>
                      <Text style={styles.pointName} numberOfLines={1}>
                        {point.name}
                      </Text>

                      <Text
                        style={[
                          styles.pointCategory,
                          {
                            color,
                          },
                        ]}
                      >
                        {point.category}
                      </Text>

                      {point.address ? (
                        <Text style={styles.pointAddress} numberOfLines={1}>
                          {point.address}
                        </Text>
                      ) : null}
                    </View>

                    <Compass size={15} color="#475569" />
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#050812",
  },

  header: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 9,
    backgroundColor: "#050812",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.055)",
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  titleBlock: {
    flex: 1,
  },

  title: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "900",
  },

  subtitle: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 7.5,
  },

  locationButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,211,238,0.07)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.16)",
  },

  locationButtonLoading: {
    opacity: 0.75,
  },

  tabs: {
    marginTop: 10,
    padding: 3,
    borderRadius: 13,
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  tab: {
    flex: 1,
    minHeight: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  tabActive: {
    backgroundColor: "rgba(255,255,255,0.075)",
  },

  tabText: {
    color: "#64748B",
    fontSize: 8,
    fontWeight: "750",
  },

  tabTextActive: {
    color: "#F8FAFC",
  },

  mapContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },

  searchContainer: {
    minHeight: 43,
    paddingHorizontal: 11,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 8.5,
    paddingVertical: 0,
  },

  categoryRow: {
    gap: 6,
    paddingVertical: 8,
  },

  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  categoryChipActive: {
    backgroundColor: "rgba(34,211,238,0.11)",
    borderColor: "rgba(34,211,238,0.30)",
  },

  categoryText: {
    color: "#64748B",
    fontSize: 7,
    fontWeight: "800",
  },

  categoryTextActive: {
    color: "#22D3EE",
  },

  mapCard: {
    flex: 1,
    minHeight: 280,
    overflow: "hidden",
    borderRadius: 20,
    backgroundColor: "#0A0F1D",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.16)",
  },

  mapStatus: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(2,6,23,0.84)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22D3EE",
  },

  mapStatusText: {
    color: "#CBD5E1",
    fontSize: 6.5,
    fontWeight: "800",
  },

  mapEmptyOverlay: {
    position: "absolute",
    left: 24,
    right: 24,
    top: "50%",
    transform: [
      {
        translateY: -45,
      },
    ],
    padding: 16,
    alignItems: "center",
    borderRadius: 17,
    backgroundColor: "rgba(2,6,23,0.90)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  mapEmptyTitle: {
    marginTop: 8,
    color: "#CBD5E1",
    fontSize: 9,
    fontWeight: "850",
  },

  mapEmptyText: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 7,
    lineHeight: 11,
    textAlign: "center",
  },

  markerOuter: {
    width: 31,
    height: 31,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(2,6,23,0.90)",
    borderWidth: 2,
  },

  markerInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },

  selectedPointCard: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    padding: 11,
    borderRadius: 15,
    backgroundColor: "rgba(2,6,23,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  selectedPointHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  selectedPointIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  selectedPointBody: {
    flex: 1,
  },

  selectedPointTitle: {
    color: "#F8FAFC",
    fontSize: 8.5,
    fontWeight: "850",
  },

  selectedPointCategory: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 6.5,
  },

  selectedPointAddress: {
    marginTop: 7,
    color: "#64748B",
    fontSize: 7,
  },

  mapFooter: {
    paddingTop: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  mapFooterText: {
    flex: 1,
    color: "#475569",
    fontSize: 6.5,
    lineHeight: 10,
  },

  scroll: {
    flex: 1,
  },

  layersContent: {
    padding: 14,
    paddingBottom: 35,
  },

  sectionIntro: {
    padding: 13,
    borderRadius: 17,
    flexDirection: "row",
    gap: 9,
    backgroundColor: "rgba(34,211,238,0.045)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.10)",
  },

  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,211,238,0.08)",
  },

  sectionIntroBody: {
    flex: 1,
  },

  sectionTitle: {
    color: "#E2E8F0",
    fontSize: 10,
    fontWeight: "900",
  },

  sectionText: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 7.5,
    lineHeight: 12,
  },

  layerList: {
    marginTop: 11,
    gap: 7,
  },

  layerRow: {
    minHeight: 70,
    padding: 10,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.055)",
  },

  layerIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  layerIconActive: {
    backgroundColor: "rgba(34,211,238,0.08)",
  },

  layerContent: {
    flex: 1,
  },

  layerTitle: {
    color: "#CBD5E1",
    fontSize: 8.5,
    fontWeight: "850",
  },

  layerDescription: {
    marginTop: 3,
    color: "#475569",
    fontSize: 6.5,
  },

  switch: {
    width: 42,
    height: 24,
    padding: 3,
    borderRadius: 999,
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  switchActive: {
    backgroundColor: "#0891B2",
  },

  switchDisabled: {
    opacity: 0.45,
  },

  switchThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#64748B",
  },

  switchThumbActive: {
    alignSelf: "flex-end",
    backgroundColor: "#FFFFFF",
  },

  integrityNotice: {
    marginTop: 11,
    padding: 12,
    borderRadius: 15,
    backgroundColor: "rgba(99,102,241,0.04)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.09)",
  },

  integrityTitle: {
    color: "#A5B4FC",
    fontSize: 7.5,
    fontWeight: "850",
  },

  integrityText: {
    marginTop: 5,
    color: "#475569",
    fontSize: 7,
    lineHeight: 11,
  },

  explorerContent: {
    padding: 14,
    paddingBottom: 35,
  },

  explorerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  pointList: {
    gap: 7,
  },

  pointRow: {
    minHeight: 69,
    padding: 10,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.055)",
  },

  pointRowPressed: {
    opacity: 0.7,
    transform: [
      {
        scale: 0.992,
      },
    ],
  },

  pointIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  pointBody: {
    flex: 1,
  },

  pointName: {
    color: "#E2E8F0",
    fontSize: 8.5,
    fontWeight: "850",
  },

  pointCategory: {
    marginTop: 2,
    fontSize: 6.5,
    fontWeight: "800",
  },

  pointAddress: {
    marginTop: 3,
    color: "#475569",
    fontSize: 6.5,
  },

  emptyExplorer: {
    minHeight: 270,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.055)",
  },

  emptyExplorerIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  emptyExplorerTitle: {
    marginTop: 12,
    color: "#CBD5E1",
    fontSize: 10,
    fontWeight: "900",
  },

  emptyExplorerText: {
    maxWidth: 330,
    marginTop: 5,
    color: "#475569",
    fontSize: 7.5,
    lineHeight: 12,
    textAlign: "center",
  },
});
