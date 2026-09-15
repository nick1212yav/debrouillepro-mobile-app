import { View, Pressable, Text, TextInput, Image, Share, NativeSyntheticEvent, TextInputKeyPressEventData } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";

import { AnimatePresence } from "motion/react";

import {
  MapPin,
  Navigation,
  Filter,
  X,
  Briefcase,
  Home as HomeIcon,
  Utensils,
  Calendar,
  Truck,
  Leaf,
  Heart,
  Zap,
  Megaphone,
  Building2,
  ShoppingBag,
  Users,
  LocateFixed,
  Layers3,
  Search,
  ChevronUp,
  ChevronDown,
  HeartIcon,
  MessageCircle,
  Share2,
  ExternalLink,
  Compass,
  Map as MapIcon,
  Check,
  SlidersHorizontal,
  Sparkles,
  Globe2,
  AlertCircle,
} from "lucide-react-native";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils.ts";

/* ============================================================================
 * LEAFLET
 * ========================================================================== */

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
  ._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* ============================================================================
 * TYPES
 * ========================================================================== */

type PubType = string;

type GeoPublication = {
  _id: string;
  type: PubType;
  title: string;
  description: string;
  price?: string;
  location?: string;
  images: string[];
  likeCount: number;
  commentCount: number;
  latitude: number;
  longitude: number;
  authorName: string;
  authorAvatar?: string;
};

type TypeConfig = {
  label: string;
  color: string;
  icon: React.ReactNode;
};

interface MapPageProps {
  onClose: () => void;
}

/* ============================================================================
 * CATEGORY CONFIGURATION
 * ========================================================================== */

const TYPE_CONFIG: Record<string, TypeConfig> = {
  job: {
    label: "Emploi",
    color: "#6366f1",
    icon: <Briefcase className="h-3.5 w-3.5" />,
  },

  immo: {
    label: "Immobilier",
    color: "#f59e0b",
    icon: <HomeIcon className="h-3.5 w-3.5" />,
  },

  restauration: {
    label: "Restauration",
    color: "#ef4444",
    icon: <Utensils className="h-3.5 w-3.5" />,
  },

  evenement: {
    label: "Événement",
    color: "#8b5cf6",
    icon: <Calendar className="h-3.5 w-3.5" />,
  },

  transport: {
    label: "Transport",
    color: "#3b82f6",
    icon: <Truck className="h-3.5 w-3.5" />,
  },

  agri: {
    label: "Agriculture",
    color: "#22c55e",
    icon: <Leaf className="h-3.5 w-3.5" />,
  },

  sante: {
    label: "Santé",
    color: "#ec4899",
    icon: <Heart className="h-3.5 w-3.5" />,
  },

  energie: {
    label: "Énergie",
    color: "#f97316",
    icon: <Zap className="h-3.5 w-3.5" />,
  },

  annonce: {
    label: "Annonce",
    color: "#14b8a6",
    icon: <Megaphone className="h-3.5 w-3.5" />,
  },

  hebergement: {
    label: "Hébergement",
    color: "#a78bfa",
    icon: <Building2 className="h-3.5 w-3.5" />,
  },

  service: {
    label: "Service",
    color: "#06b6d4",
    icon: <ShoppingBag className="h-3.5 w-3.5" />,
  },

  community: {
    label: "Communauté",
    color: "#84cc16",
    icon: <Users className="h-3.5 w-3.5" />,
  },

  ong: {
    label: "ONG",
    color: "#fb923c",
    icon: <Heart className="h-3.5 w-3.5" />,
  },
};

const ALL_TYPES = Object.keys(TYPE_CONFIG);

/* ============================================================================
 * DEFAULT MAP
 *
 * Aucun pays imposé.
 * Le monde est le point de départ.
 * ========================================================================== */

const WORLD_CENTER: [number, number] = [10, 0];
const WORLD_ZOOM = 2.5;

/* ============================================================================
 * PREMIUM MARKER
 * ========================================================================== */

