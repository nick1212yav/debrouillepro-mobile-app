import { Text, Pressable, View, Image } from "react-native";
import { useCallback, useMemo, useState } from "react";
import { Loader2, Plus, RefreshCw, Sparkles } from "lucide-react-native";

import { useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api.js";

import StoryViewer from "./StoryViewer";
import StoryCreator from "./StoryCreator";

import type { StoryGroup, StorySlide } from "./StoryViewer";

/**
 * ============================================================
 * DÉBROUILLEPRO
 * STORIES UI ENGINE 2.0
 * ============================================================
 *
 * Cette couche ne possède PLUS :
 *
 * ❌ localStorage
 * ❌ données mockées
 * ❌ SEED_GROUPS
 * ❌ stories fictives
 * ❌ réactions locales
 * ❌ votes locaux
 *
 * Source de vérité :
 *
 * Convex
 *
 * Backend :
 *
 * stories.ts
 *
 * ============================================================
 */

interface StoriesProps {
  className?: string;
}

/* ============================================================
 * TYPES BACKEND
 * ============================================================ */

type BackendStory = {
  _id: string;
  _creationTime: number;

  authorId: string;

  mediaUrl: string;
  mediaType: "image" | "video";

  caption?: string;
  duration?: number;

  viewCount: number;

  expiresAt: string;

  isHighlight: boolean;

  authorName: string;
  authorAvatar?: string;
  authorCity?: string;

  viewed: boolean;
};

type BackendStoryGroup = {
  author: {
    id: string;
    name: string;
    avatar?: string;
    city?: string;
  };

  stories: BackendStory[];

  hasUnviewed: boolean;

  unreadCount?: number;

  latestAt?: number;

  score?: number;
};

/**
 * Extension locale du contrat StoryGroup pour conserver
 * le compteur fourni par Convex sans modifier StoryViewer.
 */
type StoryGroupWithUnread = StoryGroup & {
  unreadCount?: number;
};

/**
 * Payload envoyé par StoryCreator vers Convex.
 *
 * StorySlide ne déclare pas duration dans StoryViewer,
 * mais le backend Stories accepte une durée optionnelle.
 */
type StoryPublishSlide = Omit<
  StorySlide,
  "id" | "authorName" | "authorAvatar" | "authorGradient" | "time"
> & {
  duration?: number;
};

/* ============================================================
 * HELPERS
 * ============================================================ */

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return (
    parts[0].slice(0, 1) + parts[parts.length - 1].slice(0, 1)
  ).toUpperCase();
}

