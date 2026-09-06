import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, Image } from "react-native";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import { Authenticated, Unauthenticated } from "@/lib/convex-auth-compat";
import {
  ArrowLeft, Plus, Calendar, MapPin, Users, Clock, Tag,
  CheckCircle2, Star, XCircle, ChevronRight, Ticket, Filter,
  PartyPopper, Dumbbell, Church, Briefcase, BookOpen, Music,
  Globe, Flame, X, Check,
} from "lucide-react-native";
import { format, formatDistanceToNow, isPast, parseISO, differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { SignInButton } from "@/components/ui/signin";
import { cn } from "@/lib/utils";

// ── Types & constants ──────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "culturel",       label: "Culturel",      icon: Music,        color: "#ec4899" },
  { id: "sportif",        label: "Sportif",        icon: Dumbbell,     color: "#f97316" },
  { id: "religieux",      label: "Religieux",      icon: Church,       color: "#8b5cf6" },
  { id: "professionnel",  label: "Professionnel",  icon: Briefcase,    color: "#6366f1" },
  { id: "communautaire",  label: "Communauté",     icon: Users,        color: "#22c55e" },
  { id: "formation",      label: "Formation",      icon: BookOpen,     color: "#06b6d4" },
  { id: "festival",       label: "Festival",       icon: PartyPopper,  color: "#f59e0b" },
  { id: "autre",          label: "Autre",          icon: Globe,        color: "#94a3b8" },
];

function getCatConfig(id: string) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[7];
}

// ── Countdown ─────────────────────────────────────────────────────────────

function Countdown({ startDate }: { startDate: string }) {
  const date = parseISO(startDate);
  if (isPast(date)) return <Text className="text-xs text-emerald-400">En cours</Text>;
  const days = differenceInDays(date, new Date());
  const hours = differenceInHours(date, new Date()) % 24;
  const mins = differenceInMinutes(date, new Date()) % 60;

  if (days > 0) return (
    <Text className="text-xs font-bold text-amber-400">
      Dans {days}j {hours}h
    </Text>
  );
  if (hours > 0) return <Text className="text-xs font-bold text-orange-400">Dans {hours}h {mins}min</Text>;
  return <Text className="text-xs font-bold text-red-400">Dans {mins} min</Text>;
}

// ── Event card ─────────────────────────────────────────────────────────────

type EventItem = {
  _id: Id<"events">;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate?: string;
  location: string;
  coverImage?: string;
  isFree: boolean;
  price?: string;
  tags: string[];
  status: string;
  authorName: string;
  authorAvatar?: string;
  attendingCount: number;
  interestedCount: number;
};

function EventCard({ event, onClick }: { event: EventItem; onClick: () => void }) {
  const cfg = getCatConfig(event.category);
  const CatIcon = cfg.icon;

  return (
    <Pressable
      onPress={onClick}
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
    >
      {/* Cover */}
      {event.coverImage ? (
        <Image className="w-full h-36 object-cover"  source={{ uri: event.coverImage }} accessibilityLabel={event.title}/>
      ) : (
        <View
          className="w-full h-24 flex items-center justify-center"
          style={{  }}
        >
          <CatIcon className="w-10 h-10 opacity-40" style={{ color: cfg.color }} />
        </View>
      )}

      <View className="p-4">
        {/* Category + status */}
        <View className="flex items-center gap-2 mb-2">
          <Text
            className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: cfg.color }}
          >
            <CatIcon className="w-3 h-3" />
            {cfg.label}
          </Text>
          {event.isFree ? (
            <Badge variant="secondary" className="text-xs bg-emerald-500/20 text-emerald-300 border-emerald-500/20"><Text>Gratuit</Text></Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">{event.price}</Badge>
          )}
        </View>

        <Text className="font-semibold text-white text-sm leading-tight mb-1">{event.title}</Text>
        <Text className="text-xs text-white/50 mb-3">{event.description}</Text>

        <View className="flex flex-col gap-1 mb-3">
          <View className="flex items-center gap-1.5 text-xs text-white/60">
            <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            {format(parseISO(event.startDate), "EEE d MMM yyyy · HH:mm", { locale: fr })}
          </View>
          <View className="flex items-center gap-1.5 text-xs text-white/60">
            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            {event.location}
          </View>
        </View>

        <View className="flex items-center justify-between">
          <View className="flex items-center gap-3 text-xs text-white/50">
            <Text className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />{event.attendingCount}</Text>
            <Text className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400" />{event.interestedCount}</Text>
          </View>
          <Countdown startDate={event.startDate} />
        </View>
      </View>
    </Pressable>
  );
}

