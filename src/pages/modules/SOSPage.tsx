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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Picker } from "@react-native-picker/picker";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CheckCircle,
  ChevronRight,
  Clock,
  Flame,
  Heart,
  MapPin,
  Navigation,
  Phone,
  Plus,
  Send,
  Shield,
  Siren,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react-native";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
} from "@/lib/convex-auth-compat";
import { SignInButton } from "@/components/ui/signin.tsx";

interface SOSPageProps {
  onBack: () => void;
}

type Country =
  | "RDC"
  | "Sénégal"
  | "Côte d'Ivoire"
  | "Mali"
  | "Cameroun"
  | "Ghana";

type ActiveTab = "appels" | "alerte" | "checkin" | "carte";

interface EmergencyNumber {
  label: string;
  number: string;
  icon: "medical" | "police" | "fire" | "general" | "poison";
}

interface LocationState {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

const COUNTRIES: Country[] = [
  "RDC",
  "Sénégal",
  "Côte d'Ivoire",
  "Mali",
  "Cameroun",
  "Ghana",
];

/**
 * IMPORTANT :
 * Ces numéros constituent uniquement la configuration actuellement
 * présente dans l'ancien écran.
 *
 * Ils doivent être validés officiellement pour chaque territoire
 * avant une mise en production d'un service d'urgence.
 */
const EMERGENCY_NUMBERS: Record<Country, EmergencyNumber[]> = {
  RDC: [
    {
      label: "Ambulance",
      number: "12",
      icon: "medical",
    },
    {
      label: "Police",
      number: "112",
      icon: "police",
    },
    {
      label: "Pompiers",
      number: "118",
      icon: "fire",
    },
    {
      label: "FARDC",
      number: "0810000",
      icon: "general",
    },
    {
      label: "Anti-poison",
      number: "+243998105000",
      icon: "poison",
    },
  ],

  Sénégal: [
    {
      label: "SAMU",
      number: "15",
      icon: "medical",
    },
    {
      label: "Police",
      number: "17",
      icon: "police",
    },
    {
      label: "Pompiers",
      number: "18",
      icon: "fire",
    },
    {
      label: "Gendarmerie",
      number: "800002020",
      icon: "general",
    },
    {
      label: "Anti-poison",
      number: "+221338395000",
      icon: "poison",
    },
  ],

  "Côte d'Ivoire": [
    {
      label: "SAMU",
      number: "185",
      icon: "medical",
    },
    {
      label: "Police",
      number: "111",
      icon: "police",
    },
    {
      label: "Pompiers",
      number: "180",
      icon: "fire",
    },
    {
      label: "Gendarmerie",
      number: "170",
      icon: "general",
    },
    {
      label: "Anti-poison",
      number: "+2252722444712",
      icon: "poison",
    },
  ],

  Mali: [
    {
      label: "SAMU",
      number: "15",
      icon: "medical",
    },
    {
      label: "Police",
      number: "17",
      icon: "police",
    },
    {
      label: "Pompiers",
      number: "18",
      icon: "fire",
    },
    {
      label: "Gendarmerie",
      number: "19",
      icon: "general",
    },
    {
      label: "Anti-poison",
      number: "+22320225002",
      icon: "poison",
    },
  ],

  Cameroun: [
    {
      label: "SAMU",
      number: "15",
      icon: "medical",
    },
    {
      label: "Police",
      number: "17",
      icon: "police",
    },
    {
      label: "Pompiers",
      number: "18",
      icon: "fire",
    },
    {
      label: "Gendarmerie",
      number: "112",
      icon: "general",
    },
    {
      label: "Anti-poison",
      number: "+237222232147",
      icon: "poison",
    },
  ],

  Ghana: [
    {
      label: "Ambulance",
      number: "193",
      icon: "medical",
    },
    {
      label: "Police",
      number: "191",
      icon: "police",
    },
    {
      label: "Pompiers",
      number: "192",
      icon: "fire",
    },
    {
      label: "Général",
      number: "999",
      icon: "general",
    },
    {
      label: "Anti-poison",
      number: "+233302665401",
      icon: "poison",
    },
  ],
};

function getEmergencyIcon(type: EmergencyNumber["icon"], color: string) {
  switch (type) {
    case "medical":
      return <Heart size={20} color={color} />;
    case "police":
      return <Shield size={20} color={color} />;
    case "fire":
      return <Flame size={20} color={color} />;
    case "poison":
      return <Zap size={20} color={color} />;
    default:
      return <Users size={20} color={color} />;
  }
}

function getEmergencyColor(type: EmergencyNumber["icon"]) {
  switch (type) {
    case "medical":
      return "#ef4444";
    case "police":
      return "#3b82f6";
    case "fire":
      return "#f97316";
    case "poison":
      return "#10b981";
    default:
      return "#8b5cf6";
  }
}

function normalizePhoneNumber(value: string) {
  return value.replace(/[^\d+]/g, "");
}

async function callNumber(number: string) {
  const normalized = normalizePhoneNumber(number);

  if (!normalized) {
    toast.error("Numéro d'urgence invalide");
    return;
  }

  try {
    const supported = await Linking.canOpenURL(`tel:${normalized}`);

    if (!supported) {
      toast.error("Les appels téléphoniques ne sont pas disponibles");
      return;
    }

    await Linking.openURL(`tel:${normalized}`);
  } catch {
    toast.error("Impossible d'ouvrir l'appel téléphonique");
  }
}

function SOSInner({ onBack }: SOSPageProps) {
  const [country, setCountry] = useState<Country>("RDC");
  const [activeTab, setActiveTab] = useState<ActiveTab>("appels");

  const [sosPressing, setSosPressing] = useState(false);
  const [sosActivated, setSosActivated] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(3);

  const [checkedIn, setCheckedIn] = useState(false);

  const [alertMessage, setAlertMessage] = useState(
    "J'ai besoin d'aide. Merci de me contacter.",
  );

  const [location, setLocation] = useState<LocationState | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [showAddContact, setShowAddContact] = useState(false);

  const [contactForm, setContactForm] = useState({
    name: "",
    phone: "",
    relation: "",
  });

  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const contactsQuery = useQuery(api.utility.listEmergencyContacts, {});

  const addContact = useMutation(api.utility.addEmergencyContact);

  const deleteContact = useMutation(api.utility.deleteEmergencyContact);

  const contacts = contactsQuery ?? [];

  const numbers = useMemo(() => EMERGENCY_NUMBERS[country], [country]);

  const clearCountdown = useCallback(() => {
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearCountdown();
    };
  }, [clearCountdown]);

