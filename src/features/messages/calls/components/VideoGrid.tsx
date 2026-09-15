import { View, Text } from "react-native";
import { useEffect, useRef } from "react";

interface VideoGridProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}

function VideoTile({
  stream,
  muted = false,
  label,
}: {
  stream: MediaStream | null;
  muted?: boolean;
  label: string;
}) {
  const videoRef = useRef<View>(null);

  useEffect(() => {
    if (!videoRef.current) {
      return;
    }

    videoRef.current.srcObject = stream;

    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [stream]);

  return (
    <View className="relative min-h-[180px] overflow-hidden rounded-2xl bg-black">
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className="h-full w-full object-cover"
        />
      ) : (
        <View className="flex h-full min-h-[180px] items-center justify-center text-sm text-white/50">
          {label}
        </View>
      )}

      <Text className="absolute bottom-3 left-3 rounded-lg bg-black/50 px-2 py-1 text-xs text-white">
        {label}
      </Text>
    </View>
  );
}

export function VideoGrid({ localStream, remoteStream }: VideoGridProps) {
  return (
    <View className="h-full min-h-[360px] gap-3">
      <VideoTile stream={remoteStream} label="Correspondant" />

      <VideoTile stream={localStream} muted label="Vous" />
    </View>
  );
}

export default VideoGrid;
