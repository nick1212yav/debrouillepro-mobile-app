import React, { useMemo, useRef, useState } from "react";

import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Picker } from "@react-native-picker/picker";
import { Clipboard } from "@react-native-clipboard/clipboard";
import { useMutation, useQuery } from "convex/react";

import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Briefcase,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Download,
  FileText,
  Home,
  Info,
  Lock,
  MessageSquare,
  Plus,
  Scale,
  Search,
  Send,
  Shield,
  User as UserIcon,
  Users,
  X,
} from "lucide-react-native";

import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
} from "@/lib/convex-auth-compat";

import { api } from "@/convex/_generated/api";
import { SignInButton } from "@/components/ui/signin";
import { ModuleForm } from "@/integrations/react/components/ModuleForm";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useModuleForm } from "@/integrations/react/hooks/useModuleForm";

/* ============================================================================
 * DESIGN SYSTEM
 * ========================================================================== */

const COLORS = {
  background: "#050812",
  background2: "#0C1022",
  background3: "#11172A",

  white: "#FFFFFF",
  text: "#F8FAFC",
  secondary: "#CBD5E1",
  muted: "#94A3B8",
  faint: "#64748B",

  border: "rgba(255,255,255,0.10)",
  borderStrong: "rgba(255,255,255,0.16)",
  card: "rgba(255,255,255,0.055)",
  cardStrong: "rgba(255,255,255,0.075)",

  primary: "#2563EB",
  primary2: "#4F46E5",
  purple: "#8B5CF6",
  green: "#10B981",
  yellow: "#F59E0B",
  red: "#EF4444",
  cyan: "#06B6D4",
  pink: "#EC4899",
};

type IconComponent = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

type TabId = "contrats" | "demarches" | "calculateurs" | "assistant";

/* ============================================================================
 * CONTRACTS
 * ========================================================================== */

interface ContractField {
  id: string;
  label: string;
  placeholder: string;
  type: "text" | "date" | "number" | "select";
  options?: string[];
  required: boolean;
}

interface ContractTemplate {
  id: string;
  title: string;
  category: string;
  icon: IconComponent;
  color: string;
  description: string;
  tags: string[];
  popular: boolean;
  pages: number;
  fields: ContractField[];
}

const CONTRACTS: ContractTemplate[] = [
  {
    id: "bail",
    title: "Contrat de bail",
    category: "Immobilier",
    icon: Home,
    color: "#F97316",
    description:
      "Modèle de contrat de location entre propriétaire et locataire.",
    tags: ["Location", "Immobilier", "Logement"],
    popular: true,
    pages: 4,
    fields: [
      {
        id: "bailleur",
        label: "Nom du bailleur",
        placeholder: "Nom complet",
        type: "text",
        required: true,
      },
      {
        id: "locataire",
        label: "Nom du locataire",
        placeholder: "Nom complet",
        type: "text",
        required: true,
      },
      {
        id: "adresse",
        label: "Adresse du bien",
        placeholder: "Adresse complète",
        type: "text",
        required: true,
      },
      {
        id: "loyer",
        label: "Loyer mensuel",
        placeholder: "Montant",
        type: "number",
        required: true,
      },
      {
        id: "caution",
        label: "Caution",
        placeholder: "Montant",
        type: "number",
        required: false,
      },
      {
        id: "debut",
        label: "Date de début",
        placeholder: "JJ/MM/AAAA",
        type: "date",
        required: true,
      },
      {
        id: "duree",
        label: "Durée",
        placeholder: "",
        type: "select",
        options: ["6 mois", "1 an", "2 ans", "3 ans", "Indéterminée"],
        required: true,
      },
    ],
  },

  {
    id: "prestation",
    title: "Contrat de prestation",
    category: "Freelance",
    icon: Briefcase,
    color: "#8B5CF6",
    description:
      "Modèle de contrat de mission entre un prestataire et son client.",
    tags: ["Freelance", "Service", "Mission"],
    popular: true,
    pages: 3,
    fields: [
      {
        id: "prestataire",
        label: "Prestataire",
        placeholder: "Nom complet",
        type: "text",
        required: true,
      },
      {
        id: "client",
        label: "Client",
        placeholder: "Nom ou société",
        type: "text",
        required: true,
      },
      {
        id: "mission",
        label: "Description de la mission",
        placeholder: "Décrivez précisément la mission...",
        type: "text",
        required: true,
      },
      {
        id: "montant",
        label: "Montant",
        placeholder: "Montant convenu",
        type: "number",
        required: true,
      },
      {
        id: "delai",
        label: "Délai de livraison",
        placeholder: "JJ/MM/AAAA",
        type: "date",
        required: true,
      },
      {
        id: "paiement",
        label: "Mode de paiement",
        placeholder: "",
        type: "select",
        options: [
          "À la livraison",
          "50% avance 50% fin",
          "Mensuel",
          "Par étapes",
        ],
        required: true,
      },
    ],
  },

  {
    id: "cdi",
    title: "Contrat de travail CDI",
    category: "Emploi",
    icon: Users,
    color: "#10B981",
    description: "Modèle de contrat de travail à durée indéterminée.",
    tags: ["CDI", "Emploi", "Travail"],
    popular: true,
    pages: 5,
    fields: [
      {
        id: "employeur",
        label: "Employeur",
        placeholder: "Nom ou société",
        type: "text",
        required: true,
      },
      {
        id: "employe",
        label: "Employé(e)",
        placeholder: "Nom complet",
        type: "text",
        required: true,
      },
      {
        id: "poste",
        label: "Poste",
        placeholder: "Intitulé du poste",
        type: "text",
        required: true,
      },
      {
        id: "salaire",
        label: "Salaire brut",
        placeholder: "Montant",
        type: "number",
        required: true,
      },
      {
        id: "debut",
        label: "Date de début",
        placeholder: "JJ/MM/AAAA",
        type: "date",
        required: true,
      },
      {
        id: "essai",
        label: "Période d'essai",
        placeholder: "",
        type: "select",
        options: ["Aucune", "1 mois", "2 mois", "3 mois", "6 mois"],
        required: false,
      },
    ],
  },

  {
    id: "cession",
    title: "Acte de cession",
    category: "Commerce",
    icon: Scale,
    color: "#6366F1",
    description:
      "Modèle de document pour formaliser une cession entre parties.",
    tags: ["Cession", "Vente", "Propriété"],
    popular: false,
    pages: 3,
    fields: [
      {
        id: "vendeur",
        label: "Vendeur / cédant",
        placeholder: "Nom complet",
        type: "text",
        required: true,
      },
      {
        id: "acheteur",
        label: "Acheteur / cessionnaire",
        placeholder: "Nom complet",
        type: "text",
        required: true,
      },
      {
        id: "bien",
        label: "Bien cédé",
        placeholder: "Description précise du bien...",
        type: "text",
        required: true,
      },
      {
        id: "prix",
        label: "Prix de cession",
        placeholder: "Montant",
        type: "number",
        required: true,
      },
      {
        id: "date",
        label: "Date de cession",
        placeholder: "JJ/MM/AAAA",
        type: "date",
        required: true,
      },
    ],
  },

  {
    id: "pret",
    title: "Reconnaissance de dette",
    category: "Finance",
    icon: FileText,
    color: "#EC4899",
    description:
      "Modèle de document attestant une dette ou un prêt entre parties.",
    tags: ["Prêt", "Dette", "Finance"],
    popular: false,
    pages: 2,
    fields: [
      {
        id: "preteur",
        label: "Prêteur",
        placeholder: "Nom complet",
        type: "text",
        required: true,
      },
      {
        id: "emprunteur",
        label: "Emprunteur",
        placeholder: "Nom complet",
        type: "text",
        required: true,
      },
      {
        id: "montant",
        label: "Montant prêté",
        placeholder: "Montant",
        type: "number",
        required: true,
      },
      {
        id: "remboursement",
        label: "Date de remboursement",
        placeholder: "JJ/MM/AAAA",
        type: "date",
        required: true,
      },
      {
        id: "interet",
        label: "Taux d'intérêt",
        placeholder: "0",
        type: "number",
        required: false,
      },
    ],
  },

  {
    id: "nda",
    title: "Accord de confidentialité",
    category: "Business",
    icon: Lock,
    color: "#0EA5E9",
    description:
      "Modèle d'accord destiné à encadrer la confidentialité d'informations.",
    tags: ["NDA", "Confidentialité", "Business"],
    popular: false,
    pages: 2,
    fields: [
      {
        id: "divulgant",
        label: "Partie divulgante",
        placeholder: "Entreprise / personne",
        type: "text",
        required: true,
      },
      {
        id: "recevant",
        label: "Partie recevante",
        placeholder: "Entreprise / personne",
        type: "text",
        required: true,
      },
      {
        id: "objet",
        label: "Objet de la confidentialité",
        placeholder: "Informations concernées...",
        type: "text",
        required: true,
      },
      {
        id: "duree",
        label: "Durée",
        placeholder: "",
        type: "select",
        options: ["1 an", "2 ans", "3 ans", "5 ans", "Indéfinie"],
        required: true,
      },
    ],
  },
];

