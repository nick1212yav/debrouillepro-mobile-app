import { View, Pressable, Text, Image } from "react-native";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  Home,
  MapPin,
  Radar,
  Sparkles,
  Store,
  Wrench,
} from "lucide-react-native";

/* ============================================================================
 * TYPES
 * ========================================================================== */

interface OpportunityRadarProps {
  onNavigate: (page: string) => void;
  maxItems?: number;
}

interface FeedRecord extends Record<string, unknown> {
  id?: string;
  _id?: string;
  moduleId?: string;
  type?: string;
  title?: string;
  description?: string;
  image?: string;
  route?: string;
  category?: string;
  location?: string;
  city?: string;
  country?: string;
  price?: string | number;
  createdAt?: string | number | Date;
  _creationTime?: number;
  score?: number;
  relevance?: string | number;
}

interface OpportunityCard {
  id: string;
  moduleId: string;
  type: string;
  title: string;
  description: string;
  image?: string;
  route: string;
  category?: string;
  location?: string;
  price?: string | number;
  accent: string;
  icon: typeof BriefcaseBusiness;
  label: string;
  score: number;
  createdAt?: number;
}

/* ============================================================================
 * CONFIGURATION
 * ========================================================================== */

/**
 * IMPORTANT :
 * Ce catalogue ne contient aucune donnée métier.
 *
 * Il sert uniquement à définir l'identité visuelle des types
 * d'opportunités réellement retournés par le backend.
 */
const OPPORTUNITY_TYPES: Record<
  string,
  {
    label: string;
    accent: string;
    icon: typeof BriefcaseBusiness;
  }
> = {
  job: {
    label: "Emploi",
    accent: "#10B981",
    icon: BriefcaseBusiness,
  },

  property: {
    label: "Immobilier",
    accent: "#8B5CF6",
    icon: Home,
  },

  service: {
    label: "Service",
    accent: "#3B82F6",
    icon: Wrench,
  },

  event: {
    label: "Événement",
    accent: "#EC4899",
    icon: CalendarDays,
  },

  product: {
    label: "À découvrir",
    accent: "#F59E0B",
    icon: Store,
  },
};

/**
 * Certains anciens contenus peuvent avoir un type métier différent
 * mais être identifiables par leur module.
 *
 * Transport est explicitement exclu.
 */
const MODULE_TO_TYPE: Record<
  string,
  "job" | "property" | "service" | "event" | "product"
> = {
  jobs: "job",
  emploi: "job",

  immo: "property",
  immobilier: "property",

  services: "service",
  sante: "service",

  evenements: "event",
  evenement: "event",

  marketplace: "product",
  annonces: "product",
  boutique: "product",
  agri: "product",
};

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function toRecord(value: unknown): FeedRecord {
  if (value !== null && typeof value === "object") {
    return value as FeedRecord;
  }

  return {};
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getString(value: unknown): string | undefined {
  const result = cleanText(value);
  return result || undefined;
}

/**
 * Vérifie qu'une carte est une vraie carte métier.
 *
 * Une carte générique comme :
 *
 * {
 *   moduleId: "transport",
 *   title: "transport",
 *   description: "Contenu"
 * }
 *
 * est rejetée ici.
 */
function isRealOpportunityCard(item: unknown): boolean {
  const record = toRecord(item);

  const id = getString(record.id ?? record._id);
  const moduleId = getString(record.moduleId);
  const title = getString(record.title);
  const description = getString(record.description);
  const route = getString(record.route);

  if (!id || !moduleId || !title || !description || !route) {
    return false;
  }

  if (moduleId.toLowerCase() === "transport") {
    return false;
  }

  const normalizedType = cleanText(record.type).toLowerCase();

  const validType =
    normalizedType in OPPORTUNITY_TYPES ||
    moduleId.toLowerCase() in MODULE_TO_TYPE;

  if (!validType) {
    return false;
  }

  /**
   * Protection supplémentaire contre les cartes génériques
   * qui utilisent le nom du module comme titre.
   */
  const normalizedTitle = title.toLowerCase();
  const normalizedModule = moduleId.toLowerCase();

  if (
    normalizedTitle === normalizedModule ||
    normalizedTitle === "transport" ||
    normalizedTitle === "contenu"
  ) {
    return false;
  }

  return true;
}

function resolveOpportunityType(record: FeedRecord): string | undefined {
  const type = cleanText(record.type).toLowerCase();

  if (type && OPPORTUNITY_TYPES[type]) {
    return type;
  }

  const moduleId = cleanText(record.moduleId).toLowerCase();

  return MODULE_TO_TYPE[moduleId];
}

function getLocation(record: FeedRecord): string | undefined {
  const directLocation = getString(record.location);

  if (directLocation) {
    return directLocation;
  }

  const city = getString(record.city);
  const country = getString(record.country);

  return [city, country].filter(Boolean).join(", ") || undefined;
}

function getCreatedAt(record: FeedRecord): number | undefined {
  if (typeof record.createdAt === "number") {
    return record.createdAt;
  }

  if (record.createdAt instanceof Date) {
    return record.createdAt.getTime();
  }

  if (typeof record.createdAt === "string") {
    const parsed = Date.parse(record.createdAt);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  if (typeof record._creationTime === "number") {
    return record._creationTime;
  }

  return undefined;
}

function getScore(record: FeedRecord): number {
  if (typeof record.score === "number" && Number.isFinite(record.score)) {
    return record.score;
  }

  if (
    typeof record.relevance === "number" &&
    Number.isFinite(record.relevance)
  ) {
    return record.relevance;
  }

  return 0;
}

function formatPrice(price: string | number | undefined): string | undefined {
  if (price === undefined || price === null) {
    return undefined;
  }

  if (typeof price === "number") {
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 0,
    }).format(price);
  }

  const value = price.trim();

  return value || undefined;
}

