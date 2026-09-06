import { UIService } from "@/core/sdk/ui/UIService";
import { View, Pressable, Text } from "react-native";
import {
  ArrowLeft,
  Shield,
  Lock,
  Eye,
  Database,
  Trash2,
  Download,
  Bell,
  UserX,
  Globe,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  MapPin,
  BarChart3,
  Mail,
  AlertTriangle,
  X,
} from "lucide-react-native";
import { useAppearance, ACCENT_PALETTES } from "@/hooks/use-appearance";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface PrivacyPageProps {
  onBack: () => void;
}

type PrivacySettings = {
  profilePublic: boolean;
  showEmail: boolean;
  shareActivity: boolean;
  analyticsConsent: boolean;
  locationServices: boolean;
  thirdPartyAds: boolean;
};

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-6">
      <View className="px-1 mb-2">
        <Text className="text-[10px] font-black text-white/30 uppercase tracking-[0.18em]">
          {title}
        </Text>

        {subtitle && (
          <Text className="text-[10px] text-white/20 mt-1">{subtitle}</Text>
        )}
      </View>

      <View
        className="rounded-[1.75rem] overflow-hidden"
        style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}
      >
        {children}
      </View>
    </View>
  );
}

function Row({
  icon: Icon,
  color,
  label,
  desc,
  action,
  danger = false,
  disabled = false,
}: {
  icon: React.ElementType;
  color: string;
  label: string;
  desc?: string;
  action?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <View
      className={`flex items-center gap-3 px-4 py-3.5 border-b last:border-0 ${
        disabled ? "opacity-45" : ""
      }`}
      style={{
        borderColor: "rgba(255,255,255,0.045)",
      }}
    >
      <View
        className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}16`, borderStyle: "solid" }}
      >
        <Icon size={17} style={{ color }} />
      </View>

      <View className="flex-1 min-w-0">
        <Text
          className="text-sm font-bold"
          style={{
            color: danger ? "#F87171" : "rgba(255,255,255,0.87)",
          }}
        >
          {label}
        </Text>

        {desc && (
          <Text className="text-[11px] text-white/30 mt-1 leading-relaxed">
            {desc}
          </Text>
        )}
      </View>

      {action}
    </View>
  );
}

function Toggle({
  on,
  onChange,
  color,
  label,
  disabled = false,
}: {
  on: boolean;
  onChange: (value: boolean) => void;
  color: string;
  label: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
     
      accessibilityRole="switch"
      aria-checked={on}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => onChange(!on)}
      className={`relative w-12 h-7 rounded-full shrink-0 transition-all active:scale-95 ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      }`}
      style={{ backgroundColor: on ? color : "rgba(255,255,255,0.11)" }}
    >
      <View
        className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-lg"
      />

      {on && (
        <View
          className="absolute left-1.5 top-1.5"
        >
          <CheckCircle2 size={10} className="text-white/70" />
        </View>
      )}
    </Pressable>
  );
}

function ActionRow({
  icon: Icon,
  iconColor,
  title,
  description,
  onClick,
  danger = false,
}: {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  description: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      type="button"
      onPress={onClick}
      className="w-full flex items-center gap-3 px-4 py-4 text-left border-b last:border-0"
      style={{
        borderColor: "rgba(255,255,255,0.045)",
      }}
    >
      <View
        className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${iconColor}16`, borderStyle: "solid" }}
      >
        <Icon size={17} style={{ color: iconColor }} />
      </View>

      <View className="flex-1 min-w-0">
        <Text
          className="text-sm font-bold"
          style={{
            color: danger ? "#F87171" : "rgba(255,255,255,0.86)",
          }}
        >
          {title}
        </Text>

        <Text className="text-[11px] text-white/30 mt-1 leading-relaxed">
          {description}
        </Text>
      </View>

      <ChevronRight size={16} className="text-white/20 shrink-0" />
    </Pressable>
  );
}

