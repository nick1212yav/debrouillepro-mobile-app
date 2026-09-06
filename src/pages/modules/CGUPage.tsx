import { View, Text, Pressable } from "react-native";
import { ArrowLeft, FileText, ChevronDown, ShieldCheck, Scale, Info, Mail } from "lucide-react-native";
import { useAppearance, ACCENT_PALETTES } from "@/hooks/use-appearance";
import { useState } from "react";

interface CGUPageProps { onBack: () => void; }

const SECTIONS = [
  ["1. Acceptation des conditions", `En accédant à Débrouille Pro, tu acceptes les présentes Conditions Générales d'Utilisation. Si tu ne les acceptes pas, tu ne peux pas utiliser le service.

Ces CGU s'appliquent à tous les utilisateurs, visiteurs et toute personne qui accède ou utilise Débrouille Pro.`],
  ["2. Description du service", `Débrouille Pro est une plateforme numérique multi-services permettant notamment de publier et consulter des annonces, découvrir des opportunités, accéder à des services locaux et interagir avec une communauté.

Le service peut évoluer afin d'améliorer ses fonctionnalités, sa sécurité et son expérience utilisateur.`],
  ["3. Compte utilisateur", `Pour certaines fonctionnalités, la création d'un compte est nécessaire. Tu es responsable de la confidentialité de tes identifiants et des activités effectuées depuis ton compte.

Tu t'engages à fournir des informations exactes, complètes et à jour. Un usage abusif ou une violation des présentes conditions peut entraîner une restriction, suspension ou suppression du compte.`],
  ["4. Contenu des utilisateurs", `Tu demeures responsable des contenus que tu publies et dois disposer des droits nécessaires pour les utiliser.

Tu t'engages à ne pas publier de contenu illégal, trompeur, diffamatoire, frauduleux, haineux ou portant atteinte aux droits de tiers. Les contenus contraires aux règles peuvent être retirés.`],
  ["5. Transactions et paiements", `Les transactions réalisées via les fonctionnalités de paiement sont soumises aux conditions spécifiques du service concerné.

Débrouille Pro fournit l'infrastructure numérique permettant certaines interactions. Les utilisateurs restent responsables de leurs engagements entre eux.`],
  ["6. Propriété intellectuelle", `L'application, son identité visuelle, son interface, ses fonctionnalités, ses textes originaux et sa technologie sont protégés par les règles applicables de propriété intellectuelle.

Sauf autorisation, il est interdit de reproduire, distribuer, modifier ou exploiter les éléments protégés de Débrouille Pro.`],
  ["7. Sécurité et usages interdits", `Il est interdit de contourner les mécanismes de sécurité, d'accéder sans autorisation aux données ou systèmes, de perturber le service ou de l'utiliser à des fins frauduleuses.

Tout comportement mettant en danger les utilisateurs ou la plateforme peut faire l'objet de mesures de sécurité et de modération.`],
  ["8. Disponibilité du service", `Nous cherchons à maintenir un service fiable et accessible. Certaines interruptions peuvent toutefois résulter de maintenance, de mises à jour, de contraintes techniques ou d'événements indépendants de notre volonté.`],
  ["9. Modification des CGU", `Ces conditions peuvent être mises à jour lorsque le service évolue ou lorsque des changements juridiques ou de sécurité le nécessitent.

Les modifications importantes seront présentées de manière appropriée.`],
  ["10. Contact", `Pour toute question concernant ces conditions :

Email : legal@debrouille.pro
Débrouille Pro SAS · Kolwezi, Lualaba, RDC`],
];

function Item({ title, content, active, onClick }: { title: string; content: string; active: boolean; onClick: () => void }) {
  return <View className="border-b last:border-0" style={{ borderColor: "rgba(255,255,255,.055)" }}>
    <Pressable onPress={onClick} className="w-full flex items-center gap-3 px-4 py-4 text-left">
      <Text className="flex-1 text-sm font-bold text-white/80">{title}</Text>
      <View><ChevronDown size={16} className="text-white/30" /></View>
    </Pressable>
    <>{active && <View className="overflow-hidden"><Text className="px-4 pb-5 text-sm text-white/45 leading-relaxed">{content}</Text></View>}</>
  </View>;
}

export default function CGUPage({ onBack }: CGUPageProps) {
  const { prefs } = useAppearance();
  const p = ACCENT_PALETTES[prefs.accent];
  const [open, setOpen] = useState<number | null>(0);

  return <View className="flex flex-col h-full min-h-0 overflow-hidden text-white" style={{  }}>
    <View className="flex items-center gap-3 px-5 pt-safe-or-4 pb-4 border-b shrink-0" style={{ borderColor: "rgba(255,255,255,.06)", backgroundColor: "rgba(2,6,23,.72)" }}>
      <Pressable onPress={onBack} accessibilityLabel="Retour" className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,.06)" }}><ArrowLeft size={19}/></Pressable>
      <View className="flex-1"><Text className="text-lg font-black flex items-center gap-2"><FileText size={17} style={{color:p.hex}}/> Conditions générales</Text><Text className="text-xs text-white/35">CGU · cadre d'utilisation</Text></View>
      <ShieldCheck size={18} style={{color:p.hex}}/>
    </View>
    <View className="flex-1 min-h-0 overflow-y-auto px-5 py-5">
      <View className="max-w-3xl mx-auto space-y-5 pb-8">
        <View className="rounded-[28px] p-5 sm:p-6" style={{ borderStyle: "solid" }}>
          <View className="flex items-start gap-4"><View className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{  }}><Scale size={22}/></View><View><Text className="text-[9px] font-black uppercase tracking-[.2em]" style={{color:p.hex}}>Cadre d'utilisation</Text><Text className="text-2xl font-black mt-1">Utiliser Débrouille Pro en toute confiance.</Text><Text className="text-sm text-white/45 leading-relaxed mt-2">Les règles essentielles qui encadrent l'utilisation de la plateforme.</Text></View></View>
        </View>
        <View className="rounded-[28px] overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,.035)", borderWidth: 1, borderColor: "rgba(255,255,255,.07)", borderStyle: "solid" }}>{SECTIONS.map(([title,content],i)=><Item key={title} title={title} content={content} active={open===i} onPress={()=>setOpen(open===i?null:i)}/>)}</View>
        <View className="rounded-2xl p-4 flex gap-3" style={{ backgroundColor: `${p.hex}0c`, borderStyle: "solid" }}><Info size={17} style={{color:p.hex}} className="shrink-0 mt-0.5"/><Text className="text-xs text-white/35 leading-relaxed">Pour toute question concernant ces conditions, contacte l'équipe Débrouille Pro.</Text></View>
        <View className="text-center text-[10px] text-white/20 flex items-center justify-center gap-2"><Mail size={12}/> <Text>legal@debrouille.pro</Text></View>
      </View>
    </View>
  </View>;
}
