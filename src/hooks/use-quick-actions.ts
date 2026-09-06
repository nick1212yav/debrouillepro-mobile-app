import { useState, useCallback } from "react";

export type ActionId =
  | "paiement" | "transport" | "livraison" | "sante" | "emplois"
  | "carte" | "voyages" | "immo" | "community" | "agri"
  | "media" | "evenements" | "sos" | "wallet" | "messages" | "explorer"
  | "apprendre" | "parrainage" | "marketplace" | "recompenses" | "agenda" | "documents"
  | "dashboard" | "notifications" | "favorites" | "actions"
  | "profile" | "budget" | "aide" | "actualites" | "logement" | "emploi" | "evenements-pro" | "juridique" | "groupes" | "live" | "reputation" | "cocreation" | "premium" | "revenus" | "marketplace-pro" | "revenus-dashboard" | "editeur" | "studio" | "stories-creator" | "templates" | "fitness" | "nutrition" | "meditation" | "bienetre" | "destinations" | "planificateur" | "carnet-voyage" | "budget-voyage" | "cours" | "quiz" | "certifications" | "mentorat"
  | "hebergement" | "restauration" | "annonces"
  | "urbanisme" | "amenagement" | "environnement"
  | "business" | "city-habitat" | "services"
  | "tracking" | "ecole" | "eglise"
  | "network" | "pub" | "data-publique" | "securite" | "map3d" | "analytics" | "events-agenda" | "boost" | "ai-studio";

export type QuickAction = {
  id: ActionId;
  label: string;
  color: string;
  bg: string;
  route: string;
  description: string;
};

