// src/features/messages/calls/components/OutgoingCall.tsx

import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { Call } from "../types/call.types";

interface OutgoingCallProps {
  call: Call;
  recipientName?: string;
  recipientAvatar?: string;
  onCancel: () => void;
}

export function OutgoingCall({
  call,
  recipientName = "Appel",
  recipientAvatar,
  onCancel,
}: OutgoingCallProps) {
  const isVideoCall = call.type === "video";

  const displayName = recipientName.trim() || "Appel";
  const initial = displayName.charAt(0).toUpperCase() || "?";

  return (
    <View
      style={styles.container}
      accessibilityViewIsModal
      accessibilityLabel={`Appel ${isVideoCall ? "vidéo" : "audio"} vers ${displayName}`}
    >
      <View style={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          {recipientAvatar ? (
            <Image
              source={{ uri: recipientAvatar }}
              style={styles.avatar}
              resizeMode="cover"
              accessibilityLabel={`Photo de ${displayName}`}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          )}

          <View style={styles.callTypeBadge}>
            <Text style={styles.callTypeIcon}>{isVideoCall ? "▣" : "☎"}</Text>
          </View>
        </View>

        {/* Nom */}
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={styles.recipientName}
        >
          {displayName}
        </Text>

        {/* Statut */}
        <View style={styles.statusRow}>
          <View style={styles.statusDot} />

          <Text style={styles.statusText}>
            Appel {isVideoCall ? "vidéo" : "audio"} en cours...
          </Text>
        </View>

        {/* Animation visuelle */}
        <View style={styles.ringingIndicator}>
          <View style={styles.ringingRingOuter}>
            <View style={styles.ringingRingInner}>
              <Text style={styles.ringingIcon}>{isVideoCall ? "▣" : "☎"}</Text>
            </View>
          </View>
        </View>

        {/* Annuler */}
        <Pressable
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Annuler l'appel"
          accessibilityHint="Met fin à l'appel sortant"
          style={({ pressed }) => [
            styles.cancelButton,
            pressed && styles.cancelButtonPressed,
          ]}
        >
          <Text style={styles.cancelIcon}>×</Text>

          <Text style={styles.cancelText}>Annuler</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    minHeight: 360,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 24,
    paddingVertical: 32,

    overflow: "hidden",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 24,

    backgroundColor: "#09090D",
  },

  content: {
    width: "100%",

    alignItems: "center",
    justifyContent: "center",
  },

  avatarWrapper: {
    position: "relative",

    width: 104,
    height: 104,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 52,

    backgroundColor: "#1C1925",
  },

  avatar: {
    width: 104,
    height: 104,

    borderRadius: 52,
  },

  avatarFallback: {
    width: 104,
    height: 104,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 52,

    backgroundColor: "#282331",
  },

  avatarInitial: {
    fontSize: 34,
    lineHeight: 42,

    fontWeight: "700",

    color: "rgba(255,255,255,0.82)",
  },

  callTypeBadge: {
    position: "absolute",

    right: 2,
    bottom: 2,

    width: 30,
    height: 30,

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 2,
    borderColor: "#09090D",
    borderRadius: 15,

    backgroundColor: "#4F46E5",
  },

  callTypeIcon: {
    fontSize: 13,
    lineHeight: 16,

    color: "#FFFFFF",
  },

  recipientName: {
    width: "100%",

    marginTop: 22,

    fontSize: 22,
    lineHeight: 28,

    fontWeight: "700",

    textAlign: "center",

    color: "#FFFFFF",
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: 7,
  },

  statusDot: {
    width: 7,
    height: 7,

    marginRight: 7,

    borderRadius: 4,

    backgroundColor: "#818CF8",
  },

  statusText: {
    fontSize: 13,
    lineHeight: 18,

    color: "rgba(255,255,255,0.48)",
  },

  ringingIndicator: {
    width: 112,
    height: 112,

    alignItems: "center",
    justifyContent: "center",

    marginTop: 24,
  },

  ringingRingOuter: {
    width: 88,
    height: 88,

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.22)",
    borderRadius: 44,
  },

  ringingRingInner: {
    width: 62,
    height: 62,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 31,

    backgroundColor: "rgba(99,102,241,0.16)",
  },

  ringingIcon: {
    fontSize: 22,
    lineHeight: 28,

    color: "#A5B4FC",
  },

  cancelButton: {
    minWidth: 132,
    minHeight: 46,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    marginTop: 24,

    paddingHorizontal: 20,

    borderRadius: 23,

    backgroundColor: "#DC2626",
  },

  cancelButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },

  cancelIcon: {
    marginRight: 7,

    fontSize: 22,
    lineHeight: 24,

    fontWeight: "500",

    color: "#FFFFFF",
  },

  cancelText: {
    fontSize: 14,
    lineHeight: 18,

    fontWeight: "700",

    color: "#FFFFFF",
  },
});

export default OutgoingCall;
