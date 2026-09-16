// src/pages/modules/EvenementsPage.tsx

import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Filter,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react-native";

import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from "@/lib/convex-auth-compat";

import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";

import { EventCard } from "@/features/events/components";
import { adaptEvent } from "@/features/events/adapter";
import { CATEGORY_LABELS } from "@/features/events/types";

import type { EventCategory } from "@/features/events/types";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface Props {
  onBack: () => void;
}

type CategoryFilter = EventCategory | "tout";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const PAGE_LIMIT = 50;

const CATEGORY_ACCENT = "rgba(139,92,246,0.9)";

/* -------------------------------------------------------------------------- */
/* Category helpers                                                           */
/* -------------------------------------------------------------------------- */

function getCategoryLabel(category: CategoryFilter): string {
  if (category === "tout") {
    return "Tous";
  }

  return CATEGORY_LABELS[category] ?? category;
}

/* -------------------------------------------------------------------------- */
/* Header                                                                     */
/* -------------------------------------------------------------------------- */

function PageHeader({
  onBack,
  eventCount,
  onFilter,
  filterActive,
}: {
  onBack: () => void;
  eventCount: number;
  onFilter: () => void;
  filterActive: boolean;
}) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Retour"
        style={({ pressed }) => [
          styles.headerButton,
          pressed && styles.pressed,
        ]}
      >
        <ArrowLeft size={19} color="#FFFFFF" />
      </Pressable>

      <View style={styles.headerTitleArea}>
        <View style={styles.titleRow}>
          <CalendarDays size={17} color="#A78BFA" />

          <Text style={styles.headerTitle} numberOfLines={1}>
            Événements
          </Text>
        </View>

        <Text style={styles.headerSubtitle} numberOfLines={1}>
          {eventCount === 1
            ? "1 événement disponible"
            : `${eventCount} événements disponibles`}
        </Text>
      </View>

      <Pressable
        onPress={onFilter}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={
          filterActive ? "Fermer les filtres" : "Ouvrir les filtres"
        }
        accessibilityState={{
          expanded: filterActive,
        }}
        style={({ pressed }) => [
          styles.filterButton,
          filterActive && styles.filterButtonActive,
          pressed && styles.pressed,
        ]}
      >
        {filterActive ? (
          <X size={18} color="#C4B5FD" />
        ) : (
          <SlidersHorizontal size={18} color="rgba(255,255,255,0.65)" />
        )}
      </Pressable>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Filter panel                                                               */
/* -------------------------------------------------------------------------- */

