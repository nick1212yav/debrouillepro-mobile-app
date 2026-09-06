import { useState } from "react";

export function useAccommodationMap(accommodationId?: string) {
  const [center, setCenter] = useState({ lat: 5.3484, lng: -3.9787 });

  const updateCenter = (lat: number, lng: number) => {
    setCenter({ lat, lng });
  };

  return { center, updateCenter };
}
