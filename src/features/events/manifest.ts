// src/features/events/manifest.ts
import type { ModuleManifest } from "@/core/sdk/types/manifest.types";

export const manifest = {
  name: "Événements",
  description: "Gestion des événements, billetterie et participation",
  version: "1.0.0",
  type: "feature",
  dependencies: {
    required: ["core", "community"],
  },
  permissions: {},
  routes: {
    list: "/events",
    detail: "/events/:id",
  },
  actions: [
    {
      id: "events:create",
      label: "Créer",
      icon: "Plus",
      execute: async () => console.log("Create event"),
    },
    {
      id: "events:edit",
      label: "Modifier",
      icon: "Pencil",
      execute: async () => console.log("Edit event"),
    },
    {
      id: "events:delete",
      label: "Supprimer",
      icon: "Trash2",
      execute: async () => console.log("Delete event"),
    },
    {
      id: "events:rsvp",
      label: "S'inscrire",
      icon: "Ticket",
      execute: async () => console.log("RSVP event"),
    },
    {
      id: "events:tickets",
      label: "Billets",
      icon: "QrCode",
      execute: async () => console.log("Tickets event"),
    },
    {
      id: "events:comment",
      label: "Commenter",
      icon: "MessageCircle",
      execute: async () => console.log("Comment event"),
    },
    {
      id: "events:share",
      label: "Partager",
      icon: "Share2",
      execute: async () => console.log("Share event"),
    },
    {
      id: "events:favorite",
      label: "Favori",
      icon: "Heart",
      execute: async () => console.log("Favorite event"),
    },
    {
      id: "events:like",
      label: "Like",
      icon: "ThumbsUp",
      execute: async () => console.log("Like event"),
    },
  ],
  ui: {
    icon: "Calendar",
    color: "#EC4899",
    navigation: {
      label: "Événements",
      icon: "Calendar",
      route: "/events",
      position: 4,
    },
  },
} as any; // ✅ Temporaire : on cast en any pour contourner le typage du SDK
