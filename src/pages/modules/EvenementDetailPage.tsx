import { useLocalSearchParams, useRouter } from "expo-router";
import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable } from "react-native";

// src/pages/modules/EvenementDetailPage.tsx
import { useState, useEffect } from "react";
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
  const { tickets, purchase } = useTickets(id as Id<"events"> | undefined);
  const { rsvp } = useEventRSVP();
  const { events: relatedEvents } = useRelatedEvents(id || "");

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
      UIService.openToast("Erreur lors du like", "error");
    }
  };

  const handleBookmark = async () => {
    if (!event) return;
    try {
      await bookmarkEvent({ eventId: event._id });
      setEvent({ ...event, bookmarkedByMe: !event.bookmarkedByMe });
      UIService.openToast(event.bookmarkedByMe ? "Retiré" : "Ajouté", "success");
    } catch {
      UIService.openToast("Erreur", "error");
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
      UIService.openToast("Inscription mise à jour", "success");
    } catch {
      UIService.openToast("Erreur lors de l'inscription", "error");
    }
  };

  if (loading) {
    return (
      <View
        className="h-full flex flex-col px-4 pt-12 pb-8 space-y-4"
        style={{  }}
      >
        <Skeleton className="w-10 h-10 rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-8 w-3/4 rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </View>
    );
  }

  if (!event) {
    return (
      <View
        className="h-full flex flex-col items-center justify-center px-4"
        style={{  }}
      >
        <Pressable onPress={() => router(-1)} className="self-start mb-4">
          <ArrowLeft size={24} className="text-white/60" />
        </Pressable>
        <Text className="text-white/40">Événement introuvable</Text>
      </View>
    );
  }

  return (
    <View
      className="h-full flex flex-col"
      style={{  }}
    >
      <View className="flex-shrink-0 px-4 pt-12 pb-3 flex items-center gap-3">
        <Pressable
          onPress={() => router(-1)}
          className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5"
        >
          <ArrowLeft size={20} className="text-white" />
        </Pressable>
        <Text className="text-white font-bold text-lg flex-1 truncate">
          Événement
        </Text>
        <Pressable
          onPress={() => setShowMenu(!showMenu)}
          className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5"
        >
          <MoreVertical size={20} className="text-white/60" />
        </Pressable>
      </View>

      <View
        className="flex-1 overflow-y-auto px-4 pb-8 space-y-5"
        style={{  }}
      >
        <View
          className="space-y-4"
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
        </View>
      </View>

      {showShare && (
        <EventShare event={event} onClose={() => setShowShare(false)} />
      )}
    </View>
  );
}
