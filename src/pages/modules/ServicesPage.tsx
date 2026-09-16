import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useMutation, useQuery } from "convex/react";
import { Authenticated, Unauthenticated } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";
import { SignInButton } from "@/components/ui/signin.tsx";
import {
  ArrowLeft,
  BookOpen,
  Camera,
  CheckCircle,
  ChevronRight,
  Clock3,
  Heart,
  MapPin,
  MessageCircle,
  Music,
  Phone,
  Plus,
  Search,
  Scissors,
  ShieldCheck,
  Smile,
  Star,
  Truck,
  Wrench,
  X,
  Zap,
} from "lucide-react-native";

type ServiceCat =
  | "Tout"
  | "Dépannage"
  | "Beauté"
  | "Livraison"
  | "Éducation"
  | "Photo"
  | "Bien-être"
  | "Événementiel";

type Provider = Doc<"serviceProviders">;

const CATEGORIES: readonly ServiceCat[] = [
  "Tout",
  "Dépannage",
  "Beauté",
  "Livraison",
  "Éducation",
  "Photo",
  "Bien-être",
  "Événementiel",
];

const CATEGORY_ICONS: Record<ServiceCat, typeof Wrench> = {
  Tout: Wrench,
  Dépannage: Zap,
  Beauté: Scissors,
  Livraison: Truck,
  Éducation: BookOpen,
  Photo: Camera,
  "Bien-être": Heart,
  Événementiel: Music,
};

const PAGE_SIZE = 20;

function normalizeSearch(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function safeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function formatReviews(value: unknown): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "0";
  }

  return Math.max(0, Math.floor(value)).toLocaleString("fr-FR");
}

function formatRating(value: unknown): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }

  return Math.min(5, Math.max(0, value)).toFixed(1);
}

function ProviderAvatar({ name }: { name: string }) {
  const initials = safeText(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initials || "SP"}</Text>
    </View>
  );
}

function EmptyResults({
  hasSearch,
  urgentOnly,
  onReset,
}: {
  hasSearch: boolean;
  urgentOnly: boolean;
  onReset: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Smile size={34} color="rgba(255,255,255,0.32)" />
      </View>

      <Text style={styles.emptyTitle}>Aucun service trouvé</Text>

      <Text style={styles.emptyDescription}>
        {hasSearch || urgentOnly
          ? "Aucun prestataire ne correspond aux critères sélectionnés."
          : "Aucun prestataire n'est actuellement disponible."}
      </Text>

      {(hasSearch || urgentOnly) && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Réinitialiser les filtres"
          onPress={onReset}
          style={({ pressed }) => [
            styles.resetButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.resetButtonText}>Réinitialiser les filtres</Text>
        </Pressable>
      )}
    </View>
  );
}

