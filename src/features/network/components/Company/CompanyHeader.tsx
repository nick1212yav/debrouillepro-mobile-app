import { View, Image, Text, Pressable } from "react-native";

// src/features/network/components/Company/CompanyHeader.tsx
import {
  Building2,
  MapPin,
  Users,
  Briefcase,
  Star,
  ShieldCheck,
  Link2,
  CalendarDays,
} from "lucide-react-native";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { FollowButton } from "@/features/network/components/common/FollowButton";
import type { Company } from "./CompanyCard";

interface CompanyHeaderProps {
  company: Company;
  onFollowToggle?: () => void;
  onMessage?: () => void;
  onShare?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function CompanyHeader({
  company,
  onFollowToggle,
  onMessage,
  onShare,
  isLoading = false,
  className,
}: CompanyHeaderProps) {
  if (isLoading) {
    return (
      <View className={cn("space-y-4", className)}><Skeleton className="h-40 rounded-[28px]" /><View className="flex items-start gap-4 -mt-12 px-4"><Skeleton className="w-24 h-24 rounded-2xl border-4 border-[#020617]" /><View className="flex-1 space-y-2 pt-4"><Skeleton className="h-6 w-48 rounded-lg" /><Skeleton className="h-4 w-32 rounded-lg" /><Skeleton className="h-4 w-40 rounded-lg" /></View></View></View>
    );
  }

  return (
    <View initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("relative", className)}>
      {/* Cover */}
      <View className="relative h-40 rounded-[28px] overflow-hidden bg-gradient-to-r from-indigo-900/50 via-purple-900/30 to-black border border-white/10"><View className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.3),transparent_45%)]" /><View className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(139,92,246,0.25),transparent_40%)]" />{company.cover && (
          <Image className="w-full h-full object-cover" source={{ uri: company.cover }} accessibilityLabel={company.name} />
        )}</View>

      {/* Logo & Infos */}
      <View className="px-4 -mt-12"><View className="flex items-start gap-4"><View className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-[#020617] bg-white/5 flex items-center justify-center flex-shrink-0">{company.logo ? (
              <Image className="w-full h-full object-cover" source={{ uri: company.logo }} accessibilityLabel={company.name} />
            ) : (
              <Building2 size={36} className="text-white/30" />
            )}</View><View className="flex-1 min-w-0 pt-4"><View className="flex items-center gap-2 flex-wrap"><Text className="text-white text-2xl font-black truncate">{company.name}</Text>{company.isVerified && (
                <ShieldCheck
                  size={20}
                  className="text-emerald-400 flex-shrink-0"
                />
              )}</View><Text className="text-indigo-300 text-sm font-semibold">{company.industry}</Text><View className="flex items-center gap-3 flex-wrap mt-1 text-xs text-white/40">{company.city && (
                <Text className="flex items-center gap-1"><MapPin size={12} />{company.city}{company.country && `, ${company.country}`}</Text>
              )}{company.employeeCount !== undefined && (
                <Text className="flex items-center gap-1"><Users size={12} />{company.employeeCount}employés
                </Text>
              )}{company.rating !== undefined && (
                <Text className="flex items-center gap-1 text-amber-400"><Star size={12} className="fill-amber-400" />{company.rating.toFixed(1)}{company.reviewCount !== undefined &&
                    ` (${company.reviewCount} avis)`}</Text>
              )}</View></View></View>{}<View className="flex items-center gap-2 mt-4"><FollowButton userId={company._id as any} isFollowing={company.isFollowing} onToggle={onFollowToggle} />{onMessage && (
            <Pressable onPress={onMessage} className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/8 border border-white/10 text-white text-sm font-bold transition-colors"><Text>Message</Text></Pressable>
          )}{onShare && (
            <Pressable onPress={onShare} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/8 border border-white/10 transition-colors"><Link2 size={18} className="text-white/70" /></Pressable>
          )}</View>{}<View className="flex gap-6 mt-4 pt-4 border-t border-white/5"><View><Text className="text-white font-black">{company.followers}</Text><Text className="text-white/35 text-[11px]">Abonnés</Text></View>{company.jobsCount !== undefined && (
            <View>
              <Text className="text-white font-black">{company.jobsCount}</Text>
              <Text className="text-white/35 text-[11px]">Offres d'emploi</Text>
            </View>
          )}{company.servicesCount !== undefined && (
            <View>
              <Text className="text-white font-black">{company.servicesCount}</Text>
              <Text className="text-white/35 text-[11px]">Services</Text>
            </View>
          )}</View></View>

      {/* Description */}
      {company.description && (
        <View className="px-4 mt-4">
          <Text className="text-white/60 text-sm leading-relaxed">
            {company.description}
          </Text>
        </View>
      )}
    </View>
  );
}