// ── RSVP buttons ───────────────────────────────────────────────────────────

function RsvpButtons({ eventId }: { eventId: Id<"events"> }) {
  const rsvpMutation = useMutation(api.events.rsvp);
  const myRsvp = useQuery(api.events.getMyRsvp, { eventId });
  const [loading, setLoading] = useState(false);

  const handle = async (status: "attending" | "interested" | "not_going") => {
    setLoading(true);
    try {
      await rsvpMutation({ eventId, status });
      UIService.openToast(status === "attending" ? "Vous participez !" :
        status === "interested" ? "Intéressé !" : "RSVP annulé", "success");
    } catch {
      UIService.openToast("Erreur RSVP", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex gap-2">
      <Button
        size="sm"
        disabled={loading}
        onPress={() => handle("attending")}
        className={cn(
          "flex-1 gap-1.5 cursor-pointer",
          myRsvp === "attending"
            ? "bg-emerald-500 hover:bg-emerald-600 text-white"
            : "bg-white/10 hover:bg-white/15 text-white"
        )}
      >
        <Check className="w-3.5 h-3.5" />
        {myRsvp === "attending" ? "Je participe ✓" : "Je participe"}
      </Button>
      <Button
        size="sm"
        disabled={loading}
        onPress={() => handle("interested")}
        variant="ghost"
        className={cn(
          "gap-1.5 cursor-pointer border",
          myRsvp === "interested"
            ? "border-amber-500 text-amber-400"
            : "border-white/10 text-white/60"
        )}
      >
        <Star className="w-3.5 h-3.5" />
        {myRsvp === "interested" ? "Intéressé ✓" : "Intéressé"}
      </Button>
    </View>
  );
}

// ── Event detail sheet ────────────────────────────────────────────────────

function EventDetail({ eventId, onClose }: { eventId: Id<"events">; onClose: () => void }) {
  const event = useQuery(api.events.get, { eventId });
  const { isAuthenticated } = useConvexAuth();

  if (!event) return (
    <View className="p-6 space-y-4">
      {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded-xl" />)}
    </View>
  );

  const cfg = getCatConfig(event.category);
  const CatIcon = cfg.icon;

  return (
    <View
      className="fixed inset-0 z-50 flex flex-col"
      style={{  }}
    >
      {/* Cover / header */}
      <View className="relative">
        {event.coverImage ? (
          <Image className="w-full h-52 object-cover"  source={{ uri: event.coverImage }} accessibilityLabel={event.title}/>
        ) : (
          <View
            className="w-full h-52 flex items-center justify-center"
            style={{  }}
          >
            <CatIcon className="w-20 h-20 opacity-30" style={{ color: cfg.color }} />
          </View>
        )}
        <View className="absolute inset-0 bg-gradient-to-b from-transparent to-[#020617]" />
        <Pressable
          onPress={onClose}
          className="absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </Pressable>
      </View>

      <View className="flex-1 overflow-y-auto px-5 pb-8" style={{  }}>
        {/* Category + free */}
        <View className="flex items-center gap-2 mb-3">
          <Text
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full text-white"
            style={{ backgroundColor: cfg.color }}
          >
            <CatIcon className="w-3 h-3" />
            {cfg.label}
          </Text>
          {event.isFree ? (
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/20"><Text>Gratuit</Text></Badge>
          ) : (
            <Badge variant="secondary">{event.price}</Badge>
          )}
          {event.status === "cancelled" && (
            <Badge variant="destructive"><Text>Annulé</Text></Badge>
          )}
        </View>

        <Text className="text-2xl font-bold text-white mb-2">{event.title}</Text>
        <Text className="text-sm text-white/60 mb-5 leading-relaxed">{event.description}</Text>

        {/* Info rows */}
        <View className="space-y-3 mb-5">
          <View className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
            <Calendar className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <View>
              <Text className="text-sm text-white font-medium">
                {format(parseISO(event.startDate), "EEEE d MMMM yyyy", { locale: fr })}
              </Text>
              <Text className="text-xs text-white/50">
                {format(parseISO(event.startDate), "HH:mm", { locale: fr })}
                {event.endDate && ` → ${format(parseISO(event.endDate), "HH:mm", { locale: fr })}`}
              </Text>
              <Text className="text-xs mt-1"><Countdown startDate={event.startDate} /></Text>
            </View>
          </View>

          <View className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
            <MapPin className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <View>
              <Text className="text-sm text-white font-medium">{event.location}</Text>
              {event.address && <Text className="text-xs text-white/50">{event.address}</Text>}
            </View>
          </View>

          <View className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
            <Users className="w-5 h-5 text-emerald-400 shrink-0" />
            <View className="flex gap-4">
              <Text className="text-sm text-white">
                <strong className="text-emerald-400">{event.attendingCount}</strong>
                <Text className="text-white/50 text-xs ml-1">participants</Text>
              </Text>
              <Text className="text-sm text-white">
                <strong className="text-amber-400">{event.interestedCount}</strong>
                <Text className="text-white/50 text-xs ml-1">intéressés</Text>
              </Text>
            </View>
          </View>

          <View className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
            <Flame className="w-5 h-5 text-orange-400 shrink-0" />
            <Text className="text-sm text-white/60">Organisé par <strong className="text-white">{event.authorName}</strong></Text>
          </View>
        </View>

        {/* Tags */}
        {event.tags.length > 0 && (
          <View className="flex flex-wrap gap-2 mb-5">
            {event.tags.map((t) => (
              <Text key={t} className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/60">
                #{t}
              </Text>
            ))}
          </View>
        )}

        {/* Attendee avatars */}
        {event.attendees.length > 0 && (
          <View className="mb-5">
            <Text className="text-xs text-white/40 mb-2">Participants</Text>
            <View className="flex -space-x-2">
              {event.attendees.slice(0, 8).map((a, i) => (
                a.avatar ? (
                  <Image key={i}
                    className="w-8 h-8 rounded-full border-2 border-[#020617] object-cover"  source={{ uri: a.avatar }} accessibilityLabel={a.name}/>
                ) : (
                  <View key={i}
                    className="w-8 h-8 rounded-full border-2 border-[#020617] flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: `hsl(${i * 47}, 60%, 35%)` }}>
                    {a.name[0]}
                  </View>
                )
              ))}
              {event.attendingCount > 8 && (
                <View className="w-8 h-8 rounded-full border-2 border-[#020617] bg-white/10 flex items-center justify-center text-xs text-white/60">
                  <Text>+</Text>{event.attendingCount - 8}
                </View>
              )}
            </View>
          </View>
        )}

        {/* RSVP */}
        {event.status !== "cancelled" && !isPast(parseISO(event.endDate ?? event.startDate)) && (
          <Authenticated>
            <RsvpButtons eventId={eventId} />
          </Authenticated>
        )}
        <Unauthenticated>
          <View className="text-center py-3">
            <Text className="text-xs text-white/40 mb-2">Connectez-vous pour participer</Text>
            <SignInButton />
          </View>
        </Unauthenticated>
      </View>
    </View>
  );
}

// ── Create event form ─────────────────────────────────────────────────────

function CreateEventForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const createMutation = useMutation(api.events.create);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "communautaire" as string,
    startDate: "",
    endDate: "",
    location: "",
    address: "",
    isFree: true,
    price: "",
    tags: "",
  });

  const handleSubmit = async (e: unknown) => {
    if (!form.title || !form.startDate || !form.location) {
      UIService.openToast("Remplissez les champs obligatoires", "error");
      return;
    }
    setLoading(true);
    try {
      await createMutation({
        title: form.title,
        description: form.description,
        category: form.category as Parameters<typeof createMutation>[0]["category"],
        startDate: new Date(form.startDate).toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
        location: form.location,
        address: form.address || undefined,
        isFree: form.isFree,
        price: !form.isFree && form.price ? form.price : undefined,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      });
      UIService.openToast("Événement créé !", "success");
      onCreated();
    } catch {
      UIService.openToast("Erreur lors de la création", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      className="fixed inset-0 z-50 flex flex-col"
      style={{  }}
    >
      <View className="flex items-center gap-3 px-5 pt-12 pb-4 border-b border-white/8 shrink-0">
        <Pressable
          onPress={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
        >
          <X className="w-5 h-5 text-white" />
        </Pressable>
        <Text className="text-lg font-bold text-white flex-1">Créer un événement</Text>
        <Button size="sm" onPress={handleSubmit} disabled={loading} className="bg-indigo-600">
          {loading ? "Création…" : "Publier"}
        </Button>
      </View>

      <View className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{  }}>
        <View>
          <Label className="text-white/70 text-xs mb-1 block"><Text>Titre *</Text></Label>
          <Input
            value={form.title}
            onChange={(text) => setForm((f) => ({ ...f, title: text }))}
            placeholder="Nom de l'événement"
            className="bg-white/8 border-white/10 text-white placeholder:text-white/30"
          />
        </View>

        <View>
          <Label className="text-white/70 text-xs mb-1 block"><Text>Description</Text></Label>
          <Textarea
            value={form.description}
            onChange={(text) => setForm((f) => ({ ...f, description: text }))}
            placeholder="Décrivez l'événement…"
            rows={3}
            className="bg-white/8 border-white/10 text-white placeholder:text-white/30"
          />
        </View>

        {/* Category picker */}
        <View>
          <Label className="text-white/70 text-xs mb-2 block"><Text>Catégorie</Text></Label>
          <View className="gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Pressable
                  key={cat.id}
                 
                  onPress={() => setForm((f) => ({ ...f, category: cat.id }))}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-xl border cursor-pointer transition-all text-xs",
                    form.category === cat.id
                      ? "border-transparent text-white"
                      : "border-white/10 text-white/40 bg-white/5"
                  )}
                  style={form.category === cat.id ? { backgroundColor: cat.color + "33", borderColor: cat.color } : {}}
                >
                  <Icon className="w-4 h-4" style={form.category === cat.id ? { color: cat.color } : {}} />
                  {cat.label}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-3">
          <View>
            <Label className="text-white/70 text-xs mb-1 block"><Text>Date début *</Text></Label>
            <Input
              type="datetime-local"
              value={form.startDate}
              onChange={(text) => setForm((f) => ({ ...f, startDate: text }))}
              className="bg-white/8 border-white/10 text-white"
            />
          </View>
          <View>
            <Label className="text-white/70 text-xs mb-1 block"><Text>Date fin</Text></Label>
            <Input
              type="datetime-local"
              value={form.endDate}
              onChange={(text) => setForm((f) => ({ ...f, endDate: text }))}
              className="bg-white/8 border-white/10 text-white"
            />
          </View>
        </View>

        <View>
          <Label className="text-white/70 text-xs mb-1 block"><Text>Lieu *</Text></Label>
          <Input
            value={form.location}
            onChange={(text) => setForm((f) => ({ ...f, location: text }))}
            placeholder="Ville, quartier…"
            className="bg-white/8 border-white/10 text-white placeholder:text-white/30"
          />
        </View>

        <View>
          <Label className="text-white/70 text-xs mb-1 block"><Text>Adresse précise</Text></Label>
          <Input
            value={form.address}
            onChange={(text) => setForm((f) => ({ ...f, address: text }))}
            placeholder="Rue, numéro…"
            className="bg-white/8 border-white/10 text-white placeholder:text-white/30"
          />
        </View>

        <View className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
          <View>
            <Text className="text-sm text-white font-medium">Entrée gratuite</Text>
            <Text className="text-xs text-white/40">Désactivez pour indiquer un prix</Text>
          </View>
          <Switch
            checked={form.isFree}
            onCheckedChange={(v) => setForm((f) => ({ ...f, isFree: v }))}
          />
        </View>

        {!form.isFree && (
          <View>
            <Label className="text-white/70 text-xs mb-1 block"><Text>Prix</Text></Label>
            <Input
              value={form.price}
              onChange={(text) => setForm((f) => ({ ...f, price: text }))}
              placeholder="ex: 2000 FCFA"
              className="bg-white/8 border-white/10 text-white placeholder:text-white/30"
            />
          </View>
        )}

        <View>
          <Label className="text-white/70 text-xs mb-1 block"><Text>Tags (séparés par des virgules)</Text></Label>
          <Input
            value={form.tags}
            onChange={(text) => setForm((f) => ({ ...f, tags: text }))}
            placeholder="musique, culture, gratuit…"
            className="bg-white/8 border-white/10 text-white placeholder:text-white/30"
          />
        </View>
      </View>
    </View>
  );
}

