// src/pages/home/_components/HomeWidget.tsx
import {
  View,
  Pressable,
  Text,
  ScrollView,
  Animated,
  Easing,
  StyleSheet,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Clock,
  ChevronRight,
  Target,
  MapPin,
  Sparkles,
  LocateOff,
  Loader2,
} from "lucide-react-native";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";

/* ============================================================================
 * MODULE META
 * ========================================================================== */

const MODULE_COLORS: Record<string, string> = {
  immo: "#818CF8",
  jobs: "#34D399",
  transport: "#60A5FA",
  sante: "#F87171",
  paiement: "#FBBF24",
  community: "#A78BFA",
  messages: "#22D3EE",
  voyages: "#2DD4BF",
  media: "#F472B6",
  agri: "#4ADE80",
  marketplace: "#FB923C",
  wallet: "#FACC15",
  fitness: "#F87171",
  apprendre: "#818CF8",
  dashboard: "#A78BFA",
  live: "#F87171",
  explorer: "#60A5FA",
  actions: "#FB923C",
  profile: "#A78BFA",
  documents: "#818CF8",
  agenda: "#34D399",
  sos: "#F87171",
  recompenses: "#FBBF24",
  parrainage: "#F472B6",
  "live-streaming": "#F87171",
  sport: "#818CF8",
  ecole: "#34D399",
  restauration: "#FB923C",
  hebergement: "#A78BFA",
};

const MODULE_LABELS: Record<string, string> = {
  immo: "Immobilier",
  jobs: "Emplois",
  transport: "Transport",
  sante: "Santé",
  paiement: "Paiement",
  community: "Communauté",
  messages: "Messages",
  voyages: "Voyages",
  media: "Médias",
  agri: "Agriculture",
  marketplace: "Marché",
  wallet: "Portefeuille",
  fitness: "Fitness",
  apprendre: "Apprendre",
  dashboard: "Dashboard",
  live: "Live",
  explorer: "Explorer",
  actions: "Actions",
  profile: "Profil",
  documents: "Documents",
  agenda: "Agenda",
  sos: "SOS",
  recompenses: "Récompenses",
  parrainage: "Parrainage",
  "live-streaming": "Streaming",
  sport: "Sport",
  ecole: "École",
  restauration: "Restauration",
  hebergement: "Hébergement",
};

function getModuleColor(key: string) {
  return MODULE_COLORS[key] ?? "#A78BFA";
}

/* ============================================================================
 * DAILY GOALS
 * ========================================================================== */

const DAILY_GOALS = [
  { label: "Complète ton profil à 100%", xp: 50, emoji: "👤" },
  { label: "Explore 3 nouveaux modules", xp: 30, emoji: "🧭" },
  { label: "Publie un contenu aujourd'hui", xp: 40, emoji: "✍️" },
  { label: "Aide un membre de ta communauté", xp: 35, emoji: "🤝" },
  { label: "Consulte la carte interactive", xp: 20, emoji: "🗺️" },
  { label: "Vérifie tes annonces du jour", xp: 25, emoji: "📢" },
  { label: "Partage une ressource utile", xp: 30, emoji: "💡" },
];

/* ============================================================================
 * GEO TYPES
 * ========================================================================== */

type GeoState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "denied" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      lat: number;
      lng: number;
      city: string;
      country: string;
    };

/* ============================================================================
 * POI CONFIG
 * ========================================================================== */

const POI_QUERIES: Array<{
  emoji: string;
  label: string;
  tag: string;
  value: string;
  category: string;
  page: string;
  color: string;
}> = [
  {
    emoji: "🍽️",
    label: "Restaurant",
    tag: "amenity",
    value: "restaurant",
    category: "Restauration",
    page: "restauration",
    color: "#FB923C",
  },
  {
    emoji: "🏥",
    label: "Clinique / Hôpital",
    tag: "amenity",
    value: "hospital",
    category: "Santé",
    page: "sante",
    color: "#F87171",
  },
  {
    emoji: "🏪",
    label: "Marché / Supermarché",
    tag: "shop",
    value: "supermarket",
    category: "Marché",
    page: "marketplace",
    color: "#34D399",
  },
  {
    emoji: "🏋️",
    label: "Salle de sport",
    tag: "leisure",
    value: "fitness_centre",
    category: "Sport",
    page: "sport",
    color: "#818CF8",
  },
  {
    emoji: "🏨",
    label: "Hôtel",
    tag: "tourism",
    value: "hotel",
    category: "Hébergement",
    page: "hebergement",
    color: "#A78BFA",
  },
  {
    emoji: "🏫",
    label: "École",
    tag: "amenity",
    value: "school",
    category: "École",
    page: "ecole",
    color: "#22D3EE",
  },
  {
    emoji: "⛽",
    label: "Station service",
    tag: "amenity",
    value: "fuel",
    category: "Transport",
    page: "transport",
    color: "#FBBF24",
  },
];

