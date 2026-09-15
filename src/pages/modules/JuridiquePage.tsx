import { Picker } from "@react-native-picker/picker";
import { View, Pressable, Text, TextInput } from "react-native";
import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import { ConvexError } from "convex/values";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import {
  ArrowLeft, Search, FileText, Scale, Calculator, MessageSquare,
  ChevronRight, Download, Copy, CheckCircle, X, Send,
  Shield, BookOpen, Briefcase, Home, Users, Clock,
  AlertTriangle, Info, ChevronDown, ChevronUp, Lock,
  Bot, User as UserIcon
} from "lucide-react-native";
import { Clipboard } from "@react-native-clipboard/clipboard";

/* __DEBROUILLEPRO_NATIVE_DOM_API_HELPERS_V8__ — scrollIntoView helper */
const __debrouilleProNativeScrollIntoView = async (ref: { current?: { measure?: (cb: (x: number, y: number, w: number, h: number, px: number, py: number) => void) => void } }): Promise<void> => {
  return new Promise((resolve) => {
    ref.current?.measure?.((_x, _y, _w, _h, _px, py) => {
      console.warn('__debrouilleProNativeScrollIntoView: implement scrollTo with pageY on your ScrollView ref');
      resolve();
    });
  });
};


// ── Types ──────────────────────────────────────────────────────────────────
type TabId = "contrats" | "demarches" | "calculateurs" | "assistant";

interface ContractTemplate {
  id: string;
  title: string;
  category: string;
  icon: React.ElementType;
  color: string;
  description: string;
  tags: string[];
  popular: boolean;
  pages: number;
  fields: ContractField[];
}

interface ContractField {
  id: string;
  label: string;
  placeholder: string;
  type: "text" | "date" | "number" | "select";
  options?: string[];
  required: boolean;
}

interface Demarche {
  id: string;
  title: string;
  category: string;
  icon: React.ElementType;
  color: string;
  description: string;
  duration: string;
  difficulty: "Facile" | "Moyen" | "Complexe";
  steps: DemarcheStep[];
  documents: string[];
}

interface DemarcheStep {
  title: string;
  description: string;
  done?: boolean;
}

// ── Contract templates ─────────────────────────────────────────────────────
const CONTRACTS: ContractTemplate[] = [
  {
    id: "bail", title: "Contrat de bail", category: "Immobilier",
    icon: Home, color: "#F97316", description: "Contrat de location d'un logement entre propriétaire et locataire. Conforme à la législation congolaise.",
    tags: ["Location", "Immobilier", "Logement"], popular: true, pages: 4,
    fields: [
      { id: "bailleur", label: "Nom du bailleur", placeholder: "Jean Mulamba", type: "text", required: true },
      { id: "locataire", label: "Nom du locataire", placeholder: "Marie Kabila", type: "text", required: true },
      { id: "adresse", label: "Adresse du bien", placeholder: "Av. des Huileries, Kinshasa", type: "text", required: true },
      { id: "loyer", label: "Loyer mensuel ($)", placeholder: "350", type: "number", required: true },
      { id: "caution", label: "Caution ($)", placeholder: "700", type: "number", required: false },
      { id: "debut", label: "Date de début", placeholder: "", type: "date", required: true },
      { id: "duree", label: "Durée", placeholder: "", type: "select", options: ["6 mois", "1 an", "2 ans", "3 ans", "Indéterminée"], required: true },
    ],
  },
  {
    id: "prestation", title: "Contrat de prestation", category: "Freelance",
    icon: Briefcase, color: "#8B5CF6", description: "Contrat de mission freelance entre un prestataire de services et son client.",
    tags: ["Freelance", "Service", "Mission"], popular: true, pages: 3,
    fields: [
      { id: "prestataire", label: "Prestataire", placeholder: "Paul Mwamba", type: "text", required: true },
      { id: "client", label: "Client", placeholder: "Entreprise Congo SARL", type: "text", required: true },
      { id: "mission", label: "Description de la mission", placeholder: "Développement d'un site web...", type: "text", required: true },
      { id: "montant", label: "Montant ($)", placeholder: "800", type: "number", required: true },
      { id: "delai", label: "Délai de livraison", placeholder: "", type: "date", required: true },
      { id: "paiement", label: "Mode de paiement", placeholder: "", type: "select", options: ["À la livraison", "50% avance 50% fin", "Mensuel", "Par étapes"], required: true },
    ],
  },
  {
    id: "cdi", title: "Contrat de travail CDI", category: "Emploi",
    icon: Users, color: "#10B981", description: "Contrat à durée indéterminée conforme au Code du travail de la RDC.",
    tags: ["CDI", "Emploi", "Travail"], popular: true, pages: 5,
    fields: [
      { id: "employeur", label: "Employeur", placeholder: "TechAfrique SARL", type: "text", required: true },
      { id: "employe", label: "Employé(e)", placeholder: "Alice Ngoy", type: "text", required: true },
      { id: "poste", label: "Poste", placeholder: "Développeur Senior", type: "text", required: true },
      { id: "salaire", label: "Salaire brut ($)", placeholder: "1200", type: "number", required: true },
      { id: "debut", label: "Date de début", placeholder: "", type: "date", required: true },
      { id: "essai", label: "Période d'essai", placeholder: "", type: "select", options: ["Aucune", "1 mois", "2 mois", "3 mois", "6 mois"], required: false },
    ],
  },
  {
    id: "cession", title: "Acte de cession", category: "Commerce",
    icon: Scale, color: "#6366F1", description: "Transfert de propriété d'un bien ou d'un fonds de commerce entre deux parties.",
    tags: ["Cession", "Vente", "Propriété"], popular: false, pages: 3,
    fields: [
      { id: "vendeur", label: "Vendeur", placeholder: "Nom du vendeur", type: "text", required: true },
      { id: "acheteur", label: "Acheteur", placeholder: "Nom de l'acheteur", type: "text", required: true },
      { id: "bien", label: "Bien cédé", placeholder: "Description du bien...", type: "text", required: true },
      { id: "prix", label: "Prix de cession ($)", placeholder: "5000", type: "number", required: true },
      { id: "date", label: "Date de cession", placeholder: "", type: "date", required: true },
    ],
  },
  {
    id: "pret", title: "Reconnaissance de dette", category: "Finance",
    icon: FileText, color: "#EC4899", description: "Document attestant d'un prêt d'argent entre deux personnes physiques.",
    tags: ["Prêt", "Dette", "Finance"], popular: false, pages: 2,
    fields: [
      { id: "preteur", label: "Prêteur", placeholder: "Nom du prêteur", type: "text", required: true },
      { id: "emprunteur", label: "Emprunteur", placeholder: "Nom de l'emprunteur", type: "text", required: true },
      { id: "montant", label: "Montant prêté ($)", placeholder: "500", type: "number", required: true },
      { id: "remboursement", label: "Date de remboursement", placeholder: "", type: "date", required: true },
      { id: "interet", label: "Taux d'intérêt (%)", placeholder: "0", type: "number", required: false },
    ],
  },
  {
    id: "nda", title: "Accord de confidentialité (NDA)", category: "Business",
    icon: Lock, color: "#0EA5E9", description: "Accord de non-divulgation pour protéger les informations confidentielles.",
    tags: ["NDA", "Confidentialité", "Business"], popular: false, pages: 2,
    fields: [
      { id: "divulgant", label: "Partie divulgante", placeholder: "Entreprise A", type: "text", required: true },
      { id: "recevant", label: "Partie recevante", placeholder: "Entreprise B", type: "text", required: true },
      { id: "objet", label: "Objet de la confidentialité", placeholder: "Données clients, plans stratégiques...", type: "text", required: true },
      { id: "duree", label: "Durée", placeholder: "", type: "select", options: ["1 an", "2 ans", "3 ans", "5 ans", "Indéfinie"], required: true },
    ],
  },
];

