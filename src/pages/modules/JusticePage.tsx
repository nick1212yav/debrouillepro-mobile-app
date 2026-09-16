import React, { useMemo, useState } from "react";

import {
  Alert,
  KeyboardAvoidingView,
  Linking,
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

import { useMutation, useQuery } from "convex/react";

import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  FileCheck2,
  FileText,
  Globe2,
  Gavel,
  Info,
  Landmark,
  Lock,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Scale,
  Search,
  Send,
  Shield,
  UserRound,
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
  indigo: "#4F46E5",
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

type JusticeTab =
  | "accueil"
  | "droits"
  | "lois"
  | "juridictions"
  | "aide"
  | "signalement"
  | "urgences"
  | "documents"
  | "dossiers";

/* ============================================================================
 * GLOBAL / COUNTRY DATA
 *
 * Important:
 * These are navigation categories, not claims about the law of a country.
 * Actual legal content must come from verified legal sources/backend.
 * ========================================================================== */

const JURISDICTIONS = [
  {
    id: "national",
    title: "Droit national",
    description:
      "Constitution, lois, règlements et procédures propres à un pays.",
    icon: Landmark,
    color: COLORS.primary,
  },
  {
    id: "regional",
    title: "Droit régional",
    description:
      "Cadres juridiques applicables à plusieurs États selon la région concernée.",
    icon: Globe2,
    color: COLORS.cyan,
  },
  {
    id: "international",
    title: "Droit international",
    description:
      "Traités, conventions et mécanismes internationaux applicables selon les cas.",
    icon: Globe2,
    color: COLORS.purple,
  },
  {
    id: "commercial",
    title: "Droit des affaires",
    description:
      "Sociétés, contrats commerciaux, commerce et obligations professionnelles.",
    icon: Briefcase,
    color: COLORS.green,
  },
  {
    id: "human-rights",
    title: "Droits humains",
    description:
      "Information générale sur les droits et mécanismes de protection.",
    icon: Shield,
    color: COLORS.pink,
  },
];

const JUSTICE_DOMAINS = [
  {
    id: "civil",
    title: "Droit civil",
    description:
      "Famille, responsabilité, contrats et relations entre personnes.",
    icon: Users,
    color: COLORS.primary,
  },
  {
    id: "criminal",
    title: "Droit pénal",
    description:
      "Infractions, procédures pénales et droits des personnes concernées.",
    icon: Gavel,
    color: COLORS.red,
  },
  {
    id: "labor",
    title: "Droit du travail",
    description:
      "Relations de travail, contrats, obligations et litiges professionnels.",
    icon: Briefcase,
    color: COLORS.green,
  },
  {
    id: "property",
    title: "Droit immobilier",
    description:
      "Propriété, occupation, contrats immobiliers et litiges fonciers.",
    icon: Building2,
    color: COLORS.yellow,
  },
  {
    id: "business",
    title: "Droit commercial",
    description:
      "Entreprises, commerce, contrats et activités professionnelles.",
    icon: Landmark,
    color: COLORS.cyan,
  },
  {
    id: "administrative",
    title: "Droit administratif",
    description:
      "Relations entre citoyens, entreprises et administrations publiques.",
    icon: Landmark,
    color: COLORS.purple,
  },
];

/*
 * Les exemples ci-dessous sont des catégories de recherche.
 * Aucun article ou règle nationale n'est inventé ici.
 */
const LEGAL_SOURCES = [
  {
    id: "constitution",
    title: "Constitution",
    description:
      "Rechercher la constitution officielle applicable au pays sélectionné.",
    icon: Landmark,
    color: COLORS.purple,
  },
  {
    id: "legislation",
    title: "Lois et règlements",
    description:
      "Rechercher des textes législatifs et réglementaires provenant de sources vérifiées.",
    icon: FileCheck2,
    color: COLORS.primary,
  },
  {
    id: "case-law",
    title: "Jurisprudence",
    description:
      "Accéder aux décisions judiciaires lorsqu'une source officielle ou vérifiée est disponible.",
    icon: Gavel,
    color: COLORS.red,
  },
  {
    id: "treaties",
    title: "Traités et conventions",
    description:
      "Rechercher les instruments internationaux et régionaux applicables.",
    icon: Globe2,
    color: COLORS.cyan,
  },
];

/* ============================================================================
 * DOCUMENT CATEGORIES
 * ========================================================================== */

const DOCUMENT_CATEGORIES = [
  {
    id: "contracts",
    title: "Contrats",
    description: "Préparer et consulter des modèles documentaires.",
    icon: FileText,
    color: COLORS.purple,
  },
  {
    id: "complaints",
    title: "Plaintes et requêtes",
    description:
      "Préparer des documents destinés à une autorité ou juridiction compétente.",
    icon: FileCheck2,
    color: COLORS.red,
  },
  {
    id: "administrative",
    title: "Documents administratifs",
    description: "Organiser les pièces nécessaires à une démarche.",
    icon: Landmark,
    color: COLORS.primary,
  },
  {
    id: "evidence",
    title: "Pièces et preuves",
    description: "Organiser les documents utiles à un dossier.",
    icon: Shield,
    color: COLORS.green,
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

/* ============================================================================
 * AUTH GATE
 * ========================================================================== */

function AuthGate({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthLoading>
        <View style={styles.authLoading}>
          <View style={styles.loadingLarge} />
          <View style={styles.loadingMedium} />
          <View style={styles.loadingSmall} />
        </View>
      </AuthLoading>

      <Unauthenticated>
        <View style={styles.authRequired}>
          <View style={styles.authIcon}>
            <Scale size={30} color="#FFFFFF" />
          </View>

          <Text style={styles.authTitle}>Espace Justice</Text>

          <Text style={styles.authDescription}>
            Connectez-vous pour accéder aux fonctionnalités personnelles de
            signalement et de suivi.
          </Text>

          <SignInButton />
        </View>
      </Unauthenticated>

      <Authenticated>{children}</Authenticated>
    </>
  );
}

/* ============================================================================
 * COUNTRY SELECTOR
 * ========================================================================== */

function CountrySelector({
  country,
  onChange,
}: {
  country: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.countryCard}>
      <View style={styles.countryIcon}>
        <Globe2 size={19} color={COLORS.cyan} />
      </View>

      <View style={styles.countryIdentity}>
        <Text style={styles.countryLabel}>Juridiction sélectionnée</Text>

        <Text style={styles.countryDescription}>
          Le pays détermine les sources juridiques et procédures à consulter.
        </Text>
      </View>

      <View style={styles.countryPicker}>
        <Picker
          selectedValue={country}
          onValueChange={onChange}
          style={styles.picker}
          dropdownIconColor={COLORS.muted}
        >
          <Picker.Item label="Choisir un pays" value="" />

          <Picker.Item label="République démocratique du Congo" value="CD" />

          <Picker.Item label="Afrique du Sud" value="ZA" />

          <Picker.Item label="Angola" value="AO" />

          <Picker.Item label="Cameroun" value="CM" />

          <Picker.Item label="Côte d'Ivoire" value="CI" />

          <Picker.Item label="France" value="FR" />

          <Picker.Item label="Belgique" value="BE" />

          <Picker.Item label="Canada" value="CA" />

          <Picker.Item label="Autre pays" value="OTHER" />
        </Picker>
      </View>
    </View>
  );
}

/* ============================================================================
 * HOME
 * ========================================================================== */

function JusticeHome({
  country,
  setCountry,
  onNavigate,
}: {
  country: string;
  setCountry: (value: string) => void;
  onNavigate: (tab: JusticeTab) => void;
}) {
  const actions = [
    {
      id: "droits" as const,
      title: "Connaître mes droits",
      description:
        "Rechercher des informations juridiques selon la juridiction.",
      icon: BookOpen,
      color: COLORS.primary,
    },
    {
      id: "lois" as const,
      title: "Rechercher la loi",
      description: "Accéder aux textes et sources juridiques disponibles.",
      icon: Gavel,
      color: COLORS.purple,
    },
    {
      id: "aide" as const,
      title: "Trouver de l'aide",
      description: "Comprendre les options d'assistance juridique.",
      icon: Users,
      color: COLORS.green,
    },
    {
      id: "signalement" as const,
      title: "Signaler un fait",
      description: "Créer et suivre un signalement dans votre espace.",
      icon: AlertTriangle,
      color: COLORS.red,
    },
  ];

  return (
    <ScrollView
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Scale size={25} color="#FFFFFF" />
        </View>

        <View style={styles.heroIdentity}>
          <Text style={styles.heroTitle}>Justice</Text>

          <Text style={styles.heroSubtitle}>
            Comprendre · Préparer · Être orienté
          </Text>
        </View>
      </View>

      <View style={styles.heroNotice}>
        <Shield size={17} color={COLORS.green} />

        <Text style={styles.heroNoticeText}>
          Une plateforme mondiale d'information et d'orientation juridique. Les
          règles applicables dépendent du pays, de la juridiction et de la
          situation.
        </Text>
      </View>

      <CountrySelector country={country} onChange={setCountry} />

      {!country ? (
        <View style={styles.countryRequired}>
          <Info size={16} color={COLORS.yellow} />

          <Text style={styles.countryRequiredText}>
            Sélectionnez d'abord un pays pour distinguer les informations
            générales des informations propres à une juridiction.
          </Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Que recherchez-vous ?</Text>

      <View style={styles.actionGrid}>
        {actions.map(({ id, title, description, icon: Icon, color }) => (
          <Pressable
            key={id}
            onPress={() => onNavigate(id)}
            style={({ pressed }) => [
              styles.actionCard,
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.actionIcon,
                {
                  backgroundColor: `${color}16`,
                  borderColor: `${color}28`,
                },
              ]}
            >
              <Icon size={19} color={color} />
            </View>

            <Text style={styles.actionTitle}>{title}</Text>

            <Text style={styles.actionDescription}>{description}</Text>

            <ChevronRight size={16} color={COLORS.faint} />
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Domaines de justice</Text>

      <View style={styles.cards}>
        {JUSTICE_DOMAINS.map(({ title, description, icon: Icon, color }) => (
          <View key={title} style={styles.domainCard}>
            <View
              style={[
                styles.domainIcon,
                {
                  backgroundColor: `${color}14`,
                },
              ]}
            >
              <Icon size={18} color={color} />
            </View>

            <View style={styles.domainIdentity}>
              <Text style={styles.domainTitle}>{title}</Text>

              <Text style={styles.domainDescription}>{description}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.trustCard}>
        <Lock size={16} color={COLORS.cyan} />

        <View style={styles.trustIdentity}>
          <Text style={styles.trustTitle}>Principe de fiabilité</Text>

          <Text style={styles.trustText}>
            Une information juridique doit être rattachée à une juridiction, une
            source et, lorsque disponible, une date de publication ou d'entrée
            en vigueur.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

/* ============================================================================
 * RIGHTS
 * ========================================================================== */

function RightsTab({ country }: { country: string }) {
  const [search, setSearch] = useState("");

  const normalized = normalizeSearch(search);

  const filtered = JUSTICE_DOMAINS.filter((item) =>
    normalizeSearch(`${item.title} ${item.description}`).includes(normalized),
  );

  return (
    <ScrollView
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <SectionIntro
        title="Mes droits"
        description={
          country
            ? "Explorez les domaines juridiques liés à la juridiction sélectionnée."
            : "Sélectionnez un pays avant de rechercher une règle nationale."
        }
      />

      <View style={styles.searchBox}>
        <Search size={16} color={COLORS.muted} />

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher un domaine..."
          placeholderTextColor={COLORS.faint}
          style={styles.searchInput}
        />

        {search ? (
          <Pressable onPress={() => setSearch("")}>
            <X size={15} color={COLORS.muted} />
          </Pressable>
        ) : null}
      </View>

      {country ? (
        <View style={styles.sourceNotice}>
          <Globe2 size={15} color={COLORS.cyan} />

          <Text style={styles.sourceNoticeText}>
            Juridiction active : {country}. Les textes précis doivent provenir
            d'une source juridique vérifiée.
          </Text>
        </View>
      ) : null}

      <View style={styles.cards}>
        {filtered.map(({ title, description, icon: Icon, color }) => (
          <Pressable
            key={title}
            style={({ pressed }) => [
              styles.largeCard,
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.largeIcon,
                {
                  backgroundColor: `${color}15`,
                  borderColor: `${color}25`,
                },
              ]}
            >
              <Icon size={19} color={color} />
            </View>

            <View style={styles.largeIdentity}>
              <Text style={styles.largeTitle}>{title}</Text>

              <Text style={styles.largeDescription}>{description}</Text>

              <View style={styles.unavailableBadge}>
                <Info size={11} color={COLORS.faint} />

                <Text style={styles.unavailableText}>
                  Source juridique à consulter
                </Text>
              </View>
            </View>

            <ChevronRight size={17} color={COLORS.faint} />
          </Pressable>
        ))}
      </View>

      <InstitutionalPlaceholder
        icon={BookOpen}
        title="Base des droits"
        description="Cette section est prête à recevoir une base juridique vérifiée par pays, juridiction, langue, source, date et référence. Aucun article de loi n'est inventé dans l'application."
      />
    </ScrollView>
  );
}

/* ============================================================================
 * LAWS
 * ========================================================================== */

function LawsTab({ country }: { country: string }) {
  const [search, setSearch] = useState("");

  const filtered = LEGAL_SOURCES.filter((source) =>
    normalizeSearch(`${source.title} ${source.description}`).includes(
      normalizeSearch(search),
    ),
  );

  return (
    <ScrollView
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <SectionIntro
        title="Bibliothèque juridique"
        description="Textes, jurisprudence et instruments juridiques organisés par juridiction."
      />

      <View style={styles.searchBox}>
        <Search size={16} color={COLORS.muted} />

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher une source..."
          placeholderTextColor={COLORS.faint}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.legalSourceBanner}>
        <Globe2 size={18} color={COLORS.cyan} />

        <View style={styles.legalSourceBannerIdentity}>
          <Text style={styles.legalSourceBannerTitle}>
            {country
              ? `Juridiction : ${country}`
              : "Juridiction non sélectionnée"}
          </Text>

          <Text style={styles.legalSourceBannerText}>
            Les textes doivent être synchronisés depuis des sources officielles
            ou juridiquement vérifiées.
          </Text>
        </View>
      </View>

      <View style={styles.cards}>
        {filtered.map(({ id, title, description, icon: Icon, color }) => (
          <Pressable
            key={id}
            style={({ pressed }) => [
              styles.largeCard,
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.largeIcon,
                {
                  backgroundColor: `${color}15`,
                },
              ]}
            >
              <Icon size={19} color={color} />
            </View>

            <View style={styles.largeIdentity}>
              <Text style={styles.largeTitle}>{title}</Text>

              <Text style={styles.largeDescription}>{description}</Text>
            </View>

            <ChevronRight size={17} color={COLORS.faint} />
          </Pressable>
        ))}
      </View>

      <InstitutionalPlaceholder
        icon={Gavel}
        title="Recherche juridique"
        description="Le moteur est volontairement sans faux résultats. Pour la production, chaque résultat devra conserver sa source, son identifiant, sa juridiction, sa date et son statut de validité."
      />
    </ScrollView>
  );
}

/* ============================================================================
 * JURISDICTIONS
 * ========================================================================== */

function JurisdictionsTab({
  country,
  setCountry,
}: {
  country: string;
  setCountry: (value: string) => void;
}) {
  return (
    <ScrollView
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <SectionIntro
        title="Juridictions"
        description="Le droit applicable dépend du territoire et du type de juridiction."
      />

      <CountrySelector country={country} onChange={setCountry} />

      <Text style={styles.sectionTitle}>Architecture juridique</Text>

      <View style={styles.cards}>
        {JURISDICTIONS.map(({ id, title, description, icon: Icon, color }) => (
          <View key={id} style={styles.largeCard}>
            <View
              style={[
                styles.largeIcon,
                {
                  backgroundColor: `${color}15`,
                },
              ]}
            >
              <Icon size={20} color={color} />
            </View>

            <View style={styles.largeIdentity}>
              <Text style={styles.largeTitle}>{title}</Text>

              <Text style={styles.largeDescription}>{description}</Text>
            </View>
          </View>
        ))}
      </View>

      <InstitutionalPlaceholder
        icon={Landmark}
        title="Annuaire des juridictions"
        description="Tribunaux, cours, autorités administratives, organismes indépendants et mécanismes régionaux doivent être fournis par une source vérifiée pour chaque pays."
      />
    </ScrollView>
  );
}

/* ============================================================================
 * LEGAL AID
 * ========================================================================== */

function LegalAidTab({ country }: { country: string }) {
  const options = [
    {
      title: "Avocat",
      description:
        "Assistance et représentation par un professionnel habilité selon les règles locales.",
      icon: Scale,
      color: COLORS.purple,
    },
    {
      title: "Aide juridictionnelle",
      description:
        "Mécanismes publics ou institutionnels d'accès à la justice lorsqu'ils existent.",
      icon: Shield,
      color: COLORS.green,
    },
    {
      title: "Médiation",
      description:
        "Mécanismes amiables lorsqu'ils sont disponibles et appropriés.",
      icon: Users,
      color: COLORS.cyan,
    },
    {
      title: "Association / ONG",
      description:
        "Organisations d'assistance juridique et de défense des droits.",
      icon: Building2,
      color: COLORS.yellow,
    },
    {
      title: "Clinique juridique",
      description:
        "Structures pouvant fournir de l'information ou une assistance selon leur mandat.",
      icon: BookOpen,
      color: COLORS.primary,
    },
  ];

  return (
    <ScrollView
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <SectionIntro
        title="Aide juridique"
        description="Comprendre les voies d'assistance disponibles sans inventer de professionnels ou de coordonnées."
      />

      {country ? (
        <View style={styles.sourceNotice}>
          <Globe2 size={15} color={COLORS.cyan} />

          <Text style={styles.sourceNoticeText}>
            Recherche préparée pour la juridiction {country}.
          </Text>
        </View>
      ) : (
        <View style={styles.countryRequired}>
          <Info size={16} color={COLORS.yellow} />

          <Text style={styles.countryRequiredText}>
            Sélectionnez un pays afin de rechercher des services d'aide
            juridique adaptés.
          </Text>
        </View>
      )}

      <View style={styles.cards}>
        {options.map(({ title, description, icon: Icon, color }) => (
          <Pressable
            key={title}
            style={({ pressed }) => [
              styles.largeCard,
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.largeIcon,
                {
                  backgroundColor: `${color}15`,
                },
              ]}
            >
              <Icon size={19} color={color} />
            </View>

            <View style={styles.largeIdentity}>
              <Text style={styles.largeTitle}>{title}</Text>

              <Text style={styles.largeDescription}>{description}</Text>
            </View>

            <ChevronRight size={17} color={COLORS.faint} />
          </Pressable>
        ))}
      </View>

      <InstitutionalPlaceholder
        icon={Users}
        title="Annuaire juridique vérifié"
        description="Aucun avocat ou organisme n'est affiché sans données vérifiées. La production devra gérer identité professionnelle, pays, juridiction, domaine, statut, coordonnées et date de vérification."
      />
    </ScrollView>
  );
}

/* ============================================================================
 * REPORTS — REAL CONVEX BACKEND
 * ========================================================================== */

function SignalementTab() {
  const reports = useQuery(api.civic.listMyJusticeReports, {});

  const createReport = useMutation(api.civic.createJusticeReport);

  const [showForm, setShowForm] = useState(false);

  const [reportType, setReportType] = useState("");

  const [reportDescription, setReportDescription] = useState("");

  const [reportLocation, setReportLocation] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    reportType.trim().length > 0 &&
    reportDescription.trim().length >= 10 &&
    !submitting;

  const submit = async () => {
    if (!canSubmit) {
      return;
    }

    setSubmitting(true);

    try {
      await createReport({
        type: reportType.trim(),
        description: reportDescription.trim(),
        location: reportLocation.trim() || undefined,
      });

      setShowForm(false);
      setReportType("");
      setReportDescription("");
      setReportLocation("");

      Alert.alert(
        "Signalement enregistré",
        "Votre signalement a été enregistré dans votre espace.",
      );
    } catch (error) {
      Alert.alert(
        "Erreur",
        error instanceof Error
          ? error.message
          : "Le signalement n'a pas pu être enregistré.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <SectionIntro
        title="Signalements"
        description="Créer et suivre vos signalements depuis votre espace personnel."
      />

      <View style={styles.reportNotice}>
        <Shield size={17} color={COLORS.green} />

        <Text style={styles.reportNoticeText}>
          Un signalement dans l'application ne remplace pas une plainte ou une
          démarche auprès de l'autorité compétente lorsque celle-ci est
          nécessaire.
        </Text>
      </View>

      <Pressable
        onPress={() => setShowForm(true)}
        style={({ pressed }) => [
          styles.newReportButton,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.newReportIcon}>
          <Plus size={19} color={COLORS.red} />
        </View>

        <View style={styles.newReportIdentity}>
          <Text style={styles.newReportTitle}>Nouveau signalement</Text>

          <Text style={styles.newReportDescription}>
            Décrire un fait nécessitant une orientation ou un suivi.
          </Text>
        </View>

        <ChevronRight size={17} color={COLORS.faint} />
      </Pressable>

      <Text style={styles.sectionTitle}>Mes signalements</Text>

      {reports === undefined ? (
        <View style={styles.loadingStack}>
          <View style={styles.loadingReport} />
          <View style={styles.loadingReport} />
          <View style={styles.loadingReport} />
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.emptyState}>
          <FileText size={30} color={COLORS.faint} />

          <Text style={styles.emptyTitle}>Aucun signalement</Text>

          <Text style={styles.emptyDescription}>
            Votre espace ne contient encore aucun signalement.
          </Text>
        </View>
      ) : (
        <View style={styles.cards}>
          {reports.map((report) => (
            <View key={report._id} style={styles.reportCard}>
              <View style={styles.reportIcon}>
                <AlertTriangle size={17} color={COLORS.red} />
              </View>

              <View style={styles.reportIdentity}>
                <View style={styles.reportTitleRow}>
                  <Text style={styles.reportTitle}>{report.type}</Text>

                  <View
                    style={[
                      styles.statusBadge,
                      report.status === "Résolu" && styles.statusResolved,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        report.status === "Résolu" && styles.statusResolvedText,
                      ]}
                    >
                      {report.status}
                    </Text>
                  </View>
                </View>

                {report.location ? (
                  <View style={styles.locationRow}>
                    <MapPin size={11} color={COLORS.faint} />

                    <Text style={styles.locationText}>{report.location}</Text>
                  </View>
                ) : null}

                <Text style={styles.reportDescription}>
                  {report.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <Modal
        visible={showForm}
        animationType="slide"
        onRequestClose={() => setShowForm(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalScreen}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalHeader}>
            <Pressable
              onPress={() => setShowForm(false)}
              style={styles.iconButton}
            >
              <ArrowLeft size={20} color={COLORS.white} />
            </Pressable>

            <View style={styles.modalHeaderIdentity}>
              <Text style={styles.modalTitle}>Nouveau signalement</Text>

              <Text style={styles.modalSubtitle}>
                Décrivez les faits avec précision
              </Text>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.institutionNotice}>
              <AlertTriangle size={16} color={COLORS.yellow} />

              <Text style={styles.institutionNoticeText}>
                Ne communiquez pas de mots de passe, codes secrets ou autres
                informations d'authentification.
              </Text>
            </View>

            <Text style={styles.fieldLabel}>Nature du signalement *</Text>

            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={reportType}
                onValueChange={(value) => setReportType(String(value))}
                style={styles.picker}
                dropdownIconColor={COLORS.muted}
              >
                <Picker.Item label="Sélectionner..." value="" />

                <Picker.Item label="Corruption" value="Corruption" />

                <Picker.Item
                  label="Abus ou comportement illégal"
                  value="Abus ou comportement illégal"
                />

                <Picker.Item label="Fraude" value="Fraude" />

                <Picker.Item label="Discrimination" value="Discrimination" />

                <Picker.Item label="Violence" value="Violence" />

                <Picker.Item label="Autre" value="Autre" />
              </Picker>
            </View>

            <Text style={styles.fieldLabel}>Localisation</Text>

            <TextInput
              value={reportLocation}
              onChangeText={setReportLocation}
              placeholder="Pays, ville ou lieu..."
              placeholderTextColor={COLORS.faint}
              style={styles.textInput}
            />

            <Text style={styles.fieldLabel}>Description des faits *</Text>

            <TextInput
              value={reportDescription}
              onChangeText={setReportDescription}
              placeholder="Décrivez les faits, dates, circonstances et éléments utiles..."
              placeholderTextColor={COLORS.faint}
              multiline
              textAlignVertical="top"
              maxLength={10000}
              style={styles.descriptionInput}
            />

            <Text style={styles.characterCount}>
              {reportDescription.length}
              /10 000
            </Text>

            <Pressable
              disabled={!canSubmit}
              onPress={submit}
              style={[
                styles.primaryButton,
                !canSubmit && styles.disabledButton,
              ]}
            >
              <Send size={17} color="#FFFFFF" />

              <Text style={styles.primaryButtonText}>
                {submitting
                  ? "Enregistrement..."
                  : "Enregistrer le signalement"}
              </Text>
            </Pressable>

            <Pressable
              disabled={submitting}
              onPress={() => setShowForm(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

/* ============================================================================
 * EMERGENCIES
 *
 * No hardcoded global emergency numbers.
 * Numbers vary by country and service and must be verified.
 * ========================================================================== */

function EmergenciesTab({ country }: { country: string }) {
  const callCountryService = async () => {
    if (!country) {
      Alert.alert(
        "Pays requis",
        "Sélectionnez votre pays afin d'utiliser les informations d'urgence appropriées.",
      );
      return;
    }

    Alert.alert(
      "Numéros d'urgence",
      "Les numéros d'urgence ne sont pas affichés sans source vérifiée pour le pays sélectionné.",
    );
  };

  return (
    <ScrollView
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <SectionIntro
        title="Urgences"
        description="Orientation vers les services d'urgence et mécanismes de protection."
      />

      <View style={styles.emergencyWarning}>
        <AlertTriangle size={19} color={COLORS.red} />

        <Text style={styles.emergencyWarningText}>
          En cas de danger immédiat, utilisez les services d'urgence officiels
          de votre pays. Les numéros ne sont pas universels.
        </Text>
      </View>

      <View style={styles.countryCard}>
        <View style={styles.countryIcon}>
          <Globe2 size={19} color={COLORS.cyan} />
        </View>

        <View style={styles.countryIdentity}>
          <Text style={styles.countryLabel}>Pays</Text>

          <Text style={styles.countryDescription}>
            {country
              ? `Juridiction sélectionnée : ${country}`
              : "Aucun pays sélectionné"}
          </Text>
        </View>
      </View>

      <View style={styles.cards}>
        {[
          {
            title: "Police",
            description:
              "Services chargés de la sécurité publique selon le pays.",
            icon: Shield,
            color: COLORS.primary,
          },
          {
            title: "Services médicaux",
            description: "Urgence médicale et assistance sanitaire.",
            icon: Phone,
            color: COLORS.red,
          },
          {
            title: "Protection civile",
            description:
              "Services d'intervention et de secours selon la juridiction.",
            icon: AlertTriangle,
            color: COLORS.yellow,
          },
          {
            title: "Protection juridique",
            description:
              "Mécanismes d'aide et de protection des personnes vulnérables lorsqu'ils existent.",
            icon: Scale,
            color: COLORS.purple,
          },
        ].map(({ title, description, icon: Icon, color }) => (
          <View key={title} style={styles.largeCard}>
            <View
              style={[
                styles.largeIcon,
                {
                  backgroundColor: `${color}15`,
                },
              ]}
            >
              <Icon size={19} color={color} />
            </View>

            <View style={styles.largeIdentity}>
              <Text style={styles.largeTitle}>{title}</Text>

              <Text style={styles.largeDescription}>{description}</Text>
            </View>
          </View>
        ))}
      </View>

      <Pressable
        onPress={callCountryService}
        style={styles.verifyEmergencyButton}
      >
        <Phone size={17} color="#FFFFFF" />

        <Text style={styles.primaryButtonText}>
          Vérifier les services officiels
        </Text>
      </Pressable>

      <InstitutionalPlaceholder
        icon={Phone}
        title="Annuaire d'urgence mondial"
        description="La version production devra récupérer les numéros depuis des sources officielles ou vérifiées par pays, avec date de vérification et service concerné."
      />
    </ScrollView>
  );
}

/* ============================================================================
 * DOCUMENTS
 * ========================================================================== */

function DocumentsTab() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <ScrollView
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <SectionIntro
        title="Documents juridiques"
        description="Organiser les documents utiles à une démarche ou à un dossier."
      />

      <View style={styles.documentSecurity}>
        <Lock size={17} color={COLORS.green} />

        <Text style={styles.documentSecurityText}>
          Les documents sensibles doivent être protégés et ne doivent être
          partagés qu'avec les personnes ou autorités appropriées.
        </Text>
      </View>

      <View style={styles.cards}>
        {DOCUMENT_CATEGORIES.map(
          ({ id, title, description, icon: Icon, color }) => {
            const opened = selected === id;

            return (
              <Pressable
                key={id}
                onPress={() => setSelected(opened ? null : id)}
                style={styles.largeCard}
              >
                <View
                  style={[
                    styles.largeIcon,
                    {
                      backgroundColor: `${color}15`,
                    },
                  ]}
                >
                  <Icon size={19} color={color} />
                </View>

                <View style={styles.largeIdentity}>
                  <Text style={styles.largeTitle}>{title}</Text>

                  <Text style={styles.largeDescription}>{description}</Text>

                  {opened ? (
                    <View style={styles.expandedInfo}>
                      <Info size={13} color={COLORS.cyan} />

                      <Text style={styles.expandedInfoText}>
                        Cette catégorie est prête à accueillir les
                        fonctionnalités documentaires réelles du backend.
                      </Text>
                    </View>
                  ) : null}
                </View>

                {opened ? (
                  <ChevronUp size={17} color={COLORS.faint} />
                ) : (
                  <ChevronDown size={17} color={COLORS.faint} />
                )}
              </Pressable>
            );
          },
        )}
      </View>

      <InstitutionalPlaceholder
        icon={FileText}
        title="Gestion documentaire"
        description="La production pourra ajouter coffre documentaire, métadonnées, versions, signatures, partage contrôlé et journal d'accès lorsque les contrats backend correspondants seront disponibles."
      />
    </ScrollView>
  );
}

/* ============================================================================
 * PERSONAL CASES
 * ========================================================================== */

function DossiersTab() {
  return (
    <ScrollView
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <SectionIntro
        title="Mes dossiers"
        description="Espace personnel destiné au suivi des affaires et démarches juridiques."
      />

      <View style={styles.casePrivacy}>
        <Lock size={17} color={COLORS.purple} />

        <View style={styles.casePrivacyIdentity}>
          <Text style={styles.casePrivacyTitle}>Espace confidentiel</Text>

          <Text style={styles.casePrivacyText}>
            Les dossiers juridiques peuvent contenir des informations
            extrêmement sensibles. Aucun dossier fictif n'est affiché.
          </Text>
        </View>
      </View>

      <View style={styles.emptyStateLarge}>
        <FileCheck2 size={34} color={COLORS.faint} />

        <Text style={styles.emptyTitle}>Aucun dossier disponible</Text>

        <Text style={styles.emptyDescription}>
          Le backend actuel exposé dans cette page ne fournit pas encore de
          liste de dossiers judiciaires personnels.
        </Text>
      </View>

      <View style={styles.futureArchitecture}>
        <Text style={styles.futureArchitectureTitle}>Architecture prévue</Text>

        {[
          "Identifiant du dossier",
          "Juridiction",
          "Type d'affaire",
          "Parties concernées",
          "Statut procédural",
          "Échéances",
          "Documents",
          "Audiences",
          "Historique",
          "Journal des accès",
        ].map((item) => (
          <View key={item} style={styles.futureRow}>
            <CheckCircle2 size={13} color={COLORS.faint} />

            <Text style={styles.futureRowText}>{item}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

/* ============================================================================
 * SHARED UI
 * ========================================================================== */

function SectionIntro({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View style={styles.sectionIntro}>
      <Text style={styles.pageTitle}>{title}</Text>

      <Text style={styles.pageDescription}>{description}</Text>
    </View>
  );
}

function InstitutionalPlaceholder({
  icon: Icon,
  title,
  description,
}: {
  icon: IconComponent;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.placeholder}>
      <View style={styles.placeholderIcon}>
        <Icon size={20} color={COLORS.cyan} />
      </View>

      <Text style={styles.placeholderTitle}>{title}</Text>

      <Text style={styles.placeholderDescription}>{description}</Text>
    </View>
  );
}

/* ============================================================================
 * MAIN
 * ========================================================================== */

export default function JusticePage({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<JusticeTab>("accueil");

  const [country, setCountry] = useState("");

  const tabs: Array<{
    id: JusticeTab;
    label: string;
    icon: IconComponent;
    color: string;
  }> = [
    {
      id: "accueil",
      label: "Accueil",
      icon: Scale,
      color: COLORS.purple,
    },
    {
      id: "droits",
      label: "Droits",
      icon: BookOpen,
      color: COLORS.primary,
    },
    {
      id: "lois",
      label: "Lois",
      icon: Gavel,
      color: COLORS.cyan,
    },
    {
      id: "juridictions",
      label: "Juridictions",
      icon: Landmark,
      color: COLORS.yellow,
    },
    {
      id: "aide",
      label: "Aide",
      icon: Users,
      color: COLORS.green,
    },
    {
      id: "signalement",
      label: "Signalement",
      icon: AlertTriangle,
      color: COLORS.red,
    },
    {
      id: "urgences",
      label: "Urgences",
      icon: Phone,
      color: COLORS.red,
    },
    {
      id: "documents",
      label: "Documents",
      icon: FileText,
      color: COLORS.purple,
    },
    {
      id: "dossiers",
      label: "Dossiers",
      icon: FileCheck2,
      color: COLORS.indigo,
    },
  ];

  return (
    <View style={styles.screen}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={onBack} style={styles.iconButton}>
            <ArrowLeft size={20} color={COLORS.white} />
          </Pressable>

          <View style={styles.headerIdentity}>
            <Text style={styles.headerTitle}>Justice</Text>

            <Text style={styles.headerSubtitle}>
              Droit · Protection · Accès à la justice
            </Text>
          </View>

          <View style={styles.globalBadge}>
            <Globe2 size={14} color={COLORS.cyan} />

            <Text style={styles.globalBadgeText}>GLOBAL</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {tabs.map(({ id, label, icon: Icon, color }) => {
            const selected = activeTab === id;

            return (
              <Pressable
                key={id}
                onPress={() => setActiveTab(id)}
                style={[
                  styles.tab,
                  selected && {
                    backgroundColor: `${color}16`,
                    borderColor: `${color}32`,
                  },
                ]}
              >
                <Icon size={14} color={selected ? color : COLORS.faint} />

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
        {activeTab === "accueil" ? (
          <JusticeHome
            country={country}
            setCountry={setCountry}
            onNavigate={setActiveTab}
          />
        ) : null}

        {activeTab === "droits" ? <RightsTab country={country} /> : null}

        {activeTab === "lois" ? <LawsTab country={country} /> : null}

        {activeTab === "juridictions" ? (
          <JurisdictionsTab country={country} setCountry={setCountry} />
        ) : null}

        {activeTab === "aide" ? <LegalAidTab country={country} /> : null}

        {activeTab === "signalement" ? (
          <AuthGate>
            <SignalementTab />
          </AuthGate>
        ) : null}

        {activeTab === "urgences" ? <EmergenciesTab country={country} /> : null}

        {activeTab === "documents" ? <DocumentsTab /> : null}

        {activeTab === "dossiers" ? (
          <AuthGate>
            <DossiersTab />
          </AuthGate>
        ) : null}
      </View>
    </View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    flex: 1,
  },

  header: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 9,
    backgroundColor: COLORS.background2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  headerTop: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.cardStrong,
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
    letterSpacing: -0.4,
  },

  headerSubtitle: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "600",
  },

  globalBadge: {
    minHeight: 32,
    paddingHorizontal: 9,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(6,182,212,0.09)",
    borderWidth: 1,
    borderColor: "rgba(6,182,212,0.18)",
  },

  globalBadgeText: {
    color: COLORS.cyan,
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  tabs: {
    paddingTop: 9,
    gap: 6,
  },

  tab: {
    minHeight: 40,
    paddingHorizontal: 11,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  tabText: {
    color: COLORS.faint,
    fontSize: 9.5,
    fontWeight: "800",
  },

  contentContainer: {
    paddingHorizontal: 15,
    paddingTop: 14,
    paddingBottom: 35,
  },

  hero: {
    padding: 17,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(139,92,246,0.10)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.20)",
  },

  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.purple,
  },

  heroIdentity: {
    flex: 1,
  },

  heroTitle: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: "950",
  },

  heroSubtitle: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 10.5,
  },

  heroNotice: {
    marginTop: 10,
    padding: 13,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(16,185,129,0.065)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.15)",
  },

  heroNoticeText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 10.5,
    lineHeight: 16,
  },

  countryCard: {
    marginTop: 11,
    padding: 12,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  countryIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(6,182,212,0.10)",
  },

  countryIdentity: {
    flex: 1,
  },

  countryLabel: {
    color: COLORS.secondary,
    fontSize: 10.5,
    fontWeight: "850",
  },

  countryDescription: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 9.5,
    lineHeight: 14,
  },

  countryPicker: {
    width: 150,
    overflow: "hidden",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  picker: {
    color: COLORS.text,
  },

  countryRequired: {
    marginTop: 10,
    padding: 12,
    borderRadius: 15,
    flexDirection: "row",
    gap: 8,
    backgroundColor: "rgba(245,158,11,0.065)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.16)",
  },

  countryRequiredText: {
    flex: 1,
    color: "#FDE68A",
    fontSize: 10,
    lineHeight: 15,
  },

  sectionTitle: {
    marginTop: 18,
    marginBottom: 9,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
  },

  actionGrid: {
    gap: 9,
  },

  actionCard: {
    minHeight: 86,
    padding: 13,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  actionIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  actionTitle: {
    flex: 1,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "850",
  },

  actionDescription: {
    flex: 2,
    color: COLORS.muted,
    fontSize: 9.5,
    lineHeight: 14,
  },

  cards: {
    gap: 9,
  },

  domainCard: {
    padding: 13,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  domainIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  domainIdentity: {
    flex: 1,
  },

  domainTitle: {
    color: COLORS.text,
    fontSize: 11.5,
    fontWeight: "850",
  },

  domainDescription: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 9.5,
    lineHeight: 14,
  },

  trustCard: {
    marginTop: 12,
    padding: 13,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "rgba(6,182,212,0.06)",
    borderWidth: 1,
    borderColor: "rgba(6,182,212,0.15)",
  },

  trustIdentity: {
    flex: 1,
  },

  trustTitle: {
    color: COLORS.cyan,
    fontSize: 11,
    fontWeight: "850",
  },

  trustText: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 9.5,
    lineHeight: 15,
  },

  sectionIntro: {
    marginBottom: 13,
  },

  pageTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
  },

  pageDescription: {
    marginTop: 5,
    color: COLORS.muted,
    fontSize: 10.5,
    lineHeight: 16,
  },

  searchBox: {
    minHeight: 47,
    paddingHorizontal: 12,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.cardStrong,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  searchInput: {
    flex: 1,
    minHeight: 44,
    color: COLORS.text,
    fontSize: 11.5,
  },

  sourceNotice: {
    marginTop: 9,
    padding: 12,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(6,182,212,0.055)",
    borderWidth: 1,
    borderColor: "rgba(6,182,212,0.14)",
  },

  sourceNoticeText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 9.5,
    lineHeight: 15,
  },

  largeCard: {
    padding: 13,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  largeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  largeIdentity: {
    flex: 1,
  },

  largeTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "850",
  },

  largeDescription: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
  },

  unavailableBadge: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  unavailableText: {
    color: COLORS.faint,
    fontSize: 8.5,
    fontWeight: "650",
  },

  legalSourceBanner: {
    marginTop: 11,
    padding: 14,
    borderRadius: 18,
    flexDirection: "row",
    gap: 10,
    backgroundColor: "rgba(37,99,235,0.07)",
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.16)",
  },

  legalSourceBannerIdentity: {
    flex: 1,
  },

  legalSourceBannerTitle: {
    color: COLORS.text,
    fontSize: 11.5,
    fontWeight: "850",
  },

  legalSourceBannerText: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 9.5,
    lineHeight: 15,
  },

  placeholder: {
    marginTop: 12,
    padding: 17,
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  placeholderIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(6,182,212,0.08)",
  },

  placeholderTitle: {
    marginTop: 10,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "850",
    textAlign: "center",
  },

  placeholderDescription: {
    maxWidth: 340,
    marginTop: 5,
    color: COLORS.muted,
    fontSize: 9.5,
    lineHeight: 15,
    textAlign: "center",
  },

  reportNotice: {
    padding: 13,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(16,185,129,0.065)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.15)",
  },

  reportNoticeText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
  },

  newReportButton: {
    marginTop: 11,
    padding: 13,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.20)",
  },

  newReportIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.12)",
  },

  newReportIdentity: {
    flex: 1,
  },

  newReportTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "850",
  },

  newReportDescription: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 9.5,
    lineHeight: 14,
  },

  loadingStack: {
    gap: 9,
  },

  loadingReport: {
    height: 82,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  reportCard: {
    padding: 13,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  reportIcon: {
    width: 41,
    height: 41,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.12)",
  },

  reportIdentity: {
    flex: 1,
  },

  reportTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  reportTitle: {
    flex: 1,
    color: COLORS.text,
    fontSize: 11.5,
    fontWeight: "850",
  },

  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(245,158,11,0.12)",
  },

  statusResolved: {
    backgroundColor: "rgba(16,185,129,0.12)",
  },

  statusText: {
    color: COLORS.yellow,
    fontSize: 8,
    fontWeight: "850",
  },

  statusResolvedText: {
    color: COLORS.green,
  },

  locationRow: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  locationText: {
    color: COLORS.faint,
    fontSize: 9,
  },

  reportDescription: {
    marginTop: 5,
    color: COLORS.muted,
    fontSize: 9.5,
    lineHeight: 15,
  },

  emergencyWarning: {
    padding: 14,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "rgba(239,68,68,0.075)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.18)",
  },

  emergencyWarningText: {
    flex: 1,
    color: "#FCA5A5",
    fontSize: 10.5,
    lineHeight: 16,
  },

  verifyEmergencyButton: {
    minHeight: 50,
    marginTop: 12,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.red,
  },

  documentSecurity: {
    padding: 13,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "rgba(16,185,129,0.065)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.15)",
  },

  documentSecurityText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
  },

  expandedInfo: {
    marginTop: 9,
    padding: 9,
    borderRadius: 11,
    flexDirection: "row",
    gap: 7,
    backgroundColor: "rgba(6,182,212,0.055)",
  },

  expandedInfoText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 9,
    lineHeight: 14,
  },

  casePrivacy: {
    padding: 14,
    borderRadius: 18,
    flexDirection: "row",
    gap: 9,
    backgroundColor: "rgba(139,92,246,0.07)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.16)",
  },

  casePrivacyIdentity: {
    flex: 1,
  },

  casePrivacyTitle: {
    color: COLORS.purple,
    fontSize: 11.5,
    fontWeight: "850",
  },

  casePrivacyText: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 9.5,
    lineHeight: 15,
  },

  emptyState: {
    marginTop: 10,
    padding: 30,
    alignItems: "center",
    borderRadius: 19,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  emptyStateLarge: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  emptyTitle: {
    marginTop: 10,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "850",
    textAlign: "center",
  },

  emptyDescription: {
    maxWidth: 320,
    marginTop: 5,
    color: COLORS.muted,
    fontSize: 9.5,
    lineHeight: 15,
    textAlign: "center",
  },

  futureArchitecture: {
    marginTop: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  futureArchitectureTitle: {
    color: COLORS.secondary,
    fontSize: 11.5,
    fontWeight: "850",
  },

  futureRow: {
    marginTop: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  futureRowText: {
    color: COLORS.muted,
    fontSize: 9.5,
  },

  /* -------------------------------------------------------------------------
   * MODAL
   * ---------------------------------------------------------------------- */

  modalScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  modalHeader: {
    minHeight: 80,
    paddingHorizontal: 15,
    paddingTop: 11,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: COLORS.background2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  modalHeaderIdentity: {
    flex: 1,
  },

  modalTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
  },

  modalSubtitle: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 9.5,
  },

  modalContent: {
    padding: 16,
    paddingBottom: 35,
  },

  institutionNotice: {
    marginBottom: 15,
    padding: 13,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(245,158,11,0.065)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.16)",
  },

  institutionNoticeText: {
    flex: 1,
    color: "#FDE68A",
    fontSize: 10,
    lineHeight: 15,
  },

  fieldLabel: {
    marginTop: 12,
    marginBottom: 7,
    color: COLORS.secondary,
    fontSize: 10.5,
    fontWeight: "800",
  },

  pickerWrapper: {
    overflow: "hidden",
    minHeight: 47,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  textInput: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderRadius: 13,
    color: COLORS.text,
    fontSize: 11.5,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  descriptionInput: {
    minHeight: 190,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 15,
    color: COLORS.text,
    fontSize: 11.5,
    lineHeight: 18,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  characterCount: {
    marginTop: 5,
    color: COLORS.faint,
    fontSize: 8.5,
    textAlign: "right",
  },

  primaryButton: {
    minHeight: 51,
    marginTop: 17,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  disabledButton: {
    opacity: 0.4,
  },

  cancelButton: {
    minHeight: 45,
    marginTop: 8,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.cardStrong,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  cancelButtonText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: "800",
  },

  /* -------------------------------------------------------------------------
   * AUTH / LOADING
   * ---------------------------------------------------------------------- */

  authLoading: {
    flex: 1,
    padding: 18,
    justifyContent: "center",
    gap: 11,
  },

  loadingLarge: {
    width: "100%",
    height: 58,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  loadingMedium: {
    width: "72%",
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  loadingSmall: {
    width: "48%",
    height: 32,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  authRequired: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  authIcon: {
    width: 76,
    height: 76,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.13)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.24)",
  },

  authTitle: {
    marginTop: 17,
    color: COLORS.text,
    fontSize: 19,
    fontWeight: "900",
  },

  authDescription: {
    maxWidth: 340,
    marginTop: 7,
    marginBottom: 21,
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },

  pressed: {
    opacity: 0.75,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },
});
