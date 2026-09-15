import { View, Text, Pressable, Linking } from "react-native";
import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react-native";

interface Props {
  city: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export function PropertyMap({ city, address, latitude, longitude }: Props) {
  const mapRef = useRef<View>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasCoords = latitude && longitude;

  // Charger Leaflet dynamiquement (évite les problèmes SSR)
  useEffect(() => {
    if (!hasCoords) {
      setIsLoading(false);
      return;
    }
    if (!mapRef.current) return;

    let isMounted = true;

    const loadMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Charger Leaflet et son CSS
        const L = await import("leaflet");
        await import("leaflet/dist/leaflet.css");

        if (!isMounted || !mapRef.current) return;

        // Nettoyer l'ancienne carte si elle existe
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        // Créer la carte
        const map = L.map(mapRef.current, {
          center: [latitude!, longitude!],
          zoom: 15,
          zoomControl: false, // on ajoutera un contrôle personnalisé plus tard
          attributionControl: true,
        });

        // Ajouter le fond de carte OpenStreetMap
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        // Icône personnalisée (éviter les problèmes d'icône par défaut de Leaflet)
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
            <div style="
              transform: rotate(45deg);
              color: white;
              font-size: 12px;
              font-weight: bold;
            ">🏠</div>
          </div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 28],
          popupAnchor: [0, -28],
        });

        // Ajouter le marqueur
        const marker = L.marker([latitude!, longitude!], { icon }).addTo(map);

        // Popup avec les informations
        const popupContent = `
          <div style="font-family: system-ui, sans-serif; padding: 4px 0;">
            <strong style="color: #1a1a2e;">${address || city}</strong>
            ${address ? `<br/><span style="color: #666; font-size: 12px;">${city}</span>` : ""}
            <br/>
            <span style="color: #999; font-size: 11px;">
              📍 ${latitude!.toFixed(6)}, ${longitude!.toFixed(6)}
            </span>
          </div>
        `;
        marker.bindPopup(popupContent);

        markerRef.current = marker;

        // Ajouter un contrôle de zoom personnalisé en bas à droite
        L.control
          .zoom({
            position: "bottomright",
          })
          .addTo(map);

        mapInstanceRef.current = map;

        // Ouvrir le popup automatiquement après un court délai
        setTimeout(() => {
          if (markerRef.current && isMounted) {
            markerRef.current.openPopup();
          }
        }, 500);

        setIsLoading(false);
      } catch (err) {
        console.error("Erreur lors du chargement de la carte:", err);
        if (isMounted) {
          setError("Impossible de charger la carte");
          setIsLoading(false);
        }
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
  }, [latitude, longitude, address, city, hasCoords]);

  // Fonction pour ouvrir Google Maps
  const openGoogleMaps = () => {
    if (!hasCoords) return;
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    Linking.openURL(String(url));
  };

  // Affichage sans coordonnées
  if (!hasCoords) {
    return (
      <View className="bg-white/5 rounded-2xl p-4"><Text className="text-[10px] text-white/40 uppercase tracking-wider">Localisation
        </Text><Text className="text-white font-medium mt-1 flex items-center gap-1"><MapPin size={14} className="text-white/30" />{address || city || "Adresse non renseignée"}</Text><View className="mt-2 rounded-xl h-40 flex items-center justify-center bg-white/5 border border-white/10"><Text className="text-white/30 text-sm">Coordonnées non disponibles</Text></View></View>
    );
  }

  // Rendu principal
  return (
    <View className="bg-white/5 rounded-2xl p-4"><View className="flex items-center justify-between"><View><Text className="text-[10px] text-white/40 uppercase tracking-wider">Localisation
          </Text><Text className="text-white font-medium mt-1 flex items-center gap-1"><MapPin size={14} className="text-white/30" />{address || city}</Text></View>{}<Pressable onPress={openGoogleMaps} className="text-xs text-orange-400 transition-colors bg-white/5 px-3 py-1 rounded-full"><Text>Itinéraire</Text></Pressable></View><View className="mt-2 rounded-xl overflow-hidden h-48 relative">{}<View ref={mapRef} className="w-full h-full rounded-xl" style={{ backgroundColor: "#e8ecf1" }} />{}{isLoading && (
          <View className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-xl"><Loader2 className="w-6 h-6 text-white animate-spin" /></View>
        )}{}{error && (
          <View className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm rounded-xl p-4 text-center"><Text className="text-white/70 text-sm">{error}</Text><Pressable onPress={openGoogleMaps} className="mt-2 text-xs text-orange-400"><Text>Voir sur Google Maps</Text></Pressable></View>
        )}{}<View className="absolute bottom-2 right-2 bg-black/60 text-white/60 text-[10px] px-2 py-1 rounded-full pointer-events-none"><Text>OpenStreetMap</Text></View></View></View>
  );
}
