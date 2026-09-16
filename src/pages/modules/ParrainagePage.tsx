import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useState } from "react";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api.js";

import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  Copy,
  Crown,
  Gift,
  QrCode,
  Share2,
  Sparkles,
  Star,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react-native";

import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
} from "@/lib/convex-auth-compat";

import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";

import Clipboard from "@react-native-clipboard/clipboard";

import type { ReactNode } from "react";

/* ============================================================================
 * TYPES
 * ========================================================================== */

interface ParrainagePageProps {
  onBack: () => void;
}

interface Tier {
  threshold: number;
  label: string;
  reward: string;
  icon: ReactNode;
  accent: string;
}

type ReferralStatus = "pending" | "validated" | "rewarded" | string;

/*
 * IMPORTANT
 *
 * Ces paliers ne sont PAS utilisés pour calculer les gains.
 * Ils servent uniquement d'information visuelle si le programme
 * actuellement configuré côté produit les confirme.
 *
 * Les montants réels affichés dans "Gains" proviennent du backend.
 *
 * Si ces règles doivent devenir contractuelles, elles devront être
 * déplacées dans Convex et non codées en dur dans l'UI.
 */
const PROGRAM_TIERS: Tier[] = [
  {
    threshold: 1,
    label: "Premier filleul",
    reward: "Palier atteint",
    icon: <Gift size={16} color="#A78BFA" />,
    accent: "#8B5CF6",
  },
  {
    threshold: 3,
    label: "3 filleuls actifs",
    reward: "Palier atteint",
    icon: <Star size={16} color="#FB923C" />,
    accent: "#F97316",
  },
  {
    threshold: 5,
    label: "5 filleuls actifs",
    reward: "Palier atteint",
    icon: <Crown size={16} color="#FBBF24" />,
    accent: "#F59E0B",
  },
  {
    threshold: 10,
    label: "10 filleuls actifs",
    reward: "Palier atteint",
    icon: <Trophy size={16} color="#F87171" />,
    accent: "#EF4444",
  },
];

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function formatAmount(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 2,
  }).format(value);
}

function getReferralStatus(status: ReferralStatus): {
  label: string;
  background: string;
  foreground: string;
} {
  switch (status) {
    case "rewarded":
      return {
        label: "Actif",
        background: "rgba(34,197,94,0.14)",
        foreground: "#4ADE80",
      };

    case "validated":
      return {
        label: "Validé",
        background: "rgba(34,197,94,0.14)",
        foreground: "#4ADE80",
      };

    case "pending":
    default:
      return {
        label: "En attente",
        background: "rgba(245,158,11,0.14)",
        foreground: "#FBBF24",
      };
  }
}

/* ============================================================================
 * LOADING
 * ========================================================================== */

function LoadingState({ onBack }: ParrainagePageProps) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={onBack}
          style={styles.headerButton}
        >
          <ArrowLeft size={19} color="rgba(255,255,255,0.82)" />
        </Pressable>

        <View style={styles.headerIdentity}>
          <Skeleton style={styles.loadingIcon} />

          <View style={styles.headerTextBlock}>
            <Skeleton style={styles.loadingTitle} />
            <Skeleton style={styles.loadingSubtitle} />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.loadingContent}
        showsVerticalScrollIndicator={false}
      >
        <Skeleton style={styles.loadingHero} />
        <Skeleton style={styles.loadingCard} />
        <Skeleton style={styles.loadingCard} />
        <Skeleton style={styles.loadingCard} />
        <Skeleton style={styles.loadingCard} />
      </ScrollView>
    </View>
  );
}

/* ============================================================================
 * UNAUTHENTICATED
 * ========================================================================== */

