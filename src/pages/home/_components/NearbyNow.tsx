import { View, Pressable, Text, Linking } from "react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  CalendarDays,
  ChevronRight,
  Crosshair,
  LocateFixed,
  MapPin,
  MapPinned,
  Navigation,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  Utensils,
  Wrench,
} from "lucide-react-native";

/* ============================================================================
 * TYPES
 * ========================================================================== */

interface NearbyNowProps {
  onNavigate: (page: string) => void;
}

type GeoStatus =
  | "idle"
  | "loading"
  | "ready"
  | "denied"
  | "unsupported"
  | "error";

interface Coordinates {
  lat: number;
  lng: number;
}

interface GeoState {
  status: GeoStatus;
  coordinates?: Coordinates;
  city?: string;
  country?: string;
  message?: string;
}

interface NearbyItem {
  id: string;
  name: string;
  category: NearbyCategory;
  categoryLabel: string;
  distanceMeters: number;
  distanceLabel: string;
  lat: number;
  lng: number;
  address?: string;
  icon: typeof MapPin;
  accent: string;
  emoji: string;
}

type NearbyCategory =
  | "service"
  | "shop"
  | "food"
  | "health"
  | "event"
  | "job"
  | "community"
  | "place";

/* ============================================================================
 * CONFIGURATION
 * ========================================================================== */

const SEARCH_RADIUS_METERS = 2500;

const CATEGORY_CONFIG: Record<
  NearbyCategory,
  {
    label: string;
    accent: string;
    emoji: string;
    icon: typeof MapPin;
  }
> = {
  service: {
    label: "Service",
    accent: "#3B82F6",
    emoji: "🛠️",
    icon: Wrench,
  },

  shop: {
    label: "Commerce",
    accent: "#F59E0B",
    emoji: "🛍️",
    icon: ShoppingBag,
  },

  food: {
    label: "À manger",
    accent: "#F97316",
    emoji: "🍽️",
    icon: Utensils,
  },

  health: {
    label: "Santé",
    accent: "#EF4444",
    emoji: "❤️",
    icon: Crosshair,
  },

  event: {
    label: "Événement",
    accent: "#EC4899",
    emoji: "🎉",
    icon: CalendarDays,
  },

  job: {
    label: "Opportunité",
    accent: "#10B981",
    emoji: "💼",
    icon: Building2,
  },

  community: {
    label: "Communauté",
    accent: "#8B5CF6",
    emoji: "👥",
    icon: MapPinned,
  },

  place: {
    label: "À proximité",
    accent: "#06B6D4",
    emoji: "📍",
    icon: MapPin,
  },
};

/**
 * Requêtes OSM.
 *
 * On interroge plusieurs familles en UNE requête Overpass.
 * Cela évite l'ancien comportement qui mélangeait aléatoirement
 * les catégories et ne retournait qu'un seul lieu.
 */
const OVERPASS_FILTERS = [
  'node["amenity"~"restaurant|cafe|fast_food|pharmacy|clinic|hospital|bank|school|fuel"]',
  'node["shop"]',
  'node["craft"]',
  'node["office"]',
  'node["tourism"~"hotel|attraction"]',
  'node["leisure"~"sports_centre|fitness_centre|park"]',
];

/* ============================================================================
 * GEO HELPERS
 * ========================================================================== */

