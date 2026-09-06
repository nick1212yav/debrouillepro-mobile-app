import { useLocalSearchParams, useRouter } from "expo-router";

// src/App.tsx
import { DefaultProviders } from "./components/providers/default";
import { UIBridge } from "@/core/sdk/ui/UIBridge";
import Index from "./pages/Index";
import AuthCallback from "./pages/auth/Callback";
import NotFound from "./pages/NotFound";
import { AuthPage } from "@/features/auth/pages/AuthPage";
import { useServiceWorker } from "@/hooks/use-service-worker";

import JobDetailPage from "./pages/modules/JobDetailPage";
import ImmoDetailPage from "./pages/modules/ImmoDetailPage";
import AnnoncesDetailPage from "./pages/modules/AnnoncesDetailPage";
import ServiceDetailPage from "./pages/modules/ServiceDetailPage";

import CommunityPage from "./pages/modules/CommunityPage";
import CommunityDetailPage from "./pages/modules/CommunityDetailPage";

import EvenementsPage from "./pages/modules/EvenementsPage";
import EvenementDetailPage from "./pages/modules/EvenementDetailPage";
import EvenementsProPage from "./pages/modules/EvenementsProPage";

import MarketplacePage from "./pages/modules/MarketplacePage";
import MarketplaceDetailPage from "./pages/modules/MarketplaceDetailPage";
import MarketplaceProPage from "./pages/modules/MarketplaceProPage";

// Santé
import SantePage from "./pages/modules/SantePage";
import SanteDetailPage from "./pages/modules/SanteDetailPage";

// Transport
import TransportPage from "./pages/modules/TransportPage";
import TransportDetailPage from "./pages/modules/TransportDetailPage";

// Restauration
import RestaurationPage from "./pages/modules/RestaurationPage";
import RestaurationDetailPage from "./pages/modules/RestaurationDetailPage";

// Hébergement
import HebergementPage from "./pages/modules/HebergementPage";
import HebergementDetailPage from "./pages/modules/HebergementDetailPage";

// Agriculture
import AgriPage from "./pages/modules/AgriPage";
import AgriDetailPage from "./pages/modules/AgriDetailPage";

// Network
import NetworkPage from "./pages/modules/NetworkPage";
import NetworkDetailPage from "./pages/modules/NetworkDetailPage";
import NetworkProfilePage from "./pages/modules/NetworkProfilePage";

// Voyages – plus besoin d'importer ici car géré par HomePage
// import VoyagesPage from "./pages/modules/VoyagesPage";
// import VoyagesDetailPage from "./pages/modules/VoyagesDetailPage";

import CheckoutPage from "./pages/CheckoutPage";

// ===============================
// Wrappers
// ===============================

function CommunityPageWrapper() {
  const router = useRouter();
  return <CommunityPage onBack={() => router.back()} />;
}

function EvenementsPageWrapper() {
  const router = useRouter();
  return <EvenementsPage onBack={() => router.back()} />;
}

function EvenementsProPageWrapper() {
  const router = useRouter();
  return <EvenementsProPage onBack={() => router.back()} />;
}

function MarketplacePageWrapper() {
  const router = useRouter();
  return <MarketplacePage onBack={() => router.back()} />;
}

function MarketplaceProPageWrapper() {
  const router = useRouter();
  return <MarketplaceProPage onBack={() => router.back()} />;
}

// Wrapper Santé
function SantePageWrapper() {
  return <SantePage />;
}

// Wrapper Transport
function TransportPageWrapper() {
  const router = useRouter();
  return <TransportPage onBack={() => router.back()} />;
}

// Wrapper Restauration
function RestaurationPageWrapper() {
  const router = useRouter();
  return <RestaurationPage onBack={() => router.back()} />;
}

// Wrapper Hébergement
function HebergementPageWrapper() {
  const router = useRouter();
  return <HebergementPage onBack={() => router.back()} />;
}

// Wrapper Agriculture
function AgriPageWrapper() {
  const router = useRouter();
  return <AgriPage onBack={() => router.back()} />;
}

function AgriDetailPageWrapper() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AgriDetailPage productId={id as any} onBack={() => router.back()} />;
}

// Wrapper Network
function NetworkPageWrapper() {
  const router = useRouter();
  return (
    <NetworkPage
      onBack={() => router.back()}
      onViewProfile={(userId) => router.push(`/network/profile/${userId}`)}
    />
  );
}

function NetworkDetailPageWrapper() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <NetworkDetailPage publicationId={id as any} onBack={() => router.back()} />
  );
}

function NetworkProfilePageWrapper() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  return (
    <NetworkProfilePage userId={userId as any} onBack={() => router.back()} />
  );
}

// ❌ Suppression du wrapper Voyages car les pages Voyages sont désormais gérées
// par le routage interne de HomePage (currentPage + selectedVoyageId).
// Les routes /voyages et /voyages/:id ne sont donc plus nécessaires ici.

function AppRoutes() {
  useServiceWorker();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/job/:id" element={<JobDetailPage />} />
        <Route path="/immo/:id" element={<ImmoDetailPage />} />
        <Route path="/annonce/:id" element={<AnnoncesDetailPage />} />
        <Route path="/service/:id" element={<ServiceDetailPage />} />
        <Route path="/community" element={<CommunityPageWrapper />} />
        <Route path="/community/:id" element={<CommunityDetailPage />} />
        <Route path="/events" element={<EvenementsPageWrapper />} />
        <Route path="/events/:id" element={<EvenementDetailPage />} />
        <Route path="/events/manage" element={<EvenementsProPageWrapper />} />
        <Route path="/marketplace" element={<MarketplacePageWrapper />} />
        <Route path="/marketplace/:id" element={<MarketplaceDetailPage />} />
        <Route
          path="/marketplace/manage"
          element={<MarketplaceProPageWrapper />}
        />
        {/* Santé */}
        <Route path="/sante" element={<SantePageWrapper />} />
        <Route path="/sante/:id" element={<SanteDetailPage />} />
        {/* Transport */}
        <Route path="/transport" element={<TransportPageWrapper />} />
        <Route path="/transport/:id" element={<TransportDetailPage />} />
        {/* Restauration */}
        <Route path="/restauration" element={<RestaurationPageWrapper />} />
        <Route path="/restauration/:id" element={<RestaurationDetailPage />} />
        {/* Hébergement */}
        <Route path="/hebergement" element={<HebergementPageWrapper />} />
        <Route path="/hebergement/:id" element={<HebergementDetailPage />} />
        {/* Agriculture */}
        <Route path="/agri" element={<AgriPageWrapper />} />
        <Route path="/agri/:id" element={<AgriDetailPageWrapper />} />
        {/* Network */}
        <Route path="/network" element={<NetworkPageWrapper />} />
        <Route path="/network/:id" element={<NetworkDetailPageWrapper />} />
        <Route
          path="/network/profile/:userId"
          element={<NetworkProfilePageWrapper />}
        />
        {/* ❌ Routes Voyages supprimées – désormais gérées par HomePage */}
        {/* <Route path="/voyages" element={<VoyagesPageWrapper />} /> */}
        {/* <Route path="/voyages/:id" element={<VoyagesDetailPage />} /> */}
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <DefaultProviders>
      <UIBridge />
      <AppRoutes />
    </DefaultProviders>
  );
}
