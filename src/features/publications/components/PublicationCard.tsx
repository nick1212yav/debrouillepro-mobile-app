import React, { useCallback } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useRouter, type Href } from "expo-router";
import {
  Award,
  Bath,
  Bed,
  Briefcase,
  Calendar,
  Car,
  Clock,
  Home,
  Leaf,
  MapPin,
  Package,
  Plane,
  Square,
  Star,
  Tag,
  Truck,
  Users,
  UtensilsCrossed,
} from "lucide-react-native";

import { getPublicationConfig } from "../config";
import { PublicationHeader } from "./PublicationHeader";
import { PublicationGallery } from "./PublicationGallery";
import { PublicationActions } from "./PublicationActions";
import { PublicationCTA } from "./PublicationCTA";
import { PublicationPoll, type PollOption } from "./PublicationPoll";
import { formatTime, getModuleEmoji, parseMeta } from "../utils/format.utils";
import type { Publication, PublicationType } from "../types";

interface Props {
  publication: Publication;
  index: number;
  onLike: () => void;
  onVote?: (optionId: string) => void;
  onDelete?: () => void;
  onAction: (actionId: string) => void;
  onCTA: () => void;
  actionsSlot?: React.ReactNode;
}

interface NetworkExperience {
  title?: string;
  company?: string;
}

interface PublicationMeta {
  postType?: string;

  professionalId?: string;
  id?: string;

  origin?: string;
  destination?: string;
  departureTime?: string;
  pricePerSeat?: string;
  currency?: string;
  seatsAvailable?: number;
  vehicleType?: string;

  cuisine?: string;
  location?: string;
  rating?: string;
  priceRange?: string;
  deliveryTime?: string;

  type?: string;
  price?: string;
  period?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  available?: boolean;

  category?: string;
  subcategory?: string;
  variety?: string;
  quality?: string;
  quantity?: number;
  unit?: string;
  priceUnit?: string;
  sellerName?: string;
  sellerVerified?: boolean;

  headline?: string;
  skills?: string[];
  experiences?: NetworkExperience[];
  certifications?: string[];

  operator?: string;
  transportType?: string;
  from?: string;
  to?: string;
  departure?: string;
  arrival?: string;
  duration?: string;
  availableSeats?: number;
  totalSeats?: number;
  amenities?: string[];

  pollOptions?: PollOption[];
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function isFinitePositiveNumber(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function parsePositiveNumber(value: string | undefined): number {
  if (!value) {
    return 0;
  }

  const parsed = Number.parseFloat(value);
  return isFinitePositiveNumber(parsed) ? parsed : 0;
}

function getMetaValue(
  meta: PublicationMeta,
  key: keyof PublicationMeta,
): unknown {
  return meta[key];
}

function parsePublicationMeta(value?: string): PublicationMeta {
  if (!value) {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return parsed as PublicationMeta;
  } catch {
    return {};
  }
}

function isPollOption(value: unknown): value is PollOption {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.text === "string" &&
    typeof candidate.votes === "number"
  );
}

function getPollOptions(meta: PublicationMeta): PollOption[] {
  const options = getMetaValue(meta, "pollOptions");

  if (!Array.isArray(options)) {
    return [];
  }

  return options.filter(isPollOption);
}

function getStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );
}

function getExperienceArray(value: unknown): NetworkExperience[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is NetworkExperience =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
}

function getRouteForPublication(
  publication: Publication,
  meta: PublicationMeta,
): string | null {
  const id = String(publication._id);

  switch (publication.type) {
    case "community":
      return `/community/${id}`;

    case "sante": {
      const professionalId = meta.professionalId ?? meta.id ?? id;
      return `/sante/${professionalId}`;
    }

    case "transport":
      return `/transport/${id}`;

    case "restauration":
      return `/restauration/${id}`;

    case "hebergement":
      return `/hebergement/${id}`;

    case "agri":
      return `/agri/${id}`;

    case "network":
      return `/network/${id}`;

    case "voyages":
      return `/voyages/${id}`;

    default:
      return null;
  }
}

