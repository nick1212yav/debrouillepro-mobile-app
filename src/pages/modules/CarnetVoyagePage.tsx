import { Picker } from "@react-native-picker/picker";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  Camera,
  Check,
  ChevronRight,
  Feather,
  Frown,
  Globe,
  Map,
  MapPin,
  Meh,
  Plus,
  Share2,
  Smile,
  X,
} from "lucide-react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
} from "@/lib/convex-auth-compat";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import type { Id } from "@/convex/_generated/dataModel";

type Mood = "great" | "good" | "okay" | "bad";

type TabKey = "journal" | "memories" | "stats";

const MOOD_CONFIG: Record<
  Mood,
  {
    icon: typeof Smile;
    label: string;
    color: string;
    background: string;
    border: string;
  }
> = {
  great: {
    icon: Smile,
    label: "Super",
    color: "#4ade80",
    background: "rgba(34,197,94,0.16)",
    border: "rgba(34,197,94,0.35)",
  },
  good: {
    icon: Smile,
    label: "Bien",
    color: "#60a5fa",
    background: "rgba(59,130,246,0.16)",
    border: "rgba(59,130,246,0.35)",
  },
  okay: {
    icon: Meh,
    label: "Moyen",
    color: "#facc15",
    background: "rgba(234,179,8,0.16)",
    border: "rgba(234,179,8,0.35)",
  },
  bad: {
    icon: Frown,
    label: "Dur",
    color: "#f87171",
    background: "rgba(239,68,68,0.16)",
    border: "rgba(239,68,68,0.35)",
  },
};

const TABS: Array<{
  key: TabKey;
  label: string;
  icon: typeof Feather;
}> = [
  {
    key: "journal",
    label: "Journal",
    icon: Feather,
  },
  {
    key: "memories",
    label: "Voyages",
    icon: Map,
  },
  {
    key: "stats",
    label: "Stats",
    icon: BarChart3,
  },
];

type Props = {
  onBack: () => void;
};

function formatDate(value: string, long = false): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: long ? "long" : "short",
    year: "numeric",
  });
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Globe;
  value: number;
  label: string;
}) {
  return (
    <View
      className="flex-1 rounded-2xl border border-white/10 bg-white/[0.045] p-4"
      style={{ minWidth: "45%" }}
    >
      <View className="mb-3 h-9 w-9 items-center justify-center rounded-xl bg-white/10">
        <Icon size={18} color="rgba(255,255,255,0.72)" />
      </View>

      <Text className="text-2xl font-bold text-white">{value}</Text>

      <Text className="mt-1 text-xs text-gray-400">{label}</Text>
    </View>
  );
}

function MoodBadge({ mood }: { mood: Mood }) {
  const config = MOOD_CONFIG[mood];
  const Icon = config.icon;

  return (
    <View
      className="flex-row items-center gap-1.5 rounded-xl border px-2.5 py-1.5"
      style={{
        backgroundColor: config.background,
        borderColor: config.border,
      }}
    >
      <Icon size={14} color={config.color} />

      <Text className="text-xs font-semibold" style={{ color: config.color }}>
        {config.label}
      </Text>
    </View>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: typeof BookOpen;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="items-center justify-center px-6 py-16">
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
        <Icon size={28} color="rgba(255,255,255,0.28)" />
      </View>

      <Text className="text-center text-base font-semibold text-white">
        {title}
      </Text>

      {description ? (
        <Text className="mt-2 max-w-sm text-center text-sm leading-5 text-gray-400">
          {description}
        </Text>
      ) : null}

      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          className="mt-5 rounded-xl bg-white px-5 py-3 active:opacity-80"
        >
          <Text className="text-sm font-bold text-gray-950">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function LoadingJournal() {
  return (
    <View className="gap-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-36 w-full rounded-2xl" />
      ))}
    </View>
  );
}