type NearbyPlace = {
  emoji: string;
  name: string;
  distance: string;
  category: string;
  page: string;
  color: string;
  meters: number;
};

/* ============================================================================
 * OVERPASS + CACHE
 * ========================================================================== */

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const OVERPASS_RADIUS = 2000;
const OVERPASS_TIMEOUT_SECONDS = 8;

const NEARBY_CACHE_TTL = 15 * 60 * 1000;
const GEO_CACHE_TTL = 60 * 60 * 1000;

const isBrowser = typeof window !== "undefined";
const memoryStore: Record<string, string> = {};

const store = {
  get(k: string): string | null {
    if (isBrowser) {
      try {
        return window.localStorage.getItem(k);
      } catch {
        return null;
      }
    }
    return memoryStore[k] ?? null;
  },
  set(k: string, v: string) {
    if (isBrowser) {
      try {
        window.localStorage.setItem(k, v);
      } catch {}
    } else {
      memoryStore[k] = v;
    }
  },
  remove(k: string) {
    if (isBrowser) {
      try {
        window.localStorage.removeItem(k);
      } catch {}
    } else {
      delete memoryStore[k];
    }
  },
};

const nearbyMemoryCache = new Map<
  string,
  { timestamp: number; place: NearbyPlace | null }
>();

const reverseGeocodeMemoryCache = new Map<
  string,
  { timestamp: number; value: { city: string; country: string } }
>();

/* ============================================================================
 * DISTANCE
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

function fmtDistance(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

function locationCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

function getPoiMeta(
  tags: Record<string, string> | undefined,
): (typeof POI_QUERIES)[number] | null {
  if (!tags) return null;
  return POI_QUERIES.find((poi) => tags[poi.tag] === poi.value) ?? null;
}

/* ============================================================================
 * OVERPASS RESPONSE TYPES
 * ========================================================================== */

type OverpassElement = {
  type?: string;
  id?: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
};

type OverpassResponse = { elements?: OverpassElement[] };

function buildOverpassQuery(lat: number, lng: number): string {
  const queryParts = POI_QUERIES.map((poi) => {
    return `nwr["${poi.tag}"="${poi.value}"](around:${OVERPASS_RADIUS},${lat},${lng});`;
  }).join("\n");

  return `
[out:json][timeout:${OVERPASS_TIMEOUT_SECONDS}];

(
  ${queryParts}
);

out center tags;
`;
}

/* ============================================================================
 * NEARBY CACHE
 * ========================================================================== */

function readNearbyCache(key: string): NearbyPlace | null | undefined {
  const memory = nearbyMemoryCache.get(key);
  if (memory) {
    if (Date.now() - memory.timestamp < NEARBY_CACHE_TTL) {
      return memory.place;
    }
    nearbyMemoryCache.delete(key);
  }

  const raw = store.get(`debrouillepro:nearby:${key}`);
  if (!raw) return undefined;

  try {
    const parsed = JSON.parse(raw) as {
      timestamp?: number;
      place?: NearbyPlace | null;
    };

    if (
      typeof parsed.timestamp !== "number" ||
      Date.now() - parsed.timestamp >= NEARBY_CACHE_TTL
    ) {
      store.remove(`debrouillepro:nearby:${key}`);
      return undefined;
    }

    const place = parsed.place ?? null;
    nearbyMemoryCache.set(key, { timestamp: parsed.timestamp, place });
    return place;
  } catch {
    return undefined;
  }
}

function writeNearbyCache(key: string, place: NearbyPlace | null): void {
  const timestamp = Date.now();
  nearbyMemoryCache.set(key, { timestamp, place });
  try {
    store.set(
      `debrouillepro:nearby:${key}`,
      JSON.stringify({ timestamp, place }),
    );
  } catch {}
}