// ── Démarches ──────────────────────────────────────────────────────────────
const DEMARCHES: Demarche[] = [
  {
    id: "registre", title: "Création d'entreprise (RCCM)", category: "Entreprise",
    icon: Briefcase, color: "#8B5CF6", description: "Enregistrement au Registre du Commerce et du Crédit Mobilier pour créer une SARL ou SA.",
    duration: "2–4 semaines", difficulty: "Moyen",
    steps: [
      { title: "Choisir la forme juridique", description: "SARL (1 associé min.), SA (3 associés min.), SURL (personne seule). La SARL est la plus courante." },
      { title: "Rédiger les statuts", description: "Document fondateur précisant : dénomination sociale, objet, capital, associés, gérant. Notaire recommandé." },
      { title: "Déposer le capital", description: "Ouvrir un compte bancaire bloqué et déposer le capital minimum : 200 USD pour une SARL." },
      { title: "S'immatriculer au RCCM", description: "Déposer le dossier au greffe du Tribunal de Commerce de votre ville. Frais : ~50–100 USD." },
      { title: "Obtenir le NIF", description: "Demander le Numéro d'Identification Fiscale à la Direction Générale des Impôts (DGI)." },
      { title: "Inscription INSS", description: "S'inscrire à l'Institut National de Sécurité Sociale pour les cotisations employeur." },
    ],
    documents: ["Pièce d'identité nationale", "Statuts de société", "Preuve de capital", "Photo d'identité", "Certificat de résidence"],
  },
  {
    id: "passeport", title: "Renouvellement de passeport", category: "Documents",
    icon: FileText, color: "#3B82F6", description: "Procédure de renouvellement du passeport congolais à la Direction Générale de Migration.",
    duration: "3–8 semaines", difficulty: "Facile",
    steps: [
      { title: "Rassembler les documents", description: "Ancien passeport, acte de naissance, carte nationale d'identité, 2 photos récentes (fond blanc)." },
      { title: "Se rendre à la DGM", description: "Direction Générale de Migration. Arriver tôt (file d'attente). Horaires : Lun–Ven 7h30–15h30." },
      { title: "Remplir le formulaire", description: "Formulaire de demande disponible sur place. À remplir en majuscules, sans ratures." },
      { title: "Payer les frais", description: "Frais officiels : 100 USD (ordinaire) ou 200 USD (urgent). Paiement en caisse uniquement." },
      { title: "Récupérer le récépissé", description: "Conserver précieusement le récépissé. Il sert de preuve en attendant le passeport." },
      { title: "Retirer le passeport", description: "Retour à la DGM avec le récépissé à la date indiquée. Délai : 3–8 semaines selon l'affluence." },
    ],
    documents: ["Ancien passeport", "Acte de naissance", "Carte nationale d'identité (CNI)", "2 photos d'identité fond blanc", "Justificatif de paiement"],
  },
  {
    id: "permis", title: "Permis de construire", category: "Immobilier",
    icon: Home, color: "#F97316", description: "Autorisation obligatoire avant tout début de construction ou de rénovation importante.",
    duration: "4–12 semaines", difficulty: "Complexe",
    steps: [
      { title: "Faire établir les plans", description: "Faire appel à un architecte ou bureau d'études agréé pour établir les plans du bâtiment." },
      { title: "Constituer le dossier", description: "Plans architecturaux, titre foncier ou bail, rapport géotechnique (si bâtiment > 2 étages)." },
      { title: "Dépôt à la Commune", description: "Déposer le dossier complet à la mairie ou commune de votre circonscription." },
      { title: "Instruction du dossier", description: "La commune transmet à l'Urbanisme pour examen technique. Délai théorique : 30 jours ouvrables." },
      { title: "Retrait du permis", description: "En cas d'accord, retirer le permis signé et l'afficher sur le chantier avant tout commencement." },
    ],
    documents: ["Plans architecturaux (3 exemplaires)", "Titre foncier ou attestation de bail", "CNI du demandeur", "Rapport géotechnique", "Acte de propriété ou autorisation du propriétaire"],
  },
  {
    id: "cnss", title: "Inscription CNSS / INSS", category: "Social",
    icon: Shield, color: "#10B981", description: "Inscription à la Caisse Nationale de Sécurité Sociale pour les travailleurs salariés.",
    duration: "1–2 semaines", difficulty: "Facile",
    steps: [
      { title: "Préparer les documents employeur", description: "RCCM, NIF, liste des employés avec salaires." },
      { title: "Se rendre à l'INSS", description: "Direction provinciale de l'INSS. Prendre rendez-vous par téléphone si possible." },
      { title: "Remplir le formulaire d'inscription", description: "Formulaire OE1 pour l'employeur, OT1 pour chaque travailleur." },
      { title: "Obtenir le numéro matricule", description: "Chaque employé reçoit un numéro matricule INSS unique pour le suivi des cotisations." },
    ],
    documents: ["RCCM de l'entreprise", "NIF de l'entreprise", "CNI du gérant", "Liste nominative des employés", "Contrats de travail"],
  },
];

