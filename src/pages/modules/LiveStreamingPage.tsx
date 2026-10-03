import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  AppState,
  Image,
  KeyboardAvoidingView,
  Modal,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  Animated,
  Easing,
  useWindowDimensions,
  type Permission,
} from "react-native";

import {
  ArrowLeft,
  Ban,
  ChevronRight,
  Clock,
  Clock3,
  Eye,
  Gift,
  Heart,
  MessageCircle,
  Mic,
  MicOff,
  PhoneOff,
  Play,
  PlayCircle,
  Plus,
  Shield,
  ShieldOff,
  Radio,
  Send,
  Share2,
  TrendingUp,
  UserMinus,
  UserPlus,
  Users,
  Video,
  VideoOff,
  X,
  Zap,
} from "lucide-react-native";

import { useAction, useMutation, useQuery } from "convex/react";

import {
  AudioSession,
  AudioTrack,
  LiveKitRoom,
  VideoTrack,
  isTrackReference,
  useConnectionState,
  useLocalParticipant,
  useRemoteParticipants,
  useTracks,
} from "@livekit/react-native";

import { ConnectionState, Track } from "livekit-client";
import { ResizeMode, Video as ExpoVideo } from "expo-av";

import { useConvexAuth } from "@/lib/convex-auth-compat";

import { api } from "@/convex/_generated/api.js";

import type { Id } from "@/convex/_generated/dataModel.js";

/* ============================================================================
 * TYPES
 * ========================================================================== */

type GiftType = "star" | "crown" | "fire" | "diamond" | "rocket";

type FloatingReaction = {
  id: string;
  emoji: string;
  x: number;
  color: string;
};

type LiveMessage = {
  _id: string;
  userId: Id<"users">;
  text: string;
  type: string;
  amount?: number | null;
  userName: string;
  userAvatar?: string;
};

type LiveStream = {
  _id: Id<"liveStreams">;
  hostId: Id<"users">;
  title: string;
  description?: string;
  category: string;
  thumbnailUrl?: string;
  viewerCount: number;
  peakViewers: number;
  likeCount: number;
  status: "scheduled" | "live" | "ended";
  startedAt?: string;
  endedAt?: string;
  tags: string[];
  isPublic: boolean;
  hostName: string;
  hostAvatar?: string;
  replayUrl?: string | null;
  replayDurationMs?: number | null;
  egressStatus?: string | null;
};

type LiveStreamingPageProps = {
  onBack: () => void;
};

type GiftConfig = {
  type: GiftType;
  emoji: string;
  label: string;
  price: number;
  color: string;
};

/* ============================================================================
 * CONSTANTS
 * ========================================================================== */

const BACKGROUND = "#050812";

const PANEL = "rgba(255,255,255,0.045)";

const BORDER = "rgba(255,255,255,0.08)";

const LIVE_RED = "#EF4444";

const PRIMARY = "#6366F1";

/**
 * Hauteur de la barre d'état Android.
 *
 * Les Modals utilisent `statusBarTranslucent` : le contenu passe SOUS la
 * barre d'état. Sans cette marge, le bouton retour se superpose à l'heure.
 */
const TOP_INSET: number =
  Platform.OS === "android" ? (StatusBar.currentHeight ?? 28) : 44;

/* Fréquence du heartbeat de présence.
 * Doit rester <= PRESENCE_TIMEOUT_MS / 2 côté backend.
 * Backend = 60 000 ms → heartbeat = 30 000 ms.
 */
const HEARTBEAT_INTERVAL_MS = 30_000;

const CATEGORIES = [
  "Tout",
  "Musique",
  "Cuisine",
  "Tech",
  "Sport",
  "Beauté",
  "Art",
  "Business",
  "Gaming",
];

const GIFTS: GiftConfig[] = [
  {
    type: "star",
    emoji: "⭐",
    label: "Étoile",
    price: 10,
    color: "#F59E0B",
  },
  {
    type: "fire",
    emoji: "🔥",
    label: "Feu",
    price: 50,
    color: "#EF4444",
  },
  {
    type: "crown",
    emoji: "👑",
    label: "Couronne",
    price: 100,
    color: "#8B5CF6",
  },
  {
    type: "diamond",
    emoji: "💎",
    label: "Diamant",
    price: 500,
    color: "#06B6D4",
  },
  {
    type: "rocket",
    emoji: "🚀",
    label: "Fusée",
    price: 1000,
    color: "#10B981",
  },
];

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function safeInitial(value?: string | null): string {
  const initial = value?.trim().charAt(0);

  return initial ? initial.toUpperCase() : "?";
}

function isHttpUrl(value?: string): boolean {
  return Boolean(value && /^https?:\/\//i.test(value));
}

function formatDuration(
  startedAt?: string,
  endedAt?: string,
  nowMs?: number,
): string {
  if (!startedAt) {
    return "00:00";
  }

  const start = new Date(startedAt).getTime();

  const end = endedAt ? new Date(endedAt).getTime() : (nowMs ?? Date.now());

  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return "00:00";
  }

  const totalSeconds = Math.floor((end - start) / 1000);

  const hours = Math.floor(totalSeconds / 3600);

  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      seconds,
    ).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function createReactionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/* ============================================================================
 * BROADCAST TYPES & HELPERS (LIVEKIT)
 * ========================================================================== */

type BroadcastCredentials = {
  serverUrl: string;
  token: string;
};

type BroadcastPrefs = {
  micOn: boolean;
  camOn: boolean;
};

/**
 * Forme tolérante de la réponse de `api.livekit.getLiveKitToken`.
 * Le champ d'URL est lu sous `serverUrl` en priorité, `url` en secours.
 */
type LiveKitTokenResult = {
  serverUrl?: string;
  url?: string;
  token?: string;
};

type BroadcastState = {
  streamId: Id<"liveStreams">;
  prefs: BroadcastPrefs;
};

const DEFAULT_BROADCAST_PREFS: BroadcastPrefs = {
  micOn: true,
  camOn: true,
};

/**
 * Android exige CAMERA + RECORD_AUDIO accordées AVANT toute capture WebRTC.
 * Les deux permissions sont demandées ensemble, quelles que soient les
 * préférences initiales, pour que l'activation ultérieure du micro ou de la
 * caméra fonctionne sans nouvelle demande.
 */
async function ensureBroadcastPermissions(): Promise<boolean> {
  if (Platform.OS !== "android") {
    return true;
  }

  const wanted: Permission[] = [
    PermissionsAndroid.PERMISSIONS.CAMERA,
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
  ];

  const result = await PermissionsAndroid.requestMultiple(wanted);

  return wanted.every(
    (permission) => result[permission] === PermissionsAndroid.RESULTS.GRANTED,
  );
}

/**
 * Variante dédiée aux co-hosts : mêmes permissions, mais le message d'erreur
 * côté UI est différent (c'est l'invité qui accepte ou refuse).
 */
async function ensureCohostPermissions(): Promise<boolean> {
  return ensureBroadcastPermissions();
}

function confirmEndLive(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    Alert.alert(
      "Terminer le live",
      "Voulez-vous réellement terminer cette diffusion ?",
      [
        {
          text: "Annuler",
          style: "cancel",
          onPress: () => resolve(false),
        },
        {
          text: "Terminer",
          style: "destructive",
          onPress: () => resolve(true),
        },
      ],
      {
        cancelable: true,
        onDismiss: () => resolve(false),
      },
    );
  });
}

function describeConnection(state: ConnectionState): {
  label: string;
  color: string;
} {
  switch (state) {
    case ConnectionState.Connected:
      return { label: "Connecté", color: "#34D399" };
    case ConnectionState.Connecting:
      return { label: "Connexion…", color: "#FBBF24" };
    case ConnectionState.Disconnected:
      return { label: "Déconnecté", color: "#F87171" };
    default:
      return { label: "Reconnexion…", color: "#FBBF24" };
  }
}

/* ============================================================================
 * AVATAR
 * ========================================================================== */

function Avatar({
  uri,
  name,
  size = 40,
  borderColor,
}: {
  uri?: string;
  name?: string;
  size?: number;
  borderColor?: string;
}) {
  if (isHttpUrl(uri)) {
    return (
      <Image
        source={{
          uri,
        }}
        accessibilityLabel={name || "Avatar"}
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: Math.max(10, size * 0.28),
            borderColor: borderColor ?? "rgba(255,255,255,0.14)",
            borderWidth: borderColor ? 2 : 1,
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.avatarFallback,
        {
          width: size,
          height: size,
          borderRadius: Math.max(10, size * 0.28),
          borderColor: borderColor ?? "rgba(255,255,255,0.12)",
        },
      ]}
    >
      <Text
        style={{
          color: "#FFFFFF",
          fontSize: Math.max(10, size * 0.34),
          fontWeight: "900",
        }}
      >
        {safeInitial(name)}
      </Text>
    </View>
  );
}

/* ============================================================================
 * FLOATING REACTION
 * ========================================================================== */

function FloatingEmoji({
  reaction,
  onDone,
}: {
  reaction: FloatingReaction;
  onDone: () => void;
}) {
  const translateY = useRef(new Animated.Value(0)).current;

  const opacity = useRef(new Animated.Value(1)).current;

  const scale = useRef(new Animated.Value(0.65)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -280,
        duration: 2100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 2100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1.35,
        friction: 7,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        onDone();
      }
    });
  }, [opacity, scale, translateY, onDone]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.floatingEmoji,
        {
          left: `${reaction.x}%`,
          transform: [
            {
              translateY,
            },
            {
              scale,
            },
          ],
          opacity,
        },
      ]}
    >
      <Text style={styles.floatingEmojiText}>{reaction.emoji}</Text>
    </Animated.View>
  );
}

/* ============================================================================
 * CHAT ROW
 * ========================================================================== */

