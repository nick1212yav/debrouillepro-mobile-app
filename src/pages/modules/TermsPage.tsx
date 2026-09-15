import { View, Pressable, Text, TextInput } from "react-native";
import {
  ArrowLeft,
  FileText,
  ChevronDown,
  ShieldCheck,
  Scale,
  LockKeyhole,
  CreditCard,
  Copyright,
  AlertTriangle,
  RefreshCw,
  Gavel,
  Mail,
  CheckCircle2,
  Search,
} from "lucide-react-native";
import { useAppearance, ACCENT_PALETTES } from "@/hooks/use-appearance.ts";
import { useMemo, useState } from "react";

interface TermsPageProps {
  onBack: () => void;
}

const SECTIONS = [
  {
    title: "1. Acceptation des conditions",
    icon: CheckCircle2,
    summary: "Les règles qui encadrent l'utilisation de Débrouille Pro.",
    content: `En accédant à Débrouille Pro, tu acceptes d'être lié par les présentes Conditions Générales d'Utilisation. Si tu n'acceptes pas ces conditions, tu ne peux pas utiliser l'application.

Ces CGU s'appliquent à tous les utilisateurs, visiteurs et toute autre personne qui accède ou utilise le service.`,
  },
  {
    title: "2. Description du service",
    icon: FileText,
    summary: "Une plateforme numérique multi-services.",
    content: `Débrouille Pro est une plateforme numérique multi-services qui permet aux utilisateurs de : publier et consulter des annonces (immobilier, emploi, services), accéder à des informations locales, effectuer des transactions numériques via Débrouille Pay, et interagir avec une communauté d'utilisateurs.

Le service est fourni "tel quel" et peut évoluer sans préavis.`,
  },
  {
    title: "3. Compte utilisateur",
    icon: LockKeyhole,
    summary: "Responsabilités liées à ton compte.",
    content: `Pour accéder à la plupart des fonctionnalités, tu dois créer un compte. Tu es responsable de la confidentialité de tes identifiants et de toutes les activités effectuées depuis ton compte.

Tu t'engages à fournir des informations exactes, complètes et à jour lors de ton inscription. Débrouille Pro se réserve le droit de suspendre ou supprimer tout compte en cas de violation de ces CGU.`,
  },
  {
    title: "4. Contenu des utilisateurs",
    icon: ShieldCheck,
    summary: "Publier, partager et respecter les droits des autres.",
    content: `En publiant du contenu sur Débrouille Pro, tu accordes à la plateforme une licence mondiale, non exclusive, gratuite et sous-licenciable pour utiliser, reproduire, modifier, adapter, publier et afficher ce contenu dans le cadre du service.

Tu t'engages à ne pas publier de contenu illégal, diffamatoire, trompeur, indécent, ou portant atteinte aux droits de tiers. Tout contenu violant ces règles peut être supprimé sans préavis.`,
  },
  {
    title: "5. Transactions et paiements",
    icon: CreditCard,
    summary: "Règles applicables aux transactions numériques.",
    content: `Les transactions effectuées via Débrouille Pay sont soumises aux conditions spécifiques du module portefeuille. Débrouille Pro agit comme intermédiaire technique et n'est pas responsable des litiges entre acheteurs et vendeurs.

Toutes les transactions sont enregistrées et peuvent être consultées dans ton historique de portefeuille.`,
  },
  {
    title: "6. Propriété intellectuelle",
    icon: Copyright,
    summary: "Protection de la plateforme et de ses contenus.",
    content: `L'application, son interface, son contenu original, ses fonctionnalités et sa technologie sont et demeurent la propriété exclusive de Débrouille Pro SAS et sont protégés par les lois congolaises et internationales sur la propriété intellectuelle.

Tu ne peux pas reproduire, distribuer, modifier ou créer des œuvres dérivées sans notre accord écrit préalable.`,
  },
  {
    title: "7. Limitation de responsabilité",
    icon: AlertTriangle,
    summary: "Les limites de responsabilité prévues par les CGU.",
    content: `Dans la mesure permise par la loi applicable, Débrouille Pro ne sera pas responsable des dommages indirects, accessoires, spéciaux ou consécutifs résultant de l'utilisation ou de l'impossibilité d'utiliser le service.

La responsabilité totale de Débrouille Pro ne pourra en aucun cas dépasser le montant que tu as payé pour le service au cours des 12 derniers mois.`,
  },
  {
    title: "8. Modification des CGU",
    icon: RefreshCw,
    summary: "Comment les conditions peuvent évoluer.",
    content: `Débrouille Pro se réserve le droit de modifier ces CGU à tout moment. Les modifications entrent en vigueur dès leur publication dans l'application. L'utilisation continue du service après notification des modifications vaut acceptation des nouvelles conditions.

Nous t'informerons des changements importants par notification push ou email.`,
  },
  {
    title: "9. Droit applicable et juridiction",
    icon: Gavel,
    summary: "Le cadre juridique applicable.",
    content: `Ces CGU sont régies par le droit de la République Démocratique du Congo. Tout litige sera soumis à la juridiction compétente du ressort de Kinshasa, RDC.

Pour les utilisateurs résidant dans d'autres pays, les lois locales impératives restent applicables dans la mesure où elles s'appliquent.`,
  },
  {
    title: "10. Contact",
    icon: Mail,
    summary: "Une question sur les conditions ?",
    content: `Pour toute question concernant ces CGU, contacte notre équipe juridique à :

Email : legal@debrouille.pro
Adresse : Débrouille Pro SAS, Avenue de la Justice, Kolwezi, Lualaba, RDC`,
  },
] as const;

