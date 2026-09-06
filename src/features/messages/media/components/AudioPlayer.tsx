import { View } from "react-native";
interface AudioPlayerProps {
  src: string;
  className?: string;
}

export function AudioPlayer({ src, className = "" }: AudioPlayerProps) {
  return (
    <View
      src={src}
      controls
      preload="metadata"
      className={`w-full ${className}`}
    />
  );
}

export default AudioPlayer;
