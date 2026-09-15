interface AudioPlayerProps {
  src: string;
  className?: string;
}

export function AudioPlayer({ src, className = "" }: AudioPlayerProps) {
  return (
    <audio
      src={src}
      controls
      preload="metadata"
      className={`w-full ${className}`}
    />
  );
}

export default AudioPlayer;
