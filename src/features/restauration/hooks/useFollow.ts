import { useState, useCallback } from "react";

export function useFollow(restaurantId: number) {
  const [isFollowing, setIsFollowing] = useState(false);

  const toggleFollow = useCallback(async (): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        setIsFollowing((prev) => {
          const next = !prev;
          resolve(next);
          return next;
        });
      }, 300);
    });
  }, []);

  return { isFollowing, toggleFollow };
}