// ── Agenda view (calendar-style list grouped by date) ────────────────────

function AgendaView({ events, onSelect }: { events: EventItem[]; onSelect: (id: Id<"events">) => void }) {
  // Group by date
  const byDate: Record<string, EventItem[]> = {};
  for (const e of events) {
    const d = e.startDate.slice(0, 10);
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(e);
  }
  const sortedDates = Object.keys(byDate).sort();

  if (sortedDates.length === 0) {
    return (
      <View className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <Calendar className="w-12 h-12 text-white/20 mb-3" />
        <Text className="text-white/40 text-sm">Aucun événement à venir</Text>
        <Text className="text-white/25 text-xs mt-1">Créez le premier !</Text>
      </View>
    );
  }

  return (
    <View className="space-y-6 px-5 pb-8">
      {sortedDates.map((date) => (
        <View key={date}>
          {/* Date header */}
          <View className="flex items-center gap-3 mb-3">
            <View className="flex flex-col items-center w-10">
              <Text className="text-xs text-white/40 uppercase">
                {format(parseISO(date), "MMM", { locale: fr })}
              </Text>
              <Text className="text-2xl font-bold text-white leading-none">
                {format(parseISO(date), "d")}
              </Text>
            </View>
            <View className="flex-1 h-px bg-white/10" />
            <Text className="text-xs text-white/30">
              {format(parseISO(date), "EEEE", { locale: fr })}
            </Text>
          </View>
          {/* Events on this date */}
          <View className="space-y-2 pl-12">
            {byDate[date].map((event) => {
              const cfg = getCatConfig(event.category);
              const CatIcon = cfg.icon;
              return (
                <Pressable
                  key={event._id}
                  onPress={() => onSelect(event._id)}
                  className="w-full text-left flex items-center gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}
                >
                  <View
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: cfg.color + "22" }}
                  >
                    <CatIcon className="w-5 h-5" style={{ color: cfg.color }} />
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text className="text-sm font-medium text-white truncate">{event.title}</Text>
                    <Text className="text-xs text-white/40 truncate">
                      {format(parseISO(event.startDate), "HH:mm")} · {event.location}
                    </Text>
                  </View>
                  <View className="flex flex-col items-end gap-1 shrink-0">
                    <Countdown startDate={event.startDate} />
                    <Text className="text-xs text-white/30">{event.attendingCount} part.</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

// ── My agenda (events I'm attending) ──────────────────────────────────────

function MyAgenda({ onSelect }: { onSelect: (id: Id<"events">) => void }) {
  const myEvents = useQuery(api.events.listAttending, {});

  if (!myEvents) return (
    <View className="space-y-3 px-5">
      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
    </View>
  );

  if (myEvents.length === 0) return (
    <View className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <Ticket className="w-12 h-12 text-white/20 mb-3" />
      <Text className="text-white/40 text-sm">Aucun événement dans votre agenda</Text>
      <Text className="text-white/25 text-xs mt-1">Participez à des événements pour les retrouver ici</Text>
    </View>
  );

  return (
    <View className="space-y-2 px-5 pb-8">
      {myEvents.map((event) => {
        const cfg = getCatConfig(event.category);
        const CatIcon = cfg.icon;
        return (
          <Pressable
            key={event._id}
            onPress={() => onSelect(event._id)}
            className="w-full text-left flex items-center gap-3 p-3 rounded-xl"
            style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}
          >
            <View
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: cfg.color + "22" }}
            >
              <CatIcon className="w-5 h-5" style={{ color: cfg.color }} />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-sm font-medium text-white truncate">{event.title}</Text>
              <View className="flex items-center gap-2 text-xs text-white/40">
                <Calendar className="w-3 h-3" />
                {format(parseISO(event.startDate), "d MMM · HH:mm", { locale: fr })}
                <Text>·</Text>
                <MapPin className="w-3 h-3" />
                {event.location}
              </View>
            </View>
            <Countdown startDate={event.startDate} />
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

interface EventsAgendaPageProps {
  onBack: () => void;
}

const TABS = [
  { id: "upcoming", label: "À venir" },
  { id: "agenda", label: "Agenda" },
  { id: "mine", label: "Mes événements" },
];

export default function EventsAgendaPage({ onBack }: EventsAgendaPageProps) {
  const [tab, setTab] = useState<"upcoming" | "agenda" | "mine">("upcoming");
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Id<"events"> | null>(null);
  const { isAuthenticated } = useConvexAuth();

  const events = useQuery(api.events.list, {
    status: tab === "upcoming" || tab === "agenda" ? "upcoming" : undefined,
    category: filterCat ?? undefined,
  }) ?? [];

  return (
    <View
      className="h-full w-full flex flex-col overflow-hidden"
      style={{  }}
    >
      {/* Header */}
      <View className="shrink-0 px-5 pt-12 pb-3">
        <View className="flex items-center gap-3 mb-4">
          <Pressable
            onPress={onBack}
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-bold text-white">Événements</Text>
            <Text className="text-xs text-white/40">Agenda communautaire</Text>
          </View>
          <Pressable
            onPress={() => setShowFilters((v) => !v)}
            className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center cursor-pointer transition-all",
              showFilters ? "bg-indigo-500/30" : "bg-white/8"
            )}
          >
            <Filter className="w-4 h-4 text-white" />
          </Pressable>
          {isAuthenticated && (
            <Pressable
              onPress={() => setShowCreate(true)}
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{  }}
            >
              <Plus className="w-5 h-5 text-white" />
            </Pressable>
          )}
        </View>

        {/* Category filters */}
        <>
          {showFilters && (
            <View
              className="overflow-hidden mb-3"
            >
              <View className="flex gap-2 overflow-x-auto pb-2" style={{  }}>
                <Pressable
                  onPress={() => setFilterCat(null)}
                  className={cn(
                    "shrink-0 text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-all",
                    !filterCat ? "bg-white/15 border-white/30 text-white" : "border-white/10 text-white/40 bg-white/5"
                  )}
                >
                  <Text>Tous</Text></Pressable>
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => setFilterCat(filterCat === cat.id ? null : cat.id)}
                      className={cn(
                        "shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-all",
                        filterCat === cat.id ? "text-white border-transparent" : "border-white/10 text-white/40 bg-white/5"
                      )}
                      style={filterCat === cat.id ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
                    >
                      <Icon className="w-3 h-3" />
                      {cat.label}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </>

        {/* Tabs */}
        <View className="flex gap-1 p-1 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
          {TABS.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id as typeof tab)}
              className={cn(
                "flex-1 text-xs py-2 rounded-xl cursor-pointer transition-all font-medium",
                tab === t.id ? "bg-indigo-600 text-white" : "text-white/50 hover:text-white/80"
              )}
            >
              {t.label}
            </Pressable>
          ))}
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 overflow-y-auto" style={{  }}>
        {tab === "upcoming" && (
          <View className="px-5 pb-8 space-y-4 pt-3">
            {!events.length ? (
              <View className="flex flex-col items-center justify-center py-16 text-center">
                <Calendar className="w-12 h-12 text-white/20 mb-3" />
                <Text className="text-white/40 text-sm"><Text>Aucun événement à venir</Text></Text>
              </View>
            ) : (
              events.map((event) => (
                <EventCard key={event._id} event={event} onPress={() => setSelectedEvent(event._id)} />
              ))
            )}
          </View>
        )}

        {tab === "agenda" && (
          <View className="pt-3">
            <AgendaView events={events} onSelect={setSelectedEvent} />
          </View>
        )}

        {tab === "mine" && (
          <View className="pt-3">
            <Authenticated>
              <MyAgenda onSelect={setSelectedEvent} />
            </Authenticated>
            <Unauthenticated>
              <View className="flex flex-col items-center justify-center py-16 gap-3">
                <Ticket className="w-12 h-12 text-white/20" />
                <Text className="text-white/40 text-sm"><Text>Connectez-vous pour voir votre agenda</Text></Text>
                <SignInButton />
              </View>
            </Unauthenticated>
          </View>
        )}
      </View>

      {/* Event detail */}
      <>
        {selectedEvent && (
          <EventDetail eventId={selectedEvent} onClose={() => setSelectedEvent(null)} />
        )}
      </>

      {/* Create form */}
      <>
        {showCreate && (
          <CreateEventForm
            onClose={() => setShowCreate(false)}
            onCreated={() => setShowCreate(false)}
          />
        )}
      </>
    </View>
  );
}
