import { View, Text } from "react-native";

// src/features/transport/components/tracking/SpeedIndicator.tsx
import { motion } from "motion/react";

interface SpeedIndicatorProps {
  speedKmh: number;
}

export function SpeedIndicator({ speedKmh }: SpeedIndicatorProps) {
  // Calcul de la rotation du pointeur (vitesse max : 140km/h)
  const maxSpeed = 140;
  const clampedSpeed = Math.min(maxSpeed, Math.max(0, speedKmh));
  const rotationDeg = -90 + (clampedSpeed / maxSpeed) * 180; // Angle de -90° à +90°

  return (
    <View className="p-4 rounded-3xl border border-white/5 bg-white/[0.02] flex flex-col items-center justify-center text-center relative w-36 h-36 mx-auto">{}<svg className="w-full h-full" viewBox="0 0 100 100">{}<path d="M 20,80 A 40,40 0 1,1 80,80" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="6" strokeLinecap="round" />{}<motion.path d="M 20,80 A 40,40 0 1,1 80,80" fill="none" stroke="#8B5CF6" strokeWidth="6" strokeLinecap="round" strokeDasharray="251.2" animate={{
            strokeDashoffset: 251.2 - (clampedSpeed / maxSpeed) * 188.4,
          }} transition={{ duration: 0.8, ease: "easeOut" }} />{}<motion.g animate={{ rotate: rotationDeg }} transition={{ duration: 0.8, ease: "easeOut" }} style={{ transformOrigin: "50px 80px" }}><line x1="50" y1="80" x2="50" y2="44" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" /></motion.g>{}<circle cx="50" cy="80" r="5" fill="#8B5CF6" stroke="#ffffff" strokeWidth="1.5" /></svg>{}<View className="absolute bottom-6 inset-x-0 space-y-0.5"><Text className="text-xl font-black text-white leading-none">{speedKmh}</Text><Text className="text-[8px] text-white/30 uppercase tracking-widest font-bold">km/h [2]
        </Text></View></View>
  );
}