/* ============================================================================
 * DEMARCHES
 * ========================================================================== */

interface DemarcheStep {
  title: string;
  description: string;
}

interface Demarche {
  id: string;
  title: string;
  category: string;
  icon: IconComponent;
  color: string;
  description: string;
  duration: string;
  difficulty: "Facile" | "Moyen" | "Complexe";
  steps: DemarcheStep[];
  documents: string[];
}

const DEMARCHES: Demarche[] = [
  {
    id: "registre",
    title: "Création d'entreprise (RCCM)",
    category: "Entreprise",
    icon: Briefcase,
    color: "#8B5CF6",
    description:
      "Parcours indicatif pour préparer les principales étapes liées à la création d'une entreprise.",
    duration: "2–4 semaines",
    difficulty: "Moyen",
    steps: [
      {
        title: "Choisir la forme juridique",
        description:
          "Déterminer la forme juridique adaptée à l'activité et aux associés.",
      },
      {
        title: "Rédiger les statuts",
        description:
          "Préparer le document fondateur avec les informations relatives à la société.",
      },
      {
        title: "Préparer le capital",
        description:
          "Préparer les justificatifs et opérations financières requis par la procédure applicable.",
      },
      {
        title: "Déposer le dossier",
        description:
          "Déposer le dossier auprès de l'autorité ou du guichet compétent.",
      },
      {
        title: "Obtenir les identifiants",
        description:
          "Effectuer les démarches fiscales et administratives applicables.",
      },
      {
        title: "Effectuer les inscriptions complémentaires",
        description:
          "Vérifier les obligations sociales et administratives applicables à l'entreprise.",
      },
    ],
    documents: [
      "Pièce d'identité",
      "Statuts de société",
      "Justificatifs requis",
      "Informations relatives aux associés",
      "Justificatifs de siège",
    ],
  },

  {
    id: "passeport",
    title: "Renouvellement de passeport",
    category: "Documents",
    icon: FileText,
    color: "#3B82F6",
    description:
      "Parcours indicatif pour préparer un renouvellement de passeport.",
    duration: "Variable",
    difficulty: "Facile",
    steps: [
      {
        title: "Rassembler les documents",
        description:
          "Préparer le passeport précédent et les autres pièces exigées par l'administration.",
      },
      {
        title: "Vérifier l'autorité compétente",
        description:
          "Identifier le service officiel compétent et ses modalités actuelles.",
      },
      {
        title: "Remplir la demande",
        description:
          "Compléter le formulaire selon les instructions officielles.",
      },
      {
        title: "Payer les frais officiels",
        description:
          "Utiliser exclusivement les modalités de paiement communiquées par l'autorité compétente.",
      },
      {
        title: "Conserver le récépissé",
        description: "Conserver toute preuve officielle de dépôt.",
      },
      {
        title: "Retirer le document",
        description: "Suivre les instructions officielles pour le retrait.",
      },
    ],
    documents: [
      "Ancien passeport",
      "Pièce d'identité",
      "Acte d'état civil si requis",
      "Photos si requises",
      "Justificatif de paiement",
    ],
  },

  {
    id: "permis",
    title: "Permis de construire",
    category: "Immobilier",
    icon: Home,
    color: "#F97316",
    description:
      "Parcours indicatif pour préparer une demande d'autorisation de construire.",
    duration: "Variable",
    difficulty: "Complexe",
    steps: [
      {
        title: "Faire établir les plans",
        description:
          "Préparer les documents techniques requis avec les professionnels compétents.",
      },
      {
        title: "Constituer le dossier",
        description:
          "Rassembler les documents fonciers, techniques et administratifs exigés.",
      },
      {
        title: "Déposer la demande",
        description:
          "Déposer le dossier auprès de l'autorité compétente pour le site concerné.",
      },
      {
        title: "Instruction",
        description:
          "Suivre l'instruction administrative et technique du dossier.",
      },
      {
        title: "Décision",
        description:
          "Respecter la décision et les éventuelles conditions imposées.",
      },
    ],
    documents: [
      "Plans architecturaux",
      "Justificatif de propriété ou droit d'occupation",
      "Pièce d'identité",
      "Documents techniques requis",
      "Autorisations complémentaires si nécessaires",
    ],
  },

  {
    id: "cnss",
    title: "Inscription CNSS / INSS",
    category: "Social",
    icon: Shield,
    color: "#10B981",
    description:
      "Parcours indicatif relatif aux démarches sociales d'un employeur et de ses travailleurs.",
    duration: "Variable",
    difficulty: "Facile",
    steps: [
      {
        title: "Préparer les documents employeur",
        description:
          "Réunir les documents d'identification et d'immatriculation de l'employeur.",
      },
      {
        title: "Identifier le service compétent",
        description:
          "Vérifier auprès de l'organisme concerné le circuit actuellement applicable.",
      },
      {
        title: "Remplir les formulaires",
        description:
          "Compléter les formulaires exigés pour l'employeur et les travailleurs.",
      },
      {
        title: "Obtenir les références",
        description:
          "Conserver les numéros et attestations remis par l'organisme.",
      },
    ],
    documents: [
      "Documents d'immatriculation",
      "Pièce d'identité",
      "Liste des travailleurs",
      "Contrats de travail",
      "Documents exigés par l'organisme",
    ],
  },
];

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatDate() {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
}

function difficultyColor(difficulty: Demarche["difficulty"]) {
  if (difficulty === "Facile") {
    return COLORS.green;
  }

  if (difficulty === "Complexe") {
    return COLORS.red;
  }

  return COLORS.yellow;
}

/* ============================================================================
 * CONTRACT DETAIL
 * ========================================================================== */

