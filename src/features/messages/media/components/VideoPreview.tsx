import { View } from "react-native";
interface VideoPreviewProps {
  src: string;
  poster?: string;
  controls?: boolean;
  className?: string;
}

export function VideoPreview({
  src,
  poster,
  controls = true,
  className = "",
}: VideoPreviewProps) {
  return (
    <View
      src={src}
      poster={poster}
      controls={controls}
      preload="metadata"
      playsInline
      className={`max-h-[420px] max-w-full rounded-xl ${className}`}
    />
  );
}

export default VideoPreview;