function relativeDate(timestamp?: number): string | undefined {
  if (!timestamp) {
    return undefined;
  }

  const diff = Date.now() - timestamp;

  if (!Number.isFinite(diff) || diff < 0) {
    return undefined;
  }

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return "À l'instant";
  }

  if (diff < hour) {
    const value = Math.floor(diff / minute);
    return `Il y a ${value} min`;
  }

  if (diff < day) {
    const value = Math.floor(diff / hour);
    return `Il y a ${value} h`;
  }

  if (diff < 7 * day) {
    const value = Math.floor(diff / day);
    return `Il y a ${value} j`;
  }

  return undefined;
}

/* ============================================================================
 * NORMALISATION
 * ========================================================================== */

function normalizeOpportunities(
  rawItems: unknown[],
  maxItems: number,
): OpportunityCard[] {
  const seen = new Set<string>();

  return rawItems
    .filter(isRealOpportunityCard)
    .map((item): OpportunityCard | null => {
      const record = toRecord(item);

      const id = getString(record.id ?? record._id);
      const moduleId = getString(record.moduleId);
      const title = getString(record.title);
      const description = getString(record.description);
      const route = getString(record.route);

      if (!id || !moduleId || !title || !description || !route) {
        return null;
      }

      const type = resolveOpportunityType(record);

      if (!type) {
        return null;
      }

      const config = OPPORTUNITY_TYPES[type];

      if (!config) {
        return null;
      }

      const key = `${moduleId}:${id}`;

      if (seen.has(key)) {
        return null;
      }

      seen.add(key);

      return {
        id,
        moduleId,
        type,
        title,
        description,
        image: getString(record.image),
        route,
        category: getString(record.category),
        location: getLocation(record),
        price: record.price,
        accent: config.accent,
        icon: config.icon,
        label: config.label,
        score: getScore(record),
        createdAt: getCreatedAt(record),
      };
    })
    .filter((item): item is OpportunityCard => item !== null)
    .sort((a, b) => {
      /**
       * Le score backend reste prioritaire.
       *
       * La fraîcheur sert uniquement de départage lorsque
       * les scores sont identiques ou absents.
       */
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return (b.createdAt ?? 0) - (a.createdAt ?? 0);
    })
    .slice(0, maxItems);
}

/* ============================================================================
 * SKELETON
 * ========================================================================== */