function ContractDetail({
  template,
  onClose,
}: {
  template: ContractTemplate;
  onClose: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});

  const [generated, setGenerated] = useState(false);

  const [copied, setCopied] = useState(false);

  const complete = template.fields
    .filter((field) => field.required)
    .every((field) => Boolean(values[field.id]?.trim()));

  const previewText = useMemo(() => {
    const fields = template.fields
      .map(
        (field) =>
          `${field.label} : ${values[field.id]?.trim() || "________________"}`,
      )
      .join("\n");

    return [
      `DOCUMENT – ${template.title.toUpperCase()}`,
      "",
      "INFORMATIONS DES PARTIES",
      fields,
      "",
      `Fait le ${formatDate()}`,
      "",
      "SIGNATURES",
      "",
      "____________________        ____________________",
      "        Partie 1                       Partie 2",
      "",
      "IMPORTANT :",
      "Ce modèle est fourni comme support de préparation.",
      "Il ne constitue pas, à lui seul, une validation juridique.",
      "Pour un acte important, faites vérifier le document",
      "par un professionnel du droit compétent.",
    ].join("\n");
  }, [template, values]);

  const copyDocument = async () => {
    try {
      await Clipboard.setString(previewText);

      setCopied(true);

      setTimeout(() => setCopied(false), 1800);
    } catch {
      Alert.alert("Copie impossible", "Le document n'a pas pu être copié.");
    }
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalScreen}>
        <View style={styles.modalHeader}>
          <Pressable onPress={onClose} style={styles.iconButton}>
            <ArrowLeft size={20} color={COLORS.white} />
          </Pressable>

          <View style={styles.modalHeaderText}>
            <Text style={styles.modalTitle} numberOfLines={2}>
              {template.title}
            </Text>

            <Text style={styles.modalSubtitle}>
              {template.category} · {template.pages} pages indicatives
            </Text>
          </View>

          <View
            style={[
              styles.templateIcon,
              {
                backgroundColor: `${template.color}18`,
                borderColor: `${template.color}30`,
              },
            ]}
          >
            {React.createElement(template.icon, {
              size: 19,
              color: template.color,
            })}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.modalContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.institutionNotice}>
            <AlertTriangle size={16} color={COLORS.yellow} />

            <Text style={styles.institutionNoticeText}>
              Modèle de préparation. Le contenu doit être vérifié au regard du
              droit applicable, de la situation des parties et des formalités
              éventuellement requises.
            </Text>
          </View>

          {!generated ? (
            <>
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>Informations</Text>

                <Text style={styles.sectionSubtitle}>
                  Les champs marqués * sont requis.
                </Text>
              </View>

              {template.fields.map((field) => (
                <View key={field.id} style={styles.formCard}>
                  <Text style={styles.fieldLabel}>
                    {field.label}
                    {field.required ? (
                      <Text
                        style={{
                          color: COLORS.red,
                        }}
                      >
                        {" "}
                        *
                      </Text>
                    ) : null}
                  </Text>

                  {field.type === "select" ? (
                    <View style={styles.pickerWrapper}>
                      <Picker
                        selectedValue={values[field.id] ?? ""}
                        onValueChange={(value) =>
                          setValues((current) => ({
                            ...current,
                            [field.id]: String(value),
                          }))
                        }
                        dropdownIconColor={COLORS.muted}
                        style={styles.picker}
                      >
                        <Picker.Item label="Sélectionner..." value="" />

                        {field.options?.map((option) => (
                          <Picker.Item
                            key={option}
                            label={option}
                            value={option}
                          />
                        ))}
                      </Picker>
                    </View>
                  ) : (
                    <TextInput
                      value={values[field.id] ?? ""}
                      onChangeText={(value) =>
                        setValues((current) => ({
                          ...current,
                          [field.id]: value,
                        }))
                      }
                      placeholder={field.placeholder}
                      placeholderTextColor={COLORS.faint}
                      keyboardType={
                        field.type === "number" ? "numeric" : "default"
                      }
                      style={styles.textInput}
                    />
                  )}
                </View>
              ))}

              <Pressable
                disabled={!complete}
                onPress={() => setGenerated(true)}
                style={[
                  styles.primaryButton,
                  !complete && styles.disabledButton,
                ]}
              >
                <FileText size={18} color="#FFFFFF" />

                <Text style={styles.primaryButtonText}>
                  Générer le document
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.generatedHeader}>
                <View>
                  <Text style={styles.generatedTitle}>Document préparé</Text>

                  <Text style={styles.generatedSubtitle}>
                    Vérifiez chaque élément avant toute utilisation.
                  </Text>
                </View>

                <CheckCircle2 size={24} color={COLORS.green} />
              </View>

              <View style={styles.documentPreview}>
                <Text style={styles.documentPreviewText}>{previewText}</Text>
              </View>

              <View style={styles.actionRow}>
                <Pressable
                  onPress={() => setGenerated(false)}
                  style={styles.secondaryButton}
                >
                  <X size={16} color={COLORS.secondary} />

                  <Text style={styles.secondaryButtonText}>Modifier</Text>
                </Pressable>

                <Pressable
                  onPress={copyDocument}
                  style={styles.primaryButtonSmall}
                >
                  {copied ? (
                    <CheckCircle2 size={16} color="#FFFFFF" />
                  ) : (
                    <Copy size={16} color="#FFFFFF" />
                  )}

                  <Text style={styles.primaryButtonText}>
                    {copied ? "Copié" : "Copier"}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.legalWarning}>
                <Shield size={15} color={COLORS.yellow} />

                <Text style={styles.legalWarningText}>
                  Aucun document généré ici ne remplace la vérification d'un
                  professionnel lorsque celle-ci est nécessaire.
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ============================================================================
 * DEMARCHE DETAIL
 * ========================================================================== */

