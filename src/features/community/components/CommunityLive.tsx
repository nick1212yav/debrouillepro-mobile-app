import { View, Text, Pressable, Image, TextInput } from "react-native";
import { useState, useEffect, useRef } from "react";
import {
  Play,
  X,
  Users,
  Heart,
  MessageCircle,
  Send,
  Mic,
  MicOff,
  Video,
  VideoOff,
} from "lucide-react-native";

interface LiveStream {
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

interface Props {
  streams: LiveStream[];
  onJoin?: (streamId: string) => void;
  onLeave?: () => void;
}

export function CommunityLive({ streams, onJoin, onLeave }: Props) {
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [isViewer, setIsViewer] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    { id: string; user: string; message: string; time: number }[]
  >([]);
  const [newMessage, setNewMessage] = useState("");
  const [viewerCount, setViewerCount] = useState(0);

  const liveStreams = streams?.filter((s) => s.isLive) || [];

  if (liveStreams.length === 0) {
    return (
      <View className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
        <Text className="text-4xl mb-2 block">🔴</Text>
        <Text className="text-white/50 text-sm">Aucun live en cours</Text>
      </View>
    );
  }

  const handleJoinStream = (stream: LiveStream) => {
    setSelectedStream(stream);
    setIsViewer(true);
    setViewerCount(stream.viewerCount || 0);
    onJoin?.(stream.id);

    // Simuler des messages de chat
    setChatMessages([
      {
        id: "1",
        user: "Démo",
        message: "👋 Salut tout le monde !",
        time: Date.now() - 60000,
      },
      {
        id: "2",
        user: "Marie",
        message: "🔥 Super live !",
        time: Date.now() - 30000,
      },
      {
        id: "3",
        user: "Jean",
        message: "Quand est la prochaine session ?",
        time: Date.now() - 10000,
      },
    ]);
  };

  const handleLeaveStream = () => {
    setIsViewer(false);
    setSelectedStream(null);
    onLeave?.();
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        user: "Moi",
        message: newMessage.trim(),
        time: Date.now(),
      },
    ]);
    setNewMessage("");
  };

  return (
    <View className="space-y-3">
      <Text className="text-sm font-medium text-white/50">Live en cours</Text>

      {/* Liste des streams */}
      <View className="gap-2">
        {liveStreams.slice(0, 4).map((stream) => (
          <Pressable
            key={stream.id}
            onPress={() => handleJoinStream(stream)}
            className="relative rounded-xl overflow-hidden aspect-video group bg-black/30"
          >
            {stream.thumbnail ? (
              <Image
               
               
                className="w-full h-full object-cover"
               source={{ uri: stream.thumbnail }} accessibilityLabel={stream.title}/>
            ) : (
              <View className="w-full h-full flex items-center justify-center bg-red-500/10">
                <Text className="text-3xl">🔴</Text>
              </View>
            )}
            <View className="absolute inset-0 bg-black/30" />
            <View className="absolute top-2 left-2">
              <Text className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-red-500/80 text-white">
                <Text className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                LIVE
              </Text>
            </View>
            <View className="absolute bottom-2 left-2 right-2">
              <Text className="text-white text-sm font-medium truncate">
                {stream.title}
              </Text>
              <View className="flex items-center gap-2 text-white/60 text-xs">
                <Users size={10} />
                <Text>{stream.viewerCount}</Text>
                <Text className="text-white/30">·</Text>
                <Text>{stream.hostName}</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>

      {/* Lecteur Live (modale) */}
      <>
        {isViewer && selectedStream && (
          <View
            className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          >
            {/* Vidéo */}
            <View className="relative flex-1 bg-black">
              {selectedStream.streamUrl ? (
                <View
                  src={selectedStream.streamUrl}
                  className="w-full h-full object-contain"
                  autoPlay
                  playsInline
                />
              ) : (
                <View className="w-full h-full flex items-center justify-center">
                  <Text className="text-6xl">🔴</Text>
                  <Text className="absolute bottom-1/4 text-white/40 text-sm">
                    {selectedStream.hostName} est en direct
                  </Text>
                </View>
              )}

              {/* Overlay controls */}
              <View className="absolute inset-0">
                <View
                  className="absolute inset-0"
                  style={{  }}
                />
              </View>

              {/* Header */}
              <View className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                <View className="flex items-center gap-3">
                  <Text className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-red-500/80 text-white">
                    <Text className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    LIVE
                  </Text>
                  <Text className="text-white/60 text-sm">
                    {selectedStream.hostName}
                  </Text>
                  <Text className="flex items-center gap-1 text-white/40 text-xs">
                    <Users size={12} />
                    {viewerCount}
                  </Text>
                </View>
                <Pressable
                  onPress={handleLeaveStream}
                  className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
                >
                  <X size={18} className="text-white" />
                </Pressable>
              </View>

              {/* Actions */}
              <View className="absolute right-4 bottom-24 flex flex-col gap-3 z-10">
                <Pressable className="flex flex-col items-center gap-0.5 group">
                  <View className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center">
                    <Heart size={20} className="text-white" />
                  </View>
                  <Text className="text-white text-xs">
                    {selectedStream.likeCount}
                  </Text>
                </Pressable>
                <Pressable className="flex flex-col items-center gap-0.5 group">
                  <View className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center">
                    <MessageCircle size={20} className="text-white" />
                  </View>
                </Pressable>
              </View>

              {/* Contrôles du viewer */}
              <View className="absolute bottom-4 left-4 right-4 flex items-center gap-3 z-10">
                <Pressable
                  onPress={() => setIsMuted(!isMuted)}
                  className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center"
                >
                  {isMuted ? (
                    <MicOff size={16} className="text-white" />
                  ) : (
                    <Mic size={16} className="text-white" />
                  )}
                </Pressable>
                <Pressable
                  onPress={() => setIsVideoOff(!isVideoOff)}
                  className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center"
                >
                  {isVideoOff ? (
                    <VideoOff size={16} className="text-white" />
                  ) : (
                    <Video size={16} className="text-white" />
                  )}
                </Pressable>
                <View className="flex-1 flex items-center gap-2 bg-black/40 rounded-full px-3 py-1.5">
                  <TextInput
                    value={newMessage}
                    onChangeText={(text) => setNewMessage(text)}
                    placeholder="Message..."
                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Pressable
                    onPress={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="text-white/60 disabled:opacity-30"
                  >
                    <Send size={16} />
                  </Pressable>
                </View>
              </View>

              {/* Chat overlay (optionnel) */}
              <View className="absolute bottom-20 left-4 max-h-32 overflow-y-auto space-y-1 z-10">
                {chatMessages.slice(-5).map((msg) => (
                  <View
                    key={msg.id}
                    className="flex items-start gap-1.5 bg-black/30 rounded-lg px-2 py-1"
                  >
                    <Text className="text-white/60 text-xs font-medium">
                      {msg.user}
                    </Text>
                    <Text className="text-white/80 text-xs">{msg.message}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </>
    </View>
  );
}
