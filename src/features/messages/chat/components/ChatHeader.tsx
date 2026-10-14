// src/features/messages/chat/components/ChatHeader.tsx

import { useCallback, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
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

/* ============================================================================
 * CONSTANTS
 * ========================================================================== */

const HEADER_HEIGHT = 72;
const BUTTON_SIZE = 40;
const AVATAR_SIZE = 44;
const DOT_SIZE = 12;

const HEADER_BACKGROUND = "#0B0A12";
const BORDER_COLOR = "rgba(255,255,255,0.10)";

/**
 * NOTE : aucun `Pressable style={({ pressed }) => ...}` dans ce fichier.
 * Dans cette app, les styles retournés par une fonction `style` semblent
 * ignorés (avatar carré, marges perdues, boutons sans fond). On utilise donc
 * TouchableOpacity avec des styles statiques.
 */

/* ============================================================================
 * SMALL BUILDING BLOCKS
 * ========================================================================== */

function HeaderButton({
  onPress,
  label,
  children,
  tint,
  badge,
  expanded,
}: {
  onPress: () => void;
  label: string;
  children: ReactNode;
  tint?: "green" | "violet" | "open";
  badge?: boolean;
  expanded?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={expanded === undefined ? undefined : { expanded }}
      style={[
        styles.iconButton,
        tint === "green" && styles.tintGreen,
        tint === "violet" && styles.tintViolet,
        tint === "open" && styles.tintOpen,
      ]}
    >
      {children}
      {badge ? (
        <View style={styles.incomingBadge} accessibilityLabel="Appel entrant" />
      ) : null}
    </TouchableOpacity>
  );
}

function MenuItem({
  label,
  icon,
  onPress,
  danger = false,
}: {
  label: string;
  icon: ReactNode;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      accessibilityRole="menuitem"
      accessibilityLabel={label}
      style={styles.menuItem}
    >
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        {icon}
      </View>
      <Text
        style={[styles.menuItemText, danger && styles.menuItemTextDanger]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* ============================================================================
 * HEADER
 * ========================================================================== */

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
  const { width: windowWidth } = useWindowDimensions();

  const moreRef = useRef<View>(null);
  const [menuAnchor, setMenuAnchor] = useState<{
    top: number;
    right: number;
  } | null>(null);

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

  /* --------------------------------------------------------------------------
   * MENU — rendu dans un Modal : sur Android, une vue qui dépasse des limites
   * de son parent ne reçoit pas les touchers. Le Modal évite ce problème.
   * ------------------------------------------------------------------------ */

  const openMenu = useCallback(() => {
    const node = moreRef.current;
    if (!node) return;

    node.measureInWindow((x, y, w, h) => {
      setMenuAnchor({
        top: y + h + 6,
        right: Math.max(8, windowWidth - (x + w)),
      });
    });
  }, [windowWidth]);

  const closeMenu = useCallback(() => setMenuAnchor(null), []);

  const runAndClose = useCallback(
    (action?: () => void) => () => {
      setMenuAnchor(null);
      action?.();
    },
    [],
  );

  const identityLabel = onInfo
    ? `Informations de ${normalizedTitle}`
    : normalizedTitle;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        {/* BACK */}
        {onBack ? (
          <HeaderButton onPress={onBack} label="Retour">
            <ArrowLeft
              size={22}
              strokeWidth={2}
              color="rgba(255,255,255,0.86)"
            />
          </HeaderButton>
        ) : null}

        {/* IDENTITÉ : avatar + titre (zone extensible) */}
        <TouchableOpacity
          onPress={onInfo}
          disabled={!onInfo}
          activeOpacity={0.7}
          accessibilityRole={onInfo ? "button" : undefined}
          accessibilityLabel={identityLabel}
          style={[styles.identity, !onBack && styles.identityNoBack]}
        >
          <View style={styles.avatarBox}>
            <View style={styles.avatarClip}>
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
            </View>

            {!isGroup ? (
              <View style={styles.onlineDot} accessibilityLabel="En ligne" />
            ) : (
              <View style={styles.groupDot} accessibilityLabel="Groupe">
                <View style={styles.groupDotInner} />
              </View>
            )}
          </View>

          <View style={styles.titleBlock}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                {normalizedTitle}
              </Text>

              {callActive ? (
                <View style={styles.callBadge}>
                  <View style={styles.callBadgeDot} />
                  <Text style={styles.callBadgeText}>En appel</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.subtitleRow}>
              <Text
                style={styles.subtitle}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {memberLabel}
              </Text>

              {!isGroup ? (
                <>
                  <View style={styles.subtitleDot} />
                  <Text style={styles.subtitleAvailable} numberOfLines={1}>
                    Disponible
                  </Text>
                </>
              ) : null}
            </View>
          </View>
        </TouchableOpacity>

        {/* ACTIONS : groupe centré verticalement, boutons identiques */}
        <View style={styles.actions}>
          {onCall ? (
            <HeaderButton
              onPress={onCall}
              label={isCallActive ? "Revenir à l'appel audio" : "Appel audio"}
              tint={isCallActive ? "green" : undefined}
              badge={hasIncomingCall && !isCallActive}
            >
              <PhoneCall
                size={20}
                strokeWidth={2}
                color={isCallActive ? "#6ee7b7" : "rgba(255,255,255,0.78)"}
              />
            </HeaderButton>
          ) : null}

          {onVideoCall ? (
            <HeaderButton
              onPress={onVideoCall}
              label={
                isVideoCallActive ? "Revenir à l'appel vidéo" : "Appel vidéo"
              }
              tint={isVideoCallActive ? "violet" : undefined}
              badge={hasIncomingCall && !isVideoCallActive}
            >
              <Video
                size={20}
                strokeWidth={2}
                color={isVideoCallActive ? "#c4b5fd" : "rgba(255,255,255,0.78)"}
              />
            </HeaderButton>
          ) : null}

          {onInfo ? (
            <HeaderButton onPress={onInfo} label="Informations">
              <Info size={20} strokeWidth={2} color="rgba(255,255,255,0.70)" />
            </HeaderButton>
          ) : null}

          <View ref={moreRef} collapsable={false}>
            <HeaderButton
              onPress={openMenu}
              label="Plus d'options"
              tint={menuAnchor ? "open" : undefined}
              expanded={menuAnchor !== null}
            >
              <MoreVertical
                size={21}
                strokeWidth={2}
                color={menuAnchor ? "#ffffff" : "rgba(255,255,255,0.70)"}
              />
            </HeaderButton>
          </View>
        </View>
      </View>

      {callActive ? (
        <View pointerEvents="none" style={styles.callIndicator} />
      ) : null}

      {/* MENU */}
      <Modal
        visible={menuAnchor !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeMenu}
      >
        <View style={styles.menuRoot}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={closeMenu}
            accessibilityLabel="Fermer le menu"
            style={styles.menuBackdrop}
          />

          {menuAnchor ? (
            <View
              accessibilityRole="menu"
              style={[
                styles.menu,
                { top: menuAnchor.top, right: menuAnchor.right },
              ]}
            >
              <View style={styles.menuHeader}>
                <Text style={styles.menuHeaderText}>Conversation</Text>
              </View>

              {onSearch ? (
                <MenuItem
                  label="Rechercher"
                  onPress={runAndClose(onSearch)}
                  icon={<Search size={16} color="rgba(255,255,255,0.72)" />}
                />
              ) : null}

              {onMute ? (
                <MenuItem
                  label="Silencieux"
                  onPress={runAndClose(onMute)}
                  icon={<Text style={styles.menuEmoji}>🔕</Text>}
                />
              ) : null}

              {onInfo ? (
                <MenuItem
                  label="Informations"
                  onPress={runAndClose(onInfo)}
                  icon={<Info size={16} color="rgba(255,255,255,0.72)" />}
                />
              ) : null}

              <View style={styles.menuDivider} />

              <View style={styles.securedRow}>
                <View style={styles.securedIcon}>
                  <Shield size={15} color="#6ee7b7" />
                </View>

                <View style={styles.securedText}>
                  <Text style={styles.securedTitle} numberOfLines={1}>
                    Conversation sécurisée
                  </Text>
                  <Text style={styles.securedSubtitle}>DébrouillePro</Text>
                </View>

                <Check size={15} color="#34d399" />
              </View>

              {onClearChat ? (
                <>
                  <View style={styles.menuDivider} />
                  <MenuItem
                    label="Effacer la conversation"
                    onPress={runAndClose(onClearChat)}
                    danger
                    icon={<X size={16} color="#fca5a5" />}
                  />
                </>
              ) : null}
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  root: {
    width: "100%",
    height: HEADER_HEIGHT,
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: HEADER_BACKGROUND,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER_COLOR,
  },

  header: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 4,
    paddingRight: 6,
  },

  /* ---- boutons ---- */

  iconButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },

  tintGreen: { backgroundColor: "rgba(16,185,129,0.14)" },
  tintViolet: { backgroundColor: "rgba(139,92,246,0.15)" },
  tintOpen: { backgroundColor: "rgba(255,255,255,0.10)" },

  incomingBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#ef4444",
    borderWidth: 1.5,
    borderColor: HEADER_BACKGROUND,
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginLeft: 4,
  },

  /* ---- identité ---- */

  identity: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 2,
  },

  identityNoBack: { marginLeft: 8 },

  avatarBox: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    marginRight: 12,
  },

  avatarClip: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: "hidden",
    backgroundColor: "#181229",
  },

  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },

  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#31235f",
  },

  avatarInitials: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
    color: "#ffffff",
  },

  onlineDot: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: "#34d399",
    borderWidth: 2,
    borderColor: HEADER_BACKGROUND,
  },

  groupDot: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8b5cf6",
    borderWidth: 2,
    borderColor: HEADER_BACKGROUND,
  },

  groupDotInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ffffff",
  },

  titleBlock: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  title: {
    flexShrink: 1,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
    color: "#ffffff",
  },

  callBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
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
    letterSpacing: 0.4,
  },

  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 1,
  },

  subtitle: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(255,255,255,0.45)",
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
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(52,211,153,0.80)",
  },

  callIndicator: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    backgroundColor: "#8b5cf6",
  },

  /* ---- menu ---- */

  menuRoot: { flex: 1 },

  menuBackdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },

  menu: {
    position: "absolute",
    width: 232,
    padding: 6,
    borderRadius: 17,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.11)",
    backgroundColor: "#111116",
    elevation: 20,
    shadowColor: "#000000",
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },

  menuHeader: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 9,
  },

  menuHeaderText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.35)",
  },

  menuItem: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    borderRadius: 12,
  },

  menuIcon: {
    width: 32,
    height: 32,
    marginRight: 11,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  menuIconDanger: { backgroundColor: "rgba(239,68,68,0.10)" },

  menuEmoji: { fontSize: 14 },

  menuItemText: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    lineHeight: 18,
    color: "rgba(255,255,255,0.78)",
  },

  menuItemTextDanger: { color: "#fca5a5" },

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
    marginRight: 11,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(52,211,153,0.10)",
  },

  securedText: { flex: 1, minWidth: 0 },

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
