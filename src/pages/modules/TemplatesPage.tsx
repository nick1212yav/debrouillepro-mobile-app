import React, { memo, useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated } from "@/lib/convex-auth-compat";
import { Clipboard } from "@react-native-clipboard/clipboard";
import {
  ArrowLeft,
  BarChart3,
  Bookmark,
  Check,
  ChevronRight,
  Download,
  Eye,
  ExternalLink,
  FolderOpen,
  Grid3X3,
  Heart,
  LayoutTemplate,
  List,
  Package,
  Palette,
  Plus,
  Search,
  Sparkles,
  Star,
  X,
} from "lucide-react-native";

/**
 * ============================================================================
 * TEMPLATES HUB — DÉBROUILLEPRO
 * ============================================================================
 *
 * PRINCIPES
 * --------------------------------------------------------------------------
 * 1. React Native uniquement.
 * 2. Aucun DOM / CSS / className / animation Web.
 * 3. Aucun faux compteur présenté comme statistique réelle.
 * 4. Les projets "Mes créations" viennent de Convex.
 * 5. Les créations ne prétendent pas être exportées si aucun moteur d'export
 *    n'est connecté.
 * 6. Le catalogue éditorial local est explicitement séparé des données
 *    utilisateur.
 * 7. Les favoris locaux sont des préférences de session tant qu'aucune
 *    mutation backend dédiée n'existe.
 * 8. Les états loading / empty / error / success sont explicites.
 *
 * BACKEND ACTUELLEMENT UTILISÉ
 * --------------------------------------------------------------------------
 * api.media.listMyProjects
 * api.media.createCollaborativeProject
 *
 * ============================================================================
 */

type TemplateCategory =
  | "all"
  | "business"
  | "promo"
  | "lifestyle"
  | "event"
  | "social";

type AssetCategory = "all" | "logos" | "backgrounds" | "palettes" | "icons";

type Tab = "templates" | "assets" | "mes-creations" | "stats";

type CatalogTemplate = {
  id: string;
  title: string;
  category: Exclude<TemplateCategory, "all">;
  description: string;
  width: number;
  height: number;
  tags: string[];
  colors: string[];
  premium: boolean;
  isNew: boolean;
};

type CatalogAsset = {
  id: string;
  title: string;
  category: Exclude<AssetCategory, "all">;
  description: string;
  tags: string[];
  colors: string[];
};

type Palette = {
  id: string;
  name: string;
  colors: string[];
  description: string;
};

type CreationType = "editeur" | "studio" | "stories";

const TEMPLATES: CatalogTemplate[] = [
  {
    id: "business-card",
    title: "Carte de visite professionnelle",
    category: "business",
    description:
      "Structure conçue pour présenter une activité, une identité et des coordonnées.",
    width: 1050,
    height: 600,
    tags: ["business", "contact", "pro"],
    colors: ["#111827", "#2563EB"],
    premium: false,
    isNew: false,
  },
  {
    id: "business-company",
    title: "Présentation d'entreprise",
    category: "business",
    description:
      "Composition adaptée aux présentations d'entreprises et marques.",
    width: 1080,
    height: 1080,
    tags: ["entreprise", "brand", "B2B"],
    colors: ["#2563EB", "#F59E0B"],
    premium: true,
    isNew: false,
  },
  {
    id: "recruitment",
    title: "Annonce de recrutement",
    category: "business",
    description:
      "Format carré pour structurer une opportunité professionnelle.",
    width: 1080,
    height: 1080,
    tags: ["emploi", "recrutement", "RH"],
    colors: ["#059669", "#0F172A"],
    premium: false,
    isNew: true,
  },
  {
    id: "flash-sale",
    title: "Promotion Flash",
    category: "promo",
    description: "Composition orientée offre commerciale et appel à l'action.",
    width: 1080,
    height: 1080,
    tags: ["vente", "offre", "promotion"],
    colors: ["#F97316", "#F59E0B"],
    premium: false,
    isNew: false,
  },
  {
    id: "story-sale",
    title: "Story Promotion",
    category: "promo",
    description:
      "Format vertical optimisé pour une communication promotionnelle.",
    width: 1080,
    height: 1920,
    tags: ["story", "vente", "social"],
    colors: ["#DC2626", "#1E3A8A"],
    premium: false,
    isNew: true,
  },
  {
    id: "community-event",
    title: "Événement communautaire",
    category: "event",
    description: "Affiche verticale pour événements locaux et communautaires.",
    width: 1080,
    height: 1440,
    tags: ["communauté", "local", "événement"],
    colors: ["#10B981", "#2563EB"],
    premium: false,
    isNew: true,
  },
  {
    id: "party",
    title: "Invitation événementielle",
    category: "event",
    description:
      "Composition verticale pour invitation et communication événementielle.",
    width: 1080,
    height: 1920,
    tags: ["invitation", "soirée", "événement"],
    colors: ["#7C3AED", "#DB2777"],
    premium: false,
    isNew: false,
  },
  {
    id: "birthday",
    title: "Célébration personnelle",
    category: "lifestyle",
    description:
      "Format carré destiné aux publications personnelles et célébrations.",
    width: 1080,
    height: 1080,
    tags: ["anniversaire", "célébration", "social"],
    colors: ["#DB2777", "#F59E0B"],
    premium: false,
    isNew: false,
  },
  {
    id: "daily-story",
    title: "Story quotidienne",
    category: "lifestyle",
    description:
      "Structure verticale pour partager une actualité ou un moment.",
    width: 1080,
    height: 1920,
    tags: ["vie", "story", "quotidien"],
    colors: ["#8B5CF6", "#3B82F6"],
    premium: false,
    isNew: false,
  },
  {
    id: "product-carousel",
    title: "Présentation produit",
    category: "social",
    description: "Base pour construire une communication produit multi-format.",
    width: 1080,
    height: 1080,
    tags: ["produit", "commerce", "social"],
    colors: ["#0891B2", "#10B981"],
    premium: true,
    isNew: true,
  },
  {
    id: "qa-story",
    title: "Questions & réponses",
    category: "social",
    description:
      "Format vertical conçu pour favoriser les interactions avec une audience.",
    width: 1080,
    height: 1920,
    tags: ["questions", "engagement", "story"],
    colors: ["#EA580C", "#F59E0B"],
    premium: false,
    isNew: false,
  },
];

