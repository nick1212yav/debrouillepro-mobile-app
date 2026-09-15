import React, { memo, useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";

import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Globe,
  MapPin,
  Phone,
  Plus,
  Search,
  Star,
  Target,
  TrendingUp,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react-native";

import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
} from "@/lib/convex-auth-compat";

import { api } from "@/convex/_generated/api.js";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";

import { SignInButton } from "@/components/ui/signin.tsx";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type BusinessTab = "annuaire" | "statistiques" | "opportunites";

type DisplayBusiness = {
  id: string;
  name: string;
  sector: string;
  location: string;
  founded: string | null;
  employees: string | null;
  rating: number | null;
  reviews: number;
  image: string | null;
  avatar: string;
  verified: boolean;
  description: string;
  website: string | null;
  phone: string | null;
};

type Props = {
  onBack: () => void;
};

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const ALL_SECTORS = "Tout";

const EMPTY_BUSINESS: DisplayBusiness[] = [];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getInitials(name: string): string {
  const clean = name.trim();

  if (!clean) {
    return "—";
  }

  const words = clean.split(/\s+/);

  if (words.length === 1) {
    return clean.slice(0, 2).toUpperCase();
  }

  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
}

function mapProfileToDisplay(
  profile: Doc<"businessProfiles">,
): DisplayBusiness {
  return {
    id: profile._id,
    name: profile.companyName,
    sector: profile.sector,
    location: [profile.city, profile.address].filter(Boolean).join(", "),
    founded:
      profile.foundedYear !== undefined && profile.foundedYear !== null
        ? String(profile.foundedYear)
        : null,
    employees: profile.employeeCount?.trim() ? profile.employeeCount : null,
    rating: typeof profile.rating === "number" ? profile.rating : null,
    reviews: typeof profile.reviewCount === "number" ? profile.reviewCount : 0,
    image:
      typeof profile.coverImage === "string" && profile.coverImage.trim()
        ? profile.coverImage
        : null,
    avatar: getInitials(profile.companyName),
    verified: Boolean(profile.verified),
    description: profile.description,
    website: profile.website?.trim() ? profile.website.trim() : null,
    phone: profile.phone?.trim() ? profile.phone.trim() : null,
  };
}

/* -------------------------------------------------------------------------- */
/* Premium primitives                                                         */
/* -------------------------------------------------------------------------- */

const GlassCard = memo(function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View
      className={`rounded-3xl border border-white/10 bg-white/[0.045] ${className}`}
    >
      {children}
    </View>
  );
});

const IconBox = memo(function IconBox({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View
      className={`h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] ${className}`}
    >
      {children}
    </View>
  );
});

const LoadingState = memo(function LoadingState() {
  return (
    <View className="items-center justify-center px-6 py-16">
      <ActivityIndicator size="small" color="#818CF8" />

      <Text className="mt-4 text-sm text-gray-400">
        Chargement des données…
      </Text>
    </View>
  );
});

const EmptyState = memo(function EmptyState({
  Icon,
  title,
  description,
  action,
}: {
  Icon: typeof Building2;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <View className="items-center rounded-3xl border border-white/10 bg-white/[0.035] px-6 py-14">
      <IconBox className="mb-4">
        <Icon size={24} color="rgba(255,255,255,0.45)" />
      </IconBox>

      <Text className="text-center text-base font-bold text-white">
        {title}
      </Text>

      <Text className="mt-2 max-w-[330px] text-center text-sm leading-6 text-gray-500">
        {description}
      </Text>

      {action ? <View className="mt-5">{action}</View> : null}
    </View>
  );
});

/* -------------------------------------------------------------------------- */
/* Header                                                                     */
/* -------------------------------------------------------------------------- */

