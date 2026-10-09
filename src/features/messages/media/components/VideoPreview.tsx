// src/features/messages/media/components/VideoPreview.tsx

import { useVideoPlayer, VideoView } from "expo-video";
import { StyleSheet } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

interface VideoPreviewProps {
  src: string;
  controls?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function VideoPreview({
  src,
  controls = true,
  style,
}: VideoPreviewProps) {
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
  video: {
    width: "100%",
    maxWidth: "100%",
    height: 240,
    maxHeight: 420,
    borderRadius: 12,
    overflow: "hidden",
  },
});

export default VideoPreview;