const ASSETS: CatalogAsset[] = [
  {
    id: "logo-circle",
    title: "Logo minimal circulaire",
    category: "logos",
    description: "Base graphique minimaliste.",
    tags: ["minimal", "logo"],
    colors: ["#7C3AED", "#A78BFA"],
  },
  {
    id: "logo-wave",
    title: "Logo vague moderne",
    category: "logos",
    description: "Base graphique fluide.",
    tags: ["moderne", "logo"],
    colors: ["#2563EB", "#60A5FA"],
  },
  {
    id: "sunset",
    title: "Fond Sunset",
    category: "backgrounds",
    description: "Fond chaud pour compositions créatives.",
    tags: ["dégradé", "chaud"],
    colors: ["#F97316", "#F59E0B", "#DB2777"],
  },
  {
    id: "blue-geometry",
    title: "Fond géométrique bleu",
    category: "backgrounds",
    description: "Fond graphique orienté tech et business.",
    tags: ["bleu", "géométrique"],
    colors: ["#2563EB", "#7C3AED"],
  },
  {
    id: "dark-abstract",
    title: "Fond abstrait sombre",
    category: "backgrounds",
    description: "Fond sombre pour compositions premium.",
    tags: ["abstrait", "dark"],
    colors: ["#020617", "#1E293B"],
  },
  {
    id: "paper",
    title: "Texture papier",
    category: "backgrounds",
    description: "Base organique et éditoriale.",
    tags: ["papier", "texture"],
    colors: ["#E2E8F0", "#94A3B8"],
  },
  {
    id: "business-icons",
    title: "Icônes Business",
    category: "icons",
    description: "Collection conceptuelle pour créations professionnelles.",
    tags: ["business", "icônes"],
    colors: ["#2563EB", "#60A5FA"],
  },
  {
    id: "nature-icons",
    title: "Icônes Nature",
    category: "icons",
    description: "Collection orientée environnement et agriculture.",
    tags: ["nature", "écologie"],
    colors: ["#059669", "#34D399"],
  },
];

const PALETTES: Palette[] = [
  {
    id: "ocean",
    name: "Ocean Deep",
    description: "Bleu profond et cyan.",
    colors: ["#03045E", "#0077B6", "#00B4D8", "#90E0EF"],
  },
  {
    id: "forest",
    name: "Forest Fresh",
    description: "Palette naturelle et organique.",
    colors: ["#2D6A4F", "#40916C", "#52B788", "#74C69D"],
  },
  {
    id: "sunset",
    name: "Sunset Glow",
    description: "Palette chaude et expressive.",
    colors: ["#FF6B35", "#F7C59F", "#004E89", "#1A936F"],
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Palette sombre destinée aux interfaces premium.",
    colors: ["#020617", "#1E293B", "#475569", "#94A3B8"],
  },
];

const TEMPLATE_CATEGORIES: Array<{
  id: TemplateCategory;
  label: string;
}> = [
  { id: "all", label: "Tous" },
  { id: "business", label: "Business" },
  { id: "promo", label: "Promo" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "event", label: "Événements" },
  { id: "social", label: "Social" },
];

const ASSET_CATEGORIES: Array<{
  id: AssetCategory;
  label: string;
}> = [
  { id: "all", label: "Tous" },
  { id: "logos", label: "Logos" },
  { id: "backgrounds", label: "Fonds" },
  { id: "palettes", label: "Palettes" },
  { id: "icons", label: "Icônes" },
];

const TYPE_LABELS: Record<CreationType, string> = {
  editeur: "Éditeur",
  studio: "Studio",
  stories: "Stories",
};

