import { View, Pressable, Text, TextInput } from "react-native";
import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import {
  ArrowLeft, Map, Layers, Compass, Search, Navigation, Locate,
} from "lucide-react-native";

// Fix default icon paths
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Colored div icon factory
function makeIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:32px;height:32px;border-radius:50% 50% 50% 0;
      background:${color};
      border:3px solid rgba(255,255,255,0.9);
      box-shadow:0 4px 14px rgba(0,0,0,0.5);
      display:flex;align-items:center;justify-content:center;
      transform:rotate(-45deg);
    ">
      <span style="transform:rotate(45deg);display:block;width:8px;height:8px;border-radius:50%;background:white;"></span>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -36],
  });
}

// Fly-to component for geolocation
function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 15, { duration: 1.5 });
  }, [lat, lng, map]);
  return null;
}

const POI_CATEGORIES = ["Tout", "Hôpitaux", "Écoles", "Marchés", "Banques", "Hôtels"] as const;
type PoiCategory = (typeof POI_CATEGORIES)[number];

type Poi = {
  id: number;
  name: string;
  category: Exclude<PoiCategory, "Tout">;
  lat: number;
  lng: number;
  color: string;
};

const POIS: Poi[] = [
  { id: 1, name: "CHU de Cocody", category: "Hôpitaux", lat: 5.368, lng: -3.968, color: "#EF4444" },
  { id: 2, name: "UFHB – Campus", category: "Écoles", lat: 5.349, lng: -3.994, color: "#6366F1" },
  { id: 3, name: "Marché Adjamé", category: "Marchés", lat: 5.372, lng: -4.025, color: "#F97316" },
  { id: 4, name: "SGBCI Plateau", category: "Banques", lat: 5.320, lng: -4.022, color: "#10B981" },
  { id: 5, name: "Hôtel Ivoire", category: "Hôtels", lat: 5.336, lng: -3.980, color: "#8B5CF6" },
  { id: 6, name: "Marché de Treichville", category: "Marchés", lat: 5.299, lng: -4.012, color: "#F97316" },
  { id: 7, name: "Lycée Classique", category: "Écoles", lat: 5.380, lng: -4.040, color: "#6366F1" },
  { id: 8, name: "Clinique Sainte Marie", category: "Hôpitaux", lat: 5.342, lng: -3.962, color: "#EF4444" },
];

const LAYERS = [
  { id: "satellite", label: "Satellite", active: false },
  { id: "routes", label: "Routes", active: true },
  { id: "terrain", label: "Terrain 3D", active: true },
  { id: "traffic", label: "Trafic", active: false },
  { id: "population", label: "Densité pop.", active: false },
];

// Abidjan center
const ABIDJAN_CENTER: [number, number] = [5.354, -4.008];

