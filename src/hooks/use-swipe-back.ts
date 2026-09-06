import { useRef, useCallback } from "react";

/**
 * useSwipeBack — detects a right-swipe gesture from the left edge to trigger goBack.
 * Returns a ref to attach to the scroll container.
 */
export function useSwipeBack(onBack: () => void, threshold = 80) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    // Only capture touches starting near the left edge (within 30px)
    if (touch.clientX <= 30) {
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
    }
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = Math.abs(touch.clientY - (touchStartY.current ?? 0));

    // Must be mostly horizontal and exceed threshold
    if (deltaX > threshold && deltaY < 60) {
      onBack();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }, [onBack, threshold]);

  return { onTouchStart, onTouchEnd };
}