function UnauthenticatedState({ onBack }: ParrainagePageProps) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={onBack}
          style={styles.headerButton}
        >
          <ArrowLeft size={19} color="rgba(255,255,255,0.82)" />
        </Pressable>

        <View style={styles.headerIdentity}>
          <View style={styles.headerIcon}>
            <Users size={17} color="#A78BFA" />
          </View>

          <View style={styles.headerTextBlock}>
            <Text style={styles.headerTitle}>Parrainage</Text>

            <Text style={styles.headerSubtitle}>
              Programme de recommandation
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.authEmpty}>
        <View style={styles.authIcon}>
          <Users size={34} color="#A78BFA" />
        </View>

        <Text style={styles.authTitle}>Connectez-vous pour continuer</Text>

        <Text style={styles.authDescription}>
          Votre code, vos filleuls et vos récompenses sont accessibles
          uniquement depuis votre compte.
        </Text>

        <SignInButton />
      </View>
    </View>
  );
}

/* ============================================================================
 * STAT CARD
 * ========================================================================== */

function StatCard({
  icon,
  value,
  label,
  accent,
}: {
  icon: ReactNode;
  value: string;
  label: string;
  accent: string;
}) {
  return (
    <View style={styles.statCard}>
      <View
        style={[
          styles.statIcon,
          {
            backgroundColor: `${accent}18`,
          },
        ]}
      >
        {icon}
      </View>

      <Text
        style={[
          styles.statValue,
          {
            color: accent,
          },
        ]}
      >
        {value}
      </Text>

      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/* ============================================================================
 * REFERRAL ROW
 * ========================================================================== */

function ReferralRow({
  referral,
}: {
  referral: {
    _id: string;
    referredId: string;
    status: ReferralStatus;
    rewardAmount?: number;
  };
}) {
  const status = getReferralStatus(referral.status);

  return (
    <View style={styles.referralRow}>
      <View
        style={[
          styles.referralIcon,
          {
            backgroundColor: status.background,
          },
        ]}
      >
        {referral.status === "rewarded" || referral.status === "validated" ? (
          <Check size={15} color={status.foreground} />
        ) : (
          <Clock size={15} color={status.foreground} />
        )}
      </View>

      <View style={styles.referralContent}>
        <Text style={styles.referralTitle} numberOfLines={1}>
          Filleul
        </Text>

        <Text style={styles.referralId} numberOfLines={1}>
          Référence {referral._id.slice(-8)}
        </Text>
      </View>

      <View style={styles.referralRight}>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: status.background,
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color: status.foreground,
              },
            ]}
          >
            {status.label}
          </Text>
        </View>

        {typeof referral.rewardAmount === "number" && (
          <Text style={styles.rewardAmount}>
            +{formatAmount(referral.rewardAmount)}
          </Text>
        )}
      </View>
    </View>
  );
}

/* ============================================================================
 * TIER ROW
 * ========================================================================== */

function TierRow({ tier, activeCount }: { tier: Tier; activeCount: number }) {
  const unlocked = activeCount >= tier.threshold;

  const remaining = Math.max(tier.threshold - activeCount, 0);

  return (
    <View
      style={[
        styles.tierRow,
        unlocked
          ? {
              backgroundColor: `${tier.accent}10`,
              borderColor: `${tier.accent}28`,
            }
          : styles.tierRowLocked,
      ]}
    >
      <View
        style={[
          styles.tierIcon,
          {
            backgroundColor: unlocked
              ? `${tier.accent}1C`
              : "rgba(255,255,255,0.06)",
          },
        ]}
      >
        {tier.icon}
      </View>

      <View style={styles.tierContent}>
        <Text
          style={[styles.tierTitle, unlocked && styles.tierTitleUnlocked]}
          numberOfLines={1}
        >
          {tier.label}
        </Text>

        <Text
          style={[
            styles.tierReward,
            unlocked && {
              color: tier.accent,
            },
          ]}
        >
          {unlocked
            ? tier.reward
            : `${remaining} filleul${remaining > 1 ? "s" : ""} restant${
                remaining > 1 ? "s" : ""
              }`}
        </Text>
      </View>

      {unlocked ? (
        <View
          style={[
            styles.tierCheck,
            {
              backgroundColor: `${tier.accent}20`,
            },
          ]}
        >
          <Check size={13} color={tier.accent} />
        </View>
      ) : (
        <ChevronRight size={17} color="rgba(255,255,255,0.18)" />
      )}
    </View>
  );
}

