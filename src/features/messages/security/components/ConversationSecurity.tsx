// src/features/messages/security/components/ConversationSecurity.tsx

import { useState } from "react";
import { Pressable, View, Text, StyleSheet } from "react-native";

import { BlockUserDialog } from "./BlockUserDialog";
import { ReportMessageDialog } from "./ReportMessageDialog";

import { useMessageSecurity } from "../hooks/useMessageSecurity";

export interface ConversationSecurityProps {
  userId: string;
  userName?: string;
  conversationId?: string;
  messageId?: string;
  currentUserId?: string;
  onBlocked?: (userId: string) => void;
  onUnblocked?: (userId: string) => void;
  onReported?: (messageId: string) => void;
}

export function ConversationSecurity({
  userId,
  userName,
  conversationId,
  messageId,
  currentUserId,
  onBlocked,
  onUnblocked,
  onReported,
}: ConversationSecurityProps) {
  const { isBlocked, block, unblock, report, hasReported } =
    useMessageSecurity();

  const [blockDialogOpen, setBlockDialogOpen] = useState(false);

  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const blocked = isBlocked(userId);

  const alreadyReported = messageId
    ? hasReported(messageId, currentUserId)
    : false;

  const handleBlockConfirm = (targetUserId: string, reason?: string) => {
    if (blocked) {
      unblock(targetUserId);
      onUnblocked?.(targetUserId);
    } else {
      block(targetUserId, reason);
      onBlocked?.(targetUserId);
    }

    setBlockDialogOpen(false);
  };

  const handleReportConfirm = (input: Parameters<typeof report>[0]) => {
    report(input);
    setReportDialogOpen(false);

    if (messageId) {
      onReported?.(messageId);
    }
  };

  return (
    <>
      <View
        style={styles.container}
        accessibilityRole="toolbar"
        accessibilityLabel="Sécurité de la conversation"
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            blocked
              ? `Débloquer ${userName ?? "cet utilisateur"}`
              : `Bloquer ${userName ?? "cet utilisateur"}`
          }
          onPress={() => setBlockDialogOpen(true)}
          style={({ pressed }) => [
            styles.button,
            blocked ? styles.unblockButton : styles.blockButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              blocked ? styles.unblockButtonText : styles.blockButtonText,
            ]}
          >
            {blocked ? "Débloquer" : "Bloquer"}
          </Text>
        </Pressable>

        {messageId && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              alreadyReported ? "Message déjà signalé" : "Signaler le message"
            }
            accessibilityState={{
              disabled: alreadyReported,
            }}
            onPress={() => setReportDialogOpen(true)}
            disabled={alreadyReported}
            style={({ pressed }) => [
              styles.button,
              styles.reportButton,
              alreadyReported && styles.buttonDisabled,
              pressed && !alreadyReported && styles.buttonPressed,
            ]}
          >
            <Text
              style={[
                styles.buttonText,
                styles.reportButtonText,
                alreadyReported && styles.disabledButtonText,
              ]}
            >
              {alreadyReported ? "Message signalé" : "Signaler"}
            </Text>
          </Pressable>
        )}
      </View>

      <BlockUserDialog
        open={blockDialogOpen}
        userId={userId}
        userName={userName}
        isBlocked={blocked}
        onClose={() => setBlockDialogOpen(false)}
        onConfirm={handleBlockConfirm}
      />

      {messageId && (
        <ReportMessageDialog
          open={reportDialogOpen}
          messageId={messageId}
          conversationId={conversationId}
          reportedUserId={userId}
          reportedBy={currentUserId}
          onClose={() => setReportDialogOpen(false)}
          onConfirm={handleReportConfirm}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },

  button: {
    minHeight: 38,
    paddingVertical: 8,
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
  },

  blockButton: {
    borderColor: "rgba(248,113,113,0.28)",
    backgroundColor: "rgba(127,29,29,0.20)",
  },

  unblockButton: {
    borderColor: "rgba(96,165,250,0.28)",
    backgroundColor: "rgba(30,64,175,0.18)",
  },

  reportButton: {
    borderColor: "rgba(251,191,36,0.28)",
    backgroundColor: "rgba(120,53,15,0.18)",
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },

  buttonText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },

  blockButtonText: {
    color: "#FCA5A5",
  },

  unblockButtonText: {
    color: "#93C5FD",
  },

  reportButtonText: {
    color: "#FCD34D",
  },

  disabledButtonText: {
    color: "#94A3B8",
  },
});

export default ConversationSecurity;