export const ALL_ACTIONS: QuickAction[] = [
  // ── Core services
  { id: "paiement",      label: "Paiement",       color: "#10B981", bg: "rgba(16,185,129,0.15)",  route: "paiement",      description: "Mobile money & transferts" },
  { id: "wallet",        label: "Wallet",          color: "#059669", bg: "rgba(5,150,105,0.15)",   route: "wallet",        description: "Solde & budget mensuel" },
  { id: "transport",     label: "Transport",       color: "#3B82F6", bg: "rgba(59,130,246,0.15)",  route: "transport",     description: "VTC, moto, bus" },
  { id: "livraison",     label: "Livraison",       color: "#F97316", bg: "rgba(249,115,22,0.15)",  route: "livraison",     description: "Colis & courses express" },
  { id: "sante",         label: "Santé",           color: "#EF4444", bg: "rgba(239,68,68,0.15)",   route: "sante",         description: "Médecins & pharmacies" },
  { id: "emplois",       label: "Emplois",         color: "#8B5CF6", bg: "rgba(139,92,246,0.15)",  route: "jobs",          description: "Offres d'emploi & CV" },
  { id: "immo",          label: "Immobilier",      color: "#F97316", bg: "rgba(249,115,22,0.12)",  route: "immo",          description: "Maisons & appartements" },
  // ── Travel & map
  { id: "carte",         label: "Carte",           color: "#6366F1", bg: "rgba(99,102,241,0.15)",  route: "carte",         description: "Services autour de vous" },
  { id: "voyages",       label: "Voyages",         color: "#0EA5E9", bg: "rgba(14,165,233,0.15)",  route: "voyages",       description: "Billets & hébergements" },
  // ── Community & social
  { id: "community",     label: "Community",       color: "#8B5CF6", bg: "rgba(139,92,246,0.12)",  route: "community",     description: "Groupes & posts" },
  { id: "marketplace",   label: "Boutique",        color: "#EC4899", bg: "rgba(236,72,153,0.15)",  route: "marketplace",   description: "Vente & achat entre voisins" },
  { id: "evenements",    label: "Événements",      color: "#EC4899", bg: "rgba(236,72,153,0.12)",  route: "evenements",    description: "Concerts, foires & sorties" },
  { id: "messages",      label: "Messages",        color: "#3B82F6", bg: "rgba(59,130,246,0.12)",  route: "messages",      description: "Chats & discussions" },
  { id: "parrainage",    label: "Parrainage",      color: "#F59E0B", bg: "rgba(245,158,11,0.15)",  route: "parrainage",    description: "Inviter & gagner des récompenses" },
  // ── Content & info
  { id: "agri",          label: "Agri",            color: "#22C55E", bg: "rgba(34,197,94,0.15)",   route: "agri",          description: "Conseils & météo agricole" },
  { id: "media",         label: "Média",           color: "#06B6D4", bg: "rgba(6,182,212,0.15)",   route: "media",         description: "Actualités & podcasts" },
  { id: "apprendre",     label: "Apprendre",       color: "#A78BFA", bg: "rgba(167,139,250,0.15)", route: "apprendre",     description: "Cours & certifications" },
  { id: "actualites",    label: "Actualités",      color: "#06B6D4", bg: "rgba(6,182,212,0.12)",   route: "media",         description: "News & tendances" },
  // ── Utility & tools
  { id: "explorer",      label: "Explorer",        color: "#6366F1", bg: "rgba(99,102,241,0.12)",  route: "explorer",      description: "Tous les modules" },
  { id: "actions",       label: "Actions",         color: "#10B981", bg: "rgba(16,185,129,0.12)",  route: "actions",       description: "Tâches & démarches rapides" },
  { id: "dashboard",     label: "Dashboard",       color: "#F97316", bg: "rgba(249,115,22,0.12)",  route: "dashboard",     description: "Stats & aperçu global" },
  { id: "favorites",     label: "Favoris",         color: "#EF4444", bg: "rgba(239,68,68,0.12)",   route: "favorites",     description: "Vos services favoris" },
  { id: "recompenses",   label: "Récompenses",     color: "#F59E0B", bg: "rgba(245,158,11,0.12)",  route: "recompenses",   description: "Points XP & badges" },
  { id: "agenda",        label: "Agenda",          color: "#6366F1", bg: "rgba(99,102,241,0.12)", route: "agenda",        description: "Calendrier personnel" },
  { id: "documents",     label: "Coffre-fort",     color: "#10B981", bg: "rgba(16,185,129,0.12)", route: "documents",     description: "Documents sécurisés" },
  { id: "budget",        label: "Budget",          color: "#10B981", bg: "rgba(16,185,129,0.1)",   route: "wallet",        description: "Suivi des dépenses" },
  // ── Safety & profile
  { id: "sos",           label: "SOS",             color: "#EF4444", bg: "rgba(239,68,68,0.12)",   route: "sos",           description: "Urgences & alertes GPS" },
  { id: "aide",          label: "Aide",            color: "#8B5CF6", bg: "rgba(139,92,246,0.1)",   route: "actions",       description: "Assistance & FAQ" },
  { id: "profile",       label: "Profil",          color: "#6366F1", bg: "rgba(99,102,241,0.1)",   route: "profile",       description: "Mon profil & carte de visite" },
  { id: "notifications", label: "Notifs",          color: "#F97316", bg: "rgba(249,115,22,0.1)",   route: "notifications", description: "Alertes & annonces" },
  { id: "logement",      label: "Logement",        color: "#F97316", bg: "rgba(249,115,22,0.15)",  route: "logement",      description: "Location, achat & colocation" },
  { id: "emploi",        label: "Emploi/Freelance",color: "#8B5CF6", bg: "rgba(139,92,246,0.15)",  route: "emploi",        description: "Offres d'emploi & missions" },
  { id: "evenements-pro",label: "Événements",     color: "#EC4899", bg: "rgba(236,72,153,0.15)",  route: "evenements-pro", description: "Concerts, expos & sorties" },
  { id: "juridique",     label: "Juridique",       color: "#6366F1", bg: "rgba(99,102,241,0.15)",  route: "juridique",      description: "Contrats, démarches & droits" },
  { id: "groupes",       label: "Groupes",         color: "#8B5CF6", bg: "rgba(139,92,246,0.15)",  route: "groupes",        description: "Communautés & groupes thématiques" },
  { id: "live",          label: "Live & Stories",  color: "#EF4444", bg: "rgba(239,68,68,0.15)",   route: "live",           description: "Lives, stories & replays" },
  { id: "reputation",    label: "Réputation",      color: "#F59E0B", bg: "rgba(245,158,11,0.15)",  route: "reputation",     description: "Badges & classement communauté" },
  { id: "cocreation",   label: "Co-création",     color: "#EC4899", bg: "rgba(236,72,153,0.15)",  route: "cocreation",     description: "Défis collectifs & contributions" },
  { id: "premium",      label: "Premium",         color: "#8B5CF6", bg: "rgba(139,92,246,0.15)", route: "premium",        description: "Abonnements & avantages Pro" },
  { id: "revenus",        label: "Revenus Contenu",  color: "#EC4899", bg: "rgba(236,72,153,0.15)", route: "revenus",        description: "Tableau de bord créateur & tips" },
  { id: "marketplace-pro", label: "Marketplace Pro", color: "#F97316", bg: "rgba(249,115,22,0.15)", route: "marketplace-pro", description: "Dashboard vendeur & commissions" },
  { id: "revenus-dashboard", label: "Tableau Revenus", color: "#10B981", bg: "rgba(16,185,129,0.15)", route: "revenus-dashboard", description: "Vue consolidée de tous vos revenus" },
  { id: "editeur", label: "Éditeur Contenu", color: "#8B5CF6", bg: "rgba(139,92,246,0.15)", route: "editeur", description: "Créez et publiez du contenu riche" },
  { id: "studio", label: "Studio Photo", color: "#EC4899", bg: "rgba(236,72,153,0.15)", route: "studio", description: "Créez des visuels et images" },
  { id: "stories-creator", label: "Créateur Stories", color: "#F59E0B", bg: "rgba(245,158,11,0.15)", route: "stories-creator", description: "Créez et publiez des stories animées" },
  { id: "templates", label: "Templates & Assets", color: "#6C5CE7", bg: "rgba(108,92,231,0.15)", route: "templates", description: "Bibliothèque de templates créatifs" },
  { id: "fitness", label: "Fitness & Sport", color: "#E17055", bg: "rgba(225,112,85,0.15)", route: "fitness", description: "Programmes d'entraînement sans équipement" },
  { id: "nutrition", label: "Nutrition & Repas", color: "#00B894", bg: "rgba(0,184,148,0.15)", route: "nutrition", description: "Journal alimentaire et recettes saines" },
  { id: "meditation", label: "Méditation", color: "#8B5CF6", bg: "rgba(139,92,246,0.15)", route: "meditation", description: "Sessions guidées et exercices de souffle" },
  { id: "bienetre", label: "Tableau Bien-être", color: "#EC4899", bg: "rgba(236,72,153,0.15)", route: "bienetre", description: "Vue consolidée fitness + nutrition + méditation" },
  { id: "destinations", label: "Destinations", color: "#6366F1", bg: "rgba(99,102,241,0.15)", route: "destinations", description: "Découvrez votre prochain voyage" },
  { id: "planificateur", label: "Planificateur", color: "#06B6D4", bg: "rgba(6,182,212,0.15)", route: "planificateur", description: "Organisez votre itinéraire" },
  { id: "carnet-voyage", label: "Carnet de Voyage", color: "#F59E0B", bg: "rgba(245,158,11,0.15)", route: "carnet-voyage", description: "Journal & souvenirs de voyage" },
  { id: "budget-voyage", label: "Budget Voyage", color: "#10B981", bg: "rgba(16,185,129,0.15)", route: "budget-voyage", description: "Suivez vos dépenses en voyage" },
  { id: "cours", label: "Cours & Catalogue", color: "#6366F1", bg: "rgba(99,102,241,0.15)", route: "cours", description: "Apprenez de nouvelles compétences" },
  { id: "quiz", label: "Quiz & Évaluations", color: "#A855F7", bg: "rgba(168,85,247,0.15)", route: "quiz", description: "Testez vos connaissances" },
  { id: "certifications", label: "Certifications", color: "#10B981", bg: "rgba(16,185,129,0.15)", route: "certifications", description: "Vos parcours et badges" },
  { id: "mentorat", label: "Mentorat", color: "#8B5CF6", bg: "rgba(139,92,246,0.15)", route: "mentorat", description: "Mentors et forum communautaire" },
  { id: "hebergement", label: "Hébergement", color: "#6366F1", bg: "rgba(99,102,241,0.15)", route: "hebergement", description: "Logements, hôtels & colocation" },
  { id: "restauration", label: "Restauration", color: "#F97316", bg: "rgba(249,115,22,0.15)", route: "restauration", description: "Restaurants & livraison repas" },
  { id: "annonces", label: "Annonces", color: "#F59E0B", bg: "rgba(245,158,11,0.15)", route: "annonces", description: "Petites annonces & marketplace locale" },
  { id: "urbanisme", label: "Urbanisme", color: "#6366F1", bg: "rgba(99,102,241,0.15)", route: "urbanisme", description: "Projets urbains & permis de construire" },
  { id: "amenagement", label: "Aménagement", color: "#F59E0B", bg: "rgba(245,158,11,0.15)", route: "amenagement", description: "Professionnels BTP, déco & inspiration" },
  { id: "environnement", label: "Environnement", color: "#22C55E", bg: "rgba(34,197,94,0.15)", route: "environnement", description: "Qualité de l'air, éco-gestes & recyclage" },
  { id: "business", label: "Business", color: "#6366F1", bg: "rgba(99,102,241,0.15)", route: "business", description: "Annuaire entreprises, stats & opportunités" },
  { id: "city-habitat", label: "City-Habitat", color: "#10B981", bg: "rgba(16,185,129,0.15)", route: "city-habitat", description: "Résidences, services & vie de quartier" },
  { id: "services", label: "Services", color: "#F97316", bg: "rgba(249,115,22,0.15)", route: "services", description: "Dépannage, beauté, livraison & plus" },
  { id: "tracking", label: "Tracking", color: "#06B6D4", bg: "rgba(6,182,212,0.15)", route: "tracking", description: "Suivi colis, véhicules & appareils" },
  { id: "ecole", label: "École", color: "#8B5CF6", bg: "rgba(139,92,246,0.15)", route: "ecole", description: "Notes, emploi du temps & résultats" },
  { id: "eglise", label: "Église", color: "#EC4899", bg: "rgba(236,72,153,0.15)", route: "eglise", description: "Cultes live, prières & communauté spirituelle" },
  { id: "network", label: "Network Pro", color: "#6366F1", bg: "rgba(99,102,241,0.15)", route: "network", description: "Réseau professionnel & opportunités" },
  { id: "pub", label: "Publicité", color: "#F59E0B", bg: "rgba(245,158,11,0.15)", route: "pub", description: "Campagnes publicitaires & analytics" },
  { id: "data-publique", label: "Data Publique", color: "#10B981", bg: "rgba(16,185,129,0.15)", route: "data-publique", description: "Données ouvertes & indicateurs nationaux" },
  { id: "securite", label: "Sécurité", color: "#EF4444", bg: "rgba(239,68,68,0.15)", route: "securite", description: "Incidents, alertes & numéros d'urgence" },
  { id: "map3d", label: "Carte 3D", color: "#8B5CF6", bg: "rgba(139,92,246,0.15)", route: "map3d", description: "Carte interactive 3D de la ville" },
  { id: "events-agenda", label: "Agenda Événements", color: "#8b5cf6", bg: "rgba(139,92,246,0.15)", route: "events-agenda", description: "Événements & agenda communautaire" },
  { id: "analytics", label: "Mes Analytics", color: "#22c55e", bg: "rgba(34,197,94,0.15)", route: "analytics", description: "Statistiques personnelles" },
  { id: "boost", label: "Boost Annonces", color: "#f59e0b", bg: "rgba(245,158,11,0.15)", route: "boost", description: "Mettre en avant vos publications" },
  { id: "ai-studio", label: "IA Studio", color: "#8B5CF6", bg: "rgba(139,92,246,0.15)", route: "ai-studio", description: "Générer, traduire & modérer du contenu avec l'IA" },
];

