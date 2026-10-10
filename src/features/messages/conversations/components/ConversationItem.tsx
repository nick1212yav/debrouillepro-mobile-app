// src/features/messages/conversations/components/ConversationItem.tsx

import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { ConversationPreview } from "../services/conversations.service";

interface ConversationItemProps {
  conversation: ConversationPreview;
  active?: boolean;
  onClick?: () => void;
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ConversationItem({
  conversation,
  active = false,
  onClick,
}: ConversationItemProps) {
  const title = conversation.title?.trim() || "Conversation";
  const initial = title.charAt(0).toUpperCase() || "?";

  const unreadCount = Math.max(0, conversation.unreadCount ?? 0);

  const lastMessageText =
    conversation.lastMessageText?.trim() || "Aucun message";

  const formattedTime = formatDate(conversation.updatedAt);

  return (
    <Pressable
      onPress={onClick}
      disabled={!onClick}
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir ${title}`}
      accessibilityState={{
        selected: active,
        disabled: !onClick,
      }}
      style={({ pressed }) => [
        styles.container,
        active && styles.containerActive,
        pressed && onClick && styles.containerPressed,
      ]}
    >
      {/* ═══════════════════════════════════════════
          LIGNE PRINCIPALE — horizontale stricte
          ═══════════════════════════════════════════ */}

      <View style={styles.row}>
        {/* ─────────────────────────────────────────
            AVATAR
        ───────────────────────────────────────── */}

        <View
          style={styles.avatarWrapper}
          accessibilityLabel={`Avatar de ${title}`}
        >
          {conversation.avatar ? (
            <Image
              source={{ uri: conversation.avatar }}
              style={styles.avatarImage}
              resizeMode="cover"
              accessibilityLabel={`Photo de ${title}`}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          )}

          {conversation.isGroup ? (
            <View
              style={styles.groupBadge}
              accessibilityLabel="Conversation de groupe"
            >
              <Text style={styles.groupBadgeText}>👥</Text>
            </View>
          ) : null}
        </View>

        {/* ─────────────────────────────────────────
            INFORMATIONS
        ───────────────────────────────────────── */}

        <View style={styles.content}>
          {/* Nom + heure */}

          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
              {title}
            </Text>

            {formattedTime ? (
              <Text style={styles.time} numberOfLines={1} ellipsizeMode="tail">
                {formattedTime}
              </Text>
            ) : null}
          </View>

          {/* Dernier message + badge non-lus */}

          <View style={styles.previewRow}>
            <Text style={styles.preview} numberOfLines={1} ellipsizeMode="tail">
              {lastMessageText}
            </Text>

            {unreadCount > 0 ? (
              <View
                style={styles.unreadBadge}
                accessibilityLabel={`${unreadCount} message${
                  unreadCount > 1 ? "s" : ""
                } non lu${unreadCount > 1 ? "s" : ""}`}
              >
                <Text style={styles.unreadText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {/* ═══════════════════════════════════════════
          SÉPARATEUR VISIBLE (preuve que ce fichier tourne)
          ═══════════════════════════════════════════ */}

      <View style={styles.separator} />
    </Pressable>
  );
}

const AVATAR_SIZE = 54;

const styles = StyleSheet.create({
  /* ───────────────────────────────────────────
     CONTAINER EXTÉRIEUR
     ─────────────────────────────────────────── */

  container: {
    width: "100%",

    flexDirection: "column",
    alignItems: "stretch",

    backgroundColor: "transparent",
  },

  containerActive: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  containerPressed: {
    opacity: 0.72,
  },

  /* ───────────────────────────────────────────
     LIGNE HORIZONTALE — imposition stricte
     ─────────────────────────────────────────── */

  row: {
    width: "100%",

    minHeight: 72,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  /* ───────────────────────────────────────────
     AVATAR
     ─────────────────────────────────────────── */

  avatarWrapper: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,

    minWidth: AVATAR_SIZE,
    maxWidth: AVATAR_SIZE,

    minHeight: AVATAR_SIZE,
    maxHeight: AVATAR_SIZE,

    flexGrow: 0,
    flexShrink: 0,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: AVATAR_SIZE / 2,
    overflow: "hidden",

    backgroundColor: "#25212F",
  },

  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,

    borderRadius: AVATAR_SIZE / 2,
  },

  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,

    alignItems: "center",
    justifyContent: "center",
  },

  avatarInitial: {
    fontSize: 20,
    lineHeight: 24,

    fontWeight: "700",

    color: "#FFFFFF",

    textAlign: "center",
  },

  groupBadge: {
    position: "absolute",

    right: -1,
    bottom: -1,

    width: 18,
    height: 18,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 9,

    borderWidth: 2,
    borderColor: "#050509",

    backgroundColor: "#8B5CF6",
  },

  groupBadgeText: {
    fontSize: 9,
    lineHeight: 11,

    textAlign: "center",
  },

  /* ───────────────────────────────────────────
     CONTENU (nom + preview)
     ─────────────────────────────────────────── */

  content: {
    flex: 1,
    minWidth: 0,

    marginLeft: 14,

    justifyContent: "center",
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

    fontSize: 15,
    lineHeight: 20,

    fontWeight: "700",

    color: "#FFFFFF",
  },

  time: {
    flexGrow: 0,
    flexShrink: 0,

    marginLeft: 10,

    maxWidth: 58,

    fontSize: 11,
    lineHeight: 15,

    fontWeight: "500",

    color: "rgba(255,255,255,0.42)",

    textAlign: "right",
  },

  previewRow: {
    width: "100%",
    minWidth: 0,

    marginTop: 4,

    flexDirection: "row",
    alignItems: "center",
  },

  preview: {
    flex: 1,
    minWidth: 0,

    fontSize: 13,
    lineHeight: 18,

    fontWeight: "400",

    color: "rgba(255,255,255,0.50)",
  },

  unreadBadge: {
    minWidth: 22,
    height: 22,

    flexGrow: 0,
    flexShrink: 0,

    marginLeft: 8,
    paddingHorizontal: 6,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 11,

    backgroundColor: "#2563EB",
  },

  unreadText: {
    fontSize: 10,
    lineHeight: 13,

    fontWeight: "800",

    color: "#FFFFFF",

    textAlign: "center",
  },

  /* ───────────────────────────────────────────
     SÉPARATEUR
     ─────────────────────────────────────────── */

  separator: {
    width: "100%",
    height: 1,

    backgroundColor: "rgba(255,255,255,0.05)",
  },
});

export default ConversationItem;
