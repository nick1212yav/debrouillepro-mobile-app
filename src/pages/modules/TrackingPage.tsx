import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from "react-native";
import {
  AlertTriangle,
  ArrowLeft,
  Car,
  CheckCircle,
  Clock3,
  MapPin,
  Navigation,
  Package,
  Plus,
  Search,
  Smartphone,
  Trash2,
  X,
} from "lucide-react-native";
import { useMutation, useQuery } from "convex/react";

import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
} from "@/lib/convex-auth-compat";
import { SignInButton } from "@/components/ui/signin.tsx";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";

interface TrackingPageProps {
  onBack: () => void;
}

type TrackingType = "colis" | "vehicule" | "appareil" | "autre";

type TrackingIconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

type TrackingIconComponent = React.ComponentType<TrackingIconProps>;

interface TrackingVisual {
  icon: TrackingIconComponent;
  color: string;
  label: string;
}

interface TrackingItem {
  _id: Id<"trackingItems">;
  name: string;
  trackingId: string;
  type: string;
  status: string;
  progress: number;
  location?: string | null;
  notes?: string | null;
}

const TRACKING_VISUALS: Record<TrackingType, TrackingVisual> = {
  colis: {
    icon: Package,
    color: "#F97316",
    label: "Colis",
  },
  vehicule: {
    icon: Car,
    color: "#6366F1",
    label: "Véhicule",
  },
  appareil: {
    icon: Smartphone,
    color: "#10B981",
    label: "Appareil",
  },
  autre: {
    icon: Navigation,
    color: "#8B5CF6",
    label: "Objet",
  },
};

const MAX_NAME_LENGTH = 80;
const MAX_TRACKING_ID_LENGTH = 120;

function rgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");

  if (normalized.length !== 6) {
    return `rgba(255,255,255,${alpha})`;
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r},${g},${b},${alpha})`;
}

function getVisual(type: string): TrackingVisual {
  if (type in TRACKING_VISUALS) {
    return TRACKING_VISUALS[type as TrackingType];
  }

  return TRACKING_VISUALS.autre;
}

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Une erreur inattendue est survenue.";
}

interface AnimatedPressableProps {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

function AnimatedPressable({
  children,
  onPress,
  disabled = false,
  style,
  accessibilityLabel,
}: AnimatedPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.975,
      speed: 30,
      bounciness: 5,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  const pressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      speed: 24,
      bounciness: 7,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: disabled ? 0.45 : 1,
          transform: [{ scale }],
        },
      ]}
    >
      <Pressable
        disabled={disabled}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

function NativeSkeleton({ height = 76 }: { height?: number }) {
  const opacity = useRef(new Animated.Value(0.38)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.72,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.38,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          height,
          opacity,
        },
      ]}
    />
  );
}

function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.header}>
      <AnimatedPressable
        onPress={onBack}
        accessibilityLabel="Retour"
        style={styles.headerButton}
      >
        <ArrowLeft size={20} color="rgba(255,255,255,0.84)" strokeWidth={2.2} />
      </AnimatedPressable>

      <View style={styles.headerContent}>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {title}
        </Text>

        {subtitle ? (
          <Text numberOfLines={1} style={styles.headerSubtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right ?? <View style={styles.headerButtonPlaceholder} />}
    </View>
  );
}

function LoadingScreen({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Tracking"
        subtitle="Chargement de tes suivis"
        onBack={onBack}
      />

      <View style={styles.loadingContent}>
        <NativeSkeleton height={82} />
        <NativeSkeleton height={82} />
        <NativeSkeleton height={82} />
        <NativeSkeleton height={82} />
      </View>
    </View>
  );
}

function UnauthenticatedScreen({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Tracking"
        subtitle="Localiser · Suivre · Historiser"
        onBack={onBack}
      />

      <View style={styles.authEmpty}>
        <View style={styles.authIcon}>
          <Navigation size={36} color="#F97316" strokeWidth={1.8} />
        </View>

        <Text style={styles.authTitle}>Ton espace de suivi</Text>

        <Text style={styles.authDescription}>
          Connecte-toi pour enregistrer et consulter tes colis, véhicules,
          appareils et autres objets.
        </Text>

        <SignInButton />
      </View>
    </View>
  );
}

function ProgressBar({ progress, color }: { progress: number; color: string }) {
  const safeProgress = clampProgress(progress);

  return (
    <View
      style={[
        styles.progressTrack,
        {
          backgroundColor: rgba(color, 0.1),
        },
      ]}
    >
      <View
        style={[
          styles.progressFill,
          {
            width: `${safeProgress}%`,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

function StatusBadge({ status, color }: { status: string; color: string }) {
  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor: rgba(color, 0.1),
          borderColor: rgba(color, 0.18),
        },
      ]}
    >
      <View
        style={[
          styles.statusDot,
          {
            backgroundColor: color,
          },
        ]}
      />

      <Text
        numberOfLines={1}
        style={[
          styles.statusText,
          {
            color,
          },
        ]}
      >
        {status}
      </Text>
    </View>
  );
}

function TrackingCard({
  item,
  index,
  onPress,
}: {
  item: TrackingItem;
  index: number;
  onPress: () => void;
}) {
  const visual = getVisual(item.type);
  const Icon = visual.icon;

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        delay: Math.min(index * 55, 300),
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 420,
        delay: Math.min(index * 55, 300),
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [index, opacity, translateY]);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
      }}
    >
      <AnimatedPressable
        onPress={onPress}
        accessibilityLabel={`Ouvrir le suivi ${item.name}`}
        style={styles.trackingCard}
      >
        <View style={styles.cardTopRow}>
          <View
            style={[
              styles.itemIcon,
              {
                backgroundColor: rgba(visual.color, 0.11),
              },
            ]}
          >
            <Icon size={20} color={visual.color} strokeWidth={2} />
          </View>

          <View style={styles.itemIdentity}>
            <Text numberOfLines={1} style={styles.itemName}>
              {item.name}
            </Text>

            <View style={styles.trackingNumberRow}>
              <Clock3
                size={11}
                color="rgba(255,255,255,0.30)"
                strokeWidth={2}
              />

              <Text numberOfLines={1} style={styles.trackingNumber}>
                {item.trackingId}
              </Text>
            </View>
          </View>

          <StatusBadge status={item.status} color={visual.color} />
        </View>

        {item.location ? (
          <View style={styles.locationRow}>
            <MapPin size={12} color="rgba(255,255,255,0.34)" strokeWidth={2} />

            <Text numberOfLines={1} style={styles.locationText}>
              {item.location}
            </Text>
          </View>
        ) : (
          <View style={styles.locationRow}>
            <Navigation
              size={12}
              color="rgba(255,255,255,0.22)"
              strokeWidth={2}
            />

            <Text style={styles.locationUnavailable}>
              Localisation non disponible
            </Text>
          </View>
        )}

        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progression</Text>

          <Text
            style={[
              styles.progressValue,
              {
                color: visual.color,
              },
            ]}
          >
            {clampProgress(item.progress)}%
          </Text>
        </View>

        <ProgressBar progress={item.progress} color={visual.color} />
      </AnimatedPressable>
    </Animated.View>
  );
}

function AddTrackingCard({
  name,
  trackingId,
  selectedType,
  adding,
  onNameChange,
  onTrackingIdChange,
  onTypeChange,
  onSubmit,
}: {
  name: string;
  trackingId: string;
  selectedType: TrackingType;
  adding: boolean;
  onNameChange: (value: string) => void;
  onTrackingIdChange: (value: string) => void;
  onTypeChange: (type: TrackingType) => void;
  onSubmit: () => void;
}) {
  const canSubmit =
    normalizeText(name).length > 0 &&
    normalizeText(trackingId).length > 0 &&
    !adding;

  return (
    <View style={styles.addCard}>
      <View style={styles.addHeader}>
        <View style={styles.addIcon}>
          <Plus size={18} color="#F97316" strokeWidth={2.5} />
        </View>

        <View style={styles.addHeaderContent}>
          <Text style={styles.addTitle}>Nouveau suivi</Text>

          <Text style={styles.addSubtitle}>
            Ajoute un identifiant réel fourni par le service de transport ou de
            suivi.
          </Text>
        </View>
      </View>

      <TextInput
        value={name}
        onChangeText={(value) => onNameChange(value.slice(0, MAX_NAME_LENGTH))}
        placeholder="Nom du colis / objet"
        placeholderTextColor="rgba(255,255,255,0.28)"
        style={styles.input}
        maxLength={MAX_NAME_LENGTH}
        autoCapitalize="sentences"
        returnKeyType="next"
      />

      <TextInput
        value={trackingId}
        onChangeText={(value) =>
          onTrackingIdChange(value.slice(0, MAX_TRACKING_ID_LENGTH))
        }
        placeholder="Numéro / identifiant de suivi"
        placeholderTextColor="rgba(255,255,255,0.28)"
        style={styles.input}
        maxLength={MAX_TRACKING_ID_LENGTH}
        autoCapitalize="characters"
        autoCorrect={false}
        returnKeyType="done"
      />

      <Text style={styles.typeLabel}>TYPE D&apos;OBJET</Text>

      <View style={styles.typeGrid}>
        {(Object.keys(TRACKING_VISUALS) as TrackingType[]).map((type) => {
          const visual = TRACKING_VISUALS[type];
          const Icon = visual.icon;
          const active = selectedType === type;

          return (
            <AnimatedPressable
              key={type}
              onPress={() => onTypeChange(type)}
              accessibilityLabel={`Type ${visual.label}`}
              style={[
                styles.typeButton,
                active && {
                  backgroundColor: rgba(visual.color, 0.12),
                  borderColor: rgba(visual.color, 0.32),
                },
              ]}
            >
              <Icon
                size={15}
                color={active ? visual.color : "rgba(255,255,255,0.42)"}
                strokeWidth={2}
              />

              <Text
                style={[
                  styles.typeButtonText,
                  active && {
                    color: visual.color,
                  },
                ]}
              >
                {visual.label}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>

      <AnimatedPressable
        onPress={onSubmit}
        disabled={!canSubmit}
        accessibilityLabel="Ajouter le suivi"
        style={[
          styles.addButton,
          {
            backgroundColor: canSubmit ? "#F97316" : "rgba(249,115,22,0.25)",
          },
        ]}
      >
        {adding ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Plus size={17} color="#FFFFFF" strokeWidth={2.6} />
            <Text style={styles.addButtonText}>Ajouter le suivi</Text>
          </>
        )}
      </AnimatedPressable>
    </View>
  );
}

function EmptyState({
  searching,
  onClearSearch,
}: {
  searching: boolean;
  onClearSearch: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        {searching ? (
          <Search size={30} color="rgba(255,255,255,0.25)" strokeWidth={1.7} />
        ) : (
          <Package size={30} color="rgba(255,255,255,0.25)" strokeWidth={1.7} />
        )}
      </View>

      <Text style={styles.emptyTitle}>
        {searching ? "Aucun résultat" : "Aucun suivi enregistré"}
      </Text>

      <Text style={styles.emptyDescription}>
        {searching
          ? "Aucun suivi ne correspond à ta recherche."
          : "Ajoute un colis ou un objet avec son identifiant réel de suivi."}
      </Text>

      {searching ? (
        <AnimatedPressable
          onPress={onClearSearch}
          style={styles.clearButton}
          accessibilityLabel="Effacer la recherche"
        >
          <X size={15} color="#F97316" strokeWidth={2.3} />
          <Text style={styles.clearButtonText}>Effacer la recherche</Text>
        </AnimatedPressable>
      ) : null}
    </View>
  );
}

function TrackingDetail({
  item,
  onBack,
  onDelete,
}: {
  item: TrackingItem;
  onBack: () => void;
  onDelete: (id: Id<"trackingItems">) => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);

  const visual = getVisual(item.type);
  const Icon = visual.icon;

  const handleDelete = useCallback(() => {
    Alert.alert(
      "Supprimer ce suivi ?",
      "Cette action supprimera ce suivi de ton espace.",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              await onDelete(item._id);
              onBack();
            } catch {
              // onDelete already presents the backend error to the user.
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  }, [item._id, onBack, onDelete]);

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={item.name}
        subtitle={item.trackingId}
        onBack={onBack}
        right={
          <View
            style={[
              styles.detailTypeBadge,
              {
                backgroundColor: rgba(visual.color, 0.1),
              },
            ]}
          >
            <Icon size={14} color={visual.color} strokeWidth={2} />
          </View>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.detailContent}
      >
        <View
          style={[
            styles.detailHero,
            {
              backgroundColor: rgba(visual.color, 0.055),
              borderColor: rgba(visual.color, 0.16),
            },
          ]}
        >
          <View style={styles.detailHeroTop}>
            <View
              style={[
                styles.detailIcon,
                {
                  backgroundColor: rgba(visual.color, 0.13),
                },
              ]}
            >
              <Icon size={28} color={visual.color} strokeWidth={1.9} />
            </View>

            <View style={styles.detailStatusContent}>
              <Text style={styles.detailEyebrow}>
                {visual.label.toUpperCase()}
              </Text>

              <Text style={styles.detailStatus}>{item.status}</Text>

              <View style={styles.detailTrackingRow}>
                <Clock3
                  size={12}
                  color="rgba(255,255,255,0.35)"
                  strokeWidth={2}
                />

                <Text numberOfLines={1} style={styles.detailTrackingId}>
                  {item.trackingId}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.detailProgressHeader}>
            <Text style={styles.detailProgressLabel}>
              Progression enregistrée
            </Text>

            <Text
              style={[
                styles.detailProgressValue,
                {
                  color: visual.color,
                },
              ]}
            >
              {clampProgress(item.progress)}%
            </Text>
          </View>

          <ProgressBar progress={item.progress} color={visual.color} />

          <View style={styles.progressEndpoints}>
            <Text style={styles.endpointText}>Départ</Text>
            <Text style={styles.endpointText}>Livraison</Text>
          </View>
        </View>

        <View style={styles.detailInfoCard}>
          <Text style={styles.detailSectionTitle}>Informations de suivi</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Package
                size={15}
                color="rgba(255,255,255,0.45)"
                strokeWidth={2}
              />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Objet</Text>
              <Text style={styles.infoValue}>{item.name}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Navigation
                size={15}
                color="rgba(255,255,255,0.45)"
                strokeWidth={2}
              />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Localisation</Text>

              <Text
                style={[
                  styles.infoValue,
                  !item.location && styles.infoUnavailable,
                ]}
              >
                {item.location ?? "Aucune localisation disponible"}
              </Text>
            </View>
          </View>
        </View>

        {item.notes ? (
          <View style={styles.notesCard}>
            <View style={styles.notesHeader}>
              <CheckCircle size={16} color={visual.color} strokeWidth={2} />

              <Text style={styles.notesTitle}>Notes du suivi</Text>
            </View>

            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        ) : null}

        <View style={styles.sourceNotice}>
          <AlertTriangle
            size={16}
            color="rgba(255,255,255,0.34)"
            strokeWidth={2}
          />

          <Text style={styles.sourceNoticeText}>
            Les informations affichées proviennent du système de suivi connecté
            à ce dossier. Une donnée absente n&apos;est pas remplacée par une
            estimation.
          </Text>
        </View>

        <AnimatedPressable
          onPress={handleDelete}
          disabled={deleting}
          accessibilityLabel="Supprimer ce suivi"
          style={styles.deleteButton}
        >
          {deleting ? (
            <ActivityIndicator size="small" color="#F87171" />
          ) : (
            <Trash2 size={16} color="#F87171" strokeWidth={2} />
          )}

          <Text style={styles.deleteButtonText}>
            {deleting ? "Suppression..." : "Supprimer ce suivi"}
          </Text>
        </AnimatedPressable>
      </ScrollView>
    </View>
  );
}

function TrackingInner({ onBack }: TrackingPageProps) {
  const items = useQuery(api.tracking.listMyTrackedItems, {});

  const addItem = useMutation(api.tracking.addTrackingItem);
  const deleteItem = useMutation(api.tracking.deleteTrackingItem);

  const [selected, setSelected] = useState<Id<"trackingItems"> | null>(null);

  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [newTrackingId, setNewTrackingId] = useState("");
  const [selectedType, setSelectedType] = useState<TrackingType>("colis");
  const [adding, setAdding] = useState(false);

  const normalizedSearch = useMemo(
    () => normalizeText(search).toLowerCase(),
    [search],
  );

  const filtered = useMemo<TrackingItem[]>(() => {
    if (!items) {
      return [];
    }

    if (!normalizedSearch) {
      return items;
    }

    return items.filter((item) => {
      const name = item.name?.toLowerCase() ?? "";
      const trackingId = item.trackingId?.toLowerCase() ?? "";
      const status = item.status?.toLowerCase() ?? "";
      const location = item.location?.toLowerCase() ?? "";

      return (
        name.includes(normalizedSearch) ||
        trackingId.includes(normalizedSearch) ||
        status.includes(normalizedSearch) ||
        location.includes(normalizedSearch)
      );
    });
  }, [items, normalizedSearch]);

  const current = useMemo<TrackingItem | null>(() => {
    if (!items || !selected) {
      return null;
    }

    return items.find((item) => item._id === selected) ?? null;
  }, [items, selected]);

  const handleAdd = useCallback(async () => {
    const name = normalizeText(newName);
    const trackingId = normalizeText(newTrackingId);

    if (!name) {
      Alert.alert(
        "Nom requis",
        "Donne un nom à l'objet que tu souhaites suivre.",
      );
      return;
    }

    if (!trackingId) {
      Alert.alert(
        "Identifiant requis",
        "Entre le numéro ou identifiant réel fourni par le service de suivi.",
      );
      return;
    }

    try {
      setAdding(true);

      /*
       * Le trackingId fourni ici doit être un identifiant réel.
       *
       * Le statut et la progression initiaux suivent la signature actuelle
       * du backend `addTrackingItem`. Ils ne représentent pas une
       * localisation ou une progression inventée par le client.
       */
      await addItem({
        name,
        type: selectedType,
        trackingId,
        status: "En attente",
        progress: 0,
      });

      setNewName("");
      setNewTrackingId("");

      Alert.alert(
        "Suivi ajouté",
        "Le suivi a été enregistré. Les informations disponibles seront affichées depuis le backend.",
      );
    } catch (error) {
      Alert.alert("Impossible d'ajouter le suivi", getErrorMessage(error));
    } finally {
      setAdding(false);
    }
  }, [addItem, newName, newTrackingId, selectedType]);

  const handleDelete = useCallback(
    async (id: Id<"trackingItems">) => {
      try {
        await deleteItem({
          itemId: id,
        });

        if (selected === id) {
          setSelected(null);
        }
      } catch (error) {
        Alert.alert("Suppression impossible", getErrorMessage(error));

        throw error;
      }
    },
    [deleteItem, selected],
  );

  if (current) {
    return (
      <TrackingDetail
        item={current}
        onBack={() => setSelected(null)}
        onDelete={handleDelete}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Tracking"
        subtitle="Localiser · Suivre · Historiser"
        onBack={onBack}
        right={
          <View style={styles.headerTrackingIcon}>
            <Navigation size={17} color="#F97316" strokeWidth={2} />
          </View>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
      >
        <View style={styles.searchBox}>
          <Search size={16} color="rgba(255,255,255,0.36)" strokeWidth={2} />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un suivi..."
            placeholderTextColor="rgba(255,255,255,0.28)"
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />

          {search.length > 0 ? (
            <Pressable
              onPress={() => setSearch("")}
              accessibilityLabel="Effacer la recherche"
              hitSlop={8}
            >
              <X size={15} color="rgba(255,255,255,0.35)" strokeWidth={2} />
            </Pressable>
          ) : null}
        </View>

        <AddTrackingCard
          name={newName}
          trackingId={newTrackingId}
          selectedType={selectedType}
          adding={adding}
          onNameChange={setNewName}
          onTrackingIdChange={setNewTrackingId}
          onTypeChange={setSelectedType}
          onSubmit={() => void handleAdd()}
        />

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Mes suivis</Text>

            <Text style={styles.sectionSubtitle}>
              {items
                ? `${items.length} suivi${
                    items.length > 1 ? "s" : ""
                  } enregistré${items.length > 1 ? "s" : ""}`
                : "Chargement..."}
            </Text>
          </View>

          {normalizedSearch ? (
            <Text style={styles.resultCount}>
              {filtered.length} résultat
              {filtered.length > 1 ? "s" : ""}
            </Text>
          ) : null}
        </View>

        {items === undefined ? (
          <View style={styles.cardsContainer}>
            <NativeSkeleton height={110} />
            <NativeSkeleton height={110} />
            <NativeSkeleton height={110} />
          </View>
        ) : filtered.length === 0 ? (
          <EmptyState
            searching={Boolean(normalizedSearch)}
            onClearSearch={() => setSearch("")}
          />
        ) : (
          <View style={styles.cardsContainer}>
            {filtered.map((item, index) => (
              <TrackingCard
                key={item._id}
                item={item}
                index={index}
                onPress={() => setSelected(item._id)}
              />
            ))}
          </View>
        )}

        <View style={styles.footerNotice}>
          <Navigation
            size={13}
            color="rgba(255,255,255,0.20)"
            strokeWidth={1.8}
          />

          <Text style={styles.footerNoticeText}>
            Aucun statut ou emplacement n&apos;est simulé lorsque la source ne
            fournit pas l&apos;information.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

export default function TrackingPage({ onBack }: TrackingPageProps) {
  return (
    <View style={styles.screen}>
      <AuthLoading>
        <LoadingScreen onBack={onBack} />
      </AuthLoading>

      <Unauthenticated>
        <UnauthenticatedScreen onBack={onBack} />
      </Unauthenticated>

      <Authenticated>
        <TrackingInner onBack={onBack} />
      </Authenticated>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#020412",
  },

  header: {
    minHeight: 78,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 8 : 12,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: "rgba(3,7,20,0.98)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.065)",
  },

  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.052)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  headerButtonPlaceholder: {
    width: 44,
    height: 44,
  },

  headerContent: {
    flex: 1,
    minWidth: 0,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  headerSubtitle: {
    marginTop: 3,
    color: "rgba(255,255,255,0.34)",
    fontSize: 10,
    fontWeight: "600",
  },

  headerTrackingIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(249,115,22,0.11)",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.16)",
  },

  loadingContent: {
    padding: 16,
    gap: 11,
  },

  skeleton: {
    width: "100%",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.075)",
  },

  authEmpty: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  authIcon: {
    width: 82,
    height: 82,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    backgroundColor: "rgba(249,115,22,0.12)",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.14)",
  },

  authTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },

  authDescription: {
    maxWidth: 390,
    color: "rgba(255,255,255,0.42)",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 9,
    marginBottom: 22,
  },

  listContent: {
    padding: 16,
    paddingBottom: 42,
  },

  searchBox: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
    marginBottom: 12,
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },

  addCard: {
    padding: 14,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
    marginBottom: 25,
  },

  addHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 13,
  },

  addIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(249,115,22,0.12)",
  },

  addHeaderContent: {
    flex: 1,
  },

  addTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  addSubtitle: {
    color: "rgba(255,255,255,0.34)",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  input: {
    minHeight: 46,
    paddingHorizontal: 13,
    borderRadius: 14,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
    marginBottom: 9,
  },

  typeLabel: {
    color: "rgba(255,255,255,0.27)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginTop: 5,
    marginBottom: 8,
  },

  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 12,
  },

  typeButton: {
    minHeight: 38,
    paddingHorizontal: 11,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.065)",
  },

  typeButtonText: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 10,
    fontWeight: "800",
  },

  addButton: {
    minHeight: 47,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  sectionHeader: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  sectionSubtitle: {
    color: "rgba(255,255,255,0.30)",
    fontSize: 10,
    marginTop: 3,
  },

  resultCount: {
    color: "#F97316",
    fontSize: 9,
    fontWeight: "800",
  },

  cardsContainer: {
    gap: 10,
  },

  trackingCard: {
    padding: 14,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  itemIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  itemIdentity: {
    flex: 1,
    minWidth: 0,
  },

  itemName: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "850",
  },

  trackingNumberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },

  trackingNumber: {
    flex: 1,
    color: "rgba(255,255,255,0.30)",
    fontSize: 9,
    fontWeight: "600",
  },

  statusBadge: {
    maxWidth: 115,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 99,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  statusText: {
    flexShrink: 1,
    fontSize: 8,
    fontWeight: "900",
  },

  locationRow: {
    minHeight: 25,
    marginTop: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  locationText: {
    flex: 1,
    color: "rgba(255,255,255,0.40)",
    fontSize: 9,
    fontWeight: "600",
  },

  locationUnavailable: {
    color: "rgba(255,255,255,0.22)",
    fontSize: 9,
    fontWeight: "600",
  },

  progressHeader: {
    marginTop: 7,
    marginBottom: 5,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  progressLabel: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 8,
    fontWeight: "700",
  },

  progressValue: {
    fontSize: 9,
    fontWeight: "900",
  },

  progressTrack: {
    height: 5,
    width: "100%",
    borderRadius: 99,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 99,
  },

  emptyState: {
    paddingVertical: 52,
    paddingHorizontal: 25,
    alignItems: "center",
  },

  emptyIcon: {
    width: 66,
    height: 66,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.055)",
    marginBottom: 13,
  },

  emptyTitle: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    fontWeight: "850",
    textAlign: "center",
  },

  emptyDescription: {
    maxWidth: 340,
    color: "rgba(255,255,255,0.28)",
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 6,
  },

  clearButton: {
    marginTop: 15,
    paddingHorizontal: 13,
    minHeight: 37,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(249,115,22,0.08)",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.14)",
  },

  clearButtonText: {
    color: "#F97316",
    fontSize: 10,
    fontWeight: "800",
  },

  footerNotice: {
    marginTop: 22,
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 6,
  },

  footerNoticeText: {
    maxWidth: 340,
    color: "rgba(255,255,255,0.18)",
    fontSize: 9,
    lineHeight: 14,
    textAlign: "center",
  },

  detailTypeBadge: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  detailContent: {
    padding: 16,
    paddingBottom: 45,
    gap: 12,
  },

  detailHero: {
    padding: 16,
    borderRadius: 25,
    borderWidth: 1,
  },

  detailHeroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  detailIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  detailStatusContent: {
    flex: 1,
  },

  detailEyebrow: {
    color: "rgba(255,255,255,0.28)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  detailStatus: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 3,
  },

  detailTrackingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
  },

  detailTrackingId: {
    flex: 1,
    color: "rgba(255,255,255,0.34)",
    fontSize: 10,
    fontWeight: "600",
  },

  detailProgressHeader: {
    marginTop: 23,
    marginBottom: 7,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  detailProgressLabel: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 9,
    fontWeight: "700",
  },

  detailProgressValue: {
    fontSize: 11,
    fontWeight: "900",
  },

  progressEndpoints: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  endpointText: {
    color: "rgba(255,255,255,0.23)",
    fontSize: 8,
    fontWeight: "700",
  },

  detailInfoCard: {
    padding: 15,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  detailSectionTitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 5,
  },

  infoRow: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.045)",
  },

  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    color: "rgba(255,255,255,0.24)",
    fontSize: 8,
    fontWeight: "800",
  },

  infoValue: {
    color: "rgba(255,255,255,0.67)",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
  },

  infoUnavailable: {
    color: "rgba(255,255,255,0.25)",
  },

  notesCard: {
    padding: 15,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  notesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  notesTitle: {
    color: "rgba(255,255,255,0.70)",
    fontSize: 11,
    fontWeight: "850",
  },

  notesText: {
    color: "rgba(255,255,255,0.40)",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 9,
  },

  sourceNotice: {
    padding: 13,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  sourceNoticeText: {
    flex: 1,
    color: "rgba(255,255,255,0.27)",
    fontSize: 9,
    lineHeight: 14,
  },

  deleteButton: {
    minHeight: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
    backgroundColor: "rgba(239,68,68,0.07)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.14)",
  },

  deleteButtonText: {
    color: "#F87171",
    fontSize: 11,
    fontWeight: "850",
  },
});
