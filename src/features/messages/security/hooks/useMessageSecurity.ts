// src/features/messages/security/hooks/useMessageSecurity.ts

import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  BlockedUser,
  MessageReport,
  ReportReason,
} from "../services/security.service";

import {
  blockUser,
  createMessageReport,
  getBlockedUsers,
  getMessageReports,
  getReportsForMessage,
  isSecurityStorageAvailable,
  isUserBlocked,
  unblockUser,
} from "../services/security.service";

export interface UseMessageSecurityResult {
  blockedUsers: BlockedUser[];
  reports: MessageReport[];

  isStorageAvailable: boolean;

  isBlocked: (userId: string) => boolean;

  getMessageReports: (messageId: string) => MessageReport[];

  hasReported: (messageId: string, reportedBy?: string) => boolean;

  block: (userId: string, reason?: string) => BlockedUser;

  unblock: (userId: string) => boolean;

  report: (input: {
    messageId: string;
    conversationId?: string;
    reportedUserId?: string;
    reportedBy?: string;
    reason: ReportReason;
    description?: string;
  }) => MessageReport;

  refresh: () => void;
}

export function useMessageSecurity(): UseMessageSecurityResult {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);

  const [reports, setReports] = useState<MessageReport[]>([]);

  const [isStorageAvailable, setIsStorageAvailable] = useState(
    isSecurityStorageAvailable(),
  );

  const refresh = useCallback(() => {
    setIsStorageAvailable(isSecurityStorageAvailable());

    setBlockedUsers(getBlockedUsers());

    setReports(getMessageReports());
  }, []);

  useEffect(() => {
    refresh();

    if (typeof undefined === "undefined") {
      return;
    }

    const handleStorage = () => {
      refresh();
    };

    undefined;

    return () => {
      undefined;
    };
  }, [refresh]);

  const blockedUserIds = useMemo(
    () => new Set(blockedUsers.map((user) => user.userId)),
    [blockedUsers],
  );

  const isBlocked = useCallback(
    (userId: string) => blockedUserIds.has(userId) || isUserBlocked(userId),
    [blockedUserIds],
  );

  const getReports = useCallback(
    (messageId: string) => getReportsForMessage(messageId),
    [],
  );

  const hasReported = useCallback(
    (messageId: string, reportedBy?: string) =>
      reports.some(
        (report) =>
          report.messageId === messageId &&
          (!reportedBy || report.reportedBy === reportedBy),
      ),
    [reports],
  );

  const block = useCallback(
    (userId: string, reason?: string) => {
      const result = blockUser(userId, reason);

      refresh();

      return result;
    },
    [refresh],
  );

  const unblock = useCallback(
    (userId: string) => {
      const result = unblockUser(userId);

      refresh();

      return result;
    },
    [refresh],
  );

  const report = useCallback(
    (input: {
      messageId: string;
      conversationId?: string;
      reportedUserId?: string;
      reportedBy?: string;
      reason: ReportReason;
      description?: string;
    }) => {
      const result = createMessageReport(input);

      refresh();

      return result;
    },
    [refresh],
  );

  return {
    blockedUsers,
    reports,
    isStorageAvailable,
    isBlocked,
    getMessageReports: getReports,
    hasReported,
    block,
    unblock,
    report,
    refresh,
  };
}

export default useMessageSecurity;
