import { View, Text } from "react-native";

interface UploadProgressProps {
  progress: number;
  label?: string;
}

export function UploadProgress({
  progress,
  label = "Téléversement...",
}: UploadProgressProps) {
  const safeProgress = Math.max(0, Math.min(100, progress));

  return (
    <View className="w-full"><View className="mb-1 flex items-center justify-between text-xs text-white/60"><Text>{label}</Text><Text>{Math.round(safeProgress)}%</Text></View><View className="h-1.5 overflow-hidden rounded-full bg-white/10"><View className="h-full rounded-full bg-emerald-500 transition-[width]" style={{
            width: `${safeProgress}%`,
          }} /></View></View>
  );
}

export default UploadProgress;
