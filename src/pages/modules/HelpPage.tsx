import { View, Pressable, Text, TextInput } from "react-native";
import { ArrowLeft, HelpCircle, MessageCircle, BookOpen, Video, ChevronDown, Search, Mail, Phone, Zap, AlertTriangle, Star } from "lucide-react-native";
import { useAppearance, ACCENT_PALETTES } from "@/hooks/use-appearance.ts";
import { useState } from "react";
import { toast } from "sonner";

interface HelpPageProps { onBack: () => void; }

const FAQ = [
  {
    category: "Compte",
    color: "#8B5CF6",
    items: [
      { q: "Comment créer mon compte ?", a: "Clique sur 'Commencer' depuis l'écran d'accueil, puis connecte-toi avec Google, Apple ou ton email. Ton profil est créé automatiquement." },
      { q: "Comment modifier mon profil ?", a: "Va dans l'onglet Profil (icône personne en bas), puis appuie sur 'Modifier le profil' pour changer ta photo, ton nom, ta bio et tes informations." },
      { q: "J'ai oublié mon mot de passe", a: "Sur l'écran de connexion, clique sur 'Mot de passe oublié' et entre ton email. Tu recevras un lien de réinitialisation dans les 5 minutes." },
    ]
  },
  {
    category: "Publications",
    color: "#F97316",
    items: [
      { q: "Comment publier une annonce ?", a: "Appuie sur le bouton + (centre de la barre du bas), choisis le type de publication (Immobilier, Emploi, etc.) et remplis le formulaire." },
      { q: "Puis-je modifier une publication ?", a: "Oui, va sur ta publication, appuie sur les 3 points '···' en haut à droite et sélectionne 'Modifier'." },
      { q: "Comment booster une publication ?", a: "Dans tes publications, appuie sur 'Booster' pour augmenter sa visibilité. Les boosts premium apparaissent en tête de fil." },
    ]
  },
  {
    category: "Paiements & Wallet",
    color: "#10B981",
    items: [
      { q: "Quelles méthodes de paiement sont acceptées ?", a: "M-Pesa, Airtel Money, Orange Money, carte bancaire (Visa/Mastercard) et le wallet intégré Débrouille Pay." },
      { q: "Comment recharger mon wallet ?", a: "Va dans Portefeuille > Recharger, choisis le montant et ta méthode préférée. Les crédits sont disponibles instantanément." },
      { q: "Une transaction a échoué, que faire ?", a: "Attends 5 minutes et vérifie ton solde. Si le montant a été débité sans créditer ton compte, contacte notre support avec la référence de la transaction." },
    ]
  },
  {
    category: "Technique",
    color: "#3B82F6",
    items: [
      { q: "L'app est lente ou plante", a: "Essaie de fermer et relancer l'app. Si le problème persiste, va dans Paramètres > Application > Mode hors-ligne et désactive-le temporairement." },
      { q: "Je ne reçois pas les notifications", a: "Vérifie que les notifications sont activées dans tes paramètres téléphone pour Débrouille Pro, et dans Paramètres > Notifications de l'app." },
      { q: "Comment effacer le cache ?", a: "Va dans les paramètres de ton téléphone > Applications > Débrouille Pro > Stockage > Effacer le cache. Tes données ne seront pas perdues." },
    ]
  },
];

function FaqItem({ question, answer, color }: { question: string; answer: string; color: string }) {
  const [open, setOpen] = useState(false);
  return (
    <View className="border-b last:border-0" style={{ borderColor: "rgba(255,255,255,0.04)" }}><Pressable onPress={() => setOpen(!open)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left"><Text className="flex-1 text-sm font-medium text-white/80">{question}</Text><View animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown size={16} className="text-white/30 shrink-0" /></View></Pressable><View>{open && (
          <View initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <Text className="px-4 pb-4 text-sm text-white/50 leading-relaxed">{answer}</Text>
          </View>
        )}</View></View>
  );
}