/* ============================================================================
 * OVERPASS FETCH
 * ========================================================================== */

async function fetchOverpass(
  endpoint: string,
  query: string,
): Promise<OverpassResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      body: query,
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Overpass HTTP ${response.status}`);
    }

    return (await response.json()) as OverpassResponse;
  } finally {
    clearTimeout(timeout);
  }
}

/* ============================================================================
 * NEARBY PLACE
 * ========================================================================== */

async function fetchNearbyPlace(
  lat: number,
  lng: number,
): Promise<NearbyPlace | null> {
  const cacheKey = locationCacheKey(lat, lng);
  const cached = readNearbyCache(cacheKey);
  if (cached !== undefined) return cached;

  const query = buildOverpassQuery(lat, lng);
  let lastError: unknown = null;

  for (let i = 0; i < OVERPASS_ENDPOINTS.length; i += 1) {
    try {
      const data = await fetchOverpass(OVERPASS_ENDPOINTS[i], query);
      const candidates: NearbyPlace[] = [];

      for (const element of data.elements ?? []) {
        const meta = getPoiMeta(element.tags);
        if (!meta) continue;

        const elementLat =
          typeof element.lat === "number" ? element.lat : element.center?.lat;
        const elementLng =
          typeof element.lon === "number" ? element.lon : element.center?.lon;

        if (typeof elementLat !== "number" || typeof elementLng !== "number") {
          continue;
        }

        const distance = haversineMeters(lat, lng, elementLat, elementLng);
        const name =
          element.tags?.name ?? element.tags?.["name:fr"] ?? meta.label;

        candidates.push({
          emoji: meta.emoji,
          name,
          distance: fmtDistance(distance),
          category: meta.category,
          page: meta.page,
          color: meta.color,
          meters: distance,
        });
      }

      candidates.sort((a, b) => a.meters - b.meters);
      const result = candidates[0] ?? null;
      writeNearbyCache(cacheKey, result);
      return result;
    } catch (error) {
      lastError = error;
      continue;
    }
  }

  console.warn(
    "[HomeWidget] Impossible de récupérer les lieux proches.",
    lastError,
  );
  writeNearbyCache(cacheKey, null);
  return null;
}

/* ============================================================================
 * REVERSE GEOCODE CACHE
 * ========================================================================== */

function readReverseGeocodeCache(
  key: string,
): { city: string; country: string } | undefined {
  const memory = reverseGeocodeMemoryCache.get(key);
  if (memory) {
    if (Date.now() - memory.timestamp < GEO_CACHE_TTL) return memory.value;
    reverseGeocodeMemoryCache.delete(key);
  }

  const raw = store.get(`debrouillepro:reverse:${key}`);
  if (!raw) return undefined;

  try {
    const parsed = JSON.parse(raw) as {
      timestamp?: number;
      value?: { city?: string; country?: string };
    };

    if (
      typeof parsed.timestamp !== "number" ||
      Date.now() - parsed.timestamp >= GEO_CACHE_TTL
    ) {
      store.remove(`debrouillepro:reverse:${key}`);
      return undefined;
    }

    const value = {
      city: parsed.value?.city ?? "",
      country: parsed.value?.country ?? "",
    };
    reverseGeocodeMemoryCache.set(key, { timestamp: parsed.timestamp, value });
    return value;
  } catch {
    return undefined;
  }
}

/* ============================================================================
 * REVERSE GEOCODE
 * ========================================================================== */

async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<{ city: string; country: string }> {
  const key = locationCacheKey(lat, lng);
  const cached = readReverseGeocodeCache(key);
  if (cached) return cached;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const url =
      `https://nominatim.openstreetmap.org/reverse` +
      `?format=json` +
      `&lat=${encodeURIComponent(lat)}` +
      `&lon=${encodeURIComponent(lng)}` +
      `&zoom=10` +
      `&addressdetails=1`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "Accept-Language": "fr" },
    });

    clearTimeout(timeout);

    if (!res.ok) return { city: "", country: "" };

    const data = (await res.json()) as {
      address?: {
        city?: string;
        town?: string;
        village?: string;
        municipality?: string;
        county?: string;
        state?: string;
        country?: string;
      };
    };

    const city =
      data.address?.city ??
      data.address?.town ??
      data.address?.village ??
      data.address?.municipality ??
      data.address?.county ??
      data.address?.state ??
      "";

    const value = { city, country: data.address?.country ?? "" };
    const timestamp = Date.now();

    reverseGeocodeMemoryCache.set(key, { timestamp, value });
    try {
      store.set(
        `debrouillepro:reverse:${key}`,
        JSON.stringify({ timestamp, value }),
      );
    } catch {}

    return value;
  } catch {
    return { city: "", country: "" };
  }
}

