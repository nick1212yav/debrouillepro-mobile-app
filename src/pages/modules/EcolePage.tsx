// src/pages/modules/EcolePage.tsx
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MessageSquare,
} from "lucide-react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
} from "@/lib/convex-auth-compat";

/* ════════════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════════════ */

interface EcolePageProps {
  onBack: () => void;
}

type TabKey = "notes" | "agenda" | "messages";

type TabDef = { key: TabKey; label: string };

/* ════════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ════════════════════════════════════════════════════════════════════════════ */

const T = {
  bg: "#020412",
  card: "rgba(255,255,255,0.035)",
  cardUp: "rgba(255,255,255,0.055)",
  border: "rgba(255,255,255,0.07)",
  borderUp: "rgba(255,255,255,0.055)",
  text: "#FFFFFF",
  dim: "rgba(255,255,255,0.45)",
  faint: "rgba(255,255,255,0.35)",
  ghost: "rgba(255,255,255,0.20)",
  amber: "#F59E0B",
  amberSoft: "#FCD34D",
  success: "#10B981",
} as const;

const TABS: TabDef[] = [
  { key: "notes", label: "Notes" },
  { key: "agenda", label: "Agenda" },
  { key: "messages", label: "Messages" },
];

/* ════════════════════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════════════════════ */

function alpha(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/* ════════════════════════════════════════════════════════════════════════════
   PRIMITIVES
   ════════════════════════════════════════════════════════════════════════════ */

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>{icon}</View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderIcon}>{icon}</View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.sectionHeaderTitle}>{title}</Text>
        <Text style={styles.sectionHeaderSubtitle}>{description}</Text>
      </View>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MESSAGES TAB
   ════════════════════════════════════════════════════════════════════════════ */

function MessagesLoading() {
  return (
    <View style={styles.messagesLoading}>
      <ActivityIndicator size="small" color={T.amber} />
      <Text style={styles.messagesLoadingText}>
        Chargement de tes messages scolaires…
      </Text>
    </View>
  );
}

function MessagesTab() {
  const messages = useQuery(api.localServices.listMySchoolMessages, {});
  const markRead = useMutation(api.localServices.markSchoolMessageRead);

  const [markingId, setMarkingId] = useState<string | null>(null);

  const handleOpenMessage = useCallback(
    async (messageId: string, read: boolean) => {
      if (read || markingId !== null) return;
      setMarkingId(messageId);
      try {
        await markRead({ messageId });
      } catch {
        /* silent — l'état de lecture reste inchangé */
      } finally {
        setMarkingId(null);
      }
    },
    [markRead, markingId],
  );

  if (messages === undefined) return <MessagesLoading />;

  if (messages.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare size={22} color={T.ghost} strokeWidth={2} />}
        title="Aucun message scolaire"
        description="Les communications provenant de ton école apparaîtront ici dès qu'elles seront disponibles."
      />
    );
  }

  return (
    <View>
      <View style={styles.messagesHead}>
        <Text style={styles.messagesCount}>
          {messages.length} {messages.length > 1 ? "messages" : "message"}
        </Text>
        <View style={styles.schoolPill}>
          <Text style={styles.schoolPillText}>École</Text>
        </View>
      </View>

      <View style={{ gap: 12 }}>
        {messages.map(
          (message: {
            _id: string;
            fromName: string;
            subject: string;
            read: boolean;
          }) => (
            <MessageRow
              key={message._id}
              message={message}
              isMarking={markingId === message._id}
              onPress={() => handleOpenMessage(message._id, message.read)}
            />
          ),
        )}
      </View>
    </View>
  );
}

