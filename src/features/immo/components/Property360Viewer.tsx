import { Text, View, Pressable, Image, NativeSyntheticEvent, TextInputKeyPressEventData } from "react-native";
import { useState, useEffect } from "react";
import { X, Play, Loader2, AlertCircle } from "lucide-react-native";

interface Props {
  /** URL de la visite (Matterport, YouTube, Vimeo, ou image 360) */
  url: string;
  /** Titre pour l'attribut `title` et l'accessibilité */
  title: string;
  /** Optionnel : forcer le type de contenu (iframe ou image) */
  type?: "iframe" | "image";
}

/**
 * Affiche une visite virtuelle 360° dans une modale.
 * - Supporte les iframes (Matterport, YouTube, Vimeo, etc.) et les images panoramiques.
 * - Chargement différé avec indicateur de progression.
 * - Gestion des erreurs et fallback.
 * - Fermeture par clique sur l'overlay ou touche Échap.
 */
export function Property360Viewer({ url, title, type }: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Ne rien afficher si pas d'URL
  if (!url) return null;

  // Détection automatique du type si non fourni
  const detectedType =
    type ||
    (url.match(/\.(jpg|jpeg|png|webp|avif|gif)$/i) ? "image" : "iframe");

  // Réinitialiser les états à chaque ouverture
  const handleOpen = () => {
    setOpen(true);
    setIsLoading(true);
    setHasError(false);
  };

  const handleClose = () => setOpen(false);

  // Fermeture avec la touche Échap
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Gestion des événements de l'iframe / image
  const handleLoad = () => setIsLoading(false);
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <>
      {/* Bouton d'ouverture */}
      <Pressable onPress={handleOpen} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-white/10 text-white/60 transition-colors active:scale-95" accessibilityLabel={`Ouvrir la visite 360° de ${title}`}>
        <Play size={14} /> Visite 360°
      </Pressable>

      {/* Modale */}
<View>
        {open && (
          <>
            {/* Overlay sombre */}
            <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onPress={handleClose} className="fixed inset-0 z-50 bg-black/95" />

            {/* Contenu de la modale */}
            <View initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4">
              {/* Bouton de fermeture */}
              <Pressable onPress={handleClose} className="absolute top-4 right-4 text-white/70 z-10 transition-colors" accessibilityLabel="Fermer">
                <X size={28} />
              </Pressable>

              {/* Conteneur de la visite */}
              <View className="relative w-full max-w-5xl aspect-video rounded-xl overflow-hidden bg-black/50">
                {/* Indicateur de chargement */}
                {isLoading && !hasError && (
                  <View className="absolute inset-0 flex items-center justify-center z-10">
                    <Loader2 className="w-10 h-10 text-white/60 animate-spin" />
                  </View>
                )}

                {/* Message d'erreur */}
                {hasError && (
                  <View className="absolute inset-0 flex flex-col items-center justify-center z-10 text-white/60 gap-2 p-4 text-center">
                    <AlertCircle size={32} />
                    <Text className="text-sm">Impossible de charger la visite</Text>
                    <Text className="text-xs text-white/30">
                      Vérifiez votre connexion ou réessayez plus tard.
                    </Text>
                  </View>
                )}

                {/* Rendu selon le type détecté */}
                {detectedType === "iframe" ? (
                  <iframe
                    src={url}
                    title={title}
                    className="w-full h-full"
                    allowFullScreen
                    allow="autoplay; encrypted-media; gyroscope; accelerometer; xr-spatial-tracking"
                    // L'iframe ne se charge que lorsque la modale est ouverte
                  />
                ) : (
                  // Pour les images panoramiques, on les affiche en object-fit
                  <Image className="w-full h-full object-contain" source={{ uri: url }} accessibilityLabel={title} />
                )}
              </View>

              {/* Indication d'utilisation (si aucun erreur et chargé) */}
              {!hasError && !isLoading && (
                <Text className="text-white/30 text-xs mt-3">
                  Utilisez les flèches ou le gyroscope pour explorer
                </Text>
              )}
            </View>
          </>
        )}
      </View>
    </>
  );
}
