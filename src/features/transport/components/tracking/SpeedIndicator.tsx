import { View, Text } from "react-native";
// src/features/transport/components/tracking/SpeedIndicator.tsx

interface SpeedIndicatorProps {
  speedKmh: number;
}

export function SpeedIndicator({ speedKmh }: SpeedIndicatorProps) {
  // Calcul de la rotation du pointeur (vitesse max : 140km/h)
  const maxSpeed = 140;
  const clampedSpeed = Math.min(maxSpeed, Math.max(0, speedKmh));
  const rotationDeg = -90 + (clampedSpeed / maxSpeed) * 180; // Angle de -90° à +90°

  return (
    <View className="p-4 rounded-3xl border border-white/5 bg-white/[0.02] flex flex-col items-center justify-center text-center relative w-36 h-36 mx-auto">
      {/* Compteur SVG */}
      <svg className="w-full h-full" viewBox="0 0 100 100">
        {/* Arc de cercle de base */}
        <path
          d="M 20,80 A 40,40 0 1,1 80,80"
          fill="none"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Arc de vitesse active */}
        <motion.path
          d="M 20,80 A 40,40 0 1,1 80,80"
          fill="none"
          stroke="#8B5CF6" // Violet DébrouillePro [2]
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="251.2" // Circonférence totale d'un cercle de rayon 40 // 188.4 représente les 3/4 du cercle
        />

        {/* Aiguille rotative */}
        <motion.g
         
        >
          <line
            x1="50"
            y1="80"
            x2="50"
            y2="44"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Pivot de l'aiguille */}
        <circle
          cx="50"
          cy="80"
          r="5"
          fill="#8B5CF6"
          stroke="#ffffff"
          strokeWidth="1.5"
        />
      </svg>

      {/* Affichage numérique */}
      <View className="absolute bottom-6 inset-x-0 space-y-0.5">
        <Text className="text-xl font-black text-white leading-none">{speedKmh}</Text>
        <Text className="text-[8px] text-white/30 uppercase tracking-widest font-bold">
          <Text>km/h [2]</Text></Text>
      </View>
    </View>
  );
}
