import { View, Pressable, Text } from "react-native";
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
import { useState, useEffect } from "react";

// ── Module meta ───────────────────────────────────────────────────────────────

const MODULE_COLORS: Record<string, string> = {
  immo: "#6366f1",
  jobs: "#10b981",
  transport: "#3b82f6",
  sante: "#ef4444",
  paiement: "#f59e0b",
  community: "#8b5cf6",
  messages: "#06b6d4",
  voyages: "#14b8a6",
  media: "#ec4899",
  agri: "#22c55e",
  marketplace: "#f97316",
  wallet: "#eab308",
  fitness: "#ef4444",
  apprendre: "#6366f1",
  dashboard: "#8b5cf6",
  live: "#ef4444",
  explorer: "#3b82f6",
  actions: "#f97316",
  profile: "#8b5cf6",
  documents: "#6366f1",
  agenda: "#10b981",
  sos: "#ef4444",
  recompenses: "#f59e0b",
  parrainage: "#ec4899",
  "live-streaming": "#ef4444",
  sport: "#6366f1",
  ecole: "#10b981",
  restauration: "#f97316",
  hebergement: "#8b5cf6",
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
  return MODULE_COLORS[key] ?? "#8b5cf6";
}

// ── Daily goals ──────────────────────────────────────────────────────────────

const DAILY_GOALS = [
  { label: "Complète ton profil à 100%", xp: 50, emoji: "👤" },
  { label: "Explore 3 nouveaux modules", xp: 30, emoji: "🧭" },
  { label: "Publie un contenu aujourd'hui", xp: 40, emoji: "✍️" },
  { label: "Aide un membre de ta communauté", xp: 35, emoji: "🤝" },
  { label: "Consulte la carte interactive", xp: 20, emoji: "🗺️" },
  { label: "Vérifie tes annonces du jour", xp: 25, emoji: "📢" },
  { label: "Partage une ressource utile", xp: 30, emoji: "💡" },
];

// ── Geo types ────────────────────────────────────────────────────────────────

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