/* ============================================================================
 * CODE CARD
 * ========================================================================== */

function ReferralCodeCard({
  code,
  copied,
  onCopy,
  onShare,
  onQrPress,
}: {
  code: string;
  copied: boolean;
  onCopy: () => void;
  onShare: () => void;
  onQrPress: () => void;
}) {
  const loading = !code || code === "Chargement...";

  return (
    <View style={styles.codeSection}>
      <View style={styles.sectionEyebrow}>
        <Sparkles size={14} color="#A78BFA" />

        <Text style={styles.eyebrowText}>VOTRE CODE DE PARRAINAGE</Text>
      </View>

      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>Code personnel</Text>

        <View style={styles.codeRow}>
          <Text
            style={[styles.codeValue, loading && styles.codeLoading]}
            numberOfLines={1}
          >
            {code}
          </Text>

          {!loading && (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Afficher les options du code"
                onPress={onQrPress}
                style={styles.codeAction}
              >
                <QrCode size={18} color="#A78BFA" />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={copied ? "Code copié" : "Copier le code"}
                onPress={onCopy}
                style={[styles.codeAction, copied && styles.codeActionSuccess]}
              >
                {copied ? (
                  <Check size={18} color="#4ADE80" />
                ) : (
                  <Copy size={18} color="rgba(255,255,255,0.7)" />
                )}
              </Pressable>
            </>
          )}
        </View>

        <Text style={styles.codeDescription}>
          Partagez votre code personnel. Le programme de récompense est géré par
          le backend du programme.
        </Text>
      </View>

      {!loading && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Partager mon code de parrainage"
          onPress={onShare}
          style={styles.shareButton}
        >
          <Share2 size={17} color="#FFFFFF" />

          <Text style={styles.shareButtonText}>Partager mon code</Text>
        </Pressable>
      )}
    </View>
  );
}

/* ============================================================================
 * CODE INFORMATION MODAL
 *
 * Pas de faux QR.
 *
 * Le backend actuel expose le code de parrainage,
 * mais le contrat fourni ne confirme pas un deep-link
 * ou une URL publique de parrainage.
 * ========================================================================== */

