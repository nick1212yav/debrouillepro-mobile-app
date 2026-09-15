// src/pages/home/_components/MapPage.native.tsx
import {
  View,
  Pressable,
  Text,
  TextInput,
  Image,
  ScrollView,
  Animated,
  Easing,
  StyleSheet,
  Platform,
  Share,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MapView, {
  Marker,
  Circle,
  PROVIDER_GOOGLE,
  type Region,
} from "react-native-maps";
import * as Location from "expo-location";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  MapPin,
  Navigation,
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
  Search,
  HeartIcon,
  MessageCircle,
  Share2,
  ExternalLink,
  Compass,
  Map as MapIcon,
  Check,
  SlidersHorizontal,
  Globe2,
  AlertCircle,
} from "lucide-react-native";

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

interface MapPageProps {
  onClose: () => void;
}

type TypeConfig = {
  label: string;
  color: string;
  Icon: typeof MapPin;
};

/* ============================================================================
 * CATEGORY CONFIGURATION
 * ========================================================================== */

const TYPE_CONFIG: Record<string, TypeConfig> = {
  job: { label: "Emploi", color: "#818CF8", Icon: Briefcase },
  immo: { label: "Immobilier", color: "#F59E0B", Icon: HomeIcon },
  restauration: { label: "Restauration", color: "#F87171", Icon: Utensils },
  evenement: { label: "Événement", color: "#A78BFA", Icon: Calendar },
  transport: { label: "Transport", color: "#60A5FA", Icon: Truck },
  agri: { label: "Agriculture", color: "#4ADE80", Icon: Leaf },
  sante: { label: "Santé", color: "#F472B6", Icon: Heart },
  energie: { label: "Énergie", color: "#FB923C", Icon: Zap },
  annonce: { label: "Annonce", color: "#2DD4BF", Icon: Megaphone },
  hebergement: { label: "Hébergement", color: "#C4B5FD", Icon: Building2 },
  service: { label: "Service", color: "#22D3EE", Icon: ShoppingBag },
  community: { label: "Communauté", color: "#A3E635", Icon: Users },
  ong: { label: "ONG", color: "#FDBA74", Icon: Heart },
};

const ALL_TYPES = Object.keys(TYPE_CONFIG);

const WORLD_REGION: Region = {
  latitude: 10,
  longitude: 0,
  latitudeDelta: 120,
  longitudeDelta: 120,
};

const DEFAULT_ICON = MapPin;

/* ============================================================================
 * UTILS
 * ========================================================================== */

