import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, TextInput, ViewStyle, TextStyle, ImageStyle } from "react-native";
import { useState } from "react";
import {
  ArrowLeft, Bell, MessageCircle, Briefcase, Home, CreditCard,
  CheckCheck, Trash2, Package, Users, Leaf, Bus, Heart,
  ChevronRight, Pin, Settings2, Moon, X, ToggleLeft, ToggleRight,
  BellRing, Sparkles, LogIn,
} from "lucide-react-native";
import { useConvexAuth } from "@/lib/convex-auth-compat";
import { useNotifications, useNotificationsSeeder } from "@/hooks/use-notifications";
import type { Notif, NotifType } from "@/hooks/use-notifications";
import { Skeleton } from "@/components/ui/skeleton";
import { SignInButton } from "@/components/ui/signin";

// ── Config ────────────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<NotifType, { icon: React.ComponentType<{ size: number; style?: ViewStyle | TextStyle | ImageStyle; className?: string }>, color: string, bg: string }> = {
  message:   { icon: MessageCircle, color: "#3B82F6", bg: "rgba(59,130,246,0.15)" },
  job:       { icon: Briefcase,     color: "#8B5CF6", bg: "rgba(139,92,246,0.15)" },
  immo:      { icon: Home,          color: "#F97316", bg: "rgba(249,115,22,0.15)" },
  payment:   { icon: CreditCard,    color: "#10B981", bg: "rgba(16,185,129,0.15)" },
  system:    { icon: Bell,          color: "#9CA3AF", bg: "rgba(156,163,175,0.1)" },
  delivery:  { icon: Package,       color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
  sante:     { icon: Heart,         color: "#EF4444", bg: "rgba(239,68,68,0.15)" },
  agri:      { icon: Leaf,          color: "#22C55E", bg: "rgba(34,197,94,0.15)" },
  transport: { icon: Bus,           color: "#06B6D4", bg: "rgba(6,182,212,0.15)" },
  community: { icon: Users,         color: "#EC4899", bg: "rgba(236,72,153,0.15)" },
  like:      { icon: Heart,         color: "#EF4444", bg: "rgba(239,68,68,0.15)" },
  comment:   { icon: MessageCircle, color: "#3B82F6", bg: "rgba(59,130,246,0.15)" },
  follow:    { icon: Users,         color: "#8B5CF6", bg: "rgba(139,92,246,0.15)" },
  boost:     { icon: Bell,          color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
  event:     { icon: Bell,          color: "#6366F1", bg: "rgba(99,102,241,0.15)" },
  streak:    { icon: BellRing,      color: "#F97316", bg: "rgba(249,115,22,0.15)" },
  digest:    { icon: Sparkles,      color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
};

const MODULE_FILTERS = [
  { label: "Tout", types: null as NotifType[] | null },
  { label: "Messages", types: ["message"] as NotifType[] },
  { label: "Santé", types: ["sante"] as NotifType[] },
  { label: "Livraison", types: ["delivery"] as NotifType[] },
  { label: "Paiements", types: ["payment"] as NotifType[] },
  { label: "Jobs", types: ["job"] as NotifType[] },
  { label: "Agri", types: ["agri"] as NotifType[] },
  { label: "Transport", types: ["transport"] as NotifType[] },
];

const PREF_LABELS: Record<NotifType, string> = {
  message: "Messages", job: "Jobs / Pro", immo: "Immobilier", payment: "Paiements",
  system: "Système", delivery: "Livraison", sante: "Santé", agri: "Agriculture",
  transport: "Transport", community: "Communauté",
  like: "J'aime", comment: "Commentaires", follow: "Abonnements",
  boost: "Boosts", event: "Événements",
  streak: "Streak", digest: "Résumé quotidien",
};

// ── NotifCard ─────────────────────────────────────────────────────────────────
function NotifCard({ notif, onDismiss, onAction, onMarkRead, index }: {
  notif: Notif;
  index: number;
  onDismiss: () => void;
  onAction: (page: string) => void;
  onMarkRead: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TYPE_CONFIG[notif.type];
  const Icon = cfg.icon;

  const priorityBorder = notif.priority === "high" && !notif.read
    ? `1px solid ${cfg.color}40`
    : notif.read ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(255,255,255,0.1)";

  const priorityBg = notif.priority === "high" && !notif.read
    ? `${cfg.color}0D`
    : notif.read ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)";

  return (
    <View
    >
      <View className="rounded-3xl overflow-hidden" style={{ backgroundColor: priorityBg }}>
        {/* Priority stripe */}
        {notif.priority === "high" && !notif.read && (
          <View className="h-0.5 w-full" style={{  }} />
        )}
        <Pressable className="p-4" onPress={() => { onMarkRead(); setExpanded(v => !v); }}>
          <View className="flex items-start gap-3">
            {/* Icon */}
            <View className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm relative flex-shrink-0"
              style={{ backgroundColor: cfg.bg }}>
              {notif.initials ? (
                <>
                  <Text className="text-xs font-black" style={{ color: cfg.color }}>{notif.initials}</Text>
                  <View className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: cfg.bg, borderWidth: 1, borderColor: "rgba(0,0,0,0.4)", borderStyle: "solid" }}>
                    <Icon size={10} style={{ color: cfg.color }} />
                  </View>
                </>
              ) : (
                <Icon size={20} style={{ color: cfg.color }} />
              )}
            </View>

            <View className="flex-1 min-w-0 pr-3">
              <View className="flex items-center gap-2 mb-0.5">
                {notif.pinned && <Pin size={10} className="text-yellow-400 flex-shrink-0" />}
                <Text className={`text-sm font-bold truncate ${notif.read ? "text-white/60" : "text-white"}`}>{notif.title}</Text>
                {notif.priority === "high" && !notif.read && (
                  <Text className="flex-shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                )}
              </View>
              <Text className="text-white/45 text-xs leading-relaxed">{notif.body}</Text>
              <View className="flex items-center justify-between mt-1.5">
                <View className="flex items-center gap-2">
                  <Text className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${cfg.color}18`, color: cfg.color }}>{notif.module}</Text>
                  <Text className="text-white/20 text-[10px]">{notif.time}</Text>
                </View>
                {notif.amount && (
                  <Text className={`text-xs font-black ${notif.amount.startsWith("+") ? "text-green-400" : "text-red-400"}`}>
                    {notif.amount}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Inline action buttons (always visible for high-priority unread) */}
          {notif.actionButtons && (notif.priority === "high" || expanded) && (
            <>
              <View
                className="flex gap-2 mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)", }}>
                {notif.actionButtons.map(btn => (
                  <Pressable key={btn.label}
                    onPress={e => { onAction(notif.actionPage ?? "explorer"); UIService.openToast(`Action : ${btn.label}`, "success"); }}
                    className="flex-1 py-2 rounded-2xl text-xs font-bold flex items-center justify-center gap-1"
                    style={btn.variant === "primary"
                      ? { backgroundColor: cfg.bg, borderStyle: "solid" }
                      : { backgroundColor: "rgba(239,68,68,0.1)", borderWidth: 1, borderColor: "rgba(239,68,68,0.2)", borderStyle: "solid" }}>
                    {btn.label}
                    {btn.variant === "primary" && <ChevronRight size={11} />}
                  </Pressable>
                ))}
                <Pressable onPress={e => { onDismiss(); }}
                  className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(239,68,68,0.1)", borderWidth: 1, borderColor: "rgba(239,68,68,0.15)", borderStyle: "solid" }}>
                  <Trash2 size={13} className="text-red-400" />
                </Pressable>
              </View>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

// ── Preferences Panel ─────────────────────────────────────────────────────────
function PreferencesPanel({ onClose }: { onClose: () => void }) {
  const { prefs, updatePref, updateDnd } = useNotifications();
  return (
    <View
      className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.75)" }}>
      <View
        className="w-full rounded-t-3xl p-5 flex flex-col gap-4 overflow-y-auto"
        style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid", maxHeight: "85vh" }}>
        <View className="flex justify-center"><View className="w-10 h-1 rounded-full bg-white/20" /></View>
        <View className="flex items-center justify-between">
          <Text className="text-white font-black text-base flex items-center gap-2"><Settings2 size={16} className="text-purple-400" /> Préférences</Text>
          <Pressable onPress={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}>
            <X size={14} className="text-white/50" />
          </Pressable>
        </View>

        {/* DND */}
        <View className="rounded-2xl p-4 flex flex-col gap-3" style={{ backgroundColor: "rgba(139,92,246,0.08)", borderWidth: 1, borderColor: "rgba(139,92,246,0.2)", borderStyle: "solid" }}>
          <View className="flex items-center justify-between">
            <View className="flex items-center gap-2">
              <Moon size={15} className="text-purple-400" />
              <View>
                <Text className="text-white font-bold text-sm">Ne pas déranger</Text>
                <Text className="text-white/40 text-[11px]">Suspendre les alertes</Text>
              </View>
            </View>
            <Pressable onPress={() => updateDnd({ dndEnabled: !prefs.dndEnabled })} className="">
              {prefs.dndEnabled
                ? <ToggleRight size={26} className="text-purple-400" />
                : <ToggleLeft size={26} className="text-white/30" />}
            </Pressable>
          </View>
          {prefs.dndEnabled && (
            <View className="flex gap-3">
              {(["dndFrom", "dndTo"] as const).map(k => (
                <View key={k} className="flex-1">
                  <Text className="text-white/40 text-[10px] mb-1">{k === "dndFrom" ? "De" : "À"}</Text>
                  <TextInput value={prefs[k]} onChangeText={text => updateDnd({ [k]: text })}
                    className="w-full bg-white/08 text-white text-sm px-3 py-2 rounded-xl outline-none"
                    style={{ backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Per-type toggles */}
        <Text className="text-white/40 text-xs font-semibold uppercase tracking-wider">Notifications par module</Text>
        <View className="flex flex-col gap-2">
          {(Object.entries(PREF_LABELS) as [NotifType, string][]).map(([type, label]) => {
            const cfg = TYPE_CONFIG[type];
            const Icon = cfg.icon;
            return (
              <View key={type} className="flex items-center justify-between px-4 py-3 rounded-2xl"
                style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}>
                <View className="flex items-center gap-3">
                  <View className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: cfg.bg }}>
                    <Icon size={14} style={{ color: cfg.color }} />
                  </View>
                  <Text className="text-sm text-white">{label}</Text>
                </View>
                <Pressable onPress={() => updatePref(type, !prefs.enabled[type])} className="">
                  {prefs.enabled[type]
                    ? <ToggleRight size={24} style={{ color: cfg.color }} />
                    : <ToggleLeft size={24} className="text-white/25" />}
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ── Unauthenticated State ────────────────────────────────────────────────────
function UnauthenticatedState() {
  return (
    <View
      className="flex flex-col items-center justify-center py-20 gap-4 px-8 text-center"
    >
      <View className="w-16 h-16 rounded-3xl flex items-center justify-center"
        style={{ backgroundColor: "rgba(139,92,246,0.1)", borderWidth: 1, borderColor: "rgba(139,92,246,0.2)", borderStyle: "solid" }}>
        <LogIn size={28} className="text-purple-400" />
      </View>
      <Text className="text-white/50 text-sm font-medium">Connectez-vous pour voir vos notifications</Text>
      <SignInButton />
    </View>
  );
}

// ── Loading State ────────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <View className="flex flex-col gap-3 px-5 pt-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-3xl" />
      ))}
    </View>
  );
}

// ── Authenticated Content ────────────────────────────────────────────────────
function NotificationsContent({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { notifs, prefs, unreadTotal, markRead, markAllRead, dismiss } = useNotifications();
  useNotificationsSeeder();
  const [filterIdx, setFilterIdx] = useState(0);
  const [showPrefs, setShowPrefs] = useState(false);

  const filter = MODULE_FILTERS[filterIdx];
  const filtered = notifs.filter(n =>
    prefs.enabled[n.type] &&
    (filter.types === null || filter.types.includes(n.type))
  );

  const pinned = filtered.filter(n => n.pinned && !n.read);
  const important = filtered.filter(n => !n.pinned && n.priority === "high" && !n.read);
  const recent = filtered.filter(n => !n.pinned && !(n.priority === "high" && !n.read) && !n.read);
  const old = filtered.filter(n => n.read);

  const renderSection = (title: string, items: Notif[], accent?: string) => {
    if (items.length === 0) return null;
    return (
      <View key={title}>
        <View className="flex items-center gap-2 mb-2">
          {accent && <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />}
          <Text className="text-white/35 text-[11px] font-semibold uppercase tracking-wider">{title}</Text>
        </View>
        <View className="flex flex-col gap-2">
          {items.map((n, i) => (
            <NotifCard key={n.id} notif={n} index={i}
              onDismiss={() => dismiss(n.id)}
              onAction={page => { markRead(n.id); onNavigate(page); }}
              onMarkRead={() => markRead(n.id)}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <>
      {/* Sub-header with actions and filters */}
      <View className="px-5 pb-3 flex-shrink-0">
        <View className="flex items-center justify-between mb-3">
          <View>
            <View className="flex items-center gap-2">
              {unreadTotal > 0 && (
                <Text
                  className="px-2 py-0.5 rounded-full text-[11px] font-bold text-white"
                  style={{  }}>
                  {unreadTotal}
                </Text>
              )}
              <Text className="text-white/35 text-xs">{filtered.length} notification{filtered.length !== 1 ? "s" : ""}</Text>
            </View>
          </View>
          <View className="flex items-center gap-2">
            {unreadTotal > 0 && (
              <Pressable onPress={markAllRead} className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl"
                style={{ backgroundColor: "rgba(139,92,246,0.12)", borderWidth: 1, borderColor: "rgba(139,92,246,0.22)", borderStyle: "solid" }}>
                <CheckCheck size={12} className="text-purple-400" />
                <Text className="text-purple-400 text-xs font-semibold">Tout lire</Text>
              </Pressable>
            )}
            <Pressable onPress={() => setShowPrefs(true)}
              className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(255,255,255,0.07)" }}>
              <Settings2 size={15} className="text-white/50" />
            </Pressable>
          </View>
        </View>

        {/* DND banner */}
        {prefs.dndEnabled && (
          <View className="flex items-center gap-2 px-3 py-2 rounded-2xl mb-3"
            style={{ backgroundColor: "rgba(139,92,246,0.1)", borderWidth: 1, borderColor: "rgba(139,92,246,0.22)", borderStyle: "solid" }}>
            <Moon size={12} className="text-purple-400" />
            <Text className="text-xs text-purple-300 font-medium">Mode Ne pas déranger actif · {prefs.dndFrom}–{prefs.dndTo}</Text>
          </View>
        )}

        {/* Module filter tabs */}
        <View className="flex gap-2 overflow-x-auto pb-1" style={{  }}>
          {MODULE_FILTERS.map((f, i) => {
            const cnt = notifs.filter(n => !n.read && prefs.enabled[n.type] && (f.types === null || f.types.includes(n.type))).length;
            return (
              <Pressable key={f.label} onPress={() => setFilterIdx(i)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-semibold"
                style={{ backgroundColor: filterIdx === i ? "rgba(139,92,246,0.22)" : "rgba(255,255,255,0.06)", borderColor: "rgba(139,92,246,0.38)", borderStyle: "solid" }}>
                {f.label}
                {cnt > 0 && (
                  <Text className="w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                    style={{ backgroundColor: "#8B5CF6" }}>{cnt}</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 overflow-y-auto px-5 pt-4 pb-8 flex flex-col gap-5" style={{  }}>
        <>
          {filtered.length === 0 ? (
            <View className="flex flex-col items-center justify-center py-20 gap-4">
              <View className="w-16 h-16 rounded-3xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                <Bell size={28} className="text-white/20" />
              </View>
              <Text className="text-white/30 text-sm">Aucune notification</Text>
            </View>
          ) : (
            <>
              {renderSection("Épinglées", pinned, "#F59E0B")}
              {renderSection("Importantes", important, "#EF4444")}
              {renderSection("Récentes", recent)}
              {renderSection("Lues", old)}
            </>
          )}
        </>
      </View>

      {/* Preferences overlay */}
      <>
        {showPrefs && <PreferencesPanel onClose={() => setShowPrefs(false)} />}
      </>
    </>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
interface NotificationsPageProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

export default function NotificationsPage({ onBack, onNavigate }: NotificationsPageProps) {
  const { isAuthenticated, isLoading } = useConvexAuth();

  return (
    <View className="h-full w-full flex flex-col"
      style={{  }}>
      <View className="absolute top-0 right-0 w-64 h-64 rounded-full"
        style={{  }} />

      {/* Header */}
      <View className="px-5 pt-12 pb-3 flex-shrink-0" style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)", }}>
        <View className="flex items-center gap-3">
          <Pressable onPress={onBack} className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
            <ArrowLeft size={18} className="text-white" />
          </Pressable>
          <Text className="text-white font-bold text-lg">Notifications</Text>
        </View>
      </View>

      {/* Auth-aware content */}
      {isLoading ? (
        <LoadingState />
      ) : !isAuthenticated ? (
        <UnauthenticatedState />
      ) : (
        <NotificationsContent onNavigate={onNavigate} />
      )}
    </View>
  );
}
