// src/pages/modules/MedicalRecordPage.tsx

import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ArrowLeft,
  ChevronRight,
  FileText,
  Microscope,
  Pill,
  Syringe,
  TestTube,
} from "lucide-react-native";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { SignInButton } from "@/components/ui/signin";

type MedicalTab = "prescriptions" | "vaccinations" | "lab_results" | "imaging";

type MedicalRecord = {
  _id: string;
  title?: string;
  date?: string;
  doctor?: string;
  type?: string;
};

const TABS: Array<{
  key: MedicalTab;
  label: string;
  icon: typeof FileText;
}> = [
  {
    key: "prescriptions",
    label: "Ordonnances",
    icon: FileText,
  },
  {
    key: "vaccinations",
    label: "Vaccins",
    icon: Syringe,
  },
  {
    key: "lab_results",
    label: "Analyses",
    icon: TestTube,
  },
  {
    key: "imaging",
    label: "Imagerie",
    icon: Microscope,
  },
];

const TAB_DESCRIPTIONS: Record<MedicalTab, string> = {
  prescriptions:
    "Vos enregistrements médicaux disponibles dans cette catégorie.",
  vaccinations: "Vos enregistrements de vaccination disponibles.",
  lab_results: "Vos résultats d'analyses disponibles.",
  imaging: "Vos examens d'imagerie disponibles.",
};

function getRecordCategory(record: MedicalRecord): MedicalTab {
  const value = (record.type ?? "").toLowerCase();

  if (value.includes("vacc") || value.includes("immun")) {
    return "vaccinations";
  }

  if (
    value.includes("lab") ||
    value.includes("anal") ||
    value.includes("test")
  ) {
    return "lab_results";
  }

  if (
    value.includes("imag") ||
    value.includes("radio") ||
    value.includes("scan") ||
    value.includes("irm") ||
    value.includes("echo")
  ) {
    return "imaging";
  }

  return "prescriptions";
}

function formatRecordDate(value?: string): string | null {
  if (!value) return null;

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function MedicalRecordSkeleton() {
  return (
    <View style={styles.loadingList}>
      {[1, 2, 3].map((item) => (
        <View key={item} style={styles.skeletonCard}>
          <View style={styles.skeletonIcon} />

          <View style={styles.skeletonContent}>
            <View style={[styles.skeletonLine, styles.skeletonLineLarge]} />

            <View style={[styles.skeletonLine, styles.skeletonLineSmall]} />
          </View>

          <View style={styles.skeletonArrow} />
        </View>
      ))}
    </View>
  );
}

function EmptyRecords({ tab }: { tab: MedicalTab }) {
  const currentTab = TABS.find((item) => item.key === tab);

  const Icon = currentTab?.icon ?? FileText;

  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Icon size={30} color="#64748B" strokeWidth={1.7} />
      </View>

      <Text style={styles.emptyTitle}>Aucun enregistrement</Text>

      <Text style={styles.emptyDescription}>{TAB_DESCRIPTIONS[tab]}</Text>

      <Text style={styles.emptyPrivacy}>
        Aucun document fictif n'est affiché.
      </Text>
    </View>
  );
}

function RecordIcon({ tab }: { tab: MedicalTab }) {
  if (tab === "vaccinations") {
    return (
      <View style={[styles.recordIcon, styles.vaccineIcon]}>
        <Syringe size={18} color="#60A5FA" />
      </View>
    );
  }

  if (tab === "lab_results") {
    return (
      <View style={[styles.recordIcon, styles.labIcon]}>
        <TestTube size={18} color="#34D399" />
      </View>
    );
  }

  if (tab === "imaging") {
    return (
      <View style={[styles.recordIcon, styles.imagingIcon]}>
        <Microscope size={18} color="#A78BFA" />
      </View>
    );
  }

  return (
    <View style={[styles.recordIcon, styles.prescriptionIcon]}>
      <Pill size={18} color="#FB923C" />
    </View>
  );
}

