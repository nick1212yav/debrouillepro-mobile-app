import { useRouter } from "expo-router";
import { View, Text, Pressable, GestureResponderEvent } from "react-native";

// src/features/publications/components/PublicationCard.tsx
import {
  MapPin,
  Clock,
  Users,
  Car,
  Star,
  UtensilsCrossed,
  Truck,
  Bed,
  Bath,
  Square,
  Home,
  Leaf,
  Package,
  Weight,
  Tag,
  UserPlus,
  Briefcase,
  GraduationCap,
  Award,
  Plane,
  Ticket,
  Calendar,
} from "lucide-react-native";
import { usePublicationActions } from "@/features/publications/hooks/usePublicationActions";
import { getPublicationConfig } from "../config";
import { PublicationHeader } from "./PublicationHeader";
import { PublicationGallery } from "./PublicationGallery";
import { PublicationActions } from "./PublicationActions";
import { PublicationCTA } from "./PublicationCTA";
import { PublicationPoll } from "./PublicationPoll";
import { formatTime, parseMeta, getModuleEmoji } from "../utils/format.utils";
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

/**
 * Carte générique pour les publications.
 * Gère tous les types, y compris "voyages".
 */
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
  const meta = parseMeta(publication.meta);
  const postType = meta?.postType ?? "text";
  const emoji = getModuleEmoji(publication.type);
  const pollOptions = meta?.pollOptions ?? [];
  const totalVotes =
    pollOptions?.reduce((s: number, o: { votes: number }) => s + o.votes, 0) ??
    0;
  const pollVoted = publication.votedOptionId;

  // Sécurisation des champs qui pourraient être undefined
  const tags = publication.tags ?? [];
  const images = publication.images ?? [];
  const description = publication.description ?? "";
  const title = publication.title ?? "";

  // ─── Gestionnaires de navigation ──────────────────────────────────────────

  const handleCTA = (e?: GestureResponderEvent) => {
    switch (publication.type) {
      case "community":
        router.push(`/community/${publication._id}`);
        break;
      case "sante": {
        const professionalId =
          meta?.professionalId || meta?.id || publication._id;
        router.push(`/sante/${professionalId}`);
        break;
      }
      case "transport":
        router.push(`/transport/${publication._id}`);
        break;
      case "restauration":
        router.push(`/restauration/${publication._id}`);
        break;
      case "hebergement":
        router.push(`/hebergement/${publication._id}`);
        break;
      case "agri":
        router.push(`/agri/${publication._id}`);
        break;
      case "network":
        router.push(`/network/${publication._id}`);
        break;
      case "voyages":
        router.push(`/voyages/${publication._id}`);
        break;
      default:
        onCTA();
        break;
    }
  };

  const handleCardClick = () => {
    switch (publication.type) {
      case "community":
        router.push(`/community/${publication._id}`);
        break;
      case "sante": {
        const professionalId =
          meta?.professionalId || meta?.id || publication._id;
        router.push(`/sante/${professionalId}`);
        break;
      }
      case "transport":
        router.push(`/transport/${publication._id}`);
        break;
      case "restauration":
        router.push(`/restauration/${publication._id}`);
        break;
      case "hebergement":
        router.push(`/hebergement/${publication._id}`);
        break;
      case "agri":
        router.push(`/agri/${publication._id}`);
        break;
      case "network":
        router.push(`/network/${publication._id}`);
        break;
      case "voyages":
        router.push(`/voyages/${publication._id}`);
        break;
      default:
        break;
    }
  };

  // ─── Rendu spécifique pour le transport ──────────────────────────────────

  const renderTransportContent = () => {
    const origin = meta?.origin ?? "";
    const destination = meta?.destination ?? "";
    const departureTime = meta?.departureTime ?? "";
    const price = meta?.pricePerSeat ? parseFloat(meta.pricePerSeat) : 0;
    const currency = meta?.currency ?? "FCFA";
    const seats = meta?.seatsAvailable ?? 0;
    const vehicleType = meta?.vehicleType ?? "";

    return (
      <View className="px-3 pb-3 space-y-1.5">
        {origin && destination && (
          <Text className="text-white font-semibold text-sm">
            {origin} <Text className="text-violet-400">→</Text> {destination}
          </Text>
        )}
        <View className="flex items-center gap-3 flex-wrap text-xs text-white/60">
          {departureTime && (
            <Text className="flex items-center gap-1">
              <Clock size={12} /> {departureTime}
            </Text>
          )}
          {vehicleType && (
            <Text className="flex items-center gap-1">
              <Car size={12} /> {vehicleType}
            </Text>
          )}
          {seats > 0 && (
            <Text className="flex items-center gap-1">
              <Users size={12} /> {seats} places
            </Text>
          )}
        </View>
        {price > 0 && (
          <Text className="text-violet-400 font-bold text-base">
            {price.toLocaleString()} {currency}
          </Text>
        )}
        <Pressable
          onPress={handleCTA}
          className="w-full py-1.5 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-violet-500 to-indigo-500"
        >
          <Text>Réserver</Text></Pressable>
      </View>
    );
  };

  // ─── Rendu spécifique pour la restauration ──────────────────────────────

  const renderRestaurantContent = () => {
    const name = title || "Restaurant";
    const cuisine = meta?.cuisine ?? "";
    const location = meta?.location ?? publication.location ?? "";
    const rating = meta?.rating ? parseFloat(meta.rating) : 0;
    const priceRange = meta?.priceRange ?? "";
    const deliveryTime = meta?.deliveryTime ?? "";
    const desc = description;

    return (
      <View className="px-3 pb-3 space-y-1.5">
        <View className="flex items-start justify-between gap-2">
          <View>
            <Text className="text-white font-semibold text-sm">{name}</Text>
            {cuisine && (
              <Text className="text-xs text-white/50 flex items-center gap-1">
                <UtensilsCrossed size={12} /> {cuisine}
              </Text>
            )}
          </View>
          {rating > 0 && (
            <View className="flex items-center gap-0.5 text-xs">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <Text className="text-white font-medium">
                {rating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>
        {location && (
          <View className="flex items-center gap-1 text-xs text-white/50">
            <MapPin size={12} className="text-white/30" />
            <Text className="truncate">{location}</Text>
          </View>
        )}
        <View className="flex items-center gap-3 flex-wrap text-xs text-white/60">
          {priceRange && <Text>{priceRange}</Text>}
          {deliveryTime && (
            <Text className="flex items-center gap-1">
              <Truck size={12} className="text-white/30" />
              {deliveryTime}
            </Text>
          )}
        </View>
        {desc && (
          <Text className="text-sm text-white/60 leading-relaxed">
            {desc}
          </Text>
        )}
        <Pressable
          onPress={handleCTA}
          className="w-full py-1.5 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-orange-500 to-red-500"
        >
          <Text>Voir le menu</Text></Pressable>
      </View>
    );
  };

  // ─── Rendu spécifique pour l'hébergement ────────────────────────────────

  const renderHebergementContent = () => {
    const hebergementTitle = title || "Logement";
    const type = meta?.type ?? "";
    const location = meta?.location ?? publication.location ?? "";
    const price = meta?.price ? parseFloat(meta.price) : 0;
    const currency = meta?.currency ?? "FCFA";
    const period = meta?.period ?? "nuit";
    const bedrooms = meta?.bedrooms ?? 0;
    const bathrooms = meta?.bathrooms ?? 0;
    const area = meta?.area ?? 0;
    const rating = meta?.rating ? parseFloat(meta.rating) : 0;
    const desc = description;
    const isAvailable = meta?.available !== false;

    return (
      <View className="px-3 pb-3 space-y-1.5">
        <View className="flex items-start justify-between gap-2">
          <View>
            <Text className="text-white font-semibold text-sm">
              {hebergementTitle}
            </Text>
            {type && (
              <Text className="text-xs text-white/50 flex items-center gap-1">
                <Home size={12} /> {type}
              </Text>
            )}
          </View>
          {rating > 0 && (
            <View className="flex items-center gap-0.5 text-xs">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <Text className="text-white font-medium">
                {rating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>
        {location && (
          <View className="flex items-center gap-1 text-xs text-white/50">
            <MapPin size={12} className="text-white/30" />
            <Text className="truncate">{location}</Text>
          </View>
        )}
        {price > 0 && (
          <Text className="text-emerald-400 font-bold text-base">
            {price.toLocaleString()} {currency} / {period}
          </Text>
        )}
        <View className="flex items-center gap-3 flex-wrap text-xs text-white/60">
          {bedrooms > 0 && (
            <Text className="flex items-center gap-1">
              <Bed size={12} className="text-white/30" /> {bedrooms} ch.
            </Text>
          )}
          {bathrooms > 0 && (
            <Text className="flex items-center gap-1">
              <Bath size={12} className="text-white/30" /> {bathrooms} sdb
            </Text>
          )}
          {area > 0 && (
            <Text className="flex items-center gap-1">
              <Square size={12} className="text-white/30" /> {area} m²
            </Text>
          )}
          {!isAvailable && (
            <Text className="text-rose-400 font-semibold">Indisponible</Text>
          )}
        </View>
        {desc && (
          <Text className="text-sm text-white/60 leading-relaxed">
            {desc}
          </Text>
        )}
        <Pressable
          onPress={handleCTA}
          className="w-full py-1.5 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500"
        >
          <Text>Voir le logement</Text></Pressable>
      </View>
    );
  };

  // ─── Rendu spécifique pour l'agriculture ──────────────────────────────────

  const renderAgriContent = () => {
    const agriTitle = title || "Produit agricole";
    const category = meta?.category ?? "";
    const subcategory = meta?.subcategory ?? "";
    const variety = meta?.variety ?? "";
    const quality = meta?.quality ?? "";
    const quantity = meta?.quantity ?? 0;
    const unit = meta?.unit ?? "kg";
    const price = meta?.price ? parseFloat(meta.price) : 0;
    const currency = meta?.currency ?? "FCFA";
    const priceUnit = meta?.priceUnit ?? "kg";
    const location = meta?.location ?? publication.location ?? "";
    const sellerName = meta?.sellerName ?? "";
    const sellerVerified = meta?.sellerVerified ?? false;
    const rating = meta?.rating ? parseFloat(meta.rating) : 0;
    const desc = description;

    const categoryLabels: Record<string, string> = {
      cereales: "🌾 Céréales",
      legumes: "🥬 Légumes",
      fruits: "🍎 Fruits",
      intrants: "🧪 Intrants",
      materiel: "🚜 Matériel",
      conseil: "🧑‍🌾 Conseil",
    };
    const categoryLabel = categoryLabels[category] || category;

    return (
      <View className="px-3 pb-3 space-y-1.5">
        <View className="flex items-start justify-between gap-2">
          <View>
            <Text className="text-white font-semibold text-sm">{agriTitle}</Text>
            {categoryLabel && (
              <Text className="text-xs text-white/50 flex items-center gap-1">
                <Leaf size={12} className="text-emerald-400" /> {categoryLabel}
              </Text>
            )}
            {variety && (
              <Text className="text-xs text-white/40 block">
                Variété : {variety}
              </Text>
            )}
          </View>
          {rating > 0 && (
            <View className="flex items-center gap-0.5 text-xs">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <Text className="text-white font-medium">
                {rating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        {sellerName && (
          <View className="flex items-center gap-1 text-xs text-white/50">
            <Text>Vendu par : {sellerName}</Text>
            {sellerVerified && (
              <Text className="text-emerald-400 text-[10px] font-bold">
                ✓ Vérifié
              </Text>
            )}
          </View>
        )}

        {location && (
          <View className="flex items-center gap-1 text-xs text-white/50">
            <MapPin size={12} className="text-white/30" />
            <Text className="truncate">{location}</Text>
          </View>
        )}

        {quantity > 0 && (
          <View className="flex items-center gap-1 text-xs text-white/60">
            <Package size={12} className="text-white/30" />
            <Text>
              Disponible : {quantity} {unit}
            </Text>
          </View>
        )}

        {price > 0 && (
          <View className="flex items-center gap-1 text-emerald-400 font-bold text-base">
            <Tag size={14} className="text-emerald-400" />
            <Text>
              {price.toLocaleString()} {currency}
            </Text>
            <Text className="text-xs text-white/40 font-normal">
              / {priceUnit}
            </Text>
          </View>
        )}

        {quality && (
          <View className="flex items-center gap-1 text-xs text-white/50">
            <Text>Qualité :</Text>
            <Text className="text-white/70 font-medium">{quality}</Text>
          </View>
        )}

        {desc && (
          <Text className="text-sm text-white/60 leading-relaxed">
            {desc}
          </Text>
        )}

        <Pressable
          onPress={handleCTA}
          className="w-full py-1.5 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-emerald-500 to-green-500"
        >
          <Text>Voir le produit</Text></Pressable>
      </View>
    );
  };

  // ─── Rendu spécifique pour le réseau (Network) ────────────────────────────

  const renderNetworkContent = () => {
    const networkTitle = title || "Profil professionnel";
    const headline = meta?.headline || "";
    const location = meta?.location || publication.location || "";
    const skills = meta?.skills || [];
    const experiences = meta?.experiences || [];
    const certifications = meta?.certifications || [];
    const rating = meta?.rating ? parseFloat(meta.rating) : 0;
    const desc = description;

    return (
      <View className="px-3 pb-3 space-y-2">
        <View className="flex items-start justify-between gap-2">
          <View>
            <Text className="text-white font-semibold text-sm">{networkTitle}</Text>
            {headline && (
              <Text className="text-xs text-indigo-300 font-medium">{headline}</Text>
            )}
          </View>
          {rating > 0 && (
            <View className="flex items-center gap-0.5 text-xs">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <Text className="text-white font-medium">
                {rating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        {location && (
          <View className="flex items-center gap-1 text-xs text-white/50">
            <MapPin size={12} className="text-white/30" />
            <Text className="truncate">{location}</Text>
          </View>
        )}

        {skills.length > 0 && (
          <View className="flex flex-wrap gap-1.5">
            {skills.slice(0, 3).map((skill: string) => (
              <Text
                key={skill}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/15"
              >
                {skill}
              </Text>
            ))}
            {skills.length > 3 && (
              <Text className="text-[10px] text-white/40">
                +{skills.length - 3}
              </Text>
            )}
          </View>
        )}

        {experiences.length > 0 && (
          <View className="space-y-1">
            {experiences.slice(0, 2).map((exp: any, idx: number) => (
              <View
                key={idx}
                className="flex items-center gap-1.5 text-xs text-white/50"
              >
                <Briefcase size={11} className="text-white/30" />
                <Text>
                  {exp.title} – {exp.company}
                </Text>
              </View>
            ))}
            {experiences.length > 2 && (
              <Text className="text-[10px] text-white/30">
                +{experiences.length - 2} autres expériences
              </Text>
            )}
          </View>
        )}

        {certifications.length > 0 && (
          <View className="flex items-center gap-1.5 text-xs text-white/50">
            <Award size={11} className="text-white/30" />
            <Text>{certifications.length} certification(s)</Text>
          </View>
        )}

        {desc && (
          <Text className="text-sm text-white/60 leading-relaxed">
            {desc}
          </Text>
        )}

        <Pressable
          onPress={handleCTA}
          className="w-full py-1.5 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-500"
        >
          <Text>Voir le profil</Text></Pressable>
      </View>
    );
  };

  // ─── Rendu spécifique pour les Voyages ────────────────────────────────────

  const renderVoyageContent = () => {
    const voyageTitle = title || "Voyage";
    const operator = meta?.operator || "";
    const transportType = meta?.transportType || "";
    const from = meta?.from || "";
    const to = meta?.to || "";
    const departure = meta?.departure || "";
    const arrival = meta?.arrival || "";
    const duration = meta?.duration || "";
    const price = meta?.price ? parseFloat(meta.price) : 0;
    const currency = meta?.currency ?? "FCFA";
    const availableSeats = meta?.availableSeats ?? 0;
    const totalSeats = meta?.totalSeats ?? 0;
    const amenities = meta?.amenities || [];
    const rating = meta?.rating ? parseFloat(meta.rating) : 0;
    const desc = description;

    // Calcul du taux d'occupation
    const occupancyRate =
      totalSeats > 0
        ? Math.round(((totalSeats - availableSeats) / totalSeats) * 100)
        : 0;

    // Couleur dynamique selon l'occupation
    const occupancyColor =
      occupancyRate > 80
        ? "text-rose-400"
        : occupancyRate > 50
          ? "text-amber-400"
          : "text-emerald-400";

    return (
      <View className="px-3 pb-3 space-y-2">
        {/* En-tête : itinéraire */}
        {from && to && (
          <View className="flex items-center justify-between">
            <View>
              <Text className="text-white font-bold text-sm">
                {from} <Text className="text-sky-400">✈</Text> {to}
              </Text>
              {operator && (
                <Text className="text-xs text-white/50 flex items-center gap-1">
                  <Plane size={12} className="text-white/30" /> {operator}
                </Text>
              )}
            </View>
            {rating > 0 && (
              <View className="flex items-center gap-0.5 text-xs">
                <Star size={12} className="fill-amber-400 text-amber-400" />
                <Text className="text-white font-medium">
                  {rating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Horaires */}
        <View className="flex items-center justify-between gap-2 text-xs text-white/60">
          {departure && (
            <View className="flex items-center gap-1">
              <Clock size={12} className="text-white/30" />
              <Text>Départ : {departure}</Text>
            </View>
          )}
          {arrival && (
            <View className="flex items-center gap-1">
              <Clock size={12} className="text-white/30" />
              <Text>Arrivée : {arrival}</Text>
            </View>
          )}
          {duration && (
            <View className="flex items-center gap-1">
              <Calendar size={12} className="text-white/30" />
              <Text>{duration}</Text>
            </View>
          )}
        </View>

        {/* Type de transport */}
        {transportType && (
          <View className="text-xs text-white/50">
            <Text className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
              {transportType}
            </Text>
          </View>
        )}

        {/* Prix et places */}
        <View className="flex items-center justify-between">
          {price > 0 && (
            <Text className="text-sky-400 font-bold text-base">
              {price.toLocaleString()} {currency}
            </Text>
          )}
          {totalSeats > 0 && (
            <View className="flex items-center gap-2">
              <Text className="text-xs text-white/40">
                {availableSeats}/{totalSeats} places
              </Text>
              <View className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{ width: `${occupancyRate}%`, backgroundColor: occupancyRate > 80
                                          ? "#f43f5e"
                                          : occupancyRate > 50
                                            ? "#f59e0b"
                                            : "#10b981" }}
                />
              </View>
            </View>
          )}
        </View>

        {/* Équipements */}
        {amenities.length > 0 && (
          <View className="flex flex-wrap gap-1.5">
            {amenities.slice(0, 4).map((a: string) => (
              <Text
                key={a}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-white/50 border border-white/10"
              >
                {a}
              </Text>
            ))}
            {amenities.length > 4 && (
              <Text className="text-[10px] text-white/30">
                +{amenities.length - 4}
              </Text>
            )}
          </View>
        )}

        {/* Description courte */}
        {desc && (
          <Text className="text-sm text-white/60 leading-relaxed">
            {desc}
          </Text>
        )}

        {/* Bouton Voir le voyage */}
        <Pressable
          onPress={handleCTA}
          className="w-full py-1.5 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-sky-500 to-blue-500"
        >
          <Text>Voir le voyage</Text></Pressable>
      </View>
    );
  };

  // ─── Rendu générique ──────────────────────────────────────────────────────

  const renderGenericContent = () => (
    <>
      {title && (
        <Text className="px-3 pb-1 text-sm font-bold text-white leading-snug">
          {title}
        </Text>
      )}
      {description && (
        <Text className="px-3 pb-2 text-sm text-white/70 leading-relaxed">
          {description}
        </Text>
      )}
      {tags.length > 0 && (
        <View className="px-3 pb-2 flex gap-1.5 flex-wrap">
          {tags.map((tag) => (
            <Text
              key={tag}
              className="text-[10px] font-semibold text-purple-400"
            >
              #{tag}
            </Text>
          ))}
        </View>
      )}
    </>
  );

  // ─── Rendu principal ──────────────────────────────────────────────────────

  return (
    <Pressable
      onPress={handleCardClick}
      className="rounded-3xl overflow-hidden"
      style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
    >
      <PublicationHeader
        publication={publication}
        type={publication.type as PublicationType}
        emoji={emoji}
        onDelete={onDelete}
        isMine={publication.isMine}
        formatTime={formatTime}
      />

      {/* Galerie d'images (si présentes) */}
      {images.length > 0 && (
        <PublicationGallery images={images} fit="contain" />
      )}

      {/* Contenu spécifique selon le type */}
      {publication.type === "transport" && renderTransportContent()}
      {publication.type === "restauration" && renderRestaurantContent()}
      {publication.type === "hebergement" && renderHebergementContent()}
      {publication.type === "agri" && renderAgriContent()}
      {publication.type === "network" && renderNetworkContent()}
      {publication.type === "voyages" && renderVoyageContent()}
      {publication.type !== "transport" &&
        publication.type !== "restauration" &&
        publication.type !== "hebergement" &&
        publication.type !== "agri" &&
        publication.type !== "network" &&
        publication.type !== "voyages" &&
        renderGenericContent()}

      {/* Sondage (poll) */}
      {postType === "poll" && pollOptions.length > 0 && (
        <View className="px-3 pb-3">
          <PublicationPoll
            options={pollOptions}
            votedId={pollVoted}
            totalVotes={totalVotes}
            onVote={onVote}
          />
        </View>
      )}

      {/* Actions et CTA en bas */}
      <View className="px-3 py-2.5 border-t border-white/5">
        <View className="flex items-center justify-between">
          <View className="flex items-center gap-1">
            <PublicationActions
              publication={publication}
              actions={config.actions}
              onAction={onAction}
            />
            {actionsSlot}
          </View>
          <PublicationCTA cta={config.cta} onPress={handleCTA} />
        </View>
      </View>
    </Pressable>
  );
}