function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.max(1, Math.round(meters))} m`;
  }

  return `${(meters / 1000).toFixed(1)} km`;
}

/* ============================================================================
 * OSM CATEGORY RESOLUTION
 * ========================================================================== */

function resolveCategory(tags: Record<string, string>): NearbyCategory {
  const amenity = tags.amenity?.toLowerCase();
  const shop = tags.shop?.toLowerCase();
  const craft = tags.craft?.toLowerCase();
  const office = tags.office?.toLowerCase();
  const tourism = tags.tourism?.toLowerCase();
  const leisure = tags.leisure?.toLowerCase();

  if (
    amenity === "hospital" ||
    amenity === "clinic" ||
    amenity === "pharmacy"
  ) {
    return "health";
  }

  if (
    amenity === "restaurant" ||
    amenity === "cafe" ||
    amenity === "fast_food" ||
    amenity === "bar"
  ) {
    return "food";
  }

  if (shop) {
    return "shop";
  }

  if (craft || office) {
    return "service";
  }

  if (
    tourism === "hotel" ||
    tourism === "attraction" ||
    leisure === "sports_centre" ||
    leisure === "fitness_centre"
  ) {
    return "place";
  }

  if (amenity) {
    return "service";
  }

  return "place";
}

/* ============================================================================
 * REVERSE GEOCODING
 * ========================================================================== */

async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<{
  city: string;
  country: string;
}> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse` +
      `?format=json` +
      `&lat=${encodeURIComponent(lat)}` +
      `&lon=${encodeURIComponent(lng)}` +
      `&zoom=10` +
      `&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        "Accept-Language": "fr",
        "User-Agent": "DebrouillePro/1.0",
      },
    });

    if (!response.ok) {
      return {
        city: "",
        country: "",
      };
    }

    const data = (await response.json()) as {
      address?: {
        city?: string;
        town?: string;
        municipality?: string;
        village?: string;
        county?: string;
        country?: string;
      };
    };

    const address = data.address;

    return {
      city:
        address?.city ??
        address?.town ??
        address?.municipality ??
        address?.village ??
        address?.county ??
        "",
      country: address?.country ?? "",
    };
  } catch {
    return {
      city: "",
      country: "",
    };
  }
}

/* ============================================================================
 * OVERPASS
 * ========================================================================== */

async function fetchNearbyPlaces(
  coordinates: Coordinates,
): Promise<NearbyItem[]> {
  const filter = OVERPASS_FILTERS.join(";");

  const query = `
[out:json][timeout:12];
(
  ${OVERPASS_FILTERS.map(
    (item) =>
      `${item}(around:${SEARCH_RADIUS_METERS},${coordinates.lat},${coordinates.lng});`,
  ).join("\n")}
);
out center tags;
`;

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=UTF-8",
    },
    body: query,
  });

  if (!response.ok) {
    throw new Error("Impossible de récupérer les lieux proches.");
  }

  const data = (await response.json()) as {
    elements?: Array<{
      id: number;
      lat?: number;
      lon?: number;
      center?: {
        lat: number;
        lon: number;
      };
      tags?: Record<string, string>;
    }>;
  };

  const elements = data.elements ?? [];

  const normalized = elements
    .map((element): NearbyItem | null => {
      const tags = element.tags ?? {};

      const lat = element.lat ?? element.center?.lat;
      const lng = element.lon ?? element.center?.lon;

      if (typeof lat !== "number" || typeof lng !== "number") {
        return null;
      }

      const name = tags.name ?? tags["name:fr"] ?? tags.brand ?? tags.operator;

      if (!name?.trim()) {
        return null;
      }

      const category = resolveCategory(tags);
      const config = CATEGORY_CONFIG[category];

      const distanceMeters = haversineMeters(
        coordinates.lat,
        coordinates.lng,
        lat,
        lng,
      );

      const address = [tags["addr:street"], tags["addr:housenumber"]]
        .filter(Boolean)
        .join(" ");

      return {
        id: `${element.id}:${lat}:${lng}`,
        name: name.trim(),
        category,
        categoryLabel: config.label,
        distanceMeters,
        distanceLabel: formatDistance(distanceMeters),
        lat,
        lng,
        address: address || undefined,
        icon: config.icon,
        accent: config.accent,
        emoji: config.emoji,
      };
    })
    .filter((item): item is NearbyItem => item !== null);

  /**
   * Déduplication par nom.
   */
  const seen = new Set<string>();

  return normalized
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .filter((item) => {
      const key = item.name.toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .slice(0, 8);
}

/* ============================================================================
 * MAP URL
 * ========================================================================== */

function buildMapUrl(lat: number, lng: number): string {
  return (
    `https://www.openstreetmap.org/?mlat=${encodeURIComponent(lat)}` +
    `&mlon=${encodeURIComponent(lng)}` +
    `#map=18/${encodeURIComponent(lat)}/${encodeURIComponent(lng)}`
  );
}

/* ============================================================================
 * SKELETON
 * ========================================================================== */

