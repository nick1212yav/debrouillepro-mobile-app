import { useCallback, useMemo, useState } from "react";

import type { Id } from "@/convex/_generated/dataModel";

export interface GalleryItem {
  id: string | Id<"attachments">;
  url: string;
  type: string;
  name?: string;
}

export function useMediaGallery(items: GalleryItem[] = []) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const isOpen = selectedIndex !== null;

  const selectedItem = useMemo(
    () => (selectedIndex !== null ? (items[selectedIndex] ?? null) : null),
    [items, selectedIndex],
  );

  const open = useCallback(
    (index: number) => {
      if (index < 0 || index >= items.length) {
        return;
      }

      setSelectedIndex(index);
    },
    [items.length],
  );

  const close = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  const next = useCallback(() => {
    setSelectedIndex((current) => {
      if (current === null || items.length === 0) {
        return current;
      }

      return (current + 1) % items.length;
    });
  }, [items.length]);

  const previous = useCallback(() => {
    setSelectedIndex((current) => {
      if (current === null || items.length === 0) {
        return current;
      }

      return (current - 1 + items.length) % items.length;
    });
  }, [items.length]);

  return {
    items,
    selectedIndex,
    selectedItem,
    isOpen,
    open,
    close,
    next,
    previous,
  };
}

export default useMediaGallery;
