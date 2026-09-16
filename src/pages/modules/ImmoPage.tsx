// src/pages/modules/ImmoPage.tsx

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
  Building2,
  ChevronDown,
  Home,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react-native";
import { usePaginatedQuery, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from "@/lib/convex-auth-compat";
import { SignInButton } from "@/components/ui/signin";

import type { Property } from "@/features/immo";
import { PropertyCard } from "@/features/immo";

const COLORS = {
  background: "#050812",
  backgroundSecondary: "#0C1022",
  card: "rgba(255,255,255,0.055)",
  cardStrong: "rgba(255,255,255,0.075)",
  border: "rgba(255,255,255,0.10)",
  borderStrong: "rgba(255,255,255,0.16)",
  text: "#FFFFFF",
  textSecondary: "#CBD5E1",
  textMuted: "#94A3B8",
  textFaint: "#64748B",
  primary: "#2563EB",
  primaryDark: "#4338CA",
  accent: "#F97316",
  success: "#10B981",
};

type FilterKey = "Tous" | "Louer" | "Acheter";

const FILTERS: readonly FilterKey[] = ["Tous", "Louer", "Acheter"];

function LoadingCard() {
  return (
    <View style={styles.loadingCard}>
      <View style={styles.loadingImage} />
      <View style={styles.loadingContent}>
        <View style={styles.loadingLineLarge} />
        <View style={styles.loadingLineMedium} />
        <View style={styles.loadingLineSmall} />
      </View>
    </View>
  );
}

function EmptyState({
  search,
  onClear,
}: {
  search: string;
  onClear: () => void;
}) {
  const hasSearch = search.trim().length > 0;

  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        {hasSearch ? (
          <Search size={28} color={COLORS.textMuted} />
        ) : (
          <Home size={28} color={COLORS.textMuted} />
        )}
      </View>

      <Text style={styles.emptyTitle}>
        {hasSearch ? "Aucun bien trouvé" : "Aucun bien disponible"}
      </Text>

      <Text style={styles.emptyDescription}>
        {hasSearch
          ? "Aucun bien correspondant à votre recherche n'est actuellement disponible."
          : "Les biens immobiliers publiés apparaîtront ici dès qu'ils seront disponibles."}
      </Text>

      {hasSearch ? (
        <Pressable
          onPress={onClear}
          style={({ pressed }) => [
            styles.emptyAction,
            pressed && styles.pressed,
          ]}
        >
          <X size={16} color={COLORS.text} />
          <Text style={styles.emptyActionText}>Effacer la recherche</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterChip,
        active && styles.filterChipActive,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[styles.filterChipText, active && styles.filterChipTextActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ImmoHeader({
  onBack,
  search,
  setSearch,
  activeFilter,
  setActiveFilter,
}: {
  onBack: () => void;
  search: string;
  setSearch: (value: string) => void;
  activeFilter: FilterKey;
  setActiveFilter: (value: FilterKey) => void;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={onBack}
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.pressed,
          ]}
        >
          <ArrowLeft size={20} color={COLORS.text} />
        </Pressable>

        <View style={styles.headerIdentity}>
          <Text style={styles.headerTitle}>Immobilier</Text>

          <View style={styles.headerSubtitleRow}>
            <MapPin size={12} color={COLORS.accent} />
            <Text style={styles.headerSubtitle}>
              Trouver · Louer · Acheter · Visiter
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Publier un bien"
          onPress={() => {
            /*
             * Aucune mutation de création n'est fournie
             * dans le contrat visible de cette page.
             *
             * On ne simule donc pas une publication.
             */
            Alert.alert(
              "Publication immobilière",
              "Le formulaire de publication doit être connecté à la mutation Convex réelle de création d'un bien avant d'être activé.",
            );
          }}
          style={({ pressed }) => [
            styles.publishButton,
            pressed && styles.pressed,
          ]}
        >
          <Plus size={19} color={COLORS.accent} />
        </Pressable>
      </View>

      <View style={styles.searchContainer}>
        <Search size={18} color={COLORS.textMuted} />

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher un logement, terrain..."
          placeholderTextColor={COLORS.textFaint}
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          clearButtonMode="never"
        />

        {search.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Effacer la recherche"
            onPress={() => setSearch("")}
            style={({ pressed }) => [
              styles.clearButton,
              pressed && styles.pressed,
            ]}
          >
            <X size={16} color={COLORS.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContent}
      >
        {FILTERS.map((filter) => (
          <FilterChip
            key={filter}
            label={filter}
            active={activeFilter === filter}
            onPress={() => setActiveFilter(filter)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function ImmoToolbar({ count }: { count: number }) {
  return (
    <View style={styles.toolbar}>
      <View style={styles.resultIdentity}>
        <Building2 size={16} color={COLORS.textMuted} />

        <Text style={styles.resultCount}>
          {count} {count === 1 ? "bien" : "biens"}
        </Text>
      </View>

      <View style={styles.toolbarRight}>
        <SlidersHorizontal size={15} color={COLORS.textMuted} />

        <Text style={styles.toolbarText}>Résultats</Text>

        <ChevronDown size={15} color={COLORS.textMuted} />
      </View>
    </View>
  );
}

function ImmoContent({ onBack }: { onBack: () => void }) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("Tous");

  const [search, setSearch] = useState("");

  const normalizedSearch = search.trim();

  /*
   * Contrat backend conservé depuis le fichier source :
   *
   * listProperties accepte actuellement le filtre de statut
   * utilisé ci-dessous.
   *
   * Important :
   * "Louer" / "Acheter" ne sont pas artificiellement injectés
   * dans la requête tant que le backend fourni ne montre pas
   * explicitement un filtre transactionType correspondant.
   *
   * Les deux filtres restent donc reliés au statut disponible,
   * exactement comme dans le code source.
   */
  const filterArgs =
    activeFilter === "Louer" || activeFilter === "Acheter"
      ? { status: "available" as const }
      : {};

  const { results, status, loadMore } = usePaginatedQuery(
    api.realestate.listProperties,
    filterArgs,
    {
      initialNumItems: 10,
    },
  );

  const searchResults = useQuery(
    api.realestate.searchProperties,
    normalizedSearch.length > 2 ? { q: normalizedSearch } : "skip",
  );

  const displayedItems = useMemo<Property[]>(() => {
    if (normalizedSearch.length > 2) {
      return (searchResults ?? []) as Property[];
    }

    return (results ?? []) as Property[];
  }, [normalizedSearch, searchResults, results]);

  const isInitialLoading = status === "LoadingFirstPage";

  const isSearchLoading =
    normalizedSearch.length > 2 && searchResults === undefined;

  const isLoading = isInitialLoading || isSearchLoading;

  const canLoadMore = normalizedSearch.length <= 2 && status === "CanLoadMore";

  return (
    <View style={styles.screen}>
      <ImmoHeader
        onBack={onBack}
        search={search}
        setSearch={setSearch}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
      />

      <View style={styles.body}>
        <ImmoToolbar count={displayedItems.length} />

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={styles.loadingList}>
              <LoadingCard />
              <LoadingCard />
              <LoadingCard />
            </View>
          ) : null}

          {!isLoading && displayedItems.length === 0 ? (
            <EmptyState
              search={normalizedSearch}
              onClear={() => setSearch("")}
            />
          ) : null}

          {!isLoading && displayedItems.length > 0 ? (
            <View style={styles.propertyList}>
              {displayedItems.map((property) => (
                <View key={String(property._id)} style={styles.propertyItem}>
                  <PropertyCard
                    publication={property}
                    index={0}
                    onLike={() => undefined}
                    onComment={() => undefined}
                    onShare={() => undefined}
                    onBookmark={() => undefined}
                  />
                </View>
              ))}
            </View>
          ) : null}

          {canLoadMore ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Charger plus de biens"
              onPress={() => loadMore(10)}
              style={({ pressed }) => [
                styles.loadMoreButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.loadMoreText}>Charger plus</Text>
            </Pressable>
          ) : null}

          {status === "LoadingMore" ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={COLORS.textMuted} />

              <Text style={styles.loadingMoreText}>Chargement...</Text>
            </View>
          ) : null}

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    </View>
  );
}

function AuthLoadingScreen() {
  return (
    <View style={styles.authLoading}>
      <View style={styles.authLoadingIcon}>
        <Building2 size={25} color={COLORS.textMuted} />
      </View>

      <Text style={styles.authLoadingTitle}>Chargement de l'immobilier</Text>

      <Text style={styles.authLoadingText}>
        Préparation de votre espace immobilier...
      </Text>

      <ActivityIndicator
        size="small"
        color={COLORS.accent}
        style={styles.authSpinner}
      />
    </View>
  );
}

function UnauthenticatedScreen({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.authScreen}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retour"
        onPress={onBack}
        style={({ pressed }) => [
          styles.headerButton,
          styles.authBackButton,
          pressed && styles.pressed,
        ]}
      >
        <ArrowLeft size={20} color={COLORS.text} />
      </Pressable>

      <View style={styles.authIcon}>
        <Building2 size={42} color={COLORS.textMuted} />
      </View>

      <Text style={styles.authTitle}>Votre espace immobilier</Text>

      <Text style={styles.authDescription}>
        Connectez-vous pour accéder aux biens immobiliers disponibles et aux
        fonctionnalités réservées aux utilisateurs authentifiés.
      </Text>

      <SignInButton />
    </View>
  );
}

interface ImmoPageProps {
  onBack: () => void;
}

export default function ImmoPage({ onBack }: ImmoPageProps) {
  return (
    <View style={styles.screen}>
      <AuthLoading>
        <AuthLoadingScreen />
      </AuthLoading>

      <Unauthenticated>
        <UnauthenticatedScreen onBack={onBack} />
      </Unauthenticated>

      <Authenticated>
        <ImmoContent onBack={onBack} />
      </Authenticated>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: "rgba(5,8,18,0.96)",
  },

  headerTop: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  headerIdentity: {
    flex: 1,
  },

  headerTitle: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  headerSubtitleRow: {
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  headerSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },

  publishButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(249,115,22,0.12)",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.30)",
  },

  searchContainer: {
    marginTop: 13,
    minHeight: 50,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: 17,
    backgroundColor: COLORS.cardStrong,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  searchInput: {
    flex: 1,
    minHeight: 48,
    color: COLORS.text,
    fontSize: 14,
    paddingVertical: 0,
  },

  clearButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  filtersContent: {
    paddingTop: 11,
    paddingBottom: 4,
    paddingRight: 8,
    gap: 8,
  },

  filterChip: {
    minHeight: 36,
    paddingHorizontal: 15,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  filterChipActive: {
    backgroundColor: "rgba(249,115,22,0.14)",
    borderColor: "rgba(249,115,22,0.42)",
  },

  filterChipText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },

  filterChipTextActive: {
    color: COLORS.accent,
  },

  body: {
    flex: 1,
  },

  toolbar: {
    minHeight: 48,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  resultIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  resultCount: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },

  toolbarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  toolbarText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },

  list: {
    flex: 1,
  },

  listContent: {
    paddingHorizontal: 16,
  },

  propertyList: {
    gap: 14,
  },

  propertyItem: {
    width: "100%",
  },

  loadingList: {
    gap: 14,
  },

  loadingCard: {
    height: 285,
    overflow: "hidden",
    borderRadius: 23,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  loadingImage: {
    height: 165,
    backgroundColor: "rgba(255,255,255,0.075)",
  },

  loadingContent: {
    padding: 16,
    gap: 10,
  },

  loadingLineLarge: {
    width: "72%",
    height: 18,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.075)",
  },

  loadingLineMedium: {
    width: "48%",
    height: 13,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  loadingLineSmall: {
    width: "36%",
    height: 12,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  emptyState: {
    marginTop: 42,
    paddingHorizontal: 24,
    paddingVertical: 38,
    alignItems: "center",
    borderRadius: 23,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  emptyTitle: {
    marginTop: 14,
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyDescription: {
    marginTop: 7,
    maxWidth: 320,
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
  },

  emptyAction: {
    marginTop: 18,
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: COLORS.cardStrong,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },

  emptyActionText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },

  loadMoreButton: {
    marginTop: 16,
    minHeight: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  loadMoreText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "800",
  },

  loadingMore: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  loadingMoreText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },

  bottomSpacing: {
    height: 30,
  },

  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.985 }],
  },

  authLoading: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },

  authLoadingIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  authLoadingTitle: {
    marginTop: 16,
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",
  },

  authLoadingText: {
    marginTop: 6,
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: "center",
  },

  authSpinner: {
    marginTop: 18,
  },

  authScreen: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },

  authBackButton: {
    position: "absolute",
    top: 18,
    left: 18,
  },

  authIcon: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  authTitle: {
    marginTop: 20,
    color: COLORS.text,
    fontSize: 21,
    fontWeight: "900",
    textAlign: "center",
  },

  authDescription: {
    maxWidth: 360,
    marginTop: 9,
    marginBottom: 22,
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
});