// ── Nearby POI configuration ────────────────────────────────────────────────

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
    color: "#f97316",
  },
  {
    emoji: "🏥",
    label: "Clinique / Hôpital",
    tag: "amenity",
    value: "hospital",
    category: "Santé",
    page: "sante",
    color: "#ef4444",
  },
  {
    emoji: "🏪",
    label: "Marché / Supermarché",
    tag: "shop",
    value: "supermarket",
    category: "Marché",
    page: "marketplace",
    color: "#10b981",
  },
  {
    emoji: "🏋️",
    label: "Salle de sport",
    tag: "leisure",
    value: "fitness_centre",
    category: "Sport",
    page: "sport",
    color: "#6366f1",
  },
  {
    emoji: "🏨",
    label: "Hôtel",
    tag: "tourism",
    value: "hotel",
    category: "Hébergement",
    page: "hebergement",
    color: "#8b5cf6",
  },
  {
    emoji: "🏫",
    label: "École",
    tag: "amenity",
    value: "school",
    category: "École",
    page: "ecole",
    color: "#06b6d4",
  },
  {
    emoji: "⛽",
    label: "Station service",
    tag: "amenity",
    value: "fuel",
    category: "Transport",
    page: "transport",
    color: "#f59e0b",
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

// ── Overpass configuration ──────────────────────────────────────────────────
//
// IMPORTANT:
// On ne fait plus une requête par catégorie.
// Toutes les catégories sont regroupées dans UNE requête.
//
// Cela évite le problème observé dans la console :
// 429 Too Many Requests
// 504 Gateway Timeout
//

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const OVERPASS_RADIUS = 2000;
const OVERPASS_TIMEOUT_SECONDS = 8;

const NEARBY_CACHE_TTL = 15 * 60 * 1000;
const GEO_CACHE_TTL = 60 * 60 * 1000;

const nearbyMemoryCache = new Map<
  string,
  { timestamp: number; place: NearbyPlace | null }
>();

const reverseGeocodeMemoryCache = new Map<
  string,
  { timestamp: number; value: { city: string; country: string } }
>();

// ── Distance ────────────────────────────────────────────────────────────────

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

// ── Cache key ────────────────────────────────────────────────────────────────

function locationCacheKey(lat: number, lng: number): string {
  // Environ 100 m de précision.
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

// ── POI helpers ──────────────────────────────────────────────────────────────

function getPoiMeta(
  tags: Record<string, string> | undefined,
): (typeof POI_QUERIES)[number] | null {
  if (!tags) return null;

  return POI_QUERIES.find((poi) => tags[poi.tag] === poi.value) ?? null;
}

// ── Overpass response types ─────────────────────────────────────────────────

type OverpassElement = {
  type?: string;
  id?: number;

  lat?: number;
  lon?: number;

  center?: {
    lat?: number;
    lon?: number;
  };

  tags?: Record<string, string>;
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

// ── Build one combined Overpass query ───────────────────────────────────────

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

// ── Read nearby cache ────────────────────────────────────────────────────────

function readNearbyCache(key: string): NearbyPlace | null | undefined {
  const memory = nearbyMemoryCache.get(key);

  if (memory) {
    if (Date.now() - memory.timestamp < NEARBY_CACHE_TTL) {
      return memory.place;
    }

    nearbyMemoryCache.delete(key);
  }

  try {
    const raw = localStorage.getItem(`debrouillepro:nearby:${key}`);

    if (!raw) return undefined;

    const parsed = JSON.parse(raw) as {
      timestamp?: number;
      place?: NearbyPlace | null;
    };

    if (
      typeof parsed.timestamp !== "number" ||
      Date.now() - parsed.timestamp >= NEARBY_CACHE_TTL
    ) {
      localStorage.removeItem(`debrouillepro:nearby:${key}`);
      return undefined;
    }

    const place = parsed.place ?? null;

    nearbyMemoryCache.set(key, {
      timestamp: parsed.timestamp,
      place,
    });

    return place;
  } catch {
    return undefined;
  }
}

// ── Write nearby cache ───────────────────────────────────────────────────────

function writeNearbyCache(key: string, place: NearbyPlace | null): void {
  const timestamp = Date.now();

  nearbyMemoryCache.set(key, {
    timestamp,
    place,
  });

  try {
    localStorage.setItem(
      `debrouillepro:nearby:${key}`,
      JSON.stringify({
        timestamp,
        place,
      }),
    );
  } catch {
    // localStorage peut être indisponible.
  }
}

// ── Fetch Overpass with timeout ──────────────────────────────────────────────

async function fetchOverpass(
  endpoint: string,
  query: string,
): Promise<OverpassResponse> {
  const controller = new AbortController();

  const timeout = undefined;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      body: query,
      headers: {
        "Content-Type": "text/plain;charset=UTF-8",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Overpass HTTP ${response.status}`);
    }

    return (await response.json()) as OverpassResponse;
  } finally {
    undefined;
  }
}

// ── Find nearby place ───────────────────────────────────────────────────────

async function fetchNearbyPlace(
  lat: number,
  lng: number,
): Promise<NearbyPlace | null> {
  const cacheKey = locationCacheKey(lat, lng);

  const cached = readNearbyCache(cacheKey);

  if (cached !== undefined) {
    return cached;
  }

  const query = buildOverpassQuery(lat, lng);

  let lastError: unknown = null;

  for (let i = 0; i < OVERPASS_ENDPOINTS.length; i += 1) {
    const endpoint = OVERPASS_ENDPOINTS[i];

    try {
      const data = await fetchOverpass(endpoint, query);

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

      // On passe au serveur suivant.
      // Aucun retry agressif sur le même serveur.
      continue;
    }
  }

  console.warn(
    "[HomeWidget] Impossible de récupérer les lieux proches.",
    lastError,
  );

  // On mémorise l'absence de résultat quelques minutes.
  // Cela évite de bombarder Overpass si le service est momentanément indisponible.
  writeNearbyCache(cacheKey, null);

  return null;
}

// ── Reverse geocoding cache ──────────────────────────────────────────────────

function readReverseGeocodeCache(
  key: string,
): { city: string; country: string } | undefined {
  const memory = reverseGeocodeMemoryCache.get(key);

  if (memory) {
    if (Date.now() - memory.timestamp < GEO_CACHE_TTL) {
      return memory.value;
    }

    reverseGeocodeMemoryCache.delete(key);
  }

  try {
    const raw = localStorage.getItem(`debrouillepro:reverse:${key}`);

    if (!raw) return undefined;

    const parsed = JSON.parse(raw) as {
      timestamp?: number;
      value?: {
        city?: string;
        country?: string;
      };
    };

    if (
      typeof parsed.timestamp !== "number" ||
      Date.now() - parsed.timestamp >= GEO_CACHE_TTL
    ) {
      localStorage.removeItem(`debrouillepro:reverse:${key}`);

      return undefined;
    }

    const value = {
      city: parsed.value?.city ?? "",
      country: parsed.value?.country ?? "",
    };

    reverseGeocodeMemoryCache.set(key, {
      timestamp: parsed.timestamp,
      value,
    });

    return value;
  } catch {
    return undefined;
  }
}

// ── Reverse geocoding ────────────────────────────────────────────────────────

async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<{ city: string; country: string }> {
  const key = locationCacheKey(lat, lng);

  const cached = readReverseGeocodeCache(key);

  if (cached) {
    return cached;
  }

  try {
    const controller = new AbortController();

    const timeout = undefined;

    const url =
      `https://nominatim.openstreetmap.org/reverse` +
      `?format=json` +
      `&lat=${encodeURIComponent(lat)}` +
      `&lon=${encodeURIComponent(lng)}` +
      `&zoom=10` +
      `&addressdetails=1`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "Accept-Language": "fr",
      },
    });

    undefined;

    if (!res.ok) {
      return {
        city: "",
        country: "",
      };
    }

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

    const value = {
      city,
      country: data.address?.country ?? "",
    };

    const timestamp = Date.now();

    reverseGeocodeMemoryCache.set(key, {
      timestamp,
      value,
    });

    try {
      localStorage.setItem(
        `debrouillepro:reverse:${key}`,
        JSON.stringify({
          timestamp,
          value,
        }),
      );
    } catch {
      // localStorage indisponible.
    }

    return value;
  } catch {
    return {
      city: "",
      country: "",
    };
  }
}

