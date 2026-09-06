import { View, Pressable, Text, Image } from "react-native";
import type { ReactNode } from "react";
import {
  Phone,
  MapPin,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Star,
  CheckCircle2,
  Plane,
  Clock,
  Leaf,
  Newspaper,
  Users,
  Sparkles,
  ChevronRight,
  Gift,
  BriefcaseBusiness,
  CalendarDays,
  ShoppingBag,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Navigation,
  ExternalLink,
  Bookmark,
} from "lucide-react-native";

import FavoriteButton from "@/components/FavoriteButton";

/* ============================================================================
 * DESIGN SYSTEM
 * ========================================================================== */

const COLORS = {
  violet: "#8B5CF6",
  indigo: "#6366F1",
  green: "#22C55E",
  emerald: "#10B981",
  blue: "#3B82F6",
  sky: "#0EA5E9",
  orange: "#F97316",
  red: "#EF4444",
  pink: "#EC4899",
  cyan: "#06B6D4",
  yellow: "#F59E0B",
} as const;

const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='600' viewBox='0 0 900 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%238b5cf6'/%3E%3Cstop offset='100%25' stop-color='%230ea5e9'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='900' height='600' fill='%23101018'/%3E%3Ccircle cx='700' cy='100' r='250' fill='url(%23g)' opacity='.18'/%3E%3Ccircle cx='100' cy='550' r='280' fill='%236366f1' opacity='.12'/%3E%3C/svg%3E";

type BaseCardProps = {
  onClick?: () => void;
  delay?: number;
};

type ActionHandler = () => void;

export interface FeedCardStats {
  likes?: number;
  comments?: number;
  shares?: number;
  views?: number;
  saves?: number;
}

export interface FeedAuthor {
  name: string;
  avatar?: string | null;
  verified?: boolean;
  subtitle?: string | null;
  rating?: number | null;
  reviews?: number | null;
}

export interface FeedMedia {
  image?: string | null;
  images?: string[];
  alt?: string;
}

export interface FavoriteItem {
  id: string;
  module: string;
  title: string;
  subtitle?: string;
  image?: string;
  badge?: string;
  badgeColor?: string;
  savedAt?: number;
}

export interface ImmoCardData {
  id: string;
  title: string;
  price: string;
  priceSuffix?: string;
  location?: string;
  status?: string;
  statusColor?: string;
  image?: string | null;
  views?: number;
  features?: string[];
  favorite?: FavoriteItem;
}

export interface TalentCardData {
  id: string;
  name: string;
  profession?: string;
  location?: string;
  availability?: string;
  responseTime?: string;
  reviews?: number;
  rating?: number;
  avatar?: string | null;
  verified?: boolean;
  stats?: FeedCardStats;
  favorite?: FavoriteItem;
}

export interface JobCardData {
  id: string;
  title: string;
  company?: string;
  location?: string;
  employmentType?: string;
  salary?: string;
  experience?: string;
  icon?: string;
  logo?: string | null;
  verified?: boolean;
  favorite?: FavoriteItem;
}

export interface CommunityCardData {
  id: string;
  title: string;
  community?: string;
  description?: string;
  image?: string | null;
  members?: number;
  replies?: number;
  stats?: FeedCardStats;
  avatars?: string[];
  verified?: boolean;
  favorite?: FavoriteItem;
}

export interface EventCardData {
  id: string;
  title: string;
  image?: string | null;
  badge?: string;
  badgeColor?: string;
  dateLabel?: string;
  location?: string;
  price?: string;
  capacityPercent?: number;
  capacityLabel?: string;
  favorite?: FavoriteItem;
}

export interface AgriCardData {
  id: string;
  title: string;
  seller?: string;
  location?: string;
  price?: string;
  unit?: string;
  image?: string | null;
  badge?: string;
  rating?: number;
  sales?: number;
  favorite?: FavoriteItem;
}

export interface WeatherDay {
  label: string;
  icon?: string;
  temperature?: string;
  condition?: string;
}

export interface AgriWeatherData {
  title: string;
  location?: string;
  message?: string;
  badge?: string;
  days?: WeatherDay[];
}

export interface TravelCardData {
  id: string;
  origin: string;
  destination: string;
  price?: string;
  oldPrice?: string;
  departure?: string;
  badge?: string;
  image?: string | null;
  favorite?: FavoriteItem;
}

export interface BusTrip {
  id: string;
  route: string;
  time?: string;
  price?: string;
  seats?: number;
}

export interface MediaCardData {
  id: string;
  title: string;
  description?: string;
  category?: string;
  source?: string;
  publishedAt?: string;
  image?: string | null;
  stats?: FeedCardStats;
  favorite?: FavoriteItem;
}

export interface PodcastCardData {
  id: string;
  title: string;
  description?: string;
  duration?: string;
  author?: string;
}

export interface RecommendationData {
  id: string;
  label: string;
  description?: string;
  emoji?: string;
  icon?: ReactNode;
  color?: string;
}

export interface ReferralCardData {
  title?: string;
  description?: string;
  rewardLabel?: string;
  totalEarnedLabel?: string;
}

export interface MarketplacePromoData {
  title?: string;
  description?: string;
  image?: string | null;
  categories?: string[];
}

/* ============================================================================
 * UTILITIES
 * ========================================================================== */

