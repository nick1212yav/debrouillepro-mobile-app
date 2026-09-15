import { View, Pressable, Text, TextInput } from "react-native";
import { useState, useMemo } from "react";
import {
  ArrowLeft, Lock, Plus, Search, X, Trash2, Edit2,
  Shield, AlertTriangle, CheckCircle, Clock,
  CreditCard, Heart, Briefcase, FileText, FolderOpen,
  ChevronDown, ChevronUp, Eye, EyeOff, Filter,
  CalendarClock, SortAsc, SortDesc, Loader2,
} from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated, AuthLoading } from "@/lib/convex-auth-compat";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

type DocCategory = "Identité" | "Santé" | "Finances" | "Emploi" | "Autres";

const CATEGORY_META: Record<DocCategory, { color: string; bg: string; icon: React.ElementType }> = {
  Identité:  { color: "#6366F1", bg: "rgba(99,102,241,0.15)",  icon: CreditCard },
  Santé:     { color: "#10B981", bg: "rgba(16,185,129,0.15)",  icon: Heart },
  Finances:  { color: "#F59E0B", bg: "rgba(245,158,11,0.15)",  icon: FileText },
  Emploi:    { color: "#8B5CF6", bg: "rgba(139,92,246,0.15)",  icon: Briefcase },
  Autres:    { color: "#6B7280", bg: "rgba(107,114,128,0.15)", icon: FolderOpen },
};

const CATEGORIES = Object.keys(CATEGORY_META) as DocCategory[];

function todayStr(): string { return new Date().toISOString().slice(0, 10); }

function daysUntil(dateStr: string): number {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.round((target.getTime() - now.getTime()) / 86_400_000);
}