function createColoredIcon(color: string, selected = false, label?: string) {
  const size = selected ? 42 : 34;
  const pinColor = color || "#6366f1";

  const svg = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="${size}"
      height="${size + 10}"
      viewBox="0 0 42 52"
    >
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow
            dx="0"
            dy="3"
            stdDeviation="3"
            flood-color="#000000"
            flood-opacity="0.35"
          />
        </filter>

        <linearGradient
          id="gradient"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop offset="0%" stop-color="${pinColor}" />
          <stop offset="100%" stop-color="${pinColor}" stop-opacity="0.72" />
        </linearGradient>
      </defs>

      <path
        d="M21 1
           C10 1 2 9 2 20
           C2 34 21 51 21 51
           C21 51 40 34 40 20
           C40 9 32 1 21 1Z"
        fill="url(#gradient)"
        stroke="rgba(255,255,255,0.95)"
        stroke-width="2"
        filter="url(#shadow)"
      />

      <circle
        cx="21"
        cy="20"
        r="8"
        fill="rgba(255,255,255,0.96)"
      />

      <circle
        cx="21"
        cy="20"
        r="4"
        fill="${pinColor}"
      />
    </svg>
  `;

  return L.divIcon({
    html: `
      <div
        title="${label ?? ""}"
        style="
          width:${size}px;
          height:${size + 10}px;
          transform: translate(-50%, -100%);
        "
      >
        ${svg}
      </div>
    `,
    className: "debbrouillepro-map-marker",
    iconSize: [size, size + 10],
    iconAnchor: [size / 2, size + 10],
    popupAnchor: [0, -(size + 5)],
  });
}

/* ============================================================================
 * MAP CONTROLLER
 * ========================================================================== */

function MapViewportController({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  const previous = useRef<string>("");

  useEffect(() => {
    const key = `${center[0]}:${center[1]}:${zoom}`;

    if (previous.current === key) return;

    previous.current = key;

    map.flyTo(center, zoom, {
      animate: true,
      duration: 0.8,
    });
  }, [center, zoom, map]);

  return null;
}

/* ============================================================================
 * MAP INTERACTION
 * ========================================================================== */

function MapInteraction({ onMapClick }: { onMapClick: () => void }) {
  useMapEvents({
    click: () => {
      onMapClick();
    },
  });

  return null;
}

/* ============================================================================
 * MAP PAGE
 * ========================================================================== */

export default function MapPage({ onClose }: MapPageProps) {
  const rawPublications = useQuery(api.map.listGeoPublications, {});

  const pubs = useMemo<GeoPublication[]>(() => {
    if (!Array.isArray(rawPublications)) return [];

    return rawPublications.filter((publication) => {
      return (
        publication &&
        typeof publication.latitude === "number" &&
        typeof publication.longitude === "number" &&
        Number.isFinite(publication.latitude) &&
        Number.isFinite(publication.longitude)
      );
    }) as GeoPublication[];
  }, [rawPublications]);

  const isLoading = rawPublications === undefined;

  const [activeTypes, setActiveTypes] = useState<Set<string>>(
    () => new Set(ALL_TYPES),
  );

  const [showFilters, setShowFilters] = useState(false);

  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );

  const [locating, setLocating] = useState(false);

  const [locationError, setLocationError] = useState(false);

  const [selectedPub, setSelectedPub] = useState<GeoPublication | null>(null);

  const [center, setCenter] = useState<[number, number]>(WORLD_CENTER);

  const [zoom, setZoom] = useState(WORLD_ZOOM);

  const [mapMode, setMapMode] = useState<"explore" | "nearby">("explore");

  const [search, setSearch] = useState("");

  const [sheetExpanded, setSheetExpanded] = useState(false);

  /* --------------------------------------------------------------------------
   * FILTERED DATA
   * ------------------------------------------------------------------------ */

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return pubs.filter((publication) => {
      if (!activeTypes.has(publication.type)) return false;

      if (!query) return true;

      return [
        publication.title,
        publication.description,
        publication.location,
        publication.authorName,
        publication.type,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [pubs, activeTypes, search]);

  /* --------------------------------------------------------------------------
   * CATEGORY COUNTS
   * ------------------------------------------------------------------------ */

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const publication of pubs) {
      counts[publication.type] = (counts[publication.type] ?? 0) + 1;
    }

    return counts;
  }, [pubs]);

  /* --------------------------------------------------------------------------
   * LOCATION
   * ------------------------------------------------------------------------ */

  const locateMe = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setLocationError(true);
      return;
    }

    setLocating(true);
    setLocationError(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];

        setUserLocation(coords);
        setCenter(coords);
        setZoom(14);
        setMapMode("nearby");
        setLocating(false);
      },
      () => {
        setLocating(false);
        setLocationError(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  }, []);

  /* --------------------------------------------------------------------------
   * FILTER
   * ------------------------------------------------------------------------ */

  const toggleType = useCallback((type: string) => {
    setActiveTypes((previous) => {
      const next = new Set(previous);

      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }

      return next;
    });

    setSelectedPub(null);
  }, []);

  const activateAll = useCallback(() => {
    setActiveTypes(new Set(ALL_TYPES));
    setSelectedPub(null);
  }, []);

  const deactivateAll = useCallback(() => {
    setActiveTypes(new Set());
    setSelectedPub(null);
  }, []);

  /* --------------------------------------------------------------------------
   * RESET VIEW
   * ------------------------------------------------------------------------ */

  const resetWorldView = useCallback(() => {
    setCenter(WORLD_CENTER);
    setZoom(WORLD_ZOOM);
    setMapMode("explore");
    setSelectedPub(null);
  }, []);

  /* --------------------------------------------------------------------------
   * KEYBOARD
   * ------------------------------------------------------------------------ */

  useEffect(() => {
    const handler = (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (event.key === "Escape") {
        if (selectedPub) {
          setSelectedPub(null);
          return;
        }

        if (showFilters) {
          setShowFilters(false);
          return;
        }

        onClose();
      }
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [onClose, selectedPub, showFilters]);

  /* --------------------------------------------------------------------------
   * ACTIVE FILTER COUNT
   * ------------------------------------------------------------------------ */

  const activeFilterCount =
    activeTypes.size === ALL_TYPES.length ? 0 : activeTypes.size;

  return (
    <View initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.985 }} transition={{ duration: 0.25 }} className="fixed inset-0 z-[70] overflow-hidden bg-slate-950">
      {/* =====================================================================
          MAP
      ====================================================================== */}

      <View className="absolute inset-0"><MapContainer center={WORLD_CENTER} zoom={WORLD_ZOOM} minZoom={2} maxZoom={19} className="h-full w-full" zoomControl={false} attributionControl><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>' maxZoom={19} /><MapViewportController center={center} zoom={zoom} /><MapInteraction onMapClick={() => {
              setSelectedPub(null);
            }} />{}{userLocation && (
            <>
              <Circle
                center={userLocation}
                radius={650}
                pathOptions={{
                  color: "#6366f1",
                  fillColor: "#6366f1",
                  fillOpacity: 0.08,
                  weight: 1,
                }}
              />

              <Circle
                center={userLocation}
                radius={35}
                pathOptions={{
                  color: "#6366f1",
                  fillColor: "#6366f1",
                  fillOpacity: 0.25,
                  weight: 2,
                }}
              />

              <Marker
                position={userLocation}
                icon={createColoredIcon("#6366f1", true, "Votre position")}
              />
            </>
          )}{}{filtered.map((publication) => {
            const config = TYPE_CONFIG[publication.type] ?? {
              label: publication.type || "Autre",
              color: "#64748b",
              icon: <MapPin className="h-3.5 w-3.5" />,
            };

            const isSelected = selectedPub?._id === publication._id;

            return (
              <Marker
                key={publication._id}
                position={[publication.latitude, publication.longitude]}
                icon={createColoredIcon(
                  config.color,
                  isSelected,
                  publication.title,
                )}
                zIndexOffset={isSelected ? 1000 : 0}
                eventHandlers={{
                  click: () => {
                    setSelectedPub(publication);
                    setSheetExpanded(false);
                  },
                }}
              />
            );
          })}</MapContainer></View>

      {/* =====================================================================
          GLOBAL GRADIENTS
      ====================================================================== */}

      <View className="pointer-events-none absolute inset-x-0 top-0 z-10 h-44" style={{  }} />

      <View className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-48" style={{  }} />

      {/* =====================================================================
          TOP HEADER
      ====================================================================== */}

      <View className="pointer-events-none absolute left-0 right-0 top-0 z-30 p-3 sm:p-5"><View className="mx-auto flex max-w-7xl items-start gap-3">{}<Pressable whileTap={{ scale: 0.9 }} onPress={onClose} accessibilityLabel="Fermer la carte" className="pointer-events-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/70 text-white shadow-2xl backdrop-blur-2xl transition"><X className="h-5 w-5" /></Pressable>{}<View className="pointer-events-auto min-w-0 flex-1"><View className="rounded-3xl border border-white/10 bg-slate-950/72 p-2 shadow-2xl backdrop-blur-2xl"><View className="flex items-center gap-3 px-2"><View className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300"><Globe2 className="h-5 w-5" /></View><View className="min-w-0 flex-1"><View className="flex items-center gap-2"><Text className="truncate text-sm font-bold text-white">Carte DébrouillePro
                    </Text><Text className="hidden rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/50 sm:inline">Monde
                    </Text></View><Text className="text-[11px] text-white/45">Explore les opportunités autour de toi
                  </Text></View><View className="hidden items-center gap-2 sm:flex"><Text className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/70">{isLoading
                      ? "Chargement…"
                      : `${filtered.length} résultat${filtered.length > 1 ? "s" : ""}`}</Text></View></View>{}<View className="mt-2 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2"><Search className="h-4 w-4 shrink-0 text-white/35" /><TextInput value={search} onChangeText={(value) => setSearch(value)} placeholder="Rechercher un lieu, service, emploi…" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30" accessibilityLabel="Rechercher sur la carte" />{search && (
                  <Pressable onPress={() => setSearch("")} className="rounded-full p-1 text-white/40 transition" accessibilityLabel="Effacer la recherche"><X className="h-3.5 w-3.5" /></Pressable>
                )}</View></View></View></View></View>

      {/* =====================================================================
          RIGHT CONTROLS
      ====================================================================== */}

      <View className="absolute right-3 top-36 z-30 flex flex-col gap-2 sm:right-5 sm:top-40"><Pressable whileTap={{ scale: 0.9 }} onPress={locateMe} disabled={locating} accessibilityLabel="Me localiser" className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/75 text-white shadow-2xl backdrop-blur-2xl transition",
            locating && "text-violet-300",
          )}><Navigation className={cn("h-5 w-5", locating && "animate-pulse")} /></Pressable><Pressable whileTap={{ scale: 0.9 }} onPress={resetWorldView} accessibilityLabel="Vue mondiale" className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/75 text-white shadow-2xl backdrop-blur-2xl transition"><Globe2 className="h-5 w-5" /></Pressable><Pressable whileTap={{ scale: 0.9 }} onPress={() => setShowFilters((value) => !value)} accessibilityLabel="Filtres" className={cn(
            "relative flex h-12 w-12 items-center justify-center rounded-2xl border text-white shadow-2xl backdrop-blur-2xl transition",
            showFilters
              ? "border-violet-400/40 bg-violet-500/30"
              : "border-white/10 bg-slate-950/75",
          )}><SlidersHorizontal className="h-5 w-5" />{activeFilterCount > 0 && (
            <Text className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-500 px-1 text-[9px] font-black text-white shadow-lg">{activeFilterCount}</Text>
          )}</Pressable></View>

      {/* =====================================================================
          MODE SWITCH
      ====================================================================== */}

      <View className="absolute left-1/2 top-36 z-30 -translate-x-1/2 sm:top-40"><View className="flex rounded-2xl border border-white/10 bg-slate-950/75 p-1 shadow-2xl backdrop-blur-2xl"><Pressable onPress={() => setMapMode("explore")} className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-semibold transition",
              mapMode === "explore"
                ? "bg-white text-slate-900 shadow-lg"
                : "text-white/55 hover:text-white",
            )}><MapIcon className="h-3.5 w-3.5" /><Text>Explorer</Text></Pressable><Pressable onPress={() => {
              setMapMode("nearby");
              locateMe();
            }} className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-semibold transition",
              mapMode === "nearby"
                ? "bg-violet-500 text-white shadow-lg"
                : "text-white/55 hover:text-white",
            )}><LocateFixed className="h-3.5 w-3.5" /><Text>Autour de moi</Text></Pressable></View></View>

      {/* =====================================================================
          FILTER PANEL
      ====================================================================== */}

<View>
        {showFilters && (
          <View initial={{ opacity: 0, y: -12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -12, scale: 0.98 }} transition={{ duration: 0.2 }} className="absolute left-3 right-3 top-[19rem] z-30 sm:left-1/2 sm:right-auto sm:w-[440px] sm:-translate-x-1/2">
            <View className="rounded-3xl border border-white/10 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-2xl"><View className="mb-3 flex items-center justify-between"><View><Text className="text-sm font-bold text-white">Explorer par catégorie
                  </Text><Text className="text-[11px] text-white/40">Affiche uniquement ce qui t'intéresse
                  </Text></View><View className="flex gap-1"><Pressable onPress={activateAll} className="rounded-xl px-2.5 py-1.5 text-[10px] font-semibold text-violet-300 transition"><Text>Tout</Text></Pressable><Pressable onPress={deactivateAll} className="rounded-xl px-2.5 py-1.5 text-[10px] font-semibold text-white/40 transition"><Text>Aucun</Text></Pressable></View></View><View className="gap-2">{Object.entries(TYPE_CONFIG).map(([key, config]) => {
                  const active = activeTypes.has(key);
                  const count = categoryCounts[key] ?? 0;

                  return (
                    <Pressable key={key} onPress={() => toggleType(key)} className={cn(
                        "flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-left transition",
                        active
                          ? "border-white/10 bg-white/10 text-white"
                          : "border-white/5 bg-white/[0.025] text-white/30",
                      )}><Text className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl" style={{
                          backgroundColor: active
                            ? `${config.color}30`
                            : "rgba(255,255,255,.04)",
                          color: active ? config.color : "rgba(255,255,255,.3)",
                        }}>{config.icon}</Text><Text className="min-w-0 flex-1"><Text className="block truncate text-[10px] font-semibold">{config.label}</Text><Text className="block text-[9px] text-white/25">{count}</Text></Text>{active && (
                        <Check
                          className="h-3.5 w-3.5 shrink-0"
                          style={{  }}
                        />
                      )}</Pressable>
                  );
                })}</View></View>
          </View>
        )}
      </View>

      {/* =====================================================================
          LOCATION ERROR
      ====================================================================== */}

<View>
        {locationError && (
          <View initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute left-1/2 top-28 z-40 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2">
            <View className="flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-slate-950/90 p-3 shadow-2xl backdrop-blur-2xl"><View className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400"><AlertCircle className="h-4 w-4" /></View><View className="min-w-0 flex-1"><Text className="text-xs font-semibold text-white">Localisation indisponible
                </Text><Text className="text-[10px] text-white/40">Vérifie l'autorisation de localisation de ton navigateur.
                </Text></View><Pressable onPress={() => setLocationError(false)} className="rounded-full p-1 text-white/30" accessibilityLabel="Fermer"><X className="h-4 w-4" /></Pressable></View>
          </View>
        )}
      </View>

      {/* =====================================================================
          EMPTY STATE
      ====================================================================== */}

      {!isLoading && filtered.length === 0 && (
        <View className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-6"><View initial={{ opacity: 0, y: 15, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="pointer-events-auto w-full max-w-sm rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 text-center shadow-2xl backdrop-blur-2xl"><View className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-500/10 text-violet-300"><Compass className="h-7 w-7" /></View><Text className="text-base font-bold text-white">Aucun résultat ici
            </Text><Text className="mt-2 text-xs leading-5 text-white/40">Essaie une autre catégorie ou modifie ta recherche. Les contenus
              géolocalisés apparaîtront automatiquement sur la carte.
            </Text><Pressable onPress={() => {
                setSearch("");
                activateAll();
              }} className="mt-5 rounded-2xl bg-white px-5 py-2.5 text-xs font-bold text-slate-900 transition"><Text>Réinitialiser</Text></Pressable></View></View>
      )}

      {/* =====================================================================
          SELECTED PUBLICATION
      ====================================================================== */}

<View>
        {selectedPub && (
          <View initial={{ opacity: 0, y: 120 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 120 }} transition={{
              type: "spring",
              stiffness: 360,
              damping: 32,
            }} className="absolute bottom-3 left-3 right-3 z-40 sm:bottom-5 sm:left-1/2 sm:right-auto sm:w-[560px] sm:-translate-x-1/2">
            <View className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/92 shadow-[0_25px_80px_rgba(0,0,0,.5)] backdrop-blur-2xl">{}<Pressable onPress={() => setSheetExpanded((value) => !value)} className="flex w-full justify-center py-2 sm:hidden" accessibilityLabel={sheetExpanded ? "Réduire" : "Afficher plus"}><Text className="h-1 w-10 rounded-full bg-white/20" /></Pressable><View className="relative p-3 sm:p-4"><Pressable onPress={() => setSelectedPub(null)} className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white/70 backdrop-blur-xl transition" accessibilityLabel="Fermer"><X className="h-4 w-4" /></Pressable><View className="flex gap-3">{}<View className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-white/5 sm:h-28 sm:w-28">{selectedPub.images?.[0] ? (
                      <Image className="h-full w-full object-cover" source={{ uri: selectedPub.images[0] }} accessibilityLabel={selectedPub.title} />
                    ) : (
                      <View className="flex h-full w-full items-center justify-center text-white/20"><MapPin className="h-7 w-7" /></View>
                    )}<View className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/50 to-transparent" /></View>{}<View className="min-w-0 flex-1 pr-7"><View className="mb-1.5 flex items-center gap-2">{(() => {
                        const config = TYPE_CONFIG[selectedPub.type];

                        if (!config) return null;

                        return (
                          <Text className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold text-white" style={{
                              backgroundColor: `${config.color}DD`,
                            }}>{config.icon}{config.label}</Text>
                        );
                      })()}{selectedPub.price && (
                        <Text className="truncate text-[10px] font-bold text-violet-300">{selectedPub.price}</Text>
                      )}</View><Text className="text-sm font-bold leading-5 text-white sm:text-base">{selectedPub.title}</Text>{selectedPub.location && (
                      <View className="mt-1.5 flex items-center gap-1 text-[10px] text-white/40"><MapPin className="h-3 w-3 shrink-0" /><Text className="truncate">{selectedPub.location}</Text></View>
                    )}<View className="mt-2 flex items-center gap-3 text-[10px] text-white/35"><Text className="inline-flex items-center gap-1"><HeartIcon className="h-3 w-3" />{selectedPub.likeCount}</Text><Text className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" />{selectedPub.commentCount}</Text><Text className="ml-auto inline-flex items-center gap-1"><Users className="h-3 w-3" />{selectedPub.authorName}</Text></View></View></View>{}<AnimatePresence>{sheetExpanded && (
                    <View initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <View className="mt-4 border-t border-white/5 pt-4"><Text className="text-xs leading-5 text-white/50">{selectedPub.description ||
                            "Aucune description disponible."}</Text></View>
                    </View>
                  )}</AnimatePresence>{}<View className="mt-3 flex items-center gap-2"><Pressable className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-[10px] font-semibold text-white/70 transition" onPress={() => {
                      if (
                        Number.isFinite(selectedPub.latitude) &&
                        Number.isFinite(selectedPub.longitude)
                      ) {
                        setCenter([
                          selectedPub.latitude,
                          selectedPub.longitude,
                        ]);
                        setZoom(16);
                      }
                    }}><Navigation className="h-3.5 w-3.5" /><Text>Voir sur la carte</Text></Pressable><Pressable className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition" accessibilityLabel="Partager" onPress={() => {
                      if (navigator.share && selectedPub.title) {
                        void Share.share({ message: String(selectedPub.description), title: selectedPub.title });
                      }
                    }}><Share2 className="h-4 w-4" /></Pressable><Pressable className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500 text-white shadow-lg shadow-violet-500/20 transition" accessibilityLabel="Ouvrir"><ExternalLink className="h-4 w-4" /></Pressable></View></View></View>
          </View>
        )}
      </View>

      {/* =====================================================================
          BOTTOM STATUS
      ====================================================================== */}

      {!selectedPub && (
        <View className="absolute bottom-4 left-3 z-30 sm:bottom-5 sm:left-5"><View className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 shadow-2xl backdrop-blur-2xl"><Text className="relative flex h-2 w-2"><Text className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><Text className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" /></Text><Text className="text-[10px] font-semibold text-white/60">{isLoading
                ? "Synchronisation…"
                : `${filtered.length} point${filtered.length > 1 ? "s" : ""} visible${filtered.length > 1 ? "s" : ""}`}</Text>{userLocation && (
              <Text className="hidden text-[9px] text-violet-300 sm:inline">
                • Position active
              </Text>
            )}</View></View>
      )}

      {/* =====================================================================
          MAP CSS
      ====================================================================== */}

      <style>{`
        .debbrouillepro-map-marker {
          background: transparent !important;
          border: 0 !important;
        }

        .leaflet-container {
          background: #0f172a !important;
          font-family: inherit;
        }

        .leaflet-control-attribution {
          background: rgba(2, 6, 23, .72) !important;
          color: rgba(255,255,255,.42) !important;
          backdrop-filter: blur(12px);
          border-radius: 10px 0 0 0;
          padding: 4px 7px !important;
          font-size: 9px !important;
        }

        .leaflet-control-attribution a {
          color: rgba(167,139,250,.8) !important;
        }

        .leaflet-popup-content-wrapper,
        .leaflet-popup-tip {
          background: rgba(2, 6, 23, .94) !important;
          color: white !important;
          border: 1px solid rgba(255,255,255,.08);
          box-shadow: 0 20px 60px rgba(0,0,0,.35) !important;
          backdrop-filter: blur(20px);
        }

        .leaflet-popup-content {
          margin: 12px !important;
        }

        .leaflet-popup-close-button {
          color: rgba(255,255,255,.55) !important;
        }

        .leaflet-control-zoom {
          display: none !important;
        }

        .leaflet-tile {
          filter: saturate(.78) contrast(1.02);
        }
      `}</style>
    </View>
  );
}