// ── Component ────────────────────────────────────────────────────────────────

interface HomeWidgetProps {
  onNavigate: (page: string) => void;
}

export default function HomeWidget({ onNavigate }: HomeWidgetProps) {
  const { isAuthenticated } = useConvexAuth();

  const activities = useQuery(api.activity.list, isAuthenticated ? {} : "skip");

  const [geo, setGeo] = useState<GeoState>({
    status: "idle",
  });

  const [nearby, setNearby] = useState<NearbyPlace | null>(null);

  const [nearbyLoading, setNearbyLoading] = useState(false);

  // ── Geolocation ────────────────────────────────────────────────────────────
  //
  // Une seule demande au navigateur.
  //
  useEffect(() => {
    if (!isAuthenticated) return;

    if (!("geolocation" in undefined)) {
      setGeo({
        status: "error",
        message: "Géolocalisation non disponible sur cet appareil.",
      });

      return;
    }

    let cancelled = false;

    setGeo({
      status: "loading",
    });

    undefined.getCurrentPosition(
      async (pos) => {
        if (cancelled) return;

        const { latitude: lat, longitude: lng } = pos.coords;

        const { city, country } = await reverseGeocode(lat, lng);

        if (cancelled) return;

        setGeo({
          status: "ready",
          lat,
          lng,
          city,
          country,
        });
      },
      (err) => {
        if (cancelled) return;

        if (err.code === err.PERMISSION_DENIED) {
          setGeo({
            status: "denied",
          });

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

  // ── Nearby place ───────────────────────────────────────────────────────────
  //
  // Une seule recherche par position.
  // Les résultats sont cachés pendant 15 minutes.
  //
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

  // ── Recently visited modules ───────────────────────────────────────────────

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

        if (result.length >= 5) {
          break;
        }
      }
    }

    return result;
  })();

  // ── Daily goal ─────────────────────────────────────────────────────────────

  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      86400000,
  );

  const dailyGoal = DAILY_GOALS[dayOfYear % DAILY_GOALS.length];

  // ── Geo display ────────────────────────────────────────────────────────────

  const geoReady = geo.status === "ready";

  const cityLabel = geoReady ? geo.city : "";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View className="mt-4 px-5 space-y-3">
      {/* ── Recently visited ─────────────────────────────────────── */}

      {recentModules.length > 0 && (
        <View
        >
          <View className="flex items-center gap-1.5 mb-2">
            <Clock size={11} className="text-white/35" />

            <Text className="text-[10px] font-bold text-white/35 uppercase tracking-widest">
              Récemment visités
            </Text>
          </View>

          <View
            className="flex gap-2 overflow-x-auto pb-1"
            style={{  }}
          >
            {recentModules.map((mod, i) => {
              const color = getModuleColor(mod);

              const label =
                MODULE_LABELS[mod] ??
                mod.charAt(0).toUpperCase() + mod.slice(1).replace(/-/g, " ");

              return (
                <Pressable
                  key={mod}
                  onPress={() => onNavigate(mod)}
                  className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-2xl"
                  style={{ backgroundColor: `${color}15`, borderStyle: "solid" }}
                >
                  <View
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />

                  <Text className="text-white/75 text-xs font-semibold">
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* ── Objectif du jour ──────────────────────────────────────── */}

      <Pressable
        onPress={() => onNavigate("dashboard")}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left"
        style={{ borderWidth: 1, borderColor: "rgba(16,185,129,0.22)", borderStyle: "solid" }}
      >
        <View
          className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ backgroundColor: "rgba(16,185,129,0.15)" }}
        >
          {dailyGoal.emoji}
        </View>

        <View className="flex-1 min-w-0">
          <View className="flex items-center gap-1.5 mb-0.5">
            <Target size={9} className="text-emerald-400" />

            <Text className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">
              Objectif du jour
            </Text>
          </View>

          <Text className="text-white/80 text-sm font-semibold truncate">
            {dailyGoal.label}
          </Text>
        </View>

        <View className="flex items-center gap-1 flex-shrink-0">
          <Text className="text-emerald-400 text-xs font-black">
            +{dailyGoal.xp} XP
          </Text>

          <ChevronRight size={14} className="text-white/25" />
        </View>
      </Pressable>

      {/* ── Près de chez toi ─────────────────────────────────────── */}

      <View
      >
        <View className="flex items-center gap-1.5 mb-2">
          <MapPin size={11} className="text-white/35" />

          <Text className="text-[10px] font-bold text-white/35 uppercase tracking-widest">
            Près de chez toi
          </Text>

          {cityLabel ? (
            <Text className="ml-auto text-[9px] text-white/25 truncate max-w-[120px]">
              {cityLabel}
            </Text>
          ) : null}
        </View>

        {/* Loading */}

        {(geo.status === "loading" || (geoReady && nearbyLoading)) && (
          <View
            className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
          >
            <Loader2 size={18} className="text-white/30 animate-spin" />

            <Text className="text-white/40 text-sm">Recherche en cours…</Text>
          </View>
        )}

        {/* Permission denied */}

        {geo.status === "denied" && (
          <Pressable
            onPress={() => {
              setGeo({
                status: "loading",
              });

              undefined.getCurrentPosition(
                async (pos) => {
                  const { latitude: lat, longitude: lng } = pos.coords;

                  const { city, country } = await reverseGeocode(lat, lng);

                  setGeo({
                    status: "ready",
                    lat,
                    lng,
                    city,
                    country,
                  });
                },
                () => {
                  setGeo({
                    status: "denied",
                  });
                },
                {
                  timeout: 10000,
                  maximumAge: 60000,
                  enableHighAccuracy: false,
                },
              );
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left"
            style={{ backgroundColor: "rgba(239,68,68,0.08)", borderWidth: 1, borderColor: "rgba(239,68,68,0.2)", borderStyle: "solid" }}
          >
            <LocateOff size={18} className="text-red-400 flex-shrink-0" />

            <View className="flex-1">
              <Text className="text-white/70 text-sm font-semibold">
                Localisation désactivée
              </Text>

              <Text className="text-white/35 text-[10px]">Appuie pour réessayer</Text>
            </View>
          </Pressable>
        )}

        {/* Error */}

        {geo.status === "error" && (
          <View
            className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
          >
            <LocateOff size={18} className="text-white/25" />

            <Text className="text-white/35 text-sm">{geo.message}</Text>
          </View>
        )}

        {/* Result */}

        {geoReady && !nearbyLoading && nearby && (
          <Pressable
            onPress={() => onNavigate(nearby.page)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left"
            style={{ borderStyle: "solid" }}
          >
            <View
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ backgroundColor: `${nearby.color}18` }}
            >
              {nearby.emoji}
            </View>

            <View className="flex-1 min-w-0">
              <Text className="text-white/85 text-sm font-bold truncate">
                {nearby.name}
              </Text>

              <View className="flex items-center gap-2 mt-0.5">
                <Text
                  className="text-[10px] font-medium"
                  style={{
                    color: nearby.color,
                  }}
                >
                  {nearby.category}
                </Text>

                <Text className="text-white/25 text-[10px]">·</Text>

                <Text className="text-white/40 text-[10px]">
                  {nearby.distance}
                </Text>
              </View>
            </View>

            <View className="flex flex-col items-end gap-1 flex-shrink-0">
              <View
                className="flex items-center gap-1 px-2 py-1 rounded-xl"
                style={{ backgroundColor: `${nearby.color}20` }}
              >
                <Sparkles
                  size={9}
                  style={{
                    color: nearby.color,
                  }}
                />

                <Text
                  className="text-[9px] font-bold"
                  style={{
                    color: nearby.color,
                  }}
                >
                  <Text>Voir</Text></Text>
              </View>

              <ChevronRight size={13} className="text-white/20" />
            </View>
          </Pressable>
        )}

        {/* No nearby result */}

        {geoReady && !nearbyLoading && !nearby && (
          <View
            className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
          >
            <MapPin size={18} className="text-white/25" />

            <Text className="text-white/35 text-sm">
              <Text>Aucun lieu trouvé à proximité.</Text></Text>
          </View>
        )}
      </View>
    </View>
  );
}