const BusinessHeader = memo(function BusinessHeader({
  onBack,
  onCreate,
}: {
  onBack: () => void;
  onCreate: () => void;
}) {
  return (
    <View className="px-4 pb-4 pt-12">
      <View className="flex-row items-center gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={onBack}
          className="h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] active:bg-white/10"
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </Pressable>

        <View className="min-w-0 flex-1">
          <Text
            numberOfLines={1}
            className="text-xl font-extrabold tracking-tight text-white"
          >
            Business
          </Text>

          <Text numberOfLines={1} className="mt-0.5 text-xs text-gray-500">
            Entreprises, réseau & opportunités
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Créer ou modifier mon profil entreprise"
          onPress={onCreate}
          className="h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 active:bg-indigo-500"
        >
          <Plus size={19} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
});

/* -------------------------------------------------------------------------- */
/* User profile banner                                                        */
/* -------------------------------------------------------------------------- */

const MyBusinessBanner = memo(function MyBusinessBanner({
  profile,
  onPress,
}: {
  profile: Doc<"businessProfiles">;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Modifier mon profil entreprise"
      onPress={onPress}
      className="mx-4 mb-4 rounded-3xl border border-indigo-500/20 bg-indigo-500/[0.08] p-4 active:bg-indigo-500/[0.14]"
    >
      <View className="flex-row items-center gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20">
          <Text className="text-sm font-extrabold text-indigo-200">
            {getInitials(profile.companyName)}
          </Text>
        </View>

        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-2">
            <Text
              numberOfLines={1}
              className="flex-1 text-sm font-bold text-white"
            >
              {profile.companyName}
            </Text>

            {profile.verified ? (
              <CheckCircle2 size={15} color="#818CF8" />
            ) : null}
          </View>

          <Text numberOfLines={1} className="mt-1 text-xs text-indigo-200/70">
            {profile.sector} · {profile.city}
          </Text>
        </View>

        <ArrowRight size={17} color="#818CF8" />
      </View>
    </Pressable>
  );
});

/* -------------------------------------------------------------------------- */
/* Tabs                                                                       */
/* -------------------------------------------------------------------------- */

const BusinessTabs = memo(function BusinessTabs({
  active,
  onChange,
}: {
  active: BusinessTab;
  onChange: (value: BusinessTab) => void;
}) {
  const tabs: Array<{
    key: BusinessTab;
    label: string;
    Icon: typeof Building2;
  }> = [
    {
      key: "annuaire",
      label: "Annuaire",
      Icon: Building2,
    },
    {
      key: "statistiques",
      label: "Statistiques",
      Icon: BarChart3,
    },
    {
      key: "opportunites",
      label: "Opportunités",
      Icon: Target,
    },
  ];

  return (
    <View className="mx-4 mb-4 flex-row rounded-2xl border border-white/10 bg-white/[0.035] p-1">
      {tabs.map((tab) => {
        const selected = active === tab.key;

        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{
              selected,
            }}
            onPress={() => onChange(tab.key)}
            className={`min-h-[46px] flex-1 flex-row items-center justify-center gap-1.5 rounded-xl px-1 ${
              selected ? "bg-white/[0.10]" : ""
            }`}
          >
            <tab.Icon size={14} color={selected ? "#FFFFFF" : "#737B8F"} />

            <Text
              numberOfLines={1}
              className={`text-[11px] font-bold ${
                selected ? "text-white" : "text-gray-500"
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
});

/* -------------------------------------------------------------------------- */
/* Search                                                                     */
/* -------------------------------------------------------------------------- */

const SearchBox = memo(function SearchBox({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View className="mx-4 mb-3 flex-row items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4">
      <Search size={17} color="#667085" />

      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Rechercher une entreprise ou un secteur"
        placeholderTextColor="#667085"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        className="min-h-[48px] flex-1 text-sm text-white"
      />

      {value.length > 0 ? (
        <Pressable
          onPress={() => onChange("")}
          accessibilityLabel="Effacer la recherche"
        >
          <X size={16} color="#667085" />
        </Pressable>
      ) : null}
    </View>
  );
});

/* -------------------------------------------------------------------------- */
/* Sector filter                                                              */
/* -------------------------------------------------------------------------- */

const SectorFilter = memo(function SectorFilter({
  sectors,
  selected,
  onChange,
}: {
  sectors: string[];
  selected: string;
  onChange: (value: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingBottom: 5,
      }}
    >
      {sectors.map((sector) => {
        const active = selected === sector;

        return (
          <Pressable
            key={sector}
            onPress={() => onChange(sector)}
            className={`mr-2 rounded-full border px-4 py-2.5 ${
              active
                ? "border-indigo-500/40 bg-indigo-500/20"
                : "border-white/10 bg-white/[0.04]"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                active ? "text-indigo-200" : "text-gray-500"
              }`}
            >
              {sector}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
});

/* -------------------------------------------------------------------------- */
/* Business card                                                              */
/* -------------------------------------------------------------------------- */

const BusinessCard = memo(function BusinessCard({
  business,
  onPress,
}: {
  business: DisplayBusiness;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Voir ${business.name}`}
      onPress={onPress}
      className="mb-4 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] active:bg-white/[0.075]"
    >
      {business.image ? (
        <View className="h-36 w-full overflow-hidden bg-white/5">
          <View className="h-full w-full bg-indigo-500/10">
            <View className="absolute inset-0 items-center justify-center">
              <Building2 size={30} color="rgba(129,140,248,0.35)" />
            </View>
          </View>
        </View>
      ) : (
        <View className="h-24 items-center justify-center bg-indigo-500/[0.08]">
          <Building2 size={30} color="rgba(129,140,248,0.45)" />
        </View>
      )}

      <View className="p-4">
        <View className="flex-row items-start gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07]">
            <Text className="text-xs font-extrabold text-white">
              {business.avatar}
            </Text>
          </View>

          <View className="min-w-0 flex-1">
            <View className="flex-row items-center gap-2">
              <Text
                numberOfLines={1}
                className="flex-1 text-sm font-bold text-white"
              >
                {business.name}
              </Text>

              {business.verified ? (
                <CheckCircle2 size={14} color="#818CF8" />
              ) : null}
            </View>

            <Text
              numberOfLines={1}
              className="mt-1 text-xs font-medium text-indigo-300"
            >
              {business.sector}
            </Text>

            <View className="mt-1.5 flex-row items-center gap-1">
              <MapPin size={11} color="#667085" />

              <Text numberOfLines={1} className="flex-1 text-xs text-gray-500">
                {business.location || "Localisation non renseignée"}
              </Text>
            </View>
          </View>

          {business.rating !== null ? (
            <View className="flex-row items-center gap-1">
              <Star size={13} color="#FBBF24" />

              <Text className="text-xs font-bold text-white">
                {business.rating.toFixed(1)}
              </Text>
            </View>
          ) : null}
        </View>

        {business.description ? (
          <Text
            numberOfLines={2}
            className="mt-4 text-xs leading-5 text-gray-400"
          >
            {business.description}
          </Text>
        ) : null}

        <View className="mt-4 flex-row items-center justify-between border-t border-white/[0.06] pt-3">
          <Text className="text-[11px] text-gray-500">
            {business.reviews > 0 ? `${business.reviews} avis` : "Aucun avis"}
          </Text>

          <View className="flex-row items-center gap-1.5">
            <Text className="text-xs font-bold text-indigo-300">
              Voir le profil
            </Text>

            <ArrowRight size={14} color="#818CF8" />
          </View>
        </View>
      </View>
    </Pressable>
  );
});

/* -------------------------------------------------------------------------- */
/* Business details                                                           */
/* -------------------------------------------------------------------------- */

const BusinessDetails = memo(function BusinessDetails({
  business,
  onClose,
}: {
  business: DisplayBusiness;
  onClose: () => void;
}) {
  const handlePhone = useCallback(async () => {
    if (!business.phone) {
      return;
    }

    try {
      await Linking.openURL(`tel:${business.phone}`);
    } catch {
      Alert.alert(
        "Téléphone indisponible",
        "Impossible d'ouvrir l'application téléphone.",
      );
    }
  }, [business.phone]);

  const handleWebsite = useCallback(async () => {
    if (!business.website) {
      return;
    }

    const url = /^https?:\/\//i.test(business.website)
      ? business.website
      : `https://${business.website}`;

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Site indisponible", "Impossible d'ouvrir le site web.");
    }
  }, [business.website]);

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-[#050812]">
        <View className="px-4 pb-4 pt-5">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-bold text-white">
              Profil entreprise
            </Text>

            <Pressable
              onPress={onClose}
              className="h-10 w-10 items-center justify-center rounded-xl bg-white/10"
            >
              <X size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 40,
          }}
        >
          <GlassCard className="overflow-hidden">
            <View className="items-center px-5 py-8">
              <View className="h-20 w-20 items-center justify-center rounded-3xl border border-indigo-400/20 bg-indigo-500/10">
                <Text className="text-xl font-extrabold text-indigo-200">
                  {business.avatar}
                </Text>
              </View>

              <View className="mt-4 flex-row items-center gap-2">
                <Text
                  numberOfLines={2}
                  className="text-center text-xl font-extrabold text-white"
                >
                  {business.name}
                </Text>

                {business.verified ? (
                  <CheckCircle2 size={18} color="#818CF8" />
                ) : null}
              </View>

              <Text className="mt-2 text-sm font-medium text-indigo-300">
                {business.sector}
              </Text>

              {business.location ? (
                <View className="mt-3 flex-row items-center gap-1.5">
                  <MapPin size={13} color="#667085" />

                  <Text className="text-xs text-gray-500">
                    {business.location}
                  </Text>
                </View>
              ) : null}
            </View>
          </GlassCard>

          {business.description ? (
            <GlassCard className="mt-4 p-5">
              <Text className="mb-2 text-sm font-bold text-white">
                Présentation
              </Text>

              <Text className="text-sm leading-6 text-gray-400">
                {business.description}
              </Text>
            </GlassCard>
          ) : null}

          <View className="mt-4 flex-row gap-3">
            <GlassCard className="flex-1 p-4">
              <Text className="text-[11px] text-gray-500">Création</Text>

              <Text className="mt-2 text-base font-bold text-white">
                {business.founded ?? "—"}
              </Text>
            </GlassCard>

            <GlassCard className="flex-1 p-4">
              <Text className="text-[11px] text-gray-500">Employés</Text>

              <Text className="mt-2 text-base font-bold text-white">
                {business.employees ?? "—"}
              </Text>
            </GlassCard>
          </View>

          <GlassCard className="mt-4 p-5">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[11px] text-gray-500">Réputation</Text>

                <View className="mt-2 flex-row items-center gap-2">
                  <Star size={17} color="#FBBF24" />

                  <Text className="text-xl font-extrabold text-white">
                    {business.rating !== null
                      ? business.rating.toFixed(1)
                      : "—"}
                  </Text>
                </View>
              </View>

              <Text className="text-xs text-gray-500">
                {business.reviews > 0
                  ? `${business.reviews} avis`
                  : "Aucun avis"}
              </Text>
            </View>
          </GlassCard>

          <View className="mt-5 flex-row gap-3">
            {business.phone ? (
              <Pressable
                onPress={handlePhone}
                className="min-h-[52px] flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-indigo-600 active:bg-indigo-500"
              >
                <Phone size={17} color="#FFFFFF" />

                <Text className="text-sm font-bold text-white">Contacter</Text>
              </Pressable>
            ) : null}

            {business.website ? (
              <Pressable
                onPress={handleWebsite}
                className="min-h-[52px] flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06]"
              >
                <Globe size={17} color="#CBD5E1" />

                <Text className="text-sm font-bold text-gray-200">
                  Site web
                </Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
});

/* -------------------------------------------------------------------------- */
/* Statistics                                                                 */
/* -------------------------------------------------------------------------- */

const StatisticsView = memo(function StatisticsView({
  businesses,
}: {
  businesses: DisplayBusiness[];
}) {
  const statistics = useMemo(() => {
    const verified = businesses.filter((business) => business.verified).length;

    const rated = businesses.filter(
      (business) => business.rating !== null && business.rating > 0,
    );

    const ratingAverage =
      rated.length > 0
        ? rated.reduce((sum, business) => sum + (business.rating ?? 0), 0) /
          rated.length
        : null;

    const sectors = new Set(
      businesses.map((business) => business.sector.trim()).filter(Boolean),
    ).size;

    return {
      total: businesses.length,
      verified,
      sectors,
      ratingAverage,
    };
  }, [businesses]);

  if (businesses.length === 0) {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 40,
        }}
      >
        <EmptyState
          Icon={BarChart3}
          title="Pas encore de statistiques"
          description="Les statistiques seront calculées automatiquement à partir des entreprises réellement disponibles dans l'annuaire."
        />
      </ScrollView>
    );
  }

  const cards = [
    {
      label: "Entreprises",
      value: String(statistics.total),
      Icon: Building2,
    },
    {
      label: "Vérifiées",
      value: String(statistics.verified),
      Icon: CheckCircle2,
    },
    {
      label: "Secteurs",
      value: String(statistics.sectors),
      Icon: Target,
    },
    {
      label: "Note moyenne",
      value:
        statistics.ratingAverage !== null
          ? statistics.ratingAverage.toFixed(1)
          : "—",
      Icon: Star,
    },
  ];

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingBottom: 40,
      }}
    >
      <View className="mb-5">
        <Text className="text-lg font-bold text-white">Vue d'ensemble</Text>

        <Text className="mt-1 text-xs leading-5 text-gray-500">
          Indicateurs calculés à partir des profils actuellement accessibles.
        </Text>
      </View>

      <View className="flex-row flex-wrap gap-3">
        {cards.map((card) => (
          <GlassCard key={card.label} className="w-[48%] p-4">
            <card.Icon size={19} color="#818CF8" />

            <Text className="mt-4 text-2xl font-extrabold text-white">
              {card.value}
            </Text>

            <Text className="mt-1 text-xs text-gray-500">{card.label}</Text>
          </GlassCard>
        ))}
      </View>

      <GlassCard className="mt-4 p-5">
        <View className="flex-row items-center gap-3">
          <IconBox>
            <TrendingUp size={19} color="#34D399" />
          </IconBox>

          <View className="flex-1">
            <Text className="text-sm font-bold text-white">
              Données transparentes
            </Text>

            <Text className="mt-1 text-xs leading-5 text-gray-500">
              Aucun chiffre global externe n'est inventé lorsque la plateforme
              ne fournit pas encore la source correspondante.
            </Text>
          </View>
        </View>
      </GlassCard>
    </ScrollView>
  );
});

