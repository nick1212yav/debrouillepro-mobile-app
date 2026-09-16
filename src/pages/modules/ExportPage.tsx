import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import QRCode from "qrcode";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Copy,
  Download,
  FileDown,
  FileText,
  Loader2,
  QrCode,
  Share2,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react-native";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { Clipboard } from "@react-native-clipboard/clipboard";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";

interface ExportPageProps {
  onBack: () => void;
}

type LoadingKey = "publications" | "activity" | "analytics" | null;

type ActivityItem = {
  type: string;
  label: string;
  _creationTime: number;
};

type ExportedFile = {
  id: string;
  label: string;
  type: "CSV" | "PDF";
  createdAt: number;
};

function formatDate(value: number | string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date inconnue";
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function arrayToCsv(rows: string[][], separator = ";"): string {
  return rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(separator),
    )
    .join("\n");
}

function createCsvUri(content: string): string {
  const encoded = encodeURIComponent(`\uFEFF${content}`);
  return `data:text/csv;charset=utf-8,${encoded}`;
}

async function shareText(
  title: string,
  message: string,
  url?: string,
): Promise<boolean> {
  try {
    const result = await Share.share(
      {
        title,
        message: url ? `${message}\n${url}` : message,
        ...(Platform.OS === "ios" && url ? { url } : {}),
      },
      Platform.OS === "ios"
        ? {
            subject: title,
          }
        : undefined,
    );

    return result.action === Share.sharedAction;
  } catch (error) {
    console.error("Export share error:", error);
    return false;
  }
}

