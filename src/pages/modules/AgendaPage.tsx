import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, TextInput } from "react-native";
import { useState } from "react";
import {
  ArrowLeft, Plus, ChevronLeft, ChevronRight, Calendar,
  Clock, Tag, Trash2, X, Check, Bell, Briefcase,
  Heart, Users, User, Edit2, Loader2,
} from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated, AuthLoading } from "@/lib/convex-auth-compat";
import { SignInButton } from "@/components/ui/signin";
import { Skeleton } from "@/components/ui/skeleton";
import type { Id } from "@/convex/_generated/dataModel.d";

interface AgendaPageProps {
  onBack: () => void;
}

type EventCategory = "Personnel" | "Travail" | "Santé" | "Communauté";
type ViewMode = "month" | "week";

const CATEGORY_META: Record<EventCategory, { color: string; bg: string; icon: React.ReactNode }> = {
  Personnel:   { color: "#6366F1", bg: "rgba(99,102,241,0.15)",   icon: <User size={12} /> },
  Travail:     { color: "#F59E0B", bg: "rgba(245,158,11,0.15)",   icon: <Briefcase size={12} /> },
  Santé:       { color: "#10B981", bg: "rgba(16,185,129,0.15)",   icon: <Heart size={12} /> },
  Communauté:  { color: "#EC4899", bg: "rgba(236,72,153,0.15)",   icon: <Users size={12} /> },
};

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatMonthYear(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return (new Date(year, month, 1).getDay() + 6) % 7;
}

const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

type FormState = {
  title: string;
  date: string;
  time: string;
  endTime: string;
  category: EventCategory;
  color: string;
  note: string;
  reminder: boolean;
};

