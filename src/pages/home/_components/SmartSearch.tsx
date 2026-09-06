import { View, Pressable, Text, TextInput, GestureResponderEvent } from "react-native";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Search,
  Mic,
  X,
  Clock,
  TrendingUp,
  ArrowUpRight,
  Home,
  Briefcase,
  Stethoscope,
  Leaf,
  Newspaper,
  Calendar,
  Plane,
  MapPin,
  ChevronRight,
  Sparkles,
  Package,
  Building2,
  ShoppingBag,
  Wallet,
  Car,
  Users,
  Heart,
  Dumbbell,
  BookOpen,
  Zap,
  Shield,
  Globe,
  Music,
  Camera,
  LayoutGrid,
  Star,
  MessageSquare,
  Bell,
  Map,
  Truck,
  FileText,
  Award,
  Video,
  Cpu,
  Network,
  Megaphone,
  Database,
  Lock,
  TreePine,
  Factory,
  Church,
  GraduationCap,
  BarChart2,
  Navigation,
  ShoppingCart,
  Gift,
  Compass,
  Flame,
  Radio,
} from "lucide-react-native";

// ── Types ──────────────────────────────────────────────────────────────────

type ResultCategory =
  | "Immo"
  | "Jobs/Pro"
  | "Santé"
  | "Agri"
  | "Media"
  | "Événements"
  | "Voyages"
  | "Modules"
  | "Bien‑être"
  | "Éducation"
  | "Finance"
  | "Communauté"
  | "Services";

interface SearchResult {
  id: string;
  category: ResultCategory;
  title: string;
  subtitle: string;
  meta: string;
  badge?: string;
  badgeColor?: string;
  page: string;
}

// ── Module directory (all 80+ modules, for instant navigation) ─────────────

