import { View, Text, Pressable, Image } from "react-native";
import {
  ArrowLeft,
  Check,
  Info,
  MoreVertical,
  Phone,
  PhoneCall,
  Shield,
  Video,
  X,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";

import type { Id } from "@/convex/_generated/dataModel";

interface ChatHeaderProps {
  conversationId: Id<"conversations">;

  title: string;
  avatar?: string | null;

  isGroup: boolean;
  memberCount?: number;

  onBack?: () => void;
  onInfo?: () => void;

  /**
   * Déclenche l'appel audio.
   * La logique réelle reste dans le module calls.
   */
  onCall?: () => void;

  /**
   * Déclenche l'appel vidéo.
   * La logique réelle reste dans le module calls.
   */
  onVideoCall?: () => void;

  /**
   * États optionnels fournis par le futur module calls.
   */
  isCallActive?: boolean;
  isVideoCallActive?: boolean;
  hasIncomingCall?: boolean;

  /**
   * Actions du menu secondaire.
   */
  onSearch?: () => void;
  onMute?: () => void;
  onClearChat?: () => void;
}

export function ChatHeader({
  conversationId,
  title,
  avatar,
  isGroup,
  memberCount,

  onBack,
  onInfo,
  onCall,
  onVideoCall,

  isCallActive = false,
  isVideoCallActive = false,
  hasIncomingCall = false,

  onSearch,
  onMute,
  onClearChat,
}: ChatHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef<View | null>(null);

  /*
   * conversationId est volontairement conservé dans les props :
   * le header appartient à une conversation précise et pourra être
   * utilisé par les actions avancées sans modifier son API plus tard.
   */
  void conversationId;

  // --------------------------------------------------------------------------
  // FERMETURE DU MENU
  // --------------------------------------------------------------------------

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (
        target instanceof Node &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    undefined("pointerdown", handlePointerDown);
    undefined("keydown", handleKeyDown);

    return () => {
      undefined("pointerdown", handlePointerDown);
      undefined("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  // --------------------------------------------------------------------------
  // IDENTITÉ
  // --------------------------------------------------------------------------

  const initials =
    title
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "?";

  const memberLabel = isGroup
    ? `${memberCount ?? 0} membre${(memberCount ?? 0) !== 1 ? "s" : ""}`
    : "Conversation";

  const callActive = isCallActive || isVideoCallActive;

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleSearch = () => {
    closeMenu();
    onSearch?.();
  };

  const handleMute = () => {
    closeMenu();
    onMute?.();
  };

  const handleClearChat = () => {
    closeMenu();
    onClearChat?.();
  };

  return (
    <View
      className={[
        "relative z-30 flex shrink-0 items-center gap-2",
        "border-b border-white/[0.08]",
        "bg-black/85 px-3 py-2.5",
        "backdrop-blur-2xl",
      ].join(" ")}
    >
      {/* ================================================================== */}
      {/* INDICATEUR D'APPEL ACTIF                                           */}
      {/* ================================================================== */}

      {callActive && (
        <View className="absolute inset-x-0 bottom-0 h-px overflow-hidden">
          <View className="h-full w-full animate-pulse bg-gradient-to-r from-transparent via-violet-400 to-transparent" />
        </View>
      )}

      {/* ================================================================== */}
      {/* RETOUR                                                             */}
      {/* ================================================================== */}

      {onBack && (
        <Pressable
         
          onPress={onBack}
          className={[
            "group relative flex h-10 w-10 shrink-0 items-center justify-center",
            "rounded-full",
            "text-white/55",
            "transition-all duration-200",
            "hover:bg-white/[0.08] hover:text-white",
            "active:scale-90",
            "focus:outline-none focus:ring-2 focus:ring-violet-500/50",
          ].join(" ")}
          accessibilityLabel="Retour"
         
        >
          <ArrowLeft
            size={20}
            strokeWidth={2}
            className=""
          />
        </Pressable>
      )}

      {/* ================================================================== */}
      {/* AVATAR                                                             */}
      {/* ================================================================== */}

      <Pressable
       
        onPress={onInfo}
        disabled={!onInfo}
        accessibilityLabel={onInfo ? "Informations de la conversation" : undefined}
        className={[
          "relative flex h-11 w-11 shrink-0 items-center justify-center",
          "overflow-hidden rounded-full",
          "bg-gradient-to-br from-violet-500/30 via-purple-500/20 to-fuchsia-500/20",
          "ring-1 ring-white/10",
          "shadow-[0_0_25px_rgba(139,92,246,0.08)]",
          "transition-all duration-300",
          onInfo
            ? "cursor-pointer hover:scale-[1.04] hover:ring-violet-400/30"
            : "cursor-default",
        ].join(" ")}
      >
        {avatar ? (
          <Image
           
           
            className="h-full w-full object-cover"
           source={{ uri: avatar }} accessibilityLabel={title}/>
        ) : (
          <Text className="text-sm font-bold tracking-wide text-white/85">
            {initials}
          </Text>
        )}

        {/* Statut en ligne */}
        {!isGroup && (
          <Text
            className={[
              "absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full",
              "bg-emerald-400",
              "ring-2 ring-black",
              "shadow-[0_0_10px_rgba(52,211,153,0.65)]",
            ].join(" ")}
            accessibilityLabel="En ligne"
          />
        )}

        {isGroup && (
          <Text className="absolute bottom-0.5 right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-violet-400 ring-2 ring-black">
            <Text className="h-1 w-1 rounded-full bg-white" />
          </Text>
        )}
      </Pressable>

      {/* ================================================================== */}
      {/* INFORMATIONS                                                       */}
      {/* ================================================================== */}

      <Pressable
       
        onPress={onInfo}
        disabled={!onInfo}
        className={[
          "min-w-0 flex-1 rounded-xl px-2 py-1.5 text-left",
          "transition-colors duration-200",
          onInfo ? "cursor-pointer hover:bg-white/[0.045]" : "cursor-default",
        ].join(" ")}
        accessibilityLabel={onInfo ? "Informations de la conversation" : undefined}
      >
        <View className="flex min-w-0 items-center gap-2">
          <Text className="truncate text-[14px] font-semibold tracking-[-0.01em] text-white">
            {title}
          </Text>

          {callActive && (
            <Text className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-300">
              <Text className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              En appel
            </Text>
          )}
        </View>

        <View className="mt-0.5 flex items-center gap-1.5">
          <Text className="truncate text-[11px] text-white/35">
            {memberLabel}
          </Text>

          {!isGroup && (
            <>
              <Text className="h-1 w-1 rounded-full bg-emerald-400/80" />
              <Text className="text-[11px] text-emerald-400/70">
                Disponible
              </Text>
            </>
          )}
        </View>
      </Pressable>

      {/* ================================================================== */}
      {/* ACTIONS                                                            */}
      {/* ================================================================== */}

      <View className="flex shrink-0 items-center gap-0.5">
        {/* ---------------------------------------------------------------- */}
        {/* APPEL AUDIO                                                      */}
        {/* ---------------------------------------------------------------- */}

        {onCall && (
          <Pressable
           
            onPress={onCall}
            className={[
              "group relative flex h-10 w-10 items-center justify-center",
              "rounded-full",
              "transition-all duration-200",
              "active:scale-90",
              "focus:outline-none focus:ring-2 focus:ring-violet-500/50",

              isCallActive
                ? "bg-emerald-500/15 text-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.12)]"
                : "text-white/60 hover:bg-white/[0.08] hover:text-white",
            ].join(" ")}
            accessibilityLabel={
              isCallActive ? "Revenir à l'appel audio" : "Appel audio"
            }
           
          >
            {isCallActive ? (
              <PhoneCall size={19} strokeWidth={2} className="animate-pulse" />
            ) : (
              <Phone
                size={19}
                strokeWidth={2}
                className=""
              />
            )}

            {/* Badge appel entrant */}
            {hasIncomingCall && !isCallActive && (
              <Text className="absolute right-0.5 top-0.5 flex h-3 w-3">
                <Text className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
                <Text className="relative inline-flex h-3 w-3 rounded-full bg-red-500 ring-2 ring-black" />
              </Text>
            )}
          </Pressable>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* APPEL VIDÉO                                                      */}
        {/* ---------------------------------------------------------------- */}

        {onVideoCall && (
          <Pressable
           
            onPress={onVideoCall}
            className={[
              "group relative flex h-10 w-10 items-center justify-center",
              "rounded-full",
              "transition-all duration-200",
              "active:scale-90",
              "focus:outline-none focus:ring-2 focus:ring-violet-500/50",

              isVideoCallActive
                ? "bg-violet-500/15 text-violet-300 shadow-[0_0_18px_rgba(139,92,246,0.14)]"
                : "text-white/60 hover:bg-white/[0.08] hover:text-white",
            ].join(" ")}
            accessibilityLabel={
              isVideoCallActive ? "Revenir à l'appel vidéo" : "Appel vidéo"
            }
           
          >
            <Video
              size={20}
              strokeWidth={2}
              className={
                isVideoCallActive
                  ? "animate-pulse"
                  : "transition-transform duration-200 group-hover:scale-105"
              }
            />

            {hasIncomingCall && !isVideoCallActive && (
              <Text className="absolute right-0.5 top-0.5 flex h-3 w-3">
                <Text className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
                <Text className="relative inline-flex h-3 w-3 rounded-full bg-red-500 ring-2 ring-black" />
              </Text>
            )}
          </Pressable>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* INFO                                                              */}
        {/* ---------------------------------------------------------------- */}

        {onInfo && (
          <Pressable
           
            onPress={onInfo}
            className={[
              "group flex h-10 w-10 items-center justify-center",
              "rounded-full text-white/55",
              "transition-all duration-200",
              "hover:bg-white/[0.08] hover:text-white",
              "active:scale-90",
              "focus:outline-none focus:ring-2 focus:ring-violet-500/50",
            ].join(" ")}
            accessibilityLabel="Informations"
           
          >
            <Info
              size={19}
              strokeWidth={2}
              className=""
            />
          </Pressable>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* MENU                                                              */}
        {/* ---------------------------------------------------------------- */}

        <View ref={menuRef} className="relative">
          <Pressable
           
            onPress={() => setMenuOpen((value) => !value)}
            className={[
              "flex h-10 w-10 items-center justify-center",
              "rounded-full",
              "transition-all duration-200",
              "active:scale-90",
              "focus:outline-none focus:ring-2 focus:ring-violet-500/50",

              menuOpen
                ? "bg-white/[0.10] text-white"
                : "text-white/45 hover:bg-white/[0.08] hover:text-white",
            ].join(" ")}
            accessibilityLabel="Plus d'options"
           
            aria-haspopup="menu"
           
          >
            <MoreVertical size={19} strokeWidth={2} />
          </Pressable>

          {menuOpen && (
            <View
              accessibilityRole="menu"
              className={[
                "absolute right-0 top-[calc(100%+10px)] w-56",
                "overflow-hidden rounded-2xl",
                "border border-white/[0.10]",
                "bg-[#111116]/95",
                "p-1.5",
                "shadow-[0_20px_60px_rgba(0,0,0,0.55)]",
                "backdrop-blur-2xl",
              ].join(" ")}
            >
              <View className="px-3 pb-2 pt-2">
                <Text className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/25">
                  Conversation
                </Text>
              </View>

              {onSearch && (
                <Pressable
                 
                  accessibilityRole="menuitem"
                  onPress={handleSearch}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/70"
                >
                  <Text className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-xs">
                    🔎
                  </Text>
                  <Text>Rechercher</Text>
                </Pressable>
              )}

              {onMute && (
                <Pressable
                 
                  accessibilityRole="menuitem"
                  onPress={handleMute}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/70"
                >
                  <Text className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-xs">
                    🔕
                  </Text>
                  <Text>Silencieux</Text>
                </Pressable>
              )}

              {onInfo && (
                <Pressable
                 
                  accessibilityRole="menuitem"
                  onPress={() => {
                    closeMenu();
                    onInfo();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/70"
                >
                  <Text className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05]">
                    <Info size={15} />
                  </Text>
                  <Text>Informations</Text>
                </Pressable>
              )}

              <View className="my-1.5 h-px bg-white/[0.07]" />

              <View className="flex items-center gap-3 px-3 py-2">
                <Text className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300">
                  <Shield size={15} />
                </Text>

                <View className="min-w-0">
                  <Text className="text-xs font-medium text-white/70">
                    <Text>Conversation sécurisée</Text></Text>
                  <Text className="mt-0.5 text-[10px] text-white/30">
                    <Text>DébrouillePro</Text></Text>
                </View>

                <Check
                  size={14}
                  className="ml-auto shrink-0 text-emerald-400"
                />
              </View>

              {onClearChat && (
                <>
                  <View className="my-1.5 h-px bg-white/[0.07]" />

                  <Pressable
                    type="button"
                    accessibilityRole="menuitem"
                    onPress={handleClearChat}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-red-300/80"
                  >
                    <Text className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
                      <X size={15} />
                    </Text>
                    <Text><Text>Effacer la conversation</Text></Text>
                  </Pressable>
                </>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export default ChatHeader;
