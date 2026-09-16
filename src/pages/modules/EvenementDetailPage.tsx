import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft, MoreVertical, RefreshCw } from "lucide-react-native";

import {
  EventActions,
  EventAttendees,
  EventComments,
  EventCountdown,
  EventDescription,
  EventGallery,
  EventHeader,
  EventMap,
  EventOrganizer,
  EventShare,
  EventStats,
  EventTickets,
  EventTimeline,
  RSVPButtons,
} from "@/features/events/components";

import {
  useEventComments,
  useEventRSVP,
  useRelatedEvents,
  useTickets,
} from "@/features/events/hooks";

import { adaptEvent } from "@/features/events/adapter";
import type { Event } from "@/features/events/types";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type RSVPStatus = "attending" | "interested" | "not_going";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function isValidEventId(value: string | string[] | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/* -------------------------------------------------------------------------- */
/* Native Skeleton                                                            */
/* -------------------------------------------------------------------------- */

function EventDetailSkeleton() {
  return (
    <View style={styles.screen}>
      <View style={styles.loadingHeader}>
        <View style={styles.skeletonIcon} />

        <View style={styles.skeletonHeaderTitle} />

        <View style={styles.skeletonIcon} />
      </View>

      <ScrollView
        contentContainerStyle={styles.loadingContent}
        showsVerticalScrollIndicator={false}
        accessibilityRole="progressbar"
        accessibilityLabel="Chargement de l'événement"
      >
        <View style={styles.skeletonHero} />

        <View style={styles.skeletonTitle} />

        <View style={styles.skeletonSubtitle} />

        <View style={styles.skeletonLargeCard} />

        <View style={styles.skeletonCard} />
      </ScrollView>

      <View pointerEvents="none" style={styles.loadingIndicator}>
        <ActivityIndicator size="small" color="#FFFFFF" />
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Error / not found                                                          */
/* -------------------------------------------------------------------------- */

function EventNotFound({
  onBack,
  onRetry,
}: {
  onBack: () => void;
  onRetry: () => void;
}) {
  return (
    <View style={styles.screen}>
      <View style={styles.errorContainer}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.pressed,
          ]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </Pressable>

        <View style={styles.errorIcon}>
          <RefreshCw size={25} color="rgba(255,255,255,0.45)" />
        </View>

        <Text style={styles.errorTitle}>Événement indisponible</Text>

        <Text style={styles.errorDescription}>
          Cet événement n'est plus disponible ou n'a pas pu être chargé.
        </Text>

        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [
            styles.retryButton,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Réessayer"
        >
          <RefreshCw size={16} color="#FFFFFF" />

          <Text style={styles.retryText}>Réessayer</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Main                                                                       */
/* -------------------------------------------------------------------------- */

export default function EvenementDetailPage() {
  const params = useLocalSearchParams<{
    id?: string | string[];
  }>();

  const router = useRouter();

  const eventId = isValidEventId(params.id)
    ? (params.id as Id<"events">)
    : undefined;

  const [event, setEvent] = useState<Event | null>(null);

  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const [isLikePending, setIsLikePending] = useState(false);
  const [isBookmarkPending, setIsBookmarkPending] = useState(false);
  const [isRsvpPending, setIsRsvpPending] = useState(false);
  const [isTicketPending, setIsTicketPending] = useState(false);

  const [retryKey, setRetryKey] = useState(0);

  /*
   * trackView ne doit être exécuté qu'une seule fois
   * par ouverture réelle de l'événement.
   */
  const trackedEventRef = useRef<string | null>(null);

  /* ------------------------------------------------------------------------ */
  /* Convex                                                                   */
  /* ------------------------------------------------------------------------ */

  const eventData = useQuery(
    api.events.get,
    eventId
      ? {
          eventId,
        }
      : "skip",
  );

  const trackView = useMutation(api.events.trackView);
  const likeEvent = useMutation(api.events.like);
  const bookmarkEvent = useMutation(api.events.bookmark);
  const rsvpMutation = useMutation(api.events.rsvp);

  const { comments, addComment, addReply, likeComment } =
    useEventComments(eventId);

  const { tickets, purchase } = useTickets(eventId);

  const { rsvp: currentRsvp } = useEventRSVP();

  useRelatedEvents(eventId ? String(eventId) : "");

  /* ------------------------------------------------------------------------ */
  /* Synchronisation avec Convex                                              */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!eventData) {
      setEvent(null);
      return;
    }

    const adapted = adaptEvent(eventData);

    setEvent(adapted);

    /*
     * Le backend reste la source de vérité.
     * L'état local sert uniquement à rendre les interactions
     * immédiatement réactives entre deux réponses Convex.
     */
  }, [eventData, retryKey]);

  /* ------------------------------------------------------------------------ */
  /* View tracking                                                            */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!eventData?._id) {
      return;
    }

    const key = String(eventData._id);

    if (trackedEventRef.current === key) {
      return;
    }

    trackedEventRef.current = key;

    void trackView({
      eventId: eventData._id,
    }).catch(() => {
      /*
       * Le tracking est secondaire.
       * Une erreur analytique ne doit jamais empêcher
       * l'affichage de l'événement.
       */
    });
  }, [eventData?._id, trackView]);

  /* ------------------------------------------------------------------------ */
  /* Navigation                                                               */
  /* ------------------------------------------------------------------------ */

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/");
  }, [router]);

  /* ------------------------------------------------------------------------ */
  /* Like                                                                     */
  /* ------------------------------------------------------------------------ */

  const handleLike = useCallback(async () => {
    if (!event || isLikePending) {
      return;
    }

    setIsLikePending(true);

    try {
      const result = await likeEvent({
        eventId: event._id,
      });

      setEvent((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          likedByMe: result.liked,
        };
      });
    } catch {
      Alert.alert(
        "Action impossible",
        "Le changement de réaction n'a pas pu être enregistré. Vérifiez votre connexion puis réessayez.",
      );
    } finally {
      setIsLikePending(false);
    }
  }, [event, isLikePending, likeEvent]);

  /* ------------------------------------------------------------------------ */
  /* Bookmark                                                                 */
  /* ------------------------------------------------------------------------ */

  const handleBookmark = useCallback(async () => {
    if (!event || isBookmarkPending) {
      return;
    }

    setIsBookmarkPending(true);

    try {
      const result = await bookmarkEvent({
        eventId: event._id,
      });

      setEvent((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          bookmarkedByMe: result.bookmarked,
        };
      });
    } catch {
      Alert.alert(
        "Action impossible",
        "L'enregistrement de votre favori a échoué. Réessayez dans quelques instants.",
      );
    } finally {
      setIsBookmarkPending(false);
    }
  }, [event, isBookmarkPending, bookmarkEvent]);

  /* ------------------------------------------------------------------------ */
  /* RSVP                                                                     */
  /* ------------------------------------------------------------------------ */

  const handleRSVP = useCallback(
    async (status: RSVPStatus) => {
      if (!event || isRsvpPending) {
        return;
      }

      setIsRsvpPending(true);

      try {
        const result = await rsvpMutation({
          eventId: event._id,
          status,
        });

        /*
         * Le backend peut retourner null lorsqu'un utilisateur
         * reclique sur son statut actuel pour le retirer.
         */
        const resultingStatus = result.status ?? null;

        setEvent((previous) => {
          if (!previous) {
            return previous;
          }

          return {
            ...previous,
            myRsvp: resultingStatus,
            isAttending: resultingStatus === "attending",
            isInterested: resultingStatus === "interested",
          };
        });
      } catch {
        Alert.alert(
          "Inscription impossible",
          "Votre inscription n'a pas pu être mise à jour. Veuillez réessayer.",
        );
      } finally {
        setIsRsvpPending(false);
      }
    },
    [event, isRsvpPending, rsvpMutation],
  );

  /* ------------------------------------------------------------------------ */
  /* Ticket                                                                   */
  /* ------------------------------------------------------------------------ */

  const handlePurchase = useCallback(async () => {
    if (!event || isTicketPending) {
      return;
    }

    setIsTicketPending(true);

    try {
      const ticket = await purchase();

      /*
       * Le hook de billetterie reste responsable de la
       * création réelle du billet.
       *
       * Aucun faux QR code, aucune fausse confirmation
       * et aucune donnée financière ne sont générés ici.
       */
      if (ticket) {
        Alert.alert(
          "Billet créé",
          "Votre billet a été enregistré avec succès.",
        );
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "La création du billet a échoué.";

      Alert.alert("Billetterie", message);
    } finally {
      setIsTicketPending(false);
    }
  }, [event, isTicketPending, purchase]);

  /* ------------------------------------------------------------------------ */
  /* Comments                                                                 */
  /* ------------------------------------------------------------------------ */

  const handleToggleComments = useCallback(() => {
    setShowComments((previous) => !previous);
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Retry                                                                    */
  /* ------------------------------------------------------------------------ */

  const handleRetry = useCallback(() => {
    trackedEventRef.current = null;
    setRetryKey((previous) => previous + 1);
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Invalid route                                                            */
  /* ------------------------------------------------------------------------ */

  if (!eventId) {
    return <EventNotFound onBack={handleBack} onRetry={handleBack} />;
  }

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                  */
  /* ------------------------------------------------------------------------ */

  if (eventData === undefined) {
    return <EventDetailSkeleton />;
  }

  /* ------------------------------------------------------------------------ */
  /* Not found                                                                */
  /* ------------------------------------------------------------------------ */

  if (!event) {
    return <EventNotFound onBack={handleBack} onRetry={handleRetry} />;
  }

  /* ------------------------------------------------------------------------ */
  /* Derived state                                                            */
  /* ------------------------------------------------------------------------ */

  const resolvedRsvp = event.myRsvp ?? currentRsvp ?? null;

  const isAttending = resolvedRsvp === "attending";
  const isInterested = resolvedRsvp === "interested";

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <View style={styles.screen}>
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                              */}
      {/* ------------------------------------------------------------------ */}

      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.pressed,
          ]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Événement
          </Text>

          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {event.category}
          </Text>
        </View>

        {event.isMine ? (
          <Pressable
            onPress={() => {
              Alert.alert(
                "Gestion de l'événement",
                "Les actions de gestion doivent être exécutées depuis l'espace organisateur.",
              );
            }}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Options de l'événement"
          >
            <MoreVertical size={20} color="rgba(255,255,255,0.65)" />
          </Pressable>
        ) : (
          <View style={styles.iconButtonPlaceholder} />
        )}
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* Main content                                                        */}
      {/* ------------------------------------------------------------------ */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <EventHeader
          event={event}
          onLike={handleLike}
          onShare={() => setShowShare(true)}
        />

        {/* Media */}
        <EventGallery
          images={event.gallery ?? []}
          title={event.title}
          coverImage={event.coverImage}
        />

        {/* Countdown */}
        <EventCountdown startDate={event.startDate} />

        {/* RSVP */}
        <View style={isRsvpPending ? styles.disabledSection : undefined}>
          <RSVPButtons
            currentStatus={
              isAttending
                ? "attending"
                : isInterested
                  ? "interested"
                  : resolvedRsvp === "not_going"
                    ? "not_going"
                    : null
            }
            onRSVP={handleRSVP}
          />
        </View>

        {/* Stats */}
        <EventStats event={event} />

        {/* Description */}
        <EventDescription event={event} />

        {/* Timeline */}
        <EventTimeline event={event} />

        {/* Organizer */}
        <EventOrganizer event={event} />

        {/* Location */}
        <EventMap event={event} />

        {/* Attendees */}
        <EventAttendees event={event} />

        {/* Tickets */}
        <View style={isTicketPending ? styles.disabledSection : undefined}>
          <EventTickets event={event} onPurchase={handlePurchase} />
        </View>

        {/* Actions */}
        <EventActions
          onLike={handleLike}
          onComment={handleToggleComments}
          onShare={() => setShowShare(true)}
          onBookmark={handleBookmark}
          isLiked={event.likedByMe}
          isBookmarked={event.bookmarkedByMe}
          /*
           * IMPORTANT :
           * Le backend actuel expose likedByMe mais ne retourne
           * pas de compteur global de likes dans api.events.get.
           *
           * On ne fabrique donc pas de compteur.
           */
          likeCount={0}
          commentCount={event.commentCount}
          shareCount={event.shareCount ?? 0}
        />

        {/* Comments */}
        {showComments ? (
          <View style={styles.commentsContainer}>
            <EventComments
              comments={comments}
              onAddComment={addComment}
              onReply={addReply}
              onLikeComment={likeComment}
              onAuthorClick={(authorId) => router.push(`/profile/${authorId}`)}
            />
          </View>
        ) : null}

        {/* Footer integrity note */}
        <View style={styles.integrityNotice}>
          <View style={styles.integrityDot} />

          <Text style={styles.integrityText}>
            Les informations affichées proviennent des données enregistrées pour
            cet événement.
          </Text>
        </View>
      </ScrollView>

      {/* ------------------------------------------------------------------ */}
      {/* Share                                                               */}
      {/* ------------------------------------------------------------------ */}

      {showShare ? (
        <EventShare event={event} onClose={() => setShowShare(false)} />
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* Global action indicator                                             */}
      {/* ------------------------------------------------------------------ */}

      {isLikePending ||
      isBookmarkPending ||
      isRsvpPending ||
      isTicketPending ? (
        <View pointerEvents="none" style={styles.actionIndicator}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      ) : null}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#050812",
  },

  header: {
    minHeight: 88,
    paddingHorizontal: 16,
    paddingTop: 42,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#050812",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.1,
  },

  headerSubtitle: {
    color: "rgba(255,255,255,0.34)",
    fontSize: 9,
    fontWeight: "600",
    marginTop: 2,
    textTransform: "capitalize",
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  iconButtonPlaceholder: {
    width: 40,
    height: 40,
  },

  pressed: {
    opacity: 0.7,
    transform: [
      {
        scale: 0.96,
      },
    ],
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 42,
    gap: 20,
  },

  /* ---------------------------------------------------------------------- */
  /* Native loading                                                         */
  /* ---------------------------------------------------------------------- */

  loadingHeader: {
    minHeight: 88,
    paddingHorizontal: 16,
    paddingTop: 42,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  loadingContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
    gap: 16,
  },

  skeletonBlock: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.035)",
  },

  skeletonIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.035)",
  },

  skeletonHeaderTitle: {
    width: 128,
    height: 20,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.035)",
  },

  skeletonHero: {
    width: "100%",
    height: 256,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.035)",
  },

  skeletonTitle: {
    width: "82%",
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.035)",
  },

  skeletonSubtitle: {
    width: "58%",
    height: 20,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.035)",
  },

  skeletonLargeCard: {
    width: "100%",
    height: 132,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.035)",
  },

  skeletonCard: {
    width: "100%",
    height: 96,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.035)",
  },

  loadingIndicator: {
    position: "absolute",
    right: 18,
    bottom: 24,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,18,32,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  /* ---------------------------------------------------------------------- */
  /* Error                                                                  */
  /* ---------------------------------------------------------------------- */

  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  errorIcon: {
    width: 68,
    height: 68,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginTop: 22,
    marginBottom: 18,
  },

  errorTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },

  errorDescription: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 310,
  },

  retryButton: {
    marginTop: 22,
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(79,70,229,0.9)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.25)",
  },

  retryText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  /* ---------------------------------------------------------------------- */
  /* States                                                                 */
  /* ---------------------------------------------------------------------- */

  disabledSection: {
    opacity: 0.62,
  },

  commentsContainer: {
    marginTop: 2,
  },

  /* ---------------------------------------------------------------------- */
  /* Integrity                                                               */
  /* ---------------------------------------------------------------------- */

  integrityNotice: {
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  integrityDot: {
    width: 6,
    height: 6,
    marginTop: 4,
    borderRadius: 3,
    backgroundColor: "#4ADE80",
  },

  integrityText: {
    flex: 1,
    color: "rgba(255,255,255,0.28)",
    fontSize: 9,
    lineHeight: 14,
  },

  /* ---------------------------------------------------------------------- */
  /* Action indicator                                                        */
  /* ---------------------------------------------------------------------- */

  actionIndicator: {
    position: "absolute",
    right: 18,
    bottom: 24,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,18,32,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
});
