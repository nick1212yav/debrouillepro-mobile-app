import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { useNavigation } from "@react-navigation/native";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  Pill,
  Search,
  ShieldAlert,
  Stethoscope,
  Video,
  X,
} from "lucide-react-native";

import { DoctorCard } from "@/features/sante/components";
import { useDoctors, useAppointments } from "@/features/sante/hooks";
import type { Doctor, Appointment } from "@/features/sante/types";

type Tab = "medecins" | "rdv" | "medicaments" | "urgences";

type RootNavigation = {
  navigate: (
    screen: string,
    params?: {
      professionalId?: Id<"medicalProfessionals">;
    },
  ) => void;
  goBack: () => void;
};

const TABS: ReadonlyArray<{
  key: Tab;
  label: string;
  icon: string;
}> = [
  { key: "medecins", label: "Médecins", icon: "👨‍⚕️" },
  { key: "rdv", label: "Mes RDV", icon: "📅" },
  { key: "medicaments", label: "Médicaments", icon: "💊" },
  { key: "urgences", label: "Urgences", icon: "🚨" },
];

export default function SantePage() {
  const navigation = useNavigation<RootNavigation>();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  const [tab, setTab] = useState<Tab>("medecins");
  const [search, setSearch] = useState("");

  const { doctors, isLoading: doctorsLoading } = useDoctors({
    search: search.trim() || undefined,
  });

  const { appointments, isLoading: appointmentsLoading } = useAppointments();

  const emergencyCenters = useQuery(
    api.health.getNearbyEmergencyCenters,
    "skip",
  );

  const upcomingAppointments = useMemo(
    () =>
      (appointments ?? []).filter(
        (appointment: Appointment) => appointment.status === "scheduled",
      ),
    [appointments],
  );

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleDoctorPress = useCallback(
    (doctorId: Id<"medicalProfessionals">) => {
      navigation.navigate("SanteDetailPage", {
        professionalId: doctorId,
      });
    },
    [navigation],
  );

  const openEmergency = useCallback(() => {
    navigation.navigate("EmergencyPage");
  }, [navigation]);

  const openTelemedicine = useCallback(() => {
    navigation.navigate("TelemedicinePage");
  }, [navigation]);

  const callNumber = useCallback(async (number: string) => {
    const url = `tel:${number}`;

    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    }
  }, []);

  return (
    <View style={styles.screen}>
      <Header
        tab={tab}
        search={search}
        onBack={handleBack}
        onSearch={setSearch}
        onClearSearch={() => setSearch("")}
        onEmergency={openEmergency}
        onTabChange={setTab}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {tab === "medecins" && (
          <DoctorsTab
            doctors={doctors ?? []}
            isLoading={doctorsLoading}
            onDoctorPress={handleDoctorPress}
            onEmergency={openEmergency}
            onTelemedicine={openTelemedicine}
          />
        )}

        {tab === "rdv" && (
          <AppointmentsTab
            appointments={appointments ?? []}
            isLoading={appointmentsLoading || authLoading}
            isAuthenticated={isAuthenticated}
            onSignIn={() => navigation.navigate("SignIn")}
            onDoctorPress={handleDoctorPress}
            onTelemedicine={openTelemedicine}
          />
        )}

        {tab === "medicaments" && (
          <MedicationTab
            isAuthenticated={isAuthenticated}
            onOpenRecords={() => navigation.navigate("PrescriptionPage")}
          />
        )}

        {tab === "urgences" && (
          <EmergencyTab
            centers={emergencyCenters}
            onEmergency={openEmergency}
            onCall={callNumber}
          />
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>

      {tab === "medecins" && upcomingAppointments.length > 0 && (
        <UpcomingBar
          count={upcomingAppointments.length}
          onPress={() => setTab("rdv")}
        />
      )}
    </View>
  );
}

/* ============================================================================
 * HEADER
 * ========================================================================== */

function Header({
  tab,
  search,
  onBack,
  onSearch,
  onClearSearch,
  onEmergency,
  onTabChange,
}: {
  tab: Tab;
  search: string;
  onBack: () => void;
  onSearch: (value: string) => void;
  onClearSearch: () => void;
  onEmergency: () => void;
  onTabChange: (tab: Tab) => void;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.pressed,
          ]}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </Pressable>

        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Santé+</Text>

            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>SÉCURISÉ</Text>
            </View>
          </View>

          <Text style={styles.subtitle}>Soins · Rendez-vous · Urgences</Text>
        </View>

        <Pressable
          onPress={onEmergency}
          accessibilityRole="button"
          accessibilityLabel="Urgences"
          style={({ pressed }) => [
            styles.emergencyButton,
            pressed && styles.pressed,
          ]}
        >
          <ShieldAlert size={18} color="#FCA5A5" />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        {TABS.map((item) => {
          const active = tab === item.key;

          return (
            <Pressable
              key={item.key}
              onPress={() => onTabChange(item.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [
                styles.tab,
                active && styles.tabActive,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.tabIcon}>{item.icon}</Text>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {tab === "medecins" && (
        <View style={styles.searchBox}>
          <Search size={17} color="#64748B" />

          <TextInput
            value={search}
            onChangeText={onSearch}
            placeholder="Médecin, spécialité..."
            placeholderTextColor="#64748B"
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />

          {search.length > 0 && (
            <Pressable
              onPress={onClearSearch}
              accessibilityRole="button"
              accessibilityLabel="Effacer la recherche"
              hitSlop={10}
            >
              <X size={16} color="#94A3B8" />
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

/* ============================================================================
 * DOCTORS
 * ========================================================================== */

function DoctorsTab({
  doctors,
  isLoading,
  onDoctorPress,
  onEmergency,
  onTelemedicine,
}: {
  doctors: Doctor[];
  isLoading: boolean;
  onDoctorPress: (doctorId: Id<"medicalProfessionals">) => void;
  onEmergency: () => void;
  onTelemedicine: () => void;
}) {
  if (isLoading) {
    return <LoadingState label="Recherche des professionnels..." />;
  }

  return (
    <View style={styles.section}>
      <EmergencyBanner onPress={onEmergency} onTelemedicine={onTelemedicine} />

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>RÉSEAU DE SOINS</Text>

          <Text style={styles.sectionTitle}>Professionnels disponibles</Text>
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countText}>{doctors.length}</Text>
        </View>
      </View>

      {doctors.length === 0 ? (
        <EmptyState
          icon={<Stethoscope size={28} color="#64748B" />}
          title="Aucun professionnel trouvé"
          description="Aucun professionnel correspondant aux critères actuels n'est disponible."
        />
      ) : (
        <View style={styles.doctorList}>
          {doctors.map((doctor) => (
            <DoctorCard
              key={doctor._id}
              doctor={doctor}
              slots={[]}
              onSelect={() => onDoctorPress(doctor._id)}
              onBook={() => onDoctorPress(doctor._id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

/* ============================================================================
 * EMERGENCY BANNER
 * ========================================================================== */

function EmergencyBanner({
  onPress,
  onTelemedicine,
}: {
  onPress: () => void;
  onTelemedicine: () => void;
}) {
  return (
    <View style={styles.emergencyCard}>
      <View style={styles.emergencyCardGlow} />

      <View style={styles.emergencyHeader}>
        <View style={styles.emergencyIcon}>
          <AlertTriangle size={22} color="#FCA5A5" />
        </View>

        <View style={styles.emergencyCopy}>
          <Text style={styles.emergencyTitle}>Besoin d'aide médicale ?</Text>

          <Text style={styles.emergencyDescription}>
            En cas de danger vital, contactez immédiatement les services
            d'urgence locaux.
          </Text>
        </View>
      </View>

      <View style={styles.emergencyActions}>
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            styles.emergencyPrimary,
            pressed && styles.pressed,
          ]}
        >
          <ShieldAlert size={16} color="#FFFFFF" />
          <Text style={styles.emergencyPrimaryText}>Urgence</Text>
        </Pressable>

        <Pressable
          onPress={onTelemedicine}
          style={({ pressed }) => [
            styles.emergencySecondary,
            pressed && styles.pressed,
          ]}
        >
          <Video size={16} color="#FCA5A5" />
          <Text style={styles.emergencySecondaryText}>Téléconsultation</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ============================================================================
 * APPOINTMENTS
 * ========================================================================== */

function AppointmentsTab({
  appointments,
  isLoading,
  isAuthenticated,
  onSignIn,
  onDoctorPress,
  onTelemedicine,
}: {
  appointments: Appointment[];
  isLoading: boolean;
  isAuthenticated: boolean;
  onSignIn: () => void;
  onDoctorPress: (doctorId: Id<"medicalProfessionals">) => void;
  onTelemedicine: () => void;
}) {
  if (!isAuthenticated && !isLoading) {
    return (
      <EmptyState
        icon={<Calendar size={30} color="#64748B" />}
        title="Vos rendez-vous"
        description="Connectez-vous pour consulter vos rendez-vous médicaux."
        actionLabel="Se connecter"
        onAction={onSignIn}
      />
    );
  }

  if (isLoading) {
    return <LoadingState label="Chargement de vos rendez-vous..." />;
  }

  if (appointments.length === 0) {
    return (
      <View style={styles.section}>
        <SectionIntro
          eyebrow="AGENDA MÉDICAL"
          title="Mes rendez-vous"
          description="Vos rendez-vous confirmés apparaîtront ici."
        />

        <EmptyState
          icon={<Calendar size={28} color="#64748B" />}
          title="Aucun rendez-vous"
          description="Choisissez un professionnel et sélectionnez un créneau réellement disponible."
          actionLabel="Voir les médecins"
          onAction={onTelemedicine}
        />
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <SectionIntro
        eyebrow="AGENDA MÉDICAL"
        title="Mes rendez-vous"
        description={`${appointments.length} rendez-vous enregistré${
          appointments.length > 1 ? "s" : ""
        }`}
      />

      <View style={styles.appointmentList}>
        {appointments.map((appointment) => (
          <AppointmentCard
            key={appointment._id}
            appointment={appointment}
            onDoctorPress={onDoctorPress}
            onTelemedicine={onTelemedicine}
          />
        ))}
      </View>
    </View>
  );
}

function AppointmentCard({
  appointment,
  onDoctorPress,
  onTelemedicine,
}: {
  appointment: Appointment;
  onDoctorPress: (doctorId: Id<"medicalProfessionals">) => void;
  onTelemedicine: () => void;
}) {
  const isScheduled = appointment.status === "scheduled";
  const isVideo = appointment.type === "teleconsultation";

  const professionalId = (
    appointment as Appointment & {
      professionalId?: Id<"medicalProfessionals">;
    }
  ).professionalId;

  return (
    <View style={styles.appointmentCard}>
      <View style={styles.appointmentTop}>
        <View style={styles.appointmentIcon}>
          {isVideo ? (
            <Video size={19} color="#60A5FA" />
          ) : (
            <Activity size={19} color="#F87171" />
          )}
        </View>

        <View style={styles.appointmentMain}>
          <Text style={styles.appointmentDoctor} numberOfLines={1}>
            {appointment.doctorName}
          </Text>

          <Text style={styles.appointmentSpecialty}>
            {appointment.doctorSpecialty}
          </Text>
        </View>

        <StatusBadge status={appointment.status} />
      </View>

      <View style={styles.appointmentMeta}>
        <MetaItem
          icon={<Calendar size={14} color="#64748B" />}
          label={formatAppointmentDate(appointment.date)}
        />

        {getAppointmentTime(appointment) && (
          <MetaItem
            icon={<Clock size={14} color="#64748B" />}
            label={getAppointmentTime(appointment)}
          />
        )}

        <View style={styles.typeBadge}>
          {isVideo ? (
            <Video size={12} color="#60A5FA" />
          ) : (
            <MapPin size={12} color="#94A3B8" />
          )}

          <Text style={styles.typeBadgeText}>
            {isVideo ? "Téléconsultation" : "Cabinet"}
          </Text>
        </View>
      </View>

      {isScheduled && (
        <View style={styles.appointmentActions}>
          {isVideo && (
            <Pressable
              onPress={onTelemedicine}
              style={({ pressed }) => [
                styles.videoAction,
                pressed && styles.pressed,
              ]}
            >
              <Video size={15} color="#FFFFFF" />
              <Text style={styles.videoActionText}>Téléconsultation</Text>
            </Pressable>
          )}

          {professionalId && (
            <Pressable
              onPress={() => onDoctorPress(professionalId)}
              style={({ pressed }) => [
                styles.detailAction,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.detailActionText}>Professionnel</Text>
              <ChevronRight size={14} color="#94A3B8" />
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

function StatusBadge({ status }: { status: Appointment["status"] }) {
  const configuration =
    status === "scheduled"
      ? {
          label: "À venir",
          background: "rgba(34,197,94,0.12)",
          color: "#4ADE80",
        }
      : status === "completed"
        ? {
            label: "Terminé",
            background: "rgba(100,116,139,0.12)",
            color: "#94A3B8",
          }
        : {
            label: "Annulé",
            background: "rgba(239,68,68,0.12)",
            color: "#F87171",
          };

  return (
    <View
      style={[
        styles.statusBadge,
        { backgroundColor: configuration.background },
      ]}
    >
      <Text style={[styles.statusBadgeText, { color: configuration.color }]}>
        {configuration.label}
      </Text>
    </View>
  );
}

/* ============================================================================
 * MEDICATIONS
 * ========================================================================== */

function MedicationTab({
  isAuthenticated,
  onOpenRecords,
}: {
  isAuthenticated: boolean;
  onOpenRecords: () => void;
}) {
  return (
    <View style={styles.section}>
      <SectionIntro
        eyebrow="SUIVI MÉDICAL"
        title="Médicaments"
        description="Consultez vos prescriptions et votre suivi médical depuis les données enregistrées dans votre dossier."
      />

      <View style={styles.medicationCard}>
        <View style={styles.medicationIcon}>
          <Pill size={25} color="#FBBF24" />
        </View>

        <View style={styles.medicationCopy}>
          <Text style={styles.medicationTitle}>Carnet médical</Text>

          <Text style={styles.medicationDescription}>
            Aucun médicament fictif n'est affiché. Les traitements doivent
            provenir de votre dossier médical réel.
          </Text>
        </View>
      </View>

      <Pressable
        disabled={!isAuthenticated}
        onPress={onOpenRecords}
        style={({ pressed }) => [
          styles.primaryAction,
          !isAuthenticated && styles.disabledAction,
          pressed && isAuthenticated && styles.pressed,
        ]}
      >
        <Pill size={17} color="#FFFFFF" />

        <Text style={styles.primaryActionText}>
          {isAuthenticated
            ? "Ouvrir mon dossier médical"
            : "Connectez-vous pour accéder au dossier"}
        </Text>

        <ChevronRight size={17} color="#FFFFFF" />
      </Pressable>

      <View style={styles.integrityNotice}>
        <ShieldAlert size={16} color="#60A5FA" />

        <Text style={styles.integrityNoticeText}>
          Santé+ n'invente aucun traitement, dosage, stock ou prescription. Les
          informations médicales affichées doivent provenir du backend.
        </Text>
      </View>
    </View>
  );
}

/* ============================================================================
 * EMERGENCY
 * ========================================================================== */

type EmergencyCenter = {
  _id: string;
  name: string;
  address: string;
  phone: string;
  type: string;
  distance: number;
  open: boolean;
  latitude: number;
  longitude: number;
};

function EmergencyTab({
  centers,
  onEmergency,
  onCall,
}: {
  centers: EmergencyCenter[] | undefined;
  onEmergency: () => void;
  onCall: (number: string) => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.criticalCard}>
        <View style={styles.criticalIcon}>
          <ShieldAlert size={26} color="#FCA5A5" />
        </View>

        <Text style={styles.criticalTitle}>Urgence médicale</Text>

        <Text style={styles.criticalDescription}>
          Si une vie est en danger, contactez immédiatement les services
          d'urgence locaux. Santé+ ne remplace pas les secours.
        </Text>

        <Pressable
          onPress={onEmergency}
          style={({ pressed }) => [
            styles.criticalButton,
            pressed && styles.pressed,
          ]}
        >
          <AlertTriangle size={17} color="#FFFFFF" />
          <Text style={styles.criticalButtonText}>
            Ouvrir le centre d'urgence
          </Text>
        </Pressable>
      </View>

      <SectionIntro
        eyebrow="SECOURS À PROXIMITÉ"
        title="Centres d'urgence"
        description="Résultats provenant du backend Santé+."
      />

      {centers === undefined ? (
        <LoadingState label="Recherche des centres..." />
      ) : centers.length === 0 ? (
        <EmptyState
          icon={<MapPin size={28} color="#64748B" />}
          title="Aucun centre disponible"
          description="Aucun centre d'urgence géolocalisé n'a été retourné par le service."
        />
      ) : (
        <View style={styles.centerList}>
          {centers.map((center) => (
            <EmergencyCenterCard
              key={center._id}
              center={center}
              onCall={onCall}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function EmergencyCenterCard({
  center,
  onCall,
}: {
  center: EmergencyCenter;
  onCall: (number: string) => void;
}) {
  return (
    <View style={styles.centerCard}>
      <View style={styles.centerTop}>
        <View style={styles.centerIcon}>
          <Activity size={18} color="#F87171" />
        </View>

        <View style={styles.centerMain}>
          <Text style={styles.centerName} numberOfLines={2}>
            {center.name}
          </Text>

          <Text style={styles.centerType}>{center.type}</Text>
        </View>

        <View
          style={[
            styles.openBadge,
            center.open ? styles.openBadgeActive : styles.openBadgeClosed,
          ]}
        >
          <Text
            style={[
              styles.openBadgeText,
              center.open
                ? styles.openBadgeTextActive
                : styles.openBadgeTextClosed,
            ]}
          >
            {center.open ? "OUVERT" : "FERMÉ"}
          </Text>
        </View>
      </View>

      <View style={styles.centerAddress}>
        <MapPin size={14} color="#64748B" />

        <Text style={styles.centerAddressText} numberOfLines={2}>
          {center.address}
        </Text>
      </View>

      <View style={styles.centerFooter}>
        <Text style={styles.distanceText}>
          {formatDistance(center.distance)}
        </Text>

        <Pressable
          onPress={() => onCall(center.phone)}
          style={({ pressed }) => [
            styles.callButton,
            pressed && styles.pressed,
          ]}
        >
          <Phone size={15} color="#FFFFFF" />
          <Text style={styles.callButtonText}>Appeler</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ============================================================================
 * UPCOMING BAR
 * ========================================================================== */

function UpcomingBar({
  count,
  onPress,
}: {
  count: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.upcomingBar, pressed && styles.pressed]}
    >
      <View style={styles.upcomingIcon}>
        <Calendar size={16} color="#FFFFFF" />
      </View>

      <View style={styles.upcomingCopy}>
        <Text style={styles.upcomingTitle}>{count} rendez-vous à venir</Text>

        <Text style={styles.upcomingSubtitle}>Voir votre agenda médical</Text>
      </View>

      <ChevronRight size={18} color="#CBD5E1" />
    </Pressable>
  );
}

/* ============================================================================
 * SHARED
 * ========================================================================== */

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.sectionIntro}>
      <Text style={styles.sectionEyebrow}>{eyebrow}</Text>

      <Text style={styles.sectionTitle}>{title}</Text>

      <Text style={styles.sectionDescription}>{description}</Text>
    </View>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <View style={styles.loadingState}>
      <ActivityIndicator size="small" color="#60A5FA" />

      <Text style={styles.loadingText}>{label}</Text>
    </View>
  );
}

function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>{icon}</View>

      <Text style={styles.emptyTitle}>{title}</Text>

      <Text style={styles.emptyDescription}>{description}</Text>

      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [
            styles.emptyAction,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.emptyActionText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

function MetaItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View style={styles.metaItem}>
      {icon}
      <Text style={styles.metaText}>{label}</Text>
    </View>
  );
}

/* ============================================================================
 * DATA HELPERS
 * ========================================================================== */

function formatAppointmentDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getAppointmentTime(appointment: Appointment): string | null {
  const enriched = appointment as Appointment & {
    slotStart?: string;
    slotEnd?: string;
  };

  if (enriched.slotStart && enriched.slotEnd) {
    return `${enriched.slotStart} – ${enriched.slotEnd}`;
  }

  const date = new Date(appointment.date);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDistance(distance: number): string {
  if (!Number.isFinite(distance)) {
    return "Distance indisponible";
  }

  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }

  return `${distance.toFixed(1)} km`;
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
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 12,
    backgroundColor: "#080C19",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  titleBlock: {
    flex: 1,
    marginLeft: 12,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },

  subtitle: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 11,
    fontWeight: "600",
  },

  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.09)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.18)",
  },

  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#4ADE80",
  },

  liveBadgeText: {
    color: "#4ADE80",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  emergencyButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.10)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.22)",
  },

  tabs: {
    paddingTop: 14,
    paddingBottom: 3,
    gap: 8,
  },

  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  tabActive: {
    backgroundColor: "#DC2626",
    borderColor: "#EF4444",
  },

  tabIcon: {
    fontSize: 13,
  },

  tabLabel: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "700",
  },

  tabLabelActive: {
    color: "#FFFFFF",
  },

  searchBox: {
    height: 48,
    marginTop: 11,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  searchInput: {
    flex: 1,
    marginHorizontal: 10,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
    paddingVertical: 0,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },

  section: {
    gap: 14,
  },

  sectionIntro: {
    marginBottom: 2,
  },

  sectionEyebrow: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  sectionTitle: {
    marginTop: 4,
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
  },

  sectionDescription: {
    marginTop: 5,
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
  },

  emergencyCard: {
    overflow: "hidden",
    padding: 16,
    borderRadius: 23,
    backgroundColor: "rgba(127,29,29,0.24)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.28)",
  },

  emergencyCardGlow: {
    position: "absolute",
    width: 140,
    height: 140,
    top: -75,
    right: -50,
    borderRadius: 70,
    backgroundColor: "rgba(239,68,68,0.10)",
  },

  emergencyHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  emergencyIcon: {
    width: 43,
    height: 43,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.13)",
  },

  emergencyCopy: {
    flex: 1,
    marginLeft: 11,
  },

  emergencyTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  emergencyDescription: {
    marginTop: 4,
    color: "#94A3B8",
    fontSize: 11,
    lineHeight: 17,
  },

  emergencyActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },

  emergencyPrimary: {
    flex: 1,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 13,
    backgroundColor: "#DC2626",
  },

  emergencyPrimaryText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  emergencySecondary: {
    flex: 1,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  emergencySecondaryText: {
    color: "#CBD5E1",
    fontSize: 11,
    fontWeight: "800",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 3,
  },

  countBadge: {
    minWidth: 31,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59,130,246,0.12)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.18)",
  },

  countText: {
    color: "#60A5FA",
    fontSize: 11,
    fontWeight: "900",
  },

  doctorList: {
    gap: 11,
  },

  loadingState: {
    minHeight: 190,
    alignItems: "center",
    justifyContent: "center",
    gap: 11,
  },

  loadingText: {
    color: "#64748B",
    fontSize: 12,
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
    paddingVertical: 38,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  emptyTitle: {
    marginTop: 13,
    color: "#E2E8F0",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyDescription: {
    maxWidth: 310,
    marginTop: 6,
    color: "#64748B",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },

  emptyAction: {
    marginTop: 16,
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#2563EB",
  },

  emptyActionText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  appointmentList: {
    gap: 11,
  },

  appointmentCard: {
    padding: 15,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  appointmentTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  appointmentIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59,130,246,0.09)",
  },

  appointmentMain: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },

  appointmentDoctor: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  appointmentSpecialty: {
    marginTop: 3,
    color: "#EF4444",
    fontSize: 10,
    fontWeight: "700",
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },

  statusBadgeText: {
    fontSize: 8,
    fontWeight: "900",
  },

  appointmentMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 9,
    marginTop: 13,
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  metaText: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "600",
  },

  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: "rgba(59,130,246,0.09)",
  },

  typeBadgeText: {
    color: "#60A5FA",
    fontSize: 9,
    fontWeight: "700",
  },

  appointmentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 13,
  },

  videoAction: {
    minHeight: 37,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 11,
    backgroundColor: "#2563EB",
  },

  videoActionText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },

  detailAction: {
    minHeight: 37,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 10,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  detailActionText: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "700",
  },

  medicationCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 21,
    backgroundColor: "rgba(245,158,11,0.065)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.15)",
  },

  medicationIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245,158,11,0.10)",
  },

  medicationCopy: {
    flex: 1,
    marginLeft: 12,
  },

  medicationTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  medicationDescription: {
    marginTop: 5,
    color: "#94A3B8",
    fontSize: 11,
    lineHeight: 17,
  },

  primaryAction: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    borderRadius: 15,
    backgroundColor: "#2563EB",
  },

  primaryActionText: {
    flex: 1,
    marginHorizontal: 9,
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  disabledAction: {
    backgroundColor: "#1E293B",
  },

  integrityNotice: {
    flexDirection: "row",
    padding: 13,
    borderRadius: 16,
    backgroundColor: "rgba(59,130,246,0.055)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.12)",
  },

  integrityNoticeText: {
    flex: 1,
    marginLeft: 9,
    color: "#64748B",
    fontSize: 10,
    lineHeight: 16,
  },

  criticalCard: {
    alignItems: "center",
    padding: 20,
    borderRadius: 25,
    backgroundColor: "rgba(127,29,29,0.22)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.27)",
  },

  criticalIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.11)",
  },

  criticalTitle: {
    marginTop: 12,
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  criticalDescription: {
    maxWidth: 320,
    marginTop: 7,
    color: "#94A3B8",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },

  criticalButton: {
    minHeight: 45,
    width: "100%",
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 14,
    backgroundColor: "#DC2626",
  },

  criticalButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  centerList: {
    gap: 11,
  },

  centerCard: {
    padding: 15,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  centerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  centerIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.09)",
  },

  centerMain: {
    flex: 1,
    marginLeft: 10,
    marginRight: 7,
  },

  centerName: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  centerType: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 9,
    fontWeight: "700",
    textTransform: "capitalize",
  },

  openBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
  },

  openBadgeActive: {
    backgroundColor: "rgba(34,197,94,0.10)",
  },

  openBadgeClosed: {
    backgroundColor: "rgba(239,68,68,0.10)",
  },

  openBadgeText: {
    fontSize: 7,
    fontWeight: "900",
  },

  openBadgeTextActive: {
    color: "#4ADE80",
  },

  openBadgeTextClosed: {
    color: "#F87171",
  },

  centerAddress: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    marginTop: 12,
  },

  centerAddressText: {
    flex: 1,
    color: "#64748B",
    fontSize: 10,
    lineHeight: 15,
  },

  centerFooter: {
    marginTop: 13,
    paddingTop: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },

  distanceText: {
    color: "#60A5FA",
    fontSize: 10,
    fontWeight: "800",
  },

  callButton: {
    minHeight: 35,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 11,
    backgroundColor: "#2563EB",
  },

  callButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },

  upcomingBar: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 16,
    minHeight: 61,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderRadius: 19,
    backgroundColor: "#101827",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.20)",
  },

  upcomingIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
  },

  upcomingCopy: {
    flex: 1,
    marginLeft: 10,
  },

  upcomingTitle: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  upcomingSubtitle: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 9,
  },

  bottomSpace: {
    height: 30,
  },

  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },
});
