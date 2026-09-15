// src/App.tsx
import {
  BrowserRouter,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import { UIBridge } from "@/core/sdk/ui/UIBridge";
import Index from "./pages/Index.tsx";
import AuthCallback from "./pages/auth/Callback.tsx";
import NotFound from "./pages/NotFound.tsx";
import { AuthPage } from "@/features/auth/pages/AuthPage";
import { useServiceWorker } from "@/hooks/use-service-worker.ts";

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
  const navigate = useNavigate();
  return <CommunityPage onBack={() => navigate(-1)} />;
}

function EvenementsPageWrapper() {
  const navigate = useNavigate();
  return <EvenementsPage onBack={() => navigate(-1)} />;
}

function EvenementsProPageWrapper() {
  const navigate = useNavigate();
  return <EvenementsProPage onBack={() => navigate(-1)} />;
}

function MarketplacePageWrapper() {
  const navigate = useNavigate();
  return <MarketplacePage onBack={() => navigate(-1)} />;
}

function MarketplaceProPageWrapper() {
  const navigate = useNavigate();
  return <MarketplaceProPage onBack={() => navigate(-1)} />;
}

// Wrapper Santé
function SantePageWrapper() {
  return <SantePage />;
}

// Wrapper Transport
function TransportPageWrapper() {
  const navigate = useNavigate();
  return <TransportPage onBack={() => navigate(-1)} />;
}

// Wrapper Restauration
function RestaurationPageWrapper() {
  const navigate = useNavigate();
  return <RestaurationPage onBack={() => navigate(-1)} />;
}

// Wrapper Hébergement
function HebergementPageWrapper() {
  const navigate = useNavigate();
  return <HebergementPage onBack={() => navigate(-1)} />;
}

// Wrapper Agriculture
function AgriPageWrapper() {
  const navigate = useNavigate();
  return <AgriPage onBack={() => navigate(-1)} />;
}

function AgriDetailPageWrapper() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  return <AgriDetailPage productId={id as any} onBack={() => navigate(-1)} />;
}

// Wrapper Network
function NetworkPageWrapper() {
  const navigate = useNavigate();
  return (
    <NetworkPage
      onBack={() => navigate(-1)}
      onViewProfile={(userId) => navigate(`/network/profile/${userId}`)}
    />
  );
}

function NetworkDetailPageWrapper() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  return (
    <NetworkDetailPage publicationId={id as any} onBack={() => navigate(-1)} />
  );
}

function NetworkProfilePageWrapper() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  return (
    <NetworkProfilePage userId={userId as any} onBack={() => navigate(-1)} />
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
