import { useVideoPlayer, VideoView } from "expo-video";
import { StyleSheet } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

// src/features/messages/media/components/VideoPreview.tsx

interface VideoPreviewProps {
  src: string;
  controls?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function VideoPreview({ src, controls = true, style }: VideoPreviewProps) {
  const player = useVideoPlayer(src);

  return (
    <VideoView
      player={player}
      style={[styles.video, style]}
      nativeControls={controls}
      allowsFullscreen
      contentFit="contain"
    />
  );
}

const styles = StyleSheet.create({
  video: { maxHeight: 420, maxWidth: "100%", borderRadius: 12 },
});

export default VideoPreview;