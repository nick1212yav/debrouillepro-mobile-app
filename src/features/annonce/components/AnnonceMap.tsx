import { View, Text, Pressable, Linking } from "react-native";
import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Loader2, Maximize2 } from "lucide-react-native";
import { toast } from "sonner";

interface Props {
  location?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
}

export function AnnonceMap({ location, latitude, longitude, address }: Props) {
  const mapRef = useRef<View>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);

  // Calcul de la distance entre deux points (formule de Haversine)
  const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Chargement de la carte Leaflet
  useEffect(() => {
    if (!latitude || !longitude) return;
    if (!mapRef.current) return;
    let isMounted = true;

    const loadMap = async () => {
      try {
        const L = await import("leaflet");
        await import("leaflet/dist/leaflet.css");
        if (!isMounted || !mapRef.current) return;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const map = L.map(mapRef.current, {
          center: [latitude, longitude],
          zoom: 14,
          zoomControl: false,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap",
          maxZoom: 19,
        }).addTo(map);

        // Icône personnalisée pour le marqueur
        const icon = L.divIcon({
          className: "custom-marker",
          html: `<div style="
            background: #F97316;
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(249,115,22,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="transform: rotate(45deg); color: white; font-size: 14px;">📍</div>
          </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        });

        const marker = L.marker([latitude, longitude], { icon }).addTo(map);
        const popupContent = `
          <div style="font-family: system-ui; padding: 4px 0; max-width: 200px;">
            <strong style="color: #1a1a2e; display: block; margin-bottom: 2px;">${address || location || "Emplacement"}</strong>
            ${distance !== null ? `<span style="color: #666; font-size: 11px;">📍 À ${distance.toFixed(1)} km de vous</span>` : ""}
            <br/>
            <span style="color: #999; font-size: 10px;">${latitude.toFixed(5)}, ${longitude.toFixed(5)}</span>
          </div>
        `;
        marker.bindPopup(popupContent);
        markerRef.current = marker;

        // Ajouter la position utilisateur si disponible
        if (userLocation) {
          const userIcon = L.divIcon({
            className: "user-marker",
            html: `<div style="
              background: #3B82F6;
              width: 18px;
              height: 18px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(59,130,246,0.4);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="
                width: 6px;
                height: 6px;
                background: white;
                border-radius: 50%;
              "></div>
            </div>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          });
          const userMarker = L.marker([userLocation.lat, userLocation.lng], {
            icon: userIcon,
          }).addTo(map);
          userMarker.bindPopup("Votre position");

          // Calculer la distance
          const dist = calculateDistance(
            latitude,
            longitude,
            userLocation.lat,
            userLocation.lng,
          );
          setDistance(dist);
          // Mettre à jour la popup du marqueur
          const updatedPopup = `
            <div style="font-family: system-ui; padding: 4px 0; max-width: 200px;">
              <strong style="color: #1a1a2e; display: block; margin-bottom: 2px;">${address || location || "Emplacement"}</strong>
              <span style="color: #666; font-size: 11px;">📍 À ${dist.toFixed(1)} km de vous</span>
              <br/>
              <span style="color: #999; font-size: 10px;">${latitude.toFixed(5)}, ${longitude.toFixed(5)}</span>
            </div>
          `;
          marker.setPopupContent(updatedPopup);
        }

        // Ouvrir le popup après un court délai
        setTimeout(() => {
          if (markerRef.current) {
            markerRef.current.openPopup();
          }
        }, 500);

        mapInstanceRef.current = map;
        map.invalidateSize();
      } catch (error) {
        console.error("Erreur de chargement de la carte:", error);
      }
    };
    loadMap();
    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, location, address, userLocation, distance]);

  const detectUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Géolocalisation non supportée");
      return;
    }
    setLoadingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLoadingUser(false);
        toast.success("Position détectée");
      },
      () => {
        toast.error("Impossible de détecter votre position");
        setLoadingUser(false);
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  };

  const openGoogleMaps = () => {
    if (latitude && longitude) {
      Linking.openURL(String(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`));
    }
  };

  const openWaze = () => {
    if (latitude && longitude) {
      Linking.openURL(String(`https://www.waze.com/ul?ll=${latitude},${longitude}&navigate=yes`));
    }
  };

  // Si pas de coordonnées, afficher un message
  if (!latitude || !longitude) {
    return (
      <View className="bg-white/5 rounded-2xl p-4 space-y-2"><Text className="text-sm font-medium text-white/50">Localisation</Text><View className="mt-2 rounded-xl h-48 flex flex-col items-center justify-center bg-white/5 border border-white/10 gap-2"><MapPin size={32} className="text-white/20" /><Text className="text-white/30 text-sm">{location || "Carte non disponible"}</Text><Text className="text-white/20 text-xs">Ajoutez une adresse pour activer la carte
          </Text></View></View>
    );
  }

  return (
    <View className="space-y-2"><View className="flex items-center justify-between"><Text className="text-sm font-medium text-white/50">Localisation</Text><View className="flex gap-2 flex-wrap"><Pressable onPress={detectUserLocation} disabled={loadingUser} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-white/60 transition-colors bg-white/5 disabled:opacity-50">{loadingUser ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Navigation size={12} />
            )}{loadingUser ? "..." : "Me localiser"}</Pressable><Pressable onPress={openGoogleMaps} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-white/60 transition-colors bg-white/5"><MapPin size={12} /><Text>Google Maps</Text></Pressable><Pressable onPress={openWaze} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-white/60 transition-colors bg-white/5"><Navigation size={12} /><Text>Waze</Text></Pressable></View></View><View className="rounded-xl overflow-hidden h-52 relative"><View ref={mapRef} className="w-full h-full" />{}<View className="absolute bottom-2 right-2 flex flex-col gap-1"><Pressable onPress={() => {
              if (mapInstanceRef.current) {
                const map = mapInstanceRef.current;
                map.setZoom(map.getZoom() + 1);
              }
            }} className="w-8 h-8 rounded-lg bg-black/60 text-white transition-colors flex items-center justify-center text-lg font-bold"><Text>+</Text></Pressable><Pressable onPress={() => {
              if (mapInstanceRef.current) {
                const map = mapInstanceRef.current;
                map.setZoom(map.getZoom() - 1);
              }
            }} className="w-8 h-8 rounded-lg bg-black/60 text-white transition-colors flex items-center justify-center text-lg font-bold"><Text>−</Text></Pressable></View>{userLocation && (
          <View className="absolute bottom-2 left-2 bg-black/60 text-green-400 text-[10px] px-2 py-1 rounded-full flex items-center gap-1"><View className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /><Text>Vous êtes ici</Text></View>
        )}<View className="absolute bottom-2 right-[56px] bg-black/60 text-white/60 text-[10px] px-2 py-1 rounded-full"><Text>OpenStreetMap</Text></View></View></View>
  );
}
