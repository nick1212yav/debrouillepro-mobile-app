import { View, Text, TextInput, Pressable, GestureResponderEvent } from "react-native";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowLeft, Download, RotateCcw, Type, Image as ImageIcon,
  Smile, Sliders, Layers, Square, AlignLeft, AlignCenter,
  AlignRight, Trash2, ChevronUp, ChevronDown, Copy,
  Bold, Italic, Plus, Check, Palette, ZoomIn, ZoomOut,
  Move, Maximize2,
} from "lucide-react-native";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────
type Format = { id: string; label: string; w: number; h: number };
type FilterPreset = { id: string; label: string; css: string };
type Layer = TextLayer | StickerLayer | ShapeLayer;

type BaseLayer = {
  id: string;
  x: number; // percent of canvas width
  y: number; // percent of canvas height
  zIndex: number;
};

type TextLayer = BaseLayer & {
  kind: "text";
  text: string;
  fontSize: number;
  color: string;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  align: "left" | "center" | "right";
  bg: string; // background color or "transparent"
};

type StickerLayer = BaseLayer & {
  kind: "sticker";
  emoji: string;
  size: number;
};

type ShapeLayer = BaseLayer & {
  kind: "shape";
  shape: "rect" | "circle" | "line";
  color: string;
  w: number;
  h: number;
};

// ── Constants ─────────────────────────────────────────────────────────────────
const FORMATS: Format[] = [
  { id: "square", label: "Carré (1:1)", w: 400, h: 400 },
  { id: "story", label: "Story (9:16)", w: 300, h: 533 },
  { id: "banner", label: "Bannière (3:1)", w: 600, h: 200 },
  { id: "portrait", label: "Portrait (4:5)", w: 320, h: 400 },
];

const BG_COLORS = [
  "#111827", "#1e3a5f", "#1a1a2e", "#0f2027",
  "#4c1d95", "#1e1b4b", "#064e3b", "#7f1d1d",
  "#ffffff", "#f3f4f6", "#fef3c7", "#fce7f3",
  "linear-gradient(135deg,#667eea,#764ba2)",
  "linear-gradient(135deg,#f093fb,#f5576c)",
  "linear-gradient(135deg,#4facfe,#00f2fe)",
  "linear-gradient(135deg,#43e97b,#38f9d7)",
  "linear-gradient(135deg,#fa709a,#fee140)",
  "linear-gradient(135deg,#a18cd1,#fbc2eb)",
];

const FILTER_PRESETS: FilterPreset[] = [
  { id: "none",      label: "Original",  css: "none" },
  { id: "vivid",     label: "Vivid",     css: "saturate(1.8) contrast(1.1)" },
  { id: "cool",      label: "Cool",      css: "hue-rotate(30deg) saturate(1.3)" },
  { id: "warm",      label: "Warm",      css: "sepia(0.4) saturate(1.4)" },
  { id: "bw",        label: "N&B",       css: "grayscale(1)" },
  { id: "fade",      label: "Fade",      css: "opacity(0.8) saturate(0.7) brightness(1.1)" },
  { id: "dramatic",  label: "Drama",     css: "contrast(1.5) saturate(1.2) brightness(0.9)" },
  { id: "retro",     label: "Rétro",     css: "sepia(0.6) hue-rotate(-10deg) contrast(1.2)" },
];

const STICKER_GROUPS: { label: string; emojis: string[] }[] = [
  { label: "Expressions", emojis: ["😍","🔥","💯","⭐","🎉","🏆","💎","✨","🚀","💪","👑","🎯"] },
  { label: "Objets",      emojis: ["📱","💰","🛍️","📸","🎵","🎨","📚","💻","🏡","🚗","✈️","🌍"] },
  { label: "Nature",      emojis: ["🌸","🌴","🌊","⛅","🌙","🌺","🦋","🐬","🌵","🍀","❄️","🌈"] },
  { label: "Texte",       emojis: ["💬","❤️","💚","💙","💛","🖤","🤍","💜","🧡","❗","❓","💡"] },
];

