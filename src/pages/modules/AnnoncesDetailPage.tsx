import { useLocalSearchParams, useRouter } from "expo-router";
import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable } from "react-native";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
// Composants du module annonce
import {
  AnnonceGallery,
  AnnonceHeader,
  AnnoncePrice,
  AnnonceDescription,
  AnnonceAttributes,
  AnnonceCondition,
  AnnonceLocation,
  AnnonceMap,
  AnnonceSeller,
  AnnonceStatistics,
  AnnonceReviews,
  AnnonceSafety,
  AnnonceHistory,
  AnnonceActions,
  AnnonceContact,
  AnnonceNearby,
  AnnonceRecommendations,
  AnnonceQuestions,
  AnnonceOffers,
  AnnonceWarranty,
  AnnonceDocuments,
  AnnonceMedia,
  AnnonceBoost,
  AnnonceFooter,
} from "@/features/annonce/components";

import { useAnnonceFavorite } from "@/features/annonce/hooks";
import type { Annonce } from "@/features/annonce/types";
import { adaptAnnonce } from "@/features/annonce/adapter";

export default function AnnoncesDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // --- État local ---
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [annonce, setAnnonce] = useState<Annonce | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Queries & Mutations ---
  const publication = useQuery(
    api.publications.getPublication,
    id ? { id: id as any } : "skip",
  );

  const trackView = useMutation(api.publications.trackView);
  const createOffer = useMutation(api.publications.createOffer);
  const incrementShare = useMutation(api.publications.incrementShare);

  // --- Adaptateur : publication → annonce ---
  useEffect(() => {
    if (publication === undefined) {
      setLoading(true);
      return;
    }
    if (publication) {
      const adapted = adaptAnnonce(publication);
      setAnnonce(adapted);
      setIsLiked(false);
      setLoading(false);
    } else {
      setAnnonce(null);
      setLoading(false);
    }
  }, [publication]);

  // --- Tracking des vues ---
  useEffect(() => {
    if (annonce?._id) {
      trackView({ publicationId: annonce._id as any }).catch(() => {
        // Silencieux en production
      });
    }
  }, [annonce?._id, trackView]);

  // --- Gestion des favoris ---
  const { isFavorited, toggle: toggleFavoriteHandler } = useAnnonceFavorite(
    id || "",
    isLiked,
  );

  // --- Gestion des offres ---
  const handleMakeOffer = async (amount: number, message: string) => {
    if (!annonce) return;
    try {
      await createOffer({
        publicationId: annonce._id as any,
        amount,
        message: message || "Offre d'achat",
      });
      UIService.openToast("Offre envoyée !", "success");
    } catch {
      UIService.openToast("Erreur lors de l'envoi de l'offre", "error");
    }
  };

  // --- Contacter le vendeur ---
  const handleContact = () => {
    if (annonce?.ownerId) {
      router.push(`/messages/new?userId=${annonce.ownerId}`);
    }
  };

  // --- Partager (avec incrémentation du compteur) ---
  const handleShare = async () => {
    if (!annonce) return;
    try {
      await incrementShare({ publicationId: annonce._id as any });
    } catch {
      // Silencieux
    }

    if (undefined) {
      try {
        await undefined;
        UIService.openToast("Annonce partagée !", "success");
      } catch {
        // Utilisateur a annulé
      }
    } else {
      try {
        await undefined?.writeText(undefined.href);
        UIService.openToast("Lien copié dans le presse-papier", "info");
      } catch {
        UIService.openToast("Impossible de copier le lien", "error");
      }
    }
  };

  // --- États de chargement ---
  if (!id) {
    return (
      <View
        className="h-full flex items-center justify-center"
        style={{  }}
      >
        <Text className="text-white/50">ID invalide</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View
        className="h-full flex flex-col"
        style={{  }}
      >
        <View className="flex-shrink-0 px-4 pt-12 pb-3">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
          >
            <ArrowLeft size={18} className="text-white" />
          </Pressable>
        </View>
        <View className="flex-1 px-4 pb-6 space-y-4">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-12 w-3/4 rounded-2xl" />
          <Skeleton className="h-6 w-1/2 rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <View className="gap-3">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </View>
        </View>
      </View>
    );
  }

  if (!annonce) {
    return (
      <View
        className="h-full flex flex-col items-center justify-center gap-3"
        style={{  }}
      >
        <Pressable
          onPress={() => router.back()}
          className="self-start ml-4 w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
        >
          <ArrowLeft size={18} className="text-white" />
        </Pressable>
        <View className="text-white/40"><Text>Annonce introuvable</Text></View>
      </View>
    );
  }

  // --- Données simulées (à connecter au backend plus tard) ---
  const mockReviews = [
    {
      id: "1",
      reviewerName: "Jean K.",
      rating: 5,
      comment: "Transaction parfaite, je recommande !",
      date: new Date().toISOString(),
    },
    {
      id: "2",
      reviewerName: "Marie L.",
      rating: 4,
      comment: "Bon produit, livraison rapide.",
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ];

  const mockQuestions = [
    {
      id: "1",
      question: "Est-ce que le produit est toujours disponible ?",
      answer: "Oui, il est toujours disponible.",
      date: new Date().toISOString(),
      askerName: "Paul D.",
    },
    {
      id: "2",
      question: "Acceptez-vous la livraison à Kinshasa ?",
      answer: "Oui, je livre partout en RDC.",
      date: new Date(Date.now() - 86400000 * 3).toISOString(),
      askerName: "Sophie M.",
    },
  ];

  const mockOffers = [
    {
      id: "1",
      buyerName: "David K.",
      buyerId: "user1",
      amount: 150,
      currency: "USD",
      status: "pending" as const,
      date: Date.now() - 3600000,
      message: "Je suis intéressé, propose 150$",
    },
  ];

  const mockNearby = [
    { name: "Marché Central", type: "supermarket" as const, distance: "200m" },
    { name: "Café du Coin", type: "cafe" as const, distance: "350m" },
    { name: "Station Total", type: "gas" as const, distance: "800m" },
  ];

  const mockDocuments = [
    {
      id: "1",
      name: "Facture d'achat.pdf",
      url: "#",
      type: "pdf" as const,
      size: "240 KB",
    },
    {
      id: "2",
      name: "Certificat de garantie.pdf",
      url: "#",
      type: "pdf" as const,
      size: "120 KB",
    },
  ];

  return (
    <View
      className="h-full flex flex-col"
      style={{  }}
    >
      {/* En-tête avec navigation et actions */}
      <AnnonceHeader
        annonce={annonce}
        isFavorited={isFavorited}
        onFavorite={toggleFavoriteHandler}
        onShare={handleShare}
        onBack={() => router.back()}
      />

      {/* Corps de la page */}
      <View className="flex-1 overflow-y-auto px-4 pb-8 space-y-5">
        <View
          className="space-y-4"
        >
          {/* Galerie */}
          <AnnonceGallery
            images={annonce.images}
            title={annonce.title}
            video={annonce.videos?.[0]}
          />

          {/* Prix */}
          <AnnoncePrice annonce={annonce} showOriginalPrice />

          {/* Titre & catégorie */}
          <View>
            <Text className="text-xl font-bold text-white">{annonce.title}</Text>
            <View className="flex items-center gap-2 mt-1 flex-wrap">
              <Text className="text-xs text-white/40">{annonce.type}</Text>
              <Text className="text-xs text-white/20"><Text>·</Text></Text>
              <Text className="text-xs text-white/40">
                {annonce.location || "Localisation non spécifiée"}
              </Text>
            </View>
          </View>

          {/* Description */}
          <AnnonceDescription
            description={annonce.description}
            maxLength={600}
          />

          {/* Condition */}
          {annonce.condition && (
            <AnnonceCondition condition={annonce.condition} />
          )}

          {/* Attributs */}
          <AnnonceAttributes annonce={annonce} />

          {/* Garantie */}
          <AnnonceWarranty
            months={annonce.warrantyMonths}
            description="Garantie constructeur incluse"
            isTransferable
          />

          {/* Sécurité */}
          <AnnonceSafety isVerified isTrusted hasPaymentProtection />

          {/* Statistiques */}
          <AnnonceStatistics publicationId={annonce._id as any} />

          {/* Localisation */}
          <AnnonceLocation
            location={annonce.location}
            latitude={annonce.latitude}
            longitude={annonce.longitude}
          />

          {/* Carte interactive */}
          <AnnonceMap
            location={annonce.location}
            latitude={annonce.latitude}
            longitude={annonce.longitude}
          />

          {/* Vendeur */}
          <AnnonceSeller
            ownerName={annonce.ownerName}
            ownerAvatar={annonce.ownerAvatar}
            ownerPhone={annonce.ownerPhone}
            ownerId={annonce.ownerId}
            createdAt={annonce.createdAt}
            rating={annonce.avgRating || 4.8}
            reviewCount={annonce.reviewCount || 24}
            onContact={handleContact}
          />

          {/* Actions principales */}
          <AnnonceActions
            publicationId={annonce._id as any}
            ownerId={annonce.ownerId as any}
            phone={annonce.ownerPhone}
            isSold={annonce.isSold}
            isReserved={annonce.isReserved}
            isFavorited={isFavorited}
            isFollowing={false}
            title={annonce.title}
            onCall={() => {
              if (annonce.ownerPhone) {
                undefined.href = `tel:${annonce.ownerPhone}`;
              }
            }}
            onBuy={() =>
              UIService.openToast("Fonctionnalité d'achat à venir avec DébrouillePay", "info")
            }
            onReserve={() => UIService.openToast("Demande de réservation envoyée !", "success")}
            onFavorite={toggleFavoriteHandler}
            onShare={handleShare}
            onReport={() => UIService.openToast("Signalement en cours...", "info")}
          />

          {/* Historique des prix */}
          <AnnonceHistory
            createdAt={annonce.createdAt}
            priceHistory={[
              {
                date: annonce.createdAt - 86400000 * 30,
                price: (annonce.price || 0) * 0.9,
              },
            ]}
            currency={annonce.currency}
          />

          {/* Questions / Réponses */}
          <AnnonceQuestions
            publicationId={annonce._id as any}
            canAsk={!!annonce.ownerId}
          />

          {/* Offres */}
          <AnnonceOffers
            publicationId={annonce._id as any}
            canMakeOffer={!annonce.isSold && !annonce.isReserved}
          />

          {/* Vidéos */}
          {annonce.videos && annonce.videos.length > 0 && (
            <AnnonceMedia
              videos={annonce.videos}
              images={annonce.images}
              title={annonce.title}
            />
          )}

          {/* Documents */}
          <AnnonceDocuments documents={mockDocuments} />

          {/* À proximité */}
          <AnnonceNearby places={mockNearby} city={annonce.location} />

          {/* Avis */}
          <AnnonceReviews
            publicationId={annonce._id as any}
            canReview={!!annonce.ownerId}
          />

          {/* Recommandations */}
          <AnnonceRecommendations
            publicationId={annonce._id as any}
            title="Produits similaires"
          />

          {/* Booster l'annonce */}
          <AnnonceBoost
            publicationId={annonce._id as any}
            isPromoted={annonce.isPromoted || false}
            promotionEnd={annonce.promotionEnd}
          />

          {/* Pied de page social */}
          <AnnonceFooter
            publicationId={annonce._id as any}
            onLike={toggleFavoriteHandler}
            onComment={handleContact}
            onShare={handleShare}
            onBookmark={() => setIsBookmarked(!isBookmarked)}
            onReport={() => UIService.openToast("Signalement en cours...", "info")}
            isLiked={isFavorited}
            isBookmarked={isBookmarked}
            likeCount={annonce.likeCount}
            commentCount={annonce.offerCount}
            shareCount={annonce.shareCount}
          />
        </View>
      </View>
    </View>
  );
}
