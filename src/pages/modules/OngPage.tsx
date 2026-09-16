import React, { useMemo, useState, type ReactNode } from "react";

import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  ArrowLeft,
  Banknote,
  Check,
  CheckCircle,
  ChevronRight,
  Globe,
  HandHeart,
  Heart,
  Info,
  Plus,
  Search,
  Target,
  Users,
  X,
} from "lucide-react-native";

import { useMutation, useQuery } from "convex/react";

import { Authenticated, Unauthenticated } from "@/lib/convex-auth-compat";

import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";

/* ============================================================================
 * TYPES
 * ========================================================================== */

type CampaignWithNGO = {
  _id: string;
  title: string;
  description: string;
  goal: number;
  raised: number;
  donorCount: number;
  currency: string;
  status: string;
  ngoName: string;
  ngoLogo?: string;
};

type NGOForm = {
  name: string;
  mission: string;
  description: string;
  category: string;
  city: string;
  country: string;
  website: string;
  phone: string;
};

type Tab = "causes" | "my-ngo";

/* ============================================================================
 * CONSTANTS
 * ========================================================================== */

const ACCENT = "#F97316";
const GREEN = "#10B981";
const RED = "#EF4444";
const PURPLE = "#8B5CF6";
const BLUE = "#3B82F6";

const DEFAULT_CATEGORY = "humanitaire";

const PRESET_AMOUNTS = ["1000", "5000", "10000", "25000"];

/*
 * Important:
 * Ces devises correspondent au contrat actuel de la mutation donate.
 * La devise XOF est conservée comme valeur initiale du formulaire parce
 * qu'elle était explicitement utilisée par le backend existant fourni.
 *
 * Pour un véritable paiement multi-devises mondial, le backend devra ensuite
 * exposer les devises réellement supportées par chaque campagne.
 */
const DONATION_CURRENCIES = ["XOF", "USD", "EUR"];

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function formatAmount(value: number, currency: string): string {
  const safeCurrency = currency?.trim() || "";

  return `${Math.round(value).toLocaleString("fr-FR")} ${safeCurrency}`;
}

function formatPercent(raised: number, goal: number): number {
  if (!Number.isFinite(goal) || goal <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((raised / goal) * 100));
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/* ============================================================================
 * PREMIUM HEADER
 * ========================================================================== */

function OngHeader({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [styles.headerBack, pressed && styles.pressed]}
      >
        <ArrowLeft size={19} color="#FFFFFF" />
      </Pressable>

      <View style={styles.headerIdentity}>
        <View style={styles.headerIcon}>
          <HandHeart size={19} color={ACCENT} strokeWidth={2.2} />
        </View>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>ONG & Impact</Text>

          <Text style={styles.headerSubtitle}>
            Causes · Engagement · Impact
          </Text>
        </View>
      </View>

      <View style={styles.globalBadge}>
        <Globe size={15} color="#60A5FA" />
      </View>
    </View>
  );
}

/* ============================================================================
 * KPI
 * ========================================================================== */

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <View
        style={[
          styles.statIcon,
          {
            backgroundColor: `${color}14`,
          },
        ]}
      >
        {icon}
      </View>

      <Text style={styles.statValue}>{value}</Text>

      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/* ============================================================================
 * CAMPAIGN CARD
 * ========================================================================== */

