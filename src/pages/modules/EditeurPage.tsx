import { Text, View, Pressable, TextInput } from "react-native";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  ArrowLeft, Bold, Italic, Underline, List, ListOrdered,
  Quote, Heading1, Heading2, AlignLeft, AlignCenter, AlignRight,
  Type, Eye, EyeOff, Save, Trash2, FileText, Sparkles,
  Clock, CheckCircle, X, Cloud,
  Megaphone, ShoppingBag, Star, BookOpen, MessageSquare,
  Hash,
} from "lucide-react-native";
import { toast } from "sonner";
import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

// ── Types ─────────────────────────────────────────────────────────────────────
type FormatCmd =
  | "bold" | "italic" | "underline"
  | "insertUnorderedList" | "insertOrderedList"
  | "formatBlock" | "justifyLeft" | "justifyCenter" | "justifyRight";

type TemplateId = "annonce" | "promo" | "temoignage" | "article" | "evenement" | "offre";

type Draft = {
  id: string;
  convexId?: Id<"contentDrafts">;
  title: string;
  html: string;
  savedAt: string; // ISO
};

// ── Templates ─────────────────────────────────────────────────────────────────
type Template = {
  id: TemplateId;
  label: string;
  icon: React.ReactNode;
  color: string;
  html: string;
  description: string;
};

const TEMPLATES: Template[] = [
  {
    id: "annonce",
    label: "Annonce",
    icon: <Megaphone size={18} />,
    color: "#3B82F6",
    description: "Partagez une nouvelle importante",
    html: `<h1>📢 Grande annonce !</h1><p>Chers amis et abonnés,</p><p>Nous sommes ravis de vous annoncer que <strong>[Votre annonce ici]</strong>.</p><p>Cette nouvelle marque une étape importante pour nous et nous espérons que vous serez aussi enthousiastes que nous !</p><blockquote>« [Votre citation inspirante] »</blockquote><p>Pour plus d'informations, n'hésitez pas à nous contacter.</p>`,
  },
  {
    id: "promo",
    label: "Promotion",
    icon: <ShoppingBag size={18} />,
    color: "#F97316",
    description: "Mettez en avant une offre spéciale",
    html: `<h1>🔥 Offre spéciale limitée !</h1><p><strong>Ne manquez pas cette opportunité unique !</strong></p><h2>Ce que vous obtenez :</h2><ul><li>✅ [Avantage 1]</li><li>✅ [Avantage 2]</li><li>✅ [Avantage 3]</li></ul><p>Valable jusqu'au <strong>[date]</strong>. Quantité limitée !</p><p><em>Utilisez le code : <strong>PROMO2024</strong></em></p>`,
  },
  {
    id: "temoignage",
    label: "Témoignage",
    icon: <Star size={18} />,
    color: "#F59E0B",
    description: "Partagez un avis client",
    html: `<h2>⭐ Témoignage client</h2><blockquote>« [Le témoignage du client ici — décrivez l'expérience positive en détail pour plus d'impact.] »</blockquote><p><strong>— [Nom du client]</strong>, [Ville/Pays]</p><p>Résultat obtenu : <strong>[Résultat concret]</strong> en seulement <strong>[durée]</strong> !</p><p>Vous aussi, rejoignez nos clients satisfaits 👇</p>`,
  },
  {
    id: "article",
    label: "Article",
    icon: <BookOpen size={18} />,
    color: "#8B5CF6",
    description: "Rédigez un article de blog",
    html: `<h1>[Titre accrocheur de votre article]</h1><p><em>Par [Auteur] · [Date] · [Temps de lecture] min</em></p><h2>Introduction</h2><p>[Introduisez votre sujet de manière captivante. Posez une question ou partagez une statistique surprenante.]</p><h2>Développement</h2><p>[Corps de votre article. Développez vos idées avec des exemples concrets et des données.]</p><ul><li>[Point clé 1]</li><li>[Point clé 2]</li><li>[Point clé 3]</li></ul><h2>Conclusion</h2><p>[Résumez les points clés et invitez vos lecteurs à réagir.]</p>`,
  },
  {
    id: "evenement",
    label: "Événement",
    icon: <Hash size={18} />,
    color: "#EC4899",
    description: "Annoncez un événement",
    html: `<h1>🎉 [Nom de l'événement]</h1><p><strong>📅 Date :</strong> [Jour, DD Mois YYYY]</p><p><strong>🕐 Heure :</strong> [HH:MM]</p><p><strong>📍 Lieu :</strong> [Adresse complète]</p><h2>Au programme</h2><ul><li>🎤 [Activité 1]</li><li>🎵 [Activité 2]</li><li>🍽️ [Activité 3]</li></ul><p>Entrée : <strong>[Gratuite / XX FCFA]</strong></p><p>Réservez votre place maintenant !</p>`,
  },
  {
    id: "offre",
    label: "Offre d'emploi",
    icon: <MessageSquare size={18} />,
    color: "#10B981",
    description: "Publiez une offre de recrutement",
    html: `<h1>🚀 Nous recrutons : [Poste]</h1><p><strong>[Nom de l'entreprise]</strong> recherche un(e) <strong>[Poste]</strong> passionné(e) pour rejoindre notre équipe.</p><h2>Missions</h2><ul><li>[Mission 1]</li><li>[Mission 2]</li><li>[Mission 3]</li></ul><h2>Profil recherché</h2><ul><li>[Compétence / Expérience requise]</li><li>[Qualité personnelle]</li></ul><p><strong>Rémunération :</strong> [XX XXX FCFA / mois]</p><p>Envoyez votre CV à : <strong>[email]</strong></p>`,
  },
];

