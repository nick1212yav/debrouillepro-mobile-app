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
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock3,
  DollarSign,
  Eye,
  MousePointer2,
  Plus,
  Pause,
  Play,
  ShieldCheck,
  Target,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react-native";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated } from "@/lib/convex-auth-compat";

import { SignInButton } from "@/components/ui/signin.tsx";

interface PubPageProps {
  onBack: () => void;
}

type Tab = "campagnes" | "performance";

type CampaignStatus = "draft" | "active" | "paused" | "completed";

const STATUS_LABEL: Record<string, string> = {
  draft: "Brouillon",
  active: "Active",
  paused: "En pause",
  completed: "Terminée",
};

function formatNumber(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) {
    return "—";
  }

  return value.toLocaleString("fr-FR");
}

function formatCompact(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) {
    return "—";
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k`;
  }

  return value.toLocaleString("fr-FR");
}

function formatMoney(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) {
    return "—";
  }

  return value.toLocaleString("fr-FR");
}

function getStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "#34D399";

    case "paused":
      return "#F59E0B";

    case "completed":
      return "#60A5FA";

    case "draft":
      return "#94A3B8";

    default:
      return "#94A3B8";
  }
}

function StatusBadge({ status }: { status: string }) {
  const color = getStatusColor(status);

  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor: `${color}14`,
          borderColor: `${color}35`,
        },
      ]}
    >
      <View
        style={[
          styles.statusDot,
          {
            backgroundColor: color,
          },
        ]}
      />

      <Text
        style={[
          styles.statusText,
          {
            color,
          },
        ]}
      >
        {STATUS_LABEL[status] ?? status}
      </Text>
    </View>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
  accent,
}: {
  icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  label: string;
  value: string;
  description: string;
  accent: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View
        style={[
          styles.metricIcon,
          {
            backgroundColor: `${accent}12`,
          },
        ]}
      >
        <Icon size={17} color={accent} strokeWidth={2} />
      </View>

      <Text style={styles.metricLabel}>{label}</Text>

      <Text style={styles.metricValue}>{value}</Text>

      <Text style={styles.metricDescription}>{description}</Text>
    </View>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Target size={27} color="#64748B" strokeWidth={1.7} />
      </View>

      <Text style={styles.emptyTitle}>Aucune campagne</Text>

      <Text style={styles.emptyText}>
        Créez une campagne pour commencer à diffuser vos contenus lorsque les
        fonctionnalités publicitaires disponibles sont configurées pour votre
        compte.
      </Text>

      <Pressable
        onPress={onCreate}
        style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}
      >
        <Plus size={16} color="#ffffff" />

        <Text style={styles.emptyButtonText}>Créer une campagne</Text>
      </Pressable>
    </View>
  );
}

function CampaignCard({
  campaign,
  onToggle,
  updating,
}: {
  campaign: {
    _id: any;
    title: string;
    description?: string;
    status: string;
    impressions: number;
    clicks: number;
    budget: number;
    spent: number;
    startDate: string;
    endDate: string;
  };
  onToggle: () => void;
  updating: boolean;
}) {
  const budget = Number(campaign.budget) || 0;
  const spent = Number(campaign.spent) || 0;

  const percentage =
    budget > 0 ? Math.min(100, Math.max(0, (spent / budget) * 100)) : 0;

  const canToggle =
    campaign.status === "active" || campaign.status === "paused";

  return (
    <View style={styles.campaignCard}>
      {/* Header */}
      <View style={styles.campaignHeader}>
        <View style={styles.campaignTitleBlock}>
          <Text style={styles.campaignTitle} numberOfLines={2}>
            {campaign.title}
          </Text>

          {campaign.description ? (
            <Text style={styles.campaignDescription} numberOfLines={2}>
              {campaign.description}
            </Text>
          ) : null}
        </View>

        <StatusBadge status={campaign.status} />
      </View>

      {/* Metrics */}
      <View style={styles.campaignMetrics}>
        <View style={styles.campaignMetric}>
          <Eye size={14} color="#818CF8" />

          <View>
            <Text style={styles.campaignMetricLabel}>Impressions</Text>

            <Text style={styles.campaignMetricValue}>
              {formatNumber(campaign.impressions)}
            </Text>
          </View>
        </View>

        <View style={styles.campaignMetric}>
          <MousePointer2 size={14} color="#34D399" />

          <View>
            <Text style={styles.campaignMetricLabel}>Clics</Text>

            <Text style={styles.campaignMetricValue}>
              {formatNumber(campaign.clicks)}
            </Text>
          </View>
        </View>

        <View style={styles.campaignMetric}>
          <DollarSign size={14} color="#F59E0B" />

          <View>
            <Text style={styles.campaignMetricLabel}>Dépensé</Text>

            <Text style={styles.campaignMetricValue}>{formatMoney(spent)}</Text>
          </View>
        </View>
      </View>

      {/* Budget */}
      <View style={styles.budgetBlock}>
        <View style={styles.budgetHeader}>
          <Text style={styles.budgetLabel}>Budget consommé</Text>

          <Text style={styles.budgetPercentage}>
            {budget > 0 ? `${percentage.toFixed(0)}%` : "—"}
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${percentage}%`,
              },
            ]}
          />
        </View>

        <View style={styles.budgetFooter}>
          <Text style={styles.budgetValue}>{formatMoney(spent)}</Text>

          <Text style={styles.budgetValue}>{formatMoney(budget)}</Text>
        </View>
      </View>

      {/* Dates */}
      <View style={styles.dateRow}>
        <Clock3 size={13} color="#64748B" />

        <Text style={styles.dateText} numberOfLines={1}>
          {campaign.startDate} → {campaign.endDate}
        </Text>
      </View>

      {/* Action */}
      {canToggle ? (
        <Pressable
          onPress={onToggle}
          disabled={updating}
          style={({ pressed }) => [
            styles.campaignAction,
            pressed && styles.pressed,
            updating && styles.disabled,
          ]}
        >
          {updating ? (
            <ActivityIndicator size="small" color="#CBD5E1" />
          ) : campaign.status === "active" ? (
            <>
              <Pause size={14} color="#F59E0B" />

              <Text style={styles.pauseActionText}>Mettre en pause</Text>
            </>
          ) : (
            <>
              <Play size={14} color="#34D399" />

              <Text style={styles.resumeActionText}>Reprendre</Text>
            </>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

function PubContent({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("campagnes");

  const [showCreate, setShowCreate] = useState(false);

  const [campaignName, setCampaignName] = useState("");

  const [campaignDescription, setCampaignDescription] = useState("");

  const [campaignBudget, setCampaignBudget] = useState("");

  const [saving, setSaving] = useState(false);

  const [updatingCampaignId, setUpdatingCampaignId] = useState<string | null>(
    null,
  );

  const campaigns = useQuery(api.media.listMyAdCampaigns, {});

  const stats = useQuery(api.media.getAdStats, {});

  const createCampaign = useMutation(api.media.createAdCampaign);

  const updateStatus = useMutation(api.media.updateCampaignStatus);

  const activeCampaigns = useMemo(
    () =>
      campaigns?.filter((campaign) => campaign.status === "active").length ?? 0,
    [campaigns],
  );

  const totalCampaigns = campaigns?.length ?? 0;

  const clickThroughRate = useMemo(() => {
    if (!stats) {
      return "—";
    }

    if (
      !Number.isFinite(stats.totalImpressions) ||
      stats.totalImpressions <= 0
    ) {
      return "—";
    }

    const ctr = (stats.totalClicks / stats.totalImpressions) * 100;

    return `${ctr.toFixed(2)}%`;
  }, [stats]);

  const resetForm = () => {
    setCampaignName("");
    setCampaignDescription("");
    setCampaignBudget("");
  };

  const handleCreate = async () => {
    const title = campaignName.trim();

    const description = campaignDescription.trim();

    const budgetText = campaignBudget.trim();

    if (!title) {
      Alert.alert("Nom requis", "Donnez un nom à votre campagne.");
      return;
    }

    if (title.length > 150) {
      Alert.alert("Nom trop long", "Le nom de la campagne est trop long.");
      return;
    }

    const budget = Number(budgetText);

    if (!Number.isFinite(budget) || budget <= 0) {
      Alert.alert("Budget invalide", "Saisissez un budget positif valide.");
      return;
    }

    if (description.length > 2000) {
      Alert.alert(
        "Description trop longue",
        "La description dépasse la limite autorisée.",
      );
      return;
    }

    if (saving) {
      return;
    }

    setSaving(true);

    try {
      /*
       * CONTRAT BACKEND EXISTANT DU FICHIER SOURCE.
       *
       * Nous conservons la devise attendue par
       * createAdCampaign. Elle devra être rendue
       * réellement multi-devise lorsque le backend
       * de régie le permettra.
       */
      await createCampaign({
        title,
        description: description || title,
        budget,
        currency: "FCFA",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      });

      resetForm();
      setShowCreate(false);

      Alert.alert(
        "Campagne créée",
        "La campagne a été enregistrée. Sa diffusion dépendra de son état et de la configuration de la régie.",
      );
    } catch (error) {
      console.error("PubPage.createCampaign:", error);

      Alert.alert(
        "Création impossible",
        "La campagne n'a pas pu être enregistrée. Vérifiez votre connexion et réessayez.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCampaign = async (campaign: {
    _id: any;
    status: string;
  }) => {
    if (updatingCampaignId) {
      return;
    }

    if (campaign.status !== "active" && campaign.status !== "paused") {
      return;
    }

    const nextStatus: CampaignStatus =
      campaign.status === "active" ? "paused" : "active";

    setUpdatingCampaignId(String(campaign._id));

    try {
      await updateStatus({
        campaignId: campaign._id,
        status: nextStatus,
      });
    } catch (error) {
      console.error("PubPage.updateCampaignStatus:", error);

      Alert.alert(
        "Modification impossible",
        "L'état de la campagne n'a pas pu être modifié.",
      );
    } finally {
      setUpdatingCampaignId(null);
    }
  };

  return (
    <View style={styles.screen}>
      {/* ======================================================
          HEADER
      ======================================================= */}

      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.pressed,
          ]}
        >
          <ArrowLeft size={19} color="#ffffff" />
        </Pressable>

        <View style={styles.headerTitleBlock}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Régie publicitaire</Text>

            <View style={styles.revenueBadge}>
              <DollarSign size={10} color="#FBBF24" />

              <Text style={styles.revenueBadgeText}>BUSINESS</Text>
            </View>
          </View>

          <Text style={styles.headerSubtitle}>Créer · diffuser · mesurer</Text>
        </View>

        <Pressable
          onPress={() => {
            resetForm();
            setShowCreate(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Créer une campagne"
          style={({ pressed }) => [
            styles.createHeaderButton,
            pressed && styles.pressed,
          ]}
        >
          <Plus size={19} color="#ffffff" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ====================================================
            BUSINESS HERO
        ===================================================== */}

        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <TrendingUp size={24} color="#FBBF24" strokeWidth={2} />
            </View>

            <View style={styles.heroTrust}>
              <ShieldCheck size={14} color="#34D399" />

              <Text style={styles.heroTrustText}>Données de campagne</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>
            Transformez votre audience en opportunités commerciales.
          </Text>

          <Text style={styles.heroText}>
            Pilotez vos campagnes depuis un espace unique et mesurez les
            impressions, les clics et les dépenses enregistrées par la régie.
          </Text>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{totalCampaigns}</Text>

              <Text style={styles.heroStatLabel}>campagnes</Text>
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{activeCampaigns}</Text>

              <Text style={styles.heroStatLabel}>actives</Text>
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{clickThroughRate}</Text>

              <Text style={styles.heroStatLabel}>CTR observé</Text>
            </View>
          </View>
        </View>

        {/* ====================================================
            REAL STATS
        ===================================================== */}

        <Text style={styles.sectionEyebrow}>PERFORMANCE</Text>

        <View style={styles.metricsGrid}>
          {stats === undefined ? (
            <>
              <View style={styles.metricLoading}>
                <ActivityIndicator color="#818CF8" />
              </View>

              <View style={styles.metricLoading}>
                <ActivityIndicator color="#34D399" />
              </View>

              <View style={styles.metricLoading}>
                <ActivityIndicator color="#F59E0B" />
              </View>

              <View style={styles.metricLoading}>
                <ActivityIndicator color="#60A5FA" />
              </View>
            </>
          ) : (
            <>
              <MetricCard
                icon={Eye}
                label="Impressions"
                value={formatCompact(stats.totalImpressions)}
                description="enregistrées"
                accent="#818CF8"
              />

              <MetricCard
                icon={MousePointer2}
                label="Clics"
                value={formatCompact(stats.totalClicks)}
                description="enregistrés"
                accent="#34D399"
              />

              <MetricCard
                icon={DollarSign}
                label="Dépenses"
                value={formatMoney(stats.totalSpent)}
                description="enregistrées"
                accent="#F59E0B"
              />

              <MetricCard
                icon={BarChart3}
                label="CTR"
                value={clickThroughRate}
                description="clics / impressions"
                accent="#60A5FA"
              />
            </>
          )}
        </View>

        {/* ====================================================
            TABS
        ===================================================== */}

        <View style={styles.tabs}>
          <Pressable
            onPress={() => setActiveTab("campagnes")}
            style={({ pressed }) => [
              styles.tab,
              activeTab === "campagnes" && styles.activeTab,
              pressed && styles.pressed,
            ]}
          >
            <Target
              size={14}
              color={activeTab === "campagnes" ? "#ffffff" : "#64748B"}
            />

            <Text
              style={[
                styles.tabText,
                activeTab === "campagnes" && styles.activeTabText,
              ]}
            >
              Campagnes
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("performance")}
            style={({ pressed }) => [
              styles.tab,
              activeTab === "performance" && styles.activeTab,
              pressed && styles.pressed,
            ]}
          >
            <BarChart3
              size={14}
              color={activeTab === "performance" ? "#ffffff" : "#64748B"}
            />

            <Text
              style={[
                styles.tabText,
                activeTab === "performance" && styles.activeTabText,
              ]}
            >
              Analyse
            </Text>
          </Pressable>
        </View>

        {/* ====================================================
            CREATE CAMPAIGN
        ===================================================== */}

        {showCreate ? (
          <View style={styles.createCard}>
            <View style={styles.createHeader}>
              <View>
                <Text style={styles.createTitle}>Nouvelle campagne</Text>

                <Text style={styles.createSubtitle}>
                  Préparez votre campagne publicitaire.
                </Text>
              </View>

              <Pressable
                onPress={() => setShowCreate(false)}
                accessibilityRole="button"
                accessibilityLabel="Fermer"
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.pressed,
                ]}
              >
                <X size={17} color="#94A3B8" />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Nom de campagne</Text>

            <TextInput
              value={campaignName}
              onChangeText={setCampaignName}
              placeholder="Ex. Lancement produit"
              placeholderTextColor="#64748B"
              maxLength={150}
              style={styles.input}
              autoCapitalize="sentences"
              returnKeyType="next"
            />

            <Text style={styles.inputLabel}>Description</Text>

            <TextInput
              value={campaignDescription}
              onChangeText={setCampaignDescription}
              placeholder="Objectif ou contexte de la campagne"
              placeholderTextColor="#64748B"
              maxLength={2000}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={[styles.input, styles.textarea]}
            />

            <Text style={styles.inputLabel}>Budget</Text>

            <TextInput
              value={campaignBudget}
              onChangeText={(value) =>
                setCampaignBudget(value.replace(/[^0-9.]/g, ""))
              }
              placeholder="Budget"
              placeholderTextColor="#64748B"
              keyboardType="decimal-pad"
              style={styles.input}
            />

            <View style={styles.currencyNotice}>
              <Wallet size={15} color="#FBBF24" />

              <Text style={styles.currencyNoticeText}>
                Le contrat publicitaire actuel utilise FCFA. La gestion
                multi-devise doit être ajoutée au backend avant de présenter
                d'autres devises comme disponibles.
              </Text>
            </View>

            <View style={styles.createActions}>
              <Pressable
                onPress={() => {
                  resetForm();
                  setShowCreate(false);
                }}
                disabled={saving}
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  void handleCreate();
                }}
                disabled={saving}
                style={({ pressed }) => [
                  styles.submitButton,
                  pressed && styles.pressed,
                  saving && styles.disabled,
                ]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Plus size={15} color="#ffffff" />

                    <Text style={styles.submitButtonText}>Créer</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* ====================================================
            CAMPAIGNS
        ===================================================== */}

        {activeTab === "campagnes" ? (
          <View>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Vos campagnes</Text>

                <Text style={styles.sectionSubtitle}>
                  Gestion des campagnes enregistrées
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  resetForm();
                  setShowCreate(true);
                }}
                style={({ pressed }) => [
                  styles.smallCreateButton,
                  pressed && styles.pressed,
                ]}
              >
                <Plus size={14} color="#ffffff" />

                <Text style={styles.smallCreateText}>Nouvelle</Text>
              </Pressable>
            </View>

            {campaigns === undefined ? (
              <View style={styles.loadingCampaigns}>
                {[0, 1, 2].map((index) => (
                  <View key={index} style={styles.loadingCampaign}>
                    <ActivityIndicator color="#64748B" />
                  </View>
                ))}
              </View>
            ) : campaigns.length === 0 ? (
              <EmptyState
                onCreate={() => {
                  resetForm();
                  setShowCreate(true);
                }}
              />
            ) : (
              <View style={styles.campaignList}>
                {campaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign._id}
                    campaign={campaign}
                    updating={updatingCampaignId === String(campaign._id)}
                    onToggle={() => {
                      void handleToggleCampaign(campaign);
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        ) : null}

        {/* ====================================================
            PERFORMANCE
        ===================================================== */}

        {activeTab === "performance" ? (
          <View>
            <Text style={styles.sectionEyebrow}>ANALYSE PUBLICITAIRE</Text>

            <View style={styles.analysisCard}>
              <View style={styles.analysisIcon}>
                <BarChart3 size={22} color="#818CF8" />
              </View>

              <Text style={styles.analysisTitle}>Performance mesurée</Text>

              <Text style={styles.analysisText}>
                Les indicateurs ci-dessous proviennent des statistiques
                publicitaires disponibles dans votre backend. Aucun volume de
                portée ou de conversion estimé n'est ajouté artificiellement.
              </Text>
            </View>

            {stats ? (
              <View style={styles.analysisGrid}>
                <View style={styles.analysisMetric}>
                  <Text style={styles.analysisMetricLabel}>Impressions</Text>

                  <Text style={styles.analysisMetricValue}>
                    {formatNumber(stats.totalImpressions)}
                  </Text>
                </View>

                <View style={styles.analysisMetric}>
                  <Text style={styles.analysisMetricLabel}>Clics</Text>

                  <Text style={styles.analysisMetricValue}>
                    {formatNumber(stats.totalClicks)}
                  </Text>
                </View>

                <View style={styles.analysisMetric}>
                  <Text style={styles.analysisMetricLabel}>CTR</Text>

                  <Text style={styles.analysisMetricValue}>
                    {clickThroughRate}
                  </Text>
                </View>

                <View style={styles.analysisMetric}>
                  <Text style={styles.analysisMetricLabel}>Dépensé</Text>

                  <Text style={styles.analysisMetricValue}>
                    {formatMoney(stats.totalSpent)}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.analysisLoading}>
                <ActivityIndicator color="#818CF8" />

                <Text style={styles.analysisLoadingText}>
                  Chargement des statistiques…
                </Text>
              </View>
            )}

            <View style={styles.businessNotice}>
              <ShieldCheck size={18} color="#34D399" />

              <View style={styles.businessNoticeBody}>
                <Text style={styles.businessNoticeTitle}>
                  Mesure avant monétisation
                </Text>

                <Text style={styles.businessNoticeText}>
                  Les statistiques constituent la base nécessaire pour facturer
                  une diffusion publicitaire de manière transparente. Les
                  impressions, clics, dépenses, conversions, ciblage et
                  facturation doivent provenir d'événements backend vérifiables.
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* ====================================================
            MONETIZATION ROADMAP
        ===================================================== */}

        <View style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <View style={styles.revenueIcon}>
              <DollarSign size={19} color="#FBBF24" />
            </View>

            <View style={styles.revenueHeaderText}>
              <Text style={styles.revenueTitle}>Infrastructure de revenus</Text>

              <Text style={styles.revenueSubtitle}>
                Fondations de la régie DébrouillePro
              </Text>
            </View>
          </View>

          <RevenueCapability
            title="Campagnes"
            description="Création et gestion des campagnes connectées au backend."
            available
          />

          <RevenueCapability
            title="Mesure"
            description="Impressions, clics et dépenses déjà exposés par les statistiques disponibles."
            available
          />

          <RevenueCapability
            title="Ciblage"
            description="À connecter à des segments et règles de ciblage réellement persistés."
            available={false}
          />

          <RevenueCapability
            title="Facturation"
            description="À connecter à une véritable logique de paiement, factures et reçus."
            available={false}
          />

          <RevenueCapability
            title="Attribution"
            description="À connecter à des conversions et événements vérifiables."
            available={false}
          />

          <RevenueCapability
            title="Marketplace publicitaire"
            description="À connecter lorsque les formats et inventaires publicitaires seront réellement définis."
            available={false}
          />
        </View>

        <Text style={styles.footer}>
          Les données affichées dans cet espace doivent provenir du système
          publicitaire DébrouillePro. Aucun tarif, volume de portée, conversion
          ou revenu prévisionnel n'est présenté comme réel sans donnée backend.
        </Text>
      </ScrollView>
    </View>
  );
}

function RevenueCapability({
  title,
  description,
  available,
}: {
  title: string;
  description: string;
  available: boolean;
}) {
  return (
    <View style={styles.revenueCapability}>
      <View
        style={[
          styles.capabilityIcon,
          {
            backgroundColor: available
              ? "rgba(52,211,153,0.10)"
              : "rgba(148,163,184,0.08)",
          },
        ]}
      >
        {available ? (
          <CheckCircle2 size={15} color="#34D399" />
        ) : (
          <Clock3 size={15} color="#64748B" />
        )}
      </View>

      <View style={styles.capabilityBody}>
        <Text style={styles.capabilityTitle}>{title}</Text>

        <Text style={styles.capabilityDescription}>{description}</Text>
      </View>

      <Text
        style={[
          styles.capabilityStatus,
          {
            color: available ? "#34D399" : "#64748B",
          },
        ]}
      >
        {available ? "Connecté" : "À connecter"}
      </Text>
    </View>
  );
}

function PubContentPublic({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.publicScreen}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Retour"
        style={({ pressed }) => [
          styles.headerButton,
          pressed && styles.pressed,
        ]}
      >
        <ArrowLeft size={19} color="#ffffff" />
      </Pressable>

      <View style={styles.publicHero}>
        <View style={styles.publicIcon}>
          <TrendingUp size={35} color="#FBBF24" />
        </View>

        <Text style={styles.publicTitle}>Publicité & Régie</Text>

        <Text style={styles.publicText}>
          Connectez-vous pour accéder à l'espace annonceur et gérer vos
          campagnes publicitaires.
        </Text>

        <SignInButton />
      </View>
    </View>
  );
}

export default function PubPage({ onBack }: PubPageProps) {
  return (
    <View style={styles.screen}>
      <Authenticated>
        <PubContent onBack={onBack} />
      </Authenticated>

      <Unauthenticated>
        <PubContentPublic onBack={onBack} />
      </Unauthenticated>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#050812",
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 45,
  },

  header: {
    minHeight: 76,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
    backgroundColor: "#050812",
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  headerTitleBlock: {
    flex: 1,
    marginLeft: 11,
  },

  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  headerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
  },

  headerSubtitle: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 3,
  },

  revenueBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: "rgba(245,158,11,0.10)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.20)",
  },

  revenueBadgeText: {
    color: "#FBBF24",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  createHeaderButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#B7791F",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.35)",
  },

  hero: {
    marginTop: 15,
    padding: 19,
    borderRadius: 22,
    backgroundColor: "rgba(245,158,11,0.07)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.14)",
  },

  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245,158,11,0.10)",
  },

  heroTrust: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  heroTrustText: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "700",
  },

  heroTitle: {
    color: "#ffffff",
    fontSize: 23,
    lineHeight: 29,
    fontWeight: "900",
    marginTop: 18,
    letterSpacing: -0.3,
  },

  heroText: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 8,
  },

  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
  },

  heroStat: {
    flex: 1,
    alignItems: "center",
  },

  heroStatValue: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "900",
  },

  heroStatLabel: {
    color: "#64748B",
    fontSize: 9,
    marginTop: 2,
  },

  heroDivider: {
    width: 1,
    height: 25,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  sectionEyebrow: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.7,
    marginTop: 20,
    marginBottom: 9,
  },

  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  metricCard: {
    width: "48.8%",
    minHeight: 126,
    padding: 13,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  metricLoading: {
    width: "48.8%",
    height: 126,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },

  metricLabel: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "700",
  },

  metricValue: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 2,
  },

  metricDescription: {
    color: "#475569",
    fontSize: 9,
    marginTop: 3,
  },

  tabs: {
    flexDirection: "row",
    padding: 4,
    marginTop: 15,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  tab: {
    flex: 1,
    minHeight: 39,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  activeTab: {
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  tabText: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "800",
  },

  activeTabText: {
    color: "#ffffff",
  },

  createCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  createHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  createTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },

  createSubtitle: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 16,
    marginTop: 3,
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  inputLabel: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 6,
    marginTop: 10,
  },

  input: {
    minHeight: 46,
    paddingHorizontal: 13,
    borderRadius: 13,
    color: "#ffffff",
    fontSize: 12,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  textarea: {
    minHeight: 100,
    paddingTop: 12,
  },

  currencyNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 11,
    marginTop: 12,
    borderRadius: 13,
    backgroundColor: "rgba(245,158,11,0.07)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.13)",
  },

  currencyNoticeText: {
    flex: 1,
    color: "#9CA3AF",
    fontSize: 9,
    lineHeight: 15,
    marginLeft: 8,
  },

  createActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 15,
  },

  cancelButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  cancelButtonText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
  },

  submitButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#B7791F",
  },

  submitButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },

  disabled: {
    opacity: 0.55,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 10,
  },

  sectionTitle: {
    color: "#E2E8F0",
    fontSize: 14,
    fontWeight: "900",
  },

  sectionSubtitle: {
    color: "#64748B",
    fontSize: 9,
    marginTop: 3,
  },

  smallCreateButton: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(245,158,11,0.15)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.22)",
  },

  smallCreateText: {
    color: "#FBBF24",
    fontSize: 10,
    fontWeight: "800",
  },

  loadingCampaigns: {
    gap: 9,
  },

  loadingCampaign: {
    height: 210,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  emptyState: {
    minHeight: 280,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    marginBottom: 13,
  },

  emptyTitle: {
    color: "#CBD5E1",
    fontSize: 15,
    fontWeight: "900",
  },

  emptyText: {
    color: "#64748B",
    fontSize: 11,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 7,
  },

  emptyButton: {
    minHeight: 43,
    paddingHorizontal: 16,
    marginTop: 17,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#B7791F",
  },

  emptyButtonText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
  },

  campaignList: {
    gap: 10,
  },

  campaignCard: {
    padding: 15,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  campaignHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  campaignTitleBlock: {
    flex: 1,
    paddingRight: 10,
  },

  campaignTitle: {
    color: "#F8FAFC",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "850",
  },

  campaignDescription: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
    borderWidth: 1,
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  statusText: {
    fontSize: 8,
    fontWeight: "900",
  },

  campaignMetrics: {
    flexDirection: "row",
    gap: 8,
    marginTop: 15,
  },

  campaignMetric: {
    flex: 1,
    minHeight: 53,
    padding: 8,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  campaignMetricLabel: {
    color: "#64748B",
    fontSize: 8,
  },

  campaignMetricValue: {
    color: "#E2E8F0",
    fontSize: 10,
    fontWeight: "850",
    marginTop: 2,
  },

  budgetBlock: {
    marginTop: 14,
  },

  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  budgetLabel: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "700",
  },

  budgetPercentage: {
    color: "#FBBF24",
    fontSize: 9,
    fontWeight: "900",
  },

  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#D97706",
  },

  budgetFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },

  budgetValue: {
    color: "#64748B",
    fontSize: 8,
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },

  dateText: {
    color: "#64748B",
    fontSize: 9,
  },

  campaignAction: {
    minHeight: 40,
    marginTop: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  pauseActionText: {
    color: "#FBBF24",
    fontSize: 10,
    fontWeight: "800",
  },

  resumeActionText: {
    color: "#34D399",
    fontSize: 10,
    fontWeight: "800",
  },

  analysisCard: {
    padding: 17,
    borderRadius: 19,
    backgroundColor: "rgba(99,102,241,0.07)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.13)",
  },

  analysisIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.10)",
  },

  analysisTitle: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 12,
  },

  analysisText: {
    color: "#7C879A",
    fontSize: 10,
    lineHeight: 17,
    marginTop: 5,
  },

  analysisGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },

  analysisMetric: {
    width: "48.8%",
    padding: 14,
    minHeight: 88,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  analysisMetricLabel: {
    color: "#64748B",
    fontSize: 9,
  },

  analysisMetricValue: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 8,
  },

  analysisLoading: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  analysisLoadingText: {
    color: "#64748B",
    fontSize: 10,
  },

  businessNotice: {
    flexDirection: "row",
    marginTop: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(52,211,153,0.06)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.12)",
  },

  businessNoticeBody: {
    flex: 1,
    marginLeft: 10,
  },

  businessNoticeTitle: {
    color: "#D1FAE5",
    fontSize: 11,
    fontWeight: "850",
  },

  businessNoticeText: {
    color: "#64748B",
    fontSize: 9,
    lineHeight: 15,
    marginTop: 4,
  },

  revenueCard: {
    marginTop: 18,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(245,158,11,0.045)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.11)",
  },

  revenueHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },

  revenueIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245,158,11,0.10)",
    marginRight: 10,
  },

  revenueHeaderText: {
    flex: 1,
  },

  revenueTitle: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "900",
  },

  revenueSubtitle: {
    color: "#64748B",
    fontSize: 9,
    marginTop: 3,
  },

  revenueCapability: {
    minHeight: 57,
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.055)",
  },

  capabilityIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  capabilityBody: {
    flex: 1,
  },

  capabilityTitle: {
    color: "#CBD5E1",
    fontSize: 10,
    fontWeight: "800",
  },

  capabilityDescription: {
    color: "#64748B",
    fontSize: 8,
    lineHeight: 13,
    marginTop: 2,
  },

  capabilityStatus: {
    fontSize: 8,
    fontWeight: "900",
    marginLeft: 8,
  },

  footer: {
    color: "#475569",
    fontSize: 9,
    lineHeight: 15,
    textAlign: "center",
    marginTop: 18,
    paddingHorizontal: 10,
  },

  publicScreen: {
    flex: 1,
    backgroundColor: "#050812",
  },

  publicHero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  publicIcon: {
    width: 76,
    height: 76,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245,158,11,0.10)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.16)",
  },

  publicTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 17,
  },

  publicText: {
    maxWidth: 340,
    color: "#64748B",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 22,
  },

  pressed: {
    opacity: 0.68,
  },
});