function CampaignCard({
  campaign,
  onDonate,
}: {
  campaign: CampaignWithNGO;
  onDonate: (id: string) => void;
}) {
  const percentage = formatPercent(campaign.raised, campaign.goal);

  const hasGoal = Number.isFinite(campaign.goal) && campaign.goal > 0;

  return (
    <View style={styles.campaignCard}>
      <View style={styles.campaignTop}>
        <View style={styles.campaignIcon}>
          <Heart size={18} color={RED} fill="rgba(239,68,68,0.12)" />
        </View>

        <View style={styles.campaignIdentity}>
          <Text numberOfLines={2} style={styles.campaignTitle}>
            {campaign.title}
          </Text>

          <Text numberOfLines={1} style={styles.campaignNGO}>
            {campaign.ngoName}
          </Text>
        </View>

        <View style={styles.campaignStatus}>
          <View style={styles.statusDot} />

          <Text style={styles.statusText}>{campaign.status}</Text>
        </View>
      </View>

      <Text numberOfLines={4} style={styles.campaignDescription}>
        {campaign.description}
      </Text>

      {hasGoal ? (
        <View style={styles.progressBlock}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressLabel}>Collecté</Text>

              <Text style={styles.progressAmount}>
                {formatAmount(campaign.raised, campaign.currency)}
              </Text>
            </View>

            <Text style={styles.progressPercent}>{percentage}%</Text>
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

          <View style={styles.progressFooter}>
            <Text style={styles.progressFooterText}>
              Objectif {formatAmount(campaign.goal, campaign.currency)}
            </Text>

            <Text style={styles.progressFooterText}>
              {campaign.donorCount} donateur
              {campaign.donorCount !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.noGoalNotice}>
          <Info size={13} color="#71717A" />

          <Text style={styles.noGoalNoticeText}>
            Aucun objectif financier exploitable n'est disponible pour cette
            campagne.
          </Text>
        </View>
      )}

      <Authenticated>
        <Pressable
          onPress={() => onDonate(campaign._id)}
          style={({ pressed }) => [
            styles.donateButton,
            pressed && styles.pressed,
          ]}
        >
          <Heart size={15} color="#FFFFFF" />

          <Text style={styles.donateButtonText}>Faire un don</Text>
        </Pressable>
      </Authenticated>

      <Unauthenticated>
        <Pressable
          onPress={() =>
            Alert.alert(
              "Connexion requise",
              "Connectez-vous pour pouvoir effectuer un don.",
            )
          }
          style={({ pressed }) => [
            styles.donateButton,
            pressed && styles.pressed,
          ]}
        >
          <Heart size={15} color="#FFFFFF" />

          <Text style={styles.donateButtonText}>Faire un don</Text>
        </Pressable>
      </Unauthenticated>
    </View>
  );
}

/* ============================================================================
 * DONATE MODAL
 * ========================================================================== */

