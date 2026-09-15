import { View, Pressable, Text, TextInput, Image } from "react-native";
import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated } from "@/lib/convex-auth-compat";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import {
  ArrowLeft, Search, Download, Heart, Star, Bookmark,
  LayoutTemplate, Palette, Clock,
  TrendingUp, Eye, Share2, Filter, Grid3X3, List,
  ChevronRight, Plus, Sparkles, Package, FolderOpen,
  BarChart2, Check, X, ExternalLink,
} from "lucide-react-native";
import { Clipboard } from "@react-native-clipboard/clipboard";

// ── Types ──────────────────────────────────────────────────────────────────
type TemplateCategory = "all" | "business" | "promo" | "lifestyle" | "event" | "social";
type AssetCategory = "all" | "logos" | "backgrounds" | "palettes" | "icons";
type Tab = "templates" | "assets" | "mes-creations" | "stats";

type Template = {
  id: string;
  title: string;
  category: TemplateCategory;
  thumbnail: string;
  tags: string[];
  rating: number;
  uses: number;
  isPremium: boolean;
  isNew: boolean;
  width: number;
  height: number;
  colors: string[];
};

type Asset = {
  id: string;
  title: string;
  category: AssetCategory;
  thumbnail: string;
  tags: string[];
  isFavorite: boolean;
};

type Creation = {
  id: string;
  title: string;
  type: "editeur" | "studio" | "stories";
  thumbnail: string;
  createdAt: string;
  views: number;
  exports: number;
};

type ColorPalette = {
  id: string;
  name: string;
  colors: string[];
  likes: number;
};

// ── Data ───────────────────────────────────────────────────────────────────
const TEMPLATES: Template[] = [
  { id: "t1", title: "Flyer Promotion Flash", category: "promo", thumbnail: "promo1", tags: ["vente", "offre", "urgent"], rating: 4.8, uses: 1240, isPremium: false, isNew: false, width: 1080, height: 1080, colors: ["#FF6B35", "#F7C59F"] },
  { id: "t2", title: "Story Soldes -50%", category: "promo", thumbnail: "promo2", tags: ["soldes", "story", "mode"], rating: 4.6, uses: 890, isPremium: false, isNew: true, width: 1080, height: 1920, colors: ["#E63946", "#1D3557"] },
  { id: "t3", title: "Carte de Visite Pro", category: "business", thumbnail: "biz1", tags: ["cv", "contact", "pro"], rating: 4.9, uses: 2100, isPremium: false, isNew: false, width: 1050, height: 600, colors: ["#2D3436", "#636E72"] },
  { id: "t4", title: "Post Présentation Entreprise", category: "business", thumbnail: "biz2", tags: ["entreprise", "B2B", "brand"], rating: 4.7, uses: 760, isPremium: true, isNew: false, width: 1080, height: 1080, colors: ["#0984E3", "#FDCB6E"] },
  { id: "t5", title: "Annonce Recrutement", category: "business", thumbnail: "biz3", tags: ["emploi", "rh", "recrutement"], rating: 4.5, uses: 430, isPremium: false, isNew: true, width: 1080, height: 1080, colors: ["#00B894", "#DFE6E9"] },
  { id: "t6", title: "Invitation Soirée", category: "event", thumbnail: "evt1", tags: ["fête", "soirée", "invitation"], rating: 4.7, uses: 1560, isPremium: false, isNew: false, width: 1080, height: 1920, colors: ["#6C5CE7", "#FD79A8"] },
  { id: "t7", title: "Affiche Concert", category: "event", thumbnail: "evt2", tags: ["musique", "concert", "billet"], rating: 4.6, uses: 820, isPremium: true, isNew: false, width: 1080, height: 1440, colors: ["#2D3436", "#FDCB6E"] },
  { id: "t8", title: "Post Anniversaire", category: "lifestyle", thumbnail: "life1", tags: ["anniversaire", "célébration", "amis"], rating: 4.9, uses: 3200, isPremium: false, isNew: false, width: 1080, height: 1080, colors: ["#FD79A8", "#FDCB6E"] },
  { id: "t9", title: "Actu Lifestyle Quotidien", category: "lifestyle", thumbnail: "life2", tags: ["vie", "quotidien", "personnel"], rating: 4.3, uses: 540, isPremium: false, isNew: false, width: 1080, height: 1920, colors: ["#A29BFE", "#74B9FF"] },
  { id: "t10", title: "Carrousel Instagram Produit", category: "social", thumbnail: "soc1", tags: ["instagram", "carrousel", "produit"], rating: 4.8, uses: 1890, isPremium: true, isNew: true, width: 1080, height: 1080, colors: ["#00CEC9", "#55EFC4"] },
  { id: "t11", title: "Story Questions & Réponses", category: "social", thumbnail: "soc2", tags: ["qa", "story", "engagement"], rating: 4.5, uses: 670, isPremium: false, isNew: false, width: 1080, height: 1920, colors: ["#E17055", "#FDCB6E"] },
  { id: "t12", title: "Affiche Événement Communautaire", category: "event", thumbnail: "evt3", tags: ["communauté", "local", "quartier"], rating: 4.4, uses: 310, isPremium: false, isNew: true, width: 1080, height: 1440, colors: ["#55EFC4", "#0984E3"] },
];

