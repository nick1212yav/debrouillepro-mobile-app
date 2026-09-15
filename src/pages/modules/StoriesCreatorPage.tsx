import { View, Text, Pressable, TextInput, GestureResponderEvent } from "react-native";
import { useState, useRef } from "react";
import {
  ArrowLeft, Plus, Trash2, Play, Pause, ChevronLeft, ChevronRight,
  Music, Type, Smile, Palette, Eye, Send, Copy, RotateCcw,
  Check, X, Zap, Loader2,
  Bold, Italic, Volume2, VolumeX,
} from "lucide-react-native";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { useConvexAuth } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";

// ── Types ─────────────────────────────────────────────────────────────────────
type AnimPreset = "fadeIn" | "slideUp" | "slideLeft" | "zoomIn" | "bounce";
type SlideElem = TextElem | StickerElem;

type TextElem = {
  id: string;
  kind: "text";
  text: string;
  color: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  x: number;
  y: number;
  anim: AnimPreset;
};

type StickerElem = {
  id: string;
  kind: "sticker";
  emoji: string;
  size: number;
  x: number;
  y: number;
  anim: AnimPreset;
};

type Slide = {
  id: string;
  bg: string;
  elements: SlideElem[];
  music: string | null;
  duration: number;
};

// ── Seed data ─────────────────────────────────────────────────────────────────
const BG_PRESETS = [
  "#111827", "#1e3a5f", "#1a1a2e",
  "#4c1d95", "#064e3b", "#7f1d1d",
  "linear-gradient(135deg,#667eea,#764ba2)",
  "linear-gradient(135deg,#f093fb,#f5576c)",
  "linear-gradient(135deg,#4facfe,#00f2fe)",
  "linear-gradient(135deg,#43e97b,#38f9d7)",
  "linear-gradient(135deg,#fa709a,#fee140)",
  "linear-gradient(135deg,#a18cd1,#fbc2eb)",
  "linear-gradient(135deg,#ffecd2,#fcb69f)",
  "linear-gradient(135deg,#2d3561,#c05c7e)",
  "linear-gradient(135deg,#0f0c29,#302b63,#24243e)",
];

const MUSIC_TRACKS = [
  { id: "afro1",    label: "Afrobeat Vibes",    emoji: "🎵", bpm: 120 },
  { id: "chill1",   label: "Chill Lofi",        emoji: "🎶", bpm: 85  },
  { id: "hype1",    label: "Hype Energy",       emoji: "🔥", bpm: 140 },
  { id: "gospel1",  label: "Gospel Praise",     emoji: "🙌", bpm: 100 },
  { id: "jazz1",    label: "Jazz Smooth",       emoji: "🎷", bpm: 95  },
  { id: "trap1",    label: "Urban Trap",        emoji: "💎", bpm: 130 },
];

const STICKER_LIST = ["🔥","💯","⭐","🎉","🏆","💎","✨","🚀","💪","👑","❤️","😍","🌍","📱","💰","🌊","🎵","💡","🌸","🦋"];

const TEXT_COLORS = ["#ffffff","#000000","#f59e0b","#ef4444","#10b981","#3b82f6","#8b5cf6","#ec4899","#06b6d4","#fbbf24"];

const ANIM_PRESETS: { id: AnimPreset; label: string }[] = [
  { id: "fadeIn",    label: "Fondu"    },
  { id: "slideUp",   label: "Montée"   },
  { id: "slideLeft", label: "Glisse"   },
  { id: "zoomIn",    label: "Zoom"     },
  { id: "bounce",    label: "Rebond"   },
];

