// src/features/messages/media/components/UploadProgress.tsx

import { StyleSheet, Text, View } from "react-native";

interface UploadProgressProps {
  progress: number;
  label?: string;
}

export function UploadProgress({
  progress,
  label = "Téléversement...",
}: UploadProgressProps) {
  const safeProgress = Number.isFinite(progress)
    ? Math.max(0, Math.min(100, progress))
    : 0;

  const roundedProgress = Math.round(safeProgress);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>

        <Text style={styles.percentage}>{roundedProgress}%</Text>
      </View>

      <View
        style={styles.track}
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: 100,
          now: roundedProgress,
        }}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${safeProgress}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },

  header: {
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  label: {
    flex: 1,
    marginRight: 12,
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(255,255,255,0.60)",
  },

  percentage: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.72)",
  },

  track: {
    width: "100%",
    height: 6,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  fill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#10b981",
  },
});

export default UploadProgress;
