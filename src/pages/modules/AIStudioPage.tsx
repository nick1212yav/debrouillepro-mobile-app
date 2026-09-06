import { UIService } from "@/core/sdk/ui/UIService";
import { Picker } from "@react-native-picker/picker";
import { View, Pressable, Image, Text, TextInput } from "react-native";
import { useState, useEffect } from "react";
import {
  ArrowLeft, Sparkles, FileText, Tag, Languages, ShieldCheck,
  User2, Image, Copy, Check, RefreshCw, ChevronDown, Wand2,
  Zap, Star, Clock, Loader2,
} from "lucide-react-native";
import { useAction, useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────────

type TabId = "generate" | "tags" | "translate" | "moderate" | "personalize" | "image";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
  color: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const TABS: Tab[] = [
  { id: "generate",    label: "Générer",     icon: FileText,    color: "#8B5CF6" },
  { id: "tags",        label: "Tags auto",   icon: Tag,         color: "#F59E0B" },
  { id: "translate",   label: "Traduire",    icon: Languages,   color: "#3B82F6" },
  { id: "moderate",    label: "Modérer",     icon: ShieldCheck, color: "#10B981" },
  { id: "personalize", label: "Perso.",      icon: User2,       color: "#EC4899" },
  { id: "image",       label: "Analyser img",icon: Image,       color: "#F97316" },
];

const LANGUAGES = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "lingala", label: "Lingala" },
  { code: "swahili", label: "Swahili" },
  { code: "hausa", label: "Hausa" },
  { code: "yoruba", label: "Yoruba" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "ar", label: "العربية" },
];

const CONTENT_TYPES = [
  { value: "post",                 label: "Publication réseau social" },
  { value: "job_description",      label: "Offre d'emploi" },
  { value: "property_description", label: "Annonce immobilière" },
  { value: "product_description",  label: "Description de produit" },
  { value: "event_description",    label: "Description d'événement" },
  { value: "bio",                  label: "Biographie professionnelle" },
];

const TONES = [
  { value: "casual",      label: "Décontracté" },
  { value: "formel",      label: "Formel" },
  { value: "persuasif",   label: "Persuasif" },
  { value: "informatif",  label: "Informatif" },
];

// ─── Sub-components ─────────────────────────────────────────────────────────────

function ResultBox({ text, onCopy }: { text: string; onCopy: () => void }) {
  return (
    <View
      className="mt-4 relative rounded-2xl p-4"
      style={{ backgroundColor: "rgba(139,92,246,0.08)", borderWidth: 1, borderColor: "rgba(139,92,246,0.2)", borderStyle: "solid" }}
    >
      <Text className="text-sm text-white/85 leading-relaxed pr-8">{text}</Text>
      <Pressable
        onPress={onCopy}
        className="absolute top-3 right-3 w-7 h-7 rounded-xl flex items-center justify-center"
       
      >
        <Copy size={13} className="text-white/40" />
      </Pressable>
    </View>
  );
}

