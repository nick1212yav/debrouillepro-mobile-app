import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  ArrowLeft,
  Bell,
  BellOff,
  BookOpen,
  Check,
  ChevronRight,
  Layers,
  Lock,
  PlayCircle,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react-native";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { useConvexAuth } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import { Authenticated, Unauthenticated } from "@/lib/convex-auth-compat";

type Props = {
  onBack: () => void;
};

type Tab = "discover" | "mine";

type CategoryDefinition = {
  name: string;
  color: string;
};

const CATEGORIES: CategoryDefinition[] = [
  { name: "Agriculture", color: "#22C55E" },
  { name: "Business", color: "#F97316" },
  { name: "Éducation", color: "#6366F1" },
  { name: "Santé", color: "#EF4444" },
  { name: "Tech", color: "#3B82F6" },
  { name: "Voyage", color: "#14B8A6" },
  { name: "Cuisine", color: "#F59E0B" },
  { name: "Autre", color: "#8B5CF6" },
];

const DEFAULT_CATEGORY = "Éducation";

function categoryColor(category: string): string {
  return CATEGORIES.find((item) => item.name === category)?.color ?? "#8B5CF6";
}

function formatCount(value: number): string {
  if (value < 1000) {
    return String(value);
  }

  if (value < 1_000_000) {
    return `${(value / 1000).toFixed(value >= 10_000 ? 0 : 1)}k`;
  }

  return `${(value / 1_000_000).toFixed(1)}M`;
}

function getInitial(name?: string | null): string {
  const value = name?.trim();

  if (!value) {
    return "?";
  }

  return value.charAt(0).toUpperCase();
}

function LoadingCard() {
  return (
    <View style={styles.loadingCard}>
      <View style={styles.loadingIcon} />

      <View style={styles.loadingContent}>
        <View style={styles.loadingLineWide} />
        <View style={styles.loadingLineMedium} />
        <View style={styles.loadingLineShort} />
      </View>
    </View>
  );
}

function CreateSeriesModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: Id<"series">) => void;
}) {
  const createSeries = useMutation(api.series.createSeries);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    title.trim().length >= 2 && description.trim().length >= 2 && !submitting;

  const submit = async () => {
    if (!canSubmit) {
      return;
    }

    const normalizedTags = Array.from(
      new Set(
        tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
          .slice(0, 20),
      ),
    );

    setSubmitting(true);

    try {
      const id = await createSeries({
        title: title.trim(),
        description: description.trim(),
        category,
        tags: normalizedTags,
      });

      onCreated(id);
    } catch (error) {
      console.error("[SERIES] createSeries failed", error);

      Alert.alert(
        "Création impossible",
        "La série n'a pas pu être créée. Vérifie ta connexion et réessaie.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.modalLayer}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fermer"
        onPress={onClose}
        style={styles.modalBackdrop}
      />

      <View style={styles.modalCard}>
        <View style={styles.modalHeader}>
          <View style={styles.modalTitleContainer}>
            <View style={styles.modalIcon}>
              <BookOpen size={18} color="#A78BFA" />
            </View>

            <View style={styles.modalTitleText}>
              <Text style={styles.modalTitle}>Nouvelle série</Text>

              <Text style={styles.modalSubtitle}>
                Crée un parcours de contenu structuré.
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fermer la création"
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.pressed,
            ]}
          >
            <X size={18} color="#94A3B8" />
          </Pressable>
        </View>

        <Text style={styles.fieldLabel}>Titre</Text>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Titre de la série"
          placeholderTextColor="#64748B"
          maxLength={120}
          style={styles.input}
          autoCapitalize="sentences"
          returnKeyType="next"
        />

        <Text style={styles.fieldLabel}>Description</Text>

        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Décris le contenu de cette série..."
          placeholderTextColor="#64748B"
          maxLength={500}
          multiline
          textAlignVertical="top"
          style={[styles.input, styles.descriptionInput]}
        />

        <Text style={styles.fieldLabel}>Catégorie</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((item) => {
            const selected = category === item.name;
            const color = item.color;

            return (
              <Pressable
                key={item.name}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setCategory(item.name)}
                style={({ pressed }) => [
                  styles.categoryButton,
                  selected && {
                    backgroundColor: `${color}20`,
                    borderColor: `${color}60`,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.categoryText, selected && { color }]}>
                  {item.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.fieldLabel}>Tags</Text>

        <TextInput
          value={tags}
          onChangeText={setTags}
          placeholder="Ex. débutant, business, pratique"
          placeholderTextColor="#64748B"
          maxLength={300}
          style={styles.input}
          autoCapitalize="none"
        />

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSubmit }}
          disabled={!canSubmit}
          onPress={submit}
          style={({ pressed }) => [
            styles.createButton,
            !canSubmit && styles.createButtonDisabled,
            pressed && canSubmit && styles.pressed,
          ]}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Plus size={17} color="#FFFFFF" />
          )}

          <Text style={styles.createButtonText}>
            {submitting ? "Création..." : "Créer la série"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function SeriesDetail({
  seriesId,
  onBack,
}: {
  seriesId: Id<"series">;
  onBack: () => void;
}) {
  const data = useQuery(api.series.getSeriesById, { seriesId });

  const toggleSubscription = useMutation(api.series.toggleSubscription);

  const updateProgress = useMutation(api.series.updateProgress);

  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  const [progressLoading, setProgressLoading] = useState<number | null>(null);

  if (data === undefined) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.detailContent}
      >
        <LoadingCard />
        <LoadingCard />
        <LoadingCard />
      </ScrollView>
    );
  }

  if (data === null) {
    return (
      <View style={styles.centerState}>
        <View style={styles.emptyIcon}>
          <BookOpen size={26} color="#64748B" />
        </View>

        <Text style={styles.emptyTitle}>Série introuvable</Text>

        <Text style={styles.emptyText}>
          Cette série n'est plus disponible ou n'existe pas.
        </Text>

        <Pressable
          onPress={onBack}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.pressed,
          ]}
        >
          <ArrowLeft size={15} color="#FFFFFF" />
          <Text style={styles.secondaryButtonText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  const color = categoryColor(data.category);
  const progress = data.progress;

  const completedCount = progress?.completedEpisodes?.length ?? 0;

  const episodeCount = data.episodeCount ?? data.episodes.length;

  const percentage =
    episodeCount > 0
      ? Math.min(100, Math.round((completedCount / episodeCount) * 100))
      : 0;

  const handleToggleSubscription = async () => {
    if (subscriptionLoading) {
      return;
    }

    setSubscriptionLoading(true);

    try {
      await toggleSubscription({ seriesId });
    } catch (error) {
      console.error("[SERIES] toggleSubscription failed", error);

      Alert.alert(
        "Action impossible",
        "Impossible de modifier ton abonnement pour le moment.",
      );
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleEpisodePress = async (episodeNumber: number) => {
    if (progressLoading !== null) {
      return;
    }

    setProgressLoading(episodeNumber);

    try {
      await updateProgress({
        seriesId,
        episodeNumber,
      });
    } catch (error) {
      console.error("[SERIES] updateProgress failed", error);

      Alert.alert(
        "Progression non enregistrée",
        "Impossible de mettre à jour ta progression.",
      );
    } finally {
      setProgressLoading(null);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.detailContent}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={onBack}
          style={({ pressed }) => [styles.backRow, pressed && styles.pressed]}
        >
          <ArrowLeft size={17} color="#CBD5E1" />
          <Text style={styles.backText}>Retour</Text>
        </Pressable>

        <View style={[styles.heroCard, { borderColor: `${color}30` }]}>
          <View style={[styles.heroGlow, { backgroundColor: `${color}14` }]} />

          <View style={styles.heroContent}>
            <View style={styles.metaRow}>
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: `${color}18` },
                ]}
              >
                <Text style={[styles.categoryBadgeText, { color }]}>
                  {data.category}
                </Text>
              </View>

              <Text style={styles.metaText}>
                {episodeCount} épisode
                {episodeCount > 1 ? "s" : ""}
              </Text>

              <Text style={styles.metaSeparator}>•</Text>

              <Text style={styles.metaText}>
                {formatCount(data.subscriberCount)} abonné
                {data.subscriberCount > 1 ? "s" : ""}
              </Text>
            </View>

            <Text style={styles.detailTitle}>{data.title}</Text>

            <Text style={styles.detailDescription}>{data.description}</Text>

            {data.creator && (
              <View style={styles.creatorRow}>
                <View
                  style={[
                    styles.creatorAvatar,
                    {
                      backgroundColor: `${color}22`,
                    },
                  ]}
                >
                  <Text style={[styles.creatorInitial, { color }]}>
                    {getInitial(data.creator.name)}
                  </Text>
                </View>

                <Text style={styles.creatorName}>
                  {data.creator.name ?? "Anonyme"}
                </Text>
              </View>
            )}

            {progress !== null && progress !== undefined && (
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Ta progression</Text>

                  <Text style={[styles.progressPercentage, { color }]}>
                    {percentage}%
                  </Text>
                </View>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${percentage}%`,
                        backgroundColor: color,
                      },
                    ]}
                  />
                </View>

                <Text style={styles.progressDetails}>
                  {completedCount} / {episodeCount} épisode
                  {episodeCount > 1 ? "s" : ""} terminé
                  {completedCount > 1 ? "s" : ""}
                </Text>
              </View>
            )}

            <Authenticated>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{
                  disabled: subscriptionLoading,
                }}
                disabled={subscriptionLoading}
                onPress={handleToggleSubscription}
                style={({ pressed }) => [
                  styles.subscriptionButton,
                  data.subscribedByMe
                    ? styles.subscriptionButtonActive
                    : {
                        backgroundColor: color,
                        borderColor: color,
                      },
                  pressed && styles.pressed,
                ]}
              >
                {subscriptionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : data.subscribedByMe ? (
                  <BellOff size={15} color="#E2E8F0" />
                ) : (
                  <Bell size={15} color="#FFFFFF" />
                )}

                <Text
                  style={[
                    styles.subscriptionButtonText,
                    data.subscribedByMe && styles.subscriptionButtonTextActive,
                  ]}
                >
                  {subscriptionLoading
                    ? "Mise à jour..."
                    : data.subscribedByMe
                      ? "Abonné"
                      : "S'abonner"}
                </Text>
              </Pressable>
            </Authenticated>
          </View>
        </View>

        <View style={styles.episodesHeader}>
          <View>
            <Text style={styles.episodesTitle}>Épisodes</Text>

            <Text style={styles.episodesSubtitle}>
              {episodeCount} contenu
              {episodeCount > 1 ? "s" : ""} dans cette série
            </Text>
          </View>

          <Layers size={18} color="#64748B" />
        </View>

        {data.episodes.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <BookOpen size={24} color="#64748B" />
            </View>

            <Text style={styles.emptyTitle}>Aucun épisode</Text>

            <Text style={styles.emptyText}>
              Le créateur n'a pas encore publié d'épisode.
            </Text>
          </View>
        ) : (
          <View style={styles.episodeList}>
            {data.episodes.map((episode) => {
              const completed =
                progress?.completedEpisodes?.includes(episode.episodeNumber) ??
                false;

              const processing = progressLoading === episode.episodeNumber;

              return (
                <Pressable
                  key={episode._id}
                  accessibilityRole="button"
                  accessibilityState={{
                    disabled: processing,
                  }}
                  disabled={processing}
                  onPress={() => handleEpisodePress(episode.episodeNumber)}
                  style={({ pressed }) => [
                    styles.episodeCard,
                    completed && {
                      backgroundColor: `${color}0D`,
                      borderColor: `${color}25`,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <View
                    style={[
                      styles.episodeIcon,
                      {
                        backgroundColor: completed
                          ? `${color}20`
                          : "rgba(255,255,255,0.055)",
                      },
                    ]}
                  >
                    {processing ? (
                      <ActivityIndicator size="small" color={color} />
                    ) : completed ? (
                      <Check size={15} color={color} />
                    ) : (
                      <PlayCircle size={17} color="#64748B" />
                    )}
                  </View>

                  <View style={styles.episodeContent}>
                    <View style={styles.episodeTitleRow}>
                      <Text style={styles.episodeNumber}>
                        ÉP. {episode.episodeNumber}
                      </Text>

                      {completed && (
                        <View
                          style={[
                            styles.completedBadge,
                            {
                              backgroundColor: `${color}18`,
                            },
                          ]}
                        >
                          <Text style={[styles.completedText, { color }]}>
                            Terminé
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.episodeTitle} numberOfLines={2}>
                      {episode.title}
                    </Text>

                    {episode.publication?.description ? (
                      <Text style={styles.episodeDescription} numberOfLines={2}>
                        {episode.publication.description}
                      </Text>
                    ) : null}
                  </View>

                  <ChevronRight size={16} color="#475569" />
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

type SeriesCardData = {
  _id: Id<"series">;
  title: string;
  description: string;
  category: string;
  episodeCount: number;
  subscriberCount: number;
  status: "active" | "completed" | "draft";
  creator: {
    name?: string;
    avatar?: string;
  } | null;
  subscribedByMe: boolean;
};

function SeriesCard({
  series,
  onPress,
}: {
  series: SeriesCardData;
  onPress: () => void;
}) {
  const color = categoryColor(series.category);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir la série ${series.title}`}
      onPress={onPress}
      style={({ pressed }) => [styles.seriesCard, pressed && styles.pressed]}
    >
      <View
        style={[
          styles.seriesIcon,
          {
            backgroundColor: `${color}14`,
          },
        ]}
      >
        <BookOpen size={20} color={color} />
      </View>

      <View style={styles.seriesContent}>
        <View style={styles.seriesMetaRow}>
          <View
            style={[
              styles.smallCategoryBadge,
              {
                backgroundColor: `${color}18`,
              },
            ]}
          >
            <Text style={[styles.smallCategoryText, { color }]}>
              {series.category}
            </Text>
          </View>

          {series.status === "completed" && (
            <Text style={styles.completedSeriesText}>Terminée</Text>
          )}
        </View>

        <Text style={styles.seriesTitle} numberOfLines={2}>
          {series.title}
        </Text>

        <Text style={styles.seriesDescription} numberOfLines={2}>
          {series.description}
        </Text>

        <View style={styles.seriesStats}>
          <View style={styles.statItem}>
            <Layers size={11} color="#475569" />

            <Text style={styles.statText}>
              {series.episodeCount} épisode
              {series.episodeCount > 1 ? "s" : ""}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Users size={11} color="#475569" />

            <Text style={styles.statText}>
              {formatCount(series.subscriberCount)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.seriesRight}>
        {series.subscribedByMe && <Bell size={13} color={color} />}

        <ChevronRight size={16} color="#475569" />
      </View>
    </Pressable>
  );
}

