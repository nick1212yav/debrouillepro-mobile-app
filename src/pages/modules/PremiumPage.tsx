// src/pages/modules/PremiumPage.tsx

import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";

import { useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api.js";

import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
} from "@/lib/convex-auth-compat";

import { SignInButton } from "@/components/ui/signin.tsx";

import {
  AlertCircle,
  BarChart3,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Crown,
  Gift,
  Headphones,
  Lock,
  Package,
  RefreshCw,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Wifi,
  X,
  Zap,
} from "lucide-react-native";

/* ============================================================================
 * TYPES
 * ========================================================================== */

type PlanId = "gratuit" | "pro" | "business";

type BillingCycle = "mensuel" | "annuel";

type PlanFeatureValue = boolean | string;

type PlanFeature = {
  label: string;
  gratuit: PlanFeatureValue;
  pro: PlanFeatureValue;
  business: PlanFeatureValue;
};

type Plan = {
  id: PlanId;
  nom: string;
  tagline: string;
  prix: {
    mensuel: number;
    annuel: number;
  };
  accent: string;
  icon: ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  badge?: string;
  populaire?: boolean;
};

type Perk = {
  icon: ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  label: string;
  color: string;
};

type PremiumPageProps = {
  onBack: () => void;
};

/* ============================================================================
 * PLAN CONFIGURATION
 *
 * Ces valeurs correspondent à la configuration affichée par le fichier
 * source fourni. Elles ne constituent pas une preuve qu'un moyen de paiement
 * ou une devise particulière est déjà opérationnel partout.
 * ========================================================================== */

const PLANS: Plan[] = [
  {
    id: "gratuit",
    nom: "Gratuit",
    tagline: "L'essentiel pour démarrer",
    prix: {
      mensuel: 0,
      annuel: 0,
    },
    accent: "#9CA3AF",
    icon: Zap,
  },
  {
    id: "pro",
    nom: "Pro",
    tagline: "Pour les utilisateurs actifs",
    prix: {
      mensuel: 2500,
      annuel: 24000,
    },
    accent: "#8B5CF6",
    icon: Crown,
    badge: "Populaire",
    populaire: true,
  },
  {
    id: "business",
    nom: "Business",
    tagline: "Pour les entrepreneurs",
    prix: {
      mensuel: 7500,
      annuel: 72000,
    },
    accent: "#F59E0B",
    icon: Building2,
    badge: "Premium",
  },
];

const FEATURES: PlanFeature[] = [
  {
    label: "Modules de base",
    gratuit: true,
    pro: true,
    business: true,
  },
  {
    label: "Messages",
    gratuit: "20/mois",
    pro: "Illimités",
    business: "Illimités",
  },
  {
    label: "Stockage documents",
    gratuit: "100 Mo",
    pro: "5 Go",
    business: "50 Go",
  },
  {
    label: "Annonces marketplace",
    gratuit: "3 actives",
    pro: "20 actives",
    business: "Illimitées",
  },
  {
    label: "Boost d'annonces",
    gratuit: false,
    pro: "2/mois",
    business: "Illimités",
  },
  {
    label: "Badge Premium profil",
    gratuit: false,
    pro: true,
    business: true,
  },
  {
    label: "IA Assistant avancé",
    gratuit: "10 req/jour",
    pro: "Illimité",
    business: "Illimité + priorité",
  },
  {
    label: "Analytics avancés",
    gratuit: false,
    pro: true,
    business: true,
  },
  {
    label: "Export de données",
    gratuit: false,
    pro: "CSV",
    business: "CSV + PDF",
  },
  {
    label: "Support client",
    gratuit: "Communauté",
    pro: "Email 48h",
    business: "Prioritaire 4h",
  },
  {
    label: "Accès anticipé features",
    gratuit: false,
    pro: true,
    business: true,
  },
  {
    label: "Dashboard vendeur Pro",
    gratuit: false,
    pro: false,
    business: true,
  },
  {
    label: "API & intégrations",
    gratuit: false,
    pro: false,
    business: true,
  },
  {
    label: "Compte multi-utilisateurs",
    gratuit: false,
    pro: false,
    business: "Jusqu'à 5",
  },
];

const PLAN_PERKS: Record<PlanId, Perk[]> = {
  gratuit: [
    {
      icon: Zap,
      label: "Accès aux modules essentiels",
      color: "#9CA3AF",
    },
    {
      icon: Users,
      label: "Communauté de base",
      color: "#9CA3AF",
    },
    {
      icon: Package,
      label: "3 annonces marketplace",
      color: "#9CA3AF",
    },
  ],

  pro: [
    {
      icon: Crown,
      label: "Badge Pro sur le profil",
      color: "#8B5CF6",
    },
    {
      icon: Sparkles,
      label: "IA avancée",
      color: "#6366F1",
    },
    {
      icon: BarChart3,
      label: "Analytics complets",
      color: "#8B5CF6",
    },
    {
      icon: Shield,
      label: "Support email prioritaire",
      color: "#6366F1",
    },
    {
      icon: Wifi,
      label: "Synchronisation hors ligne avancée",
      color: "#8B5CF6",
    },
    {
      icon: Gift,
      label: "Accès anticipé aux fonctionnalités",
      color: "#6366F1",
    },
  ],

  business: [
    {
      icon: Building2,
      label: "Dashboard vendeur complet",
      color: "#F59E0B",
    },
    {
      icon: TrendingUp,
      label: "Rapports financiers",
      color: "#F97316",
    },
    {
      icon: Users,
      label: "Jusqu'à 5 collaborateurs",
      color: "#F59E0B",
    },
    {
      icon: Headphones,
      label: "Support prioritaire",
      color: "#F97316",
    },
    {
      icon: Zap,
      label: "API & intégrations tierces",
      color: "#F59E0B",
    },
    {
      icon: Gift,
      label: "Boosts selon les limites du plan",
      color: "#F97316",
    },
  ],
};

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(amount);
}

function getPlan(id: PlanId): Plan {
  return PLANS.find((plan) => plan.id === id) ?? PLANS[0];
}

function getPlanPrice(plan: Plan, billing: BillingCycle): string {
  const amount = plan.prix[billing];

  if (amount === 0) {
    return "Gratuit";
  }

  return `${formatAmount(amount)} FCFA`;
}