const ANIM_VARIANTS: Record<AnimPreset, { initial: object; animate: object }> = {
  fadeIn:    { initial: { opacity: 0 },             animate: { opacity: 1 } },
  slideUp:   { initial: { opacity: 0, y: 40 },      animate: { opacity: 1, y: 0 } },
  slideLeft: { initial: { opacity: 0, x: -40 },     animate: { opacity: 1, x: 0 } },
  zoomIn:    { initial: { opacity: 0, scale: 0.5 }, animate: { opacity: 1, scale: 1 } },
  bounce:    { initial: { opacity: 0, y: -30 },     animate: { opacity: 1, y: 0 } },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function uid() { return `s${Date.now()}${Math.random().toString(36).slice(2, 5)}`; }

function makeSlide(): Slide {
  return { id: uid(), bg: BG_PRESETS[0], elements: [], music: null, duration: 3 };
}

// ── SlideCanvas ──────────────────────────────────────────────────────────────
function SlideCanvas({
  slide, selected, onSelect, onMove, preview = false, animKey,
}: {
  slide: Slide;
  selected: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  preview?: boolean;
  animKey?: number;
}) {
  const ref = useRef<View>(null);
  const dragging = useRef<{ id: string; ox: number; oy: number } | null>(null);

  function onPointerDown(e: GestureResponderEvent, id: string) {
    if (preview) return;
    e.stopPropagation();
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const elem = slide.elements.find(el => el.id === id);
    if (!elem) return;
    const cx = ((e.clientX - rect.left) / rect.width) * 100;
    const cy = ((e.clientY - rect.top) / rect.height) * 100;
    dragging.current = { id, ox: cx - elem.x, oy: cy - elem.y };
    onSelect(id);
    (e.target as View).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: GestureResponderEvent) {
    if (!dragging.current || preview) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const nx = ((e.clientX - rect.left) / rect.width) * 100 - dragging.current.ox;
    const ny = ((e.clientY - rect.top) / rect.height) * 100 - dragging.current.oy;
    onMove(dragging.current.id, Math.max(5, Math.min(95, nx)), Math.max(5, Math.min(95, ny)));
  }

  function onPointerUp() { dragging.current = null; }

  return (
    <View ref={ref} onPress={() => !preview && onSelect("")} className="relative overflow-hidden" style={{ width: "100%", paddingBottom: "177.77%", backgroundColor: slide.bg, borderRadius: 16 }}><View className="absolute inset-0">{slide.elements.map((elem, i) => {
          const vars = ANIM_VARIANTS[elem.anim];
          return (
            <View key={`${elem.id}-${animKey ?? 0}`} initial={vars.initial as Record<string, number>} animate={vars.animate as Record<string, number>} transition={{ duration: 0.5, delay: i * 0.1, type: elem.anim === "bounce" ? "spring" : "tween" }} className={`absolute ${preview ? "cursor-default" : "cursor-grab active:cursor-grabbing"} ${!preview && selected === elem.id ? "ring-2 ring-white/60 ring-offset-1 rounded" : ""}`} style={{ left: `${elem.x}%`, top: `${elem.y}%`, transform: "translate(-50%,-50%)", touchAction: "none" }}>
              {elem.kind === "text" && (
                <View style={{ fontSize: elem.fontSize, fontWeight: elem.bold ? "bold" : "normal", fontStyle: elem.italic ? "italic" : "normal", textAlign: "center", textShadow: "0 2px 8px rgba(0,0,0,0.8)", maxWidth: 200, lineHeight: 1.25 }}>{elem.text}</View>
              )}
              {elem.kind === "sticker" && (
                <Text style={{ fontSize: elem.size, lineHeight: 1, display: "flex" }}>{elem.emoji}</Text>
              )}
            </View>
          );
        })}</View></View>
  );
}

// ── Slide Thumbnail ───────────────────────────────────────────────────────────
function SlideThumbnail({ slide, active, index, onClick }: { slide: Slide; active: boolean; index: number; onClick: () => void }) {
  return (
    <Pressable onPress={onClick} className={`shrink-0 w-16 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${active ? "border-purple-400 scale-105" : "border-white/10 hover:border-white/30"}`} style={{ backgroundColor: slide.bg }}><View className="relative" style={{ paddingBottom: "177.77%" }}><View className="absolute inset-0 flex items-center justify-center"><Text className="text-white/60 text-xs font-bold">{index + 1}</Text></View></View></Pressable>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
interface Props { onBack: () => void; onNavigate?: (page: string) => void }

export default function StoriesCreatorPage({ onBack, onNavigate }: Props) {
  const { isAuthenticated } = useConvexAuth();
  const createStory = useMutation(api.stories.createStory);

  const [slides, setSlides] = useState<Slide[]>([makeSlide()]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedElem, setSelectedElem] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"bg" | "text" | "stickers" | "music" | "anim">("bg");
  const [previewMode, setPreviewMode] = useState(false);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [muted, setMuted] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // text edit state
  const [editText, setEditText] = useState("Votre texte ici");
  const [editColor, setEditColor] = useState("#ffffff");
  const [editSize, setEditSize] = useState(28);
  const [editBold, setEditBold] = useState(true);
  const [editItalic, setEditItalic] = useState(false);
  const [editAnim, setEditAnim] = useState<AnimPreset>("slideUp");

  const slide = slides[activeIdx];
  const selectedElemData = slide?.elements.find(e => e.id === selectedElem) ?? null;

  // ── Slide management ──────────────────────────────────────────────────────
  function addSlide() {
    const s = makeSlide();
    setSlides(p => [...p, s]);
    setActiveIdx(slides.length);
    setSelectedElem(null);
  }

  function deleteSlide(idx: number) {
    if (slides.length === 1) { toast.error("Il faut au moins 1 slide"); return; }
    setSlides(p => p.filter((_, i) => i !== idx));
    setActiveIdx(Math.max(0, idx - 1));
    setSelectedElem(null);
  }

  function duplicateSlide(idx: number) {
    const clone = { ...slides[idx], id: uid(), elements: slides[idx].elements.map(e => ({ ...e, id: uid() })) };
    const next = [...slides];
    next.splice(idx + 1, 0, clone);
    setSlides(next);
    setActiveIdx(idx + 1);
  }

  function updateSlide(update: Partial<Slide>) {
    setSlides(p => p.map((s, i) => i === activeIdx ? { ...s, ...update } : s));
  }

  // ── Element management ────────────────────────────────────────────────────
  function addText() {
    const elem: TextElem = {
      id: uid(), kind: "text", text: editText, color: editColor,
      fontSize: editSize, bold: editBold, italic: editItalic,
      x: 50, y: 50, anim: editAnim,
    };
    updateSlide({ elements: [...slide.elements, elem] });
    setSelectedElem(elem.id);
  }

  function addSticker(emoji: string) {
    const elem: StickerElem = {
      id: uid(), kind: "sticker", emoji, size: 52, x: 50, y: 50, anim: editAnim,
    };
    updateSlide({ elements: [...slide.elements, elem] });
    setSelectedElem(elem.id);
  }

  function deleteElem(id: string) {
    updateSlide({ elements: slide.elements.filter(e => e.id !== id) });
    setSelectedElem(null);
  }

  function moveElem(id: string, x: number, y: number) {
    updateSlide({ elements: slide.elements.map(e => e.id === id ? { ...e, x, y } : e) });
  }

  function updateSelectedElem() {
    if (!selectedElem) return;
    updateSlide({
      elements: slide.elements.map(e => {
        if (e.id !== selectedElem) return e;
        if (e.kind === "text") return { ...e, text: editText, color: editColor, fontSize: editSize, bold: editBold, italic: editItalic, anim: editAnim };
        return { ...e, anim: editAnim };
      }),
    });
  }

  // ── Preview ───────────────────────────────────────────────────────────────
  function startPreview() {
    setPreviewMode(true);
    setPreviewIdx(0);
    setAnimKey(k => k + 1);
  }

  function nextPreviewSlide() {
    if (previewIdx < slides.length - 1) {
      setPreviewIdx(p => p + 1);
      setAnimKey(k => k + 1);
    } else {
      setPreviewMode(false);
    }
  }

  function prevPreviewSlide() {
    if (previewIdx > 0) {
      setPreviewIdx(p => p - 1);
      setAnimKey(k => k + 1);
    }
  }

  const previewSlide = slides[previewIdx];
  const currentMusic = MUSIC_TRACKS.find(t => t.id === previewSlide?.music);

  // ── Sync edit fields to selected elem ────────────────────────────────────
  function selectElem(id: string) {
    setSelectedElem(id || null);
    const el = slide.elements.find(e => e.id === id);
    if (el?.kind === "text") {
      setEditText(el.text); setEditColor(el.color); setEditSize(el.fontSize);
      setEditBold(el.bold); setEditItalic(el.italic); setEditAnim(el.anim);
    } else if (el) {
      setEditAnim(el.anim);
    }
  }

  // ── Publish story ─────────────────────────────────────────────────────────
  async function handlePublish() {
    if (!isAuthenticated) {
      toast.error("Connectez-vous pour publier une story");
      return;
    }

    if (slides.length === 0) {
      toast.error("Ajoutez au moins une slide");
      return;
    }

    setPublishing(true);
    try {
      // Publish each slide as a separate story
      for (const s of slides) {
        // Build caption from text elements
        const textParts = s.elements
          .filter((e): e is TextElem => e.kind === "text")
          .map(e => e.text);
        const stickerParts = s.elements
          .filter((e): e is StickerElem => e.kind === "sticker")
          .map(e => e.emoji);
        const caption = [...textParts, ...stickerParts].join(" ").trim() || undefined;

        // Encode slide data as mediaUrl following existing app convention
        const mediaUrl = `data:slide/${s.bg}|${JSON.stringify(s.elements)}`;

        await createStory({
          mediaUrl,
          mediaType: "image" as const,
          caption,
          duration: s.duration,
        });
      }

      toast.success("Story publiée !");
      if (onNavigate) {
        onNavigate("live");
      } else {
        onBack();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur lors de la publication";
      toast.error(message);
    } finally {
      setPublishing(false);
    }
  }

  const TABS = [
    { id: "bg",       label: "Fond",    icon: <Palette size={13} /> },
    { id: "text",     label: "Texte",   icon: <Type size={13} /> },
    { id: "stickers", label: "Emojis",  icon: <Smile size={13} /> },
    { id: "music",    label: "Musique", icon: <Music size={13} /> },
    { id: "anim",     label: "Anim.",   icon: <Zap size={13} /> },
  ] as const;

  return (
    <View className="min-h-screen bg-gray-950 text-white flex flex-col overflow-hidden">{}<View className="sticky top-0 z-30 bg-gray-950/90 backdrop-blur-lg border-b border-white/5 px-4 py-3 flex items-center gap-3 shrink-0"><Pressable onPress={onBack} className="p-2 rounded-full bg-white/10 transition-colors shrink-0"><ArrowLeft size={18} /></Pressable><View className="flex-1"><Text className="font-bold text-base leading-tight">Créateur de Stories</Text><Text className="text-xs text-gray-400">{slides.length}slide{slides.length > 1 ? "s" : ""}</Text></View><Pressable onPress={startPreview} className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-white/10 rounded-xl transition-colors"><Eye size={15} /><Text>Aperçu</Text></Pressable><Pressable onPress={handlePublish} disabled={publishing} className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-purple-600 rounded-xl font-semibold transition-colors disabled:opacity-60">{publishing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}{publishing ? "Publication…" : "Publier"}</Pressable></View>{}<View className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-white/5 shrink-0 items-center">{slides.map((s, i) => (
          <View key={s.id} className="flex flex-col items-center gap-1 shrink-0"><SlideThumbnail slide={s} active={i === activeIdx} index={i} onPress={() => { setActiveIdx(i); setSelectedElem(null); }} /><View className="flex gap-1"><Pressable onPress={() => duplicateSlide(i)} className="p-0.5 text-gray-500 transition-colors"><Copy size={10} /></Pressable><Pressable onPress={() => deleteSlide(i)} className="p-0.5 text-gray-500 transition-colors"><Trash2 size={10} /></Pressable></View></View>
        ))}<Pressable onPress={addSlide} className="shrink-0 w-16 h-28 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center transition-all"><Plus size={20} className="text-gray-500" /></Pressable></View>{}<View className="flex-1 flex flex-col overflow-hidden min-h-0">{}<View className="flex-1 flex items-start justify-center px-4 pt-4 overflow-y-auto min-h-0"><View className="w-full max-w-[220px]">{slide && (
              <SlideCanvas
                slide={slide}
                selected={selectedElem}
                onSelect={selectElem}
                onMove={moveElem}
                animKey={animKey}
              />
            )}{}{slide?.music && (
              <View className="mt-2 flex items-center gap-1.5 text-xs text-gray-400 justify-center"><Music size={12} className="text-purple-400" />{MUSIC_TRACKS.find(t => t.id === slide.music)?.label}</View>
            )}</View>{}{selectedElem && (
            <View initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="ml-3 flex flex-col gap-2 pt-2">
              <Pressable onPress={() => deleteElem(selectedElem)} className="p-2 rounded-xl bg-red-500/20 text-red-400 transition-colors"><Trash2 size={15} /></Pressable>
              <Pressable onPress={() => { updateSelectedElem(); setSelectedElem(null); }} className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 transition-colors"><Check size={15} /></Pressable>
            </View>
          )}</View>{}<View className="border-t border-white/10 bg-gray-900 shrink-0">{}<View className="flex overflow-x-auto border-b border-white/5">{TABS.map(t => (
              <Pressable key={t.id} onPress={() => setActiveTab(t.id as typeof activeTab)} className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium shrink-0 cursor-pointer border-b-2 transition-all ${activeTab === t.id ? "border-purple-500 text-purple-300" : "border-transparent text-gray-500 hover:text-gray-300"}`}>{t.icon}{t.label}</Pressable>
            ))}</View><View className="px-4 py-3 max-h-52 overflow-y-auto space-y-3">{}{activeTab === "bg" && (
              <View className="gap-2">{BG_PRESETS.map((c, i) => (
                  <Pressable key={i} onPress={() => updateSlide({ bg: c })} className={`h-10 rounded-xl border-2 cursor-pointer transition-all ${slide?.bg === c ? "border-purple-400 scale-110" : "border-transparent hover:border-white/30"}`} style={{ backgroundColor: c }} />
                ))}</View>
            )}{}{activeTab === "text" && (
              <View className="space-y-2"><View className="flex items-center gap-2"><Pressable onPress={addText} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/30 border border-purple-500/40 text-purple-300 rounded-xl text-xs font-medium transition-colors shrink-0"><Plus size={13} /><Text>Ajouter</Text></Pressable>{selectedElem && selectedElemData?.kind === "text" && (
                    <Pressable onPress={updateSelectedElem} className="flex items-center gap-1 text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg"><Check size={12} /><Text>Appliquer</Text></Pressable>
                  )}</View><TextInput value={editText} onChangeText={value => setEditText(value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none h-14 placeholder-gray-600" placeholder="Votre texte…" multiline textAlignVertical="top" /><View className="flex items-center gap-2 flex-wrap"><Pressable onPress={() => setEditBold(v => !v)} className={`p-1.5 rounded-lg cursor-pointer transition-all ${editBold ? "bg-white text-gray-900" : "bg-white/10 text-gray-300"}`}><Bold size={14} /></Pressable><Pressable onPress={() => setEditItalic(v => !v)} className={`p-1.5 rounded-lg cursor-pointer transition-all ${editItalic ? "bg-white text-gray-900" : "bg-white/10 text-gray-300"}`}><Italic size={14} /></Pressable><TextInput value={editSize} onChangeText={value => setEditSize(Number(value))} className="w-24 accent-purple-500" /><Text className="text-xs text-gray-400">{editSize}px</Text></View><View className="flex gap-2 overflow-x-auto">{TEXT_COLORS.map(c => (
                    <Pressable key={c} onPress={() => setEditColor(c)} className={`w-7 h-7 rounded-full shrink-0 cursor-pointer border-2 transition-all ${editColor === c ? "border-white scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
                  ))}</View></View>
            )}{}{activeTab === "stickers" && (
              <View className="gap-2">{STICKER_LIST.map(e => (
                  <Pressable key={e} onPress={() => addSticker(e)} className="text-2xl p-2 rounded-xl bg-white/5 transition-all text-center leading-none">{e}</Pressable>
                ))}</View>
            )}{}{activeTab === "music" && (
              <View className="space-y-2"><Pressable onPress={() => updateSlide({ music: null })} className={`w-full flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all text-sm ${!slide?.music ? "border-purple-500 bg-purple-600/20" : "border-white/10 bg-white/5 hover:bg-white/10"}`}><VolumeX size={16} className="text-gray-400" /><Text>Aucune musique</Text>{!slide?.music && <Check size={14} className="ml-auto text-purple-400" />}</Pressable>{MUSIC_TRACKS.map(t => (
                  <Pressable key={t.id} onPress={() => updateSlide({ music: t.id })} className={`w-full flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${slide?.music === t.id ? "border-purple-500 bg-purple-600/20" : "border-white/10 bg-white/5 hover:bg-white/10"}`}><Text className="text-xl">{t.emoji}</Text><View className="text-left flex-1"><Text className="text-sm font-medium">{t.label}</Text><Text className="text-xs text-gray-500">{t.bpm}BPM</Text></View>{slide?.music === t.id && <Check size={14} className="text-purple-400 shrink-0" />}</Pressable>
                ))}</View>
            )}{}{activeTab === "anim" && (
              <View className="space-y-2"><Text className="text-xs text-gray-400">{selectedElem ? "Animation de l'élément sélectionné" : "Animation par défaut pour les nouveaux éléments"}</Text><View className="gap-2">{ANIM_PRESETS.map(a => (
                    <Pressable key={a.id} onPress={() => { setEditAnim(a.id); if (selectedElem) updateSelectedElem(); setAnimKey(k => k + 1); }} className={`py-2 rounded-xl text-sm border cursor-pointer transition-all ${editAnim === a.id ? "border-purple-500 bg-purple-600/30 text-purple-200 font-semibold" : "border-white/10 bg-white/5 text-gray-400 hover:text-white"}`}>{a.label}</Pressable>
                  ))}</View><Pressable onPress={() => setAnimKey(k => k + 1)} className="flex items-center gap-1.5 text-xs text-purple-400 transition-colors"><RotateCcw size={12} /><Text>Rejouer les animations</Text></Pressable></View>
            )}</View></View></View>{}<View>{previewMode && (
          <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
            {/* Header */}
            <View className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-4 z-10"><Pressable onPress={() => setPreviewMode(false)} className="p-2 rounded-full bg-black/60 text-white"><X size={20} /></Pressable><View className="flex gap-1">{slides.map((_, i) => (
                  <View key={i} className={`h-1 rounded-full transition-all ${i === previewIdx ? "bg-white w-6" : "bg-white/30 w-3"}`} />
                ))}</View><Pressable onPress={() => setMuted(v => !v)} className="p-2 rounded-full bg-black/60 text-white">{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</Pressable></View>

            {/* Canvas */}
            <View className="w-full max-w-xs px-4">
              <SlideCanvas
                slide={previewSlide}
                selected={null}
                onSelect={() => {}}
                onMove={() => {}}
                preview
                animKey={animKey}
              />
            </View>

            {/* Music indicator */}
            {currentMusic && !muted && (
              <View initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-32 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full text-xs text-white">
                <Music size={12} className="text-purple-400" />
                {currentMusic.label}
              </View>
            )}

            {/* Nav controls */}
            <View className="absolute bottom-16 left-0 right-0 flex items-center justify-between px-8">
              <Pressable onPress={prevPreviewSlide} disabled={previewIdx === 0} className={`p-3 rounded-full cursor-pointer transition-all ${previewIdx === 0 ? "opacity-30" : "bg-white/20 hover:bg-white/30"}`}>
                <ChevronLeft size={24} />
              </Pressable>
              <Text className="text-white/60 text-sm">{previewIdx + 1} / {slides.length}</Text>
              <Pressable onPress={nextPreviewSlide} className="p-3 rounded-full bg-white/20 transition-all">
                {previewIdx < slides.length - 1 ? <ChevronRight size={24} /> : <Check size={24} />}
              </Pressable>
            </View>
          </View>
        )}</View></View>
  );
}
