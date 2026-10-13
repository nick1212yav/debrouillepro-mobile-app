import { useLocalSearchParams, useRouter } from "expo-router";
import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Linking, Share } from "react-native";
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
  ServiceAIAssistant,
  ServiceBooking,
} from "@/features/service/components";
import { useServiceFavorite } from "@/features/service/hooks";
import { adaptServiceProvider } from "@/features/service/adapter";
import type { Id } from "@/convex/_generated/dataModel";

// Dev/preview : le catalogue actuel est en providers de démo.
// TODO : retirer allowDemo: true avant la prod.
const ALLOW_DEMO = true;

export default function ServiceDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [showBooking, setShowBooking] = useState(false);

  const doc = useQuery(
    api.services.providers.getProviderById,
    id ? { id: id as Id<"serviceProviders">, allowDemo: ALLOW_DEMO } : "skip",
  );

  const provider = doc ? adaptServiceProvider(doc) : null;

  const { isFavorited, toggle } = useServiceFavorite(
    (id as Id<"serviceProviders">) ?? ("" as Id<"serviceProviders">),
    false,
  );

  const trackView = useMutation(api.services.providers.trackView);

  useEffect(() => {
    if (provider?._id) {
      trackView({ providerId: provider._id }).catch(() => {});
    }
  }, [provider?._id, trackView]);

  if (!id) {
    return (
      <View className="p-4">
        <Text className="text-white/50">ID invalide</Text>
      </View>
    );
  }

  if (!provider) {
    return (
      <View className="p-4">
        <Skeleton className="h-64 w-full rounded-2xl" />
      </View>
    );
  }

  const handleShare = async () => {
    try {
      await Share.share({
        title: provider.name,
        message: `${provider.name} — ${provider.specialty} à ${provider.location}`,
      });
    } catch {
      UIService.openToast("Partage annulé", "info");
    }
  };

  const handleCall = () => {
    // TODO : récupérer le vrai numéro depuis provider.phone
    Linking.openURL("tel:+243").catch(() => {
      UIService.openToast("Numéro indisponible", "error");
    });
  };

  const handleWhatsApp = () => {
    // TODO : récupérer le vrai numéro depuis provider.whatsapp
    Linking.openURL("https://wa.me/243").catch(() => {
      UIService.openToast("WhatsApp indisponible", "error");
    });
  };

  const galleryImages =
    provider.portfolio && provider.portfolio.length > 0
      ? provider.portfolio
      : provider.imageUrl
        ? [provider.imageUrl]
        : [];

  const portfolioImages = provider.portfolio || [];

  return (
    <View className="h-full flex flex-col">
      <ServiceHeader
        provider={provider}
        isFavorited={isFavorited}
        onFavorite={toggle}
        onShare={handleShare}
        onBack={() => router.back()}
      />

      <View className="flex-1 px-4 pb-8 gap-5">
        <ServiceGallery images={galleryImages} title={provider.name} />

        <View className="flex-row items-start justify-between">
          <View>
            <Text className="text-2xl font-bold text-white">
              {provider.name}
            </Text>
            <View className="flex-row items-center gap-2 mt-1">
              <Text className="text-orange-400 text-sm">
                {provider.specialty}
              </Text>
              {provider.verified && (
                <Text className="text-green-400 text-xs">✅ Vérifié</Text>
              )}
            </View>
          </View>
        </View>

        <View className="flex-row flex-wrap gap-2">
          {provider.urgent && (
            <View className="px-3 py-1 rounded-full bg-red-500/20">
              <Text className="text-xs text-red-400">⚡ Urgence 24h</Text>
            </View>
          )}
          {provider.available && (
            <View className="px-3 py-1 rounded-full bg-green-500/20">
              <Text className="text-xs text-green-400">✅ Disponible</Text>
            </View>
          )}
        </View>

        <ServiceDescription description={provider.description} />

        <View>
          <Text className="text-sm font-medium text-white/50 mb-2">
            Compétences
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {provider.skills.map((s: string) => (
              <View
                key={s}
                className="px-3 py-1 rounded-full bg-white/5 border border-white/5"
              >
                <Text className="text-xs text-white/70">{s}</Text>
              </View>
            ))}
          </View>
        </View>

        <ServicePricing
          price={provider.price}
          currency={provider.currency || "USD"}
        />
        <ServiceAvailability providerId={provider._id} allowDemo={ALLOW_DEMO} />
        <ServiceLocation location={provider.location} />
        <ServiceMap location={provider.location} />

        <ServiceActions
          onCall={handleCall}
          onWhatsApp={handleWhatsApp}
          onMessage={() =>
            router.push(`/messages/new?userId=${provider.userId}`)
          }
          onBook={() => setShowBooking(true)}
        />

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
        <ServiceRecommendations
          providerId={provider._id}
          allowDemo={ALLOW_DEMO}
        />
        <ServiceFooter
          onLike={toggle}
          onShare={handleShare}
          isLiked={isFavorited}
        />
      </View>

      <ServiceBooking
        isOpen={showBooking}
        onClose={() => setShowBooking(false)}
        providerId={provider._id}
      />
    </View>
  );
}
