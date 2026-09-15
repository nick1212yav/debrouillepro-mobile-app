// src/pages/home/_components/FeedCards.tsx
import {
  View,
  Pressable,
  Text,
  Image as RNImage,
  Animated,
  Easing,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRef, useEffect, type ReactNode } from "react";
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
  Navigation,
  Bookmark,
} from "lucide-react-native";
import FavoriteButton from "@/components/FavoriteButton.tsx";

/* ============================================================================
 * COLORS
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
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='900' height='600'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%25' stop-color='%238b5cf6'/><stop offset='100%25' stop-color='%230ea5e9'/></linearGradient></defs><rect width='900' height='600' fill='%23101018'/><circle cx='700' cy='100' r='250' fill='url(%23g)' opacity='.18'/><circle cx='100' cy='550' r='280' fill='%236366f1' opacity='.12'/></svg>";

/* ============================================================================
 * TYPES
 * ========================================================================== */

type BaseCardProps = { onClick?: () => void; delay?: number };
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
 * HELPERS
 * ========================================================================== */

function formatNumber(value?: number): string | null {
  if (value === undefined || value === null) return null;
  try {
    return new Intl.NumberFormat(undefined, {
      notation: value >= 1000 ? "compact" : "standard",
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return String(value);
  }
}

function safeImage(image?: string | null): string {
  return image || FALLBACK_IMAGE;
}

/* ============================================================================
 * FADE UP WRAPPER
 * ========================================================================== */

function FadeUp({
  delay = 0,
  distance = 18,
  children,
  style,
}: {
  delay?: number;
  distance?: number;
  children: ReactNode;
  style?: any;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 440,
      delay: delay * 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [distance, 0],
              }),
            },
            {
              scale: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.985, 1],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/* ============================================================================
 * CARD IMAGE
 * ========================================================================== */

function CardImage({
  src,
  alt,
  style,
}: {
  src?: string | null;
  alt: string;
  style?: any;
}) {
  return (
    <RNImage
      source={{ uri: safeImage(src) }}
      style={style}
      accessibilityLabel={alt}
    />
  );
}

/* ============================================================================
 * GLASS CARD
 * ========================================================================== */

function GlassCard({
  children,
  delay = 0,
  onClick,
  style,
}: BaseCardProps & { children: ReactNode; style?: any }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.992,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };

  return (
    <FadeUp delay={delay}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={onClick}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          disabled={!onClick}
          style={[styles.glassCard, style]}
        >
          {children}
        </Pressable>
      </Animated.View>
    </FadeUp>
  );
}

/* ============================================================================
 * BADGE
 * ========================================================================== */

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
    <View
      style={[
        styles.badge,
        {
          backgroundColor: `${color}CC`,
          shadowColor: color,
        },
      ]}
    >
      {icon}
      <Text style={styles.badgeText}>{children}</Text>
    </View>
  );
}

/* ============================================================================
 * ICON BUTTON
 * ========================================================================== */

function IconButton({
  children,
  label,
  onPress,
}: {
  children: ReactNode;
  label: string;
  onPress?: ActionHandler;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityLabel={label}
        hitSlop={6}
        style={styles.iconButton}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================================
 * ACTION BUTTON
 * ========================================================================== */

function ActionButton({
  children,
  onPress,
  color = COLORS.violet,
}: {
  children: ReactNode;
  onPress?: ActionHandler;
  color?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }], width: "100%" }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[
          styles.actionButton,
          {
            backgroundColor: `${color}1F`,
            borderColor: `${color}55`,
          },
        ]}
      >
        <View style={styles.actionButtonInner}>{children}</View>
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================================
 * RATING
 * ========================================================================== */

function Rating({
  rating,
  reviews,
}: {
  rating?: number | null;
  reviews?: number | null;
}) {
  if (rating === undefined || rating === null) return null;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
        {[0, 1, 2, 3, 4].map((index) => {
          const filled = index < Math.round(rating);
          return (
            <Star
              key={index}
              size={10}
              color={filled ? "#FBBF24" : "rgba(255,255,255,0.18)"}
              fill={filled ? "#FBBF24" : "none"}
            />
          );
        })}
      </View>
      <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
      {reviews !== undefined && reviews !== null ? (
        <Text style={styles.ratingReviews}>· {formatNumber(reviews)}</Text>
      ) : null}
    </View>
  );
}

/* ============================================================================
 * FAVORITE
 * ========================================================================== */

function Favorite({
  item,
  onPress,
}: {
  item?: FavoriteItem;
  onPress?: ActionHandler;
}) {
  if (!item) {
    return (
      <IconButton label="Enregistrer" onPress={onPress}>
        <Bookmark size={15} color="rgba(255,255,255,0.7)" />
      </IconButton>
    );
  }

  return (
    <FavoriteButton
      className="h-9 w-9"
      item={{ ...item, savedAt: item.savedAt ?? Date.now() }}
    />
  );
}

/* ============================================================================
 * STAT
 * ========================================================================== */