export default function HelpPage({ onBack }: HelpPageProps) {
  const { prefs } = useAppearance();
  const hex = ACCENT_PALETTES[prefs.accent].hex;
  const { gradFrom, gradTo } = ACCENT_PALETTES[prefs.accent];

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = FAQ.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      !search || item.q.toLowerCase().includes(search.toLowerCase()) || item.a.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0 && (!activeCategory || activeCategory === cat.category));

  return (
    <View className="flex flex-col h-full" style={{  }}>{}<View initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-12 pb-4 shrink-0 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}><View className="flex items-center gap-3 mb-4"><Pressable onPress={onBack} accessibilityLabel="Retour" className="w-10 h-10 rounded-2xl flex items-center justify-center active:scale-90 transition-transform" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><ArrowLeft size={18} className="text-white" accessibilityElementsHidden={true} importantForAccessibility="no-hide-descendants" /></Pressable><View><Text className="text-lg font-bold text-white">Aide & Support</Text><Text className="text-xs text-white/40">Centre d'aide Débrouille Pro</Text></View></View>{}<View className="relative"><Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" accessibilityElementsHidden={true} importantForAccessibility="no-hide-descendants" /><TextInput placeholder="Rechercher une question…" value={search} onChangeText={value => setSearch(value)} className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm text-white/80 placeholder:text-white/25 outline-none" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }} accessibilityLabel="Rechercher dans l'aide" returnKeyType="search" /></View></View><View className="flex-1 overflow-y-auto px-5 py-5 space-y-5">{}<View className="gap-2">{[
            { icon: MessageCircle, label: "Chat avec support", color: hex, action: () => toast.success("Chat ouvert ! Temps d'attente : ~2 min") },
            { icon: Mail,          label: "Envoyer un email",  color: "#3B82F6", action: () => toast.info("support@debrouille.pro") },
            { icon: Phone,         label: "Appeler",           color: "#10B981", action: () => toast.info("+243 997 123 456 · Lun–Ven 8h–18h") },
            { icon: AlertTriangle, label: "Signaler un bug",   color: "#F97316", action: () => toast.success("Rapport de bug envoyé. Merci !") },
          ].map(({ icon: Icon, label, color, action }) => (
            <Pressable key={label} onPress={action} className="flex flex-col items-center gap-2 p-4 rounded-2xl active:scale-95 transition-transform" style={{ backgroundColor: `${color}12`, borderStyle: "solid" }}><Icon size={20} style={{ color }} accessibilityElementsHidden={true} importantForAccessibility="no-hide-descendants" /><Text className="text-xs font-semibold text-white/70 text-center leading-tight">{label}</Text></Pressable>
          ))}</View>{}<View><Text className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 px-1">Ressources</Text><View className="rounded-3xl overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}>{[
              { icon: BookOpen, color: "#8B5CF6", label: "Guide de démarrage", desc: "Apprendre à utiliser Débrouille Pro" },
              { icon: Video,    color: "#EF4444", label: "Tutoriels vidéo",     desc: "5 vidéos · 2–5 min chacune" },
              { icon: Star,     color: "#F59E0B", label: "Nouveautés v2.8",     desc: "Toutes les nouveautés de cette version" },
              { icon: Zap,      color: "#10B981", label: "Astuces & conseils",  desc: "Tirer le meilleur de l'app" },
            ].map(({ icon: Icon, color, label, desc }) => (
              <Pressable key={label} onPress={() => toast.info(`${label} — bientôt disponible`)} className="flex items-center gap-3 px-4 py-3.5 w-full text-left border-b last:border-0" style={{ borderColor: "rgba(255,255,255,0.04)" }}><View className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}18` }}><Icon size={16} style={{ color }} accessibilityElementsHidden={true} importantForAccessibility="no-hide-descendants" /></View><View className="flex-1"><Text className="text-sm font-semibold text-white/85">{label}</Text><Text className="text-[11px] text-white/30">{desc}</Text></View><Text className="text-xs text-white/20">›</Text></Pressable>
            ))}</View></View>{}<View><Text className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 px-1">FAQ</Text><View className="flex gap-2 overflow-x-auto pb-2"><Pressable onPress={() => setActiveCategory(null)} className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all" style={{ backgroundColor: !activeCategory ? `${hex}30` : "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><Text>Tout</Text></Pressable>{FAQ.map(cat => (
              <Pressable key={cat.category} onPress={() => setActiveCategory(activeCategory === cat.category ? null : cat.category)} className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all" style={{ backgroundColor: activeCategory === cat.category ? `${cat.color}30` : "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>{cat.category}</Pressable>
            ))}</View></View>{}{filtered.length === 0 ? (
          <View className="text-center py-8"><HelpCircle size={32} className="mx-auto mb-3 text-white/20" accessibilityElementsHidden={true} importantForAccessibility="no-hide-descendants" /><Text className="text-sm text-white/40">Aucun résultat pour "{search}"</Text><Text className="text-xs text-white/25 mt-1">Essaie des mots-clés différents ou contacte le support</Text></View>
        ) : filtered.map(cat => (
          <View key={cat.category}><View className="flex items-center gap-2 mb-2 px-1"><View className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} /><Text className="text-[10px] font-bold uppercase tracking-widest" style={{ color: cat.color }}>{cat.category}</Text></View><View className="rounded-3xl overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}>{cat.items.map(item => (
                <FaqItem key={item.q} question={item.q} answer={item.a} color={cat.color} />
              ))}</View></View>
        ))}{}<View className="rounded-2xl p-4 flex items-center gap-3" style={{ backgroundColor: "#10B98112", borderWidth: 1, borderColor: "#10B98130", borderStyle: "solid" }}><View className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shrink-0" /><View><Text className="text-sm font-semibold text-green-400">Tous les systèmes opérationnels</Text><Text className="text-[11px] text-white/30">Dernière vérification il y a 2 min · status.debrouille.pro</Text></View></View><Text className="text-center text-[10px] text-white/20 pb-2">Support disponible Lun–Sam · 8h–20h (heure de Kinshasa)</Text></View></View>
  );
}
