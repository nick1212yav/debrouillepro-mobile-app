// convex/messages/index.ts

// Barrel sécurisé : chaque module conserve son propre namespace.
// Cela évite les collisions entre fonctions portant le même nom
// (get, list, markAsRead, leave, count, etc.).

export * as conversations from "./conversations";
export * as messages from "./messages";
export * as members from "./members";
export * as reactions from "./reactions";
export * as replies from "./replies";
export * as forwarding from "./forwarding";
export * as pins from "./pins";
export * as attachments from "./attachments";
export * as voice from "./voice";
export * as presence from "./presence";
export * as readReceipts from "./readReceipts";
export * as typing from "./typing";
export * as calls from "./calls";
export * as search from "./search";
export * as polls from "./polls";
export * as locations from "./locations";
export * as notifications from "./notifications";
export * as moderation from "./moderation";
export * as ai from "./ai";
