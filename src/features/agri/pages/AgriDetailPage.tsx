import { UIService } from "@/core/sdk/ui/UIService";
import { Pressable, View, Text } from "react-native";

// src/features/agri/pages/AgriDetailPage.tsx
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft, Share2, Heart } from "lucide-react-native";
// Importations unifiées des composants spécialisés de détails
import {
  AgriHero,
  AgriProductInfo,
  AgriPricing,
  AgriAvailability,
  AgriDescription,
  AgriSellerSection, // ✅ Appel mis à jour
  AgriLocation,
  AgriMap,
  AgriDelivery,
  AgriReviews,
  AgriSimilar,
  AgriSafety,
  AgriStickyBar,
} from "../components";

import { ContactSellerSheet } from "../sheets/ContactSellerSheet";
import type { AgriProduct } from "../types/product.types";

interface AgriDetailPageProps {
  productId: string;
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

export default function AgriDetailPage({
  productId,
  onBack,
  onNavigate,
}: AgriDetailPageProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isContactSheetOpen, setIsContactSheetOpen] = useState(false);

  // Requête de récupération du produit Convex
  const productData = useQuery(api.agri?.getProduct, {
    id: productId as unknown as Id<"agriProducts">,
  });

  const isLoading = productData === undefined;
  const product = productData as unknown as AgriProduct | null;

  const handleShare = () => {
    if (undefined) {
      undefined
        .catch(() => null);
    } else {
      undefined.writeText(undefined.href);
      UIService.openToast("Lien copié dans le presse-papier !", "info");
    }
  };

  if (isLoading) {
    return (
      <View
        className="h-full w-full flex flex-col items-center justify-center gap-3"
        style={{ backgroundColor: "#020d06" }}
      >
        <Loader2 size={24} className="text-green-500 animate-spin" />
        <Text className="text-white/40 text-xs font-semibold">
          Récupération des données agricoles...
        </Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View
        className="h-full w-full flex flex-col items-center justify-center gap-4 p-5 text-center"
        style={{ backgroundColor: "#020d06" }}
      >
        <Text className="text-4xl">🌾</Text>
        <View>
          <Text className="text-white font-bold text-sm">Produit introuvable</Text>
          <Text className="text-white/40 text-[10px] mt-1">
            L'annonce a été retirée ou n'est plus en stock.
          </Text>
        </View>
        <Pressable
          onPress={onBack}
          className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-white/80 font-bold text-xs"
        >
          <Text>Retour au marché</Text></Pressable>
      </View>
    );
  }

  return (
    <View className="h-full w-full flex flex-col bg-[#020d06] relative overflow-hidden">
      {/* En-tête flottant avec contrôles d'actions */}
      <View className="absolute top-0 left-0 right-0 z-20 px-5 pt-12 flex items-center justify-between">
        <Pressable
          onPress={onBack}
          className="w-10 h-10 rounded-2xl bg-black/40 flex items-center justify-center border border-white/5"
        >
          <ArrowLeft size={18} className="text-white" />
        </Pressable>

        <View className="flex items-center gap-2.5">
          <Pressable
            onPress={() => setIsFavorite(!isFavorite)}
            className="w-10 h-10 rounded-2xl bg-black/40 flex items-center justify-center border border-white/5"
          >
            <Heart
              size={18}
              className={
                isFavorite ? "fill-red-500 text-red-500" : "text-white"
              }
            />
          </Pressable>

          <Pressable
            onPress={handleShare}
            className="w-10 h-10 rounded-2xl bg-black/40 flex items-center justify-center border border-white/5"
          >
            <Share2 size={18} className="text-white" />
          </Pressable>
        </View>
      </View>

      {/* Corps défilant */}
      <View className="flex-1 overflow-y-auto pb-28 scrollbar-none">
        <AgriHero product={product} />

        <View className="px-5 mt-4 space-y-4">
          <AgriProductInfo product={product} />
          <AgriPricing product={product} />
          <AgriAvailability product={product} />
          <AgriDescription description={product.description} />
          <AgriSellerSection
            seller={product.seller}
            onNavigate={onNavigate}
          />{" "}
          {/* ✅ Appel mis à jour */}
          <AgriLocation location={product.location} />
          {product.location.coordinates && (
            <AgriMap location={product.location} />
          )}
          <AgriDelivery delivery={product.delivery} />
          <AgriReviews productId={productId} />
          <AgriSafety />
          <AgriSimilar productId={productId} onNavigate={onNavigate} />
        </View>
      </View>

      {/* Barre d'action fixe inférieure */}
      <AgriStickyBar
        product={product}
        onContact={() => setIsContactSheetOpen(true)}
        onBuy={() => {
          UIService.openToast("Demande d'achat envoyée au producteur !", "success");
        }}
      />

      {/* Feuilles de dialogue contextuelles */}
      <>
        {isContactSheetOpen && (
          <ContactSellerSheet
            isOpen={isContactSheetOpen}
            onClose={() => setIsContactSheetOpen(false)}
            seller={product.seller}
            product={product}
          />
        )}
      </>
    </View>
  );
}

// Composant interne Loader2 de secours si non importé globalement
function Loader2({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