// ── ContractDetail ─────────────────────────────────────────────────────────
function ContractDetail({ template, onClose }: { template: ContractTemplate; onClose: () => void }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const complete = template.fields.filter((f) => f.required).every((f) => values[f.id]?.trim());

  const generateContract = () => setGenerated(true);

  const previewText = `CONTRAT – ${template.title.toUpperCase()}

Entre les soussignés :
${template.fields.map((f) => `${f.label} : ${values[f.id] ?? "___________"}`).join("\n")}

Fait à Kinshasa, le ${new Date().toLocaleDateString("fr-FR")}

Signatures :
_________________          _________________
       Partie 1                    Partie 2

[Document généré par Débrouille Pro – À faire valider par un notaire ou avocat]`;

  const handleCopy = () => {
    Clipboard.setString(previewText).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 280 }} className="absolute inset-0 z-50 flex flex-col overflow-y-auto" style={{  }}>
      {/* Header */}
      <View className="flex-shrink-0 px-4 pt-12 pb-4"><View className="flex items-center gap-3 mb-5"><Pressable onPress={onClose} className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}><ArrowLeft size={18} className="text-white" /></Pressable><View className="flex-1"><Text className="text-lg font-black text-white">{template.title}</Text><Text className="text-xs text-white/40">{template.pages}pages · {template.category}</Text></View><View className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${template.color}22`, borderStyle: "solid" }}><template.icon size={18} style={{  }} /></View></View><Text className="text-sm text-white/60 mb-3">{template.description}</Text><View className="flex flex-wrap gap-1.5">{template.tags.map((t) => (
            <Text key={t} className="px-2.5 py-1 rounded-full text-xs text-white/50" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>#{t}</Text>
          ))}</View></View>

      <View className="flex-1 px-4 pb-6 space-y-3">{}<View className="rounded-2xl p-3 flex items-start gap-2" style={{ backgroundColor: "rgba(245,158,11,0.1)", borderWidth: 1, borderColor: "rgba(245,158,11,0.2)", borderStyle: "solid" }}><AlertTriangle size={14} className="text-yellow-400 flex-shrink-0 mt-0.5" /><Text className="text-xs text-yellow-200/70">Ce modèle est fourni à titre indicatif. Faites valider tout contrat important par un notaire ou un avocat agréé.</Text></View>{}{!generated && template.fields.map((field) => (
          <View key={field.id} className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><Text className="text-xs text-white/40 mb-2">{field.label}{field.required && <Text className="text-red-400 ml-1">*</Text>}</Text>{field.type === "select" ? (
              <Picker onValueChange={(value) => setValues((v) => ({ ...v, [field.id]: value }))} className="w-full bg-transparent text-sm text-white outline-none" selectedValue={values[field.id] ?? ""}><Picker.Item label="Choisir..." value="" />{field.options?.map((o) => <Picker.Item label={o} value={o} />)}</Picker>
            ) : (
              <TextInput value={values[field.id] ?? ""} onChangeText={(value) => setValues((v) => ({ ...v, [field.id]: value }))} placeholder={field.placeholder} className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25" />
            )}</View>
        ))}{}{generated && (
          <View initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: "rgba(16,185,129,0.07)", borderWidth: 1, borderColor: "rgba(16,185,129,0.2)", borderStyle: "solid" }}>
            <View className="flex items-center justify-between"><Text className="text-sm font-bold text-green-400">Contrat généré !</Text><Pressable onPress={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs" style={{ backgroundColor: "rgba(16,185,129,0.15)" }}>{copied ? <><CheckCircle size={12} />Copié</> : <><Copy size={12} />Copier</>}</Pressable></View>
            <pre className="text-xs text-white/60 leading-relaxed font-mono">{previewText}</pre>
          </View>
        )}{}{!generated ? (
          <Pressable onPress={generateContract} disabled={!complete} className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-base font-black text-white disabled:opacity-40" style={{  }}><FileText size={18} /><Text>Générer le contrat</Text></Pressable>
        ) : (
          <View className="flex gap-2"><Pressable onPress={() => setGenerated(false)} className="flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold" style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}><X size={15} /><Text>Modifier</Text></Pressable><Pressable className="flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-white" style={{  }}><Download size={15} /><Text>Télécharger</Text></Pressable></View>
        )}</View>
    </View>
  );
}

// ── Demarche Detail ────────────────────────────────────────────────────────
function DemarcheDetail({ demarche, onClose }: { demarche: Demarche; onClose: () => void }) {
  const [completedSteps, setCompletedSteps] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem(`demarche_${demarche.id}`) ?? "[]") as number[]; } catch { return []; }
  });

  const toggleStep = (i: number) => {
    const updated = completedSteps.includes(i) ? completedSteps.filter((s) => s !== i) : [...completedSteps, i];
    setCompletedSteps(updated);
    localStorage.setItem(`demarche_${demarche.id}`, JSON.stringify(updated));
  };

  const progress = Math.round((completedSteps.length / demarche.steps.length) * 100);
  const diffColors: Record<string, string> = { Facile: "#10B981", Moyen: "#F59E0B", Complexe: "#EF4444" };

  return (
    <View initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 280 }} className="absolute inset-0 z-50 flex flex-col overflow-y-auto" style={{  }}>
      <View className="flex-shrink-0 px-4 pt-12 pb-4"><View className="flex items-center gap-3 mb-5"><Pressable onPress={onClose} className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}><ArrowLeft size={18} className="text-white" /></Pressable><View className="flex-1"><Text className="text-lg font-black text-white">{demarche.title}</Text><View className="flex items-center gap-2 mt-0.5"><Text className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${diffColors[demarche.difficulty]}22`, color: diffColors[demarche.difficulty] }}>{demarche.difficulty}</Text><Text className="text-xs text-white/40"><Clock size={10} className="inline mr-1" />{demarche.duration}</Text></View></View></View>{}<View className="mb-4"><View className="flex justify-between mb-1.5"><Text className="text-xs text-white/40">Progression</Text><Text className="text-xs font-bold" style={{ color: progress === 100 ? "#10B981" : "#8B5CF6" }}>{completedSteps.length}/{demarche.steps.length}étapes</Text></View><View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><View className="h-full rounded-full" animate={{ width: `${progress}%` }} style={{  }} /></View></View></View>

      <View className="flex-1 px-4 pb-6 space-y-3"><Text className="text-sm text-white/60">{demarche.description}</Text>{}<View><Text className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-3">Étapes à suivre</Text>{demarche.steps.map((step, i) => {
            const done = completedSteps.includes(i);
            return (
              <View key={i} layout onPress={() => toggleStep(i)} className="flex gap-3 mb-3 p-3 rounded-2xl transition-all" style={{ backgroundColor: done ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.04)", borderColor: "rgba(16,185,129,0.2)", borderStyle: "solid" }}>
                <View className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-all" style={{ backgroundColor: done ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.08)" }}>{done ? <CheckCircle size={14} className="text-green-400" /> : <Text className="text-xs font-black text-white/50">{i + 1}</Text>}</View>
                <View className="flex-1"><Text className="text-sm font-semibold text-white mb-0.5" style={{ textDecoration: done ? "line-through" : "none", opacity: done ? 0.6 : 1 }}>{step.title}</Text><Text className="text-xs text-white/50 leading-relaxed">{step.description}</Text></View>
              </View>
            );
          })}</View>{}<View className="rounded-2xl p-4" style={{ backgroundColor: "rgba(59,130,246,0.08)", borderWidth: 1, borderColor: "rgba(59,130,246,0.2)", borderStyle: "solid" }}><Text className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-3">Documents requis</Text><View className="space-y-2">{demarche.documents.map((doc, i) => (
              <View key={i} className="flex items-center gap-2"><FileText size={12} className="text-blue-400/70 flex-shrink-0" /><Text className="text-xs text-white/60">{doc}</Text></View>
            ))}</View></View>{progress === 100 && (
          <View initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-2xl p-4 text-center" style={{ borderWidth: 1, borderColor: "rgba(16,185,129,0.3)", borderStyle: "solid" }}>
            <Text className="text-sm font-black text-green-400">Démarche complétée !</Text>
            <Text className="text-xs text-white/50 mt-1">Toutes les étapes ont été réalisées.</Text>
          </View>
        )}</View>
    </View>
  );
}

