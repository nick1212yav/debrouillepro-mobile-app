import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable } from "react-native";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import {
  ArrowLeft, Crown, Zap, Building2, Check, X, Star,
  Shield, Sparkles, TrendingUp, Users, Package, Wifi,
  ChevronRight, AlertCircle, Calendar, CreditCard,
  BarChart2, Headphones, RefreshCw, Lock, Gift, Flame,
  CheckCircle,
} from "lucide-react-native";
import { Authenticated, Unauthenticated, AuthLoading } from "@/lib/convex-auth-compat";
import { SignInButton } from "@/components/ui/signin";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

type PlanId = "gratuit" | "pro" | "business";
type BillingCycle = "mensuel" | "annuel";

type PlanFeature = {
  label: string;
  gratuit: boolean | string;
  pro: boolean | string;
  business: boolean | string;
};

type Plan = {
  id: PlanId;
  nom: string;
  tagline: string;
  prix: { mensuel: number; annuel: number };
  couleur: string;
  gradient: string;
  icon: React.ElementType;
  badge?: string;
  populaire?: boolean;
};

const PLANS: Plan[] = [
  { id: "gratuit", nom: "Gratuit", tagline: "L'essentiel pour démarrer", prix: { mensuel: 0, annuel: 0 }, couleur: "#9CA3AF", gradient: "linear-gradient(135deg, #374151, #1F2937)", icon: Zap },
  { id: "pro", nom: "Pro", tagline: "Pour les utilisateurs actifs", prix: { mensuel: 2500, annuel: 24000 }, couleur: "#8B5CF6", gradient: "linear-gradient(135deg, #8B5CF6, #6366F1)", icon: Crown, badge: "Populaire", populaire: true },
  { id: "business", nom: "Business", tagline: "Pour les entrepreneurs", prix: { mensuel: 7500, annuel: 72000 }, couleur: "#F59E0B", gradient: "linear-gradient(135deg, #F59E0B, #F97316)", icon: Building2, badge: "Premium" },
];

const FEATURES: PlanFeature[] = [
  { label: "Modules de base",           gratuit: true,         pro: true,           business: true },
  { label: "Messages",                  gratuit: "20/mois",    pro: "Illimités",    business: "Illimités" },
  { label: "Stockage documents",        gratuit: "100 Mo",     pro: "5 Go",         business: "50 Go" },
  { label: "Annonces marketplace",      gratuit: "3 actives",  pro: "20 actives",   business: "Illimitées" },
  { label: "Boost d'annonces",          gratuit: false,        pro: "2/mois",       business: "Illimités" },
  { label: "Badge Premium profil",      gratuit: false,        pro: true,           business: true },
  { label: "IA Assistant avancé",       gratuit: "10 req/jour",pro: "Illimité",     business: "Illimité + priorité" },
  { label: "Analytics avancés",         gratuit: false,        pro: true,           business: true },
  { label: "Export de données",         gratuit: false,        pro: "CSV",          business: "CSV + PDF" },
  { label: "Support client",            gratuit: "Communauté", pro: "Email 48h",    business: "Prioritaire 4h" },
  { label: "Accès anticipé features",   gratuit: false,        pro: true,           business: true },
  { label: "Dashboard vendeur Pro",     gratuit: false,        pro: false,          business: true },
  { label: "API & intégrations",        gratuit: false,        pro: false,          business: true },
  { label: "Compte multi-utilisateurs", gratuit: false,        pro: false,          business: "Jusqu'à 5" },
];

const PLAN_PERKS: Record<PlanId, { icon: React.ElementType; label: string; color: string }[]> = {
  gratuit: [
    { icon: Zap,        label: "Accès aux modules essentiels", color: "#9CA3AF" },
    { icon: Users,      label: "Communauté de base",           color: "#9CA3AF" },
    { icon: Package,    label: "3 annonces marketplace",       color: "#9CA3AF" },
  ],
  pro: [
    { icon: Crown,      label: "Badge Pro sur ton profil",             color: "#8B5CF6" },
    { icon: Sparkles,   label: "IA illimitée",                         color: "#6366F1" },
    { icon: BarChart2,  label: "Analytics complets",                   color: "#8B5CF6" },
    { icon: Shield,     label: "Support email prioritaire",            color: "#6366F1" },
    { icon: Wifi,       label: "Sync hors-ligne avancée",              color: "#8B5CF6" },
    { icon: Gift,       label: "Accès anticipé aux nouvelles features",color: "#6366F1" },
  ],
  business: [
    { icon: Building2,  label: "Dashboard vendeur complet", color: "#F59E0B" },
    { icon: TrendingUp, label: "Rapports financiers PDF",   color: "#F97316" },
    { icon: Users,      label: "Jusqu'à 5 collaborateurs",  color: "#F59E0B" },
    { icon: Headphones, label: "Support prioritaire 4h",    color: "#F97316" },
    { icon: Zap,        label: "API & intégrations tierces",color: "#F59E0B" },
    { icon: Flame,      label: "Boosts illimités",          color: "#F97316" },
  ],
};