function formatNumber(value?: number) {
  if (value === undefined || value === null) return null;

  return new Intl.NumberFormat(undefined, {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

function safeImage(image?: string | null) {
  return image || FALLBACK_IMAGE;
}

function GlassCard({
  children,
  delay = 0,
  onClick,
  className = "",
}: BaseCardProps & {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Pressable
      onPress={onClick}
      className={[
        "mx-5 overflow-hidden rounded-[28px]",
        "cursor-pointer relative",
        "transition-shadow duration-300",
        className,
      ].join(" ")}
      style={{ borderWidth: 1, borderColor: "rgba(255,255,255,.09)", borderStyle: "solid" }}
    >
      {children}
    </Pressable>
  );
}

function Image({
  src,
  alt,
  className = "",
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  return (
    <Image
     
     
      loading="lazy"
      className={className}
      onError={(event) => {
        const
        if (target.src !== FALLBACK_IMAGE) {
          target.src = FALLBACK_IMAGE;
        }
      }}
     source={{ uri: safeImage(src) }} accessibilityLabel={alt}/>
  );
}

function Badge({
  children,
  color = COLORS.violet,
  icon,
}: {
  children: ReactNode;
  color?: string;
  icon?: ReactNode;
}) {
  return (
    <Text
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black tracking-wide text-white"
      style={{ backgroundColor: `${color}cc`, borderStyle: "solid" }}
    >
      {icon}
      {children}
    </Text>
  );
}

function IconButton({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick?: ActionHandler;
}) {
  return (
    <Pressable
     
      accessibilityLabel={label}
     
      onPress={(event) => {
        onClick?.();
      }}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
      style={{ backgroundColor: "rgba(255,255,255,.07)", borderWidth: 1, borderColor: "rgba(255,255,255,.08)", borderStyle: "solid" }}
    >
      {children}
    </Pressable>
  );
}

function ActionButton({
  children,
  onClick,
  color = COLORS.violet,
}: {
  children: ReactNode;
  onClick?: ActionHandler;
  color?: string;
}) {
  return (
    <Pressable
      type="button"
      onPress={(event) => {
        onClick?.();
      }}
      className="flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-black"
      style={{ backgroundColor: `${color}16`, borderStyle: "solid" }}
    >
      {children}
    </Pressable>
  );
}

function Rating({
  rating,
  reviews,
}: {
  rating?: number | null;
  reviews?: number | null;
}) {
  if (rating === undefined || rating === null) return null;

  return (
    <View className="flex items-center gap-1">
      <View className="flex items-center gap-0.5">
        {[0, 1, 2, 3, 4].map((index) => (
          <Star
            key={index}
            size={10}
            className={
              index < Math.round(rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-white/15"
            }
          />
        ))}
      </View>

      <Text className="text-[10px] font-bold text-white/55">
        {rating.toFixed(1)}
      </Text>

      {reviews !== undefined && reviews !== null && (
        <Text className="text-[9px] text-white/25">
          · {formatNumber(reviews)}
        </Text>
      )}
    </View>
  );
}

function Favorite({
  item,
  onClick,
}: {
  item?: FavoriteItem;
  onClick?: ActionHandler;
}) {
  if (!item) {
    return (
      <IconButton label="Enregistrer" onPress={onClick}>
        <Bookmark size={15} />
      </IconButton>
    );
  }

  return (
    <FavoriteButton
      className="h-9 w-9"
      item={{
        ...item,
        savedAt: item.savedAt ?? Date.now(),
      }}
    />
  );
}

function Stat({ icon, value }: { icon: ReactNode; value?: number }) {
  if (value === undefined || value === null) return null;

  return (
    <Text className="flex items-center gap-1.5 text-[10px] text-white/35">
      {icon}
      {formatNumber(value)}
    </Text>
  );
}

function Verified({ verified }: { verified?: boolean }) {
  if (!verified) return null;

  return (
    <Text
      className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-black text-blue-300"
      style={{ backgroundColor: "rgba(59,130,246,.12)", borderWidth: 1, borderColor: "rgba(59,130,246,.18)", borderStyle: "solid" }}
    >
      <CheckCircle2 size={8} />
      Vérifié
    </Text>
  );
}

/* ============================================================================
 * IMMOBILIER
 * ========================================================================== */

export function ImmoCard({
  data,
  onClick,
  onCall,
  onLocate,
}: {
  data?: ImmoCardData;
  onClick?: () => void;
  onCall?: ActionHandler;
  onLocate?: ActionHandler;
}) {
  if (!data) return null;

  return (
    <GlassCard delay={0.04} onPress={onClick}>
      <View className="relative h-52 overflow-hidden">
        <Image
          src={data.image}
          alt={data.title}
          className="h-full w-full object-cover"
        />

        <View
          className="absolute inset-0"
          style={{  }}
        />

        {data.status && (
          <View className="absolute left-3 top-3">
            <Badge color={data.statusColor || COLORS.orange}>
              {data.status}
            </Badge>
          </View>
        )}

        <View className="absolute right-3 top-3">
          <Favorite item={data.favorite} />
        </View>

        <View className="absolute bottom-4 left-4 right-4">
          <Text className="text-[26px] font-black tracking-tight text-white">
            {data.price}
            {data.priceSuffix && (
              <Text className="ml-1 text-xs font-medium text-white/55">
                {data.priceSuffix}
              </Text>
            )}
          </Text>

          <View className="mt-1 flex items-center gap-2">
            {data.location && (
              <>
                <MapPin size={11} className="text-white/45" />
                <Text className="truncate text-[11px] text-white/55">
                  {data.location}
                </Text>
              </>
            )}

            {data.views !== undefined && (
              <>
                <Text className="text-white/20">·</Text>
                <Text className="text-[10px] text-white/35">
                  {formatNumber(data.views)} vues
                </Text>
              </>
            )}
          </View>
        </View>
      </View>

      <View className="p-4">
        <Text className="mb-3 text-sm font-black text-white">{data.title}</Text>

        {data.features?.length ? (
          <View className="mb-3 flex flex-wrap gap-1.5">
            {data.features.slice(0, 5).map((feature) => (
              <Text
                key={feature}
                className="rounded-xl px-2 py-1 text-[9px] font-bold text-white/50"
                style={{ backgroundColor: "rgba(255,255,255,.055)", borderWidth: 1, borderColor: "rgba(255,255,255,.06)", borderStyle: "solid" }}
              >
                {feature}
              </Text>
            ))}
          </View>
        ) : null}

        <View className="gap-2">
          <ActionButton color={COLORS.green} onPress={onCall}>
            <Phone size={13} />
            <Text>Appeler</Text></ActionButton>

          <ActionButton color={COLORS.blue} onPress={onLocate}>
            <Navigation size={13} />
            <Text>Localiser</Text></ActionButton>
        </View>
      </View>
    </GlassCard>
  );
}

export function ImmoCard2({
  data,
  onClick,
}: {
  data?: ImmoCardData;
  onClick?: () => void;
}) {
  return <ImmoCard data={data} onPress={onClick} />;
}

/* ============================================================================
 * JOBS / TALENTS
 * ========================================================================== */

export function TalentsCard({
  data,
  onClick,
  onMessage,
  onShare,
}: {
  data?: TalentCardData;
  onClick?: () => void;
  onMessage?: ActionHandler;
  onShare?: ActionHandler;
}) {
  if (!data) return null;

  return (
    <GlassCard delay={0.08} onPress={onClick}>
      <View className="p-4">
        <View className="flex items-center justify-between gap-3">
          <View className="flex min-w-0 items-center gap-3">
            <View className="relative">
              <Image
                src={data.avatar}
                alt={data.name}
                className="h-11 w-11 rounded-2xl object-cover"
              />
              {data.availability && (
                <Text
                  className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2"
                  style={{ backgroundColor: COLORS.green, borderColor: "#14141c" }}
                />
              )}
            </View>

            <View className="min-w-0">
              <View className="flex items-center gap-1.5">
                <Text className="truncate text-xs font-black text-white">
                  {data.name}
                </Text>
                <Verified verified={data.verified} />
              </View>

              {data.profession && (
                <Text className="truncate text-[10px] text-white/40">
                  {data.profession}
                </Text>
              )}

              {data.location && (
                <View className="mt-0.5 flex items-center gap-1 text-[9px] text-white/30">
                  <MapPin size={9} />
                  {data.location}
                </View>
              )}
            </View>
          </View>

          <IconButton label="Plus d'options">
            <MoreHorizontal size={16} />
          </IconButton>
        </View>

        <View className="mt-4 flex gap-3">
          <View className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl">
            <Image
              src={data.avatar}
              alt={data.name}
              className="h-full w-full object-cover"
            />

            {data.availability && (
              <View className="absolute bottom-0 left-0 right-0 bg-black/65 px-1 py-1 text-center text-[8px] font-black text-green-300">
                <Text>DISPONIBLE</Text></View>
            )}
          </View>

          <View className="min-w-0 flex-1">
            {data.availability && (
              <Badge color={COLORS.green}>
                <Zap size={8} />
                {data.availability}
              </Badge>
            )}

            {data.responseTime && (
              <Text className="mt-2 text-[10px] text-white/45">
                Réponse généralement ·{" "}
                <Text className="font-bold text-green-300">
                  {data.responseTime}
                </Text>
              </Text>
            )}

            <View className="mt-2">
              <Rating rating={data.rating} reviews={data.reviews} />
            </View>
          </View>
        </View>

        <View className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
          <View className="flex items-center gap-4">
            <Pressable
             
              onPress={(event) => {
                onMessage?.();
              }}
              className="flex items-center gap-1.5"
            >
              <MessageCircle size={14} className="text-white/35" />
              <Text className="text-[10px] text-white/35">
                {formatNumber(data.stats?.comments)}
              </Text>
            </Pressable>

            <Pressable
             
              onPress={(event) => {
                onShare?.();
              }}
              className="flex items-center gap-1.5"
            >
              <Share2 size={14} className="text-white/35" />
              <Text className="text-[10px] text-white/35">
                {formatNumber(data.stats?.shares)}
              </Text>
            </Pressable>
          </View>

          <Favorite item={data.favorite} />
        </View>
      </View>
    </GlassCard>
  );
}

export function JobsCard2({
  data,
  onClick,
  onApply,
}: {
  data?: JobCardData;
  onClick?: () => void;
  onApply?: ActionHandler;
}) {
  if (!data) return null;

  return (
    <GlassCard delay={0.1} onPress={onClick}>
      <View className="relative p-4">
        <View
          className="absolute -right-12 -top-12 h-32 w-32 rounded-full"
          style={{ backgroundColor: `${COLORS.violet}20` }}
        />

        <View className="relative flex items-start gap-3">
          <View
            className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl"
            style={{ backgroundColor: "rgba(139,92,246,.13)", borderWidth: 1, borderColor: "rgba(139,92,246,.22)", borderStyle: "solid" }}
          >
            {data.logo ? (
              <Image
                src={data.logo}
                alt={data.company || data.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <Text className="text-xl">{data.icon || "💼"}</Text>
            )}
          </View>

          <View className="min-w-0 flex-1">
            <View className="flex items-start justify-between gap-2">
              <View>
                <Text className="text-sm font-black leading-tight text-white">
                  {data.title}
                </Text>

                {data.company && (
                  <Text className="mt-1 text-[10px] text-white/45">
                    {data.company}
                  </Text>
                )}

                {data.location && (
                  <View className="mt-1 flex items-center gap-1 text-[9px] text-white/30">
                    <MapPin size={9} />
                    {data.location}
                  </View>
                )}
              </View>

              <Favorite item={data.favorite} />
            </View>

            <View className="mt-3 flex flex-wrap gap-1.5">
              {data.employmentType && (
                <Badge color={COLORS.violet}>{data.employmentType}</Badge>
              )}

              {data.salary && <Badge color={COLORS.green}>{data.salary}</Badge>}

              {data.experience && (
                <Badge color={COLORS.blue}>{data.experience}</Badge>
              )}
            </View>
          </View>
        </View>

        {onApply && (
          <View className="mt-4">
            <ActionButton color={COLORS.violet} onPress={onApply}>
              <ArrowUpRight size={13} />
              <Text>Postuler maintenant</Text></ActionButton>
          </View>
        )}
      </View>
    </GlassCard>
  );
}

/* ============================================================================
 * COMMUNITY
 * ========================================================================== */

export function CommunityCard({
  data,
  onClick,
  onReply,
  onShare,
}: {
  data?: CommunityCardData;
  onClick?: () => void;
  onReply?: ActionHandler;
  onShare?: ActionHandler;
}) {
  if (!data) return null;

  return (
    <GlassCard delay={0.12} onPress={onClick}>
      <View className="p-4">
        <View className="flex items-center gap-3">
          <View
            className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl"
            style={{ backgroundColor: "rgba(139,92,246,.13)", borderWidth: 1, borderColor: "rgba(139,92,246,.2)", borderStyle: "solid" }}
          >
            {data.image ? (
              <Image
                src={data.image}
                alt={data.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <Users size={16} className="text-purple-300" />
            )}
          </View>

          <View className="min-w-0 flex-1">
            <View className="flex items-center gap-1.5">
              <Text className="truncate text-xs font-black text-white">
                {data.title}
              </Text>
              <Verified verified={data.verified} />
            </View>

            {data.community && (
              <Text className="truncate text-[10px] text-white/35">
                {data.community}
              </Text>
            )}
          </View>

          {data.members !== undefined && (
            <Badge color={COLORS.violet}>
              {formatNumber(data.members)} <Text>membres</Text></Badge>
          )}
        </View>

        {data.description && (
          <Text className="mt-4 text-xs leading-relaxed text-white/55">
            {data.description}
          </Text>
        )}

        {data.avatars?.length ? (
          <View className="mt-4 flex items-center gap-3">
            <View className="flex -space-x-2">
              {data.avatars.slice(0, 5).map((avatar, index) => (
                <Image
                  key={`${avatar}-${index}`}
                  src={avatar}
                  alt=""
                  className="h-7 w-7 rounded-full border-2 border-[#17171f] object-cover"
                />
              ))}
            </View>

            {data.replies !== undefined && (
              <Text className="text-[10px] text-white/35">
                {formatNumber(data.replies)} réponses
              </Text>
            )}
          </View>
        ) : null}

        <View className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
          <View className="flex items-center gap-4">
            <Stat icon={<Heart size={13} />} value={data.stats?.likes} />
            <Stat
              icon={<MessageCircle size={13} />}
              value={data.stats?.comments}
            />
            <Pressable
             
              onPress={(event) => {
                onShare?.();
              }}
              className="flex items-center gap-1.5"
            >
              <Share2 size={13} className="text-white/30" />
              <Text className="text-[10px] text-white/30">
                {formatNumber(data.stats?.shares)}
              </Text>
            </Pressable>
          </View>

          {onReply && (
            <Pressable
              type="button"
              onPress={(event) => {
                onReply();
              }}
              className="rounded-xl px-3 py-1.5 text-[10px] font-black text-purple-300"
              style={{ backgroundColor: "rgba(139,92,246,.13)" }}
            >
              <Text>Répondre</Text></Pressable>
          )}
        </View>
      </View>
    </GlassCard>
  );
}

/* ============================================================================
 * ÉVÉNEMENTS
 * ========================================================================== */

export function EvenementsCard({
  data,
  onClick,
}: {
  data?: EventCardData;
  onClick?: () => void;
}) {
  if (!data) return null;

  const capacity = Math.max(0, Math.min(100, data.capacityPercent || 0));

  return (
    <GlassCard delay={0.1} onPress={onClick}>
      <View className="relative h-52 overflow-hidden">
        <Image
          src={data.image}
          alt={data.title}
          className="h-full w-full object-cover"
        />

        <View
          className="absolute inset-0"
          style={{  }}
        />

        {data.badge && (
          <View className="absolute left-3 top-3">
            <Badge color={data.badgeColor || COLORS.pink}>
              <CalendarDays size={9} />
              {data.badge}
            </Badge>
          </View>
        )}

        <View className="absolute right-3 top-3">
          <Favorite item={data.favorite} />
        </View>

        <View className="absolute bottom-4 left-4 right-4">
          <Text className="text-lg font-black leading-tight text-white">
            {data.title}
          </Text>

          <View className="mt-2 flex flex-wrap items-center gap-2">
            {data.dateLabel && (
              <Text className="flex items-center gap-1 text-[10px] text-white/55">
                <Clock size={10} />
                {data.dateLabel}
              </Text>
            )}

            {data.location && (
              <Text className="flex items-center gap-1 text-[10px] text-white/55">
                <MapPin size={10} />
                {data.location}
              </Text>
            )}
          </View>
        </View>
      </View>

      <View className="p-4">
        <View className="mb-3 flex items-center justify-between">
          {data.price && (
            <Text className="text-sm font-black text-purple-300">
              {data.price}
            </Text>
          )}

          {data.capacityLabel && (
            <Text className="text-[9px] font-bold text-white/40">
              {data.capacityLabel}
            </Text>
          )}
        </View>

        {data.capacityPercent !== undefined && (
          <View>
            <View className="mb-1.5 flex justify-between">
              <Text className="text-[9px] font-bold text-white/30">
                Disponibilité
              </Text>

              <Text
                className="text-[9px] font-black"
                style={{
                  color: capacity >= 85 ? COLORS.red : COLORS.green,
                }}
              >
                {capacity}%
              </Text>
            </View>

            <View className="h-1.5 overflow-hidden rounded-full bg-white/[.06]">
              <View
                className="h-full rounded-full"
                style={{  }}
              />
            </View>
          </View>
        )}
      </View>
    </GlassCard>
  );
}

export function EvenementsCard2({
  data,
  onClick,
}: {
  data?: EventCardData;
  onClick?: () => void;
}) {
  return <EvenementsCard data={data} onPress={onClick} />;
}

/* ============================================================================
 * AGRICULTURE
 * ========================================================================== */

export function AgriCard({
  data,
  onClick,
  onContact,
}: {
  data?: AgriCardData;
  onClick?: () => void;
  onContact?: ActionHandler;
}) {
  if (!data) return null;

  return (
    <GlassCard delay={0.08} onPress={onClick}>
      <View className="p-4">
        <View className="mb-4 flex items-center gap-2">
          <View
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ backgroundColor: "rgba(34,197,94,.13)", borderWidth: 1, borderColor: "rgba(34,197,94,.18)", borderStyle: "solid" }}
          >
            <Leaf size={15} className="text-green-400" />
          </View>

          <View className="min-w-0 flex-1">
            <Text className="text-xs font-black text-white">
              {data.seller || "Agriculture"}
            </Text>

            {data.location && (
              <Text className="text-[10px] text-white/35">{data.location}</Text>
            )}
          </View>

          {data.badge && (
            <Badge color={COLORS.green}>
              <Leaf size={8} />
              {data.badge}
            </Badge>
          )}
        </View>

        <View className="flex gap-3">
          <View className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl">
            <Image
              src={data.image}
              alt={data.title}
              className="h-full w-full object-cover"
            />
          </View>

          <View className="min-w-0 flex-1">
            <Text className="text-sm font-black leading-tight text-white">
              {data.title}
            </Text>

            {data.price && (
              <Text className="mt-2 text-xl font-black text-green-400">
                {data.price}
                {data.unit && (
                  <Text className="ml-1 text-[10px] font-medium text-white/35">
                    {data.unit}
                  </Text>
                )}
              </Text>
            )}

            <View className="mt-2">
              <Rating rating={data.rating} />
            </View>

            {data.sales !== undefined && (
              <Text className="mt-1 text-[9px] text-white/30">
                {formatNumber(data.sales)} ventes
              </Text>
            )}
          </View>
        </View>

        {onContact && (
          <View className="mt-4">
            <ActionButton color={COLORS.green} onPress={onContact}>
              <Phone size={12} />
              <Text>Contacter</Text></ActionButton>
          </View>
        )}
      </View>
    </GlassCard>
  );
}

export function AgriCard2({
  data,
  onClick,
}: {
  data?: AgriWeatherData;
  onClick?: () => void;
}) {
  if (!data) return null;

  return (
    <GlassCard delay={0.12} onPress={onClick}>
      <View className="p-4">
        <View className="flex items-center gap-3">
          <View
            className="flex h-10 w-10 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "rgba(59,130,246,.12)", borderWidth: 1, borderColor: "rgba(59,130,246,.18)", borderStyle: "solid" }}
          >
            <Text className="text-xl">{data.days?.[0]?.icon || "🌦️"}</Text>
          </View>

          <View className="min-w-0 flex-1">
            <Text className="text-xs font-black text-white">{data.title}</Text>
            {data.location && (
              <Text className="text-[10px] text-white/35">{data.location}</Text>
            )}
          </View>

          {data.badge && <Badge color={COLORS.orange}>{data.badge}</Badge>}
        </View>

        {data.message && (
          <Text className="mt-4 text-xs leading-relaxed text-white/55">
            {data.message}
          </Text>
        )}

        {data.days?.length ? (
          <View className="mt-4 gap-1.5">
            {data.days.slice(0, 5).map((day) => (
              <View
                key={day.label}
                className="flex flex-col items-center gap-1 rounded-xl px-1 py-2"
                style={{ backgroundColor: "rgba(255,255,255,.04)", borderWidth: 1, borderColor: "rgba(255,255,255,.05)", borderStyle: "solid" }}
              >
                <Text className="text-[8px] text-white/30">{day.label}</Text>

                <Text className="text-sm">{day.icon || "•"}</Text>

                {day.temperature && (
                  <Text className="text-[9px] font-black text-white/55">
                    {day.temperature}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </GlassCard>
  );
}

/* ============================================================================
 * VOYAGES
 * ========================================================================== */

export function VoyagesCard({
  data,
  onClick,
  onBook,
}: {
  data?: TravelCardData;
  onClick?: () => void;
  onBook?: ActionHandler;
}) {
  if (!data) return null;

  return (
    <GlassCard delay={0.08} onPress={onClick}>
      <View className="relative h-48 overflow-hidden">
        <Image
          src={data.image}
          alt={`${data.origin} → ${data.destination}`}
          className="h-full w-full object-cover"
        />

        <View
          className="absolute inset-0"
          style={{  }}
        />

        {data.badge && (
          <View className="absolute left-3 top-3">
            <Badge color={COLORS.sky}>
              <Plane size={9} />
              {data.badge}
            </Badge>
          </View>
        )}

        <View className="absolute right-3 top-3">
          <Favorite item={data.favorite} />
        </View>

        <View className="absolute bottom-4 left-4 right-4">
          <Text className="text-xs font-medium text-white/55">
            {data.origin}
            <Text className="mx-2 text-sky-300">→</Text>
            {data.destination}
          </Text>

          {data.price && (
            <View className="mt-1 flex items-baseline gap-2">
              <Text className="text-xl font-black text-white">{data.price}</Text>

              {data.oldPrice && (
                <Text className="text-[10px] text-white/35 line-through">
                  {data.oldPrice}
                </Text>
              )}
            </View>
          )}

          {data.departure && (
            <View className="mt-1 flex items-center gap-1.5 text-[10px] text-white/40">
              <Clock size={10} />
              {data.departure}
            </View>
          )}
        </View>
      </View>

      {onBook && (
        <View className="p-4">
          <ActionButton color={COLORS.sky} onPress={onBook}>
            <Plane size={12} />
            <Text>Réserver</Text></ActionButton>
        </View>
      )}
    </GlassCard>
  );
}

export function VoyagesCard2({
  trips,
  onClick,
  onTripClick,
}: {
  trips?: BusTrip[];
  onClick?: () => void;
  onTripClick?: (trip: BusTrip) => void;
}) {
  if (!trips?.length) return null;

  return (
    <GlassCard delay={0.1} onPress={onClick}>
      <View className="p-4">
        <View className="mb-4 flex items-center gap-3">
          <View
            className="flex h-10 w-10 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "rgba(14,165,233,.12)", borderWidth: 1, borderColor: "rgba(14,165,233,.18)", borderStyle: "solid" }}
          >
            <Text className="text-xl">🚌</Text>
          </View>

          <View>
            <Text className="text-xs font-black text-white">Départs disponibles</Text>
            <Text className="text-[10px] text-white/35">Transport inter-villes</Text>
          </View>
        </View>

        <View className="divide-y divide-white/5">
          {trips.map((trip) => (
            <Pressable
             
              key={trip.id}
              onPress={(event) => {
                onTripClick?.(trip);
              }}
              className="flex w-full items-center gap-3 py-3 text-left"
            >
              <View className="min-w-0 flex-1">
                <Text className="truncate text-xs font-bold text-white">
                  {trip.route}
                </Text>

                <Text className="mt-0.5 text-[10px] text-white/35">
                  {trip.time}
                  {trip.seats !== undefined && <> · {trip.seats} places</>}
                </Text>
              </View>

              {trip.price && (
                <Text className="shrink-0 text-xs font-black text-sky-400">
                  {trip.price}
                </Text>
              )}

              <ChevronRight size={13} className="text-white/20" />
            </Pressable>
          ))}
        </View>
      </View>
    </GlassCard>
  );
}

/* ============================================================================
 * MEDIA / ACTUALITÉS
 * ========================================================================== */

export function MediaCard({
  data,
  onClick,
  onLike,
  onShare,
}: {
  data?: MediaCardData;
  onClick?: () => void;
  onLike?: ActionHandler;
  onShare?: ActionHandler;
}) {
  if (!data) return null;

  return (
    <GlassCard delay={0.08} onPress={onClick}>
      {data.image && (
        <View className="relative h-44 overflow-hidden">
          <Image
            src={data.image}
            alt={data.title}
            className="h-full w-full object-cover"
          />

          <View
            className="absolute inset-0"
            style={{  }}
          />

          {data.category && (
            <View className="absolute left-3 top-3">
              <Badge color={COLORS.cyan}>
                <Newspaper size={9} />
                {data.category}
              </Badge>
            </View>
          )}

          <View className="absolute bottom-4 left-4 right-4">
            <Text className="text-base font-black leading-tight text-white">
              {data.title}
            </Text>
          </View>
        </View>
      )}

      <View className="p-4">
        {!data.image && data.category && (
          <Badge color={COLORS.cyan}>{data.category}</Badge>
        )}

        {!data.image && (
          <Text className="mt-2 text-base font-black text-white">{data.title}</Text>
        )}

        {data.description && (
          <Text className="mt-2 text-xs leading-relaxed text-white/45">
            {data.description}
          </Text>
        )}

        <View className="mt-4 flex items-center justify-between">
          <View className="flex min-w-0 items-center gap-2">
            <Newspaper size={11} className="shrink-0 text-white/25" />

            <View className="min-w-0">
              {data.source && (
                <Text className="truncate text-[10px] font-bold text-white/40">
                  {data.source}
                </Text>
              )}

              {data.publishedAt && (
                <Text className="text-[9px] text-white/25">{data.publishedAt}</Text>
              )}
            </View>
          </View>

          <View className="flex items-center gap-3">
            <Pressable
             
              onPress={(event) => {
                onLike?.();
              }}
              className="flex items-center gap-1"
            >
              <Heart size={13} className="text-white/30" />
              <Text className="text-[10px] text-white/30">
                {formatNumber(data.stats?.likes)}
              </Text>
            </Pressable>

            <Pressable
             
              onPress={(event) => {
                onShare?.();
              }}
              className="flex items-center gap-1"
            >
              <Share2 size={13} className="text-white/30" />
              <Text className="text-[10px] text-white/30">
                {formatNumber(data.stats?.shares)}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </GlassCard>
  );
}

export function MediaCard2({
  data,
  onClick,
  onPlay,
  onFollow,
}: {
  data?: PodcastCardData;
  onClick?: () => void;
  onPlay?: ActionHandler;
  onFollow?: ActionHandler;
}) {
  if (!data) return null;

  return (
    <GlassCard delay={0.1} onPress={onClick}>
      <View className="p-4">
        <View className="mb-4 flex items-center justify-between">
          <Badge color={COLORS.pink}><Text>🎙️ Podcast</Text></Badge>

          {data.duration && (
            <Text className="text-[9px] text-white/30">{data.duration}</Text>
          )}
        </View>

        <Text className="text-sm font-black leading-tight text-white">
          {data.title}
        </Text>

        {data.description && (
          <Text className="mt-2 text-xs leading-relaxed text-white/45">
            {data.description}
          </Text>
        )}

        {data.author && (
          <Text className="mt-2 text-[10px] text-white/30">{data.author}</Text>
        )}

        <View className="mt-4 flex gap-2">
          {onPlay && (
            <Pressable
              type="button"
              onPress={(event) => {
                onPlay();
              }}
              className="flex-1 rounded-xl py-2.5 text-xs font-black text-white"
              style={{  }}
            >
              <Text>▶ Écouter</Text></Pressable>
          )}

          {onFollow && (
            <Pressable
             
              onPress={(event) => {
                onFollow();
              }}
              className="rounded-xl px-4 py-2.5 text-xs font-bold text-white/55"
              style={{ backgroundColor: "rgba(255,255,255,.06)" }}
            >
              <Text>Suivre</Text></Pressable>
          )}
        </View>
      </View>
    </GlassCard>
  );
}

/* ============================================================================
 * COMMUNITY — SECONDARY
 * ========================================================================== */

export function CommunityCard2({
  data,
  onClick,
  onReply,
}: {
  data?: CommunityCardData;
  onClick?: () => void;
  onReply?: ActionHandler;
}) {
  return <CommunityCard data={data} onPress={onClick} onReply={onReply} />;
}

/* ============================================================================
 * IA — "POUR VOUS"
 * ========================================================================== */

export function AIRecommendCard({
  label,
  desc,
  emoji,
  icon,
  color = COLORS.violet,
  onClick,
}: {
  label: string;
  desc?: string;
  emoji?: string;
  icon?: ReactNode;
  color?: string;
  onClick?: () => void;
}) {
  return (
    <Pressable
      type="button"
      onPress={onClick}
      className="relative flex w-full items-center gap-3 overflow-hidden rounded-2xl p-3 text-left"
      style={{ borderStyle: "solid" }}
    >
      <View
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
        style={{ backgroundColor: `${color}15`, borderStyle: "solid" }}
      >
        {icon || emoji || <Sparkles size={16} style={{ color }} />}
      </View>

      <View className="min-w-0 flex-1">
        <Text className="truncate text-sm font-black text-white">{label}</Text>

        {desc && (
          <Text className="mt-0.5 truncate text-[10px] text-white/40">{desc}</Text>
        )}
      </View>

      <ChevronRight size={15} className="shrink-0 text-white/20" />
    </Pressable>
  );
}

export function PourVousSection({
  recommendations,
  onNavigate,
}: {
  recommendations?: RecommendationData[];
  onNavigate?: (page: string) => void;
}) {
  if (!recommendations?.length) return null;

  return (
    <View className="mx-5">
      <View className="mb-3 flex items-center gap-2">
        <View
          className="flex h-6 w-6 items-center justify-center rounded-lg"
          style={{  }}
        >
          <Sparkles size={11} className="text-white" />
        </View>

        <Text className="text-sm font-black text-white">Pour vous</Text>

        <Text
          className="rounded-full px-1.5 py-0.5 text-[8px] font-black text-purple-300"
          style={{ backgroundColor: "rgba(139,92,246,.15)" }}
        >
          IA
        </Text>
      </View>

      <View className="flex flex-col gap-2">
        {recommendations.map((recommendation) => (
          <AIRecommendCard
            key={recommendation.id}
            label={recommendation.label}
            desc={recommendation.description}
            emoji={recommendation.emoji}
            icon={recommendation.icon}
            color={recommendation.color}
            onPress={
              onNavigate ? () => onNavigate(recommendation.id) : undefined
            }
          />
        ))}
      </View>
    </View>
  );
}

/* ============================================================================
 * PARRAINAGE
 * ========================================================================== */

export function ParrainagePromoCard({
  data,
  onClick,
  onShare,
}: {
  data?: ReferralCardData;
  onClick?: () => void;
  onShare?: ActionHandler;
}) {
  if (!data) return null;

  return (
    <GlassCard delay={0.14} onPress={onClick}>
      <View className="relative overflow-hidden p-4">
        <View
          className="absolute -right-12 -top-12 h-40 w-40 rounded-full"
          style={{ backgroundColor: "rgba(139,92,246,.22)" }}
        />

        <View className="relative flex items-center gap-3">
          <View
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "rgba(139,92,246,.15)", borderWidth: 1, borderColor: "rgba(139,92,246,.22)", borderStyle: "solid" }}
          >
            <Gift size={16} className="text-purple-300" />
          </View>

          <View className="min-w-0">
            <Text className="text-xs font-black text-white">
              {data.title || "Programme Parrainage"}
            </Text>

            {data.description && (
              <Text className="mt-0.5 text-[10px] text-white/40">
                {data.description}
              </Text>
            )}
          </View>
        </View>

        {data.rewardLabel && (
          <View className="relative mt-4">
            <Text className="text-sm font-bold text-white/70">
              {data.rewardLabel}
            </Text>
          </View>
        )}

        <View className="relative mt-4 flex gap-2">
          {onShare && (
            <ActionButton color={COLORS.violet} onPress={onShare}>
              <Share2 size={12} />
              <Text>Partager</Text></ActionButton>
          )}

          {data.totalEarnedLabel && (
            <View
              className="flex shrink-0 items-center rounded-2xl px-4 text-[10px] font-black text-white"
              style={{  }}
            >
              {data.totalEarnedLabel}
            </View>
          )}
        </View>
      </View>
    </GlassCard>
  );
}

/* ============================================================================
 * MARKETPLACE
 * ========================================================================== */

export function MarketplacePromoCard({
  data,
  onClick,
}: {
  data?: MarketplacePromoData;
  onClick?: () => void;
}) {
  if (!data) return null;

  return (
    <GlassCard delay={0.18} onPress={onClick}>
      <View className="relative h-44 overflow-hidden">
        <Image
          src={data.image}
          alt={data.title || "Marketplace"}
          className="h-full w-full object-cover"
        />

        <View
          className="absolute inset-0"
          style={{  }}
        />

        <View className="absolute inset-0 flex flex-col justify-between p-4">
          <View className="flex items-center gap-3">
            <View
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-lg"
              style={{ backgroundColor: "rgba(255,255,255,.16)" }}
            >
              <ShoppingBag size={18} className="text-white" />
            </View>

            <View className="min-w-0">
              <Text className="text-base font-black leading-tight text-white">
                {data.title}
              </Text>

              {data.description && (
                <Text className="mt-0.5 text-xs text-white/75">
                  {data.description}
                </Text>
              )}
            </View>
          </View>

          <View className="flex items-end justify-between gap-3">
            <View className="flex min-w-0 flex-wrap gap-1.5">
              {data.categories?.slice(0, 4).map((category) => (
                <Text
                  key={category}
                  className="rounded-full px-2.5 py-1 text-[9px] font-black text-white"
                  style={{ backgroundColor: "rgba(255,255,255,.17)" }}
                >
                  {category}
                </Text>
              ))}
            </View>

            <View
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: "rgba(255,255,255,.18)" }}
            >
              <ArrowUpRight size={17} className="text-white" />
            </View>
          </View>
        </View>
      </View>
    </GlassCard>
  );
}

/* ============================================================================
 * UNIVERSAL EMPTY STATE
 * ========================================================================== */

export function FeedCardEmpty({
  icon,
  title = "Rien à afficher",
  description,
  actionLabel,
  onAction,
}: {
  icon?: ReactNode;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: ActionHandler;
}) {
  return (
    <View
      className="mx-5 rounded-[28px] p-8 text-center"
      style={{ borderWidth: 1, borderColor: "rgba(255,255,255,.07)", borderStyle: "solid" }}
    >
      <View
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ backgroundColor: "rgba(139,92,246,.12)", borderWidth: 1, borderColor: "rgba(139,92,246,.18)", borderStyle: "solid" }}
      >
        {icon || <Sparkles size={20} className="text-purple-300" />}
      </View>

      <Text className="mt-4 text-sm font-black text-white">{title}</Text>

      {description && (
        <Text className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-white/35">
          {description}
        </Text>
      )}

      {actionLabel && onAction && (
        <Pressable
          type="button"
          onPress={onAction}
          className="mt-5 rounded-2xl px-5 py-2.5 text-xs font-black text-white"
          style={{  }}
        >
          {actionLabel}
        </Pressable>
      )}
    </View>
  );
}

/* ============================================================================
 * EXPORTS UTILITAIRES
 * ========================================================================== */

export { Badge, Rating, Verified, Stat, IconButton, ActionButton, GlassCard };