export default function PrivacyPage({ onBack }: PrivacyPageProps) {
  const { prefs } = useAppearance();

  const { hex, gradFrom, gradTo, glow } = ACCENT_PALETTES[prefs.accent];

  const privacySettings = useQuery(api.privacy.getPrivacySettings);
  const updatePrivacySetting = useMutation(api.privacy.updatePrivacySetting);
  const requestDataExport = useMutation(api.privacy.requestDataExport);
  const requestAccountDeletion = useMutation(
    api.privacy.requestAccountDeletion,
  );

  const [settings, setSettings] = useState<PrivacySettings>({
    profilePublic: true,
    showEmail: false,
    shareActivity: true,
    analyticsConsent: true,
    locationServices: true,
    thirdPartyAds: false,
  });

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingKey, setUpdatingKey] = useState<keyof PrivacySettings | null>(
    null,
  );

  useEffect(() => {
    if (!privacySettings) return;

    setSettings({
      profilePublic: privacySettings.profilePublic,
      showEmail: privacySettings.showEmail,
      shareActivity: privacySettings.shareActivity,
      analyticsConsent: privacySettings.analyticsConsent,
      locationServices: privacySettings.locationServices,
      thirdPartyAds: privacySettings.thirdPartyAds,
    });
  }, [privacySettings]);

  const toggle = async (key: keyof PrivacySettings, value: boolean) => {
    if (updatingKey) return;

    const previousValue = settings[key];

    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));
    setUpdatingKey(key);

    try {
      await updatePrivacySetting({ key, value });
      UIService.openToast("Préférence de confidentialité mise à jour", "success");
    } catch (error) {
      setSettings((previous) => ({
        ...previous,
        [key]: previousValue,
      }));

      console.error("updatePrivacySetting:", error);
      UIService.openToast("Impossible d'enregistrer cette préférence", "error");
    } finally {
      setUpdatingKey(null);
    }
  };

  const handleExport = async () => {
    if (exporting) return;

    setExporting(true);

    try {
      const result = await requestDataExport({});

      if (result.alreadyRequested) {
        UIService.openToast("Une demande d'export est déjà en cours.", "info");
      } else {
        UIService.openToast("Demande d'export enregistrée", "success");
      }
    } catch (error) {
      console.error("requestDataExport:", error);
      UIService.openToast("Impossible de demander l'export de tes données", "error");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;

    setDeleting(true);

    try {
      const result = await requestAccountDeletion({
        confirmation: "DELETE_ACCOUNT",
      });

      setShowDeleteDialog(false);

      if (result.alreadyRequested) {
        UIService.openToast("Une demande de suppression est déjà en cours.", "info");
      } else {
        UIService.openToast("Demande de suppression enregistrée", "error");
      }
    } catch (error) {
      console.error("requestAccountDeletion:", error);
      UIService.openToast("Impossible d'enregistrer la demande de suppression", "error");
    } finally {
      setDeleting(false);
    }
  };

  const enabledCount = Object.values(settings).filter(Boolean).length;

  return (
    <View
      className="flex flex-col h-full min-h-0 overflow-hidden text-white"
      style={{  }}
    >
      {/* HEADER */}
      <View
        className="flex items-center gap-3 px-5 pt-12 pb-4 shrink-0 border-b"
        style={{ borderColor: "rgba(255,255,255,0.07)", backgroundColor: "rgba(2,6,23,0.72)" }}
      >
        <Pressable
         
          onPress={onBack}
          accessibilityLabel="Retour"
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}
        >
          <ArrowLeft size={18} accessibilityElementsHidden={true} />
        </Pressable>

        <View className="flex-1 min-w-0">
          <Text className="text-lg font-black flex items-center gap-2">
            <Shield size={18} style={{ color: hex }} />
            Confidentialité & Sécurité
          </Text>

          <Text className="text-xs text-white/35 mt-0.5">
            Contrôle de tes données et de ta vie privée
          </Text>
        </View>

        <View
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black"
          style={{ backgroundColor: `${hex}12`, borderStyle: "solid" }}
        >
          <Lock size={11} />
          <Text>PRIVÉ</Text></View>
      </View>

      {/* CONTENT */}
      <View className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-5 py-5">
        <View className="max-w-3xl mx-auto pb-10">
          {/* HERO */}
          <View
            className="rounded-[2rem] p-5 sm:p-7 mb-6 relative overflow-hidden"
            style={{ borderStyle: "solid" }}
          >
            <View
              className="absolute -right-24 -top-28 w-72 h-72 rounded-full"
              style={{  }}
            />

            <View
              className="absolute -left-24 -bottom-32 w-64 h-64 rounded-full"
              style={{  }}
            />

            <View className="relative z-10">
              <View className="flex items-start justify-between gap-4">
                <View
                  className="w-16 h-16 rounded-[1.35rem] flex items-center justify-center shrink-0"
                  style={{  }}
                >
                  <Shield size={29} />
                </View>

                <View
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
                >
                  <Lock size={12} style={{ color: hex }} />

                  <Text className="text-[9px] font-black text-white/55">
                    TES DONNÉES
                  </Text>
                </View>
              </View>

              <Text
                className="text-[10px] font-black uppercase tracking-[0.22em] mt-7"
                style={{ color: hex }}
              >
                CONFIDENTIALITÉ
              </Text>

              <Text className="text-2xl sm:text-3xl font-black tracking-tight mt-1.5">
                Tes données.
                <br />
                <Text
                  style={{ WebkitBackgroundClip: "text", color: "transparent" }}
                >
                  Tes choix.
                </Text>
              </Text>

              <Text className="text-sm text-white/45 leading-relaxed mt-3 max-w-2xl">
                Tu gardes le contrôle sur la visibilité de ton profil, les
                services utilisés, les données de personnalisation et les
                demandes liées à ton compte.
              </Text>

              <View className="gap-2.5 mt-6">
                <View
                  className="rounded-2xl p-3"
                  style={{ backgroundColor: "rgba(255,255,255,0.045)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}
                >
                  <Lock size={16} style={{ color: hex }} />
                  <Text className="text-[10px] font-bold text-white/50 mt-2">
                    Sécurité
                  </Text>
                </View>

                <View
                  className="rounded-2xl p-3"
                  style={{ backgroundColor: "rgba(255,255,255,0.045)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}
                >
                  <Eye size={16} style={{ color: hex }} />
                  <Text className="text-[10px] font-bold text-white/50 mt-2">
                    Transparence
                  </Text>
                </View>

                <View
                  className="rounded-2xl p-3"
                  style={{ backgroundColor: "rgba(255,255,255,0.045)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}
                >
                  <UserX size={16} style={{ color: hex }} />
                  <Text className="text-[10px] font-bold text-white/50 mt-2">
                    Contrôle
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* PRIVACY SCORE */}
          <View
            className="rounded-[1.75rem] p-4 mb-6"
            style={{ backgroundColor: "rgba(255,255,255,0.035)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}
          >
            <View className="flex items-center gap-3">
              <View
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: `${hex}14` }}
              >
                <BarChart3 size={17} style={{ color: hex }} />
              </View>

              <View className="flex-1">
                <View className="flex justify-between gap-3">
                  <Text className="text-xs font-bold text-white/70">
                    Contrôle de confidentialité
                  </Text>

                  <Text className="text-xs font-black" style={{ color: hex }}>
                    {enabledCount}/6
                  </Text>
                </View>

                <View
                  className="h-1.5 rounded-full mt-2 overflow-hidden"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                >
                  <View
                    className="h-full rounded-full"
                    style={{  }}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* PROFILE */}
          <Section
            title="Visibilité du profil"
            subtitle="Décide de ce que les autres peuvent voir"
          >
            <Row
              icon={Globe}
              color="#3B82F6"
              label="Profil public"
              desc="Ton profil et tes publications peuvent être découverts."
              action={
                <Toggle
                  on={settings.profilePublic}
                  onChange={(v) => toggle("profilePublic", v)}
                  color={hex}
                  label="Profil public"
                  disabled={updatingKey !== null}
                />
              }
            />

            <Row
              icon={Eye}
              color="#8B5CF6"
              label="Afficher l'email"
              desc="Ton adresse devient visible selon tes connexions."
              action={
                <Toggle
                  on={settings.showEmail}
                  onChange={(v) => toggle("showEmail", v)}
                  color={hex}
                  label="Afficher l'email"
                  disabled={updatingKey !== null}
                />
              }
            />

            <Row
              icon={Bell}
              color="#F97316"
              label="Partager mon activité"
              desc="Tes abonnés peuvent voir tes activités récentes."
              action={
                <Toggle
                  on={settings.shareActivity}
                  onChange={(v) => toggle("shareActivity", v)}
                  color={hex}
                  label="Partager mon activité"
                  disabled={updatingKey !== null}
                />
              }
            />
          </Section>

          {/* DATA */}
          <Section
            title="Données & personnalisation"
            subtitle="Choisis comment Débrouille Pro peut améliorer ton expérience"
          >
            <Row
              icon={Database}
              color="#10B981"
              label="Améliorer Débrouille Pro"
              desc="Partager des données d'utilisation anonymisées pour améliorer l'application."
              action={
                <Toggle
                  on={settings.analyticsConsent}
                  onChange={(v) => toggle("analyticsConsent", v)}
                  color={hex}
                  label="Améliorer Débrouille Pro"
                  disabled={updatingKey !== null}
                />
              }
            />

            <Row
              icon={MapPin}
              color="#06B6D4"
              label="Services de localisation"
              desc="Utilisés pour la carte, les recherches proches et les alertes locales."
              action={
                <Toggle
                  on={settings.locationServices}
                  onChange={(v) => toggle("locationServices", v)}
                  color={hex}
                  label="Services de localisation"
                  disabled={updatingKey !== null}
                />
              }
            />

            <Row
              icon={Globe}
              color="#9CA3AF"
              label="Publicités personnalisées"
              desc="Permet d'adapter les contenus promotionnels à ton activité."
              action={
                <Toggle
                  on={settings.thirdPartyAds}
                  onChange={(v) => toggle("thirdPartyAds", v)}
                  color={hex}
                  label="Publicités personnalisées"
                  disabled={updatingKey !== null}
                />
              }
            />
          </Section>

          {/* RIGHTS */}
          <Section
            title="Tes données"
            subtitle="Exerce tes droits et gère tes informations"
          >
            <ActionRow
              icon={Download}
              iconColor="#3B82F6"
              title={
                exporting
                  ? "Enregistrement de ta demande…"
                  : "Exporter mes données"
              }
              description="Demande une copie de tes informations et contenus."
              onPress={handleExport}
            />

            <ActionRow
              icon={Mail}
              iconColor="#8B5CF6"
              title="Demander une assistance"
              description="Une question concernant tes données ? Notre équipe peut t'aider."
              onPress={() => UIService.openToast("Contacte privacy@debrouille.pro", "info")}
            />

            <ActionRow
              icon={Trash2}
              iconColor="#EF4444"
              title="Supprimer mon compte"
              description="Demande définitive de suppression de ton compte et de tes données."
              danger
              onPress={() => setShowDeleteDialog(true)}
            />
          </Section>

          {/* BLOCKED */}
          <Section
            title="Sécurité sociale"
            subtitle="Gère les personnes que tu ne souhaites plus voir interagir avec toi"
          >
            <ActionRow
              icon={UserX}
              iconColor="#F97316"
              title="Utilisateurs bloqués"
              description="Aucun utilisateur bloqué pour l'instant."
              onPress={() =>
                UIService.openToast("La gestion des blocages sera disponible ici.", "info")
              }
            />
          </Section>

          {/* SECURITY NOTICE */}
          <View
            className="rounded-[1.5rem] p-4 mb-5"
            style={{ backgroundColor: `${hex}0c`, borderStyle: "solid" }}
          >
            <View className="flex gap-3">
              <Sparkles
                size={17}
                style={{ color: hex }}
                className="shrink-0 mt-0.5"
              />

              <View>
                <Text className="text-xs font-bold text-white/65">
                  Ta confidentialité compte.
                </Text>

                <Text className="text-[11px] text-white/30 leading-relaxed mt-1">
                  Les préférences affichées ici contrôlent l'expérience côté
                  application. Les demandes liées à tes données peuvent
                  nécessiter une vérification avant traitement.
                </Text>
              </View>
            </View>
          </View>

          <Text className="text-center text-[10px] text-white/20 leading-relaxed px-4">
            Politique de confidentialité mise à jour le 1er juin 2025.
            <br />
            Débrouille Pro · Kolwezi, RDC
          </Text>
        </View>
      </View>

      {/* DELETE DIALOG */}
      <>
        {showDeleteDialog && (
          <Pressable
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.68)" }}
            onPress={() => setShowDeleteDialog(false)}
          >
            <Pressable
              onPress={(event) => event.stopPropagation()}
              className="w-full max-w-md rounded-[2rem] p-5"
              style={{ borderWidth: 1, borderColor: "rgba(248,113,113,.22)", borderStyle: "solid" }}
            >
              <View className="flex items-start justify-between gap-4">
                <View
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: "rgba(239,68,68,.12)" }}
                >
                  <AlertTriangle size={22} className="text-red-400" />
                </View>

                <Pressable
                  type="button"
                  onPress={() => setShowDeleteDialog(false)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "rgba(255,255,255,.05)" }}
                >
                  <X size={16} className="text-white/40" />
                </Pressable>
              </View>

              <Text className="text-xl font-black mt-5">
                Supprimer ton compte ?
              </Text>

              <Text className="text-sm text-white/40 leading-relaxed mt-2">
                <Text>Cette demande peut entraîner la suppression de ton profil, de tes contenus et des données associées selon les règles applicables.</Text></Text>

              <View
                className="rounded-2xl p-3 mt-4"
                style={{ backgroundColor: "rgba(239,68,68,.07)", borderWidth: 1, borderColor: "rgba(239,68,68,.13)", borderStyle: "solid" }}
              >
                <Text className="text-[11px] text-red-300/65 leading-relaxed">
                  <Text>Cette action est sensible. Vérifie que tu souhaites réellement supprimer ton compte avant de confirmer.</Text></Text>
              </View>

              <View className="gap-2.5 mt-5">
                <Pressable
                  type="button"
                  onPress={() => setShowDeleteDialog(false)}
                  className="h-11 rounded-2xl text-sm font-bold"
                  style={{ backgroundColor: "rgba(255,255,255,.06)", borderWidth: 1, borderColor: "rgba(255,255,255,.08)", borderStyle: "solid" }}
                >
                  <Text>Annuler</Text></Pressable>

                <Pressable
                  type="button"
                  onPress={handleDelete}
                  disabled={deleting}
                  className={`h-11 rounded-2xl text-sm font-black text-white ${
                    deleting
                      ? "opacity-60 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                  style={{  }}
                >
                  <Text>Confirmer</Text></Pressable>
              </View>
            </Pressable>
          </Pressable>
        )}
      </>
    </View>
  );
}