// ── Readability score ─────────────────────────────────────────────────────────
function readabilityScore(text: string): { score: number; label: string; color: string } {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const sentences = (text.match(/[.!?]+/g) ?? []).length || 1;
  const avg = words / sentences;
  if (avg < 15) return { score: 95, label: "Très lisible", color: "#10B981" };
  if (avg < 20) return { score: 78, label: "Lisible", color: "#3B82F6" };
  if (avg < 25) return { score: 55, label: "Moyen", color: "#F59E0B" };
  return { score: 30, label: "Difficile", color: "#EF4444" };
}

const DRAFTS_KEY = "editeur_drafts_v1";

function loadLocalDrafts(): Draft[] {
  try { return JSON.parse(localStorage.getItem(DRAFTS_KEY) ?? "[]") as Draft[]; }
  catch { return []; }
}
function saveLocalDrafts(drafts: Draft[]) {
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

// ── Toolbar Button ─────────────────────────────────────────────────────────────
function ToolBtn({ onClick, active, title, children }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) {
  return (
    <Pressable className={`p-1.5 rounded-lg transition-all cursor-pointer ${active ? "bg-white text-gray-900" : "text-gray-300 hover:bg-white/15 hover:text-white"}`}>{children}</Pressable>
  );
}

// ── Merge local + cloud drafts (deduplicate by title, prefer cloud when authenticated) ──
function mergeDrafts(localDrafts: Draft[], cloudDrafts: Draft[], isAuthenticated: boolean): Draft[] {
  if (!isAuthenticated || cloudDrafts.length === 0) return localDrafts;

  const merged = new Map<string, Draft>();

  // Add cloud drafts first (they take priority)
  for (const d of cloudDrafts) {
    merged.set(d.title, d);
  }

  // Add local drafts that don't exist in cloud
  for (const d of localDrafts) {
    if (!merged.has(d.title)) {
      merged.set(d.title, d);
    }
  }

  // Sort by savedAt desc
  return Array.from(merged.values()).sort(
    (a, b) => b.savedAt.localeCompare(a.savedAt)
  ).slice(0, 20);
}

// ── Main Component ─────────────────────────────────────────────────────────────
interface Props { onBack: () => void; }

export default function EditeurPage({ onBack }: Props) {
  const editorRef = useRef<View>(null);
  const [title, setTitle] = useState("Mon contenu");
  const [showPreview, setShowPreview] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [localDrafts, setLocalDrafts] = useState<Draft[]>(loadLocalDrafts);
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [readability, setReadability] = useState(readabilityScore(""));
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [autoSaved, setAutoSaved] = useState(false);
  const [cloudSaving, setCloudSaving] = useState(false);

  // Convex auth & data
  const { isAuthenticated } = useConvexAuth();
  const cloudDraftsRaw = useQuery(api.contentDrafts.listMyDrafts, isAuthenticated ? {} : "skip");
  const saveDraftMutation = useMutation(api.contentDrafts.saveDraft);
  const deleteDraftMutation = useMutation(api.contentDrafts.deleteDraft);

  // Transform cloud drafts into local Draft shape
  const cloudDrafts: Draft[] = (cloudDraftsRaw ?? []).map((d) => ({
    id: d._id,
    convexId: d._id,
    title: d.title,
    html: d.html,
    savedAt: d.savedAt,
  }));

  // Merged drafts list
  const drafts = mergeDrafts(localDrafts, cloudDrafts, isAuthenticated);

  const getHtml = () => editorRef.current?.innerHTML ?? "";
  const getText = () => editorRef.current?.innerText ?? "";

  // Update stats on input
  const handleInput = useCallback(() => {
    const text = getText();
    const chars = text.length;
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    setCharCount(chars);
    setWordCount(words);
    setReadability(readabilityScore(text));
  }, []);

  // Auto-save every 30s (localStorage only)
  useEffect(() => {
    const interval = setInterval(() => {
      const html = getHtml();
      if (!html || html === "<br>") return;
      localSave(html);
    }, 30_000);
    return () => clearInterval(interval);
  }, [title]);

  function localSave(html: string) {
    const draft: Draft = {
      id: `draft-${Date.now()}`,
      title,
      html,
      savedAt: new Date().toISOString(),
    };
    const existing = loadLocalDrafts();
    const idx = existing.findIndex(d => d.title === title);
    if (idx >= 0) existing[idx] = draft;
    else existing.unshift(draft);
    const trimmed = existing.slice(0, 20);
    saveLocalDrafts(trimmed);
    setLocalDrafts(trimmed);
    setAutoSaved(true);
    setTimeout(() => setAutoSaved(false), 2000);
  }

  async function cloudSave(html: string) {
    if (!isAuthenticated) return;
    setCloudSaving(true);
    try {
      await saveDraftMutation({ title, html });
    } catch {
      toast.error("Erreur lors de la sauvegarde cloud");
    } finally {
      setCloudSaving(false);
    }
  }

  function exec(cmd: FormatCmd, value?: string) {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
    updateActiveFormats();
  }

  function updateActiveFormats() {
    const fmts = new Set<string>();
    if (document.queryCommandState("bold")) fmts.add("bold");
    if (document.queryCommandState("italic")) fmts.add("italic");
    if (document.queryCommandState("underline")) fmts.add("underline");
    setActiveFormats(fmts);
  }

  function applyTemplate(t: Template) {
    if (editorRef.current) {
      editorRef.current.innerHTML = t.html;
      setTitle(t.label);
      handleInput();
    }
    setShowTemplates(false);
    toast.success(`Template "${t.label}" appliqué`);
  }

  function loadDraft(d: Draft) {
    if (editorRef.current) {
      editorRef.current.innerHTML = d.html;
      setTitle(d.title);
      handleInput();
    }
    setShowDrafts(false);
    toast.success("Brouillon chargé");
  }

  async function deleteDraft(d: Draft) {
    // Delete from localStorage
    const updatedLocal = localDrafts.filter(ld => ld.title !== d.title);
    saveLocalDrafts(updatedLocal);
    setLocalDrafts(updatedLocal);

    // Delete from Convex if it has a convexId
    if (d.convexId && isAuthenticated) {
      try {
        await deleteDraftMutation({ draftId: d.convexId });
      } catch {
        // Cloud delete failed silently — local is already removed
      }
    }
    toast.success("Brouillon supprimé");
  }

  async function manualSave() {
    const html = getHtml();
    if (!html || html === "<br>") { toast.error("Rien à sauvegarder"); return; }
    // Save to localStorage
    localSave(html);
    // Save to Convex if authenticated
    await cloudSave(html);
    toast.success(isAuthenticated ? "Brouillon sauvegardé dans le cloud !" : "Brouillon sauvegardé !");
  }

  function clearEditor() {
    if (editorRef.current) editorRef.current.innerHTML = "";
    setTitle("Mon contenu");
    setCharCount(0); setWordCount(0);
    setReadability(readabilityScore(""));
  }

  const previewHtml = getHtml();

  return (
    <View className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white flex flex-col">{}<View className="sticky top-0 z-30 bg-gray-950/90 backdrop-blur-lg border-b border-white/5 px-4 py-3 flex items-center gap-3"><Pressable onPress={onBack} className="p-2 rounded-full bg-white/10 transition-colors shrink-0"><ArrowLeft size={18} /></Pressable><TextInput value={title} onChangeText={value => setTitle(value)} className="flex-1 bg-transparent font-bold text-base outline-none placeholder-gray-500 truncate" placeholder="Titre de votre contenu…" /><View className="flex items-center gap-1">{autoSaved && (
            <Text initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle size={12} /> Sauvegardé
            </Text>
          )}{cloudSaving && (
            <Text initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-blue-400 flex items-center gap-1">
              <Cloud size={12} /> Sync…
            </Text>
          )}<Pressable onPress={() => { setShowDrafts(v => !v); setShowTemplates(false); }} className="p-2 rounded-full bg-white/10 transition-colors"><Clock size={16} /></Pressable><Pressable onPress={manualSave} className="p-2 rounded-full bg-white/10 transition-colors"><Save size={16} /></Pressable><Pressable onPress={() => { setShowPreview(v => !v); }} className={`p-2 rounded-full transition-colors cursor-pointer ${showPreview ? "bg-blue-500/30 text-blue-400" : "bg-white/10 hover:bg-white/20"}`}>{showPreview ? <EyeOff size={16} /> : <Eye size={16} />}</Pressable></View></View>{}<View>{showDrafts && (
          <View initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-white/10 bg-gray-900/80">
            <View className="px-4 py-3"><View className="flex items-center gap-2 mb-2"><Text className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Brouillons récents</Text>{isAuthenticated && (
                  <Text className="flex items-center gap-1 text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-2 py-0.5"><Cloud size={10} />Cloud
                  </Text>
                )}</View>{drafts.length === 0 && <Text className="text-sm text-gray-500">Aucun brouillon sauvegardé.</Text>}<View className="space-y-2 max-h-48 overflow-y-auto">{drafts.map(d => (
                  <View key={d.id} className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2"><FileText size={14} className="text-gray-400 shrink-0" /><View className="flex-1 min-w-0"><View className="flex items-center gap-1.5"><Text className="text-sm font-medium truncate">{d.title}</Text>{d.convexId && <Cloud size={10} className="text-blue-400 shrink-0" />}</View><Text className="text-xs text-gray-500">{new Date(d.savedAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</Text></View><Pressable onPress={() => loadDraft(d)} className="text-xs text-blue-400"><Text>Charger</Text></Pressable><Pressable onPress={() => deleteDraft(d)} className="p-1 text-gray-500"><Trash2 size={12} /></Pressable></View>
                ))}</View></View>
          </View>
        )}</View>{}<View>{showTemplates && (
          <View initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-white/10 bg-gray-900/80">
            <View className="px-4 py-3"><View className="flex items-center justify-between mb-2"><Text className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Templates</Text><Pressable onPress={() => setShowTemplates(false)} className="p-1 text-gray-500"><X size={14} /></Pressable></View><View className="gap-2">{TEMPLATES.map(t => (
                  <Pressable key={t.id} onPress={() => applyTemplate(t)} className="rounded-xl p-3 bg-white/5 border border-white/10 transition-all text-left flex flex-col gap-1.5"><View className="p-1.5 rounded-lg w-fit" style={{ backgroundColor: `${t.color}22` }}><Text style={{ color: t.color }}>{t.icon}</Text></View><Text className="text-xs font-semibold leading-tight">{t.label}</Text><Text className="text-xs text-gray-500 leading-tight">{t.description}</Text></Pressable>
                ))}</View></View>
          </View>
        )}</View>{}{!showPreview && (
        <View className="sticky top-[57px] z-20 bg-gray-900/95 backdrop-blur border-b border-white/5 px-3 py-2 flex flex-wrap items-center gap-0.5">{}<ToolBtn onPress={() => exec("formatBlock", "h1")} title="Titre 1"><Heading1 size={16} /></ToolBtn><ToolBtn onPress={() => exec("formatBlock", "h2")} title="Titre 2"><Heading2 size={16} /></ToolBtn><ToolBtn onPress={() => exec("formatBlock", "p")} title="Paragraphe"><Type size={16} /></ToolBtn><View className="w-px h-5 bg-white/15 mx-1" /><ToolBtn onPress={() => exec("bold")} active={activeFormats.has("bold")} title="Gras"><Bold size={16} /></ToolBtn><ToolBtn onPress={() => exec("italic")} active={activeFormats.has("italic")} title="Italique"><Italic size={16} /></ToolBtn><ToolBtn onPress={() => exec("underline")} active={activeFormats.has("underline")} title="Souligné"><Underline size={16} /></ToolBtn><View className="w-px h-5 bg-white/15 mx-1" /><ToolBtn onPress={() => exec("insertUnorderedList")} title="Liste à puces"><List size={16} /></ToolBtn><ToolBtn onPress={() => exec("insertOrderedList")} title="Liste numérotée"><ListOrdered size={16} /></ToolBtn><ToolBtn onPress={() => exec("formatBlock", "blockquote")} title="Citation"><Quote size={16} /></ToolBtn><View className="w-px h-5 bg-white/15 mx-1" /><ToolBtn onPress={() => exec("justifyLeft")} title="Gauche"><AlignLeft size={16} /></ToolBtn><ToolBtn onPress={() => exec("justifyCenter")} title="Centre"><AlignCenter size={16} /></ToolBtn><ToolBtn onPress={() => exec("justifyRight")} title="Droite"><AlignRight size={16} /></ToolBtn><View className="flex-1" /><Pressable onPress={() => { setShowTemplates(v => !v); setShowDrafts(false); }} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${showTemplates ? "bg-purple-500/20 border-purple-500/40 text-purple-300" : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"}`}><Sparkles size={13} /><Text>Templates</Text></Pressable></View>
      )}{}<View className="flex-1 px-4 py-4"><View>{showPreview ? (
            <View key="preview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="rounded-2xl bg-white text-gray-900 p-5 min-h-64 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: previewHtml || "<p class='text-gray-400'>Rien à prévisualiser…</p>" }} />
          ) : (
            <View key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <View ref={editorRef} suppressContentEditableWarning onKeyPress={updateActiveFormats} onFocus={updateActiveFormats} className="min-h-64 outline-none text-gray-100 leading-relaxed editeur-content" style={{ caretColor: "#a78bfa" }} data-placeholder="Commencez à écrire votre contenu ici…" />
            </View>
          )}</View></View>{}<View className="sticky bottom-0 bg-gray-950/95 backdrop-blur border-t border-white/5 px-4 py-2.5 flex items-center gap-4 text-xs"><Text className="text-gray-400">{charCount}<Text className="text-gray-600">car.</Text></Text><Text className="text-gray-400">{wordCount}<Text className="text-gray-600">mots</Text></Text><View className="flex items-center gap-1.5"><View className="w-2 h-2 rounded-full" style={{ backgroundColor: readability.color }} /><Text style={{ color: readability.color }}>{readability.label}</Text></View><View className="flex-1" /><Pressable onPress={clearEditor} className="flex items-center gap-1 text-gray-500 transition-colors"><Trash2 size={12} />Effacer
        </Pressable><Pressable onPress={() => { toast.success("Contenu publié avec succès !"); }} className="px-3 py-1 bg-purple-600 text-white rounded-lg font-semibold transition-colors">Publier
        </Pressable></View></View>
  );
}