function ChatRow({
  msg,
  onLongPress,
}: {
  msg: LiveMessage;
  onLongPress?: () => void;
}) {
  if (msg.type === "system") {
    return (
      <Pressable onLongPress={onLongPress} delayLongPress={350}>
        <View style={styles.systemMessage}>
          <Text style={styles.systemMessageText}>{msg.text}</Text>
        </View>
      </Pressable>
    );
  }

  const isSuperChat = msg.type === "super_chat";

  if (isSuperChat) {
    const giftEmoji =
      msg.text
        .split(" ")
        .find((part) => GIFTS.some((gift) => gift.emoji === part)) ?? "🎁";

    return (
      <Pressable onLongPress={onLongPress} delayLongPress={350}>
        <View style={styles.superChat}>
          <Text style={styles.superChatEmoji}>{giftEmoji}</Text>

          <View style={styles.superChatBody}>
            <Text style={styles.superChatAuthor} numberOfLines={1}>
              {msg.userName}
            </Text>

            <Text style={styles.superChatText} numberOfLines={2}>
              {msg.text}
            </Text>
          </View>

          {typeof msg.amount === "number" && (
            <Text style={styles.superChatAmount}>{msg.amount} pts</Text>
          )}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onLongPress={onLongPress} delayLongPress={350}>
      <View style={styles.chatRow}>
        <Avatar uri={msg.userAvatar} name={msg.userName} size={25} />

        <View style={styles.chatBody}>
          <Text style={styles.chatAuthor}>{msg.userName}</Text>

          <Text style={styles.chatText}>{msg.text}</Text>
        </View>
      </View>
    </Pressable>
  );
}

/* ============================================================================
 * WATCH VIEW — REMOTE VIDEO TRACK (HOST + COHOSTS GRID)
 * ========================================================================== */

/**
 * Scène vidéo du viewer.
 *
 * - 0 caméra distante   → thumbnail / spinner
 * - 1 caméra distante   → plein écran
 * - 2+ caméras          → host en plein écran + cohosts en miniatures
 *
 * L'identité LiveKit est le `userId` (voir `getLiveKitToken`), donc on peut
 * identifier le host par `stream.hostId` et le sortir de la grille.
 */
function WatchViewRemoteVideo({
  thumbnailUrl,
  hostId,
}: {
  thumbnailUrl?: string;
  hostId?: Id<"users">;
}) {
  const tracks = useTracks([Track.Source.Camera]);

  const remoteTracks = useMemo(
    () => tracks.filter(isTrackReference).filter((t) => !t.participant.isLocal),
    [tracks],
  );

  const hostTrack = useMemo(() => {
    if (!hostId) return null;
    return (
      remoteTracks.find((t) => t.participant.identity === (hostId as string)) ??
      null
    );
  }, [remoteTracks, hostId]);

  const cohostTracks = useMemo(() => {
    const others = hostId
      ? remoteTracks.filter(
          (t) => t.participant.identity !== (hostId as string),
        )
      : remoteTracks.slice(1);
    return others.slice(0, 3);
  }, [remoteTracks, hostId]);

  if (remoteTracks.length === 0) {
    if (isHttpUrl(thumbnailUrl)) {
      return (
        <Image
          source={{ uri: thumbnailUrl }}
          resizeMode="cover"
          style={styles.watchImage}
        />
      );
    }
    return (
      <View style={styles.watchFallback}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.broadcastFallbackText}>
          Connexion au flux du diffuseur…
        </Text>
      </View>
    );
  }

  const primaryTrack = hostTrack ?? remoteTracks[0];

  if (cohostTracks.length === 0) {
    return (
      <VideoTrack
        trackRef={primaryTrack}
        style={StyleSheet.absoluteFillObject}
        objectFit="cover"
        zOrder={0}
      />
    );
  }

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <VideoTrack
        trackRef={primaryTrack}
        style={StyleSheet.absoluteFillObject}
        objectFit="cover"
        zOrder={0}
      />

      <View style={styles.cohostGrid} pointerEvents="none">
        {cohostTracks.map((trackRef) => (
          <View key={trackRef.participant.identity} style={styles.cohostTile}>
            <VideoTrack
              trackRef={trackRef}
              style={styles.cohostTileVideo}
              objectFit="cover"
              zOrder={1}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

/* ============================================================================
 * COHOST PUBLISHER
 * ========================================================================== */

/**
 * Publie caméra + micro lorsque l'utilisateur est un co-host / guest accepté.
 *
 * Important :
 * - le composant reste dans la même <LiveKitRoom> que le viewer ;
 * - une seule séquence WebRTC peut être active ;
 * - le cleanup React ne désactive PAS directement les tracks ;
 * - la désactivation intervient uniquement lorsque `enabled` devient false ;
 * - cela évite les séquences OFF → ON concurrentes pendant les cycles
 *   React StrictMode / re-render.
 */
function CohostPublisher({ enabled }: { enabled: boolean }) {
  const { localParticipant } = useLocalParticipant();

  /**
   * Séquence de publication actuellement autorisée.
   */
  const sequenceRef = useRef(0);

  /**
   * Verrou de publication.
   */
  const publishingRef = useRef(false);

  /**
   * Empêche plusieurs désactivations concurrentes.
   */
  const disablingRef = useRef(false);

  useEffect(() => {
    /**
     * ------------------------------------------------------------------------
     * COHOST DÉSACTIVÉ
     * ------------------------------------------------------------------------
     *
     * C'est ici, et uniquement ici, que nous demandons à LiveKit de couper
     * caméra + micro.
     */
    if (!enabled || !localParticipant) {
      if (!localParticipant || disablingRef.current) {
        return;
      }

      disablingRef.current = true;

      const disable = async () => {
        try {
          if (localParticipant.isCameraEnabled) {
            await localParticipant.setCameraEnabled(false);
          }

          if (localParticipant.isMicrophoneEnabled) {
            await localParticipant.setMicrophoneEnabled(false);
          }
        } catch (error) {
          console.warn("[Cohost] disable failed:", error);
        } finally {
          disablingRef.current = false;
          publishingRef.current = false;
        }
      };

      void disable();

      return;
    }

    /**
     * ------------------------------------------------------------------------
     * COHOST DÉJÀ EN COURS DE PUBLICATION
     * ------------------------------------------------------------------------
     */
    if (publishingRef.current) {
      return;
    }

    publishingRef.current = true;

    const sequenceId = ++sequenceRef.current;

    let cancelled = false;

    const isCurrent = () => !cancelled && sequenceRef.current === sequenceId;

    const publish = async () => {
      try {
        /**
         * Sécurité supplémentaire :
         * si une désactivation précédente est encore en cours, on attend
         * qu'elle soit terminée avant de republier.
         */
        while (disablingRef.current && isCurrent()) {
          await new Promise<void>((resolve) => {
            setTimeout(resolve, 50);
          });
        }

        if (!isCurrent()) {
          return;
        }

        const granted = await ensureCohostPermissions();

        if (!isCurrent()) {
          return;
        }

        if (!granted) {
          Alert.alert(
            "Permissions requises",
            "Autorisez la caméra et le micro dans les réglages Android pour apparaître en direct.",
          );
          return;
        }

        /**
         * --------------------------------------------------------------------
         * CAMÉRA
         * --------------------------------------------------------------------
         */
        if (!localParticipant.isCameraEnabled) {
          await localParticipant.setCameraEnabled(true);
        }

        if (!isCurrent()) {
          return;
        }

        /**
         * --------------------------------------------------------------------
         * MICRO
         * --------------------------------------------------------------------
         */
        if (!localParticipant.isMicrophoneEnabled) {
          await localParticipant.setMicrophoneEnabled(true);
        }
      } catch (error) {
        if (!cancelled) {
          console.warn("[Cohost] publish failed:", error);
        }
      } finally {
        /**
         * Ne libère le verrou que pour la séquence qui nous appartient.
         */
        if (sequenceRef.current === sequenceId) {
          publishingRef.current = false;
        }
      }
    };

    void publish();

    /**
     * ------------------------------------------------------------------------
     * CLEANUP
     * ------------------------------------------------------------------------
     *
     * IMPORTANT :
     *
     * Nous n'appelons volontairement PAS :
     *
     *   setCameraEnabled(false)
     *   setMicrophoneEnabled(false)
     *
     * ici.
     *
     * React StrictMode peut exécuter :
     *
     *   effect → cleanup → effect
     *
     * alors que l'opération WebRTC du premier effect n'est pas encore
     * terminée.
     *
     * Déclencher OFF dans ce cleanup provoquait potentiellement :
     *
     *   ON → OFF → ON
     *
     * sur le même MediaStreamTrack.
     */
    return () => {
      cancelled = true;

      if (sequenceRef.current === sequenceId) {
        sequenceRef.current++;
      }

      /**
       * On ne remet PAS publishingRef.current à false ici.
       *
       * Le finally de la séquence async s'en charge lorsque l'opération
       * LiveKit réellement en cours est terminée.
       */
    };
  }, [enabled, localParticipant]);

  if (!enabled) {
    return null;
  }

  return (
    <View style={styles.cohostOverlay} pointerEvents="none">
      <View style={styles.cohostOverlayBadge}>
        <View style={styles.liveDot} />

        <Text style={styles.cohostOverlayText}>VOUS ÊTES EN DIRECT</Text>
      </View>
    </View>
  );
}
/* ============================================================================
 * WATCH VIEW (décision live vs replay AVANT token LiveKit)
 * ========================================================================== */

function WatchView({
  streamId,
  onClose,
}: {
  streamId: Id<"liveStreams">;
  onClose: () => void;
}) {
  const getLiveKitToken = useAction(api.livekit.getLiveKitToken);

  const stream = useQuery(api.liveStreams.getStream, {
    streamId,
  }) as LiveStream | null | undefined;

  const replay = useQuery(
    api.liveReplayQueries.getReplay, // ✅ ÇA
    stream ? { streamId } : "skip",
  ) as
    | {
        status: string | null;
        url: string | null;
      }
    | null
    | undefined;

  const [credentials, setCredentials] = useState<BroadcastCredentials | null>(
    null,
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void AudioSession.startAudioSession();
    return () => {
      void AudioSession.stopAudioSession();
    };
  }, []);

  useEffect(() => {
    if (!stream || stream.status !== "live") {
      return;
    }

    let cancelled = false;

    setErrorMessage(null);

    const fetchToken = async () => {
      try {
        const result = (await getLiveKitToken({
          streamId,
        })) as LiveKitTokenResult;

        if (cancelled) return;

        const serverUrl = result.serverUrl ?? result.url;
        const token = result.token;

        if (!serverUrl || !token) {
          setErrorMessage(
            "Le serveur n'a pas renvoyé d'identifiants de diffusion valides.",
          );
          return;
        }

        setCredentials({ serverUrl, token });
      } catch {
        if (!cancelled) {
          setErrorMessage("Impossible de rejoindre cette diffusion.");
        }
      }
    };

    void fetchToken();

    return () => {
      cancelled = true;
    };
  }, [getLiveKitToken, stream, streamId]);

  /* ------------------------------------------------------------------------
   * LOADING / ERREURS
   * ---------------------------------------------------------------------- */

  if (stream === undefined) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingIndicator}>
          <Radio size={26} color={LIVE_RED} />
        </View>
        <Text style={styles.loadingTitle}>Connexion au live…</Text>
        <Text style={styles.loadingText}>
          Chargement des données de la diffusion.
        </Text>
      </View>
    );
  }

  if (!stream) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingIndicator}>
          <Radio size={26} color="#475569" />
        </View>
        <Text style={styles.loadingTitle}>Live indisponible</Text>
        <Text style={styles.loadingText}>
          Cette diffusion n'est plus disponible.
        </Text>
        <Pressable onPress={onClose} style={styles.primaryButton}>
          <ArrowLeft size={15} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  /* ------------------------------------------------------------------------
   * STREAM TERMINÉ → REPLAY
   * ---------------------------------------------------------------------- */

  if (stream.status === "ended") {
    if (replay?.url) {
      return (
        <ReplayPlayer url={replay.url} title={stream.title} onClose={onClose} />
      );
    }

    if (replay?.status === "processing" || replay?.status === "recording") {
      return (
        <View style={styles.loadingScreen}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingTitle}>Replay en préparation…</Text>
          <Text style={styles.loadingText}>
            Le fichier est en cours de traitement, revenez dans quelques
            minutes.
          </Text>
          <Pressable onPress={onClose} style={styles.primaryButton}>
            <ArrowLeft size={15} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Retour</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingIndicator}>
          <Radio size={26} color="#475569" />
        </View>
        <Text style={styles.loadingTitle}>Live terminé</Text>
        <Text style={styles.loadingText}>
          Aucun replay n'est disponible pour cette diffusion.
        </Text>
        <Pressable onPress={onClose} style={styles.primaryButton}>
          <ArrowLeft size={15} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  /* ------------------------------------------------------------------------
   * ERREUR TOKEN
   * ---------------------------------------------------------------------- */

  if (errorMessage) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingIndicator}>
          <Radio size={26} color="#F87171" />
        </View>
        <Text style={styles.loadingTitle}>Live indisponible</Text>
        <Text style={styles.loadingText}>{errorMessage}</Text>
        <Pressable onPress={onClose} style={styles.primaryButton}>
          <ArrowLeft size={15} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  if (!credentials) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingIndicator}>
          <Radio size={26} color={LIVE_RED} />
        </View>
        <Text style={styles.loadingTitle}>Connexion au live…</Text>
        <Text style={styles.loadingText}>
          Récupération des accès à la diffusion.
        </Text>
      </View>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={credentials.serverUrl}
      token={credentials.token}
      connect={true}
      audio={false}
      video={false}
      onDisconnected={onClose}
    >
      <WatchViewRemoteAudio />
      <WatchViewInner streamId={streamId} onClose={onClose} />
    </LiveKitRoom>
  );
}

/* ============================================================================
 * WATCH VIEW — REMOTE AUDIO TRACKS
 * ========================================================================== */

function WatchViewRemoteAudio() {
  const tracks = useTracks([Track.Source.Microphone]);

  const remoteAudioTracks = useMemo(
    () =>
      tracks
        .filter(isTrackReference)
        .filter((track) => !track.participant.isLocal),
    [tracks],
  );

  return (
    <>
      {remoteAudioTracks.map((trackRef) => (
        <AudioTrack
          key={`${trackRef.participant.identity}-audio`}
          trackRef={trackRef}
        />
      ))}
    </>
  );
}

/* ============================================================================
 * WATCH VIEW — INNER
 * ========================================================================== */

