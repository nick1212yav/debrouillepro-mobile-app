import React, { useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  MapPin,
  Phone,
  Plus,
  Shield,
  X,
} from "lucide-react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
} from "@/lib/convex-auth-compat";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * ============================================================================
 * SÉCURITÉ PUBLIQUE — DÉBROUILLEPRO
 * ============================================================================
 *
 * Principes :
 *
 * 1. Aucun incident fictif.
 * 2. Aucun niveau de risque fictif.
 * 3. Aucun numéro d'urgence inventé.
 * 4. Aucun statut institutionnel simulé.
 * 5. Les signalements proviennent de Convex.
 * 6. Les mutations sont protégées côté serveur.
 * 7. Un signalement citoyen n'est jamais présenté comme une confirmation
 *    officielle d'une autorité.
 * 8. L'application ne remplace jamais les services publics d'urgence.
 * 9. Interface 100 % React Native.
 * 10. Aucun `className`, `div`, `window`, `document`, Router Web ou animation
 *     Framer Motion.
 */

/* ============================================================================
 * TYPES
 * ========================================================================== */

type Severity = "low" | "medium" | "high";

type Incident = {
  _id: Id<"securityIncidents">;
  _creationTime: number;
  type: string;
  location: string;
  severity: Severity;
  status: string;
  source?: "citizen_report";
  verified?: boolean;
};

type TabKey = "Incidents" | "Urgences" | "Zones";

type IncidentType = {
  label: string;
  value: string;
};

/* ============================================================================
 * CONFIGURATION
 * ========================================================================== */

/**
 * IMPORTANT :
 *
 * Le numéro d'urgence n'est volontairement PAS codé en dur.
 *
 * Il doit être fourni par une configuration validée :
 *
 * EXPO_PUBLIC_EMERGENCY_NUMBER=...
 *
 * avant d'être publié dans l'application.
 *
 * Tant qu'il n'est pas configuré, l'application affiche honnêtement
 * que le numéro n'est pas disponible dans sa configuration.
 */
const EMERGENCY_NUMBER =
  typeof process !== "undefined"
    ? (process.env.EXPO_PUBLIC_EMERGENCY_NUMBER?.trim() ?? "")
    : "";

const INCIDENT_TYPES: readonly IncidentType[] = [
  { label: "Accident", value: "Accident" },
  { label: "Agression", value: "Agression" },
  { label: "Vol", value: "Vol" },
  { label: "Incendie", value: "Incendie" },
  {
    label: "Trouble à l'ordre public",
    value: "Trouble à l'ordre public",
  },
  { label: "Disparition", value: "Disparition" },
  { label: "Vandalisme", value: "Vandalisme" },
  { label: "Danger routier", value: "Danger routier" },
  { label: "Danger électrique", value: "Danger électrique" },
  { label: "Catastrophe naturelle", value: "Catastrophe naturelle" },
  { label: "Autre", value: "Autre" },
];

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function severityColor(severity: Severity): string {
  switch (severity) {
    case "high":
      return "#EF4444";

    case "medium":
      return "#F59E0B";

    default:
      return "#10B981";
  }
}

function severityLabel(severity: Severity): string {
  switch (severity) {
    case "high":
      return "Élevé";

    case "medium":
      return "Modéré";

    default:
      return "Faible";
  }
}

function severityBackground(severity: Severity): string {
  switch (severity) {
    case "high":
      return "rgba(239,68,68,0.14)";

    case "medium":
      return "rgba(245,158,11,0.14)";

    default:
      return "rgba(16,185,129,0.14)";
  }
}

function isResolved(status: string): boolean {
  const normalized = status.trim().toLowerCase();

  return (
    normalized === "résolu" ||
    normalized === "resolu" ||
    normalized === "resolved"
  );
}

function formatIncidentDate(timestamp: number): string {
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return "Date indisponible";
  }

  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp));
  } catch {
    return "Date indisponible";
  }
}

