import { Pressable, View, Text, Share } from "react-native";

// src/features/agri/pages/AgriDetailPage.tsx
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft, Share2, Heart } from "lucide-react-native";
import { toast } from "sonner"; // ✅ Ajout de l'import toast manquant

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
import { Clipboard } from "@react-native-clipboard/clipboard";

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
    if (navigator.share) {
      Share.share({ message: String(product?.description) + "\n" + "\n" + String(window.location.href), title: product?.title || "Produit Agricole sur DébrouillePro" })
        .catch(() => null);
    } else {
      Clipboard.setString(window.location.href);
      toast("Lien copié dans le presse-papier !");
    }
  };

  if (isLoading) {
    return (
      <View className="h-full w-full flex flex-col items-center justify-center gap-3" style={{ backgroundColor: "#020d06" }}><Loader2 size={24} className="text-green-500 animate-spin" /><Text className="text-white/40 text-xs font-semibold">Récupération des données agricoles...
        </Text></View>
    );
  }

  if (!product) {
    return (
      <View className="h-full w-full flex flex-col items-center justify-center gap-4 p-5 text-center" style={{ backgroundColor: "#020d06" }}><Text className="text-4xl">🌾</Text><View><Text className="text-white font-bold text-sm">Produit introuvable</Text><Text className="text-white/40 text-[10px] mt-1">L'annonce a été retirée ou n'est plus en stock.
          </Text></View><Pressable onPress={onBack} className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-white/80 font-bold text-xs"><Text>Retour au marché</Text></Pressable></View>
    );
  }

  return (
    <View className="h-full w-full flex flex-col bg-[#020d06] relative overflow-hidden">{}<View className="absolute top-0 left-0 right-0 z-20 px-5 pt-12 flex items-center justify-between pointer-events-none"><Pressable whileTap={{ scale: 0.92 }} onPress={onBack} className="w-10 h-10 rounded-2xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/5 active:bg-black/60 transition-colors pointer-events-auto"><ArrowLeft size={18} className="text-white" /></Pressable><View className="flex items-center gap-2.5 pointer-events-auto"><Pressable whileTap={{ scale: 0.92 }} onPress={() => setIsFavorite(!isFavorite)} className="w-10 h-10 rounded-2xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/5 active:bg-black/60 transition-colors"><Heart size={18} className={
                isFavorite ? "fill-red-500 text-red-500" : "text-white"
              } /></Pressable><Pressable whileTap={{ scale: 0.92 }} onPress={handleShare} className="w-10 h-10 rounded-2xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/5 active:bg-black/60 transition-colors"><Share2 size={18} className="text-white" /></Pressable></View></View>{}<View className="flex-1 overflow-y-auto pb-28"><AgriHero product={product} /><View className="px-5 mt-4 space-y-4"><AgriProductInfo product={product} /><AgriPricing product={product} /><AgriAvailability product={product} /><AgriDescription description={product.description} /><AgriSellerSection seller={product.seller} onNavigate={onNavigate} />{" "}{}<AgriLocation location={product.location} />{product.location.coordinates && (
            <AgriMap location={product.location} />
          )}<AgriDelivery delivery={product.delivery} /><AgriReviews productId={productId} /><AgriSafety /><AgriSimilar productId={productId} onNavigate={onNavigate} /></View></View>{}<AgriStickyBar product={product} onContact={() => setIsContactSheetOpen(true)} onBuy={() => {
          toast.success("Demande d'achat envoyée au producteur !");
        }} />{}<View>{isContactSheetOpen && (
          <ContactSellerSheet
            isOpen={isContactSheetOpen}
            onClose={() => setIsContactSheetOpen(false)}
            seller={product.seller}
            product={product}
          />
        )}</View></View>
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
