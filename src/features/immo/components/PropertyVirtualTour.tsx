import { Text, View, Pressable, Image } from "react-native";
import { useState, useEffect } from "react";
import { X, Play, Loader2, AlertCircle } from "lucide-react-native";

interface Props {
  /** URL de la visite virtuelle (Matterport, YouTube, Vimeo, image panoramique, etc.) */
  url: string;
  /** Titre pour l'attribut `title` et l'accessibilité */
  title: string;
  /** Optionnel : forcer le type de contenu (iframe ou image) */
  type?: "iframe" | "image";
}

/**
 * Affiche une visite virtuelle dans une modale.
 * - Supporte les iframes (Matterport, YouTube, Vimeo, etc.) et les images panoramiques.
 * - Chargement différé avec indicateur de progression.
 * - Gestion des erreurs et fallback.
 * - Fermeture par clique sur l'overlay ou touche Échap.
 */
export function PropertyVirtualTour({ url, title, type }: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (!url) return null;

  // Détection automatique du type
  const detectedType =
    type ||
    (url.match(/\.(jpg|jpeg|png|webp|avif|gif)$/i) ? "image" : "iframe");

  const handleOpen = () => {
    setOpen(true);
    setIsLoading(true);
    setHasError(false);
  };

  const handleClose = () => setOpen(false);

  // Fermeture avec Échap
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    undefined;
    return () => undefined;
  }, [open]);

  const handleLoad = () => setIsLoading(false);
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <>
      {/* Bouton d'ouverture */}
      <Pressable
        onPress={handleOpen}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-white/10 text-white/60"
        accessibilityLabel={`Ouvrir la visite virtuelle de ${title}`}
      >
        <Play size={14} /> Visite virtuelle
      </Pressable>

      {/* Modale */}
      <>
        {open && (
          <>
            <Pressable
              onPress={handleClose}
              className="fixed inset-0 z-50 bg-black/95"
            />

            <View
              className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4"
            >
              <Pressable
                onPress={handleClose}
                className="absolute top-4 right-4 text-white/70 z-10"
                accessibilityLabel="Fermer"
              >
                <X size={28} />
              </Pressable>

              <View className="relative w-full max-w-5xl aspect-video rounded-xl overflow-hidden bg-black/50">
                {isLoading && !hasError && (
                  <View className="absolute inset-0 flex items-center justify-center z-10">
                    <Loader2 className="w-10 h-10 text-white/60 animate-spin" />
                  </View>
                )}

                {hasError && (
                  <View className="absolute inset-0 flex flex-col items-center justify-center z-10 text-white/60 gap-2 p-4 text-center">
                    <AlertCircle size={32} />
                    <Text className="text-sm">
                      Impossible de charger la visite virtuelle
                    </Text>
                    <Text className="text-xs text-white/30">
                      Vérifiez votre connexion ou réessayez plus tard.
                    </Text>
                  </View>
                )}

                {detectedType === "iframe" ? (
                  <View
                    src={url}
                    title={title}
                    className="w-full h-full"
                    allowFullScreen
                    allow="autoplay; encrypted-media; gyroscope; accelerometer; xr-spatial-tracking"
                    onLoad={handleLoad}
                    onError={handleError}
                  />
                ) : (
                  <Image
                    className="w-full h-full object-contain"
                    onLoad={handleLoad}
                    onError={handleError} source={{ uri: url }} accessibilityLabel={title}
                  />
                )}
              </View>

              {!hasError && !isLoading && (
                <Text className="text-white/30 text-xs mt-3">
                  Utilisez les flèches ou le gyroscope pour explorer
                </Text>
              )}
            </View>
          </>
        )}
      </>
    </>
  );
}
