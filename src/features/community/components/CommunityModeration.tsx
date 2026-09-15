import { View, Text, Pressable } from "react-native";
import { useState } from "react";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Flag,
  Ban,
  Eye,
} from "lucide-react-native";

interface ReportItem {
  id: string;
  reason: string;
  reportedBy: string;
  reportedAt: number;
  status: "pending" | "reviewing" | "resolved" | "rejected";
  content: string;
  type: "post" | "comment" | "user";
}

interface Props {
  reports: ReportItem[];
  onResolve: (
    reportId: string,
    action: "warn" | "remove" | "dismiss",
  ) => Promise<void>;
  onReview: (reportId: string) => Promise<void>;
  isAdmin?: boolean;
}

export function CommunityModeration({
  reports,
  onResolve,
  onReview,
  isAdmin = false,
}: Props) {
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  if (!isAdmin || reports.length === 0) {
    return (
      <View className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center"><Shield size={32} className="text-white/20 mx-auto mb-2" /><Text className="text-white/40 text-sm">Aucun signalement en attente</Text></View>
    );
  }

  const handleAction = async (
    reportId: string,
    action: "warn" | "remove" | "dismiss",
  ) => {
    setIsLoading(reportId);
    try {
      await onResolve(reportId, action);
    } finally {
      setIsLoading(null);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusConfig = {
    pending: { label: "En attente", color: "#F59E0B", icon: Clock },
    reviewing: { label: "En examen", color: "#6366F1", icon: Eye },
    resolved: { label: "Résolu", color: "#10B981", icon: CheckCircle },
    rejected: { label: "Rejeté", color: "#6B7280", icon: XCircle },
  };

  return (
    <View className="space-y-3"><View className="flex items-center justify-between"><View className="flex items-center gap-2"><Flag size={16} className="text-white/30" /><Text className="text-sm font-medium text-white/50">Modération</Text><Text className="text-xs text-white/30 bg-white/10 px-2 py-0.5 rounded-full">{reports.filter((r) => r.status === "pending").length}en attente
          </Text></View></View><View className="space-y-2">{reports.map((report) => {
          const status = statusConfig[report.status];
          const isExpanded = expandedReport === report.id;

          return (
            <View key={report.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-white/5 border border-white/5 overflow-hidden">
              <Pressable onPress={() => setExpandedReport(isExpanded ? null : report.id)} className="w-full flex items-center gap-3 p-3 text-left"><View className="flex-1 min-w-0"><View className="flex items-center gap-2"><Text className="text-white/80 text-sm font-medium">#{report.id.slice(0, 6)}</Text><Text className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${status.color}20`, color: status.color }}>{status.label}</Text><Text className="text-xs text-white/30">{report.type}</Text></View><Text className="text-white/60 text-xs truncate">{report.reason}</Text><View className="flex items-center gap-2 text-white/20 text-[10px] mt-0.5"><Text>Par {report.reportedBy}</Text><Text>·</Text><Text>{formatDate(report.reportedAt)}</Text></View></View><status.icon size={14} style={{  }} /></Pressable>

              {isExpanded && (
                <View initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="px-3 pb-3 space-y-2 border-t border-white/5">
                  <View className="p-2 rounded-lg bg-white/5">
                    <Text className="text-white/60 text-xs">{report.content}</Text>
                  </View>
                  {report.status === "pending" ||
                  report.status === "reviewing" ? (
                    <View className="flex flex-wrap gap-2">
                      <Pressable onPress={() => handleAction(report.id, "dismiss")} disabled={isLoading === report.id} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 bg-white/5 transition-colors">
                        <XCircle size={12} /> Ignorer
                      </Pressable>
                      <Pressable onPress={() => handleAction(report.id, "warn")} disabled={isLoading === report.id} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-400 bg-amber-500/10 transition-colors">
                        <AlertTriangle size={12} /> Avertir
                      </Pressable>
                      <Pressable onPress={() => handleAction(report.id, "remove")} disabled={isLoading === report.id} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 bg-red-500/10 transition-colors">
                        <Ban size={12} /> Supprimer
                      </Pressable>
                      {report.status === "pending" && (
                        <Pressable onPress={() => onReview(report.id)} disabled={isLoading === report.id} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-400 bg-blue-500/10 transition-colors">
                          <Eye size={12} /> Examiner
                        </Pressable>
                      )}
                    </View>
                  ) : (
                    <Text className="text-xs text-white/30">
                      {report.status === "resolved"
                        ? "✅ Signalement résolu"
                        : "❌ Signalement rejeté"}
                    </Text>
                  )}
                </View>
              )}
            </View>
          );
        })}</View></View>
  );
}