function getMonthlyEquivalent(plan: Plan): string | null {
  if (plan.prix.annuel <= 0) {
    return null;
  }

  return `${formatAmount(Math.round(plan.prix.annuel / 12))} FCFA/mois`;
}

function getAnnualSaving(plan: Plan): number | null {
  if (plan.prix.mensuel <= 0) {
    return null;
  }

  const saving = plan.prix.mensuel * 12 - plan.prix.annuel;

  return saving > 0 ? saving : null;
}

function formatSubscriptionDate(value?: string | null): string {
  if (!value) {
    return "Non communiqué";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Non communiqué";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/* ============================================================================
 * FEATURE VALUE
 * ========================================================================== */

function FeatureValue({ value }: { value: PlanFeatureValue }) {
  if (value === true) {
    return (
      <View style={styles.featureCheck}>
        <Check size={13} color="#4ADE80" strokeWidth={3} />
      </View>
    );
  }

  if (value === false) {
    return (
      <View style={styles.featureUnavailable}>
        <X size={12} color="rgba(255,255,255,0.2)" />
      </View>
    );
  }

  return (
    <Text style={styles.featureValue} numberOfLines={2}>
      {value}
    </Text>
  );
}

/* ============================================================================
 * HEADER
 * ========================================================================== */

function PageHeader({
  onBack,
  currentPlan,
}: {
  onBack: () => void;
  currentPlan: Plan;
}) {
  const CurrentIcon = currentPlan.icon;

  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Retour"
        style={styles.headerBack}
      >
        <ArrowLeft size={19} color="#FFFFFF" />
      </Pressable>

      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>Premium</Text>

        <Text style={styles.headerSubtitle}>Abonnements et plans</Text>
      </View>

      {currentPlan.id !== "gratuit" && (
        <View
          style={[
            styles.currentPlanBadge,
            {
              borderColor: currentPlan.accent + "55",
              backgroundColor: currentPlan.accent + "18",
            },
          ]}
        >
          <CurrentIcon size={13} color={currentPlan.accent} />

          <Text
            style={[
              styles.currentPlanText,
              {
                color: currentPlan.accent,
              },
            ]}
          >
            {currentPlan.nom}
          </Text>
        </View>
      )}
    </View>
  );
}

/* ============================================================================
 * BILLING SELECTOR
 * ========================================================================== */

function BillingSelector({
  billing,
  onChange,
}: {
  billing: BillingCycle;
  onChange: (value: BillingCycle) => void;
}) {
  return (
    <View style={styles.billingWrapper}>
      <View style={styles.billingSelector}>
        <Pressable
          onPress={() => onChange("mensuel")}
          style={[
            styles.billingOption,
            billing === "mensuel" && styles.billingOptionActive,
          ]}
        >
          <Text
            style={[
              styles.billingText,
              billing === "mensuel" && styles.billingTextActive,
            ]}
          >
            Mensuel
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onChange("annuel")}
          style={[
            styles.billingOption,
            billing === "annuel" && styles.billingOptionActive,
          ]}
        >
          <Text
            style={[
              styles.billingText,
              billing === "annuel" && styles.billingTextActive,
            ]}
          >
            Annuel
          </Text>

          <View style={styles.savingBadge}>
            <Text style={styles.savingBadgeText}>-20%</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

/* ============================================================================
 * PLAN CARD
 * ========================================================================== */

function PlanCard({
  plan,
  currentPlan,
  billing,
  onSelect,
}: {
  plan: Plan;
  currentPlan: PlanId;
  billing: BillingCycle;
  onSelect: (planId: PlanId) => void;
}) {
  const Icon = plan.icon;

  const isCurrent = plan.id === currentPlan;

  const saving = billing === "annuel" ? getAnnualSaving(plan) : null;

  return (
    <View style={[styles.planCard, plan.populaire && styles.planCardPopular]}>
      <View
        style={[
          styles.planAccent,
          {
            backgroundColor: plan.accent,
          },
        ]}
      />

      {plan.badge && (
        <View
          style={[
            styles.planBadge,
            {
              backgroundColor: plan.accent + "20",
              borderColor: plan.accent + "40",
            },
          ]}
        >
          <Text
            style={[
              styles.planBadgeText,
              {
                color: plan.accent,
              },
            ]}
          >
            {plan.badge}
          </Text>
        </View>
      )}

      <View style={styles.planBody}>
        <View style={styles.planIdentity}>
          <View
            style={[
              styles.planIcon,
              {
                backgroundColor: plan.accent + "18",
                borderColor: plan.accent + "35",
              },
            ]}
          >
            <Icon size={23} color={plan.accent} />
          </View>

          <View style={styles.planIdentityText}>
            <Text style={styles.planName}>{plan.nom}</Text>

            <Text style={styles.planTagline}>{plan.tagline}</Text>
          </View>
        </View>

        <View style={styles.priceBlock}>
          <View style={styles.priceLine}>
            <Text style={styles.price}>{getPlanPrice(plan, billing)}</Text>

            {plan.id !== "gratuit" && (
              <Text style={styles.pricePeriod}>
                /{billing === "annuel" ? "an" : "mois"}
              </Text>
            )}
          </View>

          {billing === "annuel" && getMonthlyEquivalent(plan) && (
            <Text style={styles.monthlyEquivalent}>
              Équivalent à {getMonthlyEquivalent(plan)}
            </Text>
          )}

          {saving && (
            <Text style={styles.annualSaving}>
              Économie de {formatAmount(saving)} FCFA/an
            </Text>
          )}
        </View>

        <View style={styles.perks}>
          {PLAN_PERKS[plan.id].map((perk) => {
            const PerkIcon = perk.icon;

            return (
              <View key={perk.label} style={styles.perkRow}>
                <View
                  style={[
                    styles.perkIcon,
                    {
                      backgroundColor: perk.color + "18",
                    },
                  ]}
                >
                  <PerkIcon size={12} color={perk.color} />
                </View>

                <Text style={styles.perkText} numberOfLines={2}>
                  {perk.label}
                </Text>
              </View>
            );
          })}
        </View>

        {isCurrent ? (
          <View style={styles.currentButton}>
            <CheckCircle2 size={16} color={plan.accent} />

            <Text
              style={[
                styles.currentButtonText,
                {
                  color: plan.accent,
                },
              ]}
            >
              Plan actuel
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={() => onSelect(plan.id)}
            style={[
              styles.planButton,
              {
                backgroundColor: plan.accent,
              },
            ]}
            accessibilityRole="button"
          >
            <Sparkles size={15} color="#FFFFFF" />

            <Text style={styles.planButtonText}>
              {plan.id === "gratuit"
                ? "Choisir Gratuit"
                : plan.id === "business"
                  ? "Passer à Business"
                  : "Passer à Pro"}
            </Text>

            <ChevronRight size={15} color="#FFFFFF" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

/* ============================================================================
 * COMPARISON
 * ========================================================================== */

function ComparisonTable() {
  return (
    <View style={styles.comparisonCard}>
      <View style={styles.comparisonHeader}>
        <Text style={styles.comparisonTitle}>Comparaison détaillée</Text>

        <Text style={styles.comparisonSubtitle}>
          Comparez les fonctionnalités disponibles par plan.
        </Text>
      </View>

      <View style={styles.comparisonColumns}>
        <View style={styles.comparisonFeatureColumn}>
          <Text style={styles.columnHeader}>Fonctionnalité</Text>
        </View>

        {PLANS.map((plan) => (
          <View key={plan.id} style={styles.comparisonPlanColumn}>
            <Text
              style={[
                styles.columnHeader,
                {
                  color: plan.accent,
                },
              ]}
            >
              {plan.nom}
            </Text>
          </View>
        ))}
      </View>

      {FEATURES.map((feature, index) => (
        <View
          key={feature.label}
          style={[
            styles.comparisonRow,
            index % 2 === 1 && styles.comparisonRowAlt,
          ]}
        >
          <View style={styles.comparisonFeatureColumn}>
            <Text style={styles.comparisonFeatureText}>{feature.label}</Text>
          </View>

          <View style={styles.comparisonPlanColumn}>
            <FeatureValue value={feature.gratuit} />
          </View>

          <View style={styles.comparisonPlanColumn}>
            <FeatureValue value={feature.pro} />
          </View>

          <View style={styles.comparisonPlanColumn}>
            <FeatureValue value={feature.business} />
          </View>
        </View>
      ))}
    </View>
  );
}

/* ============================================================================
 * BENEFITS
 * ========================================================================== */

function BenefitsTab({ currentPlan }: { currentPlan: Plan }) {
  const Icon = currentPlan.icon;

  const benefits: Array<{
    title: string;
    description: string;
    icon: ComponentType<{
      size?: number;
      color?: string;
      strokeWidth?: number;
    }>;
    color: string;
  }> = [
    {
      title: "IA Assistant avancé",
      description:
        "Fonctionnalités IA selon les limites et capacités prévues par votre plan.",
      icon: Sparkles,
      color: "#8B5CF6",
    },
    {
      title: "Analytics",
      description:
        "Accédez aux outils analytiques prévus par votre niveau d'abonnement.",
      icon: BarChart3,
      color: "#3B82F6",
    },
    {
      title: "Protection et sécurité",
      description:
        "Des fonctionnalités de protection et de contrôle supplémentaires selon le plan.",
      icon: Shield,
      color: "#10B981",
    },
    {
      title: "Support",
      description: "Le niveau de support dépend du plan sélectionné.",
      icon: Headphones,
      color: "#EC4899",
    },
    {
      title: "Accès anticipé",
      description:
        "Certaines nouvelles fonctionnalités peuvent être proposées en accès anticipé.",
      icon: Zap,
      color: "#F97316",
    },
    {
      title: "Collaboration",
      description:
        "Les fonctions collaboratives disponibles dépendent du plan Business.",
      icon: Users,
      color: "#6366F1",
    },
  ];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.benefitHero,
          {
            borderColor: currentPlan.accent + "35",
          },
        ]}
      >
        <View
          style={[
            styles.benefitHeroIcon,
            {
              backgroundColor: currentPlan.accent + "18",
            },
          ]}
        >
          <Icon size={29} color={currentPlan.accent} />
        </View>

        <View style={styles.benefitHeroContent}>
          <Text style={styles.benefitHeroTitle}>Plan {currentPlan.nom}</Text>

          <Text style={styles.benefitHeroText}>{currentPlan.tagline}</Text>
        </View>
      </View>

      {currentPlan.id !== "gratuit" && (
        <View style={styles.activeValueCard}>
          <View style={styles.activeValueHeader}>
            <View>
              <Text style={styles.activeValueTitle}>Votre plan actif</Text>

              <Text style={styles.activeValueSubtitle}>
                Fonctionnalités associées
              </Text>
            </View>

            <CheckCircle2 size={20} color="#4ADE80" />
          </View>

          <View style={styles.activeValueGrid}>
            {PLAN_PERKS[currentPlan.id].slice(0, 4).map((perk) => {
              const PerkIcon = perk.icon;

              return (
                <View key={perk.label} style={styles.activeValueItem}>
                  <PerkIcon size={14} color={perk.color} />

                  <Text style={styles.activeValueItemText} numberOfLines={2}>
                    {perk.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.benefitList}>
        {benefits.map((benefit) => {
          const BenefitIcon = benefit.icon;

          return (
            <View key={benefit.title} style={styles.benefitCard}>
              <View
                style={[
                  styles.benefitIcon,
                  {
                    backgroundColor: benefit.color + "18",
                  },
                ]}
              >
                <BenefitIcon size={19} color={benefit.color} />
              </View>

              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>

                <Text style={styles.benefitDescription}>
                  {benefit.description}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

/* ============================================================================
 * MANAGEMENT
 * ========================================================================== */

function ManagementTab({
  subscription,
  currentPlan,
  onAutoRenew,
  onUpgrade,
  onCancel,
}: {
  subscription:
    | {
        status?: string;
        billingCycle?: BillingCycle;
        renewsAt?: string;
        paymentMethod?: string;
        autoRenew?: boolean;
      }
    | null
    | undefined;
  currentPlan: Plan;
  onAutoRenew: () => void;
  onUpgrade: () => void;
  onCancel: () => void;
}) {
  if (subscription === undefined) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.loadingStack}>
          <SkeletonBlock />
          <SkeletonBlock />
          <SkeletonBlock />
        </View>
      </ScrollView>
    );
  }

  const isActive = subscription?.status === "active";

  if (!isActive) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.noSubscription}>
          <View style={styles.noSubscriptionIcon}>
            <Package size={31} color="rgba(255,255,255,0.32)" />
          </View>

          <Text style={styles.noSubscriptionTitle}>Aucun abonnement actif</Text>

          <Text style={styles.noSubscriptionText}>
            Choisissez un plan pour accéder aux fonctionnalités correspondantes.
          </Text>
        </View>

        <Pressable onPress={onUpgrade} style={styles.managementPrimaryButton}>
          <Crown size={16} color="#FFFFFF" />

          <Text style={styles.managementPrimaryText}>Voir les plans</Text>
        </Pressable>
      </ScrollView>
    );
  }

  const PlanIcon = currentPlan.icon;

  const billingLabel =
    subscription.billingCycle === "annuel" ? "Annuel" : "Mensuel";

  const selectedPrice = subscription.billingCycle
    ? currentPlan.prix[subscription.billingCycle]
    : 0;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.subscriptionCard,
          {
            borderColor: currentPlan.accent + "38",
          },
        ]}
      >
        <View
          style={[
            styles.subscriptionTopLine,
            {
              backgroundColor: currentPlan.accent,
            },
          ]}
        />

        <View style={styles.subscriptionHeader}>
          <View
            style={[
              styles.subscriptionIcon,
              {
                backgroundColor: currentPlan.accent + "18",
              },
            ]}
          >
            <PlanIcon size={20} color={currentPlan.accent} />
          </View>

          <View style={styles.subscriptionIdentity}>
            <Text style={styles.subscriptionPlan}>Plan {currentPlan.nom}</Text>

            <Text style={styles.subscriptionBilling}>
              {billingLabel}
              {selectedPrice > 0
                ? ` · ${formatAmount(selectedPrice)} FCFA`
                : ""}
            </Text>
          </View>

          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />

            <Text style={styles.activeBadgeText}>Actif</Text>
          </View>
        </View>

        <View style={styles.subscriptionRows}>
          <SubscriptionRow
            icon={Calendar}
            label="Renouvellement"
            value={formatSubscriptionDate(subscription.renewsAt)}
          />

          <SubscriptionRow
            icon={CreditCard}
            label="Moyen de paiement"
            value={subscription.paymentMethod ?? "Non communiqué"}
          />

          <SubscriptionRow
            icon={RefreshCw}
            label="Renouvellement automatique"
            value={subscription.autoRenew ? "Activé" : "Désactivé"}
          />
        </View>
      </View>

      <View style={styles.managementActions}>
        <ManagementAction
          icon={RefreshCw}
          title={
            subscription.autoRenew
              ? "Désactiver le renouvellement"
              : "Activer le renouvellement"
          }
          subtitle={
            subscription.autoRenew
              ? "Votre abonnement ne sera plus renouvelé automatiquement."
              : "Permettre le renouvellement automatique."
          }
          color="#3B82F6"
          onPress={onAutoRenew}
        />

        {currentPlan.id !== "business" && (
          <ManagementAction
            icon={ChevronRight}
            title="Passer à Business"
            subtitle="Consulter le plan Business."
            color="#F59E0B"
            onPress={onUpgrade}
          />
        )}
      </View>

      <View style={styles.managementSecurity}>
        <Shield size={17} color="#4ADE80" />

        <Text style={styles.managementSecurityText}>
          Les informations de paiement et le traitement financier dépendent du
          système de paiement réellement connecté au backend.
        </Text>
      </View>

      <Pressable onPress={onCancel} style={styles.cancelSubscriptionButton}>
        <AlertCircle size={16} color="#F87171" />

        <Text style={styles.cancelSubscriptionText}>Annuler l'abonnement</Text>
      </Pressable>
    </ScrollView>
  );
}

/* ============================================================================
 * SUBSCRIPTION ROW
 * ========================================================================== */

function SubscriptionRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.subscriptionRow}>
      <View style={styles.subscriptionRowIcon}>
        <Icon size={14} color="rgba(255,255,255,0.42)" />
      </View>

      <View style={styles.subscriptionRowContent}>
        <Text style={styles.subscriptionRowLabel}>{label}</Text>

        <Text style={styles.subscriptionRowValue}>{value}</Text>
      </View>
    </View>
  );
}

/* ============================================================================
 * MANAGEMENT ACTION
 * ========================================================================== */

function ManagementAction({
  icon: Icon,
  title,
  subtitle,
  color,
  onPress,
}: {
  icon: ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.managementAction,
        pressed && styles.managementActionPressed,
      ]}
    >
      <View
        style={[
          styles.managementActionIcon,
          {
            backgroundColor: color + "18",
          },
        ]}
      >
        <Icon size={16} color={color} />
      </View>

      <View style={styles.managementActionContent}>
        <Text style={styles.managementActionTitle}>{title}</Text>

        <Text style={styles.managementActionSubtitle}>{subtitle}</Text>
      </View>

      <ChevronRight size={16} color="rgba(255,255,255,0.25)" />
    </Pressable>
  );
}

/* ============================================================================
 * SKELETON
 * ========================================================================== */

function SkeletonBlock() {
  return <View style={styles.skeletonSubscription} />;
}

/* ============================================================================
 * UPGRADE MODAL
 * ========================================================================== */

function UpgradeModal({
  visible,
  plan,
  billing,
  saving,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  plan: Plan | null;
  billing: BillingCycle;
  saving: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!plan) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (!saving) {
          onClose();
        }
      }}
    >
      <View style={styles.modalRoot}>
        <Pressable
          onPress={() => {
            if (!saving) {
              onClose();
            }
          }}
          style={styles.modalBackdrop}
        />

        <View style={styles.modalCard}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <View
              style={[
                styles.modalPlanIcon,
                {
                  backgroundColor: plan.accent + "18",
                },
              ]}
            >
              <plan.icon size={25} color={plan.accent} />
            </View>

            <View style={styles.modalHeaderText}>
              <Text style={styles.modalTitle}>Passer à {plan.nom}</Text>

              <Text style={styles.modalSubtitle}>
                {getPlanPrice(plan, billing)} /{" "}
                {billing === "annuel" ? "an" : "mois"}
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              disabled={saving}
              style={styles.modalClose}
            >
              <X size={18} color="rgba(255,255,255,0.55)" />
            </Pressable>
          </View>

          <View style={styles.confirmationBox}>
            <CreditCard size={17} color="#A78BFA" />

            <Text style={styles.confirmationText}>
              Vous allez demander l'activation du plan {plan.nom}. Le traitement
              du paiement dépend du flux financier réellement implémenté par le
              backend.
            </Text>
          </View>

          <View style={styles.modalPerks}>
            {PLAN_PERKS[plan.id].slice(0, 4).map((perk) => {
              const PerkIcon = perk.icon;

              return (
                <View key={perk.label} style={styles.modalPerk}>
                  <PerkIcon size={13} color={perk.color} />

                  <Text style={styles.modalPerkText}>{perk.label}</Text>
                </View>
              );
            })}
          </View>

          <Pressable
            onPress={onConfirm}
            disabled={saving}
            style={[
              styles.confirmButton,
              {
                backgroundColor: plan.accent,
              },
              saving && styles.disabledButton,
            ]}
          >
            <Sparkles size={16} color="#FFFFFF" />

            <Text style={styles.confirmButtonText}>
              {saving ? "Traitement..." : "Confirmer"}
            </Text>
          </Pressable>

          <Pressable
            onPress={onClose}
            disabled={saving}
            style={styles.modalSecondaryButton}
          >
            <Text style={styles.modalSecondaryText}>Retour</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/* ============================================================================
 * CANCEL MODAL
 * ========================================================================== */

