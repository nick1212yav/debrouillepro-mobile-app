import { View, Text } from "react-native";

interface VoiceWaveformProps {
  progress?: number;
  bars?: number;
  active?: boolean;
}

export function VoiceWaveform({
  progress = 0,
  bars = 28,
  active = false,
}: VoiceWaveformProps) {
  const safeProgress = Math.max(0, Math.min(1, progress));

  return (
    <View className="flex h-8 flex-1 items-center gap-[2px]">
      {Array.from({
        length: bars,
      }).map((_, index) => {
        const position = index / Math.max(bars - 1, 1);

        const height = 20 + ((index * 17) % 60);

        const isActive = position <= safeProgress;

        return (
          <Text
            key={index}
            className={`w-[2px] rounded-full transition-opacity ${
              isActive || active
                ? "bg-current opacity-100"
                : "bg-current opacity-30"
            }`}
            style={{
              height: `${height}%`,
            }}
          />
        );
      })}
    </View>
  );
}

export default VoiceWaveform;
