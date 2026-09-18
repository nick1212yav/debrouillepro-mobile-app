// src/pages/home/page.tsx

import { Pressable, View, Text, Platform, StyleSheet } from "react-native";
import { useState, lazy, Suspense, useEffect, type ReactElement } from "react";
import PageTransition from "@/components/PageTransition.tsx";
import { Sparkles } from "lucide-react-native";
import { useMutation, useQuery } from "convex/react";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";

import Stories from "./_components/Stories.tsx";
import SmartSearch from "./_components/SmartSearch.tsx";
import PersonalizedFeed from "./_components/PersonalizedFeed.tsx";
import OfflineBanner from "./_components/OfflineBanner.tsx";
import LandingPage from "./_components/LandingPage.tsx";
import TabBar from "./_components/TabBar.tsx";
import SideDrawer from "./_components/SideDrawer.tsx";
import CreateBottomSheet from "./_components/CreateBottomSheet.tsx";
import AIAssistant from "./_components/AIAssistant.tsx";
import AIFloatingButton from "@/components/ui/ai-floating-button.tsx";

import OnboardingScreen, {
  hasCompletedOnboarding,
} from "./_components/OnboardingScreen.tsx";

import OnboardingFlow from "./_components/OnboardingFlow.tsx";
import AdvancedSearch from "./_components/AdvancedSearch.tsx";
import PullToRefresh from "./_components/PullToRefresh.tsx";
import NotificationCenter from "./_components/NotificationCenter.tsx";

import { useBadges } from "@/hooks/use-badges.ts";
import CommandPalette from "@/components/CommandPalette.tsx";
import Confetti, { useConfetti } from "@/components/Confetti.tsx";

import HomeHeader from "./_components/HomeHeader.tsx";
import { HomeContextualHero } from "./_components/HomeContextualHero.tsx";
import { HomeReels } from "./_components/HomeReels.tsx";
import { HomeLive } from "./_components/HomeLive.tsx";
import HomeForYou from "./_components/HomeForYou.tsx";
import HomeNearby from "./_components/HomeNearby.tsx";
import { useLocation } from "@/hooks/use-location.ts";
import HomePersonalizationSheet, {
  type HomeModulePreference,
  type HomePersonalizationPreferences,
} from "./_components/HomePersonalizationSheet.tsx";

/* -------------------------------------------------------------------------- */
/* Lazy-loaded module pages                                                   */
/* -------------------------------------------------------------------------- */

const ImmoPage = lazy(() => import("../modules/ImmoPage.tsx"));
const JobsPage = lazy(() => import("../modules/JobsPage.tsx"));
const TransportPage = lazy(() => import("../modules/TransportPage.tsx"));
const SantePage = lazy(() => import("../modules/SantePage.tsx"));
const PaiementPage = lazy(() => import("../modules/PaiementPage.tsx"));
const CommunityPage = lazy(() => import("../modules/CommunityPage.tsx"));
const ExplorerPage = lazy(() => import("../modules/ExplorerPage.tsx"));
const MessagesPage = lazy(() => import("../modules/MessagesPage.tsx"));
const ActionsPage = lazy(() => import("../modules/ActionsPage.tsx"));
const ProfilePage = lazy(() => import("../modules/ProfilePage.tsx"));
const SettingsPage = lazy(() => import("../modules/SettingsPage.tsx"));
const LivraisonPage = lazy(() => import("../modules/LivraisonPage.tsx"));

const NotificationsPage = lazy(
  () => import("../modules/NotificationsPage.tsx"),
);

const AgriPage = lazy(() => import("../modules/AgriPage.tsx"));
const MediaPage = lazy(() => import("../modules/MediaPage.tsx"));
const EvenementsPage = lazy(() => import("../modules/EvenementsPage.tsx"));
const VoyagesPage = lazy(() => import("../modules/VoyagesPage.tsx"));

const VoyagesDetailPage = lazy(
  () => import("../modules/VoyagesDetailPage.tsx"),
);

const FavoritesPage = lazy(() => import("../modules/FavoritesPage.tsx"));
const CartePage = lazy(() => import("../modules/CartePage.tsx"));
const WalletPage = lazy(() => import("../modules/WalletPage.tsx"));
const SOSPage = lazy(() => import("../modules/SOSPage.tsx"));
const DashboardPage = lazy(() => import("../modules/DashboardPage.tsx"));
const ApprendrePage = lazy(() => import("../modules/ApprendrePage.tsx"));
const ParrainagePage = lazy(() => import("../modules/ParrainagePage.tsx"));
const MarketplacePage = lazy(() => import("../modules/MarketplacePage.tsx"));
const RecompensesPage = lazy(() => import("../modules/RecompensesPage.tsx"));
const AgendaPage = lazy(() => import("../modules/AgendaPage.tsx"));
const DocumentsPage = lazy(() => import("../modules/DocumentsPage.tsx"));
const LogementPage = lazy(() => import("../modules/LogementPage.tsx"));
const EmploiPage = lazy(() => import("../modules/EmploiPage.tsx"));

const EvenementsProPage = lazy(
  () => import("../modules/EvenementsProPage.tsx"),
);

