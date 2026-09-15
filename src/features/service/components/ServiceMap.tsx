import { View, Text, Pressable, Linking } from "react-native";
import { useEffect, useRef } from "react";
import { MapPin, Navigation } from "lucide-react-native";

interface Props {
  location?: string;
  latitude?: number;
  longitude?: number;
}

export function ServiceMap({ location, latitude, longitude }: Props) {
  const mapRef = useRef<View>(null);
  const mapInstanceRef = useRef<any>(null);

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
          zoomControl: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap",
          maxZoom: 19,
        }).addTo(map);

        const icon = L.divIcon({
          className: "custom-marker",
          html: `<div style="
            background: #F97316;
            width: 28px;
            height: 28px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(249,115,22,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="transform: rotate(45deg); color: white; font-size: 12px;">🔧</div>
          </div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 28],
          popupAnchor: [0, -28],
        });

        const marker = L.marker([latitude, longitude], { icon }).addTo(map);
        marker.bindPopup(`<strong>${location || "Emplacement"}</strong>`);

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
  }, [latitude, longitude, location]);

  if (!latitude || !longitude) {
    return (
      <View className="bg-white/5 rounded-2xl p-4"><Text className="text-sm font-medium text-white/50">Localisation</Text><View className="mt-2 rounded-xl h-48 flex items-center justify-center bg-white/5 border border-white/10"><View className="flex items-center gap-2 text-white/30"><MapPin size={16} /><Text className="text-sm">{location || "Carte non disponible"}</Text></View></View></View>
    );
  }

  return (
    <View className="bg-white/5 rounded-2xl p-4 space-y-2"><View className="flex items-center justify-between"><Text className="text-sm font-medium text-white/50">Localisation</Text><Pressable onPress={() => {
            Linking.openURL(String(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`));
          }} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-white/60 transition-colors bg-white/5"><Navigation size={12} /><Text>Itinéraire</Text></Pressable></View><View className="rounded-xl overflow-hidden h-48 relative"><View ref={mapRef} className="w-full h-full" /><View className="absolute bottom-2 right-2 bg-black/60 text-white/60 text-[10px] px-2 py-1 rounded-full"><Text>OpenStreetMap</Text></View></View></View>
  );
}