export default function SeriesPlaylistPage({ onBack }: Props) {
  const { isAuthenticated } = useConvexAuth();

  const [activeTab, setActiveTab] = useState<Tab>("discover");

  const [selectedId, setSelectedId] = useState<Id<"series"> | null>(null);

  const [showCreate, setShowCreate] = useState(false);

  const [search, setSearch] = useState("");

  const {
    results: allSeries,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.series.listSeries,
    {
      status: "active",
    },
    {
      initialNumItems: 20,
    },
  );

  const {
    results: mySubscriptions,
    status: myStatus,
    loadMore: loadMoreMine,
  } = usePaginatedQuery(
    api.series.getMySubscriptions,
    isAuthenticated ? {} : "skip",
    {
      initialNumItems: 20,
    },
  );

  const filteredSeries = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return allSeries;
    }

    return allSeries.filter((series) => {
      return (
        series.title.toLowerCase().includes(query) ||
        series.category.toLowerCase().includes(query) ||
        series.description.toLowerCase().includes(query)
      );
    });
  }, [allSeries, search]);

  if (selectedId !== null) {
    return (
      <View style={styles.screen}>
        <SeriesDetail
          seriesId={selectedId}
          onBack={() => setSelectedId(null)}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <ArrowLeft size={18} color="#FFFFFF" />
        </Pressable>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Séries & Playlists</Text>

          <Text style={styles.headerSubtitle}>
            Des parcours de contenu structurés
          </Text>
        </View>

        <Authenticated>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Créer une série"
            onPress={() => setShowCreate(true)}
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.pressed,
            ]}
          >
            <Plus size={18} color="#FFFFFF" />
          </Pressable>
        </Authenticated>
      </View>

      <View style={styles.searchContainer}>
        <Search size={16} color="#64748B" />

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher une série..."
          placeholderTextColor="#64748B"
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="never"
          accessibilityLabel="Rechercher une série"
        />

        {search.length > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Effacer la recherche"
            onPress={() => setSearch("")}
            style={styles.clearSearch}
          >
            <X size={15} color="#64748B" />
          </Pressable>
        )}
      </View>

      <View style={styles.tabsContainer}>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{
            selected: activeTab === "discover",
          }}
          onPress={() => setActiveTab("discover")}
          style={({ pressed }) => [
            styles.tab,
            activeTab === "discover" && styles.tabActive,
            pressed && styles.pressed,
          ]}
        >
          <BookOpen
            size={14}
            color={activeTab === "discover" ? "#FFFFFF" : "#64748B"}
          />

          <Text
            style={[
              styles.tabText,
              activeTab === "discover" && styles.tabTextActive,
            ]}
          >
            Découvrir
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="tab"
          accessibilityState={{
            selected: activeTab === "mine",
          }}
          onPress={() => setActiveTab("mine")}
          style={({ pressed }) => [
            styles.tab,
            activeTab === "mine" && styles.tabActive,
            pressed && styles.pressed,
          ]}
        >
          <Bell
            size={14}
            color={activeTab === "mine" ? "#FFFFFF" : "#64748B"}
          />

          <Text
            style={[
              styles.tabText,
              activeTab === "mine" && styles.tabTextActive,
            ]}
          >
            Mes abonnements
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === "discover" && (
          <>
            {status === "LoadingFirstPage" ? (
              <View style={styles.stack}>
                <LoadingCard />
                <LoadingCard />
                <LoadingCard />
                <LoadingCard />
              </View>
            ) : filteredSeries.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Search size={24} color="#64748B" />
                </View>

                <Text style={styles.emptyTitle}>Aucune série trouvée</Text>

                <Text style={styles.emptyText}>
                  {search.trim()
                    ? "Aucun contenu ne correspond à ta recherche."
                    : "Aucune série publiée n'est disponible pour le moment."}
                </Text>

                {search.trim().length > 0 ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setSearch("")}
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <X size={15} color="#FFFFFF" />

                    <Text style={styles.secondaryButtonText}>
                      Effacer la recherche
                    </Text>
                  </Pressable>
                ) : (
                  <Authenticated>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setShowCreate(true)}
                      style={({ pressed }) => [
                        styles.primarySmallButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Plus size={15} color="#FFFFFF" />

                      <Text style={styles.primarySmallButtonText}>
                        Créer une série
                      </Text>
                    </Pressable>
                  </Authenticated>
                )}
              </View>
            ) : (
              <View style={styles.stack}>
                {filteredSeries.map((series) => (
                  <SeriesCard
                    key={series._id}
                    series={series}
                    onPress={() => setSelectedId(series._id)}
                  />
                ))}

                {status === "CanLoadMore" && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Charger davantage de séries"
                    onPress={() => loadMore(20)}
                    style={({ pressed }) => [
                      styles.loadMoreButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.loadMoreText}>Charger davantage</Text>

                    <ChevronRight size={15} color="#64748B" />
                  </Pressable>
                )}

                {status === "LoadingMore" && (
                  <View style={styles.loadingMore}>
                    <ActivityIndicator size="small" color="#818CF8" />

                    <Text style={styles.loadingMoreText}>Chargement...</Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {activeTab === "mine" && (
          <>
            <Unauthenticated>
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Lock size={24} color="#64748B" />
                </View>

                <Text style={styles.emptyTitle}>Connexion requise</Text>

                <Text style={styles.emptyText}>
                  Connecte-toi pour retrouver les séries auxquelles tu es
                  abonné.
                </Text>
              </View>
            </Unauthenticated>

            <Authenticated>
              {myStatus === "LoadingFirstPage" ? (
                <View style={styles.stack}>
                  <LoadingCard />
                  <LoadingCard />
                  <LoadingCard />
                </View>
              ) : mySubscriptions.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <Bell size={24} color="#64748B" />
                  </View>

                  <Text style={styles.emptyTitle}>Aucun abonnement</Text>

                  <Text style={styles.emptyText}>
                    Abonne-toi à une série pour la retrouver automatiquement
                    ici.
                  </Text>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setActiveTab("discover")}
                    style={({ pressed }) => [
                      styles.primarySmallButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <BookOpen size={15} color="#FFFFFF" />

                    <Text style={styles.primarySmallButtonText}>Découvrir</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.stack}>
                  {mySubscriptions.map((series) => (
                    <SeriesCard
                      key={series._id}
                      series={series}
                      onPress={() => setSelectedId(series._id)}
                    />
                  ))}

                  {myStatus === "CanLoadMore" && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Charger davantage d'abonnements"
                      onPress={() => loadMoreMine(20)}
                      style={({ pressed }) => [
                        styles.loadMoreButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.loadMoreText}>Charger davantage</Text>

                      <ChevronRight size={15} color="#64748B" />
                    </Pressable>
                  )}

                  {myStatus === "LoadingMore" && (
                    <View style={styles.loadingMore}>
                      <ActivityIndicator size="small" color="#818CF8" />

                      <Text style={styles.loadingMoreText}>Chargement...</Text>
                    </View>
                  )}
                </View>
              )}
            </Authenticated>
          </>
        )}
      </ScrollView>

      {showCreate && (
        <CreateSeriesModal
          onClose={() => setShowCreate(false)}
          onCreated={(id) => {
            setShowCreate(false);
            setSelectedId(id);
          }}
        />
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 48,
    paddingBottom: 14,
    gap: 11,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  headerContent: {
    flex: 1,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.4,
  },

  headerSubtitle: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 3,
  },

  addButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4F46E5",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.4)",
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 46,
    marginHorizontal: 18,
    marginBottom: 11,
    paddingHorizontal: 13,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 12,
    marginLeft: 9,
    paddingVertical: 10,
  },

  clearSearch: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  tabsContainer: {
    flexDirection: "row",
    marginHorizontal: 18,
    marginBottom: 12,
    padding: 4,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  tab: {
    flex: 1,
    minHeight: 39,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 10,
  },

  tabActive: {
    backgroundColor: "rgba(255,255,255,0.095)",
  },

  tabText: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
  },

  tabTextActive: {
    color: "#FFFFFF",
  },

  scroll: {
    flex: 1,
  },

  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 36,
  },

  stack: {
    gap: 9,
  },

  seriesCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  seriesIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },

  seriesContent: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },

  seriesMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 5,
  },

  smallCategoryBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },

  smallCategoryText: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  completedSeriesText: {
    color: "#34D399",
    fontSize: 9,
    fontWeight: "700",
  },

  seriesTitle: {
    color: "#F8FAFC",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
  },

  seriesDescription: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },

  seriesStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginTop: 8,
  },

  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  statText: {
    color: "#475569",
    fontSize: 9,
    fontWeight: "600",
  },

  seriesRight: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginLeft: 8,
  },

  loadingCard: {
    minHeight: 90,
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  loadingIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  loadingContent: {
    flex: 1,
    marginLeft: 12,
    gap: 8,
  },

  loadingLineWide: {
    width: "65%",
    height: 9,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  loadingLineMedium: {
    width: "80%",
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  loadingLineShort: {
    width: "35%",
    height: 6,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  emptyState: {
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 48,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    marginBottom: 12,
  },

  emptyTitle: {
    color: "#E2E8F0",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },

  emptyText: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 6,
  },

  primarySmallButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    minHeight: 40,
    paddingHorizontal: 15,
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: "#4F46E5",
  },

  primarySmallButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    minHeight: 40,
    paddingHorizontal: 15,
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  secondaryButtonText: {
    color: "#E2E8F0",
    fontSize: 11,
    fontWeight: "700",
  },

  loadMoreButton: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  loadMoreText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "700",
  },

  loadingMore: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  loadingMoreText: {
    color: "#64748B",
    fontSize: 10,
  },

  modalLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    zIndex: 100,
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.78)",
  },

  modalCard: {
    maxHeight: "92%",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: "#0A0F1F",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.22)",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  modalTitleContainer: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
  },

  modalIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.10)",
  },

  modalTitleText: {
    flex: 1,
  },

  modalTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  modalSubtitle: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  closeButton: {
    width: 35,
    height: 35,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  fieldLabel: {
    color: "#CBD5E1",
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 7,
    marginTop: 4,
  },

  input: {
    minHeight: 46,
    paddingHorizontal: 13,
    paddingVertical: 10,
    color: "#FFFFFF",
    fontSize: 12,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    marginBottom: 11,
  },

  descriptionInput: {
    minHeight: 92,
    textAlignVertical: "top",
  },

  categoryScroll: {
    gap: 7,
    paddingBottom: 4,
    marginBottom: 10,
  },

  categoryButton: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  categoryText: {
    color: "#94A3B8",
    fontSize: 9,
    fontWeight: "700",
  },

  createButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 5,
    borderRadius: 14,
    backgroundColor: "#4F46E5",
    borderWidth: 1,
    borderColor: "#6366F1",
  },

  createButtonDisabled: {
    opacity: 0.45,
  },

  createButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  detailContent: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },

  backRow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 8,
    marginBottom: 8,
  },

  backText: {
    color: "#CBD5E1",
    fontSize: 11,
    fontWeight: "700",
  },

  heroCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    marginBottom: 22,
  },

  heroGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    right: -70,
    top: -70,
    borderRadius: 90,
  },

  heroContent: {
    padding: 18,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
  },

  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },

  categoryBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },

  metaText: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "600",
  },

  metaSeparator: {
    color: "#334155",
    fontSize: 10,
  },

  detailTitle: {
    color: "#FFFFFF",
    fontSize: 23,
    lineHeight: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginTop: 11,
  },

  detailDescription: {
    color: "#94A3B8",
    fontSize: 11,
    lineHeight: 18,
    marginTop: 7,
  },

  creatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
  },

  creatorAvatar: {
    width: 27,
    height: 27,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  creatorInitial: {
    fontSize: 11,
    fontWeight: "900",
  },

  creatorName: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "600",
  },

  progressSection: {
    marginTop: 18,
  },

  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 7,
  },

  progressLabel: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "700",
  },

  progressPercentage: {
    fontSize: 10,
    fontWeight: "900",
  },

  progressTrack: {
    height: 6,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
  },

  progressDetails: {
    color: "#475569",
    fontSize: 8,
    marginTop: 5,
  },

  subscriptionButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 17,
    paddingHorizontal: 15,
    borderRadius: 13,
    borderWidth: 1,
  },

  subscriptionButtonActive: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderColor: "rgba(255,255,255,0.12)",
  },

  subscriptionButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  subscriptionButtonTextActive: {
    color: "#CBD5E1",
  },

  episodesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  episodesTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  episodesSubtitle: {
    color: "#475569",
    fontSize: 9,
    marginTop: 3,
  },

  episodeList: {
    gap: 8,
  },

  episodeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  episodeIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  episodeContent: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 10,
  },

  episodeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  episodeNumber: {
    color: "#475569",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  completedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },

  completedText: {
    fontSize: 7,
    fontWeight: "900",
  },

  episodeTitle: {
    color: "#E2E8F0",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    marginTop: 4,
  },

  episodeDescription: {
    color: "#475569",
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    backgroundColor: "#050812",
  },

  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },
});