function DonateModal({
  campaignId,
  onClose,
}: {
  campaignId: string;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("5000");

  const [currency, setCurrency] = useState(DONATION_CURRENCIES[0]);

  const [message, setMessage] = useState("");

  const [anonymous, setAnonymous] = useState(false);

  const [loading, setLoading] = useState(false);

  const donate = useMutation(api.community.donate);

  const numericAmount = Number.parseInt(amount.replace(/[^\d]/g, ""), 10);

  const validAmount = Number.isFinite(numericAmount) && numericAmount >= 100;

  const handleDonate = async () => {
    if (!validAmount) {
      Alert.alert(
        "Montant invalide",
        "Le montant minimum accepté par le contrat actuel est de 100 unités monétaires.",
      );
      return;
    }

    if (loading) {
      return;
    }

    setLoading(true);

    try {
      await donate({
        campaignId: campaignId as Id<"ngoCampaigns">,
        amount: numericAmount,
        currency,
        anonymous,
        message: message.trim() || undefined,
      });

      Alert.alert("Don enregistré", "Merci pour votre contribution.", [
        {
          text: "Fermer",
          onPress: onClose,
        },
      ]);
    } catch (error) {
      console.error("Donation failed:", error);

      Alert.alert(
        "Don non enregistré",
        "Le don n'a pas pu être enregistré. Aucun succès ne sera affiché tant que le backend ne l'aura pas confirmé.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (!loading) {
          onClose();
        }
      }}
    >
      <View style={styles.modalRoot}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => {
            if (!loading) {
              onClose();
            }
          }}
        />

        <View style={styles.donateSheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View style={styles.sheetTitleRow}>
              <View style={styles.sheetTitleIcon}>
                <Heart size={17} color={RED} />
              </View>

              <View>
                <Text style={styles.sheetTitle}>Soutenir une cause</Text>

                <Text style={styles.sheetSubtitle}>Contribution sécurisée</Text>
              </View>
            </View>

            <Pressable
              disabled={loading}
              onPress={onClose}
              style={styles.closeButton}
            >
              <X size={17} color="#A1A1AA" />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.modalContent}
          >
            <Text style={styles.formLabel}>Devise</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.currencyRow}
            >
              {DONATION_CURRENCIES.map((item) => {
                const active = currency === item;

                return (
                  <Pressable
                    key={item}
                    onPress={() => setCurrency(item)}
                    style={[
                      styles.currencyChip,
                      active && styles.currencyChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.currencyText,
                        active && styles.currencyTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.formLabel}>Montant</Text>

            <View style={styles.amountInputWrap}>
              <Banknote size={17} color="#71717A" />

              <TextInput
                value={amount}
                onChangeText={(value) => setAmount(value.replace(/[^\d]/g, ""))}
                placeholder="Montant"
                placeholderTextColor="#52525B"
                keyboardType="number-pad"
                style={styles.amountInput}
              />

              <Text style={styles.amountCurrency}>{currency}</Text>
            </View>

            <View style={styles.presetRow}>
              {PRESET_AMOUNTS.map((preset) => {
                const active = amount === preset;

                return (
                  <Pressable
                    key={preset}
                    onPress={() => setAmount(preset)}
                    style={[
                      styles.presetButton,
                      active && styles.presetButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        active && styles.presetTextActive,
                      ]}
                    >
                      {Number(preset).toLocaleString("fr-FR")}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.formLabel}>Message</Text>

            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Un message pour l'ONG (optionnel)"
              placeholderTextColor="#52525B"
              multiline
              textAlignVertical="top"
              maxLength={500}
              style={styles.messageInput}
            />

            <Pressable
              onPress={() => setAnonymous((value) => !value)}
              style={styles.anonymousRow}
            >
              <View
                style={[styles.checkbox, anonymous && styles.checkboxActive]}
              >
                {anonymous ? (
                  <Check size={11} color="#FFFFFF" strokeWidth={3} />
                ) : null}
              </View>

              <View style={styles.anonymousText}>
                <Text style={styles.anonymousTitle}>Don anonyme</Text>

                <Text style={styles.anonymousSubtitle}>
                  Votre identité ne sera pas affichée comme donateur si le
                  backend applique cette préférence.
                </Text>
              </View>
            </Pressable>

            <View style={styles.donationNotice}>
              <Info size={14} color="#60A5FA" />

              <Text style={styles.donationNoticeText}>
                La validation finale dépend exclusivement de la mutation Convex
                existante. Cette interface n'affiche pas un paiement comme
                réussi avant confirmation du backend.
              </Text>
            </View>

            <Pressable
              disabled={!validAmount || loading}
              onPress={handleDonate}
              style={({ pressed }) => [
                styles.confirmDonateButton,
                (!validAmount || loading) && styles.disabledButton,
                pressed && styles.pressed,
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Heart size={16} color="#FFFFFF" />
              )}

              <Text style={styles.confirmDonateText}>
                {loading ? "Enregistrement…" : "Confirmer le don"}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ============================================================================
 * CREATE NGO MODAL
 * ========================================================================== */

function CreateNGOModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const createNGO = useMutation(api.community.createNGO);

  const [form, setForm] = useState<NGOForm>({
    name: "",
    mission: "",
    description: "",
    category: DEFAULT_CATEGORY,
    city: "",
    country: "",
    website: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);

  const canSubmit =
    form.name.trim().length >= 2 && form.mission.trim().length >= 2;

  const updateField = <K extends keyof NGOForm>(key: K, value: NGOForm[K]) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleCreate = async () => {
    if (!canSubmit || loading) {
      return;
    }

    setLoading(true);

    try {
      await createNGO({
        name: form.name.trim(),
        mission: form.mission.trim(),
        description: form.description.trim(),
        category: form.category.trim() || DEFAULT_CATEGORY,
        city: form.city.trim(),
        country: form.country.trim(),
        website: form.website.trim(),
        phone: form.phone.trim(),
      });

      Alert.alert(
        "ONG créée",
        "Votre demande de création a été enregistrée par le backend.",
        [
          {
            text: "Continuer",
            onPress: () => {
              onCreated();
              onClose();
            },
          },
        ],
      );
    } catch (error) {
      console.error("Create NGO failed:", error);

      Alert.alert(
        "Création impossible",
        "L'ONG n'a pas pu être créée. Vérifiez les informations puis réessayez.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (!loading) {
          onClose();
        }
      }}
    >
      <View style={styles.modalRoot}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => {
            if (!loading) {
              onClose();
            }
          }}
        />

        <View style={styles.createSheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Créer votre ONG</Text>

              <Text style={styles.sheetSubtitle}>Profil organisationnel</Text>
            </View>

            <Pressable
              disabled={loading}
              onPress={onClose}
              style={styles.closeButton}
            >
              <X size={17} color="#A1A1AA" />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.modalContent}
          >
            <View style={styles.globalNotice}>
              <Globe size={16} color="#60A5FA" />

              <Text style={styles.globalNoticeText}>
                DébrouillePro est conçu pour accueillir des organisations de
                différents pays. Le pays et la localisation doivent être
                renseignés selon la réalité de votre ONG.
              </Text>
            </View>

            <FormInput
              label="Nom de l'ONG *"
              value={form.name}
              placeholder="Nom officiel"
              onChangeText={(value) => updateField("name", value)}
            />

            <FormInput
              label="Mission *"
              value={form.mission}
              placeholder="Mission principale de l'organisation"
              onChangeText={(value) => updateField("mission", value)}
            />

            <FormInput
              label="Description"
              value={form.description}
              placeholder="Présentation de l'organisation"
              onChangeText={(value) => updateField("description", value)}
              multiline
            />

            <FormInput
              label="Catégorie"
              value={form.category}
              placeholder="Catégorie"
              onChangeText={(value) => updateField("category", value)}
            />

            <View style={styles.formTwoColumns}>
              <View style={styles.formColumn}>
                <FormInput
                  label="Ville"
                  value={form.city}
                  placeholder="Ville"
                  onChangeText={(value) => updateField("city", value)}
                />
              </View>

              <View style={styles.formColumn}>
                <FormInput
                  label="Pays"
                  value={form.country}
                  placeholder="Pays"
                  onChangeText={(value) => updateField("country", value)}
                />
              </View>
            </View>

            <FormInput
              label="Site web"
              value={form.website}
              placeholder="https://..."
              autoCapitalize="none"
              keyboardType="url"
              onChangeText={(value) => updateField("website", value)}
            />

            <FormInput
              label="Téléphone"
              value={form.phone}
              placeholder="Numéro professionnel"
              keyboardType="phone-pad"
              onChangeText={(value) => updateField("phone", value)}
            />

            <View style={styles.integrityNotice}>
              <Info size={14} color="#A78BFA" />

              <Text style={styles.integrityNoticeText}>
                Seules les informations saisies seront envoyées à la mutation
                existante. Aucun statut de vérification ou agrément n'est
                inventé par cette interface.
              </Text>
            </View>

            <Pressable
              disabled={!canSubmit || loading}
              onPress={handleCreate}
              style={({ pressed }) => [
                styles.createButton,
                (!canSubmit || loading) && styles.disabledButton,
                pressed && styles.pressed,
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Plus size={16} color="#FFFFFF" />
              )}

              <Text style={styles.createButtonText}>
                {loading ? "Création…" : "Créer mon ONG"}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ============================================================================
 * FORM INPUT
 * ========================================================================== */

function FormInput({
  label,
  value,
  placeholder,
  onChangeText,
  multiline = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
}: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  keyboardType?: "default" | "url" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  return (
    <View style={styles.formGroup}>
      <Text style={styles.formLabel}>{label}</Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#52525B"
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        textAlignVertical={multiline ? "top" : "center"}
        style={[styles.formInput, multiline && styles.formInputMultiline]}
      />
    </View>
  );
}

/* ============================================================================
 * NGO PROFILE
 * ========================================================================== */

function MyNGOCard({ ngo }: { ngo: any }) {
  return (
    <View style={styles.ngoCard}>
      <View style={styles.ngoCardHeader}>
        <View style={styles.ngoLogo}>
          <Text style={styles.ngoLogoText}>🏛️</Text>
        </View>

        <View style={styles.ngoIdentity}>
          <Text numberOfLines={2} style={styles.ngoName}>
            {safeString(ngo?.name) || "ONG"}
          </Text>

          <Text style={styles.ngoMeta}>
            {[
              safeString(ngo?.category),
              safeString(ngo?.city),
              safeString(ngo?.country),
            ]
              .filter(Boolean)
              .join(" · ") || "Organisation"}
          </Text>
        </View>

        {ngo?.verified ? (
          <View style={styles.verifiedBadge}>
            <CheckCircle size={15} color={GREEN} />
          </View>
        ) : null}
      </View>

      {safeString(ngo?.mission) ? (
        <Text style={styles.ngoMission}>{ngo.mission}</Text>
      ) : null}

      {safeString(ngo?.description) ? (
        <Text numberOfLines={4} style={styles.ngoDescription}>
          {ngo.description}
        </Text>
      ) : null}

      <View style={styles.ngoStats}>
        <View style={styles.ngoStat}>
          <Text style={styles.ngoStatValue}>
            {formatAmount(
              Number(ngo?.totalDonations ?? 0),
              safeString(ngo?.currency) || "",
            )}
          </Text>

          <Text style={styles.ngoStatLabel}>dons enregistrés</Text>
        </View>

        <View style={styles.ngoStat}>
          <Text style={styles.ngoStatValue}>
            {Number(ngo?.donorCount ?? 0).toLocaleString("fr-FR")}
          </Text>

          <Text style={styles.ngoStatLabel}>donateurs</Text>
        </View>
      </View>

      <View style={styles.ngoIntegrity}>
        <CheckCircle size={13} color={ngo?.verified ? GREEN : "#71717A"} />

        <Text style={styles.ngoIntegrityText}>
          {ngo?.verified
            ? "Statut de vérification fourni par le backend."
            : "Statut de vérification non confirmé par les données affichées ici."}
        </Text>
      </View>
    </View>
  );
}

/* ============================================================================
 * MAIN
 * ========================================================================== */

export default function OngPage({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("causes");

  const [donatingId, setDonatingId] = useState<string | null>(null);

  const [showCreateNGO, setShowCreateNGO] = useState(false);

  const campaigns = useQuery(api.community.listActiveCampaigns, {});

  const myNGO = useQuery(api.community.getMyNGO, {});

  const campaignStats = useMemo(() => {
    if (campaigns === undefined) {
      return {
        campaigns: null,
        donors: null,
      };
    }

    return {
      campaigns: campaigns.length,
      donors: campaigns.reduce(
        (total, campaign) => total + Number(campaign.donorCount ?? 0),
        0,
      ),
    };
  }, [campaigns]);

  return (
    <View style={styles.screen}>
      <OngHeader onBack={onBack} />

      <View style={styles.globalBanner}>
        <View style={styles.globalBannerIcon}>
          <Globe size={16} color="#60A5FA" />
        </View>

        <View style={styles.globalBannerText}>
          <Text style={styles.globalBannerTitle}>Réseau ONG mondial</Text>

          <Text style={styles.globalBannerSubtitle}>
            Découvrez et soutenez des causes sans limiter l'espace à un seul
            pays.
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard
          icon={<Heart size={15} color={RED} />}
          label="Campagnes"
          value={
            campaignStats.campaigns === null
              ? "—"
              : String(campaignStats.campaigns)
          }
          color={RED}
        />

        <StatCard
          icon={<Users size={15} color={BLUE} />}
          label="Donateurs"
          value={
            campaignStats.donors === null
              ? "—"
              : campaignStats.donors.toLocaleString("fr-FR")
          }
          color={BLUE}
        />

        <StatCard
          icon={<Target size={15} color={GREEN} />}
          label="Engagement"
          value={
            campaigns === undefined ? "—" : campaigns.length > 0 ? "Actif" : "—"
          }
          color={GREEN}
        />
      </View>

      <View style={styles.tabs}>
        <Pressable
          onPress={() => setActiveTab("causes")}
          style={[styles.tab, activeTab === "causes" && styles.tabActive]}
        >
          <Heart size={13} color={activeTab === "causes" ? RED : "#71717A"} />

          <Text
            style={[
              styles.tabText,
              activeTab === "causes" && styles.tabTextActive,
            ]}
          >
            Causes
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab("my-ngo")}
          style={[styles.tab, activeTab === "my-ngo" && styles.tabActive]}
        >
          <HandHeart
            size={13}
            color={activeTab === "my-ngo" ? ACCENT : "#71717A"}
          />

          <Text
            style={[
              styles.tabText,
              activeTab === "my-ngo" && styles.tabTextActive,
            ]}
          >
            Mon ONG
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "causes" ? (
          <>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Causes actives</Text>

                <Text style={styles.sectionSubtitle}>
                  Campagnes provenant du backend.
                </Text>
              </View>

              <View style={styles.sectionIcon}>
                <Heart size={14} color={RED} />
              </View>
            </View>

            {campaigns === undefined ? (
              <View style={styles.loadingState}>
                <ActivityIndicator size="small" color={ACCENT} />

                <Text style={styles.loadingText}>
                  Chargement des campagnes…
                </Text>
              </View>
            ) : campaigns.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Heart size={27} color="#3F3F46" />
                </View>

                <Text style={styles.emptyTitle}>Aucune campagne active</Text>

                <Text style={styles.emptyText}>
                  Aucune campagne active n'est actuellement retournée par le
                  backend.
                </Text>
              </View>
            ) : (
              <View style={styles.campaignList}>
                {campaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign._id}
                    campaign={campaign as CampaignWithNGO}
                    onDonate={setDonatingId}
                  />
                ))}
              </View>
            )}

            <View style={styles.footerNotice}>
              <Info size={14} color="#71717A" />

              <Text style={styles.footerNoticeText}>
                Les informations affichées dans cette section proviennent des
                campagnes retournées par l'application. Aucun projet ou montant
                n'est ajouté artificiellement.
              </Text>
            </View>
          </>
        ) : (
          <>
            <Authenticated>
              {myNGO === undefined ? (
                <View style={styles.loadingState}>
                  <ActivityIndicator size="small" color={ACCENT} />

                  <Text style={styles.loadingText}>
                    Chargement de votre ONG…
                  </Text>
                </View>
              ) : myNGO ? (
                <MyNGOCard ngo={myNGO} />
              ) : (
                <View style={styles.createNGOCard}>
                  <View style={styles.createNGOIcon}>
                    <HandHeart size={28} color={ACCENT} />
                  </View>

                  <Text style={styles.createNGOTitle}>Créer votre ONG</Text>

                  <Text style={styles.createNGOText}>
                    Présentez votre organisation, sa mission et son implantation
                    réelle pour commencer à utiliser les fonctions ONG
                    disponibles.
                  </Text>

                  <Pressable
                    onPress={() => setShowCreateNGO(true)}
                    style={({ pressed }) => [
                      styles.createNGOButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Plus size={16} color="#FFFFFF" />

                    <Text style={styles.createNGOButtonText}>
                      Créer mon ONG
                    </Text>
                  </Pressable>
                </View>
              )}
            </Authenticated>

            <Unauthenticated>
              <View style={styles.authRequired}>
                <View style={styles.authIcon}>
                  <HandHeart size={26} color={ACCENT} />
                </View>

                <Text style={styles.authTitle}>Espace organisation</Text>

                <Text style={styles.authText}>
                  Connectez-vous pour accéder à votre espace ONG et aux
                  fonctions qui nécessitent une identité authentifiée.
                </Text>
              </View>
            </Unauthenticated>

            <View style={styles.globalArchitecture}>
              <Globe size={16} color="#60A5FA" />

              <View style={styles.globalArchitectureText}>
                <Text style={styles.globalArchitectureTitle}>
                  Architecture mondiale
                </Text>

                <Text style={styles.globalArchitectureBody}>
                  Le profil accepte un pays et une ville renseignés par
                  l'organisation. Cette page ne présume pas que l'organisation
                  se trouve en RDC.
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {donatingId ? (
        <DonateModal
          campaignId={donatingId}
          onClose={() => setDonatingId(null)}
        />
      ) : null}

      <CreateNGOModal
        visible={showCreateNGO}
        onClose={() => setShowCreateNGO(false)}
        onCreated={() => {
          setActiveTab("my-ngo");
        }}
      />
    </View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#050812",
  },

  pressed: {
    opacity: 0.72,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  /* HEADER */

  header: {
    minHeight: 72,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  headerBack: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  headerIdentity: {
    flex: 1,
    marginLeft: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  headerIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(249,115,22,0.10)",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.18)",
  },

  headerText: {
    marginLeft: 9,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  headerSubtitle: {
    marginTop: 3,
    color: "#71717A",
    fontSize: 8.5,
    fontWeight: "600",
  },

  globalBadge: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59,130,246,0.09)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.18)",
  },

  /* GLOBAL BANNER */

  globalBanner: {
    marginHorizontal: 16,
    marginTop: 11,
    padding: 12,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(59,130,246,0.055)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.12)",
  },

  globalBannerIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59,130,246,0.10)",
  },

  globalBannerText: {
    flex: 1,
    marginLeft: 9,
  },

  globalBannerTitle: {
    color: "#BFDBFE",
    fontSize: 9.5,
    fontWeight: "900",
  },

  globalBannerSubtitle: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 8,
    lineHeight: 12,
  },

  /* STATS */

  statsRow: {
    marginHorizontal: 16,
    marginTop: 10,
    flexDirection: "row",
    gap: 7,
  },

  statCard: {
    flex: 1,
    minHeight: 78,
    padding: 9,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.038)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.065)",
  },

  statIcon: {
    width: 27,
    height: 27,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  statValue: {
    marginTop: 5,
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  statLabel: {
    marginTop: 2,
    color: "#52525B",
    fontSize: 7.5,
    fontWeight: "700",
  },

  /* TABS */

  tabs: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 4,
    borderRadius: 13,
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  tab: {
    flex: 1,
    minHeight: 35,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  tabActive: {
    backgroundColor: "rgba(255,255,255,0.075)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  tabText: {
    color: "#71717A",
    fontSize: 8.5,
    fontWeight: "800",
  },

  tabTextActive: {
    color: "#E4E4E7",
  },

  /* CONTENT */

  content: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 40,
  },

  sectionHeader: {
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  sectionSubtitle: {
    marginTop: 2,
    color: "#52525B",
    fontSize: 8,
    fontWeight: "600",
  },

  sectionIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.08)",
  },

  campaignList: {
    gap: 9,
  },

  /* CAMPAIGN */

  campaignCard: {
    padding: 14,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.038)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  campaignTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  campaignIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.075)",
  },

  campaignIdentity: {
    flex: 1,
    marginLeft: 9,
    marginRight: 7,
  },

  campaignTitle: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    lineHeight: 15,
  },

  campaignNGO: {
    marginTop: 3,
    color: "#71717A",
    fontSize: 8,
    fontWeight: "700",
  },

  campaignStatus: {
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16,185,129,0.07)",
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 4,
    backgroundColor: GREEN,
  },

  statusText: {
    maxWidth: 60,
    color: "#6EE7B7",
    fontSize: 6.5,
    fontWeight: "800",
  },

  campaignDescription: {
    marginTop: 11,
    color: "#A1A1AA",
    fontSize: 9,
    lineHeight: 14,
  },

  progressBlock: {
    marginTop: 13,
  },

  progressHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  progressLabel: {
    color: "#52525B",
    fontSize: 7.5,
    fontWeight: "700",
  },

  progressAmount: {
    marginTop: 2,
    color: "#E4E4E7",
    fontSize: 10,
    fontWeight: "900",
  },

  progressPercent: {
    color: GREEN,
    fontSize: 14,
    fontWeight: "900",
  },

  progressTrack: {
    height: 6,
    marginTop: 7,
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: GREEN,
  },

  progressFooter: {
    marginTop: 5,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  progressFooterText: {
    color: "#52525B",
    fontSize: 7,
    fontWeight: "700",
  },

  noGoalNotice: {
    marginTop: 12,
    padding: 9,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(255,255,255,0.025)",
  },

  noGoalNoticeText: {
    flex: 1,
    marginLeft: 6,
    color: "#52525B",
    fontSize: 7.5,
    lineHeight: 12,
  },

  donateButton: {
    minHeight: 42,
    marginTop: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: ACCENT,
  },

  donateButtonText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },

  /* EMPTY / LOADING */

  loadingState: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 9,
    color: "#52525B",
    fontSize: 8.5,
    fontWeight: "700",
  },

  emptyState: {
    minHeight: 240,
    paddingHorizontal: 25,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIcon: {
    width: 66,
    height: 66,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  emptyTitle: {
    marginTop: 12,
    color: "#71717A",
    fontSize: 10,
    fontWeight: "900",
  },

  emptyText: {
    marginTop: 5,
    color: "#3F3F46",
    fontSize: 8,
    lineHeight: 13,
    textAlign: "center",
  },

  footerNotice: {
    marginTop: 13,
    padding: 11,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.045)",
  },

  footerNoticeText: {
    flex: 1,
    marginLeft: 7,
    color: "#52525B",
    fontSize: 7.5,
    lineHeight: 13,
  },

  /* NGO */

  ngoCard: {
    padding: 15,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  ngoCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  ngoLogo: {
    width: 49,
    height: 49,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(249,115,22,0.10)",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.16)",
  },

  ngoLogoText: {
    fontSize: 22,
  },

  ngoIdentity: {
    flex: 1,
    marginLeft: 10,
  },

  ngoName: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  ngoMeta: {
    marginTop: 3,
    color: "#71717A",
    fontSize: 7.5,
    fontWeight: "700",
  },

  verifiedBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16,185,129,0.08)",
  },

  ngoMission: {
    marginTop: 14,
    color: "#E4E4E7",
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "700",
  },

  ngoDescription: {
    marginTop: 7,
    color: "#71717A",
    fontSize: 8.5,
    lineHeight: 14,
  },

  ngoStats: {
    marginTop: 14,
    paddingTop: 12,
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.055)",
  },

  ngoStat: {
    flex: 1,
  },

  ngoStatValue: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },

  ngoStatLabel: {
    marginTop: 2,
    color: "#52525B",
    fontSize: 7,
    fontWeight: "700",
  },

  ngoIntegrity: {
    marginTop: 12,
    padding: 9,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(255,255,255,0.025)",
  },

  ngoIntegrityText: {
    flex: 1,
    marginLeft: 6,
    color: "#52525B",
    fontSize: 7.5,
    lineHeight: 12,
  },

  /* CREATE NGO */

  createNGOCard: {
    minHeight: 330,
    padding: 22,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(249,115,22,0.045)",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.11)",
  },

  createNGOIcon: {
    width: 70,
    height: 70,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(249,115,22,0.10)",
  },

  createNGOTitle: {
    marginTop: 15,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  createNGOText: {
    maxWidth: 290,
    marginTop: 6,
    color: "#71717A",
    fontSize: 8.5,
    lineHeight: 14,
    textAlign: "center",
  },

  createNGOButton: {
    minHeight: 43,
    marginTop: 18,
    paddingHorizontal: 18,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: ACCENT,
  },

  createNGOButtonText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },

  authRequired: {
    minHeight: 260,
    paddingHorizontal: 25,
    alignItems: "center",
    justifyContent: "center",
  },

  authIcon: {
    width: 64,
    height: 64,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(249,115,22,0.08)",
  },

  authTitle: {
    marginTop: 12,
    color: "#71717A",
    fontSize: 11,
    fontWeight: "900",
  },

  authText: {
    marginTop: 5,
    color: "#3F3F46",
    fontSize: 8,
    lineHeight: 13,
    textAlign: "center",
  },

  globalArchitecture: {
    marginTop: 10,
    padding: 12,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(59,130,246,0.045)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.09)",
  },

  globalArchitectureText: {
    flex: 1,
    marginLeft: 8,
  },

  globalArchitectureTitle: {
    color: "#BFDBFE",
    fontSize: 9,
    fontWeight: "900",
  },

  globalArchitectureBody: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 8,
    lineHeight: 13,
  },

  /* MODALS */

  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.76)",
  },

  donateSheet: {
    maxHeight: "91%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#090D19",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },

  createSheet: {
    maxHeight: "94%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#090D19",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },

  sheetHandle: {
    width: 40,
    height: 4,
    marginTop: 9,
    alignSelf: "center",
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  sheetHeader: {
    minHeight: 62,
    paddingHorizontal: 16,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.055)",
  },

  sheetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  sheetTitleIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.09)",
  },

  sheetTitle: {
    marginLeft: 9,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  sheetSubtitle: {
    marginLeft: 9,
    marginTop: 2,
    color: "#52525B",
    fontSize: 7.5,
    fontWeight: "600",
  },

  closeButton: {
    width: 35,
    height: 35,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  modalContent: {
    padding: 15,
    paddingBottom: 35,
  },

  /* DONATION FORM */

  formLabel: {
    marginTop: 8,
    marginBottom: 7,
    color: "#A1A1AA",
    fontSize: 8.5,
    fontWeight: "800",
  },

  currencyRow: {
    gap: 6,
    paddingBottom: 2,
  },

  currencyChip: {
    minWidth: 58,
    minHeight: 32,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  currencyChipActive: {
    backgroundColor: "rgba(249,115,22,0.12)",
    borderColor: "rgba(249,115,22,0.25)",
  },

  currencyText: {
    color: "#71717A",
    fontSize: 8,
    fontWeight: "900",
  },

  currencyTextActive: {
    color: "#FDBA74",
  },

  amountInputWrap: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  amountInput: {
    flex: 1,
    marginLeft: 8,
    padding: 0,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  amountCurrency: {
    color: "#71717A",
    fontSize: 8,
    fontWeight: "900",
  },

  presetRow: {
    marginTop: 7,
    flexDirection: "row",
    gap: 6,
  },

  presetButton: {
    flex: 1,
    minHeight: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  presetButtonActive: {
    backgroundColor: "rgba(249,115,22,0.12)",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.22)",
  },

  presetText: {
    color: "#71717A",
    fontSize: 7.5,
    fontWeight: "800",
  },

  presetTextActive: {
    color: "#FDBA74",
  },

  messageInput: {
    minHeight: 92,
    padding: 12,
    borderRadius: 13,
    color: "#FFFFFF",
    fontSize: 9,
    lineHeight: 14,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  anonymousRow: {
    marginTop: 13,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  checkbox: {
    width: 18,
    height: 18,
    marginTop: 1,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },

  checkboxActive: {
    backgroundColor: RED,
    borderColor: RED,
  },

  anonymousText: {
    flex: 1,
    marginLeft: 8,
  },

  anonymousTitle: {
    color: "#A1A1AA",
    fontSize: 8.5,
    fontWeight: "800",
  },

  anonymousSubtitle: {
    marginTop: 3,
    color: "#52525B",
    fontSize: 7.5,
    lineHeight: 12,
  },

  donationNotice: {
    marginTop: 13,
    padding: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(59,130,246,0.045)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.09)",
  },

  donationNoticeText: {
    flex: 1,
    marginLeft: 7,
    color: "#64748B",
    fontSize: 7.5,
    lineHeight: 12,
  },

  confirmDonateButton: {
    minHeight: 47,
    marginTop: 14,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: ACCENT,
  },

  confirmDonateText: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "900",
  },

  disabledButton: {
    opacity: 0.4,
  },

  /* CREATE NGO */

  globalNotice: {
    padding: 11,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(59,130,246,0.045)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.10)",
  },

  globalNoticeText: {
    flex: 1,
    marginLeft: 7,
    color: "#64748B",
    fontSize: 8,
    lineHeight: 13,
  },

  formGroup: {
    marginTop: 4,
  },

  formInput: {
    minHeight: 43,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 13,
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "600",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  formInputMultiline: {
    minHeight: 88,
  },

  formTwoColumns: {
    flexDirection: "row",
    gap: 7,
  },

  formColumn: {
    flex: 1,
  },

  integrityNotice: {
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(139,92,246,0.045)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.09)",
  },

  integrityNoticeText: {
    flex: 1,
    marginLeft: 7,
    color: "#71717A",
    fontSize: 7.5,
    lineHeight: 12,
  },

  createButton: {
    minHeight: 47,
    marginTop: 14,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: ACCENT,
  },

  createButtonText: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "900",
  },
});
