import { View, Text, Pressable, Image } from "react-native";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { toast } from "sonner";
import QRCode from "qrcode";
import {
  ArrowLeft,
  Download,
  Share2,
  QrCode,
  FileText,
  BarChart2,
  Activity,
  CheckCircle2,
  Loader2,
  FileDown,
  Copy,
} from "lucide-react-native";
import { Button } from "@/components/ui/button.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { cn } from "@/lib/utils.ts";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { Clipboard } from "@react-native-clipboard/clipboard";

interface ExportPageProps {
  onBack: () => void;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

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
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(separator),
    )
    .join("\n");
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob(["\uFEFF" + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Export Card ───────────────────────────────────────────────────────────────

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
    <View initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-4 flex items-center gap-4" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }} onPress={!loading ? onExport : undefined}>
      <View className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}22` }}><Text style={{ color }}>{icon}</Text></View>
      <View className="flex-1 min-w-0"><View className="flex items-center gap-2"><Text className="text-sm font-semibold text-white">{title}</Text>{badge && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {badge}
            </Badge>
          )}</View><Text className="text-xs text-white/50 mt-0.5">{description}</Text></View>
      <Pressable className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all" style={{ backgroundColor: `${color}33` }} disabled={loading}>{loading ? (
          <Loader2 className="w-4 h-4 animate-spin" style={{ color }} />
        ) : (
          <Download className="w-4 h-4" style={{ color }} />
        )}</Pressable>
    </View>
  );
}

// ─── QR Code Modal ─────────────────────────────────────────────────────────────

function QrModal({ url, onClose }: { url: string; onClose: () => void }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  const generateQr = async () => {
    try {
      const result = await QRCode.toDataURL(url, {
        width: 256,
        margin: 2,
        color: { dark: "#ffffff", light: "#0a0a1a" },
      });
      setDataUrl(result);
    } catch {
      toast.error("Erreur génération QR code");
    }
  };

  useEffect(() => {
    void generateQr();
  }, [url]);

  const copyLink = async () => {
    await Clipboard.setString(url);
    toast.success("Lien copié !");
  };

  const downloadQr = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "profil-qrcode.png";
    a.click();
  };

  return (
<View>
      <View key="qr-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} onPress={onClose}>
        <View initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="rounded-3xl p-6 w-full max-w-xs flex flex-col items-center gap-4" style={{ backgroundColor: "#0f1123", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderStyle: "solid" }} onPress={(e) => e.stopPropagation()}>
          <Text className="text-base font-bold text-white">QR Code Profil</Text>
          {dataUrl ? (
            <Image className="rounded-2xl w-48 h-48" source={{ uri: dataUrl }} accessibilityLabel="QR Code" />
          ) : (
            <Skeleton className="w-48 h-48 rounded-2xl" />
          )}
          <Text className="text-xs text-white/40 text-center">{url}</Text>
          <View className="flex gap-2 w-full"><Button size="sm" className="flex-1 gap-1.5" variant="secondary" onPress={copyLink}><Copy className="w-3.5 h-3.5" />Copier le lien
            </Button><Button size="sm" className="flex-1 gap-1.5" onPress={downloadQr} disabled={!dataUrl}><Download className="w-3.5 h-3.5" />Télécharger
            </Button></View>
          <Pressable onPress={onClose} className="text-xs text-white/30 transition-colors"><Text>Fermer</Text></Pressable>
        </View>
      </View>
    </View>
  );
}

// ─── Share Modal ───────────────────────────────────────────────────────────────

async function nativeShare(title: string, text: string, url: string) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch {
      return false;
    }
  }
  // fallback: copy
  try {
    await Clipboard.setString(url);
    toast.success("Lien copié dans le presse-papiers");
    return true;
  } catch {
    return false;
  }
}

// ─── Main Component ────────────────────────────────────────────────────────────

function ExportInner({ onBack }: ExportPageProps) {
  const { isAuthenticated } = useFirebaseAuth();

  // ✅ analytics.getMyAnalytics utilise isAuthenticated
  const analytics = useQuery(
    api.analytics.getMyAnalytics,
    isAuthenticated ? {} : "skip",
  );

  const publications = useQuery(api.publications.listFeed, {
    paginationOpts: { numItems: 100, cursor: null },
  });

  // ✅ activity.list a été migré vers ctx.auth.getUserIdentity() → on envoie {}
  const activity = useQuery(api.activity.list, isAuthenticated ? {} : "skip");

  const currentUser = useQuery(api.users.getCurrentUser, {});

  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {},
  );
  const [showQr, setShowQr] = useState(false);
  const [exportedFiles, setExportedFiles] = useState<string[]>([]);
  const canvasRef = useRef<View>(null);

  const setLoading = (key: string, value: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: value }));
  };

  const markDone = (label: string) => {
    setExportedFiles((prev) => [label, ...prev].slice(0, 10));
  };

  // ── Export: Publications CSV ─────────────────────────────────────────────────
  const exportPublicationsCsv = async () => {
    if (!publications) {
      toast.error("Données non chargées");
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
      const rows = publications.page.map((p) => [
        p.title,
        p.type,
        p.location ?? "",
        String(p.viewCount),
        String(p.likeCount),
        String(p.commentCount),
        new Date(p._creationTime).toISOString(),
      ]);
      downloadBlob(
        arrayToCsv([headers, ...rows]),
        "publications-debrouille.csv",
        "text/csv;charset=utf-8;",
      );
      markDone("publications-debrouille.csv");
      toast.success("Publications exportées !");
    } finally {
      setLoading("pub-csv", false);
    }
  };

  // ── Export: Activity CSV ─────────────────────────────────────────────────────
  const exportActivityCsv = async () => {
    if (!activity) {
      toast.error("Données non chargées");
      return;
    }
    setLoading("activity-csv", true);
    try {
      const headers = ["Type", "Label", "Date"];
      const rows = (
        activity as { type: string; label: string; _creationTime: number }[]
      ).map((a) => [a.type, a.label, new Date(a._creationTime).toISOString()]);
      downloadBlob(
        arrayToCsv([headers, ...rows]),
        "activite-debrouille.csv",
        "text/csv;charset=utf-8;",
      );
      markDone("activite-debrouille.csv");
      toast.success("Historique exporté !");
    } finally {
      setLoading("activity-csv", false);
    }
  };

  // ── Export: Analytics PDF ────────────────────────────────────────────────────
  const exportAnalyticsPdf = async () => {
    if (!analytics || !currentUser) {
      toast.error("Données non chargées");
      return;
    }
    setLoading("analytics-pdf", true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 20;
      const col = margin;
      let y = 20;

      // ── Header ──
      doc.setFillColor(10, 10, 26);
      doc.rect(0, 0, pageW, 40, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Rapport Analytics", col, y + 4);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(160, 160, 200);
      doc.text(
        `Débrouille Pro  •  ${currentUser.name ?? "Utilisateur"}`,
        col,
        y + 12,
      );
      doc.text(
        `Généré le ${formatDate(new Date().toISOString())}`,
        col,
        y + 19,
      );
      y = 50;

      // ── KPIs ──
      doc.setTextColor(30, 30, 60);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Statistiques clés", col, y);
      y += 8;

      const kpis = [
        ["Publications totales", String(analytics.totalPublications)],
        ["Vues totales", String(analytics.totalViews)],
        ["Likes reçus", String(analytics.totalLikes)],
        ["Commentaires", String(analytics.totalComments)],
        ["Abonnés", String(analytics.totalFollowers)],
        ["Taux d'engagement", `${analytics.engagementRate}%`],
      ];

      doc.setFontSize(10);
      kpis.forEach(([label, value], i) => {
        const x = col + (i % 2) * 90;
        const rowY = y + Math.floor(i / 2) * 14;
        doc.setFillColor(245, 245, 255);
        doc.roundedRect(x, rowY, 85, 11, 2, 2, "F");
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 120);
        doc.text(label, x + 4, rowY + 7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 30, 80);
        doc.text(value, x + 81, rowY + 7, { align: "right" });
      });
      y += Math.ceil(kpis.length / 2) * 14 + 12;

      // ── Top Publications ──
      if (analytics.topPublications.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(30, 30, 60);
        doc.text("Top 5 publications", col, y);
        y += 8;
        doc.setFontSize(9);
        const th = ["Titre", "Type", "Vues", "Likes"];
        const tw = [90, 30, 20, 20];
        doc.setFillColor(10, 10, 26);
        doc.rect(col, y, pageW - 2 * margin, 7, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        let tx = col + 2;
        th.forEach((h, i) => {
          doc.text(h, tx, y + 5);
          tx += tw[i];
        });
        y += 7;

        analytics.topPublications.forEach((pub, idx) => {
          doc.setFillColor(
            idx % 2 === 0 ? 250 : 243,
            idx % 2 === 0 ? 250 : 243,
            idx % 2 === 0 ? 255 : 252,
          );
          doc.rect(col, y, pageW - 2 * margin, 8, "F");
          doc.setFont("helvetica", "normal");
          doc.setTextColor(40, 40, 70);
          tx = col + 2;
          const cells = [
            pub.title.slice(0, 40),
            pub.type,
            String(pub.views),
            String(pub.likes),
          ];
          cells.forEach((c, i) => {
            doc.text(c, tx, y + 5.5);
            tx += tw[i];
          });
          y += 8;
        });
        y += 10;
      }

      // ── Week summary ──
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 30, 60);
      doc.text("Cette semaine", col, y);
      y += 7;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 100);
      doc.text(
        `Vues : ${analytics.weekSummary.views}  •  Likes : ${analytics.weekSummary.likes}`,
        col,
        y,
      );
      y += 12;

      // ── Footer ──
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFillColor(10, 10, 26);
      doc.rect(0, pageH - 14, pageW, 14, "F");
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 150);
      doc.text("Débrouille Pro  •  débrouille.app", pageW / 2, pageH - 5, {
        align: "center",
      });

      doc.save("analytics-debrouille.pdf");
      markDone("analytics-debrouille.pdf");
      toast.success("Rapport PDF généré !");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setLoading("analytics-pdf", false);
    }
  };

  // ── Native Share on a publication ───────────────────────────────────────────
  const shareProfile = async () => {
    if (!currentUser) return;
    const url = `${window.location.origin}?profile=${currentUser._id}`;
    const shared = await nativeShare(
      `${currentUser.name ?? "Mon profil"} sur Débrouille Pro`,
      "Découvre mon profil sur Débrouille Pro, la super-app africaine 🌍",
      url,
    );
    if (!shared) toast.error("Partage non disponible");
  };

  const profileUrl = currentUser
    ? `${window.location.origin}?profile=${currentUser._id}`
    : window.location.origin;

  const isReady = !!analytics && !!publications && !!activity && !!currentUser;

  return (
    <View className="flex flex-col h-full" style={{  }}>{}<View className="flex items-center gap-3 px-5 pt-safe-or-4 pb-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}><Pressable onPress={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"><ArrowLeft className="w-5 h-5 text-white/70" /></Pressable><View><Text className="text-base font-bold text-white">Export & Partage</Text><Text className="text-xs text-white/40">Télécharge tes données, partage ton profil
          </Text></View>{isReady && (
          <View className="ml-auto flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><Text className="text-xs text-emerald-400">Données prêtes</Text></View>
        )}</View><View className="flex-1 overflow-y-auto px-5 py-5 space-y-6">{}<View><Text className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Partager mon profil
          </Text><View className="space-y-3">{}<View initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-4 flex items-center gap-4" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }} onPress={() => setShowQr(true)}><View className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#6366f122" }}><QrCode className="w-5 h-5 text-indigo-400" /></View><View className="flex-1 min-w-0"><Text className="text-sm font-semibold text-white">QR Code de profil
                </Text><Text className="text-xs text-white/50 mt-0.5">Génère un QR code avec ton lien public
                </Text></View><View className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#6366f133" }}><QrCode className="w-4 h-4 text-indigo-400" /></View></View>{}<View initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl p-4 flex items-center gap-4" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }} onPress={shareProfile}><View className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#10b98122" }}><Share2 className="w-5 h-5 text-emerald-400" /></View><View className="flex-1 min-w-0"><Text className="text-sm font-semibold text-white">Partager mon profil
                </Text><Text className="text-xs text-white/50 mt-0.5">Via WhatsApp, SMS, email ou lien direct
                </Text></View><View className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#10b98133" }}><Share2 className="w-4 h-4 text-emerald-400" /></View></View></View></View>{}<View><Text className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Exporter mes données
          </Text><View className="space-y-3">{!isReady ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
              ))
            ) : (
              <>
                <ExportCard
                  icon={<FileText className="w-5 h-5" />}
                  title="Mes publications (CSV)"
                  description={`${publications.page.length} publications · Excel, Google Sheets`}
                  badge="CSV"
                  onExport={exportPublicationsCsv}
                  loading={!!loadingStates["pub-csv"]}
                  color="#6366f1"
                />
                <ExportCard
                  icon={<Activity className="w-5 h-5" />}
                  title="Historique d'activité (CSV)"
                  description="Toutes mes actions dans l'app"
                  badge="CSV"
                  onExport={exportActivityCsv}
                  loading={!!loadingStates["activity-csv"]}
                  color="#f59e0b"
                />
                <ExportCard
                  icon={<BarChart2 className="w-5 h-5" />}
                  title="Rapport analytics (PDF)"
                  description="Stats, vues, likes, top publications"
                  badge="PDF"
                  onExport={exportAnalyticsPdf}
                  loading={!!loadingStates["analytics-pdf"]}
                  color="#10b981"
                />
              </>
            )}</View></View>{}<View>{exportedFiles.length > 0 && (
            <View initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <Text className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Exports récents
              </Text>
              <View className="space-y-2">
                {exportedFiles.map((f, i) => (
                  <View key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: "rgba(16,185,129,0.08)", borderWidth: 1, borderColor: "rgba(16,185,129,0.2)", borderStyle: "solid" }}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <Text className="text-sm text-white/80">{f}</Text>
                    <FileDown className="w-4 h-4 text-emerald-400 ml-auto shrink-0" />
                  </View>
                ))}
              </View>
            </View>
          )}</View>{}<View initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="rounded-2xl p-4" style={{ backgroundColor: "rgba(99,102,241,0.06)", borderWidth: 1, borderColor: "rgba(99,102,241,0.15)", borderStyle: "solid" }}><Text className="text-xs text-white/50 leading-relaxed">Tes données t'appartiennent. Les fichiers exportés sont générés
            localement et ne sont jamais envoyés à nos serveurs.
          </Text></View><canvas ref={canvasRef} className="hidden" /></View>{}{showQr && <QrModal url={profileUrl} onClose={() => setShowQr(false)} />}</View>
  );
}

// ─── ExportPage ────────────────────────────────────────────────────────────────

export default function ExportPage({ onBack }: ExportPageProps) {
  const { isAuthenticated } = useFirebaseAuth();

  if (!isAuthenticated) {
    return (
      <View className="flex flex-col h-full items-center justify-center gap-4 px-6" style={{  }}>
        <Pressable onPress={onBack} className="self-start mb-4">
          <ArrowLeft className="w-5 h-5 text-white/60" />
        </Pressable>
        <Share2 className="w-12 h-12 text-indigo-400" />
        <Text className="text-white font-semibold text-lg">Export & Partage</Text>
        <Text className="text-white/50 text-sm text-center">
          Connecte-toi pour exporter tes données et partager ton profil.
        </Text>
        <SignInButton />
      </View>
    );
  }

  return <ExportInner onBack={onBack} />;
}