function CancelModal({
  visible,
  currentPlan,
  saving,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  currentPlan: Plan;
  saving: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (!saving) {
          onClose();
        }
      }}
    >
      <View style={styles.modalRoot}>
        <Pressable
          onPress={() => {
            if (!saving) {
              onClose();
            }
          }}
          style={styles.modalBackdrop}
        />

        <View style={styles.modalCard}>
          <View style={styles.modalHandle} />

          <View style={styles.cancelHeader}>
            <View style={styles.cancelIcon}>
              <AlertCircle size={23} color="#F87171" />
            </View>

            <View style={styles.modalHeaderText}>
              <Text style={styles.modalTitle}>Annuler l'abonnement ?</Text>

              <Text style={styles.modalSubtitle}>
                Plan actuel : {currentPlan.nom}
              </Text>
            </View>
          </View>

          <View style={styles.cancelWarning}>
            <Lock size={16} color="#F87171" />

            <Text style={styles.cancelWarningText}>
              L'annulation modifie l'état de votre abonnement selon les règles
              appliquées par le backend.
            </Text>
          </View>

          <View style={styles.cancelActions}>
            <Pressable
              onPress={onClose}
              disabled={saving}
              style={styles.keepPlanButton}
            >
              <Text style={styles.keepPlanText}>Garder mon plan</Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              disabled={saving}
              style={[
                styles.confirmCancelButton,
                saving && styles.disabledButton,
              ]}
            >
              <Text style={styles.confirmCancelText}>
                {saving ? "Traitement..." : "Confirmer"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ============================================================================
 * MAIN
 * ========================================================================== */

function PremiumInner({ onBack }: PremiumPageProps) {
  const subscription = useQuery(api.subscriptions.getMySubscription, {});

  const subscribeToPlan = useMutation(api.subscriptions.subscribeToPlan);

  const cancelSubscription = useMutation(api.subscriptions.cancelSubscription);

  const toggleAutoRenew = useMutation(api.subscriptions.toggleAutoRenew);

  const [tab, setTab] = useState<"plans" | "avantages" | "gestion">("plans");

  const [billing, setBilling] = useState<BillingCycle>("annuel");

  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);

  const [showUpgrade, setShowUpgrade] = useState(false);

  const [showCancel, setShowCancel] = useState(false);

  const [mutationBusy, setMutationBusy] = useState(false);

  const currentPlanId: PlanId =
    subscription?.planId === "pro" || subscription?.planId === "business"
      ? subscription.planId
      : "gratuit";

  const currentPlan = useMemo(() => getPlan(currentPlanId), [currentPlanId]);

  const selectedPlanData = selectedPlan ? getPlan(selectedPlan) : null;

  const requestPlanChange = (planId: PlanId) => {
    if (planId === currentPlanId) {
      return;
    }

    setSelectedPlan(planId);
    setShowUpgrade(true);
  };

  const confirmPlanChange = async () => {
    if (!selectedPlan || mutationBusy) {
      return;
    }

    setMutationBusy(true);

    try {
      await subscribeToPlan({
        planId: selectedPlan,
        billingCycle: billing,
      });

      setShowUpgrade(false);
      setSelectedPlan(null);

      Alert.alert(
        "Abonnement",
        "La demande de changement d'abonnement a été traitée par le backend.",
      );
    } catch {
      Alert.alert(
        "Abonnement",
        "Impossible de modifier l'abonnement. Vérifiez votre connexion puis réessayez.",
      );
    } finally {
      setMutationBusy(false);
    }
  };

  const confirmCancel = async () => {
    if (mutationBusy) {
      return;
    }

    setMutationBusy(true);

    try {
      await cancelSubscription({});

      setShowCancel(false);

      Alert.alert(
        "Abonnement",
        "La demande d'annulation a été traitée par le backend.",
      );
    } catch {
      Alert.alert("Abonnement", "Impossible d'annuler l'abonnement.");
    } finally {
      setMutationBusy(false);
    }
  };

  const handleAutoRenew = async () => {
    if (mutationBusy) {
      return;
    }

    setMutationBusy(true);

    try {
      await toggleAutoRenew({});

      Alert.alert(
        "Renouvellement",
        "Le renouvellement automatique a été mis à jour.",
      );
    } catch {
      Alert.alert(
        "Renouvellement",
        "Impossible de modifier le renouvellement automatique.",
      );
    } finally {
      setMutationBusy(false);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Ambient premium background */}
      <View pointerEvents="none" style={styles.ambientTop} />

      <PageHeader onBack={onBack} currentPlan={currentPlan} />

      {/* ====================================================================
       * TABS
       * ================================================================== */}

      <View style={styles.tabs}>
        <TabButton
          label="Plans"
          active={tab === "plans"}
          icon={Crown}
          onPress={() => setTab("plans")}
        />

        <TabButton
          label="Avantages"
          active={tab === "avantages"}
          icon={Sparkles}
          onPress={() => setTab("avantages")}
        />

        <TabButton
          label="Mon abonnement"
          active={tab === "gestion"}
          icon={CreditCard}
          onPress={() => setTab("gestion")}
        />
      </View>

      {/* ====================================================================
       * PLANS
       * ================================================================== */}

      {tab === "plans" && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.plansIntro}>
            <View>
              <Text style={styles.plansTitle}>Choisissez votre plan</Text>

              <Text style={styles.plansSubtitle}>
                Une expérience adaptée aux particuliers, professionnels et
                entreprises.
              </Text>
            </View>
          </View>

          <BillingSelector billing={billing} onChange={setBilling} />

          <View style={styles.planList}>
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                currentPlan={currentPlanId}
                billing={billing}
                onSelect={requestPlanChange}
              />
            ))}
          </View>

          <ComparisonTable />

          <View style={styles.transparencyNotice}>
            <Shield size={17} color="#60A5FA" />

            <Text style={styles.transparencyText}>
              Les fonctionnalités, tarifs, limites, devises et moyens de
              paiement doivent être configurés et vérifiés côté backend avant
              leur déploiement commercial dans chaque marché.
            </Text>
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>
      )}

      {/* ====================================================================
       * BENEFITS
       * ================================================================== */}

      {tab === "avantages" && <BenefitsTab currentPlan={currentPlan} />}

      {/* ====================================================================
       * MANAGEMENT
       * ================================================================== */}

      {tab === "gestion" && (
        <ManagementTab
          subscription={subscription}
          currentPlan={currentPlan}
          onAutoRenew={() => {
            void handleAutoRenew();
          }}
          onUpgrade={() => {
            if (currentPlanId === "pro") {
              requestPlanChange("business");
            } else {
              setTab("plans");
            }
          }}
          onCancel={() => setShowCancel(true)}
        />
      )}

      {/* ====================================================================
       * MODALS
       * ================================================================== */}

      <UpgradeModal
        visible={showUpgrade}
        plan={selectedPlanData}
        billing={billing}
        saving={mutationBusy}
        onClose={() => {
          if (!mutationBusy) {
            setShowUpgrade(false);
          }
        }}
        onConfirm={() => {
          void confirmPlanChange();
        }}
      />

      <CancelModal
        visible={showCancel}
        currentPlan={currentPlan}
        saving={mutationBusy}
        onClose={() => {
          if (!mutationBusy) {
            setShowCancel(false);
          }
        }}
        onConfirm={() => {
          void confirmCancel();
        }}
      />
    </View>
  );
}

