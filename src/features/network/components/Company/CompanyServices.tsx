import { View, Text, Pressable } from "react-native";

// src/features/network/components/Company/CompanyServices.tsx
import {
  Wrench,
  Tag,
  MapPin,
  Clock,
  Star,
  Users,
  ShoppingBag,
} from "lucide-react-native";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Service {
  _id: string;
  title: string;
  description?: string;
  category: string;
  price?: string;
  location?: string;
  rating?: number;
  reviewCount?: number;
  orderCount?: number;
}

interface CompanyServicesProps {
  services?: Service[];
  totalCount?: number;
  onViewAll?: () => void;
  onServiceClick?: (serviceId: string) => void;
  isLoading?: boolean;
  className?: string;
  maxDisplay?: number;
}

function ServiceItem({
  service,
  onClick,
}: {
  service: Service;
  onClick?: () => void;
}) {
  return (
    <View initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl bg-white/5 border border-white/5 transition-colors" onPress={onClick}>
      <View className="flex items-start justify-between gap-2"><View className="flex-1 min-w-0"><View className="flex items-center gap-2"><Text className="text-white font-semibold text-sm truncate">{service.title}</Text>{service.rating !== undefined && (
              <Text className="flex items-center gap-0.5 text-amber-400 text-xs"><Star size={11} className="fill-amber-400" />{service.rating.toFixed(1)}</Text>
            )}</View><View className="flex items-center gap-2 flex-wrap mt-1 text-xs text-white/40"><Text className="flex items-center gap-1"><Tag size={11} />{service.category}</Text>{service.location && (
              <Text className="flex items-center gap-1"><MapPin size={11} />{service.location}</Text>
            )}{service.price && (
              <Text className="text-emerald-400 font-medium">{service.price}</Text>
            )}</View>{service.description && (
            <Text className="text-white/40 text-xs mt-1">{service.description}</Text>
          )}</View><View className="flex flex-col items-end text-right flex-shrink-0 text-xs text-white/30">{service.reviewCount !== undefined && (
            <Text className="flex items-center gap-1"><Users size={11} />{service.reviewCount}avis
            </Text>
          )}{service.orderCount !== undefined && (
            <Text className="flex items-center gap-1"><ShoppingBag size={11} />{service.orderCount}commandes
            </Text>
          )}</View></View>
    </View>
  );
}

export function CompanyServices({
  services = [],
  totalCount,
  onViewAll,
  onServiceClick,
  isLoading = false,
  className,
  maxDisplay = 3,
}: CompanyServicesProps) {
  if (isLoading) {
    return (
      <View className={cn("space-y-3", className)}><View className="flex items-center justify-between"><View className="flex items-center gap-2"><Skeleton className="w-8 h-8 rounded-xl" /><Skeleton className="h-4 w-24 rounded-lg" /></View><Skeleton className="h-8 w-20 rounded-xl" /></View><Skeleton className="h-20 w-full rounded-xl" /><Skeleton className="h-20 w-full rounded-xl" /></View>
    );
  }

  const displayServices = services.slice(0, maxDisplay);
  const hasMore = (totalCount ?? services.length) > maxDisplay;
  const showViewAll = onViewAll && (hasMore || services.length > 0);

  if (services.length === 0) {
    return null;
  }

  return (
    <View initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn(
        "rounded-3xl p-5",
        "bg-white/5 border border-white/10",
        className,
      )}>
      <View className="flex items-center justify-between mb-4"><View className="flex items-center gap-2"><View className="w-8 h-8 rounded-xl flex items-center justify-center bg-orange-500/10 text-orange-400"><Wrench size={15} /></View><Text className="text-white font-bold text-sm">Services</Text>{totalCount !== undefined && (
            <Text className="text-white/30 text-xs">({totalCount})</Text>
          )}</View>{showViewAll && (
          <Pressable onPress={onViewAll} className="text-xs text-orange-400 transition-colors">
            Voir tous
          </Pressable>
        )}</View>

      <View className="space-y-2">
        {displayServices.map((service) => (
          <ServiceItem
            key={service._id}
            service={service}
            onPress={() => onServiceClick?.(service._id)}
          />
        ))}
      </View>

      {hasMore && !onViewAll && (
        <Text className="text-center text-white/30 text-xs mt-3">
          +{totalCount! - maxDisplay} autres services
        </Text>
      )}
    </View>
  );
}
