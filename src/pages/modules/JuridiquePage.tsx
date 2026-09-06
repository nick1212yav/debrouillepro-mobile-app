// src/pages/modules/JuridiquePage.tsx

import { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Download,
  FileText,
  Gavel,
  Info,
  Scale,
  ShieldCheck,
  X,
} from "lucide-react-native";

interface JuridiquePageProps {
  onBack?: () => void;
}

type IconComponent = typeof FileText;

type ContractField = {
  id: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "date" | "number" | "select";
  options?: string[];
};

type ContractTemplate = {
  id: string;
  title: string;
  category: string;
  pages: number;
  description: string;
  tags: string[];
  color: string;
  icon: IconComponent;
  fields: ContractField[];
};

type DemarcheStep = {
  title: string;
  description: string;
};

type Demarche = {
  id: string;
  title: string;
  description: string;
  difficulty: "Facile" | "Moyen" | "Complexe";
  duration: string;
  icon: IconComponent;
  color: string;
  steps: DemarcheStep[];
  documents: string[];
};

const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    id: "bail",
    title: "Contrat de bail",
    category: "Immobilier",
    pages: 4,
    description:
      "Créez un modèle de contrat de location avec les principales informations du bailleur et du locataire.",
    tags: ["location", "bail", "logement"],
    color: "#8B5CF6",
    icon: FileText,
    fields: [
      {
        id: "bailleur",
        label: "Nom du bailleur",
        placeholder: "Nom complet",
        required: true,
      },
      {
        id: "locataire",
        label: "Nom du locataire",
        placeholder: "Nom complet",
        required: true,
      },
      {
        id: "adresse",
        label: "Adresse du logement",
        placeholder: "Adresse complète",
        required: true,
      },
      {
        id: "loyer",
        label: "Montant du loyer",
        placeholder: "Ex. 500",
        type: "number",
        required: true,
      },
      {
        id: "duree",
        label: "Durée",
        type: "select",
        options: ["6 mois", "1 an", "2 ans", "3 ans"],
        required: true,
      },
    ],
  },
  {
    id: "travail",
    title: "Contrat de travail",
    category: "Emploi",
    pages: 5,
    description:
      "Préparez les éléments essentiels d'un contrat de travail avant validation par un professionnel.",
    tags: ["emploi", "travail", "salarié"],
    color: "#3B82F6",
    icon: Scale,
    fields: [
      {
        id: "employeur",
        label: "Nom de l'employeur",
        placeholder: "Entreprise ou personne",
        required: true,
      },
      {
        id: "employe",
        label: "Nom de l'employé",
        placeholder: "Nom complet",
        required: true,
      },
      {
        id: "poste",
        label: "Poste occupé",
        placeholder: "Ex. Comptable",
        required: true,
      },
      {
        id: "salaire",
        label: "Salaire mensuel",
        placeholder: "Montant",
        type: "number",
        required: true,
      },
      {
        id: "typeContrat",
        label: "Type de contrat",
        type: "select",
        options: ["CDD", "CDI", "Stage", "Freelance"],
        required: true,
      },
    ],
  },
  {
    id: "prestation",
    title: "Contrat de prestation",
    category: "Services",
    pages: 3,
    description: "Formalisez une prestation entre un client et un prestataire.",
    tags: ["service", "client", "prestation"],
    color: "#10B981",
    icon: Gavel,
    fields: [
      {
        id: "prestataire",
        label: "Nom du prestataire",
        placeholder: "Nom complet",
        required: true,
      },
      {
        id: "client",
        label: "Nom du client",
        placeholder: "Nom complet",
        required: true,
      },
      {
        id: "service",
        label: "Description du service",
        placeholder: "Décrivez la prestation",
        required: true,
      },
      {
        id: "montant",
        label: "Montant convenu",
        placeholder: "Montant",
        type: "number",
        required: true,
      },
    ],
  },
];