function NearbySkeleton() {
  return (
    <View className="mx-5 mt-4">
      <View
        className="overflow-hidden rounded-[30px] p-4"
        style={{ borderWidth: 1, borderColor: "rgba(255,255,255,.07)", borderStyle: "solid" }}
      >
        <View className="flex items-center gap-3">
          <View
            className="h-11 w-11 animate-pulse rounded-2xl"
            style={{ backgroundColor: "rgba(6,182,212,.13)" }}
          />

          <View className="flex-1 space-y-2">
            <View
              className="h-3 w-36 animate-pulse rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,.08)" }}
            />

            <View
              className="h-2.5 w-52 animate-pulse rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,.05)" }}
            />
          </View>
        </View>

        <View className="mt-4 flex gap-2 overflow-hidden">
          {[0, 1, 2].map((item) => (
            <View
              key={item}
              className="h-28 min-w-[150px] animate-pulse rounded-2xl"
              style={{ backgroundColor: "rgba(255,255,255,.045)" }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

/* ============================================================================
 * PERMISSION / ERROR STATE
 * ========================================================================== */

function NearbyPermission({
  onRetry,
  message,
}: {
  onRetry: () => void;
  message: string;
}) {
  return (
    <View
      className="mx-5 mt-4"
    >
      <View
        className="relative overflow-hidden rounded-[30px] p-4"
        style={{ borderWidth: 1, borderColor: "rgba(255,255,255,.07)", borderStyle: "solid" }}
      >
        <View className="flex items-center gap-3">
          <View
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "rgba(59,130,246,.13)", borderWidth: 1, borderColor: "rgba(96,165,250,.15)", borderStyle: "solid" }}
          >
            <LocateFixed size={20} className="text-blue-300" />
          </View>

          <View className="min-w-0 flex-1">
            <Text className="text-[12px] font-bold text-white">
              Activez votre position
            </Text>

            <Text className="mt-0.5 text-[9px] leading-relaxed text-white/35">
              {message}
            </Text>
          </View>

          <Pressable
           
            onPress={onRetry}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-[9px] font-bold text-blue-200"
            style={{ backgroundColor: "rgba(59,130,246,.12)", borderWidth: 1, borderColor: "rgba(96,165,250,.15)", borderStyle: "solid" }}
          >
            <RefreshCw size={11} />
            <Text>Réessayer</Text></Pressable>
        </View>
      </View>
    </View>
  );
}

/* ============================================================================
 * COMPONENT
 * ========================================================================== */

export default function NearbyNow({ onNavigate }: NearbyNowProps) {
  const [geo, setGeo] = useState<GeoState>({
    status: "idle",
  });

  const [items, setItems] = useState<NearbyItem[]>([]);

  const [loadingPlaces, setLoadingPlaces] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const requestLocation = useCallback(() => {
    if (!("geolocation" in undefined)) {
      setGeo({
        status: "unsupported",
        message: "La géolocalisation n'est pas disponible sur cet appareil.",
      });

      return;
    }

    setGeo({
      status: "loading",
    });

    undefined.getCurrentPosition(
      async (position) => {
        const coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        const location = await reverseGeocode(coordinates.lat, coordinates.lng);

        setGeo({
          status: "ready",
          coordinates,
          city: location.city,
          country: location.country,
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGeo({
            status: "denied",
            message:
              "Votre position est nécessaire pour afficher ce qui se trouve autour de vous.",
          });

          return;
        }

        setGeo({
          status: "error",
          message: "Impossible d'obtenir votre position pour le moment.",
        });
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }, []);

  const loadNearby = useCallback(async (coordinates: Coordinates) => {
    setLoadingPlaces(true);

    try {
      const nearby = await fetchNearbyPlaces(coordinates);

      setItems(nearby);
    } catch {
      setItems([]);
    } finally {
      setLoadingPlaces(false);
      setRefreshing(false);
    }
  }, []);

  const refresh = useCallback(() => {
    if (!geo.coordinates) {
      requestLocation();
      return;
    }

    setRefreshing(true);
    loadNearby(geo.coordinates);
  }, [geo.coordinates, requestLocation, loadNearby]);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    if (geo.status !== "ready" || !geo.coordinates) {
      return;
    }

    loadNearby(geo.coordinates);
  }, [geo.status, geo.coordinates, loadNearby]);

  const visibleItems = useMemo(() => items.slice(0, 5), [items]);

  /* --------------------------------------------------------------------------
   * LOADING
   * ------------------------------------------------------------------------ */

  if (geo.status === "idle" || geo.status === "loading") {
    return <NearbySkeleton />;
  }

  /* --------------------------------------------------------------------------
   * PERMISSION / UNSUPPORTED
   * ------------------------------------------------------------------------ */

  if (
    geo.status === "denied" ||
    geo.status === "unsupported" ||
    geo.status === "error"
  ) {
    return (
      <NearbyPermission
        onRetry={requestLocation}
        message={
          geo.message ??
          "Autorisez la localisation pour découvrir les lieux proches."
        }
      />
    );
  }

  /* --------------------------------------------------------------------------
   * READY BUT LOADING PLACES
   * ------------------------------------------------------------------------ */

  if (loadingPlaces && visibleItems.length === 0) {
    return <NearbySkeleton />;
  }

  /* --------------------------------------------------------------------------
   * EMPTY
   * ------------------------------------------------------------------------ */

  if (geo.status === "ready" && visibleItems.length === 0) {
    return (
      <View
        className="mx-5 mt-4"
      >
        <View
          className="rounded-[30px] p-4"
          style={{ borderWidth: 1, borderColor: "rgba(255,255,255,.07)", borderStyle: "solid" }}
        >
          <View className="flex items-center gap-3">
            <View
              className="flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{ backgroundColor: "rgba(6,182,212,.10)" }}
            >
              <MapPin size={19} className="text-cyan-300" />
            </View>

            <View className="min-w-0 flex-1">
              <Text className="text-[12px] font-bold text-white">
                Rien de trouvé autour de vous
              </Text>

              <Text className="mt-0.5 text-[9px] text-white/35">
                {geo.city
                  ? `Nous cherchons autour de ${geo.city}.`
                  : "Aucun lieu référencé à proximité pour le moment."}
              </Text>
            </View>

            <Pressable
             
              onPress={refresh}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white/45"
              style={{ backgroundColor: "rgba(255,255,255,.05)" }}
              accessibilityLabel="Actualiser"
            >
              <RefreshCw size={13} />
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  /* --------------------------------------------------------------------------
   * MAIN
   * ------------------------------------------------------------------------ */

  return (
    <>
      <View
        className="mx-5 mt-4"
        accessibilityLabel="À proximité"
      >
        <View
          className="relative overflow-hidden rounded-[30px]"
          style={{ borderWidth: 1, borderColor: "rgba(255,255,255,.08)", borderStyle: "solid" }}
        >
          {/* ------------------------------------------------------------------
           * BACKGROUND GLOW
           * ---------------------------------------------------------------- */}

          <View
            className="absolute -right-20 -top-24 h-56 w-56 rounded-full"
            style={{  }}
          />

          <View
            className="absolute -bottom-24 left-0 h-48 w-48 rounded-full"
            style={{  }}
          />

          {/* ------------------------------------------------------------------
           * HEADER
           * ---------------------------------------------------------------- */}

          <View className="relative flex items-center gap-3 px-4 pb-3 pt-4">
            <View
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
              style={{ borderWidth: 1, borderColor: "rgba(103,232,249,.20)", borderStyle: "solid" }}
            >
              <Navigation
                size={19}
                className="text-cyan-300"
                strokeWidth={2.2}
              />

              <Text
                className="absolute inset-1 rounded-full"
                style={{ borderWidth: 1, borderColor: "rgba(103,232,249,.45)", borderStyle: "solid" }}
              />
            </View>

            <View className="min-w-0 flex-1">
              <View className="flex items-center gap-2">
                <Text className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300">
                  NearbyNow
                </Text>

                <Text
                  className="h-1.5 w-1.5 rounded-full bg-cyan-400"
                 
                />
              </View>

              <Text className="mt-0.5 truncate text-[15px] font-bold text-white">
                Autour de vous
              </Text>

              <Text className="mt-0.5 flex items-center gap-1 text-[10px] text-white/40">
                <MapPin size={9} />

                {geo.city ? geo.city : "Votre position actuelle"}

                <Text className="text-white/20">·</Text>

                <Text>rayon {SEARCH_RADIUS_METERS / 1000} km</Text>
              </Text>
            </View>

            <Pressable
             
              onPress={refresh}
              disabled={refreshing}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/35 disabled:cursor-default"
              style={{ backgroundColor: "rgba(255,255,255,.045)", borderWidth: 1, borderColor: "rgba(255,255,255,.06)", borderStyle: "solid" }}
              accessibilityLabel="Actualiser les lieux proches"
            >
              <RefreshCw
                size={13}
                className={refreshing ? "animate-spin" : ""}
              />
            </Pressable>
          </View>

          {/* ------------------------------------------------------------------
           * HORIZONTAL CARDS
           * ---------------------------------------------------------------- */}

          <View className="relative flex gap-2 overflow-x-auto px-3 pb-3 scrollbar-none">
            {visibleItems.map((item, index) => {
              const Icon = item.icon;

              return (
                <Pressable
                  key={item.id}
                  type="button"
                  onPress={() => {
                    Linking.openURL(String(buildMapUrl(item.lat, item.lng)));
                  }}
                  className="group relative min-w-[172px] max-w-[190px] flex-1 overflow-hidden rounded-[23px] p-3 text-left"
                  style={{ backgroundColor: "rgba(255,255,255,.045)", borderWidth: 1, borderColor: "rgba(255,255,255,.065)", borderStyle: "solid" }}
                >
                  {/* Top visual */}
                  <View className="flex items-center justify-between">
                    <View
                      className="flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${item.accent}16`, borderStyle: "solid" }}
                    >
                      <Icon
                        size={15}
                        style={{
                          color: item.accent,
                        }}
                      />
                    </View>

                    <Text className="text-[15px]">
                      {item.emoji}
                    </Text>
                  </View>

                  {/* Category */}
                  <View className="mt-3">
                    <Text
                      className="text-[8px] font-black uppercase tracking-[0.08em]"
                      style={{
                        color: item.accent,
                      }}
                    >
                      {item.categoryLabel}
                    </Text>
                  </View>

                  {/* Name */}
                  <Text className="mt-1 min-h-[30px] text-[12px] font-bold leading-tight text-white">
                    {item.name}
                  </Text>

                  {/* Distance */}
                  <View className="mt-2 flex items-center gap-1.5">
                    <View
                      className="flex h-5 w-5 items-center justify-center rounded-md"
                      style={{ backgroundColor: "rgba(255,255,255,.045)" }}
                    >
                      <MapPin size={9} className="text-cyan-300" />
                    </View>

                    <Text className="text-[9px] font-bold text-white/55">
                      {item.distanceLabel}
                    </Text>
                  </View>

                  {/* Address */}
                  {item.address && (
                    <Text className="mt-1 text-[8px] text-white/25">
                      {item.address}
                    </Text>
                  )}

                  {/* Footer */}
                  <View
                    className="mt-3 flex items-center justify-between border-t pt-2"
                    style={{
                      borderColor: "rgba(255,255,255,.05)",
                    }}
                  >
                    <Text className="text-[8px] font-semibold text-white/25">
                      Voir sur la carte
                    </Text>

                    <ChevronRight
                      size={11}
                      className="text-white/25"
                    />
                  </View>

                  {/* Hover */}
                  <View
                    className="absolute inset-0 opacity-0"
                    style={{  }}
                  />
                </Pressable>
              );
            })}
          </View>

          {/* ------------------------------------------------------------------
           * FOOTER
           * ---------------------------------------------------------------- */}

          <View
            className="relative flex items-center gap-2 border-t px-4 py-2.5"
            style={{
              borderColor: "rgba(255,255,255,.055)",
            }}
          >
            <View
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: "rgba(6,182,212,.09)" }}
            >
              <Search size={9} className="text-cyan-300" />
            </View>

            <Text className="min-w-0 flex-1 truncate text-[9px] font-medium text-white/30">
              {visibleItems.length} <Text>lieu</Text>{visibleItems.length > 1 ? "x" : ""} <Text>trouvé</Text>{visibleItems.length > 1 ? "s" : ""} <Text>près de vous</Text></Text>

            <Pressable
              type="button"
              onPress={() => {
                /**
                 * Si une page Nearby dédiée existe déjà,
                 * on la laisse gérer la navigation.
                 *
                 * Sinon on retombe sur l'explorateur.
                 */
                onNavigate("nearby");
              }}
              className="flex shrink-0 items-center gap-1 text-[9px] font-bold text-cyan-300"
            >
              <Text>Explorer</Text><ChevronRight size={10} />
            </Pressable>
          </View>
        </View>
      </View>
    </>
  );
}
