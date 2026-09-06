import { useLocalSearchParams, useRouter } from "expo-router";
import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Linking } from "react-native";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ServiceHeader,
  ServiceGallery,
  ServiceDescription,
  ServicePricing,
  ServiceAvailability,
  ServiceLocation,
  ServiceMap,
  ServiceActions,
  ServiceFooter,
  ServiceStatistics,
  ServiceReviews,
  ServiceRecommendations,
  ServicePortfolio,
  ServiceCertificates,
  ServiceSafety,
  ServiceHistory,
  ServiceDocuments,
  ServiceAIAssistant,
  ServiceBooking,
  ServicePayment,
} from "@/features/service/components";
import { useService, useServiceFavorite } from "@/features/service/hooks";
import type { ServiceProvider } from "@/features/service/types";
import { adaptServiceProvider } from "@/features/service/adapter";

export default function ServiceDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [showBooking, setShowBooking] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const doc = useQuery(
    api.serviceProviders.get,
    id ? { id: id as any } : "skip",
  );
  const provider = doc ? adaptServiceProvider(doc) : null;
  const { isFavorited, toggle } = useServiceFavorite(id as any, false);
  const trackView = useMutation(api.serviceProviders.trackView);

  useEffect(() => {
    if (provider?._id) {
      trackView({ providerId: provider._id }).catch(() => {});
    }
  }, [provider?._id, trackView]);

  if (!id) return <View className="text-white/50"><Text>ID invalide</Text></View>;
  if (!provider)
    return (
      <View className="p-4">
        <Skeleton className="h-64 w-full rounded-2xl" />
      </View>
    );

  const handleShare = async () => {
    if (undefined) {
      await undefined;
    } else {
      await undefined?.writeText(undefined.href);
      UIService.openToast("Lien copié", "info");
    }
  };

  // ✅ Images pour la galerie : utiliser le portfolio ou l'image principale
  const galleryImages =
    provider.portfolio && provider.portfolio.length > 0
      ? provider.portfolio
      : provider.imageUrl
        ? [provider.imageUrl]
        : [];

  // ✅ Le portfolio affiche toutes les images (sauf si c'est la même que la galerie)
  const portfolioImages = provider.portfolio || [];

  return (
    <View
      className="h-full flex flex-col"
      style={{  }}
    >
      <ServiceHeader
        provider={provider}
        isFavorited={isFavorited}
        onFavorite={toggle}
        onShare={handleShare}
        onBack={() => router.back()}
      />

      <View className="flex-1 overflow-y-auto px-4 pb-8 space-y-5">
        <View
          className="space-y-4"
        >
          {/* ✅ Galerie avec les images du portfolio */}
          <ServiceGallery images={galleryImages} title={provider.name} />

          <View className="flex items-start justify-between">
            <View>
              <Text className="text-2xl font-bold text-white">{provider.name}</Text>
              <View className="flex items-center gap-2 mt-1">
                <Text className="text-orange-400 text-sm">
                  {provider.specialty}
                </Text>
                {provider.verified && (
                  <Text className="text-green-400 text-xs">✅ Vérifié</Text>
                )}
              </View>
            </View>
          </View>

          <View className="flex flex-wrap gap-2">
            {provider.urgent && (
              <Text className="px-3 py-1 rounded-full text-xs bg-red-500/20 text-red-400">
                ⚡ Urgence 24h
              </Text>
            )}
            {provider.available && (
              <Text className="px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                ✅ Disponible
              </Text>
            )}
          </View>

          <ServiceDescription description={provider.description} />

          <View>
            <Text className="text-sm font-medium text-white/50 mb-2">
              Compétences
            </Text>
            <View className="flex flex-wrap gap-2">
              {provider.skills.map((s: string) => (
                <Text
                  key={s}
                  className="px-3 py-1 rounded-full text-xs bg-white/5 border border-white/5 text-white/70"
                >
                  {s}
                </Text>
              ))}
            </View>
          </View>

          <ServicePricing
            price={provider.price}
            currency={provider.currency || "USD"}
          />
          <ServiceAvailability providerId={provider._id} />
          <ServiceLocation location={provider.location} />
          <ServiceMap location={provider.location} />

          <ServiceActions
            onCall={() => (undefined.href = "tel:+243...")}
            onWhatsApp={() => Linking.openURL("https://wa.me/243...")}
            onMessage={() =>
              router.push(`/messages/new?userId=${provider.userId}`)
            }
            onBook={() => setShowBooking(true)}
            onPay={() => setShowPayment(true)}
          />

          {/* ✅ Portfolio : affiche toutes les images en grille (si plus d'une image) */}
          {portfolioImages.length > 1 && (
            <ServicePortfolio images={portfolioImages} />
          )}

          {provider.certificates && provider.certificates.length > 0 && (
            <ServiceCertificates certificates={provider.certificates} />
          )}

          <ServiceSafety
            isVerified={provider.verified || false}
            hasInsurance={provider.insurance || false}
            hasWarranty={provider.warranty || false}
          />

          <ServiceStatistics
            reviews={provider.reviewCount}
            rating={provider.rating}
            responseTime={provider.responseTime}
          />
          <ServiceReviews providerId={provider._id} />
          <ServiceAIAssistant providerId={provider._id} />
          <ServiceHistory providerId={provider._id} />
          <ServiceRecommendations providerId={provider._id} />
          <ServiceFooter
            onLike={toggle}
            onShare={handleShare}
            isLiked={isFavorited}
          />
        </View>
      </View>

      <ServiceBooking
        isOpen={showBooking}
        onClose={() => setShowBooking(false)}
        providerId={provider._id}
      />
      <ServicePayment
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        amount={parseFloat(provider.price)}
        currency={provider.currency || "USD"}
        orderId={"" as any}
      />
    </View>
  );
}