const DEMARCHES: Demarche[] = [
  {
    id: "creation-entreprise",
    title: "Créer une entreprise",
    description:
      "Les principales étapes à suivre pour préparer votre projet de création d'entreprise.",
    difficulty: "Moyen",
    duration: "2 à 5 jours",
    icon: Gavel,
    color: "#8B5CF6",
    steps: [
      {
        title: "Définir votre activité",
        description: "Déterminez clairement les produits ou services proposés.",
      },
      {
        title: "Choisir la forme juridique",
        description: "Sélectionnez la structure adaptée à votre projet.",
      },
      {
        title: "Préparer les documents",
        description: "Rassemblez les informations et pièces nécessaires.",
      },
      {
        title: "Effectuer les démarches",
        description: "Déposez votre dossier auprès des autorités compétentes.",
      },
    ],
    documents: [
      "Pièce d'identité",
      "Informations sur les associés",
      "Adresse du siège",
      "Statuts ou documents constitutifs",
    ],
  },
  {
    id: "litige",
    title: "Préparer un dossier de litige",
    description:
      "Organisez les éléments utiles avant de consulter un professionnel du droit.",
    difficulty: "Complexe",
    duration: "Variable",
    icon: Scale,
    color: "#EF4444",
    steps: [
      {
        title: "Identifier le problème",
        description:
          "Résumez clairement les faits et les personnes concernées.",
      },
      {
        title: "Rassembler les preuves",
        description:
          "Conservez documents, messages, factures et autres éléments utiles.",
      },
      {
        title: "Organiser la chronologie",
        description: "Classez les événements dans leur ordre chronologique.",
      },
      {
        title: "Consulter un professionnel",
        description:
          "Présentez votre dossier à un avocat ou autre professionnel compétent.",
      },
    ],
    documents: [
      "Contrats",
      "Messages et correspondances",
      "Factures",
      "Pièces d'identité",
      "Autres preuves disponibles",
    ],
  },
  {
    id: "administrative",
    title: "Préparer une démarche administrative",
    description:
      "Organisez vos documents avant une démarche auprès d'une administration.",
    difficulty: "Facile",
    duration: "1 à 2 jours",
    icon: FileText,
    color: "#10B981",
    steps: [
      {
        title: "Identifier la procédure",
        description: "Déterminez précisément la démarche concernée.",
      },
      {
        title: "Vérifier les conditions",
        description: "Assurez-vous de remplir les conditions demandées.",
      },
      {
        title: "Préparer les documents",
        description: "Rassemblez les pièces nécessaires.",
      },
      {
        title: "Déposer la demande",
        description: "Présentez votre dossier auprès du service compétent.",
      },
    ],
    documents: [
      "Pièce d'identité",
      "Justificatifs demandés",
      "Formulaires administratifs",
    ],
  },
];

function DifficultyColor(difficulty: Demarche["difficulty"]): string {
  switch (difficulty) {
    case "Facile":
      return "#10B981";

    case "Moyen":
      return "#F59E0B";

    case "Complexe":
      return "#EF4444";

    default:
      return "#8B5CF6";
  }
}