export default function Map3DPage({ onBack }: { onBack: () => void }) {
  const [activeCategory, setActiveCategory] = useState<PoiCategory>("Tout");
  const [layers, setLayers] = useState(LAYERS);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Carte");
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  const toggleLayer = (id: string) => setLayers(prev => prev.map(l => l.id === id ? { ...l, active: !l.active } : l));

  const visiblePois = POIS.filter(p => {
    const matchCategory = activeCategory === "Tout" || p.category === activeCategory;
    const matchSearch = search === "" || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleLocate = () => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(coords);
        setFlyTarget(coords);
        setLocating(false);
      },
      () => {
        setFlyTarget({ lat: ABIDJAN_CENTER[0], lng: ABIDJAN_CENTER[1] });
        setLocating(false);
      },
      { timeout: 8000 }
    );
  };

  return (
    <View className="h-full flex flex-col overflow-hidden" style={{  }}>{}<View className="flex items-center gap-3 px-4 pt-12 pb-3"><Pressable onPress={onBack} className="p-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,.08)" }}><ArrowLeft size={18} color="white" /></Pressable><View className="flex-1"><Text className="text-white font-bold text-lg">Carte 3D Interactive</Text><Text className="text-gray-400 text-xs">Explorer · Mesurer · Interagir</Text></View><Pressable onPress={handleLocate} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(6,182,212,.15)" }}>{locating ? (
            <View animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" as const }}>
              <Navigation size={16} color="#06B6D4" />
            </View>
          ) : (
            <Locate size={16} color="#06B6D4" />
          )}</Pressable></View>{}<View className="flex gap-1 mx-4 mb-3 p-1 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,.04)" }}>{["Carte", "Couches", "Explorer"].map(tab => (
          <Pressable key={tab} onPress={() => setActiveTab(tab)} className="flex-1 py-2 rounded-lg text-xs font-medium" style={{ backgroundColor: activeTab === tab ? "rgba(255,255,255,.1)" : "transparent" }}>{tab}</Pressable>
        ))}</View>{}{activeTab === "Carte" && (
        <View className="flex-1 flex flex-col overflow-hidden px-4 pb-4">{}<View className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,.06)", borderWidth: 1, borderColor: "rgba(255,255,255,.08)", borderStyle: "solid" }}><Search size={14} color="#9CA3AF" /><TextInput value={search} onChangeText={value => setSearch(value)} placeholder="Rechercher un lieu..." className="flex-1 bg-transparent text-white text-sm outline-none" /></View>{}<View className="flex gap-2 mb-3 overflow-x-auto" style={{  }}>{POI_CATEGORIES.map(cat => (
              <Pressable key={cat} onPress={() => setActiveCategory(cat)} className="px-3 py-1.5 rounded-full text-xs font-medium" style={{ backgroundColor: activeCategory === cat ? "#06B6D4" : "rgba(255,255,255,.06)" }}>{cat}</Pressable>
            ))}</View>{}<View className="flex-1 relative rounded-2xl overflow-hidden" style={{ borderWidth: 1, borderColor: "rgba(6,182,212,.2)", borderStyle: "solid", minHeight: 280 }}><MapContainer center={ABIDJAN_CENTER} zoom={13} className="h-full w-full" ref={mapRef} zoomControl={false}><TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>' />{flyTarget && <FlyTo lat={flyTarget.lat} lng={flyTarget.lng} />}{}{userPos && (
                <Marker
                  position={[userPos.lat, userPos.lng]}
                  icon={L.divIcon({
                    className: "",
                    html: `<div style="
                      width:18px;height:18px;border-radius:50%;
                      background:#06B6D4;
                      border:3px solid white;
                      box-shadow:0 0 0 6px rgba(6,182,212,0.3);
                    "></div>`,
                    iconSize: [18, 18],
                    iconAnchor: [9, 9],
                  })}
                >
                  <Popup><Text className="font-bold text-xs">Votre position</Text></Popup>
                </Marker>
              )}{}{visiblePois.map(poi => (
                <Marker
                  key={poi.id}
                  position={[poi.lat, poi.lng]}
                  icon={makeIcon(poi.color)}
                >
                  <Popup>
                    <View className="text-xs"><Text className="font-bold">{poi.name}</Text><Text className="text-gray-500">{poi.category}</Text></View>
                  </Popup>
                </Marker>
              ))}</MapContainer>{}<View className="absolute bottom-3 left-3 z-[500] px-2 py-1 rounded-lg text-xs text-cyan-400" style={{ backgroundColor: "rgba(0,0,0,.7)" }}><Text>Abidjan ·</Text>{visiblePois.length}<Text>POI</Text></View></View></View>
      )}{}{activeTab === "Couches" && (
        <View className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
          <Text className="text-gray-400 text-xs">Activez les couches à afficher sur la carte :</Text>
          {layers.map(layer => (
            <View key={layer.id} className="flex items-center gap-3 p-4 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,.04)", borderWidth: 1, borderColor: "rgba(255,255,255,.08)", borderStyle: "solid" }}>
              <Layers size={16} color={layer.active ? "#06B6D4" : "#9CA3AF"} />
              <Text className="text-white text-sm flex-1">{layer.label}</Text>
              <Pressable onPress={() => toggleLayer(layer.id)} className="w-12 h-6 rounded-full relative transition-all" style={{ backgroundColor: layer.active ? "#06B6D4" : "rgba(255,255,255,.1)" }}>
                <View className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all" style={{ left: layer.active ? "calc(100% - 20px)" : "4px" }} />
              </Pressable>
            </View>
          ))}
        </View>
      )}{}{activeTab === "Explorer" && (
        <View className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
          <Text className="text-gray-400 text-xs">{visiblePois.length} points d'intérêt</Text>
          {POIS.map((poi, i) => (
            <View key={poi.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,.04)", borderWidth: 1, borderColor: "rgba(255,255,255,.08)", borderStyle: "solid" }} onPress={() => {
                setFlyTarget({ lat: poi.lat, lng: poi.lng });
                setActiveTab("Carte");
              }}>
              <View className="w-8 h-8 rounded-full" style={{ backgroundColor: poi.color }} />
              <View className="flex-1">
                <Text className="text-white font-medium text-sm">{poi.name}</Text>
                <Text className="text-xs" style={{ color: poi.color }}>{poi.category}</Text>
              </View>
              <Compass size={14} color="#9CA3AF" />
            </View>
          ))}
        </View>
      )}</View>
  );
}