/* ============================================================================
 * EMERGENCY CALL CARD
 * ========================================================================== */

function EmergencyCallCard() {
  const [calling, setCalling] = useState(false);

  const handleEmergencyCall = async () => {
    if (!EMERGENCY_NUMBER) {
      Alert.alert(
        "Numéro non configuré",
        "Le numéro officiel d'urgence n'est pas encore configuré dans cette version de l'application. Pour un danger immédiat, utilisez le service d'urgence officiellement communiqué dans votre zone.",
      );

      return;
    }

    const sanitizedNumber = EMERGENCY_NUMBER.replace(/[^\d+]/g, "");

    if (!sanitizedNumber) {
      Alert.alert(
        "Configuration invalide",
        "Le numéro d'urgence configuré n'est pas valide.",
      );

      return;
    }

    const url = `tel:${sanitizedNumber}`;

    setCalling(true);

    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert(
          "Appel indisponible",
          "Votre appareil ne permet pas de lancer automatiquement cet appel.",
        );

        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      console.error("[SECURITY] emergency call failed", error);

      Alert.alert(
        "Appel impossible",
        "Impossible d'ouvrir le service téléphonique sur cet appareil.",
      );
    } finally {
      setCalling(false);
    }
  };

  const configured = EMERGENCY_NUMBER.length > 0;

  return (
    <View style={styles.emergencyCard}>
      <View style={styles.emergencyIcon}>
        <Phone size={22} color="#FFFFFF" />
      </View>

      <Text style={styles.emergencyEyebrow}>SERVICE D'URGENCE</Text>

      <Text style={styles.emergencyTitle}>Danger immédiat ?</Text>

      <Text style={styles.emergencyDescription}>
        En cas de danger immédiat, privilégiez toujours le canal officiel
        d'urgence. Le signalement dans DébrouillePro ne remplace pas une
        intervention des services publics.
      </Text>

      {configured ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Appeler le service d'urgence"
          accessibilityHint="Ouvre le composeur téléphonique"
          disabled={calling}
          onPress={handleEmergencyCall}
          style={({ pressed }) => [
            styles.emergencyButton,
            calling && styles.emergencyButtonDisabled,
            pressed && !calling && styles.pressed,
          ]}
        >
          <Phone size={18} color="#FFFFFF" />

          <Text style={styles.emergencyButtonText}>
            {calling ? "Ouverture..." : "Appeler le service d'urgence"}
          </Text>
        </Pressable>
      ) : (
        <View style={styles.configurationNotice}>
          <Shield size={16} color="#FBBF24" />

          <Text style={styles.configurationNoticeText}>
            Numéro officiel non configuré. Aucune valeur fictive n'est affichée.
          </Text>
        </View>
      )}
    </View>
  );
}

/* ============================================================================
 * INCIDENT CARD
 * ========================================================================== */

function IncidentCard({ incident }: { incident: Incident }) {
  const color = severityColor(incident.severity);
  const resolved = isResolved(incident.status);

  return (
    <View style={styles.incidentCard}>
      <View
        style={[
          styles.incidentIcon,
          {
            backgroundColor: severityBackground(incident.severity),
          },
        ]}
      >
        {resolved ? (
          <CheckCircle2 size={18} color="#10B981" />
        ) : (
          <AlertTriangle size={18} color={color} />
        )}
      </View>

      <View style={styles.incidentMain}>
        <View style={styles.incidentHeader}>
          <Text style={styles.incidentType} numberOfLines={1}>
            {incident.type}
          </Text>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: resolved
                  ? "rgba(16,185,129,0.12)"
                  : "rgba(245,158,11,0.12)",
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color: resolved ? "#10B981" : "#F59E0B",
                },
              ]}
            >
              {incident.status}
            </Text>
          </View>
        </View>

        <View style={styles.locationRow}>
          <MapPin size={13} color="#94A3B8" />

          <Text style={styles.locationText} numberOfLines={2}>
            {incident.location}
          </Text>
        </View>

        <View style={styles.incidentMetaRow}>
          <View style={styles.severityRow}>
            <View
              style={[
                styles.severityDot,
                {
                  backgroundColor: color,
                },
              ]}
            />

            <Text style={styles.severityText}>
              Niveau {severityLabel(incident.severity)}
            </Text>
          </View>

          <Text style={styles.dateText}>
            {formatIncidentDate(incident._creationTime)}
          </Text>
        </View>

        <View style={styles.sourceBadge}>
          <Shield size={10} color="#64748B" />

          <Text style={styles.sourceBadgeText}>Signalement citoyen</Text>
        </View>
      </View>
    </View>
  );
}