/* ============================================================================
 * TAB BUTTON
 * ========================================================================== */

function TabButton({
  label,
  active,
  icon: Icon,
  onPress,
}: {
  label: string;
  active: boolean;
  icon: ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{
        selected: active,
      }}
      style={[styles.tabButton, active && styles.tabButtonActive]}
    >
      <Icon size={15} color={active ? "#A78BFA" : "rgba(255,255,255,0.38)"} />

      <Text
        style={[styles.tabButtonText, active && styles.tabButtonTextActive]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* ============================================================================
 * PAGE
 * ========================================================================== */

export default function PremiumPage({ onBack }: PremiumPageProps) {
  return (
    <View style={styles.root}>
      <AuthLoading>
        <View style={styles.screen}>
          <View style={styles.header}>
            <Pressable onPress={onBack} style={styles.headerBack}>
              <ArrowLeft size={19} color="#FFFFFF" />
            </Pressable>

            <View style={styles.headerCenter}>
              <View style={styles.loadingTitle} />

              <View style={styles.loadingSubtitle} />
            </View>
          </View>

          <View style={styles.loadingContent}>
            <SkeletonBlock />
            <SkeletonBlock />
            <SkeletonBlock />
          </View>
        </View>
      </AuthLoading>

      <Unauthenticated>
        <View style={styles.screen}>
          <View style={styles.header}>
            <Pressable
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="Retour"
              style={styles.headerBack}
            >
              <ArrowLeft size={19} color="#FFFFFF" />
            </Pressable>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Premium</Text>

              <Text style={styles.headerSubtitle}>Abonnements et plans</Text>
            </View>
          </View>

          <View style={styles.authRequired}>
            <View style={styles.authIcon}>
              <Crown size={32} color="#A78BFA" />
            </View>

            <Text style={styles.authTitle}>Votre espace Premium</Text>

            <Text style={styles.authText}>
              Connectez-vous pour consulter et gérer votre abonnement.
            </Text>

            <SignInButton />

            <Pressable onPress={onBack} style={styles.authBackButton}>
              <ArrowLeft size={15} color="rgba(255,255,255,0.6)" />

              <Text style={styles.authBackText}>Retour</Text>
            </Pressable>
          </View>
        </View>
      </Unauthenticated>

      <Authenticated>
        <PremiumInner onBack={onBack} />
      </Authenticated>
    </View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#050812",
  },

  screen: {
    flex: 1,
    backgroundColor: "#050812",
  },

  ambientTop: {
    position: "absolute",
    top: -100,
    alignSelf: "center",
    width: 300,
    height: 220,
    borderRadius: 150,
    backgroundColor: "rgba(124,58,237,0.06)",
  },

  header: {
    minHeight: 72,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(5,8,18,0.98)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },

  headerBack: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  headerCenter: {
    flex: 1,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },

  headerSubtitle: {
    marginTop: 3,
    color: "rgba(255,255,255,0.38)",
    fontSize: 9,
    fontWeight: "600",
  },

  currentPlanBadge: {
    minHeight: 31,
    paddingHorizontal: 9,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
  },

  currentPlanText: {
    fontSize: 9,
    fontWeight: "900",
  },

  /* ==========================================================================
   * TABS
   * ======================================================================== */

  tabs: {
    minHeight: 59,
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection: "row",
    gap: 6,
    backgroundColor: "rgba(8,10,22,0.98)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  tabButton: {
    flex: 1,
    minHeight: 43,
    paddingHorizontal: 5,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  tabButtonActive: {
    backgroundColor: "rgba(139,92,246,0.12)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.22)",
  },

  tabButtonText: {
    color: "rgba(255,255,255,0.38)",
    fontSize: 9,
    fontWeight: "800",
  },

  tabButtonTextActive: {
    color: "#FFFFFF",
  },

  /* ==========================================================================
   * SCROLL
   * ======================================================================== */

  scroll: {
    flex: 1,
  },

  content: {
    padding: 15,
    paddingBottom: 35,
  },

  plansIntro: {
    marginBottom: 15,
  },

  plansTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  plansSubtitle: {
    maxWidth: 380,
    marginTop: 5,
    color: "rgba(255,255,255,0.38)",
    fontSize: 10,
    lineHeight: 16,
  },

  /* ==========================================================================
   * BILLING
   * ======================================================================== */

  billingWrapper: {
    alignItems: "center",
    marginBottom: 15,
  },

  billingSelector: {
    padding: 4,
    borderRadius: 15,
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  billingOption: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  billingOptionActive: {
    backgroundColor: "rgba(139,92,246,0.16)",
  },

  billingText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    fontWeight: "800",
  },

  billingTextActive: {
    color: "#FFFFFF",
  },

  savingBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: "rgba(34,197,94,0.12)",
  },

  savingBadgeText: {
    color: "#4ADE80",
    fontSize: 7,
    fontWeight: "900",
  },

  /* ==========================================================================
   * PLAN CARDS
   * ======================================================================== */

  planList: {
    gap: 12,
  },

  planCard: {
    overflow: "hidden",
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  planCardPopular: {
    borderColor: "rgba(139,92,246,0.35)",
    backgroundColor: "rgba(139,92,246,0.045)",
  },

  planAccent: {
    height: 3,
    width: "100%",
  },

  planBadge: {
    position: "absolute",
    top: 13,
    right: 13,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
  },

  planBadgeText: {
    fontSize: 8,
    fontWeight: "900",
  },

  planBody: {
    padding: 15,
  },

  planIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingRight: 70,
  },

  planIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  planIdentityText: {
    flex: 1,
  },

  planName: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },

  planTagline: {
    marginTop: 3,
    color: "rgba(255,255,255,0.4)",
    fontSize: 9,
    lineHeight: 14,
  },

  priceBlock: {
    marginTop: 17,
    marginBottom: 15,
  },

  priceLine: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },

  price: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "900",
    letterSpacing: -0.6,
  },

  pricePeriod: {
    marginBottom: 4,
    color: "rgba(255,255,255,0.32)",
    fontSize: 10,
    fontWeight: "700",
  },

  monthlyEquivalent: {
    marginTop: 3,
    color: "rgba(255,255,255,0.4)",
    fontSize: 9,
  },

  annualSaving: {
    marginTop: 5,
    color: "#4ADE80",
    fontSize: 9,
    fontWeight: "800",
  },

  perks: {
    gap: 8,
    marginBottom: 15,
  },

  perkRow: {
    minHeight: 27,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  perkIcon: {
    width: 25,
    height: 25,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  perkText: {
    flex: 1,
    color: "rgba(255,255,255,0.62)",
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "600",
  },

  currentButton: {
    minHeight: 48,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  currentButtonText: {
    fontSize: 11,
    fontWeight: "900",
  },

  planButton: {
    minHeight: 48,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  planButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  /* ==========================================================================
   * COMPARISON
   * ======================================================================== */

  comparisonCard: {
    marginTop: 15,
    overflow: "hidden",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  comparisonHeader: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  comparisonTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  comparisonSubtitle: {
    marginTop: 3,
    color: "rgba(255,255,255,0.3)",
    fontSize: 9,
  },

  comparisonColumns: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },

  comparisonRow: {
    minHeight: 49,
    flexDirection: "row",
    alignItems: "center",
  },

  comparisonRowAlt: {
    backgroundColor: "rgba(255,255,255,0.014)",
  },

  comparisonFeatureColumn: {
    flex: 1.45,
    paddingHorizontal: 10,
  },

  comparisonPlanColumn: {
    flex: 0.85,
    minWidth: 58,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },

  columnHeader: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 8,
    fontWeight: "900",
    textAlign: "center",
  },

  comparisonFeatureText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 8,
    lineHeight: 12,
  },

  featureValue: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 7,
    lineHeight: 10,
    fontWeight: "700",
    textAlign: "center",
  },

  featureCheck: {
    width: 22,
    height: 22,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,197,94,0.1)",
  },

  featureUnavailable: {
    width: 22,
    height: 22,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.025)",
  },

  transparencyNotice: {
    marginTop: 14,
    padding: 13,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "rgba(96,165,250,0.05)",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.12)",
  },

  transparencyText: {
    flex: 1,
    color: "rgba(255,255,255,0.34)",
    fontSize: 9,
    lineHeight: 15,
  },

  /* ==========================================================================
   * BENEFITS
   * ======================================================================== */

  benefitHero: {
    padding: 15,
    borderRadius: 21,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(139,92,246,0.055)",
    borderWidth: 1,
  },

  benefitHeroIcon: {
    width: 60,
    height: 60,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  benefitHeroContent: {
    flex: 1,
  },

  benefitHeroTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },

  benefitHeroText: {
    marginTop: 4,
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    lineHeight: 15,
  },

  activeValueCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 19,
    backgroundColor: "rgba(34,197,94,0.055)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.12)",
  },

  activeValueHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  activeValueTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  activeValueSubtitle: {
    marginTop: 3,
    color: "rgba(255,255,255,0.3)",
    fontSize: 8,
  },

  activeValueGrid: {
    marginTop: 12,
    gap: 7,
  },

  activeValueItem: {
    minHeight: 36,
    paddingHorizontal: 9,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  activeValueItemText: {
    flex: 1,
    color: "rgba(255,255,255,0.55)",
    fontSize: 9,
    fontWeight: "700",
  },

  benefitList: {
    marginTop: 13,
    gap: 9,
  },

  benefitCard: {
    padding: 13,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.065)",
  },

  benefitIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  benefitContent: {
    flex: 1,
  },

  benefitTitle: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  benefitDescription: {
    marginTop: 4,
    color: "rgba(255,255,255,0.36)",
    fontSize: 9,
    lineHeight: 15,
  },

  /* ==========================================================================
   * MANAGEMENT
   * ======================================================================== */

  subscriptionCard: {
    overflow: "hidden",
    borderRadius: 21,
    backgroundColor: "rgba(139,92,246,0.055)",
    borderWidth: 1,
  },

  subscriptionTopLine: {
    height: 3,
    width: "100%",
  },

  subscriptionHeader: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  subscriptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  subscriptionIdentity: {
    flex: 1,
  },

  subscriptionPlan: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  subscriptionBilling: {
    marginTop: 3,
    color: "rgba(255,255,255,0.38)",
    fontSize: 9,
  },

  activeBadge: {
    minHeight: 27,
    paddingHorizontal: 8,
    borderRadius: 99,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(34,197,94,0.1)",
  },

  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4ADE80",
  },

  activeBadgeText: {
    color: "#4ADE80",
    fontSize: 8,
    fontWeight: "900",
  },

  subscriptionRows: {
    padding: 10,
    gap: 7,
  },

  subscriptionRow: {
    minHeight: 52,
    padding: 9,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  subscriptionRowIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  subscriptionRowContent: {
    flex: 1,
  },

  subscriptionRowLabel: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 8,
    fontWeight: "800",
  },

  subscriptionRowValue: {
    marginTop: 3,
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontWeight: "700",
  },

  managementActions: {
    marginTop: 13,
    gap: 8,
  },

  managementAction: {
    minHeight: 68,
    paddingHorizontal: 12,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.065)",
  },

  managementActionPressed: {
    opacity: 0.75,
  },

  managementActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  managementActionContent: {
    flex: 1,
  },

  managementActionTitle: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },

  managementActionSubtitle: {
    marginTop: 3,
    color: "rgba(255,255,255,0.32)",
    fontSize: 8,
    lineHeight: 13,
  },

  managementSecurity: {
    marginTop: 13,
    padding: 12,
    borderRadius: 16,
    flexDirection: "row",
    gap: 8,
    backgroundColor: "rgba(34,197,94,0.05)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.1)",
  },

  managementSecurityText: {
    flex: 1,
    color: "rgba(255,255,255,0.33)",
    fontSize: 8,
    lineHeight: 14,
  },

  cancelSubscriptionButton: {
    marginTop: 14,
    minHeight: 48,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "rgba(239,68,68,0.06)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.13)",
  },

  cancelSubscriptionText: {
    color: "#F87171",
    fontSize: 10,
    fontWeight: "800",
  },

  noSubscription: {
    paddingVertical: 50,
    alignItems: "center",
    justifyContent: "center",
  },

  noSubscriptionIcon: {
    width: 72,
    height: 72,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  noSubscriptionTitle: {
    marginTop: 17,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  noSubscriptionText: {
    maxWidth: 330,
    marginTop: 7,
    color: "rgba(255,255,255,0.35)",
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
  },

  managementPrimaryButton: {
    minHeight: 48,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#4F46E5",
  },

  managementPrimaryText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  /* ==========================================================================
   * MODALS
   * ======================================================================== */

  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.78)",
  },

  modalCard: {
    maxHeight: "88%",
    paddingHorizontal: 17,
    paddingTop: 10,
    paddingBottom: 24,
    borderTopLeftRadius: 27,
    borderTopRightRadius: 27,
    backgroundColor: "#0E1020",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  modalHandle: {
    alignSelf: "center",
    width: 43,
    height: 4,
    marginBottom: 17,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.16)",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  modalPlanIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  modalHeaderText: {
    flex: 1,
  },

  modalTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },

  modalSubtitle: {
    marginTop: 4,
    color: "rgba(255,255,255,0.4)",
    fontSize: 9,
  },

  modalClose: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  confirmationBox: {
    marginTop: 17,
    padding: 13,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "rgba(139,92,246,0.06)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.13)",
  },

  confirmationText: {
    flex: 1,
    color: "rgba(255,255,255,0.46)",
    fontSize: 9,
    lineHeight: 15,
  },

  modalPerks: {
    marginTop: 12,
    gap: 6,
  },

  modalPerk: {
    minHeight: 31,
    paddingHorizontal: 9,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  modalPerkText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 9,
    fontWeight: "700",
  },

  confirmButton: {
    minHeight: 50,
    marginTop: 17,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  modalSecondaryButton: {
    minHeight: 46,
    marginTop: 8,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  modalSecondaryText: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 10,
    fontWeight: "800",
  },

  cancelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  cancelIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.1)",
  },

  cancelWarning: {
    marginTop: 17,
    padding: 13,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "rgba(239,68,68,0.055)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.11)",
  },

  cancelWarningText: {
    flex: 1,
    color: "rgba(255,255,255,0.44)",
    fontSize: 9,
    lineHeight: 15,
  },

  cancelActions: {
    marginTop: 17,
    flexDirection: "row",
    gap: 8,
  },

  keepPlanButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  keepPlanText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },

  confirmCancelButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.13)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.18)",
  },

  confirmCancelText: {
    color: "#F87171",
    fontSize: 10,
    fontWeight: "900",
  },

  disabledButton: {
    opacity: 0.5,
  },

  /* ==========================================================================
   * AUTH
   * ======================================================================== */

  authRequired: {
    flex: 1,
    paddingHorizontal: 25,
    alignItems: "center",
    justifyContent: "center",
  },

  authIcon: {
    width: 76,
    height: 76,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.1)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.18)",
  },

  authTitle: {
    marginTop: 18,
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },

  authText: {
    maxWidth: 350,
    marginTop: 7,
    marginBottom: 18,
    color: "rgba(255,255,255,0.38)",
    fontSize: 10,
    lineHeight: 17,
    textAlign: "center",
  },

  authBackButton: {
    marginTop: 14,
    minHeight: 42,
    paddingHorizontal: 15,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  authBackText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    fontWeight: "800",
  },

  /* ==========================================================================
   * LOADING
   * ======================================================================== */

  loadingContent: {
    padding: 15,
    gap: 12,
  },

  skeletonSubscription: {
    width: "100%",
    height: 190,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  loadingTitle: {
    width: 120,
    height: 13,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  loadingSubtitle: {
    width: 90,
    height: 8,
    marginTop: 6,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  loadingStack: {
    gap: 12,
  },

  bottomSpace: {
    height: 25,
  },
});