// ── Calculateurs ──────────────────────────────────────────────────────────
function Calculateurs() {
  const [activeCalc, setActiveCalc] = useState<"conges" | "indemnite" | "charges" | null>(null);
  const [salaire, setSalaire] = useState(1000);
  const [anciennete, setAnciennete] = useState(3);
  const [joursConges, setJoursConges] = useState(18);

  const indemnite = salaire * anciennete;
  const chargesEmployeur = Math.round(salaire * 0.13);
  const chargesEmploye = Math.round(salaire * 0.05);
  const coutTotal = salaire + chargesEmployeur;
  const coutConges = Math.round((salaire / 26) * joursConges);

  const calcs = [
    {
      id: "conges" as const, title: "Congés payés", icon: Clock, color: "#3B82F6",
      description: "Calculez la valeur des congés non pris en cas de départ.",
    },
    {
      id: "indemnite" as const, title: "Indemnité de licenciement", icon: Briefcase, color: "#EF4444",
      description: "Calculez l'indemnité due en cas de licenciement sans faute.",
    },
    {
      id: "charges" as const, title: "Charges sociales INSS", icon: Shield, color: "#10B981",
      description: "Calculez les cotisations INSS employeur et employé.",
    },
  ];

  return (
    <View className="space-y-3">{calcs.map(({ id, title, icon: Icon, color, description }) => (
        <View key={id}><View onPress={() => setActiveCalc(activeCalc === id ? null : id)} className="rounded-2xl p-4" style={{ backgroundColor: activeCalc === id ? `${color}11` : "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><View className="flex items-center gap-3"><View className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}22` }}><Icon size={18} style={{ color }} /></View><View className="flex-1"><Text className="text-sm font-bold text-white">{title}</Text><Text className="text-xs text-white/50">{description}</Text></View>{activeCalc === id ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}</View></View><View>{activeCalc === id && (
              <View initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <View className="pt-2 space-y-3">{}<View className="rounded-2xl p-4 space-y-4" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}><View><View className="flex justify-between mb-1.5"><Text className="text-xs text-white/40">Salaire brut mensuel</Text><Text className="text-xs font-bold text-purple-400">${salaire}</Text></View><TextInput value={salaire} onChangeText={(value) => setSalaire(Number(value))} className="w-full accent-purple-500" /></View>{id === "indemnite" && (
                      <View><View className="flex justify-between mb-1.5"><Text className="text-xs text-white/40">Ancienneté (années)</Text><Text className="text-xs font-bold text-red-400">{anciennete}ans</Text></View><TextInput value={anciennete} onChangeText={(value) => setAnciennete(Number(value))} className="w-full accent-red-500" /></View>
                    )}{id === "conges" && (
                      <View><View className="flex justify-between mb-1.5"><Text className="text-xs text-white/40">Jours de congés</Text><Text className="text-xs font-bold text-blue-400">{joursConges}jours</Text></View><TextInput value={joursConges} onChangeText={(value) => setJoursConges(Number(value))} className="w-full accent-blue-500" /></View>
                    )}</View>{}<View className="rounded-2xl p-4" style={{ backgroundColor: `${color}0f`, borderStyle: "solid" }}><Text className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color }}>Résultat</Text>{id === "conges" && (
                      <View className="space-y-2"><View className="flex justify-between"><Text className="text-xs text-white/50">Salaire journalier</Text><Text className="text-xs font-bold text-white">${(salaire / 26).toFixed(2)}</Text></View><View className="flex justify-between"><Text className="text-xs text-white/50">Jours à indemniser</Text><Text className="text-xs font-bold text-white">{joursConges}j.</Text></View><View className="border-t border-white/10 pt-2 flex justify-between"><Text className="text-sm text-white/70">Indemnité de congés</Text><Text className="text-xl font-black" style={{ color }}>${coutConges}</Text></View></View>
                    )}{id === "indemnite" && (
                      <View className="space-y-2"><View className="flex justify-between"><Text className="text-xs text-white/50">Salaire × ancienneté</Text><Text className="text-xs text-white/70">${salaire}× {anciennete}ans</Text></View><View className="border-t border-white/10 pt-2 flex justify-between"><Text className="text-sm text-white/70">Indemnité totale</Text><Text className="text-xl font-black" style={{ color }}>${indemnite.toLocaleString()}</Text></View><Text className="text-[10px] text-white/30">Base : 1 mois de salaire par année d'ancienneté (Art. 69 CT-RDC)</Text></View>
                    )}{id === "charges" && (
                      <View className="space-y-2"><View className="flex justify-between"><Text className="text-xs text-white/50">Part employeur (13%)</Text><Text className="text-xs font-bold text-white">${chargesEmployeur}</Text></View><View className="flex justify-between"><Text className="text-xs text-white/50">Part employé (5%)</Text><Text className="text-xs font-bold text-white">${chargesEmploye}</Text></View><View className="border-t border-white/10 pt-2 flex justify-between"><Text className="text-sm text-white/70">Coût total employeur</Text><Text className="text-xl font-black" style={{ color }}>${coutTotal}</Text></View><Text className="text-[10px] text-white/30">Taux INSS en vigueur – versement avant le 10 du mois suivant</Text></View>
                    )}</View></View>
              </View>
            )}</View></View>
      ))}</View>
  );
}

