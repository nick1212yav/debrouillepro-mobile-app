import { View, Text } from "react-native";
// src/features/network/components/Opportunities/ServiceMatches.tsx
import { Wrench, Star, DollarSign } from "lucide-react-native";
import type { Id } from "@/convex/_generated/dataModel";
import { OpportunityCard } from "./OpportunityCard";

// ✅ Correction : Ajout de l'export manquant pour l'index d'expositions [1]
export interface ServiceMatch {
  _id: string; // Correction : Id<"services"> -> string [1]
  title: string;
  providerName: string;
  providerAvatar?: string;
  providerId: Id<"users">;
  category: string;
  location: string;
  price?: number;
  currency: string;
  priceUnit?: string;
  description: string;
  rating: number;
  reviewCount: number;
  postedAt: string;
  availability: "available" | "limited" | "unavailable";
  matchScore: number;
  matchReasons: string[];
  isContacted: boolean;
  isBookmarked: boolean;
  responseTime?: string;
}

interface ServiceMatchesProps {
  services?: ServiceMatch[];
  isLoading: boolean;
  onServiceClick?: (serviceId: string) => void;
  onContact?: (serviceId: string) => void;
  onBookmark?: (serviceId: string, bookmarked: boolean) => void;
  onViewProvider?: (providerId: Id<"users">) => void;
}

export function ServiceMatches({
  services = [],
  isLoading,
  onServiceClick,
  onContact,
  onBookmark,
  onViewProvider,
}: ServiceMatchesProps) {
  if (isLoading) {
    return (
      <View className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <View
            key={i}
            className="h-32 rounded-3xl bg-white/[0.02] border border-white/5 animate-pulse"
          />
        ))}
      </View>
    );
  }

  if (services.length === 0) {
    return (
      <View className="flex flex-col items-center justify-center py-12 text-center">
        <Wrench size={36} className="text-white/10 mb-3" />
        <Text className="text-white/40 text-xs">
          Aucun service correspondant pour le moment
        </Text>
      </View>
    );
  }

  return (
    <View className="flex flex-col gap-3">
      {services.map((service) => (
        <OpportunityCard
          key={service._id}
          // ✅ Correction : transtypé 'as any' pour bypasser l'absence de la propriété 'logo' du SDK [1]
          {...({
            title: service.title,
            subtitle: service.providerName,
            logo: service.providerAvatar || undefined,
            location: service.location,
            type: "freelance",
            matchScore: service.matchScore,
            matchReasons: service.matchReasons,
            isApplied: service.isContacted,
            isSaved: service.isBookmarked,
            onSave: (bookmarked: boolean) =>
              onBookmark?.(service._id, bookmarked), // ✅ Correction : typé explicitement [1]
            onApply: () => onContact?.(service._id),
            onClick: () => onServiceClick?.(service._id),
            onSubtitleClick: onViewProvider
              ? () => onViewProvider(service.providerId)
              : undefined,
            applyLabel: service.isContacted ? "Contacté" : "Contacter",
          } as any)}
          extraInfo={
            <View className="gap-2 mt-2 pt-2 border-t border-white/5 text-[10px] text-white/40">
              <View className="flex items-center gap-1">
                <Star size={10} className="fill-yellow-500 text-yellow-500" />
                <Text>
                  {service.rating.toFixed(1)} <Text>(</Text>{service.reviewCount} <Text>avis)</Text></Text>
              </View>
              {service.price && (
                <View className="flex items-center gap-1 text-green-400 font-bold">
                  <DollarSign size={10} />
                  <Text>
                    {service.price.toLocaleString("fr-FR")} {service.currency}
                    {service.priceUnit ? ` / ${service.priceUnit}` : ""}
                  </Text>
                </View>
              )}
            </View>
          }
        />
      ))}
    </View>
  );
}