function FeatureValue({ value }: { value: boolean | string }) {
  if (value === true)  return <Check size={15} className="text-green-400 mx-auto" />;
  if (value === false) return <X size={13} className="text-white/20 mx-auto" />;
  return <Text className="text-white/70 text-[11px] text-center">{value}</Text>;
}

interface PremiumPageProps { onBack: () => void; }

export default function PremiumPage({ onBack }: PremiumPageProps) {
  return (
    <View className="h-full flex flex-col" style={{  }}>
      <AuthLoading>
        <View className="flex-shrink-0 pt-safe px-4 py-3 flex items-center gap-3" style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)", borderBottomStyle: "solid" }}>
          <Pressable onPress={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><ArrowLeft size={18} className="text-white" /></Pressable>
          <Skeleton className="h-8 w-40" />
        </View>
        <View className="px-4 pt-4 space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}</View>
      </AuthLoading>
      <Unauthenticated>
        <View className="flex-shrink-0 pt-safe px-4 py-3 flex items-center gap-3" style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)", borderBottomStyle: "solid" }}>
          <Pressable onPress={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><ArrowLeft size={18} className="text-white" /></Pressable>
          <Text className="text-white font-black">Premium</Text>
        </View>
        <View className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
          <Crown size={40} className="text-purple-400" />
          <Text className="text-white/60 text-sm text-center">Connectez-vous pour gérer votre abonnement</Text>
          <SignInButton />
        </View>
      </Unauthenticated>
      <Authenticated>
        <PremiumInner onBack={onBack} />
      </Authenticated>
    </View>
  );
}

