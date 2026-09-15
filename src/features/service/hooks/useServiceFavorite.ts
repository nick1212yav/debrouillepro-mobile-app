import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

export function useServiceFavorite(
  providerId: Id<"serviceProviders">,
  initial = false,
) {
  const [isFavorited, setIsFavorited] = useState(initial);
  const toggle = useMutation(api.serviceProviders.toggleFavorite);
  const handleToggle = async () => {
    try {
      const { favorited } = await toggle({ providerId });
      setIsFavorited(favorited);
      toast.success(favorited ? "Ajouté aux favoris ❤️" : "Retiré des favoris");
    } catch {
      toast.error("Erreur lors de l'opération");
    }
  };
  return { isFavorited, toggle: handleToggle };
}
