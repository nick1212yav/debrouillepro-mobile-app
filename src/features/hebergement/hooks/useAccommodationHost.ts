import { useState, useEffect } from "react";

interface Host {
  id: string;
  name: string;
  avatar?: string;
  verified: boolean;
  responseRate?: number;
}

export function useAccommodationHost(hostId?: string) {
  const [host, setHost] = useState<Host | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hostId) {
      setLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setHost({
        id: hostId,
        name:
          hostId === "host-1"
            ? "Marie K."
            : hostId === "host-2"
              ? "Jean-Paul A."
              : "Sophie M.",
        verified: true,
        responseRate: 98,
      });
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [hostId]);

  return { host, loading };
}
