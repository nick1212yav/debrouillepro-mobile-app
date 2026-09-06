import { View, Text, Pressable } from "react-native";
import { ArrowLeft, Scale, Code2, Package, ExternalLink, ShieldCheck, FileCode2 } from "lucide-react-native";
import { useAppearance, ACCENT_PALETTES } from "@/hooks/use-appearance";

interface LicensesPageProps { onBack: () => void; }

const LICENSES = [
  { name: "React", category: "Interface", license: "MIT", text: "Bibliothèque open source utilisée pour construire l'interface.", url: "https://github.com/facebook/react" },
  { name: "React Router", category: "Navigation", license: "MIT", text: "Gestion de la navigation entre les pages de l'application.", url: "https://github.com/remix-run/react-router" },
  { name: "Lucide", category: "Icônes", license: "ISC", text: "Collection d'icônes utilisée dans l'interface.", url: "https://github.com/lucide-icons/lucide" },
  { name: "Motion", category: "Animations", license: "MIT", text: "Animations et transitions de l'expérience utilisateur.", url: "https://github.com/motiondivision/motion" },
  { name: "Convex", category: "Backend", license: "Apache-2.0", text: "Infrastructure backend et fonctions de données de l'application.", url: "https://github.com/get-convex/convex-js" },
];

export default function LicensesPage({ onBack }: LicensesPageProps) {
  const { prefs } = useAppearance();
  const p = ACCENT_PALETTES[prefs.accent];

  return <View className="flex flex-col h-full min-h-0 overflow-hidden text-white" style={{  }}>
    <View className="flex items-center gap-3 px-5 pt-safe-or-4 pb-4 border-b shrink-0" style={{ borderColor:"rgba(255,255,255,.06)", backgroundColor: "rgba(2,6,23,.72)" }}>
      <Pressable onPress={onBack} accessibilityLabel="Retour" className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,.06)" }}><ArrowLeft size={19}/></Pressable>
      <View className="flex-1"><Text className="text-lg font-black flex items-center gap-2"><Scale size={17} style={{color:p.hex}}/> Licences & open source</Text><Text className="text-xs text-white/35">Les briques qui font fonctionner Débrouille Pro</Text></View>
      <Code2 size={18} style={{color:p.hex}}/>
    </View>
    <View className="flex-1 min-h-0 overflow-y-auto px-5 py-5"><View className="max-w-3xl mx-auto space-y-5 pb-8">
      <View className="rounded-[28px] p-5 sm:p-6" style={{ borderStyle: "solid" }}>
        <View className="flex items-start gap-4"><View className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{  }}><Package size={22}/></View><View><Text className="text-[9px] font-black uppercase tracking-[.2em]" style={{color:p.hex}}>Transparence technique</Text><Text className="text-2xl font-black mt-1">Open source, ensemble.</Text><Text className="text-sm text-white/45 leading-relaxed mt-2">Débrouille Pro s'appuie sur des projets open source. Voici les principales bibliothèques utilisées.</Text></View></View>
      </View>
      <View className="space-y-2.5">{LICENSES.map((item,i)=><View key={item.name} className="rounded-[22px] p-4" style={{ backgroundColor: "rgba(255,255,255,.035)", borderWidth: 1, borderColor: "rgba(255,255,255,.07)", borderStyle: "solid" }}><View className="flex items-start gap-3"><View className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${p.hex}12` }}><FileCode2 size={17} style={{color:p.hex}}/></View><View className="flex-1 min-w-0"><View className="flex flex-wrap items-center gap-2"><Text className="text-sm font-black text-white/85">{item.name}</Text><Text className="px-2 py-0.5 rounded-full text-[9px] font-black" style={{ color:p.hex, backgroundColor: `${p.hex}14`, borderStyle: "solid" }}>{item.license}</Text></View><Text className="text-[10px] text-white/25 mt-0.5">{item.category}</Text><Text className="text-xs text-white/40 leading-relaxed mt-2">{item.text}</Text></View><Pressable accessibilityLabel={`Voir ${item.name}`} className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(255,255,255,.04)" }} data-href={item.url}><ExternalLink size={14} className="text-white/35"/></Pressable></View></View>)}</View>
      <View className="rounded-2xl p-4 flex gap-3" style={{ backgroundColor: `${p.hex}0c`, borderStyle: "solid" }}><ShieldCheck size={17} style={{color:p.hex}} className="shrink-0"/><Text className="text-xs text-white/35 leading-relaxed"><Text>Les composants restent soumis à leurs propres licences. Consulte les dépôts officiels pour les textes complets.</Text></Text></View>
      <Text className="text-center text-[10px] text-white/20"><Text>© 2025 Débrouille Pro SAS · Kolwezi, RDC</Text></Text>
    </View></View>
  </View>;
}
