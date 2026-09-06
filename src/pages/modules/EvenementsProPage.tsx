import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, Image, TextInput } from "react-native";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import { ConvexError } from "convex/values";
import { Skeleton } from "@/components/ui/skeleton";
import { SignInButton } from "@/components/ui/signin";
import type { Id } from "@/convex/_generated/dataModel.d";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Plus,
  CheckCircle,
  MapPin,
  Tag,
  Eye,
  Trash2,
  BarChart2,
  CalendarPlus,
  List,
  Zap,
} from "lucide-react-native";

// ── Types ──────────────────────────────────────────────────────────────────
type TabId = "mes-evenements" | "créer" | "stats";
type EventCategory =
  | "culturel"
  | "sportif"
  | "religieux"
  | "professionnel"
  | "communautaire"
  | "formation"
  | "festival"
  | "autre";

interface NewEventForm {
  title: string;
  description: string;
  category: EventCategory;
  startDate: string;
  endDate: string;
  location: string;
  address: string;
  coverImage: string;
  maxAttendees: string;
  isFree: boolean;
  price: string;
  tags: string;
}

const CATEGORY_LABELS: Record<EventCategory, string> = {
  culturel: "Culturel",
  sportif: "Sportif",
  religieux: "Religieux",
  professionnel: "Professionnel",
  communautaire: "Communautaire",
  formation: "Formation",
  festival: "Festival",
  autre: "Autre",
};

const CATEGORY_COLORS: Record<EventCategory, string> = {
  culturel: "#8B5CF6",
  sportif: "#3B82F6",
  religieux: "#F59E0B",
  professionnel: "#6366F1",
  communautaire: "#EC4899",
  formation: "#10B981",
  festival: "#F97316",
  autre: "#9CA3AF",
};

const STATUS_LABELS: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  upcoming: { label: "À venir", color: "#3B82F6", bg: "#3B82F620" },
  ongoing: { label: "En cours", color: "#10B981", bg: "#10B98120" },
  past: { label: "Terminé", color: "#9CA3AF", bg: "#9CA3AF20" },
  cancelled: { label: "Annulé", color: "#EF4444", bg: "#EF444420" },
};