function TagList({ tags }: { tags: string[] }) {
  const [copied, setCopied] = useState(false);
  return (
    <View className="mt-4">
      <View className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <Text key={tag}
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: "rgba(245,158,11,0.15)", color: "#FCD34D", borderWidth: 1, borderColor: "rgba(245,158,11,0.25)", borderStyle: "solid" }}
          >
            #{tag}
          </Text>
        ))}
      </View>
      <Pressable
        onPress={() => { void undefined.writeText(tags.map(t => `#${t}`).join(" ")); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        className="mt-3 flex items-center gap-1.5 text-xs text-white/40"
      >
        {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
        {copied ? "Copié !" : "Copier tous les tags"}
      </Pressable>
    </View>
  );
}

// ─── Tab Panels ────────────────────────────────────────────────────────────────

function GeneratePanel() {
  const generateContent = useAction(api.ai.generateContent);
  const [contentType, setContentType] = useState<"post" | "job_description" | "property_description" | "product_description" | "event_description" | "bio">("post");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<"formel" | "casual" | "persuasif" | "informatif">("casual");
  const [maxWords, setMaxWords] = useState(150);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!topic.trim()) { UIService.openToast("Saisis un sujet", "error"); return; }
    setLoading(true);
    try {
      const { content } = await generateContent({ type: contentType, topic, tone, maxWords });
      setResult(content);
    } catch { UIService.openToast("Erreur de génération", "error"); }
    finally { setLoading(false); }
  };

  const copyResult = () => {
    void undefined.writeText(result);
    UIService.openToast("Copié dans le presse-papier !", "success");
  };

  return (
    <View className="flex flex-col gap-4">
      <View>
        <Text className="text-xs text-white/50 mb-1.5 block">Type de contenu</Text>
        <View className="relative">
          <Picker
           
            onValueChange={val => setContentType(val as typeof contentType)}
            className="w-full rounded-xl px-4 py-3 text-sm text-white pr-10"
            style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
           selectedValue={contentType}>
            {CONTENT_TYPES.map(t => <Picker.Item label={`${t.label}`} value={t.value} />)}
          </Picker>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" />
        </View>
      </View>

      <View>
        <Text className="text-xs text-white/50 mb-1.5 block">Sujet / mots-clés</Text>
        <TextInput
          value={topic}
          onChangeText={text => setTopic(text)}
          placeholder="Ex: appartement 3 pièces à Kinshasa, vue sur le fleuve, calme..."
         
          className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none"
          style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
         multiline textAlignVertical="top"/>
      </View>

      <View className="flex gap-3">
        <View className="flex-1">
          <Text className="text-xs text-white/50 mb-1.5 block">Ton</Text>
          <View className="relative">
            <Picker
             
              onValueChange={val => setTone(val as typeof tone)}
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
             selectedValue={tone}>
              {TONES.map(t => <Picker.Item label={`${t.label}`} value={t.value} />)}
            </Picker>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40" />
          </View>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-white/50 mb-1.5 block">Nb. mots (max)</Text>
          <TextInput
           
            value={maxWords}
            onChangeText={text => setMaxWords(Number(text))}
            min={50}
            max={500}
            step={50}
            className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
            style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
           keyboardType="numeric"/>
        </View>
      </View>

      <Pressable
        onPress={() => { void run(); }}
        disabled={loading}
        className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold"
        style={{ opacity: loading ? 0.7 : 1 }}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
        {loading ? "Génération en cours…" : "Générer le contenu"}
      </Pressable>

      {result && <ResultBox text={result} onCopy={copyResult} />}
    </View>
  );
}

function TagsPanel() {
  const suggestTags = useAction(api.ai.suggestTags);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!content.trim()) { UIService.openToast("Saisis du contenu", "error"); return; }
    setLoading(true);
    try {
      const res = await suggestTags({ content, category: category || undefined });
      setTags(res.tags);
    } catch { UIService.openToast("Erreur de suggestion", "error"); }
    finally { setLoading(false); }
  };

  return (
    <View className="flex flex-col gap-4">
      <View>
        <Text className="text-xs text-white/50 mb-1.5 block">Contenu à analyser</Text>
        <TextInput
          value={content}
          onChangeText={text => setContent(text)}
          placeholder="Colle ton texte ici pour obtenir des suggestions de tags automatiques..."
         
          className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none"
          style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
         multiline textAlignVertical="top"/>
      </View>
      <View>
        <Text className="text-xs text-white/50 mb-1.5 block">Catégorie (optionnel)</Text>
        <TextInput
         
          value={category}
          onChangeText={text => setCategory(text)}
          placeholder="immobilier, emploi, événement..."
          className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none"
          style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
        />
      </View>
      <Pressable
        onPress={() => { void run(); }}
        disabled={loading}
        className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold"
        style={{ opacity: loading ? 0.7 : 1 }}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Tag size={16} />}
        {loading ? "Analyse en cours…" : "Suggérer des tags"}
      </Pressable>
      {tags.length > 0 && <TagList tags={tags} />}
    </View>
  );
}

