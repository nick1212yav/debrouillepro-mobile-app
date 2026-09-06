import { Pressable, View } from "react-native";

// src/features/voyages/components/map/VoyageMapControls.tsx
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RefreshCw,
  RotateCw,
} from "lucide-react-native";

interface VoyageMapControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFullscreen?: () => void;
  onRefresh?: () => void;
  onRotate?: () => void;
  isFullscreen?: boolean;
  className?: string;
  position?: "top-right" | "bottom-right" | "bottom-left" | "top-left";
}

/**
 * Contrôles de la carte : zoom, plein écran, rafraîchissement, rotation.
 * Pour l'instant, ces actions sont des placeholders (toast ou logs).
 * Plus tard, elles seront connectées à la vraie carte.
 */
export function VoyageMapControls({
  onZoomIn,
  onZoomOut,
  onFullscreen,
  onRefresh,
  onRotate,
  isFullscreen = false,
  className = "",
  position = "bottom-right",
}: VoyageMapControlsProps) {
  const positionClasses = {
    "top-right": "top-4 right-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-left": "top-4 left-4",
  };

  const handleZoomIn = () => {
    if (onZoomIn) onZoomIn();
    else console.log("Zoom In");
  };

  const handleZoomOut = () => {
    if (onZoomOut) onZoomOut();
    else console.log("Zoom Out");
  };

  const handleFullscreen = () => {
    if (onFullscreen) onFullscreen();
    else console.log("Toggle Fullscreen");
  };

  const handleRefresh = () => {
    if (onRefresh) onRefresh();
    else console.log("Refresh Map");
  };

  const handleRotate = () => {
    if (onRotate) onRotate();
    else console.log("Rotate Map");
  };

  const controls = [
    { icon: ZoomIn, onClick: handleZoomIn, label: "Zoom avant" },
    { icon: ZoomOut, onClick: handleZoomOut, label: "Zoom arrière" },
    {
      icon: isFullscreen ? Minimize2 : Maximize2,
      onClick: handleFullscreen,
      label: isFullscreen ? "Réduire" : "Plein écran",
    },
    { icon: RefreshCw, onClick: handleRefresh, label: "Rafraîchir" },
    { icon: RotateCw, onClick: handleRotate, label: "Rotation" },
  ];

  return (
    <View
      className={`absolute ${positionClasses[position]} flex flex-col gap-1.5 ${className}`}
      style={{ zIndex: 10 }}
    >
      {controls.map(({ icon: Icon, onClick, label }) => (
        <Pressable
          key={label}
          onPress={onClick}
          className="w-9 h-9 rounded-xl bg-black/50 border border-white/10 text-white/70 flex items-center justify-center"
          accessibilityLabel={label}
          title={label}
        >
          <Icon size={16} />
        </Pressable>
      ))}
    </View>
  );
}
