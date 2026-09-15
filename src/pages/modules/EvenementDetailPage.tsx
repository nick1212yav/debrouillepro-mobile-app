// src/pages/modules/EvenementDetailPage.tsx
import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MoreVertical } from "lucide-react-native";

import {
  EventHeader,
  EventGallery,
  EventStats,
  EventDescription,
  EventOrganizer,
  EventMap,
  EventActions,
  EventComments,
  EventTickets,
  EventCountdown,
  EventAttendees,
  EventShare,
  EventTimeline,
  RSVPButtons,
} from "@/features/events/components";
import {
  useEventComments,
  useTickets,
  useEventRSVP,
  useRelatedEvents,
} from "@/features/events/hooks";
import { adaptEvent } from "@/features/events/adapter";
import type { Event } from "@/features/events/types";
import type { Id } from "@/convex/_generated/dataModel";

export default function EvenementDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const eventData = useQuery(
    api.events.get,
    id ? { eventId: id as Id<"events"> } : "skip",
  );
  const trackView = useMutation(api.events.trackView);
  const likeEvent = useMutation(api.events.like);
  const bookmarkEvent = useMutation(api.events.bookmark);
  const rsvpMutation = useMutation(api.events.rsvp);

  const { comments, addComment, addReply, likeComment } = useEventComments(
    id as Id<"events"> | undefined,
  );
  const { tickets: _tickets, purchase } = useTickets(
    id as Id<"events"> | undefined,
  );
  const { rsvp: _rsvp } = useEventRSVP();
  const { events: _relatedEvents } = useRelatedEvents(id || "");

  useEffect(() => {
    if (eventData === undefined) {
      setLoading(true);
      return;
    }
    if (eventData) {
      const adapted = adaptEvent(eventData);
      setEvent(adapted);
      setLoading(false);
      trackView({ eventId: eventData._id }).catch(() => {});
    } else {
      setEvent(null);
      setLoading(false);
    }
  }, [eventData, trackView]);

  const handleLike = async () => {
    if (!event) return;
    try {
      await likeEvent({ eventId: event._id });
      setEvent({ ...event, likedByMe: !event.likedByMe });
    } catch {
      Alert.alert("Erreur", "Erreur lors du like");
    }
  };

  const handleBookmark = async () => {
    if (!event) return;
    try {
      await bookmarkEvent({ eventId: event._id });
      setEvent({ ...event, bookmarkedByMe: !event.bookmarkedByMe });
      Alert.alert("Succès", event.bookmarkedByMe ? "Retiré" : "Ajouté");
    } catch {
      Alert.alert("Erreur", "Erreur");
    }
  };

  const handleRSVP = async (
    status: "attending" | "interested" | "not_going",
  ) => {
    if (!event) return;
    try {
      await rsvpMutation({ eventId: event._id, status });
      const isAttending = status === "attending";
      const isInterested = status === "interested";
      setEvent({ ...event, isAttending, isInterested });
      Alert.alert("Succès", "Inscription mise à jour");
    } catch {
      Alert.alert("Erreur", "Erreur lors de l'inscription");
    }
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <View style={styles.loadingContainer}>
          <Skeleton className="w-10 h-10 rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-8 w-3/4 rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </View>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButtonInline}
          hitSlop={6}
        >
          <ArrowLeft size={24} color="rgba(255,255,255,0.6)" />
        </Pressable>
        <Text style={styles.mutedText}>Événement introuvable</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.iconButton}
          hitSlop={6}
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Événement
        </Text>
        <Pressable
          onPress={() => setShowMenu(!showMenu)}
          style={styles.iconButton}
          hitSlop={6}
          accessibilityLabel="Menu"
        >
          <MoreVertical size={20} color="rgba(255,255,255,0.6)" />
        </Pressable>
      </View>

      {/* Contenu */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <EventHeader
          event={event}
          onLike={handleLike}
          onShare={() => setShowShare(true)}
        />
        <EventGallery
          images={event.gallery || []}
          title={event.title}
          coverImage={event.coverImage}
        />
        <EventCountdown startDate={event.startDate} />
        <RSVPButtons
          currentStatus={
            event.isAttending
              ? "attending"
              : event.isInterested
                ? "interested"
                : null
          }
          onRSVP={handleRSVP}
        />
        <EventStats event={event} />
        <EventDescription event={event} />
        <EventTimeline event={event} />
        <EventOrganizer event={event} />
        <EventMap event={event} />
        <EventAttendees event={event} />
        <EventTickets event={event} onPurchase={() => purchase()} />
        <EventActions
          onLike={handleLike}
          onComment={() => setShowComments(!showComments)}
          onShare={() => setShowShare(true)}
          onBookmark={handleBookmark}
          isLiked={event.likedByMe}
          isBookmarked={event.bookmarkedByMe}
          likeCount={event.attendingCount}
          commentCount={event.commentCount}
          shareCount={event.shareCount}
        />

        {showComments && (
          <EventComments
            comments={comments}
            onAddComment={addComment}
            onReply={addReply}
            onLikeComment={likeComment}
            onAuthorClick={(authorId) => router.push(`/profile/${authorId}`)}
          />
        )}
      </ScrollView>

      {showShare && (
        <EventShare event={event} onClose={() => setShowShare(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000000",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 32,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 18,
    flex: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  backButtonInline: {
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  mutedText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 20,
  },
});
