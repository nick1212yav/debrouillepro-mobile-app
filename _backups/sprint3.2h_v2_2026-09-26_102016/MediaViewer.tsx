import { View, Pressable, Text } from "react-native";
import type { GalleryItem } from "../hooks/useMediaGallery";

import { ImagePreview } from "./ImagePreview";
import { VideoPreview } from "./VideoPreview";

interface MediaViewerProps {
  item: GalleryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

export function MediaViewer({
  item,
  isOpen,
  onClose,
  onNext,
  onPrevious,
}: MediaViewerProps) {
  if (!isOpen || !item) {
    return null;
  }

  const isImage = item.type.startsWith("image/");

  const isVideo = item.type.startsWith("video/");

  return (
    <View className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" accessibilityRole="dialog" accessibilityViewIsModal={true}><Pressable onPress={onClose} className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white" accessibilityLabel="Fermer"><Text>×</Text></Pressable>{onPrevious && (
        <Pressable onPress={onPrevious} className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white" accessibilityLabel="Média précédent"><Text>‹</Text></Pressable>
      )}<View className="max-h-full max-w-full">{isImage ? (
          <ImagePreview
            src={item.url}
            alt={item.name ?? ""}
            className="max-h-[90vh]"
          />
        ) : isVideo ? (
          <VideoPreview src={item.url} />
        ) : (
          <Pressable className="text-white underline" accessibilityHint={item.url}>
            Ouvrir le fichier
          </Pressable>
        )}</View>{onNext && (
        <Pressable onPress={onNext} className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white" accessibilityLabel="Média suivant">
          ›
        </Pressable>
      )}</View>
  );
}

export default MediaViewer;