function TranslatePanel() {
  const translateText = useAction(api.ai.translateText);
  const [text, setText] = useState("");
  const [targetLang, setTargetLang] = useState("en");
  const [result, setResult] = useState<{ translated: string; detectedLanguage: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!text.trim()) { UIService.openToast("Saisis du texte", "error"); return; }
    setLoading(true);
    try {
      const res = await translateText({ text, targetLanguage: targetLang });
      setResult(res);
    } catch { UIService.openToast("Erreur de traduction", "error"); }
    finally { setLoading(false); }
  };

  const copyResult = () => {
    if (!result) return;
    void undefined.writeText(result.translated);
    UIService.openToast("Traduction copiée !", "success");
  };

  return (
    <View className="flex flex-col gap-4">
      <View>
        <Text className="text-xs text-white/50 mb-1.5 block">Texte source</Text>
        <TextInput
          value={text}
          onChangeText={text => setText(text)}
          placeholder="Saisis le texte à traduire..."
         
          className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none"
          style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
         multiline textAlignVertical="top"/>
      </View>
      <View>
        <Text className="text-xs text-white/50 mb-1.5 block">Langue cible</Text>
        <View className="relative">
          <Picker
           
            onValueChange={val => setTargetLang(val)}
            className="w-full rounded-xl px-4 py-3 text-sm text-white"
            style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
           selectedValue={targetLang}>
            {LANGUAGES.map(l => <Picker.Item label={`${l.label}`} value={l.code} />)}
          </Picker>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" />
        </View>
      </View>
      <Pressable
        onPress={() => { void run(); }}
        disabled={loading}
        className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold"
        style={{ opacity: loading ? 0.7 : 1 }}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Languages size={16} />}
        {loading ? "Traduction en cours…" : "Traduire"}
      </Pressable>
      {result && (
        <View className="mt-1">
          <View className="flex items-center gap-2 mb-2">
            <Text className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(59,130,246,0.15)", color: "#93C5FD", borderWidth: 1, borderColor: "rgba(59,130,246,0.2)", borderStyle: "solid" }}>
              Langue détectée : {result.detectedLanguage}
            </Text>
          </View>
          <ResultBox text={result.translated} onCopy={copyResult} />
        </View>
      )}
    </View>
  );
}

