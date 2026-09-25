import {
  View,
  Pressable,
  Text,
  Image,
  StyleSheet,
} from "react-native";
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
import { useState } from "react";

import type { Id } from "@/convex/_generated/dataModel";

// src/features/messages/chat/components/ChatHeader.tsx

interface ChatHeaderProps {
  conversationId: Id<"conversations">;
  title: string;
  avatar?: string | null;
  isGroup: boolean;
  memberCount?: number;
  onBack?: () => void;
  onInfo?: () => void;
  onCall?: () => void;
  onVideoCall?: () => void;
  isCallActive?: boolean;
  isVideoCallActive?: boolean;
  hasIncomingCall?: boolean;
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

  void conversationId;

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

  const closeMenu = () => setMenuOpen(false);
  const handleSearch = () => { closeMenu(); onSearch?.(); };
  const handleMute = () => { closeMenu(); onMute?.(); };
  const handleClearChat = () => { closeMenu(); onClearChat?.(); };
  const handleInfo = () => { closeMenu(); onInfo?.(); };

  return (
    <View style={styles.container}>
      {callActive && (
        <View style={styles.callIndicator}>
          <View style={styles.callIndicatorLine} />
        </View>
      )}

      {onBack && (
        <Pressable
          onPress={onBack}
          style={styles.iconButton}
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={20} strokeWidth={2} color="rgba(255,255,255,0.55)" />
        </Pressable>
      )}

      <Pressable
        onPress={onInfo}
        disabled={!onInfo}
        accessibilityLabel={
          onInfo ? "Informations de la conversation" : undefined
        }
        style={styles.avatarWrapper}
      >
        {avatar ? (
          <Image
            style={styles.avatarImage}
            source={{ uri: avatar }}
            accessibilityLabel={title}
          />
        ) : (
          <Text style={styles.avatarInitials}>{initials}</Text>
        )}

        {!isGroup && (
          <View style={styles.onlineDot} accessibilityLabel="En ligne" />
        )}
        {isGroup && (
          <View style={styles.groupDot}>
            <View style={styles.groupDotInner} />
          </View>
        )}
      </Pressable>

      <Pressable
        onPress={onInfo}
        disabled={!onInfo}
        style={styles.titleWrapper}
        accessibilityLabel={
          onInfo ? "Informations de la conversation" : undefined
        }
      >
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {callActive && (
            <View style={styles.callBadge}>
              <View style={styles.callBadgeDot} />
              <Text style={styles.callBadgeText}>En appel</Text>
            </View>
          )}
        </View>
        <View style={styles.subtitleRow}>
          <Text style={styles.subtitle} numberOfLines={1}>
            {memberLabel}
          </Text>
          {!isGroup && (
            <>
              <View style={styles.subtitleDot} />
              <Text style={styles.subtitleAvailable}>Disponible</Text>
            </>
          )}
        </View>
      </Pressable>

      <View style={styles.actions}>
        {onCall && (
          <Pressable
            onPress={onCall}
            style={[
              styles.iconButton,
              isCallActive && styles.iconButtonActiveGreen,
            ]}
            accessibilityLabel={
              isCallActive ? "Revenir à l'appel audio" : "Appel audio"
            }
          >
            {isCallActive ? (
              <PhoneCall size={19} strokeWidth={2} color="#6ee7b7" />
            ) : (
              <Phone size={19} strokeWidth={2} color="rgba(255,255,255,0.6)" />
            )}
            {hasIncomingCall && !isCallActive && (
              <View style={styles.incomingBadge}>
                <View style={styles.incomingBadgeInner} />
              </View>
            )}
          </Pressable>
        )}

        {onVideoCall && (
          <Pressable
            onPress={onVideoCall}
            style={[
              styles.iconButton,
              isVideoCallActive && styles.iconButtonActiveViolet,
            ]}
            accessibilityLabel={
              isVideoCallActive ? "Revenir à l'appel vidéo" : "Appel vidéo"
            }
          >
            <Video
              size={20}
              strokeWidth={2}
              color={isVideoCallActive ? "#c4b5fd" : "rgba(255,255,255,0.6)"}
            />
            {hasIncomingCall && !isVideoCallActive && (
              <View style={styles.incomingBadge}>
                <View style={styles.incomingBadgeInner} />
              </View>
            )}
          </Pressable>
        )}

        {onInfo && (
          <Pressable
            onPress={onInfo}
            style={styles.iconButton}
            accessibilityLabel="Informations"
          >
            <Info size={19} strokeWidth={2} color="rgba(255,255,255,0.55)" />
          </Pressable>
        )}

        <View style={styles.menuWrapper}>
          <Pressable
            onPress={() => setMenuOpen((value) => !value)}
            style={[
              styles.iconButton,
              menuOpen && styles.iconButtonMenuOpen,
            ]}
            accessibilityLabel="Plus d'options"
            accessibilityState={{ expanded: menuOpen }}
          >
            <MoreVertical
              size={19}
              strokeWidth={2}
              color={menuOpen ? "#ffffff" : "rgba(255,255,255,0.45)"}
            />
          </Pressable>

          {menuOpen && (
            <>
              <Pressable style={styles.backdrop} onPress={closeMenu} />
              <View style={styles.menu} accessibilityRole="menu">
                <View style={styles.menuHeader}>
                  <Text style={styles.menuHeaderText}>Conversation</Text>
                </View>

                {onSearch && (
                  <Pressable onPress={handleSearch} style={styles.menuItem}>
                    <View style={styles.menuIcon}>
                      <Text style={styles.menuIconText}>🔎</Text>
                    </View>
                    <Text style={styles.menuItemText}>Rechercher</Text>
                  </Pressable>
                )}

                {onMute && (
                  <Pressable onPress={handleMute} style={styles.menuItem}>
                    <View style={styles.menuIcon}>
                      <Text style={styles.menuIconText}>🔕</Text>
                    </View>
                    <Text style={styles.menuItemText}>Silencieux</Text>
                  </Pressable>
                )}

                {onInfo && (
                  <Pressable onPress={handleInfo} style={styles.menuItem}>
                    <View style={styles.menuIcon}>
                      <Info size={15} color="rgba(255,255,255,0.7)" />
                    </View>
                    <Text style={styles.menuItemText}>Informations</Text>
                  </Pressable>
                )}

                <View style={styles.menuDivider} />

                <View style={styles.securedRow}>
                  <View style={styles.securedIcon}>
                    <Shield size={15} color="#6ee7b7" />
                  </View>
                  <View style={styles.securedText}>
                    <Text style={styles.securedTitle}>
                      Conversation sécurisée
                    </Text>
                    <Text style={styles.securedSubtitle}>DébrouillePro</Text>
                  </View>
                  <Check size={14} color="#34d399" />
                </View>

                {onClearChat && (
                  <>
                    <View style={styles.menuDivider} />
                    <Pressable
                      onPress={handleClearChat}
                      style={styles.menuItem}
                    >
                      <View style={styles.menuIconDanger}>
                        <X size={15} color="#fca5a5" />
                      </View>
                      <Text style={styles.menuItemTextDanger}>
                        Effacer la conversation
                      </Text>
                    </Pressable>
                  </>
                )}
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.85)",
  },
  callIndicator: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    overflow: "hidden",
  },
  callIndicatorLine: {
    height: "100%",
    width: "100%",
    backgroundColor: "#a78bfa",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonActiveGreen: {
    backgroundColor: "rgba(16,185,129,0.15)",
  },
  iconButtonActiveViolet: {
    backgroundColor: "rgba(139,92,246,0.15)",
  },
  iconButtonMenuOpen: {
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  avatarWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "rgba(139,92,246,0.20)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitials: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
  },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#34d399",
    borderWidth: 2,
    borderColor: "#000000",
  },
  groupDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#a78bfa",
    borderWidth: 2,
    borderColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  groupDotInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ffffff",
  },
  titleWrapper: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    flexShrink: 1,
  },
  callBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.20)",
    backgroundColor: "rgba(52,211,153,0.10)",
  },
  callBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34d399",
  },
  callBadgeText: {
    fontSize: 9,
    fontWeight: "600",
    color: "#6ee7b7",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
  },
  subtitleDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(52,211,153,0.8)",
  },
  subtitleAvailable: {
    fontSize: 11,
    color: "rgba(52,211,153,0.7)",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  incomingBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#ef4444",
    borderWidth: 2,
    borderColor: "#000000",
  },
  incomingBadgeInner: {
    width: "100%",
    height: "100%",
  },
  menuWrapper: {
    position: "relative",
  },
  backdrop: {
    position: "absolute",
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    zIndex: 40,
  },
  menu: {
    position: "absolute",
    top: 48,
    right: 0,
    width: 224,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(17,17,22,0.95)",
    padding: 6,
    zIndex: 50,
  },
  menuHeader: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  menuHeaderText: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.25)",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuIconText: {
    fontSize: 12,
  },
  menuIconDanger: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(239,68,68,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.70)",
  },
  menuItemTextDanger: {
    fontSize: 14,
    color: "rgba(252,165,165,0.8)",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    marginVertical: 6,
  },
  securedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  securedIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(52,211,153,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  securedText: {
    flex: 1,
    minWidth: 0,
  },
  securedTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.7)",
  },
  securedSubtitle: {
    marginTop: 2,
    fontSize: 10,
    color: "rgba(255,255,255,0.3)",
  },
});

export default ChatHeader;