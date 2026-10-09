import { StyleSheet, Text, View } from "react-native";

type VideoStream = unknown;

interface VideoGridProps {
  localStream: VideoStream | null;
  remoteStream: VideoStream | null;
}

interface VideoTileProps {
  stream: VideoStream | null;
  muted?: boolean;
  label: string;
}

function VideoTile({ stream, muted = false, label }: VideoTileProps) {
  // `muted` sera transmis à RTCView lors du branchement
  // réel de react-native-webrtc.
  void muted;

  return (
    <View style={styles.tile} accessibilityLabel={`Tuile vidéo : ${label}`}>
      {stream ? (
        <View style={styles.streamPlaceholder}>
          <Text style={styles.streamPlaceholderText}>Flux vidéo actif</Text>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{label}</Text>
        </View>
      )}

      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
      </View>
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
    minHeight: 360,
    flex: 1,
    gap: 12,
  },

  tile: {
    minHeight: 180,
    flex: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#000000",
  },

  streamPlaceholder: {
    width: "100%",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  streamPlaceholderText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.60)",
  },

  emptyState: {
    width: "100%",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyStateText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.50)",
  },

  labelContainer: {
    position: "absolute",
    bottom: 12,
    left: 12,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.50)",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  label: {
    fontSize: 12,
    color: "#ffffff",
  },
});

export default VideoGrid;