function normalizeSearch(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function formatDate(value: string | number): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date indisponible";
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatProjectStatus(status: string): string {
  if (!status) {
    return "Projet";
  }

  return status
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function CatalogPreview({
  colors,
  compact = false,
}: {
  colors: string[];
  compact?: boolean;
}) {
  return (
    <View
      style={[
        styles.catalogPreview,
        compact && styles.catalogPreviewCompact,
        {
          backgroundColor: colors[0] ?? "#1E293B",
        },
      ]}
    >
      <View
        style={[
          styles.previewOrb,
          {
            backgroundColor: colors[1] ?? "#6366F1",
          },
        ]}
      />

      <View style={styles.previewContent}>
        <View
          style={[
            styles.previewLineLarge,
            {
              backgroundColor: "rgba(255,255,255,0.92)",
            },
          ]}
        />

        <View
          style={[
            styles.previewLineSmall,
            {
              backgroundColor: "rgba(255,255,255,0.48)",
            },
          ]}
        />
      </View>

      <View style={styles.previewFooter}>
        {(colors.slice(0, 4) ?? []).map((color) => (
          <View
            key={color}
            style={[
              styles.previewColorDot,
              {
                backgroundColor: color,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const TemplateCard = memo(function TemplateCard({
  template,
  onOpen,
}: {
  template: CatalogTemplate;
  onOpen: (template: CatalogTemplate) => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir ${template.title}`}
      onPress={() => onOpen(template)}
      style={({ pressed }) => [styles.templateCard, pressed && styles.pressed]}
    >
      <View style={styles.templatePreviewWrapper}>
        <CatalogPreview colors={template.colors} />

        <View style={styles.badgesRow}>
          {template.isNew ? (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NOUVEAU</Text>
            </View>
          ) : null}

          {template.premium ? (
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text numberOfLines={2} style={styles.cardTitle}>
          {template.title}
        </Text>

        <Text numberOfLines={2} style={styles.cardDescription}>
          {template.description}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.dimensionBadge}>
            <Text style={styles.dimensionText}>
              {template.width} × {template.height}
            </Text>
          </View>

          <ChevronRight size={16} color="#64748B" />
        </View>
      </View>
    </Pressable>
  );
});

const AssetCard = memo(function AssetCard({
  asset,
  favorite,
  onToggleFavorite,
}: {
  asset: CatalogAsset;
  favorite: boolean;
  onToggleFavorite: (id: string) => void;
}) {
  return (
    <View style={styles.assetCard}>
      <View style={styles.assetPreview}>
        <CatalogPreview colors={asset.colors} compact />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            favorite
              ? `Retirer ${asset.title} des favoris`
              : `Ajouter ${asset.title} aux favoris`
          }
          onPress={() => onToggleFavorite(asset.id)}
          style={({ pressed }) => [
            styles.favoriteButton,
            pressed && styles.pressedSmall,
          ]}
        >
          <Heart
            size={15}
            color={favorite ? "#FB7185" : "#FFFFFF"}
            fill={favorite ? "#FB7185" : "transparent"}
          />
        </Pressable>
      </View>

      <View style={styles.assetBody}>
        <Text numberOfLines={2} style={styles.assetTitle}>
          {asset.title}
        </Text>

        <Text numberOfLines={2} style={styles.assetDescription}>
          {asset.description}
        </Text>
      </View>
    </View>
  );
});

function TemplateDetailModal({
  template,
  visible,
  onClose,
  onOpenStudio,
}: {
  template: CatalogTemplate | null;
  visible: boolean;
  onClose: () => void;
  onOpenStudio: () => void;
}) {
  if (!template) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.modalCard}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <Text style={styles.modalEyebrow}>CATALOGUE CRÉATIF</Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fermer"
              onPress={onClose}
              style={styles.closeButton}
            >
              <X size={18} color="#CBD5E1" />
            </Pressable>
          </View>

          <CatalogPreview colors={template.colors} />

          <View style={styles.modalContent}>
            <View style={styles.modalTitleRow}>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>{template.title}</Text>

                <Text style={styles.modalSubtitle}>
                  {template.width} × {template.height} px
                </Text>
              </View>

              {template.premium ? (
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.modalDescription}>{template.description}</Text>

            <View style={styles.tagsContainer}>
              {template.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>

            <View style={styles.truthCard}>
              <Sparkles size={17} color="#A78BFA" />

              <View style={styles.truthContent}>
                <Text style={styles.truthTitle}>Base créative</Text>

                <Text style={styles.truthText}>
                  Ce catalogue décrit une base de composition. Le chargement
                  automatique de ce template dans le moteur Studio dépend de la
                  connexion réelle du template au moteur de création.
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={onOpenStudio}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Sparkles size={17} color="#FFFFFF" />

              <Text style={styles.primaryButtonText}>Ouvrir Studio</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>{icon}</View>

      <Text style={styles.emptyTitle}>{title}</Text>

      <Text style={styles.emptyDescription}>{description}</Text>

      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.secondaryButtonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function LoadingState() {
  return (
    <View style={styles.loadingState}>
      <ActivityIndicator size="small" color="#8B5CF6" />

      <Text style={styles.loadingText}>Chargement de vos créations…</Text>
    </View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.errorState}>
      <View style={styles.errorIcon}>
        <X size={20} color="#FB7185" />
      </View>

      <Text style={styles.errorTitle}>Impossible de charger vos créations</Text>

      <Text style={styles.errorText}>
        Vérifiez votre connexion puis réessayez. Aucune donnée fictive n'est
        affichée à la place de vos projets.
      </Text>

      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [
          styles.secondaryButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.secondaryButtonText}>Réessayer</Text>
      </Pressable>
    </View>
  );
}

function ProjectCard({
  project,
}: {
  project: {
    _id: string;
    title: string;
    description: string;
    status: string;
    contributorCount: number;
    coverImage?: string | null;
    _creationTime: number;
  };
}) {
  return (
    <View style={styles.projectCard}>
      <View style={styles.projectCover}>
        {project.coverImage ? (
          <Image
            source={{ uri: project.coverImage }}
            accessibilityLabel={`Illustration de ${project.title}`}
            resizeMode="cover"
            style={styles.projectImage}
          />
        ) : (
          <FolderOpen size={23} color="#8B5CF6" />
        )}
      </View>

      <View style={styles.projectContent}>
        <View style={styles.projectTitleRow}>
          <Text numberOfLines={1} style={styles.projectTitle}>
            {project.title}
          </Text>

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {formatProjectStatus(project.status)}
            </Text>
          </View>
        </View>

        <Text numberOfLines={2} style={styles.projectDescription}>
          {project.description}
        </Text>

        <View style={styles.projectMeta}>
          <Text style={styles.projectMetaText}>
            {project.contributorCount}{" "}
            {project.contributorCount > 1 ? "contributeurs" : "contributeur"}
          </Text>

          <Text style={styles.projectMetaText}>
            {formatDate(project._creationTime)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function MesCreationsTab({
  onNavigate,
}: {
  onNavigate?: (page: string) => void;
}) {
  const projects = useQuery(api.media.listMyProjects, {});

  const createProject = useMutation(api.media.createCollaborativeProject);

  const [showCreate, setShowCreate] = useState(false);

  const [newTitle, setNewTitle] = useState("");

  const [newDescription, setNewDescription] = useState("");

  const [saving, setSaving] = useState(false);

  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreate = useCallback(async () => {
    const title = newTitle.trim();
    const description = newDescription.trim();

    if (!title) {
      setCreateError("Le titre du projet est requis.");
      return;
    }

    if (title.length > 120) {
      setCreateError("Le titre ne peut pas dépasser 120 caractères.");
      return;
    }

    if (description.length > 1000) {
      setCreateError("La description ne peut pas dépasser 1000 caractères.");
      return;
    }

    setSaving(true);
    setCreateError(null);

    try {
      await createProject({
        title,
        description: description || title,
        category: "création",
        tags: [],
      });

      setNewTitle("");
      setNewDescription("");
      setShowCreate(false);
    } catch (error) {
      setCreateError(
        error instanceof Error
          ? error.message
          : "La création du projet a échoué.",
      );
    } finally {
      setSaving(false);
    }
  }, [createProject, newDescription, newTitle]);

  return (
    <View>
      <View style={styles.creationActions}>
        <Pressable
          onPress={() => onNavigate?.("editeur")}
          style={({ pressed }) => [
            styles.creationAction,
            pressed && styles.pressed,
          ]}
        >
          <Plus size={16} color="#A78BFA" />

          <Text style={styles.creationActionText}>Éditeur</Text>
        </Pressable>

        <Pressable
          onPress={() => onNavigate?.("studio")}
          style={({ pressed }) => [
            styles.creationAction,
            pressed && styles.pressed,
          ]}
        >
          <Sparkles size={16} color="#F472B6" />

          <Text style={styles.creationActionText}>Studio</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setCreateError(null);
            setShowCreate(true);
          }}
          style={({ pressed }) => [
            styles.creationAction,
            pressed && styles.pressed,
          ]}
        >
          <FolderOpen size={16} color="#FBBF24" />

          <Text style={styles.creationActionText}>Projet</Text>
        </Pressable>
      </View>

      {showCreate ? (
        <View style={styles.createCard}>
          <View style={styles.createHeader}>
            <View>
              <Text style={styles.createTitle}>Nouveau projet</Text>

              <Text style={styles.createSubtitle}>
                Création enregistrée directement dans Convex.
              </Text>
            </View>

            <Pressable
              onPress={() => setShowCreate(false)}
              style={styles.closeButton}
            >
              <X size={18} color="#94A3B8" />
            </Pressable>
          </View>

          <TextInput
            value={newTitle}
            onChangeText={setNewTitle}
            placeholder="Nom du projet"
            placeholderTextColor="#64748B"
            maxLength={120}
            autoCapitalize="sentences"
            style={styles.input}
          />

          <TextInput
            value={newDescription}
            onChangeText={setNewDescription}
            placeholder="Description"
            placeholderTextColor="#64748B"
            maxLength={1000}
            multiline
            textAlignVertical="top"
            style={[styles.input, styles.multilineInput]}
          />

          {createError ? (
            <Text style={styles.formError}>{createError}</Text>
          ) : null}

          <View style={styles.formActions}>
            <Pressable
              disabled={saving}
              onPress={() => setShowCreate(false)}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </Pressable>

            <Pressable
              disabled={saving}
              onPress={() => {
                void handleCreate();
              }}
              style={({ pressed }) => [
                styles.primaryButton,
                styles.formPrimaryButton,
                saving && styles.disabledButton,
                pressed && !saving && styles.pressed,
              ]}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Plus size={16} color="#FFFFFF" />
              )}

              <Text style={styles.primaryButtonText}>
                {saving ? "Création…" : "Créer le projet"}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {projects === undefined ? (
        <LoadingState />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<FolderOpen size={28} color="#8B5CF6" />}
          title="Votre espace créatif est vide"
          description="Créez votre premier projet. Il apparaîtra ici dès que Convex l'aura enregistré."
          actionLabel="Créer mon premier projet"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <View style={styles.projectsList}>
          {projects.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </View>
      )}
    </View>
  );
}

function StatsTab() {
  const projects = useQuery(api.media.listMyProjects, {});

  const stats = useMemo(() => {
    if (!projects) {
      return null;
    }

    const contributors = projects.reduce(
      (total, project) => total + project.contributorCount,
      0,
    );

    const withCover = projects.filter((project) =>
      Boolean(project.coverImage),
    ).length;

    return {
      projects: projects.length,
      contributors,
      withCover,
    };
  }, [projects]);

  if (projects === undefined) {
    return <LoadingState />;
  }

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={<BarChart3 size={28} color="#8B5CF6" />}
        title="Pas encore de données"
        description="Les statistiques personnelles apparaîtront à partir de vos projets réels."
      />
    );
  }

  return (
    <View>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <LayoutTemplate size={19} color="#A78BFA" />

          <Text style={styles.statValue}>{stats?.projects ?? 0}</Text>

          <Text style={styles.statLabel}>Projets</Text>
        </View>

        <View style={styles.statCard}>
          <Package size={19} color="#34D399" />

          <Text style={styles.statValue}>{stats?.contributors ?? 0}</Text>

          <Text style={styles.statLabel}>Contributions</Text>
        </View>

        <View style={styles.statCard}>
          <Eye size={19} color="#60A5FA" />

          <Text style={styles.statValue}>{stats?.withCover ?? 0}</Text>

          <Text style={styles.statLabel}>Projets illustrés</Text>
        </View>
      </View>

      <View style={styles.analyticsNotice}>
        <BarChart3 size={18} color="#A78BFA" />

        <View style={styles.analyticsNoticeContent}>
          <Text style={styles.analyticsNoticeTitle}>
            Transparence des données
          </Text>

          <Text style={styles.analyticsNoticeText}>
            Les métriques d'audience, de vues et d'exports ne sont affichées ici
            que lorsqu'une source backend réelle les fournit. Cette page ne
            fabrique aucun chiffre.
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function TemplatesPage({
  onBack,
  onNavigate,
}: {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("templates");

  const [templateCategory, setTemplateCategory] =
    useState<TemplateCategory>("all");

  const [assetCategory, setAssetCategory] = useState<AssetCategory>("all");

  const [searchQuery, setSearchQuery] = useState("");

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [favoriteAssets, setFavoriteAssets] = useState<Set<string>>(
    () => new Set<string>(),
  );

  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const [selectedTemplate, setSelectedTemplate] =
    useState<CatalogTemplate | null>(null);

  const normalizedSearch = normalizeSearch(searchQuery);

  const filteredTemplates = useMemo(() => {
    return TEMPLATES.filter((template) => {
      const categoryMatch =
        templateCategory === "all" || template.category === templateCategory;

      if (!normalizedSearch) {
        return categoryMatch;
      }

      const searchMatch =
        template.title.toLocaleLowerCase().includes(normalizedSearch) ||
        template.description.toLocaleLowerCase().includes(normalizedSearch) ||
        template.tags.some((tag) =>
          tag.toLocaleLowerCase().includes(normalizedSearch),
        );

      return categoryMatch && searchMatch;
    });
  }, [normalizedSearch, templateCategory]);

  const filteredAssets = useMemo(() => {
    return ASSETS.filter((asset) => {
      const categoryMatch =
        assetCategory === "all" || asset.category === assetCategory;

      if (!normalizedSearch) {
        return categoryMatch;
      }

      const searchMatch =
        asset.title.toLocaleLowerCase().includes(normalizedSearch) ||
        asset.description.toLocaleLowerCase().includes(normalizedSearch) ||
        asset.tags.some((tag) =>
          tag.toLocaleLowerCase().includes(normalizedSearch),
        );

      return categoryMatch && searchMatch;
    });
  }, [assetCategory, normalizedSearch]);

  const toggleAssetFavorite = useCallback((id: string) => {
    setFavoriteAssets((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }, []);

  const copyColor = useCallback(async (hex: string) => {
    try {
      await Clipboard.setString(hex);
      setCopiedColor(hex);

      setTimeout(() => {
        setCopiedColor((current) => (current === hex ? null : current));
      }, 1800);
    } catch {
      setCopiedColor(null);
    }
  }, []);

  const handleOpenTemplate = useCallback((template: CatalogTemplate) => {
    setSelectedTemplate(template);
  }, []);

  const openStudio = useCallback(() => {
    setSelectedTemplate(null);
    onNavigate?.("studio");
  }, [onNavigate]);

  const tabItems: Array<{
    id: Tab;
    label: string;
  }> = [
    {
      id: "templates",
      label: "Templates",
    },
    {
      id: "assets",
      label: "Assets",
    },
    {
      id: "mes-creations",
      label: "Mes créations",
    },
    {
      id: "stats",
      label: "Stats",
    },
  ];

  return (
    <View style={styles.screen}>
      <View style={styles.backgroundGlowOne} />
      <View style={styles.backgroundGlowTwo} />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            onPress={onBack}
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.pressedSmall,
            ]}
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </Pressable>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.eyebrow}>DÉBROUILLEPRO CREATIVE</Text>

            <Text style={styles.title}>Templates & Assets</Text>

            <Text style={styles.subtitle}>Construisez. Composez. Créez.</Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                viewMode === "grid" ? "Passer en liste" : "Passer en grille"
              }
              onPress={() =>
                setViewMode((current) => (current === "grid" ? "list" : "grid"))
              }
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.pressedSmall,
              ]}
            >
              {viewMode === "grid" ? (
                <List size={18} color="#CBD5E1" />
              ) : (
                <Grid3X3 size={18} color="#CBD5E1" />
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.tabs}>
          {tabItems.map((item) => {
            const active = tab === item.id;

            return (
              <Pressable
                key={item.id}
                onPress={() => setTab(item.id)}
                style={({ pressed }) => [
                  styles.tab,
                  active && styles.tabActive,
                  pressed && styles.pressedSmall,
                ]}
              >
                <Text
                  style={[styles.tabText, active && styles.tabTextActive]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {(tab === "templates" || tab === "assets") && (
          <View style={styles.searchBox}>
            <Search size={17} color="#64748B" />

            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={
                tab === "templates"
                  ? "Rechercher une idée, un format…"
                  : "Rechercher un asset…"
              }
              placeholderTextColor="#64748B"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.searchInput}
            />

            {searchQuery.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Effacer la recherche"
                onPress={() => setSearchQuery("")}
                style={styles.clearSearchButton}
              >
                <X size={15} color="#94A3B8" />
              </Pressable>
            ) : null}
          </View>
        )}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {tab === "templates" ? (
          <View>
            <View style={styles.heroCard}>
              <View style={styles.heroIcon}>
                <Sparkles size={21} color="#C4B5FD" />
              </View>

              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>Votre laboratoire créatif</Text>

                <Text style={styles.heroText}>
                  Une bibliothèque pensée pour transformer rapidement une idée
                  en composition exploitable dans DébrouillePro.
                </Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {TEMPLATE_CATEGORIES.map((category) => {
                const active = templateCategory === category.id;

                return (
                  <Pressable
                    key={category.id}
                    onPress={() => setTemplateCategory(category.id)}
                    style={({ pressed }) => [
                      styles.filterChip,
                      active && styles.filterChipActive,
                      pressed && styles.pressedSmall,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        active && styles.filterTextActive,
                      ]}
                    >
                      {category.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Explorer</Text>

                <Text style={styles.sectionSubtitle}>
                  {filteredTemplates.length} base
                  {filteredTemplates.length !== 1 ? "s" : ""} disponibles dans
                  le catalogue.
                </Text>
              </View>
            </View>

            {filteredTemplates.length === 0 ? (
              <EmptyState
                icon={<Search size={27} color="#8B5CF6" />}
                title="Aucun template trouvé"
                description="Essayez un autre mot-clé ou une autre catégorie."
                actionLabel="Réinitialiser"
                onAction={() => {
                  setSearchQuery("");
                  setTemplateCategory("all");
                }}
              />
            ) : viewMode === "grid" ? (
              <View style={styles.templateGrid}>
                {filteredTemplates.map((template) => (
                  <View key={template.id} style={styles.gridItem}>
                    <TemplateCard
                      template={template}
                      onOpen={handleOpenTemplate}
                    />
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.listContainer}>
                {filteredTemplates.map((template) => (
                  <Pressable
                    key={template.id}
                    onPress={() => handleOpenTemplate(template)}
                    style={({ pressed }) => [
                      styles.templateListCard,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.listPreview}>
                      <CatalogPreview colors={template.colors} compact />
                    </View>

                    <View style={styles.listContent}>
                      <Text numberOfLines={2} style={styles.listTitle}>
                        {template.title}
                      </Text>

                      <Text style={styles.listDimensions}>
                        {template.width} × {template.height} px
                      </Text>

                      <Text numberOfLines={2} style={styles.listDescription}>
                        {template.description}
                      </Text>
                    </View>

                    <ChevronRight size={18} color="#64748B" />
                  </Pressable>
                ))}
              </View>
            )}

            <View style={styles.worldClassCard}>
              <View style={styles.worldClassIcon}>
                <LayoutTemplate size={20} color="#A78BFA" />
              </View>

              <View style={styles.worldClassContent}>
                <Text style={styles.worldClassTitle}>
                  Du template au produit
                </Text>

                <Text style={styles.worldClassText}>
                  Le catalogue est la couche d'inspiration. Le moteur Studio est
                  la couche d'exécution. L'objectif est de relier les deux sans
                  jamais masquer une fonctionnalité non connectée.
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {tab === "assets" ? (
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {ASSET_CATEGORIES.map((category) => {
                const active = assetCategory === category.id;

                return (
                  <Pressable
                    key={category.id}
                    onPress={() => setAssetCategory(category.id)}
                    style={({ pressed }) => [
                      styles.filterChip,
                      active && styles.filterChipActive,
                      pressed && styles.pressedSmall,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        active && styles.filterTextActive,
                      ]}
                    >
                      {category.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Assets créatifs</Text>

                <Text style={styles.sectionSubtitle}>
                  Ressources du catalogue local.
                </Text>
              </View>
            </View>

            {assetCategory !== "palettes" && assetCategory !== "all" ? (
              <View style={styles.assetGrid}>
                {filteredAssets.map((asset) => (
                  <View key={asset.id} style={styles.assetGridItem}>
                    <AssetCard
                      asset={asset}
                      favorite={favoriteAssets.has(asset.id)}
                      onToggleFavorite={toggleAssetFavorite}
                    />
                  </View>
                ))}
              </View>
            ) : null}

            {assetCategory === "all" ? (
              <View style={styles.assetGrid}>
                {filteredAssets.map((asset) => (
                  <View key={asset.id} style={styles.assetGridItem}>
                    <AssetCard
                      asset={asset}
                      favorite={favoriteAssets.has(asset.id)}
                      onToggleFavorite={toggleAssetFavorite}
                    />
                  </View>
                ))}
              </View>
            ) : null}

            {(assetCategory === "all" || assetCategory === "palettes") && (
              <View style={styles.paletteSection}>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.sectionTitle}>Palettes</Text>

                    <Text style={styles.sectionSubtitle}>
                      Touchez une couleur pour copier son code hexadécimal.
                    </Text>
                  </View>

                  <Palette size={18} color="#A78BFA" />
                </View>

                {PALETTES.map((palette) => (
                  <View key={palette.id} style={styles.paletteCard}>
                    <View style={styles.paletteHeader}>
                      <View>
                        <Text style={styles.paletteName}>{palette.name}</Text>

                        <Text style={styles.paletteDescription}>
                          {palette.description}
                        </Text>
                      </View>

                      <Palette size={17} color="#64748B" />
                    </View>

                    <View style={styles.paletteColors}>
                      {palette.colors.map((hex) => {
                        const copied = copiedColor === hex;

                        return (
                          <Pressable
                            key={hex}
                            accessibilityRole="button"
                            accessibilityLabel={`Copier ${hex}`}
                            onPress={() => {
                              void copyColor(hex);
                            }}
                            style={({ pressed }) => [
                              styles.paletteColor,
                              {
                                backgroundColor: hex,
                              },
                              pressed && styles.paletteColorPressed,
                            ]}
                          >
                            {copied ? (
                              <View style={styles.copiedOverlay}>
                                <Check size={15} color="#FFFFFF" />
                              </View>
                            ) : null}
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {filteredAssets.length === 0 && assetCategory !== "palettes" ? (
              <EmptyState
                icon={<Package size={27} color="#8B5CF6" />}
                title="Aucun asset trouvé"
                description="Essayez un autre mot-clé ou une autre catégorie."
                actionLabel="Réinitialiser"
                onAction={() => {
                  setSearchQuery("");
                  setAssetCategory("all");
                }}
              />
            ) : null}
          </View>
        ) : null}

        {tab === "mes-creations" ? (
          <Authenticated>
            <MesCreationsTab onNavigate={onNavigate} />
          </Authenticated>
        ) : null}

        {tab === "stats" ? <StatsTab /> : null}

        <View style={styles.bottomSpace} />
      </ScrollView>

      <TemplateDetailModal
        template={selectedTemplate}
        visible={selectedTemplate !== null}
        onClose={() => setSelectedTemplate(null)}
        onOpenStudio={openStudio}
      />
    </View>
  );
}

/**
 * ============================================================================
 * STYLES
 * ============================================================================
 */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#050812",
  },

  backgroundGlowOne: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -130,
    right: -80,
    backgroundColor: "rgba(99,102,241,0.08)",
  },

  backgroundGlowTwo: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    top: 320,
    left: -150,
    backgroundColor: "rgba(139,92,246,0.05)",
  },

  header: {
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "rgba(5,8,18,0.97)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  headerTitleContainer: {
    flex: 1,
  },

  eyebrow: {
    color: "#8B5CF6",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 2,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.5,
  },

  subtitle: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 2,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  tabs: {
    flexDirection: "row",
    gap: 4,
    marginTop: 18,
    padding: 4,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  tab: {
    flex: 1,
    minHeight: 38,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  tabActive: {
    backgroundColor: "rgba(124,58,237,0.32)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.18)",
  },

  tabText: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "700",
  },

  tabTextActive: {
    color: "#FFFFFF",
  },

  searchBox: {
    marginTop: 12,
    minHeight: 45,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 9,
  },

  searchInput: {
    flex: 1,
    minHeight: 43,
    color: "#FFFFFF",
    fontSize: 13,
  },

  clearSearchButton: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  content: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  heroCard: {
    flexDirection: "row",
    gap: 12,
    padding: 15,
    borderRadius: 19,
    backgroundColor: "rgba(124,58,237,0.09)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.18)",
    marginBottom: 15,
  },

  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.16)",
  },

  heroContent: {
    flex: 1,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  heroText: {
    color: "#94A3B8",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  filterRow: {
    gap: 8,
    paddingBottom: 15,
  },

  filterChip: {
    paddingHorizontal: 13,
    minHeight: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  filterChipActive: {
    backgroundColor: "#6D4AFF",
    borderColor: "#8B5CF6",
  },

  filterText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "700",
  },

  filterTextActive: {
    color: "#FFFFFF",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  sectionSubtitle: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 3,
  },

  templateGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -5,
  },

  gridItem: {
    width: "50%",
    paddingHorizontal: 5,
    marginBottom: 10,
  },

  templateCard: {
    overflow: "hidden",
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  templatePreviewWrapper: {
    position: "relative",
  },

  catalogPreview: {
    height: 155,
    overflow: "hidden",
    position: "relative",
  },

  catalogPreviewCompact: {
    height: 96,
  },

  previewOrb: {
    position: "absolute",
    width: 135,
    height: 135,
    borderRadius: 70,
    right: -42,
    top: -40,
    opacity: 0.72,
  },

  previewContent: {
    position: "absolute",
    left: 15,
    bottom: 24,
  },

  previewLineLarge: {
    width: 82,
    height: 8,
    borderRadius: 4,
  },

  previewLineSmall: {
    width: 54,
    height: 5,
    borderRadius: 3,
    marginTop: 7,
  },

  previewFooter: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 10,
    flexDirection: "row",
    gap: 5,
  },

  previewColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },

  badgesRow: {
    position: "absolute",
    top: 9,
    left: 9,
    flexDirection: "row",
    gap: 5,
  },

  newBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#10B981",
  },

  newBadgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.4,
  },

  proBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#FBBF24",
  },

  proBadgeText: {
    color: "#111827",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.4,
  },

  cardBody: {
    padding: 11,
  },

  cardTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
  },

  cardDescription: {
    color: "#64748B",
    fontSize: 9.5,
    lineHeight: 14,
    marginTop: 4,
    minHeight: 28,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 9,
  },

  dimensionBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  dimensionText: {
    color: "#94A3B8",
    fontSize: 8.5,
    fontWeight: "700",
  },

  listContainer: {
    gap: 9,
  },

  templateListCard: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  listPreview: {
    width: 72,
    height: 72,
    borderRadius: 11,
    overflow: "hidden",
  },

  listContent: {
    flex: 1,
  },

  listTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  listDimensions: {
    color: "#8B5CF6",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 4,
  },

  listDescription: {
    color: "#64748B",
    fontSize: 9.5,
    lineHeight: 14,
    marginTop: 4,
  },

  worldClassCard: {
    flexDirection: "row",
    gap: 12,
    padding: 15,
    marginTop: 18,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.15)",
  },

  worldClassIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.11)",
  },

  worldClassContent: {
    flex: 1,
  },

  worldClassTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  worldClassText: {
    color: "#64748B",
    fontSize: 10.5,
    lineHeight: 16,
    marginTop: 4,
  },

  assetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -5,
  },

  assetGridItem: {
    width: "50%",
    paddingHorizontal: 5,
    marginBottom: 10,
  },

  assetCard: {
    overflow: "hidden",
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  assetPreview: {
    height: 100,
    position: "relative",
  },

  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.38)",
  },

  assetBody: {
    padding: 10,
  },

  assetTitle: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  assetDescription: {
    color: "#64748B",
    fontSize: 9.5,
    lineHeight: 14,
    marginTop: 4,
  },

  paletteSection: {
    marginTop: 12,
  },

  paletteCard: {
    padding: 13,
    borderRadius: 16,
    marginBottom: 9,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  paletteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 11,
  },

  paletteName: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  paletteDescription: {
    color: "#64748B",
    fontSize: 9.5,
    marginTop: 3,
  },

  paletteColors: {
    flexDirection: "row",
    gap: 5,
  },

  paletteColor: {
    flex: 1,
    height: 42,
    minWidth: 34,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  paletteColorPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },

  copiedOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  creationActions: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },

  creationAction: {
    flex: 1,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  creationActionText: {
    color: "#CBD5E1",
    fontSize: 10,
    fontWeight: "800",
  },

  createCard: {
    padding: 14,
    marginBottom: 14,
    borderRadius: 18,
    backgroundColor: "rgba(124,58,237,0.075)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.18)",
  },

  createHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  createTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  createSubtitle: {
    color: "#64748B",
    fontSize: 9.5,
    marginTop: 3,
  },

  input: {
    minHeight: 45,
    color: "#FFFFFF",
    fontSize: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    marginBottom: 8,
  },

  multilineInput: {
    minHeight: 90,
    paddingTop: 12,
  },

  formError: {
    color: "#FB7185",
    fontSize: 10,
    lineHeight: 15,
    marginBottom: 9,
  },

  formActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },

  cancelButton: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  cancelButtonText: {
    color: "#CBD5E1",
    fontSize: 11,
    fontWeight: "800",
  },

  formPrimaryButton: {
    flex: 1,
    marginTop: 0,
    marginBottom: 0,
  },

  primaryButton: {
    minHeight: 47,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 13,
    backgroundColor: "#5B3DF5",
    marginTop: 14,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  secondaryButton: {
    minHeight: 40,
    paddingHorizontal: 15,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "rgba(124,58,237,0.16)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.25)",
    marginTop: 12,
  },

  secondaryButtonText: {
    color: "#C4B5FD",
    fontSize: 11,
    fontWeight: "800",
  },

  disabledButton: {
    opacity: 0.55,
  },

  projectsList: {
    gap: 9,
  },

  projectCard: {
    flexDirection: "row",
    gap: 11,
    padding: 10,
    minHeight: 82,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  projectCover: {
    width: 62,
    height: 62,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(124,58,237,0.13)",
  },

  projectImage: {
    width: "100%",
    height: "100%",
  },

  projectContent: {
    flex: 1,
  },

  projectTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  projectTitle: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: "rgba(139,92,246,0.13)",
  },

  statusText: {
    color: "#A78BFA",
    fontSize: 7.5,
    fontWeight: "800",
  },

  projectDescription: {
    color: "#64748B",
    fontSize: 9.5,
    lineHeight: 14,
    marginTop: 4,
  },

  projectMeta: {
    flexDirection: "row",
    gap: 12,
    marginTop: 5,
  },

  projectMetaText: {
    color: "#475569",
    fontSize: 8.5,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },

  statCard: {
    width: "33.333%",
    padding: 11,
    marginBottom: 8,
    marginHorizontal: 4,
    flexGrow: 1,
    flexBasis: 90,
    minHeight: 108,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  statValue: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "900",
    marginTop: 12,
  },

  statLabel: {
    color: "#64748B",
    fontSize: 9,
    marginTop: 2,
  },

  analyticsNotice: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: "rgba(124,58,237,0.07)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.16)",
  },

  analyticsNoticeContent: {
    flex: 1,
  },

  analyticsNoticeTitle: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  analyticsNoticeText: {
    color: "#64748B",
    fontSize: 9.5,
    lineHeight: 15,
    marginTop: 4,
  },

  loadingState: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  loadingText: {
    color: "#64748B",
    fontSize: 11,
  },

  emptyState: {
    minHeight: 250,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(124,58,237,0.10)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.15)",
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 14,
    textAlign: "center",
  },

  emptyDescription: {
    color: "#64748B",
    fontSize: 10.5,
    lineHeight: 16,
    marginTop: 6,
    textAlign: "center",
  },

  errorState: {
    minHeight: 250,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },

  errorIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(244,63,94,0.09)",
    borderWidth: 1,
    borderColor: "rgba(244,63,94,0.18)",
  },

  errorTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 13,
  },

  errorText: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 15,
    textAlign: "center",
    marginTop: 6,
  },

  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.72)",
  },

  modalCard: {
    maxHeight: "92%",
    paddingTop: 9,
    paddingBottom: 25,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#0C1022",
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
  },

  modalHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    backgroundColor: "#334155",
    marginBottom: 13,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 17,
    marginBottom: 10,
  },

  modalEyebrow: {
    color: "#8B5CF6",
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  modalContent: {
    paddingHorizontal: 17,
  },

  modalTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 14,
  },

  modalTitleContainer: {
    flex: 1,
  },

  modalTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
  },

  modalSubtitle: {
    color: "#8B5CF6",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
  },

  modalDescription: {
    color: "#94A3B8",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 9,
  },

  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },

  tag: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(124,58,237,0.13)",
  },

  tagText: {
    color: "#A78BFA",
    fontSize: 9,
    fontWeight: "700",
  },

  truthCard: {
    flexDirection: "row",
    gap: 9,
    padding: 11,
    marginTop: 14,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  truthContent: {
    flex: 1,
  },

  truthTitle: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontWeight: "800",
  },

  truthText: {
    color: "#64748B",
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },

  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },

  pressedSmall: {
    opacity: 0.78,
    transform: [{ scale: 0.96 }],
  },

  bottomSpace: {
    height: 45,
  },
});
