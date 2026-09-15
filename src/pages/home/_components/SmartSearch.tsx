// src/pages/home/_components/SmartSearch.tsx
import {
  View,
  Pressable,
  Text,
  TextInput,
  ScrollView,
  Animated,
  Easing,
  StyleSheet,
  Platform,
  Modal,
  Keyboard,
  useWindowDimensions,
  type GestureResponderEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
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
  ChevronRight,
  Sparkles,
  Package,
  LayoutGrid,
  Heart,
  BookOpen,
  Wallet,
  Users,
  Radio,
} from "lucide-react-native";

const isBrowser = typeof window !== "undefined";

/* ============================================================
 * TYPES
 * ============================================================ */

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

/* ============================================================
 * MODULE DIRECTORY (80+ modules)
 * ============================================================ */

const MODULE_ENTRIES: SearchResult[] = [
  {
    id: "mod-immo",
    category: "Modules",
    title: "Immobilier",
    subtitle: "Locations, ventes, terrains",
    meta: "→ Ouvrir",
    badge: "Immo",
    badgeColor: "#34D399",
    page: "immo",
  },
  {
    id: "mod-logement",
    category: "Modules",
    title: "Logement social",
    subtitle: "Programmes sociaux & coopératives",
    meta: "→ Ouvrir",
    badge: "Logement",
    badgeColor: "#34D399",
    page: "logement",
  },
  {
    id: "mod-hebergement",
    category: "Modules",
    title: "Hébergement",
    subtitle: "Hôtels, AirBnB, auberges",
    meta: "→ Ouvrir",
    badge: "Hôtels",
    badgeColor: "#34D399",
    page: "hebergement",
  },
  {
    id: "mod-urbanisme",
    category: "Modules",
    title: "Urbanisme",
    subtitle: "Permis de construire, plans d'occupation",
    meta: "→ Ouvrir",
    badge: "Urbain",
    badgeColor: "#818CF8",
    page: "urbanisme",
  },
  {
    id: "mod-amenagement",
    category: "Modules",
    title: "Aménagement",
    subtitle: "Projets d'aménagement territorial",
    meta: "→ Ouvrir",
    badge: "Territoire",
    badgeColor: "#818CF8",
    page: "amenagement",
  },
  {
    id: "mod-cityhabitat",
    category: "Modules",
    title: "City‑Habitat",
    subtitle: "Habitat urbain intelligent",
    meta: "→ Ouvrir",
    badge: "Smart",
    badgeColor: "#A78BFA",
    page: "city-habitat",
  },
  {
    id: "mod-jobs",
    category: "Modules",
    title: "Emploi & Jobs",
    subtitle: "Offres d'emploi & recrutement",
    meta: "→ Ouvrir",
    badge: "Emploi",
    badgeColor: "#A78BFA",
    page: "jobs",
  },
  {
    id: "mod-emploi",
    category: "Modules",
    title: "Emploi formel",
    subtitle: "Fonctions publiques, CDI, CDD",
    meta: "→ Ouvrir",
    badge: "Formel",
    badgeColor: "#A78BFA",
    page: "emploi",
  },
  {
    id: "mod-business",
    category: "Modules",
    title: "Business & Entreprises",
    subtitle: "Création, financement, annuaire",
    meta: "→ Ouvrir",
    badge: "Business",
    badgeColor: "#FB923C",
    page: "business",
  },
  {
    id: "mod-marketplace",
    category: "Modules",
    title: "Marketplace",
    subtitle: "Achat & vente entre particuliers",
    meta: "→ Ouvrir",
    badge: "Market",
    badgeColor: "#F472B6",
    page: "marketplace",
  },
  {
    id: "mod-mkpro",
    category: "Modules",
    title: "Marketplace Pro",
    subtitle: "Boutiques professionnelles",
    meta: "→ Ouvrir",
    badge: "Pro",
    badgeColor: "#F472B6",
    page: "marketplace-pro",
  },
  {
    id: "mod-annonces",
    category: "Modules",
    title: "Annonces",
    subtitle: "Petites annonces & offres locales",
    meta: "→ Ouvrir",
    badge: "Annonces",
    badgeColor: "#FBBF24",
    page: "annonces",
  },
  {
    id: "mod-revenus",
    category: "Modules",
    title: "Revenus & Monétisation",
    subtitle: "Générer des revenus en ligne",
    meta: "→ Ouvrir",
    badge: "Revenus",
    badgeColor: "#34D399",
    page: "revenus",
  },
  {
    id: "mod-revdash",
    category: "Modules",
    title: "Tableau de bord Revenus",
    subtitle: "Suivi de vos gains",
    meta: "→ Ouvrir",
    badge: "Dashboard",
    badgeColor: "#34D399",
    page: "revenus-dashboard",
  },
  {
    id: "mod-transport",
    category: "Modules",
    title: "Transport",
    subtitle: "Bus, taxi, moto, covoiturage",
    meta: "→ Ouvrir",
    badge: "Transport",
    badgeColor: "#818CF8",
    page: "transport",
  },
  {
    id: "mod-voyages",
    category: "Modules",
    title: "Voyages",
    subtitle: "Billets de voyage inter-villes",
    meta: "→ Ouvrir",
    badge: "Voyages",
    badgeColor: "#818CF8",
    page: "voyages",
  },
  {
    id: "mod-destinations",
    category: "Modules",
    title: "Destinations",
    subtitle: "Explorer des destinations en Afrique",
    meta: "→ Ouvrir",
    badge: "Discover",
    badgeColor: "#818CF8",
    page: "destinations",
  },
  {
    id: "mod-planificateur",
    category: "Modules",
    title: "Planificateur Voyage",
    subtitle: "Planifier votre itinéraire",
    meta: "→ Ouvrir",
    badge: "Planning",
    badgeColor: "#818CF8",
    page: "planificateur",
  },
  {
    id: "mod-carnet",
    category: "Modules",
    title: "Carnet de Voyage",
    subtitle: "Journal de bord de vos aventures",
    meta: "→ Ouvrir",
    badge: "Journal",
    badgeColor: "#818CF8",
    page: "carnet-voyage",
  },
  {
    id: "mod-budget",
    category: "Modules",
    title: "Budget Voyage",
    subtitle: "Gérer vos dépenses de voyage",
    meta: "→ Ouvrir",
    badge: "Budget",
    badgeColor: "#FBBF24",
    page: "budget-voyage",
  },
  {
    id: "mod-livraison",
    category: "Modules",
    title: "Livraison",
    subtitle: "Commande et suivi de colis",
    meta: "→ Ouvrir",
    badge: "Livraison",
    badgeColor: "#FB923C",
    page: "livraison",
  },
  {
    id: "mod-tracking",
    category: "Modules",
    title: "Tracking & Suivi",
    subtitle: "Suivi GPS et logistique",
    meta: "→ Ouvrir",
    badge: "GPS",
    badgeColor: "#FB923C",
    page: "tracking",
  },
  {
    id: "mod-map3d",
    category: "Modules",
    title: "Carte 3D",
    subtitle: "Visualisation cartographique 3D",
    meta: "→ Ouvrir",
    badge: "Map",
    badgeColor: "#818CF8",
    page: "map3d",
  },
  {
    id: "mod-carte",
    category: "Modules",
    title: "Carte interactive",
    subtitle: "Carte locale des services",
    meta: "→ Ouvrir",
    badge: "Carte",
    badgeColor: "#818CF8",
    page: "carte",
  },
  {
    id: "mod-sante",
    category: "Modules",
    title: "Santé",
    subtitle: "Médecins, pharmacies, téléconsultation",
    meta: "→ Ouvrir",
    badge: "Santé",
    badgeColor: "#F87171",
    page: "sante",
  },
  {
    id: "mod-fitness",
    category: "Modules",
    title: "Fitness & Sport",
    subtitle: "Programmes d'entraînement",
    meta: "→ Ouvrir",
    badge: "Fitness",
    badgeColor: "#FB923C",
    page: "fitness",
  },
  {
    id: "mod-nutrition",
    category: "Modules",
    title: "Nutrition",
    subtitle: "Journal alimentaire & recettes",
    meta: "→ Ouvrir",
    badge: "Nutrition",
    badgeColor: "#A3E635",
    page: "nutrition",
  },
  {
    id: "mod-meditation",
    category: "Modules",
    title: "Méditation",
    subtitle: "Séances de respiration & pleine conscience",
    meta: "→ Ouvrir",
    badge: "Zen",
    badgeColor: "#C4B5FD",
    page: "meditation",
  },
  {
    id: "mod-bienetre",
    category: "Modules",
    title: "Bien‑être Dashboard",
    subtitle: "Tableau de bord santé global",
    meta: "→ Ouvrir",
    badge: "Wellness",
    badgeColor: "#C4B5FD",
    page: "bienetre",
  },
  {
    id: "mod-sport",
    category: "Modules",
    title: "Sport",
    subtitle: "Clubs, compétitions, résultats",
    meta: "→ Ouvrir",
    badge: "Sport",
    badgeColor: "#FB923C",
    page: "sport",
  },
  {
    id: "mod-sos",
    category: "Modules",
    title: "SOS Urgences",
    subtitle: "Appels d'urgence et secours",
    meta: "→ Ouvrir",
    badge: "Urgence",
    badgeColor: "#F87171",
    page: "sos",
  },
  {
    id: "mod-apprendre",
    category: "Modules",
    title: "Apprendre",
    subtitle: "Cours en ligne & tutoriels",
    meta: "→ Ouvrir",
    badge: "Learn",
    badgeColor: "#818CF8",
    page: "apprendre",
  },
  {
    id: "mod-cours",
    category: "Modules",
    title: "Cours & Catalogue",
    subtitle: "Catalogue complet des formations",
    meta: "→ Ouvrir",
    badge: "Cours",
    badgeColor: "#818CF8",
    page: "cours",
  },
  {
    id: "mod-quiz",
    category: "Modules",
    title: "Quiz & Évaluations",
    subtitle: "Testez vos connaissances",
    meta: "→ Ouvrir",
    badge: "Quiz",
    badgeColor: "#A78BFA",
    page: "quiz",
  },
  {
    id: "mod-certifs",
    category: "Modules",
    title: "Certifications",
    subtitle: "Diplômes & badges numériques",
    meta: "→ Ouvrir",
    badge: "Certif",
    badgeColor: "#FBBF24",
    page: "certifications",
  },
  {
    id: "mod-mentorat",
    category: "Modules",
    title: "Mentorat & Communauté",
    subtitle: "Mentors & groupes d'apprentissage",
    meta: "→ Ouvrir",
    badge: "Mentor",
    badgeColor: "#34D399",
    page: "mentorat",
  },
  {
    id: "mod-eduformelle",
    category: "Modules",
    title: "Éducation Formelle",
    subtitle: "Écoles, universités, inscriptions",
    meta: "→ Ouvrir",
    badge: "Académique",
    badgeColor: "#818CF8",
    page: "edu-formelle",
  },
  {
    id: "mod-ecole",
    category: "Modules",
    title: "École & Église",
    subtitle: "Calendrier scolaire & paroissial",
    meta: "→ Ouvrir",
    badge: "École",
    badgeColor: "#818CF8",
    page: "ecole",
  },
  {
    id: "mod-wallet",
    category: "Modules",
    title: "Wallet & Portefeuille",
    subtitle: "Argent mobile & transferts",
    meta: "→ Ouvrir",
    badge: "Wallet",
    badgeColor: "#34D399",
    page: "wallet",
  },
  {
    id: "mod-paiement",
    category: "Modules",
    title: "Paiements",
    subtitle: "Mobile money, cartes, crypto",
    meta: "→ Ouvrir",
    badge: "Pay",
    badgeColor: "#34D399",
    page: "paiement",
  },
  {
    id: "mod-finances",
    category: "Modules",
    title: "Finances Personnelles",
    subtitle: "Budget, épargne, investissements",
    meta: "→ Ouvrir",
    badge: "Finance",
    badgeColor: "#34D399",
    page: "finances",
  },
  {
    id: "mod-dashboard",
    category: "Modules",
    title: "Dashboard",
    subtitle: "Tableau de bord global de l'app",
    meta: "→ Ouvrir",
    badge: "Stats",
    badgeColor: "#A78BFA",
    page: "dashboard",
  },
  {
    id: "mod-community",
    category: "Modules",
    title: "Communauté",
    subtitle: "Forum, entraide & réseau local",
    meta: "→ Ouvrir",
    badge: "Community",
    badgeColor: "#F472B6",
    page: "community",
  },
  {
    id: "mod-groupes",
    category: "Modules",
    title: "Groupes",
    subtitle: "Groupes de discussion & clubs",
    meta: "→ Ouvrir",
    badge: "Groupes",
    badgeColor: "#F472B6",
    page: "groupes",
  },
  {
    id: "mod-messages",
    category: "Modules",
    title: "Messages",
    subtitle: "Chat privé & conversations",
    meta: "→ Ouvrir",
    badge: "Chat",
    badgeColor: "#818CF8",
    page: "messages",
  },
  {
    id: "mod-network",
    category: "Modules",
    title: "Réseau Professionnel",
    subtitle: "Connexions & opportunités business",
    meta: "→ Ouvrir",
    badge: "Network",
    badgeColor: "#A78BFA",
    page: "network",
  },
  {
    id: "mod-parrainage",
    category: "Modules",
    title: "Parrainage",
    subtitle: "Invitez vos proches & gagnez des points",
    meta: "→ Ouvrir",
    badge: "Parrainage",
    badgeColor: "#FBBF24",
    page: "parrainage",
  },
  {
    id: "mod-reputation",
    category: "Modules",
    title: "Réputation",
    subtitle: "Avis, score & crédibilité",
    meta: "→ Ouvrir",
    badge: "Score",
    badgeColor: "#FBBF24",
    page: "reputation",
  },
  {
    id: "mod-cocreation",
    category: "Modules",
    title: "Co‑création",
    subtitle: "Projets collaboratifs & hackathons",
    meta: "→ Ouvrir",
    badge: "Collab",
    badgeColor: "#F472B6",
    page: "cocreation",
  },
  {
    id: "mod-media",
    category: "Modules",
    title: "Médias & Actualités",
    subtitle: "News, podcasts, vidéos",
    meta: "→ Ouvrir",
    badge: "Media",
    badgeColor: "#FB923C",
    page: "media",
  },
  {
    id: "mod-live",
    category: "Modules",
    title: "Live Stories",
    subtitle: "Vidéos en direct & stories",
    meta: "→ Ouvrir",
    badge: "Live",
    badgeColor: "#F87171",
    page: "live",
  },
  {
    id: "mod-livestreaming",
    category: "Modules",
    title: "Live Streaming",
    subtitle: "Diffusion en direct professionnelle",
    meta: "→ Ouvrir",
    badge: "Stream",
    badgeColor: "#F87171",
    page: "live-streaming",
  },
  {
    id: "mod-editeur",
    category: "Modules",
    title: "Éditeur de contenu",
    subtitle: "Créer articles, posts et pages",
    meta: "→ Ouvrir",
    badge: "Éditeur",
    badgeColor: "#A78BFA",
    page: "editeur",
  },
  {
    id: "mod-studio",
    category: "Modules",
    title: "Studio Photo",
    subtitle: "Édition photo & filtres IA",
    meta: "→ Ouvrir",
    badge: "Photo",
    badgeColor: "#F472B6",
    page: "studio",
  },
  {
    id: "mod-storiescreator",
    category: "Modules",
    title: "Créateur de Stories",
    subtitle: "Créez des stories animées",
    meta: "→ Ouvrir",
    badge: "Stories",
    badgeColor: "#F472B6",
    page: "stories-creator",
  },
  {
    id: "mod-templates",
    category: "Modules",
    title: "Modèles & Templates",
    subtitle: "Templates prêts à l'emploi",
    meta: "→ Ouvrir",
    badge: "Templates",
    badgeColor: "#818CF8",
    page: "templates",
  },
  {
    id: "mod-pub",
    category: "Modules",
    title: "Publicité",
    subtitle: "Créer et gérer vos campagnes pub",
    meta: "→ Ouvrir",
    badge: "Pub",
    badgeColor: "#FB923C",
    page: "pub",
  },
  {
    id: "mod-evenements",
    category: "Modules",
    title: "Événements",
    subtitle: "Concerts, foires, sorties",
    meta: "→ Ouvrir",
    badge: "Events",
    badgeColor: "#F472B6",
    page: "evenements",
  },
  {
    id: "mod-evenementspro",
    category: "Modules",
    title: "Événements Pro",
    subtitle: "Conférences, salons, networking",
    meta: "→ Ouvrir",
    badge: "Pro",
    badgeColor: "#F472B6",
    page: "evenements-pro",
  },
  {
    id: "mod-agenda",
    category: "Modules",
    title: "Agenda",
    subtitle: "Calendrier personnel & rappels",
    meta: "→ Ouvrir",
    badge: "Agenda",
    badgeColor: "#818CF8",
    page: "agenda",
  },
  {
    id: "mod-agri",
    category: "Modules",
    title: "Agriculture",
    subtitle: "Intrants, prix, alertes phytosanitaires",
    meta: "→ Ouvrir",
    badge: "Agri",
    badgeColor: "#A3E635",
    page: "agri",
  },
  {
    id: "mod-environnement",
    category: "Modules",
    title: "Environnement",
    subtitle: "Écologie, climat, biodiversité",
    meta: "→ Ouvrir",
    badge: "Éco",
    badgeColor: "#A3E635",
    page: "environnement",
  },
  {
    id: "mod-energie",
    category: "Modules",
    title: "Énergie",
    subtitle: "Solaire, électricité, efficacité",
    meta: "→ Ouvrir",
    badge: "Énergie",
    badgeColor: "#FBBF24",
    page: "energie",
  },
  {
    id: "mod-services",
    category: "Modules",
    title: "Services à la Personne",
    subtitle: "Aide à domicile, nettoyage, bricolage",
    meta: "→ Ouvrir",
    badge: "Services",
    badgeColor: "#818CF8",
    page: "services",
  },
  {
    id: "mod-restauration",
    category: "Modules",
    title: "Restauration",
    subtitle: "Restaurants, livraison repas",
    meta: "→ Ouvrir",
    badge: "Restau",
    badgeColor: "#FB923C",
    page: "restauration",
  },
  {
    id: "mod-documents",
    category: "Modules",
    title: "Documents",
    subtitle: "Stockage & gestion de documents",
    meta: "→ Ouvrir",
    badge: "Docs",
    badgeColor: "#818CF8",
    page: "documents",
  },
  {
    id: "mod-juridique",
    category: "Modules",
    title: "Juridique",
    subtitle: "Aide légale & conseils juridiques",
    meta: "→ Ouvrir",
    badge: "Droit",
    badgeColor: "#A78BFA",
    page: "juridique",
  },
  {
    id: "mod-justice",
    category: "Modules",
    title: "Justice",
    subtitle: "Accès au droit & procédures",
    meta: "→ Ouvrir",
    badge: "Justice",
    badgeColor: "#A78BFA",
    page: "justice",
  },
  {
    id: "mod-ong",
    category: "Modules",
    title: "ONG & Solidarité",
    subtitle: "Actions humanitaires & bénévolat",
    meta: "→ Ouvrir",
    badge: "ONG",
    badgeColor: "#34D399",
    page: "ong",
  },
  {
    id: "mod-securite",
    category: "Modules",
    title: "Sécurité Publique",
    subtitle: "Alertes, signalements, prévention",
    meta: "→ Ouvrir",
    badge: "Sécurité",
    badgeColor: "#F87171",
    page: "securite",
  },
  {
    id: "mod-datapublique",
    category: "Modules",
    title: "Data Publique",
    subtitle: "Données ouvertes & statistiques",
    meta: "→ Ouvrir",
    badge: "Data",
    badgeColor: "#818CF8",
    page: "data-publique",
  },
  {
    id: "mod-eglise",
    category: "Modules",
    title: "Église & Communauté religieuse",
    subtitle: "Services paroissiaux & annonces",
    meta: "→ Ouvrir",
    badge: "Religion",
    badgeColor: "#C4B5FD",
    page: "eglise",
  },
  {
    id: "mod-profile",
    category: "Modules",
    title: "Mon Profil",
    subtitle: "Votre identité, badge et QR Code",
    meta: "→ Ouvrir",
    badge: "Profil",
    badgeColor: "#A78BFA",
    page: "profile",
  },
  {
    id: "mod-premium",
    category: "Modules",
    title: "Premium",
    subtitle: "Plans premium & avantages",
    meta: "→ Ouvrir",
    badge: "Premium",
    badgeColor: "#FBBF24",
    page: "premium",
  },
  {
    id: "mod-recompenses",
    category: "Modules",
    title: "Récompenses",
    subtitle: "Points fidélité & cashback",
    meta: "→ Ouvrir",
    badge: "Points",
    badgeColor: "#FBBF24",
    page: "recompenses",
  },
  {
    id: "mod-favorites",
    category: "Modules",
    title: "Favoris",
    subtitle: "Vos contenus sauvegardés",
    meta: "→ Ouvrir",
    badge: "Favoris",
    badgeColor: "#F87171",
    page: "favorites",
  },
  {
    id: "mod-notifications",
    category: "Modules",
    title: "Notifications",
    subtitle: "Alertes et messages reçus",
    meta: "→ Ouvrir",
    badge: "Notifs",
    badgeColor: "#818CF8",
    page: "notifications",
  },
  {
    id: "mod-settings",
    category: "Modules",
    title: "Paramètres",
    subtitle: "Langue, thème, confidentialité",
    meta: "→ Ouvrir",
    badge: "Config",
    badgeColor: "#818CF8",
    page: "settings",
  },
  {
    id: "mod-explorer",
    category: "Modules",
    title: "Explorer",
    subtitle: "Découvrir tous les modules",
    meta: "→ Ouvrir",
    badge: "Explorer",
    badgeColor: "#A78BFA",
    page: "explorer",
  },
  {
    id: "mod-actions",
    category: "Modules",
    title: "Actions rapides",
    subtitle: "Raccourcis & actions contextuelles",
    meta: "→ Ouvrir",
    badge: "Actions",
    badgeColor: "#A78BFA",
    page: "actions",
  },
];

