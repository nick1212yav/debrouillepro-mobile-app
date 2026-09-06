import { useEffect, useState } from "react";
import { loadCities } from "../../../core/sdk/hooks/useCities";

export function useCities(country?: string) {
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCities(country).then((data) => {
      setCities(data);
      setLoading(false);
    });
  }, [country]);

  return { cities, loading };
}