const MODULE_ENTRIES: SearchResult[] = [
  // ── Habitat & Immobilier ──
  {
    id: "mod-immo",
    category: "Modules",
    title: "Immobilier",
    subtitle: "Locations, ventes, terrains",
    meta: "→ Ouvrir",
    badge: "Immo",
    badgeColor: "#10b981",
    page: "immo",
  },
  {
    id: "mod-logement",
    category: "Modules",
    title: "Logement social",
    subtitle: "Programmes sociaux & coopératives",
    meta: "→ Ouvrir",
    badge: "Logement",
    badgeColor: "#10b981",
    page: "logement",
  },
  {
    id: "mod-hebergement",
    category: "Modules",
    title: "Hébergement",
    subtitle: "Hôtels, AirBnB, auberges",
    meta: "→ Ouvrir",
    badge: "Hôtels",
    badgeColor: "#10b981",
    page: "hebergement",
  },
  {
    id: "mod-urbanisme",
    category: "Modules",
    title: "Urbanisme",
    subtitle: "Permis de construire, plans d'occupation",
    meta: "→ Ouvrir",
    badge: "Urbain",
    badgeColor: "#6366f1",
    page: "urbanisme",
  },
  {
    id: "mod-amenagement",
    category: "Modules",
    title: "Aménagement",
    subtitle: "Projets d'aménagement territorial",
    meta: "→ Ouvrir",
    badge: "Territoire",
    badgeColor: "#6366f1",
    page: "amenagement",
  },
  {
    id: "mod-cityhabitat",
    category: "Modules",
    title: "City‑Habitat",
    subtitle: "Habitat urbain intelligent",
    meta: "→ Ouvrir",
    badge: "Smart",
    badgeColor: "#8b5cf6",
    page: "city-habitat",
  },

  // ── Emploi & Entreprise ──
  {
    id: "mod-jobs",
    category: "Modules",
    title: "Emploi & Jobs",
    subtitle: "Offres d'emploi & recrutement",
    meta: "→ Ouvrir",
    badge: "Emploi",
    badgeColor: "#8b5cf6",
    page: "jobs",
  },
  {
    id: "mod-emploi",
    category: "Modules",
    title: "Emploi formel",
    subtitle: "Fonctions publiques, CDI, CDD",
    meta: "→ Ouvrir",
    badge: "Formel",
    badgeColor: "#8b5cf6",
    page: "emploi",
  },
  {
    id: "mod-business",
    category: "Modules",
    title: "Business & Entreprises",
    subtitle: "Création, financement, annuaire",
    meta: "→ Ouvrir",
    badge: "Business",
    badgeColor: "#f97316",
    page: "business",
  },
  {
    id: "mod-marketplace",
    category: "Modules",
    title: "Marketplace",
    subtitle: "Achat & vente entre particuliers",
    meta: "→ Ouvrir",
    badge: "Market",
    badgeColor: "#ec4899",
    page: "marketplace",
  },
  {
    id: "mod-mkpro",
    category: "Modules",
    title: "Marketplace Pro",
    subtitle: "Boutiques professionnelles",
    meta: "→ Ouvrir",
    badge: "Pro",
    badgeColor: "#ec4899",
    page: "marketplace-pro",
  },
  {
    id: "mod-annonces",
    category: "Modules",
    title: "Annonces",
    subtitle: "Petites annonces & offres locales",
    meta: "→ Ouvrir",
    badge: "Annonces",
    badgeColor: "#f59e0b",
    page: "annonces",
  },
  {
    id: "mod-revenus",
    category: "Modules",
    title: "Revenus & Monétisation",
    subtitle: "Générer des revenus en ligne",
    meta: "→ Ouvrir",
    badge: "Revenus",
    badgeColor: "#10b981",
    page: "revenus",
  },
  {
    id: "mod-revdash",
    category: "Modules",
    title: "Tableau de bord Revenus",
    subtitle: "Suivi de vos gains",
    meta: "→ Ouvrir",
    badge: "Dashboard",
    badgeColor: "#10b981",
    page: "revenus-dashboard",
  },

  // ── Transport & Voyages ──
  {
    id: "mod-transport",
    category: "Modules",
    title: "Transport",
    subtitle: "Bus, taxi, moto, covoiturage",
    meta: "→ Ouvrir",
    badge: "Transport",
    badgeColor: "#6366f1",
    page: "transport",
  },
  {
    id: "mod-voyages",
    category: "Modules",
    title: "Voyages",
    subtitle: "Billets de voyage inter-villes",
    meta: "→ Ouvrir",
    badge: "Voyages",
    badgeColor: "#6366f1",
    page: "voyages",
  },
  {
    id: "mod-destinations",
    category: "Modules",
    title: "Destinations",
    subtitle: "Explorer des destinations en Afrique",
    meta: "→ Ouvrir",
    badge: "Discover",
    badgeColor: "#6366f1",
    page: "destinations",
  },
  {
    id: "mod-planificateur",
    category: "Modules",
    title: "Planificateur Voyage",
    subtitle: "Planifier votre itinéraire",
    meta: "→ Ouvrir",
    badge: "Planning",
    badgeColor: "#6366f1",
    page: "planificateur",
  },
  {
    id: "mod-carnet",
    category: "Modules",
    title: "Carnet de Voyage",
    subtitle: "Journal de bord de vos aventures",
    meta: "→ Ouvrir",
    badge: "Journal",
    badgeColor: "#6366f1",
    page: "carnet-voyage",
  },
  {
    id: "mod-budget",
    category: "Modules",
    title: "Budget Voyage",
    subtitle: "Gérer vos dépenses de voyage",
    meta: "→ Ouvrir",
    badge: "Budget",
    badgeColor: "#f59e0b",
    page: "budget-voyage",
  },
  {
    id: "mod-livraison",
    category: "Modules",
    title: "Livraison",
    subtitle: "Commande et suivi de colis",
    meta: "→ Ouvrir",
    badge: "Livraison",
    badgeColor: "#f97316",
    page: "livraison",
  },
  {
    id: "mod-tracking",
    category: "Modules",
    title: "Tracking & Suivi",
    subtitle: "Suivi GPS et logistique",
    meta: "→ Ouvrir",
    badge: "GPS",
    badgeColor: "#f97316",
    page: "tracking",
  },
  {
    id: "mod-map3d",
    category: "Modules",
    title: "Carte 3D",
    subtitle: "Visualisation cartographique 3D",
    meta: "→ Ouvrir",
    badge: "Map",
    badgeColor: "#6366f1",
    page: "map3d",
  },
  {
    id: "mod-carte",
    category: "Modules",
    title: "Carte interactive",
    subtitle: "Carte locale des services",
    meta: "→ Ouvrir",
    badge: "Carte",
    badgeColor: "#6366f1",
    page: "carte",
  },

  // ── Santé & Bien‑être ──
  {
    id: "mod-sante",
    category: "Modules",
    title: "Santé",
    subtitle: "Médecins, pharmacies, téléconsultation",
    meta: "→ Ouvrir",
    badge: "Santé",
    badgeColor: "#ef4444",
    page: "sante",
  },
  {
    id: "mod-fitness",
    category: "Modules",
    title: "Fitness & Sport",
    subtitle: "Programmes d'entraînement",
    meta: "→ Ouvrir",
    badge: "Fitness",
    badgeColor: "#f97316",
    page: "fitness",
  },
  {
    id: "mod-nutrition",
    category: "Modules",
    title: "Nutrition",
    subtitle: "Journal alimentaire & recettes",
    meta: "→ Ouvrir",
    badge: "Nutrition",
    badgeColor: "#84cc16",
    page: "nutrition",
  },
  {
    id: "mod-meditation",
    category: "Modules",
    title: "Méditation",
    subtitle: "Séances de respiration & pleine conscience",
    meta: "→ Ouvrir",
    badge: "Zen",
    badgeColor: "#a78bfa",
    page: "meditation",
  },
  {
    id: "mod-bienetre",
    category: "Modules",
    title: "Bien‑être Dashboard",
    subtitle: "Tableau de bord santé global",
    meta: "→ Ouvrir",
    badge: "Wellness",
    badgeColor: "#a78bfa",
    page: "bienetre",
  },
  {
    id: "mod-sport",
    category: "Modules",
    title: "Sport",
    subtitle: "Clubs, compétitions, résultats",
    meta: "→ Ouvrir",
    badge: "Sport",
    badgeColor: "#f97316",
    page: "sport",
  },
  {
    id: "mod-sos",
    category: "Modules",
    title: "SOS Urgences",
    subtitle: "Appels d'urgence et secours",
    meta: "→ Ouvrir",
    badge: "Urgence",
    badgeColor: "#ef4444",
    page: "sos",
  },

  // ── Éducation ──
  {
    id: "mod-apprendre",
    category: "Modules",
    title: "Apprendre",
    subtitle: "Cours en ligne & tutoriels",
    meta: "→ Ouvrir",
    badge: "Learn",
    badgeColor: "#6366f1",
    page: "apprendre",
  },
  {
    id: "mod-cours",
    category: "Modules",
    title: "Cours & Catalogue",
    subtitle: "Catalogue complet des formations",
    meta: "→ Ouvrir",
    badge: "Cours",
    badgeColor: "#6366f1",
    page: "cours",
  },
  {
    id: "mod-quiz",
    category: "Modules",
    title: "Quiz & Évaluations",
    subtitle: "Testez vos connaissances",
    meta: "→ Ouvrir",
    badge: "Quiz",
    badgeColor: "#8b5cf6",
    page: "quiz",
  },
  {
    id: "mod-certifs",
    category: "Modules",
    title: "Certifications",
    subtitle: "Diplômes & badges numériques",
    meta: "→ Ouvrir",
    badge: "Certif",
    badgeColor: "#f59e0b",
    page: "certifications",
  },
  {
    id: "mod-mentorat",
    category: "Modules",
    title: "Mentorat & Communauté",
    subtitle: "Mentors & groupes d'apprentissage",
    meta: "→ Ouvrir",
    badge: "Mentor",
    badgeColor: "#10b981",
    page: "mentorat",
  },
  {
    id: "mod-eduformelle",
    category: "Modules",
    title: "Éducation Formelle",
    subtitle: "Écoles, universités, inscriptions",
    meta: "→ Ouvrir",
    badge: "Académique",
    badgeColor: "#6366f1",
    page: "edu-formelle",
  },
  {
    id: "mod-ecole",
    category: "Modules",
    title: "École & Église",
    subtitle: "Calendrier scolaire & paroissial",
    meta: "→ Ouvrir",
    badge: "École",
    badgeColor: "#6366f1",
    page: "ecole",
  },

  // ── Finance & Paiements ──
  {
    id: "mod-wallet",
    category: "Modules",
    title: "Wallet & Portefeuille",
    subtitle: "Argent mobile & transferts",
    meta: "→ Ouvrir",
    badge: "Wallet",
    badgeColor: "#10b981",
    page: "wallet",
  },
  {
    id: "mod-paiement",
    category: "Modules",
    title: "Paiements",
    subtitle: "Mobile money, cartes, crypto",
    meta: "→ Ouvrir",
    badge: "Pay",
    badgeColor: "#10b981",
    page: "paiement",
  },
  {
    id: "mod-finances",
    category: "Modules",
    title: "Finances Personnelles",
    subtitle: "Budget, épargne, investissements",
    meta: "→ Ouvrir",
    badge: "Finance",
    badgeColor: "#10b981",
    page: "finances",
  },
  {
    id: "mod-dashboard",
    category: "Modules",
    title: "Dashboard",
    subtitle: "Tableau de bord global de l'app",
    meta: "→ Ouvrir",
    badge: "Stats",
    badgeColor: "#8b5cf6",
    page: "dashboard",
  },

  // ── Communauté & Social ──
  {
    id: "mod-community",
    category: "Modules",
    title: "Communauté",
    subtitle: "Forum, entraide & réseau local",
    meta: "→ Ouvrir",
    badge: "Community",
    badgeColor: "#ec4899",
    page: "community",
  },
  {
    id: "mod-groupes",
    category: "Modules",
    title: "Groupes",
    subtitle: "Groupes de discussion & clubs",
    meta: "→ Ouvrir",
    badge: "Groupes",
    badgeColor: "#ec4899",
    page: "groupes",
  },
  {
    id: "mod-messages",
    category: "Modules",
    title: "Messages",
    subtitle: "Chat privé & conversations",
    meta: "→ Ouvrir",
    badge: "Chat",
    badgeColor: "#6366f1",
    page: "messages",
  },
  {
    id: "mod-network",
    category: "Modules",
    title: "Réseau Professionnel",
    subtitle: "Connexions & opportunités business",
    meta: "→ Ouvrir",
    badge: "Network",
    badgeColor: "#8b5cf6",
    page: "network",
  },
  {
    id: "mod-parrainage",
    category: "Modules",
    title: "Parrainage",
    subtitle: "Invitez vos proches & gagnez des points",
    meta: "→ Ouvrir",
    badge: "Parrainage",
    badgeColor: "#f59e0b",
    page: "parrainage",
  },
  {
    id: "mod-reputation",
    category: "Modules",
    title: "Réputation",
    subtitle: "Avis, score & crédibilité",
    meta: "→ Ouvrir",
    badge: "Score",
    badgeColor: "#f59e0b",
    page: "reputation",
  },
  {
    id: "mod-cocreation",
    category: "Modules",
    title: "Co‑création",
    subtitle: "Projets collaboratifs & hackathons",
    meta: "→ Ouvrir",
    badge: "Collab",
    badgeColor: "#ec4899",
    page: "cocreation",
  },

  // ── Médias & Création ──
  {
    id: "mod-media",
    category: "Modules",
    title: "Médias & Actualités",
    subtitle: "News, podcasts, vidéos",
    meta: "→ Ouvrir",
    badge: "Media",
    badgeColor: "#f97316",
    page: "media",
  },
  {
    id: "mod-live",
    category: "Modules",
    title: "Live Stories",
    subtitle: "Vidéos en direct & stories",
    meta: "→ Ouvrir",
    badge: "Live",
    badgeColor: "#ef4444",
    page: "live",
  },
  {
    id: "mod-livestreaming",
    category: "Modules",
    title: "Live Streaming",
    subtitle: "Diffusion en direct professionnelle",
    meta: "→ Ouvrir",
    badge: "Stream",
    badgeColor: "#ef4444",
    page: "live-streaming",
  },
  {
    id: "mod-editeur",
    category: "Modules",
    title: "Éditeur de contenu",
    subtitle: "Créer articles, posts et pages",
    meta: "→ Ouvrir",
    badge: "Éditeur",
    badgeColor: "#8b5cf6",
    page: "editeur",
  },
  {
    id: "mod-studio",
    category: "Modules",
    title: "Studio Photo",
    subtitle: "Édition photo & filtres IA",
    meta: "→ Ouvrir",
    badge: "Photo",
    badgeColor: "#ec4899",
    page: "studio",
  },
  {
    id: "mod-storiescreator",
    category: "Modules",
    title: "Créateur de Stories",
    subtitle: "Créez des stories animées",
    meta: "→ Ouvrir",
    badge: "Stories",
    badgeColor: "#ec4899",
    page: "stories-creator",
  },
  {
    id: "mod-templates",
    category: "Modules",
    title: "Modèles & Templates",
    subtitle: "Templates prêts à l'emploi",
    meta: "→ Ouvrir",
    badge: "Templates",
    badgeColor: "#6366f1",
    page: "templates",
  },
  {
    id: "mod-pub",
    category: "Modules",
    title: "Publicité",
    subtitle: "Créer et gérer vos campagnes pub",
    meta: "→ Ouvrir",
    badge: "Pub",
    badgeColor: "#f97316",
    page: "pub",
  },

  // ── Événements ──
  {
    id: "mod-evenements",
    category: "Modules",
    title: "Événements",
    subtitle: "Concerts, foires, sorties",
    meta: "→ Ouvrir",
    badge: "Events",
    badgeColor: "#ec4899",
    page: "evenements",
  },
  {
    id: "mod-evenementspro",
    category: "Modules",
    title: "Événements Pro",
    subtitle: "Conférences, salons, networking",
    meta: "→ Ouvrir",
    badge: "Pro",
    badgeColor: "#ec4899",
    page: "evenements-pro",
  },
  {
    id: "mod-agenda",
    category: "Modules",
    title: "Agenda",
    subtitle: "Calendrier personnel & rappels",
    meta: "→ Ouvrir",
    badge: "Agenda",
    badgeColor: "#6366f1",
    page: "agenda",
  },

  // ── Agriculture & Environnement ──
  {
    id: "mod-agri",
    category: "Modules",
    title: "Agriculture",
    subtitle: "Intrants, prix, alertes phytosanitaires",
    meta: "→ Ouvrir",
    badge: "Agri",
    badgeColor: "#84cc16",
    page: "agri",
  },
  {
    id: "mod-environnement",
    category: "Modules",
    title: "Environnement",
    subtitle: "Écologie, climat, biodiversité",
    meta: "→ Ouvrir",
    badge: "Éco",
    badgeColor: "#84cc16",
    page: "environnement",
  },
  {
    id: "mod-energie",
    category: "Modules",
    title: "Énergie",
    subtitle: "Solaire, électricité, efficacité",
    meta: "→ Ouvrir",
    badge: "Énergie",
    badgeColor: "#f59e0b",
    page: "energie",
  },

  // ── Services & Administration ──
  {
    id: "mod-services",
    category: "Modules",
    title: "Services à la Personne",
    subtitle: "Aide à domicile, nettoyage, bricolage",
    meta: "→ Ouvrir",
    badge: "Services",
    badgeColor: "#6366f1",
    page: "services",
  },
  {
    id: "mod-restauration",
    category: "Modules",
    title: "Restauration",
    subtitle: "Restaurants, livraison repas",
    meta: "→ Ouvrir",
    badge: "Restau",
    badgeColor: "#f97316",
    page: "restauration",
  },
  {
    id: "mod-documents",
    category: "Modules",
    title: "Documents",
    subtitle: "Stockage & gestion de documents",
    meta: "→ Ouvrir",
    badge: "Docs",
    badgeColor: "#6366f1",
    page: "documents",
  },
  {
    id: "mod-juridique",
    category: "Modules",
    title: "Juridique",
    subtitle: "Aide légale & conseils juridiques",
    meta: "→ Ouvrir",
    badge: "Droit",
    badgeColor: "#8b5cf6",
    page: "juridique",
  },
  {
    id: "mod-justice",
    category: "Modules",
    title: "Justice",
    subtitle: "Accès au droit & procédures",
    meta: "→ Ouvrir",
    badge: "Justice",
    badgeColor: "#8b5cf6",
    page: "justice",
  },
  {
    id: "mod-ong",
    category: "Modules",
    title: "ONG & Solidarité",
    subtitle: "Actions humanitaires & bénévolat",
    meta: "→ Ouvrir",
    badge: "ONG",
    badgeColor: "#10b981",
    page: "ong",
  },
  {
    id: "mod-securite",
    category: "Modules",
    title: "Sécurité Publique",
    subtitle: "Alertes, signalements, prévention",
    meta: "→ Ouvrir",
    badge: "Sécurité",
    badgeColor: "#ef4444",
    page: "securite",
  },
  {
    id: "mod-datapublique",
    category: "Modules",
    title: "Data Publique",
    subtitle: "Données ouvertes & statistiques",
    meta: "→ Ouvrir",
    badge: "Data",
    badgeColor: "#6366f1",
    page: "data-publique",
  },
  {
    id: "mod-eglise",
    category: "Modules",
    title: "Église & Communauté religieuse",
    subtitle: "Services paroissiaux & annonces",
    meta: "→ Ouvrir",
    badge: "Religion",
    badgeColor: "#a78bfa",
    page: "eglise",
  },

  // ── Profil & Paramètres ──
  {
    id: "mod-profile",
    category: "Modules",
    title: "Mon Profil",
    subtitle: "Votre identité, badge et QR Code",
    meta: "→ Ouvrir",
    badge: "Profil",
    badgeColor: "#8b5cf6",
    page: "profile",
  },
  {
    id: "mod-premium",
    category: "Modules",
    title: "Premium",
    subtitle: "Plans premium & avantages",
    meta: "→ Ouvrir",
    badge: "Premium",
    badgeColor: "#f59e0b",
    page: "premium",
  },
  {
    id: "mod-recompenses",
    category: "Modules",
    title: "Récompenses",
    subtitle: "Points fidélité & cashback",
    meta: "→ Ouvrir",
    badge: "Points",
    badgeColor: "#f59e0b",
    page: "recompenses",
  },
  {
    id: "mod-favorites",
    category: "Modules",
    title: "Favoris",
    subtitle: "Vos contenus sauvegardés",
    meta: "→ Ouvrir",
    badge: "Favoris",
    badgeColor: "#ef4444",
    page: "favorites",
  },
  {
    id: "mod-notifications",
    category: "Modules",
    title: "Notifications",
    subtitle: "Alertes et messages reçus",
    meta: "→ Ouvrir",
    badge: "Notifs",
    badgeColor: "#6366f1",
    page: "notifications",
  },
  {
    id: "mod-settings",
    category: "Modules",
    title: "Paramètres",
    subtitle: "Langue, thème, confidentialité",
    meta: "→ Ouvrir",
    badge: "Config",
    badgeColor: "#6366f1",
    page: "settings",
  },
  {
    id: "mod-explorer",
    category: "Modules",
    title: "Explorer",
    subtitle: "Découvrir tous les modules",
    meta: "→ Ouvrir",
    badge: "Explorer",
    badgeColor: "#8b5cf6",
    page: "explorer",
  },
  {
    id: "mod-actions",
    category: "Modules",
    title: "Actions rapides",
    subtitle: "Raccourcis & actions contextuelles",
    meta: "→ Ouvrir",
    badge: "Actions",
    badgeColor: "#8b5cf6",
    page: "actions",
  },
];