// ── AI Assistant (authenticated inner) ────────────────────────────────────
function AIAssistantInner() {
  const requests = useQuery(api.legal.getMyRequests, {});
  const createRequest = useMutation(api.legal.createRequest);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const endRef = useRef<View>(null);

  const SUGGESTIONS = [
    "Quels sont mes droits en cas de licenciement ?",
    "Comment calculer les congés payés ?",
    "Cotisations INSS employeur ?",
    "Bail : caution maximale ?",
  ];

  const sendMessage = async (text?: string) => {
    const q = text ?? input.trim();
    if (!q || isSending) return;
    setInput("");
    setIsSending(true);

    try {
      await createRequest({
        type: "question",
        title: q.slice(0, 100),
        description: q,
      });
      setTimeout(() => __debrouilleProNativeScrollIntoView(endRef.current), 200);
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message: string; code: string };
        toast.error(data.message);
      } else {
        toast.error("Erreur lors de l'envoi");
      }
    } finally {
      setIsSending(false);
    }
  };

  // Loading state
  if (requests === undefined) {
    return (
      <View className="flex flex-col h-full space-y-3"><Skeleton className="h-14 w-full rounded-2xl" /><View className="flex gap-2">{Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-32 rounded-xl" />
          ))}</View><View className="flex-1 space-y-3">{Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}</View></View>
    );
  }

  return (
    <View className="flex flex-col h-full space-y-3">{}<View className="rounded-2xl p-3 flex items-center gap-3" style={{ backgroundColor: "rgba(139,92,246,0.1)", borderWidth: 1, borderColor: "rgba(139,92,246,0.2)", borderStyle: "solid" }}><View className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{  }}><Scale size={16} className="text-white" /></View><View><Text className="text-sm font-bold text-white">Assistant Juridique</Text><Text className="text-xs text-white/50">Droit congolais · Code du travail · OHADA</Text></View><View className="ml-auto w-2 h-2 rounded-full bg-green-400" /></View>{}<View className="flex gap-1.5 overflow-x-auto pb-1" style={{  }}>{SUGGESTIONS.map((s) => (
          <Pressable key={s} onPress={() => sendMessage(s)} className="px-3 py-1.5 rounded-xl text-xs text-white/60 flex-shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>{s}</Pressable>
        ))}</View>{}<View className="flex-1 space-y-3 overflow-y-auto" style={{  }}>{}<View className="flex gap-2"><View className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{  }}><Bot size={14} className="text-white" /></View><View className="max-w-[82%] rounded-2xl rounded-tl-sm px-3 py-2.5" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><Text className="text-sm text-white/85 leading-relaxed">Je suis votre assistant juridique. Posez-moi une question sur le droit congolais, les contrats, les démarches administratives ou les calculs de droits du travail.
            </Text></View></View>{}{[...requests].reverse().map((req) => (
          <View key={req._id} className="space-y-3">{}<View className="flex gap-2 flex-row-reverse"><View className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}><UserIcon size={14} className="text-white/70" /></View><View className="max-w-[82%] rounded-2xl rounded-tr-sm px-3 py-2.5" style={{ backgroundColor: "rgba(139,92,246,0.2)", borderWidth: 1, borderColor: "rgba(139,92,246,0.3)", borderStyle: "solid" }}><Text className="text-sm text-white/85 leading-relaxed">{req.description}</Text><View className="flex items-center gap-2 mt-1"><Text className="text-[10px] text-white/30">{new Date(req.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</Text><Text className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: req.status === "pending" ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)", color: req.status === "pending" ? "#F59E0B" : "#10B981" }}>{req.status === "pending" ? "En attente" : req.status}</Text></View></View></View>{}<View className="flex gap-2"><View className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{  }}><Bot size={14} className="text-white" /></View><View className="max-w-[82%] rounded-2xl rounded-tl-sm px-3 py-2.5" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><Text className="text-sm text-white/85 leading-relaxed">Votre question a été enregistrée. Un conseiller juridique vous répondra sous peu.
                </Text></View></View></View>
        ))}{}{isSending && (
          <View className="flex gap-2"><View className="w-7 h-7 rounded-xl flex items-center justify-center" style={{  }}><Bot size={14} className="text-white" /></View><View className="rounded-2xl rounded-tl-sm px-3 py-3" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><View className="flex gap-1">{[0, 1, 2].map((i) => (
                  <View key={i} className="w-1.5 h-1.5 rounded-full bg-white/50" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                ))}</View></View></View>
        )}<View ref={endRef} /></View>{}{requests.length === 0 && (
        <View className="rounded-2xl p-3 flex items-start gap-2" style={{ backgroundColor: "rgba(99,102,241,0.08)", borderWidth: 1, borderColor: "rgba(99,102,241,0.15)", borderStyle: "solid" }}><Info size={13} className="text-indigo-400 flex-shrink-0 mt-0.5" /><Text className="text-xs text-white/50">Vos questions seront enregistrées ici. Posez votre première question juridique ci-dessous.</Text></View>
      )}{}<View className="flex gap-2 pt-1"><View className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}><TextInput value={input} onChangeText={(value) => setInput(value)} onKeyPress={(e) => { if (e.nativeEvent.key === "Enter") sendMessage(); }} placeholder="Posez une question juridique..." className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30" />{input && <Pressable onPress={() => setInput("")} className=""><X size={12} className="text-white/30" /></Pressable>}</View><Pressable onPress={() => sendMessage()} disabled={isSending || !input.trim()} className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{  }}><Send size={15} className={input.trim() ? "text-white" : "text-white/30"} /></Pressable></View></View>
  );
}

