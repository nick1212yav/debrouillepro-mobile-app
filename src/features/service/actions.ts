import type { ActionConfig } from "@/core/sdk/types";

export const serviceActions: ActionConfig[] = [
  {
    id: "view",
    label: "Voir le prestataire",
    icon: "Eye",
    execute: async (context) => {
      const ctx = context as any;
      const entity = ctx.data || ctx.provider || ctx.entity;
      const navigate = ctx.navigate;
      if (navigate && entity?._id) {
        navigate(`/service/${entity._id}`);
      } else {
        console.warn("Impossible de naviguer vers le prestataire");
      }
    },
  },
  {
    id: "book",
    label: "Réserver",
    icon: "Calendar",
    execute: async (context) => {
      const ctx = context as any;
      const providerId = ctx.providerId || ctx.entity?._id;
      if (!providerId) return;
      // Ouvre le sheet de réservation
      ctx.openSheet?.("book", { providerId });
    },
  },
  {
    id: "message",
    label: "Message",
    icon: "MessageCircle",
    execute: async (context) => {
      const ctx = context as any;
      const userId = ctx.userId || ctx.entity?.userId;
      if (userId) {
        ctx.navigate(`/messages/new?userId=${userId}`);
      }
    },
  },
];