function Stat({ icon, value }: { icon: ReactNode; value?: number }) {
  if (value === undefined || value === null) return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      {icon}
      <Text style={styles.statText}>{formatNumber(value)}</Text>
    </View>
  );
}

/* ============================================================================
 * VERIFIED
 * ========================================================================== */

function Verified({ verified }: { verified?: boolean }) {
  if (!verified) return null;
  return (
    <View style={styles.verified}>
      <CheckCircle2 size={8} color="#93C5FD" />
      <Text style={styles.verifiedText}>Vérifié</Text>
    </View>
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
    <GlassCard delay={0.04} onClick={onClick}>
      <View style={styles.heroImage}>
        <CardImage
          src={data.image}
          alt={data.title}
          style={styles.heroImageInner}
        />
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.72)"]}
          locations={[0.4, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {data.status ? (
          <View style={styles.heroBadgeLeft}>
            <Badge color={data.statusColor || COLORS.orange}>
              {data.status}
            </Badge>
          </View>
        ) : null}
        <View style={styles.heroFavorite}>
          <Favorite item={data.favorite} />
        </View>

        <View style={styles.heroBottom}>
          <Text style={styles.heroPrice}>
            {data.price}
            {data.priceSuffix ? (
              <Text style={styles.heroPriceSuffix}> {data.priceSuffix}</Text>
            ) : null}
          </Text>
          <View style={styles.heroMetaRow}>
            {data.location ? (
              <>
                <MapPin size={11} color="rgba(255,255,255,0.55)" />
                <Text style={styles.heroMeta} numberOfLines={1}>
                  {data.location}
                </Text>
              </>
            ) : null}
            {data.views !== undefined ? (
              <>
                <Text style={styles.heroMetaDot}>·</Text>
                <Text style={styles.heroMetaDim}>
                  {formatNumber(data.views)} vues
                </Text>
              </>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.cardTitle}>{data.title}</Text>

        {data.features?.length ? (
          <View style={styles.featuresRow}>
            {data.features.slice(0, 5).map((feature) => (
              <View key={feature} style={styles.featureChip}>
                <Text style={styles.featureChipText}>{feature}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={{ gap: 8 }}>
          <ActionButton color={COLORS.green} onPress={onCall}>
            <Phone size={13} color={COLORS.green} />
            <Text style={[styles.actionButtonText, { color: COLORS.green }]}>
              Appeler
            </Text>
          </ActionButton>
          <ActionButton color={COLORS.blue} onPress={onLocate}>
            <Navigation size={13} color={COLORS.blue} />
            <Text style={[styles.actionButtonText, { color: COLORS.blue }]}>
              Localiser
            </Text>
          </ActionButton>
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
  return <ImmoCard data={data} onClick={onClick} />;
}

/* ============================================================================
 * TALENTS
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
    <GlassCard delay={0.08} onClick={onClick}>
      <View style={styles.body}>
        <View style={styles.rowBetween}>
          <View style={styles.rowGap}>
            <View style={styles.avatarWrap}>
              <CardImage
                src={data.avatar}
                alt={data.name}
                style={styles.avatarImg}
              />
              {data.availability ? <View style={styles.onlineDot} /> : null}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={styles.rowGapSm}>
                <Text style={styles.cardTitleSm} numberOfLines={1}>
                  {data.name}
                </Text>
                <Verified verified={data.verified} />
              </View>
              {data.profession ? (
                <Text style={styles.muted10} numberOfLines={1}>
                  {data.profession}
                </Text>
              ) : null}
              {data.location ? (
                <View style={styles.locationRow}>
                  <MapPin size={9} color="rgba(255,255,255,0.4)" />
                  <Text style={styles.locationText}>{data.location}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <IconButton label="Plus d'options">
            <MoreHorizontal size={16} color="rgba(255,255,255,0.7)" />
          </IconButton>
        </View>

        <View style={styles.talentMiddle}>
          <View style={styles.talentPhotoWrap}>
            <CardImage
              src={data.avatar}
              alt={data.name}
              style={styles.talentPhoto}
            />
            {data.availability ? (
              <View style={styles.talentAvailOverlay}>
                <Text style={styles.talentAvailText}>DISPONIBLE</Text>
              </View>
            ) : null}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            {data.availability ? (
              <Badge color={COLORS.green} icon={<Zap size={8} color="#fff" />}>
                {data.availability}
              </Badge>
            ) : null}
            {data.responseTime ? (
              <Text style={styles.talentResponseTime}>
                Réponse généralement ·{" "}
                <Text style={{ color: "#6EE7B7", fontWeight: "800" }}>
                  {data.responseTime}
                </Text>
              </Text>
            ) : null}
            <View style={{ marginTop: 8 }}>
              <Rating rating={data.rating} reviews={data.reviews} />
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <Pressable
              onPress={onMessage}
              hitSlop={6}
              style={styles.footerAction}
            >
              <MessageCircle size={14} color="rgba(255,255,255,0.5)" />
              <Text style={styles.footerActionText}>
                {formatNumber(data.stats?.comments)}
              </Text>
            </Pressable>
            <Pressable
              onPress={onShare}
              hitSlop={6}
              style={styles.footerAction}
            >
              <Share2 size={14} color="rgba(255,255,255,0.5)" />
              <Text style={styles.footerActionText}>
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

/* ============================================================================
 * JOBS
 * ========================================================================== */

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
    <GlassCard delay={0.1} onClick={onClick}>
      <View style={styles.body}>
        <View style={styles.jobOrb} pointerEvents="none" />
        <View style={styles.rowGap}>
          <LinearGradient
            colors={[`${COLORS.violet}22`, `${COLORS.violet}0A`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.jobLogoWrap}
          >
            {data.logo ? (
              <CardImage
                src={data.logo}
                alt={data.company || data.title}
                style={styles.jobLogoImg}
              />
            ) : (
              <Text style={{ fontSize: 22 }}>{data.icon || "💼"}</Text>
            )}
          </LinearGradient>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.rowBetweenStart}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.cardTitleSm}>{data.title}</Text>
                {data.company ? (
                  <Text style={styles.muted10}>{data.company}</Text>
                ) : null}
                {data.location ? (
                  <View style={styles.locationRow}>
                    <MapPin size={9} color="rgba(255,255,255,0.4)" />
                    <Text style={styles.locationText}>{data.location}</Text>
                  </View>
                ) : null}
              </View>
              <Favorite item={data.favorite} />
            </View>
            <View style={styles.badgesRow}>
              {data.employmentType ? (
                <Badge color={COLORS.violet}>{data.employmentType}</Badge>
              ) : null}
              {data.salary ? (
                <Badge color={COLORS.green}>{data.salary}</Badge>
              ) : null}
              {data.experience ? (
                <Badge color={COLORS.blue}>{data.experience}</Badge>
              ) : null}
            </View>
          </View>
        </View>

        {onApply ? (
          <View style={{ marginTop: 16 }}>
            <ActionButton color={COLORS.violet} onPress={onApply}>
              <ArrowUpRight size={13} color={COLORS.violet} />
              <Text style={[styles.actionButtonText, { color: COLORS.violet }]}>
                Postuler maintenant
              </Text>
            </ActionButton>
          </View>
        ) : null}
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
    <GlassCard delay={0.12} onClick={onClick}>
      <View style={styles.body}>
        <View style={styles.rowGap}>
          <LinearGradient
            colors={[`${COLORS.violet}22`, `${COLORS.violet}0A`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.communityIconWrap}
          >
            {data.image ? (
              <CardImage
                src={data.image}
                alt={data.title}
                style={styles.communityIconImg}
              />
            ) : (
              <Users size={16} color="#C4B5FD" />
            )}
          </LinearGradient>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.rowGapSm}>
              <Text style={styles.cardTitleSm} numberOfLines={1}>
                {data.title}
              </Text>
              <Verified verified={data.verified} />
            </View>
            {data.community ? (
              <Text style={styles.muted10} numberOfLines={1}>
                {data.community}
              </Text>
            ) : null}
          </View>
          {data.members !== undefined ? (
            <Badge color={COLORS.violet}>
              {formatNumber(data.members)} membres
            </Badge>
          ) : null}
        </View>

        {data.description ? (
          <Text style={styles.communityDesc}>{data.description}</Text>
        ) : null}

        {data.avatars?.length ? (
          <View style={styles.avatarsRow}>
            <View style={styles.avatarsStack}>
              {data.avatars.slice(0, 5).map((avatar, index) => (
                <CardImage
                  key={`${avatar}-${index}`}
                  src={avatar}
                  alt=""
                  style={[styles.avatarMini, index > 0 && { marginLeft: -8 }]}
                />
              ))}
            </View>
            {data.replies !== undefined ? (
              <Text style={styles.muted10}>
                {formatNumber(data.replies)} réponses
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <Stat
              icon={<Heart size={13} color="rgba(255,255,255,0.4)" />}
              value={data.stats?.likes}
            />
            <Stat
              icon={<MessageCircle size={13} color="rgba(255,255,255,0.4)" />}
              value={data.stats?.comments}
            />
            <Pressable
              onPress={onShare}
              hitSlop={6}
              style={styles.footerAction}
            >
              <Share2 size={13} color="rgba(255,255,255,0.45)" />
              <Text style={styles.footerActionText}>
                {formatNumber(data.stats?.shares)}
              </Text>
            </Pressable>
          </View>
          {onReply ? (
            <Pressable
              onPress={onReply}
              hitSlop={6}
              style={({ pressed }) => [
                styles.replyBtn,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.replyBtnText}>Répondre</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </GlassCard>
  );
}

export function CommunityCard2({
  data,
  onClick,
  onReply,
}: {
  data?: CommunityCardData;
  onClick?: () => void;
  onReply?: ActionHandler;
}) {
  return <CommunityCard data={data} onClick={onClick} onReply={onReply} />;
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
    <GlassCard delay={0.1} onClick={onClick}>
      <View style={styles.heroImage}>
        <CardImage
          src={data.image}
          alt={data.title}
          style={styles.heroImageInner}
        />
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.72)"]}
          locations={[0.4, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {data.badge ? (
          <View style={styles.heroBadgeLeft}>
            <Badge
              color={data.badgeColor || COLORS.pink}
              icon={<CalendarDays size={9} color="#fff" />}
            >
              {data.badge}
            </Badge>
          </View>
        ) : null}
        <View style={styles.heroFavorite}>
          <Favorite item={data.favorite} />
        </View>
        <View style={styles.heroBottom}>
          <Text style={styles.heroTitle}>{data.title}</Text>
          <View style={styles.heroInfoRow}>
            {data.dateLabel ? (
              <View style={styles.heroInfoItem}>
                <Clock size={10} color="rgba(255,255,255,0.6)" />
                <Text style={styles.heroInfoText}>{data.dateLabel}</Text>
              </View>
            ) : null}
            {data.location ? (
              <View style={styles.heroInfoItem}>
                <MapPin size={10} color="rgba(255,255,255,0.6)" />
                <Text style={styles.heroInfoText}>{data.location}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.rowBetween}>
          {data.price ? (
            <Text style={styles.eventPrice}>{data.price}</Text>
          ) : (
            <View />
          )}
          {data.capacityLabel ? (
            <Text style={styles.eventCapacityLabel}>{data.capacityLabel}</Text>
          ) : null}
        </View>

        {data.capacityPercent !== undefined ? (
          <EventCapacityBar capacity={capacity} />
        ) : null}
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
  return <EvenementsCard data={data} onClick={onClick} />;
}

function EventCapacityBar({ capacity }: { capacity: number }) {
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: capacity,
      duration: 900,
      delay: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [capacity, barAnim]);

  const width = barAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  const barColor = capacity >= 85 ? COLORS.red : COLORS.green;

  return (
    <View>
      <View style={styles.capacityLabels}>
        <Text style={styles.capacityLabelText}>Disponibilité</Text>
        <Text style={[styles.capacityValueText, { color: barColor }]}>
          {capacity}%
        </Text>
      </View>
      <View style={styles.capacityTrack}>
        <Animated.View
          style={[
            styles.capacityFill,
            {
              width,
              backgroundColor: barColor,
              shadowColor: barColor,
            },
          ]}
        />
      </View>
    </View>
  );
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
    <GlassCard delay={0.08} onClick={onClick}>
      <View style={styles.body}>
        <View style={styles.rowGap}>
          <LinearGradient
            colors={[`${COLORS.green}22`, `${COLORS.green}0A`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.agriIconWrap}
          >
            <Leaf size={15} color={COLORS.green} />
          </LinearGradient>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.cardTitleSm}>
              {data.seller || "Agriculture"}
            </Text>
            {data.location ? (
              <Text style={styles.muted10}>{data.location}</Text>
            ) : null}
          </View>
          {data.badge ? (
            <Badge color={COLORS.green} icon={<Leaf size={8} color="#fff" />}>
              {data.badge}
            </Badge>
          ) : null}
        </View>

        <View style={styles.agriMiddle}>
          <View style={styles.agriImageWrap}>
            <CardImage
              src={data.image}
              alt={data.title}
              style={styles.agriImage}
            />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.cardTitleSm}>{data.title}</Text>
            {data.price ? (
              <Text style={styles.agriPrice}>
                {data.price}
                {data.unit ? (
                  <Text style={styles.agriUnit}> {data.unit}</Text>
                ) : null}
              </Text>
            ) : null}
            <View style={{ marginTop: 8 }}>
              <Rating rating={data.rating} />
            </View>
            {data.sales !== undefined ? (
              <Text style={styles.muted10}>
                {formatNumber(data.sales)} ventes
              </Text>
            ) : null}
          </View>
        </View>

        {onContact ? (
          <View style={{ marginTop: 16 }}>
            <ActionButton color={COLORS.green} onPress={onContact}>
              <Phone size={12} color={COLORS.green} />
              <Text style={[styles.actionButtonText, { color: COLORS.green }]}>
                Contacter
              </Text>
            </ActionButton>
          </View>
        ) : null}
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
    <GlassCard delay={0.12} onClick={onClick}>
      <View style={styles.body}>
        <View style={styles.rowGap}>
          <LinearGradient
            colors={[`${COLORS.blue}22`, `${COLORS.blue}0A`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.agriIconWrap}
          >
            <Text style={{ fontSize: 20 }}>{data.days?.[0]?.icon || "🌦️"}</Text>
          </LinearGradient>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.cardTitleSm}>{data.title}</Text>
            {data.location ? (
              <Text style={styles.muted10}>{data.location}</Text>
            ) : null}
          </View>
          {data.badge ? (
            <Badge color={COLORS.orange}>{data.badge}</Badge>
          ) : null}
        </View>

        {data.message ? (
          <Text style={styles.communityDesc}>{data.message}</Text>
        ) : null}

        {data.days?.length ? (
          <View style={styles.weatherRow}>
            {data.days.slice(0, 5).map((day) => (
              <View key={day.label} style={styles.weatherDay}>
                <Text style={styles.weatherLabel}>{day.label}</Text>
                <Text style={{ fontSize: 14 }}>{day.icon || "•"}</Text>
                {day.temperature ? (
                  <Text style={styles.weatherTemp}>{day.temperature}</Text>
                ) : null}
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
    <GlassCard delay={0.08} onClick={onClick}>
      <View style={styles.heroImageSmall}>
        <CardImage
          src={data.image}
          alt={`${data.origin} → ${data.destination}`}
          style={styles.heroImageInner}
        />
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.72)"]}
          locations={[0.4, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {data.badge ? (
          <View style={styles.heroBadgeLeft}>
            <Badge color={COLORS.sky} icon={<Plane size={9} color="#fff" />}>
              {data.badge}
            </Badge>
          </View>
        ) : null}
        <View style={styles.heroFavorite}>
          <Favorite item={data.favorite} />
        </View>
        <View style={styles.heroBottom}>
          <Text style={styles.heroInfoText}>
            {data.origin}
            <Text style={{ color: "#7DD3FC" }}> → </Text>
            {data.destination}
          </Text>
          {data.price ? (
            <View style={styles.rowGapSm}>
              <Text style={styles.heroPrice}>{data.price}</Text>
              {data.oldPrice ? (
                <Text style={styles.oldPrice}>{data.oldPrice}</Text>
              ) : null}
            </View>
          ) : null}
          {data.departure ? (
            <View style={styles.heroInfoItem}>
              <Clock size={10} color="rgba(255,255,255,0.55)" />
              <Text style={styles.heroInfoText}>{data.departure}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {onBook ? (
        <View style={styles.body}>
          <ActionButton color={COLORS.sky} onPress={onBook}>
            <Plane size={12} color={COLORS.sky} />
            <Text style={[styles.actionButtonText, { color: COLORS.sky }]}>
              Réserver
            </Text>
          </ActionButton>
        </View>
      ) : null}
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
    <GlassCard delay={0.1} onClick={onClick}>
      <View style={styles.body}>
        <View style={styles.rowGap}>
          <LinearGradient
            colors={[`${COLORS.sky}22`, `${COLORS.sky}0A`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.communityIconWrap}
          >
            <Text style={{ fontSize: 20 }}>🚌</Text>
          </LinearGradient>
          <View>
            <Text style={styles.cardTitleSm}>Départs disponibles</Text>
            <Text style={styles.muted10}>Transport inter-villes</Text>
          </View>
        </View>

        <View style={{ marginTop: 16 }}>
          {trips.map((trip, idx) => (
            <Pressable
              key={trip.id}
              onPress={() => onTripClick?.(trip)}
              style={({ pressed }) => [
                styles.tripRow,
                idx < trips.length - 1 && styles.tripRowBorder,
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.tripRoute} numberOfLines={1}>
                  {trip.route}
                </Text>
                <Text style={styles.muted10}>
                  {trip.time}
                  {trip.seats !== undefined ? ` · ${trip.seats} places` : ""}
                </Text>
              </View>
              {trip.price ? (
                <Text style={styles.tripPrice}>{trip.price}</Text>
              ) : null}
              <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
            </Pressable>
          ))}
        </View>
      </View>
    </GlassCard>
  );
}

/* ============================================================================
 * MEDIA
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
    <GlassCard delay={0.08} onClick={onClick}>
      {data.image ? (
        <View style={styles.heroImageSmall}>
          <CardImage
            src={data.image}
            alt={data.title}
            style={styles.heroImageInner}
          />
          <LinearGradient
            colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.72)"]}
            locations={[0.4, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          {data.category ? (
            <View style={styles.heroBadgeLeft}>
              <Badge
                color={COLORS.cyan}
                icon={<Newspaper size={9} color="#fff" />}
              >
                {data.category}
              </Badge>
            </View>
          ) : null}
          <View style={styles.heroBottom}>
            <Text style={styles.heroTitle} numberOfLines={3}>
              {data.title}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.body}>
        {!data.image && data.category ? (
          <Badge color={COLORS.cyan}>{data.category}</Badge>
        ) : null}
        {!data.image ? (
          <Text style={[styles.cardTitle, { marginTop: 8 }]}>{data.title}</Text>
        ) : null}

        {data.description ? (
          <Text style={styles.communityDesc}>{data.description}</Text>
        ) : null}

        <View style={styles.rowBetween}>
          <View style={styles.rowGapSm}>
            <Newspaper size={11} color="rgba(255,255,255,0.35)" />
            <View style={{ minWidth: 0 }}>
              {data.source ? (
                <Text style={styles.mediaSource} numberOfLines={1}>
                  {data.source}
                </Text>
              ) : null}
              {data.publishedAt ? (
                <Text style={styles.mediaDate}>{data.publishedAt}</Text>
              ) : null}
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Pressable onPress={onLike} hitSlop={6} style={styles.footerAction}>
              <Heart size={13} color="rgba(255,255,255,0.45)" />
              <Text style={styles.footerActionText}>
                {formatNumber(data.stats?.likes)}
              </Text>
            </Pressable>
            <Pressable
              onPress={onShare}
              hitSlop={6}
              style={styles.footerAction}
            >
              <Share2 size={13} color="rgba(255,255,255,0.45)" />
              <Text style={styles.footerActionText}>
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
    <GlassCard delay={0.1} onClick={onClick}>
      <View style={styles.body}>
        <View style={styles.rowBetween}>
          <Badge color={COLORS.pink}>🎙️ Podcast</Badge>
          {data.duration ? (
            <Text style={styles.mediaDate}>{data.duration}</Text>
          ) : null}
        </View>
        <Text style={[styles.cardTitleSm, { marginTop: 12 }]}>
          {data.title}
        </Text>
        {data.description ? (
          <Text style={styles.communityDesc}>{data.description}</Text>
        ) : null}
        {data.author ? (
          <Text style={[styles.mediaDate, { marginTop: 8 }]}>
            {data.author}
          </Text>
        ) : null}

        <View style={styles.podcastActions}>
          {onPlay ? (
            <Pressable
              onPress={onPlay}
              style={({ pressed }) => [
                styles.podcastPlay,
                pressed && { opacity: 0.85 },
              ]}
            >
              <LinearGradient
                colors={[COLORS.pink, "#BE185D"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.podcastPlayInner}
              >
                <Text style={styles.podcastPlayText}>▶ Écouter</Text>
              </LinearGradient>
            </Pressable>
          ) : null}
          {onFollow ? (
            <Pressable
              onPress={onFollow}
              style={({ pressed }) => [
                styles.podcastFollow,
                pressed && { opacity: 0.75 },
              ]}
            >
              <Text style={styles.podcastFollowText}>Suivre</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </GlassCard>
  );
}

/* ============================================================================
 * AI RECOMMEND
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
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onClick}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[styles.aiRecommendCard, { borderColor: `${color}40` }]}
      >
        <LinearGradient
          colors={[`${color}22`, "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View
          style={[
            styles.aiRecommendIcon,
            { backgroundColor: `${color}25`, borderColor: `${color}55` },
          ]}
        >
          {icon || (
            <Text style={{ fontSize: 18 }}>
              {emoji || <Sparkles size={16} color={color} />}
            </Text>
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.cardTitleSm} numberOfLines={1}>
            {label}
          </Text>
          {desc ? (
            <Text style={styles.muted10} numberOfLines={1}>
              {desc}
            </Text>
          ) : null}
        </View>
        <ChevronRight size={15} color={`${color}CC`} />
      </Pressable>
    </Animated.View>
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
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <PulsingSparkleBadge />
        <Text style={styles.sectionTitle}>Pour vous</Text>
        <View style={styles.sectionAiBadge}>
          <Text style={styles.sectionAiBadgeText}>IA</Text>
        </View>
      </View>
      <View style={{ gap: 8 }}>
        {recommendations.map((recommendation) => (
          <AIRecommendCard
            key={recommendation.id}
            label={recommendation.label}
            desc={recommendation.description}
            emoji={recommendation.emoji}
            icon={recommendation.icon}
            color={recommendation.color}
            onClick={
              onNavigate ? () => onNavigate(recommendation.id) : undefined
            }
          />
        ))}
      </View>
    </View>
  );
}

function PulsingSparkleBadge() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });
  const rotate = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "6deg"],
  });

  return (
    <Animated.View
      style={[styles.sectionIconWrap, { transform: [{ scale }, { rotate }] }]}
    >
      <LinearGradient
        colors={["#A78BFA", "#7C3AED"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.sectionIconGradient}
      >
        <Sparkles size={11} color="#fff" />
      </LinearGradient>
    </Animated.View>
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
    <GlassCard delay={0.14} onClick={onClick}>
      <View style={[styles.body, { overflow: "hidden" }]}>
        <View style={styles.referralOrb} pointerEvents="none" />
        <View style={styles.rowGap}>
          <LinearGradient
            colors={[`${COLORS.violet}22`, `${COLORS.violet}0A`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.referralIcon}
          >
            <Gift size={16} color="#C4B5FD" />
          </LinearGradient>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.cardTitleSm}>
              {data.title || "Programme Parrainage"}
            </Text>
            {data.description ? (
              <Text style={styles.muted10}>{data.description}</Text>
            ) : null}
          </View>
        </View>

        {data.rewardLabel ? (
          <Text style={styles.referralReward}>{data.rewardLabel}</Text>
        ) : null}

        <View style={styles.referralActions}>
          {onShare ? (
            <ActionButton color={COLORS.violet} onPress={onShare}>
              <Share2 size={12} color={COLORS.violet} />
              <Text style={[styles.actionButtonText, { color: COLORS.violet }]}>
                Partager
              </Text>
            </ActionButton>
          ) : null}
          {data.totalEarnedLabel ? (
            <View style={styles.referralEarned}>
              <Text style={styles.referralEarnedText}>
                {data.totalEarnedLabel}
              </Text>
            </View>
          ) : null}
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
    <GlassCard delay={0.18} onClick={onClick}>
      <View style={styles.marketplaceHero}>
        <CardImage
          src={data.image}
          alt={data.title || "Marketplace"}
          style={styles.heroImageInner}
        />
        <LinearGradient
          colors={["rgba(0,0,0,0.2)", "rgba(0,0,0,0.78)"]}
          locations={[0, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <View style={styles.marketplaceOverlay}>
          <View style={styles.rowGap}>
            <View style={styles.marketplaceIcon}>
              <ShoppingBag size={18} color="#fff" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.heroTitle} numberOfLines={1}>
                {data.title}
              </Text>
              {data.description ? (
                <Text style={styles.marketplaceDesc} numberOfLines={1}>
                  {data.description}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.marketplaceBottom}>
            <View style={styles.marketplaceCats}>
              {data.categories?.slice(0, 4).map((category) => (
                <View key={category} style={styles.marketplaceCat}>
                  <Text style={styles.marketplaceCatText}>{category}</Text>
                </View>
              ))}
            </View>
            <View style={styles.marketplaceArrow}>
              <ArrowUpRight size={17} color="#fff" />
            </View>
          </View>
        </View>
      </View>
    </GlassCard>
  );
}

/* ============================================================================
 * EMPTY STATE
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
    <FadeUp distance={14}>
      <View style={styles.emptyCard}>
        <LinearGradient
          colors={[`${COLORS.violet}22`, "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.emptyIcon}>
          {icon || <Sparkles size={20} color="#C4B5FD" />}
        </View>
        <Text style={styles.emptyTitle}>{title}</Text>
        {description ? (
          <Text style={styles.emptyDescription}>{description}</Text>
        ) : null}
        {actionLabel && onAction ? (
          <Pressable
            onPress={onAction}
            style={({ pressed }) => [
              styles.emptyAction,
              pressed && { opacity: 0.85 },
            ]}
          >
            <LinearGradient
              colors={["#8B5CF6", "#6366F1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyActionInner}
            >
              <Text style={styles.emptyActionText}>{actionLabel}</Text>
            </LinearGradient>
          </Pressable>
        ) : null}
      </View>
    </FadeUp>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  // ── GlassCard
  glassCard: {
    marginHorizontal: 20,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(12,10,28,0.55)",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },

  // ── Badge
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.3,
  },

  // ── IconButton
  iconButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  // ── ActionButton
  actionButton: {
    width: "100%",
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButtonText: {
    fontSize: 12.5,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  // ── Rating
  ratingValue: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.7)",
  },
  ratingReviews: {
    fontSize: 9.5,
    color: "rgba(255,255,255,0.4)",
  },

  // ── Stat
  statText: {
    fontSize: 10.5,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
  },

  // ── Verified
  verified: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "rgba(59,130,246,0.15)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.3)",
  },
  verifiedText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#93C5FD",
  },

  // ── Hero image
  heroImage: {
    height: 208,
    width: "100%",
    overflow: "hidden",
  },
  heroImageSmall: {
    height: 192,
    width: "100%",
    overflow: "hidden",
  },
  heroImageInner: {
    width: "100%",
    height: "100%",
  },
  heroBadgeLeft: {
    position: "absolute",
    top: 12,
    left: 12,
  },
  heroFavorite: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  heroBottom: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
  },
  heroPrice: {
    fontSize: 26,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.6,
  },
  heroPriceSuffix: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.55)",
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#fff",
    lineHeight: 22,
    letterSpacing: -0.4,
  },
  heroMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  heroMeta: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    flexShrink: 1,
    fontWeight: "500",
  },
  heroMetaDot: {
    color: "rgba(255,255,255,0.3)",
  },
  heroMetaDim: {
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },
  heroInfoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 6,
  },
  heroInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  heroInfoText: {
    fontSize: 10.5,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
  oldPrice: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    textDecorationLine: "line-through",
    marginLeft: 8,
    alignSelf: "flex-end",
  },

  // ── Body
  body: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  cardTitleSm: {
    fontSize: 13,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.2,
  },
  muted10: {
    fontSize: 10.5,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500",
  },

  // ── Layout
  rowGap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowGapSm: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  rowBetweenStart: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },

  // ── Features
  featuresRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  featureChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  featureChipText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "rgba(255,255,255,0.6)",
  },

  // ── Talents
  avatarWrap: {
    position: "relative",
    width: 44,
    height: 44,
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 14,
  },
  onlineDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.green,
    borderWidth: 2,
    borderColor: "#0F0720",
    shadowColor: COLORS.green,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  locationText: {
    fontSize: 9.5,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },
  talentMiddle: {
    flexDirection: "row",
    gap: 14,
    marginTop: 16,
  },
  talentPhotoWrap: {
    width: 96,
    height: 96,
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
  },
  talentPhoto: {
    width: "100%",
    height: "100%",
  },
  talentAvailOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 4,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  talentAvailText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#6EE7B7",
    textAlign: "center",
    letterSpacing: 0.6,
  },
  talentResponseTime: {
    marginTop: 8,
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500",
  },

  // ── Job
  jobOrb: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 128,
    height: 128,
    borderRadius: 9999,
    backgroundColor: "rgba(139,92,246,0.15)",
  },
  jobLogoWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.35)",
    overflow: "hidden",
  },
  jobLogoImg: {
    width: "100%",
    height: "100%",
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },

  // ── Community
  communityIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.35)",
    overflow: "hidden",
  },
  communityIconImg: {
    width: "100%",
    height: "100%",
  },
  communityDesc: {
    marginTop: 14,
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.55)",
    fontWeight: "500",
  },
  avatarsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
  },
  avatarsStack: {
    flexDirection: "row",
  },
  avatarMini: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#17171F",
  },

  // ── Footer
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  footerAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  footerActionText: {
    fontSize: 10.5,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
  },
  replyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: "rgba(139,92,246,0.18)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.35)",
  },
  replyBtnText: {
    fontSize: 10.5,
    fontWeight: "900",
    color: "#C4B5FD",
    letterSpacing: 0.2,
  },

  // ── Event
  eventPrice: {
    fontSize: 14,
    fontWeight: "900",
    color: "#C4B5FD",
  },
  eventCapacityLabel: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.5)",
  },
  capacityLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  capacityLabelText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
  },
  capacityValueText: {
    fontSize: 9.5,
    fontWeight: "900",
  },
  capacityTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.07)",
    overflow: "hidden",
  },
  capacityFill: {
    height: "100%",
    borderRadius: 3,
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },

  // ── Agri
  agriIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.3)",
  },
  agriMiddle: {
    flexDirection: "row",
    gap: 14,
    marginTop: 16,
  },
  agriImageWrap: {
    width: 112,
    height: 112,
    borderRadius: 18,
    overflow: "hidden",
  },
  agriImage: {
    width: "100%",
    height: "100%",
  },
  agriPrice: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: "900",
    color: "#6EE7B7",
    letterSpacing: -0.5,
  },
  agriUnit: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "rgba(255,255,255,0.4)",
  },

  // ── Weather
  weatherRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 14,
  },
  weatherDay: {
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    minWidth: 56,
  },
  weatherLabel: {
    fontSize: 8.5,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "700",
  },
  weatherTemp: {
    fontSize: 9.5,
    fontWeight: "900",
    color: "rgba(255,255,255,0.7)",
  },

  // ── Voyages
  tripRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  tripRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  tripRoute: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.2,
  },
  tripPrice: {
    fontSize: 12.5,
    fontWeight: "900",
    color: "#7DD3FC",
    marginRight: 4,
  },

  // ── Media
  mediaSource: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.55)",
  },
  mediaDate: {
    fontSize: 9.5,
    color: "rgba(255,255,255,0.35)",
    fontWeight: "500",
  },

  // ── Podcast
  podcastActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  podcastPlay: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  podcastPlayInner: {
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  podcastPlayText: {
    fontSize: 12.5,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.2,
  },
  podcastFollow: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  podcastFollowText: {
    fontSize: 12,
    fontWeight: "800",
    color: "rgba(255,255,255,0.7)",
  },

  // ── AI Recommend
  aiRecommendCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    overflow: "hidden",
  },
  aiRecommendIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  // ── PourVous section
  section: {
    marginHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionIconWrap: {
    width: 24,
    height: 24,
  },
  sectionIconGradient: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.3,
  },
  sectionAiBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "rgba(139,92,246,0.18)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.35)",
  },
  sectionAiBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#C4B5FD",
    letterSpacing: 0.6,
  },

  // ── Referral
  referralOrb: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 160,
    height: 160,
    borderRadius: 9999,
    backgroundColor: "rgba(139,92,246,0.22)",
  },
  referralIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.35)",
  },
  referralReward: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: "800",
    color: "rgba(255,255,255,0.85)",
  },
  referralActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
  },
  referralEarned: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "rgba(52,211,153,0.15)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.35)",
  },
  referralEarnedText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#6EE7B7",
    letterSpacing: 0.2,
  },

  // ── Marketplace
  marketplaceHero: {
    height: 176,
    width: "100%",
    overflow: "hidden",
  },
  marketplaceOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 16,
    justifyContent: "space-between",
  },
  marketplaceIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  marketplaceDesc: {
    marginTop: 4,
    fontSize: 11,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "500",
  },
  marketplaceBottom: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 10,
  },
  marketplaceCats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  marketplaceCat: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  marketplaceCatText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.2,
  },
  marketplaceArrow: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },

  // ── Empty
  emptyCard: {
    marginHorizontal: 20,
    padding: 32,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(12,10,28,0.5)",
    alignItems: "center",
    overflow: "hidden",
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.15)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.3)",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.2,
  },
  emptyDescription: {
    marginTop: 6,
    maxWidth: 280,
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
    fontWeight: "500",
  },
  emptyAction: {
    marginTop: 20,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#6366F1",
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  emptyActionInner: {
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  emptyActionText: {
    fontSize: 12.5,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.2,
  },
});

/* ============================================================================
 * EXPORTS UTILITAIRES
 * ========================================================================== */

export { Badge, Rating, Verified, Stat, IconButton, ActionButton, GlassCard };
