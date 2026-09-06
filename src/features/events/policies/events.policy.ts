// src/features/events/policies/events.policy.ts
// Politique simplifiée – sera enrichie avec le SDK plus tard

export interface PolicyContext {
  user?: { id: string; role: string };
  resource?: { authorId: string };
}

export const eventsPolicy = {
  id: "events-policy",
  name: "Politique des événements",
  description: "Règles de gestion des événements et de la billetterie",
  rules: [
    {
      id: "events-create",
      description: "Création d'événement",
      effect: "allow" as const,
      condition: (ctx: PolicyContext) =>
        ctx.user?.role === "organizer" || ctx.user?.role === "admin",
    },
    {
      id: "events-update",
      description: "Modification d'événement",
      effect: "allow" as const,
      condition: (ctx: PolicyContext) =>
        ctx.user?.id === ctx.resource?.authorId || ctx.user?.role === "admin",
    },
    {
      id: "events-delete",
      description: "Suppression d'événement",
      effect: "allow" as const,
      condition: (ctx: PolicyContext) =>
        ctx.user?.id === ctx.resource?.authorId || ctx.user?.role === "admin",
    },
    {
      id: "events-rsvp",
      description: "Participation à un événement",
      effect: "allow" as const,
      condition: (ctx: PolicyContext) =>
        ctx.user?.id !== ctx.resource?.authorId,
    },
    {
      id: "events-tickets",
      description: "Achat de billets",
      effect: "allow" as const,
      condition: (ctx: PolicyContext) =>
        ctx.user?.id !== ctx.resource?.authorId,
    },
    {
      id: "events-comment",
      description: "Commenter un événement",
      effect: "allow" as const,
      condition: () => true,
    },
  ],
};