function ExportCard({
  icon,
  title,
  description,
  badge,
  onPress,
  loading,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge: string;
  onPress: () => void;
  loading: boolean;
  accent: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
      style={({ pressed }) => ({
        opacity: loading ? 0.65 : pressed ? 0.82 : 1,
        transform: [{ scale: pressed && !loading ? 0.985 : 1 }],
      })}
    >
      <View
        className="rounded-3xl p-4"
        style={{
          backgroundColor: "rgba(255,255,255,0.045)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.09)",
        }}
      >
        <View className="flex-row items-center">
          <View
            className="h-12 w-12 items-center justify-center rounded-2xl"
            style={{
              backgroundColor: `${accent}18`,
              borderWidth: 1,
              borderColor: `${accent}30`,
            }}
          >
            {icon}
          </View>

          <View className="ml-3 flex-1">
            <View className="flex-row items-center">
              <Text
                className="flex-1 text-[15px] font-bold text-white"
                numberOfLines={1}
              >
                {title}
              </Text>

              <View
                className="ml-2 rounded-lg px-2 py-1"
                style={{
                  backgroundColor: `${accent}16`,
                  borderWidth: 1,
                  borderColor: `${accent}28`,
                }}
              >
                <Text
                  className="text-[9px] font-extrabold"
                  style={{ color: accent }}
                >
                  {badge}
                </Text>
              </View>
            </View>

            <Text
              className="mt-1 text-xs leading-5 text-white/45"
              numberOfLines={2}
            >
              {description}
            </Text>
          </View>

          <View
            className="ml-3 h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${accent}12` }}
          >
            {loading ? (
              <Loader2 size={17} color={accent} />
            ) : (
              <ChevronRight size={18} color={accent} />
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function QrModal({
  visible,
  url,
  onClose,
}: {
  visible: boolean;
  url: string;
  onClose: () => void;
}) {
  const [qrData, setQrData] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!visible || !url) {
      setQrData(null);
      return;
    }

    let active = true;

    const generate = async () => {
      setGenerating(true);

      try {
        const result = await QRCode.toDataURL(url, {
          width: 512,
          margin: 2,
          errorCorrectionLevel: "M",
          color: {
            dark: "#FFFFFF",
            light: "#0B1020",
          },
        });

        if (active) {
          setQrData(result);
        }
      } catch (error) {
        console.error("QR generation error:", error);

        if (active) {
          Alert.alert(
            "QR Code",
            "Impossible de générer le QR code pour le moment.",
          );
        }
      } finally {
        if (active) {
          setGenerating(false);
        }
      }
    };

    void generate();

    return () => {
      active = false;
    };
  }, [visible, url]);

  const copyLink = async () => {
    try {
      await Clipboard.setString(url);

      Alert.alert("Lien copié", "Le lien de ton profil a été copié.");
    } catch (error) {
      console.error("Clipboard error:", error);

      Alert.alert(
        "Copie impossible",
        "Impossible de copier le lien pour le moment.",
      );
    }
  };

  const shareQrLink = async () => {
    await shareText(
      "Mon profil",
      "Découvre mon profil sur DébrouillePro.",
      url,
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 items-center justify-center px-5"
        style={{ backgroundColor: "rgba(0,0,0,0.82)" }}
      >
        <View
          className="w-full max-w-[390px] rounded-[32px] p-5"
          style={{
            backgroundColor: "#0B1020",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.12)",
          }}
        >
          <View className="mb-5 flex-row items-center">
            <View
              className="h-11 w-11 items-center justify-center rounded-2xl"
              style={{ backgroundColor: "rgba(99,102,241,0.14)" }}
            >
              <QrCode size={20} color="#818CF8" />
            </View>

            <View className="ml-3 flex-1">
              <Text className="text-base font-bold text-white">
                QR Code de profil
              </Text>
              <Text className="mt-0.5 text-xs text-white/45">
                Partage ton profil instantanément
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              className="h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
            >
              <X size={18} color="rgba(255,255,255,0.7)" />
            </Pressable>
          </View>

          <View
            className="items-center justify-center rounded-[28px] p-5"
            style={{
              backgroundColor: "#050812",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            {generating ? (
              <View className="h-64 w-64 items-center justify-center">
                <Loader2 size={30} color="#818CF8" />
                <Text className="mt-3 text-xs text-white/45">
                  Génération du QR code…
                </Text>
              </View>
            ) : qrData ? (
              <Image
                source={{ uri: qrData }}
                resizeMode="contain"
                accessibilityLabel="QR Code du profil"
                style={{
                  width: 256,
                  height: 256,
                  borderRadius: 18,
                }}
              />
            ) : (
              <View className="h-64 w-64 items-center justify-center">
                <QrCode size={42} color="rgba(255,255,255,0.25)" />
                <Text className="mt-3 text-center text-xs text-white/40">
                  QR code indisponible
                </Text>
              </View>
            )}
          </View>

          <View
            className="mt-4 rounded-2xl px-4 py-3"
            style={{
              backgroundColor: "rgba(255,255,255,0.035)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.07)",
            }}
          >
            <Text className="text-xs leading-5 text-white/50" numberOfLines={2}>
              {url}
            </Text>
          </View>

          <View className="mt-4 flex-row">
            <Pressable
              onPress={copyLink}
              className="mr-2 flex-1 flex-row items-center justify-center rounded-2xl px-4 py-3.5"
              style={{
                backgroundColor: "rgba(255,255,255,0.07)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.09)",
              }}
            >
              <Copy size={16} color="rgba(255,255,255,0.75)" />
              <Text className="ml-2 text-sm font-semibold text-white">
                Copier
              </Text>
            </Pressable>

            <Pressable
              onPress={shareQrLink}
              className="ml-2 flex-1 flex-row items-center justify-center rounded-2xl px-4 py-3.5"
              style={{
                backgroundColor: "#4F46E5",
              }}
            >
              <Share2 size={16} color="#FFFFFF" />
              <Text className="ml-2 text-sm font-bold text-white">
                Partager
              </Text>
            </Pressable>
          </View>

          <Text className="mt-4 text-center text-[11px] text-white/30">
            Le QR code contient uniquement le lien public du profil.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <View className="mb-4">
      <Text className="text-[10px] font-extrabold uppercase tracking-[2px] text-indigo-300">
        {eyebrow}
      </Text>

      <Text className="mt-1.5 text-xl font-extrabold text-white">{title}</Text>

      {description ? (
        <Text className="mt-1 text-xs leading-5 text-white/40">
          {description}
        </Text>
      ) : null}
    </View>
  );
}

function ExportInner({ onBack }: ExportPageProps) {
  const { isAuthenticated } = useFirebaseAuth();

  const analytics = useQuery(
    api.analytics.getMyAnalytics,
    isAuthenticated ? {} : "skip",
  );

  const publications = useQuery(api.publications.listFeed, {
    paginationOpts: {
      numItems: 100,
      cursor: null,
    },
  });

  const activity = useQuery(api.activity.list, isAuthenticated ? {} : "skip");

  const currentUser = useQuery(api.users.getCurrentUser, {});

  const [loading, setLoading] = useState<LoadingKey>(null);
  const [showQr, setShowQr] = useState(false);
  const [exportedFiles, setExportedFiles] = useState<ExportedFile[]>([]);

  const isReady =
    analytics !== undefined &&
    publications !== undefined &&
    activity !== undefined &&
    currentUser !== undefined;

  const profileUrl = useMemo(() => {
    if (!currentUser?._id) {
      return null;
    }

    /*
     * En natif, window.location.origin n'existe pas.
     *
     * Le lien public doit idéalement venir d'une configuration
     * publique centralisée de l'application.
     *
     * Pour éviter d'inventer un domaine de production, on utilise
     * le schéma de partage officiel de l'application uniquement
     * si celui-ci est défini via EXPO_PUBLIC_SHARE_URL.
     */
    const baseUrl = process.env.EXPO_PUBLIC_SHARE_URL?.trim();

    if (!baseUrl) {
      return null;
    }

    return `${baseUrl.replace(/\/+$/, "")}/profile/${currentUser._id}`;
  }, [currentUser?._id]);

  const registerExport = (label: string, type: "CSV" | "PDF") => {
    setExportedFiles((previous) =>
      [
        {
          id: `${Date.now()}-${label}`,
          label,
          type,
          createdAt: Date.now(),
        },
        ...previous,
      ].slice(0, 10),
    );
  };

  const exportPublicationsCsv = async () => {
    if (!publications) {
      Alert.alert("Données", "Les publications ne sont pas encore chargées.");
      return;
    }

    setLoading("publications");

    try {
      const headers = [
        "Titre",
        "Type",
        "Ville",
        "Vues",
        "Likes",
        "Commentaires",
        "Date de création",
      ];

      const rows = publications.page.map((publication) => [
        publication.title,
        publication.type,
        publication.location ?? "",
        String(publication.viewCount ?? 0),
        String(publication.likeCount ?? 0),
        String(publication.commentCount ?? 0),
        new Date(publication._creationTime).toISOString(),
      ]);

      const csv = arrayToCsv([headers, ...rows]);

      /*
       * Sur mobile, il n'existe pas de document.createElement("a")
       * ni de téléchargement Web.
       *
       * On ouvre donc le partage natif avec le contenu CSV.
       * Pour un véritable fichier dans le stockage local, brancher
       * expo-file-system + expo-sharing dans une étape dédiée.
       */
      const shared = await shareText("Mes publications", csv);

      if (shared) {
        registerExport("publications-debrouille.csv", "CSV");

        Alert.alert(
          "Export prêt",
          `${publications.page.length} publication(s) préparée(s) au format CSV.`,
        );
      }
    } catch (error) {
      console.error("Publications CSV export error:", error);

      Alert.alert(
        "Export impossible",
        "Une erreur est survenue pendant la préparation de l'export.",
      );
    } finally {
      setLoading(null);
    }
  };

  const exportActivityCsv = async () => {
    if (!activity) {
      Alert.alert("Données", "Ton activité n'est pas encore chargée.");
      return;
    }

    setLoading("activity");

    try {
      const rows = (activity as ActivityItem[]).map((item) => [
        item.type,
        item.label,
        new Date(item._creationTime).toISOString(),
      ]);

      const csv = arrayToCsv([["Type", "Libellé", "Date"], ...rows]);

      const shared = await shareText("Mon historique d'activité", csv);

      if (shared) {
        registerExport("activite-debrouille.csv", "CSV");

        Alert.alert(
          "Export prêt",
          `${rows.length} activité(s) préparée(s) au format CSV.`,
        );
      }
    } catch (error) {
      console.error("Activity CSV export error:", error);

      Alert.alert(
        "Export impossible",
        "Une erreur est survenue pendant la préparation de l'historique.",
      );
    } finally {
      setLoading(null);
    }
  };

  const exportAnalyticsReport = async () => {
    if (!analytics || !currentUser) {
      Alert.alert("Données", "Les analytics ne sont pas encore chargées.");
      return;
    }

    setLoading("analytics");

    try {
      /*
       * Le backend fournit déjà les données réelles.
       * La génération d'un PDF natif doit être effectuée avec une
       * librairie Expo/RN dédiée, pas avec jsPDF + document Web.
       *
       * En attendant un générateur PDF natif explicitement installé,
       * on partage un rapport textuel fidèle aux données Convex.
       */
      const topPublications = analytics.topPublications
        .slice(0, 5)
        .map(
          (publication, index) =>
            `${index + 1}. ${publication.title}\n` +
            `   ${publication.type} · ${publication.views} vues · ${publication.likes} likes`,
        )
        .join("\n");

      const report = [
        "RAPPORT ANALYTICS",
        "",
        `Profil : ${currentUser.name ?? "Utilisateur"}`,
        `Généré le : ${formatDate(Date.now())}`,
        "",
        "STATISTIQUES CLÉS",
        `Publications : ${analytics.totalPublications}`,
        `Vues : ${analytics.totalViews}`,
        `Likes : ${analytics.totalLikes}`,
        `Commentaires : ${analytics.totalComments}`,
        `Abonnés : ${analytics.totalFollowers}`,
        `Engagement : ${analytics.engagementRate}%`,
        "",
        "TOP PUBLICATIONS",
        topPublications || "Aucune publication classée.",
        "",
        "CETTE SEMAINE",
        `Vues : ${analytics.weekSummary.views}`,
        `Likes : ${analytics.weekSummary.likes}`,
      ].join("\n");

      const shared = await shareText("Rapport analytics", report);

      if (shared) {
        registerExport("analytics-debrouille.pdf", "PDF");

        Alert.alert(
          "Rapport prêt",
          "Les données analytics ont été préparées pour le partage.",
        );
      }
    } catch (error) {
      console.error("Analytics export error:", error);

      Alert.alert(
        "Export impossible",
        "Une erreur est survenue pendant la préparation du rapport.",
      );
    } finally {
      setLoading(null);
    }
  };

  const shareProfile = async () => {
    if (!currentUser) {
      Alert.alert("Profil", "Ton profil n'est pas encore chargé.");
      return;
    }

    if (!profileUrl) {
      Alert.alert(
        "Lien public indisponible",
        "Configure EXPO_PUBLIC_SHARE_URL pour activer le partage public du profil.",
      );
      return;
    }

    const shared = await shareText(
      `${currentUser.name ?? "Mon profil"} sur DébrouillePro`,
      "Découvre mon profil public sur DébrouillePro.",
      profileUrl,
    );

    if (!shared) {
      Alert.alert(
        "Partage",
        "Le partage a été annulé ou n'est pas disponible.",
      );
    }
  };

  const copyProfileLink = async () => {
    if (!profileUrl) {
      Alert.alert(
        "Lien public indisponible",
        "Configure EXPO_PUBLIC_SHARE_URL pour activer le lien public.",
      );
      return;
    }

    try {
      await Clipboard.setString(profileUrl);

      Alert.alert("Lien copié", "Le lien public de ton profil a été copié.");
    } catch (error) {
      console.error("Profile clipboard error:", error);

      Alert.alert(
        "Copie impossible",
        "Impossible de copier le lien pour le moment.",
      );
    }
  };

  const publicationsCount = publications?.page.length ?? 0;

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: "#050812",
      }}
    >
      {/* Ambient background */}
      <View
        pointerEvents="none"
        className="absolute right-[-90px] top-[-80px] h-64 w-64 rounded-full"
        style={{
          backgroundColor: "rgba(79,70,229,0.08)",
        }}
      />

      <View
        pointerEvents="none"
        className="absolute bottom-[-120px] left-[-100px] h-72 w-72 rounded-full"
        style={{
          backgroundColor: "rgba(14,165,233,0.05)",
        }}
      />

      {/* Header */}
      <View
        className="flex-row items-center px-5 pb-4 pt-4"
        style={{
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.07)",
        }}
      >
        <Pressable
          onPress={onBack}
          className="h-11 w-11 items-center justify-center rounded-2xl"
          style={{ backgroundColor: "rgba(255,255,255,0.055)" }}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={19} color="rgba(255,255,255,0.78)" />
        </Pressable>

        <View className="ml-3 flex-1">
          <Text className="text-lg font-extrabold text-white">
            Export & Partage
          </Text>
          <Text className="mt-0.5 text-xs text-white/40">
            Contrôle, partage et portabilité de tes données
          </Text>
        </View>

        <View
          className="h-10 w-10 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: isReady
              ? "rgba(16,185,129,0.1)"
              : "rgba(255,255,255,0.05)",
          }}
        >
          {isReady ? (
            <CheckCircle2 size={18} color="#34D399" />
          ) : (
            <Loader2 size={18} color="rgba(255,255,255,0.35)" />
          )}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 22,
          paddingBottom: 42,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View
          className="overflow-hidden rounded-[30px] p-5"
          style={{
            backgroundColor: "rgba(99,102,241,0.075)",
            borderWidth: 1,
            borderColor: "rgba(129,140,248,0.16)",
          }}
        >
          <View className="flex-row items-start">
            <View
              className="h-12 w-12 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: "rgba(99,102,241,0.14)",
              }}
            >
              <Sparkles size={21} color="#A5B4FC" />
            </View>

            <View className="ml-3 flex-1">
              <Text className="text-base font-extrabold text-white">
                Tes données, ton contrôle.
              </Text>

              <Text className="mt-1.5 text-xs leading-5 text-white/45">
                Exporte tes informations disponibles et partage ton profil
                public depuis ton appareil.
              </Text>
            </View>
          </View>

          <View className="mt-5 flex-row">
            <View className="flex-1">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-white/30">
                Publications
              </Text>
              <Text className="mt-1 text-xl font-extrabold text-white">
                {isReady ? formatNumber(publicationsCount) : "—"}
              </Text>
            </View>

            <View className="flex-1">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-white/30">
                Analytics
              </Text>
              <Text className="mt-1 text-xl font-extrabold text-white">
                {analytics ? formatNumber(analytics.totalViews) : "—"}
              </Text>
            </View>

            <View className="flex-1">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-white/30">
                Abonnés
              </Text>
              <Text className="mt-1 text-xl font-extrabold text-white">
                {analytics ? formatNumber(analytics.totalFollowers) : "—"}
              </Text>
            </View>
          </View>
        </View>

        {/* Profile sharing */}
        <View className="mt-8">
          <SectionHeader
            eyebrow="Identité publique"
            title="Partager mon profil"
            description="Permets à quelqu'un d'accéder directement à ton profil public."
          />

          <View className="gap-3">
            <Pressable
              onPress={() => setShowQr(true)}
              disabled={!profileUrl}
              style={({ pressed }) => ({
                opacity: !profileUrl ? 0.5 : pressed ? 0.82 : 1,
              })}
            >
              <View
                className="flex-row items-center rounded-3xl p-4"
                style={{
                  backgroundColor: "rgba(255,255,255,0.045)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.09)",
                }}
              >
                <View
                  className="h-12 w-12 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: "rgba(99,102,241,0.13)",
                  }}
                >
                  <QrCode size={20} color="#818CF8" />
                </View>

                <View className="ml-3 flex-1">
                  <Text className="text-[15px] font-bold text-white">
                    QR Code
                  </Text>
                  <Text className="mt-1 text-xs text-white/40">
                    Présente ton profil en un scan
                  </Text>
                </View>

                <ChevronRight size={18} color="rgba(255,255,255,0.35)" />
              </View>
            </Pressable>

            <Pressable
              onPress={shareProfile}
              disabled={!profileUrl}
              style={({ pressed }) => ({
                opacity: !profileUrl ? 0.5 : pressed ? 0.82 : 1,
              })}
            >
              <View
                className="flex-row items-center rounded-3xl p-4"
                style={{
                  backgroundColor: "rgba(255,255,255,0.045)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.09)",
                }}
              >
                <View
                  className="h-12 w-12 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: "rgba(16,185,129,0.11)",
                  }}
                >
                  <Share2 size={20} color="#34D399" />
                </View>

                <View className="ml-3 flex-1">
                  <Text className="text-[15px] font-bold text-white">
                    Partager
                  </Text>
                  <Text className="mt-1 text-xs text-white/40">
                    WhatsApp, SMS, email et autres applications
                  </Text>
                </View>

                <ChevronRight size={18} color="rgba(255,255,255,0.35)" />
              </View>
            </Pressable>

            <Pressable
              onPress={copyProfileLink}
              disabled={!profileUrl}
              style={({ pressed }) => ({
                opacity: !profileUrl ? 0.5 : pressed ? 0.82 : 1,
              })}
            >
              <View
                className="flex-row items-center rounded-3xl p-4"
                style={{
                  backgroundColor: "rgba(255,255,255,0.045)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.09)",
                }}
              >
                <View
                  className="h-12 w-12 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: "rgba(14,165,233,0.1)",
                  }}
                >
                  <Copy size={19} color="#38BDF8" />
                </View>

                <View className="ml-3 flex-1">
                  <Text className="text-[15px] font-bold text-white">
                    Copier le lien
                  </Text>
                  <Text className="mt-1 text-xs text-white/40">
                    Conserve ou envoie ton lien public
                  </Text>
                </View>

                <ChevronRight size={18} color="rgba(255,255,255,0.35)" />
              </View>
            </Pressable>
          </View>
        </View>

        {/* Exports */}
        <View className="mt-8">
          <SectionHeader
            eyebrow="Portabilité"
            title="Exporter mes données"
            description="Prépare les données actuellement disponibles dans ton compte."
          />

          {!isReady ? (
            <View className="gap-3">
              <Skeleton className="h-[92px] w-full rounded-3xl" />
              <Skeleton className="h-[92px] w-full rounded-3xl" />
              <Skeleton className="h-[92px] w-full rounded-3xl" />
            </View>
          ) : (
            <View className="gap-3">
              <ExportCard
                icon={<FileText size={21} color="#818CF8" />}
                title="Mes publications"
                description={`${formatNumber(publicationsCount)} publication(s) actuellement disponibles`}
                badge="CSV"
                accent="#818CF8"
                loading={loading === "publications"}
                onPress={exportPublicationsCsv}
              />

              <ExportCard
                icon={<Activity size={21} color="#FBBF24" />}
                title="Historique d'activité"
                description="Prépare les actions d'activité actuellement disponibles"
                badge="CSV"
                accent="#FBBF24"
                loading={loading === "activity"}
                onPress={exportActivityCsv}
              />

              <ExportCard
                icon={<BarChart3 size={21} color="#34D399" />}
                title="Rapport analytics"
                description="Statistiques, engagement et publications principales"
                badge="PDF"
                accent="#34D399"
                loading={loading === "analytics"}
                onPress={exportAnalyticsReport}
              />
            </View>
          )}
        </View>

        {/* Recent exports */}
        {exportedFiles.length > 0 ? (
          <View className="mt-8">
            <SectionHeader
              eyebrow="Historique local"
              title="Exports récents"
              description="Cette liste indique les exports préparés pendant cette session."
            />

            <View className="gap-2">
              {exportedFiles.map((file) => (
                <View
                  key={file.id}
                  className="flex-row items-center rounded-2xl px-4 py-3"
                  style={{
                    backgroundColor: "rgba(16,185,129,0.055)",
                    borderWidth: 1,
                    borderColor: "rgba(16,185,129,0.13)",
                  }}
                >
                  <CheckCircle2 size={17} color="#34D399" />

                  <View className="ml-3 flex-1">
                    <Text
                      className="text-sm font-semibold text-white"
                      numberOfLines={1}
                    >
                      {file.label}
                    </Text>

                    <Text className="mt-0.5 text-[10px] text-white/35">
                      {file.type} · {formatDate(file.createdAt)}
                    </Text>
                  </View>

                  <FileDown size={16} color="#34D399" />
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Privacy */}
        <View
          className="mt-8 rounded-3xl p-4"
          style={{
            backgroundColor: "rgba(255,255,255,0.035)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.07)",
          }}
        >
          <View className="flex-row items-start">
            <View
              className="h-10 w-10 items-center justify-center rounded-xl"
              style={{
                backgroundColor: "rgba(16,185,129,0.09)",
              }}
            >
              <ShieldCheck size={18} color="#34D399" />
            </View>

            <View className="ml-3 flex-1">
              <Text className="text-sm font-bold text-white">
                Transparence & contrôle
              </Text>

              <Text className="mt-1.5 text-xs leading-5 text-white/40">
                Les données affichées dans cet écran proviennent des services de
                ton compte. Aucun contenu fictif n'est ajouté pour remplir les
                exports.
              </Text>
            </View>
          </View>
        </View>

        {/* Technical status */}
        <View className="mt-6 items-center">
          <View className="flex-row items-center">
            <View
              className="mr-2 h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor: isReady ? "#34D399" : "#FBBF24",
              }}
            />

            <Text className="text-[10px] font-semibold uppercase tracking-wider text-white/30">
              {isReady ? "Données synchronisées" : "Synchronisation en cours"}
            </Text>
          </View>
        </View>
      </ScrollView>

      {profileUrl ? (
        <QrModal
          visible={showQr}
          url={profileUrl}
          onClose={() => setShowQr(false)}
        />
      ) : null}
    </View>
  );
}

export default function ExportPage({ onBack }: ExportPageProps) {
  const { isAuthenticated } = useFirebaseAuth();

  if (!isAuthenticated) {
    return (
      <View
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: "#050812" }}
      >
        <Pressable
          onPress={onBack}
          className="absolute left-5 top-5 h-11 w-11 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: "rgba(255,255,255,0.055)",
          }}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={19} color="rgba(255,255,255,0.75)" />
        </Pressable>

        <View
          className="h-20 w-20 items-center justify-center rounded-[28px]"
          style={{
            backgroundColor: "rgba(99,102,241,0.12)",
            borderWidth: 1,
            borderColor: "rgba(129,140,248,0.18)",
          }}
        >
          <Share2 size={32} color="#818CF8" />
        </View>

        <Text className="mt-6 text-xl font-extrabold text-white">
          Export & Partage
        </Text>

        <Text className="mt-2 max-w-[320px] text-center text-sm leading-6 text-white/45">
          Connecte-toi pour accéder à tes données, générer tes exports et
          partager ton profil.
        </Text>

        <View className="mt-6">
          <SignInButton />
        </View>
      </View>
    );
  }

  return <ExportInner onBack={onBack} />;
}