// ── Event Detail Panel ─────────────────────────────────────────────────────
function EventDetailPanel({
  eventId,
  onClose,
}: {
  eventId: Id<"events">;
  onClose: () => void;
}) {
  const event = useQuery(api.events.get, { eventId });
  const removeMutation = useMutation(api.events.remove);

  const handleDelete = async () => {
    try {
      await removeMutation({ eventId });
      UIService.openToast("Événement supprimé", "success");
      onClose();
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message: string };
        UIService.openToast(data.message, "error");
      } else {
        UIService.openToast("Erreur lors de la suppression", "error");
      }
    }
  };

  if (!event) {
    return (
      <View
        className="absolute inset-0 z-50 flex flex-col items-center justify-center"
        style={{  }}
      >
        <Skeleton className="w-32 h-6 mb-2" />
        <Skeleton className="w-48 h-4" />
      </View>
    );
  }

  const statusCfg = STATUS_LABELS[event.status] ?? STATUS_LABELS.upcoming;
  const catColor =
    CATEGORY_COLORS[event.category as EventCategory] ?? "#8B5CF6";

  return (
    <View
      className="absolute inset-0 z-50 flex flex-col overflow-y-auto"
      style={{  }}
    >
      {/* Hero */}
      <View className="relative h-52 flex-shrink-0">
        {event.coverImage ? (
          <Image
           
           
            className="w-full h-full object-cover"
           source={{ uri: event.coverImage }} accessibilityLabel={event.title}/>
        ) : (
          <View
            className="w-full h-full"
            style={{  }}
          />
        )}
        <View
          className="absolute inset-0"
          style={{  }}
        />
        <Pressable
          onPress={onClose}
          className="absolute top-4 left-4 w-9 h-9 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <ArrowLeft size={18} className="text-white" />
        </Pressable>
        <View className="absolute bottom-4 left-4 right-4">
          <View className="flex items-center gap-2 mb-2">
            <Text
              className="px-2.5 py-1 rounded-full text-xs font-bold"
              style={{ backgroundColor: `${catColor}33`, color: catColor }}
            >
              {CATEGORY_LABELS[event.category as EventCategory]}
            </Text>
            <Text
              className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
              style={{ color: statusCfg.color, backgroundColor: statusCfg.bg }}
            >
              {statusCfg.label}
            </Text>
          </View>
          <Text className="text-xl font-black text-white leading-tight">
            {event.title}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 px-4 pb-6 space-y-4 pt-4">
        {/* Stats grid */}
        <View className="gap-2">
          {[
            {
              icon: Users,
              label: "Participants",
              value: `${event.attendingCount}`,
              color: "#6366F1",
            },
            {
              icon: Eye,
              label: "Intéressés",
              value: `${event.interestedCount}`,
              color: "#F59E0B",
            },
            {
              icon: Users,
              label: "Pas intéressés",
              value: `${event.notGoingCount}`,
              color: "#EF4444",
            },
          ].map(({ icon: I, label, value, color }) => (
            <View
              key={label}
              className="rounded-2xl p-3 text-center"
              style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
            >
              <I size={16} style={{ color }} className="mx-auto mb-1" />
              <Text className="text-xs font-bold text-white">{value}</Text>
              <Text className="text-[10px] text-white/40">{label}</Text>
            </View>
          ))}
        </View>

        {/* Info rows */}
        <View className="space-y-2">
          {[
            {
              icon: Calendar,
              v: new Date(event.startDate).toLocaleDateString("fr-FR", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              }),
            },
            {
              icon: Clock,
              v: new Date(event.startDate).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
            { icon: MapPin, v: event.location },
          ].map(({ icon: I, v }) => (
            <View
              key={v}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}
            >
              <I size={14} className="text-white/40" />
              <Text className="text-sm text-white/70">{v}</Text>
            </View>
          ))}
        </View>

        {/* Description */}
        <View>
          <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-2">
            Description
          </Text>
          <Text className="text-sm text-white/70 leading-relaxed">
            {event.description}
          </Text>
        </View>

        {/* Tags */}
        {event.tags.length > 0 && (
          <View className="flex flex-wrap gap-2">
            {event.tags.map((t) => (
              <Text
                key={t}
                className="px-2.5 py-1 rounded-full text-xs text-white/60"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
              >
                #{t}
              </Text>
            ))}
          </View>
        )}

        {/* Price / capacity */}
        <View
          className="rounded-2xl p-4"
          style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
        >
          <View className="flex items-center justify-between mb-2">
            <Text className="text-white/50 text-xs">Prix</Text>
            <Text className="text-white font-bold text-sm">
              {event.isFree ? "Gratuit" : (event.price ?? "—")}
            </Text>
          </View>
          {event.maxAttendees && (
            <View className="flex items-center justify-between">
              <Text className="text-white/50 text-xs">Capacité max</Text>
              <Text className="text-white font-bold text-sm">
                {event.maxAttendees} places
              </Text>
            </View>
          )}
        </View>

        {/* Attendees preview */}
        {event.attendees.length > 0 && (
          <View>
            <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-2">
              Participants ({event.attendingCount})
            </Text>
            <View className="flex flex-wrap gap-2">
              {event.attendees.map((a) => (
                <View
                  key={a.userId}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                >
                  {a.avatar ? (
                    <Image
                     
                     
                      className="w-5 h-5 rounded-full object-cover"
                     source={{ uri: a.avatar }} accessibilityLabel={a.name}/>
                  ) : (
                    <View className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-[9px] font-bold text-white">
                      {a.name.charAt(0)}
                    </View>
                  )}
                  <Text className="text-xs text-white/70">{a.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Delete button */}
        <Pressable
          onPress={handleDelete}
          className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold text-red-400"
          style={{ backgroundColor: "rgba(239,68,68,0.1)", borderWidth: 1, borderColor: "rgba(239,68,68,0.2)", borderStyle: "solid" }}
        >
          <Trash2 size={15} />
          <Text>Supprimer cet événement</Text></Pressable>
      </View>
    </View>
  );
}

// ── Create Event Form ────────────────────────────────────────────────────────
function CreateEventForm({ onCreated }: { onCreated: () => void }) {
  const createMutation = useMutation(api.events.create);
  const [form, setForm] = useState<NewEventForm>({
    title: "",
    description: "",
    category: "culturel",
    startDate: "",
    endDate: "",
    location: "",
    address: "",
    coverImage: "",
    maxAttendees: "",
    isFree: true,
    price: "",
    tags: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (k: keyof NewEventForm, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title || !form.startDate || !form.location) {
      UIService.openToast("Veuillez remplir le titre, la date et le lieu", "error");
      return;
    }
    setSubmitting(true);
    try {
      await createMutation({
        title: form.title,
        description: form.description || "Aucune description",
        category: form.category,
        startDate: new Date(form.startDate).toISOString(),
        endDate: form.endDate
          ? new Date(form.endDate).toISOString()
          : undefined,
        location: form.location,
        address: form.address || undefined,
        coverImage: form.coverImage || undefined,
        maxAttendees: form.maxAttendees
          ? parseInt(form.maxAttendees)
          : undefined,
        isFree: form.isFree,
        price: !form.isFree && form.price ? form.price : undefined,
        tags: form.tags
          ? form.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      });
      setSubmitted(true);
      setTimeout(() => {
        onCreated();
      }, 1500);
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message: string };
        UIService.openToast(data.message, "error");
      } else {
        UIService.openToast("Erreur lors de la création", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <View
        className="text-center py-16"
      >
        <View
          className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4"
          style={{  }}
        >
          <CheckCircle size={28} className="text-white" />
        </View>
        <Text className="text-lg font-black text-white mb-1">Événement créé !</Text>
        <Text className="text-sm text-white/50">
          Votre événement est maintenant visible.
        </Text>
      </View>
    );
  }

  return (
    <View className="space-y-4">
      <Text className="text-sm font-bold text-white">Créer un événement</Text>

      {/* Title */}
      <View
        className="rounded-2xl p-4"
        style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
      >
        <Text className="text-xs text-white/40 mb-2">Titre de l'événement *</Text>
        <TextInput
          value={form.title}
          onChangeText={(text) => update("title", text)}
          placeholder="Ex: Festival de musique..."
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
        />
      </View>

      {/* Location */}
      <View
        className="rounded-2xl p-4"
        style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
      >
        <Text className="text-xs text-white/40 mb-2">Lieu *</Text>
        <TextInput
          value={form.location}
          onChangeText={(text) => update("location", text)}
          placeholder="Stade, salle, ville..."
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
        />
      </View>

      {/* Date & End Date */}
      <View className="gap-2">
        <View
          className="rounded-2xl p-4"
          style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
        >
          <Text className="text-xs text-white/40 mb-2">Début *</Text>
          <TextInput
           
            value={form.startDate}
            onChangeText={(text) => update("startDate", text)}
            className="w-full bg-transparent text-sm text-white outline-none"
          />
        </View>
        <View
          className="rounded-2xl p-4"
          style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
        >
          <Text className="text-xs text-white/40 mb-2">Fin (optionnel)</Text>
          <TextInput
           
            value={form.endDate}
            onChangeText={(text) => update("endDate", text)}
            className="w-full bg-transparent text-sm text-white outline-none"
          />
        </View>
      </View>

      {/* Category */}
      <View
        className="rounded-2xl p-4"
        style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
      >
        <Text className="text-xs text-white/40 mb-2">Catégorie</Text>
        <View className="flex flex-wrap gap-2">
          {(Object.entries(CATEGORY_LABELS) as [EventCategory, string][]).map(
            ([key, label]) => {
              const color = CATEGORY_COLORS[key];
              return (
                <Pressable
                  key={key}
                  onPress={() => update("category", key)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                  style={
                    form.category === key
                      ? { backgroundColor: `${color}22`, borderStyle: "solid" }
                      : { backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }
                  }
                >
                  {label}
                </Pressable>
              );
            },
          )}
        </View>
      </View>

      {/* Price toggle */}
      <View
        className="rounded-2xl p-4"
        style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
      >
        <View className="flex items-center justify-between mb-2">
          <Text className="text-xs text-white/40">Gratuit ?</Text>
          <Pressable
            onPress={() => update("isFree", !form.isFree)}
            className="px-3 py-1 rounded-full text-xs font-bold"
            style={
              form.isFree
                ? { backgroundColor: "rgba(16,185,129,0.2)", borderWidth: 1, borderColor: "rgba(16,185,129,0.3)", borderStyle: "solid" }
                : { backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }
            }
          >
            {form.isFree ? "Oui" : "Non"}
          </Pressable>
        </View>
        {!form.isFree && (
          <TextInput
            value={form.price}
            onChangeText={(text) => update("price", text)}
            placeholder="Ex: 15 000 FCFA"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25 mt-2"
          />
        )}
      </View>

      {/* Max attendees */}
      <View
        className="rounded-2xl p-4"
        style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
      >
        <Text className="text-xs text-white/40 mb-2">
          Places disponibles (optionnel)
        </Text>
        <TextInput
          value={form.maxAttendees}
          onChangeText={(text) => update("maxAttendees", text)}
          placeholder="Ex: 200"
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
         
         keyboardType="numeric"/>
      </View>

      {/* Cover image URL */}
      <View
        className="rounded-2xl p-4"
        style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
      >
        <Text className="text-xs text-white/40 mb-2">Image de couverture (URL)</Text>
        <TextInput
          value={form.coverImage}
          onChangeText={(text) => update("coverImage", text)}
          placeholder="https://..."
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
        />
      </View>

      {/* Tags */}
      <View
        className="rounded-2xl p-4"
        style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
      >
        <Text className="text-xs text-white/40 mb-2">
          Tags (séparés par des virgules)
        </Text>
        <TextInput
          value={form.tags}
          onChangeText={(text) => update("tags", text)}
          placeholder="Musique, Festival, Gratuit"
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
        />
      </View>

      {/* Description */}
      <View
        className="rounded-2xl p-4"
        style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
      >
        <Text className="text-xs text-white/40 mb-2">Description</Text>
        <TextInput
          value={form.description}
          onChangeText={(text) => update("description", text)}
         
          placeholder="Décrivez votre événement..."
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
         multiline textAlignVertical="top"/>
      </View>

      <Pressable
        onPress={handleSubmit}
        disabled={submitting}
        className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-base font-black text-white disabled:opacity-50"
        style={{  }}
      >
        <Plus size={18} />
        {submitting ? "Publication..." : "Publier l'événement"}
      </Pressable>
    </View>
  );
}

// ── Inner content (authenticated) ──────────────────────────────────────────
function EvenementsProInner({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<TabId>("mes-evenements");
  const [selectedEventId, setSelectedEventId] = useState<Id<"events"> | null>(
    null,
  );

  const myEvents = useQuery(api.events.listMine, {});

  const totalEvents = myEvents?.length ?? 0;
  const upcomingCount =
    myEvents?.filter((e) => e.status === "upcoming").length ?? 0;
  const ongoingCount =
    myEvents?.filter((e) => e.status === "ongoing").length ?? 0;

  const TABS = [
    {
      id: "mes-evenements" as TabId,
      label: "Mes événements",
      icon: List,
      color: "#EC4899",
    },
    {
      id: "créer" as TabId,
      label: "Créer",
      icon: CalendarPlus,
      color: "#10B981",
    },
    { id: "stats" as TabId, label: "Stats", icon: BarChart2, color: "#F59E0B" },
  ];

  return (
    <View
      className="relative h-full w-full overflow-hidden flex flex-col"
      style={{  }}
    >
      {/* Glows */}
      <View
        className="absolute top-0 right-0 w-72 h-72 rounded-full"
        style={{  }}
      />
      <View
        className="absolute bottom-20 left-0 w-56 h-56 rounded-full"
        style={{  }}
      />

      {/* Header */}
      <View className="flex-shrink-0 px-4 pt-12 pb-3">
        <View className="flex items-center gap-3 mb-4">
          <Pressable
            onPress={onBack}
            className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
          >
            <ArrowLeft size={18} className="text-white" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-black text-white">Mes Événements</Text>
            <Text className="text-xs text-white/40">
              Organisateur · Gestion & Statistiques
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex gap-2">
          {TABS.map(({ id, label, icon: Icon, color }) => (
            <Pressable
              key={id}
              onPress={() => setTab(id)}
              className="relative flex-1 py-2.5 rounded-2xl flex flex-col items-center gap-0.5"
              style={
                tab === id
                  ? { backgroundColor: `${color}22`, borderStyle: "solid" }
                  : { backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }
              }
            >
              <Icon
                size={15}
                style={{ color: tab === id ? color : "rgba(255,255,255,0.3)" }}
              />
              <Text
                className="text-[10px] font-semibold"
                style={{ color: tab === id ? color : "rgba(255,255,255,0.35)" }}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Content */}
      <View
        className="flex-1 overflow-y-auto px-4 pb-6"
        style={{  }}
      >
        <>
          {/* ── Mes événements ── */}
          {tab === "mes-evenements" && (
            <View
              key="events"
              className="pt-2"
            >
              {!myEvents ? (
                <View className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                  ))}
                </View>
              ) : myEvents.length === 0 ? (
                <View className="text-center py-16">
                  <Calendar size={40} className="text-white/20 mx-auto mb-3" />
                  <Text className="text-white/40 text-sm">Aucun événement créé</Text>
                  <Text className="text-white/25 text-xs mt-1">
                    Créez votre premier événement via l'onglet "Créer"
                  </Text>
                </View>
              ) : (
                <View className="space-y-3">
                  <Text className="text-xs text-white/40">
                    {myEvents.length} événement{myEvents.length > 1 ? "s" : ""}
                  </Text>
                  {myEvents.map((event, idx) => {
                    const statusCfg =
                      STATUS_LABELS[event.status] ?? STATUS_LABELS.upcoming;
                    const catColor =
                      CATEGORY_COLORS[event.category as EventCategory] ??
                      "#8B5CF6";
                    return (
                      <Pressable
                        key={event._id}
                        onPress={() => setSelectedEventId(event._id)}
                        className="rounded-2xl overflow-hidden"
                        style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
                      >
                        <View className="h-1" style={{ backgroundColor: catColor }} />
                        <View className="p-4">
                          <View className="flex items-start justify-between mb-2">
                            <View className="flex-1 min-w-0 pr-2">
                              <Text className="text-white font-bold text-sm leading-tight">
                                {event.title}
                              </Text>
                              <Text className="text-white/40 text-xs mt-0.5">
                                {
                                  CATEGORY_LABELS[
                                    event.category as EventCategory
                                  ]
                                }{" "}
                                · {event.location}
                              </Text>
                            </View>
                            <Text
                              className="px-2.5 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0"
                              style={{ color: statusCfg.color, backgroundColor: statusCfg.bg }}
                            >
                              {statusCfg.label}
                            </Text>
                          </View>
                          <View className="flex items-center gap-4">
                            <View className="flex items-center gap-1 text-xs text-white/50">
                              <Calendar size={11} />
                              {new Date(event.startDate).toLocaleDateString(
                                "fr-FR",
                                { day: "numeric", month: "short" },
                              )}
                            </View>
                            <View className="flex items-center gap-1 text-xs text-white/50">
                              <Clock size={11} />
                              {new Date(event.startDate).toLocaleTimeString(
                                "fr-FR",
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </View>
                            <View
                              className="flex items-center gap-1 text-xs"
                              style={{  }}
                            >
                              <Tag size={11} />
                              {event.isFree
                                ? "Gratuit"
                                : (event.price ?? "Payant")}
                            </View>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* ── Créer ── */}
          {tab === "créer" && (
            <View
              key="creer"
              className="pt-2"
            >
              <CreateEventForm onCreated={() => setTab("mes-evenements")} />
            </View>
          )}

          {/* ── Stats ── */}
          {tab === "stats" && (
            <View
              key="stats"
              className="pt-2"
            >
              {!myEvents ? (
                <View className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                  ))}
                </View>
              ) : (
                <View className="space-y-4">
                  {/* KPI grid */}
                  <View className="gap-3">
                    {[
                      {
                        icon: Calendar,
                        label: "Total événements",
                        value: `${totalEvents}`,
                        color: "#EC4899",
                      },
                      {
                        icon: Zap,
                        label: "À venir",
                        value: `${upcomingCount}`,
                        color: "#3B82F6",
                      },
                      {
                        icon: Users,
                        label: "En cours",
                        value: `${ongoingCount}`,
                        color: "#10B981",
                      },
                      {
                        icon: BarChart2,
                        label: "Terminés",
                        value: `${myEvents.filter((e) => e.status === "past").length}`,
                        color: "#9CA3AF",
                      },
                    ].map(({ icon: Icon, label, value, color }) => (
                      <View
                        key={label}
                        className="rounded-2xl p-4"
                        style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}
                      >
                        <View
                          className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
                          style={{ backgroundColor: `${color}22` }}
                        >
                          <Icon size={16} style={{ color }} />
                        </View>
                        <Text className="text-white font-black text-2xl">
                          {value}
                        </Text>
                        <Text className="text-white/50 text-xs">{label}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Events by category */}
                  <View
                    className="rounded-2xl p-4"
                    style={{ backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}
                  >
                    <Text className="text-white font-bold text-sm mb-3">
                      Par catégorie
                    </Text>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                      const count = myEvents.filter(
                        (e) => e.category === key,
                      ).length;
                      if (count === 0) return null;
                      const color = CATEGORY_COLORS[key as EventCategory];
                      return (
                        <View key={key} className="mb-3 last:mb-0">
                          <View className="flex items-center justify-between mb-1">
                            <Text className="text-white/70 text-xs">
                              {label}
                            </Text>
                            <Text className="text-white/50 text-xs">
                              {count} événement{count > 1 ? "s" : ""}
                            </Text>
                          </View>
                          <View
                            className="h-1.5 rounded-full"
                            style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                          >
                            <View
                              className="h-full rounded-full"
                              style={{ backgroundColor: color }}
                            />
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  {/* Pricing breakdown */}
                  <View
                    className="rounded-2xl p-4"
                    style={{ backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}
                  >
                    <Text className="text-white font-bold text-sm mb-3">
                      Tarification
                    </Text>
                    <View className="flex gap-3">
                      <View
                        className="flex-1 rounded-xl p-3 text-center"
                        style={{ backgroundColor: "rgba(16,185,129,0.1)" }}
                      >
                        <Text className="text-green-400 font-black text-xl">
                          {myEvents.filter((e) => e.isFree).length}
                        </Text>
                        <Text className="text-white/40 text-xs">Gratuits</Text>
                      </View>
                      <View
                        className="flex-1 rounded-xl p-3 text-center"
                        style={{ backgroundColor: "rgba(245,158,11,0.1)" }}
                      >
                        <Text className="text-yellow-400 font-black text-xl">
                          {myEvents.filter((e) => !e.isFree).length}
                        </Text>
                        <Text className="text-white/40 text-xs">Payants</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}
        </>
      </View>

      {/* Detail overlay */}
      <>
        {selectedEventId && (
          <EventDetailPanel
            eventId={selectedEventId}
            onClose={() => setSelectedEventId(null)}
          />
        )}
      </>
    </View>
  );
}

// ── Main page with auth wrapper ──────────────────────────────────────────────
interface EvenementsProPageProps {
  onBack: () => void;
}

export default function EvenementsProPage({ onBack }: EvenementsProPageProps) {
  return (
    <View
      className="h-full w-full"
      style={{  }}
    >
      <AuthLoading>
        <View className="flex flex-col items-center justify-center h-full gap-3 px-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
          <View className="space-y-3 w-full mt-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </View>
        </View>
      </AuthLoading>
      <Unauthenticated>
        <View className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
          <Calendar size={48} className="text-white/20" />
          <Text className="text-white font-bold text-lg"><Text>Espace Organisateur</Text></Text>
          <Text className="text-white/50 text-sm">
            <Text>Connectez-vous pour gérer vos événements</Text></Text>
          <SignInButton />
          <Pressable
            onPress={onBack}
            className="text-white/40 text-xs mt-4"
          >
            <Text>← Retour</Text></Pressable>
        </View>
      </Unauthenticated>
      <Authenticated>
        <EvenementsProInner onBack={onBack} />
      </Authenticated>
    </View>
  );
}