function WatchViewInner({
  streamId,
  onClose,
}: {
  streamId: Id<"liveStreams">;
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();

  const { isAuthenticated, userId: authUserId } = useConvexAuth();

  /**
   * Fallback fiable pour `userId` : si `convex-auth-compat` n'expose pas
   * `userId`, on récupère l'identité via `api.users.getMe` pour que
   * `isHost` (et donc toutes les actions de modération / cohost) reste
   * fonctionnel.
   *
   * ⚠️ Cette query DOIT exister côté backend et retourner :
   *    { _id: Id<"users">, name?, avatarUrl?, image? } | null
   */
  const myUserId = authUserId ?? null;

  const stream = useQuery(api.liveStreams.getStream, {
    streamId,
  }) as LiveStream | null | undefined;

  const messages = useQuery(api.liveStreams.getStreamMessages, {
    streamId,
  }) as LiveMessage[] | undefined;

  const [modTarget, setModTarget] = useState<{
    userId: Id<"users">;
    userName: string;
    userAvatar?: string;
  } | null>(null);

  const [showBanList, setShowBanList] = useState(false);

  const [showCohosts, setShowCohosts] = useState(false);

  const [inviteTarget, setInviteTarget] = useState<{
    userId: Id<"users">;
    userName: string;
  } | null>(null);

  const banUser = useMutation(api.liveModeration.banUser);
  const timeoutUser = useMutation(api.liveModeration.timeoutUser);
  const muteUser = useMutation(api.liveModeration.muteUser);
  const revokeSanction = useMutation(api.liveModeration.revokeSanction);

  const sanctions = useQuery(
    api.liveModeration.listActiveSanctions,
    stream ? { streamId: stream._id } : "skip",
  );

  const cohosts = useQuery(
    api.liveCohosts.list,
    stream ? { streamId: stream._id } : "skip",
  );

  const pendingInvite = useQuery(
    api.liveCohosts.myPendingInvite,
    stream ? { streamId: stream._id } : "skip",
  );

  const inviteCohost = useMutation(api.liveCohosts.invite);
  const removeCohost = useMutation(api.liveCohosts.remove);
  const respondInvite = useMutation(api.liveCohosts.respond);

  const myStageRole = useQuery(
    api.liveCohosts.amIOnStage,
    stream ? { streamId: stream._id } : "skip",
  );

  const isHost = !!stream && !!myUserId && stream.hostId === myUserId;

  const sendMessage = useMutation(api.liveStreams.sendMessage);

  const likeStream = useMutation(api.liveStreams.likeStream);

  const joinStream = useMutation(api.liveStreams.joinStream);

  const leaveStream = useMutation(api.liveStreams.leaveStream);

  const heartbeatStream = useMutation(api.liveStreams.heartbeatStream);

  const sendGift = useMutation(api.liveStreams.sendGift);

  const [chatText, setChatText] = useState("");

  const [liked, setLiked] = useState(false);

  const [likePending, setLikePending] = useState(false);

  const [messagePending, setMessagePending] = useState(false);

  const [giftPending, setGiftPending] = useState(false);

  const [showGifts, setShowGifts] = useState(false);

  const [reactions, setReactions] = useState<FloatingReaction[]>([]);

  const chatScrollRef = useRef<ScrollView>(null);

  /* --------------------------------------------------------------------------
   * LIVE PRESENCE
   * ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!isAuthenticated || stream?.status !== "live") {
      return;
    }

    let mounted = true;
    let heartbeatInFlight = false;
    let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

    const stopHeartbeatInterval = () => {
      if (heartbeatInterval !== null) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
    };

    const sendHeartbeat = async () => {
      if (!mounted || heartbeatInFlight) {
        return;
      }

      heartbeatInFlight = true;

      try {
        const result = await heartbeatStream({ streamId });

        if (!mounted) {
          return;
        }

        if (result && result.active === false) {
          try {
            await joinStream({ streamId });

            if (!mounted) {
              return;
            }

            await heartbeatStream({ streamId });
          } catch {
            // La prochaine pulsation réessaiera.
          }
        }
      } catch {
        // Télémétrie de session.
      } finally {
        heartbeatInFlight = false;
      }
    };

    const startHeartbeatInterval = () => {
      if (heartbeatInterval !== null) {
        return;
      }

      heartbeatInterval = setInterval(() => {
        void sendHeartbeat();
      }, HEARTBEAT_INTERVAL_MS);
    };

    const joinAndResume = async () => {
      if (!mounted) {
        return;
      }

      try {
        await joinStream({ streamId });

        if (!mounted) {
          return;
        }

        await heartbeatStream({ streamId });
      } catch {
        // Télémétrie silencieuse.
      }
    };

    void joinAndResume();
    startHeartbeatInterval();

    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextState) => {
        if (!mounted) {
          return;
        }

        if (nextState === "active") {
          void joinAndResume();
          startHeartbeatInterval();
        } else {
          stopHeartbeatInterval();
        }
      },
    );

    return () => {
      mounted = false;
      stopHeartbeatInterval();
      appStateSubscription.remove();
      void leaveStream({ streamId }).catch(() => null);
    };
  }, [
    heartbeatStream,
    isAuthenticated,
    joinStream,
    leaveStream,
    stream?.status,
    streamId,
  ]);

  /* --------------------------------------------------------------------------
   * CHAT AUTO SCROLL
   * ------------------------------------------------------------------------ */

  useEffect(() => {
    requestAnimationFrame(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages]);

  /* --------------------------------------------------------------------------
   * REACTIONS
   * ------------------------------------------------------------------------ */

  const addReaction = useCallback((emoji: string, color: string) => {
    const id = createReactionId();
    const x = 12 + Math.random() * 70;

    setReactions((current) => [...current, { id, emoji, x, color }]);
  }, []);

  const removeReaction = useCallback((id: string) => {
    setReactions((current) => current.filter((reaction) => reaction.id !== id));
  }, []);

  /* --------------------------------------------------------------------------
   * LIKE
   * ------------------------------------------------------------------------ */

  const handleLike = useCallback(async () => {
    if (!isAuthenticated) {
      Alert.alert("Connexion requise", "Connectez-vous pour réagir à ce live.");
      return;
    }

    if (liked || likePending) {
      return;
    }

    setLikePending(true);

    try {
      await likeStream({ streamId });

      setLiked(true);

      addReaction("❤️", LIVE_RED);
    } catch {
      Alert.alert(
        "Action impossible",
        "Votre réaction n'a pas pu être enregistrée.",
      );
    } finally {
      setLikePending(false);
    }
  }, [addReaction, isAuthenticated, likePending, likeStream, liked, streamId]);

  /* --------------------------------------------------------------------------
   * SEND MESSAGE
   * ------------------------------------------------------------------------ */

  const handleSendMessage = useCallback(async () => {
    const text = chatText.trim();

    if (!text) {
      return;
    }

    if (!isAuthenticated) {
      Alert.alert(
        "Connexion requise",
        "Connectez-vous pour participer au chat.",
      );
      return;
    }

    if (messagePending) {
      return;
    }

    setMessagePending(true);

    try {
      await sendMessage({ streamId, text, type: "chat" });

      setChatText("");
    } catch {
      Alert.alert(
        "Message non envoyé",
        "Impossible d'envoyer votre message pour le moment.",
      );
    } finally {
      setMessagePending(false);
    }
  }, [chatText, isAuthenticated, messagePending, sendMessage, streamId]);

  /* --------------------------------------------------------------------------
   * GIFT
   * ------------------------------------------------------------------------ */

  const handleGift = useCallback(
    async (gift: GiftConfig) => {
      if (!isAuthenticated) {
        Alert.alert(
          "Connexion requise",
          "Connectez-vous pour envoyer un cadeau.",
        );
        return;
      }

      if (giftPending) {
        return;
      }

      setGiftPending(true);

      try {
        await sendGift({
          streamId,
          giftType: gift.type,
          amount: gift.price,
        });

        addReaction(gift.emoji, gift.color);

        setShowGifts(false);
      } catch {
        Alert.alert(
          "Cadeau non envoyé",
          "Le cadeau n'a pas pu être enregistré.",
        );
      } finally {
        setGiftPending(false);
      }
    },
    [addReaction, giftPending, isAuthenticated, sendGift, streamId],
  );

  /* --------------------------------------------------------------------------
   * SHARE
   * ------------------------------------------------------------------------ */

  const handleShare = useCallback(async () => {
    if (!stream) {
      return;
    }

    try {
      await Share.share({
        title: stream.title,
        message: `${stream.title} — Live sur DébrouillePro`,
      });
    } catch {
      // L'annulation native du partage ne constitue pas une erreur.
    }
  }, [stream]);

  /* --------------------------------------------------------------------------
   * LOADING
   * ------------------------------------------------------------------------ */

  if (stream === undefined) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingIndicator}>
          <Radio size={26} color={LIVE_RED} />
        </View>
        <Text style={styles.loadingTitle}>Connexion au live…</Text>
        <Text style={styles.loadingText}>
          Chargement des données de la diffusion.
        </Text>
      </View>
    );
  }

  if (!stream) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingIndicator}>
          <Radio size={26} color="#475569" />
        </View>
        <Text style={styles.loadingTitle}>Live indisponible</Text>
        <Text style={styles.loadingText}>
          Cette diffusion n'est plus disponible.
        </Text>
        <Pressable onPress={onClose} style={styles.primaryButton}>
          <ArrowLeft size={15} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Modal
      visible
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <KeyboardAvoidingView
        style={[styles.watchScreen, { width, height }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* VISUAL AREA */}
        <View style={styles.watchVisual}>
          <WatchViewRemoteVideo
            thumbnailUrl={stream.thumbnailUrl}
            hostId={stream.hostId}
          />

          <View style={styles.watchShade} />

          <View pointerEvents="none" style={styles.reactionLayer}>
            {reactions.map((reaction) => (
              <FloatingEmoji
                key={reaction.id}
                reaction={reaction}
                onDone={() => removeReaction(reaction.id)}
              />
            ))}
          </View>

          <View style={styles.watchHeader}>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fermer le live"
              style={styles.roundButton}
            >
              <ArrowLeft size={18} color="#FFFFFF" />
            </Pressable>

            <View style={styles.hostIdentity}>
              <Avatar
                uri={stream.hostAvatar}
                name={stream.hostName}
                size={38}
                borderColor={LIVE_RED}
              />

              <View style={styles.hostIdentityText}>
                <Text style={styles.hostName} numberOfLines={1}>
                  {stream.hostName}
                </Text>

                <Text style={styles.hostCategory} numberOfLines={1}>
                  {stream.category}
                </Text>
              </View>
            </View>

            <View style={styles.watchHeaderRight}>
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.livePillText}>LIVE</Text>
              </View>

              <View style={styles.viewerPill}>
                <Eye size={11} color="#CBD5E1" />
                <Text style={styles.viewerPillText}>
                  {stream.viewerCount.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.watchTitleArea}>
            <Text style={styles.watchTitle} numberOfLines={3}>
              {stream.title}
            </Text>

            <View style={styles.watchStats}>
              <View style={styles.watchStat}>
                <Heart size={12} color={LIVE_RED} fill={LIVE_RED} />
                <Text style={styles.watchStatText}>
                  {stream.likeCount.toLocaleString()}
                </Text>
              </View>

              {stream.startedAt ? (
                <View style={styles.watchStat}>
                  <Clock size={12} color="#94A3B8" />
                  <Text style={styles.watchStatText}>
                    {formatDuration(stream.startedAt)}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.actionRail}>
            <Pressable
              onPress={() => void handleLike()}
              disabled={liked || likePending}
              accessibilityRole="button"
              accessibilityLabel={liked ? "Live aimé" : "Aimer le live"}
              style={styles.actionItem}
            >
              <View
                style={[styles.actionCircle, liked && styles.actionCircleLiked]}
              >
                <Heart
                  size={25}
                  color={liked ? LIVE_RED : "#FFFFFF"}
                  fill={liked ? LIVE_RED : "transparent"}
                />
              </View>

              <Text style={styles.actionLabel}>
                {stream.likeCount.toLocaleString()}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setShowGifts(true)}
              accessibilityRole="button"
              accessibilityLabel="Envoyer un cadeau"
              style={styles.actionItem}
            >
              <View style={styles.actionCircle}>
                <Gift size={25} color="#F59E0B" />
              </View>
              <Text style={styles.actionLabel}>Cadeau</Text>
            </Pressable>

            <Pressable
              onPress={() => void handleShare()}
              accessibilityRole="button"
              accessibilityLabel="Partager le live"
              style={styles.actionItem}
            >
              <View style={styles.actionCircle}>
                <Share2 size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.actionLabel}>Partager</Text>
            </Pressable>
          </View>
        </View>

        {pendingInvite ? (
          <View style={styles.cohostInviteBanner}>
            <UserPlus size={16} color="#A5B4FC" />

            <Text style={styles.cohostInviteText}>
              L'hôte vous invite comme {pendingInvite.role}.
            </Text>

            <Pressable
              onPress={() => void respondInvite({ streamId, accept: true })}
              style={styles.cohostAccept}
              accessibilityRole="button"
              accessibilityLabel="Accepter l'invitation co-host"
            >
              <Text style={styles.cohostAcceptText}>Rejoindre</Text>
            </Pressable>

            <Pressable
              onPress={() => void respondInvite({ streamId, accept: false })}
              style={styles.cohostDecline}
              accessibilityRole="button"
              accessibilityLabel="Refuser l'invitation co-host"
            >
              <Text style={styles.cohostDeclineText}>Refuser</Text>
            </Pressable>
          </View>
        ) : null}

        {/* CHAT */}
        <View style={styles.chatPanel}>
          <View style={styles.chatHeader}>
            <View style={styles.chatHeaderTitle}>
              <MessageCircle size={15} color="#A5B4FC" />
              <Text style={styles.chatHeaderText}>Discussion en direct</Text>
            </View>

            {isHost ? (
              <View style={{ flexDirection: "row", gap: 6 }}>
                <Pressable
                  onPress={() => setShowBanList(true)}
                  style={styles.chatHeaderMod}
                  accessibilityRole="button"
                  accessibilityLabel="Voir les sanctions actives"
                >
                  <Shield size={13} color="#F87171" />
                  <Text style={styles.chatHeaderModText}>
                    {sanctions?.length ?? 0}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setShowCohosts(true)}
                  style={styles.chatHeaderMod}
                  accessibilityRole="button"
                  accessibilityLabel="Gérer les co-hosts"
                >
                  <UserPlus size={13} color="#A5B4FC" />
                  <Text style={styles.chatHeaderModText}>
                    {cohosts?.length ?? 0}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Text style={styles.chatHeaderHint}>
                {messages?.length ?? 0} message
                {(messages?.length ?? 0) !== 1 ? "s" : ""}
              </Text>
            )}
          </View>

          <ScrollView
            ref={chatScrollRef}
            style={styles.chatScroll}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {(messages ?? []).map((message) => (
              <ChatRow
                key={message._id}
                msg={message}
                onLongPress={
                  isHost && message.type === "chat"
                    ? () =>
                        setModTarget({
                          userId: message.userId,
                          userName: message.userName,
                          userAvatar: message.userAvatar,
                        })
                    : undefined
                }
              />
            ))}
          </ScrollView>

          <View style={styles.composer}>
            {isAuthenticated ? (
              <>
                <TextInput
                  value={chatText}
                  onChangeText={setChatText}
                  placeholder="Écrire un message…"
                  placeholderTextColor="rgba(255,255,255,0.34)"
                  multiline
                  maxLength={1000}
                  style={styles.chatInput}
                  returnKeyType="send"
                  onSubmitEditing={() => void handleSendMessage()}
                />

                <Pressable
                  onPress={() => void handleSendMessage()}
                  disabled={!chatText.trim() || messagePending}
                  accessibilityRole="button"
                  accessibilityLabel="Envoyer le message"
                  style={[
                    styles.sendButton,
                    (!chatText.trim() || messagePending) &&
                      styles.disabledButton,
                  ]}
                >
                  <Send size={15} color="#FFFFFF" />
                </Pressable>
              </>
            ) : (
              <View style={styles.loginPrompt}>
                <Text style={styles.loginPromptText}>
                  Connectez-vous pour participer au chat.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* GIFTS */}
        <Modal
          visible={showGifts}
          transparent
          animationType="slide"
          statusBarTranslucent
          onRequestClose={() => setShowGifts(false)}
        >
          <View style={[styles.modalBackdrop, { width, height }]}>
            <Pressable
              style={styles.modalDismissArea}
              onPress={() => setShowGifts(false)}
            />

            <View style={styles.giftSheet}>
              <View style={styles.sheetHeader}>
                <View style={styles.sheetTitleRow}>
                  <Gift size={19} color="#F59E0B" />
                  <Text style={styles.sheetTitle}>Envoyer un cadeau</Text>
                </View>

                <Pressable
                  onPress={() => setShowGifts(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Fermer"
                  style={styles.sheetClose}
                >
                  <X size={17} color="#FFFFFF" />
                </Pressable>
              </View>

              <Text style={styles.sheetDescription}>
                Choisissez un cadeau disponible pour cette diffusion.
              </Text>

              <View style={styles.giftGrid}>
                {GIFTS.map((gift) => (
                  <Pressable
                    key={gift.type}
                    onPress={() => void handleGift(gift)}
                    disabled={giftPending}
                    accessibilityRole="button"
                    accessibilityLabel={`${gift.label}, ${gift.price} points`}
                    style={({ pressed }) => [
                      styles.giftCard,
                      {
                        backgroundColor: `${gift.color}12`,
                        borderColor: `${gift.color}28`,
                      },
                      pressed && styles.pressed,
                      giftPending && styles.disabledButton,
                    ]}
                  >
                    <Text style={styles.giftEmoji}>{gift.emoji}</Text>
                    <Text style={styles.giftName}>{gift.label}</Text>
                    <Text style={[styles.giftPrice, { color: gift.color }]}>
                      {gift.price} pts
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.giftDisclaimer}>
                Le montant et le type de cadeau sont transmis au backend avec
                cette diffusion.
              </Text>
            </View>
          </View>
        </Modal>

        {/* MODAL MODÉRATION */}
        <Modal
          visible={modTarget !== null}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setModTarget(null)}
        >
          <View style={[styles.modalBackdrop, { width, height }]}>
            <Pressable
              style={styles.modalDismissArea}
              onPress={() => setModTarget(null)}
            />

            <View style={styles.moderationSheet}>
              <View style={styles.sheetHeader}>
                <View style={styles.sheetTitleRow}>
                  <Shield size={18} color="#F87171" />
                  <Text style={styles.sheetTitle}>
                    Modérer {modTarget?.userName}
                  </Text>
                </View>

                <Pressable
                  onPress={() => setModTarget(null)}
                  style={styles.sheetClose}
                  accessibilityRole="button"
                  accessibilityLabel="Fermer"
                >
                  <X size={17} color="#FFFFFF" />
                </Pressable>
              </View>

              <Pressable
                onPress={() => {
                  if (!modTarget) return;
                  void timeoutUser({
                    streamId,
                    userId: modTarget.userId,
                    duration: "5m",
                  });
                  setModTarget(null);
                }}
                style={styles.modAction}
              >
                <Clock3 size={17} color="#FBBF24" />
                <Text style={styles.modActionText}>Timeout 5 min</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  if (!modTarget) return;
                  void timeoutUser({
                    streamId,
                    userId: modTarget.userId,
                    duration: "1h",
                  });
                  setModTarget(null);
                }}
                style={styles.modAction}
              >
                <Clock3 size={17} color="#F59E0B" />
                <Text style={styles.modActionText}>Timeout 1 heure</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  if (!modTarget) return;
                  void muteUser({
                    streamId,
                    userId: modTarget.userId,
                  });
                  setModTarget(null);
                }}
                style={styles.modAction}
              >
                <ShieldOff size={17} color="#94A3B8" />
                <Text style={styles.modActionText}>Mute permanent</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  if (!modTarget) return;
                  void banUser({
                    streamId,
                    userId: modTarget.userId,
                  });
                  setModTarget(null);
                }}
                style={[styles.modAction, styles.modActionDanger]}
              >
                <Ban size={17} color="#FCA5A5" />
                <Text style={[styles.modActionText, { color: "#FCA5A5" }]}>
                  Bannir
                </Text>
              </Pressable>

              <View style={styles.modSeparator} />

              <Pressable
                onPress={() => {
                  if (!modTarget) return;
                  setInviteTarget({
                    userId: modTarget.userId,
                    userName: modTarget.userName,
                  });
                  setModTarget(null);
                }}
                style={styles.modAction}
              >
                <UserPlus size={17} color="#A5B4FC" />
                <Text style={styles.modActionText}>Inviter comme co-host</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* MODAL BAN LIST */}
        <Modal
          visible={showBanList}
          transparent
          animationType="slide"
          statusBarTranslucent
          onRequestClose={() => setShowBanList(false)}
        >
          <View style={[styles.modalBackdrop, { width, height }]}>
            <Pressable
              style={styles.modalDismissArea}
              onPress={() => setShowBanList(false)}
            />

            <View style={styles.giftSheet}>
              <View style={styles.sheetHeader}>
                <View style={styles.sheetTitleRow}>
                  <ShieldOff size={18} color="#F87171" />
                  <Text style={styles.sheetTitle}>
                    Sanctions actives ({sanctions?.length ?? 0})
                  </Text>
                </View>

                <Pressable
                  onPress={() => setShowBanList(false)}
                  style={styles.sheetClose}
                  accessibilityRole="button"
                  accessibilityLabel="Fermer"
                >
                  <X size={17} color="#FFFFFF" />
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 360, marginTop: 10 }}>
                {(sanctions ?? []).length === 0 ? (
                  <Text style={styles.sheetDescription}>
                    Aucune sanction active.
                  </Text>
                ) : (
                  (sanctions ?? []).map((sanction) => (
                    <View key={sanction._id} style={styles.banRow}>
                      <Avatar
                        uri={sanction.userAvatar}
                        name={sanction.userName}
                        size={34}
                      />

                      <View style={{ flex: 1 }}>
                        <Text style={styles.banName}>{sanction.userName}</Text>

                        <Text style={styles.banMeta}>
                          {sanction.type === "ban"
                            ? "Banni"
                            : sanction.type === "mute"
                              ? "Mute"
                              : `Timeout jusqu'à ${new Date(
                                  sanction.expiresAt ?? 0,
                                ).toLocaleTimeString()}`}
                        </Text>
                      </View>

                      <Pressable
                        onPress={() =>
                          void revokeSanction({
                            streamId,
                            banId: sanction._id,
                          })
                        }
                        style={styles.unbanButton}
                        accessibilityRole="button"
                        accessibilityLabel={`Révoquer la sanction de ${sanction.userName}`}
                      >
                        <Text style={styles.unbanButtonText}>Révoquer</Text>
                      </Pressable>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* MODAL COHOSTS */}
        <Modal
          visible={showCohosts}
          transparent
          animationType="slide"
          statusBarTranslucent
          onRequestClose={() => setShowCohosts(false)}
        >
          <View style={[styles.modalBackdrop, { width, height }]}>
            <Pressable
              style={styles.modalDismissArea}
              onPress={() => setShowCohosts(false)}
            />

            <View style={styles.giftSheet}>
              <View style={styles.sheetHeader}>
                <View style={styles.sheetTitleRow}>
                  <UserPlus size={18} color="#A5B4FC" />
                  <Text style={styles.sheetTitle}>Co-hosts / Modérateurs</Text>
                </View>

                <Pressable
                  onPress={() => setShowCohosts(false)}
                  style={styles.sheetClose}
                  accessibilityRole="button"
                  accessibilityLabel="Fermer"
                >
                  <X size={17} color="#FFFFFF" />
                </Pressable>
              </View>

              <Text style={styles.sheetDescription}>
                Long-press un message → "Inviter comme co-host".
              </Text>

              {(cohosts ?? []).map((cohost) => (
                <View key={cohost._id} style={styles.banRow}>
                  <Avatar
                    uri={cohost.userAvatar}
                    name={cohost.userName}
                    size={34}
                  />

                  <View style={{ flex: 1 }}>
                    <Text style={styles.banName}>{cohost.userName}</Text>
                    <Text style={styles.banMeta}>
                      {cohost.role} · {cohost.status}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() =>
                      void removeCohost({
                        streamId,
                        userId: cohost.userId,
                      })
                    }
                    style={styles.unbanButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Retirer ${cohost.userName}`}
                  >
                    <UserMinus size={13} color="#FCA5A5" />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        </Modal>

        {/* MODAL INVITE ROLE */}
        <Modal
          visible={inviteTarget !== null}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setInviteTarget(null)}
        >
          <View style={[styles.modalBackdrop, { width, height }]}>
            <Pressable
              style={styles.modalDismissArea}
              onPress={() => setInviteTarget(null)}
            />

            <View style={styles.moderationSheet}>
              <Text style={styles.sheetTitle}>
                Rôle pour {inviteTarget?.userName}
              </Text>

              {(["cohost", "moderator", "guest"] as const).map((role) => (
                <Pressable
                  key={role}
                  onPress={() => {
                    if (!inviteTarget) return;

                    void inviteCohost({
                      streamId,
                      userId: inviteTarget.userId,
                      role,
                    });

                    setInviteTarget(null);
                  }}
                  style={styles.modAction}
                >
                  <UserPlus size={17} color="#A5B4FC" />

                  <Text style={styles.modActionText}>
                    {role === "cohost"
                      ? "Co-host (peut publier caméra + micro)"
                      : role === "moderator"
                        ? "Modérateur (peut modérer le chat)"
                        : "Invité (peut publier caméra)"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Modal>

        <CohostPublisher
          enabled={
            myStageRole?.role === "cohost" || myStageRole?.role === "guest"
          }
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ============================================================================
 * REPLAY PLAYER
 * ========================================================================== */

function ReplayPlayer({
  url,
  title,
  onClose,
}: {
  url: string;
  title: string;
  onClose: () => void;
}) {
  return (
    <Modal
      visible
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <View style={styles.watchHeader}>
          <Pressable
            onPress={onClose}
            style={styles.roundButton}
            accessibilityRole="button"
            accessibilityLabel="Retour au live"
          >
            <ArrowLeft size={18} color="#FFFFFF" />
          </Pressable>

          <View style={styles.hostIdentity}>
            <View style={styles.hostIdentityText}>
              <Text style={styles.hostName} numberOfLines={1}>
                {title}
              </Text>
              <Text style={styles.hostCategory}>Replay</Text>
            </View>
          </View>
        </View>

        <ExpoVideo
          source={{ uri: url }}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          style={StyleSheet.absoluteFillObject}
        />
      </View>
    </Modal>
  );
}

/* ============================================================================
 * GO LIVE FORM
 * ========================================================================== */

function GoLiveForm({
  onClose,
  onStarted,
}: {
  onClose: () => void;
  onStarted: (id: Id<"liveStreams">, prefs: BroadcastPrefs) => void;
}) {
  const { width, height } = useWindowDimensions();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Musique");
  const [isPublic, setIsPublic] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [loading, setLoading] = useState(false);

  const startStream = useMutation(api.liveStreams.startStream);

  const handleStart = useCallback(async () => {
    const cleanTitle = title.trim();

    if (cleanTitle.length < 3) {
      Alert.alert(
        "Titre requis",
        "Ajoutez un titre de live d'au moins 3 caractères.",
      );
      return;
    }

    if (loading) {
      return;
    }

    setLoading(true);

    try {
      const id = await startStream({
        title: cleanTitle,
        category,
        tags: [],
        isPublic,
      });

      onStarted(id, { micOn, camOn });
    } catch {
      Alert.alert(
        "Démarrage impossible",
        "Le backend n'a pas pu démarrer cette diffusion.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    camOn,
    category,
    isPublic,
    loading,
    micOn,
    onStarted,
    startStream,
    title,
  ]);

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.modalBackdrop, { width, height }]}>
        <Pressable style={styles.modalDismissArea} onPress={onClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.goLiveSheet}
        >
          <View style={styles.sheetHeader}>
            <View style={styles.sheetTitleRow}>
              <Radio size={19} color={LIVE_RED} />
              <Text style={styles.sheetTitle}>Lancer un Live</Text>
            </View>

            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
              style={styles.sheetClose}
            >
              <X size={17} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={styles.broadcastStatus}>
            <View style={styles.broadcastIcon}>
              {camOn ? (
                <Video size={23} color="#FFFFFF" />
              ) : (
                <VideoOff size={23} color="#94A3B8" />
              )}
            </View>

            <View style={styles.broadcastStatusBody}>
              <Text style={styles.broadcastStatusTitle}>
                Préparation de la diffusion
              </Text>
              <Text style={styles.broadcastStatusText}>
                Votre caméra et votre micro seront diffusés en direct via
                LiveKit dès que vous démarrez.
              </Text>
            </View>
          </View>

          <Text style={styles.fieldLabel}>Titre du live</Text>

          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ex. Mon émission en direct"
            placeholderTextColor="rgba(255,255,255,0.35)"
            maxLength={120}
            style={styles.titleInput}
          />

          <Text style={styles.characterCount}>{title.length}/120</Text>

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Catégorie</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.filter((item) => item !== "Tout").map((item) => {
              const active = category === item;

              return (
                <Pressable
                  key={item}
                  onPress={() => setCategory(item)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.categoryChip,
                    active && styles.categoryChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      active && styles.categoryChipTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.controlPanel}>
            <View style={styles.controlRow}>
              <View style={styles.controlIdentity}>
                <Mic size={17} color={micOn ? "#A5B4FC" : "#64748B"} />

                <View>
                  <Text style={styles.controlTitle}>Microphone</Text>
                  <Text style={styles.controlSubtitle}>
                    {micOn ? "Activé" : "Désactivé"}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => setMicOn((value) => !value)}
                accessibilityRole="switch"
                accessibilityState={{ checked: micOn }}
                style={[styles.switch, micOn && styles.switchActive]}
              >
                <View
                  style={[styles.switchKnob, micOn && styles.switchKnobActive]}
                />
              </Pressable>
            </View>

            <View style={styles.controlDivider} />

            <View style={styles.controlRow}>
              <View style={styles.controlIdentity}>
                {camOn ? (
                  <Video size={17} color="#A5B4FC" />
                ) : (
                  <VideoOff size={17} color="#64748B" />
                )}

                <View>
                  <Text style={styles.controlTitle}>Caméra</Text>
                  <Text style={styles.controlSubtitle}>
                    {camOn ? "Activée" : "Désactivée"}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => setCamOn((value) => !value)}
                accessibilityRole="switch"
                accessibilityState={{ checked: camOn }}
                style={[styles.switch, camOn && styles.switchActive]}
              >
                <View
                  style={[styles.switchKnob, camOn && styles.switchKnobActive]}
                />
              </Pressable>
            </View>

            <View style={styles.controlDivider} />

            <View style={styles.controlRow}>
              <View style={styles.controlIdentity}>
                <Radio size={17} color={isPublic ? "#A5B4FC" : "#64748B"} />

                <View>
                  <Text style={styles.controlTitle}>Live public</Text>
                  <Text style={styles.controlSubtitle}>
                    {isPublic ? "Visible publiquement" : "Accès restreint"}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => setIsPublic((value) => !value)}
                accessibilityRole="switch"
                accessibilityState={{ checked: isPublic }}
                style={[styles.switch, isPublic && styles.switchActive]}
              >
                <View
                  style={[
                    styles.switchKnob,
                    isPublic && styles.switchKnobActive,
                  ]}
                />
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={() => void handleStart()}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Démarrer le Live"
            style={[styles.goLiveButton, loading && styles.disabledButton]}
          >
            <Radio size={18} color="#FFFFFF" />

            <Text style={styles.goLiveButtonText}>
              {loading ? "Démarrage…" : "Démarrer le Live"}
            </Text>
          </Pressable>

          <Text style={styles.goLiveDisclaimer}>
            Android vous demandera l'autorisation d'utiliser la caméra et le
            micro.
          </Text>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

/* ============================================================================
 * LIVE BROADCASTER — HOST
 * ========================================================================== */

function BroadcasterInner({
  stream,
  ending,
  onRequestEnd,
}: {
  stream: LiveStream | null | undefined;
  ending: boolean;
  onRequestEnd: () => void;
}) {
  const { localParticipant, isCameraEnabled, isMicrophoneEnabled } =
    useLocalParticipant();

  const connectionState = useConnectionState();

  const tracks = useTracks([Track.Source.Camera]);

  const [now, setNow] = useState(() => Date.now());

  const [pendingToggle, setPendingToggle] = useState<
    "camera" | "microphone" | null
  >(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const localCameraTrack = useMemo(
    () =>
      tracks
        .filter(isTrackReference)
        .find((trackRef) => trackRef.participant.isLocal),
    [tracks],
  );

  const connection = describeConnection(connectionState);

  const remoteParticipants = useRemoteParticipants();
  const liveKitViewerCount = remoteParticipants.length;
  const convexViewerCount = stream?.viewerCount ?? 0;
  const viewerCountsDiverge =
    Math.abs(liveKitViewerCount - convexViewerCount) >= 2;
  const displayedViewerCount = viewerCountsDiverge
    ? liveKitViewerCount
    : convexViewerCount;

  const toggleCamera = useCallback(async () => {
    if (pendingToggle) {
      return;
    }

    setPendingToggle("camera");

    try {
      await localParticipant.setCameraEnabled(!isCameraEnabled);
    } catch {
      Alert.alert(
        "Caméra indisponible",
        "Impossible de modifier l'état de la caméra.",
      );
    } finally {
      setPendingToggle(null);
    }
  }, [isCameraEnabled, localParticipant, pendingToggle]);

  const toggleMicrophone = useCallback(async () => {
    if (pendingToggle) {
      return;
    }

    setPendingToggle("microphone");

    try {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch {
      Alert.alert(
        "Micro indisponible",
        "Impossible de modifier l'état du micro.",
      );
    } finally {
      setPendingToggle(null);
    }
  }, [isMicrophoneEnabled, localParticipant, pendingToggle]);

  return (
    <View style={styles.broadcastStage}>
      {localCameraTrack && isCameraEnabled ? (
        <VideoTrack
          trackRef={localCameraTrack}
          style={StyleSheet.absoluteFill}
          objectFit="cover"
          zOrder={0}
        />
      ) : (
        <View style={styles.broadcastFallback}>
          {isCameraEnabled ? (
            <>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.broadcastFallbackText}>
                Démarrage de la caméra…
              </Text>
            </>
          ) : (
            <>
              <VideoOff size={44} color="rgba(255,255,255,0.35)" />
              <Text style={styles.broadcastFallbackText}>
                Caméra désactivée
              </Text>
            </>
          )}
        </View>
      )}

      <View pointerEvents="none" style={styles.broadcastTopShade} />
      <View pointerEvents="none" style={styles.broadcastBottomShade} />

      <View style={styles.broadcastHeader}>
        <View style={styles.broadcastHeaderLeft}>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.livePillText}>LIVE</Text>
          </View>

          <View style={styles.viewerPill}>
            <Eye size={11} color="#CBD5E1" />
            <Text style={styles.viewerPillText}>
              {displayedViewerCount.toLocaleString()}
            </Text>
          </View>

          {stream?.startedAt ? (
            <View style={styles.viewerPill}>
              <Clock size={11} color="#CBD5E1" />
              <Text style={styles.viewerPillText}>
                {formatDuration(stream.startedAt, undefined, now)}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.connectionPill}>
          <View
            style={[
              styles.connectionPillDot,
              { backgroundColor: connection.color },
            ]}
          />
          <Text style={styles.connectionPillText}>{connection.label}</Text>
        </View>
      </View>

      {stream?.title ? (
        <View pointerEvents="none" style={styles.broadcastTitleArea}>
          <Text style={styles.broadcastTitle} numberOfLines={2}>
            {stream.title}
          </Text>

          <View style={styles.watchStats}>
            <View style={styles.watchStat}>
              <Heart size={12} color={LIVE_RED} fill={LIVE_RED} />
              <Text style={styles.watchStatText}>
                {(stream.likeCount ?? 0).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      <View style={styles.broadcastControls}>
        <Pressable
          onPress={() => void toggleCamera()}
          disabled={pendingToggle !== null || ending}
          accessibilityRole="button"
          accessibilityLabel={
            isCameraEnabled ? "Désactiver la caméra" : "Activer la caméra"
          }
          style={[
            styles.broadcastControl,
            !isCameraEnabled && styles.broadcastControlOff,
          ]}
        >
          {isCameraEnabled ? (
            <Video size={22} color="#FFFFFF" />
          ) : (
            <VideoOff size={22} color="#FFFFFF" />
          )}
        </Pressable>

        <Pressable
          onPress={() => void toggleMicrophone()}
          disabled={pendingToggle !== null || ending}
          accessibilityRole="button"
          accessibilityLabel={
            isMicrophoneEnabled ? "Couper le micro" : "Activer le micro"
          }
          style={[
            styles.broadcastControl,
            !isMicrophoneEnabled && styles.broadcastControlOff,
          ]}
        >
          {isMicrophoneEnabled ? (
            <Mic size={22} color="#FFFFFF" />
          ) : (
            <MicOff size={22} color="#FFFFFF" />
          )}
        </Pressable>

        <Pressable
          onPress={onRequestEnd}
          disabled={ending}
          accessibilityRole="button"
          accessibilityLabel="Terminer le live"
          style={[styles.endLiveButton, ending && styles.disabledButton]}
        >
          <PhoneOff size={19} color="#FFFFFF" />
          <Text style={styles.endLiveButtonText}>
            {ending ? "Fin du live…" : "Terminer"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function LiveBroadcaster({
  streamId,
  prefs,
  onEnded,
}: {
  streamId: Id<"liveStreams">;
  prefs: BroadcastPrefs;
  onEnded: () => void;
}) {
  const { width, height } = useWindowDimensions();

  const getLiveKitToken = useAction(api.livekit.getLiveKitToken);

  const endStream = useMutation(api.liveStreams.endStream);

  const stream = useQuery(api.liveStreams.getStream, {
    streamId,
  }) as LiveStream | null | undefined;

  const [credentials, setCredentials] = useState<BroadcastCredentials | null>(
    null,
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [attempt, setAttempt] = useState(0);

  const [ending, setEnding] = useState(false);

  useEffect(() => {
    void AudioSession.startAudioSession();

    return () => {
      void AudioSession.stopAudioSession();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    setCredentials(null);
    setErrorMessage(null);

    const prepare = async () => {
      try {
        const granted = await ensureBroadcastPermissions();

        if (cancelled) {
          return;
        }

        if (!granted) {
          setErrorMessage(
            "Autorisez la caméra et le micro dans les réglages Android pour diffuser.",
          );
          return;
        }

        const result = (await getLiveKitToken({
          streamId,
        })) as LiveKitTokenResult;

        if (cancelled) {
          return;
        }

        const serverUrl = result.serverUrl ?? result.url;
        const token = result.token;

        if (!serverUrl || !token) {
          setErrorMessage(
            "Le serveur n'a pas renvoyé d'identifiants de diffusion valides.",
          );
          return;
        }

        setCredentials({ serverUrl, token });
      } catch {
        if (!cancelled) {
          setErrorMessage("Impossible d'obtenir l'accès à la diffusion.");
        }
      }
    };

    void prepare();

    return () => {
      cancelled = true;
    };
  }, [attempt, getLiveKitToken, streamId]);

  useEffect(() => {
    if (stream === null || (stream && stream.status !== "live")) {
      onEnded();
    }
  }, [onEnded, stream]);

  const handleRequestEnd = useCallback(async () => {
    if (ending) {
      return;
    }

    const confirmed = await confirmEndLive();

    if (!confirmed) {
      return;
    }

    setEnding(true);

    try {
      await endStream({ streamId });
      onEnded();
    } catch {
      Alert.alert(
        "Impossible de terminer",
        "La diffusion n'a pas pu être terminée.",
      );

      setEnding(false);
    }
  }, [ending, endStream, onEnded, streamId]);

  return (
    <Modal
      visible
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={() => void handleRequestEnd()}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <View style={[styles.broadcastRoot, { width, height }]}>
        {errorMessage ? (
          <View style={styles.loadingScreen}>
            <View style={styles.loadingIndicator}>
              <Radio size={26} color="#F87171" />
            </View>

            <Text style={styles.loadingTitle}>Diffusion impossible</Text>
            <Text style={styles.loadingText}>{errorMessage}</Text>

            <View style={styles.statusButtonRow}>
              <Pressable
                onPress={() => setAttempt((value) => value + 1)}
                accessibilityRole="button"
                accessibilityLabel="Réessayer"
                style={styles.primaryButton}
              >
                <Radio size={15} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Réessayer</Text>
              </Pressable>

              <Pressable
                onPress={() => void handleRequestEnd()}
                disabled={ending}
                accessibilityRole="button"
                accessibilityLabel="Terminer le live"
                style={[styles.dangerButton, ending && styles.disabledButton]}
              >
                <PhoneOff size={15} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Terminer le live</Text>
              </Pressable>
            </View>
          </View>
        ) : credentials ? (
          <LiveKitRoom
            serverUrl={credentials.serverUrl}
            token={credentials.token}
            connect={true}
            audio={prefs.micOn}
            video={prefs.camOn}
            onError={() => {
              setErrorMessage("La connexion à la diffusion a échoué.");
            }}
          >
            <BroadcasterInner
              stream={stream}
              ending={ending}
              onRequestEnd={() => void handleRequestEnd()}
            />
          </LiveKitRoom>
        ) : (
          <View style={styles.loadingScreen}>
            <ActivityIndicator size="large" color={LIVE_RED} />

            <Text style={styles.loadingTitle}>
              Préparation de la diffusion…
            </Text>
            <Text style={styles.loadingText}>
              Autorisations, puis connexion à LiveKit.
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

/* ============================================================================
 * MY LIVE BANNER
 * ========================================================================== */

function MyLiveBanner({
  streamId,
  onEnterOwn,
  onEnd,
}: {
  streamId: Id<"liveStreams">;
  onEnterOwn: () => void;
  onEnd: () => void;
}) {
  const stream = useQuery(api.liveStreams.getStream, {
    streamId,
  }) as LiveStream | null | undefined;

  const endStream = useMutation(api.liveStreams.endStream);

  const [ending, setEnding] = useState(false);

  const handleEnd = async () => {
    if (ending) {
      return;
    }

    const confirmed = await confirmEndLive();

    if (!confirmed) {
      return;
    }

    setEnding(true);

    try {
      await endStream({ streamId });
      onEnd();
    } catch {
      Alert.alert(
        "Impossible de terminer",
        "La diffusion n'a pas pu être terminée.",
      );
    } finally {
      setEnding(false);
    }
  };

  if (!stream || stream.status !== "live") {
    return null;
  }

  return (
    <View style={styles.myLiveBanner}>
      <View style={styles.myLiveDot} />

      <View style={styles.myLiveIdentity}>
        <Text style={styles.myLiveTitle} numberOfLines={1}>
          {stream.title}
        </Text>

        <Text style={styles.myLiveMeta}>
          {stream.viewerCount.toLocaleString()} spectateur
          {stream.viewerCount !== 1 ? "s" : ""} · EN DIRECT
        </Text>
      </View>

      <Pressable
        onPress={onEnterOwn}
        accessibilityRole="button"
        accessibilityLabel="Gérer mon live"
        style={styles.manageButton}
      >
        <Text style={styles.manageButtonText}>Gérer</Text>
      </Pressable>

      <Pressable
        onPress={() => void handleEnd()}
        disabled={ending}
        accessibilityRole="button"
        accessibilityLabel="Terminer mon live"
        style={styles.endButton}
      >
        <X size={13} color="#FCA5A5" />
        <Text style={styles.endButtonText}>{ending ? "…" : "Terminer"}</Text>
      </Pressable>
    </View>
  );
}

/* ============================================================================
 * STREAM CARD
 * ========================================================================== */

function StreamCard({
  stream,
  onWatch,
}: {
  stream: LiveStream;
  onWatch: () => void;
}) {
  const isReplay = stream.status === "ended";
  const canPlay = stream.status === "live" || Boolean(stream.replayUrl);

  return (
    <Pressable
      onPress={onWatch}
      disabled={!canPlay}
      accessibilityRole="button"
      accessibilityLabel={`${isReplay ? "Voir le replay" : "Rejoindre"} ${
        stream.title
      }`}
      style={({ pressed }) => [
        styles.streamCard,
        pressed && styles.pressed,
        !canPlay && styles.disabledButton,
      ]}
    >
      <View style={styles.streamThumbnailContainer}>
        {isHttpUrl(stream.thumbnailUrl) ? (
          <Image
            source={{ uri: stream.thumbnailUrl }}
            accessibilityLabel={stream.title}
            resizeMode="cover"
            style={styles.streamThumbnail}
          />
        ) : (
          <View style={styles.streamFallback}>
            <Radio size={34} color="rgba(255,255,255,0.18)" />
          </View>
        )}

        <View style={styles.streamShade} />

        <View
          style={[styles.streamLiveBadge, isReplay && styles.streamReplayBadge]}
        >
          {isReplay ? (
            <>
              <PlayCircle size={10} color="#FFFFFF" />
              <Text style={styles.streamLiveText}>REPLAY</Text>
            </>
          ) : (
            <>
              <View style={styles.liveDot} />
              <Text style={styles.streamLiveText}>LIVE</Text>
            </>
          )}
        </View>

        {!isReplay ? (
          <View style={styles.streamViewerBadge}>
            <Eye size={10} color="#FFFFFF" />
            <Text style={styles.streamViewerText}>
              {stream.viewerCount.toLocaleString()}
            </Text>
          </View>
        ) : null}

        {canPlay ? (
          <View pointerEvents="none" style={styles.joinWrap}>
            <View style={[styles.joinButton, isReplay && styles.replayButton]}>
              <Play size={13} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.joinButtonText}>
                {isReplay ? "Voir le replay" : "Rejoindre"}
              </Text>
            </View>
          </View>
        ) : (
          <View pointerEvents="none" style={styles.joinWrap}>
            <View style={[styles.joinButton, styles.joinButtonDisabled]}>
              <Text style={styles.joinButtonText}>Replay indisponible</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.streamCardBody}>
        <Avatar
          uri={stream.hostAvatar}
          name={stream.hostName}
          size={40}
          borderColor={isReplay ? PRIMARY : LIVE_RED}
        />

        <View style={styles.streamCardIdentity}>
          <Text style={styles.streamCardTitle} numberOfLines={2}>
            {stream.title}
          </Text>

          <View style={styles.streamMeta}>
            <Text style={styles.streamHost} numberOfLines={1}>
              {stream.hostName}
            </Text>

            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{stream.category}</Text>
            </View>
          </View>
        </View>

        <View style={styles.likesColumn}>
          <Heart size={12} color="#F472B6" fill="#F472B6" />
          <Text style={styles.likesText}>
            {stream.likeCount.toLocaleString()}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

/* ============================================================================
 * EMPTY STATE
 * ========================================================================== */

function EmptyLiveState({
  authenticated,
  onStart,
}: {
  authenticated: boolean;
  onStart: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Radio size={31} color="#F87171" />
      </View>

      <Text style={styles.emptyTitle}>Aucun live en cours</Text>

      <Text style={styles.emptyDescription}>
        Il n'y a actuellement aucune diffusion correspondant à cette sélection.
      </Text>

      {authenticated ? (
        <Pressable
          onPress={onStart}
          accessibilityRole="button"
          accessibilityLabel="Démarrer un Live"
          style={styles.emptyButton}
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.emptyButtonText}>Démarrer un Live</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/* ============================================================================
 * MAIN PAGE
 * ========================================================================== */

export default function LiveStreamingPage({ onBack }: LiveStreamingPageProps) {
  const [activeCategory, setActiveCategory] = useState("Tout");

  const [watchingId, setWatchingId] = useState<Id<"liveStreams"> | null>(null);

  const [broadcast, setBroadcast] = useState<BroadcastState | null>(null);

  const [showGoLive, setShowGoLive] = useState(false);

  const { isAuthenticated } = useConvexAuth();

  /**
   * ⚠️ La requête utilise `status: "all"` : le backend `listLiveStreams`
   * doit accepter cette valeur et retourner :
   *   - les streams `live`
   *   - les streams `ended` avec `replayUrl` non null (limités, triés desc)
   */
  const liveStreams = useQuery(api.liveStreams.listLiveStreams, {
    status: "all" as const,
  }) as LiveStream[] | undefined;

  const myActiveStream = useQuery(
    api.liveStreams.getMyActiveStream,
    isAuthenticated ? {} : "skip",
  ) as LiveStream | null | undefined;

  const filtered = useMemo(() => {
    if (!liveStreams) {
      return [];
    }

    if (activeCategory === "Tout") {
      return liveStreams;
    }

    return liveStreams.filter((stream) => stream.category === activeCategory);
  }, [activeCategory, liveStreams]);

  const totalViewers = useMemo(
    () =>
      liveStreams?.reduce((total, stream) => total + stream.viewerCount, 0) ??
      0,
    [liveStreams],
  );

  if (broadcast) {
    return (
      <LiveBroadcaster
        streamId={broadcast.streamId}
        prefs={broadcast.prefs}
        onEnded={() => setBroadcast(null)}
      />
    );
  }

  if (watchingId) {
    return (
      <WatchView streamId={watchingId} onClose={() => setWatchingId(null)} />
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.pageHeader}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          style={styles.headerBackButton}
        >
          <ArrowLeft size={19} color="#FFFFFF" />
        </Pressable>

        <View style={styles.pageHeaderIdentity}>
          <View style={styles.pageTitleRow}>
            <Radio size={17} color={LIVE_RED} />
            <Text style={styles.pageTitle}>Live Streaming</Text>
          </View>

          <Text style={styles.pageSubtitle}>
            {liveStreams === undefined
              ? "Chargement des diffusions…"
              : `${liveStreams.length} diffusion${liveStreams.length !== 1 ? "s" : ""}`}
          </Text>
        </View>

        {isAuthenticated ? (
          <Pressable
            onPress={() => setShowGoLive(true)}
            accessibilityRole="button"
            accessibilityLabel="Lancer un Live"
            style={styles.headerGoLive}
          >
            <Radio size={13} color="#FFFFFF" />
            <Text style={styles.headerGoLiveText}>Go Live</Text>
          </Pressable>
        ) : (
          <View style={styles.connectionBadge}>
            <Text style={styles.connectionBadgeText}>Visiteur</Text>
          </View>
        )}
      </View>

      {myActiveStream ? (
        <MyLiveBanner
          streamId={myActiveStream._id}
          onEnterOwn={() =>
            setBroadcast({
              streamId: myActiveStream._id,
              prefs: DEFAULT_BROADCAST_PREFS,
            })
          }
          onEnd={() => undefined}
        />
      ) : null}

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <View
            style={[
              styles.metricIcon,
              { backgroundColor: "rgba(99,102,241,0.10)" },
            ]}
          >
            <Users size={16} color="#818CF8" />
          </View>

          <Text style={styles.metricValue}>
            {liveStreams === undefined ? "—" : totalViewers.toLocaleString()}
          </Text>
          <Text style={styles.metricLabel}>Spectateurs</Text>
        </View>

        <View style={styles.metricCard}>
          <View
            style={[
              styles.metricIcon,
              { backgroundColor: "rgba(239,68,68,0.10)" },
            ]}
          >
            <Radio size={16} color="#F87171" />
          </View>

          <Text style={styles.metricValue}>
            {liveStreams === undefined ? "—" : liveStreams.length}
          </Text>
          <Text style={styles.metricLabel}>Diffusions</Text>
        </View>

        <View style={styles.metricCard}>
          <View
            style={[
              styles.metricIcon,
              { backgroundColor: "rgba(16,185,129,0.10)" },
            ]}
          >
            <TrendingUp size={16} color="#34D399" />
          </View>

          <Text style={styles.metricValue}>
            {liveStreams === undefined ? "—" : filtered.length}
          </Text>
          <Text style={styles.metricLabel}>Sélection</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
      >
        {CATEGORIES.map((category) => {
          const active = category === activeCategory;

          return (
            <Pressable
              key={category}
              onPress={() => setActiveCategory(category)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[
                styles.categoryChip,
                active && styles.categoryChipSelected,
              ]}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  active && styles.categoryChipTextSelected,
                ]}
              >
                {category}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.mainContent}
        showsVerticalScrollIndicator={false}
      >
        {liveStreams === undefined ? (
          <View style={styles.skeletonList}>
            {[0, 1, 2].map((item) => (
              <View key={item} style={styles.streamSkeleton}>
                <View style={styles.skeletonImage} />
                <View style={styles.skeletonBody} />
              </View>
            ))}
          </View>
        ) : filtered.length === 0 ? (
          <EmptyLiveState
            authenticated={isAuthenticated}
            onStart={() => setShowGoLive(true)}
          />
        ) : (
          <View style={styles.streamList}>
            {filtered.map((stream) => (
              <StreamCard
                key={stream._id}
                stream={stream}
                onWatch={() => setWatchingId(stream._id)}
              />
            ))}
          </View>
        )}

        {isAuthenticated && !myActiveStream ? (
          <View style={styles.creatorCard}>
            <View style={styles.creatorIcon}>
              <Radio size={26} color="#F87171" />
            </View>

            <Text style={styles.creatorTitle}>Votre prochaine diffusion</Text>

            <Text style={styles.creatorText}>
              Créez une diffusion et rejoignez votre audience en temps réel.
            </Text>

            <Pressable
              onPress={() => setShowGoLive(true)}
              accessibilityRole="button"
              accessibilityLabel="Créer une diffusion"
              style={styles.creatorButton}
            >
              <Radio size={15} color="#FFFFFF" />
              <Text style={styles.creatorButtonText}>Démarrer un Live</Text>
              <ChevronRight size={15} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : null}

        <View style={styles.integrityCard}>
          <View style={styles.integrityIcon}>
            <Zap size={16} color="#A5B4FC" />
          </View>

          <View style={styles.integrityBody}>
            <Text style={styles.integrityTitle}>Données en temps réel</Text>
            <Text style={styles.integrityText}>
              Les diffusions et compteurs présentés ici proviennent des données
              disponibles du backend. Aucun live, compteur ou pourcentage
              artificiel n'est ajouté pour remplir l'écran.
            </Text>
          </View>
        </View>
      </ScrollView>

      {showGoLive ? (
        <GoLiveForm
          onClose={() => setShowGoLive(false)}
          onStarted={(id, prefs) => {
            setShowGoLive(false);
            setBroadcast({ streamId: id, prefs });
          }}
        />
      ) : null}
    </View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  pageHeader: {
    minHeight: 77,
    paddingHorizontal: 15,
    paddingTop: 9,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "rgba(2,6,23,0.96)",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  headerBackButton: {
    width: 41,
    height: 41,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  pageHeaderIdentity: {
    flex: 1,
    minWidth: 0,
  },

  pageTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  pageTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  pageSubtitle: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 8.5,
    fontWeight: "600",
  },

  headerGoLive: {
    minHeight: 39,
    paddingHorizontal: 12,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: LIVE_RED,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  headerGoLiveText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },

  connectionBadge: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  connectionBadgeText: {
    color: "#64748B",
    fontSize: 7.5,
    fontWeight: "800",
  },

  myLiveBanner: {
    marginHorizontal: 14,
    marginTop: 11,
    padding: 11,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(239,68,68,0.09)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
  },

  myLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: LIVE_RED,
  },

  myLiveIdentity: {
    flex: 1,
    minWidth: 0,
  },

  myLiveTitle: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "800",
  },

  myLiveMeta: {
    marginTop: 3,
    color: "#F87171",
    fontSize: 7.5,
    fontWeight: "700",
  },

  manageButton: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "rgba(99,102,241,0.18)",
  },

  manageButtonText: {
    color: "#A5B4FC",
    fontSize: 7.5,
    fontWeight: "800",
  },

  endButton: {
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(239,68,68,0.14)",
  },

  endButtonText: {
    color: "#FCA5A5",
    fontSize: 7.5,
    fontWeight: "800",
  },

  metricsRow: {
    paddingHorizontal: 14,
    paddingTop: 12,
    flexDirection: "row",
    gap: 7,
  },

  metricCard: {
    flex: 1,
    minHeight: 78,
    padding: 10,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: BORDER,
  },

  metricIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  metricValue: {
    marginTop: 5,
    color: "#F8FAFC",
    fontSize: 12,
    fontWeight: "900",
  },

  metricLabel: {
    marginTop: 2,
    color: "#475569",
    fontSize: 7,
    fontWeight: "700",
  },

  categories: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 7,
  },

  categoryChip: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.055)",
  },

  categoryChipSelected: {
    backgroundColor: "rgba(99,102,241,0.18)",
    borderColor: "rgba(129,140,248,0.35)",
  },

  categoryChipText: {
    color: "#64748B",
    fontSize: 8,
    fontWeight: "700",
  },

  categoryChipTextSelected: {
    color: "#C7D2FE",
  },

  mainScroll: {
    flex: 1,
  },

  mainContent: {
    width: "100%",
    maxWidth: 780,
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingBottom: 34,
  },

  streamList: {
    gap: 11,
  },

  streamCard: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: BORDER,
  },

  streamThumbnailContainer: {
    height: 205,
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#101625",
  },

  streamThumbnail: {
    width: "100%",
    height: "100%",
  },

  streamFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0D1422",
  },

  streamShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.28)",
  },

  streamLiveBadge: {
    position: "absolute",
    top: 11,
    left: 11,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(220,38,38,0.94)",
  },

  streamReplayBadge: {
    backgroundColor: "rgba(99,102,241,0.94)",
  },

  streamLiveText: {
    color: "#FFFFFF",
    fontSize: 7.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  streamViewerBadge: {
    position: "absolute",
    top: 11,
    right: 11,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.58)",
  },

  streamViewerText: {
    color: "#FFFFFF",
    fontSize: 7.5,
    fontWeight: "800",
  },

  joinWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 13,
    alignItems: "center",
  },

  joinButton: {
    minHeight: 36,
    paddingHorizontal: 15,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(79,70,229,0.94)",
  },

  joinButtonDisabled: {
    backgroundColor: "rgba(71,85,105,0.85)",
  },

  replayButton: {
    backgroundColor: "rgba(99,102,241,0.94)",
  },

  joinButtonText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },

  streamCardBody: {
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  streamCardIdentity: {
    flex: 1,
    minWidth: 0,
  },

  streamCardTitle: {
    color: "#F8FAFC",
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "800",
  },

  streamMeta: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  streamHost: {
    maxWidth: "55%",
    color: "#64748B",
    fontSize: 8,
    fontWeight: "700",
  },

  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(99,102,241,0.12)",
  },

  categoryBadgeText: {
    color: "#A5B4FC",
    fontSize: 6.5,
    fontWeight: "800",
  },

  likesColumn: {
    minWidth: 38,
    alignItems: "center",
    gap: 3,
  },

  likesText: {
    color: "#94A3B8",
    fontSize: 7.5,
    fontWeight: "700",
  },

  creatorCard: {
    marginTop: 15,
    padding: 17,
    borderRadius: 20,
    alignItems: "center",
    backgroundColor: "rgba(239,68,68,0.055)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.18)",
  },

  creatorIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.10)",
  },

  creatorTitle: {
    marginTop: 10,
    color: "#F8FAFC",
    fontSize: 12.5,
    fontWeight: "900",
  },

  creatorText: {
    maxWidth: 330,
    marginTop: 5,
    color: "#64748B",
    fontSize: 8.5,
    lineHeight: 14,
    textAlign: "center",
  },

  creatorButton: {
    marginTop: 12,
    minHeight: 40,
    paddingHorizontal: 15,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: LIVE_RED,
  },

  creatorButtonText: {
    color: "#FFFFFF",
    fontSize: 8.5,
    fontWeight: "900",
  },

  integrityCard: {
    marginTop: 14,
    padding: 13,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "rgba(99,102,241,0.045)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.13)",
  },

  integrityIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.10)",
  },

  integrityBody: {
    flex: 1,
  },

  integrityTitle: {
    color: "#CBD5E1",
    fontSize: 9,
    fontWeight: "800",
  },

  integrityText: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 8,
    lineHeight: 13,
  },

  emptyState: {
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  emptyIcon: {
    width: 65,
    height: 65,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.15)",
  },

  emptyTitle: {
    marginTop: 13,
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "800",
  },

  emptyDescription: {
    maxWidth: 310,
    marginTop: 5,
    color: "#475569",
    fontSize: 8.5,
    lineHeight: 14,
    textAlign: "center",
  },

  emptyButton: {
    marginTop: 13,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: LIVE_RED,
  },

  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
  },

  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
    backgroundColor: "#000000",
  },

  loadingIndicator: {
    width: 64,
    height: 64,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.08)",
  },

  loadingTitle: {
    marginTop: 14,
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "800",
  },

  loadingText: {
    marginTop: 5,
    color: "#475569",
    fontSize: 8.5,
    textAlign: "center",
  },

  primaryButton: {
    marginTop: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: PRIMARY,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 8.5,
    fontWeight: "900",
  },

  skeletonList: {
    gap: 11,
  },

  streamSkeleton: {
    height: 275,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  skeletonImage: {
    height: 205,
    backgroundColor: "rgba(255,255,255,0.025)",
  },

  skeletonBody: {
    flex: 1,
    margin: 12,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.025)",
  },

  watchScreen: {
    backgroundColor: "#000000",
  },

  watchVisual: {
    flex: 1,
    minHeight: 300,
    position: "relative",
    backgroundColor: "#080C15",
  },

  watchImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },

  watchFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },

  watchShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  reactionLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    zIndex: 8,
  },

  floatingEmoji: {
    position: "absolute",
    bottom: 80,
  },

  floatingEmojiText: {
    fontSize: 31,
  },

  /**
   * Grille cohosts — miniatures empilées verticalement en haut à droite.
   * Le host reste affiché en plein écran derrière cette colonne.
   */
  cohostGrid: {
    position: "absolute",
    top: TOP_INSET + 60,
    right: 10,
    gap: 6,
    zIndex: 5,
  },

  cohostTile: {
    width: 92,
    height: 122,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "#0D1422",
  },

  cohostTileVideo: {
    width: "100%",
    height: "100%",
  },

  watchHeader: {
    position: "absolute",
    top: TOP_INSET + 8,
    left: 13,
    right: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 10,
  },

  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.52)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  hostIdentity: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  hostIdentityText: {
    flex: 1,
    minWidth: 0,
  },

  hostName: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontWeight: "800",
  },

  hostCategory: {
    marginTop: 3,
    color: "rgba(255,255,255,0.58)",
    fontSize: 7.5,
    fontWeight: "600",
  },

  watchHeaderRight: {
    alignItems: "flex-end",
    gap: 5,
  },

  livePill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(220,38,38,0.94)",
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },

  livePillText: {
    color: "#FFFFFF",
    fontSize: 7,
    fontWeight: "900",
  },

  viewerPill: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.58)",
  },

  viewerPillText: {
    color: "#FFFFFF",
    fontSize: 7.5,
    fontWeight: "700",
  },

  watchTitleArea: {
    position: "absolute",
    left: 14,
    right: 80,
    bottom: 14,
    zIndex: 7,
  },

  watchTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
  },

  watchStats: {
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  watchStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  watchStatText: {
    color: "rgba(255,255,255,0.70)",
    fontSize: 8,
    fontWeight: "700",
  },

  actionRail: {
    position: "absolute",
    right: 11,
    bottom: 22,
    zIndex: 12,
    alignItems: "center",
    gap: 13,
  },

  actionItem: {
    alignItems: "center",
    gap: 4,
  },

  actionCircle: {
    width: 46,
    height: 46,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.48)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  actionCircleLiked: {
    backgroundColor: "rgba(239,68,68,0.18)",
    borderColor: "rgba(239,68,68,0.35)",
  },

  actionLabel: {
    color: "#FFFFFF",
    fontSize: 7.5,
    fontWeight: "700",
  },

  chatPanel: {
    height: 255,
    maxHeight: 300,
    backgroundColor: "#050711",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },

  chatHeader: {
    height: 39,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },

  chatHeaderTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  chatHeaderText: {
    color: "#CBD5E1",
    fontSize: 8.5,
    fontWeight: "800",
  },

  chatHeaderHint: {
    color: "#475569",
    fontSize: 7,
    fontWeight: "700",
  },

  chatHeaderMod: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(239,68,68,0.12)",
  },

  chatHeaderModText: {
    color: "#F87171",
    fontSize: 8,
    fontWeight: "900",
  },

  chatScroll: {
    flex: 1,
  },

  chatContent: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    gap: 5,
  },

  chatRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },

  chatBody: {
    flex: 1,
    minWidth: 0,
  },

  chatAuthor: {
    color: "#A5B4FC",
    fontSize: 7.5,
    fontWeight: "800",
  },

  chatText: {
    marginTop: 1,
    color: "rgba(255,255,255,0.82)",
    fontSize: 8.5,
    lineHeight: 13,
  },

  systemMessage: {
    alignItems: "center",
    paddingVertical: 2,
  },

  systemMessageText: {
    color: "rgba(255,255,255,0.38)",
    fontSize: 7.5,
    fontStyle: "italic",
  },

  superChat: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(139,92,246,0.10)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.28)",
  },

  superChatEmoji: {
    fontSize: 18,
  },

  superChatBody: {
    flex: 1,
    minWidth: 0,
  },

  superChatAuthor: {
    color: "#C4B5FD",
    fontSize: 7.5,
    fontWeight: "800",
  },

  superChatText: {
    marginTop: 2,
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "600",
  },

  superChatAmount: {
    color: "#FBBF24",
    fontSize: 8,
    fontWeight: "900",
  },

  composer: {
    minHeight: 52,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },

  chatInput: {
    flex: 1,
    minHeight: 38,
    maxHeight: 72,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    color: "#FFFFFF",
    fontSize: 9.5,
    backgroundColor: "rgba(255,255,255,0.075)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  sendButton: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY,
  },

  loginPrompt: {
    flex: 1,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  loginPromptText: {
    color: "#64748B",
    fontSize: 8,
    fontWeight: "700",
  },

  modalBackdrop: {
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.76)",
  },

  modalDismissArea: {
    flex: 1,
  },

  moderationSheet: {
    paddingHorizontal: 17,
    paddingTop: 15,
    paddingBottom: 25,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    backgroundColor: "#0A0E1B",
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    gap: 8,
  },

  modAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  modActionDanger: {
    backgroundColor: "rgba(239,68,68,0.12)",
  },

  modActionText: {
    color: "#CBD5E1",
    fontSize: 10,
    fontWeight: "800",
  },

  modSeparator: {
    height: 1,
    marginVertical: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  banRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },

  banName: {
    color: "#F8FAFC",
    fontSize: 10,
    fontWeight: "800",
  },

  banMeta: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 7.5,
  },

  unbanButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "rgba(239,68,68,0.14)",
  },

  unbanButtonText: {
    color: "#FCA5A5",
    fontSize: 8,
    fontWeight: "900",
  },

  cohostInviteBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginHorizontal: 10,
    marginBottom: 6,
    borderRadius: 13,
    backgroundColor: "rgba(99,102,241,0.14)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.28)",
  },

  cohostInviteText: {
    flex: 1,
    color: "#C7D2FE",
    fontSize: 8.5,
    fontWeight: "700",
  },

  cohostAccept: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: PRIMARY,
  },

  cohostAcceptText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
  },

  cohostDecline: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  cohostDeclineText: {
    color: "#94A3B8",
    fontSize: 8,
    fontWeight: "800",
  },

  cohostOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "flex-start",
    justifyContent: "flex-start",
    paddingTop: TOP_INSET + 60,
    paddingLeft: 14,
    zIndex: 20,
  },

  cohostOverlayBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(220,38,38,0.94)",
  },

  cohostOverlayText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  giftSheet: {
    paddingHorizontal: 17,
    paddingTop: 15,
    paddingBottom: 25,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    backgroundColor: "#0A0E1B",
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  goLiveSheet: {
    paddingHorizontal: 17,
    paddingTop: 15,
    paddingBottom: 24,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    backgroundColor: "#0A0E1B",
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sheetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  sheetTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  sheetClose: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  sheetDescription: {
    marginTop: 5,
    color: "#64748B",
    fontSize: 8.5,
    lineHeight: 14,
  },

  giftGrid: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  giftCard: {
    width: "18.8%",
    minHeight: 91,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  giftEmoji: {
    fontSize: 23,
  },

  giftName: {
    marginTop: 5,
    color: "#CBD5E1",
    fontSize: 7,
    fontWeight: "800",
  },

  giftPrice: {
    marginTop: 3,
    fontSize: 7.5,
    fontWeight: "900",
  },

  giftDisclaimer: {
    marginTop: 12,
    color: "#475569",
    fontSize: 7.5,
    lineHeight: 12,
    textAlign: "center",
  },

  broadcastStatus: {
    marginTop: 14,
    padding: 12,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "rgba(99,102,241,0.07)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.17)",
  },

  broadcastIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.18)",
  },

  broadcastStatusBody: {
    flex: 1,
  },

  broadcastStatusTitle: {
    color: "#CBD5E1",
    fontSize: 9,
    fontWeight: "800",
  },

  broadcastStatusText: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 7.5,
    lineHeight: 12,
  },

  fieldLabel: {
    marginTop: 14,
    marginBottom: 6,
    color: "#94A3B8",
    fontSize: 8,
    fontWeight: "800",
  },

  titleInput: {
    minHeight: 45,
    paddingHorizontal: 12,
    borderRadius: 13,
    color: "#FFFFFF",
    fontSize: 10,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  characterCount: {
    marginTop: 3,
    color: "#334155",
    fontSize: 7,
    textAlign: "right",
  },

  categoryScroll: {
    gap: 6,
    paddingBottom: 2,
  },

  categoryChipActive: {
    backgroundColor: "rgba(99,102,241,0.18)",
    borderColor: "rgba(129,140,248,0.32)",
  },

  categoryChipTextActive: {
    color: "#C7D2FE",
  },

  controlPanel: {
    marginTop: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  controlRow: {
    minHeight: 55,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  controlIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  controlTitle: {
    color: "#CBD5E1",
    fontSize: 8.5,
    fontWeight: "800",
  },

  controlSubtitle: {
    marginTop: 2,
    color: "#475569",
    fontSize: 7,
    fontWeight: "600",
  },

  controlDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  switch: {
    width: 42,
    height: 24,
    padding: 3,
    borderRadius: 999,
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.09)",
  },

  switchActive: {
    backgroundColor: "rgba(99,102,241,0.75)",
  },

  switchKnob: {
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: "#64748B",
  },

  switchKnobActive: {
    alignSelf: "flex-end",
    backgroundColor: "#FFFFFF",
  },

  goLiveButton: {
    marginTop: 14,
    minHeight: 49,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: LIVE_RED,
  },

  goLiveButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },

  goLiveDisclaimer: {
    marginTop: 7,
    color: "#334155",
    fontSize: 7,
    lineHeight: 11,
    textAlign: "center",
  },

  broadcastRoot: {
    backgroundColor: "#000000",
  },

  broadcastStage: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
  },

  broadcastFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#080C15",
  },

  broadcastFallbackText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontWeight: "700",
  },

  broadcastTopShade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 170,
    backgroundColor: "rgba(0,0,0,0.30)",
  },

  broadcastBottomShade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 230,
    backgroundColor: "rgba(0,0,0,0.38)",
  },

  broadcastHeader: {
    position: "absolute",
    top: TOP_INSET + 8,
    left: 13,
    right: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    zIndex: 10,
  },

  broadcastHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  connectionPill: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.58)",
  },

  connectionPillDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },

  connectionPillText: {
    color: "#FFFFFF",
    fontSize: 8.5,
    fontWeight: "800",
  },

  broadcastTitleArea: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 128,
    zIndex: 7,
  },

  broadcastTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
  },

  broadcastControls: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    zIndex: 12,
  },

  broadcastControl: {
    width: 58,
    height: 58,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },

  broadcastControlOff: {
    backgroundColor: "rgba(239,68,68,0.32)",
    borderColor: "rgba(239,68,68,0.55)",
  },

  endLiveButton: {
    height: 58,
    paddingHorizontal: 22,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: LIVE_RED,
  },

  endLiveButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  statusButtonRow: {
    marginTop: 4,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },

  dangerButton: {
    marginTop: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: LIVE_RED,
  },

  avatar: {
    backgroundColor: "#111827",
  },

  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5B21B6",
    borderWidth: 1,
  },

  disabledButton: {
    opacity: 0.38,
  },

  pressed: {
    opacity: 0.72,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },
});
