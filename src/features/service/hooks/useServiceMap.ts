import { useState } from "react";

export function useServiceMap(location: string) {
  const [mapReady, setMapReady] = useState(false);
  return {
    location,
    mapReady,
    setMapReady,
  };
}
