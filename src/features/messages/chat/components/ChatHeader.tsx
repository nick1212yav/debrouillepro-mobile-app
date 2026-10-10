// src/features/messages/chat/components/ChatHeader.tsx

import {
  View,
  Pressable,
  Text,
  Image,
  StyleSheet,
  BackHandler,
  Platform,
} from "react-native";
import {
  ArrowLeft,
  Check,
  Info,
  MoreVertical,
  PhoneCall,
  Search,
  Shield,
  Video,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { Id } from "@/convex/_generated/dataModel";

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

  // Kept as part of the public component contract.
  void conversationId;

  const normalizedTitle = title.trim() || "Conversation";

  const initials = useMemo(() => {
    const parts = normalizedTitle.split(/\s+/).filter(Boolean).slice(0, 2);

    return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "?";
  }, [normalizedTitle]);

  const members = Math.max(memberCount ?? 0, 0);

  const memberLabel = isGroup
    ? `${members} membre${members !== 1 ? "s" : ""}`
    : "Conversation";

  const callActive = isCallActive || isVideoCallActive;

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const toggleMenu = useCallback(() => {
    setMenuOpen((current) => !current);
  }, []);

  const handleSearch = useCallback(() => {
    closeMenu();
    onSearch?.();
  }, [closeMenu, onSearch]);

  const handleMute = useCallback(() => {
    closeMenu();
    onMute?.();
  }, [closeMenu, onMute]);

  const handleClearChat = useCallback(() => {
    closeMenu();
    onClearChat?.();
  }, [closeMenu, onClearChat]);

  const handleInfo = useCallback(() => {
    closeMenu();
    onInfo?.();
  }, [closeMenu, onInfo]);

  useEffect(() => {
    if (!menuOpen || Platform.OS !== "android") {
      return;
    }

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        closeMenu();
        return true;
      },
    );

    return () => subscription.remove();
  }, [menuOpen, closeMenu]);

  return (
    <View style={styles.root}>
      {callActive && (
        <View pointerEvents="none" style={styles.callIndicator}>
          <View style={styles.callIndicatorLine} />
        </View>
      )}

      <View style={styles.header}>
        {/* BACK */}
        {onBack ? (
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.iconButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            hitSlop={6}
          >
            <ArrowLeft
              size={22}
              strokeWidth={2}
              color="rgba(255,255,255,0.82)"
            />
          </Pressable>
        ) : (
          <View style={styles.leadingSpacer} />
        )}

        {/* AVATAR */}
        <Pressable
          onPress={onInfo}
          disabled={!onInfo}
          style={({ pressed }) => [
            styles.avatarWrapper,
            pressed && onInfo && styles.avatarPressed,
          ]}
          accessibilityRole={onInfo ? "button" : undefined}
          accessibilityLabel={
            onInfo ? `Informations de ${normalizedTitle}` : normalizedTitle
          }
          hitSlop={4}
        >
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              style={styles.avatarImage}
              accessibilityLabel={normalizedTitle}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}

          {!isGroup && (
            <View style={styles.onlineDot} accessibilityLabel="En ligne" />
          )}

          {isGroup && (
            <View style={styles.groupDot} accessibilityLabel="Groupe">
              <View style={styles.groupDotInner} />
            </View>
          )}
        </Pressable>

        {/* TITLE / STATUS */}
        <Pressable
          onPress={onInfo}
          disabled={!onInfo}
          style={({ pressed }) => [
            styles.titleWrapper,
            pressed && onInfo && styles.titlePressed,
          ]}
          accessibilityRole={onInfo ? "button" : undefined}
          accessibilityLabel={
            onInfo ? `Informations de ${normalizedTitle}` : normalizedTitle
          }
        >
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
              {normalizedTitle}
            </Text>

            {callActive && (
              <View style={styles.callBadge}>
                <View style={styles.callBadgeDot} />

                <Text style={styles.callBadgeText}>En appel</Text>
              </View>
            )}
          </View>

          <View style={styles.subtitleRow}>
            <Text
              style={styles.subtitle}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
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

        {/* ACTIONS */}
        <View style={styles.actions}>
          {onCall && (
            <Pressable
              onPress={onCall}
              style={({ pressed }) => [
                styles.iconButton,
                isCallActive && styles.iconButtonActiveGreen,
                pressed && styles.iconButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                isCallActive ? "Revenir à l'appel audio" : "Appel audio"
              }
              hitSlop={4}
            >
              <PhoneCall
                size={20}
                strokeWidth={2}
                color={isCallActive ? "#6ee7b7" : "rgba(255,255,255,0.70)"}
              />

              {hasIncomingCall && !isCallActive && (
                <View
                  style={styles.incomingBadge}
                  accessibilityLabel="Appel entrant"
                />
              )}
            </Pressable>
          )}

          {onVideoCall && (
            <Pressable
              onPress={onVideoCall}
              style={({ pressed }) => [
                styles.iconButton,
                isVideoCallActive && styles.iconButtonActiveViolet,
                pressed && styles.iconButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                isVideoCallActive ? "Revenir à l'appel vidéo" : "Appel vidéo"
              }
              hitSlop={4}
            >
              <Video
                size={20}
                strokeWidth={2}
                color={isVideoCallActive ? "#c4b5fd" : "rgba(255,255,255,0.70)"}
              />

              {hasIncomingCall && !isVideoCallActive && (
                <View
                  style={styles.incomingBadge}
                  accessibilityLabel="Appel entrant"
                />
              )}
            </Pressable>
          )}

          {onInfo && (
            <Pressable
              onPress={onInfo}
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.iconButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Informations"
              hitSlop={4}
            >
              <Info size={20} strokeWidth={2} color="rgba(255,255,255,0.66)" />
            </Pressable>
          )}

          {/* MORE MENU */}
          <View style={styles.menuWrapper}>
            <Pressable
              onPress={toggleMenu}
              style={({ pressed }) => [
                styles.iconButton,
                menuOpen && styles.iconButtonMenuOpen,
                pressed && styles.iconButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Plus d'options"
              accessibilityState={{ expanded: menuOpen }}
              hitSlop={4}
            >
              <MoreVertical
                size={21}
                strokeWidth={2}
                color={menuOpen ? "#ffffff" : "rgba(255,255,255,0.56)"}
              />
            </Pressable>

            {menuOpen && (
              <>
                <Pressable
                  style={styles.menuDismiss}
                  onPress={closeMenu}
                  accessibilityLabel="Fermer le menu"
                />

                <View style={styles.menu} accessibilityRole="menu">
                  <View style={styles.menuHeader}>
                    <Text style={styles.menuHeaderText}>Conversation</Text>
                  </View>

                  {onSearch && (
                    <Pressable
                      onPress={handleSearch}
                      style={({ pressed }) => [
                        styles.menuItem,
                        pressed && styles.menuItemPressed,
                      ]}
                      accessibilityRole="menuitem"
                    >
                      <View style={styles.menuIcon}>
                        <Search size={16} color="rgba(255,255,255,0.72)" />
                      </View>

                      <Text style={styles.menuItemText}>Rechercher</Text>
                    </Pressable>
                  )}

                  {onMute && (
                    <Pressable
                      onPress={handleMute}
                      style={({ pressed }) => [
                        styles.menuItem,
                        pressed && styles.menuItemPressed,
                      ]}
                      accessibilityRole="menuitem"
                    >
                      <View style={styles.menuIcon}>
                        <Text style={styles.menuEmoji}>🔕</Text>
                      </View>

                      <Text style={styles.menuItemText}>Silencieux</Text>
                    </Pressable>
                  )}

                  {onInfo && (
                    <Pressable
                      onPress={handleInfo}
                      style={({ pressed }) => [
                        styles.menuItem,
                        pressed && styles.menuItemPressed,
                      ]}
                      accessibilityRole="menuitem"
                    >
                      <View style={styles.menuIcon}>
                        <Info size={16} color="rgba(255,255,255,0.72)" />
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

                    <Check size={15} color="#34d399" />
                  </View>

                  {onClearChat && (
                    <>
                      <View style={styles.menuDivider} />

                      <Pressable
                        onPress={handleClearChat}
                        style={({ pressed }) => [
                          styles.menuItem,
                          pressed && styles.menuItemPressed,
                        ]}
                        accessibilityRole="menuitem"
                      >
                        <View style={styles.menuIconDanger}>
                          <X size={16} color="#fca5a5" />
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
    </View>
  );
}

const styles = StyleSheet.create({
  /**
   * ============================================================
   * ROOT
   * ============================================================
   *
   * Important:
   * - hauteur déterministe
   * - aucun flex vertical
   * - aucun étirement par le parent
   */
  root: {
    position: "relative",
    width: "100%",
    height: 72,
    minHeight: 72,
    maxHeight: 72,
    flexGrow: 0,
    flexShrink: 0,
    alignSelf: "stretch",
    backgroundColor: "#050509",
    zIndex: 100,
    elevation: 8,
  },

  /**
   * ============================================================
   * HEADER
   * ============================================================
   */
  header: {
    width: "100%",
    height: 72,
    minHeight: 72,
    maxHeight: 72,

    flexDirection: "row",
    alignItems: "center",

    flexGrow: 0,
    flexShrink: 0,

    paddingHorizontal: 8,
    paddingVertical: 0,

    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.10)",

    backgroundColor: "#0B0A12",
  },

  /**
   * Keeps the left side deterministic when there is no back button.
   */
  leadingSpacer: {
    width: 40,
    height: 40,
    flexGrow: 0,
    flexShrink: 0,
  },

  /**
   * ============================================================
   * CALL INDICATOR
   * ============================================================
   *
   * Horizontal only. Never allowed to participate in layout.
   */
  callIndicator: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,

    width: "100%",
    height: 2,

    zIndex: 50,
  },

  callIndicatorLine: {
    width: "100%",
    height: 2,
    backgroundColor: "#8b5cf6",
  },

  /**
   * ============================================================
   * ICON BUTTON
   * ============================================================
   */
  iconButton: {
    width: 40,
    height: 40,
    minWidth: 40,
    minHeight: 40,
    maxWidth: 40,
    maxHeight: 40,

    flexGrow: 0,
    flexShrink: 0,

    borderRadius: 20,

    alignItems: "center",
    justifyContent: "center",
  },

  iconButtonPressed: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  iconButtonActiveGreen: {
    backgroundColor: "rgba(16,185,129,0.14)",
  },

  iconButtonActiveViolet: {
    backgroundColor: "rgba(139,92,246,0.15)",
  },

  iconButtonMenuOpen: {
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  /**
   * ============================================================
   * AVATAR
   * ============================================================
   */
  avatarWrapper: {
    position: "relative",

    width: 44,
    height: 44,
    minWidth: 44,
    minHeight: 44,
    maxWidth: 44,
    maxHeight: 44,

    flexGrow: 0,
    flexShrink: 0,
    alignSelf: "center",

    marginLeft: 2,

    borderRadius: 22,
    overflow: "hidden",

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#181229",
  },

  avatarPressed: {
    opacity: 0.82,
  },

  avatarImage: {
    width: 44,
    height: 44,
    minWidth: 44,
    minHeight: 44,
    maxWidth: 44,
    maxHeight: 44,

    flexGrow: 0,
    flexShrink: 0,

    borderRadius: 22,
  },

  avatarFallback: {
    width: 44,
    height: 44,
    minWidth: 44,
    minHeight: 44,
    maxWidth: 44,
    maxHeight: 44,

    flexGrow: 0,
    flexShrink: 0,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#31235f",
  },

  avatarInitials: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "700",
    color: "#ffffff",
  },

  onlineDot: {
    position: "absolute",

    right: 0,
    bottom: 0,

    width: 12,
    height: 12,

    minWidth: 12,
    minHeight: 12,
    maxWidth: 12,
    maxHeight: 12,

    borderRadius: 6,

    backgroundColor: "#34d399",

    borderWidth: 2,
    borderColor: "#0B0A12",
  },

  groupDot: {
    position: "absolute",

    right: 0,
    bottom: 0,

    width: 12,
    height: 12,

    minWidth: 12,
    minHeight: 12,
    maxWidth: 12,
    maxHeight: 12,

    borderRadius: 6,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#8b5cf6",

    borderWidth: 2,
    borderColor: "#0B0A12",
  },

  groupDotInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ffffff",
  },

  /**
   * ============================================================
   * TITLE AREA
   * ============================================================
   */
  titleWrapper: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,

    flexGrow: 1,
    flexShrink: 1,

    alignSelf: "stretch",
    justifyContent: "center",

    marginLeft: 8,
    marginRight: 2,

    paddingHorizontal: 4,
  },

  titlePressed: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
  },

  titleRow: {
    width: "100%",
    minWidth: 0,

    flexDirection: "row",
    alignItems: "center",
  },

  title: {
    flex: 1,
    minWidth: 0,

    flexGrow: 1,
    flexShrink: 1,

    fontSize: 17,
    lineHeight: 21,
    fontWeight: "700",

    color: "#ffffff",
  },

  callBadge: {
    flexGrow: 0,
    flexShrink: 0,

    flexDirection: "row",
    alignItems: "center",

    marginLeft: 7,

    paddingHorizontal: 7,
    paddingVertical: 3,

    borderRadius: 999,

    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.20)",

    backgroundColor: "rgba(52,211,153,0.10)",
  },

  callBadgeDot: {
    width: 6,
    height: 6,
    marginRight: 5,
    borderRadius: 3,
    backgroundColor: "#34d399",
  },

  callBadgeText: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: "700",

    color: "#6ee7b7",

    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  subtitleRow: {
    width: "100%",
    minWidth: 0,

    flexDirection: "row",
    alignItems: "center",

    marginTop: 2,
  },

  subtitle: {
    flexShrink: 1,

    fontSize: 11,
    lineHeight: 15,

    color: "rgba(255,255,255,0.40)",
  },

  subtitleDot: {
    width: 4,
    height: 4,

    marginHorizontal: 6,

    borderRadius: 2,

    backgroundColor: "rgba(52,211,153,0.80)",
  },

  subtitleAvailable: {
    flexShrink: 0,

    fontSize: 11,
    lineHeight: 15,

    color: "rgba(52,211,153,0.76)",
  },

  /**
   * ============================================================
   * ACTIONS
   * ============================================================
   */
  actions: {
    flexGrow: 0,
    flexShrink: 0,

    flexDirection: "row",
    alignItems: "center",

    marginLeft: 2,
  },

  incomingBadge: {
    position: "absolute",

    top: 5,
    right: 5,

    width: 9,
    height: 9,

    minWidth: 9,
    minHeight: 9,
    maxWidth: 9,
    maxHeight: 9,

    borderRadius: 5,

    backgroundColor: "#ef4444",

    borderWidth: 1.5,
    borderColor: "#0B0A12",
  },

  /**
   * ============================================================
   * MENU
   * ============================================================
   */
  menuWrapper: {
    position: "relative",

    width: 40,
    height: 40,

    minWidth: 40,
    minHeight: 40,
    maxWidth: 40,
    maxHeight: 40,

    flexGrow: 0,
    flexShrink: 0,

    zIndex: 200,
  },

  menuDismiss: {
    position: "absolute",

    top: -1000,
    right: -1000,

    width: 2000,
    height: 2000,

    zIndex: 0,
  },

  menu: {
    position: "absolute",

    top: 46,
    right: 0,

    width: 232,

    padding: 6,

    borderRadius: 17,
    overflow: "hidden",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.11)",

    backgroundColor: "#111116",

    zIndex: 10,
    elevation: 20,

    shadowColor: "#000000",
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
  },

  menuHeader: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 9,
  },

  menuHeaderText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "700",

    color: "rgba(255,255,255,0.28)",

    textTransform: "uppercase",
    letterSpacing: 1.2,
  },

  menuItem: {
    minHeight: 48,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 10,

    borderRadius: 12,
  },

  menuItemPressed: {
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  menuIcon: {
    width: 32,
    height: 32,

    minWidth: 32,
    minHeight: 32,
    maxWidth: 32,
    maxHeight: 32,

    marginRight: 11,

    borderRadius: 9,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "rgba(255,255,255,0.055)",
  },

  menuEmoji: {
    fontSize: 14,
  },

  menuItemText: {
    flex: 1,
    minWidth: 0,

    fontSize: 14,
    lineHeight: 18,

    color: "rgba(255,255,255,0.74)",
  },

  menuIconDanger: {
    width: 32,
    height: 32,

    minWidth: 32,
    minHeight: 32,
    maxWidth: 32,
    maxHeight: 32,

    marginRight: 11,

    borderRadius: 9,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "rgba(239,68,68,0.10)",
  },

  menuItemTextDanger: {
    flex: 1,
    minWidth: 0,

    fontSize: 14,
    lineHeight: 18,

    color: "#fca5a5",
  },

  menuDivider: {
    height: StyleSheet.hairlineWidth,

    marginVertical: 6,

    backgroundColor: "rgba(255,255,255,0.07)",
  },

  securedRow: {
    minHeight: 50,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  securedIcon: {
    width: 32,
    height: 32,

    minWidth: 32,
    minHeight: 32,
    maxWidth: 32,
    maxHeight: 32,

    marginRight: 11,

    borderRadius: 9,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "rgba(52,211,153,0.10)",
  },

  securedText: {
    flex: 1,
    minWidth: 0,
  },

  securedTitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",

    color: "rgba(255,255,255,0.72)",
  },

  securedSubtitle: {
    marginTop: 2,

    fontSize: 10,
    lineHeight: 13,

    color: "rgba(255,255,255,0.30)",
  },
});

export default ChatHeader;
