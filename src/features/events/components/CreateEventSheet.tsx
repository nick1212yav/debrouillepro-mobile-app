import { UIService } from "@/core/sdk/ui/UIService";
import { Pressable, View, Text, TextInput, ViewStyle, TextStyle, ImageStyle } from "react-native";

// src/features/events/components/CreateEventSheet.tsx
// ✅ Version finale – sans données mockées, utilisant les vraies données du formulaire

import { useState, useCallback } from "react";
import {
  X,
  MapPin,
  Tag,
  FileText,
  Calendar,
  Users,
  LocateFixed,
  Loader2,
  Image,
  Video,
  Ticket,
  Clock,
  UserPlus,
  Briefcase,
  QrCode,
  ChevronDown,
  ChevronUp,
  Share2,
  BarChart3,
} from "lucide-react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/features/events/types";
import type {
  EventFormData,
  EventCategory,
  Event,
} from "@/features/events/types";
import AIWriteAssist from "@/components/AIWriteAssist";
import ImageUploader from "@/components/ImageUploader";

// ── Composants existants du module Événements ──────────────────────────────
import { EventTickets } from "@/features/events/components/EventTickets";
import { EventTimeline } from "@/features/events/components/EventTimeline";
import { EventAttendees } from "@/features/events/components/EventAttendees";
import { EventOrganizer } from "@/features/events/components/EventOrganizer";
import { EventMap } from "@/features/events/components/EventMap";
import { EventQR } from "@/features/events/components/EventQR";
import { EventCountdown } from "@/features/events/components/EventCountdown";
import { EventStats } from "@/features/events/components/EventStats";

// ─── Composants internes (shared) ──────────────────────────────────────────

function SectionHeader({
  title,
  icon: Icon,
  color,
  isOpen,
  onToggle,
  badge,
}: {
  title: string;
  icon: React.ComponentType<{ size: number; style?: ViewStyle | TextStyle | ImageStyle }>;
  color: string;
  isOpen: boolean;
  onToggle: () => void;
  badge?: string;
}) {
  return (
    <Pressable
      onPress={onToggle}
      className="w-full flex items-center justify-between py-3 px-4 rounded-2xl"
      style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)", }}
    >
      <View className="flex items-center gap-2.5">
        <Icon size={18} style={{ color }} />
        <Text className="text-white font-semibold text-sm">{title}</Text>
        {badge && (
          <Text className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
            {badge}
          </Text>
        )}
        <Text className="text-xs text-white/20 ml-1">(optionnel)</Text>
      </View>
      {isOpen ? (
        <ChevronUp size={16} className="text-white/30" />
      ) : (
        <ChevronDown size={16} className="text-white/30" />
      )}
    </Pressable>
  );
}

function FieldInput({
  icon: Icon,
  color,
  placeholder,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  icon: React.ComponentType<{ size: number; style?: ViewStyle | TextStyle | ImageStyle }>;
  color: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <View
      className="rounded-2xl p-3.5 mb-2"
      style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
    >
      <View className="flex items-center gap-2.5">
        <Icon size={14} style={{ color }} />
        <TextInput
         
          value={value}
          onChangeText={(text) => onChange(text)}
          placeholder={required ? `${placeholder} *` : placeholder}
          className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 outline-none"
        />
      </View>
    </View>
  );
}

function FieldTextarea({
  icon: Icon,
  color,
  placeholder,
  value,
  onChange,
  rows = 3,
  required = false,
}: {
  icon: React.ComponentType<{ size: number; style?: ViewStyle | TextStyle | ImageStyle }>;
  color: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  required?: boolean;
}) {
  return (
    <View
      className="rounded-2xl p-3.5 mb-2"
      style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
    >
      <View className="flex items-start gap-2.5">
        <Icon size={14} style={{ color, marginTop: 3 }} />
        <TextInput
          value={value}
          onChangeText={(text) => onChange(text)}
          placeholder={required ? `${placeholder} *` : placeholder}
         
          className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/25"
         multiline textAlignVertical="top"/>
      </View>
    </View>
  );
}