// ── Original content results ───────────────────────────────────────────────

const CONTENT_RESULTS: SearchResult[] = [
  // Immo
  {
    id: "i1",
    category: "Immo",
    title: "Maison 3 ch. – Kolwezi",
    subtitle: "Quartier Joli Site",
    meta: "$450/mois",
    badge: "À louer",
    badgeColor: "#10b981",
    page: "immo",
  },
  {
    id: "i2",
    category: "Immo",
    title: "Studio meublé – Dakar Plateau",
    subtitle: "Dakar, Sénégal",
    meta: "85 000 FCFA/mois",
    badge: "Nouveau",
    badgeColor: "#6366f1",
    page: "immo",
  },
  {
    id: "i3",
    category: "Immo",
    title: "Villa avec piscine – Abidjan",
    subtitle: "Cocody, Côte d'Ivoire",
    meta: "$1 200/mois",
    badge: "Premium",
    badgeColor: "#f59e0b",
    page: "immo",
  },
  {
    id: "i4",
    category: "Immo",
    title: "Terrain 500m² – Bamako",
    subtitle: "ACI 2000, Mali",
    meta: "$8 000",
    badge: "À vendre",
    badgeColor: "#f97316",
    page: "immo",
  },

  // Jobs
  {
    id: "j1",
    category: "Jobs/Pro",
    title: "Développeur React Senior",
    subtitle: "TechAfrique – Dakar",
    meta: "2 500 000 FCFA/mois",
    badge: "Urgent",
    badgeColor: "#ef4444",
    page: "jobs",
  },
  {
    id: "j2",
    category: "Jobs/Pro",
    title: "Soudeur Métal expérimenté",
    subtitle: "Kolwezi Industries",
    meta: "$600/mois",
    badge: "CDI",
    badgeColor: "#10b981",
    page: "jobs",
  },
  {
    id: "j3",
    category: "Jobs/Pro",
    title: "Comptable certifié",
    subtitle: "Banque Atlantique – Abidjan",
    meta: "350 000 FCFA",
    badge: "CDD",
    badgeColor: "#6366f1",
    page: "jobs",
  },
  {
    id: "j4",
    category: "Jobs/Pro",
    title: "Chauffeur Uber Eats",
    subtitle: "Dakar, Sénégal",
    meta: "Commission 25%",
    badge: "Flexible",
    badgeColor: "#8b5cf6",
    page: "jobs",
  },

  // Santé
  {
    id: "s1",
    category: "Santé",
    title: "Dr Aminata Koné – Cardiologue",
    subtitle: "Clinique Avicenne, Abidjan",
    meta: "Disponible aujourd'hui",
    badge: "En ligne",
    badgeColor: "#10b981",
    page: "sante",
  },
  {
    id: "s2",
    category: "Santé",
    title: "Pharmacie Centrale Dakar",
    subtitle: "Plateau, Dakar",
    meta: "Ouvert 24h/24",
    badge: "Urgence",
    badgeColor: "#ef4444",
    page: "sante",
  },
  {
    id: "s3",
    category: "Santé",
    title: "Consultation générale",
    subtitle: "MediConnect Telehealth",
    meta: "5 000 FCFA / 15 min",
    badge: "Télé",
    badgeColor: "#6366f1",
    page: "sante",
  },

  // Agri
  {
    id: "a1",
    category: "Agri",
    title: "Sac de maïs 50kg",
    subtitle: "Coopérative Sahel Vert",
    meta: "12 500 FCFA",
    badge: "Stock OK",
    badgeColor: "#10b981",
    page: "agri",
  },
  {
    id: "a2",
    category: "Agri",
    title: "Engrais NPK 25kg",
    subtitle: "AgroInputs Mali",
    meta: "8 000 FCFA",
    badge: "Promo -10%",
    badgeColor: "#f97316",
    page: "agri",
  },
  {
    id: "a3",
    category: "Agri",
    title: "Alerte : Criquet pèlerin",
    subtitle: "Zone nord Sénégal",
    meta: "Risque élevé",
    badge: "Alerte",
    badgeColor: "#ef4444",
    page: "agri",
  },

  // Media
  {
    id: "m1",
    category: "Media",
    title: "Sommet UA : les décisions clés",
    subtitle: "Politique · il y a 2h",
    meta: "8 min de lecture",
    badge: "Trending",
    badgeColor: "#f97316",
    page: "media",
  },
  {
    id: "m2",
    category: "Media",
    title: "Podcast : Entrepreneuriat en Afrique",
    subtitle: "Business Africa FM",
    meta: "45 min",
    badge: "Nouveau",
    badgeColor: "#6366f1",
    page: "media",
  },
  {
    id: "m3",
    category: "Media",
    title: "AFCON 2025 : résultats du jour",
    subtitle: "Sport · il y a 1h",
    meta: "3 min de lecture",
    badge: "Sport",
    badgeColor: "#10b981",
    page: "media",
  },

  // Événements
  {
    id: "e1",
    category: "Événements",
    title: "Foire Internationale de Dakar",
    subtitle: "CICES, Dakar",
    meta: "15-22 mars 2024",
    badge: "Gratuit",
    badgeColor: "#10b981",
    page: "evenements",
  },
  {
    id: "e2",
    category: "Événements",
    title: "Concert Burna Boy",
    subtitle: "Stade Léopold Sédar Senghor",
    meta: "25 000 FCFA",
    badge: "Chaud 🔥",
    badgeColor: "#ef4444",
    page: "evenements",
  },
  {
    id: "e3",
    category: "Événements",
    title: "Tech Summit Africa 2024",
    subtitle: "Sofitel Abidjan",
    meta: "50 000 FCFA",
    badge: "Pro",
    badgeColor: "#6366f1",
    page: "evenements",
  },

  // Voyages
  {
    id: "v1",
    category: "Voyages",
    title: "Dakar → Abidjan",
    subtitle: "Trans-Sahel Express",
    meta: "18 500 FCFA · 15h30",
    badge: "Bus",
    badgeColor: "#f97316",
    page: "voyages",
  },
  {
    id: "v2",
    category: "Voyages",
    title: "Dakar → Bamako",
    subtitle: "Rapid Sahel",
    meta: "9 500 FCFA · 12h",
    badge: "Minibus",
    badgeColor: "#10b981",
    page: "voyages",
  },
  {
    id: "v3",
    category: "Voyages",
    title: "Abidjan → Accra",
    subtitle: "Air Afrique Connect",
    meta: "85 000 FCFA · 2h30",
    badge: "Avion",
    badgeColor: "#6366f1",
    page: "voyages",
  },

  // Bien‑être
  {
    id: "be1",
    category: "Bien‑être",
    title: "Séance HIIT 30 min",
    subtitle: "Fitness · Niveau intermédiaire",
    meta: "300 kcal",
    badge: "Fitness",
    badgeColor: "#f97316",
    page: "fitness",
  },
  {
    id: "be2",
    category: "Bien‑être",
    title: "Méditation pleine conscience",
    subtitle: "10 min · Débutant",
    meta: "Gratuit",
    badge: "Zen",
    badgeColor: "#a78bfa",
    page: "meditation",
  },
  {
    id: "be3",
    category: "Bien‑être",
    title: "Recette : Thiébou djeun allégé",
    subtitle: "Nutrition · 450 kcal",
    meta: "35 min",
    badge: "Recette",
    badgeColor: "#84cc16",
    page: "nutrition",
  },

  // Éducation
  {
    id: "ed1",
    category: "Éducation",
    title: "Cours JavaScript complet",
    subtitle: "TechAfrika Academy",
    meta: "6h · Débutant → Pro",
    badge: "Populaire",
    badgeColor: "#6366f1",
    page: "cours",
  },
  {
    id: "ed2",
    category: "Éducation",
    title: "Quiz : Histoire de l'Afrique",
    subtitle: "Éducation générale · 20 questions",
    meta: "~15 min",
    badge: "Quiz",
    badgeColor: "#8b5cf6",
    page: "quiz",
  },
  {
    id: "ed3",
    category: "Éducation",
    title: "Certification Marketing Digital",
    subtitle: "Reconnue CEDEAO",
    meta: "Gratuit",
    badge: "Certif",
    badgeColor: "#f59e0b",
    page: "certifications",
  },

  // Finance
  {
    id: "fi1",
    category: "Finance",
    title: "Transfert Orange Money",
    subtitle: "Dakar → Bamako instantané",
    meta: "0.5% de frais",
    badge: "Mobile Money",
    badgeColor: "#10b981",
    page: "paiement",
  },
  {
    id: "fi2",
    category: "Finance",
    title: "Épargne tontine numérique",
    subtitle: "Groupe 10 personnes · 50 000 FCFA/mois",
    meta: "Rotation mensuelle",
    badge: "Épargne",
    badgeColor: "#6366f1",
    page: "finances",
  },
  {
    id: "fi3",
    category: "Finance",
    title: "Solde portefeuille",
    subtitle: "Wallet DébrouillApp",
    meta: "125 500 FCFA",
    badge: "Wallet",
    badgeColor: "#10b981",
    page: "wallet",
  },

  // Communauté
  {
    id: "co1",
    category: "Communauté",
    title: "Groupe Diaspora Sénégal France",
    subtitle: "2 340 membres",
    meta: "Très actif",
    badge: "Groupe",
    badgeColor: "#ec4899",
    page: "groupes",
  },
  {
    id: "co2",
    category: "Communauté",
    title: "Forum Entrepreneuriat Africain",
    subtitle: "Communauté · 5 600 membres",
    meta: "128 posts cette semaine",
    badge: "Forum",
    badgeColor: "#ec4899",
    page: "community",
  },
  {
    id: "co3",
    category: "Communauté",
    title: "Mentorat : Marie Diallo – Fintech",
    subtitle: "Mentor certifiée",
    meta: "3 créneaux dispo",
    badge: "Mentor",
    badgeColor: "#10b981",
    page: "mentorat",
  },

  // Services
  {
    id: "sv1",
    category: "Services",
    title: "Restaurant Le Baobab",
    subtitle: "Cuisine africaine · Dakar Plateau",
    meta: "Note 4.8 ★",
    badge: "Ouvert",
    badgeColor: "#f97316",
    page: "restauration",
  },
  {
    id: "sv2",
    category: "Services",
    title: "Avocat en droit du travail",
    subtitle: "Maître Traoré · Abidjan",
    meta: "Consultation 25 000 FCFA",
    badge: "Juridique",
    badgeColor: "#8b5cf6",
    page: "juridique",
  },
  {
    id: "sv3",
    category: "Services",
    title: "Hôtel Teranga Palace",
    subtitle: "Dakar, Sénégal · 4 étoiles",
    meta: "$85/nuit",
    badge: "Hôtel",
    badgeColor: "#10b981",
    page: "hebergement",
  },
];