const ASSETS: Asset[] = [
  { id: "a1", title: "Logo Minimal Cercle", category: "logos", thumbnail: "log1", tags: ["minimal", "cercle"], isFavorite: true },
  { id: "a2", title: "Logo Vague Moderne", category: "logos", thumbnail: "log2", tags: ["moderne", "vague"], isFavorite: false },
  { id: "a3", title: "Fond Dégradé Sunset", category: "backgrounds", thumbnail: "bg1", tags: ["dégradé", "chaud"], isFavorite: true },
  { id: "a4", title: "Fond Géométrique Bleu", category: "backgrounds", thumbnail: "bg2", tags: ["géométrique", "bleu"], isFavorite: false },
  { id: "a5", title: "Fond Abstrait Noir", category: "backgrounds", thumbnail: "bg3", tags: ["abstrait", "sombre"], isFavorite: false },
  { id: "a6", title: "Fond Texture Papier", category: "backgrounds", thumbnail: "bg4", tags: ["texture", "organique"], isFavorite: true },
  { id: "a7", title: "Palette Terracotta", category: "palettes", thumbnail: "pal1", tags: ["chaud", "nature"], isFavorite: false },
  { id: "a8", title: "Palette Ocean Blue", category: "palettes", thumbnail: "pal2", tags: ["froid", "professionnel"], isFavorite: true },
  { id: "a9", title: "Pack Icônes Business", category: "icons", thumbnail: "ico1", tags: ["business", "pack"], isFavorite: false },
  { id: "a10", title: "Pack Icônes Nature", category: "icons", thumbnail: "ico2", tags: ["nature", "écologie"], isFavorite: false },
];

const PALETTES: ColorPalette[] = [
  { id: "p1", name: "Terracotta Warm", colors: ["#E07A5F", "#F2CC8F", "#81B29A", "#3D405B"], likes: 142 },
  { id: "p2", name: "Ocean Deep", colors: ["#03045E", "#0077B6", "#00B4D8", "#90E0EF", "#CAF0F8"], likes: 238 },
  { id: "p3", name: "Forest Fresh", colors: ["#2D6A4F", "#40916C", "#52B788", "#74C69D", "#D8F3DC"], likes: 89 },
  { id: "p4", name: "Sunset Glow", colors: ["#FF6B35", "#F7C59F", "#EFEFD0", "#004E89", "#1A936F"], likes: 315 },
  { id: "p5", name: "Monochrome Pro", colors: ["#0D0D0D", "#404040", "#808080", "#BFBFBF", "#F5F5F5"], likes: 176 },
  { id: "p6", name: "Neon Night", colors: ["#0D0221", "#190335", "#FF0A54", "#FF477E", "#FF85A1"], likes: 421 },
];

const MY_CREATIONS: Creation[] = [
  { id: "c1", title: "Post Inauguration Boutique", type: "studio", thumbnail: "cr1", createdAt: "2024-01-15", views: 342, exports: 12 },
  { id: "c2", title: "Story Soldes Janvier", type: "stories", thumbnail: "cr2", createdAt: "2024-01-10", views: 1204, exports: 45 },
  { id: "c3", title: "Article Blog Communauté", type: "editeur", thumbnail: "cr3", createdAt: "2024-01-08", views: 87, exports: 3 },
  { id: "c4", title: "Flyer Événement Local", type: "studio", thumbnail: "cr4", createdAt: "2024-01-05", views: 567, exports: 28 },
  { id: "c5", title: "Carrousel Produits", type: "stories", thumbnail: "cr5", createdAt: "2023-12-28", views: 2100, exports: 67 },
];