function CodeInfoModal({
  code,
  onClose,
}: {
  code: string;
  onClose: () => void;
}) {
  return (
    <View style={styles.modalRoot}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />

      <View style={styles.modalCard}>
        <View style={styles.modalHeader}>
          <View>
            <Text style={styles.modalTitle}>Code de parrainage</Text>

            <Text style={styles.modalSubtitle}>
              Utilisez ce code lors de l'inscription si le parcours de création
              de compte le demande.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fermer"
            onPress={onClose}
            style={styles.modalClose}
          >
            <X size={18} color="rgba(255,255,255,0.72)" />
          </Pressable>
        </View>

        <View style={styles.codePreview}>
          <Text style={styles.codePreviewLabel}>CODE</Text>

          <Text style={styles.codePreviewValue}>{code}</Text>
        </View>

        <View style={styles.modalInfo}>
          <QrCode size={18} color="#A78BFA" />

          <Text style={styles.modalInfoText}>
            La génération d'un QR code public n'est pas activée ici tant que le
            contrat backend du lien de parrainage n'est pas explicitement
            défini.
          </Text>
        </View>

        <Pressable onPress={onClose} style={styles.modalPrimaryButton}>
          <Text style={styles.modalPrimaryText}>Fermer</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ============================================================================
 * MAIN
 * ========================================================================== */

function ParrainageInner({ onBack }: ParrainagePageProps) {
  const stats = useQuery(api.referrals.getMyReferralStats, {});

  const [activeTab, setActiveTab] = useState<"filleuls" | "gains">("filleuls");

  const [copied, setCopied] = useState(false);

  const [showCodeInfo, setShowCodeInfo] = useState(false);

  /*
   * Tant que Convex n'a pas répondu, on ne transforme
   * pas les valeurs en fausses statistiques.
   */
  if (stats === undefined) {
    return <LoadingState onBack={onBack} />;
  }

  const code = typeof stats.code === "string" ? stats.code.trim() : "";

  const activeCount =
    typeof stats.activeCount === "number" ? stats.activeCount : 0;

  const pendingCount =
    typeof stats.pendingCount === "number" ? stats.pendingCount : 0;

  const totalEarned =
    typeof stats.totalEarned === "number" ? stats.totalEarned : 0;

  const pendingEarned =
    typeof stats.pendingEarned === "number" ? stats.pendingEarned : 0;

  const referrals = Array.isArray(stats.referrals) ? stats.referrals : [];

  const nextTier = PROGRAM_TIERS.find((tier) => tier.threshold > activeCount);

  const progress = nextTier ? Math.min(1, activeCount / nextTier.threshold) : 1;

  const copyCode = () => {
    if (!code) {
      return;
    }

    Clipboard.setString(code);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1800);
  };

  const shareCode = async () => {
    if (!code) {
      return;
    }

    try {
      await Share.share({
        message: `Mon code de parrainage : ${code}`,
        title: "Code de parrainage",
      });
    } catch {
      /*
       * L'annulation du partage par l'utilisateur
       * n'est pas une erreur applicative.
       */
    }
  };

  const handleCodeInfo = () => {
    if (!code) {
      return;
    }

    setShowCodeInfo(true);
  };

  return (
    <View style={styles.screen}>
      {/* ====================================================================
       * HEADER
       * ================================================================== */}

      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={onBack}
          style={styles.headerButton}
        >
          <ArrowLeft size={19} color="rgba(255,255,255,0.82)" />
        </Pressable>

        <View style={styles.headerIdentity}>
          <View style={styles.headerIcon}>
            <Users size={17} color="#A78BFA" />
          </View>

          <View style={styles.headerTextBlock}>
            <Text style={styles.headerTitle}>Parrainage</Text>

            <Text style={styles.headerSubtitle}>Développez votre réseau</Text>
          </View>
        </View>
      </View>

      {/* ====================================================================
       * CONTENT
       * ================================================================== */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ================================================================
         * HERO
         * ============================================================== */}

        <View style={styles.hero}>
          <View style={styles.heroGlow} />

          <View style={styles.heroBadge}>
            <Sparkles size={14} color="#C4B5FD" />

            <Text style={styles.heroBadgeText}>PROGRAMME DE PARRAINAGE</Text>
          </View>

          <Text style={styles.heroTitle}>Invitez votre réseau.</Text>

          <Text style={styles.heroDescription}>
            Suivez vos filleuls et les récompenses réellement enregistrées par
            le programme.
          </Text>

          {/* ============================================================
           * STATS
           * ========================================================== */}

          <View style={styles.statsGrid}>
            <StatCard
              icon={<Users size={17} color="#4ADE80" />}
              value={String(activeCount)}
              label="Filleuls actifs"
              accent="#22C55E"
            />

            <StatCard
              icon={<Clock size={17} color="#FBBF24" />}
              value={String(pendingCount)}
              label="En attente"
              accent="#F59E0B"
            />

            <StatCard
              icon={<Gift size={17} color="#A78BFA" />}
              value={formatAmount(totalEarned)}
              label="Gains validés"
              accent="#8B5CF6"
            />
          </View>
        </View>

        {/* ================================================================
         * REFERRAL CODE
         * ============================================================== */}

        <ReferralCodeCard
          code={code}
          copied={copied}
          onCopy={copyCode}
          onShare={() => {
            void shareCode();
          }}
          onQrPress={handleCodeInfo}
        />

        {/* ================================================================
         * NEXT TIER
         * ============================================================== */}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Zap size={15} color="#FBBF24" />
            </View>

            <View>
              <Text style={styles.sectionTitle}>Progression</Text>

              <Text style={styles.sectionSubtitle}>
                Votre niveau dans le programme
              </Text>
            </View>
          </View>

          {nextTier ? (
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Prochain palier</Text>

                <Text style={styles.progressValue}>
                  {activeCount}/{nextTier.threshold}
                </Text>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress * 100}%`,
                      backgroundColor: nextTier.accent,
                    },
                  ]}
                />
              </View>

              <Text style={styles.progressDescription}>
                Encore{" "}
                <Text style={styles.progressStrong}>
                  {Math.max(nextTier.threshold - activeCount, 0)}
                </Text>{" "}
                filleul
                {Math.max(nextTier.threshold - activeCount, 0) > 1
                  ? "s"
                  : ""}{" "}
                pour atteindre{" "}
                <Text
                  style={{
                    color: nextTier.accent,
                    fontWeight: "800",
                  }}
                >
                  {nextTier.label}
                </Text>
              </Text>
            </View>
          ) : (
            <View style={styles.completeCard}>
              <Trophy size={20} color="#FBBF24" />

              <View style={styles.completeContent}>
                <Text style={styles.completeTitle}>
                  Tous les paliers affichés sont atteints
                </Text>

                <Text style={styles.completeDescription}>
                  Votre progression repose sur les données réelles du programme.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ================================================================
         * TIERS
         * ============================================================== */}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Trophy size={15} color="#FBBF24" />
            </View>

            <View>
              <Text style={styles.sectionTitle}>Paliers</Text>

              <Text style={styles.sectionSubtitle}>
                Progression du programme
              </Text>
            </View>
          </View>

          <View style={styles.tierList}>
            {PROGRAM_TIERS.map((tier) => (
              <TierRow
                key={tier.threshold}
                tier={tier}
                activeCount={activeCount}
              />
            ))}
          </View>
        </View>

        {/* ================================================================
         * PENDING EARNINGS
         * ============================================================== */}

        {pendingEarned > 0 && (
          <View style={styles.pendingCard}>
            <View style={styles.pendingIcon}>
              <Clock size={17} color="#FBBF24" />
            </View>

            <View style={styles.pendingContent}>
              <Text style={styles.pendingTitle}>Récompenses en attente</Text>

              <Text style={styles.pendingDescription}>
                Montant actuellement indiqué par le programme :
              </Text>
            </View>

            <Text style={styles.pendingAmount}>
              {formatAmount(pendingEarned)}
            </Text>
          </View>
        )}

        {/* ================================================================
         * TABS
         * ============================================================== */}

        <View style={styles.section}>
          <View style={styles.tabs}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{
                selected: activeTab === "filleuls",
              }}
              onPress={() => setActiveTab("filleuls")}
              style={[styles.tab, activeTab === "filleuls" && styles.tabActive]}
            >
              <Users
                size={15}
                color={
                  activeTab === "filleuls"
                    ? "#C4B5FD"
                    : "rgba(255,255,255,0.42)"
                }
              />

              <Text
                style={[
                  styles.tabText,
                  activeTab === "filleuls" && styles.tabTextActive,
                ]}
              >
                Filleuls
              </Text>

              <Text
                style={[
                  styles.tabCount,
                  activeTab === "filleuls" && styles.tabCountActive,
                ]}
              >
                {referrals.length}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{
                selected: activeTab === "gains",
              }}
              onPress={() => setActiveTab("gains")}
              style={[styles.tab, activeTab === "gains" && styles.tabActive]}
            >
              <Gift
                size={15}
                color={
                  activeTab === "gains" ? "#C4B5FD" : "rgba(255,255,255,0.42)"
                }
              />

              <Text
                style={[
                  styles.tabText,
                  activeTab === "gains" && styles.tabTextActive,
                ]}
              >
                Gains
              </Text>
            </Pressable>
          </View>

          {/* ==============================================================
           * REFERRALS
           * ============================================================ */}

          {activeTab === "filleuls" && (
            <View style={styles.listCard}>
              {referrals.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <Users size={26} color="rgba(255,255,255,0.3)" />
                  </View>

                  <Text style={styles.emptyTitle}>Aucun filleul</Text>

                  <Text style={styles.emptyDescription}>
                    Vos parrainages apparaîtront ici lorsqu'ils seront
                    enregistrés par le programme.
                  </Text>
                </View>
              ) : (
                referrals.map((referral) => (
                  <ReferralRow key={referral._id} referral={referral} />
                ))
              )}
            </View>
          )}

          {/* ==============================================================
           * EARNINGS
           * ============================================================ */}

          {activeTab === "gains" && (
            <View style={styles.listCard}>
              <View style={styles.earningsSummary}>
                <View>
                  <Text style={styles.earningsLabel}>Gains validés</Text>

                  <Text style={styles.earningsValue}>
                    {formatAmount(totalEarned)}
                  </Text>
                </View>

                {pendingEarned > 0 && (
                  <View style={styles.earningsPending}>
                    <Clock size={14} color="#FBBF24" />

                    <Text style={styles.earningsPendingText}>
                      En attente : {formatAmount(pendingEarned)}
                    </Text>
                  </View>
                )}
              </View>

              {referrals.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <Gift size={26} color="rgba(255,255,255,0.3)" />
                  </View>

                  <Text style={styles.emptyTitle}>Aucun gain</Text>

                  <Text style={styles.emptyDescription}>
                    Les récompenses apparaîtront ici lorsqu'elles seront
                    enregistrées par le programme.
                  </Text>
                </View>
              ) : (
                referrals.map((referral) => (
                  <ReferralRow
                    key={`gain-${referral._id}`}
                    referral={referral}
                  />
                ))
              )}
            </View>
          )}
        </View>

        {/* ================================================================
         * TRUST / TRANSPARENCY
         * ============================================================== */}

        <View style={styles.transparencyCard}>
          <View style={styles.transparencyIcon}>
            <Check size={17} color="#4ADE80" />
          </View>

          <View style={styles.transparencyContent}>
            <Text style={styles.transparencyTitle}>Données vérifiables</Text>

            <Text style={styles.transparencyText}>
              Les statistiques affichées proviennent de votre compte et du
              programme de parrainage. Aucun filleul ou gain n'est généré
              localement par l'application.
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* ====================================================================
       * CODE MODAL
       * ================================================================== */}

      {showCodeInfo && (
        <CodeInfoModal code={code} onClose={() => setShowCodeInfo(false)} />
      )}
    </View>
  );
}

/* ============================================================================
 * PAGE
 * ========================================================================== */

export default function ParrainagePage({ onBack }: ParrainagePageProps) {
  return (
    <View style={styles.root}>
      <AuthLoading>
        <LoadingState onBack={onBack} />
      </AuthLoading>

      <Unauthenticated>
        <UnauthenticatedState onBack={onBack} />
      </Unauthenticated>

      <Authenticated>
        <ParrainageInner onBack={onBack} />
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
    backgroundColor: "#07070F",
  },

  screen: {
    flex: 1,
    backgroundColor: "#07070F",
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingBottom: 32,
  },

  header: {
    minHeight: 72,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
    backgroundColor: "rgba(7,7,15,0.96)",
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

  headerIdentity: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.16)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.24)",
  },

  headerTextBlock: {
    flex: 1,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  headerSubtitle: {
    marginTop: 3,
    color: "rgba(255,255,255,0.42)",
    fontSize: 11,
    fontWeight: "600",
  },

  hero: {
    position: "relative",
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(139,92,246,0.14)",
  },

  heroGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    right: -100,
    top: -120,
    backgroundColor: "rgba(139,92,246,0.08)",
  },

  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: "rgba(139,92,246,0.12)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.2)",
  },

  heroBadgeText: {
    color: "#C4B5FD",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    letterSpacing: -0.6,
  },

  heroDescription: {
    maxWidth: 520,
    marginTop: 8,
    color: "rgba(255,255,255,0.48)",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "500",
  },

  statsGrid: {
    marginTop: 20,
    flexDirection: "row",
    gap: 8,
  },

  statCard: {
    flex: 1,
    minHeight: 108,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
  },

  statValue: {
    fontSize: 18,
    fontWeight: "900",
  },

  statLabel: {
    marginTop: 3,
    color: "rgba(255,255,255,0.35)",
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "700",
    textAlign: "center",
  },

  codeSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  sectionEyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 10,
  },

  eyebrowText: {
    color: "#A78BFA",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  codeCard: {
    padding: 17,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.34)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.26)",
  },

  codeLabel: {
    color: "rgba(255,255,255,0.36)",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },

  codeRow: {
    marginTop: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  codeValue: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 2,
  },

  codeLoading: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 15,
    letterSpacing: 0,
  },

  codeAction: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  codeActionSuccess: {
    backgroundColor: "rgba(34,197,94,0.12)",
    borderColor: "rgba(34,197,94,0.24)",
  },

  codeDescription: {
    marginTop: 12,
    color: "rgba(255,255,255,0.34)",
    fontSize: 11,
    lineHeight: 17,
  },

  shareButton: {
    minHeight: 48,
    marginTop: 10,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: "#5B21B6",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
  },

  shareButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  section: {
    paddingHorizontal: 16,
    paddingTop: 22,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },

  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  sectionSubtitle: {
    marginTop: 2,
    color: "rgba(255,255,255,0.34)",
    fontSize: 10,
    fontWeight: "600",
  },

  progressCard: {
    padding: 15,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  progressLabel: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 11,
    fontWeight: "800",
  },

  progressValue: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  progressTrack: {
    height: 7,
    marginTop: 11,
    borderRadius: 99,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  progressFill: {
    height: "100%",
    borderRadius: 99,
  },

  progressDescription: {
    marginTop: 10,
    color: "rgba(255,255,255,0.34)",
    fontSize: 10,
    lineHeight: 16,
  },

  progressStrong: {
    color: "rgba(255,255,255,0.72)",
    fontWeight: "900",
  },

  completeCard: {
    padding: 15,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(245,158,11,0.08)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.18)",
  },

  completeContent: {
    flex: 1,
  },

  completeTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  completeDescription: {
    marginTop: 4,
    color: "rgba(255,255,255,0.38)",
    fontSize: 10,
    lineHeight: 15,
  },

  tierList: {
    gap: 8,
  },

  tierRow: {
    minHeight: 66,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderWidth: 1,
  },

  tierRowLocked: {
    backgroundColor: "rgba(255,255,255,0.025)",
    borderColor: "rgba(255,255,255,0.06)",
  },

  tierIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  tierContent: {
    flex: 1,
    minWidth: 0,
  },

  tierTitle: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 12,
    fontWeight: "800",
  },

  tierTitleUnlocked: {
    color: "#FFFFFF",
  },

  tierReward: {
    marginTop: 3,
    color: "rgba(255,255,255,0.28)",
    fontSize: 10,
    fontWeight: "600",
  },

  tierCheck: {
    width: 27,
    height: 27,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
  },

  pendingCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 13,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(245,158,11,0.08)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.18)",
  },

  pendingIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245,158,11,0.12)",
  },

  pendingContent: {
    flex: 1,
  },

  pendingTitle: {
    color: "#FDE68A",
    fontSize: 11,
    fontWeight: "900",
  },

  pendingDescription: {
    marginTop: 2,
    color: "rgba(255,255,255,0.35)",
    fontSize: 9,
    lineHeight: 14,
  },

  pendingAmount: {
    color: "#FBBF24",
    fontSize: 13,
    fontWeight: "900",
  },

  tabs: {
    minHeight: 50,
    padding: 4,
    flexDirection: "row",
    gap: 4,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  tab: {
    flex: 1,
    minHeight: 40,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  tabActive: {
    backgroundColor: "rgba(139,92,246,0.22)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.25)",
  },

  tabText: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 11,
    fontWeight: "800",
  },

  tabTextActive: {
    color: "#FFFFFF",
  },

  tabCount: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 10,
    fontWeight: "900",
  },

  tabCountActive: {
    color: "#C4B5FD",
  },

  listCard: {
    marginTop: 10,
    overflow: "hidden",
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  referralRow: {
    minHeight: 72,
    paddingHorizontal: 13,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },

  referralIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  referralContent: {
    flex: 1,
    minWidth: 0,
  },

  referralTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  referralId: {
    marginTop: 3,
    color: "rgba(255,255,255,0.28)",
    fontSize: 9,
    fontWeight: "600",
  },

  referralRight: {
    alignItems: "flex-end",
    gap: 4,
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 99,
  },

  statusText: {
    fontSize: 8,
    fontWeight: "900",
  },

  rewardAmount: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },

  emptyState: {
    paddingHorizontal: 24,
    paddingVertical: 34,
    alignItems: "center",
  },

  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    marginBottom: 10,
  },

  emptyTitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    fontWeight: "900",
  },

  emptyDescription: {
    maxWidth: 330,
    marginTop: 6,
    color: "rgba(255,255,255,0.3)",
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
  },

  earningsSummary: {
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },

  earningsLabel: {
    color: "rgba(255,255,255,0.34)",
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  earningsValue: {
    marginTop: 4,
    color: "#4ADE80",
    fontSize: 20,
    fontWeight: "900",
  },

  earningsPending: {
    maxWidth: 150,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(245,158,11,0.1)",
  },

  earningsPendingText: {
    flex: 1,
    color: "#FBBF24",
    fontSize: 8,
    lineHeight: 12,
    fontWeight: "800",
  },

  transparencyCard: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 14,
    borderRadius: 17,
    flexDirection: "row",
    gap: 10,
    backgroundColor: "rgba(34,197,94,0.06)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.14)",
  },

  transparencyIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,197,94,0.12)",
  },

  transparencyContent: {
    flex: 1,
  },

  transparencyTitle: {
    color: "#86EFAC",
    fontSize: 11,
    fontWeight: "900",
  },

  transparencyText: {
    marginTop: 4,
    color: "rgba(255,255,255,0.36)",
    fontSize: 9,
    lineHeight: 15,
  },

  bottomSpace: {
    height: 20,
  },

  /* ========================================================================
   * AUTH
   * ====================================================================== */

  authEmpty: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  authIcon: {
    width: 76,
    height: 76,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.12)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.2)",
    marginBottom: 18,
  },

  authTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },

  authDescription: {
    maxWidth: 380,
    marginTop: 8,
    marginBottom: 20,
    color: "rgba(255,255,255,0.42)",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
  },

  /* ========================================================================
   * MODAL
   * ====================================================================== */

  modalRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: "flex-end",
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.78)",
  },

  modalCard: {
    margin: 12,
    padding: 18,
    borderRadius: 24,
    backgroundColor: "#11111D",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  modalTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  modalSubtitle: {
    maxWidth: 310,
    marginTop: 5,
    color: "rgba(255,255,255,0.38)",
    fontSize: 10,
    lineHeight: 16,
  },

  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  codePreview: {
    marginTop: 18,
    padding: 18,
    borderRadius: 18,
    alignItems: "center",
    backgroundColor: "rgba(139,92,246,0.1)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.2)",
  },

  codePreviewLabel: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },

  codePreviewValue: {
    marginTop: 8,
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: 3,
  },

  modalInfo: {
    marginTop: 12,
    padding: 12,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  modalInfoText: {
    flex: 1,
    color: "rgba(255,255,255,0.42)",
    fontSize: 10,
    lineHeight: 16,
  },

  modalPrimaryButton: {
    minHeight: 46,
    marginTop: 14,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5B21B6",
  },

  modalPrimaryText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  /* ========================================================================
   * LOADING
   * ====================================================================== */

  loadingContent: {
    padding: 16,
    gap: 12,
  },

  loadingIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
  },

  loadingTitle: {
    width: 110,
    height: 14,
    borderRadius: 6,
  },

  loadingSubtitle: {
    width: 160,
    height: 9,
    marginTop: 5,
    borderRadius: 5,
  },

  loadingHero: {
    width: "100%",
    height: 250,
    borderRadius: 22,
  },

  loadingCard: {
    width: "100%",
    height: 82,
    borderRadius: 18,
  },
});