function MessageRow({
  message,
  isMarking,
  onPress,
}: {
  message: {
    _id: string;
    fromName: string;
    subject: string;
    read: boolean;
  };
  isMarking: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const unread = !message.read;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.98,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
      }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`Message de ${message.fromName}: ${message.subject}`}
      >
        <View
          style={[
            styles.messageRow,
            unread && {
              backgroundColor: alpha(T.amber, 0.055),
              borderColor: alpha(T.amber, 0.15),
            },
          ]}
        >
          <View
            style={[
              styles.messageIcon,
              unread && { backgroundColor: alpha(T.amber, 0.13) },
            ]}
          >
            {isMarking ? (
              <ActivityIndicator size="small" color={T.amber} />
            ) : (
              <MessageSquare
                size={17}
                color={unread ? T.amber : T.dim}
                strokeWidth={2}
              />
            )}
          </View>

          <View style={{ flex: 1, marginLeft: 12, minWidth: 0 }}>
            <View style={styles.messageNameRow}>
              <Text
                numberOfLines={1}
                style={[styles.messageFrom, unread && { color: T.text }]}
              >
                {message.fromName}
              </Text>

              {unread && <View style={styles.unreadDot} />}
            </View>

            <Text numberOfLines={2} style={styles.messageSubject}>
              {message.subject}
            </Text>
          </View>

          {message.read ? (
            <CheckCircle2 size={16} color={T.success} strokeWidth={2} />
          ) : (
            <Clock3 size={15} color={T.faint} strokeWidth={2} />
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   NOTES / AGENDA — intentionally empty (no mock)
   ════════════════════════════════════════════════════════════════════════════ */

function NotesTab() {
  return (
    <View>
      <SectionHeader
        icon={<BookOpen size={18} color={T.amber} strokeWidth={2} />}
        title="Notes & résultats"
        description="Données scolaires personnelles"
      />

      <EmptyState
        icon={<BookOpen size={22} color={T.ghost} strokeWidth={2} />}
        title="Notes non disponibles"
        description="Aucune source vérifiée ne fournit actuellement tes matières, notes ou moyenne générale. Rien n'est inventé ici."
      />
    </View>
  );
}

function AgendaTab() {
  return (
    <View>
      <SectionHeader
        icon={<CalendarDays size={18} color={T.amber} strokeWidth={2} />}
        title="Agenda scolaire"
        description="Cours, examens et événements"
      />

      <EmptyState
        icon={<CalendarDays size={22} color={T.ghost} strokeWidth={2} />}
        title="Agenda non disponible"
        description="Aucun calendrier scolaire réel n'est actuellement fourni par le backend utilisé par cette page."
      />
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   AUTH STATES
   ════════════════════════════════════════════════════════════════════════════ */

function AuthRequiredState() {
  return (
    <EmptyState
      icon={<MessageSquare size={22} color={T.ghost} strokeWidth={2} />}
      title="Connexion requise"
      description="Connecte-toi pour accéder à tes communications scolaires personnelles."
    />
  );
}

function AuthLoadingState() {
  return (
    <View style={styles.authLoadingState}>
      <ActivityIndicator size="small" color={T.amber} />
      <Text style={styles.authLoadingText}>Vérification de la session…</Text>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MESSAGES SECTION (auth gates)
   ════════════════════════════════════════════════════════════════════════════ */

function MessagesSection() {
  return (
    <View>
      <SectionHeader
        icon={<MessageSquare size={18} color={T.amber} strokeWidth={2} />}
        title="Communications"
        description="Messages de ton établissement"
      />

      <AuthLoading>
        <AuthLoadingState />
      </AuthLoading>

      <Unauthenticated>
        <AuthRequiredState />
      </Unauthenticated>

      <Authenticated>
        <MessagesTab />
      </Authenticated>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   HEADER
   ════════════════════════════════════════════════════════════════════════════ */

function Header({ onBack }: EcolePageProps) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Retour"
        style={({ pressed }) => [
          styles.backBtn,
          {
            backgroundColor: pressed ? "rgba(255,255,255,0.11)" : T.cardUp,
            transform: [{ scale: pressed ? 0.94 : 1 }],
          },
        ]}
      >
        <ArrowLeft size={19} color="rgba(255,255,255,0.90)" strokeWidth={2.3} />
      </Pressable>

      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.headerTitle}>École & Vie scolaire</Text>
        <Text style={styles.headerSubtitle}>
          Inscrire · Suivre · Communiquer
        </Text>
      </View>

      <View style={styles.headerIcon}>
        <BookOpen size={17} color={T.amber} strokeWidth={2} />
      </View>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TAB BAR
   ════════════════════════════════════════════════════════════════════════════ */

function TabBar({
  activeTab,
  onChange,
}: {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
}) {
  return (
    <View style={styles.tabBar}>
      {TABS.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              styles.tabItem,
              active && styles.tabItemActive,
              { opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <Text
              style={[styles.tabLabel, { color: active ? T.text : T.faint }]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   DATA INTEGRITY NOTICE
   ════════════════════════════════════════════════════════════════════════════ */

function DataIntegrityNotice() {
  return (
    <View style={styles.notice}>
      <AlertCircle size={15} color={T.faint} strokeWidth={2} />
      <Text style={styles.noticeText}>
        Cette page affiche uniquement les informations réellement disponibles
        depuis les sources de données connectées.
      </Text>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════════════ */

export default function EcolePage({ onBack }: EcolePageProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("notes");

  return (
    <View style={styles.root}>
      <Header onBack={onBack} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Intro */}
        <View style={styles.intro}>
          <View style={styles.introEyebrow}>
            <View style={styles.introEyebrowDot} />
            <Text style={styles.introEyebrowText}>ESPACE SCOLAIRE</Text>
          </View>

          <Text style={styles.introTitle}>
            Ta vie scolaire,{"\n"}au même endroit.
          </Text>

          <Text style={styles.introSubtitle}>
            Notes, agenda et communications réunis dans une expérience mobile
            native.
          </Text>
        </View>

        <DataIntegrityNotice />

        <TabBar activeTab={activeTab} onChange={setActiveTab} />

        {/* Content */}
        <View style={styles.tabContent}>
          {activeTab === "notes" && <NotesTab />}
          {activeTab === "agenda" && <AgendaTab />}
          {activeTab === "messages" && <MessagesSection />}
        </View>

        {/* Footer status */}
        <View style={styles.footerStatus}>
          <View style={styles.footerDot} />
          <Text style={styles.footerText}>
            Données affichées depuis les sources connectées
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   STYLES
   ════════════════════════════════════════════════════════════════════════════ */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(2,6,23,0.96)",
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: T.text,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: T.faint,
    fontSize: 11,
    marginTop: 3,
    fontWeight: "600",
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(T.amber, 0.1),
    borderWidth: 1,
    borderColor: alpha(T.amber, 0.18),
  },

  /* Content */
  content: {
    paddingTop: 18,
    paddingBottom: 40,
  },

  /* Intro */
  intro: { paddingHorizontal: 20, marginBottom: 20 },
  introEyebrow: {
    flexDirection: "row",
    alignItems: "center",
  },
  introEyebrowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: T.amber,
  },
  introEyebrowText: {
    color: T.amberSoft,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    marginLeft: 8,
  },
  introTitle: {
    color: T.text,
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 30,
    letterSpacing: -0.6,
    marginTop: 10,
  },
  introSubtitle: {
    color: T.faint,
    fontSize: 12.5,
    lineHeight: 19,
    marginTop: 10,
    fontWeight: "600",
    maxWidth: 340,
  },

  /* Notice */
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: T.borderUp,
    gap: 12,
  },
  noticeText: {
    color: T.ghost,
    fontSize: 10.5,
    lineHeight: 16,
    flex: 1,
    fontWeight: "600",
  },

  /* Tab bar */
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 4,
    borderRadius: 16,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.borderUp,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabItemActive: {
    backgroundColor: "rgba(255,255,255,0.095)",
  },
  tabLabel: {
    fontSize: 11.5,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  /* Tab content */
  tabContent: { paddingHorizontal: 20 },

  /* Section header */
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(T.amber, 0.1),
    borderWidth: 1,
    borderColor: alpha(T.amber, 0.16),
  },
  sectionHeaderTitle: {
    color: T.text,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  sectionHeaderSubtitle: {
    color: T.faint,
    fontSize: 11,
    marginTop: 3,
    fontWeight: "600",
  },

  /* Empty state */
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
    borderRadius: 24,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.cardUp,
  },
  emptyTitle: {
    color: T.text,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 16,
    textAlign: "center",
    letterSpacing: -0.2,
  },
  emptyDescription: {
    color: T.faint,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    textAlign: "center",
    maxWidth: 320,
    fontWeight: "600",
  },

  /* Auth loading */
  authLoadingState: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
    borderRadius: 24,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  authLoadingText: {
    color: T.faint,
    fontSize: 12,
    marginTop: 12,
    fontWeight: "600",
  },

  /* Messages */
  messagesLoading: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
  },
  messagesLoadingText: {
    color: T.faint,
    fontSize: 12,
    marginTop: 12,
    fontWeight: "600",
  },
  messagesHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  messagesCount: {
    color: T.dim,
    fontSize: 12,
    fontWeight: "800",
  },
  schoolPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: alpha(T.amber, 0.09),
  },
  schoolPillText: {
    color: T.amberSoft,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.3,
  },

  /* Message row */
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 22,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  messageIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.cardUp,
  },
  messageNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  messageFrom: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "800",
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: T.amber,
    marginLeft: 8,
  },
  messageSubject: {
    color: T.dim,
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 5,
    fontWeight: "600",
  },

  /* Footer status */
  footerStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    marginHorizontal: 20,
    gap: 8,
  },
  footerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.success,
  },
  footerText: {
    color: T.ghost,
    fontSize: 10,
    fontWeight: "600",
  },
});
