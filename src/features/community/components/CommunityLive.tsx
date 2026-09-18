import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useCallback, useMemo, useState } from "react";
import {
  Heart,
  MessageCircle,
  Mic,
  MicOff,
  Send,
  Users,
  Video,
  VideoOff,
  X,
} from "lucide-react-native";

export interface LiveStream {
  id: string;
  hostName: string;
  hostAvatar?: string;
  title: string;
  viewerCount: number;
  likeCount: number;
  isLive: boolean;
  streamUrl?: string;
  thumbnail?: string;
  startedAt: number;
}

export interface CommunityLiveMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: number;
  isMine: boolean;
  likes: number;
}

interface Props {
  streams: LiveStream[];
  onJoin?: (streamId: string) => void;
  onLeave?: () => void;
  messages?: CommunityLiveMessage[];
  onSendMessage?: (message: string, streamId: string) => void;
  onLikeMessage?: (messageId: string, streamId: string) => void;
  onLikeStream?: (streamId: string) => void;
  onOpenChat?: () => void;
}

function LiveCard({
  stream,
  onPress,
}: {
  stream: LiveStream;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Rejoindre le live ${stream.title}`}
      style={({ pressed }) => [styles.streamCard, pressed && styles.pressed]}
    >
      {stream.thumbnail ? (
        <Image
          source={{ uri: stream.thumbnail }}
          style={styles.streamThumbnail}
          resizeMode="cover"
          accessibilityLabel={stream.title}
        />
      ) : (
        <View style={styles.streamThumbnailFallback}>
          <View style={styles.streamLiveIcon}>
            <View style={styles.streamLiveDot} />
          </View>
        </View>
      )}

      <View style={styles.streamOverlay} />

      <View style={styles.liveBadge}>
        <View style={styles.liveBadgeDot} />
        <Text style={styles.liveBadgeText}>LIVE</Text>
      </View>

      <View style={styles.streamBottom}>
        <Text style={styles.streamTitle} numberOfLines={2}>
          {stream.title}
        </Text>

        <View style={styles.streamMeta}>
          <Users />

          <Text style={styles.streamMetaText}>{stream.viewerCount}</Text>

          <Text style={styles.streamSeparator}>·</Text>

          <Text style={styles.streamMetaText} numberOfLines={1}>
            {stream.hostName}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function LiveStage({ stream }: { stream: LiveStream }) {
  if (stream.thumbnail) {
    return (
      <View style={styles.videoArea}>
        <Image
          source={{ uri: stream.thumbnail }}
          style={styles.videoImage}
          resizeMode="contain"
          accessibilityLabel={stream.title}
        />

        <View style={styles.videoOverlay} />

        <View style={styles.videoUnavailable}>
          <View style={styles.liveFallbackIcon}>
            <View style={styles.liveFallbackDot} />
          </View>

          <Text style={styles.videoFallbackText}>{stream.title}</Text>

          <Text style={styles.videoFallbackSubtext}>
            Direct vidéo en attente du lecteur natif
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.videoArea}>
      <View style={styles.videoFallback}>
        <View style={styles.liveFallbackIcon}>
          <View style={styles.liveFallbackDot} />
        </View>

        <Text style={styles.videoFallbackText}>{stream.title}</Text>

        <Text style={styles.videoFallbackSubtext}>
          Aucun aperçu vidéo disponible
        </Text>
      </View>
    </View>
  );
}

export function CommunityLive({
  streams,
  onJoin,
  onLeave,
  messages = [],
  onSendMessage,
  onLikeMessage: _onLikeMessage,
  onLikeStream,
  onOpenChat,
}: Props) {
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);

  const [isViewer, setIsViewer] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [viewerCount, setViewerCount] = useState(0);

  const liveStreams = useMemo(
    () => streams.filter((stream) => stream.isLive),
    [streams],
  );

  const selectedMessages = useMemo(() => {
    if (!selectedStream) {
      return [];
    }

    return messages.slice(-20);
  }, [messages, selectedStream]);

  const handleJoinStream = useCallback(
    (stream: LiveStream) => {
      setSelectedStream(stream);
      setIsViewer(true);
      setViewerCount(stream.viewerCount);
      setNewMessage("");
      onJoin?.(stream.id);
    },
    [onJoin],
  );

  const handleLeaveStream = useCallback(() => {
    setIsViewer(false);
    setSelectedStream(null);
    setNewMessage("");
    setIsMuted(true);
    setIsVideoOff(false);
    onLeave?.();
  }, [onLeave]);

  const handleSendMessage = useCallback(() => {
    const value = newMessage.trim();

    if (!value || !selectedStream || !onSendMessage) {
      return;
    }

    onSendMessage(value, selectedStream.id);

    setNewMessage("");
  }, [newMessage, onSendMessage, selectedStream]);

  const handleLikeStream = useCallback(() => {
    if (!selectedStream || !onLikeStream) {
      return;
    }

    onLikeStream(selectedStream.id);
  }, [onLikeStream, selectedStream]);

  if (liveStreams.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <View style={styles.emptyIconDot} />
        </View>

        <Text style={styles.emptyTitle}>Aucun live en cours</Text>

        <Text style={styles.emptySubtitle}>
          Les prochains directs apparaîtront ici.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Live en cours</Text>

      <View style={styles.streamList}>
        {liveStreams.slice(0, 4).map((stream) => (
          <LiveCard
            key={stream.id}
            stream={stream}
            onPress={() => handleJoinStream(stream)}
          />
        ))}
      </View>

      {isViewer && selectedStream ? (
        <View style={styles.viewer}>
          <LiveStage stream={selectedStream} />

          <View pointerEvents="box-none" style={styles.viewerOverlay}>
            <View style={styles.viewerTopBar}>
              <View style={styles.viewerInfo}>
                <View style={styles.viewerLiveBadge}>
                  <View style={styles.viewerLiveDot} />

                  <Text style={styles.viewerLiveText}>LIVE</Text>
                </View>

                {selectedStream.hostAvatar ? (
                  <Image
                    source={{
                      uri: selectedStream.hostAvatar,
                    }}
                    style={styles.hostAvatar}
                    accessibilityLabel={`Photo de ${selectedStream.hostName}`}
                  />
                ) : null}

                <Text style={styles.hostName} numberOfLines={1}>
                  {selectedStream.hostName}
                </Text>

                <View style={styles.viewerCount}>
                  <Users />

                  <Text style={styles.viewerCountText}>{viewerCount}</Text>
                </View>
              </View>

              <Pressable
                onPress={handleLeaveStream}
                accessibilityRole="button"
                accessibilityLabel="Quitter le live"
                hitSlop={8}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.pressed,
                ]}
              >
                <X />
              </Pressable>
            </View>

            <View style={styles.viewerRightActions}>
              <Pressable
                onPress={handleLikeStream}
                disabled={!onLikeStream}
                accessibilityRole="button"
                accessibilityLabel="Aimer le live"
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && onLikeStream && styles.pressed,
                ]}
              >
                <Heart />

                <Text style={styles.actionCount}>
                  {selectedStream.likeCount}
                </Text>
              </Pressable>

              <Pressable
                onPress={onOpenChat}
                disabled={!onOpenChat}
                accessibilityRole="button"
                accessibilityLabel="Ouvrir le chat"
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && onOpenChat && styles.pressed,
                ]}
              >
                <MessageCircle />
              </Pressable>
            </View>

            {selectedMessages.length > 0 ? (
              <View style={styles.chatPreview}>
                {selectedMessages.slice(-5).map((message) => (
                  <View key={message.id} style={styles.chatMessage}>
                    <Text style={styles.chatUser} numberOfLines={1}>
                      {message.userName}
                    </Text>

                    <Text style={styles.chatText} numberOfLines={2}>
                      {message.message}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.bottomBar}>
              <Pressable
                onPress={() => setIsMuted((value) => !value)}
                accessibilityRole="button"
                accessibilityLabel={
                  isMuted ? "Activer le microphone" : "Désactiver le microphone"
                }
                style={({ pressed }) => [
                  styles.controlButton,
                  pressed && styles.pressed,
                ]}
              >
                {isMuted ? <MicOff /> : <Mic />}
              </Pressable>

              <Pressable
                onPress={() => setIsVideoOff((value) => !value)}
                accessibilityRole="button"
                accessibilityLabel={
                  isVideoOff ? "Activer la caméra" : "Désactiver la caméra"
                }
                style={({ pressed }) => [
                  styles.controlButton,
                  pressed && styles.pressed,
                ]}
              >
                {isVideoOff ? <VideoOff /> : <Video />}
              </Pressable>

              <View style={styles.messageComposer}>
                <TextInput
                  value={newMessage}
                  onChangeText={setNewMessage}
                  placeholder="Message..."
                  placeholderTextColor="rgba(255,255,255,0.32)"
                  multiline
                  maxLength={1000}
                  returnKeyType="send"
                  blurOnSubmit={false}
                  onSubmitEditing={handleSendMessage}
                  editable={Boolean(onSendMessage)}
                  style={styles.messageInput}
                  accessibilityLabel="Message du live"
                />

                <Pressable
                  onPress={handleSendMessage}
                  disabled={!newMessage.trim() || !onSendMessage}
                  accessibilityRole="button"
                  accessibilityLabel="Envoyer le message"
                  style={({ pressed }) => [
                    styles.sendButton,
                    (!newMessage.trim() || !onSendMessage) &&
                      styles.sendButtonDisabled,
                    pressed &&
                      newMessage.trim() &&
                      onSendMessage &&
                      styles.pressed,
                  ]}
                >
                  <Send />
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 12,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.58)",
  },

  streamList: {
    width: "100%",
    gap: 10,
  },

  streamCard: {
    width: "100%",
    height: 190,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#08090F",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  streamThumbnail: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  streamThumbnailFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(127,29,29,0.22)",
  },

  streamLiveIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.16)",
  },

  streamLiveDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#EF4444",
  },

  streamOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.30)",
  },

  liveBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(239,68,68,0.82)",
  },

  liveBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },

  liveBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },

  streamBottom: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
  },

  streamTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  streamMeta: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  streamMetaText: {
    flexShrink: 1,
    fontSize: 10,
    color: "rgba(255,255,255,0.60)",
    fontWeight: "600",
  },

  streamSeparator: {
    fontSize: 10,
    color: "rgba(255,255,255,0.25)",
  },

  emptyContainer: {
    width: "100%",
    minHeight: 130,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.12)",
    marginBottom: 12,
  },

  emptyIconDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#EF4444",
  },

  emptyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  emptySubtitle: {
    marginTop: 5,
    fontSize: 11,
    color: "rgba(255,255,255,0.36)",
    textAlign: "center",
  },

  viewer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    backgroundColor: "#000000",
  },

  videoArea: {
    flex: 1,
    backgroundColor: "#000000",
  },

  videoImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.38)",
  },

  videoUnavailable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  videoFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  liveFallbackIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.12)",
    marginBottom: 18,
  },

  liveFallbackDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EF4444",
  },

  videoFallbackText: {
    maxWidth: 320,
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
  },

  videoFallbackSubtext: {
    marginTop: 8,
    fontSize: 11,
    color: "rgba(255,255,255,0.42)",
    textAlign: "center",
  },

  viewerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },

  viewerTopBar: {
    paddingTop: 18,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  viewerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },

  viewerLiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(239,68,68,0.82)",
  },

  viewerLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },

  viewerLiveText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  hostAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },

  hostName: {
    maxWidth: 130,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.82)",
  },

  viewerCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  viewerCountText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.55)",
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.48)",
  },

  viewerRightActions: {
    position: "absolute",
    right: 16,
    bottom: 120,
    alignItems: "center",
    gap: 12,
  },

  actionButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.40)",
  },

  actionCount: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  chatPreview: {
    position: "absolute",
    left: 16,
    right: 70,
    bottom: 76,
    gap: 5,
  },

  chatMessage: {
    alignSelf: "flex-start",
    maxWidth: "94%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.38)",
  },

  chatUser: {
    maxWidth: 90,
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.65)",
  },

  chatText: {
    flexShrink: 1,
    fontSize: 10,
    lineHeight: 14,
    color: "rgba(255,255,255,0.82)",
  },

  bottomBar: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  controlButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.46)",
  },

  messageComposer: {
    flex: 1,
    minHeight: 42,
    maxHeight: 90,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 12,
    paddingRight: 5,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.48)",
  },

  messageInput: {
    flex: 1,
    minHeight: 32,
    maxHeight: 76,
    paddingVertical: 5,
    paddingRight: 8,
    color: "#FFFFFF",
    fontSize: 11.5,
    lineHeight: 17,
  },

  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C3AED",
  },

  sendButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  pressed: {
    opacity: 0.7,
  },
});