function FilterPanel({
  category,
  categories,
  onSelect,
}: {
  category: CategoryFilter;
  categories: Array<{
    key: CategoryFilter;
    label: string;
  }>;
  onSelect: (value: CategoryFilter) => void;
}) {
  return (
    <View style={styles.filterPanel}>
      <View style={styles.filterPanelHeader}>
        <View style={styles.filterPanelTitleRow}>
          <Filter size={15} color="#A78BFA" />

          <Text style={styles.filterPanelTitle}>Filtrer par catégorie</Text>
        </View>

        {category !== "tout" ? (
          <Pressable onPress={() => onSelect("tout")} hitSlop={8}>
            <Text style={styles.resetText}>Réinitialiser</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
      >
        {categories.map((item) => {
          const active = category === item.key;

          return (
            <Pressable
              key={item.key}
              onPress={() => onSelect(item.key)}
              accessibilityRole="button"
              accessibilityState={{
                selected: active,
              }}
              style={({ pressed }) => [
                styles.categoryChip,
                active && styles.categoryChipActive,
                pressed && styles.categoryChipPressed,
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  active && styles.categoryTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty state                                                                */
/* -------------------------------------------------------------------------- */

function EmptyEvents({
  category,
  onReset,
}: {
  category: CategoryFilter;
  onReset: () => void;
}) {
  const filtered = category !== "tout";

  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <CalendarDays size={29} color="rgba(255,255,255,0.3)" />
      </View>

      <Text style={styles.emptyTitle}>
        {filtered ? "Aucun événement trouvé" : "Aucun événement disponible"}
      </Text>

      <Text style={styles.emptyDescription}>
        {filtered
          ? `Aucun événement enregistré dans la catégorie « ${getCategoryLabel(category)} ».`
          : "Les événements publiés apparaîtront ici dès qu'ils seront disponibles."}
      </Text>

      {filtered ? (
        <Pressable
          onPress={onReset}
          style={({ pressed }) => [
            styles.emptyButton,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
        >
          <RefreshCw size={15} color="#FFFFFF" />

          <Text style={styles.emptyButtonText}>Voir toutes les catégories</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Error state                                                                */
/* -------------------------------------------------------------------------- */

function EventsError({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <View
        style={[
          styles.emptyIcon,
          {
            backgroundColor: "rgba(239,68,68,0.08)",
            borderColor: "rgba(239,68,68,0.16)",
          },
        ]}
      >
        <AlertCircle size={29} color="#F87171" />
      </View>

      <Text style={styles.emptyTitle}>
        Impossible de charger les événements
      </Text>

      <Text style={styles.emptyDescription}>
        Une erreur est survenue pendant la récupération des données. Aucune
        information fictive n'est affichée.
      </Text>

      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Réessayer"
      >
        <RefreshCw size={15} color="#FFFFFF" />

        <Text style={styles.emptyButtonText}>Réessayer</Text>
      </Pressable>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Loading                                                                    */
/* -------------------------------------------------------------------------- */

function EventListSkeleton() {
  return (
    <View style={styles.screen}>
      <View style={styles.loadingHeader}>
        <Skeleton className="h-10 w-10 rounded-2xl" />

        <View style={styles.loadingHeaderText}>
          <Skeleton className="h-5 w-32 rounded-lg" />

          <Skeleton className="h-3 w-40 rounded-lg" />
        </View>

        <Skeleton className="h-10 w-10 rounded-2xl" />
      </View>

      <ScrollView
        contentContainerStyle={styles.loadingContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.loadingSection}>
          <Skeleton className="h-4 w-28 rounded-lg" />

          <View style={styles.loadingChips}>
            <Skeleton className="h-9 w-20 rounded-xl" />
            <Skeleton className="h-9 w-28 rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-xl" />
          </View>
        </View>

        {Array.from({ length: 4 }).map((_, index) => (
          <View key={index} style={styles.loadingCard}>
            <Skeleton className="h-48 w-full rounded-3xl" />

            <Skeleton className="h-5 w-4/5 rounded-lg" />

            <Skeleton className="h-4 w-2/5 rounded-lg" />

            <Skeleton className="h-4 w-3/5 rounded-lg" />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Auth loading                                                               */
/* -------------------------------------------------------------------------- */

function EventsAuthLoading() {
  return (
    <View style={styles.authLoading}>
      <ActivityIndicator size="small" color="#A78BFA" />

      <Text style={styles.authLoadingText}>Vérification de la session…</Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Authentication boundary                                                    */
/* -------------------------------------------------------------------------- */

function AuthenticatedEvents({ children }: { children: React.ReactNode }) {
  return <Authenticated>{children}</Authenticated>;
}

/* -------------------------------------------------------------------------- */
/* Main                                                                       */
/* -------------------------------------------------------------------------- */

export default function EvenementsPage({ onBack }: Props) {
  const [category, setCategory] = useState<CategoryFilter>("tout");

  const [showFilters, setShowFilters] = useState(false);

  /*
   * La clé force uniquement le remount du contenu
   * local en cas de retry visuel.
   *
   * La source de données reste Convex.
   */
  const [retryKey, setRetryKey] = useState(0);

  const eventsData = useQuery(api.events.list, {
    category: category === "tout" ? undefined : category,
    limit: PAGE_LIMIT,
  });

  /*
   * Adaptation unique des données backend.
   *
   * Aucun fallback fictif n'est injecté.
   */
  const events = useMemo(() => {
    if (!eventsData) {
      return [];
    }

    return eventsData.map((rawEvent) => adaptEvent(rawEvent));
  }, [eventsData, retryKey]);

  /*
   * Les catégories proviennent du contrat
   * métier existant.
   */
  const categories = useMemo(
    () => [
      {
        key: "tout" as const,
        label: "Tous",
      },
      ...Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
        key: key as EventCategory,
        label,
      })),
    ],
    [],
  );

  const handleCategory = (value: CategoryFilter) => {
    setCategory(value);
  };

  const handleRetry = () => {
    /*
     * Convex réactualisera automatiquement
     * ses données selon son cycle réactif.
     */
    setRetryKey((previous) => previous + 1);
  };

  const filterActive = showFilters || category !== "tout";

  return (
    <View style={styles.screen}>
      {/* Décor léger — aucune donnée */}
      <View pointerEvents="none" style={styles.glowTop} />

      <PageHeader
        onBack={onBack}
        eventCount={events.length}
        onFilter={() => setShowFilters((previous) => !previous)}
        filterActive={filterActive}
      />

      {showFilters ? (
        <FilterPanel
          category={category}
          categories={categories}
          onSelect={handleCategory}
        />
      ) : null}

      <AuthLoading>
        <EventsAuthLoading />
      </AuthLoading>

      <AuthenticatedEvents>
        {eventsData === undefined ? (
          <EventListSkeleton />
        ) : events.length === 0 ? (
          <EmptyEvents
            category={category}
            onReset={() => setCategory("tout")}
          />
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.resultBar}>
              <View style={styles.resultBarLeft}>
                <CalendarDays size={13} color="rgba(255,255,255,0.35)" />

                <Text style={styles.resultText}>
                  {events.length}{" "}
                  {events.length === 1 ? "résultat" : "résultats"}
                </Text>
              </View>

              {category !== "tout" ? (
                <View style={styles.activeFilterBadge}>
                  <Text style={styles.activeFilterText}>
                    {getCategoryLabel(category)}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.eventsList}>
              {events.map((event, index) => (
                <View key={String(event._id)} style={styles.eventItem}>
                  <EventCard event={event} index={index} />
                </View>
              ))}
            </View>

            {events.length >= PAGE_LIMIT ? (
              <View style={styles.limitNotice}>
                <View style={styles.limitNoticeIcon}>
                  <Search size={13} color="rgba(255,255,255,0.3)" />
                </View>

                <Text style={styles.limitNoticeText}>
                  Cette liste affiche jusqu'à {PAGE_LIMIT} événements. Une
                  pagination backend peut être ajoutée lorsque le volume
                  l'exigera.
                </Text>
              </View>
            ) : null}

            <View style={styles.integrityNotice}>
              <View style={styles.integrityIndicator} />

              <Text style={styles.integrityText}>
                Les événements affichés correspondent aux données enregistrées
                dans le service événements.
              </Text>
            </View>
          </ScrollView>
        )}
      </AuthenticatedEvents>

      <Unauthenticated>
        <View style={styles.unauthenticatedContainer}>
          <View style={styles.emptyIcon}>
            <CalendarDays size={29} color="rgba(255,255,255,0.3)" />
          </View>

          <Text style={styles.emptyTitle}>Connectez-vous pour continuer</Text>

          <Text style={styles.emptyDescription}>
            L'accès aux événements nécessite une session utilisateur.
          </Text>
        </View>
      </Unauthenticated>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#050812",
  },

  glowTop: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -190,
    right: -110,
    backgroundColor: "rgba(124,58,237,0.055)",
  },

  header: {
    minHeight: 88,
    paddingHorizontal: 16,
    paddingTop: 43,
    paddingBottom: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.055)",
  },

  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  headerTitleArea: {
    flex: 1,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  headerSubtitle: {
    color: "rgba(255,255,255,0.36)",
    fontSize: 9,
    marginTop: 3,
  },

  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  filterButtonActive: {
    backgroundColor: "rgba(139,92,246,0.13)",
    borderColor: "rgba(139,92,246,0.28)",
  },

  pressed: {
    opacity: 0.68,
    transform: [
      {
        scale: 0.97,
      },
    ],
  },

  filterPanel: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 13,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.055)",
    backgroundColor: "rgba(255,255,255,0.018)",
  },

  filterPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  filterPanelTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  filterPanelTitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    fontWeight: "800",
  },

  resetText: {
    color: "#A78BFA",
    fontSize: 9,
    fontWeight: "800",
  },

  categoryList: {
    gap: 7,
    paddingRight: 10,
  },

  categoryChip: {
    minHeight: 36,
    paddingHorizontal: 13,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  categoryChipActive: {
    backgroundColor: "rgba(139,92,246,0.15)",
    borderColor: "rgba(139,92,246,0.32)",
  },

  categoryChipPressed: {
    opacity: 0.7,
  },

  categoryText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    fontWeight: "700",
  },

  categoryTextActive: {
    color: "#C4B5FD",
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 42,
  },

  resultBar: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  resultBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  resultText: {
    color: "rgba(255,255,255,0.34)",
    fontSize: 9,
    fontWeight: "700",
  },

  activeFilterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(139,92,246,0.1)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.2)",
  },

  activeFilterText: {
    color: "#A78BFA",
    fontSize: 8,
    fontWeight: "800",
  },

  eventsList: {
    gap: 15,
  },

  eventItem: {
    width: "100%",
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingBottom: 70,
  },

  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 16,
  },

  emptyTitle: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyDescription: {
    color: "rgba(255,255,255,0.34)",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 7,
    maxWidth: 320,
  },

  emptyButton: {
    marginTop: 19,
    minHeight: 42,
    paddingHorizontal: 15,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "rgba(99,102,241,0.82)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.25)",
  },

  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },

  limitNotice: {
    marginTop: 20,
    padding: 12,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  limitNoticeIcon: {
    width: 25,
    height: 25,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  limitNoticeText: {
    flex: 1,
    color: "rgba(255,255,255,0.28)",
    fontSize: 9,
    lineHeight: 14,
  },

  integrityNotice: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.045)",
  },

  integrityIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
    backgroundColor: "#4ADE80",
  },

  integrityText: {
    flex: 1,
    color: "rgba(255,255,255,0.25)",
    fontSize: 8,
    lineHeight: 13,
  },

  loadingHeader: {
    minHeight: 88,
    paddingHorizontal: 16,
    paddingTop: 43,
    paddingBottom: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  loadingHeaderText: {
    flex: 1,
    gap: 5,
  },

  loadingContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 15,
  },

  loadingSection: {
    gap: 9,
  },

  loadingChips: {
    flexDirection: "row",
    gap: 7,
  },

  loadingCard: {
    gap: 9,
  },

  authLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  authLoadingText: {
    color: "rgba(255,255,255,0.38)",
    fontSize: 10,
  },

  unauthenticatedContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingBottom: 70,
  },
});