type Section = (typeof SECTIONS)[number];

function AccordionItem({
  section,
  index,
  open,
  onToggle,
  accent,
}: {
  section: Section;
  index: number;
  open: boolean;
  onToggle: () => void;
  accent: string;
}) {
  const Icon = section.icon;

  return (
    <View layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.035 }} className="border-b last:border-0" style={{ borderColor: "rgba(255,255,255,0.055)" }}>
      <Pressable onPress={onToggle} accessibilityState={{ expanded: open }} className="w-full flex items-center gap-3 px-4 py-4 text-left active:scale-[0.995] transition-transform"><View className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: open ? `${accent}20` : "rgba(255,255,255,0.045)", borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}><Icon size={17} style={{  }} accessibilityElementsHidden={true} importantForAccessibility="no-hide-descendants" /></View><View className="flex-1 min-w-0"><Text className="text-sm font-bold transition-colors" style={{ color: open ? "#fff" : "rgba(255,255,255,0.82)" }}>{section.title}</Text><Text className="text-[10px] text-white/30 mt-0.5 truncate">{section.summary}</Text></View><View animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.22 }} className="shrink-0"><ChevronDown size={17} className="text-white/30" /></View></Pressable>

<View>
        {open && (
          <View initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="overflow-hidden">
            <View className="px-4 pb-5 pl-[68px]"><View className="rounded-2xl p-4" style={{ backgroundColor: `${accent}08`, borderStyle: "solid" }}><Text className="text-sm text-white/55 leading-7">{section.content}</Text></View></View>
          </View>
        )}
      </View>
    </View>
  );
}

