// src/pages/home/_components/WeatherBar.tsx

import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  Cloud,
  CloudFog,
  CloudRain,
  CloudSun,
  Droplets,
  MapPin,
  RefreshCw,
  Snowflake,
  Sun,
  Thermometer,
  Umbrella,
  Wind,
  Zap,
} from "lucide-react-native";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type WeatherStatus = "loading" | "ready" | "error";

type WeatherIconType =
  | "sun"
  | "cloud-sun"
  | "cloud"
  | "fog"
  | "rain"
  | "snow"
  | "storm";

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
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const WEATHER_API = "https://api.open-meteo.com/v1/forecast";

const REQUEST_TIMEOUT = 8_000;

const CACHE_KEY = "debrouillepro:weather:v2";

const CACHE_MAX_AGE = 15 * 60 * 1000;

const DEFAULT_LOCATION = {
  latitude: -10.7167,
  longitude: 25.4667,
  city: "Kolwezi",
  country: "RDC",
};

// ─────────────────────────────────────────────────────────────────────────────
// Weather helpers
// ─────────────────────────────────────────────────────────────────────────────

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

function WeatherIcon({
  icon,
  isDay = true,
  size = 18,
}: {
  icon: WeatherIconType;
  isDay?: boolean;
  size?: number;
}) {
  const props = {
    size,
    strokeWidth: 1.9,
  };

  switch (icon) {
    case "sun":
      return <Sun {...props} color="#fcd34d" />;

    case "cloud-sun":
      return <CloudSun {...props} color="#7dd3fc" />;

    case "cloud":
      return <Cloud {...props} color="#cbd5e1" />;

    case "fog":
      return <CloudFog {...props} color="#cbd5e1" />;

    case "rain":
      return <CloudRain {...props} color="#7dd3fc" />;

    case "snow":
      return <Snowflake {...props} color="#a5f3fc" />;

    case "storm":
      return <Zap {...props} color="#c4b5fd" />;

    default:
      return isDay ? (
        <Sun {...props} color="#fcd34d" />
      ) : (
        <Cloud {...props} color="#cbd5e1" />
      );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Network helpers
// ─────────────────────────────────────────────────────────────────────────────

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT);

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
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Cache
// ─────────────────────────────────────────────────────────────────────────────

async function readCachedWeather(): Promise<WeatherData | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);

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

async function writeCachedWeather(data: WeatherData): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Le cache est optionnel.
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Reverse geocoding
// ─────────────────────────────────────────────────────────────────────────────

