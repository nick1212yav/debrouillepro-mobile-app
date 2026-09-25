import { Pressable, View, type ViewStyle, type TextStyle, type ImageStyle } from "react-native";

// src/features/messages/security/components/ConversationSecurity.tsx

import React, { useState } from "react";

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
      <View style={containerStyle} accessibilityLabel="Sécurité de la conversation">
        <Pressable onPress={() => setBlockDialogOpen(true)} style={buttonStyle}>
          {blocked ? "Débloquer" : "Bloquer"}
        </Pressable>

        {messageId && (
          <Pressable onPress={() => setReportDialogOpen(true)} disabled={alreadyReported} style={{
              ...buttonStyle,
              ...(alreadyReported ? disabledButtonStyle : {}),
            }}>
            {alreadyReported ? "Message signalé" : "Signaler"}
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

const containerStyle: ViewStyle | TextStyle | ImageStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const buttonStyle: ViewStyle | TextStyle | ImageStyle = {
  border: "1px solid #d1d5db",
  background: "#fff",
  color: "#111827",
  borderRadius: 10,
  padding: "8px 12px",
  cursor: "pointer",
  font: "inherit",
};

const disabledButtonStyle: ViewStyle | TextStyle | ImageStyle = {
  cursor: "default",
  opacity: 0.6,
};

export default ConversationSecurity;
