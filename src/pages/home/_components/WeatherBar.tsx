// src/pages/home/_components/WeatherBar.tsx

import {
  View,
  Pressable,
  Text,
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
  type ViewStyle,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";

import {
  Cloud,
  CloudFog,
  CloudRain,
  CloudSun,
  Droplets,
  Loader2,
  MapPin,
  RefreshCw,
  Snowflake,
  Sun,
  Thermometer,
  Umbrella,
  Wind,
  Zap,
} from "lucide-react-native";

/* ============================================================================
 * TYPES
 * ========================================================================== */

type WeatherStatus = "loading" | "ready" | "error";

interface WeatherData {
  temperature: number;
  feelsLike?: number;
  humidity?: number;
  windSpeed?: number;
  precipitationProbability?: number;
  description: string;
  icon: WeatherIconType;
  city: string;
  country?: string;
  latitude: number;
  longitude: number;
  isDay?: boolean;
  updatedAt: number;
}

interface WeatherState {
  status: WeatherStatus;
  data: WeatherData | null;
  error?: string;
}

type WeatherIconType =
  | "sun"
  | "cloud-sun"
  | "cloud"
  | "fog"
  | "rain"
  | "snow"
  | "storm";

interface OpenMeteoResponse {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    precipitation?: number;
    weather_code?: number;
    is_day?: number;
  };
  hourly?: {
    precipitation_probability?: number[];
  };
}

interface ReverseGeocodeResponse {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
}

/* ============================================================================
 * CONFIG + STORAGE SHIM
 * ========================================================================== */

const isBrowser = typeof window !== "undefined";

const WEATHER_API = "https://api.open-meteo.com/v1/forecast";
const REQUEST_TIMEOUT = 8_000;
const CACHE_KEY = "debrouillepro:weather:v2";
const CACHE_MAX_AGE = 15 * 60 * 1000;

const memoryStore: Record<string, string> = {};

const store = {
  get(key: string): string | null {
    if (isBrowser) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    }

    return memoryStore[key] ?? null;
  },

  set(key: string, value: string) {
    if (isBrowser) {
      try {
        window.localStorage.setItem(key, value);
      } catch {}
    } else {
      memoryStore[key] = value;
    }
  },
};

/* ============================================================================
 * WEATHER HELPERS
 * ========================================================================== */

function getWeatherMeta(code: number): {
  description: string;
  icon: WeatherIconType;
} {
  if (code === 0) {
    return {
      description: "Ensoleillé",
      icon: "sun",
    };
  }

  if (code === 1 || code === 2) {
    return {
      description: "Partiellement nuageux",
      icon: "cloud-sun",
    };
  }

  if (code === 3) {
    return {
      description: "Couvert",
      icon: "cloud",
    };
  }

  if (code >= 45 && code <= 48) {
    return {
      description: "Brouillard",
      icon: "fog",
    };
  }

  if (code >= 51 && code <= 67) {
    return {
      description: "Pluie",
      icon: "rain",
    };
  }

  if (code >= 71 && code <= 77) {
    return {
      description: "Neige",
      icon: "snow",
    };
  }

  if (code >= 80 && code <= 82) {
    return {
      description: "Averses",
      icon: "rain",
    };
  }

  if (code >= 95) {
    return {
      description: "Orage",
      icon: "storm",
    };
  }

  return {
    description: "Variable",
    icon: "cloud-sun",
  };
}

type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

function getWeatherIcon(
  icon: WeatherIconType,
  isDay = true,
  size = 17,
): ReactNode {
  const props: IconProps = {
    size,
    strokeWidth: 1.9,
  };

  switch (icon) {
    case "sun":
      return <Sun {...props} color="#FCD34D" />;

    case "cloud-sun":
      return <CloudSun {...props} color="#7DD3FC" />;

    case "cloud":
      return <Cloud {...props} color="#CBD5E1" />;

    case "fog":
      return <CloudFog {...props} color="#94A3B8" />;

    case "rain":
      return <CloudRain {...props} color="#7DD3FC" />;

    case "snow":
      return <Snowflake {...props} color="#A5F3FC" />;

    case "storm":
      return <Zap {...props} color="#C4B5FD" />;

    default:
      return isDay ? (
        <Sun {...props} color="#FCD34D" />
      ) : (
        <Cloud {...props} color="#CBD5E1" />
      );
  }
}