const TEXT_COLORS = ["#ffffff","#000000","#f59e0b","#ef4444","#10b981","#3b82f6","#8b5cf6","#ec4899","#06b6d4","#84cc16"];

function uid() { return `l${Date.now()}${Math.random().toString(36).slice(2, 6)}`; }

// ── Adjust Slider ─────────────────────────────────────────────────────────────
function AdjSlider({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <View className="space-y-1"><View className="flex justify-between text-xs text-gray-400"><Text>{label}</Text><Text>{value}</Text></View><TextInput value={value} onChangeText={value => onChange(Number(value))} className="w-full accent-purple-500" /></View>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
interface Props { onBack: () => void }

export default function StudioPhotoPage({ onBack }: Props) {
  const canvasRef = useRef<View>(null);
  const [format, setFormat] = useState<Format>(FORMATS[0]);
  const [bg, setBg] = useState(BG_COLORS[0]);
  const [filter, setFilter] = useState<FilterPreset>(FILTER_PRESETS[0]);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"bg" | "filters" | "text" | "stickers" | "shapes" | "adjust">("bg");
  const [stickerGroup, setStickerGroup] = useState(0);
  const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number } | null>(null);

  // Edit states for selected text layer
  const [editText, setEditText] = useState("");
  const [editColor, setEditColor] = useState("#ffffff");
  const [editFontSize, setEditFontSize] = useState(24);
  const [editBold, setEditBold] = useState(false);
  const [editItalic, setEditItalic] = useState(false);
  const [editAlign, setEditAlign] = useState<"left" | "center" | "right">("center");
  const [editBg, setEditBg] = useState("transparent");

  const selectedLayer = layers.find(l => l.id === selected) ?? null;

  // Sync edit fields when selection changes
  useEffect(() => {
    if (selectedLayer?.kind === "text") {
      setEditText(selectedLayer.text);
      setEditColor(selectedLayer.color);
      setEditFontSize(selectedLayer.fontSize);
      setEditBold(selectedLayer.fontWeight === "bold");
      setEditItalic(selectedLayer.fontStyle === "italic");
      setEditAlign(selectedLayer.align);
      setEditBg(selectedLayer.bg);
    }
  }, [selected]);

  // Update text layer live
  const updateTextLayer = useCallback(() => {
    if (!selected) return;
    setLayers(prev => prev.map(l => l.id === selected && l.kind === "text" ? {
      ...l,
      text: editText,
      color: editColor,
      fontSize: editFontSize,
      fontWeight: editBold ? "bold" : "normal",
      fontStyle: editItalic ? "italic" : "normal",
      align: editAlign,
      bg: editBg,
    } : l));
  }, [selected, editText, editColor, editFontSize, editBold, editItalic, editAlign, editBg]);

  useEffect(() => { updateTextLayer(); }, [editText, editColor, editFontSize, editBold, editItalic, editAlign, editBg]);

  function addText() {
    const l: TextLayer = {
      id: uid(), kind: "text", x: 50, y: 50, zIndex: layers.length,
      text: "Votre texte ici", fontSize: 24, color: "#ffffff",
      fontWeight: "bold", fontStyle: "normal", align: "center", bg: "transparent",
    };
    setLayers(p => [...p, l]);
    setSelected(l.id);
    setActiveTab("text");
  }

  function addSticker(emoji: string) {
    const l: StickerLayer = {
      id: uid(), kind: "sticker", x: 50, y: 50, zIndex: layers.length, emoji, size: 48,
    };
    setLayers(p => [...p, l]);
    setSelected(l.id);
  }

  function addShape(shape: ShapeLayer["shape"]) {
    const l: ShapeLayer = {
      id: uid(), kind: "shape", x: 50, y: 50, zIndex: layers.length,
      shape, color: "#8b5cf6", w: 80, h: shape === "line" ? 4 : 80,
    };
    setLayers(p => [...p, l]);
    setSelected(l.id);
  }

  function deleteLayer(id: string) {
    setLayers(p => p.filter(l => l.id !== id));
    setSelected(null);
  }

  function bringUp(id: string) {
    setLayers(p => {
      const max = Math.max(...p.map(l => l.zIndex));
      return p.map(l => l.id === id ? { ...l, zIndex: max + 1 } : l);
    });
  }

  function sendDown(id: string) {
    setLayers(p => {
      const min = Math.min(...p.map(l => l.zIndex));
      return p.map(l => l.id === id ? { ...l, zIndex: Math.max(0, min - 1) } : l);
    });
  }

  function duplicate(id: string) {
    const orig = layers.find(l => l.id === id);
    if (!orig) return;
    const clone = { ...orig, id: uid(), x: orig.x + 5, y: orig.y + 5, zIndex: orig.zIndex + 1 };
    setLayers(p => [...p, clone]);
    setSelected(clone.id);
  }

  // Drag logic
  function onPointerDown(e: GestureResponderEvent, id: string) {
    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const layer = layers.find(l => l.id === id);
    if (!layer) return;
    const cx = ((e.clientX - rect.left) / rect.width) * 100;
    const cy = ((e.clientY - rect.top) / rect.height) * 100;
    setDragging({ id, ox: cx - layer.x, oy: cy - layer.y });
    setSelected(id);
    (e.target as View).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: GestureResponderEvent) {
    if (!dragging) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nx = ((e.clientX - rect.left) / rect.width) * 100 - dragging.ox;
    const ny = ((e.clientY - rect.top) / rect.height) * 100 - dragging.oy;
    setLayers(p => p.map(l => l.id === dragging.id
      ? { ...l, x: Math.max(0, Math.min(100, nx)), y: Math.max(0, Math.min(100, ny)) }
      : l));
  }

  function onPointerUp() { setDragging(null); }

  // Compute composite filter
  const compositeFilter = [
    filter.css !== "none" ? filter.css : "",
    brightness !== 100 ? `brightness(${brightness / 100})` : "",
    contrast !== 100 ? `contrast(${contrast / 100})` : "",
    saturation !== 100 ? `saturate(${saturation / 100})` : "",
  ].filter(Boolean).join(" ") || "none";

  function exportCanvas() {
    toast.success("Export simulé — intégration html-to-image disponible !");
  }

  function reset() {
    setLayers([]);
    setSelected(null);
    setBg(BG_COLORS[0]);
    setFilter(FILTER_PRESETS[0]);
    setBrightness(100); setContrast(100); setSaturation(100);
    toast.success("Canvas réinitialisé");
  }

  const TABS = [
    { id: "bg",      label: "Fond",     icon: <Palette size={14} /> },
    { id: "filters", label: "Filtres",  icon: <Sliders size={14} /> },
    { id: "text",    label: "Texte",    icon: <Type size={14} /> },
    { id: "stickers",label: "Stickers", icon: <Smile size={14} /> },
    { id: "shapes",  label: "Formes",   icon: <Square size={14} /> },
    { id: "adjust",  label: "Réglages", icon: <ZoomIn size={14} /> },
  ] as const;

  return (
    <View className="min-h-screen bg-gray-950 text-white flex flex-col overflow-hidden">{}<View className="sticky top-0 z-30 bg-gray-950/90 backdrop-blur-lg border-b border-white/5 px-4 py-3 flex items-center gap-3"><Pressable onPress={onBack} className="p-2 rounded-full bg-white/10 transition-colors shrink-0"><ArrowLeft size={18} /></Pressable><View className="flex-1"><Text className="font-bold text-base leading-tight">Studio Photo & Image</Text><Text className="text-xs text-gray-400">{format.label}· {layers.length}calque{layers.length !== 1 ? "s" : ""}</Text></View><Pressable onPress={reset} className="p-2 rounded-full bg-white/10 transition-colors"><RotateCcw size={16} /></Pressable><Pressable onPress={exportCanvas} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 rounded-xl text-sm font-semibold transition-colors"><Download size={15} /><Text>Exporter</Text></Pressable></View>{}<View className="flex gap-2 px-4 py-2 overflow-x-auto border-b border-white/5 shrink-0">{FORMATS.map(f => (
          <Pressable key={f.id} onPress={() => setFormat(f)} className={`shrink-0 text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${format.id === f.id ? "bg-white text-gray-900 border-transparent font-bold" : "bg-white/5 border-white/10 text-gray-400 hover:text-white"}`}>{f.label}</Pressable>
        ))}</View><View className="flex-1 flex flex-col overflow-hidden">{}<View className="flex-1 flex items-center justify-center bg-[#0a0a0a] px-4 py-4 overflow-auto min-h-0"><View ref={canvasRef} onPress={() => setSelected(null)} className="relative overflow-hidden rounded-2xl shadow-2xl" style={{ width: Math.min(format.w, 340), height: Math.min(format.h, Math.min(format.w, 340) * (format.h / format.w)), backgroundColor: bg.startsWith("linear") ? bg : bg }}>{}{[...layers].sort((a, b) => a.zIndex - b.zIndex).map(layer => (
              <View key={layer.id} className={`absolute cursor-grab active:cursor-grabbing ${selected === layer.id ? "ring-2 ring-purple-400 ring-offset-1 ring-offset-transparent rounded" : ""}`} style={{ left: `${layer.x}%`, top: `${layer.y}%`, transform: "translate(-50%,-50%)", zIndex: layer.zIndex + 1, touchAction: "none" }}>{layer.kind === "text" && (
                  <View style={{ fontSize: layer.fontSize, fontWeight: layer.fontWeight, fontStyle: layer.fontStyle, textAlign: layer.align, backgroundColor: layer.bg === "transparent" ? "transparent" : layer.bg, padding: layer.bg === "transparent" ? 0 : "4px 8px", borderRadius: layer.bg === "transparent" ? 0 : 6, maxWidth: 220, lineHeight: 1.2, textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>{layer.text}</View>
                )}{layer.kind === "sticker" && (
                  <Text style={{ fontSize: layer.size, lineHeight: 1, display: "flex" }}>{layer.emoji}</Text>
                )}{layer.kind === "shape" && (
                  <View style={{ width: layer.w, height: layer.h, backgroundColor: layer.color, borderRadius: layer.shape === "circle" ? "50%" : layer.shape === "line" ? 2 : 8, opacity: 0.85 }} />
                )}</View>
            ))}</View></View>{}<View>{selected && (
            <View initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/10 bg-gray-900/80 shrink-0">
              <View className="flex items-center gap-2 px-4 py-2 overflow-x-auto"><Text className="text-xs text-gray-400 shrink-0">Calque :</Text><Pressable onPress={() => bringUp(selected)} className="flex items-center gap-1 text-xs px-2 py-1 bg-white/10 rounded-lg transition-colors shrink-0"><ChevronUp size={12} /><Text>Haut</Text></Pressable><Pressable onPress={() => sendDown(selected)} className="flex items-center gap-1 text-xs px-2 py-1 bg-white/10 rounded-lg transition-colors shrink-0"><ChevronDown size={12} /><Text>Bas</Text></Pressable><Pressable onPress={() => duplicate(selected)} className="flex items-center gap-1 text-xs px-2 py-1 bg-white/10 rounded-lg transition-colors shrink-0"><Copy size={12} /><Text>Dupliquer</Text></Pressable><Pressable onPress={() => deleteLayer(selected)} className="flex items-center gap-1 text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded-lg transition-colors shrink-0"><Trash2 size={12} /><Text>Supprimer</Text></Pressable>{selectedLayer?.kind === "sticker" && (
                  <View className="flex items-center gap-2 shrink-0 ml-2"><Text className="text-xs text-gray-400">Taille</Text><TextInput value={(selectedLayer as StickerLayer).size} onChangeText={value => setLayers(p => p.map(l => l.id === selected && l.kind === "sticker" ? { ...l, size: Number(value) } : l))} className="w-24 accent-purple-500" /></View>
                )}{selectedLayer?.kind === "shape" && (
                  <>
                    <View className="flex items-center gap-2 shrink-0 ml-2"><Text className="text-xs text-gray-400">Larg.</Text><TextInput value={(selectedLayer as ShapeLayer).w} onChangeText={value => setLayers(p => p.map(l => l.id === selected && l.kind === "shape" ? { ...l, w: Number(value) } : l))} className="w-20 accent-purple-500" /></View>
                    <View className="flex items-center gap-2 shrink-0"><Text className="text-xs text-gray-400">Haut.</Text><TextInput value={(selectedLayer as ShapeLayer).h} onChangeText={value => setLayers(p => p.map(l => l.id === selected && l.kind === "shape" ? { ...l, h: Number(value) } : l))} className="w-20 accent-purple-500" /></View>
                  </>
                )}</View>
            </View>
          )}</View>{}<View className="border-t border-white/10 bg-gray-900 shrink-0">{}<View className="flex overflow-x-auto border-b border-white/5">{TABS.map(t => (
              <Pressable key={t.id} onPress={() => setActiveTab(t.id as typeof activeTab)} className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium shrink-0 transition-all cursor-pointer border-b-2 ${activeTab === t.id ? "border-purple-500 text-purple-300" : "border-transparent text-gray-500 hover:text-gray-300"}`}>{t.icon}{t.label}</Pressable>
            ))}</View><View className="px-4 py-3 max-h-48 overflow-y-auto">{}{activeTab === "bg" && (
              <View className="gap-2">{BG_COLORS.map((c, i) => (
                  <Pressable key={i} onPress={() => setBg(c)} className={`h-10 rounded-xl border-2 cursor-pointer transition-all ${bg === c ? "border-purple-400 scale-110" : "border-transparent hover:border-white/30"}`} style={{ backgroundColor: c }} />
                ))}</View>
            )}{}{activeTab === "filters" && (
              <View className="flex gap-3 overflow-x-auto pb-1">{FILTER_PRESETS.map(fp => (
                  <Pressable key={fp.id} onPress={() => setFilter(fp)} className={`shrink-0 flex flex-col items-center gap-1 cursor-pointer`}><View className={`w-14 h-14 rounded-xl border-2 transition-all ${filter.id === fp.id ? "border-purple-400" : "border-transparent"}`} style={{  }} /><Text className="text-xs text-gray-400">{fp.label}</Text></Pressable>
                ))}</View>
            )}{}{activeTab === "text" && (
              <View className="space-y-3"><View className="flex items-center gap-2"><Pressable onPress={addText} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/30 border border-purple-500/40 text-purple-300 rounded-xl text-xs font-medium transition-colors"><Plus size={13} /><Text>Ajouter texte</Text></Pressable>{selected && selectedLayer?.kind === "text" && (
                    <Text className="text-xs text-gray-400">Édition du calque sélectionné</Text>
                  )}</View>{selected && selectedLayer?.kind === "text" && (
                  <View className="space-y-2"><TextInput value={editText} onChangeText={value => setEditText(value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none h-16 placeholder-gray-600" placeholder="Votre texte…" multiline textAlignVertical="top" /><View className="flex items-center gap-2 flex-wrap"><Pressable onPress={() => setEditBold(v => !v)} className={`p-1.5 rounded-lg cursor-pointer transition-all ${editBold ? "bg-white text-gray-900" : "bg-white/10 text-gray-300"}`}><Bold size={14} /></Pressable><Pressable onPress={() => setEditItalic(v => !v)} className={`p-1.5 rounded-lg cursor-pointer transition-all ${editItalic ? "bg-white text-gray-900" : "bg-white/10 text-gray-300"}`}><Italic size={14} /></Pressable>{(["left","center","right"] as const).map(a => (
                        <Pressable key={a} onPress={() => setEditAlign(a)} className={`p-1.5 rounded-lg cursor-pointer transition-all ${editAlign === a ? "bg-white text-gray-900" : "bg-white/10 text-gray-300"}`}>{a === "left" ? <AlignLeft size={14} /> : a === "center" ? <AlignCenter size={14} /> : <AlignRight size={14} />}</Pressable>
                      ))}<TextInput value={editFontSize} onChangeText={value => setEditFontSize(Number(value))} className="w-24 accent-purple-500" /><Text className="text-xs text-gray-400">{editFontSize}px</Text></View><View className="flex gap-2 overflow-x-auto">{TEXT_COLORS.map(c => (
                        <Pressable key={c} onPress={() => setEditColor(c)} className={`w-7 h-7 rounded-full shrink-0 cursor-pointer border-2 transition-all ${editColor === c ? "border-white scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
                      ))}</View><View className="flex items-center gap-2"><Text className="text-xs text-gray-400 shrink-0">Fond texte :</Text><View className="flex gap-1.5 overflow-x-auto">{["transparent","rgba(0,0,0,0.6)","rgba(255,255,255,0.8)","rgba(139,92,246,0.7)"].map(bg => (
                          <Pressable key={bg} onPress={() => setEditBg(bg)} className={`w-7 h-7 rounded-lg shrink-0 cursor-pointer border-2 transition-all ${editBg === bg ? "border-purple-400" : "border-white/20"}`} style={{  }} />
                        ))}</View></View></View>
                )}</View>
            )}{}{activeTab === "stickers" && (
              <View><View className="flex gap-2 mb-2 overflow-x-auto">{STICKER_GROUPS.map((g, i) => (
                    <Pressable key={i} onPress={() => setStickerGroup(i)} className={`text-xs px-2 py-1 rounded-lg shrink-0 cursor-pointer transition-all ${stickerGroup === i ? "bg-purple-600/40 text-purple-300" : "bg-white/5 text-gray-400"}`}>{g.label}</Pressable>
                  ))}</View><View className="gap-2">{STICKER_GROUPS[stickerGroup].emojis.map(e => (
                    <Pressable key={e} onPress={() => addSticker(e)} className="text-2xl p-2 rounded-xl bg-white/5 transition-all text-center leading-none">
                      {e}
                    </Pressable>
                  ))}</View></View>
            )}{}{activeTab === "shapes" && (
              <View className="flex gap-3">
                {(["rect","circle","line"] as const).map(s => (
                  <Pressable key={s} onPress={() => addShape(s)} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 transition-all border border-white/10">
                    <View style={{ width: s === "line" ? 48 : 32, height: s === "line" ? 4 : 32, backgroundColor: "#8b5cf6", borderRadius: s === "circle" ? "50%" : s === "line" ? 2 : 6 }} />
                    <Text className="text-xs text-gray-400 capitalize">{s === "rect" ? "Rectangle" : s === "circle" ? "Cercle" : "Ligne"}</Text>
                  </Pressable>
                ))}
                {/* Shape color picker for selected shape */}
                {selected && selectedLayer?.kind === "shape" && (
                  <View className="flex items-center gap-2 overflow-x-auto">
                    {TEXT_COLORS.map(c => (
                      <Pressable key={c} onPress={() => setLayers(p => p.map(l => l.id === selected && l.kind === "shape" ? { ...l, color: c } : l))} className={`w-7 h-7 rounded-full shrink-0 cursor-pointer border-2 transition-all ${(selectedLayer as ShapeLayer).color === c ? "border-white scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
                    ))}
                  </View>
                )}
              </View>
            )}{}{activeTab === "adjust" && (
              <View className="space-y-3">
                <AdjSlider label="Luminosité" value={brightness} min={50} max={150} onChange={setBrightness} />
                <AdjSlider label="Contraste" value={contrast} min={50} max={200} onChange={setContrast} />
                <AdjSlider label="Saturation" value={saturation} min={0} max={200} onChange={setSaturation} />
                <Pressable onPress={() => { setBrightness(100); setContrast(100); setSaturation(100); }} className="text-xs text-gray-400 transition-colors flex items-center gap-1">
                  <RotateCcw size={12} /> Réinitialiser les réglages
                </Pressable>
              </View>
            )}</View></View></View></View>
  );
}