async function resolveCity(
  latitude: number,
  longitude: number,
): Promise<{
  city: string;
  country?: string;
}> {
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

// ─────────────────────────────────────────────────────────────────────────────
// Weather request
// ─────────────────────────────────────────────────────────────────────────────

async function fetchWeather(
  latitude: number,
  longitude: number,
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

  const location = await resolveCity(latitude, longitude);

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

// ─────────────────────────────────────────────────────────────────────────────
// Location
// ─────────────────────────────────────────────────────────────────────────────

async function getCurrentCoordinates(): Promise<{
  latitude: number;
  longitude: number;
}> {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (permission.status !== "granted") {
    throw new Error("Permission de localisation refusée");
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function WeatherBar() {
  const [weather, setWeather] = useState<WeatherState>({
    status: "loading",
    data: null,
  });

  const [refreshing, setRefreshing] = useState(false);

  const mountedRef = useRef(true);

  const loadWeather = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = await readCachedWeather();

      if (cached && mountedRef.current) {
        setWeather({
          status: "ready",
          data: cached,
        });

        return;
      }
    }

    if (mountedRef.current) {
      setWeather((current) => ({
        status: "loading",
        data: current.data,
      }));
    }

    const loadFromCoordinates = async (latitude: number, longitude: number) => {
      const data = await fetchWeather(latitude, longitude);

      await writeCachedWeather(data);

      if (!mountedRef.current) {
        return;
      }

      setWeather({
        status: "ready",
        data,
      });
    };

    try {
      const coordinates = await getCurrentCoordinates();

      await loadFromCoordinates(coordinates.latitude, coordinates.longitude);
    } catch {
      try {
        await loadFromCoordinates(
          DEFAULT_LOCATION.latitude,
          DEFAULT_LOCATION.longitude,
        );
      } catch {
        if (!mountedRef.current) {
          return;
        }

        const cached = await readCachedWeather();

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
    }
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // Initial load
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;

    void loadWeather(false);

    return () => {
      mountedRef.current = false;
    };
  }, [loadWeather]);

  // ───────────────────────────────────────────────────────────────────────────
  // Manual refresh
  // ───────────────────────────────────────────────────────────────────────────

  const handleRefresh = useCallback(async () => {
    if (refreshing) {
      return;
    }

    setRefreshing(true);

    try {
      await loadWeather(true);
    } finally {
      if (mountedRef.current) {
        setRefreshing(false);
      }
    }
  }, [loadWeather, refreshing]);

  // ───────────────────────────────────────────────────────────────────────────
  // Loading
  // ───────────────────────────────────────────────────────────────────────────

  if (weather.status === "loading" && !weather.data) {
    return (
      <View className="px-4 pb-2">
        <View className="flex-row items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
          <ActivityIndicator size="small" color="#c4b5fd" />

          <Text className="text-[11px] font-medium text-white/50">
            Localisation et météo...
          </Text>
        </View>
      </View>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Error
  // ───────────────────────────────────────────────────────────────────────────

  if (weather.status === "error" && !weather.data) {
    return (
      <View className="px-4 pb-2">
        <Pressable
          onPress={() => void handleRefresh()}
          disabled={refreshing}
          className="flex-row items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 active:opacity-70"
          accessibilityRole="button"
          accessibilityLabel="Réessayer de charger la météo"
        >
          <MapPin size={14} color="rgba(255,255,255,0.45)" />

          <Text className="flex-1 text-[11px] font-medium text-white/50">
            Météo indisponible
          </Text>

          <RefreshCw size={13} color="rgba(255,255,255,0.45)" />
        </Pressable>
      </View>
    );
  }

  const data = weather.data;

  if (!data) {
    return null;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Ready
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <View className="px-4 pb-2">
      <Pressable
        onPress={() => void handleRefresh()}
        disabled={refreshing}
        className="flex-row items-center gap-2 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 active:opacity-80"
        accessibilityRole="button"
        accessibilityLabel={`Météo à ${data.city}: ${data.temperature} degrés, ${data.description}. Appuyez pour actualiser.`}
      >
        {/* Weather icon */}
        <View className="h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
          {refreshing ? (
            <ActivityIndicator size="small" color="#c4b5fd" />
          ) : (
            <WeatherIcon icon={data.icon} isDay={data.isDay} size={18} />
          )}
        </View>

        {/* Main weather information */}
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-[14px] font-bold text-white">
              {data.temperature}°C
            </Text>

            <View className="h-1 w-1 rounded-full bg-white/30" />

            <Text
              numberOfLines={1}
              className="flex-1 text-[11px] font-medium text-white/60"
            >
              {data.description}
            </Text>
          </View>

          <View className="mt-1 flex-row items-center gap-1">
            <MapPin size={10} strokeWidth={2} color="rgba(255,255,255,0.4)" />

            <Text
              numberOfLines={1}
              className="flex-1 text-[10px] font-medium text-white/45"
            >
              {data.city}
              {data.country ? ` · ${data.country}` : ""}
            </Text>
          </View>
        </View>

        {/* Secondary metrics */}
        <View className="flex-row items-center gap-2">
          {typeof data.feelsLike === "number" && (
            <View className="hidden flex-row items-center gap-1 md:flex">
              <Thermometer size={12} color="rgba(255,255,255,0.4)" />

              <Text className="text-[10px] text-white/45">
                {data.feelsLike}°
              </Text>
            </View>
          )}

          {typeof data.humidity === "number" && (
            <View className="flex-row items-center gap-1">
              <Droplets size={12} color="rgba(125,211,252,0.8)" />

              <Text className="text-[10px] text-white/45">
                {data.humidity}%
              </Text>
            </View>
          )}

          {typeof data.windSpeed === "number" && (
            <View className="hidden flex-row items-center gap-1 lg:flex">
              <Wind size={12} color="rgba(255,255,255,0.4)" />

              <Text className="text-[10px] text-white/45">
                {data.windSpeed}
              </Text>
            </View>
          )}

          {typeof data.precipitationProbability === "number" && (
            <View className="hidden flex-row items-center gap-1 lg:flex">
              <Umbrella size={12} color="rgba(196,181,253,0.8)" />

              <Text className="text-[10px] text-white/45">
                {data.precipitationProbability}%
              </Text>
            </View>
          )}
        </View>

        {/* Refresh */}
        <View className="ml-1">
          <RefreshCw
            size={13}
            color={refreshing ? "#c4b5fd" : "rgba(255,255,255,0.35)"}
          />
        </View>
      </Pressable>

      {Platform.OS === "web" ? null : null}
    </View>
  );
}