// ── Gradient thumbnails (CSS driven) ──────────────────────────────────────
const THUMB_GRADIENTS: Record<string, string> = {
  promo1: "linear-gradient(135deg,#FF6B35,#F7C59F)",
  promo2: "linear-gradient(135deg,#E63946,#1D3557)",
  biz1:   "linear-gradient(135deg,#2D3436,#636E72)",
  biz2:   "linear-gradient(135deg,#0984E3,#FDCB6E)",
  biz3:   "linear-gradient(135deg,#00B894,#DFE6E9)",
  evt1:   "linear-gradient(135deg,#6C5CE7,#FD79A8)",
  evt2:   "linear-gradient(135deg,#2D3436,#FDCB6E)",
  evt3:   "linear-gradient(135deg,#55EFC4,#0984E3)",
  life1:  "linear-gradient(135deg,#FD79A8,#FDCB6E)",
  life2:  "linear-gradient(135deg,#A29BFE,#74B9FF)",
  soc1:   "linear-gradient(135deg,#00CEC9,#55EFC4)",
  soc2:   "linear-gradient(135deg,#E17055,#FDCB6E)",
  log1:   "linear-gradient(135deg,#6C5CE7,#a29bfe)",
  log2:   "linear-gradient(135deg,#0984E3,#74b9ff)",
  bg1:    "linear-gradient(135deg,#FF6B35,#FDCB6E,#FD79A8)",
  bg2:    "linear-gradient(135deg,#0984E3,#6C5CE7)",
  bg3:    "linear-gradient(135deg,#0D0D0D,#2D3436)",
  bg4:    "linear-gradient(135deg,#DFE6E9,#b2bec3)",
  pal1:   "linear-gradient(90deg,#E07A5F,#F2CC8F,#81B29A,#3D405B)",
  pal2:   "linear-gradient(90deg,#03045E,#0077B6,#00B4D8,#90E0EF)",
  ico1:   "linear-gradient(135deg,#0984E3,#74b9ff)",
  ico2:   "linear-gradient(135deg,#00B894,#55EFC4)",
  cr1:    "linear-gradient(135deg,#FF6B35,#F7C59F)",
  cr2:    "linear-gradient(135deg,#E63946,#1D3557)",
  cr3:    "linear-gradient(135deg,#6C5CE7,#a29bfe)",
  cr4:    "linear-gradient(135deg,#55EFC4,#0984E3)",
  cr5:    "linear-gradient(135deg,#FD79A8,#FDCB6E)",
};

// ── Category labels ────────────────────────────────────────────────────────
const TEMPLATE_CATS: { id: TemplateCategory; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "business", label: "Business" },
  { id: "promo", label: "Promo" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "event", label: "Événements" },
  { id: "social", label: "Social" },
];

const ASSET_CATS: { id: AssetCategory; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "logos", label: "Logos" },
  { id: "backgrounds", label: "Fonds" },
  { id: "palettes", label: "Palettes" },
  { id: "icons", label: "Icônes" },
];

const TYPE_LABELS: Record<Creation["type"], string> = {
  editeur: "Éditeur",
  studio: "Studio",
  stories: "Stories",
};

const TYPE_COLORS: Record<Creation["type"], string> = {
  editeur: "#8B5CF6",
  studio: "#EC4899",
  stories: "#F59E0B",
};