const ALL_RESULTS: SearchResult[] = [...MODULE_ENTRIES, ...CONTENT_RESULTS];

const TRENDING = [
  "Appartement Dakar",
  "Emploi soudeur",
  "Trajet Bamako",
  "Concert Abidjan",
  "Maïs 50kg",
  "Fitness",
  "Cours JavaScript",
];

const CATEGORY_ICONS: Record<ResultCategory, React.ReactNode> = {
  Immo: <Home size={13} />,
  "Jobs/Pro": <Briefcase size={13} />,
  Santé: <Stethoscope size={13} />,
  Agri: <Leaf size={13} />,
  Media: <Newspaper size={13} />,
  Événements: <Calendar size={13} />,
  Voyages: <Plane size={13} />,
  Modules: <LayoutGrid size={13} />,
  "Bien‑être": <Heart size={13} />,
  Éducation: <BookOpen size={13} />,
  Finance: <Wallet size={13} />,
  Communauté: <Users size={13} />,
  Services: <Package size={13} />,
};

const CATEGORY_COLORS: Record<ResultCategory, string> = {
  Immo: "#10b981",
  "Jobs/Pro": "#8b5cf6",
  Santé: "#ef4444",
  Agri: "#84cc16",
  Media: "#f97316",
  Événements: "#ec4899",
  Voyages: "#6366f1",
  Modules: "#a78bfa",
  "Bien‑être": "#f472b6",
  Éducation: "#38bdf8",
  Finance: "#34d399",
  Communauté: "#fb7185",
  Services: "#fbbf24",
};