const JuridiquePage = lazy(() => import("../modules/JuridiquePage.tsx"));
const GroupesPage = lazy(() => import("../modules/GroupesPage.tsx"));
const LiveStoriesPage = lazy(() => import("../modules/LiveStoriesPage.tsx"));
const ReputationPage = lazy(() => import("../modules/ReputationPage.tsx"));
const CoCreationPage = lazy(() => import("../modules/CoCreationPage.tsx"));
const PremiumPage = lazy(() => import("../modules/PremiumPage.tsx"));
const RevenusPage = lazy(() => import("../modules/RevenusPage.tsx"));

const MarketplaceProPage = lazy(
  () => import("../modules/MarketplaceProPage.tsx"),
);

const RevenusDashboardPage = lazy(
  () => import("../modules/RevenusDashboardPage.tsx"),
);

const EditeurPage = lazy(() => import("../modules/EditeurPage.tsx"));
const StudioPhotoPage = lazy(() => import("../modules/StudioPhotoPage.tsx"));

const StoriesCreatorPage = lazy(
  () => import("../modules/StoriesCreatorPage.tsx"),
);

const TemplatesPage = lazy(() => import("../modules/TemplatesPage.tsx"));
const FitnessPage = lazy(() => import("../modules/FitnessPage.tsx"));
const NutritionPage = lazy(() => import("../modules/NutritionPage.tsx"));
const MeditationPage = lazy(() => import("../modules/MeditationPage.tsx"));

const BienEtreDashboardPage = lazy(
  () => import("../modules/BienEtreDashboardPage.tsx"),
);

const DestinationsPage = lazy(() => import("../modules/DestinationsPage.tsx"));

const PlanificateurPage = lazy(
  () => import("../modules/PlanificateurPage.tsx"),
);

const CarnetVoyagePage = lazy(() => import("../modules/CarnetVoyagePage.tsx"));

const BudgetVoyagePage = lazy(() => import("../modules/BudgetVoyagePage.tsx"));

const CoursPage = lazy(() => import("../modules/CoursPage.tsx"));
const QuizPage = lazy(() => import("../modules/QuizPage.tsx"));

const CertificationsPage = lazy(
  () => import("../modules/CertificationsPage.tsx"),
);

const MentoratPage = lazy(() => import("../modules/MentoratPage.tsx"));

const LiveStreamingPage = lazy(
  () => import("../modules/LiveStreamingPage.tsx"),
);

const JusticePage = lazy(() => import("../modules/JusticePage.tsx"));
const FinancesPage = lazy(() => import("../modules/FinancesPage.tsx"));
const OngPage = lazy(() => import("../modules/OngPage.tsx"));
const SportPage = lazy(() => import("../modules/SportPage.tsx"));

const EduFormellePage = lazy(() => import("../modules/EduFormellePage.tsx"));

const EnergiePage = lazy(() => import("../modules/EnergiePage.tsx"));
const HebergementPage = lazy(() => import("../modules/HebergementPage.tsx"));
const RestaurationPage = lazy(() => import("../modules/RestaurationPage.tsx"));
const AnnoncesPage = lazy(() => import("../modules/AnnoncesPage.tsx"));
const UrbanismePage = lazy(() => import("../modules/UrbanismePage.tsx"));
const AmenagementPage = lazy(() => import("../modules/AmenagementPage.tsx"));

const EnvironnementPage = lazy(
  () => import("../modules/EnvironnementPage.tsx"),
);

const BusinessPage = lazy(() => import("../modules/BusinessPage.tsx"));
const CityHabitatPage = lazy(() => import("../modules/CityHabitatPage.tsx"));
const ServicesPage = lazy(() => import("../modules/ServicesPage.tsx"));
const TrackingPage = lazy(() => import("../modules/TrackingPage.tsx"));
const EcolePage = lazy(() => import("../modules/EcolePage.tsx"));
const EglisePage = lazy(() => import("../modules/EglisePage.tsx"));
const NetworkPage = lazy(() => import("../modules/NetworkPage.tsx"));
const PubPage = lazy(() => import("../modules/PubPage.tsx"));

const DataPubliquePage = lazy(() => import("../modules/DataPubliquePage.tsx"));

const SecuritePubliquePage = lazy(
  () => import("../modules/SecuritePubliquePage.tsx"),
);

const Map3DPage = lazy(() => import("../modules/Map3DPage.tsx"));

const PublicProfilePage = lazy(
  () => import("../modules/PublicProfilePage.tsx"),
);

const BadgesPage = lazy(() => import("../modules/BadgesPage.tsx"));
const AdminPage = lazy(() => import("../modules/AdminPage.tsx"));
const DecouvertePage = lazy(() => import("../modules/DecouvertePage.tsx"));
const BoostPage = lazy(() => import("../modules/BoostPage.tsx"));
const AnalyticsPage = lazy(() => import("../modules/AnalyticsPage.tsx"));
const ExportPage = lazy(() => import("../modules/ExportPage.tsx"));
const ThemePage = lazy(() => import("../modules/ThemePage.tsx"));
const EventsAgendaPage = lazy(() => import("../modules/EventsAgendaPage.tsx"));

const MapInteractivePage = lazy(() => import("./_components/MapPage.tsx"));

const PrivacyPage = lazy(() => import("../modules/PrivacyPage.tsx"));
const AboutPage = lazy(() => import("../modules/AboutPage.tsx"));
const HelpPage = lazy(() => import("../modules/HelpPage.tsx"));
const TermsPage = lazy(() => import("../modules/TermsPage.tsx"));
const ReelsPage = lazy(() => import("../modules/ReelsPage.tsx"));