function PremiumInner({ onBack }: PremiumPageProps) {
  const subscription = useQuery(api.subscriptions.getMySubscription, {});
  const subscribeToPlan = useMutation(api.subscriptions.subscribeToPlan);
  const cancelSubscription = useMutation(api.subscriptions.cancelSubscription);
  const toggleAutoRenew = useMutation(api.subscriptions.toggleAutoRenew);

  const [tab, setTab] = useState<"plans" | "avantages" | "gestion">("plans");
  const [billing, setBilling] = useState<BillingCycle>("annuel");
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  const currentPlan: PlanId = subscription?.planId ?? "gratuit";

  const handleUpgrade = (planId: PlanId) => {
    if (planId === currentPlan) return;
    setSelectedPlan(planId);
    setShowConfirm(true);
  };

  const confirmUpgrade = async () => {
    if (!selectedPlan) return;
    try {
      await subscribeToPlan({ planId: selectedPlan, billingCycle: billing });
      setShowConfirm(false);
      UIService.openToast("Abonnement mis à jour avec succès !", "success");
    } catch {
      UIService.openToast("Erreur lors de la mise à jour de l'abonnement", "error");
    }
  };

  const handleCancel = async () => {
    try {
      await cancelSubscription({});
      setShowCancel(false);
      UIService.openToast("Abonnement annulé", "success");
    } catch {
      UIService.openToast("Aucun abonnement actif à annuler", "error");
    }
  };

  const handleToggleAutoRenew = async () => {
    try {
      await toggleAutoRenew({});
      UIService.openToast("Renouvellement automatique mis à jour", "success");
    } catch {
      UIService.openToast("Erreur", "error");
    }
  };

  const getPrix = (plan: Plan) => {
    const p = plan.prix[billing];
    if (p === 0) return "Gratuit";
    return `${p.toLocaleString()} FCFA`;
  };

  const getPerMonth = (plan: Plan) => {
    if (plan.prix.mensuel === 0) return null;
    if (billing === "annuel") return `${Math.round(plan.prix.annuel / 12).toLocaleString()} FCFA/mois`;
    return null;
  };

  const annualSaving = (plan: Plan) => {
    if (plan.prix.mensuel === 0) return null;
    const saved = plan.prix.mensuel * 12 - plan.prix.annuel;
    return saved > 0 ? saved : null;
  };

  const currentPlanData = PLANS.find(p => p.id === currentPlan)!;

  return (
    <>
      {/* Ambient glows */}
      <View className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-48"
        style={{  }} />

      {/* Header */}
      <View className="flex-shrink-0 pt-safe px-4 py-3 flex items-center gap-3" style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)", borderBottomStyle: "solid" }}>
        <Pressable onPress={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
          <ArrowLeft size={18} className="text-white" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-white font-black text-lg leading-tight">Premium</Text>
          <Text className="text-white/40 text-xs">Abonnements & plans</Text>
        </View>
        {currentPlan !== "gratuit" && (
          <View className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ backgroundColor: currentPlanData.gradient }}>
            <currentPlanData.icon size={13} className="text-white" />
            <Text className="text-white font-bold text-xs">{currentPlanData.nom}</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View className="flex-shrink-0 flex gap-1 px-4 py-3">
        {[
          { id: "plans" as const, label: "Nos plans", icon: Crown },
          { id: "avantages" as const, label: "Avantages", icon: Star },
          { id: "gestion" as const, label: "Mon abonnement", icon: CreditCard },
        ].map(({ id, label, icon: Icon }) => (
          <Pressable key={id} onPress={() => setTab(id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold"
            style={tab === id ? {  } : { backgroundColor: "rgba(255,255,255,0.06)" }}>
            <Icon size={12} />{label}
          </Pressable>
        ))}
      </View>

      <View className="flex-1 overflow-y-auto" style={{  }}>

        {/* Plans tab */}
        {tab === "plans" && (
          <View className="px-4 pb-8">
            {/* Billing toggle */}
            <View className="flex items-center justify-center gap-3 mb-6">
              <Pressable onPress={() => setBilling("mensuel")} className="px-4 py-2 rounded-xl text-sm font-semibold"
                style={billing === "mensuel" ? { backgroundColor: "rgba(255,255,255,0.12)" } : {  }}><Text>Mensuel</Text></Pressable>
              <Pressable className="relative w-14 h-7 rounded-full flex items-center px-1"
                onPress={() => setBilling(billing === "mensuel" ? "annuel" : "mensuel")}
                style={{  }}>
                <View
                  className="w-5 h-5 rounded-full bg-white" />
              </Pressable>
              <Pressable onPress={() => setBilling("annuel")} className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5"
                style={billing === "annuel" ? { backgroundColor: "rgba(255,255,255,0.12)" } : {  }}>
                <Text>Annuel</Text><Text className="px-1.5 py-0.5 rounded-full text-[9px] font-black" style={{ color: "#fff" }}>-20%</Text>
              </Pressable>
            </View>

            <View className="flex flex-col gap-4">
              {PLANS.map((plan) => {
                const isCurrent = plan.id === currentPlan;
                const Icon = plan.icon;
                const saving = annualSaving(plan);
                return (
                  <View key={plan.id}
                    className="relative rounded-2xl overflow-hidden"
                    style={{ borderColor: "rgba(139,92,246,0.6)", borderStyle: "solid" }}>
                    <View className="h-1.5 w-full" style={{ backgroundColor: plan.gradient }} />
                    {plan.badge && (
                      <View className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-black text-white" style={{ backgroundColor: plan.gradient }}>{plan.badge}</View>
                    )}
                    <View className="p-5" style={{ backgroundColor: plan.populaire ? "rgba(139,92,246,0.06)" : "rgba(255,255,255,0.03)" }}>
                      <View className="flex items-center gap-3 mb-4">
                        <View className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: plan.gradient }}>
                          <Icon size={22} className="text-white" />
                        </View>
                        <View>
                          <Text className="text-white font-black text-lg">{plan.nom}</Text>
                          <Text className="text-white/50 text-xs">{plan.tagline}</Text>
                        </View>
                      </View>
                      <View className="mb-4">
                        <View className="flex items-end gap-1">
                          <Text className="text-white font-black text-3xl">{getPrix(plan)}</Text>
                          {plan.prix.mensuel > 0 && <Text className="text-white/40 text-sm mb-1">/{billing === "annuel" ? "an" : "mois"}</Text>}
                        </View>
                        {billing === "annuel" && getPerMonth(plan) && <Text className="text-white/50 text-xs">{getPerMonth(plan)}</Text>}
                        {billing === "annuel" && saving && <Text className="text-green-400 text-xs font-semibold mt-0.5">Économise {saving.toLocaleString()} FCFA/an</Text>}
                      </View>
                      <View className="flex flex-col gap-2 mb-5">
                        {PLAN_PERKS[plan.id].map((perk) => (
                          <View key={perk.label} className="flex items-center gap-2">
                            <View className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${perk.color}22` }}>
                              <perk.icon size={11} style={{ color: perk.color }} />
                            </View>
                            <Text className="text-white/70 text-xs">{perk.label}</Text>
                          </View>
                        ))}
                      </View>
                      {isCurrent ? (
                        <View className="w-full py-3 rounded-2xl flex items-center justify-center gap-2" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
                          <CheckCircle size={15} style={{ color: plan.couleur }} />
                          <Text className="font-bold text-sm" style={{ color: plan.couleur }}>Plan actuel</Text>
                        </View>
                      ) : plan.id === "gratuit" ? (
                        <Pressable onPress={() => setShowCancel(true)}
                          className="w-full py-3 rounded-2xl flex items-center justify-center gap-2"
                          style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
                          <Text className="text-white/50 font-semibold text-sm">Rétrograder</Text>
                        </Pressable>
                      ) : (
                        <Pressable onPress={() => handleUpgrade(plan.id)}
                          className="w-full py-3 rounded-2xl flex items-center justify-center gap-2"
                          style={{ backgroundColor: plan.gradient }}>
                          <Sparkles size={15} className="text-white" />
                          <Text className="text-white font-black text-sm">{plan.id === "business" ? "Passer à Business" : "Upgrader maintenant"}</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Comparison table */}
            <View className="mt-6 rounded-2xl overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}>
              <Text className="text-white font-bold text-sm px-4 py-3" style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)", borderBottomStyle: "solid" }}>Comparaison détaillée</Text>
              <View className="px-4 py-2" style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)", borderBottomStyle: "solid" }}>
                <Text className="text-white/30 text-xs">Fonctionnalité</Text>
                {PLANS.map((p) => <Text key={p.id} className="text-center text-xs font-bold" style={{ color: p.couleur }}>{p.nom}</Text>)}
              </View>
              {FEATURES.map((f, idx) => (
                <View key={f.label} className="px-4 py-2.5 items-center" style={{ backgroundColor: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)" }}>
                  <Text className="text-white/60 text-[11px] pr-2">{f.label}</Text>
                  <View className="flex justify-center"><FeatureValue value={f.gratuit} /></View>
                  <View className="flex justify-center"><FeatureValue value={f.pro} /></View>
                  <View className="flex justify-center"><FeatureValue value={f.business} /></View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Avantages tab */}
        {tab === "avantages" && (
          <View className="px-4 pb-8">
            <View
              className="rounded-2xl p-5 mb-5 flex items-center gap-4"
              style={{ borderWidth: 1, borderColor: "rgba(139,92,246,0.3)", borderStyle: "solid" }}>
              <View className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{  }}>
                <Crown size={30} className="text-white" />
              </View>
              <View>
                <Text className="text-white font-black text-lg">Badge {currentPlanData.nom}</Text>
                <Text className="text-white/60 text-sm">Visible sur ton profil et toutes tes contributions</Text>
              </View>
            </View>

            {/* Savings stats */}
            {currentPlan !== "gratuit" && (
              <View className="rounded-2xl p-4 mb-5"
                style={{ backgroundColor: "rgba(16,185,129,0.08)", borderWidth: 1, borderColor: "rgba(16,185,129,0.2)", borderStyle: "solid" }}>
                <Text className="text-xs text-green-400 font-bold uppercase tracking-wider mb-3">Valeur débloquée ce mois</Text>
                <View className="gap-3">
                  {[
                    { label: "Boosts", value: currentPlan === "business" ? "Illimités" : "2 offerts", color: "#F59E0B" },
                    { label: "Stockage", value: currentPlan === "business" ? "50 Go" : "5 Go", color: "#3B82F6" },
                    { label: "IA Requêtes", value: "Illimitées", color: "#8B5CF6" },
                  ].map((stat) => (
                    <View key={stat.label} className="flex flex-col items-center gap-1 p-2 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                      <Text className="text-xs font-black" style={{ color: stat.color }}>{stat.value}</Text>
                      <Text className="text-[10px] text-white/40">{stat.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {[
              { titre: "IA Assistant illimitée",  desc: "Accès illimité à l'assistant IA dans tous les modules.", icon: Sparkles, color: "#8B5CF6" },
              { titre: "Analytics & Insights",    desc: "Tableau de bord complet avec graphiques et statistiques détaillées.", icon: BarChart2, color: "#3B82F6" },
              { titre: "Stockage 5 Go",           desc: "Coffre-fort sécurisé avec 5 Go pour tes documents.", icon: Shield, color: "#10B981" },
              { titre: "Support prioritaire",     desc: "Réponse en moins de 48h par email avec une équipe dédiée.", icon: Headphones, color: "#EC4899" },
              { titre: "Accès anticipé",          desc: "Teste les nouvelles fonctionnalités avant tout le monde.", icon: Flame, color: "#F97316" },
              { titre: "Messages illimités",      desc: "Envoie et reçois autant de messages que tu veux.", icon: Users, color: "#6366F1" },
            ].map((b, idx) => (
              <View key={b.titre}
                className="flex items-start gap-4 rounded-2xl p-4 mb-3"
                style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}>
                <View className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${b.color}22` }}>
                  <b.icon size={20} style={{ color: b.color }} />
                </View>
                <View>
                  <Text className="text-white font-bold text-sm">{b.titre}</Text>
                  <Text className="text-white/50 text-xs leading-relaxed mt-0.5">{b.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Gestion tab */}
        {tab === "gestion" && (
          <View className="px-4 pb-8">
            {subscription === undefined ? (
              <View className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</View>
            ) : subscription && subscription.status === "active" ? (
              <>
                <View className="rounded-2xl overflow-hidden mb-5">
                  <View className="h-1.5" style={{ backgroundColor: currentPlanData.gradient }} />
                  <View className="p-4" style={{ backgroundColor: "rgba(139,92,246,0.08)", borderWidth: 1, borderColor: "rgba(139,92,246,0.2)", borderStyle: "solid" }}>
                    <View className="flex items-center justify-between mb-3">
                      <View className="flex items-center gap-2">
                        <View className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: currentPlanData.gradient }}>
                          <currentPlanData.icon size={18} className="text-white" />
                        </View>
                        <View>
                          <Text className="text-white font-black">Plan {currentPlanData.nom} {subscription.billingCycle === "annuel" ? "Annuel" : "Mensuel"}</Text>
                          <Text className="text-white/50 text-xs">{PLANS.find(p => p.id === currentPlan)?.prix[subscription.billingCycle].toLocaleString()} FCFA / {subscription.billingCycle === "annuel" ? "an" : "mois"}</Text>
                        </View>
                      </View>
                      <Text className="px-2.5 py-1 rounded-full text-xs font-bold text-green-400" style={{ backgroundColor: "rgba(16,185,129,0.15)" }}>Actif</Text>
                    </View>
                    <View className="gap-3">
                      {[
                        { icon: Calendar,   label: "Renouvellement",       value: subscription.renewsAt ? format(parseISO(subscription.renewsAt), "d MMM yyyy", { locale: fr }) : "—" },
                        { icon: CreditCard, label: "Moyen de paiement",    value: subscription.paymentMethod ?? "Mobile Money" },
                        { icon: RefreshCw,  label: "Auto-renouvellement",  value: subscription.autoRenew ? "Activé" : "Désactivé" },
                        { icon: Gift,       label: "Points bonus",         value: "+500 pts/mois" },
                      ].map(({ icon: Icon, label, value }) => (
                        <View key={label} className="flex items-center gap-2 p-2 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                          <Icon size={13} className="text-white/40 flex-shrink-0" />
                          <View>
                            <Text className="text-white/40 text-[10px]">{label}</Text>
                            <Text className="text-white font-semibold text-xs">{value}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>

                <View className="flex flex-col gap-2 mb-5">
                  {[
                    { icon: RefreshCw, label: "Gérer le renouvellement automatique", color: "#3B82F6", action: handleToggleAutoRenew },
                    { icon: ChevronRight, label: "Passer à Business", color: "#F59E0B", action: () => handleUpgrade("business") },
                  ].map(({ icon: Icon, label, color, action }) => (
                    <Pressable key={label} onPress={() => void action()}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
                      style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                      <View className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}22` }}>
                        <Icon size={15} style={{ color }} />
                      </View>
                      <Text className="text-white/80 text-sm font-semibold flex-1 text-left">{label}</Text>
                      <ChevronRight size={15} className="text-white/30" />
                    </Pressable>
                  ))}
                </View>
              </>
            ) : (
              <View className="flex flex-col items-center py-10 gap-3">
                <Package size={36} className="text-white/20" />
                <Text className="text-white/60 text-sm">Aucun abonnement actif</Text>
                <Pressable onPress={() => setTab("plans")} className="px-4 py-2 rounded-xl text-sm font-bold text-white" style={{  }}>
                  <Text>Voir les plans</Text></Pressable>
              </View>
            )}

            <Pressable onPress={() => setShowCancel(true)}
              className="w-full py-3 rounded-2xl flex items-center justify-center gap-2"
              style={{ backgroundColor: "rgba(239,68,68,0.08)", borderWidth: 1, borderColor: "rgba(239,68,68,0.15)", borderStyle: "solid" }}>
              <AlertCircle size={15} className="text-red-400" />
              <Text className="text-red-400 font-semibold text-sm">Annuler l'abonnement</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Upgrade confirm sheet */}
      <>
        {showConfirm && selectedPlan && (() => {
          const plan = PLANS.find((p) => p.id === selectedPlan)!;
          return (
            <>
              <Pressable
                onPress={() => setShowConfirm(false)} className="absolute inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,0.75)" }} />
              <View
                className="absolute bottom-0 left-0 right-0 z-50 rounded-t-3xl p-6"
                style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
                <View className="w-12 h-1 rounded-full bg-white/20 mx-auto mb-5" />
                <View className="flex items-center gap-3 mb-5">
                  <View className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: plan.gradient }}>
                    <plan.icon size={26} className="text-white" />
                  </View>
                  <View>
                    <Text className="text-white font-black text-xl">Passer à {plan.nom}</Text>
                    <Text className="text-white/50 text-sm">{getPrix(plan)} / {billing === "annuel" ? "an" : "mois"}</Text>
                  </View>
                </View>
                <View className="rounded-xl p-3 mb-5" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                  <Text className="text-white/60 text-xs leading-relaxed">
                    Tu seras débité immédiatement via Mobile Money. Ton plan actuel sera remplacé. Tu peux annuler à tout moment.
                  </Text>
                </View>
                <Pressable onPress={() => void confirmUpgrade()}
                  className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 mb-3"
                  style={{ backgroundColor: plan.gradient }}>
                  <Sparkles size={16} className="text-white" />
                  <Text className="text-white font-black">Confirmer le paiement</Text>
                </Pressable>
                <Pressable onPress={() => setShowConfirm(false)} className="w-full py-3 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                  <Text className="text-white/50 text-sm">Annuler</Text>
                </Pressable>
              </View>
            </>
          );
        })()}
      </>

      {/* Cancel confirm sheet */}
      <>
        {showCancel && (
          <>
            <Pressable
              onPress={() => setShowCancel(false)} className="absolute inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,0.75)" }} />
            <View
              className="absolute bottom-0 left-0 right-0 z-50 rounded-t-3xl p-6"
              style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
              <View className="w-12 h-1 rounded-full bg-white/20 mx-auto mb-5" />
              <View className="flex items-center gap-3 mb-4">
                <View className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(239,68,68,0.15)" }}>
                  <AlertCircle size={22} className="text-red-400" />
                </View>
                <View>
                  <Text className="text-white font-black text-lg"><Text>Annuler l'abonnement ?</Text></Text>
                  <Text className="text-white/50 text-sm"><Text>Tu perdras tous tes avantages</Text></Text>
                </View>
              </View>
              <View className="flex flex-col gap-2 mb-5">
                {["Badge Premium sur ton profil", "IA illimitée", "Analytics & insights", "Stockage 5 Go"].map((item) => (
                  <View key={item} className="flex items-center gap-2">
                    <Lock size={12} className="text-red-400" />
                    <Text className="text-white/60 text-xs">{item} sera désactivé</Text>
                  </View>
                ))}
              </View>
              <View className="flex gap-3">
                <Pressable onPress={() => setShowCancel(false)} className="flex-1 py-3 rounded-2xl flex items-center justify-center" style={{  }}>
                  <Text className="text-white font-bold text-sm">Garder mon plan</Text>
                </Pressable>
                <Pressable onPress={() => void handleCancel()} className="flex-1 py-3 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(239,68,68,0.12)", borderWidth: 1, borderColor: "rgba(239,68,68,0.2)", borderStyle: "solid" }}>
                  <Text className="text-red-400 text-sm">Confirmer</Text>
                </Pressable>
              </View>
            </View>
          </>
        )}
      </>
    </>
  );
}