function CategoryPills({
  cats,
  active,
  color,
  onChange,
}: {
  cats: [string, string][];
  active: string;
  color: string;
  onChange: (c: string) => void;
}) {
  return (
    <View className="flex flex-wrap gap-2 mb-4">
      {cats.map(([key, label]) => (
        <Pressable
          key={key}
          onPress={() => onChange(key)}
          className="px-3 py-1.5 rounded-2xl text-xs font-semibold"
          style={{ backgroundColor: active === key ? `${color}33` : "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
        >
          {label}
        </Pressable>
      ))}
    </View>
  );
}

function TagsInput({
  value,
  onChange,
  placeholder,
  color,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  color: string;
}) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInput("");
    }
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <View
      className="rounded-2xl p-3.5 mb-2"
      style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
    >
      <View className="flex flex-wrap gap-1.5 mb-2">
        {value.map((tag) => (
          <Text
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
            style={{ backgroundColor: `${color}25`, color }}
          >
            #{tag}
            <Pressable
             
              onPress={() => removeTag(tag)}
              className=""
            >
              <X size={12} />
            </Pressable>
          </Text>
        ))}
      </View>
      <View className="flex items-center gap-2">
        <TextInput
          value={input}
          onChangeText={(text) => setInput(text)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 outline-none"
        />
        <Pressable
         
          onPress={addTag}
          disabled={!input.trim()}
          className="text-white/40 disabled:opacity-30"
        >
          <Text style={{ color }}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SubmitBtn({
  color,
  label,
  onClick,
  disabled,
  loading,
}: {
  color: string;
  label: string;
  onClick: () => void;
  disabled: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onClick}
      className="w-full py-4 rounded-3xl text-white font-bold text-sm mt-3 disabled:opacity-40 flex items-center justify-center gap-2"
      style={{  }}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {loading ? "Création en cours..." : label}
    </Pressable>
  );
}

// ─── Section General ────────────────────────────────────────────────────────

function GeneralSection({
  form,
  update,
  color,
  detectingLocation,
  onDetectLocation,
}: {
  form: EventFormData;
  update: (key: keyof EventFormData, value: any) => void;
  color: string;
  detectingLocation: boolean;
  onDetectLocation: () => void;
}) {
  return (
    <View className="pt-2">
      <CategoryPills
        cats={Object.entries(CATEGORY_LABELS) as [string, string][]}
        active={form.category}
        color={color}
        onChange={(c) => update("category", c)}
      />

      <FieldInput
        icon={Tag}
        color={color}
        placeholder="Nom de l'événement"
        value={form.title}
        onChange={(v) => update("title", v)}
        required
      />

      <FieldTextarea
        icon={FileText}
        color={color}
        placeholder="Description"
        value={form.description}
        onChange={(v) => update("description", v)}
        rows={3}
        required
      />

      <AIWriteAssist
        contentType="event_description"
        topic={form.title}
        onGenerated={(text) => update("description", text)}
        description={form.description}
        onTagsSuggested={(tags) => {
          const newTags = tags.filter((t) => !form.tags.includes(t));
          if (newTags.length > 0) {
            update("tags", [...form.tags, ...newTags]);
          }
        }}
        category={form.category}
        color={color}
      />

      <View className="gap-2">
        <View
          className="rounded-2xl p-3.5 mb-2"
          style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
        >
          <View className="flex items-center gap-2.5">
            <Calendar size={14} style={{ color }} />
            <TextInput
             
              value={form.startDate}
              onChangeText={(text) => update("startDate", text)}
              className="flex-1 bg-transparent text-white text-sm outline-none"
            />
          </View>
        </View>
        <View
          className="rounded-2xl p-3.5 mb-2"
          style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
        >
          <View className="flex items-center gap-2.5">
            <Calendar size={14} style={{ color, opacity: 0.5 }} />
            <TextInput
             
              value={form.endDate}
              onChangeText={(text) => update("endDate", text)}
              placeholder="Fin"
              className="flex-1 bg-transparent text-white text-sm outline-none"
            />
          </View>
        </View>
      </View>

      <View
        className="rounded-2xl p-3.5 mb-2"
        style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
      >
        <View className="flex items-center gap-2.5">
          <MapPin size={14} style={{ color }} />
          <TextInput
            value={form.location}
            onChangeText={(text) => update("location", text)}
            placeholder="Lieu *"
            className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 outline-none"
          />
          <Pressable
           
            onPress={onDetectLocation}
            disabled={detectingLocation}
            className="flex-shrink-0 disabled:opacity-40"
           
          >
            {detectingLocation ? (
              <Loader2 size={14} className="animate-spin" style={{ color }} />
            ) : (
              <LocateFixed size={14} style={{ color }} />
            )}
          </Pressable>
        </View>
      </View>

      <FieldInput
        icon={MapPin}
        color={color}
        placeholder="Adresse complète (optionnel)"
        value={form.address || ""}
        onChange={(v) => update("address", v)}
      />

      <View
        className="rounded-2xl p-3.5 mb-2"
        style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
      >
        <View className="flex items-center justify-between mb-2">
          <View className="flex items-center gap-2.5">
            <Tag size={14} style={{ color }} />
            <Text className="text-xs text-white/40">Gratuit ?</Text>
          </View>
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
            className="w-full bg-transparent text-white text-sm outline-none placeholder:text-white/25 mt-1"
          />
        )}
      </View>

      <View
        className="rounded-2xl p-3.5 mb-2"
        style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
      >
        <View className="flex items-center gap-2.5">
          <Users size={14} style={{ color }} />
          <TextInput
           
            value={form.maxAttendees || ""}
            onChangeText={(text) =>
              update(
                "maxAttendees",
                text ? parseInt(text) : undefined,
              )
            }
            placeholder="Places disponibles (optionnel)"
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/25"
           keyboardType="numeric"/>
        </View>
      </View>

      <TagsInput
        value={form.tags}
        onChange={(tags) => update("tags", tags)}
        placeholder="Tags (ex: Musique, Festival, Gratuit...)"
        color={color}
      />
    </View>
  );
}