function cleanText(value?: string) {
  return (value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
 * PULSING ICON
 * ========================================================================== */

function PulsingIcon({
  Icon,
  color = "#A78BFA",
}: {
  Icon: typeof MapPin;
  color?: string;
}) {
  const pulse = useRef(new Animated.Value(0)).current;

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
  }, [pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });

  return (
    <Animated.View style={[styles.pulsingIconWrap, { transform: [{ scale }] }]}>
      <LinearGradient
        colors={[color, `${color}CC`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.pulsingIconGradient}
      >
        <Icon size={16} color="#fff" strokeWidth={2.4} />
      </LinearGradient>
    </Animated.View>
  );
}

/* ============================================================================
 * CONTROL BUTTON
 * ========================================================================== */

function ControlButton({
  Icon,
  onPress,
  active,
  badge,
  accessibilityLabel,
}: {
  Icon: typeof MapPin;
  onPress: () => void;
  active?: boolean;
  badge?: number;
  accessibilityLabel: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

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

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityLabel={accessibilityLabel}
        style={[styles.controlBtn, active && styles.controlBtnActive]}
      >
        {active ? (
          <LinearGradient
            colors={["rgba(167,139,250,0.9)", "rgba(124,58,237,0.7)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <Icon size={20} color="#fff" strokeWidth={2.2} />
        {badge && badge > 0 ? (
          <View style={styles.controlBtnBadge}>
            <Text style={styles.controlBtnBadgeText}>{badge}</Text>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================================
 * MAIN
 * ========================================================================== */

export default function MapPage({ onClose }: MapPageProps) {
  const { width: W, height: H } = useWindowDimensions();
  const mapRef = useRef<MapView | null>(null);

  const rawPublications = useQuery(api.map.listGeoPublications, {});

  const pubs = useMemo<GeoPublication[]>(() => {
    if (!Array.isArray(rawPublications)) return [];
    return rawPublications.filter(
      (p) =>
        p &&
        typeof p.latitude === "number" &&
        typeof p.longitude === "number" &&
        Number.isFinite(p.latitude) &&
        Number.isFinite(p.longitude),
    ) as GeoPublication[];
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
  const [region, setRegion] = useState<Region>(WORLD_REGION);
  const [mapMode, setMapMode] = useState<"explore" | "nearby">("explore");
  const [search, setSearch] = useState("");
  const [sheetExpanded, setSheetExpanded] = useState(false);

  const [mounted, setMounted] = useState(true);
  const backdropFade = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(0)).current;

  /* entrance */
  useEffect(() => {
    Animated.timing(backdropFade, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [backdropFade]);

  /* selected card slide */
  useEffect(() => {
    cardSlide.setValue(0);
    if (selectedPub) {
      Animated.spring(cardSlide, {
        toValue: 1,
        useNativeDriver: true,
        speed: 22,
        bounciness: 6,
      }).start();
    }
  }, [selectedPub, cardSlide]);

  /* ───── FILTERED ───── */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return pubs.filter((p) => {
      if (!activeTypes.has(p.type)) return false;
      if (!q) return true;
      return [p.title, p.description, p.location, p.authorName, p.type]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [pubs, activeTypes, search]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of pubs) counts[p.type] = (counts[p.type] ?? 0) + 1;
    return counts;
  }, [pubs]);

  /* ───── LOCATION ───── */
  const locateMe = useCallback(async () => {
    setLocating(true);
    setLocationError(false);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError(true);
        setLocating(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords: [number, number] = [
        pos.coords.latitude,
        pos.coords.longitude,
      ];
      setUserLocation(coords);
      setRegion({
        latitude: coords[0],
        longitude: coords[1],
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
      mapRef.current?.animateToRegion(
        {
          latitude: coords[0],
          longitude: coords[1],
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        700,
      );
      setMapMode("nearby");
    } catch {
      setLocationError(true);
    } finally {
      setLocating(false);
    }
  }, []);

  /* ───── FILTERS ───── */
  const toggleType = useCallback((type: string) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
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

  const resetWorldView = useCallback(() => {
    setRegion(WORLD_REGION);
    setMapMode("explore");
    setSelectedPub(null);
    mapRef.current?.animateToRegion(WORLD_REGION, 700);
  }, []);

  /* ───── SHARE ───── */
  const handleShare = useCallback(async () => {
    if (!selectedPub) return;
    try {
      await Share.share({
        title: selectedPub.title,
        message: cleanText(selectedPub.description) || selectedPub.title,
      });
    } catch {
      // ignore
    }
  }, [selectedPub]);

  const activeFilterCount =
    activeTypes.size === ALL_TYPES.length ? 0 : activeTypes.size;

  const cardTranslateY = cardSlide.interpolate({
    inputRange: [0, 1],
    outputRange: [120, 0],
  });

  if (!mounted) return null;

  /* ========================================================================
   * RENDER
   * ====================================================================== */

  return (
    <Animated.View style={[styles.root, { opacity: backdropFade }]}>
      {/* ═══════════ MAP ═══════════ */}
      <MapView
        ref={mapRef}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        style={StyleSheet.absoluteFill}
        initialRegion={WORLD_REGION}
        region={region}
        onRegionChangeComplete={setRegion}
        minZoomLevel={2}
        maxZoomLevel={19}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        toolbarEnabled={false}
        onPress={() => setSelectedPub(null)}
        customMapStyle={DARK_MAP_STYLE}
      >
        {userLocation ? (
          <>
            <Circle
              center={{
                latitude: userLocation[0],
                longitude: userLocation[1],
              }}
              radius={650}
              strokeColor="rgba(129,140,248,0.4)"
              fillColor="rgba(129,140,248,0.08)"
              strokeWidth={1}
            />
            <Circle
              center={{
                latitude: userLocation[0],
                longitude: userLocation[1],
              }}
              radius={35}
              strokeColor="#818CF8"
              fillColor="rgba(129,140,248,0.35)"
              strokeWidth={2}
            />
          </>
        ) : null}

        {filtered.map((pub) => {
          const config = TYPE_CONFIG[pub.type] ?? {
            label: pub.type || "Autre",
            color: "#64748B",
            Icon: DEFAULT_ICON,
          };
          const Icon = config.Icon;
          const isSelected = selectedPub?._id === pub._id;

          return (
            <Marker
              key={pub._id}
              coordinate={{
                latitude: pub.latitude,
                longitude: pub.longitude,
              }}
              zIndex={isSelected ? 1000 : 0}
              onPress={() => {
                setSelectedPub(pub);
                setSheetExpanded(false);
              }}
            >
              <PremiumMarker
                color={config.color}
                Icon={Icon}
                selected={isSelected}
              />
            </Marker>
          );
        })}
      </MapView>

      {/* ═══════════ TOP / BOTTOM SHADOWS ═══════════ */}
      <LinearGradient
        colors={["rgba(2,6,23,0.85)", "rgba(2,6,23,0)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.topShadow}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["rgba(2,6,23,0)", "rgba(2,6,23,0.9)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.bottomShadow}
        pointerEvents="none"
      />

      {/* ═══════════ HEADER ═══════════ */}
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === "android" ? 44 : 54 },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={onClose}
            accessibilityLabel="Fermer la carte"
            style={({ pressed }) => [
              styles.closeBtn,
              pressed && styles.pressed,
            ]}
          >
            <X size={20} color="#fff" />
          </Pressable>

          <View style={styles.headerPanel}>
            <View style={styles.headerPanelInner}>
              <View style={styles.headerPanelTop}>
                <PulsingIcon Icon={Globe2} color="#A78BFA" />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.headerTitle} numberOfLines={1}>
                    Carte DébrouillePro
                  </Text>
                  <Text style={styles.headerSub} numberOfLines={1}>
                    {isLoading
                      ? "Chargement…"
                      : `${filtered.length} résultat${filtered.length > 1 ? "s" : ""} · Explore les opportunités`}
                  </Text>
                </View>
              </View>

              <View style={styles.searchRow}>
                <Search size={15} color="rgba(255,255,255,0.55)" />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Rechercher un lieu, service, emploi…"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  style={styles.searchInput}
                  accessibilityLabel="Rechercher sur la carte"
                />
                {search ? (
                  <Pressable
                    onPress={() => setSearch("")}
                    hitSlop={8}
                    accessibilityLabel="Effacer la recherche"
                  >
                    <X size={14} color="rgba(255,255,255,0.55)" />
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* ═══════════ RIGHT CONTROLS ═══════════ */}
      <View style={styles.controlsCol}>
        <ControlButton
          Icon={Navigation}
          onPress={locateMe}
          active={locating}
          accessibilityLabel="Me localiser"
        />
        <ControlButton
          Icon={Globe2}
          onPress={resetWorldView}
          accessibilityLabel="Vue mondiale"
        />
        <ControlButton
          Icon={SlidersHorizontal}
          onPress={() => setShowFilters((v) => !v)}
          active={showFilters}
          badge={activeFilterCount}
          accessibilityLabel="Filtres"
        />
      </View>

      {/* ═══════════ MODE SWITCH ═══════════ */}
      <View style={styles.modeSwitchWrap}>
        <View style={styles.modeSwitch}>
          <Pressable
            onPress={() => setMapMode("explore")}
            style={[
              styles.modeBtn,
              mapMode === "explore" && styles.modeBtnActiveLight,
            ]}
          >
            <MapIcon
              size={13}
              color={
                mapMode === "explore" ? "#0F172A" : "rgba(255,255,255,0.7)"
              }
              strokeWidth={2.4}
            />
            <Text
              style={[
                styles.modeBtnText,
                mapMode === "explore" && { color: "#0F172A" },
              ]}
            >
              Explorer
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setMapMode("nearby");
              void locateMe();
            }}
            style={[
              styles.modeBtn,
              mapMode === "nearby" && styles.modeBtnActiveViolet,
            ]}
          >
            <LocateFixed
              size={13}
              color={mapMode === "nearby" ? "#fff" : "rgba(255,255,255,0.7)"}
              strokeWidth={2.4}
            />
            <Text style={styles.modeBtnText}>Autour de moi</Text>
          </Pressable>
        </View>
      </View>

      {/* ═══════════ FILTER PANEL ═══════════ */}
      {showFilters ? (
        <FilterPanel
          activeTypes={activeTypes}
          categoryCounts={categoryCounts}
          onToggle={toggleType}
          onAll={activateAll}
          onNone={deactivateAll}
          onClose={() => setShowFilters(false)}
        />
      ) : null}

      {/* ═══════════ LOCATION ERROR ═══════════ */}
      {locationError ? (
        <FadeUp distance={-10} style={styles.errorWrap}>
          <View style={styles.errorCard}>
            <View style={styles.errorIconWrap}>
              <AlertCircle size={16} color="#FBBF24" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.errorTitle}>Localisation indisponible</Text>
              <Text style={styles.errorSub}>
                Vérifie l'autorisation de localisation de ton appareil.
              </Text>
            </View>
            <Pressable
              onPress={() => setLocationError(false)}
              hitSlop={8}
              accessibilityLabel="Fermer"
            >
              <X size={16} color="rgba(255,255,255,0.6)" />
            </Pressable>
          </View>
        </FadeUp>
      ) : null}

      {/* ═══════════ EMPTY STATE ═══════════ */}
      {!isLoading && filtered.length === 0 ? (
        <View style={styles.emptyWrap} pointerEvents="box-none">
          <FadeUp distance={15}>
            <View style={styles.emptyCard}>
              <LinearGradient
                colors={["rgba(139,92,246,0.16)", "rgba(10,6,24,0.85)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.emptyBorder} pointerEvents="none" />

              <LinearGradient
                colors={["rgba(167,139,250,0.32)", "rgba(99,102,241,0.08)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emptyIcon}
              >
                <Compass size={26} color="#C4B5FD" />
              </LinearGradient>

              <Text style={styles.emptyTitle}>Aucun résultat ici</Text>
              <Text style={styles.emptySub}>
                Essaie une autre catégorie ou modifie ta recherche. Les contenus
                géolocalisés apparaîtront automatiquement sur la carte.
              </Text>

              <Pressable
                onPress={() => {
                  setSearch("");
                  activateAll();
                }}
                style={({ pressed }) => [
                  styles.emptyBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.emptyBtnText}>Réinitialiser</Text>
              </Pressable>
            </View>
          </FadeUp>
        </View>
      ) : null}

      {/* ═══════════ SELECTED PUBLICATION ═══════════ */}
      {selectedPub ? (
        <Animated.View
          style={[styles.card, { transform: [{ translateY: cardTranslateY }] }]}
        >
          <SelectedCard
            pub={selectedPub}
            expanded={sheetExpanded}
            onToggleExpand={() => setSheetExpanded((v) => !v)}
            onClose={() => setSelectedPub(null)}
            onCenter={() => {
              mapRef.current?.animateToRegion(
                {
                  latitude: selectedPub.latitude,
                  longitude: selectedPub.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                },
                700,
              );
            }}
            onShare={handleShare}
          />
        </Animated.View>
      ) : null}

      {/* ═══════════ BOTTOM STATUS ═══════════ */}
      {!selectedPub ? (
        <FadeUp delay={80} distance={8} style={styles.statusWrap}>
          <View style={styles.statusCard}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText} numberOfLines={1}>
              {isLoading
                ? "Synchronisation…"
                : `${filtered.length} point${filtered.length > 1 ? "s" : ""} visible${filtered.length > 1 ? "s" : ""}`}
            </Text>
            {userLocation ? (
              <Text style={styles.statusActive}>• Position active</Text>
            ) : null}
          </View>
        </FadeUp>
      ) : null}
    </Animated.View>
  );
}

/* ============================================================================
 * PREMIUM MARKER
 * ========================================================================== */

function PremiumMarker({
  color,
  Icon,
  selected,
}: {
  color: string;
  Icon: typeof MapPin;
  selected: boolean;
}) {
  const size = selected ? 42 : 34;
  const scale = useRef(new Animated.Value(selected ? 1 : 0.94)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: selected ? 1 : 0.94,
      useNativeDriver: true,
      speed: 30,
      bounciness: 10,
    }).start();
  }, [selected, scale]);

  return (
    <Animated.View
      style={{
        alignItems: "center",
        justifyContent: "center",
        transform: [{ scale }],
      }}
    >
      <View
        style={[
          styles.markerOuter,
          {
            width: size,
            height: size,
            backgroundColor: color,
            shadowColor: color,
          },
        ]}
      >
        <View
          style={[
            styles.markerInner,
            {
              width: size * 0.5,
              height: size * 0.5,
              borderRadius: size * 0.25,
            },
          ]}
        >
          <Icon size={size * 0.34} color={color} strokeWidth={2.6} />
        </View>
      </View>
      <View
        style={[
          styles.markerArrow,
          { borderTopColor: color, transform: [{ scaleX: 1.4 }] },
        ]}
      />
    </Animated.View>
  );
}

/* ============================================================================
 * FILTER PANEL
 * ========================================================================== */

function FilterPanel({
  activeTypes,
  categoryCounts,
  onToggle,
  onAll,
  onNone,
  onClose,
}: {
  activeTypes: Set<string>;
  categoryCounts: Record<string, number>;
  onToggle: (t: string) => void;
  onAll: () => void;
  onNone: () => void;
  onClose: () => void;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 24,
      bounciness: 4,
    }).start();
  }, [anim]);

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.97, 1],
  });
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-12, 0],
  });

  return (
    <Animated.View
      style={[
        styles.filterWrap,
        { opacity: anim, transform: [{ translateY }, { scale }] },
      ]}
    >
      <View style={styles.filterCard}>
        <LinearGradient
          colors={["rgba(139,92,246,0.12)", "rgba(10,6,24,0.94)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.filterBorder} pointerEvents="none" />

        <View style={styles.filterHeader}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.filterTitle}>Explorer par catégorie</Text>
            <Text style={styles.filterSub}>
              Affiche uniquement ce qui t'intéresse
            </Text>
          </View>
          <Pressable
            onPress={onAll}
            style={({ pressed }) => [
              styles.filterQuickBtn,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.filterQuickTextAll}>Tout</Text>
          </Pressable>
          <Pressable
            onPress={onNone}
            style={({ pressed }) => [
              styles.filterQuickBtn,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.filterQuickTextNone}>Aucun</Text>
          </Pressable>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <X size={15} color="rgba(255,255,255,0.6)" />
          </Pressable>
        </View>

        <ScrollView
          style={{ maxHeight: 380 }}
          contentContainerStyle={{ gap: 8 }}
          showsVerticalScrollIndicator={false}
        >
          {Object.entries(TYPE_CONFIG).map(([key, config]) => {
            const active = activeTypes.has(key);
            const count = categoryCounts[key] ?? 0;
            const Icon = config.Icon;

            return (
              <Pressable
                key={key}
                onPress={() => onToggle(key)}
                style={({ pressed }) => [
                  styles.filterRow,
                  active && styles.filterRowActive,
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.filterRowIcon,
                    {
                      backgroundColor: active
                        ? `${config.color}33`
                        : "rgba(255,255,255,0.05)",
                      borderColor: active
                        ? `${config.color}66`
                        : "rgba(255,255,255,0.08)",
                    },
                  ]}
                >
                  <Icon
                    size={14}
                    color={active ? config.color : "rgba(255,255,255,0.4)"}
                    strokeWidth={2.4}
                  />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={[styles.filterRowTitle, active && { color: "#fff" }]}
                  >
                    {config.label}
                  </Text>
                  <Text style={styles.filterRowCount}>
                    {count} résultat{count > 1 ? "s" : ""}
                  </Text>
                </View>
                {active ? (
                  <Check size={14} color="#C4B5FD" strokeWidth={3} />
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Animated.View>
  );
}

/* ============================================================================
 * SELECTED CARD
 * ========================================================================== */

function SelectedCard({
  pub,
  expanded,
  onToggleExpand,
  onClose,
  onCenter,
  onShare,
}: {
  pub: GeoPublication;
  expanded: boolean;
  onToggleExpand: () => void;
  onClose: () => void;
  onCenter: () => void;
  onShare: () => void;
}) {
  const config = TYPE_CONFIG[pub.type] ?? {
    label: pub.type || "Autre",
    color: "#64748B",
    Icon: DEFAULT_ICON,
  };
  const Icon = config.Icon;

  return (
    <View style={styles.selectedCard}>
      <LinearGradient
        colors={["#0C0A1E", "#0A0818", "#070512"]}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.selectedBorder} pointerEvents="none" />

      {/* Grab handle */}
      <Pressable
        onPress={onToggleExpand}
        style={styles.selectedHandle}
        accessibilityLabel={expanded ? "Réduire" : "Afficher plus"}
      >
        <View style={styles.selectedHandleBar} />
      </Pressable>

      <View style={{ padding: 14 }}>
        {/* Close */}
        <Pressable
          onPress={onClose}
          style={styles.selectedCloseBtn}
          accessibilityLabel="Fermer"
        >
          <X size={14} color="rgba(255,255,255,0.75)" />
        </Pressable>

        <View style={styles.selectedRow}>
          {/* Image */}
          <View
            style={[
              styles.selectedImageWrap,
              { borderColor: `${config.color}44` },
            ]}
          >
            {pub.images?.[0] ? (
              <Image
                source={{ uri: pub.images[0] }}
                style={styles.selectedImage}
                accessibilityLabel={pub.title}
              />
            ) : (
              <View style={styles.selectedImageFallback}>
                <MapPin size={26} color="rgba(255,255,255,0.3)" />
              </View>
            )}
            <LinearGradient
              colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.55)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.selectedImageOverlay}
              pointerEvents="none"
            />
          </View>

          {/* Info */}
          <View style={{ flex: 1, minWidth: 0, paddingRight: 28 }}>
            <View style={styles.selectedBadgeRow}>
              <View
                style={[
                  styles.selectedBadge,
                  {
                    backgroundColor: `${config.color}DD`,
                  },
                ]}
              >
                <Icon size={10} color="#fff" strokeWidth={2.6} />
                <Text style={styles.selectedBadgeText}>{config.label}</Text>
              </View>
              {pub.price ? (
                <Text style={styles.selectedPrice} numberOfLines={1}>
                  {pub.price}
                </Text>
              ) : null}
            </View>

            <Text style={styles.selectedTitle} numberOfLines={2}>
              {pub.title}
            </Text>

            {pub.location ? (
              <View style={styles.selectedLocationRow}>
                <MapPin size={11} color="rgba(255,255,255,0.5)" />
                <Text style={styles.selectedLocation} numberOfLines={1}>
                  {pub.location}
                </Text>
              </View>
            ) : null}

            <View style={styles.selectedStatsRow}>
              <View style={styles.selectedStat}>
                <HeartIcon size={11} color="rgba(255,255,255,0.5)" />
                <Text style={styles.selectedStatText}>{pub.likeCount}</Text>
              </View>
              <View style={styles.selectedStat}>
                <MessageCircle size={11} color="rgba(255,255,255,0.5)" />
                <Text style={styles.selectedStatText}>{pub.commentCount}</Text>
              </View>
              <View style={[styles.selectedStat, { marginLeft: "auto" }]}>
                <Users size={11} color="rgba(255,255,255,0.5)" />
                <Text style={styles.selectedStatText} numberOfLines={1}>
                  {pub.authorName}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Description (expanded) */}
        {expanded ? (
          <FadeUp distance={8}>
            <View style={styles.selectedDescriptionWrap}>
              <Text style={styles.selectedDescription}>
                {cleanText(pub.description) || "Aucune description disponible."}
              </Text>
            </View>
          </FadeUp>
        ) : null}

        {/* Actions */}
        <View style={styles.selectedActions}>
          <Pressable
            onPress={onCenter}
            style={({ pressed }) => [
              styles.selectedPrimaryBtn,
              pressed && styles.pressed,
            ]}
          >
            <LinearGradient
              colors={["#A78BFA", "#7C3AED", "#6366F1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.selectedPrimaryGradient}
            >
              <Navigation size={14} color="#fff" strokeWidth={2.4} />
              <Text style={styles.selectedPrimaryText}>Voir sur la carte</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={onShare}
            style={({ pressed }) => [
              styles.selectedIconBtn,
              pressed && styles.pressed,
            ]}
            accessibilityLabel="Partager"
          >
            <Share2 size={16} color="rgba(255,255,255,0.85)" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.selectedIconBtn,
              styles.selectedIconBtnPrimary,
              pressed && styles.pressed,
            ]}
            accessibilityLabel="Ouvrir"
          >
            <ExternalLink size={16} color="#fff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/* ============================================================================
 * DARK MAP STYLE
 * ========================================================================== */

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0F172A" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0F172A" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94A3B8" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#CBD5E1" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#94A3B8" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#1E293B" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1E293B" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#334155" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#94A3B8" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#334155" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#475569" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1E293B" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#020617" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#64748B" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#020617" }],
  },
];

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#020617",
  },
  pressed: { opacity: 0.85 },

  /* ── Shadows ────────────────────────────────────── */
  topShadow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    zIndex: 10,
  },
  bottomShadow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 10,
  },

  /* ── Header ─────────────────────────────────────── */
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    zIndex: 30,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  closeBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(2,6,23,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  headerPanel: {
    flex: 1,
    minWidth: 0,
    borderRadius: 24,
    backgroundColor: "rgba(2,6,23,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    overflow: "hidden",
  },
  headerPanelInner: {
    padding: 8,
  },
  headerPanelTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  pulsingIconWrap: {
    width: 38,
    height: 38,
  },
  pulsingIconGradient: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.6,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.3,
  },
  headerSub: {
    marginTop: 2,
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 13.5,
    color: "#fff",
    fontWeight: "500",
    paddingVertical: 0,
  },

  /* ── Controls ───────────────────────────────────── */
  controlsCol: {
    position: "absolute",
    right: 12,
    top: 148,
    gap: 10,
    zIndex: 30,
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(2,6,23,0.75)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    overflow: "hidden",
  },
  controlBtnActive: {
    borderColor: "rgba(167,139,250,0.55)",
  },
  controlBtnBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C3AED",
    borderWidth: 2,
    borderColor: "#020617",
  },
  controlBtnBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#fff",
  },

  /* ── Mode switch ────────────────────────────────── */
  modeSwitchWrap: {
    position: "absolute",
    top: 148,
    alignSelf: "center",
    left: "50%",
    transform: [{ translateX: -110 }],
    zIndex: 30,
  },
  modeSwitch: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 18,
    backgroundColor: "rgba(2,6,23,0.78)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  modeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  modeBtnActiveLight: {
    backgroundColor: "#fff",
  },
  modeBtnActiveViolet: {
    backgroundColor: "#7C3AED",
  },
  modeBtnText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 0.1,
  },

  /* ── Filter panel ───────────────────────────────── */
  filterWrap: {
    position: "absolute",
    top: 210,
    left: 12,
    right: 12,
    zIndex: 40,
  },
  filterCard: {
    borderRadius: 26,
    padding: 16,
    overflow: "hidden",
    backgroundColor: "rgba(10,6,24,0.9)",
  },
  filterBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
  },
  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 13.5,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.3,
  },
  filterSub: {
    marginTop: 2,
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "500",
  },
  filterQuickBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  filterQuickTextAll: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#C4B5FD",
    letterSpacing: 0.1,
  },
  filterQuickTextNone: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 0.1,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  filterRowActive: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.14)",
  },
  filterRowIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  filterRowTitle: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.55)",
    letterSpacing: -0.1,
  },
  filterRowCount: {
    marginTop: 2,
    fontSize: 9.5,
    color: "rgba(255,255,255,0.35)",
    fontWeight: "600",
  },

  /* ── Location error ─────────────────────────────── */
  errorWrap: {
    position: "absolute",
    top: 118,
    left: 16,
    right: 16,
    zIndex: 40,
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 20,
    backgroundColor: "rgba(2,6,23,0.9)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.25)",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  errorIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(251,191,36,0.16)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.3)",
  },
  errorTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.2,
  },
  errorSub: {
    marginTop: 2,
    fontSize: 10,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "500",
  },

  /* ── Empty ──────────────────────────────────────── */
  emptyWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    zIndex: 25,
  },
  emptyCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 32,
    padding: 24,
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "rgba(10,6,24,0.92)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
  },
  emptyBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.35)",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.3,
  },
  emptySub: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
    fontWeight: "500",
    maxWidth: 280,
  },
  emptyBtn: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#fff",
  },
  emptyBtnText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.2,
  },

  /* ── Selected card ──────────────────────────────── */
  card: {
    position: "absolute",
    bottom: Platform.OS === "android" ? 12 : 24,
    left: 12,
    right: 12,
    zIndex: 45,
  },
  selectedCard: {
    borderRadius: 32,
    overflow: "hidden",
    backgroundColor: "#0A0818",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.28)",
    shadowColor: "#000",
    shadowOpacity: 0.7,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: -14 },
    elevation: 20,
  },
  selectedBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  selectedHandle: {
    alignItems: "center",
    paddingVertical: 8,
  },
  selectedHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  selectedCloseBtn: {
    position: "absolute",
    top: 10,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    zIndex: 10,
  },
  selectedRow: {
    flexDirection: "row",
    gap: 12,
  },
  selectedImageWrap: {
    width: 96,
    height: 96,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
  },
  selectedImage: {
    width: "100%",
    height: "100%",
  },
  selectedImageFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedImageOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 40,
  },
  selectedBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  selectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  selectedBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.3,
  },
  selectedPrice: {
    fontSize: 10.5,
    fontWeight: "900",
    color: "#C4B5FD",
    letterSpacing: 0.1,
    flexShrink: 1,
  },
  selectedTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.3,
    lineHeight: 19,
  },
  selectedLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  selectedLocation: {
    flex: 1,
    fontSize: 10.5,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500",
  },
  selectedStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  selectedStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  selectedStatText: {
    fontSize: 10.5,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "700",
  },
  selectedDescriptionWrap: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  selectedDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
  selectedActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
  },
  selectedPrimaryBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  selectedPrimaryGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  selectedPrimaryText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.2,
  },
  selectedIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  selectedIconBtnPrimary: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },

  /* ── Status ─────────────────────────────────────── */
  statusWrap: {
    position: "absolute",
    bottom: Platform.OS === "android" ? 12 : 24,
    left: 12,
    zIndex: 30,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "rgba(2,6,23,0.78)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#34D399",
    shadowColor: "#34D399",
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 0.1,
  },
  statusActive: {
    fontSize: 9.5,
    color: "#C4B5FD",
    fontWeight: "700",
  },

  /* ── Marker ─────────────────────────────────────── */
  markerOuter: {
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.95)",
    shadowOpacity: 0.55,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  markerInner: {
    backgroundColor: "rgba(255,255,255,0.96)",
    alignItems: "center",
    justifyContent: "center",
  },
  markerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -2,
  },
});