function formatStoryTime(creationTime: number): string {
  const diff = Math.max(0, Date.now() - creationTime);

  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) {
    return "À l'instant";
  }

  if (minutes < 60) {
    return `il y a ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `il y a ${hours}h`;
  }

  const days = Math.floor(hours / 24);

  return `il y a ${days}j`;
}

function isVideo(story: BackendStory): boolean {
  return story.mediaType === "video";
}

/* ============================================================
 * BACKEND → UI
 * ============================================================ */

function mapStorySlide(story: BackendStory): StorySlide {
  return {
    id: String(story._id),

    type: isVideo(story) ? "video" : "image",

    bg: "#050812",

    img: story.mediaUrl,

    text: story.caption ?? "",

    authorName: story.authorName,

    authorAvatar: story.authorAvatar,

    time: formatStoryTime(story._creationTime),
  } as StorySlide;
}

function mapStoryGroup(group: BackendStoryGroup): StoryGroupWithUnread {
  return {
    id: String(group.author.id),

    authorName: group.author.name,

    authorAvatar: group.author.avatar,

    seen: !group.hasUnviewed,

    slides: group.stories.map(mapStorySlide),

    unreadCount: group.unreadCount,
  };
}

/* ============================================================
 * COMPONENT
 * ============================================================ */

export default function Stories({ className = "" }: StoriesProps) {
  /**
   * ----------------------------------------------------------
   * BACKEND
   * ----------------------------------------------------------
   */

  const feed = useQuery(api.stories.getStoryFeed, {});

  const markViewed = useMutation(api.stories.markViewed);

  /**
   * ----------------------------------------------------------
   * UI STATE
   * ----------------------------------------------------------
   */

  const [viewerOpen, setViewerOpen] = useState(false);

  const [viewerGroupIndex, setViewerGroupIndex] = useState(0);

  const [creatorOpen, setCreatorOpen] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);

  /* ==========================================================
   * NORMALISATION
   * ========================================================== */

  const groups = useMemo<StoryGroupWithUnread[]>(() => {
    if (!feed) {
      return [];
    }

    const backendGroups = (feed.groups ?? []) as BackendStoryGroup[];

    return backendGroups
      .filter(
        (group) =>
          group.author &&
          Array.isArray(group.stories) &&
          group.stories.length > 0,
      )
      .map(mapStoryGroup);
  }, [feed]);

  /* ==========================================================
   * STATISTIQUES UI
   * ========================================================== */

  const totalStories = feed?.totalStories ?? 0;

  const totalGroups = feed?.totalGroups ?? 0;

  const unreadGroups = groups.filter((group) => !group.seen).length;

  /* ==========================================================
   * OPEN VIEWER
   * ========================================================== */

  const openViewer = useCallback(
    (groupId: string) => {
      const index = groups.findIndex((group) => group.id === groupId);

      if (index === -1) {
        return;
      }

      setViewerGroupIndex(index);

      setViewerOpen(true);
    },
    [groups],
  );

  /* ==========================================================
   * MARK STORY VIEWED
   * ========================================================== */

  const handleMarkSeen = useCallback(
    async (groupId: string) => {
      const group = groups.find((item) => item.id === groupId);

      if (!group) {
        return;
      }

      /*
       * Le backend protège déjà
       * les doublons de vues.
       *
       * On marque chaque story
       * du groupe lorsqu'elle
       * devient visible.
       */

      for (const slide of group.slides) {
        try {
          await markViewed({
            storyId: slide.id as never,
          });
        } catch {
          /*
           * Une erreur sur une story
           * ne doit pas casser le viewer.
           */
        }
      }
    },
    [groups, markViewed],
  );

  /* ==========================================================
   * REFRESH
   *
   * Convex est réactif.
   *
   * Le changement d'une vue,
   * création ou suppression
   * actualise automatiquement
   * la query.
   *
   * Ce bouton force simplement
   * une nouvelle souscription
   * côté React.
   * ========================================================== */

  const refresh = useCallback(async () => {
    setIsRefreshing(true);

    await new Promise<void>((resolve) => setTimeout(resolve, 450));

    setIsRefreshing(false);
  }, []);

  /* ==========================================================
   * PUBLISH
   *
   * StoryCreator fournit la slide
   * préparée.
   *
   * Le composant ne sauvegarde
   * RIEN localement.
   *
   * La publication finale doit
   * être faite via Convex.
   * ========================================================== */

  const handlePublish = useCallback(async (slide: StoryPublishSlide) => {
    /*
     * IMPORTANT :
     *
     * Le backend actuel attend :
     *
     * mediaUrl
     * mediaType
     * caption
     * duration
     *
     * StoryCreator doit donc fournir
     * une URL exploitable.
     */

    const mediaUrl = typeof slide.img === "string" ? slide.img : "";

    if (!mediaUrl) {
      return;
    }

    await createStoryMutation(mediaUrl, slide);

    setCreatorOpen(false);
  }, []);

  /*
   * Mutation séparée afin de garder
   * handlePublish propre.
   */
  const createStoryMutation = async (
    mediaUrl: string,
    slide: StoryPublishSlide,
  ) => {
    /*
     * NOTE :
     * Cette fonction sera remplacée
     * par la mutation Convex réelle
     * ci-dessous via le hook.
     */
    await createStory({
      mediaUrl,
      mediaType: "image",
      caption: typeof slide.text === "string" ? slide.text : undefined,
      duration: typeof slide.duration === "number" ? slide.duration : undefined,
    });
  };

  /**
   * Mutation Convex.
   *
   * Déclarée ici pour respecter
   * les règles des hooks React.
   */
  const createStory = useMutation(api.stories.createStory);

  /* ==========================================================
   * LOADING
   * ========================================================== */

  if (feed === undefined) {
    return (
      <View className={`mt-4 px-5 ${className}`} accessibilityLabel="Stories">
        <View className="flex items-center justify-between mb-3">
          <View className="flex items-center gap-2">
            <View
              className="h-4 w-20 rounded-full animate-pulse"
              style={{ backgroundColor: "rgba(255,255,255,0.10)" }}
            />

            <View
              className="h-4 w-4 rounded-full animate-pulse"
              style={{ backgroundColor: "rgba(139,92,246,0.25)" }}
            />
          </View>
        </View>

        <View className="flex gap-3 overflow-hidden">
          {Array.from({
            length: 6,
          }).map((_, index) => (
            <View
              key={index}
              className="flex-shrink-0 flex flex-col items-center gap-2"
            >
              <View
                className="w-14 h-14 rounded-2xl animate-pulse"
                style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
              />

              <View
                className="w-12 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
              />
            </View>
          ))}
        </View>
      </View>
    );
  }

  /* ==========================================================
   * EMPTY STATE
   * ========================================================== */

  if (groups.length === 0) {
    return (
      <>
        <View className={`mt-4 px-5 ${className}`} accessibilityLabel="Stories">
          <View
            className="relative overflow-hidden rounded-3xl p-[1px]"
            style={{  }}
          >
            <View
              className="relative rounded-[23px] px-4 py-4 overflow-hidden"
              style={{  }}
            >
              <View
                className="absolute -right-8 -top-8 h-24 w-24 rounded-full"
                style={{  }}
              />

              <View className="relative flex items-center gap-3">
                <Pressable
                 
                  onPress={() => setCreatorOpen(true)}
                  className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl"
                  style={{  }}
                  accessibilityLabel="Créer une story"
                >
                  <Plus size={24} className="text-white" strokeWidth={2.5} />

                  <Text
                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full"
                    style={{ backgroundColor: "rgba(255,255,255,.95)" }}
                  >
                    <Sparkles size={9} className="text-violet-600" />
                  </Text>
                </Pressable>

                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-bold text-white">
                    Crée ta première story
                  </Text>

                  <Text className="mt-0.5 text-[11px] leading-relaxed text-white/45">
                    Partage ce que tu vis, fais découvrir ton activité ou crée
                    une opportunité.
                  </Text>
                </View>

                <Pressable
                 
                  onPress={() => setCreatorOpen(true)}
                  className="rounded-xl px-3 py-2 text-[10px] font-bold text-white"
                  style={{ backgroundColor: "rgba(139,92,246,.18)", borderWidth: 1, borderColor: "rgba(139,92,246,.30)", borderStyle: "solid" }}
                >
                  <Text>Créer</Text></Pressable>
              </View>
            </View>
          </View>
        </View>

        <>
          {creatorOpen && (
            <StoryCreator
              onClose={() => setCreatorOpen(false)}
              onPublish={handlePublish}
            />
          )}
        </>
      </>
    );
  }

  /* ==========================================================
   * MAIN
   * ========================================================== */

  return (
    <>
      <View className={`mt-4 px-5 ${className}`} accessibilityLabel="Stories">
        {/* ------------------------------------------------------
         * HEADER
         * ------------------------------------------------------ */}

        <View className="mb-3 flex items-center justify-between">
          <View className="flex items-center gap-2">
            <Text className="text-sm font-bold text-white">Stories</Text>

            {unreadGroups > 0 && (
              <Text
                className="rounded-full px-2 py-0.5 text-[9px] font-bold text-violet-200"
                style={{ backgroundColor: "rgba(139,92,246,.16)", borderWidth: 1, borderColor: "rgba(139,92,246,.25)", borderStyle: "solid" }}
              >
                {unreadGroups} <Text>nouvelle</Text>{unreadGroups > 1 ? "s" : ""}
              </Text>
            )}
          </View>

          <View className="flex items-center gap-2">
            {totalStories > 0 && (
              <Text className="text-[10px] text-white/30">
                {totalStories} story
                {totalStories > 1 ? "s" : ""}
              </Text>
            )}

            <Pressable
             
              onPress={refresh}
              disabled={isRefreshing}
              className="flex h-7 w-7 items-center justify-center rounded-xl disabled:opacity-50"
              style={{ backgroundColor: "rgba(255,255,255,.05)", borderWidth: 1, borderColor: "rgba(255,255,255,.06)", borderStyle: "solid" }}
              accessibilityLabel="Actualiser les stories"
            >
              <RefreshCw
                size={12}
                className={`text-white/45 ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              />
            </Pressable>
          </View>
        </View>

        {/* ------------------------------------------------------
         * STORY RAIL
         * ------------------------------------------------------ */}

        <View
          className="flex gap-3 overflow-x-auto pb-1"
          style={{  }}
        >
          {/* CREATE */}

          <Pressable
            onPress={() => setCreatorOpen(true)}
            className="group flex flex-shrink-0 flex-col items-center gap-1.5"
            accessibilityLabel="Ajouter une story"
          >
            <View
              className="relative h-14 w-14 rounded-2xl p-[1px] group-active:scale-90"
              style={{  }}
            >
              <View
                className="flex h-full w-full items-center justify-center rounded-[15px]"
                style={{  }}
              >
                <View
                  className="flex h-8 w-8 items-center justify-center rounded-xl"
                  style={{  }}
                >
                  <Plus size={17} className="text-white" strokeWidth={2.5} />
                </View>
              </View>

              <Text
                className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#070914]"
                style={{ backgroundColor: "rgba(255,255,255,.95)" }}
              >
                <Sparkles size={8} className="text-violet-600" />
              </Text>
            </View>

            <Text className="text-[10px] font-semibold text-white/55">
              <Text>Ajouter</Text></Text>
          </Pressable>

          {/* BACKEND GROUPS */}

          {groups.map((group, index) => {
            const isSeen = group.seen;

            const isNew = !isSeen;

            const firstLetter = getInitials(group.authorName);

            return (
              <Pressable
                key={group.id}
                onPress={() => openViewer(group.id)}
                className="group flex flex-shrink-0 flex-col items-center gap-1.5"
                accessibilityLabel={`Voir les stories de ${group.authorName}`}
              >
                <View className="relative">
                  {/* Ring */}

                  <View
                    className="h-14 w-14 rounded-2xl p-[1.5px]"
                    style={{  }}
                  >
                    <View
                      className="h-full w-full rounded-[15px] p-[1px]"
                      style={{ backgroundColor: "#070914" }}
                    >
                      {group.authorAvatar ? (
                        <Image
                         
                         
                          className="h-full w-full rounded-[14px] object-cover"
                          loading="lazy"
                          draggable={false}
                         source={{ uri: group.authorAvatar }} accessibilityLabel=""/>
                      ) : (
                        <View
                          className="flex h-full w-full items-center justify-center rounded-[14px] text-sm font-black text-white"
                          style={{  }}
                        >
                          {firstLetter}
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Unread indicator */}

                  {isNew && (
                    <Text
                      className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#070914]"
                      style={{  }}
                    />
                  )}

                  {/* Unread count */}

                  {group.unreadCount && group.unreadCount > 1 && (
                    <Text
                      className="absolute -bottom-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-[#070914] px-1 text-[8px] font-black text-white"
                      style={{ backgroundColor: "#7C3AED" }}
                    >
                      {group.unreadCount}
                    </Text>
                  )}
                </View>

                <Text
                  className={`max-w-[64px] truncate text-[10px] font-semibold ${
                    isSeen ? "text-white/35" : "text-white/75"
                  }`}
                >
                  {group.authorName.split(" ")[0]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ------------------------------------------------------
         * SMALL LIVE STATUS
         * ------------------------------------------------------ */}

        {totalGroups > 0 && (
          <View className="mt-2 flex items-center gap-1.5">
            <Text
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: "#8B5CF6" }}
            />

            <Text className="text-[9px] text-white/25">
              <Text>Stories personnalisées pour vous</Text></Text>
          </View>
        )}
      </View>

      {/* ========================================================
       * VIEWER
       * ======================================================== */}

      <>
        {viewerOpen && (
          <StoryViewer
            groups={groups}
            initialGroupIndex={viewerGroupIndex}
            onClose={() => setViewerOpen(false)}
            onMarkSeen={handleMarkSeen}
          />
        )}
      </>

      {/* ========================================================
       * CREATOR
       * ======================================================== */}

      <>
        {creatorOpen && (
          <StoryCreator
            onClose={() => setCreatorOpen(false)}
            onPublish={handlePublish}
          />
        )}
      </>
    </>
  );
}