/* ============================================================
 * CONTENT RESULTS
 * ============================================================ */

const CONTENT_RESULTS: SearchResult[] = [
  {
    id: "i1",
    category: "Immo",
    title: "Maison 3 ch. – Kolwezi",
    subtitle: "Quartier Joli Site",
    meta: "$450/mois",
    badge: "À louer",
    badgeColor: "#34D399",
    page: "immo",
  },
  {
    id: "i2",
    category: "Immo",
    title: "Studio meublé – Dakar Plateau",
    subtitle: "Dakar, Sénégal",
    meta: "85 000 FCFA/mois",
    badge: "Nouveau",
    badgeColor: "#818CF8",
    page: "immo",
  },
  {
    id: "i3",
    category: "Immo",
    title: "Villa avec piscine – Abidjan",
    subtitle: "Cocody, Côte d'Ivoire",
    meta: "$1 200/mois",
    badge: "Premium",
    badgeColor: "#FBBF24",
    page: "immo",
  },
  {
    id: "i4",
    category: "Immo",
    title: "Terrain 500m² – Bamako",
    subtitle: "ACI 2000, Mali",
    meta: "$8 000",
    badge: "À vendre",
    badgeColor: "#FB923C",
    page: "immo",
  },
  {
    id: "j1",
    category: "Jobs/Pro",
    title: "Développeur React Senior",
    subtitle: "TechAfrique – Dakar",
    meta: "2 500 000 FCFA/mois",
    badge: "Urgent",
    badgeColor: "#F87171",
    page: "jobs",
  },
  {
    id: "j2",
    category: "Jobs/Pro",
    title: "Soudeur Métal expérimenté",
    subtitle: "Kolwezi Industries",
    meta: "$600/mois",
    badge: "CDI",
    badgeColor: "#34D399",
    page: "jobs",
  },
  {
    id: "j3",
    category: "Jobs/Pro",
    title: "Comptable certifié",
    subtitle: "Banque Atlantique – Abidjan",
    meta: "350 000 FCFA",
    badge: "CDD",
    badgeColor: "#818CF8",
    page: "jobs",
  },
  {
    id: "j4",
    category: "Jobs/Pro",
    title: "Chauffeur Uber Eats",
    subtitle: "Dakar, Sénégal",
    meta: "Commission 25%",
    badge: "Flexible",
    badgeColor: "#A78BFA",
    page: "jobs",
  },
  {
    id: "s1",
    category: "Santé",
    title: "Dr Aminata Koné – Cardiologue",
    subtitle: "Clinique Avicenne, Abidjan",
    meta: "Disponible aujourd'hui",
    badge: "En ligne",
    badgeColor: "#34D399",
    page: "sante",
  },
  {
    id: "s2",
    category: "Santé",
    title: "Pharmacie Centrale Dakar",
    subtitle: "Plateau, Dakar",
    meta: "Ouvert 24h/24",
    badge: "Urgence",
    badgeColor: "#F87171",
    page: "sante",
  },
  {
    id: "s3",
    category: "Santé",
    title: "Consultation générale",
    subtitle: "MediConnect Telehealth",
    meta: "5 000 FCFA / 15 min",
    badge: "Télé",
    badgeColor: "#818CF8",
    page: "sante",
  },
  {
    id: "a1",
    category: "Agri",
    title: "Sac de maïs 50kg",
    subtitle: "Coopérative Sahel Vert",
    meta: "12 500 FCFA",
    badge: "Stock OK",
    badgeColor: "#34D399",
    page: "agri",
  },
  {
    id: "a2",
    category: "Agri",
    title: "Engrais NPK 25kg",
    subtitle: "AgroInputs Mali",
    meta: "8 000 FCFA",
    badge: "Promo -10%",
    badgeColor: "#FB923C",
    page: "agri",
  },
  {
    id: "a3",
    category: "Agri",
    title: "Alerte : Criquet pèlerin",
    subtitle: "Zone nord Sénégal",
    meta: "Risque élevé",
    badge: "Alerte",
    badgeColor: "#F87171",
    page: "agri",
  },
  {
    id: "m1",
    category: "Media",
    title: "Sommet UA : les décisions clés",
    subtitle: "Politique · il y a 2h",
    meta: "8 min de lecture",
    badge: "Trending",
    badgeColor: "#FB923C",
    page: "media",
  },
  {
    id: "m2",
    category: "Media",
    title: "Podcast : Entrepreneuriat en Afrique",
    subtitle: "Business Africa FM",
    meta: "45 min",
    badge: "Nouveau",
    badgeColor: "#818CF8",
    page: "media",
  },
  {
    id: "m3",
    category: "Media",
    title: "AFCON 2025 : résultats du jour",
    subtitle: "Sport · il y a 1h",
    meta: "3 min de lecture",
    badge: "Sport",
    badgeColor: "#34D399",
    page: "media",
  },
  {
    id: "e1",
    category: "Événements",
    title: "Foire Internationale de Dakar",
    subtitle: "CICES, Dakar",
    meta: "15-22 mars 2024",
    badge: "Gratuit",
    badgeColor: "#34D399",
    page: "evenements",
  },
  {
    id: "e2",
    category: "Événements",
    title: "Concert Burna Boy",
    subtitle: "Stade Léopold Sédar Senghor",
    meta: "25 000 FCFA",
    badge: "Chaud 🔥",
    badgeColor: "#F87171",
    page: "evenements",
  },
  {
    id: "e3",
    category: "Événements",
    title: "Tech Summit Africa 2024",
    subtitle: "Sofitel Abidjan",
    meta: "50 000 FCFA",
    badge: "Pro",
    badgeColor: "#818CF8",
    page: "evenements",
  },
  {
    id: "v1",
    category: "Voyages",
    title: "Dakar → Abidjan",
    subtitle: "Trans-Sahel Express",
    meta: "18 500 FCFA · 15h30",
    badge: "Bus",
    badgeColor: "#FB923C",
    page: "voyages",
  },
  {
    id: "v2",
    category: "Voyages",
    title: "Dakar → Bamako",
    subtitle: "Rapid Sahel",
    meta: "9 500 FCFA · 12h",
    badge: "Minibus",
    badgeColor: "#34D399",
    page: "voyages",
  },
  {
    id: "v3",
    category: "Voyages",
    title: "Abidjan → Accra",
    subtitle: "Air Afrique Connect",
    meta: "85 000 FCFA · 2h30",
    badge: "Avion",
    badgeColor: "#818CF8",
    page: "voyages",
  },
  {
    id: "be1",
    category: "Bien‑être",
    title: "Séance HIIT 30 min",
    subtitle: "Fitness · Niveau intermédiaire",
    meta: "300 kcal",
    badge: "Fitness",
    badgeColor: "#FB923C",
    page: "fitness",
  },
  {
    id: "be2",
    category: "Bien‑être",
    title: "Méditation pleine conscience",
    subtitle: "10 min · Débutant",
    meta: "Gratuit",
    badge: "Zen",
    badgeColor: "#C4B5FD",
    page: "meditation",
  },
  {
    id: "be3",
    category: "Bien‑être",
    title: "Recette : Thiébou djeun allégé",
    subtitle: "Nutrition · 450 kcal",
    meta: "35 min",
    badge: "Recette",
    badgeColor: "#A3E635",
    page: "nutrition",
  },
  {
    id: "ed1",
    category: "Éducation",
    title: "Cours JavaScript complet",
    subtitle: "TechAfrika Academy",
    meta: "6h · Débutant → Pro",
    badge: "Populaire",
    badgeColor: "#818CF8",
    page: "cours",
  },
  {
    id: "ed2",
    category: "Éducation",
    title: "Quiz : Histoire de l'Afrique",
    subtitle: "Éducation générale · 20 questions",
    meta: "~15 min",
    badge: "Quiz",
    badgeColor: "#A78BFA",
    page: "quiz",
  },
  {
    id: "ed3",
    category: "Éducation",
    title: "Certification Marketing Digital",
    subtitle: "Reconnue CEDEAO",
    meta: "Gratuit",
    badge: "Certif",
    badgeColor: "#FBBF24",
    page: "certifications",
  },
  {
    id: "fi1",
    category: "Finance",
    title: "Transfert Orange Money",
    subtitle: "Dakar → Bamako instantané",
    meta: "0.5% de frais",
    badge: "Mobile Money",
    badgeColor: "#34D399",
    page: "paiement",
  },
  {
    id: "fi2",
    category: "Finance",
    title: "Épargne tontine numérique",
    subtitle: "Groupe 10 personnes · 50 000 FCFA/mois",
    meta: "Rotation mensuelle",
    badge: "Épargne",
    badgeColor: "#818CF8",
    page: "finances",
  },
  {
    id: "fi3",
    category: "Finance",
    title: "Solde portefeuille",
    subtitle: "Wallet DébrouillApp",
    meta: "125 500 FCFA",
    badge: "Wallet",
    badgeColor: "#34D399",
    page: "wallet",
  },
  {
    id: "co1",
    category: "Communauté",
    title: "Groupe Diaspora Sénégal France",
    subtitle: "2 340 membres",
    meta: "Très actif",
    badge: "Groupe",
    badgeColor: "#F472B6",
    page: "groupes",
  },
  {
    id: "co2",
    category: "Communauté",
    title: "Forum Entrepreneuriat Africain",
    subtitle: "Communauté · 5 600 membres",
    meta: "128 posts cette semaine",
    badge: "Forum",
    badgeColor: "#F472B6",
    page: "community",
  },
  {
    id: "co3",
    category: "Communauté",
    title: "Mentorat : Marie Diallo – Fintech",
    subtitle: "Mentor certifiée",
    meta: "3 créneaux dispo",
    badge: "Mentor",
    badgeColor: "#34D399",
    page: "mentorat",
  },
  {
    id: "sv1",
    category: "Services",
    title: "Restaurant Le Baobab",
    subtitle: "Cuisine africaine · Dakar Plateau",
    meta: "Note 4.8 ★",
    badge: "Ouvert",
    badgeColor: "#FB923C",
    page: "restauration",
  },
  {
    id: "sv2",
    category: "Services",
    title: "Avocat en droit du travail",
    subtitle: "Maître Traoré · Abidjan",
    meta: "Consultation 25 000 FCFA",
    badge: "Juridique",
    badgeColor: "#A78BFA",
    page: "juridique",
  },
  {
    id: "sv3",
    category: "Services",
    title: "Hôtel Teranga Palace",
    subtitle: "Dakar, Sénégal · 4 étoiles",
    meta: "$85/nuit",
    badge: "Hôtel",
    badgeColor: "#34D399",
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

const CATEGORY_COLORS: Record<ResultCategory, string> = {
  Immo: "#34D399",
  "Jobs/Pro": "#A78BFA",
  Santé: "#F87171",
  Agri: "#A3E635",
  Media: "#FB923C",
  Événements: "#F472B6",
  Voyages: "#818CF8",
  Modules: "#C4B5FD",
  "Bien‑être": "#F9A8D4",
  Éducation: "#22D3EE",
  Finance: "#34D399",
  Communauté: "#FB7185",
  Services: "#FBBF24",
};

const HISTORY_KEY = "debrouille_search_history";

/* ============================================================
 * STORAGE SHIM (works native + web)
 * ============================================================ */

const memoryStore: Record<string, string> = {};

const store = {
  get(key: string): string | null {
    if (isBrowser) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    return memoryStore[key] ?? null;
  },
  set(key: string, value: string) {
    if (isBrowser) {
      try {
        window.localStorage.setItem(key, value);
      } catch {}
    } else {
      memoryStore[key] = value;
    }
  },
  remove(key: string) {
    if (isBrowser) {
      try {
        window.localStorage.removeItem(key);
      } catch {}
    } else {
      delete memoryStore[key];
    }
  },
};

function getHistory(): string[] {
  try {
    const raw = store.get(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(query: string) {
  const prev = getHistory().filter((h) => h !== query);
  const next = [query, ...prev].slice(0, 8);
  store.set(HISTORY_KEY, JSON.stringify(next));
}

function removeHistory(query: string) {
  const next = getHistory().filter((h) => h !== query);
  store.set(HISTORY_KEY, JSON.stringify(next));
}

/* ============================================================
 * HELPERS
 * ============================================================ */

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

function getCategoryIcon(category: ResultCategory, size = 13): ReactNode {
  const props = { size, color: CATEGORY_COLORS[category] };
  switch (category) {
    case "Immo":
      return <Home {...props} />;
    case "Jobs/Pro":
      return <Briefcase {...props} />;
    case "Santé":
      return <Stethoscope {...props} />;
    case "Agri":
      return <Leaf {...props} />;
    case "Media":
      return <Newspaper {...props} />;
    case "Événements":
      return <Calendar {...props} />;
    case "Voyages":
      return <Plane {...props} />;
    case "Modules":
      return <LayoutGrid {...props} />;
    case "Bien‑être":
      return <Heart {...props} />;
    case "Éducation":
      return <BookOpen {...props} />;
    case "Finance":
      return <Wallet {...props} />;
    case "Communauté":
      return <Users {...props} />;
    case "Services":
      return <Package {...props} />;
  }
}

/* ============================================================
 * FADE UP WRAPPER
 * ============================================================ */

function FadeUp({
  delay = 0,
  distance = 8,
  children,
  style,
}: {
  delay?: number;
  distance?: number;
  children: ReactNode;
  style?: any;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 380,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [distance, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/* ============================================================
 * ANIMATED TRIGGER ICON (mic)
 * ============================================================ */

function TriggerMicIcon() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <LinearGradient
        colors={["#A78BFA", "#7C3AED", "#6366F1"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.triggerMic}
      >
        <Mic size={14} color="#fff" strokeWidth={2.4} />
      </LinearGradient>
    </Animated.View>
  );
}

/* ============================================================
 * SECTION LABEL
 * ============================================================ */

function SectionLabel({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <View style={styles.sectionLabelRow}>
      {icon}
      <Text style={styles.sectionLabelText}>{children}</Text>
    </View>
  );
}

/* ============================================================
 * RESULT ROW
 * ============================================================ */

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
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.99,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };

  return (
    <FadeUp delay={Math.min(index * 25, 300)} distance={5}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={() => onSelect(result)}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          accessibilityLabel={`${result.title} — ${result.category}`}
          style={[styles.resultRow, compact && styles.resultRowCompact]}
        >
          <LinearGradient
            colors={[`${color}14`, "rgba(255,255,255,0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <View
            style={[
              compact ? styles.resultIconCompact : styles.resultIcon,
              { backgroundColor: `${color}22`, borderColor: `${color}44` },
            ]}
          >
            {getCategoryIcon(result.category, compact ? 13 : 14)}
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.resultTitle} numberOfLines={1}>
              {result.title}
            </Text>
            <Text style={styles.resultSubtitle} numberOfLines={1}>
              {result.subtitle}
            </Text>
          </View>

          <View style={styles.resultMetaCol}>
            {result.meta ? (
              <Text style={styles.resultMeta} numberOfLines={1}>
                {result.meta}
              </Text>
            ) : null}
            {result.badge ? (
              <View
                style={[styles.resultBadge, { backgroundColor: `${color}22` }]}
              >
                {result.badge === "En direct" ? (
                  <Radio size={8} color={color} />
                ) : null}
                <Text
                  style={[styles.resultBadgeText, { color }]}
                  numberOfLines={1}
                >
                  {result.badge}
                </Text>
              </View>
            ) : null}
          </View>

          <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
        </Pressable>
      </Animated.View>
    </FadeUp>
  );
}

/* ============================================================
 * COMPONENT
 * ============================================================ */

interface SmartSearchProps {
  onNavigate: (page: string) => void;
  onAdvancedSearch?: () => void;
}

export default function SmartSearch({
  onNavigate,
  onAdvancedSearch,
}: SmartSearchProps) {
  const { height: SCREEN_HEIGHT } = useWindowDimensions();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [history, setHistory] = useState<string[]>(() => getHistory());
  const [activeCategory, setActiveCategory] = useState<ResultCategory | "Tout">(
    "Tout",
  );
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);

  const inputRef = useRef<TextInput>(null);

  const backdropAnim = useRef(new Animated.Value(0)).current;
  const panelAnim = useRef(new Animated.Value(0)).current;

  const liveData = useQuery(
    api.search.smartSearch,
    query.trim().length >= 2 ? { query: query.trim() } : "skip",
  );

  /* ───── voice support detection ───── */
  useEffect(() => {
    if (!isBrowser) return;
    setIsVoiceSupported(
      "SpeechRecognition" in window || "webkitSpeechRecognition" in window,
    );
  }, []);

  /* ───── entrance/exit animation ───── */
  useEffect(() => {
    if (open) {
      backdropAnim.setValue(0);
      panelAnim.setValue(0);
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(panelAnim, {
          toValue: 1,
          stiffness: 340,
          damping: 30,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [open, backdropAnim, panelAnim]);

  /* ───── live results mapping ───── */
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

  /* ───── static results filtering ───── */
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

  /* ───── actions ───── */
  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(panelAnim, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setOpen(false);
      setQuery("");
      setListening(false);
      setActiveCategory("Tout");
      Keyboard.dismiss();
    });
  }, [backdropAnim, panelAnim]);

  const handleOpen = useCallback(() => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 200);
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
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const handleRemoveHistory = useCallback(
    (value: string, event: GestureResponderEvent) => {
      event.stopPropagation?.();
      removeHistory(value);
      setHistory(getHistory());
    },
    [],
  );

  const handleVoice = useCallback(() => {
    if (!isBrowser || !isVoiceSupported || listening) return;

    const w = window as typeof window & {
      webkitSpeechRecognition?: new () => any;
      SpeechRecognition?: new () => any;
    };

    const SpeechRecognitionAPI =
      w.webkitSpeechRecognition ?? w.SpeechRecognition;

    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "fr-FR";
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setQuery(transcript);
      setActiveCategory("Tout");
    };

    try {
      recognition.start();
    } catch {
      setListening(false);
    }
  }, [isVoiceSupported, listening]);

  const handleSubmit = useCallback((value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 2) return;
    saveHistory(trimmed);
    setHistory(getHistory());
  }, []);

  /* ───── web escape key ───── */
  useEffect(() => {
    if (!isBrowser || !open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleClose, open]);

  const showResults = query.trim().length >= 2;
  const resultCategoryCount = Object.keys(grouped).length;

  const backdropOpacity = backdropAnim;
  const panelTranslateY = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT * 0.04, 0],
  });
  const panelScale = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.985, 1],
  });

  /* ========================================================================
   * RENDER
   * ====================================================================== */

  return (
    <>
      {/* ═══════════ TRIGGER ═══════════ */}
      <FadeUp delay={120} distance={8} style={styles.triggerWrap}>
        <Pressable
          onPress={handleOpen}
          accessibilityLabel="Ouvrir la recherche intelligente"
          style={({ pressed }) => [styles.trigger, pressed && { opacity: 0.9 }]}
        >
          <LinearGradient
            colors={[
              "rgba(167,139,250,0.08)",
              "rgba(255,255,255,0.02)",
              "rgba(99,102,241,0.08)",
            ]}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.triggerSearchIcon}>
            <Search size={17} color="rgba(255,255,255,0.6)" />
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.triggerTitle} numberOfLines={1}>
              Rechercher dans 80+ modules…
            </Text>
            <Text style={styles.triggerSub} numberOfLines={1}>
              Services · emplois · immobilier · événements · contenus
            </Text>
          </View>

          <TriggerMicIcon />
        </Pressable>

        {onAdvancedSearch ? (
          <Pressable
            onPress={onAdvancedSearch}
            style={({ pressed }) => [
              styles.advancedBtn,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Sparkles size={11} color="rgba(196,181,253,0.85)" />
            <Text style={styles.advancedBtnText}>Recherche avancée</Text>
            <Text style={styles.advancedBtnDot}>·</Text>
            <Text style={styles.advancedBtnText}>Tendances</Text>
          </Pressable>
        ) : null}
      </FadeUp>

      {/* ═══════════ MODAL ═══════════ */}
      {open ? (
        <Modal
          transparent
          visible={open}
          animationType="none"
          onRequestClose={handleClose}
          statusBarTranslucent
        >
          <View style={StyleSheet.absoluteFill}>
            {/* Backdrop */}
            <Animated.View
              style={[styles.backdrop, { opacity: backdropOpacity }]}
            >
              <Pressable
                onPress={handleClose}
                style={StyleSheet.absoluteFill}
                accessibilityLabel="Fermer"
              />
            </Animated.View>

            {/* Panel */}
            <Animated.View
              style={[
                styles.panel,
                {
                  transform: [
                    { translateY: panelTranslateY },
                    { scale: panelScale },
                  ],
                },
              ]}
              accessibilityLabel="Recherche DébrouillePro"
            >
              <LinearGradient
                colors={["#06061A", "#0A0620", "#06061A"]}
                locations={[0, 0.5, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              {/* Ambient glows */}
              <View style={styles.ambientGlowTop} pointerEvents="none" />
              <View style={styles.ambientGlowRight} pointerEvents="none" />

              {/* ─── HEADER ─── */}
              <View
                style={[
                  styles.header,
                  {
                    paddingTop: Platform.OS === "android" ? 20 : 40,
                  },
                ]}
              >
                <View style={styles.headerTopRow}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.headerEyebrow}>
                      DÉBROUILLEPRO SEARCH
                    </Text>
                    <Text style={styles.headerTitle}>Que cherches-tu ?</Text>
                  </View>
                  <Pressable
                    onPress={handleClose}
                    hitSlop={8}
                    accessibilityLabel="Fermer la recherche"
                    style={({ pressed }) => [
                      styles.headerCloseBtn,
                      pressed && { opacity: 0.75 },
                    ]}
                  >
                    <X size={17} color="rgba(255,255,255,0.75)" />
                  </Pressable>
                </View>

                {/* Search bar */}
                <View style={styles.searchBar}>
                  <Search size={18} color="#C4B5FD" strokeWidth={2.4} />
                  <TextInput
                    ref={inputRef}
                    value={query}
                    onChangeText={(value) => {
                      setQuery(value);
                      setActiveCategory("Tout");
                    }}
                    onSubmitEditing={() => handleSubmit(query)}
                    placeholder="Modules, services, emplois, contenus…"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    style={styles.searchInput}
                    autoComplete="off"
                    autoCapitalize="none"
                    accessibilityLabel="Rechercher"
                  />
                  {query ? (
                    <Pressable
                      onPress={() => setQuery("")}
                      hitSlop={6}
                      accessibilityLabel="Effacer la recherche"
                      style={({ pressed }) => [
                        styles.searchClearBtn,
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <X size={15} color="rgba(255,255,255,0.6)" />
                    </Pressable>
                  ) : null}
                  {isVoiceSupported ? (
                    <Pressable
                      onPress={handleVoice}
                      accessibilityLabel={
                        listening
                          ? "Arrêter la dictée"
                          : "Rechercher avec la voix"
                      }
                      accessibilityState={{ selected: listening }}
                      hitSlop={6}
                      style={({ pressed }) => [
                        styles.searchMicBtn,
                        listening && styles.searchMicBtnActive,
                        pressed && { opacity: 0.85 },
                      ]}
                    >
                      <Mic
                        size={14}
                        color={listening ? "#FCA5A5" : "#fff"}
                        strokeWidth={2.4}
                      />
                    </Pressable>
                  ) : null}
                </View>

                {/* Category chips */}
                {showResults && results.length > 0 ? (
                  <FadeUp distance={6}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.chipsRow}
                    >
                      {allCategories.map((category) => {
                        const count =
                          category === "Tout"
                            ? results.length
                            : (grouped[category as ResultCategory]?.length ??
                              0);

                        if (category !== "Tout" && count === 0) return null;

                        const color =
                          category === "Tout"
                            ? "#C4B5FD"
                            : CATEGORY_COLORS[category as ResultCategory];

                        const active = activeCategory === category;

                        return (
                          <Pressable
                            key={category}
                            onPress={() => setActiveCategory(category)}
                            style={({ pressed }) => [
                              styles.chip,
                              {
                                backgroundColor: active
                                  ? `${color}30`
                                  : "rgba(255,255,255,0.04)",
                                borderColor: active
                                  ? `${color}66`
                                  : "rgba(255,255,255,0.08)",
                              },
                              pressed && { opacity: 0.8 },
                            ]}
                          >
                            {category !== "Tout"
                              ? getCategoryIcon(category as ResultCategory, 11)
                              : null}
                            <Text
                              style={[
                                styles.chipText,
                                active && { color: "#fff" },
                              ]}
                            >
                              {category}
                            </Text>
                            <Text style={styles.chipCount}>{count}</Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </FadeUp>
                ) : null}
              </View>

              {/* ─── BODY ─── */}
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.bodyContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Idle state */}
                {!showResults ? (
                  <View style={{ gap: 28, paddingTop: 12 }}>
                    {/* Quick modules */}
                    <View>
                      <SectionLabel
                        icon={
                          <LayoutGrid
                            size={12}
                            color="rgba(255,255,255,0.45)"
                          />
                        }
                      >
                        Accès rapide
                      </SectionLabel>
                      <View style={styles.quickGrid}>
                        {quickModules.map((module, index) => (
                          <FadeUp
                            key={module.id}
                            delay={index * 25}
                            distance={8}
                            style={styles.quickGridItemWrap}
                          >
                            <Pressable
                              onPress={() => handleSelect(module)}
                              style={({ pressed }) => [
                                styles.quickModule,
                                pressed && { opacity: 0.85 },
                              ]}
                            >
                              <LinearGradient
                                colors={[
                                  `${module.badgeColor ?? "#A78BFA"}22`,
                                  `${module.badgeColor ?? "#A78BFA"}08`,
                                ]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={[
                                  styles.quickModuleIcon,
                                  {
                                    borderColor: `${module.badgeColor ?? "#A78BFA"}44`,
                                  },
                                ]}
                              >
                                {getCategoryIcon("Modules", 15)}
                              </LinearGradient>
                              <Text
                                style={styles.quickModuleLabel}
                                numberOfLines={2}
                              >
                                {module.title}
                              </Text>
                            </Pressable>
                          </FadeUp>
                        ))}
                      </View>
                      <Pressable
                        onPress={() => setQuery("module")}
                        style={({ pressed }) => [
                          styles.seeAllBtn,
                          pressed && { opacity: 0.7 },
                        ]}
                      >
                        <Text style={styles.seeAllBtnText}>
                          Voir tous les modules
                        </Text>
                        <ArrowUpRight
                          size={11}
                          color="rgba(196,181,253,0.85)"
                        />
                      </Pressable>
                    </View>

                    {/* History */}
                    {history.length > 0 ? (
                      <FadeUp>
                        <View>
                          <View style={styles.historyHeader}>
                            <SectionLabel
                              icon={
                                <Clock
                                  size={12}
                                  color="rgba(255,255,255,0.45)"
                                />
                              }
                            >
                              Récent
                            </SectionLabel>
                            <Pressable
                              onPress={() => {
                                store.remove(HISTORY_KEY);
                                setHistory([]);
                              }}
                              hitSlop={6}
                              style={({ pressed }) => [
                                pressed && { opacity: 0.6 },
                              ]}
                            >
                              <Text style={styles.historyClear}>Effacer</Text>
                            </Pressable>
                          </View>
                          <View style={styles.historyCard}>
                            <LinearGradient
                              colors={[
                                "rgba(255,255,255,0.035)",
                                "rgba(255,255,255,0.015)",
                              ]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={StyleSheet.absoluteFill}
                            />
                            <View
                              style={styles.historyBorder}
                              pointerEvents="none"
                            />
                            {history.map((item, index) => (
                              <Pressable
                                key={item}
                                onPress={() => handleHistorySelect(item)}
                                style={({ pressed }) => [
                                  styles.historyRow,
                                  index > 0 && styles.historyRowBorder,
                                  pressed && {
                                    backgroundColor: "rgba(255,255,255,0.04)",
                                  },
                                ]}
                              >
                                <Clock
                                  size={14}
                                  color="rgba(255,255,255,0.35)"
                                />
                                <Text
                                  style={styles.historyText}
                                  numberOfLines={1}
                                >
                                  {item}
                                </Text>
                                <Pressable
                                  onPress={(e) => handleRemoveHistory(item, e)}
                                  hitSlop={8}
                                  accessibilityLabel={`Supprimer ${item}`}
                                  style={({ pressed }) => [
                                    styles.historyRemoveBtn,
                                    pressed && { opacity: 0.7 },
                                  ]}
                                >
                                  <X size={12} color="rgba(255,255,255,0.4)" />
                                </Pressable>
                              </Pressable>
                            ))}
                          </View>
                        </View>
                      </FadeUp>
                    ) : null}

                    {/* Trending */}
                    <FadeUp>
                      <View>
                        <SectionLabel
                          icon={
                            <TrendingUp
                              size={12}
                              color="rgba(255,255,255,0.45)"
                            />
                          }
                        >
                          Tendances
                        </SectionLabel>
                        <View style={styles.trendingRow}>
                          {TRENDING.map((item, index) => (
                            <FadeUp key={item} delay={index * 35} distance={6}>
                              <Pressable
                                onPress={() => setQuery(item)}
                                style={({ pressed }) => [
                                  styles.trendingChip,
                                  pressed && { opacity: 0.85 },
                                ]}
                              >
                                <TrendingUp
                                  size={11}
                                  color="rgba(251,146,60,0.85)"
                                />
                                <Text style={styles.trendingChipText}>
                                  {item}
                                </Text>
                              </Pressable>
                            </FadeUp>
                          ))}
                        </View>
                      </View>
                    </FadeUp>

                    {/* AI banner */}
                    <FadeUp>
                      <View style={styles.aiCard}>
                        <LinearGradient
                          colors={[
                            "rgba(139,92,246,0.2)",
                            "rgba(99,102,241,0.1)",
                            "rgba(15,7,32,0.6)",
                          ]}
                          locations={[0, 0.5, 1]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={StyleSheet.absoluteFill}
                        />
                        <View
                          style={styles.aiCardBorder}
                          pointerEvents="none"
                        />
                        <View style={styles.aiCardOrb} pointerEvents="none" />

                        <View style={styles.aiCardRow}>
                          <LinearGradient
                            colors={[
                              "rgba(167,139,250,0.4)",
                              "rgba(99,102,241,0.15)",
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.aiCardIcon}
                          >
                            <Sparkles size={16} color="#C4B5FD" />
                          </LinearGradient>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={styles.aiCardEyebrow}>
                              DÉBROUILLE AI
                            </Text>
                            <Text style={styles.aiCardText}>
                              Je peux t'aider à trouver un emploi, un logement,
                              un service ou une opportunité plus rapidement.
                            </Text>
                            <Pressable
                              onPress={() => setQuery("emploi")}
                              style={({ pressed }) => [
                                styles.aiCardBtn,
                                pressed && { opacity: 0.7 },
                              ]}
                            >
                              <Text style={styles.aiCardBtnText}>
                                Explorer les opportunités
                              </Text>
                              <ArrowUpRight size={11} color="#C4B5FD" />
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    </FadeUp>
                  </View>
                ) : null}

                {/* No results */}
                {showResults && results.length === 0 ? (
                  <FadeUp>
                    <View style={styles.noResultsWrap}>
                      <LinearGradient
                        colors={[
                          "rgba(167,139,250,0.14)",
                          "rgba(99,102,241,0.04)",
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.noResultsIcon}
                      >
                        <Search size={24} color="rgba(196,181,253,0.85)" />
                      </LinearGradient>
                      <Text style={styles.noResultsTitle}>
                        Aucun résultat trouvé
                      </Text>
                      <Text style={styles.noResultsQuery} numberOfLines={1}>
                        « {query.trim()} »
                      </Text>
                      <Text style={styles.noResultsSub}>
                        Essaie un autre mot-clé ou explore les modules.
                      </Text>
                    </View>
                  </FadeUp>
                ) : null}

                {/* Results */}
                {showResults && results.length > 0 ? (
                  <View style={{ gap: 24, paddingTop: 8, paddingBottom: 24 }}>
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryLeft}>
                        <Sparkles size={11} color="#C4B5FD" />
                        <Text style={styles.summaryCount}>
                          {results.length}
                        </Text>
                        <Text style={styles.summaryText}>
                          résultat{results.length > 1 ? "s" : ""}
                        </Text>
                      </View>
                      <Text style={styles.summaryCategories}>
                        {resultCategoryCount} catégorie
                        {resultCategoryCount > 1 ? "s" : ""}
                      </Text>
                    </View>

                    {groupedEntries.map(([category, items]) => {
                      const color = CATEGORY_COLORS[category];
                      return (
                        <View key={category}>
                          <View style={styles.groupHeader}>
                            <View
                              style={[
                                styles.groupIcon,
                                {
                                  backgroundColor: `${color}22`,
                                  borderColor: `${color}44`,
                                },
                              ]}
                            >
                              {getCategoryIcon(category, 12)}
                            </View>
                            <Text style={[styles.groupTitle, { color }]}>
                              {category.toUpperCase()}
                            </Text>
                            <Text style={styles.groupCount}>
                              {items.length}
                            </Text>
                          </View>

                          <View style={{ gap: 6 }}>
                            {items.map((result, index) => (
                              <ResultRow
                                key={result.id}
                                result={result}
                                index={index}
                                compact={category === "Modules"}
                                onSelect={handleSelect}
                              />
                            ))}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : null}
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>
      ) : null}
    </>
  );
}

/* ============================================================
 * STYLES
 * ============================================================ */

const styles = StyleSheet.create({
  /* ── Trigger ────────────────────────────────────── */
  triggerWrap: {
    marginHorizontal: 20,
    marginTop: 12,
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  triggerSearchIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  triggerTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "rgba(255,255,255,0.55)",
    letterSpacing: -0.2,
  },
  triggerSub: {
    marginTop: 3,
    fontSize: 10,
    color: "rgba(255,255,255,0.3)",
    fontWeight: "500",
  },
  triggerMic: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  advancedBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
    marginTop: 6,
  },
  advancedBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(196,181,253,0.85)",
    letterSpacing: 0.1,
  },
  advancedBtnDot: {
    fontSize: 11,
    color: "rgba(255,255,255,0.2)",
  },

  /* ── Backdrop ───────────────────────────────────── */
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.85)",
  },

  /* ── Panel ──────────────────────────────────────── */
  panel: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#06061A",
    overflow: "hidden",
  },
  ambientGlowTop: {
    position: "absolute",
    top: -140,
    left: "15%",
    right: "15%",
    height: 260,
    borderRadius: 9999,
    backgroundColor: "rgba(124,58,237,0.22)",
  },
  ambientGlowRight: {
    position: "absolute",
    top: "35%",
    right: -180,
    width: 260,
    height: 260,
    borderRadius: 9999,
    backgroundColor: "rgba(99,102,241,0.16)",
  },

  /* ── Header ─────────────────────────────────────── */
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
    maxWidth: 720,
    width: "100%",
    alignSelf: "center",
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    color: "rgba(196,181,253,0.85)",
  },
  headerTitle: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
  },
  headerCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  /* ── Search bar ─────────────────────────────────── */
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.35)",
    maxWidth: 720,
    width: "100%",
    alignSelf: "center",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 6,
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
  },
  searchClearBtn: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  searchMicBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.4)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.5)",
  },
  searchMicBtnActive: {
    backgroundColor: "rgba(239,68,68,0.25)",
    borderColor: "rgba(248,113,113,0.5)",
  },

  /* ── Chips ──────────────────────────────────────── */
  chipsRow: {
    gap: 8,
    paddingVertical: 10,
    maxWidth: 720,
    alignSelf: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.65)",
    letterSpacing: 0.1,
  },
  chipCount: {
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "700",
    marginLeft: 2,
  },

  /* ── Body ───────────────────────────────────────── */
  bodyContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    maxWidth: 720,
    width: "100%",
    alignSelf: "center",
  },

  /* ── Section label ──────────────────────────────── */
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  sectionLabelText: {
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 1.8,
    color: "rgba(255,255,255,0.5)",
  },

  /* ── Quick grid ─────────────────────────────────── */
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickGridItemWrap: {
    flexBasis: "23%",
    flexGrow: 1,
    minWidth: 76,
  },
  quickModule: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  quickModuleIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  quickModuleLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    letterSpacing: 0.1,
    minHeight: 26,
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    marginTop: 8,
  },
  seeAllBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(196,181,253,0.9)",
    letterSpacing: 0.1,
  },

  /* ── History ────────────────────────────────────── */
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  historyClear: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(196,181,253,0.85)",
    letterSpacing: 0.1,
  },
  historyCard: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  historyBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  historyRowBorder: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  historyText: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "500",
  },
  historyRemoveBtn: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  /* ── Trending ───────────────────────────────────── */
  trendingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  trendingChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  trendingChipText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "rgba(255,255,255,0.65)",
    letterSpacing: 0.1,
  },

  /* ── AI card ────────────────────────────────────── */
  aiCard: {
    borderRadius: 20,
    padding: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.28)",
  },
  aiCardBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  aiCardOrb: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 160,
    height: 160,
    borderRadius: 9999,
    backgroundColor: "rgba(139,92,246,0.22)",
  },
  aiCardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  aiCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.4)",
  },
  aiCardEyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.6,
    color: "rgba(196,181,253,0.85)",
  },
  aiCardText: {
    marginTop: 6,
    fontSize: 12.5,
    lineHeight: 18,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
  },
  aiCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  aiCardBtnText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "rgba(196,181,253,0.95)",
    letterSpacing: 0.1,
  },

  /* ── No results ─────────────────────────────────── */
  noResultsWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  noResultsIcon: {
    width: 68,
    height: 68,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    marginBottom: 20,
  },
  noResultsTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: -0.2,
  },
  noResultsQuery: {
    marginTop: 6,
    maxWidth: 260,
    fontSize: 14,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.2,
  },
  noResultsSub: {
    marginTop: 10,
    maxWidth: 260,
    fontSize: 11.5,
    lineHeight: 17,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    fontWeight: "500",
  },

  /* ── Results summary ────────────────────────────── */
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  summaryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  summaryCount: {
    fontSize: 12,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.1,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 0.1,
  },
  summaryCategories: {
    fontSize: 10.5,
    color: "rgba(255,255,255,0.35)",
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  /* ── Group header ───────────────────────────────── */
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  groupIcon: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  groupTitle: {
    flex: 1,
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 1.6,
  },
  groupCount: {
    fontSize: 10.5,
    color: "rgba(255,255,255,0.35)",
    fontWeight: "700",
  },

  /* ── Result row ─────────────────────────────────── */
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  resultRowCompact: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 10,
  },
  resultIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  resultIconCompact: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  resultTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "rgba(255,255,255,0.92)",
    letterSpacing: -0.2,
  },
  resultSubtitle: {
    marginTop: 3,
    fontSize: 10.5,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "500",
  },
  resultMetaCol: {
    alignItems: "flex-end",
    gap: 4,
    maxWidth: 120,
  },
  resultMeta: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "rgba(255,255,255,0.55)",
  },
  resultBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  resultBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
});
