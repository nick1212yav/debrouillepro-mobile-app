import { View, Text, Image, Pressable } from "react-native";

// src/features/network/components/Company/CompanyCard.tsx
import {
  Building2,
  MapPin,
  Users,
  Briefcase,
  Star,
  ShieldCheck,
} from "lucide-react-native";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { FollowButton } from "@/features/network/components/common/FollowButton";

export interface Company {
  _id: string;
  name: string;
  logo?: string;
  cover?: string;
  industry: string;
  description?: string;
  city?: string;
  country?: string;
  employeeCount?: number;
  followers: number;
  isFollowing: boolean;
  isVerified: boolean;
  rating?: number;
  reviewCount?: number;
  jobsCount?: number;
  servicesCount?: number;
}

interface CompanyCardProps {
  company: Company;
  onClick?: () => void;
  onFollowToggle?: () => void;
  className?: string;
  variant?: "default" | "compact" | "horizontal";
  isLoading?: boolean;
}

export function CompanyCard({
  company,
  onClick,
  onFollowToggle,
  className,
  variant = "default",
  isLoading = false,
}: CompanyCardProps) {
  if (isLoading) {
    return (
      <View
        className={cn(
          "rounded-3xl overflow-hidden bg-white/5 border border-white/10 p-4",
          variant === "horizontal" ? "flex gap-4" : "",
          className,
        )}
      >
        <Skeleton
          className={cn(
            "w-16 h-16 rounded-2xl flex-shrink-0",
            variant === "horizontal" ? "w-20 h-20" : "",
          )}
        />
        <View className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32 rounded-lg" />
          <Skeleton className="h-3 w-24 rounded-lg" />
          <Skeleton className="h-3 w-20 rounded-lg" />
        </View>
      </View>
    );
  }

  const renderContent = () => {
    if (variant === "compact") {
      return (
        <Pressable
          className={cn(
            "rounded-3xl p-4 bg-white/5 border border-white/10 hover:bg-white/8 transition-colors cursor-pointer",
            className,
          )}
          onPress={onClick}
        >
          <View className="flex items-center gap-3">
            <View className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 flex-shrink-0">
              {company.logo ? (
                <Image
                 
                 
                  className="w-full h-full rounded-2xl object-cover"
                 source={{ uri: company.logo }} accessibilityLabel={company.name}/>
              ) : (
                <Building2 size={24} className="text-white/30" />
              )}
            </View>
            <View className="flex-1 min-w-0">
              <View className="flex items-center gap-1.5">
                <Text className="text-white font-semibold text-sm truncate">
                  {company.name}
                </Text>
                {company.isVerified && (
                  <ShieldCheck
                    size={14}
                    className="text-emerald-400 flex-shrink-0"
                  />
                )}
              </View>
              <Text className="text-white/40 text-xs truncate">
                {company.industry}
              </Text>
              {company.city && (
                <View className="flex items-center gap-1 text-white/30 text-[10px]">
                  <MapPin size={10} />
                  {company.city}
                </View>
              )}
            </View>
            <FollowButton
              userId={company._id as any}
              isFollowing={company.isFollowing}
              size="sm"
              onToggle={onFollowToggle}
            />
          </View>
        </Pressable>
      );
    }

    if (variant === "horizontal") {
      return (
        <Pressable
          className={cn(
            "rounded-3xl overflow-hidden bg-white/5 border border-white/10 hover:bg-white/8 transition-colors cursor-pointer flex",
            className,
          )}
          onPress={onClick}
        >
          <View className="w-32 h-32 flex-shrink-0 bg-white/5 flex items-center justify-center">
            {company.cover ? (
              <Image
               
               
                className="w-full h-full object-cover"
               source={{ uri: company.cover }} accessibilityLabel={company.name}/>
            ) : company.logo ? (
              <Image
               
               
                className="w-16 h-16 rounded-2xl object-cover"
               source={{ uri: company.logo }} accessibilityLabel={company.name}/>
            ) : (
              <Building2 size={32} className="text-white/20" />
            )}
          </View>
          <View className="flex-1 p-4 flex flex-col justify-between">
            <View>
              <View className="flex items-center gap-1.5">
                <Text className="text-white font-bold text-base truncate">
                  {company.name}
                </Text>
                {company.isVerified && (
                  <ShieldCheck
                    size={16}
                    className="text-emerald-400 flex-shrink-0"
                  />
                )}
              </View>
              <Text className="text-white/40 text-sm">{company.industry}</Text>
              {company.description && (
                <Text className="text-white/50 text-xs mt-1">
                  {company.description}
                </Text>
              )}
              <View className="flex items-center gap-3 mt-2 text-xs text-white/40">
                {company.city && (
                  <Text className="flex items-center gap-1">
                    <MapPin size={11} />
                    {company.city}
                  </Text>
                )}
                {company.employeeCount !== undefined && (
                  <Text className="flex items-center gap-1">
                    <Users size={11} />
                    {company.employeeCount} employés
                  </Text>
                )}
                {company.rating !== undefined && (
                  <Text className="flex items-center gap-1 text-amber-400">
                    <Star size={11} className="fill-amber-400" />
                    {company.rating.toFixed(1)}
                  </Text>
                )}
              </View>
            </View>
            <View className="flex items-center justify-between mt-2">
              <View className="flex items-center gap-3 text-xs text-white/40">
                <Text>{company.followers} abonnés</Text>
                {company.jobsCount !== undefined && (
                  <Text className="flex items-center gap-1">
                    <Briefcase size={11} />
                    {company.jobsCount} offres
                  </Text>
                )}
              </View>
              <FollowButton
                userId={company._id as any}
                isFollowing={company.isFollowing}
                size="sm"
                onToggle={onFollowToggle}
              />
            </View>
          </View>
        </Pressable>
      );
    }

    // Default variant
    return (
      <Pressable
        className={cn(
          "rounded-3xl overflow-hidden bg-white/5 border border-white/10 hover:bg-white/8 transition-all cursor-pointer",
          className,
        )}
        onPress={onClick}
      >
        {/* Cover */}
        <View className="relative h-24 bg-gradient-to-r from-indigo-900/50 via-purple-900/30 to-black">
          {company.cover && (
            <Image
             
             
              className="w-full h-full object-cover"
             source={{ uri: company.cover }} accessibilityLabel={company.name}/>
          )}
          <View className="absolute -bottom-8 left-4 w-16 h-16 rounded-2xl bg-white/10 border-2 border-[#020617] flex items-center justify-center overflow-hidden">
            {company.logo ? (
              <Image
               
               
                className="w-full h-full object-cover"
               source={{ uri: company.logo }} accessibilityLabel={company.name}/>
            ) : (
              <Building2 size={28} className="text-white/40" />
            )}
          </View>
          {company.isVerified && (
            <View className="absolute bottom-1 left-16">
              <ShieldCheck size={16} className="text-emerald-400" />
            </View>
          )}
        </View>

        <View className="pt-10 px-4 pb-4">
          <View className="flex items-start justify-between gap-2">
            <View className="min-w-0">
              <Text className="text-white font-bold text-base truncate">
                {company.name}
              </Text>
              <Text className="text-white/40 text-xs">{company.industry}</Text>
            </View>
            <FollowButton
              userId={company._id as any}
              isFollowing={company.isFollowing}
              size="sm"
              onToggle={onFollowToggle}
            />
          </View>

          {company.description && (
            <Text className="text-white/50 text-xs mt-2">
              {company.description}
            </Text>
          )}

          <View className="flex items-center gap-3 mt-3 text-xs text-white/40">
            {company.city && (
              <Text className="flex items-center gap-1">
                <MapPin size={11} />
                {company.city}
              </Text>
            )}
            {company.employeeCount !== undefined && (
              <Text className="flex items-center gap-1">
                <Users size={11} />
                {company.employeeCount}
              </Text>
            )}
            {company.rating !== undefined && (
              <Text className="flex items-center gap-1 text-amber-400">
                <Star size={11} className="fill-amber-400" />
                {company.rating.toFixed(1)}
              </Text>
            )}
          </View>

          <View className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5 text-xs text-white/30">
            <Text>{company.followers} <Text>abonnés</Text></Text>
            {company.jobsCount !== undefined && (
              <Text className="flex items-center gap-1">
                <Briefcase size={11} />
                {company.jobsCount} <Text>offres</Text></Text>
            )}
            {company.servicesCount !== undefined && (
              <Text className="flex items-center gap-1">
                <Briefcase size={11} />
                {company.servicesCount} <Text>services</Text></Text>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  return renderContent();
}