function getWeatherAccent(icon: WeatherIconType): string {
  switch (icon) {
    case "sun":
      return "#FCD34D";

    case "cloud-sun":
      return "#7DD3FC";

    case "cloud":
      return "#CBD5E1";

    case "fog":
      return "#94A3B8";

    case "rain":
      return "#38BDF8";

    case "snow":
      return "#A5F3FC";

    case "storm":
      return "#C4B5FD";

    default:
      return "#7DD3FC";
  }
}

/* ============================================================================
 * NETWORK
 * ========================================================================== */

async function fetchWithTimeout(
  url: string,
  signal?: AbortSignal,
): Promise<Response> {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT);

  const abortHandler = () => {
    controller.abort();
  };

  signal?.addEventListener("abort", abortHandler, {
    once: true,
  });

  try {
    return await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });
  } finally {
    clearTimeout(timeout);

    signal?.removeEventListener("abort", abortHandler);
  }
}

/* ============================================================================
 * CACHE
 * ========================================================================== */

function readCachedWeather(): WeatherData | null {
  try {
    const raw = store.get(CACHE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as WeatherData;

    if (
      !parsed ||
      typeof parsed.updatedAt !== "number" ||
      Date.now() - parsed.updatedAt > CACHE_MAX_AGE
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeCachedWeather(data: WeatherData): void {
  try {
    store.set(CACHE_KEY, JSON.stringify(data));
  } catch {}
}

/* ============================================================================
 * REVERSE GEOCODING
 * ========================================================================== */

async function resolveCity(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<{ city: string; country?: string }> {
  try {
    const params = new URLSearchParams({
      format: "json",
      lat: latitude.toFixed(5),
      lon: longitude.toFixed(5),
      zoom: "10",
      addressdetails: "1",
    });

    const response = await fetchWithTimeout(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      signal,
    );

    if (!response.ok) {
      throw new Error("Reverse geocoding failed");
    }

    const data = (await response.json()) as ReverseGeocodeResponse;
    const address = data.address;

    const city =
      address?.city ??
      address?.town ??
      address?.village ??
      address?.municipality ??
      address?.state ??
      "Ma position";

    return {
      city,
      country: address?.country,
    };
  } catch {
    return {
      city: "Ma position",
    };
  }
}

/* ============================================================================
 * WEATHER FETCH
 * ========================================================================== */

async function fetchWeather(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: latitude.toFixed(5),
    longitude: longitude.toFixed(5),
    current: [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "wind_speed_10m",
      "precipitation",
      "weather_code",
      "is_day",
    ].join(","),
    hourly: "precipitation_probability",
    forecast_days: "1",
    timezone: "auto",
  });

  const weatherResponse = await fetchWithTimeout(
    `${WEATHER_API}?${params.toString()}`,
    signal,
  );

  if (!weatherResponse.ok) {
    throw new Error(`Weather API error: ${weatherResponse.status}`);
  }

  const weatherData = (await weatherResponse.json()) as OpenMeteoResponse;

  const current = weatherData.current;

  if (
    !current ||
    typeof current.temperature_2m !== "number" ||
    typeof current.weather_code !== "number"
  ) {
    throw new Error("Invalid weather response");
  }

  const weatherMeta = getWeatherMeta(current.weather_code);

  const location = await resolveCity(latitude, longitude, signal);

  const precipitationProbability =
    weatherData.hourly?.precipitation_probability?.[0];

  return {
    temperature: Math.round(current.temperature_2m),

    feelsLike:
      typeof current.apparent_temperature === "number"
        ? Math.round(current.apparent_temperature)
        : undefined,

    humidity:
      typeof current.relative_humidity_2m === "number"
        ? Math.round(current.relative_humidity_2m)
        : undefined,

    windSpeed:
      typeof current.wind_speed_10m === "number"
        ? Math.round(current.wind_speed_10m)
        : undefined,

    precipitationProbability:
      typeof precipitationProbability === "number"
        ? Math.round(precipitationProbability)
        : undefined,

    description: weatherMeta.description,
    icon: weatherMeta.icon,

    city: location.city,
    country: location.country,

    latitude,
    longitude,

    isDay: current.is_day !== 0,

    updatedAt: Date.now(),
  };
}

/* ============================================================================
 * PREMIUM HELPERS
 * ========================================================================== */

function FadeUp({
  delay = 0,
  distance = 8,
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
      duration: 460,
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
 * PULSING WEATHER ICON
 * ========================================================================== */

function PulsingWeatherIcon({
  icon,
  isDay,
  refreshing,
  accent,
}: {
  icon: WeatherIconType;
  isDay: boolean;
  refreshing: boolean;
  accent: string;
}) {
  const pulse = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (refreshing) {
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),

        Animated.timing(pulse, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [refreshing, pulse]);

  useEffect(() => {
    if (!refreshing) {
      spin.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [refreshing, spin]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });

  const rotation = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.iconWrap}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.iconHalo,
          {
            backgroundColor: accent,
            opacity: 0.28,
            transform: [{ scale }],
          },
        ]}
      />

      <LinearGradient
        colors={[`${accent}22`, "rgba(255,255,255,0.02)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconGradient}
      >
        {refreshing ? (
          <Animated.View
            style={{
              transform: [{ rotate: rotation }],
            }}
          >
            <RefreshCw size={15} color="#C4B5FD" strokeWidth={2.4} />
          </Animated.View>
        ) : (
          <Animated.View
            style={{
              transform: [{ scale }],
            }}
          >
            {getWeatherIcon(icon, isDay, 17)}
          </Animated.View>
        )}
      </LinearGradient>
    </View>
  );
}

/* ============================================================================
 * METRIC PILL
 * ========================================================================== */

function MetricPill({
  Icon,
  value,
  color,
}: {
  Icon: ComponentType<IconProps>;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.metricPill}>
      <Icon size={12} color={color} strokeWidth={2.2} />

      <Text style={styles.metricPillText}>{value}</Text>
    </View>
  );
}

/* ============================================================================
 * MAIN COMPONENT
 * ========================================================================== */

export default function WeatherBar() {
  const { width } = useWindowDimensions();

  const showMetrics = width >= 480;

  const [weather, setWeather] = useState<WeatherState>(() => {
    const cached = readCachedWeather();

    if (cached) {
      return {
        status: "ready",
        data: cached,
      };
    }

    return {
      status: "loading",
      data: null,
    };
  });

  const [refreshing, setRefreshing] = useState(false);

  const mountedRef = useRef(true);

  /* ───── load weather ───── */

  const loadWeather = useCallback(
    async (forceRefresh = false, signal?: AbortSignal) => {
      if (!forceRefresh) {
        const cached = readCachedWeather();

        if (cached) {
          if (mountedRef.current) {
            setWeather({
              status: "ready",
              data: cached,
            });
          }

          return;
        }
      }

      if (mountedRef.current) {
        setWeather((current) => ({
          status: "loading",
          data: current.data,
        }));
      }

      const loadFromCoordinates = async (
        latitude: number,
        longitude: number,
      ) => {
        const data = await fetchWeather(latitude, longitude, signal);

        writeCachedWeather(data);

        if (!mountedRef.current) {
          return;
        }

        setWeather({
          status: "ready",
          data,
        });
      };

      try {
        /*
         * IMPORTANT:
         * We never use an estimated or hardcoded location.
         * If geolocation is unavailable, we fail honestly.
         */
        if (
          !isBrowser ||
          typeof navigator === "undefined" ||
          !("geolocation" in navigator)
        ) {
          if (!mountedRef.current) {
            return;
          }

          setWeather({
            status: "error",
            data: null,
            error: "Localisation indisponible",
          });

          return;
        }

        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false,
              timeout: 7_000,
              maximumAge: 10 * 60 * 1000,
            });
          },
        );

        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          throw new Error("Invalid geolocation coordinates");
        }

        await loadFromCoordinates(latitude, longitude);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        /*
         * If fresh geolocation/weather fails, only use a
         * previously cached weather value when it is still valid.
         * No artificial location is ever introduced.
         */
        if (!mountedRef.current) {
          return;
        }

        const cached = readCachedWeather();

        if (cached) {
          setWeather({
            status: "ready",
            data: cached,
          });
        } else {
          setWeather({
            status: "error",
            data: null,
            error: "Météo indisponible",
          });
        }
      }
    },
    [],
  );

  /* ───── initial load ───── */

  useEffect(() => {
    mountedRef.current = true;

    const controller = new AbortController();

    void loadWeather(false, controller.signal);

    return () => {
      mountedRef.current = false;
      controller.abort();
    };
  }, [loadWeather]);

  /* ───── refresh ───── */

  const handleRefresh = useCallback(async () => {
    if (refreshing) {
      return;
    }

    setRefreshing(true);

    const controller = new AbortController();

    try {
      await loadWeather(true, controller.signal);
    } finally {
      if (mountedRef.current) {
        setRefreshing(false);
      }

      controller.abort();
    }
  }, [loadWeather, refreshing]);

  /* ========================================================================
   * LOADING
   * ====================================================================== */

  if (weather.status === "loading" && !weather.data) {
    return (
      <FadeUp distance={6} style={styles.root}>
        <View style={styles.loadingCard}>
          <LinearGradient
            colors={["rgba(139,92,246,0.12)", "rgba(255,255,255,0.02)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.loadingBorder} pointerEvents="none" />

          <LoadingSpinner />

          <Text style={styles.loadingText}>Localisation et météo…</Text>
        </View>
      </FadeUp>
    );
  }

  /* ========================================================================
   * ERROR
   * ====================================================================== */

  if (weather.status === "error" && !weather.data) {
    return (
      <FadeUp distance={6} style={styles.root}>
        <Pressable
          onPress={handleRefresh}
          accessibilityLabel="Réessayer de charger la météo"
          style={({ pressed }) => [
            styles.errorCard,
            pressed && { opacity: 0.8 },
          ]}
        >
          <LinearGradient
            colors={["rgba(239,68,68,0.12)", "rgba(255,255,255,0.02)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.errorBorder} pointerEvents="none" />

          <MapPin size={14} color="rgba(255,255,255,0.5)" strokeWidth={2.2} />

          <Text style={styles.errorText}>
            {weather.error ?? "Météo indisponible"}
          </Text>

          <RefreshCw
            size={13}
            color="rgba(255,255,255,0.5)"
            strokeWidth={2.2}
          />
        </Pressable>
      </FadeUp>
    );
  }

  const data = weather.data;

  if (!data) {
    return null;
  }

  const accent = getWeatherAccent(data.icon);

  /* ========================================================================
   * READY
   * ====================================================================== */

  return (
    <FadeUp distance={-4} style={styles.root}>
      <Pressable
        onPress={handleRefresh}
        disabled={refreshing}
        accessibilityLabel={`Météo à ${data.city}: ${data.temperature} degrés, ${data.description}. Cliquer pour actualiser.`}
        style={({ pressed }) => [
          styles.card,
          {
            borderColor: `${accent}33`,
          },
          pressed && !refreshing && styles.cardPressed,
        ]}
      >
        {/* Base gradient */}
        <LinearGradient
          colors={[
            "rgba(12,8,30,0.55)",
            "rgba(5,7,20,0.35)",
            "rgba(8,5,24,0.55)",
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Ambient weather glow */}
        <View
          pointerEvents="none"
          style={[
            styles.ambientGlow,
            {
              backgroundColor: accent,
            },
          ]}
        />

        {/* Border ring */}
        <View
          style={[
            styles.cardBorder,
            {
              borderColor: `${accent}30`,
            },
          ]}
          pointerEvents="none"
        />

        {/* Top highlight */}
        <View style={styles.topHighlight} pointerEvents="none">
          <LinearGradient
            colors={[
              "rgba(255,255,255,0)",
              "rgba(255,255,255,0.12)",
              "rgba(255,255,255,0)",
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ flex: 1 }}
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Icon */}
          <PulsingWeatherIcon
            icon={data.icon}
            isDay={data.isDay ?? true}
            refreshing={refreshing}
            accent={accent}
          />

          {/* Main info */}
          <View style={styles.infoCol}>
            <View style={styles.infoTopRow}>
              <Text style={styles.temperature}>{data.temperature}°C</Text>

              <View style={styles.dot} />

              <Text style={styles.description} numberOfLines={1}>
                {data.description}
              </Text>
            </View>

            <View style={styles.locationRow}>
              <MapPin
                size={10}
                color="rgba(255,255,255,0.4)"
                strokeWidth={2.2}
              />

              <Text style={styles.locationText} numberOfLines={1}>
                {data.city}
                {data.country ? ` · ${data.country}` : ""}
              </Text>
            </View>
          </View>

          {/* Metrics */}
          {showMetrics ? (
            <View style={styles.metricsRow}>
              {typeof data.feelsLike === "number" ? (
                <MetricPill
                  Icon={Thermometer}
                  value={`Ressenti ${data.feelsLike}°`}
                  color="rgba(255,255,255,0.5)"
                />
              ) : null}

              {typeof data.humidity === "number" ? (
                <MetricPill
                  Icon={Droplets}
                  value={`${data.humidity}%`}
                  color="#7DD3FC"
                />
              ) : null}

              {typeof data.windSpeed === "number" ? (
                <MetricPill
                  Icon={Wind}
                  value={`${data.windSpeed} km/h`}
                  color="rgba(255,255,255,0.5)"
                />
              ) : null}

              {typeof data.precipitationProbability === "number" ? (
                <MetricPill
                  Icon={Umbrella}
                  value={`${data.precipitationProbability}%`}
                  color="#C4B5FD"
                />
              ) : null}
            </View>
          ) : null}

          {/* Refresh affordance */}
          <View style={styles.refreshAffordance}>
            <RefreshCw
              size={12}
              color="rgba(255,255,255,0.35)"
              strokeWidth={2.4}
            />
          </View>
        </View>
      </Pressable>
    </FadeUp>
  );
}

/* ============================================================================
 * LOADING SPINNER
 * ========================================================================== */

function LoadingSpinner() {
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [rotate]);

  const rotation = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={{
        transform: [{ rotate: rotation }],
      }}
    >
      <Loader2 size={14} color="#C4B5FD" strokeWidth={2.4} />
    </Animated.View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 8,
  },

  /* ── Loading card ───────────────────────────────── */

  loadingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(10,6,24,0.5)",
  },

  loadingBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  loadingText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 0.1,
  },

  /* ── Error card ─────────────────────────────────── */

  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(10,6,24,0.5)",
  },

  errorBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.28)",
  },

  errorText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 0.1,
  },

  /* ── Main card ──────────────────────────────────── */

  card: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(10,6,24,0.5)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 6,
  },

  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },

  cardBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
  },

  ambientGlow: {
    position: "absolute",
    top: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 9999,
    opacity: 0.18,
  },

  topHighlight: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    height: 1,
  },

  /* ── Content ────────────────────────────────────── */

  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  /* ── Icon ───────────────────────────────────────── */

  iconWrap: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  iconHalo: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 12,
  },

  iconGradient: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  /* ── Info ───────────────────────────────────────── */

  infoCol: {
    flex: 1,
    minWidth: 0,
  },

  infoTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  temperature: {
    fontSize: 13.5,
    fontWeight: "900",
    color: "rgba(255,255,255,0.92)",
    letterSpacing: -0.3,
  },

  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255,255,255,0.25)",
  },

  description: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: "600",
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 0.1,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },

  locationText: {
    flex: 1,
    fontSize: 10.5,
    fontWeight: "600",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 0.1,
  },

  /* ── Metrics ────────────────────────────────────── */

  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },

  metricPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  metricPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 0.1,
  },

  /* ── Refresh affordance ─────────────────────────── */

  refreshAffordance: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    flexShrink: 0,
  },
});
