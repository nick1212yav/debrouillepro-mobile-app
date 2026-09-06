// src/features/events/hooks/useEventMedia.ts
import { useState } from "react";

export function useEventMedia() {
  const [media, setMedia] = useState<
    { type: "image" | "video" | "document"; url: string }[]
  >([]);

  const addMedia = (type: "image" | "video" | "document", url: string) => {
    setMedia((prev) => [...prev, { type, url }]);
  };

  const removeMedia = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  return { media, addMedia, removeMedia };
}