// ── AI Assistant wrapper with auth handling ───────────────────────────────
function AIAssistantJuridique() {
  return (
    <>
      <AuthLoading>
        <View className="flex flex-col h-full space-y-3"><Skeleton className="h-14 w-full rounded-2xl" /><View className="flex gap-2">{Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-32 rounded-xl" />
            ))}</View><View className="flex-1 space-y-3">{Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}</View></View>
      </AuthLoading>

      <Unauthenticated>
        <View className="flex flex-col items-center justify-center h-full space-y-4"><View className="w-16 h-16 rounded-3xl flex items-center justify-center" style={{  }}><Scale size={28} className="text-white" /></View><View className="text-center"><Text className="text-base font-bold text-white">Assistant Juridique</Text><Text className="text-sm text-white/50 mt-1">Connectez-vous pour poser vos questions juridiques</Text></View><SignInButton /></View>
      </Unauthenticated>

      <Authenticated>
        <AIAssistantInner />
      </Authenticated>
    </>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
interface JuridiquePageProps { onBack: () => void; }

export default function JuridiquePage({ onBack }: JuridiquePageProps) {
  const [tab, setTab] = useState<TabId>("contrats");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Tout");
  const [selectedContract, setSelectedContract] = useState<ContractTemplate | null>(null);
  const [selectedDemarche, setSelectedDemarche] = useState<Demarche | null>(null);

  const contractCategories = ["Tout", "Immobilier", "Freelance", "Emploi", "Commerce", "Finance", "Business"];
  const demarcheCategories = ["Tout", "Entreprise", "Documents", "Immobilier", "Social"];

  const filteredContracts = CONTRACTS.filter((c) => {
    if (categoryFilter !== "Tout" && c.category !== categoryFilter) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filteredDemarches = DEMARCHES.filter((d) => {
    if (categoryFilter !== "Tout" && d.category !== categoryFilter) return false;
    if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const TABS = [
    { id: "contrats" as TabId, label: "Contrats", icon: FileText, color: "#8B5CF6" },
    { id: "demarches" as TabId, label: "Démarches", icon: BookOpen, color: "#3B82F6" },
    { id: "calculateurs" as TabId, label: "Calculs", icon: Calculator, color: "#10B981" },
    { id: "assistant" as TabId, label: "IA Juridique", icon: MessageSquare, color: "#EC4899" },
  ];

  const categories = tab === "contrats" ? contractCategories : demarcheCategories;

  return (
    <View className="relative h-full w-full overflow-hidden flex flex-col" style={{  }}>{}<View className="absolute top-0 left-0 w-72 h-72 rounded-full pointer-events-none" style={{  }} /><View className="absolute bottom-20 right-0 w-56 h-56 rounded-full pointer-events-none" style={{  }} />{}<View className="flex-shrink-0 px-4 pt-12 pb-3"><View className="flex items-center gap-3 mb-4"><Pressable onPress={onBack} className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}><ArrowLeft size={18} className="text-white" /></Pressable><View className="flex-1"><Text className="text-xl font-black text-white">Juridique & Admin</Text><Text className="text-xs text-white/40">Contrats · Démarches · Droit congolais</Text></View><View className="px-2.5 py-1.5 rounded-xl flex items-center gap-1.5" style={{ backgroundColor: "rgba(139,92,246,0.15)", borderWidth: 1, borderColor: "rgba(139,92,246,0.25)", borderStyle: "solid" }}><Scale size={13} className="text-purple-400" /><Text className="text-xs font-bold text-purple-400">OHADA</Text></View></View>{}{(tab === "contrats" || tab === "demarches") && (
          <View className="flex items-center gap-2 px-3 py-2.5 rounded-2xl mb-3" style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}><Search size={14} className="text-white/40" /><TextInput value={search} onChangeText={(value) => setSearch(value)} placeholder={tab === "contrats" ? "Rechercher un contrat..." : "Rechercher une démarche..."} className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30" />{search && <Pressable onPress={() => setSearch("")} className=""><X size={13} className="text-white/40" /></Pressable>}</View>
        )}{}{(tab === "contrats" || tab === "demarches") && (
          <View className="flex gap-1.5 overflow-x-auto pb-1 mb-3" style={{  }}>{categories.map((c) => (
              <Pressable key={c} onPress={() => setCategoryFilter(c)} className="px-3 py-1.5 rounded-xl text-xs font-semibold" style={categoryFilter === c
                  ? {  }
                  : { backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}>{c}</Pressable>
            ))}</View>
        )}{}<View className="flex gap-1.5">{TABS.map(({ id, label, icon: Icon, color }) => (
            <Pressable key={id} onPress={() => { setTab(id); setCategoryFilter("Tout"); setSearch(""); }} className="flex-1 py-2 rounded-2xl flex flex-col items-center gap-0.5" style={tab === id
                ? { backgroundColor: `${color}22`, borderStyle: "solid" }
                : { backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}><Icon size={14} style={{  }} /><Text className="text-[10px] font-semibold leading-tight text-center" style={{ color: tab === id ? color : "rgba(255,255,255,0.35)" }}>{label}</Text></Pressable>
          ))}</View></View>{}<View className="flex-1 overflow-y-auto px-4 pb-6" style={{  }}><View>{tab === "contrats" && (
            <View key="contrats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Text className="text-xs text-white/40 py-2">{filteredContracts.length}modèle{filteredContracts.length > 1 ? "s" : ""}disponible{filteredContracts.length > 1 ? "s" : ""}</Text>
              <View className="space-y-3">{filteredContracts.map((c, i) => (
                  <View key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} onPress={() => setSelectedContract(c)} className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                    <View className="flex items-start gap-3"><View className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${c.color}22`, borderStyle: "solid" }}><c.icon size={20} style={{  }} /></View><View className="flex-1"><View className="flex items-start justify-between gap-2"><Text className="text-sm font-bold text-white">{c.title}</Text>{c.popular && <Text className="px-1.5 py-0.5 rounded text-[10px] font-black text-orange-400 flex-shrink-0" style={{ backgroundColor: "rgba(249,115,22,0.15)" }}>Populaire</Text>}</View><Text className="text-xs text-white/50 mt-0.5">{c.category}· {c.pages}pages</Text><Text className="text-xs text-white/40 mt-1">{c.description}</Text><View className="flex items-center justify-between mt-2"><View className="flex gap-1">{c.tags.slice(0, 2).map((t) => (
                              <Text key={t} className="px-2 py-0.5 rounded text-[10px] text-white/40" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>#{t}</Text>
                            ))}</View><ChevronRight size={14} className="text-white/30" /></View></View></View>
                  </View>
                ))}</View>
            </View>
          )}{tab === "demarches" && (
            <View key="demarches" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Text className="text-xs text-white/40 py-2">{filteredDemarches.length}démarche{filteredDemarches.length > 1 ? "s" : ""}</Text>
              <View className="space-y-3">{filteredDemarches.map((d, i) => {
                  const diffColors: Record<string, string> = { Facile: "#10B981", Moyen: "#F59E0B", Complexe: "#EF4444" };
                  return (
                    <View key={d.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} onPress={() => setSelectedDemarche(d)} className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                      <View className="flex items-start gap-3"><View className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${d.color}22`, borderStyle: "solid" }}><d.icon size={20} style={{  }} /></View><View className="flex-1"><Text className="text-sm font-bold text-white">{d.title}</Text><View className="flex items-center gap-2 mt-0.5"><Text className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${diffColors[d.difficulty]}18`, color: diffColors[d.difficulty] }}>{d.difficulty}</Text><Text className="text-xs text-white/40"><Clock size={10} className="inline mr-0.5" />{d.duration}</Text></View><Text className="text-xs text-white/40 mt-1">{d.description}</Text><View className="flex items-center justify-between mt-2"><Text className="text-xs text-white/30">{d.steps.length}étapes · {d.documents.length}documents</Text><ChevronRight size={14} className="text-white/30" /></View></View></View>
                    </View>
                  );
                })}</View>
            </View>
          )}{tab === "calculateurs" && (
            <View key="calcs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-2">
              <View className="rounded-2xl p-3 mb-3 flex items-start gap-2" style={{ backgroundColor: "rgba(99,102,241,0.08)", borderWidth: 1, borderColor: "rgba(99,102,241,0.18)", borderStyle: "solid" }}>
                <Info size={13} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                <Text className="text-xs text-white/50">Calculs basés sur le Code du Travail de la RDC et les taux INSS en vigueur. À titre indicatif uniquement.</Text>
              </View>
              <Calculateurs />
            </View>
          )}{tab === "assistant" && (
            <View key="assistant" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-2 flex flex-col" style={{ height: "calc(100vh - 300px)" }}>
              <AIAssistantJuridique />
            </View>
          )}</View></View>{}<View>{selectedContract && (
          <ContractDetail template={selectedContract} onClose={() => setSelectedContract(null)} />
        )}{selectedDemarche && (
          <DemarcheDetail demarche={selectedDemarche} onClose={() => setSelectedDemarche(null)} />
        )}</View></View>
  );
}