function ModeratePanel() {
  const moderateText = useAction(api.ai.moderateText);
  const [text, setText] = useState("");
  const [context, setContext] = useState("post");
  const [result, setResult] = useState<{ safe: boolean; reason: string; severity: string; categories: string[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!text.trim()) { UIService.openToast("Saisis du contenu", "error"); return; }
    setLoading(true);
    try {
      const res = await moderateText({ text, context });
      setResult(res);
    } catch { UIService.openToast("Erreur de modération", "error"); }
    finally { setLoading(false); }
  };

  const severityColor: Record<string, string> = {
    none: "#10B981", low: "#F59E0B", medium: "#F97316", high: "#EF4444",
  };
  const severityLabel: Record<string, string> = {
    none: "Aucune", low: "Faible", medium: "Moyen", high: "Élevé",
  };

  return (
    <View className="flex flex-col gap-4">
      <View>
        <Text className="text-xs text-white/50 mb-1.5 block">Contenu à analyser</Text>
        <TextInput
          value={text}
          onChangeText={text => setText(text)}
          placeholder="Colle le texte que tu veux modérer..."
         
          className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none"
          style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
         multiline textAlignVertical="top"/>
      </View>
      <View>
        <Text className="text-xs text-white/50 mb-1.5 block">Contexte</Text>
        <View className="flex gap-2 flex-wrap">
          {["post", "comment", "bio"].map(c => (
            <Pressable key={c} onPress={() => setContext(c)}
              className={cn("px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all",
                context === c ? "text-white" : "text-white/40")}
              style={context === c
                ? { backgroundColor: "rgba(16,185,129,0.2)", borderWidth: 1, borderColor: "rgba(16,185,129,0.4)", borderStyle: "solid" }
                : { backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }
              }
            >
              {c === "post" ? "Publication" : c === "comment" ? "Commentaire" : "Bio"}
            </Pressable>
          ))}
        </View>
      </View>
      <Pressable
        onPress={() => { void run(); }}
        disabled={loading}
        className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold"
        style={{ opacity: loading ? 0.7 : 1 }}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
        {loading ? "Analyse en cours…" : "Analyser le contenu"}
      </Pressable>
      {result && (
        <View
          className="mt-1 rounded-2xl p-4"
          style={{ backgroundColor: result.safe ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", borderColor: "rgba(16,185,129,0.2)", borderStyle: "solid" }}>
          <View className="flex items-center gap-3 mb-3">
            <View className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: result.safe ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)" }}>
              {result.safe
                ? <Check size={18} style={{ color: "#10B981" }} />
                : <ShieldCheck size={18} style={{ color: "#EF4444" }} />
              }
            </View>
            <View>
              <Text className="text-sm font-bold" style={{ color: result.safe ? "#34D399" : "#F87171" }}>
                {result.safe ? "Contenu conforme" : "Contenu potentiellement problématique"}
              </Text>
              <Text className="text-xs text-white/40">
                Sévérité : <Text style={{ color: severityColor[result.severity] ?? "#fff" }}>{severityLabel[result.severity] ?? result.severity}</Text>
              </Text>
            </View>
          </View>
          {result.reason && <Text className="text-xs text-white/60 mb-2">{result.reason}</Text>}
          {result.categories.length > 0 && (
            <View className="flex flex-wrap gap-1.5">
              {result.categories.map(c => (
                <Text key={c} className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#FCA5A5", borderWidth: 1, borderColor: "rgba(239,68,68,0.2)", borderStyle: "solid" }}>
                  {c}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function PersonalizePanel() {
  const aiPersonalize = useAction(api.ai.aiPersonalize);
  const { isAuthenticated } = useConvexAuth();
  const savedPrefs = useQuery(api.aiPreferences.getMyPreferences, isAuthenticated ? {} : "skip");
  const savePreferences = useMutation(api.aiPreferences.savePreferences);

  const [interests, setInterests] = useState("");
  const [city, setCity] = useState("");
  const [activity, setActivity] = useState("");
  const [result, setResult] = useState<{ recommendedModules: string[]; recommendedTags: string[]; welcomeMessage: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Pre-fill from saved preferences
  useEffect(() => {
    if (savedPrefs && !interests) {
      setInterests(savedPrefs.interests.join(", "));
      setCity(savedPrefs.city ?? "");
      if (savedPrefs.recommendedModules || savedPrefs.recommendedTags || savedPrefs.welcomeMessage) {
        setResult({
          recommendedModules: savedPrefs.recommendedModules ?? [],
          recommendedTags: savedPrefs.recommendedTags ?? [],
          welcomeMessage: savedPrefs.welcomeMessage ?? "",
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedPrefs]);

  const run = async () => {
    setLoading(true);
    try {
      const interestList = interests.split(",").map(s => s.trim()).filter(Boolean);
      const res = await aiPersonalize({
        userInterests: interestList,
        userCity: city || undefined,
        recentActivity: activity.split(",").map(s => s.trim()).filter(Boolean),
        availableModules: ["immo", "jobs", "transport", "sante", "paiement", "marketplace", "agri", "community", "evenements", "voyages", "apprendre", "fitness", "media"],
      });
      setResult(res);
      // Auto-save to Convex
      if (isAuthenticated) {
        await savePreferences({
          interests: interestList,
          city: city || undefined,
          recommendedModules: res.recommendedModules,
          recommendedTags: res.recommendedTags,
          welcomeMessage: res.welcomeMessage,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch { UIService.openToast("Erreur de personnalisation", "error"); }
    finally { setLoading(false); }
  };

  return (
    <View className="flex flex-col gap-4">
      <View>
        <Text className="text-xs text-white/50 mb-1.5 block">Intérêts (séparés par virgule)</Text>
        <TextInput
         
          value={interests}
          onChangeText={text => setInterests(text)}
          placeholder="immobilier, emploi, agriculture, santé..."
          className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none"
          style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
        />
      </View>
      <View>
        <Text className="text-xs text-white/50 mb-1.5 block">Ville</Text>
        <TextInput
         
          value={city}
          onChangeText={text => setCity(text)}
          placeholder="Kinshasa, Brazzaville, Douala..."
          className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none"
          style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
        />
      </View>
      <View>
        <Text className="text-xs text-white/50 mb-1.5 block">Activité récente (séparée par virgule)</Text>
        <TextInput
         
          value={activity}
          onChangeText={text => setActivity(text)}
          placeholder="jobs, immo, marketplace..."
          className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none"
          style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
        />
      </View>
      <Pressable
        onPress={() => { void run(); }}
        disabled={loading}
        className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold"
        style={{ opacity: loading ? 0.7 : 1 }}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Star size={16} />}
        {loading ? "Personnalisation…" : saved ? "Préférences sauvegardées !" : "Obtenir mes recommandations"}
      </Pressable>
      {result && (
        <View className="mt-1 space-y-3">
          {/* Welcome message */}
          <View className="rounded-2xl p-4"
            style={{ backgroundColor: "rgba(236,72,153,0.08)", borderWidth: 1, borderColor: "rgba(236,72,153,0.2)", borderStyle: "solid" }}>
            <Text className="text-xs text-white/40 mb-1">Message personnalisé</Text>
            <Text className="text-sm text-white font-semibold">{result.welcomeMessage}</Text>
          </View>
          {/* Modules */}
          {result.recommendedModules.length > 0 && (
            <View className="rounded-2xl p-4"
              style={{ backgroundColor: "rgba(139,92,246,0.08)", borderWidth: 1, borderColor: "rgba(139,92,246,0.2)", borderStyle: "solid" }}>
              <Text className="text-xs text-white/40 mb-2">Modules recommandés</Text>
              <View className="flex flex-wrap gap-2">
                {result.recommendedModules.map(m => (
                  <Text key={m} className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: "rgba(139,92,246,0.15)", color: "#C4B5FD", borderWidth: 1, borderColor: "rgba(139,92,246,0.25)", borderStyle: "solid" }}>
                    {m}
                  </Text>
                ))}
              </View>
            </View>
          )}
          {/* Tags */}
          {result.recommendedTags.length > 0 && (
            <View className="rounded-2xl p-4"
              style={{ backgroundColor: "rgba(245,158,11,0.08)", borderWidth: 1, borderColor: "rgba(245,158,11,0.2)", borderStyle: "solid" }}>
              <Text className="text-xs text-white/40 mb-2">Tags d'intérêt</Text>
              <View className="flex flex-wrap gap-2">
                {result.recommendedTags.map(t => (
                  <Text key={t} className="px-3 py-1 rounded-full text-xs"
                    style={{ backgroundColor: "rgba(245,158,11,0.1)", color: "#FCD34D", borderWidth: 1, borderColor: "rgba(245,158,11,0.2)", borderStyle: "solid" }}>
                    #{t}
                  </Text>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function ImagePanel() {
  const analyzeImage = useAction(api.ai.analyzeImage);
  const [imageUrl, setImageUrl] = useState("");
  const [task, setTask] = useState<"describe" | "extract_text" | "property_info" | "product_info" | "id_verify">("describe");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const TASKS = [
    { value: "describe",       label: "Décrire l'image" },
    { value: "extract_text",   label: "Extraire le texte (OCR)" },
    { value: "property_info",  label: "Info immobilier" },
    { value: "product_info",   label: "Identifier un produit" },
    { value: "id_verify",      label: "Vérifier une pièce d'identité" },
  ];

  const run = async () => {
    if (!imageUrl.trim()) { UIService.openToast("Saisis une URL d'image", "error"); return; }
    setLoading(true);
    try {
      const res = await analyzeImage({ imageUrl, task });
      setResult(res.result);
    } catch { UIService.openToast("Erreur d'analyse", "error"); }
    finally { setLoading(false); }
  };

  const copyResult = () => {
    void undefined.writeText(result);
    UIService.openToast("Copié !", "success");
  };

  return (
    <View className="flex flex-col gap-4">
      <View>
        <Text className="text-xs text-white/50 mb-1.5 block">URL de l'image</Text>
        <TextInput
         
          value={imageUrl}
          onChangeText={text => setImageUrl(text)}
          placeholder="https://..."
          className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none"
          style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
         keyboardType="url" autoCapitalize="none" autoCorrect={false}/>
      </View>
      {imageUrl && (
        <Image
          src={imageUrl}
          alt="Preview"
          className="w-full max-h-48 object-cover rounded-2xl"
          onError={e => { (e.target as Image).style.display = "none"; }}
        />
      )}
      <View>
        <Text className="text-xs text-white/50 mb-1.5 block">Type d'analyse</Text>
        <View className="flex flex-col gap-2">
          {TASKS.map(t => (
            <Pressable key={t.value} onPress={() => setTask(t.value as typeof task)}
              className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-left cursor-pointer transition-all",
                task === t.value ? "text-white" : "text-white/50")}
              style={task === t.value
                ? { backgroundColor: "rgba(249,115,22,0.15)", borderWidth: 1, borderColor: "rgba(249,115,22,0.35)", borderStyle: "solid" }
                : { backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }
              }
            >
              {task === t.value && <Check size={13} style={{ color: "#FB923C" }} />}
              {t.label}
            </Pressable>
          ))}
        </View>
      </View>
      <Pressable
        onPress={() => { void run(); }}
        disabled={loading}
        className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold"
        style={{ opacity: loading ? 0.7 : 1 }}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Image size={16} />}
        {loading ? "Analyse en cours…" : "Analyser l'image"}
      </Pressable>
      {result && <ResultBox text={result} onCopy={copyResult} />}
    </View>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

interface Props {
  onBack: () => void;
}

export default function AIStudioPage({ onBack }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("generate");

  const activeTabData = TABS.find(t => t.id === activeTab)!;

  return (
    <View
      className="h-full w-full flex flex-col overflow-hidden"
      style={{  }}
    >
      {/* Header */}
      <View className="flex-shrink-0 px-5 pt-14 pb-4">
        <View className="flex items-center gap-3 mb-6">
          <Pressable onPress={onBack}
            className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
            <ArrowLeft size={16} className="text-white" />
          </Pressable>
          <View className="flex-1">
            <View className="flex items-center gap-2">
              <Text className="text-lg font-black text-white tracking-tight">IA Studio</Text>
              <Text className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                style={{ color: "#fff" }}>
                BETA
              </Text>
            </View>
            <Text className="text-xs text-white/40">Toutes les actions intelligentes</Text>
          </View>
          {/* Stats badge */}
          <View className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ backgroundColor: "rgba(139,92,246,0.12)", borderWidth: 1, borderColor: "rgba(139,92,246,0.2)", borderStyle: "solid" }}>
            <Zap size={11} style={{ color: "#A78BFA" }} />
            <Text className="text-[10px] font-bold" style={{ color: "#A78BFA" }}>6 outils</Text>
          </View>
        </View>

        {/* Info banner */}
        <View className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-4"
          style={{ backgroundColor: "rgba(139,92,246,0.07)", borderWidth: 1, borderColor: "rgba(139,92,246,0.15)", borderStyle: "solid" }}>
          <Sparkles size={16} style={{ color: "#A78BFA" }} className="flex-shrink-0" />
          <Text className="text-xs text-white/50 leading-relaxed">
            Alimenté par <strong className="text-white/70">GPT-5 mini</strong> — conçu pour l'Afrique centrale. Génère, traduis, modère du contenu en quelques secondes.
          </Text>
        </View>

        {/* Tabs */}
        <View className="flex gap-1.5 overflow-x-auto pb-1" style={{  }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                style={isActive
                  ? { backgroundColor: `${tab.color}22`, borderStyle: "solid" }
                  : { backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }
                }
              >
                <Icon size={12} />
                {tab.label}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Panel */}
      <View className="flex-1 overflow-y-auto px-5 pb-8" style={{  }}>
        {/* Tab title */}
        <View className="flex items-center gap-2.5 mb-5">
          <View className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${activeTabData.color}22`, borderStyle: "solid" }}>
            <activeTabData.icon size={15} style={{ color: activeTabData.color }} />
          </View>
          <View>
            <Text className="text-sm font-bold text-white">{activeTabData.label}</Text>
          </View>
        </View>

        <>
          <View
            key={activeTab}
          >
            {activeTab === "generate" && <GeneratePanel />}
            {activeTab === "tags" && <TagsPanel />}
            {activeTab === "translate" && <TranslatePanel />}
            {activeTab === "moderate" && <ModeratePanel />}
            {activeTab === "personalize" && <PersonalizePanel />}
            {activeTab === "image" && <ImagePanel />}
          </View>
        </>
      </View>

      {/* Footer note */}
      <View className="flex-shrink-0 px-5 pb-6 pt-2 flex items-center justify-center gap-1.5">
        <Clock size={10} className="text-white/20" />
        <Text className="text-[9px] text-white/20"><Text>Résultats générés par IA — Vérifiez toujours avant publication</Text></Text>
      </View>
    </View>
  );
}