function ContractEditor({
  template,
  onClose,
}: {
  template: ContractTemplate;
  onClose: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [generated, setGenerated] = useState(false);
  const [showSelect, setShowSelect] = useState<string | null>(null);

  const isValid = useMemo(() => {
    return template.fields
      .filter((field) => field.required)
      .every((field) => values[field.id]?.trim());
  }, [template.fields, values]);

  const generatedDocument = useMemo(() => {
    return `
${template.title.toUpperCase()}

Document préparé le ${new Date().toLocaleDateString("fr-FR")}.

${template.fields
  .map((field) => {
    const value = values[field.id] || "Non renseigné";
    return `${field.label} : ${value}`;
  })
  .join("\n")}

DISPOSITIONS IMPORTANTES

Les parties déclarent avoir fourni les informations nécessaires à la préparation du présent document.

Ce modèle est fourni à titre indicatif et doit être vérifié, adapté et validé par un professionnel du droit compétent avant toute signature ou utilisation officielle.

[Document généré par Débrouille Pro – À faire valider par un notaire ou avocat]
`.trim();
  }, [template, values]);

  const handleGenerate = () => {
    if (!isValid) {
      Alert.alert(
        "Informations manquantes",
        "Veuillez remplir tous les champs obligatoires avant de générer le document.",
      );
      return;
    }

    setGenerated(true);
  };

  const handleCopy = () => {
    Alert.alert(
      "Document prêt",
      "Le contenu est prêt à être copié ou exporté depuis l'application.",
    );
  };

  const handleDownload = () => {
    Alert.alert(
      "Exportation",
      "La génération du fichier PDF ou DOCX peut être connectée au service d'exportation natif de votre application.",
    );
  };

  return (
    <View style={styles.modalPage}>
      <View style={styles.detailHeader}>
        <Pressable
          onPress={onClose}
          style={styles.iconButton}
          accessibilityLabel="Retour"
        >
          <ArrowLeft color="#FFFFFF" size={20} />
        </Pressable>

        <View style={styles.detailHeaderContent}>
          <Text style={styles.detailTitle}>{template.title}</Text>

          <Text style={styles.detailSubtitle}>
            {template.pages} pages · {template.category}
          </Text>
        </View>

        <View
          style={[
            styles.templateIcon,
            {
              backgroundColor: `${template.color}22`,
              borderColor: `${template.color}55`,
            },
          ]}
        >
          <template.icon color={template.color} size={20} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.detailScrollContent}
      >
        <Text style={styles.description}>{template.description}</Text>

        <View style={styles.tagsRow}>
          {template.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>

        <View style={styles.warningCard}>
          <Info color="#FBBF24" size={17} />

          <Text style={styles.warningText}>
            Ce modèle est fourni à titre indicatif. Faites valider tout contrat
            important par un notaire ou un avocat agréé.
          </Text>
        </View>

        {!generated &&
          template.fields.map((field) => (
            <View key={field.id} style={styles.fieldCard}>
              <Text style={styles.fieldLabel}>
                {field.label}

                {field.required && <Text style={styles.required}> *</Text>}
              </Text>

              {field.type === "select" ? (
                <>
                  <Pressable
                    onPress={() =>
                      setShowSelect(showSelect === field.id ? null : field.id)
                    }
                    style={styles.selectButton}
                  >
                    <Text
                      style={[
                        styles.selectText,
                        !values[field.id] && styles.placeholderText,
                      ]}
                    >
                      {values[field.id] || "Choisir..."}
                    </Text>

                    <ChevronDown color="#94A3B8" size={18} />
                  </Pressable>

                  {showSelect === field.id && (
                    <View style={styles.selectOptions}>
                      {field.options?.map((option) => (
                        <Pressable
                          key={option}
                          onPress={() => {
                            setValues((current) => ({
                              ...current,
                              [field.id]: option,
                            }));

                            setShowSelect(null);
                          }}
                          style={styles.selectOption}
                        >
                          <Text style={styles.selectOptionText}>{option}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <TextInput
                  value={values[field.id] ?? ""}
                  onChangeText={(text) =>
                    setValues((current) => ({
                      ...current,
                      [field.id]: text,
                    }))
                  }
                  placeholder={field.placeholder}
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  keyboardType={field.type === "number" ? "numeric" : "default"}
                  style={styles.input}
                />
              )}
            </View>
          ))}

        {generated && (
          <View style={styles.generatedCard}>
            <View style={styles.generatedHeader}>
              <View>
                <Text style={styles.generatedTitle}>Contrat généré !</Text>

                <Text style={styles.generatedSubtitle}>
                  Vérifiez le document avant toute utilisation.
                </Text>
              </View>

              <Pressable onPress={handleCopy} style={styles.copyButton}>
                <Copy color="#10B981" size={15} />

                <Text style={styles.copyText}>Copier</Text>
              </Pressable>
            </View>

            <Text selectable style={styles.generatedDocument}>
              {generatedDocument}
            </Text>
          </View>
        )}

        {generated ? (
          <View style={styles.generatedActions}>
            <Pressable
              onPress={() => setGenerated(false)}
              style={styles.secondaryAction}
            >
              <X color="rgba(255,255,255,0.75)" size={17} />

              <Text style={styles.secondaryActionText}>Modifier</Text>
            </Pressable>

            <Pressable onPress={handleDownload} style={styles.primaryAction}>
              <Download color="#FFFFFF" size={17} />

              <Text style={styles.primaryActionText}>Télécharger</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            disabled={!isValid}
            onPress={handleGenerate}
            style={[
              styles.generateButton,
              {
                backgroundColor: isValid
                  ? template.color
                  : "rgba(255,255,255,0.08)",
              },
            ]}
          >
            <FileText color="#FFFFFF" size={19} />

            <Text
              style={[
                styles.generateButtonText,
                !isValid && styles.disabledButtonText,
              ]}
            >
              Générer le contrat
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

function DemarcheViewer({
  demarche,
  onClose,
}: {
  demarche: Demarche;
  onClose: () => void;
}) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const progress = Math.round(
    (completedSteps.length / demarche.steps.length) * 100,
  );

  const difficultyColor = DifficultyColor(demarche.difficulty);

  const toggleStep = (index: number) => {
    setCompletedSteps((current) =>
      current.includes(index)
        ? current.filter((step) => step !== index)
        : [...current, index],
    );
  };

  return (
    <View style={styles.modalPage}>
      <View style={styles.detailHeader}>
        <Pressable
          onPress={onClose}
          style={styles.iconButton}
          accessibilityLabel="Retour"
        >
          <ArrowLeft color="#FFFFFF" size={20} />
        </Pressable>

        <View style={styles.detailHeaderContent}>
          <Text style={styles.detailTitle}>{demarche.title}</Text>

          <View style={styles.metaRow}>
            <View
              style={[
                styles.difficultyBadge,
                {
                  backgroundColor: `${difficultyColor}22`,
                },
              ]}
            >
              <Text
                style={[
                  styles.difficultyText,
                  {
                    color: difficultyColor,
                  },
                ]}
              >
                {demarche.difficulty}
              </Text>
            </View>

            <Clock color="rgba(255,255,255,0.4)" size={13} />

            <Text style={styles.metaText}>{demarche.duration}</Text>
          </View>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progression</Text>

          <Text
            style={[
              styles.progressValue,
              {
                color: progress === 100 ? "#10B981" : "#8B5CF6",
              },
            ]}
          >
            {completedSteps.length}/{demarche.steps.length} étapes
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${progress}%`,
              },
            ]}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.detailScrollContent}
      >
        <Text style={styles.description}>{demarche.description}</Text>

        <Text style={styles.sectionLabel}>ÉTAPES À SUIVRE</Text>

        {demarche.steps.map((step, index) => {
          const completed = completedSteps.includes(index);

          return (
            <Pressable
              key={`${step.title}-${index}`}
              onPress={() => toggleStep(index)}
              style={[styles.stepCard, completed && styles.stepCardCompleted]}
            >
              <View
                style={[
                  styles.stepNumber,
                  completed && styles.stepNumberCompleted,
                ]}
              >
                {completed ? (
                  <Check color="#10B981" size={16} />
                ) : (
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                )}
              </View>

              <View style={styles.stepContent}>
                <Text
                  style={[
                    styles.stepTitle,
                    completed && styles.stepTitleCompleted,
                  ]}
                >
                  {step.title}
                </Text>

                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            </Pressable>
          );
        })}

        <View style={styles.documentsCard}>
          <Text style={styles.documentsTitle}>DOCUMENTS REQUIS</Text>

          {demarche.documents.map((document) => (
            <View key={document} style={styles.documentRow}>
              <FileText color="#60A5FA" size={15} />

              <Text style={styles.documentText}>{document}</Text>
            </View>
          ))}
        </View>

        {progress === 100 && (
          <View style={styles.completedCard}>
            <CheckCircle2 color="#10B981" size={25} />

            <Text style={styles.completedTitle}>Démarche complétée !</Text>

            <Text style={styles.completedText}>
              Toutes les étapes ont été réalisées.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export default function JuridiquePage({ onBack }: JuridiquePageProps) {
  const [selectedTemplate, setSelectedTemplate] =
    useState<ContractTemplate | null>(null);

  const [selectedDemarche, setSelectedDemarche] = useState<Demarche | null>(
    null,
  );

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            style={styles.iconButton}
            accessibilityLabel="Retour"
          >
            <ArrowLeft color="#FFFFFF" size={20} />
          </Pressable>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.pageTitle}>Juridique</Text>

            <Text style={styles.pageSubtitle}>
              Outils, modèles et démarches pratiques
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Scale color="#8B5CF6" size={21} />
          </View>
        </View>

        <View style={styles.infoCard}>
          <ShieldCheck color="#A78BFA" size={22} />

          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Assistant juridique pratique</Text>

            <Text style={styles.infoText}>
              Préparez vos documents et organisez vos démarches. Les contenus
              proposés restent informatifs et ne remplacent pas un conseil
              juridique professionnel.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>MODÈLES DE DOCUMENTS</Text>

        <View style={styles.cardsContainer}>
          {CONTRACT_TEMPLATES.map((template) => {
            const Icon = template.icon;

            return (
              <Pressable
                key={template.id}
                onPress={() => setSelectedTemplate(template)}
                style={styles.card}
              >
                <View
                  style={[
                    styles.cardIcon,
                    {
                      backgroundColor: `${template.color}22`,
                    },
                  ]}
                >
                  <Icon color={template.color} size={21} />
                </View>

                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{template.title}</Text>

                  <Text style={styles.cardDescription}>
                    {template.description}
                  </Text>

                  <Text style={styles.cardMeta}>
                    {template.pages} pages · {template.category}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>DÉMARCHES GUIDÉES</Text>

        <View style={styles.cardsContainer}>
          {DEMARCHES.map((demarche) => {
            const Icon = demarche.icon;
            const difficultyColor = DifficultyColor(demarche.difficulty);

            return (
              <Pressable
                key={demarche.id}
                onPress={() => setSelectedDemarche(demarche)}
                style={styles.card}
              >
                <View
                  style={[
                    styles.cardIcon,
                    {
                      backgroundColor: `${demarche.color}22`,
                    },
                  ]}
                >
                  <Icon color={demarche.color} size={21} />
                </View>

                <View style={styles.cardContent}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>{demarche.title}</Text>

                    <View
                      style={[
                        styles.smallDifficultyBadge,
                        {
                          backgroundColor: `${difficultyColor}22`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.smallDifficultyText,
                          {
                            color: difficultyColor,
                          },
                        ]}
                      >
                        {demarche.difficulty}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.cardDescription}>
                    {demarche.description}
                  </Text>

                  <View style={styles.cardMetaRow}>
                    <Clock color="rgba(255,255,255,0.35)" size={12} />

                    <Text style={styles.cardMeta}>{demarche.duration}</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.legalNotice}>
          <Info color="#FBBF24" size={17} />

          <Text style={styles.legalNoticeText}>
            Débrouille Pro fournit des outils d'information et de préparation.
            Pour toute décision juridique importante, consultez un professionnel
            qualifié.
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={selectedTemplate !== null}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setSelectedTemplate(null)}
      >
        {selectedTemplate && (
          <ContractEditor
            template={selectedTemplate}
            onClose={() => setSelectedTemplate(null)}
          />
        )}
      </Modal>

      <Modal
        visible={selectedDemarche !== null}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setSelectedDemarche(null)}
      >
        {selectedDemarche && (
          <DemarcheViewer
            demarche={selectedDemarche}
            onClose={() => setSelectedDemarche(null)}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },

  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },

  pageTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
  },

  pageSubtitle: {
    marginTop: 3,
    color: "rgba(255,255,255,0.42)",
    fontSize: 12,
  },

  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.15)",
  },

  infoCard: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    marginBottom: 24,
    borderRadius: 20,
    backgroundColor: "rgba(139,92,246,0.09)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.2)",
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 5,
  },

  infoText: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 12,
    lineHeight: 18,
  },

  sectionTitle: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
  },

  cardsContainer: {
    gap: 10,
    marginBottom: 26,
  },

  card: {
    flexDirection: "row",
    padding: 15,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  cardContent: {
    flex: 1,
  },

  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 5,
  },

  cardTitle: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  cardDescription: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },

  cardMeta: {
    color: "rgba(255,255,255,0.32)",
    fontSize: 11,
  },

  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  smallDifficultyBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },

  smallDifficultyText: {
    fontSize: 9,
    fontWeight: "800",
  },

  legalNotice: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(245,158,11,0.08)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.18)",
  },

  legalNoticeText: {
    flex: 1,
    color: "rgba(253,230,138,0.75)",
    fontSize: 11,
    lineHeight: 17,
  },

  modalPage: {
    flex: 1,
    backgroundColor: "#020617",
    paddingTop: 54,
  },

  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 18,
  },

  detailHeaderContent: {
    flex: 1,
    marginLeft: 12,
  },

  detailTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  detailSubtitle: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 11,
    marginTop: 4,
  },

  templateIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  detailScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 12,
  },

  description: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    lineHeight: 20,
  },

  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 6,
  },

  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  tagText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
  },

  warningCard: {
    flexDirection: "row",
    gap: 10,
    padding: 13,
    borderRadius: 18,
    backgroundColor: "rgba(245,158,11,0.1)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
    marginVertical: 4,
  },

  warningText: {
    flex: 1,
    color: "rgba(253,230,138,0.75)",
    fontSize: 11,
    lineHeight: 17,
  },

  fieldCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  fieldLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginBottom: 9,
  },

  required: {
    color: "#F87171",
  },

  input: {
    color: "#FFFFFF",
    fontSize: 14,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },

  selectButton: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },

  selectText: {
    color: "#FFFFFF",
    fontSize: 14,
  },

  placeholderText: {
    color: "rgba(255,255,255,0.25)",
  },

  selectOptions: {
    marginTop: 8,
    overflow: "hidden",
    borderRadius: 14,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  selectOption: {
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  selectOptionText: {
    color: "#FFFFFF",
    fontSize: 13,
  },

  generateButton: {
    minHeight: 54,
    marginTop: 6,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  generateButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  disabledButtonText: {
    color: "rgba(255,255,255,0.3)",
  },

  generatedCard: {
    padding: 15,
    borderRadius: 20,
    backgroundColor: "rgba(16,185,129,0.07)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.22)",
  },

  generatedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  generatedTitle: {
    color: "#4ADE80",
    fontSize: 15,
    fontWeight: "800",
  },

  generatedSubtitle: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 10,
    marginTop: 3,
  },

  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(16,185,129,0.15)",
  },

  copyText: {
    color: "#10B981",
    fontSize: 11,
    fontWeight: "800",
  },

  generatedDocument: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 11,
    lineHeight: 18,
  },

  generatedActions: {
    flexDirection: "row",
    gap: 10,
  },

  secondaryAction: {
    flex: 1,
    minHeight: 50,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  secondaryActionText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "800",
  },

  primaryAction: {
    flex: 1,
    minHeight: 50,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#7C3AED",
  },

  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 6,
  },

  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },

  difficultyText: {
    fontSize: 10,
    fontWeight: "800",
  },

  metaText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
  },

  progressContainer: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  progressLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
  },

  progressValue: {
    fontSize: 11,
    fontWeight: "800",
  },

  progressTrack: {
    height: 8,
    borderRadius: 99,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  progressBar: {
    height: "100%",
    borderRadius: 99,
    backgroundColor: "#8B5CF6",
  },

  sectionLabel: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 4,
  },

  stepCard: {
    flexDirection: "row",
    gap: 12,
    padding: 13,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  stepCardCompleted: {
    backgroundColor: "rgba(16,185,129,0.08)",
    borderColor: "rgba(16,185,129,0.2)",
  },

  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  stepNumberCompleted: {
    backgroundColor: "rgba(16,185,129,0.2)",
  },

  stepNumberText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "900",
  },

  stepContent: {
    flex: 1,
  },

  stepTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 4,
  },

  stepTitleCompleted: {
    color: "rgba(255,255,255,0.45)",
    textDecorationLine: "line-through",
  },

  stepDescription: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 11,
    lineHeight: 17,
  },

  documentsCard: {
    padding: 15,
    borderRadius: 20,
    backgroundColor: "rgba(59,130,246,0.08)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.2)",
    marginTop: 5,
  },

  documentsTitle: {
    color: "#60A5FA",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  documentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 9,
  },

  documentText: {
    flex: 1,
    color: "rgba(255,255,255,0.62)",
    fontSize: 12,
  },

  completedCard: {
    alignItems: "center",
    padding: 20,
    borderRadius: 20,
    backgroundColor: "rgba(16,185,129,0.12)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)",
  },

  completedTitle: {
    color: "#4ADE80",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 9,
  },

  completedText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    marginTop: 5,
  },
});