function RecordCard({
  record,
  tab,
}: {
  record: MedicalRecord;
  tab: MedicalTab;
}) {
  const date = formatRecordDate(record.date);

  return (
    <Pressable
      onPress={() => {
        // Aucun écran de détail n'est ouvert ici,
        // car aucun contrat backend de détail n'a
        // été fourni dans la source.
      }}
      style={({ pressed }) => [
        styles.recordCard,
        pressed && styles.recordCardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Enregistrement ${record.title ?? "médical"}`}
    >
      <RecordIcon tab={tab} />

      <View style={styles.recordContent}>
        <Text style={styles.recordTitle} numberOfLines={2}>
          {record.title || "Enregistrement médical"}
        </Text>

        <View style={styles.recordMeta}>
          {date ? <Text style={styles.recordMetaText}>{date}</Text> : null}

          {date && record.doctor ? (
            <Text style={styles.recordSeparator}>·</Text>
          ) : null}

          {record.doctor ? (
            <Text style={styles.recordMetaText} numberOfLines={1}>
              {record.doctor}
            </Text>
          ) : null}
        </View>
      </View>

      <ChevronRight size={17} color="#334155" />
    </Pressable>
  );
}

function SecurityNotice() {
  return (
    <View style={styles.securityNotice}>
      <View style={styles.securityIndicator} />

      <View style={styles.securityContent}>
        <Text style={styles.securityTitle}>Dossier médical personnel</Text>

        <Text style={styles.securityDescription}>
          Cette section affiche uniquement les enregistrements retournés par
          votre compte. Aucun contenu médical n'est généré artificiellement.
        </Text>
      </View>
    </View>
  );
}

export default function MedicalRecordPage({ onBack }: { onBack: () => void }) {
  const { isAuthenticated, loading: authLoading } = useFirebaseAuth();

  const [activeTab, setActiveTab] = useState<MedicalTab>("prescriptions");

  const recordsQuery = useQuery(
    api.health.getMedicalRecords,
    isAuthenticated ? {} : "skip",
  );

  const records = useMemo(() => {
    if (!recordsQuery) {
      return [];
    }

    return recordsQuery as MedicalRecord[];
  }, [recordsQuery]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => getRecordCategory(record) === activeTab);
  }, [records, activeTab]);

  if (authLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#2563EB" />

        <Text style={styles.loadingTitle}>Chargement du dossier</Text>

        <Text style={styles.loadingDescription}>
          Vérification de votre session...
        </Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.authScreen}>
        <View style={styles.authIcon}>
          <FileText size={32} color="#60A5FA" />
        </View>

        <Text style={styles.authTitle}>Connexion requise</Text>

        <Text style={styles.authDescription}>
          Connectez-vous pour accéder à votre dossier médical personnel.
        </Text>

        <SignInButton />

        <Pressable onPress={onBack} style={styles.backLink}>
          <ArrowLeft size={15} color="#64748B" />

          <Text style={styles.backLinkText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={19} color="#FFFFFF" />
        </Pressable>

        <View style={styles.headerIdentity}>
          <Text style={styles.headerTitle}>Dossier médical</Text>

          <Text style={styles.headerSubtitle}>
            Vos enregistrements personnels
          </Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;

            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tab, active && styles.tabActive]}
                accessibilityRole="tab"
                accessibilityState={{
                  selected: active,
                }}
              >
                <Icon size={14} color={active ? "#FFFFFF" : "#64748B"} />

                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SecurityNotice />

        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>
              {TABS.find((item) => item.key === activeTab)?.label ?? "Dossier"}
            </Text>

            <Text style={styles.sectionDescription}>
              {TAB_DESCRIPTIONS[activeTab]}
            </Text>
          </View>

          {recordsQuery !== undefined ? (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{filteredRecords.length}</Text>
            </View>
          ) : null}
        </View>

        {recordsQuery === undefined ? (
          <MedicalRecordSkeleton />
        ) : filteredRecords.length === 0 ? (
          <EmptyRecords tab={activeTab} />
        ) : (
          <View style={styles.recordsList}>
            {filteredRecords.map((record) => (
              <RecordCard key={record._id} record={record} tab={activeTab} />
            ))}
          </View>
        )}

        <View style={styles.bottomNotice}>
          <Text style={styles.bottomNoticeTitle}>Informations médicales</Text>

          <Text style={styles.bottomNoticeText}>
            Les informations présentées dans ce dossier sont des données
            enregistrées dans votre compte. Elles ne constituent pas, à elles
            seules, un avis, un diagnostic ou une prescription médicale.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050812",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 13,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  headerIdentity: {
    flex: 1,
    marginLeft: 12,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  headerSubtitle: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 3,
  },

  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  tabScroll: {
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  tab: {
    minHeight: 39,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 13,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  tabActive: {
    backgroundColor: "rgba(37,99,235,0.25)",
    borderColor: "rgba(59,130,246,0.45)",
  },

  tabText: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "800",
  },

  tabTextActive: {
    color: "#FFFFFF",
  },

  scroll: {
    flex: 1,
  },

  content: {
    padding: 16,
    paddingBottom: 42,
  },

  securityNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    marginBottom: 18,
    borderRadius: 17,
    backgroundColor: "rgba(37,99,235,0.055)",
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.14)",
  },

  securityIndicator: {
    width: 8,
    height: 8,
    marginTop: 4,
    borderRadius: 99,
    backgroundColor: "#60A5FA",
  },

  securityContent: {
    flex: 1,
  },

  securityTitle: {
    color: "#DBEAFE",
    fontSize: 11,
    fontWeight: "900",
  },

  securityDescription: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  sectionHeaderText: {
    flex: 1,
    paddingRight: 10,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  sectionDescription: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  countBadge: {
    minWidth: 29,
    height: 29,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  countText: {
    color: "#CBD5E1",
    fontSize: 10,
    fontWeight: "900",
  },

  recordsList: {
    gap: 10,
  },

  recordCard: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  recordCardPressed: {
    opacity: 0.72,
  },

  recordIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
  },

  prescriptionIcon: {
    backgroundColor: "rgba(251,146,60,0.12)",
  },

  vaccineIcon: {
    backgroundColor: "rgba(96,165,250,0.12)",
  },

  labIcon: {
    backgroundColor: "rgba(52,211,153,0.12)",
  },

  imagingIcon: {
    backgroundColor: "rgba(167,139,250,0.12)",
  },

  recordContent: {
    flex: 1,
    marginHorizontal: 11,
  },

  recordTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
  },

  recordMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  recordMetaText: {
    maxWidth: "75%",
    color: "#64748B",
    fontSize: 9,
  },

  recordSeparator: {
    color: "#475569",
    fontSize: 9,
    marginHorizontal: 5,
  },

  loadingList: {
    gap: 10,
  },

  skeletonCard: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.055)",
  },

  skeletonIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  skeletonContent: {
    flex: 1,
    gap: 9,
    marginLeft: 11,
  },

  skeletonLine: {
    height: 9,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  skeletonLineLarge: {
    width: "78%",
  },

  skeletonLineSmall: {
    width: "45%",
  },

  skeletonArrow: {
    width: 17,
    height: 17,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  emptyState: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 45,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  emptyIcon: {
    width: 62,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.045)",
    marginBottom: 13,
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },

  emptyDescription: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 6,
  },

  emptyPrivacy: {
    color: "#475569",
    fontSize: 9,
    textAlign: "center",
    marginTop: 12,
  },

  bottomNotice: {
    marginTop: 15,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  bottomNoticeTitle: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "900",
  },

  bottomNoticeText: {
    color: "#475569",
    fontSize: 9,
    lineHeight: 15,
    marginTop: 4,
  },

  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    backgroundColor: "#050812",
  },

  loadingTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 13,
  },

  loadingDescription: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 5,
  },

  authScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: "#050812",
  },

  authIcon: {
    width: 70,
    height: 70,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "rgba(37,99,235,0.10)",
    marginBottom: 17,
  },

  authTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
    textAlign: "center",
  },

  authDescription: {
    color: "#64748B",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 7,
    marginBottom: 18,
  },

  backLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
    padding: 10,
  },

  backLinkText: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "700",
  },
});