export default function TermsPage({ onBack }: TermsPageProps) {
  const { prefs } = useAppearance();
  const palette = ACCENT_PALETTES[prefs.accent];
  const hex = palette.hex;

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  const filteredSections = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) return SECTIONS;

    return SECTIONS.filter((section) =>
      `${section.title} ${section.summary} ${section.content}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [query]);

  const expandAll = () => {
    if (filteredSections.length === 1) {
      setOpenIndex(0);
      return;
    }

    setOpenIndex(openIndex === -1 ? null : -1);
  };

  return (
    <View className="flex flex-col h-full min-h-0 overflow-hidden" style={{  }}>{}<View initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 px-5 pt-12 pb-4 shrink-0 border-b" style={{ borderColor: "rgba(255,255,255,0.065)", backgroundColor: "rgba(2,6,23,0.72)" }}><Pressable onPress={onBack} accessibilityLabel="Retour" className="w-10 h-10 rounded-2xl flex items-center justify-center active:scale-90 transition-transform" style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}><ArrowLeft size={18} className="text-white" accessibilityElementsHidden={true} importantForAccessibility="no-hide-descendants" /></Pressable><View className="flex-1 min-w-0"><Text className="text-lg font-black text-white flex items-center gap-2 truncate"><FileText size={17} style={{  }} accessibilityElementsHidden={true} importantForAccessibility="no-hide-descendants" />Conditions Générales
          </Text><Text className="text-xs text-white/35 mt-0.5">Utilisation de Débrouille Pro · Mise à jour : 1er juin 2025
          </Text></View><View className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0" style={{ backgroundColor: `${hex}12`, borderStyle: "solid" }}><ShieldCheck size={12} style={{  }} /><Text className="text-[10px] font-bold" style={{ color: hex }}>Document officiel
          </Text></View></View>{}<View className="flex-1 min-h-0 overflow-y-auto px-5 py-5" style={{  }}>{}<View initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[28px] p-6 mb-5" style={{ borderStyle: "solid" }}><View className="absolute -top-20 -right-12 w-56 h-56 rounded-full pointer-events-none" style={{  }} /><View className="relative z-10"><View className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ boxShadow: `0 12px 35px ${palette.glow}` }}><Scale size={25} className="text-white" accessibilityElementsHidden={true} importantForAccessibility="no-hide-descendants" /></View><View className="flex items-center gap-2 mb-2"><Text className="text-[9px] uppercase tracking-[0.18em] font-black" style={{ color: hex }}>Cadre d'utilisation
              </Text><Text className="w-1 h-1 rounded-full bg-white/20" /><Text className="text-[9px] text-white/30">Version en vigueur
              </Text></View><Text className="text-2xl sm:text-3xl font-black text-white leading-tight">Des règles claires pour une
              <Text style={{ color: hex }}>expérience de confiance.</Text></Text><Text className="text-sm text-white/45 leading-relaxed mt-3 max-w-2xl">Ces Conditions Générales d'Utilisation définissent les règles
              applicables à l'accès et à l'utilisation de Débrouille Pro. Prends
              quelques minutes pour les parcourir.
            </Text><View className="flex flex-wrap gap-2 mt-5"><View className="inline-flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.055)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}><ShieldCheck size={13} style={{  }} /><Text className="text-[10px] text-white/55">10 sections</Text></View><View className="inline-flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.055)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}><Gavel size={13} style={{  }} /><Text className="text-[10px] text-white/55">Droit congolais
                </Text></View></View></View></View>{}<View initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="gap-2 mb-5">{[
            { icon: ShieldCheck, label: "Utilisation responsable" },
            { icon: LockKeyhole, label: "Compte utilisateur" },
            { icon: Scale, label: "Cadre juridique" },
          ].map(({ icon: Icon, label }) => (
            <View key={label} className="flex items-center gap-2.5 rounded-2xl px-3.5 py-3" style={{ backgroundColor: "rgba(255,255,255,0.035)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}><Icon size={15} style={{  }} /><Text className="text-[10px] font-semibold text-white/45">{label}</Text></View>
          ))}</View>{}<View className="flex gap-2 mb-3"><View className="flex items-center gap-2 flex-1 min-w-0 rounded-2xl px-3.5" style={{ backgroundColor: "rgba(255,255,255,0.045)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}><Search size={15} className="text-white/25 shrink-0" /><TextInput value={query} onChangeText={(value) => setQuery(value)} placeholder="Rechercher dans les CGU…" accessibilityLabel="Rechercher dans les conditions générales" className="w-full bg-transparent py-3 text-xs text-white outline-none placeholder:text-white/20" /></View><Pressable onPress={expandAll} className="px-3.5 rounded-2xl text-[10px] font-bold text-white/55 active:scale-95 transition-transform" style={{ backgroundColor: `${hex}12`, borderStyle: "solid" }}>{openIndex === -1 ? "Réduire" : "Tout ouvrir"}</Pressable></View>{}<View layout className="rounded-[28px] overflow-hidden mb-5" style={{ backgroundColor: "rgba(255,255,255,0.035)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>{filteredSections.length > 0 ? (
            filteredSections.map((section, index) => (
              <AccordionItem
                key={section.title}
                section={section}
                index={index}
                open={
                  openIndex === -1 ||
                  (openIndex !== null &&
                    filteredSections[openIndex]?.title === section.title)
                }
                onToggle={() => {
                  const current = filteredSections.findIndex(
                    (item) => item.title === section.title,
                  );
                  setOpenIndex(openIndex === current ? null : current);
                }}
                accent={hex}
              />
            ))
          ) : (
            <View className="px-6 py-12 text-center"><View className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: `${hex}12`, borderStyle: "solid" }}><Search size={18} style={{  }} /></View><Text className="text-sm font-bold text-white/65">Aucun passage trouvé
              </Text><Text className="text-xs text-white/30 mt-1">Essaie un autre mot-clé.
              </Text></View>
          )}</View>{}<View initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[28px] p-5 mb-5 relative overflow-hidden" style={{ borderStyle: "solid" }}><View className="relative z-10"><View className="flex items-start gap-3"><View className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${hex}18`, borderStyle: "solid" }}><Mail size={17} style={{  }} /></View><View className="min-w-0"><Text className="text-sm font-black text-white">Une question sur les CGU ?
                </Text><Text className="text-xs text-white/35 mt-1 leading-relaxed">Notre équipe juridique peut répondre à tes questions.
                </Text><Pressable className="inline-flex items-center gap-2 mt-3 text-xs font-bold" style={{  }} data-href="mailto:legal@debrouille.pro"><Text>legal@debrouille.pro</Text><Mail size={12} /></Pressable></View></View></View></View>{}<View className="text-center pb-5"><View className="flex items-center justify-center gap-2 mb-2"><View className="w-6 h-6 rounded-lg flex items-center justify-center" style={{  }}><FileText size={11} className="text-white" /></View><Text className="text-xs font-black text-white/50">Débrouille Pro
            </Text></View><Text className="text-[10px] text-white/20">© 2025 Débrouille Pro SAS · Kolwezi, RDC · legal@debrouille.pro
          </Text></View></View></View>
  );
}
