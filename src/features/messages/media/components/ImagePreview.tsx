import { Image } from "react-native";

interface ImagePreviewProps {
  src: string;
  alt?: string;
  className?: string;
}

export function ImagePreview({
  src,
  alt = "",
  className = "",
}: ImagePreviewProps) {
  return (
    <Image
      loading="lazy"
      className={`max-h-[420px] max-w-full rounded-xl object-contain ${className}`} source={{ uri: src }} accessibilityLabel={alt}
    />
  );
}

export default ImagePreview;