// ── Sub-components ─────────────────────────────────────────────────────────
function TemplateCard({ t, onUse }: { t: Template; onUse: (id: string) => void }) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  return (
    <>
      <View className="relative rounded-xl overflow-hidden group" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }} whileHover={{ scale: 1.02 }} onPress={() => setShowDetail(true)}>
        {/* Thumbnail */}
        <View className="w-full relative" style={{ paddingBottom: `${(t.height / t.width) * 100}%`, backgroundColor: THUMB_GRADIENTS[t.thumbnail] }}><View className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}><View className="flex gap-2"><Pressable className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: "#6C5CE7" }} whileHover={{ scale: 1.05 }} onPress={(e) => { onUse(t.id); }}>Utiliser</Pressable><Pressable className="p-1.5 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.2)" }} whileHover={{ scale: 1.05 }} onPress={(e) => { setShowDetail(true); }}><Eye size={14} className="text-white" /></Pressable></View></View>{}<View className="absolute top-2 left-2 flex gap-1">{t.isNew && (
              <Text className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: "#00B894", color: "#fff" }}>NEW</Text>
            )}{t.isPremium && (
              <Text className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: "#FDCB6E", color: "#2D3436" }}>PRO</Text>
            )}</View><View className="absolute top-2 right-2 flex gap-1"><Pressable className="p-1 rounded-lg" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} whileHover={{ scale: 1.1 }} onPress={(e) => { setLiked(!liked); toast(liked ? "Retiré des favoris" : "Ajouté aux favoris"); }}><Heart size={12} className={liked ? "fill-red-400 text-red-400" : "text-white"} /></Pressable><Pressable className="p-1 rounded-lg" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} whileHover={{ scale: 1.1 }} onPress={(e) => { setBookmarked(!bookmarked); toast(bookmarked ? "Retiré" : "Sauvegardé"); }}><Bookmark size={12} className={bookmarked ? "fill-yellow-400 text-yellow-400" : "text-white"} /></Pressable></View></View>
        {/* Info */}
        <View className="p-2.5"><Text className="text-white text-xs font-semibold truncate">{t.title}</Text><View className="flex items-center justify-between mt-1"><View className="flex items-center gap-1"><Star size={10} className="fill-yellow-400 text-yellow-400" /><Text className="text-gray-400 text-[10px]">{t.rating}</Text></View><Text className="text-gray-500 text-[10px]">{t.uses.toLocaleString()}utilisations</Text></View><View className="flex gap-1 mt-1.5 flex-wrap">{t.colors.map((c, i) => (
              <Text key={i} className="w-3 h-3 rounded-full border border-white/10 inline-block" style={{ backgroundColor: c }} />
            ))}</View></View>
      </View>

      {/* Detail Modal */}
<View>
        {showDetail && (
          <View className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onPress={() => setShowDetail(false)}>
            <View className="w-full max-w-md rounded-t-3xl p-6 pb-10" style={{ backgroundColor: "#1a1a2e", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} onPress={(e) => e.stopPropagation()}>
              <View className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-4" />
              <View className="w-full h-40 rounded-xl mb-4" style={{ backgroundColor: THUMB_GRADIENTS[t.thumbnail] }} />
              <Text className="text-white font-bold text-lg">{t.title}</Text>
              <Text className="text-gray-400 text-sm mt-1">{t.width}× {t.height}px</Text>
              <View className="flex gap-3 mt-3"><View className="flex items-center gap-1"><Star size={14} className="fill-yellow-400 text-yellow-400" /><Text className="text-white text-sm">{t.rating}</Text></View><View className="flex items-center gap-1"><Eye size={14} className="text-gray-400" /><Text className="text-gray-400 text-sm">{t.uses.toLocaleString()}uses</Text></View></View>
              <View className="flex gap-2 flex-wrap mt-3">{t.tags.map(tag => (
                  <Text key={tag} className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: "rgba(108,92,231,0.2)", color: "#a29bfe" }}>#{tag}</Text>
                ))}</View>
              <Pressable className="w-full py-3 rounded-xl font-bold text-white mt-5" style={{  }} whileTap={{ scale: 0.97 }} onPress={() => { onUse(t.id); setShowDetail(false); }}>Utiliser ce template</Pressable>
            </View>
          </View>
        )}
      </View>
    </>
  );
}