// ─── Section Media ──────────────────────────────────────────────────────────

function MediaSection({
  images,
  setImages,
  videos,
  setVideos,
  color,
}: {
  images: string[];
  setImages: (images: string[]) => void;
  videos: string[];
  setVideos: (videos: string[]) => void;
  color: string;
}) {
  return (
    <View className="pt-2">
      <ImageUploader
        images={images}
        onChange={setImages}
        color={color}
        label="Images"
      />

      <View
        className="rounded-2xl p-3.5 mb-2"
        style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
      >
        <View className="flex items-center gap-2.5">
          <Video size={14} style={{ color }} />
          <TextInput
            value={videos.join(", ")}
            onChangeText={(text) =>
              setVideos(
                text
                  .split(",")
                  .map((v) => v.trim())
                  .filter(Boolean),
              )
            }
            placeholder="Vidéos (URLs séparées par des virgules)"
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/25"
          />
        </View>
      </View>
    </View>
  );
}

// ── Autres sections ──────────────────────────────────────────────────────────

function TicketsSection({ event }: { event: Event }) {
  return (
    <View className="pt-2">
      <EventTickets event={event} onPurchase={() => {}} />
    </View>
  );
}

function ProgramSection({ event }: { event: Event }) {
  return (
    <View className="pt-2">
      <EventTimeline event={event} />
    </View>
  );
}

function AttendeesSection({ event }: { event: Event }) {
  return (
    <View className="pt-2">
      <EventAttendees event={event} />
    </View>
  );
}

function OrganizerSection({ event }: { event: Event }) {
  return (
    <View className="pt-2">
      <EventOrganizer
        event={event}
        onContact={() => UIService.openToast("Contacter l'organisateur", "info")}
      />
    </View>
  );
}

function MapSection({ event }: { event: Event }) {
  return (
    <View className="pt-2">
      <EventMap event={event} />
    </View>
  );
}

function QRSection({ eventTitle }: { eventTitle: string }) {
  const ticketNumber = `TICKET-${Date.now().toString().slice(-6)}`;
  return (
    <View className="pt-2">
      <EventQR
        ticketNumber={ticketNumber}
        eventTitle={eventTitle || "Événement"}
        isValid={true}
      />
    </View>
  );
}