/* ============================================================================
 * INCIDENT REPORT FORM
 * ========================================================================== */

function IncidentReportForm({ onClose }: { onClose: () => void }) {
  const createIncident = useMutation(api.civic.createSecurityIncident);

  const [incidentType, setIncidentType] = useState("");

  const [location, setLocation] = useState("");

  const [severity, setSeverity] = useState<Severity>("medium");

  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    incidentType.trim().length > 0 &&
    location.trim().length >= 3 &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    setSubmitting(true);

    try {
      const result = await createIncident({
        type: incidentType.trim(),
        location: location.trim(),
        severity,
      });

      if (!result.accepted) {
        throw new Error("Le serveur n'a pas accepté le signalement.");
      }

      Alert.alert(
        "Signalement enregistré",
        "Votre signalement citoyen a été enregistré par le système. Cela ne signifie pas qu'une autorité a été alertée ou qu'une intervention a été confirmée.",
        [
          {
            text: "OK",
            onPress: onClose,
          },
        ],
      );
    } catch (error) {
      console.error("[SECURITY] createSecurityIncident failed", error);

      const message =
        typeof error === "object" && error !== null && "data" in error
          ? String(
              (
                error as {
                  data?: unknown;
                }
              ).data ?? "",
            )
          : "";

      if (
        message.toLowerCase().includes("rate") ||
        message.toLowerCase().includes("trop")
      ) {
        Alert.alert(
          "Trop de signalements",
          "Trop de signalements ont été transmis récemment depuis ce compte. Veuillez patienter avant de réessayer.",
        );
      } else {
        Alert.alert(
          "Signalement non envoyé",
          "Le serveur n'a pas pu enregistrer le signalement. Aucun faux enregistrement n'a été créé.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.formCard}>
      <View style={styles.formHeader}>
        <View style={styles.formTitleContainer}>
          <View style={styles.formIcon}>
            <Shield size={17} color="#FCA5A5" />
          </View>

          <View style={styles.formTitleTextContainer}>
            <Text style={styles.formTitle}>Nouveau signalement</Text>

            <Text style={styles.formSubtitle}>
              Décrivez uniquement des faits dont vous avez connaissance.
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer le formulaire"
          onPress={onClose}
          style={({ pressed }) => [
            styles.closeButton,
            pressed && styles.pressed,
          ]}
        >
          <X size={18} color="#94A3B8" />
        </Pressable>
      </View>

      <Text style={styles.fieldLabel}>Type d'incident</Text>

      <View style={styles.choiceGrid}>
        {INCIDENT_TYPES.map((item) => {
          const selected = incidentType === item.value;

          return (
            <Pressable
              key={item.value}
              accessibilityRole="button"
              accessibilityState={{
                selected,
              }}
              onPress={() => setIncidentType(item.value)}
              style={({ pressed }) => [
                styles.choiceButton,
                selected && styles.choiceButtonSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.choiceText,
                  selected && styles.choiceTextSelected,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.fieldLabel}>Localisation</Text>

      <View style={styles.inputContainer}>
        <MapPin size={16} color="#64748B" />

        <TextInput
          value={location}
          onChangeText={setLocation}
          placeholder="Quartier, avenue, repère..."
          placeholderTextColor="#64748B"
          autoCapitalize="sentences"
          autoCorrect
          maxLength={180}
          editable={!submitting}
          style={styles.input}
        />
      </View>

      <Text style={styles.fieldLabel}>Niveau estimé</Text>

      <View style={styles.severityContainer}>
        {(["low", "medium", "high"] as const).map((value) => {
          const selected = severity === value;

          const color = severityColor(value);

          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{
                selected,
              }}
              onPress={() => setSeverity(value)}
              disabled={submitting}
              style={({ pressed }) => [
                styles.severityButton,
                {
                  borderColor: selected ? color : "rgba(255,255,255,0.08)",
                  backgroundColor: selected
                    ? severityBackground(value)
                    : "rgba(255,255,255,0.035)",
                },
                pressed && !submitting && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.severityDot,
                  {
                    backgroundColor: color,
                  },
                ]}
              />

              <Text
                style={[
                  styles.severityButtonText,
                  selected && {
                    color,
                  },
                ]}
              >
                {severityLabel(value)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.safetyNotice}>
        <AlertTriangle size={15} color="#FBBF24" />

        <Text style={styles.safetyNoticeText}>
          Un signalement dans l'application ne constitue pas une demande
          d'intervention d'urgence. En cas de danger immédiat, utilisez le canal
          officiel d'urgence.
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Transmettre le signalement"
        accessibilityState={{
          disabled: !canSubmit,
          busy: submitting,
        }}
        disabled={!canSubmit}
        onPress={handleSubmit}
        style={({ pressed }) => [
          styles.submitButton,
          !canSubmit && styles.submitButtonDisabled,
          pressed && canSubmit && styles.pressed,
        ]}
      >
        <Shield size={17} color="#FFFFFF" />

        <Text style={styles.submitButtonText}>
          {submitting
            ? "Transmission sécurisée..."
            : "Transmettre le signalement"}
        </Text>
      </Pressable>
    </View>
  );
}

/* ============================================================================
 * INCIDENTS TAB
 * ========================================================================== */

function IncidentsTab() {
  const incidents = useQuery(api.civic.listRecentIncidents, {});

  const [showForm, setShowForm] = useState(false);

  const typedIncidents = useMemo(
    () => (incidents ?? []) as Incident[],
    [incidents],
  );

  return (
    <View style={styles.section}>
      <Authenticated>
        {!showForm ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Signaler un incident"
            onPress={() => setShowForm(true)}
            style={({ pressed }) => [
              styles.reportButton,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.reportButtonIcon}>
              <Plus size={18} color="#FCA5A5" />
            </View>

            <View style={styles.reportButtonContent}>
              <Text style={styles.reportButtonTitle}>Signaler un incident</Text>

              <Text style={styles.reportButtonSubtitle}>
                Créer un signalement traçable
              </Text>
            </View>

            <ChevronRight size={18} color="#64748B" />
          </Pressable>
        ) : (
          <IncidentReportForm onClose={() => setShowForm(false)} />
        )}
      </Authenticated>

      <Unauthenticated>
        <View style={styles.authNotice}>
          <Shield size={18} color="#94A3B8" />

          <View style={styles.authNoticeContent}>
            <Text style={styles.authNoticeTitle}>Connexion requise</Text>

            <Text style={styles.authNoticeText}>
              Connectez-vous pour transmettre un signalement traçable.
            </Text>
          </View>
        </View>
      </Unauthenticated>

      <AuthLoading>
        <View style={styles.loadingCard}>
          <View style={styles.loadingCircle} />

          <View style={styles.loadingTextContainer}>
            <View style={styles.loadingLineLarge} />

            <View style={styles.loadingLineSmall} />
          </View>
        </View>
      </AuthLoading>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Signalements récents</Text>

          <Text style={styles.sectionSubtitle}>
            Signalements citoyens enregistrés
          </Text>
        </View>

        <Shield size={18} color="#64748B" />
      </View>

      {incidents === undefined ? (
        <View style={styles.loadingStack}>
          {[0, 1, 2].map((item) => (
            <View key={item} style={styles.loadingCard}>
              <View style={styles.loadingCircle} />

              <View style={styles.loadingTextContainer}>
                <View style={styles.loadingLineLarge} />

                <View style={styles.loadingLineSmall} />
              </View>
            </View>
          ))}
        </View>
      ) : typedIncidents.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <CheckCircle2 size={24} color="#10B981" />
          </View>

          <Text style={styles.emptyTitle}>Aucun signalement récent</Text>

          <Text style={styles.emptyText}>
            Aucun signalement citoyen récent n'est actuellement disponible.
          </Text>
        </View>
      ) : (
        <View style={styles.incidentList}>
          {typedIncidents.map((incident) => (
            <IncidentCard key={incident._id} incident={incident} />
          ))}
        </View>
      )}
    </View>
  );
}

/* ============================================================================
 * EMERGENCY TAB
 * ========================================================================== */

function EmergencyTab() {
  return (
    <View style={styles.section}>
      <EmergencyCallCard />

      <View style={styles.warningCard}>
        <AlertTriangle size={18} color="#FBBF24" />

        <View style={styles.warningContent}>
          <Text style={styles.warningTitle}>Priorité au canal officiel</Text>

          <Text style={styles.warningText}>
            DébrouillePro ne doit jamais être considéré comme un substitut aux
            services publics d'urgence. En cas de danger immédiat, utilisez le
            canal officiel disponible dans votre zone.
          </Text>
        </View>
      </View>

      <View style={styles.integrityCard}>
        <Shield size={18} color="#60A5FA" />

        <View style={styles.integrityContent}>
          <Text style={styles.integrityTitle}>Intégrité des informations</Text>

          <Text style={styles.integrityText}>
            Les coordonnées des services publics ne doivent être publiées
            qu'après validation par une source officielle. L'application
            n'invente aucune information d'urgence.
          </Text>
        </View>
      </View>
    </View>
  );
}

/* ============================================================================
 * ZONES TAB
 * ========================================================================== */

function ZonesTab() {
  return (
    <View style={styles.section}>
      <View style={styles.notConfiguredCard}>
        <View style={styles.notConfiguredIcon}>
          <MapPin size={22} color="#60A5FA" />
        </View>

        <Text style={styles.notConfiguredTitle}>Cartographie sécuritaire</Text>

        <Text style={styles.notConfiguredText}>
          Cette fonctionnalité attend une source officielle de données
          géographiques et sécuritaires.
        </Text>

        <Text style={styles.notConfiguredSecondary}>
          Aucune zone, aucun niveau de risque et aucune couleur de danger ne
          sont inventés côté client.
        </Text>

        <View style={styles.sourceRule}>
          <Shield size={15} color="#94A3B8" />

          <Text style={styles.sourceRuleText}>
            Source officielle requise avant publication.
          </Text>
        </View>
      </View>
    </View>
  );
}

/* ============================================================================
 * PAGE
 * ========================================================================== */

export default function SecuritePubliquePage({
  onBack,
}: {
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("Incidents");

  const tabs: ReadonlyArray<{
    key: TabKey;
    label: string;
    icon: typeof AlertTriangle;
  }> = [
    {
      key: "Incidents",
      label: "Incidents",
      icon: AlertTriangle,
    },
    {
      key: "Urgences",
      label: "Urgences",
      icon: Phone,
    },
    {
      key: "Zones",
      label: "Zones",
      icon: MapPin,
    },
  ];

  return (
    <View style={styles.screen}>
      {/* ------------------------------------------------------------------ */}
      {/* HEADER                                                             */}
      {/* ------------------------------------------------------------------ */}

      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <ArrowLeft size={19} color="#FFFFFF" />
        </Pressable>

        <View style={styles.headerText}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Sécurité Publique</Text>

            <View style={styles.integrityBadge}>
              <Shield size={9} color="#93C5FD" />

              <Text style={styles.integrityBadgeText}>SÉCURISÉ</Text>
            </View>
          </View>

          <Text style={styles.headerSubtitle}>
            Signaler · Informer · Protéger
          </Text>
        </View>

        <View style={styles.headerShield}>
          <Shield size={18} color="#60A5FA" />
        </View>
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* TABS                                                               */}
      {/* ------------------------------------------------------------------ */}

      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;

          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{
                selected: active,
              }}
              accessibilityLabel={tab.label}
              onPress={() => setActiveTab(tab.key)}
              style={({ pressed }) => [
                styles.tab,
                active && styles.tabActive,
                pressed && styles.pressed,
              ]}
            >
              <Icon size={15} color={active ? "#FFFFFF" : "#64748B"} />

              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* CONTENT                                                            */}
      {/* ------------------------------------------------------------------ */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === "Incidents" && <IncidentsTab />}

        {activeTab === "Urgences" && <EmergencyTab />}

        {activeTab === "Zones" && <ZonesTab />}
      </ScrollView>

      {/* ------------------------------------------------------------------ */}
      {/* FOOTER                                                             */}
      {/* ------------------------------------------------------------------ */}

      <View style={styles.footer}>
        <Shield size={13} color="#64748B" />

        <Text style={styles.footerText}>
          Signalements soumis aux contrôles du serveur. Aucune intervention
          officielle n'est simulée.
        </Text>
      </View>
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

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 14,
    gap: 12,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  headerText: {
    flex: 1,
  },

  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.4,
  },

  headerSubtitle: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 3,
  },

  integrityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(96,165,250,0.10)",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.18)",
  },

  integrityBadgeText: {
    color: "#93C5FD",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.6,
  },

  headerShield: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59,130,246,0.10)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.18)",
  },

  tabBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 4,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  tab: {
    flex: 1,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 11,
  },

  tabActive: {
    backgroundColor: "rgba(255,255,255,0.09)",
  },

  tabText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },

  tabTextActive: {
    color: "#FFFFFF",
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },

  section: {
    gap: 12,
  },

  reportButton: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(239,68,68,0.075)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.22)",
  },

  reportButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.10)",
  },

  reportButtonContent: {
    flex: 1,
    marginLeft: 12,
  },

  reportButtonTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  reportButtonSubtitle: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 3,
  },

  formCard: {
    padding: 15,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  formHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  formTitleContainer: {
    flexDirection: "row",
    flex: 1,
    gap: 10,
  },

  formTitleTextContainer: {
    flex: 1,
  },

  formIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.10)",
  },

  formTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  formSubtitle: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 3,
    lineHeight: 14,
  },

  closeButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  fieldLabel: {
    color: "#CBD5E1",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 4,
  },

  choiceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 10,
  },

  choiceButton: {
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  choiceButtonSelected: {
    backgroundColor: "rgba(239,68,68,0.12)",
    borderColor: "rgba(239,68,68,0.40)",
  },

  choiceText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "600",
  },

  choiceTextSelected: {
    color: "#FCA5A5",
  },

  inputContainer: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    marginBottom: 10,
  },

  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13,
    marginLeft: 9,
    paddingVertical: 10,
  },

  severityContainer: {
    flexDirection: "row",
    gap: 7,
    marginBottom: 12,
  },

  severityButton: {
    flex: 1,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
  },

  severityButtonText: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "700",
  },

  severityDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  safetyNotice: {
    flexDirection: "row",
    gap: 9,
    padding: 11,
    borderRadius: 13,
    backgroundColor: "rgba(245,158,11,0.07)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.15)",
    marginBottom: 12,
  },

  safetyNoticeText: {
    flex: 1,
    color: "#A1A1AA",
    fontSize: 10,
    lineHeight: 15,
  },

  submitButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 13,
    backgroundColor: "#DC2626",
  },

  submitButtonDisabled: {
    opacity: 0.45,
  },

  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 2,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  sectionSubtitle: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 3,
  },

  incidentList: {
    gap: 9,
  },

  incidentCard: {
    flexDirection: "row",
    padding: 13,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  incidentIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  incidentMain: {
    flex: 1,
    marginLeft: 11,
  },

  incidentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  incidentType: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },

  statusText: {
    fontSize: 9,
    fontWeight: "800",
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
    marginTop: 6,
  },

  locationText: {
    flex: 1,
    color: "#94A3B8",
    fontSize: 10,
    lineHeight: 15,
  },

  incidentMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 7,
  },

  severityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  severityText: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "600",
  },

  dateText: {
    color: "#475569",
    fontSize: 8,
    flexShrink: 1,
  },

  sourceBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  sourceBadgeText: {
    color: "#64748B",
    fontSize: 8,
    fontWeight: "600",
  },

  authNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 13,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  authNoticeContent: {
    flex: 1,
  },

  authNoticeTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  authNoticeText: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  loadingStack: {
    gap: 9,
  },

  loadingCard: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    padding: 13,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  loadingCircle: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  loadingTextContainer: {
    flex: 1,
    marginLeft: 11,
    gap: 8,
  },

  loadingLineLarge: {
    height: 9,
    width: "58%",
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  loadingLineSmall: {
    height: 7,
    width: "35%",
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 24,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16,185,129,0.09)",
    marginBottom: 10,
  },

  emptyTitle: {
    color: "#E2E8F0",
    fontSize: 13,
    fontWeight: "700",
  },

  emptyText: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 15,
    textAlign: "center",
    marginTop: 5,
  },

  emergencyCard: {
    padding: 16,
    borderRadius: 21,
    backgroundColor: "rgba(220,38,38,0.09)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.28)",
  },

  emergencyIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC2626",
    marginBottom: 13,
  },

  emergencyEyebrow: {
    color: "#FCA5A5",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  emergencyTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginTop: 5,
  },

  emergencyDescription: {
    color: "#A1A1AA",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 7,
  },

  emergencyButton: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 15,
    borderRadius: 14,
    backgroundColor: "#DC2626",
  },

  emergencyButtonDisabled: {
    opacity: 0.5,
  },

  emergencyButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  configurationNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    marginTop: 15,
    padding: 11,
    borderRadius: 13,
    backgroundColor: "rgba(245,158,11,0.07)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.15)",
  },

  configurationNoticeText: {
    flex: 1,
    color: "#A1A1AA",
    fontSize: 10,
    lineHeight: 15,
  },

  warningCard: {
    flexDirection: "row",
    gap: 10,
    padding: 13,
    borderRadius: 16,
    backgroundColor: "rgba(245,158,11,0.07)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.14)",
  },

  warningContent: {
    flex: 1,
  },

  warningTitle: {
    color: "#FDE68A",
    fontSize: 12,
    fontWeight: "800",
  },

  warningText: {
    color: "#A1A1AA",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },

  integrityCard: {
    flexDirection: "row",
    gap: 10,
    padding: 13,
    borderRadius: 16,
    backgroundColor: "rgba(59,130,246,0.06)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.13)",
  },

  integrityContent: {
    flex: 1,
  },

  integrityTitle: {
    color: "#BFDBFE",
    fontSize: 12,
    fontWeight: "800",
  },

  integrityText: {
    color: "#94A3B8",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },

  notConfiguredCard: {
    alignItems: "center",
    padding: 25,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  notConfiguredIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59,130,246,0.09)",
    marginBottom: 12,
  },

  notConfiguredTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  notConfiguredText: {
    color: "#94A3B8",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 7,
  },

  notConfiguredSecondary: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 15,
    textAlign: "center",
    marginTop: 7,
  },

  sourceRule: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 15,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  sourceRuleText: {
    color: "#94A3B8",
    fontSize: 9,
    fontWeight: "600",
  },

  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    backgroundColor: "#040710",
  },

  footerText: {
    color: "#475569",
    fontSize: 8,
    textAlign: "center",
  },
});
