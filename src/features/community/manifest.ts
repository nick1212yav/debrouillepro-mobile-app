// src/features/community/manifest.ts
import type { ModuleManifest } from "@/core/sdk/types";
import { fields } from "./fields";

export const communityManifest: ModuleManifest = {
  info: {
    id: "community",
    label: "Community",
    icon: "👥",
    color: "#8B5CF6",
    gradient: "from-purple-500 to-indigo-600",
    badge: "Social",
    description: "Rejoignez, partagez et connectez-vous avec votre communauté",
    version: "1.0.0",
  },
  subtypes: [
    { value: "text", label: "Texte", icon: "📝" },
    { value: "question", label: "Question", icon: "❓" },
    { value: "poll", label: "Sondage", icon: "📊" },
    { value: "image", label: "Image", icon: "🖼️" },
    { value: "video", label: "Vidéo", icon: "🎬" },
    { value: "live", label: "Live", icon: "🔴" },
    { value: "story", label: "Story", icon: "📸" },
    { value: "event", label: "Événement", icon: "📅" },
  ],
  fields: fields as any, // contournement temporaire
  actions: [], // doit être un tableau vide (pas un objet)
  metrics: [
    { key: "views", label: "Vues", icon: "Eye" },
    { key: "likes", label: "J'aime", icon: "Heart" },
    { key: "comments", label: "Commentaires", icon: "MessageCircle" },
    { key: "shares", label: "Partages", icon: "Share2" },
    { key: "bookmarks", label: "Enregistrements", icon: "Bookmark" },
  ],
  queries: {
    list: "community.listFeed",
    get: "community.getPost",
    search: "community.search",
    getGroups: "community.listGroups",
    getEvents: "community.listEvents",
    getStories: "community.listStories",
  },
  mutations: {
    create: "community.createPost",
    update: "community.updatePost",
    delete: "community.deletePost",
    like: "community.likePost",
    comment: "community.addComment",
    reply: "community.addReply",
    vote: "community.votePoll",
    joinGroup: "community.joinGroup",
    attendEvent: "community.attendEvent",
  },
  capabilities: ({ post, user }) => ({
    call: true,
    chat: true,
    share: true,
    save: true,
    whatsapp: true,
    email: true,
    payment: false,
    booking: false,
  }),
  card: {
    hero: "description",
    sections: ["author", "images", "meta"],
    metrics: ["likes", "comments", "shares"],
  },
  permissions: {
    view: ["*"],
    create: ["user"],
    // like: ["user"], // retiré car non accepté par ModulePermissions
    delete: ["user", "admin"],
  },
  search: {
    filters: [
      {
        key: "type",
        label: "Type",
        type: "select",
        options: [
          { label: "Tous", value: "all" },
          { label: "Texte", value: "text" },
          { label: "Question", value: "question" },
          { label: "Sondage", value: "poll" },
          { label: "Image", value: "image" },
          { label: "Vidéo", value: "video" },
          { label: "Événement", value: "event" },
        ],
      },
      {
        key: "tags",
        label: "Tags",
        type: "select",
        options: [
          { label: "#Communauté", value: "#Communauté" },
          { label: "#Emploi", value: "#Emploi" },
          { label: "#Agriculture", value: "#Agriculture" },
          { label: "#Santé", value: "#Santé" },
          { label: "#Tech", value: "#Tech" },
          { label: "#Immo", value: "#Immo" },
          { label: "#Éducation", value: "#Éducation" },
          { label: "#Sondage", value: "#Sondage" },
        ],
      },
    ],
    sorts: [
      { key: "recent", label: "Plus récents" },
      { key: "popular", label: "Plus populaires" },
      { key: "likes", label: "Plus aimés" },
      { key: "comments", label: "Plus commentés" },
    ],
    autocomplete: true,
    aiRanking: true,
  },
  dependencies: { required: ["auth"] },
  compatibility: { sdk: "1.0.0" },
  defaults: ({ country = "Congo", language = "fr" }) => ({
    country,
    language,
  }),
  featureFlags: {
    premium: false,
    live: true,
    stories: true,
    events: true,
    groups: true,
  },
  lifecycle: {},
  adapter: {
    toModel: (data) => data,
    fromModel: (data) => data,
  },
  plugins: ["analytics", "ai", "notifications"],
};