function getCtaLabel(type: PublicationType): string {
  switch (type) {
    case "transport":
      return "Réserver";

    case "restauration":
      return "Voir le menu";

    case "hebergement":
      return "Voir le logement";

    case "agri":
      return "Voir le produit";

    case "network":
      return "Voir le profil";

    case "voyages":
      return "Voir le voyage";

    default:
      return "Voir les détails";
  }
}

export function PublicationCard({
  publication,
  index,
  onLike,
  onVote,
  onDelete,
  onAction,
  onCTA,
  actionsSlot,
}: Props) {
  const router = useRouter();

  const config = getPublicationConfig(publication.type as PublicationType);

  const meta = parsePublicationMeta(publication.meta);

  const postType = meta.postType ?? "text";
  const emoji = getModuleEmoji(publication.type);

  const pollOptions = getPollOptions(meta);
  const totalVotes = pollOptions.reduce((sum, option) => sum + option.votes, 0);

  const pollVoted = publication.votedOptionId;

  const tags = publication.tags ?? [];
  const images = publication.images ?? [];
  const description = publication.description ?? "";
  const title = publication.title ?? "";

  const scale = useSharedValue(1);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.985, {
      damping: 18,
      stiffness: 260,
      mass: 0.45,
    });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, {
      damping: 18,
      stiffness: 260,
      mass: 0.45,
    });
  }, [scale]);

  const navigateToPublication = useCallback(() => {
    const route = getRouteForPublication(publication, meta);

    if (route) {
      router.push(route as Href);
      return;
    }

    onCTA();
  }, [meta, onCTA, publication, router]);

  const handleCTA = useCallback(
    (event?: GestureResponderEvent) => {
      event?.stopPropagation();
      navigateToPublication();
    },
    [navigateToPublication],
  );

  const renderTransportContent = () => {
    const origin = meta.origin ?? "";
    const destination = meta.destination ?? "";
    const departureTime = meta.departureTime ?? "";
    const price = parsePositiveNumber(meta.pricePerSeat);
    const currency = meta.currency ?? "FCFA";
    const seats = meta.seatsAvailable ?? 0;
    const vehicleType = meta.vehicleType ?? "";

    return (
      <View style={styles.contentSection}>
        {origin && destination ? (
          <Text style={styles.routeTitle}>
            {origin}
            <Text style={styles.routeArrow}> → </Text>
            {destination}
          </Text>
        ) : null}

        <View style={styles.metadataRow}>
          {departureTime ? (
            <View style={styles.metadataItem}>
              <Clock size={12} className="text-slate-400" />
              <Text style={styles.metadataText}>{departureTime}</Text>
            </View>
          ) : null}

          {vehicleType ? (
            <View style={styles.metadataItem}>
              <Car size={12} className="text-slate-400" />
              <Text style={styles.metadataText}>{vehicleType}</Text>
            </View>
          ) : null}

          {seats > 0 ? (
            <View style={styles.metadataItem}>
              <Users size={12} className="text-slate-400" />
              <Text style={styles.metadataText}>{seats} places</Text>
            </View>
          ) : null}
        </View>

        {price > 0 ? (
          <Text style={styles.violetPrice}>
            {price.toLocaleString()} {currency}
          </Text>
        ) : null}

        <CardCTA
          label={getCtaLabel("transport")}
          onPress={handleCTA}
          variant="violet"
        />
      </View>
    );
  };

  const renderRestaurantContent = () => {
    const name = title || "Restaurant";
    const cuisine = meta.cuisine ?? "";
    const location = meta.location ?? publication.location ?? "";
    const rating = parsePositiveNumber(meta.rating);
    const priceRange = meta.priceRange ?? "";
    const deliveryTime = meta.deliveryTime ?? "";

    return (
      <View style={styles.contentSection}>
        <View style={styles.titleRow}>
          <View style={styles.flex}>
            <Text style={styles.sectionTitle}>{name}</Text>

            {cuisine ? (
              <View style={styles.inlineTextRow}>
                <UtensilsCrossed size={12} className="text-orange-400" />
                <Text style={styles.mutedSmall}>{cuisine}</Text>
              </View>
            ) : null}
          </View>

          {rating > 0 ? (
            <View style={styles.rating}>
              <Star size={12} className="text-amber-400 fill-amber-400" />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>

        {location ? (
          <View style={styles.inlineTextRow}>
            <MapPin size={12} className="text-slate-500" />
            <Text numberOfLines={1} style={styles.mutedSmall}>
              {location}
            </Text>
          </View>
        ) : null}

        <View style={styles.metadataRow}>
          {priceRange ? (
            <Text style={styles.metadataText}>{priceRange}</Text>
          ) : null}

          {deliveryTime ? (
            <View style={styles.metadataItem}>
              <Truck size={12} className="text-slate-500" />
              <Text style={styles.metadataText}>{deliveryTime}</Text>
            </View>
          ) : null}
        </View>

        {description ? (
          <Text numberOfLines={4} style={styles.description}>
            {description}
          </Text>
        ) : null}

        <CardCTA
          label={getCtaLabel("restauration")}
          onPress={handleCTA}
          variant="orange"
        />
      </View>
    );
  };

  const renderHebergementContent = () => {
    const accommodationTitle = title || "Logement";
    const type = meta.type ?? "";
    const location = meta.location ?? publication.location ?? "";
    const price = parsePositiveNumber(meta.price);
    const currency = meta.currency ?? "FCFA";
    const period = meta.period ?? "nuit";
    const bedrooms = meta.bedrooms ?? 0;
    const bathrooms = meta.bathrooms ?? 0;
    const area = meta.area ?? 0;
    const rating = parsePositiveNumber(meta.rating);
    const isAvailable = meta.available !== false;

    return (
      <View style={styles.contentSection}>
        <View style={styles.titleRow}>
          <View style={styles.flex}>
            <Text style={styles.sectionTitle}>{accommodationTitle}</Text>

            {type ? (
              <View style={styles.inlineTextRow}>
                <Home size={12} className="text-emerald-400" />
                <Text style={styles.mutedSmall}>{type}</Text>
              </View>
            ) : null}
          </View>

          {rating > 0 ? (
            <View style={styles.rating}>
              <Star size={12} className="text-amber-400 fill-amber-400" />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>

        {location ? (
          <View style={styles.inlineTextRow}>
            <MapPin size={12} className="text-slate-500" />
            <Text numberOfLines={1} style={styles.mutedSmall}>
              {location}
            </Text>
          </View>
        ) : null}

        {price > 0 ? (
          <Text style={styles.emeraldPrice}>
            {price.toLocaleString()} {currency} / {period}
          </Text>
        ) : null}

        <View style={styles.metadataRow}>
          {bedrooms > 0 ? (
            <View style={styles.metadataItem}>
              <Bed size={12} className="text-slate-500" />
              <Text style={styles.metadataText}>{bedrooms} ch.</Text>
            </View>
          ) : null}

          {bathrooms > 0 ? (
            <View style={styles.metadataItem}>
              <Bath size={12} className="text-slate-500" />
              <Text style={styles.metadataText}>{bathrooms} sdb</Text>
            </View>
          ) : null}

          {area > 0 ? (
            <View style={styles.metadataItem}>
              <Square size={12} className="text-slate-500" />
              <Text style={styles.metadataText}>{area} m²</Text>
            </View>
          ) : null}

          {!isAvailable ? (
            <Text style={styles.unavailable}>Indisponible</Text>
          ) : null}
        </View>

        {description ? (
          <Text numberOfLines={4} style={styles.description}>
            {description}
          </Text>
        ) : null}

        <CardCTA
          label={getCtaLabel("hebergement")}
          onPress={handleCTA}
          variant="emerald"
        />
      </View>
    );
  };

  const renderAgriContent = () => {
    const agriTitle = title || "Produit agricole";
    const category = meta.category ?? "";
    const variety = meta.variety ?? "";
    const quality = meta.quality ?? "";
    const quantity = meta.quantity ?? 0;
    const unit = meta.unit ?? "kg";
    const price = parsePositiveNumber(meta.price);
    const currency = meta.currency ?? "FCFA";
    const priceUnit = meta.priceUnit ?? "kg";
    const location = meta.location ?? publication.location ?? "";
    const sellerName = meta.sellerName ?? "";
    const sellerVerified = meta.sellerVerified ?? false;
    const rating = parsePositiveNumber(meta.rating);

    const categoryLabels: Record<string, string> = {
      cereales: "🌾 Céréales",
      legumes: "🥬 Légumes",
      fruits: "🍎 Fruits",
      intrants: "🧪 Intrants",
      materiel: "🚜 Matériel",
      conseil: "🧑‍🌾 Conseil",
    };

    const categoryLabel = categoryLabels[category] ?? category;

    return (
      <View style={styles.contentSection}>
        <View style={styles.titleRow}>
          <View style={styles.flex}>
            <Text style={styles.sectionTitle}>{agriTitle}</Text>

            {categoryLabel ? (
              <View style={styles.inlineTextRow}>
                <Leaf size={12} className="text-emerald-400" />
                <Text style={styles.mutedSmall}>{categoryLabel}</Text>
              </View>
            ) : null}

            {variety ? (
              <Text style={styles.subtleText}>Variété : {variety}</Text>
            ) : null}
          </View>

          {rating > 0 ? (
            <View style={styles.rating}>
              <Star size={12} className="text-amber-400 fill-amber-400" />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>

        {sellerName ? (
          <View style={styles.inlineTextRow}>
            <Text style={styles.mutedSmall}>Vendu par : {sellerName}</Text>

            {sellerVerified ? (
              <Text style={styles.verified}>✓ Vérifié</Text>
            ) : null}
          </View>
        ) : null}

        {location ? (
          <View style={styles.inlineTextRow}>
            <MapPin size={12} className="text-slate-500" />
            <Text numberOfLines={1} style={styles.mutedSmall}>
              {location}
            </Text>
          </View>
        ) : null}

        {quantity > 0 ? (
          <View style={styles.inlineTextRow}>
            <Package size={12} className="text-slate-500" />
            <Text style={styles.metadataText}>
              Disponible : {quantity} {unit}
            </Text>
          </View>
        ) : null}

        {price > 0 ? (
          <View style={styles.priceRow}>
            <Tag size={14} className="text-emerald-400" />
            <Text style={styles.emeraldPrice}>
              {price.toLocaleString()} {currency}
            </Text>
            <Text style={styles.subtleText}>/ {priceUnit}</Text>
          </View>
        ) : null}

        {quality ? (
          <View style={styles.inlineTextRow}>
            <Text style={styles.mutedSmall}>Qualité :</Text>
            <Text style={styles.strongMuted}>{quality}</Text>
          </View>
        ) : null}

        {description ? (
          <Text numberOfLines={4} style={styles.description}>
            {description}
          </Text>
        ) : null}

        <CardCTA
          label={getCtaLabel("agri")}
          onPress={handleCTA}
          variant="green"
        />
      </View>
    );
  };

  const renderNetworkContent = () => {
    const networkTitle = title || "Profil professionnel";
    const headline = meta.headline ?? "";
    const location = meta.location ?? publication.location ?? "";
    const skills = getStringArray(meta.skills);
    const experiences = getExperienceArray(meta.experiences);
    const certifications = getStringArray(meta.certifications);
    const rating = parsePositiveNumber(meta.rating);

    return (
      <View style={styles.contentSection}>
        <View style={styles.titleRow}>
          <View style={styles.flex}>
            <Text style={styles.sectionTitle}>{networkTitle}</Text>

            {headline ? (
              <Text style={styles.networkHeadline}>{headline}</Text>
            ) : null}
          </View>

          {rating > 0 ? (
            <View style={styles.rating}>
              <Star size={12} className="text-amber-400 fill-amber-400" />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>

        {location ? (
          <View style={styles.inlineTextRow}>
            <MapPin size={12} className="text-slate-500" />
            <Text numberOfLines={1} style={styles.mutedSmall}>
              {location}
            </Text>
          </View>
        ) : null}

        {skills.length > 0 ? (
          <View style={styles.chipsRow}>
            {skills.slice(0, 3).map((skill) => (
              <View key={skill} style={styles.skillChip}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}

            {skills.length > 3 ? (
              <Text style={styles.subtleText}>+{skills.length - 3}</Text>
            ) : null}
          </View>
        ) : null}

        {experiences.length > 0 ? (
          <View style={styles.experienceList}>
            {experiences.slice(0, 2).map((experience, experienceIndex) => (
              <View
                key={`${experience.title ?? "experience"}-${experience.company ?? "company"}-${experienceIndex}`}
                style={styles.inlineTextRow}
              >
                <Briefcase size={11} className="text-slate-500" />
                <Text numberOfLines={1} style={styles.mutedSmall}>
                  {experience.title ?? "Expérience"} —{" "}
                  {experience.company ?? "Entreprise"}
                </Text>
              </View>
            ))}

            {experiences.length > 2 ? (
              <Text style={styles.subtleText}>
                +{experiences.length - 2} autres expériences
              </Text>
            ) : null}
          </View>
        ) : null}

        {certifications.length > 0 ? (
          <View style={styles.inlineTextRow}>
            <Award size={11} className="text-indigo-400" />
            <Text style={styles.mutedSmall}>
              {certifications.length} certification
              {certifications.length > 1 ? "s" : ""}
            </Text>
          </View>
        ) : null}

        {description ? (
          <Text numberOfLines={4} style={styles.description}>
            {description}
          </Text>
        ) : null}

        <CardCTA
          label={getCtaLabel("network")}
          onPress={handleCTA}
          variant="indigo"
        />
      </View>
    );
  };

  const renderVoyageContent = () => {
    const voyageTitle = title || "Voyage";
    const operator = meta.operator ?? "";
    const transportType = meta.transportType ?? "";
    const from = meta.from ?? "";
    const to = meta.to ?? "";
    const departure = meta.departure ?? "";
    const arrival = meta.arrival ?? "";
    const duration = meta.duration ?? "";
    const price = parsePositiveNumber(meta.price);
    const currency = meta.currency ?? "FCFA";
    const availableSeats = Math.max(meta.availableSeats ?? 0, 0);
    const totalSeats = Math.max(meta.totalSeats ?? 0, 0);
    const amenities = getStringArray(meta.amenities);
    const rating = parsePositiveNumber(meta.rating);

    const occupancyRate =
      totalSeats > 0
        ? Math.min(
            100,
            Math.max(
              0,
              Math.round(((totalSeats - availableSeats) / totalSeats) * 100),
            ),
          )
        : 0;

    const occupancyLabel =
      occupancyRate > 80
        ? "Très demandé"
        : occupancyRate > 50
          ? "Demande élevée"
          : "Bonne disponibilité";

    return (
      <View style={styles.contentSection}>
        <View style={styles.titleRow}>
          <View style={styles.flex}>
            <Text style={styles.sectionTitle}>{voyageTitle}</Text>

            {operator ? (
              <View style={styles.inlineTextRow}>
                <Plane size={12} className="text-sky-400" />
                <Text numberOfLines={1} style={styles.mutedSmall}>
                  {operator}
                </Text>
              </View>
            ) : null}
          </View>

          {rating > 0 ? (
            <View style={styles.rating}>
              <Star size={12} className="text-amber-400 fill-amber-400" />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>

        {from && to ? (
          <Text style={styles.routeTitle}>
            {from}
            <Text style={styles.routeArrow}> ✈ </Text>
            {to}
          </Text>
        ) : null}

        <View style={styles.metadataColumn}>
          {departure ? (
            <View style={styles.inlineTextRow}>
              <Clock size={12} className="text-slate-500" />
              <Text style={styles.mutedSmall}>Départ : {departure}</Text>
            </View>
          ) : null}

          {arrival ? (
            <View style={styles.inlineTextRow}>
              <Clock size={12} className="text-slate-500" />
              <Text style={styles.mutedSmall}>Arrivée : {arrival}</Text>
            </View>
          ) : null}

          {duration ? (
            <View style={styles.inlineTextRow}>
              <Calendar size={12} className="text-slate-500" />
              <Text style={styles.mutedSmall}>{duration}</Text>
            </View>
          ) : null}
        </View>

        {transportType ? (
          <View style={styles.travelTypeBadge}>
            <Text style={styles.travelTypeText}>{transportType}</Text>
          </View>
        ) : null}

        <View style={styles.priceAndSeatsRow}>
          {price > 0 ? (
            <Text style={styles.skyPrice}>
              {price.toLocaleString()} {currency}
            </Text>
          ) : (
            <View />
          )}

          {totalSeats > 0 ? (
            <View style={styles.seatsBlock}>
              <Text style={styles.seatsText}>
                {availableSeats}/{totalSeats} places
              </Text>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${occupancyRate}%`,
                      backgroundColor:
                        occupancyRate > 80
                          ? "#f43f5e"
                          : occupancyRate > 50
                            ? "#f59e0b"
                            : "#10b981",
                    },
                  ]}
                />
              </View>

              <Text style={styles.occupancyLabel}>{occupancyLabel}</Text>
            </View>
          ) : null}
        </View>

        {amenities.length > 0 ? (
          <View style={styles.chipsRow}>
            {amenities.slice(0, 4).map((amenity) => (
              <View key={amenity} style={styles.amenityChip}>
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}

            {amenities.length > 4 ? (
              <Text style={styles.subtleText}>+{amenities.length - 4}</Text>
            ) : null}
          </View>
        ) : null}

        {description ? (
          <Text numberOfLines={4} style={styles.description}>
            {description}
          </Text>
        ) : null}

        <CardCTA
          label={getCtaLabel("voyages")}
          onPress={handleCTA}
          variant="sky"
        />
      </View>
    );
  };

  const renderGenericContent = () => (
    <View style={styles.genericSection}>
      {title ? <Text style={styles.genericTitle}>{title}</Text> : null}

      {description ? (
        <Text numberOfLines={6} style={styles.genericDescription}>
          {description}
        </Text>
      ) : null}

      {tags.length > 0 ? (
        <View style={styles.tagsRow}>
          {tags.map((tag) => (
            <Text key={tag} style={styles.tag}>
              #{tag}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );

  const renderTypeContent = () => {
    switch (publication.type) {
      case "transport":
        return renderTransportContent();

      case "restauration":
        return renderRestaurantContent();

      case "hebergement":
        return renderHebergementContent();

      case "agri":
        return renderAgriContent();

      case "network":
        return renderNetworkContent();

      case "voyages":
        return renderVoyageContent();

      default:
        return renderGenericContent();
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 12) * 45)
        .springify()
        .damping(18)
        .stiffness(180)}
      style={[styles.card, animatedCardStyle]}
    >
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={
          title
            ? `${title}. ${getCtaLabel(publication.type as PublicationType)}`
            : getCtaLabel(publication.type as PublicationType)
        }
        accessibilityHint="Ouvre le contenu correspondant"
        onPress={navigateToPublication}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [
          styles.pressableCard,
          pressed && styles.cardPressed,
        ]}
      >
        <PublicationHeader
          publication={publication}
          type={publication.type as PublicationType}
          emoji={emoji}
          onDelete={onDelete}
          isMine={publication.isMine}
          formatTime={formatTime}
        />

        {images.length > 0 ? (
          <View style={styles.galleryContainer}>
            <PublicationGallery images={images} fit="contain" />
          </View>
        ) : null}

        {renderTypeContent()}

        {postType === "poll" && pollOptions.length > 0 ? (
          <View style={styles.pollContainer}>
            <PublicationPoll
              options={pollOptions}
              votedId={pollVoted}
              totalVotes={totalVotes}
              onVote={onVote}
            />
          </View>
        ) : null}

        <View style={styles.actionsContainer}>
          <View style={styles.actionsLeft}>
            <PublicationActions
              publication={publication}
              actions={config.actions}
              onAction={onAction}
            />

            {actionsSlot}
          </View>

          <PublicationCTA
            cta={config.cta}
            // PublicationCTA expose `onClick` (pas `onPress`).
            // Le handler interne gère déjà Pressable.onPress sans argument.
            onClick={() => handleCTA()}
          />
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

interface CardCTAProps {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  variant: "violet" | "orange" | "emerald" | "green" | "indigo" | "sky";
}

function CardCTA({ label, onPress, variant }: CardCTAProps) {
  const backgroundColor =
    variant === "violet"
      ? "#6d28d9"
      : variant === "orange"
        ? "#ea580c"
        : variant === "emerald"
          ? "#059669"
          : variant === "green"
            ? "#16a34a"
            : variant === "indigo"
              ? "#4f46e5"
              : "#0284c7";

  const pressedBackgroundColor =
    variant === "violet"
      ? "#7c3aed"
      : variant === "orange"
        ? "#f97316"
        : variant === "emerald"
          ? "#10b981"
          : variant === "green"
            ? "#22c55e"
            : variant === "indigo"
              ? "#6366f1"
              : "#0ea5e9";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.ctaButton,
        {
          backgroundColor: pressed ? pressedBackgroundColor : backgroundColor,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <Text style={styles.ctaText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    marginBottom: 14,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  pressableCard: {
    width: "100%",
  },

  cardPressed: {
    opacity: 0.985,
  },

  galleryContainer: {
    width: "100%",
    overflow: "hidden",
  },

  contentSection: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 9,
  },

  genericSection: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 7,
  },

  genericTitle: {
    color: "#ffffff",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "800",
  },

  genericDescription: {
    color: "rgba(255,255,255,0.70)",
    fontSize: 14,
    lineHeight: 21,
  },

  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  tag: {
    color: "#a78bfa",
    fontSize: 10,
    fontWeight: "700",
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },

  flex: {
    flex: 1,
    minWidth: 0,
  },

  sectionTitle: {
    color: "#ffffff",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
  },

  routeTitle: {
    color: "#ffffff",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },

  routeArrow: {
    color: "#38bdf8",
    fontWeight: "900",
  },

  metadataRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
  },

  metadataColumn: {
    gap: 5,
  },

  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  inlineTextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minWidth: 0,
  },

  metadataText: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 11,
    lineHeight: 16,
  },

  mutedSmall: {
    flexShrink: 1,
    color: "rgba(255,255,255,0.52)",
    fontSize: 11,
    lineHeight: 16,
  },

  subtleText: {
    color: "rgba(255,255,255,0.38)",
    fontSize: 10,
    lineHeight: 15,
  },

  strongMuted: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    fontWeight: "600",
  },

  description: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 13,
    lineHeight: 20,
  },

  violetPrice: {
    color: "#a78bfa",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
  },

  emeraldPrice: {
    color: "#34d399",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
  },

  skyPrice: {
    color: "#38bdf8",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  ratingText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },

  unavailable: {
    color: "#fb7185",
    fontSize: 11,
    fontWeight: "700",
  },

  verified: {
    color: "#34d399",
    fontSize: 10,
    fontWeight: "800",
  },

  networkHeadline: {
    marginTop: 2,
    color: "#a5b4fc",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
  },

  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },

  skillChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(99,102,241,0.12)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.20)",
  },

  skillText: {
    color: "#a5b4fc",
    fontSize: 10,
    fontWeight: "700",
  },

  amenityChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  amenityText: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 10,
    fontWeight: "600",
  },

  experienceList: {
    gap: 5,
  },

  travelTypeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  travelTypeText: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 10,
    fontWeight: "700",
  },

  priceAndSeatsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  seatsBlock: {
    width: 100,
    alignItems: "flex-end",
    gap: 4,
  },

  seatsText: {
    color: "rgba(255,255,255,0.40)",
    fontSize: 10,
    fontWeight: "600",
  },

  progressTrack: {
    width: 100,
    height: 6,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
  },

  occupancyLabel: {
    color: "rgba(255,255,255,0.34)",
    fontSize: 9,
    fontWeight: "600",
  },

  ctaButton: {
    width: "100%",
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: 11,
  },

  ctaText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },

  pollContainer: {
    paddingHorizontal: 14,
    paddingBottom: 12,
  },

  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },

  actionsLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
