import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, AlertCircle, EyeOff } from "lucide-react-native";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Clipboard } from "@react-native-clipboard/clipboard";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

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

/* ════════════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════════════ */

interface AnnoncesDetailPageProps {
  id?: string;
  onBack?: () => void;
  onOpenMessages?: (userId: string) => void;
}

/* ════════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ════════════════════════════════════════════════════════════════════════════ */

const T = {
  bg: "#07070C",
  text: "#FFFFFF",
  dim: "rgba(255,255,255,0.58)",
  faint: "rgba(255,255,255,0.32)",
  border: "rgba(255,255,255,0.08)",
} as const;

const SCREEN_W = Dimensions.get("window").width;

/* ════════════════════════════════════════════════════════════════════════════
   PRIMITIVES
   ════════════════════════════════════════════════════════════════════════════ */

function Skeleton({
  style,
}: {
  style?: React.ComponentProps<typeof Animated.View>["style"];
}) {
  const opacity = useRef(new Animated.Value(0.28)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.65,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.28,
          duration: 850,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          backgroundColor: "rgba(255,255,255,0.06)",
          borderRadius: 18,
          opacity,
        },
        style,
      ]}
    />
  );
}

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [
        styles.backBtn,
        {
          transform: [{ scale: pressed ? 0.92 : 1 }],
        },
      ]}
    >
      <ArrowLeft size={18} color="#fff" />
    </Pressable>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   ÉTATS DE CHARGEMENT / ERREUR
   ════════════════════════════════════════════════════════════════════════════ */

function LoadingState({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <BackButton onPress={onBack} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.loadingContent}
        showsVerticalScrollIndicator={false}
      >
        <Skeleton style={{ height: 260, borderRadius: 22 }} />

        <Skeleton
          style={{
            height: 44,
            width: "70%",
            marginTop: 18,
          }}
        />

        <Skeleton
          style={{
            height: 22,
            width: "45%",
            marginTop: 12,
          }}
        />

        <Skeleton
          style={{
            height: 180,
            marginTop: 20,
          }}
        />

        <Skeleton
          style={{
            height: 90,
            marginTop: 14,
          }}
        />

        <Skeleton
          style={{
            height: 90,
            marginTop: 14,
          }}
        />
      </ScrollView>
    </View>
  );
}

function InvalidIdState({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <BackButton onPress={onBack} />
      </View>

      <View style={styles.centerState}>
        <View style={styles.centerIcon}>
          <AlertCircle size={28} color={T.faint} />
        </View>

        <Text style={styles.centerTitle}>Identifiant invalide</Text>

        <Text style={styles.centerText}>
          Le lien est peut-être incomplet. Retourne à la liste et réessaie.
        </Text>
      </View>
    </View>
  );
}