function DemarcheDetail({
  demarche,
  onClose,
}: {
  demarche: Demarche;
  onClose: () => void;
}) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const progress =
    demarche.steps.length === 0
      ? 0
      : Math.round((completedSteps.length / demarche.steps.length) * 100);

  const toggleStep = (index: number) => {
    setCompletedSteps((current) =>
      current.includes(index)
        ? current.filter((value) => value !== index)
        : [...current, index],
    );
  };

  const diffColor = difficultyColor(demarche.difficulty);

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalScreen}>
        <View style={styles.modalHeader}>
          <Pressable onPress={onClose} style={styles.iconButton}>
            <ArrowLeft size={20} color={COLORS.white} />
          </Pressable>

          <View style={styles.modalHeaderText}>
            <Text style={styles.modalTitle} numberOfLines={2}>
              {demarche.title}
            </Text>

            <View style={styles.inlineMeta}>
              <View
                style={[
                  styles.difficultyBadge,
                  {
                    backgroundColor: `${diffColor}18`,
                    borderColor: `${diffColor}30`,
                  },
                ]}
              >
                <Text style={[styles.difficultyText, { color: diffColor }]}>
                  {demarche.difficulty}
                </Text>
              </View>

              <Text style={styles.modalSubtitle}>{demarche.duration}</Text>
            </View>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.modalContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.detailDescription}>{demarche.description}</Text>

          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progression personnelle</Text>

              <Text
                style={[
                  styles.progressValue,
                  {
                    color: progress === 100 ? COLORS.green : COLORS.purple,
                  },
                ]}
              >
                {progress}%
              </Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress}%`,
                  },
                ]}
              />
            </View>

            <Text style={styles.progressMeta}>
              {completedSteps.length}/{demarche.steps.length} étapes cochées sur
              cet appareil.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Étapes à suivre</Text>

          <View style={styles.stepList}>
            {demarche.steps.map((step, index) => {
              const done = completedSteps.includes(index);

              return (
                <Pressable
                  key={`${demarche.id}-${index}`}
                  onPress={() => toggleStep(index)}
                  style={[styles.stepCard, done && styles.stepCardDone]}
                >
                  <View
                    style={[styles.stepNumber, done && styles.stepNumberDone]}
                  >
                    {done ? (
                      <CheckCircle2 size={16} color={COLORS.green} />
                    ) : (
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    )}
                  </View>

                  <View style={styles.stepContent}>
                    <Text
                      style={[styles.stepTitle, done && styles.stepTitleDone]}
                    >
                      {step.title}
                    </Text>

                    <Text style={styles.stepDescription}>
                      {step.description}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.documentsCard}>
            <View style={styles.documentsHeader}>
              <FileText size={17} color={COLORS.cyan} />

              <Text style={styles.documentsTitle}>Documents à vérifier</Text>
            </View>

            {demarche.documents.map((document) => (
              <View key={document} style={styles.documentRow}>
                <View style={styles.documentBullet} />

                <Text style={styles.documentText}>{document}</Text>
              </View>
            ))}
          </View>

          <View style={styles.officialWarning}>
            <Info size={16} color={COLORS.cyan} />

            <Text style={styles.officialWarningText}>
              Les délais, frais, pièces et autorités compétentes peuvent
              évoluer. Avant toute démarche, vérifiez les informations auprès du
              service public compétent.
            </Text>
          </View>

          {progress === 100 ? (
            <View style={styles.completedCard}>
              <CheckCircle2 size={20} color={COLORS.green} />

              <View style={styles.completedText}>
                <Text style={styles.completedTitle}>
                  Parcours marqué comme terminé
                </Text>

                <Text style={styles.completedSubtitle}>
                  Cela indique uniquement votre progression dans l'application.
                </Text>
              </View>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ============================================================================
 * CALCULATEURS
 * ========================================================================== */

function NumberField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
}) {
  return (
    <View style={styles.calculatorField}>
      <Text style={styles.calculatorLabel}>{label}</Text>

      <View style={styles.calculatorInputRow}>
        <TextInput
          value={value}
          onChangeText={(text) => onChange(text.replace(/[^0-9.]/g, ""))}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={COLORS.faint}
          style={styles.calculatorInput}
        />

        {suffix ? <Text style={styles.calculatorSuffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

function Calculateurs() {
  const [activeCalc, setActiveCalc] = useState<
    "conges" | "indemnite" | "charges" | null
  >(null);

  const [salaire, setSalaire] = useState("1000");

  const [anciennete, setAnciennete] = useState("3");

  const [joursConges, setJoursConges] = useState("18");

  const salary = Number(salaire) || 0;

  const years = Number(anciennete) || 0;

  const days = Number(joursConges) || 0;

  /*
   * Ces résultats sont volontairement présentés
   * comme des simulations mathématiques.
   *
   * Nous ne les présentons pas comme un calcul
   * juridiquement certifié, car le fichier fourni
   * ne contient pas de moteur juridique officiel
   * permettant de vérifier les règles applicables
   * à chaque situation.
   */
  const simpleIndemnite = salary * years;

  const simpleEmployerCharge = salary * 0.13;

  const simpleEmployeeCharge = salary * 0.05;

  const simpleEmployerCost = salary + simpleEmployerCharge;

  const simpleLeaveValue = days > 0 ? (salary / 26) * days : 0;

  const calculations = [
    {
      id: "conges" as const,
      title: "Simulation de congés",
      description: "Estimation mathématique à partir des paramètres saisis.",
      icon: Clock,
      color: COLORS.primary,
    },
    {
      id: "indemnite" as const,
      title: "Simulation d'indemnité",
      description: "Simulation simple selon salaire et ancienneté saisis.",
      icon: Briefcase,
      color: COLORS.red,
    },
    {
      id: "charges" as const,
      title: "Simulation de charges",
      description:
        "Calcul indicatif à partir des pourcentages saisis dans le modèle.",
      icon: Shield,
      color: COLORS.green,
    },
  ];

  return (
    <View style={styles.calculators}>
      <View style={styles.calculatorNotice}>
        <Info size={16} color={COLORS.cyan} />

        <Text style={styles.calculatorNoticeText}>
          Ces outils produisent des simulations indicatives. Ils ne constituent
          pas un calcul juridique, fiscal ou social certifié.
        </Text>
      </View>

      {calculations.map(({ id, title, description, icon: Icon, color }) => {
        const opened = activeCalc === id;

        return (
          <View key={id} style={styles.calculatorCard}>
            <Pressable
              onPress={() => setActiveCalc(opened ? null : id)}
              style={styles.calculatorHeader}
            >
              <View
                style={[
                  styles.calculatorIcon,
                  {
                    backgroundColor: `${color}18`,
                    borderColor: `${color}28`,
                  },
                ]}
              >
                <Icon size={19} color={color} />
              </View>

              <View style={styles.calculatorIdentity}>
                <Text style={styles.calculatorTitle}>{title}</Text>

                <Text style={styles.calculatorDescription}>{description}</Text>
              </View>

              {opened ? (
                <ChevronUp size={17} color={COLORS.muted} />
              ) : (
                <ChevronDown size={17} color={COLORS.muted} />
              )}
            </Pressable>

            {opened ? (
              <View style={styles.calculatorBody}>
                <NumberField
                  label="Salaire mensuel"
                  value={salaire}
                  onChange={setSalaire}
                  suffix="USD"
                />

                {id === "indemnite" ? (
                  <NumberField
                    label="Ancienneté"
                    value={anciennete}
                    onChange={setAnciennete}
                    suffix="ans"
                  />
                ) : null}

                {id === "conges" ? (
                  <NumberField
                    label="Nombre de jours"
                    value={joursConges}
                    onChange={setJoursConges}
                    suffix="jours"
                  />
                ) : null}

                <View
                  style={[
                    styles.resultCard,
                    {
                      borderColor: `${color}28`,
                      backgroundColor: `${color}0D`,
                    },
                  ]}
                >
                  <Text style={[styles.resultLabel, { color }]}>
                    RÉSULTAT INDICATIF
                  </Text>

                  {id === "conges" ? (
                    <>
                      <Text style={styles.resultFormula}>
                        Salaire ÷ 26 × jours
                      </Text>

                      <Text style={[styles.resultValue, { color }]}>
                        {Math.round(simpleLeaveValue).toLocaleString("fr-FR")}{" "}
                        USD
                      </Text>
                    </>
                  ) : null}

                  {id === "indemnite" ? (
                    <>
                      <Text style={styles.resultFormula}>
                        Salaire × ancienneté
                      </Text>

                      <Text style={[styles.resultValue, { color }]}>
                        {Math.round(simpleIndemnite).toLocaleString("fr-FR")}{" "}
                        USD
                      </Text>
                    </>
                  ) : null}

                  {id === "charges" ? (
                    <>
                      <Text style={styles.resultFormula}>
                        Paramètres du modèle : employeur 13% · employé 5%
                      </Text>

                      <View style={styles.resultLine}>
                        <Text style={styles.resultLineLabel}>Employeur</Text>

                        <Text style={styles.resultLineValue}>
                          {Math.round(simpleEmployerCharge).toLocaleString(
                            "fr-FR",
                          )}{" "}
                          USD
                        </Text>
                      </View>

                      <View style={styles.resultLine}>
                        <Text style={styles.resultLineLabel}>Employé</Text>

                        <Text style={styles.resultLineValue}>
                          {Math.round(simpleEmployeeCharge).toLocaleString(
                            "fr-FR",
                          )}{" "}
                          USD
                        </Text>
                      </View>

                      <View style={styles.resultLine}>
                        <Text style={styles.resultLineLabelStrong}>
                          Coût employeur
                        </Text>

                        <Text style={[styles.resultLineValueStrong, { color }]}>
                          {Math.round(simpleEmployerCost).toLocaleString(
                            "fr-FR",
                          )}{" "}
                          USD
                        </Text>
                      </View>
                    </>
                  ) : null}
                </View>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

/* ============================================================================
 * AI / ASSISTANT JURIDIQUE
 * ========================================================================== */

function AIAssistantInner() {
  const requests = useQuery(api.legal.getMyRequests, {});

  const createRequest = useMutation(api.legal.createRequest);

  const [input, setInput] = useState("");

  const [isSending, setIsSending] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  const suggestions = [
    "Quels documents faut-il préparer pour cette démarche ?",
    "Quels sont les points importants d'un contrat de travail ?",
    "Comment préparer une demande administrative ?",
    "Quels éléments vérifier avant de signer un contrat ?",
  ];

  const sendMessage = async (suggestion?: string) => {
    const question = (suggestion ?? input).trim();

    if (!question || isSending) {
      return;
    }

    setInput("");
    setIsSending(true);

    try {
      await createRequest({
        type: "question",
        title: question.slice(0, 100),
        description: question,
      });

      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({
          animated: true,
        });
      });
    } catch (error) {
      Alert.alert(
        "Question non envoyée",
        error instanceof Error ? error.message : "Une erreur est survenue.",
      );
    } finally {
      setIsSending(false);
    }
  };

  if (requests === undefined) {
    return (
      <View style={styles.assistantLoading}>
        <View style={styles.loadingBarLarge} />

        <View style={styles.loadingBarSmall} />

        <View style={styles.loadingConversation}>
          <View style={styles.loadingBubble} />

          <View style={[styles.loadingBubble, styles.loadingBubbleShort]} />

          <View style={styles.loadingBubble} />
        </View>
      </View>
    );
  }

  const orderedRequests = [...requests].reverse();

  return (
    <KeyboardAvoidingView
      style={styles.assistant}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.assistantHeader}>
        <View style={styles.assistantIcon}>
          <Scale size={18} color="#FFFFFF" />
        </View>

        <View style={styles.assistantHeaderText}>
          <Text style={styles.assistantTitle}>Assistant Juridique</Text>

          <Text style={styles.assistantSubtitle}>
            Questions · demandes · suivi
          </Text>
        </View>

        <View style={styles.assistantStatus}>
          <View style={styles.statusDot} />

          <Text style={styles.statusText}>Actif</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.suggestionsScroll}
        contentContainerStyle={styles.suggestionsContent}
      >
        {suggestions.map((suggestion) => (
          <Pressable
            key={suggestion}
            disabled={isSending}
            onPress={() => sendMessage(suggestion)}
            style={styles.suggestion}
          >
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        ref={scrollRef}
        style={styles.conversation}
        contentContainerStyle={styles.conversationContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.messageRow}>
          <View style={styles.botAvatar}>
            <Scale size={14} color="#FFFFFF" />
          </View>

          <View style={styles.botBubble}>
            <Text style={styles.messageText}>
              Posez votre question juridique. Votre demande sera enregistrée
              dans votre espace pour traitement selon le fonctionnement prévu
              par le service juridique.
            </Text>
          </View>
        </View>

        {orderedRequests.map((request) => (
          <View key={String(request._id)}>
            <View style={[styles.messageRow, styles.userMessageRow]}>
              <View style={styles.userAvatar}>
                <UserIcon size={14} color={COLORS.secondary} />
              </View>

              <View style={styles.userBubble}>
                <Text style={styles.messageText}>{request.description}</Text>

                <Text style={styles.messageTime}>
                  {new Date(request.createdAt).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>

                <View style={styles.requestStatus}>
                  <Text style={styles.requestStatusText}>
                    {request.status === "pending"
                      ? "En attente"
                      : request.status}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.messageRow}>
              <View style={styles.botAvatar}>
                <Scale size={14} color="#FFFFFF" />
              </View>

              <View style={styles.botBubble}>
                <Text style={styles.messageText}>
                  Votre demande a été enregistrée. La réponse juridique doit
                  être fournie selon le processus de traitement configuré par le
                  service.
                </Text>
              </View>
            </View>
          </View>
        ))}

        {isSending ? (
          <View style={styles.messageRow}>
            <View style={styles.botAvatar}>
              <Scale size={14} color="#FFFFFF" />
            </View>

            <View style={styles.typingBubble}>
              <Text style={styles.typingText}>
                Enregistrement de votre demande...
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.assistantInputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          editable={!isSending}
          placeholder="Posez une question juridique..."
          placeholderTextColor={COLORS.faint}
          multiline
          maxLength={5000}
          style={styles.assistantInput}
        />

        {input.length > 0 ? (
          <Pressable onPress={() => setInput("")} style={styles.inputClear}>
            <X size={14} color={COLORS.muted} />
          </Pressable>
        ) : null}

        <Pressable
          disabled={isSending || !input.trim()}
          onPress={() => sendMessage()}
          style={[
            styles.sendButton,
            (!input.trim() || isSending) && styles.sendButtonDisabled,
          ]}
        >
          <Send size={16} color={input.trim() ? "#FFFFFF" : COLORS.faint} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function AIAssistantJuridique() {
  return (
    <View style={styles.full}>
      <AuthLoading>
        <View style={styles.authLoading} accessible>
          <View style={styles.loadingBarLarge} />

          <View style={styles.loadingBarSmall} />
        </View>
      </AuthLoading>

      <Unauthenticated>
        <View style={styles.unauthenticated}>
          <View style={styles.authIcon}>
            <Scale size={30} color="#FFFFFF" />
          </View>

          <Text style={styles.authTitle}>Assistant Juridique</Text>

          <Text style={styles.authDescription}>
            Connectez-vous pour envoyer et suivre vos demandes juridiques.
          </Text>

          <SignInButton />
        </View>
      </Unauthenticated>

      <Authenticated>
        <AIAssistantInner />
      </Authenticated>
    </View>
  );
}

/* ============================================================================
 * CARD COMPONENTS
 * ========================================================================== */

function ContractCard({
  template,
  onPress,
}: {
  template: ContractTemplate;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.contentCard, pressed && styles.pressed]}
    >
      <View style={styles.contentCardHeader}>
        <View
          style={[
            styles.contentIcon,
            {
              backgroundColor: `${template.color}18`,
              borderColor: `${template.color}28`,
            },
          ]}
        >
          {React.createElement(template.icon, {
            size: 20,
            color: template.color,
          })}
        </View>

        <View style={styles.contentCardIdentity}>
          <View style={styles.titleLine}>
            <Text style={styles.contentCardTitle} numberOfLines={2}>
              {template.title}
            </Text>

            {template.popular ? (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>Populaire</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.contentCardMeta}>
            {template.category} · {template.pages} pages
          </Text>

          <Text style={styles.contentCardDescription} numberOfLines={3}>
            {template.description}
          </Text>
        </View>

        <ChevronRight size={18} color={COLORS.faint} />
      </View>

      <View style={styles.tagsRow}>
        {template.tags.slice(0, 3).map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>#{tag}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

function DemarcheCard({
  demarche,
  onPress,
}: {
  demarche: Demarche;
  onPress: () => void;
}) {
  const color = difficultyColor(demarche.difficulty);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.contentCard, pressed && styles.pressed]}
    >
      <View style={styles.contentCardHeader}>
        <View
          style={[
            styles.contentIcon,
            {
              backgroundColor: `${demarche.color}18`,
              borderColor: `${demarche.color}28`,
            },
          ]}
        >
          {React.createElement(demarche.icon, {
            size: 20,
            color: demarche.color,
          })}
        </View>

        <View style={styles.contentCardIdentity}>
          <Text style={styles.contentCardTitle} numberOfLines={2}>
            {demarche.title}
          </Text>

          <View style={styles.inlineMeta}>
            <View
              style={[
                styles.difficultyBadge,
                {
                  backgroundColor: `${color}15`,
                  borderColor: `${color}25`,
                },
              ]}
            >
              <Text style={[styles.difficultyText, { color }]}>
                {demarche.difficulty}
              </Text>
            </View>

            <Text style={styles.contentCardMeta}>{demarche.duration}</Text>
          </View>

          <Text style={styles.contentCardDescription} numberOfLines={3}>
            {demarche.description}
          </Text>
        </View>

        <ChevronRight size={18} color={COLORS.faint} />
      </View>

      <View style={styles.demarchFooter}>
        <Text style={styles.demarchFooterText}>
          {demarche.steps.length} étapes · {demarche.documents.length} documents
        </Text>
      </View>
    </Pressable>
  );
}

/* ============================================================================
 * MAIN PAGE
 * ========================================================================== */

interface JuridiquePageProps {
  onBack: () => void;
}

export default function JuridiquePage({ onBack }: JuridiquePageProps) {
  const [tab, setTab] = useState<TabId>("contrats");

  const [search, setSearch] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("Tout");

  const [selectedContract, setSelectedContract] =
    useState<ContractTemplate | null>(null);

  const [selectedDemarche, setSelectedDemarche] = useState<Demarche | null>(
    null,
  );

  const contractCategories = [
    "Tout",
    "Immobilier",
    "Freelance",
    "Emploi",
    "Commerce",
    "Finance",
    "Business",
  ];

  const demarcheCategories = [
    "Tout",
    "Entreprise",
    "Documents",
    "Immobilier",
    "Social",
  ];

  const normalizedSearch = normalizeSearch(search);

  const filteredContracts = useMemo(() => {
    return CONTRACTS.filter((contract) => {
      if (categoryFilter !== "Tout" && contract.category !== categoryFilter) {
        return false;
      }

      if (
        normalizedSearch &&
        !normalizeSearch(
          `${contract.title} ${contract.category} ${contract.description} ${contract.tags.join(
            " ",
          )}`,
        ).includes(normalizedSearch)
      ) {
        return false;
      }

      return true;
    });
  }, [categoryFilter, normalizedSearch]);

  const filteredDemarches = useMemo(() => {
    return DEMARCHES.filter((demarche) => {
      if (categoryFilter !== "Tout" && demarche.category !== categoryFilter) {
        return false;
      }

      if (
        normalizedSearch &&
        !normalizeSearch(
          `${demarche.title} ${demarche.category} ${demarche.description}`,
        ).includes(normalizedSearch)
      ) {
        return false;
      }

      return true;
    });
  }, [categoryFilter, normalizedSearch]);

  const tabs: Array<{
    id: TabId;
    label: string;
    icon: IconComponent;
    color: string;
  }> = [
    {
      id: "contrats",
      label: "Contrats",
      icon: FileText,
      color: COLORS.purple,
    },
    {
      id: "demarches",
      label: "Démarches",
      icon: BookOpen,
      color: COLORS.primary,
    },
    {
      id: "calculateurs",
      label: "Calculs",
      icon: Calculator,
      color: COLORS.green,
    },
    {
      id: "assistant",
      label: "Assistant",
      icon: MessageSquare,
      color: COLORS.pink,
    },
  ];

  const categories =
    tab === "contrats" ? contractCategories : demarcheCategories;

  const showSearch = tab === "contrats" || tab === "demarches";

  const handleTabChange = (nextTab: TabId) => {
    setTab(nextTab);
    setSearch("");
    setCategoryFilter("Tout");
  };

  return (
    <View style={styles.screen}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable
            onPress={onBack}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <ArrowLeft size={20} color={COLORS.white} />
          </Pressable>

          <View style={styles.headerIdentity}>
            <Text style={styles.headerTitle}>Juridique & Administration</Text>

            <Text style={styles.headerSubtitle}>
              Information · Préparation · Suivi
            </Text>
          </View>

          <View style={styles.institutionBadge}>
            <Scale size={14} color={COLORS.purple} />

            <Text style={styles.institutionBadgeText}>RDC</Text>
          </View>
        </View>

        {showSearch ? (
          <View style={styles.searchBox}>
            <Search size={17} color={COLORS.muted} />

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={
                tab === "contrats"
                  ? "Rechercher un contrat..."
                  : "Rechercher une démarche..."
              }
              placeholderTextColor={COLORS.faint}
              style={styles.searchInput}
              autoCorrect={false}
            />

            {search.length > 0 ? (
              <Pressable
                onPress={() => setSearch("")}
                style={styles.inputClear}
              >
                <X size={14} color={COLORS.muted} />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {showSearch ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categories}
          >
            {categories.map((category) => {
              const selected = categoryFilter === category;

              return (
                <Pressable
                  key={category}
                  onPress={() => setCategoryFilter(category)}
                  style={[styles.category, selected && styles.categorySelected]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selected && styles.categoryTextSelected,
                    ]}
                  >
                    {category}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {tabs.map(({ id, label, icon: Icon, color }) => {
            const selected = tab === id;

            return (
              <Pressable
                key={id}
                onPress={() => handleTabChange(id)}
                style={[
                  styles.tab,
                  selected && {
                    backgroundColor: `${color}16`,
                    borderColor: `${color}32`,
                  },
                ]}
              >
                <Icon size={15} color={selected ? color : COLORS.faint} />

                <Text
                  style={[
                    styles.tabText,
                    selected && {
                      color,
                    },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        {tab === "contrats" ? (
          <ScrollView
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.pageIntro}>
              <View>
                <Text style={styles.pageTitle}>Modèles de documents</Text>

                <Text style={styles.pageSubtitle}>
                  Préparez vos documents à partir de modèles structurés.
                </Text>
              </View>

              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {filteredContracts.length}
                </Text>
              </View>
            </View>

            <View style={styles.securityNotice}>
              <Shield size={16} color={COLORS.green} />

              <Text style={styles.securityNoticeText}>
                Les modèles sont des supports de préparation. Ils ne constituent
                pas une certification ou un avis juridique individualisé.
              </Text>
            </View>

            {filteredContracts.length === 0 ? (
              <EmptyState
                icon={Search}
                title="Aucun modèle trouvé"
                description="Aucun modèle ne correspond aux critères actuels."
                onClear={() => {
                  setSearch("");
                  setCategoryFilter("Tout");
                }}
              />
            ) : (
              <View style={styles.cards}>
                {filteredContracts.map((contract) => (
                  <ContractCard
                    key={contract.id}
                    template={contract}
                    onPress={() => setSelectedContract(contract)}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        ) : null}

        {tab === "demarches" ? (
          <ScrollView
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.pageIntro}>
              <View>
                <Text style={styles.pageTitle}>Démarches administratives</Text>

                <Text style={styles.pageSubtitle}>
                  Parcours de préparation et checklist personnelle.
                </Text>
              </View>

              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {filteredDemarches.length}
                </Text>
              </View>
            </View>

            <View style={styles.securityNotice}>
              <Info size={16} color={COLORS.cyan} />

              <Text style={styles.securityNoticeText}>
                Les procédures administratives peuvent évoluer. Vérifiez
                toujours les conditions actuelles auprès de l'administration
                compétente.
              </Text>
            </View>

            {filteredDemarches.length === 0 ? (
              <EmptyState
                icon={Search}
                title="Aucune démarche trouvée"
                description="Aucune démarche ne correspond aux critères actuels."
                onClear={() => {
                  setSearch("");
                  setCategoryFilter("Tout");
                }}
              />
            ) : (
              <View style={styles.cards}>
                {filteredDemarches.map((demarche) => (
                  <DemarcheCard
                    key={demarche.id}
                    demarche={demarche}
                    onPress={() => setSelectedDemarche(demarche)}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        ) : null}

        {tab === "calculateurs" ? (
          <ScrollView
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.pageIntro}>
              <View>
                <Text style={styles.pageTitle}>Calculateurs</Text>

                <Text style={styles.pageSubtitle}>
                  Outils de simulation pour préparer vos estimations.
                </Text>
              </View>
            </View>

            <Calculateurs />

            <View style={styles.institutionNotice}>
              <AlertTriangle size={16} color={COLORS.yellow} />

              <Text style={styles.institutionNoticeText}>
                Pour une situation réelle, les règles applicables doivent être
                vérifiées dans les textes officiels et, si nécessaire, auprès
                d'un professionnel compétent.
              </Text>
            </View>
          </ScrollView>
        ) : null}

        {tab === "assistant" ? <AIAssistantJuridique /> : null}
      </View>

      {selectedContract ? (
        <ContractDetail
          template={selectedContract}
          onClose={() => setSelectedContract(null)}
        />
      ) : null}

      {selectedDemarche ? (
        <DemarcheDetail
          demarche={selectedDemarche}
          onClose={() => setSelectedDemarche(null)}
        />
      ) : null}
    </View>
  );
}

/* ============================================================================
 * EMPTY STATE
 * ========================================================================== */

function EmptyState({
  icon: Icon,
  title,
  description,
  onClear,
}: {
  icon: IconComponent;
  title: string;
  description: string;
  onClear: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Icon size={27} color={COLORS.muted} />
      </View>

      <Text style={styles.emptyTitle}>{title}</Text>

      <Text style={styles.emptyDescription}>{description}</Text>

      <Pressable onPress={onClear} style={styles.secondaryButton}>
        <X size={15} color={COLORS.secondary} />

        <Text style={styles.secondaryButtonText}>Réinitialiser</Text>
      </Pressable>
    </View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  full: {
    flex: 1,
  },

  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: "rgba(5,8,18,0.98)",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  headerTop: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  headerIdentity: {
    flex: 1,
  },

  headerTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.35,
  },

  headerSubtitle: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 10.5,
    fontWeight: "600",
  },

  institutionBadge: {
    minHeight: 34,
    paddingHorizontal: 9,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(139,92,246,0.12)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.25)",
  },

  institutionBadgeText: {
    color: COLORS.purple,
    fontSize: 10,
    fontWeight: "900",
  },

  searchBox: {
    marginTop: 11,
    minHeight: 48,
    paddingHorizontal: 13,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.cardStrong,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  searchInput: {
    flex: 1,
    minHeight: 46,
    color: COLORS.text,
    fontSize: 13,
  },

  inputClear: {
    width: 29,
    height: 29,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  categories: {
    paddingTop: 9,
    paddingBottom: 3,
    gap: 6,
  },

  category: {
    minHeight: 32,
    paddingHorizontal: 11,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  categorySelected: {
    backgroundColor: "rgba(139,92,246,0.16)",
    borderColor: "rgba(139,92,246,0.32)",
  },

  categoryText: {
    color: COLORS.muted,
    fontSize: 10.5,
    fontWeight: "700",
  },

  categoryTextSelected: {
    color: COLORS.purple,
  },

  tabs: {
    paddingTop: 8,
    gap: 6,
  },

  tab: {
    minHeight: 46,
    paddingHorizontal: 13,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  tabText: {
    color: COLORS.faint,
    fontSize: 10.5,
    fontWeight: "800",
  },

  content: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 30,
  },

  pageIntro: {
    minHeight: 48,
    marginBottom: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  pageTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
  },

  pageSubtitle: {
    maxWidth: 310,
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 16,
  },

  countBadge: {
    minWidth: 33,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  countBadgeText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: "900",
  },

  securityNotice: {
    marginBottom: 12,
    padding: 13,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "rgba(16,185,129,0.07)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.16)",
  },

  securityNoticeText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 10.5,
    lineHeight: 16,
  },

  cards: {
    gap: 11,
  },

  contentCard: {
    padding: 15,
    borderRadius: 21,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  contentCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
  },

  contentIcon: {
    width: 47,
    height: 47,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  contentCardIdentity: {
    flex: 1,
  },

  titleLine: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },

  contentCardTitle: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "850",
  },

  contentCardMeta: {
    color: COLORS.faint,
    fontSize: 10,
    fontWeight: "600",
  },

  contentCardDescription: {
    marginTop: 6,
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
  },

  popularBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: "rgba(249,115,22,0.12)",
  },

  popularText: {
    color: "#FB923C",
    fontSize: 8.5,
    fontWeight: "900",
  },

  tagsRow: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  tag: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  tagText: {
    color: COLORS.faint,
    fontSize: 9,
    fontWeight: "650",
  },

  difficultyBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },

  difficultyText: {
    fontSize: 8.5,
    fontWeight: "850",
  },

  inlineMeta: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  demarchFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  demarchFooterText: {
    color: COLORS.faint,
    fontSize: 9.5,
    fontWeight: "650",
  },

  emptyState: {
    marginTop: 25,
    paddingHorizontal: 24,
    paddingVertical: 38,
    alignItems: "center",
    borderRadius: 22,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  emptyTitle: {
    marginTop: 14,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "850",
    textAlign: "center",
  },

  emptyDescription: {
    maxWidth: 320,
    marginTop: 7,
    color: COLORS.muted,
    fontSize: 11.5,
    lineHeight: 17,
    textAlign: "center",
  },

  secondaryButton: {
    marginTop: 17,
    minHeight: 42,
    paddingHorizontal: 15,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: COLORS.cardStrong,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  secondaryButtonText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: "800",
  },

  primaryButton: {
    minHeight: 52,
    marginTop: 8,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
  },

  primaryButtonSmall: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: COLORS.primary,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  disabledButton: {
    opacity: 0.38,
  },

  pressed: {
    opacity: 0.76,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  /* -------------------------------------------------------------------------
   * MODALS
   * ---------------------------------------------------------------------- */

  modalScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  modalHeader: {
    minHeight: 82,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.background2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  modalHeaderText: {
    flex: 1,
  },

  modalTitle: {
    color: COLORS.text,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
  },

  modalSubtitle: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 10,
  },

  modalContent: {
    padding: 16,
    paddingBottom: 35,
  },

  templateIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  institutionNotice: {
    marginBottom: 15,
    padding: 13,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "rgba(245,158,11,0.075)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.18)",
  },

  institutionNoticeText: {
    flex: 1,
    color: "#FDE68A",
    fontSize: 10.5,
    lineHeight: 16,
  },

  sectionHeading: {
    marginBottom: 10,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "850",
  },

  sectionSubtitle: {
    marginTop: 4,
    color: COLORS.faint,
    fontSize: 10,
  },

  formCard: {
    marginBottom: 10,
    padding: 13,
    borderRadius: 17,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  fieldLabel: {
    marginBottom: 8,
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: "750",
  },

  textInput: {
    minHeight: 45,
    paddingHorizontal: 12,
    borderRadius: 13,
    color: COLORS.text,
    fontSize: 12,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  pickerWrapper: {
    overflow: "hidden",
    minHeight: 47,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  picker: {
    color: COLORS.text,
  },

  generatedHeader: {
    marginBottom: 12,
    padding: 15,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(16,185,129,0.075)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.20)",
  },

  generatedTitle: {
    color: COLORS.green,
    fontSize: 14,
    fontWeight: "900",
  },

  generatedSubtitle: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 10,
  },

  documentPreview: {
    padding: 16,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  documentPreviewText: {
    color: COLORS.secondary,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 10.5,
    lineHeight: 17,
  },

  actionRow: {
    marginTop: 11,
    flexDirection: "row",
    gap: 9,
  },

  legalWarning: {
    marginTop: 12,
    padding: 13,
    borderRadius: 15,
    flexDirection: "row",
    gap: 9,
    backgroundColor: "rgba(245,158,11,0.07)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.15)",
  },

  legalWarningText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
  },

  detailDescription: {
    marginBottom: 14,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
  },

  progressCard: {
    marginBottom: 18,
    padding: 14,
    borderRadius: 17,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  progressLabel: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: "750",
  },

  progressValue: {
    fontSize: 12,
    fontWeight: "900",
  },

  progressTrack: {
    height: 7,
    marginTop: 10,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: COLORS.purple,
  },

  progressMeta: {
    marginTop: 7,
    color: COLORS.faint,
    fontSize: 9.5,
  },

  stepList: {
    marginTop: 10,
    gap: 9,
  },

  stepCard: {
    padding: 13,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  stepCardDone: {
    backgroundColor: "rgba(16,185,129,0.07)",
    borderColor: "rgba(16,185,129,0.18)",
  },

  stepNumber: {
    width: 31,
    height: 31,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  stepNumberDone: {
    backgroundColor: "rgba(16,185,129,0.16)",
  },

  stepNumberText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "900",
  },

  stepContent: {
    flex: 1,
  },

  stepTitle: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
  },

  stepTitleDone: {
    opacity: 0.6,
  },

  stepDescription: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 10.5,
    lineHeight: 16,
  },

  documentsCard: {
    marginTop: 18,
    padding: 14,
    borderRadius: 17,
    backgroundColor: "rgba(6,182,212,0.06)",
    borderWidth: 1,
    borderColor: "rgba(6,182,212,0.16)",
  },

  documentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 10,
  },

  documentsTitle: {
    color: COLORS.cyan,
    fontSize: 11,
    fontWeight: "850",
  },

  documentRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  documentBullet: {
    width: 5,
    height: 5,
    marginTop: 5,
    borderRadius: 3,
    backgroundColor: COLORS.cyan,
  },

  documentText: {
    flex: 1,
    color: COLORS.secondary,
    fontSize: 10.5,
    lineHeight: 16,
  },

  officialWarning: {
    marginTop: 12,
    padding: 13,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "rgba(6,182,212,0.055)",
    borderWidth: 1,
    borderColor: "rgba(6,182,212,0.14)",
  },

  officialWarningText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
  },

  completedCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(16,185,129,0.075)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.20)",
  },

  completedText: {
    flex: 1,
  },

  completedTitle: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: "850",
  },

  completedSubtitle: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 9.5,
    lineHeight: 15,
  },

  /* -------------------------------------------------------------------------
   * CALCULATORS
   * ---------------------------------------------------------------------- */

  calculators: {
    gap: 10,
  },

  calculatorNotice: {
    padding: 13,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "rgba(6,182,212,0.065)",
    borderWidth: 1,
    borderColor: "rgba(6,182,212,0.15)",
  },

  calculatorNoticeText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
  },

  calculatorCard: {
    overflow: "hidden",
    borderRadius: 19,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  calculatorHeader: {
    minHeight: 72,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  calculatorIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  calculatorIdentity: {
    flex: 1,
  },

  calculatorTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "850",
  },

  calculatorDescription: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
  },

  calculatorBody: {
    padding: 13,
    paddingTop: 0,
    gap: 10,
  },

  calculatorField: {
    gap: 7,
  },

  calculatorLabel: {
    color: COLORS.secondary,
    fontSize: 10.5,
    fontWeight: "700",
  },

  calculatorInputRow: {
    minHeight: 45,
    paddingHorizontal: 12,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  calculatorInput: {
    flex: 1,
    minHeight: 43,
    padding: 0,
    color: COLORS.text,
    fontSize: 12,
  },

  calculatorSuffix: {
    color: COLORS.faint,
    fontSize: 10,
    fontWeight: "700",
  },

  resultCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },

  resultLabel: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  resultFormula: {
    marginTop: 7,
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
  },

  resultValue: {
    marginTop: 8,
    fontSize: 23,
    fontWeight: "950",
  },

  resultLine: {
    marginTop: 10,
    paddingTop: 9,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
  },

  resultLineLabel: {
    color: COLORS.muted,
    fontSize: 10.5,
  },

  resultLineValue: {
    color: COLORS.secondary,
    fontSize: 10.5,
    fontWeight: "800",
  },

  resultLineLabelStrong: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: "800",
  },

  resultLineValueStrong: {
    fontSize: 13,
    fontWeight: "900",
  },

  /* -------------------------------------------------------------------------
   * ASSISTANT
   * ---------------------------------------------------------------------- */

  assistant: {
    flex: 1,
  },

  assistantHeader: {
    minHeight: 65,
    padding: 11,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "rgba(139,92,246,0.08)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.18)",
  },

  assistantIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.purple,
  },

  assistantHeaderText: {
    flex: 1,
  },

  assistantTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "850",
  },

  assistantSubtitle: {
    marginTop: 2,
    color: COLORS.muted,
    fontSize: 9.5,
  },

  assistantStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.green,
  },

  statusText: {
    color: COLORS.green,
    fontSize: 9,
    fontWeight: "750",
  },

  suggestionsScroll: {
    flexGrow: 0,
    marginTop: 8,
  },

  suggestionsContent: {
    gap: 6,
  },

  suggestion: {
    maxWidth: 270,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 11,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  suggestionText: {
    color: COLORS.secondary,
    fontSize: 9.5,
    lineHeight: 14,
  },

  conversation: {
    flex: 1,
    marginTop: 8,
  },

  conversationContent: {
    paddingBottom: 10,
    gap: 10,
  },

  messageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },

  userMessageRow: {
    flexDirection: "row-reverse",
  },

  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.70)",
  },

  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.09)",
  },

  botBubble: {
    maxWidth: "82%",
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 15,
    borderTopLeftRadius: 5,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  userBubble: {
    maxWidth: "82%",
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 15,
    borderTopRightRadius: 5,
    backgroundColor: "rgba(139,92,246,0.18)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.28)",
  },

  messageText: {
    color: COLORS.secondary,
    fontSize: 11,
    lineHeight: 17,
  },

  messageTime: {
    marginTop: 5,
    color: COLORS.faint,
    fontSize: 8.5,
  },

  requestStatus: {
    alignSelf: "flex-start",
    marginTop: 5,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(245,158,11,0.10)",
  },

  requestStatusText: {
    color: COLORS.yellow,
    fontSize: 8,
    fontWeight: "800",
  },

  typingBubble: {
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  typingText: {
    color: COLORS.muted,
    fontSize: 9.5,
  },

  assistantInputRow: {
    minHeight: 55,
    marginTop: 8,
    padding: 6,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    backgroundColor: COLORS.cardStrong,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  assistantInput: {
    flex: 1,
    maxHeight: 110,
    minHeight: 40,
    paddingHorizontal: 9,
    paddingVertical: 9,
    color: COLORS.text,
    fontSize: 11.5,
  },

  sendButton: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
  },

  sendButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  /* -------------------------------------------------------------------------
   * AUTH / LOADING
   * ---------------------------------------------------------------------- */

  authLoading: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    gap: 12,
  },

  loadingBarLarge: {
    width: "100%",
    height: 50,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  loadingBarSmall: {
    width: "55%",
    height: 30,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  assistantLoading: {
    flex: 1,
    gap: 12,
  },

  loadingConversation: {
    flex: 1,
    justifyContent: "center",
    gap: 12,
  },

  loadingBubble: {
    width: "75%",
    height: 60,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  loadingBubbleShort: {
    width: "55%",
    alignSelf: "flex-end",
  },

  unauthenticated: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  authIcon: {
    width: 78,
    height: 78,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.13)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.24)",
  },

  authTitle: {
    marginTop: 18,
    color: COLORS.text,
    fontSize: 19,
    fontWeight: "900",
  },

  authDescription: {
    maxWidth: 340,
    marginTop: 7,
    marginBottom: 22,
    color: COLORS.muted,
    fontSize: 11.5,
    lineHeight: 18,
    textAlign: "center",
  },
});