/* ============================================================================
 * FADE UP
 * ========================================================================== */

function FadeUp({
  delay = 0,
  distance = 10,
  children,
  style,
}: {
  delay?: number;
  distance?: number;
  children: ReactNode;
  style?: any;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 420,
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
 * SPINNER
 * ========================================================================== */

function Spinner({ color = "rgba(255,255,255,0.55)" }: { color?: string }) {
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [rotate]);

  const rotation = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: rotation }] }}>
      <Loader2 size={18} color={color} />
    </Animated.View>
  );
}

/* ============================================================================
 * PROPS
 * ========================================================================== */

interface HomeWidgetProps {
  onNavigate: (page: string) => void;
}

/* ============================================================================
 * MAIN
 * ========================================================================== */

export default function HomeWidget({ onNavigate }: HomeWidgetProps) {
  const { isAuthenticated } = useConvexAuth();

  const activities = useQuery(api.activity.list, isAuthenticated ? {} : "skip");

  const [geo, setGeo] = useState<GeoState>({ status: "idle" });
  const [nearby, setNearby] = useState<NearbyPlace | null>(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  /* ───── geolocation ───── */
  useEffect(() => {
    if (!isAuthenticated) return;

    if (
      !isBrowser ||
      typeof navigator === "undefined" ||
      !("geolocation" in navigator)
    ) {
      setGeo({
        status: "error",
        message: "Géolocalisation non disponible sur cet appareil.",
      });
      return;
    }

    let cancelled = false;
    setGeo({ status: "loading" });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (cancelled) return;
        const { latitude: lat, longitude: lng } = pos.coords;
        const { city, country } = await reverseGeocode(lat, lng);
        if (cancelled) return;
        setGeo({ status: "ready", lat, lng, city, country });
      },
      (err) => {
        if (cancelled) return;
        if (err.code === err.PERMISSION_DENIED) {
          setGeo({ status: "denied" });
          return;
        }
        setGeo({
          status: "error",
          message: "Impossible d'obtenir la position.",
        });
      },
      {
        timeout: 10000,
        maximumAge: 60000,
        enableHighAccuracy: false,
      },
    );

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  /* ───── nearby place ───── */
  useEffect(() => {
    if (geo.status !== "ready") return;
    let cancelled = false;
    const { lat, lng } = geo;
    setNearbyLoading(true);

    fetchNearbyPlace(lat, lng)
      .then((result) => {
        if (cancelled) return;
        setNearby(result);
      })
      .catch(() => {
        if (cancelled) return;
        setNearby(null);
      })
      .finally(() => {
        if (cancelled) return;
        setNearbyLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    geo.status,
    geo.status === "ready" ? geo.lat : null,
    geo.status === "ready" ? geo.lng : null,
  ]);

  /* ───── retry geolocation ───── */
  const retryGeolocation = useCallback(() => {
    if (
      !isBrowser ||
      typeof navigator === "undefined" ||
      !("geolocation" in navigator)
    ) {
      return;
    }

    setGeo({ status: "loading" });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const { city, country } = await reverseGeocode(lat, lng);
        setGeo({ status: "ready", lat, lng, city, country });
      },
      () => {
        setGeo({ status: "denied" });
      },
      {
        timeout: 10000,
        maximumAge: 60000,
        enableHighAccuracy: false,
      },
    );
  }, []);

  /* ───── recent modules ───── */
  const recentModules = (() => {
    if (!activities) return [];
    const seen = new Set<string>();
    const result: string[] = [];
    for (const activity of activities) {
      if (
        activity.type === "view_module" &&
        activity.target &&
        !seen.has(activity.target)
      ) {
        seen.add(activity.target);
        result.push(activity.target);
        if (result.length >= 5) break;
      }
    }
    return result;
  })();

  /* ───── daily goal ───── */
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      86400000,
  );
  const dailyGoal = DAILY_GOALS[dayOfYear % DAILY_GOALS.length];

  /* ───── geo display ───── */
  const geoReady = geo.status === "ready";
  const cityLabel = geoReady ? geo.city : "";

  /* ========================================================================
   * RENDER
   * ====================================================================== */

  return (
    <View style={styles.root}>
      {/* ───── RECENT MODULES ───── */}
      {recentModules.length > 0 ? (
        <FadeUp delay={280} distance={10}>
          <View style={styles.sectionHeaderRow}>
            <Clock size={11} color="rgba(255,255,255,0.5)" />
            <Text style={styles.sectionEyebrow}>RÉCEMMENT VISITÉS</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentContent}
          >
            {recentModules.map((mod, i) => {
              const color = getModuleColor(mod);
              const label =
                MODULE_LABELS[mod] ??
                mod.charAt(0).toUpperCase() + mod.slice(1).replace(/-/g, " ");

              return (
                <FadeUp key={mod} delay={320 + i * 40} distance={8}>
                  <Pressable
                    onPress={() => onNavigate(mod)}
                    style={({ pressed }) => [
                      styles.recentChip,
                      {
                        backgroundColor: `${color}22`,
                        borderColor: `${color}44`,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <View
                      style={[styles.recentChipDot, { backgroundColor: color }]}
                    />
                    <Text style={styles.recentChipText}>{label}</Text>
                  </Pressable>
                </FadeUp>
              );
            })}
          </ScrollView>
        </FadeUp>
      ) : null}

      {/* ───── DAILY GOAL ───── */}
      <FadeUp delay={380} distance={10}>
        <Pressable
          onPress={() => onNavigate("dashboard")}
          style={({ pressed }) => [
            styles.dailyGoalCard,
            pressed && styles.pressed,
          ]}
        >
          <LinearGradient
            colors={[
              "rgba(52,211,153,0.16)",
              "rgba(15,7,32,0.6)",
              "rgba(10,6,24,0.85)",
            ]}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.dailyGoalBorder} pointerEvents="none" />

          <View style={styles.dailyGoalIcon}>
            <Text style={{ fontSize: 18 }}>{dailyGoal.emoji}</Text>
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.dailyGoalHeaderRow}>
              <Target size={9} color="#6EE7B7" />
              <Text style={styles.dailyGoalEyebrow}>OBJECTIF DU JOUR</Text>
            </View>
            <Text style={styles.dailyGoalTitle} numberOfLines={1}>
              {dailyGoal.label}
            </Text>
          </View>

          <View style={styles.dailyGoalRight}>
            <Text style={styles.dailyGoalXp}>+{dailyGoal.xp}XP</Text>
            <ChevronRight size={14} color="rgba(255,255,255,0.35)" />
          </View>
        </Pressable>
      </FadeUp>

      {/* ───── NEARBY ───── */}
      <FadeUp delay={480} distance={10}>
        <View style={styles.nearbyHeaderRow}>
          <MapPin size={11} color="rgba(255,255,255,0.5)" />
          <Text style={styles.sectionEyebrow}>PRÈS DE CHEZ TOI</Text>
          {cityLabel ? (
            <Text style={styles.nearbyCity} numberOfLines={1}>
              {cityLabel}
            </Text>
          ) : null}
        </View>

        {/* Loading */}
        {geo.status === "loading" || (geoReady && nearbyLoading) ? (
          <View style={styles.stateCard}>
            <Spinner />
            <Text style={styles.stateText}>Recherche en cours…</Text>
          </View>
        ) : null}

        {/* Denied */}
        {geo.status === "denied" ? (
          <Pressable
            onPress={retryGeolocation}
            style={({ pressed }) => [
              styles.deniedCard,
              pressed && styles.pressed,
            ]}
          >
            <LinearGradient
              colors={["rgba(248,113,113,0.16)", "rgba(15,7,32,0.5)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.deniedBorder} pointerEvents="none" />
            <LocateOff size={18} color="#F87171" />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.deniedTitle}>Localisation désactivée</Text>
              <Text style={styles.deniedSub}>Appuie pour réessayer</Text>
            </View>
          </Pressable>
        ) : null}

        {/* Error */}
        {geo.status === "error" ? (
          <View style={styles.stateCard}>
            <LocateOff size={18} color="rgba(255,255,255,0.4)" />
            <Text style={styles.stateText}>{geo.message}</Text>
          </View>
        ) : null}

        {/* Result */}
        {geoReady && !nearbyLoading && nearby ? (
          <FadeUp distance={8}>
            <Pressable
              onPress={() => onNavigate(nearby.page)}
              style={({ pressed }) => [
                styles.nearbyCard,
                {
                  borderColor: `${nearby.color}55`,
                },
                pressed && styles.pressed,
              ]}
            >
              <LinearGradient
                colors={[`${nearby.color}22`, "rgba(255,255,255,0)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <View
                style={[
                  styles.nearbyIcon,
                  {
                    backgroundColor: `${nearby.color}22`,
                    borderColor: `${nearby.color}55`,
                  },
                ]}
              >
                <Text style={{ fontSize: 20 }}>{nearby.emoji}</Text>
              </View>

              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.nearbyName} numberOfLines={1}>
                  {nearby.name}
                </Text>
                <View style={styles.nearbyMetaRow}>
                  <Text
                    style={[styles.nearbyCategory, { color: nearby.color }]}
                  >
                    {nearby.category}
                  </Text>
                  <Text style={styles.nearbyDot}>·</Text>
                  <Text style={styles.nearbyDistance}>{nearby.distance}</Text>
                </View>
              </View>

              <View style={styles.nearbyRight}>
                <View
                  style={[
                    styles.nearbySeePill,
                    {
                      backgroundColor: `${nearby.color}28`,
                      borderColor: `${nearby.color}55`,
                    },
                  ]}
                >
                  <Sparkles size={9} color={nearby.color} />
                  <Text
                    style={[styles.nearbySeePillText, { color: nearby.color }]}
                  >
                    Voir
                  </Text>
                </View>
                <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
              </View>
            </Pressable>
          </FadeUp>
        ) : null}

        {/* Empty */}
        {geoReady && !nearbyLoading && !nearby ? (
          <View style={styles.stateCard}>
            <MapPin size={18} color="rgba(255,255,255,0.4)" />
            <Text style={styles.stateText}>Aucun lieu trouvé à proximité.</Text>
          </View>
        ) : null}
      </FadeUp>
    </View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  root: {
    marginTop: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  pressed: { opacity: 0.85 },

  // ── Section headers
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.8,
    color: "rgba(255,255,255,0.5)",
  },

  // ── Recent modules
  recentContent: {
    gap: 8,
    paddingBottom: 4,
  },
  recentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 16,
    borderWidth: 1,
  },
  recentChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowColor: "#fff",
    shadowOpacity: 0.6,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  recentChipText: {
    fontSize: 12,
    fontWeight: "800",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.1,
  },

  // ── Daily goal
  dailyGoalCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.22)",
    backgroundColor: "rgba(10,6,24,0.6)",
  },
  dailyGoalBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.18)",
  },
  dailyGoalIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(52,211,153,0.22)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.4)",
  },
  dailyGoalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  dailyGoalEyebrow: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.6,
    color: "#6EE7B7",
  },
  dailyGoalTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "rgba(255,255,255,0.9)",
    letterSpacing: -0.2,
  },
  dailyGoalRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dailyGoalXp: {
    fontSize: 12,
    fontWeight: "900",
    color: "#6EE7B7",
    letterSpacing: 0.2,
  },

  // ── Nearby header
  nearbyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  nearbyCity: {
    marginLeft: "auto",
    fontSize: 9.5,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "600",
    maxWidth: 140,
  },

  // ── State card (loading / error / empty)
  stateCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  stateText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
  },

  // ── Denied
  deniedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.22)",
    backgroundColor: "rgba(10,6,24,0.5)",
  },
  deniedBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.18)",
  },
  deniedTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: -0.2,
  },
  deniedSub: {
    marginTop: 3,
    fontSize: 10.5,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "500",
  },

  // ── Nearby result
  nearbyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    backgroundColor: "rgba(10,6,24,0.55)",
  },
  nearbyIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  nearbyName: {
    fontSize: 13.5,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.3,
  },
  nearbyMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  nearbyCategory: {
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  nearbyDot: {
    fontSize: 10,
    color: "rgba(255,255,255,0.3)",
  },
  nearbyDistance: {
    fontSize: 10.5,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
  },
  nearbyRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  nearbySeePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  nearbySeePillText: {
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
});