/* -------------------------------------------------------------------------- */
/* Opportunities                                                              */
/* -------------------------------------------------------------------------- */

const OpportunitiesView = memo(function OpportunitiesView() {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingBottom: 40,
      }}
    >
      <EmptyState
        Icon={Target}
        title="Opportunités à venir"
        description="Aucune source d'opportunités n'est actuellement connectée à ce module. Aucun appel d'offres, financement ou partenariat fictif n'est affiché."
      />
    </ScrollView>
  );
});

/* -------------------------------------------------------------------------- */
/* Business profile form                                                      */
/* -------------------------------------------------------------------------- */

function BusinessProfileModal({
  onClose,
  existing,
}: {
  onClose: () => void;
  existing: Doc<"businessProfiles"> | null | undefined;
}) {
  const upsert = useMutation(api.employment.upsertBusinessProfile);

  const [companyName, setCompanyName] = useState(existing?.companyName ?? "");

  const [sector, setSector] = useState(existing?.sector ?? "");

  const [description, setDescription] = useState(existing?.description ?? "");

  const [city, setCity] = useState(existing?.city ?? "");

  const [address, setAddress] = useState(existing?.address ?? "");

  const [phone, setPhone] = useState(existing?.phone ?? "");

  const [website, setWebsite] = useState(existing?.website ?? "");

  const [employeeCount, setEmployeeCount] = useState(
    existing?.employeeCount ?? "",
  );

  const [foundedYear, setFoundedYear] = useState(
    existing?.foundedYear !== undefined && existing?.foundedYear !== null
      ? String(existing.foundedYear)
      : "",
  );

  const [saving, setSaving] = useState(false);

  const handleSubmit = useCallback(async () => {
    const cleanCompanyName = companyName.trim();

    const cleanSector = sector.trim();

    const cleanDescription = description.trim();

    const cleanCity = city.trim();

    if (!cleanCompanyName || !cleanSector || !cleanDescription || !cleanCity) {
      Alert.alert(
        "Informations requises",
        "Nom, secteur, description et ville sont obligatoires.",
      );

      return;
    }

    const year = foundedYear.trim() ? Number(foundedYear) : undefined;

    if (
      year !== undefined &&
      (!Number.isInteger(year) ||
        year < 1800 ||
        year > new Date().getFullYear())
    ) {
      Alert.alert(
        "Année invalide",
        "Veuillez saisir une année de création valide.",
      );

      return;
    }

    try {
      setSaving(true);

      await upsert({
        companyName: cleanCompanyName,
        sector: cleanSector,
        description: cleanDescription,
        city: cleanCity,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        employeeCount: employeeCount.trim() || undefined,
        foundedYear: year,
      });

      Alert.alert(
        existing ? "Profil mis à jour" : "Profil créé",
        existing
          ? "Les informations de votre entreprise ont été mises à jour."
          : "Votre profil entreprise est maintenant enregistré.",
      );

      onClose();
    } catch (error) {
      console.error("[BusinessPage] upsertBusinessProfile failed", error);

      if (error instanceof ConvexError) {
        const data = error.data as { message?: string } | string | null;

        const message = typeof data === "string" ? data : data?.message;

        Alert.alert(
          "Impossible d'enregistrer",
          message || "Le serveur a refusé l'opération.",
        );
      } else {
        Alert.alert(
          "Impossible d'enregistrer",
          "Une erreur est survenue. Vérifiez votre connexion puis réessayez.",
        );
      }
    } finally {
      setSaving(false);
    }
  }, [
    address,
    city,
    companyName,
    description,
    employeeCount,
    existing,
    foundedYear,
    onClose,
    phone,
    sector,
    upsert,
    website,
  ]);

  const inputClass =
    "mb-4 min-h-[50px] rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-sm text-white";

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        if (!saving) {
          onClose();
        }
      }}
    >
      <View className="flex-1 bg-[#050812]">
        <View className="flex-row items-center justify-between px-4 pb-4 pt-5">
          <View className="flex-1">
            <Text className="text-xl font-extrabold text-white">
              {existing
                ? "Modifier votre entreprise"
                : "Créer votre entreprise"}
            </Text>

            <Text className="mt-1 text-xs text-gray-500">
              Présentez uniquement des informations réelles.
            </Text>
          </View>

          <Pressable
            onPress={onClose}
            disabled={saving}
            className="h-10 w-10 items-center justify-center rounded-xl bg-white/10"
          >
            <X size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 40,
          }}
        >
          <Text className="mb-2 text-xs font-bold text-gray-400">
            Nom de l'entreprise *
          </Text>

          <TextInput
            value={companyName}
            onChangeText={setCompanyName}
            editable={!saving}
            placeholder="Nom de votre entreprise"
            placeholderTextColor="#667085"
            className={inputClass}
          />

          <Text className="mb-2 text-xs font-bold text-gray-400">
            Secteur *
          </Text>

          <TextInput
            value={sector}
            onChangeText={setSector}
            editable={!saving}
            placeholder="Ex. BTP, Technologie, Commerce…"
            placeholderTextColor="#667085"
            className={inputClass}
          />

          <Text className="mb-2 text-xs font-bold text-gray-400">
            Description *
          </Text>

          <TextInput
            value={description}
            onChangeText={setDescription}
            editable={!saving}
            multiline
            textAlignVertical="top"
            placeholder="Présentez votre activité…"
            placeholderTextColor="#667085"
            className={`${inputClass} min-h-[120px] pt-4`}
          />

          <Text className="mb-2 text-xs font-bold text-gray-400">Ville *</Text>

          <TextInput
            value={city}
            onChangeText={setCity}
            editable={!saving}
            placeholder="Ville"
            placeholderTextColor="#667085"
            className={inputClass}
          />

          <Text className="mb-2 text-xs font-bold text-gray-400">Adresse</Text>

          <TextInput
            value={address}
            onChangeText={setAddress}
            editable={!saving}
            placeholder="Adresse ou quartier"
            placeholderTextColor="#667085"
            className={inputClass}
          />

          <Text className="mb-2 text-xs font-bold text-gray-400">
            Téléphone
          </Text>

          <TextInput
            value={phone}
            onChangeText={setPhone}
            editable={!saving}
            keyboardType="phone-pad"
            placeholder="Numéro professionnel"
            placeholderTextColor="#667085"
            className={inputClass}
          />

          <Text className="mb-2 text-xs font-bold text-gray-400">Site web</Text>

          <TextInput
            value={website}
            onChangeText={setWebsite}
            editable={!saving}
            autoCapitalize="none"
            keyboardType="url"
            placeholder="https://..."
            placeholderTextColor="#667085"
            className={inputClass}
          />

          <Text className="mb-2 text-xs font-bold text-gray-400">
            Nombre d'employés
          </Text>

          <TextInput
            value={employeeCount}
            onChangeText={setEmployeeCount}
            editable={!saving}
            placeholder="Ex. 1-10, 11-50…"
            placeholderTextColor="#667085"
            className={inputClass}
          />

          <Text className="mb-2 text-xs font-bold text-gray-400">
            Année de création
          </Text>

          <TextInput
            value={foundedYear}
            onChangeText={setFoundedYear}
            editable={!saving}
            keyboardType="number-pad"
            placeholder="Ex. 2020"
            placeholderTextColor="#667085"
            className={inputClass}
          />

          <Pressable
            onPress={handleSubmit}
            disabled={saving}
            className={`mt-2 min-h-[54px] flex-row items-center justify-center gap-2 rounded-2xl ${
              saving ? "bg-white/10" : "bg-indigo-600 active:bg-indigo-500"
            }`}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Check size={18} color="#FFFFFF" />
            )}

            <Text className="text-sm font-extrabold text-white">
              {saving
                ? "Enregistrement…"
                : existing
                  ? "Enregistrer les modifications"
                  : "Créer mon profil"}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Authenticated page                                                         */