export const ALL_ACTIONS_COUNT = ALL_ACTIONS.length; // 28

const STORAGE_KEY = "debrouille_quick_actions_v2";
const DEFAULT_IDS: ActionId[] = ["paiement", "transport", "livraison", "sante", "emplois", "carte", "voyages"];
const MAX_ACTIONS = 7;

function loadFromStorage(): ActionId[] {
  try {
    // Try v2 key first, fall back to v1 for migration
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem("debrouille_quick_actions");
    if (!raw) return DEFAULT_IDS;
    const parsed = JSON.parse(raw) as ActionId[];
    const valid = parsed.filter((id) => ALL_ACTIONS.some((a) => a.id === id));
    return valid.length > 0 ? valid.slice(0, MAX_ACTIONS) : DEFAULT_IDS;
  } catch {
    return DEFAULT_IDS;
  }
}

function saveToStorage(ids: ActionId[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function useQuickActions() {
  const [activeIds, setActiveIds] = useState<ActionId[]>(() => loadFromStorage());

  const activeActions = activeIds.map((id) => ALL_ACTIONS.find((a) => a.id === id)!).filter(Boolean);
  const canAdd = activeIds.length < MAX_ACTIONS;

  const toggle = useCallback((id: ActionId) => {
    setActiveIds((prev) => {
      let next: ActionId[];
      if (prev.includes(id)) {
        next = prev.filter((x) => x !== id);
      } else {
        if (prev.length >= MAX_ACTIONS) return prev;
        next = [...prev, id];
      }
      saveToStorage(next);
      return next;
    });
  }, []);

  const reorder = useCallback((newIds: ActionId[]) => {
    setActiveIds(newIds);
    saveToStorage(newIds);
  }, []);

  const reset = useCallback(() => {
    setActiveIds(DEFAULT_IDS);
    saveToStorage(DEFAULT_IDS);
  }, []);

  return { activeIds, activeActions, canAdd, toggle, reorder, reset, MAX_ACTIONS };
}