function JournalEntryCard({
  entry,
  onPress,
}: {
  entry: any;
  onPress: () => void;
}) {
  const mood =
    (entry.mood as Mood) in MOOD_CONFIG ? (entry.mood as Mood) : "good";

  return (
    <Pressable
      onPress={onPress}
      className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] active:opacity-90"
    >
      {entry.images?.[0] ? (
        <View className="relative h-40 w-full">
          <Image
            source={{ uri: entry.images[0] }}
            className="h-full w-full"
            resizeMode="cover"
            accessibilityLabel={entry.title}
          />

          <View
            className="absolute inset-0"
            style={{
              backgroundColor: "rgba(0,0,0,0.24)",
            }}
          />

          <View className="absolute bottom-0 left-0 right-0 p-3">
            <View className="flex-row items-end justify-between gap-3">
              <View className="flex-1">
                {entry.location ? (
                  <View className="mb-1 flex-row items-center gap-1">
                    <MapPin size={11} color="rgba(255,255,255,0.72)" />

                    <Text
                      numberOfLines={1}
                      className="flex-1 text-xs text-white/70"
                    >
                      {entry.location}
                    </Text>
                  </View>
                ) : null}

                <Text
                  numberOfLines={2}
                  className="text-base font-bold text-white"
                >
                  {entry.title}
                </Text>
              </View>

              <MoodBadge mood={mood} />
            </View>
          </View>
        </View>
      ) : null}

      <View className="p-4">
        {!entry.images?.[0] ? (
          <View className="mb-3 flex-row items-start justify-between gap-3">
            <View className="flex-1">
              {entry.location ? (
                <View className="mb-1 flex-row items-center gap-1">
                  <MapPin size={11} color="#9ca3af" />

                  <Text
                    numberOfLines={1}
                    className="flex-1 text-xs text-gray-400"
                  >
                    {entry.location}
                  </Text>
                </View>
              ) : null}

              <Text
                numberOfLines={2}
                className="text-base font-bold text-white"
              >
                {entry.title}
              </Text>
            </View>

            <MoodBadge mood={mood} />
          </View>
        ) : null}

        <Text numberOfLines={3} className="text-sm leading-5 text-gray-300">
          {entry.content}
        </Text>

        <View className="mt-3 flex-row items-center justify-between">
          <Text className="text-xs text-gray-500">
            {formatDate(entry.date)}
          </Text>

          {entry.images?.length > 1 ? (
            <View className="flex-row items-center gap-1">
              <Camera size={12} color="#6b7280" />

              <Text className="text-xs text-gray-500">
                {entry.images.length} photos
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function EntryDetail({ entry, onBack }: { entry: any; onBack: () => void }) {
  const [photoIndex, setPhotoIndex] = useState(0);

  const mood =
    (entry.mood as Mood) in MOOD_CONFIG ? (entry.mood as Mood) : "good";

  const images: string[] = Array.isArray(entry.images) ? entry.images : [];

  const handleShare = async () => {
    try {
      await Share.share({
        title: entry.title,
        message: `${entry.title}\n\n${entry.content}${
          entry.location ? `\n\n${entry.location}` : ""
        }`,
      });
    } catch {
      // Native Share can be dismissed by the user.
    }
  };

  return (
    <View className="flex-1 bg-[#050812]">
      {images.length > 0 ? (
        <View className="relative h-64 w-full">
          <Image
            key={images[photoIndex]}
            source={{ uri: images[photoIndex] }}
            className="h-full w-full"
            resizeMode="cover"
            accessibilityLabel={entry.title}
          />

          <View
            className="absolute inset-0"
            style={{
              backgroundColor: "rgba(0,0,0,0.28)",
            }}
          />

          <Pressable
            onPress={onBack}
            className="absolute left-4 top-12 h-10 w-10 items-center justify-center rounded-xl bg-black/45 active:opacity-70"
          >
            <ArrowLeft size={20} color="#ffffff" />
          </Pressable>

          {images.length > 1 ? (
            <View className="absolute bottom-4 left-0 right-0 flex-row items-center justify-center gap-1.5">
              {images.map((image, index) => (
                <Pressable
                  key={`${image}-${index}`}
                  onPress={() => setPhotoIndex(index)}
                  className="h-1.5 rounded-full"
                  style={{
                    width: index === photoIndex ? 18 : 6,
                    backgroundColor:
                      index === photoIndex
                        ? "#ffffff"
                        : "rgba(255,255,255,0.38)",
                  }}
                />
              ))}
            </View>
          ) : null}
        </View>
      ) : (
        <View className="px-4 pb-2 pt-12">
          <Pressable
            onPress={onBack}
            className="h-10 w-10 items-center justify-center rounded-xl bg-white/10 active:opacity-70"
          >
            <ArrowLeft size={20} color="#ffffff" />
          </Pressable>
        </View>
      )}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 18,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-2xl font-bold leading-8 text-white">
              {entry.title}
            </Text>

            <View className="mt-2 flex-row flex-wrap items-center gap-2">
              {entry.location ? (
                <>
                  <MapPin size={13} color="#9ca3af" />

                  <Text className="text-xs text-gray-400">
                    {entry.location}
                  </Text>

                  <Text className="text-xs text-gray-600">•</Text>
                </>
              ) : null}

              <Calendar size={13} color="#9ca3af" />

              <Text className="text-xs text-gray-400">
                {formatDate(entry.date, true)}
              </Text>
            </View>
          </View>

          <MoodBadge mood={mood} />
        </View>

        <View className="mt-5 rounded-2xl border border-white/10 bg-white/[0.045] p-5">
          <Text className="text-[15px] leading-6 text-gray-200">
            {entry.content}
          </Text>
        </View>

        <View className="mt-4 flex-row gap-3">
          <Pressable
            onPress={handleShare}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] py-3.5 active:opacity-70"
          >
            <Share2 size={16} color="#ffffff" />

            <Text className="text-sm font-semibold text-white">Partager</Text>
          </Pressable>

          <View className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] py-3.5">
            <BookOpen size={16} color="#9ca3af" />

            <Text className="text-sm font-medium text-gray-400">Carnet</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function TravelCard({ plan, onPress }: { plan: any; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] active:opacity-90"
    >
      <View className="relative h-44 w-full">
        {plan.coverImage ? (
          <Image
            source={{ uri: plan.coverImage }}
            className="h-full w-full"
            resizeMode="cover"
            accessibilityLabel={plan.destination}
          />
        ) : (
          <View className="h-full w-full items-center justify-center bg-white/[0.035]">
            <Globe size={42} color="rgba(255,255,255,0.18)" />
          </View>
        )}

        <View
          className="absolute inset-0"
          style={{
            backgroundColor: "rgba(0,0,0,0.38)",
          }}
        />

        <View className="absolute bottom-0 left-0 right-0 p-4">
          <View className="flex-row items-end justify-between gap-3">
            <View className="flex-1">
              <Text numberOfLines={1} className="text-xl font-bold text-white">
                {plan.destination}
              </Text>

              <Text className="mt-1 text-xs text-white/65">
                {plan.startDate} • {plan.entriesCount}{" "}
                {plan.entriesCount === 1 ? "entrée" : "entrées"}
              </Text>
            </View>

            <View className="h-9 w-9 items-center justify-center rounded-full bg-black/35">
              <ChevronRight size={17} color="rgba(255,255,255,0.72)" />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function NewEntryModal({
  visible,
  plans,
  selectedPlanId,
  setSelectedPlanId,
  title,
  setTitle,
  location,
  setLocation,
  content,
  setContent,
  mood,
  setMood,
  submitting,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  plans: any[] | undefined;
  selectedPlanId: Id<"travelPlans"> | null;
  setSelectedPlanId: (value: Id<"travelPlans"> | null) => void;
  title: string;
  setTitle: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  content: string;
  setContent: (value: string) => void;
  mood: Mood;
  setMood: (value: Mood) => void;
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/70">
        <View className="max-h-[92%] rounded-t-3xl border border-white/10 bg-[#0c1022]">
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              padding: 20,
              paddingBottom: 36,
            }}
            showsVerticalScrollIndicator={false}
          >
            <View className="mb-5 items-center">
              <View className="h-1 w-12 rounded-full bg-white/20" />
            </View>

            <View className="mb-5 flex-row items-center justify-between">
              <View>
                <Text className="text-xl font-bold text-white">
                  Nouvelle entrée
                </Text>

                <Text className="mt-1 text-xs text-gray-400">
                  Conservez vos souvenirs dans votre carnet.
                </Text>
              </View>

              <Pressable
                onPress={onClose}
                className="h-10 w-10 items-center justify-center rounded-xl bg-white/10 active:opacity-70"
              >
                <X size={17} color="#ffffff" />
              </Pressable>
            </View>

            {plans && plans.length > 1 ? (
              <View className="mb-4">
                <Text className="mb-2 text-xs font-medium text-gray-400">
                  Voyage
                </Text>

                <View className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.045]">
                  <Picker
                    selectedValue={selectedPlanId ?? plans[0]._id}
                    onValueChange={(value) =>
                      setSelectedPlanId(value as Id<"travelPlans">)
                    }
                    dropdownIconColor="#ffffff"
                    style={{
                      color: "#ffffff",
                    }}
                  >
                    {plans.map((plan) => (
                      <Picker.Item
                        key={plan._id}
                        label={plan.destination}
                        value={plan._id}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            ) : null}

            <View className="mb-4">
              <Text className="mb-2 text-xs font-medium text-gray-400">
                Titre
              </Text>

              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Titre de votre souvenir"
                placeholderTextColor="rgba(255,255,255,0.35)"
                className="rounded-xl border border-white/10 bg-white/[0.045] px-4 py-3.5 text-sm text-white"
                maxLength={120}
              />
            </View>

            <View className="mb-4">
              <Text className="mb-2 text-xs font-medium text-gray-400">
                Lieu
              </Text>

              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="Ville, pays ou lieu"
                placeholderTextColor="rgba(255,255,255,0.35)"
                className="rounded-xl border border-white/10 bg-white/[0.045] px-4 py-3.5 text-sm text-white"
                maxLength={120}
              />
            </View>

            <View className="mb-4">
              <Text className="mb-2 text-xs font-medium text-gray-400">
                Votre histoire
              </Text>

              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="Racontez votre journée, vos émotions et vos découvertes..."
                placeholderTextColor="rgba(255,255,255,0.35)"
                multiline
                textAlignVertical="top"
                className="min-h-[140px] rounded-xl border border-white/10 bg-white/[0.045] px-4 py-3.5 text-sm leading-5 text-white"
                maxLength={5000}
              />

              <Text className="mt-1 text-right text-[10px] text-gray-600">
                {content.length}/5000
              </Text>
            </View>

            <View className="mb-6">
              <Text className="mb-2 text-xs font-medium text-gray-400">
                Humeur
              </Text>

              <View className="flex-row gap-2">
                {(Object.keys(MOOD_CONFIG) as Mood[]).map((value) => {
                  const config = MOOD_CONFIG[value];
                  const Icon = config.icon;
                  const selected = mood === value;

                  return (
                    <Pressable
                      key={value}
                      onPress={() => setMood(value)}
                      className="flex-1 items-center justify-center rounded-xl border py-3 active:opacity-70"
                      style={{
                        backgroundColor: selected
                          ? config.background
                          : "rgba(255,255,255,0.035)",
                        borderColor: selected
                          ? config.border
                          : "rgba(255,255,255,0.08)",
                      }}
                    >
                      <Icon
                        size={19}
                        color={selected ? config.color : "#9ca3af"}
                      />

                      <Text
                        className="mt-1 text-[11px] font-medium"
                        style={{
                          color: selected ? config.color : "#9ca3af",
                        }}
                      >
                        {config.label}
                      </Text>

                      {selected ? (
                        <View className="absolute right-2 top-2">
                          <Check size={11} color={config.color} />
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Pressable
              onPress={onSubmit}
              disabled={!title.trim() || submitting}
              className="items-center justify-center rounded-xl bg-white py-4 active:opacity-80"
              style={{
                opacity: !title.trim() || submitting ? 0.4 : 1,
              }}
            >
              <Text className="text-sm font-bold text-gray-950">
                {submitting
                  ? "Enregistrement..."
                  : "Enregistrer dans le carnet"}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function CarnetInner({ onBack }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("journal");

  const [selectedPlanId, setSelectedPlanId] =
    useState<Id<"travelPlans"> | null>(null);

  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  const [showNewEntry, setShowNewEntry] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newMood, setNewMood] = useState<Mood>("good");
  const [submitting, setSubmitting] = useState(false);

  const entries = useQuery(api.travel.listJournalEntries, {});

  const plans = useQuery(api.travel.listMyTravelPlans, {});

  const stats = useQuery(api.travel.getTravelStats, {});

  const createEntry = useMutation(api.travel.createJournalEntry);

  const selectedEntry = useMemo(
    () => entries?.find((entry) => entry._id === selectedEntryId) ?? null,
    [entries, selectedEntryId],
  );

  const maxEntries = useMemo(() => {
    if (!plans || plans.length === 0) {
      return 1;
    }

    return Math.max(1, ...plans.map((plan) => plan.entriesCount ?? 0));
  }, [plans]);

  const handleOpenNewEntry = () => {
    if (!plans || plans.length === 0) {
      Alert.alert(
        "Aucun voyage",
        "Créez d'abord un voyage dans le Planificateur.",
      );
      return;
    }

    setSelectedPlanId(selectedPlanId ?? plans[0]._id);

    setShowNewEntry(true);
  };

  const resetEntryForm = () => {
    setNewTitle("");
    setNewContent("");
    setNewLocation("");
    setNewMood("good");
    setSubmitting(false);
  };

  const handleCloseNewEntry = () => {
    if (submitting) {
      return;
    }

    setShowNewEntry(false);
    resetEntryForm();
  };

  const handleAddEntry = async () => {
    const title = newTitle.trim();

    if (!title) {
      Alert.alert("Titre requis", "Ajoutez un titre à votre entrée.");
      return;
    }

    if (!plans || plans.length === 0) {
      Alert.alert(
        "Aucun voyage",
        "Créez d'abord un voyage dans le Planificateur.",
      );
      return;
    }

    const planId = selectedPlanId ?? plans[0]._id;

    try {
      setSubmitting(true);

      await createEntry({
        planId,
        title,
        content: newContent.trim(),
        date: new Date().toISOString().split("T")[0],
        location: newLocation.trim() || undefined,
        mood: newMood,
        images: [],
      });

      setShowNewEntry(false);
      resetEntryForm();

      Alert.alert(
        "Carnet mis à jour",
        "Votre nouvelle entrée a été enregistrée.",
      );
    } catch {
      Alert.alert(
        "Enregistrement impossible",
        "Une erreur est survenue. Vérifiez votre connexion et réessayez.",
      );
      setSubmitting(false);
    }
  };

  if (selectedEntry) {
    return (
      <EntryDetail
        entry={selectedEntry}
        onBack={() => setSelectedEntryId(null)}
      />
    );
  }

  return (
    <View className="flex-1 bg-[#050812]">
      {/* HEADER */}
      <View className="px-4 pb-3 pt-12">
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={onBack}
            className="h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.045] active:opacity-70"
          >
            <ArrowLeft size={19} color="#ffffff" />
          </Pressable>

          <View className="flex-1">
            <Text className="text-xl font-bold text-white">
              Carnet de Voyage
            </Text>

            <Text className="mt-0.5 text-xs text-gray-400">
              {entries?.length ?? 0}{" "}
              {entries?.length === 1 ? "entrée" : "entrées"} •{" "}
              {plans?.length ?? 0} {plans?.length === 1 ? "voyage" : "voyages"}
            </Text>
          </View>

          <Pressable
            onPress={handleOpenNewEntry}
            className="flex-row items-center gap-1.5 rounded-xl bg-white px-3.5 py-2.5 active:opacity-80"
          >
            <Plus size={16} color="#050812" />

            <Text className="text-xs font-bold text-gray-950">Écrire</Text>
          </Pressable>
        </View>
      </View>

      {/* TABS */}
      <View className="mx-4 mb-3 flex-row rounded-xl border border-white/10 bg-white/[0.035] p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;

          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className="flex-1 flex-row items-center justify-center gap-1.5 rounded-lg py-2.5 active:opacity-70"
              style={{
                backgroundColor: active
                  ? "rgba(255,255,255,0.10)"
                  : "transparent",
              }}
            >
              <Icon size={14} color={active ? "#ffffff" : "#6b7280"} />

              <Text
                className="text-xs font-medium"
                style={{
                  color: active ? "#ffffff" : "#9ca3af",
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* JOURNAL */}
        {activeTab === "journal" ? (
          <>
            {!entries ? (
              <LoadingJournal />
            ) : entries.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="Votre carnet est vide"
                description="Commencez à conserver vos expériences, vos lieux et vos souvenirs de voyage."
                actionLabel="Écrire ma première entrée"
                onAction={handleOpenNewEntry}
              />
            ) : (
              <View className="gap-3">
                {entries.map((entry) => (
                  <JournalEntryCard
                    key={entry._id}
                    entry={entry}
                    onPress={() => setSelectedEntryId(entry._id)}
                  />
                ))}
              </View>
            )}
          </>
        ) : null}

        {/* VOYAGES */}
        {activeTab === "memories" ? (
          <>
            <View className="mb-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045]">
              <View className="h-40 items-center justify-center">
                <View className="absolute inset-0 bg-white/[0.025]" />

                <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                  <Globe size={28} color="rgba(255,255,255,0.72)" />
                </View>

                <Text className="mt-3 text-lg font-bold text-white">
                  {stats?.countries ?? 0}{" "}
                  {stats?.countries === 1 ? "pays" : "pays"}
                </Text>

                <Text className="mt-1 text-xs text-gray-400">
                  {stats?.days ?? 0} jours de voyage
                </Text>
              </View>
            </View>

            {!plans ? (
              <View className="gap-3">
                {Array.from({ length: 2 }).map((_, index) => (
                  <Skeleton key={index} className="h-44 w-full rounded-2xl" />
                ))}
              </View>
            ) : plans.length === 0 ? (
              <EmptyState
                icon={Map}
                title="Aucun voyage enregistré"
                description="Vos voyages créés dans le Planificateur apparaîtront ici."
              />
            ) : (
              <View>
                {plans.map((plan) => (
                  <TravelCard
                    key={plan._id}
                    plan={plan}
                    onPress={() => setSelectedPlanId(plan._id)}
                  />
                ))}
              </View>
            )}
          </>
        ) : null}

        {/* STATS */}
        {activeTab === "stats" ? (
          <>
            <View className="flex-row flex-wrap gap-3">
              <StatCard
                icon={Globe}
                value={stats?.countries ?? 0}
                label="Pays visités"
              />

              <StatCard
                icon={Calendar}
                value={stats?.days ?? 0}
                label="Jours de voyage"
              />

              <StatCard
                icon={Feather}
                value={stats?.entries ?? 0}
                label="Entrées du journal"
              />

              <StatCard
                icon={Camera}
                value={stats?.plans ?? 0}
                label="Voyages planifiés"
              />
            </View>

            <View className="mt-4 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <View className="mb-4 flex-row items-center gap-2">
                <View className="h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                  <Award size={16} color="#facc15" />
                </View>

                <Text className="text-sm font-bold text-white">
                  Destinations
                </Text>
              </View>

              {!plans || plans.length === 0 ? (
                <Text className="text-xs text-gray-400">
                  Aucune destination enregistrée.
                </Text>
              ) : (
                <View className="gap-4">
                  {plans.slice(0, 6).map((plan) => {
                    const count = plan.entriesCount ?? 0;

                    const percentage = Math.min(
                      100,
                      (count / maxEntries) * 100,
                    );

                    return (
                      <View key={plan._id}>
                        <View className="mb-2 flex-row items-center justify-between gap-3">
                          <Text
                            numberOfLines={1}
                            className="flex-1 text-sm font-medium text-white"
                          >
                            {plan.destination}
                          </Text>

                          <Text className="text-xs text-gray-400">
                            {count} {count === 1 ? "entrée" : "entrées"}
                          </Text>
                        </View>

                        <View className="h-1.5 overflow-hidden rounded-full bg-white/10">
                          <View
                            className="h-full rounded-full bg-white"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </>
        ) : null}
      </ScrollView>

      <NewEntryModal
        visible={showNewEntry}
        plans={plans}
        selectedPlanId={selectedPlanId}
        setSelectedPlanId={setSelectedPlanId}
        title={newTitle}
        setTitle={setNewTitle}
        location={newLocation}
        setLocation={setNewLocation}
        content={newContent}
        setContent={setNewContent}
        mood={newMood}
        setMood={setNewMood}
        submitting={submitting}
        onClose={handleCloseNewEntry}
        onSubmit={handleAddEntry}
      />
    </View>
  );
}

export default function CarnetVoyagePage({ onBack }: Props) {
  return (
    <>
      <Unauthenticated>
        <View className="flex-1 items-center justify-center bg-[#050812] px-6">
          <View className="h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
            <BookOpen size={30} color="rgba(255,255,255,0.28)" />
          </View>

          <Text className="mt-5 text-center text-base font-semibold text-white">
            Votre carnet de voyage
          </Text>

          <Text className="mt-2 text-center text-sm leading-5 text-gray-400">
            Connectez-vous pour retrouver vos voyages, vos souvenirs et vos
            statistiques.
          </Text>

          <Pressable
            onPress={onBack}
            className="mt-6 flex-row items-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-4 py-3 active:opacity-70"
          >
            <ArrowLeft size={16} color="#9ca3af" />

            <Text className="text-sm font-medium text-gray-300">Retour</Text>
          </Pressable>
        </View>
      </Unauthenticated>

      <AuthLoading>
        <View className="flex-1 bg-[#050812] px-4 pt-12">
          <View className="mb-5 flex-row items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />

            <View className="flex-1 gap-2">
              <Skeleton className="h-5 w-40 rounded-md" />
              <Skeleton className="h-3 w-28 rounded-md" />
            </View>
          </View>

          <View className="gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-32 w-full rounded-2xl" />
            ))}
          </View>
        </View>
      </AuthLoading>

      <Authenticated>
        <CarnetInner onBack={onBack} />
      </Authenticated>
    </>
  );
}