  const getLocation = useCallback(async () => {
    setLocationLoading(true);
    setLocationError(null);

    try {
      /**
       * Location native :
       * cette fonctionnalité nécessite expo-location.
       *
       * On charge dynamiquement le module afin que cette page
       * ne masque pas une erreur de localisation derrière une
       * API Web inexistante.
       */
      const Location = await import("expo-location");

      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        setLocationError("Autorisation de localisation refusée.");
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? undefined,
      });
    } catch {
      setLocationError("Impossible d'obtenir votre position.");
    } finally {
      setLocationLoading(false);
    }
  }, []);

  const startSOSPress = useCallback(() => {
    if (sosActivated || sosPressing) {
      return;
    }

    setSosPressing(true);
    setSosCountdown(3);

    let count = 3;

    countdownInterval.current = setInterval(() => {
      count -= 1;

      setSosCountdown(count);

      if (count <= 0) {
        clearCountdown();
        setSosPressing(false);
        setSosActivated(true);

        void getLocation();

        toast.success(
          "Mode SOS activé. Vérifiez les actions disponibles ci-dessous.",
        );
      }
    }, 1000);
  }, [clearCountdown, getLocation, sosActivated, sosPressing]);

  const cancelSOSPress = useCallback(() => {
    clearCountdown();
    setSosPressing(false);
    setSosCountdown(3);
  }, [clearCountdown]);

  const cancelSOS = useCallback(() => {
    clearCountdown();
    setSosPressing(false);
    setSosActivated(false);
    setSosCountdown(3);

    toast.success("Mode SOS désactivé");
  }, [clearCountdown]);

  const handleAddContact = useCallback(async () => {
    const name = contactForm.name.trim();
    const phone = contactForm.phone.trim();
    const relation = contactForm.relation.trim() || "Contact";

    if (!name) {
      toast.error("Veuillez saisir le nom du contact");
      return;
    }

    if (!phone) {
      toast.error("Veuillez saisir le numéro du contact");
      return;
    }

    if (name.length > 100) {
      toast.error("Nom trop long");
      return;
    }

    if (phone.length > 40) {
      toast.error("Numéro trop long");
      return;
    }

    try {
      await addContact({
        name,
        phone,
        relation,
        isPrimary: contacts.length === 0,
      });

      setContactForm({
        name: "",
        phone: "",
        relation: "",
      });

      setShowAddContact(false);

      toast.success("Contact d'urgence ajouté");
    } catch {
      toast.error("Impossible d'ajouter le contact");
    }
  }, [addContact, contactForm, contacts.length]);

  const handleDeleteContact = useCallback(
    async (id: Id<"emergencyContacts">) => {
      try {
        await deleteContact({ id });
        toast.success("Contact supprimé");
      } catch {
        toast.error("Impossible de supprimer le contact");
      }
    },
    [deleteContact],
  );

  const handleCheckIn = useCallback(async () => {
    /**
     * IMPORTANT :
     * Il n'existe pas encore dans le code fourni de mutation
     * Convex permettant de persister réellement le check-in.
     *
     * On ne prétend donc pas notifier les proches.
     */
    setCheckedIn(true);

    toast.success("Statut local enregistré");
  }, []);

  const handleResetCheckIn = useCallback(() => {
    setCheckedIn(false);
  }, []);

  const renderEmergencyNumbers = () => (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>NUMÉROS D'URGENCE — {country}</Text>

      <Text style={styles.warningText}>
        Vérifiez toujours le numéro officiel local avant le déploiement en
        production.
      </Text>

      {numbers.map((item) => {
        const color = getEmergencyColor(item.icon);

        return (
          <Pressable
            key={`${country}-${item.label}`}
            onPress={() => void callNumber(item.number)}
            accessibilityRole="button"
            accessibilityLabel={`Appeler ${item.label}, ${item.number}`}
            style={({ pressed }) => [
              styles.emergencyCard,
              {
                borderColor: `${color}35`,
                backgroundColor: `${color}12`,
              },
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[styles.emergencyIcon, { backgroundColor: `${color}20` }]}
            >
              {getEmergencyIcon(item.icon, color)}
            </View>

            <View style={styles.flex}>
              <Text style={styles.emergencyLabel}>{item.label}</Text>

              <Text style={[styles.emergencyNumber, { color }]}>
                {item.number}
              </Text>
            </View>

            <View style={[styles.callButton, { backgroundColor: color }]}>
              <Phone size={18} color="#ffffff" />
            </View>
          </Pressable>
        );
      })}
    </View>
  );

  const renderAlertTab = () => (
    <View style={styles.section}>
      <View style={styles.card}>
        <View style={styles.row}>
          <Navigation size={17} color="#60a5fa" />
          <Text style={styles.cardTitle}>Ma position GPS</Text>
        </View>

        {location ? (
          <View style={styles.successBox}>
            <View style={styles.row}>
              <CheckCircle size={16} color="#34d399" />
              <Text style={styles.successText}>Position obtenue</Text>
            </View>

            <Text style={styles.coordinates}>
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </Text>

            {location.accuracy !== undefined && (
              <Text style={styles.mutedSmall}>
                Précision estimée : {Math.round(location.accuracy)} m
              </Text>
            )}
          </View>
        ) : (
          <>
            {locationError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{locationError}</Text>
              </View>
            )}

            <Pressable
              onPress={() => void getLocation()}
              disabled={locationLoading}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.pressed,
                locationLoading && styles.disabledButton,
              ]}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color="#60a5fa" />
              ) : (
                <MapPin size={16} color="#60a5fa" />
              )}

              <Text style={styles.secondaryButtonText}>
                {locationLoading ? "Localisation..." : "Obtenir ma position"}
              </Text>
            </Pressable>
          </>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Send size={17} color="#fb923c" />
          <Text style={styles.cardTitle}>Message d'urgence</Text>
        </View>

        <TextInput
          value={alertMessage}
          onChangeText={setAlertMessage}
          placeholder="Décrivez votre situation..."
          placeholderTextColor="rgba(255,255,255,0.30)"
          multiline
          maxLength={1000}
          textAlignVertical="top"
          style={styles.textArea}
        />

        <Text style={styles.characterCount}>{alertMessage.length}/1000</Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Le message est préparé localement. Aucun envoi automatique n'est
            déclaré tant qu'une mutation serveur d'alerte n'est pas connectée.
          </Text>
        </View>
      </View>

      {renderContacts()}
    </View>
  );

  const renderContacts = () => (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <View style={styles.row}>
          <Users size={17} color="#c084fc" />
          <Text style={styles.cardTitle}>Contacts d'urgence</Text>
        </View>

        <Pressable
          onPress={() => setShowAddContact((value) => !value)}
          accessibilityRole="button"
          accessibilityLabel="Ajouter un contact d'urgence"
          style={styles.iconButton}
        >
          <Plus size={17} color="#c084fc" />
        </Pressable>
      </View>

      {showAddContact && (
        <View style={styles.form}>
          <TextInput
            value={contactForm.name}
            onChangeText={(value) =>
              setContactForm((current) => ({
                ...current,
                name: value,
              }))
            }
            placeholder="Nom"
            placeholderTextColor="rgba(255,255,255,0.30)"
            maxLength={100}
            style={styles.input}
          />

          <TextInput
            value={contactForm.phone}
            onChangeText={(value) =>
              setContactForm((current) => ({
                ...current,
                phone: value,
              }))
            }
            placeholder="Téléphone"
            placeholderTextColor="rgba(255,255,255,0.30)"
            keyboardType="phone-pad"
            maxLength={40}
            style={styles.input}
          />

          <TextInput
            value={contactForm.relation}
            onChangeText={(value) =>
              setContactForm((current) => ({
                ...current,
                relation: value,
              }))
            }
            placeholder="Relation — Famille, ami..."
            placeholderTextColor="rgba(255,255,255,0.30)"
            maxLength={60}
            style={styles.input}
          />

          <View style={styles.rowGap}>
            <Pressable
              onPress={() => setShowAddContact(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </Pressable>

            <Pressable
              onPress={() => void handleAddContact()}
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>Ajouter</Text>
            </Pressable>
          </View>
        </View>
      )}

      {contactsQuery === undefined ? (
        <ActivityIndicator size="small" color="#c084fc" style={styles.loader} />
      ) : contacts.length === 0 ? (
        <View style={styles.emptyBox}>
          <Users size={22} color="rgba(255,255,255,0.25)" />
          <Text style={styles.emptyText}>
            Aucun contact d'urgence enregistré.
          </Text>
        </View>
      ) : (
        <View style={styles.contactList}>
          {contacts.map((contact) => (
            <View key={contact._id} style={styles.contactRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {contact.name.trim().charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.flex}>
                <Text style={styles.contactName}>{contact.name}</Text>

                <Text style={styles.contactMeta}>
                  {contact.relation} · {contact.phone}
                </Text>
              </View>

              <View style={styles.contactActions}>
                <CheckCircle size={15} color="#34d399" />

                <Pressable
                  onPress={() => void handleDeleteContact(contact._id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Supprimer ${contact.name}`}
                  style={styles.deleteButton}
                >
                  <Trash2 size={14} color="#f87171" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderCheckInTab = () => (
    <View style={styles.section}>
      <View
        style={[
          styles.statusCard,
          checkedIn ? styles.statusSafe : styles.statusUnknown,
        ]}
      >
        <View
          style={[
            styles.statusIcon,
            checkedIn ? styles.statusIconSafe : styles.statusIconUnknown,
          ]}
        >
          {checkedIn ? (
            <CheckCircle size={34} color="#34d399" />
          ) : (
            <AlertTriangle size={34} color="#fb923c" />
          )}
        </View>

        <Text style={styles.statusTitle}>
          {checkedIn ? "Vous êtes en sécurité" : "Statut non confirmé"}
        </Text>

        <Text style={styles.statusDescription}>
          {checkedIn
            ? "Votre statut est enregistré sur cet appareil."
            : "Confirmez votre sécurité lorsque cela est nécessaire."}
        </Text>

        {checkedIn && (
          <View style={styles.row}>
            <Clock size={13} color="rgba(255,255,255,0.35)" />
            <Text style={styles.mutedSmall}>Statut actif</Text>
          </View>
        )}
      </View>

      {!checkedIn ? (
        <Pressable
          onPress={() => void handleCheckIn()}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
          ]}
        >
          <CheckCircle size={19} color="#ffffff" />
          <Text style={styles.primaryButtonText}>Je suis en sécurité</Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={handleResetCheckIn}
          style={({ pressed }) => [
            styles.outlineButton,
            pressed && styles.pressed,
          ]}
        >
          <X size={18} color="#ffffff" />
          <Text style={styles.outlineButtonText}>Réinitialiser le statut</Text>
        </Pressable>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Check-in automatique</Text>

        <Text style={styles.mutedText}>
          Ces options nécessitent encore un service serveur de planification
          avant de pouvoir être activées réellement.
        </Text>

        {[
          {
            label: "Chaque 6 heures",
            description: "Envoyer périodiquement votre statut",
          },
          {
            label: "À l'arrivée",
            description: "Déclencher selon une destination",
          },
          {
            label: "Pendant un voyage",
            description: "Associer le check-in à un déplacement",
          },
        ].map((item) => (
          <View key={item.label} style={styles.optionRow}>
            <View style={styles.flex}>
              <Text style={styles.optionTitle}>{item.label}</Text>

              <Text style={styles.optionDescription}>{item.description}</Text>
            </View>

            <View style={styles.disabledSwitch}>
              <View style={styles.disabledSwitchThumb} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderMapTab = () => (
    <View style={styles.section}>
      <View style={styles.card}>
        <View style={styles.row}>
          <MapPin size={17} color="#f87171" />
          <Text style={styles.cardTitle}>Localisation d'urgence</Text>
        </View>

        {location ? (
          <View style={styles.mapPlaceholder}>
            <MapPin size={38} color="#f87171" />

            <Text style={styles.mapTitle}>Votre position actuelle</Text>

            <Text style={styles.coordinates}>
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </Text>

            <Pressable
              onPress={() => void getLocation()}
              style={styles.secondaryButton}
            >
              <Navigation size={15} color="#60a5fa" />
              <Text style={styles.secondaryButtonText}>
                Actualiser la position
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.mapEmpty}>
            <MapPin size={34} color="rgba(255,255,255,0.25)" />

            <Text style={styles.emptyTitle}>Position non disponible</Text>

            <Text style={styles.mutedText}>
              Obtenez votre position GPS pour afficher une localisation fiable.
            </Text>

            <Pressable
              onPress={() => void getLocation()}
              style={styles.secondaryButton}
            >
              <Navigation size={15} color="#60a5fa" />
              <Text style={styles.secondaryButtonText}>
                Obtenir ma position
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Aucun hôpital, commissariat ou service de secours fictif n'est
          affiché. Les services proches devront provenir d'une source de données
          géographique vérifiée avant leur activation.
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={21} color="#ffffff" />
        </Pressable>

        <View style={styles.headerText}>
          <View style={styles.row}>
            <AlertTriangle size={19} color="#f87171" />

            <Text style={styles.headerTitle}>SOS & Urgences</Text>
          </View>

          <Text style={styles.headerSubtitle}>Assistance d'urgence</Text>
        </View>

        <View style={styles.countryPicker}>
          <Picker
            selectedValue={country}
            onValueChange={(value) => setCountry(value as Country)}
            dropdownIconColor="#ffffff"
            style={styles.picker}
          >
            {COUNTRIES.map((item) => (
              <Picker.Item key={item} label={item} value={item} />
            ))}
          </Picker>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {!sosActivated ? (
          <View style={styles.sosSection}>
            <Text style={styles.sosHint}>MAINTENEZ APPUYÉ 3 SECONDES</Text>

            <View style={styles.sosButtonWrapper}>
              <View
                style={[styles.sosRing, sosPressing && styles.sosRingActive]}
              />

              <Pressable
                onPressIn={startSOSPress}
                onPressOut={cancelSOSPress}
                accessibilityRole="button"
                accessibilityLabel="Maintenir pour activer le SOS"
                style={({ pressed }) => [
                  styles.sosButton,
                  sosPressing && styles.sosButtonPressed,
                  pressed && styles.sosButtonPressed,
                ]}
              >
                <Siren size={38} color="#ffffff" />

                <Text style={styles.sosText}>SOS</Text>

                {sosPressing && (
                  <Text style={styles.countdown}>{sosCountdown}</Text>
                )}
              </Pressable>
            </View>

            <Text style={styles.sosDescription}>
              Maintenez le bouton pendant 3 secondes. Le mode SOS sera activé et
              votre position pourra être récupérée.
            </Text>
          </View>
        ) : (
          <View style={styles.activeSOSSection}>
            <View style={styles.activeSOSCircle}>
              <Bell size={38} color="#ffffff" />

              <Text style={styles.activeSOSText}>SOS ACTIF</Text>
            </View>

            <View style={styles.activeSOSWarning}>
              <Text style={styles.activeSOSTitle}>Mode SOS activé</Text>

              <Text style={styles.activeSOSDescription}>
                Choisissez maintenant l'action réellement disponible : appeler
                les secours, obtenir votre position ou gérer vos contacts.
              </Text>
            </View>

            <Pressable
              onPress={cancelSOS}
              style={({ pressed }) => [
                styles.cancelSOSButton,
                pressed && styles.pressed,
              ]}
            >
              <X size={17} color="#ffffff" />
              <Text style={styles.cancelSOSText}>Désactiver le SOS</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.tabs}>
          {(
            [
              ["appels", "📞 Numéros"],
              ["alerte", "📍 Alerte"],
              ["checkin", "✅ Check-in"],
              ["carte", "🗺️ Carte"],
            ] as const
          ).map(([tab, label]) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        {activeTab === "appels" && renderEmergencyNumbers()}

        {activeTab === "alerte" && renderAlertTab()}

        {activeTab === "checkin" && renderCheckInTab()}

        {activeTab === "carte" && renderMapTab()}
      </ScrollView>
    </View>
  );
}

export default function SOSPage({ onBack }: SOSPageProps) {
  return (
    <>
      <Authenticated>
        <SOSInner onBack={onBack} />
      </Authenticated>

      <Unauthenticated>
        <View style={styles.authScreen}>
          <Pressable onPress={onBack} style={styles.authBackButton}>
            <ArrowLeft size={21} color="#ffffff" />
          </Pressable>

          <AlertTriangle size={52} color="#f87171" />

          <Text style={styles.authTitle}>
            Connectez-vous pour gérer vos contacts d'urgence
          </Text>

          <SignInButton />
        </View>
      </Unauthenticated>

      <AuthLoading>
        <View style={styles.loadingScreen}>
          <ActivityIndicator size="large" color="#f87171" />

          <Text style={styles.loadingText}>Chargement sécurisé...</Text>
        </View>
      </AuthLoading>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0a0004",
  },

  header: {
    minHeight: 88,
    paddingTop: 42,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(239,68,68,0.12)",
    backgroundColor: "rgba(10,0,4,0.96)",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  headerText: {
    flex: 1,
    marginLeft: 12,
  },

  headerTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },

  headerSubtitle: {
    marginTop: 2,
    color: "rgba(255,255,255,0.40)",
    fontSize: 11,
  },

  countryPicker: {
    width: 118,
    height: 44,
    overflow: "hidden",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  picker: {
    color: "#ffffff",
    height: 44,
  },

  content: {
    paddingBottom: 120,
  },

  sosSection: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 24,
  },

  sosHint: {
    color: "rgba(255,255,255,0.34)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 24,
  },

  sosButtonWrapper: {
    width: 190,
    height: 190,
    alignItems: "center",
    justifyContent: "center",
  },

  sosRing: {
    position: "absolute",
    width: 178,
    height: 178,
    borderRadius: 89,
    borderWidth: 2,
    borderColor: "rgba(239,68,68,0.20)",
  },

  sosRingActive: {
    width: 188,
    height: 188,
    borderRadius: 94,
    borderColor: "rgba(239,68,68,0.65)",
  },

  sosButton: {
    width: 142,
    height: 142,
    borderRadius: 71,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dc2626",
    borderWidth: 3,
    borderColor: "#f87171",
  },

  sosButtonPressed: {
    transform: [{ scale: 0.94 }],
  },

  sosText: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 3,
    marginTop: 2,
  },

  countdown: {
    position: "absolute",
    bottom: -28,
    color: "#f87171",
    fontSize: 28,
    fontWeight: "900",
  },

  sosDescription: {
    maxWidth: 330,
    marginTop: 22,
    color: "rgba(255,255,255,0.34)",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },

  activeSOSSection: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 22,
  },

  activeSOSCircle: {
    width: 142,
    height: 142,
    borderRadius: 71,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#b91c1c",
    borderWidth: 3,
    borderColor: "#ef4444",
  },

  activeSOSText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 6,
  },

  activeSOSWarning: {
    width: "100%",
    maxWidth: 420,
    marginTop: 18,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.35)",
    backgroundColor: "rgba(127,29,29,0.30)",
  },

  activeSOSTitle: {
    color: "#fca5a5",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 5,
  },

  activeSOSDescription: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 12,
    lineHeight: 18,
  },

  cancelSOSButton: {
    marginTop: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },

  cancelSOSText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },

  tabs: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 18,
  },

  tab: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: 5,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  tabActive: {
    backgroundColor: "rgba(220,38,38,0.28)",
    borderColor: "rgba(239,68,68,0.42)",
  },

  tabText: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 10,
    fontWeight: "700",
  },

  tabTextActive: {
    color: "#fca5a5",
  },

  section: {
    paddingHorizontal: 16,
    gap: 12,
  },

  sectionLabel: {
    color: "rgba(255,255,255,0.34)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 4,
  },

  warningText: {
    color: "rgba(251,191,36,0.65)",
    fontSize: 10,
    lineHeight: 15,
    marginBottom: 4,
  },

  emergencyCard: {
    minHeight: 78,
    borderRadius: 17,
    borderWidth: 1,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  emergencyIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  emergencyLabel: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },

  emergencyNumber: {
    marginTop: 3,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: 1,
  },

  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    padding: 16,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  cardTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  rowGap: {
    flexDirection: "row",
    gap: 8,
  },

  flex: {
    flex: 1,
  },

  successBox: {
    marginTop: 12,
    padding: 13,
    borderRadius: 12,
    backgroundColor: "rgba(16,185,129,0.10)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.20)",
  },

  successText: {
    color: "#6ee7b7",
    fontSize: 12,
    fontWeight: "700",
  },

  errorBox: {
    marginTop: 12,
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(239,68,68,0.10)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.20)",
  },

  errorText: {
    color: "#fca5a5",
    fontSize: 12,
    lineHeight: 18,
  },

  coordinates: {
    marginTop: 7,
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },

  mutedSmall: {
    marginTop: 5,
    color: "rgba(255,255,255,0.30)",
    fontSize: 10,
  },

  secondaryButton: {
    minHeight: 45,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.28)",
    backgroundColor: "rgba(59,130,246,0.12)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  secondaryButtonText: {
    color: "#93c5fd",
    fontSize: 12,
    fontWeight: "700",
  },

  textArea: {
    minHeight: 120,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(255,255,255,0.04)",
    color: "#ffffff",
    fontSize: 13,
    lineHeight: 19,
  },

  characterCount: {
    marginTop: 5,
    textAlign: "right",
    color: "rgba(255,255,255,0.25)",
    fontSize: 10,
  },

  infoBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(59,130,246,0.07)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.12)",
  },

  infoText: {
    color: "rgba(255,255,255,0.40)",
    fontSize: 10,
    lineHeight: 16,
  },

  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(168,85,247,0.12)",
  },

  form: {
    marginTop: 12,
    padding: 12,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    gap: 8,
  },

  input: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(255,255,255,0.04)",
    color: "#ffffff",
    fontSize: 13,
  },

  cancelButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  cancelButtonText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    fontWeight: "700",
  },

  addButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dc2626",
  },

  addButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },

  contactList: {
    marginTop: 12,
    gap: 8,
  },

  contactRow: {
    minHeight: 58,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(168,85,247,0.18)",
  },

  avatarText: {
    color: "#d8b4fe",
    fontSize: 13,
    fontWeight: "800",
  },

  contactName: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },

  contactMeta: {
    marginTop: 3,
    color: "rgba(255,255,255,0.35)",
    fontSize: 10,
  },

  contactActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  deleteButton: {
    padding: 7,
    borderRadius: 8,
    backgroundColor: "rgba(239,68,68,0.08)",
  },

  emptyBox: {
    minHeight: 100,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  emptyText: {
    color: "rgba(255,255,255,0.30)",
    fontSize: 11,
    textAlign: "center",
  },

  loader: {
    marginVertical: 20,
  },

  statusCard: {
    alignItems: "center",
    padding: 22,
    borderRadius: 18,
    borderWidth: 1,
  },

  statusSafe: {
    backgroundColor: "rgba(16,185,129,0.10)",
    borderColor: "rgba(16,185,129,0.25)",
  },

  statusUnknown: {
    backgroundColor: "rgba(249,115,22,0.08)",
    borderColor: "rgba(249,115,22,0.20)",
  },

  statusIcon: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  statusIconSafe: {
    backgroundColor: "rgba(16,185,129,0.20)",
  },

  statusIconUnknown: {
    backgroundColor: "rgba(249,115,22,0.18)",
  },

  statusTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },

  statusDescription: {
    maxWidth: 320,
    marginTop: 6,
    color: "rgba(255,255,255,0.42)",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },

  primaryButton: {
    minHeight: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 9,
    backgroundColor: "#059669",
  },

  primaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },

  outlineButton: {
    minHeight: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 9,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  outlineButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },

  mutedText: {
    marginTop: 7,
    color: "rgba(255,255,255,0.36)",
    fontSize: 11,
    lineHeight: 17,
  },

  optionRow: {
    minHeight: 58,
    marginTop: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  optionTitle: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },

  optionDescription: {
    marginTop: 3,
    color: "rgba(255,255,255,0.30)",
    fontSize: 10,
  },

  disabledSwitch: {
    width: 42,
    height: 24,
    borderRadius: 12,
    padding: 3,
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  disabledSwitchThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.28)",
  },

  mapPlaceholder: {
    minHeight: 230,
    marginTop: 12,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  mapTitle: {
    marginTop: 10,
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },

  mapEmpty: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  emptyTitle: {
    marginTop: 10,
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },

  pressed: {
    opacity: 0.78,
  },

  disabledButton: {
    opacity: 0.55,
  },

  authScreen: {
    flex: 1,
    backgroundColor: "#0a0004",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 16,
  },

  authBackButton: {
    position: "absolute",
    top: 48,
    left: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  authTitle: {
    maxWidth: 340,
    color: "#ffffff",
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "800",
    textAlign: "center",
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: "#0a0004",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  loadingText: {
    color: "rgba(255,255,255,0.40)",
    fontSize: 12,
  },
});