function RadarSkeleton() {
  return (
    <View className="mx-5 mt-4">
      <View
        className="overflow-hidden rounded-[30px] p-4"
        style={{ borderWidth: 1, borderColor: "rgba(255,255,255,.07)", borderStyle: "solid" }}
      >
        <View className="flex items-center gap-3">
          <View
            className="h-11 w-11 animate-pulse rounded-2xl"
            style={{ backgroundColor: "rgba(139,92,246,.14)" }}
          />

          <View className="flex-1 space-y-2">
            <View
              className="h-3 w-32 animate-pulse rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,.09)" }}
            />

            <View
              className="h-2.5 w-52 animate-pulse rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,.055)" }}
            />
          </View>
        </View>

        <View className="mt-4 gap-2">
          {[0, 1, 2].map((item) => (
            <View
              key={item}
              className="h-28 animate-pulse rounded-2xl"
              style={{ backgroundColor: "rgba(255,255,255,.045)" }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

/* ============================================================================
 * COMPONENT
 * ========================================================================== */

export default function OpportunityRadar({
  onNavigate,
  maxItems = 3,
}: OpportunityRadarProps) {
  const { isAuthenticated } = useConvexAuth();

  /**
   * SOURCE RÉELLE :
   *
   * getHomeData -> feed.listPersonalizedFeed -> publications backend.
   *
   * Aucun mock ici.
   */
  const home = useQuery(api.home.getHomeData, isAuthenticated ? {} : "skip");

  const opportunities = useMemo(() => {
    if (!home?.feed?.page) {
      return [];
    }

    return normalizeOpportunities(home.feed.page, maxItems);
  }, [home, maxItems]);

  /* --------------------------------------------------------------------------
   * AUTH / NO DATA
   * ------------------------------------------------------------------------ */

  if (!isAuthenticated) {
    return null;
  }

  if (home === undefined) {
    return <RadarSkeleton />;
  }

  if (!home || opportunities.length === 0) {
    return null;
  }

  return (
    <>
      <View
        className="mx-5 mt-4"
        accessibilityLabel="Opportunités"
      >
        <View
          className="relative overflow-hidden rounded-[30px]"
          style={{ borderWidth: 1, borderColor: "rgba(255,255,255,.08)", borderStyle: "solid" }}
        >
          {/* ------------------------------------------------------------------
           * RADAR AMBIENCE
           * ---------------------------------------------------------------- */}

          <View
            className="absolute -right-20 -top-24 h-52 w-52 rounded-full"
            style={{  }}
          />

          <View
            className="absolute -bottom-28 left-8 h-44 w-44 rounded-full"
            style={{  }}
          />

          {/* ------------------------------------------------------------------
           * HEADER
           * ---------------------------------------------------------------- */}

          <View className="relative flex items-center gap-3 px-4 pb-3 pt-4">
            <View
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
              style={{ borderWidth: 1, borderColor: "rgba(52,211,153,.22)", borderStyle: "solid" }}
            >
              <Radar size={20} className="text-emerald-300" strokeWidth={2} />

              <Text
                className="absolute inset-1 rounded-full"
                style={{ borderTopWidth: 1, borderTopColor: "rgba(52,211,153,.7)", borderTopStyle: "solid", borderRightWidth: 1, borderRightColor: "transparent", borderRightStyle: "solid", borderBottomWidth: 1, borderBottomColor: "transparent", borderBottomStyle: "solid", borderLeftWidth: 1, borderLeftColor: "transparent", borderLeftStyle: "solid" }}
              />
            </View>

            <View className="min-w-0 flex-1">
              <View className="flex items-center gap-2">
                <Text className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">
                  Radar
                </Text>

                <Text
                  className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                 
                />

                <Text className="text-[9px] font-semibold text-white/25">
                  en direct
                </Text>
              </View>

              <Text className="mt-0.5 text-[15px] font-bold text-white">
                Des opportunités à saisir
              </Text>

              <Text className="mt-0.5 text-[10px] text-white/40">
                Sélectionnées depuis votre flux réel.
              </Text>
            </View>

            <Sparkles size={15} className="shrink-0 text-white/25" />
          </View>

          {/* ------------------------------------------------------------------
           * CARDS
           * ---------------------------------------------------------------- */}

          <View className="relative gap-2 px-3 pb-3">
            {opportunities.map((opportunity, index) => {
              const Icon = opportunity.icon;
              const time = relativeDate(opportunity.createdAt);
              const price = formatPrice(opportunity.price);

              return (
                <Pressable
                  key={opportunity.id}
                  type="button"
                  onPress={() => onNavigate(opportunity.route)}
                  className="group relative min-w-0 overflow-hidden rounded-[23px] p-3 text-left"
                  style={{ backgroundColor: "rgba(255,255,255,.045)", borderWidth: 1, borderColor: "rgba(255,255,255,.065)", borderStyle: "solid" }}
                >
                  {/* Image */}
                  {opportunity.image && (
                    <View className="relative mb-3 h-24 overflow-hidden rounded-[17px]">
                      <Image
                       
                       
                        loading="lazy"
                        className="h-full w-full object-cover"
                       source={{ uri: opportunity.image }} accessibilityLabel=""/>

                      <View
                        className="absolute inset-0"
                        style={{  }}
                      />

                      <View
                        className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${opportunity.accent}DD` }}
                      >
                        <Icon
                          size={13}
                          className="text-white"
                          strokeWidth={2.2}
                        />
                      </View>

                      {time && (
                        <Text className="absolute bottom-2 right-2 rounded-full bg-black/45 px-2 py-1 text-[8px] font-semibold text-white/75">
                          {time}
                        </Text>
                      )}
                    </View>
                  )}

                  {/* No image visual */}
                  {!opportunity.image && (
                    <View
                      className="mb-3 flex h-16 items-center gap-2 rounded-[17px] px-3"
                      style={{ borderStyle: "solid" }}
                    >
                      <View
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${opportunity.accent}20` }}
                      >
                        <Icon
                          size={16}
                          style={{
                            color: opportunity.accent,
                          }}
                        />
                      </View>

                      <Text
                        className="truncate text-[9px] font-bold"
                        style={{
                          color: opportunity.accent,
                        }}
                      >
                        {opportunity.label}
                      </Text>
                    </View>
                  )}

                  {/* Type */}
                  <View className="flex items-center gap-1.5">
                    <Text
                      className="text-[8px] font-black uppercase tracking-[0.08em]"
                      style={{
                        color: opportunity.accent,
                      }}
                    >
                      {opportunity.label}
                    </Text>

                    {index === 0 && (
                      <Text
                        className="rounded-full px-1.5 py-0.5 text-[7px] font-black uppercase"
                        style={{ color: "#A7F3D0", backgroundColor: "rgba(16,185,129,.10)", borderWidth: 1, borderColor: "rgba(16,185,129,.18)", borderStyle: "solid" }}
                      >
                        À saisir
                      </Text>
                    )}
                  </View>

                  {/* Title */}
                  <Text className="mt-1.5 min-h-[32px] text-[12px] font-bold leading-tight text-white">
                    {opportunity.title}
                  </Text>

                  {/* Description */}
                  <Text className="mt-1 text-[9px] leading-relaxed text-white/35">
                    {opportunity.description}
                  </Text>

                  {/* Meta */}
                  <View className="mt-3 flex min-h-[18px] items-center gap-2">
                    {opportunity.location && (
                      <Text className="flex min-w-0 items-center gap-1 text-[8px] text-white/30">
                        <MapPin size={9} className="shrink-0" />
                        <Text className="truncate">{opportunity.location}</Text>
                      </Text>
                    )}

                    {price && (
                      <Text
                        className="ml-auto shrink-0 text-[9px] font-black"
                        style={{
                          color: opportunity.accent,
                        }}
                      >
                        {price}
                      </Text>
                    )}
                  </View>

                  {/* CTA */}
                  <View
                    className="mt-3 flex items-center justify-between border-t pt-2.5"
                    style={{
                      borderColor: "rgba(255,255,255,.055)",
                    }}
                  >
                    <Text className="text-[8px] font-semibold text-white/30">
                      Découvrir
                    </Text>

                    <View
                      className="flex h-6 w-6 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${opportunity.accent}12` }}
                    >
                      <ChevronRight
                        size={12}
                        style={{
                          color: opportunity.accent,
                        }}
                      />
                    </View>
                  </View>

                  {/* Hover glow */}
                  <View
                    className="absolute inset-0 opacity-0"
                    style={{  }}
                  />
                </Pressable>
              );
            })}
          </View>

          {/* ------------------------------------------------------------------
           * FOOTER
           * ---------------------------------------------------------------- */}

          <View
            className="relative flex items-center gap-2 border-t px-4 py-2.5"
            style={{
              borderColor: "rgba(255,255,255,.055)",
            }}
          >
            <View
              className="flex h-5 w-5 items-center justify-center rounded-lg"
              style={{ backgroundColor: "rgba(52,211,153,.09)" }}
            >
              <MapPin size={10} className="text-emerald-300" />
            </View>

            <Text className="text-[9px] font-medium text-white/30">
              <Text>Le radar évolue avec votre activité et votre flux.</Text></Text>

            <Pressable
              type="button"
              onPress={() => onNavigate("explorer")}
              className="ml-auto flex shrink-0 items-center gap-1 text-[9px] font-bold text-emerald-300"
            >
              <Text>Tout voir</Text><ArrowRight size={10} />
            </Pressable>
          </View>
        </View>
      </View>
    </>
  );
}