/* -------------------------------------------------------------------------- */

function BusinessPageInner({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<BusinessTab>("annuaire");

  const [filter, setFilter] = useState(ALL_SECTORS);

  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState<DisplayBusiness | null>(null);

  const [showProfileModal, setShowProfileModal] = useState(false);

  const myProfile = useQuery(api.employment.getBusinessProfile, {});

  const backendProfiles = useQuery(api.employment.listBusinessProfiles, {
    sector: filter !== ALL_SECTORS ? filter : undefined,
  });

  const businesses = useMemo<DisplayBusiness[]>(
    () =>
      backendProfiles
        ? backendProfiles.map(mapProfileToDisplay)
        : EMPTY_BUSINESS,
    [backendProfiles],
  );

  const sectors = useMemo(() => {
    const values = new Set<string>();

    for (const business of businesses) {
      const sector = business.sector.trim();

      if (sector) {
        values.add(sector);
      }
    }

    return [
      ALL_SECTORS,
      ...Array.from(values).sort((a, b) => a.localeCompare(b, "fr")),
    ];
  }, [businesses]);

  const filteredBusinesses = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return businesses;
    }

    return businesses.filter(
      (business) =>
        business.name.toLowerCase().includes(query) ||
        business.sector.toLowerCase().includes(query) ||
        business.location.toLowerCase().includes(query),
    );
  }, [businesses, search]);

  const handleTabChange = useCallback((value: BusinessTab) => {
    setTab(value);
  }, []);

  const handleSelectBusiness = useCallback((business: DisplayBusiness) => {
    setSelected(business);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelected(null);
  }, []);

  const handleOpenProfile = useCallback(() => {
    setShowProfileModal(true);
  }, []);

  const handleCloseProfile = useCallback(() => {
    setShowProfileModal(false);
  }, []);

  const handleFilterChange = useCallback((value: string) => {
    setFilter(value);
  }, []);

  return (
    <View className="flex-1 bg-[#050812]">
      <BusinessHeader onBack={onBack} onCreate={handleOpenProfile} />

      {myProfile ? (
        <MyBusinessBanner profile={myProfile} onPress={handleOpenProfile} />
      ) : null}

      <BusinessTabs active={tab} onChange={handleTabChange} />

      {tab === "annuaire" ? (
        <>
          <SearchBox value={search} onChange={setSearch} />

          <SectorFilter
            sectors={sectors}
            selected={filter}
            onChange={handleFilterChange}
          />

          <View className="mt-4 flex-1">
            {!backendProfiles ? (
              <LoadingState />
            ) : filteredBusinesses.length === 0 ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingBottom: 40,
                }}
              >
                <EmptyState
                  Icon={Building2}
                  title={search.trim() ? "Aucun résultat" : "Annuaire vide"}
                  description={
                    search.trim()
                      ? "Aucune entreprise réellement enregistrée ne correspond à votre recherche."
                      : "Aucune entreprise n'est actuellement disponible dans l'annuaire."
                  }
                />
              </ScrollView>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingBottom: 40,
                }}
              >
                {filteredBusinesses.map((business) => (
                  <BusinessCard
                    key={business.id}
                    business={business}
                    onPress={() => handleSelectBusiness(business)}
                  />
                ))}
              </ScrollView>
            )}
          </View>
        </>
      ) : null}

      {tab === "statistiques" ? (
        <StatisticsView businesses={businesses} />
      ) : null}

      {tab === "opportunites" ? <OpportunitiesView /> : null}

      {selected ? (
        <BusinessDetails business={selected} onClose={handleCloseDetails} />
      ) : null}

      {showProfileModal ? (
        <BusinessProfileModal
          existing={myProfile}
          onClose={handleCloseProfile}
        />
      ) : null}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Authentication                                                             */
/* -------------------------------------------------------------------------- */

export default function BusinessPage({ onBack }: Props) {
  return (
    <View className="flex-1 bg-[#050812]">
      <Authenticated>
        <BusinessPageInner onBack={onBack} />
      </Authenticated>

      <Unauthenticated>
        <View className="flex-1 items-center justify-center px-6">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            onPress={onBack}
            className="absolute left-4 top-12 h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </Pressable>

          <IconBox className="mb-5 h-20 w-20 rounded-3xl">
            <Building2 size={34} color="#818CF8" />
          </IconBox>

          <Text className="text-center text-xl font-extrabold text-white">
            Business
          </Text>

          <Text className="mt-2 max-w-[330px] text-center text-sm leading-6 text-gray-500">
            Connectez-vous pour accéder à l'annuaire et gérer votre profil
            entreprise.
          </Text>

          <View className="mt-7">
            <SignInButton />
          </View>
        </View>
      </Unauthenticated>

      <AuthLoading>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color="#818CF8" />

          <Text className="mt-4 text-sm text-gray-500">
            Préparation de votre espace…
          </Text>
        </View>
      </AuthLoading>
    </View>
  );
}