function ServiceCard({
  provider,
  onPress,
}: {
  provider: Provider;
  onPress: () => void;
}) {
  const name = safeText(provider.name) || "Prestataire";
  const specialty = safeText(provider.specialty);
  const location = safeText(provider.location);
  const price = safeText(provider.price);
  const responseTime = safeText(provider.responseTime);
  const rating = formatRating(provider.rating);
  const reviews = formatReviews(provider.reviewCount);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir le service ${name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardImageContainer}>
        {provider.imageUrl ? (
          <Image
            source={{ uri: provider.imageUrl }}
            style={styles.cardImage}
            resizeMode="cover"
            accessibilityLabel={name}
          />
        ) : (
          <View style={styles.cardImageFallback}>
            <Wrench size={42} color="rgba(255,255,255,0.20)" />
          </View>
        )}

        <View style={styles.imageGradientOverlay} />

        {provider.urgent && (
          <View style={styles.urgentBadge}>
            <Zap size={12} color="#FCA5A5" />
            <Text style={styles.urgentText}>24h/24</Text>
          </View>
        )}

        {provider.verified && (
          <View style={styles.verifiedBadge}>
            <ShieldCheck size={13} color="#86EFAC" />
            <Text style={styles.verifiedText}>Vérifié</Text>
          </View>
        )}

        {!provider.available && (
          <View style={styles.unavailableOverlay}>
            <View style={styles.unavailableBadge}>
              <Text style={styles.unavailableText}>Indisponible</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.providerRow}>
          <ProviderAvatar name={name} />

          <View style={styles.providerIdentity}>
            <View style={styles.nameRow}>
              <Text numberOfLines={1} style={styles.providerName}>
                {name}
              </Text>

              {provider.verified && <CheckCircle size={14} color="#4ADE80" />}
            </View>

            {specialty ? (
              <Text numberOfLines={1} style={styles.specialty}>
                {specialty}
              </Text>
            ) : null}

            {location ? (
              <View style={styles.locationRow}>
                <MapPin size={12} color="rgba(255,255,255,0.42)" />

                <Text numberOfLines={1} style={styles.locationText}>
                  {location}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.ratingContainer}>
            <Star size={13} color="#FBBF24" fill="#FBBF24" />

            <Text style={styles.ratingText}>{rating}</Text>
          </View>
        </View>

        <View style={styles.cardMeta}>
          {price ? (
            <Text style={styles.priceText}>{price}</Text>
          ) : (
            <Text style={styles.priceUnavailable}>Tarif sur demande</Text>
          )}

          {responseTime ? (
            <View style={styles.responseContainer}>
              <Clock3 size={12} color="rgba(255,255,255,0.35)" />

              <Text style={styles.responseText}>{responseTime}</Text>
            </View>
          ) : null}

          <Text style={styles.reviewCount}>{reviews} avis</Text>

          <ChevronRight size={16} color="rgba(255,255,255,0.30)" />
        </View>
      </View>
    </Pressable>
  );
}

function LoadingCard() {
  return (
    <View style={styles.card}>
      <View style={styles.skeletonImage} />

      <View style={styles.skeletonBody}>
        <View style={styles.skeletonRow}>
          <View style={styles.skeletonAvatar} />

          <View style={styles.skeletonIdentity}>
            <View style={styles.skeletonLineLarge} />
            <View style={styles.skeletonLineSmall} />
          </View>
        </View>

        <View style={styles.skeletonLineMedium} />
      </View>
    </View>
  );
}

export default function ServicesPage({ onBack }: { onBack: () => void }) {
  const [filter, setFilter] = useState<ServiceCat>("Tout");

  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState<Provider | null>(null);

  const [urgentOnly, setUrgentOnly] = useState(false);

  const [showRequest, setShowRequest] = useState(false);

  const [bookingModal, setBookingModal] = useState(false);

  const [bookingMessage, setBookingMessage] = useState("");

  const [bookingDate, setBookingDate] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  /*
   * IMPORTANT :
   * Aucun seed automatique.
   *
   * Les données affichées doivent provenir de Convex.
   * Cette page ne crée pas artificiellement des prestataires.
   */
  const categoryArg = filter === "Tout" ? undefined : filter;

  const providers = useQuery(api.serviceProviders.list, {
    category: categoryArg,
  });

  const bookProvider = useMutation(api.serviceProviders.book);

  const normalizedSearch = useMemo(() => normalizeSearch(search), [search]);

  const filteredProviders = useMemo(() => {
    if (!providers) {
      return undefined;
    }

    return providers.filter((provider) => {
      if (urgentOnly && !provider.urgent) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = normalizeSearch(
        [
          safeText(provider.name),
          safeText(provider.specialty),
          safeText(provider.location),
          safeText(provider.description),
          ...(Array.isArray(provider.skills) ? provider.skills : []),
        ].join(" "),
      );

      return searchableText.includes(normalizedSearch);
    });
  }, [providers, urgentOnly, normalizedSearch]);

  const resetFilters = useCallback(() => {
    setSearch("");
    setUrgentOnly(false);
    setFilter("Tout");
  }, []);

  const openProvider = useCallback((provider: Provider) => {
    setSelected(provider);
  }, []);

  const closeProvider = useCallback(() => {
    setSelected(null);
  }, []);

  const openBooking = useCallback(() => {
    if (!selected) {
      return;
    }

    setBookingModal(true);
  }, [selected]);

  const closeBooking = useCallback(() => {
    if (isSubmitting) {
      return;
    }

    setBookingModal(false);
    setBookingMessage("");
    setBookingDate("");
  }, [isSubmitting]);

  const handleBook = useCallback(async () => {
    if (!selected) {
      return;
    }

    const message = bookingMessage.trim();

    if (!message) {
      return;
    }

    if (message.length < 5) {
      return;
    }

    if (message.length > 2000) {
      return;
    }

    const scheduledAt = bookingDate.trim();

    if (scheduledAt.length > 100) {
      return;
    }

    setIsSubmitting(true);

    try {
      await bookProvider({
        providerId: selected._id,
        message,
        scheduledAt: scheduledAt || undefined,
      });

      setBookingModal(false);
      setSelected(null);
      setBookingMessage("");
      setBookingDate("");
    } catch {
      /*
       * Le backend reste la source de vérité.
       * L'interface ne prétend pas que la réservation
       * a réussi si Convex la refuse.
       */
    } finally {
      setIsSubmitting(false);
    }
  }, [selected, bookingMessage, bookingDate, bookProvider]);

  const selectCategory = useCallback((category: ServiceCat) => {
    setFilter(category);
  }, []);

  const openRequest = useCallback(() => {
    setShowRequest(true);
  }, []);

  const closeRequest = useCallback(() => {
    setShowRequest(false);
  }, []);

  const resultCount = filteredProviders?.length ?? 0;

  return (
    <View style={styles.screen}>
      {/* ───────────────── HEADER ───────────────── */}

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            onPress={onBack}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </Pressable>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Services</Text>

            <Text style={styles.headerSubtitle}>
              {providers === undefined
                ? "Recherche de prestataires…"
                : `${resultCount} prestataire${
                    resultCount > 1 ? "s" : ""
                  } disponible${resultCount > 1 ? "s" : ""}`}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Explorer les catégories"
            onPress={openRequest}
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.pressed,
            ]}
          >
            <Plus size={19} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* ───────────────── SEARCH ───────────────── */}

        <View style={styles.searchBox}>
          <Search size={17} color="rgba(255,255,255,0.40)" />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Service, spécialité, lieu…"
            placeholderTextColor="rgba(255,255,255,0.30)"
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />

          {search.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Effacer la recherche"
              onPress={() => setSearch("")}
              hitSlop={8}
              style={({ pressed }) => [
                styles.clearSearch,
                pressed && styles.pressed,
              ]}
            >
              <X size={15} color="rgba(255,255,255,0.55)" />
            </Pressable>
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              urgentOnly
                ? "Désactiver le filtre urgent"
                : "Afficher uniquement les services urgents"
            }
            accessibilityState={{
              selected: urgentOnly,
            }}
            onPress={() => setUrgentOnly((value) => !value)}
            style={({ pressed }) => [
              styles.urgentFilter,
              urgentOnly && styles.urgentFilterActive,
              pressed && styles.pressed,
            ]}
          >
            <Zap
              size={13}
              color={urgentOnly ? "#FCA5A5" : "rgba(255,255,255,0.55)"}
            />

            <Text
              style={[
                styles.urgentFilterText,
                urgentOnly && styles.urgentFilterTextActive,
              ]}
            >
              Urgent
            </Text>
          </Pressable>
        </View>

        {/* ───────────────── CATEGORIES ───────────────── */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContent}
        >
          {CATEGORIES.map((category) => {
            const Icon = CATEGORY_ICONS[category];

            const active = filter === category;

            return (
              <Pressable
                key={category}
                accessibilityRole="button"
                accessibilityLabel={`Filtrer par ${category}`}
                accessibilityState={{
                  selected: active,
                }}
                onPress={() => selectCategory(category)}
                style={({ pressed }) => [
                  styles.categoryChip,
                  active && styles.categoryChipActive,
                  pressed && styles.pressed,
                ]}
              >
                <Icon
                  size={14}
                  color={active ? "#FFFFFF" : "rgba(255,255,255,0.55)"}
                />

                <Text
                  style={[
                    styles.categoryText,
                    active && styles.categoryTextActive,
                  ]}
                >
                  {category}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ───────────────── LIST ───────────────── */}

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredProviders === undefined ? (
          <>
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
          </>
        ) : filteredProviders.length === 0 ? (
          <EmptyResults
            hasSearch={normalizedSearch.length > 0}
            urgentOnly={urgentOnly}
            onReset={resetFilters}
          />
        ) : (
          filteredProviders
            .slice(0, PAGE_SIZE)
            .map((provider) => (
              <ServiceCard
                key={provider._id}
                provider={provider}
                onPress={() => openProvider(provider)}
              />
            ))
        )}

        {filteredProviders && filteredProviders.length > PAGE_SIZE && (
          <View style={styles.limitNotice}>
            <Text style={styles.limitNoticeText}>
              Affichage des {PAGE_SIZE} premiers résultats. La pagination
              serveur devra être activée pour exposer davantage de prestataires.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ───────────────── PROVIDER DETAIL ───────────────── */}

      {selected && (
        <View style={styles.fullScreenOverlay}>
          <View style={styles.detailScreen}>
            <View style={styles.detailHero}>
              {selected.imageUrl ? (
                <Image
                  source={{
                    uri: selected.imageUrl,
                  }}
                  style={styles.detailImage}
                  resizeMode="cover"
                  accessibilityLabel={safeText(selected.name)}
                />
              ) : (
                <View style={styles.detailImageFallback}>
                  <Wrench size={56} color="rgba(255,255,255,0.20)" />
                </View>
              )}

              <View style={styles.detailImageOverlay} />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fermer le service"
                onPress={closeProvider}
                style={({ pressed }) => [
                  styles.detailClose,
                  pressed && styles.pressed,
                ]}
              >
                <X size={21} color="#FFFFFF" />
              </Pressable>

              <View style={styles.detailHeroContent}>
                <View style={styles.detailBadges}>
                  {selected.urgent && (
                    <View style={styles.detailUrgent}>
                      <Zap size={12} color="#FCA5A5" />
                      <Text style={styles.detailUrgentText}>
                        Urgence 24h/24
                      </Text>
                    </View>
                  )}

                  {selected.verified && (
                    <View style={styles.detailVerified}>
                      <CheckCircle size={12} color="#86EFAC" />
                      <Text style={styles.detailVerifiedText}>Vérifié</Text>
                    </View>
                  )}
                </View>

                <Text numberOfLines={2} style={styles.detailProviderName}>
                  {safeText(selected.name) || "Prestataire"}
                </Text>

                {safeText(selected.specialty) ? (
                  <Text style={styles.detailSpecialty}>
                    {selected.specialty}
                  </Text>
                ) : null}
              </View>
            </View>

            <ScrollView
              style={styles.detailScroll}
              contentContainerStyle={styles.detailContent}
              showsVerticalScrollIndicator={false}
            >
              {/* DESCRIPTION */}

              {safeText(selected.description) ? (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>À propos</Text>

                  <Text style={styles.descriptionText}>
                    {selected.description}
                  </Text>
                </View>
              ) : null}

              {/* STATS */}

              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Star size={17} color="#FBBF24" fill="#FBBF24" />

                  <Text style={styles.statValue}>
                    {formatRating(selected.rating)}
                  </Text>

                  <Text style={styles.statLabel}>Note</Text>
                </View>

                <View style={styles.statCard}>
                  <MessageCircle size={17} color="#60A5FA" />

                  <Text style={styles.statValue}>
                    {formatReviews(selected.reviewCount)}
                  </Text>

                  <Text style={styles.statLabel}>Avis</Text>
                </View>

                <View style={styles.statCard}>
                  <Clock3 size={17} color="#A78BFA" />

                  <Text numberOfLines={1} style={styles.statValueSmall}>
                    {safeText(selected.responseTime) || "—"}
                  </Text>

                  <Text style={styles.statLabel}>Réponse</Text>
                </View>
              </View>

              {/* PRICE */}

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Tarification</Text>

                <View style={styles.pricePanel}>
                  <Text style={styles.priceLabel}>Tarif annoncé</Text>

                  <Text style={styles.detailPrice}>
                    {safeText(selected.price) || "Sur demande"}
                  </Text>
                </View>
              </View>

              {/* SKILLS */}

              {selected.skills.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Compétences</Text>

                  <View style={styles.skills}>
                    {selected.skills.map((skill) => (
                      <View key={skill} style={styles.skillChip}>
                        <Text style={styles.skillText}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* LOCATION */}

              {safeText(selected.location) ? (
                <View style={styles.locationPanel}>
                  <MapPin size={18} color="#FB923C" />

                  <View style={styles.locationContent}>
                    <Text style={styles.locationTitle}>
                      Zone d'intervention
                    </Text>

                    <Text style={styles.locationValue}>
                      {selected.location}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* AVAILABILITY */}

              <View style={styles.availabilityPanel}>
                <View
                  style={[
                    styles.availabilityDot,
                    selected.available
                      ? styles.availableDot
                      : styles.offlineDot,
                  ]}
                />

                <View style={styles.availabilityContent}>
                  <Text style={styles.availabilityTitle}>
                    {selected.available
                      ? "Disponible actuellement"
                      : "Indisponible actuellement"}
                  </Text>

                  <Text style={styles.availabilityDescription}>
                    {selected.available
                      ? "Vous pouvez envoyer une demande de réservation."
                      : "Le prestataire n'accepte actuellement pas de nouvelles demandes."}
                  </Text>
                </View>
              </View>

              {/* ACTIONS */}

              <View style={styles.actionsSection}>
                <Authenticated>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Réserver ce prestataire"
                    disabled={!selected.available}
                    onPress={openBooking}
                    style={({ pressed }) => [
                      styles.primaryAction,
                      !selected.available && styles.disabledAction,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Phone size={17} color="#FFFFFF" />

                    <Text style={styles.primaryActionText}>
                      {selected.available ? "Réserver" : "Indisponible"}
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Contacter le prestataire"
                    onPress={() => {
                      if (!selected.userId) {
                        return;
                      }
                    }}
                    style={({ pressed }) => [
                      styles.secondaryAction,
                      pressed && styles.pressed,
                    ]}
                  >
                    <MessageCircle size={17} color="#FFFFFF" />

                    <Text style={styles.secondaryActionText}>Message</Text>
                  </Pressable>
                </Authenticated>

                <Unauthenticated>
                  <View style={styles.authRequired}>
                    <Text style={styles.authRequiredText}>
                      Connectez-vous pour réserver un service.
                    </Text>

                    <SignInButton />
                  </View>
                </Unauthenticated>
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* ───────────────── BOOKING ───────────────── */}

      {bookingModal && selected && (
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fermer la réservation"
            onPress={closeBooking}
            style={styles.modalBackdrop}
          />

          <View style={styles.bookingSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderText}>
                <Text style={styles.sheetTitle}>Réserver un service</Text>

                <Text numberOfLines={1} style={styles.sheetSubtitle}>
                  {safeText(selected.name)}
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fermer"
                onPress={closeBooking}
                disabled={isSubmitting}
                style={({ pressed }) => [
                  styles.sheetClose,
                  pressed && styles.pressed,
                ]}
              >
                <X size={18} color="rgba(255,255,255,0.70)" />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Décrivez votre besoin</Text>

            <TextInput
              value={bookingMessage}
              onChangeText={setBookingMessage}
              placeholder="Expliquez clairement ce dont vous avez besoin…"
              placeholderTextColor="rgba(255,255,255,0.30)"
              multiline
              maxLength={2000}
              textAlignVertical="top"
              style={[
                styles.messageInput,
                isSubmitting && styles.disabledInput,
              ]}
              editable={!isSubmitting}
            />

            <View style={styles.characterCount}>
              <Text style={styles.characterCountText}>
                {bookingMessage.length}
                /2000
              </Text>
            </View>

            <Text style={styles.inputLabel}>
              Date souhaitée
              <Text style={styles.optionalText}> (optionnel)</Text>
            </Text>

            <TextInput
              value={bookingDate}
              onChangeText={setBookingDate}
              placeholder="Ex. demain à 14h"
              placeholderTextColor="rgba(255,255,255,0.30)"
              maxLength={100}
              style={[styles.dateInput, isSubmitting && styles.disabledInput]}
              editable={!isSubmitting}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Envoyer la demande de réservation"
              disabled={isSubmitting || bookingMessage.trim().length < 5}
              onPress={() => {
                void handleBook();
              }}
              style={({ pressed }) => [
                styles.confirmButton,
                (isSubmitting || bookingMessage.trim().length < 5) &&
                  styles.confirmButtonDisabled,
                pressed && styles.pressed,
              ]}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />

                  <Text style={styles.confirmButtonText}>Envoi en cours…</Text>
                </>
              ) : (
                <Text style={styles.confirmButtonText}>Envoyer la demande</Text>
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Annuler"
              disabled={isSubmitting}
              onPress={closeBooking}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ───────────────── CATEGORY EXPLORER ───────────────── */}

      {showRequest && (
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fermer les catégories"
            onPress={closeRequest}
            style={styles.modalBackdrop}
          />

          <View style={styles.categorySheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderText}>
                <Text style={styles.sheetTitle}>Explorer les services</Text>

                <Text style={styles.sheetSubtitle}>
                  Choisissez une catégorie
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fermer"
                onPress={closeRequest}
                style={({ pressed }) => [
                  styles.sheetClose,
                  pressed && styles.pressed,
                ]}
              >
                <X size={18} color="rgba(255,255,255,0.70)" />
              </Pressable>
            </View>

            <View style={styles.categoryGrid}>
              {CATEGORIES.filter((category) => category !== "Tout").map(
                (category) => {
                  const Icon = CATEGORY_ICONS[category];

                  return (
                    <Pressable
                      key={category}
                      accessibilityRole="button"
                      accessibilityLabel={`Voir les services ${category}`}
                      onPress={() => {
                        selectCategory(category);
                        closeRequest();
                      }}
                      style={({ pressed }) => [
                        styles.categoryTile,
                        pressed && styles.pressed,
                      ]}
                    >
                      <View style={styles.categoryTileIcon}>
                        <Icon size={21} color="#FB923C" />
                      </View>

                      <Text style={styles.categoryTileText}>{category}</Text>

                      <ChevronRight size={15} color="rgba(255,255,255,0.25)" />
                    </Pressable>
                  );
                },
              )}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Annuler"
              onPress={closeRequest}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.cancelButtonText}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#050812",
  },

  header: {
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#070B16",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },

  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  headerTitleContainer: {
    flex: 1,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.4,
  },

  headerSubtitle: {
    marginTop: 2,
    color: "rgba(255,255,255,0.42)",
    fontSize: 11,
  },

  addButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4F46E5",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.35)",
  },

  searchBox: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  searchInput: {
    flex: 1,
    minHeight: 46,
    marginHorizontal: 9,
    color: "#FFFFFF",
    fontSize: 13,
  },

  clearSearch: {
    padding: 5,
    marginRight: 5,
  },

  urgentFilter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  urgentFilterActive: {
    backgroundColor: "rgba(239,68,68,0.20)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.28)",
  },

  urgentFilterText: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 11,
    fontWeight: "700",
  },

  urgentFilterTextActive: {
    color: "#FCA5A5",
  },

  categoryContent: {
    gap: 8,
    paddingTop: 12,
    paddingRight: 16,
  },

  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  categoryChipActive: {
    backgroundColor: "rgba(249,115,22,0.22)",
    borderColor: "rgba(251,146,60,0.34)",
  },

  categoryText: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 11,
    fontWeight: "700",
  },

  categoryTextActive: {
    color: "#FFFFFF",
  },

  list: {
    flex: 1,
  },

  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },

  card: {
    overflow: "hidden",
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  cardPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.995 }],
  },

  cardImageContainer: {
    height: 178,
    position: "relative",
    overflow: "hidden",
  },

  cardImage: {
    width: "100%",
    height: "100%",
  },

  cardImageFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.025)",
  },

  imageGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  urgentBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(127,29,29,0.78)",
    borderWidth: 1,
    borderColor: "rgba(252,165,165,0.22)",
  },

  urgentText: {
    color: "#FECACA",
    fontSize: 10,
    fontWeight: "800",
  },

  verifiedBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(20,83,45,0.78)",
    borderWidth: 1,
    borderColor: "rgba(134,239,172,0.20)",
  },

  verifiedText: {
    color: "#BBF7D0",
    fontSize: 10,
    fontWeight: "800",
  },

  unavailableOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.48)",
  },

  unavailableBadge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(127,29,29,0.85)",
  },

  unavailableText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  cardBody: {
    padding: 14,
  },

  providerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  avatar: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(79,70,229,0.22)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.18)",
  },

  avatarText: {
    color: "#C7D2FE",
    fontSize: 13,
    fontWeight: "900",
  },

  providerIdentity: {
    flex: 1,
    minWidth: 0,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  providerName: {
    flexShrink: 1,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  specialty: {
    marginTop: 3,
    color: "#FB923C",
    fontSize: 11,
    fontWeight: "600",
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },

  locationText: {
    flex: 1,
    color: "rgba(255,255,255,0.42)",
    fontSize: 10,
  },

  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  ratingText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 13,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },

  priceText: {
    color: "#FB923C",
    fontSize: 13,
    fontWeight: "900",
  },

  priceUnavailable: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 11,
    fontWeight: "600",
  },

  responseContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: 12,
  },

  responseText: {
    color: "rgba(255,255,255,0.43)",
    fontSize: 10,
  },

  reviewCount: {
    marginLeft: "auto",
    color: "rgba(255,255,255,0.35)",
    fontSize: 10,
  },

  skeletonImage: {
    height: 178,
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  skeletonBody: {
    padding: 14,
  },

  skeletonRow: {
    flexDirection: "row",
    gap: 10,
  },

  skeletonAvatar: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  skeletonIdentity: {
    flex: 1,
    gap: 8,
  },

  skeletonLineLarge: {
    width: "68%",
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  skeletonLineSmall: {
    width: "42%",
    height: 9,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  skeletonLineMedium: {
    width: "55%",
    height: 10,
    marginTop: 16,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 80,
  },

  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    marginBottom: 16,
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },

  emptyDescription: {
    maxWidth: 340,
    marginTop: 7,
    color: "rgba(255,255,255,0.42)",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
  },

  resetButton: {
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(79,70,229,0.18)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.22)",
  },

  resetButtonText: {
    color: "#C7D2FE",
    fontSize: 12,
    fontWeight: "800",
  },

  limitNotice: {
    padding: 13,
    borderRadius: 14,
    backgroundColor: "rgba(251,146,60,0.07)",
    borderWidth: 1,
    borderColor: "rgba(251,146,60,0.12)",
  },

  limitNoticeText: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
  },

  fullScreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    backgroundColor: "#050812",
  },

  detailScreen: {
    flex: 1,
    backgroundColor: "#050812",
  },

  detailHero: {
    height: 290,
    position: "relative",
  },

  detailImage: {
    width: "100%",
    height: "100%",
  },

  detailImageFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.025)",
  },

  detailImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.43)",
  },

  detailClose: {
    position: "absolute",
    top: 18,
    left: 16,
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.50)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
  },

  detailHeroContent: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 20,
  },

  detailBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 9,
  },

  detailUrgent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: "rgba(127,29,29,0.78)",
  },

  detailUrgentText: {
    color: "#FECACA",
    fontSize: 10,
    fontWeight: "800",
  },

  detailVerified: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: "rgba(20,83,45,0.78)",
  },

  detailVerifiedText: {
    color: "#BBF7D0",
    fontSize: 10,
    fontWeight: "800",
  },

  detailProviderName: {
    color: "#FFFFFF",
    fontSize: 26,
    lineHeight: 31,
    fontWeight: "900",
    letterSpacing: -0.6,
  },

  detailSpecialty: {
    marginTop: 5,
    color: "#FB923C",
    fontSize: 13,
    fontWeight: "700",
  },

  detailScroll: {
    flex: 1,
  },

  detailContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 15,
  },

  detailSection: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  detailSectionTitle: {
    marginBottom: 10,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  descriptionText: {
    color: "rgba(255,255,255,0.63)",
    fontSize: 13,
    lineHeight: 21,
  },

  statsGrid: {
    flexDirection: "row",
    gap: 9,
  },

  statCard: {
    flex: 1,
    minHeight: 92,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  statValue: {
    marginTop: 7,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  statValueSmall: {
    maxWidth: "90%",
    marginTop: 7,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  statLabel: {
    marginTop: 2,
    color: "rgba(255,255,255,0.38)",
    fontSize: 10,
  },

  pricePanel: {
    padding: 14,
    borderRadius: 15,
    backgroundColor: "rgba(249,115,22,0.08)",
    borderWidth: 1,
    borderColor: "rgba(251,146,60,0.13)",
  },

  priceLabel: {
    color: "rgba(255,255,255,0.40)",
    fontSize: 10,
  },

  detailPrice: {
    marginTop: 5,
    color: "#FB923C",
    fontSize: 20,
    fontWeight: "900",
  },

  skills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  skillChip: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  skillText: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 11,
    fontWeight: "600",
  },

  locationPanel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 15,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  locationContent: {
    flex: 1,
  },

  locationTitle: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 10,
    fontWeight: "700",
  },

  locationValue: {
    marginTop: 3,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  availabilityPanel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 15,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  availabilityDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },

  availableDot: {
    backgroundColor: "#4ADE80",
  },

  offlineDot: {
    backgroundColor: "#64748B",
  },

  availabilityContent: {
    flex: 1,
  },

  availabilityTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  availabilityDescription: {
    marginTop: 3,
    color: "rgba(255,255,255,0.40)",
    fontSize: 10,
    lineHeight: 16,
  },

  actionsSection: {
    gap: 10,
  },

  primaryAction: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    backgroundColor: "#4F46E5",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.30)",
  },

  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  secondaryAction: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  secondaryActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  disabledAction: {
    opacity: 0.45,
  },

  authRequired: {
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  authRequiredText: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 11,
    textAlign: "center",
  },

  modalRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: "flex-end",
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.72)",
  },

  bookingSheet: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 26,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#0C111C",
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  categorySheet: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 26,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#0C111C",
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  sheetHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    marginBottom: 18,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  sheetHeaderText: {
    flex: 1,
  },

  sheetTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  sheetSubtitle: {
    marginTop: 4,
    color: "rgba(255,255,255,0.42)",
    fontSize: 11,
  },

  sheetClose: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  inputLabel: {
    marginBottom: 7,
    color: "rgba(255,255,255,0.62)",
    fontSize: 11,
    fontWeight: "700",
  },

  optionalText: {
    color: "rgba(255,255,255,0.30)",
    fontWeight: "500",
  },

  messageInput: {
    minHeight: 120,
    padding: 13,
    borderRadius: 15,
    color: "#FFFFFF",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    fontSize: 13,
    lineHeight: 20,
  },

  characterCount: {
    alignItems: "flex-end",
    marginTop: 4,
    marginBottom: 14,
  },

  characterCountText: {
    color: "rgba(255,255,255,0.28)",
    fontSize: 9,
  },

  dateInput: {
    minHeight: 48,
    paddingHorizontal: 13,
    marginBottom: 16,
    borderRadius: 15,
    color: "#FFFFFF",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    fontSize: 13,
  },

  disabledInput: {
    opacity: 0.55,
  },

  confirmButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderRadius: 16,
    backgroundColor: "#4F46E5",
  },

  confirmButtonDisabled: {
    opacity: 0.42,
  },

  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  cancelButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 9,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  cancelButtonText: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 12,
    fontWeight: "700",
  },

  categoryGrid: {
    gap: 9,
    marginBottom: 8,
  },

  categoryTile: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  categoryTileIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "rgba(249,115,22,0.10)",
  },

  categoryTileText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  pressed: {
    opacity: 0.72,
  },
});
