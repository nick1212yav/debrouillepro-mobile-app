// src/pages/home/_components/NearbyNow.tsx
import {
  View,
  Pressable,
  Text,
  ScrollView,
  Animated,
  Easing,
  StyleSheet,
  Linking,
  Platform,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type ComponentType,
} from "react";
import {
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

type NearbyCategory =
  | "service"
  | "shop"
  | "food"
  | "health"
  | "event"
  | "job"
  | "community"
  | "place";

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
  Icon: ComponentType<{ size?: number; color?: string }>;
  accent: string;
  emoji: string;
}

/* ============================================================================
 * CONFIG
 * ========================================================================== */

const isBrowser = typeof window !== "undefined";
const SEARCH_RADIUS_METERS = 2500;

const CATEGORY_CONFIG: Record<
  NearbyCategory,
  { label: string; accent: string; emoji: string; Icon: typeof MapPin }
> = {
  service: { label: "Service", accent: "#60A5FA", emoji: "🛠️", Icon: Wrench },
  shop: {
    label: "Commerce",
    accent: "#FBBF24",
    emoji: "🛍️",
    Icon: ShoppingBag,
  },
  food: { label: "À manger", accent: "#FB923C", emoji: "🍽️", Icon: Utensils },
  health: { label: "Santé", accent: "#F87171", emoji: "❤️", Icon: Crosshair },
  event: {
    label: "Événement",
    accent: "#F472B6",
    emoji: "🎉",
    Icon: CalendarDays,
  },
  job: {
    label: "Opportunité",
    accent: "#34D399",
    emoji: "💼",
    Icon: Building2,
  },
  community: {
    label: "Communauté",
    accent: "#A78BFA",
    emoji: "👥",
    Icon: MapPinned,
  },
  place: { label: "À proximité", accent: "#22D3EE", emoji: "📍", Icon: MapPin },
};

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
  if (meters < 1000) return `${Math.max(1, Math.round(meters))} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/* ============================================================================
 * CATEGORY RESOLUTION
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
  if (shop) return "shop";
  if (craft || office) return "service";
  if (
    tourism === "hotel" ||
    tourism === "attraction" ||
    leisure === "sports_centre" ||
    leisure === "fitness_centre"
  ) {
    return "place";
  }
  if (amenity) return "service";
  return "place";
}

/* ============================================================================
 * REVERSE GEOCODING
 * ========================================================================== */

async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<{ city: string; country: string }> {
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

    if (!response.ok) return { city: "", country: "" };

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
    return { city: "", country: "" };
  }
}

/* ============================================================================
 * OVERPASS
 * ========================================================================== */

async function fetchNearbyPlaces(
  coordinates: Coordinates,
): Promise<NearbyItem[]> {
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
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
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
      center?: { lat: number; lon: number };
      tags?: Record<string, string>;
    }>;
  };

  const elements = data.elements ?? [];

  const normalized = elements
    .map((element): NearbyItem | null => {
      const tags = element.tags ?? {};
      const lat = element.lat ?? element.center?.lat;
      const lng = element.lon ?? element.center?.lon;
      if (typeof lat !== "number" || typeof lng !== "number") return null;

      const name = tags.name ?? tags["name:fr"] ?? tags.brand ?? tags.operator;
      if (!name?.trim()) return null;

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
        Icon: config.Icon,
        accent: config.accent,
        emoji: config.emoji,
      };
    })
    .filter((item): item is NearbyItem => item !== null);

  const seen = new Set<string>();
  return normalized
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .filter((item) => {
      const key = item.name.toLowerCase();
      if (seen.has(key)) return false;
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
 * FADE UP
 * ========================================================================== */

function FadeUp({
  delay = 0,
  distance = 12,
  children,
  style,
}: {
  delay?: number;
  distance?: number;
  children: ReactNode;
  style?: ViewStyle;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 480,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [distance, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/* ============================================================================
 * PULSING HEADER ICON
 * ========================================================================== */

function PulsingNavIcon() {
  const pulse = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.timing(ring, {
        toValue: 1,
        duration: 2200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ).start();
  }, [pulse, ring]);

  const glowScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });
  const ringScale = ring.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.65],
  });
  const ringOpacity = ring.interpolate({
    inputRange: [0, 1],
    outputRange: [0.65, 0],
  });

  return (
    <View style={styles.headerIconWrap}>
      <Animated.View
        style={[
          styles.headerIconRing,
          { opacity: ringOpacity, transform: [{ scale: ringScale }] },
        ]}
      />
      <Animated.View
        style={[styles.headerIconHalo, { transform: [{ scale: glowScale }] }]}
      />
      <LinearGradient
        colors={["#67E8F9", "#22D3EE", "#06B6D4"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerIconGradient}
      >
        <Navigation size={19} color="#fff" strokeWidth={2.3} />
      </LinearGradient>
    </View>
  );
}

/* ============================================================================
 * REFRESH BUTTON
 * ========================================================================== */

function RefreshButton({
  onPress,
  refreshing,
}: {
  onPress: () => void;
  refreshing: boolean;
}) {
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (refreshing) {
      Animated.loop(
        Animated.timing(rotate, {
          toValue: 1,
          duration: 900,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    } else {
      rotate.setValue(0);
    }
  }, [refreshing, rotate]);

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };

  const rotation = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={refreshing}
        accessibilityLabel="Actualiser les lieux proches"
        style={({ pressed }) => [
          styles.refreshBtn,
          pressed && !refreshing && styles.pressed,
        ]}
      >
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <RefreshCw size={13} color="rgba(255,255,255,0.75)" />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================================
 * SKELETON
 * ========================================================================== */

function NearbySkeleton() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse]);

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.9],
  });

  return (
    <View style={styles.wrapper}>
      <View style={styles.skeletonCard}>
        <LinearGradient
          colors={[
            "rgba(6,182,212,0.12)",
            "rgba(15,7,32,0.6)",
            "rgba(10,6,24,0.85)",
          ]}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.borderRing} pointerEvents="none" />

        <View style={styles.skeletonHeader}>
          <Animated.View style={[styles.skeletonLogo, { opacity }]} />
          <View style={{ flex: 1, gap: 8 }}>
            <Animated.View style={[styles.skeletonLine1, { opacity }]} />
            <Animated.View style={[styles.skeletonLine2, { opacity }]} />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsRow}
        >
          {[0, 1, 2].map((i) => (
            <Animated.View
              key={i}
              style={[styles.skeletonCardMini, { opacity }]}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

/* ============================================================================
 * PERMISSION / ERROR
 * ========================================================================== */

function NearbyPermission({
  onRetry,
  message,
}: {
  onRetry: () => void;
  message: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };

  return (
    <FadeUp distance={12}>
      <View style={styles.wrapper}>
        <View style={styles.permissionCard}>
          <LinearGradient
            colors={[
              "rgba(59,130,246,0.14)",
              "rgba(15,7,32,0.6)",
              "rgba(10,6,24,0.85)",
            ]}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.permissionBorder} pointerEvents="none" />

          <View style={styles.permissionRow}>
            <LinearGradient
              colors={["rgba(96,165,250,0.28)", "rgba(59,130,246,0.08)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.permissionIcon}
            >
              <LocateFixed size={20} color="#93C5FD" />
            </LinearGradient>

            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.permissionTitle}>Activez votre position</Text>
              <Text style={styles.permissionSub}>{message}</Text>
            </View>

            <Animated.View style={{ transform: [{ scale }] }}>
              <Pressable
                onPress={onRetry}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                style={styles.permissionRetry}
              >
                <RefreshCw size={11} color="#BFDBFE" />
                <Text style={styles.permissionRetryText}>Réessayer</Text>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </View>
    </FadeUp>
  );
}

/* ============================================================================
 * NEARBY CARD
 * ========================================================================== */

function NearbyCard({
  item,
  index,
  onPress,
}: {
  item: NearbyItem;
  index: number;
  onPress: () => void;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const Icon = item.Icon;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 480,
      delay: 220 + index * 60,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.965,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateX }, { scale }],
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={styles.nearbyCard}
      >
        <LinearGradient
          colors={[`${item.accent}18`, "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Top row */}
        <View style={styles.nearbyTopRow}>
          <View
            style={[
              styles.nearbyIcon,
              {
                backgroundColor: `${item.accent}22`,
                borderColor: `${item.accent}55`,
              },
            ]}
          >
            <Icon size={15} color={item.accent} />
          </View>
          <Text style={styles.nearbyEmoji}>{item.emoji}</Text>
        </View>

        {/* Category */}
        <Text
          style={[styles.nearbyCategory, { color: item.accent }]}
          numberOfLines={1}
        >
          {item.categoryLabel.toUpperCase()}
        </Text>

        {/* Name */}
        <Text style={styles.nearbyName} numberOfLines={2}>
          {item.name}
        </Text>

        {/* Distance */}
        <View style={styles.nearbyDistanceRow}>
          <View style={styles.nearbyDistanceBadge}>
            <MapPin size={9} color="#67E8F9" />
          </View>
          <Text style={styles.nearbyDistance}>{item.distanceLabel}</Text>
        </View>

        {/* Address */}
        {item.address ? (
          <Text style={styles.nearbyAddress} numberOfLines={1}>
            {item.address}
          </Text>
        ) : null}

        {/* Footer */}
        <View style={styles.nearbyFooter}>
          <Text style={styles.nearbyFooterText}>Voir sur la carte</Text>
          <ChevronRight size={11} color="rgba(255,255,255,0.35)" />
        </View>
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================================
 * MAIN
 * ========================================================================== */

export default function NearbyNow({ onNavigate }: NearbyNowProps) {
  const [geo, setGeo] = useState<GeoState>({ status: "idle" });
  const [items, setItems] = useState<NearbyItem[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  /* ───── LOCATION ───── */
  const requestLocation = useCallback(() => {
    if (
      !isBrowser ||
      typeof navigator === "undefined" ||
      !("geolocation" in navigator)
    ) {
      setGeo({
        status: "unsupported",
        message: "La géolocalisation n'est pas disponible sur cet appareil.",
      });
      return;
    }

    setGeo({ status: "loading" });

    navigator.geolocation.getCurrentPosition(
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

  /* ───── LOAD PLACES ───── */
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

  /* ───── REFRESH ───── */
  const refresh = useCallback(() => {
    if (!geo.coordinates) {
      requestLocation();
      return;
    }
    setRefreshing(true);
    void loadNearby(geo.coordinates);
  }, [geo.coordinates, requestLocation, loadNearby]);

  /* ───── EFFECTS ───── */
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    if (geo.status !== "ready" || !geo.coordinates) return;
    void loadNearby(geo.coordinates);
  }, [geo.status, geo.coordinates, loadNearby]);

  const visibleItems = useMemo(() => items.slice(0, 5), [items]);

  /* ───── LINK ───── */
  const openMapLink = useCallback(async (lat: number, lng: number) => {
    const url = buildMapUrl(lat, lng);
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
    } catch {
      // ignore
    }
  }, []);

  /* ========================================================================
   * STATES
   * ====================================================================== */

  if (geo.status === "idle" || geo.status === "loading") {
    return <NearbySkeleton />;
  }

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

  if (loadingPlaces && visibleItems.length === 0) {
    return <NearbySkeleton />;
  }

  if (geo.status === "ready" && visibleItems.length === 0) {
    return (
      <FadeUp distance={12}>
        <View style={styles.wrapper}>
          <View style={styles.emptyCard}>
            <LinearGradient
              colors={[
                "rgba(6,182,212,0.12)",
                "rgba(15,7,32,0.6)",
                "rgba(10,6,24,0.85)",
              ]}
              locations={[0, 0.55, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.emptyBorder} pointerEvents="none" />

            <View style={styles.emptyRow}>
              <LinearGradient
                colors={["rgba(34,211,238,0.28)", "rgba(6,182,212,0.08)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emptyIcon}
              >
                <MapPin size={19} color="#67E8F9" />
              </LinearGradient>

              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.emptyTitle}>
                  Rien de trouvé autour de vous
                </Text>
                <Text style={styles.emptySub} numberOfLines={2}>
                  {geo.city
                    ? `Nous cherchons autour de ${geo.city}.`
                    : "Aucun lieu référencé à proximité pour le moment."}
                </Text>
              </View>

              <RefreshButton onPress={refresh} refreshing={refreshing} />
            </View>
          </View>
        </View>
      </FadeUp>
    );
  }

  /* ========================================================================
   * MAIN
   * ====================================================================== */

  return (
    <FadeUp distance={18}>
      <View style={styles.wrapper} accessibilityLabel="À proximité">
        <View style={styles.mainCard}>
          <LinearGradient
            colors={[
              "rgba(6,182,212,0.14)",
              "rgba(15,7,32,0.7)",
              "rgba(10,6,24,0.92)",
            ]}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.topHighlight} pointerEvents="none" />
          <View style={styles.mainBorder} pointerEvents="none" />
          <View style={styles.mainOrb1} pointerEvents="none" />
          <View style={styles.mainOrb2} pointerEvents="none" />

          {/* ───── HEADER ───── */}
          <View style={styles.header}>
            <PulsingNavIcon />

            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={styles.headerEyebrowRow}>
                <Text style={styles.headerEyebrow}>NEARBYNOW</Text>
                <View style={styles.headerDot} />
              </View>
              <Text style={styles.headerTitle}>Autour de vous</Text>
              <View style={styles.headerSubRow}>
                <MapPin size={9} color="rgba(255,255,255,0.5)" />
                <Text style={styles.headerSub} numberOfLines={1}>
                  {geo.city ? geo.city : "Votre position actuelle"}
                  <Text style={{ color: "rgba(255,255,255,0.3)" }}> · </Text>
                  rayon {SEARCH_RADIUS_METERS / 1000}km
                </Text>
              </View>
            </View>

            <RefreshButton onPress={refresh} refreshing={refreshing} />
          </View>

          {/* ───── CARDS ───── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsRow}
          >
            {visibleItems.map((item, index) => (
              <NearbyCard
                key={item.id}
                item={item}
                index={index}
                onPress={() => openMapLink(item.lat, item.lng)}
              />
            ))}
          </ScrollView>

          {/* ───── FOOTER ───── */}
          <FadeUp delay={540} distance={6}>
            <View style={styles.footer}>
              <View style={styles.footerIcon}>
                <Search size={10} color="#67E8F9" />
              </View>
              <Text style={styles.footerText} numberOfLines={1}>
                {visibleItems.length} lieu
                {visibleItems.length > 1 ? "x" : ""} trouvé
                {visibleItems.length > 1 ? "s" : ""} près de vous
              </Text>
              <Pressable
                onPress={() => onNavigate("nearby")}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.footerLink,
                  pressed && { opacity: 0.6 },
                ]}
              >
                <Text style={styles.footerLinkText}>Explorer</Text>
                <ChevronRight size={10} color="#67E8F9" />
              </Pressable>
            </View>
          </FadeUp>
        </View>
      </View>
    </FadeUp>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 20,
    marginTop: 16,
  },
  pressed: { opacity: 0.85 },

  /* ── Main card ──────────────────────────────────── */
  mainCard: {
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#0B061E",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
  },
  topHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  mainBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.16)",
  },
  mainOrb1: {
    position: "absolute",
    top: -100,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 9999,
    backgroundColor: "rgba(6,182,212,0.2)",
  },
  mainOrb2: {
    position: "absolute",
    bottom: -100,
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 9999,
    backgroundColor: "rgba(34,211,238,0.14)",
  },

  /* ── Header ─────────────────────────────────────── */
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconHalo: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(34,211,238,0.45)",
  },
  headerIconRing: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.65)",
  },
  headerIconGradient: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    shadowColor: "#06B6D4",
    shadowOpacity: 0.75,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  headerEyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    color: "#67E8F9",
  },
  headerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22D3EE",
    shadowColor: "#22D3EE",
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  headerTitle: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.4,
  },
  headerSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  headerSub: {
    flex: 1,
    fontSize: 10.5,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
  },

  /* ── Refresh btn ────────────────────────────────── */
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  /* ── Cards row ──────────────────────────────────── */
  cardsRow: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  nearbyCard: {
    minWidth: 172,
    maxWidth: 195,
    padding: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.045)",
    overflow: "hidden",
  },
  nearbyTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nearbyIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  nearbyEmoji: {
    fontSize: 16,
  },
  nearbyCategory: {
    marginTop: 12,
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  nearbyName: {
    marginTop: 5,
    minHeight: 30,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 15,
    color: "#fff",
    letterSpacing: -0.2,
  },
  nearbyDistanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  nearbyDistanceBadge: {
    width: 20,
    height: 20,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
  },
  nearbyDistance: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 0.1,
  },
  nearbyAddress: {
    marginTop: 4,
    fontSize: 9,
    color: "rgba(255,255,255,0.35)",
    fontWeight: "500",
  },
  nearbyFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  nearbyFooterText: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 0.2,
  },

  /* ── Footer ─────────────────────────────────────── */
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  footerIcon: {
    width: 22,
    height: 22,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(6,182,212,0.14)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.25)",
  },
  footerText: {
    flex: 1,
    minWidth: 0,
    fontSize: 9.5,
    fontWeight: "600",
    color: "rgba(255,255,255,0.45)",
  },
  footerLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
  },
  footerLinkText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#67E8F9",
    letterSpacing: 0.2,
  },

  /* ── Permission ─────────────────────────────────── */
  permissionCard: {
    borderRadius: 30,
    padding: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(10,6,24,0.5)",
  },
  permissionBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.15)",
  },
  permissionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  permissionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.3)",
  },
  permissionTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.3,
  },
  permissionSub: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 14,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "500",
  },
  permissionRetry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(59,130,246,0.16)",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.28)",
  },
  permissionRetryText: {
    fontSize: 10.5,
    fontWeight: "900",
    color: "#BFDBFE",
    letterSpacing: 0.2,
  },

  /* ── Empty ──────────────────────────────────────── */
  emptyCard: {
    borderRadius: 30,
    padding: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(10,6,24,0.5)",
  },
  emptyBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.15)",
  },
  emptyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.3)",
  },
  emptyTitle: {
    fontSize: 12.5,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.2,
  },
  emptySub: {
    marginTop: 4,
    fontSize: 10,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "500",
  },

  /* ── Skeleton ───────────────────────────────────── */
  skeletonCard: {
    borderRadius: 30,
    padding: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(10,6,24,0.5)",
  },
  borderRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.12)",
  },
  skeletonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  skeletonLogo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(6,182,212,0.18)",
  },
  skeletonLine1: {
    height: 12,
    width: 140,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  skeletonLine2: {
    height: 10,
    width: 200,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  skeletonCardMini: {
    minWidth: 172,
    height: 108,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
});
