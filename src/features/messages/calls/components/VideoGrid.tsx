import { View, Text, StyleSheet } from "react-native";

// src/features/messages/calls/components/VideoGrid.tsx
//
// NOTE (Sprint 3.4) :
// Ce composant utilise actuellement un placeholder View pour chaque tuile
// vidéo. Le branchement réel se fera via RTCView de react-native-webrtc.
// Les streams sont volontairement typés `VideoStream` (opaque) pour
// ne pas dépendre du type DOM MediaStream, indisponible en RN natif.

type VideoStream = unknown;

interface VideoGridProps {
  localStream: VideoStream | null;
  remoteStream: VideoStream | null;
}

function VideoTile({
  stream,
  muted = false,
  label,
}: {
  stream: VideoStream | null;
  muted?: boolean;
  label: string;
}) {
  // `muted` sera utilisé par RTCView en Sprint 3.4 (coupe le flux local).
  void muted;

  return (
    <View style={styles.tile}>
      {stream ? (
        <View style={styles.streamPlaceholder}>
          <Text style={styles.streamPlaceholderText}>Flux vidéo actif</Text>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{label}</Text>
        </View>
      )}

      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export function VideoGrid({ localStream, remoteStream }: VideoGridProps) {
  return (
    <View style={styles.container}>
      <VideoTile stream={remoteStream} label="Correspondant" />
      <VideoTile stream={localStream} muted label="Vous" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: "100%",
    minHeight: 360,
    gap: 12,
  },
  tile: {
    flex: 1,
    minHeight: 180,
    overflow: "hidden",
    borderRadius: 16,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  streamPlaceholder: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  streamPlaceholderText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.60)",
  },
  emptyState: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.50)",
  },
  label: {
    position: "absolute",
    bottom: 12,
    left: 12,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.50)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    color: "#ffffff",
  },
});

export default VideoGrid;