function CountdownSection({ startDate }: { startDate: string }) {
  if (!startDate) return null;
  return (
    <View className="pt-2">
      <EventCountdown startDate={startDate} />
    </View>
  );
}

function ShareSection() {
  return (
    <View className="pt-2">
      <View className="text-center text-white/40 text-sm p-4 bg-white/5 rounded-xl">
        <Share2 size={24} className="mx-auto mb-2 text-white/20" />
        <Text><Text>Après création, partagez votre événement</Text></Text>
        <Text className="text-xs text-white/20 mt-1">
          <Text>Les liens de partage seront disponibles</Text></Text>
      </View>
    </View>
  );
}

function StatsSection({ event }: { event: Event }) {
  return (
    <View className="pt-2">
      <EventStats event={event} />
    </View>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateEventSheet({ onClose, onSuccess }: Props) {
  const color = "#EC4899";

  const [form, setForm] = useState<EventFormData>({
    title: "",
    description: "",
    category: "culturel",
    startDate: "",
    endDate: "",
    location: "",
    address: "",
    coverImage: "",
    gallery: [],
    videos: [],
    maxAttendees: undefined,
    isFree: true,
    price: "",
    tags: [],
  });

  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);

  const [sections, setSections] = useState({
    general: true,
    media: true,
    tickets: true,
    program: true,
    attendees: true,
    organizer: true,
    map: true,
    qr: true,
    countdown: true,
    share: true,
    stats: true,
  });

  const createEvent = useMutation(api.events.create);

  const toggleSection = (key: keyof typeof sections) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const update = (key: keyof EventFormData, value: any) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const detectLocation = useCallback(() => {
    if (!("geolocation" in undefined)) {
      UIService.openToast("Géolocalisation non supportée", "error");
      return;
    }
    setLocating(true);
    undefined.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
          );
          const data = (await res.json()) as {
            address?: {
              city?: string;
              town?: string;
              village?: string;
              suburb?: string;
              state?: string;
              country?: string;
            };
          };
          const addr = data.address;
          const place =
            addr?.city ??
            addr?.town ??
            addr?.village ??
            addr?.suburb ??
            addr?.state ??
            "";
          const country = addr?.country ?? "";
          update(
            "location",
            place
              ? `${place}, ${country}`
              : `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
          );
          UIService.openToast("Position détectée !", "success");
        } catch {
          update(
            "location",
            `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
          );
        }
        setLocating(false);
      },
      () => {
        UIService.openToast("Impossible de détecter la position", "error");
        setLocating(false);
      },
      { timeout: 10000 },
    );
  }, []);

  const handleSubmit = async () => {
    if (!form.title || !form.startDate || !form.location) {
      UIService.openToast("Veuillez remplir le titre, la date et le lieu", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await createEvent({
        title: form.title,
        description: form.description || "Aucune description",
        category: form.category,
        startDate: new Date(form.startDate).toISOString(),
        endDate: form.endDate
          ? new Date(form.endDate).toISOString()
          : undefined,
        location: form.location,
        address: form.address || undefined,
        coverImage:
          form.coverImage || (images.length > 0 ? images[0] : undefined),
        maxAttendees: form.maxAttendees,
        isFree: form.isFree,
        price: !form.isFree && form.price ? form.price : undefined,
        tags: form.tags,
        gallery: images,
        videos: videos,
      });
      UIService.openToast("Événement créé avec succès !", "success");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(error);
      UIService.openToast("Erreur lors de la création", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Construction de l'événement d'aperçu basé sur les données réelles du formulaire
  const previewEvent: Event = {
    _id: "preview" as any,
    _creationTime: Date.now(),
    authorId: "user" as any,
    authorName: "Vous",
    authorAvatar: "",
    title: form.title || "Nouvel événement",
    description: form.description || "",
    category: form.category as any,
    startDate: form.startDate || new Date().toISOString(),
    endDate: form.endDate,
    location: form.location || "",
    address: form.address,
    coverImage: form.coverImage || (images.length > 0 ? images[0] : undefined),
    gallery: images,
    videos: videos,
    maxAttendees: form.maxAttendees,
    isFree: form.isFree,
    price: form.price,
    tags: form.tags,
    status: "upcoming",
    attendingCount: 0,
    interestedCount: 0,
    notGoingCount: 0,
    viewCount: 0,
    shareCount: 0,
    commentCount: 0,
    isAttending: false,
    isInterested: false,
    isMine: true,
    likedByMe: false,
    bookmarkedByMe: false,
    attendees: [], // ✅ Plus de données mockées
    comments: [],
    tickets: [],
  };

  return (
    <View className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50">
      <View
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-5"
        style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
      >
        <View className="flex items-center justify-between mb-4">
          <Text className="text-white font-bold text-lg">Créer un événement</Text>
          <Pressable
            onPress={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/5"
          >
            <X size={18} className="text-white/60" />
          </Pressable>
        </View>

        <View className="space-y-1">
          <SectionHeader
            title="Informations générales"
            icon={FileText}
            color={color}
            isOpen={sections.general}
            onToggle={() => toggleSection("general")}
            badge="Obligatoire"
          />
          {sections.general && (
            <GeneralSection
              form={form}
              update={update}
              color={color}
              detectingLocation={locating}
              onDetectLocation={detectLocation}
            />
          )}

          <SectionHeader
            title="Médias & Galerie"
            icon={Image}
            color={color}
            isOpen={sections.media}
            onToggle={() => toggleSection("media")}
          />
          {sections.media && (
            <MediaSection
              images={images}
              setImages={setImages}
              videos={videos}
              setVideos={setVideos}
              color={color}
            />
          )}

          <SectionHeader
            title="Billetterie"
            icon={Ticket}
            color={color}
            isOpen={sections.tickets}
            onToggle={() => toggleSection("tickets")}
          />
          {sections.tickets && <TicketsSection event={previewEvent} />}

          <SectionHeader
            title="Programme"
            icon={Clock}
            color={color}
            isOpen={sections.program}
            onToggle={() => toggleSection("program")}
          />
          {sections.program && <ProgramSection event={previewEvent} />}

          <SectionHeader
            title="Participants"
            icon={Users}
            color={color}
            isOpen={sections.attendees}
            onToggle={() => toggleSection("attendees")}
          />
          {sections.attendees && <AttendeesSection event={previewEvent} />}

          <SectionHeader
            title="Organisateur"
            icon={UserPlus}
            color={color}
            isOpen={sections.organizer}
            onToggle={() => toggleSection("organizer")}
          />
          {sections.organizer && <OrganizerSection event={previewEvent} />}

          <SectionHeader
            title="Localisation avancée"
            icon={MapPin}
            color={color}
            isOpen={sections.map}
            onToggle={() => toggleSection("map")}
          />
          {sections.map && <MapSection event={previewEvent} />}

          <SectionHeader
            title="QR Code"
            icon={QrCode}
            color={color}
            isOpen={sections.qr}
            onToggle={() => toggleSection("qr")}
          />
          {sections.qr && <QRSection eventTitle={form.title} />}

          <SectionHeader
            title="Compte à rebours"
            icon={Calendar}
            color={color}
            isOpen={sections.countdown}
            onToggle={() => toggleSection("countdown")}
          />
          {sections.countdown && form.startDate && (
            <CountdownSection startDate={form.startDate} />
          )}

          <SectionHeader
            title="Partage"
            icon={Share2}
            color={color}
            isOpen={sections.share}
            onToggle={() => toggleSection("share")}
          />
          {sections.share && <ShareSection />}

          <SectionHeader
            title="Statistiques"
            icon={BarChart3}
            color={color}
            isOpen={sections.stats}
            onToggle={() => toggleSection("stats")}
          />
          {sections.stats && <StatsSection event={previewEvent} />}

          <SubmitBtn
            color={color}
            label="Publier l'événement"
            onPress={handleSubmit}
            disabled={!form.title || !form.startDate || !form.location}
            loading={isSubmitting}
          />
          <Text className="text-center text-[10px] text-white/20 mt-2">
            Tous les champs marqués d'un * sont obligatoires.
          </Text>
        </View>
      </View>
    </View>
  );
}