function AgendaInner({ onBack }: AgendaPageProps) {
  const now = new Date();
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"agendaEvents"> | null>(null);
  const [form, setForm] = useState<FormState>({
    title: "", date: todayStr(), time: "09:00", endTime: "10:00",
    category: "Personnel", color: "#6366F1", note: "", reminder: false,
  });

  const events = useQuery(api.utility.listMyAgendaEvents, {}) ?? [];
  const createEvent = useMutation(api.utility.createAgendaEvent);
  const updateEvent = useMutation(api.utility.updateAgendaEvent);
  const deleteEvent = useMutation(api.utility.deleteAgendaEvent);

  const todayEvents = events.filter(e => e.date === todayStr()).sort((a, b) => a.time.localeCompare(b.time));
  const selectedEvents = events.filter(e => e.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time));
  const isLoading = events === undefined;

  function eventsOnDate(dateStr: string) {
    return events.filter(e => e.date === dateStr);
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  }

  function openNew(date?: string) {
    setEditingId(null);
    setForm({ title: "", date: date ?? selectedDate, time: "09:00", endTime: "10:00", category: "Personnel", color: "#6366F1", note: "", reminder: false });
    setShowForm(true);
  }

  function openEdit(id: Id<"agendaEvents">, evt: typeof events[0]) {
    setEditingId(id);
    setForm({ title: evt.title, date: evt.date, time: evt.time, endTime: evt.endTime, category: evt.category, color: evt.color, note: evt.note ?? "", reminder: evt.reminder });
    setShowForm(true);
  }

  async function saveEvent() {
    if (!form.title.trim()) return;
    try {
      if (editingId) {
        await updateEvent({ id: editingId, ...form, note: form.note || undefined });
        UIService.openToast("Événement mis à jour", "success");
      } else {
        await createEvent({ ...form, note: form.note || undefined });
        UIService.openToast("Événement créé", "success");
      }
      setShowForm(false);
    } catch {
      UIService.openToast("Erreur lors de la sauvegarde", "error");
    }
  }

  async function handleDelete(id: Id<"agendaEvents">) {
    try {
      await deleteEvent({ id });
      UIService.openToast("Événement supprimé", "success");
      setShowForm(false);
    } catch {
      UIService.openToast("Erreur lors de la suppression", "error");
    }
  }

  function getWeekDates(): string[] {
    const d = new Date(selectedDate);
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
    return Array.from({ length: 7 }, (_, i) => {
      const nd = new Date(d);
      nd.setDate(d.getDate() + i);
      return nd.toISOString().slice(0, 10);
    });
  }

  const weekDates = getWeekDates();

  return (
    <View className="min-h-screen bg-black text-white" style={{  }}>
      {/* Header */}
      <View className="sticky top-0 z-20 bg-black/80 border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <Pressable onPress={onBack} className="p-2 rounded-xl">
          <ArrowLeft size={20} />
        </Pressable>
        <View className="text-center">
          <View className="font-bold text-lg"><Text>Agenda</Text></View>
          <View className="text-xs text-white/50"><Text>Personnel ·</Text>{events.length} <Text>événement</Text>{events.length !== 1 ? "s" : ""}</View>
        </View>
        <Pressable onPress={() => openNew()} className="p-2 rounded-xl bg-indigo-500/20">
          <Plus size={20} className="text-indigo-400" />
        </Pressable>
      </View>

      {/* Today badge */}
      {todayEvents.length > 0 && (
        <View
          className="mx-4 mt-3 p-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 flex items-center gap-2">
          <Bell size={14} className="text-indigo-400 shrink-0" />
          <Text className="text-sm text-white/80">
            <Text className="font-semibold text-indigo-300">{todayEvents.length} événement{todayEvents.length > 1 ? "s" : ""}</Text> aujourd&apos;hui
            {" — "}{todayEvents.map(e => e.title).join(", ")}
          </Text>
        </View>
      )}

      {/* View toggle */}
      <View className="flex mx-4 mt-3 p-1 rounded-xl bg-white/5 border border-white/10">
        {(["month", "week"] as ViewMode[]).map(v => (
          <Pressable key={v} onPress={() => setViewMode(v)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === v ? "bg-white/15 text-white" : "text-white/40 hover:text-white/70"}`}>
            {v === "month" ? "Mois" : "Semaine"}
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <View className="mx-4 mt-4 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </View>
      ) : (
        <>
          {/* Month view */}
          {viewMode === "month" && (
            <View className="mx-4 mt-3">
              <View className="flex items-center justify-between mb-3">
                <Pressable onPress={prevMonth} className="p-2 rounded-xl"><ChevronLeft size={18} /></Pressable>
                <Text className="font-semibold capitalize">{formatMonthYear(year, month)}</Text>
                <Pressable onPress={nextMonth} className="p-2 rounded-xl"><ChevronRight size={18} /></Pressable>
              </View>
              <View className="mb-1">
                {DAY_LABELS.map(d => <View key={d} className="text-center text-xs text-white/30 py-1">{d}</View>)}
              </View>
              <View className="gap-0.5">
                {Array.from({ length: getFirstDayOfMonth(year, month) }).map((_, i) => <View key={`blank-${i}`} className="aspect-square" />)}
                {Array.from({ length: getDaysInMonth(year, month) }, (_, i) => {
                  const day = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const evts = eventsOnDate(dateStr);
                  const isToday = dateStr === todayStr();
                  const isSelected = dateStr === selectedDate;
                  return (
                    <Pressable key={day} onPress={() => setSelectedDate(dateStr)}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all ${isSelected ? "bg-indigo-500 text-white" : isToday ? "bg-white/10 text-indigo-300" : "hover:bg-white/5 text-white/70"}`}>
                      <Text className="text-sm font-medium">{day}</Text>
                      {evts.length > 0 && (
                        <View className="flex gap-0.5 mt-0.5">
                          {evts.slice(0, 3).map(e => <View key={e._id} className="w-1 h-1 rounded-full" style={{ backgroundColor: e.color }} />)}
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Week view */}
          {viewMode === "week" && (
            <View className="mx-4 mt-3">
              <View className="flex items-center justify-between mb-2">
                <Pressable onPress={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 7); setSelectedDate(d.toISOString().slice(0, 10)); }} className="p-2 rounded-xl"><ChevronLeft size={18} /></Pressable>
                <Text className="text-sm font-medium text-white/60">
                  {new Date(weekDates[0]).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} – {new Date(weekDates[6]).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </Text>
                <Pressable onPress={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 7); setSelectedDate(d.toISOString().slice(0, 10)); }} className="p-2 rounded-xl"><ChevronRight size={18} /></Pressable>
              </View>
              <View className="gap-1">
                {weekDates.map((dateStr, i) => {
                  const evts = eventsOnDate(dateStr);
                  const isToday = dateStr === todayStr();
                  const isSelected = dateStr === selectedDate;
                  const dayNum = new Date(dateStr).getDate();
                  return (
                    <Pressable key={dateStr} onPress={() => setSelectedDate(dateStr)}
                      className={`rounded-xl p-1.5 flex flex-col items-center gap-0.5 transition-all min-h-[60px] ${isSelected ? "bg-indigo-500/30 border border-indigo-500/50" : isToday ? "bg-white/10" : "hover:bg-white/5"}`}>
                      <Text className="text-xs text-white/40">{DAY_LABELS[i]}</Text>
                      <Text className={`text-sm font-bold ${isToday ? "text-indigo-300" : "text-white"}`}>{dayNum}</Text>
                      <View className="flex flex-col gap-0.5 w-full">
                        {evts.slice(0, 2).map(e => <View key={e._id} className="w-full h-1 rounded-full" style={{ backgroundColor: e.color }} />)}
                        {evts.length > 2 && <Text className="text-xs text-white/30">+{evts.length - 2}</Text>}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Selected day events */}
          <View className="mx-4 mt-4 mb-24">
            <View className="flex items-center justify-between mb-2">
              <Text className="font-semibold text-white/80">
                {new Date(selectedDate + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
              </Text>
              <Pressable onPress={() => openNew(selectedDate)} className="text-xs text-indigo-400 flex items-center gap-1">
                <Plus size={14} /> <Text>Ajouter</Text></Pressable>
            </View>
            <>
              {selectedEvents.length === 0 ? (
                <View key="empty"
                  className="text-center py-10 text-white/30">
                  <Calendar size={32} className="mx-auto mb-2 opacity-30" />
                  <Text className="text-sm">Aucun événement ce jour</Text>
                  <Pressable onPress={() => openNew(selectedDate)} className="mt-3 text-xs text-indigo-400"><Text>+ Créer un événement</Text></Pressable>
                </View>
              ) : (
                selectedEvents.map((evt, i) => (
                  <Pressable key={evt._id}
                    onPress={() => openEdit(evt._id, evt)}
                    className="mb-2 p-3 rounded-2xl border"
                    style={{ borderColor: `${evt.color}30`, backgroundColor: `${evt.color}10` }}>
                    <View className="flex items-start justify-between">
                      <View className="flex items-start gap-2 flex-1 min-w-0">
                        <View className="w-2 h-full min-h-[36px] rounded-full shrink-0 mt-0.5" style={{ backgroundColor: evt.color }} />
                        <View className="min-w-0">
                          <Text className="font-semibold text-sm truncate">{evt.title}</Text>
                          <View className="flex items-center gap-2 mt-0.5">
                            <Text className="text-xs text-white/50 flex items-center gap-1"><Clock size={10} /> {evt.time} – {evt.endTime}</Text>
                            <Text className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: CATEGORY_META[evt.category].bg, color: evt.color }}>{evt.category}</Text>
                          </View>
                          {evt.note && <Text className="text-xs text-white/40 mt-1 truncate">{evt.note}</Text>}
                        </View>
                      </View>
                      <View className="flex items-center gap-1 shrink-0 ml-2">
                        {evt.reminder && <Bell size={12} className="text-yellow-400" />}
                        <Edit2 size={12} className="text-white/30" />
                      </View>
                    </View>
                  </Pressable>
                ))
              )}
            </>

            <View className="mt-6 p-3 rounded-2xl bg-white/5 border border-white/10">
              <Text className="text-xs text-white/40 mb-2 font-medium uppercase tracking-wide">Catégories</Text>
              <View className="gap-2">
                {(Object.entries(CATEGORY_META) as [EventCategory, typeof CATEGORY_META[EventCategory]][]).map(([cat, meta]) => (
                  <View key={cat} className="flex items-center gap-2">
                    <View className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                    <Text className="text-xs text-white/60">{cat}</Text>
                  </View>
                ))}
              </View>
              <View className="mt-2 flex items-center gap-2">
                <Tag size={10} className="text-white/30" />
                <Text className="text-xs text-white/30">Données synchronisées en temps réel</Text>
              </View>
            </View>
          </View>
        </>
      )}

      {/* Form modal */}
      <>
        {showForm && (
          <Pressable
            className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center"
            onPress={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
            <View
              className="w-full max-w-lg bg-[#111] rounded-t-3xl border-t border-white/10 p-5 pb-8 max-h-[85vh] overflow-y-auto">
              <View className="flex items-center justify-between mb-4">
                <Text className="font-bold text-lg">{editingId ? "Modifier" : "Nouvel événement"}</Text>
                <Pressable onPress={() => setShowForm(false)} className="p-2 rounded-xl"><X size={18} /></Pressable>
              </View>

              <Text className="block text-xs text-white/50 mb-1">Titre *</Text>
              <TextInput value={form.title} onChangeText={text => setForm(f => ({ ...f, title: text }))}
                placeholder="Ex: Réunion client, RDV médecin…"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 mb-3" />

              <View className="gap-2 mb-3">
                <View className="">
                  <Text className="block text-xs text-white/50 mb-1">Date</Text>
                  <TextInput value={form.date} onChangeText={text => setForm(f => ({ ...f, date: text }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-2.5 text-xs text-white" />
                </View>
                <View>
                  <Text className="block text-xs text-white/50 mb-1">Début</Text>
                  <TextInput value={form.time} onChangeText={text => setForm(f => ({ ...f, time: text }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-2.5 text-xs text-white" />
                </View>
                <View>
                  <Text className="block text-xs text-white/50 mb-1">Fin</Text>
                  <TextInput value={form.endTime} onChangeText={text => setForm(f => ({ ...f, endTime: text }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-2.5 text-xs text-white" />
                </View>
              </View>

              <Text className="block text-xs text-white/50 mb-1">Catégorie</Text>
              <View className="gap-2 mb-3">
                {(Object.keys(CATEGORY_META) as EventCategory[]).map(cat => (
                  <Pressable key={cat} onPress={() => setForm(f => ({ ...f, category: cat, color: CATEGORY_META[cat].color }))}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${form.category === cat ? "border-current" : "border-white/10 text-white/50 hover:text-white/70"}`}
                    style={{ backgroundColor: form.category === cat ? CATEGORY_META[cat].bg : undefined }}>
                    {CATEGORY_META[cat].icon} {cat}
                  </Pressable>
                ))}
              </View>

              <Text className="block text-xs text-white/50 mb-1">Note (optionnel)</Text>
              <TextInput value={form.note} onChangeText={text => setForm(f => ({ ...f, note: text }))}
                placeholder="Détails supplémentaires…"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 mb-3"  multiline textAlignVertical="top"/>

              <Pressable onPress={() => setForm(f => ({ ...f, reminder: !f.reminder }))}
                className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border mb-4 transition-all ${form.reminder ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-400" : "border-white/10 text-white/40 hover:text-white/60"}`}>
                <Bell size={14} /> <Text className="text-sm"><Text>Rappel activé</Text></Text>
                {form.reminder && <Check size={14} className="ml-auto" />}
              </Pressable>

              <View className="flex gap-2">
                {editingId && (
                  <Pressable onPress={() => handleDelete(editingId)}
                    className="p-2.5 rounded-xl bg-red-500/15 text-red-400">
                    <Trash2 size={16} />
                  </Pressable>
                )}
                <Pressable onPress={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 text-white/70 text-sm">
                  <Text>Annuler</Text></Pressable>
                <Pressable onPress={saveEvent} disabled={!form.title.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-semibold disabled:opacity-40">
                  {editingId ? "Enregistrer" : "Créer"}
                </Pressable>
              </View>
            </View>
          </Pressable>
        )}
      </>
    </View>
  );
}

export default function AgendaPage({ onBack }: AgendaPageProps) {
  return (
    <>
      <Authenticated><AgendaInner onBack={onBack} /></Authenticated>
      <Unauthenticated>
        <View className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 px-6">
          <Pressable onPress={onBack} className="self-start p-2 rounded-xl absolute top-4 left-4"><ArrowLeft size={20} /></Pressable>
          <Calendar size={48} className="text-indigo-400" />
          <Text className="text-lg font-bold">Connectez-vous pour accéder à votre agenda</Text>
          <SignInButton />
        </View>
      </Unauthenticated>
      <AuthLoading>
        <View className="min-h-screen bg-black flex items-center justify-center"><Loader2 size={28} className="text-white/40 animate-spin" /></View>
      </AuthLoading>
    </>
  );
}
