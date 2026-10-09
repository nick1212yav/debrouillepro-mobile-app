// src/features/messages/voice/components/VoiceWaveform.tsx

import { StyleSheet, View } from "react-native";

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

  const safeBars = Math.max(1, Math.floor(bars));

  return (
    <View
      style={styles.container}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: safeBars }).map((_, index) => {
        const position = index / Math.max(safeBars - 1, 1);

        const height = 20 + ((index * 17) % 60);

        const isActive = position <= safeProgress;

        return (
          <View
            key={index}
            style={[
              styles.bar,
              {
                height: `${height}%`,
                opacity: isActive || active ? 1 : 0.3,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 32,
    minWidth: 0,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    overflow: "hidden",
  },

  bar: {
    width: 2,
    flexShrink: 0,
    borderRadius: 999,
    backgroundColor: "#ffffff",
  },
});

export default VoiceWaveform;