// ── Unused icon imports suppressed ─────────────────────────────────────────
// (MapPin, Music, Camera, Star, MessageSquare, Bell, Map, Truck, FileText,
//  Award, Video, Cpu, Network, Megaphone, Database, Lock, TreePine, Factory,
//  Church, GraduationCap, BarChart2, Navigation, ShoppingCart, Gift, Compass,
//  Flame, ShoppingBag, Car, Zap, Shield, Globe, Building2, Dumbbell, Mic)
// kept for future use — safe to tree-shake
void [
  MapPin,
  Music,
  Camera,
  Star,
  MessageSquare,
  Bell,
  Map,
  Truck,
  FileText,
  Award,
  Video,
  Cpu,
  Network,
  Megaphone,
  Database,
  Lock,
  TreePine,
  Factory,
  Church,
  GraduationCap,
  BarChart2,
  Navigation,
  ShoppingCart,
  Gift,
  Compass,
  Flame,
  ShoppingBag,
  Car,
  Zap,
  Shield,
  Globe,
  Building2,
  Dumbbell,
];

const HISTORY_KEY = "debrouille_search_history";

function getHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function saveHistory(query: string) {
  const prev = getHistory().filter((h) => h !== query);
  const next = [query, ...prev].slice(0, 8);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

function removeHistory(query: string) {
  const next = getHistory().filter((h) => h !== query);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

// ── Component ──────────────────────────────────────────────────────────────

interface SmartSearchProps {
  onNavigate: (page: string) => void;
  onAdvancedSearch?: () => void;
}

function normalizeSearchValue(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function categoryFromType(type: unknown): ResultCategory {
  const value = normalizeSearchValue(type);

  if (["job", "emploi", "employment"].includes(value)) return "Jobs/Pro";
  if (
    ["property", "immo", "immobilier", "realestate", "real_estate"].includes(
      value,
    )
  )
    return "Immo";
  if (["sante", "health", "medical"].includes(value)) return "Santé";
  if (["agri", "agriculture"].includes(value)) return "Agri";
  if (["evenement", "evenements", "event", "events"].includes(value))
    return "Événements";
  if (["voyage", "voyages", "travel"].includes(value)) return "Voyages";
  if (["education", "apprendre", "course", "cours"].includes(value))
    return "Éducation";
  if (["finance", "paiement", "wallet", "pay"].includes(value))
    return "Finance";
  if (["community", "communaute", "group", "groupe"].includes(value))
    return "Communauté";
  if (["service", "services"].includes(value)) return "Services";
  if (["media", "article", "video", "podcast"].includes(value)) return "Media";
  if (["fitness", "sport", "nutrition", "bienetre", "wellness"].includes(value))
    return "Bien‑être";

  return "Services";
}

function getPageForCategory(category: ResultCategory): string {
  const pages: Partial<Record<ResultCategory, string>> = {
    Immo: "immo",
    "Jobs/Pro": "jobs",
    Santé: "sante",
    Agri: "agri",
    Media: "media",
    Événements: "evenements",
    Voyages: "voyages",
    "Bien‑être": "bienetre",
    Éducation: "cours",
    Finance: "finances",
    Communauté: "community",
    Services: "services",
  };

  return pages[category] ?? "explorer";
}

export default function SmartSearch({
  onNavigate,
  onAdvancedSearch,
}: SmartSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [history, setHistory] = useState<string[]>(() => getHistory());
  const [activeCategory, setActiveCategory] = useState<ResultCategory | "Tout">(
    "Tout",
  );
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const liveData = useQuery(
    api.search.smartSearch,
    query.trim().length >= 2 ? { query: query.trim() } : "skip",
  );

  useEffect(() => {
    setIsVoiceSupported(
      typeof undefined !== "undefined" &&
        ("SpeechRecognition" in undefined || "webkitSpeechRecognition" in undefined),
    );
  }, []);

  const liveResults = useMemo<SearchResult[]>(() => {
    if (!liveData) return [];

    const mapped: SearchResult[] = [];

    for (const r of liveData.publications) {
      const category = categoryFromType(r.type);
      mapped.push({
        id: `live-pub-${r._id}`,
        category,
        title: r.title,
        subtitle: r.location ?? r.type ?? "Contenu DébrouillePro",
        meta: r.price ?? "",
        badge: "En direct",
        badgeColor: CATEGORY_COLORS[category],
        page: getPageForCategory(category),
      });
    }

    for (const r of liveData.jobs) {
      mapped.push({
        id: `live-job-${r._id}`,
        category: "Jobs/Pro",
        title: r.title,
        subtitle: `${r.company} – ${r.city}`,
        meta: r.contractType.toUpperCase(),
        badge: "En direct",
        badgeColor: CATEGORY_COLORS["Jobs/Pro"],
        page: "jobs",
      });
    }

    for (const r of liveData.properties) {
      mapped.push({
        id: `live-prop-${r._id}`,
        category: "Immo",
        title: r.title,
        subtitle: `${r.type} – ${r.city}`,
        meta: `${r.price.toLocaleString()} FCFA`,
        badge: "En direct",
        badgeColor: CATEGORY_COLORS.Immo,
        page: "immo",
      });
    }

    for (const r of liveData.courses) {
      mapped.push({
        id: `live-course-${r._id}`,
        category: "Éducation",
        title: r.title,
        subtitle: r.category,
        meta: r.isFree ? "Gratuit" : `${r.price.toLocaleString()} FCFA`,
        badge: "En direct",
        badgeColor: CATEGORY_COLORS.Éducation,
        page: "cours",
      });
    }

    return mapped;
  }, [liveData]);

  const staticResults = useMemo<SearchResult[]>(() => {
    const normalizedQuery = normalizeSearchValue(query);
    if (normalizedQuery.length < 2) return [];

    return ALL_RESULTS.filter((result) => {
      if (activeCategory !== "Tout" && result.category !== activeCategory) {
        return false;
      }

      return [result.title, result.subtitle, result.category, result.badge]
        .filter(Boolean)
        .some((value) => normalizeSearchValue(value).includes(normalizedQuery));
    });
  }, [query, activeCategory]);

  const filteredLiveResults = useMemo(
    () =>
      activeCategory === "Tout"
        ? liveResults
        : liveResults.filter((result) => result.category === activeCategory),
    [activeCategory, liveResults],
  );

  const results = useMemo(
    () => [...filteredLiveResults, ...staticResults],
    [filteredLiveResults, staticResults],
  );

  const grouped = useMemo(
    () =>
      results.reduce<Partial<Record<ResultCategory, SearchResult[]>>>(
        (acc, result) => {
          (acc[result.category] ??= []).push(result);
          return acc;
        },
        {},
      ),
    [results],
  );

  const groupedEntries = useMemo(
    () =>
      (Object.entries(grouped) as [ResultCategory, SearchResult[]][]).sort(
        ([a], [b]) => {
          if (a === "Modules") return -1;
          if (b === "Modules") return 1;
          return 0;
        },
      ),
    [grouped],
  );

  const allCategories: (ResultCategory | "Tout")[] = [
    "Tout",
    "Modules",
    "Immo",
    "Jobs/Pro",
    "Santé",
    "Agri",
    "Media",
    "Événements",
    "Voyages",
    "Bien‑être",
    "Éducation",
    "Finance",
    "Communauté",
    "Services",
  ];

  const quickModules = MODULE_ENTRIES.slice(0, 12);

  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery("");
    setListening(false);
    setActiveCategory("Tout");
  }, []);

  const handleOpen = useCallback(() => {
    setOpen(true);
    undefined;
  }, []);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      saveHistory(result.title);
      setHistory(getHistory());
      handleClose();
      onNavigate(result.page);
    },
    [handleClose, onNavigate],
  );

  const handleHistorySelect = useCallback((value: string) => {
    setQuery(value);
    setActiveCategory("Tout");
    undefined;
  }, []);

  const handleRemoveHistory = useCallback(
    (value: string, event: GestureResponderEvent) => {
      removeHistory(value);
      setHistory(getHistory());
    },
    [],
  );

  const handleVoice = useCallback(() => {
    if (!isVoiceSupported || listening) return;

    const SpeechRecognitionAPI =
      (
        undefined as Window & {
          webkitSpeechRecognition?: new () => {
            lang: string;
            interimResults: boolean;
            onstart: (() => void) | null;
            onend: (() => void) | null;
            onerror: (() => void) | null;
            onresult:
              | ((event: {
                  results: Array<ArrayLike<{ transcript: string }>>;
                }) => void)
              | null;
            start: () => void;
          };
        }
      ).webkitSpeechRecognition ??
      (
        undefined as Window & {
          SpeechRecognition?: new () => {
            lang: string;
            interimResults: boolean;
            onstart: (() => void) | null;
            onend: (() => void) | null;
            onerror: (() => void) | null;
            onresult:
              | ((event: {
                  results: Array<ArrayLike<{ transcript: string }>>;
                }) => void)
              | null;
            start: () => void;
          };
        }
      ).SpeechRecognition;

    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "fr-FR";
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setQuery(transcript);
      setActiveCategory("Tout");
    };

    recognition.start();
  }, [isVoiceSupported, listening]);

  const handleSubmit = useCallback((value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 2) return;
    saveHistory(trimmed);
    setHistory(getHistory());
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };

    undefined;
    return () => undefined;
  }, [handleClose, open]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = undefined.style.overflow;
    undefined.style.overflow = "hidden";

    return () => {
      undefined.style.overflow = previousOverflow;
    };
  }, [open]);

  const showResults = query.trim().length >= 2;
  const resultCategoryCount = Object.keys(grouped).length;

  return (
    <>
      {/* ===================================================================== */}
      {/* Trigger                                                               */}
      {/* ===================================================================== */}
      <View
        className="mx-5 mt-3"
      >
        <Pressable
         
          onPress={handleOpen}
          accessibilityLabel="Ouvrir la recherche intelligente"
          className="group relative flex w-full items-center gap-3 overflow-hidden rounded-[20px] border border-white/[0.08] bg-white/[0.06] px-4 py-3 text-left shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
        >
          <Text className="absolute inset-0 bg-gradient-to-r from-violet-500/[0.04] via-transparent to-indigo-500/[0.04]" />

          <Text className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.06]">
            <Search
              size={17}
              className="text-white/55"
            />
          </Text>

          <Text className="relative min-w-0 flex-1">
            <Text className="block truncate text-sm font-medium text-white/40">
              Rechercher dans 80+ modules...
            </Text>
            <Text className="mt-0.5 block text-[9px] text-white/20">
              Services · emplois · immobilier · événements · contenus
            </Text>
          </Text>

          <Text className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-[0_6px_20px_rgba(99,102,241,0.28)]">
            <Mic size={14} className="text-white" />
          </Text>
        </Pressable>

        {onAdvancedSearch && (
          <Pressable
           
            onPress={onAdvancedSearch}
            className="mt-1.5 flex w-full items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium text-violet-400/70"
          >
            <Sparkles size={11} />
            <Text>Recherche avancée</Text><Text className="text-white/15">·</Text>
            <Text>Tendances</Text></Pressable>
        )}
      </View>

      {/* ===================================================================== */}
      {/* Full screen search                                                    */}
      {/* ===================================================================== */}
      <>
        {open && (
          <View
            className="fixed inset-0 z-[100] flex flex-col bg-[#030511]/95"
            accessibilityRole="dialog"
            aria-modal="true"
            accessibilityLabel="Recherche DébrouillePro"
          >
            {/* Ambient lighting */}
            <View
             
              className="absolute -top-32 left-1/2 h-80 w-[650px] -translate-x-1/2 rounded-full bg-violet-600/[0.10]"
            />
            <View
             
              className="absolute right-[-120px] top-1/3 h-64 w-64 rounded-full bg-indigo-500/[0.07]"
            />

            {/* Header */}
            <View className="relative shrink-0 px-4 pb-3 pt-[max(16px,env(safe-area-inset-top))] sm:px-6">
              <View className="mx-auto max-w-3xl">
                <View className="mb-3 flex items-center justify-between">
                  <View>
                    <Text className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-300/70">
                      DébrouillePro Search
                    </Text>
                    <Text className="mt-0.5 text-lg font-bold text-white">
                      Que cherches-tu ?
                    </Text>
                  </View>

                  <Pressable
                   
                    onPress={handleClose}
                    accessibilityLabel="Fermer la recherche"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.05] text-white/45"
                  >
                    <X size={17} />
                  </Pressable>
                </View>

                <View className="flex items-center gap-2 rounded-[20px] border border-violet-400/25 bg-white/[0.08] px-3 py-2.5 shadow-[0_12px_45px_rgba(0,0,0,0.20)]">
                  <Search size={18} className="shrink-0 text-violet-300" />
                  <TextInput
                    ref={inputRef}
                    value={query}
                    onChangeText={(text) => {
                      setQuery(text);
                      setActiveCategory("Tout");
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") handleSubmit(query);
                    }}
                    placeholder="Modules, services, emplois, contenus..."
                    className="min-w-0 flex-1 bg-transparent py-1 text-sm text-white outline-none placeholder:text-white/25"
                   
                    autoCapitalize="off"
                   
                  />

                  {query && (
                    <Pressable
                     
                      onPress={() => setQuery("")}
                      accessibilityLabel="Effacer la recherche"
                      className="shrink-0 rounded-lg p-1.5 text-white/30"
                    >
                      <X size={15} />
                    </Pressable>
                  )}

                  {isVoiceSupported && (
                    <Pressable
                     
                      onPress={handleVoice}
                      accessibilityLabel={
                        listening
                          ? "Arrêter la dictée"
                          : "Rechercher avec la voix"
                      }
                      aria-pressed={listening}
                      className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 ${listening ? "bg-red-500/20 text-red-300 ring-1 ring-red-400/30" : "bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-[0_5px_18px_rgba(99,102,241,0.30)] hover:scale-[1.03]"}`}
                    >
                      <Mic
                        size={14}
                        className={listening ? "animate-pulse" : ""}
                      />
                    </Pressable>
                  )}
                </View>

                {showResults && results.length > 0 && (
                  <View
                    className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]"
                  >
                    {allCategories.map((category) => {
                      const count =
                        category === "Tout"
                          ? results.length
                          : (grouped[category as ResultCategory]?.length ?? 0);

                      if (category !== "Tout" && count === 0) return null;

                      const color =
                        category === "Tout"
                          ? "#a78bfa"
                          : CATEGORY_COLORS[category as ResultCategory];

                      const active = activeCategory === category;

                      return (
                        <Pressable
                          key={category}
                         
                          onPress={() => setActiveCategory(category)}
                          className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold"
                          style={{ backgroundColor: active
                                                        ? `${color}22`
                                                        : "rgba(255,255,255,0.04)", borderColor: active
                                                        ? `${color}66`
                                                        : "rgba(255,255,255,0.07)" }}
                        >
                          {category !== "Tout" && (
                            <Text style={{ color }}>
                              {CATEGORY_ICONS[category as ResultCategory]}
                            </Text>
                          )}
                          {category}
                          <Text className="text-white/30">{count}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>

            {/* Body */}
            <View className="relative flex-1 overflow-y-auto px-4 pb-10 [scrollbar-width:none] sm:px-6">
              <View className="mx-auto max-w-3xl">
                {!showResults && (
                  <View className="space-y-7 pt-3">
                    {/* Quick access */}
                    <View>
                      <SectionLabel icon={<LayoutGrid size={12} />}>
                        <Text>Accès rapide</Text></SectionLabel>

                      <View className="gap-2">
                        {quickModules.map((module, index) => (
                          <Pressable
                            key={module.id}
                            onPress={() => handleSelect(module)}
                            className="group flex flex-col items-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.04] p-3 text-center"
                          >
                            <Text
                              className="flex h-9 w-9 items-center justify-center rounded-xl"
                              style={{ backgroundColor: `${module.badgeColor ?? "#8b5cf6"}1f` }}
                            >
                              <LayoutGrid
                                size={15}
                                style={{
                                  color: module.badgeColor ?? "#a78bfa",
                                }}
                              />
                            </Text>
                            <Text className="text-[11px] font-medium leading-tight text-white/65">
                              {module.title}
                            </Text>
                          </Pressable>
                        ))}
                      </View>

                      <Pressable
                       
                        onPress={() => setQuery("module")}
                        className="mt-2 flex w-full items-center justify-center gap-1 py-2 text-[11px] font-semibold text-violet-400"
                      >
                        <Text>Voir tous les modules</Text><ArrowUpRight size={11} />
                      </Pressable>
                    </View>

                    {/* History */}
                    {history.length > 0 && (
                      <View>
                        <View className="mb-3 flex items-center justify-between">
                          <SectionLabel icon={<Clock size={12} />}>
                            <Text>Récent</Text></SectionLabel>
                          <Pressable
                           
                            onPress={() => {
                              localStorage.removeItem(HISTORY_KEY);
                              setHistory([]);
                            }}
                            className="text-[11px] font-medium text-violet-400"
                          >
                            <Text>Effacer</Text></Pressable>
                        </View>

                        <View className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.025]">
                          {history.map((item, index) => (
                            <Pressable
                              key={item}
                             
                              onPress={() => handleHistorySelect(item)}
                              className={`group flex w-full cursor-pointer items-center gap-3 px-3 py-3 text-left transition hover:bg-white/[0.05] ${index !== 0 ? "border-t border-white/[0.05]" : ""}`}
                            >
                              <Clock
                                size={14}
                                className="shrink-0 text-white/20"
                              />
                              <Text className="min-w-0 flex-1 truncate text-sm text-white/60">
                                {item}
                              </Text>
                              <Text
                                accessibilityRole="button"
                                tabIndex={0}
                                accessibilityLabel={`Supprimer ${item}`}
                                onPress={(event) =>
                                  handleRemoveHistory(item, event)
                                }
                                onKeyDown={(event) => {
                                  if (
                                    event.key === "Enter" ||
                                    event.key === " "
                                  ) {
                                    handleRemoveHistory(
                                      item,
                                      event as unknown as GestureResponderEvent,
                                    );
                                  }
                                }}
                                className="rounded-lg p-1 text-white/15 opacity-0"
                              >
                                <X size={12} />
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Trending */}
                    <View>
                      <SectionLabel icon={<TrendingUp size={12} />}>
                        <Text>Tendances</Text></SectionLabel>
                      <View className="flex flex-wrap gap-2">
                        {TRENDING.map((item, index) => (
                          <Pressable
                            key={item}
                            onPress={() => setQuery(item)}
                            className="flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white/50"
                          >
                            <TrendingUp
                              size={11}
                              className="text-orange-400/80"
                            />
                            {item}
                          </Pressable>
                        ))}
                      </View>
                    </View>

                    {/* AI insight */}
                    <View className="relative overflow-hidden rounded-2xl border border-violet-400/[0.14] bg-gradient-to-br from-violet-500/[0.11] via-indigo-500/[0.06] to-transparent p-4">
                      <View
                       
                        className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-violet-500/10"
                      />
                      <View className="relative flex items-start gap-3">
                        <Text className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                          <Sparkles size={16} />
                        </Text>
                        <View className="min-w-0">
                          <Text className="text-[10px] font-bold uppercase tracking-wider text-violet-300/80">
                            DébrouilleAI
                          </Text>
                          <Text className="mt-1 text-sm leading-relaxed text-white/65">
                            Je peux t'aider à trouver un emploi, un logement, un
                            service ou une opportunité plus rapidement.
                          </Text>
                          <Pressable
                           
                            onPress={() => setQuery("emploi")}
                            className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-violet-300"
                          >
                            <Text>Explorer les opportunités</Text><ArrowUpRight size={11} />
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {showResults && results.length === 0 && (
                  <View
                    className="flex flex-col items-center justify-center py-20 text-center"
                  >
                    <Text className="flex h-16 w-16 items-center justify-center rounded-3xl border border-white/[0.07] bg-white/[0.04]">
                      <Search size={24} className="text-white/20" />
                    </Text>
                    <Text className="mt-5 text-sm font-medium text-white/50">
                      Aucun résultat trouvé
                    </Text>
                    <Text className="mt-1 max-w-xs truncate text-sm font-semibold text-white">
                      « {query.trim()} »
                    </Text>
                    <Text className="mt-3 text-xs text-white/25">
                      Essaie un autre mot-clé ou explore les modules.
                    </Text>
                  </View>
                )}

                {showResults && results.length > 0 && (
                  <View
                    className="space-y-6 pb-6 pt-2"
                  >
                    <View className="flex items-center justify-between">
                      <Text className="flex items-center gap-1.5 text-[11px] text-white/30">
                        <Sparkles size={11} className="text-violet-400" />
                        <Text className="font-semibold text-white/55">
                          {results.length}
                        </Text>
                        résultat{results.length > 1 ? "s" : ""}
                      </Text>
                      <Text className="text-[10px] text-white/20">
                        {resultCategoryCount} catégorie
                        {resultCategoryCount > 1 ? "s" : ""}
                      </Text>
                    </View>

                    {groupedEntries.map(([category, items]) => {
                      const color = CATEGORY_COLORS[category];

                      return (
                        <View key={category}>
                          <View className="mb-2.5 flex items-center gap-2">
                            <Text
                              className="flex h-6 w-6 items-center justify-center rounded-lg"
                              style={{ color, backgroundColor: `${color}18`, borderStyle: "solid" }}
                            >
                              {CATEGORY_ICONS[category]}
                            </Text>
                            <Text
                              className="text-[10px] font-bold uppercase tracking-[0.14em]"
                              style={{ color }}
                            >
                              {category}
                            </Text>
                            <Text className="ml-auto text-[10px] text-white/20">
                              {items.length}
                            </Text>
                          </View>

                          {category === "Modules" ? (
                            <View className="gap-1.5">
                              {items.map((result, index) => (
                                <ResultRow
                                  key={result.id}
                                  result={result}
                                  index={index}
                                  compact
                                  onSelect={handleSelect}
                                />
                              ))}
                            </View>
                          ) : (
                            <View className="space-y-1.5">
                              {items.map((result, index) => (
                                <ResultRow
                                  key={result.id}
                                  result={result}
                                  index={index}
                                  onSelect={handleSelect}
                                />
                              ))}
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
      </>
    </>
  );
}

function SectionLabel({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Text className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
      {icon}
      {children}
    </Text>
  );
}

function ResultRow({
  result,
  index,
  compact = false,
  onSelect,
}: {
  result: SearchResult;
  index: number;
  compact?: boolean;
  onSelect: (result: SearchResult) => void;
}) {
  const color = result.badgeColor ?? CATEGORY_COLORS[result.category];

  return (
    <Pressable
      onPress={() => onSelect(result)}
      className={`group w-full cursor-pointer rounded-xl border border-white/[0.06] bg-white/[0.035] text-left transition-all hover:border-white/[0.13] hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 ${compact ? "flex items-center gap-2.5 px-3 py-2.5" : "flex items-center gap-3 px-3.5 py-3"}`}
    >
      <Text
        className={`${compact ? "h-8 w-8 rounded-lg" : "h-9 w-9 rounded-xl"} flex shrink-0 items-center justify-center`}
        style={{ color, backgroundColor: `${color}18`, borderStyle: "solid" }}
      >
        {CATEGORY_ICONS[result.category]}
      </Text>

      <Text className="min-w-0 flex-1">
        <Text className="block truncate text-sm font-semibold text-white/85">
          {result.title}
        </Text>
        <Text className="mt-0.5 block truncate text-[11px] text-white/35">
          {result.subtitle}
        </Text>
      </Text>

      <Text className="flex shrink-0 flex-col items-end gap-1">
        {result.meta && (
          <Text className="max-w-[120px] truncate text-[10px] font-semibold text-white/45">
            {result.meta}
          </Text>
        )}
        {result.badge && (
          <Text
            className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
            style={{ color, backgroundColor: `${color}18` }}
          >
            {result.badge === "En direct" && (
              <Radio size={8} className="animate-pulse" />
            )}
            {result.badge}
          </Text>
        )}
      </Text>

      <ChevronRight
        size={13}
        className="shrink-0 text-white/15"
      />
    </Pressable>
  );
}