const CreatorDashboardPage = lazy(
  () => import("../modules/CreatorDashboardPage.tsx"),
);

const AIStudioPage = lazy(() => import("../modules/AIStudioPage.tsx"));

const SeriesPlaylistPage = lazy(
  () => import("../modules/SeriesPlaylistPage.tsx"),
);

const ChallengesPage = lazy(() => import("../modules/ChallengesPage.tsx"));

/* -------------------------------------------------------------------------- */
/* Module loading skeleton                                                    */
/* -------------------------------------------------------------------------- */

function ModuleSkeleton() {
  return (
    <View style={styles.skeletonRoot}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonHeaderTitle} />
      </View>

      <View style={styles.skeletonBlockLarge} />
      <View style={styles.skeletonBlock} />
      <View style={styles.skeletonBlock} />
      <View style={styles.skeletonBlockSmall} />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Navigation contract                                                        */
/* -------------------------------------------------------------------------- */

type PageKey =
  | "home"
  | "immo"
  | "jobs"
  | "transport"
  | "sante"
  | "paiement"
  | "community"
  | "explorer"
  | "messages"
  | "actions"
  | "profile"
  | "settings"
  | "livraison"
  | "notifications"
  | "agri"
  | "media"
  | "evenements"
  | "voyages"
  | "voyages-detail"
  | "sos"
  | "favorites"
  | "wallet"
  | "carte"
  | "dashboard"
  | "apprendre"
  | "parrainage"
  | "marketplace"
  | "recompenses"
  | "agenda"
  | "documents"
  | "logement"
  | "emploi"
  | "evenements-pro"
  | "juridique"
  | "groupes"
  | "live"
  | "reputation"
  | "cocreation"
  | "premium"
  | "revenus"
  | "marketplace-pro"
  | "revenus-dashboard"
  | "editeur"
  | "studio"
  | "stories-creator"
  | "templates"
  | "fitness"
  | "nutrition"
  | "meditation"
  | "bienetre"
  | "destinations"
  | "planificateur"
  | "carnet-voyage"
  | "budget-voyage"
  | "cours"
  | "quiz"
  | "certifications"
  | "mentorat"
  | "live-streaming"
  | "justice"
  | "finances"
  | "ong"
  | "sport"
  | "edu-formelle"
  | "energie"
  | "hebergement"
  | "restauration"
  | "annonces"
  | "urbanisme"
  | "amenagement"
  | "environnement"
  | "business"
  | "city-habitat"
  | "services"
  | "tracking"
  | "ecole"
  | "eglise"
  | "network"
  | "pub"
  | "data-publique"
  | "securite"
  | "map3d"
  | "badges"
  | "admin"
  | "boost"
  | "analytics"
  | "events-agenda"
  | "decouverte"
  | "export"
  | "theme"
  | "privacy"
  | "about"
  | "help"
  | "terms"
  | "reels"
  | "creator-dashboard"
  | "ai-studio"
  | "series-playlist"
  | "challenges";

const IMPLEMENTED: readonly PageKey[] = [
  "immo",
  "jobs",
  "transport",
  "sante",
  "paiement",
  "community",
  "messages",
  "actions",
  "profile",
  "settings",
  "explorer",
  "livraison",
  "notifications",
  "agri",
  "media",
  "evenements",
  "voyages",
  "voyages-detail",
  "sos",
  "favorites",
  "wallet",
  "carte",
  "dashboard",
  "apprendre",
  "parrainage",
  "marketplace",
  "recompenses",
  "agenda",
  "documents",
  "logement",
  "emploi",
  "evenements-pro",
  "juridique",
  "groupes",
  "live",
  "reputation",
  "cocreation",
  "premium",
  "revenus",
  "marketplace-pro",
  "revenus-dashboard",
  "editeur",
  "studio",
  "stories-creator",
  "templates",
  "fitness",
  "nutrition",
  "meditation",
  "bienetre",
  "destinations",
  "planificateur",
  "carnet-voyage",
  "budget-voyage",
  "cours",
  "quiz",
  "certifications",
  "mentorat",
  "live-streaming",
  "justice",
  "finances",
  "ong",
  "sport",
  "edu-formelle",
  "energie",
  "hebergement",
  "restauration",
  "annonces",
  "urbanisme",
  "amenagement",
  "environnement",
  "business",
  "city-habitat",
  "services",
  "tracking",
  "ecole",
  "eglise",
  "network",
  "pub",
  "data-publique",
  "securite",
  "map3d",
  "badges",
  "admin",
  "boost",
  "analytics",
  "events-agenda",
  "decouverte",
  "export",
  "theme",
  "privacy",
  "about",
  "help",
  "terms",
  "reels",
  "creator-dashboard",
  "ai-studio",
  "series-playlist",
  "challenges",
];

/* -------------------------------------------------------------------------- */
/* Home personalization — module catalogue                                    */
/* -------------------------------------------------------------------------- */

/*
 * Ces entrées alimentent le panneau "Personnaliser ma Home".
 *
 * Les identifiants sont alignés sur :
 *   - le PageKey du routeur (colonne route)
 *   - les visuels du HomePersonalizationSheet (colonne id)
 *
 * Aucune donnée fictive : ce sont de vrais modules existants.
 */
const HOME_MODULES_PREFERENCES: HomeModulePreference[] = [
  { id: "jobs", label: "Emploi & Jobs", route: "jobs" },
  { id: "immo", label: "Immobilier", route: "immo" },
  { id: "marketplace", label: "Marketplace", route: "marketplace" },
  { id: "annonces", label: "Annonces", route: "annonces" },
  { id: "evenements", label: "Événements", route: "evenements" },
  { id: "services", label: "Services", route: "services" },
  { id: "transport", label: "Transport", route: "transport" },
  { id: "sante", label: "Santé", route: "sante" },
  { id: "voyages", label: "Voyages", route: "voyages" },
  { id: "community", label: "Communauté", route: "community" },
  { id: "live", label: "Live", route: "live" },
  { id: "agri", label: "Agriculture", route: "agri" },
];

/* -------------------------------------------------------------------------- */
/* Home                                                                       */
/* -------------------------------------------------------------------------- */

export default function HomePage() {
  const { isAuthenticated, user: firebaseUser } = useFirebaseAuth();

  const email = firebaseUser?.email;

  const [showLocalOnboarding, setShowLocalOnboarding] = useState(
    () => !hasCompletedOnboarding(),
  );

  const [currentPage, setCurrentPage] = useState<PageKey>("home");
  const [activeTab, setActiveTab] = useState("home");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [notifCenterOpen, setNotifCenterOpen] = useState(false);

  const [publicProfileId, setPublicProfileId] = useState<Id<"users"> | null>(
    null,
  );

  const [selectedVoyageId, setSelectedVoyageId] = useState<string | null>(null);

  const [smartNotifsSent, setSmartNotifsSent] = useState(false);

  const [personalizeOpen, setPersonalizeOpen] = useState(false);

  const [personalizationPrefs, setPersonalizationPrefs] = useState<
    HomePersonalizationPreferences | undefined
  >(undefined);

  const currentUser = useQuery(api.users.getCurrentUser, {});
  const { coords: userCoords } = useLocation();

  const showOnboardingFlow =
    isAuthenticated &&
    currentUser !== undefined &&
    currentUser !== null &&
    !currentUser.onboardingCompleted;

  const logActivity = useMutation(api.activity.log);
  const sendSmartNotifs = useMutation(api.notifications.sendSmartNotifs);

  const { checkBadges, awardXp } = useBadges();
  const { fire: fireConfetti, confetti: confettiEl } = useConfetti();

  /* ---------------------------------------------------------------------- */
  /* Smart notifications                                                     */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!isAuthenticated || smartNotifsSent) {
      return;
    }

    setSmartNotifsSent(true);

    sendSmartNotifs({}).catch(() => null);
  }, [isAuthenticated, smartNotifsSent, sendSmartNotifs]);

  /* ---------------------------------------------------------------------- */
  /* Navigation                                                              */
  /* ---------------------------------------------------------------------- */

  const navigate = (page: string) => {
    if (page.startsWith("reel:")) {
      setCurrentPage("reels");
      setActiveTab("home");
      return;
    }

    if (page.startsWith("live:")) {
      setCurrentPage("live-streaming");
      setActiveTab("home");
      return;
    }

    if (!IMPLEMENTED.includes(page as PageKey)) {
      return;
    }

    const target = page as PageKey;

    setCurrentPage(target);

    if (email) {
      logActivity({
        type: "view_module",
        label:
          target.charAt(0).toUpperCase() + target.slice(1).replace(/-/g, " "),
        target,
      }).catch(() => null);
    }

    awardXp(5, `Module visité : ${target}`, "module_visit").catch(() => null);

    checkBadges("module_visited").catch(() => null);
  };

  const goHome = () => {
    setCurrentPage("home");
    setActiveTab("home");
    setSelectedVoyageId(null);
  };

  /* ---------------------------------------------------------------------- */
  /* Refresh                                                                 */
  /* ---------------------------------------------------------------------- */

  const handleRefresh = async () => {
    /*
     * Les blocs Home autonomes utilisent leurs propres queries Convex.
     * PullToRefresh reste donc un contrat d'orchestration sans simulation
     * de délai réseau.
     *
     * Convex réactivera automatiquement les queries lorsqu'une mutation
     * ou une nouvelle version des données les rendra obsolètes.
     */
    await Promise.resolve();
  };

  /* ---------------------------------------------------------------------- */
  /* Module wrappers                                                         */
  /* ---------------------------------------------------------------------- */

  const withAI = (page: ReactElement, ctx: string) => (
    <PageTransition variant="slide-left">
      <Suspense fallback={<ModuleSkeleton />}>
        <View style={styles.aiWrapper}>
          {page}

          <AIFloatingButton
            moduleContext={ctx}
            onNavigate={(pageName) => navigate(pageName)}
          />
        </View>
      </Suspense>
    </PageTransition>
  );

  const lazy$ = (page: ReactElement) => (
    <PageTransition variant="slide-left">
      <Suspense fallback={<ModuleSkeleton />}>{page}</Suspense>
    </PageTransition>
  );

  /* ---------------------------------------------------------------------- */
  /* Onboarding                                                              */
  /* ---------------------------------------------------------------------- */

  if (isAuthenticated && showLocalOnboarding) {
    return (
      <OnboardingScreen onComplete={() => setShowLocalOnboarding(false)} />
    );
  }

  if (isAuthenticated && showOnboardingFlow) {
    return <OnboardingFlow onComplete={() => fireConfetti()} />;
  }

  /* ---------------------------------------------------------------------- */
  /* Public profile                                                          */
  /* ---------------------------------------------------------------------- */

  if (publicProfileId) {
    return (
      <PageTransition variant="scale">
        <Suspense fallback={<ModuleSkeleton />}>
          <PublicProfilePage
            userId={publicProfileId}
            onBack={() => setPublicProfileId(null)}
          />
        </Suspense>
      </PageTransition>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Routing                                                                 */
  /* ---------------------------------------------------------------------- */

  if (currentPage === "immo")
    return withAI(<ImmoPage onBack={goHome} />, "immo");

  if (currentPage === "jobs")
    return withAI(<JobsPage onBack={goHome} />, "jobs");

  if (currentPage === "transport")
    return withAI(<TransportPage onBack={goHome} />, "transport");

  if (currentPage === "sante") return withAI(<SantePage />, "sante");

  if (currentPage === "paiement")
    return withAI(<PaiementPage onBack={goHome} />, "paiement");

  if (currentPage === "community")
    return withAI(<CommunityPage onBack={goHome} />, "community");

  if (currentPage === "messages")
    return lazy$(<MessagesPage onBack={goHome} />);

  if (currentPage === "actions")
    return lazy$(<ActionsPage onBack={goHome} onNavigate={navigate} />);

  if (currentPage === "profile")
    return lazy$(<ProfilePage onBack={goHome} onNavigate={navigate} />);

  if (currentPage === "settings")
    return lazy$(<SettingsPage onBack={goHome} onNavigate={navigate} />);

  if (currentPage === "livraison")
    return withAI(<LivraisonPage onBack={goHome} />, "livraison");

  if (currentPage === "notifications")
    return lazy$(<NotificationsPage onBack={goHome} onNavigate={navigate} />);

  if (currentPage === "agri")
    return withAI(<AgriPage onBack={goHome} />, "agri");

  if (currentPage === "media")
    return withAI(<MediaPage onBack={goHome} />, "media");

  if (currentPage === "evenements")
    return withAI(<EvenementsPage onBack={goHome} />, "evenements");

  if (currentPage === "voyages") {
    return withAI(
      <VoyagesPage
        onBack={goHome}
        onViewTrip={(id) => {
          setSelectedVoyageId(id);
          setCurrentPage("voyages-detail");
        }}
      />,
      "voyages",
    );
  }

  if (currentPage === "voyages-detail" && selectedVoyageId) {
    return withAI(
      <VoyagesDetailPage
        tripId={selectedVoyageId}
        onBack={() => {
          setSelectedVoyageId(null);
          setCurrentPage("voyages");
        }}
      />,
      "voyages",
    );
  }

  if (currentPage === "sos") return lazy$(<SOSPage onBack={goHome} />);

  if (currentPage === "carte")
    return lazy$(<CartePage onBack={goHome} onNavigate={navigate} />);

  if (currentPage === "dashboard")
    return withAI(
      <DashboardPage onBack={goHome} onNavigate={navigate} />,
      "dashboard",
    );

  if (currentPage === "favorites")
    return lazy$(<FavoritesPage onBack={goHome} onNavigate={navigate} />);

  if (currentPage === "wallet")
    return withAI(<WalletPage onBack={goHome} />, "wallet");

  if (currentPage === "apprendre")
    return withAI(<ApprendrePage onBack={goHome} />, "apprendre");

  if (currentPage === "parrainage")
    return lazy$(<ParrainagePage onBack={goHome} />);

  if (currentPage === "marketplace")
    return withAI(<MarketplacePage onBack={goHome} />, "marketplace");

  if (currentPage === "recompenses")
    return lazy$(<RecompensesPage onBack={goHome} />);

  if (currentPage === "agenda") return lazy$(<AgendaPage onBack={goHome} />);

  if (currentPage === "documents")
    return lazy$(<DocumentsPage onBack={goHome} />);

  if (currentPage === "logement")
    return withAI(<LogementPage onBack={goHome} />, "logement");

  if (currentPage === "emploi")
    return withAI(<EmploiPage onBack={goHome} />, "emploi");

  if (currentPage === "evenements-pro")
    return withAI(<EvenementsProPage onBack={goHome} />, "evenements-pro");

  if (currentPage === "juridique")
    return withAI(<JuridiquePage onBack={goHome} />, "juridique");

  if (currentPage === "groupes")
    return withAI(<GroupesPage onBack={goHome} />, "groupes");

  if (currentPage === "live")
    return withAI(<LiveStoriesPage onBack={goHome} />, "live");

  if (currentPage === "reputation")
    return withAI(<ReputationPage onBack={goHome} />, "reputation");

  if (currentPage === "cocreation")
    return withAI(<CoCreationPage onBack={goHome} />, "cocreation");

  if (currentPage === "premium") return lazy$(<PremiumPage onBack={goHome} />);

  if (currentPage === "revenus")
    return withAI(<RevenusPage onBack={goHome} />, "revenus");

  if (currentPage === "marketplace-pro")
    return withAI(<MarketplaceProPage onBack={goHome} />, "marketplace-pro");

  if (currentPage === "revenus-dashboard")
    return withAI(
      <RevenusDashboardPage onBack={goHome} onNavigate={navigate} />,
      "revenus-dashboard",
    );

  if (currentPage === "editeur") return lazy$(<EditeurPage onBack={goHome} />);

  if (currentPage === "studio")
    return lazy$(<StudioPhotoPage onBack={goHome} />);

  if (currentPage === "stories-creator")
    return lazy$(<StoriesCreatorPage onBack={goHome} onNavigate={navigate} />);

  if (currentPage === "templates")
    return lazy$(<TemplatesPage onBack={goHome} onNavigate={navigate} />);

  if (currentPage === "fitness")
    return withAI(<FitnessPage onBack={goHome} />, "fitness");

  if (currentPage === "nutrition")
    return withAI(<NutritionPage onBack={goHome} />, "nutrition");

  if (currentPage === "meditation")
    return withAI(<MeditationPage onBack={goHome} />, "meditation");

  if (currentPage === "bienetre")
    return withAI(
      <BienEtreDashboardPage onBack={goHome} onNavigate={navigate} />,
      "bienetre",
    );

  if (currentPage === "destinations")
    return withAI(<DestinationsPage onBack={goHome} />, "destinations");

  if (currentPage === "planificateur")
    return withAI(<PlanificateurPage onBack={goHome} />, "planificateur");

  if (currentPage === "carnet-voyage")
    return withAI(<CarnetVoyagePage onBack={goHome} />, "carnet-voyage");

  if (currentPage === "budget-voyage")
    return withAI(<BudgetVoyagePage onBack={goHome} />, "budget-voyage");

  if (currentPage === "cours")
    return withAI(<CoursPage onBack={goHome} />, "cours");

  if (currentPage === "quiz")
    return withAI(<QuizPage onBack={goHome} />, "quiz");

  if (currentPage === "certifications")
    return withAI(<CertificationsPage onBack={goHome} />, "certifications");

  if (currentPage === "mentorat")
    return withAI(<MentoratPage onBack={goHome} />, "mentorat");

  if (currentPage === "live-streaming")
    return withAI(<LiveStreamingPage onBack={goHome} />, "live-streaming");

  if (currentPage === "justice")
    return withAI(<JusticePage onBack={goHome} />, "justice");

  if (currentPage === "finances")
    return withAI(<FinancesPage onBack={goHome} />, "finances");

  if (currentPage === "ong") return withAI(<OngPage onBack={goHome} />, "ong");

  if (currentPage === "sport")
    return withAI(<SportPage onBack={goHome} />, "sport");

  if (currentPage === "edu-formelle")
    return withAI(<EduFormellePage onBack={goHome} />, "edu-formelle");

  if (currentPage === "energie")
    return withAI(<EnergiePage onBack={goHome} />, "energie");

  if (currentPage === "hebergement")
    return withAI(<HebergementPage onBack={goHome} />, "hebergement");

  if (currentPage === "restauration")
    return withAI(<RestaurationPage onBack={goHome} />, "restauration");

  if (currentPage === "annonces")
    return withAI(<AnnoncesPage onBack={goHome} />, "annonces");

  if (currentPage === "urbanisme")
    return withAI(<UrbanismePage onBack={goHome} />, "urbanisme");

  if (currentPage === "amenagement")
    return withAI(<AmenagementPage onBack={goHome} />, "amenagement");

  if (currentPage === "environnement")
    return withAI(<EnvironnementPage onBack={goHome} />, "environnement");

  if (currentPage === "business")
    return withAI(<BusinessPage onBack={goHome} />, "business");

  if (currentPage === "city-habitat")
    return withAI(<CityHabitatPage onBack={goHome} />, "city-habitat");

  if (currentPage === "services")
    return withAI(<ServicesPage onBack={goHome} />, "services");

  if (currentPage === "tracking")
    return withAI(<TrackingPage onBack={goHome} />, "tracking");

  if (currentPage === "ecole")
    return withAI(<EcolePage onBack={goHome} />, "ecole");

  if (currentPage === "eglise")
    return withAI(<EglisePage onBack={goHome} />, "eglise");

  if (currentPage === "network") {
    return withAI(
      <NetworkPage
        onBack={goHome}
        onViewProfile={(id) => setPublicProfileId(id as Id<"users">)}
      />,
      "network",
    );
  }

  if (currentPage === "pub") return withAI(<PubPage onBack={goHome} />, "pub");

  if (currentPage === "data-publique")
    return withAI(<DataPubliquePage onBack={goHome} />, "data-publique");

  if (currentPage === "securite")
    return withAI(<SecuritePubliquePage onBack={goHome} />, "securite");

  if (currentPage === "map3d")
    return withAI(<Map3DPage onBack={goHome} />, "map3d");

  if (currentPage === "badges") return lazy$(<BadgesPage onBack={goHome} />);

  if (currentPage === "admin") return lazy$(<AdminPage onBack={goHome} />);

  if (currentPage === "boost") return lazy$(<BoostPage onBack={goHome} />);

  if (currentPage === "analytics")
    return lazy$(<AnalyticsPage onBack={goHome} />);

  if (currentPage === "export") return lazy$(<ExportPage onBack={goHome} />);

  if (currentPage === "theme") return lazy$(<ThemePage onBack={goHome} />);

  if (currentPage === "privacy") return lazy$(<PrivacyPage onBack={goHome} />);

  if (currentPage === "about") return lazy$(<AboutPage onBack={goHome} />);

  if (currentPage === "help") return lazy$(<HelpPage onBack={goHome} />);

  if (currentPage === "terms") return lazy$(<TermsPage onBack={goHome} />);

  if (currentPage === "reels") return lazy$(<ReelsPage onBack={goHome} />);

  if (currentPage === "creator-dashboard")
    return lazy$(<CreatorDashboardPage onBack={goHome} />);

  if (currentPage === "ai-studio")
    return withAI(<AIStudioPage onBack={goHome} />, "home");

  if (currentPage === "series-playlist")
    return lazy$(<SeriesPlaylistPage onBack={goHome} />);

  if (currentPage === "challenges")
    return lazy$(<ChallengesPage onBack={goHome} />);

  if (currentPage === "events-agenda")
    return lazy$(<EventsAgendaPage onBack={goHome} />);

  if (currentPage === "decouverte") {
    return lazy$(
      <DecouvertePage
        onBack={goHome}
        onNavigate={navigate}
        onViewProfile={(id) => setPublicProfileId(id)}
      />,
    );
  }

  if (currentPage === "explorer") {
    return (
      <Suspense fallback={<ModuleSkeleton />}>
        <ExplorerPage
          onBack={goHome}
          onNavigate={(page) => {
            const idMap: Record<string, PageKey> = {
              learn: "apprendre",
              live: "live-streaming",
              edu: "edu-formelle",
            };

            const mapped = idMap[page] ?? page;

            navigate(mapped);
          }}
        />
      </Suspense>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* HOME                                                                    */
  /* ---------------------------------------------------------------------- */

  return (
    <View style={styles.root}>
      {/* ------------------------------------------------------------------ */}
      {/* Ambient premium background                                          */}
      {/* ------------------------------------------------------------------ */}

      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <View style={[styles.glow, styles.glowTopRight]} />

        <View style={[styles.glow, styles.glowBottomLeft]} />

        <View style={[styles.glow, styles.glowCenter]} />
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* Global overlays                                                     */}
      {/* ------------------------------------------------------------------ */}

      <SideDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNavigate={navigate}
        onOpenHomePersonalization={() => {
          setDrawerOpen(false);
          setPersonalizeOpen(true);
        }}
      />

      <CreateBottomSheet
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      <CommandPalette onNavigate={navigate} />

      {confettiEl}

      <HomePersonalizationSheet
        open={personalizeOpen}
        onClose={() => setPersonalizeOpen(false)}
        modules={HOME_MODULES_PREFERENCES}
        preferences={personalizationPrefs}
        onSave={(next) => setPersonalizationPrefs(next)}
        onReset={() => setPersonalizationPrefs(undefined)}
      />

      {/* ------------------------------------------------------------------ */}
      {/* AI assistant                                                        */}
      {/* ------------------------------------------------------------------ */}

      {aiOpen ? (
        <AIAssistant
          onClose={() => setAiOpen(false)}
          onNavigate={(page) => {
            navigate(page);
            setAiOpen(false);
          }}
          moduleContext="home"
        />
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* AI floating action                                                  */}
      {/* ------------------------------------------------------------------ */}

      {isAuthenticated && !aiOpen ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ouvrir DébrouilleAI"
          accessibilityHint="Ouvre votre assistant intelligent"
          onPress={() => setAiOpen(true)}
          style={({ pressed }) => [
            styles.fabAi,
            pressed && styles.fabAiPressed,
          ]}
        >
          <Sparkles size={22} color="#FFFFFF" strokeWidth={2} />

          <View style={styles.fabAiBadge}>
            <Text style={styles.fabAiBadgeText}>AI</Text>
          </View>
        </Pressable>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* Public / authenticated state                                        */}
      {/* ------------------------------------------------------------------ */}

      {!isAuthenticated ? (
        <View style={styles.landingWrap}>
          <LandingPage />
        </View>
      ) : (
        <PullToRefresh
          onRefresh={handleRefresh}
          className="flex-1 min-h-0 min-w-0 pb-28"
        >
          <View style={styles.feedWrap}>
            {/* ============================================================ */}
            {/* 01 — IDENTITY                                                 */}
            {/* ============================================================ */}

            <HomeHeader onNavigate={navigate} />

            {/* ============================================================ */}
            {/* 02 — STORIES                                                  */}
            {/* ============================================================ */}

            <Stories />

            {/* ============================================================ */}
            {/* 03 — SMART SEARCH                                             */}
            {/* ============================================================ */}

            <View style={styles.searchWrap}>
              <SmartSearch
                onNavigate={navigate}
                onAdvancedSearch={() => setAdvancedSearchOpen(true)}
              />
            </View>

            {/* ============================================================ */}
            {/* 04 — CONTEXTUAL HERO                                          */}
            {/* ============================================================ */}

            <HomeContextualHero onNavigate={navigate} />

            {/* ============================================================ */}
            {/* 05 — REELS                                                    */}
            {/* ============================================================ */}

            <HomeReels
              onNavigate={navigate}
              city={currentUser?.city ?? undefined}
            />

            {/* ============================================================ */}
            {/* 06 — LIVE                                                     */}
            {/* ============================================================ */}

            <HomeLive onNavigate={navigate} />

            {/* ============================================================ */}
            {/* 07 — POUR VOUS                                                */}
            {/* ============================================================ */}

            <HomeForYou onNavigate={navigate} />

            {/* ============================================================ */}
            {/* 08 — POUR TOI / FEED                                          */}
            {/* ============================================================ */}

            <View style={styles.feedSection}>
              <View style={styles.feedSectionHeader}>
                <Text style={styles.feedEyebrow}>POUR TOI</Text>
              </View>

              <PersonalizedFeed
                onNavigate={navigate}
                onCreateOpen={() => setCreateOpen(true)}
                onViewProfile={(id) => setPublicProfileId(id as Id<"users">)}
              />
            </View>

            {/* ============================================================ */}
            {/* 09 — AUTOUR DE VOUS                                           */}
            {/* ============================================================ */}

            {userCoords ? (
              <HomeNearby
                latitude={userCoords.latitude}
                longitude={userCoords.longitude}
                onNavigate={navigate}
              />
            ) : null}
          </View>
        </PullToRefresh>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Offline                                                             */}
      {/* ------------------------------------------------------------------ */}

      <OfflineBanner />

      {/* ------------------------------------------------------------------ */}
      {/* Bottom navigation                                                   */}
      {/* ------------------------------------------------------------------ */}

      {isAuthenticated ? (
        <TabBar
          active={activeTab}
          hidden={
            drawerOpen ||
            createOpen ||
            aiOpen ||
            notifCenterOpen ||
            advancedSearchOpen ||
            mapOpen ||
            personalizeOpen
          }
          onChange={(tab) => {
            setActiveTab(tab);

            if (tab === "explorer") {
              navigate("explorer");
              return;
            }

            if (tab === "messages") {
              navigate("messages");
              return;
            }

            if (tab === "actions") {
              navigate("actions");
              return;
            }

            if (tab === "create") {
              setCreateOpen(true);
              return;
            }

            if (tab === "home") {
              goHome();
            }
          }}
        />
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* Notification center                                                 */}
      {/* ------------------------------------------------------------------ */}

      {notifCenterOpen ? (
        <NotificationCenter
          onClose={() => setNotifCenterOpen(false)}
          onNavigate={(page) => {
            setNotifCenterOpen(false);
            navigate(page);
          }}
        />
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* Advanced search                                                      */}
      {/* ------------------------------------------------------------------ */}

      {advancedSearchOpen ? (
        <AdvancedSearch
          onClose={() => setAdvancedSearchOpen(false)}
          onNavigate={(page) => {
            setAdvancedSearchOpen(false);
            navigate(page);
          }}
          onViewProfile={(id) => {
            setAdvancedSearchOpen(false);
            setPublicProfileId(id);
          }}
        />
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* Map                                                                  */}
      {/* ------------------------------------------------------------------ */}

      {mapOpen ? (
        <Suspense fallback={<ModuleSkeleton />}>
          <MapInteractivePage onClose={() => setMapOpen(false)} />
        </Suspense>
      ) : null}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "column",
    overflow: "hidden",
    backgroundColor: "#03050D",
  },

  glow: {
    position: "absolute",
    borderRadius: 999,
  },

  glowTopRight: {
    top: -40,
    right: -40,
    width: 240,
    height: 240,
    backgroundColor: "rgba(139,92,246,0.08)",
  },

  glowBottomLeft: {
    bottom: 120,
    left: -60,
    width: 200,
    height: 200,
    backgroundColor: "rgba(14,165,233,0.06)",
  },

  glowCenter: {
    top: "45%",
    left: "30%",
    width: 320,
    height: 320,
    backgroundColor: "rgba(99,102,241,0.05)",
  },

  landingWrap: {
    flex: 1,
  },

  feedWrap: {
    width: "100%",
    paddingBottom: 24,
  },

  searchWrap: {
    marginTop: 2,
  },

  feedSection: {
    marginTop: 26,
  },

  feedSectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },

  feedEyebrow: {
    color: "#64748B",
    fontSize: 8,
    lineHeight: 11,
    fontWeight: "800",
    letterSpacing: 1.15,
  },

  aiWrapper: {
    flex: 1,
    width: "100%",
    position: "relative",
  },

  fabAi: {
    position: "absolute",
    bottom: 96,
    right: 20,
    zIndex: 30,
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8B5CF6",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    ...Platform.select({
      ios: {
        shadowColor: "#8B5CF6",
        shadowOpacity: 0.55,
        shadowRadius: 16,
        shadowOffset: {
          width: 0,
          height: 8,
        },
      },

      android: {
        elevation: 12,
      },

      default: {},
    }),
  },

  fabAiPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.95 }],
  },

  fabAiBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
  },

  fabAiBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  skeletonRoot: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 56,
    gap: 16,
  },

  skeletonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  skeletonAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  skeletonHeaderTitle: {
    width: 150,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  skeletonBlockLarge: {
    width: "100%",
    height: 190,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  skeletonBlock: {
    width: "100%",
    height: 120,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  skeletonBlockSmall: {
    width: "70%",
    height: 80,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.035)",
  },
});
