// src/pages/modules/ExportPage.tsx

import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useRef, useState } from "react";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";

import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import QRCode from "react-native-qrcode-svg";

import {
  Activity,
  ArrowLeft,
  BarChart2,
  CheckCircle2,
  Copy,
  Download,
  FileDown,
  FileText,
  QrCode,
  Share2,
} from "lucide-react-native";

import { SignInButton } from "@/components/ui/signin.tsx";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

interface ExportPageProps {
  onBack: () => void;
}

type QrCodeRef = {
  toDataURL: (callback: (data: string) => void) => void;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function arrayToCsv(rows: string[][], separator = ";") {
  return rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
        .join(separator),
    )
    .join("\n");
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function shareFile(uri: string, dialogTitle?: string) {
  const available = await Sharing.isAvailableAsync();

  if (!available) {
    Alert.alert(
      "Partage indisponible",
      "Le partage de fichiers n'est pas disponible sur cet appareil.",
    );
    return false;
  }

  await Sharing.shareAsync(uri, {
    dialogTitle,
  });

  return true;
}

async function exportTextFile(
  content: string,
  filename: string,
  mimeType: string,
) {
  const directory = FileSystem.cacheDirectory;

  if (!directory) {
    throw new Error("Le stockage temporaire est indisponible.");
  }

  const fileUri = `${directory}${filename}`;

  await FileSystem.writeAsStringAsync(fileUri, `\uFEFF${content}`, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const shared = await shareFile(fileUri, `Exporter ${filename}`);

  if (!shared) {
    throw new Error("Impossible de partager le fichier exporté.");
  }

  return {
    uri: fileUri,
    mimeType,
  };
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function ExportCard({
  icon,
  title,
  description,
  badge,
  onExport,
  loading,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  onExport: () => void;
  loading: boolean;
  color: string;
}) {
  return (
    <Pressable
      onPress={() => {
        if (!loading) {
          onExport();
        }
      }}
      disabled={loading}
      style={({ pressed }) => [
        styles.exportCard,
        pressed && !loading && styles.pressed,
        loading && styles.disabled,
      ]}
    >
      <View
        style={[
          styles.exportIconContainer,
          {
            backgroundColor: `${color}22`,
          },
        ]}
      >
        {icon}
      </View>

      <View style={styles.exportContent}>
        <View style={styles.exportTitleRow}>
          <Text style={styles.exportTitle}>{title}</Text>

          {badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.exportDescription}>{description}</Text>
      </View>

      <View
        style={[
          styles.downloadButton,
          {
            backgroundColor: `${color}33`,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={color} />
        ) : (
          <Download size={18} color={color} />
        )}
      </View>
    </Pressable>
  );
}

function LoadingCard() {
  return (
    <View style={styles.loadingCard}>
      <ActivityIndicator color="#818cf8" size="small" />
    </View>
  );
}

function QrModal({
  url,
  visible,
  onClose,
}: {
  url: string;
  visible: boolean;
  onClose: () => void;
}) {
  const qrRef = useRef<QrCodeRef | null>(null);
  const [saving, setSaving] = useState(false);

  const copyLink = async () => {
    try {
      await Clipboard.setStringAsync(url);

      Alert.alert(
        "Lien copié",
        "Le lien du profil a été copié dans le presse-papiers.",
      );
    } catch {
      Alert.alert("Erreur", "Impossible de copier le lien.");
    }
  };

  const downloadQr = async () => {
    if (!qrRef.current) {
      return;
    }

    setSaving(true);

    try {
      qrRef.current.toDataURL(async (base64) => {
        try {
          const directory = FileSystem.cacheDirectory;

          if (!directory) {
            throw new Error("Le stockage temporaire est indisponible.");
          }

          const fileUri = `${directory}profil-qrcode.png`;

          await FileSystem.writeAsStringAsync(fileUri, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });

          await shareFile(fileUri, "QR Code du profil");
        } catch {
          Alert.alert("Erreur", "Impossible d'exporter le QR Code.");
        } finally {
          setSaving(false);
        }
      });
    } catch {
      setSaving(false);

      Alert.alert("Erreur", "Impossible de générer le QR Code.");
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={styles.modalContent}
          onPress={(event) => event.stopPropagation()}
        >
          <Text style={styles.modalTitle}>QR Code Profil</Text>

          <View style={styles.qrContainer}>
            <QRCode
              value={url}
              size={220}
              color="#ffffff"
              backgroundColor="#0f1123"
              getRef={(ref) => {
                qrRef.current = ref as unknown as QrCodeRef;
              }}
            />
          </View>

          <Text selectable numberOfLines={4} style={styles.qrUrl}>
            {url}
          </Text>

          <View style={styles.modalActions}>
            <Pressable
              onPress={() => {
                void copyLink();
              }}
              style={styles.secondaryAction}
            >
              <Copy size={16} color="#ffffff" />

              <Text style={styles.secondaryActionText}>Copier</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                void downloadQr();
              }}
              disabled={saving}
              style={[styles.primaryAction, saving && styles.disabled]}
            >
              {saving ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Download size={16} color="#ffffff" />
              )}

              <Text style={styles.primaryActionText}>Exporter</Text>
            </Pressable>
          </View>

          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Fermer</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
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

  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {},
  );

  const [showQr, setShowQr] = useState(false);

  const [exportedFiles, setExportedFiles] = useState<string[]>([]);

  const setLoading = (key: string, value: boolean) => {
    setLoadingStates((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const markDone = (label: string) => {
    setExportedFiles((previous) => [label, ...previous].slice(0, 10));
  };

  const exportPublicationsCsv = async () => {
    if (!publications) {
      Alert.alert("Chargement", "Les données ne sont pas encore disponibles.");
      return;
    }

    setLoading("pub-csv", true);

    try {
      const headers = [
        "Titre",
        "Type",
        "Ville",
        "Vues",
        "Likes",
        "Commentaires",
        "Date création",
      ];

      const rows = publications.page.map((publication) => [
        publication.title ?? "",
        publication.type ?? "",
        publication.location ?? "",
        String(publication.viewCount ?? 0),
        String(publication.likeCount ?? 0),
        String(publication.commentCount ?? 0),
        new Date(publication._creationTime).toISOString(),
      ]);

      await exportTextFile(
        arrayToCsv([headers, ...rows]),
        "publications-debrouille.csv",
        "text/csv",
      );

      markDone("publications-debrouille.csv");

      Alert.alert("Export terminé", "Les publications ont été exportées.");
    } catch (error) {
      console.error(error);

      Alert.alert("Erreur", "Impossible d'exporter les publications.");
    } finally {
      setLoading("pub-csv", false);
    }
  };

  const exportActivityCsv = async () => {
    if (!activity) {
      Alert.alert("Chargement", "Les données ne sont pas encore disponibles.");
      return;
    }

    setLoading("activity-csv", true);

    try {
      const headers = ["Type", "Label", "Date"];

      const rows = (
        activity as Array<{
          type: string;
          label: string;
          _creationTime: number;
        }>
      ).map((item) => [
        item.type,
        item.label,
        new Date(item._creationTime).toISOString(),
      ]);

      await exportTextFile(
        arrayToCsv([headers, ...rows]),
        "activite-debrouille.csv",
        "text/csv",
      );

      markDone("activite-debrouille.csv");

      Alert.alert("Export terminé", "L'historique d'activité a été exporté.");
    } catch (error) {
      console.error(error);

      Alert.alert("Erreur", "Impossible d'exporter l'historique.");
    } finally {
      setLoading("activity-csv", false);
    }
  };

  const exportAnalyticsPdf = async () => {
    if (!analytics || !currentUser) {
      Alert.alert(
        "Chargement",
        "Les données analytics ne sont pas encore disponibles.",
      );
      return;
    }

    setLoading("analytics-pdf", true);

    try {
      const topRows = analytics.topPublications
        .slice(0, 5)
        .map(
          (publication) => `
              <tr>
                <td>${escapeHtml(publication.title)}</td>
                <td>${escapeHtml(publication.type)}</td>
                <td>${escapeHtml(publication.views)}</td>
                <td>${escapeHtml(publication.likes)}</td>
              </tr>
            `,
        )
        .join("");

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <style>
              body {
                font-family: Arial, sans-serif;
                color: #1e1e3c;
                padding: 28px;
              }

              .header {
                background: #0a0a1a;
                color: white;
                padding: 24px;
                border-radius: 14px;
                margin-bottom: 28px;
              }

              .header h1 {
                margin: 0 0 8px;
                font-size: 24px;
              }

              .muted {
                color: #9ca3af;
                font-size: 12px;
              }

              h2 {
                margin-top: 26px;
              }

              .grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
              }

              .card {
                background: #f5f5ff;
                padding: 14px;
                border-radius: 10px;
              }

              .label {
                font-size: 11px;
                color: #666;
              }

              .value {
                font-size: 20px;
                font-weight: bold;
                margin-top: 6px;
              }

              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 12px;
              }

              th {
                background: #0a0a1a;
                color: white;
                text-align: left;
              }

              th,
              td {
                padding: 9px;
                border: 1px solid #e5e7eb;
                font-size: 11px;
              }

              tr:nth-child(even) {
                background: #f8fafc;
              }

              .footer {
                margin-top: 30px;
                text-align: center;
                color: #6b7280;
                font-size: 10px;
              }
            </style>
          </head>

          <body>
            <div class="header">
              <h1>Rapport Analytics</h1>

              <div>
                Débrouille Pro •
                ${escapeHtml(currentUser.name ?? "Utilisateur")}
              </div>

              <div class="muted">
                Généré le
                ${escapeHtml(formatDate(new Date().toISOString()))}
              </div>
            </div>

            <h2>Statistiques clés</h2>

            <div class="grid">
              <div class="card">
                <div class="label">
                  Publications totales
                </div>
                <div class="value">
                  ${escapeHtml(analytics.totalPublications)}
                </div>
              </div>

              <div class="card">
                <div class="label">
                  Vues totales
                </div>
                <div class="value">
                  ${escapeHtml(analytics.totalViews)}
                </div>
              </div>

              <div class="card">
                <div class="label">
                  Likes reçus
                </div>
                <div class="value">
                  ${escapeHtml(analytics.totalLikes)}
                </div>
              </div>

              <div class="card">
                <div class="label">
                  Commentaires
                </div>
                <div class="value">
                  ${escapeHtml(analytics.totalComments)}
                </div>
              </div>

              <div class="card">
                <div class="label">
                  Abonnés
                </div>
                <div class="value">
                  ${escapeHtml(analytics.totalFollowers)}
                </div>
              </div>

              <div class="card">
                <div class="label">
                  Taux d'engagement
                </div>
                <div class="value">
                  ${escapeHtml(`${analytics.engagementRate}%`)}
                </div>
              </div>
            </div>

            ${
              analytics.topPublications.length > 0
                ? `
                  <h2>
                    Top 5 publications
                  </h2>

                  <table>
                    <thead>
                      <tr>
                        <th>Titre</th>
                        <th>Type</th>
                        <th>Vues</th>
                        <th>Likes</th>
                      </tr>
                    </thead>

                    <tbody>
                      ${topRows}
                    </tbody>
                  </table>
                `
                : ""
            }

            <h2>Cette semaine</h2>

            <p>
              Vues :
              <strong>
                ${escapeHtml(analytics.weekSummary.views)}
              </strong>
              • Likes :
              <strong>
                ${escapeHtml(analytics.weekSummary.likes)}
              </strong>
            </p>

            <div class="footer">
              Débrouille Pro
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      await shareFile(uri, "Rapport Analytics Débrouille Pro");

      markDone("analytics-debrouille.pdf");

      Alert.alert("Rapport généré", "Le rapport PDF est prêt.");
    } catch (error) {
      console.error(error);

      Alert.alert("Erreur", "Impossible de générer le rapport PDF.");
    } finally {
      setLoading("analytics-pdf", false);
    }
  };

  const profileUrl = currentUser
    ? `https://debrouille.app/profile/${currentUser._id}`
    : "https://debrouille.app";

  const shareProfile = async () => {
    if (!currentUser) {
      return;
    }

    try {
      await Sharing.shareAsync(
        `https://debrouille.app/profile/${currentUser._id}`,
        {
          dialogTitle: "Partager mon profil",
          mimeType: "text/plain",
        },
      );
    } catch {
      try {
        await Clipboard.setStringAsync(profileUrl);

        Alert.alert(
          "Lien copié",
          "Le lien du profil a été copié dans le presse-papiers.",
        );
      } catch {
        Alert.alert("Erreur", "Le partage du profil est indisponible.");
      }
    }
  };

  const isReady = !!analytics && !!publications && !!activity && !!currentUser;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <ArrowLeft size={22} color="#ffffff" />
        </Pressable>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Export & Partage</Text>

          <Text style={styles.headerSubtitle}>
            Télécharge tes données et partage ton profil
          </Text>
        </View>

        {isReady ? (
          <View style={styles.readyContainer}>
            <CheckCircle2 size={16} color="#34d399" />

            <Text style={styles.readyText}>Prêt</Text>
          </View>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <SectionTitle>Partager mon profil</SectionTitle>

          <View style={styles.cardsColumn}>
            <Pressable
              onPress={() => setShowQr(true)}
              style={({ pressed }) => [
                styles.exportCard,
                pressed && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.exportIconContainer,
                  {
                    backgroundColor: "#6366f122",
                  },
                ]}
              >
                <QrCode size={22} color="#818cf8" />
              </View>

              <View style={styles.exportContent}>
                <Text style={styles.exportTitle}>QR Code de profil</Text>

                <Text style={styles.exportDescription}>
                  Génère un QR Code avec ton lien public
                </Text>
              </View>

              <QrCode size={20} color="#818cf8" />
            </Pressable>

            <Pressable
              onPress={() => {
                void shareProfile();
              }}
              style={({ pressed }) => [
                styles.exportCard,
                pressed && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.exportIconContainer,
                  {
                    backgroundColor: "#10b98122",
                  },
                ]}
              >
                <Share2 size={22} color="#34d399" />
              </View>

              <View style={styles.exportContent}>
                <Text style={styles.exportTitle}>Partager mon profil</Text>

                <Text style={styles.exportDescription}>
                  Via WhatsApp, SMS, email ou lien direct
                </Text>
              </View>

              <Share2 size={20} color="#34d399" />
            </Pressable>
          </View>
        </View>

        <View>
          <SectionTitle>Exporter mes données</SectionTitle>

          <View style={styles.cardsColumn}>
            {!isReady ? (
              <>
                <LoadingCard />
                <LoadingCard />
                <LoadingCard />
              </>
            ) : (
              <>
                <ExportCard
                  icon={<FileText size={22} color="#818cf8" />}
                  title="Mes publications (CSV)"
                  description={`${publications.page.length} publications · Compatible Excel et Google Sheets`}
                  badge="CSV"
                  onExport={() => {
                    void exportPublicationsCsv();
                  }}
                  loading={!!loadingStates["pub-csv"]}
                  color="#6366f1"
                />

                <ExportCard
                  icon={<Activity size={22} color="#fbbf24" />}
                  title="Historique d'activité (CSV)"
                  description="Toutes mes actions dans l'application"
                  badge="CSV"
                  onExport={() => {
                    void exportActivityCsv();
                  }}
                  loading={!!loadingStates["activity-csv"]}
                  color="#f59e0b"
                />

                <ExportCard
                  icon={<BarChart2 size={22} color="#34d399" />}
                  title="Rapport analytics (PDF)"
                  description="Statistiques, vues, likes et top publications"
                  badge="PDF"
                  onExport={() => {
                    void exportAnalyticsPdf();
                  }}
                  loading={!!loadingStates["analytics-pdf"]}
                  color="#10b981"
                />
              </>
            )}
          </View>
        </View>

        {exportedFiles.length > 0 ? (
          <View>
            <SectionTitle>Exports récents</SectionTitle>

            <View style={styles.recentExports}>
              {exportedFiles.map((file, index) => (
                <View key={`${file}-${index}`} style={styles.recentExport}>
                  <CheckCircle2 size={18} color="#34d399" />

                  <Text numberOfLines={1} style={styles.recentExportText}>
                    {file}
                  </Text>

                  <FileDown size={18} color="#34d399" />
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Tes données t'appartiennent. Les fichiers exportés sont générés
            localement sur ton appareil avant d'être partagés via les options
            natives disponibles.
          </Text>
        </View>
      </ScrollView>

      <QrModal
        url={profileUrl}
        visible={showQr}
        onClose={() => setShowQr(false)}
      />
    </View>
  );
}

export default function ExportPage({ onBack }: ExportPageProps) {
  const { isAuthenticated } = useFirebaseAuth();

  if (!isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <Pressable onPress={onBack} style={styles.authBackButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </Pressable>

        <Share2 size={52} color="#818cf8" />

        <Text style={styles.authTitle}>Export & Partage</Text>

        <Text style={styles.authDescription}>
          Connecte-toi pour exporter tes données et partager ton profil.
        </Text>

        <SignInButton />
      </View>
    );
  }

  return <ExportInner onBack={onBack} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080817",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  headerContent: {
    flex: 1,
    marginLeft: 12,
  },

  headerTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },

  headerSubtitle: {
    marginTop: 3,
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
  },

  readyContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  readyText: {
    color: "#34d399",
    fontSize: 11,
    fontWeight: "600",
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 40,
    gap: 28,
  },

  sectionTitle: {
    marginBottom: 12,
    color: "rgba(255,255,255,0.42)",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },

  cardsColumn: {
    gap: 12,
  },

  exportCard: {
    minHeight: 86,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  exportIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  exportContent: {
    flex: 1,
    minWidth: 0,
  },

  exportTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  exportTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    flexShrink: 1,
  },

  exportDescription: {
    marginTop: 4,
    color: "rgba(255,255,255,0.48)",
    fontSize: 11,
    lineHeight: 16,
  },

  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  badgeText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 9,
    fontWeight: "700",
  },

  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingCard: {
    height: 86,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  recentExports: {
    gap: 8,
  },

  recentExport: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: "rgba(16,185,129,0.08)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.2)",
  },

  recentExportText: {
    flex: 1,
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
  },

  infoCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: "rgba(99,102,241,0.08)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.18)",
  },

  infoText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    lineHeight: 19,
  },

  modalOverlay: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.78)",
  },

  modalContent: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    padding: 24,
    borderRadius: 26,
    backgroundColor: "#0f1123",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  modalTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },

  qrContainer: {
    marginVertical: 22,
    padding: 14,
    borderRadius: 20,
    backgroundColor: "#0a0a1a",
  },

  qrUrl: {
    width: "100%",
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },

  modalActions: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
  },

  primaryAction: {
    flex: 1,
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 12,
    backgroundColor: "#6366f1",
  },

  primaryActionText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },

  secondaryAction: {
    flex: 1,
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.09)",
  },

  secondaryActionText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },

  closeButton: {
    marginTop: 18,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },

  closeButtonText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
  },

  authContainer: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#080817",
  },

  authBackButton: {
    position: "absolute",
    top: 24,
    left: 20,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  authTitle: {
    marginTop: 18,
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
  },

  authDescription: {
    marginTop: 10,
    marginBottom: 22,
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },

  pressed: {
    opacity: 0.75,
  },

  disabled: {
    opacity: 0.55,
  },
});
