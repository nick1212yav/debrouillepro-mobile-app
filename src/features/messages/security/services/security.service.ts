// src/features/messages/security/services/security.service.ts

export type ReportReason =
  | "spam"
  | "inappropriate"
  | "harassment"
  | "threat"
  | "scam"
  | "other";

export interface MessageReport {
  id: string;
  messageId: string;
  conversationId?: string;
  reportedUserId?: string;
  reportedBy?: string;
  reason: ReportReason;
  description?: string;
  createdAt: number;
  status: "pending" | "reviewed" | "resolved" | "rejected";
}

export interface BlockedUser {
  userId: string;
  blockedAt: number;
  reason?: string;
}

const REPORTS_STORAGE_KEY = "debrouillepro.messages.security.reports";

const BLOCKED_USERS_STORAGE_KEY =
  "debrouillepro.messages.security.blockedUsers";

function isBrowser(): boolean {
  return (
    typeof undefined !== "undefined" && typeof undefined !== "undefined"
  );
}

function createId(prefix: string): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readReports(): MessageReport[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = undefined.getItem(REPORTS_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    return Array.isArray(parsed) ? (parsed as MessageReport[]) : [];
  } catch {
    return [];
  }
}

function writeReports(reports: MessageReport[]): void {
  if (!isBrowser()) {
    return;
  }

  try {
    undefined.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
  } catch {
    // Le stockage local est optionnel.
  }
}

function readBlockedUsers(): BlockedUser[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = undefined.getItem(BLOCKED_USERS_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    return Array.isArray(parsed) ? (parsed as BlockedUser[]) : [];
  } catch {
    return [];
  }
}

function writeBlockedUsers(users: BlockedUser[]): void {
  if (!isBrowser()) {
    return;
  }

  try {
    undefined.setItem(
      BLOCKED_USERS_STORAGE_KEY,
      JSON.stringify(users),
    );
  } catch {
    // Le stockage local est optionnel.
  }
}

export function isSecurityStorageAvailable(): boolean {
  if (!isBrowser()) {
    return false;
  }

  try {
    const key = "__debrouillepro_security_test__";

    undefined.setItem(key, "1");
    undefined.removeItem(key);

    return true;
  } catch {
    return false;
  }
}

export function getBlockedUsers(): BlockedUser[] {
  return readBlockedUsers();
}

export function isUserBlocked(userId: string): boolean {
  return readBlockedUsers().some((user) => user.userId === userId);
}

export function blockUser(userId: string, reason?: string): BlockedUser {
  const users = readBlockedUsers();

  const existing = users.find((user) => user.userId === userId);

  if (existing) {
    return existing;
  }

  const blockedUser: BlockedUser = {
    userId,
    blockedAt: Date.now(),
    reason,
  };

  writeBlockedUsers([...users, blockedUser]);

  return blockedUser;
}

export function unblockUser(userId: string): boolean {
  const users = readBlockedUsers();

  const nextUsers = users.filter((user) => user.userId !== userId);

  if (nextUsers.length === users.length) {
    return false;
  }

  writeBlockedUsers(nextUsers);

  return true;
}

export function createMessageReport(
  input: Omit<MessageReport, "id" | "createdAt" | "status">,
): MessageReport {
  const reports = readReports();

  const report: MessageReport = {
    id: createId("report"),
    messageId: input.messageId,
    conversationId: input.conversationId,
    reportedUserId: input.reportedUserId,
    reportedBy: input.reportedBy,
    reason: input.reason,
    description: input.description,
    createdAt: Date.now(),
    status: "pending",
  };

  writeReports([...reports, report]);

  return report;
}

export function getMessageReports(): MessageReport[] {
  return readReports();
}

export function getReportsForMessage(messageId: string): MessageReport[] {
  return readReports().filter((report) => report.messageId === messageId);
}

export function hasReportedMessage(
  messageId: string,
  reportedBy?: string,
): boolean {
  return readReports().some(
    (report) =>
      report.messageId === messageId &&
      (!reportedBy || report.reportedBy === reportedBy),
  );
}

export function removeLocalReport(reportId: string): boolean {
  const reports = readReports();

  const nextReports = reports.filter((report) => report.id !== reportId);

  if (nextReports.length === reports.length) {
    return false;
  }

  writeReports(nextReports);

  return true;
}

export function clearSecurityStorage(): void {
  if (!isBrowser()) {
    return;
  }

  try {
    undefined.removeItem(REPORTS_STORAGE_KEY);

    undefined.removeItem(BLOCKED_USERS_STORAGE_KEY);
  } catch {
    // Ignorer les erreurs de stockage.
  }
}