function expiryStatus(expiry?: string): "ok" | "warning" | "expired" | "none" {
  if (!expiry) return "none";
  const days = daysUntil(expiry);
  if (days < 0) return "expired";
  if (days <= 30) return "warning";
  return "ok";
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

interface DocumentsPageProps { onBack: () => void; }

const EMPTY_FORM = { name: "", category: "Identité" as DocCategory, reference: "", expiry: "", note: "" };

function DocumentsInner({ onBack }: DocumentsPageProps) {
  const docs = useQuery(api.utility.listMyVaultDocs, {});
  const createDoc = useMutation(api.utility.createVaultDoc);
  const updateDoc = useMutation(api.utility.updateVaultDoc);
  const deleteDoc = useMutation(api.utility.deleteVaultDoc);

  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<DocCategory | "Tout">("Tout");
  const [sortBy, setSortBy] = useState<"name" | "expiry" | "category">("category");
  const [sortAsc, setSortAsc] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<Id<"vaultDocuments"> | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [maskedIds, setMaskedIds] = useState<Set<string>>(new Set());
  const [showFilter, setShowFilter] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const isLoading = docs === undefined;
  const docList = docs ?? [];

  const alerts = useMemo(() =>
    docList.filter(d => d.expiry && ["warning", "expired"].includes(expiryStatus(d.expiry ?? ""))),
    [docList]
  );

  const filtered = useMemo(() => {
    let list = docList.filter(d => {
      const q = search.toLowerCase();
      const matchQ = !q || d.name.toLowerCase().includes(q) || (d.reference ?? "").toLowerCase().includes(q) || d.category.toLowerCase().includes(q);
      const matchCat = filterCat === "Tout" || d.category === filterCat;
      return matchQ && matchCat;
    });
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") cmp = a.name.localeCompare(b.name);
      else if (sortBy === "category") cmp = a.category.localeCompare(b.category);
      else if (sortBy === "expiry") { const ae = a.expiry ?? "9999"; const be = b.expiry ?? "9999"; cmp = ae.localeCompare(be); }
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [docList, search, filterCat, sortBy, sortAsc]);

  function openNew() { setEditId(null); setForm({ ...EMPTY_FORM }); setShowForm(true); }
  function openEdit(id: Id<"vaultDocuments">, doc: typeof docList[0]) {
    setEditId(id);
    setForm({ name: doc.name, category: doc.category, reference: doc.reference ?? "", expiry: doc.expiry ?? "", note: doc.note ?? "" });
    setShowForm(true);
  }

  async function saveDoc() {
    if (!form.name.trim()) return;
    try {
      if (editId) {
        await updateDoc({ id: editId, ...form, reference: form.reference || undefined, expiry: form.expiry || undefined, note: form.note || undefined });
        toast.success("Document mis à jour");
      } else {
        await createDoc({ ...form, reference: form.reference || undefined, expiry: form.expiry || undefined, note: form.note || undefined, createdAt: todayStr() });
        toast.success("Document ajouté");
      }
      setShowForm(false);
    } catch { toast.error("Erreur lors de la sauvegarde"); }
  }

  async function handleDelete(id: Id<"vaultDocuments">) {
    try {
      await deleteDoc({ id });
      toast.success("Document supprimé");
      setDeleteConfirmId(null);
      setExpandedId(null);
    } catch { toast.error("Erreur lors de la suppression"); }
  }

  function toggleMask(id: string) {
    setMaskedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }

  const catGroups = CATEGORIES.map(cat => ({ cat, items: filtered.filter(d => d.category === cat) })).filter(g => g.items.length > 0);

  return (
    <View className="min-h-screen bg-black text-white" style={{ fontFamily: "var(--font-body, sans-serif)" }}><View className="sticky top-0 z-20 bg-black/90 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between"><Pressable onPress={onBack} className="p-2 rounded-xl transition-colors"><ArrowLeft size={20} /></Pressable><View className="text-center"><View className="flex items-center gap-2 justify-center"><Lock size={14} className="text-indigo-400" /><Text className="font-bold text-lg">Coffre-fort</Text></View><View className="text-xs text-white/40">{docList.length}<Text>document</Text>{docList.length !== 1 ? "s" : ""}<Text>stockés</Text></View></View><Pressable onPress={openNew} className="p-2 rounded-xl bg-indigo-500/20 transition-colors"><Plus size={20} className="text-indigo-400" /></Pressable></View><View className="px-4 pb-24"><View initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 p-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/8 flex items-center gap-2.5"><Shield size={16} className="text-indigo-400 shrink-0" /><View className="flex-1 min-w-0"><Text className="text-xs font-semibold text-indigo-300">Stockage sécurisé Hercules</Text><Text className="text-[10px] text-white/40">Vos métadonnées sont chiffrées et synchronisées</Text></View><View className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/15 border border-green-500/25"><View className="w-1.5 h-1.5 rounded-full bg-green-400" /><Text className="text-[9px] font-semibold text-green-400">Sécurisé</Text></View></View><View>{alerts.length > 0 && (
            <View initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 overflow-hidden">
              <View className="p-3 rounded-2xl border border-yellow-500/30 bg-yellow-500/8"><View className="flex items-center gap-2 mb-2"><AlertTriangle size={14} className="text-yellow-400 shrink-0" /><Text className="text-xs font-semibold text-yellow-300">{alerts.length}document{alerts.length > 1 ? "s" : ""}à renouveler</Text></View>{alerts.map(doc => {
                  const days = daysUntil(doc.expiry!);
                  const expired = days < 0;
                  return (
                    <View key={doc._id} className="flex items-center justify-between py-1.5 border-t border-white/5 first:border-t-0"><Text className="text-xs text-white/70">{doc.name}</Text><Text className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${expired ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>{expired ? `Expiré il y a ${Math.abs(days)}j` : `Expire dans ${days}j`}</Text></View>
                  );
                })}</View>
            </View>
          )}</View>{isLoading ? (
          <View className="mt-3 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</View>
        ) : (
          <>
            <View className="gap-2 mt-3">{CATEGORIES.slice(0, 3).map(cat => {
                const meta = CATEGORY_META[cat];
                const count = docList.filter(d => d.category === cat).length;
                const Icon = meta.icon;
                return (
                  <Pressable key={cat} onPress={() => setFilterCat(filterCat === cat ? "Tout" : cat)} className="p-2.5 rounded-2xl border transition-all text-center" style={{ backgroundColor: filterCat === cat ? meta.bg : "rgba(255,255,255,0.04)", borderColor: filterCat === cat ? `${meta.color}50` : "rgba(255,255,255,0.08)" }}><Icon size={16} className="mx-auto mb-1" style={{  }} /><View className="text-lg font-black text-white">{count}</View><View className="text-[9px] text-white/40">{cat}</View></Pressable>
                );
              })}</View>

            <View className="flex gap-2 mt-3"><View className="flex-1 relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" /><TextInput value={search} onChangeText={value => setSearch(value)} placeholder="Rechercher un document…" className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/40" /></View><Pressable onPress={() => setShowFilter(f => !f)} className={`p-2.5 rounded-xl border transition-all cursor-pointer ${showFilter ? "bg-indigo-500/20 border-indigo-500/40" : "bg-white/5 border-white/10 hover:bg-white/10"}`}><Filter size={16} className={showFilter ? "text-indigo-400" : "text-white/50"} /></Pressable></View>

<View>
              {showFilter && (
                <View initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <View className="mt-2 p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3"><View><Text className="text-[10px] text-white/40 uppercase tracking-wider mb-1.5">Catégorie</Text><View className="flex flex-wrap gap-1.5">{(["Tout", ...CATEGORIES] as (DocCategory | "Tout")[]).map(c => (
                          <Pressable key={c} onPress={() => setFilterCat(c)} className="px-2.5 py-1 rounded-full text-xs border transition-all" style={{ backgroundColor: filterCat === c ? (c !== "Tout" ? CATEGORY_META[c as DocCategory].bg : "rgba(99,102,241,0.2)") : "transparent", borderColor: filterCat === c ? (c !== "Tout" ? CATEGORY_META[c as DocCategory].color + "60" : "#6366F1") : "rgba(255,255,255,0.12)" }}>{c}</Pressable>
                        ))}</View></View><View><Text className="text-[10px] text-white/40 uppercase tracking-wider mb-1.5">Trier par</Text><View className="flex gap-2">{(["name", "category", "expiry"] as const).map(s => (
                          <Pressable key={s} onPress={() => { if (sortBy === s) setSortAsc(a => !a); else { setSortBy(s); setSortAsc(true); } }} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border transition-all cursor-pointer ${sortBy === s ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300" : "border-white/10 text-white/40 hover:text-white/70"}`}>{{ name: "Nom", category: "Catégorie", expiry: "Expiration" }[s]}{sortBy === s && (sortAsc ? <SortAsc size={10} /> : <SortDesc size={10} />)}</Pressable>
                        ))}</View></View></View>
                </View>
              )}
            </View>

            <View className="mt-3">{filtered.length === 0 ? (
                <View className="text-center py-12 text-white/30"><FolderOpen size={36} className="mx-auto mb-2 opacity-30" /><Text className="text-sm">Aucun document trouvé</Text><Pressable onPress={openNew} className="mt-3 text-xs text-indigo-400 transition-colors"><Text>+ Ajouter un document</Text></Pressable></View>
              ) : (
                filterCat === "Tout"
                  ? catGroups.map((group, gi) => (
                    <View key={group.cat} className="mb-4"><View className="flex items-center gap-2 mb-2">{(() => { const Icon = CATEGORY_META[group.cat].icon; return <Icon size={12} style={{  }} />; })()}<Text className="text-[10px] font-bold uppercase tracking-widest" style={{ color: CATEGORY_META[group.cat].color }}>{group.cat}</Text><Text className="text-[10px] text-white/30">({group.items.length})</Text></View>{group.items.map((doc, i) => (
                        <DocCard key={doc._id} doc={doc} index={gi * 10 + i}
                          expanded={expandedId === doc._id} masked={maskedIds.has(doc._id)} confirmDelete={deleteConfirmId === doc._id}
                          onToggle={() => setExpandedId(expandedId === doc._id ? null : doc._id)}
                          onEdit={() => openEdit(doc._id, doc)} onDelete={() => setDeleteConfirmId(doc._id)}
                          onDeleteConfirm={() => handleDelete(doc._id)} onDeleteCancel={() => setDeleteConfirmId(null)}
                          onToggleMask={() => toggleMask(doc._id)} />
                      ))}</View>
                  ))
                  : filtered.map((doc, i) => (
                    <DocCard key={doc._id} doc={doc} index={i}
                      expanded={expandedId === doc._id} masked={maskedIds.has(doc._id)} confirmDelete={deleteConfirmId === doc._id}
                      onToggle={() => setExpandedId(expandedId === doc._id ? null : doc._id)}
                      onEdit={() => openEdit(doc._id, doc)} onDelete={() => setDeleteConfirmId(doc._id)}
                      onDeleteConfirm={() => handleDelete(doc._id)} onDeleteCancel={() => setDeleteConfirmId(null)}
                      onToggleMask={() => toggleMask(doc._id)} />
                  ))
              )}</View>
          </>
        )}</View><View>{showForm && (
          <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end justify-center" onPress={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
            <View initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="w-full max-w-lg bg-[#0d0d1a] rounded-t-3xl border-t border-white/10 p-5 pb-8 max-h-[90vh] overflow-y-auto">
              <View className="flex items-center justify-between mb-5"><View className="flex items-center gap-2"><Lock size={16} className="text-indigo-400" /><Text className="font-bold text-lg">{editId ? "Modifier le document" : "Nouveau document"}</Text></View><Pressable onPress={() => setShowForm(false)} className="p-2 rounded-xl transition-colors"><X size={18} /></Pressable></View>
              <Text className="block text-xs text-white/45 mb-1">Nom du document *</Text>
              <TextInput value={form.name} onChangeText={value => setForm(f => ({ ...f, name: value }))} placeholder="Ex: Passeport, Carnet de santé…" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 mb-3 focus:outline-none focus:border-indigo-500/40" />
              <Text className="block text-xs text-white/45 mb-1">Catégorie</Text>
              <View className="gap-1.5 mb-3">{CATEGORIES.map(cat => {
                  const meta = CATEGORY_META[cat]; const Icon = meta.icon;
                  return (
                    <Pressable key={cat} onPress={() => setForm(f => ({ ...f, category: cat }))} className="flex flex-col items-center gap-1 py-2 rounded-xl border text-xs transition-all" style={{ backgroundColor: form.category === cat ? meta.bg : "transparent", borderColor: form.category === cat ? `${meta.color}60` : "rgba(255,255,255,0.08)" }}><Icon size={14} />{cat}</Pressable>
                  );
                })}</View>
              <Text className="block text-xs text-white/45 mb-1">Numéro / Référence</Text>
              <TextInput value={form.reference} onChangeText={value => setForm(f => ({ ...f, reference: value }))} placeholder="Ex: CI-2024-00123456" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 mb-3 focus:outline-none focus:border-indigo-500/40" />
              <Text className="block text-xs text-white/45 mb-1">Date d&apos;expiration (optionnel)</Text>
              <TextInput value={form.expiry} onChangeText={value => setForm(f => ({ ...f, expiry: value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white mb-3 focus:outline-none focus:border-indigo-500/40" />
              <Text className="block text-xs text-white/45 mb-1">Note (optionnel)</Text>
              <TextInput value={form.note} onChangeText={value => setForm(f => ({ ...f, note: value }))} placeholder="Informations supplémentaires…" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 mb-4 focus:outline-none focus:border-indigo-500/40" multiline textAlignVertical="top" />
              <View className="flex gap-2"><Pressable onPress={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl bg-white/8 text-white/60 transition-colors text-sm"><Text>Annuler</Text></Pressable><Pressable onPress={saveDoc} disabled={!form.name.trim()} className="flex-1 py-2.5 rounded-xl bg-indigo-500 text-white transition-colors text-sm font-semibold disabled:opacity-40">{editId ? "Enregistrer" : "Ajouter"}</Pressable></View>
            </View>
          </View>
        )}</View></View>
  );
}

interface DocCardProps {
  doc: { _id: string; name: string; category: DocCategory; reference?: string; expiry?: string; note?: string; createdAt: string };
  index: number; expanded: boolean; masked: boolean; confirmDelete: boolean;
  onToggle: () => void; onEdit: () => void; onDelete: () => void;
  onDeleteConfirm: () => void; onDeleteCancel: () => void; onToggleMask: () => void;
}

function DocCard({ doc, index, expanded, masked, confirmDelete, onToggle, onEdit, onDelete, onDeleteConfirm, onDeleteCancel, onToggleMask }: DocCardProps) {
  const meta = CATEGORY_META[doc.category];
  const status = expiryStatus(doc.expiry);
  const Icon = meta.icon;
  const statusIcon = status === "expired" ? <AlertTriangle size={12} className="text-red-400" /> : status === "warning" ? <CalendarClock size={12} className="text-yellow-400" /> : status === "ok" ? <CheckCircle size={12} className="text-green-400" /> : null;
  const days = doc.expiry ? daysUntil(doc.expiry) : null;

  return (
    <View initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="mb-2 rounded-2xl border overflow-hidden transition-all" style={{ borderColor: expanded ? `${meta.color}35` : "rgba(255,255,255,0.07)", backgroundColor: expanded ? `${meta.color}08` : "rgba(255,255,255,0.03)" }}>
      <Pressable onPress={onToggle} className="w-full flex items-center gap-3 px-3 py-3 transition-colors"><View className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: meta.bg, borderStyle: "solid" }}><Icon size={16} style={{  }} /></View><View className="flex-1 min-w-0 text-left"><Text className="font-semibold text-sm text-white truncate">{doc.name}</Text><View className="flex items-center gap-1.5 mt-0.5"><Text className="text-[10px] text-white/40">{doc.category}</Text>{statusIcon && <>{statusIcon}</>}{status === "warning" && days !== null && <Text className="text-[10px] text-yellow-400">· {days}j</Text>}{status === "expired" && <Text className="text-[10px] text-red-400">· Expiré</Text>}</View></View><View className="flex items-center gap-1 flex-shrink-0"><Lock size={11} className="text-white/20" />{expanded ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}</View></Pressable>
<View>
        {expanded && (
          <View initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <View className="px-4 pb-4 flex flex-col gap-2 border-t border-white/6">{doc.reference && (
                <View className="flex items-center justify-between mt-3"><Text className="text-xs text-white/40">Référence</Text><View className="flex items-center gap-2"><Text className="text-xs font-mono text-white/70">{masked ? "••••••••••" : doc.reference}</Text><Pressable onPress={onToggleMask} className="p-1 rounded transition-colors">{masked ? <Eye size={12} className="text-white/40" /> : <EyeOff size={12} className="text-white/40" />}</Pressable></View></View>
              )}{doc.expiry && (
                <View className="flex items-center justify-between"><Text className="text-xs text-white/40">Expiration</Text><Text className={`text-xs font-semibold ${status === "expired" ? "text-red-400" : status === "warning" ? "text-yellow-400" : "text-green-400"}`}>{formatDate(doc.expiry)}{days !== null && ` (${days < 0 ? `${Math.abs(days)}j dépassé` : `dans ${days}j`})`}</Text></View>
              )}{doc.note && (
                <View className="flex items-start justify-between gap-4"><Text className="text-xs text-white/40 shrink-0">Note</Text><Text className="text-xs text-white/60 text-right">{doc.note}</Text></View>
              )}<View className="flex items-center justify-between"><Text className="text-xs text-white/30">Ajouté le</Text><Text className="text-xs text-white/30 flex items-center gap-1"><Clock size={10} />{formatDate(doc.createdAt)}</Text></View>{!confirmDelete ? (
                <View className="flex gap-2 mt-1"><Pressable onPress={onEdit} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/8 text-white/60 transition-colors text-xs"><Edit2 size={12} /><Text>Modifier</Text></Pressable><Pressable onPress={onDelete} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500/10 text-red-400 transition-colors text-xs"><Trash2 size={12} /><Text>Supprimer</Text></Pressable></View>
              ) : (
                <View className="mt-1 p-2.5 rounded-xl border border-red-500/30 bg-red-500/8"><Text className="text-xs text-red-300 text-center mb-2">Supprimer définitivement ?</Text><View className="flex gap-2"><Pressable onPress={onDeleteCancel} className="flex-1 py-1.5 rounded-lg bg-white/8 text-white/50 text-xs transition-colors">Annuler</Pressable><Pressable onPress={onDeleteConfirm} className="flex-1 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold transition-colors">Supprimer</Pressable></View></View>
              )}</View>
          </View>
        )}
      </View>
    </View>
  );
}

export default function DocumentsPage({ onBack }: DocumentsPageProps) {
  return (
    <>
      <Authenticated><DocumentsInner onBack={onBack} /></Authenticated>
      <Unauthenticated>
        <View className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 px-6">
          <Pressable onPress={onBack} className="absolute top-4 left-4 p-2 rounded-xl transition-colors"><ArrowLeft size={20} /></Pressable>
          <Lock size={48} className="text-indigo-400" />
          <Text className="text-lg font-bold">Connectez-vous pour accéder à votre coffre-fort</Text>
          <SignInButton />
        </View>
      </Unauthenticated>
      <AuthLoading>
        <View className="min-h-screen bg-black flex items-center justify-center"><Loader2 size={28} className="text-white/40 animate-spin" /></View>
      </AuthLoading>
    </>
  );
}