function AssetCard({ a }: { a: Asset }) {
  const [fav, setFav] = useState(a.isFavorite);
  return (
    <View className="rounded-xl overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }} whileHover={{ scale: 1.03 }}>
      <View className="w-full h-24 relative" style={{ backgroundColor: THUMB_GRADIENTS[a.thumbnail] }}><Pressable className="absolute top-2 right-2 p-1.5 rounded-lg" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} whileHover={{ scale: 1.1 }} onPress={() => { setFav(!fav); toast(fav ? "Retiré des favoris" : "Favori ajouté"); }}><Heart size={12} className={fav ? "fill-red-400 text-red-400" : "text-white"} /></Pressable></View>
      <View className="p-2"><Text className="text-white text-xs font-medium truncate">{a.title}</Text><View className="flex gap-1 mt-1 flex-wrap">{a.tags.map(t => <Text key={t} className="text-[9px] text-gray-500">#{t}</Text>)}</View></View>
    </View>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function TemplatesPage({ onBack, onNavigate }: { onBack: () => void; onNavigate?: (page: string) => void }) {
  const [tab, setTab] = useState<Tab>("templates");
  const [templateCat, setTemplateCat] = useState<TemplateCategory>("all");
  const [assetCat, setAssetCat] = useState<AssetCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [favoritePalettes, setFavoritePalettes] = useState<Set<string>>(new Set());
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    return TEMPLATES.filter(t => {
      const matchCat = templateCat === "all" || t.category === templateCat;
      const matchSearch = !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.tags.some(tg => tg.includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [templateCat, searchQuery]);

  const filteredAssets = useMemo(() => {
    return ASSETS.filter(a => {
      const matchCat = assetCat === "all" || a.category === assetCat;
      const matchSearch = !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [assetCat, searchQuery]);

  const handleUseTemplate = (id: string) => {
    const t = TEMPLATES.find(x => x.id === id);
    toast.success(`Template "${t?.title}" ouvert dans Studio Photo`);
    setTimeout(() => onNavigate?.("studio"), 500);
  };

  const handleExportCreation = (id: string) => {
    setExportingId(id);
    setTimeout(() => {
      setExportingId(null);
      toast.success("Création exportée en haute résolution !");
    }, 1500);
  };

  const copyColor = (hex: string) => {
    Clipboard.setString(hex).catch(() => {});
    setCopiedColor(hex);
    toast.success(`Couleur ${hex} copiée !`);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const toggleFavPalette = (id: string) => {
    setFavoritePalettes(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); toast("Palette retirée"); }
      else { next.add(id); toast.success("Palette sauvegardée !"); }
      return next;
    });
  };

  const totalStats = {
    templates: TEMPLATES.length,
    assets: ASSETS.length,
    creations: MY_CREATIONS.length,
    totalViews: MY_CREATIONS.reduce((s, c) => s + c.views, 0),
    totalExports: MY_CREATIONS.reduce((s, c) => s + c.exports, 0),
  };

  return (
    <View className="min-h-screen text-white" style={{  }}>{}<View className="sticky top-0 z-40 px-4 pt-12 pb-3" style={{ backgroundColor: "rgba(10,10,26,0.95)" }}><View className="flex items-center gap-3 mb-4"><Pressable className="p-2 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} whileTap={{ scale: 0.9 }} onPress={onBack}><ArrowLeft size={20} /></Pressable><View><Text className="text-xl font-bold text-white">Templates & Assets</Text><Text className="text-xs text-gray-400">Bibliothèque créative complète</Text></View><View className="ml-auto flex gap-2"><Pressable className="p-2 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} whileTap={{ scale: 0.9 }} onPress={() => setViewMode(v => v === "grid" ? "list" : "grid")}>{viewMode === "grid" ? <List size={18} /> : <Grid3X3 size={18} />}</Pressable><Pressable className="p-2 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} whileTap={{ scale: 0.9 }}><Filter size={18} /></Pressable></View></View>{}<View className="flex gap-1 p-1 rounded-xl mb-3" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>{(["templates", "assets", "mes-creations", "stats"] as Tab[]).map(t => (
            <Pressable key={t} className="flex-1 py-2 rounded-lg text-xs font-semibold transition-colors" style={tab === t ? {  } : {  }} whileTap={{ scale: 0.95 }} onPress={() => setTab(t)}>
              {t === "templates" ? "Templates" : t === "assets" ? "Assets" : t === "mes-creations" ? "Mes Créations" : "Stats"}
            </Pressable>
          ))}</View>{}{(tab === "templates" || tab === "assets") && (
          <View className="flex items-center gap-2 px-3 py-2 rounded-xl mb-2" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}><Search size={16} className="text-gray-500" /><TextInput className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none" placeholder={tab === "templates" ? "Rechercher un template..." : "Rechercher un asset..."} value={searchQuery} onChangeText={value => setSearchQuery(value)} />{searchQuery && <Pressable onPress={() => setSearchQuery("")}><X size={14} className="text-gray-500" /></Pressable>}</View>
        )}</View><View className="px-4 pb-24">{}{tab === "templates" && (
          <View initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Category filter */}
            <View className="flex gap-2 overflow-x-auto pb-2 mb-4">{TEMPLATE_CATS.map(c => (
                <Pressable key={c.id} className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold" style={templateCat === c.id
                    ? { backgroundColor: "#6C5CE7" }
                    : { backgroundColor: "rgba(255,255,255,0.07)" }} whileTap={{ scale: 0.95 }} onPress={() => setTemplateCat(c.id)}>{c.label}</Pressable>
              ))}</View>

            {/* Count */}
            <Text className="text-gray-500 text-xs mb-3">{filteredTemplates.length}template{filteredTemplates.length !== 1 ? "s" : ""}</Text>

            {/* Grid */}
            <View className={`grid gap-3 ${viewMode === "grid" ? "grid-cols-2" : "grid-cols-1"}`}>{filteredTemplates.map((t, i) => (
                <View key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  {viewMode === "grid" ? (
                    <TemplateCard t={t} onUse={handleUseTemplate} />
                  ) : (
                    <View className="flex gap-3 rounded-xl p-3" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }} whileHover={{ scale: 1.01 }} onPress={() => handleUseTemplate(t.id)}>
                      <View className="w-16 h-16 rounded-xl flex-shrink-0" style={{ backgroundColor: THUMB_GRADIENTS[t.thumbnail] }} />
                      <View className="flex-1 min-w-0"><View className="flex items-center gap-1.5"><Text className="text-white text-sm font-semibold truncate">{t.title}</Text>{t.isPremium && <Text className="px-1.5 py-0.5 rounded text-[9px] font-bold flex-shrink-0" style={{ backgroundColor: "#FDCB6E", color: "#2D3436" }}>PRO</Text>}</View><Text className="text-gray-500 text-xs mt-0.5">{t.width}×{t.height}px</Text><View className="flex items-center gap-3 mt-1"><View className="flex items-center gap-1"><Star size={10} className="fill-yellow-400 text-yellow-400" /><Text className="text-xs text-gray-400">{t.rating}</Text></View><Text className="text-xs text-gray-500">{t.uses.toLocaleString()}uses</Text></View></View>
                      <ChevronRight size={16} className="text-gray-600 self-center" />
                    </View>
                  )}
                </View>
              ))}</View>
          </View>
        )}{}{tab === "assets" && (
          <View initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Category filter */}
            <View className="flex gap-2 overflow-x-auto pb-2 mb-4">{ASSET_CATS.map(c => (
                <Pressable key={c.id} className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold" style={assetCat === c.id
                    ? { backgroundColor: "#6C5CE7" }
                    : { backgroundColor: "rgba(255,255,255,0.07)" }} whileTap={{ scale: 0.95 }} onPress={() => setAssetCat(c.id)}>{c.label}</Pressable>
              ))}</View>

            {/* Assets grid */}
            {(assetCat === "all" || assetCat !== "palettes") && (
              <View className="gap-3 mb-6">{filteredAssets.filter(a => a.category !== "palettes").map((a, i) => (
                  <View key={a.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <AssetCard a={a} />
                  </View>
                ))}</View>
            )}

            {/* Palettes section */}
            {(assetCat === "all" || assetCat === "palettes") && (
              <>
                <Text className="text-white font-bold text-sm mb-3 flex items-center gap-2"><Palette size={16} style={{  }} />Palettes de couleurs</Text>
                <View className="space-y-3">{PALETTES.map((pal, i) => (
                    <View key={pal.id} className="rounded-xl p-3" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                      <View className="flex items-center justify-between mb-2"><Text className="text-white text-sm font-semibold">{pal.name}</Text><View className="flex items-center gap-2"><Text className="text-gray-500 text-xs">{pal.likes}♥</Text><Pressable className="p-1 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} whileTap={{ scale: 0.9 }} onPress={() => toggleFavPalette(pal.id)}><Bookmark size={12} className={favoritePalettes.has(pal.id) ? "fill-yellow-400 text-yellow-400" : "text-gray-400"} /></Pressable></View></View>
                      <View className="flex gap-1.5">{pal.colors.map(hex => (
                          <Pressable key={hex} className="flex-1 h-10 rounded-lg relative group" style={{ backgroundColor: hex }} whileHover={{ scale: 1.05 }} onPress={() => copyColor(hex)}>
<View>
                              {copiedColor === hex && (
                                <View className="absolute inset-0 flex items-center justify-center rounded-lg" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                  <Check size={14} className="text-white" />
                                </View>
                              )}
                            </View>
                          </Pressable>
                        ))}</View>
                      <Text className="text-gray-600 text-[10px] mt-1.5">Cliquer sur une couleur pour la copier</Text>
                    </View>
                  ))}</View>
              </>
            )}
          </View>
        )}{}{tab === "mes-creations" && (
          <Authenticated>
            <MesCreationsTab onNavigate={onNavigate} />
          </Authenticated>
        )}{}{tab === "stats" && (
          <View initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* KPIs */}
            <View className="gap-3 mb-6">{[
                { label: "Templates disponibles", value: totalStats.templates, icon: LayoutTemplate, color: "#6C5CE7" },
                { label: "Assets disponibles", value: totalStats.assets, icon: Package, color: "#00B894" },
                { label: "Mes créations", value: totalStats.creations, icon: FolderOpen, color: "#FDCB6E" },
                { label: "Vues totales", value: totalStats.totalViews.toLocaleString(), icon: TrendingUp, color: "#E17055" },
              ].map(s => (
                <View key={s.label} className="rounded-2xl p-4" style={{ backgroundColor: `${s.color}11`, borderStyle: "solid" }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                  <s.icon size={20} style={{  }} className="mb-2" />
                  <Text className="text-white font-bold text-2xl">{s.value}</Text>
                  <Text className="text-gray-400 text-xs mt-0.5">{s.label}</Text>
                </View>
              ))}</View>

            {/* Top templates */}
            <Text className="text-white font-bold text-sm mb-3 flex items-center gap-2"><TrendingUp size={16} style={{  }} />Templates les plus utilisés
            </Text>
            <View className="space-y-2 mb-6">{[...TEMPLATES].sort((a, b) => b.uses - a.uses).slice(0, 5).map((t, i) => (
                <View key={t.id} className="flex items-center gap-3 rounded-xl p-3" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
                  <Text className="text-gray-500 font-bold text-sm w-5">#{i + 1}</Text>
                  <View className="w-8 h-8 rounded-lg flex-shrink-0" style={{ backgroundColor: THUMB_GRADIENTS[t.thumbnail] }} />
                  <View className="flex-1 min-w-0"><Text className="text-white text-xs font-semibold truncate">{t.title}</Text><View className="flex items-center gap-1"><View className="h-1 rounded-full mt-0.5" style={{ width: `${(t.uses / TEMPLATES[0].uses) * 100}%`, backgroundColor: "#6C5CE7", minWidth: 20 }} /><Text className="text-gray-500 text-[10px] ml-1">{t.uses.toLocaleString()}</Text></View></View>
                  <View className="flex items-center gap-1"><Star size={10} className="fill-yellow-400 text-yellow-400" /><Text className="text-gray-400 text-[10px]">{t.rating}</Text></View>
                </View>
              ))}</View>

            {/* Performance mes créations */}
            <Text className="text-white font-bold text-sm mb-3 flex items-center gap-2"><BarChart2 size={16} style={{  }} />Performance de mes créations
            </Text>
            <View className="space-y-2">{MY_CREATIONS.sort((a, b) => b.views - a.views).map((c, i) => (
                <View key={c.id} className="flex items-center gap-3 rounded-xl p-3" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
                  <View className="w-8 h-8 rounded-lg flex-shrink-0" style={{ backgroundColor: THUMB_GRADIENTS[c.thumbnail] }} />
                  <View className="flex-1 min-w-0"><Text className="text-white text-xs font-semibold truncate">{c.title}</Text><View className="flex items-center gap-2 mt-0.5"><View className="flex items-center gap-1"><Eye size={9} className="text-gray-500" /><Text className="text-gray-400 text-[10px]">{c.views}</Text></View><View className="flex items-center gap-1"><Download size={9} className="text-gray-500" /><Text className="text-gray-400 text-[10px]">{c.exports}</Text></View></View></View>
                  <Text className="px-2 py-0.5 rounded text-[9px] font-bold" style={{ backgroundColor: `${TYPE_COLORS[c.type]}22`, color: TYPE_COLORS[c.type] }}>{TYPE_LABELS[c.type]}</Text>
                </View>
              ))}</View>

            {/* Explore more */}
            <View className="mt-6 rounded-2xl p-4 flex items-center gap-3" style={{ borderWidth: 1, borderColor: "rgba(108,92,231,0.3)", borderStyle: "solid" }} whileHover={{ scale: 1.01 }} onPress={() => setTab("templates")}>
              <Sparkles size={24} style={{  }} />
              <View><Text className="text-white font-semibold text-sm">Explorer plus de templates</Text><Text className="text-gray-400 text-xs">Découvre notre bibliothèque complète</Text></View>
              <ExternalLink size={16} className="text-gray-500 ml-auto" />
            </View>
          </View>
        )}</View></View>
  );
}

