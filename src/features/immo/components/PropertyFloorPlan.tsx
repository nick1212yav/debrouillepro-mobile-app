import { View, Text, Image, Pressable } from "react-native";
import { useState, useEffect } from "react";
import { X, Maximize2, Loader2, AlertCircle } from "lucide-react-native";

interface Props {
  /** URL du plan (image) */
  floorPlanUrl: string;
  /** Titre pour l'accessibilité */
  title: string;
}

/**
 * Affiche un plan d'étage dans une modale.
 * - Miniature cliquable avec le plan
 * - Modal plein écran avec zoom
 * - Gestion du chargement et des erreurs
 * - Fermeture par touche Échap
 */
export function PropertyFloorPlan({ floorPlanUrl, title }: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (!floorPlanUrl) return null;

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

  const handleImageLoad = () => setIsLoading(false);
  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <>
      {/* Carte miniature cliquable */}
      <Pressable
        className="bg-white/5 rounded-2xl p-4"
        onPress={handleOpen}
        accessibilityRole="button"
        tabIndex={0}
        accessibilityLabel={`Agrandir le plan de ${title}`}
      >
        <View className="flex items-center justify-between">
          <Text className="text-[10px] text-white/40 uppercase tracking-wider">
            Plan du logement
          </Text>
          <Maximize2 size={14} className="text-white/30" />
        </View>

        <View className="mt-2 rounded-xl overflow-hidden h-32 flex items-center justify-center bg-white/5 border border-white/10 relative">
          <Image
           
           
            className="w-full h-full object-contain"
            onLoad={handleImageLoad}
            onError={handleImageError}
           source={{ uri: floorPlanUrl }} accessibilityLabel={title}/>
          {isLoading && !hasError && (
            <View className="absolute inset-0 flex items-center justify-center bg-white/5">
              <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
            </View>
          )}
          {hasError && (
            <View className="absolute inset-0 flex items-center justify-center bg-white/5 text-white/30">
              <AlertCircle size={20} />
            </View>
          )}
        </View>
      </Pressable>

      {/* Modale plein écran */}
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
                accessibilityLabel="Fermer le plan"
              >
                <X size={28} />
              </Pressable>

              <View className="relative w-full max-w-4xl h-[80vh] flex items-center justify-center bg-black/30 rounded-xl overflow-hidden">
                {isLoading && !hasError && (
                  <View className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-white/60 animate-spin" />
                  </View>
                )}

                {hasError ? (
                  <View className="flex flex-col items-center gap-2 text-white/50">
                    <AlertCircle size={32} />
                    <Text className="text-sm">Impossible de charger le plan</Text>
                    <Text className="text-xs text-white/30">
                      Vérifiez votre connexion ou réessayez plus tard.
                    </Text>
                  </View>
                ) : (
                  <Image
                   
                   
                    className="max-w-full max-h-full object-contain"
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                   source={{ uri: floorPlanUrl }} accessibilityLabel={`Plan de ${title}`}/>
                )}
              </View>

              {!hasError && !isLoading && (
                <Text className="text-white/30 text-xs mt-3">
                  Cliquez pour zoomer / dézoomer avec les gestes
                </Text>
              )}
            </View>
          </>
        )}
      </>
    </>
  );
}