function NotFoundState({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <BackButton onPress={onBack} />
      </View>

      <View style={styles.centerState}>
        <View style={styles.centerIcon}>
          <EyeOff size={28} color={T.faint} />
        </View>

        <Text style={styles.centerTitle}>Annonce introuvable</Text>

        <Text style={styles.centerText}>
          Elle a peut-être été supprimée ou vendue. Découvre d'autres annonces
          dans la liste.
        </Text>
      </View>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
   ════════════════════════════════════════════════════════════════════════════ */

export default function AnnoncesDetailPage({
  id,
  onBack,
  onOpenMessages,
}: AnnoncesDetailPageProps) {
  const router = useRouter();

  /*
   * onBack est optionnel côté parent.
   * handleBack garantit donc toujours une fonction valide pour
   * les sous-composants qui exigent onBack: () => void.
   */
  const handleBack = onBack ?? (() => router.back());

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLikedLocal, setIsLikedLocal] = useState(false);

  const publicationId = id as Id<"publications"> | undefined;

  const publication = useQuery(
    api.publications.getPublication,
    publicationId ? { id: publicationId } : "skip",
  );

  const trackView = useMutation(api.publications.trackView);

  const incrementShare = useMutation(api.publications.incrementShare);

  const annonce: Annonce | null = useMemo(
    () => (publication ? adaptAnnonce(publication) : null),
    [publication],
  );

  const { isFavorited, toggle: toggleFavoriteHandler } = useAnnonceFavorite(
    id ?? "",
    isLikedLocal,
  );

  /* ── Tracking des vues : une seule fois par publication ─────────────── */

  const trackedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!annonce?._id) {
      return;
    }

    if (trackedRef.current === annonce._id) {
      return;
    }

    trackedRef.current = annonce._id;

    trackView({
      publicationId: annonce._id as Id<"publications">,
    }).catch(() => {
      /* best-effort */
    });
  }, [annonce?._id, trackView]);

  /* ── Handlers ───────────────────────────────────────────────────────── */

  const handleContact = () => {
    if (!annonce?.ownerId) {
      return;
    }

    if (onOpenMessages) {
      onOpenMessages(annonce.ownerId);
      return;
    }

    toast.info("Messagerie bientôt disponible");
  };

  const handleShare = async () => {
    if (!annonce?._id) {
      return;
    }

    incrementShare({
      publicationId: annonce._id as Id<"publications">,
    }).catch(() => {
      /* best-effort */
    });

    const shareUrl = `https://debrouille.pro/annonces/${annonce._id}`;

    const title = annonce.title || "Annonce";

    try {
      if (
        Platform.OS === "web" &&
        typeof navigator !== "undefined" &&
        "share" in navigator &&
        typeof navigator.share === "function"
      ) {
        await navigator.share({
          title,
          text: title,
          url: shareUrl,
        });

        toast.success("Annonce partagée !");
        return;
      }

      const result = await Share.share(
        {
          title,
          message: `${title}\n${shareUrl}`,
          url: shareUrl,
        },
        {
          dialogTitle: "Partager cette annonce",
        },
      );

      if (result.action === Share.sharedAction) {
        toast.success("Annonce partagée !");
      }
    } catch {
      try {
        Clipboard.setString(shareUrl);
        toast.info("Lien copié dans le presse-papier");
      } catch {
        toast.error("Impossible de partager l'annonce");
      }
    }
  };

  const handleCall = () => {
    if (!annonce?.ownerPhone) {
      return;
    }

    Linking.openURL(`tel:${annonce.ownerPhone}`).catch(() => {
      toast.error("Impossible d'ouvrir l'application téléphone");
    });
  };

  const handleBuy = () => {
    toast.info("Fonctionnalité d'achat à venir avec DébrouillePay");
  };

  const handleReserve = () => {
    toast.success("Demande de réservation envoyée !");
  };

  const handleReport = () => {
    toast.info("Signalement en cours…");
  };

  const handleToggleFavorite = () => {
    setIsLikedLocal((value) => !value);
    toggleFavoriteHandler();
  };

  /* ── États ───────────────────────────────────────────────────────────── */

  if (!id) {
    return <InvalidIdState onBack={handleBack} />;
  }

  if (publication === undefined) {
    return <LoadingState onBack={handleBack} />;
  }

  if (!annonce) {
    return <NotFoundState onBack={handleBack} />;
  }

  /* ── Rendu ───────────────────────────────────────────────────────────── */

  return (
    <View style={styles.root}>
      <AnnonceHeader
        annonce={annonce}
        isFavorited={isFavorited}
        onFavorite={handleToggleFavorite}
        onShare={handleShare}
        onBack={handleBack}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={styles.section}>
          {/* Galerie */}
          <AnnonceGallery
            images={annonce.images}
            title={annonce.title}
            video={annonce.videos?.[0]}
          />

          {/* Prix */}
          <AnnoncePrice annonce={annonce} showOriginalPrice />

          {/* Titre + meta */}
          <View style={{ marginTop: 4 }}>
            <Text style={styles.title}>{annonce.title}</Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{annonce.type}</Text>

              <View style={styles.metaDot} />

              <Text style={styles.metaText} numberOfLines={1}>
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
          {annonce.condition ? (
            <AnnonceCondition condition={annonce.condition} />
          ) : null}

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
          <AnnonceStatistics
            publicationId={annonce._id as Id<"publications">}
          />

          {/* Localisation */}
          <AnnonceLocation
            location={annonce.location}
            latitude={annonce.latitude}
            longitude={annonce.longitude}
          />

          {/* Carte */}
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
            rating={annonce.avgRating ?? 0}
            reviewCount={annonce.reviewCount ?? 0}
            onContact={handleContact}
          />

          {/* Actions principales */}
          <AnnonceActions
            publicationId={annonce._id as Id<"publications">}
            ownerId={annonce.ownerId as Id<"users">}
            phone={annonce.ownerPhone}
            isSold={annonce.isSold}
            isReserved={annonce.isReserved}
            isFavorited={isFavorited}
            isFollowing={false}
            title={annonce.title}
            onCall={handleCall}
            onBuy={handleBuy}
            onReserve={handleReserve}
            onFavorite={handleToggleFavorite}
            onShare={handleShare}
            onReport={handleReport}
          />

          {/* Historique */}
          <AnnonceHistory
            createdAt={annonce.createdAt}
            priceHistory={[]}
            currency={annonce.currency}
          />

          {/* Questions */}
          <AnnonceQuestions
            publicationId={annonce._id as Id<"publications">}
            canAsk={Boolean(annonce.ownerId)}
          />

          {/* Offres
              Le composant AnnonceOffers possède déjà sa propre mutation
              createOffer. Le callback onSubmitOffer n'existe pas dans son
              contrat et n'est donc pas injecté artificiellement ici. */}
          <AnnonceOffers
            publicationId={annonce._id as Id<"publications">}
            canMakeOffer={!annonce.isSold && !annonce.isReserved}
          />

          {/* Médias */}
          {annonce.videos && annonce.videos.length > 0 ? (
            <AnnonceMedia
              videos={annonce.videos}
              images={annonce.images}
              title={annonce.title}
            />
          ) : null}

          {/* Documents
              Aucun backend annonceDocuments n'existe actuellement.
              On ne fabrique donc aucun document fictif. */}
          <AnnonceDocuments documents={[]} />

          {/* À proximité
              Le composant actuel accepte city/places, pas latitude/longitude.
              Le vrai backend Nearby reste un chantier séparé. */}
          <AnnonceNearby city={annonce.location} />

          {/* Avis */}
          <AnnonceReviews
            publicationId={annonce._id as Id<"publications">}
            canReview={Boolean(annonce.ownerId)}
          />

          {/* Recommandations */}
          <AnnonceRecommendations
            publicationId={annonce._id as Id<"publications">}
            title="Produits similaires"
          />

          {/* Boost */}
          <AnnonceBoost
            publicationId={annonce._id as Id<"publications">}
            isPromoted={annonce.isPromoted ?? false}
            promotionEnd={annonce.promotionEnd}
          />

          {/* Footer */}
          <AnnonceFooter
            publicationId={annonce._id as Id<"publications">}
            onLike={handleToggleFavorite}
            onComment={handleContact}
            onShare={handleShare}
            onBookmark={() => setIsBookmarked((value) => !value)}
            onReport={handleReport}
            isLiked={isFavorited}
            isBookmarked={isBookmarked}
            likeCount={annonce.likeCount}
            commentCount={annonce.offerCount}
            shareCount={annonce.shareCount}
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   STYLES
   ════════════════════════════════════════════════════════════════════════════ */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },

  header: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 6,
  },

  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: T.border,
  },

  loadingContent: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 80,
  },

  section: {
    gap: 18,
  },

  title: {
    color: T.text,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.4,
    lineHeight: 28,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    flexWrap: "wrap",
  },

  metaText: {
    color: T.faint,
    fontSize: 12,
    fontWeight: "600",
  },

  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: T.faint,
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 14,
  },

  centerIcon: {
    width: 76,
    height: 76,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 4,
  },

  centerTitle: {
    color: T.text,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.3,
    textAlign: "center",
  },

  centerText: {
    color: T.dim,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 300,
  },
});