// ── Mes Créations Tab (live data) ──────────────────────────────────────────

function MesCreationsTab({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const projects = useQuery(api.media.listMyProjects, {});
  const createProject = useMutation(api.media.createCollaborativeProject);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!newTitle.trim()) { toast.error("Titre requis"); return; }
    setSaving(true);
    try {
      await createProject({ title: newTitle, description: newDesc || newTitle, category: "création", tags: [] });
      toast.success("Projet créé !");
      setShowCreate(false);
      setNewTitle(""); setNewDesc("");
    } catch { toast.error("Erreur"); }
    finally { setSaving(false); }
  };

  return (
    <View initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <View className="flex gap-2 mb-5">{[
          { label: "Éditeur", page: "editeur", color: "#8B5CF6" },
          { label: "Studio", page: "studio", color: "#EC4899" },
          { label: "Projet", page: "project", color: "#F59E0B" },
        ].map((btn) => (
          <Pressable key={btn.page} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-white" style={{ backgroundColor: `${btn.color}22`, borderStyle: "solid" }} whileTap={{ scale: 0.95 }} onPress={() => btn.page === "project" ? setShowCreate(true) : onNavigate?.(btn.page)}>
            <Plus size={14} style={{  }} />{btn.label}
          </Pressable>
        ))}</View>

<View>
        {showCreate && (
          <View initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4 p-4 rounded-2xl space-y-3" style={{ backgroundColor: "rgba(108,92,231,0.08)", borderWidth: 1, borderColor: "rgba(108,92,231,0.2)", borderStyle: "solid" }}>
            <Text className="text-white font-bold text-sm">Nouveau projet collaboratif</Text>
            <TextInput value={newTitle} onChangeText={(value) => setNewTitle(value)} placeholder="Titre..." className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} />
            <TextInput value={newDesc} onChangeText={(value) => setNewDesc(value)} placeholder="Description..." className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} multiline textAlignVertical="top" />
            <View className="flex gap-2"><Pressable onPress={() => setShowCreate(false)} className="flex-1 py-2 rounded-xl text-sm" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}><Text>Annuler</Text></Pressable><Pressable onPress={() => { void handleCreate(); }} disabled={saving} className="flex-1 py-2 rounded-xl text-sm font-bold" style={{ backgroundColor: "#6C5CE7" }}>{saving ? "…" : "Créer"}</Pressable></View>
          </View>
        )}
      </View>

      {projects === undefined ? (
        <View className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />)}</View>
      ) : projects.length === 0 ? (
        <View className="flex flex-col items-center justify-center py-12 gap-3"><FolderOpen size={36} className="text-white/20" /><Text className="text-gray-500 text-sm">Aucune création. Commencez maintenant !</Text></View>
      ) : (
        <View className="space-y-3">{projects.map((p, i) => (
            <View key={p._id} className="flex gap-3 rounded-xl p-3" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <View className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: "rgba(108,92,231,0.15)" }}>{p.coverImage
                  ? <Image className="w-full h-full object-cover rounded-xl" source={{ uri: p.coverImage }} accessibilityLabel={p.title} />
                  : <FolderOpen size={20} style={{  }} />}</View>
              <View className="flex-1 min-w-0"><View className="flex items-center gap-2"><Text className="text-white text-sm font-semibold truncate">{p.title}</Text><Text className="px-1.5 py-0.5 rounded text-[9px] font-bold flex-shrink-0" style={{ backgroundColor: "rgba(108,92,231,0.2)", color: "#a29bfe" }}>{p.status}</Text></View><Text className="text-gray-500 text-xs mt-0.5">{p.description}</Text><Text className="text-xs text-gray-400">{p.contributorCount}contributeur{p.contributorCount > 1 ? "s" : ""}</Text></View>
            </View>
          ))}</View>
      )}
    </View>
  );
}
